declare module '*.less';
declare type Vector3 = { x: number; y: number; z: number };
declare type Vector2 = { x: number; y: number };
declare type SandboxData = {
  position: Vector3; // 坐标
  speed: Vector3; // 速度
  color: string; //颜色
  size: number;
};
