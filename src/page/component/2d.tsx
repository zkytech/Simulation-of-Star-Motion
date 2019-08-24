/** 2D模型 */
import * as React from 'react';
import style from '../style.module.less';
import { Button } from 'antd';
import { deepCopy, isPC } from './utils';
import Hammer from 'hammerjs';
import { Star2D } from './star';
type DoubleCord = { canvas: Vector2; screen: Vector2 }; // 画布坐标系，窗口坐标系

type IState = {};

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
  /** 星体大小范围 */
  sizeRange: [number, number];
  /** 吞噬模式 */
  mergeMode: boolean;
  /** 播放速度 */
  playSpeed: number;
  /** 速度范围 */
  speedRange: [number, number];
  /** 是否沙盒模式 */
  sandboxMode: boolean;
  /** 沙盒数据 */
  sandboxData: SandboxData[];
  /** 步长（步长越小，计算精度越高） */
  step: number;
  /** 隐藏中心恒星 */
  disableCenter: boolean;
};

export default class Index extends React.Component<IProps, IState> {
  public static defaultProps: Partial<IProps> = {
    travelLength: 300,
    initialNum: 200,
    centerSize: 10,
    g: 100,
    showID: true,
    sizeRange: [2, 5],
    mergeMode: false,
    playSpeed: 1,
    speedRange: [0, 0.25],
    sandboxMode: false,
    sandboxData: [],
    step: 1,
    disableCenter: false
  };

  /** 这些参数不需要状态树去管理，为了减少不必要的渲染，没有放进state里面 */
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  mainProcess: any;
  forceDict: ForceDict2D = {}; // 星体受力字典
  stars: Star2D[] = [];
  focousedStar: Star2D | null = null;

  // 画布缩放拖动控制参数
  scale: number = 1;
  origin: DoubleCord = {
    //坐标原点
    canvas: { x: 0, y: 0 },
    screen: { x: 0, y: 0 }
  };
  mouse: DoubleCord & { button: number } = {
    //鼠标位置
    canvas: { x: 0, y: 0 },
    screen: { x: 0, y: 0 },
    button: 0
  };
  prevScale = 1;

  /** 缩放长度 */
  zoomed = (value: number) => {
    return value * this.scale;
  };
  /** 画布坐标X转换为缩放后的窗口坐标 */
  zoomedX = (x: number) => {
    return (x - this.origin.canvas.x) * this.scale + this.origin.screen.x;
  };
  /** 画布坐标Y转换为缩放后的窗口坐标 */
  zoomedY = (y: number) => {
    return (y - this.origin.canvas.y) * this.scale + this.origin.screen.y;
  };

  /** 鼠标坐标转换（屏幕坐标->画布坐标） */
  zoomedX_INV = (x: number) => {
    return Math.floor(
      (x - this.origin.screen.x) / this.scale + this.origin.canvas.x
    );
  };
  /** 鼠标坐标转换（屏幕坐标->画布坐标） */
  zoomedY_INV = (y: number) => {
    return Math.floor(
      (y - this.origin.screen.y) / this.scale + this.origin.canvas.y
    );
  };

  /** 鼠标拖动 */
  move = (event: MouseEvent) => {
    // 鼠标事件
    if (
      !isPC() &&
      (event.type === 'mouseup' ||
        event.type === 'mousedown' ||
        event.type === 'mousemove')
    )
      // 移动端不需要这些事件，因为移动端手指落点不可能是连续的，如果直接触发这里面的事件，会引发画面瞬移
      return;
    if (event.type === 'mousedown' || event.type === 'panmove') {
      this.mouse.button = 1;
    } else if (event.type === 'mouseup' || event.type === 'mouseout') {
      this.mouse.button = 0;
    }
    this.mouse.screen.x = event.clientX;
    this.mouse.screen.y = event.clientY;
    // 获得上次鼠标在画布中的位置
    const xx = this.mouse.canvas.x;
    const yy = this.mouse.canvas.y;

    // 计算鼠标在画布中的位置
    this.mouse.canvas.x = this.zoomedX_INV(this.mouse.screen.x);
    this.mouse.canvas.y = this.zoomedY_INV(this.mouse.screen.y);
    if (this.mouse.button === 1) {
      // 鼠标点击
      // 移动画布缩放原点
      this.origin.canvas.x -= this.mouse.canvas.x - xx;
      this.origin.canvas.y -= this.mouse.canvas.y - yy;
      // 重新计算鼠标在画布中的位置
      this.mouse.canvas.x = this.zoomedX_INV(this.mouse.screen.x);
      this.mouse.canvas.y = this.zoomedY_INV(this.mouse.screen.y);
    }
  };

  /** 鼠标缩放 */
  trackWheel = (event: MouseWheelEvent | SimulateMouseEvent) => {
    const mouse = this.mouse;
    const origin = this.origin;
    // @ts-ignore

    // @ts-ignore
    if (event.isMobile) {
      const e = event as SimulateMouseEvent;
      mouse.screen.x = e.center.x;
      mouse.screen.y = e.center.y;
      mouse.canvas.x = this.zoomedX_INV(e.center.x);
      mouse.canvas.y = this.zoomedY_INV(e.center.y);
      this.scale = this.prevScale * e.scale;
    } else {
      // 阻止页面滚动
      const e = event as MouseWheelEvent;
      e.preventDefault();
      // 判断滚动方向进行缩放
      if (e.deltaY < 0) {
        this.scale = this.scale * 1.1;
      } else {
        this.scale = this.scale * (1 / 1.1);
      }
    }

    // 设置缩放原点

    origin.canvas.x = mouse.canvas.x;
    origin.canvas.y = mouse.canvas.y;
    origin.screen.x = mouse.screen.x;
    origin.screen.y = mouse.screen.y;
    mouse.canvas.x = this.zoomedX_INV(mouse.screen.x); // recalc mouse world (real) pos
    mouse.canvas.y = this.zoomedY_INV(mouse.screen.y);
  };
  /** 锁定窗口位置 */
  focusOn = (target?: Vector2) => {
    if (!target) {
      // @ts-ignore
      target = this.focousedStar.position;
    }
    this.origin.canvas.x = target.x;
    this.origin.canvas.y = target.y;
    this.origin.screen.x = window.innerWidth / 2;
    this.origin.screen.y = window.innerHeight / 2;
  };

  /** 设置中心天体 */
  addCenterStar = () => {
    const width = (this.canvas as HTMLCanvasElement).width;
    const height = (this.canvas as HTMLCanvasElement).height;
    this.stars.push(
      new Star2D({
        id: '#0',
        size: this.props.centerSize,
        color: 'red',
        speed: { x: 0, y: 0 },
        position: { x: width / 2, y: height / 2 }
      })
    );
  };

  /** 移除中心天体 */
  removeCenterStar = () => {
    this.stars = this.stars.filter(star => star.id !== '#0');
  };

  /** 初始化星体列表 */
  initStars = () => {
    if (this.props.sandboxMode) {
      /** 沙盒模式仅使用用户提供的数据 */
      this.stars = this.props.sandboxData.map(
        (data, index) =>
          new Star2D({
            id: `#${index + 1}`, // 由于#0是不会移动的，所以沙盒数据不能使用#0作为id
            size: data.size,
            color: data.color,
            speed: deepCopy(data.speed),
            position: deepCopy(data.position)
          })
      );
    } else {
      // 先加入恒星
      if (!this.props.disableCenter) {
        this.addCenterStar();
      }
      const total = this.props.initialNum;
      // 随机初始化其它星体
      for (let i = 1; i <= total; i++) {
        this.stars.push(
          Star2D.ofRandom({
            speedRange: this.props.speedRange,
            sizeRange: this.props.sizeRange,
            id: `#${i}`
          })
        );
      }
    }
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
    if (init) {
      // 初始化数据
      this.stars = [];
      this.initStars();
      this.focousedStar = null;
    }
    this.mainProcess = setInterval(() => {
      // 清空画布
      canvas.height = window.innerHeight - 5;
      canvas.width = window.innerWidth;

      if (this.focousedStar) {
        this.focusOn();
      }
      // 计算引力
      this.calcForce();
      let stars = this.stars;

      stars.forEach((star, index) => {
        // 绘制星体
        star.draw(
          this.props.showID,
          this.props.travelLength,
          this.ctx as CanvasRenderingContext2D,
          {
            zoomed: this.zoomed,
            zoomedX: this.zoomedX,
            zoomedY: this.zoomedY
          }
        );
        // 如果是中心恒星，不移动
        if (star.id === '#0') return;
        // 移动星体到下一个位置
        star.moveToNext(this.props.step, this.forceDict);
        stars[index] = star;
      });
      this.forceUpdate();
    }, 20 / playSpeed);
  };

  /** 计算引力、判断撞击 */
  calcForce = () => {
    let stars = this.stars;
    let result: any = {};
    stars.forEach(value => {
      result[value.id] = { x: 0, y: 0 };
    });
    let deleteIndex: number[] = [];
    const changeList: { [key: string]: Star2D } = {};
    stars.forEach((star1, index1) => {
      stars.slice(index1 + 1, stars.length).forEach((star2, index2) => {
        const xDistance = star1.position.x - star2.position.x;
        const yDistance = star1.position.y - star2.position.y;
        const distance_2 = Math.pow(xDistance, 2) + Math.pow(yDistance, 2);
        const distance = Math.pow(distance_2, 0.5);
        const star1G = star1.mass;
        const star2G = star2.mass;
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
            if (this.props.mergeMode) star1.setSize = totalSize;
            if (star1.id !== '#0') {
              star1.speed = speed;
              changeList[star1.id] = star1;
            }
          } else {
            deleteIndex.push(index1);
            if (this.props.mergeMode) star2.setSize = totalSize;
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
    this.forceDict = result;

    this.stars = stars
      .filter((value, index) => deleteIndex.indexOf(index) === -1)
      .map(value => {
        if (changeList[value.id]) {
          return changeList[value.id];
        } else {
          return value;
        }
      });
  };

  componentWillReceiveProps(nextProps: IProps) {
    if (nextProps.playSpeed !== this.props.playSpeed) {
      // 实时控制播放速度
      this.start(false, nextProps.playSpeed);
    }
    if (nextProps.disableCenter !== this.props.disableCenter) {
      // 实时增删中心天体
      if (nextProps.disableCenter) {
        this.removeCenterStar();
      } else {
        this.addCenterStar();
      }
    }
  }

  componentWillUnmount() {
    // 退出时清除循环任务
    clearInterval(this.mainProcess);
  }

  /** 组件加载完成后进行初始化动作 */
  componentDidMount() {
    if (this.props.canvasRef) {
      this.props.canvasRef(this);
    }
    const canvas = this.canvas as HTMLCanvasElement;
    // 监听鼠标滚轮进行缩放
    canvas.addEventListener('wheel', this.trackWheel);
    canvas.addEventListener('mousemove', this.move);
    canvas.addEventListener('mousedown', this.move);
    canvas.addEventListener('mouseup', this.move);
    canvas.addEventListener('mouseout', this.move);
    const hammer = new Hammer(canvas);
    hammer.get('pinch').set({ enable: true });
    hammer.on('pinchin', e => {
      // 两指相互靠近
      this.trackWheel({
        center: e.center as Vector2,
        scale: e.scale,
        isMobile: true
      });
    });
    hammer.on('pinchout', e => {
      // 两指相互远离
      this.trackWheel({
        center: e.center as Vector2,
        scale: e.scale,
        isMobile: true
      });
    });
    hammer.on('pinchend', e => {
      this.prevScale = this.scale;
    });
    hammer.on('panstart', e => {
      const x = e.pointers[0].clientX;
      const y = e.pointers[0].clientY;
      this.mouse.screen.x = x;
      this.mouse.screen.y = y;
      this.mouse.canvas.x = this.zoomedX_INV(x);
      this.mouse.canvas.y = this.zoomedY_INV(y);
    });
    hammer.on('panmove', e => {
      let event = {
        type: 'panmove',
        clientX: e.pointers[0].clientX,
        clientY: e.pointers[0].clientY
      };
      this.move(event as MouseEvent);
    });

    // 设置画布宽高
    canvas.height = document.documentElement.clientHeight - 5;
    canvas.width = document.body.clientWidth;
    this.ctx = canvas.getContext('2d');
    // 开始绘制
    this.start();
  }

  hideStatus = true;
  public render() {
    return (
      <div>
        <canvas
          ref={ref => (this.canvas = ref)}
          style={{ backgroundColor: 'black' }}
        />

        <ul
          className={style.info_panel}
          hidden={window.screen.width < 720 && this.hideStatus}
        >
          {this.stars
            .sort((value1, value2) => value2.size - value1.size)
            .slice(0, 13)
            .map(value => {
              const focoused =
                this.focousedStar && this.focousedStar.id === value.id;
              return (
                <li
                  key={value.id}
                  onClick={() => {
                    if (focoused) {
                      this.focousedStar = null;
                    } else {
                      this.focousedStar = value;
                    }
                  }}
                  style={{
                    background: focoused ? 'RGBA(255,255,255,0.3)' : undefined
                  }}
                >
                  <span style={{ color: value.color }}>{value.id}</span>
                  <span className={style.speed_info}>
                    mass:{value.mass.toFixed(3)}&emsp; speed_x:
                    {value.speed.x.toFixed(3)}&emsp;speed_y:
                    {value.speed.y.toFixed(3)}
                  </span>
                </li>
              );
            })}
        </ul>
        <Button
          onClick={() => {
            this.scale = 1;
            this.origin.canvas = { x: 0, y: 0 };
            this.origin.screen = { x: 0, y: 0 };
          }}
          type={'ghost'}
          className={style.reset_button}
        >
          重置视野
        </Button>
        <Button
          onClick={() => {
            this.hideStatus = !this.hideStatus;
          }}
          type={'ghost'}
          className={style.status_button}
          hidden={window.screen.width > 720}
        >
          {this.hideStatus ? '显示状态信息' : '隐藏状态信息'}
        </Button>
      </div>
    );
  }
}
