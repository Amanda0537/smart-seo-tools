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

    const systemPrompt = `You are a senior SEO content strategist. Suggest blog titles that rank well and attract high-CPC ads.

STRICT RULES:
- Return ONLY valid JSON
- Each title ≤ 60 characters (count carefully — over 60 is REJECTED)
- Primary keyword in the FIRST HALF of the title
- Titles in ${lang}
- Each title targets a different search angle

BANNED IN TITLES (never use):
"Ultimate Guide" / "Comprehensive Guide" / "Complete Guide" / "Everything You Need to Know" / "Unlock" / "Unleash" / "Master" / "Revolutionize" / "Game-Changer" / "Secret" / "Hack" / "Definitive" / "Essential Guide"

PAGE TYPE RULES for "${type}":
${type === "tierlist" ? "- Title MUST include year [2026] or version number\n- Format: '[Subject] Tier List: [Value Prop] [Year]'" : ""}${type === "comparison" ? "- Title should name BOTH items being compared\n- Format: '[A] vs [B]: [Differentiator] [Year]'" : ""}${type === "tutorial" ? "- Start with action verb or 'How to'\n- Format: 'How to [Task]: [Specific Method/Count] [Year]'" : ""}${type === "tool" ? "- Include the tool name\n- Format: '[Tool Name]: [What It Does] — Free Online'" : ""}${type === "database" ? "- Include the entry name + key data hint\n- Format: '[Entry Name] Stats & Guide [Year]'" : ""}

GOOD EXAMPLES:
- "War Thunder Tank Tier List: Best MBTs for Top Tier [2026]"
- "Chase Sapphire vs Amex Gold: Which Travel Card Wins 2026"
- "How to Fix Slow LCP: 7 Proven Speed Optimizations"

Return JSON:
{"titles":[{"title":"≤60 chars","rationale":"why this targets valuable traffic","estimated_intent":"informational|commercial|transactional","suggested_keywords":["kw1","kw2","kw3"]}]}

Generate exactly 5 titles.`;

    const userMsg = `Topic: "${topic}"${keyword ? `\nKeyword: "${keyword}"` : ""}\nPage type: ${type}\nLanguage: ${lang}`;

    const r = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "moonshot-v1-32k", temperature: 0.7, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMsg }] }),
    });
    if (!r.ok) { const t = await r.text(); return res.status(r.status).json({ error: `Kimi ${r.status}`, detail: t }); }
    const d = await r.json();
    const parsed = JSON.parse((d.choices?.[0]?.message?.content || "").replace(/```json|```/g, "").trim());
    return res.status(200).json(parsed);
  } catch (e) {
    console.error("Titles error:", e);
    return res.status(500).json({ error: "Title generation failed", detail: e.message });
  }
}
