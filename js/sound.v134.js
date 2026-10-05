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
  try {
    if (SND.on && localStorage.getItem('museum-tip-ear') !== '1') {
      localStorage.setItem('museum-tip-ear', '1');
      setTimeout(() => toast(matchMedia('(pointer: coarse)').matches ? '🎧 이어폰을 끼면 더 잘 들립니다 — 발소리 · 속삭임은 왼쪽 오른쪽이 있습니다. 소리는 🔊 칩으로 끈다'
        : '🎧 이어폰을 끼면 더 잘 들립니다 — 발소리 · 속삭임은 왼쪽 오른쪽이 있습니다. 소리는 M 키로 끈다', 5200), 2500);
    }
  } catch (e) { /* 기억 못 해도 된다 */ }
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
  c.innerHTML = SND.on ? '<i class="ci">🔊</i><span class="ct"> 소리 끄기</span>' : '<i class="ci">🔈</i><span class="ct"> 소리 켜기</span>';
  c.setAttribute('aria-label', SND.on ? '소리 끄기' : '소리 켜기');
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
  sndNightInit();
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
  if (night) stepNightSound(dt, r, out, under);
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

/* ══════════════════════════════════════════════════════════
   밤 소리(v100) — 모두 합성(받을 파일 없음)
   ══════════════════════════════════════════════════════════
   바깥: 풀벌레(세 마리가 제 박자로) · 호숫가 개구리 · 가끔 멀리서 부엉이 · 바닥에 깔린 낮은 웅웅거림
   실내: 형광등 웅 소리(불안한 방) · 떨릴 때 지직 · 정전 '탁' 과 다시 켜지는 지지직 · 가끔 건물이 삐걱 */
function sndNightInit() {
  const c = SND.ctx; if (!c || SND.night) return;
  const N = SND.night = { cr: [0, 0, 0].map((_, i) => ({ t: Math.random() * 2, pan: [-0.7, 0.2, 0.8][i], f: 4300 + i * 380 })), frogT: 1, owlT: 25, creakT: 18 };
  // 웅웅거림 — 55Hz · 82.4Hz 사인이 아주 천천히 부풀었다 가라앉는다
  const dg = c.createGain(); dg.gain.value = 0; dg.connect(SND.bus);
  for (const [f, d] of [[55, 0.4], [82.4, -0.3], [110.3, 0.2]]) {
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.detune.value = d * 10;
    const g = c.createGain(); g.gain.value = f < 60 ? 1 : 0.45; o.connect(g); g.connect(dg); o.start();
  }
  N.drone = dg;
  // 형광등 웅 — 120Hz 톱니를 낮게 거른다
  const h = c.createOscillator(); h.type = 'sawtooth'; h.frequency.value = 120;
  const hf = c.createBiquadFilter(); hf.type = 'lowpass'; hf.frequency.value = 420;
  const hg = c.createGain(); hg.gain.value = 0; h.connect(hf); hf.connect(hg); hg.connect(SND.bus); h.start();
  N.hum = hg;
}
function sndEnv(g, t0, a, peak, d) { g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d); }
function sndPanned(node, pan, verb) {
  const c = SND.ctx; let out = node;
  if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); node.connect(p); out = p; }
  out.connect(SND.bus);
  if (verb) { const s = c.createGain(); s.gain.value = verb; out.connect(s); s.connect(sndVerb()); }
}
/** 풀벌레 한 번 — 4~5kHz 짧은 떨림 3~4번 */
function sndChirp(C, vol) {
  const c = SND.ctx, t0 = c.currentTime + 0.02, n = 3 + (Math.random() < 0.4 ? 1 : 0);
  const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = C.f * (0.98 + Math.random() * 0.04);
  g.gain.value = 0; o.connect(g); sndPanned(g, C.pan, 0.05);
  for (let i = 0; i < n; i++) { const t = t0 + i * 0.045; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.linearRampToValueAtTime(0, t + 0.028); }
  o.start(t0); o.stop(t0 + n * 0.045 + 0.05);
}
/** 개구리 — 낮은 톱니를 30Hz 로 떨게 */
function sndFrog(vol, pan) {
  const c = SND.ctx, t0 = c.currentTime + 0.02, dur = 0.18 + Math.random() * 0.14;
  const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(150 + Math.random() * 40, t0); o.frequency.linearRampToValueAtTime(120, t0 + dur);
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 650; bp.Q.value = 3;
  const tr = c.createOscillator(), tg = c.createGain(); tr.frequency.value = 28; tg.gain.value = 0.5;
  const g = c.createGain(); sndEnv(g, t0, 0.02, vol, dur);
  const am = c.createGain(); am.gain.value = 0.5; tr.connect(tg); tg.connect(am.gain);
  o.connect(bp); bp.connect(am); am.connect(g); sndPanned(g, pan, 0.15);
  o.start(t0); tr.start(t0); o.stop(t0 + dur + 0.1); tr.stop(t0 + dur + 0.1);
}
/** 부엉이 — 멀리서 '우— 우우' */
function sndOwl(vol, pan) {
  const c = SND.ctx, t0 = c.currentTime + 0.05;
  for (const [dt, len, f] of [[0, 0.42, 390], [0.62, 0.22, 360], [0.9, 0.5, 340]]) {
    const o = c.createOscillator(), g = c.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(f * 1.04, t0 + dt); o.frequency.linearRampToValueAtTime(f, t0 + dt + len);
    sndEnv(g, t0 + dt, 0.08, vol, len); o.connect(g); sndPanned(g, pan, 0.5);
    o.start(t0 + dt); o.stop(t0 + dt + len + 0.2);
  }
}
/** 삐걱 — 낮은 톱니가 띠 거르기를 지나며 천천히 미끄러진다 */
function sndCreak(vol, pan) {
  const c = SND.ctx, t0 = c.currentTime + 0.02, dur = 0.5 + Math.random() * 0.5;
  const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(70 + Math.random() * 30, t0); o.frequency.linearRampToValueAtTime(110 + Math.random() * 50, t0 + dur);
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 6; bp.frequency.setValueAtTime(500, t0); bp.frequency.linearRampToValueAtTime(900, t0 + dur);
  const g = c.createGain(); sndEnv(g, t0, 0.15, vol, dur);
  o.connect(bp); bp.connect(g); sndPanned(g, pan, 0.8);
  o.start(t0); o.stop(t0 + dur + 0.3);
}
/** 지직 — 잡음 짧게 */
function sndCrackle(vol) {
  const c = SND.ctx; if (!c || !SND.on) return;
  const t0 = c.currentTime, n = Math.floor(c.sampleRate * 0.09), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (Math.random() < 0.15 ? 1 : 0.15) * (1 - i / n);
  const s = c.createBufferSource(); s.buffer = b;
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
  const g = c.createGain(); g.gain.value = vol; s.connect(hp); hp.connect(g); sndPanned(g, 0, 0.3); s.start(t0);
}
/** 정전 — 꺼질 때 '탁'(낮게 떨어지는 쿵 + 딸깍), 켜질 때 지지직 */
function sndBlack(on) {
  const c = SND.ctx; if (!c || !SND.on) return;
  hapt(on ? [18, 60, 18] : 70);                                        // v107 — 진동
  const t0 = c.currentTime;
  if (!on) {
    const o = c.createOscillator(), g = c.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(95, t0); o.frequency.exponentialRampToValueAtTime(38, t0 + 0.3);
    sndEnv(g, t0, 0.005, 0.5, 0.35); o.connect(g); sndPanned(g, 0, 0.7); o.start(t0); o.stop(t0 + 0.45);
    sndCrackle(0.25);
    if (SND.night) SND.night.hum.gain.setTargetAtTime(0, t0, 0.02);
  } else {
    sndCrackle(0.3); setTimeout(() => sndCrackle(0.22), 110); setTimeout(() => sndCrackle(0.15), 230);
  }
}
/** 지금 방 불빛이 뚝 떨어지거나 튀는 순간 — 지직 */
function sndFlickTick(room, k, last) {
  if (!SND.ctx || !SND.night || !room) return;
  if (Math.abs(k - last) > 0.3 && !NIGHT.black) sndCrackle(0.08 + Math.random() * 0.06);
}
function stepNightSound(dt, r, out, under) {
  const N = SND.night; if (!N) return;
  const c = SND.ctx, t = c.currentTime;
  // 웅웅거림 — 바깥은 조금, 실내는 더 낮게 · 천천히 부풀었다 가라앉는다
  N.drone.gain.setTargetAtTime(under ? 0 : (out ? 0.035 : 0.05) * (0.6 + 0.4 * Math.sin(M.t * 0.07)), t, 0.8);
  // 형광등 — 불안한 방에서만(떨릴 때 커진다)
  const fx = r && !out && NIGHT.fx ? NIGHT.fx[r.id] : null, k = r && !out && typeof roomFlick === 'function' ? roomFlick(r.id) : 1;
  N.hum.gain.setTargetAtTime(fx && fx.unstable && !NIGHT.black ? 0.006 + (1 - k) * 0.02 : 0, t, 0.05);
  if (under) return;
  // 풀벌레 — 바깥이면 크게, 실내면 벽 너머로 아주 작게
  let cv = out ? (r.terrain || r.mat === 'lawn' ? 0.03 : 0.018) : 0.003;
  // v115 — 물가에 다가가면 풀벌레가 하나씩 꺼진다(무대의 '문턱')
  if (out && r.terrain && typeof lakeDist === 'function') cv *= clamp((lakeDist(M.pos.x * CM, M.pos.z * CM) - 1.05) / 0.7, 0, 1);
  if (typeof SCORE !== 'undefined' && SCORE.hush > 0) cv *= 0.2;              // 무언가 오기 전엔 조용해진다
  for (const C of N.cr) { C.t -= dt; if (C.t <= 0) { C.t = 0.55 + Math.random() * 0.5 + (Math.random() < 0.1 ? 2.5 : 0); sndChirp(C, cv * (0.6 + Math.random() * 0.5)); } }
  // 개구리 — 호숫가
  if (typeof lakeDist === 'function') {
    const L = lakeDist(M.pos.x * CM, M.pos.z * CM);
    N.frogT -= dt;
    if (L < 1.8 && N.frogT <= 0) { N.frogT = 0.6 + Math.random() * 2.2; sndFrog(0.05 * clamp(1.9 - L, 0, 1), sndPan(HOLE.lake.x / CM, HOLE.lake.z / CM) + (Math.random() - 0.5) * 0.6); }
  }
  // 부엉이 — 바깥에서 가끔
  N.owlT -= dt;
  if (N.owlT <= 0) { N.owlT = 28 + Math.random() * 40; if (out) sndOwl(0.035, Math.random() * 2 - 1); }
  // 삐걱 — 실내에서 가끔
  N.creakT -= dt;
  if (N.creakT <= 0) { N.creakT = 16 + Math.random() * 30; if (!out) sndCreak(0.05, Math.random() * 2 - 1); }
}

/* ── 진동(v107) — 겁주는 순간에 폰이 떨린다. 소리를 끄면 함께 꺼진다 ───────────────── */
const HAPTIC = { ok: typeof navigator !== 'undefined' && 'vibrate' in navigator && matchMedia('(pointer: coarse)').matches, last: 0 };
function hapt(pattern) {
  if (!HAPTIC.ok || !SND.on) return;
  const now = performance.now(); if (now - HAPTIC.last < 120) return;
  HAPTIC.last = now;
  try { navigator.vibrate(pattern); } catch (e) { /* 막힌 기기 */ }
}
