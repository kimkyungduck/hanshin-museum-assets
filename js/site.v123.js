/**
 * site.js — 건물 바깥 전부: 18번 홀(시그니처 파3) · 정문 광장 · 조각 정원 · 퍼팅 연습장 · 골프 체험
 *
 * v81 리디자인 — 예전 필드는 '한쪽 방향의 넓은 풀밭' 이었다.
 *   · 티박스는 페어웨이 선의 둥근 끝이라 거대한 연두색 덩어리로 보였고
 *   · 그린은 멀고 작았으며, 땅은 평평하고, 나무는 같은 간격의 덩어리였다.
 * → **호수를 넘기는 파3**로 다시 짰다. 데크에서 보면 발밑에 돋운 티, 그 앞에 호수,
 *   건너편에 벙커로 둘러싼 돋운 그린, 그 뒤로 침엽수 숲이 언덕을 타고 오른다.
 *   건물 남·동·서쪽도 비어 있지 않다 — 정문 광장, 퍼팅 연습장, 조각 정원.
 *
 * 좌표는 cm. world.js 의 M · CM · floorAt · mergeGeos · boxAt · contactShadow · objMat 등을 쓴다.
 */

/* ══════════════════════════════════════════════════════════
   18번 홀 — 배치
   ══════════════════════════════════════════════════════════ */
const HOLE = {
  par: 3,
  tee: { x: 2400, z: -2300, w: 820, d: 480, h: 32 },
  lake: { x: 2300, z: -5600, rx: 2900, rz: 1500 },
  green: { x: 2600, z: -9000, rx: 1150, rz: 880, h: 48 },
  cup: { x: 2880, z: -9150 },
  bunkers: [
    { x: 1250, z: -8650, rx: 460, rz: 300 }, { x: 3950, z: -8480, rx: 380, rz: 300 },
    { x: 2650, z: -10120, rx: 620, rz: 230 },
  ],
  // 오른쪽 우회로(호수를 피해 짧게 끊어 가는 길) — 페어웨이
  bail: [[4200, -3300], [5600, -5200], [5150, -7500], [3950, -8350]],
  path: [[4300, -800], [6400, -2600], [7000, -6000], [6000, -9300], [4200, -10950], [1500, -11050]],
  drop: { x: 2400, z: -3450 },      // 해저드 드롭존(티 쪽 호숫가)
  WATER: -85,                         // 수면(cm)
};

const sstep = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const ell = (o, x, z) => Math.hypot((x - o.x) / o.rx, (z - o.z) / o.rz);
/** 호수 거리 — 1 이 물가. 타원에 사인 요철을 줘 자연스러운 호숫가를 만든다 */
function lakeDist(x, z) {
  const o = HOLE.lake, dx = (x - o.x) / o.rx, dz = (z - o.z) / o.rz;
  const a = Math.atan2(dz, dx);
  return Math.hypot(dx, dz) / (1 + 0.13 * Math.sin(3 * a + 0.7) + 0.07 * Math.sin(5 * a + 2.1));
}
const nearLine = (pts, x, z, w) => {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], vx = bx - ax, vz = bz - az, L = vx * vx + vz * vz;
    const k = clamp(((x - ax) * vx + (z - az) * vz) / L, 0, 1);
    if (Math.hypot(x - ax - vx * k, z - az - vz * k) < w) return true;
  }
  return false;
};

/** 지형 높이(cm) — 렌더와 발 높이가 같은 식을 쓴다 */
function terrainRender(x, z) {
  const xm = x / CM, zm = z / CM;
  const L = lakeDist(x, z);
  let h = (30 * Math.sin(xm * 0.09 + 0.8) * Math.cos(zm * 0.07) + 22 * Math.sin(xm * 0.23) * Math.sin(zm * 0.19))
    * sstep(1.0, 1.7, L);
  h += Math.max(0, Math.abs(x - 2500) - 3000) * 0.07;          // 양옆이 서서히 오른다(골짜기 구도)
  h += Math.max(0, -10000 - z) * 0.14;                          // 그린 뒤 언덕 — 숲이 계단처럼 보인다
  h *= sstep(-900, -1900, z);                                   // 테라스 앞은 평평
  const t = HOLE.tee;
  const tt = Math.max(Math.abs(x - t.x) / (t.w / 2), Math.abs(z - t.z) / (t.d / 2));
  h = lerp(h, t.h, 1 - sstep(1.0, 1.55, tt));                   // 돋운 티
  const g = ell(HOLE.green, x, z);
  // 돋운 그린(살짝 기운다) — v88: 기울기 6.6% → 2.8%(실제 그린 1~3%). 너무 휘어 넣기가 어려웠다
  h = lerp(h, HOLE.green.h + 3 * Math.sin(xm * 0.8 + zm * 0.5), 1 - sstep(1.0, 1.9, g));
  for (const b of HOLE.bunkers) h -= 42 * (1 - sstep(0.55, 1.0, ell(b, x, z)));
  h -= 170 * (1 - sstep(0.7, 1.12, L));                         // 호수 바닥
  h -= 360 * (1 - sstep(0.05, 0.75, L));                        // 가운데는 깊다(v87 — 걸어 들어가 잠수한다, 가장 깊은 곳 약 −5.3m)
  return h;
}
/** 걸을 수 있는 높이 — v87 부터 물속도 걷는다(호수 바닥을 따라 들어가 잠수. lake.js) */
function terrainCm(x, z) { return terrainRender(x, z); }

/** 필드 칠 — 러프 · 우회 페어웨이 · 티 · 그린 · 벙커 · 호숫가 · 카트길 */
function fieldTexture(r) {
  const W = 2048, H = Math.round(2048 * r.d / r.w);
  const cv = makeCanvas(W, H), c = cv.getContext('2d');
  const sx = W / r.w, sz = H / r.d;
  const P = (x, z) => [(x - r.x0) * sx, (z - r.z0) * sz];
  const nt = makeCanvas(256, 256), nc = nt.getContext('2d');
  const n = fbm(256, 256, 4242, 4, 32), img = nc.createImageData(256, 256);
  for (let i = 0; i < n.length; i++) { const v = n[i] * 255; img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
  nc.putImageData(img, 0, 0);
  const noise = (alpha, comp) => { c.save(); c.globalAlpha = alpha; c.globalCompositeOperation = comp || 'overlay'; c.fillStyle = c.createPattern(nt, 'repeat'); c.fillRect(0, 0, W, H); c.restore(); };
  const ellipse = (o, k = 1) => { const [px, py] = P(o.x, o.z); c.beginPath(); c.ellipse(px, py, o.rx * sx * k, o.rz * sz * k, 0, 0, Math.PI * 2); };
  const lakePath = (k) => {
    c.beginPath();
    for (let i = 0; i <= 96; i++) {
      const a = i / 96 * Math.PI * 2, rr = k * (1 + 0.13 * Math.sin(3 * a + 0.7) + 0.07 * Math.sin(5 * a + 2.1));
      const [px, py] = P(HOLE.lake.x + Math.cos(a) * HOLE.lake.rx * rr, HOLE.lake.z + Math.sin(a) * HOLE.lake.rz * rr);
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.closePath();
  };
  const polyline = (pts) => { c.beginPath(); pts.forEach(([x, z], i) => { const [px, py] = P(x, z); i ? c.lineTo(px, py) : c.moveTo(px, py); }); };
  const stripes = (clip, a, w, ang) => {
    c.save(); clip(); c.clip(); c.translate(W / 2, H / 2); c.rotate(ang);
    for (let i = -W * 2; i < W * 2; i += w * 2) { c.fillStyle = `rgba(20,50,10,${a})`; c.fillRect(i, -H * 2, w, H * 4); }
    c.restore();
  };

  c.fillStyle = '#3C682C'; c.fillRect(0, 0, W, H);             // 러프
  noise(0.26);                                                  // 얼룩은 옅게 — 진하면 멀리서 반점으로 보인다
  // 호숫가 — 물가 둘레는 풀이 짙고 무성하다
  lakePath(1.22); c.fillStyle = '#2E5424'; c.fill();
  lakePath(1.06); c.fillStyle = '#3F5A2E'; c.fill();
  lakePath(0.98); c.fillStyle = '#4A5A3A'; c.fill();             // 물가 흙
  lakePath(0.92); c.fillStyle = '#243A36'; c.fill();             // 호수 바닥(물 메시가 덮는다)
  // 우회 페어웨이 — 끝을 둥글리지 않고 가늘게(굵은 둥근 끝이 '덩어리' 로 보였다)
  c.lineJoin = 'round'; c.lineCap = 'butt';
  polyline(HOLE.bail); c.strokeStyle = '#4C8034'; c.lineWidth = 1500 * sx; c.stroke();
  polyline(HOLE.bail); c.strokeStyle = '#6BAA45'; c.lineWidth = 1200 * sx; c.stroke();
  const fw = makeCanvas(W, H), fc = fw.getContext('2d');
  fc.lineJoin = 'round'; fc.lineCap = 'butt';
  fc.beginPath(); HOLE.bail.forEach(([x, z], i) => { const [px, py] = P(x, z); i ? fc.lineTo(px, py) : fc.moveTo(px, py); });
  fc.strokeStyle = '#fff'; fc.lineWidth = 1200 * sx; fc.stroke();
  fc.globalCompositeOperation = 'source-in'; fc.translate(W / 2, H / 2); fc.rotate(-0.5);
  for (let i = -W * 2; i < W * 2; i += 300 * sx * 2) { fc.fillStyle = 'rgba(20,50,10,.22)'; fc.fillRect(i, -H * 2, 300 * sx, H * 4); }
  c.drawImage(fw, 0, 0);
  // 티박스 + 앞 에이프런
  const t = HOLE.tee;
  { const [px, py] = P(t.x - t.w / 2 - 120, t.z - t.d / 2 - 120); c.fillStyle = '#4E8636'; c.fillRect(px, py, (t.w + 240) * sx, (t.d + 240) * sz); }
  { const [px, py] = P(t.x - t.w / 2, t.z - t.d / 2); c.fillStyle = '#74B24C'; c.fillRect(px, py, t.w * sx, t.d * sz); }
  stripes(() => { const [px, py] = P(t.x - t.w / 2, t.z - t.d / 2); c.beginPath(); c.rect(px, py, t.w * sx, t.d * sz); }, 0.14, 55 * sx, 0);
  // 그린 — 칼라(프린지) + 체크 무늬
  ellipse(HOLE.green, 1.2); c.fillStyle = '#4C8A34'; c.fill();
  ellipse(HOLE.green, 1.1); c.fillStyle = '#66A646'; c.fill();
  ellipse(HOLE.green); c.fillStyle = '#86C65C'; c.fill();
  stripes(() => ellipse(HOLE.green), 0.1, 90 * sx, 0.6);
  stripes(() => ellipse(HOLE.green), 0.06, 90 * sx, -0.97);
  // 벙커
  for (const b of HOLE.bunkers) {
    ellipse(b, 1.14); c.fillStyle = '#35602A'; c.fill();
    ellipse(b); c.fillStyle = '#E2D4AC'; c.fill();
    const [px, py] = P(b.x, b.z);
    const g = c.createRadialGradient(px, py - b.rz * sz * 0.3, 0, px, py, b.rx * sx);
    g.addColorStop(0, 'rgba(255,250,232,.28)'); g.addColorStop(1, 'rgba(120,100,60,.3)');
    ellipse(b); c.fillStyle = g; c.fill();
  }
  // 카트길
  polyline(HOLE.path); c.lineCap = 'round'; c.strokeStyle = '#8E887A'; c.lineWidth = 290 * sx; c.stroke();
  polyline(HOLE.path); c.strokeStyle = '#C2BBAB'; c.lineWidth = 240 * sx; c.stroke();
  noise(0.16, 'soft-light');
  const tx = new THREE.CanvasTexture(cv);
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.anisotropy = M.renderer.capabilities.getMaxAnisotropy();
  return tx;
}

function pathPoint(t) {
  const Pp = HOLE.path, seg = [];
  let total = 0;
  for (let i = 0; i + 1 < Pp.length; i++) { const l = Math.hypot(Pp[i + 1][0] - Pp[i][0], Pp[i + 1][1] - Pp[i][1]); seg.push(l); total += l; }
  let u = clamp(t, 0, 1) * total;
  for (let i = 0; i < seg.length; i++) {
    if (u <= seg[i] || i === seg.length - 1) {
      const k = seg[i] ? u / seg[i] : 0, [ax, az] = Pp[i], [bx, bz] = Pp[i + 1];
      return { x: ax + (bx - ax) * k, z: az + (bz - az) * k, dx: (bx - ax) / seg[i], dz: (bz - az) / seg[i] };
    }
    u -= seg[i];
  }
  return { x: Pp[0][0], z: Pp[0][1], dx: 0, dz: -1 };
}
/** 코스 표석 자리 — 카트길 안쪽 가장자리, 길을 향해 선다 */
function courseSpots(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const p = pathPoint(0.06 + (i + 0.5) / Math.max(1, n) * 0.7);
    const lx = p.dz, lz = -p.dx;
    out.push({ x: p.x - lx * 260, z: p.z - lz * 260, nx: lx, nz: lz, yaw: Math.atan2(lx, lz) / D2R, v: 0 });
  }
  return out;
}

/* ══════════════════════════════════════════════════════════
   하늘 — 구름이 있는 돔
   ══════════════════════════════════════════════════════════ */
const SKY = { top: new THREE.Color(0x3A6AA6), mid: new THREE.Color(0x8DB4DA), hor: new THREE.Color(0xE4E2D8) };
function skyMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTop: { value: SKY.top }, uMid: { value: SKY.mid }, uHor: { value: SKY.hor }, uSun: { value: SUN_DIR } },
    vertexShader: `varying vec3 vDir;
      void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w; }`,
    fragmentShader: `uniform vec3 uTop, uMid, uHor, uSun; varying vec3 vDir;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      float fb(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * vn(p); p *= 2.03; a *= 0.5; } return s; }
      void main() {
        vec3 d = normalize(vDir); float y = d.y;
        vec3 col = mix(uHor, uMid, smoothstep(0.0, 0.22, y));
        col = mix(col, uTop, smoothstep(0.2, 0.85, y));
        col = mix(col, uHor * 0.82, smoothstep(0.0, -0.08, y));
        // 구름 — 수평면에 투영한 fbm. 지평선 가까이는 눌리고 옅어진다
        if (y > 0.0) {
          vec2 uv = d.xz / (y + 0.12) * 1.6;
          float c = fb(uv + vec2(3.1, 1.7));
          c = smoothstep(0.52, 0.78, c) * smoothstep(0.0, 0.18, y);
          float lit = 0.84 + 0.16 * fb(uv * 1.7 + 9.0);
          col = mix(col, vec3(1.0, 0.99, 0.96) * lit, c * 0.85);
        }
        float s = max(dot(d, uSun), 0.0);
        col += vec3(1.0, 0.86, 0.62) * (pow(s, 900.0) * 18.0 + pow(s, 12.0) * 0.28);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

/* ══════════════════════════════════════════════════════════
   18번 홀 — 메시
   ══════════════════════════════════════════════════════════ */
function buildField(r, g) {
  const coarse = matchMedia('(pointer: coarse)').matches;
  /* 지형 — 경기 구역보다 훨씬 넓게 깐다(서·동 80m, 북 90m 더). 걸을 수 있는 곳은 여전히
     경기 구역뿐이지만, 그 밖으로 언덕이 계속 오르며 홀을 감싼다.
     ⚠️ 예전엔 경기 구역만 지형이고 나머지를 평평한 판(y −8cm)으로 덮었는데, 그 판이 호수·벙커
        오목한 곳 **위를 지나가서** 물이 통째로 가려졌다. 판은 이제 건물 남쪽 절반에만 둔다. */
  const X0 = -12000, X1 = 17000, Z0 = -22000, Z1 = -800;
  const segX = coarse ? 150 : 230, segZ = Math.round(segX * (Z1 - Z0) / (X1 - X0));
  const geo = new THREE.PlaneGeometry((X1 - X0) / CM, (Z1 - Z0) / CM, segX, segZ);
  geo.rotateX(-Math.PI / 2);
  const pa = geo.attributes.position, uv = geo.attributes.uv;
  const cx = (X0 + X1) / 2, cz = (Z0 + Z1) / 2;
  for (let i = 0; i < pa.count; i++) {
    const x = pa.getX(i) * CM + cx, z = pa.getZ(i) * CM + cz;
    pa.setY(i, terrainRender(x, z) / CM);
    uv.setXY(i, (x - r.x0) / r.w, 1 - (z - r.z0) / r.d);      // 칠한 텍스처는 경기 구역에 맞춘다
  }
  geo.computeVertexNormals();
  const tex = fieldTexture(r);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;           // 구역 밖은 가장자리(러프) 색이 이어진다
  const detail = themeTex('lawn').floor.normal.clone();
  detail.repeat.set((X1 - X0) / 250, (Z1 - Z0) / 250); detail.needsUpdate = true;
  const land = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    map: tex, roughness: 0.93, normalMap: detail, normalScale: new THREE.Vector2(0.35, 0.35),
  }));
  if (typeof pbrTerrain === 'function') pbrTerrain(land.material, r);     // 실사 잔디 · 모래 결(pbr.js)
  land.position.set(cx / CM, 0, cz / CM);
  land.receiveShadow = true;
  g.add(land);

  // 건물 남쪽 절반의 들판(정원·광장·연습장 밖) — 걸을 수는 없다
  const lawnT = themeTex('lawn');
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(290, 300), lawnT.floor.roughMap
    ? surfaceMat(lawnT, 'floor', 290, 300) : new THREE.MeshStandardMaterial({ color: 0x3A6429, roughness: 0.95 }));
  outer.rotation.x = -Math.PI / 2; outer.position.set(25, -0.08, -8 + 150); outer.receiveShadow = true;
  g.add(outer);

  // 호수 — 물가 윤곽 그대로의 수면
  const sh = new THREE.Shape();
  for (let i = 0; i <= 96; i++) {
    const a = i / 96 * Math.PI * 2, rr = 1.02 * (1 + 0.13 * Math.sin(3 * a + 0.7) + 0.07 * Math.sin(5 * a + 2.1));
    const px = (HOLE.lake.x + Math.cos(a) * HOLE.lake.rx * rr) / CM, pz = (HOLE.lake.z + Math.sin(a) * HOLE.lake.rz * rr) / CM;
    i ? sh.lineTo(px, -pz) : sh.moveTo(px, -pz);
  }
  const wg = new THREE.ShapeGeometry(sh, 4); wg.rotateX(-Math.PI / 2);
  // 윤곽을 뒤집어(-z) 그려 면이 아래를 본다 — 양면으로 둔다
  const water = new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ color: 0x163638, roughness: 0.16, metalness: 0.1, side: THREE.DoubleSide }));
  // ⚠️ 거칠기 0.05 · envK 1.25 였을 때 티에서 보면 호수가 하늘빛 하얀 띠였다(스치는 각도의 반사)
  water.material.userData.envK = 0.5;
  water.position.y = HOLE.WATER / CM;
  water.userData.keep = true;
  g.add(water);
  M.water = water;
  if (typeof buildLakeBed === 'function') buildLakeBed(g);      // 바닥 — 빠진 공 · 돌 · 수초(lake.js)

  // 핀 — 컵 자리, 깃발은 바람에 흔들린다
  const cup = HOLE.cup, gy = terrainRender(cup.x, cup.z) / CM;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 2.3, 8), new THREE.MeshStandardMaterial({ color: 0xF2F0EA, roughness: 0.35 }));
  pole.position.set(cup.x / CM, gy + 1.15, cup.z / CM); pole.castShadow = true;
  pole.userData.keep = true;
  g.add(pole);
  addFlag(g, cup.x / CM + 0.015, gy + 2.05, cup.z / CM, 0xC8262A, 0.86, 0.56);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.055, 20), new THREE.MeshBasicMaterial({ color: 0x0A0A0A }));
  hole.rotation.x = -Math.PI / 2; hole.position.set(cup.x / CM, gy + 0.012, cup.z / CM); g.add(hole);

  buildTrees(r, g, coarse ? 150 : 240);
  buildRanges(g);
  buildCourseDetails(g);
  markOut(g);
}

/* 깃발 — 바람에 흔들린다(stepWorld 가 정점을 움직인다) */
function addFlag(g, x, y, z, color, w, h) {
  const geo = new THREE.PlaneGeometry(w, h, 10, 3); geo.translate(w / 2, 0, 0);
  const flag = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.7, side: THREE.DoubleSide }));
  flag.position.set(x, y, z); flag.castShadow = true; flag.userData.keep = true;
  g.add(flag);
  M.flags = M.flags || [];
  M.flags.push({ mesh: flag, base: geo.attributes.position.array.slice(), w, ph: M.flags.length * 1.7 });
  return flag;
}

/* ── 나무 — 활엽수(뭉게 수관) + 침엽수(겹친 원뿔). 숲은 무리 지어 선다 ──────────── */
function buildTrees(r, g, count) {
  const R = rnd(8181);
  // 빌보드는 한 그루가 삼각형 두 장이라 훨씬 촘촘히 심는다(실사 전나무는 가지가 성겨서 한 그루로는 숲이 비어 보인다)
  const bb = typeof treesReady === 'function' && treesReady();
  if (bb) count *= 2.3;
  const G = bb ? 0.62 : 1;
  const spots = [];
  const ok = (x, z, gap) => {
    if (lakeDist(x, z) < 1.3) return false;
    if (ell(HOLE.green, x, z) < 1.9) return false;
    const t = HOLE.tee;
    if (Math.abs(x - t.x) < 900 && Math.abs(z - t.z) < 700) return false;
    if (nearLine(HOLE.bail, x, z, 1100) || nearLine(HOLE.path, x, z, 380)) return false;
    if (z > -3400 && x > 0 && x < 4800) return false;            // 데크에서 보는 시야는 비운다
    if (!inRect(r, x, z)) return false;
    return spots.every((s) => Math.hypot(s.x - x, s.z - z) > gap);
  };
  const band = (n, x0, x1, z0, z1, gap, conif) => {
    for (let k = 0, tries = 0; k < n && tries < n * 40; tries++) {
      const x = x0 + R() * (x1 - x0), z = z0 + R() * (z1 - z0);
      if (ok(x, z, gap * G)) { spots.push({ x, z, s: 0.85 + R() * 0.75, k: R(), con: R() < conif }); k++; }
    }
  };
  band(count * 0.36, -2200, 7600, -12800, -10500, 420, 0.7);     // 그린 뒤 숲 — 침엽수가 많다
  band(count * 0.24, -3900, -500, -10600, -1500, 460, 0.3);      // 왼쪽 숲
  band(count * 0.2, 7300, 8700, -10600, -1500, 460, 0.35);       // 오른쪽 숲
  band(count * 0.12, -800, 600, -7600, -3800, 380, 0.1);         // 호숫가 왼쪽 몇 그루
  band(count * 0.08, 5200, 7200, -3300, -1500, 520, 0.2);        // 카트길 입구
  // 구역 밖 언덕 — 걸을 수 없는 곳까지 숲이 이어져 홀을 감싼다
  const far = (n, x0, x1, z0, z1, conif) => {
    for (let k = 0, tries = 0; k < n && tries < n * 30; tries++) {
      const x = x0 + R() * (x1 - x0), z = z0 + R() * (z1 - z0);
      if (spots.every((sp) => Math.hypot(sp.x - x, sp.z - z) > 650 * G)) { spots.push({ x, z, s: 1 + R() * 0.8, k: R(), con: R() < conif, far: true }); k++; }
    }
  };
  far(count * 0.18, -10000, -4200, -19000, -1500, 0.55);
  far(count * 0.18, 9000, 15000, -19000, -1500, 0.55);
  far(count * 0.22, -4200, 9000, -19500, -13200, 0.7);

  // 실사 나무(trees.js) — 받았으면 Blender 빌보드로, 아니면 아래 예전 덩어리 나무로
  if (typeof treesReady === 'function' && treesReady()) {
    const con = [], broad = [];
    spots.forEach((t, i) => {
      const y = (terrainRender(t.x, t.z) || 0) / CM, tint = 1.0 + t.k * 0.3;
      if (t.con) con.push({ x: t.x / CM, y, z: t.z / CM, h: 9 + t.s * 5, cell: i, tint });
      else {
        const cell = i % 16;                               // 0~7 참나무꼴(키 큼) · 8~15 올리브꼴(낮고 넓음)
        broad.push({ x: t.x / CM, y, z: t.z / CM, h: (cell < 8 ? 6.5 + t.s * 3.5 : 4.2 + t.s * 2), cell, tint });
      }
      if (!t.far) M.walls.push({ x0: t.x - 30, x1: t.x + 30, z0: t.z - 30, z1: t.z + 30, y0: -500, y1: 900 });
    });
    for (const m of [treeCards('conifer', con), treeCards('broad', broad)]) if (m) g.add(m);
    return;
  }

  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.2, 2.6, 7); trunkGeo.translate(0, 1.3, 0);
  // 활엽수 수관 — 덩이 넷, 아래쪽을 어둡게(정점 색) — 수관 속 그늘
  const blob = (r0, x, y, z) => {
    const b = new THREE.SphereGeometry(r0, 11, 8), bp = b.attributes.position;
    for (let i = 0; i < bp.count; i++) {
      const vx = bp.getX(i), vy = bp.getY(i), vz = bp.getZ(i);
      const k = 1 + 0.12 * Math.sin(vx * 3.1 + vz * 2.3) * Math.cos(vy * 2.7);
      bp.setXYZ(i, vx * k + x, vy * k * 0.92 + y, vz * k + z);
    }
    return b;
  };
  const shade = (geo, lo, hi) => {
    const p = geo.attributes.position, col = new Float32Array(p.count * 3);
    let y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < p.count; i++) { y0 = Math.min(y0, p.getY(i)); y1 = Math.max(y1, p.getY(i)); }
    for (let i = 0; i < p.count; i++) { const t = (p.getY(i) - y0) / (y1 - y0); const v = lo + (hi - lo) * t; col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = v; }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return geo;
  };
  const dec = shade(mergeGeos([blob(1.5, 0, 0, 0), blob(1.1, 0.9, 0.35, 0.3), blob(1.0, -0.8, 0.5, -0.45), blob(0.95, 0.1, 1.1, 0.2), blob(0.9, -0.2, 0.3, 0.95)]), 0.55, 1.1);
  dec.computeVertexNormals();
  const cones = [];
  for (let i = 0; i < 4; i++) { const c = new THREE.ConeGeometry(1.35 - i * 0.26, 2.1, 12); c.translate(0, 1.2 + i * 1.15, 0); cones.push(c); }
  const con = shade(mergeGeos(cones), 0.5, 1.05);
  con.computeVertexNormals();
  const decs = spots.filter((s) => !s.con), cons = spots.filter((s) => s.con);
  const trunk = new THREE.InstancedMesh(trunkGeo, new THREE.MeshStandardMaterial({ color: 0x4A3A2A, roughness: 0.9 }), spots.length);
  const dM = new THREE.InstancedMesh(dec, new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.85, vertexColors: true }), decs.length);
  const cM = new THREE.InstancedMesh(con, new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.88, vertexColors: true }), cons.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3(), col = new THREE.Color();
  const decCol = [0x4A7A38, 0x5A8840, 0x3F6A32, 0x6A9048, 0x4E7034];
  const conCol = [0x2C4A2C, 0x33543A, 0x284232, 0x3A5A34];
  let di = 0, ci = 0;
  spots.forEach((t, i) => {
    const y = (terrainRender(t.x, t.z) || 0) / CM;
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), t.k * 6.28);
    const sc = t.con ? t.s * 1.25 : t.s;
    s3.set(sc, sc * (t.con ? 1.2 : 1), sc); p3.set(t.x / CM, y, t.z / CM);
    m4.compose(p3, q, s3); trunk.setMatrixAt(i, m4);
    if (t.con) {
      s3.set(sc, sc * (1.1 + t.k * 0.5), sc); p3.set(t.x / CM, y + 0.6 * sc, t.z / CM);
      m4.compose(p3, q, s3); cM.setMatrixAt(ci, m4);
      cM.setColorAt(ci++, col.setHex(conCol[i % conCol.length]).multiplyScalar(0.9 + t.k * 0.25));
    } else {
      s3.set(sc * 1.1, sc * (1.1 + t.k * 0.4), sc * 1.1); p3.set(t.x / CM, y + 2.6 * sc + 1.1 * sc, t.z / CM);
      m4.compose(p3, q, s3); dM.setMatrixAt(di, m4);
      dM.setColorAt(di++, col.setHex(decCol[i % decCol.length]).multiplyScalar(0.9 + t.k * 0.25));
    }
    if (!t.far) M.walls.push({ x0: t.x - 30, x1: t.x + 30, z0: t.z - 30, z1: t.z + 30, y0: -500, y1: 900 });
  });
  for (const m of [trunk, dM, cM]) { m.castShadow = true; m.receiveShadow = true; g.add(m); }
}

/* ── 먼 산 — 세 겹 능선. 멀수록 옅고 푸르다(대기 원근) ─────────────────── */
function buildRanges(g) {
  const ring = (R0, lo, hi, color, seed) => {
    const seg = 128, pos = [], idx = [], Rn = rnd(seed);
    const hs = Array.from({ length: seg }, () => lo + Rn() * (hi - lo));
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      const hh = (hs[i] * 2 + hs[(i + 1) % seg] + hs[(i + seg - 1) % seg]) / 4;
      pos.push(Math.cos(a) * R0, -4, Math.sin(a) * R0, Math.cos(a) * (R0 + 30), hh, Math.sin(a) * (R0 + 30));
    }
    for (let i = 0; i < seg; i++) { const j = (i + 1) % seg; idx.push(i * 2, i * 2 + 1, j * 2, j * 2, i * 2 + 1, j * 2 + 1); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, fog: true }));
    m.position.set(24, 0, -40);
    g.add(m);
  };
  ring(260, 10, 30, 0x5E7E62, 5150);
  ring(360, 22, 52, 0x7F9A8E, 6161);
  ring(480, 40, 88, 0xA7B8B4, 7272);
}

/* ── 코스 디테일 — 티 표석 · 티 마커 · 볼 와셔 · 벤치 · 카트 · 조명 기둥 ──────── */
function buildCourseDetails(g) {
  const O = objMat();
  const ty = (x, z) => (terrainRender(x * CM, z * CM) || 0) / CM;
  const t = HOLE.tee, tyv = t.h / CM;
  // 티 마커 — 파란 공 둘
  for (const s of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 10), new THREE.MeshStandardMaterial({ color: 0x2E5FA8, roughness: 0.3 }));
    m.position.set(t.x / CM + s * 1.6, tyv + 0.09, t.z / CM - 1.3); m.castShadow = true; g.add(m);
  }
  // 홀 표석 — 티 뒤쪽. 앞뒤 모두 글자
  const sign = new THREE.Group();
  const stone = rbox(1.3, 0.9, 0.34, 0.05, new THREE.MeshStandardMaterial({ color: 0x4A4640, roughness: 0.75 }));
  stone.position.y = 0.45; sign.add(stone);
  for (const s of [1, -1]) {
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.06, 0.6), new THREE.MeshStandardMaterial({
      map: textTex(['HOLE 18  ·  PAR 3', '92 m  ·  호수를 넘긴다', '티샷 — Space 를 누르고 있다가 놓는다'], { size: 50, w: 720, h: 420, bg: '#C9A24A', fg: '#1A1206', rule: 'rgba(40,30,10,.5)' }),
      roughness: 0.38, metalness: 0.5,
    }));
    pl.position.set(0, 0.5, s * 0.172); if (s < 0) pl.rotation.y = Math.PI; sign.add(pl);
  }
  sign.position.set(t.x / CM - 5.4, ty(t.x / CM - 5.4, t.z / CM + 1.2), t.z / CM + 1.2);
  sign.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.add(sign);
  // 볼 와셔 + 벤치
  { const x = t.x / CM + 5.6, z = t.z / CM + 0.4, y = ty(x, z);
    const post = cyl(0.04, 0.05, 1.0, O.steelD, 12); post.position.set(x, y + 0.5, z); g.add(post);
    const wash = rbox(0.28, 0.34, 0.2, 0.05, new THREE.MeshStandardMaterial({ color: 0x1E4A34, roughness: 0.5 })); wash.position.set(x, y + 1.08, z); g.add(wash);
    const bench = buildObject3D('bench'); bench.position.set(x + 0.2, y, z + 2.0); bench.rotation.y = -Math.PI / 2; g.add(bench); }
  // 골프 카트 — 카트길 시작
  { const cx = 46.0, cz = -14.5, cy = ty(cx, cz), ry = 0.85;
    const cart = golfCart(); cart.position.set(cx, cy, cz); cart.rotation.y = ry; g.add(cart);
    const cs = contactShadow(1.3, 2.4, 0.5); cs.position.set(cx, cy + 0.01, cz); cs.rotation.z = -ry; g.add(cs);
    // 돌아간 차체(1.3 × 2.4m)를 감싸는 크기(예전 2.6m 정사각은 너무 커서 곁에 서면 갇혔다)
    const hx = Math.abs(Math.cos(ry)) * 62 + Math.abs(Math.sin(ry)) * 118, hz = Math.abs(Math.sin(ry)) * 62 + Math.abs(Math.cos(ry)) * 118;
    const wall = { x0: cx * CM - hx, x1: cx * CM + hx, z0: cz * CM - hz, z1: cz * CM + hz, y0: -200, y1: 300 };
    M.walls.push(wall);
    if (typeof cartRegister === 'function') cartRegister(cart, cs, wall, cart.userData.wheels);   // 탈 수 있다(cart.js)
  }
  // 카트길 조명 기둥
  const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xFFE9C4).multiplyScalar(1.4) });
  const bl = [], hd = [];
  for (let u = 0.02; u < 1; u += 0.07) {
    const p = pathPoint(u), lx = p.dz, lz = -p.dx;
    const x = (p.x + lx * 175) / CM, z = (p.z + lz * 175) / CM, y = ty(x, z);
    bl.push(boxAt(0.12, 0.7, 0.12, x, y + 0.35, z)); hd.push(boxAt(0.1, 0.06, 0.1, x, y + 0.64, z));
  }
  const bm = new THREE.Mesh(mergeGeos(bl), O.steelD); bm.castShadow = true; g.add(bm);
  g.add(new THREE.Mesh(mergeGeos(hd), glow));
}

function golfCart() {
  const O = objMat(), cart = new THREE.Group();
  const add = (m, x, y, z) => { m.position.set(x, y, z); cart.add(m); return m; };
  add(rbox(1.2, 0.5, 2.3, 0.08, O.white), 0, 0.55, 0);
  add(rbox(1.14, 0.3, 0.7, 0.1, O.white), 0, 0.85, -0.82);
  const seatM = new THREE.MeshStandardMaterial({ color: 0x2A3A34, roughness: 0.7 });
  add(rbox(1.0, 0.14, 0.5, 0.04, seatM), 0, 0.92, 0.18);
  add(rbox(1.0, 0.45, 0.1, 0.04, seatM), 0, 1.18, 0.45);
  for (const sx of [-0.52, 0.52]) for (const sz of [-0.5, 0.95]) add(cyl(0.018, 0.018, 1.2, O.steel, 10), sx, 1.6, sz);
  add(rbox(1.3, 0.06, 1.9, 0.03, new THREE.MeshStandardMaterial({ color: 0x1E3A2C, roughness: 0.6 })), 0, 2.22, 0.22);
  for (const sx of [-0.56, 0.56]) for (const sz of [-0.7, 0.75]) {
    const w = add(cyl(0.22, 0.22, 0.18, O.black, 20), sx, 0.22, sz); w.rotation.z = Math.PI / 2;
    const hub = add(cyl(0.1, 0.1, 0.19, O.steel, 16), sx, 0.22, sz); hub.rotation.z = Math.PI / 2;
    // 바큇살 — 구르는 게 보이게(민무늬 원통은 돌아도 티가 안 난다)
    const spoke = add(rbox(0.03, 0.19, 0.3, 0.01, O.steelD), sx + Math.sign(sx) * 0.005, 0.22, sz);
    (cart.userData.wheels = cart.userData.wheels || []).push(w, hub, spoke);
  }
  for (const s of [-0.24, 0.24]) {
    const bag = add(cyl(0.14, 0.13, 0.95, new THREE.MeshStandardMaterial({ color: s < 0 ? 0x1E2A44 : 0x6A1E26, roughness: 0.55 }), 18), s, 1.2, 1.05);
    bag.rotation.x = -0.35;
  }
  cart.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return cart;
}

/* ══════════════════════════════════════════════════════════
   건물 둘레 — 정문 광장 · 조각 정원 · 퍼팅 연습장
   ══════════════════════════════════════════════════════════
   world.js 의 방 껍데기가 바닥(페이버·잔디)을 깔고, 여기서 그 위를 채운다.
   부딪히는 것(분수·산울타리·조각·차)은 M.walls 에 충돌 상자를 넣는다. */
Object.assign(MAT_RECIPE, {
  lawn: { wall: () => limestone(), floor: () => lawnTex(), wainscot: '#2A2622' },
});
/** 깎은 잔디 — 가는 결 + 넓은 얼룩(칠한 초록 판으로 보이지 않게) */
function lawnTex() {
  const w = SIZE, h = SIZE;
  const fine = fbm(w, h, 707, 5, 6), broad = fbm(w, h, 303, 3, 128);
  const cv = makeCanvas(w, h), ctx = cv.getContext('2d'), img = ctx.createImageData(w, h);
  for (let i = 0, p = 0; i < w * h; i++, p += 4) {
    const v = 0.78 + fine[i] * 0.34 + (broad[i] - 0.5) * 0.22;
    img.data[p] = 62 * v; img.data[p + 1] = 110 * v; img.data[p + 2] = 44 * v; img.data[p + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return { canvas: cv, normalCanvas: heightToNormal(fine, w, h, 2.4), rough: 0.95 };
}

function block(x0, x1, z0, z1, h = 300) { M.walls.push({ x0, x1, z0, z1, y0: -100, y1: h }); }

function dressZone(r, g) {
  if (r.id === 'plaza') dressPlaza(r, g);
  else if (r.id === 'garden') dressGarden(r, g);
  else if (r.id === 'practice') dressPractice(r, g);
}

/* 정문 광장 — 분수 · 깃대 · 캐노피 · 표석 · 가로등 · 차 */
function dressPlaza(r, g) {
  const O = objMat();
  const stone = new THREE.MeshStandardMaterial({ color: 0xC8C0B2, roughness: 0.7 });
  // 분수 — 둥근 수반 + 가운데 2단 그릇 + 물줄기
  const fx = 24, fz = 47;
  const basin = lathe([[0, 0], [3.6, 0], [3.65, 0.5], [3.45, 0.55], [3.4, 0.2], [0, 0.18]], stone, 64); basin.position.set(fx, 0, fz); g.add(basin);
  const water = new THREE.Mesh(new THREE.CircleGeometry(3.4, 64), new THREE.MeshStandardMaterial({ color: 0x2A4A52, roughness: 0.05, metalness: 0.2 }));
  water.material.userData.envK = 1.2; water.rotation.x = -Math.PI / 2; water.position.set(fx, 0.42, fz); g.add(water);
  const bowl = lathe([[0, 0], [0.35, 0], [0.3, 1.1], [1.3, 1.25], [1.35, 1.45], [1.2, 1.45], [0.25, 1.35], [0.2, 1.9], [0.6, 2.0], [0.62, 2.12], [0, 2.1]], stone, 48);
  bowl.position.set(fx, 0.2, fz); g.add(bowl);
  const jetMat = new THREE.MeshStandardMaterial({ color: 0xDCEFF4, roughness: 0.1, transparent: true, opacity: 0.55, depthWrite: false });
  jetMat.userData.noBatch = true;
  M.jets = [];
  const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, 1.2, 10, 1, true), jetMat); jet.position.set(fx, 2.9, fz); g.add(jet); M.jets.push(jet);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    const arc = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a) * 1.2, 1.5, Math.sin(a) * 1.2), new THREE.Vector3(Math.cos(a) * 1.9, 1.75, Math.sin(a) * 1.9),
      new THREE.Vector3(Math.cos(a) * 2.6, 0.45, Math.sin(a) * 2.6)]), 12, 0.018, 6, false), jetMat);
    arc.position.set(fx, 0.2, fz); g.add(arc);
  }
  block(fx * CM - 370, fx * CM + 370, fz * CM - 370, fz * CM + 370);
  // 정문 캐노피 — 현관 유리문 위로 뻗은 얇은 판 + 가는 기둥 둘
  const can = rbox(9.0, 0.28, 4.2, 0.02, new THREE.MeshStandardMaterial({ color: 0xE8E4DC, roughness: 0.6 })); can.position.set(24, 4.1, 32.1); can.castShadow = true; g.add(can);
  for (const s of [-1, 1]) { const col = cyl(0.09, 0.09, 4.0, O.steelD, 16); col.position.set(24 + s * 4.1, 2.0, 34.0); g.add(col); block((24 + s * 4.1) * CM - 20, (24 + s * 4.1) * CM + 20, 3380, 3420); }
  const lettering = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 0.62), new THREE.MeshStandardMaterial({
    map: signTex(SITE.title || '', 'ESTABLISHED COLLECTION', true), transparent: true, alphaTest: 0.05, metalness: 0.6, roughness: 0.35,
  }));
  lettering.position.set(24, 3.8, 34.22); g.add(lettering);
  // 깃대 셋 — 광장 동쪽
  for (let i = 0; i < 3; i++) {
    const x = 40.5 + i * 1.6, z = 34.5;
    const p = cyl(0.045, 0.06, 9.0, O.steel, 12); p.position.set(x, 4.5, z); g.add(p);
    addFlag(g, x + 0.05, 8.2, z, [0x1E3A2C, 0xC9A24A, 0x6E1F26][i], 1.8, 1.1);
    block(x * CM - 15, x * CM + 15, z * CM - 15, z * CM + 15);
  }
  // 광장 남쪽 표석 — 관 이름
  const mon = rbox(7.0, 1.2, 0.7, 0.06, new THREE.MeshStandardMaterial({ color: 0x3E3B37, roughness: 0.7 })); mon.position.set(24, 0.6, 63.0); mon.castShadow = true; g.add(mon);
  const monT = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 0.9), new THREE.MeshStandardMaterial({ map: signTex(SITE.title || '', '상설 전시 · 무료 관람', true), transparent: true, alphaTest: 0.05, metalness: 0.6, roughness: 0.35 }));
  monT.position.set(24, 0.66, 62.64); monT.rotation.y = Math.PI; g.add(monT);
  block(2050, 2750, 6265, 6335);
  // 화단 + 나무 넷, 벤치, 가로등
  for (const [x, z] of [[6, 41], [6, 53], [42, 41], [42, 53]]) {
    const bed = rbox(3.2, 0.5, 3.2, 0.04, stone); bed.position.set(x, 0.25, z); g.add(bed);
    const soil = boxAt(3.0, 0.02, 3.0, x, 0.51, z); g.add(new THREE.Mesh(soil, new THREE.MeshStandardMaterial({ color: 0x3A5A2A, roughness: 1 })));
    g.add(smallTree(x, 0.5, z, 1.1));
    block(x * CM - 170, x * CM + 170, z * CM - 170, z * CM + 170);
  }
  for (const [x, z, ry] of [[24, 41.5, 0], [24, 52.5, Math.PI], [18.2, 47, Math.PI / 2], [29.8, 47, -Math.PI / 2]]) {
    const b = buildObject3D('bench'); b.position.set(x, 0, z); b.rotation.y = ry; g.add(b);
  }
  lampPosts(g, [[10, 36], [38, 36], [10, 60], [38, 60], [2, 47], [46, 47]]);
  // 차 둘 — 광장 동남쪽 주차 자리
  const c1 = sedan(0x1C2430); c1.position.set(40, 0, 60); c1.rotation.y = Math.PI / 2; g.add(c1);
  const c2 = sedan(0xE8E6E0); c2.position.set(40, 0, 56.5); c2.rotation.y = Math.PI / 2; g.add(c2);
  block(3780, 4220, 5520, 6230);
  // 진입로 — 광장 남쪽 밖으로(걸을 수는 없다)
  const road = new THREE.Mesh(new THREE.PlaneGeometry(7, 90), new THREE.MeshStandardMaterial({ color: 0x3A3A3C, roughness: 0.92 }));
  road.rotation.x = -Math.PI / 2; road.position.set(24, -0.05, 66 + 45); g.add(road);
}

function smallTree(x, y, z, s) {
  // 실사 빌보드가 있으면 그것(참나무꼴 칸 중 하나)
  if (typeof treesReady === 'function' && treesReady()) {
    return treeCards('broad', [{ x, y, z, h: 5.2 * s, cell: Math.abs(Math.round(x * 7 + z * 3)) % 8, tint: 0.95 }]);
  }
  const G = new THREE.Group();
  const tr = cyl(0.08 * s, 0.12 * s, 2.0 * s, new THREE.MeshStandardMaterial({ color: 0x4A3A2A, roughness: 0.9 }), 8); tr.position.set(0, 1.0 * s, 0); G.add(tr);
  const cm = new THREE.MeshStandardMaterial({ color: 0x4E7E38, roughness: 0.85 });
  for (const [dx, dy, dz, rr] of [[0, 2.5, 0, 1.0], [0.55, 2.2, 0.3, 0.7], [-0.5, 2.35, -0.35, 0.72], [0.1, 3.0, 0.1, 0.65]]) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(rr * s, 14, 10), cm); b.position.set(dx * s, dy * s, dz * s); G.add(b);
  }
  G.position.set(x, y, z);
  G.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return G;
}

function lampPosts(g, pts) {
  const night = (typeof NIGHT !== 'undefined' && NIGHT.on);
  const O = objMat(), glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xFFEBCB).multiplyScalar(night ? 7 : 1.3) });
  const posts = [], heads = [];
  for (const [x, z] of pts) {
    const p = new THREE.CylinderGeometry(0.05, 0.07, 4.2, 10); p.translate(x, 2.1, z); posts.push(p);
    posts.push(boxAt(0.5, 0.08, 0.2, x + 0.2, 4.2, z));
    heads.push(boxAt(0.36, 0.03, 0.14, x + 0.25, 4.15, z));
    block(x * CM - 12, x * CM + 12, z * CM - 12, z * CM + 12);
    if (night && typeof nightLamp === 'function') nightLamp(g, x + 0.25, 4.15, z);      // v97 — 밤에는 진짜로 비춘다
  }
  const pm = new THREE.Mesh(mergeGeos(posts), O.steelD); pm.castShadow = true; g.add(pm);
  g.add(new THREE.Mesh(mergeGeos(heads), glow));
}

function sedan(color) {
  const O = objMat(), G = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color, roughness: 0.28, metalness: 0.6 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x1A2228, roughness: 0.1, metalness: 0.4 });
  const b = rbox(4.6, 0.7, 1.85, 0.2, paint); b.position.y = 0.62; G.add(b);
  const cab = rbox(2.5, 0.62, 1.66, 0.22, glass); cab.position.set(-0.2, 1.22, 0); G.add(cab);
  const roof = rbox(2.2, 0.08, 1.6, 0.04, paint); roof.position.set(-0.25, 1.55, 0); G.add(roof);
  for (const sx of [-1.45, 1.45]) for (const sz of [-0.86, 0.86]) {
    const w = cyl(0.34, 0.34, 0.24, O.black, 22); w.rotation.x = Math.PI / 2; w.position.set(sx, 0.34, sz); G.add(w);
  }
  G.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return G;
}

/* 조각 정원 — 잔디 · 자갈길 · 조각 셋 · 퍼걸러 · 화단 · 산울타리 */
function dressGarden(r, g) {
  const O = objMat();
  const gravel = new THREE.MeshStandardMaterial({ color: 0xCFC6B4, roughness: 0.95 });
  const pathG = [boxAt(2.4, 0.02, (r.d) / CM, -20, 0.011, r.cz / CM), boxAt(r.w / CM, 0.02, 2.4, r.cx / CM, 0.011, 29)];
  const pathGeo = mergeGeos(pathG);
  g.add(new THREE.Mesh(pathGeo, (typeof pbrGroundMat === 'function' && pbrGroundMat(pathGeo, 'sand_01', '#B8AE9A')) || gravel));   // 자갈길 — 실사 모래 결
  // ① '홀인원' — 흰 골프공(딤플) 이 청동 티 위에
  { const x = -20, z = 29;
    const ped = rbox(2.4, 0.4, 2.4, 0.05, new THREE.MeshStandardMaterial({ color: 0x3E3B37, roughness: 0.7 })); ped.position.set(x, 0.2, z); g.add(ped);
    const tee = lathe([[0, 0], [0.5, 0], [0.12, 0.2], [0.1, 1.1], [0.55, 1.35], [0.58, 1.42], [0, 1.4]], O.bronze, 40); tee.position.set(x, 0.4, z); g.add(tee);
    const ballGeo = new THREE.IcosahedronGeometry(1.25, 5);
    const bp = ballGeo.attributes.position, dirs = [];
    const D = new THREE.IcosahedronGeometry(1, 3).attributes.position;
    for (let i = 0; i < D.count; i++) dirs.push(new THREE.Vector3(D.getX(i), D.getY(i), D.getZ(i)).normalize());
    for (let i = 0; i < bp.count; i++) {
      const v = new THREE.Vector3(bp.getX(i), bp.getY(i), bp.getZ(i)).normalize();
      let best = 0; for (const d of dirs) best = Math.max(best, v.dot(d));
      const dip = Math.pow(sstep(0.985, 1.0, best), 1.5) * 0.045;            // 딤플 — 가장 가까운 격자점 근처가 오목
      v.multiplyScalar(1.25 - dip); bp.setXYZ(i, v.x, v.y, v.z);
    }
    ballGeo.computeVertexNormals();
    const ball = new THREE.Mesh(ballGeo, new THREE.MeshStandardMaterial({ color: 0xF4F3EE, roughness: 0.32 }));
    ball.position.set(x, 1.8 + 1.25, z); ball.castShadow = true; g.add(ball);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.3), new THREE.MeshStandardMaterial({ map: signTex('홀인원', 'HOLE IN ONE', true), transparent: true, alphaTest: 0.05, metalness: 0.5 }));
    pl.position.set(x, 0.22, z + 1.215); g.add(pl);
    block(x * CM - 130, x * CM + 130, z * CM - 130, z * CM + 130, 500); }
  // ② 청동 스윙 궤적 — 드라이버 스윙의 호를 세운 조각
  { const x = -31, z = 9;
    const arc = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.07, 12, 64, Math.PI * 1.35), O.bronze);
    arc.rotation.set(0, 0.6, 0.4); arc.position.set(x, 2.4, z); arc.castShadow = true; g.add(arc);
    const base = rbox(1.4, 0.3, 1.4, 0.04, new THREE.MeshStandardMaterial({ color: 0x3E3B37, roughness: 0.7 })); base.position.set(x, 0.15, z); g.add(base);
    block(x * CM - 90, x * CM + 90, z * CM - 90, z * CM + 90, 500); }
  // ③ 쌓은 돌 — 균형
  // v88 — 매끈한 타원 구 다섯 개(플라스틱처럼 보였다) → 물에 닳은 자연석: 모양을 하나하나 비틀고,
  //       맞닿는 면은 눌러 평평하게, 결은 실사 돌(rock_01) 세 방향 투영
  { const x = -10, z = 52, R = rnd(4242);
    const tints = ['#77716A', '#6A655F', '#827A70', '#5F5B57', '#7A746B'];
    let y = 0; [[1.3, 0.5], [1.05, 0.42], [0.85, 0.36], [0.62, 0.3], [0.42, 0.24]].forEach(([rr, hh], i) => {
      const geo = new THREE.SphereGeometry(1, 64, 32), pa = geo.attributes.position;
      const ph = [R() * 6.28, R() * 6.28, R() * 6.28, R() * 6.28], lean = (R() - 0.5) * 0.25;
      for (let k = 0; k < pa.count; k++) {
        let vx = pa.getX(k), vy = pa.getY(k), vz = pa.getZ(k);
        const a = Math.atan2(vz, vx);
        const bump = 1 + 0.07 * Math.sin(a * 2 + ph[0]) + 0.04 * Math.sin(a * 3 + ph[1] + vy * 2) + 0.03 * Math.sin(vy * 4 + ph[2]) + 0.018 * Math.sin(a * 7 + vy * 5 + ph[3]);
        vx *= rr * bump; vz *= rr * 0.88 * bump; vy *= hh;
        vy = vy < 0 ? -hh * 0.86 * Math.tanh(-vy / (hh * 0.86)) : hh * 0.92 * Math.tanh(vy / (hh * 0.92));   // 맞닿는 면을 누른다
        vy += vx * lean * 0.12;
        pa.setXYZ(k, vx, vy, vz);
      }
      geo.computeVertexNormals();
      const mat = (typeof pbrTriplanarMat === 'function' && pbrTriplanarMat('rock_01', tints[i], 0.9, 0.55))
        || new THREE.MeshStandardMaterial({ color: 0x6E6A64, roughness: 0.6 });
      const s = new THREE.Mesh(geo, mat);
      s.position.set(x + (i % 2 ? 0.08 : -0.06), y + hh * 0.86, z); s.rotation.y = R() * 6.28;
      s.castShadow = true; s.receiveShadow = true; s.userData.keep = true; g.add(s);
      y += hh * 0.86 + hh * 0.92 - 0.02;
    });
    block(x * CM - 120, x * CM + 120, z * CM - 120, z * CM + 120); }
  // 퍼걸러 + 벤치 — 정원 서쪽 끝
  { const wood = O.oak, x = -36, z0 = 40, z1 = 58;
    const parts = [];
    for (const z of [z0, (z0 + z1) / 2, z1]) for (const dx of [-1.6, 1.6]) parts.push(boxAt(0.18, 2.8, 0.18, x + dx, 1.4, z));
    for (const dx of [-1.6, 1.6]) parts.push(boxAt(0.14, 0.22, z1 - z0 + 0.8, x + dx, 2.85, (z0 + z1) / 2));
    for (let z = z0; z <= z1; z += 0.9) parts.push(boxAt(4.0, 0.14, 0.09, x, 3.02, z));
    const pg = new THREE.Mesh(mergeGeos(parts), wood); pg.castShadow = true; g.add(pg);
    for (const z of [44, 52]) { const b = buildObject3D('bench'); b.position.set(x + 0.6, 0, z); b.rotation.y = Math.PI / 2; g.add(b); } }
  // 화단 — 자갈길 따라 낮은 상자 + 꽃(작은 구 인스턴싱)
  flowerBeds(g, [[-24, 16, 1.6, 7], [-16, 16, 1.6, 7], [-24, 42, 1.6, 7], [-16, 42, 1.6, 7]]);
  // 산울타리 — 정원 바깥 테두리(부딪힌다)
  const hedgeM = new THREE.MeshStandardMaterial({ color: 0x2E5A2A, roughness: 0.9 });
  const hedges = [[-39.4, 10, 1.0, 34], [-39.4, 48, 1.0, 34], [-20, 65.5, 40, 1.0]];      // v122 — z 27~31m 쪽문(숲길로)
  for (const [x, z, w, d] of hedges) {
    const h = rbox(w, 1.1, d, 0.2, hedgeM); h.position.set(x, 0.55, z); h.castShadow = true; g.add(h);
    block(x * CM - w * 50 - 10, x * CM + w * 50 + 10, z * CM - d * 50 - 10, z * CM + d * 50 + 10);
  }
  for (const [x, z, s] of [[-34, -2, 1.3], [-6, 3, 1.1], [-34, 26, 1.2], [-4, 62, 1.2]]) g.add(smallTree(x, 0, z, s));
}

function flowerBeds(g, beds) {
  const soilM = new THREE.MeshStandardMaterial({ color: 0x4A3A2A, roughness: 1 });
  const edgeM = new THREE.MeshStandardMaterial({ color: 0xB8B0A2, roughness: 0.8 });
  const bedGeos = [], edgeGeos = [];
  let n = 0; const pts = [];
  const R = rnd(4488);
  for (const [x, z, w, d] of beds) {
    edgeGeos.push(boxAt(w + 0.2, 0.28, d + 0.2, x, 0.14, z));
    bedGeos.push(boxAt(w, 0.3, d, x, 0.16, z));
    for (let i = 0; i < w * d * 14; i++) pts.push([x + (R() - 0.5) * w * 0.92, z + (R() - 0.5) * d * 0.92, R()]);
    block(x * CM - w * 50 - 10, x * CM + w * 50 + 10, z * CM - d * 50 - 10, z * CM + d * 50 + 10, 60);
  }
  g.add(new THREE.Mesh(mergeGeos(edgeGeos), edgeM));
  g.add(new THREE.Mesh(mergeGeos(bedGeos), soilM));
  const fl = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.7 }), pts.length);
  const leaf = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshStandardMaterial({ color: 0x3A6A30, roughness: 0.8 }), pts.length);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  const cols = [0xD8485A, 0xF2C04A, 0xF4F0EA, 0xB05AB8, 0xE8784A];
  pts.forEach(([x, z, k], i) => {
    m4.makeTranslation(x, 0.36 + k * 0.08, z); fl.setMatrixAt(i, m4); fl.setColorAt(i, col.setHex(cols[(k * 5) | 0]));
    m4.makeTranslation(x + 0.03, 0.31, z - 0.02); leaf.setMatrixAt(i, m4);
  });
  g.add(leaf, fl);
}

/* 퍼팅 연습장 — 그린(컵 넷) · 스타터 하우스 · 벤치 */
const PRACTICE = {
  green: { x: 6800, z: 2600, rx: 1400, rz: 1000 },
  cups: [{ x: 6250, z: 2350 }, { x: 7450, z: 2050 }, { x: 7350, z: 3200 }, { x: 6250, z: 3150 }],
};
function dressPractice(r, g) {
  const G = PRACTICE.green, O = objMat();
  const cv = makeCanvas(512, 384), c = cv.getContext('2d');
  c.fillStyle = '#5E9E40'; c.fillRect(0, 0, 512, 384);
  c.beginPath(); c.ellipse(256, 192, 256 * 0.9, 192 * 0.9, 0, 0, Math.PI * 2); c.fillStyle = '#86C65C'; c.fill();
  c.save(); c.clip();
  for (let i = -512; i < 1024; i += 48) { c.fillStyle = 'rgba(20,50,10,.08)'; c.save(); c.translate(256, 192); c.rotate(0.6); c.fillRect(i - 256, -400, 24, 800); c.restore(); }
  c.restore();
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const gm = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, transparent: false }));
  gm.rotation.x = -Math.PI / 2; gm.scale.set(G.rx / CM * 1.12, G.rz / CM * 1.12, 1); gm.position.set(G.x / CM, 0.012, G.z / CM); gm.receiveShadow = true; g.add(gm);
  PRACTICE.cups.forEach((cp, i) => {
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.055, 20), new THREE.MeshBasicMaterial({ color: 0x0A0A0A }));
    hole.rotation.x = -Math.PI / 2; hole.position.set(cp.x / CM, 0.016, cp.z / CM); g.add(hole);
    const pole = cyl(0.01, 0.01, 1.0, O.white, 8); pole.position.set(cp.x / CM, 0.5, cp.z / CM); g.add(pole);
    addFlag(g, cp.x / CM + 0.01, 0.9, cp.z / CM, [0xC8262A, 0x2E5FA8, 0xF2C04A, 0x1E3A2C][i], 0.26, 0.17);
  });
  // 스타터 하우스 — 작은 목재 부스 + 차양 + 간판
  { const x = 80, z = 58;
    const body = rbox(3.0, 2.6, 2.4, 0.03, O.oak); body.position.set(x, 1.3, z); body.castShadow = true; g.add(body);
    const roof = rbox(3.6, 0.16, 3.0, 0.02, O.steelD); roof.position.set(x, 2.68, z); g.add(roof);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.9), new THREE.MeshStandardMaterial({ color: 0x1A2228, roughness: 0.1, metalness: 0.4 }));
    win.position.set(x, 1.5, z - 1.205); win.rotation.y = Math.PI; g.add(win);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.5), new THREE.MeshStandardMaterial({ map: signTex('퍼팅 연습장', 'PUTTING GREEN', false), transparent: true, alphaTest: 0.05 }));
    sg.position.set(x, 2.3, z - 1.21); sg.rotation.y = Math.PI; g.add(sg);
    block(x * CM - 160, x * CM + 160, z * CM - 130, z * CM + 130); }
  for (const [x, z, ry] of [[58, 14, 0], [76, 14, 0], [52, 34, Math.PI / 2]]) { const b = buildObject3D('bench'); b.position.set(x, 0, z); b.rotation.y = ry; g.add(b); }
  for (const [x, z, s] of [[84, 4, 1.3], [86, 30, 1.2], [52, 60, 1.1], [84, 44, 1.2]]) g.add(smallTree(x, 0, z, s));
  const hedgeM = new THREE.MeshStandardMaterial({ color: 0x2E5A2A, roughness: 0.9 });
  // v122 — z 44~48m 쪽문(드라이빙 레인지로)
  for (const [z, d] of [[18.5, 51], [56.5, 17]]) { const h = rbox(1.0, 1.1, d, 0.2, hedgeM); h.position.set(87.4, 0.55, z); h.castShadow = true; g.add(h); }
  block(8690, 8800, -800, 4400); block(8690, 8800, 4800, 6600);
}

/* ══════════════════════════════════════════════════════════
   매 프레임 — 깃발 · 분수
   ══════════════════════════════════════════════════════════ */
function stepWorld(t) {
  for (const f of M.flags || []) {
    if (!f.mesh.parent || !f.mesh.parent.visible) continue;
    const pa = f.mesh.geometry.attributes.position;
    for (let i = 0; i < pa.count; i++) {
      const x = f.base[i * 3];
      pa.setZ(i, Math.sin(x / f.w * 5.6 - t * 6.2 + f.ph) * 0.06 * (x / f.w) * (f.w * 1.6));
    }
    pa.needsUpdate = true;
  }
  if (M.jets) for (const j of M.jets) { j.scale.y = 1 + Math.sin(t * 7) * 0.06; j.material.opacity = 0.5 + Math.sin(t * 11) * 0.05; }
  if (typeof golfStepVisual === 'function') golfStepVisual(t);
  if (typeof stepLake === 'function') stepLake(t);                // 물속 화면(lake.js)
}

/* ══════════════════════════════════════════════════════════
   골프 체험 — 18번 홀 티샷 · 어프로치 · 퍼팅 / 퍼팅 연습장
   ══════════════════════════════════════════════════════════
   조작: 티박스(또는 연습 그린) 위에서 Space — 공이 놓이고 카메라가 공 뒤에 선다.
         마우스(드래그)로 방향을 잡고, Space 를 누르고 있으면 힘 막대가 오르내린다. 놓으면 친다.
         폰은 오른쪽 아래 버튼이 같은 일을 한다. Esc 로 그만둔다.
   클럽은 핀까지 거리로 고른다 — 80m 넘으면 아이언, 그 안은 웨지, 그린 위는 퍼터.
   v88 '치는 맛 · 에임 · 넣기' 손질: 조준 미리보기(곡선·착지·퍼트 길 — 실제와 같은 물리), 추천 힘은 실제로 쳐 보고 고른다,
   임팩트 소리·멈칫·흔들림·튀는 잔디, PERFECT/GOOD 판정, 컵 깔때기 + OK(60cm 컨시드), 퍼터 힘 막대는 느리게, ←→ 미세 조준.
   물: 1벌타 후 드롭존. 경기 구역 밖: 1벌타 후 다시 친 자리. 컵에 들어가면 타수를 파와 비교한다. */
const GOLF = { mode: null, strokes: 0, power: 0, powerT: 0, ball: null, vel: null, course: null, last: null, settleT: 0 };
const G_GRAV = 9.8, BALL_R = 0.021;

function golfCourseAt(x, z) {
  const t = HOLE.tee, field = M.roomById.field;
  if (field && Math.abs(x - t.x) < t.w / 2 + 60 && Math.abs(z - t.z) < t.d / 2 + 60) return 'hole';
  if (ell(PRACTICE.green, x, z) < 1.05) return 'practice';
  return null;
}
function golfGround(x, z) {   // m
  const cm = x * CM, zm = z * CM;
  const f = M.roomById.field;
  if (f && inRect(f, cm, zm)) return terrainRender(cm, zm) / CM;
  return 0.012;
}
function golfSurface(x, z) {
  const cm = x * CM, zm = z * CM;
  const f = M.roomById.field;
  if (f && inRect(f, cm, zm)) {
    if (lakeDist(cm, zm) < 1.0) return 'water';
    if (HOLE.bunkers.some((b) => ell(b, cm, zm) < 1)) return 'sand';
    if (ell(HOLE.green, cm, zm) < 1.1) return 'green';
    const t = HOLE.tee;
    if ((Math.abs(cm - t.x) < t.w / 2 + 120 && Math.abs(zm - t.z) < t.d / 2 + 120) || nearLine(HOLE.bail, cm, zm, 600)) return 'fairway';
    return 'rough';
  }
  if (ell(PRACTICE.green, cm, zm) < 1.1) return 'green';
  const inside = M.rooms.some((r) => r.outdoor && inRect(r, cm, zm));
  return inside ? 'rough' : 'oob';
}
/* 면마다 — e 튐 · keep 튄 뒤 남는 속도 · roll 굴림 마찰(m/s²) · hold 경사에서 멈춰 서는 힘(m/s²)
   ⚠️ hold 가 없으면 그린 뒤 언덕처럼 기운 곳에서 공이 영원히 조금씩 굴렀다 */
const SURF = {
  green:   { e: 0.22, keep: 0.86, roll: 0.62, hold: 0.7 },
  fairway: { e: 0.3,  keep: 0.72, roll: 1.4,  hold: 1.6 },
  rough:   { e: 0.16, keep: 0.45, roll: 3.6,  hold: 3.4 },
  sand:    { e: 0.0,  keep: 0.0,  roll: 20,   hold: 9 },
};
function golfTarget() {
  if (GOLF.course === 'hole') return HOLE.cup;
  const b = GOLF.ball;
  return PRACTICE.cups.slice().sort((p, q) => Math.hypot(p.x / CM - b.x, p.z / CM - b.z) - Math.hypot(q.x / CM - b.x, q.z / CM - b.z))[0];
}
function golfClub() {
  const tg = golfTarget(), b = GOLF.ball;
  const d = Math.hypot(tg.x / CM - b.x, tg.z / CM - b.z);
  const surf = golfSurface(b.x, b.z);
  // 퍼터는 그린 위(또는 연습장)에서만 — 벙커·러프에서 굴리면 빠져나오지 못한다
  if (GOLF.course === 'practice' || surf === 'green' || (surf === 'fairway' && d < 6)) return { name: '퍼터', loft: 0, vmax: 7.5, d };
  // v88 — 68m 파3 티샷은 웨지 거리다(아이언은 낮게 날아 그린을 굴러 넘었다)
  if (d < 80 || surf === 'sand') return { name: '웨지', loft: 46 * D2R, vmax: 29, d };
  return { name: '아이언', loft: 24 * D2R, vmax: 41, d };
}
/** 추천 힘 — 거리에 맞는 막대 위치를 표시해 준다(처음 치는 사람도 감을 잡게).
    공중으로 치는 클럽은 **날아가는 거리를 실제로 계산해** 찾는다(공기 저항 때문에 공식이 안 맞는다).
    떨어진 뒤 조금 구르므로 거리의 90% 에 떨어지게 잡는다. */
function carryOf(cl, p) {
  const v0 = cl.vmax * p, v = new THREE.Vector3(v0 * Math.cos(cl.loft), v0 * Math.sin(cl.loft), 0);
  let x = 0, y = 0;
  for (let i = 0; i < 2400; i++) {
    const h = 1 / 240, sp = v.length();
    v.addScaledVector(v, -0.0042 * sp * h); v.y -= G_GRAV * h;
    x += v.x * h; y += v.y * h;
    if (y < 0 && v.y < 0) break;
  }
  return x;
}
function golfIdeal(cl) {
  const putt = cl.loft === 0;
  // v88 — 공중 샷은 **실제로 쳐 본다**: 핀 쪽으로 힘을 바꿔 가며 물리를 돌려 핀에 가장 가깝게 서는 힘을 고른다.
  //       (비거리 비율로 짐작하면 호수 건너 러프에 서거나, 그린을 굴러 넘어 뒤 벙커에 빠졌다)
  // 퍼트는 **지금 겨눈 방향**으로 — 경사를 읽어 방향을 틀면 추천 힘도 따라 바뀐다(오르막·내리막 반영)
  const b = GOLF.ball, key = cl.name + '|' + b.x.toFixed(2) + '|' + b.z.toFixed(2) + (putt ? '|' + M.yaw.toFixed(3) : '');
  if (golfIdeal.k === key) return golfIdeal.v;
  const tg = golfTarget(), yaw0 = M.yaw;
  if (!putt) M.yaw = Math.atan2(-(tg.x / CM - b.x), -(tg.z / CM - b.z));
  const score = (pw) => {
    const st = golfShotState(pw);
    let ev = null;
    for (let i = 0; i < 90 * 14 && ev !== 'holed' && ev !== 'stop' && ev !== 'water' && ev !== 'oob'; i++) ev = golfPhysStep(st, 1 / 90);
    if (ev === 'holed') return 0;
    if (ev === 'water' || ev === 'oob') return 999;
    return Math.hypot(tg.x / CM - st.ball.x, tg.z / CM - st.ball.z) + (golfSurface(st.ball.x, st.ball.z) === 'sand' ? 8 : 0);
  };
  // 퍼트는 짧은 거리라 힘 범위를 좁혀 촘촘히(추정치 주변)
  const guess = clamp(Math.sqrt(2 * SURF.green.roll * (cl.d + 0.35)) / cl.vmax, 0.05, 1);
  const [p0, p1, st] = putt ? [Math.max(0.03, guess * 0.5), Math.min(1, guess * 1.7), 0.02] : [0.15, 1.0, 0.02];
  let best = guess, bs = Infinity;
  for (let pw = p0; pw <= p1 + 1e-4; pw += st) { const sc = score(pw); if (sc < bs) { bs = sc; best = pw; } }
  for (let pw = best - st; pw <= best + st; pw += st / 5) { const sc = score(pw); if (sc < bs) { bs = sc; best = pw; } }
  M.yaw = yaw0;
  golfIdeal.k = key; golfIdeal.v = clamp(best, 0.05, 1);
  return golfIdeal.v;
}

function golfHud() {
  let el = $('golfHud');
  if (!el) {
    el = document.createElement('div'); el.id = 'golfHud'; el.className = 'golf-hud';
    el.innerHTML = '<div class="gh-top"><b id="ghTitle"></b><span id="ghStroke"></span></div>'
      + '<div class="gh-row"><span id="ghClub"></span><span id="ghDist"></span></div>'
      + '<div class="gh-bar"><i id="ghPow"></i><em id="ghIdeal"></em></div>'
      + '<p class="gh-help" id="ghHelp"></p>';
    $('gal').appendChild(el);
  }
  return el;
}
function golfPaint(msg) {
  const el = golfHud();
  el.classList.toggle('hidden', !GOLF.mode);
  let q = $('golfQuit');
  if (!q && GOLF.mode) {
    q = document.createElement('button'); q.id = 'golfQuit'; q.className = 'golf-quit'; q.textContent = '✕ 그만두기';
    q.addEventListener('pointerdown', (ev) => { ev.preventDefault(); ev.stopPropagation(); golfQuit(); });
    $('gal').appendChild(q);
  }
  if (q) q.classList.toggle('hidden', !GOLF.mode);
  if (!GOLF.mode) return;
  const cl = golfClub();
  $('ghTitle').textContent = GOLF.course === 'hole' ? '18번 홀 · 파 3' : '퍼팅 연습';
  $('ghStroke').textContent = GOLF.strokes + '타';
  $('ghClub').textContent = cl.name;
  $('ghDist').textContent = '핀까지 ' + (cl.d < 10 ? cl.d.toFixed(1) : Math.round(cl.d)) + 'm';
  $('ghPow').style.transform = 'scaleX(' + (GOLF.mode === 'power' ? GOLF.power : 0).toFixed(3) + ')';
  $('ghIdeal').style.left = (golfIdeal(cl) * 100).toFixed(1) + '%';
  $('ghHelp').textContent = msg || (M.touch ? '드래그로 방향 · 버튼을 누르고 있다가 흰 선에서 놓기 · ✕ 그만두기'
    : '마우스 · ←→ 로 방향 · Space 를 누르고 있다가 흰 선에서 놓기 · W 로 걸어 나가기 · Esc 그만두기');
  if (!msg && GOLF.pv && GOLF.mode === 'aim') {
    $('ghHelp').textContent = (GOLF.pv.putt ? (GOLF.pv.ev === 'holed' ? '금색 선 = 들어가는 길 · ' : '선을 컵에 맞춰 보세요 · ') : '예상 비거리 ' + Math.round(GOLF.carry || 0) + 'm · ') + $('ghHelp').textContent;
  }
}

/** 핀 표시 — 조준하는 동안 깃대 위에 거리를 띄운다. 70m 밖 깃대는 몇 픽셀뿐이라 */
function golfPin(on) {
  let el = $('golfPin');
  if (!el) {
    if (!on) return;
    el = document.createElement('div'); el.id = 'golfPin'; el.className = 'golf-pin';
    el.innerHTML = '<b></b><i></i>';
    $('gal').appendChild(el);
  }
  if (on) {
    const tg = golfTarget(), y = golfGround(tg.x / CM, tg.z / CM) + (GOLF.course === 'hole' ? 2.9 : 1.2);
    const v = new THREE.Vector3(tg.x / CM, y, tg.z / CM).project(M.cam);
    on = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
    if (on) {
      el.style.transform = 'translate(' + ((v.x + 1) / 2 * innerWidth).toFixed(1) + 'px,' + ((1 - v.y) / 2 * innerHeight).toFixed(1) + 'px)';
      const d = golfClub().d;
      el.firstChild.textContent = (d < 10 ? d.toFixed(1) : Math.round(d)) + 'm';
    }
  }
  el.classList.toggle('hidden', !on);
}

/** 존 안에서 시작 안내 — 걸어 다니는 중에만 */
function golfCue() {
  const z = !GOLF.mode && M.room && golfCourseAt(M.pos.x * CM, M.pos.z * CM);
  let cue = $('golfCue');
  if (!cue) {
    cue = document.createElement('div'); cue.id = 'golfCue'; cue.className = 'golf-cue hidden';
    $('gal').appendChild(cue);
    cue.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); golfStart(); });
  }
  cue.classList.toggle('hidden', !z);
  if (z) cue.innerHTML = (z === 'hole' ? '⛳ <b>티샷</b> — 18번 홀 파3' : '⛳ <b>퍼팅</b> — 연습 그린') + (M.touch ? ' · 탭' : ' · <kbd>Space</kbd>');
}

function golfStart() {
  const course = golfCourseAt(M.pos.x * CM, M.pos.z * CM);
  if (!course) return;
  GOLF.course = course; GOLF.strokes = 0;
  if (course === 'hole') GOLF.ball = new THREE.Vector3(HOLE.tee.x / CM, 0, (HOLE.tee.z - 60) / CM);
  else GOLF.ball = new THREE.Vector3(M.pos.x - Math.sin(M.yaw) * 1.2, 0, M.pos.z - Math.cos(M.yaw) * 1.2);
  GOLF.ball.y = golfGround(GOLF.ball.x, GOLF.ball.z) + BALL_R;
  GOLF.last = GOLF.ball.clone();
  if (!GOLF.mesh) {
    GOLF.mesh = new THREE.Mesh(new THREE.SphereGeometry(BALL_R * 1.6, 16, 12), new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.3 }));
    GOLF.mesh.castShadow = false;
    GOLF.shadow = contactShadow(0.07, 0.07, 0.6);
    GOLF.trail = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.55 }));
    M.scene.add(GOLF.mesh, GOLF.shadow, GOLF.trail);
  }
  GOLF.mesh.visible = GOLF.shadow.visible = true;
  GOLF.trailPts = [];
  if (GOLF.fov0 == null) GOLF.fov0 = M.cam.fov;
  M.cam.fov = GOLF_FOV; M.cam.updateProjectionMatrix();
  golfAimAt();
  if ($('golfCue')) $('golfCue').classList.add('hidden');
  golfPaint();
}
/** 조준 카메라 자리 — 공 뒤 거리 · 높이(m) */
function golfCamRig() {
  const putt = GOLF.course === 'practice' || golfClub().loft === 0;
  return putt ? { far: 2.4, up: 1.45 } : { far: 4.4, up: 2.3 };
}
const GOLF_FOV = 50;
function golfAimAt() {
  const tg = golfTarget(), b = GOLF.ball;
  M.yaw = Math.atan2(-(tg.x / CM - b.x), -(tg.z / CM - b.z));
  // 공이 화면 아래 ¼ 쯤(HUD 위)에 오도록 내려다본다 — 폰은 HUD 가 가운데 아래라 조금 더 위로
  const rig = golfCamRig(), half = GOLF_FOV / 2 * Math.PI / 180;
  const want = M.touch ? 0.12 : 0.5;
  M.pitch = -(Math.atan2(rig.up, rig.far) - Math.atan(want * Math.tan(half)));
  GOLF.mode = 'aim';
  GOLF.vel = null;
}
function golfQuit(msg) {
  GOLF.mode = null;
  golfAimDraw(false);
  if (GOLF.fov0 != null) { M.cam.fov = GOLF.fov0; M.cam.updateProjectionMatrix(); GOLF.fov0 = null; }
  golfPin(false);
  if (GOLF.mesh) GOLF.mesh.visible = GOLF.shadow.visible = false;
  if (GOLF.trail) GOLF.trail.visible = false;
  // 공이 있던 자리 옆에 선다(물·경기 구역 밖이면 원래 자리)
  const b = GOLF.ball;
  if (b) {
    const x = (b.x + Math.sin(M.yaw) * 1.4) * CM, z = (b.z + Math.cos(M.yaw) * 1.4) * CM;
    const r = pickRoom(x, z, M.feet, 400);
    if (r && !hitsWall(x, z, floorAt(r, x, z))) { M.pos.x = x / CM; M.pos.z = z / CM; M.room = r; M.feet = floorAt(r, x, z); M.eyeFeet = M.feet; }
  }
  golfPaint();
  if (msg) toast(msg, 5000);
}
/** Space(또는 폰 버튼) — down: 힘 모으기 시작 / up: 친다 */
function golfKey(down) {
  if (!GOLF.mode) { if (down) golfStart(); return; }
  if (down && GOLF.mode === 'aim') { GOLF.mode = 'power'; GOLF.powerT = 0; }
  else if (!down && GOLF.mode === 'power') golfShoot();
}
function golfShoot() {
  const cl = golfClub(), p = GOLF.power;
  const v = cl.vmax * Math.max(0.03, p);
  const dir = new THREE.Vector3(-Math.sin(M.yaw), 0, -Math.cos(M.yaw));
  GOLF.vel = dir.multiplyScalar(v * Math.cos(cl.loft));
  GOLF.vel.y = v * Math.sin(cl.loft);
  GOLF.rolling = cl.loft === 0;
  // 백스핀 — 첫 바운드에서 남는 속도. 웨지는 떨어진 자리 근처에서 선다
  GOLF.spin = cl.loft > 0.6 ? 0.3 : cl.loft > 0 ? 0.62 : 1;
  GOLF.last = GOLF.ball.clone();
  GOLF.strokes++;
  GOLF.mode = 'flight';
  GOLF.flightT = 0;
  GOLF.bounced = false; GOLF.land = null;
  GOLF.trailPts = [GOLF.ball.clone()];
  // 타이밍 판정 — 추천 힘에 얼마나 맞췄나
  const miss = Math.abs(p - golfIdeal(cl));
  const grade = miss < 0.025 ? 'PERFECT' : miss < 0.07 ? 'GOOD' : '';
  if (grade) golfBanner(grade, '', grade === 'PERFECT' ? 'gold' : '');
  // 치는 맛 — 소리 · 짧은 멈칫(히트스톱) · 카메라 흔들림 · 튀는 잔디/모래
  const surf = golfSurface(GOLF.ball.x, GOLF.ball.z), amt = 0.55 + p * 0.6;
  golfSfx(cl.loft === 0 ? 'putt' : surf === 'sand' ? 'sand' : cl.loft > 0.6 ? 'wedge' : 'iron', amt);
  GOLF.hitstop = cl.loft === 0 ? 0.03 : 0.085;
  GOLF.shake = cl.loft === 0 ? 0.004 : 0.02 + p * 0.03;
  if (cl.loft > 0) {
    const d = new THREE.Vector3(-Math.sin(M.yaw), 0, -Math.cos(M.yaw));
    golfBits(surf === 'sand' ? 'sand' : 'turf', GOLF.ball, d, surf === 'sand' ? 40 : Math.round(8 + p * 16));
  }
  GOLF.pv = null;
  golfPaint(cl.name + ' · 힘 ' + Math.round(p * 100) + '%' + (grade ? ' · ' + grade : ''));
}

/** 매 프레임 — 공 물리와 카메라. step() 대신 돈다 */
function golfStep(dt) {
  const putt = golfClub().loft === 0;
  if (GOLF.mode === 'power') {
    GOLF.powerT += dt;
    // 0 → 1 → 0 을 오간다. 퍼터는 느리게(짧은 거리를 맞추기 쉽게)
    GOLF.power = 0.5 - 0.5 * Math.cos(GOLF.powerT * Math.PI * (putt ? 0.62 : 1.0));
    golfPaint();
  }
  // 방향 미세 조정 — ←/→ 또는 A/D(Shift 는 더 곱게)
  /* v120 — 사용자: "골프를 치게 되면 끝날 때까지 나갈 수가 없다". Esc 하나뿐이었는데, 마우스 고정 중엔 브라우저가 Esc 를
     고정 해제에 써 버려 골프가 끝나지 않았고, 폰 안내의 ✕ 는 버튼이 없었다 → ✕ 그만두기 버튼 · W/S(↑↓)로 걸어 나가기 · 고정이 풀리면 끝 */
  if (GOLF.mode === 'aim') {
    const K = M.keys || {};
    GOLF.walkOut = (K.w || K.s || K.arrowup || K.arrowdown) ? (GOLF.walkOut || 0) + dt : 0;
    if (GOLF.walkOut > 0.3) { GOLF.walkOut = 0; golfQuit('골프를 그만두고 걸어 나왔습니다'); return; }
  }
  if (GOLF.mode === 'aim' || GOLF.mode === 'power') {
    const K = M.keys || {}, turn = (K.arrowleft || K.a ? 1 : 0) - (K.arrowright || K.d ? 1 : 0);
    if (turn) M.yaw += turn * (putt ? 0.2 : 0.38) * (K.shift ? 0.3 : 1) * dt;
  }
  const b = GOLF.ball;
  if (GOLF.hitstop > 0) { GOLF.hitstop -= dt; dt = 0; }
  if (GOLF.mode === 'flight' && dt > 0) {
    const N = 6, h = dt / N;
    GOLF.flightT = (GOLF.flightT || 0) + dt;
    for (let k = 0; k < N && GOLF.mode === 'flight'; k++) golfPhys(h);
    if (GOLF.mode === 'flight' && GOLF.flightT > 18) golfStop();     // 안전장치 — 18초 넘게 움직이면 그 자리에 선다
    if (GOLF.trailPts.length < 400 && !GOLF.rolling) GOLF.trailPts.push(b.clone());
  }
  if (GOLF.mode === 'settle') {
    GOLF.settleT -= dt;
    if (GOLF.settleT <= 0) golfAimAt();
  }
  // 카메라 — 조준 중엔 공 뒤 3m, 날아가는 동안엔 따라간다
  const behind = new THREE.Vector3(Math.sin(M.yaw), 0, Math.cos(M.yaw));
  let cx, cy, cz;
  if (GOLF.mode === 'flight' && !GOLF.rolling) {
    const v = GOLF.vel.clone().setY(0); if (v.lengthSq() > 0.01) v.normalize(); else v.copy(behind).negate();
    cx = b.x - v.x * 7; cz = b.z - v.z * 7; cy = Math.max(b.y + 2.6, golfGround(cx, cz) + 1.8);
    M.cam.position.lerp(new THREE.Vector3(cx, cy, cz), Math.min(1, dt * 3.5));
    M.cam.lookAt(b);
  } else {
    const rig = golfCamRig();
    cx = b.x + behind.x * rig.far; cz = b.z + behind.z * rig.far; cy = Math.max(golfGround(cx, cz), b.y) + rig.up;
    M.cam.position.lerp(new THREE.Vector3(cx, cy, cz), Math.min(1, dt * 6));
    M.cam.rotation.set(M.pitch, M.yaw, 0, 'YXZ');
  }
  // 흔들림 — 임팩트 순간 짧게
  if (GOLF.shake > 0.0005) {
    M.cam.position.x += (Math.random() - 0.5) * GOLF.shake; M.cam.position.y += (Math.random() - 0.5) * GOLF.shake;
    GOLF.shake *= Math.pow(0.02, Math.max(dt, 1 / 60));
  }
  // 긴장 — 힘을 모으는 동안 화각이 조금 좁아졌다가 치면 돌아온다
  const fovT = GOLF_FOV - (GOLF.mode === 'power' ? GOLF.power * 5 : 0);
  if (Math.abs(M.cam.fov - fovT) > 0.01) { M.cam.fov += (fovT - M.cam.fov) * Math.min(1, (dt || 1 / 60) * 10); M.cam.updateProjectionMatrix(); }
  M.pos.set(M.cam.position.x, M.cam.position.y, M.cam.position.z);
  golfPin(GOLF.mode === 'aim' || GOLF.mode === 'power');
  golfAimDraw(GOLF.mode === 'aim' || GOLF.mode === 'power');
  const rm = pickRoom(M.pos.x * CM, M.pos.z * CM, M.feet, 1e9);
  if (rm && rm !== M.room) { M.room = rm; }
  cullRooms(M.room);
}

/** 공 한 걸음 — st: { ball, vel, rolling, spin, bounced }. 미리보기(golfPreview)와 실제 샷이 **같은 식**을 쓴다.
    돌려주는 값: null · 'land'(처음 땅에 닿음) · 'water' · 'oob' · 'holed' · 'stop' */
function golfPhysStep(st, h) {
  const b = st.ball, v = st.vel;
  if (!st.rolling) {
    const sp = v.length();
    v.addScaledVector(v, -0.0042 * sp * h);                    // 공기 저항
    v.y -= G_GRAV * h;
    b.addScaledVector(v, h);
    const gy = golfGround(b.x, b.z);
    if (b.y - BALL_R <= gy) {
      const s = golfSurface(b.x, b.z);
      if (s === 'water') return 'water';
      if (s === 'oob') return 'oob';
      const S = SURF[s] || SURF.rough;
      b.y = gy + BALL_R;
      const k = S.keep * (st.spin || 1);
      st.spin = 1;
      if (-v.y > 1.6 && S.e > 0) { v.y = -v.y * S.e; v.x *= k; v.z *= k; }
      else { v.y = 0; st.rolling = true; v.x *= k || 0.5; v.z *= k || 0.5; }
      if (!st.bounced) { st.bounced = true; st.land = b.clone(); return 'land'; }
    }
    return null;
  }
  // 굴림 — 마찰 + 경사
  const s = golfSurface(b.x, b.z);
  if (s === 'water') return 'water';
  if (s === 'oob') return 'oob';
  const S = SURF[s] || SURF.rough;
  const e = 0.25, gx = (golfGround(b.x + e, b.z) - golfGround(b.x - e, b.z)) / (2 * e), gz = (golfGround(b.x, b.z + e) - golfGround(b.x, b.z - e)) / (2 * e);
  v.x -= G_GRAV * gx * h * 0.7; v.z -= G_GRAV * gz * h * 0.7;
  const tg = golfTarget(), dx = tg.x / CM - b.x, dz = tg.z / CM - b.z, dcup = Math.hypot(dx, dz);
  // 컵 가장자리의 깔때기 — 느린 공은 컵 쪽으로 살짝 끌린다(v88: 넣기가 너무 어렵다는 의견)
  if (dcup < 0.22 && dcup > 1e-3 && Math.hypot(v.x, v.z) < 1.3) { const pull = 2.2 * (1 - dcup / 0.22); v.x += dx / dcup * pull * h; v.z += dz / dcup * pull * h; }
  const sp = Math.hypot(v.x, v.z);
  const dec = S.roll * h;
  if (sp <= dec) { v.x = 0; v.z = 0; } else { v.x *= (sp - dec) / sp; v.z *= (sp - dec) / sp; }
  b.x += v.x * h; b.z += v.z * h;
  b.y = golfGround(b.x, b.z) + BALL_R;
  const spd = Math.hypot(v.x, v.z);
  // 컵 — 실제 컵(반지름 5.4cm)보다 넉넉히 받는다
  if (dcup < 0.08 && spd < 1.5) return 'holed';
  if (dcup < 0.15 && spd < 0.75) return 'holed';
  // 멈춤 — 느려졌고 경사가 풀의 붙잡는 힘보다 약하면 선다
  if (spd < 0.08 && G_GRAV * Math.hypot(gx, gz) * 0.7 < S.hold) { v.x = 0; v.z = 0; return 'stop'; }
  return null;
}
function golfPhys(h) {
  const ev = golfPhysStep(GOLF, h);
  if (!ev) return;
  if (ev === 'land') { golfFx('land'); return; }
  if (ev === 'water' || ev === 'oob') {
    if (ev === 'water') { golfSfx('splash'); if (typeof lakeSplash === 'function') lakeSplash(GOLF.ball.x, GOLF.ball.z, 0.6); }
    return golfHazard(ev);
  }
  if (ev === 'holed') return golfHoled();
  if (ev === 'stop') {
    // OK(컨시드) — 그린 위 60cm 안에 서면 한 타 더해 넣은 것으로 친다
    const tg = golfTarget(), d = Math.hypot(tg.x / CM - GOLF.ball.x, tg.z / CM - GOLF.ball.z);
    if (golfSurface(GOLF.ball.x, GOLF.ball.z) === 'green' && d < 0.6) { GOLF.strokes++; return golfHoled('ok'); }
    golfStop();
  }
}

/* ── 조준 미리보기 — 날아갈 곡선 · 떨어질 자리(공중 샷) / 굴러갈 길(퍼트) ─────────────
   ⚠️ 예전엔 방향만 카메라로 짐작해야 했다("에임이 안 보인다"). 조준 중엔 추천 힘으로,
      힘을 모으는 중엔 **지금 힘**으로 실제 물리를 미리 돌려 그린다. 퍼트 길이 컵으로 들어가면 금색 */
function golfShotState(power) {
  const cl = golfClub(), v = cl.vmax * Math.max(0.03, power);
  const dir = new THREE.Vector3(-Math.sin(M.yaw), 0, -Math.cos(M.yaw));
  const vel = dir.multiplyScalar(v * Math.cos(cl.loft)); vel.y = v * Math.sin(cl.loft);
  return { ball: GOLF.ball.clone(), vel, rolling: cl.loft === 0, spin: cl.loft > 0.6 ? 0.3 : cl.loft > 0 ? 0.62 : 1, bounced: false };
}
function golfPreview(power) {
  const key = M.yaw.toFixed(4) + '|' + power.toFixed(3) + '|' + GOLF.ball.x.toFixed(2) + GOLF.ball.z.toFixed(2);
  if (GOLF.pv && GOLF.pv.key === key) return GOLF.pv;
  const st = golfShotState(power), putt = st.rolling, pts = [st.ball.clone()];
  let ev = null;
  for (let i = 0, h = 1 / 90; i < 90 * 14; i++) {
    ev = golfPhysStep(st, h);
    if (i % 2 === 0) pts.push(st.ball.clone());
    if (ev === 'land' && !putt) break;                 // 공중 샷은 떨어지는 데까지만 보여 준다(구르는 건 운)
    if (ev && ev !== 'land') break;
  }
  pts.push(st.ball.clone());
  GOLF.pv = { key, pts, end: st.ball.clone(), ev, putt, land: st.land || st.ball.clone() };
  return GOLF.pv;
}
function golfAimDraw(on) {
  if (!GOLF.dots) {
    const N = 140;
    GOLF.dots = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.9, depthWrite: false, fog: false }), N);
    GOLF.dots.frustumCulled = false; GOLF.dots.renderOrder = 5;
    GOLF.ring = new THREE.Mesh(new THREE.RingGeometry(0.7, 1, 56),
      new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.85, depthWrite: false, fog: false, side: THREE.DoubleSide }));
    GOLF.ring.rotation.x = -Math.PI / 2; GOLF.ring.renderOrder = 5;
    M.scene.add(GOLF.dots, GOLF.ring);
  }
  GOLF.dots.visible = GOLF.ring.visible = !!on;
  if (!on) { if ($('golfLand')) $('golfLand').classList.add('hidden'); return; }
  const cl = golfClub(), pw = GOLF.mode === 'power' ? GOLF.power : golfIdeal(cl);
  const pv = golfPreview(pw);
  const gold = pv.ev === 'holed';
  const col = gold ? 0xFFD24A : pv.ev === 'water' ? 0x7FC8FF : 0xFFFFFF;
  GOLF.dots.material.color.setHex(col); GOLF.ring.material.color.setHex(col);
  // 점 — 길이를 따라 고른 간격으로(퍼트 25cm, 공중 샷 1.6m)
  const gap = pv.putt ? 0.22 : 1.6, r = pv.putt ? 0.026 : 0.07;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3();
  let n = 0, acc = gap * 0.5;
  const t = performance.now() / 1000;
  for (let i = 1; i < pv.pts.length && n < GOLF.dots.count; i++) {
    const a = pv.pts[i - 1], b = pv.pts[i], L = a.distanceTo(b);
    let u = acc;
    while (u < L && n < GOLF.dots.count) {
      p3.copy(a).lerp(b, u / L);
      if (pv.putt) p3.y = golfGround(p3.x, p3.z) + 0.012;
      const k = 0.75 + 0.25 * Math.sin(t * 6 - n * 0.5);          // 공 쪽에서 앞으로 흐르는 반짝임
      m4.compose(p3, q, s3.setScalar(r * k)); GOLF.dots.setMatrixAt(n++, m4);
      u += gap;
    }
    acc = u - L;
  }
  for (let i = n; i < GOLF.dots.count; i++) { m4.makeScale(0, 0, 0); GOLF.dots.setMatrixAt(i, m4); }
  GOLF.dots.instanceMatrix.needsUpdate = true;
  const at = pv.putt ? pv.end : pv.land, rs = pv.putt ? 0.16 : cl.loft > 0.6 ? 1.2 : 2.2;
  GOLF.ring.position.set(at.x, golfGround(at.x, at.z) + 0.03, at.z);
  GOLF.ring.scale.setScalar(rs * (1 + 0.06 * Math.sin(t * 5)));
  GOLF.carry = Math.hypot(pv.land.x - GOLF.ball.x, pv.land.z - GOLF.ball.z);
  // 떨어질 자리 표시(화면 글씨) — 멀리 있는 고리는 작아 잘 안 보인다
  let el = $('golfLand');
  if (!el) { el = document.createElement('div'); el.id = 'golfLand'; el.className = 'golf-pin golf-land'; el.innerHTML = '<b></b><i></i>'; $('gal').appendChild(el); }
  const v = new THREE.Vector3(at.x, golfGround(at.x, at.z) + 0.6, at.z).project(M.cam);
  const vis = !pv.putt && v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
  el.classList.toggle('hidden', !vis);
  if (vis) {
    el.style.transform = 'translate(' + ((v.x + 1) / 2 * innerWidth).toFixed(1) + 'px,' + ((1 - v.y) / 2 * innerHeight).toFixed(1) + 'px)';
    el.firstChild.textContent = (pv.ev === 'water' ? '물 ' : '착지 ') + Math.round(GOLF.carry) + 'm';
  }
}

/* ── 치는 맛 — 소리 · 멈칫(히트스톱) · 흔들림 · 튀는 잔디/모래 · 판정 ───────────────── */
function golfAudio() {
  if (typeof sndCtx === 'function') { GOLF.ac = sndCtx(); return GOLF.ac; }
  if (GOLF.ac === undefined) { try { GOLF.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { GOLF.ac = null; } }
  if (GOLF.ac && GOLF.ac.state === 'suspended') GOLF.ac.resume();
  return GOLF.ac;
}
function golfSfx(kind, amt = 1) {
  const ac = golfAudio(); if (!ac) return;
  const t0 = ac.currentTime, out = ac.createGain(); out.gain.value = 0.55; out.connect(typeof SND !== 'undefined' && SND.bus ? SND.bus : ac.destination);
  const noise = (dur, f, q, g0, type = 'bandpass', at = t0) => {
    const n = Math.ceil(ac.sampleRate * dur), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    const src = ac.createBufferSource(); src.buffer = buf;
    const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const g = ac.createGain(); g.gain.value = g0;
    src.connect(fl); fl.connect(g); g.connect(out); src.start(at);
  };
  const tone = (f0, f1, dur, g0, type = 'sine', at = t0) => {
    const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, at); o.frequency.exponentialRampToValueAtTime(f1, at + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(g0, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(out); o.start(at); o.stop(at + dur + 0.02);
  };
  if (kind === 'iron') {            // 딱! — 짧은 고음 타격 + 낮은 울림
    noise(0.05, 3200, 1.2, 1.4 * amt); tone(1900, 700, 0.06, 0.5 * amt, 'triangle'); tone(160, 60, 0.12, 0.7 * amt);
    noise(0.35, 900, 0.6, 0.25 * amt, 'bandpass', t0 + 0.02);            // 잔디가 찢기는 소리
  } else if (kind === 'wedge') {
    noise(0.04, 2600, 1.4, 1.1 * amt); tone(1500, 600, 0.05, 0.35 * amt, 'triangle'); noise(0.3, 700, 0.5, 0.3 * amt, 'bandpass', t0 + 0.015);
  } else if (kind === 'sand') {
    noise(0.5, 1400, 0.4, 0.9 * amt, 'lowpass'); tone(120, 50, 0.15, 0.4 * amt);
  } else if (kind === 'putt') {     // 톡
    tone(1150, 800, 0.05, 0.45 * amt, 'triangle'); noise(0.02, 4000, 2, 0.5 * amt);
  } else if (kind === 'land') {
    noise(0.12, 380, 0.8, 0.35 * amt, 'lowpass');
  } else if (kind === 'wade') {     // 물 헤치는 발소리
    noise(0.22, 700 + Math.random() * 500, 0.7, 0.35 * amt, 'lowpass'); noise(0.12, 2600, 1.2, 0.12 * amt, 'bandpass', t0 + 0.04);
  } else if (kind === 'splash') {
    noise(0.7, 1200, 0.3, 0.8, 'lowpass'); noise(0.4, 3000, 0.6, 0.3, 'bandpass', t0 + 0.05);
  } else if (kind === 'cup') {      // 딸그락 — 공이 컵 바닥에 부딪힌다
    tone(2400, 2100, 0.09, 0.4, 'triangle'); tone(3100, 2800, 0.07, 0.25, 'triangle', t0 + 0.07);
    tone(2200, 1900, 0.06, 0.2, 'triangle', t0 + 0.13); noise(0.05, 2500, 3, 0.3, 'bandpass', t0 + 0.02);
  } else if (kind === 'cheer') {    // 박수 — 짧은 잡음을 흩어 놓는다
    for (let i = 0; i < 70; i++) noise(0.03 + Math.random() * 0.03, 1800 + Math.random() * 1600, 1.5, 0.12 + Math.random() * 0.15, 'bandpass', t0 + 0.25 + Math.random() * 1.8 * Math.pow(Math.random(), 0.6));
    noise(1.8, 700, 0.3, 0.12, 'bandpass', t0 + 0.2);
  }
}
/** 튀는 조각 — 잔디(초록·흙) 또는 모래 */
function golfBits(kind, at, dir, n) {
  if (!GOLF.bits) {
    const N = 90;
    GOLF.bits = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.35, 0.6), new THREE.MeshStandardMaterial({ roughness: 0.9 }), N);
    GOLF.bits.frustumCulled = false; GOLF.bits.userData.keep = true; GOLF.bitP = [];
    GOLF.bits.material.userData.out = true;
    M.scene.add(GOLF.bits); applyEnv(GOLF.bits);
  }
  const col = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const idx = (GOLF.bitI = ((GOLF.bitI || 0) + 1) % GOLF.bits.count);
    const sp = kind === 'sand' ? 2 + Math.random() * 3 : 2.5 + Math.random() * 4;
    GOLF.bitP[idx] = {
      p: at.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.08, 0.02, (Math.random() - 0.5) * 0.08)),
      v: new THREE.Vector3(dir.x * sp + (Math.random() - 0.5) * 1.6, 1.5 + Math.random() * (kind === 'sand' ? 3 : 2.2), dir.z * sp + (Math.random() - 0.5) * 1.6),
      life: 1.4, s: kind === 'sand' ? 0.008 + Math.random() * 0.012 : 0.015 + Math.random() * 0.03, r: Math.random() * 6,
    };
    col.setHex(kind === 'sand' ? 0xD9C9A0 : (Math.random() < 0.65 ? 0x3F7A2A : 0x5A4630)).multiplyScalar(0.8 + Math.random() * 0.4);
    GOLF.bits.setColorAt(idx, col);
  }
  if (GOLF.bits.instanceColor) GOLF.bits.instanceColor.needsUpdate = true;
}
function golfBitsStep(dt) {
  if (!GOLF.bits) return;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s3 = new THREE.Vector3();
  for (let i = 0; i < GOLF.bits.count; i++) {
    const b = GOLF.bitP[i];
    if (!b || b.life <= 0) { m4.makeScale(0, 0, 0); GOLF.bits.setMatrixAt(i, m4); continue; }
    b.life -= dt; b.v.y -= G_GRAV * dt; b.p.addScaledVector(b.v, dt); b.r += dt * 9;
    const gy = golfGround(b.p.x, b.p.z) + 0.005;
    if (b.p.y < gy) { b.p.y = gy; b.v.set(0, 0, 0); }
    q.setFromEuler(e.set(b.r, b.r * 0.7, 0));
    m4.compose(b.p, q, s3.setScalar(b.s * Math.min(1, b.life * 2))); GOLF.bits.setMatrixAt(i, m4);
  }
  GOLF.bits.instanceMatrix.needsUpdate = true;
}
function golfFx(kind) {
  const b = GOLF.ball, surf = golfSurface(b.x, b.z);
  if (kind === 'land') {
    golfSfx('land', 0.8);
    if (surf === 'sand') golfBits('sand', b, new THREE.Vector3(0, 0, 0), 14);
  }
}
/** 큰 글씨 — PERFECT · 버디 · OK 등 */
function golfBanner(text, sub, tone) {
  let el = $('golfBanner');
  if (!el) { el = document.createElement('div'); el.id = 'golfBanner'; el.className = 'golf-banner'; $('gal').appendChild(el); }
  el.className = 'golf-banner ' + (tone || '');
  el.innerHTML = '<b>' + text + '</b>' + (sub ? '<span>' + sub + '</span>' : '');
  void el.offsetWidth; el.classList.add('show');
  clearTimeout(golfBanner.t); golfBanner.t = setTimeout(() => el.classList.remove('show'), tone === 'big' ? 2600 : 1100);
}

function golfStop() {
  GOLF.mode = 'settle'; GOLF.settleT = 1.1;
  const cl = golfClub();
  const carry = Math.hypot(GOLF.ball.x - GOLF.last.x, GOLF.ball.z - GOLF.last.z);
  const s = golfSurface(GOLF.ball.x, GOLF.ball.z);
  const where = { green: '그린', fairway: '페어웨이', rough: '러프', sand: '벙커' }[s] || '';
  golfPaint(Math.round(carry) + 'm · ' + where + ' · 핀까지 ' + (cl.d < 10 ? cl.d.toFixed(1) : Math.round(cl.d)) + 'm');
}
function golfHazard(kind) {
  GOLF.strokes++;
  if (kind === 'water') {
    GOLF.ball.set(HOLE.drop.x / CM, 0, HOLE.drop.z / CM);
    toast('💧 워터 해저드 — 1벌타, 드롭존에서 칩니다', 3500);
  } else {
    GOLF.ball.copy(GOLF.last);
    toast('경기 구역 밖 — 1벌타, 친 자리에서 다시', 3500);
  }
  GOLF.ball.y = golfGround(GOLF.ball.x, GOLF.ball.z) + BALL_R;
  GOLF.mode = 'settle'; GOLF.settleT = 1.0;
  golfPaint();
}
function golfHoled(ok) {
  const n = GOLF.strokes;
  golfAimDraw(false);
  if (!ok) golfSfx('cup');
  GOLF.ball.set(golfTarget().x / CM, golfGround(golfTarget().x / CM, golfTarget().z / CM) - 0.05, golfTarget().z / CM);
  let msg;
  if (GOLF.course === 'hole') {
    const d = n - HOLE.par;
    const name = n === 1 ? '홀인원!' : ({ '-2': '이글', '-1': '버디', 0: '파', 1: '보기', 2: '더블 보기' }[d] || (d > 0 ? '+' + d : String(d)));
    let best = null;
    try { best = +localStorage.getItem('museum-golf-best') || null; if (!best || n < best) localStorage.setItem('museum-golf-best', String(n)); } catch (e) { /* 기록 없이 */ }
    msg = '🏁 홀아웃 — ' + n + '타 · ' + name + (best && n >= best ? ' (최고 ' + best + '타)' : ' · 최고 기록') + (ok ? ' · OK 컨시드' : '');
    golfBanner(ok ? 'OK!' : name, n + '타' + (ok ? ' · 컨시드 +1' : ''), 'big');
    if (!ok || d <= 0) setTimeout(() => golfSfx('cheer'), ok ? 0 : 260);
  } else {
    msg = '🏁 컵인 — ' + n + '타' + (ok ? ' · OK 컨시드' : '');
    golfBanner(ok ? 'OK!' : '컵인!', n + '타', 'big');
  }
  GOLF.mode = null;
  setTimeout(() => { if (GOLF.mesh) GOLF.mesh.visible = GOLF.shadow.visible = false; }, 900);
  golfQuit(msg);
}
/** 공·그늘·궤적 — 표시만(물리는 golfStep) */
function golfStepVisual(t) {
  const dt = Math.min(0.05, Math.max(0, t - (GOLF.vt || t))); GOLF.vt = t;
  golfBitsStep(dt);                                 // 튄 잔디 — 골프를 그만둬도 끝까지 떨어진다
  if (!GOLF.mesh || !GOLF.ball) return;
  GOLF.mesh.position.copy(GOLF.ball);
  GOLF.shadow.position.set(GOLF.ball.x, golfGround(GOLF.ball.x, GOLF.ball.z) + 0.006, GOLF.ball.z);
  const pts = GOLF.trailPts || [];
  GOLF.trail.visible = !!GOLF.mode && pts.length > 1;
  if (GOLF.trail.visible) GOLF.trail.geometry.setFromPoints(pts);
}
