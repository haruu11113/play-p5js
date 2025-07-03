import * as THREE from 'three';
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

let scene, camera, renderer, halfWidth, halfHeight, halfZ;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // antialias: ギザギザがなくなる？
    renderer = new THREE.WebGLRenderer({ antialias: true });
    // Set the size of the renderer to match the window dimensions
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 見えないのでカメラ位置を動かす
    camera.position.z = 5;

    // 表示領域の計算
    // カメラからCubeまでの距離
    const distance = camera.position.z;
    // 視野角をラジアンに変換
    const vFov = (camera.fov * Math.PI) / 180;
    // 距離distanceにおける表示領域の高さ
    const visibleHeight = 2 * Math.tan(vFov / 2) * distance;
    // 距離distanceにおける表示領域の幅
    const visibleWidth = visibleHeight * camera.aspect;
    
    // 中心から端までの距離
    halfWidth = visibleWidth / 2;
    halfHeight = visibleHeight / 2;
    halfZ = distance / 2;

    /*
     * ウィンドウのリサイズイベントを監視
     * ウィンドウのサイズが変更されたときにカメラのアスペクト比とレンダラーのサイズを更新
     */
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onWindowResize, false);
}

init();

/* 
 * アニメーションループを作成 requestAnimationFrameを使用して、
 * ブラウザのリフレッシュレートに合わせてアニメーションを更新
 */
function animate() {
    requestAnimationFrame(animate);

    for (let i = 0; i < boxes.children.length; i++) {
        const box = boxes.children[i];
        // box.rotation.x += 0.01;
        // box.rotation.y += 0.01;

        // 位置移動(壁に当たったら反射する)
        if (box.position.x > halfWidth || box.position.x < -halfWidth) {
            addX[i] = -1 * addX[i]; 
        }
        if (box.position.y > halfHeight || box.position.y < -halfHeight) {
            addY[i] = -1 * addY[i]; 
        }
        if (box.position.z > halfZ || box.position.z < -halfZ) {
            addZ[i] = -1 * addZ[i]; 
        }

        box.position.x += addX[i];
        box.position.y += addY[i];
        // box.position.z += addZ[i];
    }
    renderer.render(scene, camera);
}

// フォントローダー
// フォントを読み込む
const fontLoader = new FontLoader();
const font = await fontLoader.loadAsync(`/fonts/droid_sans_mono_regular.typeface.json`);
// const font = await fontLoader.loadAsync(`/fonts/NotoSansJP-VariableFont_wght1751526439.json`);
// const font = await fontLoader.loadAsync(`/fonts/ZenKakuGothicNew-Light1751526874.json`);

var boxes = new THREE.Group();
for (let i = 0; i < 1000; i++) {
    const geometry = new TextGeometry(`Q`, {
        font: font, // フォントを指定 (FontLoaderで読み込んだjson形式のフォント)
        size: 14*(Math.random() + 0.5),   // 文字のサイズを指定
        depth: 0,
    })
    const material = new THREE.MeshBasicMaterial();
    const box = new THREE.Mesh(geometry, material);

    // box.position.set(-0.75, 0, 0);   // Meshの位置を設定
    box.scale.set(0.01, 0.01, 0.1); // Meshの拡大縮小設定
    // ランダムな位置に配置
    // halfwidth, halfheight, halfzを使って、カメラの視野内に配置
    box.position.x = (Math.random() - 0.5) * (halfWidth * 2);
    box.position.y = (Math.random() - 0.5) * (halfHeight * 2);
    // box.position.z = (Math.random() - 0.5) * (halfZ * 2);
    box.position.z = 0; // z軸は0に固定

    boxes.add(box);
}
scene.add(boxes);

let addX = [];
let addY = [];
let addZ = [];
for (let i = 0; i < boxes.children.length; i++) {
    // ランダムな速度を設定
    addX[i] = (Math.random() - 0.5) * 0.1;
    addY[i] = (Math.random() - 0.5) * 0.1;
    addZ[i] = (Math.random() - 0.5) * 0.1;
}

animate();
