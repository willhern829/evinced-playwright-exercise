const { test, expect } = require('../../fixtures/evinced-test');

test.describe('site', () => {
  test('FAQ accordion opens', async ({ page }) => {
    await page.goto('/');
    await page.getByText('How long will it take to get my orders?').click();
    await expect(page.getByRole('heading', { name: 'FAQ' })).toBeVisible();
  });

  test('contact page loads', async ({ page }) => {
    await page.goto('/pages/contact');
    await expect(page).toHaveURL(/contact/);
  });
});
