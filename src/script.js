// これをもとに2DshaderTemplate充実させたいわね

// 2Dにする
// んでこれは図形を描かずに貼り付ける（光だけ）

// 難しく考えなくていい。今あるこれを再現できるように
// 少しずついじっていくだけ。

// わーーーーーかーーーーんーーーーーないーーーーーーーーーーーーー
// わかった。誤字（directionがdireciton）。よく見たら目玉動いてなかった。
// 気付きにくいよねああいうのは・・・

// グリッドにして床作ったり場所指定してもいいわね（グリッドの方が
// 指定しやすいし）

// grに落とした。これでスクロールの可能性・・まあやりませんが・・

// 色はGLSLでいい気がしてきた。そっちのが速いんじゃないか。

// SystemにdistFunction持たせてそんでplayerの場合はそこから
// 取得するようにした方が簡単そう
// eyeの動き方もそこで決めちゃうとか・・んー。あるいは
// Systemの内部が重くなってしまうので
// shaderのそういう部分も含めて別のとこで・・

// ステージの構成要素
// eyeのデータ（色、攻撃情報、移動情報）
// プレイヤーの初期位置
// ObstacleArray→距離関数、シェーダの距離関数部分作成
// この3つを生成してステージを作る

// さてと・・
// そろそろGitHubに移行するかな。。
// とりあえず枠組みはできた。あとは・・んー。
// ゲージを用意する。長さは100くらいで。
// 光に当たるとスリップダメージ。値は明るさそのまんまでいいと思う。
// ゲージどこに置こう・・左上かなぁ。小さめに。

// 敵のアイデアとしては特定の長方形の周りを周回するとか
// そういうので
// 画面の外周の2ヶ所を開けておいてそこを伝って次のステージに行くみたいな
// しかし640,640だとすぐ終わっちゃいそう・・迷路っぽくするとか？
// rectをたくさん用意するとかそういうの。

// 周囲の壁を用意
// 床を用意
// 床は照らされたところだけ見えるようにする
// 当然ゴールも見えない
// って感じですかね・・
// あとroundBoxとか追加したいわね。

// なんか予想と違うけどいいや
// 要するにモノクロが照らされて明るくなるイメージ？いいんじゃない？
// ゴールが照らされて見えるようになるってわけね。

// はい。
// TODO大きく分けて3つ。
// 1.ゴールして次のエリアに進む仕様を作る
// 2.ダメージをスリップ仕様にする（MAX100とか120くらいでダメージは
//   bltの値をそのまま使う感じ）
// 3.room0とかroom1とかそこら辺の情報を左上に用意
// こんなもんかな
// 優先順位的に1→2→3、ていうか2と3は簡単でしょ・・

// やっぱりデフォは0で・・見えちゃうと意味がないし。

// 穴に落ちたらアニメーション、で、フェードアウト。
// で、HPとかリセットして、roomのナンバーを進めて次のステージ作る。

// チェックポイント複数用意してそれらを全部踏むとクリア、
// 踏んだチェックポイントは光るようにするのもいいわね。
// ステージ作りやすくしたいわね

// floatをfloorって書いちゃって10分消えた（バカ）
// しゅいさんの配信聴きながら作業してる（お絵描きしたい）

const DEFAULT_FLOOR_ALPHA = 0.0; // 床をみえるようにする（テスト用）
const ROOMNUMBER_MAX = 2; // 2の場合0と1があるということです（以下略）
const GRID = 0.05; // これを使って簡単に位置指定

let vsLight =
"precision mediump float;" +
"attribute vec3 aPosition;" +
"void main(){" +
"  gl_Position = vec4(aPosition, 1.0);" +
"}";

let fsLightUpper =
"precision mediump float;" +
"uniform vec2 u_resolution;" +
"uniform float u_count;" +
// eye関連。eyeを増やすならここはすべて配列になる。
// 実際にはその個数を記録しておいてそこまでやる感じ。
// あっちのシェーダ(p5のfill)でそういう手法やってるので真似すればいい。
"uniform int u_eyeCount;" +
"uniform vec2 u_eyePos[4];" +
"uniform vec2 u_lightDirection[4];" + // 光の出る方向
"uniform float u_lightRange[4];" + // 1.0～-1.0のコサイン値の限界値で範囲制限
"uniform float u_lightHue[4];" + // 光の色
"uniform float u_default_Floor_Alpha;" + // デバッグ用の床の透明度
"uniform float u_seed;" + // 模様のためのシード値
"uniform vec3 u_goalPos;" + // 0.05刻みでゴール指定(3つ目の引数はタッチしたかどうか)
// 定数
"const float pi = 3.14159;" +
"const float TAU = atan(1.0) * 8.0;" +
"const float eps = 0.00001;" +
"const vec3 ex = vec3(1.0, 0.0, 0.0);" +
"const vec3 ey = vec3(0.0, 1.0, 0.0);" +
"const vec3 ez = vec3(0.0, 0.0, 1.0);" +
"const float THRESHOLD = 0.001;" + // レイマーチングの閾値
// 色
"const vec3 black = vec3(0.2);" +
"const vec3 red = vec3(0.95, 0.3, 0.35);" +
"const vec3 orange = vec3(0.98, 0.49, 0.13);" +
"const vec3 yellow = vec3(0.95, 0.98, 0.2);" +
"const vec3 green = vec3(0.3, 0.9, 0.4);" +
"const vec3 blue = vec3(0.2, 0.25, 0.98);" +
"const vec3 white = vec3(1.0);" +
// ランダム関連(seed追加)
"const vec2 r_vector = vec2(12.9898, 78.233);" +
"const float r_coeff = 43758.5453123;" +
"float random(vec2 st, float seed){" +
"  return fract(sin(dot(st.xy, r_vector)) * r_coeff + seed);" +
"}" +
// ベクトル取得関数
"vec2 fromAngle(float t){ return vec2(cos(t), sin(t)); }" +
// 正二面体群
// 基本領域の中心が0にくるように調整してある
"vec2 dihedral_center(vec2 p, float n){" +
"  float k = pi * 0.5 / n;" +
"  vec2 e1 = vec2(sin(k), cos(k));" +
"  vec2 e2 = vec2(sin(k), -cos(k));" +
"  for(float i = 0.0; i < 99.0; i += 1.0){" +
"    if(i == n){ break; }" +
"    p -= 2.0 * min(dot(p, e1), 0.0) * e1;" +
"    p -= 2.0 * min(dot(p, e2), 0.0) * e2;" +
"  }" +
"  return p;" +
"}" +
// 基本領域のはじっこに0がくるやつ（0～pi/n）
"vec2 dihedral_bound(vec2 p, float n){" +
"  float k = pi / n;" +
"  vec2 e1 = vec2(0.0, 1.0);" +
"  vec2 e2 = vec2(sin(k), -cos(k));" +
"  for(float i = 0.0; i < 99.0; i += 1.0){" +
"    if(i == n){ break; }" +
"    p -= 2.0 * min(dot(p, e1), 0.0) * e1;" +
"    p -= 2.0 * min(dot(p, e2), 0.0) * e2;" +
"  }" +
"  return p;" +
"}" +
// 円(中心c半径r)
"float circle(vec2 p, vec2 c, float r){" +
"  return length(p - c) - r;" +
"}" +
// 長方形(中心c,横q.xで縦q.y)
"float rect(vec2 p, vec2 c, vec2 q){" +
"  return max(abs(p.x - c.x) - q.x * 0.5, abs(p.y - c.y) - q.y * 0.5);" +
"}" +
// 正方形(中心c,横も縦もr)
"float square(vec2 p, vec2 c, float r){" +
"  p -= c;" +
"  return max(abs(p.x) - r * 0.5, abs(p.y) - r * 0.5);" +
"}" +
// 三角形
"float triangle(vec2 p, vec2 c, float r, float t){" +
"  p -= c;" +
"  p *= mat2(cos(t), -sin(t), sin(t), cos(t));" +
"  vec2 e1 = vec2(0.0, 1.0);" +
"  vec2 e2 = vec2(0.5 * sqrt(3.0), -0.5);" +
"  for(int i = 0; i < 3; i++){" +
"    p -= 2.0 * min(dot(p, e1), 0.0) * e1;" +
"    p -= 2.0 * min(dot(p, e2), 0.0) * e2;" +
"  }" +
"  return p.x - r;" +
"}" +
// 星型
"float star(vec2 p, vec2 c, float r, float t){" +
"  p -= c;" +
"  p *= mat2(cos(t), -sin(t), sin(t), cos(t));" +
"  p = dihedral_bound(p, 5.0);" +
"  vec2 e = fromAngle(0.4 * pi);" +
"  return dot(p - vec2(r, 0.0), e);" +
"}" +
// 月型
"float moon(vec2 p, vec2 c, float r, float t){" +
"  p = (p - c) * mat2(cos(t), -sin(t), sin(t), cos(t));" +
"  return max(length(p) - r, r * 0.65 - length(p - vec2(r * 0.5, 0.0)));" +
"}" +
// 線分。cから単位ベクトルeと逆の方向に長さhで幅r.
"float segment(vec2 p, vec2 c, vec2 e, float r, float h){" +
"  p -= c;" +
"  return length(p - max(-h, min(0.0, dot(p, e))) * e) - r;" +
"}" +
// ハート(cが先端でeが上向き)
"float heart(vec2 p, vec2 c, vec2 e, float r){" +
"  const float k = 0.707;" +
"  vec2 e1 = e * mat2(k, -k, k, k);" +
"  vec2 e2 = e * mat2(k, k, -k, k);" +
"  float d1 = segment(p, c, -e1, r, r * 1.4142);" +
"  float d2 = segment(p, c, -e2, r, r * 1.4142);" +
"  p = (p - c) * mat2(k, -k, k, k);" +
"  float d3 = max(abs(p.x), abs(p.y)) - r;" +
"  return min(min(d1, d2), d3);" +
"}" +
// getRGB(HSBをRGBに変換する関数)
"vec3 getRGB(float h, float s, float b){" +
"  vec3 c = vec3(h, s, b);" +
"  vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);" +
"  rgb = rgb * rgb * (3.0 - 2.0 * rgb);" +
"  return c.z * mix(vec3(1.0), rgb, c.y);" +
"}";
// 距離関数（ここにはもう何も書かない）
let distFuncDescription = "";
let fsLightLower =
// レイマーチングで光の当たる範囲の色を設定
"void calcLightArea(vec2 p, out vec4 col, vec2 eye, vec2 lightDirection, float lightRange, float lightHue){" +
// mはマウス位置でそこから描画位置pに向けて光を飛ばす
"  vec2 cur = eye;" +
"  vec2 ray = p - cur;" +
"  float d = 0.0;" +
"  float l = length(p - cur);" +
"  if(l > 0.0){" +
"    ray = ray / l;" +
"    for(float i = 0.0; i < 32.0; i += 1.0){" +
"      d = getDist(cur);" +
"      if(d < THRESHOLD){ break; }" +
"      cur += d * ray;" +
"    }" +
"    l = length(p - eye);" +
"    float reach = length(cur - eye);" +
"    float blt = 0.5 / (l*l + 0.5);" +
// まあでもなんかに使えそうだから残しておこう。
"    if(reach > l && dot(ray, lightDirection) - lightRange > 0.0){" +
"      float lightPrg = (dot(ray, lightDirection) - lightRange) / (1.0 - lightRange);" +
"      blt *= lightPrg * lightPrg * (3.0 - 2.0 * lightPrg);" +
"      col.rgb += getRGB(lightHue, 1.0, blt);" +
"      col.a += 0.5;" +
"    }else if(reach <= l && l - reach < 0.03){" +
"      float prg = 1.0 - (l - reach) / 0.03;" +
"      blt *= prg * prg * (3.0 - 2.0 * prg);" +
"      col.rgb += getRGB(lightHue, 1.0, blt);" +
"      col.a += 0.5;" +
"    }" +
"  }" +
"}" +
// 背景、雑に・・
// なんかわかんないけどモノクロの背景に色がつくみたいな展開に
// なってしまったのでそれでいきます
// 照らされないとゴールが見えない！！！！
// 一応説明すると-7.0,6.0となっているところがその、ゴールで、
// 他のマスはそれより明るいですね。つまりひとつだけ暗いマスがあって
// そこに落ちればクリアというわけ。クリアの仕組み作ってないけど。
"vec4 getBG(vec2 p){" +
"  p *= 80.0;" +
"  p += 80.0;" +
"  vec3 col = vec3(0.2 + random(floor(p), u_seed));" +
"  return vec4(col, u_default_Floor_Alpha);" +
"}" +
// 背景をcolに設定（ゴールだけ別に用意）
// じゃあこれで。0.05刻みで0.05で落とす。あっちの方も。
// プレイヤーの座標はこっちとリンクさせてあるから問題ない。
"void setBackground(vec2 p, out vec4 col, vec4 bg){" +
"  col = bg;" +
"  if(abs(p.x - u_goalPos.x) < 0.05 && abs(p.y - u_goalPos.y) < 0.05){" +
"    col = vec4(vec3(0.0), u_default_Floor_Alpha);" +
"  }" +
"}" +
// ゴールというか
"void goalCheck(vec2 p, out vec4 col){" +
"  if(u_goalPos.z == 1.0){" +
"    float d = max(abs(p.x - u_goalPos.x), abs(p.y - u_goalPos.y)) - 0.025;" +
"    col += vec4(exp(-d*32.0));" +
"  }" +
"}" +
// メインコード
"void main(){" +
"  vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);" +
"  vec4 bg = getBG(p);" +
"  vec4 col = vec4(vec3(0.0), 1.0);" +
"  setBackground(p, col, bg);" +
"  float d = getDist(p);" +
"  if(d < 0.0){" +
"  d = max(d, -1.0);" +
"    col.rgb = (1.0 + d * 10.0) * blue - 10.0 * d * vec3(1.0);" +
"  }" +
// eyeが増えることを想定してメソッド化
// 増やし方はあのシェーダを参考に・・
"  for(int i = 0; i < 4; i++){" +
"    if(i < u_eyeCount){" +
"      calcLightArea(p, col, u_eyePos[i], u_lightDirection[i], u_lightRange[i], u_lightHue[i]);" +
"    }" +
"  }" +
"  goalCheck(p, col);" +
"  gl_FragColor = col;" +
"}";

let fsLight = fsLightUpper + distFuncDescription + fsLightLower;

// distFuncDescriptionを差し替えると異なるステージができる。
// ステージチェンジの際にそれを行う。
// それとは別にプレイヤーの初期位置とHPをリセットして
// エネミーを配置して行動パターンを設定する。

let mySystem;

let distFunction = () => {};

function setup() {
  createCanvas(640, 640);
  //noStroke();
  mySystem = new System();
  mySystem.roomInitialize();
}

function draw() {
  const start = performance.now();

  mySystem.update();
  mySystem.draw();

  const end = performance.now();
  //if(frameCount%30==0){ console.log((end-start)*60/1000); }
}

// ベクトルも不要に・・

// 距離関数を移植。ステージごとにシェーダーの一部を書き換えて違うステージにするのもよさそう。所詮文字列なので。
// 円や長方形をクラスにしてそれを使って判定させるとか。
// 距離関数はパターン内部で作ることにしました！

// 移動判定
// 障害物が動く場合は当たったらやられるようにすれば良さそうだけど・・押される処理はめんどうなので難しい・・
// 今考えてるのは「動かない：青」で「動く：赤」、黄色は動くときは当たるとアウト、止まってるときはダメージを受けない感じ。
// 色変えるんだったらシェーダー側で変えるよりこっちでやった方がいい
// と思う。あっちで色変えるの面倒だから。
function movable(){
  // バウンドチェック
  if(abs(nextPos.x) > 0.99 || abs(nextPos.y) > 0.99){ return false; }
  return distFunction(nextPos) > 0.01;
}

// -------------------------------------------------------------------- //
// particle.

class Particle{
  constructor(x, y, size, _color, life = 60, speed = 4, count = 20){
    this.color = {r:red(_color), g:green(_color), b:blue(_color)};
    this.center = {x:x, y:y};
    this.size = size;
    this.life = life;
    this.speed = speed;
    this.count = count + random(-5, 5);
    this.rotationAngle = 0;
    this.rotationSpeed = TAU/90;
    this.moveSet = [];
    this.prepareMoveSet();
    this.alive = true;
  }
  prepareMoveSet(){
    for(let i = 0; i < this.count; i++){
      this.moveSet.push({x:0, y:0, speed:this.speed + random(-2, 2), direction:random(TAU)});
    }
  }
  update(){
    if(!this.alive){ return; }
    this.moveSet.forEach((z) => {
      z.x += z.speed * Math.cos(z.direction);
      z.y += z.speed * Math.sin(z.direction);
      z.speed *= 0.9;
    })
    this.rotationAngle += this.rotationSpeed;
    this.life--;
    if(this.life === 0){ this.alive = false; }
  }
  draw(gr){
    if(!this.alive){ return; }
    gr.noFill();
    gr.stroke(this.color.r, this.color.g, this.color.b, this.life * 4);
    const c = cos(this.rotationAngle) * this.size;
    const s = sin(this.rotationAngle) * this.size;
    this.moveSet.forEach((z) => {
      const cx = this.center.x + z.x;
      const cy = this.center.y + z.y;
      gr.quad(cx + c, cy + s, cx - s, cy + c, cx - c, cy - s, cx + s, cy - c);
    });
    gr.noStroke();
  }
  eject(){
    if(!this.alive){ this.vanishAction(); }
  }
  vanishAction(){
    this.belongingArray.remove(this);
  }
}

// ------------------------------------------------------------------ //
// Simple Cross Reference Array.
// 改造する前のやつ。

class SimpleCrossReferenceArray extends Array{
  constructor(){
    super();
  }
  add(element){
    this.push(element);
    element.belongingArray = this; // 所属配列への参照
  }
  addMulti(elementArray){
    // 複数の場合
    elementArray.forEach((element) => { this.add(element); })
  }
  remove(element){
    let index = this.indexOf(element, 0);
    this.splice(index, 1); // elementを配列から排除する
  }
  loop(methodName, args = []){
    if(this.length === 0){ return; }
    // methodNameには"update"とか"display"が入る。まとめて行う処理。
    for(let i = 0; i < this.length; i++){
      this[i][methodName](...args);
    }
  }
  loopReverse(methodName, args = []){
    if(this.length === 0){ return; }
    // 逆から行う。排除とかこうしないとエラーになる。もうこりごり。
    for(let i = this.length - 1; i >= 0; i--){
      this[i][methodName](...args);
    }
  }
  clear(){
    this.length = 0;
  }
}

// ------------------------------------------------------------ //
// obstacle.

// 正方形や円。StageDataのdistFunctionを構成する要素。
// 衝突判定の構成要素を作る感じ。そう。
// 色により性質が異なる感じで。

class Obstacle{
  constructor(id){
    this.id = id;
  }
  getDist(p){
    return 0;
  }
  getString(){
    return "";
  }
}

// 長方形。中心ベクトルとサイズベクトルで4次元。
// a,b,c,dで(a,b)～(c,d)のあれで。左下と右上。
class RectObstacle extends Obstacle{
  constructor(id, a, b, c, d){
    super(id);
    this.center = createVector((a + c) * 0.5 * GRID, (b + d) * 0.5 * GRID);
    this.sizeVector = createVector(abs(a - c) * GRID, abs(b - d) * GRID); // 横幅と縦幅
  }
  getDist(p){
    const dx = abs(p.x - this.center.x) - 0.5 * this.sizeVector.x;
    const dy = abs(p.y - this.center.y) - 0.5 * this.sizeVector.y;
    return max(dx, dy);
  }
  getString(){
    return "  float d" + this.id.toString() + " = rect(p, vec2(" + this.center.x.toString() + ", " + this.center.y.toString() + "), vec2(" + this.sizeVector.x.toString() + ", " + this.sizeVector.y.toString() + "));";
  }
}

// 円。中心ベクトルと半径で3次元。
// a,bとr.グリッドの半整数倍許す。rは半径。これも半整数OK.
class CircleObstacle extends Obstacle{
  constructor(id, a, b, r){
    super(id);
    this.center = createVector(a * GRID, b * GRID);
    this.radius = r * GRID;
  }
  getDist(p){
    return p5.Vector.dist(p, this.center) - this.radius;
  }
  getString(){
    return "  float d" + this.id.toString() + " = circle(p, vec2(" + this.center.x.toString() + ", " + this.center.y.toString() + "), " + this.radius +");";
  }
}

// 線分。中心ベクトルと方向、幅、長さで5次元くらい？
// directionはTAU/24の整数倍で指定する。で、他はまあGRIDを掛けるのです・・
// つまり下に伸びるなら6で上に伸びるなら-6を用意するのね。(a,b)が端点になるわね。左に伸びるなら0だわね。
class SegmentObstacle extends Obstacle{
  constructor(id, a, b, dirId, radius, lgh){
    super(id);
    this.center = createVector(a * GRID, b * GRID);
    const direction = dirId * TAU / 24;
    this.normalVector = createVector(Math.cos(direction), Math.sin(direction));
    // 注意：これは線分の伸びる方向と逆方向です。
    this.radius = radius * GRID; // 線分の幅
    this.lgh = lgh * GRID; // 伸びる長さ
  }
  getDist(p){
    const q1 = p5.Vector.sub(p, this.center);
    const multiplier = max(-this.lgh, min(0.0, p5.Vector.dot(q1, this.normalVector)));
    const q2 = p5.Vector.mult(this.normalVector, multiplier);
    return p5.Vector.dist(q1, q2) - this.radius;
  }
  getString(){
    return "  float d" + this.id.toString() + " = segment(p, vec2(" + this.center.x.toString() + ", " + this.center.y.toString() + "), vec2(" + this.normalVector.x.toString() + ", " + this.normalVector.y.toString() + "), " + this.radius.toString() + ", " + this.lgh.toString() + ");";
  }
}

// 正方形。
// a,bで半整数倍許す。この場合はlかな。一辺の長さなので。
class SquareObstacle extends Obstacle{
  constructor(id, a, b, l){
    super(id);
    this.center = createVector(a * GRID, b * GRID);
    this.size = l * GRID; // 一辺の長さ
  }
  getDist(p){
    const dx = abs(p.x - this.center.x) - 0.5 * this.size;
    const dy = abs(p.y - this.center.y) - 0.5 * this.size;
    return max(dx, dy);
  }
  getString(){
    return "  float d" + this.id.toString() + " = square(p, vec2(" + this.center.x.toString() + ", " + this.center.y.toString() + "), " + this.size.toString() +");";
  }
}

// ------------------------------------------------------------------ //
// player.

// プレイヤー。十字キーとスペースキーで操作。
class Player{
  constructor(){
    this.position = createVector();
    this.nextPosition = createVector();
    this.velocity = createVector(0, 0);
    this.maxLife = 60;
    this.life = this.maxLife;
    this.alive = true;
  }
  initialize(x, y){
    this.position.set(x, y);
    this.alive = true;
  }
  lifeReset(){
    // ゲームオーバーの時だけ。
    this.life = this.maxLife;
  }
  getLifeRatio(){
    return this.life / this.maxLife;
  }
  changeLife(diff){
    this.life = constrain(this.life + diff, 0, this.maxLife);
    if(this.life === 0){ this.alive = false; } // 死んだ！
  }
  update(){
    if(!this.alive){ return; } // 死んだ！
    this.velocity.set(0.0, 0.0);
    const playerSpeed = (keyIsDown(32) ? 0.02 : 0.01);
    if(keyIsDown(LEFT_ARROW)){ this.velocity.x = -playerSpeed; }
    else if(keyIsDown(RIGHT_ARROW)){ this.velocity.x = playerSpeed; }
    if(keyIsDown(UP_ARROW)){ this.velocity.y = playerSpeed; }
    else if(keyIsDown(DOWN_ARROW)){ this.velocity.y = -playerSpeed; }
    this.nextPosition.set(this.position.x + this.velocity.x, this.position.y + this.velocity.y);
    // nextPosが条件を満たすならば位置を更新
    if(this.movable()){ this.position.add(this.velocity); }
  }
  movable(){
    // バウンドチェック
    // distFunctionはそのうちsystemからアクセスするように・・
    if(abs(this.nextPosition.x) > 0.98 || abs(this.nextPosition.y) > 0.98){ return false; }
    return distFunction(this.nextPosition) > 0.02;
  }
  isAlive(){
    return this.alive;
  }
  draw(gr){
    if(!this.alive){ return; } // 死んだ！
    const x = (this.position.x + 1.0) * 0.5 * width;
    const y = (1.0 - this.position.y) * 0.5 * height;
    gr.stroke(255);
    gr.strokeWeight(1);
    gr.noFill();
    gr.circle(x, y, 20);
    gr.strokeWeight(2);
    gr.line(x-1,y,x-1,y-4);
    gr.line(x+4,y,x+4,y-4);
    gr.noStroke();
  }
}

// ---------------------------------------------------------------- //
// enemy.

// エネミーアイ。光を発する。発するタイミングや移動パターンなど。
// 増やす・・？
// パターン制御で位置や光の範囲を決めたいのよね。あと回転とかも。
// lightRangeが増減したりとかしたら面白そう。
class EnemyEye{
  constructor(x, y, rotSpeed, lRange, lHue){
    this.img = createGraphics(40, 40);
    this.position = createVector(x, y);
    this.moveFunc = () => {};
    this.lightDirection = 0;
    this.rotationSpeed = rotSpeed; // TAU/何とか、の形を推奨(95とか)
    this.count = 0;
    this.lightRange = lRange;
    this.lightHue = lHue;
    this.attackFactor = 1.0; // 攻撃力
    this.createEyeImage();
  }
  setMoveFunc(func){
    this.moveFunc = func;
  }
  getAttackFactor(){
    return this.attackFactor;
  }
  createEyeImage(){
    // そのうち画像貼り付けにするので今は適当で
    this.img.noStroke();
    this.img.colorMode(HSB,100);
    this.img.fill(this.lightHue * 100, 100, 100);
    this.img.circle(20, 20, 40);
    this.img.fill(100);
    this.img.circle(32, 20, 16);
    this.img.fill(0);
    this.img.circle(34, 20, 12);
    this.img.stroke(0);
    this.img.fill(100);
    const t = PI / 6;
    this.img.circle(34 + 4 * Math.cos(t), 20 + 4 * Math.sin(t), 4);
    this.img.noStroke();
  }
  update(){
    this.lightDirection += this.rotationSpeed;
    // プログラムされたとおりに移動
    this.moveFunc(this.count, this.position);
    this.count++;
  }
  draw(gr){
    const ex = (this.position.x + 1.0) * 0.5 * width;
    const ey = (1.0 - this.position.y) * 0.5 * height;
    gr.translate(ex, ey);
    gr.rotate(-this.lightDirection); // tiがitになってた。。。馬鹿、、
    gr.image(this.img, -20, -20);
    gr.resetMatrix();
  }
}

// ---------------------------------------------------------------- //
// system.

// ゲームシステム
// WEBGLで扱う光源の照射範囲のグラフィックも内蔵。
class System{
  constructor(){
    this.eyes = new SimpleCrossReferenceArray();
    this._player = new Player();

    this.baseGraphic = createGraphics(width, height); // ベースもこちらに
    // ゆくゆくはいくつかサイズ用意して切り替えできるように
    this.informationLayer = createGraphics(width, height); // 情報いろいろ
    // 具体的にはクリアとかのメッセージとHPゲージとroomNo.と
    // HP減るときのゲージアニメでパーティクル出すのもここで
    this.lifeGaugeImg = createGraphics(320, 16);
    this.prepareForInformation();

    this._lightEffect = createGraphics(width, height, WEBGL);
    this._lightEffect.pixelDensity(1);
    // base大きくするならこっちも大きく・・

    this._particleArray = new SimpleCrossReferenceArray();
    this._properFrameCount = 0;

    this._fade = new Fade(60, 120); // fade関連はコンポジットで。

    this.currentShader = undefined;
    this.lightShaders = {};

    this.roomSet = [room0, room1];
    this.roomNumber = 0; // ここが1とか2とかになるという・・
    this.floorPatternSeed = 0;
    this.defaultFloorAlpha = DEFAULT_FLOOR_ALPHA;
    // ギミックで上げたりしたら面白そう

    this.clearFlag = false;
    this.gameoverFlag = false;
    this.goalPos = createVector(0.0, 0.0, 0.0); // ゴールの正方形の中心(3つ目の引数は0か1で踏んだかどうかを示す)
    // クリア判定はこのポイントに触れたときとする（大きさが）
    // つまり正方形に触れるのではなく中心にちゃんと来ないとだめ
    // シェーダー側でこれを中心に正方形、で、vec4(0.0)にする。
    // 0.05刻みで指定してくださいそのプラスマイナス0.05で正方形です
    this.goalCheckThreshold = 1.0; // これを増減させてレベルを動かせそう
  }
  prepareForInformation(){
    let gr = this.informationLayer;
    // いろいろ設定
    gr.noStroke();
    gr.textSize(24);
    gr.textAlign(CENTER, CENTER);
    let gauge = this.lifeGaugeImg;
    gauge.colorMode(HSB, 100);
    gauge.noStroke();
    for(let i = 0; i < 320; i++){
      gauge.fill(55, i * 100 / 320, 100);
      gauge.rect(i, 0, 1, 16);
    }
  }
  shaderReset(obs, shaderName){
    distFuncDescription = createDistFuncDescription(obs);
    if(!this.lightShaders[shaderName]){
      fsLight = fsLightUpper + distFuncDescription + fsLightLower;
      this.lightShaders[shaderName] = this._lightEffect.createShader(vsLight, fsLight);
    }
    this.currentShader = this.lightShaders[shaderName];
    this._lightEffect.shader(this.currentShader);
    distFunction = createDistFunction(obs);
    this.floorPatternSeed = Math.random() * 9999;
  }
  roomInitialize(nextRoomNumber = 0){
    this._fade.setFadeInFlag(true);
    this._properFrameCount = 0;
    // ゲームオーバーならライフをリセット
    // 最初に戻る場合も・・いっしょだから要らなくなってしまった（まあいいや）
    if(this.gameoverFlag || nextRoomNumber === 0){ this._player.lifeReset(); }
    // フラグリセット
    this.gameoverFlag = false;
    this.clearFlag = false;
    // パーティクルが残らないように
    this._particleArray.clear();
    // パターンをセット
    this.roomNumber = nextRoomNumber;
    this.roomSet[this.roomNumber]();
  }
  registEyes(_eyes){
    this.eyes.clear();
    this.eyes.addMulti(_eyes);
  }
  setUniform(){
    let sh = this.currentShader;
    sh.setUniform("u_resolution", [width, height]);
    sh.setUniform("u_count", this._properFrameCount);
    sh.setUniform("u_eyeCount", 2);
    let eyePosData = [];
    let eyeDirData = [];
    let eyelRangeData = [];
    let eyelHueData = [];
    for(let eye of this.eyes){
      eyePosData.push(eye.position.x, eye.position.y);
      eyeDirData.push(Math.cos(eye.lightDirection), Math.sin(eye.lightDirection));
      eyelRangeData.push(eye.lightRange);
      eyelHueData.push(eye.lightHue);
    }
    sh.setUniform("u_eyePos", eyePosData);
    sh.setUniform("u_lightDirection", eyeDirData);
    // 配列の形でないとデフォで0が入っちゃう仕様みたいですね。
    sh.setUniform("u_lightRange", eyelRangeData);
    sh.setUniform("u_lightHue", eyelHueData);
    sh.setUniform("u_default_Floor_Alpha", this.defaultFloorAlpha);
    sh.setUniform("u_seed", this.floorPatternSeed);
    sh.setUniform("u_goalPos", [this.goalPos.x, this.goalPos.y, this.goalPos.z]);
  }
  update(){
    this.eyes.loop("update");
    this._player.update();
    for(let eye of this.eyes){ this.calcDamage(eye); }
    this._particleArray.loopReverse("update");
    this._particleArray.loopReverse("eject");
    this._properFrameCount++;
    this.clearCheck();
    this.gameOverCheck(); // fadeOut→initializeの流れ
  }
  clearCheck(){
    // プレイヤー生きててゴールに触れたならフェードアウトを開始して
    // なおかつクリアフラグを立てる
    // クリアフラグ立っててフェードアウト終わってるなら
    // ルームナンバーを更新して次のステージをスタートさせる
    // フラグを立てるのはその間にメッセージ出したいから
    if(!this._player.isAlive()){ return; }
    if(!this.clearFlag){
      const pos = this._player.position;
      if(mag(pos.x - this.goalPos.x, pos.y - this.goalPos.y) < this.goalCheckThreshold * GRID){
        this.goalPos.z = 1;
        this.clearFlag = true;
        this._fade.setFadeOutFlag(true);
      }
    }else{
      if(!this._fade.getFadeOutFlag()){
        // 必要ならルームナンバーを増やす？1とかして。
        this.roomInitialize((this.roomNumber + 1) % ROOMNUMBER_MAX);
      }
    }
  }
  gameOverCheck(){
    // ゆくゆくはこっちでkillの処理をする感じね
    // calcDamageは文字通りダメージを計算してHPに反映させるだけ
    // それが0になったらこっちでアウトの判定（というかaliveを
    // falseにする処理をplayer側で行う感じね）
    // んでフェードアウトを開始してgameoverFlagをON
    // なおフラグを立てるのはその間になんかメッセージ出したいから
    // そして↓
    // プレイヤー死んでてfadeOut終わってたら戻す。
    if(this._player.isAlive()){ return; }
    if(!this.gameoverFlag){
      this.kill();
      this.gameoverFlag = true;
    }else{
      if(!this._fade.getFadeOutFlag()){
        this.roomInitialize(0); // ゲームオーバーの場合は最初に戻る
      }
    }
    //if(!this._player.isAlive() && !this._fade.getFadeOutFlag()){
    //  this.roomInitialize();
    //}
  }
  calcDamage(eye){
    // クリアフラグが立ってるならダメージを受けないように
    // しないといけない
    if(this.clearFlag || this.gameoverFlag){ return; }
    const pPos = this._player.position;
    const ePos = eye.position;
    const ray = p5.Vector.sub(pPos, ePos).normalize();
    const cur = createVector(ePos.x, ePos.y);
    let d;
    for(let rep = 0; rep < 32; rep++){
      d = distFunction(cur);
      if(d < THRESHOLD){ break; }
      cur.x += ray.x * d;
      cur.y += ray.y * d;
    }
    let l = p5.Vector.dist(pPos, ePos); // 倍率はexp(-l*l/3)くらいにしようかな（距離2でおよそ0.25になる）
    const lDir = eye.lightDirection;
    const lVector = createVector(Math.cos(lDir), Math.sin(lDir));
    const lRange = eye.lightRange;
    if(p5.Vector.dist(cur, ePos) > l && p5.Vector.dot(ray, lVector) > lRange && this._player.isAlive()){
      //this.kill(); // 殺す処理
      const damage = Math.exp(-l*l/3.0) * eye.getAttackFactor(); // 攻撃力を考慮
      // パーティクル発生
      // プレイヤーのは地味だから要らないや。ゲージだけ減らそう。で、個別だと面倒だからそのまま使う・・感じで。
      // って思ったけど広い範囲を移動する際に面倒な・・ならないか。
      // 画面全体・・んー。
      this.createParticle(4 + this._player.getLifeRatio() * 316, 8, 6, 30, 4, 10);
      this._player.changeLife(-damage); // 1ダメージで死ぬ
    }
  }
  kill(){
    //this._player.alive = false;
    const pos = this._player.position;
    this.createParticle((pos.x + 1.0) * 0.5 * width, (1.0 - pos.y) * 0.5 * height, 12, 60, 4, 40);
    //this.fadeOutCount = 1;
    this._fade.setFadeOutFlag(true);
  }
  createParticle(x, y, _size, life, speed, count, r = 255, g = 255, b = 255){
    // HPゲージ：sizeFactor = 6, life = 30, speed = 4, count = 5.
    // ゴール地点のパーティクル：sizefactor = 3, life = 15, speed = 4, count = 2;
    // targetは発生場所。レーザーの場合はくらった相手の場所に発生させる。
    // 光によるダメージ：sizeFactor = 4, life = 15, speed = 4, count = 2.
    const size = _size;  // やられる時は0.7, ダメージ時は2.0で。
    const _color = color(r, g, b);
    let newParticle = new Particle(x, y, size, _color, life, speed, count);
    this._particleArray.add(newParticle);
  }
  draw(){
    clear();
    let gr = this.baseGraphic;
    gr.background(0);
    this.setUniform();
    this._lightEffect.quad(-1, -1, -1, 1, 1, 1, 1, -1);
    gr.image(this._lightEffect, 0, 0);
    // lightEffectの一部をbaseGraphicに落とす。そのうえで、
    // offsetを考慮して目玉やプレイヤーを配置すればいい。

    this._player.draw(gr);
    this.eyes.loop("draw", [gr])
    this._particleArray.loop("draw", [gr]);

    this._fade.fadeIn(gr);
    this._fade.fadeOut(gr);

    // フェードインの間にルームナンバー出した方がよさそうならその処理
    // クリアフラグやゲームオーバーフラグが立ってるならなんか出す

    image(gr, 0, 0);

    this.drawInformation();

    image(this.informationLayer, 0, 0);
  }
  drawInformation(){
    let gr = this.informationLayer;
    gr.clear();
    gr.fill(255);
    if(this._fade.getFadeInFlag()){
      gr.text("room" + this.roomNumber + ":caption this.", width * 0.5, height * 0.5);
    }
    if(this.gameoverFlag){
      gr.text("GAMEOVER...", width * 0.5, height * 0.5);
    }
    if(this.clearFlag){
      gr.text("CLEAR!", width * 0.5, height * 0.5);
    }
    if(this._player.isAlive()){
      const ratio = this._player.getLifeRatio();
      gr.image(this.lifeGaugeImg, 2, 2, 316 * ratio, 12, 0, 0, 320 * ratio, 16);
    }
  }
}

// 再利用しやすいようにしました。
// fadeInLimitとfadeOutLimitを設定します。
// fadeInLimitでfadeInしてfadeOutLimitでfadeOut,なんですが、
// その間に何かしたいかもしれないということで簡単なイージングを・・
// 多分イージングの方がいいのでしょうね・・むぅ。
// fadeInEasing, fadeOutEasingとか。まあわかりにくいですからね。
class Fade{
  constructor(fadeInLimit = 60, fadeOutLimit = 120, fadeInRatio = 1.0, fadeOutRatio = 0.5){
    this.fadeInFlag = false;
    this.fadeInCount = 0;
    this.fadeInLimit = fadeInLimit;
    this.fadeInRatio = fadeInRatio;
    this.fadeOutFlag = false;
    this.fadeOutCount = 0;
    this.fadeOutLimit = fadeOutLimit;
    this.fadeOutRatio = fadeOutRatio;
  }
  setFadeInFlag(flag){ this.fadeInFlag = flag; }
  getFadeInFlag(){ return this.fadeInFlag; }
  fadeIn(gr){
    if(!this.fadeInFlag){ return; }
    if(this.fadeInCount < this.fadeInLimit * this.fadeInRatio){
      let prg = this.fadeInCount / (this.fadeInLimit * this.fadeInRatio);
      prg = prg * prg * (3 - 2 * prg);
      gr.background(0, 255 * (1 - prg));
    }
    this.fadeInCount++;
    if(this.fadeInCount > this.fadeInLimit){
      this.fadeInReset();
    }
  }
  fadeInReset(){
    this.fadeInFlag = false;
    this.fadeInCount = 0;
  }
  fadeOutReset(){
    this.fadeOutFlag = false;
    this.fadeOutCount = 0;
  }
  setFadeOutFlag(flag){ this.fadeOutFlag = flag; }
  getFadeOutFlag(){ return this.fadeOutFlag; }
  fadeOut(gr){
    if(!this.fadeOutFlag){ return; }
    if(this.fadeOutCount > this.fadeOutLimit * (1 - this.fadeOutRatio)){
      let prg = (this.fadeOutLimit - this.fadeOutCount) / (this.fadeOutLimit * this.fadeOutRatio);
      prg = prg * prg * (3 - 2 * prg);
      gr.background(0, 255 * (1 - prg));
    }
    this.fadeOutCount++;
    if(this.fadeOutCount > this.fadeOutLimit){
      this.fadeOutReset();
    }
  }
}

// ------------------------------------------------------------ //
// pattern.

// distFunctionをどうするか。
// とりあえずObstacle作ったので・・
// distFunctionの中身を設定する感じの、あれ。
// distFunctionで一つのクラスにして

// ここでやること
// eyes用意
// playerのinitialize
// Obstacle生成
// fsLight作り直して再読み込み
// 作ったシェーダは名前を付けてmySystemに登録（同じことを2回以上しない）
// たとえば"shader0:これ"みたいにして。
// ある場合はそこから取るわけね
// distFunctionの作成
// おわり！
// eyesの行動パターン登録を・・
function room0(){

  mySystem.goalPos.set(-17 * GRID, 17 * GRID, 0);
  mySystem.goalCheckThreshold = 1.0;

  // Eyes.
  let eyes = [];
  eyes.push(new EnemyEye(0.0, 0.0, TAU / 295, 0.65, 0.05));
  eyes[0].setMoveFunc((c, pos) => {
    pos.set(0.5 * Math.sin(TAU * c / 360), 0.0);
  });
  eyes.push(new EnemyEye(0.0, 0.0, TAU / 180, 0.99, 0.35));
  eyes[1].setMoveFunc((c, pos) => {
    pos.set(-0.5, -0.3+0.3*Math.sin(TAU * c / 360));
  });
  mySystem.registEyes(eyes);

  // Player.
  mySystem._player.initialize(0.4, 0.8);

  // Obstacles.
  let obs = [];
  obs.push(new CircleObstacle(0, -6, 12, 4));
  obs.push(new RectObstacle(1, 5, -10, 11, -6));
  obs.push(new SquareObstacle(2, 8, 10, 7));
  obs.push(new SegmentObstacle(3, -14, 0, 6, 2, 6));
  obs.push(new SquareObstacle(4, -2, -8, 8));

  createWall(5, obs); // 壁を作る

  // 処理は簡潔に。
  mySystem.shaderReset(obs, "shader0");
}

// そのうち追加しやすくする・・tweenほしいわね
// 光の出る感じのあれこれとか操作しやすくしたいので(ぐるぐるだけじゃね)
function room1(){
  mySystem.goalPos.set(0 * GRID, -8 * GRID, 0);
  mySystem.goalCheckThreshold = 1.0;

  // Eyes.
  let eyes = [];
  eyes.push(new EnemyEye(0.0, 0.0, TAU / 200, 0.6, 0.55));
  eyes[0].setMoveFunc((c, pos) => {
    pos.set(-0.7, -0.5 * Math.sin(TAU * c / 360));
  });
  eyes.push(new EnemyEye(0.0, 0.0, TAU / 200, 0.6, 0.65));
  eyes[1].setMoveFunc((c, pos) => {
    pos.set(0.7, 0.5 * Math.sin(TAU * c / 360));
  });
  mySystem.registEyes(eyes);

  // Player.
  mySystem._player.initialize(-0.4, 0.8);

  // Obstacles.
  let obs = [];
  obs.push(new RectObstacle(0, -11, 7, -9, 13));
  obs.push(new RectObstacle(1, -11, -13, -9, -7));
  obs.push(new RectObstacle(2, 9, 7, 11, 13));
  obs.push(new RectObstacle(3, 9, -13, 11, -7));
  obs.push(new SquareObstacle(4, 0, 0, 4));

  createWall(5, obs); // 壁を作る

  // 処理は簡潔に。
  mySystem.shaderReset(obs, "shader1");
}

// 外周を作るのは処理を再利用しましょうね
function createWall(startIndex, obs){
  obs.push(new RectObstacle(startIndex, -20, 19, 20, 20));
  obs.push(new RectObstacle(startIndex+1, -20, -20, -19, 20));
  obs.push(new RectObstacle(startIndex+2, 19, -20, 20, 20));
  obs.push(new RectObstacle(startIndex+3, -20, -20, 20, -19));
}

function createDistFuncDescription(obs){
  // 距離関数の部分
  let upperPart = "float getDist(vec2 p){";
  for(let ob of obs){
    upperPart += ob.getString();
  }
  // 距離を返す部分
  let lowerPart = "  float result = 99999.0;";
  for(let i = 0; i < obs.length - (obs.length % 2); i += 2){
    lowerPart += "  result = min(result, min(d" + i.toString() + ", d" + (i+1).toString() + "));";
  }
  if(obs.length % 2 == 1){
    lowerPart += " result = min(result, d" + (obs.length - 1).toString() + ");";
  }
  lowerPart += "  return result;";
  lowerPart += "}";
  return upperPart + lowerPart;
}

function createDistFunction(obs){
  return (p) => {
    let d = 99999.0;
    for(let ob of obs){
      const d1 = ob.getDist(p);
      if(d1 < d){ d = d1; }
    }
    return d;
  }
}
