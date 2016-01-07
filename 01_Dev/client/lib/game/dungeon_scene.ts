declare var GLBoost:any;

module WrtGame {
  eval('WrtGame = _.isUndefined(window.WrtGame) ? WrtGame : window.WrtGame;'); // 内部モジュールを複数ファイルで共有するためのハック


  export class DungeonScene extends Scene {
    private _mapMovement:WrtGame.MapMovement = null;
    private _map:any = null;
    private _camera:any = null;
    private _scene:any = null;
    private _renderer:any = null;
    constructor(data:any, mapMovement:WrtGame.MapMovement) {
      super();
      this._mapMovement = mapMovement;
      this.initGLBoost(data);
    }

    private initGLBoost(data:any) {
      var canvasId = '#renderCanvas';
      var canvas:HTMLCanvasElement = <HTMLCanvasElement>document.querySelector(canvasId);

      var renderer:any = new GLBoost.Renderer({ canvas: canvas, clearColor: {red:0.5, green:0.5, blue:0.5, alpha:1}});

      var scene = new GLBoost.Scene();

      var aspect = canvas.width / canvas.height;
      var camera = new GLBoost.Camera(
        {
          eye: new GLBoost.Vector3(0, 0, 0),
          center: new GLBoost.Vector3(0.0, 0.0, 1.0),
          up: new GLBoost.Vector3(0.0, 1.0, 0.0)
        },
        {
          fovy: 50.0,
          aspect: aspect,
          zNear: 0.1,
          zFar: 300.0
        }
      );
      scene.add( camera );

      var directionalLight_1 = new GLBoost.DirectionalLight(new GLBoost.Vector3(1, 1, 1), new GLBoost.Vector3(-1, -1, 0), canvasId);
      var directionalLight_2 = new GLBoost.DirectionalLight(new GLBoost.Vector3(1, 1, 1), new GLBoost.Vector3(1, 1, 0), canvasId);
      var directionalLight_3 = new GLBoost.DirectionalLight(new GLBoost.Vector3(1, 1, 1), new GLBoost.Vector3(0, 1, 1), canvasId);
      var directionalLight_4 = new GLBoost.DirectionalLight(new GLBoost.Vector3(0.5, 0.5, 0.5), new GLBoost.Vector3(0, 0, -1), canvasId);
      scene.add( directionalLight_1 );
      scene.add( directionalLight_2 );
      scene.add( directionalLight_3 );
      scene.add( directionalLight_4 );

      this._map = new WrtGame.PolygonMapGLBoost(scene, data.map, data.mapTextures, canvasId);

      // Windowのリサイズ対応
      window.addEventListener("resize", function(e) {
        var windowAspect = $(e.target).width() / $(e.target).height();

        if (windowAspect > aspect) {
          let width = $(e.target).height() * aspect;
          let height = $(e.target).height();
          $(canvas).css('width', width);
          $(canvas).css('height', height);
          renderer.resize(width, height);
        } else {
          let width = $(e.target).width();
          let height = $(e.target).width() * 1/aspect;
          $(canvas).css('width', width) ;
          $(canvas).css('height',height);
          renderer.resize(width, height);
        }
      });

      this._scene = scene;
      this._camera = camera;
      this._renderer = renderer;
    }

    sceneLoop() {
      var mapMovement = this._mapMovement;
      // 平行移動する
      var moveDelta = 1.0/60*3;
      mapMovement.move(this._map, moveDelta);

      // 水平方向の向きを変える
      mapMovement.rotate(60*0.8);

      // 垂直方向の向きを変える
      mapMovement.faceUpOrLow(1/60*0.5);

      this._map.movePlatforms();

      // カメラの位置・回転をセット
      var cameraPos = this.convertGLBoostPlayerPosition(mapMovement.playerX, mapMovement.playerH, mapMovement.playerY, mapMovement.playerAngle, mapMovement.playerElevationAngle);
      this._camera.eye = cameraPos.viewPos;
      this._camera.center = cameraPos.centerPos;

      this._renderer.clearCanvas();
      this._renderer.draw(this._scene);

    }

    /**
     * MapMovementクラスが返すプレーヤー座標を、GLBoostでの表示仕様を満たす座標に変換する
     * @param x
     * @param h
     * @param y
     * @returns {BABYLON.Vector3}
     */
    private convertGLBoostPlayerPosition(x:number, h:number, y:number, angle:number, playerElevationAngle:number):any {

      // プレーヤーが0.5後ろに下がって、背中が後ろのマスの壁にひっつくようにするためのオフセット座標
      var rotateMtx = GLBoost.Matrix44.rotateY(-angle);
      var rotateElevationMtx = GLBoost.Matrix44.rotateX(playerElevationAngle);
      var viewPosOffset = new GLBoost.Vector4(0, 0, 0.5, 1);
      var centerPosOffset = new GLBoost.Vector4(0, 0, -0.5, 1);

      // そのオフセット座標を、プレーヤーの向きに合わせて回転する
      viewPosOffset = rotateMtx.multiplyVector(viewPosOffset);
      centerPosOffset = rotateElevationMtx.multiplyVector(centerPosOffset);
      centerPosOffset = rotateMtx.multiplyVector(centerPosOffset);

      // プレーヤーのBabylonJSにおける位置座標
      var viewPos = new GLBoost.Vector3(x - 0.5, h + 0.5, y - 0.5);
      //var viewPos = new GLBoost.Vector3(x, h + 1, y);

      // オフセットを考慮するために足す
      return {
        viewPos: GLBoost.Vector3.add(viewPos, new GLBoost.Vector3(viewPosOffset.x, viewPosOffset.y, viewPosOffset.z)),
        centerPos: GLBoost.Vector3.add(viewPos, new GLBoost.Vector3(centerPosOffset.x, centerPosOffset.y, centerPosOffset.z))
      };
    }

  }
}
