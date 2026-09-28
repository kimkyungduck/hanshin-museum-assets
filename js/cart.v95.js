/* ══════════════════════════════════════════════════════════
   골프 카트 — 직접 타고 다닌다(v89)
   ══════════════════════════════════════════════════════════
   카트길 입구에 서 있는 카트에 다가가 E(폰은 조사 버튼) → 운전석에 앉는다.
     W/S(또는 ↑↓ · 조이스틱 위아래) 가속 · 후진 / A·D(←→ · 조이스틱 좌우) 핸들 / Space 브레이크 / E 내리기
   바깥 1층(18번 홀 · 테라스 · 광장 · 정원 · 연습장)만 달린다 — 건물 · 호수 · 나무 · 조각에는 부딪혀 선다.
   바퀴가 구르고, 차체는 땅의 기울기를 따라 기울고, 전기 모터 소리가 속도에 따라 오른다. */

const CART = { driving: false, v: 0, yaw: 0, steer: 0, look: 0 };
const CART_MAX = 6.2, CART_REV = 2.4;            // m/s (시속 22km / 9km)

/** site.js 가 카트를 세울 때 부른다 */
/** 카트 충돌 상자 — 축 정렬 상자 하나로는 비스듬히 선 차체보다 훨씬 커진다 → 차체 길이를 따라 작은 상자 셋(앞 · 가운데 · 뒤) */
function cartWalls(x, z, yaw, feet = 0) {
  const f = [-Math.sin(yaw), -Math.cos(yaw)];
  return [-0.72, 0, 0.72].map((a) => {
    const cx = (x + f[0] * a) * CM, cz = (z + f[1] * a) * CM;
    return { x0: cx - 55, x1: cx + 55, z0: cz - 55, z1: cz + 55, y0: feet - 200, y1: feet + 300, cart: true };
  });
}
function cartSetWalls(on) {
  for (const w of CART.walls || []) { const i = M.walls.indexOf(w); if (i >= 0) M.walls.splice(i, 1); }
  CART.walls = [];
  if (!on) return;
  const p = cartPos();
  CART.walls = cartWalls(p.x, p.z, CART.yaw, CART.feet || 0);
  M.walls.push(...CART.walls);
}
function cartRegister(obj, shadow, wall, wheels) {
  CART.obj = obj; CART.shadow = shadow; CART.wheels = wheels;
  CART.yaw = obj.rotation.y;
  { const i = M.walls.indexOf(wall); if (i >= 0) M.walls.splice(i, 1); }       // site.js 의 큰 상자 대신
  obj.updateMatrixWorld(true);
  const p = obj.getWorldPosition(new THREE.Vector3());
  CART.walls = cartWalls(p.x, p.z, CART.yaw, 0); M.walls.push(...CART.walls);
  obj.traverse((o) => { o.userData.keep = true; });
}

const cartPos = () => CART.obj && CART.obj.getWorldPosition(new THREE.Vector3());
/** 탈 수 있는 거리인가(2.6m) */
function cartNear() {
  if (!CART.obj || CART.driving || GOLF.mode) return false;
  const p = cartPos();
  return Math.hypot(p.x - M.pos.x, p.z - M.pos.z) < 2.6;
}

function cartBoard() {
  CART.driving = true; CART.v = 0; CART.steer = 0;
  { const p = cartPos(), rm = pickRoom(p.x * CM, p.z * CM, M.feet || 0, 400); CART.feet = rm ? floorAt(rm, p.x * CM, p.z * CM) : 0; }
  CART.yaw = CART.obj.rotation.y;
  CART.look = 0; M.pitch = -0.05;
  cartSetWalls(false);                                  // 제 충돌 상자는 치운다
  cartSound(true);
  cartHud(true);
  toast('🛺 카트 — W/S 가속·후진 · A/D 핸들 · Space 브레이크 · E 내리기', 4200);
}
function cartExit() {
  CART.driving = false; CART.v = 0;
  cartSound(false); cartHud(false);
  const p = cartPos();
  // ⚠️ v90 — 충돌 상자를 **먼저** 다시 놓고, 그 밖에서 내릴 자리를 찾는다.
  //    예전엔 2.6m 정사각 상자(반폭 130cm)를 나중에 넣어, 1.25m 옆에 내린 사람이 상자 안에 갇혀 한 걸음도 못 떼었다.
  //    상자는 돌아간 차체(1.3 × 2.4m)를 감싸는 크기로.
  cartSetWalls(true);
  // 운전석 쪽(왼쪽) → 오른쪽 → 뒤 → 앞 순서로, 가까운 데부터 조금씩 멀리
  const f = new THREE.Vector3(-Math.sin(CART.yaw), 0, -Math.cos(CART.yaw)), r = new THREE.Vector3(Math.cos(CART.yaw), 0, -Math.sin(CART.yaw));
  let placed = false;
  for (const dist of [1.3, 1.7, 2.2, 2.8]) {
    for (const d of [r.clone().multiplyScalar(-dist), r.clone().multiplyScalar(dist), f.clone().multiplyScalar(-dist - 0.6), f.clone().multiplyScalar(dist + 0.6)]) {
      const x = (p.x + d.x) * CM, z = (p.z + d.z) * CM;
      const rm = pickRoom(x, z, CART.feet || 0, 200);
      if (rm && !hitsWall(x, z, floorAt(rm, x, z))) {
        M.room = rm; M.feet = M.eyeFeet = floorAt(rm, x, z); M.pos.set(x / CM, (M.feet + EYE) / CM, z / CM); placed = true; break;
      }
    }
    if (placed) break;
  }
  if (!placed) cartSetWalls(false);                     // 빈자리가 없으면 카트 상자를 치운다(갇히지 않게)
  M.vel.set(0, 0, 0);
  M.yaw = CART.yaw + CART.look;
}

/** 땅 높이(m) — 바깥 1층 방이 있고 물이 아니면 */
function cartGround(x, z) {
  const cx = x * CM, cz = z * CM;
  if (typeof lakeDist === 'function' && M.roomById.field && inRect(M.roomById.field, cx, cz) && lakeDist(cx, cz) < 1.04) return null;
  const rm = pickRoom(cx, cz, CART.feet == null ? 0 : CART.feet, 90);
  if (!rm || !rm.outdoor || rm.lv > 0) return null;
  return { y: floorAt(rm, cx, cz), room: rm };
}
/** 차체 네 귀퉁이 + 앞뒤 가운데가 모두 달릴 수 있는 자리인가 */
function cartFits(x, z, yaw) {
  const f = [-Math.sin(yaw), -Math.cos(yaw)], r = [Math.cos(yaw), -Math.sin(yaw)];
  for (const [a, b] of [[1.25, 0.62], [1.25, -0.62], [-1.2, 0.62], [-1.2, -0.62], [1.3, 0], [0, 0]]) {
    const px = x + f[0] * a + r[0] * b, pz = z + f[1] * a + r[1] * b;
    const g = cartGround(px, pz);
    if (!g) return false;
    if (Math.abs(g.y - (CART.feet == null ? g.y : CART.feet)) > 80) return false;
    if (hitsWall(px * CM, pz * CM, g.y)) return false;
  }
  return true;
}

/** 매 프레임 — step() 대신 돈다 */
function cartStep(dt) {
  const k = M.keys || {};
  const inp = readMove();
  if (k.arrowleft) M.yaw -= 0.028;                   // readMove 가 돌린 시선을 되돌린다(카트에선 ←→ 가 핸들)
  if (k.arrowright) M.yaw += 0.028;
  const thr = inp.f, st = clamp(inp.s + (k.arrowright ? 1 : 0) - (k.arrowleft ? 1 : 0), -1, 1);
  // 가속 · 브레이크 · 저항
  if (k[' ']) CART.v *= Math.pow(0.02, dt);
  else if (thr > 0) CART.v += (CART.v < 0 ? 7 : 2.6) * thr * dt;
  else if (thr < 0) CART.v += (CART.v > 0 ? 7 : 1.6) * thr * dt;
  else CART.v *= Math.pow(0.45, dt);
  CART.v = clamp(CART.v, -CART_REV, CART_MAX);
  if (Math.abs(CART.v) < 0.02 && !thr) CART.v = 0;
  // 핸들 — 빠를수록 덜 꺾인다
  CART.steer += (st - CART.steer) * Math.min(1, dt * 5);
  const turn = -CART.steer * (0.9 / (1 + Math.abs(CART.v) * 0.12)) * clamp(CART.v / 2.2, -1, 1);
  const p = cartPos();
  const nyaw = CART.yaw + turn * dt;
  const nx = p.x - Math.sin(nyaw) * CART.v * dt, nz = p.z - Math.cos(nyaw) * CART.v * dt;
  if (cartFits(nx, nz, nyaw)) {
    CART.yaw = nyaw;
    cartPlace(nx, nz);
  } else if (Math.abs(CART.v) > 0.6) {
    if (typeof golfSfx === 'function') golfSfx('land', 0.9);     // 쿵
    CART.v *= -0.25;
  } else CART.v = 0;
  // 바퀴
  if (CART.wheels) for (const w of CART.wheels) w.rotation.x -= CART.v * dt / 0.22;
  // 카메라 — 운전석(왼쪽 자리) 눈높이. 마우스로 둘러볼 수 있다(시선은 차와 함께 돈다)
  M.yaw += turn * dt;
  const o = CART.obj, eye = new THREE.Vector3(-0.26, 1.64, 0.26).applyMatrix4(o.matrixWorld);
  M.cam.position.copy(eye);
  M.cam.rotation.set(M.pitch, M.yaw, 0, 'YXZ');
  M.pos.copy(eye);
  CART.look = M.yaw - CART.yaw;
  const g = cartGround(o.position.x, o.position.z);
  if (g) { M.room = g.room; M.feet = g.y; }
  cullRooms(M.room);
  paintHud(M.room);
  cartSound(true, Math.abs(CART.v) / CART_MAX, thr);
  const el = $('cartHud'); if (el) el.firstChild.textContent = Math.round(Math.abs(CART.v) * 3.6) + ' km/h' + (CART.v < -0.05 ? ' · 후진' : '');
}

/** 차체를 땅에 앉힌다 — 앞뒤 · 좌우 높이차로 기울인다 */
function cartPlace(x, z) {
  const o = CART.obj, f = [-Math.sin(CART.yaw), -Math.cos(CART.yaw)], r = [Math.cos(CART.yaw), -Math.sin(CART.yaw)];
  const h = (a, b) => { const g = cartGround(x + f[0] * a + r[0] * b, z + f[1] * a + r[1] * b); return g ? g.y / CM : null; };
  const c = cartGround(x, z); if (!c) return;
  CART.feet = c.y;
  const hf = h(0.75, 0), hb = h(-0.7, 0), hl = h(0, -0.56), hr = h(0, 0.56), y = c.y / CM;
  const pitch = hf != null && hb != null ? Math.atan2(hf - hb, 1.45) : 0;
  const roll = hl != null && hr != null ? Math.atan2(hr - hl, 1.12) : 0;   // 왼쪽(−x)이 높으면 음수
  const parent = o.parent; parent.updateMatrixWorld();
  const local = parent.worldToLocal(new THREE.Vector3(x, y, z));
  o.position.copy(local);
  o.rotation.set(pitch, CART.yaw, roll, 'YXZ');
  o.updateMatrixWorld(true);
  if (CART.shadow) { const sp = parent.worldToLocal(new THREE.Vector3(x, y + 0.01, z)); CART.shadow.position.copy(sp); CART.shadow.rotation.z = -CART.yaw; }
}

function cartHud(on) {
  let el = $('cartHud');
  if (!el) { el = document.createElement('div'); el.id = 'cartHud'; el.className = 'cart-hud hidden'; el.innerHTML = '<b></b><span>W/S 가속·후진 · A/D 핸들 · Space 브레이크 · E 내리기</span>'; $('gal').appendChild(el); }
  el.classList.toggle('hidden', !on);
  if (M.touch && on) el.lastChild.textContent = '조이스틱 위·아래 가속 · 좌·우 핸들 · 버튼 내리기';
}
/** 걸어 다닐 때 — 카트 곁이면 안내 */
function cartCue() {
  let cue = $('cartCue');
  const on = cartNear();
  if (!cue) {
    if (!on) return;
    cue = document.createElement('div'); cue.id = 'cartCue'; cue.className = 'golf-cue cart-cue hidden';
    cue.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); cartBoard(); });
    $('gal').appendChild(cue);
  }
  cue.classList.toggle('hidden', !on);
  if (on) cue.innerHTML = '🛺 <b>카트 타기</b>' + (M.touch ? ' · 탭' : ' · <kbd>E</kbd>');
}

/** 전기 모터 소리 — 속도에 따라 음이 오른다 */
function cartSound(on, s = 0, thr = 0) {
  const ac = typeof golfAudio === 'function' ? golfAudio() : null;
  if (!ac) return;
  if (!on) { if (CART.snd) { CART.snd.g.gain.setTargetAtTime(0, ac.currentTime, 0.1); const S = CART.snd; setTimeout(() => { try { S.o1.stop(); S.o2.stop(); } catch (e) { /* 이미 멈춤 */ } }, 400); CART.snd = null; } return; }
  if (!CART.snd) {
    const g = ac.createGain(); g.gain.value = 0; g.connect(typeof SND !== 'undefined' && SND.bus ? SND.bus : ac.destination);
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(g);
    const o1 = ac.createOscillator(); o1.type = 'sawtooth'; o1.connect(lp);
    const o2 = ac.createOscillator(); o2.type = 'sine'; o2.connect(g);
    o1.start(); o2.start();
    CART.snd = { g, o1, o2, lp };
  }
  const t = ac.currentTime;
  CART.snd.o1.frequency.setTargetAtTime(55 + s * 120, t, 0.08);
  CART.snd.o2.frequency.setTargetAtTime(180 + s * 420, t, 0.08);
  CART.snd.g.gain.setTargetAtTime(0.012 + s * 0.05 + Math.abs(thr) * 0.02, t, 0.1);
}
