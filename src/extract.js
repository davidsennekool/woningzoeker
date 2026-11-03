/**
 * Draait IN de browserpagina (via page.evaluate). Zoekt alle advertentielinks,
 * loopt omhoog naar de "kaart" van die advertentie en leest titel + prijs uit.
 * Geen site-specifieke CSS-selectors, zodat kleine layoutwijzigingen niets breken.
 */
export function extractListings(hrefPattern) {
  const re = new RegExp(hrefPattern, 'i');
  const clean = (h) => h.split('?')[0].split('#')[0].replace(/\/+$/, '');
  const anchors = [...document.querySelectorAll('a[href]')].filter((a) => re.test(clean(a.href)));
  const byUrl = new Map();

  for (const a of anchors) {
    const url = clean(a.href);
    const entry = byUrl.get(url) || { url, titles: [], card: null };
    const t = (a.innerText || a.getAttribute('title') || '').trim().split('\n')[0];
    const generic = /^(details?|bekijk.*|meer info.*|view.*|lees meer)$/i;
    if (t && !/€/.test(t) && !generic.test(t)) entry.titles.push(t.replace(/[\s,;:|-]+$/, ''));

    if (!entry.card) {
      // Omhoog lopen tot een element met een prijs, maar stoppen zodra het element
      // links naar méérdere advertenties bevat (dan zitten we in de lijst, niet in de kaart).
      let el = a;
      for (let depth = 0; el && depth < 10; depth++, el = el.parentElement) {
        const urls = new Set(
          [...el.querySelectorAll('a[href]')].map((x) => clean(x.href)).filter((h) => re.test(h)),
        );
        if (urls.size > 1) break;
        if (/€\s?\d/.test(el.innerText || '')) { entry.card = el; break; }
      }
    }
    byUrl.set(url, entry);
  }

  return [...byUrl.values()].map(({ url, titles, card }) => {
    const text = (card?.innerText || '').replace(/\s+/g, ' ').trim();
    const m = text.match(/€\s?([\d.]+)(?:,(\d{1,2}|-))?/);
    const price = m ? parseInt(m[1].replace(/\./g, ''), 10) : null;
    const slug = url.split('/').filter(Boolean).pop() || url;
    const fromSlug = decodeURIComponent(slug).replace(/-\d+(-\d+)?$/, '').replace(/[-+]/g, ' ');
    const title = titles.sort((a, b) => b.length - a.length)[0] || fromSlug;
    return { url, title, price, summary: text.slice(0, 200) };
  });
}
