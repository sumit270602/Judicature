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
            console.log('Could not fetch service pricing:', serviceError.message);
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
          console.log(`Duplicate case number, retrying with: ${caseNumber}`);
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
    let query = {};
    
    // Filter cases based on user role
    if (req.user.role === 'client') {
      query.client = req.user.id;
    } else if (req.user.role === 'lawyer') {
      query.lawyer = req.user.id;
    }
    // Admin can see all cases (no filter)
    
    const cases = await Case.find(query)
      .populate('client', 'name email role')
      .populate('lawyer', 'name email role')
      .sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      cases,
      count: cases.length 
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
    const caseItem = await Case.findById(req.params.id);
    
    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    // Only admin or case client can delete
    const hasPermission = 
      req.user.role === 'admin' ||
      caseItem.client.toString() === req.user.id;
    
    if (!hasPermission) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await Case.findByIdAndDelete(req.params.id);
    
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

    // Populate lawyer details for response
    await caseItem.populate('lawyer', 'name email practiceAreas experience verificationStatus');

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