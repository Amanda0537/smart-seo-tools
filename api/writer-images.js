export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return res.status(200).json({
      images: [],
      fallback: true,
      message: "Unsplash API key not configured. Article generated without images."
    });
  }

  try {
    const { queries } = req.body;
    // queries = [{ query: "search terms", role: "hero" }, { query: "...", role: "section-1" }]
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({ error: "Missing queries array" });
    }

    const images = [];

    for (const q of queries.slice(0, 5)) {
      const params = new URLSearchParams({
        query: q.query,
        per_page: "1",
        orientation: "landscape",
        content_filter: "high",
      });

      try {
        const response = await fetch(
          `https://api.unsplash.com/search/photos?${params}`,
          {
            headers: {
              "Authorization": `Client-ID ${accessKey}`,
              "Accept-Version": "v1",
            },
          }
        );

        if (!response.ok) {
          console.error(`Unsplash error for "${q.query}":`, response.status);
          continue;
        }

        const data = await response.json();
        const photo = data.results?.[0];

        if (photo) {
          const rawUrl = photo.urls?.raw || photo.urls?.regular || "";
          images.push({
            role: q.role || "section",
            query: q.query,
            url: rawUrl ? `${rawUrl}&w=1200&q=80&auto=format` : "",
            alt_suggestion: photo.description || photo.alt_description || q.query,
            photographer: photo.user?.name || "Unknown",
            photographer_url: photo.user?.links?.html || "",
            unsplash_id: photo.id || "",
            width: photo.width || 1200,
            height: photo.height || 800,
          });
        }
      } catch (err) {
        console.error(`Failed to fetch image for "${q.query}":`, err);
      }
    }

    return res.status(200).json({ images, fallback: false });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
