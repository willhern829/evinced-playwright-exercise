# Evinced Playwright JS SDK: home exercise

Playwright tests against the demo store at https://a11y-audits.com, with the Evinced Playwright JS SDK (`@evinced/js-playwright-sdk` 2.60.1) scanning for accessibility issues and writing HTML reports with screenshots.

## Run it

```bash
cp .env.example .env            # add EVINCED_SERVICE_ID and EVINCED_API_KEY
cp .npmrc.example .npmrc        # add the JFrog registry + token (one line)
npm install
npx playwright install chromium
npm test                        # all tests
npm run test:exercise           # parts 1-4 only
npm run test:scale              # part 5 only
npm run a11y:off                # same tests, Evinced switched off
```

`.env` and `.npmrc` are gitignored. No credentials are in this repo or its history.

## What's here

```
global-setup.js                    setCredentials() once per run
playwright.config.js               two projects (exercise, scale) + Evinced aggregated reporter
evConfig.yaml                      suite-wide Evinced settings (screenshots on, aggregated report)
tests/exercise/01-home-navigation  simple navigation, evAnalyze()
tests/exercise/02-add-to-cart-flow multi-step flow, evStart()/evStop()
fixtures/evinced-test.js           scale pattern: auto fixture wraps every test
tests/scale/*.spec.js              ordinary specs with no Evinced code in them
evinced-reports/                   generated reports (committed so you can open them)
```

## Parts 1-4: the two tests and why each uses its mode

**Test 1, home page navigation: `evAnalyze()`.** Load `/`, check the title and main nav, take one snapshot scan. The page is static after load, so a single scan of the current DOM covers it. Continuous mode would add overhead and nothing else.
Report: `evinced-reports/exercise/01-home-navigation.html` (16 issues: 7 critical, 9 serious).

**Test 2, shopping flow: `evStart()` / `evStop()`.** Switch a tab on the home page, go to the catalog, open a product, set quantity to 2, add to cart, check the "Added to your cart!" drawer, open the cart, check the line item, quantity (2) and total ($58.00 = 2 x $29.00), then remove it and check the cart is empty. The DOM changes constantly (tabs, drawer, page loads, cart updates), so continuous mode is the right one: it scans in the background and captures every state across all four pages, not only the final one.
Report: `evinced-reports/exercise/02-add-to-cart-flow.html` (20 to 28 issues depending on the run, across `/`, `/collections/all`, the product page and `/cart`).

**Screenshots** are turned on with `scan.screenshots.enabled: true` (per call in the exercise tests, suite-wide in `evConfig.yaml`). In the HTML report, open any issue's info icon to see the page screenshot with the element highlighted.

## Part 5: Evinced across a large suite

The goal is no Evinced code inside individual tests. Three pieces:

1. **Credentials once:** `global-setup.js` calls `setCredentials()` a single time per run.
2. **An auto fixture:** `fixtures/evinced-test.js` extends Playwright's `test` with a fixture marked `{ auto: true }`. It runs `evStart()` before every test and `evStop()` + `evSaveFile()` after it, labeling each report with the test name. An existing suite adopts it by changing one line in each spec, the import:
   ```js
   // before
   const { test, expect } = require('@playwright/test');
   // after
   const { test, expect } = require('../../fixtures/evinced-test');
   ```
   That's a find-and-replace (or a codemod) across the repo, and new tests get scanning by default. The `tests/scale/` specs show it: they read like normal functional tests.
3. **One aggregated report:** the Evinced reporter in `playwright.config.js` plus the `report` block in `evConfig.yaml` combine every test's results into `evinced-reports/aggregated/aggregatedReport.html`.

Operating it at scale:
- **Kill switch:** `EV_SWITCH_ON=false` turns scanning off for a run without touching code (`npm run a11y:off`), useful for fast local runs or isolating whether a failure is the app or the scan.
- **CI:** credentials come from CI secrets as environment variables; nothing changes in the tests.
- **Gating, as a next step:** save a JSON baseline with `evSaveFile` and use `evCompare` with `failOnNew` so a build fails only on new accessibility issues, not the existing backlog.

## Issues hit and how I solved them

- **`evSaveFile` failed with ENOENT.** It doesn't create missing folders. Fixed by creating the report folders in `global-setup.js`.
- **The tabs never set `aria-selected`.** My first validation asserted the active tab's `aria-selected="true"` and failed. That's one of the site's planted accessibility bugs (screen readers can't tell which tab is active), and Evinced flags it in the report. I changed the assertion to check the visible panel content instead.
- **Two `h1` headings on the product page some of the time.** It broke a strict locator. I now target the heading by name.
- **A hang that looked like the SDK but wasn't.** The flow timed out intermittently on the click after "Add to cart". The stack trace pointed inside the SDK's click wrapper (in continuous mode Evinced scans the page before each click), so I first suspected the SDK. A control run with `EV_SWITCH_ON=false` failed the same way, which ruled it out. The real cause: Shopify opens an `aria-modal` cart drawer that intercepts pointer events on the page behind it, so the header cart link wasn't clickable. The fix was to continue the flow the way a user would, through the drawer's "View cart" link. After that: 8/8 passes with Evinced on, and the full suite passed 3 runs in a row.
- **Issue counts vary between runs of the flow (20 to 28).** Continuous mode records whatever DOM states it catches, so timing (how long the drawer is open, when lazy content loads) changes what gets scanned. Test 1's single snapshot gives 16 every run. For trend tracking in CI, compare against a baseline with `evCompare` rather than raw counts.
