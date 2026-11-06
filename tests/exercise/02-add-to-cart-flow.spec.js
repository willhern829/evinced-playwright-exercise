// Test 2: multi-step shopping flow with validations.
// Mode: evStart / evStop (continuous). The flow switches a tab, changes pages,
// opens the cart drawer and updates the cart, so we want every DOM state scanned,
// not just the last page.
const { test, expect } = require('@playwright/test');
const { EvincedSDK } = require('@evinced/js-playwright-sdk');

const PRODUCT_PATH = '/products/3-5mm-to-3-5mm-audio-cable-black';
const PRODUCT_NAME = '3.5mm To 3.5mm Audio Cable (Black)';

test('browse, add a product to the cart, and verify the cart', async ({ page }) => {
  const evinced = new EvincedSDK(page);
  await evinced.evStart({ scan: { screenshots: { enabled: true } } });

  // Home: interact with dynamic content so those states get scanned too.
  await page.goto('/');
  await page.getByRole('tab', { name: 'Secured checkout' }).click();
  // Validate on the visible panel. The tabs never set aria-selected (a real a11y
  // bug on this site), so we can't assert on it. Evinced flags the same tab widget
  // as "Missing contextual labeling" on the tab panels.
  await expect(page.getByRole('tabpanel')).toContainText('payment processes are guarded');

  // Catalog -> product page.
  await page.getByRole('navigation', { name: 'main' }).getByRole('link', { name: 'Catalog' }).click();
  await expect(page).toHaveURL(/\/collections\/all/);
  await page.locator(`main a[href="${PRODUCT_PATH}"]`).first().click();
  await expect(page.getByRole('heading', { level: 1, name: PRODUCT_NAME })).toBeVisible();

  // Set quantity to 2 and add to cart.
  await page.getByRole('button', { name: 'Increase quantity' }).click();
  await expect(page.getByRole('textbox', { name: 'Quantity:' })).toHaveValue('2');
  const added = page.waitForResponse(r => r.url().includes('/cart/add') && r.ok());
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await added;
  // Shopify opens a modal "added to cart" drawer. Validate it, then continue
  // from inside it. It's aria-modal and blocks clicks on the page behind it.
  const drawer = page.getByRole('dialog').filter({ hasText: 'Added to your cart!' });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole('link', { name: PRODUCT_NAME })).toBeVisible();
  await drawer.getByRole('link', { name: 'View cart' }).click();

  // Cart page: validate line item, quantity, and total (2 x $29.00).
  await expect(page).toHaveURL(/\/cart/);
  const row = page.getByRole('row', { name: new RegExp(PRODUCT_NAME.replace(/[.()]/g, '\\$&')) });
  await expect(row.getByRole('link', { name: PRODUCT_NAME })).toBeVisible();
  await expect(row.getByRole('textbox', { name: 'Change quantity' })).toHaveValue('2');
  await expect(row).toContainText('$58.00');

  // Remove it and validate the cart is empty again.
  await row.getByRole('link', { name: 'Remove' }).click();
  await expect(page.getByRole('row', { name: new RegExp(PRODUCT_NAME.replace(/[.()]/g, '\\$&')) })).toHaveCount(0);

  // Log in / log out was part of the brief. On this store the Account link hands off
  // to Shopify's hosted passwordless login (shopify.com, one-time emailed code), so it
  // can't be scripted without a real customer account. Validate the handoff instead,
  // via a request so the scanned page stays on the demo domain.
  const accountLink = page.getByRole('link', { name: /account/i }).first();
  await expect(accountLink).toHaveAttribute('href', '/account');
  const account = await page.request.get('/account', { maxRedirects: 0 });
  expect(account.status()).toBe(302);
  expect(account.headers()['location']).toMatch(/^https:\/\/shopify\.com\//);

  const issues = await evinced.evStop();
  await evinced.evSaveFile(issues, 'html', 'evinced-reports/exercise/02-add-to-cart-flow.html');
  await evinced.evSaveFile(issues, 'json', 'evinced-reports/exercise/02-add-to-cart-flow.json');

  console.log(`Evinced found ${issues.length} issues across the cart flow`);
});
