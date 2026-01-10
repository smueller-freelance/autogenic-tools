const mailjet = require('node-mailjet');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

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

  warn(message, context = {}) {
    if (this._shouldLog('warn') || this._shouldLog('debug')) {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, context);
    }
  }

  _shouldLog(level) {
    const levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    return levels[level] >= levels[this.logLevel];
  }
}

const logger = new Auth0EmailLogger();

// App color palette matching Be Autogenic branding
const EMAIL_COLORS = {
  primary_blue: '#5B9BD5',
  soft_lavender: '#B4A7D6',
  calm_green: '#70AD47',
  light_beige: '#F4F1E8',
  soft_gray: '#E6E6E6',
  dark_gray: '#4A4A4A',
  white: '#FFFFFF',
  success_green: '#70AD47',
  error_red: '#D9534F'
};

// Email translations for different languages
const EMAIL_TRANSLATIONS = {
  'en': {
    app_name: 'Be Autogenic',
    tagline: 'Your journey to relaxation and better sleep',
    footer_text: 'This email was sent to you because you have an account with Be Autogenic.',
    hi: 'Hi',
    best_regards: 'Best regards',
    the_team: 'The Be Autogenic Team',
    welcome_subject: 'Welcome to Be Autogenic!',
    welcome_title: 'Welcome to Be Autogenic!',
    welcome_intro: 'We\'re thrilled to have you on board! You\'ve just taken the first step toward a more relaxed, peaceful you.',
    welcome_account_ready: '✓ Your account is ready!',
    welcome_account_text: 'You can now start creating personalized autogenic training sessions tailored to your needs.',
    welcome_whats_next: 'What\'s next?',
    welcome_whats_next_intro: 'Here are a few things you can explore:',
    welcome_create_session: 'Create your first session – Customize it with your preferred language and settings',
    welcome_discover: 'Discover autogenic training – Learn about this powerful relaxation technique',
    welcome_set_routine: 'Set your routine – Regular practice brings the best results',
    welcome_closing: 'Remember, the journey to deep relaxation starts with a single session. We\'re here to support you every step of the way.',
    welcome_sign_off: 'Wishing you peaceful moments,',
    verify_subject: 'Verify Your Email Address',
    verify_title: 'Verify Your Email Address',
    verify_intro: 'Welcome to Be Autogenic! Please verify your email address to complete your registration.',
    verify_instructions: 'Click the button below to verify your email address:',
    verify_button: 'VERIFY EMAIL ADDRESS',
    verify_expiration: 'This verification link will expire in 24 hours.',
    verify_help: 'If you didn\'t request this verification, you can safely ignore this email.',
    verify_sign_off: 'Looking forward to helping you relax,'
  },
  'de': {
    app_name: 'Be Autogenic',
    tagline: 'Ihre Reise zu Entspannung und besserem Schlaf',
    footer_text: 'Diese E-Mail wurde Ihnen gesendet, weil Sie ein Konto bei Be Autogenic haben.',
    hi: 'Hallo',
    best_regards: 'Mit freundlichen Grüßen',
    the_team: 'Das Be Autogenic Team',
    welcome_subject: 'Willkommen bei Be Autogenic!',
    welcome_title: 'Willkommen bei Be Autogenic!',
    welcome_intro: 'Wir freuen uns sehr, Sie an Bord zu haben! Sie haben gerade den ersten Schritt zu einem entspannteren, friedlicheren Ich gemacht.',
    welcome_account_ready: '✓ Ihr Konto ist bereit!',
    welcome_account_text: 'Sie können jetzt personalisierte autogene Trainingssitzungen erstellen, die auf Ihre Bedürfnisse zugeschnitten sind.',
    welcome_whats_next: 'Was kommt als Nächstes?',
    welcome_whats_next_intro: 'Hier sind einige Dinge, die Sie erkunden können:',
    welcome_create_session: 'Erstellen Sie Ihre erste Sitzung – Passen Sie sie mit Ihrer bevorzugten Sprache und Einstellungen an',
    welcome_discover: 'Entdecken Sie autogenes Training – Erfahren Sie mehr über diese kraftvolle Entspannungstechnik',
    welcome_set_routine: 'Erstellen Sie Ihre Routine – Regelmäßiges Üben bringt die besten Ergebnisse',
    welcome_closing: 'Denken Sie daran: Die Reise zur tiefen Entspannung beginnt mit einer einzigen Sitzung. Wir sind hier, um Sie bei jedem Schritt zu unterstützen.',
    welcome_sign_off: 'Wir wünschen Ihnen friedliche Momente,',
    verify_subject: 'Bestätigen Sie Ihre E-Mail-Adresse für Be Autogenic',
    verify_title: 'Bestätigen Sie Ihre E-Mail-Adresse',
    verify_intro: 'Willkommen bei Be Autogenic! Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihre Registrierung abzuschließen.',
    verify_instructions: 'Klicken Sie auf die Schaltfläche unten, um Ihre E-Mail-Adresse zu bestätigen:',
    verify_button: 'E-MAIL-ADRESSE BESTÄTIGEN',
    verify_expiration: 'Dieser Bestätigungslink läuft in 24 Stunden ab.',
    verify_help: 'Wenn Sie diese Bestätigung nicht angefordert haben, können Sie diese E-Mail sicher ignorieren.',
    verify_sign_off: 'Wir freuen uns darauf, Ihnen beim Entspannen zu helfen,'
  },
  'ro': {
    app_name: 'Be Autogenic',
    tagline: 'Călătoria ta către relaxare și somn mai bun',
    footer_text: 'Acest e-mail v-a fost trimis deoarece aveți un cont la Be Autogenic.',
    hi: 'Bună',
    best_regards: 'Cu stimă',
    the_team: 'Echipa Be Autogenic',
    welcome_subject: 'Bun venit la Be Autogenic!',
    welcome_title: 'Bun venit la Be Autogenic!',
    welcome_intro: 'Suntem încântați să vă avem alături! Tocmai ați făcut primul pas către o versiune mai relaxată și liniștită a dvs.',
    welcome_account_ready: '✓ Contul dvs. este gata!',
    welcome_account_text: 'Acum puteți începe să creați sesiuni de antrenament autogen personalizate, adaptate nevoilor dvs.',
    welcome_whats_next: 'Ce urmează?',
    welcome_whats_next_intro: 'Iată câteva lucruri pe care le puteți explora:',
    welcome_create_session: 'Creați prima sesiune – Personalizați-o cu limba și setările preferate',
    welcome_discover: 'Descoperiți antrenamentul autogen – Aflați despre această tehnică puternică de relaxare',
    welcome_set_routine: 'Stabiliți rutina – Practica regulată aduce cele mai bune rezultate',
    welcome_closing: 'Nu uitați, călătoria către relaxarea profundă începe cu o singură sesiune. Suntem aici pentru a vă susține la fiecare pas.',
    welcome_sign_off: 'Vă dorim momente pașnice,',
    verify_subject: 'Confirmați adresa dvs. de e-mail',
    verify_title: 'Confirmați adresa dvs. de e-mail',
    verify_intro: 'Bun venit la Be Autogenic! Vă rugăm să confirmați adresa dvs. de e-mail pentru a finaliza înregistrarea.',
    verify_instructions: 'Faceți clic pe butonul de mai jos pentru a vă confirma adresa de e-mail:',
    verify_button: 'CONFIRMAȚI ADRESA DE E-MAIL',
    verify_expiration: 'Acest link de confirmare va expira în 24 de ore.',
    verify_help: 'Dacă nu ați solicitat această confirmare, puteți ignora în siguranță acest e-mail.',
    verify_sign_off: 'Ne bucurăm să vă ajutăm să vă relaxați,'
  }
};

function getTranslation(key, lang = 'en') {
  return EMAIL_TRANSLATIONS[lang]?.[key] || EMAIL_TRANSLATIONS['en'][key] || key;
}

/**
 * Get base64 encoded image data from URL or local file
 */
async function getImageBase64(imageUrl) {
  try {
    // Try to download from URL first
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'binary').toString('base64');
  } catch (urlError) {
    const errorMessage = urlError instanceof Error ? urlError.message : String(urlError);
    logger.debug(`Failed to download image from URL: ${imageUrl}, trying local fallback: ${errorMessage}`);

    // Try local fallback paths
    const localPaths = [
      path.join(__dirname, '..', '..', 'autogenic-backend', 'assets', 'images', path.basename(imageUrl)),
      path.join(__dirname, '..', '..', 'autogenic-frontend', 'assets', 'images', path.basename(imageUrl)),
      path.join(__dirname, '..', '..', 'medhubimpact', 'be-autogenic', path.basename(imageUrl))
    ];

    for (const localPath of localPaths) {
      try {
        if (fs.existsSync(localPath)) {
          const imageData = await fs.promises.readFile(localPath);
          return imageData.toString('base64');
        }
      } catch (localError) {
        const localErrorMessage = localError instanceof Error ? localError.message : String(localError);
        logger.debug(`Failed to read local image ${localPath}: ${localErrorMessage}`);
      }
    }

    logger.warn(`No image found for ${imageUrl}, using placeholder`);
    return ''; // Return empty string, will be handled by template
  }
}

/**
 * Get the Be Autogenic email template that matches the backend email service
 */
async function getBeAutogenicEmailTemplate(content, lang = 'en') {
  const t = (key) => getTranslation(key, lang);

  // Get base64 encoded images
  const logoBase64 = await getImageBase64('https://medhubimpact.com/be-autogenic/logo_alpha.png');
  const splashBase64 = await getImageBase64('https://medhubimpact.com/be-autogenic/splash_alpha.png');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Be Autogenic</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: ${EMAIL_COLORS.soft_gray};
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: ${EMAIL_COLORS.white};
        }
        .header {
            background: linear-gradient(135deg, ${EMAIL_COLORS.primary_blue} 0%, ${EMAIL_COLORS.soft_lavender} 100%);
            padding: 40px 20px;
            text-align: center;
            position: relative;
        }
        .header-logo {
            max-width: 200px;
            height: auto;
            margin-bottom: 10px;
        }
        .header h1 {
            color: ${EMAIL_COLORS.white};
            margin: 0;
            font-size: 28px;
            font-weight: 600;
            letter-spacing: 0.5px;
        }
        .content {
            padding: 40px 30px;
            color: ${EMAIL_COLORS.dark_gray};
            line-height: 1.6;
        }
        .content h2 {
            color: ${EMAIL_COLORS.primary_blue};
            font-size: 24px;
            margin-top: 0;
            margin-bottom: 20px;
        }
        .content h3 {
            color: ${EMAIL_COLORS.dark_gray};
            font-size: 18px;
            margin-top: 25px;
            margin-bottom: 15px;
        }
        .content p {
            margin: 0 0 16px 0;
            font-size: 16px;
        }
        .button {
            display: inline-block;
            padding: 14px 32px;
            margin: 20px 0;
            background-color: ${EMAIL_COLORS.primary_blue};
            color: ${EMAIL_COLORS.white} !important;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 500;
            font-size: 16px;
            text-align: center;
        }
        .card {
            background-color: ${EMAIL_COLORS.light_beige};
            border-radius: 16px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid ${EMAIL_COLORS.primary_blue};
        }
        .success-card {
            background-color: rgba(112, 173, 71, 0.1);
            border-left-color: ${EMAIL_COLORS.success_green};
        }
        .error-card {
            background-color: rgba(217, 83, 79, 0.1);
            border-left-color: ${EMAIL_COLORS.error_red};
        }
        .footer {
            background-color: ${EMAIL_COLORS.light_beige};
            padding: 30px;
            text-align: center;
            color: ${EMAIL_COLORS.dark_gray};
            font-size: 14px;
            border-top: 1px solid ${EMAIL_COLORS.soft_gray};
            position: relative;
        }
        .footer p {
            margin: 8px 0;
        }
        .footer-splash {
            max-width: 150px;
            height: auto;
            margin: 20px auto 10px;
            opacity: 0.6;
        }
        .icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        @media only screen and (max-width: 600px) {
            .content {
                padding: 30px 20px;
            }
            .header h1 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            ${logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" alt="Be Autogenic Logo" class="header-logo" />` : '<h1>Be Autogenic</h1>'}
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            ${splashBase64 ? `<img src="data:image/png;base64,${splashBase64}" alt="Be Autogenic" class="footer-splash" />` : ''}
            <p><strong>${t('app_name')}</strong></p>
            <p>${t('tagline')}</p>
            <p style="color: ${EMAIL_COLORS.soft_gray}; font-size: 12px; margin-top: 20px;">
                ${t('footer_text')}
            </p>
        </div>
    </div>
</body>
</html>
`;
}

/**
 * Handler to be executed while sending an email notification
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {CustomEmailProviderAPI} api - Methods and utilities to help change the behavior of sending a email notification.
 */
exports.onExecuteCustomEmailProvider = async (event, api) => {
  try {
    // Extract email details from the event
    const to = event.notification.to;
    // event.user.name is updated by Auth0 too late during signup
    const toName = event.user.user_metadata?.name || event.user.name || 'User';
    const textBody = event.notification.text;
    const htmlBody = event.notification.html;

    // Extract locale from Auth0 event (sent by backend during signup/profile update)
    // Try to get locale from user metadata, app_metadata, or direct locale field
    const userLocale = event.user.user_metadata?.locale ||
                      event.user?.app_metadata?.locale ||
                      event.user?.locale ||
                      event.notification.locale ||
                      'en';

    // Normalize locale to supported languages (en, de, ro)
    const normalizedLocale = userLocale?.startsWith('de') ? 'de' :
                           userLocale?.startsWith('ro') ? 'ro' : 'en';

    // Get Mailjet credentials from environment variables
    const mailjetApiKey = event.secrets.MAILJET_API_KEY;
    const mailjetApiSecret = event.secrets.MAILJET_API_SECRET;
    const mailjetSenderEmail = event.notification.from;
    const mailjetSenderName = event.secrets.MAILJET_SENDER_NAME || 'Be Autogenic';

    if (!mailjetApiKey || !mailjetApiSecret) {
      logger.error('Mailjet credentials not configured. Cannot send email.');
      throw new Error('Mailjet not configured');
    }

    // Determine email type based on subject/content
    //const isVerificationEmail = subject.toLowerCase().includes('verify') ||
    //                           textBody.toLowerCase().includes('verify') ||
    //                           htmlBody.toLowerCase().includes('verify');
    const isVerificationEmail = event.notification.message_type === 'verify_email';

    let finalHtmlBody = htmlBody;
    let finalTextBody = textBody;
    let subject = event.notification.subject;

    // For verification emails, wrap in Be Autogenic template while preserving verification links
    if (isVerificationEmail) {
      const t = (key) => getTranslation(key, normalizedLocale);

      subject = t('verify_subject');

      // Extract verification link from textBody (as per requirements)
      // Look for Auth0 verification URL pattern in the plain text
      const verificationLinkMatch = textBody.match(/https:\/\/autogenic\.eu\.auth0\.com\/u\/email-verification[^\s]+/);
      const verificationLink = verificationLinkMatch ? verificationLinkMatch[0] : '#';

      // Create Be Autogenic styled verification email
      const verificationContent = `
        <div style="text-align: center;">
            <div class="icon">🔐</div>
            <h2>${t('verify_title')}</h2>
        </div>

        <p>${t('hi')} ${toName.split('@')[0]},</p>

        <p>${t('verify_intro')}</p>

        <div class="card success-card">
            <h3 style="margin-top: 0; color: ${EMAIL_COLORS.calm_green};">${t('verify_instructions')}</h3>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" class="button" style="color: ${EMAIL_COLORS.white} !important; text-decoration: none;">
                ${t('verify_button')}
            </a>
        </div>

        <p style="color: ${EMAIL_COLORS.dark_gray}; font-size: 14px; margin-top: 30px;">
            <em>${t('verify_expiration')}</em>
        </p>

        <p style="font-size: 12px; color: ${EMAIL_COLORS.soft_gray}; margin-top: 20px;">
            ${t('verify_help')}
        </p>

        <p style="margin-top: 30px;">${t('verify_sign_off')}<br><strong>${t('the_team')}</strong></p>
      `;

      finalHtmlBody = await getBeAutogenicEmailTemplate(verificationContent, normalizedLocale);
      finalTextBody = `${t('hi')} ${toName.split('@')[0]},\n\n${t('verify_intro')}\n\n${t('verify_instructions')}\n${verificationLink}\n\n${t('verify_expiration')}\n\n${t('verify_help')}\n\n${t('verify_sign_off')}\n${t('the_team')}`;
    } else {
      // For non-verification emails, wrap the original content in Be Autogenic template
      // Extract main content from original HTML (strip headers, footers, etc.)
      const contentMatch = htmlBody.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      const mainContent = contentMatch ? contentMatch[1] : htmlBody;

      // Clean up the content to remove any existing styling that might conflict
      const cleanedContent = mainContent
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove style tags
        .replace(/style=["'][^"']*["']/gi, '') // Remove inline styles
        .replace(/class=["'][^"']*["']/gi, ''); // Remove class attributes

      finalHtmlBody = await getBeAutogenicEmailTemplate(cleanedContent, normalizedLocale);
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
              Name: toName.split('@')?.[0] || 'User'
            }
          ],
          Subject: subject,
          TextPart: finalTextBody,
          HTMLPart: finalHtmlBody,
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = error instanceof Error ? error : { message: String(error) };

    logger.error(`Error sending email via Mailjet: ${errorMessage}`, {
      error: errorDetails,
      eventDetails: {
        to: event.notification.to,
        subject: event.notification.subject,
        timestamp: new Date().toISOString()
      }
    });

    // Re-throw the error to let Auth0 handle it appropriately
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(errorMessage);
    }
  }
};
