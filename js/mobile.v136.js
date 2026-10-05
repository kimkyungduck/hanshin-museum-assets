/* ══════════════════════════════════════════════════════════
   폰 화면 정리 (v119)
   ══════════════════════════════════════════════════════════
   사용자: "모바일에서 UI 가 너무 불편해".
   잰 것(375×812): 오른쪽 위에 글자 10px · 높이 27px 칩이 다섯 개(소리 · 손전등 · 시계 · 사진 · 쪽지) 세로로 쌓였고,
   미니맵(166×152)이 왼손 엄지 자리(조이스틱)에 앉아 있었고, 가로로 돌리면 데스크톱 배치가 그대로 나왔다.
   → 터치 기기에선
     · 오른손 엄지: [조사] 위에 손전등(큰 원) · 사진, 왼쪽에 점프 — 자주 누르는 것만 엄지 닿는 곳에
     · 오른쪽 위 작은 원 버튼 줄(독): 소리 · 지도 · 쪽지 · 설정 — 가끔 누르는 것
     · 미니맵은 왼쪽 위로 작게(지도 버튼으로 끄고 켠다)
     · 처음엔 '왼쪽을 밀어 이동 · 오른쪽을 끌어 둘러보기' 안내, 한 번 움직이면 사라진다
     · 대화창이 열리면 엄지 버튼을 감추고 선택지를 크게
   배치는 css/style.css 의 '터치 레이아웃(v119)' 이 맡고, 여기선 버튼을 독으로 옮기기만 한다(칩을 만드는 모듈은 그대로). */
const MOB = { dock: null, obs: null };
const MOB_DOCK = ['sndChip', 'mmBtn', 'escChip', 'adminChip'];

function mobileSetup() {
  const gal = document.getElementById('gal');
  if (!gal || MOB.dock) return;
  const dock = MOB.dock = document.createElement('div'); dock.className = 'm-dock'; dock.id = 'mDock';
  gal.appendChild(dock);
  // 지도 — 끄고 켜기(기억한다). v121: ui.js 가 먼저 만들었으면 그대로 쓴다
  if (!document.getElementById('mmBtn')) {
  const mm = document.createElement('button'); mm.id = 'mmBtn'; mm.className = 'bgm-chip mm-btn'; mm.setAttribute('aria-label', '지도');
  mm.innerHTML = '<i class="ci">🗺</i><span class="ct"> 지도</span>';
  let off = false; try { off = localStorage.getItem('museum-mm') === '0'; } catch (e) { /* 기본 켬 */ }
  gal.classList.toggle('mm-off', off); mm.classList.toggle('off', off);
  mm.addEventListener('click', (ev) => {
    ev.stopPropagation();
    const now = !gal.classList.contains('mm-off');
    gal.classList.toggle('mm-off', now); mm.classList.toggle('off', now);
    try { localStorage.setItem('museum-mm', now ? '0' : '1'); } catch (e) { /* 기억 못 해도 된다 */ }
  });
  gal.appendChild(mm);
  }
  // 처음 안내 — 한 번 움직이거나 둘러보면 사라진다
  const hl = document.createElement('div'); hl.className = 'm-hint l'; hl.innerHTML = '<i></i>밀어서 이동<br><small>끝까지 밀면 달리기</small>';
  const hr = document.createElement('div'); hr.className = 'm-hint r'; hr.innerHTML = '끌어서 둘러보기';
  gal.appendChild(hl); gal.appendChild(hr);
  const used = () => { gal.classList.add('m-used'); setTimeout(() => { hl.remove(); hr.remove(); }, 900); };
  gal.addEventListener('pointerdown', (ev) => { if (ev.target === gal || ev.target.id === 'glcv') setTimeout(used, 1200); }, { once: false });
  setTimeout(used, 14000);
  mobileDock();
  // 칩은 모듈마다 늦게(밤 · 방탈출 · 관리자) 생긴다 → 생길 때마다 독으로
  MOB.obs = new MutationObserver(mobileDock);
  MOB.obs.observe(gal, { childList: true });
}
function mobileDock() {
  if (!MOB.dock) return;
  for (const id of MOB_DOCK) {
    const el = document.getElementById(id);
    if (el && el.parentNode !== MOB.dock) MOB.dock.appendChild(el);
  }
  // 순서를 고정한다(생긴 순서와 상관없이)
  for (const id of MOB_DOCK) { const el = document.getElementById(id); if (el) MOB.dock.appendChild(el); }
}

/* 사진 넘기기 — 옆으로 밀기(사진첩 · 원본 스코어카드). 짧게 톡 치는 건 원래대로(다음 장) */
(function () {
  let sx = 0, sy = 0, on = false;
  document.addEventListener('touchstart', (ev) => {
    const t = ev.touches[0]; on = !!(ev.touches.length === 1 && ev.target.closest && ev.target.closest('.ov-frame') && M.gal);
    if (on) { sx = t.clientX; sy = t.clientY; }
  }, { passive: true });
  document.addEventListener('touchend', (ev) => {
    if (!on) return; on = false;
    const t = ev.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 45 && Math.abs(dy) < Math.abs(dx) * 0.7 && typeof galStep === 'function') {
      ev.preventDefault();                                                   // 뒤따르는 click(= 다음 장)을 막는다
      galStep(dx < 0 ? 1 : -1);
    }
  }, { passive: false });
})();
