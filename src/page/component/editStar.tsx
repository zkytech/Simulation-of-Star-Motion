import React, { FunctionComponent, useState, useEffect } from 'react';
import { Star2D } from './star';
import { InputNumber, Button, Row, Col, Slider } from 'antd';
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
        <span>方向</span>
        <br />
        <Row style={{ width: '350px' }}>
          <Col span={18}>
            <Slider
              min={-180}
              max={180}
              step={0.1}
              marks={{
                0: '0°',
                180: '180°',
                '-180': '-180°',
                90: '90°',
                '-90': '-90°'
              }}
              onChange={value => {
                // @ts-ignore
                target.direction = value;
                setTarget(target);
                setUpdate(!update);
              }}
              value={target.direction}
            />
          </Col>
          <Col span={6}>
            <InputNumber
              min={-180}
              max={180}
              step={0.1}
              value={target.direction}
              onChange={value => {
                // @ts-ignore
                target.direction = value;
                setTarget(target);
                setUpdate(!update);
              }}
            />
          </Col>
        </Row>
      </li>
      <li className={style.edit_star_panel_vect}>
        <span>速度</span>
        <br />
        <Row style={{ width: '350px' }}>
          <Col span={18}>
            <Slider
              min={0}
              max={50}
              marks={{ 0: 0, 5: 5, 10: 10, 50: 50 }}
              step={0.1}
              onChange={value => {
                // @ts-ignore
                target.speedSize = value;
                setTarget(target);
                setUpdate(!update);
              }}
              value={target.speedSize}
            />
          </Col>
          <Col span={6}>
            <InputNumber
              min={0}
              step={0.1}
              onChange={value => {
                // @ts-ignore
                target.speedSize = value;
                setTarget(target);
                setUpdate(!update);
              }}
              value={target.speedSize}
            />
          </Col>
        </Row>
      </li>
      <li className={style.edit_star_panel_vect}>
        <span>半径</span>
        <br />
        <Row style={{ width: '350px' }}>
          <Col span={18}>
            <Slider
              min={0.00001}
              max={100}
              marks={{ 0: 0, 5: 5, 10: 10, 50: 50, 100: 100 }}
              step={0.1}
              value={target.size}
              onChange={value => {
                target.setSize = value as number;
                setTarget(target);
                setUpdate(!update);
              }}
            />
          </Col>
          <Col span={6}>
            <InputNumber
              min={0.00001}
              step={0.1}
              value={target.size}
              onChange={value => {
                target.setSize = value as number;
                setTarget(target);
                setUpdate(!update);
              }}
            />
          </Col>
        </Row>
      </li>

      <li>
        <div style={{ width: '300px' }}>
          <Button
            type="primary"
            onClick={() => onClose(target)}
            style={{ display: 'inline-block' }}
          >
            确定
          </Button>{' '}
          <Button
            onClick={() => onClose(originStar)}
            style={{ display: 'inline-block' }}
          >
            取消
          </Button>
        </div>
      </li>
    </ul>
  );
};

export default Index;
