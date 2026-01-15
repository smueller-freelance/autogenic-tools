/**
 * Test script for Auth0 Custom Email Provider with Mailjet
 *
 * This script simulates the Auth0 environment and tests the email provider
 * without actually sending emails (uses mock Mailjet client).
 */

// Mock the Mailjet client for testing
const mockMailjet = {
  apiConnect: (apiKey, apiSecret, options) => {
    console.log(`[MOCK] Mailjet client connected with API key: ${apiKey.substring(0, 8)}...`);

    return {
      post: (endpoint, options) => {
        return {
          request: (data) => {
            console.log(`[MOCK] Sending email via Mailjet API v${options.version}`);
            console.log(`[MOCK] Email data:`, JSON.stringify(data, null, 2));

            // Simulate successful response
            return Promise.resolve({
              body: {
                Messages: [
                  {
                    Status: 'success',
                    To: data.Messages[0].To,
                    MessageID: Math.floor(Math.random() * 1000000),
                    MessageUUID: 'mock-uuid-' + Math.random().toString(36).substring(2, 8)
                  }
                ]
              }
            });
          }
        };
      }
    };
  }
};

// Mock the event object that Auth0 would provide
const mockAuth0Event = {
  to: {
    address: 'test.user@example.com',
    name: 'Test User'
  },
  from: {
    address: 'noreply@autogenic.app',
    name: 'Be Autogenic'
  },
  subject: 'Test Email from Auth0 Custom Provider',
  textBody: 'This is a test email sent via the Auth0 custom email provider using Mailjet.',
  htmlBody: '<html><body><h1>Test Email</h1><p>This is a test email sent via the Auth0 custom email provider using Mailjet.</p></body></html>'
};

// Mock the API object
const mockApi = {
  // Auth0 API methods would be here
  access: {
    deny: (reason) => {
      console.log(`[MOCK API] Access denied: ${reason}`);
    }
  }
};

// Set up environment variables for testing
process.env.MAILJET_API_KEY = 'mock_api_key_1234567890';
process.env.MAILJET_API_SECRET = 'mock_api_secret_abcdefghijklmnop';
process.env.MAILJET_SENDER_EMAIL = 'noreply@autogenic.app';
process.env.LOG_LEVEL = 'debug';

// Load the actual implementation
const emailProvider = require('./auth0_custom_email_provider');

// Test the implementation
async function testEmailProvider() {
  console.log('=== Testing Auth0 Custom Email Provider with Mailjet ===\n');

  try {
    // Replace the real Mailjet with our mock
    const originalMailjet = require.cache[require.resolve('node-mailjet')];
    require.cache[require.resolve('node-mailjet')].exports = mockMailjet;

    console.log('1. Testing with valid credentials...');
    await emailProvider.onExecuteCustomEmailProvider(mockAuth0Event, mockApi);
    console.log('✅ Test passed: Email sent successfully\n');

    console.log('2. Testing with missing credentials...');
    const originalKey = process.env.MAILJET_API_KEY;
    const originalSecret = process.env.MAILJET_API_SECRET;
    delete process.env.MAILJET_API_KEY;
    delete process.env.MAILJET_API_SECRET;

    try {
      await emailProvider.onExecuteCustomEmailProvider(mockAuth0Event, mockApi);
      console.log('❌ Test failed: Should have thrown an error');
    } catch (error) {
      console.log('✅ Test passed: Correctly threw error for missing credentials');
      console.log(`   Error message: ${error.message}\n`);
    }

    // Restore credentials
    process.env.MAILJET_API_KEY = originalKey;
    process.env.MAILJET_API_SECRET = originalSecret;

    console.log('3. Testing error handling...');
    // Mock a failed response
    const failingMailjet = {
      connect: () => {
        return {
          post: () => {
            return {
              request: () => {
                return Promise.resolve({
                  body: {
                    Messages: [
                      {
                        Status: 'error',
                        Errors: ['Invalid sender address']
                      }
                    ]
                  }
                });
              }
            };
          }
        };
      }
    };

    require.cache[require.resolve('node-mailjet')].exports = failingMailjet;

    try {
      await emailProvider.onExecuteCustomEmailProvider(mockAuth0Event, mockApi);
      console.log('❌ Test failed: Should have thrown an error for failed sending');
    } catch (error) {
      console.log('✅ Test passed: Correctly handled Mailjet API error');
      console.log(`   Error message: ${error.message}\n`);
    }

    console.log('=== All tests completed ===');

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
    process.exit(1);
  }
}

// Run the tests
testEmailProvider();
