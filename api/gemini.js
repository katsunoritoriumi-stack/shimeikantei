export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('OK');

  try {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const lineToken = (process.env.LINE_CHANNEL_ACCESS_TOKEN || "").trim();

    const events = req.body.events;
    if (!events || events.length === 0) return res.status(200).send('OK');
    const userText = events[0].message.text;

    // 🌟 あなたのリストで確認できた「最新モデル」と「正しい住所(v1beta)」の組み合わせ
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
    
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `あなたは姓名判断士です。短く温かく答えて：${userText}` }] }]
      })
    });

    const geminiData = await geminiRes.json();

    if (geminiData.error) {
      console.error("Gemini Error:", geminiData.error.message);
      return res.status(200).send('OK');
    }

    const aiText = geminiData.candidates[0].content.parts[0].text;

    // LINEに返信
    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineToken}`
      },
      body: JSON.stringify({
        replyToken: events[0].replyToken,
        messages: [{ type: 'text', text: aiText }]
      })
    });

    return res.status(200).send('OK');
  } catch (e) {
    console.error("Critical Error:", e.message);
    return res.status(200).send('OK');
  }
}
