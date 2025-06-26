# play-p5js: A Collection of Interactive Visual Experiments

This repository serves as a playground for various interactive visual experiments, primarily utilizing p5.js for creative coding and WebGL shaders for advanced graphical effects. It's a collection of small, self-contained projects demonstrating different techniques and concepts in real-time graphics.

## Features

-   **Diverse Experiments**: Explore a variety of visual effects, from FFT-based image reconstruction to complex WebGL shader animations.
-   **Interactive Demos**: Most experiments are interactive, allowing users to observe dynamic changes based on predefined logic or simulated data.
-   **Modular Structure**: Each experiment is typically contained within its own directory, making it easy to navigate and understand individual projects.
-   **Local Development Server**: Simple setup to run all experiments locally via a basic HTTP server.

## Getting Started

To run these experiments locally, you need a simple HTTP server. Python's built-in `http.server` module is recommended for quick setup.

### 1. Navigate to the Project Root

Open your terminal or command prompt and change the directory to the root of this repository:

```bash
cd /path/to/play-p5js
```

### 2. Start the Local Server

Run the following command to start a simple HTTP server on port 8000:

```bash
python -m http.server 8000
```

### 3. Access Experiments in Your Browser

Once the server is running, open your web browser and navigate to:

-   **Main Index**: `http://localhost:8000/` (This will typically show `index.html` or `main.js` in the root)
-   **Specific Experiments**: You can access individual experiments by navigating to their respective `index.html` files, for example:
    -   `http://localhost:8000/fft/index.html`
    -   `http://localhost:8000/shader/index.html`
    -   `http://localhost:8000/shader-buble/index.html`
    -   `http://localhost:8000/shader2/index.html`

## Project Structure

The repository is organized into several directories, each containing a distinct experiment or a set of related files.

```
play-p5js/
├── .gitignore               # Git ignore file
├── CLAUDE.md                # Documentation for Claude (AI agent)
├── index.html               # Main entry point (if any)
├── main.js                  # Main p5.js sketch (if any)
├── README.md                # This file
├── fft/                     # Experiments related to Fast Fourier Transform (FFT)
│   ├── coeffs_color.json
│   ├── coeffs.json
│   ├── fft_reconstruct_.py
│   ├── fft.py
│   ├── fftWorker.js
│   ├── image_reconstructed.png
│   ├── image.png
│   ├── index.html           # Entry point for FFT demo
│   ├── main.js              # p5.js sketch for FFT demo
│   └── shader/              # Shader specific to FFT
├── glsl/                    # General GLSL shader examples
│   └── adv-sample.glsl
├── shader/                  # Basic shader examples
│   ├── index.html
│   ├── main.js
│   ├── normal.frag
│   └── normal.vert
├── shader-buble/            # Bubble-like shader effect
│   ├── index.html
│   ├── main.js
│   ├── normal.frag
│   ├── normal.vert
│   └── キーボードでの操作説明.md # Keyboard operation instructions (Japanese)
├── shader-gizagiza/         # Jagged/spiky shader effect
│   ├── index.html
│   ├── main.js
│   ├── normal.frag
│   └── normal.vert
├── shader-good-cube/        # Cube shader effect (first version)
│   ├── index.html
│   ├── main.js
│   ├── normal.frag
│   ├── normal.vert
│   └── キーボードでの操作説明.md
├── shader-good-cube-2nd/    # Cube shader effect (second version)
│   ├── index.html
│   ├── main.js
│   ├── normal.frag
│   ├── normal.vert
│   └── キーボードでの操作説明.md
├── shader-tyoimaru/         # Another shader effect with server components
│   ├── index.html
│   ├── main.js
│   ├── normal.frag
│   ├── normal.vert
│   ├── package.json
│   ├── README.md
│   ├── requirements.txt
│   ├── ws_client.py
│   ├── ws_server.py
│   └── ws-server.js
├── shader2/                 # Advanced shader experiment (e.g., accelerometer data visualization)
│   ├── index.html
│   ├── main.js
│   ├── normal.frag
│   ├── normal.vert
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md            # Detailed README for this specific project
│   ├── unified-server.js
│   ├── ws-server.js
│   └── line/
├── shader2-line/            # Line-based shader effect
│   ├── index.html
│   ├── main.js
│   ├── normal.frag
│   ├── normal.vert
│   └── キーボードでの操作説明.md
└── ... (other configuration files and node_modules)
```

