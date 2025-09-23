const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const Document = require('../models/Document');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Global search endpoint
router.post('/global', auth, async (req, res) => {
  try {
    const { query, type, filters = {}, page = 1, limit = 20 } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ 
        message: 'Search query must be at least 2 characters' 
      });
    }
    
    const searchQuery = query.trim();
    let results = [];
    
    // Search cases
    if (!type || type === 'cases') {
      const caseQuery = userRole === 'lawyer' 
        ? { lawyer: userId }
        : { client: userId };
        
      const cases = await Case.find({
        ...caseQuery,
        $or: [
          { title: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
          { caseNumber: { $regex: searchQuery, $options: 'i' } }
        ]
      })
      .populate('client', 'name email')
      .populate('lawyer', 'name email')
      .limit(limit)
      .sort({ updatedAt: -1 });
      
      results.push(...cases.map(c => ({ 
        ...c.toObject(), 
        type: 'case',
        relevance: calculateRelevance(searchQuery, c.title + ' ' + c.description)
      })));
    }
    
    // Search documents
    if (!type || type === 'documents') {
      const documents = await Document.find({
        uploadedBy: userId,
        $or: [
          { originalName: { $regex: searchQuery, $options: 'i' } },
          { tags: { $regex: searchQuery, $options: 'i' } },
          { 'aiAnalysis.summary': { $regex: searchQuery, $options: 'i' } }
        ]
      })
      .populate('relatedCase', 'title caseNumber')
      .populate('uploadedBy', 'name email')
      .limit(limit)
      .sort({ updatedAt: -1 });
      
      results.push(...documents.map(d => ({ 
        ...d.toObject(), 
        type: 'document',
        relevance: calculateRelevance(searchQuery, d.originalName + ' ' + (d.tags.join(' ') || ''))
      })));
    }
    
    // Search clients (for lawyers only)
    if (userRole === 'lawyer' && (!type || type === 'clients')) {
      const clients = await User.find({
        role: 'client',
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } }
        ]
      })
      .select('name email createdAt')
      .limit(limit)
      .sort({ createdAt: -1 });
      
      results.push(...clients.map(c => ({ 
        ...c.toObject(), 
        type: 'client',
        relevance: calculateRelevance(searchQuery, c.name + ' ' + c.email)
      })));
    }
    
    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = results.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      results: paginatedResults,
      query: searchQuery,
      type,
      pagination: {
        current: page,
        pages: Math.ceil(results.length / limit),
        total: results.length,
        hasNext: endIndex < results.length,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({ 
      message: 'Error performing search', 
      error: error.message 
    });
  }
});

// Search cases
router.post('/cases', auth, async (req, res) => {
  try {
    const { query, filters = {}, page = 1, limit = 20 } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let searchQuery = userRole === 'lawyer' 
      ? { lawyer: userId }
      : { client: userId };
    
    // Text search
    if (query) {
      searchQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { caseNumber: { $regex: query, $options: 'i' } }
      ];
    }
    
    // Apply filters
    if (filters.status) {
      searchQuery.status = filters.status;
    }
    
    if (filters.caseType) {
      searchQuery.caseType = filters.caseType;
    }
    
    if (filters.priority) {
      searchQuery.priority = filters.priority;
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
    
    const cases = await Case.find(searchQuery)
      .populate('client', 'name email')
      .populate('lawyer', 'name email')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Case.countDocuments(searchQuery);
    
    res.json({
      success: true,
      cases,
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
    console.error('Search cases error:', error);
    res.status(500).json({ 
      message: 'Error searching cases', 
      error: error.message 
    });
  }
});

// Search documents
router.post('/documents', auth, async (req, res) => {
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

// Search suggestions/autocomplete
router.get('/suggestions', auth, async (req, res) => {
  try {
    const { query, type } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!query || query.length < 2) {
      return res.json({ success: true, suggestions: [] });
    }
    
    let suggestions = [];
    
    // Case suggestions
    if (!type || type === 'cases') {
      const caseQuery = userRole === 'lawyer' 
        ? { lawyer: userId }
        : { client: userId };
        
      const cases = await Case.find({
        ...caseQuery,
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { caseNumber: { $regex: query, $options: 'i' } }
        ]
      })
      .select('title caseNumber')
      .limit(5);
      
      suggestions.push(...cases.map(c => ({
        type: 'case',
        text: c.title,
        value: c.caseNumber,
        id: c._id
      })));
    }
    
    // Document suggestions
    if (!type || type === 'documents') {
      const documents = await Document.find({
        uploadedBy: userId,
        originalName: { $regex: query, $options: 'i' }
      })
      .select('originalName')
      .limit(5);
      
      suggestions.push(...documents.map(d => ({
        type: 'document',
        text: d.originalName,
        value: d.originalName,
        id: d._id
      })));
    }
    
    // Tag suggestions
    const tagSuggestions = await Document.aggregate([
      { $match: { uploadedBy: userId } },
      { $unwind: '$tags' },
      { $match: { tags: { $regex: query, $options: 'i' } } },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    suggestions.push(...tagSuggestions.map(t => ({
      type: 'tag',
      text: `#${t._id}`,
      value: t._id,
      count: t.count
    })));
    
    res.json({ success: true, suggestions });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ 
      message: 'Error fetching suggestions', 
      error: error.message 
    });
  }
});

// Get recent searches
router.get('/recent', auth, async (req, res) => {
  try {
    // This would typically be stored in a separate collection
    // For now, return empty array
    res.json({ success: true, recentSearches: [] });
  } catch (error) {
    console.error('Get recent searches error:', error);
    res.status(500).json({ 
      message: 'Error fetching recent searches', 
      error: error.message 
    });
  }
});

// Helper function to calculate relevance score
function calculateRelevance(searchQuery, text) {
  if (!text) return 0;
  
  const lowerQuery = searchQuery.toLowerCase();
  const lowerText = text.toLowerCase();
  
  let score = 0;
  
  // Exact match gets highest score
  if (lowerText.includes(lowerQuery)) {
    score += 100;
  }
  
  // Word matches
  const queryWords = lowerQuery.split(' ');
  const textWords = lowerText.split(' ');
  
  queryWords.forEach(queryWord => {
    textWords.forEach(textWord => {
      if (textWord.includes(queryWord)) {
        score += 50;
      }
    });
  });
  
  // Partial matches
  for (let i = 0; i < lowerQuery.length - 2; i++) {
    const substring = lowerQuery.substring(i, i + 3);
    if (lowerText.includes(substring)) {
      score += 10;
    }
  }
  
  return score;
}

module.exports = router;