# Independent verification 3 — Audio Range Cartographer

**Result: FAIL — do not release candidate
`d0b04f8f50f46c3f44f99272871c0c009c297bf8` yet.**

Verified 2026-08-28 from a clean `main` checkout and against
<https://audio-range-cartographer.sociobot.in>. The prior service-worker and
interactive-SVG blockers are fixed. The core product, offline behavior, deployment
identity, privacy posture, automated gates, and axe serious/critical gate all pass.
Two mobile acceptance defects remain in the shipped UI.

## Defects

### P2 — footer links miss the required 44 × 44 px touch-target baseline

At the required 390 × 844 mobile viewport, the visible footer links in the main
workspace measure:

| Link | Rendered target |
| --- | ---: |
| Privacy | 47.1 × 19.5 px |
| Terms | 38.3 × 19.5 px |
| Param Factory | 92.8 × 15 px |

The links have no vertical padding. This violates the supplied non-negotiable
accessibility baseline that touch/click targets be at least 44 × 44 CSS px. The
Privacy and Terms links are also essential routes for this product's local storage
and paid license behavior.

**Reproduction:** open the live workspace at 390 × 844, scroll to the footer, and
inspect each link's `getBoundingClientRect()`. Add a padded hit area of at least
44 × 44 px without creating overlap, then cover it with a mobile regression.

### P2 — the Terms heading causes horizontal overflow at 390 px

The live `/terms` page has a 390 px visual viewport but
`document.documentElement.scrollWidth === 395`. The `Straightforward terms` h1
has a 342 px content box and a 371 px `scrollWidth`; the unbroken first word extends
through the right padding and makes the page five pixels wider than the viewport.
`/` and `/privacy` remain 390 px wide under the same iPhone 13 emulation.

**Reproduction:** load <https://audio-range-cartographer.sociobot.in/terms> using
Playwright's iPhone 13 profile with an overridden 390 × 844 viewport. Permit the
heading to wrap within its content width (or reduce its narrow-screen type size),
then assert document width does not exceed the visual viewport.

There are no P0/P1 defects. The verdict is nevertheless FAIL because the supplied
accessibility skill calls its 44 px target rule non-negotiable and the product
contract requires mobile completion.

## Clean local gates

| Check | Result and evidence |
| --- | --- |
| Checkout | PASS — worktree clean at exact candidate before report edits; `origin/main` was the same commit. |
| Install | PASS — `npm ci`, 178 packages, 0 vulnerabilities. Node 22.23.2 / npm 10.9.8. |
| Type check | PASS — `npm run typecheck`. |
| Lint | PASS — `npm run lint`. |
| Unit tests | PASS — `npm test`, 5/5 Vitest tests. |
| Exact production build | PASS — `npm run build`; `dist/index.html` and generated `dist/sw.js` present. |
| Repository browser suite | PASS — `npm run test:e2e`, 12/12 tests using pinned Playwright 1.58.2 across desktop Chromium and the 390 × 844 mobile project. |
| Bundle budgets | PASS — initial JS 41,563 B (14,070 B gzip), CSS 16,352 B (4,510 B gzip), largest image 83,930 B. No remote fonts. |

## Independent product exercise

Against the local production preview, a separate Playwright exercise verified:

- empty-state guidance and a useful error when exporting with no emitters;
- valid two-emitter JSON import with inverse and exponential semantics, three
  labelled clipped/overlap findings, and intact project state after reload;
- numeric recovery: width `0` is rejected and restored; X `-50`, Y `999999`, max
  range `999999`, and inner range `-10` clamp to `0`, `70`, `400`, and `0`;
- malformed JSON and a file over 1,000,000 characters are rejected without replacing
  the current project;
- HTML/script-like project, unit, emitter, and note strings render as inert text;
- delete/Undo and Shift+Arrow marker movement work; IndexedDB state survives reload;
- all free artifacts download and are usable: a 1,898 B labelled SVG, 656 B JSON
  preset, 177 B CSV, and valid 484 × 472 PNG (41,265 B);
- the Guide dialog accepts keyboard activation, contains focus, closes with Escape,
  and returns focus to its trigger.

The shipped unit tests separately cover quoted CSV, large coordinates, the 200-emitter
limit, malformed schemas, and diagnostics. The mocked license integration verifies
the Sociobot endpoint, stores `sb_license:audio-range-cartographer`, removes the token
from the URL, and unlocks without gating the free exports.

## Accessibility and responsive evidence

- Desktop and 390 px populated editors have zero axe-core 4.10.2 serious/critical
  findings. Live `/privacy` and `/terms` also have zero serious/critical findings.
- The repaired map is an accessible group and its emitters are named buttons.
  Keyboard movement changes X from 50 to 51.
- The skip link becomes visible at 8,8 with a 3 px amber outline and moves focus to
  `<main>`. A focused emitter gets an amber 1.1 px marker stroke.
- `prefers-reduced-motion: reduce` computes animation and transition durations as
  `0.00001s`.
- The main editor has no horizontal overflow at 390 px. The Terms-page exception and
  undersized footer targets are documented above.
- Root, Privacy, and Terms each have a title, `lang=en`, one h1, and a main landmark;
  no image lacks `alt`. `/opt/fleet/lib/verify-url.sh` passed on live in 1,053 ms with
  zero console/page errors.

## PWA and local-first evidence

- Chrome reports a valid manifest with standalone display, a versioned start URL,
  matching theme/background colors, and 192, 512, and 512 maskable PNG icons of the
  declared dimensions.
- The live worker controls the page and has 18 precached entries, including the exact
  hashed JavaScript and CSS and excluding the deployment-only SWA configuration.
- On desktop and mobile, after clearing only Chromium's HTTP cache and disabling the
  network, reload rendered the persisted editor and the visible
  `Offline · changes stay local` badge with no console/page errors.
- A fresh local two-build update changed the cache from `arc-9d295bd45a72` to
  `arc-957aa6ea98d5`, displayed `An app update is ready` with a Reload action, and
  removed the old cache after activation (observed at 1.25 seconds).

## Privacy, requests, and response policy

- Normal desktop/mobile editor use contacted only
  `https://audio-range-cartographer.sociobot.in`; there were no analytics, ads,
  third-party fonts/scripts, or project-data uploads. Source inspection found only
  same-origin connectivity probing plus the explicit Sociobot license verification.
- Project/snapshot state uses IndexedDB; only license tokens/verdicts use localStorage.
  Privacy and Terms accurately disclose local data and the one-time $12 purchase.
- Root, service worker, manifest, legal routes, offline page, and hashed assets return
  HTTP 200. Hashed JS/CSS use `public, max-age=31536000, immutable`; HTML, worker, and
  manifest use `public, max-age=30, must-revalidate`.
- Live responses include HSTS, CSP with narrow connect sources, COOP, CORP,
  `X-Frame-Options: DENY`, `nosniff`, strict referrer policy, and a restrictive
  Permissions-Policy. The manifest MIME type is `application/manifest+json`.

## Deployment identity and performance

All 17 deployable files other than the intentionally build-versioned worker matched
the fresh candidate build byte-for-byte. Key identities:

- HTML SHA-256: `740ec6dc03acf78b82a1444ed78e1d64f87846bc88314b5b152bb1c2f7520706`
- JS SHA-256: `1fd54a9b9c47fed9e2d3031bdeb4e4d35e1be2adbde126aba71ccbdd3a866f6e`
- CSS SHA-256: `dfdb34f284ad84fa3e7bee8708a62ac5ecbd5916946c952a0a89a22047e97dbd`

The live worker's generated cache ID differs from a fresh build because the build
intentionally includes the build time, but its entire precache list and behavior match.
The candidate differs from the deployed source commit only in `.factory` documentation,
so deployable source parity is exact.

Lighthouse 13.4.1 mobile on live (full-page screenshot gatherer disabled to avoid a
known headless Chromium crash): Performance 98, Accessibility 100, Best Practices 100,
SEO 100; FCP 1.1 s, LCP 1.4 s, TBT 160 ms, CLS 0, Speed Index 1.1 s.

## Required re-verification

Increase footer link hit areas to 44 × 44 px on the workspace and legal pages, fix the
390 px Terms heading overflow, add narrow-screen regressions, then rerun the local gates,
populated axe checks, offline reload, live artifact hashes, and Lighthouse.
