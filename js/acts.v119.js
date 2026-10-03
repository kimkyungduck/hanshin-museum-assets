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
const ACTS = {
  behind:  { walk: true, f: () => ({ rh: R_(0.035, 0.54, -0.11), rp: R_(1, 0, -0.6), lh: R_(-0.035, 0.54, -0.11), lp: R_(-1, 0, -0.6) }) },
  cross:   { f: () => ({ rh: R_(-0.07, 0.69, 0.12), rp: R_(1, -1, 0.2), lh: R_(0.075, 0.665, 0.125), lp: R_(-1, -1, 0.2) }) },
  chin:    { f: () => ({ rh: R_(0.01, 0.855, 0.105), rp: R_(0.2, -1, 0.3), lh: R_(0.06, 0.68, 0.12), lp: R_(-1, -1, 0.2), head: 0.08 }) },
  pockets: { f: () => ({ rh: R_(0.115, 0.5, 0.05), rp: R_(1, 0, -0.5), lh: R_(-0.115, 0.5, 0.05), lp: R_(-1, 0, -0.5) }) },
  point:   { dur: [2.5, 4], f: (n, t) => ({ rh: R_(0.16, 0.87 + 0.01 * Math.sin(t * 3), 0.34), rp: R_(1, -1, 0), head: -0.05 }) },
  photo:   { f: () => ({ rh: R_(0.045, 0.88, 0.25), rp: R_(1, -0.8, 0), lh: R_(-0.045, 0.88, 0.25), lp: R_(-1, -0.8, 0), prop: 'shoot' }) },
  phone:   { walk: true, f: () => ({ rh: R_(0.035, 0.71, 0.2), rp: R_(1, -1, 0), head: 0.38, prop: 'look' }) },
  call:    { f: () => ({ rh: R_(0.09, 0.905, 0.035), rp: R_(0.6, -0.8, 0.25), prop: 'call' }) },
  watch:   { dur: [2.2, 3.2], f: () => ({ lh: R_(-0.01, 0.73, 0.21), lp: R_(-1, -1, 0), head: 0.3 }) },
  scratch: { dur: [1.8, 2.8], f: (n, t) => ({ rh: R_(0.065, 0.965 + 0.012 * Math.sin(t * 14), -0.03), rp: R_(1, 0.2, 0.3), head: 0.1 }) },
  stretch: { dur: [2.4, 3.2], f: (n, t) => { const k = Math.min(1, t / 1.2); return { rh: R_(0.09, 0.9 + 0.23 * k, 0.02), rp: R_(1, 0, 0), lh: R_(-0.09, 0.9 + 0.23 * k, 0.02), lp: R_(-1, 0, 0), head: -0.2 * k }; } },
  bend:    { f: () => ({ rh: R_(0.035, 0.56, -0.12), rp: R_(1, 0, -0.6), lh: R_(-0.035, 0.56, -0.12), lp: R_(-1, 0, -0.6), bend: 0.75, head: 0.15 }) },
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
};
/** 방 주제마다 어울리는 동작 */
const ACT_ROOM = {
  trophies: ['behind', 'cross', 'point', 'photo', 'chin', 'bend'],
  portraits: ['behind', 'chin', 'cross', 'photo', 'bend'],
  scorecards: ['bend', 'chin', 'cross', 'behind', 'crouch'],
  clips: ['cross', 'chin', 'clap', 'pockets'],
  photos: ['photo', 'point', 'behind', 'chin'],
  champion: ['behind', 'photo', 'clap', 'cross'],
  lobby: ['phone', 'call', 'watch', 'pockets', 'stretch'],
  courses: ['point', 'behind', 'cross', 'crouch'],
  workshop: ['scratch', 'cross', 'bend', 'crouch'],
};
const ACT_ANY = ['behind', 'cross', 'pockets', 'phone', 'watch', 'scratch', 'stretch', 'chin', 'call'];
const ACT_CALL = {
  day: [['응, 나 지금 전시관이야.'], ['어, 트로피실 앞. 이따 봐.'], ['사진 찍어서 보낼게. 끊어.']],
  night: [['여보세요? … 여보세요?'], ['… 어디냐고? 여기 있잖아. 네 뒤에.'], ['응. 응. … 아직 못 나갔어.'], ['… 지금 누구랑 있냐고? 혼자야. 혼자인데.']],
};
const ACT_SHOT = [['… 안 나오네요.'], ['어? 화면엔 두 분인데.'], ['방금 뒤에 계신 분, 일행이세요?'], ['찍혔어요. 이제 같이 걸려요.']];

/** 지금 할 동작 고르기 — null 이면 그냥 선다 */
function actPick(n) {
  const night = isNightMode(), r = M.roomById[n.room];
  if (n.out) {
    if (n.role === 'stroll' && n.cast && n.cast.lines === 'practice') return n.state === 'look' ? 'putt' : null;
    if (n.role === 'kid') {
      if (n.state === 'stare') return night ? (n.lead ? null : 'point') : 'wave';
      return n.state === 'look' && !n.lead && Math.random() < 0.45 ? 'crouch' : null;
    }
    if (n.role === 'watch') return null;                                     // 손짓은 따로(actStep)
    if (n.state === 'walk') return 'behind';
    return n.state === 'look' ? pickOf(['behind', 'behind', 'watch', 'pockets', 'stretch']) : null;
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
  if (n.out) {
    if (id === 'beckon') return s === 'look';
    if (id === 'putt') return s === 'look';
    if (n.role === 'kid') return id === 'crouch' ? s === 'look' : s === 'stare';
    return s === 'look' || (s === 'walk' && id === 'behind');
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
  if (d > 14) return;
  const k = clamp(1 - d / 14, 0, 1) ** 2, pan = typeof sndPan === 'function' ? sndPan(x, z) : 0, t0 = c.currentTime + 0.005;
  const hits = kind === 'shutter' ? [[0, 0.5, 3200, 0.018], [0.06, 0.35, 2400, 0.02]] : [[0, isNightMode() ? 0.85 : 0.5, 1300, 0.05]];
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
  // 허리 — 앞으로 숙인다(오른쪽 축 음의 방향)
  if (pose.bend) {
    const k = pose.bend * w;
    for (const [b, f] of [[B.sp, 0.3], [B.sp1, 0.35], [B.sp2, 0.35]]) { if (!b) continue; _aq.setFromAxisAngle(_aR, -k * f); actRotW(b, _aq); b.updateMatrixWorld(true); }
  }
  if (pose.rh) actIK(B.ra, B.rf, B.rh, actPt(v, pose.rh, new THREE.Vector3()), actDir(v, pose.rp || [1, -1, 0], new THREE.Vector3()), w);
  if (pose.lh) actIK(B.la, B.lf, B.lh, actPt(v, pose.lh, new THREE.Vector3()), actDir(v, pose.lp || [-1, -1, 0], new THREE.Vector3()), w);
  if (pose.head && B.head) { _aq.setFromAxisAngle(_aR, -pose.head * w); actRotW(B.head, _aq); B.head.updateMatrixWorld(true); }
}

/** 매 프레임 — npcPose 가 클립을 돌린 뒤 부른다 */
function actStep(n, dt) {
  const v = n.v; if (!v || !v.real) return;
  const A = n.act || (n.act = { id: null, w: 0, t: 0, dur: 0, cool: 1 + Math.random() * 5, end: false });
  if (n.walkStyle === undefined) n.walkStyle = n.out ? null : [null, 'behind', null, 'phone', null, null, 'behind'][(n.idx || 0) % 7];
  const night = isNightMode();
  A.cool -= dt;
  // 숲가의 그 사람(밤) — 멀리서 보이면 이리 오라고 손짓한다
  if (n.role === 'watch' && !A.id && A.cool <= 0 && n.state === 'look' && n.pd > 1000 && n.pd < 4500 && typeof outSeen === 'function' && outSeen(n)) {
    Object.assign(A, { id: 'beckon', t: 0, dur: 5 + Math.random() * 2, end: false, seen: 0 });
  }
  if (A.id && (A.t > A.dur || !actOk(n, A.id))) {
    // 걷다 멈췄는데 그 자리에서도 같은 동작이면(뒷짐) 이어서
    if (!A.end && A.id === 'behind' && n.state === 'look' && !n.out && Math.random() < 0.5) { A.t = 0; A.dur = 4 + Math.random() * 5; }
    else A.end = true;
  }
  if (!A.id && A.cool <= 0) {
    const id = actPick(n);
    if (id) {
      const D = ACTS[id].dur, walkish = n.state === 'walk' || id === 'putt' || n.state === 'stare' || n.state === 'mono';
      Object.assign(A, { id, t: 0, end: false, dur: walkish ? 999 : D ? D[0] + Math.random() * (D[1] - D[0]) : 4 + Math.random() * 6,
        slow: id === 'clap' && night, shoot: 0, snapT: 2 + Math.random() * 3, hitPh: 0 });
      if (id === 'call' && !n.mono && n.pd < 900 && typeof monoStart === 'function') monoStart(n, pickOf(night ? ACT_CALL.night : ACT_CALL.day), night ? 'mono' : 'say');
    } else A.cool = 1.5 + Math.random() * 3;
  }
  if (!A.id) return;
  A.t += dt;
  A.w += ((A.end ? 0 : 1) - A.w) * Math.min(1, dt * (A.id === 'beckon' ? 2 : 3.5));
  if (A.end && A.w < 0.02) {
    A.cool = A.id === 'beckon' ? 25 + Math.random() * 20 : n.state === 'walk' ? 0.4 : 1.5 + Math.random() * 4;
    A.id = null; A.w = 0;
    if (A.saveL) { n.goal.lx = A.saveL.lx; n.goal.lz = A.saveL.lz; A.saveL = null; }
    const P = v.props; if (P) { P.phone.visible = false; P.putter.visible = false; }
    return;
  }
  const pose = ACTS[A.id].f(n, A.t);
  actApply(n, pose, A.w);
  actPropStep(n, pose, A.w);
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
  if (A.id === 'clap' && A.w > 0.7) {
    const ph = Math.floor(A.t * (A.slow ? 0.9 : 2.6));
    if (ph !== A.hitPh) { A.hitPh = ph; actSnd('clap', n); }
  }
  if (A.id === 'beckon' && typeof outSeen === 'function' && outSeen(n)) { A.seen += dt; if (A.seen > 2 && typeof hauntRec === 'function') hauntRec('beckon'); }
}
/** 전역 — 플래시가 사그라든다 · 밤 사진 쿨다운 */
function stepActs(dt) {
  ACT.shotCool -= dt;
  if (ACT.flashes) for (const sp of ACT.flashes) { sp.userData.t -= dt; sp.material.opacity = clamp(sp.userData.t / 0.14, 0, 1); if (sp.userData.t <= 0) { sp.visible = false; ACT.flashes.delete(sp); } }
}
