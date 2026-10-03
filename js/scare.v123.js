/* ══════════════════════════════════════════════════════════
   놀래키기(v123) — 달려드는 것 · 천장의 것 · 돌아보면 바로 앞
   ══════════════════════════════════════════════════════════
   사용자: "중간중간 놀래키는 이벤트가 있던데 눈에 잘 안 띄어. 누가 갑자기 확 달려들다가 사라지는 건 어때?"
   잰 것: 놀래킴은 '빨리 돌아보면 35% 확률로 1.25m 앞에 0.4초' 하나뿐, 소리 0.14 · 5~7분에 한 번. 어두운 데서 검은 옷이 0.4초 — 못 보고 지나간다.
   → 크고 분명하게, 대신 드물게(한 번에 하나 · 사이 1분 반~2분):
     · 돌진 — 10m 앞 트인 데 서 있다(머리 끝까지 하얀 얼굴) → 고개가 두 번 꺾인다 → 팔을 뻗고 미친 속도로 달려든다
              얼굴이 화면을 덮는 순간 비명 · 화면 흔들림 · 암전 0.2초 · 지직 → 없다
     · 천장 — 머리 위에서 긁는 소리 → 올려다보면 천장에 거꾸로 붙어 있다 → 기어서 덮친다(같은 끝)
     · 돌아보기(haunt.js stepJump) — 0.75m 앞 · 60% · 같은 비명 · 2~4분
   밤에만. 대화창 · 골프 · 물속 · 전시물 창이 열려 있으면 하지 않는다. 폰은 진동까지 */
const SCARE = { cool: 75, ev: null, v: null, shake: 0, fx: null, n: 0 };

/** 그 사람 — 따로 한 벌(창백한 얼굴 · 검은 긴 머리 · 검은 옷) */
function scareBody() {
  if (SCARE.v) return SCARE.v;
  setTimeout(scareFaceURL, 50);
  if (typeof PEOPLE === 'undefined' || !PEOPLE.ok || !PEOPLE.byName || typeof buildRealVisitor !== 'function') return null;
  const name = PEOPLE.byName.p12 ? 'p12' : Object.keys(PEOPLE.byName)[0];
  const v = buildRealVisitor({ coat: '#09090B', pants: '#070708', hairC: '#050505', skin: '#EDE8E2', shoe: '#0A0A0A', h: 1.86 }, name);
  v.mesh.material.color.setRGB(0.95, 0.95, 0.98);
  v.mesh.material.emissive = new THREE.Color(0x1A1A1E);                       // 어둠 속에서도 하얀 얼굴 · 손이 읽히게
  if (typeof floodPatch === 'function') floodPatch(v.mesh.material);
  v.root.visible = false; M.scene.add(v.root);
  return (SCARE.v = v);
}
/** 비명 — 찢어지는 톱니파 둘(음이 치솟는다) + 목소리 대역 잡음 + 쿵 */
function scareScream(vol = 1) {
  const c = typeof SND !== 'undefined' && SND.ctx; if (!c || !SND.on) return;
  const t0 = c.currentTime + 0.005, out = c.createGain(); out.gain.value = 0.62 * vol;
  const sh = c.createWaveShaper(), curve = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * 3.2); } sh.curve = curve;
  sh.connect(out); sndPanned(out, 0, 0.5);
  for (const [f0, f1, d] of [[620, 1480, 0], [930, 2100, 12]]) {
    const o = c.createOscillator(), g = c.createGain(); o.type = 'sawtooth'; o.detune.value = d;
    o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + 0.16); o.frequency.linearRampToValueAtTime(f1 * 0.82, t0 + 0.9);
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 23; lg.gain.value = 60; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t0); lfo.stop(t0 + 1);
    sndEnv(g, t0, 0.012, 0.32, 0.95); o.connect(g); g.connect(sh); o.start(t0); o.stop(t0 + 1);
  }
  const N = Math.floor(c.sampleRate * 0.9), b = c.createBuffer(1, N, c.sampleRate), ch = b.getChannelData(0);
  for (let i = 0; i < N; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / N, 1.5);
  for (const f of [1100, 2600]) { const s = c.createBufferSource(); s.buffer = b; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 3; const g = c.createGain(); g.gain.value = 0.7; s.connect(bp); bp.connect(g); g.connect(sh); s.start(t0); }
  const o = c.createOscillator(), og = c.createGain(); o.frequency.setValueAtTime(90, t0); o.frequency.exponentialRampToValueAtTime(32, t0 + 0.5);
  sndEnv(og, t0, 0.004, 0.9 * vol, 0.55); o.connect(og); sndPanned(og, 0, 0.2); o.start(t0); o.stop(t0 + 0.6);
  if (typeof hapt === 'function') hapt([160, 40, 220]);
}
/** 다가오는 발 · 바람 — 달리는 동안 */
function scareRunSnd(xm, zm) {
  const c = typeof SND !== 'undefined' && SND.ctx; if (!c || !SND.on) return;
  const t0 = c.currentTime + 0.005, pan = typeof sndPan === 'function' ? sndPan(xm, zm) : 0;
  const N = Math.floor(c.sampleRate * 0.06), b = c.createBuffer(1, N, c.sampleRate), ch = b.getChannelData(0);
  for (let i = 0; i < N; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / N, 4);
  const s = c.createBufferSource(); s.buffer = b; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500;
  const g = c.createGain(); g.gain.value = 0.5; s.connect(lp); lp.connect(g); sndPanned(g, pan, 0.3); s.start(t0);
}
/** 긁는 소리(천장) */
function scareScratch(xm, zm) {
  const c = typeof SND !== 'undefined' && SND.ctx; if (!c || !SND.on) return;
  const t0 = c.currentTime + 0.005, pan = typeof sndPan === 'function' ? sndPan(xm, zm) : 0;
  for (let k = 0; k < 5; k++) {
    const N = Math.floor(c.sampleRate * 0.12), b = c.createBuffer(1, N, c.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < N; i++) ch[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / N);
    const s = c.createBufferSource(); s.buffer = b; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200 + Math.random() * 1500; bp.Q.value = 2;
    const g = c.createGain(); g.gain.value = 0.16; s.connect(bp); bp.connect(g); sndPanned(g, pan, 0.6); s.start(t0 + k * 0.17);
  }
}
/** 덮치는 순간 0.15초 — 화면 가득 일그러진 얼굴(캔버스로 그린다 · 한 번만)
    창백한 길쭉한 얼굴 · 텅 빈 검은 눈(아주 작은 흰 눈동자) · 세로로 찢어진 입 · 흘러내린 검은 눈물 · 얼굴을 가른 머리카락 · 거친 입자 */
function scareFaceURL() {
  if (SCARE.face) return SCARE.face;
  const W = 720, H = 900, cv = makeCanvas(W, H), c = cv.getContext('2d'), R = rnd(1313);
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  // 얼굴 — 길쭉하고 조금 기운 타원(가장자리로 갈수록 어둡다)
  c.save(); c.translate(W / 2 + 10, H / 2 + 20); c.rotate(-0.07);
  const fg = c.createRadialGradient(0, -40, 40, 0, 0, 330); fg.addColorStop(0, '#E6E0D8'); fg.addColorStop(0.55, '#B9B2A8'); fg.addColorStop(0.85, '#4A4642'); fg.addColorStop(1, '#000');
  c.fillStyle = fg; c.beginPath(); c.ellipse(0, 0, 250, 360, 0, 0, Math.PI * 2); c.fill();
  // 눈 — 크고 텅 빈 구멍 · 빨갛게 짓무른 테 · 아주 작은 흰 점
  for (const [ex, ey, rx, ry] of [[-102, -70, 64, 52], [98, -64, 70, 58]]) {
    const rg = c.createRadialGradient(ex, ey, 10, ex, ey, rx * 1.5); rg.addColorStop(0, 'rgba(90,10,10,.9)'); rg.addColorStop(1, 'rgba(90,10,10,0)');
    c.fillStyle = rg; c.beginPath(); c.ellipse(ex, ey, rx * 1.5, ry * 1.5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#020101'; c.beginPath(); c.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#F4F0E8'; c.beginPath(); c.arc(ex + (ex < 0 ? 6 : -4), ey + 4, 5, 0, Math.PI * 2); c.fill();
    // 검은 눈물 — 아래로 흘러내린다
    c.strokeStyle = 'rgba(8,4,4,.85)'; c.lineCap = 'round';
    for (let k = 0; k < 4; k++) { c.lineWidth = 3 + R() * 7; c.beginPath(); const sx = ex - rx * 0.5 + R() * rx; c.moveTo(sx, ey + ry * 0.7); c.bezierCurveTo(sx + (R() - 0.5) * 20, ey + 120, sx + (R() - 0.5) * 30, ey + 200, sx + (R() - 0.5) * 30, ey + 150 + R() * 200); c.stroke(); }
  }
  // 입 — 세로로 길게 찢어진 검은 구멍 · 위아래 잇몸빛
  const mg = c.createRadialGradient(0, 170, 10, 0, 170, 130); mg.addColorStop(0, '#000'); mg.addColorStop(0.75, '#0A0202'); mg.addColorStop(1, 'rgba(70,10,10,0)');
  c.fillStyle = mg; c.beginPath(); c.ellipse(0, 175, 70, 150, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#020000'; c.beginPath(); c.ellipse(0, 180, 52, 128, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(190,180,160,.55)'; for (let k = -3; k <= 3; k++) c.fillRect(k * 12 - 4, 60 + Math.abs(k) * 4, 8, 22 - Math.abs(k) * 2);
  // 갈라진 금
  c.strokeStyle = 'rgba(30,20,20,.55)'; c.lineWidth = 2;
  for (let k = 0; k < 9; k++) { let x = (R() - 0.5) * 360, y = (R() - 0.5) * 520; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 6; j++) { x += (R() - 0.5) * 50; y += (R() - 0.3) * 40; c.lineTo(x, y); } c.stroke(); }
  c.restore();
  // 머리카락 — 위에서 쏟아져 얼굴을 가른다(한쪽 눈을 반쯤 덮는다)
  c.strokeStyle = '#050404';
  for (let k = 0; k < 420; k++) {
    const x0 = W * 0.08 + R() * W * 0.84, side = x0 < W / 2 ? -1 : 1, edge = Math.abs(x0 - W / 2) > 150 || R() < 0.18;
    if (!edge) continue;
    c.lineWidth = 1 + R() * 3.5; c.globalAlpha = 0.5 + R() * 0.5;
    c.beginPath(); c.moveTo(x0, -20); c.bezierCurveTo(x0 + side * 30 * R(), H * 0.3, x0 - side * 40 * R(), H * 0.6, x0 + side * 60 * R(), H * (0.55 + R() * 0.5)); c.stroke();
  }
  c.globalAlpha = 1;
  // 입자 · 줄무늬(비디오 잡음)
  const im = c.getImageData(0, 0, W, H);
  for (let i = 0; i < im.data.length; i += 4) { const n = (Math.random() - 0.5) * 46; im.data[i] += n; im.data[i + 1] += n * 0.9; im.data[i + 2] += n * 0.9; }
  c.putImageData(im, 0, 0);
  c.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 1);
  return (SCARE.face = cv.toDataURL('image/jpeg', 0.82));
}
/** 화면 — 붉은 번쩍임 · 암전 */
function scareFx(kind) {
  let el = SCARE.fx;
  if (!el) { el = SCARE.fx = document.createElement('div'); el.className = 'scare-fx'; (document.getElementById('gal') || document.body).appendChild(el); }
  if (kind === 'hit') {
    let f = el.firstChild;
    if (!f) { f = document.createElement('i'); el.appendChild(f); }
    f.style.backgroundImage = 'url(' + scareFaceURL() + ')';
  }
  el.className = 'scare-fx'; void el.offsetWidth; el.className = 'scare-fx ' + kind;
}
/** 끝 — 얼굴이 화면을 덮는 순간: 비명 · 흔들림 · 암전 · 지직 · 사라짐 */
function scareHit(v, rec) {
  scareScream(1);
  SCARE.shake = 0.55;
  scareFx('hit');
  setTimeout(() => { v.root.visible = false; if (typeof hauntGlitch === 'function') hauntGlitch(); }, 140);
  if (typeof scoreHush === 'function') scoreHush(4);
  if (rec && typeof hauntRec === 'function') hauntRec(rec);
}
/** 뼈 — 클립을 돌리고 자세를 얹는다(acts.js 의 IK) */
function scarePose(v, yaw, dt, ts, pose) {
  if (typeof actRestore === 'function') actRestore(v);
  v.walk.timeScale = ts; v.mixer.update(dt);
  if (typeof actSnap === 'function') actSnap(v);
  if (pose && typeof actApply === 'function') { try { actApply({ v, yaw }, pose, 1); } catch (e) { /* 자세 없이 */ } }
}
const SCARE_REACH = { rh: [0.15, 0.86, 0.5], rp: [1, -0.5, -0.2], lh: [-0.15, 0.84, 0.5], lp: [-1, -0.5, -0.2], bend: 0.38, head: -0.3 };

/** 트인 바닥인지 — 나에게서 그 자리까지 25cm 간격으로 벽 · 바닥을 본다 */
function scareClear(x, z, maxD) {
  const PX = M.pos.x * CM, PZ = M.pos.z * CM, L = Math.hypot(x - PX, z - PZ);
  for (let s = 40; s < L; s += 25) {
    const qx = PX + (x - PX) * s / L, qz = PZ + (z - PZ) * s / L;
    const r = pickRoom(qx, qz, M.feet, 80); if (!r) return false;
    const f = floorAt(r, qx, qz); if (!(f === f) || Math.abs(f - (M.feet || 0)) > 60 || hitsWall(qx, qz, f)) return false;
    if (r.terrain && typeof lakeDist === 'function' && lakeDist(qx, qz) < 1.05) return false;
  }
  return L <= maxD;
}
const SCARE_EV = {
  rush() {
    const v = scareBody(); if (!v) return null;
    const f = { x: -Math.sin(M.yaw), z: -Math.cos(M.yaw) };
    let x = 0, z = 0, ok = false;
    for (let D = 1250; D >= 700 && !ok; D -= 100) {
      const a = (Math.random() - 0.5) * 0.25, dx = f.x * Math.cos(a) - f.z * Math.sin(a), dz = f.z * Math.cos(a) + f.x * Math.sin(a);
      x = M.pos.x * CM + dx * D; z = M.pos.z * CM + dz * D;
      ok = scareClear(x, z, 1300) && hauntView(x / CM, (M.feet || 0) / CM + 1.6, z / CM).on;
    }
    if (!ok) return null;
    const room = pickRoom(x, z, M.feet, 80), h = v.hM;
    v.root.visible = true; v.root.scale.setScalar(h);
    v.walk.setEffectiveWeight(0); v.idle.setEffectiveWeight(1);
    let t = 0, ph = 'stand', spd = 0, stepT = 0, yaw = Math.atan2(M.pos.x * CM - x, M.pos.z * CM - z);
    const place = () => { const r = pickRoom(x, z, M.feet, 120) || room, fy = r ? floorAt(r, x, z) : (M.feet || 0); v.root.position.set(x / CM, (fy === fy ? fy : M.feet || 0) / CM, z / CM); v.root.rotation.y = yaw; };
    place();
    if (typeof sndCrack === 'function') sndCrack(0.2);
    return { step(dt) {
      t += dt;
      const PX = M.pos.x * CM, PZ = M.pos.z * CM, d = Math.hypot(PX - x, PZ - z);
      yaw = Math.atan2(PX - x, PZ - z);
      if (ph === 'stand') {
        // 고개가 두 번 '뚝 · 뚝' — 그다음 달린다
        const snap = t > 0.35 && t < 0.9 ? (t < 0.6 ? 0.5 : -0.35) : 0;
        scarePose(v, yaw, dt, 1, { head: snap ? 0.15 : 0, bend: 0.05 });
        if (snap && !this.cr1) { this.cr1 = true; if (typeof sndCrack === 'function') sndCrack(0.28); }
        if (t > 0.6 && !this.cr2) { this.cr2 = true; if (typeof sndCrack === 'function') sndCrack(0.32); }
        if (v.mesh.skeleton) { const B = typeof npcBones === 'function' ? npcBones(v) : null; if (B && B.head && snap) boneRotWorld(B.head, new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw), snap); }
        if (t > 1.0) { ph = 'run'; v.idle.setEffectiveWeight(0); v.walk.setEffectiveWeight(1); if (typeof scoreHush === 'function') scoreHush(3); }
      } else if (ph === 'run') {
        spd = Math.min(15, spd + dt * 28);
        const st = Math.min(d - 40, spd * 100 * dt);
        x += (PX - x) / d * st; z += (PZ - z) / d * st;
        scarePose(v, yaw, dt, 3.6, SCARE_REACH);
        if (v.morph) { const mi = v.mesh.morphTargetInfluences; if (v.morph.talk != null) mi[v.morph.talk] = 1; if (v.morph.blink != null) mi[v.morph.blink] = 0; }
        stepT -= dt; if (stepT <= 0) { stepT = 0.13; scareRunSnd(x / CM, z / CM); }
        if (d < 80) {
          // 얼굴이 화면을 덮는다 — 눈높이 바로 앞
          ph = 'hit'; t = 0;
          const fx = -Math.sin(M.yaw), fz = -Math.cos(M.yaw);
          x = PX + fx * 46; z = PZ + fz * 46;
          v.root.position.set(x / CM, M.cam.position.y - h * 0.905, z / CM);   // 눈이 화면 한가운데 v.root.rotation.y = Math.atan2(-fx, -fz);
          scareHit(v, 'rush');
          return true;
        }
      } else { return t < 0.4; }
      place();
      if (t > 6) { v.root.visible = false; return false; }
      return true;
    } };
  },
  ceiling() {
    const R = M.room; if (!R || R.outdoor || !R.h || R.h > 700) return null;
    const v = scareBody(); if (!v) return null;
    const f = { x: -Math.sin(M.yaw), z: -Math.cos(M.yaw) };
    let x = 0, z = 0, ok = false;
    for (let D = 650; D >= 350 && !ok; D -= 50) { x = M.pos.x * CM + f.x * D; z = M.pos.z * CM + f.z * D; ok = inRect(R, x, z) && !hitsWall(x, z, R.y0) && scareClear(x, z, 700); }
    if (!ok) return null;
    const h = v.hM, top = (R.y0 + R.h) / CM;
    v.walk.setEffectiveWeight(1); v.idle.setEffectiveWeight(0);
    v.root.visible = true; v.root.scale.setScalar(h);
    let t = 0, seen = 0, ph = 'wait', yaw = Math.atan2(M.pos.x * CM - x, M.pos.z * CM - z);
    scareScratch(x / CM, z / CM);
    const place = () => { v.root.position.set(x / CM, top, z / CM); v.root.rotation.set(0, yaw, Math.PI); };      // 거꾸로 — 천장을 딛고 선다
    place();
    return { step(dt) {
      t += dt;
      const PX = M.pos.x * CM, PZ = M.pos.z * CM, d = Math.hypot(PX - x, PZ - z);
      yaw = Math.atan2(PX - x, PZ - z);
      if (ph === 'wait') {
        scarePose(v, yaw, dt, 0.25, SCARE_REACH);
        if (hauntView(x / CM, top - 0.9, z / CM).on && M.pitch > 0.12) seen += dt;
        if (t > 3 && t % 3 < dt) scareScratch(x / CM, z / CM);
        if (seen > 0.35) { ph = 'run'; if (typeof sndCrack === 'function') sndCrack(0.3); }
        if (t > 14 || (M.room && M.room.id !== R.id && M.room.part !== R.id)) { v.root.visible = false; v.root.rotation.set(0, 0, 0); return false; }
      } else if (ph === 'run') {
        const st = Math.min(d - 40, 900 * dt);
        x += (PX - x) / d * st; z += (PZ - z) / d * st;
        scarePose(v, yaw, dt, 4.2, SCARE_REACH);
        if (d < 120) {
          ph = 'hit'; t = 0;
          v.root.rotation.set(0, 0, 0);
          const fx = -Math.sin(M.yaw), fz = -Math.cos(M.yaw);
          x = PX + fx * 46; z = PZ + fz * 46;
          v.root.position.set(x / CM, M.cam.position.y - h * 0.905, z / CM);   // 눈이 화면 한가운데 v.root.rotation.y = Math.atan2(-fx, -fz);
          scareHit(v, 'ceiling');
          return true;
        }
      } else return t < 0.4;
      place();
      return true;
    } };
  },
};
/** 매 프레임 — 밤에만 · 한 번에 하나 */
function stepScare(dt) {
  // 화면 흔들림 — 카메라만(시선 값은 그대로)
  if (SCARE.shake > 0) { SCARE.shake -= dt; const a = Math.min(1, SCARE.shake * 2) * 0.045; M.cam.rotation.x += (Math.random() - 0.5) * a; M.cam.rotation.y += (Math.random() - 0.5) * a; M.cam.rotation.z += (Math.random() - 0.5) * a * 0.6; }
  if (SCARE.ev) { let keep = false; try { keep = SCARE.ev.step(dt); } catch (e) { keep = false; } if (!keep) { SCARE.ev = null; if (SCARE.v) { SCARE.v.root.visible = false; SCARE.v.root.rotation.set(0, 0, 0); } } return; }
  if (typeof NIGHT === 'undefined' || !NIGHT.on || !M.entered) return;
  SCARE.cool -= dt;
  if (SCARE.cool > 0 || M.openId || (typeof DLG !== 'undefined' && DLG.open) || (typeof GOLF !== 'undefined' && GOLF.mode)
    || (typeof LAKE !== 'undefined' && LAKE.under) || (typeof HAUNT !== 'undefined' && (HAUNT.ev || HAUNT.calm)) || (typeof HOR !== 'undefined' && HOR.ev)
    || (typeof CART !== 'undefined' && CART.driving)) return;
  if (Math.random() > dt / 6) return;
  const R = M.room; if (!R) return;
  const order = !R.outdoor && R.h && R.h <= 700 && Math.random() < 0.4 ? ['ceiling', 'rush'] : ['rush', 'ceiling'];
  for (const id of order) {
    const e = SCARE_EV[id]();
    if (e) { SCARE.ev = e; SCARE.n++; SCARE.cool = 95 + Math.random() * 60; return; }
  }
  SCARE.cool = 4;                                                    // 자리가 안 맞았다 — 조금 뒤에 다시
}
