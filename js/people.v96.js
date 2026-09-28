/* ══════════════════════════════════════════════════════════
   실사 관람객 — Mixamo 'Remy'(스킨 메시 + 뼈 67개) (v89)
   ══════════════════════════════════════════════════════════
   예전 관람객은 캡슐 다섯 덩어리(건축 투시도 인물)였다. 전시관이 실사가 되자 그것만 장난감으로 튀었다.
   → 얼굴·피부·옷·머리카락 텍스처가 있는 사람 모델을 뼈로 움직인다(three 기본 SkinnedMesh — 로더 없이 직접 조립).
     · Blender 에서 뽑았다(스크래치패드 people/export_remy.py): 단위 키(1.0) · T 자세 · 부위 번호(몸 · 상의 · 하의 · 머리 · 신발)
     · 걷기(1.2초 한 주기) · 서 있기(4초 — 숨 · 무게 옮김 · 고개)를 그 스크립트가 뼈에 직접 짰다(원본엔 골프 스윙뿐)
     · 텍스처 다섯 장 → 아틀라스 한 장(색+머리카락 알파 / 법선). 관람객 한 명 = 그리기 한 번
     · 사람마다 옷 · 머리 색 · 피부 톤 · 키를 바꾼다 — 옷은 '천의 명암만 남기고 색을 새로 입힌다'(검은 셔츠는 곱해선 물들지 않는다) */

const PEOPLE = { ok: false, chars: [] };
const PEOPLE_DIR_CDN = (window.MUSEUM_CDN || '') + 'assets/people/';
/* ⚠️ v94 — 파일 이름에 판(PEOPLE_AV)을 붙인다. v93 때 p1.json · p1.bin 을 같은 이름으로 바꿔 올렸더니
   기기에 남은 옛 파일과 새 파일이 섞일 수 있었다(루트 sw.js 와 브라우저 캐시는 이름으로만 구분한다).
   사람 모델을 다시 만들면 이 값을 올리고 파일 이름도 같이 바꾼다. */
const PEOPLE_AV = 'a95';
/* v90 — 얼굴이 모두 같았다(Remy 한 명을 옷 색만 바꿔 복제). MakeHuman(MPFB, CC0)으로 만든 여섯 명을 더한다:
   단발 여성 · 정장 중년 · 백발 어르신 · 운동복 청년 · 긴 머리 중년 여성 · 포니테일 외국인. 모두 스크래치패드
   people/build_char.py 가 Blender 에서 뽑았다(뼈는 Remy 와 같은 Mixamo 이름 → 걷기/서 있기도 같은 방식으로 사람마다 구웠다).
   번갈아 앉도록 순서를 섞는다(여 · 남 · 여 · 남 …) */
const PEOPLE_ORDER = ['p1', 'p2', 'p5', 'remy', 'p6', 'p3', 'p4'];
/* v96 — 아이 둘(단발 여자아이 · 짧은 머리 남자아이, 키 1.34 · 1.42m). 바깥 정원에만 선다 → 이름으로 부른다 */
const PEOPLE_EXTRA = ['p7', 'p8'];
/** Remy(v1) 아틀라스 — 부위 번호: 0 몸 1 상의 2 하의 3 머리카락 4 신발 */
const PEOPLE_ATLAS = {
  rects: [[0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5], [0, 0, 0.5, 0.5], [0.75, 0.25, 0.25, 0.25], [0.5, 0.25, 0.25, 0.25]],
  lum: [0.4067, 0.0471, 0.1272, 0.1793, 0.436],
  rough: [0.62, 0.9, 0.88, 0.7, 0.6],
};

function peopleClips(J) {
  const clips = {};
  for (const [name, C] of Object.entries(J.clips)) {
    const times = new Float32Array(C.n + 1);
    for (let i = 0; i <= C.n; i++) times[i] = i / C.fps;
    const tracks = [];
    J.bones.forEach((b, bi) => {
      const v = new Float32Array((C.n + 1) * 4);
      for (let i = 0; i <= C.n; i++) { const row = C.q[i % C.n]; v.set(row.slice(bi * 4, bi * 4 + 4), i * 4); }
      tracks.push(new THREE.QuaternionKeyframeTrack(b.n + '.quaternion', times, v));
    });
    const hv = new Float32Array((C.n + 1) * 3);
    for (let i = 0; i <= C.n; i++) hv.set(C.hips[i % C.n], i * 3);
    tracks.push(new THREE.VectorKeyframeTrack(J.bones[0].n + '.position', times, hv));
    clips[name] = new THREE.AnimationClip(name, C.n / C.fps, tracks);
    clips[name].stride = C.stride || 0;
    clips[name].speed = C.speed || 0;          // v95 — 딛는 발 기준 실제 걷는 속도(단위 키/초)
  }
  return clips;
}
function peopleFetch(name) {
  // Remy(Mixamo)는 재배포할 수 없어 CDN 저장소에 두지 않는다 → 늘 이 사이트에서 받는다
  const PEOPLE_DIR = name === 'remy' ? 'assets/people/' : PEOPLE_DIR_CDN;
  return Promise.all([
    fetch(PEOPLE_DIR + name + '.' + PEOPLE_AV + '.json').then((r) => (r.ok ? r.json() : null)),
    fetch(PEOPLE_DIR + name + '.' + PEOPLE_AV + '.bin').then((r) => (r.ok ? r.arrayBuffer() : null)),
    pbrImage(PEOPLE_DIR + name + '.' + PEOPLE_AV + '_c.webp'), pbrImage(PEOPLE_DIR + name + '.' + PEOPLE_AV + '_n.webp'),
  ]);
}
function peopleGeo(pos, nrm, uv, si, sw, part, idx) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('skinIndex', new THREE.Uint8BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.Uint8BufferAttribute(sw, 4, true));
  geo.setAttribute('aPart', new THREE.Uint8BufferAttribute(part, 1));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeBoundingSphere();
  return geo;
}
/** Remy — 평문 Float32(v1) */
function peopleRemy() {
  return peopleFetch('remy').then(([J, bin, c, n]) => {
    if (!J || !bin || !c || !n) return null;
    const nv = J.nv, ni = J.ni;
    if (bin.byteLength !== nv * 41 + ni * (J.i32 ? 4 : 2)) { console.warn('people: remy 파일 짝이 맞지 않음'); return null; }
    let o = 0;
    const take = (T, count) => { const a = new T(bin, o, count); o += count * T.BYTES_PER_ELEMENT; return a; };
    const pos = take(Float32Array, nv * 3), nrm = take(Float32Array, nv * 3), uv = take(Float32Array, nv * 2);
    const si = take(Uint8Array, nv * 4), sw = take(Uint8Array, nv * 4), part = take(Uint8Array, nv);
    // 색인은 정렬 안 된 자리에서 시작할 수 있다 → 잘라 복사한다(Uint16Array 는 짝수 오프셋만 받는다)
    const idx = J.i32 ? new Uint32Array(bin.slice(o, o + ni * 4)) : new Uint16Array(bin.slice(o, o + ni * 2));
    const R = PEOPLE_ATLAS.rects;
    for (let i = 0; i < nv; i++) {
      const r = R[part[i]];
      uv[i * 2] = r[0] + (uv[i * 2] - Math.floor(uv[i * 2])) * r[2];
      uv[i * 2 + 1] = r[1] + (uv[i * 2 + 1] - Math.floor(uv[i * 2 + 1])) * r[3];
    }
    return { name: 'remy', v: 1, J, geo: peopleGeo(pos, nrm, uv, si, sw, part, idx), clips: peopleClips(J), img: { c, n } };
  });
}
/** MakeHuman 사람 — 양자화(v2): 위치 u16(경계 상자) · uv u16 · 법선 i8 */
function peopleV2(name) {
  return peopleFetch(name).then(([J, bin, c, n]) => {
    if (!J || !bin || !c || !n) return null;
    const nv = J.nv, ni = J.ni;
    const want = nv * 23 + ((nv * 23) % 2) + ni * (J.i32 ? 4 : 2);
    if (bin.byteLength !== want) { console.warn('people: ' + name + ' 파일 짝이 맞지 않음', bin.byteLength, want); return null; }
    let o = 0;
    const q = new Uint16Array(bin, o, nv * 3); o += nv * 6;
    const uq = new Uint16Array(bin, o, nv * 2); o += nv * 4;
    const n8 = new Int8Array(bin, o, nv * 4); o += nv * 4;
    const si = new Uint8Array(bin, o, nv * 4); o += nv * 4;
    const sw = new Uint8Array(bin, o, nv * 4); o += nv * 4;
    const part = new Uint8Array(bin, o, nv); o += nv;
    if (o % 2) o++;
    const idx = J.i32 ? new Uint32Array(bin.slice(o, o + ni * 4)) : new Uint16Array(bin.slice(o, o + ni * 2));
    const pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), uv = new Float32Array(nv * 2);
    const lo = J.lo, hi = J.hi;
    for (let i = 0; i < nv; i++) {
      for (let k = 0; k < 3; k++) { pos[i * 3 + k] = lo[k] + q[i * 3 + k] / 65535 * (hi[k] - lo[k]); nrm[i * 3 + k] = n8[i * 4 + k] / 127; }
      uv[i * 2] = uq[i * 2] / 65535; uv[i * 2 + 1] = uq[i * 2 + 1] / 65535;
    }
    const geo = peopleGeo(pos, nrm, uv, si, sw, part, idx);
    // 얼굴 움직임 — 눈 깜빡임 · 말하기 · 웃음(움직이는 정점만 담겨 온다, 0.05mm 단위)
    const morph = {};
    if (J.morphs && J.morphs.length) {
      geo.morphAttributes.position = J.morphs.map((m, mi) => {
        const a = new Float32Array(nv * 3);
        for (let k = 0; k < m.i.length; k++) { const v = m.i[k]; a[v * 3] = m.d[k * 3] / 20000; a[v * 3 + 1] = m.d[k * 3 + 1] / 20000; a[v * 3 + 2] = m.d[k * 3 + 2] / 20000; }
        morph[m.n] = mi;
        return new THREE.BufferAttribute(a, 3);
      });
      geo.morphTargetsRelative = true;
    }
    return { name, v: 2, J, geo, morph, clips: peopleClips(J), img: { c, n } };
  });
}
function loadPeople() {
  const all = PEOPLE_ORDER.concat(PEOPLE_EXTRA);
  return Promise.all(all.map((n) => (n === 'remy' ? peopleRemy() : peopleV2(n)).catch((e) => { console.warn('people', n, e); return null; })))
    .then((list) => {
      PEOPLE.byName = {};
      list.forEach((c, k) => { if (c) PEOPLE.byName[all[k]] = c; });
      PEOPLE.chars = list.slice(0, PEOPLE_ORDER.length).filter(Boolean);
      PEOPLE.ok = PEOPLE.chars.length > 0;
    });
}
const peopleReady = () => PEOPLE.ok;

function peopleTex(ch) {
  if (!ch.tex) {
    const aniso = M.renderer ? Math.min(8, M.renderer.capabilities.getMaxAnisotropy()) : 4;
    const c = new THREE.Texture(ch.img.c); c.colorSpace = THREE.SRGBColorSpace; c.anisotropy = aniso; c.needsUpdate = true;
    const n = new THREE.Texture(ch.img.n); n.anisotropy = aniso; n.needsUpdate = true;
    ch.tex = { c, n };
  }
  return ch.tex;
}
/** 부위별 색 · 새로 입히기 · 명암 기준 · 거칠기(최대 8 부위) */
function peopleMaterial(ch, K) {
  const T = peopleTex(ch), lin = (hex) => new THREE.Color(hex);
  const P = 8, tint = [], colz = [], lum = [], rgh = [];
  for (let i = 0; i < P; i++) { tint.push(new THREE.Color(1, 1, 1)); colz.push(0); lum.push(1); rgh.push(0.7); }
  if (ch.v === 1) {
    // Remy — 사람마다 옷 · 머리 · 신발 색을 새로 입히고 피부 톤을 곱한다
    const skin = lin(K.skin || '#D8B090'), skinBase = new THREE.Color(0.6345, 0.3523, 0.2745);
    tint[0] = new THREE.Color(skin.r / skinBase.r, skin.g / skinBase.g, skin.b / skinBase.b).lerp(new THREE.Color(1, 1, 1), 0.45);
    tint[1] = lin(K.coat); tint[2] = lin(K.pants); tint[3] = lin(K.hairC || '#2A1E16'); tint[4] = lin(K.shoe || '#EDEDED');
    [0, 1, 1, 1, K.shoe ? 1 : 0].forEach((v, i) => { colz[i] = v; });
    PEOPLE_ATLAS.lum.forEach((v, i) => { lum[i] = v; }); PEOPLE_ATLAS.rough.forEach((v, i) => { rgh[i] = v; });
  } else {
    // MakeHuman 사람 — 제 옷 그대로(아틀라스에 이미 색이 있다)
    (ch.J.parts || []).forEach((p, i) => { if (i < P) rgh[i] = p.rough; });
  }
  // MakeHuman 옷 · 머리는 얇은 판(뒷면이 보인다) — 양면
  const m = new THREE.MeshStandardMaterial({ map: T.c, normalMap: T.n, alphaTest: 0.5, roughness: 1, metalness: 0,
    side: ch.v === 2 ? THREE.DoubleSide : THREE.FrontSide });
  m.userData.noBatch = true;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTint = { value: tint }; sh.uniforms.uColz = { value: colz }; sh.uniforms.uLum = { value: lum }; sh.uniforms.uRgh = { value: rgh };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aPart; uniform vec3 uTint[8]; uniform float uColz[8], uLum[8], uRgh[8];\nvarying vec3 vTint; varying float vColz, vLum, vRgh;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  int pi = int(aPart + 0.5); vTint = uTint[pi]; vColz = uColz[pi]; vLum = uLum[pi]; vRgh = uRgh[pi];');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTint; varying float vColz, vLum, vRgh;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        {
          float lum = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
          // 새로 입히기 — 천의 명암(평균 대비)만 남기고 색은 새로. 어두운 천은 잡음이 커서 명암을 조금 눌러 쓴다
          vec3 dyed = vTint * clamp(mix(1.0, lum / vLum, 0.65), 0.25, 2.2);
          diffuseColor.rgb = mix(diffuseColor.rgb * vTint, dyed, vColz);
        }`)
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = vRgh;');
  };
  m.customProgramCacheKey = () => 'people|' + ch.v;
  return m;
}

/** 관람객 한 명 — npc.js buildVisitor 와 같은 모양으로 돌려준다(+ mixer · walk · idle). i = 몇 번째 관람객 */
function buildRealVisitor(K, i = 0) {
  // i = 몇 번째 관람객(방마다 서는 사람) 또는 이름('p7' · 'remy' …)
  const ch = (typeof i === 'string' && PEOPLE.byName && PEOPLE.byName[i]) || PEOPLE.chars[(typeof i === 'number' ? i : 0) % PEOPLE.chars.length], J = ch.J;
  const bones = J.bones.map((b) => {
    const o = new THREE.Bone(); o.name = b.n;
    o.position.fromArray(b.t); o.quaternion.fromArray(b.q);
    return o;
  });
  J.bones.forEach((b, bi) => { if (b.p >= 0) bones[b.p].add(bones[bi]); });
  const mesh = new THREE.SkinnedMesh(ch.geo, peopleMaterial(ch, K));
  mesh.add(bones[0]);
  mesh.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton(bones));
  mesh.frustumCulled = false;                         // 뼈가 움직여 경계구가 맞지 않는다(방 컬링이 대신한다)
  mesh.castShadow = false; mesh.receiveShadow = true;
  const h = ch.v === 2 ? J.height : K.h;
  const root = new THREE.Group();
  root.add(mesh);
  root.scale.setScalar(h);
  const mixer = new THREE.AnimationMixer(mesh);
  const walk = mixer.clipAction(ch.clips.walk), idle = mixer.clipAction(ch.clips.idle);
  walk.play(); idle.play();
  walk.setEffectiveWeight(0); idle.setEffectiveWeight(1);
  idle.time = Math.random() * ch.clips.idle.duration;
  // 걷는 속도 1 배일 때 m/s — 한 주기 걸음 폭(단위 키) × 키 / 주기
  const natural = ch.clips.walk.speed ? ch.clips.walk.speed * h : (ch.clips.walk.stride || 0.6) * h / ch.clips.walk.duration;
  return { root, mesh, mixer, walk, idle, natural, hM: h, real: true, morph: ch.morph && ch.morph.blink != null ? ch.morph : null,
    label: ch.v === 2 ? J.label : null, wear: ch.v === 2 ? J.wear : null };
}
