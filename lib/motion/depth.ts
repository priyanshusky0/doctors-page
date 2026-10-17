// One WebGL canvas for every scene photo. Each photo is drawn inside its plate's on-screen
// rectangle; its depth map pushes near pixels further than far ones as the camera drifts,
// so flat photos read as rooms. Plates keep their plain <img> until both textures are ready.

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uImg;
uniform sampler2D uDepth;
uniform vec2 uCover;   // fraction of the photo visible in the plate (object-fit: cover)
uniform vec2 uShift;   // camera drift, in uv units at full depth
uniform float uZoom;   // dolly-in amount for the scene, 0..1
uniform float uAlpha;
uniform float uDim;
void main() {
  vec2 uv = (vUv - 0.5) * uCover + 0.5;
  float d = texture2D(uDepth, uv).r;
  // two refinement steps so near objects sample their own depth after moving
  for (int i = 0; i < 2; i++) {
    vec2 p = 0.5 + (uv - 0.5) * (1.0 - uZoom * (0.015 + d * 0.05)) + uShift * (d - 0.35);
    d = mix(d, texture2D(uDepth, p).r, 0.5);
  }
  vec2 p = 0.5 + (uv - 0.5) * (1.0 - uZoom * (0.015 + d * 0.05)) + uShift * (d - 0.35);
  vec3 col = texture2D(uImg, clamp(p, 0.001, 0.999)).rgb * uDim;
  gl_FragColor = vec4(col * uAlpha, uAlpha);
}`;

type PlateState = {
  el: HTMLElement;
  img: HTMLImageElement;
  tex?: WebGLTexture;
  depthTex?: WebGLTexture;
  aspect: number;
  ready: boolean;
  /** scroll progress through the plate's scene, 0..1 (set by the engine) */
  p: number;
  calm: boolean;
};

export type Depth = ReturnType<typeof createDepth>;

export function createDepth(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
  });
  if (!gl) return null;

  const prog = link(gl, VERT, FRAG);
  if (!prog) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const u = {
    img: gl.getUniformLocation(prog, "uImg"),
    depth: gl.getUniformLocation(prog, "uDepth"),
    cover: gl.getUniformLocation(prog, "uCover"),
    shift: gl.getUniformLocation(prog, "uShift"),
    zoom: gl.getUniformLocation(prog, "uZoom"),
    alpha: gl.getUniformLocation(prog, "uAlpha"),
    dim: gl.getUniformLocation(prog, "uDim"),
  };
  gl.uniform1i(u.img, 0);
  gl.uniform1i(u.depth, 1);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.SCISSOR_TEST);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  const plates: PlateState[] = [];
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  let W = 0;
  let H = 0;
  let lost = false;
  let disabled = false;

  function resize() {
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  resize();
  window.addEventListener("resize", resize);

  function texture(source: TexImageSource) {
    const t = gl!.createTexture()!;
    gl!.bindTexture(gl!.TEXTURE_2D, t);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, source);
    return t;
  }

  function prepare(s: PlateState) {
    const src = s.img.currentSrc || s.img.src;
    const depthImg = new Image();
    depthImg.decoding = "async";
    depthImg.onload = () => {
      if (lost || disabled) return;
      s.tex = texture(s.img);
      s.depthTex = texture(depthImg);
      s.aspect = s.img.naturalWidth / s.img.naturalHeight;
      s.ready = true;
      s.el.classList.add("plate--gl");
    };
    depthImg.src = src.replace(/\.webp$/, "-depth.webp");
  }

  function add(el: HTMLElement) {
    const img = el.querySelector("img");
    if (!img) return null;
    const s: PlateState = { el, img, aspect: 16 / 9, ready: false, p: 0, calm: el.dataset.calm !== undefined };
    plates.push(s);
    if (img.complete && img.naturalWidth) prepare(s);
    else img.addEventListener("load", () => prepare(s), { once: true });
    return s;
  }

  /** shift: camera drift from pointer / scroll, in uv units. */
  function render(shift: [number, number]) {
    if (lost || disabled) return;
    gl!.scissor(0, 0, canvas.width, canvas.height);
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    for (const s of plates) {
      if (!s.ready) continue;
      const r = s.el.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= H || r.width === 0 || r.height === 0) continue;
      const alpha = parseFloat(s.el.style.opacity || "1");
      if (alpha <= 0.001) continue;
      const dim = parseFloat(s.el.style.getPropertyValue("--dim") || "1");
      const x = Math.round(r.left * dpr);
      const y = Math.round((H - r.bottom) * dpr);
      const w = Math.round(r.width * dpr);
      const h = Math.round(r.height * dpr);
      gl!.viewport(x, y, w, h);
      gl!.scissor(Math.max(0, x), Math.max(0, y), Math.max(0, Math.min(w, canvas.width - x)), Math.max(0, Math.min(h, canvas.height - y)));
      const ra = r.width / r.height;
      const over = s.calm ? 0.985 : 0.93; // overscan: leaves room for the drift without showing edges
      const cover: [number, number] = ra > s.aspect ? [over, (s.aspect / ra) * over] : [(ra / s.aspect) * over, over];
      gl!.uniform2f(u.cover, cover[0], cover[1]);
      // the scroll through the scene drifts the camera across, on top of the pointer
      const drift = (s.p - 0.5) * (s.calm ? 0.2 : 1);
      gl!.uniform2f(u.shift, shift[0] * (s.calm ? 0.3 : 1) + drift * 0.05, shift[1] * (s.calm ? 0.3 : 1) + drift * 0.018);
      gl!.uniform1f(u.zoom, s.calm ? s.p * 0.15 : s.p);
      gl!.uniform1f(u.alpha, alpha);
      gl!.uniform1f(u.dim, dim);
      gl!.activeTexture(gl!.TEXTURE0);
      gl!.bindTexture(gl!.TEXTURE_2D, s.tex!);
      gl!.activeTexture(gl!.TEXTURE1);
      gl!.bindTexture(gl!.TEXTURE_2D, s.depthTex!);
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
    }
  }

  /** Give every plate back its plain image (context lost, or the device is struggling). */
  function disable() {
    disabled = true;
    canvas.style.display = "none";
    for (const s of plates) s.el.classList.remove("plate--gl");
  }

  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    lost = true;
    disable();
  });

  function destroy() {
    window.removeEventListener("resize", resize);
    disable();
    gl!.getExtension("WEBGL_lose_context")?.loseContext();
  }

  return { add, render, disable, destroy, get active() { return !lost && !disabled; } };
}

function link(gl: WebGLRenderingContext, vs: string, fs: string) {
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  };
  const v = sh(gl.VERTEX_SHADER, vs);
  const f = sh(gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return null;
  const p = gl.createProgram()!;
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
}
