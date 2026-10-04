/**
 * obj3d.js — 사물을 **실제 3D 지오메트리**로 만든다
 *
 * 평면(빌보드)은 정면에서만 그럴듯하고 옆에서 보면 종이처럼 사라진다 → 회전체(Lathe)·
 * 원기둥·상자를 조합해 어느 각도에서도 입체로 보이게 한다.
 *
 * 리디자인(v75) — 새 공간(해·환경 반사·밝은 마감)에 맞춰 다시 만들었다.
 *   · 모서리를 **둥글린 좌대**(rbox) — 날 선 상자는 반사가 모서리에서 끊겨 '장난감' 처럼 보였다.
 *     둥근 모서리는 환경맵 하이라이트를 한 줄 받아 재질이 읽힌다.
 *   · 좌대는 미술관식 **흰 플린스**, 금속은 브러시드(금속도 1 · 거칠기 중간).
 *   · 소품은 현대식으로 — 원목 상판 벤치, 세라믹 화분 + 산세베리아, 슬림 독서대, 유리 진열장.
 *
 * 모든 빌더는 THREE.Group 을 돌려준다. **발이 y=0**, 정면이 +z 를 향한다. 단위는 m.
 * 조립이 끝난 사물은 museum3d buildObjMesh 가 재질별로 합친다(batchStatic) — 부품 수가
 * 많아도 그리기 횟수는 재질 수만큼이다.
 */

/* ── 공용 재질 ─────────────────────────────────────────── */
const OBJ_MAT = {};
function objMat() {
  if (OBJ_MAT.ready) return OBJ_MAT;
  const M = (c, r, m) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  Object.assign(OBJ_MAT, {
    brass:   M(0xCFA84A, 0.26, 1.0),
    brassD:  M(0x93762C, 0.4, 1.0),
    steel:   M(0xB9BDC0, 0.3, 1.0),        // 브러시드 스테인리스
    steelD:  M(0x1C1D20, 0.5, 0.35),       // 무광 검정 도장
    walnut:  M(0x5C402B, 0.45, 0.02),
    walnutD: M(0x3A281B, 0.5, 0.02),
    oak:     M(0xB08A5E, 0.48, 0.02),
    velvet:  M(0x72202C, 0.92, 0.0),
    black:   M(0x131416, 0.62, 0.05),
    paper:   M(0xF1ECDF, 0.9, 0.0),
    leaf:    M(0x3E6C36, 0.62, 0.0),
    leafD:   M(0x2A4E28, 0.66, 0.0),
    leafY:   M(0x9BA24A, 0.6, 0.0),        // 산세베리아 잎 가장자리
    terra:   M(0x2B2C2F, 0.3, 0.05),       // 유광 흑색 세라믹 화분
    soil:    M(0x2A2118, 0.95, 0.0),
    // 좌대 — 미술관 흰 플린스와 웜그레이 받침
    // 흰 플린스 — 전용 스포트를 받으면 날아가므로 순백보다 한 톤 낮춘다
    marble:  M(0xDCD7CD, 0.66, 0.0),
    marbleD: M(0xC4BDB1, 0.6, 0.0),
    stone:   M(0xA8A296, 0.78, 0.02),
    stoneD:  M(0x807A6E, 0.82, 0.02),
    bronze:  M(0x7A5A32, 0.36, 1.0),
    bronzeD: M(0x4E3820, 0.44, 1.0),
    glass:   new THREE.MeshStandardMaterial({
      color: 0xD6E4E8, roughness: 0.03, metalness: 0.0, transparent: true, opacity: 0.16, depthWrite: false,
    }),
    water:   M(0x8FB6C4, 0.12, 0.0),
    red:     M(0xB3261E, 0.35, 0.1),
    white:   M(0xF2F0EB, 0.4, 0.0),
  });
  OBJ_MAT.glass.userData.noBatch = true;
  OBJ_MAT.ready = true;
  return OBJ_MAT;
}

/** 회전체 — 프로파일 점 [[반지름, 높이], ...] */
function lathe(profile, mat, seg = 32) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(Math.max(0.0001, r), y));
  const g = new THREE.LatheGeometry(pts, seg);
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function box(w, h, d, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
/**
 * 둥근 모서리 상자 — 가운데가 원점. r = 모서리 반지름(m).
 * ExtrudeGeometry(코어에 있다)로 옆 모서리는 둥근 사각형, 위아래 모서리는 베벨로 굴린다.
 */
function rbox(w, h, d, r, mat) {
  r = Math.min(r, w / 2 - 0.001, d / 2 - 0.001, h / 2 - 0.001);
  const iw = w - r * 2, id = d - r * 2, rr = Math.min(r, iw / 2, id / 2) * 0.9;
  const sh = new THREE.Shape();
  const x0 = -iw / 2, y0 = -id / 2;
  sh.moveTo(x0 + rr, y0);
  sh.lineTo(x0 + iw - rr, y0); sh.quadraticCurveTo(x0 + iw, y0, x0 + iw, y0 + rr);
  sh.lineTo(x0 + iw, y0 + id - rr); sh.quadraticCurveTo(x0 + iw, y0 + id, x0 + iw - rr, y0 + id);
  sh.lineTo(x0 + rr, y0 + id); sh.quadraticCurveTo(x0, y0 + id, x0, y0 + id - rr);
  sh.lineTo(x0, y0 + rr); sh.quadraticCurveTo(x0, y0, x0 + rr, y0);
  const g = new THREE.ExtrudeGeometry(sh, {
    depth: Math.max(0.001, h - r * 2), bevelEnabled: true, bevelThickness: r, bevelSize: r,
    bevelSegments: 3, curveSegments: 4,
  });
  g.rotateX(-Math.PI / 2);                 // 돌출 방향(z) → 위(y)
  g.translate(0, -(h - r * 2) / 2, 0);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function cyl(rt, rb, h, mat, seg = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function sphere(r, mat, seg = 18) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg * 0.6 | 0)), mat);
  m.castShadow = true;
  return m;
}
function tube(pts, r, mat, seg = 24) {
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), seg, r, 10, false), mat);
  m.castShadow = true;
  return m;
}
/** 명판 — 놋쇠 판에 글자 */
function plaque(lines, w, h, opt = {}) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({
      map: textTex(lines, { size: opt.size || 40, w: opt.pw || 560, h: opt.ph || 200, bg: '#C9A24A', fg: '#1A1206', rule: 'rgba(40,30,10,.5)' }),
      roughness: 0.38, metalness: 0.55,
    }));
}
/** 미술관 플린스 — 흰 좌대 + 바닥 그림자 틈(걸레받이처럼 살짝 들여 넣은 검은 띠) */
function plinth(g, w, h, d, M) {
  const top = rbox(w, h - 0.04, d, 0.018, M.marble); top.position.y = 0.04 + (h - 0.04) / 2; g.add(top);
  const kick = box(w - 0.04, 0.04, d - 0.04, M.black); kick.position.y = 0.02; g.add(kick);
  return h;
}

/** 캔버스에 글자를 그려 텍스처로 (안내판·명패용) */
function textTex(lines, opt = {}) {
  const W = opt.w || 512, H = opt.h || 340;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  c.fillStyle = opt.bg || '#14100A';
  c.fillRect(0, 0, W, H);
  c.fillStyle = opt.rule || 'rgba(227,197,103,.75)';
  c.fillRect(38, 42, W - 76, 4);
  c.textAlign = 'left';
  c.textBaseline = 'top';
  lines.forEach((ln, i) => {
    const big = i === 0;
    c.fillStyle = big ? (opt.fg || '#F0E6CC') : (opt.fg ? 'rgba(26,18,6,.75)' : 'rgba(232,225,206,.72)');
    c.font = big ? `700 ${opt.size || 46}px "Noto Serif KR", serif`
                 : `400 ${Math.round((opt.size || 46) * 0.56)}px "Noto Serif KR", serif`;
    c.fillText(ln, 40, 70 + (big ? 0 : 66 + (i - 1) * 40));
  });
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/* 우승컵 손잡이 — 귀 모양 고리.
   ⚠️ 예전 곡선은 컵 입구(1.25m)에서 시작해 바깥으로 **내려가다가** 잔 밑(0.94m, 반지름 24cm)에서
      끝났다. 그 높이의 잔 반지름은 14cm 라 끝이 허공에 떠 있었고, 고리가 아래로 처져
      '거꾸로 달린' 것처럼 보였다. 진짜 러빙컵 손잡이는 **잔 윗부분에서 위로 솟았다가**
      바깥으로 크게 돌아 **잔 아랫부분에 다시 붙는다.**
   bowl(y) = 그 높이의 잔 반지름 — 양 끝을 잔 표면 안쪽 2mm 에 묻어 틈이 없게 한다. */
function cupHandles(g, mat, y0, bowl, k = 1, r = 0.024) {
  const top = y0 + 0.60 * k, bot = y0 + 0.40 * k;
  for (const s of [1, -1]) {
    g.add(tube([
      [s * (bowl(top) - 0.004), top, 0],
      [s * (bowl(top) + 0.09 * k), top + 0.07 * k, 0],
      [s * (bowl(top) + 0.2 * k), top + 0.01 * k, 0],
      [s * (bowl(top) + 0.21 * k), (top + bot) / 2, 0],
      [s * (bowl(bot) + 0.13 * k), bot - 0.01 * k, 0],
      [s * (bowl(bot) - 0.004), bot + 0.005 * k, 0],
    ], r, mat, 32));
  }
}

/* ══════════════════════════════════════════════════════════
   사물 빌더 — key → THREE.Group
   ══════════════════════════════════════════════════════════ */
const OBJ_BUILD = {

  /* 관람 차단봉 — **두 기둥 한 벌**, 로프가 그 사이에 늘어진다.
     ⚠️ 예전엔 기둥 하나에서 로프가 양쪽으로 뻗어 허공에서 끊겼다(잘린 것처럼 보였다). */
  stanchion() {
    const M = objMat(), g = new THREE.Group();
    const X = 0.78;
    for (const s of [-1, 1]) {
      const base = lathe([[0.0, 0.0], [0.15, 0.0], [0.155, 0.012], [0.14, 0.028], [0.04, 0.036], [0.0, 0.036]], M.steel);
      base.position.x = s * X; g.add(base);
      const post = cyl(0.022, 0.022, 0.88, M.steel); post.position.set(s * X, 0.036 + 0.44, 0); g.add(post);
      const cap = lathe([[0.0, 0.0], [0.034, 0.0], [0.036, 0.03], [0.02, 0.05], [0.0, 0.055]], M.steel);
      cap.position.set(s * X, 0.91, 0); g.add(cap);
      const hook = sphere(0.02, M.brass, 12); hook.position.set(s * (X - 0.03), 0.86, 0); g.add(hook);
    }
    g.add(tube([[-X + 0.03, 0.86, 0], [-0.4, 0.7, 0.01], [0, 0.66, 0.012], [0.4, 0.7, 0.01], [X - 0.03, 0.86, 0]], 0.017, M.velvet, 32));
    return g;
  },

  /* 관람용 벤치 — 두꺼운 오크 상판 + 검은 강철 ㄷ자 다리 (미술관 갤러리 벤치) */
  bench() {
    const M = objMat(), g = new THREE.Group();
    const top = rbox(1.6, 0.075, 0.44, 0.012, M.oak); top.position.y = 0.43; g.add(top);
    for (const s of [1, -1]) {
      const leg = box(0.04, 0.39, 0.4, M.steelD); leg.position.set(s * 0.66, 0.2, 0); g.add(leg);
      const ft = box(0.06, 0.012, 0.42, M.steelD); ft.position.set(s * 0.66, 0.006, 0); g.add(ft);
    }
    return g;
  },

  /* 화분 — 유광 흑색 원통 세라믹 + 산세베리아(곧게 선 칼날 잎) */
  planter() {
    const M = objMat(), g = new THREE.Group();
    const pot = lathe([[0.0, 0.0], [0.19, 0.0], [0.205, 0.02], [0.21, 0.55], [0.2, 0.56], [0.19, 0.53], [0.0, 0.52]], M.terra, 40);
    g.add(pot);
    const soil = cyl(0.19, 0.19, 0.012, M.soil, 28); soil.position.y = 0.525; g.add(soil);
    const R = (n) => Math.abs(Math.sin(n * 12.9898) * 43758.5453 % 1);
    for (let i = 0; i < 13; i++) {
      const a = (i / 13) * Math.PI * 2 + R(i) * 0.6, rr = 0.03 + R(i + 3) * 0.1;
      const len = 0.42 + R(i + 7) * 0.42;
      const geo = new THREE.ConeGeometry(0.032, len, 5, 1);
      geo.scale(1, 1, 0.22);
      const leaf = new THREE.Mesh(geo, i % 4 === 0 ? M.leafY : (i % 2 ? M.leaf : M.leafD));
      leaf.position.set(Math.cos(a) * rr, 0.53 + len / 2, Math.sin(a) * rr);
      leaf.rotation.set(Math.sin(a) * 0.16, -a, -Math.cos(a) * 0.16);
      leaf.castShadow = true;
      g.add(leaf);
    }
    return g;
  },

  /* 안내 스탠드 — 얇은 원반 받침 + 검은 기둥 + 기울어진 패널 */
  standee(o) {
    const M = objMat(), g = new THREE.Group();
    const base = lathe([[0.0, 0.0], [0.19, 0.0], [0.19, 0.015], [0.03, 0.022]], M.steelD, 32);
    g.add(base);
    const pole = cyl(0.016, 0.016, 0.94, M.steelD); pole.position.y = 0.49; g.add(pole);
    const panel = new THREE.Group();
    panel.add(rbox(0.48, 0.36, 0.018, 0.006, M.steelD));
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.32),
      new THREE.MeshStandardMaterial({ map: textTex(o.lines || ['안내', '관람 순서'], { size: 52 }), roughness: 0.85 }));
    face.position.z = 0.0105;
    panel.add(face);
    panel.position.set(0, 1.06, 0.03);
    panel.rotation.x = -0.3;
    g.add(panel);
    return g;
  },

  /* 휴지통 — 스테인리스 원통 + 검은 투입구 */
  bin() {
    const M = objMat(), g = new THREE.Group();
    g.add(lathe([[0.0, 0.0], [0.15, 0.0], [0.155, 0.01], [0.155, 0.52], [0.14, 0.545], [0.0, 0.55]], M.steel, 36));
    const hole = cyl(0.1, 0.1, 0.01, M.black, 28); hole.position.y = 0.548; g.add(hole);
    return g;
  },

  /* 정수대 — 흰 본체 + 검은 패널 + 스테인리스 수전 */
  cooler() {
    const M = objMat(), g = new THREE.Group();
    const body = rbox(0.36, 1.05, 0.32, 0.03, M.white); body.position.y = 0.525; g.add(body);
    const panel = rbox(0.28, 0.32, 0.02, 0.008, M.black); panel.position.set(0, 0.78, 0.162); g.add(panel);
    const tap = cyl(0.012, 0.012, 0.08, M.steel, 12); tap.rotation.x = Math.PI / 2; tap.position.set(0, 0.84, 0.2); g.add(tap);
    const tray = rbox(0.18, 0.02, 0.07, 0.006, M.steel); tray.position.set(0, 0.64, 0.19); g.add(tray);
    return g;
  },

  /* 우산 보관대 — 스테인리스 통 + 손잡이가 굽은 우산 */
  umbrella() {
    const M = objMat(), g = new THREE.Group();
    g.add(lathe([[0.0, 0.0], [0.15, 0.0], [0.15, 0.5], [0.14, 0.5], [0.14, 0.02], [0.0, 0.02]], M.steel, 36));
    const cols = [0x1F3048, 0x5A1E28, 0x2E4630];
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2, x = Math.cos(a) * 0.06, z = Math.sin(a) * 0.06;
      const um = new THREE.MeshStandardMaterial({ color: cols[i], roughness: 0.7 });
      const body = lathe([[0.0, 0.0], [0.03, 0.08], [0.045, 0.55], [0.012, 0.72]], um, 12);
      body.position.set(x, 0.05, z); g.add(body);
      g.add(tube([[x, 0.76, z], [x, 0.86, z], [x + 0.03, 0.9, z], [x + 0.055, 0.86, z]], 0.01, M.walnut, 12));
    }
    return g;
  },

  /* 트로피 — 흰 플린스 + 놋쇠 컵(트로피실 명패) */
  trophy() {
    const M = objMat(), g = new THREE.Group();
    const H = plinth(g, 0.38, 0.8, 0.38, M);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.06), M.brass);
    pl.position.set(0, 0.62, 0.191); g.add(pl);
    const base = lathe([[0.0, 0.0], [0.085, 0.0], [0.085, 0.03], [0.05, 0.045], [0.03, 0.06]], M.walnutD, 28);
    base.position.y = H; g.add(base);
    const stem = lathe([[0.0, 0.0], [0.03, 0.0], [0.014, 0.05], [0.018, 0.09], [0.0, 0.1]], M.brass); stem.position.y = H + 0.06; g.add(stem);
    const prof = [[0.0, 0.0], [0.03, 0.0], [0.07, 0.05], [0.085, 0.13], [0.087, 0.17], [0.08, 0.17], [0.076, 0.13], [0.062, 0.06], [0.0, 0.03]];
    const cup = lathe(prof, M.brass, 36); cup.position.y = H + 0.15; g.add(cup);
    const bowl = (y) => { const t = clamp((y - H - 0.15) / 0.17, 0, 1); return 0.03 + (0.085 - 0.03) * Math.sqrt(t); };
    // 손잡이 — 잔 윗부분(H+0.29)에서 솟았다가 아랫부분(H+0.21)에 붙는다(k = 0.4)
    cupHandles(g, M.brass, H + 0.05, bowl, 0.4, 0.007);
    return g;
  },

  /* 방명록 — 슬림 월넛 독서대 + 펼친 책 */
  book() {
    const M = objMat(), g = new THREE.Group();
    const foot = rbox(0.42, 0.03, 0.34, 0.01, M.steelD); foot.position.y = 0.015; g.add(foot);
    const leg = rbox(0.1, 0.9, 0.08, 0.012, M.walnut); leg.position.y = 0.48; g.add(leg);
    const desk = new THREE.Group();
    desk.add(rbox(0.6, 0.04, 0.4, 0.01, M.walnut));
    // 펼친 책 — 두 쪽이 가운데로 살짝 기운다
    for (const s of [-1, 1]) {
      const page = rbox(0.26, 0.014, 0.34, 0.004, M.paper);
      page.position.set(s * 0.135, 0.028, 0); page.rotation.z = -s * 0.07;
      desk.add(page);
    }
    const spine = box(0.012, 0.02, 0.34, M.walnutD); spine.position.set(0, 0.024, 0); desk.add(spine);
    const pen = cyl(0.005, 0.005, 0.14, M.brass, 8);
    pen.rotation.set(0, 0.3, Math.PI / 2); pen.position.set(0.22, 0.05, 0.14);
    desk.add(pen);
    desk.position.set(0, 0.96, 0.02);
    desk.rotation.x = 0.38;
    g.add(desk);
    return g;
  },

  /* 벽시계 — 얇은 놋쇠 테 + 흰 판 + 검은 바늘 (벽걸이: 중심 기준) */
  clock() {
    const M = objMat(), g = new THREE.Group();
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.012, 12, 48), M.brass);
    rim.castShadow = true; g.add(rim);
    const face = cyl(0.168, 0.168, 0.02, M.white, 48); face.rotation.x = Math.PI / 2; g.add(face);
    const hh = box(0.01, 0.1, 0.004, M.black); hh.position.set(0, 0.045, 0.014); g.add(hh);
    const mh = box(0.075, 0.007, 0.004, M.black); mh.position.set(0.034, 0, 0.016); g.add(mh);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const t = box(0.004, i % 3 ? 0.012 : 0.024, 0.003, M.black);
      t.position.set(Math.sin(a) * 0.145, Math.cos(a) * 0.145, 0.012); t.rotation.z = -a; g.add(t);
    }
    return g;
  },

  /* 소화기 — 벽 앞 받침대 위 */
  extinguisher() {
    const M = objMat(), g = new THREE.Group();
    const stand = rbox(0.26, 0.04, 0.22, 0.01, M.steelD); stand.position.y = 0.02; g.add(stand);
    const body = lathe([[0.0, 0.0], [0.085, 0.0], [0.088, 0.44], [0.07, 0.5], [0.03, 0.53], [0.0, 0.53]], M.red, 28);
    body.position.y = 0.04; g.add(body);
    const neck = cyl(0.022, 0.026, 0.08, M.steel, 14); neck.position.y = 0.61; g.add(neck);
    const lever = rbox(0.11, 0.016, 0.03, 0.005, M.black); lever.position.set(0.03, 0.66, 0); g.add(lever);
    g.add(tube([[0.03, 0.62, 0.02], [0.13, 0.46, 0.06], [0.1, 0.24, 0.08]], 0.01, M.black, 14));
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), M.white);
    label.position.set(0, 0.3, 0.089); g.add(label);
    return g;
  },

  /* 코스 기록 표석 — 18번 홀 카트길. 둥글린 화강암 + 놋쇠 명판.
     ⚠️ 재질을 objMat() 공용에서 빌리지 않는다 — 바깥 물건은 하늘 환경맵(markOut)을 받는데,
        공용 재질에 표시하면 실내 석상까지 하늘을 비추게 된다. */
  stone(o) {
    const g = new THREE.Group();
    const gran = new THREE.MeshStandardMaterial({ color: 0x5E5A55, roughness: 0.7, metalness: 0.02 });
    const granD = new THREE.MeshStandardMaterial({ color: 0x3E3B37, roughness: 0.8, metalness: 0.02 });
    const base = rbox(1.0, 0.14, 0.56, 0.03, granD); base.position.y = 0.07; g.add(base);
    const body = rbox(0.86, 0.9, 0.3, 0.05, gran); body.position.y = 0.6; body.rotation.x = -0.1; g.add(body);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.36),
      new THREE.MeshStandardMaterial({
        map: textTex(o.lines || ['코스'], { size: 44, w: 620, h: 320, bg: '#C9A24A', fg: '#1A1206', rule: 'rgba(40,30,10,.5)' }),
        roughness: 0.38, metalness: 0.55,
      }));
    pl.position.set(0, 0.66, 0.166); pl.rotation.x = -0.1; g.add(pl);
    return g;
  },

  /* ══════════════════════════════════════════════════════════
     우승자의 방 전용 — 전리품
     ══════════════════════════════════════════════════════════ */

  /* 대형 우승컵 — 흰 플린스 + 명판 + 회전체 컵 + 귀 손잡이 + 뚜껑 */
  bigcup(o) {
    const M = objMat(), g = new THREE.Group();
    const H = plinth(g, 0.66, 0.6, 0.66, M);
    if (o.lines) { const pl = plaque(o.lines, 0.44, 0.16); pl.position.set(0, 0.36, 0.331); g.add(pl); }
    const foot = lathe([[0.0, 0.0], [0.17, 0.0], [0.17, 0.03], [0.13, 0.05], [0.06, 0.08]], M.walnutD, 36);
    foot.position.y = H; g.add(foot);
    // 컵 — 굽 · 자루 · 잔(바깥 윤곽만 — 안쪽은 뚜껑이 덮는다)
    const y0 = H + 0.02;
    const prof = [
      [0.0, 0.0], [0.15, 0.0], [0.15, 0.035], [0.06, 0.09], [0.042, 0.2],
      [0.055, 0.26], [0.14, 0.3], [0.235, 0.44], [0.255, 0.66], [0.26, 0.68],
      [0.245, 0.68], [0.24, 0.66], [0.0, 0.64],
    ];
    const cup = lathe(prof, M.brass, 48); cup.position.y = y0; g.add(cup);
    const bowl = (y) => {
      const t = y - y0;
      if (t <= 0.3) return 0.14;
      if (t <= 0.44) return 0.14 + (0.235 - 0.14) * (t - 0.3) / 0.14;
      return 0.235 + (0.255 - 0.235) * Math.min(1, (t - 0.44) / 0.22);
    };
    cupHandles(g, M.brass, y0, bowl, 1, 0.024);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.143, 0.012, 10, 40), M.brassD);
    band.rotation.x = Math.PI / 2; band.position.y = y0 + 0.3; g.add(band);
    const lid = lathe([[0.0, 0.0], [0.262, 0.0], [0.24, 0.03], [0.17, 0.07], [0.07, 0.11], [0.0, 0.12]], M.brassD, 44);
    lid.position.y = y0 + 0.68; g.add(lid);
    const knob = sphere(0.05, M.brass, 20); knob.position.y = y0 + 0.84; g.add(knob);
    return g;
  },

  /* 월계관 — 흰 플린스 위 유리 진열장 안, 벨벳 쿠션에 올린다 */
  laurel() {
    const M = objMat(), g = new THREE.Group();
    const H = plinth(g, 0.58, 0.86, 0.58, M);
    const cush = lathe([[0.0, 0.0], [0.19, 0.012], [0.2, 0.045], [0.15, 0.08], [0.0, 0.085]], M.velvet, 32);
    cush.position.y = H; g.add(cush);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.009, 8, 40), M.brassD);
    ring.rotation.x = Math.PI / 2; ring.position.y = H + 0.1; g.add(ring);
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2, side = i % 2 ? 1 : -1;
      const geo = new THREE.SphereGeometry(0.05, 10, 7); geo.scale(0.3, 0.12, 1);
      const leaf = new THREE.Mesh(geo, i % 3 ? M.brass : M.brassD);     // 금박 월계관
      leaf.position.set(Math.cos(a) * 0.165, H + 0.1 + side * 0.02, Math.sin(a) * 0.165);
      leaf.rotation.set(0, -a, side * 0.5);
      g.add(leaf);
    }
    // 유리 진열장 — 모서리에 가는 놋쇠 선
    const cw = 0.5, ch = 0.42;
    const glass = new THREE.Mesh(new THREE.BoxGeometry(cw, ch, cw), M.glass);
    glass.position.y = H + ch / 2; g.add(glass);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const e = box(0.008, ch, 0.008, M.brass); e.position.set(sx * cw / 2, H + ch / 2, sz * cw / 2); g.add(e);
    }
    const lidE = box(cw + 0.01, 0.01, cw + 0.01, M.brass); lidE.position.y = H + ch; g.add(lidE);
    return g;
  },

  /**
   * 골프백 조상 — 흰 플린스 위 청동 백. 클럽 헤드가 위로 부채처럼 펼쳐진다.
   * 사람 형태보다 사물이 같은 폴리곤 예산에서 압도적으로 유리하다(관절이 없어 틀릴 여지가 없다).
   * @param {number} o.pose 0..n 클럽 구성·기울기를 조금씩 바꿔 복사 티를 없앤다
   */
  bagStatue(o) {
    const M = objMat(), g = new THREE.Group();
    const v = (o.pose || 0) % 3;
    const H = plinth(g, 0.86, 1.2, 0.86, M);
    if (o.lines) { const pl = plaque(o.lines, 0.58, 0.17, { pw: 620, ph: 180 }); pl.position.set(0, 0.72, 0.431); g.add(pl); }

    const B = new THREE.Group();
    B.position.y = H;
    B.rotation.y = o.face || 0;
    const body = lathe([
      [0.0, 0.0], [0.15, 0.0], [0.165, 0.06], [0.165, 0.68],
      [0.185, 0.92], [0.195, 1.0], [0.175, 1.02], [0.155, 0.96], [0.0, 0.94],
    ], M.bronze, 32);
    B.add(body);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.017, 10, 32), M.brassD);
    rim.rotation.x = Math.PI / 2; rim.position.y = 1.01; B.add(rim);
    const mouth = cyl(0.168, 0.168, 0.02, M.black, 28); mouth.position.y = 0.99; B.add(mouth);
    const pk = lathe([[0.0, 0.0], [0.115, 0.02], [0.125, 0.14], [0.1, 0.24], [0.0, 0.26]], M.bronzeD, 20);
    pk.scale.set(1, 1, 0.62); pk.position.set(0, 0.34, 0.135); B.add(pk);
    const pkTop = box(0.2, 0.022, 0.06, M.brassD); pkTop.position.set(0, 0.6, 0.155); B.add(pkTop);
    B.add(tube([[-0.15, 0.95, -0.1], [-0.3, 0.6, -0.2], [-0.22, 0.24, -0.14]], 0.028, M.bronzeD, 16));
    const KIT = [
      [-0.3, -0.12, 0.46, 'driver'], [-0.13, -0.05, 0.36, 'iron'], [0.02, 0.02, 0.32, 'iron'],
      [0.17, 0.07, 0.3, 'wedge'], [0.31, 0.13, 0.26, 'putter'],
    ];
    KIT.forEach(([az, ax, len, kind]) => {
      const c = new THREE.Group();
      c.position.set(0, 0.98, 0);
      c.rotation.set(ax + (v - 1) * 0.03, 0, az + (v - 1) * 0.04);
      const shaft = cyl(0.011, 0.014, len, M.steel, 10); shaft.position.y = len / 2; c.add(shaft);
      let head;
      if (kind === 'driver') { head = sphere(0.088, M.bronzeD, 16); head.scale.set(1.25, 0.82, 1.0); head.position.y = len + 0.06; }
      else if (kind === 'putter') { head = rbox(0.15, 0.036, 0.05, 0.008, M.steel); head.position.y = len + 0.02; }
      else { head = rbox(0.1, 0.075, 0.026, 0.006, M.steel); head.rotation.x = kind === 'wedge' ? 0.42 : 0.24; head.position.y = len + 0.035; }
      c.add(head);
      B.add(c);
    });
    g.add(B);
    return g;
  },

  /** 드라이버 조상 — 흰 플린스 위에 세운 대형 드라이버 하나 */
  clubStatue(o) {
    const M = objMat(), g = new THREE.Group();
    const H = plinth(g, 0.86, 1.2, 0.86, M);
    if (o.lines) { const pl = plaque(o.lines, 0.58, 0.17, { pw: 620, ph: 180 }); pl.position.set(0, 0.72, 0.431); g.add(pl); }
    const C = new THREE.Group();
    C.position.y = H;
    C.rotation.y = o.face || 0;
    C.rotation.z = 0.13;
    const head = sphere(0.2, M.bronzeD, 24); head.scale.set(1.35, 0.86, 1.06); head.position.y = 0.17; C.add(head);
    const face = rbox(0.03, 0.2, 0.24, 0.008, M.steel); face.position.set(-0.24, 0.19, 0); C.add(face);
    const hosel = cyl(0.032, 0.042, 0.14, M.bronze, 14); hosel.position.set(0.13, 0.34, 0); hosel.rotation.z = -0.24; C.add(hosel);
    const shaft = cyl(0.019, 0.03, 1.34, M.steel, 16); shaft.position.y = 1.05; C.add(shaft);
    const grip = cyl(0.03, 0.036, 0.34, M.black, 14); grip.position.y = 1.86; C.add(grip);
    const cap = sphere(0.034, M.brass, 12); cap.position.y = 2.04; C.add(cap);
    g.add(C);
    return g;
  },

  /* 메달 진열 — 낮은 흰 플린스 + 검은 강철 거치대 */
  medals(o) {
    const M = objMat(), g = new THREE.Group();
    const n = Math.max(1, Math.min(7, o.count || 3));
    const H = plinth(g, 0.72, 0.16, 0.34, M);
    for (const s of [1, -1]) {
      const post = rbox(0.03, 0.86, 0.03, 0.008, M.steelD); post.position.set(s * 0.28, H + 0.43, 0); g.add(post);
    }
    const bar = rbox(0.6, 0.025, 0.025, 0.008, M.steelD); bar.position.y = H + 0.85; g.add(bar);
    for (let i = 0; i < n; i++) {
      const x = n === 1 ? 0 : -0.21 + (i / (n - 1)) * 0.42;
      const drop = 0.26 + (i % 2) * 0.06;
      const rib = box(0.05, drop, 0.004, i % 2 ? M.velvet : M.red);
      rib.position.set(x, H + 0.85 - drop / 2, 0.014); g.add(rib);
      const disc = lathe([[0.0, 0.0], [0.055, 0.0], [0.056, 0.008], [0.05, 0.012], [0.0, 0.012]], i % 3 ? M.brass : M.steel, 32);
      disc.rotation.x = Math.PI / 2; disc.position.set(x, H + 0.85 - drop - 0.05, 0.01); g.add(disc);
    }
    return g;
  },
};

/** 사물 하나를 만든다. 없으면 null */
function buildObject3D(key, opt) {
  const fn = OBJ_BUILD[key];
  if (!fn) return null;
  const g = fn(opt || {});
  g.userData.wall = (key === 'clock');   // 벽걸이 여부
  return g;
}

/** 대략 크기(배치 여백 계산용) — [폭, 높이] m */
const OBJ_SIZE = {
  stanchion: [1.7, 0.98], bench: [1.6, 0.5], planter: [0.45, 1.3], standee: [0.5, 1.25],
  bin: [0.32, 0.55], cooler: [0.36, 1.05], umbrella: [0.32, 0.9], trophy: [0.38, 1.12],
  book: [0.6, 1.15], clock: [0.36, 0.36], extinguisher: [0.28, 0.7],
  // 우승자의 방 전리품 — 좌대 포함이라 크다
  bigcup: [0.9, 1.5], laurel: [0.6, 1.3], medals: [0.72, 1.1],
  bagStatue: [1.0, 2.7], clubStatue: [1.0, 3.3],
  stone: [1.0, 1.1],
};
