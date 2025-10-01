const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Case = require('./models/Case');
const User = require('./models/User');

// Load environment variables
dotenv.config();

async function createTestCase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find or create a test client and lawyer
    let testClient = await User.findOne({ email: 'client@test.com' });
    if (!testClient) {
      testClient = new User({
        name: 'Test Client',
        email: 'client@test.com',
        password: 'password123', // This should be hashed in production
        role: 'client'
      });
      await testClient.save();
      console.log('Created test client');
    }

    let testLawyer = await User.findOne({ email: 'lawyer@test.com' });
    if (!testLawyer) {
      testLawyer = new User({
        name: 'Test Lawyer',
        email: 'lawyer@test.com',
        password: 'password123', // This should be hashed in production
        role: 'lawyer',
        verificationStatus: 'verified'
      });
      await testLawyer.save();
      console.log('Created test lawyer');
    }

    // Create a test case with agreed pricing
    const testCase = new Case({
      title: 'Contract Review with Automated Payment',
      description: 'Test case for automated payment request generation when marked as completed',
      caseType: 'corporate',
      priority: 'medium',
      status: 'active',
      progress: 85,
      client: testClient._id,
      lawyer: testLawyer._id,
      agreedPricing: {
        type: 'fixed',
        amount: 15000,
        currency: 'INR'
      }
    });

    await testCase.save();
    console.log('Created test case with agreed pricing:');
    console.log(`Case ID: ${testCase._id}`);
    console.log(`Title: ${testCase.title}`);
    console.log(`Agreed Pricing: ${testCase.agreedPricing.currency} ${testCase.agreedPricing.amount}`);
    console.log(`Client: ${testClient.email}`);
    console.log(`Lawyer: ${testLawyer.email}`);

    console.log('\nTest credentials:');
    console.log('Lawyer: lawyer@test.com / password123');
    console.log('Client: client@test.com / password123');

  } catch (error) {
    console.error('Error creating test case:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestCase();