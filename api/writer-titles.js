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
    const { topic, keyword, language, pageType } = req.body;
    if (!topic) return res.status(400).json({ error: "Missing topic" });
    const lang = language || "English";
    const type = pageType || "tutorial";

    const system = `You are a senior SEO content strategist. Suggest blog titles that rank on Google and attract high-CPC ads. Return ONLY valid JSON.

STRICT RULES:
- Each title ≤ 60 characters (count carefully)
- Primary keyword in the FIRST HALF of the title
- Titles in ${lang}
- Each title targets a different search angle

BANNED IN TITLES:
"Ultimate Guide" / "Comprehensive Guide" / "Complete Guide" / "Everything You Need to Know" / "Unlock" / "Unleash" / "Master" / "Revolutionize" / "Game-Changer" / "Secret" / "Hack" / "Definitive" / "Essential Guide"

PAGE TYPE RULES for "${type}":
${type === "tierlist" ? '- MUST include year [2026] or version number\n- Format: "[Subject] Tier List: [Value] [Year]"' : ""}${type === "comparison" ? '- Name BOTH items being compared\n- Format: "[A] vs [B]: [Differentiator] [Year]"' : ""}${type === "tutorial" ? '- Start with action verb or "How to"\n- Format: "How to [Task]: [Method/Count] [Year]"' : ""}${type === "tool" ? '- Include tool name\n- Format: "[Tool]: [Function] — Free Online"' : ""}${type === "database" ? '- Include entry name + data hint\n- Format: "[Entry] Stats & Guide [Year]"' : ""}

GOOD: "War Thunder Tank Tier List: Best MBTs [2026]" / "Chase Sapphire vs Amex Gold: Which Wins 2026" / "How to Fix Slow LCP: 7 Speed Optimizations"
BAD: "The Ultimate Guide to Travel Credit Cards" / "Unlock Your Travel Potential"

Return: {"titles":[{"title":"≤60 chars","rationale":"why valuable","estimated_intent":"informational|commercial|transactional","suggested_keywords":["kw1","kw2","kw3"]}]}
Generate exactly 5.`;

    const message = `Topic: "${topic}"${keyword ? `\nKeyword: "${keyword}"` : ""}\nPage type: ${type}\nLanguage: ${lang}`;
    const raw = await callClaude(apiKey, system, message, 0.7, 2048);
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return res.status(200).json(parsed);
  } catch (e) {
    console.error("Titles error:", e);
    return res.status(500).json({ error: "Title generation failed", detail: e.message });
  }
}
