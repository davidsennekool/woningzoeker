const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function sendTelegram(html) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error('TELEGRAM_BOT_TOKEN en/of TELEGRAM_CHAT_ID ontbreekt');

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: html, parse_mode: 'HTML', disable_web_page_preview: false }),
  });
  const body = await res.json();
  if (!body.ok) throw new Error(`Telegram-fout: ${body.description}`);
}

export function formatListing(source, l) {
  const price = l.price ? `€ ${l.price.toLocaleString('nl-NL')} p.m.` : 'prijs onbekend';
  return [
    `🏠 <b>Nieuw appartement in Apeldoorn</b> (${esc(source)})`,
    `<b>${esc(l.title)}</b>`,
    `💶 ${price}`,
    `🔗 ${esc(l.url)}`,
  ].join('\n');
}

export { esc };
