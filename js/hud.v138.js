/* ══════════════════════════════════════════════════════════
   인게임 화면(v132) — '안에 들어가서 쓰는 UI 도 게임처럼'
   ══════════════════════════════════════════════════════════
   · 구역 배너 — 새 구역(그랜드 홀 · 명예의 전당 …)에 들어서면 화면 위쪽에 '— 1F · HALL OF FAME — 명예의 전당'
     이 떴다 사라진다. 왼쪽 위 이름표는 작게(층 · 영문 · 이름)만 남는다
   · 일시 정지 — Esc 로 마우스 고정을 풀면(팝업 · 대화 · 설정이 연 것이 아니면) 게임처럼 멈춘다.
     계속하기 · 밤의 기록 · 소리 · 낮/밤 · 타이틀로. 오른쪽에 조작 안내. ↑↓ · Enter · Esc
   · 보이는 모양은 style.css '인게임 UI(v132)' — 메인 메뉴(v131)와 같은 글꼴 · 금색 선 · 키캡 */
const HUD = { lastG: null, bannerT: 0, pz: null, sel: 0 };

function hudFloor(r) {
  if (!r) return '';
  if (r.outdoor) return 'OUTSIDE';
  return r.lv < 0 ? 'B' + (-r.lv) : (r.lv + 1) + 'F';
}

/** 입장할 때 한 번(enter) */
function hudInit() {
  const gal = document.getElementById('gal'); if (!gal || HUD.on) return;
  HUD.on = true;
  const b = document.createElement('div'); b.className = 'hud-area'; b.id = 'hudArea';
  b.innerHTML = '<p class="ha-k"></p><h2 class="ha-t"></h2><p class="ha-d"></p>';
  gal.appendChild(b); HUD.banner = b;
  // 일시 정지 — 마우스 고정이 사람 손으로 풀렸을 때
  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement) return;
    const t0 = performance.now();
    setTimeout(() => { if (hudCanPause()) hudPause(true); }, 90);
    void t0;
  });
  // 드래그 조작(고정 안 함)일 때는 Esc 로 연다 — 캡처 단계에서 먼저 본다(다른 창이 Esc 로 닫히기 전에)
  addEventListener('keydown', (e) => {
    if (HUD.pz && HUD.pz.classList.contains('on')) { hudPauseKey(e); return; }
    if (e.key === 'Escape' && !M.locked && hudCanPause()) { e.preventDefault(); e.stopPropagation(); hudPause(true); }
  }, true);
}
function hudCanPause() {
  if (!M.entered || M.attract || M.locked || M.openId || M.relock) return false;
  if (typeof OFFICE !== 'undefined' && OFFICE.relock) return false;
  if (M.noPauseOnce) { M.noPauseOnce = false; return false; }
  if (typeof GOLF !== 'undefined' && GOLF.mode) return false;
  if (document.querySelector('#adminPanel, .admin, #recPanel, .esc-pad, .office-read.on')) return false;
  const ov = document.getElementById('overlay'); if (ov && !ov.classList.contains('hidden')) return false;
  if (document.body.classList.contains('is-touch')) return false;
  return true;
}

/** 방이 바뀔 때(paintHud) — 왼쪽 위 이름표에 층을 붙이고, 구역이 바뀌었으면 배너 */
function hudArea(room) {
  if (!room) return;
  const en = document.getElementById('rtEn'); if (en) en.textContent = hudFloor(room) + '  ·  ' + (room.en || '');
  const g = room.part || room.id, now = performance.now();
  if (!HUD.banner || g === HUD.lastG) return;
  HUD.lastG = g;
  if (now - HUD.bannerT < 2500) return;          // 문턱을 오가며 깜빡이지 않게
  HUD.bannerT = now;
  const main = M.roomById[g] || room, b = HUD.banner;
  b.querySelector('.ha-k').textContent = hudFloor(main) + '  ·  ' + (main.en || '');
  b.querySelector('.ha-t').textContent = main.name || '';
  b.querySelector('.ha-d').textContent = main.desc || '';
  b.classList.remove('on'); void b.offsetWidth; b.classList.add('on');
  clearTimeout(HUD.bT); HUD.bT = setTimeout(() => b.classList.remove('on'), 4200);
}

/* ── 일시 정지 ── */
function hudPauseBuild() {
  const gal = document.getElementById('gal');
  const night = typeof NIGHT !== 'undefined' && NIGHT.on;
  const it = (id, kr, en) => `<button class="gm-item" type="button" data-a="${id}"><i class="gm-mk"></i><span class="gm-kr">${kr}</span><span class="gm-en">${en}</span></button>`;
  const d = document.createElement('div'); d.className = 'pz'; d.id = 'pz';
  d.innerHTML = `<div class="pz-shade"></div>
    <div class="pz-col">
      <p class="pz-k">PAUSED</p><h2 class="pz-t">일시 정지</h2><p class="pz-where" id="pzWhere"></p>
      <nav class="pz-menu">
        ${it('resume', '계속하기', 'RESUME')}
        ${night && typeof recPanel === 'function' ? it('rec', '밤의 기록', 'NIGHT RECORDS') : ''}
        ${it('sound', '소리', 'AUDIO')}
        ${typeof museumSetMode === 'function' ? it('mode', night ? '낮에 보기' : '밤으로', night ? 'SWITCH TO DAY' : 'SWITCH TO NIGHT') : ''}
        ${it('title', '타이틀로', 'MAIN MENU')}
      </nav>
    </div>
    <aside class="pz-keys">
      <p class="pz-kh">CONTROLS</p>
      <ul>
        <li><span>이동</span><b><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></b></li>
        <li><span>달리기</span><b><kbd>SHIFT</kbd></b></li>
        <li><span>둘러보기</span><b><kbd>MOUSE</kbd></b></li>
        <li><span>조사 · 줍기</span><b><kbd>E</kbd><kbd>CLICK</kbd></b></li>
        ${night ? '<li><span>손전등</span><b><kbd>F</kbd></b></li><li><span>기념 사진</span><b><kbd>P</kbd></b></li>' : ''}
        <li><span>소리</span><b><kbd>M</kbd></b></li>
        <li><span>일시 정지</span><b><kbd>ESC</kbd></b></li>
      </ul>
    </aside>`;
  gal.appendChild(d); HUD.pz = d;
  const items = [...d.querySelectorAll('.gm-item')];
  items.forEach((b, n) => {
    b.style.setProperty('--d', (0.06 + n * 0.05) + 's');
    b.addEventListener('mouseenter', () => hudPick(n));
    b.addEventListener('click', () => hudDo(b.dataset.a));
  });
  d.querySelector('.pz-shade').addEventListener('click', () => hudPause(false));
}
function hudPick(n) {
  const items = [...HUD.pz.querySelectorAll('.gm-item')];
  HUD.sel = (n + items.length) % items.length;
  items.forEach((b, k) => b.classList.toggle('on', k === HUD.sel));
}
function hudSoundLabel() {
  const b = HUD.pz && HUD.pz.querySelector('[data-a="sound"] .gm-kr');
  if (b) b.textContent = (typeof SND !== 'undefined' && SND.on === false) ? '소리 켜기' : '소리 끄기';
}
function hudPause(on) {
  if (on) {
    if (!HUD.pz) hudPauseBuild();
    const r = M.room, p = document.getElementById('prgNum'), clk = document.querySelector('#gal .night-clock');
    document.getElementById('pzWhere').textContent = [r ? hudFloor(r) + ' · ' + r.name : '', p ? p.textContent : '', clk ? clk.textContent : ''].filter(Boolean).join('   —   ');
    hudSoundLabel();
    M.openId = 'pause'; M.keys = {};
    HUD.pz.classList.add('on'); hudPick(0);
    document.getElementById('gal').classList.add('paused');
  } else if (HUD.pz && HUD.pz.classList.contains('on')) {
    HUD.pz.classList.remove('on');
    document.getElementById('gal').classList.remove('paused');
    if (M.openId === 'pause') M.openId = null;
    M.keys = {};
  }
}
function hudDo(a) {
  if (a === 'resume') { hudPause(false); if (typeof tryLock === 'function' && !document.body.classList.contains('is-touch')) tryLock(document.getElementById('gal')); return; }
  if (a === 'rec') { recPanel(); return; }
  if (a === 'sound') { if (M.bgm && typeof bgmToggle === 'function') bgmToggle(); if (typeof sndToggle === 'function') sndToggle(); hudSoundLabel(); return; }
  if (a === 'mode') { museumSetMode(!NIGHT.on); return; }
  if (a === 'title') { location.reload(); }
}
function hudPauseKey(e) {
  const k = e.key;
  if (document.getElementById('recPanel')) return;                 // 기록 창이 위에 떠 있으면 그쪽이 먼저
  if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); hudDo('resume'); return; }
  if (k === 'ArrowDown' || k === 's' || k === 'S') { e.preventDefault(); e.stopPropagation(); hudPick(HUD.sel + 1); }
  else if (k === 'ArrowUp' || k === 'w' || k === 'W') { e.preventDefault(); e.stopPropagation(); hudPick(HUD.sel - 1); }
  else if (k === 'Enter' || k === ' ') { e.preventDefault(); e.stopPropagation(); const b = HUD.pz.querySelectorAll('.gm-item')[HUD.sel]; if (b) b.click(); }
  else e.stopPropagation();                                        // 일시 정지 중에는 걷기 · 조사 키를 막는다
}
