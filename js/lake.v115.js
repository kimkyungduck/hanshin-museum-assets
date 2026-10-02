/* ══════════════════════════════════════════════════════════
   호수 속 — 걸어 들어가 잠수한다(v87)
   ══════════════════════════════════════════════════════════
   예전엔 물가에서 멈췄다(terrainCm 이 물속을 NaN 으로 막았다). 이제 호숫가에서 그대로 걸어 들어간다.
     · 바닥은 가운데로 갈수록 깊다(수면 −0.85m, 가운데 바닥 약 −5.3m) → 눈높이가 수면 아래로 내려가면 물속 화면
     · 물속 화면 — 짙은 청록 안개(8m 남짓 보인다), 바닥에 일렁이는 빛(커스틱), 올려다보면 밝게 일렁이는 수면, 공기 방울
     · 물에서는 걸음이 느려진다(깊을수록)
     · 바닥 — 빠진 골프공 · 돌 · 수초
   공은 여전히 해저드다(골프 체험의 물 판정은 lakeDist 를 그대로 쓴다). */

const LAKE = { under: false, balls: 0, told: false, t0: 0 };

/** 일렁이는 빛 무늬 — 이음매 없는 워리 노이즈(F2−F1) 가장자리. 256² 캔버스 */
function causticTex() {
  if (LAKE.caus) return LAKE.caus;
  const N = 256, K = 7, R = rnd(5151), pts = [];
  for (let i = 0; i < K * K; i++) pts.push([(i % K + R()) / K, (Math.floor(i / K) + R()) / K]);
  const cv = makeCanvas(N, N), c = cv.getContext('2d'), im = c.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N;
    let d1 = 9, d2 = 9;
    for (const [px, py] of pts) {
      let dx = Math.abs(u - px), dy = Math.abs(v - py);
      dx = Math.min(dx, 1 - dx); dy = Math.min(dy, 1 - dy);                // 이음매 없게 감싼다
      const d = Math.hypot(dx, dy);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
    }
    const e = Math.pow(1 - clamp((d2 - d1) * K * 0.9, 0, 1), 3.2);            // 칸 경계가 밝은 선
    const p = (y * N + x) * 4;
    im.data[p] = im.data[p + 1] = im.data[p + 2] = e * 255; im.data[p + 3] = 255;
  }
  c.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  LAKE.caus = t;
  return t;
}

/** 지형 셰이더에 얹는다(pbr.js pbrTerrain 이 부른다) — 물 아래 바닥만 청록으로 물들이고 빛 무늬를 흘린다 */
function lakeTerrainPatch(sh) {
  Object.assign(sh.uniforms, { tCaus: { value: causticTex() }, uLakeT: { value: 0 }, uWaterY: { value: HOLE.WATER / CM } });
  LAKE.uni = sh.uniforms;
  sh.vertexShader = sh.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vLakeW;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vLakeW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vLakeW; uniform sampler2D tCaus; uniform float uLakeT, uWaterY;')
    .replace('#include <opaque_fragment>', `
      if (vLakeW.y < uWaterY) {
        float dd = uWaterY - vLakeW.y;
        vec2 p = vLakeW.xz * 0.24;
        float c1 = texture2D(tCaus, p + uLakeT * vec2(0.031, 0.022)).r;
        float c2 = texture2D(tCaus, p * 0.83 + vec2(0.37, 0.61) - uLakeT * vec2(0.024, 0.036)).r;
        float cs = pow(min(c1, c2), 1.4) * 2.4 + max(c1, c2) * 0.12;
        outgoingLight = outgoingLight * mix(vec3(1.0), vec3(0.42, 0.66, 0.62), smoothstep(0.0, 1.2, dd))
          + diffuseColor.rgb * cs * 1.6 * exp(-dd * 0.22) * smoothstep(0.0, 0.25, dd);
      }
      #include <opaque_fragment>`);
}

/** 바닥 — 빠진 골프공 · 돌 · 수초 */
function buildLakeBed(g) {
  const R = rnd(7373), inLake = (L) => {
    for (let k = 0; k < 200; k++) {
      const x = HOLE.lake.x + (R() * 2 - 1) * HOLE.lake.rx, z = HOLE.lake.z + (R() * 2 - 1) * HOLE.lake.rz;
      if (lakeDist(x, z) < L) return [x, z];
    }
    return [HOLE.lake.x, HOLE.lake.z];
  };
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3(), col = new THREE.Color();
  // 공 — 티샷이 떨어지는 쪽(티 가까운 물가~가운데)에 많다
  const NB = 46;
  const balls = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0214, 14, 10), new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.45 }), NB);
  for (let i = 0; i < NB; i++) {
    let [x, z] = inLake(0.9);
    if (i < NB * 0.6) z = lerp(z, HOLE.lake.z + HOLE.lake.rz * 0.55, 0.5);       // 티 쪽(남쪽)으로 모은다
    if (lakeDist(x, z) > 0.9) [x, z] = inLake(0.85);
    p3.set(x / CM, terrainRender(x, z) / CM + 0.012, z / CM);
    m4.compose(p3, q.identity(), s3.set(1, 1, 1)); balls.setMatrixAt(i, m4);
    balls.setColorAt(i, col.setRGB(1, 1, 1).multiplyScalar(0.55 + R() * 0.45).lerp(new THREE.Color(0x8A9A6A), R() * 0.35));   // 이끼 낀 공도
  }
  LAKE.balls = NB;
  // 돌
  const NR = 34;
  const rg = new THREE.DodecahedronGeometry(1, 1), rp = rg.attributes.position;
  for (let i = 0; i < rp.count; i++) { const k = 0.75 + 0.35 * Math.sin(rp.getX(i) * 5.1 + rp.getZ(i) * 3.3) * Math.cos(rp.getY(i) * 4.2); rp.setXYZ(i, rp.getX(i) * k, rp.getY(i) * k * 0.6, rp.getZ(i) * k); }
  rg.computeVertexNormals();
  const rocks = new THREE.InstancedMesh(rg, new THREE.MeshStandardMaterial({ color: 0x5E6454, roughness: 0.9 }), NR);
  for (let i = 0; i < NR; i++) {
    const [x, z] = inLake(0.97), sc = 0.12 + R() * 0.45;
    p3.set(x / CM, terrainRender(x, z) / CM + sc * 0.2, z / CM);
    q.setFromEuler(new THREE.Euler(R() * 0.4, R() * 6.28, R() * 0.4));
    m4.compose(p3, q, s3.set(sc, sc, sc)); rocks.setMatrixAt(i, m4);
    rocks.setColorAt(i, col.setRGB(1, 1, 1).multiplyScalar(0.7 + R() * 0.5));
  }
  // 수초 — 가늘고 긴 잎(물 흐름에 흔들린다: 정점 셰이더)
  const leaf = new THREE.PlaneGeometry(0.05, 1, 1, 6); leaf.translate(0, 0.5, 0);
  const lp = leaf.attributes.position;
  for (let i = 0; i < lp.count; i++) { const y = lp.getY(i); lp.setX(i, lp.getX(i) * (1 - y * 0.8)); }
  const NW = 420;
  const weedMat = new THREE.MeshStandardMaterial({ color: 0x4E7A34, roughness: 0.8, side: THREE.DoubleSide });
  weedMat.onBeforeCompile = (sh) => {
    sh.uniforms.uLakeT = { value: 0 }; LAKE.weedU = sh.uniforms;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uLakeT;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float ph = instanceMatrix[3].x * 1.7 + instanceMatrix[3].z * 1.3;
        transformed.x += sin(uLakeT * 1.3 + ph + position.y * 2.0) * 0.12 * position.y * position.y;
        transformed.z += cos(uLakeT * 1.1 + ph * 0.7) * 0.06 * position.y;`);
  };
  const weeds = new THREE.InstancedMesh(leaf, weedMat, NW);
  let wi = 0;
  for (let c = 0; c < 38 && wi < NW; c++) {
    const [cx, cz] = inLake(0.95);
    const n = 6 + Math.floor(R() * 8);
    for (let k = 0; k < n && wi < NW; k++) {
      const x = cx + (R() - 0.5) * 90, z = cz + (R() - 0.5) * 90;
      const bed = terrainRender(x, z), h = clamp((HOLE.WATER - bed) / CM * (0.35 + R() * 0.5), 0.3, 2.6);
      p3.set(x / CM, bed / CM, z / CM);
      q.setFromEuler(new THREE.Euler((R() - 0.5) * 0.3, R() * 6.28, (R() - 0.5) * 0.3));
      m4.compose(p3, q, s3.set(1 + R(), h, 1)); weeds.setMatrixAt(wi, m4);
      weeds.setColorAt(wi++, col.setRGB(1, 1, 1).multiplyScalar(0.6 + R() * 0.6));
    }
  }
  weeds.count = wi;
  for (const m of [balls, rocks, weeds]) { m.userData.keep = true; m.receiveShadow = true; m.frustumCulled = false; g.add(m); }
  markOut(g);
}

/* ── 물결 · 물살(v89) ───────────────────────────────────────
   예전 수면은 거울처럼 가만히 있었다 → 잔물결 법선을 흘려 반사가 일렁이게 하고,
   물을 헤치고 걸으면 발밑에서 고리가 퍼진다. 공이 빠지거나 뛰어내리면 물보라가 튄다. */
function lakeWaves() {
  if (LAKE.waveTex || !M.water) return;
  const N = 256, hgt = fbm(N, N, 9191, 4, 32);
  const t = new THREE.CanvasTexture(heightToNormal(hgt, N, N, 1.4));
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(0.22, 0.22);   // 수면 uv 는 미터 — 타일 약 4.5m
  LAKE.waveTex = t;
  const m = M.water.material;
  m.normalMap = t; m.normalScale = new THREE.Vector2(0.28, 0.28); m.needsUpdate = true;
}
/** 지금 선 자리의 물 깊이(cm) — 물 밖이면 0 */
function lakeDepthHere() {
  if (!M.room || !M.room.terrain) return 0;
  const x = M.pos.x * CM, z = M.pos.z * CM;
  if (lakeDist(x, z) > 1.02) return 0;
  return Math.max(0, HOLE.WATER - (M.feet || 0));
}
/** 고리 하나 — x·z(m), 크기 배율, 세기 */
function lakeRipple(x, z, size = 1, a = 0.5, delay = 0) {
  if (!LAKE.rip) {
    LAKE.rip = [];
    // 부드러운 고리 한 장(가장자리가 풀린 가는 선 + 안쪽의 옅은 그늘) — 딱딱한 링 도형은 페인트 칠한 원으로 보였다
    const N = 128, cv = makeCanvas(N, N), c = cv.getContext('2d'), im = c.createImageData(N, N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const r = Math.hypot(x - N / 2 + 0.5, y - N / 2 + 0.5) / (N / 2);
      const hi = Math.exp(-(((r - 0.9) / 0.035) ** 2)), lo = Math.exp(-(((r - 0.8) / 0.05) ** 2)) * 0.35;
      const p = (y * N + x) * 4; im.data[p] = im.data[p + 1] = im.data[p + 2] = 255; im.data[p + 3] = Math.min(255, (hi + lo) * 255);
    }
    c.putImageData(im, 0, 0);
    const tex = new THREE.CanvasTexture(cv);
    const geo = new THREE.PlaneGeometry(2, 2); geo.rotateX(-Math.PI / 2);
    for (let i = 0; i < 18; i++) {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, color: 0xE6F2EE, transparent: true, opacity: 0, depthWrite: false }));
      m.visible = false; m.renderOrder = 4; M.scene.add(m);
      LAKE.rip.push({ m, life: 0 });
    }
    LAKE.ripI = 0;
  }
  const r = LAKE.rip[LAKE.ripI = (LAKE.ripI + 1) % LAKE.rip.length];
  r.x = x; r.z = z; r.t = -delay; r.life = 1.8 * Math.sqrt(size); r.s = size; r.a = a;
  r.m.position.set(x, HOLE.WATER / CM + 0.012, z); r.m.visible = false;
}
/** 물보라 — 고리 셋 + 물방울 */
function lakeSplash(x, z, k = 1) {
  lakeRipple(x, z, 1.1 * k, 0.7); lakeRipple(x, z, 1.8 * k, 0.45, 0.18); lakeRipple(x, z, 2.6 * k, 0.3, 0.4);
  if (!LAKE.drops) {
    LAKE.drops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), new THREE.MeshBasicMaterial({ color: 0xE8F4F2, transparent: true, opacity: 0.75, depthWrite: false }), 40);
    LAKE.drops.frustumCulled = false; LAKE.dropP = []; M.scene.add(LAKE.drops);
  }
  for (let i = 0; i < 16 * k + 6; i++) {
    const a = Math.random() * 6.28, sp = 0.6 + Math.random() * 1.6 * k;
    LAKE.dropP[(LAKE.dropI = ((LAKE.dropI || 0) + 1) % 40)] = { p: new THREE.Vector3(x, HOLE.WATER / CM + 0.02, z),
      v: new THREE.Vector3(Math.cos(a) * sp, 1.6 + Math.random() * 2.4 * k, Math.sin(a) * sp), s: 0.006 + Math.random() * 0.01 };
  }
}
function lakeLanded() { if (!LAKE.under && lakeDepthHere() > 3) { lakeSplash(M.pos.x, M.pos.z, 0.8); golfSfx('splash'); } }
function lakeFx(t) {
  const dt = Math.min(0.05, t - (LAKE.ft || t)); LAKE.ft = t;
  if (LAKE.waveTex) LAKE.waveTex.offset.set(t * 0.011, t * 0.007);
  // 헤치고 걷기 — 발은 물속, 눈은 물 위
  const depth = lakeDepthHere();
  if (depth > 3 && !LAKE.under && !(typeof CART !== 'undefined' && CART.driving) && !GOLF.mode) {
    const moving = M.vel && Math.hypot(M.vel.x, M.vel.z) > 0.25;
    LAKE.wadeT = (LAKE.wadeT || 0) - dt;
    if (LAKE.wadeT <= 0) {
      const f = [-Math.sin(M.yaw), -Math.cos(M.yaw)];
      lakeRipple(M.pos.x + f[0] * 0.35, M.pos.z + f[1] * 0.35, moving ? 0.9 : 0.6, moving ? 0.42 : 0.22);
      LAKE.wadeT = moving ? 0.34 : 1.5;
      if (moving) golfSfx('wade', clamp(depth / 60, 0.4, 1));
    }
  }
  if (LAKE.rip) for (const r of LAKE.rip) {
    if (r.life <= 0) continue;
    r.t += dt;
    if (r.t < 0) continue;
    const u = r.t / r.life;
    if (u >= 1) { r.life = 0; r.m.visible = false; continue; }
    r.m.visible = true;
    r.m.scale.setScalar(0.15 + r.s * 1.4 * Math.sqrt(u));
    r.m.material.opacity = 0.55 * r.a * (1 - u) * (1 - u);
  }
  if (LAKE.drops) {
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3();
    for (let i = 0; i < 40; i++) {
      const d = LAKE.dropP[i];
      if (!d || d.p.y < HOLE.WATER / CM) { m4.makeScale(0, 0, 0); LAKE.drops.setMatrixAt(i, m4); if (d && !d.done) { d.done = true; lakeRipple(d.p.x, d.p.z, 0.25, 0.25); } continue; }
      d.v.y -= 9.8 * dt; d.p.addScaledVector(d.v, dt);
      m4.compose(d.p, q, s3.setScalar(d.s)); LAKE.drops.setMatrixAt(i, m4);
    }
    LAKE.drops.instanceMatrix.needsUpdate = true;
  }
}

/** 매 프레임 — 물속인지 보고 화면을 바꾼다(stepWorld 가 부른다) */
function stepLake(t) {
  if (LAKE.uni) LAKE.uni.uLakeT.value = t;
  if (LAKE.weedU) LAKE.weedU.uLakeT.value = t;
  if (!M.cam || !M.water) return;
  lakeWaves();
  lakeFx(t);
  const cx = M.cam.position.x * CM, cz = M.cam.position.z * CM, cy = M.cam.position.y * CM;
  const under = cy < HOLE.WATER - 2 && lakeDist(cx, cz) < 1.02;
  if (under !== LAKE.under) lakeSwitch(under);
  if (under) {
    if (LAKE.surfMat) { LAKE.surfMat.map.offset.set(t * 0.012, t * 0.009); }
    lakeBubbles(t, cy);
  }
  if (typeof deepStep === 'function') deepStep(t, Math.min(0.05, t - (LAKE.dt0 || t)), under); LAKE.dt0 = t;
}

function lakeSwitch(under) {
  LAKE.under = under;
  const S = M.scene;
  if (!LAKE.fog0) LAKE.fog0 = { c: S.fog.color.clone(), d: S.fog.density };
  if (!LAKE.surfMat) {
    // 수면을 아래에서 — 밝게 일렁이는 천장(빛 무늬를 흘린다)
    const tex = causticTex().clone(); tex.needsUpdate = true; tex.repeat.set(9, 5);
    LAKE.surfMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x9ED8CF), map: tex, side: THREE.DoubleSide });
    LAKE.surfMat.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>',
        '#include <map_fragment>\n  diffuseColor.rgb = diffuse * (0.62 + sampledDiffuseColor.r * 0.9);');
    };
    LAKE.topMat = M.water.material;
  }
  M.water.material = under ? LAKE.surfMat : LAKE.topMat;
  if (under) { S.fog.color.set(0x1D4A47); S.fog.density = 0.12; }
  else { S.fog.color.copy(LAKE.fog0.c); S.fog.density = LAKE.fog0.d; }
  if (typeof deepSwitch === 'function') deepSwitch(under);                // v115 — 밤의 물속
  let ov = document.getElementById('uwVeil');
  if (!ov) { ov = document.createElement('div'); ov.id = 'uwVeil'; ov.className = 'uw-veil'; document.getElementById('gal').appendChild(ov); }
  ov.classList.toggle('on', under);
  if (LAKE.bub) LAKE.bub.visible = under;
  if (under && !LAKE.told && !(typeof NIGHT !== 'undefined' && NIGHT.on)) { LAKE.told = true; toast('물속 — 바닥에 빠진 공이 ' + LAKE.balls + '개 보인다. 물가로 걸어 나가면 뭍으로 올라간다', 5200); }
}

/** 공기 방울 — 눈앞에서 조금씩 올라간다 */
function lakeBubbles(t, camY) {
  const N = 36;
  if (!LAKE.bub) {
    LAKE.bub = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xDFF6F2, transparent: true, opacity: 0.45, depthWrite: false }), N);
    LAKE.bub.frustumCulled = false; LAKE.bubP = [];
    for (let i = 0; i < N; i++) LAKE.bubP.push({ reset: true });
    M.scene.add(LAKE.bub);
  }
  const dt = Math.min(0.05, t - (LAKE.t0 || t)); LAKE.t0 = t;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3();
  const c = M.cam.position, top = HOLE.WATER / CM;
  LAKE.bubP.forEach((b, i) => {
    if (b.reset || b.y > top || Math.hypot(b.x - c.x, b.z - c.z) > 4) {
      const a = Math.random() * 6.28, r = 0.6 + Math.random() * 3;
      b.x = c.x + Math.cos(a) * r; b.z = c.z + Math.sin(a) * r;
      b.y = c.y - 1.2 - Math.random() * 2; b.s = 0.006 + Math.random() * 0.018; b.v = 0.25 + Math.random() * 0.45; b.ph = Math.random() * 6.28; b.reset = false;
    }
    b.y += b.v * dt;
    p3.set(b.x + Math.sin(t * 3 + b.ph) * 0.03, b.y, b.z + Math.cos(t * 2.6 + b.ph) * 0.03);
    m4.compose(p3, q, s3.set(b.s, b.s * 0.85, b.s)); LAKE.bub.setMatrixAt(i, m4);
  });
  LAKE.bub.instanceMatrix.needsUpdate = true;
}

/** 걸음 배율 — 물이 깊을수록 느리다 */
function lakeSlow() {
  if (!M.room || !M.room.terrain) return 1;
  const x = M.pos.x * CM, z = M.pos.z * CM;
  if (lakeDist(x, z) > 1.05) return 1;
  const depth = HOLE.WATER - (M.feet || 0);
  return depth > 0 ? lerp(1, 0.45, clamp(depth / 130, 0, 1)) : 1;
}
