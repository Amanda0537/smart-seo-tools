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

    const system = `You are an SEO keyword strategist and search intent analyst. Return ONLY valid JSON.

Your job has TWO parts:

PART 1 — SEARCH INTENT ANALYSIS (审核指南第一关):
Determine the dominant search intent for this topic. What kind of page would Google show in the top 5? This determines whether the article structure is correct.

PART 2 — KEYWORD STRATEGY:
Build a comprehensive keyword map including:
1. Primary/secondary keywords with search volume potential
2. LSI keywords for topical depth (8-12 terms)
3. ENTITY NOUNS — specific industry terms that trigger high-CPC ads. These are NOT generic words. Examples:
   - Finance: "Variable APR", "Annual Fee Waiver", "Purchase Protection", "Balance Transfer Fee", "Issuer Transfer Partners", "Sign-up Bonus", "Foreign Transaction Fee", "Reward Redemption Rate"
   - Tech: "API Rate Limit", "OAuth 2.0", "CDN Edge Cache", "Server Response Time"
   - Travel: "Priority Pass Lounge", "Global Entry", "TSA PreCheck", "Airline Transfer Partners"
4. Long-tail queries from People Also Ask patterns
5. Commercial intent words that attract premium ads

Return format:
{
  "search_intent": "informational|commercial|transactional|navigational",
  "intent_analysis": "1-2 sentences explaining what users searching this topic want to accomplish",
  "recommended_page_type": "tutorial|comparison|tierlist|tool|database",
  "primary_keyword": "main term",
  "secondary_keywords": ["3-5 related terms"],
  "lsi_keywords": ["8-12 semantically related terms showing topical depth"],
  "entity_terms": ["8-15 SPECIFIC industry entity nouns — brand names, technical terms, product features, financial terms, NOT generic words"],
  "long_tail_queries": ["4-8 People Also Ask style questions"],
  "commercial_intent_words": ["6-10 high-value terms: best, compare, review, rates, pricing, how to apply, alternatives, vs, top rated, worth it"]
}`;

    const message = `Topic: "${topic}"\nTarget keyword: "${keyword || "none"}"\nPage type: ${pageType || "tutorial"}\nLanguage: ${lang}\n\nCRITICAL: entity_terms must be SPECIFIC technical/industry terms (brand names, product features, financial terms, acronyms), NOT generic words like "savings" or "benefits".`;

    const r = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "moonshot-v1-32k", temperature: 0.4, messages: [{ role: "system", content: system }, { role: "user", content: message }] }),
    });
    if (!r.ok) { const t = await r.text(); return res.status(r.status).json({ error: `Kimi ${r.status}`, detail: t }); }
    const d = await r.json();
    const parsed = JSON.parse((d.choices?.[0]?.message?.content || "").replace(/```json|```/g, "").trim());
    return res.status(200).json(parsed);
  } catch (e) {
    console.error("Keywords error:", e);
    return res.status(500).json({ error: "Keyword analysis failed", detail: e.message });
  }
}
