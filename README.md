# Woning-zoeker Apeldoorn

Zoekt elke 15 minuten naar **nieuwe huurappartementen in Apeldoorn tussen €700 en €1500** en stuurt
direct een Telegram-bericht met de link.

**Bronnen:** Pararius, Huurwoningen.nl, Funda, Kamernet, 123Wonen (aan te vullen in `src/sources.js`).
Zoekcriteria staan in `src/config.js`.

Hoe het werkt: een headless Chromium (Playwright) opent per site de zoekpagina, haalt alle advertenties
op, filtert op prijs en vergelijkt met `state/seen.json`. Alles wat nog niet gezien is → Telegram.
De gezien-lijst wordt na elke run teruggecommit naar de repo.

---

## Installatie (±10 minuten)

### 1. Telegram-bot maken
1. Open Telegram en zoek **@BotFather** → stuur `/newbot` → kies een naam.
2. Je krijgt een **token** (iets als `123456:ABC-...`). Bewaar die.
3. Open je nieuwe bot en stuur hem een bericht (bijv. `hoi`).
4. Haal je chat-id op:
   ```bash
   npm install
   TELEGRAM_BOT_TOKEN=<token> npm run chat-id
   ```
   (Of open `https://api.telegram.org/bot<token>/getUpdates` in je browser en zoek `"chat":{"id":...}`.)
5. Test: `TELEGRAM_BOT_TOKEN=<token> TELEGRAM_CHAT_ID=<id> npm run test-telegram`

### 2. Op GitHub zetten
```bash
cd ~/dev/woning-zoeker
git init && git add . && git commit -m "Woning-zoeker"
gh repo create woning-zoeker --public --source=. --push
```
> **Publiek of privé?** Publieke repo's krijgen onbeperkt gratis Actions-minuten. Een privé repo heeft
> 2.000 min/maand gratis; elke 15 min draaien kost ~3.000–4.500 min/maand. Kies bij privé dus
> `*/30` of `0 * * * *` in de workflow. Je token staat nooit in de code, alleen in Secrets.

### 3. Secrets toevoegen
Repo → **Settings → Secrets and variables → Actions → New repository secret**:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Of via de CLI:
```bash
gh secret set TELEGRAM_BOT_TOKEN
gh secret set TELEGRAM_CHAT_ID
```

### 4. Starten
Ga naar **Actions → Woning-zoeker Apeldoorn → Run workflow**. De eerste run slaat alle bestaande
advertenties op en stuurt één bevestiging; daarna krijg je alleen meldingen voor nieuwe.

---

## Lokaal testen
```bash
npm install
npx playwright install chromium
npm run dry-run          # print wat er gestuurd zou worden, verstuurt niets
```

## Goed om te weten
- **Blokkades:** sites als Funda weren soms bots vanaf cloud-IP's. Faalt een bron 8 runs op rij (~2 uur),
  dan krijg je een ⚠️-melding; zodra hij weer werkt een ✅.
- **Google:** niet als bron opgenomen; Google blokkeert geautomatiseerde zoekopdrachten. De grote
  platforms hierboven dekken vrijwel het hele vrije-sectoraanbod.
- **Sociale huur** (Woonkeus Stedendriehoek) vereist inloggen en is niet opgenomen.
- GitHub zet geplande workflows uit na 60 dagen zonder repo-activiteit; de automatische commits van de
  gezien-lijst houden hem actief.
- Nieuwe bron toevoegen: één object in `src/sources.js` met de zoek-URL en een regex voor advertentielinks.
