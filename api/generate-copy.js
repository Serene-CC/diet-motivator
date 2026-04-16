export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { weightLoss, days, freqPerWeek, exerciseType } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ copy: '仅靠随便动动，不需要任何坚持' });
  }

  const prompt = `你是一位擅长广告文案和减脂传播的营销专家，非常了解"佛系减脂"、"轻松运动"的传播风格。

用户数据：
- 运动类型：${exerciseType || '日常运动'}
- 每周约 ${freqPerWeek} 次
- 预计 ${days} 天后：可减少约 ${weightLoss} kg

任务：写一句激励文案（20~40字）。
风格要求：
- 不用"坚持"、"自律"、"努力"、"打卡"这类词
- 语气轻松、温柔，带点小惊喜感
- 让人觉得"就这？这么容易？"
- 可以用具体数字增加说服力
- 不做道德评判，不施压

只返回一句文案，不要任何说明或解释文字。`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 100 }
        })
      }
    );

    if (!response.ok) throw new Error('Gemini API error');

    const data = await response.json();
    const copy = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '仅靠随便动动，不需要任何坚持';

    res.status(200).json({ copy });
  } catch {
    res.status(200).json({ copy: '仅靠随便动动，不需要任何坚持' });
  }
}
