const fs = require('fs/promises');
const { constants } = require('fs');
const { resolveCredentialsPath } = require('../config/googleContactsConfig');

async function assertGoogleContactsCredentialsReadable() {
  const credentialsPath = resolveCredentialsPath();

  try {
    await fs.access(credentialsPath, constants.R_OK);
  } catch (error) {
    const hint = `Google Contacts credentials file not found or unreadable at ${credentialsPath}. ` +
      'Set GOOGLE_CONTACTS_CREDENTIALS_PATH or place credentials.json in the default path.';
    const enrichedError = new Error(hint);
    enrichedError.cause = error;
    throw enrichedError;
  }

  return credentialsPath;
}

module.exports = {
  assertGoogleContactsCredentialsReadable,
};
