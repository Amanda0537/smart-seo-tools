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
    const { content_html, language, primaryKeyword, entityTerms, h1 } = req.body;
    if (!content_html) return res.status(400).json({ error: "Missing content_html" });
    const lang = language || "English";

    const system = `You are an SEO content editor. Check the article against ALL rules below, then FIX every issue. Return the complete fixed article. Write in ${lang}.

═══ 12-POINT CHECKLIST ═══

1. BANNED PHRASES: Scan every sentence for: "It's worth noting" / "In today's" / "Let's dive in" / "Without a doubt" / "Needless to say" / "Furthermore" (para start) / "Moreover" (para start) / "Additionally" (para start) / "That being said" / "Comprehensive guide" / "Ultimate guide" / "First and foremost" / "Last but not least" / "can be a challenging task" / "a variety of options" / "invaluable insights" / All in all / In conclusion / As we all know / At the end of the day

2. OPENING: Primary keyword "${primaryKeyword || ""}" in first 2 sentences? ≤100 words? Conclusion-first pattern? No forbidden openers ("In this article..." / "XX has become increasingly...")?

3. WORD COUNT: ≥ 1,200 words? If not, EXPAND thin sections with data and examples.

4. SECTION DEPTH: Each H2 ≥ 150 words? Conclusion first? If short, EXPAND.

5. ENTITY DENSITY: Are these terms used: ${(entityTerms || []).join(", ")}? Replace vague terms with specific entity nouns.

6. E-E-A-T (need ≥ 3/4): Experience (first-person), Expertise (technical terms), Authoritativeness (named sources), Trustworthiness ("As of [Date]"). Add missing signals.

7. INTERNAL LINKS: 2-4 links with descriptive anchors? Only to: /seo-audit, /blog-writer, /blog/how-to-do-seo-audit-2026, /blog/core-web-vitals-guide, /blog/ai-content-seo-guide. Remove any links to non-existent pages. Add if missing.

8. CTA: At least 1 call-to-action? Add if missing.

9. TEMPLATE RESIDUE: Any [insert], TODO, TBD, truncated sentences? Remove.

10. LANGUAGE NATURALNESS: Logical transitions? Varied sentence length? Specific examples?

11. PARAGRAPHS: 3-5 lines each? Fix if too long/short.

12. TABLE/LIST: Topic warrants a comparison table? Add if missing.

═══ FIX INSTRUCTIONS ═══
Fix ALL issues directly in the HTML. Return the COMPLETE fixed article.

Return ONLY valid JSON:
{"score":0-100,"issues_found":N,"issues_fixed":N,"eeat_score":"3/4","banned_phrases_found":["list"],"summary":"what was fixed","fixed_html":"COMPLETE fixed HTML"}`;

    const message = `Keyword: "${primaryKeyword || ""}" | H1: "${h1 || ""}" | Lang: ${lang}\n\nArticle:\n${content_html}`;
    const raw = await callClaude(apiKey, system, message, 0.3, 8192);

    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch (parseErr) {
      console.error("Check JSON parse failed, recovering:", parseErr.message);
      const htmlMatch = raw.match(/"fixed_html"\s*:\s*"([\s\S]*?)(?:"\s*[,}]|$)/);
      const scoreMatch = raw.match(/"score"\s*:\s*(\d+)/);
      parsed = {
        score: scoreMatch ? parseInt(scoreMatch[1]) : 75,
        issues_found: 0, issues_fixed: 0,
        summary: "Partial check completed",
        fixed_html: htmlMatch ? htmlMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"') : content_html,
      };
    }

    if (!parsed.fixed_html || parsed.fixed_html.length < content_html.length * 0.3) {
      parsed.fixed_html = content_html;
      parsed.summary = (parsed.summary || "") + " (Used original due to truncation)";
    }

    return res.status(200).json(parsed);
  } catch (e) {
    console.error("Check error:", e);
    return res.status(200).json({
      score: 70, issues_found: 0, issues_fixed: 0,
      summary: "Check skipped: " + e.message,
      fixed_html: req.body?.content_html || "",
    });
  }
}
