# Independent verification 4 — Audio Range Cartographer

**Result: FAIL — do not release candidate
`c58cdf813e342ff169f8c9adcbe2fa3e2de2d7b4`.**

Verified 2026-08-30 UTC from a clean checkout at the candidate and against
<https://audio-range-cartographer.sociobot.in>. This is not a deployment-only
failure: the deployed HTML, JavaScript, and stylesheet SHA-256 values exactly
match a fresh production build of this commit. The core map tool is functional,
but the release fails mandatory claims and demo-sandbox gates.

## Release-blocking defects

### P1 — required `.factory/claims.json` is absent

The mandatory first check, `sed -n '1,240p' .factory/claims.json`, failed with
`No such file or directory` in the clean checkout. There were consequently no
listed claim commands to run from the demo entry point, and no observable tests
for prominent claims including offline operation and local-only data.

This alone is release-blocking under the claims contract. The page and README
make claim-like statements such as “Local-first. Your level data never leaves
this device”, “works after the first load”, and export/privacy assertions, but
none are registered and tested in a claims manifest.

### P1 — the required one-click isolated demo does not exist

Fresh live desktop and 390 px contexts opened `/?demo=1`. That URL merely
opens the ordinary empty onboarding; it does not seed the sample. The only
sample action is labelled **“Explore sample”**, not the mandated visible
**“Try it with sample data”** action. The screen contains neither the required
“Demo — sample data, nothing is saved” banner nor **Reset demo** or **Start for
real** controls.

After clicking “Explore sample”, `indexedDB.databases()` reports the ordinary
`audio-range-cartographer` database (version 1), while there is no separate
demo namespace. Thus sample work is persisted in the same storage used by real
projects. `.factory/demo.md` is also absent. This violates the demo-sandbox
contract and prevents reliable clean-state claims verification.

### P1 — first-read landing screen fails the plain-words acceptance test

On a cold live load the first screen says “See the soundscape before you play
it” and “Place emitters, compare labelled attenuation models, and catch
coverage problems on a reviewable map.” It explains a broad activity but does
not say it is for indie game sound designers (or another audience). Its first
sample action is “Explore sample”, which does not plainly say what happens or
meet the required action wording. Therefore a cold visitor cannot learn all of
what it does, for whom, and what to click first in the required plain words.

### P1 — rate-limit allowance for the product’s unlock endpoint is neither documented nor verified

The static app calls
`https://api.sociobot.in/api/v1/products/audio-range-cartographer/verify` for a
Pro license. No documented request allowance or test exists in the repository
(`rg` found no rate-limit/429/Retry-After documentation). A single
invalid-token request returned `200 {"valid":false,"reason":"invalid","expires_at":null}`
with no `Retry-After`; because no allowance is published, it is not possible to
verify the required “past the allowance gives 429 + Retry-After” behavior. This
remains an unmet explicit acceptance requirement.

## Passing evidence

### Clean local gates

| Check | Result |
| --- | --- |
| Initial checkout | Clean and exactly `c58cdf813e342ff169f8c9adcbe2fa3e2de2d7b4` |
| `npm ci` | PASS — 178 packages, 0 audit vulnerabilities |
| `npm test` | PASS — 5/5 Vitest tests |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS — produces `dist/` |
| Playwright, Chromium | PASS — 7/7 |
| Playwright, 390 × 844 mobile | PASS — 7/7 |

The normal combined `npm run test:e2e` invocation began 14 tests, but its tool
output was interrupted before its summary. I re-ran each configured project in
isolation: 7/7 Chromium and 7/7 mobile passed, for the same 14 tests with a
conclusive result.

The fresh build initial JS is 41,563 B (14,080 B gzip) and CSS is 16,592 B
(4,560 B gzip), within the static-product budgets. No third-party font or
runtime script is loaded.

### Independent end-to-end exercise

On live desktop and 390 px mobile, the normal sample map loaded three realistic
emitters. Free JSON, CSV, SVG, and PNG exports downloaded successfully:

| Artifact | Observable evidence |
| --- | --- |
| JSON preset | `harbor-approach.json`, 959 B, valid project JSON |
| CSV | `harbor-approach.csv`, 290 B, header plus three emitters |
| SVG map | `harbor-approach.svg`, 2,411 B, labelled SVG markup |
| PNG map | `harbor-approach.png`, 106,700 B, valid PNG signature |

Boundary and recovery checks passed: maximum range `999999` clamps to `480`,
X `-50` clamps to `0`, and inner range `-10` clamps to `0`. An invalid
CSV reports `CSV is missing the “name” column. Required: name, x, y.` while the
selected `Dock machinery` map remains intact. An HTML-like emitter name is
displayed as text and creates no image element. Keyboard Arrow Right moved the
selected emitter from X 0 to X 1.

### Accessibility, responsiveness, and errors

Live axe-core 4.10.2 scans of `/`, `/privacy/`, and `/terms/` at desktop and
390 × 844 mobile reported **zero serious or critical findings**. Each route has
one h1, one main landmark, `lang="en"`, an appropriate title, and no horizontal
overflow at 390 px. The skip link becomes visible when focused. Browser console
and page-error logs were empty for every checked route and product exercise.

With `prefers-reduced-motion: reduce`, the live button and map transition
durations compute to `1e-05s`.

### PWA, privacy, headers, and deployment identity

Live service-worker cache `arc-54faf8466ea1` contained the application shell,
hashed JS/CSS, images, manifest, icon, legal pages, and offline page. After
clearing only the ordinary HTTP cache and taking Chromium offline, reloading
rendered the h1 and visible `Offline · changes stay local` badge with no errors.
A local persistent-profile two-build check observed the in-app `An app update
is ready. Reload to use it.` toast and Reload action.

During a fresh normal sample flow, the only outgoing requests were same-origin:
the document, hashed JS/CSS, icon, same-origin connectivity probe, and responsive
landscape image. There were no analytics, advertising, CDN font/script, or
project-data requests. This observed behavior is positive evidence, but it does
not replace the missing claims test.

The root response and supporting routes return 200 with HSTS, `nosniff`, strict
referrer policy, CSP (`frame-ancestors 'none'` as a response header), COOP, CORP,
and restrictive Permissions-Policy. Hashed assets are
`public, max-age=31536000, immutable`; HTML, manifest, and worker are
`public, max-age=30, must-revalidate`.

Fresh local and live SHA-256 identities match exactly:

| Artifact | SHA-256 |
| --- | --- |
| `/` / `dist/index.html` | `f286b9f3aa0ece9b7e7b3c78ed0c8493897650dbd25e659e1b166b067658438c` |
| `/assets/index-jDmKMV8L.js` | `66733b0175a4f31ee66a2155e17b615ddbdbf4216a96f3f1d0ecba468d6cd28a` |
| `/assets/index-kHrOfdNX.css` | `4cbd38aaa44f57de893dc56be86063c02d9fa6a541b0e363c8656a8fc186f4c5` |

## Required remediation and re-verification

1. Add `.factory/claims.json` with one clean-demo observable test per claim,
   including offline reload, exports, local-only request logging, and any stated
   quantitative assertion. Run every listed command successfully.
2. Implement `/?demo=1` (or `/demo`) as an isolated sample-data namespace; add
   the persistent demo banner, Reset demo, Start for real, required plain sample
   action, and `.factory/demo.md`.
3. Rewrite the first screen in plain words to name the indie game sound-designer
   audience, what map they produce, and what the sample action does.
4. Publish the unlock API allowance and add a controlled verification that one
   client receives 429 with `Retry-After` after exceeding it.
5. Re-run all claim tests from a clean clone plus the local/live checks above.

