/* ══════════════════════════════════════════════════════════
   맵 확장(v122) — 서쪽 숲길 · 옛 클럽하우스 / 동쪽 드라이빙 레인지 · 주차장
   ══════════════════════════════════════════════════════════
   사용자: "몰입감도 없고 컨텐츠도 별로 없다. 건물 기준 좌우측 지형을 더 확장해서 맵을 더 만들어도 좋아" → "응 맵 확장 진행해줘".
     서쪽 — 조각 정원 산울타리의 쪽문 → 숲길(침엽수 사이 자갈길) → 1998년에 문 닫은 옛 클럽하우스(로비 · 라커룸 · 샤워실 · 식당)
       라커 이름표 · 창립 회원 명판 · 식당 테이블의 스코어카드는 실제 기록으로 쓴다
       밤: 숲 깊은 데서 '딱, 딱' 못 박는 소리 — 가 보면 나무에 지푸라기 인형(이름표)이 박혀 있다 · 라커 문이 하나씩 열린다 ·
           샤워기에서 물이 흐른다 · 식당 의자에 등 돌린 사람이 앉아 있다
     동쪽 — 퍼팅 연습장 산울타리의 쪽문 → 드라이빙 레인지(지붕 덮인 타석 여덟 · 과녁 그린 · 그물 기둥) → 남쪽 주차장
       낮: 타석에서 두 사람이 공을 친다(p14 · p15)
       밤: 빈 타석에서 공이 날아간다 · 눈을 돌린 사이 티 위에 공이 다시 올라와 있다 · 주차장 차 한 대에 누가 앉아 있다(비상등)
   방(ROOMS) · 연결(CONNS)은 exhibits.js, 바닥 재질은 여기(MAT_RECIPE), 꾸미기는 buildExpand(museum3d buildScene 끝). */
const EXP = { info: new Set(), ev: null, cool: { nail: 40, locker: 30, range: 50, ghostBall: 30 }, read: new Set() };

/* ── 재질 ── */
function forestTex() {
  const w = SIZE, h = SIZE, fine = fbm(w, h, 913, 5, 5), broad = fbm(w, h, 377, 3, 110), R = rnd(77);
  const cv = makeCanvas(w, h), ctx = cv.getContext('2d'), img = ctx.createImageData(w, h);
  for (let i = 0, p = 0; i < w * h; i++, p += 4) {
    const v = 0.74 + fine[i] * 0.36 + (broad[i] - 0.5) * 0.16, leaf = clamp((broad[i] - 0.5) * 3, 0, 1);
    img.data[p] = (40 + leaf * 12) * v; img.data[p + 1] = (44 + leaf * 4) * v; img.data[p + 2] = (28 + leaf * 1) * v; img.data[p + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  // 떨어진 솔잎 · 잎
  for (let i = 0; i < 900; i++) { ctx.strokeStyle = `rgba(${90 + R() * 60},${60 + R() * 30},${30 + R() * 20},.55)`; ctx.lineWidth = 1; ctx.beginPath(); const x = R() * w, y = R() * h, a = R() * 6.28; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 6, y + Math.sin(a) * 6); ctx.stroke(); }
  return { canvas: cv, normalCanvas: heightToNormal(fine, w, h, 2.2), rough: 0.97 };
}
function asphaltTex() {
  const w = SIZE, h = SIZE, fine = fbm(w, h, 515, 5, 3), broad = fbm(w, h, 911, 3, 90);
  const cv = makeCanvas(w, h), ctx = cv.getContext('2d'), img = ctx.createImageData(w, h);
  for (let i = 0, p = 0; i < w * h; i++, p += 4) { const v = 46 + fine[i] * 26 + (broad[i] - 0.5) * 14; img.data[p] = v; img.data[p + 1] = v; img.data[p + 2] = v + 2; img.data[p + 3] = 255; }
  ctx.putImageData(img, 0, 0);
  return { canvas: cv, normalCanvas: heightToNormal(fine, w, h, 1.4), rough: 0.9 };
}
/** 낡은 타일 — 줄눈 · 얼룩 · 깨진 칸 */
function oldTileTex(base) {
  const w = SIZE, h = SIZE, n = 16, s = w / n, R = rnd(4321), stain = fbm(w, h, 61, 4, 70);
  const cv = makeCanvas(w, h), c = cv.getContext('2d');
  c.fillStyle = '#3A3E3A'; c.fillRect(0, 0, w, h);
  const [r, g, b] = hex(base);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const k = 0.86 + R() * 0.18; c.fillStyle = `rgb(${r * k | 0},${g * k | 0},${b * k | 0})`; c.fillRect(x * s + 1.5, y * s + 1.5, s - 3, s - 3); if (R() < 0.04) { c.strokeStyle = 'rgba(20,20,18,.6)'; c.beginPath(); c.moveTo(x * s + R() * s, y * s); c.lineTo(x * s + R() * s, y * s + s); c.stroke(); } }
  const img = c.getImageData(0, 0, w, h);
  for (let i = 0, p = 0; i < w * h; i++, p += 4) { const d = Math.max(0, stain[i] - 0.55) * 1.6; img.data[p] *= 1 - d * 0.5; img.data[p + 1] *= 1 - d * 0.42; img.data[p + 2] *= 1 - d * 0.6; }
  c.putImageData(img, 0, 0);
  const H = new Float32Array(w * h); for (let i = 0; i < w * h; i++) { const x = i % w, y = (i / w) | 0; H[i] = (x % s < 2 || y % s < 2) ? 0 : 1; }
  return { canvas: cv, normalCanvas: heightToNormal(H, w, h, 1.2), rough: 0.35 };
}
Object.assign(MAT_RECIPE, {
  forest:  { wall: () => limestone(), floor: () => forestTex(), wainscot: '#2A2622' },
  asphalt: { wall: () => limestone(), floor: () => asphaltTex(), wainscot: '#2A2622' },
  oldclub: { wall: () => plaster('#6E665A'), floor: () => parquet('#33281A'), wainscot: '#2A2018' },
  oldtile: { wall: () => oldTileTex('#8C988E'), floor: () => oldTileTex('#6A726C'), wainscot: '#2A302C' },
});

/* ── 상호작용 ── */
function expInfo(mesh, info) {
  info.type = info.type || 'placard'; info.icon = info.icon || '🕯';
  info.id = info.id || 'exp-' + Math.random().toString(36).slice(2, 8);
  M.pickables.push(mesh); M.artByMesh.set(mesh, info);
  return info;
}
const expNight = () => typeof NIGHT === 'undefined' || NIGHT.on;
function expPlayers() { const A = M.archive || {}; return (A.players || []).filter((p) => p && p.name); }
function expMat(c, r = 0.8, m = 0) { return new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m }); }
/** 글자 판 — 캔버스 한 장 */
function expPlate(lines, w = 512, h = 256, bg = '#2A2218', fg = '#E8DCC0', size = 34) {
  const cv = makeCanvas(w, h), c = cv.getContext('2d');
  c.fillStyle = bg; c.fillRect(0, 0, w, h);
  c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle';
  lines.forEach((t, i) => { const L = lines.length, s = i === 0 ? size : size * 0.62; c.font = (i === 0 ? '700 ' : '400 ') + s + 'px "Noto Serif KR", serif'; c.fillText(t, w / 2, h / 2 + (i - (L - 1) / 2) * size * 1.15); });
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ══ 서쪽 — 숲길 ══════════════════════════════════════════ */
const WOODS_PATH = [[-4000, 2900], [-4500, 3250], [-5100, 3150], [-5600, 2700], [-6200, 2400]];
function expNearPath(x, z, w) {
  for (let i = 0; i + 1 < WOODS_PATH.length; i++) {
    const [ax, az] = WOODS_PATH[i], [bx, bz] = WOODS_PATH[i + 1], vx = bx - ax, vz = bz - az, L = vx * vx + vz * vz;
    const k = clamp(((x - ax) * vx + (z - az) * vz) / L, 0, 1);
    if (Math.hypot(x - ax - vx * k, z - az - vz * k) < w) return true;
  }
  return false;
}
function dressWoods() {
  const g = M.roomGroups.woods; if (!g) return;
  const O = objMat(), R = rnd(2024);
  // 자갈길 — 이음 판(살짝 넓게)
  const pathM = new THREE.MeshStandardMaterial({ color: 0x8A8476, roughness: 0.95 });
  for (let i = 0; i + 1 < WOODS_PATH.length; i++) {
    const [ax, az] = WOODS_PATH[i], [bx, bz] = WOODS_PATH[i + 1], L = Math.hypot(bx - ax, bz - az) / CM;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2.0, L + 1.6), pathM);
    p.rotation.x = -Math.PI / 2; p.rotation.z = Math.atan2(bx - ax, bz - az); p.position.set((ax + bx) / 2 / CM, 0.014, (az + bz) / 2 / CM); p.receiveShadow = true; g.add(p);
  }
  // 나무 — 길과 클럽하우스를 비우고 빽빽하게(줄기는 부딪힌다)
  const spots = [], ok = (x, z, gap) => !expNearPath(x, z, 330) && !(x > -8900 && x < -5900 && z > 1500 && z < 4500)
    && M.rooms.some((r) => r.zone === 'west' && r.outdoor && inRect(r, x, z)) && spots.every((s) => Math.hypot(s.x - x, s.z - z) > gap);
  for (let k = 0, t = 0; k < 230 && t < 6000; t++) { const x = -9550 + R() * 5500, z = -750 + R() * 7300; if (ok(x, z, 300)) { spots.push({ x, z, s: 0.8 + R() * 0.8, con: R() < 0.72 }); k++; } }
  if (typeof treesReady === 'function' && treesReady()) {
    const con = [], broad = [];
    spots.forEach((t, i) => { (t.con ? con : broad).push({ x: t.x / CM, y: 0, z: t.z / CM, h: t.con ? 10 + t.s * 6 : 7 + t.s * 3, cell: i % (t.con ? 8 : 16), tint: 0.62 + R() * 0.15 }); });
    if (con.length) g.add(treeCards('conifer', con));
    if (broad.length) g.add(treeCards('broad', broad));
  } else spots.forEach((t) => g.add(smallTree(t.x / CM, 0, t.z / CM, 1.4 * t.s)));
  for (const t of spots) M.walls.push({ x0: t.x - 32, x1: t.x + 32, z0: t.z - 32, z1: t.z + 32, y0: -200, y1: 900 });
  // 숲 바깥 경계 — 낮은 나무 울타리(서 · 북 · 남 끝)
  const fenceM = expMat(0x4A3A2A, 0.9), fence = [];
  for (const [x0, z0, x1, z1] of [[-9560, -760, -9560, 6560], [-9560, -760, -4000, -760], [-9560, 6560, -4000, 6560]]) {
    const L = Math.hypot(x1 - x0, z1 - z0) / CM, n = Math.floor(L / 2.4);
    for (let i = 0; i <= n; i++) { const k = i / n, x = (x0 + (x1 - x0) * k) / CM, z = (z0 + (z1 - z0) * k) / CM; fence.push(boxAt(0.12, 1.1, 0.12, x, 0.55, z)); }
    const cx = (x0 + x1) / 2 / CM, cz = (z0 + z1) / 2 / CM;
    fence.push(boxAt(x0 === x1 ? 0.06 : L, 0.08, x0 === x1 ? L : 0.06, cx, 0.95, cz), boxAt(x0 === x1 ? 0.06 : L, 0.08, x0 === x1 ? L : 0.06, cx, 0.55, cz));
  }
  g.add(new THREE.Mesh(mergeGeos(fence), fenceM));
  // 입구 표지 — 쪽문 바로 안
  { const x = -42.5, z = 31.6;
    const post = new THREE.Mesh(boxAt(0.12, 1.6, 0.12, 0, 0.8, 0), fenceM); post.position.set(x, 0, z); g.add(post);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.62), new THREE.MeshStandardMaterial({ map: expPlate(['옛 클럽하우스 →', '1998년 폐관 · 해 지면 출입 자제'], 512, 244, '#3A2E20', '#EADCBC', 46), roughness: 0.9 }));
    sg.position.set(x + 0.07, 1.45, z); sg.rotation.y = Math.PI / 2; g.add(sg);          // 정원 쪽(동)을 본다
    expInfo(sg, { label: '숲길 표지', title: '옛 클럽하우스 →', room: 'woods', x: x * CM, z: z * CM, y: 140,
      body: '나무 판에 페인트로 쓴 글씨. 화살표만 새로 덧칠되어 있다.' + String.fromCharCode(10) + '1998년에 문을 닫았다는 클럽하우스가 이 길 끝에 있다.' }); }
  // 길가 등 — 셋(밤에 빛난다)
  if (typeof lampPosts === 'function') lampPosts(g, [[-47, 33.5], [-54, 28.5], [-60, 26]]);
  // 지푸라기 인형 — 길에서 조금 들어간 나무줄기에(이름표는 실제 회원 이름)
  dressStrawDolls(g, spots);
}
/** 지푸라기 인형(와라닌교) — 짚 묶음 몸 · 팔 · 머리 + 가슴의 못 + 이름표 */
function strawDoll(name) {
  const G = new THREE.Group(), straw = expMat(0xB59A62, 0.95), rope = expMat(0x6A5232, 0.9);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.36, 8), straw); body.position.y = 0; G.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), straw); head.position.y = 0.23; G.add(head);
  const arms = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.32, 6), straw); arms.rotation.z = Math.PI / 2; arms.position.y = 0.09; G.add(arms);
  for (const y of [0.15, -0.08]) { const b = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.008, 4, 12), rope); b.rotation.x = Math.PI / 2; b.position.y = y; G.add(b); }
  const nail = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 6), expMat(0x6A6A6A, 0.4, 0.8)); nail.rotation.x = Math.PI / 2; nail.position.set(0, 0.06, 0.06); G.add(nail);
  const T = typeof traceCanvas === 'function' ? traceCanvas([[name, '#1A1410', 0.9]], { seed: name.length * 13 }) : null;
  if (T) { const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.16 * T.aspect * 0.35, 0.056), new THREE.MeshBasicMaterial({ map: T.tex, transparent: true, depthWrite: false, color: 0xEFE6D2 })); tag.position.set(0, 0.0, 0.085); G.add(tag); }
  G.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return G;
}
function dressStrawDolls(g, spots) {
  const P = expPlayers(); if (!P.length) return;
  const near = spots.filter((s) => expNearPath(s.x, s.z, 900) && !expNearPath(s.x, s.z, 380)).slice(0, 5);
  EXP.dolls = [];
  near.forEach((s, i) => {
    const p = P[(i * 3 + 1) % P.length], d = strawDoll(p.name);
    const a = Math.atan2(WOODS_PATH[2][0] - s.x, WOODS_PATH[2][1] - s.z);       // 길 쪽을 본다
    d.position.set((s.x + Math.sin(a) * 36) / CM, 1.5 + (i % 2) * 0.25, (s.z + Math.cos(a) * 36) / CM); d.rotation.y = a;
    g.add(d); EXP.dolls.push(d);
    const night = expNight();
    expInfo(d.children[0], { label: '지푸라기 인형', title: '지푸라기 인형', icon: '🪆', room: 'woods', x: s.x, z: s.z, y: 150,
      body: '나무줄기에 못으로 박혀 있다. 가슴께에 이름표 — ' + p.name + '.' + String.fromCharCode(10)
        + (night ? '못은 아직 차갑지 않다. 방금 박은 것 같다.' : '오래된 것이다. 짚이 비에 젖었다 마르기를 여러 번 했다.') });
  });
}

/* ══ 서쪽 — 옛 클럽하우스(실내) ═══════════════════════════ */
function expRoomLight(id, k = 1) {
  const r = M.roomById[id], g = M.roomGroups[id]; if (!r || !g) return;
  const li = new THREE.PointLight(0xFFD8A8, 2.2 * k, 13, 1.4);
  li.position.set(r.cx / CM, (r.h - 70) / CM, r.cz / CM); g.add(li);
  // 천장 등 — 낡은 형광등 갓
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.22), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xFFF1D8).multiplyScalar(expNight() ? 0.9 : 1.4) }));
  lamp.position.set(r.cx / CM, (r.h - 4) / CM, r.cz / CM); g.add(lamp);
}
function dressClubhouse() {
  const P = expPlayers(), O = objMat(), night = expNight(), NL = String.fromCharCode(10);
  for (const id of ['oclobby', 'oclocker', 'ocshower', 'ocdine']) expRoomLight(id, id === 'ocshower' ? 0.6 : 0.85);
  // ── 로비: 프런트 · 소파 · 멈춘 시계 · 창립 회원 명판 · 빈 트로피 선반 ──
  { const r = M.roomById.oclobby, g = M.roomGroups.oclobby; if (r && g) {
    const x0 = r.x0 / CM, x1 = r.x1 / CM, z0 = r.z0 / CM, z1 = r.z1 / CM;
    const desk = rbox(3.6, 1.05, 0.7, 0.03, O.walnutD); desk.position.set((x0 + x1) / 2 - 1.5, 0.52, z0 + 1.2); desk.castShadow = true; g.add(desk);
    block(desk.position.x * CM - 180, desk.position.x * CM + 180, desk.position.z * CM - 35, desk.position.z * CM + 35);
    const bell = cyl(0.04, 0.05, 0.05, O.brass, 12); bell.position.set(desk.position.x + 1.1, 1.08, desk.position.z); g.add(bell);
    expInfo(desk, { label: '프런트', title: '프런트', icon: '🛎', room: 'oclobby', x: desk.position.x * CM, z: desk.position.z * CM, y: 100,
      body: '방명록이 펼쳐진 채 굳어 있다. 마지막 장의 날짜는 1998년 10월.' + NL + (night ? '그 아래에 오늘 날짜로 한 줄이 더 적혀 있다. 글씨가 아직 번진다.' : '종을 누르면 아무도 나오지 않는다. 그래도 한 번쯤 누르고 싶어진다.') });
    // 소파 — 먼지 덮개
    const sofa = rbox(2.2, 0.8, 0.9, 0.12, expMat(0xC9C2B4, 0.95)); sofa.position.set(x1 - 1.6, 0.4, (z0 + z1) / 2 + 2); sofa.rotation.y = -Math.PI / 2; g.add(sofa);
    block(sofa.position.x * CM - 50, sofa.position.x * CM + 50, sofa.position.z * CM - 115, sofa.position.z * CM + 115);
    // 창립 회원 명판 — 서쪽 벽(실제 이름)
    if (P.length) {
      const lines = ['창립 회원 · 1998'].concat(P.slice(0, 8).map((p) => p.name));
      const cv = makeCanvas(512, 640), c = cv.getContext('2d'); c.fillStyle = '#2E2418'; c.fillRect(0, 0, 512, 640); c.strokeStyle = '#B08A4A'; c.lineWidth = 8; c.strokeRect(14, 14, 484, 612);
      c.fillStyle = '#D9B870'; c.textAlign = 'center'; c.font = '700 40px "Noto Serif KR", serif'; c.fillText(lines[0], 256, 80);
      c.font = '400 32px "Noto Serif KR", serif'; lines.slice(1).forEach((t, i) => c.fillText(t, 256, 150 + i * 56));
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.25), new THREE.MeshStandardMaterial({ map: t, roughness: 0.5, metalness: 0.3 }));
      pl.position.set(x0 + 0.03, 1.6, (z0 + z1) / 2 + 2.6); pl.rotation.y = Math.PI / 2; g.add(pl);
      expInfo(pl, { label: '창립 회원 명판', title: '창립 회원 · 1998', icon: '📜', room: 'oclobby', x: pl.position.x * CM, z: pl.position.z * CM, y: 160,
        body: '놋쇠 테두리 명판. 1998년이라면 지금 회원들은 대부분 아이였을 텐데, 이름이 그대로다.' + NL + (night ? '맨 아래 빈칸에 누가 손톱으로 긁어 쓴 자국 — 읽을 수 없다. 아직 다 쓰지 못했다.' : '누가 이 명판을 만들었는지는 아무도 모른다.') });
    }
    // 멈춘 벽시계
    const ck = new THREE.Mesh(new THREE.CircleGeometry(0.28, 32), new THREE.MeshStandardMaterial({ map: expPlate(['6:47'], 256, 256, '#EDE6D6', '#2A2218', 70), roughness: 0.6 }));
    ck.position.set((x0 + x1) / 2, 2.8, z1 - 0.03); ck.rotation.y = Math.PI; g.add(ck);
    expInfo(ck, { label: '벽시계', title: '멈춘 벽시계', icon: '🕰', room: 'oclobby', x: ck.position.x * CM, z: ck.position.z * CM, y: 280,
      body: '6시 47분에 멈춰 있다. 첫 티오프 시각.' + NL + (night ? '… 초침이 한 칸 움직였다. 거꾸로.' : '건전지를 갈아 끼운 흔적이 있는데도 가지 않는다.') });
  } }
  // ── 라커룸: 두 줄 라커(이름표) · 가운데 벤치 ──
  { const r = M.roomById.oclocker, g = M.roomGroups.oclocker; if (r && g) {
    const x0 = r.x0 / CM, x1 = r.x1 / CM, z0 = r.z0 / CM, z1 = r.z1 / CM, lockM = expMat(0x4E5A56, 0.55, 0.4), lockD = expMat(0x5C6A66, 0.5, 0.45);
    EXP.lockers = [];
    let i = 0;
    for (const side of [0, 1]) {
      const x = side ? x1 - 0.32 : x0 + 0.32, face = side ? -1 : 1;
      for (let k = 0; k < 9; k++) {
        const z = z0 + 1.2 + k * 0.62;
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.9, 0.58), lockM); box.position.set(x, 0.95, z); g.add(box);
        const hinge = new THREE.Group(); hinge.position.set(x + face * 0.28, 0.95, z - 0.27);
        const door = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.84, 0.54), lockD); door.position.set(0, 0, 0.27); hinge.add(door);
        // 이름표
        const p = P.length ? P[i % P.length] : null;
        if (p) { const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.08), new THREE.MeshBasicMaterial({ map: expPlate([p.name], 256, 60, '#E8E0CC', '#1A1410', 34) }));
          tag.position.set(face * 0.012, 0.66, 0.27); tag.rotation.y = face > 0 ? Math.PI / 2 : -Math.PI / 2; hinge.add(tag); }
        g.add(hinge);
        EXP.lockers.push({ hinge, face, open: 0, want: (i === 5 && !night) ? 0.5 : 0, name: p && p.name, x, z });
        if (p && k % 3 === 1) expInfo(door, { label: '라커 · ' + p.name, title: p.name + '의 라커', icon: '🔒', room: 'oclocker', x: x * CM, z: z * CM, y: 120,
          body: '녹슨 이름표에 ' + p.name + '.' + NL + (night ? '안에서 무언가가 문을 미는 것 같다. 손을 대면 멈춘다.' : '잠겨 있다. 틈으로 오래된 골프화 한 켤레가 보인다.') });
        i++;
      }
      block((x - 0.3) * CM, (x + 0.3) * CM, (z0 + 0.9) * CM, (z0 + 1.2 + 8 * 0.62 + 0.3) * CM);
    }
    const bench = rbox(0.4, 0.45, 4.6, 0.03, O.oak); bench.position.set((x0 + x1) / 2, 0.23, (z0 + z1) / 2); g.add(bench);
    block(bench.position.x * CM - 22, bench.position.x * CM + 22, bench.position.z * CM - 230, bench.position.z * CM + 230);
  } }
  // ── 샤워실: 칸막이 넷 · 샤워기 · 배수구 ──
  { const r = M.roomById.ocshower, g = M.roomGroups.ocshower; if (r && g) {
    const x0 = r.x0 / CM, x1 = r.x1 / CM, z1 = r.z1 / CM, steel = O.steel, wall = expMat(0x8E968E, 0.4);
    EXP.showers = [];
    for (let k = 0; k < 4; k++) {
      const x = x0 + 1.6 + k * 2.6;
      if (k) { const p = rbox(0.06, 2.0, 1.6, 0.01, wall); p.position.set(x - 1.3, 1.0, z1 - 0.8); g.add(p); block((x - 1.3) * CM - 4, (x - 1.3) * CM + 4, (z1 - 1.6) * CM, z1 * CM); }
      const pipe = cyl(0.015, 0.015, 0.4, steel, 8); pipe.rotation.x = Math.PI / 2; pipe.position.set(x, 2.1, z1 - 0.2); g.add(pipe);
      const head = cyl(0.07, 0.04, 0.05, steel, 16); head.position.set(x, 2.08, z1 - 0.4); g.add(head);
      const drain = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), expMat(0x1A1A1A, 0.4, 0.6)); drain.rotation.x = -Math.PI / 2; drain.position.set(x, 0.006, z1 - 0.6); g.add(drain);
      EXP.showers.push({ x, z: z1 - 0.4, on: false });
    }
    // 물줄기(밤에 켜진다) — 가는 선들
    const sm = new THREE.LineBasicMaterial({ color: 0xBFD6DA, transparent: true, opacity: 0.35 });
    EXP.showerLines = EXP.showers.map((s) => { const pts = []; for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28; pts.push(new THREE.Vector3(s.x + Math.cos(a) * 0.04, 2.05, s.z + Math.sin(a) * 0.04), new THREE.Vector3(s.x + Math.cos(a) * 0.14, 0.02, s.z + Math.sin(a) * 0.14)); }
      const L = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), sm); L.visible = false; g.add(L); return L; });
    const hair = new THREE.Mesh(new THREE.CircleGeometry(0.09, 12), new THREE.MeshBasicMaterial({ color: 0x080606, transparent: true, opacity: 0.85 }));
    hair.rotation.x = -Math.PI / 2; hair.position.set(x0 + 1.6 + 2.6 * 2, 0.008, z1 - 0.62); g.add(hair);
    expInfo(hair, { label: '배수구', title: '배수구', icon: '🕳', room: 'ocshower', x: hair.position.x * CM, z: hair.position.z * CM, y: 10,
      body: '검은 머리카락이 한 움큼 걸려 있다. 길다.' + NL + (night ? '조금씩 안쪽으로 빨려 들어간다. 아래에서 누가 당기는 것처럼.' : '이 샤워실은 20년 넘게 쓰지 않았다.') });
  } }
  // ── 식당: 테이블 넷 · 의자 · 차려진 자리의 스코어카드 ──
  { const r = M.roomById.ocdine, g = M.roomGroups.ocdine; if (r && g) {
    const x0 = r.x0 / CM, x1 = r.x1 / CM, z0 = r.z0 / CM, z1 = r.z1 / CM, cloth = expMat(0xD8D0C0, 0.95), wood = O.walnut;
    EXP.chairs = [];
    let ti = 0;
    for (const fx of [0.3, 0.7]) for (const fz of [0.32, 0.7]) {
      const x = x0 + (x1 - x0) * fx, z = z0 + (z1 - z0) * fz;
      const top = cyl(0.62, 0.62, 0.05, cloth, 28); top.position.set(x, 0.76, z); g.add(top);
      const leg = cyl(0.05, 0.2, 0.74, wood, 10); leg.position.set(x, 0.37, z); g.add(leg);
      block(x * CM - 65, x * CM + 65, z * CM - 65, z * CM + 65);
      for (let c = 0; c < 4; c++) {
        const a = c * Math.PI / 2 + 0.3, cx = x + Math.sin(a) * 0.95, cz = z + Math.cos(a) * 0.95;
        const ch = new THREE.Group(); ch.position.set(cx, 0, cz); ch.rotation.y = a + Math.PI;
        const seat = rbox(0.44, 0.05, 0.44, 0.01, wood); seat.position.y = 0.46; ch.add(seat);
        const back = rbox(0.44, 0.5, 0.04, 0.01, wood); back.position.set(0, 0.72, -0.21); ch.add(back);
        for (const sx of [-0.19, 0.19]) for (const sz of [-0.19, 0.19]) { const l = cyl(0.018, 0.018, 0.46, wood, 6); l.position.set(sx, 0.23, sz); ch.add(l); }
        g.add(ch); EXP.chairs.push({ ch, x: cx, z: cz, a, rock: 0 });
      }
      ti++;
    }
    // 차려진 자리 — 접시 · 잔 · 스코어카드(최근 라운드)
    const A = M.archive || {}, rd = (A.rounds || [])[0];
    const tx = x0 + (x1 - x0) * 0.7, tz = z0 + (z1 - z0) * 0.32;
    const plate = cyl(0.13, 0.11, 0.02, expMat(0xF2EFE8, 0.3), 20); plate.position.set(tx - 0.2, 0.8, tz + 0.3); g.add(plate);
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.12), new THREE.MeshStandardMaterial({ map: expPlate([rd ? (rd.course || rd.course_name || '스코어카드') : '스코어카드', rd ? String(rd.played_at || '').slice(0, 10) : ''], 256, 140, '#F2EDE0', '#2A2218', 30), roughness: 0.8 }));
    card.rotation.x = -Math.PI / 2; card.position.set(tx + 0.18, 0.79, tz + 0.25); g.add(card);
    expInfo(card, { label: '스코어카드', title: '식탁 위의 스코어카드', icon: '📝', room: 'ocdine', x: tx * CM, z: tz * CM, y: 80,
      body: (rd ? (rd.course || rd.course_name || '') + ' · ' + String(rd.played_at || '').slice(0, 10) + ' 라운드 카드.' : '스코어카드 한 장.') + NL
        + (night ? '18번 홀 칸에만 숫자가 없다. 연필이 카드 옆에 놓여 있다 — 아직 따뜻하다.' : '이 식당이 문을 닫은 건 1998년인데, 카드는 최근 것이다.') });
  } }
  // 지붕 — 네 방을 덮는 평지붕(바깥에서 보인다)
  { const g = M.roomGroups.woods; if (g) {
    // 지붕은 방 껍데기가 만든다(world.js) — 여기선 간판 · 외벽 때만
    expGrime(g);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.7), new THREE.MeshStandardMaterial({ map: expPlate(['CLUBHOUSE'], 512, 86, '#2A2620', '#BFA86A', 56), roughness: 0.7, metalness: 0.4 }));
    sg.position.set(-61.9, 3.45, 24); sg.rotation.y = Math.PI / 2; g.add(sg); } }
}

/** 외벽 때 — 처마 밑으로 흘러내린 빗물 자국 · 밑동의 이끼(네 면) */
function expGrime(g) {
  const W = 1024, H = 160, cv = makeCanvas(W, H), c = cv.getContext('2d'), R = rnd(66);
  for (let i = 0; i < 140; i++) { const x = R() * W, w = 2 + R() * 9, L = 20 + R() * 120, a = 0.06 + R() * 0.22;
    const gr = c.createLinearGradient(0, 0, 0, L); gr.addColorStop(0, 'rgba(24,22,18,' + a + ')'); gr.addColorStop(1, 'rgba(24,22,18,0)'); c.fillStyle = gr; c.fillRect(x, 0, w, L); }
  for (let i = 0; i < 260; i++) { const x = R() * W, y = H - R() * 34, r = 3 + R() * 10; c.fillStyle = 'rgba(' + (40 + R() * 20 | 0) + ',' + (58 + R() * 24 | 0) + ',28,' + (0.15 + R() * 0.3) + ')'; c.beginPath(); c.arc(x, y, r, 0, 6.28); c.fill(); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  // 클럽하우스 외곽 — x −86 ~ −62m · z 18 ~ 42m(벽 바깥면 + 2cm)
  for (const [x, z, ry, w] of [[-61.86, 30, Math.PI / 2, 24], [-86.14, 30, -Math.PI / 2, 24], [-74, 17.86, Math.PI, 24], [-74, 42.14, 0, 24]]) {
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, 3.8), m); pl.position.set(x, 1.9, z); pl.rotation.y = ry; pl.renderOrder = 2; g.add(pl);
  }
}

/* ══ 동쪽 — 드라이빙 레인지 · 주차장 ═════════════════════ */
const RANGE = { bays: [], x: 93.5 };
function dressRange() {
  const g = M.roomGroups.range; if (!g) return;
  const O = objMat(), R = rnd(77), night = expNight(), NL = String.fromCharCode(10);
  const bx = RANGE.x, z0 = 4, z1 = 42, n = 8;
  // 지붕 덮인 타석 — 기둥 · 지붕 · 뒷벽 · 칸막이
  const roofM = expMat(0x2E3A34, 0.7), postM = O.steelD, matM = expMat(0x2F6A3A, 0.95);
  const parts = [];
  for (let i = 0; i <= n; i++) { const z = z0 + (z1 - z0) * i / n; parts.push(boxAt(0.14, 3.2, 0.14, bx + 1.6, 1.6, z), boxAt(0.14, 3.2, 0.14, bx - 1.6, 1.6, z)); if (i > 0 && i < n) parts.push(boxAt(2.6, 1.4, 0.05, bx, 0.7, z)); }
  g.add(new THREE.Mesh(mergeGeos(parts), postM));
  const roof = rbox(4.2, 0.18, z1 - z0 + 1, 0.03, roofM); roof.position.set(bx, 3.3, (z0 + z1) / 2); roof.castShadow = true; g.add(roof);
  const back = rbox(0.14, 2.6, z1 - z0, 0.02, expMat(0x6A6458, 0.85)); back.position.set(bx - 1.7, 1.3, (z0 + z1) / 2); g.add(back);
  block((bx - 1.8) * CM, (bx - 1.6) * CM, z0 * CM, z1 * CM);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.7), new THREE.MeshStandardMaterial({ map: expPlate(['DRIVING RANGE', '드라이빙 레인지'], 512, 96, '#1E2A24', '#E3C567', 40), roughness: 0.6 }));
  sign.position.set(bx + 1.75, 2.95, (z0 + z1) / 2); sign.rotation.y = Math.PI / 2; g.add(sign);
  // 타석 매트 · 티 · 공 바구니
  const ballG = new THREE.SphereGeometry(0.022, 8, 6), ballM = expMat(0xF4F2EC, 0.35);
  RANGE.bays = [];
  for (let i = 0; i < n; i++) {
    const z = z0 + (z1 - z0) * (i + 0.5) / n;
    const mat = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.5), matM); mat.rotation.x = -Math.PI / 2; mat.position.set(bx + 0.7, 0.012, z); g.add(mat);
    const tee = cyl(0.008, 0.008, 0.05, expMat(0xD84A2A, 0.6), 6); tee.position.set(bx + 0.85, 0.035, z); g.add(tee);
    const ball = new THREE.Mesh(ballG, ballM); ball.position.set(bx + 0.85, 0.08, z); g.add(ball);
    const bk = cyl(0.17, 0.13, 0.2, expMat(0x2A2A2A, 0.6), 14); bk.position.set(bx - 0.4, 0.1, z + 0.45); g.add(bk);
    const inBk = new THREE.Mesh(new THREE.CircleGeometry(0.15, 14), expMat(0xE8E6E0, 0.5)); inBk.rotation.x = -Math.PI / 2; inBk.position.set(bx - 0.4, 0.19, z + 0.45); g.add(inBk);
    RANGE.bays.push({ x: bx + 0.85, z, ball, teed: true });
  }
  // 과녁 그린 · 거리 깃발 · 흩어진 공
  const tg = [[115, 14, 3.2, '50'], [130, 30, 4.0, '100'], [145, 18, 4.6, '150'], [125, 46, 3.4, '80']];
  tg.forEach(([x, z, rr, yd], i) => {
    const gm = new THREE.Mesh(new THREE.CircleGeometry(rr, 36), expMat(0x7AB85A, 0.85)); gm.rotation.x = -Math.PI / 2; gm.position.set(x, 0.01, z); g.add(gm);
    const pole = cyl(0.02, 0.02, 2.2, O.white, 8); pole.position.set(x, 1.1, z); g.add(pole);
    if (typeof addFlag === 'function') addFlag(g, x + 0.02, 2.0, z, [0xC8262A, 0xF2C04A, 0x2E5FA8, 0xF4F0EA][i], 0.5, 0.32);
    const ys = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshStandardMaterial({ map: expPlate([yd + ' Y'], 256, 128, '#F4F0E6', '#1E2A24', 64), roughness: 0.7 }));
    ys.position.set(x - rr - 0.4, 0.5, z); ys.rotation.y = -Math.PI / 2; g.add(ys);
  });
  const scat = new THREE.InstancedMesh(ballG, ballM, 420), m4 = new THREE.Matrix4();
  for (let i = 0; i < 420; i++) { m4.makeTranslation(100 + R() * 48, 0.022, 2 + R() * 42); scat.setMatrixAt(i, m4); }
  g.add(scat);
  // 그물 기둥 — 동쪽 끝
  const netParts = []; for (let z = -6; z <= 44; z += 10) netParts.push(boxAt(0.25, 14, 0.25, 149, 7, z));
  g.add(new THREE.Mesh(mergeGeos(netParts), O.steelD));
  const net = new THREE.Mesh(new THREE.PlaneGeometry(50, 13), new THREE.MeshBasicMaterial({ color: 0x1A1E1C, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
  net.position.set(149, 7.4, 19); net.rotation.y = Math.PI / 2; g.add(net);
  block(14880, 14940, -800, 4600, 1500);
  // 공 자판기
  const disp = rbox(0.9, 1.7, 0.7, 0.04, expMat(0xB8342A, 0.5)); disp.position.set(bx - 0.6, 0.85, z0 - 1.6); g.add(disp);
  const dl = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.3), new THREE.MeshBasicMaterial({ map: expPlate(['BALLS', '1 바구니 · 50개'], 256, 110, '#F4F0E6', '#8A1E18', 40) }));
  dl.position.set(bx - 0.6, 1.3, z0 - 1.24); g.add(dl);
  block((bx - 1.05) * CM, (bx - 0.15) * CM, (z0 - 1.95) * CM, (z0 - 1.25) * CM);
  expInfo(disp, { label: '공 자판기', title: '공 자판기', icon: '⛳', room: 'range', x: (bx - 0.6) * CM, z: (z0 - 1.6) * CM, y: 120,
    body: '동전을 넣으면 바구니에 공이 쏟아진다.' + NL + (night ? '전원이 꺼져 있는데 안에서 공 구르는 소리가 난다.' : '오늘은 공이 잘 나온다.') });
  // 공 줍는 카트 — 낮엔 서 있다 · 밤엔 혼자 돈다(앞에 철망 바구니)
  { const c = new THREE.Group();
    const body = rbox(1.4, 0.7, 2.0, 0.08, expMat(0xE8C23A, 0.5)); body.position.y = 0.6; c.add(body);
    const cage = rbox(1.5, 1.0, 1.4, 0.02, new THREE.MeshStandardMaterial({ color: 0x3A3A3A, roughness: 0.5, metalness: 0.6, wireframe: true })); cage.position.set(0, 1.35, 0.2); c.add(cage);
    const pick = rbox(3.2, 0.15, 0.5, 0.02, O.steelD); pick.position.set(0, 0.12, -1.6); c.add(pick);
    for (const sx of [-0.6, 0.6]) for (const sz of [-0.6, 0.7]) { const w = cyl(0.25, 0.25, 0.18, O.black, 16); w.rotation.z = Math.PI / 2; w.position.set(sx, 0.25, sz); c.add(w); }
    const hl = new THREE.Mesh(new THREE.CircleGeometry(0.09, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xFFF2D0).multiplyScalar(night ? 3 : 0.6) }));
    hl.position.set(0, 0.75, -1.01); hl.rotation.y = Math.PI; c.add(hl);
    c.position.set(118, 0, 36); c.rotation.y = 0.6; c.traverse((o) => { if (o.isMesh) o.castShadow = true; }); g.add(c);
    RANGE.picker = { c, t: 0, x: 118, z: 36, yaw: 0.6 }; }
}
function dressParking() {
  const g = M.roomGroups.parking; if (!g) return;
  const night = expNight(), NL = String.fromCharCode(10);
  // 주차 선
  const lineM = new THREE.MeshBasicMaterial({ color: 0xD8D4C8 }), L = [];
  for (let i = 0; i <= 10; i++) L.push(boxAt(0.1, 0.01, 5.0, 96 + i * 3, 0.012, 52.5), boxAt(0.1, 0.01, 5.0, 96 + i * 3, 0.012, 61.5));
  g.add(new THREE.Mesh(mergeGeos(L), lineM));
  const cols = [0x1C2430, 0xE8E6E0, 0x6A1E22, 0x2E3A30, 0x8A8E92, 0x1A1A1C];
  RANGE.cars = [];
  [[97.5, 52.5], [103.5, 52.5], [109.5, 52.5], [118.5, 52.5], [100.5, 61.5], [112.5, 61.5], [121.5, 61.5]].forEach(([x, z], i) => {
    const c = sedan(cols[i % cols.length]); c.position.set(x, 0, z); c.rotation.y = i < 4 ? Math.PI / 2 : -Math.PI / 2; g.add(c);
    block(x * CM - 100, x * CM + 100, z * CM - 235, z * CM + 235);
    RANGE.cars.push({ c, x, z });
  });
  if (typeof lampPosts === 'function') lampPosts(g, [[95, 57], [110, 57], [125, 57], [140, 57]]);
  // 밤 — 맨 끝 차 한 대: 비상등이 깜빡이고 운전석에 누가 앉아 있다(유리를 조금 맑게)
  const car = RANGE.cars[3];
  if (car) {
    car.c.traverse((o) => { if (o.isMesh && o.material && o.material.color && o.material.color.getHex() === 0x1A2228) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.42; o.material.depthWrite = false; } });
    const blink = []; for (const sx of [-2.3, 2.3]) for (const sz of [-0.7, 0.7]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: 0xFF9A2A })); b.position.set(sx, 0.75, sz); b.visible = false; car.c.add(b); blink.push(b); }
    RANGE.blink = blink;
    expInfo(car.c.children[0], { label: '주차된 차', title: '주차된 차', icon: '🚗', room: 'parking', x: car.x * CM, z: car.z * CM, y: 100,
      body: night ? '비상등이 켜진 채다. 보닛은 차갑다. 오래 서 있었다.' + NL + '운전석 유리에 안쪽에서 찍힌 손자국.' : '먼지가 앉은 차. 와이퍼에 주차 위반 딱지가 몇 장 겹쳐 꽂혀 있다.' });
  }
}

/* ── 밤의 일들 ─────────────────────────────────────────── */
function expSnd(kind, xm, zm, vol = 1) {
  const c = typeof SND !== 'undefined' && SND.ctx; if (!c || !SND.on) return;
  const d = Math.hypot(xm - M.pos.x, zm - M.pos.z), far = kind === 'nail' ? 60 : kind === 'shower' ? 14 : 30;
  if (d > far) return;
  const k = vol * clamp(1 - d / far, 0.05, 1), pan = typeof sndPan === 'function' ? sndPan(xm, zm) : 0, t0 = c.currentTime + 0.01;
  const noise = (len, f, q, g0, type, at, curve = 3) => {
    const N = Math.floor(c.sampleRate * len), b = c.createBuffer(1, N, c.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < N; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / N, curve);
    const s = c.createBufferSource(); s.buffer = b; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const g = c.createGain(); g.gain.value = g0 * k; s.connect(fl); fl.connect(g); sndPanned(g, pan, 0.5); s.start(at);
  };
  if (kind === 'nail') { noise(0.05, 2200, 2, 0.55, 'bandpass', t0, 6); const o = c.createOscillator(), og = c.createGain(); o.frequency.setValueAtTime(820, t0); o.frequency.exponentialRampToValueAtTime(600, t0 + 0.08); sndEnv(og, t0, 0.001, 0.12 * k, 0.12); o.connect(og); sndPanned(og, pan, 0.6); o.start(t0); o.stop(t0 + 0.15); }
  else if (kind === 'clang') { noise(0.25, 900, 0.8, 0.5, 'bandpass', t0, 2); const o = c.createOscillator(), og = c.createGain(); o.type = 'triangle'; o.frequency.value = 310; sndEnv(og, t0, 0.002, 0.14 * k, 0.6); o.connect(og); sndPanned(og, pan, 0.5); o.start(t0); o.stop(t0 + 0.7); }
  else if (kind === 'creak') { const o = c.createOscillator(), og = c.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(140, t0); o.frequency.linearRampToValueAtTime(95, t0 + 0.9); const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 600; f.Q.value = 6; sndEnv(og, t0, 0.05, 0.06 * k, 0.85); o.connect(f); f.connect(og); sndPanned(og, pan, 0.5); o.start(t0); o.stop(t0 + 1.0); }
  else if (kind === 'shower') noise(2.2, 3000, 0.4, 0.12, 'highpass', t0, 0.3);
  else if (kind === 'swing') { noise(0.2, 1200, 0.6, 0.18, 'bandpass', t0, 1); noise(0.03, 2600, 1.2, 0.8, 'bandpass', t0 + 0.22, 5); }
  else if (kind === 'horn') { const o = c.createOscillator(), og = c.createGain(); o.type = 'square'; o.frequency.value = 415; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400; sndEnv(og, t0, 0.01, 0.05 * k, 0.5); o.connect(f); f.connect(og); sndPanned(og, pan, 0.3); o.start(t0); o.stop(t0 + 0.55); }
}
const EXP_EV = {
  /** 숲 — 깊은 데서 못 박는 소리. 다가가면 멎고, 그 자리 나무에 새 인형(이름표 없음 — '방문자') */
  nail() {
    const g = M.roomGroups.woods; if (!g) return null;
    const P = { x: M.pos.x * CM, z: M.pos.z * CM };
    let sx = 0, sz = 0, ok = false;
    for (let k = 0; k < 40 && !ok; k++) { sx = -9300 + Math.random() * 4800; sz = -500 + Math.random() * 6800; ok = Math.hypot(sx - P.x, sz - P.z) > 1800 && Math.hypot(sx - P.x, sz - P.z) < 3600 && !expNearPath(sx, sz, 500) && !(sx > -8900 && sx < -5900 && sz > 1500 && sz < 4500); }
    if (!ok) return null;
    let t = 0, n = 0;
    return { step(dt) {
      t += dt;
      const d = Math.hypot(sx - M.pos.x * CM, sz - M.pos.z * CM);
      if (d < 800) {
        if (!this.done) { this.done = true; const doll = strawDoll('방문자'); doll.position.set(sx / CM, 1.55, sz / CM); doll.rotation.y = Math.atan2(M.pos.x * CM - sx, M.pos.z * CM - sz); g.add(doll);
          expInfo(doll.children[0], { label: '지푸라기 인형', title: '새 지푸라기 인형', icon: '🪆', room: 'woods', x: sx, z: sz, y: 150, body: '방금 박은 못. 이름표에는 — 방문자.' + String.fromCharCode(10) + '짚 사이에 머리카락 몇 올이 엮여 있다. 내 머리카락 색이다.' });
          if (typeof hauntRec === 'function') hauntRec('nail'); if (typeof scoreHush === 'function') scoreHush(10); }
        return t < 3 || false;
      }
      if (t > 0.62 + (n % 3 === 2 ? 0.9 : 0)) { t = 0; n++; expSnd('nail', sx / CM, sz / CM, 1); }
      return n < 60;
    } };
  },
  /** 라커 — 내가 라커룸에 있으면 문이 하나씩 열린다(끼익 · 쾅) */
  locker() {
    if (!EXP.lockers || !EXP.lockers.length) return null;
    const order = EXP.lockers.slice().sort(() => Math.random() - 0.5).slice(0, 4 + Math.floor(Math.random() * 3));
    let i = 0, t = 0;
    return { step(dt) {
      t += dt;
      if (M.room && M.room.id !== 'oclocker') { for (const L of order) L.want = 0; return false; }
      if (t > 1.1 && i < order.length) { t = 0; const L = order[i++]; L.want = 1.2; expSnd('creak', L.x, L.z, 1); setTimeout(() => expSnd('clang', L.x, L.z, 0.9), 700); if (i === 2 && typeof hauntRec === 'function') hauntRec('lockers'); }
      if (i >= order.length && t > 6) { for (const L of order) { L.want = 0; } expSnd('clang', order[0].x, order[0].z, 1.2); return false; }
      return true;
    } };
  },
  /** 레인지 — 빈 타석에서 공이 날아간다(스윙 소리 · 공) */
  range() {
    const B = RANGE.bays.filter((b) => b.teed); if (!B.length) return null;
    const b = pickOf(B);
    if (!hauntView(b.x, 0.3, b.z).on) return null;
    expSnd('swing', b.x, b.z, 1.2);
    const g = M.roomGroups.range || M.scene;
    let t = 0;
    return { step(dt) {
      t += dt;
      if (t > 0.22 && !this.hit) {
        this.hit = true; b.teed = false; b.ball.visible = false;
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshBasicMaterial({ color: 0xFFFFFF })); g.add(ball);
        (ACT.balls || (ACT.balls = [])).push({ b: ball, p0: new THREE.Vector3(b.x, 0.08, b.z), vx: 18 + Math.random() * 6, vz: (Math.random() - 0.5) * 3, vy: 12, t: 0, T: 2.4 });
        if (typeof hauntRec === 'function') hauntRec('range');
      }
      return t < 1;
    } };
  },
};
/** 매 프레임 — 밤의 일 · 라커 문 · 샤워 · 공 줍는 카트 · 비상등 · 다시 올라온 공 */
function stepExpand(dt) {
  if (!M.entered) return;
  const night = expNight(), R = M.room;
  EXP.t = (EXP.t || 0) + dt;
  // 라커 문 — 원하는 만큼 천천히
  if (EXP.lockers) for (const L of EXP.lockers) { if (Math.abs(L.open - L.want) > 0.002) { L.open += (L.want - L.open) * Math.min(1, dt * 3.2); L.hinge.rotation.y = -L.face * L.open; } }
  // 샤워 — 밤에 샤워실에 들어오면 하나씩 켜진다
  if (EXP.showerLines && night) {
    const inS = R && R.id === 'ocshower';
    EXP.showerT = (EXP.showerT || 0) + dt;
    if (inS && EXP.showerT > 3) { EXP.showerT = 0; const k = EXP.showerLines.findIndex((l) => !l.visible); if (k >= 0) { EXP.showerLines[k].visible = true; if (k === 1 && typeof hauntRec === 'function') hauntRec('shower'); } }
    if (EXP.showerLines.some((l) => l.visible) && (EXP.showerSnd = (EXP.showerSnd || 0) - dt) <= 0) { EXP.showerSnd = 2; const s = EXP.showers[0]; expSnd('shower', s.x, s.z, 1); }
  }
  // 공 줍는 카트 — 밤엔 혼자 지그재그로
  const pk = RANGE.picker;
  if (pk && night) {
    pk.t += dt;
    const tx = 104 + 40 * (0.5 + 0.5 * Math.sin(pk.t * 0.05)), tz = 4 + 40 * (0.5 + 0.5 * Math.sin(pk.t * 0.13));
    const d = Math.hypot(M.pos.x - pk.x, M.pos.z - pk.z), go = d > 6 ? 1 : 0;
    const want = Math.atan2(-(tx - pk.x), -(tz - pk.z));
    pk.yaw += npcAng(want - pk.yaw) * Math.min(1, dt * 0.8);
    pk.x -= Math.sin(pk.yaw) * dt * 1.6 * go; pk.z -= Math.cos(pk.yaw) * dt * 1.6 * go;
    pk.c.position.set(pk.x, 0, pk.z); pk.c.rotation.y = pk.yaw;
  }
  // 비상등
  if (RANGE.blink && night) { const on = (EXP.t % 1.2) < 0.6; for (const b of RANGE.blink) b.visible = on; }
  // 밤 — 다시 올라와 있는 공(눈을 돌린 사이)
  if (night && RANGE.bays.length) for (const b of RANGE.bays) if (!b.teed && !b.occupied && !hauntView(b.x, 0.3, b.z).on) { b.teed = true; b.ball.visible = true; }
  // 밤의 일 — 하나씩
  for (const k in EXP.cool) EXP.cool[k] -= dt;
  if (EXP.ev) { let keep = false; try { keep = EXP.ev.step(dt); } catch (e) { keep = false; } if (!keep) EXP.ev = null; return; }
  if (!night || !R || M.openId || (typeof HAUNT !== 'undefined' && HAUNT.ev)) return;
  const start = (id, cd) => { const e = EXP_EV[id](); if (e) { EXP.ev = e; EXP.cool[id] = cd; } else EXP.cool[id] = 6; };
  if (R.zone === 'west' && R.outdoor && EXP.cool.nail <= 0 && Math.random() < dt / 10) start('nail', 150 + Math.random() * 90);
  else if (R.id === 'oclocker' && EXP.cool.locker <= 0 && Math.random() < dt / 6) start('locker', 90 + Math.random() * 60);
  else if (R.zone === 'east' && EXP.cool.range <= 0 && Math.random() < dt / 8) start('range', 25 + Math.random() * 30);
  // 식당 — 등 돌린 사람(그 사람)이 의자에 앉아 있다. 다가가면 사라지고 의자만 흔들린다
  if (R.id === 'ocdine' && EXP.chairs && !EXP.diner && typeof hauntShade === 'function' && Math.random() < dt / 5) {
    const c = EXP.chairs.slice().sort((a, b) => Math.hypot(b.x - M.pos.x, b.z - M.pos.z) - Math.hypot(a.x - M.pos.x, a.z - M.pos.z))[0];
    if (c && Math.hypot(c.x - M.pos.x, c.z - M.pos.z) > 4 && shadeAt(c.x * CM, c.z * CM, R)) {
      const v = HAUNT.shade; v.root.rotation.y = c.a + Math.PI;                       // 의자 뒤에 서서 식탁을 내려다본다(나에겐 등)
      EXP.diner = { c, t: 0 };
    }
  }
  if (EXP.diner) {
    const D = EXP.diner; D.t += dt;
    const d = Math.hypot(D.c.x - M.pos.x, D.c.z - M.pos.z);
    if (d < 2.6 || (R && R.id !== 'ocdine')) { if (typeof shadeHide === 'function') shadeHide(); D.c.rock = 1.6; expSnd('creak', D.c.x, D.c.z, 0.8); if (d < 2.6 && typeof hauntRec === 'function') hauntRec('diner'); EXP.diner = null; EXP.dinerCool = 120; }
  }
  if (EXP.chairs) for (const c of EXP.chairs) if (c.rock > 0) { c.rock -= dt; c.ch.rotation.z = Math.sin(c.rock * 9) * 0.05 * c.rock; if (c.rock <= 0) c.ch.rotation.z = 0; }
}

/** 장면을 다 지은 뒤(museum3d buildScene) */
function buildExpand() {
  try { dressWoods(); } catch (e) { console.warn('woods', e); }
  try { dressClubhouse(); } catch (e) { console.warn('clubhouse', e); }
  try { dressRange(); } catch (e) { console.warn('range', e); }
  try { dressParking(); } catch (e) { console.warn('parking', e); }
}
/* ── 드라이빙 레인지 사람(낮) — 타석에 서서 스윙 셋 · 쉬고 · 또 ── */
function rangeStep(M, n, dt) {
  if (!n.rs) {
    const b = RANGE.bays[n.cast.bay % Math.max(1, RANGE.bays.length)];
    if (!b) return;
    n.rs = { b, st: 'swing', k: 0 };
  }
  const S = n.rs, b = S.b;
  n.x = (b.x - 0.05) * CM; n.z = (b.z - 0.34) * CM; n.fy = 0; n.curV = 0; n.walkK = 0;
  if (b.ball.visible) { b.ball.visible = false; b.occupied = true; }          // 친 공은 actBall 이 날린다
  n.yaw = 0;                                     // 몸의 왼쪽(+x)이 레인지
  n.state = 'golf';
  S.k += dt;
  if (S.st === 'swing' && S.k > 4.4 * 3 + 0.5) { S.st = 'rest'; S.k = 0; }
  else if (S.st === 'rest' && S.k > 6 + Math.random() * 4) { S.st = 'swing'; S.k = 0; }
  const P = { x: M.pos.x * CM, z: M.pos.z * CM }; n.pd = Math.hypot(P.x - n.x, P.z - n.z);
}
const rangeAct = (n) => (n.rs && n.rs.st === 'swing' ? 'swing' : 'front');
