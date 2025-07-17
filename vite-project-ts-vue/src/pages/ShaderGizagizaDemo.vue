<template>
  <div ref="canvasContainer"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import p5 from 'p5';
import frag from '../assets/gizagiza.frag?raw';
import vert from '../assets/gizagiza.vert?raw';

const canvasContainer = ref<HTMLDivElement | null>(null);
let instance: p5 | null = null;

const sketch = (p: p5) => {
  let normalShader: p5.Shader;
  let startTime: number;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
    p.noStroke();
    normalShader = p.createShader(vert, frag);
    p.shader(normalShader);
    p.frameRate(30);
    startTime = p.millis();
  };

  p.draw = () => {
    p.background(0);
    let elapsedTime = (p.millis() - startTime) / 1000.0;
    normalShader.setUniform('uTime', elapsedTime);
    p.translate(0, 0, 0);
    p.rotateY(p.frameCount * 0.01);
    p.rotateX(p.frameCount * 0.01);
    p.sphere(200);
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
};

onMounted(() => {
  if (canvasContainer.value) {
    instance = new p5(sketch, canvasContainer.value);
  }
});

onUnmounted(() => {
  instance?.remove();
});
</script>

<style scoped>
div {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
