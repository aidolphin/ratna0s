import { loginAs, createItem, USERS } from './helpers/auth.js';

export const tests = [
  {
    name: 'add item to POS cart',
    async fn(page) {
      await loginAs(page, USERS.admin);
      await createItem(page, { name: 'POS Cart Item', code: 'POS-001', grossWeight: '2.5', sellingPrice: '50000' });
      await page.click('[data-tab="pos"]');
      await page.evaluate(async () => { await window.RatnaOS.render(); });
      await page.waitForFunction(() => document.getElementById('posRates') !== null, {}, { timeout: 15000 });

      const addBtn = page.locator('button[data-pos-add-item]').first();
      if ((await addBtn.count()) === 0) throw new Error('No add-to-cart button found');
      await addBtn.click();
      await page.waitForTimeout(1000);

      const cartItem = page.locator('.table tbody tr').filter({ hasText: 'POS Cart Item' });
      if ((await cartItem.count()) === 0) throw new Error('Item not added to cart');
    },
  },
  {
    name: 'complete a POS sale with payment',
    async fn(page) {
      await loginAs(page, USERS.admin);
      await createItem(page, { name: 'Sale Item', code: 'SAL-001', grossWeight: '2.0', sellingPrice: '55000' });
      await page.click('[data-tab="pos"]');
      await page.evaluate(async () => { await window.RatnaOS.render(); });
      await page.waitForFunction(() => document.getElementById('posRates') !== null, {}, { timeout: 15000 });

      await page.locator('button[data-pos-add-item]').first().click();
      await page.waitForTimeout(1000);
      const cartItem = page.locator('.table tbody tr').filter({ hasText: 'Sale Item' });
      if ((await cartItem.count()) === 0) throw new Error('Item not added to cart');

      page.once('dialog', (d) => d.accept());
      await page.click('button[data-pos-checkout]');
      await page.evaluate(() => { window.RatnaOS.render(); });
      await page.waitForTimeout(500);
      await page.evaluate(() => { window.RatnaOS.render(); });

      const text = await page.locator('main').textContent();
      if (!/INV-/.test(text || '')) throw new Error('Completed sale not found after checkout');
    },
  },
  {
    name: 'completing sale with empty cart shows alert',
    async fn(page) {
      await loginAs(page, USERS.admin);
      await page.click('[data-tab="pos"]');
      await page.evaluate(async () => { await window.RatnaOS.render(); });
      await page.waitForFunction(() => document.getElementById('posRates') !== null, {}, { timeout: 15000 });
      page.once('dialog', async (d) => {
        const msg = d.message();
        if (!/cart is empty/i.test(msg)) throw new Error('Expected "Cart is empty" alert, got: ' + msg);
        await d.accept();
      });
      await page.click('button[data-pos-checkout]');
      await page.waitForTimeout(500);
    },
  },
];
