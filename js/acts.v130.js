/* ══════════════════════════════════════════════════════════
   관람객의 몸짓 — 걷기 · 서 있기 위에 얹는 동작 (v118)
   ══════════════════════════════════════════════════════════
   구운 클립은 걷기 · 서 있기 둘뿐이다. 그 위에 **손이 갈 자리**를 정해 팔을 풀어(두 마디 IK) 동작을 만든다.
   몸 기준 좌표(키 1 단위 · x 오른쪽 · y 위 · z 앞)로 손 자리를 적으므로 키가 다른 사람도 같은 동작이 맞는다.
     · 서서: 뒷짐 · 팔짱 · 턱 괴기 · 가리키기 · 사진 찍기 · 휴대폰 · 통화 · 시계 보기 · 머리 긁기 · 기지개 · 주머니 · 허리 숙여 보기 · 쪼그려 앉기 · 박수
     · 걸으며: 뒷짐 지고 걷는 사람 · 휴대폰 보며 걷는 사람
     · 바깥: 연습 그린의 퍼팅 연습(낮엔 퍼터, 밤엔 — 손에 퍼터가 없다) · 아이들(쪼그려 앉아 땅 보기 · 손 흔들기 / 밤엔 나를 가리킨다)
   밤에만: 구석에서 고개를 떨군 사람 · 숲가의 그 사람이 멀리서 손짓한다 · 사진 찍던 사람이 돌아서서 나를 찍는다 · 빈 상영관의 느린 박수 */
const ACT = { shotCool: 60, flashEl: null };
const _aq = new THREE.Quaternion(), _aq2 = new THREE.Quaternion(), _aqI = new THREE.Quaternion();
const _av = [0, 1, 2, 3, 4, 5, 6, 7].map(() => new THREE.Vector3());
const _aUp = new THREE.Vector3(0, 1, 0), _aR = new THREE.Vector3();

function actBones(v) {
  if (v.ab) return v.ab;
  const g = (s) => v.mesh.skeleton.getBoneByName(s);
  return (v.ab = { hips: g('Hips'), sp: g('Spine'), sp1: g('Spine1'), sp2: g('Spine2'), head: g('Head'),
    ra: g('RightArm'), rf: g('RightForeArm'), rh: g('RightHand'), la: g('LeftArm'), lf: g('LeftForeArm'), lh: g('LeftHand'),
    rul: g('RightUpLeg'), rl: g('RightLeg'), rft: g('RightFoot'), lul: g('LeftUpLeg'), ll: g('LeftLeg'), lft: g('LeftFoot') });
}
/* ⚠️ three 의 AnimationMixer 는 **값이 지난 프레임과 같으면 뼈에 다시 쓰지 않는다**(PropertyMixer.apply).
   그래서 클립이 멈춰 있는 동안(시간이 안 흐르는 프레임 · timeScale 0 · 숨은 탭) 위에 얹은 회전이 프레임마다 쌓여
   허리가 접히고 목이 돌아갔다. → 믹서를 돌리기 전에 지난 프레임의 '깨끗한(클립만의)' 자세로 되돌리고, 돌린 뒤 다시 찍어 둔다 */
const ACT_TOUCH = ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head', 'RightArm', 'RightForeArm', 'RightHand', 'LeftArm', 'LeftForeArm', 'LeftHand',
  'RightUpLeg', 'RightLeg', 'RightFoot', 'LeftUpLeg', 'LeftLeg', 'LeftFoot'];
function actRestore(v) {
  if (!v.clean) return;
  for (const c of v.clean) c.b.quaternion.copy(c.q);
  if (v.cleanHip) v.cleanHip.b.position.copy(v.cleanHip.p);
}
function actSnap(v) {
  if (!v.clean) {
    const sk = v.mesh.skeleton;
    v.clean = ACT_TOUCH.map((s) => sk.getBoneByName(s)).filter(Boolean).map((b) => ({ b, q: new THREE.Quaternion() }));
    const h = sk.getBoneByName('Hips'); v.cleanHip = h ? { b: h, p: new THREE.Vector3() } : null;
  }
  for (const c of v.clean) c.q.copy(c.b.quaternion);
  if (v.cleanHip) v.cleanHip.p.copy(v.cleanHip.b.position);
}
/** 몸 좌표(키 1) → 세계 좌표. 뿌리의 로컬은 x 가 몸의 왼쪽이다 */
function actPt(v, p, out) { return v.root.localToWorld(out.set(-p[0], p[1], p[2])); }
function actDir(v, d, out) { v.root.getWorldQuaternion(_aq2); return out.set(-d[0], d[1], d[2]).applyQuaternion(_aq2).normalize(); }
/** 세계 회전 q 를 뼈에 얹는다 */
function actRotW(bone, q) {
  bone.parent.getWorldQuaternion(_aq2);
  const lq = _aq2.clone().invert().multiply(q).multiply(_aq2);
  bone.quaternion.premultiply(lq);
}
/** 두 마디 IK — a(위팔) · b(아래팔) · c(손). T 에 손이, pole 쪽으로 팔꿈치가. w 로 원래 자세와 섞는다 */
function actIK(a, b, c, T, pole, w) {
  const A = a.getWorldPosition(_av[0]), Bp = b.getWorldPosition(_av[1]), C = c.getWorldPosition(_av[2]);
  const la = A.distanceTo(Bp), lb = Bp.distanceTo(C);
  const D = _av[3].subVectors(T, A); let d = D.length(); if (d < 1e-6) return;
  D.divideScalar(d); d = clamp(d, Math.abs(la - lb) + 1e-4, (la + lb) * 0.999);
  const ca = clamp((la * la + d * d - lb * lb) / (2 * la * d), -1, 1), sa = Math.sqrt(1 - ca * ca);
  const P = _av[4].copy(pole).addScaledVector(D, -pole.dot(D)); if (P.lengthSq() < 1e-8) P.set(0, -1, 0); P.normalize();
  const K = _av[5].copy(A).addScaledVector(D, la * ca).addScaledVector(P, la * sa);
  const qa0 = a.quaternion.clone(), qb0 = b.quaternion.clone();
  _aq.setFromUnitVectors(_av[6].subVectors(Bp, A).normalize(), _av[7].subVectors(K, A).normalize()); actRotW(a, _aq); a.updateMatrixWorld(true);
  b.getWorldPosition(Bp); c.getWorldPosition(C);
  const goal = _av[7].copy(A).addScaledVector(D, d);
  _aq.setFromUnitVectors(_av[6].subVectors(C, Bp).normalize(), _av[3].subVectors(goal, Bp).normalize()); actRotW(b, _aq);
  if (w < 1) { a.quaternion.slerpQuaternions(qa0, a.quaternion.clone(), w); b.quaternion.slerpQuaternions(qb0, b.quaternion.clone(), w); }
  a.updateMatrixWorld(true);
}
const R_ = (x, y, z) => [x, y, z], L_ = (p) => [-p[0], p[1], p[2]];

/* ── 동작 — (n, t) → { rh, rp, lh, lp, bend, head, drop, prop } ── */
const _lp = (a, b, k) => a.map((v, i) => v + (b[i] - v) * clamp(k, 0, 1));
const _ez = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
const ACTS = {
  /* v120 — 뒷짐(behind)을 뺐다(사용자: "뒤로 깍지 낀 사람들 포즈가 이상하다"). 손 앞으로 모으기 · 한 손 주머니 · 두 손 주머니(걸을 때도) */
  front:   { f: () => ({ rh: R_(0.02, 0.5, 0.125), rp: R_(1, -0.3, -0.4), lh: R_(-0.02, 0.49, 0.12), lp: R_(-1, -0.3, -0.4) }) },
  pocket1: { f: () => ({ rh: R_(0.115, 0.5, 0.05), rp: R_(1, 0, -0.5) }) },
  cross:   { f: () => ({ rh: R_(-0.07, 0.69, 0.12), rp: R_(1, -1, 0.2), lh: R_(0.075, 0.665, 0.125), lp: R_(-1, -1, 0.2) }) },
  chin:    { f: () => ({ rh: R_(0.01, 0.855, 0.105), rp: R_(0.2, -1, 0.3), lh: R_(0.06, 0.68, 0.12), lp: R_(-1, -1, 0.2), head: 0.08 }) },
  pockets: { walk: true, f: () => ({ rh: R_(0.115, 0.5, 0.05), rp: R_(1, 0, -0.5), lh: R_(-0.115, 0.5, 0.05), lp: R_(-1, 0, -0.5) }) },
  point:   { dur: [2.5, 4], f: (n, t) => ({ rh: R_(0.16, 0.87 + 0.01 * Math.sin(t * 3), 0.34), rp: R_(1, -1, 0), head: -0.05 }) },
  photo:   { f: () => ({ rh: R_(0.045, 0.88, 0.25), rp: R_(1, -0.8, 0), lh: R_(-0.045, 0.88, 0.25), lp: R_(-1, -0.8, 0), prop: 'shoot' }) },
  phone:   { walk: true, f: () => ({ rh: R_(0.035, 0.71, 0.2), rp: R_(1, -1, 0), head: 0.38, prop: 'look' }) },
  call:    { f: () => ({ rh: R_(0.09, 0.905, 0.035), rp: R_(0.6, -0.8, 0.25), prop: 'call' }) },
  watch:   { dur: [2.2, 3.2], f: () => ({ lh: R_(-0.01, 0.73, 0.21), lp: R_(-1, -1, 0), head: 0.3 }) },
  scratch: { dur: [1.8, 2.8], f: (n, t) => ({ rh: R_(0.065, 0.965 + 0.012 * Math.sin(t * 14), -0.03), rp: R_(1, 0.2, 0.3), head: 0.1 }) },
  stretch: { dur: [2.4, 3.2], f: (n, t) => { const k = Math.min(1, t / 1.2); return { rh: R_(0.09, 0.9 + 0.23 * k, 0.02), rp: R_(1, 0, 0), lh: R_(-0.09, 0.9 + 0.23 * k, 0.02), lp: R_(-1, 0, 0), head: -0.2 * k }; } },
  bend:    { f: () => ({ rh: R_(0.085, 0.42, 0.14), rp: R_(1, 0, 0), lh: R_(-0.085, 0.42, 0.14), lp: R_(-1, 0, 0), bend: 0.6, head: 0.15 }) },
  crouch:  { f: () => ({ rh: R_(0.1, 0.33, 0.21), rp: R_(1, 0, 0), lh: R_(-0.1, 0.33, 0.21), lp: R_(-1, 0, 0), bend: 0.35, head: 0.35, drop: 0.2 }) },
  clap:    { f: (n, t) => { const s = Math.abs(Math.sin(t * Math.PI * (n.act.slow ? 0.9 : 2.6))); return { rh: R_(0.02 + 0.05 * s, 0.74, 0.22), rp: R_(1, -1, 0), lh: R_(-0.02 - 0.05 * s, 0.74, 0.22), lp: R_(-1, -1, 0) }; } },
  wave:    { dur: [2.4, 3.4], f: (n, t) => ({ rh: R_(0.21 + 0.045 * Math.sin(t * 9), 0.99, 0.08), rp: R_(1, -1, 0), head: -0.05 }) },
  beckon:  { dur: [5, 7], f: (n, t) => { const s = Math.sin(t * 4.2); return { rh: R_(0.1, 0.8 + 0.035 * s, 0.27 - 0.025 * s), rp: R_(1, -1, 0), head: 0.05 }; } },
  slump:   { f: () => ({ rh: R_(0.12, 0.42, 0.06), rp: R_(0.3, 0, -1), lh: R_(-0.12, 0.42, 0.06), lp: R_(-0.3, 0, -1), bend: 0.3, head: 0.6 }) },
  putt:    { f: (n, t) => {
    // 어드레스 · 백스윙 · 스트로크 · 멈춤 — 4.5초에 한 번
    const u = t % 4.5, s = u < 1.6 ? 0 : u < 2.3 ? -(u - 1.6) / 0.7 : u < 2.6 ? -1 + (u - 2.3) / 0.3 * 1.8 : u < 3.2 ? 0.8 : 0.8 * (1 - (u - 3.2) / 1.3);
    const sw = 0.055 * s;
    return { rh: R_(0.012 + sw, 0.475, 0.2), rp: R_(1, 0, 0.2), lh: R_(-0.002 + sw, 0.49, 0.2), lp: R_(-1, 0, 0.2), bend: 0.8, head: 0.4, prop: 'putter', sw }; } },
  /* v120 — 앉기(벤치 · 카트) — 엉덩이를 자리 높이로 내리고 발은 앞 바닥에(다리 IK) */
  sit:     { f: (n) => { const S = n.sit || { hipY: 0.33, feetY: 0.03, feetZ: 0.27 }, y = S.hipY;
    const P = { hipY: y, hipZ: -0.03, feet: [R_(0.1, S.feetY, S.feetZ), R_(-0.1, S.feetY, S.feetZ)], head: 0.06 };
    if (n.act && n.act.sub === 'phone') Object.assign(P, { rh: R_(0.04, y + 0.2, 0.2), rp: R_(1, -1, 0), lh: R_(-0.1, y + 0.07, 0.16), lp: R_(-1, -0.3, -0.3), head: 0.4, prop: 'look' });
    else Object.assign(P, { rh: R_(0.1, y + 0.07, 0.16), rp: R_(1, -0.3, -0.3), lh: R_(-0.1, y + 0.07, 0.16), lp: R_(-1, -0.3, -0.3) });
    return P; } },
  sitcart: { f: (n) => { const S = n.sit || { hipY: 0.3, feetY: 0.15, feetZ: 0.24 }, y = S.hipY;
    return { hipY: y, hipZ: -0.02, feet: [R_(0.1, S.feetY, S.feetZ), R_(-0.1, S.feetY, S.feetZ)], rh: R_(0.085, y + 0.16, 0.26), rp: R_(1, -1, 0), lh: R_(-0.085, y + 0.16, 0.26), lp: R_(-1, -1, 0), head: 0.02 }; } },
  /* v120 — 정수기: 버튼 · 받기(쪼르륵) · 마시기(꿀꺽) · 내리기 */
  drink:   { dur: [7, 7], f: (n, t) => {
    const tap = [0.03, 0.56, 0.31], mouth = [0.0, 0.86, 0.09], chest = [0.03, 0.68, 0.17];
    let rh = tap, bend = 0.25, head = 0.25, tilt = 0;
    if (t > 2.2 && t <= 3.0) { const k = _ez((t - 2.2) / 0.8); rh = _lp(tap, mouth, k); bend = 0.25 * (1 - k); head = 0.25 - 0.4 * k; }
    else if (t > 3.0 && t <= 4.6) { rh = mouth; bend = 0; head = -0.3; tilt = 1.1 * _ez((t - 3.0) / 0.4); }
    else if (t > 4.6) { const k = _ez((t - 4.6) / 0.8); rh = _lp(mouth, chest, k); bend = 0; tilt = 1.1 * (1 - k); head = isNightMode() ? -0.3 + 0.75 * k : -0.3 + 0.35 * k; }
    return { rh: R_(...rh), rp: R_(1, -1, 0.1), bend, head, tilt, prop: t > 0.6 && t < 6.6 ? 'cup' : null }; } },
  /* v120 — 풀스윙(골퍼): 어드레스 · 백스윙(어깨를 돌린다) · 다운스윙 · 피니시 — 4.4초에 한 번 */
  swing:   { f: (n, t) => {
    const u = t % 4.4, adr = [0.0, 0.4, 0.22], top = [0.17, 0.86, -0.04], fin = [-0.19, 0.86, -0.02];
    let h = adr, tw = 0, bend = 0.5, head = 0.45;
    if (u > 1.0 && u <= 1.9) { const k = _ez((u - 1.0) / 0.9); h = _lp(adr, top, k); tw = -0.95 * k; bend = 0.5 - 0.12 * k; }
    else if (u > 1.9 && u <= 2.15) { const k = (u - 1.9) / 0.25; h = _lp(top, adr, k); tw = -0.95 * (1 - k); bend = 0.38 + 0.12 * k; }
    else if (u > 2.15 && u <= 2.6) { const k = _ez((u - 2.15) / 0.45); h = _lp(adr, fin, k); tw = 1.05 * k; bend = 0.5 - 0.35 * k; head = 0.45 - 0.55 * k; }
    else if (u > 2.6 && u <= 3.6) { h = fin; tw = 1.05; bend = 0.15; head = -0.1; }
    else if (u > 3.6) { const k = _ez((u - 3.6) / 0.8); h = _lp(fin, adr, k); tw = 1.05 * (1 - k); bend = 0.15 + 0.35 * k; head = -0.1 + 0.55 * k; }
    return { rh: R_(h[0] + 0.012, h[1], h[2]), rp: R_(1, -0.4, 0), lh: R_(h[0] - 0.012, h[1] + 0.015, h[2]), lp: R_(-1, -0.4, 0), twist: tw, bend, head, prop: 'driver' }; } },
};
/** 방 주제마다 어울리는 동작 */
const ACT_ROOM = {
  trophies: ['front', 'cross', 'point', 'photo', 'chin', 'bend'],
  portraits: ['front', 'chin', 'cross', 'photo', 'pocket1'],
  scorecards: ['bend', 'chin', 'cross', 'front', 'crouch'],
  clips: ['cross', 'chin', 'clap', 'pockets'],
  photos: ['photo', 'point', 'front', 'chin'],
  champion: ['front', 'photo', 'clap', 'cross'],
  lobby: ['phone', 'call', 'watch', 'pockets', 'stretch'],
  courses: ['point', 'pocket1', 'cross', 'crouch'],
  workshop: ['scratch', 'cross', 'bend', 'crouch'],
};
const ACT_ANY = ['front', 'cross', 'pockets', 'pocket1', 'phone', 'watch', 'scratch', 'stretch', 'chin', 'call'];
const ACT_CALL = {
  day: [['응, 나 지금 전시관이야.'], ['어, 트로피실 앞. 이따 봐.'], ['사진 찍어서 보낼게. 끊어.']],
  night: [['여보세요? … 여보세요?'], ['… 어디냐고? 여기 있잖아. 네 뒤에.'], ['응. 응. … 아직 못 나갔어.'], ['… 지금 누구랑 있냐고? 혼자야. 혼자인데.']],
};
const ACT_SHOT = [['… 안 나오네요.'], ['어? 화면엔 두 분인데.'], ['방금 뒤에 계신 분, 일행이세요?'], ['찍혔어요. 이제 같이 걸려요.']];

/** 지금 할 동작 고르기 — null 이면 그냥 선다 */
function actPick(n) {
  const night = isNightMode(), r = M.roomById[n.room];
  if (n.role === 'golfer') return golferAct(n);
  if (n.role === 'range') return rangeAct(n);
  // v120 — 사물을 쓰러 왔다(정수기 · 벤치)
  if (!n.out && n.state === 'look' && n.goal && n.goal.use && !n.goal.used) return n.goal.kind;
  if (n.out) {
    if (n.role === 'stroll' && n.cast && n.cast.lines === 'practice') return n.state === 'look' ? 'putt' : null;
    if (n.role === 'kid') {
      if (n.state === 'stare') return night ? (n.lead ? null : 'point') : 'wave';
      return n.state === 'look' && !n.lead && Math.random() < 0.45 ? 'crouch' : null;
    }
    if (n.role === 'watch') return null;                                     // 손짓은 따로(actStep)
    if (n.state === 'walk') return Math.random() < 0.5 ? 'pockets' : null;
    return n.state === 'look' ? pickOf(['front', 'pocket1', 'watch', 'pockets', 'stretch']) : null;
  }
  if (n.state === 'walk') return n.walkStyle || null;
  if (n.state === 'mono') return night ? 'slump' : null;
  if (n.state === 'talkWait') return Math.random() < 0.5 ? 'watch' : 'phone';
  if (n.state !== 'look') return null;
  if (Math.random() < 0.18) return null;                                     // 가끔은 그냥 서서 본다
  const L = (r && ACT_ROOM[r.content]) || ACT_ANY;
  let id = pickOf(Math.random() < 0.8 ? L : ACT_ANY);
  if (id === 'clap') {
    // 박수 — 낮엔 우승자의 방에서 가끔, 밤엔 빈 상영관에서 혼자 느리게
    if (night && r && r.content === 'clips') return 'clap';
    if (night || Math.random() < 0.6) id = 'cross';
  }
  return id;
}
/** 이 동작을 지금 상태에서 계속해도 되나 */
function actOk(n, id) {
  const s = n.state, A = ACTS[id];
  if (n.role === 'golfer') return golferAct(n) === id;
  if (n.role === 'range') return rangeAct(n) === id;
  if (id === 'drink' || id === 'sit') return s === 'look';
  if (n.out) {
    if (id === 'beckon') return s === 'look';
    if (id === 'putt') return s === 'look';
    if (n.role === 'kid') return id === 'crouch' ? s === 'look' : s === 'stare';
    return s === 'look' || (s === 'walk' && id === 'pockets');
  }
  if (s === 'walk') return !!A.walk && n.walkStyle === id && !(n.pause > 0 && id === 'phone' && false);
  if (s === 'mono') return id === 'slump';
  if (s === 'talkWait') return id === 'watch' || id === 'phone';
  return s === 'look' && id !== 'slump';
}

/* ── 소품 — 휴대폰 · 퍼터(키 1 단위로 만들어 뿌리에 붙인다) ── */
function actProps(n) {
  const v = n.v; if (v.props) return v.props;
  const h = v.hM || 1.7, u = (m) => m / h;
  const P = {};
  const ph = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(u(0.072), u(0.148), u(0.009)), new THREE.MeshStandardMaterial({ color: 0x15161A, roughness: 0.35, metalness: 0.4 }));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(u(0.064), u(0.136)), new THREE.MeshBasicMaterial({ color: 0x9DB8E8, toneMapped: false }));
  scr.position.z = -u(0.0052); scr.rotation.y = Math.PI;
  ph.add(body, scr); ph.userData.scr = scr; ph.visible = false;
  v.root.add(ph); P.phone = ph;
  const pt = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(u(0.006), u(0.0055), 1, 8), new THREE.MeshStandardMaterial({ color: 0xB9BEC4, roughness: 0.25, metalness: 0.9 }));
  shaft.position.y = -0.5;
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(u(0.012), u(0.01), u(0.26), 8), new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.8 }));
  grip.position.y = -u(0.13);
  const head = new THREE.Mesh(new THREE.BoxGeometry(u(0.032), u(0.024), u(0.11)), new THREE.MeshStandardMaterial({ color: 0x8E949A, roughness: 0.3, metalness: 0.9 }));
  const sh = new THREE.Group(); sh.add(shaft); pt.add(sh, grip, head); pt.userData = { sh, head, grip };
  pt.visible = false; v.root.add(pt); P.putter = pt;
  return (v.props = P);
}
const _pa = new THREE.Vector3(), _pb = new THREE.Vector3(), _pc = new THREE.Vector3();
function actPropStep(n, pose, w) {
  const v = n.v, P = actProps(n), B = actBones(v), mode = w > 0.35 ? pose.prop : null, night = isNightMode();
  P.phone.visible = mode === 'shoot' || mode === 'look' || mode === 'call';
  P.putter.visible = mode === 'putter' && !night;                            // 밤 — 손에 퍼터는 없다
  if (P.phone.visible) {
    const ph = P.phone;
    v.root.updateMatrixWorld(true);
    if (mode === 'shoot') { B.rh.getWorldPosition(_pa); B.lh.getWorldPosition(_pb); _pa.add(_pb).multiplyScalar(0.5); v.root.worldToLocal(_pa); ph.position.copy(_pa); ph.position.z += 0.025; ph.rotation.set(0, 0, Math.PI / 2); }
    else {
      B.rh.getWorldPosition(_pa); v.root.worldToLocal(_pa); ph.position.copy(_pa);
      if (mode === 'look') { ph.position.z += 0.03; ph.position.y += 0.01; ph.rotation.set(0.8, 0, 0); }
      else { ph.position.x -= 0.012; ph.position.y += 0.03; ph.rotation.set(0, -Math.PI / 2, 0.15); }
    }
    ph.userData.scr.material.color.setHex(night ? 0xC9DCFF : 0x9DB8E8);
  }
  if (P.putter.visible) {
    const pt = P.putter, d = pt.userData;
    v.root.updateMatrixWorld(true);
    B.rh.getWorldPosition(_pa); B.lh.getWorldPosition(_pb); _pa.add(_pb).multiplyScalar(0.5); v.root.worldToLocal(_pa);
    _pb.set(-(pose.sw || 0) * 1.7, 0.014, 0.4);                             // 헤드 — 발 앞 바닥(스트로크는 몸 옆으로 · 뿌리 로컬 x 는 몸의 왼쪽)
    _pc.subVectors(_pb, _pa); const len = _pc.length();
    pt.position.copy(_pa);
    pt.quaternion.setFromUnitVectors(_aUp, _pc.clone().normalize().negate());
    d.sh.scale.set(1, len, 1); d.head.position.set(0, -len, 0.0);
  }
}
/** 셔터 · 박수 소리(그 사람 자리에서) */
function actSnd(kind, n) {
  const c = typeof SND !== 'undefined' && SND.ctx; if (!c || !SND.on) return;
  const x = n.x / CM, z = n.z / CM, d = Math.hypot(x - M.pos.x, z - M.pos.z);
  const far = kind === 'hit' ? 45 : 14;
  if (d > far) return;
  const k = clamp(1 - d / far, 0, 1) ** 2, pan = typeof sndPan === 'function' ? sndPan(x, z) : 0, t0 = c.currentTime + 0.005;
  const hits = kind === 'shutter' ? [[0, 0.5, 3200, 0.018], [0.06, 0.35, 2400, 0.02]] : kind === 'hit' ? [[0, 1.2, 2600, 0.022], [0, 0.6, 800, 0.05]] : [[0, isNightMode() ? 0.85 : 0.5, 1300, 0.05]];
  for (const [dt, v, f, len] of hits) {
    const N = Math.floor(c.sampleRate * len), b = c.createBuffer(1, N, c.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < N; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / N, kind === 'shutter' ? 5 : 3);
    const s = c.createBufferSource(); s.buffer = b;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * (0.9 + Math.random() * 0.2); bp.Q.value = 0.9;
    const g = c.createGain(); g.gain.value = v * k * 0.5; s.connect(bp); bp.connect(g);
    sndPanned(g, pan, kind === 'clap' ? 0.45 : 0.15); s.start(t0 + dt);
  }
}
/** 플래시 — 그 자리의 번쩍임 · 가까이서 나를 찍으면 화면이 하얘진다 */
function actFlash(n, atMe) {
  const P = actProps(n), ph = P.phone;
  if (!ph.userData.fl) {
    const cv = makeCanvas(64, 64), c = cv.getContext('2d'), g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(235,240,255,0.6)'); g.addColorStop(1, 'rgba(235,240,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 64, 64);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }));
    sp.position.z = 0.012; sp.visible = false; ph.add(sp); ph.userData.fl = sp;
  }
  const sp = ph.userData.fl; sp.visible = true; sp.scale.setScalar(0.6 / (n.v.hM || 1.7)); sp.userData.t = 0.14;
  ACT.flashes = ACT.flashes || new Set(); ACT.flashes.add(sp);
  if (atMe) {
    let el = ACT.flashEl;
    if (!el) { el = ACT.flashEl = document.createElement('div'); el.style.cssText = 'position:absolute;inset:0;background:#F4F7FF;pointer-events:none;opacity:0;transition:opacity .9s ease-out;z-index:30'; (document.getElementById('gal') || document.body).appendChild(el); }
    el.style.transition = 'none'; el.style.opacity = '0.55'; void el.offsetWidth; el.style.transition = 'opacity .9s ease-out'; el.style.opacity = '0';
  }
}

/** 몸에 얹기 */
function actApply(n, pose, w) {
  const v = n.v, B = actBones(v);
  if (!B.ra || !B.rh) return;
  v.root.updateMatrixWorld(true);
  _aR.set(-Math.cos(n.yaw), 0, Math.sin(n.yaw));
  // 쪼그려 앉기 — 엉덩이를 내리고 발은 그 자리에(다리 IK)
  if (pose.drop && B.hips && B.lft) {
    const fr = B.rft.getWorldPosition(new THREE.Vector3()), fl = B.lft.getWorldPosition(new THREE.Vector3());
    B.hips.position.y -= pose.drop * w; B.hips.updateMatrixWorld(true);
    const fw = actDir(v, [0, 0, 1], new THREE.Vector3());
    actIK(B.rul, B.rl, B.rft, fr, fw, 1); actIK(B.lul, B.ll, B.lft, fl, fw, 1);
  }
  // 앉기(v120) — 엉덩이를 목표 높이로, 발은 정한 자리에
  if (pose.hipY != null && B.hips && B.lft) {
    const hp = B.hips.getWorldPosition(new THREE.Vector3()), ry = v.root.getWorldPosition(new THREE.Vector3()).y, h = v.hM || 1.7;
    B.hips.position.y -= ((hp.y - ry) / h - pose.hipY) * w;
    if (pose.hipZ) B.hips.position.z += pose.hipZ * w;
    B.hips.updateMatrixWorld(true);
    const fw = actDir(v, [0, 0.3, 1], new THREE.Vector3());
    if (pose.feet) { actIK(B.rul, B.rl, B.rft, actPt(v, pose.feet[0], new THREE.Vector3()), fw, w); actIK(B.lul, B.ll, B.lft, actPt(v, pose.feet[1], new THREE.Vector3()), fw, w); }
  }
  // 허리 — 앞으로 숙인다(오른쪽 축 음의 방향)
  if (pose.bend) {
    const k = pose.bend * w;
    for (const [b, f] of [[B.sp, 0.3], [B.sp1, 0.35], [B.sp2, 0.35]]) { if (!b) continue; _aq.setFromAxisAngle(_aR, -k * f); actRotW(b, _aq); b.updateMatrixWorld(true); }
  }
  // 몸통 비틀기(v120 — 골프 스윙). 위로 갈수록 더 돈다
  if (pose.twist) for (const [b, f] of [[B.sp, 0.25], [B.sp1, 0.35], [B.sp2, 0.4]]) { if (!b) continue; _aq.setFromAxisAngle(_aUp, pose.twist * w * f); actRotW(b, _aq); b.updateMatrixWorld(true); }
  if (pose.rh) actIK(B.ra, B.rf, B.rh, actPt(v, pose.rh, new THREE.Vector3()), actDir(v, pose.rp || [1, -1, 0], new THREE.Vector3()), w);
  if (pose.lh) actIK(B.la, B.lf, B.lh, actPt(v, pose.lh, new THREE.Vector3()), actDir(v, pose.lp || [-1, -1, 0], new THREE.Vector3()), w);
  if (pose.head && B.head) { _aq.setFromAxisAngle(_aR, -pose.head * w); actRotW(B.head, _aq); B.head.updateMatrixWorld(true); }
}

/** 매 프레임 — npcPose 가 클립을 돌린 뒤 부른다 */
function actStep(n, dt) {
  const v = n.v; if (!v || !v.real) return;
  const A = n.act || (n.act = { id: null, w: 0, t: 0, dur: 0, cool: 1 + Math.random() * 5, end: false });
  if (n.walkStyle === undefined) n.walkStyle = n.out ? null : [null, 'pockets', null, 'phone', null, null, 'pockets'][(n.idx || 0) % 7];
  const night = isNightMode();
  A.cool -= dt;
  // 숲가의 그 사람(밤) — 멀리서 보이면 이리 오라고 손짓한다
  if (n.role === 'watch' && !A.id && A.cool <= 0 && n.state === 'look' && n.pd > 1000 && n.pd < 4500 && typeof outSeen === 'function' && outSeen(n)) {
    Object.assign(A, { id: 'beckon', t: 0, dur: 5 + Math.random() * 2, end: false, seen: 0 });
  }
  const usePending = !n.out && n.state === 'look' && n.goal && n.goal.use && !n.goal.used;
  if (usePending) n.wait = Math.max(n.wait || 0, 2);                    // 도착했으면 다른 데로 가지 않게
  if (usePending && A.id && A.id !== n.goal.kind) { A.end = true; A.w = Math.min(A.w, 0.3); }   // 하던 몸짓(주머니 등)을 놓고 정수기 · 벤치로
  if (A.id && (A.t > A.dur || !actOk(n, A.id))) {
    // 걷다 멈췄는데 그 자리에서도 같은 동작이면(뒷짐) 이어서
    if (!A.end && A.id === 'pockets' && n.state === 'look' && !n.out && Math.random() < 0.5) { A.t = 0; A.dur = 4 + Math.random() * 5; }
    else A.end = true;
  }
  if (!A.id && (A.cool <= 0 || (n.role === 'golfer' && golferAct(n)) || n.role === 'range' || usePending)) {
    const id = actPick(n);
    if (id) {
      const D = ACTS[id].dur, walkish = n.state === 'walk' || id === 'putt' || n.state === 'stare' || n.state === 'mono';
      Object.assign(A, { id, t: 0, end: false, dur: walkish ? 999 : D ? D[0] + Math.random() * (D[1] - D[0]) : 4 + Math.random() * 6,
        slow: id === 'clap' && night, shoot: 0, snapT: 2 + Math.random() * 3, hitPh: 0, hitK: -1, ev: {}, useE: null, sub: null });
      if (n.role === 'golfer' || n.role === 'range') A.dur = 999;
      else if (id === 'drink' || id === 'sit') {
        // 정수기 · 벤치 — 다 할 때까지 그 자리(crowd 의 대기 시간을 늘린다)
        n.goal.used = true; A.useE = n.goal.use;
        if (id === 'sit') { A.dur = night ? 16 + Math.random() * 10 : 12 + Math.random() * 14; A.sub = Math.random() < 0.4 ? 'phone' : null; n.sit = { hipY: (0.45 + 0.09) / n.hM, feetY: 0.03, feetZ: 0.27 }; }
        n.wait = A.dur + 0.6;
      }
      if (id === 'call' && !n.mono && n.pd < 900 && typeof monoStart === 'function') monoStart(n, pickOf(night ? ACT_CALL.night : ACT_CALL.day), night ? 'mono' : 'say');
    } else A.cool = 1.5 + Math.random() * 3;
  }
  if (!A.id) return;
  A.t += dt;
  A.w += ((A.end ? 0 : 1) - A.w) * Math.min(1, dt * (A.id === 'beckon' ? 2 : 3.5));
  if (A.end && A.w < 0.02) {
    A.cool = A.id === 'beckon' ? 25 + Math.random() * 20 : n.state === 'walk' ? 0.4 : 1.5 + Math.random() * 4;
    if (A.useE) { if (A.useE._busy === n) A.useE._busy = null; A.useE = null; if (n.goal) n.goal.use = null; if (n.role !== 'golfer') n.sit = null; }
    const P2 = v.props2; if (P2) { P2.cup.visible = false; P2.club.visible = false; }
    A.id = null; A.w = 0;
    if (A.saveL) { n.goal.lx = A.saveL.lx; n.goal.lz = A.saveL.lz; A.saveL = null; }
    const P = v.props; if (P) { P.phone.visible = false; P.putter.visible = false; }
    return;
  }
  const pose = ACTS[A.id].f(n, A.t);
  actApply(n, pose, n.role === 'golfer' && A.id === 'sitcart' ? Math.max(A.w, 0.999) : A.w);
  actPropStep(n, pose, A.w);
  actPropStep2(n, pose, A.w);
  actEvents(n, A, pose, dt, night);
}
/** 동작 중의 일 — 셔터 · 박수 소리, 밤의 사진, 손짓 기록 */
function actEvents(n, A, pose, dt, night) {
  if (A.id === 'photo' && A.w > 0.8) {
    if (!night) { A.snapT -= dt; if (A.snapT <= 0) { A.snapT = 3 + Math.random() * 4; actSnd('shutter', n); } }
    else if (!A.shoot && ACT.shotCool <= 0 && n.pd < 650 && (typeof HAUNT === 'undefined' || HAUNT.dread > 0.2) && Math.random() < dt / 3) {
      // 밤 — 전시를 찍던 사람이 천천히 돌아서서 나를 찍는다
      A.shoot = 0.001; A.saveL = { lx: n.goal.lx, lz: n.goal.lz }; A.dur = A.t + 6;
      ACT.shotCool = 150 + Math.random() * 90;
    }
    if (A.shoot) {
      A.shoot += dt; n.goal.lx = M.pos.x * CM; n.goal.lz = M.pos.z * CM;
      if (A.shoot > 1.6 && !A.shot) {
        A.shot = true; actSnd('shutter', n);
        const fw = Math.sin(n.yaw) * (M.pos.x * CM - n.x) + Math.cos(n.yaw) * (M.pos.z * CM - n.z);
        actFlash(n, n.pd < 700 && fw > 0);
        if (typeof monoForce === 'function') monoForce(n, pickOf(ACT_SHOT), 'say', 0.9);
        if (typeof hauntRec === 'function') hauntRec('shot');
      }
    }
  }
  if (A.id === 'drink') {
    if (A.t > 1.0 && !A.ev.pour) { A.ev.pour = 1; actSndWater(n, 'pour'); }
    if (A.t > 3.2 && !A.ev.gulp) { A.ev.gulp = 1; actSndWater(n, 'gulp'); }
    if (A.t > 5.2 && !A.ev.say) { A.ev.say = 1; if ((night || Math.random() < 0.4) && n.pd < 700 && typeof monoForce === 'function') monoForce(n, pickOf(night ? ACT_USE_MONO.night : ACT_USE_MONO.day), night ? 'mono' : 'say', 0.2); }
  }
  if (A.id === 'swing') { const k = Math.floor((A.t - 2.15) / 4.4); if (k >= 0 && k !== A.hitK) { A.hitK = k; actBall(n); } }
  if (A.id === 'clap' && A.w > 0.7) {
    const ph = Math.floor(A.t * (A.slow ? 0.9 : 2.6));
    if (ph !== A.hitPh) { A.hitPh = ph; actSnd('clap', n); }
  }
  if (A.id === 'beckon' && typeof outSeen === 'function' && outSeen(n)) { A.seen += dt; if (A.seen > 2 && typeof hauntRec === 'function') hauntRec('beckon'); }
}
/** 전역 — 플래시가 사그라든다 · 밤 사진 쿨다운 */
function stepActs(dt) {
  ACT.shotCool -= dt;
  actBallsStep(dt);
  ghostCartStep(dt);
  if (ACT.flashes) for (const sp of ACT.flashes) { sp.userData.t -= dt; sp.material.opacity = clamp(sp.userData.t / 0.14, 0, 1); if (sp.userData.t <= 0) { sp.visible = false; ACT.flashes.delete(sp); } }
}

/* ══════════════════════════════════════════════════════════
   사물을 쓰는 사람들(v120) — 정수기 · 벤치 · 골프 · 카트
   ══════════════════════════════════════════════════════════
   사용자: "정수기나 다른 오브젝트를 사용하는 자연스러운 연출", "npc 도 걷기뿐 아니라 골프도 치고 카트도 타고 정수기로 물도 마시고".
     · 실내: 방에 정수기가 있으면 가끔 그 앞에 가서 버튼을 눌러 종이컵에 받아 마신다(쪼르륵 · 꿀꺽). 그랜드 홀 벤치엔 앉아 쉰다
       밤엔 — 마시고 나서 컵 안을 오래 들여다본다("… 머리카락이")
     · 18번 홀(낮): 골퍼 한 명이 카트를 몰고 와서 내려 티샷 세 번(공이 날아간다) → 다시 타고 그린 옆까지 → 퍼팅 → 돌아와 주차
     · 18번 홀(밤): 아무도 안 탄 카트가 카트길을 천천히 굴러간다. 가까이 가면 서고, 눈을 돌리면 다른 데 가 있다 */
const ACT_USE_MONO = {
  day: [['아, 시원하다.'], ['물맛 좋네.'], ['한 잔 더 해야지.']],
  night: [['… 물이 미지근해요.'], ['… 머리카락이.'], ['이 물, 어디서 오는 거예요?'], ['… 비린내 나요.']],
};
/** 지금 방에서 쓸 만한 것 — 정수기(마시기) · 벤치(앉기). 다른 사람이 쓰는 중이면 고르지 않는다 */
function actUseSpot(n) {
  const r = M.roomById[n.room]; if (!r) return null;
  const L = M.exhibits.filter((e) => e.room === n.room && (e.icon === '🚰' || /정수기|벤치/.test(e.title || '')) && !(e._busy && e._busy !== n && e._busy.goal && e._busy.goal.use === e));
  if (!L.length) return null;
  const e = pickOf(L), nx = e.nx || 0, nz = e.nz || 0;
  if (!nx && !nz) return null;
  const sit = /벤치/.test(e.title || '');
  const d = sit ? 14 : 50;
  const x = e.x + nx * d + (sit ? (Math.random() - 0.5) * 70 * Math.abs(nz) : 0), z = e.z + nz * d + (sit ? (Math.random() - 0.5) * 70 * Math.abs(nx) : 0);
  if (hitsWall(x, z, r.y0)) return null;
  e._busy = n;
  return sit ? { x, z, lx: x + nx * 400, lz: z + nz * 400, use: e, kind: 'sit' } : { x, z, lx: e.x, lz: e.z, use: e, kind: 'drink' };
}
/** 쪼르륵(정수기) · 꿀꺽 */
function actSndWater(n, kind) {
  const c = typeof SND !== 'undefined' && SND.ctx; if (!c || !SND.on) return;
  const x = n.x / CM, z = n.z / CM, d = Math.hypot(x - M.pos.x, z - M.pos.z);
  if (d > 10) return;
  const k = clamp(1 - d / 10, 0, 1) ** 2, pan = typeof sndPan === 'function' ? sndPan(x, z) : 0, t0 = c.currentTime + 0.01;
  if (kind === 'pour') {
    const N = Math.floor(c.sampleRate * 1.1), b = c.createBuffer(1, N, c.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < N; i++) ch[i] = (Math.random() * 2 - 1) * Math.min(1, i / 2000) * Math.min(1, (N - i) / 6000);
    const s = c.createBufferSource(); s.buffer = b;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 3; bp.frequency.setValueAtTime(900, t0); bp.frequency.linearRampToValueAtTime(1600, t0 + 1.1);
    const g = c.createGain(); g.gain.value = 0.18 * k; s.connect(bp); bp.connect(g); sndPanned(g, pan, 0.1); s.start(t0);
    // 물통에서 올라오는 공기 방울(꾸르륵)
    for (let i = 0; i < 3; i++) {
      const o = c.createOscillator(), og = c.createGain(), tt = t0 + 0.5 + i * 0.22;
      o.frequency.setValueAtTime(180 + Math.random() * 60, tt); o.frequency.exponentialRampToValueAtTime(420, tt + 0.08);
      sndEnv(og, tt, 0.005, 0.12 * k, 0.09); o.connect(og); sndPanned(og, pan, 0.2); o.start(tt); o.stop(tt + 0.12);
    }
  } else {
    for (let i = 0; i < 2; i++) {
      const o = c.createOscillator(), og = c.createGain(), tt = t0 + i * 0.45;
      o.type = 'sine'; o.frequency.setValueAtTime(140, tt); o.frequency.exponentialRampToValueAtTime(70, tt + 0.1);
      sndEnv(og, tt, 0.004, 0.16 * k, 0.12); o.connect(og); sndPanned(og, pan, 0.05); o.start(tt); o.stop(tt + 0.16);
    }
  }
}
/** 컵 · 드라이버 소품 */
function actProps2(n) {
  const v = n.v; if (v.props2) return v.props2;
  const h = v.hM || 1.7, u = (m) => m / h, P = {};
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(u(0.036), u(0.026), u(0.085), 14, 1, true), new THREE.MeshStandardMaterial({ color: 0xF2EFE8, roughness: 0.6, side: THREE.DoubleSide }));
  cup.visible = false; v.root.add(cup); P.cup = cup;
  const club = new THREE.Group();
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(u(0.007), u(0.006), u(1.08), 8), new THREE.MeshStandardMaterial({ color: 0x9AA2AA, roughness: 0.25, metalness: 0.9 }));
  sh.position.y = -u(0.54);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(u(0.013), u(0.011), u(0.27), 8), new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.8 }));
  grip.position.y = -u(0.12);
  const hd = new THREE.Mesh(new THREE.BoxGeometry(u(0.11), u(0.05), u(0.085)), new THREE.MeshStandardMaterial({ color: 0x1C1E22, roughness: 0.3, metalness: 0.7 }));
  hd.position.set(u(0.03), -u(1.1), 0);
  club.add(sh, grip, hd); club.visible = false; v.root.add(club); P.club = club;
  return (v.props2 = P);
}
const _qa = new THREE.Vector3(), _qb = new THREE.Vector3();
function actPropStep2(n, pose, w) {
  const v = n.v, P = actProps2(n), B = actBones(v), mode = w > 0.35 ? pose.prop : null;
  P.cup.visible = mode === 'cup';
  P.club.visible = mode === 'driver';
  if (!P.cup.visible && !P.club.visible) return;
  v.root.updateMatrixWorld(true);
  if (P.cup.visible) {
    B.rh.getWorldPosition(_qa); v.root.worldToLocal(_qa);
    P.cup.position.set(_qa.x, _qa.y + 0.02, _qa.z + 0.035);
    P.cup.rotation.set(-(pose.tilt || 0), 0, 0);
  }
  if (P.club.visible) {
    B.rh.getWorldPosition(_qa); B.lh.getWorldPosition(_qb); _qa.add(_qb).multiplyScalar(0.5); v.root.worldToLocal(_qa);
    // 샤프트 방향 — 가슴에서 손을 지나 뻗는 쪽(어드레스면 발 앞 바닥, 백스윙 꼭대기면 뒤로, 피니시면 등 뒤로)
    _qb.set(0, 0.7, 0.02); const dir = _qa.clone().sub(_qb).normalize();
    P.club.position.copy(_qa);
    P.club.quaternion.setFromUnitVectors(_aUp, dir.negate());
  }
}
/** 날아가는 공(골퍼) */
function actBall(n) {
  const r = M.roomById[n.room], g = M.roomGroups[n.room] || M.scene;
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
  const lx = Math.cos(n.yaw), lz = -Math.sin(n.yaw);                         // 몸의 왼쪽 = 공이 가는 쪽
  const p0 = new THREE.Vector3((n.x + Math.sin(n.yaw) * 32) / CM, ((r ? r.y0 : 0) + (n.fy || 0)) / CM + 0.05, (n.z + Math.cos(n.yaw) * 32) / CM);
  const T = 2.6 + Math.random() * 0.6, dist = 70 + Math.random() * 30, sp = (Math.random() - 0.5) * 0.12;
  const vx = (lx * Math.cos(sp) - lz * Math.sin(sp)) * dist / T, vz = (lz * Math.cos(sp) + lx * Math.sin(sp)) * dist / T;
  b.position.copy(p0); g.add(b);
  (ACT.balls || (ACT.balls = [])).push({ b, p0, vx, vz, vy: 9.8 * T / 2, t: 0, T });
  actSnd('hit', n);
}
function actBallsStep(dt) {
  if (!ACT.balls) return;
  for (let i = ACT.balls.length - 1; i >= 0; i--) {
    const B = ACT.balls[i]; B.t += dt;
    const t = Math.min(B.t, B.T);
    B.b.position.set(B.p0.x + B.vx * t, B.p0.y + B.vy * t - 4.9 * t * t, B.p0.z + B.vz * t);
    if (B.t > B.T + 1.5) { B.b.parent && B.b.parent.remove(B.b); B.b.geometry.dispose(); ACT.balls.splice(i, 1); }
  }
}

/* ── 골퍼(낮 · 18번 홀) ───────────────────────────────────── */
const GOLFER_SAY = [['아, 안녕하세요. 한 판 치고 가요.'], ['티샷 보실래요? 호수만 넘기면 돼요.'], ['카트 타 보셨어요? 저 앞에 하나 더 있어요.'], ['오늘 바람이 좋네요.']];
function golferPathT(x, z) {
  let bt = 0, bd = 1e12;
  for (let t = 0; t <= 1.0001; t += 0.005) { const p = pathPoint(t), d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; bt = t; } }
  return bt;
}
function golferLen() {
  const Pp = HOLE.path; let L = 0;
  for (let i = 0; i + 1 < Pp.length; i++) L += Math.hypot(Pp[i + 1][0] - Pp[i][0], Pp[i + 1][1] - Pp[i][1]);
  return L;
}
function npcCart(withWheel) {
  const cart = golfCart();
  if (withWheel) {
    const wh = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.018, 8, 24), new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.6 }));
    wh.position.set(-0.26, 1.38, -0.22); wh.rotation.x = -1.0; cart.add(wh);
  }
  return cart;
}
/** 카트를 길 위 t 에 — 나아가는 쪽(s=±1)을 향해 */
function cartAt(cart, t, s) {
  const p = pathPoint(t), y = (terrainRender(p.x, p.z) || 0) / CM;
  cart.position.set(p.x / CM, y, p.z / CM);
  cart.rotation.y = Math.atan2(-p.dx * s, -p.dz * s);
  return p;
}
function golferStep(M, n, dt) {
  const r = M.roomById[n.room];
  if (!n.gc) {
    if (typeof HOLE === 'undefined' || typeof pathPoint !== 'function' || typeof golfCart !== 'function') return;
    const cart = npcCart(true); (M.roomGroups[n.room] || M.scene).add(cart);
    const len = golferLen();
    n.gc = { cart, len, t: 0.1, s: 1, st: 'park', wait: 3 + Math.random() * 6, tTee: golferPathT(HOLE.tee.x, HOLE.tee.z), tGreen: golferPathT(HOLE.green.x, HOLE.green.z), shots: 0, k: 0 };
    cartAt(cart, n.gc.t, 1);
  }
  const G = n.gc, cart = G.cart, P = { x: M.pos.x * CM, z: M.pos.z * CM };
  const pd = Math.hypot(P.x - n.x, P.z - n.z);
  n.pd = r && Math.abs((M.feet || 0) - r.y0) < 300 ? pd : 1e9;
  const seat = () => {
    cart.updateMatrixWorld(true);
    const s = cart.localToWorld(new THREE.Vector3(-0.26, 1.08, 0.2)), h = n.hM;
    n.x = s.x * CM; n.z = s.z * CM; n.yaw = cart.rotation.y + Math.PI;
    const rootY = s.y - 0.3 * h;
    n.fy = rootY * CM - (r ? r.y0 : 0);
    n.sit = { hipY: 0.3, feetY: (cart.position.y + 0.84 - rootY) / h, feetZ: 0.24 };
    n.curV = 0; n.walkK = 0;
  };
  const walkTo = (x, z, sp) => {
    const dx = x - n.x, dz = z - n.z, d = Math.hypot(dx, dz);
    if (d < 22) { n.curV = 0; n.walkK = 0; return true; }
    const st = Math.min(d, sp * 100 * dt);
    n.x += dx / d * st; n.z += dz / d * st;
    n.yaw += npcAng(Math.atan2(dx, dz) - n.yaw) * Math.min(1, dt * 5);
    n.curV = sp; n.walkK = clamp(sp / n.speed, 0, 1);
    const f = floorAt(r, n.x, n.z); n.fy = (f === f ? f : r.y0) - r.y0;
    n.phase += dt * sp * 7.2;
    return false;
  };
  const side = () => { cart.updateMatrixWorld(true); const s = cart.localToWorld(new THREE.Vector3(-1.05, 0, 0.2)); return { x: s.x * CM, z: s.z * CM }; };
  n.state = 'golf';
  if (G.st === 'park' || G.st === 'drive') {
    if (G.st === 'drive') {
      // 나와 부딪히지 않게 — 앞 4m 안에 내가 있으면 선다
      const ahead = (P.x - n.x) * -Math.sin(cart.rotation.y) + (P.z - n.z) * -Math.cos(cart.rotation.y);
      const stop = n.pd < 450 && ahead > 0;
      G.v = (G.v || 0) + ((stop ? 0 : 3.2) - (G.v || 0)) * Math.min(1, dt * 1.5);
      const dtT = G.v * 100 * dt / G.len * G.s;
      G.t = clamp(G.t + dtT, 0, 1);
      cartAt(cart, G.t, G.s);
      if (cart.userData.wheels) for (const w of cart.userData.wheels) w.rotation.x -= G.v * dt / 0.22;
      if ((G.s > 0 && G.t >= G.to) || (G.s < 0 && G.t <= G.to)) {
        G.v = 0;
        if (G.to === G.tTee) { G.st = 'out'; G.next = 'tee'; }
        else if (G.to === G.tGreen) { G.st = 'out'; G.next = 'green'; }
        else { G.st = 'park'; G.wait = 25 + Math.random() * 20; }
      }
    } else {
      G.wait -= dt;
      if (G.wait <= 0) { G.st = 'drive'; G.to = G.tTee; G.s = G.to > G.t ? 1 : -1; cartAt(cart, G.t, G.s); }
    }
    seat();
  } else if (G.st === 'out') {
    // 내려서 옆에 선다 → 칠 자리로 걸어간다
    n.sit = null;
    const s = side(); n.x = s.x; n.z = s.z;
    const f = floorAt(r, n.x, n.z); n.fy = (f === f ? f : r.y0) - r.y0;
    if (G.next === 'tee') G.goto = { x: HOLE.tee.x + (Math.random() - 0.5) * 300, z: HOLE.tee.z + 60 };
    else { const a = Math.random() * 6.28; G.goto = { x: HOLE.cup.x + Math.cos(a) * 260, z: HOLE.cup.z + Math.sin(a) * 260 }; }
    G.st = 'walk';
  } else if (G.st === 'walk') {
    if (walkTo(G.goto.x, G.goto.z, 1.15)) {
      if (G.next === 'tee') {
        // 옆으로 선다 — 몸의 왼쪽이 그린
        const tx = HOLE.green.x - n.x, tz = HOLE.green.z - n.z, l = Math.hypot(tx, tz);
        G.yaw = Math.atan2(-tz / l, tx / l); G.st = 'swing'; G.shots = 0; G.k = 0;
      } else { G.yaw = Math.atan2(HOLE.cup.x - n.x, HOLE.cup.z - n.z) + Math.PI / 2; G.st = 'putt'; G.k = 0; }
    }
  } else if (G.st === 'swing' || G.st === 'putt') {
    n.yaw += npcAng(G.yaw - n.yaw) * Math.min(1, dt * 4);
    n.curV = 0; n.walkK = 0;
    G.k += dt;
    if ((G.st === 'swing' && G.k > 4.4 * 3 + 0.6) || (G.st === 'putt' && G.k > 9.5)) { G.st = 'back'; G.after = G.next; }
  } else if (G.st === 'back') {
    const s = side();
    if (walkTo(s.x, s.z, 1.15)) {
      G.st = 'drive';
      if (G.after === 'tee') G.to = G.tGreen; else G.to = 0.1;
      G.s = G.to > G.t ? 1 : -1; cartAt(cart, G.t, G.s);
    }
  }
}

/* ── 밤의 빈 카트 ─────────────────────────────────────────── */
const GHOSTCART = { cart: null };
function ghostCartStep(dt) {
  if (!isNightMode() || typeof HOLE === 'undefined' || typeof golfCart !== 'function' || !M.roomGroups || !M.roomGroups.field) return;
  const GC = GHOSTCART;
  if (!GC.cart) {
    GC.cart = npcCart(true); M.roomGroups.field.add(GC.cart);
    // 전조등 — 빛은 아니고(조명 수 고정) 눈부신 점 둘
    for (const sx of [-0.4, 0.4]) {
      const cv = makeCanvas(32, 32), c = cv.getContext('2d'), gr = c.createRadialGradient(16, 16, 0, 16, 16, 16);
      gr.addColorStop(0, 'rgba(255,248,220,1)'); gr.addColorStop(0.35, 'rgba(255,236,190,.5)'); gr.addColorStop(1, 'rgba(255,230,180,0)'); c.fillStyle = gr; c.fillRect(0, 0, 32, 32);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      sp.position.set(sx, 0.62, -1.18); sp.scale.setScalar(0.55); GC.cart.add(sp);
    }
    GC.len = golferLen(); GC.t = 0.45; GC.s = 1; GC.v = 0; GC.pause = 4; GC.unseen = 0;
    cartAt(GC.cart, GC.t, GC.s);
  }
  const cart = GC.cart, d = Math.hypot(cart.position.x - M.pos.x, cart.position.z - M.pos.z);
  const v3 = cart.position.clone(); v3.y += 1; v3.project(M.cam);
  const seen = M.roomGroups.field.visible !== false && v3.z < 1 && Math.abs(v3.x) < 1.05 && Math.abs(v3.y) < 1.05;
  // 눈을 돌린 사이 — 멀리 있으면 다른 자리로 옮겨 가 있다
  GC.unseen = seen ? 0 : GC.unseen + dt;
  if (GC.unseen > 6 && d > 35) { GC.t = Math.random(); GC.unseen = -20; cartAt(cart, GC.t, GC.s); }
  GC.pause -= dt;
  const want = d < 7 || GC.pause > 0 ? 0 : 1.5;
  GC.v += (want - GC.v) * Math.min(1, dt * 0.8);
  if (GC.pause < -14 - Math.random() * 8) GC.pause = 5 + Math.random() * 8;
  GC.t += GC.v * 100 * dt / GC.len * GC.s;
  if (GC.t > 0.97 || GC.t < 0.12) { GC.s *= -1; GC.t = clamp(GC.t, 0.12, 0.97); }
  cartAt(cart, GC.t, GC.s);
  if (cart.userData.wheels) for (const w of cart.userData.wheels) w.rotation.x -= GC.v * dt / 0.22;
  if (seen && d < 30 && GC.v > 0.4 && typeof hauntRec === 'function') hauntRec('cart');
}

/** 골퍼가 지금 할 동작 */
function golferAct(n) {
  const st = n.gc && n.gc.st;
  return st === 'park' || st === 'drive' ? 'sitcart' : st === 'swing' ? 'swing' : st === 'putt' ? 'putt' : null;
}
/** crowd.js — 서 있다 다음 할 일을 고를 때(정수기 · 벤치) */
function actUseGo(n) {
  const s = actUseSpot(n);
  if (!s) return false;
  crowdGo(n, s);
  return true;
}
