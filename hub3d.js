// Interactive 3D hub-centre vs telescopic-fork explainer.
// Model: "Cafe racer motorcycle" by Innerscene (CC0). Its stock forks are used for fork mode;
// the hub-centre front end is added here. three.js loads only when #hub nears the viewport.
// If WebGL2 or loading fails, the 2D SVG explainer stays.
const hx = document.querySelector('.hx'), view = hx && hx.querySelector('.hx-view');
const RM = matchMedia('(prefers-reduced-motion: reduce)');
function webgl2() { try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; } }
if (view && webgl2() && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); boot(); } }, { rootMargin: '500px 0px' });
  io.observe(view);
}

let loadEl;
function progress(p) {
  if (!loadEl) { loadEl = document.createElement('div'); loadEl.className = 'hx-load'; loadEl.setAttribute('aria-hidden', 'true'); loadEl.innerHTML = '<span>Loading 3D model</span><i><b></b></i>'; view.appendChild(loadEl); }
  loadEl.querySelector('b').style.transform = `scaleX(${Math.max(0.04, Math.min(1, p))})`;
}
async function boot() {
  progress(0.02);
  try {
    const [THREE, { OrbitControls }, { RoomEnvironment }, { GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
      import('three'), import('three/addons/controls/OrbitControls.js'), import('three/addons/environments/RoomEnvironment.js'),
      import('three/addons/loaders/GLTFLoader.js'), import('three/addons/libs/meshopt_decoder.module.js')]);
    progress(0.15);
    const small = innerWidth < 700 || (navigator.deviceMemory && navigator.deviceMemory <= 4);
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(`/models/cafe-racer-${small ? 512 : 1024}.glb`, e => { if (e.total) progress(0.15 + 0.8 * e.loaded / e.total); });
    progress(1);
    build(THREE, OrbitControls, RoomEnvironment, gltf);
  } catch (err) { console.warn('3D explainer unavailable, keeping 2D diagram.', err); hx.classList.remove('hx3d'); }
  if (loadEl) { loadEl.classList.add('done'); setTimeout(() => loadEl && loadEl.remove(), 500); }
}

function build(THREE, OrbitControls, RoomEnvironment, gltf) {
  const { Vector3, Group, Mesh } = THREE;
  const small = innerWidth < 700, seg = n => Math.max(8, Math.round(n * (small ? 0.6 : 1)));
  const disposables = new Set(), track = o => (disposables.add(o), o);

  // Renderer
  const canvas = document.createElement('canvas');
  canvas.className = 'hx-canvas'; canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', '3D model of a classic motorcycle. Drag to rotate. Use the buttons to switch front end and apply the brake.');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.setClearColor(0x2b2d31, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true; // shadows re-render only when the chassis moves

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04); pmrem.dispose();
  scene.environment = envRT.texture; scene.environmentIntensity = 0.9;
  scene.add(new THREE.HemisphereLight(0xfff1dc, 0x1b1c1f, 0.5));
  const sun = new THREE.DirectionalLight(0xfff4e6, 2.4);
  sun.position.set(1.4, 3.4, 2.0); sun.castShadow = true;
  const sm = small ? 1024 : 1536; sun.shadow.mapSize.set(sm, sm);
  Object.assign(sun.shadow.camera, { left: -1.3, right: 1.3, top: 1.3, bottom: -1.3, near: 1, far: 7 });
  sun.shadow.radius = 5; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.015;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xe2ad5b, 0.8); rim.position.set(-2, 1.2, -1.6); scene.add(rim);
  const ground = new Mesh(track(new THREE.CircleGeometry(2.4, 64)), track(new THREE.ShadowMaterial({ opacity: 0.45 })));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  // ---- Model: named groups were split offline (see build notes in CREDITS.md)
  const model = gltf.scene, part = n => model.getObjectByName(n);
  const matByName = {};
  model.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = true; o.receiveShadow = true;
    const m = o.material; matByName[m.name.replace('Original ', '')] = m;
    if (m.transmission) { m.userData.glass = true; m.transmission = 0; m.transparent = true; m.opacity = 0.35; m.depthWrite = false; } // no transmission pass (perf)
  });
  const steel = matByName['polished steel'], alu = matByName['brushed aluminium'], iron = matByName['black finished iron'], rubber = matByName['dark rubber'];

  // Layout (metres, model space): bike along +X
  const FA = new Vector3(0.725, 0.325, 0), RA = new Vector3(-0.705, 0.325, 0), HS = new Vector3(0.5, 0.885, 0);
  // Pitch about a point chosen so the steering head moves along the fork axis (stanchions slide, not shear)
  const PIV = new Vector3(-0.89, 0, 0);
  const bike = new Group(); bike.position.x = -0.08; scene.add(bike);
  const chassisPivot = new Group(); chassisPivot.position.copy(PIV); bike.add(chassisPivot);
  const chassis = new Group(); chassis.position.copy(PIV).negate(); chassisPivot.add(chassis);
  const unsprung = new Group(); bike.add(unsprung);
  const addTo = (parent, o) => { parent.add(o); return o; };
  // Pivoted sub-groups for spinning wheels
  function spinner(parent, centre) { const g = new Group(); g.position.copy(centre); parent.add(g); return g; }
  const fSpin = spinner(unsprung, FA), rSpin = spinner(chassis, RA);
  const reparent = (name, parent, offset) => { const o = part(name); if (!o) return null; o.position.sub(offset || new Vector3()); parent.add(o); return o; };
  reparent('chassis', chassis); reparent('rearSpin', rSpin, RA);
  reparent('frontSpin', fSpin, FA); const rotor = reparent('frontRotor', fSpin, FA);
  reparent('mudguard', unsprung); reparent('frontAxle', unsprung);

  // Mode groups anchored at the front axle so they can scale in place
  function anchored(parent) { const a = new Group(); a.position.copy(FA); const g = new Group(); g.position.copy(FA).negate(); a.add(g); parent.add(a); return { a, g }; }
  const modes = { fork: { c: anchored(chassis), u: anchored(unsprung), mats: [], halos: [] }, hub: { c: anchored(chassis), u: anchored(unsprung), mats: [], halos: [] } };
  // Each mode owns material clones so it can fade independently
  const own = (md, root) => { const cache = new Map(); root.traverse(o => { if (!o.isMesh) return; if (!cache.has(o.material)) { const c = track(o.material.clone()); cache.set(o.material, c); md.mats.push(c); } o.material = cache.get(o.material); }); return root; };
  const forkSprung = reparent('forkSprung', modes.fork.c.g), forkUnsprung = reparent('forkUnsprung', modes.fork.u.g), forkCal = reparent('frontCaliper', modes.fork.u.g);
  own(modes.fork, forkSprung); own(modes.fork, forkUnsprung); own(modes.fork, forkCal);

  // ---- Helpers for added parts
  const add = (parent, geo, mat, x = 0, y = 0, z = 0) => { const m = new Mesh(track(geo), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
  const Yax = new Vector3(0, 1, 0), tmpV = new Vector3();
  const unitCyl = (r1, r2 = r1) => track(new THREE.CylinderGeometry(r1, r2, 1, seg(24)));
  function placeRod(m, a, b) { tmpV.subVectors(b, a); const len = tmpV.length(); m.position.copy(a).addScaledVector(tmpV, 0.5); m.quaternion.setFromUnitVectors(Yax, tmpV.normalize()); m.scale.set(1, len, 1); }
  function rod(parent, geo, mat, a, b) { const m = new Mesh(geo, mat); m.castShadow = true; placeRod(m, a, b); parent.add(m); return m; }
  const haloTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,220,160,1)'); gr.addColorStop(0.3, 'rgba(226,173,91,0.45)'); gr.addColorStop(1, 'rgba(226,173,91,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return track(t);
  })();
  const halos = [];
  function pivot(md, parent, p, r = 0.014) {
    const gm = track(new THREE.MeshStandardMaterial({ color: 0xe2ad5b, emissive: 0xe2ad5b, emissiveIntensity: 2.4, roughness: 0.3 })); md.mats.push(gm);
    add(parent, new THREE.SphereGeometry(r, 16, 12), gm, p.x, p.y, p.z).castShadow = false;
    const s = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: haloTex, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true })));
    s.position.copy(p); s.renderOrder = 5; s.userData.base = r * 6; parent.add(s); halos.push(s); md.halos.push(s);
  }

  // ---- FORK mode pivots: the steering head, high above the wheel
  pivot(modes.fork, modes.fork.c.g, new Vector3(HS.x, HS.y + 0.075, 0.035));
  pivot(modes.fork, modes.fork.c.g, new Vector3(HS.x, HS.y - 0.075, 0.035));

  // ---- HUB mode: front swinging arms, drag link, king-pin inside the hub, outer hub with twin discs
  const H = modes.hub, hm = { steel: track(steel.clone()), alu: track(alu.clone()), iron: track(iron.clone()), rubber: track(rubber.clone()) };
  H.mats.push(...Object.values(hm));
  const ARM = new Vector3(0.2, 0.27, 0), AZ = 0.118;
  const hubParts = {};
  // frame-side pivot bosses (sprung)
  for (const z of [-AZ, AZ]) { const b = add(H.c.g, new THREE.CylinderGeometry(0.026, 0.026, 0.04, seg(24)), hm.iron, ARM.x, ARM.y, z); b.rotation.x = Math.PI / 2; }
  rod(H.c.g, unitCyl(0.012), hm.steel, ARM.clone().setZ(-AZ - 0.03), ARM.clone().setZ(AZ + 0.03)); // pivot spindle
  rod(H.c.g, unitCyl(0.014), hm.iron, new Vector3(0.36, 0.52, 0), ARM.clone().setZ(0)); // mounting strut to frame
  pivot(H, H.c.g, ARM.clone().setZ(AZ + 0.035)); pivot(H, H.c.g, ARM.clone().setZ(-AZ - 0.035));
  // swinging arms (unsprung end at hub): tapered, updated each frame
  hubParts.arms = [-AZ, AZ].map(z => rod(H.u.g, unitCyl(0.017, 0.022), hm.iron, ARM.clone().setZ(z), FA.clone().setZ(z)));
  // dampers from arm to frame
  // king-pin carrier (does not spin): slightly raked king-pin through the hub centre
  const kp = new Group(); kp.position.copy(FA); kp.rotation.z = -0.1; H.u.g.add(kp);
  add(kp, new THREE.CylinderGeometry(0.011, 0.011, 0.22, seg(20)), hm.steel);
  for (const y of [-0.1, 0.1]) add(kp, new THREE.CylinderGeometry(0.018, 0.018, 0.018, seg(20)), hm.alu, 0, y, 0);
  pivot(H, kp, new Vector3(0, 0.117, 0)); pivot(H, kp, new Vector3(0, -0.117, 0));
  for (const s of [-1, 1]) add(kp, new THREE.BoxGeometry(0.05, 0.03, 0.06), hm.iron, 0, 0, s * 0.09); // stub-axle yokes out to the arms
  const sArm = add(kp, new THREE.BoxGeometry(0.11, 0.016, 0.018), hm.iron, -0.045, 0.1, 0.095); sArm.rotation.z = 0.55; // steering arm
  hubParts.armTipLocal = new Vector3(-0.09, 0.13, 0.095);
  pivot(H, kp, hubParts.armTipLocal.clone(), 0.01);
  // outer hub shell (lathe profile with spoke flanges) + twin discs: spin with the wheel
  const hubShell = new Group(); fSpin.add(hubShell);
  const prof = [[0.03, -0.075], [0.06, -0.075], [0.075, -0.066], [0.075, -0.05], [0.064, -0.045], [0.07, -0.03], [0.07, 0.03], [0.064, 0.045], [0.075, 0.05], [0.075, 0.066], [0.06, 0.075], [0.03, 0.075]].map(([r, y]) => new THREE.Vector2(r, y));
  const shell = add(hubShell, new THREE.LatheGeometry(prof, seg(48)), hm.alu); shell.rotation.x = Math.PI / 2;
  for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; const fin = add(hubShell, new THREE.BoxGeometry(0.004, 0.012, 0.09), hm.alu, Math.cos(a) * 0.073, Math.sin(a) * 0.073, 0); fin.rotation.z = a; }
  const mirR = new Group(); mirR.scale.z = -1; hubShell.add(mirR); const rotor2 = rotor.clone(); own(H, rotor2); mirR.add(rotor2); // mirrored second disc
  // calipers on both sides, hung from the carrier
  const calB = forkCal.clone(), calC = forkCal.clone(), mirC = new Group(); mirC.scale.z = -1;
  H.u.g.add(calB, mirC); mirC.add(calC); own(H, calB); own(H, calC);
  // drag link from the handlebar column's drop arm to the steering arm
  const DROP = new Vector3(0.53, 0.76, 0.1);
  rod(H.c.g, unitCyl(0.013), hm.steel, new Vector3(HS.x, HS.y - 0.08, 0), new Vector3(HS.x + 0.01, HS.y + 0.07, 0)); // column through the head
  rod(H.c.g, unitCyl(0.012, 0.009), hm.iron, new Vector3(HS.x, HS.y - 0.085, 0), DROP); // drop arm
  pivot(H, H.c.g, DROP, 0.011);
  hubParts.link = rod(H.u.g, unitCyl(0.007), hm.steel, DROP, FA);
  // mudguard stays from the carrier
  for (const z of [-0.075, 0.075]) rod(H.u.g, unitCyl(0.006), hm.iron, new Vector3(FA.x - 0.01, FA.y + 0.09, z), new Vector3(0.7, 0.64, z));

  const wc = v => bike.worldToLocal(chassis.localToWorld(v.clone())); // chassis-local -> bike-local
  modes.fork.force = () => [new Vector3(FA.x, 0.004, 0.16), FA.clone().setZ(0.16), wc(HS).setZ(0.16), wc(new Vector3(0.05, 0.86, 0)).setZ(0.16)];
  modes.hub.force = () => [new Vector3(FA.x, 0.004, 0.16), FA.clone().setZ(0.16), wc(ARM).setZ(0.16), wc(new Vector3(-0.1, 0.28, 0)).setZ(0.16)];

  // Force path: dashed line + travelling particles, always drawn on top
  const PN = small ? 14 : 18;
  const fLineGeo = track(new THREE.BufferGeometry()); fLineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
  const fLineMat = track(new THREE.LineDashedMaterial({ color: 0xffb0a8, dashSize: 0.035, gapSize: 0.022, transparent: true, opacity: 0, depthTest: false }));
  const fLine = new THREE.Line(fLineGeo, fLineMat); fLine.frustumCulled = false; fLine.renderOrder = 10; bike.add(fLine);
  const pMat = track(new THREE.MeshBasicMaterial({ color: 0xffc2b8, transparent: true, opacity: 0, depthTest: false }));
  const parts = new THREE.InstancedMesh(track(new THREE.SphereGeometry(0.009, 10, 8)), pMat, PN); parts.frustumCulled = false; parts.renderOrder = 11; bike.add(parts);

  // Camera + controls
  const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.05, 30);
  const controls = new OrbitControls(camera, canvas);
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, enablePan: false, enableZoom: false, minDistance: 1.1, maxDistance: 5,
    minPolarAngle: 0.35, maxPolarAngle: 1.5, rotateSpeed: 0.7, autoRotateSpeed: 0.5 });
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE };
  const VIEW = { fork: { t: new Vector3(0.32, 0.5, 0), d: 2.5 }, hub: { t: new Vector3(0.45, 0.47, 0), d: 2.35 } };
  const dir0 = new Vector3(1.0, 0.32, 1.05).normalize();
  let distScale = 1;

  // Mount
  view.appendChild(canvas);
  const hint = document.createElement('div'); hint.className = 'hx-hint'; hint.setAttribute('aria-hidden', 'true');
  const coarse = matchMedia('(any-pointer: coarse)').matches;
  const done = document.createElement('button'); done.type = 'button'; done.className = 'hx-done'; done.textContent = 'Done'; done.hidden = true;
  view.append(hint, done);

  // Touch lock: page scroll is never trapped. A tap unlocks rotate/pinch; Done, a tap outside or scrolling away relocks.
  let locked = true;
  function setLock(v) {
    locked = v; canvas.style.touchAction = v ? 'pan-y' : 'none'; done.hidden = v || !coarse; view.classList.toggle('unlocked', !v);
    hint.textContent = v ? (coarse ? 'Tap to rotate' : 'Drag to rotate · click, then scroll to zoom') : (coarse ? 'Drag to rotate · pinch to zoom' : 'Scroll to zoom');
    if (v) controls.enableZoom = false;
  }
  let tap = null;
  const onDownCap = e => {
    if (e.pointerType === 'mouse' || e.pointerType === 'pen') { if (e.target === canvas) { controls.enableZoom = true; if (!coarse) setLock(false); } return; }
    if (e.target === done) return;
    if (locked) { tap = { x: e.clientX, y: e.clientY, t: performance.now() }; e.stopPropagation(); }
  };
  const onUpCap = e => {
    if (e.pointerType !== 'touch' || !locked || !tap) return;
    const ok = Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 12 && performance.now() - tap.t < 500; tap = null;
    e.stopPropagation(); if (ok && e.target === canvas) { setLock(false); controls.enableZoom = true; pauseAuto(); }
  };
  const onWheelCap = e => { controls.enableZoom = !locked || e.ctrlKey; };
  const onLeave = e => { if (e.pointerType === 'mouse') { controls.enableZoom = false; if (!coarse) setLock(true); } };
  const onDocDown = e => { if (!locked && !hx.contains(e.target)) setLock(true); };
  done.addEventListener('click', () => setLock(true));
  view.addEventListener('pointerdown', onDownCap, true); view.addEventListener('pointerup', onUpCap, true);
  view.addEventListener('wheel', onWheelCap, { capture: true, passive: true }); canvas.addEventListener('pointerleave', onLeave);
  document.addEventListener('pointerdown', onDocDown, true);
  setLock(true);

  // Auto-rotate pauses on interaction, resumes 3s after
  let idleT = 0;
  const pauseAuto = () => { controls.autoRotate = false; clearTimeout(idleT); };
  const resumeAuto = () => { clearTimeout(idleT); idleT = setTimeout(() => { controls.autoRotate = !RM.matches; }, 3000); };
  controls.addEventListener('start', pauseAuto); controls.addEventListener('end', resumeAuto);
  controls.autoRotate = !RM.matches;

  // State from the existing buttons (data attributes on .hx, managed by the inline explainer script)
  let mode = hx.dataset.mode || 'fork', braking = hx.dataset.brake === '1';
  let mix = mode === 'hub' ? 1 : 0, brakeV = braking ? 1 : 0, wheelSpeed = braking ? 0 : 1, flowT = 0;
  const mo = new MutationObserver(() => { mode = hx.dataset.mode; braking = hx.dataset.brake === '1'; wake(); });
  mo.observe(hx, { attributes: true, attributeFilter: ['data-mode', 'data-brake'] });

  function applyMix(m) {
    for (const [k, w] of [['fork', 1 - m], ['hub', m]]) {
      const md = modes[k], vis = w > 0.002, s = 0.92 + 0.08 * w, fading = w < 0.999;
      md.c.a.visible = md.u.a.visible = vis; md.c.a.scale.setScalar(s); md.u.a.scale.setScalar(s);
      for (const mat of md.mats) { mat.transparent = fading || mat.userData.glass; mat.opacity = w; mat.depthWrite = !fading || w > 0.5; }
      for (const h of md.halos) h.material.opacity = w;
    }
    hubShell.visible = m > 0.002; hubShell.scale.setScalar(0.92 + 0.08 * m);
  }
  applyMix(mix);

  // Resize
  function resize() {
    const w = view.clientWidth, h = view.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    distScale = camera.aspect < 1.5 ? 1.12 : 1;
  }
  const ro = new ResizeObserver(resize); ro.observe(view); resize();
  controls.target.copy(VIEW[mode].t); camera.position.copy(VIEW[mode].t).addScaledVector(dir0, VIEW[mode].d * distScale);

  // Render only when on screen and the tab is visible
  let onScreen = true, running = false;
  const clock = new THREE.Clock();
  const vio = new IntersectionObserver(es => { onScreen = es[0].isIntersecting; if (!onScreen && !locked) setLock(true); wake(); }, { threshold: 0.01 });
  vio.observe(view);
  const onVis = () => wake(); document.addEventListener('visibilitychange', onVis);
  function wake() { const want = onScreen && !document.hidden; if (want !== running) { running = want; renderer.setAnimationLoop(want ? frame : null); clock.getDelta(); } }

  const ease = t => 1 - Math.pow(1 - t, 3);
  const off = new Vector3(), q = new THREE.Quaternion(), m4 = new THREE.Matrix4(), pS = new Vector3(), pP = new Vector3(), a = new Vector3(), b = new Vector3();
  let brakeP = brakeV, camT = 1, camFrom = null, lastMode = mode, frames = 0, fpsT = 0;
  const api = window.__hub3d = { fps: 0, ready: true, dispose, state: () => ({ mix, brake: +brakeV.toFixed(3), pitchDeg: +(-THREE.MathUtils.radToDeg(chassisPivot.rotation.z)).toFixed(2), wheelSpeed: +wheelSpeed.toFixed(2), locked, autoRotate: controls.autoRotate, touchAction: canvas.style.touchAction }) };
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05), rm = RM.matches;
    const mTarget = mode === 'hub' ? 1 : 0;
    if (mix !== mTarget) { mix = rm ? mTarget : (mTarget > mix ? Math.min(mTarget, mix + dt / 0.6) : Math.max(mTarget, mix - dt / 0.6)); applyMix(mix); }
    if (mode !== lastMode) { lastMode = mode; camFrom = { t: controls.target.clone(), d: camera.position.distanceTo(controls.target) }; camT = 0; }
    if (camFrom) {
      camT = rm ? 1 : Math.min(1, camT + dt / 0.6); const e = ease(camT), v = VIEW[mode];
      off.subVectors(camera.position, controls.target).normalize();
      controls.target.lerpVectors(camFrom.t, v.t, e);
      camera.position.copy(controls.target).addScaledVector(off, THREE.MathUtils.lerp(camFrom.d, v.d * distScale, e));
      if (camT >= 1) camFrom = null;
    }
    // Brake: 0.45s ease-out on, ease back on release. Pitch angles are illustrative.
    const bT = braking ? 1 : 0;
    brakeP = rm ? bT : (bT > brakeP ? Math.min(1, brakeP + dt / 0.45) : Math.max(0, brakeP - dt / 0.45));
    brakeV = braking ? ease(brakeP) : 1 - ease(1 - brakeP);
    const pz = -THREE.MathUtils.degToRad(4.5 * (1 - mix) + 0.4 * mix) * brakeV;
    if (pz !== chassisPivot.rotation.z || camFrom || (mix > 0 && mix < 1)) renderer.shadowMap.needsUpdate = true;
    chassisPivot.rotation.z = pz;
    // Wheels: idle spin, front stops when braking
    wheelSpeed += ((braking ? 0 : 1) - wheelSpeed) * Math.min(1, dt * (braking ? 9 : 2.5));
    const spinA = rm ? 0 : -dt * 3.0;
    fSpin.rotation.z += spinA * wheelSpeed; rSpin.rotation.z += spinA * (0.35 + 0.65 * wheelSpeed);
    // Hub linkage follows the (slightly pitching) chassis
    if (H.u.a.visible) {
      const ug = H.u.g, toU = v => ug.worldToLocal(chassis.localToWorld(v.clone()));
      for (const arm of hubParts.arms) placeRod(arm, toU(ARM.clone().setZ(arm.position.z)), FA.clone().setZ(arm.position.z));
      kp.updateMatrixWorld(); const tip = ug.worldToLocal(kp.localToWorld(hubParts.armTipLocal.clone()));
      placeRod(hubParts.link, toU(DROP), tip);
    }
    const pulse = rm ? 1 : 1 + 0.15 * Math.sin(performance.now() / 420);
    for (const h of halos) h.scale.setScalar(h.userData.base * pulse);
    // Force path
    const fA = Math.min(1, brakeV * 1.4);
    fLineMat.opacity = pMat.opacity = fA * 0.95; fLine.visible = parts.visible = fA > 0.01;
    if (fLine.visible) {
      const path = (mix < 0.5 ? modes.fork : modes.hub).force();
      const pos = fLineGeo.attributes.position; path.forEach((p, i) => pos.setXYZ(i, p.x, p.y, p.z)); pos.needsUpdate = true; fLine.computeLineDistances();
      const lens = [0]; for (let i = 1; i < path.length; i++) lens.push(lens[i - 1] + path[i].distanceTo(path[i - 1]));
      const L = lens[lens.length - 1]; if (!rm) flowT = (flowT + dt * 0.45) % 1;
      for (let i = 0; i < PN; i++) {
        const d = ((i / PN + flowT) % 1) * L; let s = 1; while (s < lens.length - 1 && lens[s] < d) s++;
        pP.lerpVectors(path[s - 1], path[s], (d - lens[s - 1]) / (lens[s] - lens[s - 1] || 1));
        pS.setScalar(fA * (rm ? 0.8 : 0.7 + 0.5 * Math.sin((i / PN) * Math.PI)));
        parts.setMatrixAt(i, m4.compose(pP, q.identity(), pS));
      }
      parts.instanceMatrix.needsUpdate = true;
    }
    controls.update(dt);
    renderer.render(scene, camera);
    frames++; const now = performance.now(); if (!fpsT) fpsT = now; if (now - fpsT >= 1000) { api.fps = Math.round(frames * 1000 / (now - fpsT)); frames = 0; fpsT = now; }
  }

  function dispose() {
    renderer.setAnimationLoop(null); running = false; clearTimeout(idleT);
    ro.disconnect(); vio.disconnect(); mo.disconnect(); controls.dispose();
    view.removeEventListener('pointerdown', onDownCap, true); view.removeEventListener('pointerup', onUpCap, true);
    view.removeEventListener('wheel', onWheelCap, true); canvas.removeEventListener('pointerleave', onLeave);
    document.removeEventListener('pointerdown', onDocDown, true); document.removeEventListener('visibilitychange', onVis);
    scene.traverse(o => {
      if (o.geometry) disposables.add(o.geometry);
      for (const m of [].concat(o.material || [])) { disposables.add(m); for (const k in m) if (m[k] && m[k].isTexture) disposables.add(m[k]); }
    });
    disposables.forEach(d => d.dispose && d.dispose()); envRT.dispose(); renderer.dispose();
    canvas.remove(); hint.remove(); done.remove(); hx.classList.remove('hx3d'); api.ready = false;
  }
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); dispose(); });
  addEventListener('pagehide', e => { if (!e.persisted) dispose(); });

  wake(); renderer.render(scene, camera);
  hx.classList.add('hx3d');
}
