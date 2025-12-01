const { assertGoogleContactsCredentialsReadable } = require('../health/googleContactsHealthCheck');

async function runStartupHealthChecks(logger = console) {
  try {
    const credentialsPath = await assertGoogleContactsCredentialsReadable();
    logger.info?.(`Google Contacts credentials verified at ${credentialsPath}`);
  } catch (error) {
    logger.error?.('Startup health check failed for Google Contacts credentials.', error);
    throw error;
  }
}

module.exports = {
  runStartupHealthChecks,
};
