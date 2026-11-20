import { loginAs, USERS } from './helpers/auth.js';

export const tests = [
  {
    name: 'record an old-gold exchange receipt',
    async fn(page) {
      await loginAs(page, USERS.admin);
      await page.click('[data-tab="exchange"]');
      await page.waitForSelector('#exchange', { state: 'visible' });
      const before = await page.locator('.table tbody tr').count();

      await page.fill('input#customer', 'Walk-in Customer');
      await page.fill('input#weight', '10.5');
      await page.selectOption('select#purity', '22');
      await page.fill('input#rate', '15000');
      await page.fill('input#deduction', '100');
      await page.click('#exchange button[type="submit"]');
      await page.waitForFunction(() => document.querySelector('.table tbody tr')?.textContent?.includes('Walk-in Customer'), {}, { timeout: 10000 });

      const row = page.locator('.table tbody tr').filter({ hasText: 'Walk-in Customer' });
      if ((await row.count()) === 0) throw new Error('Exchange receipt not found in table');
    },
  },
  {
    name: 'exchange receipt rejects invalid assessment values',
    async fn(page) {
      await loginAs(page, USERS.admin);
      await page.click('[data-tab="exchange"]');
      await page.waitForSelector('#exchange', { state: 'visible' });
      await page.fill('input#customer', 'Invalid Customer');
      await page.fill('input#weight', '0');
      await page.fill('input#rate', '15000');
      await page.click('#exchange button[type="submit"]');
      await page.waitForTimeout(500);
      const row = page.locator('.table tbody tr').filter({ hasText: 'Invalid Customer' });
      if ((await row.count()) > 0) throw new Error('Invalid exchange receipt was recorded');
    },
  },
];
