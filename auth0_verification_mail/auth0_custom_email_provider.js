const mailjet = require('node-mailjet');

/**
 * Simple logger for Auth0 custom email provider
 * NOTE: Not shown in Auth0 environment; for local testing only
 */
class Auth0EmailLogger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
  }

  info(message, context = {}) {
    if (this._shouldLog('info')) {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, context);
    }
  }

  error(message, context = {}) {
    if (this._shouldLog('error')) {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, context);
    }
  }

  debug(message, context = {}) {
    if (this._shouldLog('debug')) {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, context);
    }
  }

  _shouldLog(level) {
    const levels = {
      debug: 0,
      info: 1,
      error: 2
    };
    return levels[level] >= levels[this.logLevel];
  }
}

const logger = new Auth0EmailLogger();

/**
 * Handler to be executed while sending an email notification
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {CustomEmailProviderAPI} api - Methods and utilities to help change the behavior of sending a email notification.
 */
exports.onExecuteCustomEmailProvider = async (event, api) => {
  try {
    // Extract email details from the event
    const to = event.notification.to;
    const toName = event.user.name;
    const subject = event.notification.subject;
    const textBody = event.notification.text;
    const htmlBody = event.notification.html;

    // Get Mailjet credentials from environment variables
    const mailjetApiKey = event.secrets.MAILJET_API_KEY;
    const mailjetApiSecret = event.secrets.MAILJET_API_SECRET;
    const mailjetSenderEmail = event.notification.from;
    const mailjetSenderName = event.secrets.MAILJET_SENDER_NAME || 'Be Autogenic';

    if (!mailjetApiKey || !mailjetApiSecret) {
      logger.error('Mailjet credentials not configured. Cannot send email.');
      throw new Error('Mailjet not configured');
    }

    // Initialize Mailjet client
    const mailjetClient = mailjet.apiConnect(
      mailjetApiKey,
      mailjetApiSecret,
      {
        config: {},
        options: {}
      }
    );

    // Prepare email data for Mailjet API
    const emailData = {
      Messages: [
        {
          From: {
            Email: mailjetSenderEmail,
            Name: mailjetSenderName
          },
          To: [
            {
              Email: to,
              Name: toName || 'User'
            }
          ],
          Subject: subject,
          TextPart: textBody,
          HTMLPart: htmlBody,
          CustomID: `Auth0Email_${Date.now()}`
        }
      ]
    };

    // Send email via Mailjet
    const request = mailjetClient
      .post('send', { version: 'v3.1' })
      .request(emailData);

    const response = await request;

    if (response.body.Messages && response.body.Messages[0].Status === 'success') {
      logger.info(`Email sent successfully to ${to} via Mailjet`);
      logger.debug(`Mailjet response: ${JSON.stringify(response.body)}`);
      return;
    } else {
      const errorMsg = response.body ? JSON.stringify(response.body) : 'Unknown error';
      logger.error(`Failed to send email via Mailjet: ${errorMsg}`);
      throw new Error(`Mailjet email sending failed: ${errorMsg}`);
    }

  } catch (error) {
    logger.error(`Error sending email via Mailjet: ${error}`, {
      error: error,
      eventDetails: {
        to: event.notification.to,
        subject: event.notification.subject,
        timestamp: new Date().toISOString()
      }
    });

    // Re-throw the error to let Auth0 handle it appropriately
    throw error;
  }
};
