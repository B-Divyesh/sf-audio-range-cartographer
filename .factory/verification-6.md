# Independent verification 6 — FAIL

**Candidate:** `963ee45b927cabc0d5bedd182001a2b6054ded4d`

**Live URL:** <https://audio-range-cartographer.sociobot.in>
**Verified:** 2026-08-30 UTC, from a clean `npm ci` checkout

## Decision

**FAIL — release blocked.** The editor itself is a capable local-first PWA and
the deployed application assets match the candidate build. However, the product
uses the Sociobot license-verification endpoint and the required per-client
server-side request allowance is not enforced. Six fresh invalid-token requests
from one client all returned `200` with no `Retry-After`; none returned `429`.
The client-side five-per-minute pacing is not a substitute for this required
server response contract.

## First-read test

Cold-opening the live home page answered the three required questions in plain
words:

- **What:** “Map audible ranges before playtests.”
- **For whom:** “For indie game sound designers who need a labelled range map
  before a level review.”
- **First action:** the visible **Try it with sample data** button says it
  “Loads a harbor map in a separate demo.”

It has the required one-click sample path. The first click opens the Harbor
approach map with Dock machinery selected, three labelled emitters, diagnostics,
and the persistent “Demo — sample data, nothing is saved to your real project”
banner. This acceptance condition passes.

## Required claim tests

Before other QA, after `npm ci`, I ran every exact command in
`.factory/claims.json` from the demo entry point. Each passed in Chromium
desktop and 390 × 844 mobile (two Playwright projects):

| Claim | Command/result |
| --- | --- |
| `core-workflow` | `npm run test:e2e -- --grep @claim:core-workflow` — pass |
| `keyboard-marker` | `npm run test:e2e -- --grep @claim:keyboard-marker` — pass |
| `invalid-import` | `npm run test:e2e -- --grep @claim:invalid-import` — pass |
| `demo-sandbox` | `npm run test:e2e -- --grep @claim:demo-sandbox` — pass |
| `map-exports` | `npm run test:e2e -- --grep @claim:map-exports` — pass |
| `local-project-data` | `npm run test:e2e -- --grep @claim:local-project-data` — pass |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` — pass |
| `pro-price` | `npm run test:e2e -- --grep @claim:pro-price` — pass |
| `license-check-pacing` | `npm run test:e2e -- --grep @claim:license-check-pacing` — pass |

The complete suite was also run after the claim pass: `npx playwright test
--workers=8` completed with all **28/28** tests passing. No failure artifacts
were produced.

## Local release gates

All passed:

```text
npm ci
npm test                 # 9/9
npm run typecheck
npm run lint
npm run build            # dist/ generated
npm run test:static
npx playwright test --workers=8   # 28/28
```

The production build is compact: JS is 46,086 B raw / 15,246 B gzip and CSS is
17,661 B raw / 4,796 B gzip. Both are comfortably within the PWA budget.

## Live functional and resilience evidence

- Normal demo: Harbor sample loaded; editing a selected max range persisted;
  the map showed preflight findings; JSON, CSV, SVG, and PNG export claims are
  covered by the downloads suite.
- Boundaries: live max range input clamps `0` to `0.1` and `1000` to `480` for
  the 120 × 80 m sample rather than accepting unusable values.
- Invalid import: a CSV with no `name` field announced `CSV is missing the
  “name” column. Required: name, x, y.` and kept Dock machinery selected.
- Keyboard: focusing the first SVG emitter and pressing ArrowRight changed X
  from `28` to `29`; the focused marker gets its designed high-contrast core
  stroke. Standard controls have a 3 px focus ring.
- Mobile: at 390 px there was no horizontal overflow (`scrollWidth = 390`);
  both demo buttons measured 165 × 44 CSS px.
- Reduced motion: transition durations become `.01ms` under
  `prefers-reduced-motion: reduce`; no looping animation was present.
- PWA: the live worker controlled the page; `registration.update()` completed
  with an active worker and no pending worker. After clearing HTTP cache,
  setting the context offline, and reloading `?demo=1`, Dock machinery and the
  “Offline · changes stay local” state remained available without errors.

## Privacy, accessibility, security, and performance

- A request log for the full desktop and mobile demo/edit/invalid-import flow
  contained only `https://audio-range-cartographer.sociobot.in`; no project
  data request or third-party runtime request occurred. The clean demo used
  `demo:audio-range-cartographer`, not the real database.
- `/opt/fleet/lib/verify-url.sh` passed for `/`, `/?demo=1`, `/privacy/`, and
  `/terms/`: each returned 200 with a title, `lang=en`, exactly one h1, main
  landmark, no missing image alt, no unnamed button, and no console/page error.
- Live axe scans of desktop and 390 px demo found **0 serious/critical**
  violations. The repository suite repeats the editor and legal-page axe scan.
- Response headers include CSP with `frame-ancestors 'none'`, HSTS,
  `nosniff`, `DENY`, COOP, CORP, Permissions-Policy, and strict-origin referrer
  policy. Hashed JS/CSS are `max-age=31536000, immutable`; HTML, manifest, and
  worker are revalidated at 30 seconds. An unknown route returned HTTP 404 and
  the product-styled 404 page.
- Lighthouse 13 live mobile demo, provided network throttling: Performance
  **100**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP
  0.4 s, LCP 0.4 s, TBT 0 ms, CLS 0. The successful run used
  `--disable-full-page-screenshot` because this container's first attempt
  crashed while capturing the otherwise nonessential full-page screenshot.

## Deployment identity

Live `index.html`, JS, CSS, and manifest are byte-identical to a fresh build of
the candidate:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `29d9168f5a45e99da408073b991b288ee3b069dabc7183c0830d042b499518ad` |
| `assets/index-B81gyXsl.js` | `89402cdd7bb6b9b6a0ff1375baf3a36922559616a152c2d42b3d1e6ecd5fde44` |
| `assets/index-XotKwyqo.css` | `a727dad55fa11beefb529731b11f7ef99508b16c88a6cf7a20253609f7fb924d` |
| `manifest.webmanifest` | `4ebc90dccb0cdf35b077a5b9169a524e12e8f6f1e83c395af214d509206f2703` |

The service-worker precache list is also the same, but its `VERSION` hashes
`Date.now()` during every build. Fresh `dist/sw.js` was
`20211b7f…`, while live was `c1649334…`; the only difference is the generated
`arc-*` version string. This makes the worker artifact non-reproducible and
prevents a full binary identity proof from a clean rebuild. It is a P2 release
engineering finding, separate from the blocking rate-limit failure.

## Defects

### P1 — server-side license verification has no enforced allowance

`GET https://api.sociobot.in/api/v1/products/audio-range-cartographer/verify`
was called six times in immediate succession from this verifier using distinct
invalid tokens. Attempts 1–6 each returned:

```http
HTTP/2 200
content-type: application/json

{"expires_at":null,"reason":"invalid","valid":false}
```

There was no `Retry-After` header and no 429. **Observed allowance: at least
six requests in one immediate client batch; the documented/enforced server
allowance is absent.** The local browser guard correctly pauses its own sixth
attempt, but direct callers bypass it. This violates the explicit backend/API
allowance acceptance condition. The fix belongs in the Sociobot gateway or
billing verification service: choose and document a per-client allowance,
return `429` plus `Retry-After` after it, then rerun this six-request test.

### P2 — worker build output is non-reproducible

`vite.config.ts` computes the service-worker cache version from `Date.now()`.
Consequently two builds of the same candidate differ in `dist/sw.js`, and a
fresh verifier cannot byte-verify that worker against production. Derive the
version from deterministic source/asset content or inject a recorded build ID
at deployment and expose it in the handoff.

## Scope notes

This is a static PWA, not a library/CLI or application backend. No sign-in is
present; the only server-side product endpoint exercised is the optional
Sociobot license verification endpoint. No product code was changed during
this verification.
