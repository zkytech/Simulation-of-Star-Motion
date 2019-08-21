import React, { FunctionComponent, useState } from 'react';
import Canvas from './canvas';
import { InputNumber, Button, Switch, Slider, Tooltip, Icon } from 'antd';
import style from './style.module.less';
const Index: FunctionComponent = () => {
  const [starNum, setStarNum] = useState(500);
  const [tarvelLength, setTravelLength] = useState(300);
  const [centerSize, setCenterSize] = useState(15);
  const [ref, setRef] = useState<Canvas>();
  const [g, setG] = useState(30);
  const [showId, setShowId] = useState(true);
  const [sizeRange, setSizeRange] = useState<[number, number]>([1, 2]);
  const [mergeMode, setMergeMode] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [speedRange, setSpeedRange] = useState<[number, number]>([0, 5]);
  const [paused, setPaused] = useState(false);
  return (
    <div>
      <Canvas
        centerSize={centerSize}
        travelLength={tarvelLength}
        initialNum={starNum}
        canvasRef={canvas => setRef(canvas)}
        g={g}
        showID={showId}
        sizeRange={sizeRange}
        mergeMode={mergeMode}
        playSpeed={playSpeed}
        speedRange={speedRange}
      />
      <div className={style.control_panel}>
        <ul style={{ listStyle: 'none' }}>
          <li>
            <span className={style.input_prefix}>初始星球数量</span>
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
                  (ref as Canvas).pause();
                  setPaused(true);
                } else {
                  (ref as Canvas).start(false);
                  setPaused(false);
                }
              }}
              style={{ marginRight: '10px' }}
            >
              {paused ? '开始' : '暂停'}
            </Button>
            <Button onClick={() => (ref as Canvas).start()} type={'primary'}>
              重新开始
            </Button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Index;
