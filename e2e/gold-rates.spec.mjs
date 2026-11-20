import { loginAs, USERS } from './helpers/auth.js';

export const tests = [
  {
    name: 'update gold rate via POS rates form',
    async fn(page) {
      await loginAs(page, USERS.admin);
      await page.click('[data-tab="pos"]');
      await page.waitForSelector('#posRates', { state: 'visible' });
      const goldInput = page.locator('input#gold');
      const before = await goldInput.inputValue();
      const newRate = String(Number(before || 15000) + 1000);

      await goldInput.fill('');
      await goldInput.type(newRate);
      await page.click('#posRates button[type="submit"]');
      await page.waitForTimeout(500);

      const after = await goldInput.inputValue();
      if (after !== newRate) throw new Error(`Gold rate not updated: expected ${newRate}, got ${after}`);
    },
  },
  {
    name: 'gold rate must be positive (validation rejects zero/negative)',
    async fn(page) {
      await loginAs(page, USERS.admin);
      await page.click('[data-tab="pos"]');
      await page.waitForSelector('#posRates', { state: 'visible' });
      const goldInput = page.locator('input#gold');
      await goldInput.fill('');
      await goldInput.type('0');
      await page.click('#posRates button[type="submit"]');
      await page.waitForTimeout(500);

      const val = await goldInput.inputValue();
      if (val !== '0') throw new Error(`Expected gold rate input to remain 0 after rejected update, got ${val}`);
    },
  },
];
