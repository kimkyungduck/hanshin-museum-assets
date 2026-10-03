/* ══════════════════════════════════════════════════════════
   화면 도구 정리 (v121)
   ══════════════════════════════════════════════════════════
   사용자: "버튼 같은 UI/UX 부분을 좀 개선해 줘. 대충 만든 것처럼 다 티 난다".
   잰 것: 오른쪽에 폭 · 높이 · 글자 크기가 제각각인 칩 다섯 개가 따로따로(모듈마다 자기 칩을 만들어 붙였다),
          아이콘은 이모지, 글자는 10~11px, 미니맵 · 안내 · 대화창 · 알림이 서로 다른 모양(팔각 · 직각 · 둥근)이었다.
   → 하나의 규칙(유리 카드 · 12px 둥근 모서리 · 가는 테두리 · 선 아이콘 · 본문 Noto Sans KR)으로 다시 그린다(css '화면 도구(v121)').
     데스크톱: 도구 버튼을 오른쪽 세로 레일 하나에 모은다. 아이콘만 두고 마우스를 올리면 이름과 단축키가 뜬다.
     폰: mobile.js 의 배치(엄지 · 독)를 그대로 쓰고 아이콘만 같다.
   칩을 만드는 모듈(sound · torch · memento · escape · museum3d)은 그대로 두고, 여기서 레일로 옮기기만 한다. */
const UI = { rail: null, obs: null };
const UI_RAIL = ['lockChip', 'sndChip', 'torchChip', 'photoChip', 'mmBtn', 'escChip', 'adminChip'];

function uiSetup() {
  const gal = document.getElementById('gal');
  if (!gal || UI.rail) return;
  const rail = UI.rail = document.createElement('div'); rail.className = 'ui-rail'; rail.id = 'uiRail';
  gal.appendChild(rail);
  // 지도 — 끄고 켜기(데스크톱 · 폰 공통, 기억한다)
  if (!document.getElementById('mmBtn')) {
    const mm = document.createElement('button'); mm.id = 'mmBtn'; mm.className = 'bgm-chip mm-btn'; mm.setAttribute('aria-label', '지도');
    mm.innerHTML = '<i class="ci"></i><span class="ct">지도</span>';
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
  uiDock();
  UI.obs = new MutationObserver(uiDock);
  UI.obs.observe(gal, { childList: true });
  // 조작 안내 — 30초 지나면 옅게(마우스를 올리면 다시)
  setTimeout(() => gal.classList.add('ui-quiet'), 30000);
}
/** 도구 버튼을 레일로(폰에선 레일을 비우고 mobile.js 가 독 · 엄지 자리로 옮긴다) */
function uiDock() {
  const gal = document.getElementById('gal');
  if (!UI.rail || !gal) return;
  if (typeof M !== 'undefined' && M.touch) {
    while (UI.rail.firstChild) gal.appendChild(UI.rail.firstChild);
    return;
  }
  for (const id of UI_RAIL) {
    const el = document.getElementById(id);
    if (el && el.parentNode !== UI.rail) UI.rail.appendChild(el);
  }
  for (const id of UI_RAIL) { const el = document.getElementById(id); if (el) UI.rail.appendChild(el); }
}
