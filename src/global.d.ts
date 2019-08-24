declare module '*.less';
declare type Vector3 = { x: number; y: number; z: number };
declare type Vector2 = { x: number; y: number };
declare type SandboxData = {
  position: Vector3;
  speed: Vector3;
  color: string;
  size: number;
};

declare type StarInfo2D = {
  id: string;
  color: string;
  size: number;
  position: Vector2;
  speed: Vector2;
};
declare type StarInfo3D = {
  id: string;
  color: string;
  size: number;
  position: Vector3;
  speed: Vector3;
};
declare type RandomStarGeneratorParam = {
  /** 星体大小范围 */
  sizeRange: [number, number];
  /** 星体速度范围 */
  speedRange: [number, number];
  /** id */
  id: string;
};
declare type ForceDict2D = { [id: string]: Vector2 };
declare type ForceDict3D = { [id: string]: Vector3 };
declare type ZoomFunctions = {
  zoomed: (value: number) => number;
  zoomedX: (value: number) => number;
  zoomedY: (value: number) => number;
};
declare type SimulateMouseEvent = {
  isMobile: boolean;
  scale: number;
  center: Vector2;
};

declare type ExportData = {
  stars: SandboxData[];
  params: ExportParams;
};
declare type ExportParams = {
  g: number;
  step: number;
  centerSize: number;
  disableCenter: boolean;
  mergeMode: boolean;
};
