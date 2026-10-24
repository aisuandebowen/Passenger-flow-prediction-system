/**
 * 车站管理页顶部 KPI 横幅 —— 车站运行总览
 *
 * 5 张指标卡横向排布（悬漂于地图上方，与线路状态页的 LineStatusKpi 同款布局）：
 *   车站总数 / 实时进站量 / 拥挤车站 / 限流车站 / 设备在线率
 *
 * 数据：data/station-kpi.json，经 loadData('stationKpi') 读取。
 *   - activeLine 为 null 时展示全网指标；地图线路筛选选中某线路时切换为该线路口径。
 *   - lines 里没有的线路自动回退全网。
 *
 * 交互：由父组件（App）传入 activeLine，与地图线路筛选联动。
 */

import { useEffect, useMemo, useState } from "react";
import { loadData } from "@/config/data-source";
import { theme } from "@/config/theme";
import NumberAnimation from "@/components/NumberAnimation";
import "./StationKpi.css";

/** 全网与单线路同构的指标对象（后端接口只需返回同一结构） */
interface StationMetric {
  name?: string;
  stations: number;
  transferStations: number;
  inflow: number;
  inflowUnit: string;
  inflowDelta: number;
  crowdTotal: number;
  crowdSevere: number;
  crowded: number;
  limitTotal: number;
  limitLevelA: number;
  limitLevelB: number;
  deviceOnlineRate: number;
  gateOnline: number;
  escalatorFaults: number;
}

interface StationKpiData {
  title: string;
  network: StationMetric;
  lines: Record<string, StationMetric>;
}

const LEVEL_COLOR = {
  good: "#4ade80",
  warning: "#ffa800",
  danger: "#ea580c",
  gold: "#ffd166",
} as const;

export default function StationKpi({ activeLine }: { activeLine: string | null }) {
  const [data, setData] = useState<StationKpiData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData<StationKpiData>("stationKpi")
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  // 根据当前选中线路取指标（null=全网；lines 里没有该线路时回退全网）
  const metric = useMemo<StationMetric | null>(() => {
    if (!data) return null;
    if (activeLine && data.lines[activeLine]) return data.lines[activeLine];
    return data.network;
  }, [data, activeLine]);

  if (error || !metric) return null; // 加载失败/未就绪时不渲染，不遮挡地图

  const title = activeLine && metric.name ? metric.name : "全网车站";

  const items = [
    {
      key: "stations",
      label: "车站总数",
      value: metric.stations,
      unit: "座",
      accent: theme.accent,
      note: `换乘站 ${metric.transferStations}`,
    },
    {
      key: "inflow",
      label: "实时进站量",
      value: metric.inflow,
      unit: metric.inflowUnit,
      accent: theme.accent,
      note: `较昨日 +${metric.inflowDelta}%`,
      noteColor: LEVEL_COLOR.good,
    },
    {
      key: "crowd",
      label: "拥挤车站",
      value: metric.crowdTotal,
      unit: "座",
      accent: LEVEL_COLOR.warning,
      note: `严重拥挤 ${metric.crowdSevere} · 拥挤 ${metric.crowded}`,
      noteColor: LEVEL_COLOR.danger,
    },
    {
      key: "limit",
      label: "限流车站",
      value: metric.limitTotal,
      unit: "座",
      accent: LEVEL_COLOR.gold,
      note: `A级 ${metric.limitLevelA} · B级 ${metric.limitLevelB}`,
    },
    {
      key: "device",
      label: "设备在线率",
      value: metric.deviceOnlineRate,
      unit: "%",
      accent: LEVEL_COLOR.good,
      note: `闸机 ${metric.gateOnline} 台 · 扶梯故障 ${metric.escalatorFaults}`,
    },
  ];

  return (
    <div className="sk" role="status" aria-label={`${title}运行总览`}>
      <span className="sk__scope">{title}</span>
      {items.map((m) => (
        <div className="sk__item" key={m.key}>
          <div className="sk__meta">
            <span className="sk__label">{m.label}</span>
            <span className="sk__value">
              <NumberAnimation
                value={m.value}
                options={
                  m.value % 1 === 0
                    ? undefined
                    : { minimumFractionDigits: 1, maximumFractionDigits: 1 }
                }
                style={{
                  fontSize: "1.24em",
                  fontWeight: 600,
                  color: m.accent,
                  fontVariantNumeric: "tabular-nums",
                  flex: "none",
                }}
              />
              <span className="sk__unit">{m.unit}</span>
            </span>
            <span className="sk__note" style={m.noteColor ? { color: m.noteColor } : undefined}>
              {m.note}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
