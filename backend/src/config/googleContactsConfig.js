const path = require('path');

const DEFAULT_CREDENTIALS_PATH = path.join(process.cwd(), 'config', 'google-contacts', 'credentials.json');

function resolveCredentialsPath() {
  return process.env.GOOGLE_CONTACTS_CREDENTIALS_PATH || DEFAULT_CREDENTIALS_PATH;
}

module.exports = {
  DEFAULT_CREDENTIALS_PATH,
  resolveCredentialsPath,
};
