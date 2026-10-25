/**
 * 大型活动页 —— 场馆中心的保障作战视图（独立于节假日的 ScenePage）
 *
 * 布局：
 *   ┌────────────────────────────────────────────────────────────┐
 *   │ ① 活动档案 + 生命周期阶段条（全宽横幅，点击阶段联动 ② 色带）  │
 *   ├──────────────────────────────────────┬─────────────────────┤
 *   │ ② 进馆/离馆双向脉冲（flex 大图）        │ ③ 场馆影响圈保障     │
 *   ├──────────────────┬───────────────────│   （同心圆+圈层列表） │
 *   │ ④ 分时压力热力     │ ⑤ 历史场次对比     ├─────────────────────┤
 *   │   （站×时段矩阵）  │  （曲线叠加+指标）  │ ⑥ 实时执行监测       │
 *   └──────────────────┴───────────────────┴─────────────────────┘
 *
 * 数据：data/event-plan.json，经 loadData('eventPlan') 读取（按活动 id 索引）。
 */

import { useEffect, useState } from "react";
import { loadData } from "@/config/data-source";
import type { EventPlan, EventPlanMap } from "./types";
import EventDossier from "./EventDossier";
import EventPulse from "./EventPulse";
import EventHeat from "./EventHeat";
import EventHistory from "./EventHistory";
import EventRings from "./EventRings";
import EventMonitor from "./EventMonitor";
import "./EventPage.css";

export default function EventPage({ eventId }: { eventId: string }) {
  const [plan, setPlan] = useState<EventPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 查看中的阶段（驱动 ② 脉冲色带；初始 = 数据下发的当前阶段）
  const [viewPhase, setViewPhase] = useState(0);

  useEffect(() => {
    setPlan(null);
    setError(null);
    loadData<EventPlanMap>("eventPlan")
      .then((d) => {
        const p = d[eventId];
        if (p) {
          setPlan(p);
          setViewPhase(p.currentPhase);
        } else {
          setError(`未找到活动 ${eventId}`);
        }
      })
      .catch((e: Error) => setError(e.message));
  }, [eventId]);

  if (error) return <div className="event-page event-page--error">加载失败：{error}</div>;

  if (!plan)
    return <div className="event-page event-page--loading">活动方案加载中…</div>;

  return (
    <div className="event-page">
      {/* 中区：档案横幅 + 双向脉冲 + 底部双卡 */}
      <div className="event-page__main">
        <EventDossier
          plan={plan}
          viewPhase={viewPhase}
          onViewPhase={setViewPhase}
        />
        <div className="event-page__pulse">
          <EventPulse pulse={plan.pulse} viewPhase={viewPhase} />
        </div>
        <div className="event-page__bottom">
          <div className="event-page__bottom-item event-page__bottom-item--heat">
            <EventHeat heat={plan.heat} />
          </div>
          <div className="event-page__bottom-item">
            <EventHistory history={plan.history} />
          </div>
        </div>
      </div>

      {/* 右栏：影响圈 + 实时监测 */}
      <div className="event-page__side">
        <div className="event-page__rings">
          <EventRings plan={plan} />
        </div>
        <div className="event-page__monitor">
          <EventMonitor monitor={plan.monitor} />
        </div>
      </div>
    </div>
  );
}
