# Gravitas

Gravitas is an interactive three-dimensional gravity-fabric visualization built with React, Vite, WebGPU, and vGPU. It combines a cinematic low-angle field view with an analysis mode, spatial tracers, editable gravity wells, and a Solar System sample.

## Solar System model

The Solar System preset keeps physical and display scales separate:

- physical mass is stored in Earth masses;
- orbital distance is stored in astronomical units;
- orbital periods are derived from mass and distance using Kepler's law;
- logarithmic spacing keeps the full system legible; and
- linear spacing shows true AU distance ratios.

Visual body size, gravity-well depth, and animation time remain compressed so the system can be explored interactively.

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite in a WebGPU-capable browser. A projected Canvas renderer is used when WebGPU is unavailable.

## Controls

- Drag empty space to orbit the camera.
- Scroll or use a trackpad to zoom.
- Drag a gravity body to reposition it.
- Shift-drag, or use Launch, to fire a tracer.
- Use Tune to select samples, distance scaling, antialiasing, and field parameters.
- Use Zen for a clean cinematic view.

## Verification

```bash
npm run build
npm run test:sites
```
