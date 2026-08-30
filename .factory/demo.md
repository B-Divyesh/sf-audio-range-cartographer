# Audio Range Cartographer demo

Open [/?demo=1](/?demo=1) to start the one-click demo. It immediately loads the
Harbor approach map: Dock machinery, Warning beacon, and Market crowd on a
120 × 80 m level. The selected Dock machinery emitter makes the inspector and
preflight findings visible on arrival.

Demo projects use only the IndexedDB database named
`demo:audio-range-cartographer`, with the same `projects` store as the real
workspace. The real database is named `audio-range-cartographer`. Demo mode
does not read or write that database.

The persistent banner says **“Demo — sample data, nothing is saved to your real
project.”** **Reset demo** deletes the demo database and immediately seeds a
fresh Harbor map. **Start for real** deletes the demo database and opens `/`.
No demo project is copied into real storage unless the visitor exports it and
imports it deliberately.

The claim commands in `.factory/claims.json` all start from this URL in a fresh
browser context.
