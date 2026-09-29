/**
 * npc.js — 관람객 (3D 인물)
 *
 * 리디자인 전에는 **항상 카메라를 보는 컷아웃**(빌보드)이었다. 전시관이 어둡고 거칠던 때는
 * 실루엣으로 충분했지만, 해·반사·마감이 들어온 새 공간에서는 종이 인형으로 튀었다.
 *
 * 새 관람객은 건축 투시도의 인물처럼 만든다 — 얼굴은 그리지 않고(익명), 몸의 비례·옷·
 * 머리 모양·걸음으로 사람을 구분한다.
 *   · 부위는 다섯 덩어리: 몸통(머리·머리카락·목도리·가방 포함) · 두 팔 · 두 다리.
 *     팔다리는 어깨·엉덩이 관절에 매달려 걸을 때 흔들린다.
 *   · 색은 **정점 색**으로 준다 → 모든 관람객이 재질 하나를 쓴다(관람객 1명 = 그리기 5번).
 *   · 걸을 때는 가는 쪽을, 멈추면 **전시물을** 본다. 멈춰 있을 때는 숨 쉬듯 아주 조금 흔들린다.
 *
 * 관람객은 방 그룹에 넣는다 → 방이 컬링되면 함께 사라진다(비용 0).
 * 조사하면 차림새로 부른다 — 본관은 관람객의 이름을 기록하지 않는다.
 */

/* 관람객 개인차 — 키·체형·옷·머리 모양이 겹치지 않게 조합한다.
   hair: short | bun | long | cap | thin   (cap 은 골프캡 — 이 관에 어울린다) */
const NPC_KIND = [
  { coat: '#2F3B4E', pants: '#1E2229', shoe: '#1A1614', h: 1.74, build: 1.04, len: 0.95, scarf: '#9A3A36', bag: false,
    hair: 'short', hairC: '#1E1712', skin: '#C9A07E', label: '목도리를 두른 관람객', wear: '남색 셔츠', sneak: '#E8E6E0' },
  { coat: '#B89A72', pants: '#3A3027', shoe: '#2A1E16', h: 1.64, build: 0.94, len: 0.62, scarf: null, bag: true,
    hair: 'bun', hairC: '#3A2A1E', skin: '#D8B090', label: '가방을 멘 관람객', wear: '베이지 셔츠', sneak: '#6A4E36' },
  { coat: '#465A3E', pants: '#22281F', shoe: '#1A1A1A', h: 1.79, build: 1.08, len: 0.5, scarf: null, bag: false,
    hair: 'cap', hairC: '#20241E', skin: '#B98A66', label: '모자를 쓴 관람객', wear: '올리브 셔츠', sneak: '#2A2A2A' },
  { coat: '#E6DFD2', pants: '#2C2A2E', shoe: '#1E1C1C', h: 1.62, build: 0.92, len: 1.0, scarf: '#35505E', bag: true,
    hair: 'long', hairC: '#2A1C14', skin: '#DDB594', label: '오래 머무는 관람객', wear: '흰 셔츠', sneak: '#F2F2F2' },
  { coat: '#3A3A40', pants: '#26262B', shoe: '#141414', h: 1.76, build: 1.0, len: 0.55, scarf: null, bag: false,
    hair: 'thin', hairC: '#5A5048', skin: '#C29474', label: '혼자 온 관람객', wear: '회색 셔츠', sneak: '#8A8A8A' },
  { coat: '#6B2E34', pants: '#2B2224', shoe: '#1C1414', h: 1.68, build: 0.97, len: 0.8, scarf: '#C9A45A', bag: false,
    hair: 'short', hairC: '#2A1E16', skin: '#CFA283', label: '천천히 도는 관람객', wear: '와인색 셔츠', sneak: '#D8D4CC' },
];

/* ── 지오메트리 도우미 ─────────────────────────────────── */
const NPC_COL = new THREE.Color();
/** 지오메트리에 정점 색을 칠한다 */
function npcPaint(geo, hex, k = 1) {
  NPC_COL.set(hex).multiplyScalar(k);
  const n = geo.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = NPC_COL.r; a[i * 3 + 1] = NPC_COL.g; a[i * 3 + 2] = NPC_COL.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return geo;
}
/** 색 칠한 지오메트리 여럿 → 하나 (위치·법선·색) */
function npcMerge(list) {
  const pos = [], nor = [], col = [], idx = [];
  let off = 0;
  for (const g0 of list) {
    const g = g0.index ? g0 : g0.toNonIndexed();
    const P = g.attributes.position, N = g.attributes.normal, C = g.attributes.color;
    for (let i = 0; i < P.count; i++) {
      pos.push(P.getX(i), P.getY(i), P.getZ(i)); nor.push(N.getX(i), N.getY(i), N.getZ(i));
      col.push(C.getX(i), C.getY(i), C.getZ(i));
    }
    if (g.index) { const ix = g.index.array; for (let i = 0; i < ix.length; i++) idx.push(ix[i] + off); }
    else for (let i = 0; i < P.count; i++) idx.push(off + i);
    off += P.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  out.setIndex(idx);
  out.computeBoundingSphere();
  return out;
}
/** 캡슐 — 가운데가 (x,y,z), 길이는 둥근 끝을 뺀 몸통 길이 */
const npcCap = (r, len, hex, x, y, z, sx = 1, sz = 1) => {
  const g = new THREE.CapsuleGeometry(r, len, 5, 12);
  g.scale(sx, 1, sz); g.translate(x, y, z);
  return npcPaint(g, hex);
};
const npcBall = (r, hex, x, y, z, sx = 1, sy = 1, sz = 1) => {
  const g = new THREE.SphereGeometry(r, 16, 12);
  g.scale(sx, sy, sz); g.translate(x, y, z);
  return npcPaint(g, hex);
};
const npcBox = (w, h, d, hex, x, y, z) => {
  const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z);
  return npcPaint(g, hex);
};

let NPC_MAT = null;
const npcMat = () => NPC_MAT || (NPC_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0 }));

/**
 * 관람객 한 명 — { root, body, armL, armR, legL, legR, hM }
 * 원점 = 발 사이, 정면 = +z. 모든 치수는 키(h)에 비례한다.
 */
function buildVisitor(K, i = 0) {
  // v89 — 실사 사람 모델(people.js)을 받았으면 그것(v90: 얼굴이 다른 일곱 명을 번갈아). 못 받으면 아래 덩어리 인물
  if (typeof peopleReady === 'function' && peopleReady()) return buildRealVisitor({ ...K, shoe: K.sneak }, i);
  const H = K.h, s = H / 1.72, b = K.build || 1;
  const hipY = 0.93 * s, shY = 1.42 * s, headY = 1.60 * s;
  const coat = K.coat, dark = '#0E0E10';

  // ── 몸통 덩어리 ──
  const parts = [];
  parts.push(npcCap(0.17 * s * b, 0.36 * s, coat, 0, (hipY + shY) / 2 + 0.02 * s, 0, 1.0, 0.68));   // 상체
  parts.push(npcCap(0.155 * s * b, 0.08 * s, K.pants, 0, hipY + 0.02 * s, 0, 1.05, 0.72));            // 골반
  if (K.len > 0.6) {
    // 코트 자락 — 무릎 쪽으로 퍼지는 원뿔대
    const L = 0.22 * s + K.len * 0.2 * s;
    const skirt = new THREE.CylinderGeometry(0.17 * s * b, 0.21 * s * b, L, 16, 1, true);
    skirt.scale(1, 1, 0.74); skirt.translate(0, hipY - L / 2 + 0.06 * s, 0);
    parts.push(npcPaint(skirt, coat, 0.94));
  }
  parts.push(npcCap(0.045 * s, 0.06 * s, K.skin, 0, shY + 0.06 * s, 0));                              // 목
  parts.push(npcBall(0.105 * s, K.skin, 0, headY, 0.005, 0.92, 1.08, 1.0));                            // 머리
  // 머리 모양
  const hc = K.hairC;
  if (K.hair === 'cap') {
    const cap = new THREE.SphereGeometry(0.112 * s, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5);
    cap.translate(0, headY + 0.02 * s, 0); parts.push(npcPaint(cap, K.coat, 0.7));
    parts.push(npcBox(0.16 * s, 0.012 * s, 0.1 * s, K.coat, 0, headY + 0.03 * s, 0.1 * s));            // 챙
  } else if (K.hair === 'bun') {
    const top = new THREE.SphereGeometry(0.112 * s, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55);
    top.translate(0, headY + 0.01 * s, -0.004); parts.push(npcPaint(top, hc));
    parts.push(npcBall(0.05 * s, hc, 0, headY + 0.07 * s, -0.09 * s));
  } else if (K.hair === 'long') {
    const top = new THREE.SphereGeometry(0.115 * s, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.6);
    top.translate(0, headY + 0.01 * s, -0.006); parts.push(npcPaint(top, hc));
    parts.push(npcCap(0.085 * s, 0.14 * s, hc, 0, headY - 0.1 * s, -0.045 * s, 1.15, 0.55));          // 뒤로 내린 머리
  } else if (K.hair === 'thin') {
    const top = new THREE.SphereGeometry(0.109 * s, 16, 8, 0, Math.PI * 2, Math.PI * 0.3, Math.PI * 0.3);
    top.translate(0, headY, -0.008); parts.push(npcPaint(top, hc));
  } else {
    const top = new THREE.SphereGeometry(0.113 * s, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.52);
    top.translate(0, headY + 0.012 * s, -0.006); parts.push(npcPaint(top, hc));
  }
  if (K.scarf) {
    const sc = new THREE.TorusGeometry(0.075 * s, 0.03 * s, 8, 18);
    sc.rotateX(Math.PI / 2); sc.translate(0, shY + 0.04 * s, 0.005);
    parts.push(npcPaint(sc, K.scarf));
    parts.push(npcBox(0.06 * s, 0.22 * s, 0.03 * s, K.scarf, 0.05 * s, shY - 0.1 * s, 0.1 * s));      // 늘어진 끝
  }
  if (K.bag) {
    parts.push(npcBox(0.26 * s, 0.2 * s, 0.09 * s, '#3A2A1E', 0.2 * s * b, hipY + 0.02 * s, 0.02));    // 옆구리 가방
    const strap = new THREE.TorusGeometry(0.24 * s, 0.01 * s, 6, 24, Math.PI * 0.9);
    strap.rotateZ(Math.PI * 0.62); strap.translate(0.02 * s, shY - 0.1 * s, 0.01);
    parts.push(npcPaint(strap, '#2A1E14'));
  }
  const mat = npcMat();
  const body = new THREE.Mesh(npcMerge(parts), mat);

  // ── 팔 — 어깨에 매달린다(피벗 = 어깨) ──
  const arm = (side) => {
    const g = new THREE.Group();
    g.position.set(side * 0.2 * s * b, shY - 0.02 * s, 0);
    const L = 0.54 * s;
    const geo = npcMerge([
      npcCap(0.048 * s * b, 0.26 * s, coat, 0, -0.16 * s, 0),
      npcCap(0.042 * s * b, 0.22 * s, coat, 0, -0.4 * s, 0.01 * s),
      npcBall(0.045 * s, K.skin, 0, -L - 0.02 * s, 0.015 * s, 0.9, 1.15, 0.8),
    ]);
    g.add(new THREE.Mesh(geo, mat));
    g.rotation.z = side * 0.06;
    return g;
  };
  // ── 다리 — 엉덩이에 매달린다(피벗 = 엉덩이) ──
  const leg = (side) => {
    const g = new THREE.Group();
    g.position.set(side * 0.085 * s, hipY, 0);
    const geo = npcMerge([
      npcCap(0.068 * s * b, 0.36 * s, K.pants, 0, -0.24 * s, 0),
      npcCap(0.056 * s, 0.34 * s, K.pants, 0, -0.62 * s, 0),
      npcBox(0.1 * s, 0.07 * s, 0.26 * s, K.shoe, 0, -hipY + 0.035 * s, 0.05 * s),
    ]);
    g.add(new THREE.Mesh(geo, mat));
    return g;
  };
  const root = new THREE.Group();
  const armL = arm(1), armR = arm(-1), legL = leg(1), legR = leg(-1);
  root.add(body, armL, armR, legL, legR);
  root.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; o.material.userData.noBatch = true; } });
  return { root, body, armL, armR, legL, legR, hM: H };
}

/** 접지 그림자 텍스처 — 원판이 아니라 가장자리가 풀린 타원 */
let NPC_SHADOW_TEX = null;
function npcShadowTex() {
  if (NPC_SHADOW_TEX) return NPC_SHADOW_TEX;
  const S = 128, cv = makeCanvas(S, S), c = cv.getContext('2d');
  const g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(0,0,0,.55)');
  g.addColorStop(0.55, 'rgba(0,0,0,.26)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, 0, S, S);
  NPC_SHADOW_TEX = new THREE.CanvasTexture(cv);
  return NPC_SHADOW_TEX;
}

/**
 * 관람객 배치 — 전시실마다 한 명.
 * @param {object} M  museum3d 의 상태 객체
 */
async function buildNpcs(M) {
  // v92 — 사람 모델은 뒤에서 받는 중일 수 있다. 입장을 막지 않고, 다 오면(최대 40초) 그때 세운다
  if (typeof PEOPLE !== 'undefined' && !PEOPLE.ok && PEOPLE.p && !M.npcWait) {
    M.npcWait = true; M.npcs = [];
    Promise.race([PEOPLE.p, new Promise((r) => setTimeout(r, 40000))]).then(() => buildNpcs(M));
    return;
  }
  M.npcs = [];
  // 전시실에만 — 계단·바깥·조각 공간(라운지 등)에는 세우지 않는다
  const rooms = M.rooms.filter((r) => !r.closed && !r.secret && !r.stair && !r.outdoor && !r.part
    && M.exhibits.some((e) => e.room === r.id && e.vx != null && e.type !== 'prop'));
  let i = 0;
  for (const r of rooms) {
    const kind0 = NPC_KIND[i % NPC_KIND.length];
    const v = buildVisitor(kind0, i);
    // 실사 관람객은 모자·목도리·가방이 없다 — 옷(또는 그 사람의 생김새)으로 부른다
    const kind = v.real ? { ...kind0, label: v.label || kind0.wear + '의 관람객', wear: v.wear || kind0.wear, hair: '', scarf: null, bag: false, real: true } : kind0;
    const start = M.exhibits.find((e) => e.room === r.id && e.vx != null && e.type !== 'prop');
    const npc = {
      room: r.id, kind, v, name: kind.label, hM: v.hM,
      x: start.vx, z: start.vz, tx: start.vx, tz: start.vz, lx: start.x, lz: start.z,
      yaw: Math.atan2(start.x - start.vx, start.z - start.vz),
      wait: 1 + i * 0.7, speed: 0.62 + (i % 3) * 0.07, phase: i * 1.3, walkK: 0,
      mutter: i % 2 === 1,                 // v96 — 혼잣말하는 사람(구석을 보고 중얼거린다) · v99 둘 → 셋
    };
    // v92 — 실사 관람객은 **제 걸음 폭 · 박자 그대로의 속도**로 걷는다. 예전엔 정해 둔 속도(0.62~0.76m/s)에
    //       걸음 클립을 느리게 틀어 맞춰서 슬로 모션처럼 보였다(사람은 천천히 걸을 때 박자보다 보폭을 줄인다)
    if (v.real && v.natural) npc.speed = v.natural * (0.95 + (i % 3) * 0.04);
    v.root.position.set(npc.x / CM, 0, npc.z / CM);
    v.root.rotation.y = npc.yaw;

    const sh = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.42),
      new THREE.MeshBasicMaterial({ map: npcShadowTex(), transparent: true, opacity: 0.85, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2;
    sh.position.set(npc.x / CM, 0.012, npc.z / CM);
    npc.shadow = sh;

    // 조사 대상 — M.exhibits 에는 넣지 않는다(소장품 수·관람률이 오염된다)
    const hit = new THREE.Mesh(new THREE.BoxGeometry(0.55, v.hM, 0.55),
      new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set(npc.x / CM, v.hM / 2, npc.z / CM);
    npc.hit = hit;
    npc.info = {
      id: 'npc-' + r.id, type: 'placard', icon: '🧑', label: kind.label,
      title: kind.label, subtitle: '관람객 · ' + r.name,
      x: npc.x, z: npc.z, y: 120,
      room: r.id,
      body: npcSay(kind, r, npc.mutter),
    };
    Object.defineProperty(npc.info, 'npcRef', { value: npc });      // v99 — 조사하면 먼저 대답한다(crowd.js npcAsk)
    M.pickables.push(hit);
    M.artByMesh.set(hit, npc.info);

    const g = M.roomGroups[r.id];
    if (g) g.add(v.root, sh, hit);
    M.npcs.push(npc);
    i++;
  }
  // v96 — 바깥에도 드문드문(아이 둘 · 서성이는 사람 · 지켜보는 사람) — crowd.js
  if (typeof buildOutdoorNpcs === 'function') buildOutdoorNpcs(M);
}

/** 관람객 해설 — 이름이 없으므로 차림새로 부른다 */
function npcSay(K, r, mutter) {
  const L = [];
  const look = {
    short: '짧은 머리에', bun: '머리를 묶고', long: '긴 머리에',
    cap: '골프 모자를 쓰고', thin: '숱이 적은 머리에',
  }[K.hair] || '';
  const wear = K.real ? K.wear + '를 입은' : K.scarf ? '목도리를 두른' : (K.bag ? '가방을 멘' : '코트를 입은');
  L.push(`${look} ${wear} 사람이 서 있다.`.trim());
  // v96 — 조금씩 어긋나게
  const byRoom = {
    portraits: '초상들을 차례로 올려다보고 있다. 아는 얼굴을 찾는 눈이다. 제 얼굴을 찾는 것 같기도 하다.',
    photos: '사진을 하나하나 들여다보고 있다. 한 장 앞에서 유난히 오래 멈춘다. 뒷줄 끝, 흐릿한 사람 앞에서.',
    clips: '화면 앞에 서 있다. 영상이 끝나도 자리를 뜨지 않는다. 검은 화면에 비친 제 얼굴을 보고 있다.',
    trophies: '명패를 읽고 있다. 받고 싶지 않은 상도 끝까지 읽는다. 입술이 이름을 따라 움직인다.',
    champion: '초상을 올려다보고 있다. 초상도 이 사람을 내려다보고 있다.',
    lobby: '안내판을 읽는 척하면서 방명록 쪽을 보고 있다. 방명록의 마지막 줄은 아직 비어 있다.',
    scorecards: '스코어카드를 들여다보고 있다. 고쳐 쓴 자리를 유심히 본다. 제 글씨라고 한다.',
  };
  L.push(byRoom[r.content] || '전시를 보고 있다.');
  if (mutter) L.push('가끔 벽 쪽으로 돌아서서 무언가를 중얼거린다. 대답하는 목소리는 없다.');
  L.push('');
  L.push('이름을 묻지 않았다. 본관은 관람객의 이름을 기록하지 않는다. 기억할 뿐이다.');
  L.push('※ 관람객은 소장품이 아닙니다. 아직은.');
  return L.join(String.fromCharCode(10));
}

/** 각도 차 — -π..π */
const npcAng = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * 관람객 갱신 — 전시물 관람 위치 사이를 걸어다니고, 멈추면 전시물을 본다.
 * @param {object} M  museum3d 상태
 * @param {number} dt 초
 */
function stepNpcs(M, dt) {
  if (!M.npcs) return;
  if (typeof stepCrowd === 'function') return stepCrowd(M, dt);      // v91 — 방을 옮겨 다니고 대화한다(crowd.js)
  for (const n of M.npcs) {
    const g = M.roomGroups[n.room];
    if (g && g.visible === false) continue;           // 보이지 않는 방이면 계산도 하지 않는다

    const dx = n.tx - n.x, dz = n.tz - n.z;
    const dist = Math.hypot(dx, dz);
    const walking = dist >= 12;
    let want;
    if (!walking) {
      n.wait -= dt;
      want = Math.atan2(n.lx - n.x, n.lz - n.z);      // 전시물을 본다
      if (n.wait <= 0) {
        const spots = M.exhibits.filter((e) => e.room === n.room && e.vx != null && e.type !== 'prop');
        if (spots.length) {
          const s = spots[Math.floor((n.phase * 7.3 + M.t * 1.7) % spots.length)];
          n.tx = s.vx; n.tz = s.vz; n.lx = s.x; n.lz = s.z;
        }
        n.wait = 4 + ((n.phase * 3.1) % 5);
      }
    } else {
      const v = n.speed * 100 * dt;
      n.x += (dx / dist) * Math.min(v, dist);
      n.z += (dz / dist) * Math.min(v, dist);
      n.phase += dt * n.speed * 7.2;
      want = Math.atan2(dx, dz);
    }
    // 몸을 돌리는 것도 서서히 — 뚝뚝 꺾이면 로봇처럼 보인다
    n.yaw += npcAng(want - n.yaw) * Math.min(1, dt * 4);
    n.walkK += ((walking ? 1 : 0) - n.walkK) * Math.min(1, dt * 6);

    const v = n.v, k = n.walkK, sw = Math.sin(n.phase);
    if (v.real) {
      // 실사 — 걷기/서 있기 클립을 섞는다. 걷기 빠르기는 실제 이동 속도에 맞춘다(발이 미끄러지지 않게)
      v.walk.setEffectiveWeight(k); v.idle.setEffectiveWeight(1 - k);
      v.walk.timeScale = n.speed / v.natural;
      v.mixer.update(dt);
      v.root.position.set(n.x / CM, 0, n.z / CM);
      v.root.rotation.y = n.yaw;
      n.shadow.position.set(n.x / CM, 0.012, n.z / CM);
      n.hit.position.set(n.x / CM, n.hM / 2, n.z / CM);
      n.info.x = n.x; n.info.z = n.z;
      continue;
    }
    v.legL.rotation.x = sw * 0.46 * k;
    v.legR.rotation.x = -sw * 0.46 * k;
    v.armL.rotation.x = -sw * 0.36 * k + (1 - k) * 0.05;
    v.armR.rotation.x = sw * 0.36 * k + (1 - k) * 0.05;
    // 멈춰 있을 때 — 숨 쉬듯 아주 느리게, 고개는 전시물 쪽으로 살짝 든다
    const breathe = Math.sin(M.t * 1.3 + n.phase) * 0.006 * (1 - k);
    v.body.position.y = Math.abs(Math.cos(n.phase)) * 0.028 * k + breathe;
    v.body.rotation.z = sw * 0.02 * k;
    v.root.position.set(n.x / CM, 0, n.z / CM);
    v.root.rotation.y = n.yaw;
    n.shadow.position.set(n.x / CM, 0.012, n.z / CM);
    n.hit.position.set(n.x / CM, n.hM / 2, n.z / CM);
    n.info.x = n.x; n.info.z = n.z;                  // 조사 사거리 판정용
  }
}
