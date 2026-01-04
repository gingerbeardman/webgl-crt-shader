import { Pane } from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js';
import { CRTShader } from './CRTShader.js';

const CANVAS_ID = 'crt-canvas';
const PANE_OFFSET = 16;
const PIXEL_RATIO_CAP = 2;
const BASE_SCENE_SIZE = 1024;
const INITIAL_SCENE_SIZE = BASE_SCENE_SIZE;
const BG_GRADIENT_INNER = '#0b1f3a';
const BG_GRADIENT_OUTER = '#050a14';
const BASE_ORBIT_RADIUS = 260;
const ORBIT_SPEED = 0.45;
const SPIN_SPEED = 0.9;
const BASE_SHAPE_SIZE = 220;
const BASE_SPHERE_RADIUS = 110;
const BASE_PYRAMID_RADIUS = 220;
const BASE_PYRAMID_HEIGHT = 220;
const GIF_PATH = './wormnomnom.gif';
const GIF_WIDTH = 256;
const GIF_HEIGHT = 256;
const GIF_SCALE = 1;
const CRT_DEFAULTS = {
  enabled: true,
  showShapes: false,
  scanlineIntensity: 0.15,
  scanlineCount: 256,
  adaptiveIntensity: 0.5,
  brightness: 1.1,
  contrast: 1.05,
  saturation: 1.1,
  bloomIntensity: 0.2,
  bloomThreshold: 0.5,
  rgbShift: 0.0,
  vignetteStrength: 0.3,
  curvature: 0.1,
  flickerStrength: 0.01
};

const canvas = document.getElementById(CANVAS_ID);
const gl = canvas.getContext('webgl2', { alpha: false });
if (!gl) {
  throw new Error('WebGL2 not supported');
}

const sceneCanvas = document.createElement('canvas');
sceneCanvas.width = INITIAL_SCENE_SIZE;
sceneCanvas.height = INITIAL_SCENE_SIZE;
const sceneCtx = sceneCanvas.getContext('2d');

const gifImage = new Image();
gifImage.src = GIF_PATH;
gifImage.crossOrigin = 'anonymous';
let gifReady = false;
gifImage.onload = () => {
  gifReady = true;
};

const state = {
  time: 0,
  params: { ...CRT_DEFAULTS },
  rotation: 0
};

const program = createProgram(gl, buildVertexSource(), buildFragmentSource());
const vao = createQuad(gl);
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
const uniforms = getUniformLocations(gl, program, [
  'uTexture',
  'uEnabled',
  'scanlineIntensity',
  'scanlineCount',
  'time',
  'yOffset',
  'brightness',
  'contrast',
  'saturation',
  'bloomIntensity',
  'bloomThreshold',
  'rgbShift',
  'adaptiveIntensity',
  'vignetteStrength',
  'curvature',
  'flickerStrength'
]);

const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sceneCanvas.width, sceneCanvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

setupPane();
resize();
window.addEventListener('resize', resize, { passive: true });

requestAnimationFrame(render);

function render(ts) {
  state.time = ts * 0.001;
  drawScene2D(state.time);

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, sceneCanvas);

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.useProgram(program);
  gl.bindVertexArray(vao);

  gl.activeTexture(gl.TEXTURE0);
  gl.uniform1i(uniforms.uTexture, 0);
  gl.uniform1i(uniforms.uEnabled, state.params.enabled ? 1 : 0);
  gl.uniform1f(uniforms.scanlineIntensity, state.params.scanlineIntensity);
  gl.uniform1f(uniforms.scanlineCount, state.params.scanlineCount);
  gl.uniform1f(uniforms.time, state.time);
  gl.uniform1f(uniforms.yOffset, 0.0);
  gl.uniform1f(uniforms.brightness, state.params.brightness);
  gl.uniform1f(uniforms.contrast, state.params.contrast);
  gl.uniform1f(uniforms.saturation, state.params.saturation);
  gl.uniform1f(uniforms.bloomIntensity, state.params.bloomIntensity);
  gl.uniform1f(uniforms.bloomThreshold, state.params.bloomThreshold);
  gl.uniform1f(uniforms.rgbShift, state.params.rgbShift);
  gl.uniform1f(uniforms.adaptiveIntensity, state.params.adaptiveIntensity);
  gl.uniform1f(uniforms.vignetteStrength, state.params.vignetteStrength);
  gl.uniform1f(uniforms.curvature, state.params.curvature);
  gl.uniform1f(uniforms.flickerStrength, state.params.flickerStrength);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  requestAnimationFrame(render);
}

function drawScene2D(time) {
  const t = time;
  const w = sceneCanvas.width;
  const h = sceneCanvas.height;
  sceneCtx.clearRect(0, 0, w, h);

  const grad = sceneCtx.createRadialGradient(
    w * 0.3,
    h * 0.3,
    Math.min(w, h) * 0.1,
    w * 0.5,
    h * 0.5,
    Math.min(w, h) * 0.8
  );
  grad.addColorStop(0, BG_GRADIENT_INNER);
  grad.addColorStop(1, BG_GRADIENT_OUTER);
  sceneCtx.fillStyle = grad;
  sceneCtx.fillRect(0, 0, w, h);

  const centerX = w * 0.5;
  const centerY = h * 0.45;
  const scale = Math.min(w, h) / BASE_SCENE_SIZE;
  const orbitRadius = BASE_ORBIT_RADIUS * scale;

  // Draw background elements in order: gradient, GIF, then shapes
  if (gifReady) {
    const side = Math.min(w, h) * GIF_SCALE;
    const drawW = side;
    const drawH = side;
    const gifX = (w - drawW) * 0.5;
    const gifY = (h - drawH) * 0.5;
    sceneCtx.drawImage(gifImage, gifX, gifY, drawW, drawH);
  }

  if (state.params.showShapes) {
    drawCube(centerX, centerY, t, scale, orbitRadius);
    drawSphere(centerX, centerY, t, scale, orbitRadius);
    drawPyramid(centerX, centerY, t, scale, orbitRadius);
  }
}

function drawCube(cx, cy, t, scale, orbitRadius) {
  const angle = t * ORBIT_SPEED;
  const spin = t * SPIN_SPEED;
  const x = cx + Math.cos(angle) * orbitRadius;
  const y = cy + Math.sin(angle) * orbitRadius;
  sceneCtx.save();
  sceneCtx.translate(x, y);
  sceneCtx.rotate(spin);
  sceneCtx.fillStyle = '#3b82f6';
  const size = BASE_SHAPE_SIZE * scale;
  sceneCtx.fillRect(-size * 0.5, -size * 0.5, size, size);
  sceneCtx.restore();
}

function drawSphere(cx, cy, t, scale, orbitRadius) {
  const angle = t * ORBIT_SPEED + (Math.PI * 2) / 3;
  const spin = t * SPIN_SPEED * 0.8;
  const x = cx + Math.cos(angle) * orbitRadius;
  const y = cy + Math.sin(angle) * orbitRadius;
  sceneCtx.save();
  sceneCtx.translate(x, y);
  sceneCtx.rotate(spin);
  sceneCtx.fillStyle = '#ef4444';
  sceneCtx.beginPath();
  const r = BASE_SPHERE_RADIUS * scale;
  sceneCtx.arc(0, 0, r, 0, Math.PI * 2);
  sceneCtx.fill();
  sceneCtx.restore();
}

function drawPyramid(cx, cy, t, scale, orbitRadius) {
  const angle = t * ORBIT_SPEED + (Math.PI * 4) / 3;
  const spin = t * SPIN_SPEED * 1.2;
  const x = cx + Math.cos(angle) * orbitRadius;
  const y = cy + Math.sin(angle) * orbitRadius;
  sceneCtx.save();
  sceneCtx.translate(x, y);
  sceneCtx.rotate(spin);
  sceneCtx.fillStyle = '#22c55e';
  sceneCtx.beginPath();
  const pr = BASE_PYRAMID_RADIUS * scale;
  const ph = BASE_PYRAMID_HEIGHT * scale;
  sceneCtx.moveTo(0, -ph * 0.5);
  sceneCtx.lineTo(-pr * 0.5, ph * 0.5);
  sceneCtx.lineTo(pr * 0.5, ph * 0.5);
  sceneCtx.closePath();
  sceneCtx.fill();
  sceneCtx.restore();
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, PIXEL_RATIO_CAP);
  const width = Math.floor(window.innerWidth * dpr);
  const height = Math.floor(window.innerHeight * dpr);
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  sceneCanvas.width = width;
  sceneCanvas.height = height;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sceneCanvas.width, sceneCanvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
}

function setupPane() {
  const pane = new Pane({ title: 'CRT Shader', expanded: true });
  pane.element.style.position = 'fixed';
  pane.element.style.top = `${PANE_OFFSET}px`;
  pane.element.style.right = `${PANE_OFFSET}px`;

  const params = state.params;

  pane.addBinding(params, 'showShapes', { label: 'Show shapes' });
  pane.addBinding(params, 'enabled', { label: 'Enabled' }).on('change', ev => {
    state.params.enabled = ev.value;
  });

  const scanlines = pane.addFolder({ title: 'Scanlines', expanded: true });
  scanlines.addBinding(params, 'scanlineIntensity', { min: 0, max: 1, step: 0.01, label: 'Intensity' });
  scanlines.addBinding(params, 'scanlineCount', { min: 50, max: 1200, step: 1, label: 'Count' });
  scanlines.addBinding(params, 'adaptiveIntensity', { min: 0, max: 1, step: 0.01, label: 'Adaptive' });

  const color = pane.addFolder({ title: 'Color', expanded: true });
  color.addBinding(params, 'brightness', { min: 0.6, max: 1.8, step: 0.01 });
  color.addBinding(params, 'contrast', { min: 0.6, max: 1.8, step: 0.01 });
  color.addBinding(params, 'saturation', { min: 0, max: 2, step: 0.01 });

  const bloom = pane.addFolder({ title: 'Bloom', expanded: true });
  bloom.addBinding(params, 'bloomIntensity', { min: 0, max: 1.5, step: 0.01, label: 'Intensity' });
  bloom.addBinding(params, 'bloomThreshold', { min: 0, max: 1, step: 0.01, label: 'Threshold' });
  bloom.addBinding(params, 'rgbShift', { min: 0, max: 1, step: 0.01, label: 'RGB Shift' });

  const framing = pane.addFolder({ title: 'Framing', expanded: true });
  framing.addBinding(params, 'vignetteStrength', { min: 0, max: 2, step: 0.01, label: 'Vignette' });
  framing.addBinding(params, 'curvature', { min: 0, max: 0.5, step: 0.005, label: 'Curvature' });
  framing.addBinding(params, 'flickerStrength', { min: 0, max: 0.15, step: 0.001, label: 'Flicker' });

  pane.addButton({ title: 'Reset to defaults' }).on('click', () => {
    Object.assign(params, CRT_DEFAULTS);
    pane.refresh();
  });
}

function buildVertexSource() {
  return `#version 300 es
    precision highp float;
    const vec2 pos[4] = vec2[4](
      vec2(-1.0, -1.0),
      vec2(1.0, -1.0),
      vec2(-1.0, 1.0),
      vec2(1.0, 1.0)
    );
    const vec2 uvData[4] = vec2[4](
      vec2(0.0, 0.0),
      vec2(1.0, 0.0),
      vec2(0.0, 1.0),
      vec2(1.0, 1.0)
    );
    out vec2 vUv;
    void main() {
      vUv = uvData[gl_VertexID];
      gl_Position = vec4(pos[gl_VertexID], 0.0, 1.0);
    }
  `;
}

function buildFragmentSource() {
  let body = CRTShader.fragmentShader;
  // Strip existing uniform/varying declarations and swap legacy helpers
  body = body.replace(/uniform\s+[^;]+;\s*/g, '');
  body = body.replace(/varying\s+[^;]+;\s*/g, '');
  body = body.replace(/\btDiffuse\b/g, 'uTexture');
  body = body.replace(/texture2D\s*\(/g, 'texture(');
  body = body.replace(/gl_FragColor/g, 'fragColor');
  body = body.replace(/void main\s*\(/, 'void mainImage(');
  return `#version 300 es
    precision highp float;
    uniform sampler2D uTexture;
    uniform bool uEnabled;
    uniform float scanlineIntensity;
    uniform float scanlineCount;
    uniform float time;
    uniform float yOffset;
    uniform float brightness;
    uniform float contrast;
    uniform float saturation;
    uniform float bloomIntensity;
    uniform float bloomThreshold;
    uniform float rgbShift;
    uniform float adaptiveIntensity;
    uniform float vignetteStrength;
    uniform float curvature;
    uniform float flickerStrength;
    in vec2 vUv;
    out vec4 fragColor;
    // Early exit for bypass
    void bypass() {
      fragColor = texture(uTexture, vUv);
    }
    // --- Original shader logic ---
    ${body}
    void main() {
      if (!uEnabled) {
        bypass();
        return;
      }
      mainImage();
    }
  `;
}

function createProgram(glContext, vsSource, fsSource) {
  const vs = compileShader(glContext, glContext.VERTEX_SHADER, vsSource);
  const fs = compileShader(glContext, glContext.FRAGMENT_SHADER, fsSource);
  const program = glContext.createProgram();
  glContext.attachShader(program, vs);
  glContext.attachShader(program, fs);
  glContext.linkProgram(program);
  if (!glContext.getProgramParameter(program, glContext.LINK_STATUS)) {
    throw new Error(glContext.getProgramInfoLog(program) || 'Program link error');
  }
  return program;
}

function compileShader(glContext, type, source) {
  const shader = glContext.createShader(type);
  glContext.shaderSource(shader, source);
  glContext.compileShader(shader);
  if (!glContext.getShaderParameter(shader, glContext.COMPILE_STATUS)) {
    throw new Error(glContext.getShaderInfoLog(shader) || 'Shader compile error');
  }
  return shader;
}

function createQuad(glContext) {
  const vaoHandle = glContext.createVertexArray();
  glContext.bindVertexArray(vaoHandle);
  return vaoHandle;
}

function getUniformLocations(glContext, programHandle, names) {
  const map = {};
  for (let i = 0; i < names.length; i += 1) {
    map[names[i]] = glContext.getUniformLocation(programHandle, names[i]);
  }
  return map;
}
