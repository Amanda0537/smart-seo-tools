export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return res.status(200).json({ images: [], fallback: true, message: "Unsplash key not configured." });
  }

  try {
    const { queries } = req.body;
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({ error: "Missing queries array" });
    }

    const images = [];
    for (const q of queries.slice(0, 5)) {
      const params = new URLSearchParams({ query: q.query, per_page: "1", orientation: "landscape", content_filter: "high" });
      try {
        const r = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
          headers: { "Authorization": `Client-ID ${accessKey}`, "Accept-Version": "v1" },
        });
        if (!r.ok) continue;
        const data = await r.json();
        const photo = data.results?.[0];
        if (photo) {
          const rawUrl = photo.urls?.raw || photo.urls?.regular || "";
          images.push({
            role: q.role || "section",
            query: q.query,
            url: rawUrl ? `${rawUrl}&w=1200&q=80&auto=format` : "",
            alt_suggestion: photo.description || photo.alt_description || q.query,
            photographer: photo.user?.name || "Unknown",
            unsplash_id: photo.id || "",
          });
        }
      } catch (err) { console.error(`Image fetch failed for "${q.query}":`, err); }
    }

    return res.status(200).json({ images, fallback: false });
  } catch (e) {
    console.error("Images error:", e);
    return res.status(500).json({ error: "Image fetch failed", detail: e.message });
  }
}
