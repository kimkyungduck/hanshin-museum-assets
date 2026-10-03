/* ══════════════════════════════════════════════════════════
   이상 현상 — 호러 3단계 (v101)
   ══════════════════════════════════════════════════════════
   밤이 깊을수록(머문 시간 → HAUNT.dread 0 → 1, 15분) 드물게 → 잦게. 한 번에 하나씩, 모두 짧게.
     · 따라오는 발소리 — 걸으면 한 박자 늦게 뒤에서 발소리가 따라온다. 멈추면 멈춘다. 돌아보면 끊기고 숨소리
     · 문간의 그림자 — 옆방 문 너머에 검은 옷의 창백한 사람이 서 있다. 다가가거나 오래 보면 불이 한 번 깜빡이고 없다
     · 정전 속의 사람 — 다음 정전 때, 불이 다시 들어오는 번쩍임 사이에만 바로 앞에 서 있다
     · 안개 속의 사람(바깥) — 30m 앞 안개 속에 서 있다가 다가가면 사라진다
     · 속삭임 — 등 뒤에서 누가 부른다(자막만 흐릿하게)
     · 일제히 — 보이는 관람객들이 모두 하던 것을 멈추고 동시에 나를 본다(dread 가 오른 뒤)
     · 화면이 튄다 — 반전 · 흑백 · 붉은 번짐이 한순간
   ※ 피 · 비명 · 갑자기 튀어나오는 큰 소리는 없다. 이상한 것만 */
const HAUNT = { t: 0, dread: 0, next: 30 + Math.random() * 20, ev: null, follow: 0, shade: null, jumpCool: 140, turnAcc: 0, lastYaw: null };   // v114 — 첫 현상 30초 안팎
const WHISPER = ['… 여기야.', '뒤에.', '돌아보지 마.', '… 이름이 뭐였더라.', '같이 있자.', '거기 아니야.', '… 찾았다.', '한 홀만 더.', '불 끄지 마.'];

function hauntOK() {
  return M.ready && M.room && !M.attract && !M.openId && !(typeof GOLF !== 'undefined' && GOLF.mode)
    && !(typeof CART !== 'undefined' && CART.driving) && !(typeof LAKE !== 'undefined' && LAKE.under);
}
const hauntFwd = () => ({ x: -Math.sin(M.yaw), z: -Math.cos(M.yaw) });       // 내가 보는 쪽(수평)
/** 화면 어디쯤인가 — { on, x, y } (NDC) */
function hauntView(xm, ym, zm) {
  const v = new THREE.Vector3(xm, ym, zm).project(M.cam);
  return { on: v.z < 1 && Math.abs(v.x) < 0.95 && Math.abs(v.y) < 0.95, x: v.x, y: v.y };
}

/* ── 그림자 사람 — 검은 옷 · 창백한 얼굴 · 움직이지 않는다(고개만 한쪽으로 꺾여 있다) ───────── */
function hauntShade() {
  if (HAUNT.shade) return HAUNT.shade;
  if (typeof PEOPLE === 'undefined' || !PEOPLE.ok || typeof buildRealVisitor !== 'function') return null;
  // v112 — 그 사람은 따로(p12 긴 검은 머리 여자). 예전엔 실내 관람객 Remy 를 검게 칠해 썼다(같은 얼굴이 실내에도 있었다)
  const name = PEOPLE.byName && PEOPLE.byName.p12 ? 'p12' : 'p2';
  const v = buildRealVisitor({ coat: '#09090B', pants: '#070708', hairC: '#050505', skin: '#E4DFDA', shoe: '#0A0A0A', h: 1.9 }, name);
  if (name === 'p12') v.mesh.material.color.setRGB(0.86, 0.86, 0.9);         // 살갗을 조금 더 창백하게(옷은 아틀라스에서 검다)
  else if (name !== 'remy') v.mesh.material.color.setRGB(0.3, 0.3, 0.33);
  v.idle.setEffectiveWeight(1); v.walk.setEffectiveWeight(0);
  v.mixer.update(1.3);                                   // 서 있기 한 순간에서 멈춘다 — 숨도 쉬지 않는다
  v.root.updateMatrixWorld(true);
  const B = typeof npcBones === 'function' ? npcBones(v) : {};
  if (B.head && typeof boneRotWorld === 'function') { boneRotWorld(B.head, new THREE.Vector3(0, 0, 1), 0.42); boneRotWorld(B.head, new THREE.Vector3(1, 0, 0), 0.12); }
  if (typeof floodPatch === 'function') floodPatch(v.mesh.material);
  v.root.visible = false;
  M.scene.add(v.root);
  HAUNT.shade = v;
  return v;
}
function shadeAt(x, z, room) {
  const v = hauntShade(); if (!v) return false;
  const y = room ? floorAt(room, x, z) : 0;
  v.root.position.set(x / CM, (y === y ? y : room.y0) / CM, z / CM);
  v.root.rotation.y = Math.atan2(M.pos.x * CM - x, M.pos.z * CM - z);
  v.root.visible = true;
  return true;
}
function shadeHide() { if (HAUNT.shade) HAUNT.shade.root.visible = false; }

/* ── 소리 ─────────────────────────────────────────────── */
function sndBreath(vol, pan) {
  const c = SND.ctx; if (!c || !SND.on) return;
  const t0 = c.currentTime, n = Math.floor(c.sampleRate * 1.1), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(); s.buffer = b;
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(700, t0); bp.frequency.linearRampToValueAtTime(1100, t0 + 0.9); bp.Q.value = 1.2;
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.05);
  s.connect(bp); bp.connect(g); sndPanned(g, pan, 0.4); s.start(t0);
}
/** 낮은 웅웅거림이 한 번 부푼다(그림자가 나타날 때) */
function sndSwell() {
  const c = SND.ctx; if (!c || !SND.on || !SND.night) return;
  if (typeof scoreHush === 'function') scoreHush(7);                       // v106 — 나타날 땐 음악이 멎는다
  if (typeof hapt === 'function') hapt(25);
  const g = SND.night.drone.gain, t = c.currentTime;
  g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0.16, t + 1.2); g.linearRampToValueAtTime(0.05, t + 4.5);
}

/* ── 화면 · 자막 ───────────────────────────────────────── */
function hauntGlitch() {
  if (typeof hapt === 'function') hapt([30, 40, 20]);
  let el = document.getElementById('hauntGlitch');
  if (!el) { el = document.createElement('div'); el.id = 'hauntGlitch'; el.className = 'haunt-glitch'; document.getElementById('gal').appendChild(el); }
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  if (typeof sndCrackle === 'function') sndCrackle(0.28);
}
function hauntSay(text) {
  let el = document.getElementById('hauntSay');
  if (!el) { el = document.createElement('div'); el.id = 'hauntSay'; el.className = 'haunt-say'; document.getElementById('gal').appendChild(el); }
  el.textContent = text; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
}
/** 미세 깜빡임 — 지금 방 불이 한 번 '툭' (정전보다 짧게) */
function hauntBlink() {
  if (M.room && !M.room.outdoor && !NIGHT.black) NIGHT.black = { room: M.room.id, t: 0, dur: 0.14, k: 1, on: false, quick: true };
  else hauntGlitch();
}

/* ── 사건들 ───────────────────────────────────────────── */
const HAUNT_EV = {
  follow() {
    HAUNT.follow = 7 + Math.random() * 6; HAUNT.followYaw = M.yaw;
    return true;
  },
  glitch() { hauntGlitch(); if (M.room && !M.room.outdoor) hauntBlink(); return true; },
  whisper() {
    const f = hauntFwd(), bx = M.pos.x * CM - f.x * 160, bz = M.pos.z * CM - f.z * 160;
    if (typeof sndMurmur === 'function') sndMurmur({ x: bx, z: bz, v: { hM: 1.6 }, room: M.room.id }, 1.3, true);
    setTimeout(() => hauntSay(pickOf(WHISPER)), 250);
    return true;
  },
  stare() {
    // 보이는 관람객이 모두 동시에 멈춰 나를 본다 — 말없이
    let n0 = 0;
    for (const n of M.npcs || []) {
      const r = M.roomById[n.room];
      if (n.out || n.talk || n.finale || !r || Math.abs(r.y0 - (M.feet || 0)) > 150 || Math.hypot(n.x - M.pos.x * CM, n.z - M.pos.z * CM) > 2200) continue;
      if (!hauntView(n.x / CM, r.y0 / CM + 1.5, n.z / CM).on) continue;
      n.state = 'notice'; n.noticeT = 5; n.noticeFar = true; n.path = []; n.pause = 0;
      if (n.mono && n.mono.el) n.mono.el.remove(); n.mono = null;
      n0++;
    }
    if (n0 >= 1) { if (typeof hauntRec === 'function') hauntRec('stare'); }
    return n0 >= 1;
  },
  shade() {
    // 옆방 문 너머 — 내 화면 안에 있고 7m 넘게 떨어진 문
    if (typeof crowdGraph !== 'function' || HAUNT.blackShade) return false;
    const G = crowdGraph(), here = M.room, PX = M.pos.x * CM, PZ = M.pos.z * CM;
    const cand = (G.get(here.id) || []).filter((e) => {
      const d = Math.hypot(e.into.x - PX, e.into.z - PZ), to = M.roomById[e.to];
      return d > 700 && to && hauntView(e.into.x / CM, to.y0 / CM + 1.4, e.into.z / CM).on;
    });
    if (!cand.length) {
      // v109 — 문이 안 보이면: 지금 방의 먼 끝, 벽 앞 1m
      if (here.outdoor || here.w < 900 || here.d < 900) return false;
      for (let k = 0; k < 14; k++) {
        const x = here.x0 + 100 + Math.random() * (here.w - 200), z = here.z0 + 100 + Math.random() * (here.d - 200);
        const nearWall = Math.min(x - here.x0, here.x1 - x, z - here.z0, here.z1 - z) < 160;
        if (!nearWall || Math.hypot(x - PX, z - PZ) < 700 || hitsWall(x, z, here.y0)) continue;
        if (!hauntView(x / CM, here.y0 / CM + 1.4, z / CM).on) continue;
        if (!shadeAt(x, z, here)) return false;
        sndSwell();
        HAUNT.ev = shadeWatch({ x, z, room: here, near: 600, life: 9 });
        return true;
      }
      return false;
    }
    const e = pickOf(cand), to = M.roomById[e.to];
    // 문 가운데에서 1.3m 더 들어간 곳 — 문틀 안에 딱 들어오게
    const dx = e.into.x - e.p.x, dz = e.into.z - e.p.z, L = Math.hypot(dx, dz) || 1;
    const x = e.p.x + dx / L * 130, z = e.p.z + dz / L * 130;
    if (!shadeAt(x, z, to)) return false;
    sndSwell();
    HAUNT.ev = shadeWatch({ x, z, room: to, near: 600, life: 10 });
    return true;
  },
  shadeOut() {
    if (HAUNT.blackShade) return false;
    const f = hauntFwd(), PX = M.pos.x * CM, PZ = M.pos.z * CM;
    for (let k = 0; k < 16; k++) {
      const a = Math.atan2(f.x, f.z) + (Math.random() - 0.5) * 0.7, d = 2600 + Math.random() * 900;
      const x = PX + Math.sin(a) * d, z = PZ + Math.cos(a) * d;
      const r = typeof pickRoom === 'function' ? M.rooms.find((q) => q.outdoor && !q.part && inRect(q, x, z) && q.lv === 0) : null;
      if (!r) continue;
      if (r.terrain && lakeDist(x, z) < 1.12) continue;
      const fy = floorAt(r, x, z);
      if (!(fy === fy) || hitsWall(x, z, fy)) continue;
      if (!hauntView(x / CM, fy / CM + 1.4, z / CM).on) continue;
      shadeAt(x, z, r);
      sndSwell();
      HAUNT.ev = shadeWatch({ x, z, room: r, near: 1500, life: 14, out: true });
      return true;
    }
    return false;
  },
  blackShade() {
    if (!M.room || M.room.outdoor) return false;
    HAUNT.blackShade = true;
    NIGHT.blackT = Math.min(NIGHT.blackT, 2 + Math.random() * 3);
    return true;
  },
};
/** 그림자를 지켜본다 — 다가오면 · 오래 보면 · 한동안 안 보면 사라진다 */
function shadeWatch(o) {
  return {
    t: 0, look: 0, seen: false, away: 0, done: false,
    step(dt) {
      this.t += dt;
      const PX = M.pos.x * CM, PZ = M.pos.z * CM, d = Math.hypot(o.x - PX, o.z - PZ);
      const V = hauntView(o.x / CM, (floorAt(o.room, o.x, o.z) || o.room.y0) / CM + 1.5, o.z / CM);
      if (V.on) { if (!this.seen) { if (typeof hauntRec === 'function') hauntRec(o.out ? 'fog' : 'shade'); sndStinger(0.045); } this.seen = true; this.away = 0; if (Math.abs(V.x) < 0.3 && Math.abs(V.y) < 0.4) this.look += dt; } else this.away += dt;
      const gone = d < o.near || this.look > 1.6 || this.t > o.life || (this.seen && this.away > 2.5) || !hauntOK();
      if (!gone) return;
      if (V.on) { if (o.out) hauntGlitch(); else hauntBlink(); }        // 보는 앞에서는 불이 깜빡이는 사이에
      else if (d < 1200 && typeof sndBreath === 'function') sndBreath(0.05, 0);
      if (o.room && !o.room.outdoor) hauntStain(o.x, o.z, o.room);
      shadeHide(); this.done = true;
    },
  };
}

/* ── 매 프레임 ─────────────────────────────────────────── */
function stepHaunt(dt) {
  if (!NIGHT.on || !M.ready || M.attract) return;
  HAUNT.t += dt;
  HAUNT.dread = clamp(HAUNT.t / 900, 0, 1);
  stepJump(dt);                                                            // v114 — 뒤돌면
  stepSeen();                                                              // v115 — 같은 사람이 또
  stepVault(dt);                                                           // v108 — 지하 수장고
  if (HAUNT.calm) { stepTilts(dt); return; }                              // v103 — 결말 뒤 조용한 밤
  secondNightInit();                                                       // v104 — 두 번째 밤
  stepFinale(dt);                                                          // v103 — 마지막 방송 · 결말
  if (HAUNT.finale && HAUNT.finale.phase !== 'call') { if (HAUNT.ev) { HAUNT.ev.step(dt); if (HAUNT.ev.done) HAUNT.ev = null; } }
  stepHaunt4(dt);                                                          // v102 — 안내 방송 · 기울어진 액자 · 새 초상
  // 따라오는 발소리 — 돌아보면 끊긴다(숨소리)
  if (HAUNT.follow > 0) {
    HAUNT.follow -= dt;
    if (Math.abs(npcAng(M.yaw - HAUNT.followYaw)) > 2.3) { HAUNT.follow = 0; sndBreath(0.06, 0); }
  }
  // 정전 속의 사람 — 불이 다시 들어오는 번쩍임 사이에만
  const B = NIGHT.black;
  if (HAUNT.blackShade && B && !B.quick) {
    if (!B.shadeSet) {
      B.shadeSet = true;
      const f = hauntFwd(), x = M.pos.x * CM + f.x * 240, z = M.pos.z * CM + f.z * 240;
      B.shadeOK = !HAUNT.ev && !hitsWall(x, z, M.room.y0) && shadeAt(x, z, M.roomById[B.room]);
      if (B.shadeOK) { shadeHide(); HAUNT.bsOwn = true; }
    }
    // 손전등을 켜 두면 — 번쩍임 사이가 아니어도 빛 속에 계속 서 있다(torch.js)
    if (B.shadeOK && HAUNT.shade) { HAUNT.shade.root.visible = (B.t >= B.dur && B.t < B.dur + 0.24 && B.k > 0.3) || (typeof torchSees === 'function' && torchSees(HAUNT.shade.root.position)); if (HAUNT.shade.root.visible) { if (typeof hauntRec === 'function') hauntRec('black'); } }
  } else if (HAUNT.blackShade && B === null && HAUNT.bsArmed) { HAUNT.blackShade = false; HAUNT.bsArmed = false; if (HAUNT.bsOwn) shadeHide(); HAUNT.bsOwn = false; }
  if (HAUNT.blackShade && B && !B.quick) HAUNT.bsArmed = true;

  if (HAUNT.finale && HAUNT.finale.phase !== 'call') return;
  if (HAUNT.ev) { HAUNT.ev.step(dt); if (HAUNT.ev.done) HAUNT.ev = null; return; }
  if (!hauntOK()) return;
  HAUNT.next -= dt;
  if (HAUNT.next < 8 && typeof scoreHush === 'function') scoreHush(0.3);   // v106 — 무언가 오기 전, 조용해진다
  if (HAUNT.next > 0) return;
  const out = M.room.outdoor, dr = HAUNT.dread;
  const mm = HAUNT.nights >= 1 ? 1 : 0;                                    // v104 — 두 번째 밤부터 '나란히 걷는 사람'
  const bm = typeof TORCH !== 'undefined' && TORCH.on && dr > 0.2 ? 2.5 : 0;   // v105 — 빛 속에만 있는 사람
  const W = out ? [['shadeOut', 3], ['whisper', 2], ['glitch', 1], ['follow', 1], ['mimic', 2.5 * mm], ['beam', bm], ['distant', 1.2]]
    : [['follow', 3], ['shade', 3], ['glitch', 1], ['whisper', 2], ['stare', dr > 0.3 ? 1.5 : 0], ['blackShade', dr > 0.15 ? 1.5 : 0.4], ['mimic', 1.5 * mm], ['beam', bm], ['window', 2.2], ['distant', 1.5],
       ['walker', dr > 0.5 && (HAUNT.walks || 0) < 2 ? 3 : 0], ['double', dr > 0.3 && (HAUNT.doubles || 0) < 3 ? 2.2 : 0]];
  // v109 — 안 되는 사건(보이는 문이 없다 · 관람객이 안 보인다 …)은 빼고 그 자리에서 다시 고른다.
  //         예전엔 실패하면 4초 뒤 다시 무작위 → 늘 성공하는 발소리 · 속삭임만 나왔다(밤새 그림자가 한 번도 안 나옴)
  let ok = false, pick = null, left = W.filter((w) => w[1] > 0);
  for (let tries = 0; tries < 4 && !ok && left.length; tries++) {
    // 소리만 나는 것(발소리 · 속삭임)은 앞의 두 번 동안 가볍게 — 보이는 것부터 해 본다
    const cand = tries < 2 ? left.map(([k, w]) => [k, k === 'follow' || k === 'whisper' || k === 'distant' ? w * 0.35 : w]) : left;
    let sum = cand.reduce((s, w) => s + w[1], 0), r = Math.random() * sum;
    pick = cand[0][0];
    for (const [k, w] of cand) { r -= w; if (r <= 0) { pick = k; break; } }
    ok = !!(HAUNT_EV[pick] && HAUNT_EV[pick]());
    left = left.filter((w) => w[0] !== pick);
  }
  HAUNT.next = ok ? (32 + Math.random() * 40) * (1.15 - 0.55 * dr) : 4;   // v114 — 더 자주
  HAUNT.last = pick;
}
/** 내 발소리 한 번 — 따라오는 중이면 한 박자 늦게, 2.5m 뒤에서 */
function hauntStep(vol) {
  if (!(HAUNT.follow > 0)) return;
  setTimeout(() => {
    if (!(HAUNT.follow > 0) || typeof sndStep !== 'function') return;
    const f = hauntFwd();
    sndStep(M.room, vol * 0.85, M.pos.x - f.x * 2.5, M.pos.z - f.z * 2.5);
  }, 320 + Math.random() * 70);
}

/* ══════════════════════════════════════════════════════════
   변하는 전시관 — 호러 4단계 (v102)
   ══════════════════════════════════════════════════════════
   · 안내 방송 — 딩동댕 뒤에 자막. 처음엔 평범하다가 밤이 깊을수록 어긋난다(지금 있는 방을 부르고, 차임이 음정을 잃는다).
     방송이 나오는 동안 관람객들은 걸음을 멈추고 천장을 올려다본다
   · 기울어진 액자 — 안 보는 사이 액자 하나가 비뚤어져 있다. 한 번 보고 눈을 돌리면, 누가 바로 걸어 놓았다
   · 관리자 메모 — 전시물 설명 끝에 가끔 붙는 메모(밤이 깊을수록 자주)
   · 새 초상 — 밤이 절반쯤 지나면 명예의 전당 이젤 위에 이름 없는 초상이 놓인다. 한 번 들여다보고 나면 눈이 생겨 있다 */
HAUNT.paT = 80 + Math.random() * 30;
HAUNT.tiltT = 110 + Math.random() * 40;
HAUNT.tilts = [];
const PA_LINES = [
  ['관람객 여러분께 안내 말씀 드립니다. 본관은 밤에도 문을 닫지 않습니다.', '18번 홀 조명은 자정까지 켜져 있습니다. 호숫가에서는 발밑을 조심해 주십시오.',
    '전시물에 손을 대지 말아 주십시오. 전시물도 여러분을 만지지 않습니다.', '관람을 마치신 분은 방명록에 이름을 남겨 주십시오. 이름은 오래 보관됩니다.'],
  ['보호자 없는 어린이를 보신 분은 … 말을 걸지 말아 주십시오.', '관람 중 자기 이름이 기억나지 않으시면 방명록을 확인해 주십시오.',
    '{room}에 계신 관람객께서는 잠시 그 자리에 멈춰 주십시오.', '분실물 안내 드립니다. 골프공 하나, 스코어카드 한 장, 그림자 하나를 보관하고 있습니다.'],
  ['관람 시간이 끝났습니다. 관람 시간이 끝났습니다. 관람 시간이 끝났…', '방금 {room}에 들어가신 분, 뒤에 한 분이 따라 들어가셨습니다.',
    '출구는 없습니다. … 안내가 잘못되었습니다. 출구는 정문입니다.', '오늘 입장객은 {n}명입니다. 퇴장객은 없습니다.', '{room}의 조명을 끕니다. … 농담입니다.'],
];
const HAUNT_NOTES = {
  portrait: ['이 초상은 밤마다 조금씩 고개를 돌립니다. 원래는 정면이었습니다.', '초상 속 인물이 관람객을 기억한다는 민원이 있었습니다. 확인 중입니다.'],
  photo: ['이 사진에 찍힌 사람 수는 볼 때마다 다를 수 있습니다.', '뒷줄 오른쪽 끝 인물은 회원 명부에 없습니다.'],
  scorecard: ['19번 홀 기록은 공식 기록으로 인정하지 않습니다.', '서명 가운데 하나는 잉크가 아직 마르지 않았습니다.'],
  trophy: ['이 트로피는 두 번 없어졌고, 두 번 다 제자리로 돌아왔습니다.', '받침대에 긁힌 이름은 지우지 마십시오. 다시 생깁니다.'],
  champion: ['우승자는 이 방을 나간 적이 없습니다.', '초상과 눈을 오래 맞추지 마십시오. 자리를 바꾸자고 합니다.'],
  screen: ['영상이 끝난 뒤 검은 화면을 오래 보지 마십시오.', '이 영상의 웃음소리 중 하나는 녹음된 적이 없습니다.'],
  any: ['이 설명은 관람객이 읽는 동안에만 적혀 있습니다.', '방명록 마지막 줄은 비워 두십시오. 곧 채워집니다.', '이 전시물 앞에서 이름을 부르는 소리가 들리면 대답하지 마십시오.'],
};

/* ── 안내 방송 ─────────────────────────────────────────── */
function sndChime(sour) {
  const c = SND.ctx; if (!c || !SND.on) return;
  const t0 = c.currentTime + 0.05, k = 1 - 0.05 * sour, gap = 0.42 + 0.18 * sour;
  [523.25, 659.25, 783.99].forEach((f, i) => {
    const ff = f * k * (i === 2 ? Math.pow(2, -1.3 * sour / 12) : 1);     // 마지막 음이 점점 반음 가까이 처진다
    for (const [type, amp] of [['sine', 0.07], ['triangle', 0.03]]) {
      const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = ff;
      if (sour > 0.5) { o.detune.setValueAtTime(0, t0 + i * gap); o.detune.linearRampToValueAtTime(-40 * sour, t0 + i * gap + 0.9); }
      sndEnv(g, t0 + i * gap, 0.01, amp, 1.1); o.connect(g); sndPanned(g, 0, 0.9);
      o.start(t0 + i * gap); o.stop(t0 + i * gap + 1.3);
    }
  });
}
function hauntPA(custom, tierSet) {
  let dr = HAUNT.dread, tier = tierSet != null ? tierSet : dr < 0.25 ? 0 : dr < 0.55 ? 1 : 2;
  if (!custom && HAUNT.doorNew) { HAUNT.doorNew = false; tier = 2; custom = '관계자 외 출입금지 구역의 문이 열려 있습니다. 가까이 가지 마십시오.'; }
  if (!custom && HAUNT.welcome) {
    HAUNT.welcome = false; tier = 2;
    custom = HAUNT.escaped ? '다시 오셨군요. 지난번엔 나가셨더군요. 이번엔 문을 잘 닫아 두었습니다.'
      : HAUNT.nights > 1 ? '다시 오셨군요. ' + (HAUNT.nights + 1) + '번째 밤입니다. 자리는 늘 비워 두었습니다.' : '다시 오셨군요. 기다리고 있었습니다.';
  }
  let line = custom || (HAUNT.portraitNew ? '명예의 전당에 새 초상이 걸렸습니다. 확인해 주십시오.' : pickOf(PA_LINES[tier]));
  HAUNT.portraitNew = false;
  const room = M.room ? M.room.name : '전시관';
  line = line.replace('{room}', room).replace('{n}', String((M.npcs ? M.npcs.length : 0) + 1));
  sndChime(tier / 2 + Math.random() * 0.15);
  let el = document.getElementById('hauntPA');
  if (!el) { el = document.createElement('div'); el.id = 'hauntPA'; el.className = 'haunt-pa'; document.getElementById('gal').appendChild(el); }
  el.innerHTML = '<span class="pa-k">안내 방송</span><span class="pa-t"></span>';
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  const t = el.querySelector('.pa-t'); let i = 0;
  const glitch = tier === 2 ? '▒░█' : '';
  clearInterval(HAUNT.paTimer);
  setTimeout(() => {
    if (typeof sndMurmur === 'function' && M.pos) sndMurmur({ x: M.pos.x * CM, z: M.pos.z * CM, v: { hM: 1.7 }, room: M.room && M.room.id }, Math.min(5, 1 + line.length * 0.07), false);
    HAUNT.paTimer = setInterval(() => {
      i++;
      let s = line.slice(0, i);
      if (glitch && Math.random() < 0.12) s = s.slice(0, -1) + glitch[Math.floor(Math.random() * glitch.length)];
      t.textContent = s;
      if (i >= line.length) { clearInterval(HAUNT.paTimer); t.textContent = line; }
    }, 55);
  }, 1500);
  clearTimeout(HAUNT.paHide);
  HAUNT.paHide = setTimeout(() => el.classList.remove('on'), 2600 + line.length * 55 + 3200);
  // 관람객들이 걸음을 멈추고 천장을 올려다본다
  for (const n of M.npcs || []) {
    if (n.out || Math.hypot(n.x - M.pos.x * CM, n.z - M.pos.z * CM) > 3500) continue;      // 방송은 관 전체에 들린다
    n.listenT = 3.5 + Math.random() * 1.5;
    if (n.state === 'walk') { n.pause = n.listenT; n.pauseYaw = n.yaw; }
  }
}

/* ── 기울어진 액자 ─────────────────────────────────────── */
const TILT_KINDS = { portrait: 1, photo: 1, placard: 1, scorecard: 1, champion: 1 };
function hauntTilt() {
  const PX = M.pos.x * CM, PZ = M.pos.z * CM;
  const cand = M.exhibits.filter((e) => {
    if (!e.node || !TILT_KINDS[e.type] || e.tilted) return false;
    const r = M.roomById[e.room]; if (!r || r.outdoor || (M.roomGroups[e.room] || {}).visible === false || Math.abs(r.y0 - (M.feet || 0)) > 150) return false;   // 같은 층만
    const d = Math.hypot(e.x - PX, e.z - PZ);
    return d > 300 && d < 2400 && !hauntView(e.x / CM, (r.y0 + e.y) / CM, e.z / CM).on;
  });
  if (!cand.length) return false;
  const e = pickOf(cand);
  e.tilted = true;
  e.node.rotation.z = (Math.random() < 0.5 ? -1 : 1) * (0.09 + Math.random() * 0.1);
  HAUNT.tilts.push({ e, seen: 0, t: 0 });
  return true;
}
function stepTilts(dt) {
  for (const T of HAUNT.tilts) {
    T.t += dt;
    const e = T.e, r = M.roomById[e.room];
    const d = Math.hypot(e.x - M.pos.x * CM, e.z - M.pos.z * CM);
    const on = hauntView(e.x / CM, (r.y0 + e.y) / CM, e.z / CM).on;
    if (on && d < 900) T.seen += dt;
    // 한 번 제대로 보고(1.5초) 눈을 돌리면 — 또는 너무 오래 그대로면 — 누가 바로 걸어 놓는다
    if ((T.seen > 1.5 && !on) || (T.t > 240 && !on)) { e.node.rotation.z = 0; e.tilted = false; T.done = true; }
  }
  HAUNT.tilts = HAUNT.tilts.filter((T) => !T.done);
}

/* ── 새 초상 ──────────────────────────────────────────── */
/* v125 — 사용자: "초상화 없는 거 … 그냥 사람 실루엣으로 하니까 느낌이 팍 식네".
   이름 없는 초상(이젤) · 수장고의 초상들은 검은 윤곽뿐이었다 → 사람 얼굴을 따로 그려(오프스크린 렌더) 유화로 칠한다.
     · 이름 없는 초상 — '그 사람'(p12). 처음엔 눈을 감고 있다가, 한 번 들여다보고 나면 눈을 뜨고 있다
     · 수장고 북쪽 벽 스물네 점 — 같은 얼굴(그 사람, 눈을 뜬)
     · 수장고 '오늘의 관람객' — 오늘 말을 건 관람객의 얼굴(내려갈 때 다시 그린다)
   사람 모델이 아직 없으면 예전 윤곽 그림으로 */
const FACE_CACHE = {};
function faceRender(name, eyes, mood) {
  const key = name + '|' + (eyes ? 1 : 0) + '|' + (mood || '');
  if (FACE_CACHE[key]) return FACE_CACHE[key];
  if (typeof PEOPLE === 'undefined' || !PEOPLE.ok || !PEOPLE.byName || !PEOPLE.byName[name] || !M.renderer || typeof buildRealVisitor !== 'function') return null;
  const W = 480, H = 600, R = M.renderer;
  const v = buildRealVisitor({ coat: '#111', pants: '#111', h: 1.7 }, name);
  v.walk.setEffectiveWeight(0); v.idle.setEffectiveWeight(1); v.idle.time = 1.3; v.mixer.update(0);
  const mi = v.mesh.morphTargetInfluences, mo = v.morph;
  if (mi && mo) { if (mo.blink != null) mi[mo.blink] = eyes ? 0 : 1; if (mo.smile != null) mi[mo.smile] = mood === 'smile' ? 0.55 : 0; if (mo.talk != null) mi[mo.talk] = mood === 'open' ? 0.35 : 0; }
  const sc = new THREE.Scene(); sc.add(v.root); v.root.updateMatrixWorld(true);
  const B = typeof npcBones === 'function' ? npcBones(v) : {}, hp = B.head ? B.head.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(0, 1.55, 0);
  const key1 = new THREE.DirectionalLight(0xFFE0B8, 2.6); key1.position.set(-0.9, hp.y + 0.7, 1.1); sc.add(key1);
  const rim = new THREE.DirectionalLight(0x9AB0C8, 1.1); rim.position.set(1.0, hp.y + 0.4, -1.0); sc.add(rim);
  sc.add(new THREE.HemisphereLight(0x8C8070, 0x1A120C, 0.45));
  const cam = new THREE.PerspectiveCamera(17, W / H, 0.05, 10);
  cam.position.set(hp.x + 0.04, hp.y + 0.12, hp.z + 1.6); cam.lookAt(hp.x, hp.y + 0.0, hp.z);
  const rt = new THREE.WebGLRenderTarget(W, H); rt.texture.colorSpace = THREE.SRGBColorSpace;
  const prevT = R.getRenderTarget(), prevC = R.getClearColor(new THREE.Color()), prevA = R.getClearAlpha();
  const buf = new Uint8Array(W * H * 4);
  try {
    R.setRenderTarget(rt); R.setClearColor(0x1A140F, 1); R.clear(); R.render(sc, cam);
    R.readRenderTargetPixels(rt, 0, 0, W, H, buf);
  } finally { R.setRenderTarget(prevT); R.setClearColor(prevC, prevA); rt.dispose(); sc.remove(v.root); }
  // 캔버스로 — 위아래를 뒤집어 옮기고 유화로 칠한다
  const cv = makeCanvas(W, H), c = cv.getContext('2d'), im = c.createImageData(W, H);
  for (let y = 0; y < H; y++) im.data.set(buf.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4);
  // 색 — 바랜 바니시(따뜻하게 · 채도를 낮추고 · 대비를 조금)
  for (let i = 0; i < im.data.length; i += 4) {
    const r0 = im.data[i], g0 = im.data[i + 1], b0 = im.data[i + 2], l = 0.3 * r0 + 0.59 * g0 + 0.11 * b0;
    const k = (x) => clamp((x - 128) * 1.12 + 128, 0, 255);
    im.data[i] = k(l + (r0 - l) * 0.55 + 14); im.data[i + 1] = k(l + (g0 - l) * 0.55 + 4); im.data[i + 2] = k(l + (b0 - l) * 0.55 - 12);
  }
  c.putImageData(im, 0, 0);
  // 붓결 — 밑색을 집어 짧은 획을 겹친다
  const src = c.getImageData(0, 0, W, H).data, Rn = rnd(name.length * 31 + (eyes ? 7 : 3));
  for (let i = 0; i < 4200; i++) {
    const x = Rn() * W, y = Rn() * H, p = ((y | 0) * W + (x | 0)) * 4;
    c.save(); c.translate(x, y); c.rotate(Rn() * Math.PI); c.globalAlpha = 0.28;
    c.fillStyle = 'rgb(' + src[p] + ',' + src[p + 1] + ',' + src[p + 2] + ')'; c.fillRect(-4 - Rn() * 6, -1.2, 8 + Rn() * 12, 2.4 + Rn() * 1.5); c.restore();
  }
  c.globalAlpha = 1;
  // 아직 얼굴이 없다(이름 없는 초상의 처음) — 얼굴 자리를 문질러 뭉갠다
  if (!eyes) { const tmp = makeCanvas(W, H), tc = tmp.getContext('2d'); tc.filter = 'blur(16px)'; tc.drawImage(cv, 0, 0);
    c.save(); c.beginPath(); c.ellipse(W / 2, H * 0.3, 92, 118, 0, 0, Math.PI * 2); c.clip(); c.drawImage(tmp, 0, 0);
    c.fillStyle = 'rgba(40,30,22,.35)'; c.fillRect(0, 0, W, H); c.restore(); }
  // 가장자리 어둠 · 갈라짐
  const vg = c.createRadialGradient(W / 2, H * 0.42, H * 0.22, W / 2, H * 0.5, H * 0.72); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(8,5,3,.82)');
  c.fillStyle = vg; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(20,12,6,.22)'; c.lineWidth = 0.8;
  for (let i = 0; i < 70; i++) { let x = Rn() * W, y = Rn() * H; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 7; j++) { x += (Rn() - 0.5) * 40; y += (Rn() - 0.5) * 40; c.lineTo(x, y); } c.stroke(); }
  return (FACE_CACHE[key] = cv);
}
/** 초상 그림 — who 의 얼굴(없으면 예전 윤곽). 받은 쪽이 위에 덧그리므로 늘 새 캔버스로 돌려준다 */
function portraitCanvas(eyes, who, mood) {
  let face = null;
  try { face = faceRender(who || 'p12', eyes, mood); } catch (e) { face = null; }
  if (face) { const cv = makeCanvas(face.width, face.height); cv.getContext('2d').drawImage(face, 0, 0); return cv; }
  return portraitSil(eyes);
}
function portraitSil(eyes) {
  const W = 480, H = 600, cv = makeCanvas(W, H), c = cv.getContext('2d');
  const g = c.createRadialGradient(W / 2, H * 0.4, 20, W / 2, H * 0.45, H * 0.75);
  g.addColorStop(0, '#3A3129'); g.addColorStop(0.6, '#1C1713'); g.addColorStop(1, '#0B0907');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // 붓결
  for (let i = 0; i < 900; i++) { c.fillStyle = 'rgba(' + (60 + Math.random() * 40 | 0) + ',' + (48 + Math.random() * 30 | 0) + ',36,' + (Math.random() * 0.05) + ')'; c.fillRect(Math.random() * W, Math.random() * H, 2 + Math.random() * 30, 1 + Math.random() * 3); }
  // 사람 — 윤곽만(어깨 · 목 · 머리)
  c.fillStyle = '#080706';
  c.beginPath(); c.ellipse(W / 2, H * 0.36, 78, 98, 0, 0, Math.PI * 2); c.fill();
  c.fillRect(W / 2 - 34, H * 0.46, 68, 60);
  c.beginPath(); c.moveTo(W * 0.1, H); c.bezierCurveTo(W * 0.14, H * 0.62, W * 0.34, H * 0.56, W / 2, H * 0.56);
  c.bezierCurveTo(W * 0.66, H * 0.56, W * 0.86, H * 0.62, W * 0.9, H); c.closePath(); c.fill();
  // 윤곽에 얇게 비친 빛
  c.strokeStyle = 'rgba(160,140,110,.18)'; c.lineWidth = 3;
  c.beginPath(); c.ellipse(W / 2, H * 0.36, 79, 99, 0, Math.PI * 1.1, Math.PI * 1.75); c.stroke();
  if (eyes) {
    for (const s of [-1, 1]) {
      const eg = c.createRadialGradient(W / 2 + s * 30, H * 0.35, 0, W / 2 + s * 30, H * 0.35, 9);
      eg.addColorStop(0, 'rgba(235,228,214,.95)'); eg.addColorStop(1, 'rgba(235,228,214,0)');
      c.fillStyle = eg; c.fillRect(W / 2 + s * 30 - 10, H * 0.35 - 10, 20, 20);
    }
  }
  return cv;
}
function hauntPortrait() {
  const r = M.roomById.hall, g = M.roomGroups.hall;
  if (!r || !g || HAUNT.portrait) return false;
  if (M.room && M.room.id === 'hall') return false;                       // 안 보는 사이에
  // 자리 — 방 가운데 둘레, 벽 · 사람 · 전시물에서 떨어진 곳. 문 쪽을 본다
  const G = typeof crowdGraph === 'function' ? crowdGraph() : null, door = G && (G.get('hall') || [])[0];
  let spot = null;
  for (let k = 0; k < 30 && !spot; k++) {
    const x = r.cx + (Math.random() - 0.5) * r.w * 0.45, z = r.cz + (Math.random() - 0.5) * r.d * 0.45;
    if (hitsWall(x, z, r.y0) || M.exhibits.some((e) => e.room === 'hall' && Math.hypot(e.x - x, e.z - z) < 200)) continue;
    if ((M.npcs || []).some((n) => n.room === 'hall' && Math.hypot(n.x - x, n.z - z) < 150)) continue;
    spot = { x, z };
  }
  if (!spot) return false;
  const yaw = door ? Math.atan2(door.p.x - spot.x, door.p.z - spot.z) : 0;
  const wood = new THREE.MeshStandardMaterial({ color: 0x2A1D14, roughness: 0.7 });
  const cv = portraitCanvas(false), tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const paint = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 });
  [wood, paint].forEach((m) => { m.userData.noBatch = true; m.envMap = M.envIn; m.envMapIntensity = 0.3; });
  const E = new THREE.Group();
  E.position.set(spot.x / CM, 0, spot.z / CM); E.rotation.y = yaw;
  const leg = (x, z, rx, rz) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.75, 0.04), wood); m.position.set(x, 0.86, z); m.rotation.set(rx, 0, rz); E.add(m); };
  leg(-0.3, 0.05, -0.06, 0.12); leg(0.3, 0.05, -0.06, -0.12); leg(0, -0.28, 0.3, 0);
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.04, 0.12), wood); shelf.position.set(0, 0.9, 0.1); E.add(shelf);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.86, 0.05), wood); frame.position.set(0, 1.35, 0.08); frame.rotation.x = -0.1; E.add(frame);
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.75), paint); pic.position.set(0, 1.352, 0.108); pic.rotation.x = -0.1; E.add(pic);
  E.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } });
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.5), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(0, 0.9, 0); E.add(hit);
  g.add(E);
  const info = { id: 'haunt-portrait', type: 'portrait', icon: '🖼', label: '이름 없는 초상', title: '이름 없는 초상', subtitle: '명예의 전당 · 오늘 걸림',
    img: cv.toDataURL('image/jpeg', 0.85), x: spot.x, z: spot.z, y: 135, room: 'hall',
    body: '누가 걸었는지 기록이 없다. 물감이 아직 마르지 않았다.' + String.fromCharCode(10) + String.fromCharCode(10) + '명패에는 이름 대신 오늘 날짜가 적혀 있다.' };
  M.pickables.push(hit); M.artByMesh.set(hit, info);
  HAUNT.portrait = { E, tex, cv, info, eyes: false };
  HAUNT.portraitNew = true;
  HAUNT.paT = Math.min(HAUNT.paT, 6);                                     // 곧 방송이 알린다
  return true;
}
/** 전시물 설명을 열 때(openExhibit) — 가끔 관리자 메모가 붙는다 · 새 초상은 눈이 생긴다 */
function hauntNote(e) {
  if (!NIGHT.on) return;
  if (typeof VAULT !== 'undefined' && e === VAULT.special && !HAUNT.calm && !HAUNT.vaultLocked) {
    HAUNT.vaultLocked = true; HAUNT.vaultLock = 10; if (typeof hauntRec === 'function') hauntRec('today'); 
    setTimeout(() => { if (typeof sndBlack === 'function') sndBlack(false); hauntSay('… 거기 걸려야지.'); HAUNT.follow = 10; HAUNT.followYaw = M.yaw; }, 900);
    return;
  }
  const P = HAUNT.portrait;
  if (P && e === P.info) {
    if (P.eyes) return;
    P.eyes = true; if (typeof hauntRec === 'function') hauntRec('portrait'); 
    P.tex.image = portraitCanvas(true); P.tex.needsUpdate = true;        // 닫고 나면 — 눈이 있다
    P.info.body += String.fromCharCode(10) + String.fromCharCode(10) + '… 방금 전까지 얼굴이 없었던 것 같다.';
    return;
  }
  const dr = HAUNT.dread;
  if (dr < 0.1 || !e.no || Math.random() > 0.12 + dr * 0.4) return;
  const list = HAUNT_NOTES[e.type === 'relic' ? 'trophy' : e.type] || HAUNT_NOTES.any;
  const box = document.getElementById('ovBody'); if (!box) return;
  const p = document.createElement('p'); p.className = 'haunt-note';
  p.textContent = '※ 관리자 메모 — ' + pickOf(Math.random() < 0.3 ? HAUNT_NOTES.any : list);
  box.appendChild(p);
}
/** stepHaunt 앞에서 — 방송 · 액자 · 초상 */
function stepHaunt4(dt) {
  stepTilts(dt);
  if (!hauntOK()) return;
  const k = 1.2 - 0.6 * HAUNT.dread;
  HAUNT.paT -= dt;
  if (HAUNT.paT <= 0 && !HAUNT.finale) { HAUNT.paT = (150 + Math.random() * 90) * k; hauntPA(); }
  HAUNT.tiltT -= dt;
  if (HAUNT.tiltT <= 0) HAUNT.tiltT = hauntTilt() ? (60 + Math.random() * 60) * k : 8;
  if (!HAUNT.portrait && HAUNT.dread >= 0.45) { HAUNT.portraitTry = (HAUNT.portraitTry || 0) - dt; if (HAUNT.portraitTry <= 0) { HAUNT.portraitTry = 10; hauntPortrait(); } }
}

/* ══════════════════════════════════════════════════════════
   마지막 방송 · 결말 — 호러 5단계 (v103)
   ══════════════════════════════════════════════════════════
   밤이 끝까지 깊어지면(머문 지 15분) 마지막 방송이 나온다 — "모든 관람객께서는 명예의 전당, 새 초상 앞으로 모여 주십시오."
     · 관람객들이 하던 것을 멈추고 줄지어 명예의 전당으로 걸어가 초상을 둘러싸고 선다(2층 사람은 안 보는 사이 와 있다)
     · 바깥 사람들은 그 자리에 멈춰 건물을 바라본다 · 정전이 잦아진다
     · 정문으로 나가려 하면 — 화면이 튀고, 현관 안에 서 있다. "정문은 들어오는 문입니다"
     · 명예의 전당, 초상 앞에 서면 — 모두가 나를 돌아본다 → 긴 정전 → 번쩍이는 사이 바로 앞에 그 사람 → "… 찾았다." → 하얗게
     · 결말 카드 — 방명록 마지막 줄에 오늘의 관람객. [처음부터 다시] 또는 [조용히 둘러보기](이상 현상이 멎은 밤)
   시험: 주소에 ?haunt=late 를 붙이면 밤이 거의 끝난 데서 시작한다 */
try { if (/[?&]haunt=late/.test(location.search)) HAUNT.t = 870; } catch (e) { /* 없어도 된다 */ }
const FIN_END_KEY = 'museum-night-end';

function finaleStart() {
  if (!HAUNT.portrait) hauntPortrait();
  const P = HAUNT.portrait; if (!P) return false;
  HAUNT.finale = { phase: 'call', t: 0, loops: 0, remind: 0 };
  hauntPA('관람 시간이 끝났습니다. 모든 관람객께서는 명예의 전당, 새 초상 앞으로 모여 주십시오.', 2);
  NIGHT.blackT = Math.min(NIGHT.blackT, 25);
  const hall = M.roomById.hall, px = P.info.x, pz = P.info.z, face = P.E.rotation.y;
  const inside = (M.npcs || []).filter((n) => !n.out);
  inside.forEach((n, i) => {
    if (n.talk) crowdTalkEnd(n.talk);
    if (n.mono && n.mono.el) n.mono.el.remove(); n.mono = null;
    // 초상 둘레 — 앞쪽 60° 는 비워 둔다(내가 들어설 자리)
    let spot = null;
    for (let k = 0; k < 8 && !spot; k++) {
      const a = face + Math.PI / 6 + ((i + k * 0.37) / Math.max(1, inside.length)) * Math.PI * 5 / 3, R = 210 - k * 12;
      const x = px + Math.sin(a) * R, z = pz + Math.cos(a) * R;
      if (inRect(hall, x, z) && !hitsWall(x, z, hall.y0)) spot = { x, z };
    }
    if (!spot) spot = crowdSpot('hall', n);
    n.finale = spot;
    n.cool = n.noticeCool = n.monoCool = 1e9; n.pause = 0; n.speed = Math.min(n.speed, (n.v.natural || 1) * 0.85);
    const route = n.room === 'hall' ? [] : crowdRoute(n.room, 'hall');
    if (!route) { n.finaleWarp = true; n.state = 'look'; n.wait = 1e9; return; }
    n.path = [];
    for (const e of route) n.path.push({ x: e.from.x, z: e.from.z }, { x: e.p.x, z: e.p.z, enter: e.to }, { x: e.into.x, z: e.into.z });
    n.path.push({ x: spot.x, z: spot.z });
    n.goal = { x: spot.x, z: spot.z, lx: px, lz: pz }; n.state = 'walk'; n.wait = 1e9;
  });
  for (const n of M.npcs || []) if (n.out) { n.finale = true; if (n.mono && n.mono.el) n.mono.el.remove(); n.mono = null; }
  return true;
}
function finaleCard() {
  const stamp = nightStamp();
  nightLogPush('end', stamp); if (typeof hauntRec === 'function') hauntRec('end'); 
  const k = HAUNT.log.length;
  const gb = M.exhibits.find((e) => e.type === 'guestbook');
  if (gb) { gb.entries = (gb.entries || []).slice(); gb.entries.push({ name: '오늘의 관람객', body: '(퇴장 기록 없음)', color: '#8E4A40', created_at: stamp }); }
  const el = document.createElement('div'); el.id = 'hauntCard'; el.className = 'haunt-card';
  el.innerHTML = '<p class="hc-k">관람 종료</p><h2>관람해 주셔서 감사합니다</h2>'
    + (k > 1 ? '<p>초상이 한 점 더 늘었습니다.<br>명예의 전당에는 이제 ' + k + '점이 걸려 있습니다. 모두 같은 얼굴입니다.</p>'
      : '<p>오늘 명예의 전당에 초상 한 점이 새로 걸렸습니다.<br>얼굴은 아직 마르지 않았습니다.</p>')
    + '<p class="hc-gb">방명록 마지막 줄 — ' + stamp.slice(0, 16) + ' · 오늘의 관람객 · <em>퇴장 기록 없음</em></p>'
    + (k > 1 ? '<p class="hc-n">' + k + '번째 밤이었습니다.</p>' : '')
    + '<div class="hc-b"><button type="button" data-a="again">처음부터 다시</button><button type="button" data-a="calm">조용히 둘러보기</button></div>';
  document.getElementById('gal').appendChild(el);
  el.addEventListener('click', (ev) => {
    const a = ev.target && ev.target.getAttribute && ev.target.getAttribute('data-a');
    if (a === 'again') location.reload();
    else if (a === 'calm') finaleCalm();
  });
}
/** 조용히 둘러보기 — 이상 현상이 멎은 밤. 관람객은 다시 제 갈 길 */
function finaleCalm() {
  HAUNT.calm = true;
  if (HAUNT.finale) HAUNT.finale.phase = 'done';
  const c = document.getElementById('hauntCard'); if (c) c.remove();
  const w = document.getElementById('hauntEnd'); if (w) { w.classList.add('out'); setTimeout(() => w.remove(), 2600); }
  M.openId = null;
  for (const id in NIGHT.fx) NIGHT.fx[id].unstable = false;
  NIGHT.blackT = Infinity; NIGHT.black = null;
  shadeHide(); HAUNT.follow = 0; HAUNT.ev = null;
  for (const n of M.npcs || []) {
    n.finale = null; n.finaleWarp = false;
    if (n.out) continue;
    n.state = 'look'; n.wait = 2 + Math.random() * 6; n.cool = 15 + Math.random() * 20; n.noticeCool = 40; n.monoCool = 60;
    n.goal = { lx: n.x + Math.sin(n.yaw) * 100, lz: n.z + Math.cos(n.yaw) * 100 };
  }
  setTimeout(() => hauntPA('관람해 주셔서 감사합니다. 천천히 둘러보십시오. … 천천히.', 0), 3000);
}
function stepFinale(dt) {
  if (typeof ESC !== 'undefined' && ESC.on) return;                         // v114 — 방탈출 중엔 결말 대신 시간 제한
  const F = HAUNT.finale;
  if (!F) {
    if (!HAUNT.calm && HAUNT.dread >= 1 && hauntOK() && !HAUNT.ev) finaleStart();
    return;
  }
  F.t += dt;
  const P = HAUNT.portrait;
  if (F.phase === 'call') {
    // 2층 사람들 — 안 보는 사이 명예의 전당에 와 있다
    for (const n of M.npcs || []) {
      // 길이 막혀 45초 넘게 못 온 사람도 — 안 보는 사이에
      if (!n.out && n.finale && !n.finaleWarp && F.t > 45 && Math.hypot(n.x - n.finale.x, n.z - n.finale.z) > 120) n.finaleWarp = true;
      if (!n.finaleWarp) continue;
      const r = M.roomById[n.room];
      if (hauntView(n.x / CM, r.y0 / CM + 1.4, n.z / CM).on && (M.roomGroups[n.room] || {}).visible !== false) continue;
      if (M.room && M.room.id === 'hall' && hauntView(n.finale.x / CM, 1.4, n.finale.z / CM).on) continue;
      crowdEnter(n, 'hall'); n.x = n.finale.x; n.z = n.finale.z; n.finaleWarp = false;
      n.state = 'look'; n.goal = { lx: P.info.x, lz: P.info.z }; n.path = [];
    }
    // 정문으로 나가려 하면 — 현관 안
    const pl = M.roomById.plaza;
    if (M.room && pl && M.room.id === 'plaza' && M.pos.z * CM > pl.z1 - 450) {
      if (HAUNT.nights >= 1 && F.loops >= 2) { finaleEscape(); return; }       // v104 — 세 번째엔 열린다
      hauntGlitch();
      const S = M.startPos;
      teleport(S.room);
      M.feet = floorAt(S.room, S.x, S.z); M.eyeFeet = M.feet;
      M.pos.set(S.x / CM, (M.feet + EYE) / CM, S.z / CM); M.yaw = 0;
      F.loops++; if (typeof hauntRec === 'function') hauntRec('loop'); 
      hauntPA(F.loops > 1 ? (HAUNT.nights >= 1 ? '정문은 들어오는 문입니다. … 세 번째에는 모르겠습니다.' : '정문은 들어오는 문입니다. 몇 번을 나가셔도 그렇습니다.')
        : '정문은 들어오는 문입니다. 명예의 전당으로 가 주십시오.', 2);
    }
    // 오래 안 오면 — 다시 부른다(두 번까지)
    F.remind -= dt;
    if (F.t > 50 && F.remind <= 0 && !(M.room && M.room.id === 'hall')) { F.remind = 60; hauntPA('명예의 전당에서 모두 기다리고 있습니다.', 2); }
    // 초상 앞에 서면
    if (M.room && M.room.id === 'hall' && Math.hypot(P.info.x - M.pos.x * CM, P.info.z - M.pos.z * CM) < 380 && hauntOK()) {
      F.phase = 'end'; F.t = 0;
      NIGHT.black = null; NIGHT.blackT = Infinity;
      for (const n of M.npcs || []) if (!n.out && n.room === 'hall') { n.state = 'look'; n.goal = { lx: M.pos.x * CM, lz: M.pos.z * CM }; n.path = []; }
      sndSwell();
    }
    return;
  }
  if (F.phase === 'end') {
    const PX = M.pos.x * CM, PZ = M.pos.z * CM;
    for (const n of M.npcs || []) if (!n.out && n.room === 'hall') n.goal = { lx: PX, lz: PZ };      // 모두 나를 본다
    if (F.t > 1.6 && !F.dark) {
      F.dark = true;
      HAUNT.blackShade = true;
      NIGHT.black = { room: 'hall', t: 0, dur: 3.4, k: 1, on: false };
      if (typeof sndBlack === 'function') sndBlack(false);
    }
    if (F.t > 2.8 && !F.said) {
      F.said = true;
      hauntSay('… 찾았다.');
      if (typeof hapt === 'function') hapt([60, 80, 220]);
      if (typeof sndMurmur === 'function') { const f = hauntFwd(); sndMurmur({ x: PX + f.x * 120, z: PZ + f.z * 120, v: { hM: 1.9 }, room: 'hall' }, 1.1, true); }
    }
    if (F.t > 5.6 && !F.white) {
      F.white = true;
      const w = document.createElement('div'); w.id = 'hauntEnd'; w.className = 'haunt-end'; document.getElementById('gal').appendChild(w);
      requestAnimationFrame(() => w.classList.add('on'));
      sndChime(0);
      if (M.locked) document.exitPointerLock();
    }
    if (F.t > 8.4) {
      F.phase = 'done';
      M.openId = 'haunt-end';                                             // 카드가 떠 있는 동안 걷지 않는다
      shadeHide();
      finaleCard();
    }
  }
}

/* ══════════════════════════════════════════════════════════
   두 번째 밤 — 호러 6단계 (v104)
   ══════════════════════════════════════════════════════════
   결말을 한 번 본 기기(이 브라우저)에서 다시 들어오면, 전시관이 나를 기억한다.
     · 들어서자마자 방송 — "다시 오셨군요. 기다리고 있었습니다."(지난번에 나갔다면 다른 말)
     · 지난밤의 초상이 처음부터 명예의 전당에 있다(눈도 있다) · 방명록에 지난밤들의 줄이 남아 있다
     · 밤이 더 깊은 데서 시작한다(밤마다 2.5분씩, 최대 10분) · 관람객이 알아본다("또 오셨네요.")
     · 새 현상 '나란히 걷는 사람' — 멀리서 나와 똑같이 걷고 멈춘다(미끄러지듯). 다가가면 없다
     · 새 결말 '퇴장' — 두 번째 밤부터, 마지막 방송 뒤 정문으로 세 번 나가 보면 …세 번째엔 열린다
   ?haunt=reset 은 이 기기의 밤 기록을 지운다 */
const NIGHT_LOG_KEY = 'museum-night-log';
HAUNT.log = [];
try {
  if (/[?&]haunt=reset/.test(location.search)) { localStorage.removeItem(NIGHT_LOG_KEY); localStorage.removeItem(FIN_END_KEY); }
  HAUNT.log = JSON.parse(localStorage.getItem(NIGHT_LOG_KEY) || '[]') || [];
} catch (e) { HAUNT.log = []; }
HAUNT.nights = HAUNT.log.length;
HAUNT.escaped = HAUNT.log.some((x) => x.how === 'escape');
if (HAUNT.nights > 0) {
  HAUNT.t = Math.max(HAUNT.t, 150 * Math.min(HAUNT.nights, 4));
  HAUNT.paT = 9; HAUNT.welcome = true;
  NEAR_IN.push(['또 오셨네요.'], ['지난번에도 여기 서 계셨죠.', '… 같은 자리에.'], ['그 초상, 그쪽 닮았던데요.'], ['이번엔 끝까지 계실 거죠?']);
  ASK.push(['초상 보셨어요?', '잘 걸려 있어요. 그쪽 거.'], ['또 물어보시네요.', '지난번에도 그렇게 물었어요.'], ['나가는 길이요?', '… 지난번엔 찾으셨잖아요.']);
  MONO.push(['또 왔어.', '또 왔어.', '… 반가워.'], ['초상이 하나 늘었어.', '이번엔 누구 차례야.']);
  MONO_OUT.kid.push(['아저씨 또 왔다!'], ['지난번에 숨바꼭질 안 끝났어.']);
}
function nightLogPush(how, stamp) {
  HAUNT.log.push({ d: stamp, how });
  try { localStorage.setItem(NIGHT_LOG_KEY, JSON.stringify(HAUNT.log.slice(-12))); } catch (e) { /* 기억 못 해도 된다 */ }
}
function nightStamp() {
  const d = new Date(), p2 = (v) => String(v).padStart(2, '0');
  return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':00';
}
/** 두 번째 밤의 첫 준비 — 지난밤 초상 · 방명록(입장 뒤 한 번) */
function secondNightInit() {
  if (HAUNT.nights < 1 || HAUNT.snInit || !hauntOK()) return;
  HAUNT.snInit = true;
  const gb = M.exhibits.find((e) => e.type === 'guestbook');
  if (gb) {
    gb.entries = (gb.entries || []).slice();
    for (const L of HAUNT.log.slice(-6)) gb.entries.push({ name: '오늘의 관람객', body: L.how === 'escape' ? '(퇴장)' : '(퇴장 기록 없음)', color: '#8E4A40', created_at: L.d });
  }
  if (typeof vaultDoorShow === 'function') vaultDoorShow(true);            // v108 — 수장고 문도 처음부터
  if (typeof hauntRec === 'function') hauntRec('second');
  if (!HAUNT.portrait && hauntPortrait()) {
    const P = HAUNT.portrait, last = HAUNT.log[HAUNT.log.length - 1];
    P.eyes = true; P.tex.image = portraitCanvas(true); P.tex.needsUpdate = true;
    P.info.subtitle = '명예의 전당 · 지난밤 걸림';
    P.info.title = HAUNT.nights > 1 ? '이름 없는 초상 (' + HAUNT.nights + '점째)' : '이름 없는 초상';
    P.info.body = '지난밤(' + String(last.d).slice(0, 10) + ') 걸린 초상. 누구의 얼굴인지 아무도 말하지 않는다.'
      + String.fromCharCode(10) + String.fromCharCode(10) + '눈이 문 쪽을 보고 있다. 들어오는 사람을.';
    HAUNT.portraitNew = false;
    HAUNT.paT = Math.max(HAUNT.paT, 9);
  }
}
/* 나란히 걷는 사람 — 12~20m 옆에서 내가 걸으면 걷고(같은 쪽으로, 미끄러지듯) 멈추면 멈춘다 */
HAUNT_EV.mimic = function () {
  if (HAUNT.nights < 1 || HAUNT.blackShade) return false;
  const here = M.room;
  if (!here || (!here.outdoor && (here.w < 1400 || here.d < 1400))) return false;      // 실내는 넓은 방에서만
  const f = hauntFwd(), PX = M.pos.x * CM, PZ = M.pos.z * CM;
  for (let k = 0; k < 16; k++) {
    // 시선에서 20~35° 옆, 13~21m — 곁눈에 들어오는 자리
    const a = (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.25), D = 1300 + Math.random() * 800;
    const fw = Math.cos(a) * D, sd = Math.sin(a) * D;
    const x = PX + f.x * fw - f.z * sd, z = PZ + f.z * fw + f.x * sd;
    const r = here.outdoor ? M.rooms.find((q) => q.outdoor && !q.part && q.lv === 0 && inRect(q, x, z)) : (inRect(here, x, z) ? here : null);
    if (!r || (r.terrain && lakeDist(x, z) < 1.12)) continue;
    const fy = floorAt(r, x, z);
    if (!(fy === fy) || hitsWall(x, z, fy) || !hauntView(x / CM, fy / CM + 1.4, z / CM).on) continue;
    if (!shadeAt(x, z, r)) return false;
    HAUNT.shade.root.rotation.y = M.yaw + Math.PI;
    sndSwell();
    HAUNT.ev = mimicWatch({ x, z, room: r, lx: PX, lz: PZ });
    return true;
  }
  return false;
};
function mimicWatch(o) {
  return {
    t: 0, look: 0, done: false,
    step(dt) {
      this.t += dt;
      const PX = M.pos.x * CM, PZ = M.pos.z * CM, dx = PX - o.lx, dz = PZ - o.lz;
      o.lx = PX; o.lz = PZ;
      const nx = o.x + dx, nz = o.z + dz, fy = floorAt(o.room, nx, nz);
      let ok = inRect(o.room, nx, nz) && fy === fy && !hitsWall(nx, nz, fy);
      if (ok) { o.x = nx; o.z = nz; HAUNT.shade.root.position.set(nx / CM, fy / CM, nz / CM); }
      HAUNT.shade.root.rotation.y = M.yaw + Math.PI;                         // 내가 보는 쪽을 같이 본다
      const d = Math.hypot(o.x - PX, o.z - PZ);
      const V = hauntView(o.x / CM, (floorAt(o.room, o.x, o.z) || o.room.y0) / CM + 1.5, o.z / CM);
      if (V.on) { if (typeof hauntRec === 'function') hauntRec('mimic'); }
      if (V.on && Math.abs(V.x) < 0.25) this.look += dt;
      if (!ok || d < 800 || this.look > 3 || this.t > 20 || !hauntOK()) {
        if (V.on) hauntGlitch();
        shadeHide(); this.done = true;
      }
    },
  };
}
/** 퇴장 결말 — 두 번째 밤부터, 세 번째로 정문을 나가면 */
function finaleEscape() {
  const F = HAUNT.finale; F.phase = 'done';
  const stamp = nightStamp();
  nightLogPush('escape', stamp); if (typeof hauntRec === 'function') hauntRec('escape'); 
  const w = document.createElement('div'); w.id = 'hauntEnd'; w.className = 'haunt-end'; document.getElementById('gal').appendChild(w);
  requestAnimationFrame(() => w.classList.add('on'));
  if (M.locked) document.exitPointerLock();
  M.openId = 'haunt-end';
  sndChime(0);
  const gb = M.exhibits.find((e) => e.type === 'guestbook');
  if (gb) { gb.entries = (gb.entries || []).slice(); gb.entries.push({ name: '오늘의 관람객', body: '(퇴장)', color: '#8E4A40', created_at: stamp }); }
  setTimeout(() => {
    const el = document.createElement('div'); el.id = 'hauntCard'; el.className = 'haunt-card';
    el.innerHTML = '<p class="hc-k">퇴장</p><h2>관람객 한 분이 퇴장하셨습니다</h2>'
      + '<p>본관이 문을 연 뒤 처음 있는 일입니다.<br>명예의 전당에 걸 자리가 하나 비었습니다.</p>'
      + '<p class="hc-gb">방명록 마지막 줄 — ' + stamp.slice(0, 16) + ' · 오늘의 관람객 · <em>퇴장</em></p>'
      + '<p class="hc-n">… 다음에 또 오실 거죠.</p>'
      + '<div class="hc-b"><button type="button" data-a="again">처음부터 다시</button><button type="button" data-a="calm">조용히 둘러보기</button></div>';
    document.getElementById('gal').appendChild(el);
    el.addEventListener('click', (ev) => {
      const a = ev.target && ev.target.getAttribute && ev.target.getAttribute('data-a');
      if (a === 'again') location.reload(); else if (a === 'calm') finaleCalm();
    });
  }, 2900);
}

/* ══════════════════════════════════════════════════════════
   지하 수장고 — 호러 10단계 (v108)
   ══════════════════════════════════════════════════════════
   밤이 절반을 넘기면(두 번째 밤부터는 처음부터) 명예의 전당 서쪽 벽에 없던 문이 생긴다 — "관계자 외 출입금지".
     · 문을 조사하면 내려간다(삐걱 — 계단 발소리 — 어둠). 수장고엔 불이 없다: 천장 등은 죽었고 전구 하나만 가물거린다 → 손전등
     · 선반에 쌓인 액자들 · 천을 덮은 이젤들 · 북쪽 벽을 채운 스물네 점의 같은 초상(모두 얼굴이 없고, 눈만 있다)
     · 동쪽 벽의 초상 하나 — 명패에 오늘 날짜. 들여다보면 문이 잠긴다(10초). 등 뒤에서 발소리가 다가온다
     · 나가는 문을 조사하면 올라간다(명예의 전당, 그 문 앞)
   수장고에 있는 동안은 위층 조명이 새어 들지 않게 전시 조명 · 방 조명 · 달빛을 끈다 */
const VAULT = { door: null, doorInfo: null, exitInfo: null, special: null, bulb: null, shown: false };
function vaultMat(m) {
  const c = m.clone();
  c.userData = Object.assign({}, m.userData); c.onBeforeCompile = m.onBeforeCompile;
  if (c.isMeshBasicMaterial) { c.color.setRGB(0.015, 0.015, 0.015); c.userData.noBatch = true; return c; }     // 천장 선형등 — 죽어 있다
  c.envMap = M.envIn; c.envMapIntensity = 0.05;
  if (c.color) c.color.multiplyScalar(0.75);
  if (c.emissive) c.emissive.setRGB(0, 0, 0);
  return c;
}
function dressVault(r, g) {
  const seen = new Map();
  g.traverse((o) => {
    if (!o.isMesh || Array.isArray(o.material) || !o.material) return;
    const m = o.material;
    if (!(m.isMeshBasicMaterial || m.isMeshStandardMaterial)) return;
    if (!seen.has(m)) seen.set(m, vaultMat(m));
    o.material = seen.get(m);
  });
  const W = r.w / CM, D = r.d / CM, H = r.h / CM;
  const std = (hex, rough, met) => { const m = new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: met || 0 }); m.envMap = M.envIn; m.envMapIntensity = 0.05; m.userData.noBatch = true; return m; };
  const metal = std(0x3A3834, 0.6, 0.5), wood = std(0x3A2A1E, 0.8), cloth = std(0xB8B2A6, 1), canvasBack = std(0x5A4632, 0.9);
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1), E = new THREE.Euler();
  const put = (list, geo, x, y, z, ry, rz) => { E.set(0, ry || 0, rz || 0); M4.compose(V.set(x, y, z), Q.setFromEuler(E), S1); geo.applyMatrix4(M4); list.push(geo); };
  // 선반 세 줄 — 쇠 기둥 · 선반 셋 · 기대 놓은 액자들
  const metG = [], artG = [], R = rnd(8077);
  for (const zr of [4.2, 7.6, 11.0]) {
    const x0 = 2.6, x1 = 12.4;
    for (const x of [x0, (x0 + x1) / 2, x1]) for (const dz of [-0.3, 0.3]) put(metG, new THREE.BoxGeometry(0.05, 2.4, 0.05), x, 1.2, zr + dz);
    for (const y of [0.35, 1.2, 2.05]) {
      put(metG, new THREE.BoxGeometry(x1 - x0 + 0.1, 0.03, 0.64), (x0 + x1) / 2, y, zr);
      for (let x = x0 + 0.3; x < x1 - 0.3; x += 0.25 + R() * 0.5) {
        const w = 0.4 + R() * 0.5, h = 0.4 + R() * 0.35;
        put(artG, new THREE.BoxGeometry(w, h, 0.04), x, y + h / 2 + 0.02, zr + (R() - 0.5) * 0.3, (R() - 0.5) * 0.3, (R() - 0.5) * 0.25);
      }
    }
    M.walls.push({ x0: x0 * CM - 30, x1: x1 * CM + 30, z0: (zr - 0.35) * CM, z1: (zr + 0.35) * CM, y0: r.y0, y1: r.y0 + 260 });
  }
  const mm = new THREE.Mesh(mergeGeos(metG), metal); mm.castShadow = false; g.add(mm);
  g.add(new THREE.Mesh(mergeGeos(artG), canvasBack));
  // 천을 덮은 이젤 — 사람 키만 한 것들
  const clG = [];
  for (const [x, z] of [[1.2, 2.2], [14.6, 3.0], [1.3, 9.2], [14.4, 12.4], [3.6, 13.4]]) {
    const c = new THREE.ConeGeometry(0.42, 1.85, 9, 1, true); c.scale(1, 1, 0.8); put(clG, c, x, 0.93, z, R() * 3);
    put(clG, new THREE.SphereGeometry(0.16, 10, 8), x, 1.86, z);
    M.walls.push({ x0: x * CM - 40, x1: x * CM + 40, z0: z * CM - 40, z1: z * CM + 40, y0: r.y0, y1: r.y0 + 200 });
  }
  const clm = new THREE.Mesh(mergeGeos(clG), cloth); clm.material.side = THREE.DoubleSide; g.add(clm);
  // 북쪽 벽 — 같은 초상 스물네 점(얼굴 없이 눈만)
  const tex = new THREE.CanvasTexture(portraitCanvas(true)); tex.colorSpace = THREE.SRGBColorSpace;
  const pm = std(0xFFFFFF, 0.6); pm.map = tex;
  const frames = new THREE.InstancedMesh(new THREE.BoxGeometry(0.66, 0.8, 0.05), wood, 24);
  const pics = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.56, 0.7), pm, 24);
  let n = 0;
  for (let row = 0; row < 3; row++) for (let col = 0; col < 8; col++) {
    const x = 1.6 + col * 1.8, y = 0.85 + row * 0.95, rz = (R() - 0.5) * (R() < 0.3 ? 0.22 : 0.04);
    E.set(0, 0, rz); Q.setFromEuler(E);
    M4.compose(V.set(x, y, 0.08), Q, S1); frames.setMatrixAt(n, M4);
    M4.compose(V.set(x, y, 0.108), Q, S1); pics.setMatrixAt(n, M4);
    n++;
  }
  g.add(frames, pics);
  // 동쪽 벽 — 오늘 날짜의 초상
  const sc = portraitCanvas(true, HAUNT.metCh || 'p1', 'smile'), sctx = sc.getContext('2d');
  sctx.fillStyle = '#8C7A52'; sctx.fillRect(sc.width / 2 - 90, sc.height - 70, 180, 40);
  sctx.fillStyle = '#1A140E'; sctx.font = 'bold 22px sans-serif'; sctx.textAlign = 'center'; sctx.textBaseline = 'middle';
  const d = new Date(); sctx.fillText(d.getFullYear() + '. ' + (d.getMonth() + 1) + '. ' + d.getDate() + '.', sc.width / 2, sc.height - 50);
  const st = new THREE.CanvasTexture(sc); st.colorSpace = THREE.SRGBColorSpace; VAULT.specialTex = st;
  const sp = new THREE.Group(); sp.position.set(W - 0.06, 1.55, 7.5); sp.rotation.y = -Math.PI / 2;
  sp.add(new THREE.Mesh(new THREE.BoxGeometry(0.98, 1.2, 0.06), wood));
  const spPic = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 1.08), std(0xFFFFFF, 0.55)); spPic.material.map = st; spPic.position.z = 0.032; sp.add(spPic);
  const spHit = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.4, 0.4), new THREE.MeshBasicMaterial({ visible: false })); sp.add(spHit);
  g.add(sp);
  VAULT.special = { id: 'vault-portrait', type: 'portrait', icon: '🖼', label: '보관 중인 초상', title: '보관 중 — 오늘의 관람객', subtitle: '수장고 · 아직 걸리지 않음',
    img: sc.toDataURL('image/jpeg', 0.85), x: r.x1 - 6, z: 750, y: 155, room: 'vault',
    body: '명패에 오늘 날짜가 적혀 있다. 물감이 아직 마르지 않았다.' + String.fromCharCode(10) + String.fromCharCode(10) + '이 초상은 아직 걸리지 않았다. 걸 자리를 찾고 있다.' };
  M.pickables.push(spHit); M.artByMesh.set(spHit, VAULT.special);
  // 전구 하나 — 천장 가운데, 가물거린다(빛은 거의 없다)
  const bulbM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.8, 0.55).multiplyScalar(2.2) });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), bulbM); bulb.position.set(W / 2, H - 0.55, D / 2); g.add(bulb);
  const cord = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.5, 0.01), metal); cord.position.set(W / 2, H - 0.27, D / 2); g.add(cord);
  VAULT.bulb = bulbM;
  // 나가는 문 — 남쪽 벽 가운데
  const ex = vaultDoorMesh(wood, metal); ex.position.set(W / 2, 0, D - 0.04); ex.rotation.y = Math.PI; g.add(ex);
  const exHit = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.5), new THREE.MeshBasicMaterial({ visible: false })); exHit.position.set(W / 2, 1.1, D - 0.2); g.add(exHit);
  VAULT.exitInfo = { id: 'vault-exit', type: 'placard', icon: '🚪', label: '계단 — 위로', title: '계단 — 위로', room: 'vault', x: r.cx, z: r.z1 - 20, y: 110, onUse: () => vaultGo(false) };
  M.pickables.push(exHit); M.artByMesh.set(exHit, VAULT.exitInfo);
  g.traverse((o) => { if (o.isMesh) o.userData.keep = true; });
}
/** 철문 — 문틀 · 문짝 · 손잡이 · 명판 */
function vaultDoorMesh(wood, metal) {
  const G = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0x4A4C4E, roughness: 0.45, metalness: 0.7 }); steel.userData.noBatch = true;
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.96, 2.08, 0.05), steel); leaf.position.set(0, 1.04, 0.03); G.add(leaf);
  for (const [w, h, x, y] of [[0.08, 2.2, -0.52, 1.1], [0.08, 2.2, 0.52, 1.1], [1.12, 0.08, 0, 2.18]]) { const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.09), metal); f.position.set(x, y, 0.04); G.add(f); }
  const knob = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.05), metal); knob.position.set(0.34, 1.02, 0.08); G.add(knob);
  const cv = makeCanvas(256, 96), c = cv.getContext('2d');
  c.fillStyle = '#E6DFD0'; c.fillRect(0, 0, 256, 96); c.fillStyle = '#8E2A22'; c.fillRect(0, 0, 256, 14);
  c.fillStyle = '#231C16'; c.font = 'bold 30px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('관계자 외', 128, 42); c.fillText('출입금지', 128, 76);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.16), new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 })); plate.material.userData.noBatch = true;
  plate.position.set(0, 1.55, 0.058); G.add(plate);
  return G;
}
/** 명예의 전당 서쪽 벽에 문이 생긴다(안 보는 사이) */
function vaultDoorShow(quiet) {
  if (VAULT.shown) return true;
  const r = M.roomById.hall, g = M.roomGroups.hall; if (!r || !g) return false;
  if (!quiet && M.room && M.room.id === 'hall') return false;
  /* v124 — 사용자: "방탈출에서 수장고를 찾으라는데 어딘지 모르겠네". 서쪽 벽은 통창이라 밤엔 검은 철문이 검은 유리에 묻혔다
     → 막힌 남쪽 벽(트로피실과 맞닿은 벽)의 서쪽 끝 · 문 위에 빨간 비상등과 'B1 수장고' 표지 · 문틈으로 새는 빛 · 미니맵에 빨간 점 */
  const onWall = M.exhibits.filter((e) => e.room === 'hall' && Math.abs(e.z - r.z1) < 80).map((e) => e.x);
  let x = null;
  for (let t = r.x0 + 200; t <= r.x1 - 200; t += 40) if (onWall.every((q) => Math.abs(q - t) > 170)) { x = t; break; }
  if (x == null) x = r.x0 + 200;
  const z = r.z1;
  const wood = new THREE.MeshStandardMaterial({ color: 0x2A1D14, roughness: 0.7 }), metal = new THREE.MeshStandardMaterial({ color: 0x2E2C2A, roughness: 0.5, metalness: 0.6 });
  [wood, metal].forEach((m) => { m.userData.noBatch = true; m.envMap = M.envIn; m.envMapIntensity = 0.4; });
  const D = vaultDoorMesh(wood, metal); D.position.set(x / CM, 0, z / CM - 0.13); D.rotation.y = Math.PI; g.add(D);      // 방 안(북)을 본다
  // 빨간 비상등 + 'B1 수장고' 표지 + 문틈 빛(밤에도 멀리서 보이게 — 빛은 아니고 스스로 빛나는 판 · 번짐)
  { const cv = makeCanvas(256, 80), c = cv.getContext('2d'); c.fillStyle = '#2A0806'; c.fillRect(0, 0, 256, 80); c.fillStyle = '#FF5A44'; c.font = 'bold 40px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('B1 수장고', 128, 42);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.2), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); sign.position.set(0, 2.42, 0.06); D.add(sign);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xFF3020).multiplyScalar(3), toneMapped: false })); bulb.position.set(0.42, 2.42, 0.08); D.add(bulb);
    const gcv = makeCanvas(64, 64), gc = gcv.getContext('2d'), gr = gc.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,70,50,.9)'); gr.addColorStop(1, 'rgba(255,40,30,0)'); gc.fillStyle = gr; gc.fillRect(0, 0, 64, 64);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gcv), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); halo.scale.set(1.1, 1.1, 1); halo.position.copy(bulb.position); D.add(halo);
    const leak = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.012), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xFF6A3A).multiplyScalar(2), toneMapped: false })); leak.position.set(0, 0.012, 0.07); D.add(leak);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(gcv), transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false })); pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.008, 0.35); D.add(pool);
    VAULT.halo = halo; }
  const hit = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.5), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(x / CM, 1.1, z / CM - 0.35); g.add(hit);
  VAULT.doorInfo = { id: 'vault-door', type: 'placard', icon: '🚪', label: '관계자 외 출입금지', title: '관계자 외 출입금지', room: 'hall', x, z: z - 30, y: 110, onUse: () => vaultGo(true) };
  M.pickables.push(hit); M.artByMesh.set(hit, VAULT.doorInfo);
  VAULT.door = { D, x, z }; VAULT.shown = true;
  if (typeof drawMinimap === 'function') { M.mmKey = ''; try { drawMinimap(); } catch (e) { /* 다음 프레임에 */ } }
  if (!quiet) { HAUNT.doorNew = true; HAUNT.paT = Math.min(HAUNT.paT, 10); }
  return true;
}
/** 수장고 '오늘의 관람객' — 오늘 말을 건 관람객의 얼굴로 다시 그린다(날짜 명패까지) */
function vaultSpecialFace() {
  if (!VAULT.specialTex || !HAUNT.metCh || VAULT.faceOf === HAUNT.metCh) return;
  const sc = portraitCanvas(true, HAUNT.metCh, 'smile'), c = sc.getContext('2d');
  c.fillStyle = '#8C7A52'; c.fillRect(sc.width / 2 - 90, sc.height - 70, 180, 40);
  c.fillStyle = '#1A140E'; c.font = 'bold 22px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  const d = new Date(); c.fillText(d.getFullYear() + '. ' + (d.getMonth() + 1) + '. ' + d.getDate() + '.', sc.width / 2, sc.height - 50);
  VAULT.specialTex.image = sc; VAULT.specialTex.needsUpdate = true; VAULT.faceOf = HAUNT.metCh;
  if (VAULT.special) VAULT.special.img = sc.toDataURL('image/jpeg', 0.85);
}
/** 내려가고 올라가기 — 어둠 · 삐걱 · 계단 발소리 */
function vaultGo(down) {
  if (HAUNT.vaultBusy) return;
  if (!down && HAUNT.vaultLock > 0) {
    if (typeof sndCreak === 'function') sndCreak(0.08, 0);
    toast('문이 열리지 않는다.', 1800);
    HAUNT.follow = Math.max(HAUNT.follow, 6); HAUNT.followYaw = M.yaw;
    return;
  }
  HAUNT.vaultBusy = true;
  M.openId = 'vault-move';
  let el = document.getElementById('vaultFade');
  if (!el) { el = document.createElement('div'); el.id = 'vaultFade'; el.className = 'vault-fade'; document.getElementById('gal').appendChild(el); }
  requestAnimationFrame(() => el.classList.add('on'));
  if (typeof sndCreak === 'function') sndCreak(0.07, 0);
  const stone = { mat: 'marble' };
  for (let i = 0; i < 7; i++) setTimeout(() => { if (typeof sndStep === 'function') sndStep(down ? M.roomById.vault : stone, 0.75 - i * (down ? 0.04 : -0.02)); }, 700 + i * 340);
  setTimeout(() => {
    if (down) {
      const r = M.roomById.vault; if (typeof hauntRec === 'function') hauntRec('vault'); vaultSpecialFace();
      teleport(r);
      M.feet = r.y0; M.eyeFeet = M.feet; M.pos.set(r.cx / CM, (M.feet + EYE) / CM, (r.z1 - 180) / CM); M.yaw = 0;
      if (!HAUNT.vaultTold) { HAUNT.vaultTold = true; setTimeout(() => toast(typeof TORCH !== 'undefined' && !TORCH.on ? '수장고 — 불이 없다. 손전등(F)' : '수장고 — 불이 없다', 3200), 900); }
    } else {
      const r = M.roomById.hall, dx = VAULT.door && VAULT.door.x != null ? VAULT.door.x : r.cx, dz = VAULT.door ? VAULT.door.z : r.z1;
      teleport(r);
      M.feet = r.y0; M.eyeFeet = M.feet; M.pos.set(dx / CM, (M.feet + EYE) / CM, (dz - 160) / CM); M.yaw = 0;   // 문 앞 1.6m · 방 안쪽을 본다
    }
    M.cam.position.copy(M.pos); M.cam.rotation.set(0, M.yaw, 0, 'YXZ');
    M.openId = null; HAUNT.vaultBusy = false;
    el.classList.remove('on');
  }, 3100);
}
/** 매 프레임(stepHaunt 앞) — 수장고 안에서는 위층 빛을 끈다 · 전구 · 잠김 */
function stepVault(dt) {
  if (HAUNT.vaultLock > 0) {
    HAUNT.vaultLock -= dt;
    if (HAUNT.vaultLock <= 0 && !HAUNT.calm) hauntPA('수장고 문이 열렸습니다. 서두르십시오.', 2);
  }
  const inV = !!(M.room && M.room.vault);
  if (VAULT.bulb) { const f = typeof nightFlick === 'function' ? nightFlick({ flicker: true, seed: 12.9 }, (HAUNT.t || 0) * 1.3) : 1; const k = (f < 0.5 ? 0.15 : 1) * (0.8 + 0.2 * Math.sin(M.t * 13)); VAULT.bulb.color.setRGB(2.2 * k, 1.76 * k, 1.2 * k); }
  if (inV) {
    for (const s of M.pool || []) s.sp.intensity = 0;
    for (const l of [...(M.vpoint || []), ...(M.vspot || [])]) l.intensity = 0;
    if (M.sun) M.sun.intensity = 0.015;
    if (M.hemi) M.hemi.intensity = NIGHT.hemiI * 0.12;
    if (M.handLight) M.handLight.intensity = 0.3;
    HAUNT.inVault = true;
  } else if (HAUNT.inVault) {
    HAUNT.inVault = false;
    if (M.sun) M.sun.intensity = NIGHT.moonI;
    NIGHT.appliedK = -1;                                                  // 반구광 · 환경광을 다시 맞추게
  }
  // 문이 생기는 때 — 밤이 절반을 넘기면(두 번째 밤부터는 처음부터)
  if (!VAULT.shown && hauntOK() && (HAUNT.dread >= 0.55 || HAUNT.nights >= 1)) vaultDoorShow(HAUNT.nights >= 1);
}

/* ══════════════════════════════════════════════════════════
   v114 — 더 무섭게: 뒤돌면 · 창밖의 얼굴 · 먼 소리 · 소름 소리
   ══════════════════════════════════════════════════════════ */
/** 소름 끼치는 소리 — 높은 현이 긁히듯(불협 넷) + 바람 소리. 짧게 */
function sndStinger(vol) {
  const c = SND.ctx; if (!c || !SND.on) return;
  const t0 = c.currentTime + 0.01;
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.3);
  lp.connect(g); sndPanned(g, 0, 0.7);
  for (const f of [1480, 1568, 1661, 2093]) {
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
    o.detune.setValueAtTime(0, t0); o.detune.linearRampToValueAtTime(-90, t0 + 1.2);
    const og = c.createGain(); og.gain.value = 0.25; o.connect(og); og.connect(lp); o.start(t0); o.stop(t0 + 1.35);
  }
  const n = Math.floor(c.sampleRate * 0.5), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = c.createBufferSource(); s.buffer = b; const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2400;
  const sg = c.createGain(); sg.gain.value = 0.35; s.connect(hp); hp.connect(sg); sg.connect(lp); s.start(t0);
}
/** 먼 곳의 문 · 위층의 뛰는 발소리 */
function sndSlam(vol, pan) {
  const c = SND.ctx; if (!c || !SND.on) return;
  const t0 = c.currentTime + 0.02;
  const o = c.createOscillator(), g = c.createGain(); o.type = 'sine';
  o.frequency.setValueAtTime(70, t0); o.frequency.exponentialRampToValueAtTime(32, t0 + 0.35);
  sndEnv(g, t0, 0.004, vol, 0.45); o.connect(g); sndPanned(g, pan, 0.95); o.start(t0); o.stop(t0 + 0.55);
  setTimeout(() => { if (typeof sndCrackle === 'function') sndCrackle(vol * 0.5); }, 60);
}
HAUNT_EV.distant = function () {
  const pan = Math.random() * 2 - 1;
  if (Math.random() < 0.5) sndSlam(0.16, pan);
  else {
    // 위층(또는 옆방)에서 누가 뛰어간다 — 발소리 여덟, 점점 멀어지며
    const room = M.room && !M.room.outdoor ? M.room : { mat: 'oak' };
    for (let i = 0; i < 8; i++) setTimeout(() => { if (typeof sndStep === 'function') sndStep(room, 0.42 - i * 0.04); }, i * 230);
  }
  return true;
};
/* 창밖의 얼굴 — 실내에서, 방 바깥 1.6m(바깥 땅 위) · 화면 안 · 4~14m. 유리창 너머로만 보인다 */
HAUNT_EV.window = function () {
  const here = M.room;
  if (!here || here.outdoor || here.vault || HAUNT.blackShade) return false;
  const PX = M.pos.x * CM, PZ = M.pos.z * CM;
  for (let k = 0; k < 30; k++) {
    const side = Math.floor(Math.random() * 4), u = 0.15 + Math.random() * 0.7;
    const x = side === 0 ? here.x0 - 160 : side === 1 ? here.x1 + 160 : here.x0 + u * here.w;
    const z = side === 2 ? here.z0 - 160 : side === 3 ? here.z1 + 160 : here.z0 + u * here.d;
    const r = M.rooms.find((q) => q.outdoor && !q.part && q.lv === 0 && inRect(q, x, z));
    if (!r || (r.terrain && lakeDist(x, z) < 1.12)) continue;
    const d = Math.hypot(x - PX, z - PZ); if (d < 400 || d > 1400) continue;
    const fy = floorAt(r, x, z);
    if (!(fy === fy) || hitsWall(x, z, fy) || !hauntView(x / CM, fy / CM + 1.4, z / CM).on) continue;
    if (!shadeAt(x, z, r)) return false;
    sndSwell();
    HAUNT.ev = shadeWatch({ x, z, room: r, near: 250, life: 9 });
    return true;
  }
  return false;
};
/* 뒤돌면 — 빠르게 뒤를 돌아보는 순간(0.35초 안에 130° 넘게) 바로 앞에 그 사람이 0.4초. 소름 소리 · 진동.
   밤이 2할 넘게 깊었을 때 · 2~4분에 한 번까지 · 반쯤만 */
function stepJump(dt) {
  if (HAUNT.lastYaw == null) HAUNT.lastYaw = M.yaw;
  // 순간이동(수장고 · 현관 되돌림)으로 시선이 바뀐 것은 '돌아본' 것이 아니다
  const jumped = HAUNT.lpx != null && Math.hypot(M.pos.x - HAUNT.lpx, M.pos.z - HAUNT.lpz) > 2;
  HAUNT.lpx = M.pos.x; HAUNT.lpz = M.pos.z;
  if (jumped || M.openId) { HAUNT.turnAcc = 0; HAUNT.lastYaw = M.yaw; return; }
  HAUNT.turnAcc = HAUNT.turnAcc * Math.exp(-dt / 0.35) + Math.abs(npcAng(M.yaw - HAUNT.lastYaw));
  HAUNT.lastYaw = M.yaw;
  HAUNT.jumpCool -= dt;
  if (HAUNT.turnAcc < 2.3 || HAUNT.jumpCool > 0 || HAUNT.dread < 0.2 || HAUNT.ev || HAUNT.calm || HAUNT.blackShade || !hauntOK()) return;
  HAUNT.jumpCool = 8;                                                    // 실패해도 잠깐은 쉰다
  if (typeof SCARE !== 'undefined' && (SCARE.ev || SCARE.cool > 50)) return;   // v123 — 다른 놀래킴 바로 뒤엔 쉰다
  if (Math.random() > 0.6) return;                                        // v123 — 0.35 → 0.6(사용자: '눈에 잘 안 띈다')
  const f = hauntFwd(), r = M.room;
  const x = M.pos.x * CM + f.x * 75, z = M.pos.z * CM + f.z * 75;           // v123 — 1.25m → 0.75m(얼굴이 화면을 채운다)
  const room = r && inRect(r, x, z) ? r : null;
  if (!room) return;
  const fy = floorAt(room, x, z);
  if (!(fy === fy) || hitsWall(x, z, fy) || !shadeAt(x, z, room)) return;
  HAUNT.jumpCool = 150 + Math.random() * 90;
  if (typeof scareScream === 'function') { scareScream(0.75); SCARE.shake = 0.4; scareFx('flash'); SCARE.cool = Math.max(SCARE.cool, 60); }
  else sndStinger(0.14);
  if (typeof hapt === 'function') hapt([80, 30, 120]);
  if (typeof hauntRec === 'function') hauntRec('jump');
  HAUNT.ev = { t: 0, done: false, step(d) { this.t += d; if (this.t > 0.42 && !this.done) { shadeHide(); hauntGlitch(); this.done = true; } } };
}

/* ══════════════════════════════════════════════════════════
   v115 — 회의에서 정한 J-호러 장치: 걸어오는 그 사람 · 같은 사람이 또 · 벽의 얼룩
   ══════════════════════════════════════════════════════════ */
/** 그 사람의 고정 자세로 되돌린다(걷기 뒤) — 서 있기 한 순간 · 고개를 꺾는다 */
function shadeFreeze() {
  const v = HAUNT.shade; if (!v) return;
  v.walk.setEffectiveWeight(0); v.idle.setEffectiveWeight(1); v.idle.time = 1.3; v.walk.time = 0; v.mixer.update(0);
  v.root.updateMatrixWorld(true);
  const B = typeof npcBones === 'function' ? npcBones(v) : {};
  if (B.head && typeof boneRotWorld === 'function') { boneRotWorld(B.head, new THREE.Vector3(0, 0, 1), 0.42); boneRotWorld(B.head, new THREE.Vector3(1, 0, 0), 0.12); }
}
/* 걸어오는 그 사람(감독 3 · 기획자 1) — 밤이 절반을 넘기면 한 밤에 두 번까지.
   긴 방 끝(12~16m)에 서 있다가 걷기를 0.3배로, 프레임을 건너뛰며 끊기게 다가온다. 그동안 소리가 전부 사라진다.
   눈을 돌리면 그 사이 두 걸음씩 다가와 있다. 손전등으로 붙잡으면(0.6초) 사라진다. 2.5m 까지 오면 — 정전 · 손전등 배터리가 절반 */
HAUNT_EV.walker = function () {
  const here = M.room;
  if (!here || here.vault || HAUNT.blackShade) return false;
  const f = hauntFwd(), PX = M.pos.x * CM, PZ = M.pos.z * CM;
  for (let k = 0; k < 20; k++) {
    const a = (Math.random() - 0.5) * 0.4, dx = f.x * Math.cos(a) - f.z * Math.sin(a), dz = f.z * Math.cos(a) + f.x * Math.sin(a);
    // 트인 공간 끝까지의 거리(8~16m) — 같은 층 · 벽에 막히기 전까지(그랜드 홀은 여러 방이 트여 이어져 있다)
    let edge = 0;
    while (edge < 1700) {
      const qx = PX + dx * (edge + 25), qz = PZ + dz * (edge + 25);
      if (!walkerRoomAt(here, qx, qz) || hitsWall(qx, qz, here.outdoor ? floorAt(walkerRoomAt(here, qx, qz), qx, qz) : here.y0)) break;
      edge += 25;
    }
    edge -= 120;
    if (edge < 800) continue;
    const D = Math.min(edge, 1200 + Math.random() * 400);
    const x = PX + dx * D, z = PZ + dz * D;
    const r = walkerRoomAt(here, x, z);
    if (!r || (r.terrain && lakeDist(x, z) < 1.12)) continue;
    const fy = floorAt(r, x, z);
    if (!(fy === fy) || hitsWall(x, z, fy) || !hauntView(x / CM, fy / CM + 1.4, z / CM).on) continue;
    if (!shadeAt(x, z, r)) return false;
    HAUNT.walks = (HAUNT.walks || 0) + 1;
    const v = HAUNT.shade;
    v.idle.setEffectiveWeight(0); v.walk.setEffectiveWeight(1);
    // 소리 — 전부 사라진다
    if (typeof SND !== 'undefined' && SND.master && SND.ctx) { const g = SND.master.gain, t = SND.ctx.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0.04, t + 1.2); }
    if (typeof scoreHush === 'function') scoreHush(30);
    if (typeof hauntRec === 'function') hauntRec('walker');
    HAUNT.ev = walkerWatch({ x, z, room: r });
    return true;
  }
  return false;
};
/** 같은 층에서 그 자리의 방(실내는 실내끼리 · 바깥은 바깥끼리) */
function walkerRoomAt(here, x, z) {
  return M.rooms.find((q) => !q.secret && !q.stair && q.outdoor === here.outdoor && Math.abs(q.y0 - here.y0) < 1 && (q.outdoor ? !q.part : true) && inRect(q, x, z)) || null;
}
function walkerWatch(o) {
  const end = (dark) => {
    const v = HAUNT.shade;
    shadeHide(); shadeFreeze();
    if (typeof SND !== 'undefined' && SND.master && SND.ctx) { const g = SND.master.gain, t = SND.ctx.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(SND.on ? 1 : 0, t + (dark ? 2.5 : 0.8)); }
    if (dark) {
      if (M.room && !M.room.outdoor && !NIGHT.black) NIGHT.black = { room: M.room.id, t: 0, dur: 1.6, k: 1, on: false };
      else if (typeof hauntGlitch === 'function') hauntGlitch();
      if (typeof sndBlack === 'function') sndBlack(false);
      if (typeof TORCH !== 'undefined') TORCH.bat *= 0.5;
      if (typeof hapt === 'function') hapt([120, 60, 200]);
    }
    if (typeof scoreHush === 'function') scoreHush(0);
  };
  return {
    t: 0, away: 0, done: false,
    step(dt) {
      if (this.done) return;
      const v = HAUNT.shade;
      if (!v || !v.root.visible) { end(false); this.done = true; return; }          // 손전등이 쫓아냈다
      this.t += dt;
      const PX = M.pos.x * CM, PZ = M.pos.z * CM, d = Math.hypot(o.x - PX, o.z - PZ);
      const fy = floorAt(o.room, o.x, o.z) || o.room.y0;
      const V = hauntView(o.x / CM, fy / CM + 1.4, o.z / CM);
      const ux = (PX - o.x) / (d || 1), uz = (PZ - o.z) / (d || 1);
      let move = 0;
      if (V.on) {
        // 끊기는 걸음 — 0.22초마다 한 번씩만 움직이고, 걷기 동작도 그만큼씩 건너뛴다
        this.stepT = (this.stepT || 0) - dt;
        if (this.stepT <= 0) { this.stepT = 0.22; move = 0.35 * 0.22 * 100; v.mixer.update(0.22 * 0.3 * 2.2); }
        this.away = 0;
      } else {
        // 안 보는 사이 — 1.1초마다 두 걸음
        this.away += dt;
        if (this.away > 1.1) { this.away = 0; move = 140; v.mixer.update(0.4); }
      }
      if (move) {
        const nx = o.x + ux * Math.min(move, d - 200), nz = o.z + uz * Math.min(move, d - 200);
        const nr = walkerRoomAt(o.room, nx, nz), nfy = nr ? floorAt(nr, nx, nz) : NaN;
        if (nr && nfy === nfy && !hitsWall(nx, nz, nfy)) { o.x = nx; o.z = nz; v.root.position.set(nx / CM, nfy / CM, nz / CM); }
      }
      v.root.rotation.y = Math.atan2(ux, uz);
      if (d < 260) { end(true); this.done = true; if (typeof hauntSay === 'function') setTimeout(() => hauntSay('…'), 1400); return; }
      if (this.t > 45 || !hauntOK()) { end(false); this.done = true; }
    },
  };
}
/* 같은 사람이 또(감독 4 · 기획자 2) — 방금(20초 안) 가까이 지나친 실내 관람객이, 다음 방 문 안쪽에 같은 얼굴 · 같은 옷으로 서 있다.
   말을 걸면 이름을 묻는다. 가까이 가거나 1분이 지나면 — 안 보는 사이 없다 */
HAUNT_EV.double = function () {
  if (typeof crowdGraph !== 'function' || !M.room || M.room.outdoor) return false;
  const now = HAUNT.t, src = (M.npcs || []).filter((n) => !n.out && n.seenAt && now - n.seenAt < 20 && n.v && n.v.real);
  if (!src.length) return false;
  const n0 = pickOf(src), G = crowdGraph(), PX = M.pos.x * CM, PZ = M.pos.z * CM;
  const cand = (G.get(M.room.id) || []).filter((e) => e.to !== n0.room && Math.hypot(e.into.x - PX, e.into.z - PZ) > 500);
  if (!cand.length) return false;
  const e = pickOf(cand), to = M.roomById[e.to], g = M.roomGroups[e.to];
  const dx = e.into.x - e.p.x, dz = e.into.z - e.p.z, L = Math.hypot(dx, dz) || 1;
  const x = e.p.x + dx / L * 190, z = e.p.z + dz / L * 190;
  if (hitsWall(x, z, to.y0)) return false;
  const v = buildRealVisitor(Object.assign({}, n0.kind, { shoe: n0.kind.sneak }), n0.charI != null ? n0.charI : 0);
  v.idle.setEffectiveWeight(1); v.walk.setEffectiveWeight(0); v.mixer.update(n0.v.idle.time || 1);
  v.root.position.set(x / CM, 0, z / CM); v.root.rotation.y = Math.atan2(e.p.x - x, e.p.z - z);
  g.add(v.root);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.55, v.hM, 0.55), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(x / CM, v.hM / 2, z / CM); g.add(hit);
  const ghost = { x, z, room: e.to, v, hM: v.hM, fy: 0, kid: false, out: false, info: null };
  ghost.info = { id: 'npc-double', type: 'placard', label: n0.info.label, title: n0.info.label, room: e.to, x, z, y: 120,
    onUse: () => { if (typeof hauntRec === 'function') hauntRec('double'); toast('… 이름이 뭐예요?', 2600); if (typeof sndMurmur === 'function') sndMurmur(ghost, 1.4, true); ghost.asked = true; } };
  M.pickables.push(hit); M.artByMesh.set(hit, ghost.info);
  HAUNT.doubles = (HAUNT.doubles || 0) + 1;
  HAUNT.ev = {
    t: 0, done: false, seen: false,
    step(dt) {
      if (this.done) return;
      this.t += dt;
      const d = Math.hypot(x - M.pos.x * CM, z - M.pos.z * CM), on = hauntView(x / CM, to.y0 / CM + 1.5, z / CM).on && (g.visible !== false);
      if (on && d < 1400) { this.seen = true; if (typeof hauntRec === 'function' && d < 700) hauntRec('double'); }
      if ((!on && (this.seen && (d < 350 || this.t > 20))) || this.t > 60 || !hauntOK()) {
        g.remove(v.root); g.remove(hit);
        const i = M.pickables.indexOf(hit); if (i >= 0) M.pickables.splice(i, 1); M.artByMesh.delete(hit);
        v.mesh.material.dispose(); this.done = true;
      }
    },
  };
  return true;
};
/* 벽의 얼룩(감독 6) — 실내에서 그 사람이 벽 가까이 서 있다 사라지면, 그 자리 벽에 사람 모양 검은 얼룩이 남는다(지워지지 않는다) */
function hauntStain(x, z, room) {
  if (!room || room.outdoor || (HAUNT.stains || 0) >= 5) return;
  const ds = [[x - room.x0, 'x0'], [room.x1 - x, 'x1'], [z - room.z0, 'z0'], [room.z1 - z, 'z1']].sort((a, b) => a[0] - b[0]);
  if (ds[0][0] > 170) return;
  const side = ds[0][1], g = M.roomGroups[room.id]; if (!g) return;
  if (!HAUNT.stainTex) {
    /* v121 — 사용자 스크린샷: 번진 연기처럼 보여 사람으로 읽히지 않았다(blur 7px · 머리와 몸통 두 덩어리뿐).
       → 윤곽을 또렷하게: 머리 · 늘어진 긴 머리카락 · 좁은 어깨 · 늘어뜨린 두 팔 · 가슴께에 짚은 손바닥 둘 · 아래로 흘러내린 물자국 */
    const W = 200, H = 440, cv = makeCanvas(W, H), c = cv.getContext('2d'), R = rnd(919);
    c.fillStyle = 'rgba(12,9,8,.95)'; c.filter = 'blur(2.2px)';
    const body = () => {
      c.beginPath(); c.ellipse(100, 58, 25, 32, 0, 0, Math.PI * 2); c.fill();                       // 머리
      c.beginPath(); c.moveTo(74, 52); c.bezierCurveTo(66, 110, 70, 150, 78, 170); c.lineTo(122, 170); c.bezierCurveTo(130, 150, 134, 110, 126, 52); c.fill();   // 늘어진 머리카락
      c.beginPath(); c.moveTo(58, 128); c.bezierCurveTo(70, 104, 130, 104, 142, 128); c.lineTo(136, 300); c.bezierCurveTo(120, 316, 80, 316, 64, 300); c.closePath(); c.fill();   // 몸통
      for (const s of [-1, 1]) { c.beginPath(); c.moveTo(100 + s * 40, 128); c.quadraticCurveTo(100 + s * 54, 200, 100 + s * 52, 268); c.lineTo(100 + s * 42, 270); c.quadraticCurveTo(100 + s * 42, 200, 100 + s * 30, 136); c.fill(); }   // 팔
      for (const s of [-1, 1]) { c.beginPath(); c.moveTo(100 + s * 14, 300); c.lineTo(100 + s * 18, 420); c.lineTo(100 + s * 6, 420); c.lineTo(100 + s * 2, 300); c.fill(); }   // 다리(아래로 옅어진다)
    };
    body();
    // 가슴께에 짚은 손바닥 둘(벽을 안에서 민 것처럼)
    for (const s of [-1, 1]) { c.save(); c.translate(100 + s * 26, 190); c.beginPath(); c.ellipse(0, 6, 12, 14, 0, 0, Math.PI * 2); c.fill();
      for (let f = 0; f < 4; f++) { c.beginPath(); c.ellipse(-9 + f * 6, -14 - Math.abs(f - 1.5) * 2, 3, 9, 0, 0, Math.PI * 2); c.fill(); } c.restore(); }
    // 흘러내린 자국
    c.filter = 'blur(1px)';
    for (let i = 0; i < 16; i++) { const x = 64 + R() * 72, y = 250 + R() * 60, L = 40 + R() * 110; c.fillRect(x, y, 2 + R() * 2.5, L); c.beginPath(); c.arc(x + 1.5, y + L, 2.6, 0, 6.28); c.fill(); }
    // 아래로 갈수록 옅게
    c.filter = 'none'; c.globalCompositeOperation = 'destination-in';
    const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.62, 'rgba(0,0,0,.95)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = gr; c.fillRect(0, 0, W, H);
    HAUNT.stainTex = new THREE.CanvasTexture(cv);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.76), new THREE.MeshBasicMaterial({ map: HAUNT.stainTex, transparent: true, opacity: 0.72, depthWrite: false }));
  const px = side === 'x0' ? room.x0 + 3 : side === 'x1' ? room.x1 - 3 : x, pz = side === 'z0' ? room.z0 + 3 : side === 'z1' ? room.z1 - 3 : z;
  m.position.set(px / CM, 0.9, pz / CM);
  m.rotation.y = side === 'x0' ? Math.PI / 2 : side === 'x1' ? -Math.PI / 2 : side === 'z0' ? 0 : Math.PI;
  m.renderOrder = 2; g.add(m);
  HAUNT.stains = (HAUNT.stains || 0) + 1;
}
/** 최근에 본 관람객(같은 사람이 또 — 재료) — stepHaunt 앞에서 */
function stepSeen() {
  for (const n of M.npcs || []) {
    if (n.out || !(n.pd < 900)) continue;
    const r = M.roomById[n.room];
    if (hauntView(n.x / CM, r.y0 / CM + 1.5, n.z / CM).on) n.seenAt = HAUNT.t;
  }
}
