<script setup lang="ts">

import { PerspectiveCamera, Scene, WebGLRenderer, Vector3 } from "three";
import { CanvasTexture, Color, MathUtils, BufferGeometry, BufferAttribute } from "three";
import { PointsMaterial, AdditiveBlending, Points } from 'three';

let scene, camera, renderer, points;
let geometry, positions, targetPositions, speeds, colors, sizes;

// マウスの位置と速度を保存する変数
let prevMouseX = 0;
let prevMouseY = 0;
// let mouseVelocityX = 0;
// let mouseVelocityY = 0;



/**
 * 初期化処理をまとめて実行する関数。
 * シーン・カメラ・レンダラー・パーティクルなどを初期化。
 */
const init = () => {
    /**
     * three.jsのシーン・カメラ・レンダラーを初期化する。
     */
    const initScene = () => {
        let canvasContainer: Element = document.getElementById('canvas'); // 本当にこれでいいのか?
        scene = new Scene();
        camera = new PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.z = 500;
        renderer = new WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.autoClear = false;
        canvasContainer.appendChild(renderer.domElement);
    };
    initScene();

    /**
     * ウィンドウリサイズ時にカメラとレンダラーのサイズを更新する。
     */
    const onWindowResize = () => {
        let canvasContainer = document.getElementById('canvas'); // 本当にこれでいいのか?
        camera.aspect = canvasContainer.innerWidth / canvasContainer.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvasContainer.innerWidth, canvasContainer.innerHeight);
    };
    // ウィンドウリサイズ時のイベントハンドラを登録する。
    window.addEventListener("resize", onWindowResize);

    /**
     * マウス移動時にマウスの位置と速度を計算する。
     */
    const onMouseMove = (event) => {
        // マウス座標をワールド座標に変換
        const vector = new Vector3(
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
};
init();


/** ---------------------------------
 * 設計方針
 * 1. パーティクルの初期位置・色・速度などの配列を初期化し、geometryを生成する。
 * 2. パーティクル用のPointsMaterialを生成する。
 * 3. パーティクルをシーンに追加する。
 * 4. アニメーションループを実行する。
 * 5. パーティクルの現在位置をターゲット位置へ補間して更新する。
 * 6. パーティクルを描画する。
 * ---------------------------------*/


/**
 * パーティクル(点)の形状を整形
 * @returns {CanvasTexture} 円形スプライトのテクスチャ
 */
const createSpriteTexture = () => {
    const spriteCanvas = document.createElement("canvas");
    spriteCanvas.width = 64;
    spriteCanvas.height = 64;
    const sc = spriteCanvas.getContext("2d");
    sc.fillStyle = "white";
    sc.beginPath();
    // x座標, y座標, 半径, 開始角度, 終了角度
    sc.arc(32, 32, 30, 0, Math.PI * 2);
    sc.fill();
    return new CanvasTexture(spriteCanvas);
};
const spriteTexture = createSpriteTexture();


/**
 * テキストの輪郭をcanvasで描画し、パーティクル配置用の座標配列を生成する。
 * @param {string} text - 表示するテキスト
 * @returns {{ pointsArr: number[] }} テキスト輪郭上の点座標配列
 */
const createTextOutlineCanvas = (text) => {
    const textCanvas = document.createElement('canvas');
    textCanvas.width = 1024;
    textCanvas.height = 256;
    const ctx2 = textCanvas.getContext("2d");
    const fontSize = Math.min(
        (textCanvas.width / text.length) * 1.0,
        textCanvas.height * 1.0
    );
    ctx2.fillStyle = "white";
    ctx2.font = `bold ${fontSize}px Arial`;
    ctx2.textAlign = "center";
    ctx2.textBaseline = "middle";
    ctx2.fillText(text, textCanvas.width / 2, textCanvas.height / 2);
    const imgData = ctx2.getImageData(
        0,
        0,
        textCanvas.width,
        textCanvas.height
    ).data;
    const pointsArr = [];
    for (let y = 0; y < textCanvas.height; y += 3) {
        for (let x = 0; x < textCanvas.width; x += 3) {
            if (imgData[(y * textCanvas.width + x) * 4 + 3] > 128) {
                const vx = x - textCanvas.width / 2;
                const vy = textCanvas.height / 2 - y;
                pointsArr.push(vx, vy, 0);
            }
        }
    }
    return { pointsArr };
};
const { pointsArr } = createTextOutlineCanvas(`あ`);


/**
 * パーティクルの初期位置・色・速度などの配列を初期化し、geometryを生成する。
 * @param {number[]} pointsArr - パーティクルのターゲット座標配列
 */
const initParticleData = (pointsArr) => {
    const count = pointsArr.length / 3;
    targetPositions = new Float32Array(pointsArr);
    positions = new Float32Array(pointsArr.length);
    speeds = new Float32Array(count);
    colors = new Float32Array(count * 3);
    sizes = new Float32Array(count);
    const base = new Color(0x00aaff);
    const hsl = {};
    base.getHSL(hsl);
    for (let i = 0; i < count; i++) {
        // 位置調整
        positions[3 * i] = (Math.random() - 0.5) * window.innerWidth; // 位置調整
        positions[3 * i + 1] = (Math.random() - 0.5) * window.innerHeight; // 位置調整
        positions[3 * i + 2] = (Math.random() - 0.5) * 500; // 高さ調整

        // 速度調整
        speeds[i] = Math.random() * 0.02 + 0.03; // 速度調整

        // 色調整 (h:色相, s:彩度, l:明度)
        const h = hsl.h + (Math.random() - 0.5) * 0.1;
        const s = MathUtils.clamp(
            hsl.s + (Math.random() - 0.5) * 0.3,
            0,
            1
        );
        const l = MathUtils.clamp(
            hsl.l + (Math.random() - 0.5) * 0.3,
            0,
            1
        );
        const c = new Color().setHSL(h, s, l);
        colors[3 * i] = c.r;
        colors[3 * i + 1] = c.g;
        colors[3 * i + 2] = c.b;

        // サイズ調整
        sizes[i] = Math.random() * 12 + 2;
    }

    geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("color", new BufferAttribute(colors, 3));
    geometry.setAttribute("size", new BufferAttribute(sizes, 1));
};
initParticleData(pointsArr);


/**
 * パーティクル用のPointsMaterialを生成する。
 * mapを使い、文字(spriteTexture)の形状
 * @param {Texture} spriteTexture - パーティクルのスプライトテクスチャ
 * @returns {PointsMaterial} PointsMaterialインスタンス
 */
const createPointsMaterial = (spriteTexture) => {
    return new PointsMaterial({
        size: 3, // 点サイズを小さく
        map: spriteTexture,
        transparent: true,
        alphaTest: 0.3,
        vertexColors: true,
        blending: AdditiveBlending,
        depthTest: false,
        depthWrite: false,
    });
};
const material = createPointsMaterial(spriteTexture);


// パーティクルをシーンに追加
points = new Points(geometry, material);
scene.add(points);


let hasArrived = false; // グローバルで一度だけログを出すためのフラグ


/**
 * アニメーションループ。パーティクルの更新と描画を行う。
 */
const animate = () => {
    requestAnimationFrame(animate); // アニメーションループ
    // renderer.clearDepth(); // 深度バッファをクリア

    /**
     * パーティクルの現在位置をターゲット位置へ補間して更新する。
     */
    const updateParticles = () => {
        const pos = geometry.attributes.position.array;
        for (let i = 0, idx = 0; i < pos.length; i += 3, idx++) {
            const sp = speeds[idx];

            // mouseの周辺をパーティクルが避けるようにする
            // ターゲット位置を取得
            let distane = Math.sqrt(
                (pos[i] - prevMouseX) ** 2 + (pos[i + 1] - prevMouseY) ** 2
            );
            if (distane < 20) {
                pos[i] += (pos[i] - prevMouseX) * (Math.random() + 0.5) ;
                pos[i + 1] += (pos[i + 1] - prevMouseY) * (Math.random() + 0.8);
            }

            // ターゲット位置へ補間
            pos[i] += (targetPositions[i] - pos[i]) * sp;
            pos[i + 1] += (targetPositions[i + 1] - pos[i + 1]) * sp;
            pos[i + 2] += (targetPositions[i + 2] - pos[i + 2]) * sp;
        }
    };
    updateParticles();

    // ここから到達判定
    if (!hasArrived) {
        let allArrived = true;
        const pos = geometry.attributes.position.array;
        for (let i = 0; i < pos.length; i += 3) {
            const dx = targetPositions[i] - pos[i];
            const dy = targetPositions[i + 1] - pos[i + 1];
            const dz = targetPositions[i + 2] - pos[i + 2];
            const distSq = dx * dx + dy * dy + dz * dz;
            if (distSq > 1) { // 1ピクセル未満なら到達とみなす
                allArrived = false;
                break;
            }
        }
        if (allArrived) {
            hasArrived = true;
            console.log("全パーティクルが所定の位置に到達しました");
            // 画面スクロール
            // window.scrollTo({
            //     top: document.getElementById("home").offsetTop,
            //     behavior: "smooth"
            // });
        }
    }

    // パーティクルの位置を更新
    geometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera); // 描画
};
animate();
</script>

<template>
    <div id="canvas">a</div>
</template>

<style scoped>
    body {
        margin: 0;
        /* overflow: hidden; */
        /* background-color: #000; */
        background-color: #ffffff;
    }
    #canvas {
        border: solid 1px red;
        width: 100vw;
        height: 100vh;
        color: black;
        background-color: #ffffff;
    }
    #home {
        width: 100%;
        height: 100vh;
    }
</style>
