import * as THREE from 'three';

let scene, camera, renderer, meshes = [];
const NUM_SPHERES = 10; // 生成する球体の数
const SPHERE_RADIUS = 1.0; // 球体の半径
const INITIAL_SPEED = 0.05; // 初期速度
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

    // Material (for single mesh, will be used in loop)
    // const material = new THREE.ShaderMaterial({
    //     vertexShader,
    //     fragmentShader,
    //     uniforms: {
    //         uTime: { value: 0.0 },
    //         uAcceleration: { value: new THREE.Vector3() },
    //         uIntensity: { value: 0.0 },
    //     },
    // });

    // Create multiple meshes
    for (let i = 0; i < NUM_SPHERES; i++) {
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0.0 },
                uAcceleration: { value: new THREE.Vector3() },
                uIntensity: { value: 0.0 },
            },
        });
        const mesh = new THREE.Mesh(geometry, material);

        // Set random initial position
        mesh.position.x = (Math.random() - 0.5) * 10;
        mesh.position.y = (Math.random() - 0.5) * 10;
        mesh.position.z = (Math.random() - 0.5) * 5; // Keep them somewhat in front of the camera

        // Set random initial velocity
        mesh.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * INITIAL_SPEED,
            (Math.random() - 0.5) * INITIAL_SPEED,
            (Math.random() - 0.5) * INITIAL_SPEED * 0.5 // Z-axis movement can be slower
        );

        scene.add(mesh);
        meshes.push(mesh);
    }

    // Animation loop
    animate();

    // Animation loop
    animate();

    // Start time
    startTime = Date.now();

    // WebSocket connection
    connectWebSocket();

    // Animation loop
    animate();

    // Animation loop
    animate();

    // Event listeners
    window.addEventListener('resize', onWindowResize, false);

    // Animation loop
    animate();
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

    // Calculate screen boundaries
    const fovRad = (camera.fov * Math.PI) / 180;
    const viewHeight = Math.abs(camera.position.z - meshes[0].position.z) * Math.tan(fovRad / 2) * 2;
    const viewWidth = viewHeight * camera.aspect;

    const halfViewWidth = viewWidth / 2;
    const halfViewHeight = viewHeight / 2;

    meshes.forEach(mesh => {
        mesh.material.uniforms.uTime.value = elapsedTime;
        mesh.material.uniforms.uAcceleration.value.set(sensorData.x, sensorData.y, sensorData.z);
        mesh.material.uniforms.uIntensity.value = intensity;

        // Apply rotation based on sensor data (to each mesh)
        mesh.rotation.x += 0.005 + sensorData.y * 0.01;
        mesh.rotation.y += 0.005 + sensorData.x * 0.01;
        mesh.rotation.z += sensorData.z * 0.005;

        // Update position
        mesh.position.add(mesh.velocity);

        // Boundary collision detection and bounce
        if (mesh.position.x + SPHERE_RADIUS > halfViewWidth) {
            mesh.position.x = halfViewWidth - SPHERE_RADIUS;
            mesh.velocity.x *= -1;
        } else if (mesh.position.x - SPHERE_RADIUS < -halfViewWidth) {
            mesh.position.x = -halfViewWidth + SPHERE_RADIUS;
            mesh.velocity.x *= -1;
        }

        if (mesh.position.y + SPHERE_RADIUS > halfViewHeight) {
            mesh.position.y = halfViewHeight - SPHERE_RADIUS;
            mesh.velocity.y *= -1;
        } else if (mesh.position.y - SPHERE_RADIUS < -halfViewHeight) {
            mesh.position.y = -halfViewHeight + SPHERE_RADIUS;
            mesh.velocity.y *= -1;
        }

        // Z-axis boundaries (adjust as needed for your scene)
        const zMin = camera.position.z - 10; // Example: 10 units behind camera
        const zMax = camera.position.z - 1;  // Example: 1 unit in front of camera

        if (mesh.position.z + SPHERE_RADIUS > zMax) {
            mesh.position.z = zMax - SPHERE_RADIUS;
            mesh.velocity.z *= -1;
        } else if (mesh.position.z - SPHERE_RADIUS < zMin) {
            mesh.position.z = zMin + SPHERE_RADIUS;
            mesh.velocity.z *= -1;
        }
    });

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
animate();