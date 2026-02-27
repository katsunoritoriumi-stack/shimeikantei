export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('OK');

  const LINE_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  try {
    const event = req.body.events[0];
    if (!event || !event.message) return res.status(200).send('OK');

    // LINEにそのままオウム返しするテスト
    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        replyToken: event.replyToken,
        messages: [{ type: 'text', text: '接続テスト成功です！鑑定を開始します。' }]
      })
    });

    return res.status(200).send('OK');
  } catch (e) {
    return res.status(200).send('OK'); // LINE側でエラーを出さないための処置
  }
}
