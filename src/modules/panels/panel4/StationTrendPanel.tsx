/**
 * 面板 —— 站点客运量趋势（折线图：预测 vs 真实）
 *
 * 独立模块：自带数据加载与 ECharts 配置。
 * 数据：data/station-trend.json，经 loadData('stationTrend') 读取。
 *
 * 交互：由父组件传入当前选中的站点名（默认「天安门西」），
 *   点击地图站点时切换；若数据里没有该站点的数据，回退到 defaultStation。
 *
 * 修改/替换：改本文件 option 即可，不影响其他面板。
 */

import { useEffect, useMemo, useState } from "react";
import { LineChart, type LineSeriesOption } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  type GridComponentOption,
  type TooltipComponentOption,
  type LegendComponentOption,
} from "echarts/components";
import type { ComposeOption } from "echarts/core";
import Chart from "@/components/Chart";
import PanelCard from "@/components/PanelCard";
import { loadData } from "@/config/data-source";
import { fz } from "@/config/layout";
import { theme } from "@/config/theme";

type LineOption = ComposeOption<
  LineSeriesOption | GridComponentOption | TooltipComponentOption | LegendComponentOption
>;

interface StationTrendData {
  title: string;
  defaultStation: string;
  unit: string;
  xAxis: string[];
  stations: Record<string, { actual: number[]; forecast: number[] }>;
}

export default function StationTrendPanel({
  station,
}: {
  station: string | null;
}) {
  const [data, setData] = useState<StationTrendData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData<StationTrendData>("stationTrend")
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error)
    return (
      <PanelCard title="客运量趋势">
        <div className="panel-error">加载失败：{error}</div>
      </PanelCard>
    );

  // option 必须记忆：否则外层重渲染会生成新对象触发折线图重播动画。
  // 注意：useMemo 不能写在 if (!data) return 后面，否则 hooks 顺序会变。
  const option = useMemo<LineOption | null>(() => {
    if (!data) return null;
    // 点击地图切换站点：有该站数据就用它，否则回退默认站
    const key = station && data.stations[station] ? station : data.defaultStation;
    const s = data.stations[key];
    return {
      grid: { containLabel: true, top: 28, left: 6, right: 12, bottom: 4 },
      legend: {
        show: true,
        top: 0,
        right: 0,
        itemWidth: 12,
        itemHeight: 8,
        textStyle: { color: theme.subText, fontSize: fz(11) },
        data: ["预测", "真实"],
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(4,20,36,0.92)",
        borderColor: theme.panelBorder,
        textStyle: { color: theme.text, fontSize: fz(12) },
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: data.xAxis,
        axisLine: { lineStyle: { color: "rgba(120,158,255,0.28)" } },
        axisTick: { show: false },
        axisLabel: { color: theme.subText, fontSize: fz(10) },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "rgba(120,158,255,0.14)" } },
        axisLabel: { color: theme.subText, fontSize: fz(10) },
      },
      series: [
        {
          name: "预测",
          type: "line",
          smooth: true,
          symbol: "none",
          data: s.forecast,
          lineStyle: { width: 2, color: theme.accent, type: "dashed" },
          itemStyle: { color: theme.accent },
        },
        {
          name: "真实",
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 4,
          data: s.actual,
          lineStyle: { width: 2, color: theme.primary },
          itemStyle: { color: theme.primary },
          areaStyle: {
            color: {
              type: "linear",
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(48, 97, 219, 0.35)" },
                { offset: 1, color: "rgba(48, 97, 219, 0.02)" },
              ],
            },
          },
        },
      ],
    };
  }, [data, station]);

  if (!data || !option)
    return (
      <PanelCard title="客运量趋势">
        <div className="panel-loading">加载中…</div>
      </PanelCard>
    );

  const key = station && data.stations[station] ? station : data.defaultStation;
  const s = data.stations[key];

  // 预测偏差：平均绝对百分比误差（MAPE，真实计算自 forecast/actual）
  // 注意：这是普通计算（非 Hook），必须放在提前 return 之后，否则 hooks 顺序会变。
  const n = Math.min(s.forecast.length, s.actual.length);
  let mape = 0;
  if (n > 0) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      if (s.actual[i] === 0) continue;
      sum += Math.abs(s.forecast[i] - s.actual[i]) / s.actual[i];
    }
    mape = (sum / n) * 100;
  }
  const mapeColor = mape < 3 ? "#4ade80" : mape < 8 ? "#ffa800" : "#ea580c";

  return (
    <PanelCard
      title={`${key}${data.title}`}
      extra={
        <span className="st-bias" style={{ color: mapeColor }}>
          预测偏差 {mape.toFixed(1)}%
        </span>
      }>
      <Chart<LineOption>
        use={[LineChart, GridComponent, TooltipComponent, LegendComponent]}
        option={option}
      />
    </PanelCard>
  );
}
