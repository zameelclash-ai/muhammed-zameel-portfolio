/* One 3D moment: a glossy teal medical plus that floats in the hero.
   Three.js is self-hosted in /vendor. If WebGL or import maps are missing, the flat SVG stays. */
import * as THREE from "three";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";

const host = document.getElementById("plus3d");
const reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
if (host) {
  let gl = null;
  try { const c = document.createElement("canvas"); gl = c.getContext("webgl2") || c.getContext("webgl"); } catch (e) {}
  // Weak phones (few cores, low memory, data saver) keep the flat SVG plus; others start after first paint.
  const weak = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) || (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.connection && navigator.connection.saveData);
  if (gl && !weak) {
    const go = () => start();
    if ("requestIdleCallback" in window) requestIdleCallback(go, { timeout: 2500 }); else setTimeout(go, 800);
  }
}

function roundedShape(points, r) {
  const s = new THREE.Shape(), n = points.length;
  const at = (i) => points[(i + n) % n];
  for (let i = 0; i < n; i++) {
    const p = at(i), a = at(i - 1), b = at(i + 1);
    const va = new THREE.Vector2(a[0] - p[0], a[1] - p[1]).normalize();
    const vb = new THREE.Vector2(b[0] - p[0], b[1] - p[1]).normalize();
    const p1 = [p[0] + va.x * r, p[1] + va.y * r], p2 = [p[0] + vb.x * r, p[1] + vb.y * r];
    if (i === 0) s.moveTo(p1[0], p1[1]); else s.lineTo(p1[0], p1[1]);
    s.quadraticCurveTo(p[0], p[1], p2[0], p2[1]);
  }
  s.closePath();
  return s;
}

function start() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0, 8.2);
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x8be0d4, 0.9); rim.position.set(-4, -1, -3); scene.add(rim);

  const t = 0.36, L = 1.0;
  const shape = roundedShape([[t, L], [-t, L], [-t, t], [-L, t], [-L, -t], [-t, -t], [-t, -L], [t, -L], [t, -t], [L, -t], [L, t], [t, t]], 0.2);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.42, bevelEnabled: true, bevelThickness: 0.16, bevelSize: 0.13, bevelSegments: 10, curveSegments: 18 });
  geo.center();
  const mat = new THREE.MeshPhysicalMaterial({ color: 0x00a796, roughness: 0.2, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.25, sheen: 0.4, sheenColor: new THREE.Color(0x8be0d4) });
  const mesh = new THREE.Mesh(geo, mat);
  const group = new THREE.Group(); group.add(mesh); scene.add(group);

  let w = 0, h = 0;
  const resize = () => {
    const r = host.getBoundingClientRect(); w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height));
    renderer.setSize(w, h, false); renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "100%";
    camera.aspect = w / h; camera.updateProjectionMatrix(); draw();
  };

  let px = 0, py = 0, tx = 0, ty = 0, visible = true, raf = 0;
  const t0 = performance.now();
  function draw(now) {
    const t = reduce ? 0 : ((now || performance.now()) - t0) / 1000;
    px += (tx - px) * 0.08; py += (ty - py) * 0.08;
    const sy = reduce ? 0 : Math.min(window.scrollY, 900);
    group.position.y = Math.sin(t * 1.1) * 0.07;
    group.rotation.y = Math.sin(t * 0.55) * 0.5 + px * 0.35 + sy * 0.0012;
    group.rotation.x = -0.16 + Math.cos(t * 0.45) * 0.05 + py * 0.22;
    renderer.render(scene, camera);
  }
  function loop(now) { raf = 0; if (!visible || document.hidden) return; draw(now); raf = requestAnimationFrame(loop); }
  const kick = () => { if (!raf && !reduce) raf = requestAnimationFrame(loop); };

  new ResizeObserver(resize).observe(host);
  resize();
  host.classList.add("ready");
  if (!reduce) {
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; kick(); }, { threshold: 0 }).observe(host);
    document.addEventListener("visibilitychange", kick);
    window.addEventListener("pointermove", (e) => { tx = (e.clientX / innerWidth - 0.5) * 2; ty = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });
    kick();
  }
}
