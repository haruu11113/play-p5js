precision mediump float;

// 頂点シェーダーから受け取る法線ベクトル
varying vec3 vNormal;
varying vec3 vPosition; // 頂点の位置を受け取る
uniform float uTime; // 時間を受け取るユニフォーム

// パラメータ用のユニフォーム変数
uniform float uColorTemperature; // 色温度（0.0〜1.0、低いほど寒色、高いほど暖色）
uniform float uColorSaturation; // 彩度（0.0〜1.0）
uniform float uColorBrightness; // 明度（0.0〜1.0）
uniform float uEdgeIntensity; // エッジの強調度（0.0〜1.0）
uniform float uTimeScale; // 時間スケール（アニメーション速度、0.1〜2.0）

// 解像度を受け取るユニフォーム（エッジ検出に使用）
uniform vec2 uResolution;

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

// フレネル効果の計算（視線と法線の角度に基づく反射率）
float fresnel(vec3 normal, vec3 viewDir, float power) {
    return pow(1.0 - abs(dot(normal, viewDir)), power);
}

void main() {
    // 法線ベクトルを正規化
    vec3 normal = normalize(vNormal);
    
    // 視線ベクトル（カメラから頂点への方向）
    vec3 viewDir = normalize(-vPosition);
    
    // 時間スケールを適用
    float scaledTime = uTime * uTimeScale;
    
    // エッジ検出（法線の変化が大きい部分）
    float edge = 1.0 - abs(dot(normal, vec3(0.0, 0.0, 1.0)));
    edge = pow(edge, 3.0); // エッジをより鮮明に
    
    // フレネル効果（視線と法線の角度に基づく）- エッジ検出に利用
    float fresnelEffect = fresnel(normal, viewDir, 5.0);
    
    // 輪郭線の強度を計算（フレネル効果とエッジを組み合わせる）
    float outlineStrength = max(edge * 1.5, fresnelEffect * 1.2);
    
    // しきい値を適用して輪郭線のみを表示
    float outlineThreshold = 0.35;
    float outlineWidth = 0.12; // 線の太さ（細くして鮮明に）
    float outline = smoothstep(outlineThreshold - outlineWidth, outlineThreshold, outlineStrength);
    
    // 時間に基づいて線の強度を微妙に変化させる（呼吸するような効果）
    outline *= 0.8 + 0.2 * sin(scaledTime * 0.8 + fresnelEffect * 5.0);
    
    // 虹色効果（線の色に使用）- より鮮やかに
    float rainbowPhase = fresnelEffect * 3.0 + scaledTime * 0.3;
    vec3 rainbow = vec3(
        0.5 + 0.5 * sin(rainbowPhase),
        0.5 + 0.5 * sin(rainbowPhase + 2.094), // 2π/3
        0.5 + 0.5 * sin(rainbowPhase + 4.188)  // 4π/3
    );
    
    // 虹色をより鮮やかに
    rainbow = pow(rainbow, vec3(0.8)); // ガンマ補正で明るい部分を強調
    
    // 基本色（線の色）
    float baseHue;
    if (uColorTemperature < 0.5) {
        // 寒色系（青〜緑）: 0.5〜0.3
        baseHue = 0.5 - (0.5 - uColorTemperature) * 0.4;
    } else {
        // 暖色系（黄〜赤）: 0.1〜0.0
        baseHue = 0.1 - (uColorTemperature - 0.5) * 0.2;
    }
    
    // HSVカラースペースでの色相を計算
    float hue = baseHue + 0.05 * sin(scaledTime * 0.5);
    float saturation = uColorSaturation;
    float value = uColorBrightness;
    
    // HSVからRGBに変換
    vec3 baseColor = hsv2rgb(vec3(hue, saturation, value));
    
    // 最終的な線の色を計算
    vec3 lineColor = mix(baseColor, rainbow, 0.8);
    
    // 時間に基づく脈動効果を追加
    float pulse = 0.15 * sin(scaledTime * 1.5);
    lineColor += pulse * vec3(0.4, 0.4, 0.6);
    
    // 線の色を明るく
    lineColor = min(lineColor * 1.2, vec3(1.0));
    
    // 輪郭線の色と透明度を設定
    vec3 finalColor = lineColor * outline;
    float alpha = outline * uEdgeIntensity;
    
    // 内部は透明に、輪郭線のみ表示
    gl_FragColor = vec4(finalColor, alpha);
}
