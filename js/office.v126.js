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
    line: '기록은 편을 들지 않는다.',
    memo: '이 전시관은 큐레이터가 고르지 않는다. 라운드가 등록되면 전시물이 한 점 늘어날 뿐이다.\n잘 친 날도, 백 개를 넘긴 날도 같은 크기의 액자에 걸린다.\n나는 그게 공정하다고 믿었다. 좋은 날만 남기면 그건 기록이 아니라 광고다.',
    ask: '당신이 지우고 싶은 날도, 당신의 일부인가?' },
  names: { obj: '서류 캐비닛', axis: '기록과 기억',
    line: '사람은 두 번 잊힌다. 떠날 때, 그리고 아무도 이름을 부르지 않을 때.',
    memo: '명예의 전당을 만든 건 대단한 사람을 기리려던 게 아니었다.\n언젠가 우리가 흩어져도, 누군가 이 방들을 걷다가 이름 하나를 소리 내어 읽어 주길 바랐다.\n기억은 저장하는 게 아니라, 다시 부르는 것이다.',
    ask: '당신이 마지막으로 소리 내어 불러 본 오래된 이름은 누구인가?' },
  people: { obj: '코르크 보드', axis: '사람과 관계',
    line: '모든 일은 사람 사이에서 일어난다.',
    memo: '사진을 붙이고 붉은 실로 이어 보면 알게 된다. 스코어보다 오래 남는 건 그날 누가 같이 있었는지다.\n같은 카트를 탔고, 같은 벙커에서 웃었다.\n점수는 잊혀도 그 오후는 잊히지 않는다.',
    ask: '당신의 벽에는 누구와 누구 사이에 실이 이어져 있는가?' },
  seat: { obj: '마주 놓인 의자 둘', axis: '사람과 관계',
    line: '빈자리도 자리다.',
    memo: '쉬고 있는 사람의 이름 옆에 💤를 붙였다. 지우지 않았다.\n떠난 것과 잠시 멈춘 것은 다르다.\n관리자의 일은 문을 잠그는 게 아니라, 돌아올 사람을 위해 불을 하나 켜 두는 것이다.',
    ask: '당신은 누구를 위해 자리를 비워 두고 있는가?' },
  clock: { obj: '멈춘 시계', axis: '시간과 유한함',
    line: '시간은 기록되는 순간 멈춘다. 그래서 기록한다.',
    memo: '티오프는 늘 이른 아침이었다. 그 시각의 공기는 매번 달랐지만 시계는 같은 숫자를 가리켰다.\n지나간 것을 붙잡을 수는 없다. 다만 멈춰 세워 둘 수는 있다.\n사진 한 장, 스코어카드 한 장으로.',
    ask: '당신이 멈춰 세워 두고 싶은 한 시각은 언제인가?' },
  end: { obj: '모래시계', axis: '시간과 유한함',
    line: '끝이 있어서, 한 홀 한 홀이 의미가 있다.',
    memo: '18홀은 끝난다. 끝나니까 마지막 퍼트에 손이 떨린다.\n이 모임도, 이 전시관도 언젠가 끝난다.\n그걸 알기에 오늘의 라운드를 성실하게 남긴다.',
    ask: '끝이 정해져 있다면, 당신은 오늘 무엇을 다르게 하겠는가?' },
  mirror: { obj: '금 간 거울', axis: '시간과 유한함',
    line: '무너진 날은 기록에서 빼지 않는다.',
    memo: '헛스윙 영상을 상영관에 걸었다. 벙커에서 네 번 친 날도 걸었다. 웃음거리로 남기려는 게 아니다.\n금 간 거울에도 얼굴은 비친다.\n우리가 어떤 사람이었는지는 잘한 날보다 무너진 날이 더 정확하게 말해 준다.',
    ask: '당신의 가장 정확한 초상은 어느 날의 얼굴인가?' },
  letter: { obj: '서랍 속 편지', axis: '다음 관리자에게',
    line: '다음 관리자에게.',
    memo: '이 서랍을 열었다면, 이제 당신이 이 전시관의 불을 켜고 끄는 사람이다.\n부탁이 셋 있다.\n하나, 기록을 고르지 말 것. 둘, 점수보다 사람을 먼저 볼 것. 셋, 불은 하나쯤 켜 둘 것.\n전시관은 건물이 아니다. 누군가 기억해 주는 동안만 존재한다.\n— 첫 번째 관리자',
    ask: '당신은 이곳에 무엇을 남기고 갈 것인가?' },
};
const OFFICE_ORDER = ['record', 'names', 'people', 'seat', 'clock', 'end', 'mirror'];
const OFFICE = { read: new Set(), built: false, noir: 0, el: null, open: false, typer: null, steam: [], paper: null, paperText: '', typeT: 20, drawer: null, rainT: 0, notes: 0 };
try { (JSON.parse(localStorage.getItem('museum-office-read') || '[]') || []).forEach((k) => OFFICE.read.add(k)); } catch (e) { /* 처음부터 */ }

const ofMat = (c, r = 0.6, m = 0) => { const x = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m }); x.userData.noBatch = true; if (M.envIn) { x.envMap = M.envIn; x.envMapIntensity = 0.35; } return x; };
/** 방 안 좌표(m) → 그룹(방 바닥 기준)에 놓기 */
function ofPut(g, obj, x, y, z, ry = 0) { obj.position.set(x, y, z); obj.rotation.y = ry; obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); g.add(obj); return obj; }
function ofBlock(r, x0, x1, z0, z1, h = 120) { M.walls.push({ x0: x0 * CM, x1: x1 * CM, z0: z0 * CM, z1: z1 * CM, y0: r.y0, y1: r.y0 + h }); }
const ofAt = (o, x, y, z) => { o.position.set(x, y, z); return o; };
function ofHit(g, x, y, z, w, h, d, id) {
  const hit = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(x, y, z); g.add(hit);
  const T = OFFICE_TEXT[id], r = M.roomById.workshop;
  const info = { id: 'office-' + id, type: 'placard', icon: '🕯', label: T.obj, title: T.obj, room: 'workshop', x: x * CM, z: z * CM, y: y * CM, onUse: () => officeRead(id) };
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
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.9), new THREE.MeshBasicMaterial({ map: night })); pane.position.set(wx, 1.95, wz); pane.rotation.y = -Math.PI / 2; g.add(pane);
  // 빗줄기 — 흐르는 무늬
  const rain = ofCanvasTex(256, 256, (c, w, h) => { c.clearRect(0, 0, w, h); for (let i = 0; i < 160; i++) { const x = Math.random() * w, y = Math.random() * h, L = 8 + Math.random() * 30; c.strokeStyle = 'rgba(200,215,230,' + (0.12 + Math.random() * 0.25) + ')'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 1, y + L); c.stroke(); } });
  rain.wrapS = rain.wrapT = THREE.RepeatWrapping; rain.repeat.set(2, 1.4);
  const rainM = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.9), new THREE.MeshBasicMaterial({ map: rain, transparent: true, depthWrite: false })); rainM.position.set(wx - 0.01, 1.95, wz); rainM.rotation.y = -Math.PI / 2; g.add(rainM);
  OFFICE.rain = rain;
  const slats = []; for (let i = 0; i < 14; i++) slats.push(boxAt(0.04, 0.035, 5.2, wx - 0.05, 1.1 + i * 0.125, wz));
  const blinds = new THREE.Mesh(mergeGeos(slats), ofMat(0x6E685C, 0.7)); blinds.rotation.z = 0; g.add(blinds);
  const frame = rbox(0.12, 2.15, 5.5, 0.01, wood); frame.position.set(wx + 0.02, 1.95, wz); g.add(frame);
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
  for (let i = 0; i < 4; i++) { const d = rbox(0.54, 0.3, 0.02, 0.005, ofMat(0x6A6E66, 0.45, 0.45)); d.position.set(kx, 0.2 + i * 0.33, kz - 0.33 - (i === 3 ? 0.18 : 0)); g.add(d); const h = rbox(0.12, 0.02, 0.03, 0.005, brass); h.position.set(kx, 0.28 + i * 0.33, kz - 0.35 - (i === 3 ? 0.18 : 0)); g.add(h); }
  for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.24, 0.012), ofMat(i % 2 ? 0xC8B488 : 0xB09A6A, 0.85)); f.position.set(kx, 1.1, kz - 0.2 - i * 0.03); g.add(f); }
  const radio = rbox(0.42, 0.26, 0.2, 0.03, woodL); radio.position.set(kx, 1.53, kz); g.add(radio);
  const grill = new THREE.Mesh(new THREE.CircleGeometry(0.08, 18), ofMat(0x2A2018, 0.8)); grill.position.set(kx - 0.08, 1.53, kz - 0.101); grill.rotation.y = Math.PI; g.add(grill);
  ofBlock(r, kx - 0.35, kx + 0.35, kz - 0.4, kz + 0.35, 160);
  ofHit(g, kx, 1.0, kz - 0.3, 0.8, 1.8, 0.6, 'names');

  // ── 코르크 보드(북쪽 벽) — 회원 사진 · 붉은 실 ──
  const bx = x0 + 6.0, bz = z0 + 0.16;   // 벽 안쪽 면 = 경계 + 12cm
  const board = rbox(3.6, 1.7, 0.04, 0.01, ofMat(0x8A6A44, 0.95)); board.position.set(bx, 1.75, bz + 0.02); g.add(board);
  const fr = rbox(3.75, 1.85, 0.03, 0.01, wood); fr.position.set(bx, 1.75, bz); g.add(fr);
  // 사진이 있는 사람부터 여덟 — 사진이 없으면 이름을 타자로 친 인덱스 카드
  const folks = (M.players || []).map((p) => p.name).filter(Boolean);
  folks.sort((a, b) => (!!(M.faces || {})[b]) - (!!(M.faces || {})[a]));
  const faces = folks.slice(0, 8).map((n) => (M.faces || {})[n] || null), pins = [];
  const loader = new THREE.TextureLoader();
  const card = (name) => ofCanvasTex(170, 210, (c, w, h) => {
    c.fillStyle = '#E4DCC8'; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(160,40,40,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 46); c.lineTo(w, 46); c.stroke();
    c.strokeStyle = 'rgba(90,120,170,.28)'; for (let y = 70; y < h; y += 22) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.fillStyle = '#1A1612'; c.font = 'bold 26px "Courier New", serif'; c.textAlign = 'center'; c.fillText(name || '—', w / 2, 34);
    c.font = '15px "Courier New", serif'; c.fillStyle = 'rgba(26,22,18,.7)'; c.fillText('— 기억할 것 —', w / 2, 96);
  });
  for (let i = 0; i < 8; i++) {
    const px = bx - 1.45 + (i % 4) * 0.95 + (Math.random() - 0.5) * 0.2, py = 2.2 - Math.floor(i / 4) * 0.8 + (Math.random() - 0.5) * 0.12;
    const pm = new THREE.MeshStandardMaterial({ color: 0xD8D2C4, roughness: 0.9 });
    if (faces[i]) loader.load(faces[i], (t) => { t.colorSpace = THREE.SRGBColorSpace; pm.map = t; pm.needsUpdate = true; });
    else if (folks[i]) pm.map = card(folks[i]);
    const ph = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.42), pm); ph.position.set(px, py, bz + 0.05); ph.rotation.z = (Math.random() - 0.5) * 0.16; g.add(ph);
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), ofMat(0xB01818, 0.4)); pin.position.set(px, py + 0.18, bz + 0.07); g.add(pin); pins.push(pin.position.clone());
  }
  const lp = []; for (let i = 0; i < pins.length; i++) for (const j of [i + 1, i + 3, i + 5]) if (j < pins.length && Math.random() < 0.7) lp.push(pins[i], pins[j]);
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lp), new THREE.LineBasicMaterial({ color: 0xB01818 })));
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
  OFFICE.steamAt = new THREE.Vector3(sx + 0.14, 0.66, sz + 0.05);
  ofHit(g, sx, 0.6, sz, 2.6, 1.2, 1.0, 'seat');
  // 플로어 스탠드 — 의자 곁, 갓 아래로만 빛이 떨어진다
  const fl = new THREE.Group();
  fl.add(ofAt(cyl(0.16, 0.18, 0.03, brass, 16), 0, 0.015, 0)); fl.add(ofAt(cyl(0.014, 0.014, 1.5, brass, 8), 0, 0.77, 0));
  const fsh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.26, 18, 1, true), ofMat(0xD8C8A0, 0.8)); fsh.material.side = THREE.DoubleSide; fsh.position.y = 1.55; fl.add(fsh);
  ofPut(g, fl, sx - 1.0, 0, sz - 0.85);
  const fli = new THREE.PointLight(0xFFCF90, 8, 5.5, 1.6); fli.position.set(sx - 1.0, 1.45, sz - 0.85); g.add(fli);

  // ── 멈춘 시계(서쪽 벽) · 금 간 거울(서쪽 벽) ──
  const clk = ofCanvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#E8E0CC'; c.beginPath(); c.arc(128, 128, 124, 0, 6.28); c.fill(); c.strokeStyle = '#2A1C12'; c.lineWidth = 8; c.stroke();
    c.fillStyle = '#1A140E'; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; c.fillRect(128 + Math.sin(a) * 100 - 3, 128 - Math.cos(a) * 100 - 8, 6, 16); }
    const hand = (a, L, wd) => { c.save(); c.translate(128, 128); c.rotate(a); c.fillRect(-wd / 2, -L, wd, L); c.restore(); };
    hand((6 + 47 / 60) / 12 * 6.28, 60, 8); hand(47 / 60 * 6.28, 92, 5);
  });
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

  // ── 은은한 빛 · 천장의 흐린 등 하나 ──
  const amb = new THREE.PointLight(0x8090A8, 2.2, 14, 1.4); amb.position.set(cx, (r.h - 60) / CM, (z0 + z1) / 2); g.add(amb);
  // 서랍이 열리면 편지를 읽는다
  OFFICE.letterInfo = ofHit(g, dx - 0.5, 0.62, dz + 0.8, 0.3, 0.3, 0.6, 'letter');
  OFFICE.built = true;
  officePaint();
}

/* ── 읽기 — 한 줄 → 메모(타자기) → 질문 ── */
function officeRead(id) {
  if (id === 'letter' && OFFICE_ORDER.some((k) => !OFFICE.read.has(k))) {
    toast('잠겨 있다. 열쇠 구멍에 먼지가 없다 — 누가 자주 열어 본 것 같다. (' + OFFICE_ORDER.filter((k) => OFFICE.read.has(k)).length + ' / 7)', 2600);
    if (typeof torchClick === 'function') torchClick();
    return;
  }
  const T = OFFICE_TEXT[id]; if (!T) return;
  if (M.locked) { OFFICE.relock = true; document.exitPointerLock(); }
  M.openId = 'office';
  let el = OFFICE.el;
  if (!el) {
    el = OFFICE.el = document.createElement('div'); el.className = 'office-read'; el.id = 'officeRead';
    el.innerHTML = '<div class="or-card"><p class="or-k"></p><h2 class="or-line"></h2><p class="or-memo"></p><p class="or-ask"></p><button type="button" class="or-x">닫기 · Esc</button></div>';
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
  el.querySelector('.or-line').textContent = T.line;
  const memo = el.querySelector('.or-memo'), ask = el.querySelector('.or-ask');
  memo.textContent = ''; ask.textContent = ''; ask.classList.remove('on');
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
  if (id !== 'letter' && !OFFICE.read.has(id)) {
    OFFICE.read.add(id);
    try { localStorage.setItem('museum-office-read', JSON.stringify([...OFFICE.read])); } catch (e) { /* */ }
    officePaint();
    if (OFFICE_ORDER.every((k) => OFFICE.read.has(k))) setTimeout(() => { toast('어디선가 딸깍 — 책상 서랍의 잠금이 풀렸다', 3200); if (typeof torchClick === 'function') torchClick(); }, 1500);
  }
  if (id === 'letter' && typeof hauntRec === 'function') hauntRec('keeper');
}
/** 타자를 멈춘다 — 닫거나 다른 물건을 열 때 이전 글이 섞이지 않게 */
function officeStopTyping() { clearTimeout(OFFICE.delay); clearInterval(OFFICE.typer); OFFICE.finish = null; }
function officeClose() {
  if (!OFFICE.el) return;
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
  h.textContent = n < 7 ? '생각 ' + n + ' / 7' : '서랍이 열렸다';
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
  const inR = !!(M.room && M.room.id === 'workshop');
  OFFICE.noir += ((inR ? 1 : 0) - OFFICE.noir) * Math.min(1, dt * (inR ? 0.9 : 3));
  if (M.post && M.post.uniforms && M.post.uniforms.uNoir) M.post.uniforms.uNoir.value = OFFICE.noir;
  if (OFFICE.hud) OFFICE.hud.classList.toggle('on', inR && !OFFICE.open);
  if (OFFICE.rainG && SND.ctx) OFFICE.rainG.gain.setTargetAtTime(inR ? 0.07 : 0, SND.ctx.currentTime, 0.4);
  if (!inR) return;
  officeAmb(dt);
  OFFICE.t = (OFFICE.t || 0) + dt;
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
      const msg = '기억해 줘서 고마워. ';
      OFFICE.paperText = msg.slice(0, (OFFICE.paperText.length % msg.length) + 1);
      const cv = OFFICE.paper.userData.cv, c = cv.getContext('2d');
      c.fillStyle = '#EEE8DA'; c.fillRect(0, 0, cv.width, cv.height); c.fillStyle = '#1A1612'; c.font = '20px "Courier New", monospace';
      c.fillText(OFFICE.paperText, 18, 60); OFFICE.paper.needsUpdate = true;
      officeKey(0.7);
    } else OFFICE.typeT = 2;
  }
}
