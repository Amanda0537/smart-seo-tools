export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  try {
    const { content_html, language, primaryKeyword, entityTerms, h1 } = req.body;
    if (!content_html) return res.status(400).json({ error: "Missing content_html" });

    const lang = language || "English";

    const system = `You are an SEO content quality auditor and editor. Check the article against ALL rules below, then FIX every issue you find. Write in ${lang}.

═══ CHECKLIST (check ALL of these) ═══

1. BANNED PHRASES SCAN (审核指南第九关):
Scan EVERY sentence. Flag ANY occurrence of:
"It's worth noting" / "It's important to note" / "In today's digital landscape" / "In today's fast-paced world" / "In the ever-evolving world of" / "In conclusion" / "To sum up" / "In summary" / "All in all" / "Without further ado" / "Let's dive in" / "Let's dive deep" / "Let's explore" / "Let's take a closer look" / "Without a doubt" / "Needless to say" / "Undoubtedly" / "It cannot be overstated" / "This is a game-changer" / "Revolutionize" / "Unlock the power of" / "Unlock" / "Take your X to the next level" / "Elevate your" / "Moreover" (paragraph start) / "Furthermore" (paragraph start) / "Additionally" (paragraph start) / "That being said" / "Having said that" / "With that in mind" / "Comprehensive guide" / "Ultimate guide" / "Everything you need to know" / "Whether you're a beginner or an expert" / "Stay ahead of the curve" / "First and foremost" / "Last but not least" / "As we all know" / "At the end of the day" / "This is where X comes in" / "Navigating the complexities" / "Strikes the perfect balance"
Chinese: "值得注意的是" / "总而言之" / "综上所述" / "毋庸置疑" / "在当今数字化时代" / "随着科技的不断发展" / "众所周知"

2. OPENING PARAGRAPH (审核指南 2.5):
- Is primary keyword "${primaryKeyword || ""}" in the first 2 sentences?
- Is it ≤ 100 words?
- Does it use a valid pattern (conclusion-first / problem-solution / data-first)?
- Does it AVOID forbidden patterns: "In this article, we will..." / "XX has become increasingly popular..." / "Have you ever wondered..."?

3. WORD COUNT (审核指南 3.4):
- Is the article ≥ 1,200 words? If not: EXPAND thin sections with specific data, examples, case studies until 1,200+.

4. SECTION DEPTH (审核指南 3.1):
- Does each H2 have ≥ 150 words? If any section has only 2-3 sentences, EXPAND with data, examples, comparisons.
- Does each H2 start with its conclusion/answer FIRST, then explain? If not, restructure.

5. ENTITY NOUN DENSITY:
- Are these terms used throughout: ${(entityTerms || []).join(", ")}?
- Replace vague terms ("good benefits", "many options") with specific entity nouns.

6. E-E-A-T CHECK (审核指南第四关 — need ≥ 3/4):
- Experience: Are there first-person statements ("I tested...", "When I used...")?
- Expertise: Are there specific technical terms, data points, version numbers?
- Authoritativeness: Are sources cited by name (not "studies show")?
- Trustworthiness: Are there "As of [Date]" markers, update dates, limitation acknowledgments?
If < 3 signals present, ADD them.

7. INTERNAL LINKS (审核指南第七关):
- Are there 2-4 internal links with descriptive anchor text?
- Are anchors descriptive (NOT "click here" or "learn more")?
If missing, add links to: /seo-audit, /blog-writer, or relevant /blog/ pages.

8. CTA CHECK (审核指南 7.3):
- Is there at least 1 call-to-action? If missing, add one appropriate to the content.

9. TEMPLATE RESIDUE (审核指南 9.2):
- Any [insert content], TODO, TBD, placeholder text?
- Any template titles that don't match content?
Remove all.

10. LANGUAGE NATURALNESS (审核指南 9.3):
- Do paragraphs have logical transitions (not isolated blocks)?
- Is sentence length varied (not all same structure)?
- Are there specific examples and details (not all abstract)?

11. PARAGRAPH STRUCTURE:
- Are paragraphs 3-5 lines each? Split long ones, combine short ones.
- Do consecutive paragraphs start differently? Fix repetitive openers.

12. COMPARISON TABLE:
- Does the topic warrant a comparison table? If yes and missing, add one.

═══ FIX INSTRUCTIONS ═══
Fix ALL issues directly in the HTML. Do not just list problems — actually fix them:
- Replace every banned phrase with a natural alternative
- Expand thin sections to ≥ 150 words
- If total < 1,200 words, add substantive content
- Add missing E-E-A-T signals
- Add missing internal links
- Fix opening paragraph if it violates rules
- Remove template residue

Return ONLY valid JSON:
{
  "score": 0-100,
  "issues_found": number,
  "issues_fixed": number,
  "eeat_score": "3/4 or 4/4 etc",
  "word_count_ok": true/false,
  "banned_phrases_found": ["list of any banned phrases found"],
  "summary": "2-3 sentence summary of what was checked and fixed",
  "fixed_html": "the COMPLETE fixed article HTML"
}

CRITICAL: fixed_html must contain the COMPLETE article, not just the changed parts.`;

    const message = `Primary keyword: "${primaryKeyword || ""}"\nH1: "${h1 || ""}"\nLanguage: ${lang}\nEntity terms expected: ${(entityTerms || []).join(", ")}\n\nArticle HTML to audit and fix:\n${content_html}`;

    const r = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "moonshot-v1-32k", temperature: 0.3, messages: [{ role: "system", content: system }, { role: "user", content: message }] }),
    });
    if (!r.ok) { const t = await r.text(); return res.status(r.status).json({ error: `Kimi ${r.status}`, detail: t }); }
    const d = await r.json();
    const text = d.choices?.[0]?.message?.content || "";

    // Try to parse, with fallback for truncated JSON
    let parsed;
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch (parseErr) {
      // If JSON is truncated (common with long fixed_html), try to extract what we can
      console.error("Check JSON parse failed, attempting recovery:", parseErr.message);

      // Try to find fixed_html field even in broken JSON
      const htmlMatch = text.match(/"fixed_html"\s*:\s*"([\s\S]*?)(?:"\s*[,}]|$)/);
      const scoreMatch = text.match(/"score"\s*:\s*(\d+)/);
      const summaryMatch = text.match(/"summary"\s*:\s*"([^"]*?)"/);

      if (htmlMatch) {
        // Unescape the extracted HTML
        let extractedHtml = htmlMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
        parsed = {
          score: scoreMatch ? parseInt(scoreMatch[1]) : 75,
          issues_found: 0,
          issues_fixed: 0,
          summary: summaryMatch ? summaryMatch[1] : "Partial quality check completed",
          fixed_html: extractedHtml,
        };
      } else {
        // Complete failure — return original content
        parsed = {
          score: 70,
          issues_found: 0,
          issues_fixed: 0,
          summary: "Quality check response was truncated. Original content returned.",
          fixed_html: content_html,
        };
      }
    }

    // Final safety: if fixed_html is missing or too short, use original
    if (!parsed.fixed_html || parsed.fixed_html.length < content_html.length * 0.3) {
      parsed.fixed_html = content_html;
      parsed.summary = (parsed.summary || "") + " (Used original content due to truncation)";
    }

    return res.status(200).json(parsed);
  } catch (error) {
    console.error("Quality check error:", error);
    return res.status(200).json({
      score: 70,
      issues_found: 0,
      issues_fixed: 0,
      eeat_score: "unknown",
      word_count_ok: false,
      banned_phrases_found: [],
      summary: "Quality check skipped due to error: " + error.message,
      fixed_html: req.body?.content_html || "",
      check_error: error.message,
    });
  }
}
