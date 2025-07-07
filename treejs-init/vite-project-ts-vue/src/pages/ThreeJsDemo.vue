<template>
  <div ref="canvasContainer" id="canvas"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import {
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  Vector3,
  CanvasTexture,
  Color,
  MathUtils,
  BufferGeometry,
  BufferAttribute,
  PointsMaterial,
  AdditiveBlending,
  Points,
} from "three";

type FloatArray = Float32Array;

// refs for DOM and Three.js objects
const canvasContainer = ref<HTMLElement | null>(null);
let scene: Scene;
let camera: PerspectiveCamera;
let renderer: WebGLRenderer;
let points: Points;
let geometry: BufferGeometry;
let positions: FloatArray;
let targetPositions: FloatArray;
let speeds: FloatArray;
let colors: FloatArray;
let sizes: FloatArray;
let hasArrived = false;

// マウス位置トラッキング
let prevMouseX = null;
let prevMouseY = null;

// onMountedライフサイクルで初期化
onMounted(() => {
  init();
  animate();
  window.addEventListener("resize", onWindowResize);
  window.addEventListener("mousemove", onMouseMove, false);
});

onUnmounted(() => {
  window.removeEventListener("resize", onWindowResize);
  window.removeEventListener("mousemove", onMouseMove);
});

/**
 * 初期化関数
 * シーン、カメラ、レンダラーのセットアップとパーティクルデータの初期化を行う
 */
const init = () => {
  // Scene, Camera, Rendererのセットアップ
  scene = new Scene();
  camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.z = 500;

  renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;

  if (canvasContainer.value) {
    canvasContainer.value.appendChild(renderer.domElement);
  }

  // パーティクルデータの初期化
  initParticleData(pointsArr);

  // マテリアル作成＆シーンに追加
  const material = createPointsMaterial(createSpriteTexture());
  points = new Points(geometry, material);
  scene.add(points);
};

/**
 * ウィンドウリサイズハンドラ
 * ウィンドウのサイズ変更時にカメラとレンダラーの設定を更新する
 */
const onWindowResize = () => {
  if (!canvasContainer.value) return;
  const { clientWidth: w, clientHeight: h } = canvasContainer.value;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
};

/**
 * マウスムーブハンドラ
 * マウスの位置をワールド座標に変換し、パーティクルのターゲット位置を更新する
 */
const onMouseMove = (event: MouseEvent) => {
  // ワールド座標に変換
  const vector = new Vector3(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1,
    0.5,
  );
  vector.unproject(camera);
  const dir = vector.sub(camera.position).normalize();
  const distance = -camera.position.z / dir.z;
  const pos = camera.position.clone().add(dir.multiplyScalar(distance));

  if (prevMouseX === 0 && prevMouseY === 0) {
    prevMouseX = pos.x;
    prevMouseY = pos.y;
  }
  prevMouseX = pos.x;
  prevMouseY = pos.y;
};

/**
 * スプライトテクスチャを生成する関数
 * 円形のスプライトを描画したCanvasTextureを返す
 */
const createSpriteTexture = (): CanvasTexture => {
  const spriteCanvas = document.createElement("canvas");
  spriteCanvas.width = 64;
  spriteCanvas.height = 64;
  const ctx = spriteCanvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();
  }
  return new CanvasTexture(spriteCanvas);
};

/**
 * テキストの輪郭をCanvas上に描画し、パーティクルの座標を取得する関数
 * @param text - 描画するテキスト
 * @returns パーティクルの座標配列
 */
const createTextOutlineCanvas = (text: string) => {
  const textCanvas = document.createElement("canvas");
  textCanvas.width = 1024;
  textCanvas.height = 256;
  const ctx = textCanvas.getContext("2d");
  if (!ctx) return { pointsArr: [] };
  const fontSize = Math.min(textCanvas.width / text.length, textCanvas.height);
  ctx.fillStyle = "white";
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, textCanvas.width / 2, textCanvas.height / 2);
  const imgData = ctx.getImageData(
    0,
    0,
    textCanvas.width,
    textCanvas.height,
  ).data;
  const arr: number[] = [];
  for (let y = 0; y < textCanvas.height; y += 3) {
    for (let x = 0; x < textCanvas.width; x += 3) {
      if (imgData[(y * textCanvas.width + x) * 4 + 3] > 128) {
        arr.push(x - textCanvas.width / 2, textCanvas.height / 2 - y, 0);
      }
    }
  }
  return { pointsArr: arr };
};

// テキスト輪郭から得たパーティクルの座標
const { pointsArr } = createTextOutlineCanvas("あ");

/**
 * パーティクルデータを初期化する関数
 * @param pointsArr - パーティクルの座標配列
 */
const initParticleData = (pointsArr: number[]) => {
  const count = pointsArr.length / 3;
  targetPositions = new Float32Array(pointsArr);
  positions = new Float32Array(pointsArr.length);
  speeds = new Float32Array(count);
  colors = new Float32Array(count * 3);
  sizes = new Float32Array(count);
  const base = new Color(0x00aaff);
  const hsl: { h: number; s: number; l: number } = { h: 0, s: 0, l: 0 };
  base.getHSL(hsl);
  for (let i = 0; i < count; i++) {
    positions[3 * i] = (Math.random() - 0.5) * window.innerWidth;
    positions[3 * i + 1] = (Math.random() - 0.5) * window.innerHeight;
    positions[3 * i + 2] = (Math.random() - 0.5) * 500;
    speeds[i] = Math.random() * 0.02 + 0.03;
    const h = hsl.h + (Math.random() - 0.5) * 0.1;
    const s = MathUtils.clamp(hsl.s + (Math.random() - 0.5) * 0.3, 0, 1);
    const l = MathUtils.clamp(hsl.l + (Math.random() - 0.5) * 0.3, 0, 1);
    const c = new Color().setHSL(h, s, l);
    colors[3 * i] = c.r;
    colors[3 * i + 1] = c.g;
    colors[3 * i + 2] = c.b;
    sizes[i] = Math.random() * 12 + 2;
  }
  geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.setAttribute("size", new BufferAttribute(sizes, 1));
};

/**
 * パーティクルのマテリアルを生成する関数
 * @param map - スプライトテクスチャ
 * @returns PointsMaterial
 */
const createPointsMaterial = (map: CanvasTexture): PointsMaterial => {
  return new PointsMaterial({
    size: 3,
    map,
    transparent: true,
    alphaTest: 0.3,
    vertexColors: true,
    blending: AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  });
};

/**
 * アニメーションループ
 * requestAnimationFrameを使用してパーティクルの更新と描画を行う
 */
const animate = () => {
  requestAnimationFrame(animate);
  updateParticles();
  checkArrival();
  geometry.attributes.position.needsUpdate = true;
  renderer.render(scene, camera);
};

/**
 * パーティクルの位置を更新する関数
 * マウス位置に近いパーティクルをランダムに動かし、ターゲット位置に向かって移動させる
 */
const updateParticles = () => {
  const pos = geometry.attributes.position.array as FloatArray;
  for (let i = 0, idx = 0; i < pos.length; i += 3, idx++) {
    const sp = speeds[idx];
    const dx = pos[i] - prevMouseX;
    const dy = pos[i + 1] - prevMouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 20 && prevMouseX !== null && prevMouseY !== null) {
      pos[i] += dx * (Math.random() + 0.5);
      pos[i + 1] += dy * (Math.random() + 0.8);
    }
    pos[i] += (targetPositions[i] - pos[i]) * sp;
    pos[i + 1] += (targetPositions[i + 1] - pos[i + 1]) * sp;
    pos[i + 2] += (targetPositions[i + 2] - pos[i + 2]) * sp;
  }
};

/**
 * 全パーティクルが所定の位置に到達したかをチェックする関数
 * 到達した場合はフラグを立ててメッセージを表示する
 */
const checkArrival = () => {
  if (hasArrived) return;
  const pos = geometry.attributes.position.array as FloatArray;
  const len = pos.length;
  for (let i = 0; i < len; i += 3) {
    const dx = targetPositions[i] - pos[i];
    const dy = targetPositions[i + 1] - pos[i + 1];
    const dz = targetPositions[i + 2] - pos[i + 2];
    if (dx * dx + dy * dy + dz * dz > 1) return;
  }
  hasArrived = true;
  console.log("全パーティクルが所定の位置に到達しました");
};
</script>

<style scoped></style>
