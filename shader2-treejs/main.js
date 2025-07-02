import * as THREE from 'three';

let scene, camera, renderer, mesh;
let startTime;
let ws;
let sensorData = { x: 0, y: 0, z: 0 };
let previousSensorData = { x: 0, y: 0, z: 0 };
let intensity = 0.0;

async function init() {
    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Load shaders
    const vertexShader = await new THREE.FileLoader().loadAsync('normal.vert');
    const fragmentShader = await new THREE.FileLoader().loadAsync('normal.frag');

    // Geometry
    const geometry = new THREE.SphereGeometry(2, 64, 64);

    // Material
    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            uTime: { value: 0.0 },
            uAcceleration: { value: new THREE.Vector3() },
            uIntensity: { value: 0.0 },
        },
    });

    // Mesh
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Start time
    startTime = Date.now();

    // WebSocket connection
    connectWebSocket();

    // Animation loop
    animate();

    // Event listeners
    window.addEventListener('resize', onWindowResize, false);
}

function connectWebSocket() {
    ws = new WebSocket("ws://localhost:8080");

    ws.onopen = function (event) {
        console.log("WebSocket接続が確立されました");
    };

    ws.onmessage = function (event) {
        try {
            const data = JSON.parse(event.data);
            if (data.type && data.type.includes("acc")) {
                previousSensorData = { ...sensorData };
                sensorData = {
                    x: data.x || 0,
                    y: data.y || 0,
                    z: data.z || 0,
                };
                calculateIntensity();
            }
        } catch (error) {
            console.error("センサーデータの解析エラー:", error);
        }
    };

    ws.onclose = function (event) {
        console.log("WebSocket接続が閉じられました");
        setTimeout(connectWebSocket, 5000);
    };

    ws.onerror = function (error) {
        console.error("WebSocket エラー:", error);
    };
}

function calculateIntensity() {
    const deltaX = sensorData.x - previousSensorData.x;
    const deltaY = sensorData.y - previousSensorData.y;
    const deltaZ = sensorData.z - previousSensorData.z;
    const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
    const magnitude = Math.sqrt(sensorData.x * sensorData.x + sensorData.y * sensorData.y + sensorData.z * sensorData.z);
    const newIntensity = delta * 10.0 + magnitude * 0.5;
    intensity = intensity * 0.8 + newIntensity * 0.2;
    intensity = Math.min(1.0, Math.max(0.0, intensity));
}

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = (Date.now() - startTime) / 1000.0;

    mesh.material.uniforms.uTime.value = elapsedTime;
    mesh.material.uniforms.uAcceleration.value.set(sensorData.x, sensorData.y, sensorData.z);
    mesh.material.uniforms.uIntensity.value = intensity;

    mesh.rotation.x += 0.005 + sensorData.y * 0.01;
    mesh.rotation.y += 0.005 + sensorData.x * 0.01;
    mesh.rotation.z += sensorData.z * 0.005;

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

init();