/**
 * data.js — 전시물 데이터 소스
 *
 * 실제 운영에서는 golfscore 의 기존 API 를 그대로 쓴다. 새로 만들 API 는 없다.
 *   api/member_photos.php  → { photos: { "이름": "url" } }
 *   api/rankings.php       → players[] (커리어 집계·순위)
 *   api/photos_list.php    → photos[] (갤러리, 싸이월드 연동)
 *   api/clip_list.php      → clips[]  (영상, embed HTML 포함)
 *   api/list_rounds.php    → rounds[] (라운드 목록 · 선수별 합계)
 *   api/get_scores.php     → 라운드 1건의 홀별 타수 + 원본 스코어카드 사진(팝업을 열 때만)
 *   api/comment_list.php   → 익명 댓글 (방명록)
 *
 * CONFIG.apiBase 를 비워두면 더미 데이터로 돈다(빈 전시관 방지용 샘플).
 */

/* ══════════════════════════════════════════════════════════
   관 이름
   ══════════════════════════════════════════════════════════
   화면에 보이는 명칭을 고칠 곳은 **여기 한 군데**다.
   브라우저 탭·타이틀 화면·관람 안내 액자·팝업 서명이 모두 이 값을 쓴다.
   (index.html 의 <title> 만 정적이라 따로 적혀 있다 — 로딩 중 한 번 보인다)

   mark  타이틀 화면 위쪽의 작은 레터스페이싱 줄. 비우면 그 줄을 안 그린다.
   kr    큰 제목. [일반, 금색강조] — 앞이 비면 강조부만 렌더된다.
   ────────────────────────────────────────────────────────── */
const SITE = {
  title: 'HANSHIN MUSEUM',
  mark: 'ESTABLISHED COLLECTION',
  kr: ['HANSHIN', 'MUSEUM'],       // HANSHIN 은 흰색, MUSEUM 은 금박
  foot: 'HANSHIN MUSEUM',
  /* 로고는 **두 종류**를 쓴다.
       logo       타이틀 화면(입장 전) — 한신 붓글씨 마크(hs_logo_f.svg, 232×277 세로형)
       posterLogo 관 안의 '관람 안내' 액자 — 버디버디 로고(logo.png, 419×161 가로형)
     posterTex 는 가로형·세로형 어느 쪽이든 상자에 맞춰 넣는다. */
  logo: 'assets/logo.svg',
  posterLogo: 'assets/logo.png',
  /* 안내 포스터의 제목은 **두 줄**로 끊는다. 액자가 104×132cm 라
     'HANSHIN MUSEUM' 을 한 줄에 넣으면 좌우 여백이 거의 남지 않는다. */
  posterTitle: ['HANSHIN', 'MUSEUM'],
  /* 제목이 라틴 문자면 세리프·자간을 바꾼다. Noto Serif KR 의 음수 자간은
     한글용이라 대문자 라틴에 쓰면 글자가 서로 붙는다 → Cinzel(로마 각자체). */
  latin: true,
};

const CONFIG = {
  /**
   * golfscore API 위치. null 이면 자동 탐색한다.
   *
   * 배포 구조가 `/projects/museum/` 과 `/projects/golfscore/` 로 형제이므로
   * `../golfscore` 가 맞는다(같은 도메인이라 CORS 도 없다).
   * 자동 탐색이 실패하면 샘플 아카이브로 폴백한다.
   */
  apiBase: null,
  apiCandidates: ['../golfscore', '/projects/golfscore'],

  /* 전시장 배경음악 — 유튜브 영상/재생목록 주소나 ID.
     여기 값이 기본이고, 관리자 패널에서 덮어쓰면 **모든 관람객**에게 적용된다
     (서버 저장이므로 재배포 없이 바꿀 수 있다).
     ⚠️ '퍼가기 허용' 이 꺼진 영상은 재생되지 않는다(유튜브 설정). 지역 차단·삭제도 마찬가지.
        그럴 때는 화면에 조용히 실패하고 음악만 없다 — 관람은 그대로 된다. */
  bgm: null,
  bgmVolume: 32,        // 0~100. 배경음악이므로 낮게

  // 전시 상한. 걸이 자리는 내용에 맞춰 자동으로 나뉜다(hangSlots).
  /* 전시 상한. 걸이 자리는 내용에 맞춰 자동으로 나뉜다(hangSlots).
     ⚠️ screen 6 / scorecard 8 은 API 가 최신 24·12건만 주던 시절의 값이다.
        이제 페이지 끝까지 받아오므로(fetchPaged) 벽이 남지 않게 올렸다.
        방마다 관리자 패널에서 덮어쓸 수 있다. */
  // trophy 6 → 8 — 기록이 있을 때만 걸리는 명패(홀인원·양파·이글·파) 중 앞의 둘.
  //   8 을 넘기지 않는다: 전시물 조명 풀(POOL_N)이 8발이라 넘치면 먼 명패가 어둡다
  MAX: { portrait: 40, scorecard: 12, screen: 10, photo: 12, trophy: 8, champion: 6 },
};

/* ══════════════════════════════════════════════════════════
   관리자 설정
   ══════════════════════════════════════════════════════════
   방마다 '무엇을 얼마나 노출할지' 를 관리자가 정한다. 저장은 브라우저
   localStorage — 이 프로젝트에는 쓰기 가능한 백엔드가 없고(golfscore 의
   config.php 는 공유 자산이라 손대지 않는다), 설정은 관람 방식일 뿐
   데이터가 아니므로 기기 단위 저장으로 충분하다.

   ⚠️ 이건 **접근 제어가 아니다.** 감추는 것은 전시 방식이고 원본 데이터는
      golfscore API 로 이미 공개돼 있다. 게다가 저장이 localStorage 라
      누가 무엇을 바꿔도 **그 사람 기기에만** 적용된다(브라우저 확대 배율과 같다).
      → 그래서 버튼을 숨겨서 얻는 보호가 없다. 처음엔 golfscore 관리자 세션
        (clip_list.php 의 can_manage)일 때만 보이게 했는데, 로그인 상태에 따라
        버튼이 사라져 정작 관리자가 못 찾는 일이 생겼다. 지금은 항상 보인다.
   ────────────────────────────────────────────────────────── */
/* ⚠️ 키를 v1 → v2 로 올렸다.
   v43 이전 버그가 남긴 저장값에는 `archive:{hidden:false}` 처럼 **모든 방의
   기본값이 명시적으로** 박혀 있다. 코드로는 그게 버그의 산물인지 관리자가 일부러
   넣은 값인지 구분할 수 없어서(둘 다 '열어라' 로 읽힌다), 키를 갈아 한 번 버린다.
   그래서 '기록 보관실을 닫았는데 또 열려 있다' 가 반복됐다. */
const ADMIN_KEY = 'museum-admin-v2';
const ADMIN_KEY_OLD = 'museum-admin-v1';
/** 서버 저장소 — 없으면(로컬 개발·PHP 미배포) 브라우저 저장으로 폴백한다 */
const ADMIN_API = 'api/settings.php';
/** 이번 세션에서 설정을 어디서 읽었는지 — 패널에 표시한다 */
const ADMIN_SRC = { server: false, writable: false, savedAt: null, savedBy: null, why: '' };

/* 현재 실행 중인 빌드 번호 — 파일명(js/data.v43.js)에서 스스로 읽는다.
   ducking.co.kr 루트의 공용 sw.js 가 쿼리스트링을 무시하고 캐시하므로,
   '고쳤는데 안 바뀐다' 의 절반은 옛 파일을 받고 있는 경우다.
   화면에 빌드 번호를 띄워두면 그 의심을 즉시 걷어낼 수 있다. */
const BUILD = (function () {
  try {
    const src = (document.currentScript && document.currentScript.src) || '';
    const m = src.match(/data\.(v\d+)\.js/);
    return m ? m[1] : 'dev';
  } catch (e) { return '?'; }
})();

/* ── 설정 저장소 ────────────────────────────────────────────
   서버(api/settings.php)를 1순위로 쓴다. 그래야 관리자가 정한 구성이
   **모든 관람객·모든 기기**에 같이 적용된다. 서버가 없거나 쓰기 권한이
   없으면 브라우저 저장으로 조용히 내려앉는다(기능이 멈추지는 않는다).
   ────────────────────────────────────────────────────────── */

/** 브라우저 저장(폴백·캐시) */
function loadAdminLocal() {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    const j = raw ? JSON.parse(raw) : null;
    return (j && typeof j === 'object') ? j : {};
  } catch (e) { return {}; }
}
function saveAdminLocal(s) {
  try { localStorage.setItem(ADMIN_KEY, JSON.stringify(s)); return true; }
  catch (e) { return false; }
}

/** 설정 읽기 — 서버 우선. loadArchive() 에서 await 한다 */
async function loadAdmin() {
  // 옛 키는 한 번 지운다(위 주석의 이유)
  try { localStorage.removeItem(ADMIN_KEY_OLD); } catch (e) { /* 무시 */ }
  const j = await fetchJSON(ADMIN_API, 5000);
  if (j && j.settings && typeof j.settings === 'object') {
    ADMIN_SRC.server = true;
    ADMIN_SRC.writable = !!j.writable;
    ADMIN_SRC.savedAt = j.saved_at || null;
    ADMIN_SRC.savedBy = j.saved_by || null;
    ADMIN_SRC.canManage = !!j.can_manage;
    ADMIN_SRC.why = j.writable
      ? '서버에 저장됩니다 — 모든 관람객에게 같이 적용됩니다.'
      : 'data 폴더에 쓰기 권한이 없어 이 브라우저에만 저장됩니다.';
    // 서버가 읽기는 되지만 쓰기가 안 되면, 로컬 설정을 위에 덮어 쓴다
    const fromSrv = { rooms: j.settings.rooms || {}, bgm: j.settings.bgm || null };
    return j.writable ? fromSrv : Object.assign(fromSrv, loadAdminLocal());
  }
  ADMIN_SRC.server = false;
  ADMIN_SRC.why = '설정 API 를 찾지 못해 이 브라우저에만 저장됩니다(api/settings.php 배포 확인).';
  return loadAdminLocal();
}

/** 설정 쓰기 — 서버에 먼저. 실패하면 브라우저에 남긴다 */
async function saveAdmin(s) {
  if (ADMIN_SRC.server) {
    try {
      const r = await fetch(ADMIN_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s),
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j && j.success) {
        saveAdminLocal(s);                    // 캐시 — 서버가 죽어도 마지막 구성이 남는다
        return { ok: true, server: true };
      }
      return { ok: saveAdminLocal(s), server: false,
        message: (j && j.message) || '서버에 저장하지 못했습니다.' };
    } catch (e) {
      return { ok: saveAdminLocal(s), server: false, message: '서버에 연결하지 못했습니다.' };
    }
  }
  return { ok: saveAdminLocal(s), server: false };
}

/** 전부 기본값으로 — 서버·브라우저 양쪽을 비운다 */
async function resetAdmin() {
  try { localStorage.removeItem(ADMIN_KEY); } catch (e) { /* 무시 */ }
  try { localStorage.removeItem(ADMIN_KEY_OLD); } catch (e) { /* 무시 */ }
  if (ADMIN_SRC.server) {
    try {
      await fetch(ADMIN_API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rooms: {} }),
      });
    } catch (e) { /* 로컬만 비워도 진행 */ }
  }
}

/**
 * 방의 **코드 기본값** — ROOMS 에 적어둔 closed 값(문자열이면 안내 문구).
 * applyAdminRooms 가 원본을 _closed0 에 보관하므로 그쪽을 먼저 본다.
 */
function roomDefaultClosed(id) {
  if (typeof ROOMS === 'undefined') return null;
  const r = ROOMS.find((x) => x.id === id);
  if (!r) return null;
  return (r._closed0 !== undefined) ? r._closed0 : (r.closed || null);
}

/**
 * 방 하나의 설정 — 저장값이 없으면 **코드 기본값**으로 채운다.
 *
 * ⚠️ 예전에는 `hidden: !!s.hidden` 이었다. 저장값이 없으면 무조건 false 가 되어
 *    코드에서 닫아둔 방(기록 보관실)이 패널에는 **열린 것처럼** 표시됐고,
 *    그 상태로 저장을 누르면 `hidden:false` 가 기록되어 **닫아둔 방이 열려버렸다.**
 *    (사용자가 '닫았는데 새로고침하면 안 닫혀 있다' 고 한 증상)
 */
function roomCfg(id) {
  const s = (ADMIN.rooms || {})[id] || {};
  const def = roomDefaultClosed(id);
  return {
    hidden: (s.hidden === undefined) ? !!def : !!s.hidden,   // 문을 닫는다(진입 불가)
    note: s.note || (typeof def === 'string' ? def : '전시 준비 중'),
    max: (s.max == null || s.max === '') ? null : Math.max(0, +s.max),
    cats: s.cats || null,                     // {카테고리명: true/false} — null 이면 전부 노출
    bgm: s.bgm || null,                       // 이 방 전용 배경음악(없으면 전관 음악)
    defaultHidden: !!def,                     // 패널에 '기본값' 을 표시하기 위해
  };
}
/** 카테고리 노출 여부 — 설정이 없거나 목록에 없으면 노출 */
function catOn(cfg, name) {
  if (!cfg.cats) return true;
  const k = String(name == null || name === '' ? '(미분류)' : name);
  return cfg.cats[k] !== false;
}

let ADMIN = {};

/**
 * 유튜브 주소/ID → 재생 정보.
 * 전체 URL·youtu.be·shorts·재생목록·맨 ID 를 모두 받는다.
 * @returns {{kind:'video'|'list', id:string}|null}
 */
function parseYouTube(input) {
  const raw = String(input == null ? '' : input).trim();
  if (!raw) return null;
  /* 서버(settings.php)는 무엇을 붙여넣어도 ID 만 뽑아 'v:<id>' / 'p:<id>' 로 정규화해
     저장한다. 그 형태를 먼저 받는다 — 11자 영상 ID 와 PL 목록 ID 를 헷갈리지 않게
     접두사를 붙여둔 것이다. */
  const pre = raw.match(/^([vp]):([A-Za-z0-9_-]{10,})$/);
  if (pre) return { kind: pre[1] === 'p' ? 'list' : 'video', id: pre[2] };
  // 재생목록이 먼저 — list= 가 있으면 목록으로 다룬다(영상 ID 가 같이 와도)
  const list = raw.match(/[?&]list=([A-Za-z0-9_-]{12,})/) || raw.match(/^(PL[A-Za-z0-9_-]{10,})$/);
  if (list) return { kind: 'list', id: list[1] };
  const v = raw.match(/[?&]v=([A-Za-z0-9_-]{11})/)
    || raw.match(/youtu\.be\/([A-Za-z0-9_-]{11})/)
    || raw.match(/\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/)
    || raw.match(/^([A-Za-z0-9_-]{11})$/);
  return v ? { kind: 'video', id: v[1] } : null;
}

/** 저장값(v:/p:)을 사람이 알아보는 유튜브 주소로 되돌린다 — 관리자 패널 표시용 */
function youTubeUrl(input) {
  const y = parseYouTube(input);
  if (!y) return '';
  return y.kind === 'list'
    ? 'https://www.youtube.com/playlist?list=' + y.id
    : 'https://www.youtube.com/watch?v=' + y.id;
}

/* ── 더미 이미지 ─────────────────────────────────────────
   실사진이 없을 때 액자가 비어 보이지 않게 SVG 를 즉석에서 만든다. */
function placeholderImg(label, hue = 44) {
  const initial = (label || '?').trim().slice(0, 2);
  // 어두우면 액자 안이 안 보인다. 실사진 대역(중간 명도)에 맞춰 밝게 유지한다.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="440">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="hsl(${hue},26%,46%)"/>
      <stop offset="1" stop-color="hsl(${hue},22%,24%)"/>
    </linearGradient></defs>
    <rect width="360" height="440" fill="url(#g)"/>
    <text x="180" y="252" font-family="serif" font-size="150" font-weight="700"
      fill="hsl(${hue},44%,82%)" text-anchor="middle" opacity=".92">${initial}</text>
    <text x="180" y="322" font-family="sans-serif" font-size="18"
      fill="hsl(${hue},26%,86%)" text-anchor="middle" opacity=".6">NO IMAGE</text>
  </svg>`;
  // SVG 안에는 '#' 을 그대로 쓰고 인코딩은 여기서 한 번만 한다.
  // (미리 %23 로 써두면 encodeURIComponent 가 %2523 으로 만들어 참조가 깨진다)
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/* ══════════════════════════════════════════════════════════
   멤버 명단 (샘플)
   ══════════════════════════════════════════════════════════
   ⚠️ 이름을 고칠 곳은 여기 한 군데다. 초상·관람객(NPC)·트로피·대사·
      라운드 참가자까지 전부 이 표에서 나온다.
   ⚠️ CONFIG.apiBase 를 연결하면 이 표는 무시되고 실제 멤버가 들어온다.
      (그게 정답이다 — 아래 숫자는 지어낸 값이므로 실명에 붙으면 오해를 산다)

   순서 = 종합 순위. 숫자는 자리만 채우는 값이다.
   ────────────────────────────────────────────────────────── */
const ROSTER = [
  // 이름,      라운드, 평균,   베스트, 버디, 이글, 홀인원, 파,   트리플, 양파, 우승
  ['멤버 1',      38,  79.4,   71,    96,   3,    1,    288,   12,    3,   17],
  ['멤버 2',      31,  85.2,   77,    54,   1,    0,    201,   15,    2,    8],
  ['멤버 3',      26,  89.8,   81,    33,   1,    0,    148,   15,    2,    4],
  ['멤버 4',      20,  93.5,   84,    21,   0,    0,    102,   22,    5,    2],
  ['멤버 5',      18,  96.1,   88,    14,   0,    0,     84,   19,    5,    1],
  ['멤버 6',      14, 101.3,   92,     8,   0,    0,     52,   24,    2,    1],
  ['멤버 7',      11, 106.7,   97,     4,   0,    0,     31,   28,    8,    0],
  ['멤버 8',       8, 112.4,  104,     1,   0,    0,     14,   30,   16,    0],
];

/** ROSTER 표 → api/rankings.php 의 players[] 와 같은 형태로 펼친다 */
function rosterToPlayers(rows) {
  return rows.map((r, i) => ({
    name: r[0], rank: i + 1,
    roundsCompleted: r[1], roundsTotal: r[1],
    avgStrokes: r[2], best: r[3],
    birdies: r[4], eagles: r[5], hio: r[6], pars: r[7],
    trip: r[8], quad: r[9], roundWins: r[10],
  }));
}

/** ROSTER i 번째 멤버 이름 (0 = 종합 1위). 더미 데이터가 실명을 참조하는 통로 */
const N = (i) => (ROSTER[i] ? ROSTER[i][0] : `멤버 ${i + 1}`);

/* ── 더미 데이터 ───────────────────────────────────────── */
/** 갤러리 멤버(샘플) — 라운드 기록 없이 응원만 하는 멤버.
    실데이터에서는 members_list.php 의 groups[name]==='gallery' 가 들어온다. */
const ROSTER_GALLERY = [
  ['갤러리 1', '멤버 1'],
  ['갤러리 2', '멤버 3'],
  ['갤러리 3', null],
];

const DUMMY = {
  players: rosterToPlayers(ROSTER),
  gallery: ROSTER_GALLERY.map(([name, cheers]) => ({ name, gallery: true, cheers })),
  memberPhotos: {},
  // 아래 이름은 모두 ROSTER 에서 가져온다(N(0)=1위 …). 지어낸 이름을 박아두지 않는다.
  rounds: [
    { id: 41, code: 'A41', course: '베르힐', course_front: '베르힐', course_back: '스카이', played_at: '2026-06-21', tee_off_time: '07:12', winner: N(0), best: 71, player_count: 4, players: [N(0), N(1), N(2), N(3)] },
    { id: 40, code: 'A40', course: '스카이', course_front: '스카이', course_back: '베르힐', played_at: '2026-06-07', tee_off_time: '12:40', winner: N(1), best: 77, player_count: 4, players: [N(1), N(2), N(4), N(5)] },
    { id: 39, code: 'A39', course: '클래식', course_front: '클래식IN', course_back: '클래식OUT', played_at: '2026-05-24', tee_off_time: '06:50', winner: N(0), best: 74, player_count: 6, players: [N(0), N(1), N(3), N(4), N(6), N(7)] },
    { id: 38, code: 'A38', course: '베르힐', course_front: '베르힐', course_back: '베르힐', played_at: '2026-05-10', tee_off_time: '15:20', winner: N(2), best: 81, player_count: 4, players: [N(2), N(3), N(5), N(6)] },
    { id: 37, code: 'A37', course: '오렌지듄스', course_front: '오렌지', course_back: '듄스', played_at: '2026-04-26', tee_off_time: '08:05', winner: N(0), best: 73, player_count: 5, players: [N(0), N(2), N(4), N(5), N(7)] },
    { id: 36, code: 'A36', course: '송도', course_front: '송도', course_back: '송도', played_at: '2026-04-12', tee_off_time: '13:30', winner: N(1), best: 79, player_count: 4, players: [N(1), N(0), N(3), N(6)] },
  ],
  clips: [
    { id: 7, category: '헛스윙', title: '3번 우드 완전 헛스윙', played_at: '2026-06-21', players: N(7), comment_count: 12, embed: null },
    { id: 6, category: '벙커지옥', title: '벙커에서 네 번', played_at: '2026-06-07', players: N(6), comment_count: 8, embed: null },
    { id: 5, category: '굿샷반전', title: '트리플 뒤 곧바로 버디', played_at: '2026-05-24', players: N(3), comment_count: 5, embed: null },
    { id: 4, category: '세리머니', title: '홀인원 세리머니 전문', played_at: '2026-05-10', players: N(0), comment_count: 21, embed: null },
    { id: 3, category: '뒤땅·토핑', title: '잔디만 3미터', played_at: '2026-04-26', players: N(5), comment_count: 6, embed: null },
    { id: 2, category: '해프닝', title: '카트 후진 사건', played_at: '2026-04-12', players: N(4), comment_count: 9, embed: null },
  ],
  // img_count > 1 은 여러 장 묶음 — 실데이터에서는 photo_get.php 로 나머지를 받아온다
  photos: [
    { id: 31, title: '베르힐 1번홀 티박스', album: '⛳ 버디버디', nickname: '조용한너구리', created_at: '2026-06-21', thumb: null, img_count: 1 },
    { id: 30, title: '단체 기념사진', album: '⛳ 버디버디', nickname: N(0), created_at: '2026-06-21', thumb: null, img_count: 5 },
    { id: 29, title: '클럽하우스 저녁', album: '⛳ 버디버디', nickname: '느긋한수달', created_at: '2026-06-07', thumb: null, img_count: 3 },
    { id: 28, title: '스카이 9번홀 노을', album: '⛳ 버디버디', nickname: N(1), created_at: '2026-06-07', thumb: null, img_count: 1 },
    { id: 27, title: '우승 트로피', album: '⛳ 버디버디', nickname: '조용한너구리', created_at: '2026-05-24', thumb: null, img_count: 8 },
    { id: 26, title: '아침 안개 페어웨이', album: '⛳ 버디버디', nickname: N(2), created_at: '2026-05-10', thumb: null, img_count: 2 },
  ],
  // 방명록은 익명 닉네임이므로 실명이 아니어도 자연스럽다(클립 댓글과 같은 규약)
  guestbook: [
    { name: '조용한너구리', color: '#8FB77E', body: '이번 달 라베 축하합니다 🎉', created_at: '2026-06-22' },
    { name: '느긋한수달', color: '#7FA8C4', body: '벙커에서 네 번 친 영상 왜 올렸어요', created_at: '2026-06-21' },
    { name: '성실한오리', color: '#C4A87F', body: '다음 주 토요일 티타임 한 자리 남습니다', created_at: '2026-06-20' },
    { name: '수줍은다람쥐', color: '#B58BC4', body: '기록 보관실에 제 스코어카드는 왜 없죠', created_at: '2026-06-18' },
  ],
};

/* ── 로더 ──────────────────────────────────────────────── */

/** 타임아웃이 있는 fetch — 하나가 멈추면 로딩이 영구 대기한다 */
async function fetchJSON(url, ms = 6000) {
  const ctl = ('AbortController' in window) ? new AbortController() : null;
  const t = setTimeout(() => ctl && ctl.abort(), ms);
  try {
    const r = await fetch(url, ctl ? { signal: ctl.signal } : undefined);
    if (!r.ok) return null;
    const j = await r.json();
    return (j && j.success !== false) ? j : null;
  } catch (e) {
    return null;
  } finally { clearTimeout(t); }
}

/**
 * 목록 API 를 **페이지 끝까지** 받아온다.
 *
 * ⚠️ 이게 없어서 관리자 카테고리 필터가 반쪽으로 동작했다.
 *    clip_list.php 는 limit 을 안 주면 **최신 24건**만, list_rounds.php 는 **12건**만
 *    돌려준다. 그걸 받아 브라우저에서 카테고리로 걸렀으니, 〈기타〉처럼 드문 분류가
 *    최신 24건 밖에 있으면 액자 자리가 남아도 2건만 걸렸다.
 *    → 서버 한도(48)까지 요청하고, has_more 면 다음 페이지를 이어 받는다.
 *
 * 첫 응답(first)도 함께 돌려준다 — can_manage·players 같은 메타는 첫 페이지에만 있다.
 */
async function fetchPaged(base, path, key, pageLimit = 48, maxPages = 4) {
  const rows = [];
  let first = null;
  for (let page = 0; page < maxPages; page++) {
    const sep = path.indexOf('?') === -1 ? '?' : '&';
    const j = await fetchJSON(`${base}${path}${sep}limit=${pageLimit}&offset=${page * pageLimit}`);
    if (page === 0) first = j;
    const got = (j && Array.isArray(j[key])) ? j[key] : [];
    rows.push(...got);
    if (!j || !j.has_more || !got.length) break;
  }
  return { first, rows };
}

/** golfscore API 가 어디 있는지 찾는다 */
async function findApiBase() {
  if (CONFIG.apiBase) return CONFIG.apiBase;
  for (const base of CONFIG.apiCandidates) {
    const j = await fetchJSON(base + '/api/rankings.php?year=all', 5000);
    if (j && Array.isArray(j.players)) {
      CONFIG.apiBase = base;
      return base;
    }
  }
  return null;
}

async function loadArchive() {
  ADMIN = await loadAdmin();
  const base = await findApiBase();
  if (!base) {
    /* API 를 못 찾음 = 로컬 개발/샘플 모드. 이때만 ?admin 으로 패널을 열 수 있다.
       (실서버에서는 이 우회가 통하지 않는다 — 아래 can_manage 만 본다) */
    const dev = new URLSearchParams(location.search).has('admin');
    /* 설정 API(settings.php)가 관리자라고 답했다면 그걸 그대로 믿는다 —
       쓰기를 실제로 막는 주체가 그 API 이므로 가장 정확한 판정이다. */
    const srv = !!ADMIN_SRC.canManage;
    return { ...DUMMY, live: false, canManage: srv || dev,
      adminWhy: srv ? '관리자로 확인되었습니다. ' + ADMIN_SRC.why
        : (dev ? '샘플 모드 · ?admin 으로 열림 · ' + ADMIN_SRC.why
               : 'golfscore API 를 찾지 못했습니다(샘플 모드). 로컬 테스트는 주소에 ?admin 을 붙이세요.') };
  }

  const [rank, mp, ph, clP, rdP, gb, ml] = await Promise.all([
    fetchJSON(base + '/api/rankings.php?year=all'),
    fetchJSON(base + '/api/member_photos.php'),
    fetchJSON(base + '/api/photos_list.php'),
    // ⚠️ 이 둘은 **페이지를 넘겨가며** 받는다(아래 fetchPaged 주석 참고)
    fetchPaged(base, '/api/clip_list.php', 'clips'),
    fetchPaged(base, '/api/list_rounds.php', 'rounds'),
    fetchJSON(base + '/api/comment_list.php?limit=30'),
    fetchJSON(base + '/api/members_list.php'),
  ]);
  const cl = clP.first, rd = rdP.first;

  const players = ((rank && rank.players) || []).filter((p) => p.roundsCompleted > 0);
  if (!players.length) {
    return { ...DUMMY, live: false, canManage: false,
      adminWhy: '랭킹 데이터를 받지 못해 샘플로 표시 중입니다.' };
  }

  return {
    live: true,
    /* 전시 설정은 **golfscore 관리자만** 연다. 같은 도메인이라 세션 쿠키가
       그대로 실리므로 clip_list.php 의 can_manage 가 곧 관리자 판정이다.
       ⚠️ 이 값이 false 면 버튼이 사라진다. 왜 사라졌는지 알 수 있게
          adminWhy 에 이유를 담아 F2 안내로 띄운다(예전엔 그냥 안 보였다). */
    /* 관리자 판정은 **settings.php 를 1순위**로 본다. 쓰기를 실제로 거부하는
       주체가 그 API 이므로, 버튼 표시와 실제 권한이 어긋날 일이 없다.
       그게 없으면(PHP 미배포) golfscore clip_list.php 의 can_manage 로 대신한다. */
    canManage: ADMIN_SRC.server ? !!ADMIN_SRC.canManage : !!(cl && cl.can_manage),
    adminWhy: (ADMIN_SRC.server
      ? (ADMIN_SRC.canManage ? '관리자로 확인되었습니다. ' + ADMIN_SRC.why
         : 'golfscore 에 관리자로 로그인되어 있지 않습니다. golfscore 에서 로그인한 뒤 새로 고쳐 주세요.')
      : ((cl && cl.can_manage) ? 'golfscore 관리자로 확인되었습니다. ' + ADMIN_SRC.why
         : 'golfscore 에 관리자로 로그인되어 있지 않습니다.')),
    players,
    gallery: buildGallery(ml, players),
    memberPhotos: rebasePhotos((mp && mp.photos) || {}, base),
    rounds: normalizeRounds(rdP.rows.length ? rdP.rows : ((rd && (rd.rounds || rd.list)) || [])),
    clips: clP.rows,
    photos: normalizePhotos(ph, base),
    guestbook: (gb && (gb.comments || gb.list)) || [],
  };
}

/**
 * list_rounds 행을 전시용으로 맞춘다.
 * ⚠️ 실데이터는 course 가 아니라 **course_name** 이고, players 는 이름 문자열이 아니라
 *    {name,total,played,completed,…} 객체다(샘플 데이터와 모양이 다르다).
 *    예전 해설문은 players.join(', ') 을 해서 실데이터에서 '[object Object]' 가 찍혔다.
 *    → course 만 여기서 채우고, 선수 객체는 그대로 둔다(roundCard 가 두 모양을 다 읽는다).
 */
function normalizeRounds(rows) {
  return (rows || []).map((r) => ({ ...r, course: r.course || r.course_name || null }));
}

/* ── 스코어카드 — 홀별 타수 ─────────────────────────────────
   list_rounds 는 선수별 **합계**만 준다. 홀별 타수와 원본 사진은 get_scores.php 가
   라운드 1건씩 준다. 벽에 걸린 12장을 그리려고 12번 부르지 않는다 —
   액자는 합계로 인쇄하고(scorecardTex), 홀별 표와 원본 사진은 **팝업을 열 때** 받는다.
   ────────────────────────────────────────────────────────── */
const PAR_DEFAULT = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4];   // 72

/** 시드 난수(xorshift) — 샘플 타수용. 새로 고칠 때마다 숫자가 바뀌면 '기록' 이 아니다 */
function seeded(seed) {
  let x = ((seed | 0) * 2654435761) >>> 0 || 0x9E3779B9;
  return () => {
    x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0;
    return x / 4294967296;
  };
}

/** 샘플 모드 — 카드의 합계에 맞춰 홀별 타수를 지어낸다(합계가 정확히 맞아야 한다) */
function sampleScores(card) {
  const pars = PAR_DEFAULT.slice();
  const parSum = pars.reduce((a, b) => a + b, 0);
  const players = card.rows.map((row, i) => {
    const rnd = seeded((card.id || 1) * 31 + i * 7 + 3);
    const h = pars.slice();
    if (row.total != null) {
      let diff = row.total - parSum;
      // 버디 몇 개와 그만큼의 보기 — 전부 보기로만 채우면 카드가 밋밋하다
      for (let k = Math.floor(rnd() * 3); k > 0; k--) {
        const a = Math.floor(rnd() * 18), b = Math.floor(rnd() * 18);
        if (a !== b && h[a] > 2) { h[a]--; h[b]++; }
      }
      for (let guard = 0; diff !== 0 && guard < 400; guard++) {
        const j = Math.floor(rnd() * 18);
        if (diff > 0 && h[j] < pars[j] + 4) { h[j]++; diff--; }
        else if (diff < 0 && h[j] > 2) { h[j]--; diff++; }
      }
    }
    const holes = {};
    h.forEach((v, j) => { holes[j + 1] = v; });
    return { name: row.name, holes };
  });
  return { pars, players, photos: [], sample: true };
}

const ROUND_SCORES = new Map();
/**
 * 라운드 1건의 홀별 타수 + 원본 스코어카드 사진.
 * PHOTO_PAGES 와 같은 규칙 — **Promise 를 캐시**한다(응답 전에 두 번 열어도 한 번만 부른다).
 * @returns {Promise<{pars:number[], players:{name,holes}[], photos:string[], sample?:boolean}|null>}
 */
function loadRoundScores(card) {
  const key = String(card.id);
  if (ROUND_SCORES.has(key)) return ROUND_SCORES.get(key);
  const job = (async () => {
    const base = CONFIG.apiBase;
    if (!base) return sampleScores(card);
    const j = await fetchJSON(base + '/api/get_scores.php?round_id=' + encodeURIComponent(card.id), 8000);
    if (!j || !j.round) return null;
    const sc = j.scores || {};
    return {
      pars: (j.round.hole_pars || []).map((v) => +v || 4),
      // scores 는 [합성번호][홀] = 타수. 번호는 players[].no 다(2카트 묶음이면 1..N 으로 다시 매김)
      players: (j.round.players || []).map((p) => ({ name: p.name, holes: sc[p.no] || sc[String(p.no)] || {} })),
      photos: (j.photos || []).map((ph) => rebase(ph.url, base)).filter(Boolean),
    };
  })().catch(() => null);
  ROUND_SCORES.set(key, job);
  return job;
}

/**
 * 갤러리 멤버 — 라운드 기록이 없어 rankings.php 에 아예 나오지 않는 사람들.
 * members_list.php 의 groups[name]==='gallery' 가 그들이고,
 * links[name] 은 응원하는 선수다. 명예의 전당에 함께 걸린다.
 */
function buildGallery(ml, players) {
  if (!ml || !Array.isArray(ml.members)) return [];
  const groups = ml.groups || {}, links = ml.links || {};
  const played = new Set(players.map((p) => p.name));
  return ml.members
    .filter((n) => groups[n] === 'gallery' && !played.has(n))
    .map((n) => ({ name: n, gallery: true, cheers: links[n] || null }));
}

/**
 * golfscore 가 주는 경로는 **golfscore 기준 상대경로**('../cyworld/uploads/…')다.
 * 우리 페이지에서 그대로 쓰면 엉뚱한 곳을 가리키므로 base 를 붙여 다시 기준을 잡는다.
 */
function rebase(url, base) {
  if (!url) return url;
  if (/^(https?:|data:|\/)/.test(url)) return url;
  return base + '/' + url.replace(/^\.\//, '');
}
function rebasePhotos(map, base) {
  const out = {};
  for (const k in map) out[k] = rebase(map[k], base);
  return out;
}

/**
 * 사진 1건의 **전체 이미지** — photos_list.php 는 대표 1장(thumb)만 준다.
 * 여러 장 올린 사진은 photo_get.php?id= 로 따로 받아야 한다.
 *
 * · 결과를 캐시한다(같은 사진을 다시 열 때 재요청하지 않는다)
 * · **Promise 를 캐시**해야 한다 — 값만 캐시하면 응답이 오기 전에 두 번 열었을 때
 *   요청이 두 번 나간다
 * · 샘플 모드(apiBase 없음)에서는 플레이스홀더를 img_count 장 만들어 돌려준다
 */
const PHOTO_PAGES = new Map();
function loadPhotoPages(p) {
  const key = p.id != null ? String(p.id) : (p.title || '');
  if (PHOTO_PAGES.has(key)) return PHOTO_PAGES.get(key);
  const job = (async () => {
    const base = CONFIG.apiBase;
    const n = Math.max(1, p.img_count || p.imgCount || 1);
    if (!base) {
      // 샘플 — 가로/세로를 섞어 만든다(액자 비율 확인용)
      return {
        images: Array.from({ length: n }, (_, i) =>
          placeholderImg(`${i + 1}/${n}`, 30 + i * 24)),
        viewType: 'v', sample: true,
      };
    }
    const j = await fetchJSON(base + '/api/photo_get.php?id=' + encodeURIComponent(p.id), 8000);
    if (!j || !Array.isArray(j.images) || !j.images.length) return null;
    const up = j.uploads || '';
    return {
      images: j.images.map((f) => (/^(https?:|data:|\/)/.test(f)
        ? f : rebase(up + String(f).replace(/^\//, ''), base))),
      viewType: j.view_type || 'v',
      content: (j.photo && j.photo.content) || '',
    };
  })().catch(() => null);
  PHOTO_PAGES.set(key, job);
  return job;
}

/** photos_list 는 thumb 가 uploads 기준 상대경로다 → 절대 URL 로 바꿔둔다 */
function normalizePhotos(ph, base) {
  if (!ph || !ph.photos) return [];
  const up = ph.uploads || '';
  return ph.photos.map((p) => ({
    ...p,
    thumb: p.thumb
      ? (/^(https?:|data:|\/)/.test(p.thumb)
        ? p.thumb
        : rebase(up + String(p.thumb).replace(/^\//, ''), base))
      : null,
  }));
}
