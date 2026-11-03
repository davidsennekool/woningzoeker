import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { SOURCES } from './sources.js';
import { MIN_PRICE, MAX_PRICE, FAILURE_ALERT_THRESHOLD, SEEN_RETENTION_DAYS } from './config.js';
import { extractListings } from './extract.js';
import { sendTelegram, formatListing, esc } from './telegram.js';

const STATE_FILE = new URL('../state/seen.json', import.meta.url);
const DRY_RUN = !!process.env.DRY_RUN;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function loadState() {
  try {
    const s = JSON.parse(await readFile(STATE_FILE, 'utf8'));
    return { seen: s.seen || {}, failures: s.failures || {} };
  } catch {
    return { seen: {}, failures: {} };
  }
}

async function notify(html) {
  if (DRY_RUN) return console.log('\n[DRY_RUN] zou sturen:\n' + html + '\n');
  await sendTelegram(html);
  await sleep(1100); // Telegram rate limit
}

async function scrape(context, source) {
  const page = await context.newPage();
  try {
    await page.goto(source.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    // Geef client-side gerenderde sites even de tijd
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const listings = await page.evaluate(extractListings, source.hrefPattern);
    if (listings.length === 0) {
      const title = await page.title();
      throw new Error(`0 advertenties gevonden (paginatitel: "${title}") — mogelijk geblokkeerd of layout gewijzigd`);
    }
    return listings;
  } finally {
    await page.close();
  }
}

function inRange(source, l) {
  if (l.price == null) return source.priceInUrl;
  return l.price >= MIN_PRICE && l.price <= MAX_PRICE;
}

async function main() {
  const state = await loadState();
  const firstRun = Object.keys(state.seen).length === 0;
  const now = new Date().toISOString();

  const browser = await chromium.launch();
  const context = await browser.newContext({
    locale: 'nl-NL',
    timezoneId: 'Europe/Amsterdam',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 900 },
  });

  let newCount = 0;
  for (const source of SOURCES) {
    try {
      const listings = await scrape(context, source);
      const matching = listings.filter((l) => inRange(source, l));
      const fresh = matching.filter((l) => !state.seen[l.url]);
      console.log(`${source.name}: ${listings.length} gevonden, ${matching.length} binnen budget, ${fresh.length} nieuw`);

      for (const l of fresh) {
        if (!firstRun) await notify(formatListing(source.name, l));
        state.seen[l.url] = { source: source.name, firstSeen: now, price: l.price, title: l.title };
        newCount++;
      }
      if (state.failures[source.name] >= FAILURE_ALERT_THRESHOLD) {
        await notify(`✅ <b>${esc(source.name)}</b> werkt weer.`);
      }
      state.failures[source.name] = 0;
    } catch (err) {
      const n = (state.failures[source.name] || 0) + 1;
      state.failures[source.name] = n;
      console.error(`${source.name}: FOUT (${n}x op rij): ${err.message}`);
      if (n === FAILURE_ALERT_THRESHOLD) {
        await notify(`⚠️ <b>${esc(source.name)}</b> faalt al ${n} keer op rij:\n${esc(err.message)}`).catch(() => {});
      }
    }
  }
  await browser.close();

  if (firstRun && newCount > 0) {
    await notify(
      `✅ Woning-zoeker staat aan. ${newCount} bestaande advertenties opgeslagen; ` +
        `je krijgt vanaf nu alleen meldingen voor <b>nieuwe</b> appartementen in Apeldoorn (€${MIN_PRICE}–€${MAX_PRICE}).`,
    );
  }

  // Oude items opruimen
  const cutoff = Date.now() - SEEN_RETENTION_DAYS * 864e5;
  for (const [url, v] of Object.entries(state.seen)) {
    if (Date.parse(v.firstSeen) < cutoff) delete state.seen[url];
  }

  if (!DRY_RUN) await writeFile(STATE_FILE, JSON.stringify(state, null, 2) + '\n');
  console.log(`Klaar. ${newCount} nieuw${firstRun ? ' (eerste run: geen meldingen per advertentie)' : ''}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
