# Audio Range Cartographer — repair handoff

Work order: `audio-range-cartographer-repair-1`  
Repaired from verifier candidate: `2faae500dca335ce32db5e8718180ce3ba0611df`  
Verifier report: `.factory/verification.md`

## Release status

**PASS — deployed.** The P1 first-offline-reload defect is repaired with exact desktop and
390px mobile regression coverage. The production URL serves the deployed `dist/` asset hashes,
passes the cache-cleared offline reload, and has no browser console or page errors.

## What changed

- Replaced the manually maintained `public/sw.js` list with a generated `dist/sw.js`.
  The Vite build manifest is traversed for every hashed JS, CSS, imported chunk, and emitted
  asset; public files are discovered at build time too. The worker precaches that complete
  list before activation, has a unique `arc-…` cache per build, and deletes only stale
  Cartographer caches.
- Made cache matching resilient to response `Vary` headers with `ignoreVary: true`. This is
  important for a reliable Cache API hit after a browser HTTP-cache eviction.
- Excluded `staticwebapp.config.json` from the worker list: Azure Static Web Apps consumes
  that deployment configuration instead of serving it, so precaching it would atomically fail
  `cache.addAll()`. Regression coverage asserts it is never a cached public URL.
- Added the verifier's precise P1 browser test: it waits for worker control, asserts the
  generated hashed JS/CSS are in Cache API, clears only Chromium's HTTP cache via CDP,
  reasserts Cache API retention, turns the network off, and reloads successfully.
- Added an actionable update toast (`Reload`) when a new worker installs. Existing delete
  undo remains wired through the now explicit toast action callback.
- Added `public/staticwebapp.config.json` for the static deployment: immutable one-year
  cache headers for `/assets/*`; short revalidating headers for HTML, manifest, and worker;
  CSP, frame protection, permissions policy, COOP/CORP, nosniff, and manifest MIME type.
  Legal and offline page styles now live in same-origin CSS files so strict CSP does not
  block their appearance.
- Added explicit `npm run typecheck` and `npm run lint` quality gates. Linting also found a
  control-character regex rule issue; sanitization now uses the equivalent Unicode control
  category (`\p{Cc}`).

## How to run and deploy

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
/opt/fleet/lib/deploy-static.sh audio-range-cartographer dist
```

`npm run build` writes the required static PWA to `dist/`, with `dist/index.html` at its
root. The generated worker is intentionally a build artifact, not a checked-in source file.

## Verification evidence

- Clean `npm ci`: **179 packages audited, 0 vulnerabilities**.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test`: **5/5** passed.
- `npm run build`: passed; current initial app bundle is **41,297 B JS** (13,855 B gzip) and
  **16,327 B CSS** (4,512 B gzip), inside the 200 KB / 50 KB static-PWA budgets.
- Two successive production builds generated different `arc-…` worker cache versions; the
  generated `PRECACHE` contains the actual hashed `index-*.js` and `index-*.css` files.
- `npm run test:e2e`: **12/12** passed (Chromium desktop and iPhone-13 emulation at
  390 × 844). It covers the full editor/export workflow, keyboard movement, invalid and
  untrusted imports, licensing, axe serious/critical scans, responsive mobile, and the
  HTTP-cache-cleared offline reload described above.
- Factory `verify-url.sh` against an Azure Static Web Apps local preview: HTTP 200; no page
  or console errors; title, `lang=en`, one h1, main landmark, image alt text, and labelled
  buttons all present. Local network-idle load: **686 ms**.
- Azure Static Web Apps local preview response checks: hashed JS has
  `Cache-Control: public, max-age=31536000, immutable`; manifest is
  `application/manifest+json`; worker is short revalidating; CSP, `X-Frame-Options: DENY`,
  `Permissions-Policy`, COOP, and CORP are present.
- Lighthouse 13.4.1 mobile against that static preview: **99 performance, 100 accessibility,
  100 best practices, 100 SEO**; LCP **2.0 s**, CLS **0**, TBT **0 ms**.

## Privacy and product behavior

No project data leaves IndexedDB. There are no analytics, ads, third-party fonts, or CDN
runtime scripts. CSP permits network connections only to the Sociobot production and pilot
license APIs; those calls are still made solely for the explicit Pro licensing flow. All
previously passing editor, export, local storage, import-boundary, mobile, keyboard, and
accessibility behavior is retained.

## Known product limits

- The factory must register the live paid product and return URL before checkout can complete
  in production; the client correctly uses the product slug rather than an unregistered ID.
- Curves remain explicitly labelled planning abstractions, not engine-specific audio playback
  simulations. Occlusion, elevation, orientation, and runtime audition remain outside v1.
- One active project and Pro checkpoints are stored locally; JSON export/import remains the
  portable multi-project workflow.

## Live deployment evidence

Deployed with `/opt/fleet/lib/deploy-static.sh audio-range-cartographer dist` (Azure Static
Web Apps deployment `6fc7f157-32ba-4dca-94f2-28643d790f4f`) to
<https://audio-range-cartographer.sociobot.in>.

- `verify-url.sh` against the live URL: HTTP 200, **912 ms** network-idle load, no console or
  page errors, title/lang/one h1/main/alt text/labelled-button checks all pass; it captured
  desktop and 390px mobile browser screenshots.
- Live identity check: HTML references `/assets/index-DzoXNNut.js` and
  `/assets/index-DlrSGIao.css`; SHA-256 of both responses exactly matches the deployed `dist/`
  files.
- Live 390px Chromium PWA check: Cache API contained both hashed app JS and CSS; after CDP
  HTTP-cache clearing those entries remained; an offline reload rendered “See the soundscape
  before you play it”, had no console/page errors, and had no horizontal overflow. The
  deployment-only static-web-app configuration was correctly absent from Cache API.
- Live response policy: app HTML/worker/manifest are short revalidating, hashed JS is
  `public, max-age=31536000, immutable`, manifest is `application/manifest+json`, and HSTS,
  nosniff, strict referrer policy, CSP, Permissions-Policy, and `X-Frame-Options: DENY` are
  present.
- Azure's production edge did not emit the configured COOP/CORP headers, although the same
  `staticwebapp.config.json` does in the local SWA runtime. This is the verifier's nonblocking
  P3 platform-header gap; it does not affect the P1 offline acceptance or product behavior.
