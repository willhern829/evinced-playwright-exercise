// @ts-check
require('dotenv').config();
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  globalSetup: require.resolve('./global-setup'),
  timeout: 60_000,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    // Evinced aggregated reporter: one combined a11y report per run (settings in evConfig.yaml).
    ['@evinced/js-playwright-sdk/reporter'],
  ],
  use: {
    baseURL: process.env.DEMO_BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    // Parts 1-4: the two exercise tests, Evinced wired in by hand to show each mode.
    { name: 'exercise', testDir: './tests/exercise', use: { ...devices['Desktop Chrome'] } },
    // Part 5: suite-wide integration via an auto fixture. Tests contain no Evinced code.
    { name: 'scale', testDir: './tests/scale', use: { ...devices['Desktop Chrome'] } },
  ],
});
