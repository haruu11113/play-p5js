<template>
  <div ref="canvasContainer"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import p5 from 'p5';
import frag from '../assets/good-cube.frag?raw';
import vert from '../assets/good-cube.vert?raw';

const canvasContainer = ref<HTMLDivElement | null>(null);
let instance: p5 | null = null;

const sketch = (p: p5) => {
  let normalShader: p5.Shader;
  let startTime: number;

  let params = {
    circleCount: 10,
    cornerSharpness: 2.5,
    noiseAmount: 0.3,
    timeScale: 2.0,
    colorTemperature: 0.7,
    colorSaturation: 0.5,
    colorBrightness: 0.8,
    edgeIntensity: 1,
    rotationSpeed: 2
  };

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
    p.noStroke();
    normalShader = p.createShader(vert, frag);
    p.shader(normalShader);
    startTime = p.millis();
  };

  p.draw = () => {
    p.background(0);
    let elapsedTime = (p.millis() - startTime) / 1000.0;

    normalShader.setUniform('uTime', elapsedTime);
    normalShader.setUniform('uCircleCount', params.circleCount);
    normalShader.setUniform('uCornerSharpness', params.cornerSharpness);
    normalShader.setUniform('uNoiseAmount', params.noiseAmount);
    normalShader.setUniform('uTimeScale', params.timeScale);
    normalShader.setUniform('uColorTemperature', params.colorTemperature);
    normalShader.setUniform('uColorSaturation', params.colorSaturation);
    normalShader.setUniform('uColorBrightness', params.colorBrightness);
    normalShader.setUniform('uEdgeIntensity', params.edgeIntensity);

    p.translate(0, 0, 0);
    p.rotateY(p.frameCount * 0.01 * params.rotationSpeed);
    p.rotateX(p.frameCount * 0.01 * params.rotationSpeed);
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
