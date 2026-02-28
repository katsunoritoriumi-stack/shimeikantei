export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('OK');
  try {
    const events = req.body.events;
    if (!events || events.length === 0) return res.status(200).send('OK');
    const event = events[0];
    const userText = event.message.text;
    const replyToken = event.replyToken;
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const lineToken = (process.env.LINE_CHANNEL_ACCESS_TOKEN || "").trim();

    // The URL must be in English.
    const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `あなたは姓名判断士です。短く答えて：${userText}` }] }]
      })
    });
    const geminiData = await geminiRes.json();
    const aiText = geminiData.candidates[0].content.parts[0].text;

    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineToken}`
      },
      body: JSON.stringify({ replyToken: replyToken, messages: [{ type: 'text', text: aiText }] })
    });
    return res.status(200).send('OK');
  } catch (e) {
    return res.status(200).send('OK');
  }
}
