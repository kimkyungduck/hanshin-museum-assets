/* ══════════════════════════════════════════════════════════
   관람객과의 대화 — 대화창 · 선택지 · 꺾이는 고개 (v115)
   ══════════════════════════════════════════════════════════
   회의(공포영화 감독 · 무대 설계자 · 게임 기획자)에서 정한 것:
     · 관람객을 조사(E)하면 상세 패널 대신 화면 아래 대화창 — 대사가 이어지고 선택지 2~3개(1 · 2 · 3 키 · 클릭). 하나는 늘 [떠난다]
       '살펴본다' 를 고르면 그 사람의 설명이 대화창 안에 나온다(패널로 넘어가지 않는다)
     · 고개는 평소엔 돌아가지 않는다. 대화 중의 두 순간에만 — '뚝, 뚝' 끊기며 빠르게 꺾인다
       ① '내 뒤를 보는' 순간: 같은 말을 한 번 더 하더니 고개가 내 어깨 너머로 꺾인다 → 다시 보면 활짝 웃으며 하던 말을 잇는다
       ② '아직 안 끝났잖아요': 밤이 깊을 때 떠나려 하면 붙잡는다 — 돌아서 걸어가는 나를 고개만 끝까지(목이 돌아갈 수 없는 데까지) 따라온다
       아껴 쓴다: 한 사람에 한 번, 밤에 세 번까지
     · 대화로만 얻는 밤의 기록 셋 · 방탈출 중엔 [이 쪽지 아세요?](한 사람은 거짓말을 한다)
     · 낮에는 평범한 잡담 */
const DLG = { open: false, n: null, node: null, el: null, typing: null, snaps: 0, staysLeft: 3, used: new Set(), turnLock: 0 };

/* ── 소리 — 목뼈 꺾이는 소리 ──────────────────────────────── */
function sndCrack(vol = 0.22) {
  const c = typeof SND !== 'undefined' && SND.ctx; if (!c || !SND.on) return;
  const t0 = c.currentTime + 0.005;
  for (const [dt, v] of [[0, 1], [0.075, 0.7]]) {
    const n = Math.floor(c.sampleRate * 0.03), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 6);
    const s = c.createBufferSource(); s.buffer = b;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500 + Math.random() * 900; bp.Q.value = 1.4;
    const g = c.createGain(); g.gain.value = vol * v; s.connect(bp); bp.connect(g);
    sndPanned(g, 0, 0.35); s.start(t0 + dt);
    const o = c.createOscillator(), og = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(110, t0 + dt); o.frequency.exponentialRampToValueAtTime(55, t0 + dt + 0.05);
    sndEnv(og, t0 + dt, 0.002, vol * v * 0.8, 0.06); o.connect(og); sndPanned(og, 0, 0.2); o.start(t0 + dt); o.stop(t0 + dt + 0.1);
  }
  if (typeof hapt === 'function') hapt([25, 50, 18]);
}
/** 고개 꺾기 — yaw(몸 기준, 라디안) · 끊기며 0.15초에 · hold 초 동안 그대로 */
function npcSnap(n, yaw, pitch, hold) {
  n.snap = { y: yaw, p: pitch || 0, t: 0, hold: hold || 2.5, from: n.hy || 0, fromP: n.hp || 0 };
  sndCrack();
}

/* ── 대사 — 밤 ───────────────────────────────────────────── */
function dlgNames() {
  const A = M.archive || {}, P = (A.players || []).filter((p) => p && p.name);
  const w = typeof recentWinner === 'function' ? recentWinner(A) : null;
  return { win: (w && w.name) || (P[0] && P[0].name) || '그분', any: (P[Math.floor(Math.random() * Math.max(1, P.length))] || {}).name || '그 회원' };
}
/** 대화 나무 — { 노드: { say, ch: [[글, 다음]], fx } }. 다음: 노드 이름 · 'leave' · 'look'(살펴본다) */
function dlgTree(n) {
  const N = dlgNames(), night = typeof NIGHT === 'undefined' || NIGHT.on;
  if (!night) {
    return { start: { say: pickOf([['안녕하세요. 구경 잘 하고 계세요?'], ['아, 안녕하세요.'], ['여기 처음 오셨어요?']])[0],
      ch: [['선수 이야기 해 주세요', 'talk'], ['살펴본다', 'look'], ['떠난다', 'leave']] },
      talk: { say: () => { const L = typeof crowdLines === 'function' ? crowdLines(n.room) : ['좋은 전시죠.']; return L.join(' '); }, ch: [['하나 더요', 'talk'], ['떠난다', 'leave']] } };
  }
  const trees = [
    { // 우승 트로피 — 기획자 예시
      start: { say: `이 트로피… ${N.win} 씨가 받은 거예요. 그다음 라운드엔 안 나오셨대요.`, ch: [['왜요?', 'b'], ['누구 얘기예요?', 'b2'], ['살펴본다', 'look'], ['떠난다', 'leave']] },
      b: { say: '글쎄요. 사진엔 계속 계시던데요.', ch: [['어느 사진이요?', 'c'], ['떠난다', 'leave']] },
      b2: { say: `${N.win} 씨요. 당신도 알잖아요.`, ch: [['… 모르는데요', 'c'], ['떠난다', 'leave']] },
      c: { say: '당신 회원이죠? 명단에서 본 얼굴인데.', ch: [['처음 왔어요', 'd'], ['… 그런가요?', 'd']] },
      d: { say: '처음 오신 분은 다들 그렇게 말해요.', fx: 'behind', ch: [['…', 'e'], ['떠난다', 'leave']] },
      e: { say: '그래서요, 어디까지 했죠? … 아, 사진. 사진은 당신 뒤에 있어요.', ch: [['떠난다', 'leave']] },
    },
    { // 세는 사람
      start: { say: '몇 명으로 보여요? 이 방에.', ch: [['두 명이요', 'b'], ['세 명이요', 'c'], ['살펴본다', 'look'], ['떠난다', 'leave']] },
      b: { say: '두 명. … 두 명. 이상하다. 저는 세 명으로 보이는데.', fx: 'behind', ch: [['누가 더 있어요?', 'd'], ['떠난다', 'leave']] },
      c: { say: '맞아요. 세 명. 한 명은 아까부터 당신 바로 뒤에 서 있어요.', fx: 'behind', ch: [['…', 'd'], ['떠난다', 'leave']] },
      d: { say: '아니에요. 잘못 봤어요. 제가 잘못 셌어요. 하나, 둘…', ch: [['떠난다', 'leave']] },
    },
    { // 이름
      start: { say: '이름이 뭐예요?', ch: [['말해 준다', 'b'], ['안 알려 줄래요', 'c'], ['살펴본다', 'look'], ['떠난다', 'leave']] },
      b: { say: '그 이름… 방명록에 벌써 있던데요. 어제 날짜로.', rec: 'name', ch: [['그럴 리가요', 'd'], ['떠난다', 'leave']] },
      c: { say: '괜찮아요. 곧 알게 돼요. 다 적히니까요.', ch: [['뭐가 적혀요?', 'd'], ['떠난다', 'leave']] },
      d: { say: '이름이요. 초상 아래 명패에. … 이름이 뭐예요?', fx: 'behind', ch: [['떠난다', 'leave']] },
    },
    { // 물 — 호수로 이끈다
      start: { say: '18번 홀 호수, 들어가 봤어요?', ch: [['네', 'b'], ['아니요', 'c'], ['살펴본다', 'look'], ['떠난다', 'leave']] },
      b: { say: '그럼 데려왔겠네요. 발이 젖어 있잖아요.', ch: [['뭘요?', 'd'], ['떠난다', 'leave']] },
      c: { say: '들어가지 마세요. 거기, 줄 서 있어요.', ch: [['누가요?', 'd'], ['떠난다', 'leave']] },
      d: { say: '다들요. 둑 위에서 내려다보면서 기다리는 사람들이요. 물속 사람이 올라오길.', fx: 'behind', ch: [['떠난다', 'leave']] },
    },
    { // 초상
      start: { say: `명예의 전당 초상 중에… ${N.any} 씨 초상, 눈 감고 있지 않았어요?`, ch: [['아니요, 뜨고 있었어요', 'b'], ['기억 안 나요', 'c'], ['살펴본다', 'look'], ['떠난다', 'leave']] },
      b: { say: '그럼 다행이다. 감고 있으면 안 되거든요. 감으면… 다른 데를 보러 간 거예요.', ch: [['어디를요?', 'd'], ['떠난다', 'leave']] },
      c: { say: '다시 보고 오세요. 지금쯤은 감고 있을 거예요.', ch: [['떠난다', 'leave']] },
      d: { say: '… 지금 보고 있는 데요.', fx: 'behind', ch: [['떠난다', 'leave']] },
    },
  ];
  const T = trees[(n.dlgI != null ? n.dlgI : (n.dlgI = Math.floor(Math.random() * trees.length)))] ;
  // 방탈출 — 쪽지를 들고 있으면
  if (typeof ESC !== 'undefined' && ESC.on && ESC.ready && ESC.found.size > 0 && !ESC.done) {
    T.start = Object.assign({}, T.start, { ch: [['이 쪽지 아세요?', 'note']].concat(T.start.ch) });
    T.note = { say: () => {
      const un = ESC.clues.map((c, k) => k).filter((k) => !ESC.found.has(k));
      const k = un.length ? pickOf(un) : pickOf([0, 1, 2, 3]);
      const liar = !!(n.info && n.info.room === 'theater');               // 상영관 사람은 거짓 숫자를 준다
      const d = liar ? (ESC.clues[k].d + 3) % 10 : ESC.clues[k].d;
      return (k + 1) + '번째 숫자요? … ' + d + '. ' + (liar ? '틀림없어요. 저는 거짓말 안 해요.' : '나머지는 직접 찾으세요.');
    }, ch: [['고마워요', 'leave'], ['정말이에요?', 'note2']] };
    T.note2 = { say: '… 저 여기 온 지 오래됐어요. 숫자는 안 변해요. 사람만 변하지.', ch: [['떠난다', 'leave']] };
  }
  return T;
}

/* ── 대화창 ──────────────────────────────────────────────── */
function dlgOpen(n) {
  if (DLG.open || !n) return;
  if (n.talk) crowdTalkEnd(n.talk);
  if (n.mono && n.mono.el) n.mono.el.remove(); n.mono = null;
  DLG.open = true; DLG.n = n; DLG.tree = dlgTree(n); DLG.relock = M.locked;
  M.openId = 'dlg';
  if (M.locked) document.exitPointerLock();
  if (!n.out) { n.state = 'notice'; n.noticeT = 9999; n.path = []; n.pause = 0; }
  else { n.state = 'look'; n.tgt = null; n.face = { x: M.pos.x * CM, z: M.pos.z * CM }; n.wait = 9999; if (n.role === 'kid') n.cool = 9999; }
  let el = DLG.el;
  if (!el) {
    el = DLG.el = document.createElement('div'); el.id = 'dlgBox'; el.className = 'dlg-box';
    el.innerHTML = '<p class="dlg-who"></p><p class="dlg-say"></p><div class="dlg-ch"></div>';
    document.getElementById('gal').appendChild(el);
    el.addEventListener('click', (ev) => { const b = ev.target.closest && ev.target.closest('button[data-i]'); if (b) dlgChoose(+b.dataset.i); });
    document.addEventListener('keydown', (ev) => {
      if (!DLG.open) return;
      if (/^[1-4]$/.test(ev.key)) { ev.preventDefault(); ev.stopPropagation(); dlgChoose(+ev.key - 1); }
      else if (ev.key === 'Escape' || ev.key.toLowerCase() === 'e') { ev.preventDefault(); ev.stopPropagation(); dlgChoose(-1); }
    }, true);
  }
  el.querySelector('.dlg-who').textContent = n.info ? n.info.label : '관람객';
  el.classList.add('on');
  dlgGo('start');
}
function dlgGo(id) {
  const T = DLG.tree, node = T[id], n = DLG.n;
  if (!node) { dlgClose(false); return; }
  DLG.node = node; DLG.nodeId = id;
  const say = typeof node.say === 'function' ? node.say() : node.say;
  DLG.sayText = say;
  const el = DLG.el, sayEl = el.querySelector('.dlg-say'), chEl = el.querySelector('.dlg-ch');
  chEl.innerHTML = '';
  clearInterval(DLG.typing);
  let i = 0; sayEl.textContent = '';
  if (typeof sndMurmur === 'function') sndMurmur(n, Math.min(4, 0.8 + say.length * 0.06), false);
  n.monoOn = true;
  DLG.typing = setInterval(() => {
    i++; sayEl.textContent = say.slice(0, i);
    if (i >= say.length) { clearInterval(DLG.typing); n.monoOn = false; dlgChoices(node); }
  }, 38);
  if (node.rec && typeof hauntRec === 'function') hauntRec(node.rec);
  // '내 뒤를 보는' 순간 — 말이 끝날 무렵 고개가 내 어깨 너머로 꺾인다
  if (node.fx === 'behind' && !DLG.used.has(n) && DLG.snaps < 3 && (typeof NIGHT === 'undefined' || NIGHT.on)) {
    DLG.used.add(n); DLG.snaps++;
    setTimeout(() => {
      if (!DLG.open || DLG.n !== n) return;
      const side = Math.random() < 0.5 ? 1 : -1;
      if (typeof scoreHush === 'function') scoreHush(4);
      npcSnap(n, side * 0.75, -0.18, 2.6);                                // 어깨 너머 · 조금 위
      if (typeof hauntRec === 'function') hauntRec('behind');
      DLG.behindT = performance.now();
      setTimeout(() => { if (n.snap) n.snap.hold = 0; n.smileFix = 1; setTimeout(() => { if (n.smileFix === 1) n.smileFix = null; }, 5000); }, 2600);
    }, Math.min(2600, say.length * 38 + 400));
  }
}
function dlgChoices(node) {
  const chEl = DLG.el.querySelector('.dlg-ch');
  chEl.innerHTML = node.ch.map((c, i) => '<button type="button" data-i="' + i + '"><b>' + (i + 1) + '</b>' + c[0] + '</button>').join('');
}
function dlgChoose(i) {
  if (!DLG.open) return;
  const node = DLG.node;
  if (DLG.typing && DLG.el.querySelector('.dlg-ch').children.length === 0) {
    // 아직 말하는 중 — 끝까지 바로 보여 준다
    clearInterval(DLG.typing); DLG.typing = null;
    const say = DLG.sayText || '';
    DLG.el.querySelector('.dlg-say').textContent = say; DLG.n.monoOn = false; dlgChoices(node);
    if (i < 0) return;
  }
  const c = i < 0 ? node.ch.find((q) => q[1] === 'leave') || ['', 'leave'] : node.ch[i];
  if (!c) return;
  if (c[1] === 'leave') { dlgLeave(); return; }
  if (c[1] === 'look') {
    const body = DLG.n.info && DLG.n.info.body ? DLG.n.info.body.split(String.fromCharCode(10)).filter(Boolean)[0] + ' ' + (DLG.n.info.body.split(String.fromCharCode(10)).filter(Boolean)[1] || '') : '';
    DLG.tree.__look = { say: '(' + body.trim() + ')', ch: [['말을 건다', 'start'], ['떠난다', 'leave']] };
    dlgGo('__look'); return;
  }
  dlgGo(c[1]);
}
/** 떠나기 — 밤이 깊으면 가끔 붙잡는다 */
function dlgLeave() {
  const n = DLG.n, dr = typeof HAUNT !== 'undefined' ? HAUNT.dread : 0;
  const night = typeof NIGHT === 'undefined' || NIGHT.on;
  if (night && !n.stayed && dr >= 0.45 && DLG.staysLeft > 0 && Math.random() < 0.6 && DLG.nodeId !== '__stay') {
    n.stayed = true; DLG.staysLeft--;
    if (typeof scoreHush === 'function') scoreHush(5);
    if (typeof SND !== 'undefined' && SND.master && SND.ctx) { const g = SND.master.gain, t = SND.ctx.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0.25, t + 0.3); g.linearRampToValueAtTime(SND.on ? 1 : 0, t + 4); }
    DLG.tree.__stay = { say: '아직 안 끝났잖아요.', ch: [['… 네.', 'start'], ['떠난다', 'leave']] };
    setTimeout(() => { if (DLG.open && DLG.n === n) npcSnap(n, 0, 0.05, 0.4); }, 650);
    if (typeof hauntRec === 'function') hauntRec('stay');
    n.snapTrack = 0;                                                        // 떠날 때 고개로 끝까지 따라온다(아래 dlgClose)
    n.willTrack = true;
    dlgGo('__stay'); return;
  }
  dlgClose(true);
}
function dlgClose(walkAway) {
  const n = DLG.n;
  clearInterval(DLG.typing);
  DLG.open = false; DLG.el.classList.remove('on');
  M.openId = null; M.keys = {};
  if (n) {
    n.monoOn = false;
    if (!n.out) { n.state = 'notice'; n.noticeT = 2.5; n.noticeCool = 40; }
    else { n.wait = 2; if (n.role === 'kid') n.cool = 20; }
    // '아직 안 끝났잖아요' 뒤에 떠나면 — 등 뒤로 고개가 끝까지 따라온다(뚝 · 뚝)
    if (walkAway && n.willTrack) { n.willTrack = false; n.snapTrack = 5; n.trackCracks = 0; if (!n.out) n.noticeT = 5.5; }
  }
  DLG.n = null;
  if (DLG.relock && M.renderer) { try { M.renderer.domElement.requestPointerLock(); } catch (e) { /* 클릭하면 다시 잠근다 */ } }
}
/** 매 프레임 — 대화 중엔 카메라가 그 사람 얼굴 쪽으로 천천히 */
function stepDlg(dt) {
  if (!DLG.open || !DLG.n) return;
  const n = DLG.n, r = M.roomById[n.room];
  const tx = n.x / CM, tz = n.z / CM, ty = (r.y0 + (n.fy || 0)) / CM + n.hM * 0.93;
  const want = Math.atan2(-(tx - M.pos.x), -(tz - M.pos.z));
  // '내 뒤를 보는' 동안엔 플레이어가 돌아볼 수 있게 카메라를 붙잡지 않는다
  if (DLG.behindT && performance.now() - DLG.behindT < 2600) { M.cam.rotation.set(M.pitch, M.yaw, 0, 'YXZ'); return; }
  M.yaw += npcAng(want - M.yaw) * Math.min(1, dt * 3);
  const d = Math.hypot(tx - M.pos.x, tz - M.pos.z) || 1;
  const wantP = Math.atan2(ty - M.pos.y, d);
  M.pitch += (wantP - M.pitch) * Math.min(1, dt * 3);
  if (d > 3.2) dlgClose(false);
  M.cam.rotation.set(M.pitch, M.yaw, 0, 'YXZ');                           // step() 이 멈춘 동안에도 시선은 돌린다
}
