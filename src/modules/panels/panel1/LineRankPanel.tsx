/**
 * 小面板 1 —— 线路客运量排行（横向条形图）
 *
 * 独立模块：自带数据加载、ECharts 配置、错误处理。
 * 数据：data/panel1-line-rank.json，经 data-source.ts 的 loadData('panel1') 读取。
 * 颜色：全部取自 theme.ts。
 *
 * 修改/替换：改本文件的 option 即可换成任意图表，不影响其他面板。
 */

import { useEffect, useMemo, useState } from "react";
import { BarChart, type BarSeriesOption } from "echarts/charts";
import { GridComponent, type GridComponentOption } from "echarts/components";
import { TooltipComponent, type TooltipComponentOption } from "echarts/components";
import type { ComposeOption } from "echarts/core";
import Chart from "@/components/Chart";
import PanelCard from "@/components/PanelCard";
import { loadData } from "@/config/data-source";
import { fz } from "@/config/layout";
import { theme } from "@/config/theme";
import NumberAnimation from "@/components/NumberAnimation";

type BarOption = ComposeOption<
  BarSeriesOption | GridComponentOption | TooltipComponentOption
>;

interface Panel1Data {
  title: string;
  unit: string;
  data: { name: string; value: number; change?: number }[];
}

export default function LineRankPanel() {
  const [data, setData] = useState<Panel1Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData<Panel1Data>("panel1")
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <PanelCard title="线路客运量排行"><div className="panel-error">加载失败：{error}</div></PanelCard>;

  // option 必须记忆：否则外层（如侧边栏点击）引起的重渲染会生成新对象，
  // 触发 Chart 重新 setOption，条形图就又播一遍动画。
  // 注意：useMemo 不能写在 if (!data) return 后面，否则 hooks 顺序会变。
  const option = useMemo<BarOption | null>(() => {
    if (!data) return null;
    const total = data.data.reduce((s, d) => s + d.value, 0);
    return {
    grid: { containLabel: true, top: 8, left: 0, right: 58, bottom: 4 },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(4,20,36,0.92)",
      borderColor: theme.panelBorder,
      textStyle: { color: theme.text, fontSize: fz(12) },
      formatter: (params: unknown) => {
        const p = (params as Array<{ name: string; value: number; dataIndex: number }>)[0];
        const row = data.data[p.dataIndex];
        const ch = row.change != null ? `　同比 ${row.change > 0 ? "+" : ""}${row.change}%` : "";
        return `${p.name}：${p.value} ${data.unit}${ch}`;
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
      data: data.data.map((d) => d.name),
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
          fontSize: fz(11),
          formatter: (p: unknown) => {
            const idx = (p as { dataIndex: number }).dataIndex;
            const row = data.data[idx];
            const ch = row.change;
            if (ch == null) return `{v|${row.value}}`;
            const color = ch > 0 ? "#4ade80" : ch < 0 ? "#ea580c" : theme.subText;
            return `{v|${row.value}}  {c|${ch > 0 ? "▲" : ch < 0 ? "▼" : ""}${Math.abs(ch)}%}`;
          },
          rich: {
            v: { color: theme.accent, fontWeight: 600 },
            c: { color: theme.subText, fontSize: fz(9) },
          },
        },
        data: data.data.map((d) => d.value),
      },
    ],
    };
  }, [data]);

  if (!data || !option) return <PanelCard title="线路客运量排行"><div className="panel-loading">加载中…</div></PanelCard>;

  const total = data.data.reduce((s, d) => s + d.value, 0);

  return (
    <PanelCard
      title={data.title}
      extra={
        <span>
          今日累计&nbsp;
          <NumberAnimation
            value={total}
            style={{
              display: "inline-block",
              fontSize: fz(18),
              fontWeight: 600,
              color: theme.primary,
            }}
          />
          &nbsp;{data.unit}
        </span>
      }>
      <Chart<BarOption> use={[BarChart, GridComponent, TooltipComponent]} option={option} />
    </PanelCard>
  );
}
