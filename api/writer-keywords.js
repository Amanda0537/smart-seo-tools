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

    const system = `You are an SEO keyword strategist and search intent analyst. Return ONLY valid JSON.

PART 1 — SEARCH INTENT: Determine what type of page Google would rank #1 for this topic.
PART 2 — KEYWORD MAP: Build a comprehensive keyword strategy.

ENTITY TERMS are CRITICAL — these are specific industry nouns that trigger high-CPC ads:
- Finance: "Variable APR", "Annual Fee Waiver", "Purchase Protection", "Balance Transfer Fee", "Sign-up Bonus", "Foreign Transaction Fee", "Reward Redemption Rate", "Priority Pass", "Global Entry"
- Tech: "API Rate Limit", "OAuth 2.0", "CDN Edge Cache", "Core Web Vitals"
- Travel: "Priority Pass Lounge", "TSA PreCheck", "Airline Transfer Partners", "Award Booking"
Entity terms are NOT generic words like "savings" or "benefits" — they are specific, precise industry terminology.

Return:
{"search_intent":"informational|commercial|transactional|navigational","intent_analysis":"what users want","recommended_page_type":"tutorial|comparison|tierlist|tool|database","primary_keyword":"main term","secondary_keywords":["3-5 terms"],"lsi_keywords":["8-12 semantic terms"],"entity_terms":["8-15 SPECIFIC industry nouns"],"long_tail_queries":["4-8 People Also Ask questions"],"commercial_intent_words":["6-10 high-value terms"]}`;

    const message = `Topic: "${topic}"\nKeyword: "${keyword || "none"}"\nPage type: ${pageType || "tutorial"}\nLanguage: ${lang}\n\nentity_terms must be SPECIFIC (brand names, product features, financial terms, acronyms), NOT generic.`;
    const raw = await callClaude(apiKey, system, message, 0.4, 2048);
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return res.status(200).json(parsed);
  } catch (e) {
    console.error("Keywords error:", e);
    return res.status(500).json({ error: "Keyword analysis failed", detail: e.message });
  }
}
