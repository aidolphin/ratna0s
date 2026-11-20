import { loginAs, createItem, USERS } from './helpers/auth.js';

export const tests = [
  {
    name: 'create a jewellery inventory item',
    async fn(page) {
      await loginAs(page, USERS.admin);
      await page.click('[data-tab="inventory"]');
      await page.waitForSelector('#itemForm', { state: 'visible' });
      const before = await page.locator('.inv-card').count();

      await page.fill('input#name', 'Test Gold Ring 22K');
      await page.fill('input#code', 'TGR-001');
      await page.fill('input#grossWeight', '5.5');
      await page.fill('input#sellingPrice', '125000');
      await page.click('#itemForm button[type="submit"]');

      await page.waitForFunction((before) => document.querySelectorAll('.inv-card').length > before, before, { timeout: 10000 });
      const after = await page.locator('.inv-card').count();
      if (!(after > before)) throw new Error('Item count did not increase after create');
      const hasItem = await page.locator('.inv-card-name').filter({ hasText: 'Test Gold Ring 22K' }).count() > 0;
      if (!hasItem) throw new Error('Created item not found in inventory list');
    },
  },
  {
    name: 'edit an existing inventory item',
    async fn(page) {
      await loginAs(page, USERS.admin);
      await page.click('[data-tab="inventory"]');
      await page.waitForSelector('#itemForm', { state: 'visible' });
      await page.fill('input#name', 'Editable Ring');
      await page.fill('input#code', 'EDR-001');
      await page.fill('input#grossWeight', '3.0');
      await page.fill('input#sellingPrice', '60000');
      await page.click('#itemForm button[type="submit"]');
      await page.waitForFunction(() => document.querySelectorAll('.inv-card').length > 0, {}, { timeout: 10000 });

      const card = page.locator('.inv-card').filter({ hasText: 'Editable Ring' });
      const id = await card.getAttribute('data-id');
      if (!id) throw new Error('Could not read item data-id');

      await page.click(`button[data-inv-edit="${id}"]`);
      await page.waitForFunction((editId) => document.getElementById('itemForm')?.dataset.editId === editId, id, { timeout: 5000 });
      await page.fill('input#name', 'Editable Ring Updated');
      await page.fill('input#code', 'EDR-002');
      await page.click('#itemForm button[type="submit"]');
      await page.waitForTimeout(300);
      await page.waitForFunction(() => document.querySelector('.inv-card-name')?.textContent?.includes('Editable Ring Updated'), {}, { timeout: 10000 });

      const names = await page.locator('.inv-card-name').allTextContents();
      const updated = names.filter(n => n.includes('Editable Ring Updated')).length;
      const stillOld = names.filter(n => n === 'Editable Ring').length;
      if (!(updated > 0)) throw new Error('Edited item name not reflected in list');
      if (stillOld > 0) throw new Error('Old item name still present after edit');
    },
  },
  {
    name: 'duplicate item code is rejected',
    async fn(page) {
      await loginAs(page, USERS.admin);
      await page.click('[data-tab="inventory"]');
      await page.waitForSelector('#itemForm', { state: 'visible' });
      await page.fill('input#name', 'Dup Ring');
      await page.fill('input#code', 'DUP-001');
      await page.fill('input#grossWeight', '2.0');
      await page.click('#itemForm button[type="submit"]');
      await page.waitForFunction(() => document.querySelectorAll('.inv-card').length > 0, {}, { timeout: 10000 });

      await page.fill('input#name', 'Dup Ring 2');
      await page.fill('input#code', 'DUP-001');
      await page.fill('input#grossWeight', '2.0');
      await page.click('#itemForm button[type="submit"]');
      await page.waitForTimeout(500);

      const codes = await page.locator('.inv-card .mono').allTextContents();
      const dupCount = codes.filter((c) => c === 'DUP-001').length;
      if (dupCount !== 1) throw new Error('Duplicate code was accepted; expected exactly 1, got ' + dupCount);
    },
  },
  {
    name: 'delete an inventory item',
    async fn(page) {
      await loginAs(page, USERS.admin);
      await page.click('[data-tab="inventory"]');
      await page.waitForSelector('#itemForm', { state: 'visible' });
      await page.fill('input#name', 'Delete Me Ring');
      await page.fill('input#code', 'DEL-001');
      await page.fill('input#grossWeight', '1.0');
      await page.click('#itemForm button[type="submit"]');
      await page.waitForFunction(() => document.querySelectorAll('.inv-card').length > 0, {}, { timeout: 10000 });

      const card = page.locator('.inv-card').filter({ hasText: 'Delete Me Ring' });
      const id = await card.getAttribute('data-id');
      if (!id) throw new Error('Could not read item data-id');

      page.once('dialog', (d) => d.accept());
      await page.click(`button[data-inv-delete="${id}"]`);
      await page.waitForTimeout(500);

      const remaining = await page.locator('.inv-card').filter({ hasText: 'Delete Me Ring' }).count();
      if (remaining !== 0) throw new Error('Deleted item still present in list');
    },
  },
  {
    name: 'submitting item with empty name shows validation error',
    async fn(page) {
      await loginAs(page, USERS.admin);
      await page.click('[data-tab="inventory"]');
      await page.waitForSelector('#itemForm', { state: 'visible' });
      await page.fill('input#name', '');
      await page.fill('input#code', 'NO-NAME');
      await page.fill('input#grossWeight', '1.0');
      await page.click('#itemForm button[type="submit"]');
      await page.waitForTimeout(500);

      const count = await page.locator('.inv-card').filter({ hasText: 'NO-NAME' }).count();
      if (count > 0) throw new Error('Item with empty name was created');
    },
  },
];
