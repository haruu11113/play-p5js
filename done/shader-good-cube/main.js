let normalShader;
let startTime;

// パラメータの初期値
let params = {
  circleCount: 10,       // 円の数（1〜10）- floatに変更
  cornerSharpness: 2.5,   // 角の鋭さ（0.5〜3.0、小さいほど丸く、大きいほど尖る）
  noiseAmount: 0.3,       // ノイズの強さ（0.0〜1.0）
  timeScale: 2.0,         // 時間スケール（アニメーション速度、0.1〜2.0）
  colorTemperature: 0.7,  // 色温度（0.0〜1.0、低いほど寒色、高いほど暖色）
  colorSaturation: 0.5,   // 彩度（0.0〜1.0）
  colorBrightness: 0.8,   // 明度（0.0〜1.0）
  edgeIntensity: 1,     // エッジの強調度（0.0〜1.0）
  rotationSpeed: 2      // 回転速度（0.0〜2.0）
};

// UIコントロールの表示状態
let showControls = true;

function preload() {
  // シェーダーファイルを読み込む
  normalShader = loadShader('normal.vert', 'normal.frag');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
  
  // 開始時間を記録
  startTime = millis();
  
  // UIコントロールの作成
  createControls();
}

function draw() {
  // 背景を黒に設定
  background(0);
  
  // シェーダーを設定
  shader(normalShader);
  
  // 経過時間を計算（秒単位）
  let elapsedTime = (millis() - startTime) / 1000.0;
  
  // シェーダーにパラメータを渡す
  normalShader.setUniform('uTime', elapsedTime);
  normalShader.setUniform('uCircleCount', params.circleCount);
  normalShader.setUniform('uCornerSharpness', params.cornerSharpness);
  normalShader.setUniform('uNoiseAmount', params.noiseAmount);
  normalShader.setUniform('uTimeScale', params.timeScale);
  normalShader.setUniform('uColorTemperature', params.colorTemperature);
  normalShader.setUniform('uColorSaturation', params.colorSaturation);
  normalShader.setUniform('uColorBrightness', params.colorBrightness);
  normalShader.setUniform('uEdgeIntensity', params.edgeIntensity);
  
  // 中心に移動
  translate(0, 0, 0);
  
  // フレーム数に基づいてY軸周りに回転（回転速度を適用）
  rotateY(frameCount * 0.01 * params.rotationSpeed);
  
  // フレーム数に基づいてX軸周りに回転（回転速度を適用）
  rotateX(frameCount * 0.01 * params.rotationSpeed);
  
  // 不規則な形状を描画するための球体（シェーダーで変形される）
  sphere(200);
  
  // UIコントロールを表示
  if (showControls) {
    displayControls();
  }
}

// ウィンドウサイズが変更されたときにキャンバスをリサイズ
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// キーボード入力の処理
function keyPressed() {
  // 'h'キーでUIコントロールの表示/非表示を切り替え
  if (key === 'h' || key === 'H') {
    showControls = !showControls;
  }
}

// UIコントロールの作成
function createControls() {
  // UIコントロールはdisplayControls関数で描画するため、ここでは何もしない
}

// UIコントロールの表示
function displayControls() {
  // WebGLの描画状態を保存
  push();
  
  // カメラをリセット
  resetMatrix();
  
  // 2Dモードに切り替え（camera()の代わりにortho()を使用）
  ortho();
  noLights();
  
  // UIの背景
  fill(0, 0, 0, 180);
  noStroke();
  rectMode(CORNER);
  rect(10, 10, 250, 350);
  
  // テキスト設定
  fill(255);
  textSize(14);
  textAlign(LEFT, TOP);
  
  // タイトル
  text("シェーダーパラメータ (Hキーで表示/非表示)", 20, 20);
  
  // パラメータ一覧
  let y = 50;
  const lineHeight = 30;
  
  text(`円の数: ${params.circleCount.toFixed(0)}`, 20, y);
  y += lineHeight;
  
  text(`角の鋭さ: ${params.cornerSharpness.toFixed(2)}`, 20, y);
  y += lineHeight;
  
  text(`ノイズの強さ: ${params.noiseAmount.toFixed(2)}`, 20, y);
  y += lineHeight;
  
  text(`アニメーション速度: ${params.timeScale.toFixed(2)}`, 20, y);
  y += lineHeight;
  
  text(`色温度: ${params.colorTemperature.toFixed(2)}`, 20, y);
  y += lineHeight;
  
  text(`彩度: ${params.colorSaturation.toFixed(2)}`, 20, y);
  y += lineHeight;
  
  text(`明度: ${params.colorBrightness.toFixed(2)}`, 20, y);
  y += lineHeight;
  
  text(`エッジの強調度: ${params.edgeIntensity.toFixed(2)}`, 20, y);
  y += lineHeight;
  
  text(`回転速度: ${params.rotationSpeed.toFixed(2)}`, 20, y);
  y += lineHeight;
  
  // 操作説明
  text("※パラメータはコンソールから変更可能", 20, y);
  y += lineHeight;
  text("例: params.circleCount = 8.0;", 20, y);
  
  // WebGLの描画状態を復元
  pop();
}

// マウスドラッグでの回転速度調整
function mouseDragged() {
  // 画面の左半分をドラッグすると回転速度が変わる
  if (mouseX < width / 2) {
    params.rotationSpeed = map(mouseY, 0, height, 2.0, 0.0);
    params.rotationSpeed = constrain(params.rotationSpeed, 0.0, 2.0);
  }
  // 画面の右半分をドラッグすると色温度が変わる
  else {
    params.colorTemperature = map(mouseY, 0, height, 1.0, 0.0);
    params.colorTemperature = constrain(params.colorTemperature, 0.0, 1.0);
  }
}

// マウスホイールでの円の数調整
function mouseWheel(event) {
  // マウスホイールで円の数を調整
  params.circleCount += event.delta > 0 ? -1.0 : 1.0;
  params.circleCount = constrain(params.circleCount, 1.0, 10.0);
  return false; // ページスクロールを防止
}
