/**
 * 线路压力预测 —— 场景页中区底部右卡（横向条形排行）
 *
 * 节假日/活动期间各线路预计满载率排行（按数据下发顺序，通常已按满载率降序）：
 * 线路色点 + 满载率进度条（>100 红 / ≥90 黄 / 其余绿）+ 较平日增量。
 *
 * 数据：scene-detail.json 的 lines 字段（经 ScenePage 传入，可切 API）。
 */

import PanelCard from "@/components/PanelCard";
import type { SceneLinePressureItem } from "./types";
import "./SceneLinePressure.css";

/** 满载率进度条封顶值（%） */
const LOAD_CEIL = 140;

/** 满载率分级配色（与全站口径一致：90 拥挤 / 100 超载） */
function loadColor(load: number): string {
  if (load > 100) return "#f87171";
  if (load >= 90) return "#ffd166";
  return "#4ade80";
}

export default function SceneLinePressure({ lines }: { lines: SceneLinePressureItem[] }) {
  const max = Math.max(...lines.map((l) => l.load), 1);

  return (
    <PanelCard title="线路压力预测" extra="预计满载率">
      <div className="slp-list">
        {lines.map((l) => {
          const color = loadColor(l.load);
          return (
            <div className="slp-row" key={l.id}>
              <span className="slp-name">
                <i style={{ background: l.color }} />
                {l.name}
              </span>
              <span className="slp-bar">
                <span
                  style={{
                    width: `${(Math.min(l.load, LOAD_CEIL) / LOAD_CEIL) * 100}%`,
                    background: `linear-gradient(90deg, ${color}55, ${color})`,
                  }}
                />
                {/* 100% 饱和参考线 */}
                <i className="slp-mark" style={{ left: `${(100 / LOAD_CEIL) * 100}%` }} />
              </span>
              <b style={{ color }}>{l.load}%</b>
              <span className="slp-delta">{l.delta}</span>
            </div>
          );
        })}
      </div>
      <div className="slp-foot">
        <span>较平日增量</span>
        <span className="slp-foot__line">
          <i style={{ background: "#f87171" }} />&gt;100 超载
        </span>
        <span className="slp-foot__line">
          <i style={{ background: "#ffd166" }} />≥90 拥挤
        </span>
      </div>
    </PanelCard>
  );
}
