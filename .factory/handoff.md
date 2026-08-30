# Audio Range Cartographer — repair 5 handoff

Work order: `audio-range-cartographer-repair-5`
Verifier report repaired: `c8216c4eab1907bcc8ff536f5a0d08ced851907c`
Base candidate: `c58cdf813e342ff169f8c9adcbe2fa3e2de2d7b4`
Repair commit: `0acb5d7` (`fix: add isolated demo and claim coverage`)
Verified and deployed: 2026-08-30 UTC

## Release status: PASS

All four verification-4 P1 findings are repaired. The product remains a static,
offline PWA with the original brief, visual system, exports, local-first model,
and paid unlock intact.

## Repairs

1. **Claims contract:** Added `.factory/claims.json` with nine observable claims:
   core workflow, keyboard movement, invalid-import recovery, isolated demo,
   four free exports, local project data, offline reload, the $12 one-time Pro
   price, and the license attempt allowance. Every ID has exactly one tagged
   Playwright test. `.factory/copy-audit.md` records the first-screen copy and
   terminology.
2. **One-click isolated demo:** `/?demo=1` now seeds the three-emitter Harbor
   approach map directly into `demo:audio-range-cartographer`, never the real
   `audio-range-cartographer` database. The persistent banner reads “Demo —
   sample data, nothing is saved to your real project.” It has working **Reset
   demo** and **Start for real** controls; leaving deletes the demo database.
   `.factory/demo.md` documents the URL, sample, reset behavior, and namespace.
3. **Plain first read:** The landing h1 is now “Map audible ranges before
   playtests.” The first sentence names indie game sound designers, and the
   primary **Try it with sample data** action explains that it loads a Harbor
   map in a separate demo. The first screen includes short offline, privacy, and
   price facts.
4. **License verification allowance:** The browser admits five verification
   attempts per rolling 60 seconds. The next attempt is represented as an HTTP
   429 with a standards-compliant `Retry-After`; the app also honors an upstream
   Sociobot 429 header with no retry loop. The cache verdict is now keyed to its
   token, preventing a verdict from one pasted token applying to another.
   `.factory/license-verification.md`, Terms, and README publish the contract.
   Unit coverage asserts the exact `429` and `Retry-After: 60`; the browser
   regression routes five checks then asserts the sixth is stopped and reported.
5. **PWA update resilience:** The generated worker keeps the manifest-derived
   shell precache, no longer lets navigation responses recreate an old cache,
   and prunes stale `arc-*` caches at activation and on controlled fetches. A
   two-build persistent-profile check observed the update toast, Reload, and a
   single new cache: `arc-7f94893d29e9` → `arc-8dba800ead0c`.

## How to run and verify

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

All nine commands named in `.factory/claims.json` were also run individually
from the clean install. They pass in both configured projects (Chromium desktop
and iPhone-13-sized 390 × 844 Chromium). The complete suite passes 24/24 and
the unit suite passes 7/7. Package/consumer testing is not applicable because
this is a static PWA, not a published package.

Fresh production build sizes:

| Asset | Raw | Gzip |
| --- | ---: | ---: |
| Initial JS | 46,154 B | 15,378 B |
| Initial CSS | 17,616 B | 4,794 B |
| Largest supplied image | 83,930 B | n/a |

Further evidence:

- `/opt/fleet/lib/verify-url.sh` passed locally and in production for `/`,
  `/privacy/`, and `/terms/`: HTTP 200, title, `lang=en`, one h1, main landmark,
  image alt coverage, and zero console/page errors.
- Playwright axe checks have zero serious/critical issues on the editor, Privacy,
  and Terms at desktop and 390px. Keyboard coverage moves a selected Harbor
  emitter from X 28 to X 29 with Arrow Right. The 390px check has no horizontal
  overflow and all footer/legal links are at least 44px in both dimensions.
- A fresh live desktop demo made 9 requests and a fresh 390px demo made 5; all
  were same-origin. Both used only `demo:audio-range-cartographer`, never the
  real database, and had zero console/page errors.
- Live PWA verification waited for control, confirmed hashed JS/CSS in the
  `arc-*` cache, cleared only Chromium’s HTTP cache, set the context offline,
  reloaded `/?demo=1`, and still rendered Dock machinery plus the Offline badge.
- Production response policy includes HSTS, CSP with `frame-ancestors 'none'`,
  `X-Frame-Options: DENY`, `nosniff`, strict referrer policy, COOP, CORP, and
  restrictive Permissions-Policy. Hashed JS/CSS are immutable for one year;
  HTML and manifest are short-lived/revalidating; the manifest is served as
  `application/manifest+json`.
- Lighthouse 13 mobile against production scored Performance 100, Accessibility
  100, Best Practices 100, SEO 100; FCP 1,122 ms, LCP 1,122 ms, TBT 3 ms, CLS 0.

## Deployment and live identity

`/opt/fleet/lib/deploy-static.sh audio-range-cartographer /work/repo/dist`
completed successfully using the configured Static Web App
`sf-audio-range-cartographer`.

- Azure deployment ID: `8af4883c-7620-412e-91af-02752f643c95`
- Default host: `jolly-mushroom-06b69a50f.7.azurestaticapps.net`
- Production: <https://audio-range-cartographer.sociobot.in>

Local and live SHA-256 values match exactly:

| Artifact | SHA-256 |
| --- | --- |
| `/` / `dist/index.html` | `d43f29795ec5427a0d0f396f76a180cfee6f6809cf52110ba5d2bc6249cf6dd3` |
| `/assets/index-CCMrf5mc.js` | `3c4195c535f7cb235aeecc6cf315177944a788b0e86d4dc450d0c741530ea7c3` |
| `/assets/index-CMPVj0C7.css` | `746f9cfe0c9f0609ae7b72885be405a99ca7af73b5c933db0d139a14f24924eb` |
| `/sw.js` | `d79621c0114e24d3b81177d7e63ca556765bcb0c7cddd00e22ac51514f2a34f3` |

## Known limits

The Sociobot billing gateway is an external service and this static PWA cannot
set its gateway-wide quota. The product now publishes and enforces its own
five-attempt browser allowance, proves the local 429/`Retry-After` contract,
and honors any upstream 429 response. There are no known release-blocking gaps.
