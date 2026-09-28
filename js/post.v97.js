/**
 * post.js — 후처리 (전역 스크립트, 애드온 의존 없음)
 *
 * three.js 의 examples/jsm 애드온(EffectComposer 등)은 모두 ES 모듈이라
 * import 사슬을 만든다. 그 사슬 어딘가에서 module specifier 해석이 실패하면
 * 화면이 통째로 뜨지 않는다. → 필요한 만큼만 직접 구현해 **모듈을 없앤다**.
 *
 * 파이프라인
 *   ① 씬 → sceneRT
 *   ② sceneRT 에서 밝은 부분만 추출 → brightRT (절반 해상도)
 *   ③ 가로/세로 분리 블러 2회 → 헐레이션(빛 번짐)
 *   ④ 합성 + 필름 룩(그레인·비네트·색수차·채도/톤) → 화면
 *   (+) SSAO — 면과 면이 만나는 곳을 어둡게(아래 주석)
 */

function createPost(renderer, scene, camera, opt = {}) {
  const T = THREE;

  const VERT = `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
  `;

  const opts = { type: T.HalfFloatType, colorSpace: T.NoColorSpace };
  let W = 1, H = 1;

  /* ⚠️ 후처리를 쓰는 순간 renderer 의 antialias:true 는 **아무 일도 하지 않는다.**
     씬을 캔버스가 아니라 RenderTarget 에 그리기 때문이다. 그래서 문지방·챠레일·
     문선처럼 얇고 광택 강한 브라스 부재가 화면을 돌릴 때마다 픽셀 단위로 켜졌다
     꺼지며 글리치처럼 번쩍였다(거기에 색수차가 겹쳐 색까지 흔들렸다).
     → MSAA 를 RenderTarget 에 직접 요청한다. 블룸용 RT 는 이미 흐린 결과라 불필요. */
  const samples = (opt.samples != null) ? opt.samples
    : ((typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches) ? 0 : 4);
  const sceneRT = new T.WebGLRenderTarget(1, 1, { ...opts, samples });
  const brightRT = new T.WebGLRenderTarget(1, 1, opts);
  const blurA = new T.WebGLRenderTarget(1, 1, opts);
  const blurB = new T.WebGLRenderTarget(1, 1, opts);

  /* ── SSAO(화면 공간 차폐광) ─────────────────────────────────
     '진짜 건물' 과 '옛날 3D 게임' 을 가르는 가장 큰 차이가 이것이었다.
     실제 공간에서는 벽과 바닥이 만나는 모서리, 좌대 밑, 액자 둘레가 빛을 덜 받아 어둡다.
     이게 없으면 모든 사물이 바닥 위에 떠 있고 벽은 종이처럼 평평하다.
       ① 반 해상도로 씬을 한 번 더 그린다 — 재질 대신 **법선**, 그리고 깊이 텍스처
       ② 점마다 반구 안 12방향을 찍어 가려진 비율을 잰다
       ③ 깊이를 보며 흐린다(경계 너머로 번지지 않게)
       ④ 최종 합성에서 장면 색에 곱한다
     비용이 커서 **WebGL2 + 데스크톱**에서만 켠다(폰은 world.js 의 바닥 접촉 그늘만 쓴다).
     유리·잔디 포기처럼 투명한 것은 ①에서 뺀다 — 넣으면 유리벽 너머가 통째로 어두워진다. */
  const useAO = opt.ao !== false && renderer.capabilities.isWebGL2;
  let preRT = null, aoRT = null, aoBlurRT = null, normalMat = null, aoMat = null, aoBlurMat = null;
  let aoSkip = [];
  const white = new T.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  white.needsUpdate = true;
  if (useAO) {
    preRT = new T.WebGLRenderTarget(1, 1, { type: T.UnsignedByteType });
    preRT.depthTexture = new T.DepthTexture(1, 1);
    preRT.depthTexture.type = T.UnsignedIntType;
    aoRT = new T.WebGLRenderTarget(1, 1, { type: T.UnsignedByteType });
    aoBlurRT = new T.WebGLRenderTarget(1, 1, { type: T.UnsignedByteType });
    normalMat = new T.MeshNormalMaterial();
    const K = [];
    for (let i = 0; i < 12; i++) {
      // 반구 안 점 — 가운데로 몰리게(가까운 차폐가 더 중요하다)
      const a = i * 2.39996, zz = 0.15 + 0.85 * ((i * 7) % 12) / 12;
      const rr = Math.sqrt(1 - zz * zz);
      let sc = (i + 1) / 12; sc = 0.12 + 0.88 * sc * sc;
      K.push(new T.Vector3(Math.cos(a) * rr * sc, Math.sin(a) * rr * sc, zz * sc));
    }
    const VIEWPOS = `
      uniform mat4 uInvProj;
      vec3 viewPos(vec2 uv, float d){ vec4 c = vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); vec4 v = uInvProj * c; return v.xyz / v.w; }`;
    aoMat = new T.ShaderMaterial({
      uniforms: {
        tDepth: { value: null }, tNormal: { value: null },
        uProj: { value: new T.Matrix4() }, uInvProj: { value: new T.Matrix4() },
        uKernel: { value: K }, uRadius: { value: 0.85 }, uBias: { value: 0.025 }, uRes: { value: new T.Vector2(1, 1) },
      },
      vertexShader: VERT,
      fragmentShader: `
        uniform sampler2D tDepth, tNormal; uniform mat4 uProj; uniform vec3 uKernel[12];
        uniform float uRadius, uBias; uniform vec2 uRes;
        varying vec2 vUv;
        ${VIEWPOS}
        float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main(){
          float d = texture2D(tDepth, vUv).x;
          if (d >= 0.99999) { gl_FragColor = vec4(1.0); return; }
          vec3 P = viewPos(vUv, d);
          vec3 N = normalize(texture2D(tNormal, vUv).xyz * 2.0 - 1.0);
          float a = hash(floor(vUv * uRes)) * 6.2831853;
          vec3 rv = vec3(cos(a), sin(a), 0.0);
          vec3 Tn = normalize(rv - N * dot(rv, N));
          mat3 TBN = mat3(Tn, cross(N, Tn), N);
          float occ = 0.0;
          for (int i = 0; i < 12; i++) {
            vec3 S = P + TBN * uKernel[i] * uRadius;
            vec4 o = uProj * vec4(S, 1.0);
            vec2 suv = o.xy / o.w * 0.5 + 0.5;
            if (suv.x < 0.0 || suv.x > 1.0 || suv.y < 0.0 || suv.y > 1.0) continue;
            vec3 SP = viewPos(suv, texture2D(tDepth, suv).x);
            float range = smoothstep(0.0, 1.0, uRadius / max(0.0001, abs(P.z - SP.z)));
            occ += (SP.z >= S.z + uBias ? 1.0 : 0.0) * range;
          }
          // 곡선 — 차폐가 적은 곳은 그대로 두고 모서리만 깊게
          float ao = pow(1.0 - occ / 12.0, 2.2);
          gl_FragColor = vec4(vec3(ao), 1.0);
        }`,
    });
    aoBlurMat = new T.ShaderMaterial({
      uniforms: { tAO: { value: null }, tDepth: { value: null }, uTexel: { value: new T.Vector2() }, uInvProj: { value: new T.Matrix4() } },
      vertexShader: VERT,
      fragmentShader: `
        uniform sampler2D tAO, tDepth; uniform vec2 uTexel;
        varying vec2 vUv;
        ${VIEWPOS}
        void main(){
          float z0 = viewPos(vUv, texture2D(tDepth, vUv).x).z;
          float sum = 0.0, wsum = 0.0;
          for (int x = -2; x < 2; x++) for (int y = -2; y < 2; y++) {
            vec2 uv = vUv + (vec2(float(x), float(y)) + 0.5) * uTexel;
            float z = viewPos(uv, texture2D(tDepth, uv).x).z;
            float w = 1.0 / (0.03 + abs(z - z0));
            sum += texture2D(tAO, uv).r * w; wsum += w;
          }
          gl_FragColor = vec4(vec3(sum / wsum), 1.0);
        }`,
    });
  }

  // 전체화면 쿼드 — 셰이더 패스를 그릴 무대
  const quadGeo = new T.PlaneGeometry(2, 2);
  const quadCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadScene = new T.Scene();
  const quad = new T.Mesh(quadGeo, null);
  quad.frustumCulled = false;
  quadScene.add(quad);


  /* ② 밝은 부분 추출 */
  const brightMat = new T.ShaderMaterial({
    uniforms: { tSrc: { value: null }, uThresh: { value: 0.72 }, uKnee: { value: 0.28 } },
    vertexShader: VERT,
    fragmentShader: `
      uniform sampler2D tSrc; uniform float uThresh, uKnee;
      varying vec2 vUv;
      void main(){
        vec3 c = texture2D(tSrc, vUv).rgb;
        float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
        // 임계값 근처를 부드럽게 — 딱 잘리면 경계가 보인다
        float k = smoothstep(uThresh - uKnee, uThresh + uKnee, l);
        gl_FragColor = vec4(c * k, 1.0);
      }`,
  });

  /* ③ 분리 가우시안 블러 */
  const blurMat = new T.ShaderMaterial({
    uniforms: { tSrc: { value: null }, uDir: { value: new T.Vector2(1, 0) }, uTexel: { value: new T.Vector2() } },
    vertexShader: VERT,
    fragmentShader: `
      uniform sampler2D tSrc; uniform vec2 uDir, uTexel;
      varying vec2 vUv;
      void main(){
        vec2 s = uDir * uTexel;
        vec3 c = texture2D(tSrc, vUv).rgb * 0.2270270270;
        c += texture2D(tSrc, vUv + s * 1.3846153846).rgb * 0.3162162162;
        c += texture2D(tSrc, vUv - s * 1.3846153846).rgb * 0.3162162162;
        c += texture2D(tSrc, vUv + s * 3.2307692308).rgb * 0.0702702703;
        c += texture2D(tSrc, vUv - s * 3.2307692308).rgb * 0.0702702703;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });

  /* ④ 최종 합성 + 필름 룩
     1990년대 아날로그 감성은 색이 아니라 이 넷에서 나온다:
     그레인 · 비네트 · 렌즈 색수차 · 채도를 뺀 따뜻한 톤 */
  const finalMat = new T.ShaderMaterial({
    uniforms: {
      tScene: { value: null }, tBloom: { value: null },
      tAO: { value: null }, uAO: { value: 0.0 },
      uTime: { value: 0 },
      uRes: { value: new T.Vector2(1, 1) },
      uBloom: { value: 0.58 },
      /* 필름 그레인.
         ⚠️ 예전 값(0.072) + 매 프레임 새 난수 + 1픽셀 입자 + 암부 가중 조합은
            **카메라가 완전히 정지해 있어도 화면 픽셀의 40%가 매 프레임 20단계
            이상 요동쳤다.** 어두운 전시관에서 이건 필름 감성이 아니라 눈이 아픈
            디지털 노이즈고, 문지방·브라스처럼 매끈한 면에서 특히 '색이 변하는
            글리치' 로 읽힌다. 아래 grainSize/12Hz/중간톤 가중과 함께 낮췄다. */
      // 리디자인: 필름 그레인·비네트·검정 들뜸을 줄였다 — '옛날 화면' 인상의 큰 몫이었다
      uGrain: { value: 0.018 },
      uGrainSize: { value: 1.7 },      // 입자 한 알의 크기(px). 1 이면 픽셀 노이즈다
      uVig: { value: 0.5 },
      /* 검은색을 완전한 0 으로 두지 않는 필름룩. 값이 곧 화면의 '가장 어두운 색' 이다.
         1.0 이면 검정이 sRGB 30 까지 올라간다 — 미술관에서는 그게 맞지만
         공포 구역에서는 그 30 이 어둠을 통째로 없애버린다. 구역마다 다르게 준다. */
      uLift: { value: 0.35 },
      // 색수차 0.0018 → 0.0011. 밝은 브라스 얇은 선에서 R/B 가 어긋나며
      // 무지개처럼 색이 흔들려 보였다. 필름 느낌은 이 값으로도 충분히 남는다.
      uAber: { value: 0.0004 },
      // 2.1 은 조명이 스포트뿐이던 시절의 값. 해·환경광이 들어오며 하얗게 날아갔다
      uExposure: { value: 1.35 },
    },
    vertexShader: VERT,
    fragmentShader: `
      uniform sampler2D tScene, tBloom, tAO;
      uniform float uTime, uBloom, uGrain, uGrainSize, uVig, uAber, uExposure, uLift, uAO;
      uniform vec2 uRes;
      varying vec2 vUv;

      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      // ACES 근사 — 하이라이트가 부드럽게 말린다
      vec3 aces(vec3 x){
        return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
      }

      void main(){
        vec2 c2 = vUv - 0.5;
        float r2 = dot(c2, c2);

        // 색수차 — 가장자리로 갈수록 RGB 가 어긋난다
        vec2 off = c2 * r2 * uAber * 12.0;
        vec3 col;
        col.r = texture2D(tScene, vUv + off).r;
        col.g = texture2D(tScene, vUv).g;
        col.b = texture2D(tScene, vUv - off).b;

        // 차폐광 — 블룸보다 먼저(빛 번짐은 그늘을 덮어야 자연스럽다)
        col *= mix(1.0, texture2D(tAO, vUv).r, uAO);

        // 헐레이션
        col += texture2D(tBloom, vUv).rgb * uBloom;

        col = aces(col * uExposure);

        // 채도 −12% + 따뜻한 리프트
        float l = dot(col, vec3(0.299, 0.587, 0.114));
        col = mix(vec3(l), col, 0.88);
        col *= vec3(1.035, 1.0, 0.952);
        col += vec3(0.015, 0.010, 0.005) * uLift * (1.0 - l);

        // 비네트
        float vig = smoothstep(0.95, 0.10, r2 * uVig);
        col *= mix(0.62, 1.0, vig);

        // (!) linear -> sRGB encode. Without this the whole museum looks far darker
        //     than intended (linear 0.5 shows as ~20% perceived brightness).
        //     three does NOT do this for us when a raw shader writes to the canvas.
        col = pow(max(col, vec3(0.0)), vec3(0.4545454545));

        /* 그레인 — 네 가지를 지켜야 '필름' 이고, 안 지키면 '디지털 노이즈' 다.
           ① 감마 인코딩 **뒤에** 더한다. 앞에서 더하면 암부에서 감마가 노이즈를
              몇 배로 부풀려(어두운 전시관에서 특히) 세기를 예측할 수 없다.
           ② 입자가 픽셀보다 커야 한다 — 1픽셀 난수는 지글거림으로만 보인다
           ③ 초당 12번만 갱신 — 매 프레임 뽑으면 60~240Hz 로 떨린다(필름은 24Hz)
           ④ 중간 톤에 가장 강하게, 암부는 약하게 — 예전처럼 암부를 키우면
              어두운 전시관 전체가 노이즈로 덮인다 */
        float ld = dot(col, vec3(0.299, 0.587, 0.114));
        vec2 gCell = floor(vUv * uRes / max(1.0, uGrainSize));
        float g = hash(gCell + floor(uTime * 12.0) * 17.31) - 0.5;
        col += g * uGrain * (0.35 + 2.6 * ld * (1.0 - ld));

        gl_FragColor = vec4(col, 1.0);
      }`,
  });

  function setSize(w, h) {
    W = Math.max(1, Math.floor(w)); H = Math.max(1, Math.floor(h));
    const dpr = renderer.getPixelRatio();
    sceneRT.setSize(W * dpr, H * dpr);
    finalMat.uniforms.uRes.value.set(W * dpr, H * dpr);
    const hw = Math.max(1, Math.floor(W * dpr / 2)), hh = Math.max(1, Math.floor(H * dpr / 2));
    brightRT.setSize(hw, hh); blurA.setSize(hw, hh); blurB.setSize(hw, hh);
    blurMat.uniforms.uTexel.value.set(1 / hw, 1 / hh);
    if (useAO) {
      preRT.setSize(hw, hh); aoRT.setSize(hw, hh); aoBlurRT.setSize(hw, hh);
      aoMat.uniforms.uRes.value.set(hw, hh);
      aoBlurMat.uniforms.uTexel.value.set(1 / hw, 1 / hh);
    }
  }

  function pass(material, target) {
    quad.material = material;
    renderer.setRenderTarget(target || null);
    renderer.render(quadScene, quadCam);
  }

  let aoOn = false, aoStrength = 1.0;
  /** SSAO 켜기 — 씬이 다 지어진 뒤 부른다(투명한 것 목록을 그때 모은다) */
  function enableAO(on) {
    if (!useAO) return false;
    aoOn = on !== false;
    aoSkip = [];
    scene.traverse((o) => {
      if (o.isSprite) { aoSkip.push(o); return; }          // v97 — 번짐(스프라이트)은 깊이를 남기지 않는다
      if (!o.isMesh) return;
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      if (!m || m.transparent || m.alphaTest > 0 || m.isShaderMaterial || m.isMeshBasicMaterial && m.depthWrite === false) aoSkip.push(o);
    });
    return aoOn;
  }

  function render(t) {
    finalMat.uniforms.uTime.value = t;

    // ① 씬
    renderer.setRenderTarget(sceneRT);
    renderer.clear();
    renderer.render(scene, camera);

    // (+) SSAO — 법선·깊이 프리패스 → 차폐 → 깊이 인식 블러
    if (useAO && aoOn) {
      const was = aoSkip.map((m) => m.visible);
      aoSkip.forEach((m) => { m.visible = false; });
      const bg = scene.background, fog = scene.fog;
      scene.background = null; scene.fog = null;
      scene.overrideMaterial = normalMat;
      renderer.setRenderTarget(preRT);
      renderer.clear();
      renderer.render(scene, camera);
      scene.overrideMaterial = null;
      scene.background = bg; scene.fog = fog;
      aoSkip.forEach((m, i) => { m.visible = was[i]; });
      aoMat.uniforms.tDepth.value = preRT.depthTexture;
      aoMat.uniforms.tNormal.value = preRT.texture;
      aoMat.uniforms.uProj.value.copy(camera.projectionMatrix);
      aoMat.uniforms.uInvProj.value.copy(camera.projectionMatrixInverse);
      pass(aoMat, aoRT);
      aoBlurMat.uniforms.tAO.value = aoRT.texture;
      aoBlurMat.uniforms.tDepth.value = preRT.depthTexture;
      aoBlurMat.uniforms.uInvProj.value.copy(camera.projectionMatrixInverse);
      pass(aoBlurMat, aoBlurRT);
      finalMat.uniforms.tAO.value = aoBlurRT.texture;
      finalMat.uniforms.uAO.value = aoStrength;
    } else {
      finalMat.uniforms.tAO.value = white;
      finalMat.uniforms.uAO.value = 0;
    }

    // ② 밝은 부분
    brightMat.uniforms.tSrc.value = sceneRT.texture;
    pass(brightMat, brightRT);

    // ③ 블러 2회(가로→세로 ×2)
    let src = brightRT;
    for (let i = 0; i < 2; i++) {
      blurMat.uniforms.tSrc.value = src.texture;
      blurMat.uniforms.uDir.value.set(1, 0);
      pass(blurMat, blurA);
      blurMat.uniforms.tSrc.value = blurA.texture;
      blurMat.uniforms.uDir.value.set(0, 1);
      pass(blurMat, blurB);
      src = blurB;
    }

    // ④ 합성 → 화면
    finalMat.uniforms.tScene.value = sceneRT.texture;
    finalMat.uniforms.tBloom.value = src.texture;
    pass(finalMat, null);
  }

  /** 저사양 기기용 — 블룸을 끄고 그레인만 남긴다 */
  function setQuality(low) {
    finalMat.uniforms.uBloom.value = low ? 0.0 : 0.58;
    finalMat.uniforms.uAber.value = low ? 0.0006 : 0.0011;
    // 저해상도 기기에서는 입자를 더 크게(작은 화면에서 픽셀 노이즈로 보이지 않게)
    finalMat.uniforms.uGrainSize.value = low ? 2.4 : 1.7;
  }

  setSize(renderer.domElement.clientWidth || 1, renderer.domElement.clientHeight || 1);
  // target — 사전 컴파일(museum3d precompileAll)이 실제 렌더와 같은 출력(선형)으로 셰이더를 만들게
  return { render, setSize, setQuality, enableAO, uniforms: finalMat.uniforms, target: sceneRT, hasAO: useAO };
}
