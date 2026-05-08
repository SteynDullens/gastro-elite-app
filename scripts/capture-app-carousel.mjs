/**
 * Serie carrousel-afbeeldingen van de echte app — vaste afmeting (1080×1350, 4:5).
 *
 *   1. npm run dev
 *   2. npm run social-carousel
 *
 * Zonder login: 5 slides (onboarding / ontdekking).
 * Met SCREENSHOT_EMAIL + SCREENSHOT_PASSWORD: tot 10 slides (+ dashboard, recepten, toevoegen, account, bedrijf).
 *
 * Output: public/social/carousel/
 */

import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "social", "carousel");
const BASE = (process.env.SCREENSHOT_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");

/** Instagram 4:5 — veel gebruikt voor carrousel in de feed */
const W = 1080;
const H = 1350;
const DPR = 2;

mkdirSync(OUT, { recursive: true });

async function okServer() {
  try {
    const r = await fetch(BASE, { method: "GET", signal: AbortSignal.timeout(8000) });
    return r.ok || r.status === 304;
  } catch {
    return false;
  }
}

async function gotoReady(page, path, timeout = 45000) {
  await page.goto(`${BASE}${path}`, {
    waitUntil: "domcontentloaded",
    timeout,
  });
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
}

async function snap(page, filename) {
  await page.screenshot({
    path: join(OUT, filename),
    fullPage: false,
    animations: "disabled",
  });
  console.log("  ✓", filename);
}

async function captureGuestSeries(page) {
  await gotoReady(page, "/login");
  await page.getByRole("heading", { level: 2 }).waitFor({ state: "visible", timeout: 30000 });
  await page.waitForTimeout(700);
  await snap(page, "01-welkom-inloggen.png");

  await page.getByRole("button", { name: /Inloggen|Login|Anmelden/i }).first().click();
  await page.waitForSelector("#email", { state: "visible", timeout: 15000 });
  await page.waitForTimeout(500);
  await snap(page, "02-inlogformulier.png");

  await gotoReady(page, "/register");
  await page.waitForSelector("form", { timeout: 25000 });
  await page.waitForTimeout(600);
  await snap(page, "03-registreren.png");

  await gotoReady(page, "/recipes");
  await page.waitForTimeout(600);
  await snap(page, "04-recepten-overzicht.png");

  await gotoReady(page, "/add");
  await page.waitForTimeout(600);
  await snap(page, "05-recept-toevoegen.png");
}

async function captureLoggedInSeries(browser) {
  const email = process.env.SCREENSHOT_EMAIL?.trim();
  const password = process.env.SCREENSHOT_PASSWORD;
  if (!email || !password) return;

  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: DPR,
  });
  const page = await context.newPage();

  await gotoReady(page, "/login");
  await page.getByRole("heading", { level: 2 }).waitFor({ state: "visible", timeout: 30000 });
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
  await snap(page, "06-dashboard.png");

  await gotoReady(page, "/recipes");
  await page.waitForTimeout(1500);
  await snap(page, "07-recepten-ingelogd.png");

  await gotoReady(page, "/add");
  await page.waitForTimeout(1200);
  await snap(page, "08-nieuw-recept-formulier.png");

  await gotoReady(page, "/account");
  await page.waitForTimeout(1000);
  await snap(page, "09-account-gegevens.png");

  await gotoReady(page, "/company");
  await page.waitForTimeout(1200);
  await snap(page, "10-bedrijf-team.png");

  await context.close();
}

async function main() {
  if (!(await okServer())) {
    console.error(`\nKan ${BASE} niet bereiken. Start eerst: npm run dev\n`);
    process.exit(1);
  }

  console.log(`Carrousel → ${OUT}`);
  console.log(`Formaat   → ${W}×${H} (4:5) · @${DPR}x`);
  console.log(`Base URL  → ${BASE}\n`);

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: W, height: H },
      deviceScaleFactor: DPR,
    });
    const page = await context.newPage();
    await captureGuestSeries(page);
    await context.close();

    await captureLoggedInSeries(browser);

    const hasAuth = Boolean(
      process.env.SCREENSHOT_EMAIL?.trim() && process.env.SCREENSHOT_PASSWORD,
    );
    console.log(
      hasAuth
        ? "\nKlaar: 10 slides (01–10).\n"
        : "\nKlaar: 5 slides (01–05). Zet SCREENSHOT_EMAIL + SCREENSHOT_PASSWORD voor 06–10.\n",
    );
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
