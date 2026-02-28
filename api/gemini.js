export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('OK');

  try {
    const events = req.body.events;
    if (!events || events.length === 0) return res.status(200).send('OK');

    const event = events[0];
    const userText = event.message.text;
    const replyToken = event.replyToken;

    // 環境変数の読み込みと不要な空白の削除
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const lineToken = (process.env.LINE_CHANNEL_ACCESS_TOKEN || "").trim();

    // 修正ポイント：モデル名を「gemini-1.5-flash-latest」に変更して安定性を向上
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    console.log("Calling Gemini API...");
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `あなたは姓名判断士です。以下の相談に短く温かく答えてください：${userText}` }] }]
      })
    });

    const geminiData = await geminiRes.json();

    // ログに Gemini の生の反応を表示して確認しやすくする
    console.log("Gemini Response Status:", geminiRes.status);

    if (geminiData.error) {
      console.error("Gemini API Error Detail:", geminiData.error.message);
      return res.status(200).send('OK');
    }

    const aiText = geminiData.candidates[0].content.parts[0].text;

    // LINE に返信する
    console.log("Sending reply to LINE...");
    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineToken}`
      },
      body: JSON.stringify({
        replyToken: replyToken,
        messages: [{ type: 'text', text: aiText }]
      })
    });

    return res.status(200).send('OK');
  } catch (e) {
    console.error("System Error:", e.message);
    return res.status(200).send('OK');
  }
}
