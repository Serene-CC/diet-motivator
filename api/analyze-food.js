export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { description, yummyLevel } = req.body;
  if (!description) {
    return res.status(400).json({ error: '请提供食物描述' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: '服务器未配置 API Key' });
  }

  const yummyHint = yummyLevel >= 4
    ? '用户反馈这顿非常好吃，通常意味着高油高糖，请在估算时适当偏高。'
    : yummyLevel <= 2
    ? '用户反馈这顿比较普通，估算时按正常偏低处理。'
    : '';

  const prompt = `你是一个中国食物热量估算专家。用户描述了今天吃的东西，请帮他估算每一项食物的热量（kcal）。

用户描述：${description}
${yummyHint}

规则：
1. 按中国日常饮食习惯和实际份量估算，不要按西方标准
2. 如果用户没说份量，按常见日常份量估算（比如一碗米饭约250kcal）
3. 对于外卖、餐厅食物，热量通常比家庭自制偏高
4. 只返回 JSON，格式如下，不要有任何多余文字，不要加代码块标记：

{
  "items": [
    { "name": "肉臊子面（一小碗）", "kcal": 480 },
    { "name": "一点点大杯冰淇淋红茶", "kcal": 320 }
  ]
}`;

  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 512
        })
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error('Groq API 错误: ' + err);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI 返回格式异常');

    const parsed = JSON.parse(jsonMatch[0]);
    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
