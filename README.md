# Audio Range Cartographer

An offline-first spatial-audio planning workbench for indie game sound designers.
Import emitter coordinates, place or drag ranges on a level field, compare explicitly
labelled attenuation models, review likely coverage problems, and export a map that can
travel with a level review.

Live: <https://audio-range-cartographer.sociobot.in>

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
npm test
npm run build
npm run test:e2e
```

`npm run build` is the exact production build command. It writes the static deployment to
`dist/`, with `dist/index.html` at its root. The Playwright suite uses the pinned 1.58.2
browser API and verifies Chromium desktop, a 390px mobile viewport, offline reload,
downloads, keyboard operation, and axe accessibility checks.

## Privacy and licensing

Project data and snapshots stay in browser storage. There are no analytics, ads,
third-party fonts, or CDN scripts. Only a Pro license token is sent to the Sociobot API for
verification. Checkout is hosted by Sociobot/Dodo; no payment provider is embedded here.

The application source is available under the [MIT License](LICENSE). Product research,
visual rationale, and handoff notes live in `.factory/`.
