/** 3D模型 */
import * as React from 'react';
import * as THREE from 'three';
// @ts-ignore
import { TrackballControls } from './controls/TrackballControls';

import { randomColor, makeTextSprite } from './utils';
import style from '../style.module.less';
type StarInfo = {
  id: string;
  /** 坐标 */
  x: number;
  y: number;
  z: number;
  /** 颜色 */
  color: string;
  /** 大小 */
  size: number;
  /** 速度 */
  speed: Vector3;
  /** 尾迹 */
  travel: Vector3[];
};

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
  /** 星体最大大小 */
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
};

export default class Index extends React.Component<IProps, IState> {
  readonly state: IState = {};
  public static defaultProps: Partial<IProps> = {
    travelLength: 50,
    initialNum: 500,
    centerSize: 15,
    g: 30,
    showID: true,
    sizeRange: [1, 2],
    mergeMode: false,
    playSpeed: 1,
    speedRange: [0, 5],
    step:1
  };

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1e27
  );
  scene = new THREE.Scene();
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    logarithmicDepthBuffer: true
  });
  controls: TrackballControls | null = null;
  mainProcess: any;
  g: { [key: string]: Vector3 } = {};
  spheres: { [key: string]: THREE.Mesh } = {};
  lines: { [key: string]: THREE.Line[] } = {};

  stars: StarInfo[] = [];
  animateFrame: any;
  textSprite: { [key: string]: THREE.Sprite } = {};

  /** 获取初始星体列表 */
  initStars = (total: number) => {
    if (this.props.sandboxMode) {
      this.stars = this.props.sandboxData.map((data, index) => ({
        id: `#${index + 1}`,
        x: data.position.x,
        y: data.position.y,
        z: data.position.z,
        size: data.size,
        color: data.color,
        speed: JSON.parse(JSON.stringify(data.speed)),
        travel: [JSON.parse(JSON.stringify(data.position))]
      }));
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    let stars: StarInfo[] = [];
    // 先加入恒星
    stars.push({
      id: '#0',
      x: 0,
      y: 0,
      z: 0,
      size: this.props.centerSize,
      color: 'red',
      speed: { x: 0, y: 0, z: 0 },
      travel: []
    });
    const sizeRange = this.props.sizeRange.sort();
    const minSize = sizeRange[0];
    const maxSize = sizeRange[1];
    for (let i = 1; i <= total; i++) {
      const x = Math.ceil(width - Math.random() * width * 2);
      const y = Math.ceil(height - Math.random() * height * 2);
      // TODO:怎么确定一个合理的z值范围？
      const z = Math.ceil(height - Math.random() * height * 2);
      const size = Math.ceil(Math.random() * (maxSize - minSize) + minSize);
      const color = randomColor();
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
          (Math.random() > 0.5 ? 1 : -1),
        z:
          Math.random() *
          (maxSpeed - minSpeed + minSpeed) *
          (Math.random() > 0.5 ? 1 : -1)
      };
      const travel = [{ x, y, z }];
      stars.push({ id: `#${i}`, x, y, z, size, color, speed, travel });
    }
    this.stars = stars;
  };

  /** 计算引力、判断并处理撞击 */
  calcForce = () => {
    let stars = this.stars;
    let result: any = {};
    stars.forEach(value => {
      result[value.id] = { x: 0, y: 0, z: 0 };
    });
    let deleteIndex: number[] = [];
    const changeList: { [key: string]: StarInfo } = {};
    stars.forEach((star1, index1) => {
      stars.slice(index1 + 1, stars.length).forEach((star2, index2) => {
        const xDistance = star1.x - star2.x;
        const yDistance = star1.y - star2.y;
        const zDistance = star1.z - star2.z;
        const distance_2 =
          Math.pow(xDistance, 2) +
          Math.pow(yDistance, 2) +
          Math.pow(zDistance, 2);
        const distance = Math.pow(distance_2, 0.5);
        const star1G = Math.pow(star1.size, 3);
        const star2G = Math.pow(star2.size, 3);
        let xF = 0;
        let yF = 0;
        let zF = 0;

        if (distance <= star1.size + star2.size) {
          // 发生了碰撞
          // 体积合并
          console.log('撞击');
          const totalSize = Math.pow(star1G + star2G, 1 / 3);
          // 结算动量
          const P_x = star1G * star1.speed.x + star2G * star2.speed.x;
          const P_y = star1G * star1.speed.y + star2G * star2.speed.y;
          const P_z = star1G * star1.speed.z + star2G * star2.speed.z;

          const speed = {
            x: P_x / (star1G + star2G),
            y: P_y / (star1G + star2G),
            z: P_z / (star1G + star2G)
          };
          // 对于未被清除的星体要计算其动量,对其受力和大小进行重新计算,由于真正的星体也不完全是刚性的，这里当作是只要碰撞就不会再分开
          let deleteId = '';
          if (star1.size >= star2.size) {
            // star2被吞噬
            deleteIndex.push(index2 + index1 + 1);
            if (this.props.mergeMode) star1.size = totalSize;
            if (star1.id !== '#0') {
              star1.speed = speed;
              changeList[star1.id] = star1;
            }
            deleteId = star2.id;
          } else {
            deleteIndex.push(index1);
            if (this.props.mergeMode) star2.size = totalSize;
            star2.speed = speed;
            changeList[star2.id] = star2;
            deleteId = star1.id;
          }
          this.scene.remove(this.spheres[deleteId]);
          this.lines[deleteId].forEach(value => this.scene.remove(value));
          delete this.spheres[deleteId];
          delete this.lines[deleteId];
        } else {
          // 计算引力，这里的g只是一个相对量，用于控制引力大小
          const f = ((this.props.g / 100) * (star1G * star2G)) / distance_2;
          // 分解成x轴上的力以及y轴上的力
          xF = (f * xDistance) / distance;
          yF = (f * yDistance) / distance;
          zF = (f * zDistance) / distance;
        }
        result[star1.id].x -= xF;
        result[star1.id].y -= yF;
        result[star1.id].z -= zF;
        result[star2.id].x += xF;
        result[star2.id].y += yF;
        result[star2.id].z += zF;
      });
    });

    this.g = result;
    stars = stars
      .filter((value, index) => {
        return deleteIndex.indexOf(index) === -1;
      })
      .map(value => {
        if (changeList[value.id]) {
          return changeList[value.id];
        } else {
          return value;
        }
      });
    // 初始化的瞬间会产生冲突，这里的判断是必须的
    this.stars = stars;
  };

  /** 根据速度、加速度获取下一个坐标 */
  moveStar = (starInfo: StarInfo): StarInfo => {
    let { x, y, z, travel, speed } = starInfo;
    const { travelLength,step } = this.props;
    travel.push({ x, y, z });
    if (travel.length > travelLength)
      travel = travelLength > 0 ? travel.slice(-travelLength) : [];

    const f = this.g[starInfo.id];
    const starG = Math.pow(starInfo.size, 3);

    // 先计算加速度对速度的影响
    speed.x += f.x / starG*step;
    speed.y += f.y / starG*step;
    speed.z += f.z / starG*step;
    // 然后将速度直接加到坐标上
    x += speed.x*step;
    y += speed.y*step;
    z += speed.z*step;
    // 移动星体
    this.spheres[starInfo.id].translateX(speed.x*step);
    this.spheres[starInfo.id].translateY(speed.y*step);
    this.spheres[starInfo.id].translateZ(speed.z*step);
    // 移动id标签
    if (this.props.showID) {
      this.textSprite[starInfo.id].translateX(speed.x*step);
      this.textSprite[starInfo.id].translateY(speed.y*step);
      this.textSprite[starInfo.id].translateZ(speed.z*step);
    }

    return {
      ...starInfo,
      x,
      y,
      z,
      travel,
      speed
    };
  };

  pause = () => {
    if (this.mainProcess) {
      clearInterval(this.mainProcess);
    }
  };
  /**
   * @param init 是否需要重新初始化所有参数
   */
  start = (init: boolean = true) => {
    if (init) this.initStars(this.props.initialNum);
    if (this.mainProcess) clearInterval(this.mainProcess);
    setTimeout(() => {
      if (init) {
        this.componentWillUnmount();
        this.camera = new THREE.PerspectiveCamera(
          60,
          window.innerWidth / window.innerHeight,
          0.1,
          1e27
        );
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({
          antialias: true,
          logarithmicDepthBuffer: true
        });
        this.controls = null;
        this.g = {};
        this.spheres = {};
        this.lines = {};
        this.animateFrame = undefined;
        this.init();
        this.animate();
      }
      this.mainProcess = setInterval(() => {
        this.calcForce();
        this.stars.forEach((starInfo, index) => {
          if (starInfo.id === '#0') return;
          const nextStarInfo = this.moveStar(starInfo);
          this.stars[index] = nextStarInfo;
          this.drawLines(nextStarInfo);
        });
        // 强制更新是为了刷新左侧面板的数据
        this.forceUpdate();
      }, 20 / this.props.playSpeed);
    }, 100);
  };

  init = () => {
    const camera = this.camera;
    // this.scene.background = new THREE.Color('white');
    // 初始化星体&尾迹
    this.stars.forEach(starInfo => {
      // 星体
      const sphereMaterial = this.props.sandboxMode
        ? new THREE.MeshBasicMaterial({
            color: starInfo.color
          })
        : new THREE.MeshLambertMaterial({
            color: starInfo.color
          });
      const sphere = new THREE.Mesh(
        new THREE.SphereBufferGeometry(starInfo.size, 50, 50),
        sphereMaterial
      );
      sphere.position.x = starInfo.x;
      sphere.position.y = starInfo.y;
      sphere.position.z = starInfo.z;
      this.spheres[starInfo.id] = sphere;
      this.scene.add(this.spheres[starInfo.id]);
      // 尾迹
      this.createLine(starInfo);
      if (this.props.showID) {
        // ID标签
        this.createSprite(starInfo);
      }
    });

    // 光源
    const sphere = new THREE.SphereBufferGeometry(
      this.props.centerSize,
      50,
      50
    );
    this.renderer.setClearColor('#000000');
    const light = new THREE.PointLight('#fff', 2, 0, 2); //颜色，强度，光照距离，0表示无限，光衰减
    const lightObj = new THREE.Mesh(
      sphere,
      new THREE.MeshBasicMaterial({ color: 'red' })
    );

    light.add(lightObj);
    light.position.set(this.stars[0].x, this.stars[0].y, this.stars[0].z);
    if (!this.props.sandboxMode) {
      this.scene.add(light);
    }

    // renderer
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth - 3, window.innerHeight - 5);
    //@ts-ignore
    this.refs.container.appendChild(this.renderer.domElement);
    // TODO:沙盒模式控制器应该修改为flyControls
    // 控制器，用于控制视角
    //@ts-ignore
    this.controls = new TrackballControls(camera, this.renderer.domElement);
    const controls = this.controls;
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;
    controls.target.set(0, 0, 0);
    //@ts-ignore
    controls.addEventListener('change', this.renderGL);
    controls.object.position.set(0, 0, 500);
    window.addEventListener('resize', this.onWindowResize, false);
    this.renderGL();
  };

  renderGL = () => {
    this.renderer.render(this.scene, this.camera);
  };

  animate = () => {
    //@ts-ignore

    this.controls.update();
    this.renderGL();
    const frame = requestAnimationFrame(this.animate);
    if (!this.animateFrame) this.animateFrame = frame;
  };

  onWindowResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth - 3, window.innerHeight - 5);
    //@ts-ignore
    this.controls.handleResize();
    this.renderGL();
  };

  createLine = (starInfo: StarInfo, point1?: Vector3, point2?: Vector3) => {
    const lineMaterial = new THREE.LineBasicMaterial({
      color: starInfo.color
    });
    const geometry = new THREE.Geometry();
    if (!point1 || !point2) {
      // 没有指定point就作为初始化数据处理
      geometry.vertices.push(
        new THREE.Vector3(starInfo.x, starInfo.y, starInfo.z)
      );
      geometry.vertices.push(
        new THREE.Vector3(
          starInfo.x + starInfo.speed.x,
          starInfo.y + starInfo.speed.y,
          starInfo.z + starInfo.speed.z
        )
      );
    } else {
      geometry.vertices.push(new THREE.Vector3(point1.x, point1.y, point1.z));
      geometry.vertices.push(new THREE.Vector3(point2.x, point2.y, point2.z));
    }
    const line = new THREE.Line(geometry, lineMaterial);
    line.frustumCulled = false;
    this.scene.add(line);
    if (this.lines[starInfo.id]) {
      this.lines[starInfo.id].push(line);
    } else {
      this.lines[starInfo.id] = [line];
    }
  };
  /** 创建文字标签 */
  createSprite = (starInfo: StarInfo) => {
    const textSprite = makeTextSprite(starInfo.id, { fontsize: 30 });
    textSprite.position.x = starInfo.x + 10;
    textSprite.position.y = starInfo.y;
    textSprite.position.z = starInfo.z;
    this.scene.add(textSprite);
    this.textSprite[starInfo.id] = textSprite;
  };
  /**
   * 绘制指定starInfo的尾迹(travel)
   */
  drawLines = (starInfo: StarInfo) => {
    const lines = this.lines[starInfo.id];
    const travel = starInfo.travel;
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
          this.createLine(starInfo, travel[i], travel[i + 1]);
        }
      }
    }
  };
  componentDidMount() {
    if (this.props.canvasRef) this.props.canvasRef(this);
    // 上面的初始化setState执行很慢所以后面的就加个延时
    this.start(true);
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.animateFrame);
    clearInterval(this.mainProcess);
    window.removeEventListener('resize', this.onWindowResize, false);
    if (this.controls !== null) {
      //@ts-ignore
      this.refs.container.removeChild(this.renderer.domElement);
      //@ts-ignore
      this.controls.removeEventListener('change', this.renderGL);
    }
  }
  componentWillReceiveProps(nextProps: IProps) {
    if (nextProps.travelLength < this.props.travelLength) {
      // 实时控制尾迹长度
      // 如果缩短，清除所有多余的线条
      Object.keys(this.lines).forEach(key => {
        this.lines[key]
          .slice(0, this.props.travelLength - nextProps.travelLength)
          .forEach(line => {
            this.scene.remove(line);
            //@ts-ignore
            line.geometry.verticesNeedUpdate = true;
          });
        this.lines[key] = this.lines[key].slice(-nextProps.travelLength);
      });
    }
    if (nextProps.showID !== this.props.showID) {
      // 实时控制id标签显示
      if (nextProps.showID) {
        this.stars.forEach(starInfo => {
          this.createSprite(starInfo);
        });
      } else {
        Object.keys(this.textSprite).forEach(key => {
          const textSprite = this.textSprite[key];
          this.scene.remove(textSprite);
          delete this.textSprite[key];
        });
      }
    }
  }

  public render() {
    return (
      <div>
        <div ref={'container'} />
        <ul className={style.info_panel}>
          {this.stars.slice(0, 20).map(value => {
            return (
              <li key={value.id}>
                <span style={{ color: value.color }}>{value.id}</span>
                <span className={style.speed_info}>
                  speed_x:{value.speed.x.toFixed(3)}&emsp;speed_y:
                  {value.speed.y.toFixed(3)}&emsp;speed_z:
                  {value.speed.z.toFixed(3)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}
