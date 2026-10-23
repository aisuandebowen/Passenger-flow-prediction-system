/**
 * 右侧面板区模块 —— 根据左侧选中菜单切换不同面板组合
 *
 * 【线路状态 line-status】右侧依次展示 3 个面板：
 *   1. 线路客运量排行（panel1）
 *   2. 站点客运量趋势（panel4，预测 vs 真实，随地图点击站点切换）
 *   3. 实时告警信息（panel3）
 *
 * 【车站管理 station-manage】右侧展示 2 个面板：
 *   1. 车站客运量排行前 8（panel5，可切换 1h 时间段）
 *   2. 换乘站客流压力（panel2，雷达图）
 *
 * 容器只负责：根据 page 决定渲染哪些面板、定位、尺寸分配、入场动画编排。
 */

import { layout } from "@/config/layout";
import { useMoveTo } from "@/hooks/useMoveTo";
import LineRankPanel from "./panel1/LineRankPanel";
import TransferRadarPanel from "./panel2/TransferRadarPanel";
import AlarmListPanel from "./panel3/AlarmListPanel";
import StationTrendPanel from "./panel4/StationTrendPanel";
import StationRankPanel from "./panel5/StationRankPanel";
import "./Panels.css";

export type PanelPage = "line-status" | "station-manage" | "line-load";

export interface PanelsProps {
  /** 当前选中菜单 id（决定渲染哪组面板） */
  page: PanelPage | null;
  /** 地图当前选中的站点名（趋势面板用） */
  selectedStation: string | null;
  /** 时间轴当前时刻索引（趋势面板 markLine 高亮用） */
  timelineIndex: number;
}

export default function Panels({ page, selectedStation, timelineIndex }: PanelsProps) {
  // 各面板从右侧滑入，错相延迟（模版同款动效）
  const p1 = useMoveTo<HTMLDivElement>({ direction: "toLeft", duration: 0.8, delay: 0.5 });
  const p2 = useMoveTo<HTMLDivElement>({ direction: "toLeft", duration: 0.8, delay: 0.62 });
  const p3 = useMoveTo<HTMLDivElement>({ direction: "toLeft", duration: 0.8, delay: 0.74 });

  const isStationManage = page === "station-manage";

  return (
    <div
      className="panels"
      style={{
        width: layout.panels.width,
        gap: layout.panels.gap,
      }}
    >
      {isStationManage ? (
        <>
          <div className="panels__item" ref={p1.ref}>
            <StationRankPanel />
          </div>
          <div className="panels__item" ref={p2.ref}>
            <TransferRadarPanel />
          </div>
        </>
      ) : (
        <>
          <div className="panels__item" ref={p1.ref}>
            <LineRankPanel />
          </div>
          <div className="panels__item" ref={p2.ref}>
            <StationTrendPanel station={selectedStation} timelineIndex={timelineIndex} />
          </div>
          <div className="panels__item" ref={p3.ref}>
            <AlarmListPanel />
          </div>
        </>
      )}
    </div>
  );
}
