// Test client login and profile access
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
require('dotenv').config();

async function testClientLogin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/judicature');
        console.log('Connected to database');
        
        // Find or create a test client
        let testClient = await User.findOne({ email: 'test@client.com' });
        
        if (!testClient) {
            console.log('Creating test client...');
            const hashedPassword = await bcrypt.hash('password123', 10);
            testClient = new User({
                name: 'Test Client',
                email: 'test@client.com',
                password: hashedPassword,
                role: 'client',
                phone: '+1234567890',
                address: '123 Test Street, Test City',
                isActive: true
            });
            await testClient.save();
            console.log('Test client created!');
        } else {
            console.log('Using existing test client');
        }
        
        console.log('Test client details:');
        console.log('- Name:', testClient.name);
        console.log('- Email:', testClient.email);
        console.log('- Role:', testClient.role);
        console.log('- Active:', testClient.isActive);
        console.log('- ID:', testClient._id);
        
        // Generate JWT token
        const token = jwt.sign({ id: testClient._id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '7d' });
        console.log('\nGenerated JWT token:');
        console.log(token);
        
        console.log('\n📋 Instructions to test:');
        console.log('1. Open browser developer console (F12)');
        console.log('2. Go to Application/Storage tab');
        console.log('3. Set localStorage token:');
        console.log('   localStorage.setItem("token", "' + token + '")');
        console.log('4. Refresh the page');
        console.log('5. Check if profile loads correctly');
        
        await mongoose.connection.close();
        
    } catch (error) {
        console.error('Error:', error);
    }
}

testClientLogin();