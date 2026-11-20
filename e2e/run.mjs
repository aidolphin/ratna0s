import { chromium } from '@playwright/test';
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const E2E_DIR = path.join(ROOT, 'e2e');
const PORT = 5173;
const BASE = `http://localhost:${PORT}`;
const CHROMIUM_EXE =
  '/Users/sagarthapa/Library/Caches/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-mac-arm64/chrome-headless-shell';

let viteProc = null;

function waitForPort(ms = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tryOnce = async () => {
      try {
        const res = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(2000) });
        if (res.ok) return resolve();
      } catch { /* ignore */ }
      if (Date.now() - start > ms) return reject(new Error(`Dev server did not become ready on ${BASE} within ${ms}ms`));
      setTimeout(tryOnce, 300);
    };
    tryOnce();
  });
}

function startDevServer() {
  return new Promise((resolve, reject) => {
    viteProc = execFile('npm', ['run', 'dev'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    let ready = false;
    viteProc.stdout.on('data', (d) => {
      const s = d.toString();
      if (s.includes('ready in') && !ready) {
        ready = true;
        waitForPort(60000).then(resolve).catch(reject);
      }
    });
    viteProc.stderr.on('data', (d) => {
      const s = d.toString();
      if (s.includes('ready in') && !ready) {
        ready = true;
        waitForPort(60000).then(resolve).catch(reject);
      }
    });
    viteProc.on('error', reject);
    setTimeout(() => {
      if (!ready) {
        // Fallback: port may already be serving
        waitForPort(20000).then(resolve).catch(() => reject(new Error('Dev server failed to start')));
      }
    }, 2000);
  });
}

function stopDevServer() {
  if (viteProc) {
    try { viteProc.kill('SIGTERM'); } catch { /* ignore */ }
    viteProc = null;
  }
}

const results = [];
let passed = 0, failed = 0;

function pad(s, n) { return (s + ' '.repeat(n)).slice(0, n); }

async function runSpec(file) {
  const mod = await import(path.resolve(file));
  const tests = mod.tests || [];
  const name = path.basename(file);
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM_EXE });

  console.log(`\n== ${name} (${tests.length} tests) ==`);
  for (const t of tests) {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(30000);
    try {
      await t.fn(page);
      results.push({ file: name, test: t.name, status: 'PASS', error: '' });
      passed++;
      process.stdout.write(`  ✓ ${pad(t.name, 60)} PASS\n`);
    } catch (err) {
      results.push({ file: name, test: t.name, status: 'FAIL', error: err.message || String(err) });
      failed++;
      process.stdout.write(`  ✗ ${pad(t.name, 60)} FAIL · ${err.message || String(err)}\n`);
    } finally {
      try { await context.close(); } catch { /* ignore */ }
    }
  }
  await browser.close();
}

async function main() {
  const specFiles = fs.readdirSync(E2E_DIR)
    .filter(f => f.endsWith('.spec.mjs') || f.endsWith('.spec.js'))
    .sort()
    .map(f => path.join(E2E_DIR, f));

  if (specFiles.length === 0) {
    console.log('No spec files found in e2e/');
    process.exit(0);
  }

  let serverStarted = false;
  try {
    await startDevServer();
    serverStarted = true;
  } catch (e) {
    console.warn(`WARN: could not start dev server (${e.message}); assuming ${BASE} is already serving`);
  }

  try {
    await waitForPort(10000);
    console.log(`Dev server reachable at ${BASE}`);
  } catch (e) {
    console.error(`ERROR: ${BASE} is not reachable. Start 'npm run dev' first.`);
    stopDevServer();
    process.exit(1);
  }

  for (const f of specFiles) {
    try { await runSpec(f); } catch (e) {
      console.error(`  !! Spec ${path.basename(f)} errored: ${e.message}`);
    }
  }

  stopDevServer();

  console.log('\n========================================');
  console.log(`E2E SUMMARY: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('========================================\n');
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error('RUNNER FATAL:', e);
  stopDevServer();
  process.exit(1);
});
