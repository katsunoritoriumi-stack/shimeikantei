export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('OK');
  try {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const lineToken = (process.env.LINE_CHANNEL_ACCESS_TOKEN || "").trim();
    const event = req.body.events[0];

    // 最も標準的な v1 住所
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: `姓名判断士として短く答えて：${event.message.text}` }] }] })
    });

    const data = await response.json();
    if (data.error) {
      console.error("Gemini Error:", data.error.message);
      return res.status(200).send('OK');
    }

    const aiText = data.candidates[0].content.parts[0].text;

    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${lineToken}` },
      body: JSON.stringify({ replyToken: event.replyToken, messages: [{ type: 'text', text: aiText }] })
    });

    return res.status(200).send('OK');
  } catch (e) {
    return res.status(200).send('OK');
  }
}
