# play-p5js: A Collection of Interactive Visual Experiments

This repository serves as a playground for various interactive visual experiments, primarily utilizing p5.js, three.js, and WebGL shaders. It's a collection of small, self-contained projects demonstrating different techniques and concepts in real-time graphics. The main application is now a Vue.js project that integrates many of the previous experiments.

## Main Application: `vite-project-ts-vue`

The primary application is a Vue.js project built with Vite. It serves as a showcase for the various visual experiments.

### Running the Vue.js Application

1.  **Navigate to the project directory:**

    ```bash
    cd vite-project-ts-vue
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Run the development server:**

    ```bash
    npm run dev
    ```

    This will start the Vite development server, and you can view the application in your browser at the URL provided (usually `http://localhost:5173`).

### Available Routes

The Vue application includes the following routes, each showcasing a different visual experiment:

-   `/`: Hello World
-   `/p5js`: A p5.js sketch.
-   `/threejs`: A three.js demo.
-   `/threejs3d`: A 3D three.js demo.
-   `/threejsinit`: The demo from `treejs-init`.
-   `/shaderdemo`: A basic shader demo.
-   `/shaderbuble`: A bubble-like shader effect.
-   `/shadergizagiza`: A jagged/spiky shader effect.
-   `/shadergoodcube`: A cube shader effect.
-   `/shadergoodcube2nd`: A second version of the cube shader effect.
-   `/shadertyoimaru`: A shader effect with smooth curves.
-   `/shader2line`: A line-based shader effect.

## Other Experiments

This repository also contains other standalone experiments.

### `shader2-treejs` and `treejs-init` (npm-based)

These projects are based on Node.js and can be run using `npm`.

1.  **Navigate to the project directory:**

    ```bash
    cd shader2-treejs # or treejs-init
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Start the server (if applicable):**

    Check the `package.json` for the appropriate start command, which is usually:

    ```bash
    npm start
    ```

### Older p5.js sketches (Python HTTP Server)

For the remaining standalone p5.js sketches, you can use Python's built-in HTTP server.

1.  **Navigate to the project root directory:**

    ```bash
    cd /path/to/play-p5js
    ```

2.  **Start the server:**

    ```bash
    python -m http.server 8000
    ```

3.  **Access the experiments in your browser:**

    Open your browser and navigate to the `index.html` file of the desired experiment, for example:

    -   `http://localhost:8000/shader2/index.html`

## Project Structure

```
play-p5js/
├── vite-project-ts-vue/     # Main Vue.js application
│   ├── src/
│   │   ├── pages/           # Vue components for each visual experiment
│   │   │   ├── P5JsDemo.vue
│   │   │   ├── ThreeJsInitDemo.vue
│   │   │   ├── ShaderBubleDemo.vue
│   │   │   └── ...
│   │   ├── assets/          # Shader files (.frag, .vert)
│   │   └── router.ts        # Vue router configuration
│   ├── package.json
│   └── ...
├── shader2-treejs/          # Standalone three.js project
│   ├── main.js
│   ├── package.json
│   └── ...
├── treejs-init/             # Standalone three.js project
│   ├── main.js
│   ├── package.json
│   └── ...
├── shader-buble/
├── shader-gizagiza/
├── shader-good-cube/
├── shader-good-cube-2nd/
├── shader-tyoimaru/
├── shader2/
├── shader2-line/
├── ... (other legacy experiment folders)
├── README.md                # This file
└── ... (other configuration files)
```