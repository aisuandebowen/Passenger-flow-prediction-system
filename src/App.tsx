/**
 * App —— 大屏主组装
 *
 * 结构（全部模块化，各自独立）：
 *
 *   ┌──────────────────────────────────────────────┐
 *   │                 Header 标题栏                │
 *   │ ┌────────┐                        ┌────────┐ │
 *   │ │        │      中央地图模块       │ 面板1  │ │
 *   │ │ 侧边栏 │   (北京线网 + OD 光线)  │ 面板2  │ │
 *   │ │        │                        │ 面板3  │ │
 *   │ └────────┘                        └────────┘ │
 *   └──────────────────────────────────────────────┘
 *
 * - 整个画布按 1920x1080 设计稿等比缩放（useAutoFit），适配任何屏幕。
 * - 中央地图区固定在两侧栏之间的区域，保证侧边栏/面板折叠时不遮挡。
 *
 * 单独复用某模块：把对应目录（如 src/modules/sidebar）拷走即可，
 * 各模块只依赖 src/config（配置）与 src/components、src/hooks（公共件）。
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Background from "@/modules/background/Background";
import Header from "@/modules/header/Header";
import Sidebar from "@/modules/sidebar/Sidebar";
import MetroMap from "@/modules/metro-map/MetroMap";
import Panels, { type PanelPage } from "@/modules/panels/Panels";
import LineLoadPanel from "@/modules/panels/panel6/LineLoadPanel";
import LineStatusKpi from "@/modules/panels/LineStatusKpi";
import TimelineBar from "@/modules/panels/TimelineBar";
import ScenePage from "@/modules/scene/ScenePage";
import { loadData } from "@/config/data-source";
import type { SceneMenusData } from "@/modules/scene/types";
import { layout } from "@/config/layout";
import { useAutoFit } from "@/utils/autofit";
import "./App.css";

/** 默认选中的左侧菜单：线网管理 -> 线路状态 */
const DEFAULT_MENU = "line-status";

/** 时间轴时刻总数（06:00–23:00，18 个点，与趋势面板 xAxis 对齐） */
const TIMELINE_COUNT = 18;

export default function App() {
  const { scale, offsetX, offsetY } = useAutoFit();
  const [activeMenu, setActiveMenu] = useState<string>(DEFAULT_MENU);
  // 地图当前选中的站点（趋势面板联动显示该站数据）
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  // 当前选中的线路（null=全网；提升到此，供地图筛选与 KPI 横幅联动）
  // 支持 URL 深链：?line=M10 直接选中 10 号线（分享/演示用）
  const [activeLine, setActiveLine] = useState<string | null>(() => {
    const v = new URLSearchParams(window.location.search).get("line");
    return v || null;
  });
  // 时间轴回放：当前时刻索引（0–17）与播放状态
  const [timelineIndex, setTimelineIndex] = useState(0);
  const [timelinePlaying, setTimelinePlaying] = useState(false);
  // 侧边栏折叠状态（提升到这里，联动地图/满载率布局）
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 时间轴播放：播放时每 800ms 推进一个时刻，到末尾回到起点
  useEffect(() => {
    if (!timelinePlaying) return;
    const id = window.setInterval(() => {
      setTimelineIndex((i) => (i + 1) % TIMELINE_COUNT);
    }, 800);
    return () => window.clearInterval(id);
  }, [timelinePlaying]);

  // 场景菜单（节假日/大型活动）——用于判断选中菜单是否为场景页
  const [sceneIds, setSceneIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    loadData<SceneMenusData>("sceneMenus")
      .then((d) => {
        const ids = new Set<string>();
        d.holidays.forEach((s) => ids.add(s.id));
        d.events.forEach((s) => ids.add(s.id));
        setSceneIds(ids);
      })
      .catch(() => {
        /* 场景菜单加载失败不影响其他页面 */
      });
  }, []);

  const handleSelect = useCallback((id: string) => {
    setActiveMenu(id);
    // 切换菜单时清空地图站点选择，趋势面板回到默认站
    setSelectedStation(null);
    // 在此接入路由切换 / 数据刷新等逻辑
    console.info("[sidebar] 选中：", id);
  }, []);

  const handleSelectStation = useCallback((name: string | null) => {
    setSelectedStation(name);
  }, []);

  // 当前页面：三个菜单 id 有对应面板，其余视为线路状态页
  const page: PanelPage = useMemo(() => {
    if (activeMenu === "station-manage") return "station-manage";
    if (activeMenu === "line-load") return "line-load";
    return "line-status";
  }, [activeMenu]);

  // 车站管理页关闭地图 OD 流动线；其余页面 OD 默认关闭，由右下角按钮手动开启
  const [odEnabled, setOdEnabled] = useState(false);
  const showOd = page !== "station-manage" && odEnabled;

  const sidebarWidth = sidebarCollapsed
    ? layout.sidebar.collapsedWidth
    : layout.sidebar.width;

  return (
    <div className="app">
      {/* 缩放画布：所有模块都放在里面，整体等比缩放 */}
      <div
        className="app__stage"
        style={{
          width: layout.designWidth,
          height: layout.designHeight,
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
          // 字号基准：全站 em 字体都相对于它（见 src/config/layout.ts 的 font 段）
          fontSize: layout.font.base,
        }}>
        {/* 1. 背景模块（最底层） */}
        <Background />

        {/* 2. 顶部标题栏 */}
        <Header />

        {/* 3. 主体：标题下方，严格左中右三栏布局 */}
        <div
          className="app__body"
          style={{
            top: layout.body.top,
            bottom: layout.body.bottom,
            left: layout.body.side,
            right: layout.body.side,
            gap: layout.body.gap,
          }}>
          {/* 左栏：侧边栏（flex 占位，折叠时收窄，中/右自动左扩） */}
          <Sidebar
            onSelect={handleSelect}
            defaultActiveId={DEFAULT_MENU}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((c) => !c)}
          />

          {page === "line-load" ? (
            // 线路满载率管控：占用中 + 右（侧栏折叠后自动扩展占满剩余）
            <div className="app__lineload">
              <LineLoadPanel />
            </div>
          ) : sceneIds.has(activeMenu) ? (
            // 节假日/大型活动：中区预测时间轴 + 右栏预测详情面板
            <ScenePage sceneId={activeMenu} />
          ) : (
            <>
              {/* 中栏：地图（flex:1 自适应，侧栏折叠时左扩） */}
              <div className="app__map">
                <MetroMap
                  odEnabled={showOd}
                  onToggleOd={() => setOdEnabled((v) => !v)}
                  onSelectStation={handleSelectStation}
                  activeLine={activeLine}
                  onActiveLineChange={setActiveLine}
                />
                {/* 线路状态页顶部 KPI 总览横幅（悬浮于地图上方，随线路联动） */}
                <LineStatusKpi activeLine={activeLine} />
                {/* 时间轴回放条（悬浮于地图底部） */}
                <TimelineBar
                  index={timelineIndex}
                  onChange={setTimelineIndex}
                  playing={timelinePlaying}
                  onTogglePlay={() => setTimelinePlaying((p) => !p)}
                />
              </div>

              {/* 右栏：面板 */}
              <Panels
                page={page}
                selectedStation={selectedStation}
                timelineIndex={timelineIndex}
              />
            </>
          )}
        </div>

        {/* 当前选中菜单（调试用，可删） */}
        {activeMenu && (
          <div className="app__active-hint">当前选中：{activeMenu}</div>
        )}
      </div>
    </div>
  );
}
