let scene, camera, renderer, cube, halfWidth, halfHeight, halfZ;

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

/* アニメーションループを作成 requestAnimationFrameを使用して、ブラウザのリフレッシュレートに合わせてアニメーションを更新 */
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
        box.position.z += addZ[i];
    }
    renderer.render(scene, camera);
}


init();


var boxes = new THREE.Group();

for (let i = 0; i < 5000; i++) {
    // const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    // const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });
    const geometry = new THREE.SphereGeometry(Math.random() * 0.01, 32, 32); // ball
    // const geometry = new THREE.TextGeometry(`あ`, {
    //     font: font, // フォントを指定 (FontLoaderで読み込んだjson形式のフォント)
    //     size: 10,   // 文字のサイズを指定
    //     height: 1,  // 文字の厚さを指定
    // })
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const box = new THREE.Mesh(geometry, material);

    // ランダムな位置に配置
    // halfwidth, halfheight, halfzを使って、カメラの視野内に配置
    box.position.x = (Math.random() - 0.5) * (halfWidth * 2);
    box.position.y = (Math.random() - 0.5) * (halfHeight * 2);
    box.position.z = (Math.random() - 0.5) * (halfZ * 2);
    box.position.z = 0; // z軸は0に固定

    boxes.add(box);
}
scene.add(boxes);

// const geometry = new THREE.BoxGeometry(1, 1, 1); // cube
// const geometry = new THREE.SphereGeometry(0.5, 32, 32); // ball
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

// colorをやめ、テクスチャを使用
// const texture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/crate.gif');
// const material = new THREE.MeshBasicMaterial({ map: texture });
// cube = new THREE.Mesh(geometry, material);

// scene.add(cube);

let addX = [];
let addY = [];
let addZ = [];
for (let i = 0; i < boxes.children.length; i++) {
    // ランダムな速度を設定
    addX[i] = (Math.random() - 0.5) * 0.1;
    addY[i] = (Math.random() - 0.5) * 0.1;
    addZ[i] = (Math.random() - 0.5) * 0.1;

    // 一定の速度で移動
    // addX[i] = 0.01;
    // addY[i] = 0.01;
    // addZ[i] = 0.01;
}


animate();
