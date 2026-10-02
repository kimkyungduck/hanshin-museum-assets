/* ══════════════════════════════════════════════════════════
   방탈출 — 잠긴 전시관(v114)
   ══════════════════════════════════════════════════════════
   표지 '🔐 방탈출' 로 시작한다(밤에만). 문이 모두 잠긴다 — 15분 안에 비밀번호 네 자리를 찾아 현관 번호판에 넣어야 나간다.
     · 쪽지 네 장 — 그랜드 홀 · 명예의 전당 · 상영관 · 기록 보관실에 하나씩. 쪽지마다 '다른 방의 전시물' 을 가리킨다
       (명예의 전당 초상의 우승 횟수 · 트로피실 명패의 버디 수 · 기록 보관실 스코어카드 장수 · 수장고 초상의 날짜) — 답은 실제 기록에서 나온다
     · 📝 쪽지 칩(J 키) — 찾은 쪽지를 다시 본다
     · 번호판 — 틀리면 30초가 깎이고 불이 한 번 꺼진다. 맞으면 정문이 열린다
     · 밖으로 나가려 하면 현관으로 되돌아온다 · 시간이 다 되면 —
   기록: 이 기기의 최고 기록(localStorage museum-escape-best) */
const ESC = { on: false, ready: false, t: 0, limit: 900, clues: [], found: new Set(), pad: '', done: false, outT: 0, chip: null, timerEl: null };
const ESC_BEST = 'museum-escape-best';
const escFmt = (s) => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

function escapeStart() {
  ESC.on = true;
  document.body.classList.add('escape');
  if (typeof enter === 'function') enter();
}
/** 단서 — 실제 전시물에서. 쓸 수 있는 것이 없으면 '세어 보기' 로 */
function escapeClues() {
  const num = (s) => { const m = /(\d+)/.exec(String(s)); return m ? +m[1] : null; };
  const stat = (e, k) => { const r = (e.stats || []).find((q) => q[0] === k); return r ? num(r[1]) : null; };
  const out = [];
  // 1 — 명예의 전당 초상 · 우승
  const por = M.exhibits.filter((e) => e.room === 'hall' && e.type === 'portrait' && stat(e, '우승') != null);
  if (por.length) { const e = pickOf(por); out.push({ d: stat(e, '우승') % 10, text: '명예의 전당 — ' + e.title + '의 초상.\n그 사람의 \'우승\' 횟수.' }); }
  else { const n = M.exhibits.filter((e) => e.room === 'hall' && e.node && e.no).length; out.push({ d: n % 10, text: '명예의 전당의 소장품(번호가 붙은 것)은 모두 몇 점인가.\n그 끝자리.' }); }
  // 2 — 트로피실 명패 · 버디
  const tro = M.exhibits.filter((e) => e.room === 'trophy' && stat(e, '버디') != null);
  if (tro.length) { const e = pickOf(tro); out.push({ d: stat(e, '버디') % 10, text: '트로피실 — ' + (e.title || e.label) + '.\n적힌 \'버디\' 수의 끝자리.' }); }
  else { const n = M.exhibits.filter((e) => e.room === 'trophy' && e.node && e.no).length; out.push({ d: n % 10, text: '트로피실의 소장품(번호가 붙은 것)은 모두 몇 점인가.\n그 끝자리.' }); }   // 안내판 · 소품은 빼고
  // 3 — 기록 보관실 스코어카드 장수
  const sc = M.exhibits.filter((e) => e.room === 'archive' && e.card && e.node).length;
  out.push({ d: sc % 10, text: '기록 보관실 벽에 걸린 스코어카드는 모두 몇 장인가.\n그 끝자리.' });
  // 4 — 수장고, 오늘 날짜의 초상
  out.push({ d: new Date().getDate() % 10, text: '수장고 동쪽 벽, 아직 걸리지 않은 초상.\n명패에 적힌 날짜의 \'일\' — 그 끝자리.\n(수장고는 명예의 전당 서쪽 벽의 문)' });
  return out;
}
/** 쪽지 하나 — 작은 받침대 위 종이(어둠 속에서 희미하게 보인다) */
function escapeNote(roomId, k, clue) {
  const r = M.roomById[roomId], g = M.roomGroups[roomId]; if (!r || !g) return false;
  let spot = null;
  for (let t = 0; t < 40 && !spot; t++) {
    const x = r.x0 + 200 + Math.random() * (r.w - 400), z = r.z0 + 200 + Math.random() * (r.d - 400);
    if (hitsWall(x, z, r.y0) || M.exhibits.some((e) => e.room === roomId && Math.hypot(e.x - x, e.z - z) < 220)) continue;
    if ((M.npcs || []).some((n) => n.room === roomId && Math.hypot(n.x - x, n.z - z) < 150)) continue;
    spot = { x, z };
  }
  if (!spot) spot = { x: r.cx + 120, z: r.cz + 120 };
  const cv = makeCanvas(256, 180), c = cv.getContext('2d');
  c.fillStyle = '#E8DFC8'; c.fillRect(0, 0, 256, 180);
  c.fillStyle = 'rgba(120,90,60,.25)'; for (let i = 0; i < 6; i++) c.fillRect(0, 40 + i * 22, 256, 1);
  c.fillStyle = '#5A1E18'; c.font = 'bold 34px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('쪽지 ' + (k + 1), 128, 70);
  c.font = '22px serif'; c.fillText('― ' + (k + 1) + ' / 4 ―', 128, 120);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const G = new THREE.Group(); G.position.set(spot.x / CM, 0, spot.z / CM); G.rotation.y = Math.random() * 6.28;
  const ped = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.95, 0.34), new THREE.MeshStandardMaterial({ color: 0x2A2420, roughness: 0.8 }));
  ped.position.y = 0.475; ped.material.envMap = M.envIn; ped.material.envMapIntensity = 0.3; G.add(ped);
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.2), new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(0.55, 0.52, 0.46) }));
  paper.rotation.x = -Math.PI / 2 + 0.25; paper.position.y = 0.97; G.add(paper);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.3, 0.6), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 0.65; G.add(hit);
  g.add(G);
  M.walls.push({ x0: spot.x - 22, x1: spot.x + 22, z0: spot.z - 22, z1: spot.z + 22, y0: r.y0, y1: r.y0 + 100 });
  const info = { id: 'esc-note-' + k, type: 'placard', icon: '📝', label: '쪽지 ' + (k + 1), title: '쪽지 ' + (k + 1) + ' / 4', subtitle: '비밀번호의 ' + (k + 1) + '번째 숫자',
    room: roomId, x: spot.x, z: spot.z, y: 97, body: clue.text, onOpen: () => escapeFound(k) };
  M.pickables.push(hit); M.artByMesh.set(hit, info);
  return true;
}
function escapeFound(k) {
  if (ESC.found.has(k)) return;
  ESC.found.add(k);
  escapeChip();
  if (typeof toast === 'function') toast('쪽지 ' + (k + 1) + ' 을 찾았다 (' + ESC.found.size + ' / 4) — 📝 칩 · J 키로 다시 본다', 2600);
}
/** 번호판 — 현관, 정문 옆 */
function escapeKeypad() {
  const r = M.roomById.foyer, g = M.roomGroups.foyer; if (!r || !g) return;
  const x = r.cx + 360, z = r.z1 - 140;
  const G = new THREE.Group(); G.position.set(x / CM, 0, z / CM); G.rotation.y = Math.PI;
  const metal = new THREE.MeshStandardMaterial({ color: 0x3A3C40, roughness: 0.4, metalness: 0.7 }); metal.envMap = M.envIn; metal.envMapIntensity = 0.5;
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.25, 0.16), metal); post.position.y = 0.625; G.add(post);
  const cv = makeCanvas(256, 320), c = cv.getContext('2d');
  c.fillStyle = '#0B0F0C'; c.fillRect(0, 0, 256, 320);
  c.fillStyle = '#7CE08A'; c.font = 'bold 40px monospace'; c.textAlign = 'center'; c.fillText('_ _ _ _', 128, 70);
  c.fillStyle = '#C9C2B4'; c.font = 'bold 30px sans-serif';
  [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', '']].forEach((row, ri) => row.forEach((d, ci) => { if (d) c.fillText(d, 58 + ci * 70, 150 + ri * 48); }));
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.375), new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(0.8, 0.8, 0.8) }));
  face.position.set(0, 1.0, 0.081); G.add(face);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.5, 0.6), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 0.75; G.add(hit);
  g.add(G);
  M.walls.push({ x0: x - 25, x1: x + 25, z0: z - 15, z1: z + 15, y0: r.y0, y1: r.y0 + 130 });
  const info = { id: 'esc-pad', type: 'placard', icon: '🔢', label: '비밀번호', title: '정문 비밀번호', room: 'foyer', x, z, y: 100, onUse: () => escapePad() };
  M.pickables.push(hit); M.artByMesh.set(hit, info);
  ESC.padPos = { x, z };
}
function escapeSetup() {
  ESC.ready = true;
  ESC.clues = escapeClues();
  const rooms = ['grand', 'hall', 'theater', 'archive'];
  ESC.clues.forEach((cl, k) => escapeNote(M.roomById[rooms[k]] ? rooms[k] : 'grand', k, cl));
  escapeKeypad();
  if (typeof vaultDoorShow === 'function') vaultDoorShow(true);
  HAUNT.t = Math.max(HAUNT.t, 300); HAUNT.next = Math.min(HAUNT.next, 25);
  setTimeout(() => {
    if (typeof hauntPA === 'function') hauntPA('관람 시간이 끝났습니다. 모든 문을 잠갔습니다. … 비밀번호를 아시는 분만 나가실 수 있습니다.', 2);
    toast('방탈출 — 쪽지 네 장을 찾아 현관 번호판에 비밀번호 네 자리를 넣어라 · 15분', 6000);
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
  c.textContent = '📝 쪽지 ' + ESC.found.size + '/4';
}
function escapeJournal() {
  let w = document.getElementById('escJournal');
  if (w) { w.remove(); return; }
  w = document.createElement('div'); w.id = 'escJournal'; w.className = 'rec-panel';
  const rows = ESC.clues.map((cl, k) => ESC.found.has(k)
    ? '<li class="got"><b>쪽지 ' + (k + 1) + '</b><span>' + cl.text.replace(/\n/g, '<br>') + '</span></li>'
    : '<li><b>쪽지 ' + (k + 1) + '</b><span>아직 못 찾았다</span></li>').join('');
  w.innerHTML = '<div class="rp-box"><p class="rp-k">방탈출</p><h3>쪽지 ' + ESC.found.size + ' / 4 · 남은 시간 ' + escFmt(ESC.limit - ESC.t) + '</h3><ul class="esc-list">' + rows + '</ul>'
    + '<p class="rp-foot">쪽지 순서대로 숫자를 이어 붙이면 비밀번호. 번호판은 현관 정문 옆.</p><button type="button" class="rp-x">닫기</button></div>';
  document.body.appendChild(w);
  w.addEventListener('click', (ev) => { if (ev.target === w || ev.target.classList.contains('rp-x')) w.remove(); });
}
/** 번호판 화면 */
function escapePad() {
  if (ESC.done) return;
  ESC.pad = '';
  if (M.locked) document.exitPointerLock();
  M.openId = 'esc-pad';
  const w = document.createElement('div'); w.id = 'escPad'; w.className = 'esc-pad';
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '←', '0', '확인'];
  w.innerHTML = '<div class="ep-box"><p class="ep-k">정문 비밀번호</p><div class="ep-scr">_ _ _ _</div><div class="ep-keys">'
    + keys.map((k) => '<button type="button" data-k="' + k + '">' + k + '</button>').join('') + '</div><button type="button" class="ep-x">닫기</button></div>';
  document.body.appendChild(w);
  const scr = w.querySelector('.ep-scr');
  const show = () => { scr.textContent = (ESC.pad + '____').slice(0, 4).split('').join(' '); };
  const close = () => { w.remove(); document.removeEventListener('keydown', onKey, true); M.openId = null; M.keys = {}; };
  const press = (k) => {
    if (k === '←') ESC.pad = ESC.pad.slice(0, -1);
    else if (k === '확인') { if (ESC.pad.length === 4) { const ok = escapeTry(ESC.pad); close(); if (!ok) return; } return; }
    else if (/^\d$/.test(k) && ESC.pad.length < 4) { ESC.pad += k; if (typeof torchClick === 'function') torchClick(); }
    show();
  };
  const onKey = (ev) => {
    if (/^\d$/.test(ev.key)) press(ev.key); else if (ev.key === 'Backspace') press('←'); else if (ev.key === 'Enter') press('확인'); else if (ev.key === 'Escape') close();
    ev.stopPropagation(); ev.preventDefault();
  };
  document.addEventListener('keydown', onKey, true);
  w.addEventListener('click', (ev) => { const k = ev.target.getAttribute && ev.target.getAttribute('data-k'); if (k) press(k); else if (ev.target.classList.contains('ep-x') || ev.target === w) close(); });
}
function escapeTry(code) {
  const want = ESC.clues.map((c) => c.d).join('');
  if (code === want) { escapeWin(); return true; }
  ESC.t += 30;
  if (typeof sndBlack === 'function') sndBlack(false);
  if (typeof hauntGlitch === 'function') hauntGlitch();
  if (M.room && !M.room.outdoor && !NIGHT.black) NIGHT.black = { room: M.room.id, t: 0, dur: 1.1, k: 1, on: false };
  setTimeout(() => hauntSay('… 틀렸어.'), 600);
  toast('번호가 틀렸다 — 30초가 줄었다', 2200);
  return false;
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
      ? '<p class="hc-k">방탈출</p><h2>탈출 성공</h2><p>정문이 열렸다. 등 뒤에서 누군가 아쉬워하는 소리가 났다.</p>'
        + '<p class="hc-gb">걸린 시간 <em>' + escFmt(used) + '</em>' + (best ? ' · 이 기기 최고 기록 ' + escFmt(best) : '') + '</p>'
      : '<p class="hc-k">방탈출</p><h2>탈출 실패</h2><p>시간 안에 나가지 못했다.<br>수장고에 초상이 하나 늘었다.</p>'
        + '<p class="hc-gb">비밀번호는 <em>' + ESC.clues.map((c) => c.d).join('') + '</em> 였다.</p>';
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
  if (M.openId !== 'haunt-end') ESC.t += dt;                               // 쪽지를 읽는 동안에도 시간은 간다
  const left = ESC.limit - ESC.t;
  if (ESC.timerEl) { const s = escFmt(left); if (ESC.timerEl.textContent !== s) ESC.timerEl.textContent = s; ESC.timerEl.classList.toggle('late', left < 120); }
  if (left <= 0) { escapeLose(); return; }
  // 밖으로 나가려 하면 — 현관으로
  ESC.outT -= dt;
  if (M.room && M.room.outdoor && ESC.outT <= 0) {
    ESC.outT = 4;
    if (typeof hauntGlitch === 'function') hauntGlitch();
    const r = M.roomById.foyer; teleport(r);
    M.feet = r.y0; M.eyeFeet = M.feet; M.pos.set(r.cx / CM, (M.feet + EYE) / CM, (r.z1 - 220) / CM); M.yaw = 0;
    if (typeof hauntPA === 'function') hauntPA('문은 모두 잠겨 있습니다. 비밀번호를 찾으십시오.', 2);
  }
}
