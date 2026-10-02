/* ══════════════════════════════════════════════════════════
   흔적 — 전시관 밖에 남은 선수들의 자취(v116)
   ══════════════════════════════════════════════════════════
   전시관 밖에서도 기록이 따라다닌다(실제 아카이브에서 만든다):
     · 외벽 낙서 — 바깥에 면한 막힌 벽(창 · 문 · 유리는 피한다)에 매직 · 분필 글씨. 베스트 · 버디 · 우승 · 개근 · 하이라이트 영상 · 자주 간 코스
     · 이름 쓴 공 — 티박스 · 그린 · 벙커 · 카트길 · 연습 그린에 떨어진 공. 매직으로 이름, 조사하면 그 사람의 그날 기록
     · 바를 정(正) — 연습장 쪽 벽에 멤버별 라운드 수를 正 으로 그어 세어 둔 것
     · 기념 벤치 — 조각 정원, 가장 많이 나온 사람의 이름이 새겨진 명패
     · 티박스 메모 — 지난 라운드 1위와 타수
   낮엔 동호회다운 장난 · 밤엔 같은 기록이 찝찝하게(글씨가 하나 더 겹쳐 써 있다). 여섯 개 넘게 읽으면 밤의 기록 '흔적을 따라' */
const TRACE = { read: new Set(), built: false };

function traceData() {
  const A = M.archive || {}, P = (A.players || []).filter((p) => p && p.name);
  const by = (f) => P.slice().sort((a, b) => f(b) - f(a))[0];
  const best = P.filter((p) => p.best).sort((a, b) => a.best - b.best)[0];
  const rounds = (A.rounds || []).slice().sort((a, b) => String(b.played_at).localeCompare(String(a.played_at)));
  const cnt = {}; for (const r of rounds) if (r.course) cnt[r.course] = (cnt[r.course] || 0) + 1;
  const course = (Object.entries(cnt).sort((a, b) => b[1] - a[1])[0] || ['18번 홀'])[0];
  return { P, best, bird: by((p) => p.birdies || 0), win: by((p) => p.roundWins || 0), att: by((p) => p.roundsCompleted || 0),
    rounds, course, clip: (A.clips || []).find((c) => c.title && c.players), last: rounds[0] };
}
const traceNight = () => typeof NIGHT === 'undefined' || NIGHT.on;
const pick2 = (arr, R) => arr[Math.floor(R() * arr.length)];

/** 손글씨 — 글자마다 기울기 · 크기 · 높이를 조금씩 흔든다. lines: [[글, 색, 크기배율]] */
function traceCanvas(lines, opt) {
  const W = 640, H = 120 + lines.length * 90, cv = makeCanvas(W, H), c = cv.getContext('2d'), R = rnd(opt.seed || 7);
  c.textBaseline = 'middle';
  let y = 70;
  for (const [txt, col, k] of lines) {
    const size = 56 * (k || 1);
    c.font = (opt.chalk ? '600 ' : 'bold ') + size + 'px sans-serif';
    let w = 0; for (const ch of txt) w += c.measureText(ch).width * 0.96;
    let x = Math.max(20, (W - w) / 2 + (R() - 0.5) * 30);
    for (const ch of txt) {
      const cw = c.measureText(ch).width * 0.96;
      c.save(); c.translate(x + cw / 2, y + (R() - 0.5) * 8); c.rotate((R() - 0.5) * 0.16 + (opt.slant || 0)); c.scale(1 + (R() - 0.5) * 0.12, 1 + (R() - 0.5) * 0.16);
      if (opt.chalk) { c.globalAlpha = 0.75; c.fillStyle = col; c.fillText(ch, -cw / 2, 0); c.globalAlpha = 0.35; c.fillText(ch, -cw / 2 + 1.5, 1.5); }
      else { c.lineJoin = 'round'; c.lineWidth = size * 0.11; c.strokeStyle = col; c.strokeText(ch, -cw / 2, 0); c.fillStyle = col; c.fillText(ch, -cw / 2, 0); }
      c.restore();
      x += cw;
    }
    // 흘러내린 자국(빨간 매직 · 밤)
    if (opt.drip && col.startsWith('#7')) { c.fillStyle = col; for (let i = 0; i < 4; i++) { const dx = 60 + R() * (W - 120); c.fillRect(dx, y + size * 0.3, 3, 20 + R() * 50); } }
    y += 90 * (k || 1);
  }
  if (opt.chalk) { const im = c.getImageData(0, 0, W, H); for (let i = 3; i < im.data.length; i += 4) if (Math.random() < 0.25) im.data[i] *= 0.4; c.putImageData(im, 0, 0); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return { tex: t, aspect: W / H };
}
/** 바깥에 면한 막힌 벽 — 칸 목록(실내 한쪽 · 바깥 한쪽 · 1층 높이를 덮는 벽) */
function traceWalls() {
  const out = [];
  for (const c of M.cells || []) {
    if (c.type !== 'wall' || !c.neg || !c.pos) continue;
    const o = c.neg.outdoor && !c.pos.outdoor ? c.neg : c.pos.outdoor && !c.neg.outdoor ? c.pos : null;
    if (!o || o.lv !== 0 || o.terrain || c.y0 > 20 || c.y1 < 260 || c.a1 - c.a0 < 220) continue;
    out.push({ c, o, sign: o === c.neg ? -1 : 1 });
  }
  return out;
}
/** 광선을 맞힐 것 — 보통 메시만(스프라이트 · 뼈 있는 사람 · 인스턴스는 빼고). 한 번 모아 둔다 */
function traceSolids() {
  if (TRACE.solids) return TRACE.solids;
  const L = [];
  M.scene.traverse((o) => { if (o.isMesh && !o.isSkinnedMesh && !o.isInstancedMesh && !o.isSprite && o.geometry) L.push(o); });
  return (TRACE.solids = L);
}
/** 벽에 붙이기 — 칸 c 의 a 지점 · 바깥쪽에 */
function traceOnWall(w, a, y, txt, opt, info) {
  const { c, o, sign } = w, g = M.roomGroups[o.id]; if (!g) return;
  const T = traceCanvas(txt, opt), h = opt.h || 0.62, wd = h * T.aspect;
  const m = new THREE.MeshStandardMaterial({ map: T.tex, transparent: true, depthWrite: false, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2 });
  m.userData.out = true; m.userData.noBatch = true;
  if (M.envOut) { m.envMap = M.envOut; m.envMapIntensity = 0.4; }
  if (typeof floodPatch === 'function') floodPatch(m);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(wd, h), m);
  // 실제 겉면 — 벽 두께(24cm) · 외장재까지 있어 경계선에 붙이면 벽 속에 묻힌다 → 바깥 2m 에서 벽 쪽으로 쏘아 맞은 자리 2cm 앞
  const nrm = c.ax === 'v' ? new THREE.Vector3(sign, 0, 0) : new THREE.Vector3(0, 0, sign);
  const base = c.ax === 'v' ? new THREE.Vector3(c.coord / CM, o.y0 / CM + y, a / CM) : new THREE.Vector3(a / CM, o.y0 / CM + y, c.coord / CM);
  const ray = new THREE.Raycaster(base.clone().addScaledVector(nrm, 2), nrm.clone().negate(), 0, 3);
  const hits = ray.intersectObjects(traceSolids(), false).filter((h) => h.object.material && h.object.material.visible !== false && !h.object.material.transparent);
  const surf = hits.length ? hits[0].distance : 2 - (WT / 2) / CM;
  const at = base.clone().addScaledVector(nrm, 2 - surf + 0.02);
  mesh.position.set(at.x, y, at.z);
  if (c.ax === 'v') mesh.rotation.y = sign < 0 ? -Math.PI / 2 : Math.PI / 2;
  else mesh.rotation.y = sign < 0 ? Math.PI : 0;
  mesh.rotation.z = (opt.slant || 0) * 0.5;
  mesh.renderOrder = 2; mesh.userData.keep = true; g.add(mesh);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(c.ax === 'v' ? 0.3 : wd, h + 0.2, c.ax === 'v' ? wd : 0.3), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.copy(mesh.position); g.add(hit);
  traceInfo(hit, Object.assign({ room: o.id, x: c.ax === 'v' ? c.coord : a, z: c.ax === 'v' ? a : c.coord, y: y * CM }, info));
}
function traceInfo(hit, info) {
  info.type = info.type || 'placard'; info.icon = info.icon || '✍';
  info.id = info.id || 'trace-' + Math.random().toString(36).slice(2, 8);
  info.onOpen = () => {
    TRACE.read.add(info.id);
    if (TRACE.read.size >= 6 && typeof hauntRec === 'function') hauntRec('traces');
  };
  M.pickables.push(hit); M.artByMesh.set(hit, info);
}
/** 바닥에 놓인 것 — 공 · 메모 */
function traceBall(x, z, room, name, line, nightLine) {
  const r = M.roomById[room], g = M.roomGroups[room]; if (!r || !g) return;
  const fy = floorAt(r, x, z); if (!(fy === fy)) return;
  const m = new THREE.MeshStandardMaterial({ color: 0xF2F0EA, roughness: 0.35, emissive: 0x1A1A18 });
  m.userData.out = true; m.userData.noBatch = true; if (M.envOut) { m.envMap = M.envOut; m.envMapIntensity = 0.6; }
  if (typeof floodPatch === 'function') floodPatch(m);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.03, 18, 14), m);
  ball.position.set(x / CM, (fy - r.y0) / CM + 0.03, z / CM); g.add(ball);
  // 이름 — 공 옆면에 작게(가까이 가야 읽힌다)
  const T = traceCanvas([[name, '#1A1A1A', 0.8]], { seed: name.length * 7 });
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.05 * T.aspect, 0.05), new THREE.MeshBasicMaterial({ map: T.tex, transparent: true, depthWrite: false }));
  lab.position.set(0, 0.012, 0.0302); lab.scale.setScalar(0.55); ball.add(lab);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(x / CM, (fy - r.y0) / CM + 0.2, z / CM); g.add(hit);
  traceInfo(hit, { icon: '⛳', label: name + '의 공', title: name + '의 공', subtitle: r.name + ' · 떨어진 공', room, x, z, y: fy - r.y0 + 20,
    body: '공에 매직으로 \'' + name + '\'.' + String.fromCharCode(10) + line + (traceNight() && nightLine ? String.fromCharCode(10) + String.fromCharCode(10) + nightLine : '') });
}

function buildTraces() {
  // 무슨 일이 있어도 전시관은 열려야 한다 — 흔적은 덤
  try { buildTracesInner(); } catch (e) { console.warn('traces', e); }
  TRACE.solids = null;
}
function buildTracesInner() {
  if (TRACE.built || !M.archive) return;
  TRACE.built = true;
  M.scene.updateMatrixWorld(true);                                         // 겉면 찾기(광선)가 제자리를 쓰게
  const D = traceData(), night = traceNight(), R = rnd(4242 + (D.P.length || 1));
  if (!D.P.length) return;
  const any = () => pick2(D.P, R).name;
  const dt = (s) => String(s || '').slice(0, 10).replace(/-/g, '.');
  const BLK = '#1C1A18', RED = '#7A1612', WHT = '#E8E4DA';
  // ── 외벽 낙서 ──
  const G = [];
  if (D.best) G.push(night
    ? [[[D.best.name + ' 베스트 ' + D.best.best + '타', BLK], ['그날 넷이 나갔는데 다섯이 들어왔다', RED, 0.7]], '베스트 스코어 옆에 다른 손으로 덧쓴 글씨.']
    : [[[D.best.name + ' 베스트 ' + D.best.best + '타', BLK], ['깨 볼 사람?', BLK, 0.8]], '매직으로 큼직하게. 아래에 화살표.']);
  if (D.bird && D.bird.birdies) G.push(night
    ? [[[D.bird.name + ' 버디 ' + D.bird.birdies + '개', BLK], ['하나는 내가 쳐 줬어', RED, 0.7]], '두 번째 줄은 글씨가 아래로 흘러내렸다.']
    : [[[D.bird.name + ' 버디 ' + D.bird.birdies + '개', BLK], ['실화냐?', BLK, 0.8]], '누가 옆에 별을 세 개 그려 놓았다.']);
  if (D.win && D.win.roundWins) G.push(night
    ? [[[D.win.name, BLK], ['이제 그만 이겨', RED, 0.9]], '이름 위에 빨간 줄이 여러 번 그어져 있다.']
    : [[[D.win.name + ' 또 우승 (' + D.win.roundWins + '회)', BLK], ['다음엔 내가 간다', BLK, 0.75]], '우승 횟수 숫자를 몇 번 고쳐 쓴 자국.']);
  if (D.att) G.push(night
    ? [[[D.att.name + ' ' + D.att.roundsCompleted + '번 왔다', BLK], ['이번이 마지막', RED, 0.75]], '마지막 줄만 분필이 아니라 손톱으로 긁은 것 같다.']
    : [[[D.att.name + ' 개근상 ' + D.att.roundsCompleted + 'R', BLK], ['성실함이 실력', BLK, 0.75]], '꽃 그림이 같이 그려져 있다.']);
  if (D.clip) G.push(night
    ? [[['\'' + D.clip.title + '\'', BLK, 0.85], [D.clip.players + ' 뒤에 서 있던 사람 누구야', RED, 0.65]], '하이라이트 영상 제목. 아래 글씨는 아주 작다.']
    : [[['\'' + D.clip.title + '\'', BLK, 0.85], [D.clip.players + ' 영원히 기억함 ㅋㅋ', BLK, 0.7]], '하이라이트 영상 제목을 누가 적어 놓았다.']);
  G.push(night
    ? [[[any() + ' 여기 있었음 ' + dt(D.last && D.last.played_at), BLK, 0.8], ['아직 있음', RED, 0.9]], '아래 글씨는 다른 사람 손이다. 마르지 않았다.']
    : [[[any() + ' 왔다 감 ' + dt(D.last && D.last.played_at), BLK, 0.8]], '날짜까지 꼼꼼하게.']);
  G.push(night
    ? [[[D.course + ' 18번 홀', BLK, 0.85], ['물 밑에 누가 있다', RED, 0.8]], '호수 쪽을 가리키는 화살표.']
    : [[[D.course + ' 그린 너무 빨라요', BLK, 0.8]], '밑에 \'ㅇㅈ\' 이라고 누가 답을 달았다.']);
  if (night) G.push([[['들어오지 마', RED, 1.1]], '손바닥 자국 위에 쓴 글씨.']);
  const walls = traceWalls().sort(() => R() - 0.5);
  // 벽마다 쓴 자리 — 겹치지 않게(가로 구간 · 높이 둘 다 보고)
  const used = new Map();
  const slot = (w, half) => {
    const L = used.get(w) || []; used.set(w, L);
    for (let k = 0; k < 14; k++) {
      const a = w.c.a0 + 60 + half + R() * Math.max(1, w.c.a1 - w.c.a0 - 120 - half * 2), y = 1.0 + R() * 1.0;
      if (L.every((q) => Math.abs(q.a - a) > q.half + half + 30 || Math.abs(q.y - y) > 0.7)) { L.push({ a, y, half }); return { a, y }; }
    }
    return null;
  };
  G.forEach((g, i) => {
    let w = null, s0 = null;
    for (let k = 0; k < walls.length && !s0; k++) { w = walls[(i + k) % walls.length]; s0 = slot(w, 230); }
    if (!s0) return;
    const a = s0.a, y = s0.y;
    traceOnWall(w, a, y, g[0], { seed: 100 + i, slant: (R() - 0.5) * 0.12, drip: night, chalk: !night && i % 3 === 2, h: 0.72 + R() * 0.26 },
      { label: '낙서', title: '낙서', subtitle: w.o.name + ' · 외벽', body: g[0].map((l) => l[0]).join(String.fromCharCode(10)) + String.fromCharCode(10) + String.fromCharCode(10) + g[1] });
  });
  // ── 바를 정(正) — 멤버별 라운드 수 ──
  let tw = null, ts = null;
  for (let k = 0; k < walls.length && !ts; k++) { tw = walls[(G.length + k) % walls.length]; ts = slot(tw, 160); }
  if (tw && ts) {
    const tops = D.P.filter((p) => p.roundsCompleted).sort((a, b) => b.roundsCompleted - a.roundsCompleted).slice(0, 4);
    const tally = (n) => '正'.repeat(Math.floor(n / 5)) + ['', '一', '丅', '下', '止'][n % 5];
    const lines = tops.map((p) => [p.name + ' ' + tally(Math.min(p.roundsCompleted, 30)), night ? WHT : BLK, 0.85]);
    if (night) { const k = (typeof HAUNT !== 'undefined' ? HAUNT.nights || 0 : 0) + 1; lines.push(['당신 ' + tally(k), RED, 0.85]); }
    traceOnWall(tw, ts.a, Math.max(1.45, ts.y), lines, { seed: 777, chalk: night, h: 1.35 },
      { label: '바를 정', title: '바를 정(正)', subtitle: tw.o.name + ' · 외벽', body: '누가 멤버마다 라운드 수를 正 으로 그어 세어 두었다.' + String.fromCharCode(10) + lines.map((l) => l[0]).join(String.fromCharCode(10))
        + (night ? String.fromCharCode(10) + String.fromCharCode(10) + '맨 아래 줄은 오늘 생겼다. 다시 오면 한 획이 늘어 있을 것 같다.' : '') });
  }
  // ── 이름 쓴 공 ──
  const spots = [[HOLE.tee.x - 300, HOLE.tee.z + 120, 'field'], [HOLE.tee.x + 380, HOLE.tee.z - 60, 'field'], [HOLE.green.x - 700, HOLE.green.z + 300, 'field'],
    [HOLE.bunkers[0].x + 120, HOLE.bunkers[0].z, 'field'], [HOLE.drop.x + 200, HOLE.drop.z + 80, 'field'], [6600, 2300, 'practice'], [-1800, 2400, 'garden']];
  const ps = D.P.slice().sort(() => R() - 0.5);
  spots.forEach(([x, z, room], i) => {
    const p = ps[i % ps.length], r = D.rounds.find((q) => (q.players || []).includes(p.name)) || D.last;
    if (room === 'field' && lakeDist(x, z) < 1.1) return;
    const line = r ? r.course + ' · ' + dt(r.played_at) + ' — ' + (r.winner === p.name ? '그날 1위. ' + r.best + '타.' : '그날 함께 친 사람 ' + (r.player_count || (r.players || []).length) + '명.') : '';
    traceBall(x, z, room, p.name, line + (p.best ? ' 베스트 ' + p.best + '타.' : ''), pick2(['… 공이 젖어 있다. 호수에서 굴러 나온 것처럼.', '… 공에 쓴 이름 위로, 다른 이름이 비쳐 보인다.', '… 주우려고 하면 손이 차가워진다.'], R));
  });
  // ── 티박스 메모 ──
  if (D.last) {
    const r = M.roomById.field, g = M.roomGroups.field, x = HOLE.tee.x - 520, z = HOLE.tee.z + 260, fy = floorAt(r, x, z);
    if (g && fy === fy) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 0.06), new THREE.MeshStandardMaterial({ color: 0x3A2E22, roughness: 0.9 }));
      post.position.set(x / CM, fy / CM + 0.55, z / CM); post.material.userData.out = true; if (typeof floodPatch === 'function') floodPatch(post.material); g.add(post);
      const lines = night ? [['지난 라운드 ' + D.last.course, BLK, 0.6], ['1위 ' + D.last.winner + ' ' + D.last.best + '타', BLK, 0.6], ['공 찾으러 들어간 사람 아직 안 나옴', RED, 0.5]]
        : [['지난 라운드 ' + D.last.course, BLK, 0.6], ['1위 ' + D.last.winner + ' ' + D.last.best + '타', BLK, 0.6], ['18번 파3 · 호수 조심!', BLK, 0.55]];
      const T = traceCanvas(lines, { seed: 31 });
      const pm = new THREE.MeshStandardMaterial({ map: T.tex, color: 0xF0EBDD, roughness: 0.85 }); pm.userData.out = true; if (typeof floodPatch === 'function') floodPatch(pm);
      const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.36 / T.aspect), pm);
      paper.position.set(x / CM, fy / CM + 1.02, z / CM + 0.035); paper.rotation.y = 0.2; g.add(paper);
      const hit = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 0.6), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(x / CM, fy / CM + 0.7, z / CM); g.add(hit);
      M.walls.push({ x0: x - 8, x1: x + 8, z0: z - 8, z1: z + 8, y0: -500, y1: 300 });
      traceInfo(hit, { icon: '📌', label: '티박스 메모', title: '말뚝에 꽂힌 메모', subtitle: '18번 홀 · 티박스 옆', room: 'field', x, z, y: fy + 100, body: lines.map((l) => l[0]).join(String.fromCharCode(10)) });
    }
  }
  // ── 기념 벤치 — 조각 정원 ──
  if (D.att && typeof buildObject3D === 'function') {
    const r = M.roomById.garden, g = M.roomGroups.garden;
    let spot = null;
    for (let k = 0; k < 40 && !spot; k++) { const x = r.x0 + 300 + R() * (r.w - 600), z = r.z0 + 300 + R() * (r.d - 600); if (!hitsWall(x, z, 0) && !hitsWall(x + 90, z, 0) && !hitsWall(x - 90, z, 0)) spot = { x, z }; }
    if (g && spot) {
      const b = buildObject3D('bench'); b.position.set(spot.x / CM, 0, spot.z / CM); b.rotation.y = R() * 6.28; g.add(b);
      b.traverse((o) => { if (o.isMesh && o.material) { o.material = o.material.clone(); o.material.userData.out = true; if (typeof floodPatch === 'function') floodPatch(o.material); } });
      const lines = night ? [[D.att.name + '의 자리', BLK, 0.7], ['앉지 마세요. 아직 앉아 있습니다', RED, 0.5]] : [[D.att.name + ' 기증', BLK, 0.7], ['개근 ' + D.att.roundsCompleted + '라운드 기념', BLK, 0.55]];
      const T = traceCanvas(lines, { seed: 55 });
      const pm = new THREE.MeshStandardMaterial({ map: T.tex, color: 0xC9A86A, roughness: 0.4, metalness: 0.6 }); pm.userData.out = true; if (typeof floodPatch === 'function') floodPatch(pm);
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34 / T.aspect), pm); plate.position.set(0, 0.62, 0.26); plate.rotation.x = -0.5; b.add(plate);
      M.walls.push({ x0: spot.x - 90, x1: spot.x + 90, z0: spot.z - 40, z1: spot.z + 40, y0: -100, y1: 100 });
      const hit = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1, 0.9), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(spot.x / CM, 0.5, spot.z / CM); hit.rotation.y = b.rotation.y; g.add(hit);
      traceInfo(hit, { icon: '🪑', label: '기념 벤치', title: '기념 벤치', subtitle: '조각 정원', room: 'garden', x: spot.x, z: spot.z, y: 60,
        body: lines.map((l) => l[0]).join(String.fromCharCode(10)) + String.fromCharCode(10) + String.fromCharCode(10) + (night ? '앉는 자리가 젖어 있다. 비는 오지 않았다.' : '등받이에 누가 \'최고 성실 멤버\' 라고 적어 두었다.') });
    }
  }
}
