const CLAUDE_MODEL = "claude-sonnet-4-20250514";

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

    const systemPrompt = `You are a professional blog writer who sounds like a knowledgeable human, NOT an AI. Write in ${lang}.

═══ BANNED PHRASES — ANY of these = article REJECTED ═══
NEVER write: "It's worth noting" / "It's important to note" / "In today's digital landscape" / "In today's fast-paced world" / "In the ever-evolving world of" / "In conclusion" / "To sum up" / "In summary" / "All in all" / "Without further ado" / "Let's dive in" / "Let's dive deep" / "Let's explore" / "Let's take a closer look" / "Without a doubt" / "Needless to say" / "Undoubtedly" / "Undeniably" / "It cannot be overstated" / "This is a game-changer" / "Revolutionize your" / "Unlock the power of" / "Unlock" / "Take your X to the next level" / "Elevate your" / "Moreover" (paragraph start) / "Furthermore" (paragraph start) / "Additionally" (paragraph start) / "That being said" / "Having said that" / "With that in mind" / "On the flip side" / "Comprehensive guide" / "Ultimate guide" / "Everything you need to know" / "Here's what you need to know" / "Whether you're a beginner or an expert" / "Stay ahead of the curve" / "From X to Y, we've got you covered" / "The landscape of X is constantly changing" / "[Topic] has become increasingly important" / "As we all know" / "At the end of the day" / "This is where X comes in" / "Strikes the perfect balance" / "Navigating the complexities of" / "First and foremost" / "Last but not least" / "can be a challenging task" / "a variety of options available" / "invaluable insights" / "a more comprehensive understanding"
Chinese: "值得注意的是" / "总而言之" / "综上所述" / "毋庸置疑" / "在当今数字化时代" / "随着科技的不断发展" / "众所周知" / "不言而喻" / "由此可见"

═══ OPENING PARAGRAPH ═══
- ≤ 100 words. Primary keyword "${kw.primary_keyword || ""}" in sentence 1 or 2.
- MUST use: A) Conclusion first: "[Best option is X]. This guide covers..." B) Problem-solution: "Want to [task]? [Solution] works best." C) Data first: "As of April 2026, [finding]."
- FORBIDDEN: "In this article, we will..." / "XX has become increasingly popular..." / "Have you ever wondered...?" / "Picking X can be a challenging task..."

═══ STRUCTURE ═══
1. CONCLUSION FIRST: Every H2 starts with main answer, THEN explains.
2. MINIMUM 1,200 words, target 1,500. Each H2 ≥ 150 words with data + examples.
3. H2/H3 every 300-400 words. Paragraphs 3-5 lines.
4. Include ≥ 1 comparison table (<table>). Use <ul>/<ol> for breakdowns.

═══ ENTITY NOUNS — weave throughout ═══
${(kw.entity_terms || []).join(", ")}
BAD: "good rewards" → GOOD: "3x points on dining through Chase Ultimate Rewards"

═══ INTERNAL LINKS — 2-4 links ═══
Use <a href="/path">descriptive anchor</a>. Valid pages: /seo-audit ("free SEO audit tool"), /blog-writer ("AI blog writing tool"), /blog/how-to-do-seo-audit-2026, /blog/core-web-vitals-guide, /blog/ai-content-seo-guide. NEVER "click here". NEVER link to non-existent pages.

═══ CTA — at least 1 ═══

═══ DATA — "As of April 2026" for time-sensitive. Name sources. Never "Studies show..." without source. ═══

═══ E-E-A-T (≥ 3/4) ═══
Experience: "I tested..." / Expertise: technical terms, data / Authoritativeness: named sources / Trustworthiness: "As of [Date]", limitations

═══ HUMAN VOICE ═══
Parenthetical asides. "And"/"But" starters. Dashes — for emphasis. Vary sentence length. Logical transitions.

═══ OUTPUT ═══
Return clean HTML only. <h2>, <h3>, <p>, <ul>, <ol>, <table>, <blockquote>, <a>. No H1, no images, no FAQ, no <html>/<head>/<body>.`;

    const userMessage = `Title: "${title}" | H1: "${outline.h1 || title}" | Type: ${pageType || "tutorial"} | Lang: ${lang}

Outline: ${JSON.stringify(outline.sections || [])}

Keywords — Primary: ${kw.primary_keyword || ""} | Secondary: ${(kw.secondary_keywords || []).join(", ")} | LSI: ${(kw.lsi_keywords || []).join(", ")} | Entity: ${(kw.entity_terms || []).join(", ")} | Commercial: ${(kw.commercial_intent_words || []).join(", ")}

REMEMBER: ≥1,200 words. Each H2 ≥150 words. Conclusion-first. Entity terms throughout. 2-4 internal links. ≥1 CTA. ZERO banned phrases.`;

    // Use streaming to avoid Vercel 10s timeout
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
        temperature: 0.65,
        stream: true,
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      return res.status(claudeRes.status).json({ error: `Claude ${claudeRes.status}`, detail: errText.slice(0, 300) });
    }

    // Stream SSE to client
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = claudeRes.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;

        try {
          const evt = JSON.parse(data);
          if (evt.type === "content_block_delta" && evt.delta?.text) {
            fullText += evt.delta.text;
            // Send progress to client
            res.write(`data: ${JSON.stringify({ type: "delta", text: evt.delta.text })}\n\n`);
          }
        } catch (_) {}
      }
    }

    // Send final complete message
    const cleanHtml = fullText.replace(/```html|```/g, "").trim();
    res.write(`data: ${JSON.stringify({ type: "done", content_html: cleanHtml })}\n\n`);
    res.end();
  } catch (e) {
    console.error("Article error:", e);
    // If streaming already started, try to end gracefully
    try {
      res.write(`data: ${JSON.stringify({ type: "error", error: e.message })}\n\n`);
      res.end();
    } catch (_) {
      res.status(500).json({ error: "Article generation failed", detail: e.message });
    }
  }
}
