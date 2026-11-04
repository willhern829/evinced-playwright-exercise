// Test 1: simple navigation to the home page.
// Mode: evAnalyze (single snapshot). One static page, nothing changes after load,
// so one scan of the current DOM is enough.
const { test, expect } = require('@playwright/test');
const { EvincedSDK } = require('@evinced/js-playwright-sdk');

test('home page loads and is scanned for accessibility issues', async ({ page }) => {
  const evinced = new EvincedSDK(page);

  await page.goto('/');
  await expect(page).toHaveTitle(/Love & Minter/);
  await expect(page.getByRole('navigation', { name: 'main' })).toBeVisible();

  const issues = await evinced.evAnalyze({ scan: { screenshots: { enabled: true } } });
  await evinced.evSaveFile(issues, 'html', 'evinced-reports/exercise/01-home-navigation.html');
  await evinced.evSaveFile(issues, 'json', 'evinced-reports/exercise/01-home-navigation.json');

  console.log(`Evinced found ${issues.length} issues on the home page`);
});
