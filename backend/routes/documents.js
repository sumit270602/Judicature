const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const cloudinary = require('../utils/cloudinary');

// Upload document
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    const { caseId, tags, isPrivate } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: 'auto',
      folder: 'judicature/documents',
      use_filename: true,
      unique_filename: true
    });
    
    // Save document record
    const document = new Document({
      filename: result.public_id,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      cloudinaryUrl: result.secure_url,
      uploadedBy: req.user.id,
      relatedCase: caseId || null,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      isPrivate: isPrivate === 'true'
    });
    
    await document.save();
    await document.populate('uploadedBy', 'name email');
    await document.populate('relatedCase', 'title caseNumber');
    
    res.status(201).json({ 
      success: true, 
      message: 'Document uploaded successfully',
      document 
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ 
      message: 'Error uploading document', 
      error: error.message 
    });
  }
});

// Get user documents
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, caseId, type } = req.query;
    const userId = req.user.id;
    
    let query = { uploadedBy: userId };
    
    // Add filters
    if (caseId) {
      query.relatedCase = caseId;
    }
    
    if (type && type !== 'all') {
      query.mimeType = { $regex: type, $options: 'i' };
    }
    
    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
        { 'aiAnalysis.summary': { $regex: search, $options: 'i' } }
      ];
    }
    
    const documents = await Document.find(query)
      .populate('relatedCase', 'title caseNumber')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Document.countDocuments(query);
    
    res.json({
      success: true,
      documents,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ 
      message: 'Error fetching documents', 
      error: error.message 
    });
  }
});

// Get single document
router.get('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('uploadedBy', 'name email')
      .populate('relatedCase', 'title caseNumber')
      .populate('parentDocument', 'originalName version');
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check permissions
    if (document.uploadedBy._id.toString() !== req.user.id && 
        (!document.relatedCase || 
         (document.relatedCase.lawyer?.toString() !== req.user.id && 
          document.relatedCase.client?.toString() !== req.user.id))) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Track access
    await document.incrementDownload();
    
    res.json({ success: true, document });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ 
      message: 'Error fetching document', 
      error: error.message 
    });
  }
});

// Update document
router.put('/:id', auth, async (req, res) => {
  try {
    const { tags, isPrivate } = req.body;
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check permissions
    if (document.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update fields
    if (tags !== undefined) {
      document.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    if (isPrivate !== undefined) {
      document.isPrivate = isPrivate === 'true';
    }
    
    await document.save();
    await document.populate('relatedCase', 'title caseNumber');
    
    res.json({ 
      success: true, 
      message: 'Document updated successfully',
      document 
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ 
      message: 'Error updating document', 
      error: error.message 
    });
  }
});

// Delete document
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check permissions
    if (document.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(document.filename);
    } catch (cloudinaryError) {
      console.error('Cloudinary deletion error:', cloudinaryError);
      // Continue with database deletion even if Cloudinary fails
    }
    
    // Delete from database
    await Document.findByIdAndDelete(req.params.id);
    
    res.json({ 
      success: true, 
      message: 'Document deleted successfully' 
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ 
      message: 'Error deleting document', 
      error: error.message 
    });
  }
});

// Get case documents
router.get('/case/:caseId', auth, async (req, res) => {
  try {
    const { caseId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // TODO: Add case access permission check
    
    const documents = await Document.find({ relatedCase: caseId })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Document.countDocuments({ relatedCase: caseId });
    
    res.json({
      success: true,
      documents,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get case documents error:', error);
    res.status(500).json({ 
      message: 'Error fetching case documents', 
      error: error.message 
    });
  }
});

// Search documents
router.post('/search', auth, async (req, res) => {
  try {
    const { query, filters = {}, page = 1, limit = 20 } = req.body;
    const userId = req.user.id;
    
    let searchQuery = { uploadedBy: userId };
    
    // Text search
    if (query) {
      searchQuery.$or = [
        { originalName: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
        { 'aiAnalysis.summary': { $regex: query, $options: 'i' } }
      ];
    }
    
    // Apply filters
    if (filters.caseId) {
      searchQuery.relatedCase = filters.caseId;
    }
    
    if (filters.type) {
      searchQuery.mimeType = { $regex: filters.type, $options: 'i' };
    }
    
    if (filters.dateFrom || filters.dateTo) {
      searchQuery.createdAt = {};
      if (filters.dateFrom) {
        searchQuery.createdAt.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        searchQuery.createdAt.$lte = new Date(filters.dateTo);
      }
    }
    
    if (filters.tags && filters.tags.length > 0) {
      searchQuery.tags = { $in: filters.tags };
    }
    
    const documents = await Document.find(searchQuery)
      .populate('relatedCase', 'title caseNumber')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Document.countDocuments(searchQuery);
    
    res.json({
      success: true,
      documents,
      query,
      filters,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Search documents error:', error);
    res.status(500).json({ 
      message: 'Error searching documents', 
      error: error.message 
    });
  }
});

module.exports = router;