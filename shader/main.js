let normalShader;

// let logLength = 15;
// let mouseLogX = [];
// let mouseLogY = [];

function preload() {
  // シェーダーファイルを読み込む
  normalShader = loadShader('normal.vert', 'normal.frag');
  // for (let i = 1; i <logLength; i++) {
    // mouseLogX.push(mouseX);
    // mouseLogY.push(mouseY);
  // }
}

function setup() {
//   createCanvas(600, 600, WEBGL);
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
  shader(normalShader);
  frameRate(30);

  // 複数の球体を配置するためのループ
  // for (let i = -1; i <= 1; i++) {
    // for (let j = -1; j <= 1; j++) {
      // push();
      // translate(i * 300, j * 300, 0); // 球体を異なる位置に配置
      // sphere(250); // 半径100の球体を描画
      // pop();
    // }
  // }
  sphere(200);
}

function draw() {
  // let x = mouseLogX[0];
  // let y = mouseLogY[0];
  // mouseLogX.push(mouseX);
  // mouseLogY.push(mouseY);

  // // 配列の長さが画面幅を超えないように先頭を削除
  // if (mouseLogX.length >= logLength) {
  //   mouseLogX.shift();
  //   mouseLogY.shift();
  // }

  // 背景を黒に設定
  background(0);
  // マウスの位置を中心に移動
  translate(-10, 10, [0]); // translate(x, y, [z])
  // translate(x - width / 2, y - height / 2);
  // フレーム数に基づいてY軸周りに回転
  rotateY(frameCount * 0.01);
  // フレーム数に基づいてX軸周りに回転
  rotateX(frameCount * 0.01);
  // 半径200の球体を描画
  sphere(200);

  // // 複数の球体を配置するためのループ
  // for (let i = -1; i <= 1; i++) {
  //   for (let j = -1; j <= 1; j++) {
  //     push();
  //     translate(i * 300, j * 300, 0); // 球体を異なる位置に配置
  //     rotateY(frameCount * 0.01);
  //     rotateX(frameCount * 0.01);
  //     sphere(250); // 半径100の球体を描画
  //     pop();
  //   }
  // }
}