<template>
  <div ref="canvasContainer"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import p5 from 'p5';
import frag from '../assets/good-cube-2nd.frag?raw';
import vert from '../assets/good-cube-2nd.vert?raw';

const canvasContainer = ref<HTMLDivElement | null>(null);
let instance: p5 | null = null;

const sketch = (p: p5) => {
  let normalShader: p5.Shader;
  let startTime: number;

  let params = {
    circleCount: 5,
    cornerSharpness: 1.2,
    noiseAmount: 0.2,
    timeScale: 1.0,
    colorTemperature: 0.6,
    colorSaturation: 0.6,
    colorBrightness: 0.9,
    edgeIntensity: 0.7,
    rotationSpeed: 0.3
  };

  let bubbles: any[] = [];

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
    p.noStroke();

    const gl = (p as any)._renderer.GL;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    normalShader = p.createShader(vert, frag);
    startTime = p.millis();
    initBubbles();
  };

  p.draw = () => {
    p.background(5, 15, 25);
    p.shader(normalShader);

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

    drawBubbles(elapsedTime);
  };

  const initBubbles = () => {
    bubbles = [];
    for (let i = 0; i < 15; i++) {
      bubbles.push({
        size: p.random(30, 150),
        x: p.random(-p.width / 3, p.width / 3),
        y: p.random(-p.height / 3, p.height / 3),
        z: p.random(-300, 300),
        speedY: p.random(-0.4, -0.05),
        rotX: p.random(p.TWO_PI),
        rotY: p.random(p.TWO_PI),
        rotSpeedX: p.random(-0.005, 0.005),
        rotSpeedY: p.random(-0.005, 0.005),
        colorOffset: p.random(0, 1)
      });
    }
  };

  const drawBubbles = (time: number) => {
    if (bubbles.length === 0) {
      initBubbles();
    }

    bubbles.sort((a, b) => b.z - a.z);

    for (let i = 0; i < bubbles.length; i++) {
      let b = bubbles[i];

      b.y += b.speedY;
      b.x += p.sin(time * 0.5 + i) * 0.1;
      b.rotX += b.rotSpeedX * params.rotationSpeed;
      b.rotY += b.rotSpeedY * params.rotationSpeed;

      if (b.y < -p.height / 2 - b.size) {
        b.y = p.height / 2 + b.size;
        b.x = p.random(-p.width / 3, p.width / 3);
        b.z = p.random(-300, 300);
        b.size = p.random(30, 150);
      }

      p.push();
      p.translate(b.x, b.y, b.z);
      p.rotateX(b.rotX);
      p.rotateY(b.rotY);

      let tempOffset = 0.1 * p.sin(time * 0.2 + b.colorOffset * p.TWO_PI);
      normalShader.setUniform('uColorTemperature', params.colorTemperature + tempOffset);

      p.sphere(b.size);
      p.pop();
    }
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
