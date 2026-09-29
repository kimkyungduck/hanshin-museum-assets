/* ══════════════════════════════════════════════════════════
   소리(v95) — 발소리 · 바깥 새소리와 바람 · 분수와 호수 물소리 · 실내 공기음 · 관람객 말소리 · 물속
   ══════════════════════════════════════════════════════════
   예전엔 배경음악(관리자가 유튜브 주소를 넣었을 때만)과 골프 합성음뿐이라 거의 늘 조용했다.
     · 녹음 — 발소리(돌 · 나무 · 잔디 · 카펫 각 5가지, Kenney Impact Sounds CC0), 새소리(OpenGameArt isaiah658 CC0),
             흐르는 물(OpenGameArt '30 CC0 SFX loops' CC0). 모두 mp3(아이폰 포함 어디서나 풀린다), 합계 약 280KB
     · 합성 — 바람 · 실내 공기음 · 관람객 말소리(알아들을 수 없게 뭉개진 두런거림) · 물속 거품
     · 거리 · 방향 — 분수 · 호수 · 관람객 소리는 가까울수록 크고, 왼쪽/오른쪽으로 갈린다
   소리는 '입장' 을 누른 뒤에 켠다(브라우저는 사용자 동작 없이 소리를 못 낸다). M 키 · 소리 칩으로 끈다(기억한다). */

const SND = { ctx: null, buf: {}, on: true, loops: {}, stepSide: 0 };
const SND_KEY = 'museum-sfx-off';
const SND_DIR = (window.MUSEUM_CDN || '') + 'assets/sfx/';
const SND_FILES = ['birds', 'water'];
for (const k of ['stone', 'wood', 'grass', 'carpet']) for (let i = 0; i < 5; i++) SND_FILES.push('step_' + k + '_' + i);

/** 오디오 문맥 하나를 모두가 쓴다(골프 합성음 · 카트 모터도 여기로) */
function sndCtx() {
  if (!SND.ctx) {
    try { SND.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { SND.ctx = null; return null; }
    const c = SND.ctx;
    SND.master = c.createGain(); SND.master.gain.value = SND.on ? 1 : 0;
    SND.lp = c.createBiquadFilter(); SND.lp.type = 'lowpass'; SND.lp.frequency.value = 20000;     // 물속에선 먹먹하게
    SND.lp.connect(SND.master); SND.master.connect(c.destination);
    SND.bus = SND.lp;
  }
  if (SND.ctx.state === 'suspended') SND.ctx.resume();
  return SND.ctx;
}
/** 입장할 때 — 소리를 받고 배경 소리를 깐다 */
function sndStart() {
  try { SND.on = localStorage.getItem(SND_KEY) !== '1'; } catch (e) { /* 기본 켬 */ }
  const c = sndCtx(); if (!c) return;
  SND.master.gain.value = SND.on ? 1 : 0;
  sndChip();
  if (SND.loading) return;
  SND.loading = Promise.all(SND_FILES.map((n) => fetch(SND_DIR + n + '.mp3').then((r) => (r.ok ? r.arrayBuffer() : null))
    .then((a) => a && new Promise((res) => c.decodeAudioData(a, res, () => res(null))))
    .then((b) => { if (b) SND.buf[n] = b; }).catch(() => {})))
    .then(() => sndAmbience());
}
function sndToggle(on) {
  SND.on = on == null ? !SND.on : on;
  try { localStorage.setItem(SND_KEY, SND.on ? '0' : '1'); } catch (e) { /* 기억 못 해도 된다 */ }
  if (SND.master) SND.master.gain.setTargetAtTime(SND.on ? 1 : 0, SND.ctx.currentTime, 0.05);
  sndChip();
}
function sndChip() {
  let c = document.getElementById('sndChip');
  if (!c) {
    c = document.createElement('button'); c.id = 'sndChip'; c.className = 'bgm-chip snd-chip';
    c.addEventListener('click', (ev) => { ev.stopPropagation(); sndToggle(); });
    (document.getElementById('gal') || document.body).appendChild(c);
  }
  c.textContent = SND.on ? '🔊 소리 끄기' : '🔈 소리 켜기';
  c.classList.toggle('off', !SND.on);
}

/** 이어 트는 소리 — mp3 앞뒤의 빈틈(인코더 지연)을 잘라 이음매 '틱' 을 없앤다 */
function sndLoop(name, rate = 1) {
  const c = SND.ctx, b = SND.buf[name]; if (!c || !b) return null;
  const s = c.createBufferSource(); s.buffer = b; s.loop = true; s.playbackRate.value = rate;
  s.loopStart = Math.min(0.06, b.duration * 0.05); s.loopEnd = b.duration - Math.min(0.06, b.duration * 0.05);
  const g = c.createGain(); g.gain.value = 0;
  const pan = c.createStereoPanner ? c.createStereoPanner() : null;
  s.connect(g); if (pan) { g.connect(pan); pan.connect(SND.bus); } else g.connect(SND.bus);
  s.start(0, s.loopStart);
  return { s, g, pan };
}
/** 잡음 — 바람 · 공기음 · 거품의 재료 */
function sndNoise(sec = 4) {
  const c = SND.ctx, n = Math.floor(c.sampleRate * sec), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }   // 갈색 잡음(낮고 부드럽다)
  const s = c.createBufferSource(); s.buffer = b; s.loop = true; return s;
}
function sndAmbience() {
  const c = SND.ctx; if (!c || SND.loops.birds) return;
  SND.loops.birds = sndLoop('birds');
  SND.loops.fountain = sndLoop('water');
  SND.loops.lake = sndLoop('water', 0.72);
  // 바람 — 갈색 잡음을 띠 거르기, 세기가 천천히 오르내린다
  const wind = sndNoise(6), wf = c.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 380; wf.Q.value = 0.6;
  const wg = c.createGain(); wg.gain.value = 0; wind.connect(wf); wf.connect(wg); wg.connect(SND.bus); wind.start();
  SND.loops.wind = { g: wg, f: wf };
  // 실내 공기음 — 아주 낮고 작게(완전한 정적은 오히려 어색하다)
  const room = sndNoise(5), rf = c.createBiquadFilter(); rf.type = 'lowpass'; rf.frequency.value = 260;
  const rg = c.createGain(); rg.gain.value = 0; room.connect(rf); rf.connect(rg); rg.connect(SND.bus); room.start();
  SND.loops.room = { g: rg };
}
const sndSet = (L, v, pan) => {
  if (!L) return; const t = SND.ctx.currentTime;
  L.g.gain.setTargetAtTime(v, t, 0.25);
  if (pan != null && L.pan) L.pan.pan.setTargetAtTime(clamp(pan, -1, 1), t, 0.1);
};
/** 소리 나는 곳이 듣는 사람의 왼쪽/오른쪽 어디인가(-1 … 1) */
function sndPan(x, z) {
  const dx = x - M.pos.x, dz = z - M.pos.z, L = Math.hypot(dx, dz) || 1;
  return (dx * Math.cos(M.yaw) - dz * Math.sin(M.yaw)) / L;
}

/** 매 프레임 — 자리에 따라 배경 소리를 섞는다 */
function stepSound(dt) {
  if (!SND.ctx || !SND.loops.room || !M.pos) return;
  const r = M.room, out = !!(r && r.outdoor), under = typeof LAKE !== 'undefined' && LAKE.under;
  const night = typeof NIGHT !== 'undefined' && NIGHT.on;           // v98 — 밤: 새 대신 바람이 조금 더
  sndSet(SND.loops.birds, under || night ? 0 : out ? 0.32 : 0.03);
  sndSet(SND.loops.wind, under ? 0 : out ? (night ? 0.075 : 0.05) + 0.03 * Math.sin(M.t * 0.23) : night ? 0.008 : 0.004);
  sndSet(SND.loops.room, out ? 0 : 0.05);
  // 분수 — 정문 광장 가운데
  const fz = M.roomById && M.roomById.plaza;
  if (fz) { const fx = fz.cx / CM, fzz = fz.cz / CM, d = Math.hypot(fx - M.pos.x, fzz - M.pos.z); sndSet(SND.loops.fountain, under ? 0 : clamp(1 - d / 26, 0, 1) ** 2 * 0.55, sndPan(fx, fzz)); }
  // 호수 — 물가에서 잔잔히
  if (typeof HOLE !== 'undefined' && typeof lakeDist === 'function') {
    const L = lakeDist(M.pos.x * CM, M.pos.z * CM);
    sndSet(SND.loops.lake, under ? 0.25 : clamp(1.35 - L, 0, 0.4) * 0.45, sndPan(HOLE.lake.x / CM, HOLE.lake.z / CM));
  }
  // 물속 — 먹먹하게
  SND.lp.frequency.setTargetAtTime(under ? 480 : 20000, SND.ctx.currentTime, 0.08);
}

/** 발소리 — 바닥 재질에 맞춰. x·z 가 있으면 그 자리에서(관람객) */
function sndSurface(room) {
  if (!room) return 'stone';
  if (room.terrain || room.mat === 'lawn') return 'grass';
  if (room.mat === 'deck') return 'wood';
  if (room.outdoor) return 'stone';
  if (room.mat === 'dark') return 'carpet';
  if (/gallery|oak|walnut|velvet/.test(room.mat || '')) return 'wood';
  return 'stone';
}
/* v98 — 발소리가 경박했다: Kenney 녹음은 짧고 높은 '톡' 이라 그대로 틀면 구두 굽이 아니라 장난감 소리였다.
   → ① 낮춰 튼다(0.72~0.8배 — 무게) ② 높은 쪽을 깎는다(바닥별 저역 통과 — 딸깍임 제거)
     ③ 밑에 낮은 '쿵'(90→48Hz, 0.12초)을 깐다 — 몸무게가 실리는 소리 ④ 실내는 빈 전시관의 울림(잔향 1.8초)을 보낸다
   걸음마다 세기 · 높이를 조금씩 흔든다(같은 소리 반복이 기계처럼 들리지 않게) */
const STEP_TONE = {
  //        빠르기   깎는 곳  쿵 세기  소리 세기
  stone:  { rate: 0.74, lp: 1700, thud: 0.55, g: 0.46 },
  wood:   { rate: 0.72, lp: 1250, thud: 0.65, g: 0.5 },
  carpet: { rate: 0.8,  lp: 700,  thud: 0.4,  g: 0.3 },
  grass:  { rate: 0.86, lp: 2200, thud: 0.18, g: 0.42 },
};
/** 잔향 — 합성 임펄스(앞 12ms 는 서서히, 뒤는 어둡게 꺼진다). 발소리 · 말소리가 함께 쓴다 */
function sndVerb() {
  if (SND.verb) return SND.verb;
  const c = SND.ctx, len = Math.floor(c.sampleRate * 1.8), ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch); let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len, w = Math.random() * 2 - 1;
      lp += (w - lp) * (0.55 - 0.45 * t);                    // 꼬리로 갈수록 어둡게
      d[i] = lp * Math.pow(1 - t, 3.0) * Math.min(1, i / (c.sampleRate * 0.012));
    }
  }
  SND.verb = c.createConvolver(); SND.verb.buffer = ir;
  const wet = c.createGain(); wet.gain.value = 0.9;
  SND.verb.connect(wet); wet.connect(SND.bus);
  return SND.verb;
}
function sndStep(room, vol = 1, x, z) {
  const c = SND.ctx; if (!c || !SND.on) return;
  const kind = sndSurface(room), b = SND.buf['step_' + kind + '_' + Math.floor(Math.random() * 5)];
  if (!b) return;
  const T = STEP_TONE[kind] || STEP_TONE.stone;
  let g0 = vol * T.g * (0.85 + Math.random() * 0.25), pan = 0;
  if (x != null) {
    const d = Math.hypot(x - M.pos.x, z - M.pos.z);
    if (d > 12) return;
    g0 *= clamp(1 - d / 12, 0, 1) ** 2; pan = sndPan(x, z);
  }
  const t0 = c.currentTime;
  const s = c.createBufferSource(); s.buffer = b; s.playbackRate.value = T.rate * (0.95 + Math.random() * 0.08);
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = T.lp * (0.9 + Math.random() * 0.2); lp.Q.value = 0.4;
  const g = c.createGain(); g.gain.value = g0;
  s.connect(lp); lp.connect(g);
  // 쿵 — 발바닥이 바닥에 실리는 낮은 울림
  const o = c.createOscillator(), og = c.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(90, t0); o.frequency.exponentialRampToValueAtTime(48, t0 + 0.1);
  og.gain.setValueAtTime(0.0001, t0); og.gain.exponentialRampToValueAtTime(Math.max(0.0002, g0 * T.thud), t0 + 0.006);
  og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.13);
  o.start(t0); o.stop(t0 + 0.15);
  let out = c.createGain();                                      // 녹음(g) + 쿵(og) 이 모이는 곳
  g.connect(out); o.connect(og); og.connect(out);
  if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan * 0.8; out.connect(p); out = p; }
  out.connect(SND.bus);
  // 울림 — 실내는 넓은 빈 방처럼, 바깥은 아주 조금
  const send = c.createGain(); send.gain.value = room && room.outdoor ? 0.08 : 0.42;
  out.connect(send); send.connect(sndVerb());
  s.start(t0);
}

/** 관람객 말소리 — 알아들을 수 없게 뭉개진 두런거림(목소리 높이 · 모음 울림을 음절마다 바꾼다) */
function sndMurmur(n, dur, whisper) {
  const c = SND.ctx; if (!c || !SND.on) return;
  const x = n.x / CM, z = n.z / CM, d = Math.hypot(x - M.pos.x, z - M.pos.z);
  if (d > 11) return;
  const t0 = c.currentTime, fem = (n.v && n.v.hM < 1.68), kid = (n.v && n.v.hM < 1.5);
  const o = c.createOscillator(); o.type = 'sawtooth';
  const f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter(), lp = c.createBiquadFilter();
  f1.type = f2.type = 'bandpass'; f1.Q.value = 5; f2.Q.value = 7; lp.type = 'lowpass'; lp.frequency.value = whisper ? 1000 : kid ? 2300 : 1500;
  const g = c.createGain(), mix = c.createGain(); g.gain.value = 0; mix.gain.value = (whisper ? 0.028 : 0.05) * clamp(1 - d / 11, 0, 1) ** 1.5;
  o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); g.connect(lp); lp.connect(mix);
  if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = sndPan(x, z) * 0.7; mix.connect(p); p.connect(SND.bus); } else mix.connect(SND.bus);
  const rm = M.roomById && M.roomById[n.room], send = c.createGain();
  send.gain.value = rm && rm.outdoor ? 0.1 : whisper ? 0.6 : 0.35; mix.connect(send); send.connect(sndVerb());   // v98 — 빈 전시관의 울림
  const base = (kid ? 300 : fem ? 205 : 118) * (whisper ? 0.88 : 1);      // v96 — 아이는 높게, 혼잣말은 낮게 가라앉힌다
  const V = [[700, 1200], [400, 2000], [300, 900], [600, 1700], [450, 1000]];      // 아 · 이 · 우 · 에 · 오 비슷한 울림
  let t = t0 + 0.05;
  while (t < t0 + dur - 0.15) {
    const syl = 0.11 + Math.random() * 0.12, v = V[Math.floor(Math.random() * V.length)];
    o.frequency.setValueAtTime(base * (0.9 + Math.random() * 0.25), t);
    f1.frequency.setValueAtTime(v[0], t); f2.frequency.setValueAtTime(v[1], t);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + syl * 0.3); g.gain.linearRampToValueAtTime(0.05, t + syl);
    t += syl + (Math.random() < 0.18 ? 0.18 : 0.02);
  }
  o.start(t0); o.stop(t0 + dur + 0.1);
}
