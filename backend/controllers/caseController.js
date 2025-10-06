const Case = require('../models/Case');
const Counter = require('../models/Counter');
const { updateLawyerVector } = require('./recommendationController');

exports.createCase = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      caseType, 
      lawyer, 
      priority,
      // Service-based fields
      selectedService,
      serviceCategory,
      serviceType
    } = req.body;
    
    // Validation
    if (!title || !description || !caseType) {
      return res.status(400).json({ message: 'Please provide title, description, and case type' });
    }

    // If a lawyer is assigned, check their verification status
    if (lawyer) {
      const User = require('../models/User');
      const assignedLawyer = await User.findById(lawyer);
      
      if (!assignedLawyer || assignedLawyer.role !== 'lawyer') {
        return res.status(400).json({ message: 'Invalid lawyer assignment' });
      }
      
      if (!assignedLawyer.canTakeCases()) {
        return res.status(400).json({ 
          message: 'Cannot assign case to unverified lawyer',
          lawyerVerificationStatus: assignedLawyer.verificationStatus
        });
      }
    }

    // Generate unique case number with retry mechanism
    const year = new Date().getFullYear();
    let caseNumber;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      try {
        // Try atomic counter first
        const sequenceNumber = await Counter.getNextSequence(`case_${year}`);
        caseNumber = `CASE-${year}-${sequenceNumber.toString().padStart(4, '0')}`;
        
        // Check if this case number already exists
        const existingCase = await Case.findOne({ caseNumber });
        if (existingCase) {
          attempts++;
          continue; // Try next number
        }
        
        break; // Found unique number
        
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          // Fallback to timestamp-based unique number
          const timestamp = Date.now().toString().slice(-8);
          const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          caseNumber = `CASE-${year}-${timestamp}${random}`;
          break;
        }
      }
    }

    // Create and save case with final duplicate check
    let newCase;
    let saveAttempts = 0;
    const maxSaveAttempts = 3;

    while (saveAttempts < maxSaveAttempts) {
      try {
        // Prepare case data
        const caseData = {
          caseNumber,
          title: title.trim(),
          description: description.trim(),
          caseType,
          client: req.user.id,
          lawyer: lawyer || undefined,
          priority: priority || 'medium'
        };

        // Add service-based fields if provided
        if (selectedService) {
          caseData.selectedService = selectedService;
        }
        if (serviceCategory) {
          caseData.serviceCategory = serviceCategory;
        }
        if (serviceType) {
          caseData.serviceType = serviceType;
        }

        // If service is selected, try to get pricing information
        if (selectedService) {
          try {
            const LegalService = require('../models/LegalService');
            const service = await LegalService.findById(selectedService);
            if (service) {
              caseData.agreedPricing = service.pricing;
            }
          } catch (serviceError) {
            // Continue without pricing info
          }
        }

        newCase = new Case(caseData);
        
        await newCase.save();
        break; // Success
        
      } catch (error) {
        if (error.code === 11000 && saveAttempts < maxSaveAttempts - 1) {
          // Still a duplicate, generate new number
          saveAttempts++;
          const timestamp = Date.now().toString().slice(-8);
          const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          caseNumber = `CASE-${year}-T${timestamp}${random}`;
          continue;
        } else {
          throw error; // Re-throw if not duplicate or max attempts reached
        }
      }
    }

    if (!newCase) {
      return res.status(500).json({ message: 'Failed to create case after multiple attempts' });
    }
    
    // Populate the response
    const populatedCase = await Case.findById(newCase._id)
      .populate('client', 'name email role')
      .populate('lawyer', 'name email role verificationStatus');
    
    // Create notification for case creation
    const Notification = require('../models/Notification');
    
    // Notify client
    const clientNotification = new Notification({
      recipient: populatedCase.client._id,
      type: 'system',
      title: 'Case Created Successfully',
      message: `Your case "${populatedCase.title}" has been created${populatedCase.lawyer ? ` and assigned to ${populatedCase.lawyer.name}` : ' and is awaiting lawyer assignment'}.`,
      relatedCase: populatedCase._id,
      priority: 'medium',
      actionRequired: false,
      actionUrl: `/case/${populatedCase._id}/view`
    });
    
    await clientNotification.save();
    
    // Notify lawyer if assigned
    if (populatedCase.lawyer) {
      const lawyerNotification = new Notification({
        recipient: populatedCase.lawyer._id,
        type: 'system',
        title: 'New Case Assigned',
        message: `A new case "${populatedCase.title}" has been assigned to you by ${populatedCase.client.name}.`,
        relatedCase: populatedCase._id,
        priority: 'high',
        actionRequired: true,
        actionUrl: `/case/${populatedCase._id}/view`
      });
      
      await lawyerNotification.save();
    }
    
    res.status(201).json({ 
      success: true, 
      case: populatedCase,
      verificationInfo: req.verificationInfo
    });
  } catch (err) {
    console.error('Create case error:', err);
    res.status(500).json({ message: 'Server error while creating case' });
  }
};

exports.getCases = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      priority, 
      caseType, 
      search 
    } = req.query;

    let query = {};
    
    // Filter cases based on user role
    if (req.user.role === 'client') {
      query.client = req.user.id;
    } else if (req.user.role === 'lawyer') {
      query.lawyer = req.user.id;
    }
    // Admin can see all cases (no filter)

    // Apply additional filters
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    
    if (caseType && caseType !== 'all') {
      query.caseType = caseType;
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { caseNumber: { $regex: search, $options: 'i' } },
        { caseType: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const total = await Case.countDocuments(query);
    
    const cases = await Case.find(query)
      .populate('client', 'name email role')
      .populate('lawyer', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    res.json({ 
      cases,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error('Get cases error:', err);
    res.status(500).json({ message: 'Server error while fetching cases' });
  }
};

exports.getCaseById = async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id)
      .populate('client', 'name email role phone address')
      .populate('lawyer', 'name email role phone practiceAreas experience')
      .populate('notes.addedBy', 'name role')
      .populate('documents');
    
    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    // Check if user has permission to view this case
    const hasPermission = 
      req.user.role === 'admin' ||
      caseItem.client._id.toString() === req.user.id ||
      (caseItem.lawyer && caseItem.lawyer._id.toString() === req.user.id);
    
    if (!hasPermission) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json({ 
      success: true, 
      case: caseItem 
    });
  } catch (err) {
    console.error('Get case by ID error:', err);
    res.status(500).json({ message: 'Server error while fetching case' });
  }
};

exports.updateCase = async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    
    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    // Check permissions
    const hasPermission = 
      req.user.role === 'admin' ||
      caseItem.client.toString() === req.user.id ||
      (caseItem.lawyer && caseItem.lawyer.toString() === req.user.id);
    
    if (!hasPermission) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Invalid request body' });
    }
    
    // Update allowed fields
    const allowedUpdates = ['title', 'description', 'status', 'priority', 'nextHearingDate', 'lawyer'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    // Check if there are any updates to apply
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update' });
    }
    
    const updated = await Case.findByIdAndUpdate(
      req.params.id, 
      updates, 
      { new: true, runValidators: true }
    ).populate('client lawyer', 'name email role');
    
    // Auto-create payment request if case is marked as completed/closed with agreed pricing
    if ((updates.status === 'closed' || updates.status === 'completed') && updated.lawyer && updated.agreedPricing) {
      try {
        await this.createAutoPaymentRequest(updated);
      } catch (paymentError) {
        console.error('Error creating automatic payment request:', paymentError);
        // Don't fail the case update if payment request creation fails
      }
    }

    // Update lawyer's Redis vector if case status changed to "closed" and lawyer won
    if (updates.status === 'closed' && updated.lawyer) {
      try {
        const User = require('../models/User');
        const lawyer = await User.findById(updated.lawyer._id);
        if (lawyer && lawyer.role === 'lawyer') {
          // Increment cases won count
          lawyer.casesWon = (lawyer.casesWon || 0) + 1;
          await lawyer.save();
          
          // Update Redis vector with new case count
          await updateLawyerVector(lawyer._id.toString(), lawyer);
        }
      } catch (vectorError) {
        console.error('Error updating lawyer vector after case win:', vectorError);
      }
    }
    
    res.json({ 
      success: true, 
      case: updated 
    });
  } catch (err) {
    console.error('Update case error:', err);
    res.status(500).json({ message: 'Server error while updating case' });
  }
};

exports.deleteCase = async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id)
      .populate('client lawyer', 'name email role');
    
    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    // Only admin or case client can delete
    const hasPermission = 
      req.user.role === 'admin' ||
      caseItem.client._id.toString() === req.user.id;
    
    if (!hasPermission) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Store case info before deletion
    const caseTitle = caseItem.title;
    const caseNumber = caseItem.caseNumber;
    const clientId = caseItem.client._id;
    const lawyerId = caseItem.lawyer?._id;
    const lawyerName = caseItem.lawyer?.name;
    const clientName = caseItem.client.name;
    
    await Case.findByIdAndDelete(req.params.id);
    
    // Create notification for lawyer if assigned
    if (lawyerId) {
      const Notification = require('../models/Notification');
      const lawyerNotification = new Notification({
        recipient: lawyerId,
        type: 'system',
        title: 'Case Deleted',
        message: `Case "${caseTitle}" (${caseNumber}) has been deleted by ${clientName}.`,
        priority: 'medium',
        actionRequired: false
      });
      
      await lawyerNotification.save();
    }
    
    res.json({ 
      success: true, 
      message: 'Case deleted successfully' 
    });
  } catch (err) {
    console.error('Delete case error:', err);
    res.status(500).json({ message: 'Server error while deleting case' });
  }
};

// Assign lawyer to a case
exports.assignLawyer = async (req, res) => {
  try {
    const { lawyerId } = req.body;
    const caseId = req.params.id;

    if (!lawyerId) {
      return res.status(400).json({ message: 'Lawyer ID is required' });
    }

    // Find the case
    const caseItem = await Case.findById(caseId);
    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // Check if user has permission to assign lawyer to this case
    const hasPermission = req.user.role === 'admin' || 
      (req.user.role === 'client' && caseItem.client.toString() === req.user.id);
    
    if (!hasPermission) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Verify the lawyer
    const User = require('../models/User');
    const lawyer = await User.findById(lawyerId);
    
    if (!lawyer || lawyer.role !== 'lawyer') {
      return res.status(400).json({ message: 'Invalid lawyer selection' });
    }
    
    if (!lawyer.canTakeCases()) {
      return res.status(400).json({ 
        message: 'Cannot assign case to unverified lawyer',
        lawyerVerificationStatus: lawyer.verificationStatus
      });
    }

    // Assign the lawyer to the case
    caseItem.lawyer = lawyerId;
    caseItem.status = 'assigned';
    await caseItem.save();

    // Populate lawyer and client details for notifications
    await caseItem.populate('lawyer client', 'name email practiceAreas experience verificationStatus');

    // Create notifications for lawyer assignment
    const Notification = require('../models/Notification');
    
    // Notify the lawyer
    const lawyerNotification = new Notification({
      recipient: lawyerId,
      type: 'system',
      title: 'New Case Assigned',
      message: `You have been assigned to case "${caseItem.title}" by ${caseItem.client.name}.`,
      relatedCase: caseItem._id,
      priority: 'high',
      actionRequired: true,
      actionUrl: `/case/${caseItem._id}/view`
    });
    
    await lawyerNotification.save();
    
    // Notify the client
    const clientNotification = new Notification({
      recipient: caseItem.client._id,
      type: 'system',
      title: 'Lawyer Assigned',
      message: `${caseItem.lawyer.name} has been assigned to your case "${caseItem.title}".`,
      relatedCase: caseItem._id,
      priority: 'medium',
      actionRequired: false,
      actionUrl: `/case/${caseItem._id}/view`
    });
    
    await clientNotification.save();

    res.json({
      success: true,
      message: 'Lawyer assigned successfully',
      case: caseItem
    });

  } catch (err) {
    console.error('Assign lawyer error:', err);
    res.status(500).json({ message: 'Server error while assigning lawyer' });
  }
};

// Helper method to create automatic payment request when case is completed
exports.createAutoPaymentRequest = async (caseItem) => {
  try {
    const PaymentRequest = require('../models/PaymentRequest');
    const Notification = require('../models/Notification');
    const notificationService = require('../utils/notificationService');

    // Validate required data
    if (!caseItem.lawyer || !caseItem.client) {
      console.log(`Case ${caseItem.caseNumber}: Missing lawyer or client, skipping auto payment request`);
      return;
    }

    // Determine payment amount - use agreed pricing if available, otherwise default to 0
    const paymentAmount = caseItem.agreedPricing?.amount || 0;
    const currency = caseItem.agreedPricing?.currency || 'INR';
    
    console.log(`Case ${caseItem.caseNumber}: Creating payment request with amount: ${paymentAmount} ${currency}`);

    // Check if payment request already exists for this case
    const existingRequest = await PaymentRequest.findOne({
      'metadata.caseId': caseItem._id,
      status: { $nin: ['cancelled', 'rejected'] }
    });

    if (existingRequest) {
      console.log(`Case ${caseItem.caseNumber}: Payment request already exists, skipping`);
      return;
    }

    // Determine service type from case type or service type
    const serviceType = caseItem.serviceType || caseItem.caseType || 'other';
    const validServiceTypes = ['consultation', 'document_review', 'contract_drafting', 'legal_research', 'court_representation', 'legal_notice', 'other'];
    const finalServiceType = validServiceTypes.includes(serviceType) ? serviceType : 'other';

    // Create payment request description
    const description = `Payment for completed legal work on case: ${caseItem.title}. ${caseItem.description}`;

    // Generate unique requestId manually to avoid middleware issues
    const count = await PaymentRequest.countDocuments();
    const requestId = `PAY-${String(count + 1).padStart(6, '0')}`;

    // Create the payment request
    const paymentRequest = new PaymentRequest({
      requestId: requestId,
      lawyer: caseItem.lawyer._id,
      client: caseItem.client._id,
      amount: paymentAmount,
      currency: currency,
      serviceType: finalServiceType,
      description: description.substring(0, 500), // Limit to 500 chars
      metadata: {
        caseId: caseItem._id,
        urgency: caseItem.priority === 'high' ? 'high' : 'medium',
        estimatedDeliveryDays: 1, // Work already completed
        autoGenerated: true
      },
      lawyerNotes: `Auto-generated payment request for completed case: ${caseItem.caseNumber}${paymentAmount === 0 ? ' (No agreed pricing - amount set to 0)' : ''}`
    });

    await paymentRequest.save();

    // Populate lawyer and client info for notifications
    await paymentRequest.populate('lawyer client', 'name email role');

    // Create notification for client
    const paymentAmountDisplay = paymentAmount === 0 
      ? 'Review and confirm payment amount' 
      : `₹${paymentAmount.toLocaleString()}`;
      
    const notification = new Notification({
      recipient: caseItem.client._id,
      type: 'payment',
      title: 'Work Completed - Payment Request',
      message: `${paymentRequest.lawyer.name} has completed work on "${caseItem.title}" and ${paymentAmount === 0 ? 'submitted work for review. Please confirm payment amount.' : `requested payment of ${paymentAmountDisplay}`}`,
      relatedCase: caseItem._id,
      priority: 'high',
      actionRequired: true,
      actionUrl: `/dashboard/payments`,
      metadata: {
        paymentRequestId: paymentRequest._id,
        requestId: paymentRequest.requestId,
        amount: paymentRequest.amount,
        totalAmount: paymentRequest.totalAmount,
        serviceType: paymentRequest.serviceType,
        lawyerName: paymentRequest.lawyer.name,
        caseNumber: caseItem.caseNumber,
        caseTitle: caseItem.title,
        autoGenerated: true
      }
    });

    await notification.save();

    // Send real-time notification
    if (notificationService && notificationService.sendToUser) {
      notificationService.sendToUser(caseItem.client._id, {
        type: 'payment_request',
        title: 'Work Completed - Payment Request',
        message: `${paymentRequest.lawyer.name} has completed work on your case "${caseItem.title}"`,
        data: {
          requestId: paymentRequest.requestId,
          amount: paymentRequest.amount,
          caseNumber: caseItem.caseNumber,
          autoGenerated: true
        }
      });
    }

    // Send email notification (if configured)
    try {
      if (notificationService && notificationService.sendEmail) {
        await notificationService.sendEmail({
          to: paymentRequest.client.email,
          subject: `Work Completed - Payment Request from ${paymentRequest.lawyer.name}`,
          template: 'case-completion-payment-request',
          data: {
            clientName: paymentRequest.client.name,
            lawyerName: paymentRequest.lawyer.name,
            caseNumber: caseItem.caseNumber,
            caseTitle: caseItem.title,
            amount: paymentRequest.amount,
            totalAmount: paymentRequest.totalAmount,
            requestId: paymentRequest.requestId,
            paymentUrl: `${process.env.FRONTEND_URL}/payments/request/${paymentRequest.requestId}`
          }
        });
      }
    } catch (emailError) {
      console.error('Failed to send completion payment request email:', emailError);
      // Don't fail the process if email fails
    }

    console.log(`✅ Auto payment request created for case ${caseItem.caseNumber}: ${paymentRequest.requestId}`);
    return paymentRequest;

  } catch (error) {
    console.error('Error creating auto payment request:', error);
    throw error;
  }
};

// Resolve case with work proof and trigger payment
exports.resolveCase = async (req, res) => {
  try {
    const caseId = req.params.id;
    const { workProofDescription, resolvedAt } = req.body;
    
    // Find the case
    const caseItem = await Case.findById(caseId);
    if (!caseItem) {
      return res.status(404).json({ 
        success: false,
        message: 'Case not found' 
      });
    }
    
    // Check if user is the assigned lawyer
    if (!caseItem.lawyer || caseItem.lawyer.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Only the assigned lawyer can resolve this case' 
      });
    }
    
    // Check if case is in a valid state to be resolved
    if (caseItem.status === 'resolved' || caseItem.status === 'completed') {
      return res.status(400).json({ 
        success: false,
        message: 'Case is already resolved or completed' 
      });
    }
    
    // Check if there's a work proof document uploaded
    if (!caseItem.workProof || !caseItem.workProof.documentId) {
      return res.status(400).json({ 
        success: false,
        message: 'Please upload work completion proof before resolving the case' 
      });
    }
    
    // Update case status to resolved (work proof is already stored in case from upload)
    const updatedCase = await Case.findByIdAndUpdate(
      caseId,
      {
        status: 'resolved',
        resolvedAt: resolvedAt || new Date(),
        progress: 100
      },
      { new: true, runValidators: true }
    ).populate('client lawyer', 'name email role');
    
    // Create automatic payment request for all resolved cases
    let paymentRequest = null;
    try {
      paymentRequest = await this.createAutoPaymentRequest(updatedCase);
    } catch (paymentError) {
      console.error('Error creating automatic payment request:', paymentError);
      // Continue even if payment request creation fails
    }
    
    // Create notification for client
    const Notification = require('../models/Notification');
    const notification = new Notification({
      recipient: updatedCase.client._id,
      type: 'system',
      title: 'Case Work Completed',
      message: `${updatedCase.lawyer.name} has completed work on case "${updatedCase.title}" and submitted proof of completion.${paymentRequest ? ' A payment request has been generated.' : ''}`,
      relatedCase: updatedCase._id,
      priority: 'high',
      actionRequired: paymentRequest ? true : false,
      actionUrl: paymentRequest ? `/dashboard/payments` : null
    });
    
    await notification.save();
    
    res.json({
      success: true,
      message: paymentRequest 
        ? 'Case resolved successfully and payment request generated'
        : 'Case resolved successfully',
      case: updatedCase,
      paymentRequest: paymentRequest ? {
        id: paymentRequest._id,
        requestId: paymentRequest.requestId,
        amount: paymentRequest.amount,
        totalAmount: paymentRequest.totalAmount
      } : null
    });
    
  } catch (error) {
    console.error('Error resolving case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve case',
      error: error.message
    });
  }
};

// Upload work completion proof
exports.uploadWorkProof = async (req, res) => {
  try {
    const caseId = req.params.id;
    const { description } = req.body;
    
    // Find the case
    const caseItem = await Case.findById(caseId);
    if (!caseItem) {
      return res.status(404).json({ 
        success: false,
        message: 'Case not found' 
      });
    }
    
    // Check if user is the assigned lawyer
    if (!caseItem.lawyer || caseItem.lawyer.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Only the assigned lawyer can upload work proof' 
      });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded' 
      });
    }
    
    // Create document record with file buffer (memory storage)
    const Document = require('../models/Document');
    
    // Generate unique filename to avoid duplicates
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = req.file.originalname.split('.').pop();
    const uniqueFileName = `${caseItem.caseNumber}_work_proof_${timestamp}_${randomString}.${fileExtension}`;
    
    const document = new Document({
      fileName: uniqueFileName, // Use unique filename to avoid duplicates
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      fileData: req.file.buffer, // Use buffer from memory storage
      documentType: 'work_proof',
      uploadedBy: req.user.id,
      relatedCase: caseId,
      status: 'approved', // Work proof is automatically approved
      tags: ['work_proof', 'case_completion']
    });
    
    try {
      await document.save();
    } catch (saveError) {
      // Handle duplicate key error by generating a new unique filename
      if (saveError.code === 11000 && saveError.keyPattern && saveError.keyPattern.fileName) {
        console.log('Duplicate filename detected, generating new unique filename...');
        const newTimestamp = Date.now();
        const newRandomString = Math.random().toString(36).substring(2, 12);
        const newFileExtension = req.file.originalname.split('.').pop();
        document.fileName = `${caseItem.caseNumber}_work_proof_${newTimestamp}_${newRandomString}.${newFileExtension}`;
        await document.save();
      } else {
        throw saveError;
      }
    }
    
    // Update case with work proof reference
    caseItem.workProof = {
      documentId: document._id,
      uploadedAt: new Date(),
      description: description || 'Work completion proof'
    };
    
    // Add document to case documents array if not already present
    if (!caseItem.documents.includes(document._id)) {
      caseItem.documents.push(document._id);
    }
    
    await caseItem.save();
    
    res.json({
      success: true,
      message: 'Work proof uploaded successfully',
      document: {
        id: document._id,
        name: document.originalName,
        uploadedAt: document.createdAt,
        description: description || 'Work completion proof'
      }
    });
    
  } catch (error) {
    console.error('Error uploading work proof:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload work proof',
      error: error.message
    });
  }
}; 