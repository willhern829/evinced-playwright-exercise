// A "normal" functional spec, written as if it already existed in a customer suite.
// The only Evinced-related line is the import: the fixture does the rest.
const { test, expect } = require('../../fixtures/evinced-test');

test.describe('catalog', () => {
  test('catalog lists products', async ({ page }) => {
    await page.goto('/collections/all');
    await expect(page.locator('main a[href*="/products/"]').first()).toBeVisible();
  });

  test('product page shows price and add to cart', async ({ page }) => {
    await page.goto('/products/mw65-silver-metal-brown-leather');
    await expect(page.getByRole('heading', { level: 1, name: /MW65/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add to cart' })).toBeEnabled();
  });
});
