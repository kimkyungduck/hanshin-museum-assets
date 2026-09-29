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
const HAUNT = { t: 0, dread: 0, next: 60 + Math.random() * 40, ev: null, follow: 0, shade: null };
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
  const name = PEOPLE.byName && PEOPLE.byName.remy ? 'remy' : 'p2';
  const v = buildRealVisitor({ coat: '#09090B', pants: '#070708', hairC: '#050505', skin: '#E4DFDA', shoe: '#0A0A0A', h: 1.9 }, name);
  if (name !== 'remy') v.mesh.material.color.setRGB(0.3, 0.3, 0.33);
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
  const g = SND.night.drone.gain, t = c.currentTime;
  g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0.16, t + 1.2); g.linearRampToValueAtTime(0.05, t + 4.5);
}

/* ── 화면 · 자막 ───────────────────────────────────────── */
function hauntGlitch() {
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
      if (n.out || n.talk || !(n.pd < 2200)) continue;
      const r = M.roomById[n.room];
      if (!hauntView(n.x / CM, r.y0 / CM + 1.5, n.z / CM).on) continue;
      n.state = 'notice'; n.noticeT = 5; n.noticeFar = true; n.path = []; n.pause = 0;
      if (n.mono && n.mono.el) n.mono.el.remove(); n.mono = null;
      n0++;
    }
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
    if (!cand.length) return false;
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
      if (V.on) { this.seen = true; this.away = 0; if (Math.abs(V.x) < 0.3 && Math.abs(V.y) < 0.4) this.look += dt; } else this.away += dt;
      const gone = d < o.near || this.look > 1.6 || this.t > o.life || (this.seen && this.away > 2.5) || !hauntOK();
      if (!gone) return;
      if (V.on) { if (o.out) hauntGlitch(); else hauntBlink(); }        // 보는 앞에서는 불이 깜빡이는 사이에
      else if (d < 1200 && typeof sndBreath === 'function') sndBreath(0.05, 0);
      shadeHide(); this.done = true;
    },
  };
}

/* ── 매 프레임 ─────────────────────────────────────────── */
function stepHaunt(dt) {
  if (!NIGHT.on || !M.ready || M.attract) return;
  HAUNT.t += dt;
  HAUNT.dread = clamp(HAUNT.t / 900, 0, 1);
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
    if (B.shadeOK && HAUNT.shade) HAUNT.shade.root.visible = B.t >= B.dur && B.t < B.dur + 0.24 && B.k > 0.3;
  } else if (HAUNT.blackShade && B === null && HAUNT.bsArmed) { HAUNT.blackShade = false; HAUNT.bsArmed = false; if (HAUNT.bsOwn) shadeHide(); HAUNT.bsOwn = false; }
  if (HAUNT.blackShade && B && !B.quick) HAUNT.bsArmed = true;

  if (HAUNT.ev) { HAUNT.ev.step(dt); if (HAUNT.ev.done) HAUNT.ev = null; return; }
  if (!hauntOK()) return;
  HAUNT.next -= dt;
  if (HAUNT.next > 0) return;
  const out = M.room.outdoor, dr = HAUNT.dread;
  const W = out ? [['shadeOut', 3], ['whisper', 2], ['glitch', 1], ['follow', 1]]
    : [['follow', 3], ['shade', 3], ['glitch', 1.5], ['whisper', 2], ['stare', dr > 0.3 ? 1.5 : 0], ['blackShade', dr > 0.15 ? 1.5 : 0.4]];
  let sum = W.reduce((s, w) => s + w[1], 0), r = Math.random() * sum, pick = W[0][0];
  for (const [k, w] of W) { r -= w; if (r <= 0) { pick = k; break; } }
  const ok = HAUNT_EV[pick] && HAUNT_EV[pick]();
  HAUNT.next = ok ? (45 + Math.random() * 60) * (1.2 - 0.6 * dr) : 4;
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
