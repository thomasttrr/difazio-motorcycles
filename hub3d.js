// Interactive 3D hub-centre vs telescopic-fork explainer.
// Loads three.js only when #hub nears the viewport. If WebGL2 or the import fails, the 2D SVG explainer stays.
const hx = document.querySelector('.hx'), view = hx && hx.querySelector('.hx-view');
const RM = matchMedia('(prefers-reduced-motion: reduce)');
function webgl2() { try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; } }
if (view && webgl2() && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); boot(); } }, { rootMargin: '400px 0px' });
  io.observe(view);
}
async function boot() {
  try {
    const [THREE, { OrbitControls }, { RoomEnvironment }] = await Promise.all([
      import('three'), import('three/addons/controls/OrbitControls.js'), import('three/addons/environments/RoomEnvironment.js')]);
    build(THREE, OrbitControls, RoomEnvironment);
  } catch (err) { console.warn('3D explainer unavailable, keeping 2D diagram.', err); hx.classList.remove('hx3d'); }
}

function build(THREE, OrbitControls, RoomEnvironment) {
  const { Vector3, Group, Mesh } = THREE;
  const small = innerWidth < 700, Q = small ? 0.6 : 1; // geometry detail factor
  const seg = n => Math.max(6, Math.round(n * Q));
  const disposables = new Set(), track = o => (disposables.add(o), o);

  // Renderer
  const canvas = document.createElement('canvas');
  canvas.className = 'hx-canvas'; canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', '3D model of a motorcycle front end. Drag to rotate. Use the buttons to switch front end and apply the brake.');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.setClearColor(0x2b2d31, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04); pmrem.dispose();
  scene.environment = envRT.texture; scene.environmentIntensity = 0.55;
  scene.add(new THREE.HemisphereLight(0xfff1dc, 0x1b1c1f, 0.9));
  const sun = new THREE.DirectionalLight(0xfff4e6, 2.2);
  sun.position.set(1.6, 3.2, 2.2); sun.castShadow = true;
  const sm = small ? 512 : 1024; sun.shadow.mapSize.set(sm, sm);
  Object.assign(sun.shadow.camera, { left: -1.4, right: 1.4, top: 1.4, bottom: -1.4, near: 0.5, far: 8 });
  sun.shadow.radius = 4; sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const ground = new Mesh(track(new THREE.CircleGeometry(2.6, 48)), track(new THREE.ShadowMaterial({ opacity: 0.38 })));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  // Materials (each mode gets its own copies so they can fade independently)
  const baseMats = () => ({
    gold: new THREE.MeshStandardMaterial({ color: 0xe2ad5b, metalness: 0.85, roughness: 0.32 }),
    seat: new THREE.MeshStandardMaterial({ color: 0x1f2023, metalness: 0, roughness: 0.75 }),
    metal: new THREE.MeshStandardMaterial({ color: 0xd9d4cc, metalness: 0.9, roughness: 0.22 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x3a3c40, metalness: 0.6, roughness: 0.45 }),
    tyre: new THREE.MeshStandardMaterial({ color: 0x53575e, metalness: 0, roughness: 0.9 }),
    disc: new THREE.MeshStandardMaterial({ color: 0x9a968f, metalness: 0.8, roughness: 0.35 }),
    glow: new THREE.MeshStandardMaterial({ color: 0xe2ad5b, emissive: 0xe2ad5b, emissiveIntensity: 2.2, roughness: 0.4 }),
  });
  const M = baseMats(), MM = { fork: baseMats(), hub: baseMats() };
  [M, MM.fork, MM.hub].forEach(s => Object.values(s).forEach(track));

  // Geometry helpers
  const add = (parent, geo, mat, x = 0, y = 0, z = 0, shadow = true) => {
    const m = new Mesh(track(geo), mat); m.position.set(x, y, z); m.castShadow = shadow; parent.add(m); return m;
  };
  const Y = new Vector3(0, 1, 0), tmpV = new Vector3();
  // Unit cylinder (height 1 along Y) re-oriented between two points
  const unitCyl = r => track(new THREE.CylinderGeometry(r, r, 1, seg(16)));
  function rod(parent, geo, mat, a, b) { const m = new Mesh(geo, mat); m.castShadow = true; placeRod(m, a, b); parent.add(m); return m; }
  function placeRod(m, a, b) {
    tmpV.subVectors(b, a); const len = tmpV.length();
    m.position.copy(a).addScaledVector(tmpV, 0.5); m.quaternion.setFromUnitVectors(Y, tmpV.normalize()); m.scale.set(1, len, 1);
  }
  const tube = (parent, pts, r, mat) => add(parent, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new Vector3(...p))), seg(48), r, seg(12)), mat);

  // Glow halo sprite (cheap stand-in for bloom)
  const haloTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,214,150,0.9)'); gr.addColorStop(0.35, 'rgba(226,173,91,0.35)'); gr.addColorStop(1, 'rgba(226,173,91,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return track(t);
  })();
  const halos = [];
  function pivot(parent, mats, x, y, z, r = 0.022) {
    add(parent, new THREE.SphereGeometry(r, seg(16), seg(12)), mats.glow, x, y, z, false);
    const sMat = track(new THREE.SpriteMaterial({ map: haloTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    const s = new THREE.Sprite(sMat); s.position.set(x, y, z); s.scale.setScalar(r * 7); s.userData.base = r * 7; parent.add(s); halos.push(s); return s;
  }

  // Wheel: tyre + rim + instanced spokes. Returns { group, spin }
  const R = 0.31, spokeN = small ? 16 : 28;
  function wheel(mats, hubR = 0.04) {
    const g = new Group(), spin = new Group(); g.add(spin);
    const ty = add(spin, new THREE.TorusGeometry(R - 0.035, 0.038, seg(16), seg(48)), M.tyre); ty.receiveShadow = true;
    add(spin, new THREE.TorusGeometry(R - 0.07, 0.008, seg(8), seg(48)), M.metal);
    const sp = new THREE.InstancedMesh(track(new THREE.CylinderGeometry(0.0025, 0.0025, 1, 4)), M.metal, spokeN);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new Vector3(), p = new Vector3(), a = new Vector3(), b = new Vector3();
    for (let i = 0; i < spokeN; i++) {
      const t = (i / spokeN) * Math.PI * 2, side = i % 2 ? 1 : -1;
      a.set(Math.cos(t + 0.12) * hubR, Math.sin(t + 0.12) * hubR, side * 0.035); b.set(Math.cos(t) * (R - 0.075), Math.sin(t) * (R - 0.075), side * 0.008);
      tmpV.subVectors(b, a); s.set(1, tmpV.length(), 1); p.copy(a).addScaledVector(tmpV, 0.5); q.setFromUnitVectors(Y, tmpV.normalize());
      sp.setMatrixAt(i, m4.compose(p, q, s));
    }
    sp.castShadow = true; spin.add(sp); return { group: g, spin };
  }

  // Layout (metres-ish): bike along +X, front axle at x=0.72, rear at -0.68, ground y=0.
  const FA = new Vector3(0.72, R, 0), RA = new Vector3(-0.68, R, 0), RC = new Vector3(-0.68, 0, 0);
  const bike = new Group(); scene.add(bike); bike.position.x = -0.02;
  // Chassis pitches about the rear contact patch
  const chassisPivot = new Group(); chassisPivot.position.copy(RC); bike.add(chassisPivot);
  const chassis = new Group(); chassis.position.copy(RC).negate(); chassisPivot.add(chassis);
  const unsprung = new Group(); bike.add(unsprung);

  // Shared chassis
  const HS = new Vector3(0.48, 0.86, 0); // headstock
  tube(chassis, [[0.48, 0.86, 0], [0.2, 0.84, 0], [-0.22, 0.76, 0], [-0.58, 0.7, 0]], 0.022, M.gold); // backbone
  for (const z of [-0.07, 0.07]) {
    tube(chassis, [[0.47, 0.8, z * 0.4], [0.33, 0.5, z], [0.24, 0.26, z], [-0.08, 0.2, z], [-0.22, 0.34, z], [-0.24, 0.62, z * 0.6]], 0.016, M.gold);
    tube(chassis, [[-0.22, 0.4, z], [-0.45, 0.55, z], [-0.62, 0.7, z * 0.5]], 0.012, M.gold);
    rod(chassis, unitCyl(0.016), M.metal, new Vector3(-0.22, 0.38, z * 1.4), new Vector3(RA.x, RA.y, z * 1.4)); // rear swingarm
    rod(chassis, unitCyl(0.018), M.dark, new Vector3(-0.5, R + 0.03, z * 1.6), new Vector3(-0.42, 0.68, z * 1.6)); // shock
  }
  const tank = add(chassis, new THREE.SphereGeometry(1, seg(32), seg(20)), M.gold, 0.16, 0.9, 0); tank.scale.set(0.27, 0.1, 0.13);
  const seat = add(chassis, new THREE.CapsuleGeometry(0.07, 0.42, seg(6), seg(16)), M.seat, -0.3, 0.84, 0);
  seat.rotation.z = Math.PI / 2 - 0.08; seat.scale.set(0.6, 1, 1.25);
  add(chassis, new THREE.BoxGeometry(0.34, 0.22, 0.22), M.dark, 0.02, 0.34, 0); // crankcase
  for (const z of [-1, 1]) { // boxer cylinders with fins
    const cyl = add(chassis, new THREE.CylinderGeometry(0.065, 0.065, 0.2, seg(20)), M.metal, 0.1, 0.38, z * 0.2); cyl.rotation.x = Math.PI / 2;
    for (let f = 0; f < (small ? 3 : 5); f++) { const fin = add(chassis, new THREE.CylinderGeometry(0.08, 0.08, 0.008, seg(20)), M.disc, 0.1, 0.38, z * (0.13 + f * 0.03)); fin.rotation.x = Math.PI / 2; }
    tube(chassis, [[0.16, 0.36, z * 0.27], [0.3, 0.2, z * 0.2], [0.05, 0.14, z * 0.17], [-0.5, 0.22, z * 0.17], [-0.82, 0.3, z * 0.17]], 0.018, M.metal); // exhaust
  }
  const lamp = add(chassis, new THREE.SphereGeometry(0.075, seg(24), seg(16), 0, Math.PI), M.metal, 0.6, 0.78, 0); lamp.rotation.y = Math.PI / 2;
  add(chassis, new THREE.CircleGeometry(0.07, seg(24)), new THREE.MeshStandardMaterial({ color: 0xfff6e0, emissive: 0xfff1d0, emissiveIntensity: 0.6 }), 0.6, 0.78, 0).rotation.y = Math.PI / 2;
  rod(chassis, unitCyl(0.01), M.metal, new Vector3(0.47, 0.84, 0), new Vector3(0.57, 0.78, 0)); // lamp bracket
  const rw = wheel(M); rw.group.position.copy(RA); chassis.add(rw.group);
  add(rw.group, new THREE.CylinderGeometry(0.05, 0.05, 0.11, seg(16)), M.metal).rotation.x = Math.PI / 2;
  const fw = wheel(M, 0.05); fw.group.position.copy(FA); unsprung.add(fw.group);

  // Mode groups, each anchored at the front axle so they can scale in place.
  function anchored(parent, local) { const a = new Group(); a.position.copy(local); const inner = new Group(); inner.position.copy(local).negate(); a.add(inner); parent.add(a); return { a, g: inner }; }
  const modes = {};
  for (const k of ['fork', 'hub']) modes[k] = { c: anchored(chassis, FA), u: anchored(unsprung, FA), mats: MM[k], halos: [] };

  // FORK: stanchions + clamps in chassis; sliders, disc and caliper unsprung.
  {
    const { c, u, mats } = modes.fork, h0 = halos.length;
    const axis = new Vector3().subVectors(FA, HS).normalize(); // headstock -> axle
    const top = HS.clone().addScaledVector(axis, -0.06);
    for (const z of [-0.085, 0.085]) {
      const off = new Vector3(0, 0, z);
      rod(c.g, unitCyl(0.017), mats.metal, top.clone().add(off), HS.clone().addScaledVector(axis, 0.42).add(off)); // stanchion
      rod(u.g, unitCyl(0.026), mats.dark, FA.clone().addScaledVector(axis, -0.29).add(off), FA.clone().addScaledVector(axis, 0.02).add(off)); // slider
    }
    for (const t of [-0.04, 0.07]) { const cl = add(c.g, new THREE.BoxGeometry(0.06, 0.03, 0.22), mats.gold, ...HS.clone().addScaledVector(axis, t).toArray()); cl.rotation.z = Math.atan2(axis.x, -axis.y); }
    rod(c.g, unitCyl(0.011), mats.metal, new Vector3(0.44, 0.97, -0.26), new Vector3(0.44, 0.97, 0.26)); // bars
    rod(c.g, unitCyl(0.011), mats.metal, new Vector3(0.44, 0.97, -0.05), HS.clone().addScaledVector(axis, -0.05));
    pivot(c.g, mats, HS.x, HS.y, 0, 0.03); pivot(c.g, mats, top.x, top.y + 0.01, 0, 0.018);
    const fs = new Group(); fs.position.copy(FA); u.g.add(fs);
    add(fs, new THREE.CylinderGeometry(0.15, 0.15, 0.006, seg(40)), mats.disc, 0, 0, -0.06).rotation.x = Math.PI / 2;
    add(fs, new THREE.CylinderGeometry(0.045, 0.045, 0.14, seg(16)), mats.metal).rotation.x = Math.PI / 2;
    const cal = add(u.g, new THREE.BoxGeometry(0.06, 0.09, 0.035), mats.gold, FA.x - 0.12, FA.y + 0.07, -0.06); cal.rotation.z = 0.6;
    modes.fork.spin = fs; modes.fork.halos = halos.slice(h0);
    modes.fork.force = () => [new Vector3(FA.x, 0.005, 0.12), FA.clone().setZ(0.12), wc(HS).setZ(0.12), wc(new Vector3(0.2, 0.84, 0)).setZ(0.12)];
  }
  // HUB: front swinging arm, steering linkage, king-pin inside the hub, outer hub with twin discs.
  const ARM = new Vector3(0.27, 0.36, 0); // arm pivot on frame (chassis-local)
  const hubParts = {};
  {
    const { c, u, mats } = modes.hub, h0 = halos.length;
    for (const z of [-0.13, 0.13]) { add(c.g, new THREE.CylinderGeometry(0.03, 0.03, 0.05, seg(16)), mats.gold, ARM.x, ARM.y, z).rotation.x = Math.PI / 2; }
    pivot(c.g, mats, ARM.x, ARM.y, 0.165, 0.022); pivot(c.g, mats, ARM.x, ARM.y, -0.165, 0.022);
    hubParts.arms = [-0.13, 0.13].map(z => rod(u.g, unitCyl(0.022), mats.metal, ARM.clone().setZ(z), FA.clone().setZ(z)));
    hubParts.rod = rod(u.g, unitCyl(0.009), mats.metal, new Vector3(0.5, 0.7, 0.16), new Vector3(0.66, 0.44, 0.16));
    hubParts.rodTop = new Vector3(0.47, 0.72, 0.16);
    rod(c.g, unitCyl(0.012), mats.metal, new Vector3(0.43, 0.96, -0.26), new Vector3(0.43, 0.96, 0.26)); // bars
    rod(c.g, unitCyl(0.014), mats.gold, new Vector3(0.43, 0.96, 0.0), new Vector3(0.47, 0.72, 0.0)); // steering column
    rod(c.g, unitCyl(0.01), mats.metal, new Vector3(0.47, 0.72, 0.0), hubParts.rodTop); // drop arm
    pivot(c.g, mats, hubParts.rodTop.x, hubParts.rodTop.y, hubParts.rodTop.z, 0.014);
    // king-pin: slightly raked, through the hub centre (does not spin)
    const kp = new Group(); kp.position.copy(FA); kp.rotation.z = -0.12; u.g.add(kp);
    add(kp, new THREE.CylinderGeometry(0.014, 0.014, 0.17, seg(12)), mats.glow, 0, 0, 0, false);
    pivot(kp, mats, 0, 0.09, 0, 0.02); pivot(kp, mats, 0, -0.09, 0, 0.02);
    add(kp, new THREE.BoxGeometry(0.03, 0.03, 0.28), mats.dark); // stub axle to arms
    const sa = add(kp, new THREE.BoxGeometry(0.12, 0.018, 0.02), mats.gold, -0.05, 0.11, 0.16); sa.rotation.z = 0.5; // steering arm
    hubParts.armTip = new Vector3(0.66, 0.44, 0.16);
    // outer hub shell + twin discs (spin)
    const hs = new Group(); hs.position.copy(FA); u.g.add(hs);
    const shell = add(hs, new THREE.CylinderGeometry(0.095, 0.095, 0.16, seg(32), 1, true), mats.gold); shell.rotation.x = Math.PI / 2;
    shell.material = track(mats.gold.clone()); shell.material.side = THREE.DoubleSide; mats.goldShell = shell.material;
    for (const z of [-0.085, 0.085]) {
      add(hs, new THREE.CylinderGeometry(0.155, 0.155, 0.006, seg(40)), mats.disc, 0, 0, z).rotation.x = Math.PI / 2;
      for (let i = 0; i < 6; i++) { const b = add(hs, new THREE.CylinderGeometry(0.008, 0.008, 0.01, 8), mats.dark, Math.cos(i * 1.047) * 0.11, Math.sin(i * 1.047) * 0.11, z); b.rotation.x = Math.PI / 2; }
      const cal = add(u.g, new THREE.BoxGeometry(0.035, 0.09, 0.03), mats.gold, FA.x - 0.06, FA.y + 0.13, z * 1.25); cal.rotation.z = 0.3;
    }
    modes.hub.spin = hs; modes.hub.halos = halos.slice(h0);
    modes.hub.force = () => [new Vector3(FA.x, 0.005, 0.2), FA.clone().setZ(0.2), wc(ARM).setZ(0.2), wc(new Vector3(-0.08, 0.2, 0)).setZ(0.2)];
  }
  // chassis-local -> bike-local (forces are drawn in bike space)
  function wc(v) { return bike.worldToLocal(chassis.localToWorld(v.clone())); }

  // Force path: line + travelling particles
  const PN = small ? 9 : 12;
  const fLineGeo = track(new THREE.BufferGeometry()); fLineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
  const fLineMat = track(new THREE.LineDashedMaterial({ color: 0xffb0a8, dashSize: 0.04, gapSize: 0.025, transparent: true, opacity: 0, depthTest: false }));
  const fLine = new THREE.Line(fLineGeo, fLineMat); fLine.frustumCulled = false; fLine.renderOrder = 10; bike.add(fLine);
  const pMat = track(new THREE.MeshBasicMaterial({ color: 0xffc2b8, transparent: true, opacity: 0, depthTest: false }));
  const parts = new THREE.InstancedMesh(track(new THREE.SphereGeometry(0.02, 12, 8)), pMat, PN); parts.frustumCulled = false; parts.renderOrder = 11; bike.add(parts);

  // Camera + controls
  const camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.05, 30);
  const controls = new OrbitControls(camera, canvas);
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, enablePan: false, enableZoom: false, minDistance: 1.6, maxDistance: 5,
    minPolarAngle: 0.35, maxPolarAngle: 1.48, rotateSpeed: 0.7, autoRotateSpeed: 0.55 });
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE };
  const VIEW = { fork: { t: new Vector3(0.28, 0.5, 0), d: 2.9 }, hub: { t: new Vector3(0.42, 0.42, 0), d: 2.6 } };
  const dir0 = new Vector3(1.05, 0.42, 1).normalize();
  let distScale = 1;
  controls.target.copy(VIEW.fork.t); camera.position.copy(VIEW.fork.t).addScaledVector(dir0, VIEW.fork.d);

  // Mount
  view.appendChild(canvas);
  const hint = document.createElement('div'); hint.className = 'hx-hint'; hint.setAttribute('aria-hidden', 'true');
  const coarse = matchMedia('(any-pointer: coarse)').matches, fine = matchMedia('(any-pointer: fine)').matches;
  const done = document.createElement('button'); done.type = 'button'; done.className = 'hx-done'; done.textContent = 'Done'; done.hidden = true;
  view.append(hint, done);

  // Touch lock: page scroll is never trapped. A tap unlocks rotate/pinch, Done / tap outside / scrolling away relocks.
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
  const onWheelCap = e => { if (!locked || e.ctrlKey) controls.enableZoom = true; else controls.enableZoom = false; };
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
      const md = modes[k], vis = w > 0.002, s = 0.9 + 0.1 * w;
      md.c.a.visible = md.u.a.visible = vis; md.c.a.scale.setScalar(s); md.u.a.scale.setScalar(s);
      const fading = w < 0.999;
      for (const mat of Object.values(md.mats)) { mat.transparent = fading; mat.opacity = w; mat.depthWrite = !fading || w > 0.5; }
      for (const h of md.halos) h.material.opacity = w;
      md.c.a.traverse(o => { if (o.isMesh) o.castShadow = w > 0.5; }); md.u.a.traverse(o => { if (o.isMesh) o.castShadow = w > 0.5; });
    }
  }
  applyMix(mix);

  // Resize
  function resize() {
    const w = view.clientWidth, h = view.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    distScale = camera.aspect < 1.5 ? 1.08 : 1;
  }
  const ro = new ResizeObserver(resize); ro.observe(view); resize();
  camera.position.copy(VIEW.fork.t).addScaledVector(dir0, VIEW.fork.d * distScale);

  // Visibility: render only when on screen and the tab is visible
  let onScreen = true;
  const vio = new IntersectionObserver(es => { onScreen = es[0].isIntersecting; if (!onScreen && !locked) setLock(true); wake(); }, { threshold: 0.01 });
  vio.observe(view);
  const onVis = () => wake(); document.addEventListener('visibilitychange', onVis);
  let running = false;
  function wake() { const want = onScreen && !document.hidden; if (want !== running) { running = want; renderer.setAnimationLoop(want ? frame : null); clock.getDelta(); } }

  const ease = t => 1 - Math.pow(1 - t, 3);
  const clock = new THREE.Clock(), off = new Vector3(), q = new THREE.Quaternion(), m4 = new THREE.Matrix4(), pS = new Vector3(), pP = new Vector3(), pts = [];
  let brakeP = brakeV, camT = 1, camFrom = null, lastMode = mode, frames = 0, fpsT = 0;
  const api = window.__hub3d = { fps: 0, ready: true, dispose, state: () => ({ mix, brake: +brakeV.toFixed(3), pitchDeg: +(-THREE.MathUtils.radToDeg(chassisPivot.rotation.z)).toFixed(2), wheelSpeed: +wheelSpeed.toFixed(2), locked, autoRotate: controls.autoRotate, touchAction: canvas.style.touchAction }) };
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05), rm = RM.matches;
    // mode crossfade (0.6s) + camera lerp
    const mTarget = mode === 'hub' ? 1 : 0;
    if (mix !== mTarget) { mix = rm ? mTarget : (mTarget > mix ? Math.min(mTarget, mix + dt / 0.6) : Math.max(mTarget, mix - dt / 0.6)); applyMix(mix); }
    if (mode !== lastMode) { lastMode = mode; camFrom = { t: controls.target.clone(), d: camera.position.distanceTo(controls.target) }; camT = rm ? 1 : 0; if (rm) camT = 0.999; }
    if (camFrom && camT < 1) {
      camT = Math.min(1, camT + dt / 0.6); const e = rm ? 1 : ease(camT), v = VIEW[mode];
      off.subVectors(camera.position, controls.target).normalize();
      controls.target.lerpVectors(camFrom.t, v.t, e);
      camera.position.copy(controls.target).addScaledVector(off, THREE.MathUtils.lerp(camFrom.d, v.d * distScale, e));
      if (camT >= 1) camFrom = null;
    }
    // brake: 0.45s ease-out on, ease back on release
    const bT = braking ? 1 : 0;
    brakeP = rm ? bT : (bT > brakeP ? Math.min(1, brakeP + dt / 0.45) : Math.max(0, brakeP - dt / 0.45));
    brakeV = braking ? ease(brakeP) : 1 - ease(1 - brakeP);
    const deg = 4.5 * (1 - mix) + 0.4 * mix; // illustrative pitch angles
    chassisPivot.rotation.z = -THREE.MathUtils.degToRad(deg) * brakeV;
    // wheels: idle spin; front stops when braking
    wheelSpeed += ((braking ? 0 : 1) - wheelSpeed) * Math.min(1, dt * (braking ? 9 : 2.5));
    const spinA = rm ? 0 : -dt * 3.2;
    fw.spin.rotation.z += spinA * wheelSpeed; modes.fork.spin.rotation.z = modes.hub.spin.rotation.z = fw.spin.rotation.z;
    rw.spin.rotation.z += spinA * (0.35 + 0.65 * wheelSpeed);
    // hub linkage follows the (slightly pitching) chassis
    if (modes.hub.u.a.visible) {
      const ug = modes.hub.u.g;
      const toU = v => ug.worldToLocal(chassis.localToWorld(v.clone()));
      for (const a of hubParts.arms) placeRod(a, toU(ARM.clone().setZ(a.position.z)), FA.clone().setZ(a.position.z));
      placeRod(hubParts.rod, toU(hubParts.rodTop), hubParts.armTip);
    }
    // glow pulse
    const pulse = rm ? 1 : 1 + 0.12 * Math.sin(performance.now() / 420);
    for (const h of halos) h.scale.setScalar(h.userData.base * pulse);
    // force path
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
    scene.traverse(o => { if (o.geometry) disposables.add(o.geometry); if (o.material) disposables.add(o.material); });
    disposables.forEach(d => d.dispose && d.dispose()); envRT.dispose(); renderer.dispose();
    canvas.remove(); hint.remove(); done.remove(); hx.classList.remove('hx3d'); api.ready = false;
  }
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); dispose(); });
  addEventListener('pagehide', e => { if (!e.persisted) dispose(); });

  // first frame, then swap the 2D diagram out
  wake(); renderer.render(scene, camera);
  hx.classList.add('hx3d');
}
