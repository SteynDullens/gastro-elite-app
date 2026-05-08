/**
 * Haalt een willekeurig recept van TheMealDB (open internet-API) en rendert
 * chique social-templates als PNG (feed vierkant, story verticaal, receptdetail/gegevens).
 *
 *   npm run social-chic
 *
 * Output: public/social/chic/
 */

import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "social", "chic");
const MEALDB_RANDOM = "https://www.themealdb.com/api/json/v1/1/random.php";

mkdirSync(OUT, { recursive: true });

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function truncate(s, max) {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trim() + "…";
}

async function fetchRandomMeal() {
  const res = await fetch(MEALDB_RANDOM);
  if (!res.ok) throw new Error(`TheMealDB ${res.status}`);
  const data = await res.json();
  const meal = data?.meals?.[0];
  if (!meal) throw new Error("Geen recept in API-response");
  const ingredients = [];
  for (let i = 1; i <= 15; i++) {
    const ing = meal[`strIngredient${i}`]?.trim();
    const meas = meal[`strMeasure${i}`]?.trim();
    if (ing) ingredients.push(meas ? `${meas} ${ing}`.replace(/\s+/g, " ").trim() : ing);
  }
  return {
    name: meal.strMeal || "Recept",
    image: meal.strMealThumb || "",
    category: meal.strCategory || "",
    area: meal.strArea || "",
    instructions: meal.strInstructions || "",
    ingredients,
  };
}

function buildHtml(meal) {
  const ingPreview = meal.ingredients.slice(0, 5);
  const ingDetail = meal.ingredients.slice(0, 12);

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #111; font-family: 'DM Sans', system-ui, sans-serif; }
    #feed, #story, #detail { background: #fafaf9; color: #1c1917; }

    /* --- Feed 1080x1080 --- */
    #feed {
      width: 1080px;
      height: 1080px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .feed-top {
      background: linear-gradient(135deg, #ff6b35 0%, #e85d04 55%, #c2410c 100%);
      padding: 36px 48px 28px;
      color: #fff;
    }
    .feed-brand { font-size: 14px; letter-spacing: 0.45em; text-transform: uppercase; opacity: 0.95; font-weight: 600; }
    .feed-title-sm { font-family: 'Fraunces', Georgia, serif; font-size: 22px; margin-top: 8px; font-weight: 600; }
    .feed-hero-wrap {
      flex: 1;
      padding: 32px 48px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .feed-hero {
      width: 100%;
      max-height: 520px;
      object-fit: cover;
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.2);
    }
    .feed-dish {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 38px;
      line-height: 1.15;
      font-weight: 700;
      text-align: center;
      margin-top: 28px;
      padding: 0 24px;
      color: #0c0a09;
    }
    .feed-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
      margin-top: 22px;
      padding: 0 40px;
    }
    .feed-tag {
      background: #fff;
      border: 1px solid #e7e5e4;
      padding: 10px 18px;
      border-radius: 999px;
      font-size: 17px;
      color: #57534e;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .feed-footer {
      padding: 28px 48px 36px;
      text-align: center;
      font-size: 18px;
      color: #78716c;
      border-top: 1px solid #e7e5e4;
      background: linear-gradient(180deg, #fafaf9 0%, #f5f5f4 100%);
    }
    .feed-footer strong { color: #ff6b35; font-weight: 700; }

    /* --- Story 1080x1920 --- */
    #story {
      width: 1080px;
      height: 1920px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .story-visual {
      height: 920px;
      position: relative;
      flex-shrink: 0;
    }
    .story-visual img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .story-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%);
    }
    .story-headline {
      position: absolute;
      bottom: 48px;
      left: 48px;
      right: 48px;
      color: #fff;
    }
    .story-headline .sb { font-size: 13px; letter-spacing: 0.4em; text-transform: uppercase; opacity: 0.9; font-weight: 600; }
    .story-headline h1 {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 52px;
      line-height: 1.1;
      font-weight: 700;
      margin-top: 12px;
      text-shadow: 0 4px 24px rgba(0,0,0,0.35);
    }
    .story-body {
      flex: 1;
      padding: 56px 52px 48px;
      display: flex;
      flex-direction: column;
    }
    .story-section-title {
      font-size: 14px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #a8a29e;
      font-weight: 700;
      margin-bottom: 20px;
    }
    .story-ing {
      font-size: 26px;
      line-height: 1.55;
      color: #44403c;
      margin-bottom: 14px;
      padding-left: 8px;
      border-left: 4px solid #ff6b35;
    }
    .story-cta {
      margin-top: auto;
      background: linear-gradient(135deg, #ff6b35, #ea580c);
      color: #fff;
      text-align: center;
      padding: 36px 32px;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .story-meta {
      font-size: 20px;
      color: #78716c;
      margin-bottom: 32px;
    }

    /* --- Detail / gegevens (app-achtig) --- */
    #detail {
      width: 1200px;
      min-height: 1600px;
      background: #a0a0a0;
      padding: 48px 56px 64px;
    }
    .detail-shell {
      background: #fff;
      border-radius: 16px;
      border: 1px solid #e7e5e4;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15);
      overflow: hidden;
      max-width: 1088px;
      margin: 0 auto;
    }
    .detail-bar {
      height: 6px;
      background: linear-gradient(90deg, #ff6b35, #f97316);
    }
    .detail-inner { padding: 40px 44px 48px; }
    .detail-crumb {
      font-size: 13px;
      color: #78716c;
      letter-spacing: 0.06em;
      margin-bottom: 12px;
    }
    .detail-crumb span { color: #ff6b35; font-weight: 600; }
    .detail-h1 {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 42px;
      line-height: 1.15;
      font-weight: 700;
      color: #0c0a09;
      margin-bottom: 16px;
    }
    .detail-chips { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 28px; }
    .detail-chip {
      font-size: 14px;
      padding: 8px 14px;
      border-radius: 8px;
      background: #f5f5f4;
      color: #57534e;
      border: 1px solid #e7e5e4;
    }
    .detail-img {
      width: 100%;
      height: 420px;
      object-fit: cover;
      border-radius: 12px;
      margin-bottom: 36px;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1.15fr;
      gap: 36px;
    }
    @media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }
    .detail-card {
      background: #fafaf9;
      border: 1px solid #e7e5e4;
      border-radius: 12px;
      padding: 24px 22px;
    }
    .detail-card h3 {
      font-size: 12px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #78716c;
      margin-bottom: 16px;
      font-weight: 700;
    }
    .detail-ing-row {
      font-size: 17px;
      padding: 10px 0;
      border-bottom: 1px solid #e7e5e4;
      color: #44403c;
    }
    .detail-ing-row:last-child { border-bottom: none; }
    .detail-steps {
      font-size: 17px;
      line-height: 1.65;
      color: #44403c;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <!-- Feed -->
  <div id="feed">
    <div class="feed-top">
      <div class="feed-brand">Gastro-Elite</div>
      <div class="feed-title-sm">Inspiratie uit de keuken</div>
    </div>
    <div class="feed-hero-wrap">
      <img class="feed-hero" src="${escapeHtml(meal.image)}" alt="" crossorigin="anonymous" />
      <p class="feed-dish">${escapeHtml(meal.name)}</p>
      <div class="feed-tags">
        ${ingPreview.map((x) => `<span class="feed-tag">${escapeHtml(truncate(x, 42))}</span>`).join("")}
      </div>
    </div>
    <div class="feed-footer">
      Vandaag delen we een klassieker — <strong>receptenbeheer voor professionals</strong>
    </div>
  </div>

  <!-- Story -->
  <div id="story">
    <div class="story-visual">
      <img src="${escapeHtml(meal.image)}" alt="" crossorigin="anonymous" />
      <div class="story-overlay"></div>
      <div class="story-headline">
        <div class="sb">Gastro-Elite · recept van de dag</div>
        <h1>${escapeHtml(truncate(meal.name, 70))}</h1>
      </div>
    </div>
    <div class="story-body">
      <p class="story-meta">${escapeHtml([meal.category, meal.area].filter(Boolean).join(" · "))}</p>
      <div class="story-section-title">Ingredienten</div>
      ${meal.ingredients
        .slice(0, 6)
        .map((x) => `<div class="story-ing">${escapeHtml(truncate(x, 52))}</div>`)
        .join("")}
    </div>
    <div class="story-cta">gastro-elite.com</div>
  </div>

  <!-- Detail pagina -->
  <div id="detail">
    <div class="detail-shell">
      <div class="detail-bar"></div>
      <div class="detail-inner">
        <p class="detail-crumb"><span>Recepten</span> · Gegevens &amp; bereiding</p>
        <h1 class="detail-h1">${escapeHtml(meal.name)}</h1>
        <div class="detail-chips">
          ${meal.category ? `<span class="detail-chip">${escapeHtml(meal.category)}</span>` : ""}
          ${meal.area ? `<span class="detail-chip">${escapeHtml(meal.area)}</span>` : ""}
          <span class="detail-chip">Bron: TheMealDB (demo)</span>
        </div>
        <img class="detail-img" src="${escapeHtml(meal.image)}" alt="" crossorigin="anonymous" />
        <div class="detail-grid">
          <div class="detail-card">
            <h3>Ingredienten</h3>
            ${ingDetail.map((x) => `<div class="detail-ing-row">${escapeHtml(x)}</div>`).join("")}
          </div>
          <div class="detail-card">
            <h3>Bereiding</h3>
            <div class="detail-steps">${escapeHtml(truncate(meal.instructions, 1100))}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  console.log("Recept ophalen bij TheMealDB…");
  const meal = await fetchRandomMeal();
  console.log(" →", meal.name);

  const html = buildHtml(meal);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(html, {
    waitUntil: "networkidle",
    timeout: 90000,
  });
  await page.evaluate(() => document.fonts.ready);

  await page.locator("#feed").screenshot({
    path: join(OUT, "chic-feed-1080.png"),
    animations: "disabled",
  });
  console.log("  ✓ chic-feed-1080.png");

  await page.locator("#story").screenshot({
    path: join(OUT, "chic-story-1080x1920.png"),
    animations: "disabled",
  });
  console.log("  ✓ chic-story-1080x1920.png");

  await page.locator("#detail").screenshot({
    path: join(OUT, "chic-recipe-detail-gegevens.png"),
    fullPage: true,
    animations: "disabled",
  });
  console.log("  ✓ chic-recipe-detail-gegevens.png");

  await browser.close();

  console.log(`\nKlaar → ${OUT}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
