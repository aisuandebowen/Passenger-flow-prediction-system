/**
 * 右侧面板区模块 —— 3 个悬浮面板的容器
 *
 * 布局：右侧纵向排列 3 个等高面板，悬浮在地图之上（不遮挡中央核心区）。
 * 每个面板是一个独立小模块（panel1/panel2/panel3），各自负责自己的数据与图表，
 * 互不影响——改任一个小模块不会动到另外两个。
 *
 * 容器只负责：定位、尺寸分配、入场动画编排。
 *
 * 复用/修改详见同目录 README.md。
 */

import { layout } from "@/config/layout";
import { useMoveTo } from "@/hooks/useMoveTo";
import LineRankPanel from "./panel1/LineRankPanel";
import TransferRadarPanel from "./panel2/TransferRadarPanel";
import AlarmListPanel from "./panel3/AlarmListPanel";
import "./Panels.css";

export default function Panels() {
  // 三个面板分别从右侧滑入，错相延迟（模版同款动效）
  const p1 = useMoveTo<HTMLDivElement>({ direction: "toLeft", duration: 0.8, delay: 0.5 });
  const p2 = useMoveTo<HTMLDivElement>({ direction: "toLeft", duration: 0.8, delay: 0.62 });
  const p3 = useMoveTo<HTMLDivElement>({ direction: "toLeft", duration: 0.8, delay: 0.74 });

  return (
    <div
      className="panels"
      style={{
        width: layout.panels.width,
        top: layout.panels.top,
        bottom: layout.panels.bottom,
        right: layout.panels.right,
        gap: layout.panels.gap,
      }}
    >
      <div className="panels__item" ref={p1.ref}>
        <LineRankPanel />
      </div>
      <div className="panels__item" ref={p2.ref}>
        <TransferRadarPanel />
      </div>
      <div className="panels__item" ref={p3.ref}>
        <AlarmListPanel />
      </div>
    </div>
  );
}
