/* ══════════════════════════════════════════════════════════
   관람객 무리 — 방을 옮겨 다니고, 마주치면 대화하고, 서로 비켜 지나간다(v91)
   ══════════════════════════════════════════════════════════
   예전 관람객은 제 방 안의 전시물 사이만 오갔다(일곱 명이 각자 방 하나씩 — 서로 만날 일이 없었다).
     · 길 — 같은 층 실내 방을 잇는 문 · 트인 경계를 그래프로 만든다. 문 앞(안쪽 80cm) → 문 가운데 → 건너편 80cm
     · 대화 — 같은 방에서 둘 다 전시를 보고 있으면 가끔 서로에게 다가가 1.1m 앞에서 마주 선다.
       말하는 사람은 팔을 들어 손짓하고, 듣는 사람은 고개를 끄덕인다. 번갈아 말한다.
       가까이(9m) 가면 말풍선이 뜬다 — 버디버디 회원들이 할 법한 이야기
     · 비켜 가기 — 걷는 사람끼리(그리고 나와) 1.2m 안으로 들어오면 옆으로 비켜 지나간다
   손짓 · 끄덕임은 애니메이션 클립 위에 뼈를 월드 축으로 조금 더 돌려 얹는다(클립을 다시 굽지 않는다). */

const CROWD = { graph: null, t: 0, pairT: 0 };
/* v96 — 호러로 천천히. 처음엔 평범한 잡담처럼 시작해서 마지막 한 마디가 어긋난다(피 · 비명 없이, 이상한 것만) */
const TALKS = [
  ['이 사진, 어제는 사람이 한 명 적지 않았어?', '아니. 원래 열세 명이야.', '… 우린 열두 명이었잖아.'],
  ['18번 홀 호수 바닥에 공이 많대.', '공만 있는 게 아니래.', '가끔 누가 올라오고 싶어 한대.'],
  ['너 여기 언제 들어왔어?', '글쎄… 문 닫을 때쯤?', '여긴 문을 닫은 적이 없는데.'],
  ['출구가 어느 쪽이었지?', '들어온 쪽.', '들어온 쪽이 없어졌어.'],
  ['저 초상, 눈이 계속 따라오지 않아?', '초상은 원래 그래.', '저건 초상이 아니야.'],
  ['오늘 관람객 몇 명이야?', '우리 둘. 그리고 저 사람.', '저 사람은 관람객이 아니야.'],
  ['스코어카드에 내 이름이 있어.', '너 그날 안 나왔잖아.', '응. 그런데 18홀을 다 쳤대.'],
  ['여기 조명 좀 어둡지 않아?', '아까보다 한 칸 꺼졌어.', '다음 칸이 꺼지면 우리 차례래.'],
  ['카트가 혼자 돌아다니던데.', '밤마다 그래. 한 바퀴씩.', '누굴 태우러 가는 걸까.'],
  ['방금 누가 내 이름 불렀어.', '여긴 이름을 기록하지 않아.', '그러니까. 누가 불렀냐고.'],
  ['우리 몇 바퀴째 돌고 있지?', '세지 마.', '세면 못 나간대.'],
  ['밖에 애들 봤어?', '정원에서 노는 애들?', '… 여기 애들 데려온 사람 없어.'],
  ['이 트로피, 뒷면에 이름이 하나 더 있어.', '긁어서 지운 거야.', '지운 사람도 벽에 걸려 있대.'],
  ['쉿. 들려?', '분수 소리잖아.', '분수는 아까 멈췄어.'],
  ['저 액자 속 사람, 방금 웃지 않았어?', '웃는 사진이잖아.', '아까는 안 웃고 있었어.'],
  ['카트길 따라 걸어 봤어?', '끝까지 가면 다시 여기야.', '몇 번을 가도 여기야.'],
  ['너 그림자 어디 갔어?', '조명 때문이겠지.', '… 조명은 위에 있잖아.'],
  ['방명록에 이름 쓸래?', '쓰면 어떻게 되는데?', '안 나가도 돼.'],
  ['조명탑 하나가 자꾸 깜빡여.', '누가 신호 보내는 거래.', '누구한테?'],
  ['아까 그 사람, 너랑 똑같이 생겼더라.', '내가 여기 있는데?', '그러니까 이상하다는 거야.'],
  ['이 방 원래 이렇게 길었나?', '걸을수록 길어져.', '돌아가지 마. 더 길어져.'],
  ['밤인데 왜 이렇게 사람이 많지.', '다 관람객이야.', '… 입장권 산 사람은 없대.'],
  ['너 몇 타 쳤어?', '기억 안 나.', '다들 그래. 여기 오면.'],
  ['여기 사진 찍어도 돼?', '찍어도 돼. 나중에 보지만 마.', '… 왜 다들 한 명씩 더 찍혀 있어?'],
  ['분수 소리 들려?', '아니, 안 들려.', '그럼 저건 무슨 소리야.'],
  ['네가 먼저 들어왔어, 내가 먼저 들어왔어?', '… 우리 같이 왔잖아.', '난 혼자 왔는데.'],
];
/* 혼잣말(v96) — 방 구석을 보고 서서 중얼거린다. 말풍선이 아니라 흐린 글씨로 */
const MONO = [
  ['여기가… 몇 번 홀이었더라.', '공을 찾아야 돼.', '공을 찾으면 보내 준댔어.'],
  ['하나, 둘, 셋… 넷.', '또 하나 많네.', '다시. 하나, 둘…'],
  ['나는 관람객이야.', '관람객이야.', '소장품이 아니야.'],
  ['문이 여기 있었는데.', '분명히 여기 있었는데.'],
  ['조용히 해.', '초상들이 듣고 있어.'],
  ['18번 다음이… 또 1번이야.', '또 1번.'],
  ['그 사람도 처음엔 구경만 했대.', '지금은 벽에 걸려 있어.'],
  ['웃으면 안 돼.', '웃으면 액자에 들어가.'],
  ['멀리건 한 번만.', '한 번만 더 치면 돼.', '한 번만…'],
  ['불 끄지 마세요.', '아직 안에 있어요.'],
  ['이 방 불은 누가 꺼요?', '… 아무도 안 끄면.'],
  ['내 차례가 언제였더라.', '티샷… 티샷을 해야 되는데.'],
  ['사진 속 내가 먼저 웃었어.', '나는 안 웃었는데.'],
  ['괜찮아.', '괜찮아.', '아무도 안 봐.'],
  ['아까 그 애들, 이름이 뭐였지.', '물어보면 안 됐는데.'],
  ['공이 안 보여.', '공이… 호수 밑에.', '거기 다들 있어.'],
  ['여기 있으면 따뜻해.', '벽 안은 따뜻해.'],
  ['스코어를 줄여 줄게.', '대신 한 홀만 더 치자.'],
];
/* 바깥 사람들 — 광장 · 연습 그린 · 아이들 */
const MONO_OUT = {
  plaza: [['분수에 동전 던지지 마세요.', '누가 주우러 들어가요.'], ['버스가 안 와.', '몇 년째 안 와.'], ['정문은 들어오는 문이에요.', '나가는 문은 따로 있어요.', '아무도 못 찾았지만.'],
    ['분수 바닥에 뭐가 반짝여.', '동전 아니야. 눈이야.'], ['깃발이 바람 반대로 날려.']],
  practice: [['들어가라…', '들어가라…', '… 왜 안 들어가.'], ['컵이 하나 늘었어.', '어제는 넷이었는데.'], ['이 공, 내 거 아니야.', '누가 자꾸 놓고 가.'],
    ['컵 안에서 소리가 나.', '누가 부르는 것 같아.'], ['한 뼘이면 들어가.', '한 뼘만 더 가까이.']],
  kid: [['술래는 저 아저씨야.'], ['엄마가 여기서 기다리랬어.'], ['쉿. 뒤에 있어.'], ['공 주워 줄까? 호수 밑에 많아.'], ['숨바꼭질 하자. 못 찾으면 계속 숨는 거야.'], ['(키득키득)'],
    ['아저씨 발소리 되게 커.'], ['우리 엄마도 여기 걸려 있어.'], ['밤엔 호수에서 소리 나.'], ['(흥얼흥얼)'], ['하나, 둘, 셋… 다 숨었니?']],
  near: [['아저씨도 여기 살아?'], ['같이 놀래?'], ['찾았다.'], ['아저씨 이름 뭐야? … 곧 까먹을 텐데.'], ['잡았다—'], ['아저씨 뒤에 누구야?']],
  stranger: [['… 안녕하세요.', '처음 오셨죠.', '다들 처음엔 그래요.'], ['여기 오래 계시면 안 돼요.', '저처럼 돼요.'],
    ['정문으로 나가시려고요?', '… 행운을 빌어요.'], ['저 조명탑, 하나씩 꺼지면 끝나요.', '뭐가 끝나냐고요? 글쎄요.']],
};
/* v99 — 나와 마주쳤을 때 · 말을 걸었을 때 · 대화를 엿들었을 때 */
const NEAR_IN = [
  ['아… 죄송해요. 사람인 줄 몰랐어요.'], ['여기, 처음 오셨죠?'], ['그쪽도 길을 잃으셨어요?'], ['쉿. 지금은 보면 안 돼요.'],
  ['너무 가까이 오지 마세요.'], ['… 저 아세요?', '이상하다. 전 그쪽 아는데.'], ['출구 찾으세요? 저도요.', '벌써 몇 바퀴째인지.'],
  ['걸음 소리가 두 개였어요. 방금.'], ['그 사진 보셨어요? 그쪽 닮았던데.'], ['여기서 눈 마주치면 안 된대요.'],
  ['아까도 지나가셨잖아요. 똑같은 걸음으로.'], ['몇 시예요? … 아, 여긴 시계가 없죠.'], ['괜찮아요. 저도 처음엔 무서웠어요.'], ['…', '(아무 말 없이 한참을 본다)'],
];
const MONO_CAUGHT = [['… 뒤에 계신 거 알아요.'], ['돌아보면 안 되는데.'], ['방금 제 말, 들으셨어요?'], ['아니에요. 혼잣말이에요. 혼잣말.']];
const INTERRUPT = ['… 들었어요?', '아, 그쪽 얘기 한 거 아니에요.', '쉿. 저 사람이야.', '이따 얘기하자. 누가 들어.',
  '같이 들으실래요? 끝까지 들으면 못 나가요.', '… 방금 그 얘기, 잊어 주세요.'];
const ASK = [
  ['네?'], ['저요? 그냥 보고 있었어요.', '이 그림이 자꾸 저를 봐서요.'], ['말 걸지 마세요.', '세고 있었는데 잊어버렸잖아요.'],
  ['이름이요? … 기억이 안 나요.', '여기 오래 있으면 그래요.'], ['관람객이에요. 아직은.'], ['출구요? 저쪽… 아니, 이쪽이었나.'],
  ['그쪽은 언제 왔어요?', '아니, 대답하지 마세요.'], ['지금 몇 명 보여요?', '… 저는 한 명 더 보이는데.'], ['조용히 해요. 여기 소리가 울려요.'],
  ['18번 홀에 가 봤어요?', '밤에는 가지 마요.'], ['우리 전에 만난 적 있죠.', '그때도 이렇게 물었어요.'],
];
const ASK_MUTTER = [['…', '(대답 대신 계속 중얼거린다)'], ['하나, 둘… 아, 또 틀렸잖아요.'], ['방해하지 마세요.', '거의 다 셌어요.']];
const ASK_KID = [['아저씨 술래야?'], ['엄마 못 봤어요?'], ['같이 놀자. 아무도 안 놀아 줘.'], ['쉿— 숨는 중이야.'], ['아저씨 그림자 이상해.']];
/* 한 줄 중얼거림 — 누구나 가끔, 걷다 멈췄을 때 */
const MONO_SHORT = ['… 추워.', '여기 아까 왔던 데 아니야?', '(한숨)', '또 이 방이네.', '누가 부른 것 같은데.', '시계가 멈췄어.',
  '발소리… 내 거 맞나.', '저 액자, 아까는 없었는데.', '조금만 더 있다 가자.', '(작게 흥얼거린다)', '안 돌아볼 거야.', '불 좀 켜 주세요.'];
/* 방마다 나오는 괴담 */
const ROOM_TALKS = {
  portraits: [['초상이 하나 늘었어.', '누군데?', '아직 얼굴이 안 그려졌어.'], ['저 초상 눈 좀 봐.', '눈이 왜?', '방금 깜빡였어.']],
  photos: [['이 사진 뒷줄 끝에 누구야?', '흐려서 안 보여.', '어제보다 조금 선명해졌어.'], ['사진마다 같은 사람이 있어.', '회원이겠지.', '회원 명부에 없는 얼굴이야.']],
  trophies: [['트로피에 비친 거 봐.', '우리잖아.', '… 셋이 비치는데.'], ['이 트로피 무거워 보인다.', '들어 본 사람이 없대.', '들면 대신 남아야 한대.']],
  scorecards: [['이 카드, 19번 홀 칸이 있어.', '인쇄 실수겠지.', '점수가 적혀 있어.'], ['여기 사인, 네 글씨 아니야?', '… 나 이날 안 나왔어.', '그러니까.']],
  clips: [['영상 끝나고 화면 꺼지면 봐.', '뭐가 보이는데?', '우리 뒤에 서 있는 사람.'], ['이 영상 소리 좀 줄여 봐.', '소리 안 켰는데.', '그럼 이 웃음소리는 뭐야.']],
  champion: [['우승자 초상 앞에서는 오래 있지 마.', '왜?', '자리 바꾸재.']],
  lobby: [['방명록 마지막 이름 봤어?', '아직 안 쓴 이름이던데.', '… 그게 네 이름이야.']],
};


/* ── 선수 이야기(v95) — 실제 기록(랭킹 · 라운드 · 영상)에서 대사를 만든다 ───────────────
   v96 — 기록(이름 · 타수)은 그대로 두고 끝 한 마디만 어긋나게 바꿨다(괴담). 방 주제에 맞춰 고른다: 트로피실은 1위 · 버디왕 · 이글, 명예의 전당은 멤버 근황 · 개근,
   기록 보관실은 베스트 스코어 · 자주 가는 코스, 상영관은 영상, 우승자의 방은 최근 우승자 · 다승 */
function crowdTopics() {
  if (CROWD.topics) return CROWD.topics;
  const A = M.archive || {}, P = (A.players || []).filter((p) => p && p.name);
  const J = (w, a, b) => (typeof josa === 'function' ? josa(w, a, b) : a);
  const f1 = (v) => (+v).toFixed(1);
  const T = { trophies: [], portraits: [], scorecards: [], clips: [], champion: [], photos: [], any: [] };
  const top = (f) => P.slice().sort((a, b) => f(b) - f(a))[0];
  if (P.length) {
    const r1 = P.slice().sort((a, b) => (a.rank || 99) - (b.rank || 99))[0];
    if (r1 && r1.avgStrokes) T.trophies.push([`올해 1위가 ${r1.name}${J(r1.name, '이', '가')}지?`, `평균 ${f1(r1.avgStrokes)}타래. 넘사벽이야.`, '트로피에 비친 얼굴은 다른 사람이던데.']);
    const bs = P.filter((p) => p.best).sort((a, b) => a.best - b.best)[0];
    if (bs) T.scorecards.push([`${bs.name} 베스트가 ${bs.best}타래.`, '그날 혼자 쳤대.', '그런데 카드엔 사인이 넷이야.']);
    const bd = top((p) => p.birdies || 0);
    if (bd && bd.birdies) T.trophies.push([`버디왕은 ${bd.name}${J(bd.name, '이야', '야')}.`, `버디 ${bd.birdies}개. 그중 하나는 기억이 안 난대.`, '기억 안 나는 홀이 하나씩 늘어난대.']);
    const wn = top((p) => p.roundWins || 0);
    if (wn && wn.roundWins) T.champion.push([`${wn.name} 우승 몇 번 했지?`, `${wn.roundWins}번. 이길 때마다 초상이 하나씩 늘어.`, '초상 속에선 다 같은 데를 보고 있어.']);
    const at = top((p) => p.roundsCompleted || 0);
    if (at) T.portraits.push([`${at.name}${J(at.name, '이', '가')} 라운드 제일 많이 나왔대.`, `${at.roundsCompleted}번. 한 번도 안 빠졌대.`, '못 나온 날에도 스코어는 적혀 있었대.']);
    const eg = P.find((p) => (p.hio || 0) > 0) || P.find((p) => (p.eagles || 0) > 0);
    if (eg) T.trophies.push([`${eg.name} ${eg.hio ? '홀인원' : '이글'} 기록 있대!`, '어느 홀에서?', '아무도 몰라. 코스 지도에 없는 홀이래.']);
    for (const p of P.slice(0, 14)) {
      if (p.avgStrokes) T.portraits.push([`요즘 ${p.name} 폼 어때?`, `평균 ${f1(p.avgStrokes)}타. 밤에만 연습한대.`, '여기서? 누구랑?']);
      if (p.best && p.avgStrokes) T.photos.push([`이 사진 ${p.name} 아니야?`, `맞아. 베스트 ${p.best}타 친 날.`, '그럼 뒤에 서 있는 사람은 누구야?']);
    }
  }
  const w = typeof recentWinner === 'function' ? recentWinner(A) : null;
  if (w) T.champion.push([`지난번${w.round.course ? ' ' + w.round.course : ''} 라운드 누가 이겼어?`,
    `${w.name}${J(w.name, '이', '가')}.${w.round.best != null ? ' ' + w.round.best + '타로.' : ''}`, '초상 봤어? 눈을 한 번도 안 감더라.']);
  const cnt = {};
  for (const r of A.rounds || []) if (r.course) cnt[r.course] = (cnt[r.course] || 0) + 1;
  const cs = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
  if (cs) T.scorecards.push([`${cs[0]} 요즘 자주 가네.`, `벌써 ${cs[1]}번째. 갈 때마다 한 홀씩 길어져.`, '안개 낀 날엔 19번 홀이 보인대.']);
  for (const c of (A.clips || []).slice(0, 8)) {
    if (!c.title) continue;
    T.clips.push([`'${c.title}' 영상 봤어?`, '봤지. 끝에 웃음소리가 하나 더 들려.',
      c.comment_count ? `댓글이 ${c.comment_count}개인데, 하나는 아무도 안 쓴 거래.` : '되감아 보면 누가 카메라를 보고 있어.']);
  }
  T.any = [...T.portraits, ...T.trophies.slice(0, 2), ...T.champion.slice(0, 1), ...T.clips.slice(0, 2)];
  CROWD.topics = T;
  return T;
}
/** 이 방에서 나눌 이야기 — 방 주제 쪽으로 기운다. 가끔은 흔한 잡담 */
function crowdLines(room) {
  if (!isNightMode()) {                                                     // v110 — 낮: 밝은 이야기
    const T = crowdTopicsDay(), r = M.roomById[room], k = r && r.content;
    const pool = [].concat(T[k] || [], T[k] || [], T.any);
    return pool.length && Math.random() < 0.75 ? pool[Math.floor(Math.random() * pool.length)] : DAY_TALKS[Math.floor(Math.random() * DAY_TALKS.length)];
  }
  const T = crowdTopics(), r = M.roomById[room], k = r && r.content;
  const pool = [].concat(T[k] || [], T[k] || [], ROOM_TALKS[k] || [], ROOM_TALKS[k] || [], T.any);
  if (pool.length && Math.random() < 0.75) return pool[Math.floor(Math.random() * pool.length)];
  return TALKS[Math.floor(Math.random() * TALKS.length)];
}

/* ── 길 그래프 ─────────────────────────────────────────── */
function crowdOk(r) { return r && !r.outdoor && !r.stair && !r.secret && !r.closed; }
function crowdGraph() {
  if (CROWD.graph) return CROWD.graph;
  const G = new Map();
  const add = (a, b, p, ia, ib) => { if (!G.has(a.id)) G.set(a.id, []); G.get(a.id).push({ to: b.id, p, from: ia, into: ib }); };
  for (const c of M.cells || []) {
    if (c.type !== 'door' && c.type !== 'open') continue;
    const a = c.neg, b = c.pos;
    if (!crowdOk(a) || !crowdOk(b) || Math.abs(a.y0 - b.y0) > 1) continue;
    const h = c.type === 'door' ? c.hole : null;
    if (c.type === 'open' && c.a1 - c.a0 < 120) continue;
    const m = h ? (h.a0 + h.a1) / 2 : (c.a0 + c.a1) / 2;
    const p = c.ax === 'v' ? { x: c.coord, z: m } : { x: m, z: c.coord };
    // 문 양쪽 80cm — 어느 쪽이 어느 방인지는 실제로 재 본다
    const o = c.ax === 'v' ? [{ x: p.x - 90, z: p.z }, { x: p.x + 90, z: p.z }] : [{ x: p.x, z: p.z - 90 }, { x: p.x, z: p.z + 90 }];
    const pa = inRect(a, o[0].x, o[0].z) ? o[0] : o[1], pb2 = pa === o[0] ? o[1] : o[0];
    add(a, b, p, pa, pb2); add(b, a, p, pb2, pa);
  }
  CROWD.graph = G;
  return G;
}
/** 방 → 방 길(문 목록) — 너비 우선 */
function crowdRoute(from, to) {
  const G = crowdGraph(), prev = new Map([[from, null]]), q = [from];
  while (q.length) {
    const id = q.shift(); if (id === to) break;
    for (const e of G.get(id) || []) if (!prev.has(e.to)) { prev.set(e.to, { id, e }); q.push(e.to); }
  }
  if (!prev.has(to)) return null;
  const out = []; let cur = to;
  while (prev.get(cur)) { const s = prev.get(cur); out.unshift(s.e); cur = s.id; }
  return out;
}
/** 방 안에서 볼 자리 — 전시물 관람 위치, 없으면 방 안 빈 곳 */
function crowdSpot(room, n) {
  const spots = M.exhibits.filter((e) => e.room === room && e.vx != null && e.type !== 'prop');
  if (spots.length) {
    const s = spots[Math.floor(Math.random() * spots.length)];
    return { x: s.vx + (Math.random() - 0.5) * 60, z: s.vz + (Math.random() - 0.5) * 60, lx: s.x, lz: s.z };
  }
  const r = M.roomById[room];
  for (let k = 0; k < 20; k++) {
    const x = r.x0 + 160 + Math.random() * (r.w - 320), z = r.z0 + 160 + Math.random() * (r.d - 320);
    if (!hitsWall(x, z, r.y0)) return { x, z, lx: r.cx, lz: r.cz };
  }
  return { x: r.cx, z: r.cz, lx: r.cx + 100, lz: r.cz };
}
function crowdGo(n, spot) {
  n.path = [{ x: spot.x, z: spot.z }];
  n.goal = spot; n.state = 'walk';
}
/** 다른 방으로 — 이웃 방 1~2 칸 */
function crowdWander(n) {
  const G = crowdGraph(), nb = G.get(n.room) || [];
  if (!nb.length) return false;
  let target = nb[Math.floor(Math.random() * nb.length)].to;
  if (Math.random() < 0.4) { const nb2 = G.get(target) || []; const t2 = nb2[Math.floor(Math.random() * nb2.length)]; if (t2 && t2.to !== n.room) target = t2.to; }
  // 사람은 사람 있는 데로 모인다 — 절반쯤은 다른 관람객이 있는 방(세 칸 안)으로 간다
  if (Math.random() < 0.55) {
    const near = M.npcs.filter((o) => o !== n && o.state === 'look' && o.room !== n.room).map((o) => ({ o, r: crowdRoute(n.room, o.room) }))
      .filter((c) => c.r && c.r.length <= 3);
    if (near.length) target = near[Math.floor(Math.random() * near.length)].o.room;
  }
  const route = crowdRoute(n.room, target);
  if (!route) return false;
  const spot = crowdSpot(target, n);
  n.path = [];
  for (const e of route) n.path.push({ x: e.from.x, z: e.from.z }, { x: e.p.x, z: e.p.z, enter: e.to }, { x: e.into.x, z: e.into.z });
  n.path.push({ x: spot.x, z: spot.z });
  n.goal = spot; n.state = 'walk';
  return true;
}
/** 방을 옮기면 방 그룹도 옮긴다(방이 컬링되면 함께 사라지게) */
function crowdEnter(n, room) {
  if (room === n.room) return;
  n.room = room;
  const g = M.roomGroups[room];
  if (g) { g.add(n.v.root); g.add(n.shadow); g.add(n.hit); }
  const r = M.roomById[room];
  n.info.room = room; n.info.subtitle = '관람객 · ' + (r ? r.name : '');
}

/* ── 대화 ─────────────────────────────────────────────── */
function crowdPair(M) {
  // 전시를 보는 중이거나, 같은 방 안에서 자리만 옮기는 중(문을 지나는 길이 아닌)이면 말을 걸 수 있다
  const free = (n) => !n.out && !n.mono && (n.cool || 0) <= 0 && (n.state === 'look' || (n.state === 'walk' && !n.path.some((w) => w.enter)));
  const idle = M.npcs.filter(free);
  for (let i = 0; i < idle.length; i++) for (let j = i + 1; j < idle.length; j++) {
    const a = idle[i], b = idle[j];
    if (a.room !== b.room || Math.hypot(a.x - b.x, a.z - b.z) > 1400 || Math.random() > 0.8) continue;
    // 만날 자리 — 둘 사이 가운데에서 1.1m 떨어져 마주 선다
    const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1;
    const r = M.roomById[a.room];
    if (hitsWall(mx, mz, r.y0)) continue;
    const ux = dx / L, uz = dz / L;
    const T = { a, b, lines: crowdLines(a.room), k: -1, t: 0, dur: 0, started: false };
    a.state = b.state = 'goTalk'; a.talk = b.talk = T; a.wait = b.wait = 0;
    a.path = [{ x: mx - ux * 55, z: mz - uz * 55 }]; b.path = [{ x: mx + ux * 55, z: mz + uz * 55 }];
    a.goal = { lx: b.x, lz: b.z }; b.goal = { lx: a.x, lz: a.z };
    return;
  }
}
function crowdTalkStep(T, dt) {
  const { a, b } = T;
  if (!T.started) {
    if (a.state === 'talkWait' && b.state === 'talkWait') { T.started = true; a.state = b.state = 'talk'; T.k = -1; T.t = 0; }
    else return;
  }
  // v99 — 내가 2.2m 안으로 들어오면 하던 이야기를 끊고 둘 다 나를 본다. 가까운 사람이 한 마디
  if (!T.interrupted && Math.min(a.pd || 1e9, b.pd || 1e9) < 220) {
    T.interrupted = true; T.intT = 6;
    T.lines = T.lines.slice(0, Math.max(0, T.k + 1)).concat([pickOf(isNightMode() ? INTERRUPT : DAY_INTERRUPT)]);
    T.forced = (a.pd || 1e9) < (b.pd || 1e9) ? a : b; T.forcedK = T.lines.length - 1;
    T.t = Math.min(T.t, 0.5);
  }
  if (T.intT > 0) T.intT -= dt;
  T.t -= dt;
  if (T.t <= 0) {
    T.k++;
    if (T.k >= T.lines.length) { crowdTalkEnd(T); return; }
    T.speaker = T.forced && T.k === T.forcedK ? T.forced : T.k % 2 === 0 ? a : b;
    T.t = 2.6 + T.lines[T.k].length * 0.09;
    crowdBubble(T, true);
    if (typeof sndMurmur === 'function') sndMurmur(T.speaker, Math.min(T.t - 0.6, 0.9 + T.lines[T.k].length * 0.07));   // 두런두런
  }
  crowdBubble(T, false);
}
function crowdTalkEnd(T) {
  for (const n of [T.a, T.b]) { n.state = 'look'; n.talk = null; n.cool = 30 + Math.random() * 25; n.wait = 1 + Math.random() * 2; }
  if (T.el) T.el.remove();
}
/** 말풍선 — 말하는 사람 머리 위. 가까울 때만 */
function crowdBubble(T, next) {
  if (!T.el) { T.el = document.createElement('div'); T.el.className = 'npc-say'; document.getElementById('gal').appendChild(T.el); }
  const s = T.speaker; if (!s) return;
  if (next) { T.el.textContent = T.lines[T.k]; T.el.classList.remove('pop'); void T.el.offsetWidth; T.el.classList.add('pop'); }
  sayPlace(T.el, s);
}
/** 말풍선을 그 사람 머리 위에 — 가까울 때(9m)만 */
function sayPlace(el, s) {
  const g = M.roomGroups[s.room];
  const p = new THREE.Vector3(s.x / CM, (M.roomById[s.room].y0 + (s.fy || 0)) / CM + s.hM + 0.28, s.z / CM);
  const d = Math.hypot(p.x - M.pos.x, p.z - M.pos.z);
  const v = p.clone().project(M.cam);
  const on = g && g.visible !== false && d < 9 && v.z < 1 && Math.abs(v.x) < 1 && Math.abs(v.y) < 1 && !M.openId;
  el.style.display = on ? '' : 'none';
  if (on) {
    el.style.transform = 'translate(' + ((v.x + 1) / 2 * innerWidth).toFixed(0) + 'px,' + ((1 - v.y) / 2 * innerHeight).toFixed(0) + 'px) translate(-50%, -100%)';
    el.style.opacity = String(clamp(1.4 - d / 9, 0.35, 1));
  }
}

/* ── 혼잣말(v96) — 한 사람이 몇 줄을 중얼거린다. 대화와 같은 자리에 뜨지만 흐린 글씨 ───────── */
const pickOf = (a) => a[Math.floor(Math.random() * a.length)];
function monoStart(n, lines, kind) {
  if (n.mono) return;
  n.mono = { lines, k: -1, t: 0.2, kind: kind || 'mono' };
}
function monoStep(n, dt) {
  const T = n.mono;
  T.t -= dt;
  if (T.t <= 0) {
    T.k++;
    if (T.k >= T.lines.length) {
      if (T.el) T.el.remove();
      n.mono = null; n.monoOn = false;
      if (n.state === 'mono') { n.state = 'look'; n.wait = 2 + Math.random() * 3; }
      n.monoCool = n.mutter ? 5 + Math.random() * 8 : 18 + Math.random() * 22;      // v99 — 더 자주
      return;
    }
    const line = T.lines[T.k];
    T.t = 2.2 + line.length * 0.1 + (T.kind === 'mono' ? 0.8 : 0);
    if (!T.el) { T.el = document.createElement('div'); T.el.className = 'npc-say ' + T.kind; document.getElementById('gal').appendChild(T.el); }
    T.el.textContent = line; T.el.classList.remove('pop'); void T.el.offsetWidth; T.el.classList.add('pop');
    if (typeof sndMurmur === 'function' && line.charAt(0) !== '(') sndMurmur(n, Math.min(T.t - 0.6, 0.8 + line.length * 0.07), T.kind === 'mono');
  }
  n.monoOn = T.t > 0.5 && T.k >= 0 && T.lines[T.k].charAt(0) !== '(';
  if (T.el) sayPlace(T.el, n);
}
/** 구석 — 방 모서리 75cm 앞에 서서 모서리를 본다(전시물이 있는 모서리는 피한다) */
function crowdCorner(n) {
  const r = M.roomById[n.room];
  if (!r) return false;
  const C = [[r.x0, r.z0, 1, 1], [r.x1, r.z0, -1, 1], [r.x0, r.z1, 1, -1], [r.x1, r.z1, -1, -1]];
  for (let k = 0; k < 4; k++) {
    const [cx, cz, sx, sz] = pickOf(C);
    const x = cx + sx * 75, z = cz + sz * 75;
    if (hitsWall(x, z, r.y0)) continue;
    if (M.exhibits.some((e) => e.room === r.id && Math.hypot(e.x - x, e.z - z) < 150)) continue;
    n.path = [{ x, z }]; n.goal = { x, z, lx: cx, lz: cz, mono: true }; n.state = 'walk';
    return true;
  }
  return false;
}

/* ── 손짓 · 끄덕임 — 클립 위에 얹는다 ────────────────────────── */
const _pq = new THREE.Quaternion(), _rq = new THREE.Quaternion();
function boneRotWorld(bone, axis, ang) {
  if (!bone || !bone.parent) return;
  bone.parent.getWorldQuaternion(_pq);
  _rq.setFromAxisAngle(axis, ang);
  const lq = _pq.clone().invert().multiply(_rq).multiply(_pq);
  bone.quaternion.premultiply(lq);
}
function crowdGesture(n, t) {
  const v = n.v, sk = v.mesh.skeleton;
  npcBones(v);
  const B = v.bones, T = n.talk;
  const right = new THREE.Vector3(-Math.cos(n.yaw), 0, Math.sin(n.yaw)), up = new THREE.Vector3(0, 1, 0);
  // 부호 — 팔꿈치를 굽혀 손이 앞으로 오는 쪽(사람마다 뼈 방향이 다를 수 있어 한 번 재 둔다)
  if (v.gs == null && B.rf) {
    v.root.updateMatrixWorld(true);
    const h = sk.getBoneByName('RightHand'), fw = new THREE.Vector3(Math.sin(n.yaw), 0, Math.cos(n.yaw));
    const p0 = h.getWorldPosition(new THREE.Vector3()).dot(fw);
    const save = B.rf.quaternion.clone(); boneRotWorld(B.rf, right, 0.5); v.root.updateMatrixWorld(true);
    const p1 = h.getWorldPosition(new THREE.Vector3()).dot(fw);
    B.rf.quaternion.copy(save); v.gs = p1 > p0 ? 1 : -1;
  }
  const g = v.gs || 1;
  if (n.state === 'talk' && T && T.speaker === n) {
    // 말하기 — 오른팔을 들어 손짓, 고개를 조금씩
    const k = Math.min(1, (n.gk = Math.min(1, (n.gk || 0) + 0.05)));
    boneRotWorld(B.ra, right, g * (0.22 + 0.08 * Math.sin(t * 2.1)) * k);
    boneRotWorld(B.rf, right, g * (0.75 + 0.25 * Math.sin(t * 3.3)) * k);
    boneRotWorld(B.rf, up, 0.25 * Math.sin(t * 1.7) * k);
    if (Math.sin(t * 0.9) > 0.3) { boneRotWorld(B.lf, right, g * 0.35 * k); }
    boneRotWorld(B.head, right, -0.05 * Math.sin(t * 4.2) * k);
    boneRotWorld(B.head, up, 0.08 * Math.sin(t * 1.3) * k);
  } else if (n.state === 'talk') {
    // 듣기 — 천천히 끄덕인다
    n.gk = Math.max(0, (n.gk || 0) - 0.05);
    boneRotWorld(B.head, right, -0.09 * Math.max(0, Math.sin(t * 2.4)));
    boneRotWorld(B.head, up, 0.05 * Math.sin(t * 0.7));
  }
}

/* ── 얼굴(v95) — 모프: 눈 깜빡임(2~7초마다) · 말할 때 입이 움직이고 · 듣는 사람은 웃는다 ───────── */
function npcFace(n, dt) {
  const mi = n.v.mesh.morphTargetInfluences, m = n.v.morph;
  if (!mi) return;
  n.blinkT = (n.blinkT == null ? 1 + Math.random() * 4 : n.blinkT) - dt;
  if (n.blinkT <= 0) { n.blinkA = 0.0001; n.blinkT = 2 + Math.random() * 5 + (Math.random() < 0.15 ? -1.6 : 0); }   // 가끔 두 번 연달아
  if (n.blinkA > 0) {
    n.blinkA += dt; const b = n.blinkA;
    mi[m.blink] = b < 0.06 ? b / 0.06 : b < 0.19 ? 1 - (b - 0.06) / 0.13 : 0;
    if (b >= 0.19) n.blinkA = 0;
  }
  const T = n.talk, talking = n.state === 'talk' && T;
  const speaking = (talking && T.speaker === n && T.t > 0.5) || n.monoOn;
  const tt = CROWD.t * 1 + n.phase;
  const open = speaking ? 0.18 + 0.5 * Math.abs(Math.sin(tt * 8.7) * Math.sin(tt * 4.3 + 1.1)) : 0;
  mi[m.talk] += (open - mi[m.talk]) * Math.min(1, dt * 16);
  const sm = talking ? (speaking ? 0.2 : 0.55 + 0.25 * Math.sin(tt * 0.9)) : 0.1 * Math.max(0, Math.sin(tt * 0.21));
  mi[m.smile] += ((n.smileFix != null ? n.smileFix : sm) - mi[m.smile]) * Math.min(1, dt * 2.5);
}

/* ── 매 프레임 ───────────────────────────────────────────── */
function crowdInit(M) {
  for (const n of M.npcs) {
    if (n.out) { outInit(n); continue; }
    n.state = 'look'; n.path = []; n.cool = 6 + Math.random() * 10; n.goal = { lx: n.lx, lz: n.lz };
    n.monoCool = (n.mutter ? 3 : 8) + Math.random() * 10;
    // v99 — 걸음 버릇: 두리번(glance) · 문득 멈춰 돌아봄(halt) · 고개 숙이고 느릿느릿(heavy) · 뒤돌아봄(back) · 얼어붙기(freeze)
    n.quirk = CROWD_QUIRK[(n.idx = (n.idx != null ? n.idx : CROWD.nq = (CROWD.nq || 0) + 1)) % CROWD_QUIRK.length];
    if (n.quirk === 'heavy') n.speed *= 0.8;
    n.noticeCool = 4 + Math.random() * 10;
  }
}
function stepCrowd(M, dt) {
  if (!M.npcs || !M.npcs.length) return;
  if (M.npcs[0].state === undefined) crowdInit(M);
  CROWD.t += dt;
  CROWD.pairT -= dt;
  if (CROWD.pairT <= 0) { CROWD.pairT = 1.2; crowdPair(M); }
  const talks = new Set();
  const PX = M.pos.x * CM, PZ = M.pos.z * CM;
  for (const n of M.npcs) {
    n.cool = (n.cool || 0) - dt;
    n.monoCool = (n.monoCool || 0) - dt;
    n.asked = (n.asked || 0) - dt;
    if (n.out) { outStep(M, n, dt); npcPose(M, n, dt); continue; }
    let want = n.yaw, walking = false;
    // v99 — 나와의 거리(같은 층 · 같은 방 또는 3m 안). 마주치면 멈춰서 나를 본다
    const rr = M.roomById[n.room], pd = Math.hypot(PX - n.x, PZ - n.z);
    n.pd = rr && Math.abs((M.feet || 0) - rr.y0) < 150 && ((M.room && M.room.id === n.room) || pd < 300) ? pd : 1e9;
    n.noticeCool = (n.noticeCool || 0) - dt;
    if (n.noticeCool <= 0 && n.pd < 230 && (n.state === 'look' || (n.state === 'walk' && !n.path.some((w) => w.enter)))) {
      n.noticeCool = 45 + Math.random() * 40;
      n.state = 'notice'; n.noticeT = n.quirk === 'freeze' ? 6 : 4.2; n.path = []; n.pause = 0;
      if (n.quirk !== 'freeze' || Math.random() < 0.35) monoForce(n, pickOf(isNightMode() ? NEAR_IN : DAY_NEAR), 'say', 0.7);
    } else if (n.state === 'mono' && n.noticeCool <= 0 && n.pd < 200) {
      // 구석을 보고 중얼거리던 사람 뒤에 서면 — 멈추고 천천히 돌아본다
      n.noticeCool = 45 + Math.random() * 30;
      n.state = 'notice'; n.noticeT = 5;
      monoForce(n, pickOf(MONO_CAUGHT), 'mono', 1.2);
    }
    if (n.state === 'notice') {
      want = Math.atan2(PX - n.x, PZ - n.z);
      n.noticeT -= dt;
      if (n.quirk === 'freeze' && n.pd < 380) n.noticeT = Math.max(n.noticeT, 0.4);    // 내가 곁에 있는 동안은 꼼짝 않고 본다
      if (n.noticeT <= 0 || (n.pd > 700 && !n.noticeFar)) { n.state = 'look'; n.wait = 1 + Math.random() * 2; n.noticeFar = false; }
    } else if (n.state === 'look') {
      want = Math.atan2(n.goal.lx - n.x, n.goal.lz - n.z);
      n.wait -= dt;
      if (n.wait <= 0) {
        n.wait = 4 + Math.random() * 6;
        // v96 — 혼잣말하는 사람은 자주 구석으로 가서 벽을 보고 선다
        if (n.mutter && n.monoCool <= 0 && Math.random() < 0.5 && crowdCorner(n)) { /* 구석으로 */ }
        else if (Math.random() < 0.38 && crowdWander(n)) { /* 다른 방으로 */ } else crowdGo(n, crowdSpot(n.room, n));
      }
      if (n.mutter && !n.mono && n.monoCool <= 0 && Math.random() < dt / 5) monoStart(n, pickOf(MONO));    // 전시 앞에서도 중얼거린다
      else if (!n.mutter && !n.mono && n.monoCool <= 0 && isNightMode() && Math.random() < dt / 40) monoStart(n, [pickOf(MONO_SHORT)]);   // v99 — 누구나 가끔 한 마디
    } else if (n.state === 'mono') {
      want = Math.atan2(n.goal.lx - n.x, n.goal.lz - n.z);
      if (!n.mono) { n.state = 'look'; n.wait = 1; }
    } else if (n.state === 'walk' && n.pause > 0) {
      // v99 — 걷다가 문득 멈춘다(돌아보거나, 나를 보거나)
      n.pause -= dt;
      want = n.pauseYaw != null ? n.pauseYaw : n.yaw;
    } else if (n.state === 'walk' || n.state === 'goTalk') {
      const wp = n.path[0];
      if (!wp) {
        n.state = n.state === 'goTalk' ? 'talkWait' : 'look';
        if (n.state === 'look' && n.goal && n.goal.mono) { n.state = 'mono'; if (!n.mono) monoStart(n, pickOf(MONO)); }
      }
      else {
        const dx = wp.x - n.x, dz = wp.z - n.z, dist = Math.hypot(dx, dz);
        if (dist < 18) {
          n.path.shift();
          if (wp.enter) crowdEnter(n, wp.enter);
        } else {
          let ux = dx / dist, uz = dz / dist;
          // 비켜 가기 — 앞에 사람이 있으면 옆으로(나도 사람이다)
          const others = M.npcs.filter((o) => o !== n && o.room === n.room).map((o) => ({ x: o.x, z: o.z }));
          if (M.room && M.room.id === n.room) others.push({ x: M.pos.x * CM, z: M.pos.z * CM });
          let sx = 0, sz = 0, slow = 1;
          for (const o of others) {
            const ox = o.x - n.x, oz = o.z - n.z, od = Math.hypot(ox, oz);
            if (od > 150 || od < 1) continue;
            const ahead = (ox * ux + oz * uz) / od;
            if (ahead < -0.2) continue;
            const side = Math.sign(ux * oz - uz * ox) || 1;         // 상대가 왼쪽이면 오른쪽으로
            const k = (150 - od) / 150;
            sx += -uz * -side * k * 1.8; sz += ux * -side * k * 1.8;
            if (od < 70 && ahead > 0.6) slow = Math.min(slow, 0.35);
          }
          let mx = ux + sx, mz = uz + sz; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
          // v95 — 속도를 서서히 올리고 내린다(도착 직전엔 늦춘다). 예전엔 0 → 최고 속도로 뚝 바뀌어 미끄러지듯 출발했다
          const tv = n.speed * slow * Math.min(1, dist / 70 + 0.3);
          n.curV = (n.curV || 0) + (tv - (n.curV || 0)) * Math.min(1, dt * 3);
          const step = n.curV * 100 * dt;
          const nx = n.x + mx * Math.min(step, dist), nz = n.z + mz * Math.min(step, dist);
          const r = M.roomById[n.room];
          if (!(sx || sz) || !hitsWall(nx, nz, r ? r.y0 : 0)) { n.x = nx; n.z = nz; }
          else { n.x += ux * Math.min(step, dist); n.z += uz * Math.min(step, dist); }
          want = Math.atan2(mx, mz); walking = true;
          const pr = n.quirk === 'halt' ? 7 : n.quirk === 'back' ? 10 : n.quirk === 'freeze' ? 18 : 45;
          if (n.state === 'walk' && !n.finale && dist > 150 && !n.path.some((w) => w.enter) && Math.random() < dt / pr) {
            n.pause = 1.4 + Math.random() * 2.4;
            n.pauseYaw = n.quirk === 'back' ? n.yaw + Math.PI * (Math.random() < 0.5 ? 1 : -1) * 0.95
              : n.pd < 1200 ? Math.atan2(PX - n.x, PZ - n.z) : n.yaw + (Math.random() - 0.5) * 2.4;
            if (!n.mono && n.monoCool <= 0 && isNightMode() && Math.random() < 0.4) monoStart(n, [pickOf(MONO_SHORT)]);
          }
          n.phase += dt * n.speed * 7.2;
        }
      }
    } else if (n.state === 'talkWait' || n.state === 'talk') {
      const o = n.talk && (n.talk.a === n ? n.talk.b : n.talk.a);
      if (o) want = Math.atan2(o.x - n.x, o.z - n.z);
      if (n.talk && n.talk.intT > 0) want = Math.atan2(PX - n.x, PZ - n.z);      // 엿듣는 나를 본다
      if (n.talk) talks.add(n.talk);
      // 상대가 너무 오래 안 오면(길이 막혔다) 그만둔다
      n.wait -= dt; if (n.state === 'talkWait' && n.wait < -12 && n.talk) crowdTalkEnd(n.talk);
    }
    if (!walking) n.curV = (n.curV || 0) * Math.max(0, 1 - dt * 5);
    n.yaw += npcAng(want - n.yaw) * Math.min(1, dt * (walking ? 3 : 4));
    // 걷기 비중 = 지금 속도 / 제 걸음 속도(걸음 박자도 속도에 맞춘다 → 발이 바닥에서 미끄러지지 않는다)
    n.walkK = clamp((n.curV || 0) / n.speed, 0, 1);
    npcPose(M, n, dt);
  }
  for (const T of talks) crowdTalkStep(T, dt);
  for (const n of M.npcs) if (n.mono) monoStep(n, dt);
}
/** 자세 · 자리 반영(보이지 않는 방이면 뼈 계산은 건너뛴다) */
function npcPose(M, n, dt) {
  const v = n.v, g = M.roomGroups[n.room], shown = !g || g.visible !== false;
  const fy = (n.fy || 0) / CM;
  v.root.position.set(n.x / CM, fy, n.z / CM);
  v.root.rotation.y = n.yaw;
  n.shadow.position.set(n.x / CM, fy + 0.012, n.z / CM);
  n.hit.position.set(n.x / CM, fy + n.hM / 2, n.z / CM);
  n.info.x = n.x; n.info.z = n.z;
  if (!shown) return;
  if (v.real) {
    const k = n.walkK;
    v.walk.setEffectiveWeight(k); v.idle.setEffectiveWeight(1 - k);
    v.walk.timeScale = clamp((n.curV || 0) / v.natural, 0.35, n.out ? 2.1 : 1.3);      // 바깥 아이들은 뛴다
    v.mixer.update(dt);
    // 발소리 — 걸음 한 주기에 뒤꿈치가 두 번 닿는다
    const u = (v.walk.time % v.walk.getClip().duration) / v.walk.getClip().duration, hs = Math.floor(u * 2);
    if (hs !== n.hs) { n.hs = hs; if (k > 0.5 && typeof sndStep === 'function') sndStep(M.roomById[n.room], 0.55, n.x / CM, n.z / CM); }
    if (v.morph) npcFace(n, dt);
    if (n.state === 'talk') { v.root.updateMatrixWorld(true); crowdGesture(n, CROWD.t + n.phase); }
    npcHead(n, dt);
  } else {
    const k = n.walkK, sw = Math.sin(n.phase);
    v.legL.rotation.x = sw * 0.46 * k; v.legR.rotation.x = -sw * 0.46 * k;
    v.armL.rotation.x = -sw * 0.36 * k + (1 - k) * 0.05; v.armR.rotation.x = sw * 0.36 * k + (1 - k) * 0.05;
    v.body.position.y = Math.abs(Math.cos(n.phase)) * 0.028 * k;
  }
}

/* ══════════════════════════════════════════════════════════
   바깥 사람들(v96) — 넓어진 땅에 드문드문
   ══════════════════════════════════════════════════════════
   · 아이 둘(조각 정원) — 앞서 가는 아이를 다른 아이가 쫓아다닌다. 가까이 가면 멈춰서 나를 보고
     한 마디 하고는, 깔깔대며(말없이) 멀리 달아난다
   · 광장을 서성이는 사람 · 연습 그린에서 컵을 내려다보며 중얼거리는 사람
   · 지켜보는 사람(18번 홀 숲가) — 늘 이쪽을 보고 서 있다. 14m 안으로 다가가면 등을 돌려 걸어가 버린다
   땅 높이를 따라 걷는다(n.fy). 갈 자리는 발 디딜 곳(벽 · 나무 · 호수가 아닌 곳)인지 길을 따라 재 본다. */
const OUT_CAST = [
  { id: 'kidA', room: 'garden', ch: 'p7', role: 'kid', label: '붉은 원피스의 여자아이', wear: '빛바랜 붉은 원피스',
    say: '정원에서 노는 아이. 보호자는 보이지 않는다.' + String.fromCharCode(10) + '언제부터 여기 있었는지 아무도 모른다.' },
  { id: 'kidB', room: 'garden', ch: 'p8', role: 'kid', lead: 'kidA', label: '회녹색 옷의 남자아이', wear: '낡은 회녹색 셔츠',
    say: '여자아이 뒤를 졸졸 따라다닌다.' + String.fromCharCode(10) + '둘이 무슨 놀이를 하는지는 끝내 알 수 없다. 술래가 없다.' },
  { id: 'plaza', room: 'plaza', ch: 'p3', role: 'stroll', lines: 'plaza', label: '광장을 서성이는 사람',
    say: '분수 둘레를 몇 바퀴째 돌고 있다.' + String.fromCharCode(10) + '정문 쪽을 자꾸 돌아보지만 나가지는 않는다.' },
  { id: 'putt', room: 'practice', ch: 'remy', role: 'stroll', lines: 'practice', label: '컵을 내려다보는 사람',
    K: { coat: '#8C7B62', pants: '#3A342C', hairC: '#2A2018', skin: '#CFA283', shoe: '#E6E0D4', h: 1.72 },
    say: '연습 그린의 컵을 한참 내려다본다.' + String.fromCharCode(10) + '손에 퍼터는 없다.' },
  { id: 'watch', room: 'field', ch: 'remy', role: 'watch', label: '멀리 서 있는 사람',
    K: { coat: '#141417', pants: '#101012', hairC: '#0E0C0B', skin: '#B39070', shoe: '#141414', h: 1.84 },
    zone: (x, z) => Math.abs(x - 2500) > 3300 && z < -2600 && z > -8200,
    say: '숲가에 서서 이쪽을 보고 있었다.' + String.fromCharCode(10) + '가까이 가면 없다. 돌아보면 또 저만치 서 있다.' },
];
function buildOutdoorNpcs(M) {
  if (typeof PEOPLE === 'undefined' || !PEOPLE.ok || !PEOPLE.byName) return;
  const made = {};
  let i = 0;
  for (const C of OUT_CAST) {
    if (C.role === 'watch' && !isNightMode()) continue;                    // v110 — 낮엔 숲가의 그 사람이 없다
    const r = M.roomById[C.room], g = M.roomGroups[C.room];
    if (!r || !g || !PEOPLE.byName[C.ch]) continue;
    const v = buildRealVisitor(Object.assign({ coat: '#555', pants: '#333', h: 1.7 }, C.K || {}), C.ch);
    const n = { out: true, role: C.role, cast: C, room: r.id, v, hM: v.hM, name: C.label, kid: v.hM < 1.5,
      x: r.cx, z: r.cz, yaw: Math.random() * 6.28, phase: i * 2.1, walkK: 0, speed: v.natural || 1.1, zone: C.zone };
    // 첫 자리 — 그 방(구역) 안의 발 디딜 곳
    const s0 = outSpot(n, null, null, true);
    if (!s0) continue;
    n.x = s0.x; n.z = s0.z;
    if (C.lead && made[C.lead]) { const L = made[C.lead]; n.lead = L; n.x = L.x + 120; n.z = L.z + 60; if (!outOk(r, n.x, n.z)) { n.x = L.x; n.z = L.z; } }
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(0.62 * (n.kid ? 0.8 : 1), 0.42 * (n.kid ? 0.8 : 1)),
      new THREE.MeshBasicMaterial({ map: npcShadowTex(), transparent: true, opacity: 0.8, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2;
    n.shadow = sh;
    const hit = new THREE.Mesh(new THREE.BoxGeometry(0.55, v.hM, 0.55), new THREE.MeshBasicMaterial({ visible: false }));
    n.hit = hit;
    n.info = { id: 'npc-out-' + C.id, type: 'placard', icon: n.kid ? '🧒' : '🧑', label: C.label, title: C.label,
      subtitle: '관람객 · ' + r.name, x: n.x, z: n.z, y: 120, room: r.id,
      body: isNightMode() ? C.say + String.fromCharCode(10) + String.fromCharCode(10) + '※ 관람객은 소장품이 아닙니다. 아직은.'
        : (n.kid ? '정원에서 뛰어노는 아이.' : '바깥을 산책하는 관람객.') + String.fromCharCode(10) + String.fromCharCode(10) + '※ 관람객은 소장품이 아닙니다. 말을 걸면 대답해 줍니다.' };
    Object.defineProperty(n.info, 'npcRef', { value: n });      // v99 — 조사하면 먼저 대답한다(npcAsk)
    M.pickables.push(hit);
    M.artByMesh.set(hit, n.info);
    if (typeof floodPatch === 'function') floodPatch(v.mesh.material);      // v97 — 밤: 조명탑 · 가로등 빛을 받는다
    g.add(v.root, sh, hit);
    M.npcs.push(n);
    made[C.id] = n;
    i++;
  }
}

/** 발 디딜 곳인가 — 그 방 안 · 벽/나무/조각이 아닌 곳 · (필드) 호수와 그린 너머는 빼고 */
function outOk(r, x, z) {
  if (x < r.x0 + 120 || x > r.x1 - 120 || z < r.z0 + 120 || z > r.z1 - 120) return false;
  const f = floorAt(r, x, z);
  if (!(f === f)) return false;
  if (r.terrain && (lakeDist(x, z) < 1.15 || z < -9600 || z > -1200)) return false;
  return !hitsWall(x, z, f);
}
function outSeg(r, ax, az, bx, bz) {
  const L = Math.hypot(bx - ax, bz - az), k = Math.ceil(L / 80);
  for (let j = 1; j <= k; j++) { const t = j / k; if (!outOk(r, ax + (bx - ax) * t, az + (bz - az) * t)) return false; }
  return true;
}
/** 갈 자리 — near{x,z,R} 둘레 안, far{x,z,min} 에서 떨어진 곳. anywhere 면 길은 재지 않는다(처음 자리) */
function outSpot(n, near, far, anywhere) {
  const r = M.roomById[n.room];
  for (let k = 0; k < (n.zone ? 90 : 36); k++) {
    let x, z;
    if (near) { const a = Math.random() * 6.2832, d = 200 + Math.random() * near.R; x = near.x + Math.cos(a) * d; z = near.z + Math.sin(a) * d; }
    else { x = r.x0 + 200 + Math.random() * (r.w - 400); z = r.z0 + 200 + Math.random() * (r.d - 400); }
    if (far && Math.hypot(x - far.x, z - far.z) < far.min) continue;
    if (n.zone && !n.zone(x, z)) continue;
    if (outOk(r, x, z) && (anywhere || outSeg(r, n.x, n.z, x, z))) return { x, z };
  }
  return null;
}
function outInit(n) {
  n.state = 'look'; n.wait = 2 + Math.random() * 5; n.cool = 8 + Math.random() * 8; n.curV = 0; n.vmax = n.speed;
  n.face = { x: n.x + Math.sin(n.yaw) * 100, z: n.z + Math.cos(n.yaw) * 100 };
  n.monoCool = 6 + Math.random() * 14;
  if (n.role === 'watch') n.smileFix = 0.32;          // 굳은 웃음
}
/** 내 화면에 보이는가(대충 — 머리 높이 한 점) */
function outSeen(n) {
  const r = M.roomById[n.room], g = M.roomGroups[n.room];
  if (!g || g.visible === false) return false;
  const v = new THREE.Vector3(n.x / CM, (r.y0 + (n.fy || 0)) / CM + n.hM * 0.8, n.z / CM).project(M.cam);
  return v.z < 1 && Math.abs(v.x) < 1.15 && Math.abs(v.y) < 1.15;
}
/** 한 걸음 — 다 왔으면 false */
function outWalk(M, n, dt, P) {
  const r = M.roomById[n.room], t = n.tgt, dx = t.x - n.x, dz = t.z - n.z, dist = Math.hypot(dx, dz);
  if (dist < 25) { n.tgt = null; return false; }
  const ux = dx / dist, uz = dz / dist;
  // 내가 앞을 막으면 멈춰 기다린다(아이들은 돌아서 간다 — 다음 자리를 새로 잡는다)
  const px = P.x - n.x, pz = P.z - n.z, pd = Math.hypot(px, pz);
  let slow = 1;
  if (pd < 120 && (px * ux + pz * uz) / (pd || 1) > 0.4) slow = 0;
  const tv = n.vmax * slow * Math.min(1, dist / 80 + 0.3);
  n.curV += (tv - n.curV) * Math.min(1, dt * (n.vmax > n.speed * 1.3 ? 4 : 3));
  const st = n.curV * 100 * dt, nx = n.x + ux * Math.min(st, dist), nz = n.z + uz * Math.min(st, dist);
  if (!outOk(r, nx, nz)) { n.tgt = null; return false; }      // 카트 같은 것이 길을 막았다 → 다시 고른다
  n.x = nx; n.z = nz;
  n.phase += dt * n.curV * 7.2;
  return true;
}
function outStep(M, n, dt) {
  const r = M.roomById[n.room], P = { x: M.pos.x * CM, z: M.pos.z * CM };
  const pd = Math.hypot(P.x - n.x, P.z - n.z);
  const near = Math.abs((M.feet || 0) - (r.y0 + (n.fy || 0))) < 250;      // 나와 같은 높이에 있을 때만(데크 위에서는 모른 척)
  n.pd = near ? pd : 1e9;
  if (n.finale) {
    // v103 — 마지막 방송: 그 자리에 멈춰 건물(명예의 전당)을 바라본다
    const h = M.roomById.hall;
    n.state = 'look'; n.tgt = null; n.curV *= Math.max(0, 1 - dt * 5);
    n.yaw += npcAng(Math.atan2(h.cx - n.x, h.cz - n.z) - n.yaw) * Math.min(1, dt * 1.5);
    n.walkK = clamp(n.curV / n.speed, 0, 1);
    return;
  }
  let want = n.yaw, walking = false;
  const go = (spot, k) => { if (spot) { n.tgt = spot; n.vmax = n.speed * k; n.state = 'walk'; } };

  if (n.role === 'kid') {
    const L = n.lead;
    if (n.state === 'stare') {
      want = Math.atan2(P.x - n.x, P.z - n.z);
      n.wait -= dt;
      if (n.wait <= 0) {
        // 달아난다 — 나에게서 14m 넘게 떨어진 곳으로, 뛰어서
        if (!L) go(outSpot(n, { x: n.x, z: n.z, R: 2600 }, { x: P.x, z: P.z, min: 1400 }) || outSpot(n, null, { x: P.x, z: P.z, min: 1000 }), 2.0);
        else n.state = 'look';
        n.cool = 30 + Math.random() * 20;
      }
    } else if (!L && near && pd < 520 && n.cool <= 0) {
      // 나를 알아챘다 — 둘 다 멈춰서 나를 본다
      n.state = 'stare'; n.tgt = null; n.wait = 3.2;
      if (n.mono) { if (n.mono.el) n.mono.el.remove(); n.mono = null; }
      monoStart(n, pickOf((isNightMode() ? MONO_OUT : DAY_OUT).near), 'kid');
      for (const o of M.npcs) if (o.lead === n) { o.state = 'stare'; o.tgt = null; o.wait = 3.2; }
    } else if (L) {
      // 따라가는 아이 — 앞 아이가 움직이면 뒤 1.2m 쪽으로, 멀면 뛴다
      const dx = L.x - n.x, dz = L.z - n.z, d = Math.hypot(dx, dz);
      if (L.state === 'stare') { /* 위에서 함께 멈춘다 */ }
      else if (d > 170) {
        n.tgt = { x: L.x - dx / d * 110, z: L.z - dz / d * 110 };
        n.vmax = n.speed * (d > 420 ? 2.1 : Math.max(1, L.vmax / n.speed));
        n.state = 'walk';
      } else if (n.state !== 'walk') { n.state = 'look'; n.face = { x: L.x, z: L.z }; }
    } else if (n.state === 'look') {
      n.wait -= dt;
      if (n.wait <= 0) { n.wait = 2 + Math.random() * 4; go(outSpot(n, { x: n.x, z: n.z, R: 1400 }), Math.random() < 0.35 ? 1.9 : 1); }
    }
    if (n.state !== 'stare' && !n.mono && n.monoCool <= 0 && Math.random() < dt / 9) monoStart(n, pickOf((isNightMode() ? MONO_OUT : DAY_OUT).kid), 'kid');
  } else if (n.role === 'watch') {
    if (n.state === 'look') {
      want = Math.atan2(P.x - n.x, P.z - n.z);                    // 늘 이쪽을 본다
      if (near && pd < 1400 && n.cool <= 0) {
        // 다가오면 등을 돌려 숲 안쪽으로 8~13m 걸어간다(나에게서 멀어지는 쪽)
        const ax = (n.x - P.x) / (pd || 1), az = (n.z - P.z) / (pd || 1);
        for (let k = 0; k < 24 && !n.tgt; k++) {
          const a = Math.atan2(az, ax) + (Math.random() - 0.5) * 1.6, d = 800 + Math.random() * 500;
          const x = n.x + Math.cos(a) * d, z = n.z + Math.sin(a) * d;
          if (outOk(r, x, z) && outSeg(r, n.x, n.z, x, z)) go({ x, z }, 0.85);
        }
        n.cool = 4; n.relocate = true; n.walkT = 0;
      } else if (n.relocate && n.cool <= 0 && !outSeen(n)) {
        // 눈을 돌린 사이 — 다른 숲가에 다시 서 있다(나에게서 25m 넘게)
        for (let k = 0; k < 3 && n.relocate; k++) {
          const sp = outSpot(n, null, { x: P.x, z: P.z, min: 2500 }, true);
          if (sp && Math.hypot(sp.x - P.x, sp.z - P.z) < 5500) { n.x = sp.x; n.z = sp.z; n.relocate = false; }
        }
      }
    } else if (n.state === 'walk') {
      n.walkT = (n.walkT || 0) + dt;
      if (n.walkT > 12) { n.state = 'look'; n.tgt = null; }
    }
  } else {
    // 서성이는 사람 — 천천히 걷다 서다, 가끔 중얼거린다. 가까이 가면 나를 보고 한 마디
    if (n.state === 'look') {
      n.wait -= dt;
      if (near && pd < 330 && n.cool <= 0 && !n.mono) { n.face = { x: P.x, z: P.z }; n.wait = Math.max(n.wait, 6); monoStart(n, pickOf((isNightMode() ? MONO_OUT : DAY_OUT).stranger), isNightMode() ? 'mono' : 'say'); n.cool = 60; }
      if (n.wait <= 0) {
        n.wait = 6 + Math.random() * 9;
        const s = outSpot(n, { x: n.x, z: n.z, R: 1500 });
        if (s) { n.face = { x: s.x * 2 - n.x, z: s.z * 2 - n.z }; go(s, 0.82); }
      }
    }
    if (!n.mono && n.monoCool <= 0 && Math.random() < dt / (isNightMode() ? 16 : 30)) monoStart(n, pickOf((isNightMode() ? MONO_OUT : DAY_OUT)[n.cast.lines] || [['…']]), isNightMode() ? 'mono' : 'say');
  }

  if (n.state === 'walk') {
    if (n.tgt && outWalk(M, n, dt, P)) { want = Math.atan2(n.tgt.x - n.x, n.tgt.z - n.z); walking = true; }
    else { n.state = 'look'; n.tgt = null; if (n.role !== 'kid' || !n.lead) n.wait = n.role === 'kid' ? 1.5 + Math.random() * 3 : n.wait; }
  } else if (n.state === 'look' && n.role !== 'watch' && n.face) want = Math.atan2(n.face.x - n.x, n.face.z - n.z);
  if (n.monoOn && n.state === 'look' && near && pd < 900 && n.role === 'kid') want = Math.atan2(P.x - n.x, P.z - n.z);   // 아이들은 말할 때 나를 본다

  if (!walking) n.curV *= Math.max(0, 1 - dt * 5);
  n.yaw += npcAng(want - n.yaw) * Math.min(1, dt * (walking ? 3.5 : 2.2));
  n.walkK = clamp(n.curV / n.speed, 0, 1);
  const f = floorAt(r, n.x, n.z);
  n.fy = (f === f ? f : r.y0) - r.y0;
}

/* ══════════════════════════════════════════════════════════
   v99 — 고개 · 말 걸기
   ══════════════════════════════════════════════════════════ */
const CROWD_QUIRK = ['glance', 'halt', 'heavy', 'back', 'freeze', 'halt', 'glance', 'back'];
function npcBones(v) {
  const sk = v.mesh.skeleton;
  if (!v.bones) v.bones = { head: sk.getBoneByName('Head'), neck: sk.getBoneByName('Neck'), ra: sk.getBoneByName('RightArm'), rf: sk.getBoneByName('RightForeArm'), la: sk.getBoneByName('LeftArm'), lf: sk.getBoneByName('LeftForeArm') };
  return v.bones;
}
const _hUp = new THREE.Vector3(0, 1, 0), _hR = new THREE.Vector3();
/** 고개 — 가까이(5m) 있는 나를 눈으로 따라온다(몸은 그대로). 두리번거리는 사람 · 고개 숙인 사람 */
function npcHead(n, dt) {
  const v = n.v, B = npcBones(v);
  if (!B.head) return;
  const PX = M.pos.x * CM, PZ = M.pos.z * CM, pd = n.pd == null ? 1e9 : n.pd;
  let ty = 0, tp = n.quirk === 'heavy' ? 0.3 : 0;
  const talking = n.state === 'talk' && !(n.talk && n.talk.intT > 0);
  /* v101 — 모두가 고개로 나를 따라오니 오히려 무섭지 않았다(사용자 피드백). 고개로 따라오는 건 **얼어붙는 사람 하나**뿐,
     그것도 천천히 · 40° 까지. 나머지는 두리번거림(작게)과 고개 숙임만 */
  if (n.listenT > 0) { n.listenT -= dt; tp = -0.32; }                    // v102 — 안내 방송 — 천장을 올려다본다
  else if (n.state === 'mono') tp = 0.22;                                   // 구석을 보며 고개를 떨군다
  else if (n.quirk === 'freeze' && pd < 520 && !talking) {
    const rel = npcAng(Math.atan2(PX - n.x, PZ - n.z) - n.yaw);
    if (Math.abs(rel) < 1.6) ty = clamp(rel, -0.7, 0.7);
  } else if (n.quirk === 'glance' && n.walkK > 0.4) ty = 0.3 * Math.sin(CROWD.t * 0.7 + n.phase) * Math.sin(CROWD.t * 0.23 + n.phase * 2);
  n.hy = (n.hy || 0) + (ty - (n.hy || 0)) * Math.min(1, dt * 1.2);
  n.hp = (n.hp || 0) + (tp - (n.hp || 0)) * Math.min(1, dt * 1.5);
  if (Math.abs(n.hy) < 0.004 && Math.abs(n.hp) < 0.004) return;
  v.root.updateMatrixWorld(true);
  _hR.set(-Math.cos(n.yaw), 0, Math.sin(n.yaw));
  if (B.neck) boneRotWorld(B.neck, _hUp, n.hy * 0.4);
  boneRotWorld(B.head, _hUp, n.hy * 0.6);
  boneRotWorld(B.head, _hR, -n.hp);
}
/** 하던 말을 끊고 새로 */
function monoForce(n, lines, kind, delay) {
  if (n.mono && n.mono.el) n.mono.el.remove();
  n.mono = { lines, k: -1, t: delay || 0.2, kind: kind || 'mono' };
}
/** 조사(E) — 처음엔 그 사람이 돌아서서 대답한다. 대답하는 동안 한 번 더 조사하면 설명을 연다 */
function npcAsk(n) {
  if (n.asked > 0) return false;
  n.asked = 5;
  const PX = M.pos.x * CM, PZ = M.pos.z * CM;
  if (n.talk) crowdTalkEnd(n.talk);
  if (n.out) {
    if (n.role === 'watch') { monoForce(n, ['…'], 'mono', 0.3); n.cool = 0; return true; }
    if (n.role === 'kid') { n.state = 'stare'; n.tgt = null; n.wait = 3.6; monoForce(n, pickOf(isNightMode() ? ASK_KID : DAY_OUT.near), 'kid', 0.3); return true; }
    n.state = 'look'; n.tgt = null; n.face = { x: PX, z: PZ }; n.wait = 7;
    monoForce(n, pickOf((isNightMode() ? MONO_OUT : DAY_OUT).stranger), 'say', 0.3);
  } else {
    n.state = 'notice'; n.noticeT = 5.5; n.path = []; n.pause = 0;
    monoForce(n, pickOf(!isNightMode() ? DAY_ASK : n.mutter && Math.random() < 0.5 ? ASK_MUTTER : ASK), 'say', 0.35);
  }
  if (!CROWD.askTold && typeof toast === 'function') { CROWD.askTold = true; toast('대답하는 동안 한 번 더 조사하면 그 사람을 자세히 본다', 3200); }
  return true;
}

/* ══════════════════════════════════════════════════════════
   낮(v110) — 공포 없이 관람할 때의 대사. 밤 대사(위)는 그대로 둔다
   ══════════════════════════════════════════════════════════ */
const isNightMode = () => typeof NIGHT === 'undefined' || NIGHT.on;
const DAY_TALKS = [
  ['이 트로피, 작년 최종전 거 맞지?', '응. 그날 비 엄청 왔잖아.', '그래도 끝까지 다 쳤지.'],
  ['사진 속에 너 있다!', '아… 그 벙커샷. 지우고 싶다.', '공은 나왔잖아. 세 번 만에.'],
  ['18번 홀 호수 넘겨 봤어?', '두 번 빠졌어. 공 아직 바닥에 있을걸.', '잠수하면 보인대.'],
  ['끝나고 한 라운드 어때?', '좋지. 이번엔 멀리건 없기.', '… 하나만 쓰자.'],
  ['옛날 스코어카드 보니까 백 개 넘게 쳤네.', '그땐 다 그랬어. 지금은 90대!', '후반만 90대지.'],
  ['우승자의 방 봤어?', '봤지. 초상이 너무 진지해.', '우승할 땐 원래 그래.'],
  ['퍼팅 연습장 가서 내기할래?', 'OK 거리는 한 뼘이다.', '두 뼘.'],
  ['카트 타 봤어? 생각보다 빨라.', '나무에 박을 뻔했어.', '브레이크는 스페이스야.'],
  ['이 사진 몇 년도야?', '창단 첫 해. 다들 폼이 엉망이야.', '지금도 크게 다르진 않아.'],
  ['홀인원 기록은 누구 거야?', '아직 아무도 없대.', '그럼 오늘이다.'],
  ['여기 조명 좋다.', '전시관 같지? 우리 사진인데.', '우리 사진이라 더 좋다.'],
  ['다음 달 정기전 코스 어디야?', '공지 떴어. 이번엔 산악 코스.', '공 많이 챙겨야겠다.'],
];
const DAY_NEAR = [['안녕하세요.'], ['좋은 구경 되세요.'], ['여기 처음 오셨어요?', '트로피실은 꼭 보세요.'], ['사진 갤러리 가 보셨어요?', '다들 젊었더라고요.'], ['아, 지나가세요.']];
const DAY_ASK = [['네?'], ['저요? 그냥 구경 중이에요.'], ['18번 홀 쳐 보셨어요?', '호수 넘기기가 어렵더라고요.'], ['명예의 전당 초상들 멋지죠.'], ['카트 타 보세요. 재밌어요.'], ['스코어카드 보면 다들 고생했어요.']];
const DAY_INTERRUPT = ['아, 안녕하세요.', '같이 보실래요?', '아 죄송해요, 길 막았죠.'];
const DAY_OUT = {
  plaza: [['분수 시원하다.'], ['날씨 좋다. 라운드 나가기 딱이네.']],
  practice: [['한 뼘만 더…', '들어가라!'], ['오늘은 퍼팅이 잘 되네.']],
  kid: [['술래잡기 하자!'], ['나 잡아 봐라!'], ['(깔깔)'], ['엄마 저기 있다!']],
  near: [['안녕하세요!'], ['같이 놀래요?'], ['아저씨도 골프 쳐요?']],
  stranger: [['안녕하세요.', '오늘 날씨 좋네요.'], ['연습 그린 가 보셨어요?', '컵이 넷이에요.']],
};
/** 낮의 선수 이야기 — v95 의 대사(기록은 같고 끝이 밝다) */
function crowdTopicsDay() {
  if (CROWD.topicsDay) return CROWD.topicsDay;
  const A = M.archive || {}, P = (A.players || []).filter((p) => p && p.name);
  const J = (w, a, b) => (typeof josa === 'function' ? josa(w, a, b) : a);
  const f1 = (v) => (+v).toFixed(1);
  const T = { trophies: [], portraits: [], scorecards: [], clips: [], champion: [], photos: [], any: [] };
  const top = (f) => P.slice().sort((a, b) => f(b) - f(a))[0];
  if (P.length) {
    const r1 = P.slice().sort((a, b) => (a.rank || 99) - (b.rank || 99))[0];
    if (r1 && r1.avgStrokes) T.trophies.push([`올해 1위가 ${r1.name}${J(r1.name, '이', '가')}지?`, `평균 ${f1(r1.avgStrokes)}타래. 넘사벽이야.`, '나도 저렇게 치고 싶다.']);
    const bs = P.filter((p) => p.best).sort((a, b) => a.best - b.best)[0];
    if (bs) T.scorecards.push([`${bs.name} 베스트가 ${bs.best}타래.`, '그날 퍼터가 불이었대.', '언젠가 나도 깬다.']);
    const bd = top((p) => p.birdies || 0);
    if (bd && bd.birdies) T.trophies.push([`버디왕은 ${bd.name}${J(bd.name, '이야', '야')}.`, `버디 ${bd.birdies}개? 말이 돼?`, '파 세이브도 잘하더라.']);
    const wn = top((p) => p.roundWins || 0);
    if (wn && wn.roundWins) T.champion.push([`${wn.name} 우승 몇 번 했지?`, `${wn.roundWins}번. 우승자의 방 단골이야.`, '이번엔 좀 쉬어 가라고 해.']);
    const at = top((p) => p.roundsCompleted || 0);
    if (at) T.portraits.push([`${at.name}${J(at.name, '이', '가')} 라운드 제일 많이 나왔대.`, `${at.roundsCompleted}번이나. 개근상이지.`, '성실함이 곧 실력이야.']);
    const eg = P.find((p) => (p.hio || 0) > 0) || P.find((p) => (p.eagles || 0) > 0);
    if (eg) T.trophies.push([`${eg.name} ${eg.hio ? '홀인원' : '이글'} 기록 있대!`, '진짜? 어느 홀에서?', '본인은 아직도 그 얘기만 해.']);
    for (const p of P.slice(0, 14)) {
      if (p.avgStrokes) T.portraits.push([`요즘 ${p.name} 폼 어때?`, `평균 ${f1(p.avgStrokes)}타. 많이 늘었어.`, '다음 라운드가 기대된다.']);
      if (p.best && p.avgStrokes) T.photos.push([`이 사진 ${p.name} 아니야?`, `맞아. 베스트 ${p.best}타 친 날이래.`, '그래서 표정이 좋구나.']);
    }
  }
  const w = typeof recentWinner === 'function' ? recentWinner(A) : null;
  if (w) T.champion.push([`지난번${w.round.course ? ' ' + w.round.course : ''} 라운드 누가 이겼어?`,
    `${w.name}${J(w.name, '이', '가')}.${w.round.best != null ? ' ' + w.round.best + '타로.' : ''}`, '초상 봤어? 표정이 비장하더라.']);
  const cnt = {};
  for (const r of A.rounds || []) if (r.course) cnt[r.course] = (cnt[r.course] || 0) + 1;
  const cs = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
  if (cs) T.scorecards.push([`${cs[0]} 요즘 자주 가네.`, `벌써 ${cs[1]}번째야. 거기 그린 빠르지.`, '벙커만 조심하면 돼.']);
  for (const c of (A.clips || []).slice(0, 8)) {
    if (!c.title) continue;
    T.clips.push([`'${c.title}' 영상 봤어?`, c.players ? `${c.players} 나오는 거? 봤지.` : '봤지. 몇 번을 돌려 봤어.',
      c.comment_count ? `댓글이 ${c.comment_count}개나 달렸더라.` : '다시 봐도 웃겨.']);
  }
  T.any = [...T.portraits, ...T.trophies.slice(0, 2), ...T.champion.slice(0, 1), ...T.clips.slice(0, 2)];
  CROWD.topicsDay = T;
  return T;
}
