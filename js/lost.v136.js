/* ══════════════════════════════════════════════════════════
   분실물 보관소(v129) — 관리자의 방 2막
   ══════════════════════════════════════════════════════════
   사용자: "첫 번째 날 시나리오를 다 진행하면 문이 딸깍 하면서 자동으로 열리고, 그 문으로 들어가 복도 쪽으로 가다 보면
            다른 방이 나타나서 거기서 2번째 시나리오. 끝나면 다시 첫 번째 방으로 와서 두 번째 밤이 세 번째 시나리오."
   1막 관리자의 방(생각 일곱 → 편지) → 편지를 닫으면 남쪽 벽 문이 딸깍 열린다
   2막 지하 복도 → 분실물 보관소: 꼬리표 달린 '잃어버린 것' 여섯을 찾아 카운터에 돌려준다
       (복도 셋 · 보관소 셋, 장부가 어디 있는지 알려 준다) → 다 돌려주면 '당신 앞으로 온 봉투'
   3막 관리자의 방으로 돌아가면 두 번째 밤(office.js)
   · 공간은 수장고처럼 지하(lv −1)에 따로 떨어져 있다 — 건물 겉모습은 그대로. 문을 지나면 잠깐 어두워졌다가 복도에 서 있다
   · 공포는 은은하게만: 젖은 발자국 · 등 뒤 발소리 한 번 · 관리인실 젖빛 유리 너머를 지나가는 그림자 한 번
   ✎ 글을 고칠 곳은 LOST_ITEMS · LOST_FINAL 두 군데다. */
const LOST_ITEMS = [
  { id: 'glove', q: ['경이야말로 철학자의 감정이다. 철학은 경이에서 시작된다.', '플라톤, 『테아이테토스』'], obj: '낡은 골프 장갑 한 짝', lost: '처음의 설렘', where: '복도 — 나무 벤치 위',
    memo: '손바닥이 닳아 구멍이 났다. 안쪽에 쪽지가 끼워져 있다.\n“처음 산 날, 끼고 잠들 뻔했다.”',
    reply: { line: '설렘은 잃어버리는 게 아니라, 익숙해지는 것이다.', memo: '주인은 장갑을 받아 들고 한참 웃었다. “이거 끼고 첫 버디를 했었는데.”\n익숙해진 것들 안에도 처음은 남아 있다. 꺼내 보지 않았을 뿐이다.' } },
  { id: 'tape', q: ['말할 수 없는 것에 대해서는 침묵해야 한다.', '비트겐슈타인, 『논리철학논고』 7'], obj: '카세트테이프', lost: '하지 못한 말', where: '복도 — 라디에이터 위',
    memo: '라벨에 “미안해 — 세 번째 녹음”.\n앞의 두 번은 지운 모양이다. 테이프가 조금 늘어나 있다.',
    reply: { line: '하지 못한 말은 사라지지 않는다. 기다릴 뿐이다.', memo: '말할 수 없는 것 앞에서는 침묵해야 한다. 하지만 말할 수 있는 것을 삼키는 건 침묵이 아니라 미룸이다.\n테이프를 돌려받은 주인은 그날 저녁, 녹음 대신 직접 말했다. 세 번이나 연습한 말은, 생각보다 짧았다.' } },
  { id: 'umbrella', q: ['우리는 정의로운 일을 함으로써 정의로워지고, 절제하는 일을 함으로써 절제하게 된다.', '아리스토텔레스, 『니코마코스 윤리학』 2권'], obj: '접힌 검은 우산', lost: '건네지 못한 호의', where: '복도 — 잠긴 문 앞',
    memo: '한 번도 펴지 않은 우산이다. 꼬리표 뒷면에 작은 글씨.\n“씌워 주려고 들고 나갔는데, 끝내 말을 못 걸었다.”',
    reply: { line: '늦은 호의도 호의다.', memo: '호의는 마음속에 품는 것이 아니라 건넬 때 생긴다. 건네지 않은 호의는 아직 호의가 아니다.\n주인은 우산을 받아 들고 그 사람에게 전화를 걸었다. 몇 년 만이었다. 비는 그친 지 오래였지만, 우산은 그제야 쓸모가 생겼다.' } },
  { id: 'watch', q: ['다른 모든 것은 우리 것이 아니다. 오직 시간만이 우리의 것이다.', '세네카, 『루킬리우스에게 보내는 편지』 1'], obj: '멈춘 손목시계', lost: '함께 보낸 시간', where: '보관소 — 유리 진열장',
    memo: '유리가 깨진 채 멈춰 있다. 뒷면에 새긴 글씨 — “같이 늙자”.',
    reply: { line: '시간은 잃어버려도, 함께 보낸 사실은 남는다.', memo: '주인은 시계를 고치지 않겠다고 했다. 멈춘 바늘이 가리키는 날이 있었다고.\n지나간 시간은 돌려받을 수 없다. 하지만 그 시간이 있었다는 건 아무도 가져가지 못한다.' } },
  { id: 'card', q: ['정상을 향한 투쟁 그 자체가 인간의 마음을 채우기에 충분하다. 행복한 시지프를 상상해야 한다.', '카뮈, 『시지프 신화』'], obj: '구겨진 스코어카드', lost: '끝까지 친 하루', where: '보관소 — 선반 위 상자',
    memo: '백 타가 넘는다. 반쯤 찢다 만 자국이 있다.\n맨 아래 서명 칸에는 이름 대신 “그래도 18홀”.',
    reply: { line: '버리고 싶은 하루도, 끝까지 친 하루다.', memo: '시지프는 돌이 다시 굴러떨어질 걸 알면서도 산을 내려간다. 카뮈는 그 내려가는 걸음에서 행복을 보았다.\n주인은 카드를 펴서 다시 접었다. 이번엔 반듯하게. 무너진 날을 끝까지 걸어 나온 사람은, 다음 날도 걸을 수 있다.' } },
  { id: 'key', q: ['인간의 모든 불행은 단 하나, 방 안에 조용히 머물러 있을 줄 모르는 데서 온다.', '파스칼, 『팡세』'], obj: '이름 없는 열쇠', lost: '돌아갈 곳', where: '보관소 — 북쪽 벽 열쇠걸이',
    memo: '어느 문의 열쇠인지 아무도 모른다. 꼬리표엔 “집?”이라고만 쓰여 있다.',
    reply: { line: '돌아갈 곳은 문이 아니라 사람이다.', memo: '주인은 열쇠를 받아 들고 말했다. “문은 바뀌었는데, 기다리는 사람은 그대로네요.”\n파스칼의 방은 갇히는 곳이 아니라 돌아오는 곳이다. 돌아갈 곳이 있는 사람만 조용히 머물 수 있다.' } },
];
const LOST_FINAL = { obj: '당신 앞으로 온 봉투', axis: '분실물 보관소 · 마지막 장',
  q: ['필연적인 것을 아름답게 보는 법을 더 배우고 싶다. 아모르 파티 — 이제부터 이것이 나의 사랑이 되기를.', '니체, 『즐거운 학문』 276'],
  line: '잃어버린 것들은 대개, 잃어버린 줄도 모르던 것들이다.',
  memo: '이 보관소의 물건은 모두 주인을 기다리고 있었다. 주인이 오지 않아도 버리지 않았다. 그게 이 방의 규칙이다.\n장부 마지막 줄에 당신의 자리가 비어 있다. 습득한 곳 — 관리자의 방. 습득한 사람 — 첫 번째 관리자.\n봉투 안에는 아무것도 없다. 뒷면에 한 줄.\n“돌아가라. 그 방에 불이 켜져 있다.”',
  ask: '당신이 잃어버린 줄도 모르고 있던 것은 무엇인가?' };

/* 상태 — 0 문 잠김(1막) · 1 문 열림(2막 진행) · 2 2막 끝 */
const LOST = { state: 0, held: [], ret: [], built: false, busy: false, items: {}, t: 0 };
try {
  const s = JSON.parse(localStorage.getItem('museum-lost') || 'null');
  if (s) { LOST.state = s.state || 0; LOST.held = s.held || []; LOST.ret = s.ret || []; }
} catch (e) { /* 처음부터 */ }
// v128 에서 편지를 이미 읽은 사람 — 두 번째 밤 대기(n2=1)였다면 이제 2막부터
if (typeof OFFICE !== 'undefined') {
  if (OFFICE.n2 === 1 && LOST.state === 0) { LOST.state = 1; OFFICE.n2 = 0; if (typeof officeSave === 'function') officeSave(); }
  else if (OFFICE.n2 >= 2 && LOST.state === 0) LOST.state = 1;
}
function lostSave() { try { localStorage.setItem('museum-lost', JSON.stringify({ state: LOST.state, held: LOST.held, ret: LOST.ret })); } catch (e) { /* */ } }
lostSave();

/** 조사 자리 — 보이지 않는 상자 · 이름표 */
function lostHit(g, x, y, z, w, h, d, id, label, room) {
  const hit = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(x, y, z); g.add(hit);
  const info = { id: 'lost-' + id.replace(/:/g, '-'), type: 'placard', icon: '🕯', label, title: label, room, x: x * CM, z: z * CM, y: y * CM, onUse: () => lostUse(id) };
  M.pickables.push(hit); M.artByMesh.set(hit, info);
  return hit;
}
function lostUnhit(hit) { if (!hit) return; const i = M.pickables.indexOf(hit); if (i >= 0) M.pickables.splice(i, 1); M.artByMesh.delete(hit); }
/** 꼬리표 — 흰 종이에 끈 · 어둠 속에서도 조금 보인다 */
function lostTag(g, x, y, z, ry = 0) {
  const t = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.075), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xEDE6D2).multiplyScalar(0.75), side: THREE.DoubleSide }));
  t.material.userData.noBatch = true; t.position.set(x, y, z); t.rotation.set(0.2, ry, 0.15); g.add(t); return t;
}
/** 젖빛 유리 글씨 — mirror: 뒤에서 본 글씨(관리자의 방 쪽에서) */
function lostGlassTex(text, sub, mirror) {
  return ofCanvasTex(256, 200, (c, w, h) => {
    c.fillStyle = 'rgba(205,210,208,1)'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { c.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.12) + ')'; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    c.save(); if (mirror) { c.translate(w, 0); c.scale(-1, 1); }
    c.fillStyle = '#1A1612'; c.textAlign = 'center'; c.font = 'bold 30px "Noto Serif KR", serif'; c.fillText(text, w / 2, h * 0.48);
    if (sub) { c.font = '15px "Courier New", serif'; c.fillText(sub, w / 2, h * 0.68); }
    c.restore();
  });
}
/** 문짝 — 위는 젖빛 유리, 아래는 나무. 경첩이 x=0 쪽에 오도록 그룹을 돌려 쓴다 */
function lostDoorLeaf(glassTex, wood) {
  const leaf = new THREE.Group();
  leaf.add(ofAt(rbox(1.0, 1.0, 0.05, 0.01, wood), 0.5, 0.5, 0));
  leaf.add(ofAt(rbox(1.0, 0.12, 0.05, 0.01, wood), 0.5, 2.06, 0));
  for (const x of [0.06, 0.94]) leaf.add(ofAt(rbox(0.12, 1.1, 0.05, 0.01, wood), x, 1.55, 0));
  const gm = new THREE.MeshStandardMaterial({ map: glassTex, roughness: 0.35, emissive: 0x2A2620, emissiveIntensity: 1 }); gm.userData.noBatch = true;
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.98), gm); gl.position.set(0.5, 1.55, 0.026); leaf.add(gl);
  const gl2 = gl.clone(); gl2.rotation.y = Math.PI; gl2.position.z = -0.026; leaf.add(gl2);
  const knob = cyl(0.03, 0.03, 0.06, objMat().brass, 12); knob.rotation.x = Math.PI / 2; knob.position.set(0.88, 1.0, 0); leaf.add(knob);
  return leaf;
}

/* ── 관리자의 방 남쪽 벽 문 — officeDress 끝에서 부른다 ── */
function lostKeeperDoor(r, g) {
  const x0 = r.x1 / CM - 2.4, zw = r.z1 / CM - 0.12;           // 경첩 x · 벽 안쪽 면
  const wood = ofMat(0x1E140C, 0.5);
  // 문 뒤 — 어둠(문이 열리면 보인다) · 아래로 새는 빛
  const back = ofCanvasTex(64, 128, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#020202'); gr.addColorStop(0.75, '#0A0806'); gr.addColorStop(1, '#3A2C1C'); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
  const bk = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.12), new THREE.MeshBasicMaterial({ map: back })); bk.material.userData.noBatch = true;
  bk.position.set(x0 + 0.5, 1.06, zw - 0.004); bk.rotation.y = Math.PI; g.add(bk);
  g.add(new THREE.Mesh(mergeGeos([boxAt(0.1, 2.3, 0.1, x0 - 0.05, 1.15, zw - 0.04), boxAt(0.1, 2.3, 0.1, x0 + 1.05, 1.15, zw - 0.04), boxAt(1.2, 0.12, 0.1, x0 + 0.5, 2.24, zw - 0.04)]), wood));
  const leaf = lostDoorLeaf(lostGlassTex('분실물 보관소', 'LOST & FOUND', true), wood);
  const pivot = new THREE.Group(); pivot.position.set(x0, 0, zw - 0.06); pivot.rotation.y = Math.PI; leaf.position.x = -1.0; pivot.add(leaf); g.add(pivot);
  // ↑ 방 쪽에서 보면 경첩이 오른쪽(x0+1) — 열리면 방 안쪽으로 젖혀진다
  pivot.position.x = x0 + 1.0; leaf.position.x = 0;
  LOST.keeperDoor = { pivot, open: LOST.state >= 1 ? 1 : 0, target: LOST.state >= 1 ? 1 : 0 };
  pivot.rotation.y = Math.PI - LOST.keeperDoor.open * 1.45;
  lostHit(g, x0 + 0.5, 1.1, zw - 0.3, 1.1, 2.1, 0.4, 'enter', '남쪽 벽의 문', 'workshop');
}
/** 편지를 닫으면 — 딸깍, 문이 저절로 열린다(office.js officeClose 가 부른다) */
function lostUnlock() {
  if (LOST.state >= 1) return;
  LOST.state = 1; lostSave();
  setTimeout(() => {
    if (typeof torchClick === 'function') torchClick();
    if (typeof sndCreak === 'function') setTimeout(() => sndCreak(0.09, 0.3), 500);
    if (LOST.keeperDoor) LOST.keeperDoor.target = 1;
    toast('딸깍 — 남쪽 벽의 문이 저절로 열렸다', 3800);
  }, 700);
}

/* ── 지하 복도 ── */
function lostDressWay(r, g) {
  const x0 = r.x0 / CM, x1 = r.x1 / CM, z0 = r.z0 / CM, z1 = r.z1 / CM, cx = (x0 + x1) / 2;
  const wood = ofMat(0x2A1C12, 0.5), dark = ofMat(0x16110C, 0.6), metal = ofMat(0x5A5A56, 0.45, 0.5), brass = objMat().brass;
  // 바닥 깔개
  const run = new THREE.Mesh(new THREE.PlaneGeometry(1.3, (z1 - z0) - 1.2), ofMat(0x3A1A16, 0.95)); run.rotation.x = -Math.PI / 2; run.position.set(cx, 0.006, (z0 + z1) / 2); g.add(run);
  // 전구 셋 — 가운데 것은 떤다
  LOST.wayBulbs = [];
  for (const [k, z] of [[0, z1 - 3], [1, (z0 + z1) / 2], [2, z0 + 3.5]]) {
    const cord = cyl(0.004, 0.004, 0.6, dark, 4); cord.position.set(cx, r.h / CM - 0.3, z); g.add(cord);
    const bm = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xFFE2B0).multiplyScalar(2.2), toneMapped: false }); bm.userData.noBatch = true;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), bm); b.position.set(cx, r.h / CM - 0.65, z); g.add(b); LOST.wayBulbs.push({ m: bm, k });
    const li = new THREE.PointLight(0xFFD49A, k === 1 ? 2.6 : 3.6, 5.5, 1.6); li.position.set(cx, r.h / CM - 0.75, z); g.add(li);
  }
  // 돌아가는 문(남쪽 끝) — '관리자의 방'
  {
    const zw = z1 - 0.12, leaf = lostDoorLeaf(lostGlassTex('관리자의 방', 'KEEPER', false), wood);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.12), new THREE.MeshBasicMaterial({ color: 0x040302 })); back.position.set(cx, 1.06, zw - 0.004); back.rotation.y = Math.PI; g.add(back);
    g.add(new THREE.Mesh(mergeGeos([boxAt(0.1, 2.3, 0.1, cx - 0.55, 1.15, zw - 0.04), boxAt(0.1, 2.3, 0.1, cx + 0.55, 1.15, zw - 0.04), boxAt(1.2, 0.12, 0.1, cx, 2.24, zw - 0.04)]), wood));
    const pivot = new THREE.Group(); pivot.position.set(cx + 0.5, 0, zw - 0.06); pivot.rotation.y = Math.PI; pivot.add(leaf); g.add(pivot);
    LOST.backDoor = { pivot, open: LOST.state >= 2 ? 0.25 : 0, target: LOST.state >= 2 ? 0.25 : 0 };
    lostHit(g, cx, 1.1, zw - 0.3, 1.1, 2.1, 0.4, 'back', '관리자의 방으로 돌아가는 문', r.id);
  }
  // 안내판 — 입구 쪽 서쪽 벽
  {
    const sign = ofCanvasTex(320, 120, (c, w, h) => { c.fillStyle = '#1C1812'; c.fillRect(0, 0, w, h); c.strokeStyle = '#8A7A5A'; c.lineWidth = 3; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = '#D8CCA8'; c.textAlign = 'center'; c.font = 'bold 30px "Noto Serif KR", serif'; c.fillText('분실물 보관소', w / 2, 52); c.font = '18px "Noto Sans KR", sans-serif'; c.fillText('↑  복도 끝, 왼쪽', w / 2, 90); });
    const sm = new THREE.MeshStandardMaterial({ map: sign, roughness: 0.6 }); sm.userData.noBatch = true;
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.3), sm); s.position.set(x0 + 0.135, 1.75, z1 - 2.2); s.rotation.y = Math.PI / 2; g.add(s);
  }
  // 잠긴 문 셋(동쪽 벽) — 관리인실 · 기록 보관 · 보일러실
  LOST.locked = [];
  for (const [z, name, sub, say] of [[z1 - 5.2, '관리인실', 'CARETAKER', '잠겨 있다. 안에서 라디오 소리가 아주 작게 난다.'], [(z0 + z1) / 2 - 1.2, '기록 보관', '관계자 외', '잠겨 있다. 문틈으로 종이 냄새가 난다.'], [z0 + 2.2, '보일러실', 'BOILER', '잠겨 있다. 안쪽 어딘가에서 물 떨어지는 소리.']]) {
    const xw = x1 - 0.12;
    const backTex = ofCanvasTex(64, 64, (c, w, h) => { c.fillStyle = name === '관리인실' ? '#5A4A30' : '#0A0806'; c.fillRect(0, 0, w, h); });
    const bk = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.98), new THREE.MeshBasicMaterial({ map: backTex })); bk.material.userData.noBatch = true; bk.position.set(xw - 0.03, 1.55, z); bk.rotation.y = -Math.PI / 2; g.add(bk);
    const leaf = lostDoorLeaf(lostGlassTex(name, sub, false), wood);
    leaf.rotation.y = -Math.PI / 2; leaf.position.set(xw - 0.06, 0, z - 0.5); g.add(leaf);
    // 유리를 반투명으로 — 뒤가 비치게
    leaf.children.filter((o) => o.material && o.material.map && o.material.map.userData && o.material.map.userData.cv).forEach((o) => { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.82; o.material.userData.noBatch = true; });
    g.add(new THREE.Mesh(mergeGeos([boxAt(0.1, 2.3, 0.1, xw - 0.04, 1.15, z - 0.55), boxAt(0.1, 2.3, 0.1, xw - 0.04, 1.15, z + 0.55), boxAt(0.1, 0.12, 1.2, xw - 0.04, 2.24, z)]), wood));
    lostHit(g, xw - 0.3, 1.1, z, 0.4, 2.1, 1.1, 'locked:' + LOST.locked.length, name + ' — 잠긴 문', r.id);
    LOST.locked.push({ z, name, say, x: xw });
  }
  // 관리인실 젖빛 유리 너머를 지나가는 그림자(한 번)
  {
    const L = LOST.locked[0];
    const sil = ofCanvasTex(128, 256, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(8,6,4,.85)'; c.filter = 'blur(6px)'; c.beginPath(); c.ellipse(64, 60, 24, 30, 0, 0, 6.28); c.fill(); c.beginPath(); c.ellipse(64, 190, 46, 100, 0, 0, 6.28); c.fill(); });
    const sm = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 1.1), new THREE.MeshBasicMaterial({ map: sil, transparent: true, depthWrite: false, opacity: 0 }));
    sm.material.userData.noBatch = true; sm.position.set(L.x - 0.04, 1.45, L.z - 0.6); sm.rotation.y = -Math.PI / 2; g.add(sm);
    LOST.shadow = { m: sm, z0: L.z - 0.5, z1: L.z + 0.5, t: -1, done: false, x: L.x, z: L.z };
  }
  // 나무 벤치(서쪽 벽) · 라디에이터(서쪽 벽)
  const bz = (z0 + z1) / 2 + 2.6, rz = (z0 + z1) / 2 - 1.8, wx = x0 + 0.12;
  g.add(ofAt(rbox(0.42, 0.06, 1.6, 0.01, wood), wx + 0.22, 0.45, bz));
  for (const s of [-1, 1]) g.add(ofAt(rbox(0.38, 0.42, 0.06, 0.01, wood), wx + 0.22, 0.21, bz + s * 0.7));
  g.add(ofAt(rbox(0.06, 0.4, 1.6, 0.01, wood), wx + 0.04, 0.75, bz));
  ofBlock(r, x0, x0 + 0.55, bz - 0.85, bz + 0.85, 60);
  { const ribs = []; for (let i = 0; i < 12; i++) ribs.push(boxAt(0.16, 0.62, 0.035, wx + 0.1, 0.38, rz - 0.42 + i * 0.077)); ribs.push(boxAt(0.12, 0.05, 0.95, wx + 0.1, 0.06, rz)); g.add(new THREE.Mesh(mergeGeos(ribs), metal)); }
  ofBlock(r, x0, x0 + 0.3, rz - 0.5, rz + 0.5, 70);
  // 젖은 발자국 — 입구에서 보관소 문 쪽으로
  {
    const fp = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false }); fp.userData.noBatch = true;
    const geo = new THREE.CircleGeometry(0.06, 10);
    for (let i = 0; i < 22; i++) {
      const z = z1 - 1.6 - i * 0.62; if (z < z0 + 2.6) break;
      const s = i % 2 ? 1 : -1, f = new THREE.Mesh(geo, fp); f.rotation.x = -Math.PI / 2; f.scale.set(0.75, 1.7, 1);
      f.position.set(cx + s * 0.12 - Math.max(0, (z1 - 1.6 - z) - 11) * 0.12, 0.009, z); g.add(f);
    }
  }
  // 꼬리표 달린 물건 셋
  lostItem(g, r, 'glove', wx + 0.24, 0.49, bz + 0.3);
  lostItem(g, r, 'tape', wx + 0.12, 0.72, rz - 0.1);
  lostItem(g, r, 'umbrella', x1 - 0.42, 0, LOST.locked[0].z + 0.75);
  // 보관소 문 위 간판
  const door = (M.doors || []).find((d) => d.rooms.includes('lostway') && d.rooms.includes('lostfound'));
  if (door) {
    const mz = (door.a + door.b) / 2 / CM;
    const sg = ofCanvasTex(300, 80, (c, w, h) => { c.fillStyle = '#14100C'; c.fillRect(0, 0, w, h); c.fillStyle = '#E8D8A8'; c.textAlign = 'center'; c.font = 'bold 28px "Courier New", serif'; c.fillText('LOST & FOUND', w / 2, 50); });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.3), new THREE.MeshBasicMaterial({ map: sg })); m.material.userData.noBatch = true;
    m.position.set(x0 + 0.135, 2.55, mz); m.rotation.y = Math.PI / 2; g.add(m);
  }
}

/* ── 분실물 보관소 ── */
function lostDressRoom(r, g) {
  const x0 = r.x0 / CM, x1 = r.x1 / CM, z0 = r.z0 / CM, z1 = r.z1 / CM;
  const wood = ofMat(0x2E1E12, 0.5), woodL = ofMat(0x4A3424, 0.55), dark = ofMat(0x16110C, 0.6), metal = ofMat(0x55534E, 0.5, 0.4), brass = objMat().brass;
  // 카운터(입구 3m 앞) — 종 · 장부 · 스탠드 · '자리 비움'
  const kx = x1 - 3.4, kz0 = z0 + 4.5, kz1 = z0 + 8.0, kz = (kz0 + kz1) / 2;
  g.add(ofAt(rbox(0.7, 1.05, kz1 - kz0, 0.01, wood), kx, 0.525, kz));
  g.add(ofAt(rbox(0.85, 0.05, kz1 - kz0 + 0.15, 0.01, woodL), kx, 1.075, kz));
  ofBlock(r, kx - 0.45, kx + 0.45, kz0 - 0.1, kz1 + 0.1, 110);
  const bell = new THREE.Group(); bell.add(ofAt(cyl(0.05, 0.06, 0.012, brass, 16), 0, 0.006, 0)); bell.add(ofAt(new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), brass), 0, 0.012, 0)); bell.add(ofAt(cyl(0.006, 0.006, 0.02, brass, 6), 0, 0.065, 0));
  bell.position.set(kx + 0.15, 1.1, kz1 - 0.35); g.add(bell);
  const ledger = ofCanvasTex(256, 180, (c, w, h) => { c.fillStyle = '#E8E0CA'; c.fillRect(0, 0, w, h); c.fillStyle = '#6A5A40'; c.fillRect(w / 2 - 1, 0, 2, h); c.strokeStyle = 'rgba(80,100,140,.35)'; for (let y = 24; y < h; y += 16) { c.beginPath(); c.moveTo(6, y); c.lineTo(w - 6, y); c.stroke(); } c.fillStyle = '#2A2018'; for (let i = 0; i < 9; i++) { c.fillRect(12, 20 + i * 16, 40 + (i * 29) % 60, 2); c.fillRect(w / 2 + 12, 20 + i * 16, 30 + (i * 41) % 70, 2); } });
  const lm = new THREE.MeshStandardMaterial({ map: ledger, roughness: 0.9 }); lm.userData.noBatch = true;
  const lg = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.3), lm); lg.rotation.x = -Math.PI / 2; lg.rotation.z = Math.PI / 2; lg.position.set(kx + 0.05, 1.103, kz - 0.2); g.add(lg);
  const away = ofCanvasTex(200, 90, (c, w, h) => { c.fillStyle = '#E6DCC2'; c.fillRect(0, 0, w, h); c.fillStyle = '#2A2018'; c.textAlign = 'center'; c.font = 'bold 30px "Noto Serif KR", serif'; c.fillText('자리 비움', w / 2, 56); });
  const am = new THREE.MeshStandardMaterial({ map: away, roughness: 0.8 }); am.userData.noBatch = true;
  const aw = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.11), am); aw.position.set(kx + 0.2, 1.16, kz + 0.75); aw.rotation.y = Math.PI / 2; aw.rotation.x = 0; g.add(aw);
  // 카운터 스탠드
  const lamp = new THREE.Group(); lamp.add(ofAt(cyl(0.07, 0.08, 0.02, brass, 14), 0, 0.01, 0)); lamp.add(ofAt(cyl(0.01, 0.01, 0.3, brass, 6), 0, 0.16, 0));
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.1, 16, 1, true), ofMat(0x1E3A2A, 0.4)); shade.material.side = THREE.DoubleSide; shade.position.y = 0.33; lamp.add(shade);
  lamp.position.set(kx - 0.2, 1.1, kz0 + 0.4); g.add(lamp);
  // 카운터 위 전등 · 천장 선풍기
  const pend = new THREE.PointLight(0xFFD49A, 7, 6, 1.6); pend.position.set(kx + 0.6, 2.7, kz); g.add(pend);
  const pb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xFFE2B0).multiplyScalar(2.4), toneMapped: false })); pb.position.set(kx + 0.6, 2.85, kz); g.add(pb);
  g.add(ofAt(cyl(0.004, 0.004, r.h / CM - 2.9, dark, 4), kx + 0.6, (r.h / CM + 2.9) / 2, kz));
  const fan = new THREE.Group(); fan.add(ofAt(cyl(0.08, 0.08, 0.1, metal, 12), 0, 0, 0));
  for (let i = 0; i < 4; i++) { const bl = rbox(0.6, 0.012, 0.12, 0.004, wood); bl.position.set(Math.cos(i * Math.PI / 2) * 0.36, -0.03, Math.sin(i * Math.PI / 2) * 0.36); bl.rotation.y = -i * Math.PI / 2; fan.add(bl); }
  fan.position.set(x0 + 5.5, r.h / CM - 0.35, (z0 + z1) / 2); g.add(fan); LOST.fan = fan;
  // 선반 셋(남북으로) — 꼬리표 달린 상자 · 가방 · 모자 · 우산 · 골프백
  const shelfM = ofMat(0x3A3630, 0.5, 0.35), boxM = [ofMat(0x8A7250, 0.85), ofMat(0x6A5638, 0.85), ofMat(0x9A8A6A, 0.85)];
  const rows = [x0 + 1.4, x0 + 3.9, x0 + 6.4], sz0 = z0 + 1.6, sz1 = z1 - 2.2, L = sz1 - sz0;
  let seed = 3; const R = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const boxes = boxM.map(() => []), tags = [];
  rows.forEach((sx) => {
    const parts = [];
    for (const s of [-1, 1]) for (const zz of [sz0, (sz0 + sz1) / 2, sz1]) parts.push(boxAt(0.04, 2.4, 0.04, sx + s * 0.28, 1.2, zz));
    for (let k = 0; k < 5; k++) parts.push(boxAt(0.6, 0.03, L, sx, 0.1 + k * 0.55, (sz0 + sz1) / 2));
    g.add(new THREE.Mesh(mergeGeos(parts), shelfM));
    ofBlock(r, sx - 0.35, sx + 0.35, sz0 - 0.05, sz1 + 0.05, 240);
    for (let k = 0; k < 4; k++) {
      let z = sz0 + 0.1; const y = 0.115 + k * 0.55;
      while (z < sz1 - 0.3) {
        if (R() < 0.2) { z += 0.25 + R() * 0.3; continue; }
        const w = 0.25 + R() * 0.35, h = 0.18 + R() * 0.25, d = 0.3 + R() * 0.2;
        boxes[Math.floor(R() * boxM.length)].push(boxAt(d, h, w, sx, y + h / 2, z + w / 2));
        if (R() < 0.45) tags.push([sx - d / 2 - 0.005, y + h * 0.6, z + w / 2]);
        z += w + 0.03;
      }
    }
  });
  boxM.forEach((m, k) => { if (boxes[k].length) g.add(new THREE.Mesh(mergeGeos(boxes[k]), m)); });
  { const tm = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xEDE6D2).multiplyScalar(0.55) }); tm.userData.noBatch = true; const tg = []; for (const [x, y, z] of tags) tg.push(boxAt(0.004, 0.07, 0.045, x, y, z)); if (tg.length) g.add(new THREE.Mesh(mergeGeos(tg), tm)); }
  // 선반 조명 둘
  for (const z of [sz0 + L * 0.3, sz0 + L * 0.75]) { const li = new THREE.PointLight(0xFFCF90, 4, 5.5, 1.6); li.position.set(rows[1], 2.9, z); g.add(li); const b = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xFFE2B0).multiplyScalar(2.2), toneMapped: false })); b.position.set(rows[1], 3.0, z); g.add(b); }
  // 가방 · 모자 · 골프백 — 선반 사이 바닥
  g.add(ofAt(rbox(0.6, 0.42, 0.22, 0.03, ofMat(0x3A2418, 0.6)), x0 + 2.65, 0.21, sz1 - 0.6));
  g.add(ofAt(rbox(0.5, 0.36, 0.2, 0.03, ofMat(0x1E2A3A, 0.6)), x0 + 5.15, 0.18, sz0 + 1.2));
  { const bag = new THREE.Group(); bag.add(ofAt(cyl(0.13, 0.12, 0.95, ofMat(0x1A1A1C, 0.5), 14), 0, 0.48, 0)); for (let i = 0; i < 4; i++) bag.add(ofAt(cyl(0.012, 0.012, 0.35, metal, 6), (i - 1.5) * 0.05, 1.1, 0)); bag.rotation.z = 0.18; bag.position.set(x1 - 0.5, 0, z1 - 0.6); g.add(bag); }
  // 열쇠걸이(북쪽 벽) — 열쇠 서른 개 남짓
  const kbx = x1 - 4.2, kbz = z0 + 0.15;
  g.add(ofAt(rbox(1.3, 0.85, 0.03, 0.01, wood), kbx, 1.6, kbz));
  { const hooks = [], keys = []; for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { const x = kbx - 0.55 + i * 0.22, y = 1.88 - j * 0.2; hooks.push(boxAt(0.012, 0.012, 0.05, x, y, kbz + 0.04)); if ((i * 7 + j * 3) % 5 !== 0) keys.push(boxAt(0.02, 0.07, 0.006, x, y - 0.05, kbz + 0.06)); }
    g.add(new THREE.Mesh(mergeGeos(hooks), brass)); g.add(new THREE.Mesh(mergeGeos(keys), ofMat(0xA89060, 0.35, 0.7))); }
  // 유리 진열장(남쪽 벽)
  const cx2 = x1 - 3.2, cz2 = z1 - 0.45;
  g.add(ofAt(rbox(1.2, 0.85, 0.5, 0.01, wood), cx2, 0.425, cz2));
  const glass = new THREE.MeshStandardMaterial({ color: 0xD8E4E8, roughness: 0.05, transparent: true, opacity: 0.18 }); glass.userData.noBatch = true;
  g.add(ofAt(new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.28, 0.46), glass), cx2, 0.99, cz2));
  ofBlock(r, cx2 - 0.65, cx2 + 0.65, cz2 - 0.3, cz2 + 0.3, 110);
  const cl = new THREE.PointLight(0xFFE0B0, 3, 3, 1.6); cl.position.set(cx2, 1.7, cz2 - 0.4); g.add(cl);
  // 의자 · 라디오 · 벽보
  g.add(ofAt(rbox(0.45, 0.05, 0.45, 0.01, wood), kx - 0.9, 0.46, kz)); g.add(ofAt(rbox(0.05, 0.5, 0.45, 0.01, wood), kx - 1.12, 0.72, kz));
  g.add(ofAt(rbox(0.3, 0.18, 0.14, 0.02, woodL), kx - 0.15, 1.19, kz0 + 0.9));
  const notice = ofCanvasTex(300, 400, (c, w, h) => { c.fillStyle = '#E6DEC8'; c.fillRect(0, 0, w, h); c.fillStyle = '#1A140E'; c.textAlign = 'center'; c.font = 'bold 30px "Noto Serif KR", serif'; c.fillText('알림', w / 2, 60); c.font = '19px "Noto Serif KR", serif';
    ['찾아가지 않은 물건은', '버리지 않습니다.', '', '보관 기한 — 없음', '', '주인이 오지 않으면', '올 때까지 기다립니다.'].forEach((t, i) => c.fillText(t, w / 2, 120 + i * 36)); });
  const nm = new THREE.MeshStandardMaterial({ map: notice, roughness: 0.85 }); nm.userData.noBatch = true;
  const nt = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.66), nm); nt.position.set(x1 - 0.135, 1.6, z0 + 2.0); nt.rotation.y = -Math.PI / 2; g.add(nt);
  lostHit(g, x1 - 0.3, 1.6, z0 + 2.0, 0.3, 0.7, 0.6, 'notice', '벽보 — 알림', r.id);
  // 조사 자리 — 카운터(돌려주기) · 장부 · 종
  lostHit(g, kx, 1.1, kz + 1.05, 0.95, 0.35, 1.3, 'counter', '카운터 — 돌려주기', r.id);   // 종 쪽 — 장부(가운데)와 겹치지 않게
  lostHit(g, kx + 0.05, 1.15, kz - 0.2, 0.5, 0.15, 0.5, 'ledger', '분실물 장부', r.id);
  // 꼬리표 달린 물건 셋
  lostItem(g, r, 'watch', cx2, 0.88, cz2);
  lostItem(g, r, 'card', rows[1] - 0.05, 0.115 + 0.55 * 2 + 0.02, sz0 + L * 0.45);
  lostItem(g, r, 'key', kbx + 0.33, 1.62, kbz + 0.06);
  // 당신 앞으로 온 봉투 — 여섯을 다 돌려주면 카운터 위에
  const env = new THREE.Group(); env.add(ofAt(rbox(0.22, 0.006, 0.15, 0.002, ofMat(0xE6DCC2, 0.9)), 0, 0.003, 0));
  const seal = cyl(0.016, 0.016, 0.004, ofMat(0x8A1A14, 0.4), 14); seal.position.y = 0.008; env.add(seal);
  env.position.set(kx + 0.1, 1.105, kz + 0.45); env.rotation.y = 0.4; env.visible = false; g.add(env);
  LOST.final = { env, hit: null, g, at: [kx + 0.1, 1.15, kz + 0.45], room: r.id };
  lostFinalCheck(false);
}
/** 물건 하나 — 모양 · 꼬리표 · 조사 자리(들고 있거나 돌려줬으면 없음) */
function lostItem(g, r, id, x, y, z) {
  const it = LOST_ITEMS.find((q) => q.id === id); if (!it) return;
  const grp = new THREE.Group(), leather = ofMat(0xD8CEB8, 0.8), black = ofMat(0x111114, 0.4);
  if (id === 'glove') { grp.add(ofAt(rbox(0.1, 0.025, 0.13, 0.01, leather), 0, 0.012, 0)); for (let i = 0; i < 4; i++) { const f = cyl(0.009, 0.009, 0.07, leather, 6); f.rotation.x = Math.PI / 2; f.position.set(-0.036 + i * 0.024, 0.012, -0.095); grp.add(f); } grp.rotation.y = 0.5; }
  if (id === 'tape') { grp.add(ofAt(rbox(0.1, 0.016, 0.064, 0.003, black), 0, 0.008, 0)); const lb = rbox(0.07, 0.002, 0.03, 0.001, ofMat(0xE8E0CA, 0.9)); lb.position.set(0, 0.017, -0.005); grp.add(lb); grp.rotation.y = -0.3; }
  if (id === 'umbrella') { grp.add(ofAt(new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.7, 10), ofMat(0x0E0E10, 0.3)), 0, 0.35, 0)); grp.add(ofAt(cyl(0.005, 0.005, 0.25, black, 6), 0, 0.82, 0)); const hd = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 14, Math.PI), ofMat(0x3A2416, 0.5)); hd.position.set(0.035, 0.95, 0); grp.add(hd); grp.rotation.z = -0.22; }
  if (id === 'watch') { const band = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 20), ofMat(0x3A2416, 0.6)); band.rotation.x = Math.PI / 2; grp.add(band); const face = cyl(0.022, 0.022, 0.01, objMat().brass, 16); face.position.set(0, 0.008, -0.035); grp.add(face); }
  if (id === 'card') { const cm = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.1), ofMat(0xE6DEC8, 0.95)); cm.material.side = THREE.DoubleSide; cm.rotation.x = -Math.PI / 2 + 0.25; cm.rotation.z = 0.3; cm.position.y = 0.03; grp.add(cm);
    const bx = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.28), ofMat(0x8A7250, 0.85)); bx.position.y = -0.06 + 0.06; bx.scale.y = 0.5; grp.add(bx); }
  if (id === 'key') { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.004, 6, 12), objMat().brass); grp.add(ring); grp.add(ofAt(rbox(0.008, 0.06, 0.004, 0.001, objMat().brass), 0, -0.045, 0)); }
  grp.position.set(x, y, z); g.add(grp);
  const tag = lostTag(g, x + 0.04, y + (id === 'umbrella' ? 0.85 : id === 'key' ? -0.03 : 0.05), z + 0.03);
  const hit = lostHit(g, x, y + (id === 'umbrella' ? 0.5 : 0.06), z, id === 'umbrella' ? 0.35 : 0.3, id === 'umbrella' ? 1.0 : 0.25, 0.35, 'pick:' + id, it.obj + ' — 꼬리표', r.id);
  LOST.items[id] = { grp, tag, hit };
  if (LOST.held.includes(id) || LOST.ret.includes(id)) { grp.visible = false; tag.visible = false; lostUnhit(hit); }
}
/** 다 돌려줬으면 봉투가 놓인다 */
function lostFinalCheck(tell) {
  const F = LOST.final; if (!F) return;
  const show = LOST.ret.length >= LOST_ITEMS.length && LOST.state < 2;
  F.env.visible = show || LOST.state >= 2;
  if (show && !F.hit) { F.hit = lostHit(F.g, F.at[0], F.at[1], F.at[2], 0.35, 0.15, 0.3, 'final', '당신 앞으로 온 봉투', F.room); if (tell) setTimeout(() => { toast('카운터 위에 봉투 하나 — 당신 앞으로 온 것이다', 3600); lostBell(0.5); }, 1600); }
  if (LOST.state >= 2 && F.hit) { lostUnhit(F.hit); F.hit = null; }
}

/* ── 조사 ── */
function lostUse(id) {
  if (id === 'enter') {
    if (LOST.state < 1) { toast('잠겨 있다. 손잡이가 차갑다 — 문 너머에서 아주 희미하게 바람이 분다.', 2800); if (typeof sndCreak === 'function') sndCreak(0.04, 0.2); return; }
    lostGo(true); return;
  }
  if (id === 'back') { lostGo(false); return; }
  if (id.indexOf('locked:') === 0) { const L = LOST.locked[+id.slice(7)]; if (L) { toast(L.say, 2600); if (typeof sndCreak === 'function') sndCreak(0.03, 0.4); } return; }
  officeRead('lost:' + id);
}
/** office.js officeEntry 가 'lost:' 로 시작하는 id 를 여기로 넘긴다 — 카드에 쓸 글 */
function lostEntry(id) {
  const k = id.slice(5);
  if (k.indexOf('pick:') === 0) {
    const it = LOST_ITEMS.find((q) => q.id === k.slice(5)); if (!it) return null;
    if (!LOST.held.includes(it.id) && !LOST.ret.includes(it.id)) {
      LOST.held.push(it.id); lostSave();
      const I = LOST.items[it.id]; if (I) { I.grp.visible = false; I.tag.visible = false; lostUnhit(I.hit); }
      lostPaint();
    }
    return { T: { obj: it.obj, axis: 'LOST & FOUND · 꼬리표', line: '잃어버린 것 — ' + it.lost + '.', memo: it.memo + '\n\n(주웠다. 보관소 카운터에 돌려주자.)', ask: '' }, key: null };
  }
  if (k === 'counter') {
    if (LOST.held.length) {
      const id2 = LOST.held.shift(), it = LOST_ITEMS.find((q) => q.id === id2);
      LOST.ret.push(id2); lostSave(); lostPaint(); lostBell(1);
      lostFinalCheck(true);
      return { T: { obj: it.obj + ' — 돌려줌', axis: '분실물 보관소 · 돌려준 것 ' + LOST.ret.length + ' / ' + LOST_ITEMS.length, q: it.q, line: it.reply.line, memo: it.reply.memo, ask: '' }, key: null };
    }
    lostBell(0.6);
    if (LOST.ret.length >= LOST_ITEMS.length) { toast(LOST.state >= 2 ? '종소리만 울린다. 이제 돌아갈 시간이다.' : '카운터 위에 봉투가 놓여 있다', 2400); return null; }
    return lostLedger('종을 울렸다. 아무도 나오지 않는다. 장부만 펼쳐져 있다.');
  }
  if (k === 'ledger') return lostLedger('');
  if (k === 'notice') return { T: { obj: '벽보', axis: 'LOST & FOUND', q: ['우리는 다른 사람들처럼 되려고 우리 자신의 4분의 3을 잃어버린다.', '쇼펜하우어, 『소품과 부록』'], line: '찾아가지 않은 물건은 버리지 않습니다.', memo: '보관 기한 — 없음. 주인이 오지 않으면, 올 때까지 기다립니다.\n\n여기 맡겨진 것 중에는, 남을 닮으려다 두고 온 자기 자신도 있을 것이다.\n기다린다는 건 버리지 않겠다는 뜻이다. 사람에게도, 물건에게도.', ask: '당신이 아직 버리지 못하고 기다리는 것은 무엇인가?' }, key: null };
  if (k === 'final') return { T: LOST_FINAL, key: null };
  return null;
}
function lostLedger(head) {
  const lines = LOST_ITEMS.map((it) => (LOST.ret.includes(it.id) ? '✓ ' : LOST.held.includes(it.id) ? '▸ ' : '□ ') + it.obj + ' — ' + it.lost + '\n     습득: ' + it.where);
  return { T: { obj: '분실물 장부', axis: 'LOST & FOUND · 돌려준 것 ' + LOST.ret.length + ' / ' + LOST_ITEMS.length, line: '찾아가지 않은 것들', memo: (head ? head + '\n\n' : '') + lines.join('\n') + '\n\n담당자 자리 비움 — 물건을 찾으면 카운터에 놓아 주십시오.', ask: '' }, key: null };
}
/** 카드를 닫을 때(office.js) — 마지막 봉투를 읽었으면 2막 끝 */
function lostOnClose(lastId) {
  if (lastId !== 'lost:final' || LOST.state >= 2) return;
  LOST.state = 2; lostSave();
  if (typeof OFFICE !== 'undefined' && OFFICE.n2 < 2) { OFFICE.n2 = 1; if (typeof officeSave === 'function') officeSave(); }
  if (LOST.backDoor) LOST.backDoor.target = 0.25;
  lostFinalCheck(false); lostPaint();
  setTimeout(() => { if (typeof sndCreak === 'function') sndCreak(0.06, -0.4); toast('복도 끝에서 — 관리자의 방 쪽 문이 열리는 소리가 났다', 3800); }, 900);
}
/** 종 */
function lostBell(vol) {
  const c = typeof SND !== 'undefined' && SND.ctx; if (!c || !SND.on) return;
  const t0 = c.currentTime + 0.01;
  for (const [f, v] of [[1760, 0.07], [2640, 0.03], [3520, 0.015]]) { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f; sndEnv(g, t0, 0.005, v * vol, 1.6); o.connect(g); sndPanned(g, 0, 0.6); o.start(t0); o.stop(t0 + 1.8); }
}

/* ── 오가기 — 어둠 · 삐걱 · 발소리(수장고와 같은 방식) ── */
function lostGo(toWay) {
  if (LOST.busy) return;
  LOST.busy = true; M.openId = 'lost-move';
  let el = document.getElementById('lostFade');
  if (!el) { el = document.createElement('div'); el.id = 'lostFade'; el.className = 'vault-fade'; document.getElementById('gal').appendChild(el); }
  requestAnimationFrame(() => el.classList.add('on'));
  if (typeof sndCreak === 'function') sndCreak(0.07, 0);
  const way = M.roomById.lostway;
  for (let i = 0; i < 6; i++) setTimeout(() => { if (typeof sndStep === 'function') sndStep(way, 0.7 - i * 0.05); }, 600 + i * 330);
  setTimeout(() => {
    if (toWay) {
      const r = way; teleport(r);
      M.feet = r.y0; M.eyeFeet = M.feet; M.pos.set(r.cx / CM, (M.feet + EYE) / CM, r.z1 / CM - 1.4); M.yaw = 0;
      if (!LOST.told) { LOST.told = true; setTimeout(() => toast('지하 복도 — 끝에 불 켜진 방이 하나 있다', 3400), 900); }
    } else {
      const r = M.roomById.workshop; teleport(r);
      M.feet = r.y0; M.eyeFeet = M.feet; M.pos.set(r.x1 / CM - 1.9, (M.feet + EYE) / CM, r.z1 / CM - 1.6); M.yaw = 0;
    }
    M.cam.position.copy(M.pos); M.cam.rotation.set(0, M.yaw, 0, 'YXZ');
    M.openId = null; LOST.busy = false;
    el.classList.remove('on');
  }, 2800);
}

/* ── 진행 표시 ── */
function lostPaint() {
  let h = LOST.hud;
  if (!h) { h = LOST.hud = document.createElement('div'); h.className = 'office-hud'; (document.getElementById('gal') || document.body).appendChild(h); }
  h.textContent = LOST.state >= 2 ? '돌아가자 — 관리자의 방에 불이 켜져 있다'
    : '분실물   ·   돌려준 것 ' + LOST.ret.length + ' / ' + LOST_ITEMS.length + (LOST.held.length ? '   ·   들고 있는 것 ' + LOST.held.length : '');
}

/** 매 프레임 — 문 · 선풍기 · 전구 · 그림자 · 등 뒤 발소리 · 낮은 웅웅거림 */
function stepLost(dt) {
  for (const D of [LOST.keeperDoor, LOST.backDoor]) if (D) { D.open += (D.target - D.open) * Math.min(1, dt * 1.6); D.pivot.rotation.y = Math.PI - D.open * 1.45; }
  const here = M.room, inL = !!(here && here.lost);
  if (LOST.hud) LOST.hud.classList.toggle('on', inL && !(typeof OFFICE !== 'undefined' && OFFICE.open));
  const c = typeof SND !== 'undefined' && SND.ctx;
  if (c && SND.on && !LOST.hum) {
    const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(); o.frequency.value = 58; o2.frequency.value = 117; g.gain.value = 0;
    o.connect(g); o2.connect(g); sndPanned(g, 0, 0.2); o.start(); o2.start(); LOST.hum = g;
  }
  if (LOST.hum && c) LOST.hum.gain.setTargetAtTime(inL ? 0.018 : 0, c.currentTime, 0.5);
  if (!inL) return;
  LOST.t += dt;
  if (!LOST.hud) lostPaint();
  if (LOST.fan) LOST.fan.rotation.y += dt * 1.1;
  for (const B of LOST.wayBulbs || []) if (B.k === 1) { const f = typeof nightFlick === 'function' ? nightFlick({ flicker: true, seed: 7.3 }, LOST.t) : 1; B.m.color.setRGB(2.2, 1.76, 1.2).multiplyScalar(f < 0.4 ? 0.15 : 1); }
  // 물방울 — 가끔
  LOST.drip = (LOST.drip || 4) - dt;
  if (LOST.drip <= 0 && c && SND.on) {
    LOST.drip = 3 + Math.random() * 6;
    const t0 = c.currentTime + 0.01, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(1400 + Math.random() * 500, t0); o.frequency.exponentialRampToValueAtTime(600, t0 + 0.08);
    sndEnv(g, t0, 0.003, 0.03, 0.12); o.connect(g); sndPanned(g, Math.random() * 2 - 1, 0.8); o.start(t0); o.stop(t0 + 0.2);
  }
  if (here.id !== 'lostway') return;
  // 등 뒤 발소리 — 복도에 처음 들어와 몇 걸음 걸으면 한 번
  if (!LOST.stepsDone && M.pos.z < here.z1 / CM - 5) {
    LOST.stepsDone = true;
    for (let i = 0; i < 4; i++) setTimeout(() => { if (typeof sndStep === 'function') sndStep(here, 0.45 - i * 0.07, M.pos.x * CM, (M.pos.z + 4) * CM); }, i * 520);
  }
  // 관리인실 젖빛 유리 너머 — 그림자가 한 번 지나간다
  const S = LOST.shadow;
  if (S && !S.done) {
    const d = Math.hypot(M.pos.x - S.x, M.pos.z - S.z);
    if (S.t < 0 && d > 2.5 && d < 8 && typeof hauntView === 'function' && hauntView(S.x, here.y0 / CM + 1.45, S.z).on) S.t = 0;
    if (S.t >= 0) {
      S.t += dt; const u = Math.min(1, S.t / 2.4);
      S.m.position.z = S.z0 - 0.1 + u * (S.z1 - S.z0 + 0.2); S.m.material.opacity = Math.sin(u * Math.PI) * 0.9;
      if (u >= 1) { S.done = true; S.m.material.opacity = 0; }
    }
  }
}
