export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('OK');

  try {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const lineToken = (process.env.LINE_CHANNEL_ACCESS_TOKEN || "").trim();

    console.log("--- 診断開始 ---");
    const events = req.body.events;
    if (!events || events.length === 0) return res.status(200).send('OK');
    const userText = events[0].message.text;

    // 🌟 最重要：住所を「v1」という最も安定した形式に固定します
    // これにより 524 で出ていた「v1betaでは見つからない」エラーを回避します
    const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `あなたは姓名判断士です。短く答えて：${userText}` }] }]
      })
    });

    const geminiData = await geminiRes.json();
    console.log("Geminiステータス:", geminiRes.status);

    if (geminiData.error) {
      console.error("Geminiエラー詳細:", geminiData.error.message);
      return res.status(200).send('OK');
    }

    const aiText = geminiData.candidates[0].content.parts[0].text;

    // LINEに返信
    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${lineToken}` },
      body: JSON.stringify({
        replyToken: events[0].replyToken,
        messages: [{ type: 'text', text: aiText }]
      })
    });

    return res.status(200).send('OK');
  } catch (e) {
    console.error("重大エラー:", e.message);
    return res.status(200).send('OK');
  }
}
