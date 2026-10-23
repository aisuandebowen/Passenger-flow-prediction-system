/**
 * 线路状态页顶部 KPI 总览横幅
 *
 * 4 个指标卡横向排布，每个指标：
 *   - 标签 + 大数字（数字滚动）+ 单位
 *   - 说明文字（超载/拥挤站数、告警分布等）
 *   - 右侧 mini 趋势线（SVG，纯色折线）
 *
 * 数据：data/line-status-kpi-lines.json，经 loadData('lineStatusKpi') 读取。
 * 结构：{ network: {...}, lines: { [线路id]: {...} } }
 *   - activeLine 为 null 时展示全网指标；选中某线路时展示该线路指标。
 *   - 满载率峰值 / 超载站 / 拥挤站 从 data/line-load.json 真实推导，
 *     客流 / 准点率 / 告警 为按线路规模推导的演示数据（真实接口接入后替换）。
 *
 * 交互：由父组件（App）传入 activeLine，与地图线路筛选联动。
 */

import { useEffect, useMemo, useState } from "react";
import { loadData } from "@/config/data-source";
import { theme } from "@/config/theme";
import NumberAnimation from "@/components/NumberAnimation";
import "./LineStatusKpi.css";

interface LineMetric {
  name?: string;
  flow: number;
  load: number;
  over: number;
  crowd: number;
  punct: number;
  alarm: number;
  danger: number;
  warning: number;
  normal: number;
}

interface KpiData {
  network: LineMetric;
  lines: Record<string, LineMetric>;
}

const ACCENT_COLOR: Record<string, string> = {
  good: "#4ade80",
  warning: "#ffa800",
  danger: "#ea580c",
};

/** mini 趋势线数据（归一化，仅用于装饰，各线路共用） */
const TREND: Record<string, number[]> = {
  flow: [42, 48, 66, 88, 102, 96, 84, 78, 82, 95, 108, 124, 132, 118, 98, 86, 74, 62],
  load: [30, 38, 52, 78, 96, 110, 118, 122, 120, 135, 128, 112, 96, 80, 66, 54, 44, 36],
  punct: [99.1, 99.0, 99.1, 99.2, 99.3, 99.2, 99.1, 99.2, 99.3, 99.2, 99.1, 99.2, 99.3, 99.2, 99.2, 99.3, 99.2, 99.2],
  alarm: [12, 10, 14, 18, 22, 20, 16, 18, 20, 24, 28, 30, 32, 34, 36, 38, 39, 40],
};

export default function LineStatusKpi({ activeLine }: { activeLine: string | null }) {
  const [data, setData] = useState<KpiData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData<KpiData>("lineStatusKpi")
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  // 根据当前选中线路取指标（null=全网，否则取该线路）
  const metric = useMemo<LineMetric | null>(() => {
    if (!data) return null;
    if (activeLine && data.lines[activeLine]) return data.lines[activeLine];
    return data.network;
  }, [data, activeLine]);

  if (error || !metric) return null; // 加载失败/未就绪时不渲染，不遮挡地图

  const title = activeLine && metric.name ? metric.name : "全网运行总览";

  const items = [
    {
      key: "flow",
      label: "客流总量",
      value: metric.flow,
      unit: "万人次",
      accent: theme.accent,
      note: activeLine ? "该线客流" : "较昨日同期 +4.2%",
    },
    {
      key: "load",
      label: "满载率峰值",
      value: metric.load,
      unit: "%",
      accent: ACCENT_COLOR.warning,
      note: `超载 ${metric.over} · 拥挤 ${metric.crowd}`,
    },
    {
      key: "punct",
      label: "平均准点率",
      value: metric.punct,
      unit: "%",
      accent: ACCENT_COLOR.good,
      note: "较昨日 +0.3%",
    },
    {
      key: "alarm",
      label: "在途告警",
      value: metric.alarm,
      unit: "条",
      accent: ACCENT_COLOR.danger,
      note: `紧急 ${metric.danger} · 较重 ${metric.warning} · 一般 ${metric.normal}`,
    },
  ];

  return (
    <div className="lsk">
      <span className="lsk__scope">{title}</span>
      {items.map((m) => (
        <div className="lsk__item" key={m.key}>
          <div className="lsk__meta">
            <span className="lsk__label">{m.label}</span>
            <span className="lsk__value">
              <NumberAnimation
                value={m.value}
                options={
                  m.value % 1 === 0
                    ? undefined
                    : { minimumFractionDigits: 1, maximumFractionDigits: 1 }
                }
                style={{
                  fontSize: "1.3em",
                  fontWeight: 600,
                  color: m.accent,
                  fontVariantNumeric: "tabular-nums",
                  flex: "none", // 数字动画期间位数变化不挤压单位与趋势线
                }}
              />
              <span className="lsk__unit">{m.unit}</span>
            </span>
            <span className="lsk__note">{m.note}</span>
          </div>
          <Sparkline data={TREND[m.key]} color={m.accent} />
        </div>
      ))}
    </div>
  );
}

/** mini 趋势线：纯 SVG 折线，自动归一化到 100% 高度 */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const d = useMemo(() => {
    if (data.length < 2) return "";
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const W = 100;
    const H = 36;
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((v - min) / range) * (H - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M${pts.join(" L")}`;
  }, [data]);

  return (
    <svg className="lsk__spark" viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden="true">
      <path d={`${d} L100,36 L0,36 Z`} fill={color} opacity="0.12" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
