/**
 * museum3d.js — three.js 전시관 (WebGL)
 *
 * CSS 3D 를 버린 이유
 *   · 깊이 버퍼가 없어 큰 벽 평면이 '중심점 깊이' 로 정렬된다 → 벽이 투명해 보인다
 *   · 교차 평면을 매 프레임 쪼개 정렬 → 회전할 때 깨진다
 *   · 그라데이션만 쓸 수 있어 실제 텍스처·조명·후처리가 불가능
 * WebGL 은 위 셋이 전부 구조적으로 해결된다.
 *
 * 단위: **1 unit = 1m** (기획 수치는 cm 이므로 CM 으로 나눈다)
 * 좌표: x 오른쪽, y 위, z 남쪽(+). 카메라는 -z 를 본다.
 */

// ⚠️ 'three' 같은 bare specifier 는 import map 이 필요하고, iOS Safari 는 16.4 부터만
//    지원한다. 미지원 기기에서는 모듈이 **아예 실행되지 않고**(해석 실패는 window.onerror
//    에도 안 잡힌다) 타이틀 화면조차 뜨지 않는다. → 상대경로로 직접 가리킨다.
/* ⚠️ ES 모듈을 쓰지 않는다.
   import 사슬(three + 애드온 10개 + tex)의 어느 한 곳에서 module specifier 해석이
   실패하면 화면이 통째로 뜨지 않고, 기기마다 재현이 갈려 원인을 찾기 어렵다.
   → three 는 전역 빌드(three.global.js), 후처리는 post.js 에서 직접 구현,
     텍스처는 tex.js 전역 함수. import 구문이 0개면 이 오류는 발생할 수 없다.
   THREE / MAT_RECIPE / makeCanvas / createPost 는 모두 전역이다. */

/* 모듈이 실행되기 시작했음을 알린다 — index.html 의 진단이 이 값을 본다 */
window.__modStart = true;

const CM = 100;                  // cm → m
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const D2R = Math.PI / 180;

/* ── 규격 (cm 로 적고 CM 으로 나눠 쓴다) ───────────────── */
const WT = 24;        // 벽 두께
const DOOR_W = 250;   // 통로 폭
/* 통로 높이 — **문마다 다르다**(doorH()).
   ⚠️ 예전에는 전관 235cm 고정이었다. 눈높이가 165cm 이므로 상인방이 머리 위
      70cm 밖에 안 되고, 천장 7m 인 우승자의 방 입구조차 같은 높이라 눌려 보였다.
   → 맞닿은 두 방 중 **낮은 쪽 천장**에서 상인방 자리를 뺀 값으로 잡는다.
     복도(천장 330)는 낮게, 로비↔우승자의 방(580·700)은 최대까지 시원하게. */
const DOOR_H = 235;      // 하한(복도용) — 아래 doorH() 의 최소값
const DOOR_H_MAX = 345;  // 상한 — 이 이상은 문이 아니라 아치가 된다
const LINT_MIN = 74;     // 상인방 최소 두께(cm). 명패·문선·다운라이트가 들어갈 자리
const doorH = (rA, rB) =>
  clamp(Math.min(rA.h || H_DEF, rB.h || H_DEF) - LINT_MIN, DOOR_H, DOOR_H_MAX);
const EYE = 165;      // 시선 높이
const ART_Y = 152;    // 액자 중심 높이
const WAIN_H = 104;   // 판벽 높이
const REACH = 320;    // 조사 가능 거리
const NEAR_W = 42;    // 벽에서 유지할 거리
const H_DEF = 460;

/* 팔레트 — 무채색 기조 + 브라스 주액센트 */
const BRASS = 0xC9A227;
const BRASS_L = 0xE3C567;
const LIGHT_WARM = 0xFFD9A8;   // 90년대 텅스텐 조명색

/* 얇은 브라스 부재(문지방·챠레일·문선·맞댐대)의 광택.
   ⚠️ metalness 0.9 / roughness 0.3 은 거울에 가깝다. 두께 1~4cm 인 띠에
      그런 재질을 주면 하이라이트가 한두 픽셀에 몰려, 카메라가 조금만 움직여도
      켜졌다 꺼지며 반짝인다(스페큘러 에일리어싱). 거칠기를 올려 하이라이트를
      넓게 퍼뜨리면 같은 놋쇠로 보이면서 깜빡임이 사라진다.
   ※ 두꺼운 부재(손잡이·구·트로피)는 obj3d.js 의 값을 그대로 쓴다. */
const TRIM_ROUGH = 0.52;
const TRIM_METAL = 0.68;
const trimMat = (color) => new THREE.MeshStandardMaterial({
  color: color || BRASS, roughness: TRIM_ROUGH, metalness: TRIM_METAL,
});

const M = {
  scene: null, cam: null, renderer: null, post: null,
  rooms: [], roomById: {}, walls: [], exhibits: [],
  roomGroups: {}, artByMesh: new Map(), pickables: [],
  /* 조준선을 막는 것들(벽·상인방·닫힌 문). pickables 와 따로 둔다 —
     조사 대상은 아니고 '가리는 몸' 으로만 쓴다. pickAt() 참고 */
  occluders: [],
  focus: null, openId: null,
  keys: {}, look: null, locked: false,
  pos: new THREE.Vector3(), yaw: 0, pitch: 0, vel: new THREE.Vector3(),
  visited: new Set(), seen: new Set(),
  live: false, total: 0, touch: false,
  raf: 0, t: 0, hoverT: 0,
};

/* ══════════════════════════════════════════════════════════
   부팅
   ══════════════════════════════════════════════════════════ */
async function boot() {
  document.title = SITE.title;
  M.readyP = new Promise((res) => { M._readyRes = res; });
  const A = await loadArchive();
  // 실사 재질 · 하늘 · 나무 — 표지에 필요한 아카이브를 받은 **뒤에** 받기 시작한다(회선을 먼저 차지하지 않게)
  if (typeof loadPBR === 'function' && !/[?&]nopbr\b/.test(location.search)) loadPBR();
  M.live = A.live;
  // ?diag — 폰에서 조명 상태를 눈으로 확인하는 진단 표시
  M.diag = new URLSearchParams(location.search).has('diag');
  M.canManage = !!A.canManage;
  M.adminWhy = A.adminWhy || '';
  M.archive = A;                 // 관리자 패널이 카테고리 목록을 만들 때 쓴다
  M.players = A.players || [];
  // 얼굴 이미지 — 매니페스트에 적힌 것만 쓴다(파일마다 404 를 찔러보지 않는다)
  M.faces = {};
  const ov = await loadOverrides();
  for (const pl of M.players) {
    const file = ov.faces[pl.name];
    M.faces[pl.name] = file ? ('assets/faces/' + file) : ((A.memberPhotos || {})[pl.name] || null);
  }

  const first = (A.photos || [])[0] || {};
  M.heroShot = first.thumb || placeholderImg(first.title || '기념관', 205);

  // 우승자의 방 치장(현수막·명패)이 이름을 쓰므로 배치 전에 뽑아둔다
  const w = (typeof recentWinner === 'function') ? recentWinner(A) : null;
  M.champName = w ? w.name : '';
  M.champYear = w ? String(w.round.played_at || '').slice(0, 4) : '';

  layout(buildExhibits(A));
  await screenTitle();          // 실사 재질을 기다리므로 async
  window.__bootDone = true;
}

/* ══════════════════════════════════════════════════════════
   첫 화면 — 살아 있는 전시관 위에 제목을 얹는다
   ══════════════════════════════════════════════════════════
   예전엔 어두운 초록 배경에 금박 제목을 가운데 세운 '표지' 였다. 전시관이 밝은 복층 건물 +
   골프 필드로 바뀌자 표지와 안이 다른 곳처럼 보였다.
   → 입장 전부터 **실제 3D 전시관을 그린다.** 카메라는 18번 홀 쪽에서 건물 앞을 천천히 돈다.
     제목은 왼쪽 아래에 크게, 건물 구성(1층·2층·18번 홀)은 오른쪽 아래 카드로.
   · 씬 준비(텍스처·셰이더·그림자)를 표지를 보는 동안 끝낸다 → 입장하면 바로 걷는다.
   · 준비가 끝나기 전에 입장을 누르면 막대가 찰 때까지 기다렸다가 들어간다.
   · WebGL 이 없으면 배경 없이 표지만 남는다(입장은 할 수 없다고 안내한다). */
async function screenTitle() {
  const floors = [
    ['1F', '그랜드 홀 · 명예의 전당 · 트로피실 · 기록 보관실 · 상영관'],
    ['2F', '회랑 · 사진 갤러리 · 우승자의 방 · 전망 데크'],
    ['18', '18번 홀 — 코스별 기록 표석'],
  ];
  /* v131 — '진짜 PC 게임처럼' — 메인 메뉴. PRESS ANY KEY → 로고가 왼쪽으로 물러나고 메뉴가 차례로 들어온다.
     ↑↓ · W/S 로 고르고 Enter/Space 로 정한다(마우스를 올리면 그 줄이 골라진다). 버튼 id 는 예전 그대로 둔다(enter() 등이 쓴다) */
  const night = typeof NIGHT !== 'undefined' && NIGHT.on;
  const item = (id, kr, en, extra, cls) => `<button class="gm-item${cls ? ' ' + cls : ''}" id="${id}" type="button"><i class="gm-mk"></i><span class="gm-kr">${kr}</span>${extra || ''}<span class="gm-en">${en}</span></button>`;
  const menu = [
    `<button class="gm-item gm-primary" id="btnEnter" type="button"><i class="gm-mk"></i><span class="gm-kr" id="tsEnterTx">불러오는 중</span><span class="gm-en">ENTER THE MUSEUM</span><i class="gm-bar" id="tsBar"></i></button>`,
    night && typeof escapeStart === 'function' ? item('btnEscape', '방탈출', 'ESCAPE · 15 MINUTES') : '',
    night && typeof recCount === 'function' ? item('btnRec', '밤의 기록', 'NIGHT RECORDS', `<b class="gm-ct">${recCount()} / ${RECORDS.length}</b>`) : '',
    typeof NIGHT !== 'undefined' ? item('btnMode', night ? '낮에 보기' : '밤으로', night ? 'SWITCH TO DAY' : 'SWITCH TO NIGHT') : '',
    M.canManage ? item('btnAdmin', '전시 설정', 'CURATOR SETTINGS') : '',
  ].filter(Boolean).join('');
  const titleL = esc(SITE.kr[0] || 'HANSHIN'), titleR = esc(SITE.kr[1] || 'MUSEUM');
  $('app').innerHTML = galMarkup() + `
    <div class="ts gm${night ? ' night' : ' day'}" id="ts">
      <div class="gm-shade"></div><div class="gm-grain"></div><div class="gm-scan"></div>
      <header class="gm-top">
        <div class="gm-brand"><img src="${esc(SITE.logo)}" alt="" aria-hidden="true"><span>${esc(SITE.title)}</span></div>
        <div class="gm-edition">${night ? '<i>☾</i> NIGHT EDITION' : '<i>☀</i> DAY EDITION'}</div>
      </header>
      <section class="gm-logo">
        <p class="gm-kicker"><span>${esc(SITE.mark || 'ESTABLISHED COLLECTION')}</span></p>
        <h1 class="gm-title"><span class="gm-t1">${titleL}</span><span class="gm-t2"><em>${titleR}</em></span></h1>
        <p class="gm-tag">${night ? '밤의 전시관 — 기록은 잠들지 않는다' : '라운드가 등록되면, 전시물이 한 점 늘어난다'}</p>
      </section>
      <nav class="gm-menu" id="gmMenu" aria-label="메인 메뉴">${menu}</nav>
      <aside class="gm-info">
        <p class="gm-ih">COLLECTION</p>
        <div class="gm-count"><b>${M.total}</b><span>소장품</span></div>
        <ul>${floors.map(([k, v]) => `<li><b>${k}</b><span>${esc(v)}</span></li>`).join('')}</ul>
      </aside>
      <footer class="gm-foot">
        <p class="gm-warn">${night ? '<b>!</b> 공포 연출이 포함되어 있습니다 · 헤드폰을 권장합니다' : '배경음악이 함께 재생됩니다'}</p>
        <p class="gm-keys"><kbd>↑</kbd><kbd>↓</kbd><span>선택</span><kbd>ENTER</kbd><span>결정</span><kbd>M</kbd><span>소리</span></p>
        <p class="gm-ver">${M.live ? '<i class="on"></i>실기록 연결됨' : '<i></i>샘플 아카이브'}<span>${esc(BUILD)}</span></p>
      </footer>
      <div class="gm-press" id="gmPress"><span class="gm-pk">${matchMedia('(pointer: coarse)').matches ? 'TAP TO START' : 'PRESS ANY KEY'}</span><small>${matchMedia('(pointer: coarse)').matches ? '화면을 눌러 시작' : '아무 키나 누르세요'}</small>
        <div class="gm-load"><i id="gmLoad"></i></div><p class="gm-lt" id="gmLoadTx">LOADING</p></div>
    </div>
    <div class="ts-veil" id="tsVeil"></div>`;
  $('gal').classList.add('attract');
  $('btnEnter').onclick = () => enter();
  if ($('btnAdmin')) $('btnAdmin').onclick = openAdmin;
  if ($('btnMode')) $('btnMode').onclick = () => museumSetMode(!NIGHT.on);      // v110 — 낮 / 밤
  if ($('btnRec')) $('btnRec').onclick = () => recPanel();                       // v111 — 밤의 기록
  if ($('btnEscape')) $('btnEscape').onclick = () => escapeStart();               // v114 — 방탈출
  gmMenu();

  try {
    initGL();
    M.attract = { t: 0 };
    stepAttract(0);
    // 실사 재질 · HDRI — 스크립트가 읽힐 때부터 받는 중이다. 씬을 짓기 전에 다 오기를(최대 15초) 기다린다
    if (typeof loadPBR === 'function' && !/[?&]nopbr\b/.test(location.search)) await loadPBR();
    buildScene();
    M.raf = requestAnimationFrame(loop);
  } catch (err) {
    console.error(err);
    M.noGL = true;
    $('tsEnterTx').textContent = '이 기기에서는 3D 를 열 수 없습니다';
    $('ts').classList.add('ready', 'nogl');
    return;
  }
  // 준비 막대 — 텍스처가 오는 만큼 차오르다가 셰이더·그림자까지 끝나면 입장 버튼이 된다
  const bar = $('tsBar');
  const tick = () => {
    if (!$('ts')) return;
    if (M.ready) {
      $('ts').classList.add('ready');
      $('tsEnterTx').textContent = '입장하기';
      if ($('gmLoad')) $('gmLoad').style.transform = 'scaleX(1)';
      if ($('gmLoadTx')) $('gmLoadTx').textContent = 'READY';
      return;
    }
    const jobs = [...TEX_JOBS.values()].length || 1;
    const k = Math.min(0.92, (M.exhibitsBuilt || 0) / Math.max(1, M.exhibits.length) * 0.8 + 0.1);
    if (bar) bar.style.transform = 'scaleX(' + k.toFixed(3) + ')';
    if ($('gmLoad')) $('gmLoad').style.transform = 'scaleX(' + k.toFixed(3) + ')';
    if ($('gmLoadTx')) $('gmLoadTx').textContent = 'LOADING  ' + Math.round(k * 100) + '%';
    $('tsEnterTx').textContent = '준비 중 ' + Math.round(k * 100) + '%';
    void jobs;
    setTimeout(tick, 120);
  };
  tick();
}

/** 메인 메뉴 — PRESS ANY KEY · 고르기(↑↓ W S · 마우스) · 정하기(Enter Space) · 작은 소리 */
function gmMenu() {
  const ts = $('ts'), menu = $('gmMenu');
  if (!ts || !menu) return;
  const items = [...menu.querySelectorAll('.gm-item')];
  let sel = 0, ac = null;
  const blip = (f, v, d) => {
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
      o.type = 'triangle'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.6, t + d);
      lp.type = 'lowpass'; lp.frequency.value = 2400;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(lp); lp.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d + 0.02);
    } catch (e) { /* 소리 없이 */ }
  };
  const pick = (k, quiet) => {
    sel = (k + items.length) % items.length;
    items.forEach((b, n) => b.classList.toggle('on', n === sel));
    if (!quiet) blip(880, 0.035, 0.07);
  };
  const open = () => {
    if (ts.classList.contains('menu')) return;
    ts.classList.add('menu');
    blip(220, 0.06, 0.6); setTimeout(() => blip(330, 0.04, 0.5), 90);
    pick(0, true);
  };
  items.forEach((b, n) => {
    b.style.setProperty('--d', (0.18 + n * 0.07) + 's');
    b.addEventListener('mouseenter', () => { if (ts.classList.contains('menu') && sel !== n) pick(n); });
    b.addEventListener('click', () => blip(520, 0.05, 0.25), true);
  });
  const key = (e) => {
    if (!document.getElementById('ts')) { removeEventListener('keydown', key, true); return; }
    if (document.querySelector('.admin, #recPanel')) return;          // 설정 · 기록 창이 열려 있으면 그쪽이 먼저
    if (!ts.classList.contains('menu')) { if (!e.repeat) { e.preventDefault(); open(); } return; }
    const k = e.key;
    if (k === 'ArrowDown' || k === 's' || k === 'S') { e.preventDefault(); pick(sel + 1); }
    else if (k === 'ArrowUp' || k === 'w' || k === 'W') { e.preventDefault(); pick(sel - 1); }
    else if (k === 'Enter' || k === ' ') { e.preventDefault(); items[sel].click(); }
  };
  addEventListener('keydown', key, true);
  ts.addEventListener('pointerdown', (e) => { if (!ts.classList.contains('menu')) { e.preventDefault(); open(); } });
}

/** 표지 카메라 — 18번 홀 쪽에서 북측 외관 앞을 천천히 오간다(46초 왕복) */
function stepAttract(dt) {
  const A = M.attract;
  if (!A) return;
  A.t += dt;
  const u = Math.sin((A.t / 46) * Math.PI * 2 - 0.4);
  // 세로 화면은 가로 화각이 좁다 — 뒤로 물러나 건물이 한 화면에 들어오게
  const asp = innerWidth / Math.max(1, innerHeight);
  const ang = u * 0.5, R = asp < 1 ? 34 + (1 - asp) * 30 : 34;
  const cx = 24 + Math.sin(ang) * R, cz = 4 - Math.cos(ang) * R;
  const ground = (terrainRender(cx * CM, cz * CM) || 0) / CM;
  const y = ground + 2.6 + Math.sin(A.t * 0.19) * 0.5;
  M.pos.set(cx, y, cz);
  M.cam.position.set(cx, y, cz);
  M.cam.lookAt(24 + Math.sin(ang) * 9, 5.4, 6);
  const field = M.roomById.field;
  if (field && M.room !== field) {
    M.room = field;
    M.feet = ground * CM;
    lastCull = '';
    cullRooms(field);
  }
}

/* ══════════════════════════════════════════════════════════
   관리자 설정 패널
   ══════════════════════════════════════════════════════════
   방마다 ① 공개/비공개 ② 전시 수 상한 ③ 카테고리별 노출을 정한다.
   저장하면 **새로 고친다** — 방 개폐는 벽·충돌·통로까지 다시 만들어야 하므로
   부분 갱신보다 재구성이 안전하고 결과가 예측 가능하다.
   ────────────────────────────────────────────────────────── */
/* ══════════════════════════════════════════════════════════
   배경음악 (유튜브 임베드)
   ══════════════════════════════════════════════════════════
   왜 IFrame API 스크립트를 안 불러오는가
     www.youtube.com/iframe_api 를 로드하면 외부 의존이 하나 더 늘고, 그 스크립트가
     막히면(사내망·차단기) 음악만 실패하는 게 아니라 콜백을 기다리다 코드가 꼬인다.
     → `enablejsapi=1` 만 붙이면 **postMessage 로 직접 명령**할 수 있다. 스크립트 0개.

   자동재생 정책
     소리 있는 자동재생은 사용자 제스처가 있어야 허용된다. initBgm 은 '입장' 클릭
     직후에 불리므로 조건을 만족한다. 그래도 막히는 기기가 있어서
     **음소거 상태로도 한 번 시도**하고, 칩으로 켤 수 있게 남긴다.
   ────────────────────────────────────────────────────────── */
const BGM_KEY = 'museum-bgm-off';       // 사용자가 끈 상태를 기억한다

function bgmSource(roomId) {
  /* 방별 음악 → 전관 음악 → 코드 기본값 순.
     상영관과 우승자의 방이 같은 곡일 이유가 없다. */
  const rs = (ADMIN && ADMIN.rooms && roomId && ADMIN.rooms[roomId]) || null;
  return (rs && rs.bgm) || (ADMIN && ADMIN.bgm) || CONFIG.bgm || null;
}

/**
 * 방이 바뀜 때 곡을 갈아끼운다.
 * 플레이어를 방마다 띄우면 iframe 이 여럿개가 되므로 **하나로 두고**
 * loadVideoById 로 교체한다. 급격한 전환은 귀에 거슬리므로 볼륨을 줄였다 올린다.
 */
function bgmSwitch(roomId) {
  if (!M.bgm) return;
  const want = parseYouTube(bgmSource(roomId));
  if (!want || (M.bgmNow && M.bgmNow.kind === want.kind && M.bgmNow.id === want.id)) return;
  M.bgmNow = want;
  bgmCmd('setVolume', [0]);                       // 페이드 아웃
  setTimeout(() => {
    if (want.kind === 'list') bgmCmd('loadPlaylist', { list: want.id, listType: 'playlist' });
    else bgmCmd('loadVideoById', [want.id]);
    if (M.bgmMuted) bgmCmd('mute');
    // 페이드 인 — 한 번에 올리면 방문이 열리는 순간 소리가 튀다
    let v = 0;
    const up = setInterval(() => {
      v += Math.max(2, CONFIG.bgmVolume / 8);
      bgmCmd('setVolume', [Math.min(CONFIG.bgmVolume, Math.round(v))]);
      if (v >= CONFIG.bgmVolume) clearInterval(up);
    }, 180);
  }, 260);
}

/** 유튜브 플레이어에 명령 — enablejsapi=1 이면 스크립트 없이 이걸로 제어된다 */
function bgmCmd(func, args) {
  const f = $('bgmFrame');
  if (!f || !f.contentWindow) return;
  try {
    f.contentWindow.postMessage(JSON.stringify({
      event: 'command', func, args: args || [],
    }), 'https://www.youtube.com');
  } catch (e) { /* 아직 준비 안 됐으면 무시 */ }
}

function bgmPaint() {
  const chip = $('bgmChip');
  if (!chip) return;
  chip.classList.toggle('hidden', !M.bgm);
  chip.classList.toggle('off', !!M.bgmMuted);
  chip.textContent = M.bgmMuted ? '🔇 음악 켜기' : '🔊 음악 끄기';
}

function bgmToggle() {
  if (!M.bgm) return;
  M.bgmMuted = !M.bgmMuted;
  try { localStorage.setItem(BGM_KEY, M.bgmMuted ? '1' : '0'); } catch (e) { /* 무시 */ }
  if (M.bgmMuted) {
    bgmCmd('mute');
  } else {
    bgmCmd('unMute');
    bgmCmd('setVolume', [CONFIG.bgmVolume]);
    bgmCmd('playVideo');
  }
  bgmPaint();
}

function initBgm() {
  const startRoom = roomAt(M.pos.x * CM, M.pos.z * CM);
  const src = bgmSource(startRoom && startRoom.id);
  M.bgmNow = parseYouTube(src);
  M.bgm = parseYouTube(src);
  // M.bgmMuted 는 enter() 에서 이미 정해졌다 — 여기서 다시 읽지 않는다
  bgmPaint();
  if (!M.bgm) return;

  const p = new URLSearchParams({
    enablejsapi: '1', autoplay: '1', controls: '0', disablekb: '1',
    modestbranding: '1', rel: '0', playsinline: '1', iv_load_policy: '3',
    // 브라우저가 소리 있는 자동재생을 막으면 무음으로라도 시작해 둔다.
    // (칩을 누르면 unMute — 그때는 제스처가 확실하다)
    mute: M.bgmMuted ? '1' : '0',
  });
  if (M.bgm.kind === 'list') {
    p.set('listType', 'playlist');
    p.set('list', M.bgm.id);
  } else {
    // 한 곡을 무한 반복 — loop 는 playlist 에 같은 ID 를 넣어야 동작한다(유튜브 규약)
    p.set('loop', '1');
    p.set('playlist', M.bgm.id);
  }
  const url = 'https://www.youtube.com/embed/'
    + (M.bgm.kind === 'list' ? 'videoseries' : M.bgm.id) + '?' + p.toString();

  const f = document.createElement('iframe');
  f.id = 'bgmFrame';
  f.title = '전시장 배경음악';
  f.allow = 'autoplay; encrypted-media';
  f.setAttribute('frameborder', '0');
  /* 완전히 0×0 이나 화면 밖에 두면 브라우저가 오프스크린 프레임을 스로틀링해
     소리가 끊기는 기기가 있다. 화면 안에 두고 투명하게만 만든다. */
  f.style.cssText = 'position:fixed;right:0;bottom:0;width:200px;height:120px;'
    + 'opacity:0;pointer-events:none;border:0;z-index:-1';
  f.src = url;
  document.body.appendChild(f);

  // 플레이어가 준비될 즈음 볼륨을 낮춘다(배경음악이므로)
  const settle = () => {
    bgmCmd('setVolume', [CONFIG.bgmVolume]);
    if (M.bgmMuted) bgmCmd('mute'); else { bgmCmd('unMute'); bgmCmd('playVideo'); }
  };
  setTimeout(settle, 1200);
  setTimeout(settle, 3000);   // 느린 회선 대비 한 번 더
}

/** 관람이 끝나거나 화면을 떠날 때 — 프레임을 지우는 것이 곧 정지다 */
function stopBgm() {
  const f = $('bgmFrame');
  if (f) f.remove();
  M.bgm = null;
}

/**
 * 방 하나로 순간이동 — 관리자 도구.
 * 벽·문을 무시하고 방 가운데로 옮긴다(작업실은 통로가 없어 걸어갈 수 없다).
 */
function teleport(room, msg) {
  if (!room || !M.cam) return;
  M.room = room;
  M.feet = floorAt(room, room.cx, room.cz);
  M.eyeFeet = M.feet;
  M.pos.set(room.cx / CM, (M.feet + EYE) / CM, room.cz / CM);
  M.vel.set(0, 0, 0);
  M.yaw = 0; M.pitch = 0;
  M.cam.position.copy(M.pos);
  M.cam.rotation.set(0, 0, 0, 'YXZ');
  M.cam.updateMatrixWorld();
  cullRooms(room);
  assignLights();
  drawMinimap();
  if (msg) toast(msg, 6000);
}

/** 짧은 안내 — 화면 아래에 몇 초 뜨고 사라진다 */
function toast(msg, ms = 5000) {
  const old = $('mToast');
  if (old) old.remove();
  const d = document.createElement('div');
  d.id = 'mToast';
  d.className = 'm-toast';
  d.textContent = msg;
  document.body.appendChild(d);
  setTimeout(() => { if (d.parentNode) d.remove(); }, ms);
}

function openAdmin() {
  // 이중 안전장치 — 어떤 경로로 불려도 관리자가 아니면 열지 않는다
  if (!M.canManage) {
    toast('전시 설정은 관리자만 열 수 있습니다.' + (M.adminWhy ? '\n' + M.adminWhy : ''));
    return;
  }
  const A = M.archive || {};
  const wrap = document.createElement('div');
  wrap.className = 'admin';
  wrap.id = 'adminPanel';

  const rows = ROOMS.filter((r) => !r.part && !r.stair).map((r) => {
    const cfg = roomCfg(r.id);
    const cats = roomCategories(r.content, A);
    const maxKey = MAX_KEY[r.content];
    const shown = (M.exhibits || []).filter((e) => e.room === r.id
      && e.type !== 'prop' && e.type !== 'placard').length;
    /* 켜진 카테고리의 자료가 몇 건인지 — '상한에 걸린 것' 과 '자료가 그만큼인 것' 을
       구분할 수 있어야 한다(상영관에서 2건만 걸려 혼란이 있었다). */
    const avail = cats.length
      ? cats.reduce((n2, c) => n2 + (catOn(cfg, c.name) ? c.count : 0), 0) : null;
    const capped = avail != null && avail > shown;
    return `
      <details class="ad-room" ${cfg.hidden ? '' : 'open'} data-room="${r.id}">
        <summary>
          <b>${esc(r.name)}</b>
          <span class="ad-en">${esc(r.en)}</span>
          <span class="ad-badge${cfg.hidden ? ' off' : ''}">${cfg.hidden ? '비공개'
            : (avail != null ? shown + ' / ' + avail : shown + '점')}</span>
        </summary>
        <label class="ad-line">
          <input type="checkbox" class="ad-hide" ${cfg.hidden ? 'checked' : ''}>
          <span>이 방을 닫는다 (문이 잠기고 진입 불가)</span>
          ${cfg.defaultHidden ? '<span class="ad-def">기본값: 닫힘</span>' : ''}
        </label>
        <label class="ad-line ad-note${cfg.hidden ? '' : ' dim'}">
          <span class="ad-lb">닫힘 안내</span>
          <input type="text" class="ad-notev" value="${esc(cfg.note)}" maxlength="20" placeholder="전시 준비 중">
        </label>
        ${maxKey ? `
        <label class="ad-line">
          <span class="ad-lb">전시 수 상한</span>
          <input type="number" class="ad-max" min="0" max="60" step="1"
            value="${cfg.max == null ? '' : cfg.max}" placeholder="기본 ${CONFIG.MAX[maxKey]}">
          <span class="ad-hint">${capped
            ? '⚠ 자료 ' + avail + '건 중 ' + shown + '건만 걸렸습니다 — 상한을 올리세요'
            : '비우면 기본값 ' + CONFIG.MAX[maxKey]}</span>
        </label>` : ''}
        <label class="ad-line">
          <span class="ad-lb">이 방 음악</span>
          <input type="text" class="ad-rbgm" value="${esc(youTubeUrl(cfg.bgm || ''))}"
            placeholder="비우면 전관 음악을 따릅니다">
        </label>
        ${cats.length ? `
        <div class="ad-line ad-cats">
          <span class="ad-lb">카테고리 노출</span>
          <div class="ad-chips">
            ${cats.map((c) => `<label class="ad-chip${catOn(cfg, c.name) ? ' on' : ''}">
              <input type="checkbox" class="ad-cat" data-cat="${esc(c.name)}" ${catOn(cfg, c.name) ? 'checked' : ''}>
              <span>${esc(c.name)}</span><i class="ad-cnt">${c.count}</i></label>`).join('')}
          </div>
        </div>` : '<p class="ad-none">이 방은 카테고리 구분이 없습니다.</p>'}
      </details>`;
  }).join('');

  wrap.innerHTML = `
    <div class="ad-card">
      <div class="ad-head">
        <div>
          <p class="ad-kicker">CURATOR</p>
          <h2>전시 설정</h2>
        </div>
        <button class="ad-x" id="adClose" aria-label="닫기">✕</button>
      </div>
      <p class="ad-lead">
        방마다 무엇을 얼마나 걸지 정합니다. 저장하면 전시관을 다시 구성합니다.<br>
        ${ADMIN_SRC.server && ADMIN_SRC.writable
          ? '<b class="ad-ok">서버에 저장</b> — 모든 관람객·모든 기기에 같이 적용됩니다.'
          : '<b class="ad-warn">이 브라우저에만 저장</b> — ' + esc(ADMIN_SRC.why)}
        ${ADMIN_SRC.savedAt ? '<br>마지막 저장 ' + esc(ADMIN_SRC.savedAt)
          + (ADMIN_SRC.savedBy ? ' · ' + esc(ADMIN_SRC.savedBy) : '') : ''}
        <span class="ad-build">빌드 ${esc(BUILD)}</span>
      </p>
      <div class="ad-body">
        <div class="ad-global">
          <label class="ad-line">
            <span class="ad-lb">배경음악</span>
            <input type="text" id="adBgm" value="${esc(youTubeUrl((ADMIN && ADMIN.bgm) || ''))}"
              placeholder="유튜브 주소 · 퍼가기(&lt;iframe&gt;) 코드 · 재생목록 — 비우면 음악 없음">
          </label>
          <p class="ad-note2">${(() => {
            const cur = parseYouTube((ADMIN && ADMIN.bgm) || CONFIG.bgm);
            return cur
              ? (cur.kind === 'list' ? '재생목록 ' : '영상 ') + esc(cur.id) + ' 로 재생됩니다.'
              : '지금은 음악이 없습니다. 유튜브 주소를 넣으면 모든 관람객에게 같이 적용됩니다.';
          })()}
          <br>유튜브 <b>공유 → 퍼가기</b>의 &lt;iframe&gt; 코드를 그대로 붙여넣어도 됩니다.
          <br>※ 유튜브에서 <b>퍼가기(임베드)를 허용</b>한 영상만 재생됩니다.</p>
        </div>
        ${rows}
      </div>
      <div class="ad-foot">
        ${(() => {
          /* 작업실에는 통로가 없다 = 걸어 나올 수도 없다.
             그래서 이 버튼 하나가 들어가는 길이면서 나오는 길이어야 한다.
             (처음엔 '작업실로 이동' 만 있어서 한 번 들어가면 새로고침밖에 없었다) */
          if (!ROOMS.some((r) => r.secret) || M.attract) return '';   // 표지에서는 순간이동하지 않는다
          const here = roomAt(M.pos.x * CM, M.pos.z * CM);
          return '<button class="btn btn-line" id="adGoSecret">'
            + (here && here.secret ? '\ud83d\udeaa \ub85c\ube44\ub85c \ub098\uac00\uae30'
                                   : '\ud83d\udd6f \uad00\ub9ac\uc790\uc758 \ubc29\uc73c\ub85c')
            + '</button>';
        })()}
        <button class="btn btn-line" id="adReset">전부 기본값으로</button>
        <span class="ad-sp"></span>
        <button class="btn btn-line" id="adCancel">취소</button>
        <button class="btn btn-gold" id="adSave">저장하고 다시 열기</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);

  // 닫힘 체크에 따라 안내 문구 칸을 흐리게
  wrap.querySelectorAll('.ad-room').forEach((box) => {
    const hide = box.querySelector('.ad-hide');
    hide.addEventListener('change', () => {
      box.querySelector('.ad-note').classList.toggle('dim', !hide.checked);
    });
    box.querySelectorAll('.ad-cat').forEach((cb) => {
      cb.addEventListener('change', () => cb.closest('.ad-chip').classList.toggle('on', cb.checked));
    });
  });

  const close = () => wrap.remove();
  $('adClose').onclick = close;
  $('adCancel').onclick = close;
  wrap.addEventListener('pointerdown', (ev) => { if (ev.target === wrap) close(); });
  /* 작업실 순간이동 — 통로가 없으므로 들어가는 유일한 방법이다.
     되돌아올 때는 로비로(입장 지점). */
  if ($('adGoSecret')) {
    $('adGoSecret').onclick = () => {
      const w = M.rooms.find((r) => r.secret && !r.vault);
      if (!w) return;
      const here = roomAt(M.pos.x * CM, M.pos.z * CM);
      close();
      if (here && here.secret) teleport(M.roomById.grand, '그랜드 홀로 돌아왔습니다');
      else teleport(w, '관리자의 방 — 나올 때는 F2 → 로비로 나가기');
    };
  }
  $('adReset').onclick = async () => {
    if (!confirm('모든 방 설정을 지우고 기본 상태로 돌립니다. 계속할까요?')) return;
    await resetAdmin();          // 서버·브라우저 양쪽을 비운다
    location.reload();
  };
  $('adSave').onclick = async () => {
    const next = { rooms: {} };
    const bad = [];                 // 알아볼 수 없는 음악 주소가 들어간 방
    wrap.querySelectorAll('.ad-room').forEach((box) => {
      const id = box.dataset.room;
      const hidden = box.querySelector('.ad-hide').checked;
      const note = (box.querySelector('.ad-notev').value || '').trim();
      const maxEl = box.querySelector('.ad-max');
      const maxV = maxEl ? maxEl.value.trim() : '';
      const catEls = [...box.querySelectorAll('.ad-cat')];
      const cats = catEls.length ? {} : null;
      catEls.forEach((cb) => { cats[cb.dataset.cat] = cb.checked; });
      // 기본값과 같은 항목은 저장하지 않는다 — 설정 파일이 군더더기 없이 남는다
      /* **기본값과 다른 것만** 저장한다.
         예전엔 hidden 을 항상 기록해서, 저장 한 번으로 모든 방의 코드 기본값이
         localStorage 에 굳어버렸다(코드에서 닫아둔 기록 보관실이 열려버린 원인).
         이렇게 두면 나중에 코드 기본값을 바꿔도 그 변경이 따라온다. */
      const s = {};
      const defHidden = !!roomCfg(id).defaultHidden;
      if (hidden !== defHidden) s.hidden = hidden;
      if (note && note !== (roomDefaultClosed(id) || '전시 준비 중')) s.note = note;
      if (maxV !== '') s.max = Math.max(0, +maxV);
      if (cats && catEls.some((cb) => !cb.checked)) s.cats = cats;
      const rb = box.querySelector('.ad-rbgm');
      const rbv = rb ? rb.value.trim() : '';
      if (rbv) {
        if (!parseYouTube(rbv)) { bad.push(M.roomById[id] ? M.roomById[id].name : id); }
        else s.bgm = rbv;
      }
      if (Object.keys(s).length) next.rooms[id] = s;   // 빈 항목은 아예 남기지 않는다
    });
    if (bad.length) {
      alert('다음 방의 음악 주소를 알아볼 수 없습니다: ' + bad.join(', '));
      return;
    }
    // 전관 배경음악 — 방별 설정이 없는 방이 이걸 따른다
    const bgmRaw = ($('adBgm') && $('adBgm').value.trim()) || '';
    if (bgmRaw && !parseYouTube(bgmRaw)) {
      alert('배경음악 주소를 알아볼 수 없습니다. 유튜브 영상 주소나 재생목록 주소를 넣어 주세요.');
      return;
    }
    if (bgmRaw) next.bgm = bgmRaw;
    const res = await saveAdmin(next);
    if (!res.ok) {
      alert(res.message || '설정을 저장할 수 없습니다.');
      return;
    }
    if (!res.server) {
      // 서버에 못 썼으면 조용히 넘기지 않는다 — 다른 기기·관람객에게는 적용되지 않는다
      const tail = String.fromCharCode(10, 10);
      alert((res.message ? res.message + tail : '')
        + '이 브라우저에만 저장했습니다. 다른 기기나 관람객 화면에는 적용되지 않습니다.');
    }
    location.reload();
  };
}

/* ══════════════════════════════════════════════════════════
   배치 (cm 단위 논리 — 렌더에서 /CM)
   ══════════════════════════════════════════════════════════ */

function layout(byRoom) {
  // 방·경계는 world.js 가 만든다(복층·계단·바깥 — 한 층 격자 전제를 버렸다)
  M.rooms = prepRooms();
  M.roomById = {};
  M.rooms.forEach((r) => { M.roomById[r.id] = r; });
  planBoundaries();

  M.exhibits = [];
  for (const r of M.rooms) {
    const list = byRoom[r.id] || [];
    const props = list.filter((e) => e.type === 'prop');
    const rest = list.filter((e) => e.type !== 'prop');
    let n = 0;
    const place = (e, s, floor) => {
      n++;
      const sz = e.sprite ? propSize(e.sprite) : null;
      const off = floor ? (sz ? WT / 2 + Math.max(26, sz.w * 0.5) : 60) : WT / 2 + 8;
      M.exhibits.push({
        ...e, room: r.id, accent: r.accent, id: `${r.id}-${n}`,
        x: s.x + s.nx * (s.v != null ? s.v : off), z: s.z + s.nz * (s.v != null ? s.v : off),
        y: floor ? 0 : (e.artY || ART_Y), yaw: s.yaw, nx: s.nx, nz: s.nz,
        vx: s.x + s.nx * ((s.v != null ? s.v : off) + 170), vz: s.z + s.nz * ((s.v != null ? s.v : off) + 170),
        // 스코어카드(기록 보관실)는 가로 카드라 큰 가로 액자에 건다
        big: e.type === 'screen' || e.type === 'photo' || !!e.card,
      });
    };

    /* 우승자의 방은 **좌우 대칭 축**이 전부다. 자동 분배(hangSlots)에 맡기면
       초상이 옆벽으로 밀리고 전리품이 흩어져 위엄이 사라진다 → 자리를 직접 준다. */
    if (r.content === 'champion') {
      const hero = heroSpot(r);
      const along = { x: -hero.nz, z: hero.nx };     // 정면벽을 따라가는 좌우 방향
      const at = (u, v) => ({
        x: hero.x + along.x * u, z: hero.z + along.z * u,
        nx: hero.nx, nz: hero.nz, yaw: hero.yaw, v,
      });
      const CHAMP = { bigcup: [-355, 185], medals: [355, 185], laurel: [0, 620] };
      const side = [];   // 정면벽을 뺀 나머지 벽 — 부속 전시용
      for (const g of wallRuns(r)) {
        if (Math.abs(g.fixed - (g.axis === 'x' ? hero.z : hero.x)) < 1) continue;
        side.push(g);
      }
      let sideI = 0;
      for (const e of rest) {
        if (e.type === 'champion' || e.type === 'placard') { place(e, at(0, WT / 2 + 10), false); continue; }
        const c = CHAMP[e.sprite];
        if (c) { place(e, at(c[0], c[1]), true); continue; }
        // 부속 — 옆벽 가운데에 차례로
        const g = side[sideI++ % Math.max(1, side.length)];
        place(e, g
          ? (g.axis === 'x'
            ? { x: (g.a + g.b) / 2, z: g.fixed, nx: g.nx, nz: g.nz, yaw: g.yaw }
            : { x: g.fixed, z: (g.a + g.b) / 2, nx: g.nx, nz: g.nz, yaw: g.yaw })
          : at(-700, 200), false);
      }
      const pspots0 = propSpots(r, props.length);
      props.forEach((e, i) => place(e, pspots0[i % pspots0.length], true));
      continue;
    }

    // 18번 홀 — 코스 표석은 카트길을 따라 선다(벽이 없다)
    if (r.terrain) {
      const spots = courseSpots(rest.length);
      rest.forEach((e, k) => {
        place(e, spots[k], true);
        const last = M.exhibits[M.exhibits.length - 1];
        last.y = terrainRender(last.x, last.z);
      });
      continue;
    }

    const hang = rest.filter((e) => !e.sprite);
    const objs = rest.filter((e) => !!e.sprite);
    const slots = hangSlots(r, hang.length + objs.length);
    const pspots = propSpots(r, props.length);
    let si = 0, pi = 0;
    for (const e of hang) place(e, slots[si++ % slots.length], false);
    for (const e of objs) place(e, slots[si++ % slots.length], true);
    for (const e of props) place(e, pspots[pi++ % pspots.length], true);
  }
  M.total = M.exhibits.filter((e) => e.type !== 'prop' && e.type !== 'placard').length;

  // 시작 — 현관 남쪽, 북쪽(대계단·유리벽·필드)을 바라본다
  const entry = M.rooms.find((r) => r.start) || M.rooms.find((r) => r.entry) || M.rooms[0];
  M.startPos = { x: entry.cx, z: entry.z1 - 170, room: entry };
}




function segmentsExcept(from, to, holes) {
  const hs = [...(holes || [])].sort((x, y) => x[0] - y[0]);
  const out = [];
  let cur = from;
  for (const [h0, h1] of hs) { if (h0 > cur) out.push([cur, h0]); cur = Math.max(cur, h1); }
  if (cur < to) out.push([cur, to]);
  return out;
}



const SLOT_MIN = 280;


function hangSlots(r, needed) {
  const runs = wallRuns(r);
  if (!runs.length) return [{ x: r.cx, z: r.z0, nx: 0, nz: 1, yaw: 0 }];
  const want = Math.max(1, needed || 1);
  const total = runs.reduce((s, g) => s + g.len, 0);
  const cnt = runs.map((g) => Math.floor((want * g.len) / total));
  let rest = want - cnt.reduce((a, b) => a + b, 0);
  const order = runs.map((g, i) => i).sort((i, j) => (runs[j].len / (cnt[j] + 1)) - (runs[i].len / (cnt[i] + 1)));
  for (let k = 0; rest > 0; k = (k + 1) % order.length, rest--) cnt[order[k]]++;
  const out = [];
  runs.forEach((g, i) => {
    for (let j = 0; j < cnt[i]; j++) {
      const p = g.a + ((j + 0.5) / cnt[i]) * g.len;
      out.push(g.axis === 'x'
        ? { x: p, z: g.fixed, nx: g.nx, nz: g.nz, yaw: g.yaw }
        : { x: g.fixed, z: p, nx: g.nx, nz: g.nz, yaw: g.yaw });
    }
  });
  if (total / want < SLOT_MIN * 0.55) {
    console.warn(`[museum] ${r.name}: ${want}점에 벽 ${Math.round(total)}cm — 간격 ${Math.round(total / want)}cm`);
  }
  return out;
}

/**
 * 방에 들어서면 **정면에 보이는 벽** — 문에서 가장 먼 벽을 고른다.
 * 주인공 전시물(우승자 초상)은 반드시 여기 걸려야 한다.
 * 반환: 벽면 중앙 좌표 + 방 안쪽을 향하는 법선
 */
function heroSpot(r) {
  const edges = [
    { x: r.cx, z: r.z0, nx: 0, nz: 1, yaw: 0 },      // 북벽 — 남쪽을 향한다
    { x: r.cx, z: r.z1, nx: 0, nz: -1, yaw: 180 },   // 남벽
    { x: r.x0, z: r.cz, nx: 1, nz: 0, yaw: 90 },     // 서벽
    { x: r.x1, z: r.cz, nx: -1, nz: 0, yaw: -90 },   // 동벽
  ];
  const pts = M.doors.filter((d) => d.rooms.indexOf(r.id) !== -1).map((d) => ({
    x: d.axis === 'v' ? d.coord : (d.a + d.b) / 2,
    z: d.axis === 'v' ? (d.a + d.b) / 2 : d.coord,
  }));
  let best = edges[1], bd = -1;
  for (const e of edges) {
    const d = pts.length ? Math.min(...pts.map((p) => Math.hypot(p.x - e.x, p.z - e.z))) : 0;
    if (d > bd) { bd = d; best = e; }
  }
  return best;
}

/* 소품 자리 — 남벽 앞 한 줄.
   ⚠️ 예전엔 남벽 가운데부터 균등 분배했다. 소품이 하나인 방은 정확히 **벽 한가운데**에
      서는데, 복도에서 들어오는 통로가 대개 그 자리다 → 기록 보관실을 열자 화분이
      입구 한복판을 막고 섰다. 남벽 통로 앞(문 폭 + 좌우 110cm)을 비우고 남는 구간에만 둔다. */
function propSpots(r, n) {
  const z = r.z1 - 130;
  // ⚠️ 같은 z 선에는 **옆방의 문**도 있다(복도 남벽 = 로비·갤러리 북벽). 이 방 구간과
  //    겹치는 것만 남긴다 — segmentsExcept 는 구간 밖의 구멍을 잘라주지 않는다
  const holes = M.doors.filter((d) => d.axis === 'h' && Math.abs(d.coord - r.z1) < 1)
    .map((d) => [d.a - 110, d.b + 110]).filter(([a, b]) => b > r.x0 && a < r.x1);
  // 원래 균등 배치가 통로를 막지 않으면 그대로 쓴다(로비처럼 문제없던 방의 배치는 바꾸지 않는다)
  const even = [];
  const count0 = Math.max(1, n);
  for (let i = 0; i < count0; i++) {
    even.push({ x: r.x0 + 180 + ((i + 0.5) / count0) * (r.w - 360), z, nx: 0, nz: -1, yaw: 180 });
  }
  if (!even.some((p) => holes.some(([a, b]) => p.x > a && p.x < b))) return even;

  let free = segmentsExcept(r.x0 + 180, r.x1 - 180, holes)
    .map(([a, b]) => [Math.max(a, r.x0 + 180), Math.min(b, r.x1 - 180)])
    .filter(([a, b]) => b - a > 60);
  if (!free.length) free = [[r.x0 + 180, r.x1 - 180]];
  const total = free.reduce((s, [a, b]) => s + (b - a), 0);
  const out = [];
  const count = Math.max(1, n);
  for (let i = 0; i < count; i++) {
    // 남는 구간들을 한 줄로 이어 붙인 길이 위에서 균등 분배한다
    let u = ((i + 0.5) / count) * total;
    let x = free[0][0];
    for (const [a, b] of free) {
      if (u <= b - a) { x = a + u; break; }
      u -= b - a;
      x = b;
    }
    out.push({ x, z, nx: 0, nz: -1, yaw: 180 });
  }
  return out;
}

/* ══════════════════════════════════════════════════════════
   입장 — WebGL 씬 구성
   ══════════════════════════════════════════════════════════ */
/**
 * 관람 시작.
 *
 * 소리는 **기본으로 켜진다** — 배경음악과 발자국이 몰입의 절반이다.
 * 단, 지난 방문에서 직접 끈 사람은 그 선택을 유지한다(M 키·칩으로 끈 경우).
 * ⚠️ 오디오가 만들어지기 전에 정해야 한다. 그래야 첫 소리부터 의도대로 난다.
 */
/** 전시관 화면 DOM — 표지가 이 위에 겹친다 */
function galMarkup() {
  return `
    <div class="gal" id="gal">
      <canvas id="glcv"></canvas>
      <div class="hud">
        <div class="room-tag">
          <span class="rt-en" id="rtEn"></span>
          <span class="rt-kr" id="rtKr"></span>
          <span class="rt-desc" id="rtDesc"></span>
        </div>
        <div class="progress"><span id="prgNum"></span><div class="gauge"><i id="prgFill"></i></div></div>
      </div>
      <div class="reticle" id="reticle"></div>
      <div class="prompt hidden" id="prompt">
        <span class="pr-icon" id="prIcon"></span>
        <span class="pr-text"><b id="prLabel"></b><i>조사하기</i></span>
        <kbd id="prKey">E</kbd>
      </div>
      <div class="minimap" id="minimap"></div>
      <p class="ctrl-hint" id="ctrlHint">
        이동 <b>W</b><b>A</b><b>S</b><b>D</b> · 달리기 <b>Shift</b> &nbsp;·&nbsp; 둘러보기 <b>드래그</b> &nbsp;·&nbsp; 조사 <b>E</b> · 클릭
      </p>
      <button class="lock-chip" id="lockChip" aria-label="마우스 고정"><i class="ci"></i><span class="ct">마우스 고정 · FPS 조작</span></button>
      <button class="bgm-chip hidden" id="bgmChip" aria-label="배경음악"></button>
      ${M.canManage ? '<button class="admin-chip" id="adminChip" aria-label="전시 설정"><i class="ci">⚙</i><span class="ct"> 전시 설정 (F2)</span></button>' : ''}
      <div class="stick" id="stick"><i id="knob"></i></div>
      <button class="act-btn off" id="actBtn" aria-label="조사하기">
        <span class="act-icon" id="actIcon">🔍</span><span class="act-tx" id="actTx">조사</span>
      </button>
      <div class="overlay hidden" id="overlay">
        <div class="plate ov-card" id="ovCard"><div class="plate-in ov-body" id="ovBody"></div></div>
        <button class="ov-close" id="ovClose" aria-label="닫기">✕</button>
      </div>
      <div class="loading" id="glLoad">전시관을 여는 중…</div>
    </div>`;
}

/**
 * 관람 시작 — 표지를 걷고 현관에 선다.
 *
 * 소리는 **기본으로 켜진다** — 배경음악과 발자국이 몰입의 절반이다.
 * 단, 지난 방문에서 직접 끈 사람은 그 선택을 유지한다(M 키·칩으로 끈 경우).
 * ⚠️ 음악·마우스 고정은 사용자 제스처 안에서만 허용된다. 씬 준비를 기다리는 시간이 짧아
 *    (보통 표지를 보는 동안 끝난다) 클릭의 제스처 유효 시간 안에 들어간다.
 */
async function enter() {
  if (M.entered || M.noGL) return;
  M.entered = true;
  if (typeof sndStart === 'function') sndStart();     // 입장 클릭 = 소리를 켤 수 있는 사용자 동작
  let off = false;
  try { off = localStorage.getItem(BGM_KEY) === '1'; } catch (e) { /* 기본 켬 */ }
  M.bgmMuted = off;
  if (!M.ready) { $('tsEnterTx').textContent = '거의 다 됐습니다…'; await M.readyP; }

  const veil = $('tsVeil');
  veil.classList.add('on');
  await new Promise((r) => setTimeout(r, 380));

  // 표지 카메라를 멈추고 현관에 세운다
  M.attract = null;
  M.room = M.startPos.room;
  M.feet = floorAt(M.room, M.startPos.x, M.startPos.z);
  M.eyeFeet = M.feet;
  M.pos.set(M.startPos.x / CM, (M.feet + EYE) / CM, M.startPos.z / CM);
  M.yaw = 0; M.pitch = 0;
  M.cam.position.copy(M.pos);
  M.cam.rotation.set(0, 0, 0, 'YXZ');
  $('ts').remove();
  $('gal').classList.remove('attract');

  bindInput();
  initBgm();
  // 기본을 FPS 조작으로 — 입장 클릭이 사용자 제스처이므로 락 요청이 허용된다.
  // (Esc 로 풀리고, 풀리면 드래그 조작으로 자동 전환된다)
  if (!matchMedia('(pointer: coarse)').matches) tryLock($('gal'));
  lastCull = '';
  cullRooms(M.room);
  assignLights();
  drawMinimap();
  // 지난 관람 기록 — 본 것은 이어서 세고, 그 사이 새로 들어온 소장품 수를 알린다
  const fresh = loadVisit();
  if (fresh > 0) toast('지난 방문 이후 새 소장품 ' + fresh + '점이 들어왔습니다.', 6500);
  else if (M.seen.size) toast('지난 관람을 이어갑니다 · ' + M.seen.size + ' / ' + M.total + '점 관람', 4500);
  requestAnimationFrame(() => veil.classList.remove('on'));
  setTimeout(() => veil.remove(), 1200);
}

function initGL() {
  const canvas = $('glcv');
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });

  /* 셰이더 컴파일·링크 실패를 화면에 띄운다.
     ⚠️ 이건 JS 예외가 아니다 — three 는 콘솔에만 적고 조용히 넘어가며, 그러면
        **에러 하나 없이 화면이 통째로 비어 보인다**(실제로 폰에서 그렇게 겪었다.
        원인은 동시 광원 49발이 모바일 uniform 한계를 넘긴 것이었다).
        폰에서는 콘솔을 볼 수 없으므로 index.html 의 에러 상자로 끌어온다. */
  r.debug.onShaderError = (gl, program, vs, fs) => {
    const log = (gl.getProgramInfoLog(program) || '').trim();
    const bad = [vs, fs].map((s) => (gl.getShaderInfoLog(s) || '').trim()).filter(Boolean).join(' | ');
    const msg = 'GL 셰이더 실패: ' + (log || bad || '원인 미상').slice(0, 300)
      + ' — 동시 광원 ' + (typeof countVisibleLights === 'function' ? countVisibleLights() : '?') + '발';
    try { dispatchEvent(new ErrorEvent('error', { message: msg })); } catch (e) { console.error(msg); }
  };
  /* 해상도는 고정하지 않는다(adaptRes). 폰은 1.5 에서 시작해 여유가 있으면 올린다 */
  const coarse = matchMedia('(pointer: coarse)').matches;
  M.dprMax = Math.min(2, devicePixelRatio || 1);
  M.dprMin = Math.min(M.dprMax, coarse ? 0.75 : 1);
  M.dpr = coarse ? Math.min(M.dprMax, 1.5) : M.dprMax;
  M.dprCap = M.dprMax;
  r.setPixelRatio(M.dpr);
  r.setSize(innerWidth, innerHeight);
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  /* 해는 움직이지 않는다 → 그림자 맵을 **한 번만** 그린다(precompileAll).
     예전엔 스포트 3발이 매 프레임 그림자를 다시 그렸다 — 벽·액자를 세 번씩 더 그리는 비용 */
  r.shadowMap.autoUpdate = false;
  // 필름 톤 — 하이라이트가 부드럽게 말린다(90년대 필름 감성의 절반)
  // (!) tone mapping here would be applied TWICE (post.js also does ACES),
  //     crushing everything to near-black. Keep the render target linear and
  //     do tone mapping + sRGB once, in the final post pass.
  r.toneMapping = THREE.NoToneMapping;
  M.renderer = r;

  M.scene = new THREE.Scene();
  M.scene.background = new THREE.Color(0xDCE4EA);
  /* 대기 원근 — 예전엔 실내 어둠용 짙은 안개(0.028)였다. 필드가 90m 라 그 값이면
     티박스 너머가 전부 잠긴다. 먼 산이 하늘에 녹을 만큼만 옅게 */
  M.scene.fog = new THREE.FogExp2(0xD8DED8, 0.0042);

  M.cam = new THREE.PerspectiveCamera(64, innerWidth / innerHeight, 0.08, 1500);
  M.room = M.startPos.room;
  M.feet = floorAt(M.room, M.startPos.x, M.startPos.z);
  M.pos.set(M.startPos.x / CM, (M.feet + EYE) / CM, M.startPos.z / CM);
  M.yaw = 0; M.pitch = 0;
  // ⚠️ 카메라 변환을 step() 에만 맡기면 첫 프레임이 원점(박물관 밖)에서 찍힌다.
  //    → 여기서 한 번 적용해 둔다.
  M.cam.position.copy(M.pos);
  M.cam.rotation.set(M.pitch, M.yaw, 0, 'YXZ');

  // ── 후처리 — post.js 가 직접 구현(애드온 의존 없음) ──
  // samples = 씬 RenderTarget 의 MSAA. 모바일은 메모리·대역폭이 커서 0.
  M.post = createPost(r, M.scene, M.cam, {
    samples: matchMedia('(pointer: coarse)').matches ? 0 : 4,
    // SSAO — 씬을 반 해상도로 한 번 더 그린다. 폰에는 무겁다(?ao 로 강제로 켤 수 있다)
    ao: !matchMedia('(pointer: coarse)').matches || /[?&]ao\b/.test(location.search),
  });
  M.post.setSize(innerWidth, innerHeight);

  addEventListener('resize', onResize);
}

function onResize() {
  if (!M.renderer) return;
  M.cam.aspect = innerWidth / innerHeight;
  M.cam.updateProjectionMatrix();
  M.renderer.setSize(innerWidth, innerHeight);
  M.post.setSize(innerWidth, innerHeight);
}

/* ══════════════════════════════════════════════════════════
   씬 구성
   ══════════════════════════════════════════════════════════ */
const texCache = new Map();
function themeTex(mat) {
  if (texCache.has(mat)) return texCache.get(mat);
  const recipe = MAT_RECIPE[mat] || MAT_RECIPE.plaster;
  // 실사 재질(pbr.js)이 있는 슬롯은 캔버스를 만들지 않는다 — 시작이 빨라진다
  const pw = typeof pbrSlot === 'function' ? pbrSlot(mat, 'wall') : null;
  const pf = typeof pbrSlot === 'function' ? pbrSlot(mat, 'floor') : null;
  const wall = pw ? null : recipe.wall(), floor = pf ? null : recipe.floor();
  /* ⚠️ 바닥이 화면 이동 때마다 지글거리던 원인이 여기였다.
     비스듬히 보는 바닥은 한 픽셀에 텍셀 수십 개가 들어간다(그레이징 앵글).
     이때 비등방 필터링(anisotropy)이 없으면 어느 텍셀이 뽑히느냐가 매 프레임
     달라져 모아레처럼 번쩍인다. 특히 **노멀맵**은 아예 anisotropy 를 안 줬어서
     법선이 튀고, 그 법선으로 계산한 반사광이 색까지 흔들었다.
     → map·normalMap 모두 하드웨어 최대치(보통 16)로 올린다. */
  const aniso = M.renderer ? M.renderer.capabilities.getMaxAnisotropy() : 8;
  const mk = (src, rep) => {
    const t = new THREE.CanvasTexture(src);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.repeat.set(rep, rep);
    t.anisotropy = aniso;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    return t;
  };
  const mkN = (src, rep) => {
    const t = new THREE.CanvasTexture(src);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rep, rep);
    t.anisotropy = aniso;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    return t;
  };
  const mkI = (im, srgb) => {
    const t = new THREE.Texture(im);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = aniso;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.needsUpdate = true;
    return t;
  };
  // 실사 슬롯 — 색 · 법선 · 거칠기 세 장 + 실제 크기(tile) + 방 색 맞춤(color)
  const photo = (p) => ({ map: mkI(p.img.d, true), normal: mkI(p.img.n, false), roughMap: mkI(p.img.r, false),
    rough: p.roughK, tile: p.tile, color: p.color, nScale: p.nScale });
  const out = {
    wall: pw ? photo(pw) : { map: mk(wall.canvas, 1), normal: mkN(wall.normalCanvas, 1), rough: wall.rough },
    floor: pf ? photo(pf) : { map: mk(floor.canvas, 1), normal: mkN(floor.normalCanvas, 1), rough: floor.rough },
    wainscot: recipe.wainscot,
  };
  texCache.set(mat, out);
  return out;
}

/** 반복 횟수를 실제 크기에 맞춘 재질 (텍스처가 늘어나 보이지 않게) */
function surfaceMat(theme, kind, wM, hM, tile = 2.4) {
  const src = theme[kind];
  if (src.tile) tile = src.tile;                       // 실사 재질은 제 실제 크기로 깐다
  const map = src.map.clone(); map.needsUpdate = true;
  const nrm = src.normal.clone(); nrm.needsUpdate = true;
  map.repeat.set(wM / tile, hM / tile);
  nrm.repeat.set(wM / tile, hM / tile);
  // 바닥 요철은 약하게 — 비스듬히 볼 때 법선이 튀어 지글거리는 주범이다.
  // (벽은 정면으로 보게 되므로 그대로 둔다)
  const ns = (kind === 'floor' ? 0.42 : 0.7) * (src.roughMap ? 1.6 * (src.nScale || 1) : 1);
  const m = new THREE.MeshStandardMaterial({
    map, normalMap: nrm, normalScale: new THREE.Vector2(ns, ns),
    roughness: src.rough, metalness: 0.02,
  });
  if (src.roughMap) {
    const rm = src.roughMap.clone(); rm.needsUpdate = true; rm.repeat.set(wM / tile, hM / tile);
    m.roughnessMap = rm; m.color.copy(src.color);
  }
  return m;
}

function buildScene() {
  const S = M.scene;
  /* 전역 조명 — 하늘빛 반구광은 약하게(채움은 환경맵이 한다). ?diag 가 세기를 읽는다 */
  M.hemi = new THREE.HemisphereLight(0xDCE6F0, 0x6A5A44, 0.55);
  M.amb = new THREE.AmbientLight(0xFFE9CC, 0.0);
  S.add(M.hemi); S.add(M.amb);
  buildEnvMaps(M.renderer);
  // 하늘 — 구름 사진이 있으면 그것, 없으면 예전 계산 하늘
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), ((typeof NIGHT !== 'undefined' && NIGHT.on) && nightSkyMaterial()) || (typeof pbrSkyMaterial === 'function' && pbrSkyMaterial()) || skyMaterial());
  sky.renderOrder = -1;
  sky.frustumCulled = false;
  S.add(sky);
  buildSun();
  if (typeof nightScene === 'function') nightScene();          // v97 — 밤(night.js): 달빛 · 안개 · 하늘

  for (const r of M.rooms) {
    const g = new THREE.Group();
    g.name = 'room-' + r.id;
    // 방 그룹을 그 층 바닥 높이에 놓는다 — 안의 것(전시물·치장·관람객)은 방 기준 좌표를 쓴다
    g.position.y = r.y0 / CM;
    buildRoomShell(r, g);
    if (r.content === 'champion') dressChampion(r, g);
    if (r.secret && r.content === 'workshop') dressWorkshop(r, g);
    if (r.vault && typeof dressVault === 'function') dressVault(r, g);       // v108 — 지하 수장고(haunt.js)
    if (r.lost && typeof lostDressWay === 'function') (r.id === 'lostway' ? lostDressWay : lostDressRoom)(r, g);   // v129 — 분실물 보관소(lost.js)
    if (r.outdoor) dressOutdoor(r, g);
    if (r.id === 'foyer') dressFoyer(r, g);
    batchStatic(g);                              // 움직이지 않는 치장은 재질별로 합친다
    M.roomGroups[r.id] = g;
    S.add(g);
  }

  initLightPool();
  buildBoundaries();
  buildFacadeSign();
  buildDoorDressing();
  if (typeof buildNight === 'function') buildNight();          // v97 — 조명탑 · 가로등(벽이 선 뒤에 — 자리 검사)
  if (typeof buildTraces === 'function') buildTraces();        // v116 — 전시관 밖의 흔적(낙서 · 이름 쓴 공 · 바를 정 · 벤치)
  if (typeof buildExpand === 'function') buildExpand();        // v122 — 서쪽 숲 · 옛 클럽하우스 / 동쪽 드라이빙 레인지 · 주차장
  buildExhibitMeshes();
}

/**
 * 우승자의 방 치장 — 초상만 크게 걸어도 위엄은 안 생긴다.
 * 공간이 그 한 점을 **가리키게** 만드는 장치들:
 *   ① 붉은 카펫 — 문에서 초상까지 이어지는 축. 걷는 방향을 강제한다
 *   ② 벨벳 로프 — 초상 앞에 거리를 만든다. 가까이 못 가면 더 커 보인다
 *   ③ 문장 현수막 — 좌우 대칭. 초상을 가운데로 묶는다
 *   ④ 좌대 배경 아치 — 초상 뒤 벽면을 한 단 눌러 액자를 앞으로 밀어낸다
 */
function dressChampion(r, g) {
  const hero = heroSpot(r);
  const n = { x: hero.nx, z: hero.nz };
  const along = { x: -hero.nz, z: hero.nx };
  const axisZ = Math.abs(n.z) > 0.5;                 // 정면벽이 남/북인가
  const at = (u, v) => ({
    x: (hero.x + along.x * u + n.x * v) / CM,
    z: (hero.z + along.z * u + n.z * v) / CM,
  });
  const brass = trimMat();
  const velvet = new THREE.MeshStandardMaterial({ color: 0x6E1F26, roughness: 0.9 });
  const carpetM = new THREE.MeshStandardMaterial({ color: 0x7A1E24, roughness: 0.96 });

  // ① 붉은 카펫
  const lenCm = (axisZ ? r.d : r.w) - 90;
  const cw = 3.05;
  const c0 = at(0, lenCm / 2 + 30);
  const carpet = new THREE.Mesh(
    new THREE.BoxGeometry(axisZ ? cw : lenCm / CM, 0.022, axisZ ? lenCm / CM : cw), carpetM);
  carpet.position.set(c0.x, 0.011, c0.z);
  carpet.receiveShadow = true;
  g.add(carpet);
  for (const s of [-1, 1]) {                          // 놋쇠 가장자리 띠
    const e0 = at(s * (cw * CM / 2 - 6), lenCm / 2 + 30);
    const edge = new THREE.Mesh(
      new THREE.BoxGeometry(axisZ ? 0.10 : lenCm / CM, 0.026, axisZ ? lenCm / CM : 0.10), brass);
    edge.position.set(e0.x, 0.013, e0.z);
    g.add(edge);
  }

  // ② 벨벳 로프 — 초상 앞 2.4m
  const postH = 0.96;
  const ropePts = [];
  for (const s of [-1, 1]) {
    const p = at(s * 150, 240);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.030, postH, 12), brass);
    post.position.set(p.x, postH / 2 + 0.06, p.z);
    post.castShadow = true;
    g.add(post);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 16), brass);
    foot.position.set(p.x, 0.025, p.z);
    g.add(foot);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.046, 12, 9), brass);
    ball.position.set(p.x, postH + 0.10, p.z);
    g.add(ball);
    ropePts.push(new THREE.Vector3(p.x, postH - 0.05, p.z));
  }
  const mid = at(0, 240);
  const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    ropePts[0], new THREE.Vector3(mid.x, postH - 0.34, mid.z), ropePts[1],
  ]), 22, 0.019, 8, false), velvet);
  rope.castShadow = true;
  g.add(rope);

  // ③ 문장 현수막 — 초상 좌우, 천장 가까이에서 내려온다
  const bw = 1.05, bh = 3.0, byTop = Math.min((r.h - 60) / CM, 5.9);
  const tex = bannerTex(M.champName || '', M.champYear || '');
  for (const s of [-1, 1]) {
    const p = at(s * 560, WT / 2 + 14);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, bw + 0.26, 12), brass);
    rod.rotation[axisZ ? 'z' : 'x'] = Math.PI / 2;
    rod.position.set(p.x, byTop, p.z);
    g.add(rod);
    for (const t of [-1, 1]) {                        // 봉 끝 장식
      const q = at(s * 560 + t * (bw * CM / 2 + 13), WT / 2 + 14);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 9), brass);
      cap.position.set(q.x, byTop, q.z);
      g.add(cap);
    }
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92 }));
    cloth.position.set(p.x, byTop - bh / 2 - 0.04, p.z);
    cloth.rotation.y = hero.yaw * D2R;
    g.add(cloth);
    // 아래 끝 삼각 마감 + 태슬
    const tail = new THREE.Mesh(new THREE.ConeGeometry(bw / 2, 0.34, 3),
      new THREE.MeshStandardMaterial({ color: 0x5E1A20, roughness: 0.92 }));
    tail.rotation.x = Math.PI;
    tail.rotation.y = hero.yaw * D2R;
    tail.position.set(p.x, byTop - bh - 0.18, p.z);
    g.add(tail);
  }

  // ④ 초상 뒤 벽감 — 벽을 한 단 눌러 액자가 앞으로 튀어나오게
  //    초상을 340cm 로 올렸으므로 벽감도 같이 키운다(크레스트 574cm 를 담아야 한다)
  const nicheW = 4.6, nicheH = 5.9;
  const nc = at(0, WT / 2 - 1);
  const niche = new THREE.Mesh(
    new THREE.BoxGeometry(axisZ ? nicheW : 0.06, nicheH, axisZ ? 0.06 : nicheW),
    new THREE.MeshStandardMaterial({ color: 0x241317, roughness: 0.88 }));
  niche.position.set(nc.x, nicheH / 2, nc.z);
  g.add(niche);
  for (const s of [-1, 1]) {                          // 벽감 테두리 기둥
    const p = at(s * (nicheW * CM / 2), WT / 2 + 3);
    const pil = new THREE.Mesh(new THREE.BoxGeometry(0.07, nicheH, 0.07), brass);
    pil.position.set(p.x, nicheH / 2, p.z);
    g.add(pil);
  }
  const lint = at(0, WT / 2 + 3);
  const bar = new THREE.Mesh(
    new THREE.BoxGeometry(axisZ ? nicheW + 0.14 : 0.07, 0.07, axisZ ? 0.07 : nicheW + 0.14), brass);
  bar.position.set(lint.x, nicheH, lint.z);
  g.add(bar);

  /* ⑤ 스윙 석상 도열 — 카펫 양쪽에 나란히.
     자세를 백스윙·임팩트·피니시로 돌려가며 세우면 같은 조각을 복사한 티가 나지 않고,
     통로를 걸어갈 때 스윙 한 동작이 이어지는 것처럼 읽힌다.
     몸은 통로 쪽(안쪽)을 살짝 보게 돌린다 — 도열의 시선이 관람객을 향한다. */
  const STAT_V = [470, 900, 1330];              // 정면벽에서의 거리(cm) — 한 줄에 3좌
  const statX = cw * CM / 2 + 118;              // 카펫 밖으로
  /* 골프백 조상과 드라이버 조상을 번갈아 세운다.
     같은 조상만 늘어놓으면 복사한 티가 나고, 두 종류가 섞이면 열주에 리듬이 생긴다.
     (스윙하는 인물상을 먼저 시도했지만 좌당 11메시로는 형태가 나오지 않았다 —
      obj3d.js bagStatue 주석 참고) */
  const KINDS = ['bagStatue', 'clubStatue'];   // 바둑판처럼 번갈아 → 3좌 + 3좌
  STAT_V.forEach((v, i) => {
    for (const s of [-1, 1]) {
      const st = buildObject3D(KINDS[(i + (s > 0 ? 1 : 0)) % KINDS.length], {
        pose: (i + (s > 0 ? 1 : 0)) % 3,
        face: (s > 0 ? -0.42 : 0.42),           // 정면을 통로 쪽으로 살짝 돌린다
      });
      if (!st) return;
      const p = at(s * statX, v);
      st.position.set(p.x, 0, p.z);
      st.rotation.y = hero.yaw * D2R;
      /* 그림자 계산에서 뺀다 — 장식이고, 좌당 13메시 × 6좌가 그림자 맵 3장에
         전부 다시 그려지면 순수 낭비다(워시 조명도 그림자를 쓰지 않는다). */
      st.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
      g.add(st);
    }
  });
  /* 조상 조명 — **좌마다 한 발**씩 아래에서 위로.
     ⚠️ 처음엔 라이트 개수를 아끼려고 한 줄에 넓은 워시 한 발만 뒀는데, 조상 간격이
        4.3m 라 원뿔 안에 가운데 한 좌만 들어왔다. 실측 결과 조상 명도 38~40 으로
        화면 평균(59)보다 어두워 실루엣으로만 보였다. → 좌마다 붙인다(6발).
        그림자는 끈다(조상 자체도 캐스터가 아니다). */
  STAT_V.forEach((v) => {
    for (const s of [-1, 1]) {
      const lp = at(s * (statX - 78), v);        // 통로 쪽으로 78cm 앞
      const tp = at(s * statX, v);
      const up = new THREE.SpotLight(0xFFE2B8, 22, 6.4, 0.62, 0.72, 1.0);
      up.position.set(lp.x, 0.34, lp.z);
      const tg2 = new THREE.Object3D();
      tg2.position.set(tp.x, 1.95, tp.z);
      g.add(up, tg2);
      up.target = tg2;
    }
  });

  /* ⑥ 벽 조명 — 양 옆벽의 세로 광창(놋쇠 틀 + 발광 띠).
     예전엔 촛대 그릇 + 불꽃 구였다. 새 공간의 선형 천장 조명과 같은 언어로 맞춘다.
     라이트를 달지 않는다 — 발광체는 후처리 블룸이 물어 빛처럼 번진다(광원 수를 늘리지 않는다). */
  const sideU = (axisZ ? r.w : r.d) / 2 - WT / 2 - 3;
  const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xFFE9C4).multiplyScalar(1.2) });
  for (const v of [520, 1080]) {
    for (const s of [-1, 1]) {
      const p = at(s * sideU, v);
      const plate = new THREE.Mesh(new THREE.BoxGeometry(axisZ ? 0.04 : 0.16, 1.5, axisZ ? 0.16 : 0.04), brass);
      plate.position.set(p.x, 2.7, p.z);
      g.add(plate);
      const bar = new THREE.Mesh(new THREE.BoxGeometry(axisZ ? 0.02 : 0.05, 1.3, axisZ ? 0.05 : 0.02), glow);
      bar.position.set(p.x - (axisZ ? s * 0.022 : 0), 2.7, p.z - (axisZ ? 0 : s * 0.022));
      g.add(bar);
    }
  }

  /* ⑦ 벽감 윗단 간접조명 — 초상 머리 위에 가는 빛 한 줄(예전엔 구슬을 늘어놓은 월계 갈란드) */
  const cove = at(0, WT / 2 + 9);
  const coveBar = new THREE.Mesh(
    new THREE.BoxGeometry(axisZ ? nicheW - 0.2 : 0.03, 0.025, axisZ ? 0.03 : nicheW - 0.2), glow);
  coveBar.position.set(cove.x, nicheH - 0.12, cove.z);
  g.add(coveBar);

  // 방 전체를 살짝 붉게 채우는 상시 광 — 벨벳 톤이 살아난다
  const amb = new THREE.PointLight(0xFFC9A0, 2.6, 16, 1.5);
  const ac = at(0, 520);
  amb.position.set(ac.x, (r.h - 120) / CM, ac.z);
  g.add(amb);
}

/**
 * 작업실 치장 — 크기를 눈으로 재는 도구만 둔다.
 *
 * 여기서 무언가를 세울 때 가장 자주 하는 질문이 '이게 몇 미터인가' 다.
 *   · 바닥 1m 격자(5m 마다 굵게) — 놓아본 물건의 크기를 바로 읽는다
 *   · 눈금 기둥 — 1m·2m·3m 높이를 표시. 액자·조상 높이를 맞출 때 쓴다
 *   · 눈높이선(165cm) — 관람객 시선이 어디에 닿는지 보여주는 가로 실
 */
function dressWorkshop(r, g) {
  if (typeof officeDress === 'function') { officeDress(r, g); return; }   // v126 — 관리자의 방(office.js)
  const wM = r.w / CM, dM = r.d / CM;
  const line = new THREE.MeshBasicMaterial({ color: 0x2E4A3C });
  const line5 = new THREE.MeshBasicMaterial({ color: 0x5E8A6E });
  const brass = trimMat();

  // 바닥 1m 격자 — 얇은 박스를 격자선으로 쓴다(LineSegments 보다 두께 조절이 쉽다)
  const x0 = r.x0 / CM, z0 = r.z0 / CM;
  for (let i = 1; i < Math.round(wM); i++) {
    const big = i % 5 === 0;
    const m = new THREE.Mesh(new THREE.BoxGeometry(big ? 0.035 : 0.014, 0.004, dM - 0.3),
      big ? line5 : line);
    m.position.set(x0 + i, 0.006, r.cz / CM);
    g.add(m);
  }
  for (let k = 1; k < Math.round(dM); k++) {
    const big = k % 5 === 0;
    const m = new THREE.Mesh(new THREE.BoxGeometry(wM - 0.3, 0.004, big ? 0.035 : 0.014),
      big ? line5 : line);
    m.position.set(r.cx / CM, 0.006, z0 + k);
    g.add(m);
  }

  // 눈금 기둥 — 북벽 앞. 1m 마다 놋쇠 띠, 3m 까지
  const px = r.x0 / CM + 1.2, pz = r.z0 / CM + 0.9;
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.0, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x2A302C, roughness: 0.8 }));
  post.position.set(px, 1.5, pz);
  g.add(post);
  for (let h = 1; h <= 3; h++) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.045, 0.22), brass);
    band.position.set(px, h, pz);
    g.add(band);
    const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.15),
      new THREE.MeshBasicMaterial({
        map: plateTex(h + 'm', ''), transparent: true,
      }));
    tag.position.set(px + 0.36, h, pz + 0.07);
    g.add(tag);
  }

  /* 눈높이선 165cm — 관람객 시선이 닿는 높이. 액자를 걸 때 이 선을 기준으로 본다.
     북벽에는 안내 명패가 걸려 있으므로 **남벽 앞**에 친다.
     북벽에 두면 명패 앞 15cm 를 가로질러 글자를 그어버린다. */
  const eye = new THREE.Mesh(new THREE.BoxGeometry(wM - 0.6, 0.012, 0.012),
    new THREE.MeshBasicMaterial({ color: 0x8A6E1E }));
  eye.position.set(r.cx / CM, EYE / CM, r.z1 / CM - 0.35);
  g.add(eye);
  /* 이름표 — 선만 그어두면 '이상한 노란 줄' 로 읽힌다(실제로 그 질문을 받았다).
     무엇을 재는 선인지 양쪽 끝에 적어 둔다. */
  for (const s of [-1, 1]) {
    const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.16),
      new THREE.MeshBasicMaterial({ map: plateTex('눈높이 165cm', ''), transparent: true }));
    tag.position.set(r.cx / CM + s * (wM / 2 - 0.55), EYE / CM + 0.16, r.z1 / CM - 0.36);
    tag.rotation.y = Math.PI;
    g.add(tag);
  }

  // 작업등 — 방 전체를 고르게. 여기서는 분위기보다 보이는 게 우선이다
  for (const fx of [0.3, 0.7]) {
    for (const fz of [0.3, 0.7]) {
      const li = new THREE.PointLight(0xFFF2DC, 3.4, 13, 1.2);
      li.position.set((r.x0 + r.w * fx) / CM, (r.h - 90) / CM, (r.z0 + r.d * fz) / CM);
      g.add(li);
    }
  }
}

/** 현수막 천 — 짙은 버건디 직물 + 금사 테두리 + 세로 이름(v79: 다각형 왕관을 걷었다) */
function bannerTex(name, year) {
  const W = 360, H = 1030;
  const cv = makeCanvas(W, H), c = cv.getContext('2d');
  c.fillStyle = '#5C1A22'; c.fillRect(0, 0, W, H);
  // 직물 결 — 가는 세로줄 + 은은한 주름 명암
  for (let x = 0; x < W; x += 3) { c.fillStyle = `rgba(255,255,255,${(x % 6 ? 0.018 : 0.035)})`; c.fillRect(x, 0, 1, H); }
  const fold = c.createLinearGradient(0, 0, W, 0);
  fold.addColorStop(0, 'rgba(0,0,0,.28)'); fold.addColorStop(0.18, 'rgba(0,0,0,0)'); fold.addColorStop(0.5, 'rgba(255,230,210,.06)');
  fold.addColorStop(0.82, 'rgba(0,0,0,0)'); fold.addColorStop(1, 'rgba(0,0,0,.28)');
  c.fillStyle = fold; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(214,180,96,.85)'; c.lineWidth = 3; c.strokeRect(26, 26, W - 52, H - 52);
  c.strokeStyle = 'rgba(214,180,96,.35)'; c.lineWidth = 1; c.strokeRect(36, 36, W - 72, H - 72);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = 'rgba(214,180,96,.9)';
  c.font = '500 26px Oswald, sans-serif';
  c.fillText('C  H  A  M  P  I  O  N', W / 2, 120);
  c.fillRect(W / 2 - 30, 150, 60, 2);
  c.fillStyle = '#F1E2B6';
  c.font = '700 72px "Noto Serif KR", serif';
  const chars = String(name || '우승자').slice(0, 5).split('');
  chars.forEach((ch, i) => c.fillText(ch, W / 2, H * 0.52 + (i - (chars.length - 1) / 2) * 92));
  if (year) {
    c.fillStyle = 'rgba(214,180,96,.9)'; c.font = '500 34px Oswald, sans-serif';
    c.fillText(year, W / 2, H - 120);
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** 벽 — 실제 두께를 가진 박스 + 판벽 + 챠레일 + 걸레받이 */
/* ── 통로 = 전시실 입구 ────────────────────────────────
   개구부와 상인방은 world.js 가 벽 조각으로 만든다. 여기서는 입구답게 보이는 것들 —
   문선(브라스 몰딩) · 양쪽 방 명패 · 문턱 · 닫힌 방의 문짝.
   ──────────────────────────────────────────────────── */
function buildDoorDressing() {
  const grp = M.wallGroup || M.scene;
  for (const d of M.doors) {
    const rA = M.roomById[d.rooms[0]], rB = M.roomById[d.rooms[1]];
    const dH = d.h || DOOR_H;                    // 이 문의 높이(cm)
    const wid = (d.b - d.a) / CM;
    const isV = d.axis === 'v';
    const Y = d.y0 / CM;                          // 문이 선 층의 바닥(world.js 가 준다)
    const cx = isV ? d.coord / CM : (d.a + d.b) / 2 / CM;
    const cz = isV ? (d.a + d.b) / 2 / CM : d.coord / CM;
    const T = WT / CM;
    // 유리문 — 문선·명패 대신 청동 틀만(world.js glassRun 이 유리를 그린다)
    if (d.glass) continue;

    // ② 문선 — 가는 짙은 청동(예전엔 번쩍이는 놋쇠였다. 현대 미술관의 문틀은 드러나지 않는다)
    const brass = sharedMat('doorframe', () => new THREE.MeshStandardMaterial({ color: 0x2E2924, roughness: 0.4, metalness: 0.7 }));
    const jw = 0.075, jd = T + 0.05;
    for (const s2 of [1, -1]) {
      const jamb = new THREE.Mesh(
        new THREE.BoxGeometry(...(isV ? [jd, dH / CM, jw] : [jw, dH / CM, jd])), brass);
      jamb.position.set(
        cx + (isV ? 0 : s2 * (wid / 2 + jw / 2)), Y + dH / CM / 2,
        cz + (isV ? s2 * (wid / 2 + jw / 2) : 0));
      grp.add(jamb);
    }
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(...(isV ? [jd, jw, wid + jw * 2] : [wid + jw * 2, jw, jd])), brass);
    head.position.set(cx, Y + dH / CM + jw / 2, cz);
    grp.add(head);

    // ③ 전시실 명패 — 양쪽에서 각자 들어갈 방 이름이 보이게
    for (const [me, other, sgn] of [[rA, rB, 1], [rB, rA, -1]]) {
      // 명패가 향하는 방향: '나' 에서 '상대' 를 보는 쪽
      const toOther = isV
        ? Math.sign(other.cx - me.cx) : Math.sign(other.cz - me.cz);
      // 벽 글자 — 명패가 붙는 벽(= '나' 쪽 벽) 색에 맞춰 짙은 글자/놋쇠 글자
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(wid * 0.9, 1.7), Math.min(wid * 0.9, 1.7) * 240 / 1024),
        new THREE.MeshStandardMaterial({
          map: signTex(other.name, other.en, DARK_WALL.has(me.mat)),
          roughness: 0.5, metalness: DARK_WALL.has(me.mat) ? 0.6 : 0, transparent: true, alphaTest: 0.05,
        }));
      const off = T / 2 + 0.012;
      if (isV) {
        plate.position.set(cx - toOther * off, Y + dH / CM + 0.34, cz);
        plate.rotation.y = toOther > 0 ? -Math.PI / 2 : Math.PI / 2;
      } else {
        plate.position.set(cx, Y + dH / CM + 0.34, cz - toOther * off);
        plate.rotation.y = toOther > 0 ? Math.PI : 0;
      }
      grp.add(plate);
    }

    // ④ 문턱 — 놋쇠 띠
    // 두께 1.2cm 는 스치는 각도에서 1픽셀 이하가 되어 가장 심하게 반짝였다 → 1.8cm
    const sill = new THREE.Mesh(
      new THREE.BoxGeometry(...(isV ? [T + 0.06, 0.018, wid] : [wid, 0.018, T + 0.06])), brass);
    sill.position.set(cx, Y + 0.009, cz);
    grp.add(sill);

    // ⑤ 닫힌 문 — 문짝으로 개구부를 채운다(충돌은 buildWalls 의 ghost 벽이 담당)
    if (d.closed) {
      // 관람객이 서 있는 쪽 = 닫히지 않은 방
      const openRoom = rA.closed ? rB : rA;
      const f = (isV ? Math.sign(openRoom.cx - cx) : Math.sign(openRoom.cz - cz)) || 1;
      const dg = buildClosedDoor(wid, d.closed, f, dH / CM);
      dg.position.set(cx, Y, cz);
      dg.rotation.y = isV ? Math.PI / 2 : 0;
      grp.add(dg);

      /* 문을 조사할 수 있게 — 막아만 두면 '버그인가?' 로 읽힌다.
         M.exhibits 에는 넣지 않는다(소장품 수·관람률이 오염된다). */
      const shut = rA.closed ? rA : rB;
      const hitW = new THREE.Mesh(
        new THREE.BoxGeometry(...(isV ? [T + 0.24, dH / CM, wid] : [wid, dH / CM, T + 0.24])),
        new THREE.MeshBasicMaterial({ visible: false }));
      hitW.position.set(cx, Y + dH / CM / 2, cz);
      grp.add(hitW);
      const info = {
        id: 'shut-' + shut.id, type: 'placard', icon: '🔒',
        label: shut.name, title: shut.name,
        subtitle: `${shut.en} · ${d.closed}`,
        x: cx * CM, z: cz * CM,
        body: [
          '문이 닫혀 있다. 놋쇠 손잡이에 사슬로 안내판이 걸려 있다.',
          `〈${shut.name}〉 — ${d.closed}.`,
          shut.desc,
          '',
          '큐레이터는 아직 순서를 정하지 못했다. 준비가 끝나면 이 문은 열린다.',
        ].join('\n'),
      };
      M.pickables.push(hitW);
      M.artByMesh.set(hitW, info);
    }
  }
}

/**
 * 안내판 텍스처 — **놋쇠 판에 새긴 검은 글자**.
 *
 * 처음엔 어두운 판 + 금색 글자로 만들었는데, 어두운 문짝 위에
 * 어두운 판을 걸고 조명까지 낮추니 글자 명도가 배경과 같아져(35 vs 34)
 * 사실상 읽히지 않았다. 판을 밝게 뒤집으면 어두운 실내에서 가장 먼저 눈에 든다.
 * (실제 박물관의 안내 명패도 이쪽이다)
 */
function noticeTex(title, sub) {
  const W = 640, H = 200;
  const cv = makeCanvas(W, H), c = cv.getContext('2d');
  // 놋쇠 바탕 + 세로 광택
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#E8CE87'); g.addColorStop(0.42, '#C9A227');
  g.addColorStop(0.58, '#B08F1F'); g.addColorStop(1, '#DCC079');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // 헤어라인 — 놋쇠 특유의 결
  c.globalAlpha = 0.10;
  for (let y = 0; y < H; y += 3) {
    c.fillStyle = y % 6 ? '#FFF6DC' : '#6E5713';
    c.fillRect(0, y, W, 1);
  }
  c.globalAlpha = 1;
  // 음각 홈(테두리)
  c.strokeStyle = 'rgba(58,44,12,.55)'; c.lineWidth = 5;
  c.strokeRect(15, 15, W - 30, H - 30);
  c.strokeStyle = 'rgba(255,244,214,.45)'; c.lineWidth = 2;
  c.strokeRect(19, 19, W - 38, H - 38);

  c.textAlign = 'center'; c.textBaseline = 'middle';
  // 새긴 글자 — 아래쪽 하이라이트를 먼저 깔면 파인 것처럼 보인다
  const cut = (tx, y, font) => {
    c.font = font;
    c.fillStyle = 'rgba(255,246,220,.5)'; c.fillText(tx, W / 2, y + 2.5);
    c.fillStyle = '#181206'; c.fillText(tx, W / 2, y);
  };
  cut(title, 78, '700 64px "Noto Serif KR", serif');
  cut(sub, 143, '500 34px "Noto Serif KR", serif');

  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/**
 * 닫힌 문 — 개구부를 채우는 양문(兩門) + 매달린 안내판 + 차단봉.
 *
 * 벽으로 막아버리면 '원래 방이 없는 것' 이 된다. 문이 있어야
 * "전시실은 있지만 지금은 닫혀 있다" 로 읽히고, 나중에 열 때도 자연스럽다.
 *
 * 로컬 좌표: 폭 = X, 두께 = Z, 바닥 = y0. 호출부에서 회전시킨다.
 * @param {number} wid  개구부 폭(m)
 * @param {string} note 안내 문구(ROOMS 의 closed 값)
 * @param {number} f    관람객이 서 있는 쪽(+1 / −1) — 안내판·차단봉이 이쪽을 본다
 */
function buildClosedDoor(wid, note, f, hM) {
  const G = new THREE.Group();
  G.name = 'closed-door';
  const H = hM || DOOR_H / CM;
  const leafT = 0.062;             // 문짝 두께
  const half = wid / 2;            // 문짝 한 짝의 폭
  const wood = new THREE.MeshStandardMaterial({ color: 0x2E2117, roughness: 0.46, metalness: 0.05 });
  const panelM = new THREE.MeshStandardMaterial({ color: 0x211810, roughness: 0.60, metalness: 0.04 });
  // 얇은 띠(패널 테·맞댐대·킥플레이트)는 넓은 하이라이트로, 손잡이는 광택을 살린다
  const brassM = trimMat();
  const shiny = new THREE.MeshStandardMaterial({ color: BRASS, roughness: 0.34, metalness: 0.86 });
  const add = (geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    G.add(m);
    return m;
  };

  for (const s of [-1, 1]) {
    const xc = s * half / 2;       // 문짝 중심
    const leaf = add(new THREE.BoxGeometry(half - 0.014, H - 0.02, leafT), wood, xc, H / 2, 0);
    leaf.castShadow = true; leaf.receiveShadow = true;

    /* 우물 패널 2단 — 밋밋한 판자와 앤틱 도어를 가르는 부분.
       브라스 테는 패널보다 **얕게** 둬야 패널 앞면이 앞서 나오고 테두리만 보인다. */
    for (const [py, ph] of [[H * 0.705, H * 0.40], [H * 0.275, H * 0.325]]) {
      add(new THREE.BoxGeometry(half * 0.68, ph + 0.045, leafT + 0.010), brassM, xc, py, 0);
      add(new THREE.BoxGeometry(half * 0.62, ph, leafT + 0.016), panelM, xc, py, 0);
    }

    // 발판(킥 플레이트) — 실제 관람 동선에서 가장 먼저 닳는 곳
    add(new THREE.BoxGeometry(half - 0.05, 0.22, leafT + 0.012), brassM, xc, 0.13, 0);

    // 손잡이 — 세로 바 + 대좌 2개. 양쪽 면 모두(문이니까)
    for (const side of [1, -1]) {
      const zz = side * (leafT / 2 + 0.042);
      add(new THREE.CylinderGeometry(0.017, 0.017, 0.50, 10), shiny, s * 0.085, H * 0.46, zz);
      for (const by of [H * 0.46 - 0.23, H * 0.46 + 0.23]) {
        const st = add(new THREE.CylinderGeometry(0.013, 0.013, 0.055, 8), shiny,
          s * 0.085, by, side * (leafT / 2 + 0.020));
        st.rotation.x = Math.PI / 2;
      }
      // 지판(손 닿는 자리) — 놋쇠가 닳아 반짝이는 부분
      add(new THREE.BoxGeometry(0.085, 0.30, 0.008), brassM, s * 0.20, H * 0.46, zz * 0.62);
    }
  }

  // 맞댐대(아스트라갈) — 두 문짝이 만나는 세로 선. 없으면 틈이 그냥 벌어져 보인다
  for (const side of [1, -1]) {
    add(new THREE.BoxGeometry(0.034, H - 0.05, 0.012), brassM, 0, H / 2, side * (leafT / 2 + 0.006));
  }

  // 매달린 안내판 — 관람객 쪽 면에만
  const sw = Math.min(wid * 0.70, 1.35), sh = sw * 0.3125;
  const sy = H * 0.68;                      // 손잡이(H*0.46 ±0.25)보다 위 — 겹치면 지저분하다
  const sz = f * (leafT / 2 + 0.055);
  const noteTex = noticeTex('관람 불가', note);
  const sign = add(new THREE.PlaneGeometry(sw, sh),
    // emissive 를 조금 섞는다 — 조명이 닿지 않는 각도에서도 판이 완전히 죽지 않게.
    // (emissiveMap 이 같은 텍스처라 놋쇠 바탕만 살고 새긴 글자는 그대로 어둡다)
    new THREE.MeshStandardMaterial({
      map: noteTex, emissive: 0xFFFFFF, emissiveMap: noteTex, emissiveIntensity: 0.30,
      roughness: 0.42, metalness: 0.55,
    }),
    0, sy, sz);
  sign.name = 'closed-notice';
  if (f < 0) sign.rotation.y = Math.PI;
  // 사슬 2줄 — 판 위끝에서 상인방까지. 공중에 떠 있으면 안 된다
  const top = H - 0.04, cLen = top - (sy + sh / 2);
  for (const s of [-1, 1]) {
    add(new THREE.CylinderGeometry(0.006, 0.006, cLen, 6), brassM,
      s * sw * 0.40, sy + sh / 2 + cLen / 2, sz * 0.9);
  }

  /* 차단봉 — 문 앞. "들어가지 말라" 를 가장 빨리 읽히게 하는 물건.
     obj3d 의 stanchion 은 양쪽으로 로프가 뻗어 벽을 뚫으므로,
     여기서는 **두 기둥 사이에 한 줄만** 늘어뜨린다. */
  const steel = new THREE.MeshStandardMaterial({ color: 0x4A4640, roughness: 0.38, metalness: 0.8 });
  const velvet = new THREE.MeshStandardMaterial({ color: 0x6E1F26, roughness: 0.86 });
  const px = half * 0.60, pz = f * 0.46, ph2 = 0.94;
  for (const s of [-1, 1]) {
    const post = add(new THREE.CylinderGeometry(0.024, 0.028, ph2, 10), steel, s * px, ph2 / 2 + 0.06, pz);
    post.castShadow = true;
    add(new THREE.CylinderGeometry(0.15, 0.15, 0.045, 14), steel, s * px, 0.022, pz);
    add(new THREE.SphereGeometry(0.042, 10, 8), brassM, s * px, ph2 + 0.09, pz);
  }
  const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-px, ph2 - 0.06, pz),
    new THREE.Vector3(0, ph2 - 0.30, pz),      // 늘어짐
    new THREE.Vector3(px, ph2 - 0.06, pz),
  ]), 20, 0.017, 8, false), velvet);
  rope.castShadow = true;
  G.add(rope);
  return G;
}


/* ══════════════════════════════════════════════════════════
   조명 풀
   ══════════════════════════════════════════════════════════
   ⚠️ 전시물마다 SpotLight 를 달면 라이트가 50개를 넘고, three.js 는
      라이트 수가 바뀔 때마다 셰이더를 재컴파일해 프레임이 끊긴다.
   → **개수가 고정된 스포트라이트 풀**을 만들어, 매번 가까운 전시물에 재배치한다.
      라이트 총수가 변하지 않으므로 재컴파일이 없다.
   ────────────────────────────────────────────────────────── */
const POOL_N = 8;
function initLightPool() {
  M.pool = [];
  for (let i = 0; i < POOL_N; i++) {
    const sp = new THREE.SpotLight(LIGHT_WARM, 0, 9.5, 0.40, 0.62, 1.1);
    /* 그림자 없음 — 예전엔 앞 3발이 매 프레임 그림자 맵을 그렸다. 이제 그림자는 해(정적)가
       맡고, 액자 그림자는 벽에서 5cm 떠 있어 거의 보이지 않았다 */
    sp.castShadow = false;
    const tgt = new THREE.Object3D();
    M.scene.add(sp, tgt);
    sp.target = tgt;
    M.pool.push({ sp, tgt, e: null, fade: 0 });
  }
  // 관람자 주변을 아주 약하게 채우는 광 — 완전 암부 방지
  M.handLight = new THREE.PointLight(0xFFE3B8, 0.9, 7.5, 1.3);
  M.scene.add(M.handLight);
}

/**
 * 가까운 전시물에 조명 풀을 재배치.
 *
 * ⚠️ 예전 구현은 거리순 상위 8개를 **그대로 슬롯 0~7 에 밀어넣었다.** 그래서
 *    ① 8·9등이 비슷한 거리면 시선을 조금만 돌려도 순위가 뒤바뀌어 스포트라이트가
 *       0.2초마다 켜졌다 꺼졌고(색이 확 변하는 글리치),
 *    ② 정렬 순서가 바뀌면 **그림자 담당 슬롯(앞 3개)** 이 다른 전시물로 넘어가
 *       그림자가 통째로 사라졌다 나타났다.
 * → 세 가지로 고친다.
 *    ㉠ 히스테리시스 — 이미 켜진 전시물은 거리를 깎아줘서 잘 안 밀린다
 *    ㉡ 슬롯 고정 — 계속 뽑힌 전시물은 **같은 슬롯**에 머문다(그림자 유지)
 *    ㉢ 페이드 — 새로 배정된 슬롯은 0에서 밝아진다(animateFocus 의 slot.fade)
 */
const KEEP_BIAS = 0.78;   // 켜져 있는 것을 밀어내려면 22% 더 가까워야 한다
function assignLights() {
  const cur = new Set(M.pool.map((s) => s.e).filter(Boolean));
  const here = roomAt(M.pos.x * CM, M.pos.z * CM);
  const near = M.exhibits
    // 보이지 않는 방의 전시물에 슬롯을 낭비하지 않는다
    .filter((e) => e.node && e.spotAnchor && (M.roomGroups[e.room] || {}).visible !== false)
    /* 우선순위 — 거리만 보면 **벽 너머 옆방 전시물**이 슬롯을 가져갔다(트로피실 남쪽에 서면
       기록 보관실 스코어카드와 정수기가 켜지고 정작 북벽 트로피가 어두웠다).
       → 단(段)으로 나눈다: ① 지금 방의 전시물 ② 지금 방의 소품 ③ 옆방. 거리·히스테리시스는
         같은 단 안에서만 겨룬다. 지금 방 후보가 8개 이하면(로비 등) 결과는 전과 같다. */
    .map((e) => {
      const d = Math.hypot(e.x / CM - M.pos.x, e.z / CM - M.pos.z);
      const tier = (here && e.room !== here.id) ? 2000 : (e.type === 'prop' ? 1000 : 0);
      return { e, key: tier + (cur.has(e) ? d * KEEP_BIAS : d) };
    })
    .sort((a, b) => a.key - b.key)
    .slice(0, POOL_N);

  // ㉡ 이미 그 전시물을 비추던 슬롯은 건드리지 않는다
  const want = new Set(near.map((p) => p.e));
  const free = [];
  for (const slot of M.pool) {
    if (slot.e && want.has(slot.e)) want.delete(slot.e);
    else { slot.e = null; free.push(slot); }   // intensity 는 animateFocus 가 서서히 줄인다
  }
  const rest = near.filter((p) => want.has(p.e));
  free.forEach((slot, i) => {
    slot.e = rest[i] ? rest[i].e : null;
    if (slot.e) slot.fade = 0;                 // ㉢ 0 에서 켜진다
  });

  for (const slot of M.pool) {
    if (!slot.e) continue;
    const e = slot.e, room = M.roomById[e.room];
    // 천장에서 살짝 앞으로 — 그림을 위에서 비춘다
    // 방 그룹이 층 높이에 떠 있으므로 월드 높이 = 방 바닥 + 방 안 높이
    const top = Math.min(room.h, room.sky ? FLOOR_H : room.h) - 34;
    slot.sp.position.set(
      (e.x + e.nx * 55) / CM, (room.y0 + top) / CM, (e.z + e.nz * 55) / CM);
    slot.tgt.position.set(e.x / CM, (room.y0 + e.y) / CM, e.z / CM);
  }
}

/* ══════════════════════════════════════════════════════════
   방 조명 — 개수를 고정한다(가상 조명)
   ══════════════════════════════════════════════════════════
   ⚠️ three 의 셰이더는 **광원 개수를 상수로 박아** 컴파일된다. 방 단위 컬링으로
      보이는 광원 수가 방마다 14~30 으로 달라서, 문을 지날 때마다 모든 재질이 다시
      컴파일됐다 — 측정으로 새 방 첫 프레임이 명예의 전당 1.2초 · 사진 갤러리 2.2초 ·
      우승자의 방 2.5초였다(다시 들어가면 3ms). 폰에서는 문마다 화면이 멈춘다.
   → 방에 둔 점광·스포트는 **자리 정보(vlights)** 로만 남기고, 실제 광원은 고정 개수의
     풀로 만든다. 방이 바뀌면 풀에 그 자리 값을 옮겨 담을 뿐이라 개수가 변하지 않는다.
     풀 크기 = '어느 방에 서도 보이는 최대 개수'(cullRooms 와 같은 이웃 규칙)라
     화면은 예전과 똑같고, 모바일 uniform 예산도 예전 최대치(로비)를 넘지 않는다.
   ※ 전시물 스포트 풀(POOL_N)과 손전등은 원래 고정이라 그대로 둔다. */
function virtualizeLights() {
  const keep = new Set([M.handLight, ...M.pool.map((sl) => sl.sp)]);
  if (M.torch) keep.add(M.torch);                  // v105 — 손전등(torch.js)은 풀이 아니다
  const found = [];
  M.scene.updateMatrixWorld(true);
  M.scene.traverse((o) => { if ((o.isPointLight || o.isSpotLight) && !keep.has(o)) found.push(o); });
  const V = [];
  for (const o of found) {
    let p = o.parent, room = null;
    while (p) { if (p.name && p.name.indexOf('room-') === 0) { room = p.name.slice(5); break; } p = p.parent; }
    const v = {
      spot: !!o.isSpotLight, room, pos: o.getWorldPosition(new THREE.Vector3()),
      color: o.color.clone(), intensity: o.intensity * ((typeof NIGHT !== 'undefined' && NIGHT.on) ? NIGHT.lightIn : 1), distance: o.distance, decay: o.decay,
    };
    if (o.isSpotLight) {
      o.target.updateMatrixWorld(true);
      v.angle = o.angle; v.penumbra = o.penumbra;
      v.tgt = o.target.getWorldPosition(new THREE.Vector3());
    }
    o.parent.remove(o);
    V.push(v);
  }
  M.vlights = V;

  /* 풀 크기 — 어느 방에 서든 보이는 최대 개수. 단 **상한을 둔다**: 트인 그랜드 홀에서는
     보이는 방이 많아 모두 켜면 모바일 uniform 한계에 다시 닿는다. 넘치면 가까운 것부터 */
  let np = 0, ns = 0;
  for (const cur of M.rooms) {
    const on = visibleSet(cur);
    const vis = V.filter((v) => !v.room || on.has(v.room));
    np = Math.max(np, vis.filter((v) => !v.spot).length);
    ns = Math.max(ns, vis.filter((v) => v.spot).length);
  }
  np = Math.min(np, 8); ns = Math.min(ns, 8);
  M.vpoint = [];
  M.vspot = [];
  for (let i = 0; i < np; i++) {
    const l = new THREE.PointLight(0xffffff, 0);
    M.scene.add(l);
    M.vpoint.push(l);
  }
  for (let i = 0; i < ns; i++) {
    const l = new THREE.SpotLight(0xffffff, 0);
    l.castShadow = false;
    M.scene.add(l, l.target);
    M.vspot.push(l);
  }
  [...M.vpoint, ...M.vspot].forEach(parkLight);
  assignRoomLights();
}

/* 쉬는 풀 광원 — 바닥 밑, 아래를 향하게, 사거리 1cm.
   ⚠️ 기본값 그대로(위치·타깃 모두 원점) 두면 스포트 방향이 0 벡터라 셰이더에서 NaN 이 되고,
      NaN × 세기 0 = NaN 이라 **그 화면의 스포트 조명 전체가 꺼졌다**(우승자의 방이 안 보이는
      방에서만 — 거기서만 스포트 풀이 비었다). 세기만 0 으로는 안 된다. */
function parkLight(l) {
  l.intensity = 0;
  l.position.set(0, -100, 0);
  l.distance = 0.01;
  if (l.target) { l.target.position.set(0, -101, 0); l.target.updateMatrixWorld(); }
}

/** 보이는 방의 자리 값을 풀에 담는다 — 넘치면(방 경계 등) 가까운 것부터 */
function assignRoomLights() {
  if (!M.vlights) return;
  const vis = M.vlights.filter((v) => !v.room || (M.roomGroups[v.room] || {}).visible !== false);
  const d2 = (v) => (v.pos.x - M.pos.x) ** 2 + (v.pos.z - M.pos.z) ** 2;
  const fill = (pool, list) => {
    list.sort((a, b) => d2(a) - d2(b));
    pool.forEach((l, i) => {
      const v = list[i];
      l.userData.v = v || null;                  // v100 — 밤 깜빡임이 방 · 원래 세기를 읽는다
      if (!v) { parkLight(l); return; }
      l.position.copy(v.pos);
      l.color.copy(v.color);
      l.intensity = v.intensity;
      l.distance = v.distance;
      l.decay = v.decay;
      if (v.spot) {
        l.angle = v.angle; l.penumbra = v.penumbra;
        l.target.position.copy(v.tgt);
        l.target.updateMatrixWorld();
      }
    });
  };
  fill(M.vpoint, vis.filter((v) => !v.spot));
  fill(M.vspot, vis.filter((v) => v.spot));
}

/* 전관 셰이더를 입장 직후 한 번에 — 광원 수가 고정됐으므로 여기서 만든 것이 끝까지 쓰인다.
   compile() 은 **보이는 것만** 훑으므로 잠깐 모든 방을 켠다. compileAsync 는 셰이더를
   요청만 하고(KHR_parallel_shader_compile) 기다리는 동안 렌더를 막지 않는다 —
   요청이 동기로 끝나므로 가시성은 바로 되돌려도 된다. */
function precompileAll() {
  const R = M.renderer;
  M.rooms.forEach((r) => { if (M.roomGroups[r.id]) M.roomGroups[r.id].visible = true; });
  /* ⚠️ 씬은 화면이 아니라 후처리 타깃(sceneRT)에 그려진다. 타깃 없이 compile 하면
     sRGB 출력용 셰이더가 만들어지고, 실제 렌더(선형 출력)에서는 **다른 변형**이라 버려진다.
     여기서는 모든 방을 켠 채 **한 번 실제로 그린다** — 셰이더 전부 + 정적 그림자 맵이
     이 한 번으로 준비된다(해는 움직이지 않으므로 그림자는 다시 그리지 않는다).
     컬링으로 꺼진 방의 그림자 캐스터(필드의 나무 등)도 이때 맵에 들어간다. */
  const prevRT = R.getRenderTarget();
  try {
    R.shadowMap.needsUpdate = true;
    R.setRenderTarget(M.post && M.post.target ? M.post.target : null);
    R.render(M.scene, M.cam);
  } catch (e) { /* 첫 렌더에서 다시 된다 */ }
  R.setRenderTarget(prevRT);
  lastCull = '';
  cullRooms(M.room);
  preuploadTextures();
  const ld = $('glLoad');
  if (ld) ld.remove();
  if (M.post.enableAO) M.post.enableAO(true);
  M.ready = true;
  if (M._readyRes) M._readyRes();
}

/* 텍스처도 미리 올린다 — 셰이더를 잡고 나니 새 방 첫 프레임에 남은 비용은 텍스처 업로드
   (방마다 12~17장, 70~160ms)였다. 입장 뒤 한 프레임에 3장씩 나눠 GPU 에 올려서
   걸어 들어가기 전에 끝낸다. 한꺼번에 올리면 그 순간이 또 하나의 멈춤이 된다. */
function preuploadTextures() {
  const R = M.renderer;
  if (!R.initTexture) return;
  const seen = new Set();
  M.scene.traverse((o) => {
    const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of ms) for (const k of ['map', 'normalMap']) if (m[k] && m[k].image) seen.add(m[k]);
  });
  const q = [...seen];
  const tick = () => {
    for (let i = 0; i < 3 && q.length; i++) {
      try { R.initTexture(q.shift()); } catch (e) { /* 다음 것 */ }
    }
    if (q.length) setTimeout(tick, 24);
  };
  setTimeout(tick, 300);
}

/* ── 전시물 ────────────────────────────────────────────── */
const loader = new THREE.TextureLoader();
/* ── 이미지 텍스처 — 한 번만 · 동시 6장 · 크기 상한 ──────────────
   ⚠️ 예전엔 전시물마다 await 로 **한 장씩** 받았다(초상 40 + 사진 12 + 영상 10 ≈ 60번 직렬).
      그리고 원본을 그대로 GPU 에 올렸다 — 폰 사진 4000×3000 은 한 장에 텍스처 48MB 다.
      모바일에서 이게 쌓이면 컨텍스트가 날아가 화면이 검게 된다.
   → ① 같은 주소는 한 번만 받고(Promise 캐시) ② 동시 6장까지 병렬로 받고
     ③ 긴 변이 상한을 넘으면 캔버스로 줄여서 올린다. 벽의 104×132cm 액자에는
     1280px(폰 768px)이면 충분하다. 팝업은 원본 주소를 쓰므로 확대해 볼 때 화질은 그대로다. */
const TEX_MAX = matchMedia('(pointer: coarse)').matches ? 768 : 1280;
const TEX_PAR = 6;
const TEX_JOBS = new Map();
let texActive = 0;
const texWait = [];
const texSlot = () => new Promise((res) => {
  if (texActive < TEX_PAR) { texActive++; res(); } else texWait.push(res);
});
const texFree = () => { const next = texWait.shift(); if (next) next(); else texActive--; };

function shrinkTex(t) {
  const im = t && t.image;
  const w = im && (im.naturalWidth || im.width), h = im && (im.naturalHeight || im.height);
  if (!w || !h) return t;
  const k = TEX_MAX / Math.max(w, h);
  if (k >= 1) return t;
  const cv = makeCanvas(Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k)));
  const c = cv.getContext('2d');
  c.imageSmoothingQuality = 'high';
  c.drawImage(im, 0, 0, cv.width, cv.height);
  t.image = cv;
  t.needsUpdate = true;
  return t;
}

/* v96 — 벽에 거는 사진은 **서버에서 줄인 것**(api/thumb.php)을 먼저 받는다.
   예전엔 원본(한 장 2.7MB PNG 같은 것)을 받아 입장이 8초 넘게 늦었다. 액자는 어차피 TEX_MAX 로 줄여 쓴다.
   같은 서버의 /projects/ 아래 그림만 · thumb.php 가 없거나 실패하면(로컬 · PHP 오류) 원본으로 다시 받는다. */
function thumbURL(url) {
  try {
    const u = new URL(url, location.href);
    if (u.origin !== location.origin || !/^\/projects\/(?!museum\/).+\.(jpe?g|png|webp|gif)$/i.test(u.pathname)) return null;
    return 'api/thumb.php?w=' + (TEX_MAX > 800 ? 1024 : 768) + '&src=' + encodeURIComponent(decodeURIComponent(u.pathname));
  } catch (e) { return null; }
}
function loadTex(url) {
  if (!url) return Promise.resolve(null);
  if (TEX_JOBS.has(url)) return TEX_JOBS.get(url);
  const small = thumbURL(url);
  const job = texSlot().then(() => new Promise((res) => {
    const ok = (t) => { t.colorSpace = THREE.SRGBColorSpace; res(shrinkTex(t)); };
    const orig = () => loader.load(url, ok, undefined, () => res(null));
    if (small) loader.load(small, ok, undefined, orig);
    else orig();
  })).finally(texFree);
  TEX_JOBS.set(url, job);
  return job;
}

/* ── 관람 안내 액자 = 버디버디 로고 포스터 ────────────────────
   빈 매트지만 걸려 있으면 '아직 안 만든 액자' 로 보인다.
   실제 버디버디 로고(golfscore assets/img/logo.png 사본)를 크림색 종이에
   앉혀 인쇄된 안내 포스터처럼 만든다. */
let LOGO_JOB = null;
function loadLogo() {
  if (!LOGO_JOB) {
    LOGO_JOB = new Promise((res) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);       // 없어도 글자만으로 포스터가 완성된다
      // 관 안의 안내 포스터는 **버디버디 로고**를 쓴다(타이틀 화면만 한신 마크).
      // SVG 도 캔버스에 그릴 수 있다(파일에 width/height 가 있어야 한다 — 둘 다 있음).
      im.src = SITE.posterLogo || SITE.logo || 'assets/logo.png';
    });
  }
  return LOGO_JOB;
}

/* ── 관람 안내 = 전시 포스터(v79) ─────────────────────────────
   예전엔 누렇게 바랜 종이(섬유·얼룩·비네트)였다 — 90년대 전단지처럼 보였다.
   지금은 현대 미술관 포스터: 흰 바탕, 큰 로고, 굵은 제목, 아래쪽 정보 띠. */
async function posterTex() {
  const W = 560, H = 712;
  const cv = makeCanvas(W, H), c = cv.getContext('2d');
  c.fillStyle = '#F4F2ED'; c.fillRect(0, 0, W, H);
  // 위쪽 절반 — 짙은 녹색 판에 금색 로고(블록 구성)
  c.fillStyle = '#18261E'; c.fillRect(0, 0, W, H * 0.56);
  const im = await loadLogo();
  if (im) {
    const boxW = W * 0.5, boxH = H * 0.3;
    const k = Math.min(boxW / im.width, boxH / im.height);
    const lw = im.width * k, lh = im.height * k;
    c.drawImage(im, (W - lw) / 2, H * 0.28 - lh / 2, lw, lh);
  }
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  const P = 40;
  c.fillStyle = '#C9A24A'; c.font = '500 15px Oswald, sans-serif';
  c.fillText((SITE.mark || '').split('').join(' '), P, H * 0.56 + 44);
  c.fillStyle = '#1C1B18';
  const tLines = (SITE.posterTitle && SITE.posterTitle.length) ? SITE.posterTitle : [SITE.title];
  tLines.forEach((ln, i) => {
    c.font = SITE.latin ? '700 54px Cinzel, "Noto Serif KR", serif' : '900 50px "Noto Serif KR", serif';
    c.fillText(ln, P - 3, H * 0.56 + 104 + i * 58);
  });
  const y0 = H * 0.56 + 104 + (tLines.length - 1) * 58;
  c.fillStyle = '#5A564E'; c.font = '400 17px "Noto Serif KR", serif';
  c.fillText('전시물은 큐레이터가 고르지 않습니다.', P, y0 + 44);
  c.fillText('라운드가 등록되면 한 점 늘어납니다.', P, y0 + 70);
  // 아래 정보 띠
  c.fillStyle = '#1C1B18'; c.fillRect(P, H - 64, W - P * 2, 1);
  c.fillStyle = '#1C1B18'; c.font = '500 14px Oswald, "Noto Serif KR", sans-serif';
  c.fillText('1F · 2F · 18TH HOLE', P, H - 36);
  c.textAlign = 'right';
  c.fillText('상설 전시 · 무료 관람', W - P, H - 36);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* ── 기록 보관실 = 실기록으로 인쇄한 스코어카드 ──────────────
   예전엔 이 방의 액자에 이니셜 플레이스홀더가 걸려서(원본 사진은 라운드마다
   get_scores 를 따로 불러야 한다) 방을 '전시 준비 중' 으로 닫아 두었다.
   → 액자 그림을 **데이터로 직접 그린다.** list_rounds 가 주는 선수별 합계로
     골프장 스코어카드처럼 인쇄하고, 우승자 줄에는 붉은 인장을 찍는다.
     홀별 표·원본 사진은 팝업을 열 때 받는다(hydrateScore).
   캔버스 1032×708 = 액자 172×118cm 와 같은 비율(1.458). */
function scorecardTex(card, no) {
  const W = 1032, H = 708;
  const cv = makeCanvas(W, H), c = cv.getContext('2d');
  const rnd = seeded((card.id || 7) * 131);

  // 종이 — 코팅 안 된 카드지. 가장자리로 갈수록 누렇다
  const g = c.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#F5F0E3'); g.addColorStop(0.6, '#EAE2CF'); g.addColorStop(1, '#DCD1B8');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 1400; i++) {
    const a = rnd() * 0.05;
    c.fillStyle = rnd() < 0.5 ? `rgba(96,78,44,${a})` : `rgba(255,252,242,${a})`;
    c.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2.4, 1);
  }
  // 얼룩 하나 — 커피 잔 자국처럼 연하게(카드마다 자리가 다르다)
  const sx = W * (0.55 + rnd() * 0.35), sy = H * (0.55 + rnd() * 0.3), sr = 60 + rnd() * 50;
  const st = c.createRadialGradient(sx, sy, sr * 0.82, sx, sy, sr);
  st.addColorStop(0, 'rgba(120,88,40,0)'); st.addColorStop(0.9, 'rgba(120,88,40,.07)'); st.addColorStop(1, 'rgba(120,88,40,0)');
  c.fillStyle = st; c.fillRect(0, 0, W, H);

  // 머리띠 — 클럽 카드의 녹색 띠
  c.fillStyle = '#1F3A2C'; c.fillRect(0, 0, W, 92);
  c.fillStyle = '#B8942E'; c.fillRect(0, 92, W, 4);
  c.textBaseline = 'middle';
  c.fillStyle = '#EBD69A';
  c.textAlign = 'left';
  c.font = '600 30px Cinzel, "Noto Serif KR", serif';
  c.fillText('S C O R E   C A R D', 38, 48);
  c.textAlign = 'right';
  c.font = '500 26px Oswald, sans-serif';
  if (no) c.fillText('No.' + no, W - 38, 48);

  // 긴 글자는 줄여서 한 줄에 — 코스명·이름이 표 칸을 넘지 않게
  const fitText = (t, maxW, big, small, weight, fam) => {
    let sz = big;
    for (; sz > small; sz -= 2) {
      c.font = `${weight} ${sz}px ${fam}`;
      if (c.measureText(t).width <= maxW) break;
    }
    c.font = `${weight} ${sz}px ${fam}`;
    return sz;
  };

  // 코스·날짜
  c.textAlign = 'left';
  c.fillStyle = '#2A241A';
  fitText(card.course, W - 76, 46, 28, 700, '"Noto Serif KR", serif');
  c.fillText(card.course, 38, 146);
  c.fillStyle = 'rgba(42,36,26,.72)';
  c.font = '400 22px Oswald, "Noto Serif KR", sans-serif';
  c.fillText([card.date, card.tee ? 'TEE ' + card.tee : '', card.sub, 'PAR ' + card.par]
    .filter(Boolean).join('    ·    '), 38, 192);

  // 표 머리
  const X = { name: 38, holes: 590, strokes: 760, diff: W - 38 };
  const top = 226, bottom = H - 96;
  c.fillStyle = 'rgba(31,58,44,.88)';
  c.fillRect(24, top, W - 48, 34);
  c.fillStyle = '#EBD69A';
  c.font = '500 17px Oswald, sans-serif';
  c.textAlign = 'left'; c.fillText('P L A Y E R', X.name, top + 17);
  c.textAlign = 'center';
  c.fillText('H O L E S', X.holes, top + 17);
  c.fillText('S T R O K E S', X.strokes, top + 17);
  c.textAlign = 'right'; c.fillText('±  P A R', X.diff, top + 17);

  // 선수 줄 — 2카트 묶음이면 열 명이 넘을 수 있어 줄 높이를 인원에 맞춘다
  const rows = card.rows.length ? card.rows
    : [{ name: '기록 없음', total: null, played: 0, done: false, diff: null }];
  const rowH = Math.min(58, (bottom - top - 44) / rows.length);
  const fs = Math.round(Math.min(30, rowH * 0.54));
  let stampY = null;
  rows.forEach((x, i) => {
    const y0 = top + 40 + i * rowH, yc = y0 + rowH / 2;
    if (x.win) {
      c.fillStyle = 'rgba(201,162,39,.20)'; c.fillRect(24, y0, W - 48, rowH);
      if (stampY == null) stampY = yc;
    } else if (i % 2) {
      c.fillStyle = 'rgba(60,48,30,.045)'; c.fillRect(24, y0, W - 48, rowH);
    }
    c.fillStyle = 'rgba(60,48,30,.22)'; c.fillRect(24, y0 + rowH - 1, W - 48, 1);

    c.fillStyle = x.done ? '#2A241A' : 'rgba(42,36,26,.5)';
    c.textAlign = 'left';
    fitText(x.name || '', 380, fs, 14, 700, '"Noto Serif KR", serif');
    c.fillText(x.name || '', X.name, yc);
    c.font = `500 ${fs}px Oswald, sans-serif`;
    c.textAlign = 'center';
    c.fillText(x.played ? x.played + 'H' : '—', X.holes, yc);
    c.font = `600 ${Math.round(fs * 1.12)}px Oswald, sans-serif`;
    c.fillText(x.done && x.total != null ? String(x.total) : '—', X.strokes, yc);
    c.textAlign = 'right';
    c.font = `500 ${fs}px Oswald, sans-serif`;
    const d = x.diff;
    c.fillStyle = d == null ? 'rgba(42,36,26,.45)' : d < 0 ? '#9A2A1E' : '#2A241A';
    c.fillText(d == null ? '—' : d === 0 ? 'E' : (d > 0 ? '+' + d : String(d)), X.diff, yc);
  });

  // 우승 인장 — 이름과 숫자 사이 빈 자리에 비스듬히
  if (stampY != null) {
    const r0 = Math.min(44, rowH * 0.95);
    c.save();
    c.translate(X.holes - 118, stampY);
    c.rotate(-0.21);
    c.strokeStyle = 'rgba(158,24,18,.92)'; c.fillStyle = 'rgba(158,24,18,.94)';
    c.lineWidth = 5; c.beginPath(); c.arc(0, 0, r0, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r0 - 8, 0, Math.PI * 2); c.stroke();
    c.textAlign = 'center';
    c.font = `900 ${Math.round(r0 * 0.62)}px "Noto Serif KR", serif`;
    c.fillText('우승', 0, 2);
    c.restore();
  }

  // 서명란
  c.fillStyle = 'rgba(42,36,26,.55)';
  c.fillRect(38, H - 46, 300, 1.5);
  c.fillRect(W - 338, H - 46, 300, 1.5);
  c.font = '400 16px Oswald, "Noto Serif KR", sans-serif';
  c.textAlign = 'left';
  c.fillText('MARKER' + (card.by ? '   ' + card.by : ''), 38, H - 64);
  c.textAlign = 'right';
  c.fillText('ATTEST', W - 38, H - 64);
  c.textAlign = 'center';
  c.fillStyle = 'rgba(42,36,26,.4)';
  c.font = '400 13px "Noto Serif KR", serif';
  c.fillText('원본 스코어카드는 서고에 별도 보관', W / 2, H - 24);

  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = M.renderer ? Math.min(8, M.renderer.capabilities.getMaxAnisotropy()) : 4;
  return t;
}

/** 명찰 텍스처 — 캔버스에 글자를 그려 선명하게 */
const PLATE_W = 880, PLATE_H = 240;    // 명찰 캔버스(가로:세로 = 3.67:1)

/**
 * 명찰 텍스처 — 액자 아래 붙는 검은 판.
 *
 * ⚠️ 예전에는 360×120 캔버스에 `label.slice(0, 12)` 였다. 12자에서 **그냥 잘려서**
 *    상영관의 클립 제목처럼 조금만 긴 이름은 읽을 수 없었다.
 * → ① 캔버스를 넓히고 ② **두 줄까지 감싸고**(단어 단위, 한글은 글자 단위)
 *    ③ 그래도 넘치면 글자 크기를 줄이고 ④ 마지막 수단으로만 … 처리한다.
 */
function plateTex(label, no) {
  const cv = makeCanvas(PLATE_W, PLATE_H), c = cv.getContext('2d');
  const PAD = 26;
  c.fillStyle = '#0D0F0C'; c.fillRect(0, 0, PLATE_W, PLATE_H);
  c.fillStyle = 'rgba(227,197,103,.5)'; c.fillRect(0, 0, PLATE_W, 4);

  const text = String(label == null ? '' : label).trim();
  const maxW = PLATE_W - PAD * 2 - (no ? 150 : 0);   // 번호 자리를 비워둔다

  /* 두 줄까지 감싼다. 공백이 있으면 단어 단위로, 없으면(한글 제목) 글자 단위로.
     크기를 56 → 34 까지 낮춰가며 두 줄에 들어가는 첫 크기를 쓴다. */
  let size = 56, lines = [text];
  for (; size >= 34; size -= 3) {
    c.font = `600 ${size}px "Noto Serif KR", serif`;
    if (c.measureText(text).width <= maxW) { lines = [text]; break; }
    const parts = text.indexOf(' ') !== -1 ? text.split(/\s+/) : text.split('');
    const glue = text.indexOf(' ') !== -1 ? ' ' : '';
    let a = '', b = '';
    for (const w of parts) {
      const t2 = a ? a + glue + w : w;
      if (c.measureText(t2).width <= maxW) a = t2;
      else b = b ? b + glue + w : w;
    }
    if (a && c.measureText(b).width <= maxW) { lines = [a, b]; break; }
    lines = [a || text, b];
  }
  // 그래도 넘치는 둘째 줄만 … 로 자른다(첫 줄은 위 루프가 보장한다)
  c.font = `600 ${size}px "Noto Serif KR", serif`;
  if (lines[1]) {
    let b = lines[1];
    while (b.length > 1 && c.measureText(b + '…').width > maxW) b = b.slice(0, -1);
    if (b !== lines[1]) lines[1] = b + '…';
  }

  c.fillStyle = '#E9EDE6';
  c.textBaseline = 'middle';
  const two = lines.length > 1 && lines[1];
  const baseY = two ? PLATE_H * 0.34 : PLATE_H * 0.42;
  const lh = size * 1.22;
  lines.filter(Boolean).forEach((ln, i) => c.fillText(ln, PAD, baseY + i * lh));

  if (no) {
    c.fillStyle = '#C9A227';
    c.font = '500 30px Oswald, sans-serif';
    c.textAlign = 'right';
    c.fillText('No.' + no, PLATE_W - PAD, PLATE_H - 34);
    c.textAlign = 'left';
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

async function buildExhibitMeshes() {
  // 캔버스에 웹폰트로 글자를 그리기 전에 폰트가 준비돼야 한다.
  // 안 기다리면 명찰·포스터가 기본 세리프로 그려져 톤이 깨진다.
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (_) { /* 기본 폰트로 진행 */ }
  }
  // 이미지는 먼저 전부 요청해 둔다 — 아래 루프는 순서대로 조립하지만 받는 것은 병렬이다
  for (const e of M.exhibits) if (e.img && !e.poster && !e.card) loadTex(e.img);
  for (const e of M.exhibits) {
    const grp = M.roomGroups[e.room];
    if (!grp) continue;
    const node = new THREE.Group();
    node.position.set(e.x / CM, e.y / CM, e.z / CM);
    node.rotation.y = e.yaw * D2R;

    if (e.type === 'champion') await buildChampionMesh(e, node);
    else if (e.sprite) await buildObjMesh(e, node);
    else await buildArtMesh(e, node);

    node.userData.exhibit = e;
    grp.add(node);
    e.node = node;
    M.exhibitsBuilt = (M.exhibitsBuilt || 0) + 1;
  }
  // 관람객 — 전시물 배치가 끝난 뒤(관람 위치 vx/vz 를 목적지로 쓴다)
  if (typeof buildNpcs === 'function') await buildNpcs(M);
  buildTrackFixtures();
  // 바깥 표석은 하늘 환경맵을 받아야 한다
  for (const e of M.exhibits) if (e.node && M.roomById[e.room] && M.roomById[e.room].outdoor) markOut(e.node);
  applyEnv(M.scene);
  virtualizeLights();
  precompileAll();
  // ⚠️ 이 함수는 async 다. enter() 에서 미리 부른 assignLights() 는 노드가 없어 빈손으로 끝난다.
  //    텍스처 로드가 끝난 지금 다시 배치해야 첫 화면부터 조명이 들어온다.
  assignLights();
}

/* ══════════════════════════════════════════════════════════
   전시물 액자 — 종류마다 다르게 건다(v79)
   ══════════════════════════════════════════════════════════
   예전엔 모든 전시물이 **같은 월넛 액자 + 금테 + 검은 명찰**이었다. 실제 미술관은
   작품 성격에 따라 거는 방식이 다르고, 그 차이가 '진짜 전시' 로 읽히게 만든다.
     frame   초상 — 얇은 흑단 오크 틀(3.5cm) + 넓은 흰 매트(9cm) + 유리
     float   사진 — 틀 없이 판에 붙여 벽에서 5cm 띄운다(뒤에 그림자 틈)
     box     스코어카드 — 흰 상자 액자(깊이 5cm) + 매트 + 유리
     screen  영상 — 검은 베젤 모니터. 화면은 스스로 빛난다
     poster  관람 안내 — 가는 알루미늄 틀
   명찰은 액자 아래 왼쪽의 **흰 캡션 라벨**(미술관 벽 캡션)로 바꿨다. */
const FRAME_KIND = {
  frame:  { bar: 0.035, depth: 0.042, mat: 0.09, color: 0x2A2420, rough: 0.42, metal: 0.05, glass: true },
  box:    { bar: 0.028, depth: 0.055, mat: 0.07, color: 0xEDEAE4, rough: 0.5, metal: 0.0, glass: true },
  screen: { bar: 0.026, depth: 0.045, mat: 0.0, color: 0x0B0B0D, rough: 0.22, metal: 0.3, glass: true },
  poster: { bar: 0.016, depth: 0.028, mat: 0.0, color: 0x2E2F31, rough: 0.34, metal: 0.7, glass: true },
  float:  { bar: 0.0, depth: 0.022, mat: 0.0, color: 0x1A1A1A, rough: 0.6, metal: 0.0, glass: false },
};
const FRAME_MAT = new Map();
const frameMat = (k) => {
  if (!FRAME_MAT.has(k)) {
    const f = FRAME_KIND[k];
    FRAME_MAT.set(k, new THREE.MeshStandardMaterial({ color: f.color, roughness: f.rough, metalness: f.metal }));
  }
  return FRAME_MAT.get(k);
};
let MATBOARD = null, ART_GLASS = null;

/** 캡션 라벨 — 흰 카드에 번호 · 제목 · 부제 */
function labelTex(e) {
  const W = 640, H = 360, cv = makeCanvas(W, H), c = cv.getContext('2d');
  c.fillStyle = '#E4E0D7'; c.fillRect(0, 0, W, H);
  const P = 34;
  c.textBaseline = 'top'; c.textAlign = 'left';
  c.fillStyle = '#8A8478'; c.font = '500 24px Oswald, sans-serif';
  const kindName = { portrait: 'PORTRAIT', photo: 'PHOTOGRAPH', screen: 'FILM', scorecard: 'SCORECARD', champion: 'CHAMPION' }[e.type] || 'EXHIBIT';
  c.fillText((e.no ? 'No.' + String(e.no).padStart(3, '0') + '   ' : '') + kindName, P, P);
  // 제목 — 두 줄까지
  const wrap = (txt, font, maxW, maxLines) => {
    c.font = font;
    const words = String(txt || '').split(/(\s+)/), lines = [''];
    for (const w of words) {
      const t = lines[lines.length - 1] + w;
      if (c.measureText(t).width > maxW && lines[lines.length - 1]) {
        if (lines.length === maxLines) { lines[lines.length - 1] = lines[lines.length - 1].trim() + '…'; break; }
        lines.push(w.trim());
      } else lines[lines.length - 1] = t;
    }
    // 공백 없는 긴 한글 — 글자 단위로 자른다
    return lines.map((l) => {
      let s = l.trim();
      while (c.measureText(s).width > maxW && s.length > 1) s = s.slice(0, -2) + '…';
      return s;
    });
  };
  let y = P + 50;
  c.fillStyle = '#1E1C19';
  for (const ln of wrap(e.title || e.label, '700 44px "Noto Serif KR", serif', W - P * 2, 2)) { c.fillText(ln, P, y); y += 58; }
  c.fillStyle = '#5E594F';
  for (const ln of wrap(e.subtitle || '', '400 25px "Noto Serif KR", serif', W - P * 2, 2)) { c.fillText(ln, P, y + 6); y += 36; }
  c.fillStyle = '#C9A24A'; c.fillRect(P, H - P - 4, 54, 4);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* 그림 비율 — ⚠️ 예전엔 모든 사진을 172×118cm 가로 판에 **늘여** 붙였다(세로 사진이 납작해졌다).
   · 사진·영상: 판이 그림 비율을 따른다(최대 크기 안에 맞춤)
   · 초상: 액자는 일정하게 두고 그림을 **잘라 채운다**(위쪽 기준 — 얼굴이 잘리지 않게)
   텍스처는 같은 사진을 여러 곳이 공유하므로(캐시) 자를 때는 복제본을 쓴다 — 원본(GPU)은 하나다. */
function imgAspect(tex) {
  const im = tex && tex.image;
  const w = im && (im.naturalWidth || im.width), h = im && (im.naturalHeight || im.height);
  return w && h ? w / h : null;
}
function coverTex(tex, frameAspect) {
  const ar = imgAspect(tex);
  if (!ar || Math.abs(ar - frameAspect) < 0.01) return tex;
  const t = tex.clone();
  t.needsUpdate = true;
  if (ar > frameAspect) { const k = frameAspect / ar; t.repeat.set(k, 1); t.offset.set((1 - k) / 2, 0); }
  else { const k = ar / frameAspect; t.repeat.set(1, k); t.offset.set(0, 1 - k - (1 - k) * 0.12); }
  return t;
}

async function buildArtMesh(e, node) {
  let W = (e.big ? 172 : 104) / CM, H = (e.big ? 118 : 132) / CM;
  let tex = e.poster
    ? await posterTex()
    : e.card ? scorecardTex(e.card, e.no ? pad3(e.no) : '')
    : ((await loadTex(e.img))
      || (e.img ? await loadTex(placeholderImg(e.label || e.title || '전시물', 205)) : null));

  const kind = e.poster ? 'poster' : e.card ? 'box' : e.type === 'screen' ? 'screen' : e.type === 'photo' ? 'float' : 'frame';
  const F = FRAME_KIND[kind];
  const ar = imgAspect(tex);
  if ((kind === 'float' || kind === 'screen') && ar) {
    // 최대 크기 상자(사진 172×140cm) 안에 그림 비율 그대로
    const bw = W, bh = kind === 'float' ? 1.4 : W / (16 / 9);
    if (ar > bw / bh) { W = bw; H = bw / ar; } else { H = bh; W = bh * ar; }
  } else if (kind === 'frame' && tex && !e.poster) {
    tex = coverTex(tex, W / H);
  }
  const IW = W + F.mat * 2, IH = H + F.mat * 2;        // 틀 안쪽(매트 포함)
  const OW = IW + F.bar * 2, OH = IH + F.bar * 2;       // 바깥
  const hits = [];

  if (kind === 'float') {
    // 뒤판 — 벽에서 띄우는 받침(보이지 않을 만큼 작게) + 그림 판
    const back = new THREE.Mesh(new THREE.BoxGeometry(W - 0.12, H - 0.12, 0.05), frameMat('float'));
    back.position.z = -0.005; node.add(back);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(W, H, F.depth),
      new THREE.MeshStandardMaterial({ color: 0xF2F0EA, roughness: 0.7 }));
    edge.position.z = 0.03; edge.castShadow = true; node.add(edge);
    hits.push(edge);
  } else {
    // 틀 — 막대 넷을 한 지오메트리로(재질 하나)
    const bars = [
      boxAt(OW, F.bar, F.depth, 0, (OH - F.bar) / 2, 0), boxAt(OW, F.bar, F.depth, 0, -(OH - F.bar) / 2, 0),
      boxAt(F.bar, IH, F.depth, (OW - F.bar) / 2, 0, 0), boxAt(F.bar, IH, F.depth, -(OW - F.bar) / 2, 0, 0),
      boxAt(IW, IH, 0.012, 0, 0, -F.depth / 2 + 0.006),                // 뒤판
    ];
    const frame = new THREE.Mesh(mergeGeos(bars), frameMat(kind));
    frame.position.z = F.depth / 2;
    frame.castShadow = true;
    node.add(frame);
    hits.push(frame);
    if (F.mat > 0) {
      MATBOARD = MATBOARD || new THREE.MeshStandardMaterial({ color: 0xDFDBD1, roughness: 0.94 });
      const mat = new THREE.Mesh(new THREE.PlaneGeometry(IW, IH), MATBOARD);
      mat.position.z = 0.016;
      node.add(mat);
      hits.push(mat);
      // 매트 안쪽 경사면 — 그림 둘레의 얇은 흰 선(베벨 컷)
      const bevel = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.012, H + 0.012),
        new THREE.MeshStandardMaterial({ color: 0xEDEAE3, roughness: 0.8 }));
      bevel.position.z = 0.0165;
      node.add(bevel);
    }
  }

  // 그림
  const picZ = kind === 'float' ? 0.0415 : 0.017;
  const picMat = new THREE.MeshStandardMaterial({
    map: tex, color: !tex ? 0x2A2622 : e.card ? 0x9C988F : 0xffffff,
    roughness: kind === 'screen' ? 0.25 : e.card ? 0.8 : 0.62,
  });
  if (kind === 'screen' && tex) {
    // 화면은 스스로 빛난다 — 어두운 상영관에서도 영상 썸네일이 읽힌다
    picMat.emissive = new THREE.Color(0xffffff); picMat.emissiveMap = tex; picMat.emissiveIntensity = 0.55;
    picMat.color.setScalar(0.35);
  }
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(W, H), picMat);
  pic.position.z = picZ;
  node.add(pic);
  e.pic = pic;
  hits.push(pic);

  // 유리 — 환경 반사만 은은하게(투명도 6%)
  if (F.glass) {
    ART_GLASS = ART_GLASS || (() => {
      const g = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.06, depthWrite: false });
      g.userData.envK = 1.4;
      return g;
    })();
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(IW, IH), ART_GLASS);
    gl.position.z = F.depth - 0.004;
    node.add(gl);
  }
  if (e.type === 'screen') {
    const play = new THREE.Mesh(new THREE.CircleGeometry(0.075, 32),
      new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.55 }));
    play.position.z = picZ + 0.002;
    node.add(play);
  }

  /* 캡션 라벨 — 액자 아래 왼쪽 끝에 맞춘다(옆에 두면 촘촘히 걸린 방에서 옆 액자와 겹친다) */
  const LW = 0.28, LH = LW * 360 / 640;
  const label = new THREE.Mesh(new THREE.PlaneGeometry(LW, LH),
    new THREE.MeshStandardMaterial({ map: labelTex(e), roughness: 0.85 }));
  label.position.set(-OW / 2 + LW / 2, -OH / 2 - LH / 2 - 0.08, 0.004);
  node.add(label);
  hits.push(label);
  e.plate = null;

  e.spotAnchor = true;
  for (const m of hits) { M.pickables.push(m); M.artByMesh.set(m, e); }
}

/**
 * 우승자 초상 — 일반 액자와 규격이 다르다(260×340cm).
 * v79: 예전의 3중 금박 몰딩 · 네 귀 로제트 · 월계 왕관 크레스트를 걷었다. 장식이 많을수록
 * '게임 속 왕좌' 처럼 보였다. 지금은 **깊은 금박 틀 하나 + 가는 안쪽 필렛 + 넓은 매트** —
 * 크기와 조명만으로 이 방의 주인임을 말한다.
 */
async function buildChampionMesh(e, node) {
  const W = 260 / CM, H = 340 / CM;
  const tex = coverTex((await loadTex(e.img)) || (await loadTex(placeholderImg(e.title || '우승자', 44))), W / H);
  const gilt = new THREE.MeshStandardMaterial({ color: 0xC9A348, roughness: 0.3, metalness: 1.0 });
  const giltD = new THREE.MeshStandardMaterial({ color: 0x7E6424, roughness: 0.42, metalness: 1.0 });
  const MAT = 0.16, BAR = 0.13, D = 0.1;
  const IW = W + MAT * 2, IH = H + MAT * 2, OW = IW + BAR * 2, OH = IH + BAR * 2;
  const frame = new THREE.Mesh(mergeGeos([
    boxAt(OW, BAR, D, 0, (OH - BAR) / 2, D / 2), boxAt(OW, BAR, D, 0, -(OH - BAR) / 2, D / 2),
    boxAt(BAR, IH, D, (OW - BAR) / 2, 0, D / 2), boxAt(BAR, IH, D, -(OW - BAR) / 2, 0, D / 2),
  ]), gilt);
  frame.castShadow = true;
  node.add(frame);
  // 바깥 모서리의 가는 어두운 턱 + 안쪽 필렛 — 틀에 깊이가 생긴다
  const lip = 0.02;
  node.add(new THREE.Mesh(mergeGeos([
    boxAt(OW + lip * 2, lip, D * 0.7, 0, OH / 2 + lip / 2, D * 0.35), boxAt(OW + lip * 2, lip, D * 0.7, 0, -OH / 2 - lip / 2, D * 0.35),
    boxAt(lip, OH, D * 0.7, OW / 2 + lip / 2, 0, D * 0.35), boxAt(lip, OH, D * 0.7, -OW / 2 - lip / 2, 0, D * 0.35),
    boxAt(IW, 0.018, 0.03, 0, IH / 2 - 0.009, 0.03), boxAt(IW, 0.018, 0.03, 0, -IH / 2 + 0.009, 0.03),
    boxAt(0.018, IH, 0.03, IW / 2 - 0.009, 0, 0.03), boxAt(0.018, IH, 0.03, -IW / 2 + 0.009, 0, 0.03),
  ]), giltD));
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(IW, IH), new THREE.MeshStandardMaterial({ color: 0xF1EDE4, roughness: 0.92 }));
  mat.position.z = 0.02;
  node.add(mat);
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.58 }));
  pic.position.z = 0.022;
  node.add(pic);
  e.pic = pic;
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(IW, IH),
    new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.03, transparent: true, opacity: 0.05, depthWrite: false }));
  glass.material.userData.envK = 1.4;
  glass.position.z = D - 0.01;
  node.add(glass);

  // 대형 명판 — 이름과 우승일(놋쇠)
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.34),
    new THREE.MeshStandardMaterial({ map: noticeTex(e.title || '우승자', e.subtitle || ''), roughness: 0.38, metalness: 0.6 }));
  plate.position.set(0, -OH / 2 - 0.32, 0.03);
  node.add(plate);
  e.plate = null;

  /* 전용 조명 2발 — 풀에 맡기면 다른 전시물에 빼앗긴다.
     세기는 크기와 함께 올리면 안 된다(하얗게 날아간다) — 한 발보다 오히려 낮게. */
  for (const s of [-1, 1]) {
    const sp = new THREE.SpotLight(0xFFEBC8, 18, 11, 0.36, 0.58, 1.0);
    sp.position.set(s * 1.5, H / 2 + 1.5, 2.3);
    const tgt = new THREE.Object3D();
    tgt.position.set(s * 0.5, 0.2, 0);
    node.add(sp, tgt);
    sp.target = tgt;
  }
  e.spotAnchor = false;
  M.pickables.push(pic, mat, frame);
  M.artByMesh.set(pic, e); M.artByMesh.set(mat, e); M.artByMesh.set(frame, e);
}

async function buildObjMesh(e, node) {
  // 평면(빌보드)이 아니라 **실제 3D 지오메트리**를 만든다.
  // 평면은 정면에서만 그럴듯하고 옆에서 보면 종이처럼 사라져,
  // 구조가 3D 인데 소품 하나 때문에 전체 퀄리티가 무너진다.
  const g = buildObject3D(e.sprite, {
    lines: e.type === 'placard'
      ? ['관람 안내', '전시물은 큐레이터가 고르지 않습니다']
      : (e.plateLines || [e.label]),
    count: e.count,
  });
  if (!g) return;
  batchStatic(g);                                  // 부품을 재질별로 합친다(사물 하나 = 재질 수만큼 그리기)
  node.add(g);
  e.pic = g;
  // 접촉 그늘 — 바닥에 닿아 있게(벽걸이는 제외)
  if (!g.userData.wall) {
    const FOOT = { bench: [1.6, 0.44], stanchion: [1.66, 0.34], book: [0.44, 0.36], medals: [0.72, 0.34], stone: [1.0, 0.56] };
    const sz = OBJ_SIZE[e.sprite] || [0.5, 1];
    const [fw, fd] = FOOT[e.sprite] || [sz[0], sz[0]];
    node.add(contactShadow(fw, fd, e.type === 'marker' ? 0.4 : 0.55));
  }

  // 클릭 판정용 투명 히트박스 — 잔가지 메시를 하나하나 레이캐스트하지 않는다
  const sz = (OBJ_SIZE[e.sprite] || [0.5, 1.0]);
  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(sz[0] * 0.8, sz[1], Math.max(0.3, sz[0] * 0.5)),
    new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = g.userData.wall ? 0 : sz[1] / 2;
  node.add(hit);

  /* 전리품(우승자의 방)은 **전용 조명**을 붙인다.
     풀(8발)은 거리순이라 다른 방 전시물에 빼앗기고, 실제로 명도가 38~68 까지
     떨어져 좌대 위 놋쇠가 안 보였다. 세 점뿐이므로 고정 조명이 싸다. */
  if (e.type === 'marker') {
    e.spotAnchor = false;
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  } else if (e.type === 'relic') {
    // 세기 40 → 22 — 예전 어두운 대리석 좌대에 맞춘 값이라 흰 플린스에서는 윗면이 하얗게 날아갔다
    const sp = new THREE.SpotLight(0xFFE6BE, 22, 7.5, 0.46, 0.55, 1.1);
    sp.position.set(0, sz[1] + 2.1, 1.15);
    const tgt = new THREE.Object3D();
    tgt.position.set(0, sz[1] * 0.62, 0);
    node.add(sp, tgt);
    sp.target = tgt;
    e.spotAnchor = false;
  } else {
    e.spotAnchor = true;
  }
  M.pickables.push(hit);
  M.artByMesh.set(hit, e);
}



/**
 * 포인터 락 요청 — 실패해도 조용히 드래그 조작으로 남는다.
 * ⚠️ 최신 크롬은 **Promise 를 반환**한다. try/catch 로는 거부를 못 잡아
 *    "The root document of this element is not valid for pointer lock" 같은
 *    메시지가 사용자에게 새어나간다. 반드시 .catch 를 붙인다.
 */
function tryLock(el) {
  if (!el || !el.requestPointerLock) return;
  try {
    const p = el.requestPointerLock();
    if (p && typeof p.catch === 'function') p.catch(() => { /* 드래그로 진행 */ });
  } catch (_) { /* 드래그로 진행 */ }
}

/* ══════════════════════════════════════════════════════════
   입력
   ══════════════════════════════════════════════════════════ */
const FPS_SENS = 0.0022;      // 포인터 락 감도(rad/px)
const DRAG_SENS = 0.0030;

/* 시선 상하 한계(rad) — **아래를 위보다 넓게** 둔다.
   기존 ±0.42(±24°)는 발밑이 안 보여 답답했다. 바닥에 놓인 3D 소품
   (화분·차단봉·벤치·방명록)을 내려다봐야 하는데 위쪽은 천장뿐이다.
   PITCH_DN 0.95rad = 54° 아래 — 수직 FOV 64° 의 절반을 더하면 거의 발밑까지 든다. */
const PITCH_DN = -0.95;
const PITCH_UP = 0.55;

function bindInput() {
  const gal = $('gal'), stick = $('stick'), knob = $('knob');
  if (typeof uiSetup === 'function') uiSetup();               // v121 — 도구 레일(ui.js)

  const enableTouch = () => {
    if (M.touch) return;
    M.touch = true;
    if (typeof uiDock === 'function') uiDock();
    document.body.classList.add('is-touch');
    $('prKey').textContent = 'TAP';
    paintPrompt();
    if (typeof mobileSetup === 'function') mobileSetup();       // v119 — 폰 화면 정리(mobile.js)
  };
  if (matchMedia('(pointer: coarse)').matches) enableTouch();

  addEventListener('keydown', (ev) => {
    const k = ev.key.toLowerCase();
    /* 팝업이 열려 있으면 step() 이 멈추므로 방향키가 남는다 → 사진 넘기기에 쓴다.
       이동키로 **기록하지 않는다** — 누른 채로 팝업을 닫으면 그대로 걸어가버린다. */
    if (M.gal && (k === 'arrowleft' || k === 'arrowright')) {
      ev.preventDefault();
      M.keys[k] = false;
      galStep(k === 'arrowleft' ? -1 : 1);
      return;
    }
    M.keys[k] = true;
    /* 관람 중에도 전시 설정을 열 수 있다(F2). 커서가 없으면 만질 수 없으니 락을 푼다.
       관리자가 아니면 **조용히 무시하지 않고 이유를 띄운다** — 예전에 버튼이 그냥
       사라져 왜 안 되는지 알 수 없었던 문제를 되풀이하지 않기 위해서다. */
    if (k === 'f2') {
      ev.preventDefault();
      if (M.canManage) {
        if (M.locked) document.exitPointerLock();
        if (!$('adminPanel')) openAdmin();
      } else {
        toast('전시 설정은 관리자만 열 수 있습니다.' + (M.adminWhy ? '\n' + M.adminWhy : ''));
      }
      return;
    }
    if (k === 'j' && !ev.repeat && !M.openId && typeof ESC !== 'undefined' && ESC.on && ESC.ready) { ev.preventDefault(); escapeJournal(); return; }   // v114 — 쪽지
    if (k === 'p' && !ev.repeat && !M.openId && !$('adminPanel') && typeof takePhoto === 'function') { ev.preventDefault(); takePhoto(); return; }   // v111 — 기념 사진
    if (k === 'f' && !ev.repeat && !M.openId && !$('adminPanel')) { ev.preventDefault(); if (typeof torchToggle === 'function') torchToggle(); return; }   // v105 — 손전등
    if (k === 'm') { ev.preventDefault(); if (M.bgm) bgmToggle(); if (typeof sndToggle === 'function') sndToggle(); return; }   // 음악 · 소리 토글
    // 골프 — Space 를 누르고 있으면 힘을 모으고 놓으면 친다. Esc 는 그만두기
    if (k === ' ' && !M.openId && !$('adminPanel')) {
      ev.preventDefault();
      if (!ev.repeat && (GOLF.mode || golfCourseAt(M.pos.x * CM, M.pos.z * CM))) golfKey(true);
      else if (!ev.repeat && !(typeof CART !== 'undefined' && CART.driving)) jump();   // 그 밖에선 점프(카트에선 브레이크)
      return;
    }
    if (k === 'escape' && GOLF.mode) { golfQuit(); return; }
    if (k === 'escape' && typeof CART !== 'undefined' && CART.driving) { cartExit(); return; }
    if ($('adminPanel')) return;            // 패널이 열려 있으면 이동·조사 키를 먹지 않는다
    if (k === 'e' || k === 'enter') { ev.preventDefault(); interact(); }
    if (k === 'escape') closeOverlay();
  });
  addEventListener('keyup', (ev) => {
    M.keys[ev.key.toLowerCase()] = false;
    if (ev.key === ' ' && GOLF.mode) golfKey(false);
  });

  gal.addEventListener('pointerdown', (ev) => {
    if (ev.pointerType === 'touch') enableTouch();
    if (M.openId) return;
    if (ev.target.closest('.act-btn, .overlay, .hud, .minimap, .lock-chip')) return;

    // 마우스 고정(FPS) 중에는 커서가 없다 → 좌클릭이 곧 조사
    if (M.locked) { ev.preventDefault(); interact(); return; }
    // 조준점이 겨눈 것을 클릭했으면 바로 조사
    if (M.focus && ev.pointerType === 'mouse') {
      const hit = pickAt(ev.clientX, ev.clientY);
      if (hit === M.focus) { interact(); return; }
    }
    try { gal.setPointerCapture(ev.pointerId); } catch (_) { /* 미지원 무시 */ }

    const leftHalf = ev.clientX < innerWidth * 0.5;
    if (M.touch && leftHalf) {
      M.move = { id: ev.pointerId, ox: ev.clientX, oy: ev.clientY, x: ev.clientX, y: ev.clientY };
      stick.style.left = ev.clientX + 'px';
      stick.style.top = ev.clientY + 'px';
      knob.style.transform = 'translate(-50%,-50%)';
      stick.classList.add('on');
    } else {
      // pointerType 을 기억한다 — 마우스와 터치의 시선 부호가 다르다(onMove 참고)
      M.look = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, touch: ev.pointerType === 'touch' };
    }
  });

  const onMove = (ev) => {
    if (M.move && ev.pointerId === M.move.id) {
      M.move.x = ev.clientX; M.move.y = ev.clientY;
      let dx = ev.clientX - M.move.ox, dy = ev.clientY - M.move.oy;
      const l = Math.hypot(dx, dy), max = 48;
      stick.classList.toggle('run', l > 72);                    // v119 — 달리기 표시(끝까지 밀면)
      if (l > max) { dx = dx / l * max; dy = dy / l * max; }
      knob.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
    }
    if (M.look && ev.pointerId === M.look.id) {
      /* 시선 부호는 **입력 장치마다 다르다.**
           터치(s=-1) 시선이 손가락을 따라간다. 오른쪽으로 끌면 오른쪽을 본다.
                      모바일은 조작이 드래그뿐이라 아래 관례로는 반전처럼 느껴진다.
           마우스(s=+1) '세상을 붙잡고 끄는' 관례. 오른쪽으로 끌면 시야는 왼쪽.
                      PC 에서 익숙한 방식이라 그대로 둔다.
         (마우스 고정 FPS 모드는 별도로 아래 mousemove 에서 처리한다) */
      const s = M.look.touch ? -1 : 1;
      M.yaw += s * (ev.clientX - M.look.x) * DRAG_SENS;
      M.pitch = clamp(M.pitch + s * (ev.clientY - M.look.y) * DRAG_SENS * 0.7, PITCH_DN, PITCH_UP);
      M.look.x = ev.clientX; M.look.y = ev.clientY;
    }
  };
  const end = (ev) => {
    if (M.move && (!ev || ev.pointerId === M.move.id)) { M.move = null; stick.classList.remove('on', 'run'); }
    if (M.look && (!ev || ev.pointerId === M.look.id)) M.look = null;
  };
  gal.addEventListener('pointermove', onMove);
  addEventListener('pointermove', onMove);
  gal.addEventListener('pointerup', end);
  gal.addEventListener('pointercancel', end);
  addEventListener('pointerup', end);
  addEventListener('pointercancel', end);
  addEventListener('blur', () => end(null));

  // 포인터 락 — 진짜 FPS
  const chip = $('lockChip');
  chip.addEventListener('click', () => {
    if (M.locked) document.exitPointerLock();
    else tryLock(gal);
  });
  document.addEventListener('pointerlockchange', () => {
    const was = M.locked;
    M.locked = document.pointerLockElement === gal;
    // v120 — 골프 중 Esc: 브라우저가 키를 고정 해제에 써 버려 keydown 이 안 온다 → 고정이 풀린 것으로 그만두기
    if (was && !M.locked && typeof GOLF !== 'undefined' && GOLF.mode && typeof golfQuit === 'function') golfQuit();
    chip.classList.toggle('on', M.locked);
    chip.innerHTML = '<i class="ci"></i><span class="ct">' + (M.locked ? '마우스 고정 해제 (Esc)' : '마우스 고정 · FPS 조작') + '</span>';
    $('gal').classList.toggle('locked', M.locked);
    $('ctrlHint').innerHTML = M.locked
      ? '이동 <b>W</b><b>A</b><b>S</b><b>D</b> · 달리기 <b>Shift</b> · 둘러보기 <b>마우스</b> · 조사 <b>좌클릭</b> · 해제 <b>Esc</b>'
      : '이동 <b>W</b><b>A</b><b>S</b><b>D</b> · 달리기 <b>Shift</b> · 둘러보기 <b>드래그</b> · 조사 <b>E</b> · 클릭';
  });
  addEventListener('mousemove', (ev) => {
    if (!M.locked) return;
    // FPS = 시선이 마우스를 따라가는 관례 → 부호가 드래그와 반대
    M.yaw -= ev.movementX * FPS_SENS;
    // 상하 감도 0.8 → 0.9: 범위가 2배 넓어졌으니 끝까지 닿는 데 드는 마우스 이동도 줄인다
    M.pitch = clamp(M.pitch - ev.movementY * FPS_SENS * 0.9, PITCH_DN, PITCH_UP);
  });

  if ($('bgmChip')) {
    $('bgmChip').addEventListener('click', (ev) => {
      ev.preventDefault(); ev.stopPropagation();
      bgmToggle();
    });
  }
  if ($('adminChip')) {
    $('adminChip').addEventListener('click', (ev) => {
      ev.preventDefault(); ev.stopPropagation();
      if (M.locked) document.exitPointerLock();
      if (!$('adminPanel')) openAdmin();
    });
  }
  $('actBtn').addEventListener('click', (ev) => { ev.preventDefault(); if (!GOLF.mode) interact(); });
  // 폰 — 골프 중에는 조사 버튼이 스윙 버튼이다(누르고 있다가 놓는다)
  $('actBtn').addEventListener('pointerdown', (ev) => { if (GOLF.mode) { ev.preventDefault(); ev.stopPropagation(); golfKey(true); } });
  $('actBtn').addEventListener('pointerup', (ev) => { if (GOLF.mode) { ev.preventDefault(); golfKey(false); } });
  $('ovClose').onclick = closeOverlay;
  $('overlay').addEventListener('pointerdown', (ev) => { if (ev.target.id === 'overlay') closeOverlay(); });
}

function readMove() {
  const k = M.keys;
  let f = 0, s = 0, run = !!k.shift;                // Shift — 달리기(v90)
  if (k.w || k.arrowup) f += 1;
  if (k.s || k.arrowdown) f -= 1;
  if (k.a) s -= 1;
  if (k.d) s += 1;
  if (k.arrowleft) M.yaw += 0.028;
  if (k.arrowright) M.yaw -= 0.028;
  if (M.move) {
    const dx = M.move.x - M.move.ox, dy = M.move.y - M.move.oy;
    const l = Math.hypot(dx, dy);
    if (l > 12) { f += -dy / Math.max(l, 48); s += dx / Math.max(l, 48); }
    if (l > 72) run = true;                          // 폰 — 조이스틱을 끝까지 밀면 달린다(v119: 88 → 72, 손잡이가 금빛으로)
  }
  return { f: clamp(f, -1, 1), s: clamp(s, -1, 1), run };
}

/* ══════════════════════════════════════════════════════════
   루프
   ══════════════════════════════════════════════════════════ */
let last = 0;
const GUARD = {};
function guardStep(name, fn) {
  if (GUARD[name] > 3) return;                     // 네 번 연달아 깨지면 그 부분은 쉰다
  try { fn(); GUARD[name] = 0; } catch (e) {
    GUARD[name] = (GUARD[name] || 0) + 1;
    if (GUARD[name] === 1) setTimeout(() => { throw e; });   // 에러 상자(index.html)가 스택과 함께 받는다
  }
}
function loop(now) {
  M.raf = requestAnimationFrame(loop);
  const raw = (now - last) / 1000;
  const dt = Math.min(0.05, raw) || 0;
  last = now;
  adaptRes(raw);
  if (M.attract) stepAttract(dt);
  else if (GOLF.mode) golfStep(dt);                 // 골프 체험 중 — 걷지 않고 공과 카메라만
  else if (typeof CART !== 'undefined' && CART.driving && !M.openId) cartStep(dt);   // 카트 운전(cart.js)
  else if (!M.openId) step(dt);
  M.t += dt;
  // v94 — 관람객 · 바깥(깃발 · 물 · 골프 표시)은 따로 감싼다: 한쪽이 깨져도 걷기 · 그리기는 계속되고,
  //       오류는 한 번만(스택째) 에러 상자로 보낸다(매 프레임 같은 오류가 화면을 덮지 않게)
  guardStep('npc', () => { if (typeof stepNpcs === 'function') stepNpcs(M, dt); });
  guardStep('world', () => stepWorld(M.t));
  guardStep('sound', () => { if (typeof stepSound === 'function') stepSound(dt); });
  guardStep('night', () => { if (typeof stepNight === 'function') stepNight(dt); });
  animateFocus(dt);
  guardStep('flicker', () => { if (typeof stepFlicker === 'function') stepFlicker(dt); });   // v100 — 실내 조명 깜빡임 · 정전
  guardStep('haunt', () => { if (typeof stepHaunt === 'function') stepHaunt(dt); });        // v101 — 이상 현상
  guardStep('torch', () => { if (typeof stepTorch === 'function') stepTorch(dt); });        // v105 — 손전등
  guardStep('score', () => { if (typeof stepScore === 'function') stepScore(dt); });        // v106 — 밤의 음악 · 심장 · 밤 시계
  guardStep('memento', () => { if (typeof stepMemento === 'function') stepMemento(dt); });  // v111 — 기념 사진 칩
  guardStep('escape', () => { if (typeof stepEscape === 'function') stepEscape(dt); });    // v114 — 방탈출
  guardStep('dlg', () => { if (typeof stepDlg === 'function') stepDlg(dt); });            // v115 — 대화창
  guardStep('acts', () => { if (typeof stepActs === 'function') stepActs(dt); });         // v118 — 몸짓의 플래시 · 쿨다운
  guardStep('horror', () => { if (typeof stepHorror === 'function') stepHorror(dt); });
  guardStep('expand', () => { if (typeof stepExpand === 'function') stepExpand(dt); });
  guardStep('scare', () => { if (typeof stepScare === 'function') stepScare(dt); });
  guardStep('office', () => { if (typeof stepOffice === 'function') stepOffice(dt); });
  guardStep('lost', () => { if (typeof stepLost === 'function') stepLost(dt); });   // v129 — 분실물 보관소
    // v126 — 관리자의 방     // v123 — 달려드는 것 · 천장의 것   // v122 — 숲 · 클럽하우스 · 레인지   // v121 — 호수의 손 · 반사 · 발자국 · 머리 · 유리창 손자국
  M.post.render(M.t);
  if (M.diag) paintDiag();
}

/* 해상도 자동 조절 — 2초 평균 프레임 시간으로 픽셀 비율을 0.25 씩 옮긴다.
   ⚠️ 폰 DPR 3 화면에서 후처리까지 전 해상도로 돌리면 프레임이 반토막 난다. 반대로 고정해
      낮추면 좋은 기기에서 흐리다 → 기기가 버티는 만큼만 쓴다.
   · 느리면(평균 26ms 초과 ≈ 38fps 미만) 내린다. 그리고 **그 값 위로는 다시 안 올린다**
     (dprCap) — 올렸다 내렸다를 반복하면 화면이 계속 출렁인다.
   · 빠른 상태(18ms 미만)가 세 번(6초) 이어져야 올린다.
   · 숨긴 탭·멈춘 프레임(0.25초 초과)은 재지 않는다. */
function adaptRes(raw) {
  if (!(raw > 0) || raw > 0.25 || !M.renderer) return;
  M.frT = (M.frT || 0) + raw;
  M.frN = (M.frN || 0) + 1;
  if (M.frT < 2) return;
  const avg = M.frT / M.frN;
  M.frT = 0; M.frN = 0;
  let next = M.dpr;
  if (avg > 0.026) {
    next = Math.max(M.dprMin, M.dpr - 0.25);
    M.dprCap = Math.max(M.dprMin, Math.min(M.dprCap, next));
    M.fastRuns = 0;
  } else if (avg < 0.018) {
    M.fastRuns = (M.fastRuns || 0) + 1;
    if (M.fastRuns >= 3) { next = Math.min(M.dprCap, M.dpr + 0.25); M.fastRuns = 0; }
  } else {
    M.fastRuns = 0;
  }
  if (next !== M.dpr) {
    M.dpr = next;
    M.renderer.setPixelRatio(next);
    onResize();
  }
}

/* ?diag — 화면 위에 조명·재질 상태를 적는다.
   폰에서 '조명 쓰는 재질만 안 보인다' 같은 고장을 원격으로 판정할 방법이 없었다.
   0.4초에 한 번만 갱신한다(매 프레임 DOM 을 만지면 그 자체가 느려진다). */
let diagT = 0;
function paintDiag() {
  diagT -= 1 / 60;
  if (diagT > 0) return;
  diagT = 0.4;
  let el = $('diagBox');
  if (!el) {
    el = document.createElement('div');
    el.id = 'diagBox';
    el.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:9990;background:rgba(6,10,8,.88);'
      + 'color:#CFE8D4;font:11px/1.5 ui-monospace,monospace;padding:7px 9px;white-space:pre-wrap;'
      + 'border-bottom:1px solid #3A5A46';
    document.body.appendChild(el);
  }
  let pt = 0, sp = 0, sh = 0, litMesh = 0, basicMesh = 0;
  (function walk(o) {
    if (o.visible === false) return;
    if (o.isLight) {
      if (o.isPointLight) pt++; else if (o.isSpotLight) sp++;
      if (o.castShadow) sh++;
    }
    if (o.isMesh && o.material) {
      if (o.material.isMeshStandardMaterial) litMesh++;
      else if (o.material.isMeshBasicMaterial) basicMesh++;
    }
    for (const c of o.children) walk(c);
  })(M.scene);
  const cur = roomAt(M.pos.x * CM, M.pos.z * CM);
  const gl = M.renderer.getContext();
  const u = M.post.uniforms;
  el.textContent = [
    `빌드 ${BUILD} · ${cur ? cur.name : '방 밖'} · ${M.rooms.length}방 ${M.doors.length}문`
      + ` · 해상도 ×${M.dpr} · 셰이더 ${M.renderer.info.programs.length}`,
    `광원 점광 ${pt} 스포트 ${sp} 그림자 ${sh}  ≈${pt * 4 + sp * 6}vec`,
    `hemi ${M.hemi ? M.hemi.intensity.toFixed(2) : '-'} amb ${M.amb ? M.amb.intensity.toFixed(2) : '-'}`
      + ` hand ${M.handLight ? M.handLight.intensity.toFixed(2) : '-'}`
      + ` lift ${u && u.uLift ? u.uLift.value.toFixed(2) : '-'} fog ${M.scene.fog ? M.scene.fog.density.toFixed(3) : '-'}`,
    `보이는 메시 조명재질 ${litMesh} 무조명 ${basicMesh}`,
    `fragUni ${gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS)} tex ${gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)}`
      + ` WebGL${M.renderer.capabilities.isWebGL2 ? '2' : '1'} err ${gl.getError()}`,
  ].join(String.fromCharCode(10));
}

function step(dt) {
  const inp = readMove();
  // m/s — 걷기 3.1 · 달리기 6.2(v90). 물속은 느리다(깊으면 달려도 헤치는 속도)
  const run = inp.run && (inp.f > 0.2 || Math.abs(inp.s) > 0.2);
  const SPD = (run ? 6.2 : 3.1) * (typeof lakeSlow === 'function' ? lakeSlow() : 1);
  const fx = -Math.sin(M.yaw), fz = -Math.cos(M.yaw);
  const rx = Math.cos(M.yaw), rz = -Math.sin(M.yaw);
  const tx = (fx * inp.f + rx * inp.s) * SPD;
  const tz = (fz * inp.f + rz * inp.s) * SPD;
  M.vel.x = lerp(M.vel.x, tx, Math.min(1, dt * 10));
  M.vel.z = lerp(M.vel.z, tz, Math.min(1, dt * 10));

  slide('x', M.vel.x * dt);
  slide('z', M.vel.z * dt);

  // 걸음에 따른 미세한 상하 흔들림 — 몰입의 절반은 여기서 온다
  const speed = Math.hypot(M.vel.x, M.vel.z);
  // 달리면 걸음이 넓어져 흔들림 주기는 덜 빨라지고, 폭은 커진다
  /* v101 — 걸음 박자를 속도와 떼어 놓는다. 예전엔 흔들림(=발소리)이 속도에 비례해 걷기(3.1m/s)에서 초당 6걸음 —
     한 걸음에 발소리가 두세 번 나는 것처럼 경박했다. 사람은 걸을 때 초당 1.8걸음 안팎, 뛰어도 2.6걸음쯤 */
  const cadence = (speed > 4 ? 2.6 : 1.85) * clamp(speed / 1.6, 0.45, 1);      // 초당 걸음
  M.bob = (M.bob || 0) + dt * Math.PI * cadence;
  const bobY = (M.jumpY ? 0 : 1) * Math.sin(M.bob) * Math.min(speed > 4 ? 0.045 : 0.022, speed * 0.008);
  // 발소리 — 흔들림 반 주기마다 한 걸음(물을 헤칠 땐 lake.js 가 물소리를 낸다)
  const stepN = Math.floor(M.bob / Math.PI);
  if (stepN !== M.stepN) {
    M.stepN = stepN;
    if (speed > 0.6 && !M.jumpY && typeof sndStep === 'function' && !(typeof lakeDepthHere === 'function' && lakeDepthHere() > 3)) sndStep(M.room, speed > 4 ? 1 : 0.7);
    if (speed > 0.6 && !M.jumpY && typeof hauntStep === 'function') hauntStep(speed > 4 ? 1 : 0.7);     // v101 — 따라오는 발소리
  }
  // 달릴 때 화각이 살짝 넓어진다(속도감)
  if (M.baseFov == null) M.baseFov = M.cam.fov;
  const fovT = M.baseFov + clamp((speed - 3.6) / 2.4, 0, 1) * 7;
  if (Math.abs(M.cam.fov - fovT) > 0.02) { M.cam.fov = lerp(M.cam.fov, fovT, Math.min(1, dt * 5)); M.cam.updateProjectionMatrix(); }

  // 눈높이 — 계단을 오를 때 발 높이를 조금 늦게 따라가 계단 턱이 덜컹이지 않게
  M.eyeFeet = M.eyeFeet == null ? M.feet : lerp(M.eyeFeet, M.feet, Math.min(1, dt * 14));
  // 점프(v89) — 몸은 발 높이(M.feet) 그대로 두고 눈만 띄운다: 충돌·계단 규칙이 흔들리지 않는다
  if (M.jumpV || M.jumpY) {
    M.jumpV -= 9.8 * dt;
    M.jumpY = Math.max(0, (M.jumpY || 0) + M.jumpV * dt);
    if (M.jumpY === 0 && M.jumpV < 0) {
      M.landDip = Math.min(0.1, -M.jumpV * 0.028); M.jumpV = 0;
      if (typeof golfSfx === 'function') golfSfx('land', 0.5);
      if (typeof sndStep === 'function') sndStep(M.room, 1.1);
      if (typeof lakeLanded === 'function') lakeLanded();
    }
  }
  M.landDip = (M.landDip || 0) * Math.pow(0.002, dt);
  M.pos.y = (M.eyeFeet + EYE) / CM + (M.jumpY || 0) - M.landDip;
  M.cam.position.set(M.pos.x, M.pos.y + bobY, M.pos.z);
  M.cam.rotation.set(M.pitch, M.yaw, 0, 'YXZ');

  const room = M.room;
  if (room) {
    M.visited.add(room.part || room.id);
    const key = room.part || room.id;
    if (key !== M.bgmRoom) { M.bgmRoom = key; bgmSwitch(key); }
  }
  cullRooms(room);
  paintHud(room);
  updateFocus();
  golfCue();
  if (typeof cartCue === 'function') cartCue();
  jumpBtn();
}

/** 점프 — 물이 깊으면 낮게, 허리 넘게 잠기면 못 뛴다 */
function jump() {
  if (M.jumpY > 0 || M.jumpV > 0 || M.openId) return;
  let v = 3.5;                                      // 약 0.6m
  if (typeof lakeDepthHere === 'function') { const d = lakeDepthHere(); if (d > 110) return; if (d > 35) v = 2.2; }
  M.jumpV = v;
}
/** 폰 — 점프 버튼(조사 버튼 왼쪽) */
function jumpBtn() {
  if (!M.touch || $('jumpBtn')) return;
  const b = document.createElement('button'); b.id = 'jumpBtn'; b.className = 'jump-btn'; b.setAttribute('aria-label', '점프'); b.textContent = '⤒';
  b.addEventListener('pointerdown', (ev) => { ev.preventDefault(); ev.stopPropagation(); jump(); });
  $('gal').appendChild(b);
}

/* 한 축씩 움직여 본다 — 갈 자리에 '지금 발 높이에서 한 걸음 안쪽' 바닥이 있고,
   몸이 벽에 닿지 않아야 간다. 계단은 이 규칙만으로 오르내려진다(층마다 따로 처리하지 않는다).
   바닥이 없는 곳(난간 밖 · 연못 · 건물 밖)은 곧 벽이다. */
function slide(axis, d) {
  if (!d) return;
  const x = (M.pos.x + (axis === 'x' ? d : 0)) * CM, z = (M.pos.z + (axis === 'z' ? d : 0)) * CM;
  const r = pickRoom(x, z, M.feet);
  if (!r) return;
  const f = floorAt(r, x, z);
  if (hitsWall(x, z, f)) return;
  M.pos[axis] += d;
  M.room = r;
  M.feet = f;
}



/* 방 찾기 — 여러 층이 겹친 자리는 발 높이로 가른다(기본 = 지금 내 발 높이) */
const roomAt = (x, z, feet) => pickRoom(x, z, feet == null ? (M.feet || 0) : feet, 1e9);

/** 방 단위 가시성 — WebGL 은 깊이 버퍼가 있어 벽이 새지 않는다.
 *  따라서 컬링은 순수 성능 목적이고, 인접 방까지 넉넉히 켜 둔다. */
let lastCull = '';
/* 동시 광원 상한 감시 — 넘으면 기기에 따라 '아무것도 안 보임' 으로 나타난다.
   (가상 조명 이후로는 이 값이 방과 무관하게 일정하다 — virtualizeLights 참고)
   모바일 GLES 의 fragment uniform 한계는 보통 256 vector 이고, 점광 하나가 약 4,
   스포트 하나가 약 6 을 먹는다. 여유를 두고 32 를 경고선으로 잡는다. */
const LIGHT_WARN = 32;
function countVisibleLights() {
  let n = 0;
  (function walk(o) {
    if (o.visible === false) return;
    if (o.isLight && !o.isAmbientLight && !o.isHemisphereLight) n++;
    for (const c of o.children) walk(c);
  })(M.scene);
  return n;
}

function cullRooms(cur) {
  const key = cur ? cur.id : '-';
  if (key === lastCull) return;
  lastCull = key;
  const on = visibleSet(cur);
  for (const r of M.rooms) {
    const g = M.roomGroups[r.id];
    if (g) g.visible = on.has(r.id);
  }
  assignRoomLights();
  const nl = countVisibleLights();
  if (nl > LIGHT_WARN) {
    console.warn(`[museum] 동시 광원 ${nl}발 — 모바일에서 셰이더 링크가 실패할 수 있습니다 (${key}).`);
  }
}

/* ══════════════════════════════════════════════════════════
   조사 대상 — 레이캐스트
   ══════════════════════════════════════════════════════════ */
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();

/* 벽 뒤는 조사할 수 없다 — 3cm 여유.
   ⚠️ 왜 필요했나: 처음에는 액자 메시만 레이캐스트했다. 레이캐스트는 깊이 버퍼와
      무관하므로 조준선이 벽을 그냥 통과했고, 벽에 붙어 서면 **옆방 액자가 선택**됐다
      (벽을 관통해 조사되는 느낌). 화면에는 벽만 보이는데 조사 안내가 떠서 더 이상했다.
      → 막는 것(벽·상인방·닫힌 문)도 레이캐스트에 넣고 **더 가까운 쪽만** 인정한다.
   여유 3cm 는 벽에 딱 붙은 액자가 자기가 걸린 벽에 가려지지 않게 하는 값이다.
   열린 통로에는 벽 메시가 없으므로 문으로 옆방을 조사하는 것은 그대로 된다. */
const PICK_EPS = 0.03;

function occluded(dist) {
  const hits = ray.intersectObjects(M.occluders, false);
  return hits.length > 0 && hits[0].distance < dist - PICK_EPS;
}

function pickAt(clientX, clientY) {
  ndc.set((clientX / innerWidth) * 2 - 1, -(clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, M.cam);
  const hits = ray.intersectObjects(M.pickables, false);
  for (const h of hits) {
    const e = M.artByMesh.get(h.object);
    if (e) return occluded(h.distance) ? null : e;
  }
  return null;
}

function withinReach(e) {
  const dx = e.x / CM - M.pos.x, dz = e.z / CM - M.pos.z;
  // 층이 다르면 조사할 수 없다(2층 회랑에서 1층 액자를 겨눈 경우)
  const r = M.roomById[e.room];
  const ey = (r ? r.y0 : 0) + (e.y || 0);
  if (Math.abs(ey - (M.feet + 110)) > 300) return false;
  return Math.hypot(dx, dz) * CM < REACH;
}

function updateFocus() {
  // 조준점(화면 중앙) 기준 — 드래그 모드에서도 중앙을 쓰면 조작이 흔들리지 않는다
  const hit = pickAt(innerWidth / 2, innerHeight / 2);
  const next = (hit && withinReach(hit)) ? hit : null;
  if (next === M.focus) return;
  M.focus = next;
  paintPrompt();
}

/** Hover 연출 — 조명이 밝아지고 액자가 벽에서 살짝 떠오른다 */
function animateFocus(dt) {
  M.handLight.position.set(M.pos.x, M.pos.y - 0.15, M.pos.z);

  // 0.2초마다 풀 재배치(매 프레임 정렬은 낭비)
  M.assignT = (M.assignT || 0) - dt;
  if (M.assignT <= 0) { M.assignT = 0.2; assignLights(); }

  for (const slot of M.pool) {
    const e = slot.e;
    // 배정이 풀린 슬롯 — 즉시 끄면 '툭' 꺼진다. 서서히 어두워지게 한다
    if (!e) {
      if (slot.sp.intensity > 0.01) slot.sp.intensity = lerp(slot.sp.intensity, 0, Math.min(1, dt * 5));
      else slot.sp.intensity = 0;
      continue;
    }
    const on = M.focus === e ? 1 : 0;
    e.k = lerp(e.k || 0, on, Math.min(1, dt * 7));
    // 새로 배정된 슬롯은 0 → 1 로 밝아진다(0.2초마다 툭 켜지던 것을 없앤다)
    slot.fade = lerp(slot.fade || 0, 1, Math.min(1, dt * 4.5));
    // 걸린 것 30 — 흰 매트(v79)가 46 에서는 하얗게 날아갔다
    const base = e.sprite ? 28 : 30;
    const dim = (M.seen.has(e.id) && !on) ? 0.72 : 1;   // 본 것은 조금 어둡게
    slot.sp.intensity = base * dim * (1 + e.k * 1.25) * slot.fade;
  }

  // Hover 연출 — 액자가 벽에서 살짝 떠오르고 명찰이 밝아진다
  for (const e of M.exhibits) {
    if (!e.node) continue;
    const on = M.focus === e ? 1 : 0;
    const prev = e.k || 0;
    e.k = lerp(prev, on, Math.min(1, dt * 7));
    if (e.k < 0.002 && prev < 0.002) continue;
    const push = e.k * 3.2;
    e.node.position.set((e.x + e.nx * push) / CM, e.y / CM, (e.z + e.nz * push) / CM);
    // 액자(평면)만 확대한다. 3D 사물은 크기를 키우면 바닥을 파고든다.
    if (e.pic && e.pic.isMesh && !e.sprite) e.pic.scale.setScalar(1 + e.k * 0.02);
    if (e.plate) e.plate.material.opacity = 0.72 + e.k * 0.28;
  }
}

/* ══════════════════════════════════════════════════════════
   HUD · 오버레이
   ══════════════════════════════════════════════════════════ */
let lastRoom = null;
function paintHud(room) {
  if (room && room !== lastRoom) {
    lastRoom = room;
    $('rtEn').textContent = room.en;
    $('rtKr').textContent = room.name;
    $('rtDesc').textContent = room.desc;
    const tag = $('rtKr').parentElement;
    tag.classList.remove('flash'); void tag.offsetWidth; tag.classList.add('flash');
    drawMinimap();
  }
  // 매 프레임 DOM 을 쓰면 그 자체로 레이아웃 비용이 든다 — 값이 바뀔 때만
  const pk = M.seen.size + '/' + M.total;
  if (pk !== M.prgKey) {
    M.prgKey = pk;
    $('prgNum').textContent = '관람 ' + M.seen.size + ' / ' + M.total;
    $('prgFill').style.width = (M.total ? (M.seen.size / M.total) * 100 : 0) + '%';
  }
  paintMe();
}

function paintPrompt() {
  const p = $('prompt'), btn = $('actBtn'), f = M.focus;
  if (!f) {
    p.classList.add('hidden');
    btn.classList.add('off');
    $('actIcon').textContent = '🔍'; $('actTx').textContent = '조사';
    $('reticle').classList.remove('on');
    return;
  }
  $('prIcon').textContent = f.icon || '🔍';
  $('prLabel').textContent = f.label || '오브젝트';
  p.classList.remove('hidden');
  $('reticle').classList.add('on');
  btn.classList.remove('off');
  $('actIcon').textContent = f.icon || '🔍';
  $('actTx').textContent = cut(f.label, 6);
}


/* 미니맵 — 실제 비율 평면도. 지금 층만 그린다(1층·바깥은 같은 판, 2층은 따로).
   예전엔 같은 크기 칸의 격자였다 — 방 크기와 위치가 제각각인 복층 평면에서는 거짓말이 된다. */
const MM_W = () => (innerWidth <= 620 ? 150 : 200);
function mmFrame(lv, outdoorField) {
  const zn = M.room && M.room.zone;                                   // v122 — 숲 · 클럽하우스 / 레인지 · 주차장
  if (zn === 'west') return { x0: -9800, z0: -1000, x1: -3600, z1: 6800 };
  if (zn === 'east') return { x0: 8400, z0: -1000, x1: 15200, z1: 6800 };
  if (outdoorField) return { x0: -4200, z0: -13200, x1: 9000, z1: 6800 };
  return { x0: -300, z0: -1100, x1: 5100, z1: 3300 };
}
function drawMinimap() {
  const el = $('minimap');
  if (!el) return;
  const cur = M.room;
  const inField = cur && cur.outdoor && cur.lv === 0 && !String(cur.id).startsWith('ter');
  const lv = cur && !cur.outdoor ? cur.lv : (cur && cur.lv) || 0;
  const F = mmFrame(lv, inField);
  const W = MM_W(), k = W / (F.x1 - F.x0), H = Math.round((F.z1 - F.z0) * k);
  M.mm = { F, k };
  const shown = M.rooms.filter((r) => !r.vault && !r.lost && (!r.secret || M.canManage)
    && (inField ? (r.lv === 0 || r.outdoor) : (r.outdoor ? r.lv === lv || (lv === 0 && !r.terrain) : r.lv === lv)));
  const cells = shown.map((r) => {
    const x0 = Math.max(F.x0, r.x0), x1 = Math.min(F.x1, r.x1), z0 = Math.max(F.z0, r.z0), z1 = Math.min(F.z1, r.z1);
    if (x1 <= x0 || z1 <= z0) return '';
    const here = cur && (cur.id === r.id || (cur.part && cur.part === (r.part || r.id)) || (r.part && r.part === cur.id));
    const cls = ['mm-room', here ? 'here' : '', M.visited.has(r.part || r.id) ? 'seen' : '',
      r.outdoor ? 'out' : '', r.terrain ? 'field' : '', r.closed ? 'shut' : '', r.secret ? 'secret' : ''].filter(Boolean).join(' ');
    const label = (!r.part && !r.stair && (x1 - x0) * k > 34) ? '<span>' + (r.closed ? '🔒 ' : '') + esc(r.name) + '</span>' : '';
    return '<div class="' + cls + '" style="left:' + ((x0 - F.x0) * k).toFixed(1) + 'px;top:' + ((z0 - F.z0) * k).toFixed(1)
      + 'px;width:' + ((x1 - x0) * k).toFixed(1) + 'px;height:' + ((z1 - z0) * k).toFixed(1) + 'px">' + label + '</div>';
  }).join('');
  // v124 — 수장고 문(생겼으면) — 1층 평면에서 빨간 점
  const vd = typeof VAULT !== 'undefined' && VAULT.door && VAULT.door.x != null && !inField && lv === 0 && !(cur && cur.zone)
    ? '<i class="mm-door" title="수장고" style="left:' + ((VAULT.door.x - F.x0) * k).toFixed(1) + 'px;top:' + ((VAULT.door.z - F.z0) * k).toFixed(1) + 'px"></i>' : '';
  el.innerHTML = '<div class="mm-plan" style="width:' + W + 'px;height:' + H + 'px">' + cells + vd
    + '<i class="mm-me" id="mmMe"></i></div><b class="mm-lv">' + (cur && cur.zone === 'west' ? '서쪽 숲' : cur && cur.zone === 'east' ? '드라이빙 레인지' : inField ? '18번 홀' : (lv ? '2F' : '1F')) + '</b>';
  M.mmKey = (inField ? 'F' : 'B') + lv + ((cur && cur.zone) || '');
  M.meKey = '';
  paintMe();
}

/* 미니맵의 나 — 지금 방 칸 안에서의 위치 + 바라보는 방향.
   칸은 실제 방 비율과 다르므로(복도도 같은 칸) 방 안에서의 **비율**로만 찍는다.
   화면 위쪽 = 북(-z). 카메라 yaw 가 +면 왼쪽으로 돈다 → CSS 회전은 -yaw. */
/* 미니맵의 나 — 평면도 위 실제 위치 + 바라보는 방향.
   화면 위쪽 = 북(-z). 카메라 yaw 가 +면 왼쪽으로 돈다 → CSS 회전은 -yaw. */
function paintMe() {
  const me = $('mmMe');
  if (!me || !M.mm) return;
  // 층이 바뀌었거나 필드로 나갔으면 판을 새로 그린다
  const cur = M.room;
  const inField = cur && cur.outdoor && cur.lv === 0 && !String(cur.id).startsWith('ter');
  const want = (inField ? 'F' : 'B') + (cur && !cur.outdoor ? cur.lv : (cur && cur.lv) || 0) + ((cur && cur.zone) || '');
  if (want !== M.mmKey) { drawMinimap(); return; }
  const { F, k } = M.mm;
  const px = (M.pos.x * CM - F.x0) * k, pz = (M.pos.z * CM - F.z0) * k;
  const key = px.toFixed(1) + ',' + pz.toFixed(1) + ',' + M.yaw.toFixed(2);
  if (key === M.meKey) return;
  M.meKey = key;
  me.style.left = px.toFixed(1) + 'px';
  me.style.top = pz.toFixed(1) + 'px';
  me.style.transform = 'translate(-50%,-50%) rotate(' + (-M.yaw).toFixed(3) + 'rad)';
}

/* ── 관람 기록 — 다음 방문에 이어진다 ──────────────────────────
   예전엔 새로 고치면 '관람 0 / 41' 로 돌아갔다. 기기(브라우저)에 남긴다 —
   관람 기록은 그 사람의 것이지 전시관의 데이터가 아니므로 서버에 둘 이유가 없다.
   ⚠️ 전시물 id(`archive-3`)는 **배치 순번**이라 라운드가 하나 늘면 전부 한 칸씩 밀린다.
      그걸 저장하면 엉뚱한 전시물이 '본 것' 이 된다 → 방 + 제목으로 키를 만든다.
   known = 지난 방문 때 걸려 있던 전부. 그 뒤에 들어온 것만 '새 소장품' 으로 센다
   (이 전시관의 전제가 '라운드가 등록되면 전시물이 한 점 늘어난다' 이므로). */
const SEEN_KEY = 'museum-seen-v1';
const KNOWN_KEY = 'museum-known-v1';
const exKey = (e) => e.room + '|' + (e.title || e.label || '');
const counted = (e) => e.type !== 'prop' && e.type !== 'placard';

function loadVisit() {
  let seen = [], known = null;
  try {
    seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
    known = JSON.parse(localStorage.getItem(KNOWN_KEY) || 'null');
  } catch (e) { /* 저장소가 막힌 기기 — 기록 없이 관람 */ }
  const had = new Set(Array.isArray(seen) ? seen : []);
  const list = M.exhibits.filter(counted);
  for (const e of list) if (had.has(exKey(e))) M.seen.add(e.id);
  const knew = new Set(Array.isArray(known) ? known : []);
  const fresh = known ? list.filter((e) => !knew.has(exKey(e))).length : 0;
  try { localStorage.setItem(KNOWN_KEY, JSON.stringify(list.map(exKey))); } catch (e) { /* 무시 */ }
  return fresh;
}

function saveSeen() {
  const keys = M.exhibits.filter((e) => M.seen.has(e.id)).map(exKey);
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(keys)); } catch (e) { /* 무시 */ }
}

function interact() {
  if (M.openId) return closeOverlay();
  // 카트 — 타고 있으면 내리고, 곁에 있으면 탄다
  if (typeof CART !== 'undefined') { if (CART.driving) return cartExit(); if (cartNear() && !M.focus) return cartBoard(); }
  if (M.focus) openExhibit(M.focus);
}

function setScrim(url) {
  const c = $('ovCard');
  if (c) c.style.setProperty('--shot', url ? "url('" + url + "')" : 'none');
}

function openExhibit(e) {
  if (e.npcRef && typeof dlgOpen === 'function' && e.npcRef.role !== 'watch' && e.npcRef.role !== 'golfer' && e.npcRef.role !== 'range') { dlgOpen(e.npcRef); return; }   // 골퍼(v120)는 카트 · 스윙 중이라 한 마디만   // v115 — 대화창(상세 패널 대신)
  if (e.npcRef && typeof npcAsk === 'function' && npcAsk(e.npcRef)) return;      // v99 — 관람객은 먼저 대답한다
  if (e.onUse) { e.onUse(e); return; }                                          // v108 — 문(수장고)
  M.openId = e.id;
  setScrim(e.img);
  if (counted(e) && !M.seen.has(e.id)) { M.seen.add(e.id); saveSeen(); }
  $('ovBody').innerHTML = renderExhibit(e);
  if (typeof hauntNote === 'function') hauntNote(e);          // v102 — 관리자 메모 · 새 초상
  if (e.onOpen) e.onOpen(e);                                   // v114 — 방탈출 쪽지
  // 스코어카드 홀별 표(22칸)는 기본 폭(620px)에 들어가지 않는다
  $('ovCard').classList.toggle('wide', !!e.card);
  $('overlay').classList.remove('hidden');
  $('prompt').classList.add('hidden');
  $('ovBody').scrollTop = 0;
  /* FPS(마우스 고정) 중에는 커서가 없어 영상 컨트롤·전체화면·스크롤을 만질 수 없다.
     팝업이 열리면 커서를 돌려주고, 닫을 때 다시 고정한다. */
  if (M.locked) { M.relock = true; document.exitPointerLock(); }

  M.gal = null;
  if (e.type === 'photo') {
    const prev = $('shPrev'), next = $('shNext'), img = $('ovShot');
    if (prev) prev.onclick = (ev) => { ev.stopPropagation(); galStep(-1); };
    if (next) next.onclick = (ev) => { ev.stopPropagation(); galStep(1); };
    // 사진을 클릭해도 다음 장 — 모바일에서 작은 화살표를 겨누지 않아도 되게
    if (img) img.onclick = () => galStep(1);
    hydratePhoto(e);
  }
  if (e.card) hydrateScore(e);
}

function closeOverlay() {
  if (!M.openId) return;
  M.openId = null;
  M.gal = null;
  // 팝업을 보는 동안 눌린 채 남은 키를 지운다(닫는 순간 혼자 걸어가지 않게).
  // 계속 누르고 있으면 키 자동반복이 곧 다시 채운다.
  M.keys = {};
  $('overlay').classList.add('hidden');
  // innerHTML 을 비우는 것이 곧 '재생 정지' 다 — iframe 이 사라지면 소리도 멈춘다
  $('ovBody').innerHTML = '';
  setScrim(null);
  paintPrompt();
  if (M.relock) { M.relock = false; tryLock($('gal')); }
}

function renderExhibit(e) {
  const label = e.no ? '소장품 No.' + pad3(e.no) : (e.type === 'prop' ? '비전시품' : '안내');
  let h = '<p class="ov-no">' + label + '</p>'
    + '<h2 class="ov-title">' + esc(e.title || e.label) + '</h2>'
    + (e.subtitle ? '<p class="ov-sub">' + esc(e.subtitle) + '</p>' : '');
  if (e.type === 'screen') h += videoHTML(e);
  else if (e.type === 'photo') h += photoHTML(e);
  else if (e.card) h += scoreHTML(e);
  else if (e.img && e.type !== 'trophy') {
    // 로고는 투명 배경이라 검은 액자 안에서 뭉개진다 → 종이색 매트지를 깐다
    h += '<div class="ov-frame' + (e.type === 'placard' ? ' paper' : '') + '">'
      + '<img src="' + esc(e.img) + '" alt=""></div>';
  }

  const body = String(e.body || e.caption || '')
    .replace(/\{TOTAL\}/g, M.total)
    .split('\n').map((l) => (l ? '<p>' + esc(l) + '</p>' : '<p class="sp"></p>')).join('');
  h += '<div class="ov-text">' + body + '</div>';

  if (e.stats) {
    h += '<div class="ov-stats">' + e.stats.map(([k, v]) =>
      '<div class="ov-stat"><span>' + esc(k) + '</span><b>' + esc(v) + '</b></div>').join('') + '</div>';
  }
  if (e.type === 'guestbook') {
    const rows = e.entries || [];
    h += rows.length
      ? '<div class="ov-guest">' + rows.map((g) =>
        '<div class="gb"><span class="gb-who" style="color:' + (g.color || '#9BE36A') + '">'
        + esc(g.name || '익명') + '</span><span class="gb-body">' + esc(g.body || '')
        + '</span><span class="gb-date">' + esc(fmtDate(g.created_at)) + '</span></div>').join('') + '</div>'
      : '<p class="ov-empty">아직 남겨진 글이 없습니다.</p>';
  }
  h += '<p class="ov-foot">' + esc(SITE.foot) + ' · ' + (M.live ? '실기록 소장' : '샘플 아카이브') + '</p>';
  return h;
}

/**
 * 상영 화면 — clip.embed 를 실제 플레이어로 감싼다.
 *
 * ⚠️ golfscore 의 `embed` 는 **HTML 이 아니라 재생 URL** 이다.
 *      youtube → https://www.youtube.com/embed/<id>?autoplay=1&controls=…
 *      drive   → https://drive.google.com/file/d/<id>/preview
 *      그 외   → 원본 주소(.mp4 등)
 *    그래서 예전 코드처럼 innerHTML 에 그대로 넣으면 **주소 문자열만 찍히고
 *    아무것도 재생되지 않는다.** iframe/video 로 감싸야 한다.
 *
 * ⚠️ URL 에 autoplay=1 이 들어 있어도 iframe 에 allow="autoplay" 가 없으면
 *    브라우저가 막는다. 조사(클릭/키)로 열리므로 사용자 제스처는 이미 있다.
 */
function videoHTML(e) {
  const url = e.embed;
  if (!url) {
    return '<div class="ov-video off">'
      + (e.img ? '<img src="' + esc(e.img) + '" alt="">' : '')
      + '<span class="ov-vmsg">원본 영상이 연결되지 않았습니다</span></div>';
  }
  const cls = 'ov-video' + (e.portrait ? ' portrait' : '');
  // 직접 업로드된 파일은 iframe 이 아니라 <video> 로 — 컨트롤이 붙는다
  if (/\.(mp4|webm|ogv|mov)(\?|$)/i.test(url)) {
    return '<div class="' + cls + '"><video src="' + esc(url) + '"'
      + (e.img ? ' poster="' + esc(e.img) + '"' : '')
      + ' controls autoplay playsinline loop preload="metadata"></video></div>';
  }
  return '<div class="' + cls + '"><iframe src="' + esc(url) + '"'
    + ' title="' + esc(e.title || '영상') + '" frameborder="0"'
    + ' allow="autoplay; encrypted-media; picture-in-picture; fullscreen"'
    + ' referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>';
}

/* ── 스코어카드 — 합계 표 → 홀별 표 + 원본 사진 ─────────────────
   팝업은 **즉시** 합계 표로 뜬다(벽에 걸린 카드와 같은 값). 그 뒤 get_scores 를 받아
   홀별 표로 바꿔 끼우고, 원본 사진이 있으면 위에 붙인다. 원본이 여러 장이면
   사진 갤러리와 같은 넘겨보기(M.gal · ←→)를 쓴다. */
const scoreDiff = (d) => (d == null ? '—' : d === 0 ? 'E' : (d > 0 ? '+' + d : String(d)));

function scoreHTML(e) {
  const c = e.card;
  const rows = c.rows.map((x) => '<tr' + (x.win ? ' class="win"' : '') + '><th class="nm">'
    + (x.win ? '<b class="sc-crown">♛</b>' : '') + esc(x.name) + '</th>'
    + '<td>' + (x.played ? x.played + 'H' : '—') + '</td>'
    + '<td class="tot">' + (x.done && x.total != null ? x.total : '—') + '</td>'
    + '<td' + (x.diff != null && x.diff < 0 ? ' class="under"' : '') + '>' + scoreDiff(x.diff) + '</td></tr>').join('');
  return '<div class="sc">'
    + '<div id="scShots"></div>'
    + '<div class="sc-scroll"><table class="sc-grid sc-sum" id="scGrid">'
    + '<thead><tr><th class="nm">PLAYER</th><th>HOLES</th><th class="tot">STROKES</th><th>± PAR ' + c.par + '</th></tr></thead>'
    + '<tbody>' + (rows || '<tr><td colspan="4">기록 없음</td></tr>') + '</tbody></table></div>'
    + '<p class="sc-hint" id="scHint">홀별 기록을 불러오는 중…</p>'
    + '</div>';
}

/** 홀별 표 — 실제 스코어카드 표기(버디 ○ · 이글 ◎ · 보기 □ · 더블 이상 ▣) */
function scoreGrid(card, data) {
  const pars = data.pars && data.pars.length ? data.pars : PAR_DEFAULT;
  const n = pars.length;
  const halves = n > 9 ? [[0, 9, 'OUT'], [9, n, 'IN']] : [[0, n, 'OUT']];
  const sum = (arr) => arr.reduce((a, b) => a + b, 0);
  const winSet = new Set(card.rows.filter((x) => x.win).map((x) => x.name));

  let head = '<tr><th class="nm">HOLE</th>', par = '<tr class="par"><th class="nm">PAR</th>';
  for (const [a, b, lb] of halves) {
    for (let i = a; i < b; i++) { head += '<th>' + (i + 1) + '</th>'; par += '<td>' + pars[i] + '</td>'; }
    head += '<th class="sub">' + lb + '</th>';
    par += '<td class="sub">' + sum(pars.slice(a, b)) + '</td>';
  }
  head += '<th class="tot">TOT</th><th>±</th></tr>';
  par += '<td class="tot">' + sum(pars) + '</td><td></td></tr>';

  const body = data.players.map((p) => {
    const win = winSet.has(p.name);
    let tr = '<tr' + (win ? ' class="win"' : '') + '><th class="nm">'
      + (win ? '<b class="sc-crown">♛</b>' : '') + esc(p.name) + '</th>';
    let tot = 0, got = 0, parGot = 0;
    for (const [a, b] of halves) {
      let half = 0, hn = 0;
      for (let i = a; i < b; i++) {
        const v = +(p.holes[i + 1] ?? p.holes[String(i + 1)] ?? 0);
        if (!v) { tr += '<td class="nil">·</td>'; continue; }
        const d = v - pars[i];
        const cls = v === 1 ? 'hio' : d <= -2 ? 'eg' : d === -1 ? 'bd' : d === 1 ? 'bg' : d >= 2 ? 'db' : '';
        tr += '<td' + (cls ? ' class="' + cls + '"' : '') + '><i>' + v + '</i></td>';
        half += v; hn++; parGot += pars[i];
      }
      tr += '<td class="sub">' + (hn ? half : '—') + '</td>';
      tot += half; got += hn;
    }
    const diff = got ? tot - parGot : null;
    tr += '<td class="tot">' + (got ? tot : '—') + '</td>'
      + '<td' + (diff != null && diff < 0 ? ' class="under"' : '') + '>'
      + (got === n ? scoreDiff(diff) : (got ? got + 'H' : '—')) + '</td></tr>';
    return tr;
  }).join('');
  return '<thead>' + head + par + '</thead><tbody>' + body + '</tbody>';
}

async function hydrateScore(e) {
  const openedFor = e.id;
  const data = await loadRoundScores(e.card);
  if (M.openId !== openedFor) return;       // 받는 동안 닫혔거나 다른 전시물로 넘어갔다
  const hint = $('scHint'), grid = $('scGrid');
  if (!data || !data.players || !data.players.length) {
    if (hint) hint.textContent = '홀별 기록을 불러오지 못했습니다. 합계만 표시합니다.';
    return;
  }
  if (grid) {
    grid.classList.remove('sc-sum');
    grid.innerHTML = scoreGrid(e.card, data);
  }
  if (hint) {
    hint.innerHTML = '<span class="sc-key"><i class="k-eg"></i>이글</span>'
      + '<span class="sc-key"><i class="k-bd"></i>버디</span>'
      + '<span class="sc-key"><i class="k-bg"></i>보기</span>'
      + '<span class="sc-key"><i class="k-db"></i>더블 이상</span>'
      + (data.sample ? '<span class="sc-key sc-sample">샘플 타수</span>' : '');
  }
  // 원본 사진 — 있으면 표 위에. 여러 장이면 사진 갤러리와 같은 넘겨보기
  const shots = data.photos || [];
  const box = $('scShots');
  if (box && shots.length) {
    const many = shots.length > 1;
    box.innerHTML = '<p class="sc-cap">원본 스코어카드' + (many ? ' · ' + shots.length + '장' : '') + '</p>'
      + '<div class="ov-shots' + (many ? ' many' : '') + '">'
      + '<div class="ov-frame"><img id="ovShot" src="' + esc(shots[0]) + '" alt="원본 스코어카드"></div>'
      + (many ? '<div class="ov-shotbar"><button class="sh-nav" id="shPrev" aria-label="이전 사진">‹</button>'
        + '<span class="sh-count" id="shCount">1 / ' + shots.length + '</span>'
        + '<button class="sh-nav" id="shNext" aria-label="다음 사진">›</button></div>' : '')
      + '</div>';
    if (many) {
      M.gal = { list: shots, i: 0 };
      $('shPrev').onclick = (ev) => { ev.stopPropagation(); galStep(-1); };
      $('shNext').onclick = (ev) => { ev.stopPropagation(); galStep(1); };
      $('ovShot').onclick = () => galStep(1);
    }
    setScrim(shots[0]);
  }
}

/* ── 사진 — 여러 장 묶음 ────────────────────────────────────
   사진첩 목록 API 는 **대표 1장만** 준다. 여러 장 올린 사진은
   photo_get.php 로 나머지를 받아야 하는데 그 호출이 없어서 첫 장만 열렸다.
   → 팝업이 열린 뒤 비동기로 받아와 넘겨보기(슬라이드)로 바꿔 끼운다.

   세로 사진이 위아래 잘리던 원인은 CSS 의 object-fit:cover 였다.
   contain 으로 바꾸고 액자가 사진 비율을 따라 줄어들게 했다(style.css .ov-frame). */
function photoHTML(e) {
  const many = (e.imgCount || 1) > 1;
  return '<div class="ov-shots' + (many ? ' many' : '') + '" id="ovShots">'
    + '<div class="ov-frame"><img id="ovShot" src="' + esc(e.img) + '" alt=""></div>'
    + (many
      ? '<div class="ov-shotbar">'
        + '<button class="sh-nav" id="shPrev" aria-label="이전 사진">‹</button>'
        + '<span class="sh-count" id="shCount">1 / ' + e.imgCount + '</span>'
        + '<button class="sh-nav" id="shNext" aria-label="다음 사진">›</button>'
        + '</div><p class="sh-hint" id="shHint">사진을 불러오는 중…</p>'
      : '')
    + '</div>';
}

/** 팝업이 DOM 에 들어간 뒤 — 나머지 장을 받아 슬라이드를 활성화한다 */
async function hydratePhoto(e) {
  M.gal = null;
  if ((e.imgCount || 1) <= 1) return;
  const openedFor = e.id;
  const data = await loadPhotoPages(e.src || { id: e.photoId, img_count: e.imgCount });
  // 받아오는 동안 팝업이 닫혔거나 다른 전시물로 넘어갔으면 버린다
  if (M.openId !== openedFor) return;
  const hint = $('shHint');
  if (!data || !data.images.length) {
    if (hint) hint.textContent = '나머지 사진을 불러오지 못했습니다.';
    return;
  }
  M.gal = { list: data.images, i: 0 };
  if (hint) {
    hint.textContent = data.sample
      ? `샘플 ${data.images.length}장 — ${M.touch ? '옆으로 밀거나 ‹ › 로' : '‹ › 또는 ←→ 로'} 넘깁니다`
      : `${data.images.length}장 묶음 — ${M.touch ? '옆으로 밀거나 ‹ › 로' : '‹ › 또는 ←→ 로'} 넘깁니다`;
  }
  galShow(0);
}

function galShow(i) {
  const g = M.gal;
  if (!g) return;
  g.i = (i + g.list.length) % g.list.length;
  const img = $('ovShot');
  if (img) img.src = g.list[g.i];
  const c = $('shCount');
  if (c) c.textContent = (g.i + 1) + ' / ' + g.list.length;
  // 앞뒤 한 장씩 미리 받아둔다 — 넘길 때 흰 칸이 보이지 않게
  for (const d of [1, -1]) {
    const n = new Image();
    n.src = g.list[(g.i + d + g.list.length) % g.list.length];
  }
}
const galStep = (d) => { if (M.gal) galShow(M.gal.i + d); };

const cut = (s, n) => (!s ? '' : String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* 진단용 노출 */
window.MUSEUM = M;
window.THREE_R = THREE;
document.addEventListener('DOMContentLoaded', boot);
