precision mediump float;

// 頂点の位置と法線ベクトルを受け取る属性
attribute vec3 aPosition;
attribute vec3 aNormal;

// モデルビュー行列、投影行列、法線行列を受け取るユニフォーム
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;

// フラグメントシェーダーに渡すための変数
varying vec3 vNormal;

void main() {
  // 法線ベクトルを正規化してvNormalに代入
  vNormal = normalize(uNormalMatrix * aNormal);

  // 頂点の位置を計算してgl_Positionに代入
  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
}