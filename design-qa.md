# Design QA — reference-matched 3D gravity fabric

## Comparison setup

- Source of truth: `C:/Users/lorsa/AppData/Local/Temp/codex-clipboard-94950a40-235f-442f-a7af-08161645e24a.png`
- Final implementation: `D:/Projects/gravity viz/screenshots/gravity-fabric-cinematic.png`
- Normalized side-by-side evidence: `D:/Projects/gravity viz/design-qa/comparison-final.png`
- Source frame: 488 × 281.
- Live browser frame: 1357 × 1272; the scene was compared with a 1357 × 781 crop matching the source aspect ratio.
- Compared state: `CLUSTER` preset, `CINEMATIC` mode, trails/links/labels off, pointer idle so the interface recedes.
- Focused-region crops were not useful for this source: it is a single low-resolution, text-free scene and the full-frame crop already preserves every visible fidelity surface.

## Findings and fixes

- **P1 · layout/scene geometry — resolved:** the earlier top-down view exposed a rectangular plane and distributed six equal wells. The final camera sits near the surface, the field extends beyond the frame, and the composition is rebuilt around the reference's large upper-right basin, bright upper-left basin, and smaller lower-right cluster.
- **P1 · behavior/depth — resolved:** body elevation was previously measured from a flat world plane, so objects did not maintain meaningful clearance over a deformed well. Each body now uses the local warped-surface height plus its own clearance; rendering, hit testing, links, and labels share that world position.
- **P1 · image quality — resolved:** the first low-angle shader intersection produced black bands at grazing angles. A bounded ray march with binary refinement now gives continuous cloth, correct body occlusion, and stable horizons.
- **P2 · color/image quality — resolved:** the implementation was too red, crisp, and uniformly illuminated. The palette is now dark plum-brown with localized amber bowls, soft white-hot bodies, copper threads, restrained bloom, and a subtle cinematic blur.
- **P2 · density/content — resolved:** bright trails, many white particles, and visible HUD chrome competed with the reference. Cinematic mode defaults trails off, uses mostly dark flecks, and fades controls until hover or keyboard focus; Analysis mode preserves the explanatory overlays.
- **P2 · line topology — resolved:** crossed grids, projected meshes, and equipotential contours read as several surfaces layered together. Cinematic now renders one horizontal fabric-thread family, while Analysis renders one technical cross-grid; diagnostic labels and tethers remain separate overlays.

## Mandatory fidelity surfaces

- **Fonts and typography:** the reference contains no typography. The app's compact technical labels remain peripheral and disappear at idle in Cinematic mode, so type does not alter the matched composition.
- **Spacing and layout:** the full-bleed simulation occupies the viewport with no plane edge. Dominant wells, negative space, and foreground depth now follow the source's asymmetric visual rhythm; controls remain outside the visual focal path.
- **Colors and tokens:** dark brown/plum base, muted copper threads, amber-orange basins, near-white cores, and dark floating flecks reproduce the source hierarchy without the earlier full-field red cast.
- **Image quality and asset fidelity:** the source is a concept render for an interactive gravity surface rather than a separable production asset. The WebGPU scene recreates its geometry and lighting directly; no placeholder photography, CSS blob, inline SVG imitation, or fake image asset is used.
- **Layout and behavior:** orbit, zoom, presets, mode switching, reset, settings disclosure, body selection, mass, and surface-relative distance remain functional. Cinematic mode prioritizes the visual match; Analysis reveals tethers, labels, axes, links, and L-points.

## Interaction, accessibility, and resilience checks

- Live browser checks covered Cinematic/Analysis switching, the Tune disclosure, body selection controls, and the surface-distance range input.
- Range inputs expose specific accessible names and value text; the selected body's height is announced as distance above the warped surface. Controls retain visible keyboard focus even when the idle HUD is faded.
- The simulation has a descriptive accessible name, semantic buttons expose selected/pressed state, and reduced-motion behavior is retained.
- Desktop visual QA was performed at 1357 × 1272. Existing responsive breakpoints keep the HUD and bottom controls inside the viewport at tablet/mobile widths; no scene content depends on fixed pixel coordinates.
- The final reload introduced no new browser console errors or WebGPU shader validation errors.

## Accepted residual differences

- **P3 · image quality:** the 488 × 281 source has stronger raster softness and compression; the live render remains slightly clearer so moving threads and surface-relative height stay readable.
- **P3 · content:** the interactive Cluster preset retains six bodies instead of the reference's roughly four dominant bodies, but secondary bodies are visually subordinated and the same basin hierarchy is preserved.
- **P3 · behavior:** controls become visible on hover/focus for usability, whereas the supplied still contains no interface.

final result: passed
