/**
 * ① 活动档案 + 生命周期阶段条（活动页顶部全宽横幅）
 *
 * 左：演出档案卡（名称/场馆/开演时间）
 * 中：五阶段进度条（检票前→检票中→演出中→散场中→已结束）——
 *     样式由数据下发的 currentPhase 决定（已完成✓/当前高亮/未开始），
 *     点击任一阶段 = "查看该阶段"，驱动 ② 脉冲图色带（is-view 描边）。
 * 右：距下一阶段倒计时 + 核心数字（入场/散场峰值/同比/影响站数）。
 */

import type { EventPlan } from "./types";

export default function EventDossier({
  plan,
  viewPhase,
  onViewPhase,
}: {
  plan: EventPlan;
  /** 查看中的阶段索引（联动脉冲色带） */
  viewPhase: number;
  onViewPhase: (i: number) => void;
}) {
  return (
    <div className="ev-dossier">
      <div className="ev-dossier__id">
        <span className="ev-dossier__name">{plan.title}</span>
        <span className="ev-dossier__sub">
          {plan.venue} · {plan.date} {plan.dayOfWeek} {plan.startTime} 开演
        </span>
      </div>

      <div className="ev-dossier__mid">
        <div className="ev-phases" role="tablist" aria-label="活动阶段">
          {plan.phases.map((p, i) => {
            const state =
              i < plan.currentPhase ? "is-done" : i === plan.currentPhase ? "is-cur" : "is-next";
            const viewing = i === viewPhase;
            return (
              <button
                key={p.id}
                type="button"
                className={`ev-phase ${state}${viewing ? " is-view" : ""}`}
                onClick={() => onViewPhase(i)}
                aria-pressed={viewing}>
                <small>{p.name}</small>
                <b>{p.time}</b>
                <em>{p.note}</em>
              </button>
            );
          })}
        </div>
        <div className="ev-dossier__nums">
          <span className="ev-num">
            预测入场<b>{plan.metrics.audience}</b>
          </span>
          <span className="ev-num">
            散场15min峰值<b className="ev-num--gold">{plan.metrics.exitPeak}</b>
          </span>
          <span className="ev-num">
            同比上场次<b className="ev-num--danger">{plan.metrics.yoy}</b>
          </span>
          <span className="ev-num">
            周边影响站<b>{plan.metrics.stations} 站</b>
          </span>
        </div>
      </div>

      <div className="ev-dossier__right">
        <div className="ev-clock">
          <span>{plan.countdownLabel}</span>
          <b>{plan.countdown}</b>
        </div>
        <span className="ev-clock__note">散场阶段周边站压力见「分时压力热力」</span>
      </div>
    </div>
  );
}
