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

/* ── 대사(v120) ─────────────────────────────────────────────
   사용자: "죄다 말이 다 똑같이 하는데". 잰 것(운영 데이터): 실내 7명 중 3명이 '전좌현 씨 아세요?'(쉬는 사람 이야기를 30% 우선),
   2명이 '이름이 뭐예요?' — 이야기를 사람마다 무작위로 뽑으면서 겹침을 막지 않았고, 낮엔 7명 모두 같은 인사였다.
   → 이야기마다 id 를 두고 **아직 아무도 맡지 않은 이야기**를 나눠 준다(dlgDeal). 밤 11가지 · 낮 8가지 — 실내 7명이 모두 다르다.
     쉬는 회원 이야기도 이제 한 사람만 한다. */
function dlgData() {
  const A = M.archive || {}, P = (A.players || []).filter((p) => p && p.name);
  const by = (f) => P.slice().sort((a, b) => f(b) - f(a))[0] || null;
  const w = typeof recentWinner === 'function' ? recentWinner(A) : null;
  const rounds = (A.rounds || []).slice().sort((a, b) => String(b.played_at).localeCompare(String(a.played_at)));
  const cnt = {}; for (const r of rounds) if (r.course) cnt[r.course] = (cnt[r.course] || 0) + 1;
  const cs = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
  const md = (s) => { const m = /^\d{4}-(\d{2})-(\d{2})/.exec(s || ''); return m ? (+m[1]) + '월 ' + (+m[2]) + '일' : '그날'; };
  const J = (wd, a, b) => (typeof josa === 'function' ? josa(wd, a, b) : a);
  return {
    P, J, md, w,
    r1: P.slice().sort((a, b) => (a.rank || 99) - (b.rank || 99))[0] || null,
    best: P.filter((p) => p.best).sort((a, b) => a.best - b.best)[0] || null,
    att: by((p) => p.roundsCompleted || 0), bird: by((p) => p.birdies || 0),
    course: cs ? cs[0] : null, courseN: cs ? cs[1] : 0,
    clip: (A.clips || []).find((c) => c.title && c.players) || (A.clips || []).find((c) => c.title) || null,
    any: (P[Math.floor(Math.random() * Math.max(1, P.length))] || {}).name || '그 회원',
  };
}
/** 아직 아무도 맡지 않은 이야기를 나눠 준다(모두 맡았으면 그때부터 겹친다) */
function dlgDeal(n, key, ids) {
  if (n[key] && ids.includes(n[key])) return n[key];
  const held = new Set((M.npcs || []).filter((o) => o !== n).map((o) => o[key]).filter(Boolean));
  const free = ids.filter((id) => !held.has(id));
  return (n[key] = pickOf(free.length ? free : ids));
}
const DLG_TALK = (n) => ({ say: () => { const L = typeof crowdLines === 'function' ? crowdLines(n.room) : ['좋은 전시죠.']; return L.join(' '); }, ch: [['하나 더요', 'talk'], ['떠난다', 'leave']] });
/** 대화 나무 — { 노드: { say, ch: [[글, 다음]], fx } }. 다음: 노드 이름 · 'leave' · 'look'(살펴본다) */
function dlgTree(n) {
  const D = dlgData(), night = typeof NIGHT === 'undefined' || NIGHT.on, f1 = (v) => (+v).toFixed(1);
  const RS = typeof restingList === 'function' ? restingList() : [];
  const rs = RS.length ? RS[(n.restI != null && n.restI < RS.length ? n.restI : (n.restI = Math.floor(Math.random() * RS.length)))] : null;
  const LV = [['살펴본다', 'look'], ['떠난다', 'leave']], TK = ['선수 이야기 더 해 주세요', 'talk'];
  if (!night) {
    // 낮 — 사람마다 다른 관심사(실제 기록으로)
    const T = {};
    if (D.r1 && D.r1.avgStrokes) T.fan = {
      start: { say: `${D.r1.name} 씨 팬이에요. 올해 1위잖아요.`, ch: [['평균이 몇 타예요?', 'b'], TK, ...LV] },
      b: { say: `${f1(D.r1.avgStrokes)}타요. 트로피실에 이름이 제일 많아요. 저도 언젠가 저렇게 쳐 보고 싶어요.`, ch: [TK, ['떠난다', 'leave']] } };
    if (D.course) T.course = {
      start: { say: `${D.course} 가 보셨어요? 여기 멤버들 거기만 ${D.courseN}번 갔대요.`, ch: [['어떤 코스예요?', 'b'], TK, ...LV] },
      b: { say: '그린이 빠르대요. 기록 보관실 스코어카드 보면 다들 퍼팅에서 고생했어요.', ch: [TK, ['떠난다', 'leave']] } };
    if (D.clip) T.clip = {
      start: { say: `'${D.clip.title}' 영상 보셨어요? 상영관에서 틀어 줘요.`, ch: [['재밌어요?', 'b'], TK, ...LV] },
      b: { say: (D.clip.players ? D.clip.players + ' 나오는 거요. ' : '') + '몇 번을 봐도 웃겨요. 댓글이 더 웃기고요.', ch: [TK, ['떠난다', 'leave']] } };
    if (D.best) T.best = {
      start: { say: `기록 보관실 가 보셨어요? ${D.best.name} 베스트가 ${D.best.best}타래요.`, ch: [['대단하네요', 'b'], TK, ...LV] },
      b: { say: '그날 퍼터가 불이었대요. 원본 스코어카드도 걸려 있어요. 사인까지요.', ch: [TK, ['떠난다', 'leave']] } };
    if (D.att) T.att = {
      start: { say: `${D.att.name} 씨가 라운드에 제일 많이 나왔대요. ${D.att.roundsCompleted}번이요.`, ch: [['개근상감이네요', 'b'], TK, ...LV] },
      b: { say: '진짜로 상을 줘야 해요. 명예의 전당에 초상도 있어요. 표정이 제일 편안해요.', ch: [TK, ['떠난다', 'leave']] } };
    if (D.w) T.win = {
      start: { say: `지난 라운드${D.w.round.course ? ' ' + D.w.round.course : ''}, ${D.w.name} 씨가 우승했대요.`, ch: [['몇 타였어요?', 'b'], TK, ...LV] },
      b: { say: (D.w.round.best != null ? D.w.round.best + '타요. ' : '') + '우승자의 방에 초상이 새로 걸렸어요. 가 보세요.', ch: [TK, ['떠난다', 'leave']] } };
    if (rs) T.rest = {
      start: { say: `${rs.name} 씨 소식 아세요? 요즘 쉬고 계세요.`, ch: [['어디 아프신 거예요?', 'b'], ['언제 돌아와요?', 'c'], ...LV] },
      b: { say: `아니요, 그냥 한동안 쉬신대요.${rs.last ? ' ' + rs.last + ' 라운드가 마지막이었어요.' : ''} 기록은 그대로 있어요.`, ch: [['언제 돌아와요?', 'c'], ['떠난다', 'leave']] },
      c: { say: `글쎄요.${rs.restDays ? ' 쉰 지 ' + rs.restDays + '일째인데,' : ''} 다들 기다려요. 돌아오시면 첫 라운드는 다 같이 나가기로 했어요.`, ch: [TK, ['떠난다', 'leave']] } };
    T.newbie = {
      start: { say: '저 오늘 처음 왔어요. 어디부터 보면 좋아요?', ch: [['트로피실이요', 'b1'], ['명예의 전당이요', 'b2'], ['18번 홀이요', 'b3'], ['떠난다', 'leave']] },
      b1: { say: '트로피실이요? 고마워요. 반짝이는 건 일단 다 봐야죠.', ch: [TK, ['떠난다', 'leave']] },
      b2: { say: '초상화가 있다던 데죠? 다들 진지한 얼굴이라던데, 궁금하네요.', ch: [TK, ['떠난다', 'leave']] },
      b3: { say: '밖에 진짜 홀이 있어요? 티샷도 칠 수 있대요? 가 봐야겠다.', ch: [TK, ['떠난다', 'leave']] } };
    const id = dlgDeal(n, 'dlgDay', Object.keys(T));
    const tr = T[id]; tr.talk = DLG_TALK(n);
    return tr;
  }
  const T = {
    trophy: { // 우승 트로피 — 기획자 예시
      start: { say: `이 트로피… ${(D.w && D.w.name) || D.any} 씨가 받은 거예요. 그다음 라운드엔 안 나오셨대요.`, ch: [['왜요?', 'b'], ['누구 얘기예요?', 'b2'], ...LV] },
      b: { say: '글쎄요. 사진엔 계속 계시던데요.', ch: [['어느 사진이요?', 'c'], ['떠난다', 'leave']] },
      b2: { say: `${(D.w && D.w.name) || D.any} 씨요. 당신도 알잖아요.`, ch: [['… 모르는데요', 'c'], ['떠난다', 'leave']] },
      c: { say: '당신 회원이죠? 명단에서 본 얼굴인데.', ch: [['처음 왔어요', 'd'], ['… 그런가요?', 'd']] },
      d: { say: '처음 오신 분은 다들 그렇게 말해요.', fx: 'behind', ch: [['…', 'e'], ['떠난다', 'leave']] },
      e: { say: '그래서요, 어디까지 했죠? … 아, 사진. 사진은 당신 뒤에 있어요.', ch: [['떠난다', 'leave']] },
    },
    count: { // 세는 사람
      start: { say: '몇 명으로 보여요? 이 방에.', ch: [['두 명이요', 'b'], ['세 명이요', 'c'], ...LV] },
      b: { say: '두 명. … 두 명. 이상하다. 저는 세 명으로 보이는데.', fx: 'behind', ch: [['누가 더 있어요?', 'd'], ['떠난다', 'leave']] },
      c: { say: '맞아요. 세 명. 한 명은 아까부터 당신 바로 뒤에 서 있어요.', fx: 'behind', ch: [['…', 'd'], ['떠난다', 'leave']] },
      d: { say: '아니에요. 잘못 봤어요. 제가 잘못 셌어요. 하나, 둘…', ch: [['떠난다', 'leave']] },
    },
    name: { // 이름
      start: { say: '이름이 뭐예요?', ch: [['말해 준다', 'b'], ['안 알려 줄래요', 'c'], ...LV] },
      b: { say: '그 이름… 방명록에 벌써 있던데요. 어제 날짜로.', rec: 'name', ch: [['그럴 리가요', 'd'], ['떠난다', 'leave']] },
      c: { say: '괜찮아요. 곧 알게 돼요. 다 적히니까요.', ch: [['뭐가 적혀요?', 'd'], ['떠난다', 'leave']] },
      d: { say: '이름이요. 초상 아래 명패에. … 이름이 뭐예요?', fx: 'behind', ch: [['떠난다', 'leave']] },
    },
    water: { // 물 — 호수로 이끈다
      start: { say: '18번 홀 호수, 들어가 봤어요?', ch: [['네', 'b'], ['아니요', 'c'], ...LV] },
      b: { say: '그럼 데려왔겠네요. 발이 젖어 있잖아요.', ch: [['뭘요?', 'd'], ['떠난다', 'leave']] },
      c: { say: '들어가지 마세요. 거기, 줄 서 있어요.', ch: [['누가요?', 'd'], ['떠난다', 'leave']] },
      d: { say: '다들요. 둑 위에서 내려다보면서 기다리는 사람들이요. 물속 사람이 올라오길.', fx: 'behind', ch: [['떠난다', 'leave']] },
    },
    portrait: { // 초상
      start: { say: `명예의 전당 초상 중에… ${D.any} 씨 초상, 눈 감고 있지 않았어요?`, ch: [['아니요, 뜨고 있었어요', 'b'], ['기억 안 나요', 'c'], ...LV] },
      b: { say: '그럼 다행이다. 감고 있으면 안 되거든요. 감으면… 다른 데를 보러 간 거예요.', ch: [['어디를요?', 'd'], ['떠난다', 'leave']] },
      c: { say: '다시 보고 오세요. 지금쯤은 감고 있을 거예요.', ch: [['떠난다', 'leave']] },
      d: { say: '… 지금 보고 있는 데요.', fx: 'behind', ch: [['떠난다', 'leave']] },
    },
    lost: { // 길 잃은 사람
      start: { say: '출구가 어디예요? 아까부터 계속 같은 방이에요.', ch: [['현관으로 가세요', 'b'], ['저도 몰라요', 'c'], ...LV] },
      b: { say: '현관이요? 거기서 왔어요. 현관에서 나가면… 다시 현관이에요.', ch: [['…', 'd'], ['떠난다', 'leave']] },
      c: { say: '다행이다. 저만 그런 줄 알았어요. … 그럼 우리 둘 다 못 나가는 거네요.', ch: [['…', 'd'], ['떠난다', 'leave']] },
      d: { say: '같이 다녀요, 그럼. 혼자 다니면 자꾸 사람이 늘어나요.', fx: 'behind', ch: [['떠난다', 'leave']] },
    },
  };
  if (D.best) T.card = {
    start: { say: `기록 보관실에 ${D.best.name} 씨 베스트 카드 있잖아요. ${D.best.best}타.`, ch: [['봤어요', 'b'], ['아직이요', 'c'], ...LV] },
    b: { say: '18번 홀 칸, 자세히 봤어요? 숫자가 두 개 겹쳐 적혀 있어요.', ch: [['누가 썼는데요?', 'd'], ['떠난다', 'leave']] },
    c: { say: '보지 마세요. 보면 빈칸에 당신 타수가 적혀요.', ch: [['…', 'd'], ['떠난다', 'leave']] },
    d: { say: `${D.best.name} 씨 글씨가 아니에요. 그날 같이 친 사람 글씨도 아니고요. … 지금 당신 뒤에서 쓰고 있는 글씨랑 같아요.`, fx: 'behind', ch: [['떠난다', 'leave']] },
  };
  if (D.clip) T.clip = {
    start: { say: `'${D.clip.title}' 영상, 끝까지 보셨어요?`, ch: [['네', 'b'], ['아니요', 'b'], ...LV] },
    b: { say: '마지막 장면에서 멈춰 보세요. 카메라를 보는 사람이 하나 더 있어요.', ch: [['누군데요?', 'c'], ['떠난다', 'leave']] },
    c: { say: (D.clip.players ? D.clip.players + ' 씨 바로 뒤에요. ' : '') + '웃는 얼굴인데… 눈은 안 웃어요.', fx: 'behind', ch: [['…', 'd'], ['떠난다', 'leave']] },
    d: { say: '방금 그 얼굴 했어요. 당신 어깨 너머로.', ch: [['떠난다', 'leave']] },
  };
  if (D.att) T.att = {
    start: { say: `${D.att.name} 씨는 ${D.att.roundsCompleted}번이나 나왔대요. 한 번도 안 빠지고.`, ch: [['대단하네요', 'b'], ['그게 왜요?', 'c'], ...LV] },
    b: { say: '어젯밤에도 왔대요. 라운드 없는 날인데.', ch: [['어디에요?', 'd'], ['떠난다', 'leave']] },
    c: { say: '세어 봤거든요. 스코어카드가 한 장 더 많아요.', ch: [['…', 'd'], ['떠난다', 'leave']] },
    d: { say: '18번 홀 티잉 구역이요. 아직 거기 서 있대요. 같이 칠 사람을 기다린대요.', fx: 'behind', ch: [['떠난다', 'leave']] },
  };
  if (D.course) T.course = {
    start: { say: `${D.course} 자주 가죠? 여기 사람들 거기만 ${D.courseN}번 갔대요.`, ch: [['좋은 코스라서요', 'b'], ['그게 왜요?', 'b'], ...LV] },
    b: { say: '갈 때마다 한 홀씩 길어진대요. 지난번엔 19번 홀까지 쳤대요.', ch: [['19번 홀이요?', 'c'], ['떠난다', 'leave']] },
    c: { say: '스코어카드에 칸이 있어요. 거기 적힐 이름은… 아직 안 정해졌대요.', fx: 'behind', ch: [['떠난다', 'leave']] },
  };
  if (rs) T.rest = { // v117 — 쉬는 사람(💤). 쉬다 보면 여기로 온다
    start: { say: `${rs.name} 씨 아세요? 요즘 쉬고 계세요.`, ch: [['어디 아프대요?', 'b'], ['언제부터요?', 'c'], ...LV] },
    b: { say: '아니요. 그냥 쉬는 거래요. … 쉬는 사람들은 다 그렇게 말해요.', ch: [['다들요?', 'd'], ['떠난다', 'leave']] },
    c: { say: (rs.last ? `마지막으로 친 게 ${rs.last} 라운드예요.` : '꽤 됐어요.') + ' 그 뒤로도 스코어카드엔 이름이 적혀요. 타수 칸은 비어 있고요.', ch: [['누가 적는데요?', 'd'], ['떠난다', 'leave']] },
    d: { say: '쉬다 보면 다들 여기로 와요. 조용하거든요. … 당신도 좀 쉬어 가실래요?', fx: 'behind', ch: [['… 아니요', 'e'], ['떠난다', 'leave']] },
    e: { say: `${rs.name} 씨가 그러는데, 여기서 오래 쉬면 돌아가는 길을 잊는대요. 그래서 아직 못 돌아온 거예요.`, rec: 'resting', ch: [['떠난다', 'leave']] },
  };
  const id = dlgDeal(n, 'dlgNight', Object.keys(T));
  // 한 번 쓴 나무를 고쳐 쓰지 않게 얕은 복사(방탈출 선택지를 덧붙인다)
  const tr = Object.assign({}, T[id]);
  // 방탈출 — 쪽지를 들고 있으면
  if (typeof ESC !== 'undefined' && ESC.on && ESC.ready && ESC.found.size > 0 && !ESC.done) {
    tr.start = Object.assign({}, tr.start, { ch: [['이 쪽지 아세요?', 'note']].concat(tr.start.ch) });
    tr.note = { say: () => {
      const un = ESC.clues.map((c, k) => k).filter((k) => !ESC.found.has(k));
      const k = un.length ? pickOf(un) : pickOf([0, 1, 2, 3]);
      const liar = !!(n.info && n.info.room === 'theater');               // 상영관 사람은 거짓 숫자를 준다
      const d = liar ? (ESC.clues[k].d + 3) % 10 : ESC.clues[k].d;
      return (k + 1) + '번째 숫자요? … ' + d + '. ' + (liar ? '틀림없어요. 저는 거짓말 안 해요.' : '나머지는 직접 찾으세요.');
    }, ch: [['고마워요', 'leave'], ['정말이에요?', 'note2']] };
    tr.note2 = { say: '… 저 여기 온 지 오래됐어요. 숫자는 안 변해요. 사람만 변하지.', ch: [['떠난다', 'leave']] };
  }
  return tr;
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
  /* v120 — 다시 잠그는 대상은 #gal 이어야 한다. 예전엔 캔버스(renderer.domElement)를 잠가서 커서는 사라졌는데
     M.locked(= pointerLockElement === gal)가 false 로 남아 → 마우스 시선이 먹지 않았다(사용자: "말을 걸고 다시 fps 컨트롤이 안 된다") */
  if (DLG.relock && typeof tryLock === 'function') tryLock(document.getElementById('gal'));
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
