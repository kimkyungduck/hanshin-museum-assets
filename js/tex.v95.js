/**
 * tex.js — 절차적 텍스처 생성 (canvas → THREE.CanvasTexture)
 *
 * 이미지 에셋 없이 실제 재질감을 만든다. CSS 그라데이션과 결정적으로 다른 점은
 * **노이즈와 결(grain)** 이 픽셀 단위로 들어간다는 것 — 이게 없으면 어떤 조명을
 * 얹어도 "고전게임 텍스처"로 읽힌다.
 *
 * 모든 생성기는 { map, normal } 을 돌려준다(normal 은 높이차를 미분한 노멀맵).
 */

/* ── 노이즈 ─────────────────────────────────────────────── */
function rnd(seed) {                       // 결정적 난수
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** 값 노이즈 격자 + 이중선형 보간 (부드러운 얼룩) — **이음매 없이 반복된다**
 *  ⚠️ 예전엔 격자 끝을 잘라(clamp) 텍스처 한 장의 오른쪽·아래 끝이 왼쪽·위와 달랐다.
 *     벽·바닥은 텍스처를 수십 번 반복하므로 그 끝이 **2.6m 마다 선**으로 보였다
 *     (월넛 판벽 한가운데 가로 점선이 그것) — '게임 텍스처' 의 가장 흔한 표시다.
 *  → 격자 칸 수를 폭에 딱 맞추고 끝에서 처음으로 감는다(wrap). */
function valueNoise(w, h, cell, seed) {
  const R = rnd(seed);
  const nx = Math.max(1, Math.round(w / cell)), ny = Math.max(1, Math.round(h / cell));
  const cx = w / nx, cy = h / ny;
  const g = new Float32Array(nx * ny);
  for (let i = 0; i < g.length; i++) g[i] = R();
  const at = (x, y) => g[(y % ny) * nx + (x % nx)];
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const fy = y / cy, y0 = Math.floor(fy), ty = fy - y0;
    for (let x = 0; x < w; x++) {
      const fx = x / cx, x0 = Math.floor(fx), tx = fx - x0;
      const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1);
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      out[y * w + x] = (a + (b - a) * sx) + ((c + (d - c) * sx) - (a + (b - a) * sx)) * sy;
    }
  }
  return out;
}
/** 거울 접기 — 0..n 을 0..n/2..0 으로. 늘려 쓰는 결(나뭇결)이 끝에서 끊기지 않게 */
const mir = (v, n) => { const k = v % n; return (k < n / 2 ? k : n - 1 - k) | 0; };

/** 여러 옥타브 합 (프랙탈) */
function fbm(w, h, seed, octaves = 4, cell = 64) {
  const acc = new Float32Array(w * h);
  let amp = 1, tot = 0, c = cell;
  for (let o = 0; o < octaves; o++) {
    const n = valueNoise(w, h, Math.max(2, c), seed + o * 977);
    for (let i = 0; i < acc.length; i++) acc[i] += n[i] * amp;
    tot += amp; amp *= 0.5; c = Math.max(2, c / 2);
  }
  for (let i = 0; i < acc.length; i++) acc[i] /= tot;
  return acc;
}

/* ── 유틸 ──────────────────────────────────────────────── */
const SIZE = 512;

function makeCanvas(w = SIZE, h = SIZE) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

/** 회색 높이맵 → 노멀맵 텍스처 */
function heightToNormal(height, w, h, strength = 2.2) {
  const cv = makeCanvas(w, h);
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);
  const at = (x, y) => height[((y + h) % h) * w + ((x + w) % w)];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      // 정규화된 (-dx, -dy, 1)
      const len = Math.hypot(dx, dy, 1);
      const i = (y * w + x) * 4;
      img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

const mix = (a, b, t) => a + (b - a) * t;
const hex = (v) => {
  const n = parseInt(String(v).replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/* ══════════════════════════════════════════════════════════
   재질별 생성기 — 각각 {canvas, normalCanvas, rough}
   ══════════════════════════════════════════════════════════ */

/** 무채색 석고 도장벽 — 미세한 요철과 넓은 얼룩 */
function plaster(base = '#8C8880') {
  const w = SIZE, h = SIZE;
  const fine = fbm(w, h, 11, 5, 24);
  const broad = fbm(w, h, 37, 3, 220);
  const cv = makeCanvas(w, h), ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);
  const [r, g, b] = hex(base);
  for (let i = 0, p = 0; i < w * h; i++, p += 4) {
    const v = 0.86 + fine[i] * 0.16 + (broad[i] - 0.5) * 0.14;
    img.data[p] = Math.min(255, r * v);
    img.data[p + 1] = Math.min(255, g * v);
    img.data[p + 2] = Math.min(255, b * v);
    img.data[p + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return { canvas: cv, normalCanvas: heightToNormal(fine, w, h, 1.6), rough: 0.92 };
}

/** 앤틱 월넛 판벽 — 세로 결 + 나이테 + 판 이음선 */
function walnut(base = '#4A3728') {
  const w = SIZE, h = SIZE;
  // 결은 세로로 네 배 늘린다 — 높이 1/4 짜리 이음매 없는 노이즈를 한 줄씩 늘려 쓴다
  const grain = fbm(w, h / 4, 71, 4, 10);
  const ring = fbm(w, h, 5, 2, 128);
  const height = new Float32Array(w * h);
  const cv = makeCanvas(w, h), ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);
  const [r, g, b] = hex(base);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x, p = i * 4;
      // 세로로 늘린 결 — x 방향 주파수를 높이고 y 는 낮춘다
      const gy = grain[(y >> 2) * w + x];
      // 나이테: 사인 위에 노이즈를 얹어 파형을 흐트린다
      const band = Math.sin((x * 0.10) + ring[i] * 7.0) * 0.5 + 0.5;
      const v = 0.72 + gy * 0.22 + band * 0.20;
      // 판 이음선(세로) — 128px 마다
      const seam = (x % 128 < 2) ? 0.55 : 1;
      height[i] = gy * 0.6 + band * 0.4 - (seam < 1 ? 0.5 : 0);
      img.data[p] = Math.min(255, r * v * seam * 1.12);
      img.data[p + 1] = Math.min(255, g * v * seam * 1.05);
      img.data[p + 2] = Math.min(255, b * v * seam);
      img.data[p + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { canvas: cv, normalCanvas: heightToNormal(height, w, h, 2.6), rough: 0.55 };
}

/** 참나무 헤링본 마루 */
function parquet(base = '#4A3C28') {
  const w = SIZE, h = SIZE;
  const grain = fbm(w, h, 23, 4, 12);
  const height = new Float32Array(w * h);
  const cv = makeCanvas(w, h), ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);
  const [r, g, b] = hex(base);
  const BW = 32, BL = 128;                 // 널 폭·길이
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x, p = i * 4;
      // 헤링본: 45° 두 방향 블록이 교대
      const u = x + y, v2 = x - y;
      const blockA = Math.floor(u / BL) % 2 === 0;
      const across = blockA ? (v2 % BW + BW) % BW : (u % BW + BW) % BW;
      const along = blockA ? (u % BL + BL) % BL : (v2 % BL + BL) % BL;
      const edge = (across < 1.6 || along < 1.6) ? 0.5 : 1;   // 이음선
      // 널마다 색을 살짝 다르게
      const id = (Math.floor(u / BL) * 31 + Math.floor(v2 / BW) * 17) % 7;
      const tone = 0.86 + id * 0.035;
      const gv = grain[(blockA ? y : x) * w + (blockA ? x : y)];
      const val = tone * (0.82 + gv * 0.26) * edge;
      height[i] = gv * 0.5 - (edge < 1 ? 0.6 : 0);
      img.data[p] = Math.min(255, r * val * 1.08);
      img.data[p + 1] = Math.min(255, g * val);
      img.data[p + 2] = Math.min(255, b * val * 0.94);
      img.data[p + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { canvas: cv, normalCanvas: heightToNormal(height, w, h, 2.2), rough: 0.34 };
}

/** 테라조 — 큰 판 + 골재 알갱이 (로비) */
function terrazzo(base = '#55503F') {
  const w = SIZE, h = SIZE;
  const cv = makeCanvas(w, h), ctx = cv.getContext('2d');
  const [r, g, b] = hex(base);
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, w, h);
  const R = rnd(99);
  const chipCols = ['#C9C2AE', '#8A8474', '#6E6656', '#E3DCC6', '#4A4438'];
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = chipCols[(R() * chipCols.length) | 0];
    ctx.globalAlpha = 0.35 + R() * 0.5;
    const cx = R() * w, cy = R() * h, rr = 1.2 + R() * 4.2;
    ctx.beginPath();
    // 불규칙 다각형 골재
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2, rad = rr * (0.6 + R() * 0.7);
      const px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad;
      k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // 판 이음선
  ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, w, h);
  const hgt = fbm(w, h, 5, 3, 30);
  return { canvas: cv, normalCanvas: heightToNormal(hgt, w, h, 0.8), rough: 0.22 };
}

/** 카펫 — 촘촘한 파일, 반사 없음 (상영관) */
function carpet(base = '#241C22') {
  const w = SIZE, h = SIZE;
  const n = fbm(w, h, 3, 5, 6);
  const cv = makeCanvas(w, h), ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);
  const [r, g, b] = hex(base);
  for (let i = 0, p = 0; i < w * h; i++, p += 4) {
    const v = 0.78 + n[i] * 0.4;
    img.data[p] = Math.min(255, r * v);
    img.data[p + 1] = Math.min(255, g * v);
    img.data[p + 2] = Math.min(255, b * v);
    img.data[p + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return { canvas: cv, normalCanvas: heightToNormal(n, w, h, 3.2), rough: 0.98 };
}

/** 리놀륨 — 넓은 시트, 은은한 광 (기록 보관실) */
function linoleum(base = '#2C3630') {
  const w = SIZE, h = SIZE;
  const n = fbm(w, h, 41, 4, 40);
  const cv = makeCanvas(w, h), ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);
  const [r, g, b] = hex(base);
  for (let i = 0, p = 0; i < w * h; i++, p += 4) {
    const v = 0.9 + n[i] * 0.2;
    img.data[p] = Math.min(255, r * v);
    img.data[p + 1] = Math.min(255, g * v);
    img.data[p + 2] = Math.min(255, b * v);
    img.data[p + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return { canvas: cv, normalCanvas: heightToNormal(n, w, h, 0.7), rough: 0.42 };
}

/** 벨벳 — 방향성 광택 (트로피실 벽) */
function velvet(base = '#6B2230') {
  const w = SIZE, h = SIZE;
  const n = fbm(w, h, 17, 5, 8);
  const cv = makeCanvas(w, h), ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);
  const [r, g, b] = hex(base);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x, p = i * 4;
      // 세로 방향 결 + 부드러운 얼룩
      const nap = 0.82 + Math.abs(Math.sin(x * 0.9 + n[i] * 4)) * 0.14 + n[i] * 0.14;
      img.data[p] = Math.min(255, r * nap);
      img.data[p + 1] = Math.min(255, g * nap * 0.96);
      img.data[p + 2] = Math.min(255, b * nap * 0.96);
      img.data[p + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { canvas: cv, normalCanvas: heightToNormal(n, w, h, 1.1), rough: 0.95 };
}

/* ── 재질 테마 표 ──────────────────────────────────────── */
const MAT_RECIPE = {
  walnut:  { wall: () => walnut('#4A3728'), floor: () => parquet('#3E3020'), wainscot: '#3A2A1C' },
  archive: { wall: () => plaster('#7E8A80'), floor: () => linoleum('#2C3630'), wainscot: '#2A3A32' },
  velvet:  { wall: () => velvet('#5E2028'), floor: () => parquet('#3A2418'), wainscot: '#4A2018' },
  plaster: { wall: () => plaster('#8C8880'), floor: () => parquet('#4A3C28'), wainscot: '#43331F' },
  stone:   { wall: () => plaster('#9A958A'), floor: () => terrazzo('#55503F'), wainscot: '#4A3728' },
  dark:    { wall: () => plaster('#4A4448'), floor: () => carpet('#241C22'), wainscot: '#241A1E' },
  hallway: { wall: () => plaster('#7C766C'), floor: () => parquet('#3A2C1C'), wainscot: '#3A2A1C' },
};

/* ══════════════════════════════════════════════════════════
   리디자인 재질 — 밝고 매끈한 현대 미술관 쪽
   ══════════════════════════════════════════════════════════
   예전 재질(월넛 판벽·리놀륨·카펫)은 어둡고 결이 거칠어 '90년대 게임' 으로 읽혔다.
   새 재질은 ① 명도를 올리고 ② 결을 곱게 하고 ③ 반사(roughness 낮춤)로 공간감을 만든다.
   반사는 환경맵(world.js envIn/envOut)이 맡으므로 결은 은은하게만 둔다. */

/** 화이트 마블 — 큰 판(텍스처 한 장 = 판 넷) + 흐르는 결 */
function marble(base = '#E4DED2') {
  const w = SIZE, h = SIZE;
  const warp = fbm(w, h, 211, 4, 90);
  const fine = fbm(w, h, 17, 4, 14);
  const cv = makeCanvas(w, h), ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);
  const [r, g, b] = hex(base);
  const height = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x, p = i * 4;
      // 결 — 비스듬한 사인을 노이즈로 휘게 한다. 가늘고 드물게
      /* 결 — 가늘고 옅게. 예전 값(지수 14 · 진하기 0.34+0.25)은 굵은 검은 곡선이 되어
         가까이서 보면 만화 낙서처럼 읽혔다. 진짜 대리석 결은 구름 같은 얼룩 위에 가는 선이 드문드문이다 */
      const vein = Math.abs(Math.sin((x * 0.012 + y * 0.007) + warp[i] * 7.0));
      const v = Math.pow(1 - vein, 34) * 0.1 + Math.pow(1 - vein, 140) * 0.08;
      const cloud = (warp[i] - 0.5) * 0.06;
      const t = 0.97 + fine[i] * 0.035 + cloud - v;
      // 판 이음(256px = 판 하나)
      const seam = (x % 256 < 1 || y % 256 < 1) ? 0.86 : 1;
      height[i] = seam < 1 ? -0.4 : 0;
      img.data[p] = Math.min(255, r * t * seam);
      img.data[p + 1] = Math.min(255, g * t * seam);
      img.data[p + 2] = Math.min(255, b * (t + v * 0.1) * seam);
      img.data[p + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { canvas: cv, normalCanvas: heightToNormal(height, w, h, 1.0), rough: 0.16 };
}

/** 갤러리 도장벽 — 거의 결 없는 웜 화이트 */
function galleryWall(base = '#D9D3C7') {
  const w = SIZE, h = SIZE;
  const fine = fbm(w, h, 29, 4, 20);
  const broad = fbm(w, h, 91, 3, 240);
  const cv = makeCanvas(w, h), ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);
  const [r, g, b] = hex(base);
  for (let i = 0, p = 0; i < w * h; i++, p += 4) {
    const v = 0.955 + fine[i] * 0.05 + (broad[i] - 0.5) * 0.05;
    img.data[p] = Math.min(255, r * v);
    img.data[p + 1] = Math.min(255, g * v);
    img.data[p + 2] = Math.min(255, b * v);
    img.data[p + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return { canvas: cv, normalCanvas: heightToNormal(fine, w, h, 0.6), rough: 0.9 };
}

/** 오크 광폭 마루 — 헤링본이 아닌 긴 널(현대식) */
function oakPlank(base = '#A07A52') {
  const w = SIZE, h = SIZE;
  const grain = fbm(w / 4, h, 53, 4, 9);
  const cv = makeCanvas(w, h), ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);
  const [r, g, b] = hex(base);
  const height = new Float32Array(w * h);
  const PW = 64;                                  // 널 폭(텍스처 한 장 = 2m → 25cm)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x, p = i * 4;
      const row = Math.floor(y / PW);
      const shift = (row * 173) % w;              // 널마다 이음 위치가 다르다
      const along = (x + shift) % 384;
      const edge = (y % PW < 1.5 || along < 1.5) ? 0.72 : 1;
      const tone = 0.9 + ((row * 37 + Math.floor((x + shift) / 384) * 11) % 9) * 0.022;
      const gv = grain[((y * 3) % h) * (w / 4) + (x >> 2)];
      const v = tone * (0.86 + gv * 0.22) * edge;
      height[i] = edge < 1 ? -0.5 : gv * 0.2;
      img.data[p] = Math.min(255, r * v);
      img.data[p + 1] = Math.min(255, g * v);
      img.data[p + 2] = Math.min(255, b * v * 0.96);
      img.data[p + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { canvas: cv, normalCanvas: heightToNormal(height, w, h, 1.6), rough: 0.38 };
}

/** 라임스톤 외장 패널 — 150×75cm 판 줄눈 */
function limestone(base = '#C9BFAE') {
  const w = SIZE, h = SIZE;
  const fine = fbm(w, h, 61, 5, 10);
  const broad = fbm(w, h, 13, 3, 160);
  const cv = makeCanvas(w, h), ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);
  const [r, g, b] = hex(base);
  const height = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x, p = i * 4;
      const row = Math.floor(y / 128);
      const off = row % 2 ? 128 : 0;
      const joint = (y % 128 < 2 || (x + off) % 256 < 2) ? 0.7 : 1;
      const v = (0.9 + fine[i] * 0.1 + (broad[i] - 0.5) * 0.08) * joint;
      height[i] = joint < 1 ? -0.6 : fine[i] * 0.3;
      img.data[p] = Math.min(255, r * v);
      img.data[p + 1] = Math.min(255, g * v);
      img.data[p + 2] = Math.min(255, b * v);
      img.data[p + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { canvas: cv, normalCanvas: heightToNormal(height, w, h, 1.8), rough: 0.82 };
}

/** 석재 페이버(테라스) — 60cm 각 판 */
function paver(base = '#A8A093') {
  const w = SIZE, h = SIZE;
  const fine = fbm(w, h, 83, 5, 8);
  const cv = makeCanvas(w, h), ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);
  const [r, g, b] = hex(base);
  const height = new Float32Array(w * h);
  const T = 154;                                   // 2m 에 판 셋 남짓
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x, p = i * 4;
      const id = (Math.floor(x / T) * 7 + Math.floor(y / T) * 13) % 5;
      const joint = (x % T < 2 || y % T < 2) ? 0.62 : 1;
      const v = (0.88 + id * 0.03 + fine[i] * 0.12) * joint;
      height[i] = joint < 1 ? -0.7 : fine[i] * 0.4;
      img.data[p] = Math.min(255, r * v);
      img.data[p + 1] = Math.min(255, g * v);
      img.data[p + 2] = Math.min(255, b * v);
      img.data[p + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { canvas: cv, normalCanvas: heightToNormal(height, w, h, 1.8), rough: 0.78 };
}

/** 데크 — 외장용 이페 목재 */
function deckWood(base = '#7A5236') {
  const w = SIZE, h = SIZE;
  const grain = fbm(w, h / 4, 97, 4, 8);
  const cv = makeCanvas(w, h), ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);
  const [r, g, b] = hex(base);
  const height = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x, p = i * 4;
      const gap = (x % 36 < 3) ? 0.35 : 1;         // 널 사이 틈
      const id = Math.floor(x / 36) % 6;
      const gv = grain[(y >> 2) * w + x];
      const v = (0.84 + id * 0.03 + gv * 0.24) * gap;
      height[i] = gap < 1 ? -1 : gv * 0.2;
      img.data[p] = Math.min(255, r * v);
      img.data[p + 1] = Math.min(255, g * v);
      img.data[p + 2] = Math.min(255, b * v);
      img.data[p + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { canvas: cv, normalCanvas: heightToNormal(height, w, h, 2.0), rough: 0.7 };
}

/* 리디자인 테마 — 기존 테마도 명도를 올려 다시 잡는다(월넛·벨벳은 방의 성격이라 색은 유지).
   base = 걸레받이 색(예전 wainscot 자리를 쓴다. 판벽은 더 이상 두르지 않는다) */
Object.assign(MAT_RECIPE, {
  marble:  { wall: () => galleryWall('#D2CABC'), floor: () => marble('#CFC7B8'), wainscot: '#2A2622' },
  gallery: { wall: () => galleryWall('#DED8CC'), floor: () => oakPlank('#A88460'), wainscot: '#2A2622' },
  oak:     { wall: () => galleryWall('#D6CFC2'), floor: () => oakPlank('#9A7650'), wainscot: '#2A2622' },
  walnut:  { wall: () => walnut('#6A4E36'), floor: () => oakPlank('#7E5E40'), wainscot: '#1E1814' },
  velvet:  { wall: () => velvet('#6E2632'), floor: () => oakPlank('#5A3E2A'), wainscot: '#1E1412' },
  archive: { wall: () => galleryWall('#9FAE9F'), floor: () => marble('#C9C6BC'), wainscot: '#1E2622' },
  dark:    { wall: () => plaster('#3A3638'), floor: () => carpet('#2A2228'), wainscot: '#141214' },
  deck:    { wall: () => limestone(), floor: () => deckWood(), wainscot: '#2A2622' },
  paver:   { wall: () => limestone(), floor: () => paver(), wainscot: '#2A2622' },
  facade:  { wall: () => limestone('#CFC5B3'), floor: () => paver(), wainscot: '#3A342C' },
});

/* 전역 스크립트다 — export 를 쓰지 않는다.
   (ES 모듈로 두면 import 사슬이 생기고, 그 사슬 하나가 깨지면 화면이 통째로 안 뜬다) */
