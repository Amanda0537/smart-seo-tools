export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  try {
    const { title, topic, keyword, language, pageType, suggestedKeywords } = req.body;
    if (!title || !topic) return res.status(400).json({ error: "Missing title or topic" });

    const lang = language || "English";
    const type = pageType || "tutorial";
    const keywords = suggestedKeywords || [];

    // Helper: call Kimi API
    async function callAI(system, message, temperature = 0.5) {
      const r = await fetch("https://api.moonshot.cn/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "moonshot-v1-32k",
          temperature,
          messages: [
            { role: "system", content: system },
            { role: "user", content: message },
          ],
        }),
      });
      if (!r.ok) throw new Error(`Kimi API ${r.status}`);
      const d = await r.json();
      return d.choices?.[0]?.message?.content || "";
    }

    // ══════════════════════════════════════
    // STEP 1: Keyword Strategy
    // ══════════════════════════════════════
    const kwSystem = `You are an SEO keyword strategist. Return ONLY valid JSON.

Analyze the topic and produce a keyword strategy. Consider search volume potential, commercial intent, and semantic relationships.

Return format:
{
  "primary_keyword": "main term to target",
  "secondary_keywords": ["3-5 related terms"],
  "lsi_keywords": ["5-8 semantically related terms that signal topical depth"],
  "long_tail_queries": ["4-8 specific questions from People Also Ask patterns"],
  "commercial_intent_words": ["relevant high-value terms like best, compare, review, pricing"]
}`;

    const kwMsg = `Topic: "${topic}"\nTitle: "${title}"\nTarget keyword hint: "${keyword || "none"}"\nSuggested keywords: ${JSON.stringify(keywords)}\nLanguage: ${lang}`;
    const kwRaw = await callAI(kwSystem, kwMsg, 0.4);
    const kwData = JSON.parse(kwRaw.replace(/```json|```/g, "").trim());

    // ══════════════════════════════════════
    // STEP 2: Article Outline
    // ══════════════════════════════════════
    const pageTypeStructures = {
      tutorial: `Structure for Tutorial/How-to:
1. H2: Quick Answer / Fastest Method (give conclusion immediately)
2. H2: Detailed Steps (each step as H3)
3. H2: Common Mistakes / Troubleshooting
4. H2: Advanced Tips (optional)
5. H2: FAQ (4-8 questions)`,
      comparison: `Structure for Comparison/VS page:
1. H2: Quick Verdict (clear recommendation)
2. H2: Side-by-Side Comparison (table)
3. H2: Deep Dive (key differentiators)
4. H2: Pricing Comparison
5. H2: Who Should Choose What
6. H2: FAQ (4-8 questions)`,
      tierlist: `Structure for Tier List/Ranking:
1. H2: Scoring Criteria
2. H2: S Tier (2-4 sentences per item)
3. H2: A Tier
4. H2: B Tier
5. H2: C Tier
6. H2: How to Choose
7. H2: FAQ (4-8 questions)`,
      tool: `Structure for Tool/Calculator page:
1. H2: How to Use [Tool Name] (3-5 steps as H3)
2. H2: Features / Supported Formats
3. H2: Use Cases
4. H2: FAQ (4-8 questions)
5. H2: Related Tools`,
      database: `Structure for Database/Encyclopedia:
1. H2: [Entry] Key Data (table)
2. H2: How It Works / Mechanics
3. H2: Practical Applications
4. H2: Related Entries`
    };

    const outlineSystem = `You are an SEO content architect. Return ONLY valid JSON.

Create a detailed article outline based on the page type structure. Each H2 must be independently valuable.

${pageTypeStructures[type] || pageTypeStructures.tutorial}

Return format:
{
  "meta_description": "120-160 characters, complements the title",
  "h1": "similar to title but more conversational, includes primary keyword",
  "sections": [
    {
      "h2": "section heading with semantic keyword variation",
      "h3s": ["subsection 1", "subsection 2"],
      "key_points": ["main point to cover", "specific data/example to include"],
      "target_words": 200
    }
  ],
  "faq_questions": ["question 1", "question 2", "...4-8 questions from real search patterns"],
  "image_queries": ["search query for hero image", "search query for section image 1", "search query for section image 2"]
}`;

    const outlineMsg = `Title: "${title}"\nTopic: "${topic}"\nPage type: ${type}\nLanguage: ${lang}\nKeyword strategy:\n${JSON.stringify(kwData, null, 2)}\n\nCreate a detailed outline. The image_queries should describe specific, relevant visuals (never generic stock photos). FAQ questions should come from real "People Also Ask" patterns.`;
    const outlineRaw = await callAI(outlineSystem, outlineMsg, 0.5);
    const outlineData = JSON.parse(outlineRaw.replace(/```json|```/g, "").trim());

    // ══════════════════════════════════════
    // STEP 3: Write Full Article
    // ══════════════════════════════════════
    const bannedPhrases = `BANNED PHRASES (never use any of these):
- "It's worth noting that..." / "It's important to note..."
- "In today's digital landscape..." / "In today's fast-paced world..."
- "In the ever-evolving world of..."
- "In conclusion..." / "To sum up..." / "In summary..." / "All in all..."
- "Without further ado..." / "Let's dive in..." / "Let's explore..."
- "Without a doubt..." / "Needless to say..." / "Undoubtedly..."
- "It cannot be overstated..." / "This is a game-changer"
- "Revolutionize your..." / "Unlock the power of..." / "Take your X to the next level"
- "Moreover..." / "Furthermore..." / "Additionally..." (at paragraph start)
- "That being said..." / "Having said that..." / "With that in mind..."
- "Comprehensive guide to..." / "Ultimate guide to..." / "Everything you need to know..."
- "Whether you're a beginner or an expert..."
- "Stay ahead of the curve" / "Elevate your..."
- Chinese: "值得注意的是" / "总而言之" / "综上所述" / "毋庸置疑" / "在当今数字化时代" / "随着科技的不断发展" / "众所周知"`;

    const writeSystem = `You are a professional blog writer who sounds like a knowledgeable human, NOT an AI. You write in ${lang}.

CRITICAL WRITING RULES:
1. FIRST-PERSON EXPERIENCE: Use "I tested...", "In our review...", "When I used this..." — show real experience
2. BE SPECIFIC: Replace every vague claim with a specific number, tool name, or data point
3. HAVE AN OPINION: Never "both are great in their own way" — take a clear stance
4. VARY SENTENCE STRUCTURE: Mix short punchy sentences with longer ones. Use questions. Sentence fragments for emphasis.
5. CONVERSATIONAL TONE: Write like explaining to a smart colleague, not writing a textbook
6. NO FILLER: Every paragraph must carry real information. Delete anything that restates the same idea.
7. OPENING: ≤100 words, primary keyword in first 2 sentences, directly state what reader learns
8. PARAGRAPHS: 3-5 lines each (important for ad placement between <p> tags)
9. A new H2 or H3 every 300-400 words
10. Total word count: 800-2000 words (body text only)

${bannedPhrases}

HOW TO SOUND HUMAN:
- Use parenthetical asides (like this one)
- Start some sentences with "And" or "But"
- Use dashes for emphasis — it's natural
- Reference specific experiences: "I was skeptical at first, but..."
- Acknowledge limitations: "I haven't tested this on all platforms"
- Instead of "Furthermore" → "Here's the thing though"
- Instead of "In conclusion" → "So what does this mean for you?"

E-E-A-T SIGNALS (mandatory):
- First-person evidence in every major section
- Specific data points with context (not "studies show")
- At least 1-2 insights competitors miss
- Mark time-sensitive info with "As of [Date]"

OUTPUT FORMAT:
Return the article as clean HTML (no <html>, <head>, <body> tags — just the content HTML starting from the opening <p>).
Use semantic HTML: <h2>, <h3>, <p>, <ul>, <ol>, <table>, <blockquote>.
Do NOT include the H1 (it will be added separately).
Do NOT include image tags (they will be inserted separately).
Do NOT include FAQ section (it will be generated separately).`;

    const writeMsg = `Write the full article based on this outline:

Title: "${title}"
H1: "${outlineData.h1 || title}"
Page type: ${type}
Language: ${lang}

Outline:
${JSON.stringify(outlineData.sections, null, 2)}

Keyword strategy:
- Primary: ${kwData.primary_keyword}
- Secondary: ${kwData.secondary_keywords?.join(", ")}
- LSI: ${kwData.lsi_keywords?.join(", ")}

Write the complete article now. Remember: sound human, be specific, have opinions, use first-person experience.`;

    const articleHtml = await callAI(writeSystem, writeMsg, 0.65);

    // ══════════════════════════════════════
    // STEP 4: Generate FAQ Section
    // ══════════════════════════════════════
    const faqSystem = `You are an SEO content writer. Return ONLY valid JSON. Write in ${lang}.

Generate FAQ answers that are direct, specific, and useful. Each answer should:
- Start with a clear conclusion (no hedging)
- Be 50-150 words
- Include at least one specific detail or data point
- Sound like a knowledgeable human, not an AI

${bannedPhrases}

Return format:
{
  "faqs": [
    { "question": "the question", "answer": "direct, specific answer" }
  ]
}`;

    const faqMsg = `Article topic: "${topic}"\nTitle: "${title}"\nKeywords: ${kwData.primary_keyword}, ${kwData.secondary_keywords?.join(", ")}\n\nQuestions to answer:\n${(outlineData.faq_questions || []).map((q, i) => `${i + 1}. ${q}`).join("\n")}\n\nIf fewer than 4 questions provided, add more based on common search patterns for this topic.`;
    const faqRaw = await callAI(faqSystem, faqMsg, 0.5);
    const faqData = JSON.parse(faqRaw.replace(/```json|```/g, "").trim());

    // ══════════════════════════════════════
    // STEP 5: Quality Check
    // ══════════════════════════════════════
    const checkSystem = `You are an SEO content quality auditor. Return ONLY valid JSON.

Check the article against these rules and find problems:
1. Any AI-banned phrases present? (check the full banned list)
2. Does the opening paragraph contain the primary keyword in the first 2 sentences?
3. Is opening paragraph ≤ 100 words?
4. Does each section have specific data/examples (not vague claims)?
5. Are there first-person experience statements?
6. Do consecutive paragraphs start with the same structure?
7. Any filler paragraphs that repeat the same point?
8. Are paragraphs 3-5 lines each?

Return format:
{
  "score": 0-100,
  "issues": [
    { "type": "banned_phrase|structure|quality|eeat", "location": "where in the article", "problem": "what's wrong", "fix": "how to fix it" }
  ],
  "needs_rewrite": true/false
}

Set needs_rewrite to true if score < 70 or if there are any banned_phrase issues.`;

    const cleanArticle = articleHtml.replace(/```html|```/g, "").trim();
    const checkMsg = `Primary keyword: "${kwData.primary_keyword}"\nLanguage: ${lang}\n\nArticle HTML to check:\n${cleanArticle}`;
    const checkRaw = await callAI(checkSystem, checkMsg, 0.3);
    const checkData = JSON.parse(checkRaw.replace(/```json|```/g, "").trim());

    // ══════════════════════════════════════
    // STEP 6: Fix Issues (if needed)
    // ══════════════════════════════════════
    let finalArticle = cleanArticle;

    if (checkData.needs_rewrite && checkData.issues?.length > 0) {
      const fixSystem = `You are a professional blog editor. Your job is to fix specific issues in an article while maintaining the overall structure and voice. Write in ${lang}.

${bannedPhrases}

RULES:
- Fix ONLY the identified issues
- Maintain the same overall structure and flow
- Keep the same HTML tags and hierarchy
- Ensure the result sounds natural and human
- Return ONLY the fixed HTML content (no markdown fences, no explanation)`;

      const fixMsg = `Fix these issues in the article:

Issues found:
${checkData.issues.map((i, idx) => `${idx + 1}. [${i.type}] ${i.problem} → Fix: ${i.fix}`).join("\n")}

Original article HTML:
${cleanArticle}

Return the complete fixed article HTML.`;

      const fixedRaw = await callAI(fixSystem, fixMsg, 0.4);
      finalArticle = fixedRaw.replace(/```html|```/g, "").trim();
    }

    // ══════════════════════════════════════
    // Build Response
    // ══════════════════════════════════════
    const today = new Date().toISOString().split("T")[0];

    return res.status(200).json({
      success: true,
      article: {
        title: title,
        h1: outlineData.h1 || title,
        meta_description: outlineData.meta_description || "",
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60),
        language: lang,
        page_type: type,
        date: today,
        keywords: {
          primary: kwData.primary_keyword,
          secondary: kwData.secondary_keywords || [],
          lsi: kwData.lsi_keywords || [],
        },
        content_html: finalArticle,
        faqs: faqData.faqs || [],
        image_queries: outlineData.image_queries || [],
        quality_score: checkData.score || 0,
        quality_issues: checkData.issues || [],
        was_rewritten: checkData.needs_rewrite || false,
      },
    });
  } catch (error) {
    console.error("Writer generate error:", error);
    return res.status(500).json({ error: "Generation failed. Please try again.", detail: error.message });
  }
}
