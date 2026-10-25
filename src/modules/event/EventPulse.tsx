/**
 * ② 进馆 / 离馆双向脉冲（活动页中区大图）
 *
 * 以中线为轴：进馆流向上（青蓝）、离馆流向下（金色）镜像展开，
 * 散场反向尖峰一目了然。叠加：
 *   - 查看阶段的高亮色带（由 ① 阶段条联动，viewPhase 指定）
 *   - T+0 散场启动竖向参考线
 *
 * 数据：event-plan.json 的 pulse 字段（经 EventPage 传入）。
 */

import { useMemo } from "react";
import PanelCard from "@/components/PanelCard";
import type { EventPulseData } from "./types";

const W = 1080;
const H = 300;
const MID = 138;

export default function EventPulse({
  pulse,
  viewPhase,
}: {
  pulse: EventPulseData;
  /** 查看中的阶段索引（色带高亮区间） */
  viewPhase: number;
}) {
  const paths = useMemo(() => {
    const n = pulse.xAxis.length;
    const mx = Math.max(...pulse.in, ...pulse.out, 0.001);
    const up = pulse.in
      .map((v, i) => `${(i / (n - 1)) * W},${MID - (v / mx) * (MID - 10)}`)
      .join(" L");
    const down = pulse.out
      .map((v, i) => `${(i / (n - 1)) * W},${MID + (v / mx) * (H - MID - 14)}`)
      .join(" L");
    return {
      inPath: `M0,${MID} L${up} L${W},${MID}`,
      outPath: `M0,${MID} L${down} L${W},${MID}`,
    };
  }, [pulse]);

  const n = pulse.xAxis.length;
  const range = pulse.phaseRanges[viewPhase] ?? [0, n - 1];
  const x0 = (range[0] / (n - 1)) * W;
  const x1 = (range[1] / (n - 1)) * W;
  const t0x = (pulse.t0Index / (n - 1)) * W;

  // x 轴刻度：均匀取 7 个
  const tickIdx = useMemo(() => {
    const step = (n - 1) / 6;
    return Array.from({ length: 7 }, (_, i) => Math.round(i * step));
  }, [n]);

  return (
    <PanelCard
      title="进馆 · 离馆双向客流脉冲"
      extra={
        <span className="ev-legend">
          <span className="ev-legend__item">
            <i style={{ background: "#8fc2ff" }} />
            进馆流
          </span>
          <span className="ev-legend__item">
            <i style={{ background: "#ffd166" }} />
            离馆流
          </span>
          <span className="ev-legend__item">
            <i style={{ background: "rgba(120,158,255,.35)" }} />
            当前阶段
          </span>
        </span>
      }>
      <div className="ev-pulse-wrap">
        <svg
          className="ev-pulse"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="进馆离馆双向客流脉冲图">
          {/* 查看阶段色带 */}
          <rect x={x0} y={0} width={x1 - x0} height={H} fill="rgba(120,158,255,.10)" />
          {/* 网格与中线 */}
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={0} y1={MID * f} x2={W} y2={MID * f} stroke="rgba(120,158,255,.1)" strokeDasharray="3 5" />
          ))}
          <line x1={0} y1={MID} x2={W} y2={MID} stroke="rgba(120,158,255,.4)" />
          {/* 双向脉冲 */}
          <path d={paths.inPath} fill="rgba(143,194,255,.28)" stroke="#8fc2ff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <path d={paths.outPath} fill="rgba(255,209,102,.25)" stroke="#ffd166" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          {/* T+0 散场参考线 */}
          <line x1={t0x} y1={0} x2={t0x} y2={H} stroke="#ffd166" strokeWidth="1.5" strokeDasharray="6 5" vectorEffect="non-scaling-stroke" />
          {/* 竖向刻度线 */}
          {tickIdx.map((i) => (
            <line key={i} x1={(i / (n - 1)) * W} y1={0} x2={(i / (n - 1)) * W} y2={H} stroke="rgba(120,158,255,.1)" />
          ))}
        </svg>
        {/* T+0 标签：HTML overlay（SVG 非均匀缩放会拉伸文字） */}
        <span className="ev-pulse__t0" style={{ left: `${(pulse.t0Index / (n - 1)) * 100}%` }}>
          T+0 散场启动
        </span>
      </div>
      {/* x 轴刻度（HTML 行，避免非均匀缩放拉伸文字） */}
      <div className="ev-pulse__ticks">
        {tickIdx.map((i) => (
          <span key={i}>{pulse.xAxis[i]}</span>
        ))}
      </div>
      <div className="ev-pulse__axis">
        <span style={{ color: "#8fc2ff" }}>进馆 ↑</span>
        <span style={{ color: "#ffd166" }}>离馆 ↓</span>
        <span>单位：万人次 / 小时</span>
      </div>
    </PanelCard>
  );
}
