let normalShader;
let startTime;

function preload() {
  // シェーダーファイルを読み込む
  normalShader = loadShader('normal.vert', 'normal.frag');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
  shader(normalShader);
  frameRate(30);
  
  // 開始時間を記録
  startTime = millis();
}

function draw() {
  // 背景を黒に設定
  background(0);
  
  // 経過時間を計算（秒単位）
  let elapsedTime = (millis() - startTime) / 1000.0;
  
  // シェーダーに時間を渡す
  normalShader.setUniform('uTime', elapsedTime);
  
  // 中心に移動
  translate(0, 0, 0);
  
  // フレーム数に基づいてY軸周りに回転
  rotateY(frameCount * 0.01);
  
  // フレーム数に基づいてX軸周りに回転
  rotateX(frameCount * 0.01);
  
  // 不規則な形状を描画するための球体（シェーダーで変形される）
  sphere(200);
}

// ウィンドウサイズが変更されたときにキャンバスをリサイズ
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
