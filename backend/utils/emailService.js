const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      if (!process.env.EMAIL_SERVICE || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('Email service not configured. Email notifications will be disabled.');
        return;
      }

      this.transporter = nodemailer.createTransporter({
        service: process.env.EMAIL_SERVICE,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      // Test connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('Email service configuration error:', error);
        } else {
          console.log('Email service ready');
        }
      });
    } catch (error) {
      console.error('Failed to initialize email service:', error);
    }
  }

  async sendEmail(to, subject, html, text = null) {
    if (!this.transporter) {
      console.warn('Email service not available');
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
      console.log('Email sent successfully:', result.messageId);
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
}

module.exports = new EmailService();