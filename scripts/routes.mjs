// Route metadata used by the prerender step.
// Each route becomes a static HTML file at build time so Googlebot
// sees real title/description/canonical/H1/content in the initial HTML.

export const SITE_ORIGIN = "https://www.webchecker.one";

export const BLOG_POSTS = [
  {
    slug: "how-to-do-seo-audit-2026",
    title: "How to Do an SEO Audit in 2026: Step-by-Step Guide",
    desc: "Complete SEO audit guide covering technical SEO, on-page, content quality, Core Web Vitals, and E-E-A-T.",
    h1: "How to Do an SEO Audit in 2026: A Complete Step-by-Step Guide",
    date: "2026-04-01",
    updated: "2026-04-03",
    author: "Smart SEO Tools Team",
    cat: "SEO Guides",
    rt: "12",
    intro:
      "An SEO audit tells you exactly why your site ranks where it does — and what to fix first. This guide walks through a complete SEO audit in 2026, step by step, covering technical SEO, on-page optimisation, content quality, Core Web Vitals, internal linking, and E-E-A-T signals.",
    sections: [
      "What Is an SEO Audit, and Why Does It Matter?",
      "Step 1: Crawl Your Site and Check Technical SEO",
      "Step 2: Evaluate On-Page SEO Elements",
      "Step 3: Assess Content Quality and E-E-A-T",
      "Step 4: Test Core Web Vitals and Page Speed",
      "Step 5: Review Internal Links and Site Structure",
      "Step 6: Check Compliance and Trust Pages",
      "Putting It All Together: Your Audit Checklist",
    ],
  },
  {
    slug: "core-web-vitals-guide",
    title: "Core Web Vitals 2026: How to Improve LCP, INP & CLS",
    desc: "Master Core Web Vitals with benchmarks, tools, and step-by-step optimization for faster websites.",
    h1: "Core Web Vitals in 2026: A Practical Guide to LCP, INP, and CLS",
    date: "2026-03-28",
    updated: "2026-04-02",
    author: "Smart SEO Tools Team",
    cat: "Technical SEO",
    rt: "10",
    intro:
      "Core Web Vitals measure what users actually feel when they visit your site — how fast it loads, how quickly it responds to clicks, and whether the layout jumps around unexpectedly. This guide covers what actually moves the needle on LCP, INP and CLS in 2026.",
    sections: [
      "The Three Core Web Vitals in 2026",
      "How to Measure Your Core Web Vitals",
      "How to Fix LCP: The Biggest Impact Changes",
      "How to Fix INP: Making Your Site Responsive",
      "How to Fix CLS: Stopping Layout Shifts",
      "Real Results: Before and After",
    ],
  },
  {
    slug: "ai-content-seo-guide",
    title: "AI Content and SEO: Creating Content That Ranks in 2026",
    desc: "Use AI for SEO content without triggering quality filters. E-E-A-T strategies for AI-assisted articles.",
    h1: "AI Content and SEO: Creating Rankable Content in 2026",
    date: "2026-03-25",
    updated: "2026-04-01",
    author: "Smart SEO Tools Team",
    cat: "Content Strategy",
    rt: "11",
    intro:
      "Google doesn't penalise content just because AI helped create it. What Google penalises is low-quality content — whether a human or a machine wrote it. This guide covers techniques for AI-assisted content that passes Google's quality filters and earns E-E-A-T signals.",
    sections: [
      "What Google Actually Says About AI Content",
      "Why Most AI Content Fails in Search",
      "The E-E-A-T Framework for AI Content",
      "My 5-Step AI Content Workflow",
      "Content Structures That Rank Well With AI Assistance",
    ],
  },
];

// Static route manifest: every entry produces one prerendered .html file.
// `content` is the static HTML injected into <div id="root">...</div>
// so the initial response already contains semantic H1, paragraphs, and nav
// links that Googlebot and other crawlers can read without executing JS.
const nav = `
<header class="ssg-header">
  <a href="/" class="ssg-logo">Smart SEO Tools</a>
  <nav>
    <a href="/seo-audit">SEO Audit</a>
    <a href="/blog-writer">Blog Writer</a>
    <a href="/blog">Blog</a>
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
  </nav>
</header>`;

const footer = `
<footer class="ssg-footer">
  <p><strong>Smart SEO Tools</strong> — AI-powered SEO tools built by practitioners. Free audits and content optimisation for everyone.</p>
  <nav>
    <a href="/seo-audit">SEO Audit</a> ·
    <a href="/blog-writer">Blog Writer</a> ·
    <a href="/blog">Blog</a> ·
    <a href="/about">About</a> ·
    <a href="/contact">Contact</a> ·
    <a href="/privacy-policy">Privacy</a> ·
    <a href="/terms">Terms</a>
  </nav>
  <p>&copy; 2026 Smart SEO Tools</p>
</footer>`;

function wrap(main) {
  return `${nav}<main>${main}</main>${footer}`;
}

export const ROUTES = [
  {
    path: "/",
    file: "index.html",
    title: "Smart SEO Tools - Free AI SEO Audit & Blog Writer",
    description:
      "Free AI-powered SEO audit tool. Check technical SEO, on-page optimization, content quality, and Core Web Vitals. Get a prioritized fix list in 30 seconds.",
    h1: "Free AI-Powered Website SEO Audit",
    content: wrap(`
<section>
<h1>Free AI-Powered Website SEO Audit</h1>
<p>Enter any URL to get a comprehensive SEO analysis with actionable recommendations. Smart SEO Tools checks 50+ ranking factors in under 30 seconds — technical SEO, on-page optimisation, content quality, Core Web Vitals, and E-E-A-T signals.</p>
<p><a href="/seo-audit">Run a free SEO audit &rarr;</a> &nbsp; <a href="/blog-writer">Try the AI blog writer &rarr;</a></p>
</section>
<section>
<h2>What We Analyze</h2>
<p>Every audit covers technical SEO (HTTPS, crawlability, sitemaps, canonical tags, structured data), on-page SEO (titles, meta descriptions, heading hierarchy, image optimisation), content quality (depth, E-E-A-T signals, helpfulness), and Core Web Vitals (LCP, INP, CLS). Issues are prioritised as P0 (critical), P1 (important) or P2 (optimisation) so you know what to fix first.</p>
</section>
<section>
<h2>Our Free SEO Tools</h2>
<p><strong><a href="/seo-audit">SEO Audit</a></strong> — comprehensive site analysis with prioritised fix list. <strong><a href="/blog-writer">AI Blog Writer</a></strong> — generate SEO-optimised posts with proper headings, keyword placement, and FAQ sections. <strong><a href="/blog">Blog</a></strong> — practical guides on technical SEO, content strategy, and algorithm updates.</p>
</section>
<section>
<h2>Latest from Our Blog</h2>
<ul>
  <li><a href="/blog/how-to-do-seo-audit-2026">How to Do an SEO Audit in 2026: Step-by-Step Guide</a></li>
  <li><a href="/blog/core-web-vitals-guide">Core Web Vitals 2026: How to Improve LCP, INP &amp; CLS</a></li>
  <li><a href="/blog/ai-content-seo-guide">AI Content and SEO: Creating Content That Ranks in 2026</a></li>
</ul>
</section>`),
  },
  {
    path: "/seo-audit",
    file: "seo-audit.html",
    title: "Free SEO Audit Tool - Website SEO Checker | SmartSEO",
    description:
      "Run a free SEO audit on any website. Check technical SEO, on-page, content, mobile. Get prioritized fixes.",
    h1: "Free SEO Audit Tool",
    content: wrap(`
<section>
<h1>Free SEO Audit Tool</h1>
<p>Run a free SEO audit on any website. Smart SEO Tools analyses 50+ ranking factors including technical SEO, on-page optimisation, content quality, Core Web Vitals, mobile experience, and E-E-A-T signals. You get a prioritised fix list (P0 / P1 / P2) within 30 seconds.</p>
<h2>What the audit checks</h2>
<ul>
<li>Technical SEO: HTTPS, crawlability, robots.txt, XML sitemap, canonical tags, hreflang, structured data.</li>
<li>On-Page: title tags, meta descriptions, H1-H6 hierarchy, image alt text, internal linking.</li>
<li>Content: word count, topical depth, freshness, E-E-A-T markers, helpful content alignment.</li>
<li>Core Web Vitals: Largest Contentful Paint, Interaction to Next Paint, Cumulative Layout Shift.</li>
<li>Compliance: privacy policy, terms, about, contact pages (required for AdSense and trust signals).</li>
</ul>
<p><a href="/blog/how-to-do-seo-audit-2026">Read the full 2026 SEO audit guide &rarr;</a></p>
</section>`),
  },
  {
    path: "/blog-writer",
    file: "blog-writer.html",
    title: "AI SEO Blog Writer - Generate Optimized Posts | SmartSEO",
    description:
      "Create SEO-optimized blog posts with AI. Proper headings, meta descriptions, FAQ sections. Free.",
    h1: "AI SEO Blog Writer",
    content: wrap(`
<section>
<h1>AI SEO Blog Writer</h1>
<p>Generate SEO-optimised blog posts with proper heading hierarchy, keyword placement, meta descriptions, and FAQ sections. The output follows Google's helpful content guidelines and includes E-E-A-T scaffolding so your content is publish-ready after a short editorial pass.</p>
<h2>What it produces</h2>
<ul>
<li>SEO-structured outline with H1, H2, H3 hierarchy.</li>
<li>Full article draft, 1,000–2,000 words, with keyword placement and internal linking hints.</li>
<li>Meta title and meta description under recommended character limits.</li>
<li>FAQ section with schema-ready question-and-answer pairs.</li>
<li>Image prompts for matching hero and section illustrations.</li>
</ul>
<p><a href="/blog/ai-content-seo-guide">Read our guide on creating AI content that ranks &rarr;</a></p>
</section>`),
  },
  {
    path: "/blog",
    file: "blog.html",
    title: "SEO Blog - Tips & Guides for Rankings | SmartSEO",
    description:
      "Practical SEO guides. Technical SEO, content, Core Web Vitals, algorithm updates. Updated weekly.",
    h1: "SEO Blog: Tips, Guides & Strategies",
    content: wrap(`
<section>
<h1>SEO Blog: Tips, Guides &amp; Strategies</h1>
<p>Practical SEO guides from real audit data. Updated regularly.</p>
<ul>
${BLOG_POSTS.map(
  (p) => `<li>
<h2><a href="/blog/${p.slug}">${p.title}</a></h2>
<p>${p.desc}</p>
<p><small>${p.cat} · Published ${p.date} · Updated ${p.updated} · ${p.rt} min read · By ${p.author}</small></p>
</li>`
).join("\n")}
</ul>
</section>`),
  },
  ...BLOG_POSTS.map((p) => ({
    path: `/blog/${p.slug}`,
    file: `blog/${p.slug}.html`,
    title: p.title,
    description: p.desc,
    h1: p.h1,
    content: wrap(`
<article>
<nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/blog">Blog</a> / <span>${p.title.split(":")[0]}</span></nav>
<p><small>${p.cat}</small></p>
<h1>${p.h1}</h1>
<p><small>By ${p.author} · Published ${p.date} · Updated ${p.updated} · ${p.rt} min read</small></p>
<p>${p.intro}</p>
${p.sections.map((s) => `<h2>${s}</h2><p>See full article for detail on this section. Loading interactive version&hellip;</p>`).join("\n")}
<p><a href="/seo-audit">Run a free SEO audit on your site &rarr;</a></p>
</article>`),
  })),
  {
    path: "/about",
    file: "about.html",
    title: "About Smart SEO Tools - Mission & Team",
    description:
      "Built by SEO practitioners for accessible analysis. Our mission to democratize SEO with AI tools.",
    h1: "About Smart SEO Tools",
    content: wrap(`
<section>
<h1>About Smart SEO Tools</h1>
<p>Smart SEO Tools was created by SEO practitioners who spent years running manual audits and realised AI could make the process dramatically better. We built the tools we wished existed: fast, accurate, free, and focused on actionable results.</p>
<h2>Our Mission</h2>
<p>Every website owner deserves professional-grade SEO analysis regardless of budget. We democratise SEO with free AI tools that deliver insights agencies charge thousands for.</p>
<h2>What We Do</h2>
<p>Our <a href="/seo-audit">SEO audit tool</a> checks 50+ factors with prioritised fixes. Our <a href="/blog-writer">AI blog writer</a> generates E-E-A-T-aligned content. Our <a href="/blog">blog</a> publishes practical guides from real audit data.</p>
<h2>Our Approach</h2>
<p>Three principles: follow Google's published guidelines, validate against real ranking data, and prioritise actionable steps. We combine automated technical checks with AI content analysis using Google's E-E-A-T framework and the latest Core Web Vitals standards.</p>
<h2>Contact</h2>
<p>Questions? Visit our <a href="/contact">contact page</a> — we respond within 24 hours.</p>
</section>`),
  },
  {
    path: "/contact",
    file: "contact.html",
    title: "Contact Us | Smart SEO Tools",
    description:
      "Questions about Smart SEO Tools? We respond within 24 hours.",
    h1: "Contact Us",
    content: wrap(`
<section>
<h1>Contact Us</h1>
<p>We respond to all inquiries within 24 hours.</p>
<h2>Email</h2>
<p>General inquiries: <strong>hello@webchecker.one</strong><br>Business &amp; API partnerships: <strong>partners@webchecker.one</strong></p>
<h2>Send a Message</h2>
<p>Use the contact form to send your name, email and message. We respond within one business day.</p>
</section>`),
  },
  {
    path: "/privacy-policy",
    file: "privacy-policy.html",
    title: "Privacy Policy | Smart SEO Tools",
    description:
      "How we collect, use, protect your data. Covers cookies, analytics, AdSense, your rights.",
    h1: "Privacy Policy",
    content: wrap(`
<section>
<h1>Privacy Policy</h1>
<p><small>Last updated: April 3, 2026</small></p>
<h2>Introduction</h2>
<p>Smart SEO Tools is committed to protecting your privacy. This policy explains how we handle your data on www.webchecker.one.</p>
<h2>Data We Collect</h2>
<p>URLs submitted for analysis, contact form data (name, email, message), and standard analytics (browser, pages visited, anonymised IP via Google Analytics).</p>
<h2>Cookies</h2>
<p>Essential cookies for functionality, Google Analytics for usage patterns, and Google AdSense for advertising. Control via your browser settings.</p>
<h2>Third Parties</h2>
<p>Google Analytics, Google AdSense, and our AI providers — each under their own privacy policies.</p>
<h2>Data Retention</h2>
<p>Audit data is processed in real-time and not stored. Contact submissions kept up to 12 months.</p>
<h2>Your Rights</h2>
<p>You may access, correct, delete your data, or opt out. Email hello@webchecker.one or visit our <a href="/contact">contact page</a>.</p>
</section>`),
  },
  {
    path: "/terms",
    file: "terms.html",
    title: "Terms of Service | Smart SEO Tools",
    description:
      "Terms for using Smart SEO Tools. Rights, obligations, conditions.",
    h1: "Terms of Service",
    content: wrap(`
<section>
<h1>Terms of Service</h1>
<p><small>Last updated: April 3, 2026</small></p>
<h2>Acceptance</h2>
<p>By using Smart SEO Tools you agree to these terms.</p>
<h2>Services</h2>
<p>Free AI-powered SEO audit and blog generation, provided "as is" for informational purposes.</p>
<h2>Use</h2>
<p>Use only for lawful purposes. Do not harm others, overload our services, or misrepresent results as professional consulting.</p>
<h2>Intellectual Property</h2>
<p>Website design is protected. Blog writer output is yours to use.</p>
<h2>Disclaimer</h2>
<p>No warranties. We do not guarantee specific ranking improvements.</p>
<h2>Contact</h2>
<p>Email hello@webchecker.one or visit our <a href="/contact">contact page</a>.</p>
</section>`),
  },
];
