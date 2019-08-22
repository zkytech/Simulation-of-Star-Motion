import React, { FunctionComponent, useState } from 'react';
import Canvas2D from './2d';
import { InputNumber, Button, Switch, Slider, Tooltip } from 'antd';
import style from './style.module.less';
import Canvas3D from './3d';

const Index: FunctionComponent = () => {
  const [starNum, setStarNum] = useState(500); // 初始星体数
  const [tarvelLength, setTravelLength] = useState(300); // 尾迹长度（支持实时调整）
  const [centerSize, setCenterSize] = useState(15); // 中心星体大小
  const [ref, setRef] = useState<Canvas3D | Canvas2D>(); // ref
  const [g, setG] = useState(30); // 引力常量
  const [showId, setShowId] = useState(true); // 是否显示id
  const [sizeRange, setSizeRange] = useState<[number, number]>([1, 2]); // 星体大小范围
  const [mergeMode, setMergeMode] = useState(false); // 吞噬模式
  const [playSpeed, setPlaySpeed] = useState(1); // 播放速度（支持程度与客户端电脑算力相关）
  const [speedRange, setSpeedRange] = useState<[number, number]>([0, 5]); // 星体初始速度范围
  const [paused, setPaused] = useState(false); // 暂停状态
  const [mode, setMode] = useState('2d'); // 模式 '2d'|'3d'
  return (
    <div>
      {mode === '2d' ? (
        <Canvas2D
          centerSize={centerSize}
          travelLength={tarvelLength}
          initialNum={starNum}
          canvasRef={canvas => {
            //@ts-ignore
            setRef(canvas);
          }}
          g={g}
          showID={showId}
          sizeRange={sizeRange}
          mergeMode={mergeMode}
          playSpeed={playSpeed}
          speedRange={speedRange}
        />
      ) : (
        <Canvas3D
          centerSize={centerSize}
          travelLength={tarvelLength}
          initialNum={starNum}
          canvasRef={canvas => {
            //@ts-ignore
            setRef(canvas);
          }}
          g={g}
          showID={showId}
          sizeRange={sizeRange}
          mergeMode={mergeMode}
          playSpeed={playSpeed}
          speedRange={speedRange}
        />
      )}
      <div className={style.control_panel}>
        <ul style={{ listStyle: 'none' }}>
          <li>
            <span>3D模式</span>
            <Switch
              checked={mode === '3d'}
              onChange={checked => {
                setMode(checked ? '3d' : '2d');
                if (checked) {
                  setStarNum(100);
                  setG(300);
                  setTravelLength(100);
                  setShowId(false);
                } else {
                  setStarNum(500);
                  setG(30);
                  setTravelLength(300);
                  setShowId(true);
                }
              }}
            />
          </li>
          <li>
            <span className={style.input_prefix}>初始星体数量</span>
            <InputNumber
              value={starNum}
              onChange={value => setStarNum(value as number)}
            />
          </li>
          <li>
            <span>尾迹长度</span>
            <InputNumber
              value={tarvelLength}
              onChange={value => setTravelLength(value as number)}
            />
          </li>
          <li>
            <span>中心星体大小</span>
            <InputNumber
              value={centerSize}
              onChange={value => setCenterSize(value as number)}
            />
          </li>
          <li>
            <span>引力大小</span>
            <InputNumber value={g} onChange={value => setG(value as number)} />
          </li>
          <li>
            <span style={{ width: '100%' }}>普通星体大小范围</span>
            <Slider
              min={1}
              max={10}
              value={sizeRange}
              range
              onChange={value => {
                setSizeRange(value as [number, number]);
              }}
              marks={{ 1: 1, 5: 5, 10: 10 }}
            />
          </li>
          <li>
            <span style={{ width: '100%' }}>普通星体速度范围</span>
            <Slider
              min={0}
              max={10}
              step={0.1}
              value={speedRange}
              range
              onChange={value => {
                setSpeedRange(value as [number, number]);
              }}
              marks={{ 1: 1, 5: 5, 10: 10 }}
            />
          </li>
          <li>
            <Tooltip title="播放速度调整是通过加快运算节奏来实现的，这与计算机算力挂钩，当算力不足时，调整播放速度是无效的。此时可以通过减小尾迹长度或初始星体数量来减少运算量。">
              <span style={{ width: '100%' }}>播放速度</span>
            </Tooltip>
            <Slider
              min={0.1}
              max={5}
              value={playSpeed}
              onChange={value => {
                //@ts-ignore
                setPlaySpeed(value);
              }}
              step={0.1}
              marks={{ 0.1: '0.1', 0.5: '0.5', 1: '1', 2: '2', 5: '5' }}
            />
          </li>
          <li>
            <Tooltip title="吞噬模式下，星体之间碰撞后将会生成一个更大的星体，其产生的引力也会随之增大">
              <span>吞噬模式</span>
            </Tooltip>

            <Switch
              checked={mergeMode}
              onChange={checked => setMergeMode(checked)}
            />
          </li>
          <li>
            <span>显示ID</span>
            <Switch checked={showId} onChange={checked => setShowId(checked)} />
          </li>
          <li>
            <Button
              onClick={() => {
                if (!paused) {
                  //@ts-ignore
                  ref.pause();
                  setPaused(true);
                } else {
                  //@ts-ignore
                  ref.start(false);
                  setPaused(false);
                }
              }}
              style={{ marginRight: '10px' }}
            >
              {paused ? '开始' : '暂停'}
            </Button>
            <Button
              onClick={() => {
                //@ts-ignore
                ref.start(true);
                setPaused(false);
              }}
              type={'primary'}
            >
              重新开始
            </Button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Index;
