let time = 0;
let offsetXBase;
let offsetYBase;
let frameCount = 0; // フレーム数をカウントする変数を追加

function setup(){
  colorMode(HSB);
  noStroke(); // 枠線を無くす
  offsetXBase = random(1000); // 初期値をランダムに設定
  offsetYBase = random(1000); // 初期値をランダムに設定
  createCanvas(windowWidth, windowHeight);
  // createCanvas(400, 400);
  frameRate(15);
}



// sin波を各関数
function draw2() {
//   frameCount++; // フレーム数をインクリメント
//   // 例えば、60フレームごとに背景を白で塗りつぶす
//   if (frameCount % 60 === 0) {
//     background(255); // 背景を白に設定
//   }

  stroke(0); // 線の色を黒に設定
  noFill(); // 塗りつぶしなし

  let randomFactorX = random(-5, 5);

  beginShape();
  for (let x = 0; x < width; x++) {
    // let y = height / 2 + sin(x * 0.05 + time * 0.1) * 50; // sin波を計算
    let y = height / 2 + sin(x * 0.05 + time) * 10 * randomFactorX + cos(time) * 10 * randomFactorX;
    vertex(x, y);
  }
  endShape();
  time += 1; // 時間を進める
}


function draw() {
  // 背景色を青に設定します。以前はlightgreenがコメントアウトされていました。
  background('blue');

  // 各フレームごとにランダムな要素を少し加えるための変数を設定します。
  let randomFactorX = random(-2, 2);
  let randomFactorY = random(-2, 2);

  // 描画する四角形のサイズを設定します。
  boxSize = 3;

  // 画面全体を小さな四角形で埋め尽くすためのループを開始します。
  for (let y = -30; y < height + 30; y += boxSize) {
    for (let x = -30; x < width + boxSize + 30; x += boxSize) {

      // より複雑な歪みを作るために、さらにsinとcosを重ね合わせてオフセットを計算します。
      let offsetX = sin(x * 0.05 + time * 0.02) * 3 * randomFactorX + cos(time * 0.03) * 2 * randomFactorX;
      let offsetY = cos(y * 0.03 + time * 0.02) * 3 * randomFactorY + sin(time * 0.04) * 2 * randomFactorY;
      // let offsetX = sin(x * 0.05 + time * 0.02) * randomFactorX + cos(time * 0.03) * randomFactorX;
      // let offsetY = cos(y * 0.03 + time * 0.02) * randomFactorY + sin(time * 0.04) * randomFactorY;
      // H (Hue): 色相、赤、緑、青などを表します。0-360 の範囲で、0が赤、120が緑、240が青などです。
      // S (Saturation): 彩度、色の鮮やかさを表します。0-100 の範囲で、0が色なし（白や黒）、100が最も鮮やかです。
      // B (Brightness): 明度、明るさを表します。0-100 の範囲で、0が真っ暗、100が最も明るいです。
      let hue = map(noise(x * 0.05, y * 0.05, time * 0.5), 0.1, 0.85, 0, 360); // ノイズのスケールを変更してパターンを変化させる
      let Saturation = 90;
      let brightness = 90; //map(noise(x * 0.1, y * 0.1, time * 0.1), 0, 1, 90, 100);
      fill(hue, Saturation, brightness);

      // 背景のオフセットと新たなオフセットを組み合わせて、四角形を描画します。
      rect(x + offsetX, y + offsetY, boxSize + 1, boxSize + 1);
    }
  }
  // 時間の進行を少し遅くして、アニメーションを滑らかにします。
  time += 1;
}