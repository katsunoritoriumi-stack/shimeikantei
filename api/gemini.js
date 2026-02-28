export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('OK');

  try {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const lineToken = (process.env.LINE_CHANNEL_ACCESS_TOKEN || "").trim();
    const userText = req.body.events[0].message.text;

    // 🌟 404を回避するため、利用可能なモデルを順番に試します
    const models = [
      "gemini-1.5-flash",
      "gemini-1.5-flash-8b",
      "gemini-1.0-pro"
    ];

    let aiText = "";
    let success = false;

    for (const model of models) {
      console.log(`--- 試行中: ${model} ---`);
      const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `姓名判断士として短く答えて：${userText}` }] }] })
      });

      const data = await response.json();
      
      if (response.ok && data.candidates) {
        aiText = data.candidates[0].content.parts[0].text;
        success = true;
        console.log(`${model} で成功しました！`);
        break; // 成功したらループを抜ける
      } else {
        console.log(`${model} は失敗: ${data.error ? data.error.message : "404"}`);
      }
    }

    if (!success) {
      console.error("すべてのモデルが 404 で失敗しました。APIキーの設定を再確認してください。");
      return res.status(200).send('OK');
    }

    // LINEに返信
    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${lineToken}` },
      body: JSON.stringify({
        replyToken: req.body.events[0].replyToken,
        messages: [{ type: 'text', text: aiText }]
      })
    });

    return res.status(200).send('OK');
  } catch (e) {
    console.error("システムエラー:", e.message);
    return res.status(200).send('OK');
  }
}
