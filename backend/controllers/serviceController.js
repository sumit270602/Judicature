
const LegalService = require('../models/LegalService');
const User = require('../models/User');

// Service categories and types mapping
const SERVICE_CATEGORIES = {
  personal_family: {
    name: "Personal / Family",
    services: [
      { type: 'divorce', label: 'Divorce' },
      { type: 'family_dispute', label: 'Family Dispute' },
      { type: 'child_custody', label: 'Child Custody' },
      { type: 'muslim_law', label: 'Muslim Law' },
      { type: 'medical_negligence', label: 'Medical Negligence' },
      { type: 'motor_accident', label: 'Motor Accident' }
    ]
  },
  criminal_property: {
    name: "Criminal / Property",
    services: [
      { type: 'criminal_case', label: 'Criminal Case' },
      { type: 'property_dispute', label: 'Property Dispute' },
      { type: 'landlord_tenant', label: 'Landlord / Tenant' },
      { type: 'cyber_crime', label: 'Cyber Crime' },
      { type: 'wills_trusts', label: 'Wills / Trusts' },
      { type: 'labour_service', label: 'Labour & Service' }
    ]
  },
  civil_debt: {
    name: "Civil / Debt Matters",
    services: [
      { type: 'documentation', label: 'Documentation' },
      { type: 'consumer_court', label: 'Consumer Court' },
      { type: 'civil_case', label: 'Civil Case' },
      { type: 'cheque_bounce', label: 'Cheque Bounce' },
      { type: 'recovery', label: 'Recovery' }
    ]
  },
  corporate_law: {
    name: "Corporate Law",
    services: [
      { type: 'arbitration', label: 'Arbitration' },
      { type: 'trademark_copyright', label: 'Trademark & Copyright' },
      { type: 'customs_excise', label: 'Customs & Central Excise' },
      { type: 'startup_legal', label: 'Startup Legal' },
      { type: 'banking_finance', label: 'Banking / Finance' },
      { type: 'gst_matters', label: 'GST' },
      { type: 'corporate_compliance', label: 'Corporate Compliance' }
    ]
  },
  others: {
    name: "Others",
    services: [
      { type: 'armed_forces_tribunal', label: 'Armed Forces Tribunal' },
      { type: 'supreme_court', label: 'Supreme Court' },
      { type: 'insurance_claims', label: 'Insurance Claims' },
      { type: 'immigration', label: 'Immigration' },
      { type: 'international_law', label: 'International Law' },
      { type: 'other', label: 'Other' }
    ]
  }
};

// Get service categories and types
exports.getServiceCategories = async (req, res) => {
  try {
    res.json({
      categories: SERVICE_CATEGORIES,
      message: 'Service categories retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching service categories:', error);
    res.status(500).json({ 
      message: 'Failed to fetch service categories',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Create a new legal service (Lawyer only)
exports.createService = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    
    // Verify user is a lawyer
    const lawyer = await User.findById(lawyerId);
    if (!lawyer || lawyer.role !== 'lawyer') {
      return res.status(403).json({ message: 'Only lawyers can create services' });
    }
    
    const {
      category,
      serviceType,
      title,
      description,
      pricing,
      estimatedDuration,
      requirements,
      deliverables,
      metrics,
      availability
    } = req.body;
    
    // Validate required fields
    if (!category || !serviceType || !title || !description || !pricing || !estimatedDuration) {
      return res.status(400).json({ 
        message: 'Category, service type, title, description, pricing, and estimated duration are required' 
      });
    }
    
    // Check if lawyer already has this service type
    const existingService = await LegalService.findOne({ 
      lawyer: lawyerId, 
      serviceType,
      isActive: true 
    });
    
    if (existingService) {
      return res.status(400).json({ 
        message: 'You already have an active service for this service type' 
      });
    }
    
    // Create new service
    const newService = new LegalService({
      lawyer: lawyerId,
      category,
      serviceType,
      title,
      description,
      pricing,
      estimatedDuration,
      requirements: requirements || [],
      deliverables: deliverables || [],
      metrics: {
        experienceYears: metrics?.experienceYears || lawyer.experience || 0,
        successRate: metrics?.successRate || 0,
        casesHandled: metrics?.casesHandled || 0,
        rating: metrics?.rating || 0,
        reviewCount: metrics?.reviewCount || 0
      },
      availability: {
        isAcceptingClients: availability?.isAcceptingClients !== false,
        maxCasesPerMonth: availability?.maxCasesPerMonth || 10,
        currentCaseLoad: 0
      }
    });
    
    await newService.save();
    
    // Populate lawyer details for response
    await newService.populate('lawyer', 'name email barCouncilId experience verificationStatus');
    
    res.status(201).json({
      message: 'Service created successfully',
      service: newService
    });
    
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ 
      message: 'Failed to create service',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Get lawyer's services
exports.getLawyerServices = async (req, res) => {
  try {
    const lawyerId = req.params.lawyerId || req.user.id;
    
    const services = await LegalService.find({ lawyer: lawyerId })
      .populate('lawyer', 'name email barCouncilId experience verificationStatus')
      .sort({ isActive: -1, createdAt: -1 });
    
    res.json({
      services,
      count: services.length,
      message: 'Services retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error fetching lawyer services:', error);
    res.status(500).json({ 
      message: 'Failed to fetch services',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Get services by category (Client facing)
exports.getServicesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { minPrice, maxPrice, sortBy = 'rating' } = req.query;
    
    if (!SERVICE_CATEGORIES[category]) {
      return res.status(400).json({ message: 'Invalid service category' });
    }
    
    let query = { category, isActive: true };
    
    // Add price filtering if provided
    if (minPrice || maxPrice) {
      const min = parseInt(minPrice) || 0;
      const max = parseInt(maxPrice) || Number.MAX_SAFE_INTEGER;
      
      query.$or = [
        { 'pricing.type': 'fixed', 'pricing.amount': { $gte: min, $lte: max } },
        { 'pricing.type': 'range', 'pricing.minAmount': { $lte: max }, 'pricing.maxAmount': { $gte: min } },
        { 'pricing.type': 'hourly', 'pricing.hourlyRate': { $gte: min, $lte: max } }
      ];
    }
    
    // Determine sort order
    let sortOptions = {};
    switch (sortBy) {
      case 'price_low':
        sortOptions = { 'pricing.amount': 1, 'pricing.minAmount': 1 };
        break;
      case 'price_high':
        sortOptions = { 'pricing.amount': -1, 'pricing.maxAmount': -1 };
        break;
      case 'experience':
        sortOptions = { 'metrics.experienceYears': -1 };
        break;
      case 'cases':
        sortOptions = { 'metrics.casesHandled': -1 };
        break;
      default: // rating
        sortOptions = { 'metrics.rating': -1, 'metrics.reviewCount': -1 };
    }
    
    const services = await LegalService.find(query)
      .populate('lawyer', 'name email phone barCouncilId experience verificationStatus profilePicture')
      .sort(sortOptions);
    
    // Filter only verified lawyers
    const verifiedServices = services.filter(service => 
      service.lawyer.verificationStatus === 'verified'
    );
    
    res.json({
      category: SERVICE_CATEGORIES[category].name,
      services: verifiedServices,
      count: verifiedServices.length,
      availableServiceTypes: SERVICE_CATEGORIES[category].services,
      message: `Found ${verifiedServices.length} services in ${SERVICE_CATEGORIES[category].name}`
    });
    
  } catch (error) {
    console.error('Error fetching services by category:', error);
    res.status(500).json({ 
      message: 'Failed to fetch services',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Get services by specific service type
exports.getServicesByType = async (req, res) => {
  try {
    const { serviceType } = req.params;
    const { minPrice, maxPrice, sortBy = 'rating' } = req.query;
    
    let query = { serviceType, isActive: true };
    
    // Add price filtering if provided
    if (minPrice || maxPrice) {
      const min = parseInt(minPrice) || 0;
      const max = parseInt(maxPrice) || Number.MAX_SAFE_INTEGER;
      
      query.$or = [
        { 'pricing.type': 'fixed', 'pricing.amount': { $gte: min, $lte: max } },
        { 'pricing.type': 'range', 'pricing.minAmount': { $lte: max }, 'pricing.maxAmount': { $gte: min } },
        { 'pricing.type': 'hourly', 'pricing.hourlyRate': { $gte: min, $lte: max } }
      ];
    }
    
    // Determine sort order
    let sortOptions = {};
    switch (sortBy) {
      case 'price_low':
        sortOptions = { 'pricing.amount': 1, 'pricing.minAmount': 1 };
        break;
      case 'price_high':
        sortOptions = { 'pricing.amount': -1, 'pricing.maxAmount': -1 };
        break;
      case 'experience':
        sortOptions = { 'metrics.experienceYears': -1 };
        break;
      case 'cases':
        sortOptions = { 'metrics.casesHandled': -1 };
        break;
      default: // rating
        sortOptions = { 'metrics.rating': -1, 'metrics.reviewCount': -1 };
    }
    
    const services = await LegalService.find(query)
      .populate('lawyer', 'name email phone barCouncilId experience verificationStatus profilePicture')
      .sort(sortOptions);
    
    // Filter only verified lawyers
    const verifiedServices = services.filter(service => 
      service.lawyer.verificationStatus === 'verified'
    );
    
    res.json({
      serviceType,
      services: verifiedServices,
      count: verifiedServices.length,
      message: `Found ${verifiedServices.length} services for ${serviceType.replace('_', ' ')}`
    });
    
  } catch (error) {
    console.error('Error fetching services by type:', error);
    res.status(500).json({ 
      message: 'Failed to fetch services',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Update service
exports.updateService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const lawyerId = req.user.id;
    const updateData = req.body;
    
    // Find service and verify ownership
    const service = await LegalService.findOne({ _id: serviceId, lawyer: lawyerId });
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found or you do not have permission to update it' });
    }
    
    // Update service
    const updatedService = await LegalService.findByIdAndUpdate(
      serviceId,
      updateData,
      { new: true, runValidators: true }
    ).populate('lawyer', 'name email barCouncilId experience verificationStatus');
    
    res.json({
      message: 'Service updated successfully',
      service: updatedService
    });
    
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ 
      message: 'Failed to update service',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Delete/Deactivate service
exports.deleteService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const lawyerId = req.user.id;
    
    // Find service and verify ownership
    const service = await LegalService.findOne({ _id: serviceId, lawyer: lawyerId });
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found or you do not have permission to delete it' });
    }
    
    // Soft delete by setting isActive to false
    service.isActive = false;
    await service.save();
    
    res.json({
      message: 'Service deactivated successfully'
    });
    
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ 
      message: 'Failed to delete service',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Search services
exports.searchServices = async (req, res) => {
  try {
    const { query, category, minPrice, maxPrice, sortBy = 'rating' } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }
    
    // Build search criteria
    let searchCriteria = {
      isActive: true,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { serviceType: { $regex: query.replace(/\s+/g, '_'), $options: 'i' } }
      ]
    };
    
    // Add category filter if provided
    if (category && SERVICE_CATEGORIES[category]) {
      searchCriteria.category = category;
    }
    
    // Add price filtering if provided
    if (minPrice || maxPrice) {
      const min = parseInt(minPrice) || 0;
      const max = parseInt(maxPrice) || Number.MAX_SAFE_INTEGER;
      
      searchCriteria.$and = [{
        $or: [
          { 'pricing.type': 'fixed', 'pricing.amount': { $gte: min, $lte: max } },
          { 'pricing.type': 'range', 'pricing.minAmount': { $lte: max }, 'pricing.maxAmount': { $gte: min } },
          { 'pricing.type': 'hourly', 'pricing.hourlyRate': { $gte: min, $lte: max } }
        ]
      }];
    }
    
    // Determine sort order
    let sortOptions = {};
    switch (sortBy) {
      case 'price_low':
        sortOptions = { 'pricing.amount': 1, 'pricing.minAmount': 1 };
        break;
      case 'price_high':
        sortOptions = { 'pricing.amount': -1, 'pricing.maxAmount': -1 };
        break;
      case 'experience':
        sortOptions = { 'metrics.experienceYears': -1 };
        break;
      case 'cases':
        sortOptions = { 'metrics.casesHandled': -1 };
        break;
      default: // rating
        sortOptions = { 'metrics.rating': -1, 'metrics.reviewCount': -1 };
    }
    
    const services = await LegalService.find(searchCriteria)
      .populate('lawyer', 'name email phone barCouncilId experience verificationStatus profilePicture')
      .sort(sortOptions)
      .limit(50); // Limit results for performance
    
    // Filter only verified lawyers
    const verifiedServices = services.filter(service => 
      service.lawyer.verificationStatus === 'verified'
    );
    
    res.json({
      query,
      services: verifiedServices,
      count: verifiedServices.length,
      message: `Found ${verifiedServices.length} services matching "${query}"`
    });
    
  } catch (error) {
    console.error('Error searching services:', error);
    res.status(500).json({ 
      message: 'Failed to search services',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Export SERVICE_CATEGORIES for external use
exports.SERVICE_CATEGORIES = SERVICE_CATEGORIES;