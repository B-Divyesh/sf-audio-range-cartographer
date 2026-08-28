# Audio Range Cartographer — verification handoff

Work order: `audio-range-cartographer-verify-2`
Candidate: `d6427bed36cbe666e1720ba00f88f7ace0636e8b`
Verified URL: <https://audio-range-cartographer.sociobot.in>
Detailed evidence: `.factory/verification-2.md`

## Release status: **FAIL**

Do not release this candidate. A core editor state with an emitter has a serious
axe `nested-interactive` violation: focusable emitter marker controls are nested
inside `#range-map[role="img"]`. This is a WCAG 4.1.2 failure and violates the
factory requirement for zero serious/critical axe findings.

## What passed

- Clean install, typecheck, lint, Vitest (5/5), production build, and repository
  Playwright suite (12/12) pass.
- The exact live JS/CSS assets match the candidate build by SHA-256.
- Normal map creation/import/export, invalid-import recovery, local persistence,
  desktop/390px keyboard operation, cache-cleared offline reload, privacy,
  headers, caching policy, and bundle budgets pass.

## Defects and next steps

1. **P1 release blocker:** make the interactive map semantics compatible with
   focusable marker buttons (or place those controls outside the SVG image role),
   then add populated-map axe tests for desktop and mobile.
2. **P2:** the visible offline badge remains hidden after the tested offline
   reload, although the cached application does load. Make offline feedback
   reliable independent of `navigator.onLine` under that recovery path.

After a P1 fix, rerun `npm ci && npm run typecheck && npm run lint && npm test &&
npm run build && npm run test:e2e`, verify the deployed hashes, run axe after
adding/importing an emitter, and repeat the live offline reload check.
