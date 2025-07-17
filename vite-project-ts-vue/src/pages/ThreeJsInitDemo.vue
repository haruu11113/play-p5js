<template>
  <div ref="canvasContainer"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import * as THREE from 'three';

const canvasContainer = ref<HTMLDivElement | null>(null);

let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let boxes: THREE.Group;
let addX: number[] = [];
let addY: number[] = [];
let addZ: number[] = [];
let animationFrameId: number;

const init = () => {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  if (canvasContainer.value) {
    canvasContainer.value.appendChild(renderer.domElement);
  }

  camera.position.z = 5;

  const distance = camera.position.z;
  const vFov = (camera.fov * Math.PI) / 180;
  const visibleHeight = 2 * Math.tan(vFov / 2) * distance;
  const visibleWidth = visibleHeight * camera.aspect;
  const halfWidth = visibleWidth / 2;
  const halfHeight = visibleHeight / 2;
  const halfZ = distance / 2;

  boxes = new THREE.Group();
  for (let i = 0; i < 5000; i++) {
    const geometry = new THREE.SphereGeometry(Math.random() * 0.01, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const box = new THREE.Mesh(geometry, material);

    box.position.x = (Math.random() - 0.5) * (halfWidth * 2);
    box.position.y = (Math.random() - 0.5) * (halfHeight * 2);
    box.position.z = (Math.random() - 0.5) * (halfZ * 2);

    boxes.add(box);

    addX[i] = (Math.random() - 0.5) * 0.02;
    addY[i] = (Math.random() - 0.5) * 0.02;
    addZ[i] = (Math.random() - 0.5) * 0.02;
  }
  scene.add(boxes);

  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onWindowResize, false);

  animate();
};

const animate = () => {
  animationFrameId = requestAnimationFrame(animate);

  const distance = camera.position.z;
  const vFov = (camera.fov * Math.PI) / 180;
  const visibleHeight = 2 * Math.tan(vFov / 2) * distance;
  const visibleWidth = visibleHeight * camera.aspect;
  const halfWidth = visibleWidth / 2;
  const halfHeight = visibleHeight / 2;
  const halfZ = distance / 2;

  for (let i = 0; i < boxes.children.length; i++) {
    const box = boxes.children[i];

    if (box.position.x > halfWidth || box.position.x < -halfWidth) {
      addX[i] *= -1;
    }
    if (box.position.y > halfHeight || box.position.y < -halfHeight) {
      addY[i] *= -1;
    }
    if (box.position.z > halfZ || box.position.z < -halfZ) {
      addZ[i] *= -1;
    }

    box.position.x += addX[i];
    box.position.y += addY[i];
    box.position.z += addZ[i];
  }
  renderer.render(scene, camera);
};

onMounted(() => {
  init();
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
  if (renderer) {
    renderer.dispose();
  }
  if (canvasContainer.value) {
    canvasContainer.value.removeChild(renderer.domElement);
  }
});

</script>

<style scoped>
div {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
