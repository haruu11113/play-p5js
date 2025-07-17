//=============================================================================
// Shader-Tyoimaru - 頂点シェーダー
// 滑らかな曲線を持つ動的な3Dオブジェクトの頂点変形を行う
//=============================================================================

precision mediump float;

//-----------------------------------------------------------------------------
// 定数
//-----------------------------------------------------------------------------
#define PI 3.14159265359
#define TWO_PI 6.28318530718
#define EPSILON 0.01 // 法線計算用の微小変位

//-----------------------------------------------------------------------------
// 属性とユニフォーム
//-----------------------------------------------------------------------------
attribute vec3 aPosition; // 頂点位置
attribute vec3 aNormal;   // 頂点法線

uniform mat4 uModelViewMatrix;  // モデルビュー行列
uniform mat4 uProjectionMatrix; // 投影行列
uniform mat3 uNormalMatrix;     // 法線変換行列
uniform float uTime;            // 経過時間（秒）

//-----------------------------------------------------------------------------
// 変数
//-----------------------------------------------------------------------------
varying vec3 vNormal; // フラグメントシェーダーに渡す法線ベクトル

//-----------------------------------------------------------------------------
// 形状制御パラメータ
//-----------------------------------------------------------------------------
// 基本形状パラメータ
const float BASE_RADIUS = 1.0;           // 基本半径
const float NOISE_SCALE = 0.5;           // ノイズのスケール
const float TIME_SCALE = 0.12;           // 時間変化の速度
const float DISTORTION_AMOUNT = 0.45;    // 歪みの強さ

// 二次的な変形パラメータ
const float SECONDARY_WAVE_AMPLITUDE = 0.15; // 二次的な波の振幅
const float BUMP_STRENGTH = 0.2;             // 膨らみの強さ

// ノイズ制御パラメータ
const int OCTAVES = 5;         // フラクタルノイズのオクターブ数
const float PERSISTENCE = 0.5; // 各オクターブの振幅の減衰率
const float LACUNARITY = 1.8;  // 各オクターブの周波数の増加率

//=============================================================================
// ユーティリティ関数
//=============================================================================

/**
 * 乱数生成関数
 * @param {vec2} st - 2次元シード値
 * @return {float} 0.0〜1.0の乱数値
 */
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

/**
 * 五次エルミート曲線による補間関数
 * 非常に滑らかな補間を提供する
 * @param {vec2} f - 補間パラメータ（0.0〜1.0の範囲）
 * @return {vec2} 補間された値
 */
vec2 quinticInterpolation(vec2 f) {
    return f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
}

/**
 * 三次エルミート曲線による補間関数
 * @param {float} t - 補間パラメータ（0.0〜1.0の範囲）
 * @return {float} 補間された値
 */
float cubicInterpolation(float t) {
    return t * t * (3.0 - 2.0 * t);
}

/**
 * 高次多項式による滑らかな遷移関数
 * @param {float} t - 遷移パラメータ（0.0〜1.0の範囲）
 * @return {float} 滑らかに遷移した値
 */
float smoothTransition(float t) {
    return t * t * t * (10.0 * t - 15.0 * t * t + 6.0 * t * t * t);
}

//=============================================================================
// ノイズ関数
//=============================================================================

/**
 * 2D滑らかノイズ
 * @param {vec2} st - サンプリング座標
 * @return {float} 0.0〜1.0のノイズ値
 */
float smoothNoise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    // 四隅の乱数値
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    // 五次エルミート曲線による超滑らかな補間
    vec2 u = quinticInterpolation(f);
    
    // 滑らかな二次元補間
    float ab = mix(a, b, u.x);
    float cd = mix(c, d, u.x);
    return mix(ab, cd, u.y);
}

/**
 * 3D滑らかノイズ
 * 複数の平面からのサンプリングを組み合わせて3D効果を生成
 * @param {vec3} p - 3D座標
 * @return {float} 0.0〜1.0のノイズ値
 */
float smoothNoise3D(vec3 p) {
    // 主要平面からのサンプリング
    float xy = smoothNoise(p.xy + vec2(p.z * 0.7));
    float yz = smoothNoise(p.yz + vec2(p.x * 0.7));
    float zx = smoothNoise(p.zx + vec2(p.y * 0.7));
    float xyz = smoothNoise(p.xy + vec2(p.z * 0.3));
    
    // 追加の斜め平面からのサンプリング（より自然な3D効果のため）
    float xy2 = smoothNoise(p.xy * 1.1 + vec2(p.z * 0.5));
    float yz2 = smoothNoise(p.yz * 1.1 + vec2(p.x * 0.5));
    float zx2 = smoothNoise(p.zx * 1.1 + vec2(p.y * 0.5));
    
    // 重み付き平均
    return (xy + yz + zx + xyz + xy2 * 0.8 + yz2 * 0.8 + zx2 * 0.8) / (4.0 + 0.8 * 3.0);
}

/**
 * フラクタルノイズ（FBM - Fractional Brownian Motion）
 * 複数のオクターブのノイズを重ね合わせて詳細な変化を生成
 * @param {vec3} p - 3D座標
 * @return {float} 0.0〜1.0のノイズ値
 */
float fractalNoise(vec3 p) {
    float value = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    float total = 0.0;
    
    // 複数のオクターブを重ね合わせる
    for (int i = 0; i < OCTAVES; i++) {
        value += amplitude * smoothNoise3D(p * frequency);
        total += amplitude;
        amplitude *= PERSISTENCE;
        frequency *= LACUNARITY;
    }
    
    // 正規化
    return value / total;
}

//=============================================================================
// 形状変形関数
//=============================================================================

/**
 * ノイズベースの半径計算
 * @param {vec3} direction - 方向ベクトル（正規化済み）
 * @param {float} baseRadius - 基本半径
 * @param {float} noiseScale - ノイズのスケール
 * @param {float} timeScale - 時間変化の速度
 * @param {float} distortionAmount - 歪みの強さ
 * @return {float} 変形後の半径
 */
float calculateNoiseRadius(vec3 direction, float baseRadius, float noiseScale, float timeScale, float distortionAmount) {
    // ノイズ値の計算
    float noiseValue = fractalNoise(direction * noiseScale + vec3(uTime * timeScale));
    
    // 滑らかな変化のための処理
    float smoothedNoise = 0.5 * sin(noiseValue * TWO_PI) + 0.5;
    smoothedNoise = cubicInterpolation(smoothedNoise);
    
    // 半径の計算
    return baseRadius * (1.0 + distortionAmount * smoothedNoise);
}

/**
 * 二次的な波形による変形
 * @param {vec3} direction - 方向ベクトル（正規化済み）
 * @param {float} noiseScale - ノイズのスケール
 * @param {float} timeScale - 時間変化の速度
 * @return {float} 二次的な変形量
 */
float calculateSecondaryWave(vec3 direction, float noiseScale, float timeScale) {
    float secondaryNoise = fractalNoise(direction * noiseScale * 1.3 + vec3(uTime * timeScale * 0.9));
    return SECONDARY_WAVE_AMPLITUDE * (sin(secondaryNoise * TWO_PI) + 0.3 * sin(secondaryNoise * 1.5 * TWO_PI));
}

/**
 * 方向性のある膨らみの計算
 * @param {vec3} direction - 方向ベクトル（正規化済み）
 * @param {vec3} bumpDirection - 膨らみの方向ベクトル
 * @return {float} 膨らみの量
 */
float calculateDirectionalBump(vec3 direction, vec3 bumpDirection) {
    float dotProduct = max(0.0, dot(normalize(direction), normalize(bumpDirection)));
    return BUMP_STRENGTH * smoothTransition(dotProduct);
}

/**
 * 接線ベクトルの計算
 * @param {vec3} direction - 方向ベクトル（正規化済み）
 * @param {out vec3} tangentX - X方向の接線ベクトル
 * @param {out vec3} tangentY - Y方向の接線ベクトル
 */
void calculateTangents(vec3 direction, out vec3 tangentX, out vec3 tangentY) {
    // 初期値の設定
    tangentX = vec3(1.0, 0.0, 0.0);
    tangentY = vec3(0.0, 1.0, 0.0);
    
    // 方向ベクトルとX軸がほぼ平行な場合は別の軸を選択
    if (abs(dot(direction, tangentX)) > 0.99) {
        tangentX = vec3(0.0, 1.0, 0.0);
        tangentY = vec3(0.0, 0.0, 1.0);
    } else {
        // 直交する接線ベクトルを計算
        tangentX = normalize(cross(direction, vec3(0.0, 1.0, 0.0)));
        tangentY = normalize(cross(direction, tangentX));
    }
}

/**
 * 法線ベクトルの計算
 * 微分法に基づく精密な法線計算
 * @param {vec3} distortedPosition - 変形後の位置
 * @param {vec3} nearbyX - X方向の近傍点の方向
 * @param {vec3} nearbyY - Y方向の近傍点の方向
 * @param {float} radiusX - X方向の近傍点の半径
 * @param {float} radiusY - Y方向の近傍点の半径
 * @return {vec3} 法線ベクトル（正規化済み）
 */
vec3 calculateNormal(vec3 distortedPosition, vec3 nearbyX, vec3 nearbyY, float radiusX, float radiusY) {
    vec3 posX = nearbyX * radiusX;
    vec3 posY = nearbyY * radiusY;
    
    vec3 tangentVecX = posX - distortedPosition;
    vec3 tangentVecY = posY - distortedPosition;
    
    return normalize(cross(tangentVecX, tangentVecY));
}

//=============================================================================
// メイン関数
//=============================================================================

void main() {
    //-------------------------------------------------------------------------
    // 1. 基本的な方向ベクトルの計算
    //-------------------------------------------------------------------------
    // 頂点の方向ベクトル（正規化）
    vec3 direction = normalize(aPosition);
    
    // 時間変化する膨らみの方向
    vec3 bumpDirection = vec3(
        sin(uTime * 0.12),
        cos(uTime * 0.15),
        sin(uTime * 0.13)
    );
    
    //-------------------------------------------------------------------------
    // 2. 半径の計算と変形
    //-------------------------------------------------------------------------
    // 基本半径の計算
    float radius = calculateNoiseRadius(direction, BASE_RADIUS, NOISE_SCALE, TIME_SCALE, DISTORTION_AMOUNT);
    
    // 二次的な変形を追加
    radius += calculateSecondaryWave(direction, NOISE_SCALE, TIME_SCALE);
    
    // 方向性のある膨らみを追加
    radius += calculateDirectionalBump(direction, bumpDirection);
    
    // 変形した位置を計算
    vec3 distortedPosition = direction * radius;
    
    //-------------------------------------------------------------------------
    // 3. 法線ベクトルの計算
    //-------------------------------------------------------------------------
    // 接線ベクトルの計算
    vec3 tangentX, tangentY;
    calculateTangents(direction, tangentX, tangentY);
    
    // 近傍点の計算
    vec3 nearbyX = normalize(direction + EPSILON * tangentX);
    vec3 nearbyY = normalize(direction + EPSILON * tangentY);
    
    // 近傍点の半径計算
    float radiusX = calculateNoiseRadius(nearbyX, BASE_RADIUS, NOISE_SCALE, TIME_SCALE, DISTORTION_AMOUNT);
    float radiusY = calculateNoiseRadius(nearbyY, BASE_RADIUS, NOISE_SCALE, TIME_SCALE, DISTORTION_AMOUNT);
    
    // 近傍点にも二次的な変形を適用
    radiusX += calculateSecondaryWave(nearbyX, NOISE_SCALE, TIME_SCALE);
    radiusY += calculateSecondaryWave(nearbyY, NOISE_SCALE, TIME_SCALE);
    
    // 近傍点にも膨らみを適用
    radiusX += calculateDirectionalBump(nearbyX, bumpDirection);
    radiusY += calculateDirectionalBump(nearbyY, bumpDirection);
    
    // 法線ベクトルの計算
    vec3 normal = calculateNormal(distortedPosition, nearbyX, nearbyY, radiusX, radiusY);
    
    //-------------------------------------------------------------------------
    // 4. 最終出力
    //-------------------------------------------------------------------------
    // 法線ベクトルをフラグメントシェーダーに渡す
    vNormal = normalize(uNormalMatrix * normal);
    
    // 最終的な頂点位置の計算
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(distortedPosition, 1.0);
}
