# Independent verification 2 — Audio Range Cartographer

**Result: FAIL — do not release candidate `d6427bed36cbe666e1720ba00f88f7ace0636e8b`.**
Verified 2026-08-28 against the clean local checkout and
<https://audio-range-cartographer.sociobot.in>.

The real spatial-audio planning workflow works, the PWA cache repair is present in
production, and the live JavaScript/CSS bytes match this candidate. A serious axe
accessibility violation remains in a normal, core workflow, which violates the
factory acceptance requirement of no serious/critical findings.

## Release blocker

### P1 — emitter markers are focusable controls inside an SVG exposed as an image

**Reproduction:** Open the app, choose **Start blank**, then **Add emitter** (or
import any map with an emitter), and run axe. This reproduces at desktop and at
390 × 844 on the live deployment.

**Observed:** axe-core 4.10.2 reports one **serious** `nested-interactive`
violation (WCAG 4.1.2):

```text
#range-map (role="img") has focusable descendants
related: <g class="emitter ..." tabindex="0" role="button" ...>
```

`src/app.ts` renders the map SVG with `role="img"` and each emitter `<g>` as a
keyboard-focusable `role="button"`. Assistive technologies can treat the whole
map as an atomic image rather than expose those nested marker controls reliably.
The normal keyboard operation is therefore not accessible despite the visual
marker focus treatment. The repository axe tests miss this because they scan the
empty/onboarding state, not an editor containing a marker.

**Required fix before release:** expose the interactive map with a compatible
interactive semantic (or move marker controls outside the element with `role=img`),
then add an axe regression test after placing/importing at least one emitter on
both desktop and mobile.

## Non-blocking defect

### P2 — offline badge is not visibly shown after an offline reload

With a service-worker-controlled live page, HTTP cache cleared through CDP, and
`context.setOffline(true)`, the page reloads successfully from Cache API and the
heading renders. The `Offline · changes stay local` element remains hidden.
The implementation relies on `navigator.onLine`; Chromium's offline emulation did
not make that indicator visible on reload. The offline fallback works, but the
promised offline feedback is not reliably visible in this recovery path.

## Evidence

### Clean local quality gates

| Check | Result |
| --- | --- |
| Checkout | Clean `main` at `d6427bed36cbe666e1720ba00f88f7ace0636e8b` before documentation changes |
| `npm ci` | Passed; 178 packages added, 0 vulnerabilities |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm test` | Passed; 5/5 Vitest tests |
| `npm run build` | Passed; generated `dist/` and `dist/sw.js` |
| `npm run test:e2e` | Passed; 12/12 Chromium desktop and iPhone-13/390px tests |

Production build sizes are **41,297 B JS** (13,955 B gzip) and **16,327 B CSS**
(4,500 B gzip), within the 200 KB / 50 KB initial static-PWA budgets. The largest
first-run image is 83,930 B WebP.

### Independent product exercise

Using a fresh Chromium profile against the production build, I independently
verified all of the following with no console errors or page errors:

- blank-map creation, emitter placement, max-range lower-bound clamping to 0.1,
  delete and Undo;
- valid JSON import with two overlapping/clipped emitters, labelled findings,
  and labelled SVG download;
- malformed JSON error reporting without replacing the imported project;
- project persistence through a tab close and new tab via IndexedDB;
- keyboard skip link targeting `<main>`, keyboard marker movement (repository
  E2E), visible focus treatment, 390px layout with no horizontal overflow, and
  reduced-motion transitions reduced to `1e-05s`;
- local normal-use request capture: only `http://127.0.0.1:4173` was contacted;
  the live normal-use run similarly contacted only
  `https://audio-range-cartographer.sociobot.in`.

The same 390px live run produced the P1 axe finding after adding an emitter;
there were no other serious/critical axe findings in that scan.

### PWA, deployment identity, privacy, and response policy

- Live HTML references `/assets/index-DzoXNNut.js` and
  `/assets/index-DlrSGIao.css`. Their SHA-256 values exactly equal the local
  candidate build: respectively
  `9d32554286661d6ab56e33753f5cf33c52f69e8cd21fa155cf5cbceee16fafd3` and
  `49ebc6f33514b8c314f1774648910921ff0130ee0f471c5ac0f18ee15408a54c`.
- The live worker is controlled from `/sw.js`, has an `arc-…` cache with 18
  precached entries including the actual hashed JS and CSS. After CDP
  HTTP-cache clearing, offline reload rendered the application successfully.
  Calling `registration.update()` completed without error; no newer deployment
  was available to trigger the update toast.
- The manifest has standalone display, versioned start URL, theme/background
  colors, 192/512/maskable icons. The worker has versioned cache cleanup,
  `skipWaiting`, and `clients.claim`.
- The live root, worker, manifest, legal pages, and hashed assets returned 200.
  Hashed assets use `Cache-Control: public, max-age=31536000, immutable`; HTML,
  manifest, and worker use `public, max-age=30, must-revalidate`; manifest MIME
  type is `application/manifest+json`.
- Live headers include HSTS, CSP, COOP, CORP, `X-Frame-Options: DENY`, nosniff,
  strict referrer policy, and a restrictive Permissions-Policy. CSP permits
  connections only to same origin plus the Sociobot license APIs. No analytics,
  ad, font-CDN, or other third-party runtime request was observed in the free
  workflow. Project data persistence is IndexedDB and export/import is local.
- `LICENSE`, `/privacy`, `/terms`, README, brief, and visual thesis are present.

### Lighthouse attempt

Lighthouse 13.4.1 mobile against the local production preview measured 99
performance, 100 accessibility, 100 best practices, and 100 SEO; LCP 1,592 ms,
CLS 0, and TBT 84 ms. Its final full-page screenshot gatherer then reported
`TARGET_CRASHED`, so those scores are supportive rather than authoritative. It
also scanned the initial empty state and therefore did not exercise the P1
interactive-marker defect; the targeted axe run above is decisive.

## Scope and next step

No product source was modified during verification. Fix P1, add the populated-map
axe regression, and rerun this verification including live deployment identity
and offline reload before changing the release decision to PASS.
