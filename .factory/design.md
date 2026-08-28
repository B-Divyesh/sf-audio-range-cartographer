# Audio Range Cartographer — visual thesis

## Direction: luminous glass data landscape

This is a production instrument, not a marketing dashboard. The map is the luminous
landscape: a near-black drafting field, fine cyan coordinate lines, and translucent
attenuation contours that read like light travelling across a dark game level. Chrome
sits in smoky glass planes around it and recedes until the designer needs a control.
Warm amber is reserved for findings that deserve review, so decoration also explains.

The single-mode dark treatment is intentional. Spatial-audio ranges are easiest to
compare as light fields on a quiet ground, and the dark canvas suits the game-audio
workspaces in which the tool will commonly sit. Every functional color is backed by a
label, pattern, stroke treatment, or icon; no state relies on color alone.

## Palette

| Token | Value | Role |
| --- | --- | --- |
| Midnight | `#071012` | page and installed-app splash |
| Abyss | `#0B1719` | map ground |
| Smoked glass | `#102225E8` | floating surfaces |
| Glass edge | `#315156` | borders and inactive controls |
| Chalk | `#F1F7F4` | primary text |
| Mist | `#A9BDB9` | secondary text (passes 4.5:1 on surfaces) |
| Sonar | `#65F4D0` | primary action, focus, selected range |
| Deep sonar | `#073E36` | accent contrast surface |
| Signal amber | `#FFC76A` | review/warning |
| Coral fault | `#FF8B7B` | invalid/error |
| Mint confirm | `#86E6AE` | saved/success |

Emitter colors come from a controlled, high-contrast spectrum (cyan, violet, amber,
coral, blue, mint). Labels and distinct dash patterns keep overlapping fields legible.

## Type

- **Interface:** `Inter Variable`, self-hosted WOFF2, 400–700. If unavailable during
  build, the native `Inter, ui-sans-serif, system-ui` stack is used without a network
  request.
- **Coordinates:** `JetBrains Mono`, self-hosted WOFF2, 500–700, with tabular figures.
- Scale: 12 / 14 / 16 / 20 / 28 / clamp(34–52) px. Body never drops below 16px.
  Labels may use 12–14px only when redundant with a larger value/control.

## Spacing and shape

An 8px base rhythm with 4px micro-spacing: 4, 8, 12, 16, 24, 32, 48. Controls are at
least 44px tall. Corners use 10px for controls and 18–24px for glass planes; the map is
the sole large continuous surface. One-pixel borders and restrained shadows establish
depth without turning every group into a card.

Desktop uses a three-region workbench: compact header, map, 320px inspector. At phone
width the inspector becomes a normal document section below the map, secondary header
copy disappears, and controls wrap into full-width rows. Nothing is fixed over a safe
area.

## Interaction grammar

- Clicking empty map space places an emitter; dragging a core moves it. Arrow keys move
  the selected map marker by one unit, Shift+Arrow by ten.
- The selected emitter rises with a brighter core and solid range edge. Unselected
  fields use lower opacity and dash patterns.
- All mutations update the map immediately, announce a short status, and save locally
  after a short debounce. Destructive deletion is reversible through a timed Undo.
- Imports open from an explicit control; parse errors explain the accepted schema and
  do not replace the current project.
- Diagnostics use numbered text findings and matching badges on the map.

## Motion

Functional transitions last 160–240ms and animate only opacity or transform: glass
panels settle by 6px, selection cores scale slightly, and the update toast enters from
its origin. There are no looping animations. Under `prefers-reduced-motion: reduce`,
all movement is removed and state changes are instantaneous; depth remains through
stroke, contrast, and layering.

## Asset plan and provenance

The editor itself is rendered as accessible SVG/HTML so exported geometry remains
exact. Hand-authored SVG icons and PWA marks use the sonar-ring motif.

One original raster illustration is used only in the first-run/empty landscape and
as supporting ambience, never as evidence of a capability. Art direction prompt sheet:

> Use case: stylized-concept. Asset type: responsive empty-state landscape for an
> offline spatial-audio mapping utility. A wide top-down isometric abstract game-level
> terrain made of smoky translucent glass slabs, with three luminous concentric sonar
> fields spreading across a precise coordinate grid. No interface screenshot. Dark
> midnight world, cyan/seafoam light, one restrained amber overlap, volumetric but
> crisp studio lighting, etched glass and fine technical line texture, generous dark
> negative space, sophisticated editorial 3D illustration. No people, no characters,
> no real brands, no text, no letters, no watermark, no logos, no generic gradient.

Generation: Azure AI Foundry `factory-image` via the factory image generator, 2026-08-28.
The final PNG source and JSON sidecar live in `assets/src/`; optimized WebP/AVIF outputs
live in `public/assets/`. Generated imagery is original to this product and disclosed
in the footer.

