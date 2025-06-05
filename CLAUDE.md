# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Server

Start a local HTTP server to serve the p5.js applications:
```bash
python -m http.server 8000
```

## Project Structure

This is a p5.js playground repository with multiple creative coding experiments:

### Main Application (`/`)
- Basic p5.js setup with animated pattern generation using noise and trigonometric functions
- Creates colorful geometric patterns with HSB color mode
- Multiple draw functions available (draw2, draw3, draw4) for different visual effects

### FFT Visualization (`/fft/`)
- Image processing using Fast Fourier Transform
- Python backend (`fft.py`) computes FFT coefficients for RGB channels and saves to JSON
- p5.js frontend reconstructs images from FFT coefficients using WebWorkers
- Key files:
  - `fft.py`: Computes FFT coefficients from images
  - `fftWorker.js`: WebWorker for FFT reconstruction
  - `coeffs_color.json`: Generated FFT coefficient data

### Shader Experiments (`/shader/`)
- WebGL shaders with p5.js in WEBGL mode
- Normal mapping visualization on 3D spheres
- Vertex shader (`normal.vert`) and fragment shader (`normal.frag`)
- Renders rotating sphere with normal-based coloring

## Dependencies

All p5.js dependencies are loaded via CDN:
- p5.js core library (v1.9.4)
- p5.sound addon
- p5.play library

Python dependencies for FFT processing:
- numpy
- PIL (Pillow)

## Architecture Notes

- Each subdirectory contains a complete p5.js application with its own `index.html` and `main.js`
- FFT implementation splits computation between Python (preprocessing) and JavaScript (real-time reconstruction)
- WebWorker pattern used for heavy computation to avoid blocking the main thread
- Shader programs follow standard vertex/fragment shader architecture with p5.js WEBGL renderer