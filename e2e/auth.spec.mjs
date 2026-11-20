import { loginAs, logout, USERS, BASE } from './helpers/auth.js';

const NEW_PASS = 'TestPass123!';

export const tests = [
  {
    name: 'login success then password change reaches app shell',
    async fn(page) {
      await loginAs(page, { ...USERS.admin, newPassword: NEW_PASS });
      await page.waitForSelector('aside#sidebar', { state: 'visible' });
      await page.waitForSelector('[data-tab="inventory"]', { state: 'visible' });
      const userText = await page.locator('.user-info .small').textContent();
      if (!/Administrator/i.test(userText || '')) {
        throw new Error('Expected authenticated admin user, got: ' + userText);
      }
    },
  },
  {
    name: 'login with wrong password shows error',
    async fn(page) {
    await page.goto(BASE);
    await page.waitForSelector('#loginForm', { state: 'visible' });
    await page.fill('input#username', USERS.admin.username);
    await page.fill('input#password', 'wrong-password');
      await page.click('button.login-submit');
      await page.waitForSelector('#loginError', { state: 'visible', timeout: 5000 });
      const err = await page.locator('#loginError').textContent();
      if (!/invalid/i.test(err || '')) throw new Error('Expected invalid-credentials error, got: ' + err);
    },
  },
  {
    name: 'account locks out after repeated failed logins',
    async fn(page) {
      await page.goto(BASE);
      await page.waitForSelector('#loginForm', { state: 'visible' });
      // 6 failed attempts (MAX_FAILED_ATTEMPTS=5, so 6th should trigger lockout)
      for (let i = 0; i < 6; i++) {
        await page.fill('input#username', USERS.admin.username);
        await page.fill('input#password', 'bad-password');
        await page.click('button.login-submit');
        await page.waitForTimeout(100);
      }
      // Check rate limit state directly via the exposed API
      const status = await page.evaluate((username) => window.RatnaOS.auth.rateLimitStatus(username), USERS.admin.username);
      if (!status.lockedOut) throw new Error('Account should be locked out after repeated failures, got: ' + JSON.stringify(status));
    },
  },
  {
    name: 'logout returns to login page',
    async fn(page) {
      await loginAs(page, { ...USERS.manager, newPassword: NEW_PASS });
      await logout(page);
      await page.waitForSelector('#loginForm', { state: 'visible', timeout: 10000 });
    },
  },
  {
    name: 'viewer role can view inventory but cannot create items',
    async fn(page) {
      await loginAs(page, { ...USERS.viewer, newPassword: NEW_PASS });
      await page.waitForSelector('aside#sidebar', { state: 'visible' });
      // Viewer has inventory:read; inventory page should load
      await page.click('[data-tab="inventory"]');
      await page.waitForTimeout(200);
      // Viewer has inventory:read but not inventory:create; "New Item" button exists but submit should fail
      const addBtn = page.locator('button[data-inv-add]');
      if ((await addBtn.count()) === 0) throw new Error('Viewer should see New Item button (UI shows it; permission checked on submit)');
      await addBtn.click();
      await page.waitForTimeout(300);
      // Try to submit with minimal data - should fail due to missing required fields or permission
      await page.fill('input#name', 'Viewer Test Item');
      await page.fill('input#code', 'VIEW-001');
      await page.fill('input#grossWeight', '1.0');
      await page.fill('input#sellingPrice', '1000');
      await page.click('#itemForm button[type="submit"]');
      await page.waitForTimeout(500);
      // Item should NOT appear in the list
      const count = await page.locator('.inv-card').filter({ hasText: 'Viewer Test Item' }).count();
      if (count > 0) throw new Error('Viewer should not be able to create inventory items');
    },
  },
];
