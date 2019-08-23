import { randomRGB, deepCopy } from './utils';

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

  /** 生成随机实例 */
  public static ofRandom = (param: RandomStarGeneratorParam) => {
    const height = window.innerHeight;
    const width = window.innerWidth;
    // 确保范围数据是从小到大排列
    const sizeRange = param.sizeRange.sort();
    const speedRange = param.speedRange.sort();
    const size = Math.ceil(
      Math.random() * (sizeRange[1] - sizeRange[0]) + sizeRange[0]
    );
    const color = randomRGB();
    const position = {
      x: Math.ceil(Math.random() * width),
      y: Math.ceil(Math.random() * height)
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
    zoom: ZoomFunctions
  ) => {
    // 绘制圆形&标签
    this.drawArc(showID, ctx, zoom);
    // 绘制轨迹
    this.drawTravel(tarvelLength, ctx, zoom);
  };

  /** 绘制圆形
   * @param showID 是否显示id
   */

  drawArc = (
    showID: boolean,
    ctx: CanvasRenderingContext2D,
    zoom: ZoomFunctions
  ) => {
    ctx.beginPath();
    ctx.arc(
      zoom.zoomedX(this.position.x),
      zoom.zoomedY(this.position.y),
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
        zoom.zoomedX(this.position.x + 10),
        zoom.zoomedY(this.position.y)
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
    zoom: ZoomFunctions
  ) => {
    // 剪切尾迹
    this.travel = this.travel.slice(-travelLength);
    // 开始绘制
    ctx.beginPath();
    this.travel.forEach((value, index) => {
      if (index === 0) ctx.moveTo(zoom.zoomedX(value.x), zoom.zoomedY(value.y));
      else {
        ctx.lineTo(zoom.zoomedX(value.x), zoom.zoomedY(value.y));
      }
    });
    ctx.lineWidth = zoom.zoomed(1);
    ctx.strokeStyle = this.color;
    ctx.stroke();
  };
}

export { Star2D };
