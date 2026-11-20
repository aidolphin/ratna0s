import { loginAs, USERS } from './helpers/auth.js';

export const tests = [
  {
    name: 'karigar and jobs page loads',
    async fn(page) {
      await loginAs(page, USERS.admin);
      await page.click('[data-tab="karigar"]');
      await page.waitForTimeout(400);
      const heading = await page.locator('h1, h2').first().textContent();
      if (!heading || !/karigar/i.test(heading)) throw new Error('Karigar page did not load; heading: ' + heading);
    },
  },
  {
    name: 'create karigar and view karigar detail',
    async fn(page) {
      await loginAs(page, USERS.admin);
      await page.click('[data-tab="karigar"]');
      await page.evaluate(() => { window.RatnaOS.render(); });
      await page.waitForFunction(() => document.querySelector('button[data-action="new"]') !== null, {}, { timeout: 15000 });

      const newKarigarBtn = page.locator('button[data-action="new"]').first();
      if ((await newKarigarBtn.count()) === 0) throw new Error('New Karigar button not found');
      await newKarigarBtn.click();
      await page.evaluate(() => { window.RatnaOS.render(); });
      await page.waitForTimeout(500);
      const form = page.locator('#karigarForm');
      if ((await form.count()) === 0) throw new Error('Karigar form did not open');
      await page.fill('input[name="name"]', 'E2E Karigar Workshop');
      await page.fill('input[name="phone"]', '9876543210');
      await page.fill('input[name="ratePerGram"]', '150');
      await page.click('#karigarForm button[type="submit"]');
      await page.evaluate(async () => { await window.RatnaOS.render(); });
      await page.waitForTimeout(500);

      const karigarRow = page.locator('tr').filter({ hasText: 'E2E Karigar Workshop' });
      if ((await karigarRow.count()) === 0) throw new Error('Karigar not created');

      const jobsBtn = karigarRow.locator('button[data-karigar-jobs]').first();
      if ((await jobsBtn.count()) === 0) throw new Error('Karigar Jobs button not found');
      await jobsBtn.click();
      await page.waitForTimeout(500);
      await page.evaluate(() => { window.RatnaOS.render(); });
      await page.waitForTimeout(500);

      const heading = await page.locator('h1, h2').first().textContent();
      if (!heading || !/karigar/i.test(heading)) throw new Error('Karigar jobs page did not load; heading: ' + heading);
    },
  },
];
