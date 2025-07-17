precision mediump float;

// 頂点シェーダーから受け取る法線ベクトル
varying vec3 vNormal;
uniform float uTime; // 時間を受け取るユニフォーム

// パラメータ用のユニフォーム変数
uniform float uColorTemperature; // 色温度（0.0〜1.0、低いほど寒色、高いほど暖色）
uniform float uColorSaturation; // 彩度（0.0〜1.0）
uniform float uColorBrightness; // 明度（0.0〜1.0）
uniform float uEdgeIntensity; // エッジの強調度（0.0〜1.0）
uniform float uTimeScale; // 時間スケール（アニメーション速度、0.1〜2.0）

// 乱数生成関数
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// 2D Simplex Noise風の関数
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    // 四隅の乱数値
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    // スムーズな補間
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// HSVからRGBへの変換関数
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    // 法線ベクトルをRGBカラーに変換
    // normalizeで正規化し、0.5を足して色の範囲を0.0から1.0に調整
    vec3 normalColor = normalize(vNormal) * 0.5 + 0.5;
    
    // 法線ベクトルを使ってノイズのシード値を生成
    vec2 noiseSeed = vNormal.xy * 3.0; // スケールを大きくして変化を強調
    
    // 時間スケールを適用
    float scaledTime = uTime * uTimeScale;
    
    // 時間に基づいて変化するノイズ値を計算
    float noiseValue = noise(noiseSeed + vec2(scaledTime * 0.2));
    
    // エッジを強調（法線の変化が大きい部分）
    float edge = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
    edge = pow(edge, 2.0); // エッジをより鮮明に
    
    // 色温度に基づいて基本色相を決定
    // 0.0（寒色）〜1.0（暖色）の範囲で変化
    float baseHue;
    if (uColorTemperature < 0.5) {
        // 寒色系（青〜緑）: 0.5〜0.3
        baseHue = 0.5 - (0.5 - uColorTemperature) * 0.4;
    } else {
        // 暖色系（黄〜赤）: 0.1〜0.0
        baseHue = 0.1 - (uColorTemperature - 0.5) * 0.2;
    }
    
    // HSVカラースペースでの色相を計算
    float hue = baseHue + 0.1 * noiseValue + 0.05 * sin(scaledTime * 0.5);
    float saturation = uColorSaturation + 0.2 * edge; // エッジで彩度を上げる
    float value = uColorBrightness + 0.2 * normalColor.y; // 明度は法線のY成分に基づく
    
    // HSVからRGBに変換
    vec3 color = hsv2rgb(vec3(hue, saturation, value));
    
    // エッジに基づいて色を調整（エッジを強調）
    color = mix(color, vec3(1.0), edge * uEdgeIntensity);
    
    // 時間に基づく脈動効果を追加
    float pulse = 0.05 * sin(scaledTime * 2.0);
    
    // 色温度に基づいて脈動の色を変更
    vec3 pulseColor;
    if (uColorTemperature < 0.5) {
        pulseColor = vec3(0.0, 0.2, 0.5); // 青系の脈動
    } else {
        pulseColor = vec3(0.5, 0.2, 0.0); // 赤系の脈動
    }
    
    color += pulse * pulseColor;
    
    // 計算した色をフラグメントの色として設定
    gl_FragColor = vec4(color, 1.0);
}
