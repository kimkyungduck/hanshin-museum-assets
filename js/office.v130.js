/* ══════════════════════════════════════════════════════════
   관리자의 방(v126) — 옛 작업실 자리 · 2층 동쪽 · 관리자만(F2)
   ══════════════════════════════════════════════════════════
   사용자: "느와르, 철학이 주 베이스고 교훈을 얻고 관리자의 마인드를 이해할 수 있는 방.
            나중에 누군가 들어오면 내가 어떤 생각을 했고 어떤 가치관을 가졌는지 알 수 있도록."
   정한 것: 글은 초안을 내가 쓰고 사용자가 고친다 · 축은 셋 — 기록과 기억 / 사람과 관계 / 시간과 유한함 · 관리자만 · 공포는 은은하게만.
     · 들어서면 화면이 흑백으로 바래고(post uNoir) 창밖엔 비. 블라인드 줄무늬 빛 · 책상 스탠드 하나
     · 물건 일곱 = 생각 일곱. 조사하면 [한 줄 → 메모(타자기처럼) → 되묻는 질문] 세 겹으로 읽힌다
     · 일곱을 다 읽으면 책상 서랍이 열린다 — 「다음 관리자에게」
     · 은은하게: 두 번째 잔에서만 김이 오른다 · 눈을 돌린 사이 타자기가 한 글자 찍는다
   ✎ 글을 고칠 곳은 OFFICE_TEXT 한 군데다. */
const OFFICE_TEXT = {
  record: { obj: '타자기', axis: '기록과 기억',
    q: ['사실이란 없다. 오직 해석만이 있을 뿐이다.', '니체, 유고(1886–87)'],
    line: '기록은 편을 들지 않는다.',
    memo: '니체의 말이 맞다면, 기록하는 사람이 할 수 있는 일은 하나뿐이다. 해석을 덧붙이지 않는 것.\n그래서 이 전시관은 고르지 않는다. 자랑스러운 날도, 부끄러운 날도 같은 크기의 종이에 같은 글씨로 남긴다.\n해석은 읽는 사람의 몫으로 남겨 둔다. 그게 기록하는 사람의 겸손이다.',
    ask: '당신은 지금, 어떤 날을 골라 남기고 있는가?' },
  names: { obj: '서류 캐비닛', axis: '기록과 기억',
    q: ['머지않아 너는 모든 것을 잊을 것이고, 머지않아 모든 것이 너를 잊을 것이다.', '마르쿠스 아우렐리우스, 『명상록』 7권'],
    line: '사람은 두 번 잊힌다. 떠날 때, 그리고 아무도 이름을 부르지 않을 때.',
    memo: '황제의 말은 차갑지만 정확하다. 잊힘은 피할 수 없다.\n다만 늦출 수는 있다. 서랍마다 이름을 하나씩 넣어 둔 이유다.\n기억은 저장하는 게 아니라 다시 부르는 것이다. 누군가 이 서랍을 열고 이름 하나를 소리 내어 읽는 동안, 그 사람은 아직 잊히지 않았다.',
    ask: '당신이 마지막으로 소리 내어 불러 본 오래된 이름은 누구인가?' },
  people: { obj: '코르크 보드', axis: '사람과 관계',
    q: ['인간은 본성적으로 폴리스적(사회적) 동물이다.', '아리스토텔레스, 『정치학』 1권'],
    line: '모든 일은 사람 사이에서 일어난다.',
    memo: '아리스토텔레스는 홀로 살 수 있는 자는 짐승이거나 신이라고 했다. 우리는 둘 다 아니다.\n벽에 사진을 붙이고 붉은 실로 이어 보면 안다. 혼자 이룬 줄 알았던 것들도, 실을 당겨 보면 누군가에게 묶여 있다.\n점수는 잊혀도, 그날 누가 곁에 있었는지는 잊히지 않는다.',
    ask: '당신의 실은 누구에게 묶여 있는가?' },
  seat: { obj: '마주 놓인 의자 둘', axis: '사람과 관계',
    q: ['추운 겨울날 고슴도치들은 온기를 나누려 모였다가 서로의 가시에 찔려 흩어졌다. 몇 번을 되풀이한 끝에, 그들은 서로 견딜 수 있는 적당한 거리를 찾아냈다.', '쇼펜하우어, 『소품과 부록』 2권'],
    line: '빈자리도 자리다.',
    memo: '의자 두 개 사이의 거리를 오래 재 보았다. 너무 가까우면 찔리고, 너무 멀면 춥다.\n쉬고 있는 사람의 이름 옆에 💤를 붙이고, 지우지 않았다. 그 사람이 정한 거리를 존중하는 방법이었다.\n떠난 것과 잠시 멀어진 것은 다르다. 의자는 치우지 않는다.',
    ask: '당신은 누구와의 거리를 아직 재고 있는가?' },
  clock: { obj: '멈춘 시계', axis: '시간과 유한함',
    q: ['인생은 시계추처럼 고통과 권태 사이를 오간다.', '쇼펜하우어, 『의지와 표상으로서의 세계』 §57'],
    line: '시간은 기록되는 순간 멈춘다. 그래서 기록한다.',
    memo: '이 시계는 6시 47분에 멈췄다. 고치지 않았다.\n시계추가 멈춘 그 자리에는 고통도 권태도 아닌 한순간이 있다.\n사진 한 장, 스코어카드 한 장을 남기는 일은 시계추를 그 한가운데 세워 두는 일이다.',
    ask: '당신이 멈춰 세워 두고 싶은 한 시각은 언제인가?' },
  end: { obj: '모래시계', axis: '시간과 유한함',
    q: ['우리가 가진 시간이 짧은 것이 아니라, 우리가 많은 시간을 허비하는 것이다.', '세네카, 『인생의 짧음에 관하여』'],
    line: '끝이 있어서, 지금이 의미가 있다.',
    memo: '모래시계를 뒤집을 때마다 세네카를 생각한다. 모래는 늘 충분했다. 내가 흘려보냈을 뿐이다.\n위의 모래는 줄고 아래의 모래는 쌓인다. 잃는 것과 남는 것은 같은 모래다.\n이 모임도, 이 방도 언젠가 끝난다. 끝을 아는 사람만 정성을 들인다.',
    ask: '끝이 정해져 있다면, 당신은 오늘 무엇을 다르게 하겠는가?' },
  mirror: { obj: '금 간 거울', axis: '시간과 유한함',
    q: ['나를 죽이지 못하는 것은 나를 더 강하게 만든다.', '니체, 『우상의 황혼』'],
    line: '무너진 날은 기록에서 빼지 않는다.',
    memo: '거울에 금이 갔을 때 바꾸려다 그만두었다. 금 간 거울에도 얼굴은 비친다. 오히려 더 정직하게.\n니체의 말은 위로가 아니라 조건이다. 무너진 날을 지나온 사람만 그 말을 할 수 있다.\n그래서 그날들을 지우지 않는다. 그날이 지금의 나를 만들었으니까.',
    ask: '당신의 가장 정확한 초상은 어느 날의 얼굴인가?' },
  letter: { obj: '서랍 속 편지', axis: '다음 관리자에게',
    q: ['삶은 뒤를 돌아볼 때 이해되지만, 앞을 향해 살아야 한다.', '키르케고르, 일기(1843)'],
    line: '다음 관리자에게.',
    memo: '이 서랍을 열었다면, 이제 당신이 이 방의 불을 켜고 끄는 사람이다.\n이 방의 물건들은 모두 뒤를 돌아보는 것들이다. 하지만 당신은 앞을 향해 살아야 한다. 이곳은 돌아보는 곳이지 머무는 곳이 아니다.\n부탁이 셋 있다. 하나, 기록을 고르지 말 것. 둘, 점수보다 사람을 먼저 볼 것. 셋, 불은 하나쯤 켜 둘 것.\n— 첫 번째 관리자',
    ask: '당신은 이곳에 무엇을 남기고 갈 것인가?' },
};
/* 곁가지 — 서랍과 상관없이 읽는 물건들(가치관 · 태도) */
const OFFICE_MORE = {
  rules: { obj: '액자 — 관리자의 수칙', axis: '태도',
    q: ['네 의지의 준칙이 언제나 동시에 보편적 입법의 원리로서 타당할 수 있도록 행위하라.', '칸트, 『실천이성비판』'],
    line: '관리자의 수칙',
    memo: '하나. 기록은 고르지 않는다.\n둘. 이름은 지우지 않는다. 쉬는 사람도.\n셋. 점수보다 사람을 먼저 본다.\n넷. 좋은 날은 나누고, 나쁜 날은 함께 남긴다.\n다섯. 처음 온 사람에게 먼저 말을 건다.\n여섯. 규칙은 사람을 지키려고 있다. 거꾸로 되면 규칙을 고친다.\n일곱. 화가 난 날에는 아무것도 기록하지 않는다.\n여덟. 고맙다는 말은 미루지 않는다.\n아홉. 불은 하나쯤 켜 둔다.\n열. 이 수칙도 언젠가 낡는다. 그땐 다음 사람이 고쳐 쓴다.',
    ask: '당신의 수칙은, 모두가 그대로 따라 해도 괜찮은 것인가?' },
  window: { obj: '비 오는 창', axis: '바라보기',
    q: ['사람은 혼자 있을 때만 온전히 자기 자신일 수 있다.', '쇼펜하우어, 『소품과 부록』'],
    line: '창밖의 불빛 하나하나에 저마다의 밤이 있다.',
    memo: '퇴근길이다. 신호가 바뀔 때마다 우산들이 한꺼번에 길을 건넌다. 우산 하나마다 하루가 하나씩 들어 있다.\n이 높이에서 내려다보면 혼자라는 게 무엇인지 안다. 그리고 혼자여야만 보이는 것이 있다는 것도.\n쇼펜하우어는 고독을 견디라고 했다. 나는 이 창 앞에서, 고독이 사람을 미워하지 않고 바라보는 방법이라는 걸 배웠다.',
    ask: '저 횡단보도 위의 누군가에게, 당신도 창 너머의 불빛일까?' },
  chess: { obj: '두다 만 체스판', axis: '선택과 책임',
    q: ['사람을 괴롭히는 것은 일 자체가 아니라, 그 일에 대한 생각이다.', '에픽테토스, 『엥케이리디온』 5'],
    line: '지는 법을 아는 사람이 끝까지 둔다.',
    memo: '이 판은 몇 달째 이대로다. 다음 수를 알지만 두지 않았다.\n진 판이 괴로운 건 진 것 때문이 아니라, 진 나를 어떻게 보느냐 때문이다. 에픽테토스는 그걸 이천 년 전에 알았다.\n졌을 때 판을 엎지 않는 것, 상대의 좋은 수에 고개를 끄덕이는 것. 그걸 배우는 데 가장 오래 걸렸다.',
    ask: '당신은 마지막으로 진 판을 어떻게 접었는가?' },
  gramo: { obj: '축음기', axis: '다시 듣기',
    q: ['음악이 없다면 삶은 하나의 오류일 것이다.', '니체, 『우상의 황혼』'],
    line: '같은 곡도 다시 들으면 다른 곡이다.',
    memo: '판은 그대로인데 듣는 내가 달라져 있다.\n그래서 옛 기록을 다시 꺼내는 일은 과거를 보는 게 아니라 지금의 나를 보는 일이다.\n니체가 음악 없는 삶을 오류라고 한 건, 아마 다시 들을 것이 없는 삶을 말한 것이리라.',
    ask: '다시 들었을 때 다르게 들린 노래가 있는가?' },
  umbrella: { obj: '젖은 우산', axis: '견디기',
    q: ['살아야 할 이유를 아는 사람은 거의 어떤 상황도 견딜 수 있다.', '니체, 『우상의 황혼』'],
    line: '비는 피하는 게 아니라 지나가는 것이다.',
    memo: '우산은 비를 멈추지 못한다. 비 사이를 걸어가게 해 줄 뿐이다.\n힘든 시기도 그렇다. 해결하려 들면 지치고, 지나가려 하면 걸을 수 있다. 걸어갈 이유가 있다면.\n문 앞에 우산을 하나 더 꽂아 둔다. 누가 빈손으로 올지 모르니까. 그게 내 이유 중 하나다.',
    ask: '당신이 빗속을 걸어가는 이유는 무엇인가?' },
  calendar: { obj: '동그라미 친 달력', axis: '평범함',
    q: ['누구도 지금 살고 있는 이 삶 말고는 다른 삶을 잃지 않는다.', '마르쿠스 아우렐리우스, 『명상록』 2권'],
    line: '아무 일도 없었던 날에 동그라미를 쳤다.',
    memo: '기념일엔 다들 동그라미를 친다. 나는 아무 일도 없던 날에 쳤다.\n황제의 말처럼, 우리가 잃을 수 있는 건 오늘뿐이다. 그리고 오늘은 대개 별일 없는 날이다.\n별일 없이 만나 별일 없이 웃고 헤어진 날 — 돌아보니 그게 가장 큰 일이었다.',
    ask: '당신의 달력에서 동그라미가 필요한 평범한 날은 언제인가?' },
  coat: { obj: '외투와 중절모', axis: '떠남',
    q: ['언제든 이 삶을 떠날 수 있는 사람처럼 행하고, 말하고, 생각하라.', '마르쿠스 아우렐리우스, 『명상록』 2권'],
    line: '떠날 때 들고 갈 수 있는 건 외투 한 벌뿐이다.',
    memo: '직함도, 열쇠도, 이 방도 두고 간다.\n가져갈 수 있는 건 함께 걸은 기억과, 내가 어떤 사람이었는지에 대한 남들의 이야기뿐이다.\n그래서 매일 외투를 걸 때 묻는다. 오늘 떠난다면, 오늘의 나로 기억되어도 괜찮은가.',
    ask: '당신이 떠난 뒤, 사람들은 당신을 어떤 문장으로 기억할까?' },
};
/* 책장 — 책마다 여백에 적어 둔 메모(제목은 지어낸 것) */
const OFFICE_BOOKS = [
  { t: '차라투스트라는 이렇게 말했다', a: '니체', q: '춤추는 별을 낳으려면, 너는 자신 안에 혼돈을 품고 있어야 한다.',
    line: '흔들리는 날을 부끄러워하지 않는다.', memo: '여백에 연필로 적혀 있다.\n「혼돈은 실패가 아니다. 별이 태어나기 전의 상태일 뿐이다. 흔들리는 날을 지우지 말 것.」' },
  { t: '의지와 표상으로서의 세계', a: '쇼펜하우어', q: '재능 있는 사람은 아무도 맞히지 못하는 과녁을 맞히고, 천재는 아무도 보지 못하는 과녁을 맞힌다.',
    line: '모두가 같은 과녁을 볼 때, 다른 것을 보는 사람이 하나쯤은 있어야 한다.', memo: '여백에.\n「핀만 보는 사람은 그린을 놓친다. 이 방이 아무도 보지 않던 것을 보는 곳이었으면 한다.」' },
  { t: '명상록', a: '마르쿠스 아우렐리우스', q: '아침에 일어나기 싫을 때는 이렇게 생각하라. 나는 인간으로서 일하기 위해 일어난다.',
    line: '일어나는 이유를 기억해 둔다.', memo: '새벽 티오프 전날 밤, 이 쪽을 접어 두었다.\n「귀찮음은 늘 이유를 댄다. 그러니 나도 내 이유를 적어 둔다.」' },
  { t: '화에 대하여', a: '세네카', q: '분노에 대한 가장 좋은 치료는 늦추는 것이다.',
    line: '화가 난 날에는 아무것도 기록하지 않는다.', memo: '수칙 일곱 번째는 여기서 왔다.\n「하루를 늦추면, 대부분의 분노는 기록할 가치가 없어진다.」' },
  { t: '팡세', a: '파스칼', q: '인간은 자연에서 가장 연약한 한 줄기 갈대일 뿐이다. 그러나 그것은 생각하는 갈대다.',
    line: '우리는 갈대다. 그래도 생각한다.', memo: '여백에.\n「바람 부는 날 18번 홀에 서 보면 안다. 우리는 약하다. 그런데 그 약함을 아는 것이 우리를 바람보다 크게 만든다.」' },
  { t: '에세', a: '몽테뉴', q: '나는 무엇을 아는가?',
    line: '모르는 것을 모른다고 말한다.', memo: '몽테뉴는 저울과 이 질문을 새긴 메달을 지니고 다녔다고 한다.\n「관리자는 모든 걸 알 필요가 없다. 모르는 걸 모른다고 말할 줄 알면 된다.」' },
  { t: '불안의 개념', a: '키르케고르', q: '불안은 자유의 현기증이다.',
    line: '떨림은 고를 수 있다는 증거다.', memo: '여백에.\n「첫 티샷 앞에서 손이 떨리는 건, 그 한 번을 내가 고를 수 있어서다. 불안을 없애려 하지 말 것. 그건 자유의 다른 얼굴이다.」' },
  { t: '논리철학논고', a: '비트겐슈타인', q: '내 언어의 한계는 내 세계의 한계를 의미한다.',
    line: '말을 잃으면 세계도 좁아진다.', memo: '여백에.\n「고맙다는 말을 잃은 사람에게는 고마운 일도 보이지 않는다. 그래서 자주 말한다. 세계를 넓히려고.」' },
  { t: '도덕경', a: '노자', q: '남을 아는 자는 지혜롭고, 자신을 아는 자는 밝다.',
    line: '남을 아는 것보다 나를 아는 것이 어렵다.', memo: '33장에 밑줄.\n「남의 스코어는 잘 외우면서 내 버릇은 잘 모른다. 밝아지려면 거울부터 봐야 한다.」' },
  { t: '메노이케우스에게 보내는 편지', a: '에피쿠로스', q: '죽음은 우리에게 아무것도 아니다. 우리가 있을 때 죽음은 없고, 죽음이 있을 때 우리는 없다.',
    line: '두려워할 것은 끝이 아니다.', memo: '여백에.\n「끝은 내가 없을 때 온다. 그러니 두려워할 것은 끝이 아니라, 끝나기 전에 하지 않은 일이다.」' },
];
/* 휴지통 — 버린 문장들(줄 그은 문장 · 버린 까닭) */
const OFFICE_DRAFTS = [
  { s: '이기는 사람이 기억된다.', why: '틀렸다. 기억되는 건 곁에 있던 사람이다.' },
  { s: '기록은 곧 숫자다.', why: '숫자는 기록의 뼈일 뿐이다. 살은 이야기다.' },
  { s: '관리자는 모든 걸 알고 있어야 한다.', why: '모르는 걸 모른다고 말하는 것 — 그게 관리자의 일이었다.' },
  { s: '떠난 사람의 자리는 정리한다.', why: '정리하지 않기로 했다. 대신 💤를 붙였다.' },
  { s: '완벽한 하루를 남기자.', why: '완벽한 하루에는 기록할 게 별로 없다.' },
  { s: '규칙에는 예외가 없다.', why: '사람에게는 예외가 필요한 날이 있다.' },
  { s: '잊는 것도 능력이다.', why: '맞는 말이라서 버렸다. 잊는 건 각자 하고, 이 방은 기억하기로 했다.' },
  { s: '나는 이 방의 주인이다.', why: '주인이 아니라 잠시 맡아 둔 사람이다.' },
];
/* 메모장 — 오늘의 문장(날짜마다 한 장) */
const OFFICE_DAILY = [
  ['모든 것은 흐른다.', '헤라클레이토스'],
  ['나는 생각한다, 그러므로 나는 존재한다.', '데카르트, 『방법서설』'],
  ['아는 것이 힘이다.', '프랜시스 베이컨'],
  ['만족할 줄 아는 사람이 부유하다.', '노자, 『도덕경』 33장'],
  ['아는 사람은 말하지 않고, 말하는 사람은 알지 못한다.', '노자, 『도덕경』 56장'],
  ['배우고 때때로 익히면 또한 기쁘지 아니한가.', '공자, 『논어』 학이'],
  ['내가 원하지 않는 것을 남에게 하지 말라.', '공자, 『논어』 위령공'],
  ['아는 것을 안다 하고 모르는 것을 모른다 하는 것, 그것이 아는 것이다.', '공자, 『논어』 위정'],
  ['지나침은 모자람과 같다.', '공자, 『논어』 선진'],
  ['친구 없이 살기를 바라는 사람은 아무도 없다.', '아리스토텔레스, 『니코마코스 윤리학』'],
  ['제비 한 마리가 봄을 만들지는 않는다.', '아리스토텔레스, 『니코마코스 윤리학』'],
  ['어떤 것은 우리에게 달려 있고, 어떤 것은 그렇지 않다.', '에픽테토스, 『엥케이리디온』'],
  ['오늘의 일을 붙잡아라. 그러면 내일에 덜 기대게 된다.', '세네카, 『루킬리우스에게 보내는 편지』'],
  ['네 안을 들여다보라. 그 안에 선의 샘이 있다.', '마르쿠스 아우렐리우스, 『명상록』'],
  ['최선의 복수는 그들과 같은 사람이 되지 않는 것이다.', '마르쿠스 아우렐리우스, 『명상록』'],
  ['마음은 이성이 알지 못하는 자신만의 이유를 가지고 있다.', '파스칼, 『팡세』'],
  ['평화는 전쟁이 없는 상태가 아니라, 영혼의 힘에서 나오는 덕이다.', '스피노자, 『정치론』'],
  ['감히 알려고 하라.', '칸트, 『계몽이란 무엇인가』'],
  ['이성은 정념의 노예이며, 또 노예여야만 한다.', '흄, 『인간 본성에 관한 논고』'],
  ['희망은 악 중의 악이다. 인간의 고통을 늘리기 때문이다.', '니체, 『인간적인, 너무나 인간적인』'],
  ['인간은 자유롭도록 선고받았다.', '사르트르, 『실존주의는 휴머니즘이다』'],
];
/* ── 두 번째 밤(v128) — 편지를 읽고 나갔다 다시 오면 방이 달라져 있다 ──
   시계가 다시 가고(실제 시각) · 비가 그치고 달 · 누군가 체스 한 수를 두었고 · 이번엔 내 쪽 잔에서 김 ·
   보드 밖 벽에 빈 사진 한 장(실이 모두 그쪽으로) · 거울에 입김 글씨 · 축음기는 B면 · 캐비닛 맨 아랫칸에 부치지 않은 편지들 ·
   타자기엔 날마다 질문 하나 → 서로 다른 일곱 밤을 오면 책상 위에 마지막 봉투 */
const OFFICE_N2 = {
  clock: { obj: '다시 가는 시계', axis: '두 번째 밤 · 시간',
    q: ['지금 네가 살고 있고 살아온 이 삶을, 너는 다시 한 번, 그리고 무수히 반복해서 살아야 할 것이다.', '니체, 『즐거운 학문』 341'],
    line: '시계가 다시 간다.',
    memo: '누군가 태엽을 감았다. 6시 47분에서 멈춰 있던 바늘이 지금을 가리킨다.\n니체는 물었다. 이 삶이 그대로 영원히 되풀이된다면, 너는 그것을 원하겠느냐고.\n멈춰 세워 두는 건 기록의 일이고, 다시 흐르게 하는 건 사람의 일이다. 되풀이되어도 좋을 하루 — 그게 기록할 가치가 있는 하루다.',
    ask: '오늘이 영원히 되풀이된다면, 당신은 그것을 원하는가?' },
  chess: { obj: '한 수가 놓인 체스판', axis: '두 번째 밤 · 관계',
    q: ['친구란 두 몸에 깃든 하나의 영혼이다.', '아리스토텔레스(디오게네스 라에르티오스, 『그리스 철학자 열전』)'],
    line: '혼자 두는 판은 없다.',
    memo: '몇 달째 그대로이던 판에 한 수가 놓였다. 내가 두지 않은 수다.\n상대가 있다는 것 — 그게 게임이 계속되는 이유다.\n이기고 지는 것보다, 마주 앉아 줄 사람이 있다는 게 먼저다.',
    ask: '당신의 맞은편에 앉아 주는 사람은 누구인가?' },
  seat: { obj: '김이 오르는 잔', axis: '두 번째 밤 · 관계',
    q: ['왜 그를 사랑했느냐고 묻는다면, 그가 그였고 내가 나였기 때문이라고밖에 답할 수 없다.', '몽테뉴, 『에세』 「우정에 대하여」'],
    line: '기다리던 사람이 왔다. 당신이다.',
    memo: '두 번째 잔은 늘 식어 있었다. 오늘은 당신 쪽 잔에서 김이 오른다.\n몽테뉴의 말처럼, 이유는 설명되지 않는다. 그 사람이 그 사람이었을 뿐이다.\n빈자리를 비워 두면 언젠가 누군가 앉는다. 그날을 위해 잔을 데워 두는 것 — 그게 기다림의 예의다.',
    ask: '당신은 누구의 잔을 데워 두고 있는가?' },
  people: { obj: '보드 밖의 빈 사진', axis: '두 번째 밤 · 관계',
    q: ['천 리 길도 한 걸음에서 시작된다.', '노자, 『도덕경』 64장'],
    line: '사진이 한 장 늘었다. 아직 아무것도 찍혀 있지 않다.',
    memo: '보드에 자리가 없어 벽에 따로 붙였다. 붉은 실이 모두 그쪽으로 이어져 있다.\n다음 사람의 자리다. 모든 관계는 누군가 먼저 내디딘 한 걸음에서 시작됐다.\n관계는 완성되는 게 아니라 계속 늘어나는 것이다. 이 보드에는 끝이 없다.',
    ask: '당신이 다음으로 실을 이어 줄 사람은 누구인가?' },
  window: { obj: '비가 그친 창', axis: '두 번째 밤 · 견디기',
    q: ['생각하면 할수록 새롭고 커지는 경탄과 경외로 마음을 채우는 것이 둘 있다. 내 위의 별이 빛나는 하늘과 내 안의 도덕 법칙이다.', '칸트, 『실천이성비판』 맺음말'],
    line: '비가 그쳤다. 그쳤다는 걸 알아차리는 데 한참 걸렸다.',
    memo: '우산들이 사라지고, 젖은 아스팔트 위에서 신호등만 바뀐다.\n힘든 시간은 끝나는 순간을 알려 주지 않는다. 어느 날 문득 창밖이 조용하다는 걸 알게 될 뿐이다.\n그리고 고개를 들면 하늘이 있다. 칸트는 그 하늘과 마음속 법칙, 그 둘이면 충분하다고 했다.',
    ask: '당신의 비는 이미 그쳤는데, 아직 우산을 쓰고 있지는 않은가?' },
  mirror: { obj: '입김 글씨가 남은 거울', axis: '두 번째 밤 · 흔적',
    q: ['괴물과 싸우는 자는 그 과정에서 스스로 괴물이 되지 않도록 조심해야 한다. 네가 오랫동안 심연을 들여다보면, 심연 또한 너를 들여다본다.', '니체, 『선악의 저편』 146'],
    line: '거울에 누군가 입김으로 글씨를 썼다. “여기 있었어.”',
    memo: '지워지기 전에 읽었다. 거울 안쪽에서 쓴 글씨였다.\n오래 들여다본 것은 결국 이쪽을 들여다본다. 오래 지켜 온 이름들이 이제 나를 본다.\n사람이 남기는 흔적은 대개 이렇게 희미하다. 그래서 읽어 주는 사람이 필요하다.',
    ask: '당신은 사라지기 전에 누구의 흔적을 읽어 주었는가?' },
  gramo: { obj: '축음기 — B면', axis: '두 번째 밤 · 다시 듣기',
    q: ['같은 강물에 두 번 들어갈 수는 없다.', '헤라클레이토스'],
    line: '판을 뒤집었다. B면이다.',
    memo: '사람들은 A면만 기억한다. 가장 잘된 곡, 가장 좋은 날.\n그런데 B면에 더 좋은 곡이 있을 때가 많다. 묻히고, 덜 알려진 날들.\n강물이 늘 새것이듯, 같은 판도 뒤집으면 다른 노래가 된다. 이 방은 B면을 위해 있다.',
    ask: '당신 삶의 B면에는 어떤 곡이 있는가?' },
};
/* 캐비닛 맨 아랫칸 — 부치지 않은 편지들 */
const OFFICE_LETTERS = [
  { to: '떠난 사람에게', q: ['우리가 잃은 이들에 대한 기억이 즐거운 기억이 되도록 하자.', '세네카, 『루킬리우스에게 보내는 편지』 63'],
    line: '인사를 제대로 못 했다.', memo: '이 편지도 부치지 못할 것이다. 그래도 쓴다. 쓰는 동안은 당신이 여기 있으니까.\n당신을 떠올리면 아직 아프다. 하지만 세네카의 말처럼, 언젠가는 웃으며 떠올리고 싶다.\n길에서 마주치면, 아무 일 없었던 것처럼 이름을 불러 주겠다.' },
  { to: '십 년 전의 나에게', q: ['너 자신을 알라.', '델포이 신전의 경구 — 소크라테스가 즐겨 인용한'],
    line: '그렇게 서두르지 않아도 된다.', memo: '너는 이기려고 애쓴 사람들을 경쟁자라고 생각했다. 그들이 결국 네 곁에 남는 사람들이다.\n네가 무엇을 원하는지보다, 네가 어떤 사람인지를 먼저 알았어야 했다.\n그리고 — 그날 먼저 사과해라. 생각보다 오래 남는다.' },
  { to: '마지막에 올 사람에게', q: ['모든 고귀한 것은 드문 만큼 어렵다.', '스피노자, 『에티카』 맺음말'],
    line: '불이 하나 켜져 있을 것이다.', memo: '그건 끄는 걸 잊은 게 아니다. 당신을 위해 남겨 둔 것이다.\n아무도 없는 방에 들어서는 게 얼마나 쓸쓸한지 나는 안다. 그 불 하나를 지키는 일은 드물고, 그래서 어렵다.\n당신도 나갈 때, 하나는 켜 두고 가라.' },
  { to: '비에게', q: ['가장 좋은 것은 물과 같다. 물은 만물을 이롭게 하면서도 다투지 않는다.', '노자, 『도덕경』 8장'],
    line: '덕분에 사람들이 한 우산 아래 섰다.', memo: '너 때문에 미뤄진 날이 많았다. 투덜거리기도 했다.\n그런데 돌아보면, 네가 오는 날마다 누군가 우산을 같이 썼다. 너는 다투지 않고 사람들을 가깝게 했다.\n고맙다는 말은 처음이다.' },
  { to: '이 방에게', q: ['세상에서 가장 중요한 일은 자기 자신에게 속하는 법을 아는 것이다.', '몽테뉴, 『에세』 「고독에 대하여」'],
    line: '나는 너를 지켰다고 생각했다.', memo: '돌아보니 네가 나를 지켜 주었다.\n흔들리는 날마다 여기 와서 불을 켜고, 물건들 사이에 앉아 나 자신에게 돌아왔다.\n다음 사람도 그렇게 지켜 주길 바란다.' },
];
/* 타자기 — 날마다 질문 하나(답은 쓰지 않아도 된다) */
const OFFICE_Q = [
  '오늘 고맙다는 말을 미룬 사람이 있는가?', '오늘 누군가의 이름을 다정하게 불렀는가?', '요즘 당신이 가장 자주 하는 변명은 무엇인가?',
  '지금 연락하면 반가워할 사람은 누구인가?', '당신이 지키고 있는 작은 약속 하나는?', '오늘 진 것에서 배운 것은 무엇인가?',
  '끝까지 지키고 싶은 습관 하나는?', '누군가에게 받은 친절 중 아직 갚지 못한 것은?', '오늘 서두르느라 놓친 얼굴이 있는가?',
  '먼저 사과해야 할 일이 아직 남아 있는가?', '당신의 자리를 비워 두고 기다리는 사람은 누구인가?', '오늘 하루를 한 문장으로 기록한다면?',
  '가장 오래 간직한 물건에는 어떤 이야기가 있는가?', '십 년 전의 당신이 지금의 당신을 본다면 무슨 말을 할까?', '모르는 척 지나친 수고는 누구의 것이었나?',
  '오늘 누구를 웃게 했는가?', '잃었다고 생각했는데 사실 남아 있는 것은?', '당신의 좋은 날을 함께 기뻐해 줄 사람은 누구인가?',
  '아직 늦지 않은 일은 무엇인가?', '오늘 어떤 사람으로 기억되고 싶은가?', '내일의 당신에게 남기고 싶은 한 줄은?',
];
/* 일곱 밤을 오면 — 책상 위 마지막 봉투 */
const OFFICE_LAST = { obj: '책상 위 봉투', axis: '일곱 번째 밤',
  q: ['크리톤, 우리는 아스클레피오스에게 닭 한 마리를 빚졌네. 잊지 말고 갚아 주게.', '소크라테스의 마지막 말, 플라톤 『파이돈』'],
  line: '일곱 밤을 와 주었구나.',
  memo: '소크라테스는 마지막 순간에 거창한 말을 남기지 않았다. 갚지 못한 작은 빚을 부탁했을 뿐이다.\n이제 알 것이다. 이 방은 답을 주는 곳이 아니라, 질문을 하나씩 들고 나가는 곳이라는 걸.\n기록은 내가 했다. 기억은 당신이 해 줄 차례다. 다만 가끔, 불이 켜져 있는지 보러 와 달라.\n그 불은 나를 위한 게 아니라, 당신 다음에 올 사람을 위한 것이니까.\n— 첫 번째 관리자',
  ask: '당신이 아직 갚지 못한 작은 빚은 무엇인가?' };
const OFFICE_N2_N = Object.keys(OFFICE_N2).length + OFFICE_LETTERS.length;
const OFFICE_DAYS_GOAL = 7;
const OFFICE_MORE_N = Object.keys(OFFICE_MORE).length + OFFICE_BOOKS.length + OFFICE_DRAFTS.length;
const OFFICE_ORDER = ['record', 'names', 'people', 'seat', 'clock', 'end', 'mirror'];
const OFFICE = { n2: 0, days: new Set(), more: new Set(), cur: {}, gramoT: 0, read: new Set(), built: false, noir: 0, el: null, open: false, typer: null, steam: [], paper: null, paperText: '', typeT: 20, drawer: null, rainT: 0, notes: 0 };
try { (JSON.parse(localStorage.getItem('museum-office-read') || '[]') || []).forEach((k) => OFFICE.read.add(k)); } catch (e) { /* 처음부터 */ }
try { (JSON.parse(localStorage.getItem('museum-office-more') || '[]') || []).forEach((k) => OFFICE.more.add(k)); } catch (e) { /* 처음부터 */ }
try { OFFICE.n2 = +(localStorage.getItem('museum-office-n2') || 0) || 0; (JSON.parse(localStorage.getItem('museum-office-days') || '[]') || []).forEach((k) => OFFICE.days.add(k)); } catch (e) { /* 처음부터 */ }
function officeSave() { try { localStorage.setItem('museum-office-n2', String(OFFICE.n2)); localStorage.setItem('museum-office-days', JSON.stringify([...OFFICE.days])); } catch (e) { /* */ } }

const ofMat = (c, r = 0.6, m = 0) => { const x = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m }); x.userData.noBatch = true; if (M.envIn) { x.envMap = M.envIn; x.envMapIntensity = 0.35; } return x; };
/** 방 안 좌표(m) → 그룹(방 바닥 기준)에 놓기 */
function ofPut(g, obj, x, y, z, ry = 0) { obj.position.set(x, y, z); obj.rotation.y = ry; obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); g.add(obj); return obj; }
function ofBlock(r, x0, x1, z0, z1, h = 120) { M.walls.push({ x0: x0 * CM, x1: x1 * CM, z0: z0 * CM, z1: z1 * CM, y0: r.y0, y1: r.y0 + h }); }
const ofAt = (o, x, y, z) => { o.position.set(x, y, z); return o; };
function ofHit(g, x, y, z, w, h, d, id) {
  const hit = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(x, y, z); g.add(hit);
  const lab = { book: '책장', draft: '휴지통 — 구겨진 종이', daily: '메모장 — 오늘의 문장', last: '책상 위 봉투' }[id] || (OFFICE_TEXT[id] || OFFICE_MORE[id]).obj;
  const info = { id: 'office-' + id, type: 'placard', icon: '🕯', label: lab, title: lab, room: 'workshop', x: x * CM, z: z * CM, y: y * CM, onUse: () => officeRead(id) };
  M.pickables.push(hit); M.artByMesh.set(hit, info);
  return info;
}
function ofCanvasTex(w, h, draw) { const cv = makeCanvas(w, h), c = cv.getContext('2d'); draw(c, w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.userData = { cv }; return t; }

/** 꾸미기 — museum3d dressWorkshop 이 부른다(r: 방, g: 방 그룹 · 바닥 = 0) */
function officeDress(r, g) {
  const O = objMat(), x0 = r.x0 / CM, x1 = r.x1 / CM, z0 = r.z0 / CM, z1 = r.z1 / CM, cx = (x0 + x1) / 2;
  const wood = ofMat(0x2A1C12, 0.45), woodL = ofMat(0x4A3424, 0.5), brass = O.brass, black = ofMat(0x0E0E10, 0.4, 0.3);
  // 바닥 깔개 — 짙은 버건디
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 5.2), ofMat(0x3A1216, 0.95)); rug.rotation.x = -Math.PI / 2; rug.position.set(x1 - 5.0, 0.006, (z0 + z1) / 2); g.add(rug);
  const rug2 = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.4), ofMat(0x2A1A12, 0.95)); rug2.rotation.x = -Math.PI / 2; rug2.position.set(x0 + 4.5, 0.006, z1 - 4.0); g.add(rug2);

  // ── 창(동쪽 벽) — 비 오는 밤 · 블라인드 ──
  const wx = x1 - 0.13, wz = (z0 + z1) / 2;
  const night = ofCanvasTex(512, 384, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0B1018'); gr.addColorStop(1, '#1A1E26'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { const x = Math.random() * w, y = h * 0.45 + Math.random() * h * 0.5, rr = 6 + Math.random() * 22; const b = c.createRadialGradient(x, y, 0, x, y, rr); const col = Math.random() < 0.6 ? '255,210,150' : '180,200,255'; b.addColorStop(0, 'rgba(' + col + ',.5)'); b.addColorStop(1, 'rgba(' + col + ',0)'); c.fillStyle = b; c.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  });
  OFFICE.night = night; const pane = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.75), new THREE.MeshBasicMaterial({ map: night })); pane.position.set(wx, 1.85, wz); pane.rotation.y = -Math.PI / 2; g.add(pane);
  // v130 — 창밖은 따로 그린 도시(city.js) — 비 오는 퇴근길 교차로 · 높은 층
  OFFICE.cityOn = typeof cityPane === 'function' && (g.updateMatrixWorld(true), cityPane(pane, wx, r.y0 / CM + 1.85, wz));
  // 빗줄기 — 흐르는 무늬
  const rain = ofCanvasTex(256, 256, (c, w, h) => { c.clearRect(0, 0, w, h); for (let i = 0; i < 160; i++) { const x = Math.random() * w, y = Math.random() * h, L = 8 + Math.random() * 30; c.strokeStyle = 'rgba(200,215,230,' + (0.12 + Math.random() * 0.25) + ')'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 1, y + L); c.stroke(); } });
  rain.wrapS = rain.wrapT = THREE.RepeatWrapping; rain.repeat.set(2, 1.4);
  const rainM = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.75), new THREE.MeshBasicMaterial({ map: rain, transparent: true, depthWrite: false, opacity: 0.7 })); rainM.position.set(wx - 0.01, 1.85, wz); rainM.rotation.y = -Math.PI / 2; g.add(rainM); OFFICE.rainMesh = rainM;
  OFFICE.rain = rain;
  const slats = []; for (let i = 0; i < 22; i++) slats.push(boxAt(0.04, 0.035, 5.2, wx - 0.05, 0.5 + i * 0.125, wz));
  const blinds = new THREE.Mesh(mergeGeos(slats), ofMat(0x6E685C, 0.7)); blinds.rotation.z = 0; g.add(blinds); OFFICE.blinds = blinds;
  blinds.scale.y = 0.42; blinds.position.y = 3.2 * (1 - 0.42);   // 반쯤 걷어 올렸다 — 아래로 길이 보이게
  // 창틀 — 테두리만(통짜 상자면 창 그림을 가린다)
  g.add(new THREE.Mesh(mergeGeos([boxAt(0.1, 0.12, 5.5, wx - 0.02, 3.285, wz), boxAt(0.14, 0.1, 5.5, wx - 0.04, 0.42, wz),
    boxAt(0.1, 2.98, 0.12, wx - 0.02, 1.85, wz - 2.69), boxAt(0.1, 2.98, 0.12, wx - 0.02, 1.85, wz + 2.69),
    boxAt(0.06, 2.75, 0.06, wx - 0.02, 1.85, wz - 0.87), boxAt(0.06, 2.75, 0.06, wx - 0.02, 1.85, wz + 0.87)]), wood));
  // 블라인드 줄무늬 빛 — 바닥에 비스듬히
  const stripes = ofCanvasTex(256, 256, (c, w, h) => { c.clearRect(0, 0, w, h); for (let i = 0; i < 9; i++) { c.fillStyle = 'rgba(190,205,230,.55)'; c.fillRect(0, i * 28 + 4, w, 14); } const gm = c.createLinearGradient(0, 0, w, 0); gm.addColorStop(0, 'rgba(0,0,0,0)'); gm.addColorStop(1, 'rgba(0,0,0,1)'); c.globalCompositeOperation = 'destination-in'; c.fillStyle = gm; c.fillRect(0, 0, w, h); });
  const sm = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 4.6), new THREE.MeshBasicMaterial({ map: stripes, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }));
  sm.rotation.x = -Math.PI / 2; sm.rotation.z = 0.32; sm.position.set(x1 - 3.6, 0.012, wz + 0.4); g.add(sm);

  // ── 책상 · 타자기 · 스탠드 · 재떨이 · 서랍 ──
  const dx = x1 - 3.0, dz = wz;
  const top = rbox(1.0, 0.06, 2.2, 0.01, wood); top.position.set(dx, 0.78, dz); g.add(top);
  for (const sz of [-1, 1]) { const ped = rbox(0.9, 0.75, 0.5, 0.01, woodL); ped.position.set(dx, 0.375, dz + sz * 0.8); g.add(ped); }
  const drawer = rbox(0.02, 0.16, 0.42, 0.005, wood); drawer.position.set(dx - 0.46, 0.62, dz + 0.8); g.add(drawer);
  const lock = cyl(0.018, 0.018, 0.01, brass, 12); lock.rotation.z = Math.PI / 2; lock.position.set(dx - 0.475, 0.62, dz + 0.8); g.add(lock);
  OFFICE.drawer = { mesh: drawer, lock, x: dx, z: dz + 0.8, open: 0 };
  ofBlock(r, dx - 0.55, dx + 0.55, dz - 1.15, dz + 1.15, 90);
  const chair = rbox(0.55, 0.9, 0.55, 0.06, ofMat(0x1A100C, 0.5)); chair.position.set(dx + 0.85, 0.45, dz); g.add(chair);
  // 타자기
  const tw = new THREE.Group();
  tw.add(ofAt(rbox(0.36, 0.11, 0.3, 0.03, black), 0, 0.055, 0));
  const keysM = ofMat(0xE8E0CC, 0.4); for (let row = 0; row < 3; row++) for (let k = 0; k < 9; k++) { const kk = cyl(0.009, 0.009, 0.012, keysM, 8); kk.position.set(-0.13 + k * 0.032 + row * 0.01, 0.115 + row * 0.012, 0.1 - row * 0.035); tw.add(kk); }
  const roller = cyl(0.025, 0.025, 0.42, black, 12); roller.rotation.z = Math.PI / 2; roller.position.set(0, 0.13, -0.11); tw.add(roller);
  OFFICE.paper = ofCanvasTex(256, 320, (c, w, h) => { c.fillStyle = '#EEE8DA'; c.fillRect(0, 0, w, h); });
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.26), new THREE.MeshStandardMaterial({ map: OFFICE.paper, roughness: 0.9 })); paper.position.set(0, 0.25, -0.12); paper.rotation.x = -0.18; tw.add(paper);
  ofPut(g, tw, dx, 0.81, dz - 0.15, Math.PI / 2);
  ofHit(g, dx, 0.95, dz - 0.15, 0.6, 0.4, 0.6, 'record');
  // 스탠드(초록 갓) — 방에서 가장 밝은 빛
  const lamp = new THREE.Group();
  lamp.add(ofAt(cyl(0.09, 0.1, 0.03, brass, 18), 0, 0.015, 0));
  lamp.add(ofAt(cyl(0.012, 0.012, 0.32, brass, 8), 0, 0.18, 0));
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.14, 0.1, 18, 1, true, 0, Math.PI * 2), ofMat(0x1E5A3A, 0.3, 0.2)); shade.material.side = THREE.DoubleSide; shade.position.y = 0.36; lamp.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xFFE2B0).multiplyScalar(3), toneMapped: false })); bulb.position.y = 0.33; lamp.add(bulb);
  ofPut(g, lamp, dx - 0.15, 0.81, dz + 0.75);
  const li = new THREE.PointLight(0xFFD49A, 11, 7, 1.6); li.position.set(dx - 0.15, 1.1, dz + 0.75); g.add(li);
  // 재떨이 · 연기
  const ash = cyl(0.07, 0.06, 0.03, ofMat(0x6A6A70, 0.3, 0.6), 16); ash.position.set(dx + 0.2, 0.825, dz + 0.55); g.add(ash);
  OFFICE.smokeAt = new THREE.Vector3(dx + 0.2, 0.85, dz + 0.55);

  // ── 서류 캐비닛(남쪽 벽) — 맨 윗칸이 조금 열려 있다 · 위에 라디오 ──
  const kx = x0 + 3.2, kz = z1 - 0.42;
  const cab = rbox(0.6, 1.4, 0.65, 0.02, ofMat(0x5A5E58, 0.5, 0.4)); cab.position.set(kx, 0.7, kz); g.add(cab);
  OFFICE.cab = { kx, kz, low: [] };
  for (let i = 0; i < 4; i++) { const d = rbox(0.54, 0.3, 0.02, 0.005, ofMat(0x6A6E66, 0.45, 0.45)); d.position.set(kx, 0.2 + i * 0.33, kz - 0.33 - (i === 3 ? 0.18 : 0)); g.add(d); const h = rbox(0.12, 0.02, 0.03, 0.005, brass); h.position.set(kx, 0.28 + i * 0.33, kz - 0.35 - (i === 3 ? 0.18 : 0)); g.add(h); if (i === 0) OFFICE.cab.low.push(d, h); }
  for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.24, 0.012), ofMat(i % 2 ? 0xC8B488 : 0xB09A6A, 0.85)); f.position.set(kx, 1.1, kz - 0.2 - i * 0.03); g.add(f); }
  const radio = rbox(0.42, 0.26, 0.2, 0.03, woodL); radio.position.set(kx, 1.53, kz); g.add(radio);
  const grill = new THREE.Mesh(new THREE.CircleGeometry(0.08, 18), ofMat(0x2A2018, 0.8)); grill.position.set(kx - 0.08, 1.53, kz - 0.101); grill.rotation.y = Math.PI; g.add(grill);
  ofBlock(r, kx - 0.35, kx + 0.35, kz - 0.4, kz + 0.35, 160);
  ofHit(g, kx, 1.0, kz - 0.3, 0.8, 1.8, 0.6, 'names');

  // ── 코르크 보드(북쪽 벽) — 회원 사진 · 붉은 실 ──
  const bx = x0 + 6.0, bz = z0 + 0.16;   // 벽 안쪽 면 = 경계 + 12cm
  const board = rbox(3.6, 1.7, 0.04, 0.01, ofMat(0x8A6A44, 0.95)); board.position.set(bx, 1.75, bz + 0.02); g.add(board);
  const fr = rbox(3.75, 1.85, 0.03, 0.01, wood); fr.position.set(bx, 1.75, bz); g.add(fr);
  // 회원 전체 — 사진(없으면 이름을 타자로 친 카드) · 아래 이름표(쉬는 사람은 💤)
  // ⚠️ 사진 재질은 noBatch — 방 배칭이 사진이 오기 전에 같은 재질끼리 합쳐서 한 사람으로 도배됐다(v126)
  const folks = (M.players || []).map((p) => p.name).filter(Boolean), pins = [];
  const resting = new Set(((M.archive || {}).resting || []).map((x) => x && x.name));
  const loader = new THREE.TextureLoader();
  const card = (name) => ofCanvasTex(170, 210, (c, w, h) => {
    c.fillStyle = '#E4DCC8'; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(160,40,40,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 46); c.lineTo(w, 46); c.stroke();
    c.strokeStyle = 'rgba(90,120,170,.28)'; for (let y = 70; y < h; y += 22) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.fillStyle = '#1A1612'; c.font = 'bold 26px "Courier New", serif'; c.textAlign = 'center'; c.fillText(name || '—', w / 2, 34);
    c.font = '15px "Courier New", serif'; c.fillStyle = 'rgba(26,22,18,.7)'; c.fillText('— 기억할 것 —', w / 2, 96);
  });
  const tag = (name) => ofCanvasTex(200, 52, (c, w, h) => {
    c.fillStyle = '#EDE6D2'; c.fillRect(0, 0, w, h); c.fillStyle = '#16120E'; c.font = 'bold 26px "Courier New", serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(name + (resting.has(name) ? ' 💤' : ''), w / 2, h / 2 + 1);
  });
  const nF = Math.max(1, folks.length), rows = nF <= 10 ? 2 : 3, cols = Math.ceil(nF / rows);
  const cw = 3.3 / cols, pw = Math.min(0.34, cw * 0.74), phH = pw * 1.24, gap = 1.46 / rows, top0 = 2.6 - 0.1 - phH / 2;
  folks.forEach((name, i) => {
    const row = Math.floor(i / cols), col = i % cols, inRow = Math.min(cols, nF - row * cols);
    const px = bx - (inRow - 1) * cw / 2 + col * cw + (Math.random() - 0.5) * cw * 0.12, py = top0 - row * gap + (Math.random() - 0.5) * 0.05;
    const pm = new THREE.MeshStandardMaterial({ color: 0xD8D2C4, roughness: 0.9 }); pm.userData.noBatch = true;
    const url = (M.faces || {})[name];
    if (url) loader.load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; pm.map = t; pm.needsUpdate = true; });
    else pm.map = card(name);
    const rz = (Math.random() - 0.5) * 0.14;
    const ph = new THREE.Mesh(new THREE.PlaneGeometry(pw, phH), pm); ph.position.set(px, py, bz + 0.05); ph.rotation.z = rz; g.add(ph);
    const tm = new THREE.MeshStandardMaterial({ map: tag(name), roughness: 0.9 }); tm.userData.noBatch = true;
    const tg = new THREE.Mesh(new THREE.PlaneGeometry(pw * 0.9, pw * 0.23), tm); tg.position.set(px, py - phH / 2 - pw * 0.1, bz + 0.055); tg.rotation.z = -rz * 0.5; g.add(tg);
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), ofMat(0xB01818, 0.4)); pin.position.set(px, py + phH / 2 - 0.03, bz + 0.07); g.add(pin); pins.push(pin.position.clone());
  });
  const lp = []; for (let i = 0; i < pins.length; i++) for (const j of [i + 1, i + cols, i + cols + 1]) if (j < pins.length && Math.random() < 0.7) lp.push(pins[i], pins[j]);
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lp), new THREE.LineBasicMaterial({ color: 0xB01818 })));
  OFFICE.boardAt = { bx, bz, pins, pw, phH };
  ofHit(g, bx, 1.75, bz + 0.2, 3.6, 1.7, 0.3, 'people');
  // 액자등 — 보드 위 황동 막대 하나
  const pl = cyl(0.025, 0.025, 1.4, brass, 10); pl.rotation.z = Math.PI / 2; pl.position.set(bx, 2.78, bz + 0.22); g.add(pl);
  const pli = new THREE.PointLight(0xFFD49A, 8, 4.5, 1.6); pli.position.set(bx, 2.7, bz + 0.6); g.add(pli);

  // ── 마주 놓인 의자 둘 · 작은 탁자 · 잔 둘(하나에서만 김) ──
  const sx = x0 + 5.5, sz = z1 - 3.4;
  for (const s of [-1, 1]) {
    const arm = new THREE.Group();
    arm.add(ofAt(rbox(0.8, 0.42, 0.8, 0.08, ofMat(0x3A1A14, 0.7)), 0, 0.3, 0));
    arm.add(ofAt(rbox(0.8, 0.6, 0.18, 0.08, ofMat(0x3A1A14, 0.7)), 0, 0.75, -0.32));
    for (const ax of [-0.36, 0.36]) arm.add(ofAt(rbox(0.14, 0.3, 0.75, 0.05, ofMat(0x3A1A14, 0.7)), ax, 0.62, 0));
    ofPut(g, arm, sx + s * 1.0, 0, sz, s > 0 ? -Math.PI / 2 : Math.PI / 2);
    ofBlock(r, sx + s * 1.0 - 0.45, sx + s * 1.0 + 0.45, sz - 0.45, sz + 0.45, 100);
    if (s > 0) OFFICE.chair2 = arm;
  }
  const tbl = cyl(0.32, 0.32, 0.04, wood, 22); tbl.position.set(sx, 0.55, sz); g.add(tbl);
  const leg = cyl(0.04, 0.12, 0.54, wood, 10); leg.position.set(sx, 0.27, sz); g.add(leg);
  const glassM = new THREE.MeshStandardMaterial({ color: 0xD8E4E8, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.35 });
  for (const s of [-1, 1]) { const gl = cyl(0.035, 0.03, 0.08, glassM, 14); gl.position.set(sx + s * 0.14, 0.61, sz + 0.05); g.add(gl); const liq = cyl(0.032, 0.03, 0.03, ofMat(0x8A4A14, 0.2), 14); liq.position.set(sx + s * 0.14, 0.59, sz + 0.05); g.add(liq); }
  OFFICE.steamAt = new THREE.Vector3(sx + 0.14, 0.66, sz + 0.05); OFFICE.steamMine = new THREE.Vector3(sx - 0.14, 0.66, sz + 0.05);
  ofHit(g, sx, 0.6, sz, 2.6, 1.2, 1.0, 'seat');
  // 플로어 스탠드 — 의자 곁, 갓 아래로만 빛이 떨어진다
  const fl = new THREE.Group();
  fl.add(ofAt(cyl(0.16, 0.18, 0.03, brass, 16), 0, 0.015, 0)); fl.add(ofAt(cyl(0.014, 0.014, 1.5, brass, 8), 0, 0.77, 0));
  const fsh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.26, 18, 1, true), ofMat(0xD8C8A0, 0.8)); fsh.material.side = THREE.DoubleSide; fsh.position.y = 1.55; fl.add(fsh);
  ofPut(g, fl, sx - 1.0, 0, sz - 0.85);
  const fli = new THREE.PointLight(0xFFCF90, 8, 5.5, 1.6); fli.position.set(sx - 1.0, 1.45, sz - 0.85); g.add(fli);

  // ── 멈춘 시계(서쪽 벽) · 금 간 거울(서쪽 벽) ──
  const clk = ofCanvasTex(256, 256, (c) => officeClockDraw(c, 6, 47, null)); OFFICE.clock = clk;
  const cm = new THREE.Mesh(new THREE.CircleGeometry(0.34, 32), new THREE.MeshStandardMaterial({ map: clk, roughness: 0.6 })); cm.position.set(x0 + 0.17, 2.35, z0 + 3.0); cm.rotation.y = Math.PI / 2; g.add(cm);
  const cr = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.025, 8, 32), brass); cr.position.copy(cm.position); cr.rotation.y = Math.PI / 2; g.add(cr);
  ofHit(g, x0 + 0.3, 2.35, z0 + 3.0, 0.3, 0.8, 0.8, 'clock');
  const crack = ofCanvasTex(256, 384, (c, w, h) => {
    c.clearRect(0, 0, w, h); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1.4;
    const cxp = w * 0.62, cyp = h * 0.38; for (let i = 0; i < 9; i++) { let x = cxp, y = cyp; const a = i / 9 * 6.28 + Math.random() * 0.4; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 8; j++) { x += Math.cos(a + (Math.random() - 0.5) * 0.6) * 22; y += Math.sin(a + (Math.random() - 0.5) * 0.6) * 22; c.lineTo(x, y); } c.stroke(); }
    c.beginPath(); c.arc(cxp, cyp, 14, 0, 6.28); c.stroke();
  });
  const mir = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.5), new THREE.MeshStandardMaterial({ color: 0x9AA2A6, roughness: 0.04, metalness: 1, envMap: M.envIn || null, envMapIntensity: 1.2 }));
  mir.position.set(x0 + 0.17, 1.6, z1 - 6.2); mir.rotation.y = Math.PI / 2; g.add(mir);
  const mc = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.5), new THREE.MeshBasicMaterial({ map: crack, transparent: true, depthWrite: false })); mc.position.set(x0 + 0.175, 1.6, z1 - 6.2); mc.rotation.y = Math.PI / 2; g.add(mc);
  const mf = rbox(0.05, 1.62, 1.07, 0.01, brass); mf.position.set(x0 + 0.15, 1.6, z1 - 6.2); g.add(mf);
  ofHit(g, x0 + 0.35, 1.6, z1 - 6.2, 0.4, 1.6, 1.0, 'mirror');
  // 벽등 — 시계와 거울 사이, 흐리게
  const scz = (z0 + 3.0 + z1 - 6.2) / 2;
  const sc = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xFFE2B0).multiplyScalar(1.6) })); sc.rotation.x = Math.PI; sc.position.set(x0 + 0.2, 2.2, scz); g.add(sc);
  const sci = new THREE.PointLight(0xFFD49A, 6, 4.5, 1.6); sci.position.set(x0 + 0.35, 2.1, scz); g.add(sci);

  // ── 모래시계 — 작은 탁자 위(북서쪽) ──
  const hx = x0 + 2.0, hz = z0 + 2.2;
  const st = cyl(0.25, 0.25, 0.04, wood, 18); st.position.set(hx, 0.7, hz); g.add(st);
  const sl = cyl(0.035, 0.1, 0.68, wood, 10); sl.position.set(hx, 0.34, hz); g.add(sl);
  const hg = new THREE.Group();
  for (const y of [0, 0.34]) hg.add(ofAt(cyl(0.09, 0.09, 0.02, wood, 16), 0, y, 0));
  for (const a of [0, 2.1, 4.2]) hg.add(ofAt(cyl(0.008, 0.008, 0.34, wood, 6), Math.cos(a) * 0.075, 0.17, Math.sin(a) * 0.075));
  const gb = new THREE.Mesh(new THREE.LatheGeometry([[0.0, 0.0], [0.06, 0.01], [0.065, 0.06], [0.04, 0.12], [0.008, 0.16], [0.04, 0.2], [0.065, 0.26], [0.06, 0.31], [0.0, 0.32]].map(([a, b]) => new THREE.Vector2(a, b)), 20), glassM); gb.position.y = 0.01; hg.add(gb);
  const sandM = ofMat(0xC8A060, 0.9); const sTop = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.06, 14), sandM); sTop.rotation.x = Math.PI; sTop.position.y = 0.22; hg.add(sTop);
  const sBot = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.05, 14), sandM); sBot.position.y = 0.04; hg.add(sBot);
  const stream = cyl(0.002, 0.002, 0.13, sandM, 4); stream.position.y = 0.1; hg.add(stream);
  ofPut(g, hg, hx, 0.72, hz); OFFICE.sand = { sTop, sBot };
  ofHit(g, hx, 0.9, hz, 0.6, 0.6, 0.6, 'end');

  // ── 외투 걸이(트렌치코트 · 중절모) ──
  const rk = new THREE.Group(); rk.add(ofAt(cyl(0.02, 0.02, 1.8, wood, 8), 0, 0.9, 0));
  rk.add(ofAt(cyl(0.18, 0.2, 0.03, wood, 14), 0, 0.015, 0));
  const coat = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.1, 10, 1, true), ofMat(0x6A5A44, 0.85)); coat.material.side = THREE.DoubleSide; coat.position.set(0.05, 1.15, 0); rk.add(coat);
  const hat = new THREE.Group(); hat.add(ofAt(cyl(0.17, 0.17, 0.012, ofMat(0x1A1A1C, 0.7), 20), 0, 0, 0)); hat.add(ofAt(cyl(0.09, 0.11, 0.12, ofMat(0x1A1A1C, 0.7), 16), 0, 0.06, 0)); hat.position.set(0, 1.83, 0); rk.add(hat);
  ofPut(g, rk, x1 - 1.0, 0, z0 + 1.0);

  ofHit(g, x1 - 1.0, 1.25, z0 + 1.0, 0.6, 1.7, 0.6, 'coat');

  // ── 책장(서쪽 벽 남쪽) — 책마다 여백의 메모 ──
  {
    const bxx = x0 + 0.12 + 0.2, bzc = z1 - 3.2, W = 3.4, H = 2.3, shelfM = ofMat(0x24170F, 0.55);
    const parts = [boxAt(0.4, H, 0.05, bxx, H / 2, bzc - W / 2), boxAt(0.4, H, 0.05, bxx, H / 2, bzc + W / 2), boxAt(0.03, H, W, bxx - 0.19, H / 2, bzc)];
    for (let k = 0; k < 6; k++) parts.push(boxAt(0.4, 0.035, W, bxx, 0.04 + k * 0.45, bzc));
    g.add(new THREE.Mesh(mergeGeos(parts), shelfM));
    const pal = [0x5A1E1A, 0x1E2E3E, 0x2E3A22, 0x6A5236, 0x3A2A3E, 0xB8A88A], byC = pal.map(() => []);
    let rnd2 = 7; const R = () => { rnd2 = (rnd2 * 9301 + 49297) % 233280; return rnd2 / 233280; };
    for (let k = 0; k < 5; k++) {
      let z = bzc - W / 2 + 0.06; const y = 0.06 + k * 0.45;
      while (z < bzc + W / 2 - 0.08) {
        if (R() < 0.08) { z += 0.12 + R() * 0.2; continue; }            // 빈칸
        const t = 0.025 + R() * 0.045, h = 0.26 + R() * 0.13, d = 0.22 + R() * 0.1;
        byC[Math.floor(R() * pal.length)].push(boxAt(d, h, t, bxx + 0.02, y + h / 2, z + t / 2)); z += t + 0.003;
      }
    }
    pal.forEach((c, k) => { if (byC[k].length) g.add(new THREE.Mesh(mergeGeos(byC[k]), ofMat(c, 0.75))); });
    // 눕혀 둔 책 한 권 · 그 위 안경
    const lay = rbox(0.24, 0.05, 0.32, 0.005, ofMat(0x5A1E1A, 0.7)); lay.position.set(bxx + 0.02, 2.31 + 0.05, bzc + 0.6); g.add(lay);
    ofBlock(r, x0, x0 + 0.6, bzc - W / 2 - 0.05, bzc + W / 2 + 0.05, 230);
    ofHit(g, bxx + 0.25, 1.2, bzc, 0.3, 2.3, W, 'book');
  }

  // ── 휴지통 · 구겨진 종이(책상 곁) ──
  {
    const wbx = dx - 0.1, wbz = dz - 1.55;
    const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.34, 18, 1, true), ofMat(0x2A2A2C, 0.5, 0.5)); bin.material.side = THREE.DoubleSide; bin.position.set(wbx, 0.17, wbz); g.add(bin);
    const paperM = ofMat(0xE6E0D2, 0.95);
    for (const [ox, oy, oz, sc] of [[0, 0.33, 0, 1], [0.06, 0.36, 0.04, 0.8], [-0.05, 0.34, -0.05, 0.9], [0.32, 0.04, 0.12, 0.85], [-0.28, 0.04, 0.3, 0.75], [0.1, 0.04, -0.34, 0.9]]) {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.055 * sc, 0), paperM); b.position.set(wbx + ox, oy, wbz + oz); b.rotation.set(ox * 9, oz * 7, oy * 5); g.add(b);
    }
    ofHit(g, wbx, 0.25, wbz, 0.6, 0.5, 0.6, 'draft');
  }

  // ── 메모장(책상 위) — 오늘의 문장 ──
  {
    const np = ofCanvasTex(160, 210, (c, w, h) => { c.fillStyle = '#EDE6D2'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(80,100,140,.3)'; for (let y = 40; y < h; y += 18) { c.beginPath(); c.moveTo(8, y); c.lineTo(w - 8, y); c.stroke(); } c.fillStyle = '#2A2018'; c.font = '16px "Courier New", serif'; c.fillText('오늘의 문장 —', 14, 32); for (let k = 0; k < 4; k++) c.fillRect(16, 52 + k * 18, 60 + ((k * 37) % 70), 2); });
    const pad = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.2), new THREE.MeshStandardMaterial({ map: np, roughness: 0.9 })); pad.material.userData.noBatch = true;
    pad.rotation.x = -Math.PI / 2; pad.rotation.z = 0.25; pad.position.set(dx - 0.22, 0.812, dz + 0.32); g.add(pad);
    const pen = cyl(0.005, 0.005, 0.16, ofMat(0xC8A040, 0.5), 6); pen.rotation.z = Math.PI / 2; pen.rotation.y = 0.6; pen.position.set(dx - 0.12, 0.818, dz + 0.36); g.add(pen);
    ofHit(g, dx - 0.22, 0.85, dz + 0.32, 0.26, 0.12, 0.26, 'daily');
  }

  // ── 액자 — 관리자의 수칙(북쪽 벽 동편) ──
  {
    const fx = x1 - 4.2, fz = z0 + 0.16;
    const tex = ofCanvasTex(520, 700, (c, w, h) => {
      c.fillStyle = '#E9E2CE'; c.fillRect(0, 0, w, h); c.strokeStyle = '#2A2018'; c.lineWidth = 2; c.strokeRect(22, 22, w - 44, h - 44);
      c.fillStyle = '#1A140E'; c.textAlign = 'center'; c.font = 'bold 34px "Noto Serif KR", serif'; c.fillText('관리자의 수칙', w / 2, 86);
      c.textAlign = 'left'; c.font = '19px "Noto Serif KR", serif';
      OFFICE_MORE.rules.memo.split('\n').forEach((L, k) => { const t = L.length > 24 ? L.slice(0, 23) + '…' : L; c.fillText(t, 50, 150 + k * 50); });
    });
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 1.05), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 })); pic.material.userData.noBatch = true; pic.position.set(fx, 1.7, fz + 0.03); g.add(pic);
    const frm = rbox(0.9, 1.17, 0.04, 0.005, wood); frm.position.set(fx, 1.7, fz + 0.005); g.add(frm);
    ofHit(g, fx, 1.7, fz + 0.2, 0.95, 1.2, 0.3, 'rules');
  }

  // ── 두다 만 체스판 · 의자 둘 · 위에 낮게 걸린 등 ──
  {
    const chx = cx + 1.4, chz = z0 + 3.4;
    const board = ofCanvasTex(256, 256, (c, w) => { const q = w / 8; for (let a = 0; a < 8; a++) for (let b = 0; b < 8; b++) { c.fillStyle = (a + b) % 2 ? '#2A2018' : '#D8CCB0'; c.fillRect(a * q, b * q, q, q); } });
    const tb = rbox(0.72, 0.05, 0.72, 0.01, wood); tb.position.set(chx, 0.72, chz); g.add(tb);
    const lg = cyl(0.04, 0.14, 0.7, wood, 10); lg.position.set(chx, 0.35, chz); g.add(lg);
    const bd = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshStandardMaterial({ map: board, roughness: 0.4 })); bd.material.userData.noBatch = true; bd.rotation.x = -Math.PI / 2; bd.position.set(chx, 0.747, chz); g.add(bd);
    const wM = ofMat(0xE8E0CC, 0.35), bM = ofMat(0x111114, 0.3, 0.2), q = 0.5 / 8, at = (a, b) => [chx - 0.25 + q * (a + 0.5), chz - 0.25 + q * (b + 0.5)];
    const piece = (a, b, m, tall, fallen) => {
      const [px, pz] = at(a, b), gp = new THREE.Group();
      gp.add(ofAt(cyl(0.017, 0.021, 0.012, m, 12), 0, 0.006, 0)); gp.add(ofAt(cyl(0.008, 0.014, tall, m, 10), 0, 0.012 + tall / 2, 0));
      gp.add(ofAt(new THREE.Mesh(new THREE.SphereGeometry(0.013, 10, 8), m), 0, 0.016 + tall, 0));
      if (tall > 0.05) gp.add(ofAt(rbox(0.006, 0.022, 0.006, 0.001, m), 0, 0.04 + tall, 0));
      gp.position.set(px, 0.748, pz); if (fallen) { gp.rotation.z = Math.PI / 2; gp.position.y += 0.02; gp.position.x += 0.03; }
      g.add(gp); return gp;
    };
    [[1, 6], [2, 5], [4, 6], [5, 6], [6, 5]].forEach(([a, b]) => piece(a, b, wM, 0.025));
    [[2, 1], [3, 2], [5, 1], [6, 2]].forEach(([a, b]) => piece(a, b, bM, 0.025));
    piece(4, 7, wM, 0.06); OFFICE.chessMove = { p: piece(3, 4, bM, 0.06), to: at(4, 5) }; piece(6, 3, bM, 0.045); piece(0, 0, wM, 0.06, true);   // 쓰러진 왕 하나
    for (const s of [-1, 1]) {
      const ch = new THREE.Group(); ch.add(ofAt(rbox(0.45, 0.05, 0.45, 0.01, wood), 0, 0.46, 0)); ch.add(ofAt(rbox(0.45, 0.5, 0.05, 0.01, wood), 0, 0.72, -0.2));
      for (const [lx, lz] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) ch.add(ofAt(cyl(0.02, 0.02, 0.45, wood, 6), lx, 0.225, lz));
      ofPut(g, ch, chx, 0, chz + s * 0.62, s > 0 ? Math.PI : 0);
    }
    ofBlock(r, chx - 0.45, chx + 0.45, chz - 0.9, chz + 0.9, 90);
    const cord = cyl(0.004, 0.004, (r.h / CM) - 2.45, black, 4); cord.position.set(chx, ((r.h / CM) + 2.45) / 2, chz); g.add(cord);
    const psh = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.16, 18, 1, true), ofMat(0x1E1E20, 0.4, 0.4)); psh.material.side = THREE.DoubleSide; psh.position.set(chx, 2.4, chz); g.add(psh);
    const pbulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xFFE2B0).multiplyScalar(2.5), toneMapped: false })); pbulb.position.set(chx, 2.35, chz); g.add(pbulb);
    const pli2 = new THREE.PointLight(0xFFD49A, 7, 4.5, 1.6); pli2.position.set(chx, 2.2, chz); g.add(pli2);
    ofHit(g, chx, 0.85, chz, 0.75, 0.3, 0.75, 'chess');
  }

  // ── 축음기(남쪽 벽 · 낮은 장 위) ──
  {
    const gx = cx + 1.8, gz = z1 - 0.12 - 0.26;
    const sb = rbox(1.6, 0.78, 0.48, 0.01, wood); sb.position.set(gx, 0.39, gz); g.add(sb);
    for (const s of [-1, 1]) { const dr = rbox(0.74, 0.6, 0.02, 0.005, woodL); dr.position.set(gx + s * 0.39, 0.4, gz - 0.25); g.add(dr); }
    const base = rbox(0.38, 0.12, 0.36, 0.01, woodL); base.position.set(gx - 0.25, 0.84, gz); g.add(base);
    const disk = new THREE.Group(); disk.add(cyl(0.15, 0.15, 0.008, ofMat(0x0C0C0E, 0.25, 0.1), 28));
    const lbl = cyl(0.045, 0.045, 0.01, ofMat(0x8A2A1E, 0.7), 18); OFFICE.gramoLbl = lbl; lbl.position.y = 0.001; disk.add(lbl);
    disk.position.set(gx - 0.25, 0.905, gz); g.add(disk); OFFICE.disk = disk;
    const arm = cyl(0.006, 0.006, 0.2, brass, 6); arm.rotation.z = Math.PI / 2; arm.rotation.y = 0.5; arm.position.set(gx - 0.17, 0.93, gz + 0.1); g.add(arm);
    const horn = new THREE.Mesh(new THREE.LatheGeometry([[0.012, 0], [0.02, 0.12], [0.05, 0.26], [0.13, 0.38], [0.2, 0.42]].map(([a, b]) => new THREE.Vector2(a, b)), 24), brass);
    horn.material = brass.clone(); horn.material.side = THREE.DoubleSide; horn.material.userData.noBatch = true;
    horn.scale.setScalar(0.8); horn.rotation.set(-0.75, 0, -0.35); horn.position.set(gx - 0.12, 0.9, gz + 0.15); g.add(horn);   // 뒤쪽에서 솟아 판이 보이게
    // 레코드 몇 장(세워서)
    for (let k = 0; k < 5; k++) { const rec = rbox(0.012, 0.3, 0.3, 0.003, ofMat([0x2A1E16, 0x6A5236, 0x1E2E3E, 0x5A1E1A, 0x3A3A3A][k], 0.8)); rec.position.set(gx + 0.25 + k * 0.03, 0.93, gz); rec.rotation.z = 0.06 * k; g.add(rec); }
    ofBlock(r, gx - 0.82, gx + 0.82, gz - 0.26, gz + 0.26, 90);
    ofHit(g, gx - 0.2, 1.0, gz - 0.05, 0.7, 0.5, 0.5, 'gramo');
  }

  // ── 우산꽂이 · 젖은 우산 · 물웅덩이(외투 걸이 곁) ──
  {
    const ux = x1 - 1.65, uz = z0 + 0.62;
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.46, 16, 1, true), ofMat(0x3A3A3C, 0.4, 0.6)); st.material.side = THREE.DoubleSide; st.position.set(ux, 0.23, uz); g.add(st);
    for (const [ox, rz2, c] of [[0.02, 0.12, 0x101012], [-0.03, -0.1, 0x2A1A14]]) {
      const ub = new THREE.Group(); ub.add(ofAt(new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.62, 10), ofMat(c, 0.25, 0.1)), 0, 0.31, 0));
      ub.add(ofAt(cyl(0.005, 0.005, 0.3, black, 6), 0, 0.7, 0));
      const hd = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 14, Math.PI), wood); hd.position.set(0.035, 0.85, 0); ub.add(hd);
      ub.position.set(ux + ox, 0.08, uz); ub.rotation.z = rz2; g.add(ub);
    }
    const pud = new THREE.Mesh(new THREE.CircleGeometry(0.34, 24), new THREE.MeshStandardMaterial({ color: 0x0A0A0C, roughness: 0.04, metalness: 0.6, transparent: true, opacity: 0.7, envMap: M.envIn || null }));
    pud.material.userData.noBatch = true; pud.rotation.x = -Math.PI / 2; pud.scale.set(1, 0.7, 1); pud.position.set(ux + 0.05, 0.004, uz + 0.08); g.add(pud);
    ofHit(g, ux, 0.5, uz, 0.4, 0.9, 0.4, 'umbrella');
  }

  // ── 달력(동쪽 벽 · 창 북쪽) — 아무 일도 없던 날에 동그라미 ──
  {
    const now = new Date(), Y = now.getFullYear(), Mo = now.getMonth(), first = new Date(Y, Mo, 1).getDay(), days = new Date(Y, Mo + 1, 0).getDate();
    const circ = 1 + ((Y * 7 + Mo * 13) % Math.max(1, days - 2));
    const tex = ofCanvasTex(300, 420, (c, w, h) => {
      c.fillStyle = '#EAE4D2'; c.fillRect(0, 0, w, h); c.fillStyle = '#1A140E'; c.textAlign = 'center';
      c.font = 'bold 44px "Noto Serif KR", serif'; c.fillText((Mo + 1) + '월', w / 2, 70); c.font = '14px serif'; c.fillText(String(Y), w / 2, 94);
      const cw2 = (w - 30) / 7; c.font = '18px "Courier New", serif';
      for (let d = 1; d <= days; d++) { const k = first + d - 1, col = k % 7, row = Math.floor(k / 7), X = 15 + cw2 * (col + 0.5), Yy = 140 + row * 46;
        c.fillStyle = col === 0 ? '#8A2A1E' : '#1A140E'; c.fillText(String(d), X, Yy);
        if (d === circ) { c.strokeStyle = '#B01818'; c.lineWidth = 3; c.beginPath(); c.ellipse(X, Yy - 6, 20, 17, 0.2, 0, 6.28); c.stroke(); } }
    });
    const cal = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.59), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 })); cal.material.userData.noBatch = true;
    cal.position.set(x1 - 0.135, 1.55, z0 + 1.95); cal.rotation.y = -Math.PI / 2; g.add(cal);
    ofHit(g, x1 - 0.3, 1.55, z0 + 1.95, 0.3, 0.65, 0.5, 'calendar');
  }

  // 창 — 바라보기
  ofHit(g, x1 - 0.45, 1.95, wz, 0.3, 1.9, 5.0, 'window');

  // ── 은은한 빛 · 천장의 흐린 등 하나 ──
  const amb = new THREE.PointLight(0x8090A8, 2.2, 14, 1.4); amb.position.set(cx, (r.h - 60) / CM, (z0 + z1) / 2); g.add(amb);
  // 서랍이 열리면 편지를 읽는다
  OFFICE.letterInfo = ofHit(g, dx - 0.5, 0.62, dz + 0.8, 0.3, 0.3, 0.6, 'letter');
  {
    const env = new THREE.Group();
    const em = ofMat(0xE6DCC2, 0.9); env.add(ofAt(rbox(0.24, 0.006, 0.16, 0.002, em), 0, 0.003, 0));
    const seal = cyl(0.018, 0.018, 0.004, ofMat(0x8A1A14, 0.4), 14); seal.position.set(0, 0.008, 0); env.add(seal);
    env.rotation.y = 0.35; env.position.set(dx - 0.22, 0.81, dz - 0.72); env.visible = false; g.add(env); OFFICE.envelope = env;
    OFFICE.lastAt = [dx - 0.22, 0.86, dz - 0.72];   // 조사 자리는 봉투가 놓일 때 만든다(숨은 채로 집히지 않게)
    OFFICE.room = r; OFFICE.g = g;
  }
  if (typeof lostKeeperDoor === 'function') lostKeeperDoor(r, g);   // v129 — 남쪽 벽 문(2막으로)
  // ⚠️ 캔버스 그림(창 · 빗줄기 · 금 · 시계 · 종이 …)을 쓰는 재질은 방 배칭에 합쳐지면 그림이 사라진다 → 전부 제외
  g.traverse((o) => { const m = o.material; if (m && m.map && m.map.userData && m.map.userData.cv) m.userData.noBatch = true; });
  OFFICE.built = true;
  if (OFFICE.n2 >= 2) officeNight2();
  officePaint();
}
/** 시계 그림 — 멈춘 6:47 또는 지금 시각(초침까지) */
function officeClockDraw(c, hh, mm, ss) {
  c.clearRect(0, 0, 256, 256);
  c.fillStyle = '#E8E0CC'; c.beginPath(); c.arc(128, 128, 124, 0, 6.28); c.fill(); c.strokeStyle = '#2A1C12'; c.lineWidth = 8; c.stroke();
  c.fillStyle = '#1A140E'; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; c.fillRect(128 + Math.sin(a) * 100 - 3, 128 - Math.cos(a) * 100 - 8, 6, 16); }
  const hand = (a, L, wd) => { c.save(); c.translate(128, 128); c.rotate(a); c.fillRect(-wd / 2, -L, wd, L); c.restore(); };
  hand(((hh % 12) + mm / 60) / 12 * 6.28, 60, 8); hand(mm / 60 * 6.28, 92, 5);
  if (ss != null) { c.fillStyle = '#8A1A14'; hand(ss / 60 * 6.28, 100, 2); }
  c.fillStyle = '#1A140E'; c.beginPath(); c.arc(128, 128, 7, 0, 6.28); c.fill();
}
/** 두 번째 밤 — 방을 바꾼다(한 번만) */
function officeNight2() {
  if (OFFICE.n2done || !OFFICE.built) return;
  OFFICE.n2done = true;
  const g = OFFICE.g, r = OFFICE.room, x0 = r.x0 / CM, z1 = r.z1 / CM;
  // 비가 그치고 달
  if (OFFICE.rainMesh) OFFICE.rainMesh.visible = false;
  if (OFFICE.blinds) { OFFICE.blinds.scale.y = 0.2; OFFICE.blinds.position.y = 3.2 * 0.8; }   // 블라인드를 더 걷어 올렸다
  if (typeof cityNight2 === 'function') cityNight2();
  if (OFFICE.night) {
    const cv = OFFICE.night.userData.cv, c = cv.getContext('2d'), w = cv.width, h = cv.height;
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#141C2A'); gr.addColorStop(1, '#1E2430'); c.fillStyle = gr; c.fillRect(0, 0, w, h * 0.45);
    const mx = w * 0.7, my = h * 0.36, halo = c.createRadialGradient(mx, my, 0, mx, my, 90); halo.addColorStop(0, 'rgba(235,235,225,.55)'); halo.addColorStop(1, 'rgba(235,235,225,0)');
    c.fillStyle = halo; c.fillRect(mx - 90, my - 90, 180, 180); c.fillStyle = '#F2EFE4'; c.beginPath(); c.arc(mx, my, 22, 0, 6.28); c.fill();
    for (let i = 0; i < 50; i++) { c.fillStyle = 'rgba(255,255,255,' + (0.3 + Math.random() * 0.5) + ')'; c.fillRect(Math.random() * w, Math.random() * h * 0.4, 1.5, 1.5); }
    OFFICE.night.needsUpdate = true;
  }
  // 누군가 체스 한 수
  if (OFFICE.chessMove) { const [px, pz] = OFFICE.chessMove.to; OFFICE.chessMove.p.position.x = px; OFFICE.chessMove.p.position.z = pz; }
  // 이번엔 내 쪽 잔에서 김
  if (OFFICE.steamMine) OFFICE.steamAt = OFFICE.steamMine;
  // 축음기 — B면(라벨 색)
  if (OFFICE.gramoLbl) OFFICE.gramoLbl.material = ofMat(0xD8CCA8, 0.7);
  // 캐비닛 맨 아랫칸이 열리고 편지 묶음
  if (OFFICE.cab) {
    for (const m of OFFICE.cab.low) m.position.z -= 0.3;
    const bundle = new THREE.Group();
    for (let i = 0; i < 5; i++) { const e = rbox(0.2, 0.005, 0.13, 0.002, ofMat(i % 2 ? 0xE6DCC2 : 0xD8CCAE, 0.9)); e.position.set((Math.random() - 0.5) * 0.03, i * 0.007, (Math.random() - 0.5) * 0.03); e.rotation.y = (Math.random() - 0.5) * 0.3; bundle.add(e); }
    const tie = rbox(0.21, 0.04, 0.012, 0.002, ofMat(0x8A1A14, 0.6)); tie.position.y = 0.018; bundle.add(tie);
    bundle.position.set(OFFICE.cab.kx, 0.36, OFFICE.cab.kz - 0.5); g.add(bundle);
  }
  // 보드 밖 벽에 빈 사진 한 장 — 실이 모두 그쪽으로
  if (OFFICE.boardAt) {
    const B = OFFICE.boardAt, px = B.bx + 2.25, py = 1.75, pz = B.bz + 0.04;
    const blank = ofCanvasTex(170, 210, (c, w, h) => { c.fillStyle = '#ECE6D8'; c.fillRect(0, 0, w, h); c.fillStyle = '#1C1A18'; c.fillRect(12, 12, w - 24, h - 60); c.fillStyle = '#4A4440'; c.font = 'bold 48px serif'; c.textAlign = 'center'; c.fillText('?', w / 2, (h - 48) / 2 + 16); c.fillStyle = '#2A2018'; c.font = '16px "Courier New", serif'; c.fillText('다음 사람', w / 2, h - 18); });
    const bm = new THREE.MeshStandardMaterial({ map: blank, roughness: 0.9 }); bm.userData.noBatch = true;
    const ph = new THREE.Mesh(new THREE.PlaneGeometry(B.pw, B.phH), bm); ph.position.set(px, py, pz); ph.rotation.z = 0.05; g.add(ph);
    const pinP = new THREE.Vector3(px, py + B.phH / 2 - 0.03, pz + 0.02);
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), ofMat(0xB01818, 0.4)); pin.position.copy(pinP); g.add(pin);
    const lp = []; for (const q of B.pins) lp.push(q, pinP);
    g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lp), new THREE.LineBasicMaterial({ color: 0xB01818 })));
    ofHit(g, px, py, pz + 0.15, B.pw + 0.1, B.phH + 0.1, 0.3, 'people');
  }
  // 거울에 입김 글씨
  {
    const fog = ofCanvasTex(256, 384, (c, w, h) => {
      c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(235,240,245,.5)'; c.font = 'italic 34px "Noto Serif KR", serif'; c.textAlign = 'center';
      c.save(); c.translate(w * 0.45, h * 0.62); c.rotate(-0.08); c.fillText('여기 있었어', 0, 0); c.restore();
      for (let i = 0; i < 6; i++) { c.fillStyle = 'rgba(235,240,245,.18)'; c.fillRect(w * 0.3 + i * 22, h * 0.64, 2, 18 + Math.random() * 26); }
    });
    const fm = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.5), new THREE.MeshBasicMaterial({ map: fog, transparent: true, depthWrite: false, opacity: 0.85 }));
    fm.position.set(x0 + 0.18, 1.6, z1 - 6.2); fm.rotation.y = Math.PI / 2; g.add(fm);
  }
  // 조사 이름표도 두 번째 밤의 이름으로(비 오는 창 → 비가 그친 창 …)
  M.artByMesh.forEach((info) => { const k = info.id && info.id.indexOf('office-') === 0 ? info.id.slice(7) : null; if (k && OFFICE_N2[k]) { info.label = info.title = OFFICE_N2[k].obj; } });
  officeTickClock(true);
  officeLastCheck();
}
/** 시계 — 지금 시각으로(초가 바뀔 때만 다시 그린다) */
function officeTickClock(force) {
  if (!OFFICE.clock || OFFICE.n2 < 2) return false;
  const d = new Date(), s = d.getSeconds();
  if (!force && s === OFFICE.lastSec) return false;
  OFFICE.lastSec = s;
  officeClockDraw(OFFICE.clock.userData.cv.getContext('2d'), d.getHours(), d.getMinutes() + s / 60, s); OFFICE.clock.needsUpdate = true;
  return true;
}
/** 일곱 밤 — 봉투가 놓인다 */
function officeLastCheck() {
  if (!OFFICE.envelope) return;
  OFFICE.envelope.visible = OFFICE.n2 >= 2 && OFFICE.days.size >= OFFICE_DAYS_GOAL;
  if (OFFICE.envelope.visible && !OFFICE.lastInfo && OFFICE.g) { const a = OFFICE.lastAt; OFFICE.lastInfo = ofHit(OFFICE.g, a[0], a[1], a[2], 0.3, 0.12, 0.25, 'last'); }
}
function officeToday() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

/* ── 읽기 — 한 줄 → 메모(타자기) → 질문 ── */
function officeRead(id) {
  if (id === 'letter' && OFFICE_ORDER.some((k) => !OFFICE.read.has(k))) {
    toast('잠겨 있다. 열쇠 구멍에 먼지가 없다 — 누가 자주 열어 본 것 같다. (' + OFFICE_ORDER.filter((k) => OFFICE.read.has(k)).length + ' / 7)', 2600);
    if (typeof torchClick === 'function') torchClick();
    return;
  }
  const E = officeEntry(id); if (!E) return;
  OFFICE.lastId = id;
  const T = E.T;
  if (M.locked) { OFFICE.relock = true; document.exitPointerLock(); }
  M.openId = 'office';
  let el = OFFICE.el;
  if (!el) {
    el = OFFICE.el = document.createElement('div'); el.className = 'office-read'; el.id = 'officeRead';
    el.innerHTML = '<div class="or-card"><p class="or-k"></p><blockquote class="or-q"></blockquote><h2 class="or-line"></h2><p class="or-memo"></p><p class="or-ask"></p><button type="button" class="or-x">닫기 · Esc</button></div>';
    document.body.appendChild(el);
    // 타자가 아직 치는 중이면 첫 번째 누름은 '끝까지 보기', 그다음이 닫기
    el.addEventListener('click', (ev) => { if (ev.target === el || ev.target.classList.contains('or-x')) officeClose(); else if (OFFICE.finish) OFFICE.finish(); });
    document.addEventListener('keydown', (ev) => {
      if (!OFFICE.open) return;
      if (ev.key === 'Escape' || ev.key.toLowerCase() === 'e' || ev.key === ' ' || ev.key === 'Enter') {
        ev.preventDefault(); ev.stopPropagation();
        if (ev.key !== 'Escape' && OFFICE.finish) OFFICE.finish(); else officeClose();
      }
    }, true);
  }
  el.querySelector('.or-k').textContent = T.axis + ' · ' + T.obj;
  // v130 — 철학자의 문장(출처와 함께) — 관리자의 글은 그 문장에서 출발한다
  const qEl = el.querySelector('.or-q'); qEl.textContent = '';
  if (T.q) { qEl.append('“' + T.q[0] + '”'); const ci = document.createElement('cite'); ci.textContent = '— ' + T.q[1]; qEl.appendChild(ci); qEl.style.display = ''; } else qEl.style.display = 'none';
  const lineEl = el.querySelector('.or-line'); lineEl.textContent = T.line; lineEl.classList.toggle('strike', !!T.strike);
  const memo = el.querySelector('.or-memo'), ask = el.querySelector('.or-ask');
  memo.textContent = ''; ask.textContent = ''; ask.classList.remove('on'); ask.style.display = T.ask ? '' : 'none';
  el.classList.add('on'); OFFICE.open = true;
  officeStopTyping();
  let i = 0; const txt = T.memo;
  const done = () => { officeStopTyping(); memo.textContent = txt; ask.textContent = T.ask; ask.classList.add('on'); };
  OFFICE.finish = done;
  OFFICE.delay = setTimeout(() => {
    OFFICE.typer = setInterval(() => {
      i++; memo.textContent = txt.slice(0, i);
      if (i % 3 === 0 && typeof officeKey === 'function') officeKey(0.35);
      if (i >= txt.length) done();
    }, 34);
  }, 900);
  if (OFFICE_ORDER.includes(id) && !OFFICE.read.has(id)) {
    OFFICE.read.add(id);
    try { localStorage.setItem('museum-office-read', JSON.stringify([...OFFICE.read])); } catch (e) { /* */ }
    officePaint();
    if (OFFICE_ORDER.every((k) => OFFICE.read.has(k))) setTimeout(() => { toast('어디선가 딸깍 — 책상 서랍의 잠금이 풀렸다', 3200); if (typeof torchClick === 'function') torchClick(); }, 1500);
  }
  if (id === 'letter' && typeof hauntRec === 'function') hauntRec('keeper');
  if (E.key && E.key.indexOf('n2:') !== 0 && !OFFICE.more.has(E.key)) {
    OFFICE.more.add(E.key);
    try { localStorage.setItem('museum-office-more', JSON.stringify([...OFFICE.more])); } catch (e) { /* */ }
    officePaint();
    if (officeMoreCount() >= OFFICE_MORE_N) setTimeout(() => { toast('이 방의 문장을 모두 읽었다 — 이제 당신의 문장을 쓸 차례다', 3600); OFFICE.paperText = ''; OFFICE.paperMsg = '당신의 차례. '; }, 1500);
  }
  if (E.key && E.key.indexOf('n2:') === 0 && !OFFICE.more.has(E.key)) {
    OFFICE.more.add(E.key);
    try { localStorage.setItem('museum-office-more', JSON.stringify([...OFFICE.more])); } catch (e) { /* */ }
    officePaint();
  }
  if (id === 'last') { OFFICE.paperText = ''; OFFICE.paperMsg = '다녀가세요. '; }
  if (id === 'gramo') officeGramo(OFFICE.n2 >= 2);
}
/** 무엇을 펼칠지 — 핵심 일곱 · 곁가지 · 책장(안 읽은 책부터) · 휴지통 · 메모장(날마다) */
function officeEntry(id) {
  if (id.indexOf('lost:') === 0) return typeof lostEntry === 'function' ? lostEntry(id) : null;   // v129 — 분실물 보관소
  if (id === 'last') return (OFFICE.envelope && OFFICE.envelope.visible) ? { T: OFFICE_LAST, key: null } : null;
  if (OFFICE.n2 >= 2) {
    if (OFFICE_N2[id]) return { T: OFFICE_N2[id], key: 'n2:' + id };
    if (id === 'names') {
      let j = OFFICE.cur.n2l == null ? -1 : OFFICE.cur.n2l, n = OFFICE_LETTERS.length;
      for (let k = 0; k < n; k++) { j = (j + 1) % n; if (!OFFICE.more.has('n2:letter' + j)) break; }
      OFFICE.cur.n2l = j; const L = OFFICE_LETTERS[j];
      return { T: { obj: '부치지 않은 편지 — ' + L.to, axis: '캐비닛 맨 아랫칸 · ' + (j + 1) + ' / ' + n, q: L.q, line: L.line, memo: L.memo, ask: '' }, key: 'n2:letter' + j };
    }
    if (id === 'record') {
      const d = new Date(), k = (d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()) % OFFICE_Q.length, today = officeToday();
      const first = !OFFICE.days.has(today); OFFICE.days.add(today); officeSave();
      const n = OFFICE.days.size;
      if (first && n === OFFICE_DAYS_GOAL) setTimeout(() => { officeLastCheck(); toast('책상 위에 봉투 하나가 놓여 있다', 3200); if (typeof torchClick === 'function') torchClick(); }, 1800);
      return { T: { obj: '타자기 — 오늘의 질문', axis: d.getFullYear() + '. ' + (d.getMonth() + 1) + '. ' + d.getDate() + '. · ' + Math.min(n, OFFICE_DAYS_GOAL) + '번째 밤',
        line: OFFICE_Q[k], memo: '종이에 질문 하나가 쳐져 있다. 내가 친 게 아니다.\n답은 쓰지 않아도 된다. 하루 동안 주머니에 넣고 다니면 된다.\n내일 밤에는 다른 질문이 쳐져 있을 것이다.', ask: '' }, key: null };
    }
  }
  if (OFFICE_TEXT[id]) return { T: OFFICE_TEXT[id], key: null };
  if (OFFICE_MORE[id]) return { T: OFFICE_MORE[id], key: id };
  const next = (pre, n) => {
    let j = OFFICE.cur[pre] == null ? -1 : OFFICE.cur[pre];
    for (let k = 0; k < n; k++) { j = (j + 1) % n; if (!OFFICE.more.has(pre + j)) break; }
    return (OFFICE.cur[pre] = j);
  };
  if (id === 'book') { const i = next('book', OFFICE_BOOKS.length), b = OFFICE_BOOKS[i]; return { T: { obj: '책장 — 『' + b.t + '』', axis: '여백에 적힌 메모 · ' + (i + 1) + ' / ' + OFFICE_BOOKS.length, q: [b.q, b.a + ', 『' + b.t + '』'], line: b.line, memo: b.memo, ask: '' }, key: 'book' + i }; }
  if (id === 'draft') { const i = next('draft', OFFICE_DRAFTS.length), d = OFFICE_DRAFTS[i]; return { T: { obj: '구겨진 종이', axis: '버린 문장들 · ' + (i + 1) + ' / ' + OFFICE_DRAFTS.length, line: d.s, strike: true, memo: d.why, ask: '' }, key: 'draft' + i }; }
  if (id === 'daily') {
    const d = new Date(), k = (d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()) % OFFICE_DAILY.length;
    return { T: { obj: '오늘의 문장', axis: d.getFullYear() + '. ' + (d.getMonth() + 1) + '. ' + d.getDate() + '.', q: OFFICE_DAILY[k], line: '오늘은 이 한 줄을 들고 다닌다.', memo: '책상 메모장의 맨 위 장. 날마다 한 장씩, 다른 사람의 문장으로 넘어간다.\n외우지 않아도 된다. 오늘 한 번만 떠올리면 된다.\n내일 다시 오면, 다른 문장이 적혀 있을 것이다.', ask: '' }, key: null };
  }
  return null;
}
/** 축음기 — 판이 돌고, 낡은 왈츠 한 소절(지직거림 섞어) */
function officeGramo(bSide) {
  OFFICE.gramoT = 26;
  const c = typeof SND !== 'undefined' && SND.ctx; if (!c || !SND.on) return;
  const t0 = c.currentTime + 0.3, beat = 0.62;
  const melB = [[261.6, 2], [329.6, 1], [392, 3], [440, 2], [392, 1], [329.6, 3], [349.2, 2], [440, 1], [523.3, 3], [493.9, 2], [440, 1], [392, 3],
    [329.6, 2], [392, 1], [440, 2], [392, 1], [349.2, 2], [329.6, 1], [293.7, 3], [329.6, 2], [349.2, 1], [392, 2], [329.6, 1], [261.6, 3]];
  const mel = bSide ? melB : [[440, 2], [523.3, 1], [493.9, 2], [440, 1], [392, 2], [349.2, 1], [329.6, 3], [349.2, 2], [392, 1], [440, 2], [392, 1], [349.2, 2], [329.6, 1], [293.7, 3],
    [329.6, 2], [349.2, 1], [392, 2], [440, 1], [523.3, 2], [493.9, 1], [440, 3], [392, 2], [349.2, 1], [329.6, 2], [293.7, 1], [261.6, 2], [293.7, 1], [220, 3]];
  let t = t0;
  for (const [f, n] of mel) {
    const o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter(); o.type = 'triangle'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 1400;
    sndEnv(g, t, 0.02, 0.05, beat * n * 0.95); o.connect(lp); lp.connect(g); sndPanned(g, 0.5, 0.5); o.start(t); o.stop(t + beat * n + 0.1);
    t += beat * n;
  }
  // 바늘 지직거림
  const N = Math.floor(c.sampleRate * (t - t0 + 0.5)), b = c.createBuffer(1, N, c.sampleRate), ch = b.getChannelData(0);
  for (let i = 0; i < N; i++) ch[i] = Math.random() < 0.0009 ? (Math.random() * 2 - 1) : (Math.random() * 2 - 1) * 0.04;
  const s = c.createBufferSource(); s.buffer = b; const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
  const g2 = c.createGain(); g2.gain.value = 0.12; s.connect(hp); hp.connect(g2); sndPanned(g2, 0.5, 0.4); s.start(t0 - 0.2);
}
/** 타자를 멈춘다 — 닫거나 다른 물건을 열 때 이전 글이 섞이지 않게 */
function officeStopTyping() { clearTimeout(OFFICE.delay); clearInterval(OFFICE.typer); OFFICE.finish = null; }
function officeClose() {
  if (!OFFICE.el) return;
  // v129 — 편지를 닫으면 남쪽 벽 문이 딸깍 열린다(2막 분실물 보관소) · 보관소 마지막 봉투를 닫으면 2막 끝
  if (OFFICE.open && OFFICE.lastId === 'letter' && typeof lostUnlock === 'function') lostUnlock();
  if (OFFICE.open && typeof lostOnClose === 'function') lostOnClose(OFFICE.lastId);
  officeStopTyping();
  OFFICE.el.classList.remove('on'); OFFICE.open = false;
  M.openId = null; M.keys = {};
  if (OFFICE.relock && typeof tryLock === 'function') { OFFICE.relock = false; tryLock(document.getElementById('gal')); }
}
/** 진행 — 방에 있을 때만 화면 아래 작게 */
function officePaint() {
  let h = OFFICE.hud;
  if (!h) { h = OFFICE.hud = document.createElement('div'); h.className = 'office-hud'; (document.getElementById('gal') || document.body).appendChild(h); }
  const n = OFFICE_ORDER.filter((k) => OFFICE.read.has(k)).length;
  if (OFFICE.n2 >= 2) {
    const m2 = [...OFFICE.more].filter((k) => k.indexOf('n2:') === 0).length;
    h.textContent = '두 번째 밤   ·   달라진 것 ' + m2 + ' / ' + OFFICE_N2_N + '   ·   질문 ' + Math.min(OFFICE.days.size, OFFICE_DAYS_GOAL) + ' / ' + OFFICE_DAYS_GOAL + '밤';
  } else h.textContent = (n < 7 ? '생각 ' + n + ' / 7' : '서랍이 열렸다') + '   ·   문장 ' + officeMoreCount() + ' / ' + OFFICE_MORE_N;
}
function officeMoreCount() { return [...OFFICE.more].filter((k) => k.indexOf('n2:') !== 0).length; }
/** 초침 — 두 번째 밤의 시계 */
function officeTick() {
  const c = typeof SND !== 'undefined' && SND.ctx; if (!c || !SND.on) return;
  const t0 = c.currentTime + 0.005, N = Math.floor(c.sampleRate * 0.02), b = c.createBuffer(1, N, c.sampleRate), ch = b.getChannelData(0);
  for (let i = 0; i < N; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / N, 12);
  const s = c.createBufferSource(); s.buffer = b; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = (OFFICE.tock = !OFFICE.tock) ? 3200 : 2700; bp.Q.value = 4;
  const g = c.createGain(); g.gain.value = 0.12; s.connect(bp); bp.connect(g); sndPanned(g, -0.6, 0.5); s.start(t0);
}
/** 타자기 한 글자 소리 */
function officeKey(vol = 1) {
  const c = typeof SND !== 'undefined' && SND.ctx; if (!c || !SND.on) return;
  const t0 = c.currentTime + 0.005, N = Math.floor(c.sampleRate * 0.03), b = c.createBuffer(1, N, c.sampleRate), ch = b.getChannelData(0);
  for (let i = 0; i < N; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / N, 8);
  const s = c.createBufferSource(); s.buffer = b; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400 + Math.random() * 600; bp.Q.value = 2;
  const g = c.createGain(); g.gain.value = 0.25 * vol; s.connect(bp); bp.connect(g); sndPanned(g, 0, 0.3); s.start(t0);
}
/** 비 · 피아노 한 음씩(방 안에서만) */
function officeAmb(dt) {
  const c = typeof SND !== 'undefined' && SND.ctx; if (!c || !SND.on) return;
  if (!OFFICE.rainSrc) {
    const N = c.sampleRate * 3, b = c.createBuffer(1, N, c.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < N; i++) ch[i] = (Math.random() * 2 - 1) * (0.6 + 0.4 * Math.random());
    const s = c.createBufferSource(); s.buffer = b; s.loop = true; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    const g = c.createGain(); g.gain.value = 0; s.connect(lp); lp.connect(g); sndPanned(g, 0.3, 0.2); s.start();
    OFFICE.rainSrc = s; OFFICE.rainG = g;
  }
  OFFICE.notes -= dt;
  if (OFFICE.gramoT > 0) OFFICE.notes = Math.max(OFFICE.notes, 3);
  if (OFFICE.notes <= 0) {
    OFFICE.notes = 2.6 + Math.random() * 3.2;
    const scale = [220, 246.9, 261.6, 293.7, 329.6, 349.2, 392], f = scale[Math.floor(Math.random() * scale.length)] * (Math.random() < 0.3 ? 0.5 : 1);
    const t0 = c.currentTime + 0.02;
    for (const [m, v] of [[1, 0.06], [2, 0.02], [3, 0.008]]) { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f * m; sndEnv(g, t0, 0.01, v, 3.2); o.connect(g); sndPanned(g, -0.2, 0.6); o.start(t0); o.stop(t0 + 3.4); }
  }
}
/** 매 프레임 — 느와르 · 비 · 김 · 연기 · 모래 · 타자기 */
function stepOffice(dt) {
  if (!OFFICE.built) return;
  const inR = !!(M.room && M.room.id === 'workshop'), noirR = inR || !!(M.room && M.room.lost);   // 분실물 보관소도 흑백
  OFFICE.noir += ((noirR ? 1 : 0) - OFFICE.noir) * Math.min(1, dt * (noirR ? 0.9 : 3));
  if (M.post && M.post.uniforms && M.post.uniforms.uNoir) M.post.uniforms.uNoir.value = OFFICE.noir;
  if (OFFICE.hud) OFFICE.hud.classList.toggle('on', inR && !OFFICE.open);
  if (OFFICE.rainG && SND.ctx) OFFICE.rainG.gain.setTargetAtTime(inR && OFFICE.n2 < 2 ? 0.07 : 0, SND.ctx.currentTime, 0.4);
  // 편지를 읽고 나갔다가 다시 들어서면 — 두 번째 밤
  if (inR && !OFFICE.wasIn && OFFICE.n2 === 1) {
    OFFICE.n2 = 2; officeSave(); officeNight2(); officePaint();
    setTimeout(() => toast('무언가 달라졌다 — 어디선가 초침 소리가 들린다', 3800), 1600);
  }
  OFFICE.wasIn = inR;
  if (typeof cityStep === 'function') cityStep(dt, inR);   // v130 — 창밖 도시
  if (!inR) return;
  if (officeTickClock(false)) officeTick();
  officeAmb(dt);
  OFFICE.t = (OFFICE.t || 0) + dt;
  if (OFFICE.gramoT > 0) { OFFICE.gramoT -= dt; if (OFFICE.disk) OFFICE.disk.rotation.y -= dt * 3.5; }
  if (OFFICE.rain) OFFICE.rain.offset.y = (OFFICE.rain.offset.y + dt * 0.35) % 1;
  // 모래 — 위는 줄고 아래는 쌓인다(천천히 · 끝나면 다시)
  if (OFFICE.sand) { const k = (OFFICE.t % 180) / 180; OFFICE.sand.sTop.scale.setScalar(Math.max(0.05, 1 - k)); OFFICE.sand.sBot.scale.setScalar(0.3 + k * 0.7); }
  // 서랍 — 일곱을 다 읽으면 열린다
  const D = OFFICE.drawer, all = OFFICE_ORDER.every((k) => OFFICE.read.has(k));
  if (D) { D.open += ((all ? 1 : 0) - D.open) * Math.min(1, dt * 2); D.mesh.position.x = D.x - 0.46 - D.open * 0.25; D.lock.position.x = D.x - 0.475 - D.open * 0.25; }
  // 김(두 번째 잔에서만) · 재떨이 연기
  if (!OFFICE.puffs) {
    const cv = makeCanvas(64, 64), c = cv.getContext('2d'), gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(230,230,235,.5)'); gr.addColorStop(1, 'rgba(230,230,235,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(cv), g = M.roomGroups.workshop; OFFICE.puffs = [];
    for (let i = 0; i < 18; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 })); g.add(sp); OFFICE.puffs.push({ sp, t: i / 18 * 3, src: i % 2 }); }
  }
  for (const p of OFFICE.puffs) {
    p.t += dt; const L = 3, u = (p.t % L) / L, at = p.src ? OFFICE.steamAt : OFFICE.smokeAt;
    p.sp.position.set(at.x + Math.sin(p.t * 1.7 + p.src) * 0.04 * u, at.y + u * (p.src ? 0.35 : 0.6), at.z + Math.cos(p.t * 1.3) * 0.04 * u);
    p.sp.scale.setScalar(0.06 + u * 0.18); p.sp.material.opacity = 0.32 * Math.sin(u * Math.PI);
  }
  // 은은하게 — 눈을 돌린 사이 타자기가 한 글자 찍는다(종이에 글자가 는다)
  OFFICE.typeT -= dt;
  if (OFFICE.typeT <= 0 && OFFICE.paper && !OFFICE.open) {
    const dx = OFFICE.drawer.x, dz = OFFICE.drawer.z - 0.95;
    if (typeof hauntView !== 'function' || !hauntView(dx, (M.roomById.workshop.y0) / CM + 1.0, dz).on) {
      OFFICE.typeT = 9 + Math.random() * 12;
      const msg = OFFICE.paperMsg || (OFFICE.n2 >= 2 ? OFFICE_Q[(new Date().getFullYear() * 372 + new Date().getMonth() * 31 + new Date().getDate()) % OFFICE_Q.length] + ' ' : '기억해 줘서 고마워. ');
      OFFICE.paperText = msg.slice(0, (OFFICE.paperText.length % msg.length) + 1);
      const cv = OFFICE.paper.userData.cv, c = cv.getContext('2d');
      c.fillStyle = '#EEE8DA'; c.fillRect(0, 0, cv.width, cv.height); c.fillStyle = '#1A1612'; c.font = '20px "Courier New", monospace';
      c.fillText(OFFICE.paperText, 18, 60); OFFICE.paper.needsUpdate = true;
      officeKey(0.7);
    } else OFFICE.typeT = 2;
  }
}
