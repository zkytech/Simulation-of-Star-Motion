/** 添加自定义星体的面板 */
import React, { FunctionComponent, useState } from 'react';
import { Row, Col, InputNumber, Input, Button, Icon, Upload } from 'antd';
import style from '../style.module.less';
import { saveAsJson } from './utils';

type IProps = {
  mode: '2d' | '3d';
  onSubmit: (param: {
    stars: SandboxData[];
    params: ExportParams | undefined;
  }) => void;
  params: ExportParams;
};

const borderStyle = { borderLeft: '1px solid rgba(0,0,0,0.3)' };
let initRowData: SandboxData = {
  position: { x: 0, y: 0, z: 0 },
  speed: { x: 0, y: 0, z: 0 },
  color: 'blue',
  size: 5
};

const Index: FunctionComponent<IProps> = ({ mode, onSubmit, params }) => {
  const [rowNum, setRowNum] = useState(2);
  const [forceRender, setForceRender] = useState(false); // 这个值是用来强制重新渲染的
  const [importParam, setImportParam] = useState<ExportParams>();
  const [rowData, setRowData] = useState<SandboxData[]>([
    {
      position: { x: 0, y: 0, z: 0 },
      speed: { x: 1.5, y: 5, z: -2 },
      color: 'blue',
      size: 10
    },
    {
      position: { x: 20, y: 20, z: 50 },
      speed: { x: -5, y: -5, z: 1 },
      color: 'green',
      size: 10
    },
    {
      position: { x: 150, y: 70, z: 50 },
      speed: { x: 3, y: 3, z: 3 },
      color: 'red',
      size: 10
    }
  ]);
  const dataRows: JSX.Element[] = [];
  dataRows.push(
    <Row className={style.add_data_row} key={-2}>
      <Col span={mode === '3d' ? 9 : 8} style={borderStyle}>
        坐标
      </Col>
      <Col span={mode === '3d' ? 9 : 8} style={borderStyle}>
        速度
      </Col>
      <Col span={mode === '3d' ? 3 : 4} style={borderStyle}>
        颜色
      </Col>
      <Col span={mode === '3d' ? 2 : 3} style={borderStyle}>
        大小
      </Col>
    </Row>
  );
  dataRows.push(
    <Row className={style.add_data_row} key={-1}>
      <Col span={mode === '3d' ? 3 : 4} style={borderStyle}>
        X
      </Col>
      <Col span={mode === '3d' ? 3 : 4} style={borderStyle}>
        Y
      </Col>
      <Col span={mode === '3d' ? 3 : 0} style={borderStyle}>
        Z
      </Col>
      <Col span={mode === '3d' ? 3 : 4} style={borderStyle}>
        X
      </Col>
      <Col span={mode === '3d' ? 3 : 4} style={borderStyle}>
        Y
      </Col>
      <Col span={mode === '3d' ? 3 : 0} style={borderStyle}>
        Z
      </Col>
      <Col span={mode === '3d' ? 3 : 4} style={borderStyle}>
        &emsp;
      </Col>
      <Col span={3} style={borderStyle}>
        &emsp;
      </Col>
    </Row>
  );
  for (let i = 0; i < rowNum; i++) {
    dataRows.push(
      <Row className={style.add_data_row} key={i}>
        <Col span={mode === '3d' ? 3 : 4} style={borderStyle}>
          <InputNumber
            value={rowData[i].position.x}
            onChange={value => {
              rowData[i].position.x = value as number;
              setForceRender(!forceRender);
              setRowData(rowData);
            }}
          />
        </Col>
        <Col span={mode === '3d' ? 3 : 4}>
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
          <InputNumber
            value={rowData[i].position.z}
            onChange={value => {
              rowData[i].position.z = value as number;
              setForceRender(!forceRender);
              setRowData(rowData);
            }}
          />
        </Col>
        <Col span={mode === '3d' ? 3 : 4} style={borderStyle}>
          <InputNumber
            step={0.1}
            value={rowData[i].speed.x}
            onChange={value => {
              rowData[i].speed.x = value as number;
              setForceRender(!forceRender);
              setRowData(rowData);
            }}
          />
        </Col>
        <Col span={mode === '3d' ? 3 : 4}>
          <InputNumber
            step={0.1}
            value={rowData[i].speed.y}
            onChange={value => {
              rowData[i].speed.y = value as number;
              setForceRender(!forceRender);
              setRowData(rowData);
            }}
          />
        </Col>
        <Col span={mode === '3d' ? 3 : 0}>
          <InputNumber
            step={0.1}
            value={rowData[i].speed.z}
            onChange={value => {
              rowData[i].speed.z = value as number;
              setForceRender(!forceRender);
              setRowData(rowData);
            }}
          />
        </Col>
        <Col span={mode === '3d' ? 3 : 4} style={borderStyle}>
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
        <Col span={mode === '3d' ? 2 : 3} style={borderStyle}>
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
          {rowNum > 1 ? (
            <Icon
              className={style.dynamic_delete_button}
              type="minus-circle-o"
              onClick={() => {
                setRowNum(rowNum - 1);
                setRowData(rowData.filter((data, index) => index !== i));
              }}
            />
          ) : (
            ''
          )}
        </Col>
      </Row>
    );
  }

  const submit = () => {
    onSubmit({ stars: rowData, params: importParam });
  };
  return (
    <div
      style={{ paddingBottom: '60px' }}
      onKeyDown={e => {
        if (e && e.keyCode === 13) {
          // 回车直接提交
          e.stopPropagation();
          e.preventDefault();
          submit();
        }
      }}
    >
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
      <Upload
        beforeUpload={(file: File, fileList: any[]): false => {
          const fileReader = new FileReader();
          fileReader.onload = (e: any) => {
            // 读取完成后的回调
            const jsonText = e.target.result;
            const data = JSON.parse(jsonText) as ExportData;
            setRowData(data.stars);
            setImportParam(data.params);
            setRowNum(2);
          };
          fileReader.readAsText(file);
          return false;
        }}
        showUploadList={false}
        style={{ marginLeft: '10px' }}
        accept={'.json'}
      >
        <Button type={'dashed'}>
          <Icon type="upload" /> 导入星体数据
        </Button>
      </Upload>
      &emsp;&emsp;&emsp;
      {mode === '2d'
        ? '2D模式屏幕中心坐标为屏幕分辨率/2'
        : '3D模式屏幕中心坐标为(0,0,0)'}
      {dataRows}
      <Button
        onClick={() => {
          // 导出的数据格式
          saveAsJson(
            { stars: rowData, params: params },
            `${new Date().toDateString()}星体数据.json`
          );
        }}
        style={{ position: 'absolute', right: '130px', bottom: '10px' }}
        type={'link'}
      >
        导出星体数据
      </Button>
      <Button
        onClick={submit}
        type={'primary'}
        style={{ position: 'absolute', right: '30px', bottom: '10px' }}
      >
        开始模拟
      </Button>
    </div>
  );
};
export default Index;
