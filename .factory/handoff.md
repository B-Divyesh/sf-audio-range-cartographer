# Audio Range Cartographer — build handoff

## Independent verification status: **FAIL**

Independent verification on 2026-08-28 tested commit
`2faae500dca335ce32db5e8718180ce3ba0611df` and the live URL
<https://audio-range-cartographer.sociobot.in>. The deployment serves the exact
candidate asset hashes, but release is blocked by a P1 offline-PWA defect: the
service worker cache omits the hashed application JS and CSS. With browser HTTP
cache cleared but Cache API/service-worker storage retained, an offline reload
fails both assets (`net::ERR_FAILED`) and renders no application (`h1: 0`).

All local quality checks otherwise passed: clean `npm ci`; 5/5 unit tests;
production typecheck/build; 12/12 desktop/mobile Playwright tests; zero serious
or critical axe findings; Lighthouse mobile 100/100/100/100 (performance/a11y/
best-practices/SEO); and bundle budgets (41.2 KB JS / 16.3 KB CSS uncompressed).
See [verification.md](verification.md) for exact evidence, additional P2/P3
deployment findings, and required remediation. Do not release this candidate
until the P1 is fixed and independently re-verified.

Work order: `audio-range-cartographer-build-1`
Completed: 2026-08-28

## What shipped

- A responsive, keyboard-operable SVG spatial-audio map with direct placement, dragging,
  arrow-key nudging, inner/full-volume ranges, maximum audible ranges, six emitter colors,
  notes, and explicit linear/inverse/exponential map semantics.
- Strict local JSON and CSV import (1 MB / 200-emitter bounds) with actionable errors that
  do not replace the open project. Large CSV coordinates inform the inferred map size.
- Preflight findings for strongly overlapping, clipped, unusually narrow, and map-wide
  emitters. Findings link back to the relevant inspector.
- Labelled PNG and SVG map exports, plus portable JSON preset and CSV data exports.
- IndexedDB autosave, refresh/tab-close persistence, delete/undo, sample and blank empty
  states, offline status, and a hand-written versioned service worker with app-shell and
  route fallbacks.
- Installable PWA manifest with 192px, 512px, and maskable icons.
- $12 one-time Cartographer Pro integration through the Sociobot billing contract:
  hosted checkout link, query-string token capture and removal, daily verification cache,
  offline use of the last valid verdict, paste-to-restore, quiet revocation handling, 4×
  PNG export, and timestamped local checkpoints. No product ID is hardcoded.
- `/privacy/` and `/terms/` static pages, plus SPA fallbacks for rewrite-capable hosts.
- A product-specific luminous-glass visual system and original generated landscape with
  source, prompt sidecar, provenance, and optimized 36 KB / 84 KB WebP outputs.
- Full README, MIT license, source-of-truth brief, and design specification.

## How to run

```sh
npm ci
npm run dev
npm test
npm run build
npm run test:e2e
```

The exact deployment build command is `npm run build`. Output is `dist/`, with
`dist/index.html` at the root.

## Verification performed

- `npm test`: **5/5 unit tests passed** (JSON/CSV parsing, bounds, coordinate inference,
  diagnostics).
- `npm run test:e2e`: **12/12 passed** using Playwright 1.58.2 on desktop Chromium and a
  390 × 844 mobile viewport. Covered editing/export, keyboard movement, invalid import,
  mocked Sociobot license verification, axe scans, and explicit offline reload with
  `context.setOffline(true)`.
- `npm run build`: passed. Initial application bundle: **41.16 KB JS** (13.90 KB gzip) and
  **16.33 KB CSS** (4.50 KB gzip). Both are far below the 200 KB / 50 KB budgets.
- `npm audit`: **0 vulnerabilities**.
- Factory `verify-url.sh` against the production preview: HTTP 200, no console/page errors,
  title present, `lang="en"`, one `<h1>`, main landmark present, zero missing alt attributes,
  and zero unlabeled buttons. Local network-idle load: **665 ms**.
- Lighthouse 13.0.1, mobile throttling, production preview:
  - Performance: **100**
  - Accessibility: **100**
  - Best practices: **100**
  - SEO: **100**
  - LCP: **1.7 s**; CLS: **0**; total blocking time: **0 ms**; speed index: **0.9 s**
- Visual inspection completed at 1366px and 390px. Focus treatment, 44px targets,
  responsive stacking, safe-area toast placement, and reduced-motion rules are present.

## Privacy and security notes

Project files and snapshots never leave IndexedDB. Imports are parsed as data, bounded,
escaped before DOM/SVG use, and never executed. There are no analytics, tracking pixels,
third-party fonts, or CDN runtime dependencies. Only a license token is sent to the
Sociobot verification endpoint when the user invokes Pro licensing.

## Known gaps / release steps

- The factory must register the live `audio-range-cartographer` paid product and return URL
  before the checkout can complete in production. The client intentionally uses the slug,
  not an unregistered product ID.
- Curve previews are labelled planning abstractions. Engine-specific distance models,
  occlusion, elevation, listener orientation, and audio playback remain intentionally out
  of scope; designers must audition the result in-engine.
- This v1 keeps one active project plus Pro checkpoints. JSON export/import is the portable
  multi-project workflow.
