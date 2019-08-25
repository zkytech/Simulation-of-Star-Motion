import React, { FunctionComponent, useState, useEffect } from 'react';
import { Star2D } from './star';
import { InputNumber, Button } from 'antd';
import style from '../style.module.less';
import ColorPicker from './colorPicker';
type IProps = {
  star: Star2D; // 要编辑的星体
  onSubmit: (star: Star2D) => void; // 编辑完成的回调
  onClose: (star: Star2D) => void; // 编辑取消回调
};

const Index: FunctionComponent<IProps> = ({ star, onSubmit, onClose }) => {
  const [target, setTarget] = useState(star.clone());
  const [update, setUpdate] = useState(false);
  const [originStar, setOriginStar] = useState(star.clone());
  useEffect(() => {
    setTarget(star.clone());
    setOriginStar(star.clone());
  }, [star]);
  useEffect(() => {
    // 每次改变都进行commit以实时显示变化
    onSubmit(target);
  }, [update]);
  return (
    <ul className={style.edit_star_panel}>
      <li className={style.edit_star_panel_id}>{star.id}</li>
      <li style={{ paddingTop: '10px' }}>
        <ColorPicker
          color={target.color}
          onChange={color => {
            target.color = color;
            setTarget(target);
            setUpdate(!update);
          }}
        />
      </li>
      <li className={style.edit_star_panel_vect}>
        <span>坐标</span>
        <br />
        X:
        <InputNumber
          value={target.position.x}
          onChange={value => {
            target.position.x = value as number;
            setTarget(target);
            setUpdate(!update);
          }}
        />
        &emsp; Y:
        <InputNumber
          value={target.position.y}
          onChange={value => {
            target.position.y = value as number;
            setTarget(target);
            setUpdate(!update);
          }}
        />
      </li>
      <li className={style.edit_star_panel_vect}>
        <span>速度</span>
        <br />
        X:
        <InputNumber
          value={target.speed.x}
          onChange={value => {
            target.speed.x = value as number;
            setTarget(target);
            setUpdate(!update);
          }}
        />
        &emsp; Y:
        <InputNumber
          value={target.speed.y}
          onChange={value => {
            target.speed.y = value as number;
            setTarget(target);
            setUpdate(!update);
          }}
        />
      </li>
      <li>
        大小:
        <InputNumber
          value={target.size}
          onChange={value => {
            target.setSize = value as number;
            setTarget(target);
            setUpdate(!update);
          }}
        />
      </li>

      <li>
        <Button
          style={{ marginLeft: '20px' }}
          type="primary"
          onClick={() => onClose(target)}
        >
          确定
        </Button>{' '}
        <Button
          style={{ marginLeft: '20px' }}
          onClick={() => onClose(originStar)}
        >
          取消
        </Button>
      </li>
    </ul>
  );
};

export default Index;
