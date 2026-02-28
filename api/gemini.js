export default async function handler(req, res) {
  // 1. 起動ログ（これがログに出なければ、ファイル名やデプロイに問題があります）
  console.log("--- [START] ハンドラー起動 ---");

  if (req.method !== 'POST') {
    console.log("POST以外のリクエストです:", req.method);
    return res.status(200).send('OK');
  }

  try {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const lineToken = (process.env.LINE_CHANNEL_ACCESS_TOKEN || "").trim();

    // 2. 鍵のチェック（Vercelの設定が正しいか確認）
    console.log("APIキー確認:", apiKey ? "OK" : "NG（Vercelの設定が空です）");
    console.log("LINEトークン確認:", lineToken ? "OK" : "NG（Vercelの設定が空です）");

    const events = req.body.events;
    if (!events || events.length === 0) {
      console.log("メッセージイベントが空です");
      return res.status(200).send('OK');
    }

    const userText = events[0].message.text;
    console.log("受信メッセージ:", userText);

    // 3. AIを呼び出す（ここが 200ms 以上かかるはずの場所です）
    console.log("Gemini呼び出し中...");
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
      console.error("Geminiエラー:", geminiData.error.message);
      return res.status(200).send('OK');
    }

    const aiText = geminiData.candidates[0].content.parts[0].text;
    console.log("AI回答案:", aiText);

    // 4. LINEに返信
    console.log("LINE送信中...");
    const lineRes = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${lineToken}` },
      body: JSON.stringify({
        replyToken: events[0].replyToken,
        messages: [{ type: 'text', text: aiText }]
      })
    });
    console.log("LINE送信結果:", lineRes.status);

    return res.status(200).send('OK');
  } catch (e) {
    console.error("重大エラー発生:", e.message);
    return res.status(200).send('OK');
  }
}
