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
    const { system, message } = req.body;
    if (!message) return res.status(400).json({ error: "Missing message" });

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        temperature: 0.3,
        system: system || "You are a senior SEO expert. Provide thorough, actionable SEO audits.",
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error("Claude API error:", r.status, errText);
      return res.status(r.status).json({ error: "API request failed", detail: errText.slice(0, 200) });
    }

    const data = await r.json();
    const text = (data.content || []).map(b => b.text || "").join("");
    return res.status(200).json({ content: [{ type: "text", text }] });
  } catch (error) {
    console.error("Audit error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
