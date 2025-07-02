precision mediump float;

// 頂点シェーダーから受け取る法線ベクトル
varying vec3 vNormal;
uniform float uTime; // 時間を受け取るユニフォーム
uniform vec3 uAcceleration; // 加速度センサーデータ
uniform float uIntensity; // 動きの激しさ

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
    
    // 時間に基づいて変化するノイズ値を計算
    float noiseValue = noise(noiseSeed + vec2(uTime * 0.2));
    
    // エッジを強調（法線の変化が大きい部分）
    float edge = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
    edge = pow(edge, 2.0); // エッジをより鮮明に
    
    // HSVカラースペースでの色相を計算
    // 動きの激しさによって色相を調整（青から赤へ）
    float baseHue = 0.7 - uIntensity * 0.5; // 激しい動きで赤くなる
    float hue = baseHue + 0.3 * noiseValue + 0.1 * sin(uTime * 0.5);
    float saturation = 0.6 + 0.4 * edge + uIntensity * 0.3; // 激しい動きで彩度を上げる
    float value = 0.7 + 0.3 * normalColor.y + uIntensity * 0.2; // 激しい動きで明度を上げる
    
    // HSVからRGBに変換
    vec3 color = hsv2rgb(vec3(hue, saturation, value));
    
    // エッジに基づいて色を調整（エッジを強調）
    color = mix(color, vec3(1.0), edge * 0.5);
    
    // 時間と動きの激しさに基づく脈動効果を追加
    float pulseIntensity = 0.05 + uIntensity * 0.1; // 激しい動きで脈動を強く
    float pulse = pulseIntensity * sin(uTime * (2.0 + uIntensity * 3.0));
    // 激しい動きで赤い色を追加
    vec3 pulseColor = mix(vec3(0.5, 0.0, 0.5), vec3(1.0, 0.2, 0.0), uIntensity);
    color += pulse * pulseColor;
    
    // 計算した色をフラグメントの色として設定
    gl_FragColor = vec4(color, 1.0);
}
