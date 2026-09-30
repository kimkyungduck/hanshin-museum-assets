/* ══════════════════════════════════════════════════════════
   밤 — 야간 골프장 (v97)
   ══════════════════════════════════════════════════════════
   호러 2단계. 해가 지고, 안개가 내려앉고, 18번 홀은 조명탑으로만 밝다.
     · 하늘 — 짙은 남색 · 별 · 달(북쪽 그린 너머, 낮게) · 달빛에 가장자리만 빛나는 구름 · 조명에 번진 지평선
     · 해 → 달빛(푸르고 약하게, 그림자는 그대로) · 반구광 · 환경광을 어둡게 · 안개는 짙고 검푸르게
     · 조명탑 — 18m 기둥 끝에 투광등 8개. 페어웨이 · 티 · 호숫가 · 그린을 겨눈다. 안개 속 빛기둥 · 번짐
     · 가로등 — 광장(원래 있던 것) · 조각 정원 · 퍼팅 연습장. 몇 개는 가끔 깜빡인다
   ⚠️ 조명탑 · 가로등을 three 광원으로 켜면 **모든 재질**(실내 포함)이 광원 개수만큼 셰이더를 다시 만들고
      폰 uniform 한도에 닿는다. → 바깥 재질(userData.out)에만 셰이더 조각을 얹어 '투광등 배열'을 직접 계산한다.
      배열 크기는 고정(FLOOD_N) · 매 프레임 가까운 것을 채워 넣는다(재컴파일 없음).
      빛 계산은 three 의 RE_Direct 를 그대로 부른다 → 광택 바닥 · 물에 조명이 비친다. */
const NIGHT = {
  on: true,
  fogC: 0x0A0E17, fogD: 0.0115, bg: 0x05070D,
  moon: new THREE.Color(0x9DB2DE), moonI: 0.34,
  hemiSky: 0x34425E, hemiGnd: 0x0B0A09, hemiI: 0.2,
  envIn: 0.55, lightIn: 0.72,           // 실내 환경광 · 방 조명 배율(전시물 스포트는 그대로)
  floods: [], lamps: [], t: 0,
};
/* 달 — 북쪽(그린 너머) 낮게. 달빛 그림자도 이 방향(world.js buildSun 이 SUN_DIR 을 쓴다) */
if (NIGHT.on && typeof SUN_DIR !== 'undefined') SUN_DIR.set(0.34, 0.42, -0.84).normalize();

/* ── 하늘 ─────────────────────────────────────────────── */
function nightSkyMaterial(env) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uMoon: { value: SUN_DIR }, uEnv: { value: env ? 1 : 0 } },
    vertexShader: `varying vec3 vDir;
      void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w; }`,
    fragmentShader: `uniform vec3 uMoon; uniform float uEnv; varying vec3 vDir;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      float fb(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * vn(p); p *= 2.03; a *= 0.5; } return s; }
      void main() {
        vec3 d = normalize(vDir); float y = d.y;
        vec3 zen = vec3(0.004, 0.006, 0.016), hor = vec3(0.028, 0.034, 0.052);
        vec3 col = mix(hor, zen, smoothstep(0.0, 0.55, y));
        // 조명탑 빛이 안개에 번진 지평선 — 필드 쪽(북)이 조금 더
        col += vec3(0.07, 0.066, 0.05) * exp(-max(y, 0.0) * 14.0) * (0.55 + 0.45 * smoothstep(0.2, -0.9, d.z));
        col = mix(col, vec3(0.012, 0.014, 0.02), smoothstep(0.0, -0.06, y));
        float s = max(dot(d, uMoon), 0.0);
        if (y > 0.0) {
          // 별 — 방향 격자 칸마다 하나. 지평선 가까이는 안개에 잠긴다
          vec3 q = d * 230.0, c = floor(q), f = fract(q) - 0.5;
          float r = h3(c);
          float st = step(0.9965, r) * smoothstep(0.16, 0.0, length(f - (vec3(h3(c + 1.7), h3(c + 3.1), h3(c + 5.3)) - 0.5) * 0.6));
          col += vec3(0.8, 0.85, 1.0) * st * (0.4 + 2.2 * fract(r * 91.7)) * smoothstep(0.05, 0.35, y) * (1.0 - uEnv);
          // 구름 — 어둡고, 달 쪽 가장자리만 빛난다. 별을 가린다
          vec2 uv = d.xz / (y + 0.12) * 1.5;
          float cl = fb(uv + vec2(3.1, 1.7));
          cl = smoothstep(0.5, 0.8, cl) * smoothstep(0.0, 0.2, y);
          float rim = pow(s, 6.0) * 0.5 + 0.08;
          col = mix(col, vec3(0.03, 0.036, 0.05) + vec3(0.16, 0.18, 0.22) * rim * fb(uv * 2.1 + 5.0), cl * 0.9);
        }
        // 달 — 원반 · 번짐
        float disc = smoothstep(0.99972, 0.99980, s);
        float mare = 0.82 + 0.18 * vn(d.xy * 900.0);
        col = mix(col, vec3(1.0, 0.97, 0.88) * (uEnv > 0.5 ? 2.0 : 5.0) * mare, disc);
        col += vec3(0.55, 0.62, 0.8) * (pow(s, 400.0) * 0.5 + pow(s, 24.0) * 0.06);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

/* ── 장면 — buildSun 다음에 부른다 ─────────────────────────── */
function nightScene() {
  if (!NIGHT.on) return;
  const S = M.scene;
  S.background = new THREE.Color(NIGHT.bg);
  S.fog = new THREE.FogExp2(NIGHT.fogC, NIGHT.fogD);
  if (M.sun) { M.sun.color.copy(NIGHT.moon); M.sun.intensity = NIGHT.moonI; }
  if (M.hemi) { M.hemi.color.set(NIGHT.hemiSky); M.hemi.groundColor.set(NIGHT.hemiGnd); M.hemi.intensity = NIGHT.hemiI; }
  if (M.handLight) M.handLight.intensity *= 0.7;
  if (typeof torchInit === 'function') torchInit();            // v105 — 손전등(끄면 세기 0 — 광원 수는 처음부터 고정)
  const U = M.post && M.post.uniforms;
  if (U) { if (U.uVig) U.uVig.value = 0.82; if (U.uLift) U.uLift.value = 0.12; }
}

/* ── 투광등 배열 — 바깥 재질에 얹는 셰이더 조각 ────────────────────── */
let FLOOD_N = 12;
const FLOOD_U = { uFlP: { value: [] }, uFlD: { value: [] }, uFlK: { value: [] } };
function floodInit() {
  const maxF = (M.renderer && M.renderer.capabilities.maxFragmentUniforms) || 224;
  FLOOD_N = clamp(Math.floor((maxF - 200) / 3), 6, 16);          // 폰 uniform 한도에서 넉넉히 남긴다
  for (let i = 0; i < FLOOD_N; i++) {
    FLOOD_U.uFlP.value.push(new THREE.Vector4(0, -1000, 0, 1));   // xyz 위치(카메라 기준) · w 사거리
    FLOOD_U.uFlD.value.push(new THREE.Vector4(0, -1, 0, 0.5));    // xyz 방향 · w 바깥 cos
    FLOOD_U.uFlK.value.push(new THREE.Vector4(0, 0, 0, 0.9));     // rgb 세기 · w 안쪽 cos
  }
}
function floodPatch(m) {
  if (!NIGHT.on || !m || m.userData.flood || !(m.isMeshStandardMaterial || m.isMeshPhysicalMaterial)) return;
  if (!FLOOD_U.uFlP.value.length) floodInit();
  m.userData.flood = true;
  const prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey;
  m.onBeforeCompile = function (sh, r) {
    if (prev) prev.call(this, sh, r);
    Object.assign(sh.uniforms, FLOOD_U);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n#define FLOOD_N ' + FLOOD_N + '\nuniform vec4 uFlP[FLOOD_N], uFlD[FLOOD_N], uFlK[FLOOD_N];')
      .replace('#include <lights_fragment_maps>', `
        for (int fi = 0; fi < FLOOD_N; fi++) {
          vec3 fL = uFlP[fi].xyz - geometryPosition;
          float fd = length(fL);
          fL /= max(fd, 1e-3);
          float cone = smoothstep(uFlD[fi].w, uFlK[fi].w, dot(-fL, uFlD[fi].xyz));
          float att = pow(clamp(1.0 - pow(fd / uFlP[fi].w, 4.0), 0.0, 1.0), 2.0) / max(fd * fd, 0.25);
          IncidentLight fl; fl.direction = fL; fl.color = uFlK[fi].rgb * (cone * att); fl.visible = true;
          RE_Direct(fl, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight);
        }
        #include <lights_fragment_maps>`);
  };
  m.customProgramCacheKey = function () { return (prevKey ? prevKey.call(this) : '') + '|flood' + FLOOD_N; };
  m.needsUpdate = true;
}

/* ── 조명탑 · 가로등 만들기 — 방 조립이 끝난 뒤(buildBoundaries 다음, applyEnv 전) ───────── */
const FLOOD_TOWERS = [
  // 기둥 자리(cm) → 겨누는 곳(cm). 호수 · 카트길은 피했다
  { x: 700, z: -1750, ax: 2300, az: -2900 },       // 티 왼쪽 뒤
  { x: 4700, z: -2100, ax: 3000, az: -3500 },      // 티 오른쪽
  { x: -1700, z: -4300, ax: 900, az: -5300 },      // 호수 왼쪽
  { x: 6000, z: -4500, ax: 4300, az: -5800 },      // 우회 페어웨이
  { x: -300, z: -8200, ax: 2200, az: -8900 },      // 그린 왼쪽
  { x: 5100, z: -7900, ax: 3100, az: -8900 },      // 그린 오른쪽
  { x: 2500, z: -11500, ax: 2600, az: -9500, flicker: true },   // 그린 뒤 — 가끔 깜빡인다
];
function nightLamp(g, xm, ym, zm, opt) {
  // 가로등 한 개(자리만) — lampPosts(site.js)가 부른다. m 단위, 방 그룹 기준
  NIGHT.lamps.push({ g, x: xm, y: ym, z: zm, flicker: !!(opt && opt.flicker), seed: Math.random() * 100 });
}
function buildNight() {
  if (!NIGHT.on) return;
  if (!FLOOD_U.uFlP.value.length) floodInit();
  const F = M.roomById.field, g = M.roomGroups.field;
  const metal = new THREE.MeshStandardMaterial({ color: 0x3A3C40, roughness: 0.55, metalness: 0.6 });
  const conc = new THREE.MeshStandardMaterial({ color: 0x77726A, roughness: 0.9 });
  const faceOn = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.97, 0.9).multiplyScalar(9) });
  const faceFl = new THREE.MeshBasicMaterial({ color: faceOn.color.clone() });
  [metal, conc].forEach((m) => { m.userData.out = true; m.userData.noBatch = true; });
  const partsM = [], partsC = [], facesOn = [], facesFl = [];
  const up = new THREE.Vector3(0, 1, 0), mx = new THREE.Matrix4();
  const put = (list, geo, basis, at) => { mx.copy(basis).setPosition(at); geo.applyMatrix4(mx); list.push(geo); };
  if (F && g) for (const T of FLOOD_TOWERS) {
    const gy = terrainCm(T.x, T.z) / CM, H = 18;
    const head = new THREE.Vector3(T.x / CM, gy + H, T.z / CM);
    const aim = new THREE.Vector3(T.ax / CM, terrainCm(T.ax, T.az) / CM, T.az / CM);
    const f = aim.clone().sub(head).normalize(), r = new THREE.Vector3().crossVectors(f, up).normalize(), u = new THREE.Vector3().crossVectors(r, f);
    const B = new THREE.Matrix4().makeBasis(r, u, f.clone().negate().negate());
    const I = new THREE.Matrix4();
    // 기초 · 기둥(팔각, 위로 가늘게) · 사다리 대신 발판 둘
    put(partsC, new THREE.BoxGeometry(1.3, 0.6, 1.3), I, new THREE.Vector3(head.x, gy + 0.1, head.z));
    put(partsM, new THREE.CylinderGeometry(0.15, 0.3, H - 0.4, 8), I, new THREE.Vector3(head.x, gy + (H - 0.4) / 2, head.z));
    put(partsM, new THREE.BoxGeometry(1.1, 0.06, 0.8), I, new THREE.Vector3(head.x, gy + H - 1.3, head.z));
    // 머리 — 가로대 둘에 등 2줄 × 4
    for (const oy of [0.32, -0.32]) put(partsM, new THREE.BoxGeometry(3.3, 0.1, 0.1), B, head.clone().addScaledVector(u, oy).addScaledVector(f, -0.25));
    for (let row = 0; row < 2; row++) for (let k = 0; k < 4; k++) {
      const c = head.clone().addScaledVector(r, (k - 1.5) * 0.78).addScaledVector(u, row ? -0.32 : 0.32);
      put(partsM, new THREE.BoxGeometry(0.64, 0.52, 0.36), B, c);
      put(T.flicker ? facesFl : facesOn, new THREE.PlaneGeometry(0.54, 0.42), B, c.clone().addScaledVector(f, 0.185));
    }
    M.walls.push({ x0: T.x - 45, x1: T.x + 45, z0: T.z - 45, z1: T.z + 45, y0: -500, y1: 2500 });
    // 번짐 — 앞에서 볼 때 크게(매 프레임 stepNight 가 방향을 본다)
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: nightHaloTex(), color: 0xFFF3DC, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, fog: false }));
    halo.scale.set(9, 9, 1); halo.position.copy(head).addScaledVector(f, 0.6); g.add(halo);
    // 빛기둥 — 안개 속 원뿔(아주 옅게)
    const len = head.distanceTo(aim) * 1.05, rad = len * 0.42;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(rad, len, 28, 1, true), nightBeamMat());
    cone.position.copy(head).addScaledVector(f, len / 2);
    cone.quaternion.setFromUnitVectors(up, f.clone().negate());
    cone.renderOrder = 5; g.add(cone);
    NIGHT.floods.push({ tower: true, pos: head.clone().addScaledVector(f, 0.3), dir: f, range: 95, cosO: Math.cos(0.62), cosI: Math.cos(0.3),
      col: new THREE.Color(1.0, 0.96, 0.88), I: 1150, flicker: !!T.flicker, seed: T.x * 0.01, halo, beam: cone });
  }
  if (F && g) {
    const add = (list, mat) => { if (!list.length) return null; const m = new THREE.Mesh(mergeGeos(list), mat); m.castShadow = mat !== faceOn && mat !== faceFl; g.add(m); return m; };
    add(partsM, metal); add(partsC, conc); add(facesOn, faceOn);
    NIGHT.faceFl = faceFl; add(facesFl, faceFl);
  }
  // 조각 정원 · 퍼팅 연습장 가로등 — 후보 자리 중 막히지 않은 곳(m)
  const lampAt = (rid, cand, flick) => {
    const r = M.roomById[rid], gg = M.roomGroups[rid];
    if (!r || !gg) return;
    const pts = [];
    for (const [x, z] of cand) {
      for (const [dx, dz] of [[0, 0], [2, 0], [-2, 0], [0, 2], [0, -2], [3, 3], [-3, -3]]) {
        const X = (x + dx) * CM, Z = (z + dz) * CM;
        if (!inRect(r, X, Z) || hitsWall(X, Z, r.y0) || hitsWall(X + 60, Z, r.y0)) continue;
        pts.push([x + dx, z + dz]); break;
      }
    }
    const before = NIGHT.lamps.length;
    lampPosts(gg, pts);
    for (let i = before; i < NIGHT.lamps.length; i++) if (flick.includes(i - before)) NIGHT.lamps[i].flicker = true;
  };
  lampAt('garden', [[-5, 4], [-5, 26], [-5, 48], [-35, 12], [-35, 38], [-21, 60]], [4]);
  lampAt('practice', [[53, 4], [83, 4], [53, 34], [83, 40], [60, 60]], [2]);
  // 가로등 → 빛 · 번짐. 깜빡이는 것은 제 머리 판을 따로 둔다
  for (const L of NIGHT.lamps) {
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: nightHaloTex(), color: 0xFFD9A0, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, fog: false, opacity: 0.8 }));
    halo.scale.set(2.2, 2.2, 1); halo.position.set(L.x, L.y - 0.05, L.z); L.g.add(halo);
    let head = null;
    if (L.flicker) {
      head = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.035, 0.15), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xFFE0B0).multiplyScalar(7) }));
      head.position.set(L.x, L.y - 0.004, L.z); L.g.add(head);
    }
    const ry = (M.roomById[L.g.name.slice(5)] || { y0: 0 }).y0 / CM;
    NIGHT.floods.push({ tower: false, pos: new THREE.Vector3(L.x, ry + L.y - 0.1, L.z), dir: new THREE.Vector3(0, -1, 0), range: 15,
      cosO: Math.cos(1.25), cosI: Math.cos(0.55), col: new THREE.Color(0xFFC98A), I: 48, flicker: L.flicker, seed: L.seed, halo, head });
  }
  markOut(g);
  // 바깥 치장 중 '실내용' 재질을 쓰던 것(조각 · 벤치 · 스타터 하우스 …) — 바깥용 사본으로 바꾼다.
  // 예전엔 실내 환경맵(밝은 홀)을 받아 밤에 혼자 하얗게 떴다. 공용 재질을 그대로 표시하면 실내 소품까지 어두워진다
  const outCopy = new Map();
  for (const r of M.rooms) {
    if (!r.outdoor || !M.roomGroups[r.id]) continue;
    M.roomGroups[r.id].traverse((o) => {
      if (!o.isMesh || Array.isArray(o.material)) return;
      const m = o.material;
      if (!m || m.userData.out || !(m.isMeshStandardMaterial || m.isMeshPhysicalMaterial)) return;
      if (!outCopy.has(m)) { const c = m.clone(); c.userData = Object.assign({}, m.userData, { out: true }); c.onBeforeCompile = m.onBeforeCompile; outCopy.set(m, c); }
      o.material = outCopy.get(m);
    });
  }
}
let NIGHT_HALO = null;
function nightHaloTex() {
  if (NIGHT_HALO) return NIGHT_HALO;
  const S = 128, cv = makeCanvas(S, S), c = cv.getContext('2d');
  const gr = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.08, 'rgba(255,255,255,.75)');
  gr.addColorStop(0.3, 'rgba(255,255,255,.16)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = gr; c.fillRect(0, 0, S, S);
  NIGHT_HALO = new THREE.CanvasTexture(cv);
  return NIGHT_HALO;
}
let NIGHT_BEAM = null;
function nightBeamMat() {
  if (NIGHT_BEAM) return NIGHT_BEAM;
  NIGHT_BEAM = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    uniforms: { uK: { value: 0.04 } },
    vertexShader: `varying float vY; varying vec3 vN, vV;
      void main() { vY = uv.y; vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = -mv.xyz; vN = normalMatrix * normal; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uK; varying float vY; varying vec3 vN, vV;
      void main() {
        // ⚠️ NaN 이 한 점이라도 나면 블룸 블러가 번져 검은 덩어리가 된다 — 모두 0~1 로 묶는다
        float e = clamp(abs(dot(normalize(vN + vec3(1e-5)), normalize(vV))), 0.0, 1.0);
        float y = clamp(vY, 0.0, 1.0);
        float a = y * sqrt(y) * e * sqrt(e) * uK;
        gl_FragColor = vec4(vec3(1.0, 0.95, 0.85) * a, 1.0);
      }`,
  });
  NIGHT_BEAM.userData.noBatch = true;
  return NIGHT_BEAM;
}

/* ── 매 프레임 — 가까운 투광등을 배열에 채운다 · 깜빡임 ─────────────────── */
const _nv = new THREE.Vector3(), _nd = new THREE.Vector3(), _nc = new THREE.Vector3();
function nightFlick(L, t) {
  if (!L.flicker) return 1;
  // 대부분은 멀쩡하다가, 가끔(몇 초씩) 불안하게 떨고 꺼졌다 켜진다
  const bad = Math.sin(t * 0.23 + L.seed) + Math.sin(t * 0.61 + L.seed * 1.7) * 0.6;
  if (bad < 0.9) return 1;
  const n = Math.sin(Math.floor(t * 14 + L.seed) * 78.233) * 43758.5453, r = n - Math.floor(n);
  return r < 0.35 ? 0.05 : r < 0.5 ? 0.45 : 1;
}
function stepNight(dt) {
  if (!NIGHT.on || !NIGHT.floods.length) return;
  NIGHT.t += dt;
  const cam = M.cam;
  cam.updateMatrixWorld();
  const V = cam.matrixWorldInverse, cp = M.pos;
  // 조명탑은 늘, 가로등은 60m 안의 가까운 것부터(42m 부터 서서히 끈다 — 칸이 모자라 뚝 꺼지지 않게)
  const list = NIGHT.floods.map((L) => {
    const d = Math.hypot(L.pos.x - cp.x, L.pos.z - cp.z);
    return { L, d, key: L.tower ? d * 0.2 : d + 30 };
  }).filter((o) => o.L.tower || o.d < 60).sort((a, b) => a.key - b.key);
  for (let i = 0; i < FLOOD_N; i++) {
    const P = FLOOD_U.uFlP.value[i], D = FLOOD_U.uFlD.value[i], K = FLOOD_U.uFlK.value[i];
    const o = list[i];
    if (!o) { K.set(0, 0, 0, 0.9); P.set(0, -1000, 0, 1); continue; }
    const L = o.L, fk = nightFlick(L, NIGHT.t) * (L.tower ? 1 : 1 - THREE.MathUtils.smoothstep(o.d, 42, 60));
    _nv.copy(L.pos).applyMatrix4(V);
    _nd.copy(L.dir).transformDirection(V);
    P.set(_nv.x, _nv.y, _nv.z, L.range);
    D.set(_nd.x, _nd.y, _nd.z, L.cosO);
    K.set(L.col.r * L.I * fk, L.col.g * L.I * fk, L.col.b * L.I * fk, L.cosI);
  }
  // 번짐 — 등 앞에서 볼수록 크게 · 깜빡임을 따라
  for (const L of NIGHT.floods) {
    const fk = nightFlick(L, NIGHT.t);
    if (L.tower) {
      _nc.copy(cp).sub(L.pos).normalize();
      const face = clamp(_nc.dot(L.dir) * 1.3 + 0.25, 0.12, 1);
      L.halo.material.opacity = face * fk;
      L.halo.scale.setScalar(5 + 7 * face);
      if (L.beam) L.beam.visible = fk > 0.3;
      if (L.flicker && NIGHT.faceFl) NIGHT.faceFl.color.setRGB(9 * fk, 8.7 * fk, 8.1 * fk);
    } else {
      L.halo.material.opacity = 0.85 * fk;
      if (L.head) L.head.material.color.setRGB(7 * fk, 6.1 * fk, 4.8 * fk);
    }
  }
}

/* ══════════════════════════════════════════════════════════
   실내 조명 — 불안한 방 · 정전 (v100)
   ══════════════════════════════════════════════════════════
   · 불안한 방 — 방의 4할쯤은 형광등이 낡았다. 대부분은 멀쩡하다가 가끔 몇 초씩 떨고, 꺼졌다 켜진다(웅 소리 · 지직)
   · 정전 — 실내에 있으면 1~2분에 한 번, **지금 있는 방**이 통째로 꺼진다(0.6~1.5초). 탁 — 어둠 — 지지직 켜짐.
     다시 켜지면 가까이 있던 관람객 하나가 **이쪽을 보고 서 있다**
   전시물 스포트 · 방 조명(풀) · 천장 발광 띠 · 손전등을 함께 곱한다(광원 수는 그대로 — 재컴파일 없음) */
NIGHT.fx = {};
NIGHT.blackT = 45 + Math.random() * 30;
NIGHT.black = null;
function flickInit() {
  if (NIGHT.fxReady) return;
  NIGHT.fxReady = true;
  const hash = (s) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973; return h; };
  for (const r of M.rooms) {
    if (r.outdoor) continue;
    const h = hash(r.id);
    NIGHT.fx[r.id] = { unstable: h % 10 < 4 || r.content === 'portraits', seed: h * 0.37 };
  }
  NIGHT.strips = [];
  // 실내 재질의 환경광 · 자체 발광 — 방 조명이 풀 광원이 아닌 방(대부분)은 이것이 '방 불빛' 이다
  NIGHT.inMats = [];
  const seen = new Set();
  for (const r of M.rooms) {
    if (r.outdoor || !M.roomGroups[r.id]) continue;
    M.roomGroups[r.id].traverse((o) => {
      if (!o.isMesh) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (!m || seen.has(m) || m.userData.out || !(m.isMeshStandardMaterial || m.isMeshPhysicalMaterial)) continue;
        seen.add(m); NIGHT.inMats.push({ m, env: m.envMapIntensity, em: m.emissiveIntensity });
      }
    });
  }
  for (const r of M.rooms) {
    const g = M.roomGroups[r.id]; if (!g) continue;
    g.traverse((o) => { if (o.isMesh && o.material && o.material.userData && o.material.userData.strip) NIGHT.strips.push({ room: o.material.userData.strip, m: o.material, c: o.material.color.clone() }); });
  }
}
/** 방 불빛 배율(0~1) */
function roomFlick(id) {
  const fx = NIGHT.fx[id];
  if (!fx) return 1;
  let k = 1;
  if (fx.unstable) { const f = nightFlick({ flicker: true, seed: fx.seed }, NIGHT.t * 0.9); k = f < 0.1 ? 0.2 : f < 0.5 ? 0.55 : 1; }
  const B = NIGHT.black;
  if (B && B.room === id) k *= B.k;
  return k;
}
function stepFlicker(dt) {
  if (!NIGHT.on || !M.rooms) return;
  flickInit();
  const here = M.room && !M.room.outdoor ? M.room : null;
  // 정전 — 실내에서만 센다
  if (here && !M.openId && !(typeof GOLF !== 'undefined' && GOLF.mode)) NIGHT.blackT -= dt;
  if (!NIGHT.black && NIGHT.blackT <= 0 && here) {
    NIGHT.black = { room: here.id, t: 0, dur: 0.6 + Math.random() * 0.9, k: 1, on: false };
    NIGHT.blackT = (70 + Math.random() * 80) * (1 - 0.45 * (typeof HAUNT !== 'undefined' ? HAUNT.dread : 0));   // v101 — 밤이 깊을수록 잦게
    if (typeof sndBlack === 'function') sndBlack(false);
  }
  const B = NIGHT.black;
  if (B) {
    B.t += dt;
    const t = B.t, D = B.dur;
    // 탁·탁 떨다가 꺼진다 → 어둠 → 지지직 두어 번 떨다 켜진다
    B.k = t < 0.05 ? 0.1 : t < 0.1 ? 1 : t < 0.16 ? 0.04 : t < D ? 0.02
      : t < D + 0.07 ? 0.5 : t < D + 0.16 ? 0.03 : t < D + 0.24 ? 0.8 : t < D + 0.3 ? 0.15 : 1;
    if (!B.on && t >= D) { B.on = true; if (B.quick) { if (typeof sndCrackle === 'function') sndCrackle(0.12); } else { if (typeof sndBlack === 'function') sndBlack(true); blackTurn(B.room); } }
    if (t > D + 0.3) NIGHT.black = null;
  }
  // 방 조명 풀
  for (const l of [...(M.vpoint || []), ...(M.vspot || [])]) {
    const v = l.userData.v;
    if (v) l.intensity = v.intensity * roomFlick(v.room);
  }
  // 전시물 스포트(animateFocus 가 방금 정한 세기에 곱한다)
  for (const s of M.pool || []) if (s.e) s.sp.intensity *= roomFlick(s.e.room);
  // 천장 발광 띠
  for (const S of NIGHT.strips) { const k = roomFlick(S.room); S.m.color.copy(S.c).multiplyScalar(k); }
  // 손전등(나를 비추는 약한 빛)도 정전 때는 거의 꺼진다
  if (M.handLight) M.handLight.intensity = 0.63 * (B && here && B.room === here.id ? Math.max(0.15, B.k) : 1);
  // 지금 방이 떨리는 순간 — 지직
  const k = here ? roomFlick(here.id) : 1;
  // 환경광 · 천장 발광 · 반구광 — 지금 있는 방의 불빛을 따라간다(완전한 암흑은 아니게)
  if (Math.abs(k - (NIGHT.appliedK == null ? 1 : NIGHT.appliedK)) > 0.01) {
    NIGHT.appliedK = k;
    const e = 0.12 + 0.88 * k;
    for (const I of NIGHT.inMats) { I.m.envMapIntensity = I.env * e; I.m.emissiveIntensity = I.em * k; }
    if (M.hemi) M.hemi.intensity = NIGHT.hemiI * e;
    const U = M.post && M.post.uniforms; if (U && U.uLift) U.uLift.value = 0.12 * e;      // 암부 들어올림도 함께 — 정전은 정말 깜깜하게
  }
  if (typeof sndFlickTick === 'function') sndFlickTick(here, k, NIGHT.lastK == null ? 1 : NIGHT.lastK);
  NIGHT.lastK = k;
}
/** 불이 다시 켜지면 — 가까이 있던 관람객 하나가 이쪽을 보고 서 있다 */
function blackTurn(room) {
  if (!M.npcs) return;
  const PX = M.pos.x * CM, PZ = M.pos.z * CM;
  let best = null, bd = 900;
  for (const n of M.npcs) {
    if (n.out || n.room !== room || n.talk) continue;
    const d = Math.hypot(n.x - PX, n.z - PZ);
    if (d < bd && d > 150) { bd = d; best = n; }
  }
  if (!best) return;
  const n = best;
  // 한 걸음 가까이 · 몸째 돌려 세운다(어둠 속에서 움직였다)
  const ux = (PX - n.x) / bd, uz = (PZ - n.z) / bd, step = Math.min(120, bd - 150);
  if (!hitsWall(n.x + ux * step, n.z + uz * step, M.roomById[room].y0)) { n.x += ux * step; n.z += uz * step; }
  n.yaw = Math.atan2(PX - n.x, PZ - n.z);
  n.state = 'notice'; n.noticeT = 4.5; n.path = []; n.pause = 0; n.curV = 0;
  if (n.mono && n.mono.el) n.mono.el.remove();
  n.mono = null;
}
