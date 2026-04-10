/**
 * Vercel Serverless Function: /api/instagram/parse
 *
 * Receives an Instagram URL, fetches the public page server-side,
 * extracts media (video/image) URLs, and returns them as JSON.
 *
 * Supports: Reels, Posts (single & carousel), IGTV, Stories (public).
 */

// ── Rate Limiter (in-memory, per-IP) ──────────────────────────
const rateMap = new Map();
const RATE_LIMIT = 10;          // max requests
const RATE_WINDOW = 5 * 60_000; // per 5 minutes

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW) {
    rateMap.set(ip, { start: now, count: 1 });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

// ── URL Validation ────────────────────────────────────────────
const IG_RE = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels|tv|stories)\/[\w-]+/i;

function cleanUrl(raw) {
  try {
    const u = new URL(raw.trim());
    // keep only the pathname, strip tracking params
    return `https://www.instagram.com${u.pathname.replace(/\/+$/, '')}/`;
  } catch {
    return null;
  }
}

// ── Instagram Page Fetcher ────────────────────────────────────
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function fetchInstagramPage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-Dest': 'document',
    },
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`Instagram returned ${res.status}`);
  }

  return await res.text();
}

// ── Media Extractor ───────────────────────────────────────────
function extractMedia(html, originalUrl) {
  const result = {
    type: null,        // "video" | "image" | "carousel"
    username: null,
    caption: null,
    thumbnail: null,
    media: [],         // [{ url, type, width, height }]
  };

  // 1) Try og:video (most reliable for Reels/Videos)
  const ogVideo = html.match(/<meta\s+property="og:video"\s+content="([^"]+)"/i)
                || html.match(/<meta\s+content="([^"]+)"\s+property="og:video"/i);
  if (ogVideo) {
    result.type = 'video';
    result.media.push({
      url: ogVideo[1].replace(/&amp;/g, '&'),
      type: 'video',
      quality: 'HD',
    });
  }

  // 2) Try og:image (always present)
  const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
                || html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i);
  if (ogImage) {
    result.thumbnail = ogImage[1].replace(/&amp;/g, '&');
    if (!result.type) {
      result.type = 'image';
      result.media.push({
        url: result.thumbnail,
        type: 'image',
        quality: 'Original',
      });
    }
  }

  // 3) Try og:description for caption
  const ogDesc = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i)
               || html.match(/<meta\s+content="([^"]+)"\s+property="og:description"/i);
  if (ogDesc) {
    result.caption = decodeHTMLEntities(ogDesc[1]);
  }

  // 4) Try to extract username from og:title or page title
  const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
  if (ogTitle) {
    const m = ogTitle[1].match(/(@[\w.]+)/);
    if (m) result.username = m[1];
  }
  if (!result.username) {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      const m2 = titleMatch[1].match(/(@[\w.]+)/);
      if (m2) result.username = m2[1];
    }
  }

  // 5) Try embedded JSON for video_url (Instagram embeds this in scripts)
  const videoUrlMatch = html.match(/"video_url"\s*:\s*"([^"]+)"/);
  if (videoUrlMatch && result.media.length === 0) {
    const videoUrl = videoUrlMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
    result.type = 'video';
    result.media.push({
      url: videoUrl,
      type: 'video',
      quality: 'HD',
    });
  }

  // 6) Try embedded JSON for display_url (image posts)
  if (result.media.length === 0) {
    const displayUrlMatch = html.match(/"display_url"\s*:\s*"([^"]+)"/);
    if (displayUrlMatch) {
      const imageUrl = displayUrlMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
      result.type = 'image';
      result.media.push({
        url: imageUrl,
        type: 'image',
        quality: 'Original',
      });
    }
  }

  // 7) Try to find multiple images (carousel)
  const carouselMatches = [...html.matchAll(/"display_url"\s*:\s*"([^"]+)"/g)];
  if (carouselMatches.length > 1) {
    result.type = 'carousel';
    result.media = carouselMatches.map((m, i) => ({
      url: m[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/'),
      type: 'image',
      quality: 'Original',
      index: i + 1,
    }));
    // Also check for video_url entries in carousel
    const carouselVideos = [...html.matchAll(/"video_url"\s*:\s*"([^"]+)"/g)];
    carouselVideos.forEach((m, i) => {
      result.media.push({
        url: m[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/'),
        type: 'video',
        quality: 'HD',
        index: result.media.length + 1,
      });
    });
  }

  // 8) Detect type from URL pattern if still unknown
  if (!result.type && originalUrl) {
    if (/\/reel\/|\/reels\//i.test(originalUrl)) result.type = 'video';
    else if (/\/tv\//i.test(originalUrl)) result.type = 'video';
    else if (/\/stories\//i.test(originalUrl)) result.type = 'image';
    else result.type = 'image';
  }

  return result;
}

function decodeHTMLEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

// ── Fallback: Instagram oEmbed API ────────────────────────────
async function tryOEmbed(url) {
  try {
    const oembedUrl = `https://graph.facebook.com/v19.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${process.env.META_APP_TOKEN || ''}&maxwidth=1080`;
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const data = await res.json();
      return {
        type: 'embed',
        username: data.author_name || null,
        caption: data.title || null,
        thumbnail: data.thumbnail_url || null,
        media: data.thumbnail_url ? [{
          url: data.thumbnail_url,
          type: 'image',
          quality: 'Original',
        }] : [],
        embed_html: data.html || null,
      };
    }
  } catch { /* ignore */ }
  return null;
}

// ── Main Handler ──────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
           || req.headers['x-real-ip']
           || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({
      error: 'Too many requests. Please wait a few minutes and try again.',
    });
  }

  // Parse body
  const { url } = req.body || {};
  if (!url) {
    return res.status(400).json({ error: 'Missing "url" parameter.' });
  }

  const cleanedUrl = cleanUrl(url);
  if (!cleanedUrl || !IG_RE.test(cleanedUrl)) {
    return res.status(400).json({
      error: 'Invalid Instagram URL. Please provide a link to a public post, reel, story or IGTV.',
    });
  }

  try {
    // Attempt 1: Fetch page HTML directly
    const html = await fetchInstagramPage(cleanedUrl);
    const result = extractMedia(html, cleanedUrl);

    if (result.media.length > 0) {
      return res.status(200).json({
        success: true,
        data: result,
      });
    }

    // Attempt 2: Try oEmbed API (if META_APP_TOKEN is set)
    if (process.env.META_APP_TOKEN) {
      const oembedResult = await tryOEmbed(cleanedUrl);
      if (oembedResult && oembedResult.media.length > 0) {
        return res.status(200).json({
          success: true,
          data: oembedResult,
        });
      }
    }

    // Nothing found
    return res.status(404).json({
      error: 'Could not extract media from this URL. The post may be private, deleted, or Instagram may have blocked the request. Please try again later.',
    });

  } catch (err) {
    console.error('Parse error:', err.message);
    return res.status(500).json({
      error: 'Failed to process the Instagram URL. Please try again later.',
    });
  }
}
