/**
 * ⑤ 同场馆历史场次对比（活动页中区下右）
 *
 * 上：本场预测（金色实线）vs 上场次实际（蓝色虚线）的周边站合计进站分时曲线叠加；
 * 下：三格关键指标对比（入场人数 / 散场 15min 峰值 / 90% 疏散时长，利好绿色）。
 *
 * 数据：event-plan.json 的 history 字段（经 EventPage 传入）。
 */

import { useMemo } from "react";
import PanelCard from "@/components/PanelCard";
import type { EventPlan } from "./types";

const W = 388;
const H = 118;

export default function EventHistory({ history }: { history: EventPlan["history"] }) {
  const paths = useMemo(() => {
    const n = history.xAxis.length;
    const mx = Math.max(...history.current, ...history.last, 0.001);
    const path = (arr: number[]) =>
      arr
        .map((v, i) => `${((i / (n - 1)) * W).toFixed(1)},${(H - 10 - (v / mx) * (H - 30)).toFixed(1)}`)
        .join(" L");
    return { cur: `M${path(history.current)}`, last: `M${path(history.last)}` };
  }, [history]);

  return (
    <PanelCard title="历史场次对比" extra={`本场预测 vs ${history.lastTitle}`}>
      <svg
        className="ev-hist"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="本场预测与上场次实际对比曲线">
        <line x1={0} y1={H - 10} x2={W} y2={H - 10} stroke="rgba(120,158,255,.25)" vectorEffect="non-scaling-stroke" />
        <path d={paths.last} fill="none" stroke="#789eff" strokeWidth="1.8" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
        <path d={paths.cur} fill="none" stroke="#ffd166" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="ev-hist__labels">
        <span style={{ color: "#ffd166" }}>本场预测</span>
        <span style={{ color: "#789eff" }}>上场次实际</span>
        <span className="ev-hist__range">
          {history.xAxis[0]} – {history.xAxis[history.xAxis.length - 1]}
        </span>
      </div>
      <div className="ev-hist__row">
        {history.compare.map((c) => (
          <div className="ev-hist__cell" key={c.label}>
            <small>{c.label}</small>
            <b>{c.cur}</b>
            <em className={c.good ? "is-good" : undefined}>
              上场 {c.last} · {c.delta}
            </em>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}
