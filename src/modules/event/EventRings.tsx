/**
 * ③ 场馆影响圈保障（活动页右栏上）
 *
 * 上：SVG 同心圆 —— 圆心为场馆，三环 = 步行 ≤10/15/25 分钟圈，
 *     周边站点按圈层散布在环上（官方线路色圆点 + 站名）；
 * 下：圈层站点列表（一/二/三环 · 线路徽章 · 散场增量 · 闸机模式 · 限流等级）。
 * 圆图与列表点击双向联动（高亮选中站）。
 *
 * 数据：event-plan.json 的 ringStations / ringLabels（经 EventPage 传入）。
 */

import { useState } from "react";
import PanelCard from "@/components/PanelCard";
import type { EventPlan } from "./types";

const RING_R = [58, 84, 110];
const CX = 194;
const CY = 96;

const GATE_TEXT: Record<string, string> = {
  both: "双向",
  out: "只出不进",
  in: "只进不出",
};

export default function EventRings({ plan }: { plan: EventPlan }) {
  const [selected, setSelected] = useState<string | null>(null);
  const sts = plan.ringStations;

  return (
    <PanelCard title="场馆影响圈" extra="按步行时距分层">
      <svg className="ev-rings" viewBox="0 0 388 192" role="img" aria-label="场馆同心圈层图">
        {/* 场馆圆心 */}
        <circle cx={CX} cy={CY} r={10} fill="#ffd166" />
        <text x={CX} y={CY + 26} fill="#ffd166" fontSize="11.5" textAnchor="middle">
          {plan.venue}
        </text>
        {/* 三个圈层 */}
        {RING_R.map((r, i) => (
          <circle key={r} cx={CX} cy={CY} r={r} fill="none" stroke={`rgba(120,158,255,${0.4 - i * 0.1})`} strokeDasharray="4 5" />
        ))}
        {plan.ringLabels.map((t, i) => {
          const a = -Math.PI / 2 + (i - 1) * 0.5;
          const x = CX + Math.cos(a) * (RING_R[i] + 6);
          const y = CY + Math.sin(a) * (RING_R[i] + 6);
          return (
            <text key={t} x={x} y={y} fill="rgba(255,255,255,.45)" fontSize="10" textAnchor="middle">
              {t}
            </text>
          );
        })}
        {/* 站点（按圈层散布在环上） */}
        {sts.map((st, i) => {
          const ang = -Math.PI / 2 + (i / sts.length) * Math.PI * 2 + 0.35;
          const x = CX + Math.cos(ang) * RING_R[st.ring];
          const y = CY + Math.sin(ang) * RING_R[st.ring];
          const on = selected === st.name;
          return (
            <g
              key={st.name}
              className={`ev-ring-st${on ? " is-on" : ""}`}
              onClick={() => setSelected(on ? null : st.name)}>
              <circle cx={x} cy={y} r={on ? 7 : 5} fill={st.lines[0]?.color ?? "#bdcfff"} />
              <text x={x} y={y - 10} textAnchor="middle">
                {st.name}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="ev-cir-list">
        {sts.map((st) => {
          const on = selected === st.name;
          const gateCls = st.gate === "out" ? "is-out" : st.gate === "in" ? "is-in" : "is-both";
          return (
            <button
              key={st.name}
              type="button"
              className={`ev-cir-row${on ? " is-on" : ""}`}
              onClick={() => setSelected(on ? null : st.name)}
              aria-pressed={on}>
              <span className="ev-cir__ring">{["一环", "二环", "三环"][st.ring]}</span>
              <span className="ev-cir__name">
                {st.name}
                <span className="ev-cir__lbs">
                  {st.lines.map((l) => (
                    <i key={l.id} style={{ background: l.color }} title={l.name} />
                  ))}
                </span>
              </span>
              <span className="ev-cir__add">+{st.exitAdd.toLocaleString()}</span>
              <span className={`ev-cir__gate ${gateCls}`}>{GATE_TEXT[st.gate]}</span>
              <span className="ev-cir__limit">{st.limit}</span>
            </button>
          );
        })}
      </div>
    </PanelCard>
  );
}
