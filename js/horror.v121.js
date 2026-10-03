/* ══════════════════════════════════════════════════════════
   호수 · 유리창의 것들 (v121)
   ══════════════════════════════════════════════════════════
   사용자: "해저드 쪽 위에 서 있는 사람이 그냥 전부야?", "여러 방면으로 공포스러운 요소를 많이 넣어 줘".
   호수(밤) — 물가에 서 있을 때만:
     · 손   — 내가 보는 물 위로 하얀 손들이 하나씩 올라온다(손가락이 천천히 오므렸다 펴진다). 손전등을 대면 가라앉는다
     · 반사 — 물가에서 수면을 내려다보고 있으면 물에 내 뒤에 선 사람이 비친다. 돌아보면 아무도 없다
     · 발자국 — 물에서 나온 젖은 발자국이 한 걸음씩 나에게 온다. 마지막 걸음은 바로 등 뒤
     · 머리 — 호수 한가운데 눈까지만 내놓은 머리. 보고 있으면 가만있고, 눈을 돌리면 조금 가까워져 있다
   실내(밤) — 바깥에 면한 유리창에 손바닥 자국이 '탁, 탁' 찍히며 나를 따라온다(안쪽에서 보이게 김 서린 자국)
   ※ 조명은 늘리지 않는다(조명 수 고정). 사람 모델은 buildRealVisitor(p12 — 그 사람) */
const HOR = { cool: { hands: 40, refl: 25, prints: 90, head: 70, win: 120 }, ev: null, head: null, refl: null, t: 0 };
const HOR_REC = [['hands', '물 위의 손', '밤의 호숫가에서 수면을 보고 있으면'], ['reflection', '수면에 비친 것', '물가에서 수면을 내려다보면'],
  ['wetprints', '물에서 나온 발자국', '호숫가에 오래 서 있으면'], ['lakehead', '호수 한가운데', '밤의 호수를 멀리서 보면'], ['glassprints', '유리창의 손자국', '밤, 바깥에 면한 방에서']];

/* ── 소리 ── */
function horSnd(kind, xm, zm, vol = 1) {
  const c = typeof SND !== 'undefined' && SND.ctx; if (!c || !SND.on) return;
  const d = xm == null ? 0 : Math.hypot(xm - M.pos.x, zm - M.pos.z), far = kind === 'knock' ? 22 : 30;
  if (d > far) return;
  const k = vol * clamp(1 - d / far, 0.05, 1), pan = xm == null ? 0 : (typeof sndPan === 'function' ? sndPan(xm, zm) : 0), t0 = c.currentTime + 0.01;
  const noise = (len, f, q, g0, type, at, curve = 3) => {
    const N = Math.floor(c.sampleRate * len), b = c.createBuffer(1, N, c.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < N; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / N, curve);
    const s = c.createBufferSource(); s.buffer = b; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const g = c.createGain(); g.gain.value = g0 * k; s.connect(fl); fl.connect(g); sndPanned(g, pan, 0.35); s.start(at);
  };
  if (kind === 'splash') { noise(0.7, 700, 0.7, 0.32, 'lowpass', t0, 2); noise(0.35, 2400, 1.2, 0.08, 'bandpass', t0 + 0.05); }
  else if (kind === 'slosh') noise(1.2, 420, 0.6, 0.18, 'lowpass', t0, 1.4);
  else if (kind === 'wet') { noise(0.12, 900, 1.4, 0.22, 'bandpass', t0, 4); noise(0.08, 300, 1, 0.16, 'lowpass', t0 + 0.03, 4); }
  else if (kind === 'knock') {
    noise(0.07, 1200, 1.5, 0.5, 'bandpass', t0, 5);
    const o = c.createOscillator(), og = c.createGain(); o.frequency.setValueAtTime(240, t0); o.frequency.exponentialRampToValueAtTime(150, t0 + 0.12);
    sndEnv(og, t0, 0.002, 0.22 * k, 0.16); o.connect(og); sndPanned(og, pan, 0.4); o.start(t0); o.stop(t0 + 0.2);
  } else if (kind === 'drip') {
    const o = c.createOscillator(), og = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(1500, t0); o.frequency.exponentialRampToValueAtTime(520, t0 + 0.07);
    sndEnv(og, t0, 0.002, 0.16 * k, 0.1); o.connect(og); sndPanned(og, pan, 0.6); o.start(t0); o.stop(t0 + 0.14);
  }
}
/* ── 손 — 손바닥 · 손가락 넷 · 엄지 · 팔뚝(창백하고 젖은) ── */
function horHandMat() {
  if (HOR.handMat) return HOR.handMat;
  const m = new THREE.MeshStandardMaterial({ color: 0xD6D0C6, roughness: 0.34, metalness: 0, emissive: 0x15171A });
  if (typeof floodPatch === 'function') floodPatch(m);
  return (HOR.handMat = m);
}
function horHand() {
  const g = new THREE.Group(), m = horHandMat();
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.036, 0.6, 10), m); arm.position.y = -0.3; g.add(arm);
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.1, 0.026), m); palm.position.y = 0.05; g.add(palm);
  const fingers = [];
  for (let i = 0; i < 4; i++) {
    const L = [0.07, 0.08, 0.076, 0.062][i];
    const f = new THREE.Group(); f.position.set(-0.03 + i * 0.02, 0.1, 0);
    const s = new THREE.Mesh(new THREE.CapsuleGeometry(0.0085, L, 3, 6), m); s.position.y = L / 2; f.add(s);
    f.rotation.z = (i - 1.5) * 0.12; g.add(f); fingers.push(f);
  }
  const th = new THREE.Group(); th.position.set(0.045, 0.04, 0.004);
  const ts = new THREE.Mesh(new THREE.CapsuleGeometry(0.01, 0.05, 3, 6), m); ts.position.y = 0.03; th.add(ts); th.rotation.z = -0.9; g.add(th);
  g.userData.fingers = fingers;
  return g;
}
/** 지금 보는 쪽 물 위의 점들(나에게서 dmin~dmax m) */
function horWaterSpots(n, dmin, dmax) {
  const out = [], W = HOLE.WATER;
  for (let k = 0; k < n * 12 && out.length < n; k++) {
    const a = M.yaw + Math.PI + (Math.random() - 0.5) * 1.0, d = dmin + Math.random() * (dmax - dmin);
    const x = M.pos.x + Math.sin(a) * d, z = M.pos.z + Math.cos(a) * d;
    if (lakeDist(x * CM, z * CM) > 0.97 || terrainRender(x * CM, z * CM) > HOLE.WATER - 25) continue;   // 물가 경사면(지형이 수면 위)은 뺀다
    if (out.some((p) => Math.hypot(p.x - x, p.z - z) < 0.9)) continue;
    if (!hauntView(x, W / CM + 0.3, z).on) continue;
    out.push({ x, z });
  }
  return out;
}
const HOR_EV = {
  hands() {
    const S = horWaterSpots(6 + Math.floor(Math.random() * 4), 2, 14);
    if (S.length < 3) return null;
    const g = M.roomGroups.field || M.scene, W = HOLE.WATER / CM;
    const H = S.map((p, i) => { const h = horHand(); h.scale.setScalar(1.7 + Math.random() * 0.3); h.position.set(p.x, W - 0.7, p.z); h.rotation.y = Math.random() * 6.28; h.rotation.x = (Math.random() - 0.5) * 0.3; g.add(h); return { h, p, d: i * 0.32 + Math.random() * 0.2, k: 0, sunk: false }; });
    horSnd('slosh', S[0].x, S[0].z, 0.8);
    if (typeof scoreHush === 'function') scoreHush(8);
    let t = 0, seen = false;
    return { step(dt) {
      t += dt; let alive = 0;
      for (const o of H) {
        const u = t - o.d; if (u < 0) { alive++; continue; }
        if (!o.up && u >= 0) { o.up = true; lakeRipple(o.p.x, o.p.z, 0.6, 0.5); horSnd('drip', o.p.x, o.p.z, 0.7); }
        const lit = typeof torchSees === 'function' && torchSees(new THREE.Vector3(o.p.x, W - 1.3, o.p.z));
        if (lit || u > 4.2) o.sunk = true;
        o.k = o.sunk ? Math.max(-0.1, o.k - dt * (lit ? 2.6 : 0.9)) : Math.min(1, o.k + dt * 0.75);
        const e = o.k * o.k * (3 - 2 * o.k);
        o.h.position.y = W - 0.9 + e * 1.45;
        // 손가락 — 천천히 오므렸다 편다
        const curl = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin((t + o.d) * 1.3));
        for (const f of o.h.userData.fingers) f.rotation.x = curl;
        if (o.sunk && o.k <= -0.05) { if (!o.gone) { o.gone = true; lakeRipple(o.p.x, o.p.z, 0.8, 0.35); o.h.parent && o.h.parent.remove(o.h); } }
        else alive++;
        if (o.k > 0.6 && hauntView(o.p.x, W + 0.2, o.p.z).on) seen = true;
      }
      if (seen && typeof hauntRec === 'function') hauntRec('hands');
      return alive > 0 && t < 12;
    } };
  },
  reflection() {
    // 수면을 내려다보는 자리 — 카메라 시선이 물에 닿는 곳(4m 안)
    const W = HOLE.WATER / CM, c = M.cam.position, f = new THREE.Vector3(0, 0, -1).applyQuaternion(M.cam.quaternion);
    if (f.y > -0.15) return null;
    const s = (W - c.y) / f.y; if (!(s > 0) || s > 18) return null;
    const px = c.x + f.x * s, pz = c.z + f.z * s;
    if (lakeDist(px * CM, pz * CM) > 0.96 || terrainRender(px * CM, pz * CM) > HOLE.WATER - 20) return null;
    let v = HOR.refl;
    if (!v) {
      if (typeof buildRealVisitor !== 'function' || !PEOPLE.byName || !PEOPLE.byName.p12) return null;
      v = HOR.refl = buildRealVisitor({ coat: '#09090B', pants: '#070708', hairC: '#050505', skin: '#E4DFDA', shoe: '#0A0A0A', h: 1.85 }, 'p12');
      v.idle.setEffectiveWeight(1); v.walk.setEffectiveWeight(0); v.mixer.update(1.3);
      const m = v.mesh.material; m.transparent = true; m.depthTest = false; m.depthWrite = false; m.opacity = 0; m.color.setRGB(0.42, 0.44, 0.46);
      v.mesh.renderOrder = 20; (M.roomGroups.field || M.scene).add(v.root);
    }
    // 물에 비친 모습 — 거꾸로(발이 수면에 닿고 머리가 아래로). 내 등 뒤 1m 에 선 사람의 반사 자리 = 내 앞 수면
    const h = v.hM;
    v.root.visible = true; v.root.scale.set(h, -h, h);
    v.root.position.set(px + f.x * 0.6, W - 0.01, pz + f.z * 0.6);
    v.root.rotation.y = M.yaw;                                              // 나와 같은 쪽을 본다(등 뒤에 선 사람)
    const yaw0 = M.yaw; let t = 0, gone = false;
    return { step(dt) {
      t += dt;
      const m = v.mesh.material, turned = Math.abs(npcAng(M.yaw - yaw0)) > 1.9, up = M.pitch > -0.2;
      if (turned && !gone) {
        gone = true; m.opacity = 0; v.root.visible = false;
        if (typeof sndStinger === 'function') sndStinger(0.05);
        horSnd('drip', M.pos.x - Math.sin(M.yaw) * -1, M.pos.z - Math.cos(M.yaw) * -1, 1);
        if (typeof hauntRec === 'function') hauntRec('reflection');
        return false;
      }
      if (up || t > 9) { m.opacity = Math.max(0, m.opacity - dt * 1.5); if (m.opacity <= 0) { v.root.visible = false; return false; } return true; }
      m.opacity = Math.min(0.5, m.opacity + dt * 0.35);
      if (t > 2 && !this.told) { this.told = true; if (typeof hauntRec === 'function') hauntRec('reflection'); }
      return true;
    } };
  },
  prints() {
    // 물가에서 시작해 나에게(마지막 걸음은 등 뒤 1.2m)
    const PX = M.pos.x, PZ = M.pos.z;
    let sx = 0, sz = 0, ok = false;
    for (let k = 0; k < 80 && !ok; k++) {
      const a = Math.random() * 6.28, d = 6 + Math.random() * 9;
      sx = PX + Math.sin(a) * d; sz = PZ + Math.cos(a) * d;
      const ld = lakeDist(sx * CM, sz * CM), th = terrainRender(sx * CM, sz * CM);
      ok = ld > 0.93 && ld < 1.12 && th > HOLE.WATER - 10 && th < HOLE.WATER + 60;     // 물이 막 끝나는 물가
    }
    if (!ok) return null;
    if (!HOR.printTex) {
      const cv = makeCanvas(64, 128), c = cv.getContext('2d');
      c.fillStyle = 'rgba(0,0,0,.85)'; c.filter = 'blur(2px)';
      c.beginPath(); c.ellipse(32, 46, 16, 30, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(32, 100, 12, 17, 0, 0, Math.PI * 2); c.fill();
      for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(18 + i * 7, 12 + Math.abs(i - 1.5) * 2, 4, 5, 0, 0, Math.PI * 2); c.fill(); }
      HOR.printTex = new THREE.CanvasTexture(cv);
    }
    const g = M.roomGroups.field || M.scene, geo = new THREE.PlaneGeometry(0.12, 0.26); geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ map: HOR.printTex, transparent: true, opacity: 0.6, depthWrite: false, color: 0x0A0D0B });
    const meshes = []; let i = 0, t = 0, done = false;
    return { step(dt) {
      t += dt;
      const ex = M.pos.x + Math.sin(M.yaw) * 1.2, ez = M.pos.z + Math.cos(M.yaw) * 1.2;   // 등 뒤 1.2m(앞 = −sin · −cos)
      const tx = done ? 0 : ex - sx, tz = done ? 0 : ez - sz, L = Math.hypot(tx, tz);
      if (!done && t > 0.62) {
        t = 0;
        if (L < 0.5 || i > 40) {
          done = true; horSnd('drip', ex, ez, 1.2); if (typeof sndStinger === 'function') sndStinger(0.035);
          if (typeof hauntRec === 'function') hauntRec('wetprints');
          return true;
        }
        const ux = tx / L, uz = tz / L, side = i % 2 ? 1 : -1;
        sx += ux * 0.42; sz += uz * 0.42;
        const x = sx - uz * side * 0.1, z = sz + ux * side * 0.1;
        const m = new THREE.Mesh(geo, mat); m.position.set(x, terrainRender(x * CM, z * CM) / CM + 0.012, z); m.rotation.y = Math.atan2(ux, uz); m.renderOrder = 3;
        g.add(m); meshes.push(m); i++;
        horSnd('wet', x, z, 0.9);
      }
      if (done) { mat.opacity = Math.max(0, mat.opacity - dt * 0.02); if (mat.opacity <= 0) { for (const m of meshes) m.parent && m.parent.remove(m); return false; } }
      return true;
    } };
  },
  head() {
    // 호수 한가운데 — 나에게서 15~35m, 화면 안
    let px = 0, pz = 0, ok = false;
    for (let k = 0; k < 30 && !ok; k++) {
      const a = M.yaw + Math.PI + (Math.random() - 0.5) * 0.8, d = 15 + Math.random() * 20;
      px = M.pos.x + Math.sin(a) * d; pz = M.pos.z + Math.cos(a) * d;
      ok = lakeDist(px * CM, pz * CM) < 0.75 && hauntView(px, HOLE.WATER / CM + 0.2, pz).on;
    }
    if (!ok) return null;
    let v = HOR.head;
    if (!v) {
      if (typeof buildRealVisitor !== 'function' || !PEOPLE.byName || !PEOPLE.byName.p12) return null;
      v = HOR.head = buildRealVisitor({ coat: '#09090B', pants: '#070708', hairC: '#050505', skin: '#E4DFDA', shoe: '#0A0A0A', h: 1.8 }, 'p12');
      v.idle.setEffectiveWeight(1); v.walk.setEffectiveWeight(0); v.mixer.update(1.3);
      v.mesh.material.color.setRGB(0.86, 0.86, 0.9);
      if (typeof floodPatch === 'function') floodPatch(v.mesh.material);
      (M.roomGroups.field || M.scene).add(v.root);
    }
    const W = HOLE.WATER / CM, h = v.hM;
    v.root.visible = true; v.root.scale.setScalar(h);
    let y = -0.95, t = 0, away = 0, sink = false;
    lakeRipple(px, pz, 1.2, 0.4);
    return { step(dt) {
      t += dt;
      const d = Math.hypot(px - M.pos.x, pz - M.pos.z), view = hauntView(px, W + 0.1, pz).on;
      const lit = typeof torchSees === 'function' && torchSees(new THREE.Vector3(px, W - 1.3, pz), 40);
      if (lit || d < 7 || t > 90) sink = true;
      // 보는 동안엔 가만있다 · 눈을 돌리면 조금씩 다가온다
      if (!view && !sink) { away += dt; const ux = (M.pos.x - px) / d, uz = (M.pos.z - pz) / d; const nx = px + ux * dt * 0.9, nz = pz + uz * dt * 0.9; if (lakeDist(nx * CM, nz * CM) < 0.9) { px = nx; pz = nz; } }
      y = sink ? y - dt * 0.5 : Math.min(-0.88, y + dt * 0.12);
      v.root.position.set(px, W + y * h, pz);
      v.root.rotation.y = Math.atan2(M.pos.x - px, M.pos.z - pz);
      if (view && t > 1.5 && !this.rec) { this.rec = true; if (typeof hauntRec === 'function') hauntRec('lakehead'); }
      if (sink && y < -1.15) { v.root.visible = false; lakeRipple(px, pz, 1.0, 0.35); return false; }
      return true;
    } };
  },
  win() {
    // 지금 방의 바깥 유리창 — 손바닥 자국이 '탁, 탁' 찍히며 따라온다
    const R = M.room; if (!R || R.outdoor) return null;
    const mine = (q) => q && (q.id === R.id || q.part === R.id || R.part === q.id || (R.part && q.part === R.part));
    const C = (M.cells || []).filter((c) => (c.type === 'window' || c.type === 'glass') && c.neg && c.pos && ((mine(c.neg) && c.pos.outdoor) || (mine(c.pos) && c.neg.outdoor)) && c.a1 - c.a0 > 160);
    if (!C.length) return null;
    const c = pickOf(C), inNeg = mine(c.neg), g = M.roomGroups[(inNeg ? c.neg : c.pos).id] || M.scene;
    if (!HOR.palmTex) {
      const cv = makeCanvas(96, 128), x = cv.getContext('2d');
      x.fillStyle = 'rgba(214,220,224,.9)'; x.filter = 'blur(1.6px)';
      x.beginPath(); x.ellipse(48, 84, 26, 30, 0, 0, Math.PI * 2); x.fill();
      [[22, 40, -0.3], [38, 26, -0.1], [55, 24, 0.05], [70, 34, 0.25]].forEach(([fx, fy, r]) => { x.save(); x.translate(fx, fy); x.rotate(r); x.beginPath(); x.ellipse(0, 0, 7, 20, 0, 0, Math.PI * 2); x.fill(); x.restore(); });
      x.save(); x.translate(80, 78); x.rotate(0.9); x.beginPath(); x.ellipse(0, 0, 7, 17, 0, 0, Math.PI * 2); x.fill(); x.restore();
      x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 160; i++) { x.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.5) + ')'; x.fillRect(Math.random() * 96, Math.random() * 128, 2, 2); }
      HOR.palmTex = new THREE.CanvasTexture(cv);
    }
    const geo = new THREE.PlaneGeometry(0.17, 0.23), mat = new THREE.MeshBasicMaterial({ map: HOR.palmTex, transparent: true, opacity: 0.5, depthWrite: false, color: 0xC8CED2 });
    const dir = Math.random() < 0.5 ? 1 : -1, n = 6 + Math.floor(Math.random() * 5), base = (inNeg ? c.neg : c.pos).y0 || 0;
    let a = dir > 0 ? c.a0 + 60 : c.a1 - 60, i = 0, t = 0;
    const off = inNeg ? -1.5 : 1.5, meshes = [];
    if (typeof scoreHush === 'function') scoreHush(6);
    return { step(dt) {
      t += dt;
      if (i < n && t > (i === 0 ? 0.3 : 0.55 + Math.random() * 0.25)) {
        t = 0;
        const y = (base + 115 + Math.random() * 55) / CM, m = new THREE.Mesh(geo, mat);
        m.scale.x = i % 2 ? -1 : 1;
        if (c.ax === 'v') { m.position.set((c.coord + off) / CM, y, a / CM); m.rotation.y = inNeg ? -Math.PI / 2 : Math.PI / 2; }
        else { m.position.set(a / CM, y, (c.coord + off) / CM); m.rotation.y = inNeg ? Math.PI : 0; }
        m.rotation.z = (Math.random() - 0.5) * 0.4; m.renderOrder = 5; g.add(m); meshes.push(m);
        const wx = m.position.x, wz = m.position.z;
        horSnd('knock', wx, wz, 1);
        if (i === 2 && typeof hauntRec === 'function') hauntRec('glassprints');
        a += dir * (35 + Math.random() * 25); i++;
        if (a < c.a0 + 40 || a > c.a1 - 40) i = n;
      }
      if (i >= n) { this.k = (this.k || 0) + dt; if (this.k > 2) { mat.opacity = Math.max(0, mat.opacity - dt * 0.03); if (mat.opacity <= 0) { for (const m of meshes) m.parent && m.parent.remove(m); return false; } } }
      return i < n || mat.opacity > 0;
    } };
  },
};
/** 매 프레임 — 밤에만. 다른 현상이 진행 중이면 기다린다 */
function stepHorror(dt) {
  if (typeof NIGHT === 'undefined' || !NIGHT.on || !M.entered || typeof HOLE === 'undefined') return;
  HOR.t += dt;
  for (const k in HOR.cool) HOR.cool[k] -= dt;
  if (HOR.ev) { let keep = false; try { keep = HOR.ev.step(dt); } catch (e) { keep = false; } if (!keep) HOR.ev = null; return; }
  if (M.openId || (typeof GOLF !== 'undefined' && GOLF.mode) || (typeof LAKE !== 'undefined' && LAKE.under) || (typeof HAUNT !== 'undefined' && HAUNT.ev) || (typeof DLG !== 'undefined' && DLG.open)) return;
  const R = M.room; if (!R) return;
  const PX = M.pos.x * CM, PZ = M.pos.z * CM, dr = typeof HAUNT !== 'undefined' ? HAUNT.dread : 0.3;
  const start = (id, cd) => { const e = HOR_EV[id](); if (e) { HOR.ev = e; HOR.cool[id] = cd; } else HOR.cool[id] = 5; };
  if (R.outdoor) {
    const ld = lakeDist(PX, PZ);
    const ax = PX - Math.sin(M.yaw) * 600, az = PZ - Math.cos(M.yaw) * 600, facing = lakeDist(ax, az) < 1.0;
    if (ld > 0.99 && ld < 1.5) {
      if (HOR.cool.refl <= 0 && ld < 1.6 && M.pitch < -0.18 && Math.random() < dt / 1.5) { start('reflection', 200 + Math.random() * 120); return; }
      if (HOR.cool.hands <= 0 && facing && Math.random() < dt / (8 - 4 * dr)) { start('hands', 110 + Math.random() * 80); return; }
      if (HOR.cool.prints <= 0 && Math.random() < dt / 25) { start('prints', 200 + Math.random() * 120); return; }
    }
    if (HOR.cool.head <= 0 && ld > 1.0 && ld < 3.2 && facing && Math.random() < dt / 12) { start('head', 160 + Math.random() * 120); return; }
  } else if (HOR.cool.win <= 0 && Math.random() < dt / (60 - 30 * dr)) start('win', 180 + Math.random() * 120);
}
