export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('OK');
  try {
    const event = req.body.events[0];
    if (!event) return res.status(200).send('OK');

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: `あなたは姓名判断士です。短く温かく答えて：${event.message.text}` }] }] })
    });
    const geminiData = await geminiRes.json();
    const aiText = geminiData.candidates[0].content.parts[0].text;

    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}` },
      body: JSON.stringify({ replyToken: event.replyToken, messages: [{ type: 'text', text: aiText }] })
    });
    return res.status(200).send('OK');
  } catch (e) { return res.status(200).send('OK'); }
}
