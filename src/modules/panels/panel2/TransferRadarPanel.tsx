/**
 * 小面板 2 —— 换乘站客流压力（雷达图）
 *
 * 独立模块：自带数据加载与 ECharts 配置。
 * 数据：data/panel2-transfer-radar.json，经 loadData('panel2') 读取。
 * 修改/替换：改本文件的 option 即可，不影响其他面板。
 */

import { useEffect, useMemo, useState } from "react";
import { RadarChart, type RadarSeriesOption } from "echarts/charts";
import { LegendComponent, TooltipComponent, type LegendComponentOption, type TooltipComponentOption } from "echarts/components";
import type { ComposeOption } from "echarts/core";
import Chart from "@/components/Chart";
import PanelCard from "@/components/PanelCard";
import { loadData } from "@/config/data-source";
import { fz } from "@/config/layout";
import { theme } from "@/config/theme";

type RadarOption = ComposeOption<
  RadarSeriesOption | TooltipComponentOption | LegendComponentOption
>;

interface Panel2Data {
  title: string;
  indicators: { name: string; max: number }[];
  current: number[];
  peak: number[];
}

export default function TransferRadarPanel() {
  const [data, setData] = useState<Panel2Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData<Panel2Data>("panel2")
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <PanelCard title="换乘站客流压力"><div className="panel-error">加载失败：{error}</div></PanelCard>;

  // option 必须记忆：否则外层重渲染会生成新对象，触发 Chart 重播雷达图动画。
  // 注意：useMemo 不能写在 if (!data) return 后面，否则 hooks 顺序会变。
  const option = useMemo<RadarOption | null>(() => {
    if (!data) return null;
    return {
    legend: {
      show: true,
      bottom: 2,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: theme.subText, fontSize: fz(11) },
      data: ["当前", "早高峰峰值"],
    },
    tooltip: {
      backgroundColor: "rgba(4,20,36,0.92)",
      borderColor: theme.panelBorder,
      textStyle: { color: theme.text, fontSize: fz(12) },
    },
    radar: {
      center: ["50%", "48%"],
      radius: "62%",
      axisName: { color: theme.text, fontSize: fz(11) },
      axisLine: { lineStyle: { color: "rgba(120,158,255,0.28)" } },
      splitLine: { lineStyle: { color: "rgba(120,158,255,0.22)" } },
      splitArea: { show: false },
      indicator: data.indicators,
    },
    series: [
      {
        type: "radar",
        data: [
          {
            name: "当前",
            value: data.current,
            symbolSize: 5,
            lineStyle: { width: 1.5, color: theme.accent },
            itemStyle: { color: theme.accent },
            areaStyle: { color: theme.accent, opacity: 0.28 },
          },
          {
            name: "早高峰峰值",
            value: data.peak,
            symbol: "circle",
            symbolSize: 4,
            lineStyle: { width: 1.5, color: theme.primary },
            itemStyle: { color: theme.primary },
            areaStyle: { color: theme.primary, opacity: 0.14 },
          },
        ],
      },
    ],
    };
  }, [data]);

  if (!data || !option) return <PanelCard title="换乘站客流压力"><div className="panel-loading">加载中…</div></PanelCard>;

  return (
    <PanelCard title={data.title} extra={<span>压力指数</span>}>
      <Chart<RadarOption>
        use={[RadarChart, TooltipComponent, LegendComponent]}
        option={option}
      />
    </PanelCard>
  );
}
