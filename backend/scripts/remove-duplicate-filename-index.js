
const mongoose = require('mongoose');
require('dotenv').config();

async function removeDuplicateFilenameIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Get the documents collection
    const db = mongoose.connection.db;
    const collection = db.collection('documents');

    // List all indexes
    const indexes = await collection.indexes();

    // Check if fileName_1 index exists and drop it
    const fileNameIndexExists = indexes.some(idx => idx.name === 'fileName_1' || 
      (idx.key && idx.key.fileName === 1));

    if (fileNameIndexExists) {
      await collection.dropIndex('fileName_1');
    } else {
    }

    // List indexes after removal
    const indexesAfter = await collection.indexes();

  } catch (error) {
    console.error('Error removing index:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
  }
}

// Run the script
removeDuplicateFilenameIndex().catch(console.error);