export const TAU = Math.PI * 2;
export const MAX_BODIES = 9;
export const MAX_TRAIL = 132;
export const EARTH_MASSES_PER_SOLAR_MASS = 332946;

export const SOLAR_DISTANCE_MODES = Object.freeze({
  log: { label: "LOG · FULL SYSTEM", shortLabel: "LOG AU" },
  linear: { label: "LINEAR · TRUE RATIOS", shortLabel: "LINEAR AU" },
});

const DEFAULT_BODY_HEIGHT = 0.1;
const INTERACTION_PLANE_Y = 0;
const FIELD_LIMIT = 6;
const DEFAULT_GRAVITY = 0.052;
const SOLAR_DISPLAY_MAX_AU = 30.07;

function solarDisplayRadius(au, mode = "log") {
  if (mode === "linear") return 0.055 + (au / SOLAR_DISPLAY_MAX_AU) * 1.58;
  return 0.24 + Math.log1p(au) * 0.4;
}

function solarAuFromDisplayRadius(radius, mode = "log") {
  if (mode === "linear") {
    return Math.max(0.02, ((radius - 0.055) / 1.58) * SOLAR_DISPLAY_MAX_AU);
  }
  return Math.max(0.02, Math.expm1((radius - 0.24) / 0.4));
}

function orbitalPeriodYears(au, planetMassEarth = 0) {
  const systemMassSolar = (EARTH_MASSES_PER_SOLAR_MASS + planetMassEarth)
    / EARTH_MASSES_PER_SOLAR_MASS;
  return Math.sqrt((au ** 3) / systemMassSolar);
}

function visualWellMass(physicalMassEarth, isStar = false) {
  const compressed = 0.08 + Math.log10(1 + physicalMassEarth) * 0.17;
  return isStar ? 2.6 : clamp(compressed, 0.09, 0.62);
}

export function formatPhysicalMass(body) {
  const mass = body?.physicalMassEarth;
  if (!Number.isFinite(mass)) return null;
  if (body.kind === "star") return `${(mass / EARTH_MASSES_PER_SOLAR_MASS).toFixed(3)} M☉`;
  if (mass >= 100) return `${mass.toFixed(1)} M⊕`;
  if (mass >= 1) return `${mass.toFixed(2)} M⊕`;
  return `${mass.toFixed(3)} M⊕`;
}

export const DEFAULT_CAMERA = Object.freeze({
  yaw: -0.02,
  pitch: 0.42,
  distance: 3.3,
  targetX: 0,
  targetY: -0.56,
  targetZ: 0.32,
  fov: 40,
});

export const PRESETS = {
  cluster: {
    label: "Cluster",
    bodies: [
      { x: 0.55, z: -1.48, height: 0.32, mass: 2.25, name: "Aster" },
      { x: -0.95, z: -0.3, height: 0.2, mass: 1.02, name: "Cael" },
      { x: 0.74, z: 0.02, height: 0.075, mass: 0.62, name: "Orin" },
      { x: 0.82, z: 0.32, height: 0.22, mass: 0.36, name: "Nix" },
      { x: 0.71, z: 0.2, height: 0.38, mass: 0.12, name: "Vela" },
      { x: 0.92, z: -1.31, height: 0.13, mass: 0.26, name: "Iris" },
    ],
  },
  binary: {
    label: "Binary",
    bodies: [
      { x: -0.28, z: 0.02, height: 0.08, mass: 1.34, name: "Aster" },
      { x: 0.36, z: 0.02, height: 0.43, mass: 0.88, name: "Vela" },
    ],
  },
  slingshot: {
    label: "Slingshot",
    bodies: [
      { x: -0.62, z: 0.43, height: 0.34, mass: 0.82, name: "Nix" },
      { x: 0.14, z: -0.34, height: 0.07, mass: 1.42, name: "Aster" },
      { x: 0.72, z: 0.42, height: 0.5, mass: 0.58, name: "Iris" },
    ],
  },
  solar: {
    label: "Solar System",
    particleModel: "solar",
    showTrails: true,
    bodies: [
      { x: 0, z: 0, height: 0.48, kind: "star", physicalMassEarth: 332946, radius: 1.34, color: [1, 0.66, 0.2], name: "Sun" },
      { x: 0.39, z: 0, height: 0.06, physicalMassEarth: 0.0553, radius: 0.42, color: [0.63, 0.59, 0.55], name: "Mercury", orbit: { au: 0.387, e: 0.206, inclination: 7, node: 0.84, phase: 0.3, baseHeight: 0.06 } },
      { x: 0.47, z: 0, height: 0.1, physicalMassEarth: 0.815, radius: 0.72, color: [1, 0.72, 0.38], name: "Venus", orbit: { au: 0.723, e: 0.007, inclination: 3.4, node: 1.34, phase: 1.6, baseHeight: 0.1 } },
      { x: 0.53, z: 0, height: 0.14, physicalMassEarth: 1, radius: 0.75, color: [0.28, 0.56, 1], name: "Earth", orbit: { au: 1, e: 0.017, inclination: 0, node: 0, phase: 2.7, baseHeight: 0.14 } },
      { x: 0.62, z: 0, height: 0.09, physicalMassEarth: 0.107, radius: 0.56, color: [0.88, 0.31, 0.14], name: "Mars", orbit: { au: 1.524, e: 0.093, inclination: 1.85, node: 0.42, phase: 4.2, baseHeight: 0.09 } },
      { x: 0.97, z: 0, height: 0.24, physicalMassEarth: 317.8, radius: 1.1, color: [0.88, 0.68, 0.48], name: "Jupiter", orbit: { au: 5.203, e: 0.049, inclination: 1.3, node: 1.75, phase: 5.15, baseHeight: 0.24 } },
      { x: 1.18, z: 0, height: 0.32, physicalMassEarth: 95.16, radius: 1.02, color: [0.94, 0.81, 0.55], name: "Saturn", orbit: { au: 9.537, e: 0.057, inclination: 2.49, node: 2.3, phase: 0.9, baseHeight: 0.32 } },
      { x: 1.43, z: 0, height: 0.38, physicalMassEarth: 14.54, radius: 0.84, color: [0.48, 0.86, 0.92], name: "Uranus", orbit: { au: 19.19, e: 0.046, inclination: 0.77, node: 0.23, phase: 3.5, baseHeight: 0.38 } },
      { x: 1.6, z: 0, height: 0.43, physicalMassEarth: 17.15, radius: 0.82, color: [0.24, 0.42, 1], name: "Neptune", orbit: { au: 30.07, e: 0.011, inclination: 1.77, node: 2.86, phase: 5.8, baseHeight: 0.43 } },
    ],
  },
};

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function subtract(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function scale(vector, amount) {
  return { x: vector.x * amount, y: vector.y * amount, z: vector.z * amount };
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function normalize(vector) {
  const length = Math.hypot(vector.x, vector.y, vector.z) || 1;
  return scale(vector, 1 / length);
}

function mulberry32(seed) {
  return function random() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function copyBodies(bodies, solarDistanceMode = "log") {
  return bodies.map((body) => ({
    ...body,
    mass: Number.isFinite(body.physicalMassEarth)
      ? visualWellMass(body.physicalMassEarth, body.kind === "star")
      : body.mass,
    color: body.color ? [...body.color] : undefined,
    orbit: body.orbit ? {
      ...body.orbit,
      a: solarDisplayRadius(body.orbit.au, solarDistanceMode),
      period: orbitalPeriodYears(body.orbit.au, body.physicalMassEarth),
    } : undefined,
  }));
}

function bodyColor(body) {
  return body.color ?? [1, 0.94, 0.86];
}

function bodyRadiusScale(body) {
  return Number.isFinite(body.radius) ? body.radius : 1;
}

function bodyColorCss(body, alpha = 1) {
  const [red, green, blue] = bodyColor(body);
  return `rgba(${Math.round(red * 255)},${Math.round(green * 255)},${Math.round(blue * 255)},${alpha})`;
}

function bodyHeight(body) {
  return Number.isFinite(body.height) ? body.height : DEFAULT_BODY_HEIGHT;
}

function bodyPosition(body, bodies = []) {
  const surfaceY = bodies.length ? surfaceHeightAt(body.x, body.z, bodies) : 0;
  return { x: body.x, y: surfaceY + bodyHeight(body), z: body.z };
}

function seedOrbit(particle, bodies, index, random) {
  const bodyIndex = index % bodies.length;
  const body = bodies[bodyIndex];
  const center = bodyPosition(body, bodies);
  const angle = random() * TAU;
  const radius = 0.115 + random() * (index % 6 === 0 ? 0.48 : 0.31);
  const inclination = (random() - 0.5) * 1.18;
  const ascendingNode = random() * TAU;
  const orbitDirection = random() > 0.16 ? 1 : -1;

  const basisA = normalize({ x: Math.cos(ascendingNode), y: 0, z: Math.sin(ascendingNode) });
  const normal = normalize({
    x: Math.sin(inclination) * Math.sin(ascendingNode),
    y: Math.cos(inclination),
    z: -Math.sin(inclination) * Math.cos(ascendingNode),
  });
  const basisB = normalize(cross(normal, basisA));
  const radial = add(scale(basisA, Math.cos(angle)), scale(basisB, Math.sin(angle)));
  const tangent = add(scale(basisA, -Math.sin(angle)), scale(basisB, Math.cos(angle)));
  const speed = Math.sqrt((DEFAULT_GRAVITY * body.mass) / Math.max(radius, 0.08));
  const velocityScale = orbitDirection * speed * (0.8 + random() * 0.27);
  const position = add(center, scale(radial, radius));
  const velocity = scale(tangent, velocityScale);

  particle.x = position.x;
  particle.y = position.y;
  particle.z = position.z;
  particle.vx = velocity.x;
  particle.vy = velocity.y;
  particle.vz = velocity.z;
  particle.age = random() * 8;
  particle.hue = bodyIndex;
  particle.history = [];
}

const EARTH_ORBIT_SECONDS = 18;

function solarAngularRate(orbit) {
  return TAU / (EARTH_ORBIT_SECONDS * Math.pow(orbit.period, 0.38));
}

function solveEccentricAnomaly(meanAnomaly, eccentricity) {
  let anomaly = meanAnomaly;
  for (let iteration = 0; iteration < 4; iteration += 1) {
    anomaly -= (anomaly - eccentricity * Math.sin(anomaly) - meanAnomaly)
      / (1 - eccentricity * Math.cos(anomaly));
  }
  return anomaly;
}

function solarOrbitCoordinates(orbit, solarTime) {
  const meanAnomaly = orbit.phase + solarTime * solarAngularRate(orbit);
  const eccentricAnomaly = solveEccentricAnomaly(meanAnomaly, orbit.e);
  const localX = orbit.a * (Math.cos(eccentricAnomaly) - orbit.e);
  const localZ = orbit.a * Math.sqrt(1 - orbit.e * orbit.e) * Math.sin(eccentricAnomaly);
  const cosNode = Math.cos(orbit.node);
  const sinNode = Math.sin(orbit.node);
  return {
    x: localX * cosNode - localZ * sinNode,
    z: localX * sinNode + localZ * cosNode,
    vertical: Math.sin(eccentricAnomaly) * Math.sin((orbit.inclination * Math.PI) / 180) * orbit.a * 0.42,
  };
}

function updateSolarBodies(engine, elapsed) {
  engine.solarTime += elapsed;
  for (let index = 1; index < engine.bodies.length; index += 1) {
    if (engine.dragging?.index === index) continue;
    const body = engine.bodies[index];
    if (!body.orbit) continue;
    const position = solarOrbitCoordinates(body.orbit, engine.solarTime);
    body.x = position.x;
    body.z = position.z;
    body.height = clamp(body.orbit.baseHeight + position.vertical, 0.025, 0.48);
  }
}

function seedSolarOrbit(particle, bodies, index, random) {
  const sun = bodies.find((body) => body.name === "Sun") ?? bodies[0];
  const planets = bodies.filter((body) => body !== sun && body.orbit);
  if (!sun || planets.length === 0) {
    seedOrbit(particle, bodies, index, random);
    return;
  }
  const center = bodyPosition(sun, bodies);
  const band = index % planets.length;
  const orbit = planets[band].orbit;
  const radius = orbit.a * (0.985 + random() * 0.03);
  const angle = ((index * 0.61803398875) % 1) * TAU + random() * 0.08;
  const ascendingNode = orbit.node;
  const inclination = (orbit.inclination * Math.PI) / 180 + (random() - 0.5) * 0.015;
  const basisA = normalize({ x: Math.cos(ascendingNode), y: 0, z: Math.sin(ascendingNode) });
  const normal = normalize({
    x: Math.sin(inclination) * Math.sin(ascendingNode),
    y: Math.cos(inclination),
    z: -Math.sin(inclination) * Math.cos(ascendingNode),
  });
  const basisB = normalize(cross(normal, basisA));
  const radial = add(scale(basisA, Math.cos(angle)), scale(basisB, Math.sin(angle)));
  const tangent = add(scale(basisA, -Math.sin(angle)), scale(basisB, Math.cos(angle)));
  const speed = Math.sqrt((DEFAULT_GRAVITY * sun.mass) / radius) * (0.97 + random() * 0.045);
  const position = add(center, scale(radial, radius));
  const velocity = scale(tangent, speed);

  particle.x = position.x;
  particle.y = position.y;
  particle.z = position.z;
  particle.vx = velocity.x;
  particle.vy = velocity.y;
  particle.vz = velocity.z;
  particle.age = random() * 8;
  particle.hue = band + 1;
  particle.history = [];
}

function makeParticles(bodies, count = 54, seed = 4815, particleModel = "local") {
  const random = mulberry32(seed + bodies.length * 19);
  return Array.from({ length: count }, (_, index) => {
    const particle = {};
    if (particleModel === "solar") seedSolarOrbit(particle, bodies, index, random);
    else seedOrbit(particle, bodies, index, random);
    return particle;
  });
}

export function createEngine(preset = "cluster", solarDistanceMode = "log") {
  const presetConfig = PRESETS[preset];
  const bodies = copyBodies(presetConfig.bodies, solarDistanceMode);
  const engine = {
    bodies,
    particles: [],
    preset,
    solarDistanceMode,
    dragging: null,
    orbiting: null,
    launch: null,
    frame: 0,
    solarTime: 0,
  };
  if (presetConfig.particleModel === "solar") updateSolarBodies(engine, 0);
  engine.particles = makeParticles(
    bodies,
    presetConfig.particleModel === "solar" ? 64 : 54,
    4815,
    presetConfig.particleModel,
  );
  return engine;
}

export function resetEngine(engine, preset, solarDistanceMode = "log") {
  const presetConfig = PRESETS[preset];
  const bodies = copyBodies(presetConfig.bodies, solarDistanceMode);
  engine.bodies = bodies;
  engine.preset = preset;
  engine.solarDistanceMode = solarDistanceMode;
  engine.dragging = null;
  engine.orbiting = null;
  engine.launch = null;
  engine.frame = 0;
  engine.solarTime = 0;
  if (presetConfig.particleModel === "solar") updateSolarBodies(engine, 0);
  engine.particles = makeParticles(
    bodies,
    presetConfig.particleModel === "solar" ? 64 : 54,
    4815 + Object.keys(PRESETS).indexOf(preset) * 211,
    presetConfig.particleModel,
  );
}

export function applySolarDistanceMode(engine, mode) {
  if (engine.preset !== "solar" || !SOLAR_DISTANCE_MODES[mode]) return;
  engine.solarDistanceMode = mode;
  for (const body of engine.bodies) {
    if (!body.orbit) continue;
    body.orbit.a = solarDisplayRadius(body.orbit.au, mode);
  }
  updateSolarBodies(engine, 0);
  engine.particles = makeParticles(engine.bodies, 64, 4815, "solar");
}

export function bodyUniforms(bodies) {
  const result = {};
  for (let index = 0; index < MAX_BODIES; index += 1) {
    const body = bodies[index];
    result[`body${index}`] = body ? [body.x, body.z, body.mass, bodyHeight(body)] : [0, 0, 0, 0];
    result[`bodyStyle${index}`] = body
      ? [...bodyColor(body), bodyRadiusScale(body)]
      : [1, 0.94, 0.86, 1];
  }
  return result;
}

function accelerationAt(position, bodies, gravity) {
  const acceleration = { x: 0, y: 0, z: 0 };
  for (const body of bodies) {
    const target = bodyPosition(body, bodies);
    const dx = target.x - position.x;
    const dy = target.y - position.y;
    const dz = target.z - position.z;
    const distanceSquared = dx * dx + dy * dy + dz * dz + 0.0032;
    const inverseDistance = 1 / Math.sqrt(distanceSquared);
    const force = gravity * body.mass * inverseDistance * inverseDistance * inverseDistance;
    acceleration.x += dx * force;
    acceleration.y += dy * force;
    acceleration.z += dz * force;
  }
  return acceleration;
}

function respawnParticle(particle, bodies, index, frame, preset) {
  const random = mulberry32(9127 + index * 101 + frame * 7);
  if (PRESETS[preset]?.particleModel === "solar") seedSolarOrbit(particle, bodies, index, random);
  else seedOrbit(particle, bodies, index, random);
  particle.age = 0;
}

export function stepSimulation(engine, elapsed, options) {
  if (options.paused || engine.bodies.length === 0) return;

  const frameStep = Math.min(0.028, elapsed) * options.speed;
  if (engine.preset === "solar") updateSolarBodies(engine, frameStep);
  const substeps = options.speed > 1.15 ? 3 : 2;
  const dt = frameStep / substeps;

  for (let substep = 0; substep < substeps; substep += 1) {
    engine.particles.forEach((particle, index) => {
      const acceleration = accelerationAt(
        particle,
        engine.bodies,
        DEFAULT_GRAVITY * options.gravity,
      );

      particle.vx += acceleration.x * dt;
      particle.vy += acceleration.y * dt;
      particle.vz += acceleration.z * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.z += particle.vz * dt;
      particle.age += dt;

      if (engine.frame % 2 === 0) {
        particle.history.push({ x: particle.x, y: particle.y, z: particle.z });
        if (particle.history.length > MAX_TRAIL) particle.history.shift();
      }

      let collided = false;
      for (const body of engine.bodies) {
        const target = bodyPosition(body, engine.bodies);
        const dx = target.x - particle.x;
        const dy = target.y - particle.y;
        const dz = target.z - particle.z;
        const radius = (0.032 + Math.sqrt(body.mass) * 0.014) * bodyRadiusScale(body);
        if (dx * dx + dy * dy + dz * dz < radius * radius) collided = true;
      }

      if (
        collided ||
        Math.abs(particle.x) > 2.4 ||
        Math.abs(particle.z) > 2.4 ||
        particle.y < -1.15 ||
        particle.y > 1.45 ||
        particle.age > 38
      ) {
        respawnParticle(particle, engine.bodies, index + engine.frame, engine.frame, engine.preset);
      }
    });
  }

  engine.frame += 1;
}

export function cloneDefaultCamera() {
  return { ...DEFAULT_CAMERA };
}

export function getCameraBasis(camera, width, height) {
  const aspect = Math.max(0.35, width / Math.max(height, 1));
  const portraitPullback = aspect < 0.86 ? 1 + (0.86 - aspect) * 0.72 : 1;
  const distance = camera.distance * portraitPullback;
  const horizontalDistance = Math.cos(camera.pitch) * distance;
  const target = {
    x: camera.targetX,
    y: camera.targetY,
    z: camera.targetZ,
  };
  const position = {
    x: target.x + Math.sin(camera.yaw) * horizontalDistance,
    y: target.y + Math.sin(camera.pitch) * distance,
    z: target.z + Math.cos(camera.yaw) * horizontalDistance,
  };
  const forward = normalize(subtract(target, position));
  const right = normalize(cross(forward, { x: 0, y: 1, z: 0 }));
  const up = normalize(cross(right, forward));
  const tanHalfFov = Math.tan((camera.fov * Math.PI) / 360);

  return {
    aspect,
    distance,
    position,
    target,
    forward,
    right,
    up,
    tanHalfFov,
    focal: height / Math.max(2 * tanHalfFov, 0.001),
    width,
    height,
  };
}

export function cameraUniforms(camera, width, height) {
  const basis = getCameraBasis(camera, width, height);
  return {
    cameraPos: [basis.position.x, basis.position.y, basis.position.z, 1],
    cameraRight: [basis.right.x, basis.right.y, basis.right.z, 0],
    cameraUp: [basis.up.x, basis.up.y, basis.up.z, 0],
    cameraForward: [basis.forward.x, basis.forward.y, basis.forward.z, 0],
    cameraProjection: [basis.tanHalfFov, basis.aspect, basis.distance, 0],
  };
}

export function recommendedFocusDistance(body) {
  if (!body) return 2.24;
  return clamp(2.08 + Math.sqrt(Math.max(body.mass, 0.05)) * bodyRadiusScale(body) * 0.14, 2.12, 2.62);
}

export function stepFocusedCamera(engine, camera, focusedBody, elapsed, desiredDistance) {
  if (!Number.isInteger(focusedBody) || !engine.bodies[focusedBody]) return false;
  const body = engine.bodies[focusedBody];
  if (engine.dragging?.index === focusedBody) return true;
  const world = bodyPosition(body, engine.bodies);
  const response = 1 - Math.exp(-Math.min(Math.max(elapsed, 0), 0.1) * 4.8);
  const bodyOffset = clamp(0.075 + Math.sqrt(Math.max(body.mass, 0.05)) * 0.022, 0.075, 0.15);
  const targetDistance = Number.isFinite(desiredDistance)
    ? desiredDistance
    : recommendedFocusDistance(body);

  camera.targetX += (world.x - camera.targetX) * response;
  camera.targetY += (world.y - bodyOffset - camera.targetY) * response;
  camera.targetZ += (world.z - camera.targetZ) * response;
  camera.distance += (targetDistance - camera.distance) * response;
  clampCamera(camera);
  return true;
}

export function focusUniforms(engine, options, width, height) {
  const focusBlur = clamp(options.focusBlur ?? 0.68, 0, 1);
  const focusTilt = clamp(options.focusTilt ?? -8, -35, 35);
  const tiltSlope = Math.tan((focusTilt * Math.PI) / 180);
  const bandWidth = 0.115 + (1 - focusBlur) * 0.08;
  const focusedBody = Number.isInteger(options.focusedBody)
    ? engine.bodies[options.focusedBody]
    : null;
  if (!focusedBody || options.analysis) {
    return {
      focusParams: [1, focusBlur, 0, 0],
      focusBand: [0.5, 0.5, tiltSlope, bandWidth],
    };
  }

  const basis = getCameraBasis(options.camera, width, height);
  const world = bodyPosition(focusedBody, engine.bodies);
  const projected = projectWorld(world, basis);
  const focusDepth = projected.depth;
  return {
    focusParams: [Math.max(focusDepth, 0.1), focusBlur, 1, 0],
    focusBand: [
      clamp(projected.x / Math.max(width, 1), -0.25, 1.25),
      clamp(projected.y / Math.max(height, 1), -0.25, 1.25),
      tiltSlope,
      bandWidth,
    ],
  };
}

export function projectWorld(point, basis) {
  const relative = subtract(point, basis.position);
  const depth = dot(relative, basis.forward);
  if (depth <= 0.035) return { visible: false, depth };
  const cameraX = dot(relative, basis.right);
  const cameraY = dot(relative, basis.up);
  const scaleFactor = basis.focal / depth;
  const x = basis.width * 0.5 + cameraX * scaleFactor;
  const y = basis.height * 0.5 - cameraY * scaleFactor;
  return {
    x,
    y,
    depth,
    scale: scaleFactor,
    visible: x > -160 && x < basis.width + 160 && y > -160 && y < basis.height + 160,
  };
}

export function pointOnWorldPlane(screenX, screenY, width, height, camera, planeY = INTERACTION_PLANE_Y) {
  const basis = getCameraBasis(camera, width, height);
  const ndcX = (screenX / width) * 2 - 1;
  const ndcY = 1 - (screenY / height) * 2;
  const direction = normalize(add(
    basis.forward,
    add(
      scale(basis.right, ndcX * basis.aspect * basis.tanHalfFov),
      scale(basis.up, ndcY * basis.tanHalfFov),
    ),
  ));
  if (Math.abs(direction.y) < 0.0001) return null;
  const distance = (planeY - basis.position.y) / direction.y;
  if (distance <= 0) return null;
  return add(basis.position, scale(direction, distance));
}

export function hitTestBody(bodies, screenX, screenY, width, height, camera) {
  const basis = getCameraBasis(camera, width, height);
  let closest = -1;
  let closestDistance = Number.POSITIVE_INFINITY;
  bodies.forEach((body, index) => {
    const projected = projectWorld(bodyPosition(body, bodies), basis);
    if (!projected.visible) return;
    const hitRadius = Math.max(
      26,
      (0.055 + Math.sqrt(body.mass) * 0.017) * bodyRadiusScale(body) * projected.scale * 1.9,
    );
    const distance = Math.hypot(screenX - projected.x, screenY - projected.y);
    if (distance < hitRadius && distance < closestDistance) {
      closest = index;
      closestDistance = distance;
    }
  });
  return closest;
}

export function addLaunchedParticle(engine, start, end, gravity) {
  const delta = subtract(start, end);
  const dragDistance = Math.hypot(delta.x, delta.z);
  let velocity = scale(delta, 0.72);
  velocity.y = Math.min(0.34, 0.055 + dragDistance * 0.16);

  if (dragDistance < 0.035) {
    const acceleration = accelerationAt(start, engine.bodies, DEFAULT_GRAVITY * gravity);
    const radial = normalize({ x: acceleration.x, y: 0, z: acceleration.z });
    const tangent = normalize(cross({ x: 0, y: 1, z: 0 }, radial));
    velocity = scale(tangent, Math.sqrt(Math.hypot(acceleration.x, acceleration.z) * 0.19));
    velocity.y = 0.08;
  }

  engine.particles.push({
    x: start.x,
    y: INTERACTION_PLANE_Y + 0.045,
    z: start.z,
    vx: velocity.x,
    vy: velocity.y,
    vz: velocity.z,
    age: 0,
    hue: engine.particles.length % Math.max(1, engine.bodies.length),
    history: [],
  });

  if (engine.particles.length > 72) engine.particles.shift();
}

export function sizeCanvas(canvas, antialiasing = "balanced") {
  const bounds = canvas.getBoundingClientRect();
  const nativeDpr = window.devicePixelRatio || 1;
  const dpr = antialiasing === "off"
    ? 1
    : antialiasing === "high"
      ? Math.min(Math.max(nativeDpr, 1.45), 2)
      : Math.min(nativeDpr, 1.55);
  const width = Math.max(1, Math.round(bounds.width));
  const height = Math.max(1, Math.round(bounds.height));
  const pixelWidth = Math.round(width * dpr);
  const pixelHeight = Math.round(height * dpr);

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  return { width, height, dpr };
}

function potentialAt(x, z, bodies) {
  let potential = 0;
  for (const body of bodies) {
    const dx = x - body.x;
    const dz = z - body.z;
    const heightSoftening = bodyHeight(body) ** 2 * 0.18;
    potential += body.mass / Math.sqrt(dx * dx + dz * dz + 0.022 + heightSoftening);
  }
  return potential;
}

function surfaceHeightAt(x, z, bodies, gravity = 1) {
  const potential = potentialAt(x, z, bodies);
  return -Math.min(0.72, Math.max(0, potential * 0.06 * gravity - 0.025));
}

function strokeProjectedPath(context, points, basis) {
  let drawing = false;
  context.beginPath();
  for (const point of points) {
    const projected = projectWorld(point, basis);
    if (!projected.visible) {
      drawing = false;
      continue;
    }
    if (!drawing) {
      context.moveTo(projected.x, projected.y);
      drawing = true;
    } else {
      context.lineTo(projected.x, projected.y);
    }
  }
  context.stroke();
}

function drawFallbackSpace(context, width, height, analysis) {
  const gradient = context.createLinearGradient(0, 0, 0, height);
  if (analysis) {
    gradient.addColorStop(0, "#020b0b");
    gradient.addColorStop(0.62, "#062019");
    gradient.addColorStop(1, "#010807");
  } else {
    gradient.addColorStop(0, "#070203");
    gradient.addColorStop(0.6, "#210704");
    gradient.addColorStop(1, "#050101");
  }
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.save();
  for (let index = 0; index < 84; index += 1) {
    const x = ((index * 83.17) % 100) / 100 * width;
    const y = ((index * 47.31 + 13) % 100) / 100 * height * 0.74;
    const alpha = 0.08 + (index % 5) * 0.025;
    context.fillStyle = `rgba(225,235,255,${alpha})`;
    context.fillRect(x, y, index % 11 === 0 ? 1.4 : 0.8, index % 11 === 0 ? 1.4 : 0.8);
  }
  context.restore();
}

function drawSurfaceMesh(context, engine, options, basis, fallback) {
  if (!options.showField) return;
  const lineColor = options.analysis
    ? `rgba(101, 187, 157, ${fallback ? 0.27 : 0.1})`
    : `rgba(226, 83, 32, ${fallback ? 0.3 : 0.09})`;
  const majorColor = options.analysis
    ? `rgba(255, 211, 36, ${fallback ? 0.24 : 0.14})`
    : `rgba(255, 154, 65, ${fallback ? 0.38 : 0.16})`;
  const spacing = fallback ? 0.18 : options.analysis ? 0.36 : 0.13;
  const samples = options.analysis ? 82 : 110;

  context.save();
  context.lineWidth = fallback ? 0.9 : options.analysis ? 0.58 : 0.55;
  let lineIndex = 0;
  for (let axis = -FIELD_LIMIT; axis <= FIELD_LIMIT + 0.001; axis += spacing) {
    const major = lineIndex % 5 === 0;
    context.strokeStyle = major ? majorColor : lineColor;
    const row = [];
    const column = [];
    for (let step = 0; step <= samples; step += 1) {
      const value = -FIELD_LIMIT + (step / samples) * FIELD_LIMIT * 2;
      row.push({
        x: value,
        y: surfaceHeightAt(value, axis, engine.bodies, options.gravity),
        z: axis,
      });
      column.push({
        x: axis,
        y: surfaceHeightAt(axis, value, engine.bodies, options.gravity),
        z: value,
      });
    }
    strokeProjectedPath(context, row, basis);
    if (options.analysis || fallback) strokeProjectedPath(context, column, basis);
    lineIndex += 1;
  }
  context.restore();
}

function drawArrowhead(context, from, to, color, size = 8) {
  if (!from?.visible || !to?.visible) return;
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  context.save();
  context.translate(to.x, to.y);
  context.rotate(angle);
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(2.4, 0);
  context.lineTo(-size, size * 0.48);
  context.lineTo(-size * 0.72, 0);
  context.lineTo(-size, -size * 0.48);
  context.closePath();
  context.fill();
  context.restore();
}

function drawBodyRing(context, body, bodies, basis, color, selected) {
  const radius = (0.072 + Math.sqrt(body.mass) * 0.024) * bodyRadiusScale(body);
  const centerY = bodyPosition(body, bodies).y;
  const points = [];
  for (let index = 0; index <= 52; index += 1) {
    const angle = (index / 52) * TAU;
    points.push({
      x: body.x + Math.cos(angle) * radius,
      y: centerY,
      z: body.z + Math.sin(angle) * radius,
    });
  }
  context.save();
  context.strokeStyle = color;
  context.lineWidth = selected ? 1.45 : 0.75;
  context.setLineDash(selected ? [] : [3, 5]);
  strokeProjectedPath(context, points, basis);
  context.restore();
}

function drawSolarOrbits(context, bodies, basis, analysis, selectedBody, blurAtProjection = null) {
  context.save();
  for (let bodyIndex = 1; bodyIndex < bodies.length; bodyIndex += 1) {
    const body = bodies[bodyIndex];
    if (!body.orbit) continue;
    const selected = bodyIndex === selectedBody;
    const orbit = body.orbit;
    const points = [];
    for (let sample = 0; sample <= 112; sample += 1) {
      const eccentricAnomaly = (sample / 112) * TAU;
      const localX = orbit.a * (Math.cos(eccentricAnomaly) - orbit.e);
      const localZ = orbit.a * Math.sqrt(1 - orbit.e * orbit.e) * Math.sin(eccentricAnomaly);
      const cosNode = Math.cos(orbit.node);
      const sinNode = Math.sin(orbit.node);
      const x = localX * cosNode - localZ * sinNode;
      const z = localX * sinNode + localZ * cosNode;
      const vertical = Math.sin(eccentricAnomaly)
        * Math.sin((orbit.inclination * Math.PI) / 180)
        * orbit.a
        * 0.42;
      const height = clamp(orbit.baseHeight + vertical, 0.025, 0.48);
      points.push({ x, y: surfaceHeightAt(x, z, bodies) + height, z });
    }
    context.strokeStyle = bodyColorCss(body, analysis
      ? (selected ? 0.58 : 0.23)
      : (selected ? 0.32 : 0.13));
    context.lineWidth = selected ? (analysis ? 1.25 : 0.92) : (analysis ? 0.72 : 0.5);
    context.shadowColor = selected ? bodyColorCss(body, analysis ? 0.38 : 0.2) : "transparent";
    context.shadowBlur = selected ? 6 : 0;
    const bodyProjection = projectWorld(bodyPosition(body, bodies), basis);
    const orbitBlur = blurAtProjection?.(bodyProjection) ?? 0;
    context.filter = orbitBlur > 0.05 ? `blur(${orbitBlur.toFixed(2)}px)` : "none";
    if (analysis && !selected) context.setLineDash([2, 5]);
    else context.setLineDash([]);
    strokeProjectedPath(context, points, basis);
  }
  context.restore();
}

function drawSaturnRings(context, body, bodies, basis, analysis) {
  const center = bodyPosition(body, bodies);
  const node = body.orbit?.node ?? 0;
  context.save();
  context.strokeStyle = bodyColorCss(body, analysis ? 0.72 : 0.48);
  context.shadowColor = bodyColorCss(body, 0.28);
  context.shadowBlur = 5;
  for (const radius of [0.062, 0.078, 0.094]) {
    const points = [];
    for (let sample = 0; sample <= 64; sample += 1) {
      const angle = (sample / 64) * TAU;
      const localX = Math.cos(angle) * radius;
      const localZ = Math.sin(angle) * radius;
      points.push({
        x: center.x + localX * Math.cos(node) - localZ * Math.sin(node),
        y: center.y + localZ * 0.18,
        z: center.z + localX * Math.sin(node) + localZ * Math.cos(node),
      });
    }
    context.lineWidth = radius === 0.078 ? 1.05 : 0.55;
    strokeProjectedPath(context, points, basis);
  }
  context.restore();
}

function drawSurfaceAnchor(context, body, surfaceY, basis, analysis, selected) {
  const radii = selected ? [0.055, 0.092] : [0.05];
  context.save();
  context.lineWidth = selected ? 1 : 0.62;
  context.strokeStyle = analysis ? "rgba(255,213,48,.5)" : "rgba(255,128,47,.48)";
  for (const radius of radii) {
    const points = [];
    for (let index = 0; index <= 42; index += 1) {
      const angle = (index / 42) * TAU;
      points.push({
        x: body.x + Math.cos(angle) * radius,
        y: surfaceY + 0.004,
        z: body.z + Math.sin(angle) * radius,
      });
    }
    strokeProjectedPath(context, points, basis);
  }
  context.restore();
}

function drawBodyCore(context, body, projected, analysis, selected, fallback) {
  if (!projected.visible) return;
  const radius = clamp(
    (0.026 + Math.sqrt(body.mass) * 0.014) * bodyRadiusScale(body) * projected.scale,
    4.2,
    fallback ? 20 : 15.5,
  );
  const glowRadius = radius * (selected ? 3.55 : 2.9);
  const glow = context.createRadialGradient(
    projected.x - radius * 0.16,
    projected.y - radius * 0.2,
    0,
    projected.x,
    projected.y,
    glowRadius,
  );
  glow.addColorStop(0, "rgba(255,255,244,1)");
  glow.addColorStop(0.15, bodyColorCss(body, 0.96));
  glow.addColorStop(0.42, bodyColorCss(body, analysis ? 0.34 : 0.42));
  glow.addColorStop(1, bodyColorCss(body, 0));
  context.fillStyle = glow;
  context.beginPath();
  context.arc(projected.x, projected.y, glowRadius, 0, TAU);
  context.fill();

  context.save();
  context.shadowColor = bodyColorCss(body, 0.95);
  context.shadowBlur = radius * 1.35;
  context.fillStyle = bodyColorCss(body, 0.98);
  context.beginPath();
  context.arc(projected.x, projected.y, radius * 0.58, 0, TAU);
  context.fill();
  context.restore();
}

function drawBodyLabel(context, body, projected, analysis) {
  if (!projected.visible) return;
  const physicalMass = formatPhysicalMass(body);
  const label = physicalMass && body.orbit
    ? `${body.name.toUpperCase()}  ${physicalMass}  ${body.orbit.au.toFixed(body.orbit.au < 10 ? 3 : 1)} AU`
    : physicalMass
      ? `${body.name.toUpperCase()}  ${physicalMass}  0 AU`
    : `${body.name.toUpperCase()}  ${body.mass.toFixed(2)} M  H ${bodyHeight(body).toFixed(2)}`;
  context.save();
  context.font = "700 9px 'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace";
  context.textBaseline = "middle";
  const paddingX = 8;
  const width = context.measureText(label).width + paddingX * 2;
  const canvasWidth = context.canvas.clientWidth || context.canvas.width;
  const x = projected.x + width + 34 > canvasWidth ? projected.x - width - 18 : projected.x + 18;
  const y = projected.y - 28;
  context.fillStyle = analysis ? "rgba(2,24,20,.86)" : "rgba(24,8,7,.86)";
  context.strokeStyle = analysis ? "rgba(255,221,45,.55)" : "rgba(255,139,60,.58)";
  context.lineWidth = 0.75;
  context.fillRect(x, y, width, 22);
  context.strokeRect(x + 0.5, y + 0.5, width - 1, 21);
  context.fillStyle = analysis ? "rgba(255,236,127,.95)" : "rgba(255,229,204,.96)";
  context.fillText(label, x + paddingX, y + 11.5);
  context.restore();
}

function chooseLagrangePair(bodies) {
  if (bodies.length < 2) return null;
  let pair = [bodies[0], bodies[1]];
  let score = Number.POSITIVE_INFINITY;
  for (let first = 0; first < bodies.length; first += 1) {
    for (let second = first + 1; second < bodies.length; second += 1) {
      const a = bodies[first];
      const b = bodies[second];
      const distance = Math.hypot(b.x - a.x, b.z - a.z);
      const centerDistance = Math.hypot((a.x + b.x) * 0.5, (a.z + b.z) * 0.5);
      const nextScore = distance + centerDistance * 0.72 - (a.mass + b.mass) * 0.035;
      if (nextScore < score) {
        score = nextScore;
        pair = [a, b];
      }
    }
  }
  return pair[0].mass >= pair[1].mass ? pair : [pair[1], pair[0]];
}

function drawLagrangePoints(context, bodies, basis, preferredSecondaryIndex = null) {
  const preferredSecondary = bodies[preferredSecondaryIndex];
  const pair = preferredSecondaryIndex > 0 && preferredSecondary
    ? [bodies[0], preferredSecondary]
    : chooseLagrangePair(bodies);
  if (!pair) return;
  const [primary, secondary] = pair;
  const dx = secondary.x - primary.x;
  const dz = secondary.z - primary.z;
  const distance = Math.hypot(dx, dz) || 0.3;
  const ux = dx / distance;
  const uz = dz / distance;
  const px = -uz;
  const pz = ux;
  const midpoint = { x: (primary.x + secondary.x) * 0.5, z: (primary.z + secondary.z) * 0.5 };
  const points = [
    { name: "L1", x: midpoint.x, z: midpoint.z },
    { name: "L2", x: secondary.x + ux * distance * 0.55, z: secondary.z + uz * distance * 0.55 },
    { name: "L3", x: primary.x - ux * distance * 0.72, z: primary.z - uz * distance * 0.72 },
    { name: "L4", x: midpoint.x + px * distance * 0.86, z: midpoint.z + pz * distance * 0.86 },
    { name: "L5", x: midpoint.x - px * distance * 0.86, z: midpoint.z - pz * distance * 0.86 },
  ];

  context.save();
  context.font = "600 10px 'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace";
  context.textBaseline = "middle";
  for (const point of points) {
    const projected = projectWorld({ x: point.x, y: INTERACTION_PLANE_Y + 0.035, z: point.z }, basis);
    if (!projected.visible) continue;
    context.fillStyle = "rgba(229,238,255,.94)";
    context.beginPath();
    context.arc(projected.x, projected.y, 1.8, 0, TAU);
    context.fill();
    context.fillStyle = "rgba(229,238,255,.78)";
    context.fillText(point.name, projected.x + 7, projected.y - 8);
  }
  context.restore();
}

function drawAxisGizmo(context, basis, width, height) {
  if (width < 560) return;
  const origin = { x: 0, y: 0, z: 0 };
  const projectedOrigin = projectWorld(origin, basis);
  const vectors = [
    { label: "X", color: "rgba(255,107,64,.9)", point: { x: 0.23, y: 0, z: 0 } },
    { label: "Y", color: "rgba(255,220,74,.9)", point: { x: 0, y: 0.23, z: 0 } },
    { label: "Z", color: "rgba(80,211,183,.9)", point: { x: 0, y: 0, z: 0.23 } },
  ];
  const anchor = { x: width - 58, y: height - 154 };

  context.save();
  context.font = "600 8px 'IBM Plex Mono', Consolas, monospace";
  for (const vector of vectors) {
    const projected = projectWorld(vector.point, basis);
    if (!projected.visible || !projectedOrigin.visible) continue;
    const dx = projected.x - projectedOrigin.x;
    const dy = projected.y - projectedOrigin.y;
    const length = Math.hypot(dx, dy) || 1;
    const endpoint = { x: anchor.x + (dx / length) * 22, y: anchor.y + (dy / length) * 22 };
    context.strokeStyle = vector.color;
    context.fillStyle = vector.color;
    context.lineWidth = 1.15;
    context.beginPath();
    context.moveTo(anchor.x, anchor.y);
    context.lineTo(endpoint.x, endpoint.y);
    context.stroke();
    context.fillText(vector.label, endpoint.x + 4, endpoint.y + 3);
  }
  context.restore();
}

export function drawSceneOverlay(canvas, engine, options, time, fallback = false) {
  const context = canvas.getContext("2d");
  const { width, height, dpr } = sizeCanvas(canvas, options.antialiasing);
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  const basis = getCameraBasis(options.camera, width, height);
  const focusedBody = Number.isInteger(options.focusedBody)
    ? engine.bodies[options.focusedBody]
    : null;
  const focusDepth = focusedBody
    ? projectWorld(bodyPosition(focusedBody, engine.bodies), basis).depth
    : 0;
  const focusProjection = focusedBody
    ? projectWorld(bodyPosition(focusedBody, engine.bodies), basis)
    : null;
  const focusActive = Boolean(focusedBody && !options.analysis && focusDepth > 0.1);
  const focusBlur = clamp(options.focusBlur ?? 0.68, 0, 1);
  const focusTilt = clamp(options.focusTilt ?? -8, -35, 35);
  const bandWidth = 0.115 + (1 - focusBlur) * 0.08;
  const blurAtProjection = (projected) => {
    if (!focusActive || !projected || !Number.isFinite(projected.depth)) return 0;
    const depthDelta = Math.abs(projected.depth - focusDepth) / Math.max(focusDepth * 0.42, 0.24);
    const screenX = projected.x / Math.max(width, 1);
    const screenY = projected.y / Math.max(height, 1);
    const focusX = focusProjection.x / Math.max(width, 1);
    const focusY = focusProjection.y / Math.max(height, 1);
    const slope = Math.tan((focusTilt * Math.PI) / 180);
    const bandDistance = Math.abs((screenY - focusY) - (screenX - focusX) * basis.aspect * slope);
    const bandDefocus = clamp((bandDistance - bandWidth * 0.42) / Math.max(bandWidth * 1.1, 0.01), 0, 1);
    const defocus = Math.max(clamp(depthDelta, 0, 1) * 0.32, bandDefocus);
    return clamp(defocus * focusBlur * 6.5, 0, 5.2);
  };

  if (fallback) drawFallbackSpace(context, width, height, options.analysis);
  if (fallback) drawSurfaceMesh(context, engine, options, basis, fallback);

  const pathColor = options.analysis ? "rgba(255,218,0,.56)" : "rgba(255,147,67,.13)";
  const pathBright = options.analysis ? "rgba(255,226,16,.98)" : "rgba(255,166,82,.5)";
  const linkColor = options.analysis ? "rgba(232,69,24,.66)" : "rgba(255,86,30,.22)";

  if (options.showLinks && engine.bodies.length > 1) {
    context.save();
    context.setLineDash([10, 10]);
    context.lineWidth = 1.7;
    context.strokeStyle = linkColor;
    context.shadowColor = linkColor;
    context.shadowBlur = 8;
    const points = engine.bodies.map((body) => bodyPosition(body, engine.bodies));
    points.push(bodyPosition(engine.bodies[0], engine.bodies));
    strokeProjectedPath(context, points, basis);
    context.restore();
  }

  if (engine.preset === "solar" && options.showTrails) {
    drawSolarOrbits(
      context,
      engine.bodies,
      basis,
      options.analysis,
      options.selectedBody,
      blurAtProjection,
    );
  }

  if (options.showTrails) {
    const trails = engine.particles
      .map((particle, index) => ({ particle, index, projected: projectWorld(particle, basis) }))
      .filter((entry) => entry.particle.history.length > 1)
      .sort((a, b) => b.projected.depth - a.projected.depth);

    for (const { particle, index, projected } of trails) {
      const depthAlpha = clamp(3.05 / Math.max(projected.depth, 0.4), 0.36, 1);
      const perspective = clamp(2.7 / Math.max(projected.depth, 0.4), 0.62, 1.38);
      context.save();
      context.globalAlpha = depthAlpha;
      context.lineWidth = (options.analysis ? (index % 7 === 0 ? 1.45 : 0.82) : (index % 7 === 0 ? 0.92 : 0.52)) * perspective;
      context.strokeStyle = pathColor;
      context.shadowColor = options.analysis ? "rgba(255,211,0,.34)" : "rgba(255,106,35,.16)";
      context.shadowBlur = options.analysis && index % 7 === 0 ? 7 : 1.5;
      const trailBlur = blurAtProjection(projected);
      context.filter = trailBlur > 0.05 ? `blur(${trailBlur.toFixed(2)}px)` : "none";
      strokeProjectedPath(context, particle.history, basis);
      context.restore();

      if ((options.analysis ? index % 2 === 0 : index % 12 === 0) && particle.history.length > 12) {
        const arrowIndex = Math.max(8, particle.history.length - 17 - (index % 4) * 4);
        const from = projectWorld(particle.history[Math.max(0, arrowIndex - 5)], basis);
        const to = projectWorld(particle.history[arrowIndex], basis);
        context.save();
        context.globalAlpha = depthAlpha;
        const arrowBlur = blurAtProjection(projected);
        context.filter = arrowBlur > 0.05 ? `blur(${arrowBlur.toFixed(2)}px)` : "none";
        drawArrowhead(context, from, to, pathBright, index % 7 === 0 ? 9.5 : 7.2);
        context.restore();
      }
    }
  }

  const particles = engine.particles
    .map((particle, index) => ({ particle, index, projected: projectWorld(particle, basis) }))
    .filter(({ projected }) => projected.visible)
    .sort((a, b) => b.projected.depth - a.projected.depth);

  for (const { index, projected } of particles) {
    const perspective = clamp(2.7 / projected.depth, 0.54, 1.65);
    const radius = (index % 8 === 0 ? 2.2 : 1.22) * perspective;
    const particleBlur = blurAtProjection(projected);
    context.save();
    context.filter = particleBlur > 0.05 ? `blur(${particleBlur.toFixed(2)}px)` : "none";
    context.globalAlpha = 1 - Math.min(particleBlur * 0.055, 0.24);
    if (!options.analysis && index % 4 !== 0) {
      context.fillStyle = `rgba(44, 7, 5, ${index % 3 === 0 ? 0.72 : 0.46})`;
      context.beginPath();
      context.arc(projected.x, projected.y, Math.max(0.55, radius * 0.58), 0, TAU);
      context.fill();
      context.restore();
      continue;
    }
    const glow = context.createRadialGradient(projected.x, projected.y, 0, projected.x, projected.y, radius * 2.8);
    glow.addColorStop(0, "rgba(255,255,245,.98)");
    glow.addColorStop(0.34, "rgba(237,235,220,.74)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = glow;
    context.beginPath();
    context.arc(projected.x, projected.y, radius * 2.8, 0, TAU);
    context.fill();
    context.restore();
  }

  const bodyEntries = engine.bodies
    .map((body, index) => ({
      body,
      index,
      projected: projectWorld(bodyPosition(body, engine.bodies), basis),
    }))
    .sort((a, b) => b.projected.depth - a.projected.depth);

  for (const { body, index, projected } of bodyEntries) {
    const isSelected = index === options.selectedBody;
    if (engine.preset === "solar" && body.name === "Saturn") {
      const ringBlur = blurAtProjection(projected);
      context.save();
      context.filter = ringBlur > 0.05 ? `blur(${ringBlur.toFixed(2)}px)` : "none";
      drawSaturnRings(context, body, engine.bodies, basis, options.analysis);
      context.restore();
    }
    if (options.analysis || fallback) {
      const bodyBlur = blurAtProjection(projected);
      context.save();
      context.filter = bodyBlur > 0.05 ? `blur(${bodyBlur.toFixed(2)}px)` : "none";
      drawBodyRing(
        context,
        body,
        engine.bodies,
        basis,
        options.analysis ? "rgba(255,210,24,.72)" : "rgba(255,135,52,.66)",
        isSelected,
      );
      const surfaceY = surfaceHeightAt(body.x, body.z, engine.bodies, options.gravity);
      const surfacePoint = projectWorld({ x: body.x, y: surfaceY, z: body.z }, basis);
      if (projected.visible && surfacePoint.visible) {
        context.save();
        context.setLineDash(isSelected ? [4, 5] : [2, 6]);
        context.lineWidth = isSelected ? 1.05 : 0.6;
        context.strokeStyle = options.analysis
          ? `rgba(255,211,41,${isSelected ? 0.44 : 0.24})`
          : `rgba(255,133,55,${isSelected ? 0.36 : 0.18})`;
        context.beginPath();
        context.moveTo(projected.x, projected.y);
        context.lineTo(surfacePoint.x, surfacePoint.y);
        context.stroke();
        context.restore();
        drawSurfaceAnchor(context, body, surfaceY, basis, options.analysis, isSelected);
      }
      drawBodyCore(context, body, projected, options.analysis, isSelected, fallback);
      if (isSelected && options.analysis) drawBodyLabel(context, body, projected, options.analysis);
      context.restore();
    }
  }

  if (options.showLabels) {
    const solarSecondary = engine.preset === "solar"
      ? (options.selectedBody > 0 ? options.selectedBody : 3)
      : null;
    drawLagrangePoints(context, engine.bodies, basis, solarSecondary);
  }

  if (engine.launch) {
    const from = projectWorld(engine.launch.current, basis);
    const to = projectWorld(engine.launch.start, basis);
    if (from.visible && to.visible) {
      context.save();
      context.setLineDash([4, 6]);
      context.strokeStyle = pathBright;
      context.lineWidth = 1.35;
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.stroke();
      context.restore();
      drawArrowhead(context, from, to, pathBright, 8.5);
    }
  }

  if (options.analysis) drawAxisGizmo(context, basis, width, height);

  if (!options.paused && time > 0) {
    context.globalAlpha = 1;
  }
}

export function clampBodyToField(body) {
  body.x = clamp(body.x, -1.65, 1.65);
  body.z = clamp(body.z, -1.65, 1.65);
  body.height = clamp(bodyHeight(body), 0.015, 0.48);
}

export function updateSolarOrbitFromPosition(body, solarTime = 0, distanceMode = "log") {
  if (!body.orbit) return;
  const radius = clamp(Math.hypot(body.x, body.z), 0.065, 1.65);
  const cosNode = Math.cos(body.orbit.node);
  const sinNode = Math.sin(body.orbit.node);
  const localX = body.x * cosNode + body.z * sinNode;
  const localZ = -body.x * sinNode + body.z * cosNode;
  body.orbit.a = radius;
  body.orbit.au = solarAuFromDisplayRadius(radius, distanceMode);
  body.orbit.period = orbitalPeriodYears(body.orbit.au, body.physicalMassEarth);
  body.orbit.phase = Math.atan2(localZ, localX) - solarTime * solarAngularRate(body.orbit);
}

export function clampCamera(camera) {
  camera.pitch = clamp(camera.pitch, 0.08, 1.26);
  camera.distance = clamp(camera.distance, 1.7, 5.2);
}
