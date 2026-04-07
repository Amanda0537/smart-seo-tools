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
    const { title, topic, language, pageType, keywords } = req.body;
    if (!title) return res.status(400).json({ error: "Missing title" });
    const lang = language || "English";
    const type = pageType || "tutorial";

    const structures = {
      tutorial: "1)Quick Answer—conclusion FIRST 2)Detailed Steps—each H3 3)Common Mistakes 4)Advanced Tips 5)FAQ. Rule: opening gives answer immediately.",
      comparison: "1)Quick Verdict—pick a winner, not 'both great' 2)Comparison Table(HTML) 3)Deep Dive 4)Pricing 5)Who Should Choose What 6)FAQ. Rule: take a stance.",
      tierlist: "1)Scoring Criteria 2)S Tier 3)A Tier 4)B Tier 5)C Tier 6)How to Choose 7)FAQ. Rule: every item needs data-backed reasoning.",
      tool: "1)How to Use(3-5 H3 steps) 2)Features 3)Use Cases 4)FAQ 5)Related Tools. Rule: include worked example.",
      database: "1)Key Data Table 2)How It Works 3)Practical Applications 4)Related Entries. Rule: data table first."
    };

    const system = `You are an SEO content architect. Return ONLY valid JSON. Plan in ${lang}.

STRUCTURE: ${structures[type] || structures.tutorial}

RULES:
- Every H2 independently valuable, CONCLUSION FIRST pattern
- Each section ≥ 150 words (most 200-300)
- Total article: 1200-1500 words
- h1: like title but conversational, MUST include primary keyword
- h1 MUST NOT contain: "Comprehensive Guide" / "Ultimate Guide" / "Complete Guide"
- meta_description: 120-160 chars, what problem page solves
- Plan 2-4 internal links inside key_points using format "LINK: anchor text → /path"
  Valid paths: /seo-audit, /blog-writer, /blog/how-to-do-seo-audit-2026, /blog/core-web-vitals-guide, /blog/ai-content-seo-guide
- Plan 1 CTA inside a key_point: "CTA: action text → /path"
- FAQ: 4-8 real People Also Ask questions
- Images: 2-3 specific visual descriptions (no generic stock)

JSON format:
{"meta_description":"120-160 chars","h1":"with keyword, no banned phrases","sections":[{"h2":"semantic heading","h3s":["sub1","sub2"],"key_points":["point with data","LINK: anchor → /path","CTA: text → /path"]}],"faq_questions":["q1","q2","q3","q4","q5"],"image_queries":["specific hero desc","section1 desc"]}`;

    const kw = keywords || {};
    const message = `Title: "${title}" | Topic: "${topic}" | Type: ${type} | Lang: ${lang}
Primary: ${kw.primary_keyword || ""} | Secondary: ${(kw.secondary_keywords || []).slice(0, 3).join(", ")}
Entity terms: ${(kw.entity_terms || []).slice(0, 6).join(", ")}`;

    const raw = await callClaude(apiKey, system, message, 0.5, 3000);
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    if (!parsed.sections) parsed.sections = [];
    if (!parsed.faq_questions) parsed.faq_questions = [];
    if (!parsed.image_queries) parsed.image_queries = [];
    if (!parsed.h1) parsed.h1 = title;
    return res.status(200).json(parsed);
  } catch (e) {
    console.error("Outline error:", e);
    return res.status(500).json({ error: "Outline generation failed", detail: e.message });
  }
}
