/* ══════════════════════════════════════════════════════════
   실사 재질 · 환경광 · 하늘 사진 (v84)
   ══════════════════════════════════════════════════════════
   캔버스로 만든 재질(tex.js)은 결이 수학적이라 아무리 다듬어도 '고전 3D 게임' 으로 읽혔다.
   → 실제 촬영 스캔 재질(Poly Haven, CC0 — 출처 표기 의무 없음, 상업적 사용 가능)로 바꾼다.
     · 텍스처 세트 = 색(_d) · 법선(_n, OpenGL 방향) · 거칠기(_r) 세 장, 1k JPG
     · 방마다 색은 **원래 디자인 색으로 맞춘다** — 재질 평균색 → 목표색 비율을 color 로 곱한다.
       사진의 결·얼룩은 그대로 남고 방의 색 설계는 유지된다.
     · 환경맵 — 바깥은 골프장 HDRI(limpopo_golf_course), 실내는 밝은 홀 HDRI(photo_studio_loft_hall)
     · 하늘 — 구름 사진(kloofendal_48d_partly_cloudy_puresky)을 하늘 돔에 입힌다
   하나라도 못 받으면 그 자리만 예전 캔버스 재질로 돌아간다(화면이 깨지지 않게).
   폰은 GPU 메모리가 작아 512 로 줄여 올린다(1k 27장 ≈ 150MB → 512 ≈ 38MB).

   원본 · 가공: assets/tex/ — 1k JPG 를 다시 압축, HDRI 는 512×256 로 줄이고 해를 눌렀다
   (해는 방향광이 따로 비춘다. 환경맵 속 해까지 두면 광택면이 두 번 탄다). */

const PBR_DIR = (window.MUSEUM_CDN || '') + 'assets/tex/';        // CDN 을 쓰면 index.html 의 MUSEUM_CDN 만 바꾼다
/** 재질 세트 — tile = 텍스처 한 장이 덮는 실제 크기(m), avg = 색 텍스처 평균(선형), r = 거칠기 평균 */
const PBR_SET = {
  marble_01:         { tile: 1.5,  avg: [0.4431, 0.3379, 0.1945] },
  laminate_floor_02: { tile: 1.7,  avg: [0.3312, 0.2190, 0.1272] },
  wood_floor:        { tile: 1.7,  avg: [0.2176, 0.1175, 0.0554] },
  wood_floor_deck:   { tile: 1.8,  avg: [0.1652, 0.0376, 0.0059] },
  plastered_wall_04: { tile: 3.2,  avg: [0.2664, 0.2554, 0.2444] },
  plank_flooring_04: { tile: 2.0,  avg: [0.0551, 0.0187, 0.0088] },
  velour_velvet:     { tile: 0.6,  avg: [0.4218, 0.0269, 0.0637] },
  concrete_wall_008: { tile: 2.7,  avg: [0.2664, 0.2371, 0.1618] },
  concrete_pavement: { tile: 1.8,  avg: [0.2160, 0.1780, 0.1362] },
  // 잔디 — Poly Haven 버뮤다그라스(grass_bermuda_01) 포기 7700개를 Blender 로 1m 타일에 심어 위에서 찍었다(이음매 없음)
  turf:              { tile: 1.0,  avg: [0.1118, 0.1096, 0.0432] },
  sand_01:           { tile: 1.5,  avg: [0.3819, 0.3062, 0.1622] },
  rock_01:           { tile: 1.2,  avg: [0.1835, 0.1501, 0.1140] },
};
/** 테마 밖에서 쓰는 세트(지형 — pbrTerrain) */
const PBR_EXTRA = ['sand_01', 'rock_01'];
/* 테마 → 벽/바닥 슬롯. tint = 맞출 색(sRGB), k = 맞추는 정도(1 = 평균색을 정확히, 0 = 사진 색 그대로),
   rough = 거칠기 배율(광택 바닥은 낮춘다), n = 법선 세기, tile = 판 크기(m, 세트 기본값 대신). 없는 슬롯은 캔버스 재질 그대로
   외벽(v87) — 노출 콘크리트는 햇빛 아래 결이 사라져 '크림색 상자' 로 보였다 → 줄눈이 보이는 라임스톤 대형 판 */
const PBR_THEME = {
  marble:  { wall: { set: 'plastered_wall_04', tint: '#D2CABC' }, floor: { set: 'marble_01', tint: '#CFC7B8', k: 0.85, rough: 0.36 } },
  gallery: { wall: { set: 'plastered_wall_04', tint: '#DED8CC' }, floor: { set: 'laminate_floor_02', tint: '#A88460', k: 0.6 } },
  oak:     { wall: { set: 'plastered_wall_04', tint: '#D6CFC2' }, floor: { set: 'laminate_floor_02', tint: '#9A7650', k: 0.6 } },
  walnut:  { wall: { set: 'plank_flooring_04', tint: '#6A4E36', k: 0.55, rough: 0.9 }, floor: { set: 'wood_floor', tint: '#7E5E40', k: 0.5 } },
  velvet:  { wall: { set: 'velour_velvet', tint: '#561A24', k: 1, n: 0.5 }, floor: { set: 'wood_floor', tint: '#5A3E2A', k: 0.6 } },
  archive: { wall: { set: 'plastered_wall_04', tint: '#9FAE9F' }, floor: { set: 'marble_01', tint: '#C9C6BC', k: 0.85, rough: 0.55 } },
  dark:    { wall: { set: 'plastered_wall_04', tint: '#3A3638' } },
  deck:    { wall: { set: 'marble_01', tint: '#BDB4A5', k: 0.9, rough: 1.25, tile: 3.2, n: 1.3 }, floor: { set: 'wood_floor_deck', tint: '#7A5236', k: 0.45 } },
  paver:   { wall: { set: 'marble_01', tint: '#BDB4A5', k: 0.9, rough: 1.25, tile: 3.2, n: 1.3 }, floor: { set: 'concrete_pavement', tint: '#938B7F', k: 0.8 } },
  facade:  { wall: { set: 'marble_01', tint: '#BDB4A5', k: 0.9, rough: 1.25, tile: 3.2, n: 1.3 }, floor: { set: 'concrete_pavement', tint: '#938B7F', k: 0.8 } },
  lawn:    { wall: { set: 'marble_01', tint: '#BDB4A5', k: 0.9, rough: 1.25, tile: 3.2, n: 1.3 }, floor: { set: 'turf', tint: '#3E6E2C', k: 1 } },
};
/** 하늘 사진 — 가로 4096 = 360°, 세로 1152 = 위 90° ~ 지평선 아래 11.25°(원본 2048 줄 중 위 1152 줄) */
const PBR_SKY = { file: 'sky.jpg', crop: 1152 / 2048, sunU: 0.6032 };
/** HDRI 의 해 자리(u) — 해 방향을 SUN_DIR 과 맞춰 돌린다 */
const PBR_ENV = { out: { file: 'env_out.hdr', sunU: 0.5996 }, in: { file: 'env_in.hdr', sunU: 0.6484 } };

const PBR = { img: {}, sky: null, env: {}, ok: false };

function pbrImage(url) {
  return new Promise((res) => {
    const im = new Image();
    if (/^https?:/.test(url)) im.crossOrigin = 'anonymous';     // 다른 곳(CDN)의 그림은 이게 있어야 WebGL 이 쓴다
    im.decoding = 'async';
    im.onload = () => res(im);
    im.onerror = () => res(null);
    im.src = url;
  });
}
/** 폰 — 절반 크기로 줄인다(GPU 메모리) */
function pbrShrink(im, max) {
  if (!im || im.width <= max) return im;
  const s = max / im.width, cv = document.createElement('canvas');
  cv.width = Math.round(im.width * s); cv.height = Math.round(im.height * s);
  cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
  return cv;
}

/** Radiance .hdr(평문 RGBE — 가공 때 RLE 없이 썼다) → Float32 RGB */
function parseHdr(buf) {
  const b = new Uint8Array(buf);
  let i = 0, W = 0, H = 0;
  for (;;) {
    let j = i; while (j < b.length && b[j] !== 10) j++;
    const line = String.fromCharCode.apply(null, b.subarray(i, j)); i = j + 1;
    const m = /^-Y (\d+) \+X (\d+)/.exec(line);
    if (m) { H = +m[1]; W = +m[2]; break; }
    if (j >= b.length) return null;
  }
  if (b.length - i < W * H * 4) return null;          // RLE 파일은 받지 않는다(가공 규칙)
  const out = new Float32Array(W * H * 3);
  for (let p = 0; p < W * H; p++, i += 4) {
    const e = b[i + 3];
    const f = e ? Math.pow(2, e - 136) : 0;
    out[p * 3] = b[i] * f; out[p * 3 + 1] = b[i + 1] * f; out[p * 3 + 2] = b[i + 2] * f;
  }
  return { w: W, h: H, data: out };
}

/** 전부 받는다 — 제한 시간 안에 온 것만 쓴다(느린 망에서 입장이 막히지 않게) */
function loadPBR(timeoutMs = 15000) {
  if (PBR.p) return PBR.p;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const max = coarse ? 512 : 1024;
  const jobs = [];
  const used = new Set();
  for (const th of Object.values(PBR_THEME)) for (const s of Object.values(th)) used.add(s.set);
  PBR_EXTRA.forEach((n) => used.add(n));
  for (const name of used) {
    jobs.push(Promise.all(['d', 'n', 'r'].map((k) => pbrImage(PBR_DIR + name + '_' + k + '.jpg')))
      .then(([d, n, r]) => { if (d && n && r) PBR.img[name] = { d: pbrShrink(d, max), n: pbrShrink(n, max), r: pbrShrink(r, max) }; }));
  }
  jobs.push(pbrImage(PBR_DIR + PBR_SKY.file).then((im) => { PBR.sky = im; }));
  for (const [key, e] of Object.entries(PBR_ENV)) {
    jobs.push(fetch(PBR_DIR + e.file).then((r) => (r.ok ? r.arrayBuffer() : null))
      .then((buf) => { const h = buf && parseHdr(buf); if (h) PBR.env[key] = h; })
      .catch(() => {}));
  }
  if (typeof loadTrees === 'function') jobs.push(loadTrees(coarse ? 1024 : 2048).catch((e) => console.warn('trees', e)));
  const all = Promise.all(jobs).then(() => { PBR.ok = true; });
  // 사람은 재질이 끝난 뒤(또는 제한 시간 뒤) 뒤에서 받는다
  if (typeof loadPeople === 'function') PEOPLE.p = Promise.race([all, new Promise((r) => setTimeout(r, timeoutMs))]).then(() => loadPeople());
  PBR.p = Promise.race([all, new Promise((r) => setTimeout(r, timeoutMs))]);
  return PBR.p;
}
/* ⚠️ v92 — 예전엔 스크립트가 읽히자마자 20MB 가까이(재질 · 나무 · 사람)를 한꺼번에 받기 시작했다.
   운영 서버에서는 그 큰 파일들이 회선을 차지해 **아카이브 API(표지에 필요한 작은 요청)가 밀려**
   10초 감시에 걸렸다("데이터 준비 단계에서 멈춤"). → boot() 가 아카이브를 받은 뒤에 시작하고,
   사람(people.js, 약 11MB)은 재질이 다 온 다음 뒤에서 받는다(입장을 막지 않는다). */

/** 테마 슬롯 → themeTex 가 쓰는 재료. 없으면 null(캔버스 재질로) */
function pbrSlot(theme, kind) {
  const slot = PBR_THEME[theme] && PBR_THEME[theme][kind];
  const im = slot && PBR.img[slot.set];
  if (!im) return null;
  const set = PBR_SET[slot.set];
  const col = new THREE.Color(1, 1, 1);
  if (slot.tint) {
    const t = new THREE.Color(slot.tint);                  // sRGB 16진 → three 가 선형으로 바꿔 둔다
    const k = slot.k == null ? 1 : slot.k;
    const f = [t.r / set.avg[0], t.g / set.avg[1], t.b / set.avg[2]].map((v) => clamp(Math.pow(v, k), 0.2, 3.2));
    col.setRGB(f[0], f[1], f[2]);
  }
  return { img: im, tile: slot.tile || set.tile, color: col, roughK: slot.rough || 1, nScale: slot.n || 1 };
}

/* ── 하늘 · 환경맵 ─────────────────────────────────────── */
/** 방향 → 파노라마 u. 해가 SUN_DIR 쪽에 오도록 rot 을 더한다 */
function pbrRot(sunU) {
  return sunU - Math.atan2(SUN_DIR.z, SUN_DIR.x) / (Math.PI * 2);
}
const PANO_VERT = `varying vec3 vDir;
  void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w; }`;

/** 하늘 사진 돔 재질 — 없으면 null */
function pbrSkyMaterial() {
  if (!PBR.sky) return null;
  const tex = new THREE.Texture(PBR.sky);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.generateMipmaps = false;                 // 늘 확대해서 보므로 밉맵이 필요 없고, 이음매(u 0↔1)도 생기지 않는다
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uMap: { value: tex }, uRot: { value: pbrRot(PBR_SKY.sunU) }, uCrop: { value: PBR_SKY.crop }, uGain: { value: 1.15 },
      uHaze: { value: new THREE.Color(0xDCE2E2) } },
    vertexShader: PANO_VERT,
    fragmentShader: `uniform sampler2D uMap; uniform float uRot, uCrop, uGain; uniform vec3 uHaze; varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float u = fract(atan(d.z, d.x) / 6.2831853 + uRot);
        float v = acos(clamp(d.y, -1.0, 1.0)) / 3.1415927;          // 0 = 천정, 0.5 = 지평선
        vec3 c = texture2D(uMap, vec2(u, 1.0 - min(v, uCrop - 0.004) / uCrop)).rgb;
        // 지평선 아래는 사진이 없다 — 옅은 안개색으로 닫는다(먼 능선 뒤로만 보인다)
        c = mix(c, uHaze * 0.9, smoothstep(0.5, 0.56, v));
        gl_FragColor = vec4(c * uGain, 1.0);
      }`,
  });
}

/** HDRI → PMREM 환경맵(해 방향을 맞춰 돌려서). WebGL1 은 반정밀 선형 필터가 없을 수 있어 건너뛴다 */
function pbrEnvMap(pm, key, gain = 1) {
  const e = PBR.env[key], meta = PBR_ENV[key];
  if (!e || !M.renderer.capabilities.isWebGL2) return null;
  const n = e.w * e.h, half = new Uint16Array(n * 4);
  for (let p = 0; p < n; p++) {
    half[p * 4] = THREE.DataUtils.toHalfFloat(e.data[p * 3]);
    half[p * 4 + 1] = THREE.DataUtils.toHalfFloat(e.data[p * 3 + 1]);
    half[p * 4 + 2] = THREE.DataUtils.toHalfFloat(e.data[p * 3 + 2]);
    half[p * 4 + 3] = 15360;                                   // 1.0
  }
  const tex = new THREE.DataTexture(half, e.w, e.h, THREE.RGBAFormat, THREE.HalfFloatType);
  tex.wrapS = THREE.RepeatWrapping;
  tex.magFilter = tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uMap: { value: tex }, uRot: { value: pbrRot(meta.sunU) }, uGain: { value: gain } },
    vertexShader: `varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform sampler2D uMap; uniform float uRot, uGain; varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float u = fract(atan(d.z, d.x) / 6.2831853 + uRot);
        float v = acos(clamp(d.y, -1.0, 1.0)) / 3.1415927;
        gl_FragColor = vec4(texture2D(uMap, vec2(u, v)).rgb * uGain, 1.0);   // 데이터 첫 줄 = 천정(v 0)
      }`,
  });
  const sc = new THREE.Scene();
  sc.add(new THREE.Mesh(new THREE.SphereGeometry(50, 64, 32), mat));
  const rt = pm.fromScene(sc, 0);
  tex.dispose(); mat.dispose();
  return rt.texture;
}

/* ── 지형 — 칠한 코스 지도(러프·페어웨이·그린·벙커 색) 위에 실사 잔디·모래 결을 곱한다 ──────
   코스 지도는 그대로 둔 채 **결만** 얹는다: 결 텍스처를 제 평균색으로 나눠(평균 1) 곱하므로
   멀리서는(밉맵 평균) 원래 색 그대로, 가까이서는 잎 한 올 한 올이 보인다.
   어디가 잔디이고 모래인지는 지도 색으로 가른다 — 초록이 짙으면 잔디, 붉은빛-푸른빛 차가 크면 모래(카트길 회색은 둘 다 아님). */
function pbrTerrain(mat, r) {
  const G = PBR.img.turf, S = PBR.img.sand_01;
  if (!G) return false;
  const aniso = M.renderer ? M.renderer.capabilities.getMaxAnisotropy() : 8;
  const tex = (im, srgb) => {
    const t = new THREE.Texture(im); t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = aniso; t.minFilter = THREE.LinearMipmapLinearFilter; t.needsUpdate = true; return t;
  };
  const gN = tex(G.n), gD = tex(G.d, true), sD = S ? tex(S.d, true) : gD, sN = S ? tex(S.n) : gN;
  // 지형 uv 1 = 경기 구역 폭 → 잔디 타일 1m
  gN.repeat.set(r.w / CM / PBR_SET.turf.tile, r.d / CM / PBR_SET.turf.tile);
  mat.normalMap = gN; mat.normalScale.set(0.9, 0.9);
  const sAvg = S ? PBR_SET.sand_01.avg : PBR_SET.turf.avg;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, {
      tGrassD: { value: gD }, tSandD: { value: sD }, tSandN: { value: sN },
      uGAvg: { value: new THREE.Vector3().fromArray(PBR_SET.turf.avg) }, uSAvg: { value: new THREE.Vector3().fromArray(sAvg) },
      uSandRep: { value: PBR_SET.turf.tile / (S ? PBR_SET.sand_01.tile : 1) },
    });
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D tGrassD, tSandD, tSandN; uniform vec3 uGAvg, uSAvg; uniform float uSandRep;\nfloat wG = 0.0, wS = 0.0;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        {
          vec3 b = diffuseColor.rgb;
          wG = smoothstep(0.02, 0.07, b.g - max(b.r, b.b));
          wS = smoothstep(0.18, 0.30, b.r - b.b) * (1.0 - wG);
          vec3 gd = texture2D(tGrassD, vNormalMapUv).rgb / uGAvg;
          vec3 sd = texture2D(tSandD, vNormalMapUv * uSandRep).rgb / uSAvg;
          // 모래는 지도 색이 밝아 해 아래서 하얗게 탄다(결이 사라진다) — 조금 눌러 결을 살린다
          diffuseColor.rgb *= mix(vec3(1.0), gd, wG * 0.85) * mix(vec3(1.0), sd * 0.74, wS);
        }`)
      .replace('#include <normal_fragment_maps>', THREE.ShaderChunk.normal_fragment_maps.replace(
        'vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;',
        'vec3 mapN = mix(texture2D( normalMap, vNormalMapUv ).xyz, texture2D( tSandN, vNormalMapUv * uSandRep ).xyz, wS) * 2.0 - 1.0;'));
    if (typeof lakeTerrainPatch === 'function') lakeTerrainPatch(sh);   // 물 아래 바닥 — 청록 · 일렁이는 빛(lake.js)
  };
  mat.customProgramCacheKey = () => 'terrainPBR';
  return true;
}

/** 바닥용 실사 재질(월드 uv — 기하의 uv 를 x·z 로 다시 깐다). 없으면 null */
function pbrGroundMat(geo, setName, tint, k = 0.9) {
  const im = PBR.img[setName], set = PBR_SET[setName];
  if (!im) return null;
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / set.tile, -p.getZ(i) / set.tile);
  uv.needsUpdate = true;
  const aniso = M.renderer ? M.renderer.capabilities.getMaxAnisotropy() : 8;
  const tex = (img, srgb) => {
    const t = new THREE.Texture(img); t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = aniso; t.minFilter = THREE.LinearMipmapLinearFilter; t.needsUpdate = true; return t;
  };
  const t = new THREE.Color(tint);
  const f = [t.r / set.avg[0], t.g / set.avg[1], t.b / set.avg[2]].map((v) => clamp(Math.pow(v, k), 0.2, 3.2));
  const m = new THREE.MeshStandardMaterial({ map: tex(im.d, true), normalMap: tex(im.n), roughnessMap: tex(im.r), roughness: 1, metalness: 0,
    normalScale: new THREE.Vector2(1.2, 1.2) });
  m.color.setRGB(f[0], f[1], f[2]);
  m.userData.out = true;
  return m;
}

/** 돌처럼 둥근 물체용 — 세 방향 투영(triplanar). 구의 uv 는 극에서 결이 한 점으로 오그라든다.
    결은 월드 좌표에 붙는다(움직이지 않는 조각에만 쓴다). 없으면 null */
function pbrTriplanarMat(setName, tint, k = 0.9, scale) {
  const im = PBR.img[setName], set = PBR_SET[setName];
  if (!im) return null;
  const aniso = M.renderer ? M.renderer.capabilities.getMaxAnisotropy() : 8;
  const tex = (img, srgb) => {
    const t = new THREE.Texture(img); t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = aniso; t.minFilter = THREE.LinearMipmapLinearFilter; t.needsUpdate = true; return t;
  };
  const t = new THREE.Color(tint);
  const f = [t.r / set.avg[0], t.g / set.avg[1], t.b / set.avg[2]].map((v) => clamp(Math.pow(v, k), 0.2, 3.2));
  const m = new THREE.MeshStandardMaterial({ map: tex(im.d, true), normalMap: tex(im.n), roughnessMap: tex(im.r), roughness: 1, metalness: 0 });
  m.color.setRGB(f[0], f[1], f[2]);
  m.userData.out = true;
  const S = 1 / (scale || set.tile);
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTriS = { value: S };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTriP; varying vec3 vTriN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vTriP = (modelMatrix * vec4(transformed, 1.0)).xyz; vTriN = normalize(mat3(modelMatrix) * objectNormal);');
    const TRI = `
      vec3 triW() { vec3 w = pow(abs(normalize(vTriN)), vec3(4.0)); return w / (w.x + w.y + w.z); }
      vec4 tri(sampler2D t) { vec3 w = triW(); vec3 p = vTriP * uTriS;
        return texture2D(t, p.zy) * w.x + texture2D(t, p.xz) * w.y + texture2D(t, p.xy) * w.z; }`;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTriP; varying vec3 vTriN; uniform float uTriS;' + TRI)
      .replace('#include <map_fragment>', 'diffuseColor *= tri(map);')
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = roughness * tri(roughnessMap).g;')
      .replace('#include <normal_fragment_maps>', `{
        // 화이트아웃 블렌드 — 축마다 법선맵을 월드 법선에 얹어 섞는다
        vec3 wn = normalize(vTriN), w = triW(), p = vTriP * uTriS;
        vec3 tX = texture2D(normalMap, p.zy).xyz * 2.0 - 1.0, tY = texture2D(normalMap, p.xz).xyz * 2.0 - 1.0, tZ = texture2D(normalMap, p.xy).xyz * 2.0 - 1.0;
        tX.xy *= normalScale; tY.xy *= normalScale; tZ.xy *= normalScale;
        tX = vec3(tX.xy + wn.zy, abs(tX.z) * wn.x);
        tY = vec3(tY.xy + wn.xz, abs(tY.z) * wn.y);
        tZ = vec3(tZ.xy + wn.xy, abs(tZ.z) * wn.z);
        vec3 nw = normalize(tX.zyx * w.x + tY.xzy * w.y + tZ.xyz * w.z);
        normal = normalize((viewMatrix * vec4(nw, 0.0)).xyz);
      }`);
  };
  m.customProgramCacheKey = () => 'tri|' + setName;
  return m;
}
