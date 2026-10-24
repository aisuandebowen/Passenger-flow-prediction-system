/**
 * 场景 KPI 横幅 —— 节假日/活动页中区顶部指标带
 *
 * 左侧范围卡：场景名 + 倒计时（大屏时间锚点，从右栏"预测概览"上移至此）；
 * 右侧 5 张指标卡：预测总客流 / 峰值时段 / 峰值客流 / 同比 / 影响线路·限流站。
 * 样式与线网管理页的 LineStatusKpi / StationKpi 同族。
 *
 * 数据：scene-detail.json（metrics + kpi 字段，经 ScenePage 传入）。
 */

import { useEffect, useState } from "react";
import type { SceneDetail } from "./types";
import "./SceneKpiBar.css";

/** 倒计时：距目标日期的天数（今天=0，未来为正，过去为负） */
function daysUntil(dateStr: string, now: Date): number {
  const [m, d] = dateStr.split("-").map(Number);
  if (!m || !d) return 0;
  const target = new Date(now.getFullYear(), m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export default function SceneKpiBar({ detail }: { detail: SceneDetail }) {
  // 倒计时（按分钟刷新即可，精度为天）
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const days = daysUntil(detail.date, now);
  const sceneName = detail.title.replace(/客流预测$/, "");
  const scopeLabel = detail.type === "event" ? "距活动" : "距节日";

  const items = [
    { key: "total", label: "预测总客流", value: detail.metrics.total },
    { key: "peakTime", label: "预测峰值时段", value: detail.metrics.peakTime },
    { key: "peak", label: "预测峰值客流", value: detail.metrics.peak, accent: "#ffd166" },
    { key: "yoy", label: "同比去年同期", value: detail.metrics.yoy, accent: "#ea580c" },
    {
      key: "scope",
      label: "预计影响线路",
      value: detail.kpi ? `${detail.kpi.lines} 条` : "—",
      note: detail.kpi ? `建议限流 ${detail.kpi.limitStations} 站` : undefined,
      accent: "#4ade80",
    },
  ];

  return (
    <div className="sck" role="status" aria-label={`${sceneName}预测总览`}>
      <span className="sck__scope">
        <span className="sck__scope-name">{sceneName}</span>
        <span className={`sck__scope-days ${days === 0 ? "is-today" : ""}`}>
          {days === 0 ? "就在今天" : days > 0 ? `${scopeLabel} ${days} 天` : "已结束"}
        </span>
      </span>
      {items.map((m) => (
        <div className="sck__item" key={m.key}>
          <div className="sck__meta">
            <span className="sck__label">{m.label}</span>
            <span className="sck__value" style={m.accent ? { color: m.accent } : undefined}>
              {m.value}
            </span>
            {m.note && <span className="sck__note">{m.note}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
