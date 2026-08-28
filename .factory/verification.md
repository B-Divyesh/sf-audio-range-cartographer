# Independent verification — FAIL

Work order: `audio-range-cartographer-verify-1`  
Verified: 2026-08-28  
Candidate commit: `2faae500dca335ce32db5e8718180ce3ba0611df`  
Live URL: <https://audio-range-cartographer.sociobot.in>

## Verdict

**FAIL.** The application is otherwise a strong match for the brief, but it does
not meet the offline-PWA acceptance contract: its service worker does not
precache the application JavaScript or CSS. A first-load offline reload therefore
depends on the browser's ordinary HTTP cache rather than the PWA cache and fails
when that cache is absent. This is a release blocker for an `pwa-offline` product.

The live site does match the requested candidate: its document references
`/assets/index-CJCrqTgM.js` and `/assets/index-DlrSGIao.css`, precisely the output
of this candidate's fresh production build.

## Checks run

Fresh clean checkout at the candidate, Node/npm environment supplied by the
worker:

| Check | Result | Evidence |
| --- | --- | --- |
| Install | PASS | `npm ci`: 59 packages audited, 0 vulnerabilities. |
| Unit tests | PASS | `npm test`: 5/5 Vitest tests passed. |
| Type check + exact build | PASS | `npm run build` (`tsc --noEmit && vite build`) passed; `dist/` produced. No separate lint script exists. |
| Browser suite | PASS | `npx playwright test --reporter=list`: 12/12 passed (58.5 s), desktop Chromium and 390 × 844 mobile. |
| Build budgets | PASS | Initial JS 41,158 B (13,900 B gzip); CSS 16,327 B (4,500 B gzip), within 200 KB / 50 KB budgets. |
| Lighthouse, production preview | PASS | Mobile simulated: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.7 s, CLS 0, TBT 0 ms. |
| Axe | PASS | The supplied Playwright axe checks report zero serious/critical findings on editor and privacy page on desktop and mobile. |

## Product exercise

- Normal workflow passed: loaded the sample, tuned maximum range, received
  overlap/coverage findings, and downloaded the labelled portable JSON preset.
- Blank-map workflow passed: added an emitter and keyboard nudged it from X=50 to
  X=51. A 390px mobile pass had no horizontal overflow (`scrollWidth == 390`).
- Boundary handling passed: a maximum range of `999999` clamps to 4× map size
  (`480` on the 120-unit sample; `400` on a 100-unit blank map).
- Invalid-import recovery passed: malformed CSV reports the missing `name` column
  while retaining the current sample. The parser's 1 MB / 200-emitter bounds are
  covered by unit tests.
- Untrusted import smoke test passed: JSON title/name/notes containing HTML/SVG
  payload text resulted in zero injected `img[src=x]` nodes, no alert/script,
  and no console or page errors; the literal values were stored and rendered as
  text.
- Local persistence passed: imported state survived reload. Desktop and mobile
  tests also exercised JSON/CSV/SVG/PNG export, delete/undo, license-token URL
  stripping/mocked verification, and standard offline reload after a priming
  reload.
- Keyboard/visual accessibility passed: the skip link receives focus; markers
  are arrow-key operable; the stylesheet supplies a 3px `:focus-visible` ring.
  With reduced motion, computed transition duration was `0.00001s`.
- Runtime network/privacy passed: normal editor load made no third-party or
  unsolicited outbound requests and had zero browser console/page errors. Code
  inspection confirms only an explicit Pro verification may contact
  `api.sociobot.in`; project data uses IndexedDB and no analytics/CDN fonts are
  present.

## Release-blocking defect

### P1 — Offline reload is not reliably self-contained

`public/sw.js` cache `arc-v2` precaches `/`, `/index.html`, images, icons, and
legal pages, but omits the hashed `/assets/index-CJCrqTgM.js` and
`/assets/index-DlrSGIao.css` files. They are only added by the fetch handler on
a subsequent controlled request.

Fresh live-browser reproduction:

1. Opened the live URL in a new Chromium context and waited for
   `navigator.serviceWorker.ready`.
2. Confirmed the Cache API contained only the shell entries above—not JS/CSS.
3. Cleared ordinary browser HTTP cache while retaining Cache API/service-worker
   storage, set the context offline, and reloaded.
4. Both hashed CSS and JS failed with `net::ERR_FAILED`; the rendered document
   had `h1: 0` and only `Skip to map editor` text.

The current 12-test suite reloads once online before going offline, which lets
the service worker cache those assets and therefore does not detect this case.
This violates the stated PWA requirement to precache the app shell and prevents
reliable offline use after a browser cache eviction.

## Other defects / deployment gaps

### P2 — Production cache policy does not meet immutable hashed-asset guidance

On the live URL, HTML, hashed JS, hashed CSS, service worker, and static assets
all return `Cache-Control: public, must-revalidate, max-age=30`. Hashed JS/CSS
should be long-lived immutable assets. This adds avoidable revalidation and is
not the required immutable-asset policy.

### P2 — Service-worker build/version update contract is weak

The worker cache name is the fixed literal `arc-v2`, not a build-derived value,
and the shell list is manually maintained. A future deployment can change
hashed application assets without changing this cache name. The in-app update
toast is present in source, but a production update cannot be relied on to
create a new versioned cache unless a developer also manually changes that
literal and shell list.

### P3 — Response policy hardening is incomplete

Live responses correctly include HSTS, `nosniff`, and a strict referrer policy,
but omit Content-Security-Policy, frame-ancestors/X-Frame-Options,
Permissions-Policy, COOP, and CORP. The manifest is served as
`application/octet-stream` rather than a web-manifest media type. These are
not the reason for the FAIL, but should be corrected in deployment policy.

## Live deployment evidence

- `GET /`: HTTP 200, title and `lang=en` present; exact candidate asset hashes
  above; no deployment-only functional failure observed.
- `GET /privacy`, `/terms`, `/offline.html`, `/sw.js`, and the asset URLs: HTTP
  200. Unknown SPA path returns the application shell (HTTP 200).
- Live mobile 390px pass: one h1/main, no horizontal overflow, arrow-key
  emitter movement, reduced-motion rule active, no console/page errors, and no
  unsolicited outbound requests. The PWA installed/controlled successfully and
  a normally primed offline reload works; the P1 reproduction explains why that
  is insufficient.

## Required remediation and re-verification

1. Generate the worker precache list from the Vite build manifest (or use a
   Workbox inject-manifest flow) so every hashed JS/CSS asset is included before
   first offline navigation.
2. Give each build a new cache version and remove stale caches on activation;
   verify the update toast using two actual builds.
3. Configure immutable, long-lived caching for hashed assets and retain a short
   revalidating policy only for HTML/service worker/manifest as appropriate.
4. Add the exact browser-cache-cleared offline test above to Playwright, then
   re-run all checks and issue a new independent verification report.
