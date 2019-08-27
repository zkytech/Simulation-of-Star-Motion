import {
  randomColor,
  deepCopy,
  makeTextSprite,
  calcDistanceOnVec2
} from './utils';
import * as THREE from 'three';
class Star {
  constructor(params: {
    id: string;
    color: string;
    size: number;
    position: Vector2 | Vector3;
    speed: Vector2 | Vector3;
  }) {
    this.id = params.id;
    this.color = params.color;
    this.position = params.position;
    this.speed = params.speed;
    this.size = params.size;
    this.mass = Math.pow(params.size, 3);
  }
  id: string;
  /** 颜色 */
  color: string;
  /** 尾迹 */
  travel: Vector2[] | Vector3[] = [];
  /** 位置 */
  position: Vector2 | Vector3;
  /** 速度 */
  speed: Vector2 | Vector3;
  /** 大小 */
  size: number;
  /** 质量 */
  mass: number = Math.pow(this.size, 3);
  /** 大小 */
  set setSize(size: number) {
    this.size = size;
    // size改变时同步更新质量
    this.mass = Math.pow(this.size, 3);
  }
}
class Star2D extends Star {
  constructor(params: StarInfo2D) {
    super(params);
  }
  clone = () => {
    return new Star2D({
      id: this.id,
      speed: deepCopy(this.speed),
      position: deepCopy(this.position),
      color: this.color,
      size: this.size
    });
  };
  /** 生成随机实例 */
  public static ofRandom = (param: RandomStarGeneratorParam) => {
    const height = 800;
    const width = 800;
    // 确保范围数据是从小到大排列
    const sizeRange = param.sizeRange.sort();
    const speedRange = param.speedRange.sort();
    const size = Math.random() * (sizeRange[1] - sizeRange[0]) + sizeRange[0];
    const color = randomColor();
    const position = {
      x:
        Math.random() * width * (Math.random() > 0.5 ? 1 : -1) +
        window.innerWidth / 2,
      y:
        Math.random() * height * (Math.random() > 0.5 ? 1 : -1) +
        window.innerHeight / 2
    };
    const speed = {
      x:
        Math.random() *
        (speedRange[1] - speedRange[0] + speedRange[0]) *
        (Math.random() > 0.5 ? 1 : -1),
      y:
        Math.random() *
        (speedRange[1] - speedRange[0] + speedRange[0]) *
        (Math.random() > 0.5 ? 1 : -1)
    };
    return new Star2D({
      id: param.id,
      size,
      color,
      position,
      speed
    });
  };
  get sandboxData(): SandboxData {
    return {
      position: deepCopy(this.position),
      speed: deepCopy(this.speed),
      color: this.color,
      size: this.size
    };
  }
  private lastDirection = 0;

  /** 获取速度的角度 */
  get direction() {
    const direction = (Math.atan2(this.speed.y, this.speed.x) * 180) / Math.PI;
    if (!(this.speed.x === 0 && this.speed.y === 0)) {
      this.lastDirection = direction;
    }
    if (this.speed.x === 0 && this.speed.y === 0) {
      // 如果向量为0，就返回最后一个非0速度向量的direction
      return this.lastDirection;
    }
    return direction;
  }
  /** 设置速度的角度 */
  set direction(direction: number) {
    const speed = calcDistanceOnVec2(this.speed, { x: 0, y: 0 });
    this.lastDirection = direction;

    direction = (direction / 180) * Math.PI;

    this.speed.x = speed * Math.cos(direction);
    this.speed.y = speed * Math.sin(direction);
  }

  get speedSize() {
    return calcDistanceOnVec2(this.speed, { x: 0, y: 0 });
  }

  set speedSize(speed: number) {
    const currentSpeed = calcDistanceOnVec2(this.speed, { x: 0, y: 0 });

    if (currentSpeed === 0) {
      // 当向量为0时，没有方向，这里使用this.lastDirection作为方向
      const direction = (this.lastDirection / 180) * Math.PI;
      this.speed.x = speed * Math.cos(direction);
      this.speed.y = speed * Math.sin(direction);
    } else {
      const times = speed / currentSpeed;
      this.speed.x *= times;
      this.speed.y *= times;
    }
  }

  travel = [] as Vector2[];
  /**
   * 移动到下一个位置
   * @param step 移动步长
   */
  moveToNext = (step: number, forceDict: ForceDict2D) => {
    const force = forceDict[this.id];
    // 加速度
    const a = { x: force.x / this.mass, y: force.y / this.mass };
    // 移动位置（按照匀变速运动计算） 位移x = v_0*t + 0.5*a*t^2
    // 这种方式比按照匀速运动更为合理，误差更小
    // this.position.x += this.speed.x * step + 0.5 * Math.pow(step, 2) * a.x;
    // this.position.y += this.speed.y * step + 0.5 * Math.pow(step, 2) * a.y;

    // 将加速度的影响叠加到速度上
    this.speed.x += a.x * step;
    this.speed.y += a.y * step;
    // 这种计算位移的方式虽然粗糙，但娱乐性很强。
    this.position.x += this.speed.x * step;
    this.position.y += this.speed.y * step;
    // 将坐标放入travel
    this.travel.push(deepCopy(this.position));
  };

  /** 圆角度 */
  angle = Math.PI * 2; //为了避免重复计算，把这个作为一个常数属性

  /** 绘制星体 */
  draw = (
    showID: boolean,
    tarvelLength: number,
    ctx: CanvasRenderingContext2D,
    zoom: ZoomFunctions,
    focousOn: Star2D | null
  ) => {
    // 绘制圆形&标签
    this.drawArc(showID, ctx, zoom, focousOn);
    // 绘制轨迹
    this.drawTravel(tarvelLength, ctx, zoom, false, focousOn);
  };

  /** 绘制圆形
   * @param showID 是否显示id
   */

  drawArc = (
    showID: boolean,
    ctx: CanvasRenderingContext2D,
    zoom: ZoomFunctions,
    focousOn: Star2D | null
  ) => {
    const focousOnX = focousOn ? (focousOn as Star2D).position.x : 0;
    const focousOnY = focousOn ? (focousOn as Star2D).position.y : 0;
    ctx.beginPath();
    ctx.arc(
      zoom.zoomedX(this.position.x - focousOnX),
      zoom.zoomedY(this.position.y - focousOnY),
      zoom.zoomed(this.size),
      0,
      this.angle
    );
    ctx.fillStyle = this.color;
    ctx.fill();
    // 绘制id标签
    if (showID) {
      ctx.beginPath();
      ctx.fillStyle = 'white';
      ctx.fillText(
        this.id,
        zoom.zoomedX(this.position.x + 10 - focousOnX),
        zoom.zoomedY(this.position.y - focousOnY)
      );
    }
  };

  /**
   * 绘制尾迹
   * @param travelLength 尾迹长度
   */
  drawTravel = (
    travelLength: number,
    ctx: CanvasRenderingContext2D,
    zoom: ZoomFunctions,
    predict: boolean = false,
    focousOn: Star2D | null = null
  ) => {
    if (travelLength === 0) {
      this.travel = [];
    }
    // 剪切尾迹
    this.travel = this.travel.slice(-travelLength);
    // 开始绘制
    ctx.beginPath();
    this.travel.forEach((value, index) => {
      const focousOnX = focousOn ? (focousOn as Star2D).travel[index].x : 0;
      const focousOnY = focousOn ? (focousOn as Star2D).travel[index].y : 0;
      if (index === 0)
        ctx.moveTo(
          zoom.zoomedX(value.x - focousOnX),
          zoom.zoomedY(value.y - focousOnY)
        );
      else {
        ctx.lineTo(
          zoom.zoomedX(value.x - focousOnX),
          zoom.zoomedY(value.y - focousOnY)
        );
      }
    });
    if (predict) {
      ctx.setLineDash([10]);
    }
    ctx.lineWidth = zoom.zoomed(1);
    ctx.strokeStyle = this.color;
    ctx.stroke();
  };
}

class Star3D extends Star {
  constructor(params: StarInfo3D) {
    super(params);
    this.speed = params.speed;
    this.position = params.position;
  }
  scene: THREE.Scene = {} as THREE.Scene;
  travel = [] as Vector3[];
  speed = {} as Vector3;
  position = {} as Vector3;
  sphere: THREE.Mesh = {} as THREE.Mesh;
  textSprite: THREE.Sprite = {} as THREE.Sprite;
  lines: THREE.Line[] = [];
  /**生成随机的3D星体*/
  public static ofRandom = (param: RandomStarGeneratorParam) => {
    const length = 800;
    const height = 800;
    const width = 800;
    // 确保范围数据是从小到大排列
    const sizeRange = param.sizeRange.sort();
    const speedRange = param.speedRange.sort();
    const size = Math.random() * (sizeRange[1] - sizeRange[0]) + sizeRange[0];
    const color = randomColor();
    const position = {
      x: ((Math.random() * length) / 2) * (Math.random() > 0.5 ? 1 : -1),
      y: ((Math.random() * height) / 2) * (Math.random() > 0.5 ? 1 : -1),
      z: ((Math.random() * width) / 2) * (Math.random() > 0.5 ? 1 : -1)
    };
    const speed = {
      x:
        Math.random() *
        (speedRange[1] - speedRange[0] + speedRange[0]) *
        (Math.random() > 0.5 ? 1 : -1),
      y:
        Math.random() *
        (speedRange[1] - speedRange[0] + speedRange[0]) *
        (Math.random() > 0.5 ? 1 : -1),
      z:
        Math.random() *
        (speedRange[1] - speedRange[0] + speedRange[0]) *
        (Math.random() > 0.5 ? 1 : -1)
    };
    return new Star3D({
      id: param.id,
      size,
      color,
      position,
      speed
    });
  };
  /**
   * 移动到下一个位置
   * @param step 移动步长
   * @param travelLength 尾迹长度
   */
  moveToNext = (step: number, forceDict: ForceDict3D, travelLength: number) => {
    // 受力
    const force = forceDict[this.id];
    // 加速度
    const a = {
      x: force.x / this.mass,
      y: force.y / this.mass,
      z: force.z / this.mass
    };
    // 移动位置（按照匀变速运动计算） 位移x = v_0*t + 0.5*a*t^2
    // 这种方式比按照匀速运动更为合理，误差更小
    // this.position.x += this.speed.x * step + 0.5 * Math.pow(step, 2) * a.x;
    // this.position.y += this.speed.y * step + 0.5 * Math.pow(step, 2) * a.y;
    // this.position.z += this.speed.z * step + 0.5 * Math.pow(step, 2) * a.z;

    // 将加速度的影响叠加到速度上
    this.speed.x += a.x * step;
    this.speed.y += a.y * step;
    this.speed.z += a.z * step;
    // 这种计算位移的方式虽然粗糙，但娱乐性很强
    this.position.x += this.speed.x * step;
    this.position.y += this.speed.y * step;
    this.position.z += this.speed.z * step;
    // 将坐标放入travel
    this.travel.push(deepCopy(this.position));
    // 移动场景中的物体
    this.sphere.position.x = this.position.x;
    this.sphere.position.y = this.position.y;
    this.sphere.position.z = this.position.z;
    this.moveLines(travelLength);
    this.moveTextSprite();
  };

  /** 绘制球体 */
  private createSphere = (sandboxMode: boolean, disableCenter: boolean) => {
    const sphereMaterial =
      sandboxMode || disableCenter // 沙盒模式和无中心天体的情况下没有光源，需要改变材质
        ? new THREE.MeshBasicMaterial({
            color: this.color
          })
        : new THREE.MeshLambertMaterial({
            color: this.color
          });
    const sphere = new THREE.Mesh(
      new THREE.SphereBufferGeometry(this.size, 50, 50),
      sphereMaterial
    );
    sphere.position.x = this.position.x;
    sphere.position.y = this.position.y;
    sphere.position.z = this.position.z;
    this.sphere = sphere;
    this.scene.add(this.sphere);
  };

  // 创建线条
  private createLine = (point1?: Vector3, point2?: Vector3) => {
    const lineMaterial = new THREE.LineBasicMaterial({
      color: this.color
    });
    const geometry = new THREE.Geometry();
    if (!point1 || !point2) {
      // 没有指定point就作为初始化数据处理
      geometry.vertices.push(
        new THREE.Vector3(this.position.x, this.position.y, this.position.z)
      );
      geometry.vertices.push(
        new THREE.Vector3(
          this.position.x + this.speed.x,
          this.position.y + this.speed.y,
          this.position.z + this.speed.z
        )
      );
    } else {
      geometry.vertices.push(new THREE.Vector3(point1.x, point1.y, point1.z));
      geometry.vertices.push(new THREE.Vector3(point2.x, point2.y, point2.z));
    }
    const line = new THREE.Line(geometry, lineMaterial);
    line.frustumCulled = false; // 这条设置是为了防止线条被相机错误隐藏
    this.scene.add(line);
    this.lines.push(line);
  };

  /** 创建文字标签 */
  createSprite = () => {
    const textSprite = makeTextSprite(this.id, { fontsize: 30 });
    textSprite.position.x = this.position.x + 10;
    textSprite.position.y = this.position.y;
    textSprite.position.z = this.position.z;
    this.scene.add(textSprite);
    this.textSprite = textSprite;
  };

  /** 初始化场景中的天体 */
  create = (sandboxMode: boolean, disableCenter: boolean, showID: boolean) => {
    this.createSphere(sandboxMode, disableCenter);
    this.createLine();
    if (showID) this.createSprite();
  };

  moveTextSprite = () => {
    if (!this.textSprite.position) return; // 如果场景中没有textSprite，直接返回
    this.textSprite.position.x = this.position.x + 10;
    this.textSprite.position.y = this.position.y;
    this.textSprite.position.z = this.position.z;
  };

  /** 移动线条 */
  moveLines = (travelLength: number) => {
    // 保证travel数组的长度没有超过规定值

    this.travel = this.travel.slice(-travelLength);
    const travel = this.travel;
    const lines = this.lines;
    // 更新线条位置
    lines.forEach((value, index) => {
      if (travel[index + 1]) {
        //@ts-ignore
        value.geometry.vertices[0] = travel[index];
        //@ts-ignore
        value.geometry.vertices[1] = travel[index + 1];
        //@ts-ignore
        value.geometry.verticesNeedUpdate = true;
      }
    });

    // 线条长度还未达到上限
    if (lines.length < travel.length - 1) {
      // 添加线条
      for (let i = lines.length; i < travel.length; i++) {
        if (travel[i + 1]) {
          this.createLine(travel[i], travel[i + 1]);
        }
      }
    }
  };

  /** 改变travelLength */
  changeTravelLength = (newTravelLength: number, oldTravelLength: number) => {
    if (newTravelLength > oldTravelLength) return; // 如果新的长度大于原来的，什么都不用做
    this.travel = this.travel.slice(-newTravelLength);
    // 要删除的线条列表
    const deletedLines = this.lines.slice(0, oldTravelLength - newTravelLength);
    this.lines = this.lines.slice(-newTravelLength);
    // 将多余的线条从场景中删除
    deletedLines.forEach(line => this.scene.remove(line));
  };

  /** 移除文字标签 */
  removeTextSpire = () => {
    this.scene.remove(this.textSprite);
    this.textSprite = {} as THREE.Sprite;
  };
  /** 移除球体 */
  private removeSphere = () => {
    this.scene.remove(this.sphere);
  };
  /** 移除所有线条 */
  private removeLines = () => {
    this.lines.forEach(line => this.scene.remove(line));
    this.travel = [];
    this.lines = [];
  };

  /** 移除整个星体 */
  remove = () => {
    this.removeSphere();
    this.removeLines();
    this.removeTextSpire();
  };
}

export { Star2D, Star3D };
