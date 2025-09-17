const Message = require('../models/Message');

exports.getChatHistory = async (req, res) => {
  try {
    const { caseId } = req.params;
    const messages = await Message.find({ caseId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name role')
      .populate('receiver', 'name role');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 