// Post-build prerender step.
//
// Vite builds a vanilla SPA into `dist/`. This script then reads that
// built `dist/index.html` (which already has the hashed JS/CSS bundle
// references injected by Vite) and, for every route in routes.mjs,
// writes a per-route static HTML file with:
//
//   - a unique <title>
//   - a unique <meta name="description">
//   - a unique <link rel="canonical"> (on https://www.webchecker.one)
//   - route-specific OpenGraph / Twitter Card meta
//   - route-specific JSON-LD (WebSite / Article / BreadcrumbList)
//   - a static HTML snapshot inside <div id="root">...</div>
//     so Googlebot sees real H1 + content in the initial HTML response
//
// The client JS bundle still mounts via createRoot on hydration, which
// simply replaces the static snapshot with the full interactive React UI.
// No hydration warning because we use createRoot (not hydrateRoot).

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROUTES, SITE_ORIGIN, BLOG_POSTS } from "./routes.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function replaceBlock(html, startMarker, endMarker, replacement) {
  const startIdx = html.indexOf(startMarker);
  const endIdx = html.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1) return html;
  return (
    html.slice(0, startIdx) +
    startMarker +
    replacement +
    endMarker +
    html.slice(endIdx + endMarker.length)
  );
}

function buildJsonLd(route) {
  const canonical = SITE_ORIGIN + (route.path === "/" ? "/" : route.path);
  const base = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Smart SEO Tools",
      url: SITE_ORIGIN,
      description: "AI-powered SEO audit and content optimization tools.",
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_ORIGIN}/seo-audit?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];
  if (route.path.startsWith("/blog/")) {
    const slug = route.path.replace("/blog/", "");
    const post = BLOG_POSTS.find((p) => p.slug === slug);
    if (post) {
      base.push({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.desc,
        datePublished: post.date,
        dateModified: post.updated,
        author: { "@type": "Organization", name: "Smart SEO Tools" },
        publisher: { "@type": "Organization", name: "Smart SEO Tools" },
        mainEntityOfPage: canonical,
      });
      base.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_ORIGIN + "/" },
          { "@type": "ListItem", position: 2, name: "Blog", item: SITE_ORIGIN + "/blog" },
          { "@type": "ListItem", position: 3, name: post.title.split(":")[0] },
        ],
      });
    }
  }
  return base
    .map(
      (obj) =>
        `<script type="application/ld+json">${JSON.stringify(obj)}</script>`
    )
    .join("\n  ");
}

async function main() {
  const templatePath = path.join(dist, "index.html");
  let template;
  try {
    template = await fs.readFile(templatePath, "utf8");
  } catch (err) {
    console.error(
      `[prerender] dist/index.html not found. Run \`vite build\` first.`
    );
    process.exit(1);
  }

  let written = 0;
  for (const route of ROUTES) {
    const canonical = SITE_ORIGIN + (route.path === "/" ? "/" : route.path);
    let html = template;

    html = replaceBlock(
      html,
      "<!--SSG_TITLE_START-->",
      "<!--SSG_TITLE_END-->",
      `<title>${escapeAttr(route.title)}</title>`
    );
    html = replaceBlock(
      html,
      "<!--SSG_DESC_START-->",
      "<!--SSG_DESC_END-->",
      `<meta name="description" content="${escapeAttr(route.description)}" />`
    );
    html = replaceBlock(
      html,
      "<!--SSG_CANONICAL_START-->",
      "<!--SSG_CANONICAL_END-->",
      `<link rel="canonical" href="${canonical}" />`
    );
    html = replaceBlock(
      html,
      "<!--SSG_OG_START-->",
      "<!--SSG_OG_END-->",
      [
        `<meta property="og:title" content="${escapeAttr(route.title)}" />`,
        `<meta property="og:description" content="${escapeAttr(route.description)}" />`,
        `<meta property="og:url" content="${canonical}" />`,
        `<meta property="og:type" content="${route.path.startsWith("/blog/") ? "article" : "website"}" />`,
        `<meta property="og:site_name" content="Smart SEO Tools" />`,
        `<meta property="og:image" content="${SITE_ORIGIN}/og-image.png" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta name="twitter:title" content="${escapeAttr(route.title)}" />`,
        `<meta name="twitter:description" content="${escapeAttr(route.description)}" />`,
      ].join("\n  ")
    );
    html = replaceBlock(
      html,
      "<!--SSG_JSONLD_START-->",
      "<!--SSG_JSONLD_END-->",
      buildJsonLd(route)
    );
    html = html.replace(
      "<!--SSG_CONTENT-->",
      `<div class="ssg-fallback" aria-hidden="false">${route.content}</div>`
    );

    const outPath = path.join(dist, route.file);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, html, "utf8");
    written++;
    console.log(
      `[prerender] ${route.path.padEnd(42)} -> dist/${route.file}`
    );
  }

  // Inject a tiny CSS block so the static fallback is reasonable-looking
  // before React hydration replaces it. We do this by appending a stylesheet
  // reference into every generated file.
  const ssgCss = `
.ssg-fallback{max-width:900px;margin:0 auto;padding:24px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;color:#0f172a;line-height:1.7}
.ssg-fallback h1{font-size:clamp(24px,4vw,36px);margin:.2em 0 .6em}
.ssg-fallback h2{font-size:clamp(18px,2.6vw,24px);margin:1.4em 0 .4em}
.ssg-fallback p{margin:0 0 1em;color:#334155}
.ssg-fallback ul{margin:0 0 1em 1.4em}
.ssg-fallback a{color:#2563eb;text-decoration:none}
.ssg-fallback a:hover{text-decoration:underline}
.ssg-header{max-width:900px;margin:0 auto;padding:18px 24px;display:flex;gap:18px;align-items:center;border-bottom:1px solid #e2e8f0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.ssg-header .ssg-logo{font-weight:700;color:#0f172a}
.ssg-header nav{display:flex;gap:14px;font-size:14px}
.ssg-header nav a{color:#334155}
.ssg-footer{max-width:900px;margin:40px auto 0;padding:24px;border-top:1px solid #e2e8f0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px;color:#64748b}
.ssg-footer nav{margin:6px 0}
/* When React mounts via createRoot it replaces #root's innerHTML, so
   the fallback is automatically removed at that point. */
`.trim();

  for (const route of ROUTES) {
    const outPath = path.join(dist, route.file);
    let html = await fs.readFile(outPath, "utf8");
    html = html.replace(
      "</head>",
      `<style data-ssg>${ssgCss}</style>\n</head>`
    );
    await fs.writeFile(outPath, html, "utf8");
  }

  console.log(`[prerender] done: ${written} pages written to dist/`);
}

main().catch((err) => {
  console.error("[prerender] failed:", err);
  process.exit(1);
});
