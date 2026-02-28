export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('OK');

  try {
    // 1. ログに届いた内容を表示する
    console.log("--- Received Body ---", JSON.stringify(req.body));

    const events = req.body.events;
    if (!events || events.length === 0) {
      console.log("No events found in the request.");
      return res.status(200).send('OK');
    }

    const event = events[0];
    const userText = event.message.text;
    const replyToken = event.replyToken;

    // 2. Geminiを呼び出す
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    console.log("Attempting to call Gemini API...");

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `あなたは姓名判断士です。短く答えて：${userText}` }] }]
      })
    });

    const geminiData = await geminiRes.json();
    console.log("Gemini Response Data:", JSON.stringify(geminiData));

    if (!geminiData.candidates || geminiData.candidates.length === 0) {
       throw new Error("Gemini returned no candidates. Check your API Key.");
    }
    const aiText = geminiData.candidates[0].content.parts[0].text;

    // 3. LINEに返信する
    console.log("Sending reply to LINE...");
    const lineRes = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}` 
      },
      body: JSON.stringify({ replyToken: replyToken, messages: [{ type: 'text', text: aiText }] })
    });

    console.log("LINE Response Status:", lineRes.status);

    return res.status(200).send('OK');
  } catch (e) {
    // エラーの内容をログに出力する
    console.error("DEBUG ERROR:", e.message);
    return res.status(200).send('OK');
  }
}
