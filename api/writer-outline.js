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

    const pageTypeStructures = {
      tutorial: `Tutorial/How-to structure:
1. H2: Quick Answer / Fastest Method — give the conclusion FIRST, then explain
2. H2: Detailed Steps — each step as H3 with specific details, screenshots described, data
3. H2: Common Mistakes / Troubleshooting — capture frustrated searchers
4. H2: Advanced Tips (optional, for power users)
5. H2: FAQ (4-8 questions from People Also Ask)
RULE: Opening paragraph gives the answer right away ("The fastest way to X is...")`,
      comparison: `Comparison/VS structure:
1. H2: Quick Verdict — clear recommendation with reasoning, NOT "both are great"
2. H2: Side-by-Side Comparison — MUST include HTML <table> with feature rows
3. H2: Deep Dive — detailed analysis of 3-5 key differentiators
4. H2: Pricing Comparison — specific numbers, not "varies"
5. H2: Who Should Choose What — scenario-based: "If you need X, pick A. If Y matters, pick B."
6. H2: FAQ (4-8 questions)
RULE: Take a clear stance. Sitting on the fence adds zero value.`,
      tierlist: `Tier List/Ranking structure:
1. H2: Scoring Criteria — explain methodology (not "we just feel like it")
2. H2: S Tier — each item gets 2-4 sentences with specific data/reasoning
3. H2: A Tier — same depth
4. H2: B Tier
5. H2: C Tier (fewer tiers if appropriate)
6. H2: How to Choose What's Right for You
7. H2: FAQ (4-8 questions)
RULE: Every ranked item needs concrete reasoning — data, mechanics, comparisons. "Very strong" is NOT analysis.`,
      tool: `Tool/Calculator structure:
1. H2: How to Use [Tool Name] — 3-5 steps as H3s
2. H2: Features / Supported Formats
3. H2: Use Cases / When You Need This
4. H2: FAQ (focus: free? formats? limits? accuracy?)
5. H2: Related Tools
RULE: Include a worked example (Input X → Output Y)`,
      database: `Database/Encyclopedia structure:
1. H2: [Entry] Key Data — table with core stats/specs AT THE TOP
2. H2: How It Works / Mechanics — explain the underlying system
3. H2: Practical Applications / Best Use Cases
4. H2: Related Entries
RULE: Core data in a structured table first, explanation second`
    };

    const system = `You are an SEO content architect. Return ONLY valid JSON. Plan in ${lang}.

Create a detailed article outline. CRITICAL requirements:

STRUCTURE RULES:
${pageTypeStructures[type] || pageTypeStructures.tutorial}

OUTLINE QUALITY RULES:
1. Every H2 section MUST be independently valuable — could answer a user question on its own
2. Every H2 MUST follow "conclusion first, explanation second" pattern
3. Each section target_words MUST be ≥ 150 words (most should be 200-300)
4. Total article target: 1,200-1,500 words
5. H2 headings must contain semantic keyword variations (not just the primary keyword repeated)

INTERNAL LINKING PLAN (审核指南第七关):
Plan 2-4 internal links to other pages on the site. Use descriptive anchor text, NEVER "click here" or "learn more". Format: "check our [topic] guide" or use the target keyword directly.

CTA PLAN (审核指南第七关):
Plan at least 1 clear call-to-action appropriate to the page type:
- Tool page → "Try our free [tool]"
- Tutorial → "Follow these steps now" or link to related tool
- Comparison → "Use our audit tool to check your site"
- Tier List → "See our detailed [item] guide"

Return format:
{
  "meta_description": "120-160 characters, complements title, says what problem page solves + why click",
  "h1": "similar to title but more conversational, includes primary keyword, NO banned phrases (no Comprehensive/Ultimate/Complete Guide)",
  "sections": [
    {
      "h2": "heading with semantic keyword variation",
      "h3s": ["subsection 1", "subsection 2"],
      "key_points": ["specific data/example to include", "case study or comparison"],
      "conclusion_first": "the main takeaway this section delivers upfront",
      "target_words": 200
    }
  ],
  "internal_links": [
    {"anchor_text": "descriptive anchor", "target_page": "/seo-audit or /blog-writer or /blog/[slug]", "placement": "which section to place it in"}
  ],
  "cta": {"text": "call to action text", "placement": "which section", "link": "target URL"},
  "faq_questions": ["4-8 questions from real People Also Ask patterns"],
  "image_queries": ["specific visual description for hero", "specific visual for section 1", "specific visual for section 2"]
}`;

    const message = `Title: "${title}"\nTopic: "${topic}"\nPage type: ${type}\nLanguage: ${lang}\nKeyword strategy:\n${JSON.stringify(keywords || {}, null, 2)}\n\nCRITICAL:
- h1 must NOT contain "Comprehensive Guide", "Ultimate Guide", "Complete Guide"
- Every section needs conclusion_first filled in
- Plan 2-4 internal links with descriptive anchors
- Plan at least 1 CTA
- image_queries must describe specific relevant visuals, never generic stock photos
- FAQ questions from real search patterns, not made up`;

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
    console.error("Outline error:", e);
    return res.status(500).json({ error: "Outline generation failed", detail: e.message });
  }
}
