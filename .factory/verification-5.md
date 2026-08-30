# Independent verification 5 — Audio Range Cartographer

**Result: FAIL — do not release candidate `56d1ef074706692b5ebf6f152595ece1acd0c729`.**

Verified independently on 2026-08-30 UTC from a clean checkout at the
candidate and against <https://audio-range-cartographer.sociobot.in>. The
deployed HTML, JavaScript, and CSS match this candidate; this is not an
unexplained stale-deployment failure.

## Release-blocking defect

### P1 — the real license-verification API does not enforce the published allowance

The published contract says one browser gets five license checks in 60 seconds
and the next gets an HTTP `429` with `Retry-After`. The candidate only creates a
`Response(429)` inside browser code before the sixth call; that response is not
from a server-side API.

Fresh direct requests to
`https://api.sociobot.in/api/v1/products/audio-range-cartographer/verify` with
six distinct invalid test tokens all returned **HTTP 503**, with no
`Retry-After` header. A fresh live browser exercised six distinct license
tokens: its first five UI notices were `Could not verify this license. Check your
connection and try again.`; its sixth was locally throttled (`Too many license
checks. Try again in 57 seconds.`). No verification response was observable in
the browser because the gateway request failed.

Therefore the documented server-side request allowance was not observed, the
API did not answer `429`, and the optional paid-license verification flow was
not end to end at verification time. The local guard is worthwhile defense in
depth, but cannot substitute for the required API behavior.

## Other defects

### P2 — two demo controls miss the 44 px mobile touch-target minimum

At the required 390 px viewport, the persistent demo banner's **Reset demo**
and **Start for real** controls each measured 165 × 40 CSS px. The mandatory
mobile/accessibility baseline requires 44 × 44 px targets.

### P2 — the required site fallbacks are absent

There is no `404.html` or `sitemap.xml` in the built product. A live request to
`/no-such-route` returns the normal SPA `index.html` with HTTP 200, rather than
a product-styled 404 page with a route back. This misses the site-structure
contract's real-404 and sitemap requirements.

## Passing evidence

### Required claims test gate

`.factory/claims.json` exists and contains nine claims. From the clean install,
I ran every declared command exactly through the demo-capable Playwright entry
point. All passed in both configured projects (Chromium and 390 × 844 mobile):

| Claim ID | Result |
| --- | --- |
| `core-workflow` | PASS |
| `keyboard-marker` | PASS |
| `invalid-import` | PASS |
| `demo-sandbox` | PASS |
| `map-exports` | PASS |
| `local-project-data` | PASS |
| `offline-reload` | PASS |
| `pro-price` | PASS |
| `license-rate-limit` | PASS — proves the local mock/guard only, not the live API |

The complete local suite also passed: `npm test` (7/7), `npm run test:e2e`
(24/24), `npm run typecheck`, `npm run lint`, and the exact `npm run build`.
The build generated `dist/`; initial JS is 46,154 B raw / 15,378 B gzip and CSS
is 17,616 B raw / 4,794 B gzip, below the PWA budgets.

### First read and core workflow

Cold live first screen, in plain words: it maps audible ranges before
playtests, for indie game sound designers, and asks the visitor to **Try it
with sample data**; the adjacent text says it loads a Harbor map in a separate
demo. This passes the first-read and one-click-demo gates.

On live `/?demo=1`, the Harbor sample loaded three
emitters and three findings. Changing a maximum range, exporting the JSON
preset (`harbor-approach.json`), keyboard movement, and the isolated demo
banner all worked. Boundary/recovery checks on live passed: max range
`999999` became `480`, X `-50` became `0`, inner range `-10` became `0`; an
invalid CSV reported the missing `name` column without replacing Dock
machinery; an HTML-like name rendered as text and injected no image.

### Privacy, PWA, accessibility, and deployment

- A fresh live demo made only same-origin requests: document, hashed JS/CSS,
  icon, and the same-origin connectivity probe. Editing and exporting made no
  project-data request. There were no console or page errors.
- The live service worker controls the page, has cache `arc-953e2930a9f0`, and
  survived HTTP-cache clearing plus offline reload: the Harbor map and
  `Offline · changes stay local` remained visible. `registration.update()`
  completed with an activated worker and no waiting worker.
- Axe 4.10.2 scans of live demo, Privacy, and Terms had zero serious/critical
  violations. The skip link has a visible 3 px focus outline, moves focus to
  `main`, and Guide opens with focus on Close; Escape closes it. Reduced motion
  computes to `1e-05s`. At 390 px there is no horizontal overflow.
- `/opt/fleet/lib/verify-url.sh` passed for `/`, `/privacy/`, and `/terms/`:
  HTTP 200, title, `lang=en`, one h1, main landmark, image alt coverage, and
  no console/page errors.
- Live response headers include HSTS, `nosniff`, strict referrer policy, CSP
  with response-header `frame-ancestors 'none'`, COOP, CORP, restrictive
  Permissions-Policy, and `X-Frame-Options: DENY`. Hashed JS is
  `public, max-age=31536000, immutable`; HTML, manifest, and worker are
  short-lived/revalidating.

Deployment identity is conclusive for source assets:

| Artifact | SHA-256 |
| --- | --- |
| `dist/index.html` / live `/` | `d43f29795ec5427a0d0f396f76a180cfee6f6809cf52110ba5d2bc6249cf6dd3` |
| `dist/assets/index-CCMrf5mc.js` / live asset | `3c4195c535f7cb235aeecc6cf315177944a788b0e86d4dc450d0c741530ea7c3` |
| `dist/assets/index-CMPVj0C7.css` / live asset | `746f9cfe0c9f0609ae7b72885be405a99ca7af73b5c933db0d139a14f24924eb` |

The live worker has the identical precache list but a distinct cache ID because
`vite.config.ts` intentionally derives that ID from `Date.now()` at build time;
this is expected and not a deployment mismatch.

## Required remediation

1. Restore the Sociobot verification service or arrange a documented,
server-enforced five-per-60-second allowance that returns `429` and
`Retry-After` to the sixth live request. Re-test it against the real endpoint;
do not accept a browser-only synthetic response as proof.
2. Increase the demo-banner controls to at least 44 × 44 px at 390 px.
3. Add a styled 404 document/response override and `sitemap.xml`, then verify
unknown URLs respond as a real 404.
