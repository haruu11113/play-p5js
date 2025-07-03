import * as THREE from 'three';
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

let scene, camera, renderer, halfWidth, halfHeight, halfZ;

// マウスの位置と速度を保存する変数
let prevMouseX = 0;
let prevMouseY = 0;
let mouseVelocityX = 0;
let mouseVelocityY = 0;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    camera.position.z = 5;

    // 表示領域を計算
    const calculateVisibleArea = () => {
        const distance = camera.position.z;
        const vFov = (camera.fov * Math.PI) / 180;
        const visibleHeight = 2 * Math.tan(vFov / 2) * distance;
        const visibleWidth = visibleHeight * camera.aspect;
        halfWidth = visibleWidth / 2;
        halfHeight = visibleHeight / 2;
        halfZ = distance / 2;
    };
    calculateVisibleArea();

    // ウィンドウリサイズ時の処理
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        calculateVisibleArea(); // リサイズ後に表示領域を再計算
    }
    window.addEventListener('resize', onWindowResize, false);

    // マウス移動時の処理
    function onMouseMove(event) {
        // マウス座標をワールド座標に変換
        const vector = new THREE.Vector3(
            (event.clientX / window.innerWidth) * 2 - 1,
            - (event.clientY / window.innerHeight) * 2 + 1,
            0.5
        );
        vector.unproject(camera);
        const dir = vector.sub(camera.position).normalize();
        const distance = -camera.position.z / dir.z;
        const pos = camera.position.clone().add(dir.multiplyScalar(distance));

        // 最初のマウス移動では、速度を計算せずに現在位置を保存
        if (prevMouseX === 0 && prevMouseY === 0) {
            prevMouseX = pos.x;
            prevMouseY = pos.y;
        }

        // マウスの移動速度を計算
        mouseVelocityX = pos.x - prevMouseX;
        mouseVelocityY = pos.y - prevMouseY;

        // 現在のマウス位置を保存
        prevMouseX = pos.x;
        prevMouseY = pos.y;
    }
    window.addEventListener('mousemove', onMouseMove, false);
}

init();

function animate() {
    requestAnimationFrame(animate);

    mouseVelocityX *= 0.5;
    mouseVelocityY *= 0.5;

    for (let i = 0; i < boxes.children.length; i++) {
        const box = boxes.children[i];

        // 壁での反射（初期値の移動に対する処理）
        if (box.position.x > halfWidth || box.position.x < -halfWidth) {
            addX[i] *= -1 * 0.99;
        }
        if (box.position.y > halfHeight || box.position.y < -halfHeight) {
            addY[i] *= -1 * 0.99;
        }
        if (box.position.z > halfZ || box.position.z < -halfZ) {
            addZ[i] *= -1 * 0.99;
        }

        // 位置を更新（初期値の移動 + マウスによる移動）
        addX[i] += mouseVelocityX * 0.01;
        addY[i] += mouseVelocityY * 0.01;

        addX[i] *= 0.999; // 徐々に減衰
        addY[i] *= 0.999; // 徐々に減衰

        box.position.x += addX[i];
        box.position.y += addY[i];
        // box.position.z += addZ[i];
    }
    renderer.render(scene, camera);
}

// フォントの読み込みと文字の生成
const fontLoader = new FontLoader();
const font = await fontLoader.loadAsync(`/fonts/ZenKakuGothicNew_Regular.json`);

var boxes = new THREE.Group();
for (let i = 0; i < 100; i++) {
    const geometry = new TextGeometry(`あ`, {
        font: font,
        size: 18 * (Math.random() + 0.9),
        depth: 0,
    });
    const material = new THREE.MeshBasicMaterial();
    const box = new THREE.Mesh(geometry, material);

    box.scale.set(0.01, 0.01, 0.1);
    box.position.x = (Math.random() - 0.5) * (halfWidth * 2);
    box.position.y = (Math.random() - 0.5) * (halfHeight * 2);
    box.position.z = 0;

    boxes.add(box);
}
scene.add(boxes);

// 各文字の初期速度
let addX = [];
let addY = [];
let addZ = [];
for (let i = 0; i < boxes.children.length; i++) {
    addX[i] = (Math.random() - 0.5) * 0.07;
    addY[i] = (Math.random() - 0.5) * 0.07;
    addZ[i] = (Math.random() - 0.5) * 0.07;
}

animate();
