/**
 * exhibits.js — 아카이브 데이터 → 전시물 목록 + 도슨트 해설문
 *
 * 전시물은 손으로 배치하지 않는다. 라운드가 등록되면 전시물이 저절로 한 점 늘어난다.
 * 해설 톤은 박물관 도슨트로 통일한다 — 별거 아닌 기록도 소장품 번호가 붙으면 무게가 생긴다.
 */

/* ══════════════════════════════════════════════════════════
   건물 평면 — 복층 + 바깥 필드
   ══════════════════════════════════════════════════════════
   단위 cm. 좌표: x 동(+), z 남(+). 북쪽(−z)이 필드다.

   ▣ 1층 (lv 0, 바닥 0) ▣
        x 0 ─── 1600 ──── 2200 ─ 2600 ──── 3200 ──── 4800
   z  0 ┌─────────┬─────────────────────────┬──────────┐
        │ 명예의   │   라운지 (유리벽 → 테라스)  │ 기록     │
    600 │ 전당     ├──────┬──────┬──────────┤ 보관실   │
        │         │ 홀 서 │ 대계단 │  홀 동    │          │   ← 홀 서·동·그랜드 홀은
   1500 ├─────────┼──────┴──────┴──────────┼──────────┤     두 층을 튼 공간(유리 천장)
        │ 트로피실 │       그랜드 홀            │ 상영관    │
   2400 │         ├─────────────────────────┤          │
        │         │   현관 (입장 지점)          │          │
   3000 └─────────┴─────────────────────────┴──────────┘

   ▣ 2층 (lv 1, 바닥 500) ▣
   z  0 ┌─────────┬─────────────────────────┬──────────┐
        │ 사진     │  2층 회랑 (유리벽 → 데크)  │ 우승자의 방│  ← 북쪽 창으로 필드
    600 │ 갤러리   ├ ─ ─ 난간 ─ ─ ┬ ─ ─ ─ ─ ─ ─┤ (천장 6.5m)│
        │ (긴 방)  │   (아래가 뚫려 있다)        │          │
   1800 │         │                          ├──────────┤
        │         │                          │ 작업실    │
   3000 └─────────┘                          └──────────┘

   ▣ 바깥 ▣  z −800~0 테라스(1층) · 그 위 전망 데크(2층) · 그 북쪽 전체가 18번 홀

   rect  방의 바닥 사각형(cm).  lv  층(0/1) → 바닥 높이 = lv × FLOOR_H
   h     천장 높이(cm). 1층 방은 FLOOR_H 로 두어야 2층 바닥과 맞는다.
   part  같은 공간의 조각(그랜드 홀을 계단 둘레로 나눈 것). 안내판·설정 패널에 따로 안 나온다.
   stair 계단 — 오르는 방향('n' = 북쪽으로 오른다). 바닥이 한 층 높이만큼 기운다.
   sky   유리 천장.   outdoor  바깥(천장·벽 없음).   terrain  지형(골프 필드)
   ────────────────────────────────────────────────────────── */
const FLOOR_H = 500;

const ROOMS = [
  // ── 1층 ─────────────────────────────────────────────
  { id: 'grand', content: 'lobby', rect: { x: 1600, z: 1500, w: 1600, d: 900 }, lv: 0, h: 1000,
    mat: 'marble', sky: true, entry: true,
    name: '그랜드 홀', en: 'GRAND HALL', accent: '#E3C567',
    desc: '두 층을 튼 중앙홀. 유리 천장으로 해가 든다. 계단을 오르면 2층 회랑이다.' },
  { id: 'hallW', part: 'grand', content: 'empty', rect: { x: 1600, z: 600, w: 600, d: 900 }, lv: 0, h: 1000,
    mat: 'marble', sky: true, name: '그랜드 홀', en: 'GRAND HALL', accent: '#E3C567',
    desc: '서쪽 문은 명예의 전당으로 이어진다.' },
  { id: 'hallE', part: 'grand', content: 'empty', rect: { x: 2600, z: 600, w: 600, d: 900 }, lv: 0, h: 1000,
    mat: 'marble', sky: true, name: '그랜드 홀', en: 'GRAND HALL', accent: '#E3C567',
    desc: '동쪽 문은 기록 보관실로 이어진다.' },
  { id: 'stair', part: 'grand', content: 'empty', stair: 'n', rect: { x: 2200, z: 600, w: 400, d: 900 }, lv: 0, h: 1000,
    mat: 'marble', sky: true, name: '대계단', en: 'GRAND STAIR', accent: '#E3C567',
    desc: '서른 칸. 끝까지 오르면 필드가 보인다.' },
  { id: 'foyer', part: 'grand', content: 'empty', start: true, rect: { x: 1600, z: 2400, w: 1600, d: 600 }, lv: 0, h: 500,
    mat: 'marble', name: '현관', en: 'FOYER', accent: '#E3C567',
    desc: '들어서면 정면으로 대계단, 그 너머 유리벽으로 필드가 보인다.' },
  { id: 'lounge', part: 'grand', content: 'empty', rect: { x: 1600, z: 0, w: 1600, d: 600 }, lv: 0, h: 500,
    mat: 'marble', name: '라운지', en: 'LOUNGE', accent: '#E3C567',
    desc: '북쪽이 통유리다. 가운데 문으로 테라스에 나간다.' },

  { id: 'hall', content: 'portraits', rect: { x: 0, z: 0, w: 1600, d: 1500 }, lv: 0, h: 500,
    mat: 'walnut', name: '명예의 전당', en: 'HALL OF FAME', accent: '#E3C567',
    desc: '월넛 판벽. 초상마다 브라스 명패가 붙어 있다.' },
  { id: 'trophy', content: 'trophies', rect: { x: 0, z: 1500, w: 1600, d: 1500 }, lv: 0, h: 500,
    mat: 'velvet', name: '트로피실', en: 'TROPHY ROOM', accent: '#C9A227',
    desc: '버건디 벨벳. 받고 싶지 않은 명패도 있다.' },
  /* closed: '안내 문구' 를 주면 문을 닫아 진입을 막는다(문·충돌·미니맵·안내판이 모두 이 값을 본다).
     다시 닫으려면 여기에 closed 를 적거나 전시 설정(F2)에서 닫는다. */
  { id: 'archive', content: 'scorecards', rect: { x: 3200, z: 0, w: 1600, d: 1500 }, lv: 0, h: 500,
    mat: 'archive', name: '기록 보관실', en: 'ARCHIVE', accent: '#7FA88C',
    desc: '세이지 그린 벽. 라운드마다 스코어카드 한 장.' },
  { id: 'theater', content: 'clips', rect: { x: 3200, z: 1500, w: 1600, d: 1500 }, lv: 0, h: 500,
    mat: 'dark', env: 0.35, name: '상영관', en: 'SCREENING ROOM', accent: '#C08A6A',
    desc: '암막과 카펫. 헛스윙은 예술이 될 수 있는가.' },

  // ── 2층 ─────────────────────────────────────────────
  { id: 'mezz', content: 'empty', rect: { x: 1600, z: 0, w: 1600, d: 600 }, lv: 1, h: 500,
    mat: 'oak', name: '2층 회랑', en: 'MEZZANINE', accent: '#E3C567',
    desc: '난간 너머로 그랜드 홀이 내려다보인다. 북쪽 유리문 밖은 전망 데크.' },
  { id: 'gallery', content: 'photos', rect: { x: 0, z: 0, w: 1600, d: 3000 }, lv: 1, h: 500,
    mat: 'gallery', name: '사진 갤러리', en: 'PHOTOGRAPHY', accent: '#D9B26A',
    desc: '30미터짜리 긴 흰 벽. 필드에서 찍힌 것들.' },
  // 우승자의 방 — 2층 동쪽. 천장을 가장 높게, 북쪽 창으로 필드가 보인다
  { id: 'champion', content: 'champion', rect: { x: 3200, z: 0, w: 1600, d: 1800 }, lv: 1, h: 650,
    mat: 'velvet', name: '우승자의 방', en: 'HALL OF THE CHAMPION', accent: '#E3C567',
    desc: '가장 최근의 우승자 한 사람을 위한 방. 나머지는 전부 장식이다.' },
  /* ── 관리자 작업실 (비공개) ────────────────────────────────
     secret: true 인 방은 CONNS 에 통로를 만들지 않는다 → **관람객은 진입 불가**.
     로비 안내판·미니맵에 나오지 않고(관리자에게만 미니맵에 보인다) 관람객(NPC)도 없다.
     들어가는 방법은 전시 설정 패널의 '작업실로 이동' 뿐이다. */
  /* v126 — 작업실을 '관리자의 방' 으로(office.js). 느와르 · 기록과 기억 / 사람과 관계 / 시간과 유한함 */
  { id: 'workshop', content: 'workshop', rect: { x: 3200, z: 1800, w: 1600, d: 1200 }, lv: 1, h: 500,
    mat: 'walnut', secret: true, name: '관리자의 방', en: "THE KEEPER'S ROOM", accent: '#B8A27A',
    desc: '비가 오는 창. 스탠드 하나. 이 전시관을 지킨 사람의 생각이 물건마다 남아 있다.' },

  // ── 바깥 ────────────────────────────────────────────
  { id: 'deck', content: 'empty', outdoor: true, rect: { x: 1600, z: -800, w: 1600, d: 800 }, lv: 1,
    mat: 'deck', name: '전망 데크', en: 'OBSERVATION DECK', accent: '#E3C567',
    desc: '2층 바깥. 18번 홀이 한눈에 들어온다.' },
  { id: 'terrace', content: 'empty', outdoor: true, rect: { x: 1600, z: -800, w: 1600, d: 800 }, lv: 0, h: 500,
    mat: 'paver', name: '테라스', en: 'TERRACE', accent: '#E3C567',
    desc: '데크 아래 그늘. 여기서 티박스까지 걸어서 스무 걸음.' },
  { id: 'terW', part: 'terrace', content: 'empty', outdoor: true, rect: { x: 0, z: -800, w: 1600, d: 800 }, lv: 0,
    mat: 'paver', name: '테라스', en: 'TERRACE', accent: '#E3C567', desc: '' },
  { id: 'terE', part: 'terrace', content: 'empty', outdoor: true, rect: { x: 3200, z: -800, w: 1600, d: 800 }, lv: 0,
    mat: 'paver', name: '테라스', en: 'TERRACE', accent: '#E3C567', desc: '' },
  { id: 'field', content: 'courses', outdoor: true, terrain: true,
    rect: { x: -4000, z: -13000, w: 12800, d: 12200 }, lv: 0,
    name: '18번 홀', en: 'THE 18TH', accent: '#9BC27A',
    desc: '호수를 넘기는 파3. 티박스에서 직접 쳐 볼 수 있다. 카트길에는 코스별 기록 표석.' },
  // 건물 둘레 — 정문 광장(남) · 조각 정원(서) · 퍼팅 연습장(동). 한 바퀴 걸어서 돈다
  { id: 'plaza', content: 'empty', outdoor: true, rect: { x: 0, z: 3000, w: 4800, d: 3600 }, lv: 0,
    mat: 'paver', name: '정문 광장', en: 'ENTRANCE PLAZA', accent: '#E3C567',
    desc: '분수와 깃대. 현관 유리문으로 드나든다.' },
  { id: 'garden', content: 'empty', outdoor: true, rect: { x: -4000, z: -800, w: 4000, d: 7400 }, lv: 0,
    mat: 'lawn', name: '조각 정원', en: 'SCULPTURE GARDEN', accent: '#9BC27A',
    desc: '잔디와 자갈길. 거대한 골프공 조각 〈홀인원〉이 한가운데 있다.' },
  { id: 'practice', content: 'empty', outdoor: true, rect: { x: 4800, z: -800, w: 4000, d: 7400 }, lv: 0,
    mat: 'lawn', name: '퍼팅 연습장', en: 'PUTTING GREEN', accent: '#9BC27A',
    desc: '컵 넷짜리 연습 그린. 그린 위에서 퍼팅해 볼 수 있다.' },
  /* v122 — 맵 확장. 서쪽: 숲길(woods + 조각 셋) · 옛 클럽하우스(실내 넷) / 동쪽: 드라이빙 레인지 · 주차장(expand.js) */
  { id: 'woods', zone: 'west', content: 'empty', outdoor: true, rect: { x: -6200, z: -800, w: 2200, d: 7400 }, lv: 0,
    mat: 'forest', name: '숲길', en: 'WOODLAND PATH', accent: '#7FA06A',
    desc: '침엽수 사이 자갈길. 끝에 1998년에 문 닫은 옛 클럽하우스가 있다.' },
  { id: 'woodsN', part: 'woods', zone: 'west', content: 'empty', outdoor: true, rect: { x: -9600, z: -800, w: 3400, d: 2600 }, lv: 0,
    mat: 'forest', name: '숲길', en: 'WOODLAND PATH', accent: '#7FA06A', desc: '' },
  { id: 'woodsS', part: 'woods', zone: 'west', content: 'empty', outdoor: true, rect: { x: -9600, z: 4200, w: 3400, d: 2400 }, lv: 0,
    mat: 'forest', name: '숲길', en: 'WOODLAND PATH', accent: '#7FA06A', desc: '' },
  { id: 'woodsW', part: 'woods', zone: 'west', content: 'empty', outdoor: true, rect: { x: -9600, z: 1800, w: 1000, d: 2400 }, lv: 0,
    mat: 'forest', name: '숲길', en: 'WOODLAND PATH', accent: '#7FA06A', desc: '' },
  { id: 'oclobby', zone: 'west', content: 'empty', rect: { x: -7400, z: 1800, w: 1200, d: 1200 }, lv: 0, h: 380,
    mat: 'oldclub', name: '옛 클럽하우스', en: 'OLD CLUBHOUSE', accent: '#B08A4A',
    desc: '1998년 폐관. 프런트에 방명록이 펼쳐진 채 굳어 있다.' },
  { id: 'oclocker', zone: 'west', content: 'empty', rect: { x: -8600, z: 1800, w: 1200, d: 1200 }, lv: 0, h: 380,
    mat: 'oldtile', name: '라커룸', en: 'LOCKER ROOM', accent: '#8C988E',
    desc: '녹슨 라커 열여덟 칸. 이름표가 아직 붙어 있다.' },
  { id: 'ocshower', zone: 'west', content: 'empty', rect: { x: -8600, z: 3000, w: 1200, d: 1200 }, lv: 0, h: 380,
    mat: 'oldtile', name: '샤워실', en: 'SHOWER ROOM', accent: '#8C988E',
    desc: '칸막이 넷. 바닥 타일 줄눈이 검다.' },
  { id: 'ocdine', zone: 'west', content: 'empty', rect: { x: -7400, z: 3000, w: 1200, d: 1200 }, lv: 0, h: 380,
    mat: 'oldclub', name: '식당', en: 'DINING ROOM', accent: '#B08A4A',
    desc: '테이블 넷. 한 자리만 차려져 있다.' },
  { id: 'range', zone: 'east', content: 'empty', outdoor: true, rect: { x: 8800, z: -800, w: 6200, d: 5400 }, lv: 0,
    mat: 'lawn', name: '드라이빙 레인지', en: 'DRIVING RANGE', accent: '#9BC27A',
    desc: '지붕 덮인 타석 여덟. 과녁 그린까지 50 · 80 · 100 · 150 야드.' },
  { id: 'parking', zone: 'east', content: 'empty', outdoor: true, rect: { x: 8800, z: 4600, w: 6200, d: 2000 }, lv: 0,
    mat: 'asphalt', name: '주차장', en: 'PARKING', accent: '#B8B4A8',
    desc: '레인지 손님들 차. 몇 대는 오래 서 있었다.' },
  /* v108 — 지하 수장고(호러 10단계). 명예의 전당 바로 밑. 통로가 없다 — 밤이 깊으면 명예의 전당 서쪽 벽에
     생기는 '관계자 외 출입금지' 문으로만 내려간다(haunt.js). 미니맵 · 안내판 · 관리자 순간이동에 나오지 않는다 */
  { id: 'vault', content: 'empty', rect: { x: 0, z: 0, w: 1600, d: 1500 }, lv: -1, h: 380,
    mat: 'dark', secret: true, vault: true, name: '수장고', en: 'STORAGE', accent: '#8E4A40',
    desc: '관계자 외 출입금지. 걸리지 못한 것들이 쌓여 있다.' },
];

/**
 * 연결 — 맞닿은 두 방 사이에 **무엇이 있는지**.
 * 적지 않은 경계는 기본값: 실내끼리 벽 · 실내↔바깥 외벽 · 바깥끼리 높이가 같으면 트임, 다르면 난간.
 *   door       문(개구부 + 문선 + 명패)       open   트임(벽 없음)
 *   rail       유리 난간                    glass  통유리(못 지나간다)
 *   glassdoor  통유리 + 가운데 유리문         window 창이 난 벽
 *   stairside  계단 옆면(보이지 않는 충돌 — 난간은 계단이 직접 그린다)
 */
const CONNS = [
  // 그랜드 홀 — 계단 둘레 조각들은 서로 트여 있다
  ['grand', 'foyer', 'open'], ['grand', 'hallW', 'open'], ['grand', 'hallE', 'open'], ['grand', 'stair', 'open'],
  ['lounge', 'hallW', 'open'], ['lounge', 'hallE', 'open'],
  ['stair', 'hallW', 'stairside'], ['stair', 'hallE', 'stairside'],
  // 2층 회랑 — 계단 꼭대기는 트이고, 그랜드 홀 쪽은 난간
  ['mezz', 'stair', 'open'], ['mezz', 'hallW', 'rail'], ['mezz', 'hallE', 'rail'],
  // 전시실 입구
  ['hallW', 'hall', 'door'], ['grand', 'trophy', 'door'],
  ['hallE', 'archive', 'door'], ['grand', 'theater', 'door'],
  ['mezz', 'gallery', 'door'], ['mezz', 'champion', 'door'],
  // 바깥으로
  ['lounge', 'terrace', 'glassdoor'], ['mezz', 'deck', 'glassdoor'],
  ['foyer', 'plaza', 'glassdoor'],                               // 정문 — 광장으로 나간다
  ['champion', 'terE', 'window'],
  // 2층 사진 갤러리 — 그랜드 홀 위쪽 벽에 창을 내서 홀을 내려다본다
  ['gallery', 'grand', 'window'], ['gallery', 'hallW', 'window'],
  // v122 — 옛 클럽하우스: 숲길에서 로비로, 로비에서 라커룸 · 식당으로, 라커룸에서 샤워실로
  ['woods', 'oclobby', 'door'], ['oclobby', 'oclocker', 'door'], ['oclobby', 'ocdine', 'door'], ['oclocker', 'ocshower', 'door'],
];

/** 외벽 모양 — [방, 면(n/s/e/w), 종류]. 바깥(또는 아무것도 없는 쪽)과 맞닿은 면에만 쓴다 */
const FACADE = [

  ['lounge', 'n', 'glass'],
  ['grand', 's', 'window'],
  ['hall', 'w', 'window'], ['trophy', 'w', 'window'],
  ['archive', 'e', 'window'], ['theater', 'e', 'wall'],
  ['champion', 'e', 'window'],
  ['ocdine', 'e', 'window'], ['oclobby', 'n', 'window'], ['oclocker', 'w', 'window'], ['ocdine', 's', 'window'],
];

/* ── 분위기용 더미 오브젝트 ────────────────────────────────
   전부 의미 있는 물건이면 조사하는 재미가 없다.
   (The Caretaker 의 keyObject — 고정 반응만 돌려주는 것들) */
const PROPS = [
  // sprite = props.js 의 PROP_ART 키. 이모지를 쓰지 않는다(기기마다 모양이 다르고
  // 3D 공간에서 조명과 무관한 스티커처럼 보인다).
  { sprite: 'stanchion',    icon: '🚧', label: '관람 차단봉', say: '차단봉이다. 이 안쪽으로는 들어가지 말라는 뜻이지만, 안쪽에도 볼 건 없다.' },
  { sprite: 'bench',        icon: '🪑', label: '관람용 벤치',  say: '앉아본다. 전시보다 이게 더 좋다는 생각이 잠깐 든다.' },
  { sprite: 'extinguisher', icon: '🧯', label: '소화기',      say: '점검 스티커가 3년 전에 멈춰 있다.' },
  { sprite: 'planter',      icon: '🪴', label: '화분',        say: '조화다. 잎에 먼지가 앉아 있다. 아무도 물을 주지 않아서 오히려 오래 산다.' },
  { sprite: 'standee',      icon: '🪧', label: '안내 스탠드',  say: '"촬영은 자유입니다. 다만 본인 기록은 원본이 더 낫습니다."' },
  { sprite: 'bin',          icon: '🗑️', label: '휴지통',      say: '찢어진 스코어카드가 한 장 있다. 펴보지 않는 편이 서로에게 좋다.' },
  { sprite: 'cooler',       icon: '🚰', label: '정수기',      say: '온수만 나온다. 여름에도 온수만 나온다.' },
  { sprite: 'umbrella',     icon: '☂️', label: '우산 보관대',  say: '주인 없는 우산 넷. 그날 비가 얼마나 왔는지 알 수 있다.' },
  { sprite: 'clock',        icon: '🕰️', label: '벽시계',      say: '멈춰 있다. 바늘은 티오프 시각을 가리키고 있다.' },
];

/* ── 유틸 ──────────────────────────────────────────────── */
const pad3 = (n) => String(n).padStart(3, '0');
const fmtDate = (d) => (d ? String(d).slice(0, 10).replace(/-/g, '.') : '연도 미상');

/** 받침 판별 — 조사 처리 */
function josa(word, withJong, without) {
  if (!word) return without;
  const w = String(word).trim(), last = w[w.length - 1];
  // 숫자로 끝나면 읽는 소리로(일 · 삼 · 육 · 칠 · 팔 · 영 · 십 은 받침이 있다) — '멤버 1이', '3번 홀이'
  if (/[0-9]/.test(last)) return '013678'.includes(last) ? withJong : without;
  const c = w.charCodeAt(w.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return without;
  return (c - 0xac00) % 28 !== 0 ? withJong : without;
}

/** 평균타수 → 등급 (golfscore pg_score_tier 축약) */
function tierOf(avg) {
  if (avg == null) return { name: '미분류', emoji: '❔' };
  if (avg < 75) return { name: '신선', emoji: '👑' };
  if (avg < 80) return { name: '클론', emoji: '🤖' };
  if (avg < 85) return { name: '장인', emoji: '🕰️' };
  if (avg < 90) return { name: '쿠쿠', emoji: '💥' };
  if (avg < 95) return { name: '프로', emoji: '🛍️' };
  if (avg < 100) return { name: '도끼', emoji: '🪓' };
  if (avg < 105) return { name: '조경업자', emoji: '🐍' };
  if (avg < 110) return { name: '훈련병', emoji: '🪖' };
  if (avg < 120) return { name: '직각', emoji: '☠️' };
  return { name: '관중', emoji: '🎪' };
}

/* ══════════════════════════════════════════════════════════
   전시물 생성
   ══════════════════════════════════════════════════════════ */

let _acc = 0;
const nextNo = () => ++_acc;

/** content 종류 → CONFIG.MAX 의 키 (관리자가 방별 상한을 덮어쓸 때 쓴다) */
const MAX_KEY = {
  portraits: 'portrait', scorecards: 'scorecard', trophies: 'trophy',
  photos: 'photo', clips: 'screen', champion: 'champion',
};

/**
 * 이 방의 카테고리 목록 + **각 카테고리의 자료 건수**.
 * 건수를 같이 보여줘야 관리자가 '기타 12건 중 6건만 걸렸다' 를 알 수 있다
 * (전시 수 상한에 걸린 것인지, 자료가 그만큼인지 구분이 안 됐다).
 * @returns {{name:string, count:number}[]}
 */
function roomCategories(content, A) {
  const tally = (arr, pick) => {
    const m = new Map();
    for (const it of arr) {
      const v = pick(it);
      const k = (v == null || v === '') ? '(미분류)' : String(v);
      m.set(k, (m.get(k) || 0) + 1);
    }
    return [...m.entries()].map(([name, count]) => ({ name, count }));
  };
  if (content === 'clips') return tally(A.clips || [], (c) => c.category);
  if (content === 'photos') return tally(A.photos || [], (p) => p.album);
  if (content === 'scorecards') return tally(A.rounds || [], (r) => r.course || r.course_name);
  if (content === 'portraits') {
    return [
      { name: '선수', count: (A.players || []).length },
      { name: '갤러리', count: (A.gallery || []).length },
    ];
  }
  return [];
}

/**
 * @param {object} A loadArchive() 결과
 * @returns {object} roomId → 전시물 배열
 */
/* ══════════════════════════════════════════════════════════
   전시물 생성기 — content 종류별 (방 id 를 하드코딩하지 않는다)
   ══════════════════════════════════════════════════════════
   ROOMS 의 `content` 값이 이 표의 키다. 새 전시 종류를 만들려면
   여기에 함수 하나만 추가하면 된다.
   ────────────────────────────────────────────────────────── */
const CONTENT = {
  /* 명예의 전당 = 선수 초상 + 갤러리 멤버 초상.
     갤러리 멤버는 라운드 기록이 없어 rankings.php 에 아예 없다(data.js buildGallery).
     성적이 없으니 등급·순위 대신 '응원' 을 보여준다. */
  portraits: (A, M, cfg) => {
    const ranked = (catOn(cfg, '선수') ? [...A.players] : [])
      .sort((a, b) => (a.rank || 99) - (b.rank || 99))
      .map((p) => {
        const t = tierOf(p.avgStrokes);
        return {
          type: 'portrait', icon: '🖼️', label: p.name,
          img: A.memberPhotos[p.name] || placeholderImg(p.name, 44),
          title: p.name,
          subtitle: `${t.emoji} ${t.name}${p.rank ? ` · 종합 ${p.rank}위` : ''}`,
          body: portraitText(p, t),
          stats: [
            ['라운드', `${p.roundsCompleted}R`],
            ['평균', p.avgStrokes != null ? p.avgStrokes.toFixed(1) : '–'],
            ['베스트', p.best ?? '–'],
            ['우승', `${p.roundWins || 0}회`],
            ['버디', `${p.birdies || 0}`],
            ['이글', `${p.eagles || 0}`],
          ],
        };
      });

    const gallery = (catOn(cfg, '갤러리') ? (A.gallery || []) : []).map((g) => ({
      type: 'portrait', icon: '🎗️', label: g.name,
      img: A.memberPhotos[g.name] || placeholderImg(g.name, 152),
      title: g.name,
      subtitle: `🎗️ 갤러리${g.cheers ? ` · ${g.cheers} 응원` : ''}`,
      body: galleryText(g),
      stats: [
        ['구분', '갤러리'],
        ['응원', g.cheers || '전원'],
        ['라운드', '–'],
      ],
    }));

    // 선수를 먼저, 갤러리를 뒤에 — 상한은 둘을 합친 뒤에 적용한다
    return [...ranked, ...gallery].slice(0, M.portrait);
  },

  /* 기록 보관실 — 라운드 한 건이 액자 한 점.
     액자 그림은 사진이 아니라 **실기록으로 인쇄한 카드**다(museum3d scorecardTex).
     홀별 타수와 원본 사진은 팝업을 열 때 받아온다(data.js loadRoundScores). */
  scorecards: (A, M, cfg) => (A.rounds || [])
    .filter((r) => catOn(cfg, r.course || r.course_name))
    .slice(0, M.scorecard).map((r) => {
      const card = roundCard(r);
      return {
        type: 'scorecard', icon: '📋', label: `${card.course} ${card.date}`,
        card,
        title: `${card.course} · ${card.date}`,
        subtitle: [
          card.sub,
          card.tee ? `티오프 ${card.tee}` : null,
          `${card.rows.length}명`,
        ].filter(Boolean).join(' · '),
        body: scorecardText(card),
        stats: [
          ['우승', card.winner || '–'],
          ['최저타', card.best ?? '–'],
          ['기준타수', card.par],
          ['참가', `${card.rows.length}명`],
        ],
      };
    }),

  trophies: (A, M) => buildTrophies(A).slice(0, M.trophy),

  photos: (A, M, cfg) => (A.photos || [])
    .filter((p) => catOn(cfg, p.album))
    .slice(0, M.photo).map((p) => ({
    type: 'photo', icon: '🖼️', label: p.title || '무제',
    img: p.thumb || placeholderImg(p.title || '사진', 205),
    // 여러 장 묶음은 팝업에서 넘겨볼 수 있게 원본 id·장수를 넘긴다
    photoId: p.id, imgCount: Math.max(1, p.img_count || 1), src: p,
    title: p.title || '무제',
    subtitle: [p.album, p.nickname, fmtDate(p.created_at)].filter(Boolean).join(' · '),
    body: photoText(p),
  })),

  clips: (A, M, cfg) => (A.clips || [])
    .filter((c) => catOn(cfg, c.category))
    .slice(0, M.screen).map((c) => ({
    type: 'screen', icon: '📺', label: c.title || '무제',
    img: c.thumb || placeholderImg(c.category || '영상', 330),
    // ⚠️ golfscore 의 clip.embed 는 HTML 이 아니라 **재생 URL** 이다.
    //    (youtube→/embed/ID?autoplay=1…, drive→/preview, 그 외→원본 주소)
    //    그대로 innerHTML 에 넣으면 주소 문자열만 찍힌다 → videoHTML() 이 감싼다.
    embed: c.embed || null,
    provider: c.provider || null,
    portrait: !!c.portrait,     // 쇼츠(세로) — 팝업 비율을 9:16 으로
    title: c.title || '무제',
    subtitle: [c.category, c.players, fmtDate(c.played_at)].filter(Boolean).join(' · '),
    body: clipText(c),
  })),

  lobby: (A) => [
    {
      type: 'placard', icon: '🪧', label: '관람 안내',
      // poster:true 인 것만 3D 액자에 로고 포스터를 그린다(museum3d buildArtMesh).
      // 팝업에서는 로고 원본을 그대로 보여준다.
      poster: true,
      img: SITE.logo,
      title: SITE.title,
      body: [
        '본관은 버디버디의 기록으로만 채워져 있습니다.',
        '전시물은 큐레이터가 고르지 않습니다. 라운드가 등록되면 전시물이 한 점 늘어납니다.',
        '',
        // 전시실 안내는 실제 배치에서 만든다(방을 옮겨도 문구가 어긋나지 않게)
        roomGuideText(),
        '',
        // {TOTAL} 은 배치가 끝난 뒤 실제 전시물 수로 치환된다(museum3d.js renderExhibit)
        '현재 소장품 {TOTAL}점.',
      ].join('\n'),
    },
    {
      type: 'guestbook', sprite: 'book', icon: '📖', label: '방명록',
      title: '방명록',
      caption: '관람객이 남긴 글. 대부분 익명입니다.',
      entries: A.guestbook || [],
    },
  ],

  /* 우승자의 방 — 가장 최근 라운드의 우승자 한 사람.
     ㉠ 정면 벽에 거대한 초상(type:'champion' — 규격이 다르다)
     ㉡ 좌우에 대형 우승컵을 올린 좌대
     ㉢ 벽에 이름을 박은 현수막, 월계관, 메달 진열
     ㉣ 나머지 벽에는 그 사람의 다른 기록들 */
  champion: (A, M) => {
    const w = recentWinner(A);
    if (!w) {
      return [{
        type: 'placard', icon: '🪧', label: '수여 대기',
        title: '우승자의 방',
        body: [
          '이 방은 비어 있다.',
          '완주한 라운드가 등록되면 그날의 우승자가 이 벽에 걸린다.',
          '',
          '벽이 비어 있는 것은 아직 아무도 이기지 않았다는 뜻이 아니다.',
          '기록이 도착하지 않았다는 뜻이다.',
        ].join('\n'),
      }];
    }
    const p = w.player || {};
    const out = [{
      type: 'champion', icon: '👑', label: w.name,
      /* 액자 중심 높이(cm). 일반 액자는 152 인데, 이 액자는 340cm 짜리라
         같은 152 에 걸면 아래쪽이 **바닥 아래(-18cm)** 까지 내려간다.
         발밑에서 시작하면 위엄이 죽는다 → 액자 밑단이 눈높이(165) 위로 올라가게
         340 으로 올린다. 그러면 초상 전체를 올려다보게 된다.
           밑단 170cm · 윗단 510cm · 크레스트 574cm (벽감 590cm 안) */
      artY: 340,
      img: A.memberPhotos[w.name] || placeholderImg(w.name, 44),
      title: w.name,
      subtitle: `최근 우승 · ${fmtDate(w.round.played_at)} · ${w.round.course || '구장 미상'}`,
      body: championText(w, p),
      stats: [
        ['우승일', fmtDate(w.round.played_at)],
        ['당일 최저타', w.round.best ?? '–'],
        ['통산 우승', `${p.roundWins || 0}회`],
        ['평균', p.avgStrokes != null ? p.avgStrokes.toFixed(1) : '–'],
      ],
    }];
    // 좌우 대형 우승컵 — 초상과 짝을 이루는 두 점
    out.push({
      type: 'relic', sprite: 'bigcup', icon: '🏆', label: '우승컵',
      title: '우승컵',
      plateLines: [w.name, `${fmtDate(w.round.played_at)} · ${w.round.course || ''}`],
      caption: `${fmtDate(w.round.played_at)} · ${w.round.course || ''}`,
      body: [
        '도금이 벗겨진 자리가 있다. 매번 같은 손이 같은 자리를 잡았다는 뜻이다.',
        `현재 명패에는 ${w.name}${josa(w.name, '이', '가')} 새겨져 있다.`,
        '다음 라운드가 끝나면 새겨진 이름이 바뀔 수도 있다.',
      ].join('\n'),
    });
    out.push({
      type: 'relic', sprite: 'laurel', icon: '🌿', label: '월계관',
      title: '월계관',
      caption: '수여식용. 실제로 쓴 사람은 아직 없다',
      body: [
        '아무도 이걸 머리에 얹으려 하지 않는다.',
        '사진을 찍자고 하면 전원이 사양한다.',
        '그래서 월계관은 늘 좌대 위에 있다.',
      ].join('\n'),
    });
    out.push({
      type: 'relic', sprite: 'medals', icon: '🎖️', label: '메달 진열',
      title: '메달 진열', count: Math.max(1, Math.min(7, p.roundWins || 1)),
      caption: `통산 우승 ${p.roundWins || 0}회분`,
      body: [
        `${w.name}${josa(w.name, '이', '가')} 지금까지 받은 메달을 모아 걸었다.`,
        (p.roundWins || 0) > 3
          ? '개수가 많아 진열대를 한 번 늘렸다.'
          : '진열대에 빈 고리가 남아 있다. 늘어날 자리다.',
      ].join('\n'),
    });
    // 그 사람의 다른 기록 — 벽을 채우는 부속 전시
    if (p.best != null) {
      out.push({
        type: 'scorecard', icon: '📋', label: '개인 최저타',
        img: placeholderImg(`${p.best}타`, 120),
        title: `개인 최저타 ${p.best}타`,
        subtitle: `${w.name} · 통산 ${p.roundsCompleted || 0}R`,
        body: [
          `${w.name}${josa(w.name, '의', '의')} 개인 최저 기록은 ${p.best}타다.`,
          '그날의 스코어카드는 별도 보관 중이다.',
          (p.hio || 0) > 0 ? `홀인원 ${p.hio}회.` : '',
        ].filter(Boolean).join('\n'),
        stats: [['최저타', p.best], ['버디', p.birdies || 0], ['이글', p.eagles || 0]],
      });
    }
    return out.slice(0, Math.max(1, M.champion || 6));
  },

  /* 작업실 → v126 '관리자의 방'(office.js 가 직접 꾸민다) — 전시물(명패)을 두지 않는다 */
  workshop: () => [],

  /* 18번 홀 — 카트길을 따라 선 **코스별 기록 표석**.
     라운드를 코스(course_name)로 묶어 코스 레코드·최다 우승·라운드 수를 새긴다.
     라운드가 쌓이면 표석의 숫자가 바뀌고, 처음 가본 코스가 생기면 표석이 하나 늘어난다. */
  courses: (A) => courseStones(A),

  empty: () => [],
};

function courseStones(A) {
  const by = new Map();
  for (const r of A.rounds || []) {
    const name = r.course || r.course_name;
    if (!name) continue;
    if (!by.has(name)) by.set(name, []);
    by.get(name).push(r);
  }
  const out = [];
  for (const [name, rounds] of by) {
    let rec = null;
    const wins = new Map();
    for (const r of rounds) {
      const w = roundWinner(r);
      if (!w || w.total == null) continue;
      wins.set(w.name, (wins.get(w.name) || 0) + 1);
      if (!rec || w.total < rec.total) rec = { ...w, date: r.played_at };
    }
    const king = [...wins.entries()].sort((a, b) => b[1] - a[1])[0];
    const last = [...rounds].sort((a, b) => String(b.played_at || '').localeCompare(String(a.played_at || '')))[0];
    out.push({
      type: 'marker', sprite: 'stone', icon: '🪨', label: name,
      title: `${name} 코스 기록`,
      subtitle: `라운드 ${rounds.length}회 · 마지막 ${fmtDate(last && last.played_at)}`,
      plateLines: [name, rec ? `코스 레코드 ${rec.total}타 · ${rec.name}` : '코스 레코드 없음'],
      body: [
        `${name}에서 이 클럽이 돈 라운드는 ${rounds.length}번이다.`,
        rec ? `코스 레코드는 ${rec.total}타. ${fmtDate(rec.date)}, ${rec.name}.` : '18홀을 끝까지 적은 기록이 아직 없다.',
        king ? `이 코스에서 가장 자주 이긴 사람은 ${king[0]}(${king[1]}회)다.` : '',
        '',
        '표석은 라운드가 등록될 때마다 다시 새겨진다. 돌에 새긴 것치고는 자주 바뀐다.',
      ].filter((l, i, arr) => l !== '' || arr[i - 1] !== '').join('\n'),
      stats: [
        ['라운드', `${rounds.length}회`],
        ['코스 레코드', rec ? `${rec.total}타` : '–'],
        ['보유자', rec ? rec.name : '–'],
        ['최다 우승', king ? `${king[0]} · ${king[1]}회` : '–'],
      ],
    });
  }
  // 많이 간 코스부터 — 표석이 카트길 앞쪽에 선다
  out.sort((a, b) => parseInt(b.stats[0][1], 10) - parseInt(a.stats[0][1], 10));
  return out.slice(0, 8);
}

/**
 * 라운드 1건의 우승자 — { name, total } 또는 null.
 *   · completed(18홀 완주) 인 사람만 후보
 *   · total 최소값이 우승
 *   · 동타면 hidden(홀인원10·이글5·버디3·파1) 이 높은 쪽 — API 가 그 목적으로 준다
 * 샘플 데이터는 winner 를 직접 갖고 있다.
 */
function roundWinner(r) {
  if (r.winner) return { name: r.winner, total: r.best ?? null };
  const done = (r.players || []).filter((p) => p && typeof p === 'object' && p.completed && p.total != null);
  if (!done.length) return null;
  const best = [...done].sort((a, b) =>
    (a.total - b.total) || ((b.hidden || 0) - (a.hidden || 0)))[0];
  return { name: best.name, total: best.total };
}

/**
 * 스코어카드 한 장 — 3D 액자(scorecardTex)와 팝업(scoreHTML)이 **같은 값**을 그린다.
 * list_rounds 의 players 는 객체({name,total,played,completed}), 샘플은 이름 문자열이다.
 * 샘플은 합계가 없으므로 승자=최저타, 나머지는 시드 난수로 그 위에 쌓는다(매번 같은 값).
 */
function roundCard(r) {
  const par = +r.par || 72;
  const w = roundWinner(r);
  const src = r.players || [];
  let rows;
  if (src.length && typeof src[0] === 'object') {
    rows = src.map((p) => ({
      name: p.name, total: p.total, played: p.played || 0, done: !!p.completed,
    }));
  } else {
    const rnd = seeded(r.id || 1);
    rows = src.map((n) => ({
      name: n, played: 18, done: true,
      total: (n === r.winner && r.best != null) ? r.best : (r.best || 80) + 2 + Math.floor(rnd() * 22),
    }));
  }
  rows.forEach((x) => {
    x.diff = (x.done && x.total != null) ? x.total - par : null;
    x.win = !!(w && x.name === w.name);
  });
  const front = r.course_front, back = r.course_back;
  return {
    id: r.id, code: r.room_code || r.code || '',
    course: r.course || r.course_name || '구장 미상',
    sub: front && back ? (front === back ? `${front} 코스` : `${front} → ${back}`) : (r.course_sub_name || ''),
    date: fmtDate(r.played_at),
    tee: r.tee_off_time ? String(r.tee_off_time).slice(0, 5) : '',
    front: front || '', back: back || '',
    par, rows,
    winner: w ? w.name : null,
    best: w ? w.total : null,
    by: r.created_by_name || '',
  };
}

/**
 * 가장 최근에 '완주 우승' 이 기록된 라운드와 그 사람.
 *
 * ⚠️ list_rounds.php 는 **winner 필드를 주지 않는다.** 처음엔 r.winner 를 읽었는데
 *    (샘플 데이터에만 있는 필드였다) 실데이터에서는 늘 null 이 되어 우승자의 방이
 *    '수여 대기' 로 남았다. 실제로는 players[] 에서 직접 뽑는다(roundWinner).
 *    course 도 course_name 이고 best 도 없다(최소 total 이 그날 최저타다).
 */
function recentWinner(A) {
  const cands = (A.rounds || [])
    .map((r) => ({ r, w: roundWinner(r) }))
    .filter((x) => x.w && x.w.name);
  if (!cands.length) return null;
  // 날짜 내림차순 — API 가 이미 최신순이지만 믿지 않는다
  cands.sort((a, b) =>
    String(b.r.played_at || '').localeCompare(String(a.r.played_at || '')) || (b.r.id || 0) - (a.r.id || 0));
  const { r, w } = cands[0];
  const round = {
    ...r,
    course: r.course || r.course_name || null,
    best: r.best ?? w.total,
  };
  return { name: w.name, round, player: (A.players || []).find((p) => p.name === w.name) || null };
}

function championText(w, p) {
  const L = [];
  L.push(`${fmtDate(w.round.played_at)}, ${w.round.course || '어느 구장'}.`);
  L.push(`그날 ${w.name}${josa(w.name, '이', '가')} 이겼다.`);
  if (w.round.best != null) L.push(`당일 최저타 ${w.round.best}타.`);
  if (w.round.player_count) L.push(`${w.round.player_count}명이 함께 돌았고, 나머지 ${w.round.player_count - 1}명은 이 방에 걸리지 않았다.`);
  L.push('');
  if ((p.roundWins || 0) > 1) {
    L.push(`통산 ${p.roundWins}번째 우승이다. 이 방의 주인이 자주 바뀌지 않는 이유다.`);
  } else {
    L.push('첫 우승이다. 본관은 첫 우승을 통산 우승과 똑같은 크기로 건다.');
  }
  L.push('');
  L.push('※ 이 초상은 다음 라운드가 등록되는 순간 교체된다. 영구 소장품이 아니다.');
  return L.join('\n');
}

/**
 * 관리자 설정을 ROOMS 에 적용한다 — 반드시 buildExhibits 보다 먼저 부른다.
 * ROOMS 의 `closed` 는 코드에 적어둔 기본값이고, 관리자 설정이 있으면 그것이 이긴다
 * (그래서 기록 보관실을 패널에서 다시 열 수도 있다).
 */
function applyAdminRooms() {
  for (const r of ROOMS) {
    if (r._closed0 === undefined) r._closed0 = r.closed || null;   // 기본값 원본 보관
    const s = (ADMIN.rooms || {})[r.id];
    if (!s || s.hidden === undefined) { r.closed = r._closed0; continue; }
    r.closed = s.hidden ? (s.note || '전시 준비 중') : null;
  }
}

/** 안내판용 전시실 목록 — ROOMS 에서 자동 생성 */
function roomGuideText() {
  // secret 방은 안내판에 적지 않는다(존재를 알릴 이유가 없다). 한 공간의 조각(part)도 뺀다
  return ROOMS.filter((r) => r.content !== 'lobby' && !r.secret && !r.part && r.desc)
    .map((r) => (r.closed
      ? `· ${r.name} — ${r.closed}. 관람하실 수 없습니다.`
      : `· ${r.name} — ${r.desc}`))
    .join('\n');
}

/**
 * @param {object} A loadArchive() 결과
 * @returns {object} roomId → 전시물 배열
 */
function buildExhibits(A) {
  _acc = 0;
  applyAdminRooms();
  const M = CONFIG.MAX;
  const byRoom = {};

  ROOMS.forEach((r) => {
    // 닫힌 방 — 들어갈 수 없으니 전시물을 만들지 않는다.
    // (만들면 소장품 총점에 들어가 관람 진행률이 영원히 100%에 못 닿는다)
    if (r.closed) { byRoom[r.id] = []; return; }
    const gen = CONTENT[r.content];
    if (!gen) {
      console.warn(`[museum] 알 수 없는 content: '${r.content}' (${r.id}) — 소품만 배치합니다.`);
      byRoom[r.id] = [];
      return;
    }
    // 관리자 설정의 전시 수 상한 — 방별로 MAX 를 덮어쓴다
    const cfg = roomCfg(r.id);
    const lim = cfg.max == null ? M : { ...M, [MAX_KEY[r.content] || 'portrait']: cfg.max };
    byRoom[r.id] = gen(A, lim, cfg).map((e) => ({
      ...e,
      // 안내·비전시품에는 소장품 번호를 붙이지 않는다
      no: (e.type === 'placard' || e.type === 'guestbook' || e.type === 'prop') ? undefined : nextNo(),
    }));
  });

  /* ── 분위기용 소품 — 전시실마다 1~2개 ── */
  ROOMS.forEach((r, i) => {
    // 닫힌 방과 작업실은 소품을 두지 않는다(작업실은 빈 상태로 시작해야 쓸모가 있다)
    // 계단·바깥에는 소화기·화분을 두지 않는다(바깥 소품은 world.js 가 직접 만든다)
    if (r.closed || r.secret || r.stair || r.outdoor || r.zone) return;          // v122 — 새 구역(클럽하우스)은 expand.js 가 직접 꾸민다
    const a = PROPS[(i * 3) % PROPS.length];
    const b = PROPS[(i * 3 + 1) % PROPS.length];
    byRoom[r.id].push({ type: 'prop', sprite: a.sprite, icon: a.icon, label: a.label, title: a.label, body: a.say });
    // 전시물이 적은 방은 소품을 하나 더 둬서 허전함을 줄인다
    if (byRoom[r.id].length <= 3) {
      byRoom[r.id].push({ type: 'prop', sprite: b.sprite, icon: b.icon, label: b.label, title: b.label, body: b.say });
    }
  });

  return byRoom;
}

/* ── 해설문 ─────────────────────────────────────────────── */

/** 갤러리 멤버 해설 — 성적표가 없는 사람의 초상에 붙는 글 */
function galleryText(g) {
  const L = [];
  L.push(`${g.name}${josa(g.name, '은', '는')} 갤러리로 이 클럽에 등록되어 있다.`);
  L.push('스코어카드에 이름이 오르지 않는다. 그래서 평균타수도, 최저타도 없다.');
  if (g.cheers) {
    L.push(`${g.cheers}${josa(g.cheers, '을', '를')} 응원한다. 그 사람의 기록 어딘가에는 이 응원이 섞여 있을 것이다.`);
  } else {
    L.push('특정한 한 사람을 응원하지 않는다. 그날 가장 무너진 사람 쪽에 서 있는 편이다.');
  }
  L.push('');
  L.push('본관은 성적으로 초상을 걸지 않는다. 명부에 이름이 있으면 걸린다.');
  return L.join('\n');
}

function portraitText(p, t) {
  const L = [];
  const avg = p.avgStrokes;
  L.push(`${p.name}${josa(p.name, '은', '는')} ${p.roundsCompleted}번의 라운드를 이 클럽에 남겼다.`);
  if (avg != null) L.push(`평균 ${avg.toFixed(1)}타. 클럽은 이 구간을 〈${t.name}〉으로 분류한다.`);
  if (p.best != null) L.push(`개인 최저타는 ${p.best}타다. 그날 무슨 일이 있었는지는 기록에 남아 있지 않다.`);

  if (p.hio > 0) L.push(`홀인원 ${p.hio}회. 본관에서 이 항목이 0이 아닌 사람은 극히 드물다.`);
  else if (p.eagles > 0) L.push(`이글 ${p.eagles}회. 홀인원 칸은 아직 비어 있다.`);

  const holes = Math.max(1, p.roundsCompleted * 18);
  const blow = ((p.trip || 0) + (p.quad || 0)) / holes * 100;
  if (blow > 20) L.push(`트리플 이상이 전체 홀의 ${blow.toFixed(0)}%. 관람객 여러분은 이 수치를 보고 웃지 마십시오. 본인 것일 수도 있습니다.`);
  else if (blow < 4) L.push(`트리플 이상이 전체 홀의 ${blow.toFixed(1)}%에 불과하다. 무너지지 않는다는 뜻이다.`);

  if ((p.roundWins || 0) > 0) {
    const wr = (p.roundWins / p.roundsCompleted * 100).toFixed(0);
    L.push(`우승 ${p.roundWins}회, 승률 ${wr}%.`);
  } else {
    L.push('아직 우승 기록은 없다. 본관은 우승만 전시하지 않는다.');
  }
  return L.join('\n');
}

function scorecardText(card) {
  const L = [];
  L.push(`${card.date}, ${card.course}에서 치러진 라운드의 스코어카드다.`);
  if (card.front && card.back) {
    L.push(card.front === card.back
      ? `전·후반 모두 ${card.front} 코스를 돌았다.`
      : `전반 ${card.front}, 후반 ${card.back}.`);
  }
  if (card.tee) {
    const h = parseInt(card.tee.slice(0, 2), 10);
    L.push(h < 8 ? `티오프 ${card.tee}. 해가 덜 뜬 시각이다.`
      : h >= 15 ? `티오프 ${card.tee}. 후반은 어두워졌을 것이다.`
        : `티오프 ${card.tee}.`);
  }
  if (card.winner) {
    L.push(`이날의 승자는 ${card.winner}${josa(card.winner, '이었다', '였다')}.`
      + (card.best != null ? ` ${card.best}타.` : ''));
  } else {
    L.push('18홀을 끝까지 적은 사람이 없어 승자 칸이 비어 있다.');
  }
  const names = card.rows.map((x) => x.name).filter(Boolean);
  if (names.length) L.push(`참가 — ${names.join(', ')}.`);
  const dnf = card.rows.filter((x) => !x.done).length;
  if (dnf) L.push(`${dnf}명은 18홀을 다 적지 못했다. 그 칸은 빈 채로 보관한다.`);
  L.push('');
  L.push('※ 사후에 수정된 항목이 있을 수 있으나, 본관은 최초 제출본을 기준으로 보관한다.');
  return L.join('\n');
}

function photoText(p) {
  const L = [`${fmtDate(p.created_at)}에 등록된 사진이다.`];
  if (p.album) L.push(`분류 — ${p.album}.`);
  if (p.nickname) L.push(`기증자 ${p.nickname}.`);
  if (p.img_count > 1) L.push(`같은 묶음에 ${p.img_count}장이 함께 들어왔다.`);
  L.push('');
  L.push('촬영 당시 피사체가 촬영에 동의했는지는 확인되지 않았다.');
  return L.join('\n');
}

function clipText(c) {
  const L = [];
  if (c.category) L.push(`〈${c.category}〉 분류로 보관된 영상이다.`);
  if (c.players) L.push(`출연 — ${c.players}.`);
  if (c.played_at) L.push(`촬영 ${fmtDate(c.played_at)}.`);
  if (c.comment_count > 0) L.push(`관람객 논평 ${c.comment_count}건이 달려 있다. 대부분 위로가 아니다.`);
  L.push('');
  L.push(c.embed
    ? '아래 화면에서 곧바로 상영됩니다.'
    : '※ 원본 영상이 연결되지 않았습니다. 실데이터 연동 시 이 자리에서 재생됩니다.');
  return L.join('\n');
}

/* ── 트로피 ─────────────────────────────────────────────── */
function buildTrophies(A) {
  const ps = A.players || [];
  if (!ps.length) return [];
  const by = (f) => [...ps].filter((p) => f(p) != null).sort((a, b) => f(a) - f(b));

  const out = [];
  const mvp = [...ps].sort((a, b) => (a.rank || 99) - (b.rank || 99))[0];
  const low = by((p) => p.best)[0];
  const most = [...ps].sort((a, b) => (b.roundWins || 0) - (a.roundWins || 0))[0];
  const diligent = [...ps].sort((a, b) => b.roundsCompleted - a.roundsCompleted)[0];
  const birdie = [...ps].sort((a, b) => (b.birdies || 0) - (a.birdies || 0))[0];
  const worst = [...ps].sort((a, b) => (b.avgStrokes || 0) - (a.avgStrokes || 0))[0];

  const T = (icon, label, title, who, line) => ({
    type: 'trophy', sprite: 'trophy', icon, label, title,
    subtitle: who ? `수상자 ${who}` : '',
    body: line,
  });

  if (mvp) out.push(T('🏆', 'MVP', '올해의 선수', mvp.name,
    `종합 순위 1위. 평균 ${(mvp.avgStrokes ?? 0).toFixed(1)}타, ${mvp.roundsCompleted}라운드.\n본관에서 가장 자주 언급되는 이름이다.`));
  if (low) out.push(T('⛳', '최저타', '코스 레코드', low.name,
    `단일 라운드 최저타 ${low.best}타.\n같은 사람이 다음 주에 같은 스코어를 낼 확률은 아무도 계산하지 않았다.`));
  if (most) out.push(T('💎', '다승', '최다 우승', most.name,
    `우승 ${most.roundWins || 0}회.\n이기는 습관이라는 말은 대체로 결과를 보고 나서 붙는다.`));
  if (diligent) out.push(T('🗓️', '개근', '최다 출석', diligent.name,
    `${diligent.roundsCompleted}라운드.\n실력과 출석은 별개지만, 출석 없이 실력이 붙은 사례도 없다.`));
  if (birdie) out.push(T('🐦', '버디왕', '최다 버디', birdie.name,
    `누적 버디 ${birdie.birdies || 0}개.\n한 홀에서 한 타를 줄인 순간이 ${birdie.birdies || 0}번 있었다는 뜻이다.`));
  if (worst && worst !== mvp) out.push(T('🪳', '노력상', '가장 먼 길', worst.name,
    `평균 ${(worst.avgStrokes ?? 0).toFixed(1)}타.\n본관은 이 명패를 조롱으로 걸어두지 않는다. 가장 많이 걸어본 사람의 기록이다.`));

  /* ── 기록이 있을 때만 걸리는 명패 ──────────────────────────
     해당 기록이 0 이면 만들지 않는다(빈 명패는 '아무도 못 했다' 가 아니라 '고장' 으로 읽힌다).
     비율 명패는 3라운드 이상만 — 한 번 나와서 잘 친 사람이 영구히 1위가 되지 않게.
     ⚠️ 전시 상한은 8(CONFIG.MAX.trophy). 전시물 조명 풀이 8발이라 그보다 많으면 먼 명패가
        어둡게 남는다. 그래서 순서가 곧 우선순위다 — 홀인원 → 양파 → 이글 → 파. */
  const top = (f, pool = ps) => [...pool].sort((a, b) => f(b) - f(a))[0];
  const regular = ps.filter((p) => (p.roundsCompleted || 0) >= 3);
  const perR = (k) => (p) => (p[k] || 0) / Math.max(1, p.roundsCompleted || 0);

  const ace = top((p) => p.hio || 0);
  if (ace && (ace.hio || 0) > 0) out.push(T('🎯', '홀인원', '에이스', ace.name,
    `홀인원 ${ace.hio}회.\n공은 한 번에 들어갔고, 그 이야기는 그 뒤로 한 번에 끝난 적이 없다.`));

  const blow = regular.length ? top(perR('quad'), regular) : null;
  if (blow && (blow.quad || 0) > 0) out.push(T('🧨', '양파', '가장 긴 홀', blow.name,
    `라운드당 양파 ${perR('quad')(blow).toFixed(1)}회.\n받고 싶지 않은 명패도 있다. 이 방의 소개문은 이 명패를 두고 쓴 것이다.`));

  const eagle = top((p) => p.eagles || 0);
  if (eagle && (eagle.eagles || 0) > 0) out.push(T('🦅', '이글', '이글 사냥꾼', eagle.name,
    `누적 이글 ${eagle.eagles}개.\n두 타를 한 번에 줄이는 일은 계획해서 되지 않는다. 그래서 명패가 된다.`));

  const steady = regular.length ? top(perR('pars'), regular) : null;
  if (steady && (steady.pars || 0) > 0) out.push(T('🧱', '파 수집가', '무너지지 않는 사람', steady.name,
    `라운드당 파 ${perR('pars')(steady).toFixed(1)}개.\n화려한 홀은 드물다. 대신 망친 홀도 드물다. 스코어카드가 조용하다.`));
  return out;
}
