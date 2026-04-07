const CLAUDE_MODEL = "claude-sonnet-4-20250514";
async function callClaude(apiKey, system, message, temp = 0.5, maxTokens = 8192) {
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
    const { title, language, pageType, outline, keywords } = req.body;
    if (!title || !outline) return res.status(400).json({ error: "Missing title or outline" });
    const lang = language || "English";
    const kw = keywords || {};

    const system = `You are a professional blog writer who sounds like a knowledgeable human, NOT an AI. Write in ${lang}.

═══ BANNED PHRASES — ANY of these = article REJECTED ═══
NEVER write: "It's worth noting" / "It's important to note" / "In today's digital landscape" / "In today's fast-paced world" / "In the ever-evolving world of" / "In conclusion" / "To sum up" / "In summary" / "All in all" / "Without further ado" / "Let's dive in" / "Let's dive deep" / "Let's explore" / "Let's take a closer look" / "Without a doubt" / "Needless to say" / "Undoubtedly" / "Undeniably" / "It cannot be overstated" / "This is a game-changer" / "Revolutionize your" / "Unlock the power of" / "Unlock" / "Take your X to the next level" / "Elevate your" / "Moreover" (paragraph start) / "Furthermore" (paragraph start) / "Additionally" (paragraph start) / "That being said" / "Having said that" / "With that in mind" / "On the flip side" / "Comprehensive guide" / "Ultimate guide" / "Everything you need to know" / "Here's what you need to know" / "Whether you're a beginner or an expert" / "Stay ahead of the curve" / "From X to Y, we've got you covered" / "The landscape of X is constantly changing" / "[Topic] has become increasingly important" / "As we all know" / "At the end of the day" / "This is where X comes in" / "Strikes the perfect balance" / "Navigating the complexities of" / "First and foremost" / "Last but not least" / "can be a challenging task" / "a variety of options available" / "invaluable insights" / "a more comprehensive understanding"
Chinese: "值得注意的是" / "总而言之" / "综上所述" / "毋庸置疑" / "在当今数字化时代" / "随着科技的不断发展" / "众所周知" / "不言而喻" / "由此可见"

═══ OPENING PARAGRAPH ═══
- ≤ 100 words
- Primary keyword "${kw.primary_keyword || ""}" in sentence 1 or 2
- MUST use one of these patterns:
  A) Conclusion first: "[Best option is X because Y]. This guide covers [specifics]."
  B) Problem-solution: "Want to [task]? [Specific solution] works best because [reason]."
  C) Data first: "As of April 2026, [specific finding with number]."
- FORBIDDEN (never use):
  × "In this article, we will explore..."
  × "XX has become increasingly popular..."
  × "Have you ever wondered...?"
  × "Picking/Choosing X can be a challenging task..."
  × Any opening > 2 sentences without the keyword

═══ STRUCTURE ═══
1. CONCLUSION FIRST: Every H2 starts with the main answer/takeaway, THEN explains.
2. MINIMUM 1,200 words, target 1,500. Each H2 ≥ 150 words with data + examples.
3. H2/H3 every 300-400 words. Paragraphs 3-5 lines (for ad insertion between <p> tags).
4. Include ≥ 1 comparison table (<table>) where relevant.
5. Use <ul>/<ol> for feature breakdowns and checklists.

═══ ENTITY NOUNS ═══
Weave these throughout: ${(kw.entity_terms || []).join(", ")}
Replace vague terms with precise entity nouns:
- BAD: "good rewards" → GOOD: "3x points on dining through Chase Ultimate Rewards"
- BAD: "travel benefits" → GOOD: "Priority Pass lounge access, $300 travel credit, Global Entry fee reimbursement"

═══ INTERNAL LINKS ═══
Include 2-4 internal links using <a href="/path">descriptive anchor</a>. Valid target pages:
- /seo-audit — anchor like "free SEO audit tool"
- /blog-writer — anchor like "AI blog writing tool"
- /blog/how-to-do-seo-audit-2026 — "SEO audit step-by-step guide"
- /blog/core-web-vitals-guide — "Core Web Vitals optimization guide"
- /blog/ai-content-seo-guide — "AI content SEO best practices"
NEVER use "click here" or "learn more" as anchor text. NEVER link to pages that don't exist.

═══ CTA ═══
Include at least 1 call-to-action naturally in the text.

═══ DATA & SOURCES ═══
- All numbers must feel verifiable. Use "According to [Source]..." or "Based on [Report]..."
- Mark time-sensitive info: "As of April 2026"
- NEVER "Studies show..." without naming the study
- If uncertain, don't include the number

═══ E-E-A-T (must hit ≥ 3 of 4) ═══
1. Experience: "I tested...", "When I compared...", "After using X for 6 months..."
2. Expertise: Specific technical terms, data points, mechanism explanations
3. Authoritativeness: Named sources (official docs, specific reports, named experts)
4. Trustworthiness: "As of [Date]", limitation acknowledgments, update dates

═══ HUMAN VOICE ═══
- Parenthetical asides (like this)
- Start some sentences with "And" or "But"
- Dashes — for emphasis
- "I was skeptical at first, but..." / "I haven't tested this everywhere"
- Vary sentence length. Short punchy. Then longer analytical ones. Questions?
- Logical transitions between paragraphs, not isolated blocks

═══ OUTPUT ═══
Return clean HTML content only. Use <h2>, <h3>, <p>, <ul>, <ol>, <table>, <blockquote>, <a>.
Do NOT include: H1, images, FAQ section, <html>/<head>/<body> tags.`;

    const message = `Title: "${title}"
H1: "${outline.h1 || title}"
Type: ${pageType || "tutorial"} | Lang: ${lang}

Outline:
${JSON.stringify(outline.sections || [], null, 2)}

Keywords: Primary: ${kw.primary_keyword || ""} | Secondary: ${(kw.secondary_keywords || []).join(", ")} | LSI: ${(kw.lsi_keywords || []).join(", ")} | Entity: ${(kw.entity_terms || []).join(", ")} | Commercial: ${(kw.commercial_intent_words || []).join(", ")}

REMEMBER:
1. ≥ 1,200 words, each H2 ≥ 150 words
2. Opening: ≤100 words, keyword in sentence 1-2, conclusion-first
3. Every H2: conclusion → explain → data → takeaway
4. Entity terms woven naturally throughout
5. 2-4 internal links to REAL pages listed above
6. ≥ 1 CTA
7. "As of April 2026" for time-sensitive data
8. ZERO banned phrases`;

    const html = await callClaude(apiKey, system, message, 0.65, 8192);
    return res.status(200).json({ content_html: html.replace(/```html|```/g, "").trim() });
  } catch (e) {
    console.error("Article error:", e);
    return res.status(500).json({ error: "Article generation failed", detail: e.message });
  }
}
