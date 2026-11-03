// Gebruik: TELEGRAM_BOT_TOKEN=xxx npm run chat-id   (stuur eerst een bericht naar je bot)
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) { console.error('Zet eerst TELEGRAM_BOT_TOKEN'); process.exit(1); }
const res = await (await fetch(`https://api.telegram.org/bot${token}/getUpdates`)).json();
const chats = new Map();
for (const u of res.result || []) {
  const c = (u.message || u.channel_post || {}).chat;
  if (c) chats.set(c.id, c.title || [c.first_name, c.last_name].filter(Boolean).join(' ') || c.username);
}
if (!chats.size) console.log('Geen berichten gevonden. Stuur je bot eerst een bericht (bijv. "hoi") en probeer opnieuw.');
for (const [id, name] of chats) console.log(`TELEGRAM_CHAT_ID=${id}   (${name})`);
