'use client'
import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import * as echarts from 'echarts';
import axios from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

type ChartType = 'signal' | 'trend' | 'scope';

interface ChartState {
  data: any;
  kTime: string;
  instance?: echarts.ECharts;
}

const formatTimestampToUTC8 = (timestamp: string) => 
  dayjs.utc(timestamp, 'YYYYMMDDHHmmss').tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm');

const createApiRequest = (url: string) => 
  axios.get(url).then(r => r.data).catch(e => {
    console.error('Request error:', e);
    return null;
  });

export default function MultiChartComponent() {
  const chartRefs = useRef<Record<ChartType, HTMLDivElement>>({} as any);
  const [charts, setCharts] = useState<Record<ChartType, ChartState>>({
    signal: { data: null, kTime: '' },
    trend: { data: null, kTime: '' },
    scope: { data: null, kTime: '' }
  });
  const isUpdating = useRef(false);

  const initChart = useCallback(async (type: ChartType) => {
    const element = chartRefs.current[type];
    if (!element) return;

    // 检查元素尺寸是否为0
    if (element.clientWidth <= 0 || element.clientHeight <= 0) {
      setTimeout(() => initChart(type), 100); // 延迟重试
      return;
    }

    const initialData = await createApiRequest(`http://127.0.0.1:5000/chart_data/${type}/20250411031900`);
    if (!initialData?.xAxis?.length) return;

    const chart = echarts.init(element);
    chart.setOption({
      tooltip: {
        trigger: 'axis',
        formatter: (params: any[]) => `
          时间: ${formatTimestampToUTC8(params[0].axisValue)}<br>
          ${params[0].seriesName}: ${params[0].value}
        `
      },
      legend: { data: initialData.legend },
      xAxis: {
        type: 'category',
        data: initialData.xAxis,
        axisLabel: { formatter: formatTimestampToUTC8 }
      },
      yAxis: { type: 'value' },
      series: initialData.series.map((s: any) => ({
        ...s,
        type: 'line',
        smooth: true,
        animation: false
      }))
    });

    // 调用resize确保尺寸正确
    chart.resize();

    setCharts(prev => ({
      ...prev,
      [type]: { data: initialData, kTime: initialData.xAxis.slice(-1)[0], instance: chart }
    }));
  }, [chartRefs]);

  const updateCharts = useCallback(async () => {
    if (isUpdating.current) return;
    isUpdating.current = true;

    try {
      await Promise.all(Object.entries(charts).map(async ([type, state]) => {
        const chartType = type as ChartType;
        if (!state.instance || !state.kTime) return;

        const newData = await createApiRequest(
          `http://127.0.0.1:5000/next_data/${chartType}/${state.kTime}`
        );
        if (!newData) return;

        const option = state.instance.getOption() as any;
        const newXData = [...option.xAxis[0].data.slice(1), newData.xAxis];
        const newSeries = option.series.map((s: any, i: number) => ({
          ...s,
          data: [...s.data.slice(1), newData.series[i]]
        }));

        state.instance.setOption({
          xAxis: [{ 
            data: newXData,
            axisLabel: { formatter: formatTimestampToUTC8 }
          }],
          series: newSeries
        }, { replaceMerge: ['xAxis', 'series'] });

        setCharts(prev => ({
          ...prev,
          [chartType]: { ...prev[chartType], kTime: newData.xAxis }
        }));
      }));
    } finally {
      isUpdating.current = false;
    }
  }, [charts]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        updateCharts();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [updateCharts]);

  useLayoutEffect(() => {
    (['signal', 'trend', 'scope'] as ChartType[]).forEach(initChart);
    return () => {
      Object.values(charts).forEach(state => state.instance?.dispose());
    };
  }, []);
  
  return (
    <main className="min-h-screen flex flex-col items-center p-4 space-y-6">
      {(['signal', 'trend', 'scope'] as ChartType[]).map((type) => (
        <div
          key={type}
          className="w-full max-w-8xl h-[400px] border rounded-lg shadow-sm"
          ref={el => chartRefs.current[type] = el!}
          style={{ width: '100%', height: '400px' }} // 明确设置样式
          tabIndex={0}
          onKeyDown={(e) => e.preventDefault()}
        />
      ))}
    </main>
  );
}