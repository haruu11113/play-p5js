// sketch.js

let fftShader;
let data;
let coeffTex, p5CoeffTex;
let numCoeffs;

const MAX_COEFFS = 10000;  // JSON の要素数以上にしておく

// 頂点シェーダ
const vertSrc = `
precision highp float;
attribute vec3 aPosition;
void main() {
  gl_Position = vec4(aPosition, 1.0);
}
`;

// 浮動小数点テクスチャから係数を読むフラグメントシェーダ
const fragSrc = `
#extension GL_OES_standard_derivatives : enable
precision highp float;

uniform vec2      u_resolution;
uniform sampler2D u_coeffTex;
uniform vec2      u_texSize;    // [width=numCoeffs, height=3]
uniform int       u_numCoeffs;

void main(){
  vec2 pos = gl_FragCoord.xy;
  float vr = 0.0, vg = 0.0, vb = 0.0;

  for(int i = 0; i < 10000; i++){
    if(i >= u_numCoeffs) break;
    float fi = float(i) + 0.5;
    vec2 uvR = vec2(fi / u_texSize.x, 0.5 / u_texSize.y);
    vec2 uvG = vec2(fi / u_texSize.x, 1.5 / u_texSize.y);
    vec2 uvB = vec2(fi / u_texSize.x, 2.5 / u_texSize.y);

    vec4 cR = texture2D(u_coeffTex, uvR);
    vec4 cG = texture2D(u_coeffTex, uvG);
    vec4 cB = texture2D(u_coeffTex, uvB);

    float tR = 6.2831853 * (cR.x * pos.x + cR.y * pos.y) + cR.z;
    float tG = 6.2831853 * (cG.x * pos.x + cG.y * pos.y) + cG.z;
    float tB = 6.2831853 * (cB.x * pos.x + cB.y * pos.y) + cB.z;

    vr += cR.w * cos(tR);
    vg += cG.w * cos(tG);
    vb += cB.w * cos(tB);
  }

  vr = clamp(vr, 0.0, 255.0) / 255.0;
  vg = clamp(vg, 0.0, 255.0) / 255.0;
  vb = clamp(vb, 0.0, 255.0) / 255.0;

  gl_FragColor = vec4(vr, vg, vb, 1.0);
}
`;

function preload(){
  data = loadJSON('coeffs_color.json');
}

function setup(){
  pixelDensity(1);
  // 固定サイズキャンバス
  createCanvas(600, 600, WEBGL);
  noStroke();

  // 浮動小数点テクスチャを作成
  const gl = drawingContext;
  gl.getExtension('OES_texture_float');

  numCoeffs = data.r.length;
  const texW = numCoeffs, texH = 3;
  const arr = new Float32Array(texW * texH * 4);

  // R/G/B 各行に coeff をパック
  for(let i = 0; i < numCoeffs; i++){
    let idx  = i * 4;
    let cr   = data.r[i];
    arr[idx  ] = cr.kx;
    arr[idx+1] = cr.ky;
    arr[idx+2] = cr.phase;
    arr[idx+3] = cr.amplitude;

    let idxG = (texW + i) * 4;
    let cg   = data.g[i];
    arr[idxG  ] = cg.kx;
    arr[idxG+1] = cg.ky;
    arr[idxG+2] = cg.phase;
    arr[idxG+3] = cg.amplitude;

    let idxB = (2 * texW + i) * 4;
    let cb   = data.b[i];
    arr[idxB  ] = cb.kx;
    arr[idxB+1] = cb.ky;
    arr[idxB+2] = cb.phase;
    arr[idxB+3] = cb.amplitude;
  }

  coeffTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, coeffTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.RGBA,
    texW, texH, 0,
    gl.RGBA, gl.FLOAT,
    arr
  );

  // p5.Texture にラップ（texture プロパティで渡す）
  const renderer = this._renderer;  // p5.RendererGL
  p5CoeffTex = new p5.Texture(renderer, {
    width:   texW,
    height:  texH,
    texture: coeffTex
  });

  // シェーダ初期化
  fftShader = createShader(vertSrc, fragSrc);
  shader(fftShader);

  // setUniform には canvas の実寸 (width, height) を使う
  fftShader.setUniform('u_resolution', [width, height]);
  fftShader.setUniform('u_coeffTex',    p5CoeffTex);
  fftShader.setUniform('u_texSize',     [texW, texH]);
  fftShader.setUniform('u_numCoeffs',   numCoeffs);
}

function draw(){
  // full-screen quad
  rect(-width/2, -height/2, width, height);
}