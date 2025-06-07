let normalShader;
let startTime;

// パラメータの初期値
let params = {
  circleCount: 8.0,        // 円の数（1〜10）- 画面サイズに応じて自動調整される
  cornerSharpness: 1.5,   // 角の鋭さ（0.5〜3.0、小さいほど丸く、大きいほど尖る）
  noiseAmount: 1.5,       // ノイズの強さ（0.0〜2.0）- 複雑さを増すために範囲拡大
  timeScale: 0.2,         // 時間スケール（アニメーション速度、0.1〜2.0）
  colorTemperature: 0.5,  // 色温度（0.0〜1.0、低いほど寒色、高いほど暖色）
  colorSaturation: 0.8,   // 彩度（0.0〜1.0）
  colorBrightness: 1.0,   // 明度（0.0〜1.0）
  edgeIntensity: 1.0,     // エッジの強調度（0.0〜1.0）
  rotationSpeed: 1.8,     // 回転速度（0.0〜2.0）
  movementSpeed: 0.5      // 移動速度（0.1〜3.0）- 初期値を遅くして滑らかに
};

// 画面サイズに基づいて円の数を計算する関数
function calculateCircleCount() {
  // 画面の面積に基づいて計算
  const screenArea = windowWidth * windowHeight;
  // 基準となる面積（1920x1080の場合）
  const referenceArea = 1920 * 1080;
  
  // 面積の比率に基づいて円の数を計算
  // 小さい画面では少なく、大きい画面では多く
  let count = 3.0 + (screenArea / referenceArea) * 7.0;
  
  // 1.0〜10.0の範囲に制限
  return constrain(count, 1.0, 10.0);
}

// UIコントロールの表示状態
let showControls = true;

function preload() {
  // シェーダーファイルを読み込む
  normalShader = loadShader('normal.vert', 'normal.frag');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  
  // ワイヤーフレーム表示のための設定
  stroke(255); // 線の色を白に
  strokeWeight(1); // 線の太さ
  noFill(); // 塗りつぶしなし
  
  // WebGLレンダラーを取得
  let gl = this._renderer.GL;
  
  // 透明度を有効にする
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  
  // 画面サイズに基づいて円の数を設定
  params.circleCount = calculateCircleCount();
  
  // 開始時間を記録
  startTime = millis();
  
  // UIコントロールの作成
  createControls();
}

function draw() {
  // 背景を黒に設定（線が目立つように）
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
  normalShader.setUniform('uResolution', [width, height]);
  
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
  
  // 画面サイズに基づいて円の数を再計算
  params.circleCount = calculateCircleCount();
  
  // 泡を再初期化して画面サイズに合わせた数に調整
  initBubbles();
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
  rect(10, 10, 250, 410); // 高さを増やして新しい情報を表示するスペースを確保
  
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
  
  text(`移動速度: ${params.movementSpeed.toFixed(2)}`, 20, y);
  y += lineHeight;
  
  // 泡の数を表示
  text(`泡の数: ${bubbles.length}個`, 20, y);
  y += lineHeight;
  
  // フレームレートを表示
  text(`フレームレート: ${frameRate().toFixed(1)} FPS`, 20, y);
  y += lineHeight;
  
  // 操作説明
  text("※パラメータはコンソールから変更可能", 20, y);
  y += lineHeight;
  text("例: params.circleCount = 8.0;", 20, y);
  
  // WebGLの描画状態を復元
  pop();
}

// マウスドラッグでのパラメータ調整
function mouseDragged() {
  // 画面を3分割して異なるパラメータを調整
  if (mouseX < width / 3) {
    // 左側1/3: 回転速度
    params.rotationSpeed = map(mouseY, 0, height, 2.0, 0.0);
    params.rotationSpeed = constrain(params.rotationSpeed, 0.0, 2.0);
  } 
  else if (mouseX < 2 * width / 3) {
    // 中央1/3: 移動速度
    params.movementSpeed = map(mouseY, 0, height, 1.5, 0.1);  // 最大値を下げて滑らかに
    params.movementSpeed = constrain(params.movementSpeed, 0.1, 1.5);
  }
  else {
    // 右側1/3: 色温度
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
  
  // 画面サイズに基づいて泡の数を計算
  const screenArea = windowWidth * windowHeight;
  const referenceArea = 1920 * 1080;
  const bubbleCount = floor(map(screenArea, 0, referenceArea * 2, 20, 60)); // 小さい画面では少なく、大きい画面では多く
  
  // 画面サイズに応じた泡を生成
  for (let i = 0; i < bubbleCount; i++) {
    // サイズに基づいて速度と詳細度を調整
    let size = random(30, 150); // サイズ範囲を少し狭めて処理負荷を軽減
    let speedFactor = map(size, 30, 150, 0.6, 0.2); // 小さい泡ほど速く、全体的に遅く
    let detailFactor = map(size, 30, 150, 6, 14); // 小さい泡は詳細度を下げる
    
    // 画面内のランダムな位置に配置
    let posX = random(-width/2 + size, width/2 - size);
    let posY = random(-height/2 + size, height/2 - size);
    
    // 完全にランダムな方向への動き
    let moveAngle = random(TWO_PI);
    let speedMagnitude = random(0.1, 0.3) * speedFactor; // 速度を遅くして滑らかに
    
    bubbles.push({
      size: size,
      x: posX,
      y: posY,
      z: random(-100, 100), // Z方向の範囲を狭める
      speedX: cos(moveAngle) * speedMagnitude,
      speedY: sin(moveAngle) * speedMagnitude,
      speedZ: random(-0.05, 0.05) * speedFactor, // Z方向の速度も遅く
      rotX: random(TWO_PI),
      rotY: random(TWO_PI),
      rotSpeedX: random(-0.005, 0.005), // 回転速度を遅く
      rotSpeedY: random(-0.005, 0.005),
      colorOffset: random(0, 1), // 色のバリエーション用
      detail: floor(random(detailFactor * 0.7, detailFactor)), // 球体の詳細度（サイズに応じて調整）
      lastBounce: 0 // 最後に反射した時間（連続反射防止用）
    });
  }
}

// 複数の泡を描画
function drawBubbles(time) {
  // 泡が初期化されていなければ初期化
  if (bubbles.length === 0) {
    initBubbles();
  }
  
  // フレームレートの安定化のためのdeltaTimeの制限
  // 極端に大きなdeltaTimeを制限して、フレームレート低下時の大きなジャンプを防止
  let clampedDeltaTime = min(deltaTime, 100); // 最大100ms（10FPS相当）に制限
  
  // 各泡を描画（奥から手前の順に描画）
  // 泡を奥行きでソート
  bubbles.sort((a, b) => b.z - a.z);
  
  // 各泡を描画
  for (let i = 0; i < bubbles.length; i++) {
    let b = bubbles[i];
    
    // 直線運動で移動（移動速度パラメータを適用）- 安定化したdeltaTimeを使用
    let deltaFactor = clampedDeltaTime / 16.67; // 60FPSを基準に正規化
    
    // 移動速度を適用（小さい泡ほど速く見えるように調整）
    let sizeBasedSpeed = map(b.size, 30, 180, 1.2, 0.8); // サイズに応じた速度係数
    let moveFactor = params.movementSpeed * deltaFactor * sizeBasedSpeed;
    
    // 位置を更新（より滑らかな動きのために小さな増分で）
    b.x += b.speedX * moveFactor;
    b.y += b.speedY * moveFactor;
    b.z += b.speedZ * moveFactor * 0.5; // Z方向の動きを抑制して安定化
    
    // 回転を更新（より滑らかな回転のために）
    b.rotX += b.rotSpeedX * params.rotationSpeed * deltaFactor;
    b.rotY += b.rotSpeedY * params.rotationSpeed * deltaFactor;
    
    // 画面の境界をチェック
    let margin = b.size;
    let bounced = false;
    
    // X方向の境界チェック（少し余裕を持たせる）
    if (b.x < -width/2 + margin) {
      // 境界から少し内側に配置して、境界でのスタックを防止
      b.x = -width/2 + margin + random(1, 3);
      b.speedX *= -1;
      bounced = true;
    } else if (b.x > width/2 - margin) {
      b.x = width/2 - margin - random(1, 3);
      b.speedX *= -1;
      bounced = true;
    }
    
    // Y方向の境界チェック（少し余裕を持たせる）
    if (b.y < -height/2 + margin) {
      b.y = -height/2 + margin + random(1, 3);
      b.speedY *= -1;
      bounced = true;
    } else if (b.y > height/2 - margin) {
      b.y = height/2 - margin - random(1, 3);
      b.speedY *= -1;
      bounced = true;
    }
    
    // Z方向の境界チェック（少し余裕を持たせる）
    if (b.z < -100 + margin) {
      b.z = -100 + margin + random(1, 3);
      b.speedZ *= -1;
      bounced = true;
    } else if (b.z > 100 - margin) {
      b.z = 100 - margin - random(1, 3);
      b.speedZ *= -1;
      bounced = true;
    }
    
    // 反射時に色をわずかに変化（最後の反射から一定時間経過している場合のみ）
    if (bounced && time - b.lastBounce > 0.5) {
      b.colorOffset = random(0, 1);
      b.lastBounce = time;
      
      // 反射時の速度変化を小さくして安定化
      b.speedX *= random(0.98, 1.02); // 変化幅を小さく
      b.speedY *= random(0.98, 1.02);
      b.speedZ *= random(0.98, 1.02);
      
      // 速度が小さすぎる場合は補正（より安定した方法で）
      let speed = sqrt(b.speedX*b.speedX + b.speedY*b.speedY + b.speedZ*b.speedZ);
      let minSpeed = 0.05 * map(b.size, 30, 180, 0.6, 0.2);
      if (speed < minSpeed) {
        // 速度の方向を保持しながら大きさだけ調整
        let factor = minSpeed / speed;
        b.speedX *= factor;
        b.speedY *= factor;
        b.speedZ *= factor;
      }
      
      // 速度が大きすぎる場合も制限
      let maxSpeed = 0.3 * map(b.size, 30, 180, 0.6, 0.2);
      if (speed > maxSpeed) {
        let factor = maxSpeed / speed;
        b.speedX *= factor;
        b.speedY *= factor;
        b.speedZ *= factor;
      }
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
    
    // ワイヤーフレームの泡を描画
    sphere(b.size, b.detail, b.detail);
    pop();
  }
}
