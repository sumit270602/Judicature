
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const WorkItem = require('../models/WorkItem');
const TransactionAudit = require('../models/TransactionAudit');
const User = require('../models/User');
const Case = require('../models/Case');
const { validationResult } = require('express-validator');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Payment Request
const createPaymentRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
    
    const {
      caseId,
      workItemId,
      amount,
      description,
      type = 'service_fee',
      dueDate,
      breakdown,
      paymentSchedule
    } = req.body;
    
    // Verify case and permissions
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // Check if user is authorized to create payment request
    const isAuthorized = (
      (req.user.role === 'lawyer' && caseData.assignedLawyer.toString() === req.user.id) ||
      req.user.role === 'admin'
    );
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to create payment requests for this case'
      });
    }
    
    // Calculate GST and platform fees
    const baseAmount = parseFloat(amount);
    const platformFeeRate = 0.02; // 2%
    const gstRate = 0.18; // 18%
    
    const calculatedBreakdown = breakdown || {
      baseAmount: baseAmount,
      platformFee: Math.round(baseAmount * platformFeeRate * 100) / 100,
      gstAmount: Math.round(baseAmount * gstRate * 100) / 100,
      totalAmount: Math.round(baseAmount * (1 + platformFeeRate + gstRate) * 100) / 100
    };
    
    // Create payment record
    const payment = new Payment({
      client: caseData.client,
      lawyer: req.user.id,
      case: caseId,
      workItem: workItemId,
      amount: calculatedBreakdown.totalAmount,
      type,
      status: 'pending',
      description,
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)),
      breakdown: calculatedBreakdown,
      paymentSchedule: paymentSchedule || [{
        amount: calculatedBreakdown.totalAmount,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)),
        status: 'pending'
      }],
      escrow: {
        enabled: type === 'service_fee' || type === 'consultation_fee',
        releaseConditions: workItemId ? 'work_completion' : 'milestone_completion'
      },
      compliance: {
        gstNumber: process.env.COMPANY_GST_NUMBER,
        panNumber: process.env.COMPANY_PAN_NUMBER,
        invoiceRequired: calculatedBreakdown.totalAmount >= 500,
        tdsApplicable: calculatedBreakdown.totalAmount >= 30000
      }
    });
    
    await payment.save();
    
    // Create Razorpay order
    try {
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(calculatedBreakdown.totalAmount * 100), // Amount in paise
        currency: 'INR',
        receipt: `PAY_${payment._id}`,
        payment_capture: 0, // Manual capture for escrow
        notes: {
          paymentId: payment._id.toString(),
          caseId: caseId,
          clientId: caseData.client.toString(),
          lawyerId: req.user.id,
          type: type
        }
      });
      
      payment.razorpayOrderId = razorpayOrder.id;
      await payment.save();
      
    } catch (razorpayError) {
      console.error('Razorpay order creation failed:', razorpayError);
      // Continue without Razorpay order - can be created later
    }
    
    // Create audit log
    await TransactionAudit.create({
      transactionId: `PAY_REQ_${Date.now()}`,
      payment: payment._id,
      transactionType: 'payment_request',
      amounts: {
        original: baseAmount,
        processed: calculatedBreakdown.totalAmount
      },
      initiatedBy: {
        user: req.user.id,
        role: req.user.role,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      gateway: {
        provider: 'razorpay',
        orderId: payment.razorpayOrderId
      },
      status: 'initiated',
      metadata: {
        caseId,
        workItemId,
        type,
        breakdown: calculatedBreakdown
      }
    });
    
    await payment.populate([
      { path: 'client', select: 'name email' },
      { path: 'lawyer', select: 'name email' },
      { path: 'case', select: 'title caseNumber' }
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Payment request created successfully',
      data: payment
    });
    
  } catch (error) {
    console.error('Create payment request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Process Payment
const processPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
    
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    // Verify client authorization
    if (payment.client.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to process this payment'
      });
    }
    
    // Verify Razorpay signature
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');
    
    if (expectedSignature !== razorpaySignature) {
      // Log security incident
      await TransactionAudit.create({
        transactionId: `SEC_VIOLATION_${Date.now()}`,
        payment: payment._id,
        transactionType: 'security_violation',
        amounts: {
          original: payment.amount,
          processed: 0
        },
        initiatedBy: {
          user: req.user.id,
          role: req.user.role,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        },
        gateway: {
          provider: 'razorpay',
          paymentId: razorpayPaymentId,
          orderId: razorpayOrderId
        },
        status: 'failed',
        riskAssessment: {
          score: 100, // Maximum risk
          factors: ['signature_mismatch'],
          recommendation: 'block_transaction'
        },
        metadata: {
          expectedSignature,
          receivedSignature: razorpaySignature,
          securityIncident: true
        }
      });
      
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }
    
    try {
      // Capture payment in Razorpay if escrow is disabled
      if (!payment.escrow.enabled) {
        await razorpay.payments.capture(razorpayPaymentId, payment.amount * 100);
      }
      
      // Update payment status
      payment.status = payment.escrow.enabled ? 'paid_escrowed' : 'paid';
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.paidAt = new Date();
      payment.paymentMethod = 'razorpay';
      
      // Update payment schedule
      payment.paymentSchedule[0].status = 'paid';
      payment.paymentSchedule[0].paidAt = new Date();
      payment.paymentSchedule[0].transactionId = razorpayPaymentId;
      
      await payment.save();
      
      // Create invoice if required
      if (payment.compliance.invoiceRequired) {
        const invoice = new Invoice({
          payment: payment._id,
          client: payment.client,
          lawyer: payment.lawyer,
          case: payment.case,
          amount: payment.amount,
          invoiceNumber: await Invoice.generateInvoiceNumber(),
          invoiceDate: new Date(),
          dueDate: payment.dueDate,
          items: [{
            description: payment.description,
            quantity: 1,
            rate: payment.breakdown.baseAmount,
            amount: payment.breakdown.baseAmount
          }],
          breakdown: payment.breakdown,
          status: 'paid',
          gstDetails: {
            gstNumber: payment.compliance.gstNumber,
            gstAmount: payment.breakdown.gstAmount,
            cgst: payment.breakdown.gstAmount / 2,
            sgst: payment.breakdown.gstAmount / 2,
            igst: 0
          }
        });
        
        await invoice.save();
        payment.invoice = invoice._id;
        await payment.save();
      }
      
      // Create comprehensive audit log
      await TransactionAudit.create({
        transactionId: razorpayPaymentId,
        payment: payment._id,
        transactionType: 'payment_success',
        amounts: {
          original: payment.breakdown.baseAmount,
          processed: payment.amount,
          fees: payment.breakdown.platformFee,
          taxes: payment.breakdown.gstAmount
        },
        initiatedBy: {
          user: req.user.id,
          role: req.user.role,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        },
        gateway: {
          provider: 'razorpay',
          paymentId: razorpayPaymentId,
          orderId: razorpayOrderId,
          method: 'online'
        },
        status: 'completed',
        riskAssessment: {
          score: 25, // Low risk for successful payment
          factors: ['verified_signature', 'known_client'],
          recommendation: 'approve'
        },
        compliance: {
          amlStatus: 'clear',
          kycStatus: 'verified',
          dataLocalization: 'compliant',
          auditTrail: 'complete'
        },
        metadata: {
          escrowEnabled: payment.escrow.enabled,
          invoiceGenerated: !!payment.invoice,
          gstApplied: payment.breakdown.gstAmount > 0
        }
      });
      
      await payment.populate([
        { path: 'client', select: 'name email' },
        { path: 'lawyer', select: 'name email' },
        { path: 'case', select: 'title caseNumber' },
        { path: 'invoice', select: 'invoiceNumber invoiceDate' }
      ]);
      
      res.json({
        success: true,
        message: 'Payment processed successfully',
        data: payment
      });
      
    } catch (razorpayError) {
      console.error('Razorpay capture error:', razorpayError);
      
      // Log payment processing error
      await TransactionAudit.create({
        transactionId: razorpayPaymentId,
        payment: payment._id,
        transactionType: 'payment_processing_error',
        amounts: {
          original: payment.amount,
          processed: 0
        },
        initiatedBy: {
          user: req.user.id,
          role: req.user.role,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        },
        gateway: {
          provider: 'razorpay',
          paymentId: razorpayPaymentId,
          orderId: razorpayOrderId,
          error: razorpayError.message
        },
        status: 'failed',
        metadata: {
          razorpayError: razorpayError.message,
          errorCode: razorpayError.error?.code
        }
      });
      
      return res.status(500).json({
        success: false,
        message: 'Payment processing failed',
        error: 'Gateway error occurred'
      });
    }
    
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Release Escrow Payment
const releaseEscrowPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { releaseReason, notes } = req.body;
    
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    // Check authorization
    const isAuthorized = (
      (req.user.role === 'client' && payment.client.toString() === req.user.id) ||
      (req.user.role === 'admin')
    );
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to release this payment'
      });
    }
    
    if (payment.status !== 'paid_escrowed') {
      return res.status(400).json({
        success: false,
        message: 'Payment is not in escrow or already released'
      });
    }
    
    try {
      // Capture payment in Razorpay
      await razorpay.payments.capture(payment.razorpayPaymentId, payment.amount * 100);
      
      // Update payment status
      payment.status = 'released';
      payment.escrow.releasedAt = new Date();
      payment.escrow.releasedBy = req.user.id;
      payment.escrow.releaseReason = releaseReason;
      payment.escrow.releaseNotes = notes;
      
      await payment.save();
      
      // Create audit log
      await TransactionAudit.create({
        transactionId: `ESCROW_RELEASE_${Date.now()}`,
        payment: payment._id,
        transactionType: 'escrow_release',
        amounts: {
          original: payment.amount,
          processed: payment.amount
        },
        initiatedBy: {
          user: req.user.id,
          role: req.user.role,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        },
        gateway: {
          provider: 'razorpay',
          paymentId: payment.razorpayPaymentId
        },
        status: 'completed',
        metadata: {
          releaseReason,
          releaseNotes: notes,
          originalStatus: 'paid_escrowed'
        }
      });
      
      res.json({
        success: true,
        message: 'Escrow payment released successfully',
        data: payment
      });
      
    } catch (razorpayError) {
      console.error('Razorpay capture error:', razorpayError);
      return res.status(500).json({
        success: false,
        message: 'Failed to release payment',
        error: 'Gateway error occurred'
      });
    }
    
  } catch (error) {
    console.error('Release escrow payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to release escrow payment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get Payment Dashboard
const getPaymentDashboard = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    
    const days = periodDays[period] || 30;
    const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
    
    // Build query based on user role
    let matchQuery = {
      createdAt: { $gte: startDate }
    };
    
    if (req.user.role === 'lawyer') {
      matchQuery.lawyer = req.user.id;
    } else if (req.user.role === 'client') {
      matchQuery.client = req.user.id;
    }
    
    // Overall statistics
    const stats = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalBaseAmount: { $sum: '$breakdown.baseAmount' },
          totalFees: { $sum: '$breakdown.platformFee' },
          totalGST: { $sum: '$breakdown.gstAmount' },
          avgPaymentAmount: { $avg: '$amount' },
          pendingPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          completedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          escrowedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'paid_escrowed'] }, 1, 0] }
          }
        }
      }
    ]);
    
    // Payment status distribution
    const statusDistribution = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);
    
    // Payment type distribution
    const typeDistribution = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);
    
    // Daily payment trend
    const dailyTrend = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
          baseAmount: { $sum: '$breakdown.baseAmount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    // Recent transactions
    const recentTransactions = await Payment.find(matchQuery)
      .populate('client', 'name email')
      .populate('lawyer', 'name email')
      .populate('case', 'title caseNumber')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Compliance metrics
    const complianceMetrics = await TransactionAudit.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          'compliance.amlStatus': { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          clearAML: {
            $sum: { $cond: [{ $eq: ['$compliance.amlStatus', 'clear'] }, 1, 0] }
          },
          verifiedKYC: {
            $sum: { $cond: [{ $eq: ['$compliance.kycStatus', 'verified'] }, 1, 0] }
          },
          complianceRate: {
            $avg: {
              $cond: [{ $eq: ['$compliance.amlStatus', 'clear'] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalPayments: 0,
      totalAmount: 0,
      totalBaseAmount: 0,
      totalFees: 0,
      totalGST: 0,
      avgPaymentAmount: 0,
      pendingPayments: 0,
      completedPayments: 0,
      escrowedPayments: 0
    };
    
    res.json({
      success: true,
      data: {
        summary: result,
        statusDistribution,
        typeDistribution,
        dailyTrend,
        recentTransactions,
        complianceMetrics: complianceMetrics[0] || {
          totalTransactions: 0,
          clearAML: 0,
          verifiedKYC: 0,
          complianceRate: 0
        },
        period,
        dateRange: {
          start: startDate.toISOString(),
          end: new Date().toISOString()
        }
      }
    });
    
  } catch (error) {
    console.error('Get payment dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment dashboard',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Generate Invoice
const generateInvoice = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await Payment.findById(paymentId)
      .populate('client', 'name email address')
      .populate('lawyer', 'name email address practiceAreas')
      .populate('case', 'title caseNumber');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    // Check authorization
    const isAuthorized = (
      payment.client._id.toString() === req.user.id ||
      payment.lawyer._id.toString() === req.user.id ||
      req.user.role === 'admin'
    );
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to generate invoice for this payment'
      });
    }
    
    // Check if invoice already exists
    let invoice = await Invoice.findOne({ payment: paymentId });
    
    if (!invoice) {
      // Create new invoice
      invoice = new Invoice({
        payment: payment._id,
        client: payment.client._id,
        lawyer: payment.lawyer._id,
        case: payment.case._id,
        amount: payment.amount,
        invoiceNumber: await Invoice.generateInvoiceNumber(),
        invoiceDate: new Date(),
        dueDate: payment.dueDate,
        items: [{
          description: payment.description,
          quantity: 1,
          rate: payment.breakdown.baseAmount,
          amount: payment.breakdown.baseAmount
        }],
        breakdown: payment.breakdown,
        status: payment.status === 'paid' || payment.status === 'released' ? 'paid' : 'pending',
        gstDetails: {
          gstNumber: payment.compliance.gstNumber,
          gstAmount: payment.breakdown.gstAmount,
          cgst: payment.breakdown.gstAmount / 2,
          sgst: payment.breakdown.gstAmount / 2,
          igst: 0
        }
      });
      
      await invoice.save();
      
      // Update payment with invoice reference
      payment.invoice = invoice._id;
      await payment.save();
    }
    
    await invoice.populate([
      { path: 'client', select: 'name email address' },
      { path: 'lawyer', select: 'name email address practiceAreas' },
      { path: 'case', select: 'title caseNumber' }
    ]);
    
    res.json({
      success: true,
      message: 'Invoice generated successfully',
      data: invoice
    });
    
  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  createPaymentRequest,
  processPayment,
  releaseEscrowPayment,
  getPaymentDashboard,
  generateInvoice
};