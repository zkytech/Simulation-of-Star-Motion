/** 2D模型 */
import * as React from 'react';
import style from '../style.module.less';
import { Button, Icon, Tooltip, Upload } from 'antd';
import { deepCopy, isPC, drawArrow, calcDistanceOnVec2 } from './utils';
import Hammer from 'hammerjs';
import { Star2D } from './star';
import EditPanel from './editStar';
import { Rnd } from 'react-rnd';
type DoubleCord = { canvas: Vector2; screen: Vector2 }; // 画布坐标系，窗口坐标系

type IState = {
  selectedKey: number;
  editPanelVisible: boolean;
  editTarget: Star2D | null;
  focousOnLargest: boolean;
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
  /** 暂停时调用的函数 */
  onPause: () => void;
  /** 保存数据 */
  saveData: (stars: Star2D[]) => void;
  /** 加载数据 */
  loadData: (data: ExportData) => void;
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
  readonly state: IState = {
    selectedKey: -1,
    editPanelVisible: false,
    editTarget: null,
    focousOnLargest: false
  };

  /** 这些参数不需要状态树去管理，为了减少不必要的渲染，没有放进state里面 */
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  mainProcess: any; // interval
  forceDict: ForceDict2D = {}; // 星体受力字典
  stars: Star2D[] = []; // 存储画面显示的所有star的列表
  sandboxStars: Star2D[] = []; // 沙盒模式星体数据
  focousedStar: Star2D | null = null; // 画面锁定的star
  predictStars: Star2D[] = []; // 预测得到的star信息
  tempStar: Star2D | null = null; // 沙盒编辑状态的临时star
  pixelRatio = window.devicePixelRatio;
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
  hammer: HammerManager | null = null;
  paused = true; // 当前是否处于暂停状态
  sandboxToolMode: 'add' | 'delete' | 'edit' | null = null;
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
  zoomFunctions = {
    zoomed: this.zoomed,
    zoomedX: this.zoomedX,
    zoomedY: this.zoomedY
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
    if (this.paused) {
      // 暂停状态下主动刷新画布
      this.refreshCanvas();
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
    if (this.paused) {
      // 暂停状态下主动刷新画布
      this.refreshCanvas();
    }
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

  initWithSandboxData = (sandboxData: SandboxData[]) => {
    /** 沙盒模式仅使用用户提供的数据 */
    this.stars = sandboxData.map(
      (data, index) =>
        new Star2D({
          id: `#${index + 1}`, // 由于#0是不会移动的，所以沙盒数据不能使用#0作为id
          size: data.size,
          color: data.color,
          speed: deepCopy(data.speed),
          position: deepCopy(data.position)
        })
    );
    this.sandboxStars = this.stars.map(star => star.clone());
    this.predictTravel();
    this.forceUpdate();
    this.refreshCanvas();
  };

  /** 初始化星体列表 */
  initStars = () => {
    if (this.props.sandboxMode) {
      this.initWithSandboxData(this.props.sandboxData);
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

  /** 暂停 */
  pause = () => {
    if (this.mainProcess) {
      clearInterval(this.mainProcess);
    }
    this.paused = true;
    this.props.onPause();
    this.exitSandboxtool();
  };

  clearCanvas = () => {
    const canvas = this.canvas as HTMLCanvasElement;
    canvas.height = window.innerHeight * this.pixelRatio;
    canvas.width = window.innerWidth * this.pixelRatio;
    (this.ctx as CanvasRenderingContext2D).scale(
      this.pixelRatio,
      this.pixelRatio
    );
  };

  /** 开始绘制 */
  start = (init: boolean = true, playSpeed: number = this.props.playSpeed) => {
    // 清空沙盒编辑事件
    this.paused = false;
    this.addStarArrows = [];
    this.exitSandboxtool();
    // 如果已经有interval先清除
    if (this.mainProcess) {
      clearInterval(this.mainProcess);
    }
    if (init) {
      // 初始化数据
      this.stars = [];
      this.initStars();
      this.focousedStar = null;
    }
    this.mainProcess = setInterval(() => {
      // 清空画布
      this.clearCanvas();

      if (this.focousedStar || this.state.focousOnLargest) {
        if (!this.focousedStar) {
          this.focusOn((this.largestStar as Star2D).position);
        } else {
          this.focusOn(this.focousedStar.position);
        }
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
          this.zoomFunctions
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
  predictLength = 1000;
  /** 预测路径(仅在沙盒模式编辑状态下有效) */
  predictTravel = (tempStar: Star2D | null = null) => {
    const originStars = this.stars.map(star => star.clone());
    if (tempStar) {
      this.stars.push(tempStar.clone());
    }
    let deletedStars: Star2D[] = [];
    for (let i = 0; i < this.predictLength; i++) {
      deletedStars = deletedStars.concat(
        this.calcForce(true).map(star => {
          const result = star.clone();
          result.travel = star.travel;
          return result;
        })
      );
      this.stars.forEach(star => {
        star.moveToNext(this.props.step, this.forceDict);
      });
    }
    let predictStars = this.stars.map(star => {
      const result = star.clone();
      result.travel = deepCopy(star.travel);
      return result;
    });

    predictStars = predictStars.concat(deletedStars);
    // travel.length<100表示该行星发生碰撞并消失
    this.predictStars = predictStars;
    this.forceDict = {};
    this.stars = originStars;
  };

  /** 计算引力、判断撞击 */
  calcForce = (predictMode: boolean = false) => {
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
    let deletedStars: Star2D[] = [];
    if (predictMode) {
      deletedStars = stars.filter(
        (value, index) => deleteIndex.indexOf(index) !== -1
      );
    }

    this.stars = stars
      .filter((value, index) => deleteIndex.indexOf(index) === -1)
      .map(value => {
        if (changeList[value.id]) {
          return changeList[value.id];
        } else {
          return value;
        }
      });

    return deletedStars;
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
    if (
      nextProps.sandboxMode !== this.props.sandboxMode &&
      nextProps.sandboxMode
    ) {
      // 进入沙盒模式
      this.stars = [];
      this.refreshCanvas();
    }
    if (nextProps.sandboxData !== this.props.sandboxData) {
      this.initWithSandboxData(nextProps.sandboxData);
    }
  }

  componentWillUnmount() {
    // 退出时清除循环任务
    clearInterval(this.mainProcess);
  }
  /**两指相互远离 */
  pinchoutHandler = (e: HammerInput) => {
    this.trackWheel({
      center: e.center as Vector2,
      scale: e.scale,
      isMobile: true
    });
  };

  /**两指相互靠近 */
  pinchinHandler = (e: HammerInput) => {
    this.trackWheel({
      center: e.center as Vector2,
      scale: e.scale,
      isMobile: true
    });
  };

  pinchendHandler = (e: HammerInput) => {
    this.prevScale = this.scale;
  };

  /** 触控点击 */
  panstartHandler = (e: HammerInput) => {
    const x = e.pointers[0].clientX;
    const y = e.pointers[0].clientY;
    this.mouse.screen.x = x;
    this.mouse.screen.y = y;
    this.mouse.canvas.x = this.zoomedX_INV(x);
    this.mouse.canvas.y = this.zoomedY_INV(y);
  };
  /** 触控拖拽 */
  panmoveHandler = (e: HammerInput) => {
    let event = {
      type: 'panmove',
      clientX: e.pointers[0].clientX,
      clientY: e.pointers[0].clientY
    };
    this.move(event as MouseEvent);
  };

  /** 用于暂停状态下刷新画布 */
  refreshCanvas = () => {
    this.clearCanvas();
    if (this.tempStar) {
      // 绘制提示箭头
      const tempStar = this.tempStar;
      drawArrow(
        this.ctx as CanvasRenderingContext2D,
        this.zoomedX(tempStar.position.x),
        this.zoomedY(tempStar.position.y),
        this.zoomedX(this.addStarMousePosition.x),
        this.zoomedY(this.addStarMousePosition.y),
        10,
        10,
        2,
        tempStar.color
      );
      // 绘制临时星体
      tempStar.draw(
        this.props.showID,
        this.props.travelLength,
        this.ctx as CanvasRenderingContext2D,
        this.zoomFunctions
      );
    }

    // 绘制原本存在的星体
    this.stars.forEach(star => {
      star.draw(
        this.props.showID,
        this.props.travelLength,
        this.ctx as CanvasRenderingContext2D,
        this.zoomFunctions
      );
      drawArrow(
        this.ctx as CanvasRenderingContext2D,
        this.zoomedX(star.position.x),
        this.zoomedY(star.position.y),
        this.zoomedX(star.position.x + star.speed.x * 50),
        this.zoomedY(star.position.y + star.speed.y * 50),
        10,
        10,
        2,
        star.color
      );
    });
    // 绘制预测线
    this.predictStars.forEach(star => {
      star.drawTravel(
        this.predictLength,
        this.ctx as CanvasRenderingContext2D,
        this.zoomFunctions,
        true
      );
    });
    // 移动视角到focousedStar
    if (this.focousedStar) {
      this.focusOn(this.focousedStar.position);
    }
  };
  /** 移除拖动&缩放控制事件 */
  removeControlEvents = () => {
    const canvas = this.canvas as HTMLCanvasElement;
    const hammer = this.hammer as HammerManager;
    canvas.removeEventListener('wheel', this.trackWheel);
    canvas.removeEventListener('mousemove', this.move);
    canvas.removeEventListener('mousedown', this.move);
    canvas.removeEventListener('mouseup', this.move);
    canvas.removeEventListener('mouseout', this.move);
    hammer.off('panmove', this.panmoveHandler);
    hammer.off('pinchin', this.pinchinHandler);
    hammer.off('pinchout', this.pinchoutHandler);
    hammer.off('pinchend', this.pinchendHandler);
    hammer.off('panstart', this.panstartHandler);
  };
  /** 添加拖拽&缩放控制事件 */
  addControlEvents = () => {
    const canvas = this.canvas as HTMLCanvasElement;
    const hammer = this.hammer as HammerManager;
    // 监听鼠标滚轮进行缩放
    canvas.addEventListener('wheel', this.trackWheel);
    canvas.addEventListener('mousemove', this.move);
    canvas.addEventListener('mousedown', this.move);
    canvas.addEventListener('mouseup', this.move);
    canvas.addEventListener('mouseout', this.move);
    hammer.get('pinch').set({ enable: true });
    hammer.on('pinchin', this.pinchinHandler);
    hammer.on('pinchout', this.pinchoutHandler);
    hammer.on('pinchend', this.pinchendHandler);
    hammer.on('panstart', this.panstartHandler);
    hammer.on('panmove', this.panmoveHandler);
  };
  /** 组件加载完成后进行初始化动作 */
  componentDidMount() {
    if (this.props.canvasRef) {
      this.props.canvasRef(this);
    }
    const canvas = this.canvas as HTMLCanvasElement;
    const hammer = new Hammer(canvas);
    this.hammer = hammer;

    // 监听鼠标事件进行缩放、拖拽
    this.addControlEvents();
    this.ctx = canvas.getContext('2d');
    // 开始绘制
    this.start();
  }

  /** 沙盒添加星体状态 */
  sandboxtoolAddMode = (size: number) => {
    if (!this.paused) {
      // 暂停画面
      this.pause();
    }
    this.exitSandboxtool();
    // 首先取消对拖动相关事件的监听
    // 注意这里做的所有操作全部要在start()函数中做反向操作

    this.removeControlEvents();
    this.sandboxToolMode = 'add';
    // 添加自身的事件监听
    const canvas = this.canvas as HTMLCanvasElement;
    canvas.addEventListener('mousedown', this.sandboxtoolAddStar);
    canvas.addEventListener('mouseup', this.sandboxtoolAddStarFinish);
    // 触控较为特殊，移动事件的监听必须在这里开始
    canvas.addEventListener('touchstart', this.sandboxtoolAddStar);
    canvas.addEventListener('touchend', this.sandboxtoolAddStarFinish);

    // 初始化箭头列表
    this.sandboxStarSize = size;
  };
  /** 点击左键，在鼠标位置添加一个星体 */
  sandboxtoolAddStar = (e: MouseEvent | TouchEvent) => {
    // 获取画布坐标

    // @ts-ignore

    const clientX = e.clientX
      ? (e as MouseEvent).clientX
      : (e as TouchEvent).touches[0].clientX;
    const x = this.zoomedX_INV(clientX);
    // @ts-ignore
    const clientY = e.clientY
      ? (e as MouseEvent).clientY
      : (e as TouchEvent).touches[0].clientY;
    const y = this.zoomedY_INV(clientY);

    // 添加一颗天体
    const star = Star2D.ofRandom({
      speedRange: [0, 0],
      sizeRange: [this.sandboxStarSize, this.sandboxStarSize],
      id: `#${this.stars.length + 100}`
    });
    star.position.x = x;
    star.position.y = y;
    star.draw(
      this.props.showID,
      0,
      this.ctx as CanvasRenderingContext2D,
      this.zoomFunctions
    );
    this.tempStar = star;
    const canvas = this.canvas as HTMLCanvasElement;
    // 初始化速度、鼠标位置
    this.addStarSpeed = { x: 0, y: 0 };
    this.addStarMousePosition = { x, y };
    canvas.addEventListener('mousemove', this.sandboxtoolSetSpeed); // 这个事件会在addStarFinish里面被注销
    canvas.addEventListener('touchmove', this.sandboxtoolSetSpeed);
    canvas.addEventListener('wheel', this.starResize); // 这个事件会在addStarFinish里面被注销
  };
  addStarSpeed: Vector2 = { x: 0, y: 0 };
  addStarMousePosition = { x: 0, y: 0 };
  addStarArrows: string[] = [];
  /** 转动鼠标滚轮，调整star大小 */
  starResize = (e: WheelEvent | HammerInput) => {
    const tempStar = this.tempStar as Star2D;
    //@ts-ignore
    if (e.clientX) {
      // 鼠标事件
      e = e as WheelEvent;
      if (e.deltaY < 0) {
        // 缩小
        tempStar.setSize = tempStar.size * 1.05;
      } else {
        // 放大
        tempStar.setSize = tempStar.size / 1.05;
      }
    } else {
      // 触控事件
      e = e as HammerInput;
      tempStar.setSize = this.sandboxStarSize * e.scale;
    }

    // 刷新画布
    this.refreshCanvas();
  };
  /** 拖动鼠标设置星体速度 */
  sandboxtoolSetSpeed = (e: MouseEvent | TouchEvent) => {
    // 获取画布坐标
    const x = this.zoomedX_INV(
      // @ts-ignore
      e.clientX
        ? (e as MouseEvent).clientX
        : (e as TouchEvent).touches[0].clientX
    );

    const y = this.zoomedY_INV(
      // @ts-ignore
      e.clientY
        ? (e as MouseEvent).clientY
        : (e as TouchEvent).touches[0].clientY
    );
    // 计算位移
    this.addStarSpeed.x += (x - this.addStarMousePosition.x) / 50;
    this.addStarSpeed.y += (y - this.addStarMousePosition.y) / 50;
    // 保存鼠标位置
    this.addStarMousePosition = { x, y };
    // @ts-ignore
    this.tempStar.speed.x = this.addStarSpeed.x;
    // @ts-ignore
    this.tempStar.speed.y = this.addStarSpeed.y;
    this.predictTravel(this.tempStar);
    // 刷新画布
    this.refreshCanvas();
  };

  /** 左键抬起，完成添加星体 */
  sandboxtoolAddStarFinish = (e: MouseEvent | TouchEvent) => {
    const canvas = this.canvas as HTMLCanvasElement;
    // 移除鼠标移动事件
    const tempStar = this.tempStar as Star2D;
    // 设置速度
    tempStar.speed.x = this.addStarSpeed.x;
    tempStar.speed.y = this.addStarSpeed.y;
    // 保存星体
    this.stars.push(tempStar.clone());
    // 同步保存到沙盒数据中
    this.sandboxStars.push(tempStar.clone());
    // 保存箭头信息
    this.addStarArrows.push(tempStar.id);
    this.tempStar = null;
    canvas.removeEventListener('mousemove', this.sandboxtoolSetSpeed);
    canvas.removeEventListener('wheel', this.starResize);
    canvas.removeEventListener('touchmove', this.sandboxtoolSetSpeed);
  };

  /** 退出添加星体状态 */
  exitSandboxtoolAddMode = () => {
    if (this.sandboxToolMode === 'add') {
      const canvas = this.canvas as HTMLCanvasElement;
      canvas.removeEventListener('mousedown', this.sandboxtoolAddStar);
      canvas.removeEventListener('mouseup', this.sandboxtoolAddStarFinish);
      canvas.removeEventListener('touchstart', this.sandboxtoolAddStar);
      canvas.removeEventListener('touchend', this.sandboxtoolAddStarFinish);
      this.addControlEvents();
      this.sandboxToolMode = null;
    }
  };

  sandboxStarSize = 10;
  /** 删除星体 */
  sandboxtoolDeleteStarMode = () => {
    if (!this.paused) {
      this.pause();
    }
    this.exitSandboxtool();
    this.removeControlEvents();
    const canvas = this.canvas as HTMLCanvasElement;
    canvas.addEventListener('mousedown', this.sandboxtoolDeleteStar);
    this.sandboxToolMode = 'delete';
  };
  /** 退出删除星体模式 */
  exitSandboxtoolDeleteMode = () => {
    if (this.sandboxToolMode === 'delete') {
      const canvas = this.canvas as HTMLCanvasElement;
      canvas.removeEventListener('mousedown', this.sandboxtoolDeleteStar);
      this.addControlEvents();
      this.sandboxToolMode = null;
    }
  };

  /** 删除星体 */
  sandboxtoolDeleteStar = (e: MouseEvent) => {
    const x = this.zoomedX_INV(e.clientX);
    const y = this.zoomedY_INV(e.clientY);
    this.stars = this.stars.filter(star => {
      if (calcDistanceOnVec2({ x, y }, star.position) < star.size) {
        // 同步删除沙盒数据中的star
        this.sandboxStars = this.sandboxStars.filter(
          star1 => star1.id !== star.id
        );
        // 删除对应的箭头
        this.addStarArrows = this.addStarArrows.filter(id => {
          if (id === star.id) {
            return false;
          }
          return true;
        });
        // 删除star
        return false;
      }
      return true;
    });
    // 刷新画布
    this.refreshCanvas();
  };
  /** 编辑星体模式 */
  sandboxtoolEditMode = () => {
    if (!this.paused) {
      // 暂停画面
      this.pause();
    }
    this.exitSandboxtool();
    this.removeControlEvents();
    const canvas = this.canvas as HTMLCanvasElement;
    canvas.addEventListener('click', this.sandboxtoolEditStar);
    this.sandboxToolMode = 'edit';
  };

  /** 退出编辑模式 */
  exitSandboxToolEditMode = () => {
    if (this.sandboxToolMode === 'edit') {
      const canvas = this.canvas as HTMLCanvasElement;
      canvas.removeEventListener('click', this.sandboxtoolEditStar);
      this.addControlEvents();
      this.sandboxToolMode = null;
    }
  };
  /** 编辑星体 */
  sandboxtoolEditStar = (e: MouseEvent) => {
    const x = this.zoomedX_INV(e.clientX);
    const y = this.zoomedY_INV(e.clientY);
    const star = this.findStarByPosition({ x, y });
    if (star) {
      this.setState({ editTarget: star, editPanelVisible: true });
    }
  };
  /** 根据坐标查找星体 */
  findStarByPosition = (position: Vector2): Star2D | undefined => {
    let target;
    this.stars.forEach(star => {
      if (calcDistanceOnVec2(star.position, position) <= star.size) {
        target = star;
      }
    });
    return target;
  };
  /** 退出sandboxtool编辑状态 */
  exitSandboxtool = () => {
    switch (this.sandboxToolMode) {
      case 'add':
        this.exitSandboxtoolAddMode();
        break;
      case 'delete':
        this.exitSandboxtoolDeleteMode();
        break;
      case 'edit':
        this.exitSandboxToolEditMode();
        break;
    }
    this.sandboxToolMode = null;
  };

  /** 将编辑的信息应用到stars数组 */
  applyEditStar = (star: Star2D) => {
    this.stars = this.stars.map(value => {
      const target = this.state.editTarget as Star2D;
      if (value.id === target.id) {
        // 将改变应用到stars列表中
        value = star.clone();
        // 刷新画布
      }
      return value;
    });
    // 绘制预测线
    this.predictTravel();
    this.refreshCanvas();
  };

  resetSandbox = ()=>{
    this.pause();
    this.stars = this.sandboxStars.map(star => star.clone());
    this.focousedStar = null
    this.setState({focousOnLargest:false})
    this.forceUpdate();
    this.refreshCanvas()
  }

  hideStatus = true;
  largestStar: Star2D | null = null;
  public render() {
    return (
      <div
        style={{
          height: window.innerHeight,
          width: window.innerWidth,
          overflow: 'hidden'
        }}
      >
        <canvas
          ref={ref => (this.canvas = ref)}
          style={{
            backgroundColor: 'black',
            display: 'block',
            cursor:
              this.sandboxToolMode === 'add' ||
              this.sandboxToolMode === 'delete'
                ? 'crosshair'
                : 'move',
            transform: `scale(${1 / this.pixelRatio})`,
            transformOrigin: '0 0'
          }}
        />
        {/* 沙盒编辑器 */}
        <ul
          className={style.sandbox_tools}
          style={{
            display: this.props.sandboxMode ? '' : 'none',
            transform:
              window.innerWidth < 700
                ? `scale(${window.innerWidth / 700})`
                : undefined,
            left: window.innerWidth < 700 ? 0 : undefined,
            transformOrigin: '20px  0'
          }}
        >
          {/* 添加星体 */}
          <li
            className={
              this.state.selectedKey === 0 ? style.sandbox_tools_selected : ''
            }
          >
            <span
              className={style.sandbox_star}
              onClick={() => {
                this.setState({ selectedKey: 0 });
                this.sandboxtoolAddMode(25);
              }}
              style={{
                height: '50px',
                width: '50px'
              }}
            ></span>
          </li>
          {/* 删除星体 */}
          <li
            className={
              this.state.selectedKey === 1 ? style.sandbox_tools_selected : ''
            }
          >
            <span
              onClick={() => {
                this.setState({ selectedKey: 1 });
                this.sandboxtoolAddMode(15);
              }}
              className={style.sandbox_star}
              style={{ height: '30px', width: '30px' }}
            ></span>
          </li>
          <li
            className={
              this.state.selectedKey === 2 ? style.sandbox_tools_selected : ''
            }
          >
            <span
              onClick={() => {
                this.setState({ selectedKey: 2 });
                this.sandboxtoolAddMode(5);
              }}
              className={style.sandbox_star}
              style={{ height: '10px', width: '10px' }}
            ></span>
          </li>
          <li
            className={
              this.state.selectedKey === 3 ? style.sandbox_tools_selected : ''
            }
          >
            {/* 编辑按钮 */}
            {isPC() ? (
              <Tooltip title="编辑">
                <Icon
                  type="edit"
                  className={style.sandbox_tools_icon}
                  onClick={() => {
                    this.setState({ selectedKey: 3 });
                    this.sandboxtoolEditMode();
                  }}
                />
              </Tooltip>
            ) : (
              <Icon
                type="edit"
                className={style.sandbox_tools_icon}
                onClick={() => {
                  this.setState({ selectedKey: 3 });
                  this.sandboxtoolEditMode();
                }}
              />
            )}
          </li>
          <li
            className={
              this.state.selectedKey === 5 ? style.sandbox_tools_selected : ''
            }
          >
            {/* 删除按钮 */}
            {isPC() ? (
              <Tooltip title="删除">
                <Icon
                  type="delete"
                  className={style.sandbox_tools_icon}
                  onClick={() => {
                    this.setState({ selectedKey: 5 });
                    this.sandboxtoolDeleteStarMode();
                  }}
                />
              </Tooltip>
            ) : (
              <Icon
                type="delete"
                className={style.sandbox_tools_icon}
                onClick={() => {
                  this.setState({ selectedKey: 5 });
                  this.sandboxtoolDeleteStarMode();
                }}
              />
            )}
          </li>
          <li
            className={
              this.state.selectedKey === 6 ? style.sandbox_tools_selected : ''
            }
          >
            {/* 拖动按钮 */}
            {isPC() ? (
              <Tooltip title="移动视野">
                <Icon
                  type="drag"
                  className={style.sandbox_tools_icon}
                  onClick={() => {
                    this.setState({ selectedKey: 6 });
                    this.exitSandboxtool();
                  }}
                />
              </Tooltip>
            ) : (
              <Icon
                type="drag"
                className={style.sandbox_tools_icon}
                onClick={() => {
                  this.setState({ selectedKey: 6 });
                  this.exitSandboxtool();
                }}
              />
            )}
          </li>
          <li>
            {/* 暂停/开始 */}
            {isPC() ? (
              <Tooltip title={this.paused ? '开始' : '暂停'}>
                <Icon
                  type={this.paused ? 'caret-right' : 'pause'}
                  className={style.sandbox_tools_icon}
                  onClick={() => {
                    this.setState({ selectedKey: -1 });
                    if (this.paused) {
                      this.start(false);
                    } else {
                      this.pause();
                    }
                    this.forceUpdate();
                  }}
                />
              </Tooltip>
            ) : (
              <Icon
                type={this.paused ? 'caret-right' : 'pause'}
                className={style.sandbox_tools_icon}
                onClick={() => {
                  this.setState({ selectedKey: -1 });
                  if (this.paused) {
                    this.start(false);
                  } else {
                    this.pause();
                  }
                  this.forceUpdate();
                }}
              />
            )}
          </li>
          <li>
            {/* 重置按钮   */}
            {isPC() ? (
              <Tooltip title={'重置沙盒状态'}>
                <Icon
                  type="undo"
                  className={style.sandbox_tools_icon}
                  onClick={this.resetSandbox}
                />
              </Tooltip>
            ) : (
              <Icon
                type="undo"
                className={style.sandbox_tools_icon}
                onClick={this.resetSandbox}
              />
            )}
          </li>
          <li>
            {/* 保存按钮 */}
            {isPC() ? (
              <Tooltip title="保存沙盒数据">
                <Icon
                  type="save"
                  className={style.sandbox_tools_icon}
                  onClick={() => this.props.saveData(this.stars)}
                />
              </Tooltip>
            ) : (
              <Icon
                type="save"
                className={style.sandbox_tools_icon}
                onClick={() => this.props.saveData(this.stars)}
              />
            )}
          </li>
          <li>
            {/* 导入按钮 */}

            <Upload
              beforeUpload={(file: File, fileList: any[]): false => {
                const fileReader = new FileReader();
                fileReader.onload = (e: any) => {
                  // 读取完成后的回调
                  const jsonText = e.target.result;
                  const data = JSON.parse(jsonText) as ExportData;
                  this.props.loadData(data);
                };
                fileReader.readAsText(file);
                return false;
              }}
              showUploadList={false}
              style={{ marginLeft: '10px' }}
              accept={'.json'}
            >
              {isPC() ? (
                <Tooltip title="导入沙盒数据">
                  <Icon type="upload" className={style.sandbox_tools_icon} />
                </Tooltip>
              ) : (
                <Icon type="upload" className={style.sandbox_tools_icon} />
              )}
            </Upload>
          </li>
          <li>
            <Tooltip
              title={
                <p>
                  使用说明：
                  <br />
                  1. 点击左边合适大小的星体图标 <br />
                  2. 点击屏幕任意位置，并按住鼠标左键或屏幕，生成星体 <br />
                  3. 滚动鼠标滚轮可调整星体大小 <br />
                  4. 拖动鼠标或手指，调整星体运动速度和方向 <br />
                  5. 松开鼠标左键或手指。
                </p>
              }
            >
              <Icon type="info-circle" className={style.sandbox_tools_info} />
            </Tooltip>
          </li>
        </ul>
        {/* 左侧信息列表   */}
        <ul
          className={style.info_panel}
          // hidden={window.screen.width < 720 && this.hideStatus}
        >
          {this.stars
            .sort((value1, value2) => value2.size - value1.size)
            .slice(
              0,
              window.innerWidth < 1000
                ? Math.floor((window.innerHeight - 150) / 30)
                : Math.floor((window.innerHeight - 100) / 70)
            )
            .map((value, index) => {
              if (index === 0) {
                this.largestStar = value;
              }
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
                      this.setState({ focousOnLargest: false });
                    }
                    this.refreshCanvas();
                    if (this.paused) {
                      this.forceUpdate();
                      this.refreshCanvas();
                    }
                  }}
                  style={{
                    background: focoused ? 'RGBA(255,255,255,0.3)' : undefined,
                    height: window.innerWidth < 1000 ? '30px' : '65px',
                    width: window.innerWidth < 1000 ? '50px' : undefined
                  }}
                >
                  <span style={{ color: value.color }}>{value.id}</span>
                  {window.innerWidth < 1000 ? (
                    ''
                  ) : (
                    <span className={style.speed_info}>
                      mass:{value.mass.toFixed(3)}
                      <br /> speed_x:
                      {value.speed.x.toFixed(3)}
                      <br />
                      speed_y:
                      {value.speed.y.toFixed(3)}
                    </span>
                  )}
                </li>
              );
            })}
        </ul>
        {this.state.editPanelVisible ? (
          /** 编辑星体的面板（可拖拽） */
          <Rnd
            default={{
              x: isPC()
                ? this.zoomedX((this.state.editTarget as Star2D).position.x)
                : 50,
              y: isPC()
                ? this.zoomedY((this.state.editTarget as Star2D).position.y)
                : 80,
              width: 'auto',
              height: 'auto'
            }}
            className={style.rnd_panel}
            cancel="input,.flex-box-fix"
          >
            <EditPanel
              star={this.state.editTarget as Star2D}
              onSubmit={this.applyEditStar}
              onClose={star => {
                this.applyEditStar(star);
                this.setState({ editPanelVisible: false });
              }}
            ></EditPanel>
          </Rnd>
        ) : (
          ''
        )}
        <Button
          onClick={() => {
            if (this.state.focousOnLargest) {
              this.setState({ focousOnLargest: false });
            } else {
              this.focousedStar = null;
              this.setState({ focousOnLargest: true });
            }
          }}
          type={'ghost'}
          className={style.status_button}
        >
          {this.state.focousOnLargest ? '取消锁定' : '锁定最大星体'}
        </Button>
        <Button
          onClick={() => {
            this.scale = 1;
            this.origin.canvas = { x: 0, y: 0 };
            this.origin.screen = { x: 0, y: 0 };
            this.focousedStar = null;
            this.setState({ focousOnLargest: false });
          }}
          type={'ghost'}
          className={style.reset_button}
        >
          重置视野
        </Button>
      </div>
    );
  }
}
