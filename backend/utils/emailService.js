
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // Check for required email configuration
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        return;
      }

      // Use SMTP configuration if host and port are provided, otherwise use service
      const emailConfig = {
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      };

      if (process.env.EMAIL_HOST && process.env.EMAIL_PORT) {
        // Use SMTP configuration
        emailConfig.host = process.env.EMAIL_HOST;
        emailConfig.port = parseInt(process.env.EMAIL_PORT);
        emailConfig.secure = process.env.EMAIL_PORT === '465'; // Use SSL for port 465, TLS for others
      } else if (process.env.EMAIL_SERVICE) {
        // Use service configuration
        emailConfig.service = process.env.EMAIL_SERVICE;
      } else {
        return;
      }

      // Additional configuration for better reliability
      emailConfig.tls = {
        rejectUnauthorized: false
      };

      this.transporter = nodemailer.createTransport(emailConfig);

      // Test connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('Email service configuration error:', error);
          this.transporter = null; // Disable if connection fails
        } else {
        }
      });
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.transporter = null;
    }
  }

  async sendEmail(to, subject, html, text = null) {
    if (!this.transporter) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: `"Judicature Legal Platform" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
      };

      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendVerificationEmail(userEmail, userName, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e3a8a; color: white; padding: 20px; text-align: center;">
          <h1>Welcome to Judicature</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Hello ${userName},</h2>
          <p>Thank you for registering with Judicature, the AI-powered legal case management platform.</p>
          <p>To complete your registration, please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            This verification link will expire in 24 hours. If you didn't create an account with Judicature, please ignore this email.
          </p>
        </div>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p>&copy; 2024 Judicature. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail(userEmail, 'Verify Your Judicature Account', html);
  }

  async sendPasswordResetEmail(userEmail, userName, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e3a8a; color: white; padding: 20px; text-align: center;">
          <h1>Password Reset Request</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Hello ${userName},</h2>
          <p>We received a request to reset your password for your Judicature account.</p>
          <p>Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            This reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
          </p>
        </div>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p>&copy; 2024 Judicature. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail(userEmail, 'Reset Your Judicature Password', html);
  }

  async sendCaseNotification(userEmail, userName, caseTitle, message, actionUrl = null) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e3a8a; color: white; padding: 20px; text-align: center;">
          <h1>Case Update Notification</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Hello ${userName},</h2>
          <p>There's an update regarding your case: <strong>${caseTitle}</strong></p>
          <div style="background: #f3f4f6; padding: 15px; border-left: 4px solid #1e3a8a; margin: 20px 0;">
            <p style="margin: 0;">${message}</p>
          </div>
          ${actionUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${actionUrl}" 
                 style="background: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View Case Details
              </a>
            </div>
          ` : ''}
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            You're receiving this email because you're associated with this case in the Judicature platform.
          </p>
        </div>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p>&copy; 2024 Judicature. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail(userEmail, `Case Update: ${caseTitle}`, html);
  }

  async sendDeadlineReminder(userEmail, userName, caseTitle, deadlineDate, daysLeft) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1>⚠️ Deadline Reminder</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Hello ${userName},</h2>
          <p>This is a reminder about an upcoming deadline for your case:</p>
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #dc2626;">Case: ${caseTitle}</h3>
            <p style="margin: 0;"><strong>Deadline:</strong> ${deadlineDate}</p>
            <p style="margin: 5px 0 0 0;"><strong>Time Remaining:</strong> ${daysLeft} day(s)</p>
          </div>
          <p>Please take any necessary action before the deadline to avoid any complications with your case.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Dashboard
            </a>
          </div>
        </div>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p>&copy; 2024 Judicature. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail(userEmail, `Deadline Reminder: ${caseTitle}`, html);
  }

  async sendWelcomeEmail(userEmail, userName, userRole) {
    const dashboardUrl = userRole === 'lawyer' 
      ? `${process.env.FRONTEND_URL}/dashboard/lawyer`
      : `${process.env.FRONTEND_URL}/dashboard/client`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e3a8a; color: white; padding: 20px; text-align: center;">
          <h1>Welcome to Judicature!</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Hello ${userName},</h2>
          <p>Welcome to Judicature, the future of legal case management! Your account has been successfully created.</p>
          
          <h3>What's Next?</h3>
          <ul style="line-height: 1.6;">
            ${userRole === 'lawyer' ? `
              <li>Complete your lawyer verification process</li>
              <li>Set up your profile and specializations</li>
              <li>Start managing your cases with AI assistance</li>
              <li>Connect with clients through our secure platform</li>
            ` : `
              <li>Complete your profile setup</li>
              <li>Connect with verified lawyers</li>
              <li>Upload and manage your legal documents</li>
              <li>Track your case progress in real-time</li>
            `}
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" 
               style="background: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          
          <p>If you have any questions, our support team is here to help at support@judicature.com</p>
        </div>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p>&copy; 2024 Judicature. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail(userEmail, 'Welcome to Judicature!', html);
  }

  async sendLawyerVerificationUpdate(userEmail, userName, status, notes = '') {
    const statusColors = {
      approved: '#16a34a',
      rejected: '#dc2626',
      pending: '#ca8a04'
    };

    const statusMessages = {
      approved: 'Congratulations! Your lawyer verification has been approved.',
      rejected: 'Unfortunately, your lawyer verification has been rejected.',
      pending: 'Your lawyer verification is currently under review.'
    };

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${statusColors[status]}; color: white; padding: 20px; text-align: center;">
          <h1>Verification Status Update</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Hello ${userName},</h2>
          <p>${statusMessages[status]}</p>
          
          ${notes ? `
            <div style="background: #f3f4f6; padding: 15px; border-left: 4px solid ${statusColors[status]}; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0;">Additional Notes:</h4>
              <p style="margin: 0;">${notes}</p>
            </div>
          ` : ''}
          
          ${status === 'approved' ? `
            <p>You can now access all lawyer features and start taking on new cases.</p>
          ` : status === 'rejected' ? `
            <p>Please review the feedback and resubmit your verification documents.</p>
          ` : `
            <p>We'll notify you once the review is complete.</p>
          `}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard/lawyer" 
               style="background: ${statusColors[status]}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
        </div>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p>&copy; 2024 Judicature. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail(userEmail, `Verification Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`, html);
  }

  async sendCaseCreationNotification(userEmail, userName, userRole, caseTitle, caseNumber, clientName = null, lawyerName = null) {
    const isClient = userRole === 'client';
    const isLawyer = userRole === 'lawyer';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e3a8a; color: white; padding: 20px; text-align: center;">
          <h1>📋 New Case ${isClient ? 'Created' : 'Assigned'}</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Hello ${userName},</h2>
          
          ${isClient ? `
            <p>Your case has been successfully created in the Judicature platform.</p>
          ` : `
            <p>A new case has been assigned to you by ${clientName}.</p>
          `}
          
          <div style="background: #f3f4f6; padding: 20px; border-left: 4px solid #1e3a8a; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #1e3a8a;">Case Details</h3>
            <p style="margin: 5px 0;"><strong>Case Number:</strong> ${caseNumber}</p>
            <p style="margin: 5px 0;"><strong>Title:</strong> ${caseTitle}</p>
            ${isClient && lawyerName ? `
              <p style="margin: 5px 0;"><strong>Assigned Lawyer:</strong> ${lawyerName}</p>
            ` : ''}
            ${isLawyer && clientName ? `
              <p style="margin: 5px 0;"><strong>Client:</strong> ${clientName}</p>
            ` : ''}
          </div>
          
          ${isClient ? `
            <p>Your case is now active in the system. ${lawyerName ? `Your assigned lawyer (${lawyerName}) will review your case and get back to you soon.` : 'We are working to assign a qualified lawyer to your case.'}</p>
          ` : `
            <p>Please review the case details and contact your client if you have any questions. The client is expecting your expertise and guidance on this matter.</p>
          `}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard/${isClient ? 'client' : 'lawyer'}" 
               style="background: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Case Details
            </a>
          </div>
          
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            You can track the progress of this case and communicate securely through your Judicature dashboard.
          </p>
        </div>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p>&copy; 2024 Judicature. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail(userEmail, `${isClient ? 'Case Created' : 'New Case Assigned'}: ${caseTitle}`, html);
  }

  async sendCaseUpdateNotification(userEmail, userName, caseTitle, caseNumber, updateType, updateMessage, updatedBy) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ca8a04; color: white; padding: 20px; text-align: center;">
          <h1>📝 Case Update Notification</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Hello ${userName},</h2>
          <p>There's an important update regarding your case.</p>
          
          <div style="background: #fef3c7; padding: 20px; border-left: 4px solid #ca8a04; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #92400e;">Case Information</h3>
            <p style="margin: 5px 0;"><strong>Case Number:</strong> ${caseNumber}</p>
            <p style="margin: 5px 0;"><strong>Case Title:</strong> ${caseTitle}</p>
            <p style="margin: 5px 0;"><strong>Update Type:</strong> ${updateType}</p>
            <p style="margin: 5px 0;"><strong>Updated By:</strong> ${updatedBy}</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0;">Update Details:</h4>
            <p style="margin: 0; line-height: 1.6;">${updateMessage}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="background: #ca8a04; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Case Details
            </a>
          </div>
          
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Stay updated on your case progress through your Judicature dashboard.
          </p>
        </div>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p>&copy; 2024 Judicature. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail(userEmail, `Case Update: ${caseTitle}`, html);
  }

  async sendCaseResolutionNotification(userEmail, userName, caseTitle, caseNumber, lawyerName, paymentAmount, paymentDetails = null) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #16a34a; color: white; padding: 20px; text-align: center;">
          <h1>✅ Case Resolved Successfully</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Hello ${userName},</h2>
          <p>Congratulations! Your case has been successfully resolved.</p>
          
          <div style="background: #f0fdf4; padding: 20px; border-left: 4px solid #16a34a; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #15803d;">Case Resolution Details</h3>
            <p style="margin: 5px 0;"><strong>Case Number:</strong> ${caseNumber}</p>
            <p style="margin: 5px 0;"><strong>Case Title:</strong> ${caseTitle}</p>
            <p style="margin: 5px 0;"><strong>Resolved By:</strong> ${lawyerName}</p>
            <p style="margin: 5px 0;"><strong>Resolution Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          ${paymentAmount ? `
            <div style="background: #fef3c7; padding: 20px; border-left: 4px solid #ca8a04; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #92400e;">💰 Payment Request</h3>
              <p style="margin: 5px 0;"><strong>Amount Due:</strong> $${paymentAmount}</p>
              ${paymentDetails ? `
                <p style="margin: 10px 0 5px 0;"><strong>Payment Details:</strong></p>
                <p style="margin: 0; line-height: 1.6; font-size: 14px;">${paymentDetails}</p>
              ` : ''}
            </div>
          ` : ''}
          
          <p>Your lawyer has successfully handled your case and marked it as resolved. ${paymentAmount ? 'Please review the payment request and proceed with the payment to complete the process.' : 'No additional payment is required at this time.'}</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard/client" 
               style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">
              View Case Details
            </a>
            ${paymentAmount ? `
              <a href="${process.env.FRONTEND_URL}/billing" 
                 style="background: #ca8a04; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Make Payment
              </a>
            ` : ''}
          </div>
          
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Thank you for choosing Judicature. We hope your experience was satisfactory and look forward to serving you again.
          </p>
        </div>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p>&copy; 2024 Judicature. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail(userEmail, `Case Resolved: ${caseTitle}`, html);
  }

  async sendLoginNotification(userEmail, userName, loginDetails) {
    const { ipAddress, userAgent, location, timestamp } = loginDetails;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e3a8a; color: white; padding: 20px; text-align: center;">
          <h1>🔐 Security Alert: New Login</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Hello ${userName},</h2>
          <p>We detected a new login to your Judicature account. If this was you, no action is needed. If you don't recognize this activity, please secure your account immediately.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-left: 4px solid #1e3a8a; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #1e3a8a;">Login Details</h3>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${timestamp}</p>
            <p style="margin: 5px 0;"><strong>IP Address:</strong> ${ipAddress}</p>
            <p style="margin: 5px 0;"><strong>Location:</strong> ${location || 'Unknown'}</p>
            <p style="margin: 5px 0;"><strong>Device:</strong> ${userAgent}</p>
          </div>
          
          <div style="background: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #dc2626;">⚠️ Wasn't you?</h4>
            <p style="margin: 0; font-size: 14px;">If you didn't log in, please:</p>
            <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px;">
              <li>Change your password immediately</li>
              <li>Review your account activity</li>
              <li>Contact our support team</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="background: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">
              Go to Dashboard
            </a>
            <a href="${process.env.FRONTEND_URL}/settings" 
               style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Change Password
            </a>
          </div>
          
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            This is an automated security notification. For your protection, we monitor all account access.
          </p>
        </div>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p>&copy; 2024 Judicature. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail(userEmail, 'Security Alert: New Login to Your Account', html);
  }

  async sendForgotPasswordEmail(userEmail, userName, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1>🔑 Password Reset Request</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Hello ${userName},</h2>
          <p>We received a request to reset your password for your Judicature account. If you didn't make this request, you can safely ignore this email.</p>
          
          <div style="background: #fef2f2; padding: 20px; border-left: 4px solid #dc2626; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #dc2626;">Reset Your Password</h3>
            <p style="margin: 0;">Click the button below to create a new password. This link will expire in 1 hour for security purposes.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px; font-weight: bold;">
              Reset My Password
            </a>
          </div>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666; background: #f9f9f9; padding: 10px; border-radius: 3px; font-family: monospace;">${resetUrl}</p>
          
          <div style="background: #f0f9ff; padding: 15px; border-left: 4px solid #0ea5e9; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #0369a1;">🔐 Security Tips</h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #0369a1;">
              <li>Choose a strong, unique password</li>
              <li>Don't share your password with anyone</li>
              <li>Consider enabling two-factor authentication</li>
            </ul>
          </div>
          
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            This password reset link will expire in 1 hour. If you need help, contact our support team at support@judicature.com
          </p>
        </div>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p>&copy; 2024 Judicature. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail(userEmail, 'Reset Your Judicature Password', html);
  }
}

module.exports = new EmailService();