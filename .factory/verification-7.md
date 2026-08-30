# Independent verification 7 — FAIL

**Candidate:** `774d4c0a5ea3e701ee8a6f1e6a4898c30c203562`  
**Live URL:** <https://audio-range-cartographer.sociobot.in>  
**Verified:** 2026-08-30 UTC, clean `npm ci` checkout

## Decision

**FAIL — release blocked.** The free, local-first spatial-audio mapping workflow is working and the live static assets are byte-identical to this candidate. However, the advertised one-time purchase cannot be started: the live **Buy securely through Sociobot** link returns HTTP 500. This is a dead purchase link and violates the paid-unlock and site-link acceptance contracts.

## Blocking defect

### P1 — Live Pro checkout returns 500

From the live Pro dialog, clicking **Buy securely through Sociobot** navigated to:

`https://api.sociobot.in/api/v1/products/audio-range-cartographer/checkout`

The browser received HTTP 500 and displayed:

```json
{"error":"Internal server error","status":500}
```

Direct requests reproduced the same 500 both without parameters and with
`?email=qa@example.com`. The product advertises “Optional Pro: $12 once” and a
$12 one-time license, so this is not an unused route. Register/repair the
product checkout configuration in the Sociobot billing service, then verify
that this URL redirects to hosted checkout successfully. This requires an
external service/configuration repair; no product code was changed.

## Required first-read and demo test

Cold-opening the live page answered all required questions in plain words:

- **What:** “Map audible ranges before playtests.”
- **For whom:** “For indie game sound designers who need a labelled range map before a level review.”
- **First action:** **Try it with sample data** — “Loads a harbor map in a separate demo.”

That first-screen action opened the Harbor sample in one click. The persistent
banner says that nothing is saved to the real project, and offers Reset demo
and Start for real. This acceptance condition passes.

## Claims — all required commands passed

Before broader QA, after clean `npm ci`, I invoked every exact command in
`.factory/claims.json` against the shipped demo entry point. Each passed in the
desktop Chromium and 390 × 844 mobile projects:

| Claim | Result |
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

## Local release gates

All passed from the clean checkout:

```text
npm ci
npm test                 # 10/10
npm run typecheck
npm run lint
npm run build            # produces dist/
npm run test:static      # byte-stable clean build
npm run test:e2e         # 30/30; desktop + 390px mobile
SOCIOBOT_OPERATOR_GATEWAY_CHECK=1 npm run test:gateway
```

The production bundle is 46,196 B JS (15,360 B gzip) and 17,661 B CSS
(4,770 B gzip), well below the PWA budgets. `test:static` reported deterministic
build fingerprint `e3e7ea4fa5a71bb01e369fe7a6f0f8813f5cba63f4fa2fd53239980d223a7f79`.
Lighthouse was also attempted against the live site using the preinstalled
Playwright Chromium via a remote-debugging port. Its trace failed with
`NO_NAVSTART` (and a retry crashed the tab), so no Lighthouse performance score
is claimed from this verification; the fresh bundle measurements above are the
available performance evidence.

## Functional, privacy, accessibility, and PWA evidence

- Demo loaded Dock machinery, moved its X coordinate from 28 to 29 with
  ArrowRight, and retained it after an invalid CSV. The error was specific:
  “CSV is missing the “name” column. Required: name, x, y.”
- The live request log for the complete demo/edit/import flow contained only
  same-origin requests (document, app JS/CSS, icon, and same-origin
  connectivity check). No project data went to a third party. IndexedDB was
  `demo:audio-range-cartographer`, not the real workspace database.
- Live axe Playwright scan had zero serious/critical findings. The complete
  repository suite also scans the editor and legal pages. `verify-url.sh`
  passed `/`, `/?demo=1`, `/privacy/`, and `/terms/`: title, `lang=en`, one h1,
  main landmark, alt coverage, named buttons, and no console/page errors.
- At 390 px, `scrollWidth` equalled 390. Demo actions measured 165 × 44 CSS px.
  Reduced-motion transition duration was `0.00001s`.
- The live service worker was controlling the page, active, and had no waiting
  update after `registration.update()`. After HTTP-cache eviction and offline
  reload, Dock machinery and “Offline · changes stay local” remained usable.
- Live headers include CSP with `frame-ancestors 'none'`, HSTS, nosniff, COOP,
  CORP, Permissions-Policy, and strict-origin referrer policy. Hashed JS/CSS
  are immutable for one year; HTML, manifest, and worker revalidate in 30
  seconds. A deliberately unknown route returned 404.

## Server-side allowance

The optional license verification endpoint is rate limited. A fresh same-client
64-request invalid-token burst (`SOCIOBOT_OPERATOR_GATEWAY_CHECK=1 npm run
test:gateway`) returned **30 × 200 and 34 × 429**, and every 429 included
`Retry-After`. Thus the observed window admitted 30 requests before/while
limiting began and did enforce the required 429 contract; the repository’s
documented policy is 20 requests/s with a burst of 40. No sign-in is present.

## Deployment identity

Fresh local build and production SHA-256 values match exactly:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `8edf6d54da690ab60d042a593137309cff8b778b854ec967522afd3f33d8dfd2` |
| `sw.js` | `47eefab06ee1221eaaa511c5e3e5e6e757fd1e87adeea4c33322d30629ada66f` |
| `manifest.webmanifest` | `4ebc90dccb0cdf35b077a5b9169a524e12e8f6f1e83c395af214d509206f2703` |
| `assets/index-XMiF8uz7.js` | `600bbcf75c469b7ddd42e944c67b04cde014bbdb2fbd139ba533a33324a7b71e` |
| `assets/index-XotKwyqo.css` | `a727dad55fa11beefb529731b11f7ef99508b16c88a6cf7a20253609f7fb924d` |

## Scope

This is a static PWA, not a package, CLI, or product backend. No consumer-pack
test applies. No product code was modified during verification.
