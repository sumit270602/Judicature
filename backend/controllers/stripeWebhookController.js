
const Order = require('../models/Order');
const Payout = require('../models/Payout');
const User = require('../models/User');
const PaymentRequest = require('../models/PaymentRequest');
const { initializeStripe, stripeConfig } = require('../config/stripe');

class StripeWebhookController {
  constructor() {
    this.stripe = null;
    this.initStripe();
  }

  async initStripe() {
    try {
      this.stripe = await initializeStripe();
    } catch (error) {
      console.error('Failed to initialize Stripe in WebhookController:', error);
    }
  }

  // Main webhook handler
  async handleWebhook(req, res) {
    try {
      if (!this.stripe) {
        console.error('Stripe not initialized');
        return res.status(500).send('Stripe not initialized');
      }

      const sig = req.headers['stripe-signature'];
      let event;

      try {
        event = this.stripe.webhooks.constructEvent(
          req.body,
          sig,
          stripeConfig.webhookSecret
        );
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object);
          break;
        
        case 'transfer.created':
          await this.handleTransferCreated(event.data.object);
          break;
        
        case 'transfer.paid':
          await this.handleTransferPaid(event.data.object);
          break;
        
        case 'transfer.failed':
          await this.handleTransferFailed(event.data.object);
          break;
        
        case 'charge.dispute.created':
          await this.handleDisputeCreated(event.data.object);
          break;
        
        case 'charge.dispute.closed':
          await this.handleDisputeClosed(event.data.object);
          break;
        
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object);
          break;
        
        case 'checkout.session.expired':
          await this.handleCheckoutSessionExpired(event.data.object);
          break;
        
        case 'account.updated':
          await this.handleAccountUpdated(event.data.object);
          break;
        
        default:
      }

      res.json({ received: true });

    } catch (error) {
      console.error('Webhook handler error:', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  }

  // Handle successful payment intent
  async handlePaymentIntentSucceeded(paymentIntent) {
    try {
      const order = await Order.findOne({ 
        stripePaymentIntentId: paymentIntent.id 
      });

      if (!order) {
        console.error(`Order not found for payment intent: ${paymentIntent.id}`);
        return;
      }

      if (order.status === 'created') {
        order.status = 'funded';
        order.fundedAt = new Date();
        await order.save();

        // TODO: Send notification to lawyer about funded order
        // await notificationService.sendOrderFunded(order);
      }

    } catch (error) {
      console.error('Error handling payment intent succeeded:', error);
    }
  }

  // Handle failed payment intent
  async handlePaymentIntentFailed(paymentIntent) {
    try {
      const order = await Order.findOne({ 
        stripePaymentIntentId: paymentIntent.id 
      });

      if (!order) {
        console.error(`Order not found for payment intent: ${paymentIntent.id}`);
        return;
      }

      // Don't update if already in a final state
      if (!['created', 'funded'].includes(order.status)) {
        return;
      }

      order.status = 'cancelled';
      await order.save();

      // TODO: Send notification to client about failed payment
      // await notificationService.sendPaymentFailed(order);

    } catch (error) {
      console.error('Error handling payment intent failed:', error);
    }
  }

  // Handle transfer created
  async handleTransferCreated(transfer) {
    try {
      const payout = await Payout.findOne({ transferId: transfer.id });
      
      if (payout) {
        payout.status = 'in_transit';
        await payout.save();
        
      }

    } catch (error) {
      console.error('Error handling transfer created:', error);
    }
  }

  // Handle transfer paid
  async handleTransferPaid(transfer) {
    try {
      const payout = await Payout.findOne({ transferId: transfer.id })
        .populate('lawyerId', 'name email');
      
      if (payout) {
        payout.status = 'paid';
        payout.paidAt = new Date();
        await payout.save();

        // TODO: Send notification to lawyer about payout completion
        // await notificationService.sendPayoutCompleted(payout);
      }

    } catch (error) {
      console.error('Error handling transfer paid:', error);
    }
  }

  // Handle transfer failed
  async handleTransferFailed(transfer) {
    try {
      const payout = await Payout.findOne({ transferId: transfer.id })
        .populate('lawyerId', 'name email');
      
      if (payout) {
        payout.status = 'failed';
        payout.failedAt = new Date();
        payout.failureCode = transfer.failure_code;
        payout.failureMessage = transfer.failure_message;
        await payout.save();

        // TODO: Send notification to admin about failed payout
        // await notificationService.sendPayoutFailed(payout);
      }

    } catch (error) {
      console.error('Error handling transfer failed:', error);
    }
  }

  // Handle dispute created
  async handleDisputeCreated(charge) {
    try {
      // Find order by payment intent
      const paymentIntent = await this.stripe.paymentIntents.retrieve(charge.payment_intent);
      const order = await Order.findOne({ 
        stripePaymentIntentId: paymentIntent.id 
      });

      if (!order) {
        console.error(`Order not found for disputed charge: ${charge.id}`);
        return;
      }

      // Only update if not already disputed
      if (order.status !== 'disputed') {
        order.status = 'disputed';
        order.disputeCreatedAt = new Date();
        order.disputeReason = 'Stripe chargeback dispute';
        await order.save();

        // TODO: Send notification to admin about dispute
        // await notificationService.sendDisputeCreated(order);
      }

    } catch (error) {
      console.error('Error handling dispute created:', error);
    }
  }

  // Handle dispute closed
  async handleDisputeClosed(charge) {
    try {
      // Find order by payment intent
      const paymentIntent = await this.stripe.paymentIntents.retrieve(charge.payment_intent);
      const order = await Order.findOne({ 
        stripePaymentIntentId: paymentIntent.id 
      });

      if (!order) {
        console.error(`Order not found for closed dispute: ${charge.id}`);
        return;
      }

      const dispute = charge.dispute;
      
      if (dispute.status === 'won') {
        // Dispute won - release funds to lawyer
        if (order.status === 'disputed') {
          // Auto-release funds since dispute was won
          try {
            const transfer = await this.stripe.transfers.create({
              amount: order.lawyerAmountCents,
              currency: order.currency,
              destination: order.lawyerId.stripeAccountId,
              transfer_group: order.stripeTransferGroupId,
              metadata: {
                orderId: order.id,
                reason: 'dispute_won'
              }
            });

            order.status = 'completed';
            order.completedAt = new Date();
            await order.save();
            
          } catch (transferError) {
            console.error('Error creating transfer after dispute won:', transferError);
          }
        }
      } else if (dispute.status === 'lost') {
        // Dispute lost - refund to client (Stripe handles this automatically)
        order.status = 'refunded';
        order.refundedAt = new Date();
        await order.save();
        
      }
      
      // TODO: Send notification about dispute resolution
      // await notificationService.sendDisputeResolved(order, dispute.status);

    } catch (error) {
      console.error('Error handling dispute closed:', error);
    }
  }

  // Handle account updated
  async handleAccountUpdated(account) {
    try {
      const lawyer = await User.findOne({ stripeAccountId: account.id });
      
      if (!lawyer) {
        return;
      }

      const isOnboardingComplete = account.details_submitted && 
                                   account.charges_enabled && 
                                   account.payouts_enabled;

      if (isOnboardingComplete && !lawyer.stripeOnboardingComplete) {
        lawyer.stripeOnboardingComplete = true;
        await lawyer.save();

        // TODO: Send notification about completed onboarding
        // await notificationService.sendOnboardingCompleted(lawyer);
      }

    } catch (error) {
      console.error('Error handling account updated:', error);
    }
  }

  // Handle successful checkout completion
  async handleCheckoutSessionCompleted(session) {
    try {
      
      // Find the payment request by Stripe session ID
      const paymentRequest = await PaymentRequest.findOne({ 
        stripeSessionId: session.id 
      });
      
      if (!paymentRequest) {
        console.error('Payment request not found for session:', session.id);
        return;
      }

      // Update payment request status to paid
      paymentRequest.status = 'paid';
      paymentRequest.paidAt = new Date();
      await paymentRequest.save();

      // Create/update order record
      await Order.findOneAndUpdate(
        { paymentRequestId: paymentRequest.requestId },
        {
          status: 'completed',
          stripePaymentIntentId: session.payment_intent,
          completedAt: new Date()
        },
        { upsert: true }
      );

    } catch (error) {
      console.error('Error handling checkout session completed:', error);
    }
  }

  // Handle failed checkout
  async handleCheckoutSessionExpired(session) {
    try {
      
      // Find the payment request by Stripe session ID
      const paymentRequest = await PaymentRequest.findOne({ 
        stripeSessionId: session.id 
      });
      
      if (!paymentRequest) {
        console.error('Payment request not found for expired session:', session.id);
        return;
      }

      // Reset payment request status back to accepted
      paymentRequest.status = 'accepted';
      paymentRequest.stripeSessionId = null;
      await paymentRequest.save();

    } catch (error) {
      console.error('Error handling checkout session expired:', error);
    }
  }
}

module.exports = new StripeWebhookController();