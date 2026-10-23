/**
 * 场景预测面板 —— 节假日/大型活动页的右栏
 *
 * 三块（全是"预测结果展示"，零决策建议）：
 *   ① 倒计时 + 峰值卡（时间锚点）
 *   ② 重点车站预测值（前 8，横向条 + 可点击联动地图）
 *   ③ 预测结论（纯客观结论，标签化）
 *
 * 数据：来自 scene-detail.json（经 loadData 加载，可切 API）。
 */

import { useEffect, useMemo, useState } from "react";
import PanelCard from "@/components/PanelCard";
import MetroMap from "@/modules/metro-map/MetroMap";
import { loadData } from "@/config/data-source";
import type { SceneDetail } from "./types";
import "./ScenePanel.css";

/** 倒计时：返回距目标日期的天数（今天=0，未来为正，过去为负） */
function daysUntil(dateStr: string, now: Date): number {
  const [m, d] = dateStr.split("-").map(Number);
  if (!m || !d) return 0;
  const target = new Date(now.getFullYear(), m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export default function ScenePanel({
  sceneId,
  onSelectStation,
}: {
  /** 场景 id（对应 scene-detail.json 的 key） */
  sceneId: string;
  /** 点击重点站 → 联动地图（高亮该站） */
  onSelectStation?: (name: string | null) => void;
}) {
  const [detail, setDetail] = useState<SceneDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStation, setActiveStation] = useState<string | null>(null);

  useEffect(() => {
    setDetail(null);
    setError(null);
    setActiveStation(null);
    loadData<Record<string, SceneDetail>>("sceneDetail")
      .then((d) => {
        const sc = d[sceneId];
        if (sc) setDetail(sc);
        else setError(`未找到场景 ${sceneId}`);
      })
      .catch((e: Error) => setError(e.message));
  }, [sceneId]);

  // 倒计时（每秒刷新，接近当天时体验更真实）
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const days = detail ? daysUntil(detail.date, now) : 0;
  // 小地图聚焦站点（memo 固定引用，避免视野被反复重置）
  const focusStations = useMemo(
    () => (detail ? detail.stations.slice(0, 5).map((s) => s.name) : undefined),
    [detail]
  );
  const maxStation = detail
    ? Math.max(...detail.stations.map((s) => s.value), 1)
    : 1;

  if (error)
    return (
      <div className="scene-panel">
        <PanelCard title="场景预测">
          <div className="panel-error">加载失败：{error}</div>
        </PanelCard>
      </div>
    );

  if (!detail)
    return (
      <div className="scene-panel">
        <PanelCard title="场景预测">
          <div className="panel-loading">加载中…</div>
        </PanelCard>
      </div>
    );

  const handleStationClick = (name: string) => {
    const next = activeStation === name ? null : name;
    setActiveStation(next);
    onSelectStation?.(next);
  };

  return (
    <div className="scene-panel">
      {/* ① 倒计时 + 峰值卡 */}
      <div className="scene-panel__slot scene-panel__slot--metrics">
        <PanelCard title="预测概览">
          <div className="sp-countdown">
            <span className="sp-countdown__label">
              {detail.type === "event" ? "距活动" : "距节日"}
            </span>
            <span className={`sp-countdown__num ${days === 0 ? "is-today" : ""}`}>
              {days === 0 ? "今天" : days > 0 ? `${days} 天` : "已过"}
            </span>
          </div>
          <div className="sp-metrics">
            <div className="sp-metric">
              <span className="sp-metric__label">预测总客流</span>
              <span className="sp-metric__value">{detail.metrics.total}</span>
            </div>
            <div className="sp-metric">
              <span className="sp-metric__label">预测峰值时段</span>
              <span className="sp-metric__value">{detail.metrics.peakTime}</span>
            </div>
            <div className="sp-metric">
              <span className="sp-metric__label">预测峰值客流</span>
              <span className="sp-metric__value sp-metric__value--peak">{detail.metrics.peak}</span>
            </div>
            <div className="sp-metric">
              <span className="sp-metric__label">同比去年同期</span>
              <span className="sp-metric__value sp-metric__value--yoy">{detail.metrics.yoy}</span>
            </div>
          </div>
        </PanelCard>
      </div>

      {/* ② 小地图（相关站点聚焦，空间辅助） */}
      <div className="scene-panel__slot scene-panel__slot--map">
        <PanelCard title="相关站点分布">
          <div className="sp-map">
            <MetroMap
              odEnabled={false}
              compact
              focusStations={focusStations}
              onSelectStation={onSelectStation}
            />
          </div>
        </PanelCard>
      </div>

      {/* ③ 重点车站预测值（前 8，可点击联动地图） */}
      <div className="scene-panel__slot scene-panel__slot--stations">
        <PanelCard title="重点车站预测值">
          <div className="sp-station-list">
            {detail.stations.slice(0, 8).map((s) => (
              <button
                key={s.name}
                className={`sp-station-item ${activeStation === s.name ? "is-active" : ""}`}
                onClick={() => handleStationClick(s.name)}>
                <span className="sp-station-item__name">{s.name}</span>
                <span className="sp-station-item__bar">
                  <span
                    className="sp-station-item__bar-fill"
                    style={{ width: `${(s.value / maxStation) * 100}%` }}
                  />
                </span>
                <span className="sp-station-item__value">{s.value}</span>
                <span className="sp-station-item__yoy">{s.yoy}</span>
              </button>
            ))}
          </div>
        </PanelCard>
      </div>

      {/* ③ 预测结论 */}
      <div className="scene-panel__slot scene-panel__slot--conclusions">
        <PanelCard title="预测结论">
          <div className="sp-conclusions">
            {detail.conclusions.map((c, i) => (
              <div className="sp-conclusion" key={i}>
                <span className="sp-conclusion__idx">{i + 1}</span>
                <span className="sp-conclusion__text">{c}</span>
              </div>
            ))}
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
