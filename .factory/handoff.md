# Audio Range Cartographer — repair 7 handoff

## Independent verification 7: FAIL (release blocked)

Candidate `774d4c0a5ea3e701ee8a6f1e6a4898c30c203562` is deployed and its static
artifacts exactly match a clean local build. All claimed workflows, local gates,
privacy/accessibility checks, offline reload, and license-verification rate
limit checks passed. **Do not release:** the advertised live $12 Pro purchase
link, `https://api.sociobot.in/api/v1/products/audio-range-cartographer/checkout`,
returns HTTP 500 (`{"error":"Internal server error","status":500}`), both
directly and after the live dialog link is clicked. This is a P1 broken paid
checkout and dead live link. Repair the Sociobot billing/product configuration,
then rerun the live checkout and verification. Full independent evidence is in
`.factory/verification-7.md`. The fresh Lighthouse performance trace could not
complete in this verifier's Chromium environment; the report records this and
the measured bundle sizes rather than claiming a Lighthouse score.

## Builder repair status: PASS (superseded by independent verification 7)

Work order: `audio-range-cartographer-repair-7`

Verifier report repaired: `fac6dbf93ec3fd8332dba68eb7e467eccf0b9e51`

Reported candidate: `963ee45b927cabc0d5bedd182001a2b6054ded4d`

Repair commits: `c30867d` (`fix: make PWA build reproducible`) and
`0861e31` (`docs: clarify license retry behavior`)

Deployed: 2026-08-30 UTC

Deployment ID: `e299521a-f785-4ab4-93d0-79d5cf689eea`
Production: <https://audio-range-cartographer.sociobot.in>

The static, local-first PWA and its existing demo, import, export, accessibility,
offline, and privacy behavior are preserved. No product data is sent off-device
during the normal workflow.

## Repaired findings

1. **Deterministic service-worker build identifier (P2):** `vite.config.ts`
   now hashes each precached URL and its built bytes. It no longer uses
   `Date.now()`. A public file changing without a hashed filename also changes
   the cache name. `emptyOutDir: true` makes each production build clean.
   `npm run test:static` performs two clean builds, fingerprints every `dist/`
   path and byte, and fails if they differ. The final fingerprint was
   `e3e7ea4fa5a71bb01e369fe7a6f0f8813f5cba63f4fa2fd53239980d223a7f79`.
   Unit/static coverage additionally rejects a time-derived worker identifier.

2. **Shared license-gateway expectation (P1):** First reproduced the exact
   verifier observation: six immediate fresh invalid-token requests all returned
   HTTP 200 with no `Retry-After`. That six-request batch is below the shared
   operator policy and is no longer treated as a product failure. The policy is
   documented internally as 20 requests/second with a burst of 40, and is
   expressly operator-gated in `.factory/license-verification.md`.
   `SOCIOBOT_OPERATOR_GATEWAY_CHECK=1 npm run test:gateway` sends 64 concurrent
   fresh invalid tokens (therefore crossing the documented burst) and requires
   an upstream `429` with `Retry-After`. It passed with `200:18, 429:46`, all
   46 limited responses carrying `Retry-After`.

   Product copy promises only what is observable: the browser's five-check
   local pacing and an upstream retry time when the browser can read it. It does
   not advertise a shared gateway threshold. `@claim:license-check-pacing`
   proves five routed checks then the local sixth-check wait. The new
   `@regression:license-upstream-retry-after` test provides a CORS-readable
   upstream `429` with `Retry-After: 7`, verifies the exact seven-second notice,
   and confirms the free demo remains usable. A missing or unreadable upstream
   header gives the honest temporary-unavailable notice instead of inventing a
   wait period.

## Verification

From a clean `npm ci` install:

```sh
npm test                 # 10/10
npm run typecheck        # pass
npm run lint             # pass
npm run test:static      # pass; two byte-identical clean builds
npm run test:e2e         # 30/30; Desktop Chromium + 390 × 844 mobile
SOCIOBOT_OPERATOR_GATEWAY_CHECK=1 npm run test:gateway  # pass; 64-request operator burst
```

All nine commands referenced by `.factory/claims.json` were also executed
individually from the clean install and passed in both browser projects:
`core-workflow`, `keyboard-marker`, `invalid-import`, `demo-sandbox`,
`map-exports`, `local-project-data`, `offline-reload`, `pro-price`, and
`license-check-pacing`.

The PWA is a static product, not a published package or consumer library, so
package/consumer testing does not apply.

Additional local browser evidence:

- `/opt/fleet/lib/verify-url.sh` passed for `/`, `/?demo=1`, `/privacy/`, and
  `/terms/`: all have a title, `lang=en`, one h1, a main landmark, alt coverage,
  named controls, and no console/page errors.
- The repository's Playwright AxeBuilder checks plus a live AxeBuilder demo scan
  found zero serious/critical violations. (The standalone Axe CLI could not
  locate a Chrome binary in this container; the pinned Playwright Chromium
  integration is the exercised accessibility verifier.)
- The browser suite covers keyboard marker movement, 44 px touch targets,
  reduced motion, invalid imports, request privacy, export/downloads, and a
  separate-context service-worker offline reload.

## Live production verification

- `verify-url.sh` passed again for `/`, `/?demo=1`, `/privacy/`, and `/terms/`.
- A live desktop demo had zero browser errors and five same-origin requests;
  it made no third-party project-data request. The live AxeBuilder scan found
  zero serious/critical violations.
- At 390 px, `scrollWidth` was 390 px. Reset demo and Start for real each
  measured 165 × 44 CSS px.
- The worker controlled the page, had an active worker and no waiting update.
  After HTTP-cache eviction and `context.setOffline(true)`, reload kept Dock
  machinery and the `Offline · changes stay local` state visible.
- The live response has the configured CSP, `frame-ancestors 'none'`, HSTS,
  `nosniff`, COOP, CORP, Permissions-Policy, and strict-origin referrer policy.
  `/repair7-not-found` returns HTTP 404.
- Lighthouse 13 mobile demo: Performance **100**, Accessibility **100**, Best
  Practices **100**, SEO **100**; FCP 1.1 s, LCP 1.1 s, TBT 0 ms, CLS 0.

## Deployment identity

The final live artifacts exactly match the clean local build:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `8edf6d54da690ab60d042a593137309cff8b778b854ec967522afd3f33d8dfd2` |
| `sw.js` | `47eefab06ee1221eaaa511c5e3e5e6e757fd1e87adeea4c33322d30629ada66f` |
| `manifest.webmanifest` | `4ebc90dccb0cdf35b077a5b9169a524e12e8f6f1e83c395af214d509206f2703` |
| `assets/index-XMiF8uz7.js` | `600bbcf75c469b7ddd42e944c67b04cde014bbdb2fbd139ba533a33324a7b71e` |

## Known operator follow-up

The live shared gateway returns `429` and `Retry-After` after a true burst, but
its CORS response currently does not expose `Retry-After` to browser JavaScript.
The app safely falls back to an availability notice in that case; it never
fabricates a retry duration and the free workspace remains available. If the
operator wants the browser to display the upstream wait time, the gateway must
also send `Access-Control-Expose-Headers: Retry-After`. This is outside the
static product repository and is not represented as a visitor-facing gateway
policy claim.
