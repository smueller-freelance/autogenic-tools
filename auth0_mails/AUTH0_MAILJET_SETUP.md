# Auth0 Custom Email Provider with Mailjet - Setup Guide

This guide explains how to set up and use the Mailjet custom email provider for Auth0.

## Overview

This implementation provides a custom email provider for Auth0 that uses Mailjet as the email delivery service. The provider is implemented in `auth0_custom_email_provider.js`.

## Prerequisites

1. **Auth0 Account** with access to configure custom email providers
2. **Mailjet Account** with API credentials
3. **Node.js** environment (v14+)

## Setup Instructions

### 1. Install Required Dependencies

```bash
npm install node-mailjet
```

### 2. Configure Environment Variables

Set the following environment variables in your Auth0 custom email provider configuration:

```
MAILJET_API_KEY=your_mailjet_api_key
MAILJET_API_SECRET=your_mailjet_api_secret
MAILJET_SENDER_EMAIL=noreply@yourdomain.com
LOG_LEVEL=info  # Optional: debug, info, or error
```

### 3. Auth0 Configuration

1. Go to your Auth0 Dashboard
2. Navigate to **Branding** > **Email Provider**
3. Select **Custom Provider**
4. Upload the `auth0_custom_email_provider.js` file
5. Configure the environment variables mentioned above

### 4. Email Provider Implementation

The implementation includes:

- **Mailjet Integration**: Uses the official `node-mailjet` package
- **Error Handling**: Comprehensive error handling with detailed logging
- **Logging**: Built-in logging with configurable log levels
- **Environment Support**: Works with different environments (dev, staging, production)

## Implementation Details

### Main Function: `onExecuteCustomEmailProvider`

```javascript
exports.onExecuteCustomEmailProvider = async (event, api) => {
  // Implementation handles:
  // - Mailjet client initialization
  // - Email data preparation
  // - Email sending via Mailjet API
  // - Success/failure handling
  // - Comprehensive error logging
}
```

### Event Structure

The `event` parameter contains:

```javascript
{
  to: {
    address: 'recipient@example.com',
    name: 'Recipient Name'
  },
  from: {
    address: 'sender@example.com',
    name: 'Sender Name'
  },
  subject: 'Email Subject',
  textBody: 'Plain text content',
  htmlBody: '<html>HTML content</html>'
}
```

### Error Handling

The implementation handles various error scenarios:

- Missing Mailjet credentials
- Mailjet API connection failures
- Email sending failures
- Invalid responses from Mailjet API

### Logging

The built-in logger supports three log levels:

- **DEBUG**: Detailed debugging information
- **INFO**: General operational information
- **ERROR**: Error conditions and failures

Set the `LOG_LEVEL` environment variable to control logging verbosity.

## Testing

To test the implementation:

1. Set up a test Mailjet account with sandbox credentials
2. Configure the environment variables with test credentials
3. Use Auth0's email testing functionality to send test emails
4. Verify emails are received and logs show successful delivery

## Troubleshooting

### Common Issues

1. **Mailjet credentials not configured**: Ensure `MAILJET_API_KEY` and `MAILJET_API_SECRET` are set
2. **Connection failures**: Check network connectivity and Mailjet API status
3. **Email not delivered**: Verify sender email is authorized in Mailjet
4. **Authentication errors**: Ensure API credentials are correct and not expired

### Debugging

Set `LOG_LEVEL=debug` to get detailed logging information for troubleshooting.

## Security Considerations

- Store Mailjet API credentials securely
- Use environment variables for sensitive data
- Rotate API keys regularly
- Monitor email sending activity for anomalies

## Support

For issues with this implementation, check:

1. Auth0 custom email provider documentation
2. Mailjet API documentation
3. Node.js error messages and stack traces

## Example Usage

When Auth0 needs to send an email (e.g., password reset, verification), it will call this custom provider with the email details, and the provider will send it via Mailjet.

## Environment Variables Reference

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `MAILJET_API_KEY` | Yes | Mailjet API Key | - |
| `MAILJET_API_SECRET` | Yes | Mailjet API Secret | - |
| `MAILJET_SENDER_EMAIL` | No | Sender email address | `noreply@autogenic.app` |
| `LOG_LEVEL` | No | Logging level | `info` |

## License

This implementation is provided under the MIT License.