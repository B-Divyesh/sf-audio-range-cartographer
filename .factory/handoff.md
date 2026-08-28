# Audio Range Cartographer — repair handoff

Work order: `audio-range-cartographer-repair-3`

Base candidate: `47a2a872885dc17fded743269de6d6df7ac468fe`

Artifact/deployment class: `pwa-offline` / Azure Static Web Apps

Production URL: <https://audio-range-cartographer.sociobot.in>

## Release status: PASS

The independent verification blocker is repaired. The map SVG is exposed as an
interactive group rather than an atomic image, so its focusable emitter buttons
remain available to assistive technology. The populated editor has no serious or
critical axe findings at desktop or 390 × 844 mobile sizes. Cache-backed offline
reloads also show the offline state reliably on desktop and mobile.

The accidentally committed SWA upload ZIP was removed; deploy archives are generated
artifacts and are now ignored. The shipped artifact remains the static PWA in `dist/`.

## Root cause and regression coverage

- Reproduced against parent candidate `d6427bed36cbe666e1720ba00f88f7ace0636e8b`:
  axe-core 4.10.2 reported one serious `nested-interactive` violation at
  `#range-map[role="img"]` because it contained focusable emitter groups.
- Fixed the root cause by giving `#range-map` the compatible `group` role, an
  interactive accessible name/description, and preserving each emitter as a named,
  arrow-key-operable button.
- The focused Playwright regression starts a blank project, adds an emitter, asserts
  both map and marker semantics, and runs axe. Playwright runs it in desktop Chromium
  and Chromium at 390 × 844.
- Offline state no longer depends only on `navigator.onLine`: a no-store same-origin
  connectivity probe detects a service-worker cache recovery, and the mobile CSS shows
  the badge whenever it is not hidden. The regression clears only Chromium's HTTP cache,
  goes offline, reloads from Cache API, and requires the badge to be visible.
- A post-deploy persisted-project check found that emitter color dots used an inline
  custom-property style, which the production `style-src 'self'` CSP blocked. Color dots
  now use a safe SVG `fill` presentation attribute. The populated-map regression asserts
  the rendered color and requires zero inline `style` attributes, without weakening CSP.

## Clean local verification — 2026-08-28 UTC

| Check | Result |
| --- | --- |
| Exact work-order command `npm ci && npm test && npm run build` | PASS; 178 packages, 0 vulnerabilities; Vitest 5/5; `dist/index.html` and generated `dist/sw.js` present |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run test:e2e` | PASS; 12/12 across desktop Chromium and 390 × 844 mobile Chromium |
| Populated-editor axe regression | PASS; 0 serious/critical findings in both projects; `/privacy` also 0 |
| Keyboard and mobile | PASS; arrow-key marker movement changes X 50 → 51; mobile suite has the same workflow and no overflow regression |
| Integration/error/privacy/license | PASS; sample edit/export, malformed-import recovery, mocked Sociobot token verification and URL stripping, and legal-page scan |
| Cache-cleared offline reload | PASS; generated cache contains hashed JS/CSS, HTTP cache was cleared, offline reload rendered the h1 and visible `Offline · changes stay local` badge |
| Two-build update flow | PASS; cache changed from `arc-77953b3f65ec` to `arc-5e4305cdb2f0`; update toast and Reload action appeared; 0 console/page errors |
| `/opt/fleet/lib/verify-url.sh` on production preview | PASS; title/lang, one h1, main, alt text, labelled buttons; 0 console/page errors |
| Lighthouse 13.4.1 mobile, production preview | PASS; Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1,733 ms, CLS 0, TBT 0 ms |
| Static budgets | PASS; JS 41,563 B (14,070 B gzip), CSS 16,352 B (4,510 B gzip), largest image 83,930 B |

The Playwright suite uses the required pinned `@playwright/test` 1.58.2. The service
worker precaches 18 shell entries including the emitted hashed JavaScript and CSS,
excludes deployment-only `staticwebapp.config.json`, versions caches per build, removes
stale `arc-*` caches, claims clients, and exposes the in-app update path.

## Deployment and live verification

Deployed source commit: `f8f652f`

Deployment ID: `60e1a7be-aa54-484e-a00f-8c93c718cbc6`

Deployment command:

```sh
/opt/fleet/lib/deploy-static.sh audio-range-cartographer dist
```

The Azure upload succeeded, the custom domain was `Ready`, and HTTPS returned 200.

| Live check | Result |
| --- | --- |
| Deployment identity | PASS; live `/assets/index-CsC1k4mu.js` SHA-256 `1fd54a9b9c47fed9e2d3031bdeb4e4d35e1be2adbde126aba71ccbdd3a866f6e` exactly matches local |
| Stylesheet identity | PASS; live `/assets/index-C4_-lMJw.css` SHA-256 `dfdb34f284ad84fa3e7bee8708a62ac5ecbd5916946c952a0a89a22047e97dbd` exactly matches local |
| Endpoint/response policy | PASS; `/`, `/sw.js`, `/manifest.webmanifest`, `/privacy`, `/terms`, JS, and CSS return 200; manifest MIME is `application/manifest+json`; hashed assets are one-year immutable; shell/worker/manifest revalidate after 30 seconds; CSP and security headers present |
| Desktop + 390 × 844 exercise | PASS; populated editor and privacy have 0 serious/critical axe findings, marker arrows change X 50 → 51, no mobile overflow, correct SVG color dot, no inline styles, and 0 console/page errors |
| Live offline | PASS in both viewports; Cache API contains hashed JS/CSS, HTTP cache was cleared, offline reload rendered the workspace and visible offline badge |
| Live privacy | PASS; normal editor/legal/offline exercise contacted only `https://audio-range-cartographer.sociobot.in`; no analytics, font CDN, ads, or other third party |
| Live `verify-url.sh` | PASS in 751 ms; correct title/lang, one h1, main, alt text, labelled buttons, 0 console/page errors |
| Live Lighthouse 13.4.1 mobile | PASS; Performance 98, Accessibility 100, Best Practices 100, SEO 100; LCP 1,353 ms, CLS 0, TBT 148 ms |

## Known gaps / next steps

No known release blockers. Engine-specific acoustic simulation and audio playback remain
intentionally outside the researched v1 scope.
