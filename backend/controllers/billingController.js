const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const TimeTracking = require('../models/TimeTracking');
const Case = require('../models/Case');
const User = require('../models/User');
const crypto = require('crypto');
const Razorpay = require('razorpay'); // For Indian payments

// Initialize Razorpay (India's leading payment gateway)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Payment Order (Escrow)
const createPaymentOrder = async (req, res) => {
  try {
    const { caseId, amount, serviceId, description } = req.body;
    const clientId = req.user.id;

    // Validate case and get lawyer details
    const caseDetails = await Case.findById(caseId).populate('lawyer');
    if (!caseDetails) {
      return res.status(404).json({ message: 'Case not found' });
    }

    if (caseDetails.client.toString() !== clientId) {
      return res.status(403).json({ message: 'Unauthorized access to case' });
    }

    const lawyer = caseDetails.lawyer;

    // Create Razorpay order
    const orderOptions = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `case_${caseId}_${Date.now()}`,
      notes: {
        caseId,
        clientId,
        lawyerId: lawyer._id.toString(),
        serviceId: serviceId || '',
        description: description || 'Legal service payment'
      }
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    // Create payment record in escrow state
    const payment = new Payment({
      case: caseId,
      client: clientId,
      lawyer: lawyer._id,
      amount: amount,
      serviceId,
      status: 'pending_payment',
      gateway: {
        provider: 'razorpay',
        orderId: razorpayOrder.id
      },
      escrow: {
        holdingPeriod: 7, // 7 days default
        autoRelease: true
      },
      gst: {
        gstNumber: lawyer.gstNumber || ''
      }
    });

    await payment.save();

    res.status(201).json({
      success: true,
      payment: {
        id: payment._id,
        paymentId: payment.paymentId,
        amount: payment.totalAmount,
        currency: 'INR',
        razorpayOrderId: razorpayOrder.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID
      },
      message: 'Payment order created successfully'
    });

  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create payment order',
      error: error.message 
    });
  }
};

// Verify Payment and Move to Escrow
const verifyPayment = async (req, res) => {
  try {
    const { paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    // Verify signature
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Update payment status
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    payment.gateway.transactionId = razorpayPaymentId;
    payment.gateway.signature = razorpaySignature;
    await payment.updateStatus('payment_received', 'Payment received and held in escrow', req.user.id);

    // Create invoice
    const invoice = await createInvoiceForPayment(payment);
    payment.invoice = invoice._id;
    await payment.save();

    res.json({
      success: true,
      message: 'Payment verified and moved to escrow',
      payment: {
        id: payment._id,
        status: payment.status,
        escrowReleaseDate: payment.escrow.releaseDate
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Payment verification failed',
      error: error.message 
    });
  }
};

// Submit Work (Lawyer)
const submitWork = async (req, res) => {
  try {
    const { paymentId, description, documents, lawyerNotes } = req.body;
    const lawyerId = req.user.id;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.lawyer.toString() !== lawyerId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    if (payment.status !== 'payment_received') {
      return res.status(400).json({ message: 'Payment not in correct state for work submission' });
    }

    // Update payment with work submission
    payment.workSubmission = {
      submittedAt: new Date(),
      description,
      documents: documents || [],
      lawyerNotes
    };

    await payment.updateStatus('work_submitted', 'Work submitted by lawyer', lawyerId);

    // Notify client about work submission
    // TODO: Send notification to client

    res.json({
      success: true,
      message: 'Work submitted successfully',
      payment: {
        id: payment._id,
        status: payment.status
      }
    });

  } catch (error) {
    console.error('Submit work error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit work',
      error: error.message 
    });
  }
};

// Approve Work and Release Payment (Client)
const approveWorkAndRelease = async (req, res) => {
  try {
    const { paymentId, approved, feedback, rating } = req.body;
    const clientId = req.user.id;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.client.toString() !== clientId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    if (payment.status !== 'work_submitted') {
      return res.status(400).json({ message: 'No work submitted for this payment' });
    }

    payment.clientReview = {
      reviewedAt: new Date(),
      approved,
      feedback,
      rating
    };

    if (approved) {
      await payment.updateStatus('approved', 'Work approved by client', clientId);
      await payment.updateStatus('payment_released', 'Payment released to lawyer', clientId);
      
      // Update invoice status
      if (payment.invoice) {
        const invoice = await Invoice.findById(payment.invoice);
        if (invoice) {
          await invoice.markAsPaid();
        }
      }
    } else {
      await payment.updateStatus('disputed', 'Work rejected by client', clientId);
    }

    res.json({
      success: true,
      message: approved ? 'Work approved and payment released' : 'Work rejected and payment disputed',
      payment: {
        id: payment._id,
        status: payment.status
      }
    });

  } catch (error) {
    console.error('Approve work error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process work approval',
      error: error.message 
    });
  }
};

// Raise Dispute
const raiseDispute = async (req, res) => {
  try {
    const { paymentId, reason } = req.body;
    const userId = req.user.id;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const isClient = payment.client.toString() === userId;
    const isLawyer = payment.lawyer.toString() === userId;

    if (!isClient && !isLawyer) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    payment.dispute = {
      raisedBy: isClient ? 'client' : 'lawyer',
      raisedAt: new Date(),
      reason,
      status: 'open'
    };

    await payment.updateStatus('disputed', `Dispute raised by ${isClient ? 'client' : 'lawyer'}`, userId);

    // TODO: Notify admin/support team about dispute

    res.json({
      success: true,
      message: 'Dispute raised successfully',
      dispute: payment.dispute
    });

  } catch (error) {
    console.error('Raise dispute error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to raise dispute',
      error: error.message 
    });
  }
};

// Get Payment Details
const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    const payment = await Payment.findById(paymentId)
      .populate('client', 'name email')
      .populate('lawyer', 'name email')
      .populate('case', 'title caseNumber')
      .populate('invoice');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const isClient = payment.client._id.toString() === userId;
    const isLawyer = payment.lawyer._id.toString() === userId;

    if (!isClient && !isLawyer) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    res.json({
      success: true,
      payment
    });

  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get payment details',
      error: error.message 
    });
  }
};

// Get Lawyer Payments Dashboard
const getLawyerPayments = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { lawyer: lawyerId };
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .populate('client', 'name email')
      .populate('case', 'title caseNumber')
      .populate('invoice')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    // Get summary statistics
    const stats = await Payment.aggregate([
      { $match: { lawyer: lawyerId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      payments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPayments: total
      },
      stats
    });

  } catch (error) {
    console.error('Get lawyer payments error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get lawyer payments',
      error: error.message 
    });
  }
};

// Get Client Payments Dashboard
const getClientPayments = async (req, res) => {
  try {
    const clientId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { client: clientId };
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .populate('lawyer', 'name email')
      .populate('case', 'title caseNumber')
      .populate('invoice')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    // Get summary statistics
    const stats = await Payment.aggregate([
      { $match: { client: clientId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      payments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPayments: total
      },
      stats
    });

  } catch (error) {
    console.error('Get client payments error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get client payments',
      error: error.message 
    });
  }
};

// Helper function to create invoice for payment
const createInvoiceForPayment = async (payment) => {
  try {
    const caseDetails = await Case.findById(payment.case);
    const lawyer = await User.findById(payment.lawyer);
    const client = await User.findById(payment.client);

    const invoice = new Invoice({
      payment: payment._id,
      case: payment.case,
      client: payment.client,
      lawyer: payment.lawyer,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      services: [{
        description: 'Legal service payment',
        quantity: 1,
        rate: payment.amount,
        amount: payment.amount,
        serviceType: 'fixed_service'
      }],
      subtotal: payment.amount,
      gst: {
        isApplicable: payment.gst.isApplicable,
        percentage: payment.gst.percentage,
        amount: payment.gst.amount
      },
      totalAmount: payment.totalAmount,
      status: 'sent',
      paymentStatus: 'paid',
      lawyerDetails: {
        name: lawyer.name,
        email: lawyer.email,
        phone: lawyer.phone,
        gstNumber: lawyer.gstNumber,
        panNumber: lawyer.panNumber
      },
      clientDetails: {
        name: client.name,
        email: client.email,
        phone: client.phone
      },
      caseDetails: {
        title: caseDetails.title,
        caseNumber: caseDetails.caseNumber,
        court: caseDetails.court,
        caseType: caseDetails.caseType
      }
    });

    await invoice.save();
    return invoice;

  } catch (error) {
    console.error('Create invoice error:', error);
    throw error;
  }
};

// Auto-release payments (scheduled job)
const autoReleasePayments = async () => {
  try {
    const now = new Date();
    const paymentsToRelease = await Payment.find({
      status: 'work_submitted',
      'escrow.autoRelease': true,
      'escrow.releaseDate': { $lte: now }
    });

    for (const payment of paymentsToRelease) {
      await payment.updateStatus('payment_released', 'Auto-released after holding period', null);
      
      // Update invoice status
      if (payment.invoice) {
        const invoice = await Invoice.findById(payment.invoice);
        if (invoice) {
          await invoice.markAsPaid();
        }
      }
    }

    console.log(`Auto-released ${paymentsToRelease.length} payments`);

  } catch (error) {
    console.error('Auto-release payments error:', error);
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  submitWork,
  approveWorkAndRelease,
  raiseDispute,
  getPaymentDetails,
  getLawyerPayments,
  getClientPayments,
  autoReleasePayments
};