import * as React from 'react';

/**
 * 生成随机RGB颜色
 */
const randomRGB = () => {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  const rgb = 'RGB(' + r + ',' + g + ',' + b + ')';
  return rgb;
};

type StarInfo = {
  id: string;
  /** 坐标 */
  x: number;
  y: number;
  /** 颜色 */
  color: string;
  /** 大小 */
  size: number;
  /** 速度 */
  speed: { x: number; y: number };
  /** 轨迹 */
  travel: { x: number; y: number }[];
};

type IState = {
  stars: StarInfo[];
  g: { [key: string]: { x: number; y: number } };
  scale: number;
  centerPointOffset: { x: number; y: number };
  centerPoint: { x: number; y: number };
  initCenterPoint: { x: number; y: number };
  moving: boolean;
  mousePosition: { x: number; y: number };
};

type IProps = {
  /** 轨迹长度 */
  travelLength: number;
  /** 初始星体数量 */
  initialNum: number;
  /** 恒星的体积 */
  centerSize: number;
  ref?: (ref: Index) => any;
  /** 引力G值 */
  g: number;
  /** 是否显示ID */
  showID: boolean;
  /** 星体最大大小 */
  maxSize: number;
  /** 星体最小大小 */
  minSize: number;
  /** 吞噬模式 */
  mergeMode: boolean;
  /** 播放速度 */
  playSpeed: number;
};

export default class Index extends React.Component<IProps, IState> {
  readonly state: IState = {
    stars: [],
    g: {},
    scale: 1,
    centerPointOffset: { x: 0, y: 0 },
    centerPoint: { x: 0, y: 0 },
    initCenterPoint: { x: 0, y: 0 },
    moving: false,
    mousePosition: { x: 0, y: 0 }
  };

  public static defaultProps: Partial<IProps> = {
    travelLength: 300,
    initialNum: 200,
    centerSize: 10,
    g: 100,
    showID: true,
    maxSize: 5,
    minSize: 2,
    mergeMode: false,
    playSpeed: 1
  };

  canvas: HTMLCanvasElement | null = null;
  ctx2d: CanvasRenderingContext2D | null = null;

  initStars = (total: number) => {
    const width = (this.canvas as HTMLCanvasElement).width;
    const height = (this.canvas as HTMLCanvasElement).height;
    let stars: StarInfo[] = [];
    // 先加入恒星
    stars.push({
      id: '#0',
      x: width / 2,
      y: height / 2,
      size: this.props.centerSize,
      color: 'red',
      speed: { x: 0, y: 0 },
      travel: []
    });
    for (let i = 1; i <= total; i++) {
      const x = Math.ceil(Math.random() * width);
      const y = Math.ceil(Math.random() * height);
      const size = Math.ceil(
        Math.random() * (this.props.maxSize - this.props.minSize) +
          this.props.minSize
      );
      const color = randomRGB();
      const speed = {
        x: Math.random() * 0.5 - 0.25,
        y: Math.random() * 0.5 - 0.25
      };
      const travel = [{ x, y }];
      stars.push({ id: `#${i}`, x, y, size, color, speed, travel });
    }

    return stars;
  };

  start = () => {
    try {
      clearInterval(this.mainProcess);
    } catch {}
    this.setState({ stars: this.initStars(this.props.initialNum), g: {} });
    const canvas = this.canvas as HTMLCanvasElement;
    // 初始化数据，设置中心点
    this.setState({
      stars: this.initStars(this.props.initialNum),
      centerPoint: { x: canvas.width / 2, y: canvas.height / 2 },
      initCenterPoint: { x: canvas.width / 2, y: canvas.height / 2 }
    });
    const ctx2d = this.ctx2d as CanvasRenderingContext2D;
    this.mainProcess = setInterval(() => {
      // 重设宽高就会清空画布
      canvas.height = document.documentElement.clientHeight - 5;
      canvas.width = document.body.clientWidth;
      const { centerPoint, scale, centerPointOffset } = this.state;
      ctx2d.translate(
        centerPoint.x * (1 - scale) + centerPointOffset.x,
        centerPoint.y * (1 - scale) + centerPointOffset.y
      );
      ctx2d.scale(scale, scale);
      // 计算引力
      this.calcForce();
      let { stars } = this.state;
      stars.forEach((value, index) => {
        // 绘制星球
        this.drawStar(value);
        // 移动星球
        if (index === 0) return;
        stars[index] = this.moveStar(value);
      });
      this.setState({ stars });
    }, 20 / this.props.playSpeed);
  };

  /** 绘制轨迹线 */
  drawLine = (starInfo: StarInfo) => {
    const ctx2d = this.ctx2d as CanvasRenderingContext2D;
    let travel = starInfo.travel;
    ctx2d.beginPath();
    travel.forEach((value, index) => {
      if (index === 0) ctx2d.moveTo(value.x, value.y);
      else ctx2d.lineTo(value.x, value.y);
    });
    ctx2d.lineWidth = 2;
    ctx2d.strokeStyle = starInfo.color;
    ctx2d.stroke();
  };

  /** 绘制星球 */
  drawStar = (starInfo: StarInfo) => {
    const ctx2d = this.ctx2d as CanvasRenderingContext2D;
    const { x, y, size, color } = starInfo;
    ctx2d.beginPath();
    ctx2d.arc(x, y, size, 0, Math.PI * 2);
    ctx2d.fillStyle = color;
    ctx2d.fill();
    if (this.props.showID) {
      ctx2d.beginPath();
      ctx2d.fillStyle = 'white';
      ctx2d.fillText(starInfo.id, x + 10, y);
    }
    this.drawLine(starInfo);
  };
  /** 根据速度、加速度获取下一个坐标 */
  moveStar = (starInfo: StarInfo): StarInfo => {
    let { x, y, travel } = starInfo;
    const { travelLength } = this.props;
    const { g } = this.state;
    travel.push({ x, y });
    if (travel.length > this.props.travelLength)
      travel = travelLength > 0 ? travel.slice(-travelLength) : [];

    const f = g[starInfo.id];
    const starG = Math.pow(starInfo.size, 3);
    // 先计算加速度对速度的影响
    starInfo.speed.x += f.x / starG;
    starInfo.speed.y += f.y / starG;
    // 然后将速度直接加到坐标上
    x += starInfo.speed.x;
    y += starInfo.speed.y;
    return {
      ...starInfo,
      x,
      y,
      travel
    };
    // 计算所有点之间的引力
  };

  /** 计算引力，并存入字典 */
  calcForce = () => {
    const { stars } = this.state;
    let result: any = {};
    stars.forEach(value => {
      result[value.id] = { x: 0, y: 0 };
    });
    let deleteIndex: number[] = [];
    const changeList: { [key: string]: StarInfo } = {};
    stars.forEach((star1, index1) => {
      stars.slice(index1 + 1, stars.length).forEach((star2, index2) => {
        const xDistance = star1.x - star2.x;
        const yDistance = star1.y - star2.y;
        const distance_2 = Math.pow(xDistance, 2) + Math.pow(yDistance, 2);
        const distance = Math.pow(distance_2, 0.5);
        const star1G = Math.pow(star1.size, 3);
        const star2G = Math.pow(star2.size, 3);
        let xF = 0;
        let yF = 0;
        if (distance < star1.size + star2.size) {
          // 发生了碰撞

          // 体积合并
          const totalSize = Math.pow(star1G + star2G, 1 / 3);
          // 结算动量
          const P_x = star1G * star1.speed.x + star2G * star2.speed.x;
          const P_y = star1G * star1.speed.y + star2G * star2.speed.y;
          const speed = {
            x: P_x / (star1G + star2G),
            y: P_y / (star1G + star2G)
          };
          // 对于未被清除的星球要计算其动量,对其受力和大小进行重新计算,由于真正的星体也不完全是刚性的，这里当作是只要碰撞就不会再分开
          if (star1.size >= star2.size) {
            // star2被吞噬
            deleteIndex.push(index2 + index1 + 1);
            if (this.props.mergeMode) star1.size = totalSize;
            star1.speed = speed;
            changeList[star1.id] = star1;
          } else {
            deleteIndex.push(index1);
            if (this.props.mergeMode) star2.size = totalSize;
            star2.speed = speed;
            changeList[star2.id] = star2;
          }
        } else {
          // 计算引力，这里的g只是一个相对量，用于控制引力大小
          const f = ((this.props.g / 100) * (star1G * star2G)) / distance_2;
          // 分解成x轴上的力以及y轴上的力
          xF = (f * xDistance) / distance;
          yF = (f * yDistance) / distance;
        }

        result[star1.id].x -= xF;
        result[star1.id].y -= yF;
        result[star2.id].x += xF;
        result[star2.id].y += yF;
      });
    });

    this.setState({
      g: result,
      stars: stars
        .filter((value, index) => deleteIndex.indexOf(index) === -1)
        .map(value => {
          if (changeList[value.id]) {
            return changeList[value.id];
          } else {
            return value;
          }
        })
    });
  };

  /** 窗口坐标系转画布坐标系 */
  transCord = (x: number, y: number) => {
    const { centerPoint, scale } = this.state;
    // 坐标除以scale减去偏移量就是画布坐标
    const newX = x / scale - (centerPoint.x * (1 - scale)) / scale;
    const newY = y / scale - (centerPoint.y * (1 - scale)) / scale;
    return { x: newX, y: newY };
  };

  mainProcess: any;

  componentDidMount() {
    if (this.props.ref) {
      this.props.ref(this);
    }
    const canvas = this.canvas as HTMLCanvasElement;
    // 监听鼠标滚轮进行缩放
    canvas.addEventListener('mousewheel', e => {
      //@ts-ignore
      if (e.deltaY < 0) {
        this.zoomIn();
      } else {
        this.zoomOut();
      }
    });

    canvas.addEventListener('mousedown', e => {
      this.setState({
        moving: true,
        mousePosition: { x: e.clientX, y: e.clientY }
      });
    });
    canvas.addEventListener('mouseup', e => {
      this.setState({ moving: false });
    });
    // 平移
    canvas.addEventListener('mousemove', e => {
      if (this.state.moving) {
        const { mousePosition, centerPointOffset } = this.state;
        const offsetX = e.clientX - mousePosition.x + centerPointOffset.x;
        const offsetY = e.clientY - mousePosition.y + centerPointOffset.y;
        this.setState({
          centerPointOffset: { x: offsetX, y: offsetY },
          mousePosition: { x: e.clientX, y: e.clientY }
        });
      }
    });
    canvas.height = document.documentElement.clientHeight - 5;
    canvas.width = document.body.clientWidth;
    this.ctx2d = canvas.getContext('2d');
    this.start();
  }

  // 放大
  zoomIn = () => {
    this.setState({ scale: this.state.scale * 1.1 });
  };
  // 缩小
  zoomOut = () => {
    this.setState({ scale: this.state.scale * 0.9 });
  };

  public render() {
    return (
      <div>
        <canvas
          ref={ref => (this.canvas = ref)}
          style={{ backgroundColor: 'black' }}
        />
      </div>
    );
  }
}
