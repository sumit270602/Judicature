const PaymentRequest = require('../models/PaymentRequest');
const User = require('../models/User');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const notificationService = require('../utils/notificationService');
const { validationResult } = require('express-validator');

class PaymentRequestController {
  
  // Lawyer creates a payment request for a client
  async createPaymentRequest(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const lawyerId = req.user.id;
      const { 
        clientId, 
        amount, 
        serviceType, 
        description, 
        urgency = 'medium',
        estimatedDeliveryDays = 7,
        caseId 
      } = req.body;

      // Verify lawyer
      const lawyer = await User.findById(lawyerId);
      if (!lawyer || lawyer.role !== 'lawyer') {
        return res.status(403).json({
          success: false,
          message: 'Only lawyers can create payment requests'
        });
      }

      // Verify client exists
      const client = await User.findById(clientId);
      if (!client || client.role !== 'client') {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      // Check if lawyer has completed Stripe onboarding
      if (!lawyer.stripeAccountId || !lawyer.stripeOnboardingComplete) {
        return res.status(400).json({
          success: false,
          message: 'Please complete your Stripe account setup before creating payment requests'
        });
      }

      // Create payment request
      const paymentRequest = new PaymentRequest({
        lawyer: lawyerId,
        client: clientId,
        amount: parseFloat(amount),
        serviceType,
        description,
        metadata: {
          urgency,
          estimatedDeliveryDays: parseInt(estimatedDeliveryDays),
          caseId: caseId || undefined
        }
      });

      await paymentRequest.save();

      // Populate lawyer and client info
      await paymentRequest.populate('lawyer client', 'name email role');

      // Create notification for client
      const notification = new Notification({
        recipient: clientId,
        type: 'payment',
        title: 'New Payment Request',
        message: `${lawyer.name} has requested payment of ₹${amount.toLocaleString()} for ${serviceType}`,
        priority: 'high',
        actionRequired: true,
        actionUrl: `/dashboard/payments`
      });

      await notification.save();

      // Send real-time notification
      notificationService.sendToUser(clientId, {
        type: 'payment_request',
        title: 'New Payment Request',
        message: `${lawyer.name} has requested payment of ₹${amount.toLocaleString()}`,
        data: {
          requestId: paymentRequest.requestId,
          amount: paymentRequest.amount,
          serviceType: paymentRequest.serviceType
        }
      });

      // Send email notification (if configured)
      try {
        await notificationService.sendEmail({
          to: client.email,
          subject: `Payment Request from ${lawyer.name}`,
          template: 'payment-request',
          data: {
            clientName: client.name,
            lawyerName: lawyer.name,
            amount: paymentRequest.amount,
            totalAmount: paymentRequest.totalAmount,
            serviceType: paymentRequest.serviceType,
            description: paymentRequest.description,
            requestId: paymentRequest.requestId,
            paymentUrl: `${process.env.FRONTEND_URL}/payments/request/${paymentRequest.requestId}`
          }
        });
      } catch (emailError) {
        console.error('Failed to send payment request email:', emailError);
        // Don't fail the request if email fails
      }

      res.status(201).json({
        success: true,
        message: 'Payment request created successfully',
        data: paymentRequest
      });

    } catch (error) {
      console.error('Error creating payment request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment request',
        error: error.message
      });
    }
  }

  // Client responds to payment request (accept/reject)
  async respondToPaymentRequest(req, res) {
    try {
      const { requestId } = req.params;
      const { action, notes } = req.body; // action: 'accept' or 'reject'
      const clientId = req.user.id;

      const paymentRequest = await PaymentRequest.findOne({ 
        requestId,
        client: clientId 
      }).populate('lawyer client', 'name email role');

      if (!paymentRequest) {
        return res.status(404).json({
          success: false,
          message: 'Payment request not found'
        });
      }

      if (paymentRequest.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Payment request has already been responded to'
        });
      }

      if (paymentRequest.isExpired()) {
        return res.status(400).json({
          success: false,
          message: 'Payment request has expired'
        });
      }

      // Update payment request
      paymentRequest.status = action === 'accept' ? 'accepted' : 'rejected';
      paymentRequest.clientNotes = notes || '';
      await paymentRequest.save();

      // Notify lawyer
      const notification = new Notification({
        recipient: paymentRequest.lawyer._id,
        type: action === 'accept' ? 'payment_accepted' : 'payment_rejected',
        title: `Payment Request ${action === 'accept' ? 'Accepted' : 'Rejected'}`,
        message: `${paymentRequest.client.name} has ${action}ed your payment request for ₹${paymentRequest.amount.toLocaleString()}`,
        data: {
          paymentRequestId: paymentRequest._id,
          requestId: paymentRequest.requestId,
          clientName: paymentRequest.client.name,
          action
        }
      });

      await notification.save();

      // Send real-time notification
      notificationService.sendToUser(paymentRequest.lawyer._id, {
        type: action === 'accept' ? 'payment_accepted' : 'payment_rejected',
        title: `Payment Request ${action === 'accept' ? 'Accepted' : 'Rejected'}`,
        message: `${paymentRequest.client.name} has ${action}ed your payment request`,
        data: {
          requestId: paymentRequest.requestId,
          amount: paymentRequest.amount,
          action
        }
      });

      res.json({
        success: true,
        message: `Payment request ${action}ed successfully`,
        data: paymentRequest
      });

    } catch (error) {
      console.error('Error responding to payment request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to respond to payment request',
        error: error.message
      });
    }
  }

  // Client proceeds with payment for accepted request
  async proceedWithPayment(req, res) {
    try {
      const { requestId } = req.params;
      const clientId = req.user.id;

      const paymentRequest = await PaymentRequest.findOne({ 
        requestId,
        client: clientId 
      }).populate('lawyer', 'name email stripeAccountId');

      if (!paymentRequest) {
        return res.status(404).json({
          success: false,
          message: 'Payment request not found'
        });
      }

      if (!paymentRequest.canBePaid()) {
        return res.status(400).json({
          success: false,
          message: 'Payment request cannot be paid at this time'
        });
      }

      // Import required models and utilities
      const Order = require('../models/Order');
      const { initializeStripe } = require('../config/stripe');
      
      // Initialize Stripe if not already done
      let stripe = null;
      try {
        stripe = await initializeStripe();
      } catch (error) {
        throw new Error('Stripe not available');
      }

      // Verify lawyer has Stripe account and is onboarded
      if (!paymentRequest.lawyer.stripeAccountId) {
        return res.status(400).json({
          success: false,
          message: 'Lawyer has not completed payment setup'
        });
      }

      // Calculate total amount with fees
      const baseAmount = paymentRequest.amount;
      const gst = Math.round(baseAmount * 0.18);
      const platformFee = Math.round(baseAmount * 0.029);
      const totalAmount = baseAmount + gst + platformFee;

      // Generate unique order ID
      const orderCount = await Order.countDocuments();
      const orderId = `ORD-${String(orderCount + 1).padStart(6, '0')}`;

      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: paymentRequest.currency.toLowerCase(),
              product_data: {
                name: `Legal Service - ${paymentRequest.serviceType.replace('_', ' ')}`,
                description: paymentRequest.description,
              },
              unit_amount: totalAmount * 100, // Convert to paise
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
        cancel_url: `${process.env.FRONTEND_URL}/dashboard/payments?payment_cancelled=true`,
        metadata: {
          orderId: orderId,
          clientId: paymentRequest.client._id.toString(),
          lawyerId: paymentRequest.lawyer._id.toString(),
          paymentRequestId: paymentRequest._id.toString(),
          serviceType: paymentRequest.serviceType
        },
        payment_intent_data: {
          transfer_data: {
            destination: paymentRequest.lawyer.stripeAccountId,
          },
          application_fee_amount: (gst + platformFee) * 100, // Platform fee in paise
        },
      });

      // Create order record
      const order = new Order({
        id: orderId,
        clientId: paymentRequest.client._id,
        lawyerId: paymentRequest.lawyer._id,
        paymentRequestId: paymentRequest._id,
        amountCents: baseAmount * 100,
        currency: paymentRequest.currency.toLowerCase(),
        platformFeeCents: (gst + platformFee) * 100,
        status: 'created',
        stripePaymentIntentId: session.id, // Store session ID for now
        description: paymentRequest.description
      });

      await order.save();

      // Update payment request (keep as accepted until payment is completed)
      // Don't change status to 'paid' yet - this will be done by webhook
      await paymentRequest.save();

      res.json({
        success: true,
        message: 'Payment initiated successfully',
        data: {
          orderId: orderId,
          sessionId: session.id,
          totalAmount: totalAmount,
          checkoutUrl: session.url
        }
      });

    } catch (error) {
      console.error('Error proceeding with payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate payment',
        error: error.message
      });
    }
  }

  // Get payment requests for current user
  async getPaymentRequests(req, res) {
    try {
      const userId = req.user.id;
      const { status, page = 1, limit = 10 } = req.query;

      let query = {};
      let populate = '';

      if (req.user.role === 'client') {
        query.client = userId;
        populate = 'lawyer';
      } else if (req.user.role === 'lawyer') {
        query.lawyer = userId;
        populate = 'client';
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

      const [requests, total] = await Promise.all([
        PaymentRequest.find(query)
          .populate(populate, 'name email')
          .populate({
            path: 'metadata.caseId',
            select: 'title caseNumber workProof',
            options: { lean: true }
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        PaymentRequest.countDocuments(query)
      ]);

      // Transform requests to include relatedCase for frontend compatibility
      const transformedRequests = requests.map(request => {
        const requestObj = request.toObject ? request.toObject() : request;
        if (requestObj.metadata && requestObj.metadata.caseId) {
          requestObj.relatedCase = requestObj.metadata.caseId;
        }
        return requestObj;
      });

      res.json({
        success: true,
        data: {
          requests: transformedRequests,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Error fetching payment requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment requests',
        error: error.message
      });
    }
  }

  // Get single payment request details
  async getPaymentRequest(req, res) {
    try {
      const { requestId } = req.params;
      const userId = req.user.id;

      const paymentRequest = await PaymentRequest.findOne({ requestId })
        .populate('lawyer client', 'name email role');

      if (!paymentRequest) {
        return res.status(404).json({
          success: false,
          message: 'Payment request not found'
        });
      }

      // Check if user has access to this payment request
      const hasAccess = paymentRequest.lawyer._id.toString() === userId || 
                       paymentRequest.client._id.toString() === userId;

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: paymentRequest
      });

    } catch (error) {
      console.error('Error fetching payment request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment request',
        error: error.message
      });
    }
  }

  // Cancel payment request (lawyer only, before client responds)
  async cancelPaymentRequest(req, res) {
    try {
      const { requestId } = req.params;
      const lawyerId = req.user.id;

      const paymentRequest = await PaymentRequest.findOne({ 
        requestId,
        lawyer: lawyerId 
      }).populate('client', 'name email');

      if (!paymentRequest) {
        return res.status(404).json({
          success: false,
          message: 'Payment request not found'
        });
      }

      if (!paymentRequest.canBeCancelled()) {
        return res.status(400).json({
          success: false,
          message: 'Payment request cannot be cancelled'
        });
      }

      paymentRequest.status = 'cancelled';
      await paymentRequest.save();

      // Notify client
      const notification = new Notification({
        recipient: paymentRequest.client._id,
        type: 'payment_cancelled',
        title: 'Payment Request Cancelled',
        message: `Payment request for ₹${paymentRequest.amount.toLocaleString()} has been cancelled`,
        data: {
          paymentRequestId: paymentRequest._id,
          requestId: paymentRequest.requestId
        }
      });

      await notification.save();

      res.json({
        success: true,
        message: 'Payment request cancelled successfully',
        data: paymentRequest
      });

    } catch (error) {
      console.error('Error cancelling payment request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel payment request',
        error: error.message
      });
    }
  }

  // Get clients that lawyer can create payment requests for
  async getLawyerClients(req, res) {
    try {
      const lawyerId = req.user.id;
      const Case = require('../models/Case');

      // Get distinct clients from cases where this lawyer is assigned
      const clientIds = await Case.distinct('client', { lawyer: lawyerId });
      
      // Get client details
      const clients = await User.find({
        _id: { $in: clientIds },
        role: 'client'
      }).select('name email _id');

      res.json({
        success: true,
        clients
      });

    } catch (error) {
      console.error('Error fetching lawyer clients:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch clients',
        error: error.message
      });
    }
  }
}

module.exports = new PaymentRequestController();