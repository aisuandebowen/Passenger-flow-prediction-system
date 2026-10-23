/**
 * 分时客流预测曲线 —— 场景页中区（时间轴下方）的核心图表
 *
 * 展示"那一天"24 小时的分时客流预测，两条序列：
 *   - 预测客流（金色实线 + 面积渐变）
 *   - 去年同期（蓝色虚线，用于对比）
 *
 * 与上方时间轴联动：点击时间轴节点 → 传入 highlightHour，
 *   在曲线对应时刻打一条竖向参考线，直观对应"这个节点是几点、峰值多高"。
 *
 * 数据：scene-detail.json 的 hourly 字段（经父组件传入，已由 ScenePage 加载）。
 */

import { useMemo } from "react";
import { LineChart, type LineSeriesOption } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkPointComponent,
  MarkLineComponent,
  type GridComponentOption,
  type TooltipComponentOption,
  type LegendComponentOption,
} from "echarts/components";
import type { ComposeOption } from "echarts/core";
import Chart from "@/components/Chart";
import { fz } from "@/config/layout";
import { theme } from "@/config/theme";
import type { SceneHourly } from "./types";

type LineOption = ComposeOption<
  LineSeriesOption | GridComponentOption | TooltipComponentOption | LegendComponentOption
>;

export default function SceneHourlyChart({
  hourly,
  highlightHour,
  unit = "人次",
}: {
  hourly: SceneHourly;
  /** 高亮的小时（0-23），来自时间轴节点；null = 不高亮 */
  highlightHour?: number | null;
  /** 数值单位 */
  unit?: string;
}) {
  const option = useMemo<LineOption>(() => {
    // 预测峰值索引（用于 markPoint 标记）
    let peakIdx = 0;
    hourly.forecast.forEach((v, i) => {
      if (v > hourly.forecast[peakIdx]) peakIdx = i;
    });
    const peakLabel = hourly.xAxis[peakIdx];
    const peakVal = hourly.forecast[peakIdx];

    return {
      grid: { containLabel: true, top: 56, left: 8, right: 30, bottom: 4 },
      legend: {
        show: true,
        top: 0,
        right: 0,
        itemWidth: 14,
        itemHeight: 8,
        textStyle: { color: theme.subText, fontSize: fz(11) },
        data: ["预测客流", "去年同期"],
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(4,20,36,0.94)",
        borderColor: theme.panelBorder,
        textStyle: { color: theme.text, fontSize: fz(12) },
        valueFormatter: (v: unknown) => `${v} ${unit}`,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: hourly.xAxis,
        axisLine: { lineStyle: { color: "rgba(120,158,255,0.28)" } },
        axisTick: { show: false },
        axisLabel: { color: theme.subText, fontSize: fz(10), interval: 2 },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "rgba(120,158,255,0.14)" } },
        axisLabel: { color: theme.subText, fontSize: fz(10) },
      },
      series: [
        {
          name: "预测客流",
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 3,
          data: hourly.forecast,
          lineStyle: { width: 2.5, color: theme.transferStation },
          itemStyle: { color: theme.transferStation },
          areaStyle: {
            color: {
              type: "linear",
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(255, 209, 102, 0.32)" },
                { offset: 1, color: "rgba(255, 209, 102, 0.02)" },
              ],
            },
          },
          markPoint: {
            symbol: "circle",
            symbolSize: 9,
            itemStyle: {
              color: theme.transferStation,
              borderColor: "rgba(2, 6, 23, 0.9)",
              borderWidth: 2,
              shadowColor: "rgba(255, 209, 102, 0.9)",
              shadowBlur: 10,
            },
            label: {
              show: true,
              position: "top",
              distance: 8,
              color: theme.transferStation,
              fontSize: fz(11),
              fontWeight: "bold",
              formatter: `峰值 ${peakVal}`,
            },
            data: [{ coord: [peakLabel, peakVal], name: "预测峰值" }],
          },
        },
        {
          name: "去年同期",
          type: "line",
          smooth: true,
          symbol: "none",
          data: hourly.lastYear,
          lineStyle: { width: 2, color: theme.accent, type: "dashed" },
          itemStyle: { color: theme.accent },
        },
      ],
    };
  }, [hourly, unit]);

  // 联动：时间轴选中节点 → 打一条竖向参考线
  const linked = useMemo<LineOption>(() => {
    if (highlightHour == null || highlightHour < 0 || highlightHour > 23) {
      return option;
    }
    const h = hourly.xAxis[highlightHour];
    const fv = hourly.forecast[highlightHour];
    const lyv = hourly.lastYear[highlightHour];
    const series = option.series as LineSeriesOption[];
    return {
      ...option,
      series: series.map((s) => {
        const name = s.name;
        const val = name === "预测客流" ? fv : name === "去年同期" ? lyv : fv;
        return {
          ...s,
          markLine: {
            silent: true,
            symbol: "none",
            lineStyle: { color: theme.titleText, width: 1, type: "dashed" },
            label: {
              color: theme.titleText,
              fontSize: fz(11),
              formatter: `${h}`,
              position: "insideEndTop",
            },
            data: [{ xAxis: h }],
          },
          markPoint: s.markPoint,
        };
      }),
    };
  }, [option, highlightHour, hourly]);

  return (
    <Chart<LineOption>
      use={[LineChart, GridComponent, TooltipComponent, LegendComponent, MarkPointComponent, MarkLineComponent]}
      option={linked}
    />
  );
}
