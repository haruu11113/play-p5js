let scene, camera, renderer, cube, halfWidth, halfHeight;

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

let addX = 0.05;
let addY = 0.05;
/*
 * アニメーションループを作成
 * requestAnimationFrameを使用して、ブラウザのリフレッシュレートに合わせてアニメーションを更新
 */
function animate() {

    requestAnimationFrame(animate);

    // 回転
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;


    // 位置移動(壁に当たったら反射する)
    if (cube.position.x > halfWidth ||
        cube.position.x < -halfWidth
    ) {
        addX = -1 * addX 
    }
    if (cube.position.y > halfHeight ||
        cube.position.y < -halfHeight
    ) {
        addY = -1 * addY 
    }
    cube.position.x += addX;
    cube.position.y += addY;

    renderer.render(scene, camera);
}


init();
// const geometry = new THREE.BoxGeometry(1, 1, 1); // cube
const geometry = new THREE.SphereGeometry(0.5, 32, 32); // ball
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

// colorをやめ、テクスチャを使用
// const texture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/crate.gif');
// const material = new THREE.MeshBasicMaterial({ map: texture });

cube = new THREE.Mesh(geometry, material);

scene.add(cube);
animate();
