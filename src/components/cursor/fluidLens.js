import { FIELD } from './fluidField.js';

// A WebGL2 canvas inside one band's background layer (index.css .band-bg) that repaints the band where the height
// field (fluidField.js) is disturbed: the band's color, light and grain, seen through the bent surface (the grain
// slides along its slopes) and lit from the top left. Where the field is flat it is transparent, so the page's own
// background shows and the two always meet without a seam.

export const LENS_PX = FIELD.cells * FIELD.cell;
const MAX_DPR = 2;

const VERTEX = `#version 300 es
in vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D u_field, u_grain;
uniform float u_size, u_dpr, u_cell, u_tile, u_tone, u_lightA;
uniform vec2 u_origin, u_grainShift, u_lightC, u_lightR;
uniform vec3 u_base;
out vec4 color;
const vec3 LIGHT = normalize(vec3(-1.0, -1.2, 1.6)); // from the top left: x right, y down, z to the viewer
const vec3 LAMP = vec3(242.0 / 255.0);
const float REFRACT = 40.0; // px the grain slides per unit of slope
const float SLOPE = 3.5; // steepness the shading reads into the slopes
const float DARK = 0.8, BRIGHT = 0.35; // shading of the walls turned from and to the light

// The band at q (lens px) as index.css paints it: its color, the pool of light, the grain; a base band shows the
// body's grain under the light, a surface band its own grain over it.
vec3 band(vec2 q) {
  float light = u_lightA * max(0.0, 1.0 - length((q + u_origin - u_lightC) / u_lightR));
  vec4 grain = texture(u_grain, (q + u_grainShift) / u_tile);
  vec3 c = u_base;
  if (u_tone > 0.5) {
    c = mix(mix(c, LAMP, light), grain.rgb, grain.a);
  } else {
    c = mix(mix(c, grain.rgb, grain.a), LAMP, light);
  }
  return c;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, u_size * u_dpr - gl_FragCoord.y) / u_dpr;
  vec2 uv = p / u_size;
  vec2 e = vec2(1.0 / float(textureSize(u_field, 0).x), 0.0);
  float h = texture(u_field, uv).r;
  vec2 slope = vec2(texture(u_field, uv + e.xy).r - texture(u_field, uv - e.xy).r,
                    texture(u_field, uv + e.yx).r - texture(u_field, uv - e.yx).r) / (2.0 * u_cell);
  vec3 c = band(p + slope * REFRACT);
  vec3 normal = normalize(vec3(-slope * SLOPE, 1.0));
  float lit = dot(normal, LIGHT) - LIGHT.z;
  c = lit > 0.0 ? mix(c, vec3(1.0), lit * BRIGHT) : mix(c, vec3(0.0), -lit * DARK);
  float edge = min(min(uv.x, uv.y), min(1.0 - uv.x, 1.0 - uv.y));
  float a = smoothstep(0.05, 0.6, abs(h) + length(slope) * 20.0) * smoothstep(0.0, 0.15, edge);
  color = vec4(c * a, a);
}`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

function texture(gl, unit, filter, wrap) {
  const handle = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, handle);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
  return handle;
}

/** A lens canvas, or null without WebGL2. Its `element` is moved between bands by GrainDent.jsx. */
export function createLens() {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  const canvas = document.createElement('canvas');
  canvas.className = 'grain-dent';
  canvas.width = Math.round(LENS_PX * dpr);
  canvas.height = canvas.width;
  Object.assign(canvas.style, { width: `${LENS_PX}px`, height: `${LENS_PX}px` });
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl) return null;

  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const names = ['field', 'grain', 'size', 'dpr', 'cell', 'tile', 'tone', 'lightA', 'origin', 'grainShift', 'lightC', 'lightR', 'base'];
  const u = Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(program, `u_${name}`)]));

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const corner = gl.getAttribLocation(program, 'a');
  gl.enableVertexAttribArray(corner);
  gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0);

  const n = FIELD.cells;
  texture(gl, 0, gl.LINEAR, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, n, n, 0, gl.RED, gl.FLOAT, null);
  texture(gl, 1, gl.NEAREST, gl.REPEAT);
  gl.uniform1i(u.field, 0);
  gl.uniform1i(u.grain, 1);
  gl.uniform1f(u.size, LENS_PX);
  gl.uniform1f(u.dpr, canvas.width / LENS_PX);
  gl.uniform1f(u.cell, FIELD.cell);
  gl.viewport(0, 0, canvas.width, canvas.height);
  let grainReady = false;

  return {
    element: canvas,
    host: null,
    /** grain: a canvas with one grain tile drawn at `tile` px × dpr. */
    setGrain(grain, tile) {
      gl.activeTexture(gl.TEXTURE1);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, grain);
      gl.uniform1f(u.tile, tile);
      grainReady = true;
    },
    /** heights: the field; band: { origin, grainShift, tone, base, lightC, lightR, lightA } in px of the band. */
    draw(heights, band) {
      if (!grainReady || gl.isContextLost()) return;
      gl.activeTexture(gl.TEXTURE0);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, n, n, gl.RED, gl.FLOAT, heights);
      gl.uniform2fv(u.origin, band.origin);
      gl.uniform2fv(u.grainShift, band.grainShift);
      gl.uniform1f(u.tone, band.tone === 'surface' ? 1 : 0);
      gl.uniform3fv(u.base, band.base);
      gl.uniform2fv(u.lightC, band.lightC);
      gl.uniform2fv(u.lightR, band.lightR);
      gl.uniform1f(u.lightA, band.lightA);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose() {
      canvas.remove();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
