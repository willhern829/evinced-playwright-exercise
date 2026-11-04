// Runs once per test run: authenticate the Evinced SDK, not once per test.
require('dotenv').config();
const { setCredentials } = require('@evinced/js-playwright-sdk');

module.exports = async () => {
  const { EVINCED_SERVICE_ID, EVINCED_API_KEY } = process.env;
  if (!EVINCED_SERVICE_ID || !EVINCED_API_KEY) {
    throw new Error('Missing EVINCED_SERVICE_ID / EVINCED_API_KEY. Copy .env.example to .env.');
  }
  await setCredentials({ serviceId: EVINCED_SERVICE_ID, secret: EVINCED_API_KEY });
};
