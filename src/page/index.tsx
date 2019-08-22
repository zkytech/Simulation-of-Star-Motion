import React, { FunctionComponent, useState } from 'react';
import Canvas2D from './component/2d';
import { InputNumber, Button, Switch, Slider, Tooltip, Modal } from 'antd';
import style from './style.module.less';
import Canvas3D from './component/3d';
import AddStar from './component/addStar';

const Index: FunctionComponent = () => {
  const [starNum, setStarNum] = useState(500); // 初始星体数
  const [tarvelLength, setTravelLength] = useState(300); // 尾迹长度（支持实时调整）
  const [centerSize, setCenterSize] = useState(15); // 中心星体大小
  const [ref, setRef] = useState<Canvas3D | Canvas2D>(); // ref
  const [g, setG] = useState(30); // 引力常量
  const [showId, setShowId] = useState(true); // 是否显示id
  const [sizeRange, setSizeRange] = useState<[number, number]>([1, 5]); // 星体大小范围
  const [mergeMode, setMergeMode] = useState(true); // 吞噬模式
  const [playSpeed, setPlaySpeed] = useState(1); // 播放速度（支持程度与客户端电脑算力相关）
  const [speedRange, setSpeedRange] = useState<[number, number]>([0, 5]); // 星体初始速度范围
  const [paused, setPaused] = useState(false); // 暂停状态
  const [mode, setMode] = useState<'2d' | '3d'>('2d'); // 模式 '2d'|'3d'
  const [modalVisble, setModalVisble] = useState(false); // 模态框可视状态
  const [sandboxMode, setSandboxMode] = useState(false); // 沙盒模式
  const [sandboxData, setSandboxData] = useState<SandboxData[]>([]); // 沙盒数据
  const [step, setStep] = useState(1); // 步长，步长越小，计算精度越高
  const [phonePanelVisible, setPhonePanelVisible] = useState(false); // 手机版的控制面板是否可见
  const [disableCenter, setDisableCenter] = useState(true); // 是否禁用中心天体
  const getcontrolPanel = (className?: string) => {
    return (
      <div className={className}>
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
                  setDisableCenter(false);
                } else {
                  setStarNum(500);
                  setG(30);
                  setTravelLength(300);
                  setSizeRange([1, 5]);
                  setMergeMode(true);
                  setDisableCenter(true);
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
            <Tooltip title="数值越小精度越高">
              <span style={{ width: '100%' }}>计算精度</span>
            </Tooltip>
            <Slider
              min={0.1}
              max={1}
              step={0.1}
              value={step}
              onChange={value => setStep(value as number)}
              marks={{ 0.1: 0.1, 0.5: 0.5, 1: 1 }}
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
            <span>中心天体</span>
            <Switch
              checked={!disableCenter}
              onChange={checked => setDisableCenter(!checked)}
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
          <li>
            <Button
              onClick={() => {
                //@ts-ignore
                ref.pause();
                setPaused(true);
                setModalVisble(true);
              }}
              type={'primary'}
              style={{ marginRight: '10px' }}
            >
              沙盒
            </Button>
            {sandboxMode ? (
              <Button
                onClick={() => {
                  setSandboxMode(false);
                  setTimeout(() => {
                    //@ts-ignore
                    ref.start();
                  }, 100);
                }}
              >
                退出沙盒
              </Button>
            ) : (
              ''
            )}
          </li>
        </ul>
      </div>
    );
  };

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
          sandboxData={sandboxData}
          sandboxMode={sandboxMode}
          step={step}
          disableCenter={disableCenter}
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
          sandboxMode={sandboxMode}
          sandboxData={sandboxData}
          step={step}
          disableCenter={disableCenter}
        />
      )}
      {window.screen.width < 720 ? (
        <Button
          style={{ position: 'fixed', top: '10px', left: '10px' }}
          onClick={() => {
            //@ts-ignore
            ref.pause();
            setPaused(true);
            setPhonePanelVisible(true);
          }}
        >
          设置
        </Button>
      ) : (
        ''
      )}
      {window.screen.width > 720 ? getcontrolPanel(style.control_panel) : ''}
      <Modal
        visible={modalVisble}
        onCancel={() => {
          setModalVisble(false);
          // 取消时清除暂停状态
          setPaused(false);
          //@ts-ignore
          ref.start(false);
        }}
        width={1200}
        footer={null}
      >
        <AddStar
          mode={mode}
          onSubmit={data => {
            setModalVisble(false);
            setSandboxMode(true);
            setSandboxData(data);
            setTimeout(() => {
              // @ts-ignore
              ref.start(true);
            }, 100);
          }}
        />
      </Modal>
      <Modal
        visible={phonePanelVisible}
        onCancel={() => {
          setPhonePanelVisible(false);
          // 取消时清除暂停状态
          setPaused(false);
          //@ts-ignore
          ref.start(false);
        }}
        width={600}
        footer={null}
      >
        {getcontrolPanel(style.control_panel_phone)}
      </Modal>
    </div>
  );
};

export default Index;
