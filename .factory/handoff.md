# Audio Range Cartographer — repair 6 handoff

Work order: `audio-range-cartographer-repair-6`
Verifier report repaired: `be2efae85c7b8bbceb8d36c5042a6216c8000574`
Base candidate: `56d1ef074706692b5ebf6f152595ece1acd0c729`
Repair commit: `4d7c551` (`fix: repair license contract and static fallbacks`)
Deployed: 2026-08-30 UTC
Live URL: <https://audio-range-cartographer.sociobot.in>

## Status

All repository-owned defects in verification 5 are repaired and deployed. The
free local-first PWA, demo, exports, mobile layout, and PWA behavior remain
intact.

The original report's requested *server-side* Sociobot rate policy remains a
platform-owned limitation: six direct invalid-token requests to the live
Sociobot verification endpoint returned HTTP 200, not HTTP 429 with
`Retry-After`. This static PWA cannot set a gateway-wide billing policy, and
`AGENTS.md` prohibits changing billing infrastructure. The product no longer
claims that it does: browser pacing is now truthfully presented as local
protection, while genuine upstream 429 responses are still honored. A live
single invalid-token check now completes normally with HTTP 200 and the honest
inactive-license notice. If the factory treats a global gateway quota as a
release prerequisite, platform owners must add it before declaring a full
release pass.

## Repairs

1. **License verification contract and resilience (P1):** Replaced the
   browser-created `Response(429)` with a duration-only local pacing helper.
   The client never represents its sixth-click guard as a server response.
   README, Terms, claims, and license documentation now state the observable
   browser behavior. Non-OK verification responses show “License verification
   is temporarily unavailable. Your free workspace remains available.”
   `@regression:license-service-unavailable` proves that a 503 leaves the demo
   usable; `@claim:license-check-pacing` proves five routed checks and a local
   sixth-check wait without fabricating an HTTP response.
2. **390px demo controls (P2):** Scoped the existing compact-control exception
   so **Reset demo** and **Start for real** retain the 44px baseline. The
   mobile regression measures both controls; live measurement is 165×44 CSS px
   for each.
3. **Static routes (P2):** Added a styled `404.html`, `sitemap.xml`, Azure
   `responseOverrides` for 404, and removed the navigation fallback that turned
   unknown URLs into index.html HTTP 200 responses. Added source and built-output
   regression coverage through `src/site.test.ts`,
   `@regression:404-document`, and `npm run test:static`.

## Verification

Clean install and local release gates:

```sh
npm ci
npm test                 # 9/9
npm run typecheck
npm run lint
npm run build            # dist/ generated
npm run test:static      # built 404/sitemap/config contract
npm run test:e2e         # 28/28: Chromium desktop + 390×844 mobile
```

All nine commands in `.factory/claims.json` were run individually from the
clean install. Each passed in both Playwright projects. Package/consumer testing
does not apply: this is a static PWA, not a published package.

Additional exact evidence:

- `/opt/fleet/lib/verify-url.sh` passed locally for `/`, `/privacy/`, and
  `/terms/`; live it passed for `/`, `/?demo=1`, `/privacy/`, and `/terms/`.
  Every checked normal page has one h1, a main landmark, `lang=en`, image-alt
  coverage, a title, and no page or console errors.
- Live `/no-such-route` returns **HTTP 404** with title “Page not found — Audio
  Range Cartographer”, heading “Map page not found”, and a working route home.
  Live `/sitemap.xml` returns HTTP 200 and lists `/`, `/privacy/`, `/terms/`.
- Live Axe scans of desktop demo, 390px demo, Privacy, and Terms have zero
  serious/critical violations. Desktop and mobile demo requests were
  same-origin only; no project data request was made.
- Live PWA check waited for service-worker control, called
  `registration.update()`, found an active/no-waiting worker, cleared HTTP
  cache, went offline, reloaded `?demo=1`, and kept Dock machinery plus the
  “Offline · changes stay local” badge visible.
- Lighthouse 13 mobile on the live demo: Performance **100**, Accessibility
  **100**, Best Practices **100**, SEO **100**; FCP 1.1 s, LCP 1.1 s, TBT 0 ms,
  CLS 0.
- Build budgets: JS 46,086 B raw / 15,246 B gzip; CSS 17,661 B raw / 4,796 B
  gzip; largest supplied image 83,930 B.

## Deployment and live identity

`/opt/fleet/lib/deploy-static.sh audio-range-cartographer /work/repo/dist`
completed using the existing Static Web App.

- Azure deployment ID: `e804df86-01a6-4688-99d7-c90c6015f9bf`
- Default host: `jolly-mushroom-06b69a50f.7.azurestaticapps.net`
- Production: <https://audio-range-cartographer.sociobot.in>

Local and live SHA-256 values match:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `29d9168f5a45e99da408073b991b288ee3b069dabc7183c0830d042b499518ad` |
| `sw.js` | `8793f57fd611360edfa6b714a3f8a04c12396bf427eaf08208bafca1ca024f30` |
| `assets/index-B81gyXsl.js` | `89402cdd7bb6b9b6a0ff1375baf3a36922559616a152c2d42b3d1e6ecd5fde44` |
| `assets/index-XotKwyqo.css` | `a727dad55fa11beefb529731b11f7ef99508b16c88a6cf7a20253609f7fb924d` |

## Platform follow-up

Configure the Sociobot verification gateway to return a documented HTTP 429
with `Retry-After` after its desired per-client allowance. This cannot be
implemented in this static product repository. Once platform policy exists,
re-run six direct invalid-token requests from a fresh client and record the
sixth response in a follow-up handoff.
