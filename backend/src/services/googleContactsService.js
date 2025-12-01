const fs = require('fs/promises');
const { assertGoogleContactsCredentialsReadable } = require('../health/googleContactsHealthCheck');
const { resolveCredentialsPath } = require('../config/googleContactsConfig');

async function loadServiceAccountCredentials() {
  const credentialsPath = await assertGoogleContactsCredentialsReadable();

  try {
    const raw = await fs.readFile(credentialsPath, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      const hint = `Google Contacts credentials file is missing at ${credentialsPath}. ` +
        'Set GOOGLE_CONTACTS_CREDENTIALS_PATH or place credentials.json in the default path.';
      const enrichedError = new Error(hint);
      enrichedError.cause = error;
      throw enrichedError;
    }

    if (error.name === 'SyntaxError') {
      const enrichedError = new Error(`Google Contacts credentials at ${credentialsPath} are not valid JSON.`);
      enrichedError.cause = error;
      throw enrichedError;
    }

    throw error;
  }
}

async function saveContact(contactPayload) {
  if (!contactPayload || !contactPayload.fullName || !contactPayload.email) {
    throw new Error('Contact payload must include fullName and email fields.');
  }

  const credentials = await loadServiceAccountCredentials();
  const credentialsPath = resolveCredentialsPath();

  // TODO: Wire credentials into the Google People API client to persist the contact.
  // The current implementation focuses on robust credential handling and pre-flight validation.
  return {
    status: 'pending-implementation',
    message: 'Contact saving invoked; connect to Google People API with the loaded credentials.',
    credentialsPath,
    subject: contactPayload.fullName,
  };
}

module.exports = {
  loadServiceAccountCredentials,
  saveContact,
};
