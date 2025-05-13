let coeffs;
let imgW, imgH;

function preload() {
  // coeffs.json は { "shape": [height, width], "list": [ {kx, ky, amplitude, phase}, … ] }
  coeffs = loadJSON('coeffs.json');
}

function setup() {
  // coeffs.shape が [height, width]
  imgH = coeffs.shape[0];
  imgW = coeffs.shape[1];

  createCanvas(imgW, imgH);
  pixelDensity(1);  // 高 DPI 対応をオフ
  noLoop();         // 一度だけ描画

  // JSON のキー名によっては list プロパティ名を変えてください
  // 例えば coeffs.list ではなく coeffs.coeffs になっている場合もあります
  if (!coeffs.list) {
    console.error('coeffs.json のキー名を確認してください: expected "list"');
  }
}

function draw() {
  loadPixels();

  // 周波数成分リスト
  let list = coeffs.list;

  for (let y = 0; y < imgH; y++) {
    for (let x = 0; x < imgW; x++) {
      let v = 0;
      // 全周波数成分の和を計算
      for (let c of list) {
        let theta = TWO_PI * (c.kx * x + c.ky * y) + c.phase;
        v += c.amplitude * cos(theta);
      }
      // 0–255 にクランプ
      v = constrain(v, 0, 255);

      let idx = 4 * (x + y * imgW);
      pixels[idx + 0] = v;  // R
      pixels[idx + 1] = v;  // G
      pixels[idx + 2] = v;  // B
      pixels[idx + 3] = 255; // A
    }
  }

  updatePixels();
}
