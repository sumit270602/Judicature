const Order = require('../models/Order');
const User = require('../models/User');
const Case = require('../models/Case');
const Deliverable = require('../models/Deliverable');
const Payout = require('../models/Payout');
const { initializeStripe, stripeConfig } = require('../config/stripe');
const { validationResult } = require('express-validator');

class OrdersController {
  constructor() {
    this.stripe = null;
    this.initStripe();
  }

  async initStripe() {
    try {
      this.stripe = await initializeStripe();
    } catch (error) {
      console.error('Failed to initialize Stripe in OrdersController:', error);
    }
  }

  // Create new order with payment intent
  async createOrder(req, res) {
    try {
      if (!this.stripe) {
        return res.status(500).json({
          success: false,
          message: 'Stripe not initialized'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { lawyerId, amountCents, currency = 'inr', description, caseId } = req.body;
      const clientId = req.user.id;

      // Verify client exists
      const client = await User.findById(clientId);
      if (!client || client.role !== 'client') {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      // Verify lawyer exists and is verified
      const lawyer = await User.findById(lawyerId);
      if (!lawyer || lawyer.role !== 'lawyer') {
        return res.status(404).json({
          success: false,
          message: 'Lawyer not found'
        });
      }

      if (lawyer.verificationStatus !== 'verified') {
        return res.status(400).json({
          success: false,
          message: 'Lawyer is not verified'
        });
      }

      if (!lawyer.stripeAccountId || !lawyer.stripeOnboardingComplete) {
        return res.status(400).json({
          success: false,
          message: 'Lawyer Stripe account is not set up'
        });
      }

      // Verify case if provided
      let case_ = null;
      if (caseId) {
        case_ = await Case.findById(caseId);
        if (!case_ || case_.client.toString() !== clientId) {
          return res.status(404).json({
            success: false,
            message: 'Case not found or access denied'
          });
        }
      }

      // Calculate amounts
      const amounts = Order.calculateAmounts(amountCents, stripeConfig.platformFeePercent);
      
      // Generate unique order ID
      const orderId = Order.generateOrderId();
      
      // Create transfer group for this order
      const transferGroup = `order_${orderId}`;

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountCents,
        currency: currency.toLowerCase(),
        payment_method_types: ['card'],
        capture_method: 'automatic',
        description: description || `Legal services payment for order ${orderId}`,
        metadata: {
          orderId: orderId,
          clientId: clientId,
          lawyerId: lawyerId,
          caseId: caseId || '',
          platformFeeCents: amounts.platformFeeCents.toString(),
          lawyerAmountCents: amounts.lawyerAmountCents.toString()
        },
        transfer_group: transferGroup
      });

      // Create order in database
      const order = new Order({
        id: orderId,
        clientId,
        lawyerId,
        caseId: caseId || undefined,
        ...amounts,
        currency: currency.toLowerCase(),
        status: 'created',
        stripePaymentIntentId: paymentIntent.id,
        stripeTransferGroupId: transferGroup,
        description
      });

      await order.save();

      res.json({
        success: true,
        data: {
          orderId: order.id,
          clientSecret: paymentIntent.client_secret,
          amount: amountCents,
          platformFee: amounts.platformFeeCents,
          lawyerAmount: amounts.lawyerAmountCents,
          currency
        }
      });

    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create order',
        error: error.message
      });
    }
  }

  // Get order details
  async getOrder(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const order = await Order.findOne({ id: orderId })
        .populate('clientId', 'name email')
        .populate('lawyerId', 'name email')
        .populate('caseId', 'title caseNumber');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check access permissions
      if (order.clientId._id.toString() !== userId && 
          order.lawyerId._id.toString() !== userId &&
          req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Get deliverables
      const deliverables = await Deliverable.find({ orderId: order._id })
        .populate('uploadedBy', 'name')
        .populate('acceptedBy', 'name')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: {
          order,
          deliverables
        }
      });

    } catch (error) {
      console.error('Error getting order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get order',
        error: error.message
      });
    }
  }

  // List orders for user
  async listOrders(req, res) {
    try {
      const userId = req.user.id;
      const { status, page = 1, limit = 10 } = req.query;

      let query = {};
      
      if (req.user.role === 'client') {
        query.clientId = userId;
      } else if (req.user.role === 'lawyer') {
        query.lawyerId = userId;
      } else if (req.user.role === 'admin') {
        // Admin can see all orders
      } else {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (status) {
        query.status = status;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const orders = await Order.find(query)
        .populate('clientId', 'name email')
        .populate('lawyerId', 'name email')
        .populate('caseId', 'title caseNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Order.countDocuments(query);

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Error listing orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list orders',
        error: error.message
      });
    }
  }

  // Release funds to lawyer
  async releaseFunds(req, res) {
    try {
      if (!this.stripe) {
        return res.status(500).json({
          success: false,
          message: 'Stripe not initialized'
        });
      }

      const { orderId } = req.params;
      const userId = req.user.id;

      const order = await Order.findOne({ id: orderId })
        .populate('lawyerId');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Only client or admin can release funds
      if (order.clientId.toString() !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (order.status !== 'delivered') {
        return res.status(400).json({
          success: false,
          message: 'Order must be delivered to release funds'
        });
      }

      // Check if deliverable exists and is accepted
      const deliverable = await Deliverable.findOne({ 
        orderId: order._id,
        status: { $in: ['uploaded', 'accepted'] }
      });

      if (!deliverable) {
        return res.status(400).json({
          success: false,
          message: 'No deliverable found for this order'
        });
      }

      // Create transfer to lawyer
      const transfer = await this.stripe.transfers.create({
        amount: order.lawyerAmountCents,
        currency: order.currency,
        destination: order.lawyerId.stripeAccountId,
        transfer_group: order.stripeTransferGroupId,
        metadata: {
          orderId: order.id,
          lawyerId: order.lawyerId._id.toString()
        }
      });

      // Create payout record
      const payout = new Payout({
        orderId: order._id,
        lawyerId: order.lawyerId._id,
        transferId: transfer.id,
        amount: order.lawyerAmountCents,
        fee: order.platformFeeCents,
        currency: order.currency,
        status: 'pending',
        isOnHold: order.lawyerId.payoutHoldUntil ? new Date() < order.lawyerId.payoutHoldUntil : false,
        holdUntil: order.lawyerId.payoutHoldUntil,
        holdReason: 'new_lawyer'
      });

      await payout.save();

      // Update order status
      order.status = 'completed';
      order.completedAt = new Date();
      await order.save();

      // Update deliverable status
      if (deliverable.status === 'uploaded') {
        deliverable.status = 'accepted';
        deliverable.acceptedBy = userId;
        deliverable.acceptedAt = new Date();
        await deliverable.save();
      }

      res.json({
        success: true,
        data: {
          transferId: transfer.id,
          amount: order.lawyerAmountCents,
          isOnHold: payout.isOnHold,
          holdUntil: payout.holdUntil
        }
      });

    } catch (error) {
      console.error('Error releasing funds:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to release funds',
        error: error.message
      });
    }
  }

  // Create dispute
  async createDispute(req, res) {
    try {
      const { orderId } = req.params;
      const { reason, attachments } = req.body;
      const userId = req.user.id;

      const order = await Order.findOne({ id: orderId });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Only client can create disputes
      if (order.clientId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (!order.canBeDisputed()) {
        return res.status(400).json({
          success: false,
          message: 'Order cannot be disputed in current status'
        });
      }

      // Update order with dispute information
      order.status = 'disputed';
      order.disputeReason = reason;
      order.disputeAttachments = attachments || [];
      order.disputeCreatedAt = new Date();
      await order.save();

      res.json({
        success: true,
        message: 'Dispute created successfully'
      });

    } catch (error) {
      console.error('Error creating dispute:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create dispute',
        error: error.message
      });
    }
  }

  // Refund order
  async refundOrder(req, res) {
    try {
      if (!this.stripe) {
        return res.status(500).json({
          success: false,
          message: 'Stripe not initialized'
        });
      }

      const { orderId } = req.params;
      const { reason } = req.body;

      const order = await Order.findOne({ id: orderId });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Only admin can process refunds
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (!order.canBeRefunded()) {
        return res.status(400).json({
          success: false,
          message: 'Order cannot be refunded in current status'
        });
      }

      // Create refund
      const refund = await this.stripe.refunds.create({
        payment_intent: order.stripePaymentIntentId,
        reason: reason || 'requested_by_customer',
        metadata: {
          orderId: order.id
        }
      });

      // Update order status
      order.status = 'refunded';
      order.refundedAt = new Date();
      await order.save();

      res.json({
        success: true,
        data: {
          refundId: refund.id,
          amount: refund.amount,
          status: refund.status
        }
      });

    } catch (error) {
      console.error('Error refunding order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to refund order',
        error: error.message
      });
    }
  }
}

module.exports = new OrdersController();