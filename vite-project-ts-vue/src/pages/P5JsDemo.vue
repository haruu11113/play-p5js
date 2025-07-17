<template>
  <div ref="canvasContainer"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import p5 from 'p5';

const canvasContainer = ref<HTMLDivElement | null>(null);
let instance: p5 | null = null;

const sketch = (p: p5) => {
  let time = 0;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.colorMode(p.HSB);
    p.noStroke();
    p.frameRate(15);
  };

  p.draw = () => {
    p.background('blue');

    let randomFactorX = p.random(-2, 2);
    let randomFactorY = p.random(-2, 2);

    const boxSize = 3;

    for (let y = -30; y < p.height + 30; y += boxSize) {
      for (let x = -30; x < p.width + boxSize + 30; x += boxSize) {
        let offsetX = p.sin(x * 0.05 + time * 0.02) * randomFactorX + p.cos(time * 0.03) * 2 * randomFactorX;
        let offsetY = p.cos(y * 0.03 + time * 0.02) * randomFactorY + p.sin(time * 0.04) * 2 * randomFactorY;

        let hue = p.map(p.noise(x * 0.05, y * 0.05, time * 0.5), 0.1, 0.85, 0, 360);
        let Saturation = 90;
        let brightness = 90;
        p.fill(hue, Saturation, brightness);

        p.rect(x + offsetX, y + offsetY, boxSize + 1, boxSize + 1);
      }
    }
    time += 1;
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
