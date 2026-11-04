// Scale pattern: one shared `test` object that runs Evinced around EVERY test.
//
// Existing specs change one line, their import:
//   const { test, expect } = require('@playwright/test');
//   ->
//   const { test, expect } = require('../../fixtures/evinced-test');
//
// No per-test init, no evStart/evStop in test bodies. Credentials are set once in
// global-setup.js. Turn scanning off for a run with EV_SWITCH_ON=false.
const { test: base, expect } = require('@playwright/test');
const { EvincedSDK } = require('@evinced/js-playwright-sdk');

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const test = base.extend({
  // Exposed so a test can still call evAnalyze() or read results if it wants to.
  evinced: async ({ page }, use) => {
    await use(new EvincedSDK(page));
  },

  // auto: true means this wraps every test that imports this file.
  evincedSession: [
    async ({ evinced }, use, testInfo) => {
      evinced.testRunInfo.addLabel({ testName: testInfo.title, testFile: testInfo.file });
      await evinced.evStart();
      await use();
      const issues = await evinced.evStop();
      const name = slug(`${testInfo.titlePath.slice(1).join(' ')}`);
      await evinced.evSaveFile(issues, 'html', `evinced-reports/scale/${name}.html`);
      testInfo.annotations.push({ type: 'evinced', description: `${issues.length} issues` });
    },
    { auto: true },
  ],
});

module.exports = { test, expect };
