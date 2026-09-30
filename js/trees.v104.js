/* ══════════════════════════════════════════════════════════
   실사 나무 — Blender 로 렌더한 빌보드(v85)
   ══════════════════════════════════════════════════════════
   예전 나무는 구 덩어리 · 원뿔 쌓기라 '고전 3D 게임' 의 대표 얼굴이었다.
   진짜 나무 3D 모델(Poly Haven CC0: fir_sapling_medium · tree_small_02 · island_tree_02, 각 20만~110만 면)은
   웹에서 수백 그루를 세울 수 없다 → Blender(Cycles) 로 여러 방향에서 렌더해 **판(카드)** 에 붙인다.
     · 색 판   — 흰 하늘빛만으로 렌더 = 잎 색 × 가지 속 그늘(AO). 해는 게임에서 다시 비춘다
     · 법선 판 — 카메라 기준 법선 = 카드의 탄젠트 공간 법선맵 → 해 쪽 면이 밝고 반대쪽이 어둡다(카드가 돌아도 맞다)
     · 카드는 세로축으로만 돌아 늘 카메라를 본다(원통형 빌보드). 그루마다 렌더 방향 한 칸을 골라 고정 → 튀지 않는다
     · 그림자 — 그림자 패스에서는 카드가 해를 보므로 나무 실루엣 그대로 땅에 진다
   ⚠️ 잎 알파를 그냥 밉맵하면 멀어질수록 잎이 녹아 앙상해진다 → 단계마다 알파를 키워
      '잎이 덮는 넓이' 를 원본과 같게 맞춘다(coverage-preserving mipmap).
   렌더 스크립트 · 원본 모델은 세션 스크래치패드(trees/render_bb.py · atlas.py). */

/** 아틀라스 칸 — uv [u0,v0,u1,v1], 칸 크기 w·h(m, 원본 나무 기준), pv = 밑동 높이(칸 아래에서 비율), th = 나무 키(m) */
const TREE_ATLAS = {
  conifer: { file: 'trees_conifer', cells: [
    [0, 0.5, 0.25, 1, 6.133, 12.266, 8.83], [0.25, 0.5, 0.5, 1, 6.133, 12.266, 8.83], [0.5, 0.5, 0.75, 1, 6.133, 12.266, 8.83],
    [0.75, 0.5, 1, 1, 4.989, 9.977, 7.8], [0, 0, 0.25, 0.5, 4.989, 9.977, 7.8], [0.25, 0, 0.5, 0.5, 4.989, 9.977, 7.8],
    [0.5, 0, 0.75, 0.5, 7.479, 14.959, 5.91], [0.75, 0, 1, 0.5, 7.479, 14.959, 5.91]] },
  broad: { file: 'trees_broad', cells: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [(i % 4) * 0.25, 0.75 - Math.floor(i / 4) * 0.25, (i % 4) * 0.25 + 0.25, 1 - Math.floor(i / 4) * 0.25, 6.109, 6.109, 4.56])
    .concat([0, 1, 2, 3, 4, 5, 6, 7].map((i) => [(i % 4) * 0.25, 0.25 - Math.floor(i / 4) * 0.25, (i % 4) * 0.25 + 0.25, 0.5 - Math.floor(i / 4) * 0.25, 6.916, 6.916, 3.41])) },
};
const TREE_PV = 0.02;
const TREE_IMG = {};           // kind → { c: 캔버스(밉맵 배열), n: 이미지 }

/** 잎 덮는 넓이를 지키는 밉맵 — ImageData 배열(1×1 까지).
    색(불투명)과 알파(회색)를 **따로** 줄여 합친다. 캔버스는 알파를 곱한 채 저장해서 알파 0 아래 색이 검게 사라지고,
    그게 밉맵에서 섞이면 멀리 있는 잎 가장자리가 검게 번진다. ImageData 는 곱하지 않은 값 그대로 올라간다. */
function coverageMips(rgbSrc, aSrc, cut = 0.5) {
  const out = [];
  let w = rgbSrc.width, h = rgbSrc.height;
  const draw = (src, W, H) => {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d', { willReadFrequently: true }); c.imageSmoothingQuality = 'high'; c.drawImage(src, 0, 0, W, H);
    return cv;
  };
  let rc = draw(rgbSrc, w, h), ac = draw(aSrc, w, h);
  const T = cut * 255;
  let cover = -1;
  for (;;) {
    const rd = rc.getContext('2d').getImageData(0, 0, w, h).data, ad = ac.getContext('2d').getImageData(0, 0, w, h).data;
    const im = new ImageData(w, h), d = im.data;
    let s = 1;
    if (cover < 0) { let k = 0; for (let i = 0; i < ad.length; i += 4) if (ad[i] > T) k++; cover = k / (w * h); }
    else if (w >= 4 && h >= 4) {
      const want = cover * w * h;
      const cnt = (m) => { let k = 0; for (let i = 0; i < ad.length; i += 4) if (ad[i] * m > T) k++; return k; };
      let lo = 1, hi = 4;
      for (let it = 0; it < 12; it++) { const m = (lo + hi) / 2; if (cnt(m) < want) lo = m; else hi = m; }
      s = (lo + hi) / 2;
    }
    for (let i = 0; i < d.length; i += 4) {
      d[i] = rd[i]; d[i + 1] = rd[i + 1]; d[i + 2] = rd[i + 2]; d[i + 3] = Math.min(255, ad[i] * s);
    }
    out.push(im);
    if (w === 1 && h === 1) break;
    w = Math.max(1, w >> 1); h = Math.max(1, h >> 1);
    rc = draw(rc, w, h); ac = draw(ac, w, h);
  }
  return out;
}

/** 받기 — pbr.js 의 loadPBR 이 같이 부른다 */
function loadTrees(max) {
  return Promise.all(Object.entries(TREE_ATLAS).map(([kind, a]) => Promise.all([
    pbrImage(PBR_DIR + a.file + '_c.webp'), pbrImage(PBR_DIR + a.file + '_a.png'), pbrImage(PBR_DIR + a.file + '_n.webp'),
  ]).then(([c, al, n]) => {
    if (!c || !al || !n) return;
    const W = Math.min(max, c.width);
    TREE_IMG[kind] = { c: coverageMips(pbrShrink(c, W), pbrShrink(al, W)), n: pbrShrink(n, W) };
  })));
}

const BB_VERT_HEAD = `
  attribute vec4 aCell;      // 칸 uv
  attribute vec3 aSize;      // 카드 폭 · 높이(m) · 밑동 비율
  vec3 bbWorld(vec3 p, out vec3 toCam) {
    vec3 C = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec2 d = cameraPosition.xz - C.xz;
    d = length(d) > 1e-4 ? normalize(d) : vec2(0.0, 1.0);
    toCam = vec3(d.x, 0.0, d.y);
    vec3 right = vec3(d.y, 0.0, -d.x);
    return C + right * (p.x * aSize.x) + vec3(0.0, (p.y - aSize.z) * aSize.y, 0.0);
  }
`;
function bbPatch(sh, depth) {
  sh.vertexShader = sh.vertexShader
    .replace('#include <common>', '#include <common>\n' + BB_VERT_HEAD)
    .replace('#include <uv_vertex>', '#include <uv_vertex>\n  vec2 bbUv = mix(aCell.xy, aCell.zw, uv);\n#ifdef USE_MAP\n  vMapUv = bbUv;\n#endif\n#ifdef USE_NORMALMAP\n  vNormalMapUv = bbUv;\n#endif')
    .replace('#include <begin_vertex>', 'vec3 bbToCam; vec3 bbW = bbWorld(position, bbToCam);\n  vec3 transformed = vec3(0.0);')
    .replace('#include <project_vertex>', 'vec4 mvPosition = viewMatrix * vec4(bbW, 1.0);\n  gl_Position = projectionMatrix * mvPosition;');
  if (!depth) {
    sh.vertexShader = sh.vertexShader
      .replace('#include <beginnormal_vertex>', 'vec3 objectNormal = vec3(0.0, 0.0, 1.0);')
      .replace('#include <defaultnormal_vertex>', '#include <defaultnormal_vertex>\n  { vec3 tc; bbWorld(position, tc); transformedNormal = normalize((viewMatrix * vec4(tc, 0.0)).xyz); }')
      .replace('#include <worldpos_vertex>', 'vec4 worldPosition = vec4(bbW, 1.0);');
  }
}

/** 나무 카드 묶음 — list: [{ x, y, z (m), h (나무 키 m), cell?, tint? }] */
function treeCards(kind, list, opt = {}) {
  const A = TREE_ATLAS[kind], I = TREE_IMG[kind];
  if (!I || !list.length) return null;
  if (!A.mat) {
    const aniso = M.renderer ? M.renderer.capabilities.getMaxAnisotropy() : 4;
    const map = new THREE.Texture(I.c[0]);
    map.mipmaps = I.c; map.generateMipmaps = false;
    map.colorSpace = THREE.SRGBColorSpace; map.minFilter = THREE.LinearMipmapLinearFilter; map.anisotropy = Math.min(4, aniso);
    map.needsUpdate = true;
    const nrm = new THREE.Texture(I.n); nrm.minFilter = THREE.LinearMipmapLinearFilter; nrm.needsUpdate = true;
    const mat = new THREE.MeshStandardMaterial({ map, normalMap: nrm, alphaTest: 0.5, roughness: 0.92, metalness: 0,
      normalScale: new THREE.Vector2(1, 1) });
    mat.userData.out = true; mat.userData.envK = 0.9;
    mat.onBeforeCompile = (sh) => bbPatch(sh, false);
    mat.customProgramCacheKey = () => 'bbTree';
    const dm = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: 0.5 });
    dm.onBeforeCompile = (sh) => bbPatch(sh, true);
    dm.customProgramCacheKey = () => 'bbTreeDepth';
    A.mat = mat; A.depth = dm;
  }
  const geo = new THREE.PlaneGeometry(1, 1); geo.translate(0, 0.5, 0);
  const n = list.length;
  const cell = new Float32Array(n * 4), size = new Float32Array(n * 3);
  const mesh = new THREE.InstancedMesh(geo, A.mat, n);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  list.forEach((t, i) => {
    const ci = t.cell != null ? t.cell % A.cells.length : Math.floor(Math.random() * A.cells.length);
    const c = A.cells[ci], s = t.h / c[6];
    cell.set([c[0], c[1], c[2], c[3]], i * 4);
    // 올리브꼴(island_tree)은 밑동에 흙 판이 붙어 있다 — 땅 속으로 조금 묻는다
    size.set([c[4] * s, c[5] * s, TREE_PV + (c[6] < 4 ? 0.03 : 0)], i * 3);
    m4.makeTranslation(t.x, t.y, t.z); mesh.setMatrixAt(i, m4);
    mesh.setColorAt(i, col.setRGB(1, 1, 1).multiplyScalar(t.tint || 1));
  });
  geo.setAttribute('aCell', new THREE.InstancedBufferAttribute(cell, 4));
  geo.setAttribute('aSize', new THREE.InstancedBufferAttribute(size, 3));
  mesh.customDepthMaterial = A.depth;
  mesh.frustumCulled = false;                   // 카드는 셰이더에서 펼쳐지므로 경계구가 맞지 않는다
  mesh.castShadow = opt.shadow !== false; mesh.receiveShadow = true;
  mesh.userData.keep = true;                    // 배칭(batchStatic)에 섞지 않는다
  return mesh;
}
const treesReady = () => !!(TREE_IMG.conifer && TREE_IMG.broad);
