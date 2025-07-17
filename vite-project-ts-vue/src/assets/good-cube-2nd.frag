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
    
    // 法線ベクトルをRGBカラーに変換
    vec3 normalColor = normal * 0.5 + 0.5;
    
    // 法線ベクトルを使ってノイズのシード値を生成
    vec2 noiseSeed = normal.xy * 3.0; // スケールを大きくして変化を強調
    
    // 時間スケールを適用
    float scaledTime = uTime * uTimeScale;
    
    // 時間に基づいて変化するノイズ値を計算
    float noiseValue = noise(noiseSeed + vec2(scaledTime * 0.2));
    
    // エッジを強調（法線の変化が大きい部分）
    float edge = 1.0 - abs(dot(normal, vec3(0.0, 0.0, 1.0)));
    edge = pow(edge, 2.0); // エッジをより鮮明に
    
    // フレネル効果（視線と法線の角度に基づく）- より滑らかに
    float fresnelEffect = fresnel(normal, viewDir, 3.0);
    
    // 虹色効果（シャボン玉の干渉色）- より滑らかな色の変化
    float rainbowIntensity = 0.6;
    float rainbowPhase = fresnelEffect * 2.5 + scaledTime * 0.15;
    
    // 滑らかな虹色効果
    vec3 rainbow = vec3(
        0.5 + 0.5 * sin(rainbowPhase),
        0.5 + 0.5 * sin(rainbowPhase + 2.094), // 2π/3
        0.5 + 0.5 * sin(rainbowPhase + 4.188)  // 4π/3
    );
    
    // 虹色の滑らかさを調整
    rainbow = mix(vec3(0.5), rainbow, 0.8);
    
    // 基本色（透明感のある色）
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
    float saturation = uColorSaturation * (1.0 - fresnelEffect * 0.5); // フレネル効果で彩度を調整
    float value = uColorBrightness + 0.2 * normalColor.y; // 明度は法線のY成分に基づく
    
    // HSVからRGBに変換
    vec3 baseColor = hsv2rgb(vec3(hue, saturation, value));
    
    // スペキュラハイライト（光の反射）
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0)); // 光源方向
    float specular = pow(max(0.0, dot(reflect(-lightDir, normal), viewDir)), 32.0);
    vec3 specularColor = vec3(1.0) * specular;
    
    // 最終的な色の計算
    vec3 color = mix(baseColor, rainbow, rainbowIntensity * fresnelEffect);
    
    // エッジとスペキュラハイライトを追加
    color = mix(color, vec3(1.0), edge * uEdgeIntensity * 0.5);
    color += specularColor;
    
    // 時間に基づく脈動効果を追加
    float pulse = 0.03 * sin(scaledTime * 2.0);
    color += pulse * vec3(0.5, 0.5, 0.8); // 青みがかった脈動
    
    // 透明度の計算（エッジに近いほど透明に、より滑らかな変化）
    float alpha = mix(0.15, 0.7, pow(fresnelEffect, 1.5));
    
    // 計算した色をフラグメントの色として設定（透明度付き）
    gl_FragColor = vec4(color, alpha);
}
