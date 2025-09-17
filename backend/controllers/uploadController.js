const cloudinary = require('../utils/cloudinary');

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const result = await cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: 'judicature_uploads',
      },
      (error, result) => {
        if (error) return res.status(500).json({ message: 'Cloudinary upload error', error });
        res.json({ url: result.secure_url, public_id: result.public_id, resource_type: result.resource_type });
      }
    );
    // Pipe the buffer to Cloudinary
    require('streamifier').createReadStream(req.file.buffer).pipe(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 