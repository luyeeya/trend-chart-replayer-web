'use client';

import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import OrderPopup from '../../lib/OrderPopup';
import ConfirmPopup from '../../lib/ConfirmPopup';

export default function Home() {
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [contract, setContract] = useState('期货A');
  const [price, setPrice] = useState(100);
  const [lastDataPointIndex, setLastDataPointIndex] = useState(0);

  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null); // 使用 useRef 存储实例
  const isMounted = useRef(true); // 标志位

  const orderPopupRef = useRef<HTMLDivElement>(null); // 引用浮窗 DOM 元素
  const confirmPopupRef = useRef<HTMLDivElement>(null); // 引用确认浮窗 DOM 元素

  useEffect(() => {
    isMounted.current = true;

    if (chartRef.current) {
      const instance = echarts.init(chartRef.current);
      chartInstanceRef.current = instance;

      const option = getChartOptions();
      instance.setOption(option);

      instance.getZr().on('contextmenu', (params: any) => {
        const pointInPixel = [params.offsetX, params.offsetY];
        if (instance.containPixel('grid', pointInPixel)) {
          const dataIndex = Math.floor(
            instance.convertFromPixel({ seriesIndex: 0 }, pointInPixel)[0]
          );
          setLastDataPointIndex(dataIndex);
          setShowOrderPopup(true);
          setPopupPosition({
            top: params.event.clientY,
            left: params.event.clientX,
          });
        }
        params.event.preventDefault();
      });

      return () => {
        instance.dispose();
        chartInstanceRef.current = null;
        isMounted.current = false; // 组件卸载时清理
      };
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 检查点击是否在浮窗外部
      if (
        showOrderPopup &&
        orderPopupRef.current &&
        !orderPopupRef.current.contains(event.target as Node)
      ) {
        setShowOrderPopup(false);
      }

      // 检查点击是否在确认浮窗外部
      if (
        showConfirmPopup &&
        confirmPopupRef.current &&
        !confirmPopupRef.current.contains(event.target as Node)
      ) {
        setShowConfirmPopup(false);
      }
    };

    // 添加全局点击事件监听器
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      // 移除全局点击事件监听器
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOrderPopup, showConfirmPopup]);

  const handleBuy = () => {
    setContract('期货A');
    setPrice(100);
    setShowOrderPopup(false);
    setShowConfirmPopup(true);
  };

  const handleSell = () => {
    setContract('期货B');
    setPrice(90);
    setShowOrderPopup(false);
    setShowConfirmPopup(true);
  };

  const handleClose = () => {
    setShowOrderPopup(false);
  };

  const handleConfirm = () => {
    if (!isMounted.current) {
      console.warn('组件已卸载，无法执行 handleConfirm');
      return;
    }

    const instance = chartInstanceRef.current;
    if (!instance) {
      console.error('chartInstance 未初始化');
      return;
    }

    setShowConfirmPopup(false);

    try {
      const option = instance.getOption();
      option.series[0].markPoint.data.push({
        name: '买多',
        coord: [lastDataPointIndex, option.series[0].data[lastDataPointIndex]],
        symbol: 'circle',
        symbolSize: 10,
        itemStyle: {
          color: 'red',
        },
      });
      instance.setOption(option);
    } catch (error) {
      console.error('ECharts 更新失败:', error);
    }
  };

  const handleCancel = () => {
    setShowConfirmPopup(false);
  };

  const getChartOptions = () => ({
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        data: [120, 200, 150, 80, 70, 110, 130],
        type: 'line',
        markPoint: {
          data: [],
        },
      },
    ],
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      {/* ECharts 容器 */}
      <div
        ref={chartRef}
        style={{ width: '800px', height: '400px' }}
        className="bg-white shadow-lg rounded-lg"
      ></div>

      {/* 下单浮窗 */}
      {showOrderPopup && (
        <div ref={orderPopupRef}>
          <OrderPopup
            position={popupPosition}
            onBuy={handleBuy}
            onSell={handleSell}
            onClose={handleClose}
          />
        </div>
      )}

      {/* 确认浮窗 */}
      {showConfirmPopup && (
        <div ref={confirmPopupRef}>
          <ConfirmPopup
            contract={contract}
            price={price}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        </div>
      )}
    </div>
  );
}