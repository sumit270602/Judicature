const mongoose = require('mongoose');
require('dotenv').config();

async function removeDuplicateFilenameIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Get the documents collection
    const db = mongoose.connection.db;
    const collection = db.collection('documents');

    // List all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));

    // Check if fileName_1 index exists and drop it
    const fileNameIndexExists = indexes.some(idx => idx.name === 'fileName_1' || 
      (idx.key && idx.key.fileName === 1));

    if (fileNameIndexExists) {
      console.log('Found fileName unique index, dropping it...');
      await collection.dropIndex('fileName_1');
      console.log('✅ fileName unique index dropped successfully');
    } else {
      console.log('No fileName unique index found');
    }

    // List indexes after removal
    const indexesAfter = await collection.indexes();
    console.log('Indexes after removal:', indexesAfter.map(idx => ({ name: idx.name, key: idx.key })));

  } catch (error) {
    console.error('Error removing index:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('Connection closed');
  }
}

// Run the script
removeDuplicateFilenameIndex().catch(console.error);