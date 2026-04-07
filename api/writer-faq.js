export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  try {
    const { topic, title, language, keywords, faqQuestions } = req.body;
    if (!topic) return res.status(400).json({ error: "Missing topic" });

    const lang = language || "English";
    const kw = keywords || {};

    const system = `You are an SEO FAQ writer. Return ONLY valid JSON. Write in ${lang}.

Generate 4-8 FAQ items. Questions should come from real "People Also Ask" patterns for this topic.

EACH ANSWER MUST:
- Start with a DIRECT conclusion/answer in the first sentence — no hedging, no "it depends"
- Be 50-150 words
- Include at least one specific data point, product name, or verifiable fact
- Sound like a knowledgeable human, not AI

ANSWER FORMAT EXAMPLES:
✅ GOOD: "Yes, the Chase Sapphire Preferred card charges a $95 annual fee. However, the 60,000-point sign-up bonus (worth ~$750 through Chase Travel) offsets this cost in the first year..."
✅ GOOD: "The best travel credit card for most people is the Chase Sapphire Preferred, based on its 2x points on travel and dining with a $95 annual fee..."
❌ BAD: "That's a great question! The answer depends on many factors..."
❌ BAD: "There are several options to consider when choosing..."
❌ BAD: "It's worth noting that different cards offer different benefits..."

BANNED IN FAQ ANSWERS (never use):
- "That's a great question" / "Great question" / "Good question"
- "The answer depends on many factors" (give a specific answer instead)
- "It's worth noting" / "It's important to note"
- "In today's world" / "In conclusion" / "All in all"
- "Furthermore" / "Moreover" / "Additionally" (as sentence starters)
- "Without a doubt" / "Needless to say" / "Undoubtedly"
- Any answer that doesn't give a clear conclusion in the first sentence
- Chinese: "值得注意的是" / "总而言之" / "综上所述" / "毋庸置疑"

Return format:
{"faqs":[{"question":"the question","answer":"direct answer starting with conclusion, 50-150 words"}]}`;

    const message = `Topic: "${topic}"\nTitle: "${title}"\nPrimary keyword: ${kw.primary_keyword || ""}\nEntity terms: ${(kw.entity_terms || []).join(", ")}\n\nQuestions to answer:\n${(faqQuestions || []).map((q, i) => `${i + 1}. ${q}`).join("\n")}\n\nIf fewer than 4 questions, add more from common search patterns. Generate 4-8 total. Use entity terms in answers where relevant.`;

    const r = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "moonshot-v1-32k", temperature: 0.5, messages: [{ role: "system", content: system }, { role: "user", content: message }] }),
    });
    if (!r.ok) { const t = await r.text(); return res.status(r.status).json({ error: `Kimi ${r.status}`, detail: t }); }
    const d = await r.json();
    const parsed = JSON.parse((d.choices?.[0]?.message?.content || "").replace(/```json|```/g, "").trim());
    return res.status(200).json(parsed);
  } catch (e) {
    console.error("FAQ error:", e);
    return res.status(500).json({ error: "FAQ generation failed", detail: e.message });
  }
}
