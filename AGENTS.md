# Prototype Instructions

## Durable visual direction

- Treat the warm, low-angle gravity-fabric reference supplied on 2026-08-29 as the primary scene target: dense amber/copper contour lines over a dark plum-brown field, deep luminous bowls, restrained trajectories, and soft white bodies.
- Gravity bodies must occupy genuinely different heights above the warped plane. Keep those height differences visible through perspective, plane anchors/tethers, and a user-adjustable selected-body height control.
- Fidelity to the supplied 488 × 281 amber reference takes priority in Cinematic mode: use a near-horizon camera, four dominant asymmetric bowls, dense soft horizontal copper threads, localized orange illumination, minimal trajectories, and no visible rectangular plane edge.
- Measure body height from the local warped surface rather than the undeformed reference plane, so low bodies sit naturally inside wells while higher bodies can float above them.
- Keep the full configuration controls visible by default in Cinematic and Analysis modes. Use an explicit Zen mode for the clean, UI-free presentation, with a persistent accessible exit affordance and keyboard shortcut.
- Expose antialiasing quality as a user configuration with an economical default and an opt-in high-quality supersampled mode.
- Both Cinematic and Analysis must render exactly one coherent grid on the warped surface. Analysis may use a technical cross-grid and diagnostic overlays, but must not stack a projected mesh, major grid, or equipotential contour family over the shader grid.
- Keep a legible but behaviorally realistic Solar System sample: the Sun plus all eight planets in correct orbital order, compressed astronomical distances, elliptical and inclined animated orbits, period-ordered speeds, planet-specific colors/sizes, varied surface clearance, and orbital element readouts.
- Keep Solar System physics and display scales separate: preserve real Earth-mass and AU values, derive orbital periods from those values, map physical mass into bounded visual well strength, and offer both logarithmic full-system spacing and linear true-ratio distance spacing.
- Selected-body focus uses a smooth tracking dolly with wheel-adjustable zoom and a user-adjustable tilted focal band (tilt-shift softening/bokeh) in Cinematic mode; Analysis mode keeps the same camera lock but remains optically crisp. Keep both focus blur and tilt user-adjustable.
- Tilt focus must stay lightweight enough for continuous interaction: precompute per-body focus values on the CPU and avoid per-object Canvas blur filters or repeated per-body projection math in the fragment shader.

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Durable prototype direction

- The gravity experience is true 3D: use a perspective camera, spatial particle trajectories, and a visibly deformed gravity surface while retaining the cinematic and analysis visual modes.
- Primary spatial interactions are drag empty space to orbit, wheel or trackpad to zoom, drag a well to move it on the field plane, and Shift-drag or the Launch control to fire a tracer.
