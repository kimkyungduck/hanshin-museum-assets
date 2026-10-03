/* ══════════════════════════════════════════════════════════
   밤의 기록 · 기념 사진 — 13 · 14단계 (v111)
   ══════════════════════════════════════════════════════════
   · 밤의 기록 — 밤에 본 것들 열여섯 가지. 처음 보면 왼쪽 위에 짧게 뜨고, 이 기기에 남는다(localStorage).
     표지의 '밤의 기록 n/16' 에서 모아 본 것을 다시 본다(못 본 것은 ??? 와 귀띔 한 줄)
   · 기념 사진 — P 키 · 📷 칩. 지금 보는 장면을 액자 틀(관 이름 · 방 · 시각)에 넣어 내려받는다.
     밤에는 가끔 — 화면엔 없던 사람이 사진에만 찍혀 있다 */
const RECORDS = [
  ['shade', '문간의 그림자', '옆방 문 너머를 오래 보면'],
  ['fog', '안개 속의 사람', '바깥, 안개가 짙은 쪽'],
  ['beam', '빛 속의 사람', '손전등을 켜고 다니면'],
  ['mimic', '나란히 걷는 사람', '두 번째 밤, 곁눈으로'],
  ['black', '정전 속의 사람', '불이 다시 들어오는 순간'],
  ['banish', '빛으로 쫓아냄', '그 사람을 빛으로 붙잡으면'],
  ['stare', '모두가 나를 봤다', '밤이 깊으면, 사람들 사이에서'],
  ['corner', '구석의 혼잣말', '중얼거리는 사람 뒤에 서면'],
  ['kids', '술래는 저 아저씨', '정원의 아이들에게 다가가면'],
  ['portrait', '눈이 생긴 초상', '명예의 전당 이젤'],
  ['vault', '수장고', '관계자 외 출입금지'],
  ['today', '오늘 날짜의 초상', '수장고 동쪽 벽'],
  ['loop', '정문은 들어오는 문', '마지막 방송 뒤, 정문으로'],
  ['end', '관람 종료', '초상 앞에 서면'],
  ['escape', '퇴장', '두 번째 밤, 세 번째 정문'],
  ['photo', '사진에만 찍힌 사람', '밤에 기념 사진을 찍으면'],
  ['jump', '뒤에 있었다', '밤이 깊으면, 빠르게 돌아보지 마라'],
  ['escroom', '방탈출 성공', '표지의 🔐 방탈출'],
  ['behind', '내 뒤를 보는 사람', '관람객과 이야기를 오래 하면'],
  ['stay', '아직 안 끝났잖아요', '밤이 깊을 때, 대화 중에 떠나려 하면'],
  ['name', '이름을 말했다', '이름을 묻는 사람에게'],
  ['lakewoman', '물러나는 등', '호수 바닥'],
  ['bank', '둑 위의 사람들', '물속에서 올려다보면'],
  ['walker', '걸어오는 그 사람', '밤이 절반을 넘기면, 긴 방에서'],
  ['double', '같은 사람이 또', '방금 지나친 사람을 기억해 두면'],
  ['traces', '흔적을 따라', '전시관 밖, 벽과 풀밭에 남은 것들'],
  ['resting', '쉬는 사람', '쉬고 있는 회원 이야기를 끝까지 들으면'],
  ['shot', '찍혔다', '전시를 찍던 사람 곁에 오래 서 있으면'],
  ['beckon', '이리 와', '숲가의 그 사람을 멀리서 지켜보면'],
  ['cart', '아무도 안 탄 카트', '밤의 카트길에서'],
  ['hands', '물 위의 손', '밤의 호숫가에서 수면을 보고 있으면'],
  ['reflection', '수면에 비친 것', '물가에서 수면을 내려다보면'],
  ['wetprints', '물에서 나온 발자국', '호숫가에 오래 서 있으면'],
  ['lakehead', '호수 한가운데', '밤의 호수를 멀리서 보면'],
  ['glassprints', '유리창의 손자국', '밤, 바깥에 면한 방에서'],
  ['nail', '못 박는 소리', '밤의 숲길 깊은 곳에서'],
  ['lockers', '열리는 라커', '밤, 옛 클럽하우스 라커룸에서'],
  ['shower', '물이 흐르는 샤워실', '밤, 옛 클럽하우스 샤워실에서'],
  ['diner', '식당의 손님', '밤, 옛 클럽하우스 식당에서'],
  ['range', '빈 타석', '밤의 드라이빙 레인지에서'],
];
const REC_KEY = 'museum-records';
const REC = { got: {} };
try { REC.got = JSON.parse(localStorage.getItem(REC_KEY) || '{}') || {}; } catch (e) { REC.got = {}; }
const recCount = () => RECORDS.filter((r) => REC.got[r[0]]).length;
/** 기록 하나 — 처음일 때만 띄운다(밤에만) */
function hauntRec(id) {
  if (typeof NIGHT !== 'undefined' && !NIGHT.on) return;
  if (REC.got[id]) return;
  const R = RECORDS.find((r) => r[0] === id); if (!R) return;
  REC.got[id] = Date.now();
  try { localStorage.setItem(REC_KEY, JSON.stringify(REC.got)); } catch (e) { /* 기억 못 해도 된다 */ }
  let el = document.getElementById('recToast');
  if (!el) { el = document.createElement('div'); el.id = 'recToast'; el.className = 'rec-toast'; (document.getElementById('gal') || document.body).appendChild(el); }
  el.innerHTML = '<span>밤의 기록</span><b></b><i></i>';
  el.querySelector('b').textContent = R[1];
  el.querySelector('i').textContent = recCount() + ' / ' + RECORDS.length;
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
}
/** 표지 — 모아 본 기록 */
function recPanel() {
  let w = document.getElementById('recPanel');
  if (w) { w.remove(); return; }
  w = document.createElement('div'); w.id = 'recPanel'; w.className = 'rec-panel';
  const rows = RECORDS.map(([id, t, hint]) => REC.got[id]
    ? '<li class="got"><b>' + t + '</b><span>' + new Date(REC.got[id]).toLocaleDateString('ko-KR') + '</span></li>'
    : '<li><b>???</b><span>' + hint + '</span></li>').join('');
  w.innerHTML = '<div class="rp-box"><p class="rp-k">밤의 기록</p><h3>' + recCount() + ' / ' + RECORDS.length + '</h3><ul>' + rows + '</ul>'
    + '<p class="rp-foot">이 기기에만 남습니다.</p><button type="button" class="rp-x">닫기</button></div>';
  document.body.appendChild(w);
  w.addEventListener('click', (ev) => { if (ev.target === w || ev.target.classList.contains('rp-x')) w.remove(); });
}

/* ── 기념 사진 ─────────────────────────────────────────── */
const PHOTO = { busy: false, chip: null };
function photoChip() {
  if (PHOTO.chip || !M.ready || M.attract) return;
  const c = PHOTO.chip = document.createElement('button');
  c.id = 'photoChip'; c.className = 'bgm-chip photo-chip'; c.innerHTML = '<i class="ci">📷</i><span class="ct"> 사진</span>'; c.setAttribute('aria-label', '사진 찍기');
  c.addEventListener('click', (ev) => { ev.stopPropagation(); takePhoto(); });
  (document.getElementById('gal') || document.body).appendChild(c);
}
function shutterSound() {
  const c = typeof SND !== 'undefined' && SND.ctx; if (!c || !SND.on) return;
  const t0 = c.currentTime, n = Math.floor(c.sampleRate * 0.12), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (i < n * 0.25 ? 1 : 0.3) * (1 - i / n);
  const s = c.createBufferSource(); s.buffer = b;
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1500;
  const g = c.createGain(); g.gain.value = 0.18; s.connect(hp); hp.connect(g); g.connect(SND.bus); s.start(t0);
}
/** 사진에만 찍힐 자리 — 지금 화면 안, 5~9m 앞 · 조금 옆(벽 · 물건이 아닌 곳) */
function photoGhostSpot() {
  const r = M.room; if (!r || (r.outdoor && r.terrain && typeof lakeDist === 'function' && lakeDist(M.pos.x * CM, M.pos.z * CM) < 1.2)) return null;
  const f = hauntFwd(), PX = M.pos.x * CM, PZ = M.pos.z * CM;
  for (let k = 0; k < 16; k++) {
    // 한가운데보다 조금 옆 · 조금 멀리 — 찍고 나서 사진을 봐야 알아챌 만큼
    const a = (Math.random() < 0.5 ? -1 : 1) * (0.12 + Math.random() * 0.22), D = 480 + Math.random() * 420;
    const x = PX + (f.x * Math.cos(a) - f.z * Math.sin(a)) * D, z = PZ + (f.z * Math.cos(a) + f.x * Math.sin(a)) * D;
    const room = r.outdoor ? M.rooms.find((q) => q.outdoor && !q.part && q.lv === 0 && inRect(q, x, z)) : (inRect(r, x, z) ? r : null);
    if (!room) continue;
    const fy = floorAt(room, x, z);
    if (!(fy === fy) || hitsWall(x, z, fy)) continue;
    return { x, z, room };
  }
  return null;
}
function takePhoto() {
  if (PHOTO.busy || !M.ready || M.attract || M.openId || !M.renderer) return;
  PHOTO.busy = true;
  const night = typeof NIGHT !== 'undefined' && NIGHT.on;
  // 밤 — 가끔(밤이 깊을수록) 화면엔 없던 사람이 사진에만
  let ghost = false;
  if (night && typeof HAUNT !== 'undefined' && !HAUNT.calm && !(HAUNT.shade && HAUNT.shade.root.visible)
    && Math.random() < 0.18 + 0.4 * HAUNT.dread) {
    const sp = photoGhostSpot();
    if (sp && shadeAt(sp.x, sp.z, sp.room)) ghost = true;
  }
  M.post.render(M.t);                                                      // 그린 직후에 읽어야 한다(버퍼가 지워지기 전)
  const src = M.renderer.domElement;
  if (ghost) shadeHide();
  const W = 1280, H = Math.round(W * src.height / src.width), pad = 36, foot = 92;
  const cv = makeCanvas(W + pad * 2, H + pad + foot), c = cv.getContext('2d');
  c.fillStyle = night ? '#0E0D0C' : '#F2EEE6'; c.fillRect(0, 0, cv.width, cv.height);
  c.drawImage(src, pad, pad, W, H);
  const d = new Date(), p2 = (v) => String(v).padStart(2, '0');
  const stamp = d.getFullYear() + '.' + p2(d.getMonth() + 1) + '.' + p2(d.getDate());
  const clock = night && typeof SCORE !== 'undefined' && SCORE.clockEl ? SCORE.clockEl.textContent : p2(d.getHours()) + ':' + p2(d.getMinutes());
  c.fillStyle = night ? '#D8CFBF' : '#2A2622';
  c.font = '600 26px Oswald, sans-serif'; c.textBaseline = 'middle';
  c.fillText('HANSHIN MUSEUM', pad, H + pad + foot / 2 - 10);
  c.font = '18px sans-serif'; c.fillStyle = night ? '#9A8E7C' : '#6E625A';
  c.fillText((M.room ? M.room.name : '') + ' · ' + clock + ' · ' + stamp, pad, H + pad + foot / 2 + 20);
  c.textAlign = 'right'; c.fillStyle = night ? '#8E4A40' : '#9A8A6A';
  c.fillText(night ? '밤의 전시관' : '버디버디 기록 전시관', cv.width - pad, H + pad + foot / 2 + 20);
  // 플래시 · 셔터
  let fl = document.getElementById('photoFlash');
  if (!fl) { fl = document.createElement('div'); fl.id = 'photoFlash'; fl.className = 'photo-flash'; document.getElementById('gal').appendChild(fl); }
  fl.classList.remove('on'); void fl.offsetWidth; fl.classList.add('on');
  shutterSound();
  const url = cv.toDataURL('image/jpeg', 0.9);
  const a = document.createElement('a'); a.href = url; a.download = 'hanshin-museum-' + stamp.replace(/\./g, '') + '-' + p2(d.getHours()) + p2(d.getMinutes()) + '.jpg';
  document.body.appendChild(a); a.click(); a.remove();
  // 작은 미리보기(왼쪽 아래 위) — 3.5초
  let pv = document.getElementById('photoPrev');
  if (!pv) { pv = document.createElement('img'); pv.id = 'photoPrev'; pv.className = 'photo-prev'; document.getElementById('gal').appendChild(pv); }
  pv.src = url; pv.classList.remove('on'); void pv.offsetWidth; pv.classList.add('on');
  if (ghost) {
    setTimeout(() => { if (typeof hauntSay === 'function') hauntSay('… 잘 나왔네.'); hauntRec('photo'); }, 1800);
  } else if (typeof toast === 'function') toast('사진을 저장했다', 1600);
  setTimeout(() => { PHOTO.busy = false; }, 1200);
}
function stepMemento() { photoChip(); }
