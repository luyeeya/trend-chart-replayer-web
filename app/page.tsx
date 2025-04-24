'use client';
import axios from 'axios';
import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import StepSelector from '../lib/StepSelector';
import * as echarts from 'echarts';
import { COLORS } from '../lib/colors';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL, // 设置全局请求url前缀
});

type ChartType = 'signal' | 'trend' | 'scope';

interface ChartData {
  xAxis: string[];
  series: Record<string, number[]>;
  kTime: string;
  instance: echarts.ECharts | null;
  chartLength: number;
}

interface KTimeInfo {
  min_k_time: string;
  max_k_time: string;
}

const createApiRequest = (url: string) =>
  axiosClient.get(url).then(r => r.data).catch(e => {
    console.error('Request error:', e);
    return null;
  });

const formatTimestampToUTC8 = (timestamp: string) => dayjs.utc(timestamp, 'YYYYMMDDHHmmss').tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss');

// 增量更新逻辑
function updateData(existingData: ChartData, newData: ChartData) {
  // 更新 xAxis
  existingData.xAxis.push(...newData.xAxis);
  existingData.xAxis = existingData.xAxis.slice(-existingData.chartLength);

  // 更新每个 series 数据
  for (const key in newData.series) {
    if (existingData.series[key]) {
      existingData.series[key].push(...newData.series[key]);
      existingData.series[key] = existingData.series[key].slice(-existingData.chartLength);
    } else {
      existingData.series[key] = [...newData.series[key]];
    }
  }

  return existingData;
}

const calculateInterval = (dataLength: number, chartWidth: number) => {
  // 根据图表宽度和数据长度动态计算 interval
  const maxLabels = Math.floor(chartWidth / 200); // 设置每个标签占用 200px
  return Math.max(1, Math.floor(dataLength / maxLabels));
};

const getKTimeInfo = async () => {
  let kTimeInfo: KTimeInfo;
  // 优先从本地存储中获取kTime
  const storedKTimeInfo = localStorage.getItem('kTimeInfo');
  if (storedKTimeInfo) {
    try {
      kTimeInfo = JSON.parse(storedKTimeInfo);
      return kTimeInfo;
    } catch (error) {
      console.error('Failed to fetch kTimeInfo from LocalStorage:', error);
    }
  }

  // 否则从服务器获取kTimeInfo
  kTimeInfo = await createApiRequest(`/k_time_info`);
  if (!kTimeInfo) {
    console.error('Failed to fetch kTimeInfo from Server.');
  }
  return kTimeInfo;
}

export default function Home() {
  const [data, setData] = useState<Record<ChartType, ChartData>>({
    signal: { xAxis: [], series: {}, kTime: "20250121031000", instance: null, chartLength: 800 },
    trend: { xAxis: [], series: {}, kTime: "20250121031000", instance: null, chartLength: 1800 },
    scope: { xAxis: [], series: {}, kTime: "20250121031000", instance: null, chartLength: 6000 }
  });
  const kTimeRef = useRef<string>("");
  const chartRefs = useRef<Record<ChartType, HTMLDivElement | null>>({} as any);
  const isUpdating = useRef<boolean>(false);
  const stepRef = useRef<number>(5);

  // 回调函数，用于接收子组件的步频值
  const handleStepChange = (step: number) => {
    stepRef.current = step;
    console.log('父组件接收到的步频值:', step);
  };

  const updateChart = async (init: boolean = false) => {
    if (init) {
      let kTimeInfo = await getKTimeInfo();
      if (!kTimeInfo) {
        console.error('No kTimeInfo');
        return;
      }
      kTimeRef.current = kTimeInfo.min_k_time; // useRef 更新是同步的，useState 更新是异步的
    }

    Object.entries(data).map(async ([type, chartData]) => {
      const chartType = type as ChartType;
      const chartElement = chartRefs.current[chartType];
      if (!chartElement) return;

      const front = init;
      const size = init ? chartData.chartLength : stepRef.current;
      const newData: ChartData = await createApiRequest(`/chart_data/${chartType}/${kTimeRef.current}?front=${front}&size=${size}`);
      if (!newData || !newData.xAxis || newData.xAxis.length == 0) {
        console.error('No more data');
        return;
      }

      const newKTime = newData.xAxis[newData.xAxis.length - 1];
      kTimeRef.current = newKTime;
      // 更新到localStorage中
      // localStorage.setItem('kTimeInfo', JSON.stringify({min_k_time: newKTime})); // TODO: 需支持重置或左回放

      const curData = updateData(chartData, newData);
      const chart = init ? echarts.init(chartElement) : chartData.instance;
      chart!.setOption({
        tooltip: {
          trigger: 'axis',
          position: { right: 10, top: 10 },
          padding: [5, 10, 5, 10],
          formatter: (params: any[]) => {
            const paramClose = params.find((p) => p.seriesName === 'close');
            if (paramClose) {
              return `${formatTimestampToUTC8(params[0].axisValue)} <b>${paramClose.value}</b>`
            }
          }
        },
        xAxis: {
          type: 'category',
          data: curData.xAxis,
          axisLabel: {
            showMaxLabel: true,
            interval: calculateInterval(curData.xAxis.length, chartElement.offsetWidth),
            formatter: (value: any) => {
              const utc8Time = formatTimestampToUTC8(value);
              return `${utc8Time.slice(0, 10)}\n${utc8Time.slice(11)}`;
            }
          }
        },
        yAxis: [
          {
            id: "model",
            type: "value",
            axisLabel: {
              show: false
            },
            axisTick: {
              show: false
            },
            axisPointer: {
              show: false
            },
            splitLine: {
              show: false
            }
          },
          {
            id: "price",
            splitLine: {
              show: true,
              lineStyle: {
                color: "#EEE"
              }
            },
            axisLabel: {
              show: true
            },
            axisLine: {
              show: true,
              lineStyle: {
                width: 2
              }
            },
            axisTick: {
              show: true
            },
            type: "value",
            max: "dataMax",
            min: "dataMin",
            nameLocation: "middle",
            nameRotate: 270,
            nameGap: 30
          }
        ],
        series: Object.keys(curData.series).map((k: string) => ({
          name: k,
          data: curData.series[k],
          type: 'line',
          symbol: 'none',
          smooth: true,
          animation: false,
          yAxisIndex: ["close", "close_ma"].includes(k) ? 1 : 0,
          itemStyle: {
            color: COLORS[k].color
          }
        }))
      });

      setData(prevData => ({
        ...prevData,
        [chartType]: {
          ...curData,
          instance: chart,
        },
        instance: init ? chart : chartData.instance,
      }));
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && !isUpdating.current) {
        isUpdating.current = true;
        e.preventDefault();
        updateChart();
        setTimeout(() => isUpdating.current = false, 100); // 100ms 后允许再次调用
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [updateChart]);

  useLayoutEffect(() => {
    updateChart(true);
  }, []);


  return (
    <main className="w-full h-full flex flex-col items-center">
      {(['signal', 'trend', 'scope'] as ChartType[]).map((type) => (
        <div
          key={type}
          className="w-full h-[50vh]"
          ref={(el) => { chartRefs.current[type] = el }}
          onKeyDown={(e) => e.preventDefault()}
        />
      ))}
      {/* 悬浮在右上角的参数修改浮窗 */}
      <div className="absolute top-0 left-0 p-4">
        <div className="flex flex-col items-start">
          <label className='text-sm text-red-500 whitespace-nowrap'>短按[右键]回放波形图</label>
          <label className='text-sm text-gray-500 whitespace-nowrap'>品种: v</label>
          <StepSelector initialStep={stepRef.current} onStepChange={handleStepChange} />
        </div>
      </div>
    </main>
  );
}