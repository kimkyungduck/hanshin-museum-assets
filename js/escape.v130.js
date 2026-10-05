/* ══════════════════════════════════════════════════════════
   방탈출 — 그 사람의 물건(v125)
   ══════════════════════════════════════════════════════════
   v114 는 '쪽지 네 장 → 숫자 네 자리 → 번호판' 이었다. 사용자: "너무 숫자에 연연하는 것 같다, 다른 방식이 좋겠다".
   → 숫자 대신 물건과 이야기:
     · 시작 — 방송: "그 사람이 잃어버린 것 네 가지를 돌려주시면 문을 열어 드립니다." 명예의 전당에 얼굴이 뭉개진 '이름 없는 초상'
     · 물건 넷 — 이야기 한 줄씩이 단서(어느 방인지 직접 말하지 않는다). 어둠 속에서 희미하게 빛난다
         붉은 구두 한 짝(상영관) · 빗(트로피실) · 사진 한 장(수장고) · 붉은 머리끈(2층 회랑)
       주울 때마다 일이 생긴다 — 구두: 누가 달려든다 · 빗: "… 고마워" · 사진: 수장고 문이 잠긴다 · 머리끈: 발소리가 따라온다
     · 넷을 초상 앞에 놓으면 — 얼굴이 또렷해지고 웃는다 · 정문이 열린다 · 60초 안에 현관 정문으로(그 사람이 뒤따라온다)
     · 📝 칩(J) — 찾은 것 · 남은 단서 · 남은 시간
   기록: 이 기기의 최고 기록(localStorage museum-escape-best) */
const ESC = { on: false, ready: false, t: 0, limit: 900, items: [], found: new Set(), done: false, outT: 0, chip: null, timerEl: null,
  open: false, runT: 0, chaseT: 0, offered: false };
const ESC_BEST = 'museum-escape-best';
const escFmt = (s) => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const ESC_ITEMS = [
  { id: 'shoe', name: '붉은 구두 한 짝', icon: '👠', room: 'theater', hint: '그 사람이 마지막으로 춤을 춘 곳.\n불이 꺼지면 박수 소리가 나는 어두운 방.' },
  { id: 'comb', name: '빗', icon: '🪮', room: 'trophy', hint: '거울이 없어서, 반짝이는 것에 얼굴을 비춰 보며 머리를 빗었다.\n이긴 사람들의 것이 늘어선 방.' },
  { id: 'photo', name: '사진 한 장', icon: '🖼', room: 'vault', hint: '그 사람의 사진은 아무 데도 걸리지 않았다.\n걸리지 못한 것들이 쌓인 곳 — 빨간 등이 켜진 철문 아래.' },
  { id: 'ribbon', name: '붉은 머리끈', icon: '🎀', room: 'mezz', hint: '높은 데서 아래를 내려다보길 좋아했다.\n계단을 다 오르면, 난간 너머로 홀이 보이는 곳.' },
];

function escapeStart() {
  ESC.on = true;
  document.body.classList.add('escape');
  if (typeof enter === 'function') enter();
}
/** 물건 모양 — 작고 또렷하게(밤에도 보이게 희미한 빛 번짐) */
function escapeItemMesh(id) {
  const G = new THREE.Group(), std = (c, r = 0.5, m = 0) => { const x = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m }); x.userData.noBatch = true; return x; };
  if (id === 'shoe') {
    const red = std(0x9A1418, 0.25, 0.1);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.24), red); body.position.set(0, 0.05, 0); body.rotation.x = -0.25; G.add(body);
    const heel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.008, 0.09, 8), red); heel.position.set(0, 0.045, -0.1); G.add(heel);
    G.rotation.z = Math.PI / 2 * 0.9;                                          // 옆으로 쓰러져 있다
  } else if (id === 'comb') {
    const lac = std(0x1A1210, 0.3, 0.2); const spine = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.012, 0.03), lac); spine.position.y = 0.006; G.add(spine);
    for (let i = 0; i < 18; i++) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.006, 0.035), lac); t.position.set(-0.08 + i * 0.0094, 0.003, 0.032); G.add(t); }
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.002, 0.025), new THREE.MeshBasicMaterial({ color: 0x050404 })); h.position.set(0.02, 0.013, 0.02); G.add(h);   // 걸린 머리카락
  } else if (id === 'photo') {
    const face = typeof portraitCanvas === 'function' ? portraitCanvas(true, 'p12') : null;
    const m = face ? (() => { const t = new THREE.CanvasTexture(face); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshBasicMaterial({ map: t, color: 0xB8B0A4 }); })() : std(0x8C7A62);
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.14), m); card.rotation.x = -Math.PI / 2; card.position.y = 0.004; G.add(card);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.15), std(0xEDE6D6, 0.9)); back.rotation.x = -Math.PI / 2; back.position.y = 0.002; G.add(back);
  } else {
    const red = std(0xB0141C, 0.6);
    const knot = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.009, 8, 18), red); knot.rotation.x = -Math.PI / 2; knot.position.y = 0.01; G.add(knot);
    for (const s of [-1, 1]) { const tail = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.003, 0.12), red); tail.position.set(s * 0.02, 0.004, 0.07); tail.rotation.y = s * 0.3; G.add(tail); }
  }
  G.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  // 빛 번짐 — 어둠 속에서 찾을 수 있게(조명은 늘리지 않는다)
  const cv = makeCanvas(64, 64), c = cv.getContext('2d'), gr = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, id === 'photo' ? 'rgba(255,240,210,.85)' : 'rgba(255,90,70,.85)'); gr.addColorStop(1, 'rgba(255,80,60,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0.55 }));
  glow.scale.setScalar(0.5); glow.position.y = 0.08; G.add(glow); G.userData.glow = glow;
  return G;
}
/** 물건 하나를 방에 둔다 — 바닥, 벽 · 전시물 · 사람에서 떨어진 곳 */
function escapeItem(def, k) {
  const r = M.roomById[def.room], g = M.roomGroups[def.room]; if (!r || !g) return false;
  let spot = null;
  for (let t = 0; t < 60 && !spot; t++) {
    const x = r.x0 + 160 + Math.random() * (r.w - 320), z = r.z0 + 160 + Math.random() * (r.d - 320);
    const fy = floorAt(r, x, z); if (!(fy === fy) || Math.abs(fy - r.y0) > 5) continue;
    if (hitsWall(x, z, r.y0) || M.exhibits.some((e) => e.room === def.room && Math.hypot(e.x - x, e.z - z) < 180)) continue;
    if ((M.npcs || []).some((n) => n.room === def.room && Math.hypot(n.x - x, n.z - z) < 150)) continue;
    spot = { x, z };
  }
  if (!spot) spot = { x: r.cx + 80, z: r.cz + 80 };
  const G = escapeItemMesh(def.id); G.position.set(spot.x / CM, 0, spot.z / CM); G.rotation.y = Math.random() * 6.28;
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 0.2; G.add(hit);
  g.add(G);
  const info = { id: 'esc-item-' + def.id, type: 'placard', icon: def.icon, label: def.name, title: def.name, room: def.room, x: spot.x, z: spot.z, y: 20,
    onUse: () => escapePick(k) };
  M.pickables.push(hit); M.artByMesh.set(hit, info);
  ESC.items[k] = { def, G, hit, info };
  return true;
}
/** 줍기 — 물건마다 일이 생긴다 */
function escapePick(k) {
  const it = ESC.items[k]; if (!it || ESC.found.has(k)) return;
  ESC.found.add(k);
  it.G.visible = false;
  const i = M.pickables.indexOf(it.hit); if (i >= 0) M.pickables.splice(i, 1);
  if (typeof sndCrack === 'function') sndCrack(0.12);
  escapeChip();
  const left = ESC_ITEMS.length - ESC.found.size;
  toast(it.def.name + ' 을(를) 주웠다' + (left ? ' — 남은 것 ' + left + ' · 📝(J)' : ' — 넷 다 찾았다. 명예의 전당, 이름 없는 초상 앞으로'), 3200);
  const id = it.def.id;
  setTimeout(() => {
    if (id === 'shoe') { if (typeof SCARE_EV !== 'undefined' && !SCARE.ev) { const e = SCARE_EV.rush(); if (e) { SCARE.ev = e; SCARE.cool = 60; } else hauntSay('… 한 짝은 아직 신고 있어.'); } }
    else if (id === 'comb') { hauntSay('… 고마워.'); if (typeof sndCrack === 'function') sndCrack(0.2); }
    else if (id === 'photo') { HAUNT.vaultLock = Math.max(HAUNT.vaultLock || 0, 9); if (typeof sndBlack === 'function') sndBlack(false); hauntSay('… 그건 내 거야.'); }
    else { HAUNT.follow = Math.max(HAUNT.follow || 0, 10); HAUNT.followYaw = M.yaw; if (typeof hauntGlitch === 'function') hauntGlitch(); }
    if (typeof hauntRec === 'function' && ESC.found.size === 2) hauntRec('escitem');
  }, 700);
}
/** 초상 앞에 놓기 — 넷이 다 있어야 한다 */
function escapeOffer() {
  if (ESC.done) return;
  if (ESC.open) { toast('정문이 열렸다 — 현관으로!', 1600); return; }
  if (ESC.found.size < ESC_ITEMS.length) {
    toast('초상의 뭉개진 얼굴이 이쪽을 향해 있다. … 아직 모자라다 (' + ESC.found.size + ' / ' + ESC_ITEMS.length + ')', 2600);
    return;
  }
  ESC.open = true; ESC.runT = 60; ESC.chaseT = 4;
  // 얼굴이 또렷해지고 웃는다
  const P = typeof HAUNT !== 'undefined' && HAUNT.portrait;
  if (P && typeof portraitCanvas === 'function') { P.eyes = true; P.tex.image = portraitCanvas(true, 'p12', 'smile'); P.tex.needsUpdate = true; }
  if (typeof sndChime === 'function') sndChime(0);
  if (typeof scareScream === 'function') setTimeout(() => scareScream(0.5), 900);
  hauntPA('정문이 열렸습니다. … 서두르십시오. 그분이 배웅하러 나가십니다.', 2);
  toast('정문이 열렸다 — 60초 안에 현관 정문으로!', 3500);
  if (typeof hauntRec === 'function') hauntRec('escoffer');
}
function escapeSetup() {
  ESC.ready = true;
  ESC_ITEMS.forEach((def, k) => escapeItem(def, k));
  if (typeof vaultDoorShow === 'function') vaultDoorShow(true);
  // 이름 없는 초상 — 처음부터(얼굴이 뭉개져 있다) · 조사하면 물건을 놓는다
  if (typeof hauntPortrait === 'function' && !HAUNT.portrait) hauntPortrait();
  if (HAUNT.portrait) { HAUNT.portrait.info.onUse = () => escapeOffer(); HAUNT.portrait.info.label = '이름 없는 초상 — 물건을 놓는다'; }
  HAUNT.t = Math.max(HAUNT.t, 300); HAUNT.next = Math.min(HAUNT.next, 25);
  setTimeout(() => {
    if (typeof hauntPA === 'function') hauntPA('관람 시간이 끝났습니다. 모든 문을 잠갔습니다. … 그분이 잃어버린 것 네 가지를 돌려주시면, 문을 열어 드립니다.', 2);
    toast('방탈출 — 그 사람이 잃어버린 물건 넷을 찾아 명예의 전당 \'이름 없는 초상\' 앞에 놓아라 · 단서는 📝(J) · 15분', 7000);
  }, 1500);
  escapeChip();
}
function escapeChip() {
  let c = ESC.chip;
  if (!c) {
    c = ESC.chip = document.createElement('button'); c.id = 'escChip'; c.className = 'bgm-chip esc-chip';
    c.addEventListener('click', (ev) => { ev.stopPropagation(); escapeJournal(); });
    document.getElementById('gal').appendChild(c);
    const tm = ESC.timerEl = document.createElement('div'); tm.className = 'esc-timer'; document.getElementById('gal').appendChild(tm);
  }
  c.innerHTML = '<i class="ci">📝</i><span class="ct"> 그 사람의 물건 </span><em class="cb">' + ESC.found.size + '/4</em>'; c.setAttribute('aria-label', '그 사람의 물건');
}
function escapeJournal() {
  let w = document.getElementById('escJournal');
  if (w) { w.remove(); return; }
  w = document.createElement('div'); w.id = 'escJournal'; w.className = 'rec-panel';
  const rows = ESC_ITEMS.map((d, k) => ESC.found.has(k)
    ? '<li class="got"><b>' + d.icon + ' ' + d.name + '</b><span>찾았다</span></li>'
    : '<li><b>' + d.icon + ' ' + d.name + '</b><span>' + d.hint.replace(/\n/g, '<br>') + '</span></li>').join('');
  w.innerHTML = '<div class="rp-box"><p class="rp-k">방탈출 · 그 사람의 물건</p><h3>' + ESC.found.size + ' / 4 · 남은 시간 ' + escFmt(ESC.limit - ESC.t) + '</h3><ul class="esc-list">' + rows + '</ul>'
    + '<p class="rp-foot">' + (ESC.open ? '정문이 열렸다 — 현관 정문으로 달려라.' : '넷을 모두 찾으면 1층 명예의 전당, 이름 없는 초상(이젤) 앞에서 조사(E)해 놓는다. 물건은 어둠 속에서 희미하게 빛난다.') + '</p><button type="button" class="rp-x">닫기</button></div>';
  document.body.appendChild(w);
  w.addEventListener('click', (ev) => { if (ev.target === w || ev.target.classList.contains('rp-x')) w.remove(); });
}
function escapeEndCard(win) {
  ESC.done = true;
  const w = document.createElement('div'); w.id = 'hauntEnd'; w.className = 'haunt-end' + (win ? '' : ' dark'); document.getElementById('gal').appendChild(w);
  requestAnimationFrame(() => w.classList.add('on'));
  if (M.locked) document.exitPointerLock();
  M.openId = 'haunt-end';
  const used = ESC.t;
  let best = null;
  try { best = parseFloat(localStorage.getItem(ESC_BEST)) || null; if (win && (!best || used < best)) { localStorage.setItem(ESC_BEST, String(used)); best = used; } } catch (e) { /* */ }
  setTimeout(() => {
    const el = document.createElement('div'); el.id = 'hauntCard'; el.className = 'haunt-card' + (win ? '' : ' dark');
    el.innerHTML = win
      ? '<p class="hc-k">방탈출</p><h2>탈출 성공</h2><p>정문을 나서는 순간 등 뒤에서 누가 속삭였다. "다음에 또 와."</p>'
        + '<p class="hc-gb">걸린 시간 <em>' + escFmt(used) + '</em>' + (best ? ' · 이 기기 최고 기록 ' + escFmt(best) : '') + '</p>'
      : '<p class="hc-k">방탈출</p><h2>탈출 실패</h2><p>시간 안에 나가지 못했다.<br>수장고에 초상이 하나 늘었다.</p>'
        + '<p class="hc-gb">찾은 물건 <em>' + ESC.found.size + ' / 4</em></p>';
    el.innerHTML += '<div class="hc-b"><button type="button" data-a="again">다시 도전</button><button type="button" data-a="calm">조용히 둘러보기</button></div>';
    document.getElementById('gal').appendChild(el);
    el.addEventListener('click', (ev) => {
      const a = ev.target && ev.target.getAttribute && ev.target.getAttribute('data-a');
      if (a === 'again') location.reload(); else if (a === 'calm') { document.body.classList.remove('escape'); ESC.on = false; finaleCalm(); }
    });
  }, win ? 2600 : 3600);
}
function escapeWin() {
  if (typeof sndChime === 'function') sndChime(0);
  if (typeof hauntRec === 'function') hauntRec('escroom');
  if (typeof shadeHide === 'function') shadeHide();
  escapeEndCard(true);
}
function escapeLose() {
  NIGHT.black = { room: M.room && !M.room.outdoor ? M.room.id : 'foyer', t: 0, dur: 3.0, k: 1, on: false };
  HAUNT.blackShade = true;
  if (typeof sndBlack === 'function') sndBlack(false);
  setTimeout(() => hauntSay('… 시간이 다 됐어.'), 1200);
  escapeEndCard(false);
}
function stepEscape(dt) {
  if (!ESC.on || !M.ready || M.attract) return;
  if (!ESC.ready) escapeSetup();
  if (ESC.done) return;
  if (M.openId !== 'haunt-end') ESC.t += dt;                               // 읽는 동안에도 시간은 간다
  // 물건 빛 — 천천히 숨 쉰다
  for (const it of ESC.items) if (it && it.G.visible && it.G.userData.glow) it.G.userData.glow.material.opacity = 0.35 + 0.25 * Math.sin(ESC.t * 2.2 + it.G.position.x);
  let left = ESC.limit - ESC.t;
  if (ESC.open) {
    // 정문까지 — 60초 · 그 사람이 뒤에서 따라온다
    ESC.runT -= dt; left = Math.min(left, ESC.runT);
    const f = M.roomById.foyer;
    if (M.room && (M.room.id === 'foyer' || M.room.id === 'plaza') && M.pos.z * CM > f.z1 - 160) { escapeWin(); return; }
    ESC.chaseT -= dt;
    if (ESC.chaseT <= 0 && M.room && !M.room.outdoor && typeof shadeAt === 'function') {
      ESC.chaseT = 3.2;
      const bx = M.pos.x * CM + Math.sin(M.yaw) * 520, bz = M.pos.z * CM + Math.cos(M.yaw) * 520;      // 등 뒤 5m
      const r = pickRoom(bx, bz, M.feet, 80);
      if (r && !r.outdoor && !hitsWall(bx, bz, r.y0) && shadeAt(bx, bz, r)) { if (typeof scareRunSnd === 'function') scareRunSnd(bx / CM, bz / CM); }
    }
  }
  if (ESC.timerEl) { const s = escFmt(left); if (ESC.timerEl.textContent !== s) ESC.timerEl.textContent = s; ESC.timerEl.classList.toggle('late', left < 120 || ESC.open); }
  if (left <= 0) { escapeLose(); return; }
  // 밖으로 나가려 하면 — 현관으로(정문이 열리기 전에는)
  ESC.outT -= dt;
  if (!ESC.open && M.room && M.room.outdoor && ESC.outT <= 0) {
    ESC.outT = 4;
    if (typeof hauntGlitch === 'function') hauntGlitch();
    const r = M.roomById.foyer; teleport(r);
    M.feet = r.y0; M.eyeFeet = M.feet; M.pos.set(r.cx / CM, (M.feet + EYE) / CM, (r.z1 - 220) / CM); M.yaw = 0;
    if (typeof hauntPA === 'function') hauntPA('문은 모두 잠겨 있습니다. 그분의 물건을 찾으십시오.', 2);
  }
}
