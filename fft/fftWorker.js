// fftWorker.js
// Web Worker script for FFT-based image reconstruction

self.onmessage = function(e) {
    const data = e.data;
    const [h, w] = data.shape;
    const { r, g, b } = data;
  
    // Precompute coefficients
    function prepareCoeffs(coeffs) {
      const out = coeffs.map(c => ({
        Ax: 2 * Math.PI * c.kx,
        Ay: 2 * Math.PI * c.ky,
        phase: c.phase,
        amp: c.amplitude
      }));
      return out;
    }
    const coeffsR = prepareCoeffs(r);
    const coeffsG = prepareCoeffs(g);
    const coeffsB = prepareCoeffs(b);
  
    // Allocate pixel buffer (RGBA)
    const pixelCount = w * h * 4;
    const pixels = new Uint8ClampedArray(pixelCount);
  
    // Reconstruction loops
    for (let y = 0; y < h; y++) {
      // Precompute y-dependent terms
      const preR = coeffsR.map(c => c.Ay * y + c.phase);
      const preG = coeffsG.map(c => c.Ay * y + c.phase);
      const preB = coeffsB.map(c => c.Ay * y + c.phase);
  
      for (let x = 0; x < w; x++) {
        let vr = 0, vg = 0, vb = 0;
        // accumulate R
        for (let i = 0; i < coeffsR.length; i++) {
          vr += coeffsR[i].amp * Math.cos(coeffsR[i].Ax * x + preR[i]);
        }
        // accumulate G
        for (let i = 0; i < coeffsG.length; i++) {
          vg += coeffsG[i].amp * Math.cos(coeffsG[i].Ax * x + preG[i]);
        }
        // accumulate B
        for (let i = 0; i < coeffsB.length; i++) {
          vb += coeffsB[i].amp * Math.cos(coeffsB[i].Ax * x + preB[i]);
        }
        // Clamp to [0,255]
        vr = vr < 0 ? 0 : vr > 255 ? 255 : vr;
        vg = vg < 0 ? 0 : vg > 255 ? 255 : vg;
        vb = vb < 0 ? 0 : vb > 255 ? 255 : vb;
  
        const idx = 4 * (x + y * w);
        pixels[idx]   = vr;
        pixels[idx+1] = vg;
        pixels[idx+2] = vb;
        pixels[idx+3] = 255;
      }
    }
  
    // Transfer the pixel buffer back to main thread
    self.postMessage(pixels.buffer, [pixels.buffer]);
  };
  