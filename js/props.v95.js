/**
 * props.js — 전시관 사물 스프라이트 (SVG)
 *
 * 이모지를 쓰지 않는다. 이모지는 기기마다 모양·색이 다르고, 3D 공간에 놓으면
 * 조명과 무관한 스티커처럼 떠서 몰입을 깬다.
 * → 광원을 위(천장 조명)로 통일한 SVG 로 직접 그린다.
 *
 * 좌표 규약: 1 단위 ≈ 1cm. 각 스프라이트는 **발이 y=0(바닥), 위가 음수**.
 *   viewBox="0 0 W H" 로 그리고, DOM 에서 높이를 h(cm) 로 지정해 바닥에 세운다.
 *
 * 실제 이미지로 교체하려면 `assets/props/{key}.png` 를 넣으면 된다(자동 우선).
 */

/* 공통 팔레트 — 전시관 조명(따뜻한 위쪽 광원)에 맞춘다 */
const PROP_DEF = `
<defs>
  <linearGradient id="mtl" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#9AA3A0"/><stop offset=".45" stop-color="#5E6663"/><stop offset="1" stop-color="#2E3432"/>
  </linearGradient>
  <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#7A5E3C"/><stop offset=".5" stop-color="#5A4429"/><stop offset="1" stop-color="#332514"/>
  </linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#F6E7B4"/><stop offset=".45" stop-color="#C29A42"/><stop offset="1" stop-color="#6E5A28"/>
  </linearGradient>
  <linearGradient id="red" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#C4453A"/><stop offset=".55" stop-color="#8E2A22"/><stop offset="1" stop-color="#4E140F"/>
  </linearGradient>
  <linearGradient id="leaf" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#6E9A55"/><stop offset="1" stop-color="#2F4A28"/>
  </linearGradient>
  <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#CFE3EA" stop-opacity=".55"/>
    <stop offset=".5" stop-color="#8FA8B2" stop-opacity=".18"/>
    <stop offset="1" stop-color="#CFE3EA" stop-opacity=".38"/>
  </linearGradient>
  <radialGradient id="floorAO" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
  </radialGradient>
</defs>`;

/** 바닥 접지 그림자 (스프라이트 하단에 공통으로 깐다) */
const ao = (cx, cy, rx, ry) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#floorAO)"/>`;

/**
 * key: { h(높이 cm), w(viewBox 폭), vh(viewBox 높이), svg }
 * 미술관에 실제로 있는 것들 — 차단봉·벤치·안내 스탠드가 공간을 '전시장'으로 만든다.
 */
const PROP_ART = {
  /* 관람 차단봉 — 미술관의 상징적 오브제 */
  stanchion: { h: 100, w: 60, vh: 110, svg: `
    ${ao(30, 104, 20, 6)}
    <ellipse cx="30" cy="100" rx="15" ry="4.5" fill="#20241F"/>
    <path d="M18 100 L22 92 h16 l4 8z" fill="url(#mtl)"/>
    <rect x="27.5" y="16" width="5" height="78" fill="url(#mtl)"/>
    <rect x="28.8" y="16" width="1.4" height="78" fill="#B9C2BE" opacity=".5"/>
    <ellipse cx="30" cy="15" rx="6" ry="5" fill="url(#gold)"/>
    <path d="M30 20 q26 12 30 26" stroke="#6E2A24" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M30 20 q-26 12 -30 26" stroke="#8E3A32" stroke-width="4" fill="none" stroke-linecap="round"/>` },

  /* 관람용 벤치 */
  bench: { h: 46, w: 150, vh: 60, svg: `
    ${ao(75, 55, 62, 6)}
    <rect x="10" y="18" width="130" height="9" rx="2" fill="url(#wood)"/>
    <rect x="10" y="29" width="130" height="7" rx="2" fill="url(#wood)" opacity=".9"/>
    <rect x="10" y="18" width="130" height="2" fill="#9C7A4E" opacity=".55"/>
    <rect x="20" y="36" width="8" height="18" fill="url(#mtl)"/>
    <rect x="122" y="36" width="8" height="18" fill="url(#mtl)"/>` },

  /* 소화기 */
  extinguisher: { h: 62, w: 34, vh: 70, svg: `
    ${ao(17, 66, 12, 4)}
    <rect x="6" y="18" width="22" height="44" rx="7" fill="url(#red)"/>
    <rect x="9" y="20" width="4" height="40" fill="#E0705F" opacity=".45"/>
    <rect x="13" y="8" width="8" height="11" fill="url(#mtl)"/>
    <path d="M21 10 h9 q3 0 3 3 v3" stroke="#3A3F3C" stroke-width="2.6" fill="none"/>
    <rect x="10" y="5" width="14" height="4" rx="2" fill="#7E8682"/>
    <rect x="7" y="34" width="20" height="9" fill="#F2E6C6" opacity=".22"/>` },

  /* 화분 */
  planter: { h: 92, w: 70, vh: 100, svg: `
    ${ao(35, 96, 24, 6)}
    <path d="M14 62 h42 l-5 32 h-32z" fill="#4A4239"/>
    <path d="M14 62 h42 l-1.4 9 h-39.2z" fill="#5E5449"/>
    <path d="M35 62 q-4 -22 -16 -30 q14 2 16 18 q3 -18 17 -22 q-11 12 -14 34z" fill="url(#leaf)"/>
    <path d="M35 44 q10 -16 22 -18 q-12 10 -18 24z" fill="#557A42"/>
    <path d="M35 48 q-12 -14 -24 -14 q13 8 20 20z" fill="#3F5F33"/>` },

  /* 안내 스탠드 (경사 패널) */
  standee: { h: 108, w: 72, vh: 118, svg: `
    ${ao(36, 112, 22, 6)}
    <rect x="32" y="34" width="8" height="74" fill="url(#mtl)"/>
    <ellipse cx="36" cy="108" rx="16" ry="4.5" fill="#20241F"/>
    <g transform="rotate(-14 36 24)">
      <rect x="8" y="4" width="56" height="40" rx="1" fill="#121814" stroke="#C8A24A" stroke-opacity=".55"/>
      <rect x="14" y="11" width="34" height="3" fill="#C8A24A" opacity=".8"/>
      <rect x="14" y="18" width="44" height="2" fill="#EDF2EC" opacity=".32"/>
      <rect x="14" y="23" width="40" height="2" fill="#EDF2EC" opacity=".24"/>
      <rect x="14" y="28" width="44" height="2" fill="#EDF2EC" opacity=".24"/>
      <rect x="14" y="33" width="26" height="2" fill="#EDF2EC" opacity=".18"/>
    </g>` },

  /* 휴지통 */
  bin: { h: 54, w: 40, vh: 62, svg: `
    ${ao(20, 58, 14, 4)}
    <path d="M6 14 h28 l-3 40 h-22z" fill="url(#mtl)"/>
    <path d="M9 16 h3 l-2.4 36 h-3z" fill="#B9C2BE" opacity=".28"/>
    <ellipse cx="20" cy="14" rx="14" ry="4" fill="#3E4642"/>
    <ellipse cx="20" cy="13" rx="10" ry="2.6" fill="#0C110E"/>` },

  /* 벽시계 (벽걸이 — 바닥이 아니라 벽에 붙는다) */
  clock: { h: 34, w: 34, vh: 34, wall: true, svg: `
    <circle cx="17" cy="17" r="16" fill="url(#gold)"/>
    <circle cx="17" cy="17" r="13" fill="#0E1310"/>
    <circle cx="17" cy="17" r="13" fill="none" stroke="#C8A24A" stroke-opacity=".4"/>
    <path d="M17 17 V8" stroke="#EDF2EC" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M17 17 h6.5" stroke="#EDF2EC" stroke-width="1.4" stroke-linecap="round"/>
    <circle cx="17" cy="17" r="1.4" fill="#C8A24A"/>` },

  /* 정수기 */
  cooler: { h: 118, w: 46, vh: 128, svg: `
    ${ao(23, 122, 16, 5)}
    <rect x="8" y="34" width="30" height="84" rx="3" fill="#3A423E"/>
    <rect x="11" y="36" width="4" height="80" fill="#6E7772" opacity=".35"/>
    <path d="M13 6 q10 -6 20 0 l3 28 h-26z" fill="url(#glass)" stroke="#9FB6BE" stroke-opacity=".4"/>
    <rect x="10" y="32" width="26" height="5" fill="#20261F"/>
    <rect x="17" y="58" width="12" height="3" rx="1.5" fill="#8E9995"/>
    <rect x="19" y="61" width="8" height="10" fill="#1A201C"/>` },

  /* 트로피 (좌대 위) */
  trophy: { h: 46, w: 40, vh: 52, svg: `
    ${ao(20, 49, 13, 3.5)}
    <rect x="11" y="38" width="18" height="9" rx="1.5" fill="#2E2A22"/>
    <rect x="11" y="38" width="18" height="2" fill="#5A5140"/>
    <rect x="17.5" y="26" width="5" height="13" fill="url(#gold)"/>
    <path d="M8 6 h24 v9 q0 11 -12 13 q-12 -2 -12 -13z" fill="url(#gold)"/>
    <path d="M8 9 q-6 1 -6 6 q0 6 7 7" stroke="#C29A42" stroke-width="2.4" fill="none"/>
    <path d="M32 9 q6 1 6 6 q0 6 -7 7" stroke="#C29A42" stroke-width="2.4" fill="none"/>
    <path d="M12 8 h6 v7 q0 4 -3 5z" fill="#F8EBC0" opacity=".45"/>` },

  /* 방명록 (경사 독서대) */
  book: { h: 96, w: 74, vh: 106, svg: `
    ${ao(37, 100, 22, 6)}
    <rect x="33" y="40" width="8" height="60" fill="url(#wood)"/>
    <ellipse cx="37" cy="99" rx="17" ry="4.5" fill="#20241F"/>
    <g transform="rotate(-18 37 30)">
      <rect x="8" y="14" width="58" height="26" rx="1" fill="#4A3E2C"/>
      <path d="M11 16 h25 v22 h-25z" fill="#E8E1CE"/>
      <path d="M38 16 h25 v22 h-25z" fill="#F2ECDC"/>
      <path d="M36.6 16 h2.8 v22 h-2.8z" fill="#C9BFA6"/>
      <g fill="#7A6E58" opacity=".6">
        <rect x="14" y="21" width="18" height="1.3"/><rect x="14" y="25" width="15" height="1.3"/>
        <rect x="14" y="29" width="17" height="1.3"/><rect x="41" y="21" width="16" height="1.3"/>
        <rect x="41" y="25" width="19" height="1.3"/>
      </g>
    </g>` },

  /* 우산 보관대 */
  umbrella: { h: 62, w: 44, vh: 70, svg: `
    ${ao(22, 66, 15, 4)}
    <path d="M8 26 h28 l-2 38 h-24z" fill="#3A423E"/>
    <ellipse cx="22" cy="26" rx="14" ry="4" fill="#4E5651"/>
    <ellipse cx="22" cy="25" rx="10" ry="2.4" fill="#0E1310"/>
    <path d="M17 25 v-22 q0 -3 3 -3" stroke="#2E4A6E" stroke-width="2.6" fill="none"/>
    <path d="M24 25 v-18 q0 -3 3 -3" stroke="#6E2A34" stroke-width="2.6" fill="none"/>
    <path d="M27 25 v-24" stroke="#3E5E3A" stroke-width="2.4" fill="none"/>` },
};

/** SVG 문자열 → data URI (캔버스 오염 없이 <img> 로 쓸 수 있다) */
function propSprite(key) {
  const d = PROP_ART[key];
  if (!d) return null;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${d.w} ${d.vh}" width="${d.w}" height="${d.vh}">`
    + PROP_DEF + d.svg + '</svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/** 스프라이트 실측 크기(cm) — 3D 배치에서 쓴다 */
function propSize(key) {
  const d = PROP_ART[key];
  if (!d) return { w: 40, h: 60, wall: false };
  return { w: d.h * (d.w / d.vh), h: d.h, wall: !!d.wall };
}

/**
 * 교잴 이미지 매니페스트 (assets/overrides.json)
 *
 * ⚠️ 이전에는 `assets/props/{key}.png` 를 **파일마다 찔러봤다**. 없으면 404 이묀로
 *    콘솔에 미가 16개씩 생기고 요십도 낭별됐다.
 *    → 매니페스트에 적힌 것만 불러온다. 뱄 있으면 요십이 0건이다.
 */
/**
 * 교체 이미지 매니페스트 (assets/overrides.json)
 *
 * ⚠️ 이전에는 `assets/props/{key}.png` 를 파일마다 찔러봤다. 없으면 404 이므로
 *    콘솔에 빨간 줄이 16개씩 쌓이고 요청도 그만큼 낭비됐다.
 *    → 매니페스트에 적힌 것만 불러온다. 비어 있으면 요청이 0건이다.
 */
const PROP_IMG = new Map();

let OVERRIDES = null;
async function loadOverrides() {
  if (OVERRIDES) return OVERRIDES;
  try {
    const r = await fetch('assets/overrides.json');
    OVERRIDES = r.ok ? await r.json() : {};
  } catch (e) { OVERRIDES = {}; }
  OVERRIDES.faces = OVERRIDES.faces || {};
  OVERRIDES.props = OVERRIDES.props || {};
  return OVERRIDES;
}

/** 매니페스트에 등록된 이미지가 있으면 그걸, 없으면 SVG 스프라이트 */
async function resolveProp(key) {
  if (PROP_IMG.has(key)) return PROP_IMG.get(key);
  const o = await loadOverrides();
  const file = o.props[key];
  const url = file ? ('assets/props/' + file) : propSprite(key);
  PROP_IMG.set(key, url);
  return url;
}
