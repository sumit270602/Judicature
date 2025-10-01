const Deliverable = require('../models/Deliverable');
const Order = require('../models/Order');
const User = require('../models/User');
const cloudinary = require('../utils/cloudinary');
const crypto = require('crypto');

class DeliverablesController {
  // Upload deliverable file
  async uploadDeliverable(req, res) {
    try {
      const { orderId } = req.params;
      const { description, notes } = req.body;
      const userId = req.user.id;

      // Find the order
      const order = await Order.findOne({ id: orderId });
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Only the assigned lawyer can upload deliverables
      if (order.lawyerId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check if order is in the right status
      if (!['funded', 'in_progress'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'Order must be funded or in progress to upload deliverables'
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Generate file hash for integrity
      const fileHash = crypto
        .createHash('sha256')
        .update(req.file.buffer)
        .digest('hex');

      // Check for existing deliverable with same hash (prevent duplicates)
      const existingDeliverable = await Deliverable.findOne({
        orderId: order._id,
        hash: fileHash
      });

      if (existingDeliverable) {
        return res.status(400).json({
          success: false,
          message: 'This file has already been uploaded'
        });
      }

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder: `judicature/deliverables/${orderId}`,
            use_filename: true,
            unique_filename: true
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        upload.end(req.file.buffer);
      });

      // Get version number (increment from existing deliverables)
      const existingCount = await Deliverable.countDocuments({
        orderId: order._id
      });
      const version = existingCount + 1;

      // Create deliverable record
      const deliverable = new Deliverable({
        orderId: order._id,
        fileUrl: uploadResult.secure_url,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        hash: fileHash,
        description,
        notes,
        uploadedBy: userId,
        version
      });

      await deliverable.save();

      // Update order status to delivered
      if (order.status !== 'delivered') {
        order.status = 'delivered';
        order.deliveredAt = new Date();
        await order.save();
      }

      // Populate the response
      await deliverable.populate('uploadedBy', 'name email');

      res.json({
        success: true,
        data: deliverable
      });

    } catch (error) {
      console.error('Error uploading deliverable:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload deliverable',
        error: error.message
      });
    }
  }

  // Get deliverables for an order
  async getDeliverables(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      // Find the order
      const order = await Order.findOne({ id: orderId });
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check access permissions
      if (order.clientId.toString() !== userId && 
          order.lawyerId.toString() !== userId &&
          req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const deliverables = await Deliverable.find({ orderId: order._id })
        .populate('uploadedBy', 'name email')
        .populate('acceptedBy', 'name email')
        .sort({ version: -1 });

      res.json({
        success: true,
        data: deliverables
      });

    } catch (error) {
      console.error('Error getting deliverables:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get deliverables',
        error: error.message
      });
    }
  }

  // Accept deliverable (client action)
  async acceptDeliverable(req, res) {
    try {
      const { deliverableId } = req.params;
      const { acceptanceNotes } = req.body;
      const userId = req.user.id;

      const deliverable = await Deliverable.findById(deliverableId)
        .populate({
          path: 'orderId',
          populate: {
            path: 'clientId lawyerId',
            select: 'name email'
          }
        });

      if (!deliverable) {
        return res.status(404).json({
          success: false,
          message: 'Deliverable not found'
        });
      }

      // Only the client can accept deliverables
      if (deliverable.orderId.clientId._id.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (!deliverable.canBeAccepted()) {
        return res.status(400).json({
          success: false,
          message: 'Deliverable cannot be accepted in current status'
        });
      }

      // Accept the deliverable
      deliverable.status = 'accepted';
      deliverable.acceptedBy = userId;
      deliverable.acceptedAt = new Date();
      deliverable.acceptanceNotes = acceptanceNotes;
      await deliverable.save();

      res.json({
        success: true,
        message: 'Deliverable accepted successfully',
        data: deliverable
      });

    } catch (error) {
      console.error('Error accepting deliverable:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to accept deliverable',
        error: error.message
      });
    }
  }

  // Reject deliverable (client action)
  async rejectDeliverable(req, res) {
    try {
      const { deliverableId } = req.params;
      const { rejectionReason } = req.body;
      const userId = req.user.id;

      if (!rejectionReason || rejectionReason.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }

      const deliverable = await Deliverable.findById(deliverableId)
        .populate({
          path: 'orderId',
          populate: {
            path: 'clientId lawyerId',
            select: 'name email'
          }
        });

      if (!deliverable) {
        return res.status(404).json({
          success: false,
          message: 'Deliverable not found'
        });
      }

      // Only the client can reject deliverables
      if (deliverable.orderId.clientId._id.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (!deliverable.canBeRejected()) {
        return res.status(400).json({
          success: false,
          message: 'Deliverable cannot be rejected in current status'
        });
      }

      // Reject the deliverable
      deliverable.status = 'rejected';
      deliverable.acceptanceNotes = rejectionReason;
      await deliverable.save();

      // Update order status back to in_progress
      const order = await Order.findById(deliverable.orderId._id);
      if (order && order.status === 'delivered') {
        order.status = 'in_progress';
        await order.save();
      }

      res.json({
        success: true,
        message: 'Deliverable rejected successfully',
        data: deliverable
      });

    } catch (error) {
      console.error('Error rejecting deliverable:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject deliverable',
        error: error.message
      });
    }
  }

  // Download deliverable file
  async downloadDeliverable(req, res) {
    try {
      const { deliverableId } = req.params;
      const userId = req.user.id;

      const deliverable = await Deliverable.findById(deliverableId)
        .populate({
          path: 'orderId',
          populate: {
            path: 'clientId lawyerId',
            select: 'name email'
          }
        });

      if (!deliverable) {
        return res.status(404).json({
          success: false,
          message: 'Deliverable not found'
        });
      }

      // Check access permissions
      const order = deliverable.orderId;
      if (order.clientId._id.toString() !== userId && 
          order.lawyerId._id.toString() !== userId &&
          req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Return the file URL for client-side download
      res.json({
        success: true,
        data: {
          fileUrl: deliverable.fileUrl,
          fileName: deliverable.fileName,
          fileSize: deliverable.fileSize,
          mimeType: deliverable.mimeType
        }
      });

    } catch (error) {
      console.error('Error downloading deliverable:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download deliverable',
        error: error.message
      });
    }
  }

  // Delete deliverable (lawyer only, if not accepted)
  async deleteDeliverable(req, res) {
    try {
      const { deliverableId } = req.params;
      const userId = req.user.id;

      const deliverable = await Deliverable.findById(deliverableId)
        .populate('orderId');

      if (!deliverable) {
        return res.status(404).json({
          success: false,
          message: 'Deliverable not found'
        });
      }

      // Only the lawyer who uploaded can delete, and only if not accepted
      if (deliverable.uploadedBy.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (deliverable.status === 'accepted') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete accepted deliverable'
        });
      }

      // Delete from Cloudinary
      try {
        const publicId = deliverable.fileUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`judicature/deliverables/${deliverable.orderId.id}/${publicId}`);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Continue with database deletion even if Cloudinary fails
      }

      // Delete from database
      await Deliverable.findByIdAndDelete(deliverableId);

      // Check if this was the only deliverable and update order status
      const remainingDeliverables = await Deliverable.countDocuments({
        orderId: deliverable.orderId._id
      });

      if (remainingDeliverables === 0) {
        const order = await Order.findById(deliverable.orderId._id);
        if (order && order.status === 'delivered') {
          order.status = 'in_progress';
          await order.save();
        }
      }

      res.json({
        success: true,
        message: 'Deliverable deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting deliverable:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete deliverable',
        error: error.message
      });
    }
  }
}

module.exports = new DeliverablesController();