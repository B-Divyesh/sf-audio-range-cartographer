# Audio Range Cartographer

An offline-first spatial-audio planning workbench for indie game sound designers.
Import emitter coordinates, place or drag ranges on a level field, compare explicitly
labelled attenuation models, review likely coverage problems, and export a map that can
travel with a level review.

Live: <https://audio-range-cartographer.sociobot.in>

## Try the demo

Open <https://audio-range-cartographer.sociobot.in/?demo=1> or choose **Try it
with sample data** on the first screen. The Harbor approach sample opens in the
separate `demo:audio-range-cartographer` IndexedDB database. **Reset demo**
starts that sample again. **Start for real** deletes demo storage before opening
your empty workspace. See `.factory/demo.md` for the sample and storage details.

## What v1 does

- Imports JSON projects or CSV emitter lists without sending files to a server.
- Places and keyboard-nudges emitters on a scalable SVG coordinate field.
- Visualizes inner/full-volume and maximum audible ranges using linear, inverse, or
  exponential map semantics. These are deliberately engine-neutral estimates.
- Flags clipped ranges, unusually narrow or map-wide fields, and strong overlaps.
- Persists the current map in IndexedDB and works after the first load without a network.
- Exports labelled PNG and SVG maps plus portable JSON and CSV data.
- Offers a $12 one-time Pro license through Sociobot for 4× PNGs and local checkpoints.
  The free workspace has unlimited emitters and all core export formats.

Audio playback, DAW features, engine-specific acoustic simulation, and AI audio generation
are intentionally out of scope.

## Import formats

CSV requires `name,x,y`. Optional columns are `innerRadius`, `maxDistance`, `curve`,
`color`, and `notes`.

```csv
name,x,y,innerRadius,maxDistance,curve,notes
Fountain,12,8,2,14,inverse,Stone courtyard loop
```

JSON accepts the same emitter properties inside a project envelope:

```json
{
  "title": "Atrium",
  "width": 40,
  "height": 30,
  "unit": "m",
  "emitters": [
    { "name": "Fountain", "x": 12, "y": 8, "innerRadius": 2, "maxDistance": 14, "curve": "inverse" }
  ]
}
```

Imports are limited to 1 MB and 200 emitters. Invalid data is reported without replacing
the open project.

## Develop and verify

Requires a current Node.js LTS release.

```sh
npm ci
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
npm run test:static
npm run test:e2e
```

`npm run build` is the exact production build command. It writes the static deployment to
`dist/`, with `dist/index.html` at its root. The Playwright suite uses the pinned 1.58.2
browser API and verifies Chromium desktop, a 390px mobile viewport, offline reload,
downloads, keyboard operation, and axe accessibility checks.

The production build generates `dist/sw.js` from Vite's asset manifest. It precaches every
hashed application script and stylesheet before the first offline reload, uses a content-derived
cache version, and removes only prior Cartographer caches on activation. `npm run test:static`
rebuilds twice and requires byte-identical output. The static-host
response policy lives in `public/staticwebapp.config.json`: hashed assets are immutable for a
year, while HTML, the manifest, and the worker are short-lived and revalidated.

Every visitor-facing claim is registered in `.factory/claims.json`. Run each listed command
from a clean install, or run the complete browser suite with `npm run test:e2e`.

## Privacy and licensing

Project data and snapshots stay in browser storage. There are no analytics, ads,
third-party fonts, or CDN scripts. Only a Pro license token is sent to the Sociobot API for
verification. Checkout is hosted by Sociobot/Dodo; no payment provider is embedded here.

The browser pauses a sixth license check after five attempts in one minute. This is a
local safeguard, not a billing-server response; server 429 responses use their supplied
retry time. See `.factory/license-verification.md` for the exact behavior and regression
coverage.

The application source is available under the [MIT License](LICENSE). Product research,
visual rationale, and handoff notes live in `.factory/`.
