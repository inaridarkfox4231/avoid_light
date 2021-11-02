// もってきたよ～

// --------------------------------------------------------------------------------------- //
// Global.

let myGame; // ノード
let mySystem; // システム
let img0; // プレイヤー画像. 96x96で上、右、下、左がそれぞれの方向を向いている。真ん中はバタンキュー。
// バタンキュー一瞬のあと消えても面白いかも。上：32,0,32,32 右：64,32,32,32 下：32,64,32,32 左：0,32,32,32

// --------------------------------------------------------------------------------------- //
// Constants.（各種定数）

const DEFAULT_FLOOR_ALPHA = 0.0; // 床をみえるようにする（テスト用）
//const ROOMNUMBER_MAX = 3; // 2の場合0と1があるということです（以下略）→廃止
const GRID = 0.05; // これを使って簡単に位置指定

// キャンバスサイズ
const CANVAS_W = 640;
const CANVAS_H = 640;

// 部屋数
const MAX_ROOMID = 3; // 部屋の最大数
const MAX_LEVELID = 3; // EASY, NORMAL, HARD.

// KEYCODE定数
// ああなるほど、これシステム側に書かないといけないんだ・・・

const K_ENTER = 13;
const K_RIGHT = 39;
const K_LEFT = 37;
const K_UP = 38;
const K_DOWN = 40;
const K_SPACE = 32;
const K_SHIFT = 16; // シフトキー。
const K_CTRL = 17; // コントロールキー。今回はこれをポーズに使う。

const IS_ONPLAY = 0;
const IS_ALLCLEAR = 1;
const IS_GAMEOVER = 2;

// --------------------------------------------------------------------------------------- //
// preloading.
// まあ基本的にはアセットを配置する形の方がいいんでしょうね。サンプル作るなら図形描画でいいんだけど。

function preload(){
  img0 = loadImage("https://inaridarkfox4231.github.io/assets/charaImage/blackfox2.png");
}

// --------------------------------------------------------------------------------------- //
// Main.

function setup(){
  createCanvas(CANVAS_W, CANVAS_H);
  //angleMode(DEGREES);
  myGame = new Game();
  myGame.createScenes(); // シーンを作る
}

function draw(){
  myGame.update();
  myGame.draw();
  myGame.shift();
}

// --------------------------------------------------------------------------------------- //
// Game.（Sceneを統括する。切り替えなどを行う。）

class Game{
  constructor(){
    this.scenes = {};
    this.currentScene = undefined;
  }
  createScenes(){
    // thisはnodeとして格納されすべてのSceneはnode経由で他のSceneを参照できる（必要に応じて）
    this.scenes.title = new TitleScene(this);
    this.scenes.play = new PlayScene(this);
    //this.scenes.clear = new ClearScene(this);
    //this.scenes.gameover = new GameoverScene(this);
    this.scenes.pause = new PauseScene(this); // 一応、用意しといて。
    this.scenes.result = new ResultScene(this);
    this.currentScene = this.scenes.title;
  }
  getScene(sceneName){
    if(sceneName === ""){ return undefined; }
    return this.scenes[sceneName];
  }
  setScene(nextScene){
    this.currentScene.setNextScene("");
    nextScene.prepare(this.currentScene); // 次のSceneに準備をさせる
    this.currentScene = nextScene;
  }
  update(){
    this.currentScene.update();
  }
  draw(){
    this.currentScene.draw();
  }
  shift(){
    // シーンの切り替えは毎フレームdrawの直後に行う
    const nextScene = this.currentScene.getNextScene();
    if(nextScene !== undefined){
      this.setScene(nextScene);
    }
  }
}

// --------------------------------------------------------------------------------------- //
// Scene.

class Scene{
  constructor(_node){
    this.node = _node;
    this.name = "";
    this.gr = createGraphics(CANVAS_W, CANVAS_H);
    this.nextScene = undefined;
  }
  getName(){ return this.name; } // 名前は取得できた方がいいんじゃない？
  getNextScene(){ return this.nextScene; }
  setNextScene(sceneName){ this.nextScene = this.node.getScene(sceneName); }
  prepare(_scene = undefined){ /* 遷移時に必ず実行される。前のシーンの情報を元に何かする */ }
  keyAction(code){ /* キーイベント */}
	update(){}
	draw(){}
}

// --------------------------------------------------------------------------------------- //
// TitleScene.

class TitleScene extends Scene{
  constructor(_node){
    super(_node);
    this.name = "title";
    this.base = createGraphics(CANVAS_W, CANVAS_H);
    this.gr.textAlign(CENTER, CENTER);
    this.gr.textSize(min(CANVAS_W, CANVAS_H) * 0.04);
    createTitleBase(this.base);
    //this.btnSet = getButtonSetForSTG(); // ボタンセットを取得
    this.buttonIndex = 0; // updateで更新される。エンターキーを押すときここが-1でないなら・・
    this.prepare(); // ノードステートなので・・ロゴが入るならここには何も書かないかも。
  }
  prepare(_scene = undefined){
    //createTitleBase(this.gr);
    //this.btnSet.reset(); // リセットして大きさとか戻す
    this.resetButtonIndex();
  }
  resetButtonIndex(){
    this.buttonIndex = 0;
  }
  getButtonIndex(){
    // play側で取得してどのステージにするのか決める感じ
    return this.buttonIndex;
  }
  keyAction(code){
    if(code === K_ENTER && this.buttonIndex >= 0){ this.setNextScene("play"); }
    else if(code === K_DOWN){ this.buttonIndex = Math.min(this.buttonIndex + 1, MAX_LEVELID - 1); }
    else if(code === K_UP){ this.buttonIndex = Math.max(this.buttonIndex - 1, 0); }
  }
  update(){
    // タイトルアニメーションとかですかね。
    // その場合背景とは別にイメージを用意してそっちを更新しつつレイヤーごとに描画ってなると思う。
    // そっちをテンプレにすべきかどうか思案。というか背景が更新される形？んんん・・
    //this.btnSet.getButtonIndex({id:this.buttonIndex});
  }
  draw(){
    clear();
    //this.btnSet.draw(this.gr);
    const id = this.getButtonIndex();
    this.gr.clear();
    this.gr.image(this.base, 0, 0);
    this.gr.text(id, CANVAS_W * 0.5, CANVAS_H * 0.8);
    image(this.gr, 0, 0);
  }
}

// --------------------------------------------------------------------------------------- //
// Global functions for TitleScene.

function createTitleBase(gr){
  const SCALE = min(CANVAS_W, CANVAS_H);
  gr.background(220);
  gr.textSize(SCALE * 0.04);
  gr.textAlign(CENTER, CENTER);
  gr.fill(0);
  gr.text("AVOID LIGHT", CANVAS_W * 0.5, CANVAS_H * 0.25);
  gr.text("PRESS ENTER KEY", CANVAS_W * 0.5, CANVAS_H * 0.35);
}

// --------------------------------------------------------------------------------------- //
// PlayScene.

class PlayScene extends Scene{
  constructor(_node){
    super(_node);
    this.name = "play";
    //this._system = createSystem(CANVAS_W, CANVAS_H, 1024);
    this._system = new System();
    mySystem = this._system; // 汚いやり方だけどね・・
    //this._system.registBackgrounds(preload_bgs);
    // ここでパターンを生成する感じ。
    //this.generatePattern();
  }
  /*
  generatePattern(){
    // プレイヤーの武器を用意する。別コード。
    this._system.createPlayer(getWeaponSeeds());

    // ステージのデータを取得する。別コード。
    let seeds = getPatternSeeds();
    for(let seed of seeds){
      this._system.addPatternSeed(seed);
    }
  }
  */
  prepare(_scene = undefined){
    // タイトルからidを取得してレベル設定に使う。
    if(_scene.getName() === "title"){
      const level = _scene.getButtonIndex();
      //this._system.setLevel(level);
      this._system.initialize(level); // 0:EASY, 1:NORMAL, 2:HARD
      //this._system.roomInitialize(0);
    }

    //const stageIndex = _scene.getButtonIndex();

    //this._system.setPattern(stageIndex);
  }
  keyAction(code){
    // ポーズ作ってから考えるね・・
    //this.setNextScene(this._system.keyAction(code));
  }
  update(){
    // 何か、する？
    // thisを渡すのはシーンの遷移をさせるためではないかと（知るか）
    this._system.update(this);
    const flag = this._system.getShiftFlag();
    // ここら辺のコードは再利用が効きそう
    // もっとも次のステージに移る際とかは違う処理が必要かもだけど
    if(flag === IS_ALLCLEAR || flag === IS_GAMEOVER){ this.setNextScene("result"); }
    //if(flag === IS_GAMEOVER){ this.setNextScene("gameover"); }
  }
  draw(){
    clear();
    this._system.draw(this.gr);
    image(this.gr, 0, 0);
  }
}

// --------------------------------------------------------------------------------------- //
// System.（PlaySceneの中身）
// こちらに書くことはない。

// --------------------------------------------------------------------------------------- //
// PauseScene.
// おいおいね・・・

class PauseScene extends Scene{
  constructor(_node){
    super(_node);
    this.name = "pause";
  }
  prepare(_scene = undefined){

  }
  keyAction(code){ /* キーイベント */}
	update(){}
	draw(){}
}

// --------------------------------------------------------------------------------------- //
// ResultScene.
// リザルトシーンですね～

class ResultScene extends Scene{
  constructor(_node){
    super(_node);
    this.name = "result";
    this.base = createGraphics(CANVAS_W, CANVAS_H);
    this.base.background(0);
    this._result;
  }
  prepare(_scene = undefined){
    // _sceneはplay一択なのでリザルト受け取るだけです
    // とりあえずそれ表示するだけでいいから
    const SCALE = min(CANVAS_W, CANVAS_H);
    this.gr.textSize(SCALE * 0.04);
    this.gr.fill(255);
    this.gr.textAlign(CENTER, CENTER);
    this._result = _scene._system.getResult();
  }
  keyAction(code){
    // まあここはいいよね。
    if(code === K_ENTER){ this.setNextScene("title"); }
  }
  update(){
    // え？
  }
  draw(){
    clear();
    image(this.base, 0, 0);
    this._result.draw(this.gr); // リザルトになんか描いてもらう
    image(this.gr, 0, 0);
  }
}

// --------------------------------------------------------------------------------------- //
// ClearScene.
// playから受け取った画像を・・んー。どうするかな。
// わざわざ分ける必要ない？Systemのそのまま使ったうえで、グレーかけて文字表示するみたいなのでもいいかも。
// つまりplayからsystemを譲り受けてそれそのまま描画したうえで・・
// んー、いいや。文字表示するだけでいいや。そこまであっちには含めたくないからこっちで描画したいというわけ。
/*
class ClearScene extends Scene{
  constructor(_node){
    super(_node);
    this.name = "clear";
    this.grPlay = createGraphics(CANVAS_W, CANVAS_H);
    this._system;
  }
  prepare(_scene = undefined){
    // _sceneはplayで確定なのでsystemやgrなどを譲り受ける
    // それを自らのgrに落としてそのうえでテキストを・・って感じ
    const SCALE = min(CANVAS_W, CANVAS_H);
    this.gr.textSize(SCALE * 0.06);
    this.gr.fill(0);
    this.gr.textAlign(CENTER, CENTER);
    this.grPlay = _scene.gr;
    this._system = _scene._system;
  }
  keyAction(code){
    if(code === K_ENTER){ this.setNextScene("title"); }
  }
  clickAction(){
  }
  update(){
    // 特に・・アニメーションあるなら？そういうのを？花火とか。
    // プレイ画面におっかぶせるんだったら何かしたいよね。文字出すだけじゃなくて。おいおいね・・
    this._system.update();
  }
  draw(){
    clear();
    this._system.draw(this.grPlay);
    this.gr.image(this.grPlay, 0, 0);
    this.gr.text("clear!", CANVAS_W * 0.5, CANVAS_H * 0.45);
    this.gr.text("press enter...", CANVAS_W * 0.5, CANVAS_H * 0.55);
    image(this.gr, 0, 0);
  }
}
*/
// --------------------------------------------------------------------------------------- //
// GameoverScene.
/*
class GameoverScene extends Scene{
  constructor(_node){
    super(_node);
    this.name = "gameover";
    this.grPlay = createGraphics(CANVAS_W, CANVAS_H);
    this._system;
  }
  prepare(_scene = undefined){
    // だいたい同じような感じですかね・・変化を加えたいならなんかいじるかもだけど。
    const SCALE = min(CANVAS_W, CANVAS_H);
    this.gr.textSize(SCALE * 0.06);
    this.gr.fill(0);
    this.gr.textAlign(CENTER, CENTER);
    this.grPlay = _scene.gr;
    this._system = _scene._system;
  }
  keyAction(code){
    if(code === K_ENTER){ this.setNextScene("title"); }
  }
  clickAction(){
  }
  update(){
    // ゲームオーバー感を演出する何か・・まあ無くてもいい気も。
    this._system.update();
  }
  draw(){
    clear();
    this._system.draw(this.grPlay);
    this.gr.image(this.grPlay, 0, 0);
    this.gr.text("gameover...", CANVAS_W * 0.5, CANVAS_H * 0.45);
    this.gr.text("press enter!", CANVAS_W * 0.5, CANVAS_H * 0.55);
    image(this.gr, 0, 0);
  }
}
*/

// --------------------------------------------------------------------------------------- //
// Buttons.
// ボタンは3つ。EASYとNORMALとHARDだけ。え？ランク？？何それ
/*
function getButtonSetForSTG(){
  // ここで作る！！
  const ox = 0;
  const oy = 320;
  const w = 480;
  const h = 220;
  let btnSet = new ButtonSet(ox, oy, w, h);
  btnSet.registButton(new Button(30, 30, 120, 160));
  btnSet.registButton(new Button(180, 30, 120, 160));
  btnSet.registButton(new Button(330, 30, 120, 160));
  return btnSet; // はやっ
}
*/
// --------------------------------------------------------------------------------------- //
// Interaction.（クリックやキー入力の関数）

function keyPressed(){
  myGame.currentScene.keyAction(keyCode);
	return false;
}
/*
function mouseClicked(){
	myGame.currentScene.clickAction();
	return false;
}
*/

// 以下、システム関連。
// ------------------------------------------------------------------------------------------------------------------------- //

// ------------------------------------------------------------ //
// obstacle.

// 正方形や円。StageDataのdistFunctionを構成する要素。
// 衝突判定の構成要素を作る感じ。そう。
// 色により性質が異なる感じで。
// getStringのうち最初のid,pos.x,pos.y,rotは共通なので、
// まとめてメソッドにしてしまえばいいと思う。
// めんどうだから最初の3つは中心と回転でいい気がするわねめんどくさい
class Obstacle{
  constructor(id, x, y, rot){
    this.id = id;
    this.typeName = ""; // これもstringに織り込む
    this.position = createVector(x * GRID, y * GRID); // GRIDの半整数倍または整数倍
    this.rotation = rot; // radian.
    this.active = false; // 動くかどうか的な。動いてるとプレイヤーを殺す。
    this.moveFunc = (ob) => {};
    this.count = 0;
  }
  isActive(){
    return this.active;
  }
  activate(){
    this.active = true;
  }
  inActivate(){
    this.active = false;
  }
  setPosition(x, y){
    this.position.set(x, y);
  }
  setRotation(_rot){
    this.rotation = _rot;
  }
  getPosition(){
    return this.position;
  }
  getRotation(){
    return this.rotation;
  }
  getDist(p){
    return 0;
  }
  getPrefix(){
    // getStringのうち最初のid,pos.x,pos.y,rot部分を抜き出す。
    // posとrotはuniformから放り込むのでこっちに書くことはないわね・・
    let result = "  float d";
    result += this.id.toString();
    result += " =";
    result += this.typeName;
    result += "(p, vec2(u_obsPos[" + this.id.toString() + "].x, u_obsPos[" + this.id.toString() + "].y), ";
    result += "u_obsRot[" + this.id.toString() + "], ";
    return result;
  }
  transform(p){
    // pをpositionだけずらしてrotationだけ回転させる感じ
    let q = createVector(p.x, p.y);
    q.sub(this.position);
    const x = q.x * Math.cos(this.rotation) + q.y * Math.sin(this.rotation);
    const y = -q.x * Math.sin(this.rotation) + q.y * Math.cos(this.rotation);
    q.set(x, y);
    return q;
  }
  getString(){
    return "";
  }
  setMoveFunc(func){
    this.moveFunc = func;
  }
  update(){
    this.moveFunc(this);
    this.count++;
  }
}

// 長方形。中心ベクトルとサイズベクトルで4次元。
// a,b,c,dで(a,b)～(c,d)のあれで。左下と右上。
// やめた。aとbが縦と横。GRID掛けてね。
class RectObstacle extends Obstacle{
  constructor(id, x, y, rot, a, b){
    super(id, x, y, rot);
    this.typeName = "rect";
    this.sizeVector = createVector(a * GRID, b * GRID); // 横幅と縦幅
  }
  getDist(p){
    // GLSLと同じ処理になるように書きます！つまり先に平行移動と回転を終わらせておく。
    let q = this.transform(p);
    const dx = abs(q.x) - 0.5 * this.sizeVector.x;
    const dy = abs(q.y) - 0.5 * this.sizeVector.y;
    return max(dx, dy);
  }
  getString(){
    return this.getPrefix() + "vec2(" + this.sizeVector.x.toString() + ", " + this.sizeVector.y.toString() + "));";
  }
}

// 円。中心ベクトルと半径で3次元。
// a,bとr.グリッドの半整数倍許す。rは半径。これも半整数OK.
class CircleObstacle extends Obstacle{
  constructor(id, x, y, rot, r){
    super(id, x, y, rot);
    this.typeName = "circle";
    this.radius = r * GRID;
  }
  getDist(p){
    let q = this.transform(p);
    return p5.Vector.mag(q) - this.radius;
  }
  getString(){
    return this.getPrefix() + this.radius.toString() +");";
  }
}

// 線分。中心ベクトルと方向、幅、長さで5次元くらい？
// directionはTAU/24の整数倍で指定する。で、他はまあGRIDを掛けるのです・・
// つまり下に伸びるなら6で上に伸びるなら-6を用意するのね。(a,b)が端点になるわね。左に伸びるなら0だわね。
// てかrot使うならdirection要らないわね。横でいい。(1,0)でいいじゃんね。となると左方向に伸びるのがデフォルト。
class SegmentObstacle extends Obstacle{
  constructor(id, x, y, rot, radius, lgh){
    super(id, x, y, rot);
    this.typeName = "segment";
    this.radius = radius * GRID; // 線分の幅
    this.lgh = lgh * GRID; // 伸びる長さ
  }
  getDist(p){
    //const q1 = p5.Vector.sub(p, this.position);
    const q1 = this.transform(p);
    const multiplier = max(-this.lgh, min(0.0, q1.x));
    const q2 = createVector(multiplier, 0);
    return p5.Vector.dist(q1, q2) - this.radius;
  }
  getString(){
    return this.getPrefix() + this.radius.toString() + ", " + this.lgh.toString() + ");";
  }
}

// 正方形。
// a,bで半整数倍許す。この場合はlかな。一辺の長さなので。
class SquareObstacle extends Obstacle{
  constructor(id, x, y, rot, l){
    super(id, x, y, rot);
    this.typeName = "square";
    this.size = l * GRID; // 一辺の長さ
  }
  getDist(p){
    let q = this.transform(p);
    const dx = abs(q.x) - 0.5 * this.size;
    const dy = abs(q.y) - 0.5 * this.size;
    return max(dx, dy);
  }
  getString(){
    return this.getPrefix() + this.size.toString() +");";
  }
}

// ------------------------------------------------------------------ //
// player.

// プレイヤー。十字キーとスペースキーで操作。
class Player{
  constructor(){
    this.img = createGraphics(32, 32);
    this.allImg = img0;
    this.position = createVector();
    this.nextPosition = createVector();
    this.velocity = createVector(0, 0);
    this.maxLife = 60;
    this.life = this.maxLife;
    this.alive = true;
    this.rest = 3;
    this.maxRest = 3; // ゲームスタート時に初期化するんだけどね
    this.createPlayerImage();
  }
  createPlayerImage(){
    this.img.image(this.allImg, 0, 0, 32, 32, 32, 64, 32, 32);
  }
  initialize(x, y){
    this.position.set(x, y);
    this.alive = true;
  }
  lifeReset(){
    // ゲームオーバーの時だけ。
    this.life = this.maxLife;
  }
  restReset(){
    this.rest = this.maxRest;
  }
  imgReset(){
    this.img.clear();
    this.img.image(this.allImg, 0, 0, 32, 32, 32, 64, 32, 32);
  }
  getLifeRatio(){
    return this.life / this.maxLife;
  }
  setMaxRest(n){
    this.maxRest = n; // levelから設定
  }
  getRest(){
    return this.rest;
  }
  changeLife(diff){
    this.life = constrain(this.life + diff, 0, this.maxLife);
    if(this.life === 0){ this.alive = false; } // 死んだ！
  }
  changeRest(diff){
    this.rest = constrain(this.rest + diff, 0, this.maxRest);
  }
  update(){
    if(!this.alive){ return; } // 死んだ！
    this.velocity.set(0.0, 0.0);
    const playerSpeed = (keyIsDown(32) ? 0.02 : 0.01);
    if(keyIsDown(LEFT_ARROW)){
      //this.velocity.x = -playerSpeed;
      this.setVelocity(2, playerSpeed);
    }else if(keyIsDown(RIGHT_ARROW)){
      //this.velocity.x = playerSpeed;
      this.setVelocity(0, playerSpeed)
    }
    if(keyIsDown(UP_ARROW)){
      //this.velocity.y = playerSpeed;
      this.setVelocity(1, playerSpeed);
    }else if(keyIsDown(DOWN_ARROW)){
      //this.velocity.y = -playerSpeed;
      this.setVelocity(3, playerSpeed);
    }
    this.nextPosition.set(this.position.x + this.velocity.x, this.position.y + this.velocity.y);
    // nextPosが条件を満たすならば位置を更新
    if(this.movable()){ this.position.add(this.velocity); }
  }
  setVelocity(id, speed){
    // idの0,1,2,3に応じてdxとdyに応じて速度を変更
    const dx = [1,0,-1,0];
    const dy = [0,1,0,-1];
    this.velocity.x += dx[id] * speed;
    this.velocity.y += dy[id] * speed;
    this.img.clear();
    this.img.image(this.allImg, 0, 0, 32, 32, 32 * (1 + dx[id]), 32 * (1 - dy[id]), 32, 32);
  }
  movable(){
    // バウンドチェック
    // distFunctionはそのうちsystemからアクセスするように・・
    let info = mySystem.getDistInfo(this.nextPosition);
    if(info.dist > 0.04){ return true; }
    if(info.closest.isActive()){ this.changeLife(-99999); } // 動いてるなら即死. ここで死ぬフラグが立つわけね。
    return false;
  }
  isAlive(){
    return this.alive;
  }
  draw(gr, prg = 0.0){
    if(!this.alive){ return; } // 死んだ！
    if(prg > 0.9999){ return; } // 描画しない
    prg = pow(prg, 5.0);
    const q = getGlobalPosition(this.position);
    // prg > 0の場合に横につぶれて消える～どうやるんだっけ
    gr.image(this.img, q.x - 16 + 16 * prg, q.y - 16, 32 - 32 * prg, 32, 0, 0, 32, 32);
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
    this.img = createGraphics(32, 32);
    this.position = createVector(x, y);
    this.moveFunc = (eye) => {};
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
    // 32x32でリメイク
    this.img.noStroke();
    this.img.colorMode(HSB,100);
    this.img.fill(this.lightHue * 100, 100, 100);
    this.img.circle(16, 16, 32);
    this.img.fill(100);
    this.img.circle(25, 16, 14);
    this.img.fill(0);
    this.img.circle(27, 16, 10);
    this.img.stroke(0);
    this.img.fill(100);
    const t = -PI / 6;
    this.img.circle(27 + 3 * Math.cos(t), 16 + 3 * Math.sin(t), 4);
    this.img.noStroke();
  }
  update(){
    this.lightDirection += this.rotationSpeed; // そのうちこれの変化も織り込むつもり・・難しいけど。
    // プログラムされたとおりに移動
    // thisでいいでしょ。
    this.moveFunc(this);
    this.count++;
  }
  draw(gr){
    const e = getGlobalPosition(this.position);
    gr.translate(e.x, e.y);
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

    // 遷移フラグ
    this.shiftFlag = IS_ONPLAY;

    // シェーダー
    this.vsLight = getVertexShader();
    let fs = getFragmentShader();
    this.fsLightUpper = fs.upper;
    this.distFuncDescription = fs.dist;
    this.fsLightLower = fs.lower;
    // 距離関数(メンバにすることにした)
    this.distFunction = () => {};

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

    this.roomSet = [room0, room1, room2];
    this.roomNumber = 0; // ここが1とか2とかになるという・・
    this.level = 0; // 0, 1, 2.
    this.floorPatternSeed = 0;
    this.defaultFloorAlpha = DEFAULT_FLOOR_ALPHA;
    // ギミックで上げたりしたら面白そう
    this._result = new Result(); // リザルト

    this.clearFlag = false;
    this.killedFlag = false;

    // クリア判定はこのポイントに触れたときとする（大きさが）
    // つまり正方形に触れるのではなく中心にちゃんと来ないとだめ
    // シェーダー側でこれを中心に正方形、で、vec4(0.0)にする。
    // 0.05刻みで指定してくださいそのプラスマイナス0.05で正方形です
    this.goalCheckThreshold = 1.0; // これを増減させてレベルを動かせそう

    this.obstacles = new SimpleCrossReferenceArray(); // 障害物たち（必要ですかね・・）
    // これないとsetUniformできないので必須ですね。
    this.checkpoints = new SimpleCrossReferenceArray(); // チェックポイントたち
    // 中身は長さ3のベクトルで第3成分は0で乗ると1になるわけね。全部乗るとゴールが解放される感じ。
    this.goalPosition = createVector(0.0, 0.0, 0.0); // ゴールの正方形の中心(3つ目の引数で解放されたかどうかを示す)
    // これに乗ったらステージクリア

    this.stageSize = createVector(); // ステージの大きさ・・プレイヤーの描画の際のオフセット指定に使う。
    // プレイヤーの実位置を使うので計算注意
  }
  getDistInfo(p){
    return this.distFunction(p);
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
    this.distFuncDescription = createDistFuncDescription(obs);
    if(!this.lightShaders[shaderName]){
      const fsLight = this.fsLightUpper + this.distFuncDescription + this.fsLightLower;
      this.lightShaders[shaderName] = this._lightEffect.createShader(this.vsLight, fsLight);
    }
    this.currentShader = this.lightShaders[shaderName];
    this._lightEffect.shader(this.currentShader);
    this.distFunction = createDistFunction(obs);
    this.floorPatternSeed = Math.random() * 9999;
  }
  initialize(level){
    this.setLevel(level);
    this._result.reset(); // リザルトをリセット
    this._player.restReset();
    this._player.lifeReset();
    this.shiftFlag = IS_ONPLAY;
    this.roomInitialize(0);
  }
  roomInitialize(nextRoomNumber = 0){
    this._fade.setFadeInFlag(true);
    this._properFrameCount = 0;
    // ここはちょっとややこしくなる
    // まず残基が0でないならlifeResetするだけ
    // 残基がゼロなら加えてRestも戻す
    // クリアフラグが立ってるなら何もしない。
    if(this.killedFlag){ this._player.lifeReset(); }
    //if(this._player.getRest() == 0){ this._player.restReset(); }

    this._player.imgReset(); // 画像はリセットする感じで
    // フラグリセット
    this.killedFlag = false;
    this.clearFlag = false;
    // パーティクルが残らないように
    this._particleArray.clear();
    // パターンをセット
    this.roomNumber = nextRoomNumber;
    this.roomSet[this.roomNumber]();
    // リザルトタイマー起動
    this._result.timerOn();
  }
  setLevel(level){
    this.level = level;
    const r = [10, 6, 3]; // 雑だなおい
    this._player.setMaxRest(r[level]);
  }
  getShiftFlag(){
    return this.shiftFlag; // これを受け取って状態遷移する。いくつメソッド増えるんだ・・（p5よりは少ないから大丈夫（何が？？））
  }
  getResult(){
    return this._result; // これをplaySceneに渡して経由してresultSceneさんに受け取ってもらう
  }
  registEyes(_eyes){
    // 目玉の情報を登録
    this.eyes.clear();
    this.eyes.addMulti(_eyes);
  }
  registObstacles(_obs){
    // 障害物の情報を登録
    this.obstacles.clear();
    this.obstacles.addMulti(_obs);
  }
  registCheckpoints(_checkpoints){
    // チェックポイントを登録
    this.checkpoints.clear();
    this.checkpoints.addMulti(_checkpoints);
  }
  setGoal(x, y){
    this.goalPosition.set(x, y, 0.0);
  }
  setStageSize(w, h){
    // resizeCanvas使うと動的にグラフィックの大きさを変えられる
    this.stageSize.set(w, h);
    this.baseGraphic.resizeCanvas(w, h);
    this._lightEffect.resizeCanvas(w, h);
  }
  getStageSize(){
    return this.stageSize;
  }
  calcOffset(){
    const sz = this.getStageSize();
    const q = getGlobalPosition(this._player.position);
    const offsetX = constrain(q.x - width * 0.5, 0.0, sz.x - width);
    const offsetY = constrain(q.y - height * 0.5, 0.0, sz.y - height);
    return {x:offsetX, y:offsetY}; // OK？
  }
  setUniform(){
    let sh = this.currentShader;
    sh.setUniform("u_resolution", [width, height]);
    sh.setUniform("u_stageSize", [this.stageSize.x, this.stageSize.y]); // ステージサイズ情報
    sh.setUniform("u_count", this._properFrameCount); // 使ってないけどね・・ベルコン実装するなら使うわね。まだ未実装。まあ、残しておこう。
    sh.setUniform("u_eyeCount", 2);

    // eye関連
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

    // obstacle関連
    let obsPosData = [];
    let obsRotData = [];
    for(let ob of this.obstacles){
      const pos2 = ob.getPosition();
      const rot2 = ob.getRotation(); // eyeの方もgetPositionすべきですかね・・移植するなら意識すべきかしらね。
      obsPosData.push(pos2.x, pos2.y);
      obsRotData.push(rot2);
    }
    sh.setUniform("u_obsPos", obsPosData);
    sh.setUniform("u_obsRot", obsRotData);

    sh.setUniform("u_default_Floor_Alpha", this.defaultFloorAlpha);
    sh.setUniform("u_seed", this.floorPatternSeed);

    // チェックポイント関連
    let checkPosData = [];
    for(let cp of this.checkpoints){
      checkPosData.push(cp.x, cp.y, cp.z);
    }
    sh.setUniform("u_checkPos", checkPosData);
    sh.setUniform("u_checkPosCapacity", this.checkpoints.length);
    sh.setUniform("u_goalPos", [this.goalPosition.x, this.goalPosition.y, this.goalPosition.z]);
  }
  update(){
    this.eyes.loop("update");
    this.obstacles.loop("update");
    const ratio = this._player.getLifeRatio(); // あらかじめこれを記録しておかないとめんどくさいことになるので
    // （クリアフラグが立っているときはプレイヤーを動かさないのもありかも）
    if(!this.clearFlag){ this._player.update(); }// というのもここで即死になった場合どんなライフで死んだのか分からないからね
    if(!this._player.isAlive() && !this.killedFlag){
      /*障害物にあたって死んだ場合はパーティクルをここで発生させる*/
      this.createKnockDownParticle(ratio); // 力技。ごめんなさい。もっといい方法があればいいんだけど。
    }
    for(let eye of this.eyes){ this.calcDamage(eye); }
    this._particleArray.loopReverse("update");
    this._particleArray.loopReverse("eject");
    this._properFrameCount++;
    this.clearCheck();
    this.gameOverCheck(); // fadeOut→initializeの流れ
    // 上記二つのメソッドを終えた後のタイミングでフラグを取得するのでここで変えてしまえば問題は生じないはず。
  }
  createKnockDownParticle(ratio){
    // 動く障害物にKOされた場合のパーティクル発生処理
    for(let x = 0; x < 320; x += 16){
      if(x / 320 > ratio){ break; }
      this.createParticle(x, 8, 6, 30, 4, 10);
    }
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
      // この判定を毎フレームすべてのチェックポイントに対して行い該当したら1にする、
      // そのあとすべて1かどうか調べてすべて1なら・・ってやる
      // フラグを用意してやればループは1回で済む（clearedはひとつでも0のままならfalse）
      let cleared = true;
      for(let cp of this.checkpoints){
        if(mag(pos.x - cp.x, pos.y - cp.y) < this.goalCheckThreshold * GRID){
          cp.z = 1.0;
        }
        if(cp.z === 0.0){ cleared = false; } // まだクリアしてない
      }
      // 全部1になったらゴールを出現させる
      if(cleared){
        this.goalPosition.z = 1.0;
        // ゴールに乗ったらクリア
        if(mag(pos.x - this.goalPosition.x, pos.y - this.goalPosition.y) < this.goalCheckThreshold * GRID){
          this.clearFlag = true;
          // ここでリザルト更新
          this._result.update(this._player); // プレイヤー情報を渡す
          this._fade.setFadeOutFlag(true);
        }
      }
    }else{
      if(!this._fade.getFadeOutFlag()){
        // 必要ならルームナンバーを増やす？1とかして。
        this.roomNumber++;
        if(this.roomNumber < MAX_ROOMID){
          this.roomInitialize(this.roomNumber);
        }else{
          this.shiftFlag = IS_ALLCLEAR; // このあとInitializeしなくてもそのままresultいっちゃうのでOKです。
          // リザルトの更新はクリアしたタイミングで行われるので問題ないです
        }
        //this.roomInitialize((this.roomNumber + 1) % ROOMNUMBER_MAX);
      }
    }
  }
  gameOverCheck(){
    // ゆくゆくはこっちでkillの処理をする感じね
    // calcDamageは文字通りダメージを計算してHPに反映させるだけ
    // それが0になったらこっちでアウトの判定（というかaliveを
    // falseにする処理をplayer側で行う感じね）
    // んでフェードアウトを開始してkilledFlagをON
    // なおフラグを立てるのはその間になんかメッセージ出したいから
    // そして↓
    // プレイヤー死んでてfadeOut終わってたら戻す。
    if(this._player.isAlive()){ return; }
    if(!this.killedFlag){
      this.kill();
      this.killedFlag = true;
    }else{
      if(!this._fade.getFadeOutFlag()){
        if(this._player.getRest() > 0){
          this.roomInitialize(this.roomNumber); // 残基がある場合は同じところにとどまる
        }else{
          // this.roomInitialize(0); // ゲームオーバーの場合は最初に戻る
          this.shiftFlag = IS_GAMEOVER; // ゲームオーバー、最初に戻らずリザルトへ。この場合最後にクリアした時のリザルトが使われる
        }
      }
    }
  }
  calcDamage(eye){
    // クリアフラグが立ってるならダメージを受けないように
    // しないといけない
    if(this.clearFlag || this.killedFlag){ return; }
    const pPos = this._player.position;
    const ePos = eye.position;
    const ray = p5.Vector.sub(pPos, ePos).normalize();
    const cur = createVector(ePos.x, ePos.y);
    let d;
    for(let rep = 0; rep < 32; rep++){
      d = this.getDistInfo(cur).dist;
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
    const q = getGlobalPosition(this._player.position);
    this.createParticle(q.x, q.y, 12, 60, 4, 40);
    //this.fadeOutCount = 1;
    // 残基を減らす
    this._player.changeRest(-1);
    this.createParticle(width * 0.55 + 8 + 16 * (this._player.getRest()), 8, 12, 60, 4, 40);
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
  // 渡されたgrに描画するように修正
  draw(gr){
    gr.clear();
    if(!(this.shiftFlag === IS_ONPLAY)){
      gr.background(0); // 力技
      return;
    }
    let base = this.baseGraphic;
    base.background(0);
    this.setUniform();
    this._lightEffect.quad(-1, -1, -1, 1, 1, 1, 1, -1);
    base.image(this._lightEffect, 0, 0);
    // lightEffectの一部をbaseGraphicに落とす。そのうえで、
    // offsetを考慮して目玉やプレイヤーを配置すればいい。

    // クリアした時に60フレーム掛けて消えるモーションやりたいのでちょっとね
    // クリアフラグが立っている場合に0～1の値を渡す感じで
    const prg = (this.clearFlag ? constrain(this._fade.getFadeOutProgress() * 2.0, 0.0, 1.0) : 0.0);
    this._player.draw(base, prg);

    this.eyes.loop("draw", [base])
    this._particleArray.loop("draw", [base]);

    this._fade.fadeIn(base);
    this._fade.fadeOut(base);

    // フェードインの間にルームナンバー出した方がよさそうならその処理
    // クリアフラグやゲームオーバーフラグが立ってるならなんか出す

    //image(gr, 0, 0);
    const offset = this.calcOffset();
    gr.image(base, 0, 0, width, height, offset.x, offset.y, width, height);

    this.drawInformation();

    gr.image(this.informationLayer, 0, 0);
  }
  drawInformation(){
    let gr = this.informationLayer;
    gr.clear();
    gr.fill(255);
    if(this._fade.getFadeInFlag()){
      gr.text("room" + this.roomNumber + ":caption this.", width * 0.5, height * 0.5);
    }
    if(this.killedFlag && this._player.getRest() == 0){
      gr.text("GAMEOVER...", width * 0.5, height * 0.5); // ゲームオーバーメッセージは残基ゼロの時だけ
    }
    if(this.clearFlag){
      gr.text("CLEAR!", width * 0.5, height * 0.5);
    }
    if(this._player.isAlive()){
      const ratio = this._player.getLifeRatio();
      gr.image(this.lifeGaugeImg, 2, 2, 316 * ratio, 12, 0, 0, 320 * ratio, 16);
    }
    for(let i = 0; i < this._player.getRest(); i++){
      gr.fill(0, 128, 255);
      gr.circle(width * 0.55 + 8 + 16 * i, 8, 16);
    }
  }
}

// ------------------------------------------------------------ //
// utility.

// particle system.
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

// fade処理。
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
  getFadeOutProgress(){
    return this.fadeOutCount / this.fadeOutLimit;
  }
  getFadeInProgress(){
    return this.fadeInCount / this.fadeInLimit;
  }
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

// 同じ計算しまくってるので・・ステージ内での位置情報をキャンバス内での位置情報に変換する関数
function getGlobalPosition(p){
  const sz = mySystem.getStageSize();
  return {x:(p.x * width + sz.x) * 0.5, y:(sz.y - p.y * height) * 0.5};
}

// ------------------------------------------------------------ //
// result.

// リザルトクラス（移植の際に結果表示するのに使う）
// ステージ開始時に時間計測開始でクリアしたらストップ
// んー？OKだよ。
// たとえば0と1クリアして2でゲームオーバーの場合、0と1をどうやってクリアしたかの情報で判定するわけ。だから、
// 1まで残基3でクリアした場合残基は3としてランクに登録されるよ。
// ゲームオーバー時に残基0なのは当たり前なんでね・・ようやくここまで来ましたね、、（疲れた）
class Result{
  constructor(){
    this.reset();
  }
  // updateの方が分かりやすいのでupdateにしました
  update(_player){
    this.cleared++; // クリアステージ数
    this.totalTime += (performance.now() - this.lastRecordTime); // トータルタイム
    this.lifeRatio = _player.getLifeRatio(); // ライフ割合
    this.rest = _player.getRest(); // 残基数
  }
  timerOn(){
    this.lastRecordTime = performance.now();
  }
  reset(){
    this.cleared = 0;
    this.totalTime = 0;
    this.lastRecordTime = 0;
    this.lifeRatio = 0;
    this.rest = 0;
  }
  draw(gr){
    gr.clear();
    gr.text("MAX CLEAR: " + this.cleared, CANVAS_W * 0.5, CANVAS_H * 0.3);
    gr.text("TOTAL TIME: " + (this.totalTime / 1000).toFixed(3), CANVAS_W * 0.5, CANVAS_H * 0.4);
    gr.text("LIFE RATIO:" + Math.floor(this.lifeRatio*100) + "%", CANVAS_W * 0.5, CANVAS_H * 0.5);
    gr.text("REST: " + this.rest, CANVAS_W * 0.5, CANVAS_H * 0.6);
    gr.text("PRESS ENTER", CANVAS_W * 0.5, CANVAS_H * 0.7);
  }
}

// ------------------------------------------------------------ //
// shader.

function getVertexShader(){
  let vsLight =
  "precision mediump float;" +
  "attribute vec3 aPosition;" +
  "void main(){" +
  "  gl_Position = vec4(aPosition, 1.0);" +
  "}";
  return vsLight;
}

function getFragmentShader(){
  let fsLightUpper =
  "precision mediump float;" +
  "uniform vec2 u_resolution;" +
  "uniform vec2 u_stageSize;" + // ステージサイズでした（ごめんね）
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
  "uniform vec2 u_obsPos[20];" + // 障害物の位置情報（最大20個）
  "uniform float u_obsRot[20];" + // 障害物の回転情報（最大20個）というわけで円にも必要ですね・・全部必要。
  "uniform vec3 u_checkPos[4];" + // チェックポイント（最大4つ）
  "uniform int u_checkPosCapacity;" + // チェックポイントの個数
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
  "const vec3 skyblue = vec3(0.1, 0.65, 0.9);" + // チェックポイント
  "const vec3 limegreen = vec3(0.19, 0.87, 0.19);" + // ライムグリーン
  // ランダム関連(seed追加)
  "const vec2 r_vector = vec2(12.9898, 78.233);" +
  "const float r_coeff = 43758.5453123;" +
  "float random(vec2 st, float seed){" +
  "  return fract(sin(dot(st.xy, r_vector)) * r_coeff + seed);" +
  "}" +
  // ベクトル取得関数
  "vec2 fromAngle(float t){ return vec2(cos(t), sin(t)); }" +
  // ベクトルの回転
  // 逆回転にすることで、ちゃんと反時計回りに回るようになる。ここややこしいのでそんなもんだと思っていいです。どうせ2通りしかないので。
  "void rotZ(out vec2 p, in float rot){" +
  "  p *= mat2(cos(rot), sin(rot), -sin(rot), cos(rot));" +
  "}" +
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
  // 円(中心c半径r) rot要らないけど一応ね。
  "float circle(vec2 p, vec2 c, float rot, float r){" +
  "  p -= c;" +
  "  rotZ(p, rot);" +
  "  return length(p) - r;" +
  "}" +
  // 長方形(中心c,横q.xで縦q.y) rotで回転させるわね
  "float rect(vec2 p, vec2 c, float rot, vec2 q){" +
  "  rotZ(p, rot);" +
  "  return max(abs(p.x - c.x) - q.x * 0.5, abs(p.y - c.y) - q.y * 0.5);" +
  "}" +
  // 正方形(中心c,横も縦もr) rotは平行移動してからですね。じゃないとあらぬ方向に飛んで行ってしまう。
  "float square(vec2 p, vec2 c, float rot, float r){" +
  "  p -= c;" +
  "  rotZ(p, rot);" +
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
  // 線分。cから単位ベクトルeと逆の方向に長さhで幅r. rot情報ぼちぼち放り込んでいくわね。
  // eは不要になった。で、(1,0)扱いです。
  "float segment(vec2 p, vec2 c, float rot, float r, float h){" +
  "  p -= c;" +
  "  rotZ(p, rot);" +
  "  return length(p - vec2(max(-h, min(0.0, p.x)), 0.0)) - r;" +
  "}" +
  // ハート(cが先端でeが上向き)
  // 落ち着くまで封印します（segmentの仕様を変更したので）
  /*
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
  */
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
  // 変更内容
  // チェックポイント（最大4つ）について然るべきcolにする。おわり！
  // ゴールも同じ処理・・ただし位置がシークレットなので出現するまではベースを黒にしない。
  "void setBackground(vec2 p, out vec4 col, vec4 bg){" +
  "  col = bg;" +
  "  for(int i = 0; i < 4; i++){" +
  "    if(i < u_checkPosCapacity){" +
  "      if(abs(p.x - u_checkPos[i].x) < 0.05 && abs(p.y - u_checkPos[i].y) < 0.05){" +
  "        col = vec4(vec3(0.0), u_default_Floor_Alpha);" +
  "      }" +
  "    }" +
  "  }" +
  "  if(u_goalPos.z == 1.0){" +
  "    if(abs(p.x - u_goalPos.x) < 0.1 && abs(p.y - u_goalPos.y) < 0.1){;" +
  "      col = vec4(vec3(0.0), u_default_Floor_Alpha);" +
  "    }" +
  "  }" +
  "}" +
  // 変更内容
  // チェックポイントについては踏まれているならskyblueのglowで0.025
  // ゴールについても出現しているならlimegreenのglowで0.05ですね。OK. つまりゴールは出現するまで見えないわけです。
  "void drawCheckPointsAndGoal(vec2 p, out vec4 col){" +
  "  for(int i = 0; i < 4; i++){" +
  "    if(i < u_checkPosCapacity){" +
  "      if(u_checkPos[i].z == 1.0){" +
  "        float dc = max(abs(p.x - u_checkPos[i].x), abs(p.y - u_checkPos[i].y)) - 0.025;" +
  "        float diffc = exp(-dc*32.0);" +
  "        col += vec4(vec3(diffc) * skyblue, diffc);" +
  "      }" +
  "    }" +
  "  }" +
  "  if(u_goalPos.z == 1.0){" +
  "    float dg = max(abs(p.x - u_goalPos.x), abs(p.y - u_goalPos.y)) - 0.05;" +
  "    float diffg = exp(-dg*32.0);" +
  "    col += vec4(vec3(diffg) * limegreen, diffg);" +
  "  }" +
  "}" +
  // メインコード
  "void main(){" +
  "  vec2 p = (gl_FragCoord.xy * 2.0 - u_stageSize.xy) / min(u_resolution.x, u_resolution.y);" +
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
  "  drawCheckPointsAndGoal(p, col);" +
  "  gl_FragColor = col;" +
  "}";
  return {upper:fsLightUpper, dist:distFuncDescription, lower:fsLightLower};
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

  // ステージのサイズを決定
  mySystem.setStageSize(640, 640);

  // チェックポイントとゴール関連
  let cps = [];
  cps.push(createVector(-17 * GRID, 2 * GRID, 0.0));
  cps.push(createVector(17 * GRID, 2 * GRID, 0.0));
  mySystem.registCheckpoints(cps);
  mySystem.setGoal(-17 * GRID, 17 * GRID);
  mySystem.goalCheckThreshold = 1.0;

  // Eyes.
  createEyePattern0();

  // Player.
  mySystem._player.initialize(0.4, 0.8);

  // Obstacles.
  // rectはa,b,c,dに対して(a+c)/2と(b+d)/2がx,yでrotはとりあえず0で横幅縦幅は|a-c|と|b-d|ですね
  let obs = [];
  obs.push(new CircleObstacle(0, -6, 12, 0, 4)); // 0追加
  obs.push(new RectObstacle(1, 8, -8, 0, 6, 4)); // 修正
  obs.push(new SquareObstacle(2, 8, 10, 0, 7)); // 0追加
  obs.push(new SegmentObstacle(3, -14, 0, Math.PI/2, 2, 6)); // 反時計回りに90°回転させる感じね
  obs.push(new SquareObstacle(4, -2, -8, 0, 8)); // 0はrot.

  createWall(obs.length, obs); // 壁を作る
  mySystem.registObstacles(obs);

  // 処理は簡潔に。
  mySystem.shaderReset(obs, "shader0");
}

function createEyePattern0(){
  let eyes = [];
  eyes.push(new EnemyEye(0.0, 0.0, TAU / 295, 0.85, 0.05));
  eyes[0].setMoveFunc((eye) => {
    eye.position.set(0.5 * Math.sin(TAU * eye.count / 360), 0.0);
  });
  eyes.push(new EnemyEye(0.0, 0.0, TAU / 180, 0.99, 0.35));
  eyes[1].setMoveFunc((eye) => {
    eye.position.set(-0.5, -0.3+0.3*Math.sin(TAU * eye.count / 360));
  });
  mySystem.registEyes(eyes);
}

// そのうち追加しやすくする・・tweenほしいわね
// 光の出る感じのあれこれとか操作しやすくしたいので(ぐるぐるだけじゃね)
function room1(){

  // ステージのサイズを決定
  mySystem.setStageSize(640, 640);

  // チェックポイントとゴール関連
  let cps = [];
  cps.push(createVector(17 * GRID, -17 * GRID, 0.0));
  cps.push(createVector(-17 * GRID, -17 * GRID, 0.0));
  mySystem.registCheckpoints(cps);
  mySystem.setGoal(0 * GRID, -8 * GRID);
  mySystem.goalCheckThreshold = 1.0;

  // Eyes.
  createEyePattern1();

  // Player.
  mySystem._player.initialize(-0.4, 0.8);

  // Obstacles.
  let obs = [];
  obs.push(new RectObstacle(0, -10, 10, 0, 2, 6));
  obs.push(new RectObstacle(1, -10, -10, 0, 2, 6));
  obs.push(new RectObstacle(2, 10, 10, 0, 2, 6));
  obs.push(new RectObstacle(3, 10, -10, 0, 2, 6));
  obs.push(new SquareObstacle(4, 0, 0, Math.PI/4, 4)); // 0追加

  createWall(obs.length, obs); // 壁を作る
  mySystem.registObstacles(obs);

  // 処理は簡潔に。
  mySystem.shaderReset(obs, "shader1");
}

function createEyePattern1(){
  let eyes = [];
  eyes.push(new EnemyEye(0.0, 0.0, TAU / 200, 0.6, 0.55));
  eyes[0].setMoveFunc((eye) => {
    eye.position.set(-0.7, -0.5 * Math.sin(TAU * eye.count / 360));
  });
  eyes.push(new EnemyEye(0.0, 0.0, TAU / 200, 0.6, 0.65));
  eyes[1].setMoveFunc((eye) => {
    eye.position.set(0.7, 0.5 * Math.sin(TAU * eye.count / 360));
  });
  mySystem.registEyes(eyes);
}

// じゃあひとつ増やしてみるか・・

function room2(){

  // ステージのサイズを決定
  mySystem.setStageSize(1280, 640);

  // チェックポイントとゴール関連
  let cps = [];
  cps.push(createVector(17 * GRID, -17 * GRID, 0.0));
  cps.push(createVector(-17 * GRID, -17 * GRID, 0.0));
  mySystem.registCheckpoints(cps);
  mySystem.setGoal(0 * GRID, -8 * GRID);
  mySystem.goalCheckThreshold = 1.0;

  // Eyes.
  createEyePattern2();

  // Player.
  mySystem._player.initialize(-0.4, 0.8);

  // Obstacles.
  let obs = [];
  obs.push(new RectObstacle(0, -10, 10, 0, 2, 6));
  obs.push(new RectObstacle(1, -10, -10, 0, 2, 6));
  obs.push(new RectObstacle(2, 10, 10, 0, 2, 6));
  obs.push(new RectObstacle(3, 10, -10, 0, 2, 6));
  obs.push(new RectObstacle(4, -22, 10, 0, 2, 6));
  obs.push(new RectObstacle(5, -22, -10, 0, 2, 6));
  obs.push(new RectObstacle(6, 22, 10, 0, 2, 6));
  obs.push(new RectObstacle(7, 22, -10, 0, 2, 6));

  obs[4].activate(); // ちょっと動かしましょうね
  obs[4].setMoveFunc((ob) => { const t = ob.count * TAU / 60; ob.setPosition((-20-2*cos(t))*GRID, 10*GRID); });

  obs.push(new SquareObstacle(8, 0, 0, Math.PI/4, 4)); // 0追加

  createWall(obs.length, obs); // 壁を作る
  mySystem.registObstacles(obs);

  // 処理は簡潔に。
  mySystem.shaderReset(obs, "shader2");
}

function createEyePattern2(){
  let eyes = [];
  eyes.push(new EnemyEye(0.0, 0.0, TAU / 200, 0.6, 0.55));
  eyes[0].setMoveFunc((eye) => {
    eye.position.set(-0.7, -0.5 * Math.sin(TAU * eye.count / 360));
  });
  eyes.push(new EnemyEye(0.0, 0.0, TAU / 200, 0.6, 0.65));
  eyes[1].setMoveFunc((eye) => {
    eye.position.set(0.7, 0.5 * Math.sin(TAU * eye.count / 360));
  });
  mySystem.registEyes(eyes);
}

// 外周を作るのは処理を再利用しましょうね
function createWall(startIndex, obs){
  const sz = mySystem.getStageSize();
  const x1 = sz.x/32|0;
  const y1 = sz.y/32|0;
  obs.push(new RectObstacle(startIndex, 0, y1-0.5, 0, x1*2, 1));
  obs.push(new RectObstacle(startIndex+1, -x1+0.5, 0, 0, 1, y1*2));
  obs.push(new RectObstacle(startIndex+2, x1-0.5, 0, 0, 1, y1*2));
  obs.push(new RectObstacle(startIndex+3, 0, -y1+0.5, 0, x1*2, 1));
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
    let closest = undefined;
    for(let ob of obs){
      const d1 = ob.getDist(p);
      if(d1 < d){
        d = d1;
        closest = ob; // 一番近いやつ
      }
    }
    return {dist:d, closest:closest}; // distは距離でobはオブジェクト！
  }
}
