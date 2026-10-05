/* ══════════════════════════════════════════════════════════
   창밖의 도시(v130) — 관리자의 방 동쪽 창
   ══════════════════════════════════════════════════════════
   사용자: "너무 가벼운 느낌. 창밖을 보면 여기는 고층 건물이고 밖에는 비가 오며, 퇴근 시간대처럼 차들과 사람들이
            교통 신호에 따라 횡단보도에서 분주하게 이동하는 모습이 있었으면."
   · 창은 '포털'이다 — 따로 만든 도시 장면을 관람객 눈 위치 그대로(창 중심 = 도시의 6층 높이) 렌더 타깃에 그리고,
     창 판은 화면 좌표로 그 그림을 뜯어 붙인다. 그래서 다가가면 아래 길이 보이고, 옆으로 가면 원근이 바뀐다.
   · 도시: 창 앞 광장 → 8차선 대로(남북) → 건너편 인도 → 동쪽으로 뻗은 골목길(T자) → 두 번째 사거리 → 먼 스카이라인
   · 신호: 두 교차로가 각자 주기(초록 · 노랑 · 전적색)를 돈다. 차는 정지선에서 서고, 앞차와 거리를 두고,
     사람이 건너는 횡단보도 앞에서는 기다린다. 우산 쓴 사람들은 보행 신호가 켜질 때만 건넌다.
   · 비 · 젖은 길(전조등 · 미등 · 네온이 길에 번진다) · 가로등 · 불 켜진 창 · 옥상 항공장애등
   · 두 번째 밤(office.js): 비가 그치고, 차와 사람이 줄고, 달이 뜬다
   좌표: 도시 미터. 창 판이 x=0 평면(바깥 = +x), 창 중심이 (0, CITY_H, 0). +z = 오른쪽(남쪽) */
const CITY_H = 20;
const CITY = { on: false, t: 0, cars: [], peds: [], night2: false, sig: { 1: 0, 2: 10 } };

/* ── 신호 — 주기 37초: A 초록 16 · A 노랑 3 · 전적색 1.5 · B 초록 12 · B 노랑 3 · 전적색 1.5 ── */
const CITY_CYCLE = 37;
function citySig(name) {          // 'A1' · 'B1' · 'A2' · 'B2' → 'G' | 'Y' | 'R'
  const k = name[1], ph = name[0], t = ((CITY.t + CITY.sig[k]) % CITY_CYCLE + CITY_CYCLE) % CITY_CYCLE;
  if (ph === 'A') return t < 16 ? 'G' : t < 19 ? 'Y' : 'R';
  return t >= 20.5 && t < 32.5 ? 'G' : t >= 32.5 && t < 35.5 ? 'Y' : 'R';
}
/** 보행 신호 — 그 방향 차가 '빨강'인 동안의 초록(끝나기 4초 전에는 새로 건너지 않는다) */
function cityWalk(gate) {
  const k = gate[1], ph = gate[0], t = ((CITY.t + CITY.sig[k]) % CITY_CYCLE + CITY_CYCLE) % CITY_CYCLE;
  // 횡단보도 A? = A 신호 동안 걷는다(그 횡단보도를 가로지르는 차가 B 쪽이라)
  return ph === 'A' ? t < 12 : (t >= 20.5 && t < 28.5);
}

/* ── 길 — 차선 경로(점 목록 → 누적 길이) ── */
function cityPath(pts, stops) {
  const P = [], L = [0];
  const crv = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'catmullrom', 0.2);
  const n = Math.max(40, Math.round(crv.getLength() / 2));
  for (let i = 0; i <= n; i++) P.push(crv.getPointAt(i / n));
  for (let i = 1; i < P.length; i++) L.push(L[i - 1] + P[i].distanceTo(P[i - 1]));
  const path = { P, L, len: L[L.length - 1], stops: [] };
  // 정지선 — [x 또는 z 좌표 기준, 신호] → 경로 위 거리로
  for (const st of stops || []) {
    let best = 0, bd = 1e9;
    for (let i = 0; i < P.length; i++) { const d = st.x != null ? Math.abs(P[i].x - st.x) + (st.near != null ? Math.abs(P[i].z - st.near) : 0) : Math.abs(P[i].z - st.z) + (st.near != null ? Math.abs(P[i].x - st.near) : 0); if (d < bd) { bd = d; best = i; } }
    path.stops.push({ s: L[best], sig: st.sig });
  }
  return path;
}
function cityAt(path, s, out) {
  const L = path.L; let i = 1;
  if (s <= 0) i = 1; else { let lo = 1, hi = L.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (L[m] < s) lo = m + 1; else hi = m; } i = lo; }
  const a = path.P[i - 1], b = path.P[i], u = Math.min(1, Math.max(0, (s - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1])));
  out.set(a.x + (b.x - a.x) * u, 0, a.z + (b.z - a.z) * u);
  return Math.atan2(b.x - a.x, b.z - a.z);
}

/* ── 짓기 ── */
function cityBuild() {
  const S = new THREE.Scene();
  S.background = new THREE.Color(0x1A1E25);
  S.fog = new THREE.FogExp2(0x1C2027, 0.0062);
  CITY.scene = S;
  CITY.cam = new THREE.PerspectiveCamera(64, 1, 0.08, 1500);
  CITY.rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType });
  const B = (c, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k) });
  const add = (geos, mat) => { if (!geos.length) return null; const m = new THREE.Mesh(mergeGeos(geos), mat); S.add(m); return m; };
  const flat = (w, d, x, y, z) => { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); g.translate(x, y, z); return g; };

  // 바닥 · 길 · 인도
  add([flat(2400, 2400, 400, 0, 0)], B(0x0C0D10));                                          // 젖은 아스팔트(전체)
  const walk = B(0x26272A), curb = B(0x3A3A3C), line = B(0xB8B8B0, 0.9), yel = B(0xB89A40, 0.8);
  add([flat(12, 1200, 6, 0.12, 0), flat(7, 1200, 32.5, 0.12, 0),                           // 창 앞 광장 · 건너편 인도
    flat(400, 4, 236, 0.12, -9), flat(400, 4, 236, 0.12, 9),                                 // 골목 양쪽 인도(x 36~)
    flat(8, 400, 110, 0.12, -211), flat(8, 400, 110, 0.12, 211), flat(8, 400, 130, 0.12, -211), flat(8, 400, 130, 0.12, 211)], walk);
  add([flat(0.3, 1200, 12.1, 0.14, 0), flat(0.3, 1200, 28.9, 0.14, 0), flat(2.5, 1200, 20.5, 0.16, 0)], curb);   // 연석 · 중앙분리대
  // 차선(점선) · 중앙선 · 정지선 · 횡단보도
  const marks = [], ymarks = [];
  for (let z = -600; z < 600; z += 9) { marks.push(flat(0.15, 4, 15.75, 0.015, z), flat(0.15, 4, 25.25, 0.015, z)); }
  for (let x = 44; x < 640; x += 9) { if (x > 104 && x < 136) continue; marks.push(flat(4, 0.15, x, 0.015, -3.5)); }
  for (let z = -600; z < 600; z += 9) { if (Math.abs(z) < 16) continue; }
  ymarks.push(flat(600, 0.12, 340, 0.016, 0.1), flat(600, 0.12, 340, 0.016, -0.1));
  ymarks.push(flat(0.12, 1200, 119.9, 0.016, 0), flat(0.12, 1200, 120.1, 0.016, 0));
  marks.push(flat(7, 0.4, 15.75, 0.015, -14.5), flat(7, 0.4, 25.25, 0.015, 14.5), flat(0.4, 7, 41.5, 0.015, -3.5), flat(0.4, 6, 106.5, 0.015, 3.5), flat(0.4, 6, 133.5, 0.015, -3.5), flat(6, 0.4, 117, 0.015, -14.5), flat(6, 0.4, 123, 0.015, 14.5));
  const zebra = (x0, x1, z0, z1, alongX) => { if (alongX) { for (let x = x0; x < x1; x += 1.1) marks.push(flat(0.55, z1 - z0, x + 0.28, 0.015, (z0 + z1) / 2)); } else { for (let z = z0; z < z1; z += 1.1) marks.push(flat(x1 - x0, 0.55, (x0 + x1) / 2, 0.015, z + 0.28)); } };
  zebra(12.3, 28.8, -13, -9, true); zebra(12.3, 28.8, 9, 13, true);                         // 대로 횡단보도(북 · 남)
  zebra(36, 40, -7, 7, false);                                                               // 골목 입구 횡단보도
  zebra(108, 112, -7, 7, false); zebra(128, 132, -7, 7, false);                              // 두 번째 사거리 — 골목 쪽
  zebra(114, 126, -13, -9, true); zebra(114, 126, 9, 13, true);                              // 두 번째 사거리 — 남북 길
  add(marks, line); add(ymarks, yel);
  // 젖은 길 — 가로등 · 네온이 번진 자국(가산)
  CITY.glowTex = (() => { const cv = makeCanvas(64, 64), c = cv.getContext('2d'), g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(cv); return t; })();
  const glowMat = (c, o) => new THREE.MeshBasicMaterial({ map: CITY.glowTex, color: new THREE.Color(c), transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, fog: true });

  // 건물 — 창 무늬 세 가지(켜진 창 · 꺼진 창). 지붕 면은 어두운 가장자리 픽셀로
  const winTex = (seed, warm) => {
    const cv = makeCanvas(256, 512), c = cv.getContext('2d'); let s = seed; const R = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    c.fillStyle = '#121418'; c.fillRect(0, 0, 256, 512);
    for (let r = 0; r < 24; r++) for (let k = 0; k < 8; k++) {
      const on = R() < (warm ? 0.42 : 0.3), x = 4 + k * 31.5, y = 4 + r * 21.2;
      c.fillStyle = on ? (R() < 0.7 ? 'rgb(255,214,150)' : 'rgb(200,220,255)') : 'rgb(30,34,40)'; c.globalAlpha = on ? 0.35 + R() * 0.55 : 1;
      c.fillRect(x + 5, y + 4, 21, 12);
    }
    c.globalAlpha = 1; c.fillStyle = '#0A0B0D'; c.fillRect(0, 0, 3, 3);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  };
  const texs = [winTex(11, true), winTex(37, false), winTex(73, true)], bgeo = [[], [], []];
  let seed = 5; const R = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const bldg = (x0, x1, z0, z1, h, k) => {
    const w = x1 - x0, d = z1 - z0, g = new THREE.BoxGeometry(w, h, d); g.translate((x0 + x1) / 2, h / 2, (z0 + z1) / 2);
    const uv = g.attributes.uv, ox = R(), oy = R();
    // 면 순서: +x, −x, +y, −y, +z, −z (면마다 4점)
    const fw = [d, d, 0, 0, w, w];
    for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      if (f === 2 || f === 3) uv.setXY(i, 0.001, 0.001);
      else uv.setXY(i, ox + uv.getX(i) * fw[f] / 15, oy + uv.getY(i) * h / 34);   // 창 하나 ≈ 1.9m × 1.4m
    }
    bgeo[k % 3].push(g);
  };
  // 대로 건너편(북 · 남 블록)
  for (const sgn of [-1, 1]) {
    let z = 12;
    while (z < 330) { const w = 16 + R() * 26; bldg(36, 36 + 24 + R() * 14, sgn > 0 ? z : -z - w, sgn > 0 ? z + w : -z, 18 + R() * 60, Math.floor(R() * 3)); z += w + 1 + R() * 3; }
    // 골목 양옆 — 두 번째 사거리 전 · 후
    for (const [xa, xb] of [[62, 84], [86, 106], [134, 158], [160, 186], [188, 214], [216, 246], [248, 280], [282, 320]]) bldg(xa, xb, sgn > 0 ? 11.5 : -11.5 - (14 + R() * 20), sgn > 0 ? 11.5 + 14 + R() * 20 : -11.5, 14 + R() * (xa > 130 ? 90 : 50), Math.floor(R() * 3));
  }
  // 먼 스카이라인
  for (let i = 0; i < 70; i++) { const x = 330 + R() * 420, z = -380 + R() * 760, w = 18 + R() * 30, d = 18 + R() * 30; if (z < 50 && z + d > -50) continue;   // 골목 끝 하늘은 비워 둔다(두 번째 밤의 달)
    bldg(x, x + w, z, z + d, 50 + R() * 190, Math.floor(R() * 3)); }
  texs.forEach((t, k) => { const m = new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(1, 1, 1).multiplyScalar(0.85) }); add(bgeo[k], m); });
  // 옥상 항공장애등(깜빡) — 높은 건물 몇
  { const g = new THREE.SphereGeometry(0.6, 6, 4), m = B(0xFF2A1A, 4); CITY.beacons = new THREE.InstancedMesh(g, m, 14); const d = new THREE.Object3D();
    for (let i = 0; i < 14; i++) { d.position.set(340 + R() * 380, 120 + R() * 110, -300 + R() * 600); d.updateMatrix(); CITY.beacons.setMatrixAt(i, d.matrix); }
    S.add(CITY.beacons); }
  // 네온 간판(대로 건너편 · 골목) — 관람객 쪽(−x)을 본다 · 길에 번진 빛
  { const signs = [['HOTEL', '#FF6A4A', 37, 26, -40], ['약국', '#4AFF8A', 37, 6, 30], ['BAR', '#FF4AB0', 37, 9, -22], ['24시', '#6AB0FF', 37, 5, 52], ['노래방', '#FFC04A', 63, 8, -12.2], ['CAFE', '#E8E0C8', 87, 6, 12.2], ['PC', '#6AE0FF', 135, 7, -12.2], ['정형외과', '#FFFFFF', 37, 15, 75]];
    for (const [txt, col, x, y, z] of signs) {
      const cv = makeCanvas(256, 96), c = cv.getContext('2d'); c.fillStyle = 'rgba(0,0,0,0)'; c.clearRect(0, 0, 256, 96); c.shadowColor = col; c.shadowBlur = 18; c.fillStyle = col; c.font = 'bold 60px "Noto Sans KR", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, 128, 50);
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(txt.length > 3 ? 7 : 5, 2.4), new THREE.MeshBasicMaterial({ map: t, transparent: true, color: new THREE.Color(1.8, 1.8, 1.8), depthWrite: false }));
      const onAve = Math.abs(z) > 12.1 || x < 40;
      if (onAve) { m.position.set(x - 0.6, y, z); m.rotation.y = -Math.PI / 2; } else { m.position.set(x + 8, y, z > 0 ? z - 0.6 : z + 0.6); m.rotation.y = z > 0 ? Math.PI : 0; }
      S.add(m);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(5, 12), glowMat(col, 0.22)); p.rotation.x = -Math.PI / 2; p.position.set(onAve ? x - 8 : x + 8, 0.03, onAve ? z : (z > 0 ? z - 6 : z + 6)); S.add(p);
    }
  }
  // 가로등 — 기둥 · 머리 · 젖은 바닥의 빛 웅덩이
  { const poles = [], heads = [], spots = [];
    const lamp = (x, z, hx, hz) => { poles.push(new THREE.BoxGeometry(0.18, 7, 0.18).translate(x, 3.5, z)); heads.push(new THREE.BoxGeometry(0.9, 0.18, 0.4).translate(x + hx, 7, z + hz)); spots.push([x + hx, z + hz]); };
    for (let z = -330; z <= 330; z += 24) { lamp(11.5, z, 0.6, 0); lamp(29.5, z + 12, -0.6, 0); }
    for (let x = 48; x <= 330; x += 26) { if (x > 104 && x < 136) continue; lamp(x, -7.6, 0, 0.6); lamp(x + 13, 7.6, 0, -0.6); }
    add(poles, B(0x2A2A2C)); add(heads, B(0xFFE2B0, 3.2));
    const g = new THREE.PlaneGeometry(9, 9); g.rotateX(-Math.PI / 2); const im = new THREE.InstancedMesh(g, glowMat(0xFFD49A, 0.28), spots.length); const d = new THREE.Object3D();
    spots.forEach(([x, z], i) => { d.position.set(x, 0.025, z); d.updateMatrix(); im.setMatrixAt(i, d.matrix); }); S.add(im);
  }
  // 광장 — 화단 · 벤치 · 나무(창 바로 아래)
  { const pl = [], tr = [];
    for (let z = -300; z <= 300; z += 15) { pl.push(new THREE.BoxGeometry(2.2, 0.6, 2.2).translate(7, 0.3, z)); tr.push(new THREE.SphereGeometry(2.2, 8, 6).translate(7, 4.2, z), new THREE.CylinderGeometry(0.15, 0.2, 3.2, 6).translate(7, 1.9, z)); }
    add(pl, B(0x1C1E20)); add(tr, B(0x14181A)); }

  // 신호등 — 차량 신호(빨 · 노 · 초 세 알) · 보행 신호
  CITY.heads = [
    [12.6, -14.8, 'A1'], [28.4, 14.8, 'A1'], [41.8, -7.4, 'B1'],
    [106.2, 7.4, 'A2'], [133.8, -7.4, 'A2'], [113.6, -14.8, 'B2'], [126.4, 14.8, 'B2'],
  ];
  { const pg = []; for (const [x, z] of CITY.heads) pg.push(new THREE.BoxGeometry(0.2, 6.6, 0.2).translate(x, 3.3, z), new THREE.BoxGeometry(0.5, 1.6, 0.45).translate(x, 6.4, z));
    add(pg, B(0x1A1A1C));
    const g = new THREE.SphereGeometry(0.2, 8, 6), m = new THREE.MeshBasicMaterial({ color: 0xffffff }); CITY.lamps = new THREE.InstancedMesh(g, m, CITY.heads.length * 3); const d = new THREE.Object3D();
    CITY.heads.forEach(([x, z], i) => { for (let k = 0; k < 3; k++) { d.position.set(x - 0.26, 6.9 - k * 0.5, z); d.updateMatrix(); CITY.lamps.setMatrixAt(i * 3 + k, d.matrix); CITY.lamps.setColorAt(i * 3 + k, new THREE.Color(0x111111)); } });
    S.add(CITY.lamps); }
  CITY.walkSigns = [[12.3, -9, 'B1'], [28.8, -9, 'B1'], [12.3, 9, 'B1'], [28.8, 9, 'B1'], [36, -7.4, 'A1'], [36, 7.4, 'A1'], [110, -7.4, 'B2'], [110, 7.4, 'B2'], [130, -7.4, 'B2'], [130, 7.4, 'B2'], [113.6, -9, 'A2'], [126.4, -9, 'A2'], [113.6, 9, 'A2'], [126.4, 9, 'A2']];
  { const g = new THREE.BoxGeometry(0.35, 0.35, 0.35), m = new THREE.MeshBasicMaterial({ color: 0xffffff }); CITY.wlamps = new THREE.InstancedMesh(g, m, CITY.walkSigns.length); const d = new THREE.Object3D(); const pg = [];
    CITY.walkSigns.forEach(([x, z], i) => { d.position.set(x, 2.6, z); d.updateMatrix(); CITY.wlamps.setMatrixAt(i, d.matrix); CITY.wlamps.setColorAt(i, new THREE.Color(0x111111)); pg.push(new THREE.BoxGeometry(0.12, 2.6, 0.12).translate(x, 1.3, z)); });
    S.add(CITY.wlamps); add(pg, B(0x1A1A1C)); }

  // 차 — 차체 · 전조등 · 미등 · 길에 번진 빛(전 · 후)
  const N = 64;
  { const body = mergeGeos([new THREE.BoxGeometry(1.85, 0.72, 4.5).translate(0, 0.6, 0), new THREE.BoxGeometry(1.6, 0.55, 2.3).translate(0, 1.2, -0.25)]);
    CITY.carBody = new THREE.InstancedMesh(body, new THREE.MeshBasicMaterial({ color: 0xffffff }), N);
    CITY.carHead = new THREE.InstancedMesh(mergeGeos([new THREE.BoxGeometry(0.35, 0.16, 0.06).translate(-0.65, 0.68, 2.26), new THREE.BoxGeometry(0.35, 0.16, 0.06).translate(0.65, 0.68, 2.26)]), B(0xFFF4E0, 6), N);
    CITY.carTail = new THREE.InstancedMesh(mergeGeos([new THREE.BoxGeometry(0.4, 0.14, 0.06).translate(-0.68, 0.75, -2.26), new THREE.BoxGeometry(0.4, 0.14, 0.06).translate(0.68, 0.75, -2.26)]), new THREE.MeshBasicMaterial({ color: 0xffffff }), N);
    const gf = new THREE.PlaneGeometry(4.2, 12); gf.rotateX(-Math.PI / 2); gf.translate(0, 0.03, 8.5);
    CITY.carBeam = new THREE.InstancedMesh(gf, glowMat(0xFFF0D8, 0.3), N);
    const gr = new THREE.PlaneGeometry(2.6, 6); gr.rotateX(-Math.PI / 2); gr.translate(0, 0.03, -4.6);
    CITY.carRed = new THREE.InstancedMesh(gr, glowMat(0xFF3020, 0.35), N);
    for (const m of [CITY.carBody, CITY.carHead, CITY.carTail, CITY.carBeam, CITY.carRed]) { m.frustumCulled = false; S.add(m); }
    const cols = [0x0E0E10, 0x1A1A1E, 0x2E2F33, 0x5A5C60, 0x9A9CA0, 0xD8D8D4, 0x3A1A18, 0x1A2438, 0xC87A20];
    for (let i = 0; i < N; i++) { CITY.carBody.setColorAt(i, new THREE.Color(cols[Math.floor(R() * cols.length)]).multiplyScalar(0.8)); CITY.carTail.setColorAt(i, new THREE.Color(2.2, 0.12, 0.08)); }
  }
  // 경로
  const P = CITY.paths = {
    sb1: cityPath([[14, -420], [14, 420]], [{ z: -14.5, sig: 'A1' }]),
    sb2: cityPath([[17.5, -420], [17.5, 420]], [{ z: -14.5, sig: 'A1' }]),
    nb1: cityPath([[23.5, 420], [23.5, -420]], [{ z: 14.5, sig: 'A1' }]),
    nb2: cityPath([[27, 420], [27, -420]], [{ z: 14.5, sig: 'A1' }]),
    nbR: cityPath([[27, 420], [27, 20], [27, 9], [29, 5.2], [33, 3.6], [40, 3.5], [104, 3.5], [140, 3.5], [420, 3.5]], [{ z: 14.5, sig: 'A1' }, { x: 106.5, sig: 'A2' }]),
    inL: cityPath([[420, -1.75], [140, -1.75], [60, -1.75], [42, -1.75], [34, -1.75], [26, 2], [20, 7], [17.5, 14], [17.5, 40], [17.5, 420]], [{ x: 133.5, sig: 'A2' }, { x: 41.5, sig: 'B1' }]),
    inR: cityPath([[420, -5.25], [140, -5.25], [60, -5.25], [42, -5.25], [34, -5.4], [29, -7.5], [27, -12], [27, -40], [27, -420]], [{ x: 133.5, sig: 'A2' }, { x: 41.5, sig: 'B1' }]),
    xs: cityPath([[117, -420], [117, 420]], [{ z: -14.5, sig: 'B2' }]),
    xn: cityPath([[123, 420], [123, -420]], [{ z: 14.5, sig: 'B2' }]),
  };
  CITY.spawn = { sb1: 0, sb2: 1, nb1: 2, nb2: 0.5, nbR: 3, inL: 1.5, inR: 2.5, xs: 4, xn: 1 };
  CITY.rate = { sb1: 4.2, sb2: 3.6, nb1: 4, nb2: 6, nbR: 6.5, inL: 5.5, inR: 5, xs: 7, xn: 7.5 };
  for (let i = 0; i < N; i++) CITY.cars.push({ on: false, i, path: null, s: 0, v: 0, pos: new THREE.Vector3(), yaw: 0, brake: false, vmax: 11 + R() * 3 });

  // 보행자 — 몸 · 우산
  const NP = 120;
  CITY.pedBody = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.24, 1.45, 6).translate(0, 0.73, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }), NP);
  CITY.pedUmb = new THREE.InstancedMesh(new THREE.ConeGeometry(0.7, 0.26, 10).translate(0, 1.98, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }), NP);
  for (const m of [CITY.pedBody, CITY.pedUmb]) { m.frustumCulled = false; S.add(m); }
  // 투명 우산이 많다(편의점 우산) · 검은 우산은 젖어 번들거린다 — 젖은 검은 길 위에서 보이게 밝기를 둔다
  const umc = [0xC8CCD2, 0xC8CCD2, 0xB8BEC6, 0x4A4C52, 0x3A3C42, 0x2A3452, 0x8A8478, 0x9A2A22, 0x5A4A3A];
  const coat = [0x1A1A1C, 0x2A2622, 0x3A3632, 0x14161A, 0x4A4640];
  for (let i = 0; i < NP; i++) { CITY.pedUmb.setColorAt(i, new THREE.Color(umc[Math.floor(R() * umc.length)])); CITY.pedBody.setColorAt(i, new THREE.Color(coat[Math.floor(R() * coat.length)])); }
  // 인도 길목(노드) · 길(간선, 횡단보도는 문[gate])
  const Nd = CITY.nodes = {
    NN: [10.3, -170], NS: [10.3, 170], NW1: [10.3, -11], NW2: [10.3, 11],
    FW1: [30.6, -11], FW2: [30.6, 11], FN: [31.5, -170], FS: [31.5, 170],
    X1a: [38, -9.2], X1b: [38, 9.2],
    c2NW: [111, -10.2], c2NE: [129, -10.2], c2SW: [111, 10.2], c2SE: [129, 10.2],
    EN: [300, -9.2], ES: [300, 9.2], QNW: [111, -170], QNE: [129, -170], QSW: [111, 170], QSE: [129, 170],
  };
  const E = CITY.edges = [
    ['NN', 'NW1'], ['NW1', 'NW2'], ['NW2', 'NS'], ['NW1', 'FW1', 'B1'], ['NW2', 'FW2', 'B1'],
    ['FN', 'FW1'], ['FW1', 'X1a'], ['X1a', 'X1b', 'A1'], ['X1b', 'FW2'], ['FW2', 'FS'],
    ['X1a', 'c2NW'], ['X1b', 'c2SW'], ['c2NW', 'c2SW', 'B2'], ['c2NE', 'c2SE', 'B2'], ['c2NW', 'c2NE', 'A2'], ['c2SW', 'c2SE', 'A2'],
    ['c2NE', 'EN'], ['c2SE', 'ES'], ['c2NW', 'QNW'], ['c2NE', 'QNE'], ['c2SW', 'QSW'], ['c2SE', 'QSE'],
  ];
  CITY.adj = {}; for (const k in Nd) CITY.adj[k] = [];
  E.forEach(([a, b, gate]) => { CITY.adj[a].push([b, gate]); CITY.adj[b].push([a, gate]); });
  CITY.ends = ['NN', 'NS', 'FN', 'FS', 'EN', 'ES', 'QNW', 'QNE', 'QSW', 'QSE'];
  for (let i = 0; i < NP; i++) CITY.peds.push({ on: false, i, route: null, k: 0, u: 0, v: 1.3, off: 0, wait: 0, run: false, x: 0, z: 0, yaw: 0, ph: R() * 6 });

  // 비 — 창 앞 공기 속 빗줄기
  { const n = 2200, pos = new Float32Array(n * 6); CITY.rainN = n;
    for (let i = 0; i < n; i++) { const x = 6 + Math.pow(R(), 1.2) * 70, y = R() * 44, z = -40 + R() * 80; pos.set([x, y, z, x + 0.04, y - 0.9, z + 0.02], i * 6); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    CITY.rain = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: new THREE.Color(0.75, 0.8, 0.88), transparent: true, opacity: 0.09, depthWrite: false }));
    CITY.rain.frustumCulled = false; S.add(CITY.rain); }
  // 달(두 번째 밤에만)
  { const cv = makeCanvas(128, 128), c = cv.getContext('2d'), g = c.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,245,1)'); g.addColorStop(0.28, 'rgba(250,248,235,1)'); g.addColorStop(0.32, 'rgba(240,240,230,.35)'); g.addColorStop(1, 'rgba(240,240,230,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128);
    CITY.moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), color: new THREE.Color(2, 2, 2), fog: false, depthWrite: false })); CITY.moon.scale.set(64, 64, 1); CITY.moon.position.set(900, 175, 6); CITY.moon.visible = false; S.add(CITY.moon); }

  // 처음부터 붐비게 — 40초를 미리 돌린다
  CITY.prefill = true; for (let i = 0; i < 600; i++) cityStepSim(0.1); CITY.prefill = false;
}

/* ── 사람 길 찾기(BFS) ── */
function cityRoute(a, b) {
  const prev = { [a]: null }, q = [a];
  while (q.length) { const n = q.shift(); if (n === b) break; for (const [m, gate] of CITY.adj[n]) if (!(m in prev)) { prev[m] = [n, gate]; q.push(m); } }
  if (!(b in prev)) return null;
  const out = []; let n = b; while (prev[n]) { out.unshift({ to: n, from: prev[n][0], gate: prev[n][1] }); n = prev[n][0]; }
  return out;
}
function citySpawnPed(p) {
  const E = CITY.ends, a = E[Math.floor(Math.random() * E.length)]; let b = a; while (b === a) b = E[Math.floor(Math.random() * E.length)];
  const r = cityRoute(a, b); if (!r || !r.length) return;
  p.on = true; p.route = r; p.k = 0; p.u = 0; p.off = (Math.random() - 0.5) * 1.8; p.wait = 0;
  if (CITY.prefill) p.u = Math.random();   // 처음 채울 때는 길 중간 어디쯤에서
  p.run = Math.random() < 0.08; p.v = p.run ? 2.6 + Math.random() * 0.6 : 1.05 + Math.random() * 0.55;
}

/** 시뮬레이션 — 신호 · 차 · 사람 · 비 */
function cityStepSim(dt) {
  CITY.t += dt;
  const busy = CITY.night2 ? 0.28 : 1;
  // 횡단보도 위 사람(차가 기다린다)
  const XW = CITY.xw || (CITY.xw = [[12, 29, -13.4, -8.6], [12, 29, 8.6, 13.4], [35.6, 40.4, -7.2, 7.2], [107.6, 112.4, -7.2, 7.2], [127.6, 132.4, -7.2, 7.2], [113.6, 126.4, -13.4, -8.6], [113.6, 126.4, 8.6, 13.4]]);
  const occ = XW.map(() => false);
  for (const p of CITY.peds) if (p.on) XW.forEach((r, i) => { if (p.x > r[0] && p.x < r[1] && p.z > r[2] && p.z < r[3]) occ[i] = true; });
  // 차 — 만들기
  for (const k in CITY.paths) {
    CITY.spawn[k] -= dt;
    if (CITY.spawn[k] <= 0) {
      CITY.spawn[k] = CITY.rate[k] * (0.6 + Math.random() * 0.9) / busy;
      const free = CITY.cars.find((c) => !c.on); if (!free) continue;
      const path = CITY.paths[k], blocked = CITY.cars.some((c) => c.on && c.path === path && c.s < 14);
      if (blocked) continue;
      free.on = true; free.path = path; free.s = 0; free.v = free.vmax; free.brake = false;
    }
  }
  // 차 — 움직이기
  const tmp = CITY.tmp || (CITY.tmp = new THREE.Vector3());
  for (const c of CITY.cars) {
    if (!c.on) continue;
    c.yaw = cityAt(c.path, c.s, c.pos);
    let gap = 1e9;
    // 정지선
    for (const st of c.path.stops) {
      const d = st.s - c.s; if (d < -1 || d > 70) continue;
      const g = citySig(st.sig);
      if (g === 'R' || (g === 'Y' && d > c.v * c.v / 10 + 2)) gap = Math.min(gap, d - 1);
    }
    // 앞차(같은 방향 · 같은 차로 근처)
    const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw);
    for (const o of CITY.cars) {
      if (o === c || !o.on) continue;
      const dx = o.pos.x - c.pos.x, dz = o.pos.z - c.pos.z, along = dx * fx + dz * fz;
      if (along <= 0 || along > 40) continue;
      const lat = Math.abs(dx * fz - dz * fx); if (lat > 1.7) continue;
      gap = Math.min(gap, along - 6.2);
    }
    // 횡단보도에 사람이 있으면 그 앞에서
    for (const ahead of [3, 7]) {
      cityAt(c.path, c.s + ahead, tmp);
      XW.forEach((r, i) => { if (occ[i] && tmp.x > r[0] && tmp.x < r[1] && tmp.z > r[2] && tmp.z < r[3]) gap = Math.min(gap, ahead - 4.5); });
    }
    const want = gap < 1e8 ? Math.min(c.vmax, Math.max(0, Math.sqrt(Math.max(0, 2 * 4.5 * Math.max(0, gap))))) : c.vmax;
    const a = want > c.v ? 2.6 : -6;
    c.v = Math.max(0, c.v + Math.max(-6 * dt, Math.min(2.6 * dt, want - c.v)) * (a > 0 ? 1 : 1));
    if (gap < 0.3) c.v = 0;
    c.brake = c.v < want - 0.5 || c.v < 0.5;
    c.s += c.v * dt;
    if (c.s >= c.path.len) c.on = false;
  }
  // 사람 — 만들기 · 걷기 · 신호 기다리기
  const want = Math.round(CITY.peds.length * (CITY.night2 ? 0.22 : 0.92));
  let live = 0; for (const p of CITY.peds) if (p.on) live++;
  if (live < want) { const p = CITY.peds.find((q) => !q.on); if (p && Math.random() < dt * 6) citySpawnPed(p); }
  for (const p of CITY.peds) {
    if (!p.on) continue;
    const seg = p.route[p.k];
    if (p.u === 0 && seg.gate && !cityWalk(seg.gate)) { p.wait += dt; const a = CITY.nodes[seg.from]; p.x = a[0]; p.z = a[1]; cityPedOff(p, seg); p.ph += dt * 0.5; continue; }
    const a = CITY.nodes[seg.from], b = CITY.nodes[seg.to], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    p.u += (p.v * (seg.gate ? 1.15 : 1)) * dt / Math.max(0.1, L);
    p.ph += dt * p.v * 3.2;
    if (p.u >= 1) { p.k++; p.u = 0; if (p.k >= p.route.length) { p.on = false; continue; } }
    const s2 = p.route[p.k], A = CITY.nodes[s2.from], Bn = CITY.nodes[s2.to];
    p.x = A[0] + (Bn[0] - A[0]) * p.u; p.z = A[1] + (Bn[1] - A[1]) * p.u; p.yaw = Math.atan2(Bn[0] - A[0], Bn[1] - A[1]);
    cityPedOff(p, s2);
  }
  // 비
  if (CITY.rain && CITY.rain.visible) {
    const a = CITY.rain.geometry.attributes.position, arr = a.array, fall = 15 * dt;
    for (let i = 0; i < CITY.rainN; i++) { const o = i * 6; arr[o + 1] -= fall; arr[o + 4] -= fall; if (arr[o + 4] < 0) { const y = 40 + Math.random() * 6; arr[o + 1] = y; arr[o + 4] = y - 0.9; } }
    a.needsUpdate = true;
  }
}
function cityPedOff(p, seg) {
  const a = CITY.nodes[seg.from], b = CITY.nodes[seg.to], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  p.x += -(b[1] - a[1]) / L * p.off; p.z += (b[0] - a[0]) / L * p.off;
}

/** 그리기용 행렬 · 신호 색 */
function cityPaint() {
  const d = CITY.dummy || (CITY.dummy = new THREE.Object3D()), Z = new THREE.Matrix4().makeScale(0, 0, 0);
  for (const c of CITY.cars) {
    if (!c.on) { for (const m of [CITY.carBody, CITY.carHead, CITY.carTail, CITY.carBeam, CITY.carRed]) m.setMatrixAt(c.i, Z); continue; }
    d.position.set(c.pos.x, 0, c.pos.z); d.rotation.set(0, c.yaw, 0); d.scale.set(1, 1, 1); d.updateMatrix();
    for (const m of [CITY.carBody, CITY.carHead, CITY.carTail, CITY.carBeam, CITY.carRed]) m.setMatrixAt(c.i, d.matrix);
    CITY.carTail.instanceColor.setXYZ(c.i, c.brake ? 4.5 : 1.6, c.brake ? 0.2 : 0.08, c.brake ? 0.12 : 0.05);
  }
  for (const m of [CITY.carBody, CITY.carHead, CITY.carTail, CITY.carBeam, CITY.carRed]) m.instanceMatrix.needsUpdate = true;
  CITY.carTail.instanceColor.needsUpdate = true;
  for (const p of CITY.peds) {
    if (!p.on) { CITY.pedBody.setMatrixAt(p.i, Z); CITY.pedUmb.setMatrixAt(p.i, Z); continue; }
    const bob = Math.abs(Math.sin(p.ph)) * (p.run ? 0.12 : 0.05);
    d.position.set(p.x, bob, p.z); d.rotation.set(0, p.yaw, 0); d.scale.set(1, 1, 1); d.updateMatrix(); CITY.pedBody.setMatrixAt(p.i, d.matrix);
    if (p.run || CITY.night2) d.scale.set(0, 0, 0); else d.rotation.set(Math.sin(p.ph) * 0.05, p.yaw, 0.08); d.updateMatrix(); CITY.pedUmb.setMatrixAt(p.i, d.matrix);
  }
  CITY.pedBody.instanceMatrix.needsUpdate = true; CITY.pedUmb.instanceMatrix.needsUpdate = true;
  const on = { R: [3.5, 0.15, 0.08], Y: [3.2, 2.2, 0.2], G: [0.2, 3.2, 1.6] }, off = 0.06;
  CITY.heads.forEach(([x, z, sig], i) => { const s = citySig(sig); ['R', 'Y', 'G'].forEach((k, j) => { const c = on[k]; const lit = s === k; CITY.lamps.instanceColor.setXYZ(i * 3 + j, lit ? c[0] : off, lit ? c[1] : off, lit ? c[2] : off); }); });
  CITY.lamps.instanceColor.needsUpdate = true;
  CITY.walkSigns.forEach(([x, z, g], i) => { const w = cityWalk(g); CITY.wlamps.instanceColor.setXYZ(i, w ? 0.3 : 3, w ? 3 : 0.15, w ? 1.4 : 0.1); });
  CITY.wlamps.instanceColor.needsUpdate = true;
  if (CITY.beacons) CITY.beacons.visible = (CITY.t % 1.6) < 0.5;
}

/* ── 창에 붙이기 — office.js 가 창 판을 넘긴다(방 그룹 안 · 월드 위치) ── */
function cityPane(pane, wx, wy, wz) {
  try { cityBuild(); } catch (e) { console.warn('[museum] 창밖 도시를 만들지 못했습니다', e); return false; }
  CITY.W = new THREE.Vector3(wx, wy, wz);
  pane.material = new THREE.ShaderMaterial({
    uniforms: { tCity: { value: CITY.rt.texture }, uK: { value: 1.0 } },
    vertexShader: 'varying vec4 vC; void main(){ vC = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = vC; }',
    fragmentShader: 'uniform sampler2D tCity; uniform float uK; varying vec4 vC; void main(){ vec2 uv = vC.xy / vC.w * 0.5 + 0.5; gl_FragColor = vec4(texture2D(tCity, uv).rgb * uK, 1.0); }',
  });
  pane.material.userData.noBatch = true;
  pane.geometry.computeBoundingSphere();
  CITY.pane = pane; CITY.on = true;
  CITY.frustum = new THREE.Frustum(); CITY.pm = new THREE.Matrix4(); CITY.sph = new THREE.Sphere();
  return true;
}
/** 두 번째 밤 — 비 그침 · 한산 · 달 */
function cityNight2() {
  if (!CITY.on) return;
  CITY.night2 = true;
  if (CITY.rain) CITY.rain.visible = false;
  if (CITY.moon) CITY.moon.visible = true;
  CITY.scene.background.set(0x10141C); CITY.scene.fog.color.set(0x12161E); CITY.scene.fog.density = 0.0045;
}
/** 매 프레임(stepOffice) — 방 안에 있을 때만 돌리고, 창이 화면에 걸릴 때만 그린다 */
function cityStep(dt, inR) {
  if (!CITY.on || !inR) return;
  cityStepSim(Math.min(dt, 0.05));
  const R = M.renderer, cam = M.cam;
  cam.updateMatrixWorld();
  CITY.pm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); CITY.frustum.setFromProjectionMatrix(CITY.pm);
  CITY.sph.copy(CITY.pane.geometry.boundingSphere).applyMatrix4(CITY.pane.matrixWorld);
  if (!CITY.frustum.intersectsSphere(CITY.sph)) return;
  cityPaint();
  const v = CITY.v2 || (CITY.v2 = new THREE.Vector2()); R.getDrawingBufferSize(v);
  const w = Math.max(2, Math.round(v.x * 0.6)), h = Math.max(2, Math.round(v.y * 0.6));
  if (CITY.rt.width !== w || CITY.rt.height !== h) CITY.rt.setSize(w, h);
  const C = CITY.cam; C.projectionMatrix.copy(cam.projectionMatrix); C.projectionMatrixInverse.copy(cam.projectionMatrixInverse);
  cam.getWorldPosition(C.position); C.position.sub(CITY.W); C.position.y += CITY_H; cam.getWorldQuaternion(C.quaternion); C.updateMatrixWorld(true);
  const prev = R.getRenderTarget();
  R.setRenderTarget(CITY.rt); R.clear(); R.render(CITY.scene, C); R.setRenderTarget(prev);
}
