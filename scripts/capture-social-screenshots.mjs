/**
 * Maakt echte PNG-screenshots van de draaiende Next.js-app (Playwright).
 *
 * Gebruik:
 *   1. Start de app: npm run dev
 *   2. npm run social-screenshots
 *
 * Optioneel ingelogde shots (echte recepten-/dashboard-UI):
 *   PowerShell:
 *     $env:SCREENSHOT_EMAIL="jouw@voorbeeld.nl"; $env:SCREENSHOT_PASSWORD="***"; npm run social-screenshots
 *
 * Env:
 *   SCREENSHOT_BASE_URL — default http://127.0.0.1:3000
 *   SCREENSHOT_EMAIL / SCREENSHOT_PASSWORD — als gezet: login en extra PNG's
 */

import { chromium } from "playwright";
import { mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "social", "screenshots");
const BASE = (process.env.SCREENSHOT_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");

mkdirSync(OUT, { recursive: true });

async function okServer() {
  try {
    const r = await fetch(BASE, { method: "GET", signal: AbortSignal.timeout(8000) });
    return r.ok || r.status === 304;
  } catch {
    return false;
  }
}

async function screenshot(page, filename, fullPage = true) {
  const path = join(OUT, filename);
  await page.screenshot({ path, fullPage, animations: "disabled" });
  console.log("  ✓", filename);
}

async function gotoReady(page, path, timeout = 45000) {
  await page.goto(`${BASE}${path}`, {
    waitUntil: "domcontentloaded",
    timeout,
  });
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
}

async function captureGuestDesktop(page) {
  await gotoReady(page, "/login");
  await page.waitForSelector('img[alt="Gastro-Elite Logo"]', { timeout: 20000 });
  await page.waitForTimeout(800);
  await screenshot(page, "desktop-01-login-welcome.png");

  await page.getByRole("button", { name: /Inloggen|Login|Anmelden/i }).first().click();
  await page.waitForSelector("#email", { state: "visible", timeout: 15000 });
  await page.waitForTimeout(600);
  await screenshot(page, "desktop-02-login-form.png");

  await gotoReady(page, "/register");
  await page.waitForSelector('img[alt="Gastro-Elite Logo"], form', { timeout: 20000 });
  await page.waitForTimeout(600);
  await screenshot(page, "desktop-03-register.png");

  await gotoReady(page, "/recipes");
  await page.waitForTimeout(600);
  await screenshot(page, "desktop-04-recipes-not-logged-in.png");
}

async function captureGuestMobile(context) {
  const page = await context.newPage();
  await gotoReady(page, "/login");
  /* Mobiel: Next/Image kan meerdere logo-varianten hebben; eerste is soms verborgen. */
  await page.getByRole("heading", { level: 2 }).waitFor({ state: "visible", timeout: 30000 });
  await page.waitForTimeout(800);
  await screenshot(page, "mobile-01-login-welcome.png");

  await gotoReady(page, "/recipes");
  await page.waitForTimeout(600);
  await screenshot(page, "mobile-02-recipes-not-logged-in.png");
  await page.close();
}

async function captureLoggedIn(browser) {
  const email = process.env.SCREENSHOT_EMAIL?.trim();
  const password = process.env.SCREENSHOT_PASSWORD;
  if (!email || !password) {
    console.log("\n(SCREENSHOT_EMAIL / SCREENSHOT_PASSWORD niet gezet — overslaan ingelogde shots)\n");
    return;
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  await gotoReady(page, "/login");
  await page.waitForSelector('img[alt="Gastro-Elite Logo"]', { timeout: 20000 });
  await page.getByRole("button", { name: /Inloggen|Login|Anmelden/i }).first().click();
  await page.waitForSelector("#email", { state: "visible", timeout: 15000 });
  await page.fill("#email", email);
  await page.fill("#password", password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 45000 }),
    page.locator('form button[type="submit"]').click(),
  ]);

  await page.waitForLoadState("networkidle", { timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await screenshot(page, "desktop-05-home-logged-in.png");

  await gotoReady(page, "/recipes");
  await page.waitForTimeout(1500);
  await screenshot(page, "desktop-06-recipes-logged-in.png");

  await gotoReady(page, "/account");
  await page.waitForTimeout(800);
  await screenshot(page, "desktop-07-account.png");

  await gotoReady(page, "/company");
  await page.waitForTimeout(1200);
  await screenshot(page, "desktop-08-company.png");

  await context.close();
}

async function main() {
  if (!(await okServer())) {
    console.error(
      `\nKan ${BASE} niet bereiken. Start eerst: npm run dev\n`,
    );
    process.exit(1);
  }

  console.log(`Screenshots → ${OUT}`);
  console.log(`Base URL  → ${BASE}\n`);

  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const desktop = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    const page = await desktop.newPage();
    await captureGuestDesktop(page);
    await desktop.close();

    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    await captureGuestMobile(mobile);
    await mobile.close();

    await captureLoggedIn(browser);

    console.log("\nKlaar. Bestanden staan in public/social/screenshots/\n");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
