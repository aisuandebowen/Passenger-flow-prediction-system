/**
 * 面板 —— 拥挤 · 限流车站处置榜（车站管理页）
 *
 * 数据：data/station-alerts.json，经 loadData('stationAlerts') 读取。
 * 每行：状态图标 + 站名 + 途经线路色点 + 满载率进度条 + 状态文字 + 处置措施。
 *
 * 交互：点击行回调 onSelectStation —— 与地图选中、车站详情、雷达联动；
 * 当前选中站高亮标记（aria-current）。
 */

import { useEffect, useState } from "react";
import PanelCard from "@/components/PanelCard";
import { loadData } from "@/config/data-source";
import "./StationAlertsPanel.css";

interface StationLineInfo {
  id: string;
  name: string;
  color: string;
}

interface AlertItem {
  station: string;
  lines: StationLineInfo[];
  /** 站台满载率（%） */
  load: number;
  /** 级别：severe 严重拥挤 / crowded 拥挤 / limit 限流中 */
  level: "severe" | "crowded" | "limit";
  /** 状态文字（数据下发，直接展示） */
  status: string;
  /** 处置措施 */
  action: string;
}

interface AlertsData {
  title: string;
  updated: string;
  list: AlertItem[];
}

/** 级别配色：颜色 + 图标 + 文字三重编码 */
const LEVEL: Record<AlertItem["level"], { color: string; icon: "danger" | "warn" | "limit" }> = {
  severe: { color: "#ea580c", icon: "danger" },
  crowded: { color: "#ffa800", icon: "warn" },
  limit: { color: "#ffd166", icon: "limit" },
};

function LevelIcon({ kind }: { kind: "danger" | "warn" | "limit" }) {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
      {kind === "danger" && (
        <>
          <path d="M8 1.8 14.6 13.6H1.4Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M8 6.2v3.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="8" cy="11.5" r="0.95" fill="currentColor" />
        </>
      )}
      {kind === "warn" && (
        <>
          <circle cx="8" cy="8" r="6.3" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8 7v3.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="8" cy="4.8" r="0.95" fill="currentColor" />
        </>
      )}
      {kind === "limit" && (
        <>
          <path d="M8 1.6 13.4 3.4v4.2c0 3.2-2.2 5.5-5.4 6.8-3.2-1.3-5.4-3.6-5.4-6.8V3.4Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M5.6 8 7.3 9.7 10.6 6.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

/** 满载率进度条宽度：140% 封顶 */
const LOAD_CEIL = 140;

export default function StationAlertsPanel({
  station,
  onSelectStation,
}: {
  /** 当前选中站名（用于行高亮联动） */
  station?: string | null;
  /** 点击行回调（切换全局选中站） */
  onSelectStation?: (name: string | null) => void;
}) {
  const [data, setData] = useState<AlertsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData<AlertsData>("stationAlerts")
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error)
    return (
      <PanelCard title="拥挤 · 限流车站">
        <div className="panel-error">加载失败：{error}</div>
      </PanelCard>
    );

  if (!data)
    return (
      <PanelCard title="拥挤 · 限流车站">
        <div className="panel-loading">加载中…</div>
      </PanelCard>
    );

  // 空态：给出明确说明，不留死胡同
  if (data.list.length === 0)
    return (
      <PanelCard title={data.title}>
        <div className="sal-empty">
          <LevelIcon kind="limit" />
          当前全网无拥挤 / 限流车站
        </div>
      </PanelCard>
    );

  return (
    <PanelCard title={data.title} extra={<span>更新 {data.updated}</span>}>
      <div className="sal-list">
        {data.list.map((it) => {
          const lv = LEVEL[it.level];
          const selected = it.station === station;
          const Row = onSelectStation ? "button" : "div";
          return (
            <Row
              key={it.station}
              {...(onSelectStation
                ? { type: "button" as const, onClick: () => onSelectStation(it.station), "aria-current": selected }
                : {})}
              className={`sal-row${selected ? " is-selected" : ""}`}>
              <span className="sal-line1">
                <span className="sal-ico" style={{ color: lv.color }}>
                  <LevelIcon kind={lv.icon} />
                </span>
                <span className="sal-name" title={it.station}>
                  {it.station}
                </span>
                {it.lines.map((l) => (
                  <span key={l.id} className="sal-lb" title={l.name}>
                    <i style={{ background: l.color }} />
                    {l.name}
                  </span>
                ))}
                <span className="sal-status" style={{ color: lv.color }}>
                  {it.status}
                </span>
              </span>
              <span className="sal-line2">
                <span className="sal-bar">
                  <span style={{ width: `${(Math.min(it.load, LOAD_CEIL) / LOAD_CEIL) * 100}%`, background: lv.color }} />
                </span>
                <b style={{ color: lv.color }}>{it.load}%</b>
                <span className="sal-action" title={it.action}>
                  {it.action}
                </span>
              </span>
            </Row>
          );
        })}
      </div>
    </PanelCard>
  );
}
