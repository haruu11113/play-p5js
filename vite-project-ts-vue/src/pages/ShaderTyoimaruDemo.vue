<template>
  <div ref="canvasContainer"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import p5 from 'p5';
import frag from '../assets/tyoimaru.frag?raw';
import vert from '../assets/tyoimaru.vert?raw';

const canvasContainer = ref<HTMLDivElement | null>(null);
let instance: p5 | null = null;

const sketch = (p: p5) => {
  let normalShader: p5.Shader;
  let startTime: number;
  let sphereDetail = 1024;
  let sphereRadius = 200;
  let rotationSpeed = 0.05;
  let rotationX = 0;
  let rotationY = 0;
  let autoRotate = true;

  let shaderParams = {
    timeScale: 0.52,
    distortionAmount: 0.9,
    secondaryWaveAmplitude: 0.95,
    bumpStrength: 0.2,
    baseHue: 0.7,
    hueVariation: 0.3,
    hueTimeFactor: 0.1,
    timeSpeed: 0.2,
    edgePower: 2.0,
    pulseAmplitude: 0.05,
    pulseSpeed: 2.0
  };

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
    normalShader.setUniform('uTimeScale', shaderParams.timeScale);
    normalShader.setUniform('uDistortionAmount', shaderParams.distortionAmount);
    normalShader.setUniform('uSecondaryWaveAmplitude', shaderParams.secondaryWaveAmplitude);
    normalShader.setUniform('uBumpStrength', shaderParams.bumpStrength);
    normalShader.setUniform('uBaseHue', shaderParams.baseHue);
    normalShader.setUniform('uHueVariation', shaderParams.hueVariation);
    normalShader.setUniform('uHueTimeFactor', shaderParams.hueTimeFactor);
    normalShader.setUniform('uTimeSpeed', shaderParams.timeSpeed);
    normalShader.setUniform('uEdgePower', shaderParams.edgePower);
    normalShader.setUniform('uPulseAmplitude', shaderParams.pulseAmplitude);
    normalShader.setUniform('uPulseSpeed', shaderParams.pulseSpeed);

    if (autoRotate) {
      rotationY += rotationSpeed * 1.0;
      rotationX += rotationSpeed * 0.7;
    }

    p.translate(0, 0, 0);
    p.rotateY(rotationY);
    p.rotateX(rotationX);
    p.sphere(sphereRadius, sphereDetail);
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  p.keyPressed = () => {
    if (p.key === ' ') {
      autoRotate = !autoRotate;
    }
  }
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
