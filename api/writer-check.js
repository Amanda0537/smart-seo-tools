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
    const { content_html, language, primaryKeyword, entityTerms, h1 } = req.body;
    if (!content_html) return res.status(400).json({ error: "Missing content_html" });
    const lang = language || "English";

    const systemPrompt = `You are an SEO content editor. Check the article against ALL rules, then FIX every issue. Write in ${lang}.

═══ 12-POINT CHECKLIST ═══
1. BANNED PHRASES: "It's worth noting" / "In today's" / "Let's dive in" / "Without a doubt" / "Needless to say" / "Furthermore" (start) / "Moreover" (start) / "Additionally" (start) / "That being said" / "Comprehensive guide" / "Ultimate guide" / "First and foremost" / "Last but not least" / "can be a challenging task" / "invaluable insights" / All in all / In conclusion / As we all know / At the end of the day
2. OPENING: Keyword "${primaryKeyword || ""}" in first 2 sentences? ≤100 words? Conclusion-first? No forbidden openers?
3. WORD COUNT: ≥1,200? If not, EXPAND thin sections.
4. SECTION DEPTH: Each H2 ≥150 words? Conclusion first? If short, EXPAND.
5. ENTITY DENSITY: Use: ${(entityTerms || []).join(", ")}. Replace vague terms.
6. E-E-A-T (≥3/4): Experience, Expertise, Authoritativeness, Trustworthiness. Add missing.
7. INTERNAL LINKS: 2-4 to /seo-audit, /blog-writer, /blog/*. Remove fake links. Add if missing.
8. CTA: ≥1? Add if missing.
9. TEMPLATE RESIDUE: [insert], TODO, truncated sentences? Remove.
10. NATURALNESS: Logical transitions? Varied sentences? Specific examples?
11. PARAGRAPHS: 3-5 lines each?
12. TABLE/LIST: Add comparison table if topic warrants.

Fix ALL issues in the HTML. Return COMPLETE fixed article.

Return ONLY valid JSON:
{"score":0-100,"issues_found":N,"issues_fixed":N,"eeat_score":"3/4","banned_phrases_found":["list"],"summary":"what fixed","fixed_html":"COMPLETE fixed HTML"}`;

    const message = `Keyword: "${primaryKeyword || ""}" | H1: "${h1 || ""}" | Lang: ${lang}\n\nArticle:\n${content_html}`;

    // Use streaming to avoid Vercel timeout
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
        messages: [{ role: "user", content: message }],
        temperature: 0.3,
        stream: true,
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      return res.status(claudeRes.status).json({ error: `Claude ${claudeRes.status}`, detail: errText.slice(0, 300) });
    }

    // Collect full streamed response
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
          }
        } catch (_) {}
      }
    }

    // Parse the collected JSON
    let parsed;
    try {
      parsed = JSON.parse(fullText.replace(/```json|```/g, "").trim());
    } catch (parseErr) {
      console.error("Check JSON parse failed, recovering:", parseErr.message);
      // Try to extract fixed_html
      const htmlMatch = fullText.match(/"fixed_html"\s*:\s*"([\s\S]*?)(?:"\s*[,}]|$)/);
      const scoreMatch = fullText.match(/"score"\s*:\s*(\d+)/);
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
