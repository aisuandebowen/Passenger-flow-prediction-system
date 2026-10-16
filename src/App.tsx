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

import { useCallback, useMemo, useState } from "react";
import Background from "@/modules/background/Background";
import Header from "@/modules/header/Header";
import Sidebar from "@/modules/sidebar/Sidebar";
import MetroMap from "@/modules/metro-map/MetroMap";
import Panels, { type PanelPage } from "@/modules/panels/Panels";
import LineLoadPanel from "@/modules/panels/panel6/LineLoadPanel";
import { layout } from "@/config/layout";
import { useAutoFit } from "@/utils/autofit";
import "./App.css";

/** 默认选中的左侧菜单：线网管理 -> 线路状态 */
const DEFAULT_MENU = "line-status";

export default function App() {
  const { scale, offsetX, offsetY } = useAutoFit();
  const [activeMenu, setActiveMenu] = useState<string>(DEFAULT_MENU);
  // 地图当前选中的站点（趋势面板联动显示该站数据）
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  // 侧边栏折叠状态（提升到这里，联动地图/满载率布局）
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  // 车站管理页关闭地图 OD 流动线
  const odEnabled = page !== "station-manage";

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
          ) : (
            <>
              {/* 中栏：地图（flex:1 自适应，侧栏折叠时左扩） */}
              <div className="app__map">
                <MetroMap odEnabled={odEnabled} onSelectStation={handleSelectStation} />
              </div>

              {/* 右栏：面板 */}
              <Panels page={page} selectedStation={selectedStation} />
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
