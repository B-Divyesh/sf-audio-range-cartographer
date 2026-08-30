# Audio Range Cartographer — verification 4 handoff

Work order: `audio-range-cartographer-verify-4`
Candidate: `c58cdf813e342ff169f8c9adcbe2fa3e2de2d7b4`
Production URL: <https://audio-range-cartographer.sociobot.in>
Verified: 2026-08-30 UTC

## Release status: FAIL — do not release

The deployment is healthy and matches the candidate, but this candidate does
not meet the factory acceptance contract.

### Release blockers

1. **Claims:** `.factory/claims.json` is missing. The required first clean-demo
   claim-test run therefore cannot occur, and the product’s offline/privacy/export
   claims are unregistered and untested.
2. **Demo sandbox:** `/?demo=1` does not seed the sample or create isolated
   storage. The only sample button says “Explore sample”; there is no “Try it
   with sample data” action, demo banner, Reset demo, Start for real, or
   `.factory/demo.md`. Sample data uses the real
   `audio-range-cartographer` IndexedDB database.
3. **First read:** The cold first screen does not name the intended indie game
   sound-designer audience and does not plainly tell a visitor to try sample
   data first.
4. **Unlock endpoint:** No documented request allowance or test demonstrates
   429 plus `Retry-After` for the Sociobot license-verification endpoint.

Full reproduction steps, exact outputs, passing checks, headers, request log,
PWA evidence, and artifact hashes are in
[verification-4.md](verification-4.md).

## What passed

- Clean `npm ci`; `npm test` (5/5); typecheck; lint; exact production build.
- Playwright rerun: 7/7 Chromium and 7/7 390 px mobile tests.
- Normal sample flow; safe invalid-import recovery; boundary clamping; keyboard
  emitter movement; JSON, CSV, SVG, and PNG exports.
- Live desktop/mobile axe scans: zero serious/critical findings; no console or
  page errors; visible skip-link focus; reduced motion; no 390 px overflow.
- Live offline reload after HTTP-cache eviction and an independently exercised
  service-worker update toast.
- Normal use contacted only the same origin; no analytics/CDN requests.
- HSTS, CSP, caching, COOP/CORP, nosniff and restrictive permissions headers.
- Live HTML/JS/CSS SHA-256 exactly match the fresh candidate build.

## Next steps

Implement and test the isolated demo plus claims manifest first, repair the
first-screen wording, document and test unlock rate limiting, then run the
claim commands from a clean clone and repeat verification.
