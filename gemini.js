export default async function handler(req, res) {
  // POSTメソッド以外は無視する
  if (req.method !== 'POST') {
    return res.status(200).send('OK');
  }

  try {
    const events = req.body.events;
    if (!events || events.length === 0) {
      return res.status(200).send('OK');
    }

    const event = events[0];
    const replyToken = event.replyToken;
    const userText = event.message.text;

    // 1. Geminiで鑑定文を作る
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `あなたは姓名判断士です。以下の相談に短く答えてください：${userText}` }] }]
      })
    });

    const geminiData = await geminiResponse.json();
    const aiResponse = geminiData.candidates[0].content.parts[0].text;

    // 2. LINEに返信する
    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        replyToken: replyToken,
        messages: [{ type: 'text', text: aiResponse }]
      })
    });

    return res.status(200).send('OK');
  } catch (error) {
    console.error(error);
    // エラーが起きてもLINE側には「200 OK」を返して「400エラー」を防ぐ
    return res.status(200).send('OK');
  }
}
