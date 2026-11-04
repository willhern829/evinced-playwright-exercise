// Runs once per test run: authenticate the Evinced SDK, not once per test.
require('dotenv').config();
const fs = require('fs');
const { setCredentials } = require('@evinced/js-playwright-sdk');

module.exports = async () => {
  const { EVINCED_SERVICE_ID, EVINCED_API_KEY } = process.env;
  if (!EVINCED_SERVICE_ID || !EVINCED_API_KEY) {
    throw new Error('Missing EVINCED_SERVICE_ID / EVINCED_API_KEY. Copy .env.example to .env.');
  }
  // evSaveFile does not create missing folders, so make them up front.
  for (const dir of ['evinced-reports/exercise', 'evinced-reports/scale']) fs.mkdirSync(dir, { recursive: true });

  await setCredentials({ serviceId: EVINCED_SERVICE_ID, secret: EVINCED_API_KEY });
};
