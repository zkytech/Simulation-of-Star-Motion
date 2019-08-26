import * as THREE from 'three';
import { saveAs } from 'file-saver';

export const randomColor = () => {
  //颜色字符串
  let colorStr = '#';
  //字符串的每一字符的范围
  const randomArr = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'a',
    'b',
    'c',
    'd',
    'e',
    'f'
  ];
  //产生一个六位的字符串
  for (let i = 0; i < 6; i++) {
    //15是范围上限，0是范围下限，两个函数保证产生出来的随机数是整数
    colorStr += randomArr[Math.ceil(Math.random() * (15 - 0) + 0)];
  }
  return colorStr;
};
type RGBAColor = { r: number; g: number; b: number; a: number };

type SpriteParam = {
  fontface?: string; // 字体
  fontsize?: number; // 字体大小
  borderThickness?: number; //边框厚度
  borderColor?: RGBAColor; //边框颜色
  backgroundColor?: RGBAColor; // 背景色
};

/* 绘制圆角矩形 */
const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};
/**
 * 绘制文字精灵
 * @param message 文字
 * @param parameters 自定义参数
 */
export const makeTextSprite = (message: string, parameters?: SpriteParam) => {
  if (parameters === undefined) parameters = {};

  const fontface = parameters.fontface ? parameters.fontface : 'Arial';

  /* 字体大小 */
  const fontsize = parameters.fontsize ? parameters.fontsize : 18;

  /* 边框厚度 */
  const borderThickness = parameters.borderThickness
    ? parameters.borderThickness
    : 4;

  /* 边框颜色 */
  const borderColor = parameters.borderColor
    ? parameters.borderColor
    : { r: 0, g: 0, b: 0, a: 1.0 };

  /* 背景颜色 */
  const backgroundColor = parameters.backgroundColor
    ? parameters.backgroundColor
    : { r: 255, g: 255, b: 255, a: 1.0 };

  /* 创建画布 */
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d') as CanvasRenderingContext2D;

  /* 字体加粗 */
  context.font = 'Bold ' + fontsize + 'px ' + fontface;

  /* 获取文字的大小数据，高度取决于文字的大小 */
  const metrics = context.measureText(message);
  const textWidth = metrics.width;

  /* 背景颜色 */
  context.fillStyle =
    'rgba(' +
    backgroundColor.r +
    ',' +
    backgroundColor.g +
    ',' +
    backgroundColor.b +
    ',' +
    backgroundColor.a +
    ')';

  /* 边框的颜色 */
  context.strokeStyle =
    'rgba(' +
    borderColor.r +
    ',' +
    borderColor.g +
    ',' +
    borderColor.b +
    ',' +
    borderColor.a +
    ')';
  context.lineWidth = borderThickness;

  /* 绘制圆角矩形 */
  roundRect(
    context,
    borderThickness / 2,
    borderThickness / 2,
    textWidth + borderThickness,
    fontsize * 1.4 + borderThickness,
    6
  );

  /* 字体颜色 */
  context.fillStyle = 'rgba(0, 0, 0, 1.0)';
  context.fillText(message, borderThickness, fontsize + borderThickness);

  /* 画布内容用于纹理贴图 */
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;

  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);

  /* 缩放比例 */
  sprite.scale.set(10, 5, 0);

  return sprite;
};

export const saveAsJson = (data: any, fileName: string) => {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  saveAs(blob, fileName);
};

export const deepCopy = (target: any) => {
  return JSON.parse(JSON.stringify(target));
};

/** 判断用户设备是否是pc */
export const isPC = () => {
  const userAgentInfo = navigator.userAgent;
  const Agents = [
    'Android',
    'iPhone',
    'SymbianOS',
    'Windows Phone',
    'iPad',
    'iPod'
  ];
  let flag = true;
  for (let v = 0; v < Agents.length; v++) {
    if (userAgentInfo.indexOf(Agents[v]) > 0) {
      flag = false;
      break;
    }
  }
  return flag;
};

export const drawArrow = (
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  theta: number,
  headlen: number,
  width: number,
  color: string
) => {
  theta = theta || 30;
  headlen = headlen || 10;
  width = width || 1;
  color = color || '#000';
  const angle = (Math.atan2(fromY - toY, fromX - toX) * 180) / Math.PI;
  const angle1 = ((angle + theta) * Math.PI) / 180;
  const angle2 = ((angle - theta) * Math.PI) / 180;
  const topX = headlen * Math.cos(angle1);
  const topY = headlen * Math.sin(angle1);
  const botX = headlen * Math.cos(angle2);
  const botY = headlen * Math.sin(angle2);
  ctx.save();
  ctx.beginPath();
  let arrowX, arrowY;
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  arrowX = toX + topX;
  arrowY = toY + topY;
  ctx.moveTo(arrowX, arrowY);
  ctx.lineTo(toX, toY);
  arrowX = toX + botX;
  arrowY = toY + botY;
  ctx.lineTo(arrowX, arrowY);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
};

/** 计算二维坐标点之间的距离 */
export const calcDistanceOnVec2 = (point1: Vector2, point2: Vector2) => {
  return Math.pow(
    Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2),
    0.5
  );
};
