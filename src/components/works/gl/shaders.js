// Shaders of a works photo drawn as a WebGL plane (WorkPlane.jsx). The plane is a unit square scaled to the
// photo's frame in px; uStrength is the smoothed scroll speed, -1..1 (positive: the page moves up).

// The plane stretches a little along the scroll and its middle lags behind the edges, like cloth pulled past.
export const vertexShader = /* glsl */ `
  uniform float uStrength;
  varying vec2 vUv;

  const float PI = 3.141592653589793;
  const float BEND = 0.05; // share of the height the middle lags by at full strength
  const float STRETCH = 0.03; // share of the height the plane grows by at full strength

  void main() {
    vUv = uv;
    vec3 pos = position;
    pos.y *= 1.0 + abs(uStrength) * STRETCH;
    pos.y -= sin(uv.x * PI) * uStrength * BEND;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// The photo covers its frame (object-fit: cover), zoomed and drifting inside it as PhotoReveal does, opens from
// uInset with the card's rounded corners, and its colour channels part along the scroll with the speed.
export const fragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D uMap;
  uniform vec2 uSize; // frame, px
  uniform float uImageAspect; // width / height of the photo
  uniform float uStrength;
  uniform float uZoom;
  uniform float uDrift; // share of the frame height the photo is shifted down by
  uniform vec4 uInset; // top, right, bottom, left: shares of the frame still closed
  uniform float uRadius; // px
  varying vec2 vUv;

  const float SHIFT = 0.01; // share of the photo height the red and blue channels part by at full strength

  float roundedBox(vec2 point, vec2 halfSize, float radius) {
    vec2 q = abs(point) - halfSize + radius;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  }

  void main() {
    vec2 low = vec2(uInset.w, uInset.z);
    vec2 high = vec2(1.0 - uInset.y, 1.0 - uInset.x);
    vec2 halfSize = (high - low) * 0.5 * uSize;
    float edge = roundedBox(vUv * uSize - (low + high) * 0.5 * uSize, halfSize, min(uRadius, min(halfSize.x, halfSize.y)));
    float alpha = 1.0 - smoothstep(-0.75, 0.75, edge);
    if (alpha <= 0.0) discard;

    float frameAspect = uSize.x / uSize.y;
    vec2 fit = frameAspect > uImageAspect ? vec2(1.0, uImageAspect / frameAspect) : vec2(frameAspect / uImageAspect, 1.0);
    vec2 uv = (vUv - 0.5) * fit / uZoom + 0.5;
    uv.y += uDrift * fit.y / uZoom;

    vec2 shift = vec2(0.0, uStrength * SHIFT);
    float red = texture2D(uMap, uv + shift).r;
    float green = texture2D(uMap, uv).g;
    float blue = texture2D(uMap, uv - shift).b;
    gl_FragColor = vec4(red, green, blue, alpha);
  }
`;
