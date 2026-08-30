# Audio Range Cartographer — repair 4 handoff

Work order: `audio-range-cartographer-repair-4`
Base verifier report: `684c52f525eee9ee3137fb36355bec522d165a15`
Repaired source commit: `eaef2300104bccacc04c1c7ded9bed011f138cf2`
Production URL: <https://audio-range-cartographer.sociobot.in>
Verified and deployed: 2026-08-30 UTC

## Release status: PASS

All findings from independent verification 3 are repaired. The PWA remains a static,
local-first deployment; no product scope or successful behavior was removed.

## Repairs

1. **44 px mobile targets:** Workspace footer links are now inline-flex controls with
   a minimum 44 px height and horizontal padding. The static legal documents receive
   the same treatment for their header and footer links. At a 390 × 844 iPhone 13
   viewport, workspace Privacy, Terms, and Param Factory are respectively
   `63.1 × 44`, `54.3 × 44`, and `108.8 × 44` CSS px.
2. **Terms horizontal overflow:** The static legal stylesheet uses narrow-screen
   heading sizing and safe word wrapping. `/terms/` now has a 390 px document width;
   its h1 is a 342 px box with a 342 px scroll width (previously 395 px document
   width and a 371 px unbroken heading inside 342 px).
3. **Regression coverage:** `tests/e2e/app.spec.ts` now includes
   `@regression:mobile-footer-terms`. It asserts all visible workspace and static
   legal navigation targets are at least 44 × 44 at 390 px and that the deployed
   static Terms document and h1 cannot overflow its visual viewport. It runs in both
   Chromium desktop and the 390 × 844 mobile project.

## Local verification

Clean install and gates:

```sh
npm ci                         # 178 packages, 0 vulnerabilities
npm run typecheck              # pass
npm run lint                   # pass
npm test                       # 5/5 Vitest tests
npm run build                  # pass; writes dist/
npm run test:e2e               # 14/14 Playwright tests
```

The production build is 41,563 B JavaScript (14,080 B gzip) and 16,592 B CSS
(4,560 B gzip); the largest shipped image is 83,930 B. No third-party runtime
scripts or fonts are loaded. Package/consumer testing is not applicable: this is a
static PWA, not a published package.

Additional focused evidence:

- `/opt/fleet/lib/verify-url.sh` passed for local `/`, `/privacy/`, and `/terms/`:
  HTTP 200, title, `lang=en`, one h1, a main landmark, image alt coverage, and zero
  browser console/page errors.
- Axe 4.10.2 found zero serious or critical issues on those three routes at desktop
  and 390 × 844 mobile sizes.
- Existing keyboard coverage moved a selected emitter from X 50 to X 51 using Arrow
  Right; the full browser suite passed it on both projects.
- Normal sample-data use made six requests, all to the same origin. No analytics,
  advertising, third-party fonts/scripts, or project-data upload occurred.
- Offline reload passed after clearing only Chromium's HTTP cache and setting the
  browser offline. A separate two-build update exercise rolled the cache from
  `arc-147d03a5aefd` to `arc-09276efd988a`, showed the update toast, and produced no
  browser errors.

## Deployment and live verification

Built `dist/` was deployed to the configured Azure Static Web App
`sf-audio-range-cartographer` production environment using the factory-managed Azure
identity and the repository's `public/staticwebapp.config.json`. Azure confirmed the
deployment at `https://jolly-mushroom-06b69a50f.7.azurestaticapps.net`; the custom
production domain serves the same release.

The following local-to-live SHA-256 identities match exactly:

| Route / artifact | SHA-256 |
| --- | --- |
| `/` | `f286b9f3aa0ece9b7e7b3c78ed0c8493897650dbd25e659e1b166b067658438c` |
| `/legal.css` | `b5046df134da5594a311f0b196fcfef26a9cc4e237c2ee7d4a861ad0d46d3da2` |
| `/manifest.webmanifest` | `4ebc90dccb0cdf35b077a5b9169a524e12e8f6f1e83c395af214d509206f2703` |
| `/sw.js` | `fb59d92a6fb5d964e44e068c1b40eb4e1f6784f7ce3bc279497629143a93748b` |
| `/assets/index-kHrOfdNX.css` | `4cbd38aaa44f57de893dc56be86063c02d9fa6a541b0e363c8656a8fc186f4c5` |
| `/assets/index-jDmKMV8L.js` | `66733b0175a4f31ee66a2155e17b615ddbdbf4216a96f3f1d0ecba468d6cd28a` |
| `/terms/` | `925d674b75ab134fb235720fe8b5f52d6288b504644c424ea7b63b08d9ef6b88` |
| `/privacy/` | `d5513503a929f585324bf2584232e29537803dcda96310138a6d4dfe0d4e4919` |

Live mobile browser verification repeated the footer and Terms measurements above,
reported zero console/page errors and zero Axe serious/critical violations across
`/`, `/privacy/`, and `/terms/`, observed same-origin-only normal use, and confirmed
an offline service-worker reload with the visible offline badge.

Live headers retain HSTS, the narrow CSP (including `frame-ancestors 'none'` as a
response header), COOP, CORP, `X-Frame-Options: DENY`, `nosniff`, strict referrer
policy, and the restrictive Permissions-Policy. Hashed JS/CSS are immutable for one
year; the worker and manifest are `max-age=30, must-revalidate`.

Lighthouse 13.4.1 mobile against production scored Performance 100, Accessibility
100, Best Practices 100, and SEO 100; FCP 1.1 s, LCP 1.3 s, TBT 0 ms, CLS 0, and
interactive 1.3 s. Chromium emitted its known non-fatal tab-teardown warning after
the report data was written; the command exited successfully with the scores above.

## Known gaps and next steps

No known release-blocking gaps. The app is live on the production custom domain.
