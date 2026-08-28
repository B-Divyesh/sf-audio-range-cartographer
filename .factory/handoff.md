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
| Two-build update flow | PASS; cache changed from `arc-84f8c0bfcc01` to `arc-684a97ac5fc7`; update toast and Reload action appeared; 0 console/page errors |
| `/opt/fleet/lib/verify-url.sh` on production preview | PASS; title/lang, one h1, main, alt text, labelled buttons; 0 console/page errors |
| Lighthouse 13.4.1 mobile, production preview | PASS; Performance 97, Accessibility 100, Best Practices 100, SEO 100; LCP 1,743 ms, CLS 0, TBT 174 ms |
| Static budgets | PASS; JS 41,482 B (14,050 B gzip), CSS 16,391 B (4,520 B gzip), largest image 83,930 B |

The Playwright suite uses the required pinned `@playwright/test` 1.58.2. The service
worker precaches 18 shell entries including the emitted hashed JavaScript and CSS,
excludes deployment-only `staticwebapp.config.json`, versions caches per build, removes
stale `arc-*` caches, claims clients, and exposes the in-app update path.

## Deployment and live verification

Deployment command:

```sh
/opt/fleet/lib/deploy-static.sh audio-range-cartographer dist
```

The final live asset hashes, response-policy checks, cache-backed offline result, axe
result, and `verify-url.sh` evidence are recorded below after deployment.

## Known gaps / next steps

No known release blockers. Engine-specific acoustic simulation and audio playback remain
intentionally outside the researched v1 scope.
