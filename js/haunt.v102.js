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
function hauntPA() {
  const dr = HAUNT.dread, tier = dr < 0.25 ? 0 : dr < 0.55 ? 1 : 2;
  let line = HAUNT.portraitNew ? '명예의 전당에 새 초상이 걸렸습니다. 확인해 주십시오.' : pickOf(PA_LINES[tier]);
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
function portraitCanvas(eyes) {
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
  const P = HAUNT.portrait;
  if (P && e === P.info) {
    if (P.eyes) return;
    P.eyes = true;
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
  if (HAUNT.paT <= 0) { HAUNT.paT = (150 + Math.random() * 90) * k; hauntPA(); }
  HAUNT.tiltT -= dt;
  if (HAUNT.tiltT <= 0) HAUNT.tiltT = hauntTilt() ? (60 + Math.random() * 60) * k : 8;
  if (!HAUNT.portrait && HAUNT.dread >= 0.45) { HAUNT.portraitTry = (HAUNT.portraitTry || 0) - dt; if (HAUNT.portraitTry <= 0) { HAUNT.portraitTry = 10; hauntPortrait(); } }
}
