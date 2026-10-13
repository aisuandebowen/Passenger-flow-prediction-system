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

import { useCallback, useState } from "react";
import Background from "@/modules/background/Background";
import Header from "@/modules/header/Header";
import Sidebar from "@/modules/sidebar/Sidebar";
import MetroMap from "@/modules/metro-map/MetroMap";
import Panels from "@/modules/panels/Panels";
import { layout } from "@/config/layout";
import { useAutoFit } from "@/utils/autofit";
import "./App.css";

export default function App() {
  const { scale, offsetX, offsetY } = useAutoFit();
  const [activeMenu, setActiveMenu] = useState<string>("");

  const handleSelect = useCallback((id: string) => {
    setActiveMenu(id);
    // 在此接入路由切换 / 数据刷新等逻辑
    console.info("[sidebar] 选中：", id);
  }, []);

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

        {/* 2. 中央地图模块（铺满，左右留出侧边栏与面板的悬浮区） */}
        <div
          className="app__map"
          style={{
            left: layout.mapArea.left,
            right: layout.mapArea.right,
            top: layout.mapArea.top,
            bottom: layout.mapArea.bottom,
          }}>
          <MetroMap />
        </div>

        {/* 3. 左侧侧边栏模块（悬浮） */}
        <Sidebar onSelect={handleSelect} />

        {/* 4. 右侧面板模块（悬浮，内含 3 个独立小面板） */}
        <Panels />

        {/* 5. 顶部标题栏（最顶层） */}
        <Header />

        {/* 当前选中菜单（调试用，可删） */}
        {activeMenu && (
          <div className="app__active-hint">当前选中：{activeMenu}</div>
        )}
      </div>
    </div>
  );
}
