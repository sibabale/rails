const { Resend } = require('resend');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    // Initialize Resend with API key from environment
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      logger.warn('Resend API key not found. Email functionality will be disabled.');
      this.resend = null;
    }
    
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@rails.co.za';
    this.fromName = process.env.RESEND_FROM_NAME || 'Rails Financial Infrastructure';
  }

  /**
   * Check if email service is properly configured
   */
  isConfigured() {
    return !!this.resend;
  }

  /**
   * Send bank partnership application received email
   * @param {Object} bankData - Bank registration data
   */
  async sendBankApplicationReceived(bankData) {
    if (!this.isConfigured()) {
      logger.warn('Email service not configured. Skipping application received email.');
      return { success: false, reason: 'Email service not configured' };
    }

    try {
      const emailData = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [bankData.adminEmail],
        subject: 'Rails Partnership Application Received',
        html: this.generateApplicationReceivedHTML(bankData),
        text: this.generateApplicationReceivedText(bankData)
      };

      const result = await this.resend.emails.send(emailData);
      
      logger.audit('Bank application received email sent', {
        bankId: bankData.bankId,
        bankCode: bankData.bankCode,
        adminEmail: bankData.adminEmail,
        messageId: result.data?.id,
        event_type: 'email_sent_application_received'
      });

      return { success: true, messageId: result.data?.id };
      
    } catch (error) {
      logger.error('Failed to send bank application received email', {
        bankId: bankData.bankId,
        adminEmail: bankData.adminEmail,
        error: error.message,
        event_type: 'email_send_failed'
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Send bank partnership approval email (for future manual approval)
   * @param {Object} bankData - Bank data with API credentials
   */
  async sendBankApplicationApproved(bankData) {
    if (!this.isConfigured()) {
      logger.warn('Email service not configured. Skipping application approved email.');
      return { success: false, reason: 'Email service not configured' };
    }

    try {
      const emailData = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [bankData.adminEmail],
        subject: 'Welcome to Rails - Your Partnership is Approved!',
        html: this.generateApplicationApprovedHTML(bankData),
        text: this.generateApplicationApprovedText(bankData)
      };

      const result = await this.resend.emails.send(emailData);
      
      logger.audit('Bank application approved email sent', {
        bankId: bankData.bankId,
        bankCode: bankData.bankCode,
        adminEmail: bankData.adminEmail,
        messageId: result.data?.id,
        event_type: 'email_sent_application_approved'
      });

      return { success: true, messageId: result.data?.id };
      
    } catch (error) {
      logger.error('Failed to send bank application approved email', {
        bankId: bankData.bankId,
        adminEmail: bankData.adminEmail,
        error: error.message,
        event_type: 'email_send_failed'
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Generate HTML for application received email
   */
  generateApplicationReceivedHTML(bankData) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rails Partnership Application Received</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #030213; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px 20px; border: 1px solid #e2e8f0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
        .highlight { background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .button { display: inline-block; background: #030213; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        ul { padding-left: 20px; }
        li { margin: 8px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Rails Financial Infrastructure</h1>
            <p>Partnership Application Received</p>
        </div>
        
        <div class="content">
            <h2>Thank you for your interest, ${bankData.bankName}!</h2>
            
            <p>We have successfully received your partnership application for Rails' exclusive weekend settlements program.</p>
            
            <div class="highlight">
                <h3>🏦 Application Details</h3>
                <ul>
                    <li><strong>Bank Name:</strong> ${bankData.bankName}</li>
                    <li><strong>Bank Code:</strong> ${bankData.bankCode}</li>
                    <li><strong>Contact:</strong> ${bankData.adminFirstName} ${bankData.adminLastName}</li>
                    <li><strong>Application ID:</strong> ${bankData.bankId}</li>
                </ul>
            </div>
            
            <h3>What Happens Next?</h3>
            <ul>
                <li>Our partnership team will carefully review your application</li>
                <li>We will contact you within <strong>5-7 business days</strong> with next steps</li>
                <li>Selected partners will receive API credentials and integration documentation</li>
                <li>Due to high demand, we are accepting a <strong>limited number of partners</strong> for our initial rollout</li>
            </ul>
            
            <p>We appreciate your interest in modernizing South Africa's financial infrastructure with Rails.</p>
            
            <p>Best regards,<br>
            <strong>The Rails Partnership Team</strong></p>
        </div>
        
        <div class="footer">
            <p>Rails Financial Infrastructure<br>
            <a href="https://rails.co.za">rails.co.za</a> | support@rails.co.za</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate plain text for application received email
   */
  generateApplicationReceivedText(bankData) {
    return `
Rails Financial Infrastructure - Partnership Application Received

Thank you for your interest, ${bankData.bankName}!

We have successfully received your partnership application for Rails' exclusive weekend settlements program.

Application Details:
- Bank Name: ${bankData.bankName}
- Bank Code: ${bankData.bankCode}
- Contact: ${bankData.adminFirstName} ${bankData.adminLastName}
- Application ID: ${bankData.bankId}

What Happens Next?
- Our partnership team will carefully review your application
- We will contact you within 5-7 business days with next steps
- Selected partners will receive API credentials and integration documentation
- Due to high demand, we are accepting a limited number of partners for our initial rollout

We appreciate your interest in modernizing South Africa's financial infrastructure with Rails.

Best regards,
The Rails Partnership Team

Rails Financial Infrastructure
rails.co.za | support@rails.co.za

This is an automated message. Please do not reply to this email.
    `.trim();
  }

  /**
   * Generate HTML for application approved email
   */
  generateApplicationApprovedHTML(bankData) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Rails - Partnership Approved!</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #030213, #1e40af); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px 20px; border: 1px solid #e2e8f0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
        .success { background: #f0f9ff; border: 1px solid #3b82f6; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .credentials { background: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; border-radius: 6px; font-family: monospace; margin: 20px 0; }
        .button { display: inline-block; background: #030213; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        ul { padding-left: 20px; }
        li { margin: 8px 0; }
        .warning { background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Congratulations!</h1>
            <p>Your Rails Partnership is Approved</p>
        </div>
        
        <div class="content">
            <div class="success">
                <h2>Welcome to Rails, ${bankData.bankName}!</h2>
                <p>Your bank has been selected for Rails' exclusive weekend settlements program. You're now part of South Africa's most innovative financial infrastructure network.</p>
            </div>
            
            <h3>🔐 Your API Credentials</h3>
            <div class="credentials">
                <strong>Bank Code:</strong> ${bankData.bankCode}<br>
                <strong>API Key:</strong> ${bankData.apiKey}<br>
                <strong>Environment:</strong> Production
            </div>
            
            <div class="warning">
                <strong>⚠️ Important:</strong> These credentials provide full access to Rails' weekend settlements API. Store them securely and never share them in public repositories or unsecured communications.
            </div>
            
            <h3>Next Steps</h3>
            <ul>
                <li>Review the API documentation at <a href="https://docs.rails.co.za">docs.rails.co.za</a></li>
                <li>Set up your webhook endpoints for settlement notifications</li>
                <li>Configure your systems for weekend settlement processing</li>
                <li>Contact our technical team for integration support</li>
            </ul>
            
            <a href="https://docs.rails.co.za" class="button">View API Documentation</a>
            
            <p>Our technical team will reach out within 24 hours to assist with your integration.</p>
            
            <p>Welcome to the future of South African banking!</p>
            
            <p>Best regards,<br>
            <strong>The Rails Partnership Team</strong></p>
        </div>
        
        <div class="footer">
            <p>Rails Financial Infrastructure<br>
            <a href="https://rails.co.za">rails.co.za</a> | support@rails.co.za</p>
            <p>For technical support: <a href="mailto:tech@rails.co.za">tech@rails.co.za</a></p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate plain text for application approved email
   */
  generateApplicationApprovedText(bankData) {
    return `
Rails Financial Infrastructure - Partnership Approved!

Congratulations! Welcome to Rails, ${bankData.bankName}!

Your bank has been selected for Rails' exclusive weekend settlements program. You're now part of South Africa's most innovative financial infrastructure network.

Your API Credentials:
- Bank Code: ${bankData.bankCode}
- API Key: ${bankData.apiKey}
- Environment: Production

⚠️ IMPORTANT: These credentials provide full access to Rails' weekend settlements API. Store them securely and never share them in public repositories or unsecured communications.

Next Steps:
- Review the API documentation at docs.rails.co.za
- Set up your webhook endpoints for settlement notifications
- Configure your systems for weekend settlement processing
- Contact our technical team for integration support

Our technical team will reach out within 24 hours to assist with your integration.

Welcome to the future of South African banking!

Best regards,
The Rails Partnership Team

Rails Financial Infrastructure
rails.co.za | support@rails.co.za
For technical support: tech@rails.co.za
    `.trim();
  }
}

module.exports = new EmailService();