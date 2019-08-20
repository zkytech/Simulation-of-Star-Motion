import React, { FunctionComponent, useState } from 'react';
import Canvas from './canvas';
import { InputNumber, Button } from 'antd';
import style from './style.module.less';
const Index: FunctionComponent = () => {
  const [starNum, setStarNum] = useState(500);
  const [tarvelLength, setTravelLength] = useState(300);
  const [centerSize, setCenterSize] = useState(15);
  const [ref, setRef] = useState<Canvas>();
  const [g, setG] = useState(30);
  return (
    <div>
      <Canvas
        centerSize={centerSize}
        travelLength={tarvelLength}
        initialNum={starNum}
        ref={canvas => setRef(canvas)}
        g={g}
      />
      <div className={style.control_panel}>
        <ul>
          <li>
            <span className={style.input_prefix}>星球数量</span>
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
            <span>中心星球大小</span>
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
            <Button onClick={() => (ref as Canvas).start()}>开始</Button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Index;
