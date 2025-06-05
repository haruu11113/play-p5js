let normalShader;
let startTime;

// パラメータの初期値
let params = {
  circleCount: 5,        // 円の数（1〜10）- floatに変更
  cornerSharpness: 1.2,   // 角の鋭さ（0.5〜3.0、小さいほど丸く、大きいほど尖る）
  noiseAmount: 0.2,       // ノイズの強さ（0.0〜1.0）
  timeScale: 1.0,         // 時間スケール（アニメーション速度、0.1〜2.0）
  colorTemperature: 0.6,  // 色温度（0.0〜1.0、低いほど寒色、高いほど暖色）
  colorSaturation: 0.6,   // 彩度（0.0〜1.0）
  colorBrightness: 0.9,   // 明度（0.0〜1.0）
  edgeIntensity: 0.7,     // エッジの強調度（0.0〜1.0）
  rotationSpeed: 0.3      // 回転速度（0.0〜2.0）
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
  
  // WebGLレンダラーを取得
  let gl = this._renderer.GL;
  
  // 透明度を有効にする
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  
  // 開始時間を記録
  startTime = millis();
  
  // UIコントロールの作成
  createControls();
}

function draw() {
  // 背景を暗めの青に設定（泡が浮かぶ水中のような雰囲気）
  background(5, 15, 25);
  
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
  
  // 複数の泡を描画
  drawBubbles(elapsedTime);
  
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

// 泡の情報を格納する配列
let bubbles = [];

// 泡の初期化
function initBubbles() {
  bubbles = [];
  // 15個の泡を生成（より多くの泡で密度を上げる）
  for (let i = 0; i < 15; i++) {
    bubbles.push({
      size: random(30, 150), // サイズ範囲を調整
      x: random(-width/3, width/3),
      y: random(-height/3, height/3),
      z: random(-300, 300),
      speedY: random(-0.4, -0.05), // 上昇速度（負の値で上に移動）
      rotX: random(TWO_PI),
      rotY: random(TWO_PI),
      rotSpeedX: random(-0.005, 0.005), // 回転速度を少し遅く
      rotSpeedY: random(-0.005, 0.005),
      colorOffset: random(0, 1) // 色のバリエーション用
    });
  }
}

// 複数の泡を描画
function drawBubbles(time) {
  // 泡が初期化されていなければ初期化
  if (bubbles.length === 0) {
    initBubbles();
  }
  
  // 各泡を描画（奥から手前の順に描画して半透明の重なりを適切に表示）
  // 泡を奥行きでソート
  bubbles.sort((a, b) => b.z - a.z);
  
  // 各泡を描画
  for (let i = 0; i < bubbles.length; i++) {
    let b = bubbles[i];
    
    // 泡の位置を更新（ゆっくりと上昇）
    b.y += b.speedY;
    
    // 左右にわずかに揺れる動き（サイン波）
    b.x += sin(time * 0.5 + i) * 0.1;
    
    // 回転を更新
    b.rotX += b.rotSpeedX * params.rotationSpeed;
    b.rotY += b.rotSpeedY * params.rotationSpeed;
    
    // 画面外に出たら下から再登場
    if (b.y < -height/2 - b.size) {
      b.y = height/2 + b.size;
      b.x = random(-width/3, width/3);
      b.z = random(-300, 300);
      b.size = random(30, 150); // サイズも再設定
    }
    
    push();
    // 泡の位置に移動
    translate(b.x, b.y, b.z);
    
    // 泡を回転
    rotateX(b.rotX);
    rotateY(b.rotY);
    
    // 各泡ごとに少し色を変える
    let tempOffset = 0.1 * sin(time * 0.2 + b.colorOffset * TWO_PI);
    normalShader.setUniform('uColorTemperature', params.colorTemperature + tempOffset);
    
    // 泡を描画
    sphere(b.size);
    pop();
  }
}
