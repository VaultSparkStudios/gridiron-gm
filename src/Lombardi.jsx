// The Vince Lombardi Trophy, in real 3D: a regulation football tipped up on a tapered three-sided
// stand, polished chrome lit by a studio environment, turning slowly on a dark platter. three.js is
// loaded only when this mounts (the main menu), so the game itself stays light.
import React, { useEffect, useRef } from "react";

export default function Lombardi({ size = 120 }) {
  const ref = useRef(null);
  useEffect(() => {
    let stop = false, cleanup = () => {};
    (async () => {
      const THREE = await import("three");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      const el = ref.current;
      if (!el || stop) return;
      const w = size, h = Math.round(size * 1.9);
      let renderer;
      try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch { return; }
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.setSize(w, h);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      el.appendChild(renderer.domElement);
      const { scene, camera, trophy, platter, pmrem } = buildScene(THREE, RoomEnvironment, renderer, w, h);
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      let raf = 0, t0 = performance.now();
      const loop = (now) => {
        const a = ((now - t0) / 1000) * 0.6;
        trophy.rotation.y = reduce ? 0.5 : a;
        platter.rotation.y = trophy.rotation.y;
        renderer.render(scene, camera);
        if (!reduce) raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      cleanup = () => { cancelAnimationFrame(raf); renderer.dispose(); pmrem.dispose(); renderer.domElement.remove(); };
    })();
    return () => { stop = true; cleanup(); };
  }, [size]);
  return <div ref={ref} role="img" aria-label="Vince Lombardi Trophy" style={{ width: size, height: Math.round(size * 1.9) }} />;
}

// The trophy, its platter and the studio light, shared by the live trophy and the spin strip.
function buildScene(THREE, RoomEnvironment, renderer, w, h) {
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 50);
  camera.position.set(0, 2.6, 9.6);
  camera.lookAt(0, 2.05, 0);

  const chrome = new THREE.MeshStandardMaterial({ color: 0xe9ecf1, metalness: 1, roughness: 0.14 });
  const trophy = new THREE.Group();
  // the stand: tapered, three concave-looking faces
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.62, 2.5, 3, 1), chrome);
  stand.position.y = 1.25;
  trophy.add(stand);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.12, 24), chrome);
  collar.position.y = 2.56;
  trophy.add(collar);
  // the football: a lathe of a pointed ellipse, tipped up in kicking position
  const prof = [];
  for (let i = 0; i <= 32; i++) { const t = i / 32, y = (t - 0.5) * 1.95; prof.push(new THREE.Vector2(0.64 * Math.pow(Math.sin(Math.PI * t), 0.85), y)); }
  const ball = new THREE.Group();
  ball.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 64), chrome));
  // laces and seam
  const seam = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.012, 6, 64, Math.PI * 0.62), chrome);
  seam.rotation.set(0, Math.PI / 2, Math.PI / 2 + Math.PI * 0.19);
  seam.position.set(-0.07, 0, 0);
  for (let i = -3; i <= 3; i++) {
    const lace = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.035, 0.05), chrome);
    const y = i * 0.1, r = 0.64 * Math.pow(Math.sin(Math.PI * (y / 1.95 + 0.5)), 0.85);
    lace.position.set(0, y, r + 0.01);
    ball.add(lace);
  }
  ball.rotation.z = -0.42;
  ball.position.set(0.12, 3.35, 0);
  trophy.add(ball);
  scene.add(trophy);

  // the platter
  const platMat = new THREE.MeshStandardMaterial({ color: 0x1b2029, metalness: 0.6, roughness: 0.35 });
  const platter = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.42, 0.16, 64), platMat);
  platter.position.y = -0.08;
  scene.add(platter);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.38, 0.025, 8, 64), new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 1, roughness: 0.3 }));
  rim.rotation.x = Math.PI / 2;
  scene.add(rim);
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(3, 5, 4); scene.add(key);

  return { scene, camera, trophy, platter, pmrem };
}

// A spin strip: the trophy rendered once from every angle into one image, so a shelf of them can
// all turn with CSS while only one 3D canvas ever exists (browsers allow just a handful).
const sheets = new Map();
export const SPIN_FRAMES = 48;
export function lombardiStrip(size, frames = SPIN_FRAMES) {
  const key = `${size}|${frames}`;
  if (sheets.has(key)) return sheets.get(key);
  const job = (async () => {
    const THREE = await import("three");
    const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = size, h = Math.round(size * 1.9);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(dpr); renderer.setSize(w, h);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    const { scene, camera, trophy, platter, pmrem } = buildScene(THREE, RoomEnvironment, renderer, w, h);
    const out = document.createElement("canvas"); out.width = Math.round(w * dpr) * frames; out.height = Math.round(h * dpr);
    const ctx = out.getContext("2d");
    for (let i = 0; i < frames; i++) {
      trophy.rotation.y = platter.rotation.y = (i / frames) * Math.PI * 2;
      renderer.render(scene, camera);
      ctx.drawImage(renderer.domElement, i * Math.round(w * dpr), 0);
    }
    pmrem.dispose(); renderer.dispose(); renderer.forceContextLoss?.();
    return out.toDataURL("image/png");
  })().catch(() => null);
  sheets.set(key, job);
  return job;
}

// One trophy on a shelf: the spin strip, stepped through with CSS.
export function LombardiSpin({ size = 100, delay = 0 }) {
  const [src, setSrc] = React.useState(null);
  useEffect(() => { let on = true; lombardiStrip(size).then((u) => on && setSrc(u)); return () => { on = false; }; }, [size]);
  const h = Math.round(size * 1.9);
  return (
    <div role="img" aria-label="Vince Lombardi Trophy" style={{ width: size, height: h, backgroundImage: src ? `url(${src})` : "none", backgroundSize: `${SPIN_FRAMES * 100}% 100%`, backgroundRepeat: "no-repeat",
      animation: src ? `lomSpin 8s steps(${SPIN_FRAMES - 1}) ${-delay}s infinite` : "none" }}>
      <style>{`@keyframes lomSpin { from { background-position: 0% 0; } to { background-position: ${((SPIN_FRAMES - 1) / (SPIN_FRAMES - 1)) * 100}% 0; } } @media (prefers-reduced-motion: reduce) { [aria-label="Vince Lombardi Trophy"] { animation: none !important; } }`}</style>
    </div>
  );
}

// A trophy standing still on a shelf, face on (laces to the front), rendered once to an image.
export function LombardiStill({ size = 100 }) {
  const [src, setSrc] = React.useState(null);
  useEffect(() => { let on = true; lombardiStrip(size, 1).then((u) => on && setSrc(u)); return () => { on = false; }; }, [size]);
  return <div role="img" aria-label="Vince Lombardi Trophy" style={{ width: size, height: Math.round(size * 1.9), backgroundImage: src ? `url(${src})` : "none", backgroundSize: "100% 100%" }} />;
}
