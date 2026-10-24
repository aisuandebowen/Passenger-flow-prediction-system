/**
 * 右侧面板区模块 —— 根据左侧选中菜单切换不同面板组合
 *
 * 【线路状态 line-status】右侧依次展示 3 个面板：
 *   1. 线路客运量排行（panel1）
 *   2. 站点客运量趋势（panel4，预测 vs 真实，随地图点击站点切换）
 *   3. 实时告警信息（panel3）
 *
 * 【车站管理 station-manage】右侧依次展示 4 个面板（联动同一个选中站）：
 *   1. 车站实时详情（station-detail，随地图/榜单点击切换）
 *   2. 车站客运量排行（panel5，时段下拉 + 全运营时段汇总，条目可点选）
 *   3. 拥挤·限流车站（station-alerts，条目可点选）
 *   4. 换乘站客流压力（panel2，当前 vs 峰值对比条形图，可切换换乘站）
 *
 * 容器只负责：根据 page 决定渲染哪些面板、定位、尺寸分配、入场动画编排。
 */

import { layout } from "@/config/layout";
import { useMoveTo } from "@/hooks/useMoveTo";
import LineRankPanel from "./panel1/LineRankPanel";
import TransferPressurePanel from "./panel2/TransferPressurePanel";
import AlarmListPanel from "./panel3/AlarmListPanel";
import StationTrendPanel from "./panel4/StationTrendPanel";
import StationRankPanel from "./panel5/StationRankPanel";
import StationDetailPanel from "./station-detail/StationDetailPanel";
import StationAlertsPanel from "./station-alerts/StationAlertsPanel";
import "./Panels.css";

export type PanelPage = "line-status" | "station-manage" | "line-load";

export interface PanelsProps {
  /** 当前选中菜单 id（决定渲染哪组面板） */
  page: PanelPage | null;
  /** 地图当前选中的站点名（详情/趋势面板联动用） */
  selectedStation: string | null;
  /** 面板侧发起的选中站变化（榜单/详情点击 → 联动地图与其他面板） */
  onSelectStation?: (name: string | null) => void;
}

export default function Panels({ page, selectedStation, onSelectStation }: PanelsProps) {
  // 各面板从右侧滑入，错相延迟（模版同款动效）
  const p1 = useMoveTo<HTMLDivElement>({ direction: "toLeft", duration: 0.8, delay: 0.5 });
  const p2 = useMoveTo<HTMLDivElement>({ direction: "toLeft", duration: 0.8, delay: 0.62 });
  const p3 = useMoveTo<HTMLDivElement>({ direction: "toLeft", duration: 0.8, delay: 0.74 });
  const p4 = useMoveTo<HTMLDivElement>({ direction: "toLeft", duration: 0.8, delay: 0.86 });

  const isStationManage = page === "station-manage";

  return (
    <div
      className="panels"
      style={{
        width: layout.panels.width,
        // 车站管理页 4 面板：间隙收紧，给内容让高度
        gap: isStationManage ? 12 : layout.panels.gap,
      }}
    >
      {isStationManage ? (
        <>
          <div className="panels__item panels__item--compact" ref={p1.ref} style={{ flex: 1.35 }}>
            <StationDetailPanel station={selectedStation} />
          </div>
          <div className="panels__item panels__item--compact" ref={p2.ref} style={{ flex: 1.0 }}>
            <StationRankPanel
              topN={6}
              onSelect={onSelectStation}
              selectedStation={selectedStation}
            />
          </div>
          <div className="panels__item panels__item--compact" ref={p3.ref} style={{ flex: 1.3 }}>
            <StationAlertsPanel station={selectedStation} onSelectStation={onSelectStation} />
          </div>
          <div className="panels__item panels__item--compact" ref={p4.ref} style={{ flex: 1.15 }}>
            <TransferPressurePanel station={selectedStation} />
          </div>
        </>
      ) : (
        <>
          <div className="panels__item" ref={p1.ref}>
            <LineRankPanel />
          </div>
          <div className="panels__item" ref={p2.ref}>
            <StationTrendPanel station={selectedStation} />
          </div>
          <div className="panels__item" ref={p3.ref}>
            <AlarmListPanel />
          </div>
        </>
      )}
    </div>
  );
}
