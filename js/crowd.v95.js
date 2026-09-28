/* ══════════════════════════════════════════════════════════
   관람객 무리 — 방을 옮겨 다니고, 마주치면 대화하고, 서로 비켜 지나간다(v91)
   ══════════════════════════════════════════════════════════
   예전 관람객은 제 방 안의 전시물 사이만 오갔다(일곱 명이 각자 방 하나씩 — 서로 만날 일이 없었다).
     · 길 — 같은 층 실내 방을 잇는 문 · 트인 경계를 그래프로 만든다. 문 앞(안쪽 80cm) → 문 가운데 → 건너편 80cm
     · 대화 — 같은 방에서 둘 다 전시를 보고 있으면 가끔 서로에게 다가가 1.1m 앞에서 마주 선다.
       말하는 사람은 팔을 들어 손짓하고, 듣는 사람은 고개를 끄덕인다. 번갈아 말한다.
       가까이(9m) 가면 말풍선이 뜬다 — 버디버디 회원들이 할 법한 이야기
     · 비켜 가기 — 걷는 사람끼리(그리고 나와) 1.2m 안으로 들어오면 옆으로 비켜 지나간다
   손짓 · 끄덕임은 애니메이션 클립 위에 뼈를 월드 축으로 조금 더 돌려 얹는다(클립을 다시 굽지 않는다). */

const CROWD = { graph: null, t: 0, pairT: 0 };
const TALKS = [
  ['이 트로피, 작년 최종전 거 맞지?', '응. 그날 비 엄청 왔잖아.', '그래도 끝까지 다 쳤지.'],
  ['사진 속에 너 있다!', '아… 그 벙커샷. 지우고 싶다.', '공은 나왔잖아. 세 번 만에.'],
  ['18번 홀 호수 넘겨 봤어?', '두 번 빠졌어. 공 아직 바닥에 있을걸.', '잠수하면 보인대.'],
  ['끝나고 한 라운드 어때?', '좋지. 이번엔 멀리건 없기.', '… 하나만 쓰자.'],
  ['옛날 스코어카드 보니까 백 개 넘게 쳤네.', '그땐 다 그랬어. 지금은 90대!', '후반만 90대지.'],
  ['우승자의 방 봤어?', '봤지. 초상이 너무 진지해.', '우승할 땐 원래 그래.'],
  ['퍼팅 연습장 가서 내기할래?', 'OK 거리는 한 뼘이다.', '두 뼘.'],
  ['카트 타 봤어? 생각보다 빨라.', '나무에 박을 뻔했어.', '브레이크는 스페이스야.'],
  ['이 사진 몇 년도야?', '창단 첫 해. 다들 폼이 엉망이야.', '지금도 크게 다르진 않아.'],
  ['홀인원 기록은 누구 거야?', '아직 아무도 없대.', '그럼 오늘이다.'],
  ['여기 조명 좋다.', '전시관 같지? 우리 사진인데.', '우리 사진이라 더 좋다.'],
  ['다음 달 정기전 코스 어디야?', '공지 떴어. 이번엔 산악 코스.', '공 많이 챙겨야겠다.'],
];

/* ── 선수 이야기(v95) — 실제 기록(랭킹 · 라운드 · 영상)에서 대사를 만든다 ───────────────
   방 주제에 맞춰 고른다: 트로피실은 1위 · 버디왕 · 이글, 명예의 전당은 멤버 근황 · 개근,
   기록 보관실은 베스트 스코어 · 자주 가는 코스, 상영관은 영상, 우승자의 방은 최근 우승자 · 다승 */
function crowdTopics() {
  if (CROWD.topics) return CROWD.topics;
  const A = M.archive || {}, P = (A.players || []).filter((p) => p && p.name);
  const J = (w, a, b) => (typeof josa === 'function' ? josa(w, a, b) : a);
  const f1 = (v) => (+v).toFixed(1);
  const T = { trophies: [], portraits: [], scorecards: [], clips: [], champion: [], photos: [], any: [] };
  const top = (f) => P.slice().sort((a, b) => f(b) - f(a))[0];
  if (P.length) {
    const r1 = P.slice().sort((a, b) => (a.rank || 99) - (b.rank || 99))[0];
    if (r1 && r1.avgStrokes) T.trophies.push([`올해 1위가 ${r1.name}${J(r1.name, '이', '가')}지?`, `평균 ${f1(r1.avgStrokes)}타래. 넘사벽이야.`, '나도 저렇게 치고 싶다.']);
    const bs = P.filter((p) => p.best).sort((a, b) => a.best - b.best)[0];
    if (bs) T.scorecards.push([`${bs.name} 베스트가 ${bs.best}타래.`, '그날 퍼터가 불이었대.', '언젠가 나도 깬다.']);
    const bd = top((p) => p.birdies || 0);
    if (bd && bd.birdies) T.trophies.push([`버디왕은 ${bd.name}${J(bd.name, '이야', '야')}.`, `버디 ${bd.birdies}개? 말이 돼?`, '파 세이브도 잘하더라.']);
    const wn = top((p) => p.roundWins || 0);
    if (wn && wn.roundWins) T.champion.push([`${wn.name} 우승 몇 번 했지?`, `${wn.roundWins}번. 우승자의 방 단골이야.`, '이번엔 좀 쉬어 가라고 해.']);
    const at = top((p) => p.roundsCompleted || 0);
    if (at) T.portraits.push([`${at.name}${J(at.name, '이', '가')} 라운드 제일 많이 나왔대.`, `${at.roundsCompleted}번이나. 개근상이지.`, '성실함이 곧 실력이야.']);
    const eg = P.find((p) => (p.hio || 0) > 0) || P.find((p) => (p.eagles || 0) > 0);
    if (eg) T.trophies.push([`${eg.name} ${eg.hio ? '홀인원' : '이글'} 기록 있대!`, '진짜? 어느 홀에서?', '본인은 아직도 그 얘기만 해.']);
    for (const p of P.slice(0, 14)) {
      if (p.avgStrokes) T.portraits.push([`요즘 ${p.name} 폼 어때?`, `평균 ${f1(p.avgStrokes)}타. 많이 늘었어.`, '다음 라운드가 기대된다.']);
      if (p.best && p.avgStrokes) T.photos.push([`이 사진 ${p.name} 아니야?`, `맞아. 베스트 ${p.best}타 친 날이래.`, '그래서 표정이 좋구나.']);
    }
  }
  const w = typeof recentWinner === 'function' ? recentWinner(A) : null;
  if (w) T.champion.push([`지난번${w.round.course ? ' ' + w.round.course : ''} 라운드 누가 이겼어?`,
    `${w.name}${J(w.name, '이', '가')}.${w.round.best != null ? ' ' + w.round.best + '타로.' : ''}`, '초상 봤어? 표정이 비장하더라.']);
  const cnt = {};
  for (const r of A.rounds || []) if (r.course) cnt[r.course] = (cnt[r.course] || 0) + 1;
  const cs = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
  if (cs) T.scorecards.push([`${cs[0]} 요즘 자주 가네.`, `벌써 ${cs[1]}번째야. 거기 그린 빠르지.`, '벙커만 조심하면 돼.']);
  for (const c of (A.clips || []).slice(0, 8)) {
    if (!c.title) continue;
    T.clips.push([`'${c.title}' 영상 봤어?`, c.players ? `${c.players} 나오는 거? 봤지.` : '봤지. 몇 번을 돌려 봤어.',
      c.comment_count ? `댓글이 ${c.comment_count}개나 달렸더라.` : '다시 봐도 웃겨.']);
  }
  T.any = [...T.portraits, ...T.trophies.slice(0, 2), ...T.champion.slice(0, 1), ...T.clips.slice(0, 2)];
  CROWD.topics = T;
  return T;
}
/** 이 방에서 나눌 이야기 — 방 주제 쪽으로 기운다. 가끔은 흔한 잡담 */
function crowdLines(room) {
  const T = crowdTopics(), r = M.roomById[room], k = r && r.content;
  const pool = [].concat(T[k] || [], T[k] || [], T.any);
  if (pool.length && Math.random() < 0.75) return pool[Math.floor(Math.random() * pool.length)];
  return TALKS[Math.floor(Math.random() * TALKS.length)];
}

/* ── 길 그래프 ─────────────────────────────────────────── */
function crowdOk(r) { return r && !r.outdoor && !r.stair && !r.secret && !r.closed; }
function crowdGraph() {
  if (CROWD.graph) return CROWD.graph;
  const G = new Map();
  const add = (a, b, p, ia, ib) => { if (!G.has(a.id)) G.set(a.id, []); G.get(a.id).push({ to: b.id, p, from: ia, into: ib }); };
  for (const c of M.cells || []) {
    if (c.type !== 'door' && c.type !== 'open') continue;
    const a = c.neg, b = c.pos;
    if (!crowdOk(a) || !crowdOk(b) || Math.abs(a.y0 - b.y0) > 1) continue;
    const h = c.type === 'door' ? c.hole : null;
    if (c.type === 'open' && c.a1 - c.a0 < 120) continue;
    const m = h ? (h.a0 + h.a1) / 2 : (c.a0 + c.a1) / 2;
    const p = c.ax === 'v' ? { x: c.coord, z: m } : { x: m, z: c.coord };
    // 문 양쪽 80cm — 어느 쪽이 어느 방인지는 실제로 재 본다
    const o = c.ax === 'v' ? [{ x: p.x - 90, z: p.z }, { x: p.x + 90, z: p.z }] : [{ x: p.x, z: p.z - 90 }, { x: p.x, z: p.z + 90 }];
    const pa = inRect(a, o[0].x, o[0].z) ? o[0] : o[1], pb2 = pa === o[0] ? o[1] : o[0];
    add(a, b, p, pa, pb2); add(b, a, p, pb2, pa);
  }
  CROWD.graph = G;
  return G;
}
/** 방 → 방 길(문 목록) — 너비 우선 */
function crowdRoute(from, to) {
  const G = crowdGraph(), prev = new Map([[from, null]]), q = [from];
  while (q.length) {
    const id = q.shift(); if (id === to) break;
    for (const e of G.get(id) || []) if (!prev.has(e.to)) { prev.set(e.to, { id, e }); q.push(e.to); }
  }
  if (!prev.has(to)) return null;
  const out = []; let cur = to;
  while (prev.get(cur)) { const s = prev.get(cur); out.unshift(s.e); cur = s.id; }
  return out;
}
/** 방 안에서 볼 자리 — 전시물 관람 위치, 없으면 방 안 빈 곳 */
function crowdSpot(room, n) {
  const spots = M.exhibits.filter((e) => e.room === room && e.vx != null && e.type !== 'prop');
  if (spots.length) {
    const s = spots[Math.floor(Math.random() * spots.length)];
    return { x: s.vx + (Math.random() - 0.5) * 60, z: s.vz + (Math.random() - 0.5) * 60, lx: s.x, lz: s.z };
  }
  const r = M.roomById[room];
  for (let k = 0; k < 20; k++) {
    const x = r.x0 + 160 + Math.random() * (r.w - 320), z = r.z0 + 160 + Math.random() * (r.d - 320);
    if (!hitsWall(x, z, r.y0)) return { x, z, lx: r.cx, lz: r.cz };
  }
  return { x: r.cx, z: r.cz, lx: r.cx + 100, lz: r.cz };
}
function crowdGo(n, spot) {
  n.path = [{ x: spot.x, z: spot.z }];
  n.goal = spot; n.state = 'walk';
}
/** 다른 방으로 — 이웃 방 1~2 칸 */
function crowdWander(n) {
  const G = crowdGraph(), nb = G.get(n.room) || [];
  if (!nb.length) return false;
  let target = nb[Math.floor(Math.random() * nb.length)].to;
  if (Math.random() < 0.4) { const nb2 = G.get(target) || []; const t2 = nb2[Math.floor(Math.random() * nb2.length)]; if (t2 && t2.to !== n.room) target = t2.to; }
  // 사람은 사람 있는 데로 모인다 — 절반쯤은 다른 관람객이 있는 방(세 칸 안)으로 간다
  if (Math.random() < 0.55) {
    const near = M.npcs.filter((o) => o !== n && o.state === 'look' && o.room !== n.room).map((o) => ({ o, r: crowdRoute(n.room, o.room) }))
      .filter((c) => c.r && c.r.length <= 3);
    if (near.length) target = near[Math.floor(Math.random() * near.length)].o.room;
  }
  const route = crowdRoute(n.room, target);
  if (!route) return false;
  const spot = crowdSpot(target, n);
  n.path = [];
  for (const e of route) n.path.push({ x: e.from.x, z: e.from.z }, { x: e.p.x, z: e.p.z, enter: e.to }, { x: e.into.x, z: e.into.z });
  n.path.push({ x: spot.x, z: spot.z });
  n.goal = spot; n.state = 'walk';
  return true;
}
/** 방을 옮기면 방 그룹도 옮긴다(방이 컬링되면 함께 사라지게) */
function crowdEnter(n, room) {
  if (room === n.room) return;
  n.room = room;
  const g = M.roomGroups[room];
  if (g) { g.add(n.v.root); g.add(n.shadow); g.add(n.hit); }
  const r = M.roomById[room];
  n.info.room = room; n.info.subtitle = '관람객 · ' + (r ? r.name : '');
}

/* ── 대화 ─────────────────────────────────────────────── */
function crowdPair(M) {
  // 전시를 보는 중이거나, 같은 방 안에서 자리만 옮기는 중(문을 지나는 길이 아닌)이면 말을 걸 수 있다
  const free = (n) => (n.cool || 0) <= 0 && (n.state === 'look' || (n.state === 'walk' && !n.path.some((w) => w.enter)));
  const idle = M.npcs.filter(free);
  for (let i = 0; i < idle.length; i++) for (let j = i + 1; j < idle.length; j++) {
    const a = idle[i], b = idle[j];
    if (a.room !== b.room || Math.hypot(a.x - b.x, a.z - b.z) > 1400 || Math.random() > 0.8) continue;
    // 만날 자리 — 둘 사이 가운데에서 1.1m 떨어져 마주 선다
    const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1;
    const r = M.roomById[a.room];
    if (hitsWall(mx, mz, r.y0)) continue;
    const ux = dx / L, uz = dz / L;
    const T = { a, b, lines: crowdLines(a.room), k: -1, t: 0, dur: 0, started: false };
    a.state = b.state = 'goTalk'; a.talk = b.talk = T; a.wait = b.wait = 0;
    a.path = [{ x: mx - ux * 55, z: mz - uz * 55 }]; b.path = [{ x: mx + ux * 55, z: mz + uz * 55 }];
    a.goal = { lx: b.x, lz: b.z }; b.goal = { lx: a.x, lz: a.z };
    return;
  }
}
function crowdTalkStep(T, dt) {
  const { a, b } = T;
  if (!T.started) {
    if (a.state === 'talkWait' && b.state === 'talkWait') { T.started = true; a.state = b.state = 'talk'; T.k = -1; T.t = 0; }
    else return;
  }
  T.t -= dt;
  if (T.t <= 0) {
    T.k++;
    if (T.k >= T.lines.length) { crowdTalkEnd(T); return; }
    T.speaker = T.k % 2 === 0 ? a : b;
    T.t = 2.6 + T.lines[T.k].length * 0.09;
    crowdBubble(T, true);
    if (typeof sndMurmur === 'function') sndMurmur(T.speaker, Math.min(T.t - 0.6, 0.9 + T.lines[T.k].length * 0.07));   // 두런두런
  }
  crowdBubble(T, false);
}
function crowdTalkEnd(T) {
  for (const n of [T.a, T.b]) { n.state = 'look'; n.talk = null; n.cool = 30 + Math.random() * 25; n.wait = 1 + Math.random() * 2; }
  if (T.el) T.el.remove();
}
/** 말풍선 — 말하는 사람 머리 위. 가까울 때만 */
function crowdBubble(T, next) {
  if (!T.el) { T.el = document.createElement('div'); T.el.className = 'npc-say'; document.getElementById('gal').appendChild(T.el); }
  const s = T.speaker; if (!s) return;
  if (next) { T.el.textContent = T.lines[T.k]; T.el.classList.remove('pop'); void T.el.offsetWidth; T.el.classList.add('pop'); }
  const g = M.roomGroups[s.room];
  const p = new THREE.Vector3(s.x / CM, (M.roomById[s.room].y0 / CM) + s.hM + 0.28, s.z / CM);
  const d = Math.hypot(p.x - M.pos.x, p.z - M.pos.z);
  const v = p.clone().project(M.cam);
  const on = g && g.visible !== false && d < 9 && v.z < 1 && Math.abs(v.x) < 1 && Math.abs(v.y) < 1 && !M.openId;
  T.el.style.display = on ? '' : 'none';
  if (on) {
    T.el.style.transform = 'translate(' + ((v.x + 1) / 2 * innerWidth).toFixed(0) + 'px,' + ((1 - v.y) / 2 * innerHeight).toFixed(0) + 'px) translate(-50%, -100%)';
    T.el.style.opacity = String(clamp(1.4 - d / 9, 0.35, 1));
  }
}

/* ── 손짓 · 끄덕임 — 클립 위에 얹는다 ────────────────────────── */
const _pq = new THREE.Quaternion(), _rq = new THREE.Quaternion();
function boneRotWorld(bone, axis, ang) {
  if (!bone || !bone.parent) return;
  bone.parent.getWorldQuaternion(_pq);
  _rq.setFromAxisAngle(axis, ang);
  const lq = _pq.clone().invert().multiply(_rq).multiply(_pq);
  bone.quaternion.premultiply(lq);
}
function crowdGesture(n, t) {
  const v = n.v, sk = v.mesh.skeleton;
  if (!v.bones) v.bones = { head: sk.getBoneByName('Head'), neck: sk.getBoneByName('Neck'), ra: sk.getBoneByName('RightArm'), rf: sk.getBoneByName('RightForeArm'), la: sk.getBoneByName('LeftArm'), lf: sk.getBoneByName('LeftForeArm') };
  const B = v.bones, T = n.talk;
  const right = new THREE.Vector3(-Math.cos(n.yaw), 0, Math.sin(n.yaw)), up = new THREE.Vector3(0, 1, 0);
  // 부호 — 팔꿈치를 굽혀 손이 앞으로 오는 쪽(사람마다 뼈 방향이 다를 수 있어 한 번 재 둔다)
  if (v.gs == null && B.rf) {
    v.root.updateMatrixWorld(true);
    const h = sk.getBoneByName('RightHand'), fw = new THREE.Vector3(Math.sin(n.yaw), 0, Math.cos(n.yaw));
    const p0 = h.getWorldPosition(new THREE.Vector3()).dot(fw);
    const save = B.rf.quaternion.clone(); boneRotWorld(B.rf, right, 0.5); v.root.updateMatrixWorld(true);
    const p1 = h.getWorldPosition(new THREE.Vector3()).dot(fw);
    B.rf.quaternion.copy(save); v.gs = p1 > p0 ? 1 : -1;
  }
  const g = v.gs || 1;
  if (n.state === 'talk' && T && T.speaker === n) {
    // 말하기 — 오른팔을 들어 손짓, 고개를 조금씩
    const k = Math.min(1, (n.gk = Math.min(1, (n.gk || 0) + 0.05)));
    boneRotWorld(B.ra, right, g * (0.22 + 0.08 * Math.sin(t * 2.1)) * k);
    boneRotWorld(B.rf, right, g * (0.75 + 0.25 * Math.sin(t * 3.3)) * k);
    boneRotWorld(B.rf, up, 0.25 * Math.sin(t * 1.7) * k);
    if (Math.sin(t * 0.9) > 0.3) { boneRotWorld(B.lf, right, g * 0.35 * k); }
    boneRotWorld(B.head, right, -0.05 * Math.sin(t * 4.2) * k);
    boneRotWorld(B.head, up, 0.08 * Math.sin(t * 1.3) * k);
  } else if (n.state === 'talk') {
    // 듣기 — 천천히 끄덕인다
    n.gk = Math.max(0, (n.gk || 0) - 0.05);
    boneRotWorld(B.head, right, -0.09 * Math.max(0, Math.sin(t * 2.4)));
    boneRotWorld(B.head, up, 0.05 * Math.sin(t * 0.7));
  }
}

/* ── 얼굴(v95) — 모프: 눈 깜빡임(2~7초마다) · 말할 때 입이 움직이고 · 듣는 사람은 웃는다 ───────── */
function npcFace(n, dt) {
  const mi = n.v.mesh.morphTargetInfluences, m = n.v.morph;
  if (!mi) return;
  n.blinkT = (n.blinkT == null ? 1 + Math.random() * 4 : n.blinkT) - dt;
  if (n.blinkT <= 0) { n.blinkA = 0.0001; n.blinkT = 2 + Math.random() * 5 + (Math.random() < 0.15 ? -1.6 : 0); }   // 가끔 두 번 연달아
  if (n.blinkA > 0) {
    n.blinkA += dt; const b = n.blinkA;
    mi[m.blink] = b < 0.06 ? b / 0.06 : b < 0.19 ? 1 - (b - 0.06) / 0.13 : 0;
    if (b >= 0.19) n.blinkA = 0;
  }
  const T = n.talk, talking = n.state === 'talk' && T;
  const speaking = talking && T.speaker === n && T.t > 0.5;
  const tt = CROWD.t * 1 + n.phase;
  const open = speaking ? 0.18 + 0.5 * Math.abs(Math.sin(tt * 8.7) * Math.sin(tt * 4.3 + 1.1)) : 0;
  mi[m.talk] += (open - mi[m.talk]) * Math.min(1, dt * 16);
  const sm = talking ? (speaking ? 0.2 : 0.55 + 0.25 * Math.sin(tt * 0.9)) : 0.1 * Math.max(0, Math.sin(tt * 0.21));
  mi[m.smile] += (sm - mi[m.smile]) * Math.min(1, dt * 2.5);
}

/* ── 매 프레임 ───────────────────────────────────────────── */
function crowdInit(M) {
  for (const n of M.npcs) {
    n.state = 'look'; n.path = []; n.cool = 6 + Math.random() * 10; n.goal = { lx: n.lx, lz: n.lz };
  }
}
function stepCrowd(M, dt) {
  if (!M.npcs || !M.npcs.length) return;
  if (M.npcs[0].state === undefined) crowdInit(M);
  CROWD.t += dt;
  CROWD.pairT -= dt;
  if (CROWD.pairT <= 0) { CROWD.pairT = 1.2; crowdPair(M); }
  const talks = new Set();
  for (const n of M.npcs) {
    n.cool = (n.cool || 0) - dt;
    let want = n.yaw, walking = false;
    if (n.state === 'look') {
      want = Math.atan2(n.goal.lx - n.x, n.goal.lz - n.z);
      n.wait -= dt;
      if (n.wait <= 0) {
        n.wait = 4 + Math.random() * 6;
        if (Math.random() < 0.38 && crowdWander(n)) { /* 다른 방으로 */ } else crowdGo(n, crowdSpot(n.room, n));
      }
    } else if (n.state === 'walk' || n.state === 'goTalk') {
      const wp = n.path[0];
      if (!wp) { n.state = n.state === 'goTalk' ? 'talkWait' : 'look'; }
      else {
        const dx = wp.x - n.x, dz = wp.z - n.z, dist = Math.hypot(dx, dz);
        if (dist < 18) {
          n.path.shift();
          if (wp.enter) crowdEnter(n, wp.enter);
        } else {
          let ux = dx / dist, uz = dz / dist;
          // 비켜 가기 — 앞에 사람이 있으면 옆으로(나도 사람이다)
          const others = M.npcs.filter((o) => o !== n && o.room === n.room).map((o) => ({ x: o.x, z: o.z }));
          if (M.room && M.room.id === n.room) others.push({ x: M.pos.x * CM, z: M.pos.z * CM });
          let sx = 0, sz = 0, slow = 1;
          for (const o of others) {
            const ox = o.x - n.x, oz = o.z - n.z, od = Math.hypot(ox, oz);
            if (od > 150 || od < 1) continue;
            const ahead = (ox * ux + oz * uz) / od;
            if (ahead < -0.2) continue;
            const side = Math.sign(ux * oz - uz * ox) || 1;         // 상대가 왼쪽이면 오른쪽으로
            const k = (150 - od) / 150;
            sx += -uz * -side * k * 1.8; sz += ux * -side * k * 1.8;
            if (od < 70 && ahead > 0.6) slow = Math.min(slow, 0.35);
          }
          let mx = ux + sx, mz = uz + sz; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
          // v95 — 속도를 서서히 올리고 내린다(도착 직전엔 늦춘다). 예전엔 0 → 최고 속도로 뚝 바뀌어 미끄러지듯 출발했다
          const tv = n.speed * slow * Math.min(1, dist / 70 + 0.3);
          n.curV = (n.curV || 0) + (tv - (n.curV || 0)) * Math.min(1, dt * 3);
          const step = n.curV * 100 * dt;
          const nx = n.x + mx * Math.min(step, dist), nz = n.z + mz * Math.min(step, dist);
          const r = M.roomById[n.room];
          if (!(sx || sz) || !hitsWall(nx, nz, r ? r.y0 : 0)) { n.x = nx; n.z = nz; }
          else { n.x += ux * Math.min(step, dist); n.z += uz * Math.min(step, dist); }
          want = Math.atan2(mx, mz); walking = true;
          n.phase += dt * n.speed * 7.2;
        }
      }
    } else if (n.state === 'talkWait' || n.state === 'talk') {
      const o = n.talk && (n.talk.a === n ? n.talk.b : n.talk.a);
      if (o) want = Math.atan2(o.x - n.x, o.z - n.z);
      if (n.talk) talks.add(n.talk);
      // 상대가 너무 오래 안 오면(길이 막혔다) 그만둔다
      n.wait -= dt; if (n.state === 'talkWait' && n.wait < -12 && n.talk) crowdTalkEnd(n.talk);
    }
    if (!walking) n.curV = (n.curV || 0) * Math.max(0, 1 - dt * 5);
    n.yaw += npcAng(want - n.yaw) * Math.min(1, dt * (walking ? 3 : 4));
    // 걷기 비중 = 지금 속도 / 제 걸음 속도(걸음 박자도 속도에 맞춘다 → 발이 바닥에서 미끄러지지 않는다)
    n.walkK = clamp((n.curV || 0) / n.speed, 0, 1);
    npcPose(M, n, dt);
  }
  for (const T of talks) crowdTalkStep(T, dt);
}
/** 자세 · 자리 반영(보이지 않는 방이면 뼈 계산은 건너뛴다) */
function npcPose(M, n, dt) {
  const v = n.v, g = M.roomGroups[n.room], shown = !g || g.visible !== false;
  v.root.position.set(n.x / CM, 0, n.z / CM);
  v.root.rotation.y = n.yaw;
  n.shadow.position.set(n.x / CM, 0.012, n.z / CM);
  n.hit.position.set(n.x / CM, n.hM / 2, n.z / CM);
  n.info.x = n.x; n.info.z = n.z;
  if (!shown) return;
  if (v.real) {
    const k = n.walkK;
    v.walk.setEffectiveWeight(k); v.idle.setEffectiveWeight(1 - k);
    v.walk.timeScale = clamp((n.curV || 0) / v.natural, 0.35, 1.3);
    v.mixer.update(dt);
    // 발소리 — 걸음 한 주기에 뒤꿈치가 두 번 닿는다
    const u = (v.walk.time % v.walk.getClip().duration) / v.walk.getClip().duration, hs = Math.floor(u * 2);
    if (hs !== n.hs) { n.hs = hs; if (k > 0.5 && typeof sndStep === 'function') sndStep(M.roomById[n.room], 0.55, n.x / CM, n.z / CM); }
    if (v.morph) npcFace(n, dt);
    if (n.state === 'talk') { v.root.updateMatrixWorld(true); crowdGesture(n, CROWD.t + n.phase); }
  } else {
    const k = n.walkK, sw = Math.sin(n.phase);
    v.legL.rotation.x = sw * 0.46 * k; v.legR.rotation.x = -sw * 0.46 * k;
    v.armL.rotation.x = -sw * 0.36 * k + (1 - k) * 0.05; v.armR.rotation.x = sw * 0.36 * k + (1 - k) * 0.05;
    v.body.position.y = Math.abs(Math.cos(n.phase)) * 0.028 * k;
  }
}
