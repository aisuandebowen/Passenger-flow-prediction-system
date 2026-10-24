/**
 * 场景预测面板 —— 节假日/大型活动页的右栏
 *
 * 四块：
 *   ① 管控预案（加开临客/延长运营/分级限流/人员·备车保障）
 *   ② 小地图（相关站点聚焦）
 *   ③ 重点车站预测值（横向条 + 可点击联动地图）
 *   ④ 预测结论（标签化）
 *
 * 倒计时与核心指标已上移至中区顶部的 SceneKpiBar 横幅。
 * 数据：来自 scene-detail.json（经 loadData 加载，可切 API）。
 */

import { useEffect, useMemo, useState } from "react";
import PanelCard from "@/components/PanelCard";
import MetroMap from "@/modules/metro-map/MetroMap";
import { loadData } from "@/config/data-source";
import type { SceneDetail, SceneMeasure } from "./types";
import "./ScenePanel.css";

/** 措施图标（train/clock/gate/staff/bus 五类，currentColor 跟随配色） */
function MeasureIcon({ kind }: { kind: SceneMeasure["icon"] }) {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      {kind === "train" && (
        <>
          <rect x="3" y="2" width="10" height="9" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5.5 11 4 14M10.5 11 12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M5.5 5.5h5M5.5 8h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
        </>
      )}
      {kind === "clock" && (
        <>
          <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 4.6V8l2.4 1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      )}
      {kind === "gate" && (
        <>
          <path d="M3 13V7a5 5 0 0 1 10 0v6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M1.5 13h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M6.4 13v-3a1.6 1.6 0 0 1 3.2 0v3" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
        </>
      )}
      {kind === "staff" && (
        <>
          <circle cx="8" cy="4.4" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3.4 13.6c0-2.9 2-4.8 4.6-4.8s4.6 1.9 4.6 4.8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
      {kind === "bus" && (
        <>
          <rect x="2.5" y="3.5" width="11" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M2.5 8h11" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
          <circle cx="5.4" cy="13" r="1.1" fill="currentColor" />
          <circle cx="10.6" cy="13" r="1.1" fill="currentColor" />
        </>
      )}
    </svg>
  );
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
      {/* ① 管控预案 */}
      <div className="scene-panel__slot scene-panel__slot--measures">
        <PanelCard title="管控预案">
          {detail.measures && detail.measures.length > 0 ? (
            <div className="sp-measures">
              {detail.measures.map((m) => (
                <div className="sp-measure" key={m.title}>
                  <span className="sp-measure__icon">
                    <MeasureIcon kind={m.icon} />
                  </span>
                  <div className="sp-measure__body">
                    <span className="sp-measure__title">{m.title}</span>
                    <span className="sp-measure__detail">{m.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="panel-loading">暂无预案数据</div>
          )}
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

      {/* ④ 预测结论 */}
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

