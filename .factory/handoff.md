# Audio Range Cartographer — repair handoff

Work order: `audio-range-cartographer-repair-1`  
Repaired from verifier candidate: `2faae500dca335ce32db5e8718180ce3ba0611df`  
Verifier report: `.factory/verification.md`

## Release status

**Local verification: PASS.** The P1 first-offline-reload defect is repaired and has exact
desktop and 390px mobile regression coverage. Live deployment evidence is recorded below
after the factory static deployment finishes.

## What changed

- Replaced the manually maintained `public/sw.js` list with a generated `dist/sw.js`.
  The Vite build manifest is traversed for every hashed JS, CSS, imported chunk, and emitted
  asset; public files are discovered at build time too. The worker precaches that complete
  list before activation, has a unique `arc-…` cache per build, and deletes only stale
  Cartographer caches.
- Made cache matching resilient to response `Vary` headers with `ignoreVary: true`. This is
  important for a reliable Cache API hit after a browser HTTP-cache eviction.
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

Pending the static deployment for this repair.
