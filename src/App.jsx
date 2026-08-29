import { useCallback, useEffect, useRef, useState } from "react";
import { effect, frameLoop, init, surface } from "vgpu";
import gravityShader from "./gravity.wgsl?raw";
import {
  MAX_BODIES,
  PRESETS,
  SOLAR_DISTANCE_MODES,
  addLaunchedParticle,
  applySolarDistanceMode,
  bodyUniforms,
  cameraUniforms,
  clampBodyToField,
  clampCamera,
  cloneDefaultCamera,
  createEngine,
  drawSceneOverlay,
  formatPhysicalMass,
  hitTestBody,
  pointOnWorldPlane,
  resetEngine,
  stepSimulation,
  updateSolarOrbitFromPosition,
} from "./gravity3d.js";

const INITIAL_HINT = "Drag space to orbit · scroll to zoom · Shift-drag to launch.";

const ANTIALIASING_PROFILES = {
  off: { label: "OFF", dpr: 1 },
  balanced: { label: "BALANCED", dpr: [1, 1.55] },
  high: { label: "HIGH", dpr: [1.45, 2] },
};

export function App() {
  const gpuCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const engineRef = useRef(createEngine());
  const cameraRef = useRef(cloneDefaultCamera());
  const optionsRef = useRef(null);
  const preZenAnalysisRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [analysis, setAnalysis] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [antialiasing, setAntialiasing] = useState("balanced");
  const [showField, setShowField] = useState(true);
  const [showTrails, setShowTrails] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [speed, setSpeed] = useState(0.82);
  const [gravity, setGravity] = useState(1);
  const [preset, setPreset] = useState("cluster");
  const [solarDistanceMode, setSolarDistanceMode] = useState("log");
  const [addWellMode, setAddWellMode] = useState(false);
  const [launchMode, setLaunchMode] = useState(false);
  const [orbiting, setOrbiting] = useState(false);
  const [selectedBody, setSelectedBody] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [gpuStatus, setGpuStatus] = useState("INITIALIZING 3D");
  const [sceneVersion, setSceneVersion] = useState(0);
  const [cameraRevision, setCameraRevision] = useState(0);
  const [hint, setHint] = useState(INITIAL_HINT);

  const engine = engineRef.current;
  const selected = engine.bodies[selectedBody] ?? engine.bodies[0];
  const camera = cameraRef.current;
  const selectedOrbitPeriod = selected?.orbit
    ? selected.orbit.period < 0.98
      ? `${Math.round(selected.orbit.period * 365.25)} D`
      : `${selected.orbit.period.toFixed(selected.orbit.period < 10 ? 2 : 1)} Y`
    : null;
  const selectedPhysicalMass = formatPhysicalMass(selected);

  optionsRef.current = {
    paused,
    analysis,
    zenMode,
    antialiasing,
    showField,
    showTrails,
    showLinks,
    showLabels: showLabels || analysis,
    speed,
    gravity,
    selectedBody,
    camera,
  };

  const enterZen = useCallback(() => {
    preZenAnalysisRef.current = optionsRef.current?.analysis ?? false;
    setAnalysis(false);
    setZenMode(true);
    setHint("Zen view active · press Z or Escape to restore controls.");
  }, []);

  const exitZen = useCallback(() => {
    setZenMode(false);
    setAnalysis(preZenAnalysisRef.current);
    setHint(INITIAL_HINT);
  }, []);

  const toggleZen = useCallback(() => {
    if (optionsRef.current?.zenMode) exitZen();
    else enterZen();
  }, [enterZen, exitZen]);

  const resetCamera = useCallback(() => {
    Object.assign(cameraRef.current, cloneDefaultCamera());
    setCameraRevision((value) => value + 1);
    setHint("Perspective camera restored.");
  }, []);

  const reset = useCallback(
    (nextPreset = preset) => {
      resetEngine(engineRef.current, nextPreset, solarDistanceMode);
      Object.assign(cameraRef.current, cloneDefaultCamera());
      setPreset(nextPreset);
      setShowTrails(Boolean(PRESETS[nextPreset].showTrails));
      setSelectedBody(nextPreset === "solar" ? 3 : 0);
      setAddWellMode(false);
      setLaunchMode(false);
      setOrbiting(false);
      setHint(`${PRESETS[nextPreset].label} volume restored.`);
      setSceneVersion((value) => value + 1);
      setCameraRevision((value) => value + 1);
    },
    [preset, solarDistanceMode],
  );

  const choosePreset = useCallback((nextPreset) => reset(nextPreset), [reset]);

  useEffect(() => {
    let disposed = false;
    let gpu;
    let loop;
    let unsubscribeResize;
    let fallbackAnimation;
    const canvas = gpuCanvasRef.current;
    const overlay = overlayCanvasRef.current;
    const start = performance.now();

    async function startRenderer() {
      try {
        setGpuStatus(`INITIALIZING · AA ${ANTIALIASING_PROFILES[antialiasing].label}`);
        gpu = await init();
        if (disposed) {
          gpu.dispose();
          return;
        }

        const target = surface(gpu, canvas, {
          dpr: ANTIALIASING_PROFILES[antialiasing].dpr,
          alphaMode: "opaque",
          clearColor: [0.006, 0.002, 0.003, 1],
          label: "Three-dimensional gravity surface",
        });
        const initialCamera = cameraUniforms(cameraRef.current, target.size[0], target.size[1]);
        const field = effect(gpu, gravityShader, {
          label: "Perspective gravity volume",
          set: {
            params: {
              time: 0,
              width: target.size[0],
              height: target.size[1],
              mode: 0,
              showField: 1,
              gravity: 1,
              pulse: 0,
              bodyCount: engineRef.current.bodies.length,
              ...initialCamera,
              ...bodyUniforms(engineRef.current.bodies),
            },
          },
        });

        unsubscribeResize = target.onResize(({ width, height }) => {
          field.set({
            params: {
              width,
              height,
              ...cameraUniforms(cameraRef.current, width, height),
            },
          });
        });
        if (disposed) return;

        setGpuStatus(`WEBGPU 3D · AA ${ANTIALIASING_PROFILES[antialiasing].label}`);
        let previous = performance.now();
        loop = frameLoop(gpu, (frame) => {
          const now = performance.now();
          const elapsed = (now - previous) / 1000;
          previous = now;
          const options = optionsRef.current;
          const currentEngine = engineRef.current;
          stepSimulation(currentEngine, elapsed, options);
          const seconds = (now - start) / 1000;
          const width = target.size[0];
          const height = target.size[1];
          field.set({
            params: {
              time: seconds,
              width,
              height,
              mode: options.analysis ? 1 : 0,
              showField: options.showField ? 1 : 0,
              gravity: options.gravity,
              pulse: options.paused ? 0 : 1,
              bodyCount: currentEngine.bodies.length,
              ...cameraUniforms(options.camera, width, height),
              ...bodyUniforms(currentEngine.bodies),
            },
          });
          frame.pass(target, field);
          drawSceneOverlay(overlay, currentEngine, options, seconds, false);
        });
      } catch (error) {
        console.warn("WebGPU 3D renderer unavailable; using projected canvas fallback.", error);
        setGpuStatus("CANVAS 3D");
        let previous = performance.now();
        const fallbackLoop = (now) => {
          if (disposed) return;
          const elapsed = (now - previous) / 1000;
          previous = now;
          const options = optionsRef.current;
          stepSimulation(engineRef.current, elapsed, options);
          drawSceneOverlay(overlay, engineRef.current, options, (now - start) / 1000, true);
          fallbackAnimation = requestAnimationFrame(fallbackLoop);
        };
        fallbackAnimation = requestAnimationFrame(fallbackLoop);
      }
    }

    startRenderer();

    return () => {
      disposed = true;
      if (loop) loop.stop();
      if (fallbackAnimation) cancelAnimationFrame(fallbackAnimation);
      if (unsubscribeResize) unsubscribeResize();
      if (gpu) gpu.dispose();
    };
  }, [antialiasing]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
      if (event.code === "Space") {
        event.preventDefault();
        setPaused((value) => !value);
      } else if (event.key.toLowerCase() === "r") {
        reset();
      } else if (event.key === "0") {
        resetCamera();
      } else if (event.key.toLowerCase() === "a") {
        setAnalysis((value) => !value);
      } else if (event.key.toLowerCase() === "f") {
        setShowField((value) => !value);
      } else if (event.key.toLowerCase() === "l") {
        setShowLabels((value) => !value);
      } else if (event.key.toLowerCase() === "t") {
        setLaunchMode((value) => !value);
        setAddWellMode(false);
      } else if (event.key.toLowerCase() === "z") {
        toggleZen();
      } else if (event.key === "Escape") {
        if (optionsRef.current?.zenMode) {
          exitZen();
        } else {
          setLaunchMode(false);
          setAddWellMode(false);
          setHint(INITIAL_HINT);
        }
      } else if (event.key === "Delete" && engineRef.current.bodies.length > 2) {
        engineRef.current.bodies.splice(selectedBody, 1);
        setSelectedBody(0);
        setSceneVersion((value) => value + 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [exitZen, reset, resetCamera, selectedBody, toggleZen]);

  const pointFromEvent = (event) => {
    const bounds = overlayCanvasRef.current.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    return {
      x,
      y,
      width: bounds.width,
      height: bounds.height,
      world: pointOnWorldPlane(x, y, bounds.width, bounds.height, cameraRef.current),
    };
  };

  const onPointerDown = (event) => {
    if (event.button !== 0) return;
    const point = pointFromEvent(event);
    const currentEngine = engineRef.current;
    const canvas = overlayCanvasRef.current;
    canvas.setPointerCapture(event.pointerId);

    if (addWellMode) {
      if (!point.world) {
        setHint("Aim at the gravity surface to place a well.");
        return;
      }
      if (currentEngine.bodies.length < MAX_BODIES) {
        const body = {
          x: point.world.x,
          z: point.world.z,
          height: 0.06 + (currentEngine.bodies.length % 4) * 0.08,
          mass: 0.74,
          name: `Well ${currentEngine.bodies.length + 1}`,
        };
        clampBodyToField(body);
        currentEngine.bodies.push(body);
        setSelectedBody(currentEngine.bodies.length - 1);
        setHint("New gravity well placed in the spatial field.");
        setSceneVersion((value) => value + 1);
      } else {
        setHint(`The field supports up to ${MAX_BODIES} wells.`);
      }
      setAddWellMode(false);
      return;
    }

    const closest = hitTestBody(
      currentEngine.bodies,
      point.x,
      point.y,
      point.width,
      point.height,
      cameraRef.current,
    );

    if (closest >= 0 && !launchMode && !event.shiftKey) {
      currentEngine.dragging = { index: closest, pointerId: event.pointerId };
      setSelectedBody(closest);
      setHint(`Moving ${currentEngine.bodies[closest].name} across the field plane.`);
      return;
    }

    if (launchMode || event.shiftKey) {
      if (!point.world) {
        setHint("Aim at the gravity surface to launch a tracer.");
        return;
      }
      currentEngine.launch = {
        start: { ...point.world },
        current: { ...point.world },
        pointerId: event.pointerId,
      };
      setHint("Release to fire the tracer into three-dimensional space.");
      return;
    }

    currentEngine.orbiting = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      yaw: cameraRef.current.yaw,
      pitch: cameraRef.current.pitch,
    };
    setOrbiting(true);
    setHint("Orbiting the perspective camera.");
  };

  const onPointerMove = (event) => {
    const currentEngine = engineRef.current;
    const point = pointFromEvent(event);

    if (currentEngine.dragging?.pointerId === event.pointerId) {
      if (!point.world) return;
      const body = currentEngine.bodies[currentEngine.dragging.index];
      body.x = point.world.x;
      body.z = point.world.z;
      clampBodyToField(body);
      if (currentEngine.preset === "solar") {
        updateSolarOrbitFromPosition(
          body,
          currentEngine.solarTime,
          currentEngine.solarDistanceMode,
        );
      }
      return;
    }

    if (currentEngine.launch?.pointerId === event.pointerId) {
      if (point.world) currentEngine.launch.current = { ...point.world };
      return;
    }

    if (currentEngine.orbiting?.pointerId === event.pointerId) {
      const orbit = currentEngine.orbiting;
      cameraRef.current.yaw = orbit.yaw - (event.clientX - orbit.startX) * 0.006;
      cameraRef.current.pitch = orbit.pitch + (event.clientY - orbit.startY) * 0.0048;
      clampCamera(cameraRef.current);
      setCameraRevision((value) => value + 1);
    }
  };

  const onPointerUp = (event) => {
    const currentEngine = engineRef.current;
    const canvas = overlayCanvasRef.current;

    if (currentEngine.dragging?.pointerId === event.pointerId) {
      currentEngine.dragging = null;
      setHint("Gravity surface recalculated in three dimensions.");
      setSceneVersion((value) => value + 1);
    } else if (currentEngine.launch?.pointerId === event.pointerId) {
      const launch = currentEngine.launch;
      addLaunchedParticle(currentEngine, launch.start, launch.current, gravity);
      currentEngine.launch = null;
      setLaunchMode(false);
      setHint("Tracer released into the 3D gravity field.");
      setSceneVersion((value) => value + 1);
    } else if (currentEngine.orbiting?.pointerId === event.pointerId) {
      currentEngine.orbiting = null;
      setOrbiting(false);
      setHint(INITIAL_HINT);
    }

    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  };

  const onWheel = (event) => {
    event.preventDefault();
    cameraRef.current.distance *= Math.exp(event.deltaY * 0.00125);
    clampCamera(cameraRef.current);
    setCameraRevision((value) => value + 1);
    setHint(`Camera distance ${cameraRef.current.distance.toFixed(2)} units.`);
  };

  const updateMass = (value) => {
    const body = engineRef.current.bodies[selectedBody];
    if (!body) return;
    body.mass = Number(value);
    setSceneVersion((current) => current + 1);
  };

  const updateSolarDistanceMode = (mode) => {
    setSolarDistanceMode(mode);
    applySolarDistanceMode(engineRef.current, mode);
    setHint(mode === "linear"
      ? "Linear AU spacing reveals the Solar System's true distance ratios."
      : "Logarithmic AU spacing keeps the full Solar System legible.");
    setSceneVersion((current) => current + 1);
  };

  const updateHeight = (value) => {
    const body = engineRef.current.bodies[selectedBody];
    if (!body) return;
    body.height = Number(value);
    if (body.orbit) body.orbit.baseHeight = body.height;
    clampBodyToField(body);
    setHint(`${body.name} is ${body.height.toFixed(2)} units above the warped surface.`);
    setSceneVersion((current) => current + 1);
  };

  const updateElevation = (value) => {
    cameraRef.current.pitch = (Number(value) * Math.PI) / 180;
    clampCamera(cameraRef.current);
    setCameraRevision((current) => current + 1);
  };

  const removeSelected = () => {
    const currentEngine = engineRef.current;
    if (currentEngine.bodies.length <= 2) {
      setHint("Keep at least two wells in the experiment.");
      return;
    }
    currentEngine.bodies.splice(selectedBody, 1);
    setSelectedBody(0);
    setHint("Gravity well removed from the volume.");
    setSceneVersion((value) => value + 1);
  };

  const activateLaunchMode = () => {
    const next = !launchMode;
    setLaunchMode(next);
    setAddWellMode(false);
    setHint(next ? "Drag across the surface to aim a 3D tracer." : INITIAL_HINT);
  };

  const activateAddWellMode = () => {
    const next = !addWellMode;
    setAddWellMode(next);
    setLaunchMode(false);
    setHint(next ? "Click the gravity surface to place a well." : INITIAL_HINT);
  };

  return (
    <main
      className={`gravity-lab ${analysis ? "is-analysis" : ""} ${zenMode ? "is-zen" : ""} aa-${antialiasing}`}
      data-scene-version={sceneVersion}
      data-camera-revision={cameraRevision}
      data-antialiasing={antialiasing}
      data-zen={zenMode ? "true" : "false"}
    >
      <canvas ref={gpuCanvasRef} className="field-canvas" aria-hidden="true" />
      <canvas
        ref={overlayCanvasRef}
        className={`overlay-canvas ${addWellMode ? "is-placing" : ""} ${launchMode ? "is-launching" : ""} ${orbiting ? "is-orbiting" : ""}`}
        aria-label="Interactive three-dimensional gravity field. Drag empty space to orbit the camera, scroll to zoom, drag glowing wells to move them, or Shift-drag to launch a tracer."
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onContextMenu={(event) => event.preventDefault()}
      />

      <button type="button" className="zen-exit" onClick={exitZen} aria-label="Exit Zen mode">
        <span>EXIT ZEN</span>
        <kbd>Z</kbd>
      </button>

      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-row">
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-name">GRAVITAS</span>
            <span className="edition">SPACE 03</span>
          </div>
          <p>Interactive gravity in three dimensions</p>
        </div>

        <div className="telemetry" aria-label="Simulation telemetry">
          <span className="telemetry-live"><i aria-hidden="true" /> LIVE</span>
          <span>{gpuStatus}</span>
          <span>3D SPACE</span>
          <span>{engine.bodies.length} WELLS</span>
          <span>{engine.particles.length} TRACERS</span>
        </div>
      </header>

      <aside className={`tuning-panel ${settingsOpen ? "is-open" : ""}`} aria-label="Field tuning">
        <button
          type="button"
          className="panel-toggle"
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen((value) => !value)}
        >
          <span>TUNE</span>
          <span>{settingsOpen ? "CLOSE" : "OPEN"}</span>
        </button>
        {settingsOpen && (
          <div className="panel-content">
            <label className="select-control">
              <span>SAMPLE</span>
              <output>{PRESETS[preset].label.toUpperCase()}</output>
              <select
                aria-label="Simulation sample"
                value={preset}
                onChange={(event) => choosePreset(event.target.value)}
              >
                {Object.entries(PRESETS).map(([key, value]) => (
                  <option key={key} value={key}>{value.label.toUpperCase()}</option>
                ))}
              </select>
            </label>
            {preset === "solar" && (
              <label className="select-control">
                <span>DISTANCE SCALE</span>
                <output>{SOLAR_DISTANCE_MODES[solarDistanceMode].shortLabel}</output>
                <select
                  aria-label="Solar System distance scale"
                  value={solarDistanceMode}
                  onChange={(event) => updateSolarDistanceMode(event.target.value)}
                >
                  {Object.entries(SOLAR_DISTANCE_MODES).map(([key, value]) => (
                    <option key={key} value={key}>{value.label}</option>
                  ))}
                </select>
              </label>
            )}
            <label>
              <span>TIME RATE</span>
              <output>{speed.toFixed(2)}×</output>
              <input
                type="range"
                aria-label="Time rate"
                aria-valuetext={`${speed.toFixed(2)} times`}
                min="0.2"
                max="1.8"
                step="0.02"
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
              />
            </label>
            <label>
              <span>GRAVITY</span>
              <output>{gravity.toFixed(2)}</output>
              <input
                type="range"
                aria-label="Gravity strength"
                aria-valuetext={gravity.toFixed(2)}
                min="0.45"
                max="1.75"
                step="0.01"
                value={gravity}
                onChange={(event) => setGravity(Number(event.target.value))}
              />
            </label>
            <label>
              <span>CAMERA ELEVATION</span>
              <output>{Math.round((camera.pitch * 180) / Math.PI)}°</output>
              <input
                type="range"
                aria-label="Camera elevation"
                aria-valuetext={`${Math.round((camera.pitch * 180) / Math.PI)} degrees`}
                min="5"
                max="72"
                step="1"
                value={Math.round((camera.pitch * 180) / Math.PI)}
                onChange={(event) => updateElevation(event.target.value)}
              />
            </label>
            <label className="select-control">
              <span>ANTIALIASING</span>
              <output>{ANTIALIASING_PROFILES[antialiasing].label}</output>
              <select
                aria-label="Antialiasing quality"
                value={antialiasing}
                onChange={(event) => setAntialiasing(event.target.value)}
              >
                <option value="off">OFF · 1×</option>
                <option value="balanced">BALANCED · AUTO</option>
                <option value="high">HIGH · SSAA</option>
              </select>
            </label>
            {selectedPhysicalMass && (
              <div className="orbit-readout" aria-label={`${selected.name} physical model`}>
                <span>PHYSICAL MASS</span>
                <strong>{selectedPhysicalMass}</strong>
                {selected.orbit ? (
                  <>
                    <small>
                      DISTANCE {selected.orbit.au.toFixed(selected.orbit.au < 10 ? 3 : 2)} AU
                      {" → "}{selected.orbit.a.toFixed(2)} SCENE · {SOLAR_DISTANCE_MODES[solarDistanceMode].shortLabel}
                    </small>
                    <small>
                      PERIOD {selectedOrbitPeriod} · E {selected.orbit.e.toFixed(3)} · I {selected.orbit.inclination.toFixed(1)}°
                    </small>
                  </>
                ) : (
                  <small>332,946 M⊕ · CENTRAL REFERENCE MASS</small>
                )}
              </div>
            )}
            <label>
              <span>{selectedPhysicalMass ? "VISUAL WELL" : (selected?.name?.toUpperCase() ?? "SELECTED WELL")}</span>
              <output>{selected?.mass.toFixed(2) ?? "—"}{selectedPhysicalMass ? "×" : ""}</output>
              <input
                type="range"
                aria-label={selectedPhysicalMass
                  ? `${selected?.name ?? "Selected body"} visual gravity-well strength`
                  : `${selected?.name ?? "Selected well"} mass`}
                aria-valuetext={`${selected?.mass.toFixed(2) ?? "0.70"}${selectedPhysicalMass ? " visual scale" : ""}`}
                min={selectedPhysicalMass ? "0.05" : "0.1"}
                max="2.6"
                step="0.01"
                value={selected?.mass ?? 0.7}
                onChange={(event) => updateMass(event.target.value)}
              />
            </label>
            <label>
              <span>PLANE DISTANCE</span>
              <output>{selected?.height?.toFixed(2) ?? "0.10"} H</output>
              <input
                type="range"
                aria-label={`${selected?.name ?? "Selected well"} distance from warped surface`}
                aria-valuetext={`${selected?.height?.toFixed(2) ?? "0.10"} units above the warped surface`}
                min="0.015"
                max="0.48"
                step="0.01"
                value={selected?.height ?? 0.14}
                onChange={(event) => updateHeight(event.target.value)}
              />
            </label>
            <div className="panel-actions">
              <button type="button" className="quiet-action" onClick={resetCamera}>
                RESET CAMERA
              </button>
              <button type="button" className="quiet-action" onClick={removeSelected}>
                REMOVE WELL
              </button>
            </div>
          </div>
        )}
      </aside>

      <div className="mode-switcher" aria-label="View mode">
        <button
          type="button"
          className={!analysis ? "is-active" : ""}
          aria-pressed={!analysis}
          onClick={() => setAnalysis(false)}
        >
          CINEMATIC
        </button>
        <button
          type="button"
          className={analysis ? "is-active" : ""}
          aria-pressed={analysis}
          onClick={() => setAnalysis(true)}
        >
          ANALYSIS
        </button>
        <button type="button" aria-pressed={zenMode} onClick={enterZen}>
          ZEN
        </button>
      </div>

      <section className="scene-card" aria-label="Active system">
        <span className="eyebrow">ACTIVE VOLUME</span>
        <strong>{PRESETS[preset].label}</strong>
        <div className="preset-row">
          {Object.entries(PRESETS).map(([key, value]) => (
            <button
              type="button"
              key={key}
              className={preset === key ? "is-active" : ""}
              aria-pressed={preset === key}
              onClick={() => choosePreset(key)}
            >
              {value.label}
            </button>
          ))}
        </div>
      </section>

      <div className="interaction-hint" role="status" aria-live="polite">
        <span className="crosshair" aria-hidden="true" />
        {hint}
      </div>

      <nav className="control-dock" aria-label="Simulation controls">
        <button type="button" className="primary-control" onClick={() => setPaused((value) => !value)}>
          <span className={`pause-glyph ${paused ? "is-play" : ""}`} aria-hidden="true" />
          {paused ? "RESUME" : "PAUSE"}
        </button>
        <span className="dock-divider" aria-hidden="true" />
        <button
          type="button"
          className={showField ? "is-active" : ""}
          aria-pressed={showField}
          onClick={() => setShowField((value) => !value)}
        >
          SURFACE
        </button>
        <button
          type="button"
          className={showTrails ? "is-active" : ""}
          aria-pressed={showTrails}
          onClick={() => setShowTrails((value) => !value)}
        >
          TRAILS
        </button>
        <button
          type="button"
          className={showLinks ? "is-active" : ""}
          aria-pressed={showLinks}
          onClick={() => setShowLinks((value) => !value)}
        >
          LINKS
        </button>
        <button
          type="button"
          className={showLabels || analysis ? "is-active" : ""}
          aria-pressed={showLabels || analysis}
          onClick={() => setShowLabels((value) => !value)}
        >
          L-POINTS
        </button>
        <span className="dock-divider" aria-hidden="true" />
        <button
          type="button"
          className={launchMode ? "is-active launch-mode" : "launch-mode"}
          aria-pressed={launchMode}
          onClick={activateLaunchMode}
        >
          LAUNCH
        </button>
        <button
          type="button"
          className={addWellMode ? "is-active add-well" : "add-well"}
          aria-pressed={addWellMode}
          onClick={activateAddWellMode}
        >
          ADD WELL
        </button>
        <button type="button" onClick={() => reset()}>
          RESET
        </button>
      </nav>

      <footer className="shortcut-rail" aria-label="Keyboard and pointer shortcuts">
        <span><kbd>DRAG</kbd> ORBIT</span>
        <span><kbd>SHIFT</kbd> LAUNCH</span>
        <span><kbd>WHEEL</kbd> ZOOM</span>
        <span><kbd>SPACE</kbd> PAUSE</span>
        <span><kbd>0</kbd> VIEW</span>
        <span><kbd>Z</kbd> ZEN</span>
      </footer>
    </main>
  );
}
