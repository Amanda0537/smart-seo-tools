const CLAUDE_MODEL = "claude-sonnet-4-20250514";
async function callClaude(apiKey, system, message, temp = 0.5, maxTokens = 4096) {
  const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: message }], temperature: temp }) });
  if (!r.ok) { const t = await r.text(); throw new Error(`Claude ${r.status}: ${t.slice(0, 200)}`); }
  const d = await r.json();
  return (d.content || []).map(b => b.text || "").join("");
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

  try {
    const { topic, title, language, keywords, faqQuestions } = req.body;
    if (!topic) return res.status(400).json({ error: "Missing topic" });
    const lang = language || "English";
    const kw = keywords || {};

    const system = `You are an SEO FAQ writer. Return ONLY valid JSON. Write in ${lang}.

Generate 4-8 FAQ items from real "People Also Ask" patterns.

EACH ANSWER MUST:
- First sentence = DIRECT answer/conclusion (no hedging, no "it depends")
- 50-150 words total
- Include ≥ 1 specific data point, product name, or verifiable fact
- Sound human, not AI

GOOD ANSWERS:
✅ "Yes, the Chase Sapphire Preferred charges a $95 annual fee. The 60,000-point sign-up bonus (worth ~$750 via Chase Travel) offsets this in year one..."
✅ "The Capital One Venture X offers the best lounge access among mid-tier cards, with Priority Pass membership covering 1,300+ lounges worldwide..."

BANNED IN ANSWERS:
× "That's a great question" / "Great question" / "Good question"
× "The answer depends on many factors" (give a SPECIFIC answer)
× "It's worth noting" / "It's important to note" / "In today's world"
× "In conclusion" / "Furthermore" / "Moreover" / "Additionally" (as starters)
× "Without a doubt" / "Needless to say" / "Undoubtedly"
× "值得注意的是" / "总而言之" / "综上所述" / "毋庸置疑"

Return: {"faqs":[{"question":"q","answer":"direct answer, 50-150 words"}]}`;

    const message = `Topic: "${topic}" | Title: "${title}"
Primary: ${kw.primary_keyword || ""} | Entity terms: ${(kw.entity_terms || []).join(", ")}
Questions:\n${(faqQuestions || []).map((q, i) => `${i + 1}. ${q}`).join("\n")}
If < 4 questions, add more from search patterns. 4-8 total. Use entity terms in answers.`;

    const raw = await callClaude(apiKey, system, message, 0.5, 3000);
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return res.status(200).json(parsed);
  } catch (e) {
    console.error("FAQ error:", e);
    return res.status(500).json({ error: "FAQ generation failed", detail: e.message });
  }
}
