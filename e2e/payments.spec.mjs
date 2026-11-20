import { loginAs, USERS } from './helpers/auth.js';

export const tests = [
  {
    name: 'record income via accounting',
    async fn(page) {
      await loginAs(page, USERS.admin);
      await page.click('[data-tab="accounting"]');
      await page.evaluate(() => { window.RatnaOS.render(); });
      await page.waitForTimeout(200);
      // Click Record Income button
      const btn = page.locator('button[data-action="newIncome"]');
      if ((await btn.count()) === 0) throw new Error('Record Income button not found');
      await btn.first().click();
      await page.evaluate(() => { window.RatnaOS.render(); });
      await page.waitForTimeout(300);
      const form = page.locator('#incomeForm');
      if ((await form.count()) === 0) throw new Error('Income form did not open');
      await page.selectOption('select[name="category"]', 'Sales');
      await page.fill('input[name="amount"]', '25000');
      await page.fill('input[name="reference"]', 'INV-2025-001');
      await page.fill('textarea[name="notes"]', 'Sales income');
      await page.click('#incomeForm button[type="submit"]');
      await page.evaluate(() => { window.RatnaOS.render(); });
      await page.waitForTimeout(1500);
      // Income should appear in recent income list
      const row = page.locator('.table tbody tr').filter({ hasText: 'INV-2025-001' });
      if ((await row.count()) === 0) throw new Error('Posted income not found in list');
    },
  },
  {
    name: 'record expense via accounting',
    async fn(page) {
      await loginAs(page, USERS.admin);
      await page.click('[data-tab="accounting"]');
      await page.evaluate(() => { window.RatnaOS.render(); });
      await page.waitForTimeout(200);
      // Click Record Expense button
      const btn = page.locator('button[data-action="newExpense"]');
      if ((await btn.count()) === 0) throw new Error('Record Expense button not found');
      await btn.first().click();
      await page.evaluate(() => { window.RatnaOS.render(); });
      await page.waitForTimeout(300);
      const form = page.locator('#expenseForm');
      if ((await form.count()) === 0) throw new Error('Expense form did not open');
      await page.selectOption('select[name="category"]', 'Office Supplies');
      await page.fill('input[name="amount"]', '4000');
      await page.fill('input[name="reference"]', 'BILL-2025-001');
      await page.fill('textarea[name="notes"]', 'Office expense');
      await page.click('#expenseForm button[type="submit"]');
      await page.evaluate(() => { window.RatnaOS.render(); });
      await page.waitForTimeout(1500);
      // Expense should appear in recent expenses list
      const row = page.locator('.table tbody tr').filter({ hasText: 'BILL-2025-001' });
      if ((await row.count()) === 0) throw new Error('Posted expense not found in list');
    },
  },
];
