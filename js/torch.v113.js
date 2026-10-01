/* ══════════════════════════════════════════════════════════
   손전등 — 호러 7단계 (v105)
   ══════════════════════════════════════════════════════════
   어둠에 맞설 도구가 하나 생긴다. F 키(휴대폰은 칩)로 켜고 끈다.
     · 배터리 — 켜 두면 6분쯤이면 닳는다(끄면 천천히 찬다). 20% 아래에선 가물거리고, 다 닳으면 한동안 안 켜진다
     · 그림자를 비추면 — 빛 속에 0.6초 붙잡히는 순간 손전등이 '툭' 죽고, 다시 켜지면 없다
     · 빛 속에만 있는 사람 — 켜고 다니면 가끔 빛 안에만 보이는 사람이 있다(비킨 곳에는 없다)
     · 정전 때 켜면 — 번쩍임 사이에만 보이던 그 사람이 빛 속에 계속 서 있다
     · 관람객 얼굴을 비추면 — "눈부셔요." · 아이들은 깔깔대며 달아난다
   광원은 입장 전에 한 번 만든다(끄면 세기 0 — 광원 수가 변하지 않아 재컴파일이 없다) */
const TORCH = { on: false, bat: 1, k: 1, dead: 0, hit: 0, chip: null, told: false };
const ASK_LIGHT = [['눈부셔요.'], ['… 끄세요. 보여요.'], ['그 불빛, 저쪽으로 돌리지 마세요.', '저쪽은 비추면 안 돼요.'], ['아, 사람이었구나.'], ['… 우리 얼굴 보지 마세요.']];

function torchInit() {
  if (M.torch) return;
  const sp = new THREE.SpotLight(0xFFF1DC, 0, 24, 0.38, 0.6, 1.6);
  sp.castShadow = false;
  const tgt = new THREE.Object3D();
  M.scene.add(sp, tgt); sp.target = tgt;
  M.torch = sp;
}
function torchToggle(on) {
  if (!M.torch) return;
  const want = on == null ? !TORCH.on : on;
  if (want && (TORCH.dead > 0 || TORCH.bat < 0.06)) { torchClick(); toast('손전등이 켜지지 않는다. 배터리가 없다.', 2200); return; }
  TORCH.on = want;
  torchClick();
  torchChip();
  if (want && !TORCH.told) { TORCH.told = true; toast('손전등 — F 키로 켜고 끈다. 배터리는 끄면 천천히 찬다', 3600); }
}
function torchClick() {
  const c = typeof SND !== 'undefined' && SND.ctx; if (!c || !SND.on) return;
  const t0 = c.currentTime, o = c.createOscillator(), g = c.createGain();
  o.type = 'square'; o.frequency.setValueAtTime(1800, t0); o.frequency.exponentialRampToValueAtTime(600, t0 + 0.02);
  g.gain.setValueAtTime(0.05, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.035);
  o.connect(g); g.connect(SND.bus); o.start(t0); o.stop(t0 + 0.05);
}
function torchChip() {
  let c = TORCH.chip || document.getElementById('torchChip');
  if (!c) {
    c = document.createElement('button'); c.id = 'torchChip'; c.className = 'bgm-chip torch-chip';
    c.addEventListener('click', (ev) => { ev.stopPropagation(); torchToggle(); });
    (document.getElementById('gal') || document.body).appendChild(c);
    TORCH.chip = c;
  }
  const n = Math.ceil(TORCH.bat * 4), bars = '▮'.repeat(n) + '▯'.repeat(4 - n);
  const txt = (TORCH.on ? '🔦 손전등 끄기 ' : '🔦 손전등 ') + bars;
  if (c.textContent !== txt) c.textContent = txt;
  c.classList.toggle('off', !TORCH.on);
  c.classList.toggle('low', TORCH.bat < 0.2);
}
/** 이 점(m)이 손전등 빛 안에 있는가 */
function torchSees(p, maxD = 22) {
  if (!TORCH.on || TORCH.k < 0.3 || !M.cam) return false;
  const cp = M.cam.position, dx = p.x - cp.x, dy = (p.y + 1.3) - cp.y, dz = p.z - cp.z, d = Math.hypot(dx, dy, dz);
  if (d > maxD || d < 0.3) return false;
  const f = TORCH.fwd || new THREE.Vector3(0, 0, -1);
  return (dx * f.x + dy * f.y + dz * f.z) / d > Math.cos(0.33);
}
/** 손전등이 죽는다(그림자에 닿았을 때 · 배터리) */
function torchDie(sec) {
  TORCH.dead = Math.max(TORCH.dead, sec);
  if (typeof sndCrackle === 'function') sndCrackle(0.18);
}
function stepTorch(dt) {
  if (!M.torch || !M.cam) return;
  if (!TORCH.chip && M.ready && !M.attract) torchChip();
  // 자리 — 오른손에 든 것처럼 눈에서 조금 오른쪽 아래, 보는 쪽으로
  const q = M.cam.quaternion;
  const f = TORCH.fwd = (TORCH.fwd || new THREE.Vector3()).set(0, 0, -1).applyQuaternion(q);
  const r = new THREE.Vector3(1, 0, 0).applyQuaternion(q), u = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
  M.torch.position.copy(M.cam.position).addScaledVector(r, 0.22).addScaledVector(u, -0.28);
  M.torch.target.position.copy(M.cam.position).addScaledVector(f, 10);
  M.torch.target.updateMatrixWorld();
  // 배터리
  const calm = typeof HAUNT !== 'undefined' && HAUNT.calm;
  if (TORCH.on) TORCH.bat = Math.max(0, TORCH.bat - dt / 360);
  else TORCH.bat = Math.min(1, TORCH.bat + dt / 200);
  if (TORCH.dead > 0) TORCH.dead -= dt;
  if (TORCH.on && TORCH.bat <= 0) { TORCH.on = false; torchDie(20); toast('손전등이 꺼졌다. 배터리가 다 됐다.', 2400); }
  // 세기 — 가물거림(배터리가 없을 때 · 밤이 깊을 때 가끔) · 죽음
  let k = TORCH.on && TORCH.dead <= 0 ? 1 : 0;
  if (k && TORCH.bat < 0.2) { const n = Math.sin(M.t * 23.7) * Math.sin(M.t * 7.3); if (n > 0.55) k = 0.25; }
  if (k && !calm && typeof HAUNT !== 'undefined' && HAUNT.dread > 0.5 && typeof nightFlick === 'function') k *= nightFlick({ flicker: true, seed: 71.3 }, M.t * 0.6) < 0.5 ? 0.3 : 1;
  TORCH.k = k;
  M.torch.intensity = 38 * k * (0.75 + 0.25 * Math.min(1, TORCH.bat * 3));
  torchChip();
  if (!TORCH.on || calm || typeof HAUNT === 'undefined') { TORCH.hit = 0; return; }
  // 그림자를 비추면 — 0.6초 붙잡히면 손전등이 죽고, 다시 켜지면 없다
  const S = HAUNT.shade;
  if (S && S.root.visible && torchSees(S.root.position)) {
    TORCH.hit += dt;
    if (TORCH.hit > 0.6) {
      TORCH.hit = 0; torchDie(1.6); if (typeof hauntRec === 'function') hauntRec('banish'); 
      if (typeof hapt === 'function') hapt([40, 50, 40]);
      shadeHide();
      if (HAUNT.ev) { HAUNT.ev.done = true; HAUNT.ev = null; }
      if (NIGHT.black) NIGHT.black.shadeOK = false;
      if (typeof sndBreath === 'function') setTimeout(() => sndBreath(0.07, 0), 500);
    }
  } else TORCH.hit = Math.max(0, TORCH.hit - dt);
  // 관람객 얼굴 — 6m 안에서 빛이 닿으면
  for (const n of M.npcs || []) {
    n.lightCool = (n.lightCool || 0) - dt;
    if (n.lightCool > 0 || n.finale || n.talk) continue;
    const room = M.roomById[n.room], p = { x: n.x / CM, y: (room.y0 + (n.fy || 0)) / CM + n.hM * 0.9 - 1.3, z: n.z / CM };
    if (!torchSees(p, 6)) continue;
    n.lightCool = 30 + Math.random() * 20;
    if (n.out && n.role === 'kid' && !n.lead) {
      n.state = 'stare'; n.tgt = null; n.wait = 1.2; n.cool = 0;
      monoForce(n, [pickOf([['(키득키득)'], ['눈부셔!'], ['찾았다—!']])[0]], 'kid', 0.2);
    } else if (!n.out) {
      n.state = 'notice'; n.noticeT = 3.5; n.path = []; n.pause = 0;
      monoForce(n, pickOf(ASK_LIGHT), 'say', 0.3);
    } else if (n.role !== 'watch') {
      n.face = { x: M.pos.x * CM, z: M.pos.z * CM }; n.wait = Math.max(n.wait || 0, 4);
      monoForce(n, pickOf(ASK_LIGHT), 'say', 0.3);
    }
  }
}
/* 빛 속에만 있는 사람 — 켜고 다닐 때만. 9~13m 앞(빛 가까이)에 서 있고, 빛이 비켜 가면 보이지 않는다 */
function beamWatch(o) {
  return {
    t: 0, done: false,
    step(dt) {
      if (this.done) return;
      this.t += dt;
      const S = HAUNT.shade; if (!S) { this.done = true; return; }
      S.root.visible = torchSees(S.root.position);
      if (S.root.visible) { if (typeof hauntRec === 'function') hauntRec('beam'); }
      const d = Math.hypot(o.x - M.pos.x * CM, o.z - M.pos.z * CM);
      if (!TORCH.on || d < 450 || this.t > 9 || !hauntOK()) { shadeHide(); this.done = true; }
    },
  };
}
if (typeof HAUNT_EV !== 'undefined') {
  HAUNT_EV.beam = function () {
    if (!TORCH.on || TORCH.k < 0.5 || HAUNT.blackShade) return false;
    const here = M.room, f = hauntFwd(), PX = M.pos.x * CM, PZ = M.pos.z * CM;
    for (let k = 0; k < 14; k++) {
      const a = (Math.random() - 0.5) * 0.35, D = 900 + Math.random() * 400;
      const x = PX + (f.x * Math.cos(a) - f.z * Math.sin(a)) * D, z = PZ + (f.z * Math.cos(a) + f.x * Math.sin(a)) * D;
      const r = here.outdoor ? M.rooms.find((q) => q.outdoor && !q.part && q.lv === 0 && inRect(q, x, z)) : (inRect(here, x, z) ? here : null);
      if (!r || (r.terrain && lakeDist(x, z) < 1.12)) continue;
      const fy = floorAt(r, x, z);
      if (!(fy === fy) || hitsWall(x, z, fy)) continue;
      if (!shadeAt(x, z, r)) return false;
      HAUNT.shade.root.visible = false;
      HAUNT.ev = beamWatch({ x, z });
      return true;
    }
    return false;
  };
}
