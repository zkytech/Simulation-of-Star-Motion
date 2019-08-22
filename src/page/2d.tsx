import * as React from 'react';
import style from './style.module.less';
import { Button } from 'antd';
import { randomRGB } from './utils';

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
  /** 尾迹 */
  travel: { x: number; y: number }[];
};

type IState = {
  stars: StarInfo[];
};

type IProps = {
  /** 尾迹长度 */
  travelLength: number;
  /** 初始星体数量 */
  initialNum: number;
  /** 恒星的体积 */
  centerSize: number;
  canvasRef?: (ref: Index) => any;
  /** 引力G值 */
  g: number;
  /** 是否显示ID */
  showID: boolean;
  /** 星体最大大小 */
  sizeRange: [number, number];
  /** 吞噬模式 */
  mergeMode: boolean;
  /** 播放速度 */
  playSpeed: number;
  /** 速度范围 */
  speedRange: [number, number];
};

export default class Index extends React.Component<IProps, IState> {
  readonly state: IState = {
    stars: []
  };

  public static defaultProps: Partial<IProps> = {
    travelLength: 300,
    initialNum: 200,
    centerSize: 10,
    g: 100,
    showID: true,
    sizeRange: [2, 5],
    mergeMode: false,
    playSpeed: 1,
    speedRange: [0, 0.25]
  };

  /** 这些参数不需要状态树去管理，为了减少不必要的渲染，没有放进state里面 */
  canvas: HTMLCanvasElement | null = null;
  ctx2d: CanvasRenderingContext2D | null = null;
  mainProcess: any;
  g: { [key: string]: { x: number; y: number } } = {};
  scale: number = 1;
  centerPointOffset: { x: number; y: number } = { x: 0, y: 0 };
  centerPoint: { x: number; y: number } = { x: 0, y: 0 };
  moving: boolean = false;
  mousePosition: { x: number; y: number } = { x: 0, y: 0 };

  /** 获取初始星体列表 */
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
    const sizeRange = this.props.sizeRange.sort();
    const minSize = sizeRange[0];
    const maxSize = sizeRange[1];
    for (let i = 1; i <= total; i++) {
      const x = Math.ceil(Math.random() * width);
      const y = Math.ceil(Math.random() * height);
      const size = Math.ceil(Math.random() * (maxSize - minSize) + minSize);
      const color = randomRGB();
      const speedRange = this.props.speedRange.sort();
      const minSpeed = speedRange[0];
      const maxSpeed = speedRange[1];
      const speed = {
        x:
          Math.random() *
          (maxSpeed - minSpeed + minSpeed) *
          (Math.random() > 0.5 ? 1 : -1),
        y:
          Math.random() *
          (maxSpeed - minSpeed + minSpeed) *
          (Math.random() > 0.5 ? 1 : -1)
      };
      const travel = [{ x, y }];
      stars.push({ id: `#${i}`, x, y, size, color, speed, travel });
    }

    return stars;
  };
  pause = () => {
    if (this.mainProcess) {
      clearInterval(this.mainProcess);
    }
  };

  /** 开始绘制 */
  start = (init: boolean = true, playSpeed: number = this.props.playSpeed) => {
    // 如果已经有interval先清除
    if (this.mainProcess) {
      clearInterval(this.mainProcess);
    }
    const canvas = this.canvas as HTMLCanvasElement;
    const ctx2d = this.ctx2d as CanvasRenderingContext2D;
    if (init) {
      // 初始化数据，设置中心点
      this.centerPoint = { x: canvas.width / 2, y: canvas.height / 2 };
      this.setState({
        stars: this.initStars(this.props.initialNum)
      });
    }
    this.mainProcess = setInterval(() => {
      // 重设宽高清空画布
      canvas.height = document.documentElement.clientHeight - 5;
      canvas.width = document.body.clientWidth;
      //
      ctx2d.translate(
        this.centerPoint.x * (1 - this.scale) + this.centerPointOffset.x,
        this.centerPoint.y * (1 - this.scale) + this.centerPointOffset.y
      );
      ctx2d.scale(this.scale, this.scale);
      // 计算引力
      this.calcForce();
      let { stars } = this.state;
      stars.forEach((value, index) => {
        // 绘制星体
        this.drawStar(value);
        // 如果是中心恒星，不移动
        if (value.id === '#0') return;
        // 移动星体
        stars[index] = this.moveStar(value);
      });
      this.setState({ stars });
    }, 20 / this.props.playSpeed);
  };

  /** 绘制尾迹线 */
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

  /** 绘制星体 */
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
    travel.push({ x, y });
    if (travel.length > this.props.travelLength)
      travel = travelLength > 0 ? travel.slice(-travelLength) : [];

    const f = this.g[starInfo.id];
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

  /** 计算引力、判断撞击 */
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
          // 对于未被清除的星体要计算其动量,对其受力和大小进行重新计算,由于真正的星体也不完全是刚性的，这里当作是只要碰撞就不会再分开
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
    this.g = result;
    this.setState({
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

  componentWillReceiveProps(nextProps: IProps) {
    if (nextProps.playSpeed !== this.props.playSpeed) {
      // 实时控制播放速度
      console.log('速度改变', nextProps.playSpeed);
      this.start(false, nextProps.playSpeed);
    }
  }

  componentWillUnmount() {
    // 退出时清除循环任务
    console.log('unmount 2d');
    clearInterval(this.mainProcess);
  }

  // /** 窗口坐标系转画布坐标系 */
  // transCord = (x: number, y: number) => {
  //   const { centerPoint, scale } = this.state;
  //   const newX = x / scale - (centerPoint.x * (1 - scale)) / scale;
  //   const newY = y / scale - (centerPoint.y * (1 - scale)) / scale;
  //   return { x: newX, y: newY };
  // };

  /** 组件加载完成后进行初始化动作 */
  componentDidMount() {
    if (this.props.canvasRef) {
      this.props.canvasRef(this);
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
    // 监听鼠标点击进行拖动
    canvas.addEventListener('mousedown', e => {
      this.moving = true;
      this.mousePosition = { x: e.clientX, y: e.clientY };
    });
    canvas.addEventListener('mouseup', e => {
      this.moving = false;
    });
    canvas.addEventListener('mousemove', e => {
      if (this.moving) {
        const offsetX =
          e.clientX - this.mousePosition.x + this.centerPointOffset.x;
        const offsetY =
          e.clientY - this.mousePosition.y + this.centerPointOffset.y;
        this.centerPointOffset = { x: offsetX, y: offsetY };
        this.mousePosition = { x: e.clientX, y: e.clientY };
      }
    });
    // 设置画布宽高
    canvas.height = document.documentElement.clientHeight - 5;
    canvas.width = document.body.clientWidth;
    this.ctx2d = canvas.getContext('2d');
    // 开始绘制
    this.start();
  }

  // 放大
  zoomIn = () => {
    this.scale = this.scale * 1.1;
  };
  // 缩小
  zoomOut = () => {
    this.scale = this.scale * 0.9;
  };

  public render() {
    return (
      <div>
        <canvas
          ref={ref => (this.canvas = ref)}
          style={{ backgroundColor: 'black' }}
        />
        <ul className={style.info_panel}>
          {this.state.stars.slice(1, 21).map(value => {
            return (
              <li key={value.id}>
                <span style={{ color: value.color }}>{value.id}</span>
                <span className={style.speed_info}>
                  speed_x:{value.speed.x.toFixed(3)}&emsp;speed_y:
                  {value.speed.y.toFixed(3)}
                </span>
              </li>
            );
          })}
        </ul>
        <Button
          onClick={() => {
            this.centerPointOffset = { x: 0, y: 0 };
            this.scale = 1;
          }}
          type={'ghost'}
          className={style.reset_button}
        >
          视野重置
        </Button>
      </div>
    );
  }
}
