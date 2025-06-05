// sketch.js
let data, worker;

function preload(){
  data = loadJSON('coeffs_color.json');
}

function setup(){
  const [h, w] = data.shape;
  createCanvas(w, h);
  pixelDensity(1);

  // WebWorker の生成
  worker = new Worker('fftWorker.js');

  // JSON データを渡す
  worker.postMessage(data);

  // Worker からピクセルバッファが返ってきたら描画
  worker.onmessage = (e) => {
    const pixelsBuf = e.data; // ArrayBuffer
    loadPixels();
    // TypedArray に変換してピクセル配列を直接セット
    const received = new Uint8ClampedArray(pixelsBuf);
    pixels.set(received);
    updatePixels();
  };

  noLoop();
}

function draw(){
  // Worker 処理後に描かれるので空
}
