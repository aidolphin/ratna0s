// RatnaOS E2E test helpers
// The app is a client-side SPA: auth + all business state live in localStorage.
// Every Playwright test gets a fresh browser context, so localStorage is isolated
// per test by default. We still expose resetState() for explicit cleanup.

export const USERS = {
  admin: { username: 'admin', password: 'admin123', role: 'admin' },
  manager: { username: 'manager', password: 'manager123', role: 'manager' },
  sales: { username: 'sales', password: 'sales123', role: 'sales' },
  production: { username: 'production', password: 'prod123', role: 'production' },
  accountant: { username: 'accountant', password: 'account123', role: 'accountant' },
  viewer: { username: 'viewer', password: 'viewer123', role: 'viewer' },
};

// All default users are created with mustChangePassword: true, so a password
// change step is required after first login before the app shell is reachable.
export const BASE = 'http://localhost:5173';

export async function loginAs(page, { username, password, newPassword = 'TestPass123!' } = {}) {
  await page.goto(BASE);
  await page.waitForSelector('#loginForm', { state: 'visible', timeout: 15000 });

  await page.fill('input#username', username);
  await page.fill('input#password', password);
  await page.click('button.login-submit');

  // Default users mustChangePassword: true -> change password modal appears.
  let changePassShown = false;
  try {
    await page.waitForSelector('#changePassForm', { state: 'visible', timeout: 5000 });
    changePassShown = true;
  } catch { /* no modal -> user may already have mustChangePassword=false */ }

  if (changePassShown) {
    await page.waitForTimeout(200);
    await page.fill('input[name="currentPassword"]', password);
    await page.fill('input[name="newPassword"]', newPassword);
    await page.fill('input[name="confirmPassword"]', newPassword);
    await page.click('#changePassForm button[type="submit"]');
    await page.waitForSelector('#changePassForm', { state: 'hidden', timeout: 10000 });
    // Ensure render() completes so the app shell is fully painted
    await page.evaluate(async () => { await window.RatnaOS.render(); });
  }

  // Wait for the authenticated app shell: sidebar navigation present.
  await page.waitForTimeout(300);
  await page.waitForSelector('aside#sidebar', { state: 'visible', timeout: 15000 });
  await page.waitForSelector('button[data-tab="inventory"]', { state: 'visible', timeout: 15000 });
  await page.waitForFunction(() => window.RatnaOS?.auth?.getCurrentUser?.() != null, {
    timeout: 15000,
  });
}

export async function logout(page) {
  const logoutBtn = page.locator('[data-auth-logout]');
  if (await logoutBtn.isVisible({ timeout: 3000 })) {
    await logoutBtn.click();
  }
  await page.waitForSelector('#loginForm', { state: 'visible', timeout: 15000 });
}

export async function resetState(page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await page.waitForSelector('#loginForm', { state: 'visible', timeout: 15000 });
}

export async function goToTab(page, tab) {
  await page.click(`aside#sidebar [data-tab="${tab}"], button[data-tab="${tab}"]`);
  await page.waitForTimeout(300);
}

export async function dismissNotify(page) {
  return null;
}

// Create a stock jewellery item via the inventory UI. Returns the item's data-id.
export async function createItem(page, { name = 'E2E Test Item', code = 'E2E-001', grossWeight = '4.0', sellingPrice = '90000' } = {}) {
  await page.click('[data-tab="inventory"]');
  await page.waitForSelector('#itemForm', { state: 'visible' });
  await page.fill('input#name', name);
  await page.fill('input#code', code);
  await page.fill('input#grossWeight', grossWeight);
  await page.fill('input#sellingPrice', sellingPrice);
  await page.click('#itemForm button[type="submit"]');
  await page.waitForFunction(() => document.querySelectorAll('.inv-card').length > 0, {}, { timeout: 10000 });
  const card = page.locator('.inv-card').filter({ hasText: name }).first();
  const id = await card.getAttribute('data-id');
  if (!id) throw new Error('Created item not found in inventory list');
  return id;
}
