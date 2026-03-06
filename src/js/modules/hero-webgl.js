const initHeroFallback = (canvas, isTouch) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const drawFallback = () => {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const radius = Math.min(width, height) * (isTouch ? 0.16 : 0.21);
    const cx = width * 0.5;
    const cy = height * 0.5;

    const ringCount = 14;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    for (let i = 0; i < ringCount; i += 1) {
      const p = i / Math.max(1, ringCount - 1);
      const y = (p - 0.5) * radius * 1.6;
      const ringRadius = Math.sqrt(Math.max(0, radius * radius - y * y));
      if (ringRadius < 2) continue;
      ctx.beginPath();
      ctx.ellipse(cx, cy + y * 0.5, ringRadius, ringRadius * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.beginPath();
    ctx.ellipse(cx, cy, radius, radius * 0.42, 0, 0, Math.PI * 2);
    ctx.stroke();

    const pointCount = isTouch ? 110 : 180;
    ctx.fillStyle = "rgba(243,243,243,0.9)";
    for (let i = 0; i < pointCount; i += 1) {
      const a = (Math.PI * 2 * i) / pointCount;
      const lat = Math.sin(i * 0.91) * 0.95;
      const y = lat * radius;
      const ringRadius = Math.sqrt(Math.max(0, radius * radius - y * y));
      const x = Math.cos(a) * ringRadius;
      const z = Math.sin(a) * ringRadius;
      const depth = (z / radius + 1) * 0.5;
      const px = cx + x;
      const py = cy + y * 0.5;
      const r = 0.6 + depth * 0.9;
      const alpha = 0.26 + depth * 0.62;

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  };

  drawFallback();
  window.addEventListener("resize", drawFallback);
};

export const initHeroWebGL = ({ THREE, isTouch }) => {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  if (!THREE) {
    initHeroFallback(canvas, isTouch);
    return;
  }

  const isMobile = window.matchMedia("(max-width: 900px)").matches;
  const isStatic = isTouch || isMobile;

  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
  } catch (_) {
    initHeroFallback(canvas, isTouch);
    return;
  }

  const gl = renderer.getContext?.();
  if (!gl) {
    renderer.dispose?.();
    initHeroFallback(canvas, isTouch);
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.z = 3.8;
  let baseSphereScale = isStatic ? 0.72 : 1;

  const resize = () => {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const isCurrentMobile = width <= 900 || isTouch;
    const isNarrow = width <= 1280 || height <= 760;
    baseSphereScale = isCurrentMobile ? 0.72 : isNarrow ? 0.9 : 1;
  };
  resize();

  const container = new THREE.Group();
  scene.add(container);

  const detail = isStatic ? 0 : 1;
  const sourceGeometry = new THREE.IcosahedronGeometry(1, detail).toNonIndexed();
  const sourcePositions = sourceGeometry.getAttribute("position");

  const targetVertices = [];
  const vertexMap = new Map();
  const triangles = [];

  const pushVertex = (x, y, z) => {
    const key = `${x.toFixed(5)}|${y.toFixed(5)}|${z.toFixed(5)}`;
    const existing = vertexMap.get(key);
    if (existing !== undefined) return existing;
    const idx = targetVertices.length / 3;
    vertexMap.set(key, idx);
    targetVertices.push(x, y, z);
    return idx;
  };

  for (let i = 0; i < sourcePositions.count; i += 3) {
    const tri = [];
    for (let k = 0; k < 3; k += 1) {
      const x = sourcePositions.getX(i + k);
      const y = sourcePositions.getY(i + k);
      const z = sourcePositions.getZ(i + k);
      tri.push(pushVertex(x, y, z));
    }
    triangles.push(tri);
  }

  sourceGeometry.dispose();

  const POINT_COUNT = targetVertices.length / 3;
  const targetPositions = new Float32Array(targetVertices);
  const startPositions = new Float32Array(POINT_COUNT * 3);
  const currentPositions = new Float32Array(POINT_COUNT * 3);

  for (let i = 0; i < POINT_COUNT; i += 1) {
    const idx = i * 3;
    const tx = targetPositions[idx + 0];
    const ty = targetPositions[idx + 1];
    const tz = targetPositions[idx + 2];
    const radius = 4.8 + Math.random() * 2.2;

    if (isStatic) {
      startPositions[idx + 0] = tx;
      startPositions[idx + 1] = ty;
      startPositions[idx + 2] = tz;
    } else {
      startPositions[idx + 0] = tx * radius + (Math.random() - 0.5) * 0.16;
      startPositions[idx + 1] = ty * radius + (Math.random() - 0.5) * 0.16;
      startPositions[idx + 2] = tz * radius + (Math.random() - 0.5) * 0.16;
    }

    currentPositions[idx + 0] = startPositions[idx + 0];
    currentPositions[idx + 1] = startPositions[idx + 1];
    currentPositions[idx + 2] = startPositions[idx + 2];
  }

  const particlesGeometry = new THREE.BufferGeometry();
  particlesGeometry.setAttribute("position", new THREE.BufferAttribute(currentPositions, 3));
  particlesGeometry.attributes.position.setUsage(THREE.DynamicDrawUsage);

  const particlesMaterial = new THREE.PointsMaterial({
    color: 0xf3f3f3,
    size: isTouch ? 0.018 : 0.015,
    transparent: true,
    opacity: 0.94,
    depthWrite: false,
  });
  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  container.add(particles);

  const edgeKeys = new Set();
  const addEdge = (a, b) => {
    const aa = Math.min(a, b);
    const bb = Math.max(a, b);
    edgeKeys.add(`${aa}:${bb}`);
  };

  triangles.forEach(([a, b, c]) => {
    addEdge(a, b);
    addEdge(b, c);
    addEdge(c, a);
  });

  const edges = Array.from(edgeKeys).map((key) => key.split(":").map((v) => Number(v)));
  const linePositions = new Float32Array(edges.length * 6);
  const linesGeometry = new THREE.BufferGeometry();
  linesGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
  linesGeometry.attributes.position.setUsage(THREE.DynamicDrawUsage);

  const linesMaterial = new THREE.LineBasicMaterial({
    color: 0x5d5d5d,
    transparent: true,
    opacity: isStatic ? 0.2 : 0.0,
  });
  const lines = new THREE.LineSegments(linesGeometry, linesMaterial);
  container.add(lines);

  const target = { x: 0, y: 0 };
  const mouse = { x: 0, y: 0 };
  let progress = 0;

  if (!isStatic) {
    window.addEventListener("mousemove", (event) => {
      target.x = (event.clientX / window.innerWidth - 0.5) * 1.25;
      target.y = -(event.clientY / window.innerHeight - 0.5) * 1.25;
    });
  }

  const updateLinePositions = () => {
    let cursor = 0;
    for (let i = 0; i < edges.length; i += 1) {
      const a = edges[i][0] * 3;
      const b = edges[i][1] * 3;

      linePositions[cursor + 0] = currentPositions[a + 0];
      linePositions[cursor + 1] = currentPositions[a + 1];
      linePositions[cursor + 2] = currentPositions[a + 2];
      linePositions[cursor + 3] = currentPositions[b + 0];
      linePositions[cursor + 4] = currentPositions[b + 1];
      linePositions[cursor + 5] = currentPositions[b + 2];
      cursor += 6;
    }
  };

  const renderStatic = () => {
    updateLinePositions();
    particlesGeometry.attributes.position.needsUpdate = true;
    linesGeometry.attributes.position.needsUpdate = true;
    container.position.y = 0;
    container.scale.setScalar(baseSphereScale);
    container.rotation.set(0.15, -0.25, 0.04);
    renderer.render(scene, camera);
  };

  window.addEventListener("resize", () => {
    resize();
    if (isStatic) renderStatic();
  });

  if (isStatic) {
    renderStatic();
    return;
  }

  const clock = new THREE.Clock();
  const animate = () => {
    window.requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    mouse.x += (target.x - mouse.x) * 0.03;
    mouse.y += (target.y - mouse.y) * 0.03;

    progress = Math.min(progress + 0.0045, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const jitter = (1 - eased) * 0.045;

    for (let i = 0; i < POINT_COUNT; i += 1) {
      const idx = i * 3;
      const sx = startPositions[idx + 0];
      const sy = startPositions[idx + 1];
      const sz = startPositions[idx + 2];
      const tx = targetPositions[idx + 0];
      const ty = targetPositions[idx + 1];
      const tz = targetPositions[idx + 2];

      currentPositions[idx + 0] = sx + (tx - sx) * eased + Math.sin(elapsed * 1.2 + i * 0.17) * jitter;
      currentPositions[idx + 1] = sy + (ty - sy) * eased + Math.cos(elapsed * 1.15 + i * 0.13) * jitter;
      currentPositions[idx + 2] = sz + (tz - sz) * eased + Math.sin(elapsed * 1.1 + i * 0.11) * jitter;
    }

    updateLinePositions();

    particlesGeometry.attributes.position.needsUpdate = true;
    linesGeometry.attributes.position.needsUpdate = true;

    const lineFade = Math.max(0, (eased - 0.15) / 0.85);
    linesMaterial.opacity = 0.02 + lineFade * 0.2;

    const bob = Math.sin(elapsed * 0.75) * 0.05;
    container.position.y = bob;
    container.scale.setScalar(baseSphereScale);
    container.rotation.y = elapsed * 0.11 + mouse.x * 0.45;
    container.rotation.x = elapsed * 0.055 + mouse.y * 0.32;
    container.rotation.z = Math.sin(elapsed * 0.33) * 0.035;

    renderer.render(scene, camera);
  };

  animate();
};
