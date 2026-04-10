# InstaSaver

Free online Instagram video downloader — `instasaver.click`.
Optimized for SEO and Google AdSense approval. 30 original blog articles, full legal/compliance pages, JSON-LD structured data, sitemap, robots.txt.

## Structure

```
instasaver-site/
├── api/
│   └── instagram/
│       └── parse.js          Vercel Serverless Function (Instagram parser)
├── index.html                Homepage with downloader tool UI
├── about.html                About page
├── contact.html              Contact info
├── privacy.html              Privacy Policy
├── terms.html                Terms of Service
├── dmca.html                 DMCA takedown policy
├── disclaimer.html           Legal disclaimer
├── 404.html                  Custom 404
├── sitemap.xml               38 URLs
├── robots.txt
├── ads.txt                   AdSense/AdMob publisher verification
├── app-ads.txt               AdMob app-ads verification
├── vercel.json               Vercel routing & headers config
├── package.json              Project metadata
├── assets/
│   ├── css/style.css         Stylesheet (also inlined into every HTML)
│   ├── js/main.js            Frontend: URL validation + API call + result UI
│   └── img/favicon.svg
└── blog/
    ├── index.html            Blog listing
    └── *.html                30 original SEO articles
```

## Deploy to Vercel

### Step 1: Push to GitHub

```bash
cd instasaver-site
git init
git add .
git commit -m "Initial commit"
git remote add origin git@github.com:YOUR_USERNAME/instasaver.git
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Framework Preset: select **Other**
4. Build Command: leave empty
5. Output Directory: leave empty (root `.`)
6. Click **Deploy**

### Step 3: Add custom domain

1. In Vercel dashboard → Settings → Domains
2. Add `instasaver.click`
3. Set nameservers at your registrar to `ns1.vercel-dns.com` and `ns2.vercel-dns.com`

### Step 4 (Optional): Add Meta App Token for oEmbed fallback

1. Create a Facebook Developer App at https://developers.facebook.com
2. Generate a client-credentials token
3. In Vercel dashboard → Settings → Environment Variables
4. Add: `META_APP_TOKEN` = your token
5. Redeploy

## How the download API works

```
User pastes URL → Frontend validates → POST /api/instagram/parse
→ Serverless function fetches Instagram page with browser headers
→ Extracts og:video / og:image / embedded JSON media URLs
→ Returns JSON { success: true, data: { type, username, caption, thumbnail, media[] } }
→ Frontend renders download buttons with direct CDN links
```

Rate limit: 10 requests per IP per 5 minutes (in-memory).

## Important notes

- Instagram aggressively blocks server-side requests. The basic HTML-parsing approach works for many public posts but may fail under heavy load or if Instagram changes their page structure.
- If the basic approach stops working, consider upgrading to a paid Instagram API service (RapidAPI has several) or adding proxy rotation.
- The function runs on Vercel's edge network, so cold starts are fast (~200ms).

## SEO / AdSense compliance checklist

- [x] Every page: unique title (<=60 chars), meta description (120-160 chars), canonical URL
- [x] Single H1 per page, proper H2/H3 hierarchy
- [x] JSON-LD structured data: WebSite, WebApplication, Article, FAQPage, BreadcrumbList, Blog
- [x] OG + Twitter cards
- [x] Full legal pages: Privacy, Terms, DMCA, Disclaimer
- [x] "Not affiliated with Instagram/Meta" disclaimer on every page
- [x] "Personal backup use only" positioning
- [x] 30 original blog articles (~20,000 words total) with E-E-A-T signals
- [x] Sitemap + robots.txt
- [x] Mobile-responsive CSS (breakpoints at 480/640/800/900px)
- [x] Fast first paint (inlined critical CSS)

## License

Source code: MIT. Blog content: (c) 2026 InstaSaver. All rights reserved.

## Contact

contact@instasaver.click
