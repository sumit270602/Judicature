
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Validate required environment variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing required Google OAuth environment variables: GOOGLE_CLIENT_ID and/or GOOGLE_CLIENT_SECRET');
}

// Configure Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists with this Google ID
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      return done(null, user);
    }
    
    // Check if user exists with the same email
    user = await User.findOne({ email: profile.emails[0].value });
    
    if (user) {
      // Link Google account to existing user
      user.googleId = profile.id;
      user.isOAuthUser = true;
      if (!user.oauthProviders) {
        user.oauthProviders = [];
      }
      user.oauthProviders.push({
        provider: 'google',
        providerId: profile.id,
        email: profile.emails[0].value
      });
      await user.save();
      return done(null, user);
    }
    
    // Create new user - we'll handle role selection on frontend
    const newUser = new User({
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      isOAuthUser: true,
      role: 'pending', // Special role for OAuth users who haven't selected their role yet
      verificationStatus: 'pending',
      oauthProviders: [{
        provider: 'google',
        providerId: profile.id,
        email: profile.emails[0].value
      }],
      // Set a temporary password (not used for OAuth users)
      password: 'oauth_user_' + Date.now()
    });
    
    await newUser.save();
    return done(null, newUser);
  } catch (error) {
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Initiate Google OAuth
exports.initiateGoogleOAuth = (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
};

// Handle Google OAuth callback
exports.googleCallback = async (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user) => {
    if (err) {
      console.error('OAuth Error:', err);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_error`);
    }
    
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
    
    try {
      // Check if user needs role selection
      if (user.role === 'pending') {
        // Generate temporary token for role selection
        const tempToken = jwt.sign(
          { id: user._id, role: 'pending', temp: true },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );
        
        return res.redirect(`${process.env.FRONTEND_URL}/oauth/role-selection?token=${tempToken}`);
      }
      
      // Generate regular JWT token
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Redirect based on user role
      let redirectUrl = `${process.env.FRONTEND_URL}/dashboard`;
      if (user.role === 'client') {
        redirectUrl = `${process.env.FRONTEND_URL}/dashboard/client`;
      } else if (user.role === 'lawyer') {
        redirectUrl = `${process.env.FRONTEND_URL}/dashboard/lawyer`;
      } else if (user.role === 'admin') {
        redirectUrl = `${process.env.FRONTEND_URL}/dashboard/admin`;
      }
      
      // Redirect with token in URL (will be handled by frontend)
      res.redirect(`${redirectUrl}?oauth_token=${token}&oauth_success=true`);
    } catch (error) {
      console.error('Token generation error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=token_error`);
    }
  })(req, res, next);
};

// Verify Google token (for frontend-initiated OAuth)
exports.verifyGoogleToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Google token is required' });
    }
    
    // Verify the Google token using Google's API
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    
    // Check if user exists with this Google ID
    let user = await User.findOne({ googleId: payload.sub });
    
    if (user) {
      // Generate JWT token
      const jwtToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      return res.json({
        success: true,
        token: jwtToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          verificationStatus: user.verificationStatus,
          canTakeCases: user.canTakeCases()
        }
      });
    }
    
    // Check if user exists with the same email
    user = await User.findOne({ email: payload.email });
    
    if (user) {
      // Link Google account to existing user
      user.googleId = payload.sub;
      user.isOAuthUser = true;
      if (!user.oauthProviders) {
        user.oauthProviders = [];
      }
      user.oauthProviders.push({
        provider: 'google',
        providerId: payload.sub,
        email: payload.email
      });
      await user.save();
      
      const jwtToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      return res.json({
        success: true,
        token: jwtToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          verificationStatus: user.verificationStatus,
          canTakeCases: user.canTakeCases()
        }
      });
    }
    
    // New user - needs role selection
    const newUser = new User({
      googleId: payload.sub,
      name: payload.name,
      email: payload.email,
      isOAuthUser: true,
      role: 'pending',
      verificationStatus: 'pending',
      oauthProviders: [{
        provider: 'google',
        providerId: payload.sub,
        email: payload.email
      }],
      password: 'oauth_user_' + Date.now()
    });
    
    await newUser.save();
    
    // Generate temporary token for role selection
    const tempToken = jwt.sign(
      { id: newUser._id, role: 'pending', temp: true },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({
      success: true,
      needsRoleSelection: true,
      tempToken,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: 'pending'
      }
    });
    
  } catch (error) {
    console.error('Google token verification error:', error);
    res.status(400).json({ message: 'Invalid Google token' });
  }
};

// Complete OAuth registration with role selection
exports.completeOAuthRegistration = async (req, res) => {
  try {
    const { role, lawyerProfile } = req.body;
    
    // Verify the temporary token
    if (!req.user || req.user.role !== 'pending') {
      return res.status(400).json({ message: 'Invalid or expired temporary token' });
    }
    
    if (!['client', 'lawyer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user with selected role
    user.role = role;
    
    // Add lawyer-specific fields if role is lawyer
    if (role === 'lawyer') {
      if (!lawyerProfile || !lawyerProfile.barCouncilId || !lawyerProfile.phone) {
        return res.status(400).json({ 
          message: 'Bar Council ID and phone number are required for lawyers' 
        });
      }
      
      user.barCouncilId = lawyerProfile.barCouncilId.trim();
      user.practiceAreas = lawyerProfile.practiceAreas || [];
      user.experience = parseInt(lawyerProfile.experience) || 0;
      user.hourlyRate = parseInt(lawyerProfile.hourlyRate) || 0;
      user.bio = lawyerProfile.bio ? lawyerProfile.bio.trim() : '';
      user.phone = lawyerProfile.phone.trim();
      user.address = lawyerProfile.address ? lawyerProfile.address.trim() : '';
      user.verificationStatus = 'pending'; // Lawyers need verification
    } else {
      user.verificationStatus = 'verified'; // Clients are auto-verified
    }
    
    await user.save();
    
    // Generate final JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
        canTakeCases: user.canTakeCases()
      }
    });
    
  } catch (error) {
    console.error('OAuth registration completion error:', error);
    res.status(500).json({ message: 'Server error during registration completion' });
  }
};