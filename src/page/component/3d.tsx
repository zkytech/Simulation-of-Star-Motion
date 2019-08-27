/** 3D模型 */
import * as React from 'react';
import * as THREE from 'three';
// @ts-ignore
import { TrackballControls } from './controls/TrackballControls';
import style from '../style.module.less';
import { Star3D } from './star';
import { Button } from 'antd';

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
  /** 隐藏中心恒星 */
  disableCenter: boolean;
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
    step: 1,
    disableCenter: false
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
  forceDict: { [key: string]: Vector3 } = {};
  stars: Star3D[] = [];
  animateFrame: any;
  light: THREE.Light | null = null;
  focousedStar: Star3D | null = null;

  /** 获取初始星体列表 */
  initStars = (total: number) => {
    let stars: Star3D[] = [];
    if (this.props.sandboxMode) {
      // 沙盒模式
      stars = this.props.sandboxData.map(
        (data, index) =>
          new Star3D({
            id: `#${index + 1}`,
            position: {
              x: data.position.x,
              y: data.position.y,
              z: data.position.z
            },
            size: data.size,
            color: data.color,
            speed: JSON.parse(JSON.stringify(data.speed))
          })
      );
    } else {
      // 先加入恒星
      if (!this.props.disableCenter) {
        stars.push(
          new Star3D({
            id: '#0',
            position: {
              x: 0,
              y: 0,
              z: 0
            },
            size: this.props.centerSize,
            color: 'red',
            speed: { x: 0, y: 0, z: 0 }
          })
        );
      }
      for (let i = 1; i <= this.props.initialNum; i++) {
        stars.push(
          Star3D.ofRandom({
            speedRange: this.props.speedRange,
            sizeRange: this.props.sizeRange,
            id: `#${i}`
          })
        );
      }
    }
    stars.forEach(star => (star.scene = this.scene));
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
    const changeList: { [key: string]: Star3D } = {};
    stars.forEach((star1, index1) => {
      stars.slice(index1 + 1, stars.length).forEach((star2, index2) => {
        const xDistance = star1.position.x - star2.position.x;
        const yDistance = star1.position.y - star2.position.y;
        const zDistance = star1.position.z - star2.position.z;
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
          if (star1.size >= star2.size) {
            // star2被吞噬
            deleteIndex.push(index2 + index1 + 1);
            if (this.props.mergeMode) star1.setSize = totalSize;
            if (star1.id !== '#0') {
              star1.speed = speed;
              changeList[star1.id] = star1;
            }
            // 移除star2
            star2.remove();
          } else {
            deleteIndex.push(index1);
            if (this.props.mergeMode) star2.setSize = totalSize;
            star2.speed = speed;
            changeList[star2.id] = star2;
            // 移除star1
            star1.remove();
          }
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

    this.forceDict = result;
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

  /** 暂停 */
  pause = () => {
    if (this.mainProcess) {
      clearInterval(this.mainProcess);
    }
  };
  /** 锁定视角 */
  focousOn = (star: Star3D) => {
    const controls = this.controls as TrackballControls;
    controls.target.x = star.position.x;
    controls.target.y = star.position.y;
    controls.target.z = star.position.z;
  };

  /**
   * @param init 是否需要重新初始化所有参数
   */
  start = (init: boolean = true) => {
    if (init) {
      this.initStars(this.props.initialNum);
      this.resetView();
    }
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
        this.forceDict = {};
        this.animateFrame = undefined;
        this.init();
        this.animate();
      }
      this.mainProcess = setInterval(() => {
        this.calcForce();
        this.stars.forEach((star, index) => {
          if (star.id === '#0') return;
          star.moveToNext(
            this.props.step,
            this.forceDict,
            this.props.travelLength
          );
        });
        if (this.focousedStar) {
          this.focousOn(this.focousedStar);
        }
        this.renderGL();
        // 强制更新是为了刷新左侧面板的数据
        this.forceUpdate();
      }, 20 / this.props.playSpeed);
    }, 100);
  };

  /**
   * @param force 是否强制添加光源
   */
  createCenterLight = (force: boolean = false) => {
    // 光源
    const sphere = new THREE.SphereBufferGeometry(
      this.props.centerSize,
      50,
      50
    );
    const light = new THREE.PointLight('#fff', 2, 0, 2); //颜色，强度，光照距离，0表示无限，光衰减
    const lightObj = new THREE.Mesh(
      sphere,
      new THREE.MeshBasicMaterial({ color: 'red' })
    );
    light.add(lightObj);
    light.position.set(0, 0, 0);
    if ((!this.props.sandboxMode && !this.props.disableCenter) || force) {
      // 没有中心天体的情况下不需要光源
      this.scene.add(light);
    }
    this.light = light;
  };

  init = () => {
    const camera = this.camera;
    // this.scene.background = new THREE.Color('white');
    // 初始化星体&尾迹
    this.stars.forEach(star => {
      star.scene = this.scene;
      star.create(
        this.props.sandboxMode,
        this.props.disableCenter,
        this.props.showID
      );
    });

    // 光源
    this.createCenterLight();
    // renderer
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.domElement.style.setProperty('display', 'block');
    //@ts-ignore

    this.refs.container.appendChild(this.renderer.domElement);
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
    controls.object.position.set(0, 0, 500);
    //@ts-ignore
    controls.addEventListener('change', this.renderGL);

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
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    //@ts-ignore
    this.controls.handleResize();
    this.renderGL();
  };

  componentDidMount() {
    if (this.props.canvasRef) this.props.canvasRef(this);
    // 上面的初始化setState执行很慢所以后面的就加个延时
    this.start(true);
  }

  componentWillUnmount() {
    // forceContextLoss 非常重要，否则即使组件卸载 依旧会占用大量计算资源，除非页面刷新
    this.renderer.forceContextLoss();
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
    if (nextProps.travelLength !== this.props.travelLength) {
      // 实时控制尾迹长度
      this.stars.forEach(star =>
        star.changeTravelLength(nextProps.travelLength, this.props.travelLength)
      );
    }
    if (nextProps.showID !== this.props.showID) {
      // 实时控制id标签显示
      if (nextProps.showID) {
        this.stars.forEach(star => {
          star.createSprite();
        });
      } else {
        this.stars.forEach(star => {
          star.removeTextSpire();
        });
      }
    }

    if (nextProps.disableCenter !== this.props.disableCenter) {
      // 实时增删中心天体

      if (nextProps.disableCenter) {
        // 删除中心天体
        this.stars = this.stars.filter(star => {
          if (star.id === '#0') {
            star.remove();
            return false;
          }
          return true;
        });
        if (this.light) {
          // 删除原有光源
          this.scene.remove(this.light);
        }
        // 添加新的光源
        const pointLight = new THREE.PointLight('#ffffff');
        pointLight.position.set(0, 0, 0);
        //告诉平行光需要开启阴影投射
        pointLight.castShadow = true;
        this.scene.add(pointLight);
        this.light = pointLight;
      } else {
        // 增加中心天体a
        // 删除原有光源
        if (this.light) {
          this.scene.remove(this.light);
        }
        const centerInfo = {
          id: '#0',
          position: { x: 0, y: 0, z: 0 },
          size: this.props.centerSize,
          color: 'red',
          speed: { x: 0, y: 0, z: 0 }
        };
        const centerStar = new Star3D(centerInfo);
        centerStar.scene = this.scene;
        this.stars.push(centerStar);
        centerStar.create(
          this.props.sandboxMode,
          this.props.disableCenter,
          this.props.showID
        );
        this.createCenterLight(true);
      }
    }
  }
  /** 重置视野 */
  resetView = () => {
    if (this.controls) {
      this.controls.target.set(0, 0, 0);
      this.controls.object.position.set(0, 0, 500);
    }
    this.focousedStar = null;
  };
  public render() {
    return (
      <div>
        <div ref={'container'} />
        <ul className={style.info_panel + ` ${style.info_panel_3d}`}>
          {this.stars
            .sort((value1, value2) => value2.size - value1.size)
            .slice(
              0,
              window.innerWidth < 1000
                ? Math.floor((window.innerHeight - 150) / 30)
                : Math.floor((window.innerHeight - 100) / 95)
            )
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
                    background: focoused ? 'RGBA(255,255,255,0.3)' : undefined,
                    height: window.innerWidth < 1000 ? '30px' : '90px',
                    width: window.innerWidth < 1000 ? '50px' : undefined
                  }}
                >
                  <span style={{ color: value.color }}>{value.id}</span>
                  {window.innerWidth < 1000 ? (
                    ''
                  ) : (
                    <span className={style.speed_info}>
                      mass:{value.mass.toFixed(3)}&emsp; speed_x:
                      {value.speed.x.toFixed(3)}
                      &emsp;speed_y:
                      {value.speed.y.toFixed(3)}&emsp;speed_z:
                      {value.speed.z.toFixed(3)}
                    </span>
                  )}
                </li>
              );
            })}
        </ul>
        <Button
          onClick={this.resetView}
          type={'ghost'}
          className={style.reset_button}
        >
          重置视野
        </Button>
      </div>
    );
  }
}
