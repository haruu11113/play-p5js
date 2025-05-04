precision mediump float;

// 頂点シェーダーから受け取る法線ベクトル
varying vec3 vNormal;

void main() {
  // 法線ベクトルをRGBカラーに変換
  // normalizeで正規化し、0.5を足して色の範囲を0.0から1.0に調整
  vec3 color = normalize(vNormal) * 0.5 + 0.5;

  // 計算した色をフラグメントの色として設定
  gl_FragColor = vec4(color, 1.0);
}