/**
 * 逐日客流预测 —— 场景页中区底部左卡（柱状图）
 *
 * 节假日：假期逐日（五一 5 天）；大型活动：演出前/当天/次日。
 * 全期峰值日用金色高亮并在柱顶标注数值。
 *
 * 数据：scene-detail.json 的 days 字段（经 ScenePage 传入，可切 API）。
 */

import { useMemo } from "react";
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
import { fz } from "@/config/layout";
import { theme } from "@/config/theme";
import type { SceneDay } from "./types";

type BarOption = ComposeOption<BarSeriesOption | GridComponentOption | TooltipComponentOption>;

export default function SceneDailyChart({ days }: { days: SceneDay[] }) {
  const peakDay = useMemo(() => days.find((d) => d.peak), [days]);

  const option = useMemo<BarOption>(
    () => ({
      grid: { containLabel: true, left: 4, right: 8, top: 24, bottom: 2 },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "rgba(4,20,36,0.94)",
        borderColor: theme.panelBorder,
        textStyle: { color: theme.text, fontSize: fz(12) },
        valueFormatter: (v: unknown) => `${v} 万人次`,
      },
      xAxis: {
        type: "category",
        data: days.map((d) => `${d.date}\n${d.label}`),
        axisLine: { lineStyle: { color: "rgba(120,158,255,0.28)" } },
        axisTick: { show: false },
        axisLabel: { color: theme.text, fontSize: fz(10), lineHeight: 13, interval: 0 },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: theme.subText, fontSize: fz(9) },
        splitLine: { lineStyle: { color: "rgba(120,158,255,0.12)" } },
      },
      series: [
        {
          type: "bar",
          barWidth: 18,
          itemStyle: {
            borderRadius: [3, 3, 0, 0],
            color: (p: { dataIndex: number }) =>
              days[p.dataIndex]?.peak ? theme.transferStation : theme.primary,
          },
          label: {
            show: true,
            position: "top",
            color: theme.text,
            fontSize: fz(9.5),
            fontVariantNumeric: "tabular-nums",
            formatter: ({ value }) => `${value}`,
          },
          data: days.map((d) => d.total),
        },
      ],
    }),
    [days]
  );

  return (
    <PanelCard title="逐日客流预测" extra={peakDay ? `峰值日 ${peakDay.date}` : "单位：万人次"}>
      <Chart<BarOption> use={[BarChart, GridComponent, TooltipComponent]} option={option} />
    </PanelCard>
  );
}
