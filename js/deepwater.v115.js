/* ══════════════════════════════════════════════════════════
   밤의 호수 — 물속을 무대로 다시(v115)
   ══════════════════════════════════════════════════════════
   회의(무대 설계자 · 감독)에서 정한 동선 — "경계를 넘는 순간을 가장 크게":
     ① 물가에 다가가면 풀벌레가 가까운 것부터 꺼진다(sound.js)
     ② 발을 들이면 화면 아래에 수면선이 차오른다(깊이만큼)
     ③ 잠기는 순간 — 화면이 한 번 출렁 · 땅 위 소리가 끊기고 먹먹한 저음 · 귀 압박 · 가까운 심장
     ④ 물속 — 녹갈색, 3~4m 앞도 안 보인다. 검고 긴 머리카락이 천천히 떠다니고, 이름 칸이 번진 스코어카드가 가라앉아 있다
     ⑤ 바닥 — 등을 돌린 채 서 있는 그 사람. 다가가면 같은 거리만큼 물러난다. 얼굴은 끝까지 보여 주지 않는다
     ⑥ 올려다보면 — 둑 위에 사람들이 줄지어 서서 내려다본다(물 밖으로 나오면 아무도 없다)
     ⑦ 숨 — 20초가 넘으면 화면 가장자리가 어두워지고, 40초면 정신을 잃고 물가로 떠밀려 나온다
     ⑧ 나오면 — 물가에서 전시관 쪽으로 젖은 발자국. 내 것보다 한 줄 더 많다
   밤에만. 낮의 호수는 예전 그대로 */
const DEEP = { built: false, air: 0, underT: 0, hair: null, cards: null, watchers: [], woman: null, prints: 0, wadeEl: null, told: false };
const deepNight = () => typeof NIGHT !== 'undefined' && NIGHT.on;

function deepBuild() {
  if (DEEP.built) return;
  DEEP.built = true;
  const g = M.roomGroups.field; if (!g) return;
  const R = rnd(9393), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3(), col = new THREE.Color();
  const inLake = (L) => { for (let k = 0; k < 200; k++) { const x = HOLE.lake.x + (R() * 2 - 1) * HOLE.lake.rx, z = HOLE.lake.z + (R() * 2 - 1) * HOLE.lake.rz; if (lakeDist(x, z) < L) return [x, z]; } return [HOLE.lake.x, HOLE.lake.z]; };
  // 머리카락 — 아주 가늘고 긴 검은 띠, 끝이 가늘다. 물 흐름에 천천히 흔들린다
  const strand = new THREE.PlaneGeometry(0.014, 1.7, 1, 14); strand.translate(0, 0.85, 0);
  const sp = strand.attributes.position;
  for (let i = 0; i < sp.count; i++) { const y = sp.getY(i) / 1.7; sp.setX(i, sp.getX(i) * (1 - y * 0.85)); }
  const hm = new THREE.MeshStandardMaterial({ color: 0x060504, roughness: 0.55, side: THREE.DoubleSide });
  hm.onBeforeCompile = (sh) => {
    sh.uniforms.uLakeT = { value: 0 }; DEEP.hairU = sh.uniforms;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uLakeT;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float ph = instanceMatrix[3].x * 2.3 + instanceMatrix[3].z * 1.9;
        float yy = position.y;
        transformed.x += sin(uLakeT * 0.55 + ph + yy * 1.6) * 0.34 * yy * yy / 2.9;
        transformed.z += cos(uLakeT * 0.43 + ph * 0.8 + yy) * 0.22 * yy;`);
  };
  const NH = 360, hair = new THREE.InstancedMesh(strand, hm, NH);
  for (let i = 0; i < NH; i++) {
    // 셋 중 둘은 가운데 깊은 곳에 엉켜 있고, 나머지는 여기저기
    const [x0, z0] = i < NH * 0.66 ? inLake(0.42) : inLake(0.88);
    const cx = x0 + (R() - 0.5) * 60, cz = z0 + (R() - 0.5) * 60;
    const bed = terrainRender(cx, cz) / CM, top = HOLE.WATER / CM;
    const y = R() < 0.6 ? bed : bed + R() * Math.max(0.1, (top - bed) - 1.8);
    p3.set(cx / CM, y, cz / CM);
    q.setFromEuler(new THREE.Euler((R() - 0.5) * 0.9, R() * 6.28, (R() - 0.5) * 0.9));
    m4.compose(p3, q, s3.set(1, 0.6 + R() * 0.9, 1)); hair.setMatrixAt(i, m4);
    hair.setColorAt(i, col.setRGB(1, 1, 1).multiplyScalar(0.6 + R() * 0.6));
  }
  hair.frustumCulled = false; hair.visible = false; hair.userData.keep = true; g.add(hair); DEEP.hair = hair;
  // 가라앉은 스코어카드 — 이름 칸이 번졌다
  const cv = makeCanvas(256, 360), c = cv.getContext('2d');
  c.fillStyle = '#C9C2AE'; c.fillRect(0, 0, 256, 360);
  c.strokeStyle = 'rgba(40,50,40,.5)'; c.lineWidth = 2;
  for (let i = 0; i <= 18; i++) { c.beginPath(); c.moveTo(14, 30 + i * 17); c.lineTo(242, 30 + i * 17); c.stroke(); }
  for (let j = 0; j <= 4; j++) { c.beginPath(); c.moveTo(14 + j * 57, 30); c.lineTo(14 + j * 57, 336); c.stroke(); }
  c.filter = 'blur(6px)'; c.fillStyle = 'rgba(20,30,40,.55)'; c.fillRect(10, 4, 236, 24); c.fillRect(10, 30, 60, 306);
  c.filter = 'none';
  const ct = new THREE.CanvasTexture(cv); ct.colorSpace = THREE.SRGBColorSpace;
  const cm = new THREE.MeshStandardMaterial({ map: ct, roughness: 0.9, color: new THREE.Color(0.55, 0.6, 0.52) });
  const NC = 12, cards = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.21, 0.3), cm, NC);
  for (let i = 0; i < NC; i++) {
    const [x, z] = inLake(0.8);
    p3.set(x / CM, terrainRender(x, z) / CM + 0.02, z / CM);
    q.setFromEuler(new THREE.Euler(-Math.PI / 2 + (R() - 0.5) * 0.3, 0, R() * 6.28));
    m4.compose(p3, q, s3.set(1, 1, 1)); cards.setMatrixAt(i, m4);
  }
  cards.visible = false; cards.userData.keep = true; g.add(cards); DEEP.cards = cards;
  // 둑 위의 사람들 — 물속에서 올려다볼 때만(검은 실루엣). 실내 관람객과 같은 얼굴들
  for (const nm of ['p1', 'p2', 'p4', 'p5', 'p6']) {
    if (!(typeof PEOPLE !== 'undefined' && PEOPLE.byName && PEOPLE.byName[nm])) continue;
    const v = buildRealVisitor({ coat: '#111', pants: '#111', h: 1.7 }, nm);
    v.idle.setEffectiveWeight(1); v.walk.setEffectiveWeight(0); v.mixer.update(0.7 + Math.random());
    const mt = v.mesh.material.clone(); mt.fog = false; mt.color.setRGB(0.05, 0.05, 0.06); mt.onBeforeCompile = v.mesh.material.onBeforeCompile; mt.customProgramCacheKey = v.mesh.material.customProgramCacheKey;
    mt.depthTest = false; v.mesh.renderOrder = 12;                          // 수면 너머로 — 물속에서 비쳐 보이는 실루엣
    v.mesh.material = mt;
    v.root.visible = false; M.scene.add(v.root);
    DEEP.watchers.push(v);
  }
}
/** 잠길 때 · 나올 때(lake.js lakeSwitch 가 부른다) */
function deepSwitch(under) {
  if (!deepNight()) return;
  deepBuild();
  const S = M.scene;
  if (under) {
    S.fog.color.set(0x07130F); S.fog.density = 0.27;
    if (LAKE.surfMat) LAKE.surfMat.color.set(0x2C4640);
    DEEP.air = Math.min(DEEP.air, 8); DEEP.underT = 0;
    const v = document.getElementById('uwVeil'); if (v) { v.classList.add('night'); v.classList.remove('plunge'); void v.offsetWidth; v.classList.add('plunge'); }
    deepPlunge();
    if (typeof scoreHush === 'function') scoreHush(6);
    // 둑 위의 사람들 — 가장 가까운 물가에 줄지어
    const lx = HOLE.lake.x, lz = HOLE.lake.z, a0 = Math.atan2(M.pos.z * CM - lz, M.pos.x * CM - lx);
    DEEP.watchers.forEach((w, i) => {
      const a = a0 + (i - 2) * 0.07;
      let x = lx, z = lz;
      for (let r = 0.3; r < 3; r += 0.02) { x = lx + Math.cos(a) * HOLE.lake.rx * r; z = lz + Math.sin(a) * HOLE.lake.rz * r; if (lakeDist(x, z) > 1.12) break; }
      w.root.position.set(x / CM, terrainRender(x, z) / CM, z / CM);
      w.root.rotation.y = Math.atan2(lx - x, lz - z);
      w.root.visible = true;
    });
    // 그 사람 — 바닥에 등을 돌리고(밤이 조금이라도 깊었으면)
    if (typeof HAUNT !== 'undefined' && !HAUNT.calm && typeof shadeAt === 'function') {
      const f = hauntFwd();
      for (let k = 0; k < 12; k++) {
        const a = (Math.random() - 0.5) * 0.8, D = 700 + Math.random() * 300;
        const x = M.pos.x * CM + (f.x * Math.cos(a) - f.z * Math.sin(a)) * D, z = M.pos.z * CM + (f.z * Math.cos(a) + f.x * Math.sin(a)) * D;
        if (lakeDist(x, z) > 0.85) continue;
        const F = M.roomById.field;
        if (!shadeAt(x, z, F)) break;
        HAUNT.shade.root.position.y = terrainRender(x, z) / CM;
        HAUNT.shade.root.rotation.y = Math.atan2(x - M.pos.x * CM, z - M.pos.z * CM);   // 등을 돌린다
        DEEP.woman = { x, z, t: 0 };
        break;
      }
    }
    if (!DEEP.told) { DEEP.told = true; setTimeout(() => toast('물속 — 아무것도 안 보인다. 숨은 오래 못 참는다', 3800), 900); }
  } else {
    DEEP.watchers.forEach((w) => { w.root.visible = false; });
    if (DEEP.woman) { if (typeof shadeHide === 'function') shadeHide(); DEEP.woman = null; }
    const v = document.getElementById('uwVeil'); if (v) v.style.setProperty('--air', '0');
    // 처음 나올 때 — 전시관 쪽으로 젖은 발자국 두 줄
    if (DEEP.underT > 3 && DEEP.prints < 1) { DEEP.prints++; deepFootprints(); }
    if (DEEP.underT > 25 && typeof sndBreath === 'function') sndBreath(0.12, 0);
  }
  if (DEEP.hair) DEEP.hair.visible = under; if (DEEP.cards) DEEP.cards.visible = under;
}
/** 잠기는 소리 — 물을 가르는 쏴 · 꾸르륵 · 귀 압박 */
function deepPlunge() {
  const c = typeof SND !== 'undefined' && SND.ctx; if (!c || !SND.on) return;
  const t0 = c.currentTime + 0.01;
  const n = Math.floor(c.sampleRate * 0.7), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
  const s = c.createBufferSource(); s.buffer = b; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(2400, t0); lp.frequency.exponentialRampToValueAtTime(220, t0 + 0.6);
  const g = c.createGain(); g.gain.value = 0.35; s.connect(lp); lp.connect(g); g.connect(SND.master); s.start(t0);
  const o = c.createOscillator(), og = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(48, t0); o.frequency.linearRampToValueAtTime(38, t0 + 2.4);
  og.gain.setValueAtTime(0.0001, t0); og.gain.exponentialRampToValueAtTime(0.16, t0 + 0.4); og.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.6);
  o.connect(og); og.connect(SND.master); o.start(t0); o.stop(t0 + 2.7);
}
/** 젖은 발자국 — 물가에서 전시관(테라스) 쪽으로 두 줄 */
function deepFootprints() {
  const g = M.roomGroups.field; if (!g) return;
  if (!DEEP.printTex) {
    const cv = makeCanvas(64, 128), c = cv.getContext('2d');
    const gr = c.createRadialGradient(32, 40, 2, 32, 46, 30); gr.addColorStop(0, 'rgba(0,0,0,.85)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = gr; c.beginPath(); c.ellipse(32, 44, 18, 30, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(32, 100, 13, 18, 0, 0, Math.PI * 2); c.fill();
    DEEP.printTex = new THREE.CanvasTexture(cv);
  }
  const mat = new THREE.MeshBasicMaterial({ map: DEEP.printTex, transparent: true, opacity: 0.5, depthWrite: false, color: 0x0B0E0C });
  const geo = new THREE.PlaneGeometry(0.11, 0.24); geo.rotateX(-Math.PI / 2);
  const x0 = M.pos.x * CM, z0 = M.pos.z * CM, tx = 2400, tz = -900;
  const L = Math.hypot(tx - x0, tz - z0) || 1, ux = (tx - x0) / L, uz = (tz - z0) / L;
  const N = Math.min(46, Math.floor(L / 42)), inst = new THREE.InstancedMesh(geo, mat, N * 2);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(1, 1, 1), p3 = new THREE.Vector3();
  let k = 0;
  for (const off of [-0.35, 0.3]) for (let i = 0; i < N; i++) {
    const side = i % 2 ? 1 : -1, x = x0 + ux * (i * 42 + 60) - uz * (off * 100 + side * 11), z = z0 + uz * (i * 42 + 60) + ux * (off * 100 + side * 11);
    const r = M.roomById.field; if (!inRect(r, x, z) || lakeDist(x, z) < 1.02) continue;
    p3.set(x / CM, terrainRender(x, z) / CM + 0.012, z / CM);
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(ux, uz));
    m4.compose(p3, q, s3); inst.setMatrixAt(k++, m4);
  }
  inst.count = k; inst.renderOrder = 3; inst.userData.keep = true; g.add(inst);
}
/** 매 프레임(lake.js stepLake 가 부른다) */
function deepStep(t, dt, under) {
  if (!deepNight()) return;
  if (DEEP.hairU) DEEP.hairU.uLakeT.value = t;
  // 헤치고 걸을 때 — 화면 아래 수면선
  const depth = typeof lakeDepthHere === 'function' ? lakeDepthHere() : 0;
  let w = DEEP.wadeEl;
  if (!w) { w = DEEP.wadeEl = document.createElement('div'); w.className = 'uw-wade'; document.getElementById('gal').appendChild(w); }
  const wk = !under && depth > 8 ? clamp(depth / 140, 0, 1) : 0;
  w.style.setProperty('--wade', wk.toFixed(3));
  if (!under) { DEEP.air = Math.max(0, DEEP.air - dt * 2); return; }
  DEEP.underT += dt; DEEP.air += dt;
  const v = document.getElementById('uwVeil'); if (v) v.style.setProperty('--air', clamp((DEEP.air - 18) / 22, 0, 1).toFixed(3));
  if (DEEP.air > 30 && !DEEP.gasp) { DEEP.gasp = true; if (typeof hauntSay === 'function') hauntSay('… 숨이 —'); }
  if (DEEP.air > 40) { DEEP.gasp = false; deepPassOut(); return; }
  // 그 사람 — 다가가면 같은 거리만큼 물러난다(빛 무늬가 일렁일 때마다 · 뚝 끊기며)
  const W = DEEP.woman;
  if (W && HAUNT.shade && HAUNT.shade.root.visible) {
    W.t += dt;
    const PX = M.pos.x * CM, PZ = M.pos.z * CM, d = Math.hypot(W.x - PX, W.z - PZ);
    if (W.t > 0.6 && d < 520) {
      W.t = 0;
      const ux = (W.x - PX) / (d || 1), uz = (W.z - PZ) / (d || 1), nx = W.x + ux * 170, nz = W.z + uz * 170;
      if (lakeDist(nx, nz) > 0.9) { shadeHide(); DEEP.woman = null; return; }
      W.x = nx; W.z = nz;
      HAUNT.shade.root.position.set(nx / CM, terrainRender(nx, nz) / CM, nz / CM);
      HAUNT.shade.root.rotation.y = Math.atan2(ux, uz);
      if (typeof hauntRec === 'function') hauntRec('lakewoman');
    }
  } else if (W) DEEP.woman = null;
  // 올려다보면 — 둑 위의 사람들(기록)
  if (M.pitch > 0.45 && DEEP.watchers.length && typeof hauntRec === 'function') hauntRec('bank');
}
/** 숨이 다하면 — 어둠 · 물가로 떠밀려 나온다 */
function deepPassOut() {
  DEEP.air = 0;
  const v = document.getElementById('vaultFade') || (() => { const e = document.createElement('div'); e.id = 'vaultFade'; e.className = 'vault-fade'; document.getElementById('gal').appendChild(e); return e; })();
  v.classList.add('on'); M.openId = 'deep-out';
  setTimeout(() => {
    // 가장 가까운 물가(티 쪽)
    const lx = HOLE.lake.x, lz = HOLE.lake.z, a = Math.atan2(M.pos.z * CM - lz, M.pos.x * CM - lx);
    let x = lx, z = lz;
    for (let r = 0.3; r < 3; r += 0.02) { x = lx + Math.cos(a) * HOLE.lake.rx * r; z = lz + Math.sin(a) * HOLE.lake.rz * r; if (lakeDist(x, z) > 1.1) break; }
    const F = M.roomById.field;
    M.room = F; M.feet = terrainRender(x, z); M.eyeFeet = M.feet; M.pos.set(x / CM, (M.feet + EYE) / CM, z / CM);
    M.yaw = Math.atan2(-(lx - x), -(lz - z)) + Math.PI;                     // 물을 등지고
    M.openId = null; v.classList.remove('on');
    if (typeof sndBreath === 'function') sndBreath(0.16, 0);
    if (typeof hauntSay === 'function') setTimeout(() => hauntSay('… 누가 끌어 올렸다.'), 900);
  }, 1600);
}
