/* ══════════════════════════════════════════════════════════
   밤의 음악 · 심장 소리 · 밤 시계 — 호러 8단계 (v106)
   ══════════════════════════════════════════════════════════
   모두 합성(받을 파일 없음). 소리가 꺼져 있으면(M 키) 함께 꺼진다.
     · 종소리 — 멀리서 울리는 유리 종(FM). 처음엔 드물고 맑다 → 밤이 깊을수록 잦아지고, 음정이 처지고, 어긋난 음이 섞인다
     · 현 — 밤이 3할쯤 깊어지면 낮은 현이 반음 차이로 부풀었다 가라앉는다
     · 침묵 — 무언가 나타나기 직전(sndSwell)엔 음악이 멎는다. 조용해지면 — 온다
     · 심장 — 그림자가 보이거나 가까울 때 · 정전 · 마지막 방송 뒤. 가까울수록 빨라진다
     · 밤 시계 — 오른쪽 위. 밤 11시 → 새벽 3시(마지막 방송). 결말 뒤 조용한 밤은 새벽 5시 */
const SCORE = { bellT: 6, padT: 40, beatT: 0, hush: 0, bpm: 0, clockEl: null };
const BELL_MINOR = [220, 261.63, 293.66, 329.63, 392, 440, 523.25];   // A 단조 5음 + 위
const BELL_BAD = [311.13, 466.16, 277.18];                              // 어긋난 음(D# · A# · C#)
const BELL_CALM = [261.63, 329.63, 392, 523.25, 659.25];               // 조용한 밤 — C 장조

function scoreBell(f, vol) {
  const c = SND.ctx; if (!c) return;
  const t0 = c.currentTime + 0.03, dur = 4.5;
  const car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain(), g = c.createGain();
  car.type = 'sine'; car.frequency.value = f;
  mod.type = 'sine'; mod.frequency.value = f * 3.5;
  mg.gain.setValueAtTime(f * 1.6, t0); mg.gain.exponentialRampToValueAtTime(f * 0.02, t0 + 1.4);
  mod.connect(mg); mg.connect(car.frequency);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  car.connect(g);
  sndPanned(g, Math.random() * 1.2 - 0.6, 0.9);
  car.start(t0); mod.start(t0); car.stop(t0 + dur + 0.1); mod.stop(t0 + dur + 0.1);
}
function scorePad(dr) {
  const c = SND.ctx; if (!c) return;
  const t0 = c.currentTime + 0.05, dur = 9, base = 110 * (1 - 0.03 * dr);
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(260, t0); lp.frequency.linearRampToValueAtTime(700, t0 + dur * 0.6); lp.frequency.linearRampToValueAtTime(240, t0 + dur);
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(0.02 + 0.02 * dr, t0 + dur * 0.55); g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
  lp.connect(g); sndPanned(g, 0, 0.6);
  for (const [m, dt] of [[1, -6], [1, 7], [Math.pow(2, 1 / 12), 0], [1.5, -3]]) {        // 근음 두 줄 · 반음 위 · 5도
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = base * m; o.detune.value = dt;
    o.connect(lp); o.start(t0); o.stop(t0 + dur + 0.1);
  }
}
/** 심장 한 번 — '쿵-쿵' */
function scoreBeat(vol) {
  const c = SND.ctx; if (!c) return;
  const t0 = c.currentTime + 0.02;
  for (const [dt, v] of [[0, 1], [0.16, 0.7]]) {
    const o = c.createOscillator(), g = c.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(62, t0 + dt); o.frequency.exponentialRampToValueAtTime(38, t0 + dt + 0.12);
    g.gain.setValueAtTime(0.0001, t0 + dt); g.gain.exponentialRampToValueAtTime(vol * v, t0 + dt + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.2);
    o.connect(g); g.connect(SND.bus); o.start(t0 + dt); o.stop(t0 + dt + 0.25);
  }
}
/** 나타나기 직전 — 음악을 멎게 한다(haunt.js sndSwell 이 부른다) */
function scoreHush(sec) { SCORE.hush = Math.max(SCORE.hush, sec); }

function scoreClock(dt) {
  if (!M.ready || M.attract || typeof HAUNT === 'undefined') return;
  let el = SCORE.clockEl;
  if (!el) { el = SCORE.clockEl = document.createElement('div'); el.className = 'night-clock'; document.getElementById('gal').appendChild(el); }
  let mins = HAUNT.calm ? 5 * 60 + 10 + Math.floor((HAUNT.t % 3600) / 60) : 23 * 60 + Math.floor(HAUNT.dread * 240);
  if (HAUNT.finale && !HAUNT.calm) mins = 27 * 60;                        // 새벽 3시 — 멈춘다
  const h = Math.floor(mins / 60) % 24, m = mins % 60;
  const txt = (h >= 12 ? '밤 ' + (h - 12 === 0 ? 12 : h - 12) : '새벽 ' + (h === 0 ? 12 : h)) + ':' + String(m).padStart(2, '0');
  if (el.textContent !== txt) el.textContent = txt;
  el.classList.toggle('late', !HAUNT.calm && HAUNT.dread > 0.75);
}
function stepScore(dt) {
  if (typeof NIGHT === 'undefined' || !NIGHT.on) return;
  scoreClock(dt);
  const c = SND.ctx;
  if (!c || !SND.on || !SND.night || M.attract || typeof HAUNT === 'undefined') return;
  const calm = HAUNT.calm, dr = calm ? 0 : HAUNT.dread, under = typeof LAKE !== 'undefined' && LAKE.under;
  const bgm = M.bgm ? 0.5 : 1;                                             // 관리자 배경음악이 돌면 한 발 물러난다
  if (SCORE.hush > 0) SCORE.hush -= dt;
  // 종소리
  SCORE.bellT -= dt;
  if (SCORE.bellT <= 0) {
    SCORE.bellT = calm ? 7 + Math.random() * 8 : (12 - 7 * dr) + Math.random() * (10 - 5 * dr);
    if (SCORE.hush <= 0 && !under && !(HAUNT.finale && HAUNT.finale.phase === 'end')) {
      let f;
      if (calm) f = pickOf(BELL_CALM);
      else { f = Math.random() < dr * 0.35 ? pickOf(BELL_BAD) : pickOf(BELL_MINOR); f *= Math.pow(2, -dr * 0.6 / 12) * (1 + (Math.random() - 0.5) * 0.004 * dr); }
      scoreBell(f, (calm ? 0.02 : 0.024 + 0.012 * dr) * bgm);
      if (!calm && dr > 0.6 && Math.random() < 0.4) setTimeout(() => scoreBell(f * Math.pow(2, 1 / 12), 0.018 * bgm), 380);   // 반음 겹쳐 — 불협
    }
  }
  // 현
  SCORE.padT -= dt;
  if (SCORE.padT <= 0) { SCORE.padT = 28 + Math.random() * 30; if (!calm && dr > 0.3 && SCORE.hush <= 0 && !under) scorePad(dr); }
  // 심장 — 그림자와의 거리 · 정전 · 마지막 방송
  let bpm = 0;
  if (!calm) {
    const S = HAUNT.shade;
    if (S && S.root.visible) { const d = Math.hypot(S.root.position.x - M.pos.x, S.root.position.z - M.pos.z); bpm = clamp(125 - d * 3, 72, 125); }
    if (NIGHT.black && !NIGHT.black.quick) bpm = Math.max(bpm, 96);
    if (HAUNT.finale && HAUNT.finale.phase !== 'done') bpm = Math.max(bpm, HAUNT.finale.phase === 'end' ? 130 : 78);
    if (HAUNT.ev) bpm = Math.max(bpm, 70);
    if (HAUNT.vaultLock > 0) bpm = Math.max(bpm, 104);                  // v108 — 잠긴 수장고
  }
  SCORE.bpm += (bpm - SCORE.bpm) * Math.min(1, dt * 1.5);
  if (SCORE.bpm > 55) {
    SCORE.beatT -= dt;
    if (SCORE.beatT <= 0) {
      SCORE.beatT = 60 / SCORE.bpm; scoreBeat(clamp((SCORE.bpm - 55) / 70, 0.15, 1) * 0.16);
      if (SCORE.bpm > 100 && typeof hapt === 'function') hapt([22, 140, 14]);          // v107 — 심장이 빨라지면 손에서도
    }
  } else SCORE.beatT = 0;
}
