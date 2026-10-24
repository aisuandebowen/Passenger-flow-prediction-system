/**
 * 小面板 2 —— 换乘站客流压力（横向对比条形图，可切换换乘站）
 *
 * 独立模块：自带数据加载与 ECharts 配置。
 * 数据：data/transfer-pressure.json，经 loadData('transferPressure') 读取。
 *   每个换乘站 8 个压力维度（进站量/换乘量/站台密度/…），当前值 vs 早高峰峰值。
 *
 * 布局说明：面板高约 170px，此前用雷达图时 8 个轴标签外置摆放会互相/与图例重叠；
 *   宽扁面板改用「维度在左、双条横向对比」的条形图，标签占独立栏位、结构上不会重叠。
 *
 * 交互：
 *   - 标题右侧 chips 切换换乘站；
 *   - 传入 station（全局选中站）且在数据中时自动跟随切换（地图/榜单联动）。
 */

import { useEffect, useMemo, useState } from "react";
import { BarChart, type BarSeriesOption } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
  type GridComponentOption,
  type LegendComponentOption,
  type TooltipComponentOption,
} from "echarts/components";
import type { ComposeOption } from "echarts/core";
import Chart from "@/components/Chart";
import PanelCard from "@/components/PanelCard";
import { loadData } from "@/config/data-source";
import { fz } from "@/config/layout";
import { theme } from "@/config/theme";
import "./TransferPressurePanel.css";

type BarOption = ComposeOption<
  BarSeriesOption | GridComponentOption | TooltipComponentOption | LegendComponentOption
>;

interface PressureData {
  title: string;
  defaultStation: string;
  axes: string[];
  max: number;
  stations: Record<string, { current: number[]; peak: number[] }>;
}

export default function TransferPressurePanel({
  station,
}: {
  /** 全局选中站：在数据中时自动跟随切换 */
  station?: string | null;
}) {
  const [data, setData] = useState<PressureData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pressureStation, setPressureStation] = useState<string>("");

  useEffect(() => {
    loadData<PressureData>("transferPressure")
      .then((d) => {
        setData(d);
        setPressureStation(d.defaultStation);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  // 全局选中站变化：若是数据中的换乘站，自动跟随切换
  useEffect(() => {
    if (station && data?.stations[station]) setPressureStation(station);
  }, [station, data]);

  const cur = pressureStation && data?.stations[pressureStation]
    ? data.stations[pressureStation]
    : null;

  // option 必须记忆：否则外层重渲染会生成新对象，触发 Chart 重播动画。
  // 注意：useMemo 不能写在提前 return 后面，否则 hooks 顺序会变。
  const option = useMemo<BarOption | null>(() => {
    if (!data || !cur) return null;
    return {
      legend: {
        show: true,
        top: 0,
        right: 0,
        itemWidth: 9,
        itemHeight: 9,
        itemGap: 8,
        textStyle: { color: theme.subText, fontSize: fz(9.5) },
        data: ["当前", "早高峰峰值"],
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "rgba(4,20,36,0.92)",
        borderColor: theme.panelBorder,
        textStyle: { color: theme.text, fontSize: fz(12) },
      },
      grid: { containLabel: true, left: 2, right: 30, top: 20, bottom: 2 },
      xAxis: {
        type: "value",
        max: data.max,
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: "rgba(120,158,255,0.12)" } },
      },
      yAxis: {
        type: "category",
        inverse: true,
        data: data.axes,
        axisLine: { show: false },
        axisTick: { show: false },
        // interval 0：强制 8 个维度标签全显（auto 会因空间紧张隔行隐藏）
        axisLabel: { color: theme.text, fontSize: fz(9.5), interval: 0 },
      },
      series: [
        {
          name: "当前",
          type: "bar",
          barWidth: 5,
          itemStyle: { color: theme.accent, borderRadius: 1 },
          label: {
            show: true,
            position: "right",
            color: theme.text,
            fontSize: fz(8.5),
            formatter: ({ value }) => `${value}`,
          },
          data: cur.current,
        },
        {
          name: "早高峰峰值",
          type: "bar",
          barWidth: 5,
          barGap: "30%",
          itemStyle: { color: theme.primary, borderRadius: 1 },
          data: cur.peak,
        },
      ],
    };
  }, [data, cur]);

  if (error) return <PanelCard title="换乘站客流压力"><div className="panel-error">加载失败：{error}</div></PanelCard>;

  if (!data || !option || !cur)
    return <PanelCard title="换乘站客流压力"><div className="panel-loading">加载中…</div></PanelCard>;

  return (
    <PanelCard
      title={data.title}
      extra={
        <span className="trp-chips">
          {Object.keys(data.stations).map((name) => (
            <button
              key={name}
              type="button"
              className={`trp-chip${name === pressureStation ? " is-active" : ""}`}
              onClick={() => setPressureStation(name)}
              aria-pressed={name === pressureStation}>
              {name}
            </button>
          ))}
        </span>
      }>
      <Chart<BarOption> use={[BarChart, GridComponent, TooltipComponent, LegendComponent]} option={option} />
    </PanelCard>
  );
}
