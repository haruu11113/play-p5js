<template>
  <div ref="canvasContainer"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import p5 from 'p5';
import frag from '../assets/shader2-line.frag?raw';
import vert from '../assets/shader2-line.vert?raw';

const canvasContainer = ref<HTMLDivElement | null>(null);
let instance: p5 | null = null;

const sketch = (p: p5) => {
  let normalShader: p5.Shader;
  let startTime: number;

  let params = {
    circleCount: 8.0,
    cornerSharpness: 1.5,
    noiseAmount: 1.5,
    timeScale: 0.2,
    colorTemperature: 0.5,
    colorSaturation: 0.8,
    colorBrightness: 1.0,
    edgeIntensity: 1.0,
    rotationSpeed: 1.8,
    movementSpeed: 0.5
  };

  let bubbles: any[] = [];

  const calculateCircleCount = () => {
    const screenArea = p.windowWidth * p.windowHeight;
    const referenceArea = 1920 * 1080;
    let count = 3.0 + (screenArea / referenceArea) * 7.0;
    return p.constrain(count, 1.0, 10.0);
  };

  const initBubbles = () => {
    bubbles = [];
    const screenArea = p.windowWidth * p.windowHeight;
    const referenceArea = 1920 * 1080;
    const bubbleCount = p.floor(p.map(screenArea, 0, referenceArea * 2, 20, 60));

    for (let i = 0; i < bubbleCount; i++) {
      let size = p.random(30, 150);
      let speedFactor = p.map(size, 30, 150, 0.6, 0.2);
      let detailFactor = p.map(size, 30, 150, 6, 14);
      let posX = p.random(-p.width / 2 + size, p.width / 2 - size);
      let posY = p.random(-p.height / 2 + size, p.height / 2 - size);
      let moveAngle = p.random(p.TWO_PI);
      let speedMagnitude = p.random(0.1, 0.3) * speedFactor;

      bubbles.push({
        size: size,
        x: posX,
        y: posY,
        z: p.random(-100, 100),
        speedX: p.cos(moveAngle) * speedMagnitude,
        speedY: p.sin(moveAngle) * speedMagnitude,
        speedZ: p.random(-0.05, 0.05) * speedFactor,
        rotX: p.random(p.TWO_PI),
        rotY: p.random(p.TWO_PI),
        rotSpeedX: p.random(-0.005, 0.005),
        rotSpeedY: p.random(-0.005, 0.005),
        colorOffset: p.random(0, 1),
        detail: p.floor(p.random(detailFactor * 0.7, detailFactor)),
        lastBounce: 0
      });
    }
  };

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
    p.stroke(255);
    p.strokeWeight(1);
    p.noFill();

    const gl = (p as any)._renderer.GL;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    params.circleCount = calculateCircleCount();
    normalShader = p.createShader(vert, frag);
    startTime = p.millis();
    initBubbles();
  };

  p.draw = () => {
    p.background(0);
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
    normalShader.setUniform('uResolution', [p.width, p.height]);

    drawBubbles(elapsedTime);
  };

  const drawBubbles = (time: number) => {
    if (bubbles.length === 0) {
      initBubbles();
    }

    let clampedDeltaTime = p.min(p.deltaTime, 100);

    bubbles.sort((a, b) => b.z - a.z);

    for (let i = 0; i < bubbles.length; i++) {
      let b = bubbles[i];
      let deltaFactor = clampedDeltaTime / 16.67;
      let sizeBasedSpeed = p.map(b.size, 30, 180, 1.2, 0.8);
      let moveFactor = params.movementSpeed * deltaFactor * sizeBasedSpeed;

      b.x += b.speedX * moveFactor;
      b.y += b.speedY * moveFactor;
      b.z += b.speedZ * moveFactor * 0.5;

      b.rotX += b.rotSpeedX * params.rotationSpeed * deltaFactor;
      b.rotY += b.rotSpeedY * params.rotationSpeed * deltaFactor;

      let margin = b.size;
      let bounced = false;

      if (b.x < -p.width / 2 + margin) {
        b.x = -p.width / 2 + margin + p.random(1, 3);
        b.speedX *= -1;
        bounced = true;
      } else if (b.x > p.width / 2 - margin) {
        b.x = p.width / 2 - margin - p.random(1, 3);
        b.speedX *= -1;
        bounced = true;
      }

      if (b.y < -p.height / 2 + margin) {
        b.y = -p.height / 2 + margin + p.random(1, 3);
        b.speedY *= -1;
        bounced = true;
      } else if (b.y > p.height / 2 - margin) {
        b.y = p.height / 2 - margin - p.random(1, 3);
        b.speedY *= -1;
        bounced = true;
      }

      if (b.z < -100 + margin) {
        b.z = -100 + margin + p.random(1, 3);
        b.speedZ *= -1;
        bounced = true;
      } else if (b.z > 100 - margin) {
        b.z = 100 - margin - p.random(1, 3);
        b.speedZ *= -1;
        bounced = true;
      }

      if (bounced && time - b.lastBounce > 0.5) {
        b.colorOffset = p.random(0, 1);
        b.lastBounce = time;
        b.speedX *= p.random(0.98, 1.02);
        b.speedY *= p.random(0.98, 1.02);
        b.speedZ *= p.random(0.98, 1.02);

        let speed = p.sqrt(b.speedX * b.speedX + b.speedY * b.speedY + b.speedZ * b.speedZ);
        let minSpeed = 0.05 * p.map(b.size, 30, 180, 0.6, 0.2);
        if (speed < minSpeed) {
          let factor = minSpeed / speed;
          b.speedX *= factor;
          b.speedY *= factor;
          b.speedZ *= factor;
        }

        let maxSpeed = 0.3 * p.map(b.size, 30, 180, 0.6, 0.2);
        if (speed > maxSpeed) {
          let factor = maxSpeed / speed;
          b.speedX *= factor;
          b.speedY *= factor;
          b.speedZ *= factor;
        }
      }

      p.push();
      p.translate(b.x, b.y, b.z);
      p.rotateX(b.rotX);
      p.rotateY(b.rotY);
      let tempOffset = 0.1 * p.sin(time * 0.2 + b.colorOffset * p.TWO_PI);
      normalShader.setUniform('uColorTemperature', params.colorTemperature + tempOffset);
      p.sphere(b.size, b.detail, b.detail);
      p.pop();
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    params.circleCount = calculateCircleCount();
    initBubbles();
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
