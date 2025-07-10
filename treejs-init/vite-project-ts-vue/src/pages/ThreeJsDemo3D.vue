<template>
  <div ref="canvasContainer" id="canvas"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Color,
  BufferGeometry,
  BufferAttribute,
  PointsMaterial,
  AdditiveBlending,
  Points,
  Vector3,
  CanvasTexture,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// --- refs & globals ---
const canvasContainer = ref<HTMLElement | null>(null);
let scene: Scene, camera: PerspectiveCamera, renderer: WebGLRenderer;
let controls: OrbitControls;
let points: Points, geometry: BufferGeometry;
let positions: Float32Array, target: Float32Array;
let speeds: Float32Array, colors: Float32Array, sizes: Float32Array;

// --- onMounted / onUnmounted ---
onMounted(() => {
  init();
  animate();
  window.addEventListener("resize", onResize);
});
onUnmounted(() => {
  window.removeEventListener("resize", onResize);
  controls.dispose();
  renderer.dispose();
});

// --- 初期化 ---
function init() {
  // 1) シーン／カメラ／レンダラー
  scene = new Scene();
  camera = new PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    2000
  );
  camera.position.set(0, 0, 400);

  renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  canvasContainer.value?.appendChild(renderer.domElement);

  // 2) コントロール
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;

  // 3) テキスト輪郭→点群取得
  const { pointsArr } = createTextOutlineCanvas("あ");
  initParticleData(pointsArr);

  // 4) マテリアル＆Points
  const material = new PointsMaterial({
    size: 4,
    map: createSpriteTexture(),
    transparent: true,
    alphaTest: 0.3,
    vertexColors: true,
    blending: AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  });
  points = new Points(geometry, material);
  scene.add(points);
}

// --- リサイズハンドラ ---
function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

// --- 2Dキャンバスから文字の点群を生成 ---
function createTextOutlineCanvas(text: string) {
  const cw = 1024, ch = 256;
  const cvs = document.createElement("canvas");
  cvs.width = cw; cvs.height = ch;
  const ctx = cvs.getContext("2d")!;
  ctx.fillStyle = "white";
  // フォントサイズを文字数に応じて自動調整
  const fontSize = Math.min(cw / text.length, ch);
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cw / 2, ch / 2);

  const img = ctx.getImageData(0, 0, cw, ch).data;
  const arr: number[] = [];
  // 3px ごとにサンプリング
  for (let y = 0; y < ch; y += 3) {
    for (let x = 0; x < cw; x += 3) {
      if (img[(y * cw + x) * 4 + 3] > 128) {
        // 中心を原点にして、Z をランダムちょいずらし
        arr.push(
          x - cw / 2,
          ch / 2 - y,
          (Math.random() - 0.5) * 50  // Z にランダム奥行きを付与
        );
      }
    }
  }
  return { pointsArr: arr };
}

// --- スプライトテクスチャ生成 ---
function createSpriteTexture() {
  const cvs = document.createElement("canvas");
  cvs.width = cvs.height = 64;
  const ctx = cvs.getContext("2d")!;
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
  return new CanvasTexture(cvs);
}

// --- 粒子データ初期化 ---
function initParticleData(pointsArr: number[]) {
  const count = pointsArr.length / 3;
  target = new Float32Array(pointsArr);
  positions = new Float32Array(pointsArr.length);
  speeds = new Float32Array(count);
  colors = new Float32Array(count * 3);
  sizes = new Float32Array(count);

  // カラーはランダム
  for (let i = 0; i < count; i++) {
    // 初期位置はランダムバラ撒き
    positions[3 * i] = (Math.random() - 0.5) * window.innerWidth;
    positions[3 * i + 1] = (Math.random() - 0.5) * window.innerHeight;
    positions[3 * i + 2] = (Math.random() - 0.5) * 500;
    speeds[i] = Math.random() * 0.03 + 0.02;
    // 色もランダム
    colors[3 * i]     = Math.random();
    colors[3 * i + 1] = Math.random();
    colors[3 * i + 2] = Math.random();
    sizes[i] = Math.random() * 6 + 2;
  }

  geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("color",    new BufferAttribute(colors,    3));
  geometry.setAttribute("size",     new BufferAttribute(sizes,     1));
}

// --- アニメーションループ ---
function animate() {
  requestAnimationFrame(animate);
  updateParticles();
  geometry.attributes.position.needsUpdate = true;
  controls.update();
  renderer.render(scene, camera);
}

// --- 粒子移動 ---
function updateParticles() {
  const pos = geometry.attributes.position.array as Float32Array;
  for (let i = 0; i < pos.length; i += 3) {
    // target へ向かって LERP
    pos[i]     += (target[i]     - pos[i])     * speeds[i / 3];
    pos[i + 1] += (target[i + 1] - pos[i + 1]) * speeds[i / 3];
    pos[i + 2] += (target[i + 2] - pos[i + 2]) * speeds[i / 3];
  }
}
</script>

<style scoped>
#canvas {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>
