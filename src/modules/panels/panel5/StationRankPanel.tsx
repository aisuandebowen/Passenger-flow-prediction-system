/**
 * 面板 —— 车站客运量排行（横向条形图，前 8）
 *
 * 独立模块：自带数据加载与 ECharts 配置。
 * 数据：data/station-rank.json，经 loadData('stationRank') 读取。
 * 交互：右上角可切换时间段（1h 为一段），切换后条形图重新渲染。
 *
 * 修改/替换：改本文件 option 即可，不影响其他面板。
 */

import { useEffect, useMemo, useState } from "react";
import { BarChart, type BarSeriesOption } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  type GridComponentOption,
  type TooltipComponentOption,
} from "echarts/components";
import type { ComposeOption } from "echarts/core";
import Chart from "@/components/Chart";
import PanelCard from "@/components/PanelCard";
import { loadData } from "@/config/data-source";
import { fz } from "@/config/layout";
import { theme } from "@/config/theme";
import "./StationRankPanel.css";

type BarOption = ComposeOption<BarSeriesOption | GridComponentOption | TooltipComponentOption>;

interface RankPeriod {
  id: string;
  label: string;
  data: { name: string; value: number }[];
}

interface StationRankData {
  title: string;
  unit: string;
  periods: RankPeriod[];
}

export default function StationRankPanel() {
  const [data, setData] = useState<StationRankData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [periodId, setPeriodId] = useState<string>("");

  useEffect(() => {
    loadData<StationRankData>("stationRank")
      .then((d) => {
        setData(d);
        // 默认选中第一个时间段
        if (d.periods.length > 0) setPeriodId(d.periods[0].id);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const period = useMemo(
    () => data?.periods.find((p) => p.id === periodId) ?? data?.periods[0] ?? null,
    [data, periodId]
  );

  // option 必须记忆：否则外层重渲染会生成新对象触发条形图重播动画。
  const option = useMemo<BarOption | null>(() => {
    if (!period) return null;
    return {
      grid: { containLabel: true, top: 8, left: 0, right: 44, bottom: 4 },
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(4,20,36,0.92)",
        borderColor: theme.panelBorder,
        textStyle: { color: theme.text, fontSize: fz(12) },
        formatter: (params: unknown) => {
          const p = (params as Array<{ name: string; value: number }>)[0];
          return `${p.name}：${p.value} 人次`;
        },
      },
      xAxis: {
        type: "value",
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
      },
      yAxis: {
        type: "category",
        inverse: true,
        data: period.data.map((d) => d.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: theme.text, fontSize: fz(11) },
      },
      series: [
        {
          type: "bar",
          barWidth: 9,
          showBackground: true,
          backgroundStyle: { color: "rgba(48, 97, 219, 0.14)" },
          itemStyle: {
            borderRadius: 4,
            color: {
              type: "linear",
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: "rgba(48, 97, 219, 0.15)" },
                { offset: 1, color: theme.primary },
              ],
            },
          },
          label: {
            show: true,
            position: "right",
            color: theme.accent,
            fontSize: fz(11),
            formatter: "{c}",
          },
          data: period.data.map((d) => d.value),
        },
      ],
    };
  }, [period]);

  if (error)
    return (
      <PanelCard title="车站客运量排行">
        <div className="panel-error">加载失败：{error}</div>
      </PanelCard>
    );

  if (!data || !option)
    return (
      <PanelCard title="车站客运量排行">
        <div className="panel-loading">加载中…</div>
      </PanelCard>
    );

  return (
    <PanelCard
      title={data.title}
      extra={
        <div className="sr-period-switch">
          {data.periods.map((p) => (
            <button
              key={p.id}
              className={`sr-period-chip${p.id === periodId ? " is-active" : ""}`}
              onClick={() => setPeriodId(p.id)}
              title={p.label}>
              {p.label.split("-")[0]}
            </button>
          ))}
        </div>
      }>
      <Chart<BarOption>
        use={[BarChart, GridComponent, TooltipComponent]}
        option={option}
      />
    </PanelCard>
  );
}
