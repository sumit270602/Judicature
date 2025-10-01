const Stripe = require('stripe');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Validate required Stripe environment variables
const validateStripeConfig = () => {
  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET', 
    'STRIPE_PUBLISHABLE_KEY',
    'PLATFORM_FEE_PERCENT'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required Stripe environment variables: ${missing.join(', ')}`);
  }

  // Validate key formats
  if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    throw new Error('STRIPE_SECRET_KEY must start with sk_');
  }
  
  if (!process.env.STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
    throw new Error('STRIPE_PUBLISHABLE_KEY must start with pk_');
  }
  
  if (!process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
    throw new Error('STRIPE_WEBHOOK_SECRET must start with whsec_');
  }

  const platformFee = parseFloat(process.env.PLATFORM_FEE_PERCENT);
  if (isNaN(platformFee) || platformFee < 0 || platformFee > 100) {
    throw new Error('PLATFORM_FEE_PERCENT must be a number between 0 and 100');
  }

  return true;
};

// Health check function
const stripeHealthCheck = async (stripe) => {
  try {
    await stripe.balance.retrieve();
    console.log('✅ Stripe connection successful');
    return true;
  } catch (error) {
    console.error('❌ Stripe health check failed:', error.message);
    throw new Error(`Stripe configuration invalid: ${error.message}`);
  }
};

// Initialize Stripe with validation
const initializeStripe = async () => {
  try {
    // Validate configuration first
    validateStripeConfig();
    
    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-09-30.acacia',
      appInfo: {
        name: 'Judicature Legal Platform',
        version: '1.0.0',
      },
    });

    // Perform health check
    await stripeHealthCheck(stripe);
    
    return stripe;
  } catch (error) {
    console.error('Failed to initialize Stripe:', error.message);
    throw error;
  }
};

// Configuration object
const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY,
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  platformFeePercent: parseFloat(process.env.PLATFORM_FEE_PERCENT || '10'),
  
  // Calculate platform fee
  calculatePlatformFee: (amountCents) => {
    return Math.round(amountCents * (parseFloat(process.env.PLATFORM_FEE_PERCENT || '10') / 100));
  },
  
  // Calculate lawyer amount after fee
  calculateLawyerAmount: (amountCents) => {
    const platformFee = stripeConfig.calculatePlatformFee(amountCents);
    return amountCents - platformFee;
  }
};

module.exports = {
  initializeStripe,
  validateStripeConfig,
  stripeHealthCheck,
  stripeConfig
};