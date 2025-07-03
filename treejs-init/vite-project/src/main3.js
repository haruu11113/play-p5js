
import * as THREE from 'three'; // three.jsライブラリを全てTHREEという名前で読み込む

const canvas = document.getElementById('canvas'); // HTML上の<canvas id="canvas">要素を取得
const ctx = canvas.getContext('2d'); // 2D描画用のコンテキストを取得
canvas.width = window.innerWidth; // canvasの幅をウィンドウ幅に設定
canvas.height = window.innerHeight; // canvasの高さをウィンドウ高さに設定

const particles = []; // 粒子オブジェクトを格納する配列を初期化
const text = 'Hello, World!'; // 描画するテキストを設定
const fontSize = Math.min(canvas.width / text.length * 0.8, canvas.height * 0.3); 
// フォントサイズを計算：横幅に合わせたサイズと縦幅に合わせたサイズの小さい方を採用

ctx.font = `bold ${fontSize}px Arial`; // フォントスタイルを設定（太字・サイズ・フォント名）
ctx.fillStyle = 'white'; // テキスト描画色を白に設定
ctx.textAlign = 'center'; // テキストの水平位置を中央揃えに設定
ctx.textBaseline = 'middle'; // テキストの垂直位置を中央揃えに設定
ctx.fillText(text, canvas.width / 2, canvas.height / 2); 
// canvas中央にテキストを描画

const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height); 
// 描画したテキストのピクセルデータを取得

ctx.clearRect(0, 0, canvas.width, canvas.height); 
// 取得後にキャンバスをクリアして背景をリセット

class Particle {
    constructor(x, y, targetX, targetY) {
        this.x = Math.random() * canvas.width; 
        // 初期位置：キャンバス内のランダムなx座標
        this.y = Math.random() * canvas.height; 
        // 初期位置：キャンバス内のランダムなy座標
        this.size = Math.random() * 2 + 1; // 粒子の大きさをランダムに設定（1〜3px）
        this.targetX = targetX; // 粒子が目指すx座標（テキスト形状の位置）
        this.targetY = targetY; // 粒子が目指すy座標（テキスト形状の位置）
        this.speed = Math.random() * 0.02 + 0.01; 
        // 移動速度をランダムに設定（0.01〜0.03の範囲）
        this.velocityX = 0; // x方向の速度成分を初期化
        this.velocityY = 0; // y方向の速度成分を初期化
        this.color = `hsl(${Math.random() * 60 + 200}, 100%, 50%)`; 
        // 色相を200〜260°の範囲でランダムに設定（ブルー系のグラデーション）
    }

    update() {
        this.velocityX = (this.targetX - this.x) * this.speed; 
        // 目標位置との距離に比例してx方向の速度を計算
        this.velocityY = (this.targetY - this.y) * this.speed; 
        // 目標位置との距離に比例してy方向の速度を計算
        this.x += this.velocityX; // 位置を更新（x方向）
        this.y += this.velocityY; // 位置を更新（y方向）
    }

    draw() {
        ctx.fillStyle = this.color; // 描画色を粒子ごとの色に設定
        ctx.beginPath(); // 新しいパスを開始
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); 
        // 現在位置に円を描く（sizeが半径）
        ctx.fill(); // 円を塗りつぶす
    }
}

function init() {
    for (let y = 0; y < imageData.height; y += 5) { 
        // 取得したピクセルデータを5px間隔で走査（行）
        for (let x = 0; x < imageData.width; x += 5) { 
            // 列を5px間隔で走査
            if (imageData.data[(y * imageData.width + x) * 4 + 3] > 128) { 
                // αチャンネル（不透明度）が128以上（文字部分）の場合
                particles.push(new Particle(x, y, x, y)); 
                // 粒子を生成し、目標位置を文字のピクセル位置に設定して配列に追加
            }
        }
    }
}

function animate() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; 
    // 軌跡を残すために半透明の黒でキャンバスを塗りつぶし
    ctx.fillRect(0, 0, canvas.width, canvas.height); 
    // 背景全体を塗りつぶし

    particles.forEach(particle => { 
        // 全ての粒子に対して
        particle.update(); // 位置を更新
        particle.draw();   // 描画
    });

    requestAnimationFrame(animate); 
    // 次のフレームでanimate関数を再度呼び出し（ループ）
}

init();    // 粒子を初期化
animate(); // アニメーションを開始

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;  // ウィンドウサイズ変更時にcanvasの幅を更新
    canvas.height = window.innerHeight; // ウィンドウサイズ変更時にcanvasの高さを更新
});
