
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Check if Cloudinary is properly configured
const isCloudinaryConfigured = () => {
  return process.env.CLOUDINARY_CLOUD_NAME && 
         process.env.CLOUDINARY_API_KEY && 
         process.env.CLOUDINARY_API_SECRET &&
         process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name';
};

// Mock uploader for development when Cloudinary is not configured
const mockUploader = {
  upload: async (filePath, options = {}) => {
    
    // Generate a mock response
    const filename = path.basename(filePath);
    const mockResult = {
      public_id: `mock_${Date.now()}_${filename.replace(/\.[^/.]+$/, "")}`,
      secure_url: `https://mock-cloudinary.com/uploads/${filename}`,
      url: `http://mock-cloudinary.com/uploads/${filename}`,
      resource_type: options.resource_type || 'auto',
      bytes: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
      created_at: new Date().toISOString()
    };
    
    // Clean up local file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return mockResult;
  },
  
  destroy: async (publicId, options = {}) => {
    return { result: 'ok' };
  }
};

/**
 * Upload file to Cloudinary
 * @param {string} filePath - Local file path
 * @param {Object} options - Upload options
 * @returns {Promise} Cloudinary upload result
 */
const uploadFile = async (filePath, options = {}) => {
  try {
    const uploader = isCloudinaryConfigured() ? cloudinary.uploader : mockUploader;
    
    const result = await uploader.upload(filePath, {
      resource_type: 'auto', // Automatically detect file type
      folder: options.folder || 'judicature', // Default folder
      use_filename: true,
      unique_filename: false,
      ...options
    });

    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    
    // Clean up local file even if upload fails
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    throw error;
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} options - Delete options
 * @returns {Promise} Cloudinary delete result
 */
const deleteFile = async (publicId, options = {}) => {
  try {
    const uploader = isCloudinaryConfigured() ? cloudinary.uploader : mockUploader;
    
    const result = await uploader.destroy(publicId, {
      resource_type: options.resource_type || 'auto',
      ...options
    });
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Get file info from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise} File information
 */
const getFileInfo = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary get file info error:', error);
    throw error;
  }
};

/**
 * Generate optimized URL for file
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} transformations - Transformation options
 * @returns {string} Optimized URL
 */
const getOptimizedUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto',
    ...transformations
  });
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string} Public ID
 */
const extractPublicId = (url) => {
  if (!url) return null;
  
  try {
    const urlParts = url.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex === -1) return null;
    
    // Get everything after /upload/v{version}/
    const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
    
    // Remove file extension
    const lastDotIndex = pathAfterUpload.lastIndexOf('.');
    return lastDotIndex > 0 ? pathAfterUpload.substring(0, lastDotIndex) : pathAfterUpload;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadFile,
  deleteFile,
  getFileInfo,
  getOptimizedUrl,
  extractPublicId,
  uploader: isCloudinaryConfigured() ? cloudinary.uploader : mockUploader,
  api: cloudinary.api,
  isConfigured: isCloudinaryConfigured
};