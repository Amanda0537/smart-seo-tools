// Attempt to fix truncated JSON
function fixJSON(str) {
  let s = str.replace(/```json|```/g, "").trim();
  try { return JSON.parse(s); } catch (_) {}

  // Try closing open strings and brackets
  // Count open brackets
  let openBraces = 0, openBrackets = 0, inString = false, escaped = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (escaped) { escaped = false; continue; }
    if (c === "\\") { escaped = true; continue; }
    if (c === '"' && !escaped) { inString = !inString; continue; }
    if (inString) continue;
    if (c === "{") openBraces++;
    if (c === "}") openBraces--;
    if (c === "[") openBrackets++;
    if (c === "]") openBrackets--;
  }

  // If in a string, close it
  if (inString) s += '"';
  // Close arrays and objects
  while (openBrackets > 0) { s += "]"; openBrackets--; }
  while (openBraces > 0) { s += "}"; openBraces--; }

  try { return JSON.parse(s); } catch (_) {}

  // Last resort: try to find the last complete object
  const lastBrace = s.lastIndexOf("}");
  if (lastBrace > 0) {
    try { return JSON.parse(s.slice(0, lastBrace + 1)); } catch (_) {}
  }
  throw new Error("Could not parse JSON even after repair attempts");
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  try {
    const { title, topic, language, pageType, keywords } = req.body;
    if (!title) return res.status(400).json({ error: "Missing title" });

    const lang = language || "English";
    const type = pageType || "tutorial";

    const structures = {
      tutorial: `Tutorial: 1)Quick Answer(conclusion first) 2)Detailed Steps(H3 each) 3)Common Mistakes 4)Advanced Tips 5)FAQ`,
      comparison: `Comparison: 1)Quick Verdict(pick a winner) 2)Comparison Table 3)Deep Dive 4)Pricing 5)Who Should Choose What 6)FAQ`,
      tierlist: `Tier List: 1)Scoring Criteria 2)S Tier 3)A Tier 4)B Tier 5)C Tier 6)How to Choose 7)FAQ`,
      tool: `Tool Page: 1)How to Use(3-5 steps) 2)Features 3)Use Cases 4)FAQ 5)Related Tools`,
      database: `Database: 1)Key Data Table 2)How It Works 3)Practical Applications 4)Related Entries`
    };

    const system = `You are an SEO content architect. Return ONLY valid JSON, keep it COMPACT. Plan in ${lang}.

STRUCTURE: ${structures[type] || structures.tutorial}

RULES:
- Every H2 independently valuable, conclusion-first pattern
- Each section ≥150 words target
- H1: like title but more conversational, MUST include primary keyword, NEVER use "Comprehensive/Ultimate/Complete Guide"
- Meta desc: 120-160 chars, complements title
- Plan 2-4 internal links (anchors like "free SEO audit tool" not "click here")
- Plan 1 CTA in key_points of a relevant section
- FAQ: 4-8 questions from People Also Ask
- Images: 2-3 specific visual descriptions (no generic stock)

COMPACT JSON format (keep short to avoid truncation):
{"meta_description":"120-160 chars","h1":"conversational title with keyword","sections":[{"h2":"heading","h3s":["sub1","sub2"],"key_points":["point1","point2","INTERNAL LINK: anchor text → /path","CTA: action text → /path"]}],"faq_questions":["q1","q2","q3","q4"],"image_queries":["hero desc","section1 desc"]}

Keep key_points to 2-4 items per section. Keep h3s to 2-3 per section. This prevents JSON truncation.`;

    const kw = keywords || {};
    const message = `Title: "${title}" | Topic: "${topic}" | Type: ${type} | Lang: ${lang}
Primary: ${kw.primary_keyword || ""} | Secondary: ${(kw.secondary_keywords || []).slice(0, 3).join(", ")}
Entity terms: ${(kw.entity_terms || []).slice(0, 5).join(", ")}

Generate compact outline. h1 MUST NOT contain "Comprehensive/Ultimate/Complete Guide". Include internal links and CTA inside key_points.`;

    const r = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "moonshot-v1-32k", temperature: 0.5, messages: [{ role: "system", content: system }, { role: "user", content: message }] }),
    });
    if (!r.ok) { const t = await r.text(); return res.status(r.status).json({ error: `Kimi ${r.status}`, detail: t }); }
    const d = await r.json();
    const raw = d.choices?.[0]?.message?.content || "";
    const parsed = fixJSON(raw);

    // Ensure minimum structure
    if (!parsed.sections) parsed.sections = [];
    if (!parsed.faq_questions) parsed.faq_questions = [];
    if (!parsed.image_queries) parsed.image_queries = [];
    if (!parsed.h1) parsed.h1 = title;
    if (!parsed.meta_description) parsed.meta_description = "";

    return res.status(200).json(parsed);
  } catch (e) {
    console.error("Outline error:", e);
    return res.status(500).json({ error: "Outline generation failed", detail: e.message });
  }
}
