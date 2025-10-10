
const User = require('../models/User');
const { initializeStripe, stripeConfig } = require('../config/stripe');
const { validationResult } = require('express-validator');

class StripeConnectController {
  constructor() {
    this.stripe = null;
    this.initStripe();
  }

  async initStripe() {
    try {
      this.stripe = await initializeStripe();
    } catch (error) {
      console.error('Failed to initialize Stripe in StripeConnectController:', error);
    }
  }

  // Create Stripe Express account for lawyer during verification
  async createLawyerAccount(req, res) {
    try {
      if (!this.stripe) {
        return res.status(500).json({
          success: false,
          message: 'Stripe not initialized'
        });
      }

      const { lawyerId } = req.params;
      const lawyer = await User.findById(lawyerId);

      if (!lawyer || lawyer.role !== 'lawyer') {
        return res.status(404).json({
          success: false,
          message: 'Lawyer not found'
        });
      }

      if (lawyer.stripeAccountId) {
        return res.status(400).json({
          success: false,
          message: 'Lawyer already has Stripe account'
        });
      }

      // Create Stripe Express account
      const account = await this.stripe.accounts.create({
        type: 'express',
        country: 'IN',
        business_type: 'individual',
        individual: {
          first_name: lawyer.name.split(' ')[0],
          last_name: lawyer.name.split(' ').slice(1).join(' ') || 'NA',
          email: lawyer.email,
          phone: lawyer.phone,
          address: {
            line1: lawyer.address || 'Address not provided',
            city: 'Mumbai', // Default, should be updated during onboarding
            state: 'Maharashtra',
            postal_code: '400001',
            country: 'IN'
          }
        },
        business_profile: {
          mcc: '8111', // Legal services MCC code
          url: process.env.FRONTEND_URL || 'https://judicature.com'
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        tos_acceptance: {
          service_agreement: 'recipient'
        }
      });

      // Update lawyer with Stripe account ID
      lawyer.stripeAccountId = account.id;
      lawyer.payoutHoldUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days hold
      await lawyer.save();

      // Create account link for onboarding
      const accountLink = await this.stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.FRONTEND_URL}/lawyer/stripe-refresh`,
        return_url: `${process.env.FRONTEND_URL}/lawyer/stripe-return`,
        type: 'account_onboarding'
      });

      res.json({
        success: true,
        data: {
          accountId: account.id,
          onboardingUrl: accountLink.url
        }
      });

    } catch (error) {
      console.error('Error creating Stripe account:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create Stripe account',
        error: error.message
      });
    }
  }

  // Check account onboarding status
  async checkAccountStatus(req, res) {
    try {
      if (!this.stripe) {
        return res.status(500).json({
          success: false,
          message: 'Stripe not initialized'
        });
      }

      const { lawyerId } = req.params;
      const lawyer = await User.findById(lawyerId);

      if (!lawyer || !lawyer.stripeAccountId) {
        return res.status(404).json({
          success: false,
          message: 'Stripe account not found'
        });
      }

      const account = await this.stripe.accounts.retrieve(lawyer.stripeAccountId);
      
      const isOnboardingComplete = account.details_submitted && 
                                   account.charges_enabled && 
                                   account.payouts_enabled;

      // Update lawyer onboarding status
      if (isOnboardingComplete && !lawyer.stripeOnboardingComplete) {
        lawyer.stripeOnboardingComplete = true;
        await lawyer.save();
      }

      res.json({
        success: true,
        data: {
          accountId: account.id,
          onboardingComplete: isOnboardingComplete,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          requirements: account.requirements
        }
      });

    } catch (error) {
      console.error('Error checking account status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check account status',
        error: error.message
      });
    }
  }

  // Create new onboarding link if needed
  async createOnboardingLink(req, res) {
    try {
      if (!this.stripe) {
        return res.status(500).json({
          success: false,
          message: 'Stripe not initialized'
        });
      }

      const { lawyerId } = req.params;
      const lawyer = await User.findById(lawyerId);

      if (!lawyer || !lawyer.stripeAccountId) {
        return res.status(404).json({
          success: false,
          message: 'Stripe account not found'
        });
      }

      const accountLink = await this.stripe.accountLinks.create({
        account: lawyer.stripeAccountId,
        refresh_url: `${process.env.FRONTEND_URL}/lawyer/stripe-refresh`,
        return_url: `${process.env.FRONTEND_URL}/lawyer/stripe-return`,
        type: 'account_onboarding'
      });

      res.json({
        success: true,
        data: {
          onboardingUrl: accountLink.url
        }
      });

    } catch (error) {
      console.error('Error creating onboarding link:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create onboarding link',
        error: error.message
      });
    }
  }

  // Get lawyer's Stripe dashboard link
  async getDashboardLink(req, res) {
    try {
      if (!this.stripe) {
        return res.status(500).json({
          success: false,
          message: 'Stripe not initialized'
        });
      }

      const { lawyerId } = req.params;
      const lawyer = await User.findById(lawyerId);

      if (!lawyer || !lawyer.stripeAccountId) {
        return res.status(404).json({
          success: false,
          message: 'Stripe account not found'
        });
      }

      const loginLink = await this.stripe.accounts.createLoginLink(lawyer.stripeAccountId);

      res.json({
        success: true,
        data: {
          dashboardUrl: loginLink.url
        }
      });

    } catch (error) {
      console.error('Error creating dashboard link:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create dashboard link',
        error: error.message
      });
    }
  }

  // Create account for current authenticated lawyer
  async createAccount(req, res) {
    try {
      if (!this.stripe) {
        return res.status(500).json({
          success: false,
          message: 'Stripe not initialized'
        });
      }

      const lawyerId = req.user.id;
      const lawyer = await User.findById(lawyerId);

      if (!lawyer || lawyer.role !== 'lawyer') {
        return res.status(404).json({
          success: false,
          message: 'Lawyer not found'
        });
      }

      if (lawyer.stripeAccountId) {
        return res.status(400).json({
          success: false,
          message: 'Lawyer already has Stripe account'
        });
      }

      const { email, country = 'IN', businessType = 'individual' } = req.body;

      // Create Stripe Express account
      const account = await this.stripe.accounts.create({
        type: 'express',
        country: country,
        business_type: businessType,
        email: email || lawyer.email,
        individual: {
          email: email || lawyer.email,
          first_name: lawyer.name.split(' ')[0],
          last_name: lawyer.name.split(' ').slice(1).join(' ') || 'N/A',
          address: {
            city: 'Mumbai',
            line1: 'Legal Services',
            postal_code: '400001',
            country: 'IN'
          }
        },
        business_profile: {
          mcc: '8111', // Legal services MCC code
          url: process.env.FRONTEND_URL || 'https://judicature.com'
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        tos_acceptance: {
          service_agreement: 'recipient'
        }
      });

      // Update lawyer with Stripe account ID
      lawyer.stripeAccountId = account.id;
      lawyer.payoutHoldUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days hold
      await lawyer.save();

      // Create account link for onboarding
      const accountLink = await this.stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.FRONTEND_URL}/lawyer/stripe-refresh`,
        return_url: `${process.env.FRONTEND_URL}/lawyer/stripe-return`,
        type: 'account_onboarding'
      });

      res.json({
        success: true,
        data: {
          accountId: account.id,
          onboardingUrl: accountLink.url
        }
      });

    } catch (error) {
      console.error('Error creating Stripe account:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create Stripe account',
        error: error.message
      });
    }
  }

  // Get account status for current authenticated lawyer
  async getAccountStatus(req, res) {
    try {
      if (!this.stripe) {
        return res.status(500).json({
          success: false,
          message: 'Stripe not initialized'
        });
      }

      const lawyerId = req.user.id;
      const lawyer = await User.findById(lawyerId);

      if (!lawyer || lawyer.role !== 'lawyer') {
        return res.status(404).json({
          success: false,
          message: 'Lawyer not found'
        });
      }

      if (!lawyer.stripeAccountId) {
        return res.status(404).json({
          success: false,
          message: 'No Stripe account found'
        });
      }

      // Get account details
      const account = await this.stripe.accounts.retrieve(lawyer.stripeAccountId);
      
      // Get balance information
      let balance = null;
      try {
        balance = await this.stripe.balance.retrieve({
          stripeAccount: lawyer.stripeAccountId
        });
      } catch (balanceError) {
      }

      res.json({
        success: true,
        account: {
          id: account.id,
          detailsSubmitted: account.details_submitted,
          payoutsEnabled: account.payouts_enabled,
          chargesEnabled: account.charges_enabled,
          requirements: account.requirements,
          capabilities: account.capabilities
        },
        payoutInfo: balance ? {
          balance: {
            available: balance.available,
            pending: balance.pending
          }
        } : null
      });

    } catch (error) {
      console.error('Error fetching account status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch account status',
        error: error.message
      });
    }
  }

  // Complete onboarding for current authenticated lawyer
  async completeOnboarding(req, res) {
    try {
      if (!this.stripe) {
        return res.status(500).json({
          success: false,
          message: 'Stripe not initialized'
        });
      }

      const lawyerId = req.user.id;
      const lawyer = await User.findById(lawyerId);

      if (!lawyer || lawyer.role !== 'lawyer') {
        return res.status(404).json({
          success: false,
          message: 'Lawyer not found'
        });
      }

      if (!lawyer.stripeAccountId) {
        return res.status(404).json({
          success: false,
          message: 'No Stripe account found. Please create an account first.'
        });
      }

      // Create onboarding link
      const accountLink = await this.stripe.accountLinks.create({
        account: lawyer.stripeAccountId,
        refresh_url: `${process.env.FRONTEND_URL}/lawyer/stripe-refresh`,
        return_url: `${process.env.FRONTEND_URL}/lawyer/stripe-return`,
        type: 'account_onboarding'
      });

      res.json({
        success: true,
        onboardingUrl: accountLink.url
      });

    } catch (error) {
      console.error('Error creating onboarding link:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create onboarding link',
        error: error.message
      });
    }
  }
}

module.exports = new StripeConnectController();