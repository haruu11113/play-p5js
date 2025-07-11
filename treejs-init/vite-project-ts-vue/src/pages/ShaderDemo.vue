<template>
  <div ref="canvasContainer" class="canvas-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Mesh,
  SphereGeometry,
  ShaderMaterial,
  Vector3,
} from "three";
import { connectWebSocket } from "@/services/wsServices";
import {  sensorData, intensity } from "@/services/wsServices";

import vertexShader from "@/assets/normal.vert?raw";
import fragmentShader from "@/assets/normal.frag?raw";

const canvasContainer = ref<HTMLElement | null>(null);
let scene: Scene;
let camera: PerspectiveCamera;
let renderer: WebGLRenderer;
let meshes: Mesh[] = [];
let startTime = 0;
let ws: WebSocket = connectWebSocket();

const NUM_SPHERES = 10;
const SPHERE_RADIUS = 1.0;
const INITIAL_SPEED = 0.05;

const initThree = (): void => {
  scene = new Scene();
  camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.z = 5;

  renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  canvasContainer.value?.appendChild(renderer.domElement);

  const geometry = new SphereGeometry(2, 64, 64);

  for (let i = 0; i < NUM_SPHERES; i++) {
    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uAcceleration: { value: new Vector3() },
        uIntensity: { value: 0.0 },
      },
    });
    const mesh = new Mesh(geometry, material);
    mesh.position.set(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 5,
    );
    mesh.userData.velocity = new Vector3(
      (Math.random() - 0.5) * INITIAL_SPEED,
      (Math.random() - 0.5) * INITIAL_SPEED,
      (Math.random() - 0.5) * INITIAL_SPEED * 0.5,
    );
    scene.add(mesh);
    meshes.push(mesh);
  }

  startTime = Date.now();
};


const animate = (): void => {
  requestAnimationFrame(animate);
  const elapsedTime = (Date.now() - startTime) / 1000;

  const fovRad = (camera.fov * Math.PI) / 180;
  const viewHeight =
    Math.abs(camera.position.z - meshes[0].position.z) *
    Math.tan(fovRad / 2) *
    2;
  const viewWidth = viewHeight * camera.aspect;
  const halfW = viewWidth / 2;
  const halfH = viewHeight / 2;

  meshes.forEach((mesh) => {
    const mat = mesh.material as ShaderMaterial;
    mat.uniforms.uTime.value = elapsedTime;
    mat.uniforms.uAcceleration.value.set(
      sensorData.x,
      sensorData.y,
      sensorData.z,
    );
    mat.uniforms.uIntensity.value = intensity;

    mesh.rotation.x += 0.005 + sensorData.y * 0.01;
    mesh.rotation.y += 0.005 + sensorData.x * 0.01;
    mesh.rotation.z += sensorData.z * 0.005;

    const vel = mesh.userData.velocity as Vector3;
    mesh.position.add(vel);

    if (
      mesh.position.x + SPHERE_RADIUS > halfW ||
      mesh.position.x - SPHERE_RADIUS < -halfW
    )
      vel.x *= -1;
    if (
      mesh.position.y + SPHERE_RADIUS > halfH ||
      mesh.position.y - SPHERE_RADIUS < -halfH
    )
      vel.y *= -1;

    const zMin = camera.position.z - 10;
    const zMax = camera.position.z - 1;
    if (
      mesh.position.z + SPHERE_RADIUS > zMax ||
      mesh.position.z - SPHERE_RADIUS < zMin
    )
      vel.z *= -1;
  });

  renderer.render(scene, camera);
};

const onResize = (): void => {
  const container = canvasContainer.value;
  if (!container) return;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
};

onMounted(() => {
  initThree();
  connectWebSocket();
  animate();
  window.addEventListener("resize", onResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", onResize);
  ws.close();
});
</script>

<style scoped>
.canvas-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
