# 星体运动模拟

>## 使用方法

`yarn install`

`yarn start`

[在线预览](https://public.zkytech.top/stars/index.html)

已针对移动端进行适配，支持使用手机进行所有操作。

>## 相关技术

2D模型的绘制就是单纯的canvas绘图

3D模型的绘制使用的是threejs，其本身是对WebGL的一个封装。

>## 效果演示

3D模式

![3D](preview/3D.gif)

沙盒

![沙盒](preview/沙盒.gif)

视野锁定

![视野锁定](preview/视野锁定.gif)


>## TODO

- [X] 2D模型
- [X] 完善控制面板
- [X] 添加自定义星体（沙盒）
- [X] 3D模型
- [X] 导入/导出沙盒数据（JSON）
- [X] 步长可控（用于调整精度）
- [X] 移动端适配
- [X] 视角锁定指定星体
- [ ] 增加多种类沙盒星体预设
- [ ] AR模式