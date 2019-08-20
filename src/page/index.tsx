import React, { FunctionComponent, useState } from 'react';
import Canvas from './canvas';
import { InputNumber, Button, Switch, Slider, Tooltip } from 'antd';
import style from './style.module.less';
const Index: FunctionComponent = () => {
  const [starNum, setStarNum] = useState(500);
  const [tarvelLength, setTravelLength] = useState(300);
  const [centerSize, setCenterSize] = useState(15);
  const [ref, setRef] = useState<Canvas>();
  const [g, setG] = useState(30);
  const [showId, setShowId] = useState(true);
  const [minSize, setMinSize] = useState(3);
  const [maxSize, setMaxSize] = useState(5);
  const [mergeMode, setMergeMode] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  return (
    <div>
      <Canvas
        centerSize={centerSize}
        travelLength={tarvelLength}
        initialNum={starNum}
        ref={canvas => setRef(canvas)}
        g={g}
        showID={showId}
        minSize={minSize}
        maxSize={maxSize}
        mergeMode={mergeMode}
        playSpeed={playSpeed}
      />
      <div className={style.control_panel}>
        <ul>
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
              value={[minSize, maxSize]}
              range
              onChange={value => {
                setMinSize((value as number[])[0]);
                setMaxSize((value as number[])[1]);
              }}
              marks={{ 1: 1, 5: 5, 10: 10 }}
            />
          </li>
          <li>
            <span style={{ width: '100%' }}>播放速度</span>
            <Slider
              min={0.1}
              max={2}
              value={playSpeed}
              onChange={value => {
                //@ts-ignore
                setPlaySpeed(value);
              }}
              step={0.1}
              marks={{ 0.1: 'X 0.1', 0.5: 'X 0.5', 1: 'X 1', 2: 'X 2' }}
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
            <Button onClick={() => (ref as Canvas).start()}>重新开始</Button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Index;
