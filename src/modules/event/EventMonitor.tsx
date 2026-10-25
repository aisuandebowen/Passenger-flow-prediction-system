/**
 * ⑥ 实时执行监测（活动页右栏下）
 *
 * 每项指标一条进度条：实际值条 + 白色刻度线标记预测值位置——
 * 条与刻度线的间距即"执行偏差"（实际落后/超前预测）。接 API 前为演示值。
 *
 * 数据：event-plan.json 的 monitor 字段（经 EventPage 传入）。
 */

import PanelCard from "@/components/PanelCard";
import type { EventPlan } from "./types";

export default function EventMonitor({ monitor }: { monitor: EventPlan["monitor"] }) {
  return (
    <PanelCard title="实时执行监测" extra={`更新 ${monitor.updated}`}>
      <div className="ev-mon">
        {monitor.items.map((m) => {
          const max = Math.max(m.cur, m.forecast, 0.001);
          // 超载类指标（%）用暖色，完成率/就绪率用绿，人数用金
          const color = m.name.includes("满载率")
            ? m.cur > 100
              ? "#f87171"
              : "#ffa800"
            : m.name.includes("人数")
              ? "#ffd166"
              : "#4ade80";
          return (
            <div className="ev-mon__row" key={m.name}>
              <span className="ev-mon__name" title={m.name}>
                {m.name}
              </span>
              <span className="ev-mon__bar">
                <span style={{ width: `${Math.min(m.cur / max, 1) * 100}%`, background: `linear-gradient(90deg, ${color}55, ${color})` }} />
                <i style={{ right: `${(1 - m.forecast / max) * 100}%` }} />
              </span>
              <span className="ev-mon__val">
                实际 <b>{m.cur}</b>
                {m.unit} / 预测 {m.forecast}
                {m.unit}
              </span>
            </div>
          );
        })}
      </div>
    </PanelCard>
  );
}
