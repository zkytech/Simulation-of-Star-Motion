/** 添加自定义星体的面板 */
import React, { FunctionComponent, useState } from 'react';
import { Row, Col, InputNumber, Input, Button, Icon } from 'antd';
import style from '../style.module.less';

type IProps = {
  mode: '2d' | '3d';
  onSubmit: (datas: SandboxData[]) => void;
};

const borderStyle = { borderLeft: '1px solid rgba(0,0,0,0.3)' };
let initRowData: SandboxData = {
  position: { x: 0, y: 0, z: 0 },
  speed: { x: 0, y: 0, z: 0 },
  color: 'blue',
  size: 5
};

const Index: FunctionComponent<IProps> = ({ mode, onSubmit }) => {
  const [rowNum, setRowNum] = useState(2);
  const [forceRender, setForceRender] = useState(false); // 这个值是用来强制重新渲染的
  const [rowData, setRowData] = useState<SandboxData[]>([
    {
      position: { x: 900, y: 300, z: 0 },
      speed: { x: 1.5, y: 1.5, z: 0 },
      color: 'blue',
      size: 10
    },
    {
      position: { x: 900, y: 250, z: 0 },
      speed: { x: -1.5, y: -1.5, z: 0 },
      color: 'red',
      size: 10
    }
  ]);
  const dataRows: JSX.Element[] = [];
  dataRows.push(
    <Row className={style.add_data_row} key={-1}>
      <Col span={mode === '3d' ? 9 : 6}>坐标</Col>
      <Col span={mode === '3d' ? 9 : 6} style={borderStyle}>
        速度
      </Col>
      <Col span={3} style={borderStyle}>
        颜色
      </Col>
      <Col span={3} style={borderStyle}>
        大小
      </Col>
    </Row>
  );
  for (let i = 0; i < rowNum; i++) {
    dataRows.push(
      <Row className={style.add_data_row} key={i}>
        <Col span={3}>
          X:
          <InputNumber
            value={rowData[i].position.x}
            onChange={value => {
              rowData[i].position.x = value as number;
              setForceRender(!forceRender);
              setRowData(rowData);
            }}
          />
        </Col>
        <Col span={3}>
          Y:
          <InputNumber
            value={rowData[i].position.y}
            onChange={value => {
              rowData[i].position.y = value as number;
              setForceRender(!forceRender);
              setRowData(rowData);
            }}
          />
        </Col>
        <Col span={mode === '2d' ? 0 : 3}>
          Z:
          <InputNumber
            value={rowData[i].position.z}
            onChange={value => {
              rowData[i].position.z = value as number;
              setForceRender(!forceRender);
              setRowData(rowData);
            }}
          />
        </Col>
        <Col span={3} style={borderStyle}>
          X:
          <InputNumber
            value={rowData[i].speed.x}
            onChange={value => {
              rowData[i].speed.x = value as number;
              setForceRender(!forceRender);
              setRowData(rowData);
            }}
          />
        </Col>
        <Col span={3}>
          Y:
          <InputNumber
            value={rowData[i].speed.y}
            onChange={value => {
              rowData[i].speed.y = value as number;
              setForceRender(!forceRender);
              setRowData(rowData);
            }}
          />
        </Col>
        <Col span={mode === '2d' ? 0 : 3}>
          Z:
          <InputNumber
            value={rowData[i].speed.z}
            onChange={value => {
              rowData[i].speed.z = value as number;
              setForceRender(!forceRender);
              setRowData(rowData);
            }}
          />
        </Col>
        <Col span={3} style={borderStyle}>
          <Input
            style={{ width: '98%', paddingLeft: '1%' }}
            value={rowData[i].color}
            onChange={e => {
              rowData[i].color = e.target.value;
              setForceRender(!forceRender);
              setRowData(rowData);
            }}
          />
        </Col>
        <Col span={2} style={borderStyle}>
          <InputNumber
            style={{ width: '98%', paddingLeft: '1%' }}
            value={rowData[i].size}
            onChange={value => {
              rowData[i].size = value as number;
              setForceRender(!forceRender);
              setRowData(rowData);
            }}
          />
        </Col>
        <Col span={1}>
          <Icon
            className={style.dynamic_delete_button}
            type="minus-circle-o"
            onClick={() => {
              setRowNum(rowNum - 1);
              setRowData(rowData.filter((data, index) => index !== i));
            }}
          />
        </Col>
      </Row>
    );
  }

  return (
    <div style={{ paddingBottom: '60px' }}>
      <Button
        type="dashed"
        onClick={() => {
          setRowNum(rowNum + 1);
          setRowData(rowData.concat(JSON.parse(JSON.stringify(initRowData))));
        }}
        style={{ width: '100px' }}
      >
        <Icon type="plus" /> 增加星体
      </Button>
      &emsp;&emsp;&emsp;
      {mode === '2d'
        ? '2D模式屏幕中心坐标为屏幕分辨率/2'
        : '3D模式屏幕中心坐标为(0,0,0)'}
      {dataRows}
      <Button
        onClick={() => onSubmit(rowData)}
        type={'primary'}
        style={{ position: 'absolute', right: '30px', bottom: '10px' }}
      >
        开始模拟
      </Button>
    </div>
  );
};
export default Index;
