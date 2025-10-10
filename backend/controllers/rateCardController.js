
const RateCard = require('../models/RateCard');
const User = require('../models/User');
const TransactionAudit = require('../models/TransactionAudit');
const { validationResult } = require('express-validator');

// Create or Update Rate Card
const createOrUpdateRateCard = async (req, res) => {
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
      serviceType,
      practiceArea,
      baseRate,
      experienceTier,
      title,
      description,
      billingTerms,
      jurisdiction,
      availability,
      complexityMultipliers
    } = req.body;
    
    // Verify lawyer is verified and active
    const lawyer = await User.findById(req.user.id);
    if (!lawyer || lawyer.role !== 'lawyer' || !lawyer.canTakeCases()) {
      return res.status(403).json({
        success: false,
        message: 'Only verified lawyers can set rates'
      });
    }
    
    // Check if rate card already exists for this service type and practice area
    let rateCard = await RateCard.findOne({
      lawyer: req.user.id,
      serviceType,
      practiceArea
    });
    
    if (rateCard) {
      // Update existing rate card
      const oldRate = rateCard.baseRate;
      
      rateCard.baseRate = baseRate;
      rateCard.experienceTier = experienceTier;
      rateCard.title = title;
      rateCard.description = description;
      rateCard.billingTerms = { ...rateCard.billingTerms, ...billingTerms };
      rateCard.jurisdiction = jurisdiction || rateCard.jurisdiction;
      rateCard.availability = { ...rateCard.availability, ...availability };
      rateCard.complexityMultipliers = { ...rateCard.complexityMultipliers, ...complexityMultipliers };
      
      // Add to rate history if rate changed
      if (oldRate !== baseRate) {
        rateCard.rateHistory.push({
          previousRate: oldRate,
          changeDate: new Date(),
          changeReason: 'Rate updated by lawyer',
          updatedBy: req.user.id
        });
      }
      
      await rateCard.save();
      
      // Create audit log
      await TransactionAudit.create({
        transactionId: `RATE_UPDATE_${Date.now()}`,
        payment: null, // No payment associated
        transactionType: 'rate_update',
        amounts: {
          original: oldRate,
          processed: baseRate
        },
        initiatedBy: {
          user: req.user.id,
          role: 'lawyer',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        },
        gateway: {
          provider: 'manual'
        },
        status: 'completed',
        metadata: {
          rateCardId: rateCard._id,
          serviceType,
          practiceArea
        }
      });
      
    } else {
      // Create new rate card
      rateCard = new RateCard({
        lawyer: req.user.id,
        serviceType,
        practiceArea,
        baseRate,
        experienceTier,
        title,
        description,
        billingTerms,
        jurisdiction,
        availability,
        complexityMultipliers: complexityMultipliers || {
          simple: 1.0,
          moderate: 1.5,
          complex: 2.0
        },
        compliance: {
          gstApplicable: true,
          gstPercentage: 18,
          hsnCode: '9991',
          stateBarCouncil: lawyer.stateBarCouncil || 'Delhi',
          practiceRegistrationNumber: lawyer.barCouncilId
        }
      });
      
      await rateCard.save();
      
      // Create audit log
      await TransactionAudit.create({
        transactionId: `RATE_CREATE_${Date.now()}`,
        payment: null,
        transactionType: 'rate_creation',
        amounts: {
          original: 0,
          processed: baseRate
        },
        initiatedBy: {
          user: req.user.id,
          role: 'lawyer',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        },
        gateway: {
          provider: 'manual'
        },
        status: 'completed',
        metadata: {
          rateCardId: rateCard._id,
          serviceType,
          practiceArea
        }
      });
    }
    
    await rateCard.populate('lawyer', 'name email practiceAreas experience verificationStatus');
    
    res.json({
      success: true,
      message: rateCard.isNew ? 'Rate card created successfully' : 'Rate card updated successfully',
      data: rateCard
    });
    
  } catch (error) {
    console.error('Rate card creation/update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create/update rate card',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get Lawyer's Rate Cards
const getLawyerRateCards = async (req, res) => {
  try {
    const { page = 1, limit = 10, practiceArea, serviceType, isActive } = req.query;
    const lawyerId = req.params.lawyerId || req.user.id;
    
    // Build query
    const query = { lawyer: lawyerId };
    if (practiceArea) query.practiceArea = practiceArea;
    if (serviceType) query.serviceType = serviceType;
    if (isActive !== undefined) query['availability.isActive'] = isActive === 'true';
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: {
        path: 'lawyer',
        select: 'name email practiceAreas experience verificationStatus rating'
      }
    };
    
    const rateCards = await RateCard.paginate(query, options);
    
    res.json({
      success: true,
      data: rateCards.docs,
      pagination: {
        currentPage: rateCards.page,
        totalPages: rateCards.totalPages,
        totalItems: rateCards.totalDocs,
        itemsPerPage: rateCards.limit,
        hasNextPage: rateCards.hasNextPage,
        hasPrevPage: rateCards.hasPrevPage
      }
    });
    
  } catch (error) {
    console.error('Get rate cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rate cards',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Search Rate Cards (Client View)
const searchRateCards = async (req, res) => {
  try {
    const {
      practiceArea,
      serviceType,
      minRate,
      maxRate,
      experienceTier,
      jurisdiction,
      sortBy = 'baseRate',
      sortOrder = 'asc',
      page = 1,
      limit = 20,
      search
    } = req.query;
    
    // Build search query
    const query = {
      'availability.isActive': true
    };
    
    if (practiceArea) query.practiceArea = practiceArea;
    if (serviceType) query.serviceType = serviceType;
    if (experienceTier) query.experienceTier = experienceTier;
    if (jurisdiction) query.jurisdiction = { $in: [jurisdiction, 'all_india'] };
    
    // Rate range filter
    if (minRate || maxRate) {
      query.baseRate = {};
      if (minRate) query.baseRate.$gte = parseFloat(minRate);
      if (maxRate) query.baseRate.$lte = parseFloat(maxRate);
    }
    
    // Text search
    if (search) {
      query.$text = { $search: search };
    }
    
    // Sort options
    const sortOptions = {};
    if (search) {
      sortOptions.score = { $meta: 'textScore' };
    }
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sortOptions,
      populate: [
        {
          path: 'lawyer',
          select: 'name email practiceAreas experience verificationStatus rating profilePicture'
        }
      ]
    };
    
    const rateCards = await RateCard.paginate(query, options);
    
    // Add calculated ratings and metrics
    const enrichedRateCards = rateCards.docs.map(card => {
      const cardObj = card.toObject();
      cardObj.calculatedRates = {
        simple: card.calculateRate('simple', 1),
        moderate: card.calculateRate('moderate', 1),
        complex: card.calculateRate('complex', 1)
      };
      cardObj.isAvailable = card.isAvailable();
      return cardObj;
    });
    
    res.json({
      success: true,
      data: enrichedRateCards,
      pagination: {
        currentPage: rateCards.page,
        totalPages: rateCards.totalPages,
        totalItems: rateCards.totalDocs,
        itemsPerPage: rateCards.limit,
        hasNextPage: rateCards.hasNextPage,
        hasPrevPage: rateCards.hasPrevPage
      },
      filters: {
        practiceAreas: await RateCard.getPopularPracticeAreas(),
        rateRanges: practiceArea ? await RateCard.getRateRanges(practiceArea) : null
      }
    });
    
  } catch (error) {
    console.error('Search rate cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search rate cards',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get Rate Card Details with Reviews
const getRateCardDetails = async (req, res) => {
  try {
    const { rateCardId } = req.params;
    
    const rateCard = await RateCard.findById(rateCardId)
      .populate('lawyer', 'name email practiceAreas experience verificationStatus rating profilePicture')
      .populate('reviews.client', 'name profilePicture');
    
    if (!rateCard) {
      return res.status(404).json({
        success: false,
        message: 'Rate card not found'
      });
    }
    
    // Check if it's active and available
    if (!rateCard.availability.isActive) {
      return res.status(410).json({
        success: false,
        message: 'This rate card is no longer active'
      });
    }
    
    const rateCardObj = rateCard.toObject();
    rateCardObj.calculatedRates = {
      simple: rateCard.calculateRate('simple', 1),
      moderate: rateCard.calculateRate('moderate', 1),
      complex: rateCard.calculateRate('complex', 1)
    };
    rateCardObj.isAvailable = rateCard.isAvailable();
    
    res.json({
      success: true,
      data: rateCardObj
    });
    
  } catch (error) {
    console.error('Get rate card details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rate card details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Bulk Update Rate Cards
const bulkUpdateRateCards = async (req, res) => {
  try {
    const { rateCardIds, updates } = req.body;
    
    if (!rateCardIds || !Array.isArray(rateCardIds) || rateCardIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rate card IDs are required'
      });
    }
    
    // Verify all rate cards belong to the lawyer
    const rateCards = await RateCard.find({
      _id: { $in: rateCardIds },
      lawyer: req.user.id
    });
    
    if (rateCards.length !== rateCardIds.length) {
      return res.status(403).json({
        success: false,
        message: 'Some rate cards do not belong to you'
      });
    }
    
    // Perform bulk update
    const result = await RateCard.updateMany(
      {
        _id: { $in: rateCardIds },
        lawyer: req.user.id
      },
      { $set: updates },
      { runValidators: true }
    );
    
    // Create audit log for bulk update
    await TransactionAudit.create({
      transactionId: `BULK_RATE_UPDATE_${Date.now()}`,
      payment: null,
      transactionType: 'bulk_rate_update',
      amounts: {
        original: rateCards.length,
        processed: result.modifiedCount
      },
      initiatedBy: {
        user: req.user.id,
        role: 'lawyer',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      gateway: {
        provider: 'manual'
      },
      status: 'completed',
      metadata: {
        rateCardIds,
        updates,
        modifiedCount: result.modifiedCount
      }
    });
    
    res.json({
      success: true,
      message: `${result.modifiedCount} rate cards updated successfully`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount
      }
    });
    
  } catch (error) {
    console.error('Bulk update rate cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update rate cards',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Delete Rate Card
const deleteRateCard = async (req, res) => {
  try {
    const { rateCardId } = req.params;
    
    const rateCard = await RateCard.findOne({
      _id: rateCardId,
      lawyer: req.user.id
    });
    
    if (!rateCard) {
      return res.status(404).json({
        success: false,
        message: 'Rate card not found'
      });
    }
    
    // Soft delete by setting as inactive
    rateCard.availability.isActive = false;
    await rateCard.save();
    
    // Create audit log
    await TransactionAudit.create({
      transactionId: `RATE_DELETE_${Date.now()}`,
      payment: null,
      transactionType: 'rate_deletion',
      amounts: {
        original: rateCard.baseRate,
        processed: 0
      },
      initiatedBy: {
        user: req.user.id,
        role: 'lawyer',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      gateway: {
        provider: 'manual'
      },
      status: 'completed',
      metadata: {
        rateCardId: rateCard._id,
        serviceType: rateCard.serviceType,
        practiceArea: rateCard.practiceArea
      }
    });
    
    res.json({
      success: true,
      message: 'Rate card deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete rate card error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete rate card',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Add Review to Rate Card
const addRateCardReview = async (req, res) => {
  try {
    const { rateCardId } = req.params;
    const { rating, comment, caseReference } = req.body;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    // Check if client has already reviewed this rate card
    const rateCard = await RateCard.findById(rateCardId);
    if (!rateCard) {
      return res.status(404).json({
        success: false,
        message: 'Rate card not found'
      });
    }
    
    const existingReview = rateCard.reviews.find(
      review => review.client.toString() === req.user.id
    );
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this lawyer for this service'
      });
    }
    
    // Add review
    rateCard.reviews.push({
      client: req.user.id,
      rating,
      comment,
      caseReference,
      reviewDate: new Date(),
      isVerified: false // Will be verified by admin
    });
    
    await rateCard.save();
    
    res.json({
      success: true,
      message: 'Review added successfully',
      data: {
        averageRating: rateCard.averageRating,
        totalReviews: rateCard.totalReviews
      }
    });
    
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add review',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get Rate Comparison Data
const getRateComparison = async (req, res) => {
  try {
    const { practiceArea, serviceType, rateCardIds } = req.query;
    
    let query = {};
    
    if (rateCardIds) {
      // Compare specific rate cards
      query._id = { $in: rateCardIds.split(',') };
    } else {
      // Compare by practice area and service type
      if (!practiceArea || !serviceType) {
        return res.status(400).json({
          success: false,
          message: 'Practice area and service type are required for comparison'
        });
      }
      
      query = {
        practiceArea,
        serviceType,
        'availability.isActive': true
      };
    }
    
    const rateCards = await RateCard.find(query)
      .populate('lawyer', 'name email experience verificationStatus rating')
      .sort({ baseRate: 1 })
      .limit(10);
    
    if (rateCards.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No rate cards found for comparison'
      });
    }
    
    // Prepare comparison data
    const comparisonData = rateCards.map(card => ({
      rateCardId: card._id,
      lawyer: card.lawyer,
      baseRate: card.baseRate,
      experienceTier: card.experienceTier,
      averageRating: card.averageRating,
      totalReviews: card.totalReviews,
      successRate: card.metrics.successRate,
      calculatedRates: {
        simple: card.calculateRate('simple', 1),
        moderate: card.calculateRate('moderate', 1),
        complex: card.calculateRate('complex', 1)
      },
      billingTerms: card.billingTerms,
      availability: card.availability,
      isAvailable: card.isAvailable()
    }));
    
    // Calculate statistics
    const rates = comparisonData.map(c => c.baseRate);
    const statistics = {
      minRate: Math.min(...rates),
      maxRate: Math.max(...rates),
      avgRate: Math.round(rates.reduce((a, b) => a + b, 0) / rates.length),
      medianRate: rates.sort((a, b) => a - b)[Math.floor(rates.length / 2)]
    };
    
    res.json({
      success: true,
      data: {
        comparison: comparisonData,
        statistics,
        practiceArea,
        serviceType
      }
    });
    
  } catch (error) {
    console.error('Rate comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get rate comparison',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  createOrUpdateRateCard,
  getLawyerRateCards,
  searchRateCards,
  getRateCardDetails,
  bulkUpdateRateCards,
  deleteRateCard,
  addRateCardReview,
  getRateComparison
};