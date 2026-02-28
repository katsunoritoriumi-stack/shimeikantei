export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('OK');
  try {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const lineToken = (process.env.LINE_CHANNEL_ACCESS_TOKEN || "").trim();
    const userText = req.body.events[0].message.text;

    // 🔮 1. 数秘術の計算ロジック（簡易版：文字数などから1-9を算出）
    let sum = 0;
    for (let i = 0; i < userText.length; i++) {
      sum += userText.charCodeAt(i);
    }
    const numerologyNumber = (sum % 9) + 1; // 1〜9の数字を出す

    // 📜 2. 数字ごとの性質データを定義
    const traits = {
      1: "リーダーシップ、独立心、新しい始まり",
      2: "調和、協力、感受性、優しさ",
      3: "創造性、社交的、楽観主義、自己表現",
      4: "誠実、安定、努力、基盤づくり",
      5: "自由、冒険心、変化、多才",
      6: "責任感、愛情、奉仕、調和",
      7: "分析、神秘、知恵、内省",
      8: "豊かさ、権威、実行力、成功",
      9: "理想、共感、博愛、完結"
    };

    const myTrait = traits[numerologyNumber];

    // 🤖 3. AIへの指示（あなたのロジックをAIに伝える）
    const prompt = `あなたは数秘術に精通した姓名判断士です。
以下の情報を基に、相談者を励ますような鑑定文を150文字程度で作成してください。

・名前：${userText}
・算出された数秘：${numerologyNumber}番
・この数字の性質：${myTrait}

この性質を必ず文章に盛り込み、最後には『幸運のアドバイス』を添えてください。`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
    
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const geminiData = await geminiRes.json();
    const aiText = geminiData.candidates[0].content.parts[0].text;

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
    return res.status(200).send('OK');
  }
}
