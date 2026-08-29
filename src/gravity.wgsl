struct Params {
  time: f32,
  width: f32,
  height: f32,
  mode: f32,
  showField: f32,
  gravity: f32,
  pulse: f32,
  bodyCount: f32,
  cameraPos: vec4f,
  cameraRight: vec4f,
  cameraUp: vec4f,
  cameraForward: vec4f,
  cameraProjection: vec4f,
  focusParams: vec4f,
  focusBand: vec4f,
  bodyFocus0: vec4f,
  bodyFocus1: vec4f,
  bodyFocus2: vec4f,
  body0: vec4f,
  body1: vec4f,
  body2: vec4f,
  body3: vec4f,
  body4: vec4f,
  body5: vec4f,
  body6: vec4f,
  body7: vec4f,
  body8: vec4f,
  bodyStyle0: vec4f,
  bodyStyle1: vec4f,
  bodyStyle2: vec4f,
  bodyStyle3: vec4f,
  bodyStyle4: vec4f,
  bodyStyle5: vec4f,
  bodyStyle6: vec4f,
  bodyStyle7: vec4f,
  bodyStyle8: vec4f,
}

@group(0) @binding(0) var<uniform> params: Params;

const FAR_DISTANCE: f32 = 10000.0;

fn focusDefocus(depth: f32, sampleUv: vec2f) -> f32 {
  let enabled = params.focusParams.z * (1.0 - params.mode);
  let depthDelta = abs(depth - params.focusParams.x) / max(params.focusParams.x * 0.42, 0.24);
  let depthBlur = clamp(depthDelta, 0.0, 1.0) * 0.32;
  let tiltedOffset = abs(
    (sampleUv.y - params.focusBand.y)
      - (sampleUv.x - params.focusBand.x) * params.cameraProjection.y * params.focusBand.z
  );
  let bandBlur = smoothstep(params.focusBand.w * 0.42, params.focusBand.w * 1.52, tiltedOffset);
  return clamp(max(depthBlur, bandBlur) * params.focusParams.y * 1.35, 0.0, 1.0) * enabled;
}

fn hash21(p: vec2f) -> f32 {
  let h = dot(p, vec2f(127.1, 311.7));
  return fract(sin(h) * 43758.5453123);
}

fn bodies() -> array<vec4f, 9> {
  return array<vec4f, 9>(
    params.body0,
    params.body1,
    params.body2,
    params.body3,
    params.body4,
    params.body5,
    params.body6,
    params.body7,
    params.body8,
  );
}

fn bodyStyles() -> array<vec4f, 9> {
  return array<vec4f, 9>(
    params.bodyStyle0,
    params.bodyStyle1,
    params.bodyStyle2,
    params.bodyStyle3,
    params.bodyStyle4,
    params.bodyStyle5,
    params.bodyStyle6,
    params.bodyStyle7,
    params.bodyStyle8,
  );
}

fn bodyFocusValues() -> array<f32, 9> {
  return array<f32, 9>(
    params.bodyFocus0.x,
    params.bodyFocus0.y,
    params.bodyFocus0.z,
    params.bodyFocus0.w,
    params.bodyFocus1.x,
    params.bodyFocus1.y,
    params.bodyFocus1.z,
    params.bodyFocus1.w,
    params.bodyFocus2.x,
  );
}

fn potentialAt(q: vec2f) -> f32 {
  let fieldBodies = bodies();
  var potential = 0.0;
  for (var i = 0; i < 9; i = i + 1) {
    if (f32(i) >= params.bodyCount) { break; }
    let body = fieldBodies[i];
    if (body.z > 0.001) {
      let delta = q - body.xy;
      let heightSoftening = body.w * body.w * 0.18;
      potential = potential + body.z / sqrt(dot(delta, delta) + 0.022 + heightSoftening);
    }
  }
  return potential;
}

fn surfaceHeight(q: vec2f) -> f32 {
  let depth = potentialAt(q) * 0.06 * params.gravity - 0.025;
  return -min(0.72, max(0.0, depth));
}

fn surfaceNormal(q: vec2f) -> vec3f {
  let epsilon = 0.012;
  let left = surfaceHeight(q - vec2f(epsilon, 0.0));
  let right = surfaceHeight(q + vec2f(epsilon, 0.0));
  let near = surfaceHeight(q - vec2f(0.0, epsilon));
  let far = surfaceHeight(q + vec2f(0.0, epsilon));
  return normalize(vec3f(left - right, epsilon * 2.0, near - far));
}

fn raySphere(origin: vec3f, ray: vec3f, center: vec3f, radius: f32) -> f32 {
  let offset = origin - center;
  let b = dot(offset, ray);
  let c = dot(offset, offset) - radius * radius;
  let discriminant = b * b - c;
  if (discriminant < 0.0) {
    return FAR_DISTANCE;
  }
  let root = sqrt(discriminant);
  let near = -b - root;
  if (near > 0.0) {
    return near;
  }
  let far = -b + root;
  if (far > 0.0) {
    return far;
  }
  return FAR_DISTANCE;
}

fn background(ray: vec3f, uv: vec2f) -> vec3f {
  let horizon = pow(max(0.0, 1.0 - abs(ray.y) * 1.18), 3.0);
  let cinematic = vec3f(0.004, 0.001, 0.003) + vec3f(0.028, 0.005, 0.004) * horizon;
  let analysis = vec3f(0.001, 0.012, 0.011) + vec3f(0.002, 0.064, 0.044) * horizon;
  var color = mix(cinematic, analysis, params.mode);

  let starCoordinate = floor(uv * vec2f(params.width, params.height) * 0.68);
  let starSeed = hash21(starCoordinate);
  let star = smoothstep(0.99955, 1.0, starSeed) * (0.1 + hash21(starCoordinate + 17.0) * 0.24);
  color = color + vec3f(0.76, 0.82, 0.92) * star * smoothstep(0.76, 0.08, uv.y);
  return color;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let aspect = max(params.width / max(params.height, 1.0), 0.35);
  let screen = vec2f(
    (uv.x * 2.0 - 1.0) * aspect * params.cameraProjection.x,
    (1.0 - uv.y * 2.0) * params.cameraProjection.x,
  );
  let origin = params.cameraPos.xyz;
  let ray = normalize(
    params.cameraForward.xyz
      + params.cameraRight.xyz * screen.x
      + params.cameraUp.xyz * screen.y
  );
  let fieldBodies = bodies();
  let fieldStyles = bodyStyles();
  let fieldFocus = bodyFocusValues();
  var color = background(ray, uv);

  var surfaceT = FAR_DISTANCE;
  var surfacePoint = vec3f(0.0);
  var surfaceHit = false;
  if (ray.y < -0.0005) {
    var nearT = 0.025;
    var farT = nearT;
    var previousDistance = (origin + ray * nearT).y - surfaceHeight((origin + ray * nearT).xz);
    for (var iteration = 0; iteration < 76; iteration = iteration + 1) {
      let candidateT = 0.025 + f32(iteration + 1) * 0.21;
      let candidatePoint = origin + ray * candidateT;
      let distanceToSurface = candidatePoint.y - surfaceHeight(candidatePoint.xz);
      if (distanceToSurface <= 0.0 && previousDistance > 0.0) {
        farT = candidateT;
        surfaceHit = true;
        break;
      }
      nearT = candidateT;
      previousDistance = distanceToSurface;
    }
    if (surfaceHit) {
      for (var refinement = 0; refinement < 9; refinement = refinement + 1) {
        let midpoint = (nearT + farT) * 0.5;
        let midpointPoint = origin + ray * midpoint;
        if (midpointPoint.y > surfaceHeight(midpointPoint.xz)) {
          nearT = midpoint;
        } else {
          farT = midpoint;
        }
      }
      let point = origin + ray * farT;
      if (abs(point.x) < 8.0 && abs(point.z) < 8.0) {
        surfaceT = farT;
        surfacePoint = point;
      } else {
        surfaceHit = false;
      }
    }
  }

  var sphereT = FAR_DISTANCE;
  var sphereMass = 0.0;
  var sphereCenter = vec3f(0.0);
  var sphereStyle = vec4f(1.0, 0.94, 0.86, 1.0);
  var sphereDefocus = 0.0;
  var glow = vec3f(0.0);
  for (var i = 0; i < 9; i = i + 1) {
    if (f32(i) >= params.bodyCount) { break; }
    let body = fieldBodies[i];
    let style = fieldStyles[i];
    if (body.z > 0.001) {
      let center = vec3f(body.x, surfaceHeight(body.xy) + body.w, body.y);
      let radius = (0.026 + sqrt(body.z) * 0.022) * max(style.w, 0.2);
      let candidate = raySphere(origin, ray, center, radius);
      if (candidate < sphereT) {
        sphereT = candidate;
        sphereMass = body.z;
        sphereCenter = center;
        sphereStyle = style;
        sphereDefocus = fieldFocus[i];
      }

      let alongRay = max(0.0, dot(center - origin, ray));
      let closest = origin + ray * alongRay;
      let rayDistance = length(center - closest);
      let bodyDefocus = fieldFocus[i];
      let haloRate = mix(10.5 - body.z * 0.3, 6.2, bodyDefocus);
      let hotRate = mix(34.0, 14.0, bodyDefocus);
      let halo = exp(-rayDistance * haloRate) * body.z * mix(1.0, 0.9, bodyDefocus);
      let hot = exp(-rayDistance * hotRate) * body.z * mix(1.0, 0.72, bodyDefocus);
      let cinematicTint = mix(vec3f(1.18, 0.13, 0.018), style.rgb, 0.56);
      let analysisTint = mix(vec3f(0.96, 0.21, 0.0), style.rgb, 0.48);
      let cinematicGlow = cinematicTint * halo + mix(vec3f(1.45, 0.52, 0.1), style.rgb, 0.42) * hot;
      let analysisGlow = analysisTint * halo + mix(vec3f(1.3, 0.65, 0.04), style.rgb, 0.36) * hot;
      glow = glow + mix(cinematicGlow, analysisGlow, params.mode);
    }
  }

  var surfaceDefocus = 0.0;
  if (surfaceHit) {
    let q = surfacePoint.xz;
    let normal = surfaceNormal(q);
    let lightDirection = normalize(vec3f(-0.42, 0.86, -0.28));
    let diffuse = max(0.0, dot(normal, lightDirection));
    let rim = pow(1.0 - max(0.0, dot(normal, -ray)), 2.5);
    let depth = clamp(-surfacePoint.y / 0.72, 0.0, 1.0);
    surfaceDefocus = focusDefocus(surfaceT, uv);

    let cinematicSurface = mix(vec3f(0.009, 0.002, 0.004), vec3f(0.075, 0.012, 0.006), depth);
    let analysisSurface = mix(vec3f(0.003, 0.032, 0.027), vec3f(0.15, 0.062, 0.011), depth);
    var surfaceColor = mix(cinematicSurface, analysisSurface, params.mode);
    surfaceColor = surfaceColor * mix(0.58 + diffuse * 0.66, 0.38 + diffuse * 0.94, params.mode)
      + rim * mix(vec3f(0.08, 0.016, 0.009), vec3f(0.07, 0.18, 0.13), params.mode);

    let gridCoordinate = abs(fract(q * mix(10.4, 4.0, params.mode) + 0.5) - 0.5);
    let footprint = clamp(surfaceT * params.cameraProjection.x / max(params.height, 1.0) * 3.2, 0.0008, 0.035);
    let gridWidth = footprint * mix(18.0, 5.4, params.mode) * (1.0 + surfaceDefocus * 5.0);
    let gridX = 1.0 - smoothstep(0.0, gridWidth, gridCoordinate.x);
    let gridY = 1.0 - smoothstep(0.0, gridWidth, gridCoordinate.y);
    let cinematicGrid = gridY;
    let grid = mix(cinematicGrid, max(gridX, gridY), params.mode) * params.showField;
    let gridColor = mix(vec3f(0.56, 0.22, 0.11), vec3f(0.23, 0.52, 0.43), params.mode);
    let gridStrength = mix(0.27 + depth * 0.12, 0.22, params.mode) * (1.0 - surfaceDefocus * 0.86);
    surfaceColor = surfaceColor + gridColor * grid * gridStrength;

    var localGlow = vec3f(0.0);
    for (var i = 0; i < 9; i = i + 1) {
      if (f32(i) >= params.bodyCount) { break; }
      let body = fieldBodies[i];
      let style = fieldStyles[i];
      if (body.z > 0.001) {
        let distance = length(q - body.xy);
        let glowFalloff = (3.4 + body.w * 2.0) * mix(1.0, 0.68, surfaceDefocus);
        let intensity = exp(-distance * distance * glowFalloff) * body.z * (1.1 - body.w * 0.32);
        let wellTint = mix(vec3f(0.98, 0.48, 0.14), style.rgb, mix(0.34, 0.2, params.mode));
        localGlow = localGlow + wellTint * intensity;
      }
    }
    let breathing = 1.0 + sin(params.time * 0.76) * 0.03 * params.pulse;
    let distanceFade = clamp(1.12 - surfaceT * 0.035, 0.72, 1.0);
    surfaceColor = (surfaceColor + localGlow * breathing * mix(0.58, 0.31, params.mode)) * distanceFade;
    let softSurface = mix(vec3f(0.012, 0.003, 0.004), surfaceColor, 0.48);
    surfaceColor = mix(surfaceColor, softSurface, surfaceDefocus * 0.48);
    color = surfaceColor;
  }

  if (sphereT < surfaceT) {
    let hit = origin + ray * sphereT;
    let normal = normalize(hit - sphereCenter);
    let light = max(0.0, dot(normal, normalize(vec3f(-0.35, 0.82, -0.26))));
    let edge = pow(1.0 - max(0.0, dot(normal, -ray)), 2.1);
    let cinematicRim = mix(vec3f(1.0, 0.35, 0.07), sphereStyle.rgb, 0.6);
    let analysisRim = mix(vec3f(1.0, 0.48, 0.06), sphereStyle.rgb, 0.52);
    let rimColor = mix(cinematicRim, analysisRim, params.mode);
    let litBody = mix(sphereStyle.rgb, vec3f(1.0, 0.99, 0.94), 0.28 + light * 0.42);
    let sharpBody = litBody * (0.82 + light * 0.55 + sphereMass * 0.05) + rimColor * edge * 1.4;
    let softBody = mix(color, sharpBody, 0.14) + glow * 0.1;
    color = mix(sharpBody, softBody, sphereDefocus * 0.94);
  }

  color = color + glow * mix(0.44, 0.17, params.mode);
  var sceneDefocus = select(0.0, surfaceDefocus, surfaceHit);
  sceneDefocus = select(sceneDefocus, sphereDefocus, sphereT < surfaceT);
  let luminance = dot(color, vec3f(0.2126, 0.7152, 0.0722));
  let defocusedColor = mix(vec3f(luminance * 0.55), color, 0.62) + glow * 0.08;
  color = mix(color, defocusedColor, sceneDefocus * 0.34);
  color = color * (1.0 - sceneDefocus * 0.32 * (1.0 - params.mode));
  let focusExposure = params.focusParams.z * (1.0 - params.mode);
  let focusCompressed = color / (vec3f(1.0) + color * 0.26);
  color = mix(color, focusCompressed, focusExposure * 0.78);
  let grain = hash21(floor(uv * vec2f(params.width, params.height) * 0.42) + floor(params.time * 0.45));
  color = color + (grain - 0.5) * mix(0.009, 0.002, sceneDefocus);
  let vignette = 1.0 - smoothstep(0.42, 1.06, length((uv - 0.5) * vec2f(aspect * 0.72, 0.86)));
  color = color * (0.74 + vignette * 0.32);

  return vec4f(max(color, vec3f(0.0)), 1.0);
}
