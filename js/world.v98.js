/**
 * world.js — 공간 엔진: 층 · 계단 · 벽 · 바깥(18번 홀) · 하늘 · 해 · 환경광
 *
 * 예전 엔진은 '한 층짜리 격자' 를 전제로 했다 — 모든 방이 같은 격자 칸, 모든 벽이 y=0 에서
 * 시작, 눈높이 고정. 복층·계단·트인 홀·바깥 필드를 넣으려면 그 전제를 바꿔야 한다.
 *
 *   ① 방 = 바닥 사각형 + 층(lv) + 높이. 방끼리 3차원으로 겹치지 않는다.
 *   ② 벽은 '방과 방 사이 경계' 에서 파생된다. 경계선마다 높이 구간을 잘게 나눠
 *      양쪽에 누가 있는지 보고 벽·문·난간·유리·트임을 정한다(buildCells).
 *   ③ 발 높이(M.feet)를 들고 다닌다. 이동할 자리에 '지금 발 높이에서 45cm 안쪽' 바닥이
 *      있어야 걸어갈 수 있다 → 계단은 오르고, 난간 밖·연못·건물 밖으로는 못 나간다.
 *
 * 단위: 논리는 cm, 렌더는 m(÷CM). 좌표: x 동(+), z 남(+), y 위(+).
 * 전역 스크립트(ES 모듈 아님) — museum3d.js 의 M · CM · WT · DOOR_W · doorH · themeTex ·
 * surfaceMat · trimMat · textTex 등을 부른다(호출 시점에는 모두 로드돼 있다).
 */

const OUT_H = 3000;            // 바깥 공간의 '높이'(하늘) — 경계 계산용
const STEP_TOL = 45;           // 한 걸음에 오르내릴 수 있는 높이(cm)
const BODY_LO = 30, BODY_HI = 178;   // 충돌에 쓰는 몸 높이 구간(발 기준)

/* ══════════════════════════════════════════════════════════
   방 — 준비 · 바닥 높이 · 위치 찾기
   ══════════════════════════════════════════════════════════ */
function prepRooms() {
  return ROOMS.map((r) => {
    const x0 = r.rect.x, z0 = r.rect.z, w = r.rect.w, d = r.rect.d;
    const y0 = (r.lv || 0) * FLOOR_H;
    const h = r.h || (r.outdoor ? OUT_H : FLOOR_H);
    return {
      ...r, x0, x1: x0 + w, z0, z1: z0 + d, w, d, cx: x0 + w / 2, cz: z0 + d / 2,
      y0, h, top: y0 + h,
    };
  });
}

/** 방 안 (x,z) 의 바닥 높이(cm). 걸을 수 없는 자리(연못)는 NaN */
function floorAt(r, x, z) {
  if (r.stair) {
    const t = r.stair === 'n' ? (r.z1 - z) / r.d : r.stair === 's' ? (z - r.z0) / r.d
      : r.stair === 'e' ? (x - r.x0) / r.w : (r.x1 - x) / r.w;
    return r.y0 + FLOOR_H * clamp(t, 0, 1);
  }
  if (r.terrain) return terrainCm(x, z);
  return r.y0;
}

const inRect = (r, x, z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;

/** (x,z) 에서 발 높이에 맞는 방 — 여러 층이 겹친 자리에서 **지금 서 있는 층**을 고른다 */
function pickRoom(x, z, feet, tol = STEP_TOL) {
  let best = null, bd = Infinity;
  for (const r of M.rooms) {
    if (!inRect(r, x, z)) continue;
    const f = floorAt(r, x, z);
    if (!(f === f)) continue;                      // NaN(연못)
    const d = Math.abs(f - feet);
    if (d <= tol && d < bd) { bd = d; best = r; }
  }
  return best;
}

/* ══════════════════════════════════════════════════════════
   경계 — 벽 · 문 · 난간 · 유리 · 트임
   ══════════════════════════════════════════════════════════
   경계선(x=상수 또는 z=상수)마다 그 선에 면을 댄 방들을 모은다. 선 방향 구간과 높이 구간을
   모든 방의 끝점으로 잘게 나누면, 칸마다 '음(−)쪽 방' 과 '양(+)쪽 방' 이 하나씩(또는 없음)
   정해진다. 그 둘의 관계가 곧 그 칸에 서는 것이다(resolveCell).
   ────────────────────────────────────────────────────────── */
const connKey = (a, b) => (a < b ? a + '|' + b : b + '|' + a);

function buildCells() {
  const CONN = new Map(CONNS.map(([a, b, t]) => [connKey(a, b), t]));
  const FAC = new Map(FACADE.map(([id, side, t]) => [id + '|' + side, t]));
  const lines = new Map();
  const face = (ax, coord, a, b, side, r) => {
    const k = ax + '|' + coord;
    if (!lines.has(k)) lines.set(k, { ax, coord, faces: [] });
    lines.get(k).faces.push({ a, b, side, r });
  };
  for (const r of M.rooms) {
    face('v', r.x0, r.z0, r.z1, +1, r);   // 방이 선의 +x 쪽
    face('v', r.x1, r.z0, r.z1, -1, r);
    face('h', r.z0, r.x0, r.x1, +1, r);   // 방이 선의 +z 쪽
    face('h', r.z1, r.x0, r.x1, -1, r);
  }

  /* 한 면(building 방의 어느 쪽)의 외벽 모양 — FACADE 표에서 */
  const sideOf = (ax, sideSign) => (ax === 'v' ? (sideSign > 0 ? 'w' : 'e') : (sideSign > 0 ? 'n' : 's'));
  const resolve = (neg, pos, ax) => {
    if (!neg && !pos) return null;
    if (!neg || !pos) {
      const r = neg || pos;
      if (r.outdoor) return null;                  // 바깥의 끝 — 벽이 아니라 '바닥이 없는 곳'
      return FAC.get(r.id + '|' + sideOf(ax, neg ? -1 : +1)) || 'wall';
    }
    const c = CONN.get(connKey(neg.id, pos.id));
    if (c) return c;
    if (neg.outdoor && pos.outdoor) return Math.abs(neg.y0 - pos.y0) < 30 ? 'open' : 'rail';
    if (neg.outdoor || pos.outdoor) {
      const b = neg.outdoor ? pos : neg;
      return FAC.get(b.id + '|' + sideOf(ax, b === pos ? +1 : -1)) || 'wall';
    }
    return 'wall';
  };

  const cells = [];
  for (const L of lines.values()) {
    const A = [...new Set(L.faces.flatMap((f) => [f.a, f.b]))].sort((p, q) => p - q);
    const Y = [...new Set(L.faces.flatMap((f) => [f.r.y0, f.r.top]))].sort((p, q) => p - q);
    // a 구간마다 y 를 쌓아 올리며 같은 칸끼리 합친다
    const cols = [];
    for (let i = 0; i + 1 < A.length; i++) {
      const a0 = A[i], a1 = A[i + 1], am = (a0 + a1) / 2;
      const col = [];
      for (let j = 0; j + 1 < Y.length; j++) {
        const y0 = Y[j], y1 = Y[j + 1], ym = (y0 + y1) / 2;
        let neg = null, pos = null;
        for (const f of L.faces) {
          if (am <= f.a || am >= f.b || ym <= f.r.y0 || ym >= f.r.top) continue;
          if (f.side < 0) neg = f.r; else pos = f.r;
        }
        const type = resolve(neg, pos, L.ax);
        if (!type) continue;
        const last = col[col.length - 1];
        if (last && last.y1 === y0 && last.neg === neg && last.pos === pos && last.type === type) last.y1 = y1;
        else col.push({ ax: L.ax, coord: L.coord, a0, a1, y0, y1, neg, pos, type });
      }
      cols.push(col);
    }
    // 이웃한 a 구간에서 모양이 같은 칸끼리 합친다
    let prev = [];
    for (const col of cols) {
      const next = [];
      for (const c of col) {
        const m = prev.find((p) => p.a1 === c.a0 && p.y0 === c.y0 && p.y1 === c.y1
          && p.neg === c.neg && p.pos === c.pos && p.type === c.type);
        if (m) { m.a1 = c.a1; next.push(m); } else { cells.push(c); next.push(c); }
      }
      prev = next;
    }
  }
  return cells;
}

/** 사각형 빼기 — 벽 조각(a0..a1 × y0..y1) 에서 구멍들을 뺀 나머지 사각형들 */
function subtractHoles(rect, holes) {
  let parts = [rect];
  for (const h of holes) {
    const out = [];
    for (const p of parts) {
      if (h.a1 <= p.a0 || h.a0 >= p.a1 || h.y1 <= p.y0 || h.y0 >= p.y1) { out.push(p); continue; }
      const ya = Math.max(p.y0, h.y0), yb = Math.min(p.y1, h.y1);
      if (p.y0 < ya) out.push({ a0: p.a0, a1: p.a1, y0: p.y0, y1: ya });
      if (yb < p.y1) out.push({ a0: p.a0, a1: p.a1, y0: yb, y1: p.y1 });
      if (p.a0 < h.a0) out.push({ a0: p.a0, a1: h.a0, y0: ya, y1: yb });
      if (h.a1 < p.a1) out.push({ a0: h.a1, a1: p.a1, y0: ya, y1: yb });
    }
    parts = out;
  }
  return parts.filter((p) => p.a1 - p.a0 > 0.5 && p.y1 - p.y0 > 0.5);
}

/** 칸마다 구멍(문·창)을 정하고 충돌 상자·문 목록·가시성 그래프를 만든다 */
function planBoundaries() {
  M.cells = buildCells();
  M.walls = [];
  M.doors = [];
  M.links = new Map(M.rooms.map((r) => [r.id, new Set()]));
  const link = (a, b) => { if (a && b) { M.links.get(a.id).add(b.id); M.links.get(b.id).add(a.id); } };
  const box = (c, a0, a1, y0, y1, extra) => {
    const t = WT / 2;
    M.walls.push(Object.assign(c.ax === 'v'
      ? { x0: c.coord - t, x1: c.coord + t, z0: a0, z1: a1, y0, y1 }
      : { x0: a0, x1: a1, z0: c.coord - t, z1: c.coord + t, y0, y1 }, extra || {}));
  };

  for (const c of M.cells) {
    c.holes = [];
    const base = Math.max(c.neg ? c.neg.y0 : -1e9, c.pos ? c.pos.y0 : -1e9, c.y0);
    if (c.type !== 'wall') link(c.neg, c.pos);

    if (c.type === 'door' || c.type === 'glassdoor') {
      const mid = (c.a0 + c.a1) / 2;
      const wid = c.type === 'glassdoor' ? Math.min(320, c.a1 - c.a0 - 80) : Math.min(DOOR_W, c.a1 - c.a0 - 60);
      const dh = c.type === 'glassdoor' ? Math.min(270, c.y1 - base - 30)
        : Math.min(doorH(c.neg, c.pos), c.y1 - base - 40);
      const closed = (c.neg && c.neg.closed) || (c.pos && c.pos.closed) || null;
      c.hole = { a0: mid - wid / 2, a1: mid + wid / 2, y0: base, y1: base + dh };
      c.holes.push(c.hole);
      M.doors.push({
        axis: c.ax, coord: c.coord, a: c.hole.a0, b: c.hole.a1, y0: base, h: dh,
        rooms: [c.neg.id, c.pos.id], closed, glass: c.type === 'glassdoor', cell: c,
      });
    }
    if (c.type === 'window') {
      const usable = c.a1 - c.a0 - 100;
      const n = Math.max(1, Math.round(usable / 340));
      const bay = usable / n;
      const sill = base + 95, head = Math.min(c.y1 - 55, base + 95 + 300);
      if (head - sill > 80) {
        for (let i = 0; i < n; i++) {
          const m = c.a0 + 50 + bay * (i + 0.5);
          c.holes.push({ a0: m - (bay - 70) / 2, a1: m + (bay - 70) / 2, y0: sill, y1: head });
        }
      }
    }

    // 충돌 — 트임은 없음, 난간은 발목~허리, 나머지는 칸 전체(문 구멍만 뺀다)
    if (c.type === 'open') continue;
    if (c.type === 'rail') { box(c, c.a0, c.a1, base, base + 112); continue; }
    if (c.type === 'window' || c.type === 'glass' || c.type === 'entrance' || c.type === 'stairside') {
      box(c, c.a0, c.a1, c.y0, c.y1);
      continue;
    }
    for (const p of subtractHoles({ a0: c.a0, a1: c.a1, y0: c.y0, y1: c.y1 }, c.holes)) box(c, p.a0, p.a1, p.y0, p.y1);
  }
  /* 닫힌 문 — 구멍을 충돌로 채운다(문짝은 boundary 메시가 그린다) */
  for (const d of M.doors) {
    if (!d.closed) continue;
    box(d.cell, d.a, d.b, d.y0, d.y0 + d.h, { ghost: true });
  }
}

/** 몸이 벽에 닿는가 — 발 높이 기준 몸통 구간과 겹치는 벽만 본다 */
function hitsWall(x, z, feet = M.feet) {
  const lo = feet + BODY_LO, hi = feet + BODY_HI;
  for (const w of M.walls) {
    if (w.y1 <= lo || w.y0 >= hi) continue;
    const nx = clamp(x, w.x0, w.x1), nz = clamp(z, w.z0, w.z1);
    if ((x - nx) ** 2 + (z - nz) ** 2 < NEAR_W * NEAR_W) return true;
  }
  return false;
}

/* ══════════════════════════════════════════════════════════
   걸이 자리 — 방의 '걸 수 있는 벽' (문 옆 · 막힌 벽만)
   ══════════════════════════════════════════════════════════ */
function wallRuns(r) {
  if (r.outdoor || r.stair) return [];
  const runs = [];
  const sides = [
    ['h', r.z0, 'x', 0, 1, 0, r.x0, r.x1],
    ['h', r.z1, 'x', 0, -1, 180, r.x0, r.x1],
    ['v', r.x0, 'z', 1, 0, 90, r.z0, r.z1],
    ['v', r.x1, 'z', -1, 0, -90, r.z0, r.z1],
  ];
  for (const [ax, coord, axis, nx, nz, yaw, lo, hi] of sides) {
    const segs = [];
    for (const c of M.cells) {
      if (c.ax !== ax || c.coord !== coord) continue;
      if (c.neg !== r && c.pos !== r) continue;
      if (c.y0 > r.y0 + 5 || c.y1 < r.y0 + 290) continue;       // 바닥부터 눈높이 위까지 막힌 벽
      if (c.type === 'wall') segs.push([c.a0, c.a1]);
      else if (c.type === 'door' && c.hole) {
        segs.push([c.a0, c.hole.a0 - 55]);
        segs.push([c.hole.a1 + 55, c.a1]);
      }
    }
    segs.sort((p, q) => p[0] - q[0]);
    const merged = [];
    for (const [a, b] of segs) {
      const last = merged[merged.length - 1];
      if (last && a <= last[1] + 1) last[1] = Math.max(last[1], b); else merged.push([a, b]);
    }
    for (let [a, b] of merged) {
      a = Math.max(a, lo + 80); b = Math.min(b, hi - 80);
      if (b - a > 140) runs.push({ a, b, len: b - a, axis, fixed: coord, nx, nz, yaw });
    }
  }
  return runs;
}

/* ══════════════════════════════════════════════════════════
   가시성 — 방 단위 컬링(경계 그래프)
   ══════════════════════════════════════════════════════════
   벽이 아닌 경계(문·트임·난간·유리)로 이어진 방을 두 단계까지 켠다.
   켜진 방 중 하나라도 바깥과 이어져 있으면 바깥 전체(필드·테라스·데크)를 켠다 —
   유리벽 너머로 필드가 통째로 보이기 때문이다. */
function visibleSet(cur) {
  const on = new Set();
  if (!cur) { M.rooms.forEach((r) => on.add(r.id)); return on; }
  /* 한 공간의 조각(part)은 한 덩어리로 센다 — 그랜드 홀은 계단 둘레로 여섯 조각이라,
     조각 단위로 두 단계를 세면 현관에서 라운지(세 단계 너머)가 꺼져 유리벽 너머가 비었다 */
  const group = (id) => { const r = M.roomById[id]; return r.part || r.id; };
  const members = new Map();
  for (const r of M.rooms) {
    const g = r.part || r.id;
    if (!members.has(g)) members.set(g, []);
    members.get(g).push(r.id);
  }
  const addGroup = (g, list) => { for (const id of members.get(g) || []) if (!on.has(id)) { on.add(id); list.push(id); } };
  let front = [];
  addGroup(group(cur.id), front);
  /* 바깥에서는 한 단계만 — 유리 너머로 보이는 것은 유리에 붙은 공간(라운지·회랑·우승자의 방)
     까지다. 두 단계를 켜면 필드에 서 있는데 건물 안 전시실이 전부 그려졌다(드로콜 500) */
  const depthMax = cur.outdoor ? 1 : 2;
  for (let depth = 0; depth < depthMax; depth++) {
    const nx = [];
    for (const id of front) for (const n of M.links.get(id) || []) if (!on.has(n)) addGroup(group(n), nx);
    front = nx;
  }
  if ([...on].some((id) => M.roomById[id].outdoor)) M.rooms.forEach((r) => { if (r.outdoor) on.add(r.id); });
  return on;
}

/* ══════════════════════════════════════════════════════════
   하늘 · 해 · 환경광
   ══════════════════════════════════════════════════════════ */
const SUN_DIR = new THREE.Vector3(-0.42, 0.62, 0.66).normalize();   // 남서쪽 높이 — 필드를 순광으로
/**
 * 환경맵 두 장 — 실내(따뜻한 조명 상자)와 바깥(하늘).
 * three 의 MeshStandardMaterial 은 envMap 하나로 **반사와 은은한 채움광을 함께** 받는다.
 * 점광을 여러 개 켜는 것보다 싸고(광원 수가 늘지 않는다) 금속·유리·광택 바닥이 살아난다 —
 * '옛날 그래픽' 으로 보이던 가장 큰 이유가 이 반사가 없던 것이었다.
 */
function buildEnvMaps(renderer) {
  const pm = new THREE.PMREMGenerator(renderer);
  // 실내 — 벽은 따뜻한 회색, 천장에 조명 판 격자
  const si = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(24, 7, 24), new THREE.MeshBasicMaterial({ color: 0x5A5048, side: THREE.BackSide }));
  si.add(room);
  const flo = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.MeshBasicMaterial({ color: 0x3A322A }));
  flo.rotation.x = -Math.PI / 2; flo.position.y = -3.4; si.add(flo);
  const panel = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xFFF0D8).multiplyScalar(5.5) });
  for (let i = -2; i <= 2; i++) for (let k = -2; k <= 2; k++) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.5), panel);
    p.rotation.x = Math.PI / 2; p.position.set(i * 4.4, 3.45, k * 4.4); si.add(p);
  }
  const win = new THREE.Mesh(new THREE.PlaneGeometry(14, 4), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xC8DCF0).multiplyScalar(2.2) }));
  win.position.set(0, 0.5, -11.9); si.add(win);                         // 북쪽 유리벽의 하늘
  M.envIn = pm.fromScene(si, 0.035).texture;
  // 실사 HDRI 가 있으면 그것으로 바꾼다(pbr.js) — 광택 바닥 · 유리 · 금속에 진짜 공간이 비친다
  const hIn = typeof pbrEnvMap === 'function' && pbrEnvMap(pm, 'in', 0.55);
  if (hIn) M.envIn = hIn;

  // 바깥 — 하늘 돔 + 풀밭 바닥 + 해
  const so = new THREE.Scene();
  const night = (typeof NIGHT !== 'undefined' && NIGHT.on);
  so.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), night ? nightSkyMaterial(true) : skyMaterial()));
  const g = new THREE.Mesh(new THREE.CircleGeometry(48, 32), new THREE.MeshBasicMaterial({ color: night ? 0x0B120A : 0x3E5A2C }));
  g.rotation.x = -Math.PI / 2; g.position.y = -0.5; so.add(g);
  if (night) {
    // 밤 — 멀리 선 조명탑들이 광택면에 비치도록 지평선 둘레에 밝은 점을 둔다
    const lamp = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.95, 0.85).multiplyScalar(3) });
    for (let i = 0; i < 9; i++) {
      const a = -1.2 + i * 0.3, q = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), lamp);   // 북쪽(필드) 반원
      q.position.set(Math.sin(a) * 40, 9 + (i % 3) * 1.5, -Math.cos(a) * 40); so.add(q);
    }
  }
  M.envOut = pm.fromScene(so, 0.02).texture;
  const hOut = !night && typeof pbrEnvMap === 'function' && pbrEnvMap(pm, 'out', 0.6);
  if (hOut) M.envOut = hOut;
  pm.dispose();
}

/** 모든 PBR 재질에 환경맵을 입힌다 — userData.out 이면 하늘, 아니면 실내 */
function applyEnv(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of ms) {
      // v97 — 밤: 바깥 재질에 조명탑 · 가로등 빛을 얹는다(night.js)
      if (m && m.userData.out && typeof floodPatch === 'function') floodPatch(m);
      if (!m || !(m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) || m.envMap) continue;
      m.envMap = m.userData.out ? M.envOut : M.envIn;
      m.envMapIntensity = m.userData.envK != null ? m.userData.envK : (m.userData.out ? 1.0 : 0.85);
      if (!m.userData.out && (typeof NIGHT !== 'undefined' && NIGHT.on)) m.envMapIntensity *= NIGHT.envIn;      // 밤 — 실내도 한 톤 어둡게
      m.needsUpdate = true;
    }
  });
}
const markOut = (root) => root.traverse((o) => {
  if (!o.isMesh) return;
  (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m) m.userData.out = true; });
});

function buildSun() {
  const coarse = matchMedia('(pointer: coarse)').matches;
  const sun = new THREE.DirectionalLight(0xFFE7C4, 2.6);
  // 그림자 카메라 — 건물 + 필드 앞쪽(나무·표석)까지. 해가 움직이지 않으므로 한 번만 그린다
  const C = new THREE.Vector3(24, 0, -18);
  sun.position.copy(C).addScaledVector(SUN_DIR, 80);
  sun.target.position.copy(C);
  sun.castShadow = true;
  const S = sun.shadow;
  S.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
  S.camera.left = -62; S.camera.right = 62; S.camera.top = 62; S.camera.bottom = -62;
  S.camera.near = 10; S.camera.far = 190;
  S.bias = -0.0004; S.normalBias = 0.035;
  M.scene.add(sun, sun.target);
  M.sun = sun;
}

/* ══════════════════════════════════════════════════════════
   메시 — 방 껍데기(바닥·천장·지붕·계단)
   ══════════════════════════════════════════════════════════ */
const CEIL_COL = { dark: 0x1A181B, velvet: 0x2C1C1E, walnut: 0x2E251D };

/** 여러 BoxGeometry 를 한 지오메트리로 — 계단 서른 칸을 한 번에 그린다 */
function mergeGeos(list) {
  const pos = [], nor = [], uv = [], idx = [];
  let off = 0;
  for (const g of list) {
    const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); uv.push(u.getX(i), u.getY(i));
    }
    const ix = g.index.array;
    for (let i = 0; i < ix.length; i++) idx.push(ix[i] + off);
    off += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setIndex(idx);
  return out;
}
const boxAt = (w, h, d, x, y, z) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return g; };

/** 위에 다른 실내 방이 얹혀 있는가(지붕이 필요 없는가) */
function hasRoomAbove(r) {
  return M.rooms.some((q) => !q.outdoor && q !== r && Math.abs(q.y0 - r.top) < 1
    && q.x0 < r.x1 && q.x1 > r.x0 && q.z0 < r.z1 && q.z1 > r.z0);
}

/** 방 껍데기 — 그룹은 y0 에 놓이므로 여기서는 방 기준(0 = 바닥) 좌표를 쓴다 */
function buildRoomShell(r, g) {
  const wM = r.w / CM, dM = r.d / CM, hM = r.h / CM, cx = r.cx / CM, cz = r.cz / CM;
  const theme = r.mat ? themeTex(r.mat) : null;

  if (r.terrain) { buildField(r, g); return; }

  if (r.stair) { buildStair(r, g, theme); }
  else if (r.outdoor && r.lv > 0) {
    // 데크 — 두께 있는 판(아래 테라스에서 올려다보면 천장이 된다)
    const mat = surfaceMat(theme, 'floor', wM, dM, 2.0);
    const top = new THREE.Mesh(new THREE.BoxGeometry(wM, 0.32, dM),
      [new THREE.MeshStandardMaterial({ color: 0x5A534A, roughness: 0.8 }), new THREE.MeshStandardMaterial({ color: 0x5A534A, roughness: 0.8 }),
        mat, new THREE.MeshStandardMaterial({ color: 0xD8D2C6, roughness: 0.9 }),
        new THREE.MeshStandardMaterial({ color: 0x5A534A, roughness: 0.8 }), new THREE.MeshStandardMaterial({ color: 0x5A534A, roughness: 0.8 })]);
    top.position.set(cx, -0.16, cz);
    top.castShadow = true; top.receiveShadow = true;
    g.add(top);
  } else if (theme) {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(wM, dM), surfaceMat(theme, 'floor', wM, dM, 2.0));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(cx, 0, cz);
    floor.receiveShadow = true;
    g.add(floor);
  }
  if (r.outdoor) { markOut(g); return; }

  if (r.sky) {
    // 유리 천장 — 철골 격자(그림자를 드리운다) + 유리
    const steel = new THREE.MeshStandardMaterial({ color: 0x2A2C2E, roughness: 0.45, metalness: 0.7 });
    const beams = [];
    const step = 1.5;
    for (let x = -wM / 2 + step; x < wM / 2 - 0.1; x += step) beams.push(boxAt(0.07, 0.22, dM, cx + x, hM - 0.11, cz));
    for (let z = -dM / 2 + step; z < dM / 2 - 0.1; z += step) beams.push(boxAt(wM, 0.16, 0.06, cx, hM - 0.08, cz + z));
    beams.push(boxAt(wM, 0.4, 0.2, cx, hM - 0.2, cz - dM / 2 + 0.1), boxAt(wM, 0.4, 0.2, cx, hM - 0.2, cz + dM / 2 - 0.1));
    if (beams.length) {
      const bm = new THREE.Mesh(mergeGeos(beams), steel);
      bm.castShadow = true;
      g.add(bm);
    }
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(wM, dM), glassMat(0.12));
    glass.rotation.x = Math.PI / 2;
    glass.position.set(cx, hM, cz);
    glass.userData.noPick = true;
    g.add(glass);
    const glassUp = glass.clone(); glassUp.rotation.x = -Math.PI / 2; glassUp.material = glassMat(0.2, true); g.add(glassUp);
  } else {
    /* 천장은 아래를 본다 — 해·스포트는 닿지 않고 환경맵도 바닥(어두운 쪽)을 비춰서
       흰 천장이 올리브색으로 가라앉았다. 실제로는 벽·바닥에서 튄 빛이 천장을 밝힌다 →
       그 몫을 자체 발광으로 조금 준다 */
    const cc = new THREE.Color(CEIL_COL[r.mat] || 0xE8E3D9);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(wM, dM),
      new THREE.MeshStandardMaterial({ color: cc, roughness: 0.95, emissive: cc.clone().multiplyScalar(r.mat === 'dark' ? 0.04 : 0.2) }));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(cx, hM, cz);
    ceil.material.userData.envK = 0.5;
    g.add(ceil);
    // 선형 조명 — 천장에 박힌 가는 발광 띠(블룸이 물어 실제 조명처럼 보인다)
    const dim = r.mat === 'dark' ? 0.35 : 1;
    const strip = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xFFF1DA).multiplyScalar(dim) });
    const n = Math.max(1, Math.round(r.d / 380));
    const len = Math.max(1, wM - 2.4);
    const bars = [];
    for (let i = 0; i < n; i++) bars.push(boxAt(len, 0.02, 0.07, cx, hM - 0.012, r.z0 / CM + dM * (i + 0.5) / n));
    g.add(new THREE.Mesh(mergeGeos(bars), strip));
  }
  if (!hasRoomAbove(r)) {
    // 지붕 판 — 바깥에서 보이는 윗면 + 해를 막아 실내를 그늘지게 한다
    const roof = new THREE.Mesh(new THREE.BoxGeometry(wM, 0.3, dM),
      new THREE.MeshStandardMaterial({ color: 0x77726A, roughness: 0.9 }));
    // 밑면이 천장 판과 같은 높이면 z-파이팅으로 지붕 밑면(회색)이 천장을 덮는다 → 2cm 띄운다
    roof.position.set(cx, hM + 0.17, cz);
    roof.castShadow = !r.sky;
    roof.receiveShadow = true;
    if (!r.sky) g.add(roof);
    roof.material.userData.out = true;
  }
}

function glassMat(opacity, out) {
  const m = new THREE.MeshStandardMaterial({
    color: 0xC4D2D6, roughness: 0.05, metalness: 0.0, transparent: true, opacity: opacity || 0.12,
    depthWrite: false, side: THREE.FrontSide,
  });
  m.userData.envK = 0.7;
  m.userData.out = !!out;
  return m;
}

/** 대계단 — 돌 덩어리 한 채 + 양옆 유리 난간 + 놋쇠 손잡이 */
function buildStair(r, g, theme) {
  const N = 30, rise = FLOOR_H / N / CM, run = r.d / N / CM, wM = r.w / CM;
  const stone = surfaceMat(theme, 'floor', wM, 2, 2.0);
  const parts = [];
  for (let i = 0; i < N; i++) {
    const top = (i + 1) * rise;
    // 'n' 계단 — 남쪽 끝(z1)에서 시작해 북쪽으로 오른다
    const z = r.z1 / CM - (i + 0.5) * run;
    parts.push(boxAt(wM, top, run, r.cx / CM, top / 2, z));
  }
  const mass = new THREE.Mesh(mergeGeos(parts), stone);
  mass.castShadow = true; mass.receiveShadow = true;
  g.add(mass);
  // 옆 난간 — 경사진 유리판(평행사변형) + 손잡이
  const brass = trimMat();
  for (const x of [r.x0 / CM + 0.04, r.x1 / CM - 0.04]) {
    const z1 = r.z1 / CM, z0 = r.z0 / CM, Hs = FLOOR_H / CM;
    const geo = new THREE.BufferGeometry();
    const v = new Float32Array([x, 0.05, z1, x, 0.05 + Hs, z0, x, 1.05 + Hs, z0, x, 1.05, z1]);
    geo.setAttribute('position', new THREE.BufferAttribute(v, 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.computeVertexNormals();
    const gm = glassMat(0.2); gm.side = THREE.DoubleSide;
    const pane = new THREE.Mesh(geo, gm);
    pane.userData.noPick = true;
    g.add(pane);
    const len = Math.hypot(z1 - z0, Hs);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, len), brass);
    rail.position.set(x, 1.07 + Hs / 2, (z0 + z1) / 2);
    rail.rotation.x = Math.atan2(Hs, z1 - z0);
    g.add(rail);
  }
}

/* ══════════════════════════════════════════════════════════
   메시 — 경계(벽·문·난간·유리) · 정적 배칭
   ══════════════════════════════════════════════════════════
   ⚠️ 처음엔 벽 조각마다 메시를 만들고, 양면 재질이 달라 상자 하나에 재질 6개를 줬다.
      상자 하나 = 그리기 6번이다. 트인 그랜드 홀에서는 건물 대부분이 보여서
      현관에 서기만 해도 드로콜이 903번이었다(모바일 한계선은 대략 200~300).
   → ① 텍스처 좌표를 **월드 좌표(m)** 로 준다. 그러면 조각마다 반복 횟수를 따로 줄 필요가
        없어 같은 마감(방 테마·외장)의 재질을 **하나로 공유**할 수 있다.
     ② 면 단위로 재질별 버킷에 모았다가 재질마다 메시 하나로 만든다(batch.flush).
     결과: 경계 전체가 재질 수(스무 개 남짓)만큼의 그리기로 끝난다. */
const SHARED_MAT = new Map();
function sharedMat(key, make) {
  if (!SHARED_MAT.has(key)) SHARED_MAT.set(key, make());
  return SHARED_MAT.get(key);
}
/** 월드 UV 용 표면 재질 — 텍스처 한 장이 tile(m) 을 덮는다 */
function worldSurface(themeName, kind, tile, opt = {}) {
  const key = 'surf|' + themeName + '|' + kind + '|' + tile + '|' + (opt.envK == null ? '' : opt.envK) + '|' + (opt.out ? 1 : 0);
  return sharedMat(key, () => {
    const src = themeTex(themeName)[kind];
    if (src.tile) tile = src.tile;                   // 실사 재질 — 제 실제 크기
    const map = src.map.clone(); map.needsUpdate = true; map.repeat.set(1 / tile, 1 / tile);
    const nrm = src.normal.clone(); nrm.needsUpdate = true; nrm.repeat.set(1 / tile, 1 / tile);
    const ns = src.roughMap ? 1.1 * (src.nScale || 1) : 0.7;
    const m = new THREE.MeshStandardMaterial({
      map, normalMap: nrm, normalScale: new THREE.Vector2(ns, ns), roughness: src.rough, metalness: 0.02,
    });
    if (src.roughMap) {
      const rm = src.roughMap.clone(); rm.needsUpdate = true; rm.repeat.set(1 / tile, 1 / tile);
      m.roughnessMap = rm; m.color.copy(src.color);
    }
    if (opt.envK != null) m.userData.envK = opt.envK;
    if (opt.out) m.userData.out = true;
    return m;
  });
}
const plainMat = (key, params, out) => sharedMat('plain|' + key + '|' + (out ? 1 : 0), () => {
  const m = new THREE.MeshStandardMaterial(params);
  if (out) m.userData.out = true;
  return m;
});
const bronzeMat = () => plainMat('bronze', { color: 0x3A3128, roughness: 0.38, metalness: 0.75 });
const brassMat = () => sharedMat('brass', () => trimMat());
const glassShared = (out, op) => sharedMat('glass|' + (out ? 1 : 0) + '|' + op, () => {
  const g = glassMat(op, out); g.side = THREE.DoubleSide; return g;
});

function faceMat(room) {
  if (!room || room.outdoor) return worldSurface('facade', 'wall', 3.0, { out: true });
  return worldSurface(room.mat || 'gallery', 'wall', 2.6, { envK: room.env });
}

/** 면 버킷 — 재질별로 사각형을 모아 메시 하나로 */
function makeBatch() {
  const buckets = new Map();
  const bucket = (mat) => {
    if (!buckets.has(mat)) buckets.set(mat, { pos: [], nor: [], uv: [], idx: [] });
    return buckets.get(mat);
  };
  /** 사각형 — 네 점(m)은 반시계(바깥에서 볼 때), n = 법선 */
  const quad = (mat, pts, n) => {
    const b = bucket(mat), o = b.pos.length / 3;
    const ax = Math.abs(n[0]), ay = Math.abs(n[1]);
    for (const p of pts) {
      b.pos.push(p[0], p[1], p[2]); b.nor.push(n[0], n[1], n[2]);
      // 월드 UV — 법선 축을 빼고 남는 두 축
      if (ax > 0.5) b.uv.push(p[2] * -Math.sign(n[0]), p[1]);
      else if (ay > 0.5) b.uv.push(p[0], p[2]);
      else b.uv.push(p[0] * Math.sign(n[2]), p[1]);
    }
    b.idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
  };
  /** UV 를 직접 주는 사각형(그늘 띠처럼 텍스처가 면에 붙어야 하는 것) */
  const quadUV = (mat, pts, n, uvs) => {
    const b = bucket(mat), o = b.pos.length / 3;
    pts.forEach((p, i) => { b.pos.push(p[0], p[1], p[2]); b.nor.push(n[0], n[1], n[2]); b.uv.push(uvs[i][0], uvs[i][1]); });
    b.idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
  };
  /** 상자 — mats: [+x, −x, +y, −y, +z, −z] (null 이면 그 면은 안 그린다) */
  const box = (x0, x1, y0, y1, z0, z1, mats) => {
    const m = Array.isArray(mats) ? mats : [mats, mats, mats, mats, mats, mats];
    if (m[0]) quad(m[0], [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0]);
    if (m[1]) quad(m[1], [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0]);
    if (m[2]) quad(m[2], [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0]);
    if (m[3]) quad(m[3], [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0]);
    if (m[4]) quad(m[4], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1]);
    if (m[5]) quad(m[5], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1]);
  };
  /** 선(c.ax)을 따라가는 상자 — a(선 방향)·y·두께(선에 수직, 중심 co ± t/2) 로 준다 */
  const alongBox = (ax, co, a0, a1, y0, y1, t, mats, off = 0) => {
    if (ax === 'v') {
      const mm = Array.isArray(mats) ? mats : null;
      box(co + off - t / 2, co + off + t / 2, y0, y1, a0, a1, mm ? [mm.pos, mm.neg, mm.edge, mm.edge, mm.edge, mm.edge] : mats);
    } else {
      const mm = Array.isArray(mats) ? mats : null;
      box(a0, a1, y0, y1, co + off - t / 2, co + off + t / 2, mm ? [mm.edge, mm.edge, mm.edge, mm.edge, mm.pos, mm.neg] : mats);
    }
  };
  /** 선을 따라 세운 판(유리) — 두께 없음 */
  const alongPane = (ax, co, a0, a1, y0, y1, mat) => {
    if (ax === 'v') quad(mat, [[co, y0, a0], [co, y0, a1], [co, y1, a1], [co, y1, a0]], [1, 0, 0]);
    else quad(mat, [[a0, y0, co], [a1, y0, co], [a1, y1, co], [a0, y1, co]], [0, 0, 1]);
  };
  const flush = (grp, occlude) => {
    const out = [];
    for (const [mat, b] of buckets) {
      if (!b.idx.length) continue;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(b.nor, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
      g.setIndex(b.idx);
      g.computeBoundingSphere();
      const mesh = new THREE.Mesh(g, mat);
      const glassy = mat.transparent;
      mesh.castShadow = !glassy;
      mesh.receiveShadow = !glassy;
      if (glassy) mesh.renderOrder = 2;
      grp.add(mesh);
      if (occlude && !glassy) M.occluders.push(mesh);
      out.push(mesh);
    }
    buckets.clear();
    return out;
  };
  return { quad, quadUV, box, alongBox, alongPane, flush };
}

/** 칸 하나의 벽 조각 — 양면에 각 방의 재질, 걸레받이 · 외벽 밑둥 · 두겁 */
function wallPiece(B, c, p) {
  const T = WT / CM, ext = T / 2 - 0.01;             // 모서리 틈 메우기(맞닿는 벽 속으로 조금)
  const a0 = p.a0 / CM - ext, a1 = p.a1 / CM + ext, y0 = p.y0 / CM, y1 = p.y1 / CM, co = c.coord / CM;
  const mNeg = faceMat(c.neg), mPos = faceMat(c.pos);
  const mats = [];
  mats.pos = mPos; mats.neg = mNeg; mats.edge = mNeg;
  B.alongBox(c.ax, co, a0, a1, y0, y1, T, mats);

  // 걸레받이 — 실내 쪽, 그 방 바닥에서 시작하는 조각에만(낮고 어둡게)
  for (const [room, s] of [[c.neg, -1], [c.pos, 1]]) {
    if (!room || room.outdoor || Math.abs(p.y0 - room.y0) > 1) continue;
    const th = themeTex(room.mat || 'gallery');
    const bm = plainMat('base|' + th.wainscot, { color: new THREE.Color(th.wainscot), roughness: 0.55 });
    B.alongBox(c.ax, co, p.a0 / CM, p.a1 / CM, y0, y0 + 0.1, 0.012, bm, s * (T / 2 + 0.006));
    // 벽 밑 그늘 띠 — 벽과 바닥이 만나는 선이 어두워야 벽이 바닥에 **서 있다**
    const f0 = co + s * (T / 2 + 0.013), f1 = co + s * (T / 2 + 0.34), yy = y0 + 0.003;
    const A0 = p.a0 / CM, A1 = p.a1 / CM;
    const pts = c.ax === 'v'
      ? [[f0, yy, A0], [f0, yy, A1], [f1, yy, A1], [f1, yy, A0]]
      : [[A0, yy, f0], [A1, yy, f0], [A1, yy, f1], [A0, yy, f1]];
    B.quadUV(baseAOMat(), pts, [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
  // 외벽 — 밑둥(어두운 돌)과 윗단 두겁(코핑)
  const outSide = (!c.neg || c.neg.outdoor) ? -1 : ((!c.pos || c.pos.outdoor) ? 1 : 0);
  if (outSide) {
    const room = outSide < 0 ? c.pos : c.neg;
    if (p.y0 < 1) B.alongBox(c.ax, co, a0, a1, 0, 0.5, T + 0.06, plainMat('plinth', { color: 0x4A443C, roughness: 0.7 }, true));
    if (room && Math.abs(p.y1 - room.top) < 1 && !hasRoomAbove(room)) {
      B.alongBox(c.ax, co, a0 - 0.05, a1 + 0.05, y1, y1 + 0.55, T + 0.1, worldSurface('facade', 'wall', 3.0, { out: true }));
      // 금속 두겁(v87) — 석재 판 윗단에 짙은 알루미늄 띠. 지붕선이 또렷해진다
      B.alongBox(c.ax, co, a0 - 0.08, a1 + 0.08, y1 + 0.55, y1 + 0.62, T + 0.16, plainMat('capMetal', { color: 0x2E2F31, roughness: 0.42, metalness: 0.7 }, true));
    }
  }
}

/** 유리면 — 멀리언 + 층마다 가로대 + 유리(구멍 = 유리문은 비운다) */
function glassRun(B, c, holes) {
  const co = c.coord / CM, bz = bronzeMat();
  const a0 = c.a0 / CM, a1 = c.a1 / CM, y0 = c.y0 / CM, y1 = c.y1 / CM;
  const n = Math.max(1, Math.round((a1 - a0) / 1.6));
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * i / n;
    if (holes.some((h) => a * CM > h.a0 + 5 && a * CM < h.a1 - 5)) continue;
    B.alongBox(c.ax, co, a - 0.035, a + 0.035, y0, y1, 0.12, bz);
  }
  const rails = [];
  for (let y = y0; y <= y1 + 0.01; y += FLOOR_H / CM) rails.push(Math.min(y, y1 - 0.04));
  rails.push(y1 - 0.04);
  for (const y of rails) B.alongBox(c.ax, co, a0, a1, y - 0.04, y + 0.04, 0.12, bz);
  for (const h of holes) {
    // 유리문 틀 — 양옆 기둥 + 상부
    B.alongBox(c.ax, co, h.a0 / CM - 0.06, h.a0 / CM, h.y0 / CM, h.y1 / CM, 0.16, bz);
    B.alongBox(c.ax, co, h.a1 / CM, h.a1 / CM + 0.06, h.y0 / CM, h.y1 / CM, 0.16, bz);
    B.alongBox(c.ax, co, h.a0 / CM - 0.06, h.a1 / CM + 0.06, h.y1 / CM, h.y1 / CM + 0.08, 0.16, bz);
  }
  const gm = glassShared(true, 0.12);
  for (const p of subtractHoles({ a0: c.a0, a1: c.a1, y0: c.y0, y1: c.y1 }, holes)) {
    B.alongPane(c.ax, co, p.a0 / CM, p.a1 / CM, p.y0 / CM, p.y1 / CM, gm);
  }
}

/** 유리 난간 + 놋쇠 손잡이 + (실내면) 슬래브 모서리 */
function railRun(B, c) {
  const base = Math.max(c.neg ? c.neg.y0 : 0, c.pos ? c.pos.y0 : 0, c.y0) / CM;
  const co = c.coord / CM, a0 = c.a0 / CM, a1 = c.a1 / CM;
  const outdoor = (c.neg && c.neg.outdoor) || (c.pos && c.pos.outdoor);
  B.alongPane(c.ax, co, a0, a1, base + 0.03, base + 1.02, glassShared(!!outdoor, 0.08));
  B.alongBox(c.ax, co, a0, a1, base + 1.045, base + 1.095, 0.07, brassMat());
  // 난간 기둥 — 1.2m 마다(유리만 떠 있으면 무엇이 잡아주는지 모른다)
  const n = Math.max(1, Math.round((a1 - a0) / 1.2));
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * i / n;
    B.alongBox(c.ax, co, a - 0.02, a + 0.02, base, base + 1.05, 0.04, brassMat());
  }
  const both = (c.neg && c.neg.outdoor) && (c.pos && c.pos.outdoor);
  if (!both) B.alongBox(c.ax, co, a0, a1, base - 0.34, base, 0.3, plainMat('fascia', { color: 0xE4DED2, roughness: 0.6 }));
}

/** 창 — 구멍마다 유리 + 청동 틀 */
function windowFrames(B, c) {
  const co = c.coord / CM, T = WT / CM + 0.02, bz = bronzeMat();
  const out = (!c.neg || c.neg.outdoor) || (!c.pos || c.pos.outdoor);
  const gm = glassShared(out, 0.1);
  for (const h of c.holes) {
    const a0 = h.a0 / CM, a1 = h.a1 / CM, y0 = h.y0 / CM, y1 = h.y1 / CM, mid = (a0 + a1) / 2;
    B.alongPane(c.ax, co, a0, a1, y0, y1, gm);
    B.alongBox(c.ax, co, a0 - 0.05, a1 + 0.05, y0, y0 + 0.06, T, bz);
    B.alongBox(c.ax, co, a0 - 0.05, a1 + 0.05, y1 - 0.06, y1, T, bz);
    B.alongBox(c.ax, co, a0, a0 + 0.06, y0, y1, T, bz);
    B.alongBox(c.ax, co, a1 - 0.06, a1, y0, y1, T, bz);
    B.alongBox(c.ax, co, mid - 0.02, mid + 0.02, y0, y1, T - 0.04, bz);
  }
}

/** 현관 정문 — 닫힌 유리 양문(손잡이 · 상부 틀) */
function entranceDoors(B, c) {
  const mid = (c.a0 + c.a1) / 2 / CM, co = c.coord / CM, bz = bronzeMat(), br = brassMat();
  B.alongBox(c.ax, co, mid - 1.6, mid + 1.6, 2.76, 2.86, 0.16, bz);
  B.alongBox(c.ax, co, mid - 0.02, mid + 0.02, 0, 2.76, 0.12, bz);
  for (const s of [-1, 1]) B.alongBox(c.ax, co, mid + s * 0.12 - 0.02, mid + s * 0.12 + 0.02, 0.55, 1.65, 0.1, br, -0.08);
}

function buildBoundaries() {
  const grp = new THREE.Group();
  grp.name = 'walls';
  M.occluders.length = 0;
  const B = makeBatch();
  for (const c of M.cells) {
    if (c.type === 'open' || c.type === 'stairside') continue;
    if (c.type === 'rail') { railRun(B, c); continue; }
    if (c.type === 'glass' || c.type === 'glassdoor' || c.type === 'entrance') {
      glassRun(B, c, c.type === 'glassdoor' ? c.holes : []);
      if (c.type === 'entrance') entranceDoors(B, c);
      continue;
    }
    for (const p of subtractHoles({ a0: c.a0, a1: c.a1, y0: c.y0, y1: c.y1 }, c.holes)) wallPiece(B, c, p);
    if (c.type === 'window') windowFrames(B, c);
  }
  B.flush(grp, true);
  M.scene.add(grp);
  M.wallGroup = grp;
  return grp;
}

/**
 * 북측 외벽 간판 — 필드에서 돌아보면 건물 이름이 보여야 한다.
 *
 * ⚠️ 예전엔 'H A N S H I N  M U S E U M' 을 한 줄(글자 사이 공백)로 150px 에 그렸다.
 *    글자 폭을 재지 않아서 1400px 캔버스를 넘쳤고, 가운데 정렬이라 **양 끝이 잘려**
 *    'NSHIN MUSE' 만 보였다.
 * → 대표 로고(한신 붓글씨 마크)를 왼쪽에 세우고, 오른쪽에 HANSHIN / MUSEUM 두 줄.
 *   글자 크기는 **실제로 재서** 남은 폭과 높이에 맞춘다(어떤 이름이 와도 잘리지 않는다).
 *   로고는 놋쇠 그라디언트로 다시 칠해 글자와 같은 금속으로 읽히게 한다.
 * 로고·웹폰트는 늦게 도착하므로 도착할 때마다 다시 그린다(텍스처만 갱신).
 */
function buildFacadeSign() {
  const W = 2048, H = 640;
  const cv = makeCanvas(W, H), c = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const brass = (y0, y1) => {
    const g = c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, '#FBEBB4'); g.addColorStop(0.45, '#D4AE48'); g.addColorStop(0.62, '#A8862C'); g.addColorStop(1, '#E6CC80');
    return g;
  };
  /** 자간을 준 한 줄 — 글자마다 그린다(canvas letterSpacing 이 없는 브라우저가 있다) */
  const tracked = (txt, x, y, track, fill) => {
    let cx = x;
    for (const ch of txt) {
      c.fillStyle = 'rgba(30,22,8,.55)'; c.fillText(ch, cx + 5, y + 7);   // 음영 — 벽에서 떠 보이게
      c.fillStyle = fill; c.fillText(ch, cx, y);
      cx += c.measureText(ch).width + track;
    }
  };
  const width = (txt, track) => [...txt].reduce((a, ch) => a + c.measureText(ch).width + track, 0) - track;

  const draw = (logo) => {
    c.clearRect(0, 0, W, H);
    const PAD = 36;
    let x = PAD;
    // ① 로고 — 세로형 마크를 캔버스 높이의 86% 로
    if (logo && logo.width) {
      const lh = H * 0.86, lw = logo.width * (lh / logo.height);
      const off = makeCanvas(Math.ceil(lw), Math.ceil(lh)), oc = off.getContext('2d');
      oc.drawImage(logo, 0, 0, lw, lh);
      oc.globalCompositeOperation = 'source-in';              // 원래 색을 버리고 놋쇠로 다시 칠한다
      const g = oc.createLinearGradient(0, 0, 0, lh);
      g.addColorStop(0, '#FBEBB4'); g.addColorStop(0.5, '#C9A13A'); g.addColorStop(1, '#E2C572');
      oc.fillStyle = g; oc.fillRect(0, 0, lw, lh);
      const ly = (H - lh) / 2;
      c.globalAlpha = 0.55; c.filter = 'brightness(0.25)'; c.drawImage(off, x + 6, ly + 8);   // 음영
      c.filter = 'none'; c.globalAlpha = 1;
      c.drawImage(off, x, ly);
      x += lw + 90;
      // 로고와 글자 사이 가는 세로선
      c.fillStyle = 'rgba(214,176,80,.8)'; c.fillRect(x - 46, H * 0.2, 4, H * 0.6);
    }
    // ② 글자 두 줄 — 남은 폭과 높이에 맞는 가장 큰 크기
    const lines = (SITE.posterTitle && SITE.posterTitle.length ? SITE.posterTitle : String(SITE.title || 'MUSEUM').split(' ')).slice(0, 2);
    const avail = W - x - PAD;
    let size = 300;
    for (; size > 60; size -= 6) {
      c.font = `700 ${size}px Cinzel, "Noto Serif KR", serif`;
      const tr = size * 0.1;
      if (Math.max(...lines.map((l) => width(l, tr))) <= avail && size * lines.length * 1.02 <= H * 0.9) break;
    }
    c.font = `700 ${size}px Cinzel, "Noto Serif KR", serif`;
    c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    const tr = size * 0.1, lh = size * 1.02;
    const top = (H - lh * lines.length) / 2;
    lines.forEach((ln, i) => {
      const y = top + lh * (i + 0.84);
      tracked(ln, x, y, tr, brass(y - size * 0.8, y));
    });
    tex.needsUpdate = true;
  };
  draw(null);
  const im = new Image();
  im.onload = () => { draw(im); if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => draw(im)); };
  im.onerror = () => { if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => draw(null)); };
  im.src = SITE.logo || 'assets/logo.svg';

  const m = new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.32, metalness: 0.7, alphaTest: 0.08 });
  m.userData.out = true;
  // 사진 갤러리 북측 외벽(폭 16m, 높이 5~10m) 가운데 — 벽 가장자리에 1.8m 씩 여백
  const sw = 12.4, sh = sw * H / W;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), m);
  sign.rotation.y = Math.PI;                       // 북쪽(−z)을 본다
  sign.position.set(8.0, 7.5, -0.14);
  M.scene.add(sign);
}

/** 테라스 가구 — 파라솔 테이블 몇 개(바깥에는 소화기 대신 이런 것) */
function dressOutdoor(r, g) {
  if (typeof dressZone === 'function') dressZone(r, g);        // 정문 광장 · 조각 정원 · 퍼팅 연습장(site.js)
  if (r.id !== 'terW' && r.id !== 'terE') return;
  const cloth = new THREE.MeshStandardMaterial({ color: 0xEDE6D6, roughness: 0.8, side: THREE.DoubleSide });
  const metal = new THREE.MeshStandardMaterial({ color: 0x2A2A2A, roughness: 0.4, metalness: 0.6 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x8A6A48, roughness: 0.7 });
  for (let i = 0; i < 2; i++) {
    const x = (r.x0 + r.w * (0.3 + i * 0.4)) / CM, z = (r.z0 + r.d * 0.45) / CM;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 20), wood); top.position.set(x, 0.74, z);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 8), metal); leg.position.set(x, 1.2, z);
    const um = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.45, 8, 1, true), cloth); um.position.set(x, 2.35, z);
    for (const m of [top, leg, um]) { m.castShadow = true; g.add(m); }
    for (const s of [-1, 1]) {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.05, 0.44), wood); seat.position.set(x + s * 0.8, 0.45, z);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.45, 0.44), wood); back.position.set(x + s * 1.02, 0.7, z);
      for (const m of [seat, back]) { m.castShadow = true; g.add(m); }
    }
  }
  markOut(g);
}


/* ══════════════════════════════════════════════════════════
   정적 배칭 — 방 치장(카펫·로프·현수막·석상…)을 재질별로 합친다
   ══════════════════════════════════════════════════════════
   우승자의 방 치장만 메시 264개였다. 움직이지 않고 조사 대상도 아닌 것은 재질이 같으면
   하나로 합쳐도 화면이 같다. 전시물(조사·호버 연출)과 관람객·광원은 건드리지 않는다. */
function matKey(m) {
  if (!m || m.userData.noBatch) return null;
  return [m.type, m.color && m.color.getHex(), m.emissive && m.emissive.getHex(), m.roughness, m.metalness,
    m.map && m.map.uuid, m.normalMap && m.normalMap.uuid, m.side, m.transparent, m.opacity, m.alphaTest,
    m.userData.out ? 1 : 0, m.userData.envK].join('|');
}
function batchStatic(group) {
  group.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const buckets = new Map();
  const picks = new Set(M.pickables);
  group.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material)) return;
    for (let p = o; p && p !== group; p = p.parent) if (p.userData.exhibit || p.userData.keep) return;
    if (picks.has(o) || M.artByMesh.has(o)) return;
    const g = o.geometry;
    if (!g.index || !g.attributes.normal || !g.attributes.uv) return;
    if (o.matrixWorld.determinant() < 0) return;               // 거울 변환은 면 방향이 뒤집힌다
    const k = matKey(o.material);
    if (!k) return;
    if (!buckets.has(k)) buckets.set(k, { mat: o.material, list: [] });
    buckets.get(k).list.push(o);
  });
  const m4 = new THREE.Matrix4(), n3 = new THREE.Matrix3(), v = new THREE.Vector3();
  for (const { mat, list } of buckets.values()) {
    if (list.length < 2) continue;
    const pos = [], nor = [], uv = [], idx = [];
    let off = 0, cast = false, recv = false;
    for (const o of list) {
      m4.multiplyMatrices(inv, o.matrixWorld);
      n3.getNormalMatrix(m4);
      const g = o.geometry, P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
      for (let i = 0; i < P.count; i++) {
        v.fromBufferAttribute(P, i).applyMatrix4(m4); pos.push(v.x, v.y, v.z);
        v.fromBufferAttribute(N, i).applyMatrix3(n3).normalize(); nor.push(v.x, v.y, v.z);
        uv.push(U.getX(i), U.getY(i));
      }
      const ix = g.index.array;
      for (let i = 0; i < ix.length; i++) idx.push(ix[i] + off);
      off += P.count;
      cast = cast || o.castShadow; recv = recv || o.receiveShadow;
      o.parent.remove(o);
    }
    const mg = new THREE.BufferGeometry();
    mg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    mg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    mg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    mg.setIndex(idx);
    mg.computeBoundingSphere();
    const mesh = new THREE.Mesh(mg, mat);
    mesh.castShadow = cast; mesh.receiveShadow = recv;
    group.add(mesh);
  }
}

/* ══════════════════════════════════════════════════════════
   디테일(v79) — '진짜 건물' 로 보이게 하는 작은 것들
   ══════════════════════════════════════════════════════════ */

/* ── 접촉 그늘 — 물건이 바닥에 **닿아 있게** ─────────────────
   SSAO 는 데스크톱에서만 켠다. 폰에서도 좌대·벤치가 바닥에 떠 보이지 않게
   가장자리가 풀린 그늘판을 깐다(한 장짜리, 거의 공짜). */
let CONTACT_TEX = null;
function contactTex() {
  if (CONTACT_TEX) return CONTACT_TEX;
  const S = 128, cv = makeCanvas(S, S), c = cv.getContext('2d');
  // 둥근 사각형 그늘 — 좌대는 네모라 원형 그늘이 어색했다
  c.filter = 'blur(10px)';
  c.fillStyle = 'rgba(0,0,0,.9)';
  c.fillRect(26, 26, S - 52, S - 52);
  c.filter = 'none';
  CONTACT_TEX = new THREE.CanvasTexture(cv);
  return CONTACT_TEX;
}
let CONTACT_MAT = null;
function contactShadow(w, d, k = 0.55) {
  CONTACT_MAT = CONTACT_MAT || new THREE.MeshBasicMaterial({ map: contactTex(), transparent: true, opacity: 1, depthWrite: false, color: 0x000000 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.45, d * 1.45), CONTACT_MAT.clone());
  m.material.opacity = k;
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.004;
  m.renderOrder = 1;
  m.userData.noPick = true;
  return m;
}

/* 벽 밑 그늘 띠 — 벽과 바닥이 만나는 선을 어둡게(텍스처: 벽 쪽 진하게 → 바깥 투명) */
let BASE_AO = null;
function baseAOMat() {
  if (BASE_AO) return BASE_AO;
  const cv = makeCanvas(4, 64), c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.35, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, 0, 4, 64);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = THREE.ClampToEdgeWrapping;
  BASE_AO = new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: t, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });
  BASE_AO.userData.noBatch = true;
  return BASE_AO;
}

/* ── 출입구 표기 — 벽에 붙인 글자(비닐 레터링) ────────────────
   예전엔 검은 판 위의 금색 글자(명패)였다. 현대 미술관은 벽에 글자를 바로 붙인다.
   밝은 벽에는 짙은 글자, 어두운 벽(월넛·벨벳·암막)에는 놋쇠 글자. */
const DARK_WALL = new Set(['walnut', 'velvet', 'dark']);
function signTex(name, en, onDark) {
  const W = 1024, H = 240, cv = makeCanvas(W, H), c = cv.getContext('2d');
  c.clearRect(0, 0, W, H);
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  const ink = onDark ? '#D9BC6A' : '#23211D';
  c.fillStyle = ink;
  let size = 96;
  for (; size > 40; size -= 4) { c.font = `700 ${size}px "Noto Serif KR", serif`; if (c.measureText(name).width < W - 60) break; }
  c.fillText(name, W / 2, 128);
  c.font = '500 34px Oswald, sans-serif';
  const e = String(en || '').toUpperCase().split('').join(' ');
  c.fillStyle = onDark ? 'rgba(217,188,106,.8)' : 'rgba(35,33,29,.62)';
  c.fillText(e, W / 2, 196);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* ── 천장 트랙 조명 — 액자마다 머리 하나 ─────────────────────
   스포트라이트 풀이 빛을 주지만 **빛이 어디서 오는지** 보이지 않으면 조명이 가짜처럼 보인다.
   걸린 전시물 위 천장에 레일 토막 + 조명 머리(그림을 겨눈다)를 단다. 방마다 한 메시로 합친다. */
function buildTrackFixtures() {
  const blk = new THREE.MeshStandardMaterial({ color: 0x151517, roughness: 0.45, metalness: 0.6 });
  const byRoom = new Map();
  for (const e of M.exhibits) {
    if (!e.node || e.sprite || !e.spotAnchor) continue;           // 걸린 것만(좌대·소품 제외)
    const r = M.roomById[e.room];
    if (!r || r.sky || r.outdoor) continue;
    if (!byRoom.has(r.id)) byRoom.set(r.id, []);
    byRoom.get(r.id).push(e);
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  for (const [id, list] of byRoom) {
    const r = M.roomById[id], top = r.h / CM, geos = [];
    for (const e of list) {
      const hx = (e.x + e.nx * 55) / CM, hz = (e.z + e.nz * 55) / CM;
      // 레일 토막 — 벽과 나란히
      const along = Math.abs(e.nz) > 0.5;
      geos.push(boxAt(along ? 0.7 : 0.035, 0.03, along ? 0.035 : 0.7, hx, top - 0.015, hz));
      // 줄기 + 머리(원통) — 그림 중심을 겨눈다
      const tx = e.x / CM, ty = e.y / CM, tz = e.z / CM;
      const dir = new THREE.Vector3(tx - hx, ty - (top - 0.16), tz - hz).normalize();
      const stem = new THREE.CylinderGeometry(0.008, 0.008, 0.12, 8); stem.translate(hx, top - 0.09, hz); geos.push(stem);
      const head = new THREE.CylinderGeometry(0.036, 0.03, 0.14, 16);
      q.setFromUnitVectors(up, dir.clone().negate());
      m4.compose(new THREE.Vector3(hx, top - 0.19, hz), q, new THREE.Vector3(1, 1, 1));
      head.applyMatrix4(m4); geos.push(head);
      // 렌즈 — 머리 끝의 밝은 원
      const lens = new THREE.CircleGeometry(0.026, 16);
      q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      m4.compose(new THREE.Vector3(hx, top - 0.19, hz).addScaledVector(dir, 0.071), q, new THREE.Vector3(1, 1, 1));
      lens.applyMatrix4(m4);
      e._lens = lens;
    }
    const mesh = new THREE.Mesh(mergeGeos(geos), blk);
    M.roomGroups[id].add(mesh);
    const lensMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xFFF1D6).multiplyScalar(2.2) });
    const lensMesh = new THREE.Mesh(mergeGeos(list.map((e) => e._lens).filter(Boolean)), lensMat);
    M.roomGroups[id].add(lensMesh);
  }
}

/* ── 현관 — 안내 데스크 + 층별 안내 기둥 ──────────────────── */
function directoryTex() {
  const W = 512, H = 1400, cv = makeCanvas(W, H), c = cv.getContext('2d');
  c.fillStyle = '#1C1D1B'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#C9A24A'; c.fillRect(48, 70, 60, 4);
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.fillStyle = '#F2EFE8'; c.font = '700 54px "Noto Serif KR", serif'; c.fillText('층별 안내', 48, 150);
  c.fillStyle = 'rgba(242,239,232,.6)'; c.font = '500 24px Oswald, sans-serif'; c.fillText('F L O O R   G U I D E', 48, 192);
  const block = (y, lv, rows) => {
    c.fillStyle = '#C9A24A'; c.font = '600 64px Oswald, sans-serif'; c.fillText(lv, 48, y);
    c.fillStyle = 'rgba(242,239,232,.18)'; c.fillRect(48, y + 22, W - 96, 2);
    rows.forEach(([kr, en], i) => {
      c.fillStyle = '#F2EFE8'; c.font = '600 32px "Noto Serif KR", serif'; c.fillText(kr, 48, y + 82 + i * 78);
      c.fillStyle = 'rgba(242,239,232,.5)'; c.font = '400 20px Oswald, sans-serif'; c.fillText(en, 48, y + 110 + i * 78);
    });
  };
  block(320, '2F', [['사진 갤러리', 'PHOTOGRAPHY'], ['우승자의 방', 'HALL OF THE CHAMPION'], ['2층 회랑 · 전망 데크', 'MEZZANINE · DECK']]);
  block(640, '1F', [['명예의 전당', 'HALL OF FAME'], ['트로피실', 'TROPHY ROOM'], ['기록 보관실', 'ARCHIVE'], ['상영관', 'SCREENING ROOM'], ['그랜드 홀 · 라운지', 'GRAND HALL · LOUNGE']]);
  block(1110, '18', [['18번 홀', 'THE 18TH — 라운지에서 테라스로']]);
  c.fillStyle = '#9BE36A'; c.fillRect(48, H - 88, 14, 14);
  c.fillStyle = 'rgba(242,239,232,.75)'; c.font = '500 22px "Noto Serif KR", serif'; c.fillText('현재 위치 — 1F 현관', 74, H - 74);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function dressFoyer(r, g) {
  const O = objMat();
  // 안내 데스크 — 동쪽, 서쪽(현관 가운데)을 본다. 오크 루버 앞판 + 흰 석재 상판
  const dx = (r.x1 - 230) / CM, dz = r.cz / CM;
  const body = rbox(0.72, 1.02, 3.0, 0.02, O.white); body.position.set(dx, 0.51, dz); g.add(body);
  const slats = [];
  for (let i = 0; i < 26; i++) slats.push(boxAt(0.03, 0.9, 0.05, dx - 0.37, 0.5, dz - 1.44 + i * 0.115));
  const lv = new THREE.Mesh(mergeGeos(slats), O.oak); lv.castShadow = true; g.add(lv);
  const top = rbox(0.86, 0.045, 3.12, 0.012, O.marble); top.position.set(dx, 1.045, dz); g.add(top);
  const kick = boxAt(0.66, 0.06, 2.94, dx + 0.02, 0.03, dz); g.add(new THREE.Mesh(kick, O.black));
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.2),
    new THREE.MeshStandardMaterial({ map: signTex('안내', 'INFORMATION', false), transparent: true, alphaTest: 0.1 }));
  sign.position.set(dx - 0.395, 0.82, dz); sign.rotation.y = -Math.PI / 2; g.add(sign);
  // 모니터와 서류 받침 — 데스크가 쓰이는 자리처럼
  const mon = rbox(0.04, 0.3, 0.5, 0.01, O.black); mon.position.set(dx + 0.12, 1.25, dz + 0.6); mon.rotation.y = 0.25; g.add(mon);
  const stand = boxAt(0.04, 0.12, 0.06, dx + 0.14, 1.12, dz + 0.6); g.add(new THREE.Mesh(stand, O.black));
  const tray = rbox(0.24, 0.03, 0.32, 0.006, O.walnut); tray.position.set(dx - 0.18, 1.085, dz - 0.7); g.add(tray);
  { const cs = contactShadow(0.8, 3.1, 0.45); cs.position.set(dx, 0.004, dz); g.add(cs); }

  // 층별 안내 기둥 — 서쪽, 들어오는 사람을 본다
  const tx = (r.x0 + 260) / CM, tz = (r.z0 + 160) / CM;
  const post = rbox(0.62, 2.1, 0.12, 0.012, O.steelD); post.position.set(tx, 1.05, tz); post.rotation.y = 0.35; g.add(post);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 1.53), new THREE.MeshStandardMaterial({ map: directoryTex(), roughness: 0.6 }));
  const fz = new THREE.Vector3(0, 1.12, 0.062).applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.35);
  face.position.set(tx + fz.x, fz.y, tz + fz.z); face.rotation.y = 0.35; g.add(face);
  const base = rbox(0.8, 0.04, 0.34, 0.01, O.steelD); base.position.set(tx, 0.02, tz); base.rotation.y = 0.35; g.add(base);
  { const cs = contactShadow(0.7, 0.3, 0.45); cs.position.set(tx, 0.004, tz); cs.rotation.z = -0.35; g.add(cs); }
}

