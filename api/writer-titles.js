export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  try {
    const { topic, keyword, language, pageType } = req.body;
    if (!topic) return res.status(400).json({ error: "Missing topic" });

    const lang = language || "English";
    const type = pageType || "tutorial";

    const pageTypeDescriptions = {
      tutorial: "Tutorial / How-to guide — step-by-step instructions to accomplish a task",
      comparison: "Comparison / VS page — comparing two or more products, tools, or approaches",
      tierlist: "Tier List / Ranking — rating and categorizing items by quality or performance",
      tool: "Tool / Calculator page — describing an online tool or utility",
      database: "Database / Encyclopedia — reference entry with data, specs, and practical advice"
    };

    const typeDesc = pageTypeDescriptions[type] || pageTypeDescriptions.tutorial;

    const systemPrompt = `You are a senior SEO content strategist. Your job is to suggest blog post titles that will rank well on Google and attract high-CPC advertising.

RULES:
- Return ONLY valid JSON, no other text
- Each title must be ≤ 60 characters
- Primary keyword must appear in the first half of the title
- Titles must match the page type: ${typeDesc}
- Consider high-CPC keywords and commercial intent where relevant
- Titles should be in ${lang}
- No clickbait, no "Ultimate Guide", no "Everything You Need to Know"
- Each title should target a slightly different search intent or angle

Return this exact JSON format:
{
  "titles": [
    {
      "title": "the title text",
      "rationale": "1 sentence: why this title targets valuable search traffic",
      "estimated_intent": "informational|commercial|transactional",
      "suggested_keywords": ["primary keyword", "secondary keyword 1", "secondary keyword 2"]
    }
  ]
}

Generate exactly 5 titles.`;

    const userMsg = `Topic: "${topic}"${keyword ? `\nTarget keyword: "${keyword}"` : ""}
Page type: ${type}
Language: ${lang}

Generate 5 SEO-optimized title suggestions with high-CPC keyword potential.`;

    const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "moonshot-v1-32k",
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Kimi API error:", response.status, errText);
      return res.status(response.status).json({ error: "API request failed" });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return res.status(200).json(parsed);
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
