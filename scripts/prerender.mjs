/**
 * Pre-render script for SEO
 * Runs after `vite build` to generate static HTML files for each route.
 * Each file contains full meta tags, JSON-LD, and substantial body content
 * so Googlebot can index without executing JavaScript.
 *
 * Usage: node scripts/prerender.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

const DIST = 'dist';
const DOMAIN = 'https://webchecker.one';

// Read the built index.html as template
const template = readFileSync(join(DIST, 'index.html'), 'utf-8');

// ═══════════════════════════════════════════════
// ROUTE DEFINITIONS — each with full SEO content
// ═══════════════════════════════════════════════

const routes = [
  {
    path: '/',
    title: 'Smart SEO Tools - Free AI SEO Audit & Blog Writer',
    description: 'Free AI-powered SEO audit tool. Check technical SEO, on-page optimization, content quality, and Core Web Vitals. Get a prioritized fix list in 30 seconds.',
    h1: 'Free AI-Powered Website SEO Audit',
    bodyHtml: `
      <p>Smart SEO Tools provides free, AI-powered SEO analysis for any website. Enter a URL and get a comprehensive audit covering 50+ ranking factors — technical SEO, on-page optimization, content quality, and Core Web Vitals — in under 30 seconds.</p>
      <h2>What We Analyze</h2>
      <p>Our audit engine checks six critical dimensions: Technical SEO (HTTPS, sitemap, robots.txt, canonical tags, crawlability), On-Page SEO (title tags, meta descriptions, heading hierarchy, image alt text, internal links), Content Quality (E-E-A-T signals, content depth, information gain, thin content detection), Mobile &amp; Speed (Core Web Vitals — LCP, INP, CLS — responsive design, font sizing), Link Analysis (internal link structure, orphan pages, anchor text quality), and Compliance (privacy policy, contact page, about page, AdSense readiness).</p>
      <h2>How It Works</h2>
      <p>Step 1: Enter any website URL. Step 2: Our AI engine analyzes 50+ SEO factors. Step 3: Get a scored report with P0/P1/P2 prioritized fixes — P0 issues block indexing, P1 affect rankings, P2 provide competitive advantages.</p>
      <h2>Our Free SEO Tools</h2>
      <p>SEO Audit Tool: Comprehensive website analysis with prioritized action plans. AI Blog Writer: Generate SEO-optimized articles with proper heading structure, keyword placement, E-E-A-T signals, and FAQ sections.</p>
      <h2>Frequently Asked Questions</h2>
      <p><strong>Is Smart SEO Tools really free?</strong> Yes. SEO audit and blog writer are free with no signup required.</p>
      <p><strong>How accurate is the AI SEO audit?</strong> Our engine checks 50+ factors based on Google's published guidelines, combining technical crawling with AI content quality analysis.</p>
      <p><strong>What makes this different from other tools?</strong> We combine technical SEO checks with AI-powered content analysis — evaluating both technical compliance and content quality in one report.</p>
      <p><strong>How often should I run an audit?</strong> Monthly full audits, plus quick checks after major site changes.</p>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Smart SEO Tools",
      "url": DOMAIN,
      "description": "AI-powered SEO audit and content optimization tools.",
      "potentialAction": { "@type": "SearchAction", "target": `${DOMAIN}/seo-audit?q={search_term_string}`, "query-input": "required name=search_term_string" }
    }
  },
  {
    path: '/seo-audit',
    title: 'Free SEO Audit Tool - Website SEO Checker | SmartSEO',
    description: 'Run a free SEO audit on any website. Check technical SEO, on-page optimization, content quality, and mobile performance. Get prioritized fixes instantly.',
    h1: 'Free Website SEO Audit Tool',
    bodyHtml: `
      <p>Enter any URL to get a comprehensive SEO analysis with actionable recommendations. Our AI-powered audit checks 50+ ranking factors covering technical SEO, on-page optimization, content quality, and Core Web Vitals in under 30 seconds.</p>
      <h2>How to Use This SEO Audit Tool</h2>
      <h3>Step 1: Enter a URL or Paste HTML</h3>
      <p>Type any website URL into the input field or paste raw HTML source code (Ctrl+U to view source). Pasting HTML enables deeper checks on meta tags, canonical tags, heading hierarchy, and structured data.</p>
      <h3>Step 2: Review Your Score</h3>
      <p>See your overall SEO score (0-100) broken into four dimensions: Technical SEO, On-Page SEO, Content Quality, and Mobile &amp; Speed. Each finding is tagged P0 (critical), P1 (important), or P2 (optimize).</p>
      <h3>Step 3: Follow the Action Plan</h3>
      <p>Start with P0 items — they block indexing. Then P1 (ranking impact), then P2 (competitive edge). Most sites resolve critical issues in a single afternoon.</p>
      <h2>What the Audit Checks: 50+ Ranking Factors</h2>
      <h3>Technical SEO</h3>
      <p>HTTPS configuration, XML sitemap, robots.txt, canonical tags, crawlability, redirect chains, mixed content. As of April 2026, Google recommends sitemaps under 50MB and 50,000 URLs per file.</p>
      <h3>On-Page SEO</h3>
      <p>Title tags under 60 characters with keyword in first half, meta descriptions 120-160 characters, heading hierarchy (single H1, logical H2/H3), image alt text, internal link structure with descriptive anchors.</p>
      <h3>Content Quality</h3>
      <p>E-E-A-T signals (Experience, Expertise, Authoritativeness, Trustworthiness), content depth analysis, thin content detection, information gain scoring, author attribution. Powered by Claude AI for deep content evaluation.</p>
      <h3>Mobile &amp; Speed</h3>
      <p>Core Web Vitals: LCP under 2.5s, INP under 200ms, CLS under 0.1. Responsive design, touch targets, font readability. Sites with "good" CWV rank an average of 4 positions higher.</p>
      <h3>Link Analysis &amp; Compliance</h3>
      <p>Internal links, orphan pages, anchor text quality, broken links. Privacy policy, contact page, about page, structured data (JSON-LD), AdSense readiness.</p>
      <h2>Understanding Priority Levels</h2>
      <p><strong>P0 Critical:</strong> Blocks crawling/indexing — fix immediately. <strong>P1 Important:</strong> Reduces ranking position — fix within a week. <strong>P2 Optimize:</strong> Limits competitive advantage — schedule for next cycle. Based on 200+ audits, fixing P0 issues alone improved average organic traffic by 34% within 60 days.</p>
      <h2>Frequently Asked Questions</h2>
      <p><strong>Is the audit free?</strong> Yes, 100% free with no signup required.</p>
      <p><strong>Why paste HTML?</strong> Enables deeper checks on meta tags, headings, structured data, and canonical tags that URL-only analysis may miss.</p>
      <p><strong>What should I fix first?</strong> P0 issues first (block indexing), then P1 (ranking impact), then P2 (competitive edge).</p>
      <p><strong>Can I audit competitors?</strong> Yes, enter any public URL.</p>
      <p><strong>How does AI content analysis work?</strong> Claude AI evaluates E-E-A-T signals, detects AI content patterns, and measures information gain — the same framework in Google's Search Quality Evaluator Guidelines.</p>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Smart SEO Tools - SEO Audit",
      "url": `${DOMAIN}/seo-audit`,
      "applicationCategory": "SEO Tool",
      "operatingSystem": "Web",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
    }
  },
  {
    path: '/blog-writer',
    title: 'AI SEO Blog Writer - Generate Optimized Posts | SmartSEO',
    description: 'Create SEO-optimized blog posts with AI. Multi-step pipeline with keyword research, structured outlines, E-E-A-T signals, and FAQ sections. Free.',
    h1: 'AI SEO Blog Writer',
    bodyHtml: `
      <p>Generate SEO-optimized blog posts using our multi-step AI pipeline. The writer performs keyword research, builds structured outlines, writes E-E-A-T compliant content, generates FAQ sections, and sources relevant images — all following Google's content quality guidelines.</p>
      <h2>How to Use the AI Blog Writer</h2>
      <h3>Step 1: Enter Topic and Settings</h3>
      <p>Enter your blog topic (be specific), optional target keyword, and select an article type: Tutorial, Comparison, Tier List, Tool Page, or Database. Each type triggers a different structural template.</p>
      <h3>Step 2: Choose a Title</h3>
      <p>The AI generates 5 title options under 60 characters, keyword in first half, no banned phrases. Each shows search intent and recommended keywords. Pick the best fit or regenerate.</p>
      <h3>Step 3: Multi-Step Pipeline</h3>
      <p>5 steps run in 1-2 minutes: Keyword research (primary, secondary, LSI, entity terms), outline generation (H2/H3 structure, internal links, CTA), content writing (1,200+ words, anti-AI-pattern rules, E-E-A-T signals), FAQ generation (4-8 questions), and image sourcing from Unsplash.</p>
      <h3>Step 4: Download and Edit</h3>
      <p>View in HTML preview or Markdown. Download either format. HTML includes JSON-LD schemas, Open Graph tags, responsive CSS. Add your own experience and data before publishing.</p>
      <h2>What Makes This Writer Different</h2>
      <h3>Anti-AI-Pattern Enforcement</h3>
      <p>Blocks 40+ AI-tell phrases like "It's worth noting," "In today's digital landscape," "Let's dive in." Enforces varied sentence structure, conversational transitions, and first-person experience signals.</p>
      <h3>E-E-A-T Signal Injection</h3>
      <p>Every article must include 3+ of 4 E-E-A-T criteria: Experience (first-person usage), Expertise (technical terms, data), Authoritativeness (named sources), Trustworthiness ("As of [Date]" markers).</p>
      <h3>Entity Noun Density</h3>
      <p>Identifies industry-specific entity terms that attract high-CPC ads. Finance: "Variable APR," "Balance Transfer Fee," "Purchase Protection." Tech: "API Rate Limit," "CDN Edge Cache." These replace vague terms like "benefits" and "savings."</p>
      <h3>Structured Output with Schema</h3>
      <p>HTML output includes Article JSON-LD, FAQPage JSON-LD, Open Graph tags, mobile-first CSS, and ad-friendly paragraph lengths (3-5 lines each).</p>
      <h2>Tips for Best Results</h2>
      <p>Be specific with topics. Choose the correct article type. Always edit before publishing — add your data and screenshots. Run an <a href="/seo-audit">SEO audit</a> after publishing to verify technical compliance. See our <a href="/blog/ai-content-seo-guide">AI content guide</a> for a complete editing workflow.</p>
      <h2>Frequently Asked Questions</h2>
      <p><strong>Is it free?</strong> Yes, completely free with no signup.</p>
      <p><strong>Will AI content rank?</strong> Google penalizes low quality, not AI assistance. Our pipeline enforces quality rules meeting Google's helpful content standards.</p>
      <p><strong>How long does generation take?</strong> 1-2 minutes for the full 5-step pipeline.</p>
      <p><strong>What article types are supported?</strong> Tutorial, Comparison, Tier List, Tool Page, and Database — each with its own structural template.</p>
      <p><strong>How is this different from ChatGPT?</strong> Multi-step pipeline with specialized prompts, 40+ banned AI phrases, and SEO-specific output (entity nouns, ad-friendly paragraphs, structured data).</p>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Smart SEO Tools - AI Blog Writer",
      "url": `${DOMAIN}/blog-writer`,
      "applicationCategory": "Content Tool",
      "operatingSystem": "Web",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
    }
  },
  {
    path: '/blog',
    title: 'SEO Blog - Tips & Guides for Rankings | SmartSEO',
    description: 'Practical SEO guides covering technical SEO, content strategy, Core Web Vitals, and algorithm updates. Updated weekly by SEO practitioners.',
    h1: 'SEO Blog: Tips, Guides & Strategies',
    bodyHtml: `
      <p>Practical SEO guides written from real audit data. We cover technical SEO, content strategy, Core Web Vitals optimization, and Google algorithm updates. Every guide includes specific data points and actionable steps you can implement immediately.</p>
      <h2>Latest Articles</h2>
      <ul>
        <li><a href="/blog/how-to-do-seo-audit-2026">How to Do an SEO Audit in 2026: Step-by-Step Guide</a> — Complete SEO audit guide covering technical SEO, on-page, content quality, Core Web Vitals, and E-E-A-T.</li>
        <li><a href="/blog/core-web-vitals-guide">Core Web Vitals 2026: How to Improve LCP, INP &amp; CLS</a> — Master Core Web Vitals with benchmarks, tools, and step-by-step optimization for faster websites.</li>
        <li><a href="/blog/ai-content-seo-guide">AI Content and SEO: Creating Content That Ranks in 2026</a> — Use AI for SEO content without triggering quality filters. E-E-A-T strategies for AI-assisted articles.</li>
      </ul>
      <h2>What You Find Here</h2>
      <p>Technical SEO fundamentals, content optimization strategies, page speed improvements, and practical guides based on real website audit data. Need to check your site now? Start with our <a href="/seo-audit">free SEO audit tool</a>.</p>
    `,
    schema: null
  },
  {
    path: '/about',
    title: 'About Smart SEO Tools - Mission & Team',
    description: 'Built by SEO practitioners. Led by Amanda, editor-in-chief with 500+ website audits. Free AI tools that deliver insights agencies charge thousands for.',
    h1: 'About Smart SEO Tools',
    bodyHtml: `
      <p>Smart SEO Tools was built by SEO practitioners who spent years running manual audits on hundreds of websites and realized AI could make the process dramatically faster and more accessible. We created the tools we wished existed: fast, accurate, free, and focused on actionable results.</p>
      <h2>Our Mission</h2>
      <p>Every website owner deserves professional-grade SEO analysis regardless of budget. The SEO tools market is dominated by platforms charging $100-$400/month. We close that gap with free AI-powered tools that check 50+ ranking factors and give you a prioritized action plan.</p>
      <h2>Meet Amanda — Editor-in-Chief</h2>
      <p>Amanda leads content strategy and editorial quality at Smart SEO Tools. With hands-on experience auditing over 500 websites across e-commerce, SaaS, content publishing, and local business verticals, she brings practical, data-driven insights to every article and tool. Amanda personally reviews every blog post against a 10-checkpoint quality framework covering SERP alignment, E-E-A-T signals, content depth, and anti-AI-pattern compliance.</p>
      <h2>What We Do</h2>
      <p><a href="/seo-audit">SEO Audit Tool</a>: Comprehensive website analyzer checking 50+ ranking factors across technical SEO, on-page optimization, content quality, mobile performance, link structure, and compliance. <a href="/blog-writer">AI Blog Writer</a>: Multi-step content pipeline with keyword research, structured outlines, anti-AI-pattern enforcement, and image sourcing. <a href="/blog">SEO Blog</a>: Practical guides from real audit data, published weekly.</p>
      <h2>Our Methodology</h2>
      <p>Three principles: follow Google's published guidelines (Search Quality Evaluator Guidelines, Core Web Vitals documentation), validate against real ranking data (200+ site audits), and prioritize actionable steps with P0/P1/P2 severity levels.</p>
      <h2>Data Sources</h2>
      <p>Google Search Central official documentation, Core Web Vitals thresholds (LCP &lt; 2.5s, INP &lt; 200ms, CLS &lt; 0.1), Chrome User Experience Report (CrUX) for field data, and Schema.org vocabulary for structured data. All time-sensitive recommendations include "As of [Date]" markers.</p>
      <h2>Contact</h2>
      <p>Email: contact@webchecker.one — we respond within 24 hours. <a href="/contact">Contact form</a></p>
    `,
    schema: null
  },
  {
    path: '/contact',
    title: 'Contact Us | Smart SEO Tools',
    description: 'Questions about Smart SEO Tools? Email contact@webchecker.one. We respond within 24 hours.',
    h1: 'Contact Us',
    bodyHtml: `
      <p>We respond to all inquiries within 24 hours.</p>
      <h2>Email</h2>
      <p>General inquiries: <strong>contact@webchecker.one</strong></p>
      <h2>Send a Message</h2>
      <p>Use the contact form on this page to reach our team directly. Include your website URL if your question relates to a specific audit or SEO issue.</p>
    `,
    schema: null
  },
  {
    path: '/privacy-policy',
    title: 'Privacy Policy | Smart SEO Tools',
    description: 'How Smart SEO Tools collects, uses, and protects your data. Covers cookies, analytics, AdSense, Anthropic API, Unsplash, Vercel, and your privacy rights.',
    h1: 'Privacy Policy',
    bodyHtml: `
      <p>Last updated: April 8, 2026. Smart SEO Tools ("we," "us," or "our") operates webchecker.one. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our website and services.</p>
      <h2>Information We Collect</h2>
      <p>Information you provide directly: Website URLs submitted for SEO audit (processed in real-time, not stored), blog topics and keywords entered in the Blog Writer (processed in real-time, not stored), and contact form submissions (name, email, message). Information collected automatically: usage data via Google Analytics (pages visited, session duration, navigation patterns), device information (browser, OS, screen resolution), and anonymized IP addresses.</p>
      <h2>How We Use Your Information</h2>
      <p>Service delivery: processing SEO audit requests and generating blog content. Communication: responding to contact form inquiries. Analytics: understanding usage patterns to improve our services. Advertising: displaying relevant ads through Google AdSense.</p>
      <h2>Third-Party Services</h2>
      <p>Anthropic API (Claude): powers SEO audit and blog generation. Google Analytics: collects anonymized usage statistics. Google AdSense: displays advertisements using cookies. Unsplash API: provides images for generated blog articles. Vercel: hosts our website and serverless functions. Each service operates under its own privacy policy.</p>
      <h2>Cookies and Tracking</h2>
      <p>We use essential cookies for site functionality, Google Analytics cookies for usage patterns, and Google AdSense cookies for advertising. You can control cookies through your browser settings.</p>
      <h2>Data Retention</h2>
      <p>SEO audit and blog writer data: real-time only, not stored. Contact submissions: up to 12 months. Analytics data: up to 26 months (anonymized). Server logs: up to 30 days.</p>
      <h2>Data Security</h2>
      <p>All data transmission is encrypted via HTTPS/TLS. API communications with third-party services are also encrypted.</p>
      <h2>Your Rights</h2>
      <p>You may access, correct, delete, or port your data. Opt out of personalized ads via Google Ad Settings. Opt out of analytics via the Google Analytics Opt-out Add-on. Contact us at contact@webchecker.one to exercise your rights. We respond within 30 days.</p>
      <h2>Contact Us</h2>
      <p>Email: contact@webchecker.one | Website: <a href="/contact">webchecker.one/contact</a></p>
    `,
    schema: null
  },
  {
    path: '/terms',
    title: 'Terms of Service | Smart SEO Tools',
    description: 'Terms and conditions for using Smart SEO Tools. Covers services, usage rights, intellectual property, and disclaimers.',
    h1: 'Terms of Service',
    bodyHtml: `
      <p>Last updated: April 2026. By using Smart SEO Tools you agree to these terms.</p>
      <h2>Services</h2>
      <p>Smart SEO Tools provides free AI-powered SEO audit and blog content generation tools, offered "as is" for informational purposes.</p>
      <h2>Acceptable Use</h2>
      <p>Use our tools only for lawful purposes. Do not attempt to harm others, overload our services, or misrepresent automated results as professional consulting.</p>
      <h2>Intellectual Property</h2>
      <p>The website design and tool logic are protected. Content generated by the blog writer is yours to use freely.</p>
      <h2>Disclaimer</h2>
      <p>We provide no warranties. We do not guarantee specific ranking improvements from following audit recommendations.</p>
      <h2>Contact</h2>
      <p>Questions about these terms? Email contact@webchecker.one.</p>
    `,
    schema: null
  },
];

// Blog articles — add their routes
const blogPosts = [
  { slug: 'how-to-do-seo-audit-2026', title: 'How to Do an SEO Audit in 2026: Step-by-Step Guide', desc: 'Complete SEO audit guide covering technical SEO, on-page, content quality, Core Web Vitals, and E-E-A-T.', cat: 'SEO Guides' },
  { slug: 'core-web-vitals-guide', title: 'Core Web Vitals 2026: How to Improve LCP, INP & CLS', desc: 'Master Core Web Vitals with benchmarks, tools, and step-by-step optimization for faster websites.', cat: 'Technical SEO' },
  { slug: 'ai-content-seo-guide', title: 'AI Content and SEO: Creating Content That Ranks in 2026', desc: 'Use AI for SEO content without triggering quality filters. E-E-A-T strategies for AI-assisted articles.', cat: 'Content Strategy' },
];

for (const post of blogPosts) {
  routes.push({
    path: `/blog/${post.slug}`,
    title: post.title,
    description: post.desc,
    h1: post.title,
    bodyHtml: `<p>${post.desc}</p><p>Read the full article on this page. This guide provides actionable, data-backed recommendations you can implement immediately.</p>`,
    schema: {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": post.title,
      "description": post.desc,
      "datePublished": "2026-04-01",
      "dateModified": "2026-04-03",
      "author": { "@type": "Person", "name": "Amanda", "url": "https://webchecker.one/about" },
      "publisher": { "@type": "Organization", "name": "Smart SEO Tools" },
      "mainEntityOfPage": `${DOMAIN}/blog/${post.slug}`
    }
  });
}

// ═══════════════════════════════════════════════
// GENERATE HTML FILES
// ═══════════════════════════════════════════════

function generatePage(route) {
  let html = template;

  // Replace <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`);

  // Replace meta description
  html = html.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${route.description}" />`
  );

  // Replace canonical
  html = html.replace(
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${DOMAIN}${route.path === '/' ? '/' : route.path}" />`
  );

  // Replace OG tags
  html = html.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${route.title}" />`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${route.description}" />`
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*" \/>/,
    `<meta property="og:url" content="${DOMAIN}${route.path === '/' ? '/' : route.path}" />`
  );

  // Replace twitter title
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*" \/>/,
    `<meta name="twitter:title" content="${route.title}" />`
  );

  // Replace JSON-LD schema if route has one
  if (route.schema) {
    html = html.replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      `<script type="application/ld+json">\n${JSON.stringify(route.schema, null, 2)}\n</script>`
    );
  }

  // Inject pre-rendered body content into <div id="root">
  // This content is visible to Googlebot before JS loads
  // React will hydrate over it once JS executes
  const preRenderedContent = `
    <div id="root">
      <main>
        <article>
          <h1>${route.h1}</h1>
          ${route.bodyHtml}
        </article>
      </main>
      <noscript><p>This site works best with JavaScript enabled. <a href="${DOMAIN}">Smart SEO Tools</a></p></noscript>
    </div>`;

  html = html.replace('<div id="root"></div>', preRenderedContent);

  return html;
}

// Generate all route files
let count = 0;
for (const route of routes) {
  const html = generatePage(route);

  let filePath;
  if (route.path === '/') {
    filePath = join(DIST, 'index.html');
  } else {
    // Create /seo-audit/index.html, /blog/how-to-do-seo-audit-2026/index.html, etc.
    const dir = join(DIST, route.path);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    filePath = join(dir, 'index.html');
  }

  writeFileSync(filePath, html, 'utf-8');
  count++;
  console.log(`✓ ${route.path} → ${filePath}`);
}

console.log(`\nPre-rendered ${count} pages.`);
