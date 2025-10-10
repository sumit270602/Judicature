
const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: { 
    type: String, 
    required: true 
  },
  sequenceValue: { 
    type: Number, 
    default: 0 
  }
}, {
  timestamps: true
});

// Static method to get next sequence value
counterSchema.statics.getNextSequence = async function(name) {
  const counter = await this.findOneAndUpdate(
    { _id: name },
    { $inc: { sequenceValue: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequenceValue;
};

module.exports = mongoose.model('Counter', counterSchema);