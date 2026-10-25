/**
 * ④ 周边站分时压力热力（站 × 时段矩阵）
 *
 * 每行一个周边站、每列一个时段（半小时粒度），格子按预测满载率四级配色：
 *   ≥120 严重（橙红发光）/ 100–119 超载（红）/ 80–99 接近（金黄）/ <80 宽松（暗绿）
 * 超载格直接标注数值；入场爬升与散场尖峰呈对角线分布，一眼锁定越限时段。
 *
 * 数据：event-plan.json 的 heat 字段（经 EventPage 传入）。
 */

import PanelCard from "@/components/PanelCard";
import type { EventHeatData } from "./types";

const SEVERE = "#ea580c";
const OVER = "#f87171";
const NEAR = "#ffd166";

function cell(v: number) {
  let cls = "";
  let bg = "";
  if (v >= 120) {
    cls = "is-hi";
    bg = SEVERE;
  } else if (v >= 100) {
    cls = "is-over";
    bg = OVER;
  } else if (v >= 80) {
    cls = "is-near";
    bg = NEAR;
  }
  return { cls, bg, show: v >= 80 ? String(v) : "" };
}

export default function EventHeat({ heat }: { heat: EventHeatData }) {
  // 空态
  if (!heat.stations.length || !heat.xAxis.length)
    return (
      <PanelCard title="周边站分时压力热力">
        <div className="panel-loading">暂无热力数据</div>
      </PanelCard>
    );

  return (
    <PanelCard title="周边站分时压力热力" extra="预测满载率 % · 每 30 分钟">
      <div
        className="ev-heat"
        role="img"
        aria-label="周边站分时满载率热力矩阵"
        style={{ gridTemplateColumns: `4.4em repeat(${heat.xAxis.length}, 1fr)` }}>
        <div />
        {heat.xAxis.map((t) => (
          <div key={t} className="ev-heat__t">
            {t.slice(0, 2)}
            {t.endsWith("30") ? "½" : ""}
          </div>
        ))}
        {heat.stations.map((name, si) => (
          <HeatRow key={name} name={name} values={heat.values[si] ?? []} />
        ))}
      </div>
      <div className="ev-heat__legend">
        <span>
          <i style={{ background: SEVERE }} />
          ≥120 严重
        </span>
        <span>
          <i style={{ background: OVER }} />
          100–119 超载
        </span>
        <span>
          <i style={{ background: NEAR }} />
          80–99 接近
        </span>
        <span>
          <i style={{ background: "rgba(74,222,128,.2)" }} />
          &lt;80 宽松
        </span>
      </div>
    </PanelCard>
  );
}

function HeatRow({ name, values }: { name: string; values: number[] }) {
  return (
    <>
      <div className="ev-heat__st">{name}</div>
      {values.map((v, i) => {
        const c = cell(v);
        return (
          <div key={i} className={`ev-heat__c ${c.cls}`} style={c.bg ? { background: c.bg } : undefined}>
            {c.show}
          </div>
        );
      })}
    </>
  );
}
