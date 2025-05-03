let time = 0;
let offsetXBase;
let offsetYBase;

function setup(){
  colorMode(HSB);
  noStroke(); // 枠線を無くす
  offsetXBase = random(1000); // 初期値をランダムに設定
  offsetYBase = random(1000); // 初期値をランダムに設定
  createCanvas(windowWidth, windowHeight);
  // createCanvas(400, 400);
  frameRate(8);
}


function draw() {
  // 背景色を青に設定します。以前はlightgreenがコメントアウトされていました。
  // background('blue');
  background('blue');

  // 各フレームごとにランダムな要素を少し加えるための変数を設定します。
  let randomFactorX = random(-5, 5);
  let randomFactorY = random(-5, 5);

  // 描画する四角形のサイズを設定します。
  boxSize = 4;

  // 画面全体を小さな四角形で埋め尽くすためのループを開始します。
  for (let y = -30; y < height + 30; y += boxSize) {
    for (let x = -30; x < width + boxSize + 30; x += boxSize) {

      // ノイズ関数を使用して色相を変化させ、色を設定します。
      let hue = map(noise(x * 0.05, y * 0.05, time * 0.05), 0, 1, 60, 360);
      // console.log(hue);
      fill(hue, hue, hue);

      // 背景の歪みを作るために、sinとcosを使用してオフセットを計算します。
      let offsetXBackground = sin(x * 0.03 + time * 0.01) * random(-5, 5) + cos(time * 0.02) * randomFactorX;
      let offsetYBackground = cos(y * 0.02 + time * 0.01) * random(-5, 5) + sin(time * 0.03) * randomFactorY;

      // より複雑な歪みを作るために、さらにsinとcosを重ね合わせてオフセットを計算します。
      let offsetX = sin(x * 0.05 + time * 0.02) * randomFactorX + cos(time * 0.03) * randomFactorX;
      let offsetY = cos(y * 0.03 + time * 0.02) * randomFactorY + sin(time * 0.04) * randomFactorY;

      // 背景のオフセットと新たなオフセットを組み合わせて、四角形を描画します。
      rect(x + offsetX + offsetXBackground + 4, y + offsetY + offsetYBackground + 4, boxSize+1, boxSize+1);
      rect(x + offsetX + offsetXBackground, y + offsetY + offsetYBackground, boxSize+1, boxSize+1);
    }
  }
  // 時間の進行を少し遅くして、アニメーションを滑らかにします。
  time += 0.5;
}