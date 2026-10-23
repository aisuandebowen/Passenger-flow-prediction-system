/**
 * 左侧侧边栏模块 —— 悬浮可折叠导航
 *
 * 结构（数据驱动，见 data/sidebar-menus.json）：
 *   3 个大目录，每个大目录下 3 个小目录，均可独立折叠。
 *   侧边栏整体也可折叠（折叠后只剩图标列，宽度 56px，不遮挡中央地图）。
 *
 * 交互：
 *   - 点击大目录标题：展开/收起其小目录
 *   - 点击小目录：选中（回调 onSelect，可在此接路由/页面切换）
 *   - 点击折叠按钮 / 再次点击展开：整栏折叠/展开
 *
 * 样式：半透明深蓝底 + 模版同款蓝色描边，悬浮在地图之上（z-index）。
 *
 * 复用/修改详见同目录 README.md。
 */

import { useEffect, useRef, useState } from "react";
import { loadData } from "@/config/data-source";
import { layout } from "@/config/layout";
import { theme } from "@/config/theme";
import { useMoveTo } from "@/hooks/useMoveTo";
import "./Sidebar.css";

// ---------- 数据结构 ----------
export interface MenuItem {
  id: string;
  title: string;
  /** 日期（MM-DD），用于"今天/临近"动态高亮（节假日/大型活动场景项） */
  date?: string;
}
export interface MenuGroup extends MenuItem {
  icon?: string;
  children: MenuItem[];
}
export type SidebarData = MenuGroup[];

/** 场景菜单数据结构（节假日/大型活动，来自 scene-menus.json） */
interface SceneMenuItem {
  id: string;
  title: string;
  date: string;
  venue?: string;
  stations?: string[];
}
interface SceneMenusData {
  holidays: SceneMenuItem[];
  events: SceneMenuItem[];
}

// ---------- 图标（内联 SVG，零依赖） ----------
const ICONS: Record<string, string> = {
  chart: "M3 13h4v8H3zM10 3h4v18h-4zM17 9h4v12h-4z",
  network: "M12 2a4 4 0 0 1 4 4 4 4 0 0 1-1.2 2.9L18 14a3 3 0 1 1-2 5.2L12 15l-4 4.2A3 3 0 1 1 6 14l3.2-5.1A4 4 0 0 1 8 6a4 4 0 0 1 4-4z",
  alert: "M12 2 2 20h20L12 2zm0 6v6m0 3.5v.5",
  holiday: "M12 3a6 6 0 0 0-6 6c0 4 6 12 6 12s6-8 6-12a6 6 0 0 0-6-6zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4z",
  event: "M8 2v3m8-3v3M4 5h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm4 8h8m-8 4h5",
};

/** 日期临近判定：今天→"today"，未来 7 天内→"near"，其余→"far" */
function dateState(dateStr: string, now: Date): "today" | "near" | "far" {
  const [m, d] = dateStr.split("-").map(Number);
  if (!m || !d) return "far";
  const target = new Date(now.getFullYear(), m - 1, d);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((target.getTime() - startOfToday.getTime()) / 86400000);
  if (diffDays === 0) return "today";
  if (diffDays > 0 && diffDays <= 7) return "near";
  return "far";
}

export default function Sidebar({
  onSelect,
  defaultActiveId = "",
  collapsed = false,
  onToggle,
}: {
  /** 点击小目录时的回调，参数为小目录 id */
  onSelect?: (id: string) => void;
  /** 默认选中的小目录 id（页面打开时的初始选中项） */
  defaultActiveId?: string;
  /** 整栏折叠状态（受控，由父组件管理） */
  collapsed?: boolean;
  /** 点击折叠按钮时的回调 */
  onToggle?: () => void;
}) {
  const [data, setData] = useState<SidebarData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set()); // 展开的大目录
  const [activeId, setActiveId] = useState<string>(defaultActiveId);

  // 入场动画：从左滑入。autoPlay=false，等数据到了再播一次（见下方 effect），
  // 避免空壳先滑一次、数据到了又滑一次。
  const { ref, restart } = useMoveTo<HTMLDivElement>({
    direction: "toRight",
    duration: 0.8,
    delay: 0.3,
    autoPlay: false,
  });

  useEffect(() => {
    // 同时加载：线网管理目录（sidebar-menus）+ 节假日/大型活动目录（scene-menus）
    Promise.all([
      loadData<SidebarData>("sidebarMenus"),
      loadData<SceneMenusData>("sceneMenus"),
    ])
      .then(([menus, scenes]) => {
        // 合并：线网管理目录保留，节假日检测/大型活动由 scene-menus 动态生成
        const merged: SidebarData = [...menus];
        const networkIdx = merged.findIndex((g) => g.id === "network");

        const holidayGroup: MenuGroup = {
          id: "monitor",
          title: "节假日检测",
          icon: "holiday",
          children: scenes.holidays.map((s) => ({ id: s.id, title: s.title, date: s.date })),
        };
        const eventGroup: MenuGroup = {
          id: "dispatch",
          title: "大型活动",
          icon: "event",
          children: scenes.events.map((s) => ({ id: s.id, title: s.title, date: s.date })),
        };

        // 用动态目录替换原有同名占位目录；若不存在则追加到末尾
        const replaceOrPush = (g: MenuGroup) => {
          const i = merged.findIndex((x) => x.id === g.id);
          if (i >= 0) merged[i] = g;
          else merged.push(g);
        };
        replaceOrPush(holidayGroup);
        replaceOrPush(eventGroup);

        setData(merged);
        // 默认展开「包含默认选中项」的大目录；无默认选中项则展开第一个
        const groupOfDefault = defaultActiveId
          ? merged.find((g) => g.children.some((c) => c.id === defaultActiveId))
          : undefined;
        const first = merged.length > 0 ? merged[0] : undefined;
        setOpenGroups(new Set([(groupOfDefault ?? first)?.id].filter(Boolean) as string[]));
      })
      .catch((e: Error) => setError(e.message));
  }, [defaultActiveId]);

  // 数据到了之后播一次入场（只播一次：playedRef 挡住后续所有重渲染）
  const playedRef = useRef(false);
  useEffect(() => {
    if (data && !playedRef.current) {
      playedRef.current = true;
      restart();
    }
  }, [data, restart]);

  const toggleGroup = (id: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleSelect = (item: MenuItem) => {
    setActiveId(item.id);
    onSelect?.(item.id);
  };

  const width = collapsed ? layout.sidebar.collapsedWidth : layout.sidebar.width;

  if (error) {
    return (
      <div className="sidebar sidebar--error" style={{ width }}>
        菜单加载失败：{error}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}
      style={{
        width,
        transition: `width ${layout.sidebar.transition}s ease`,
      }}
    >
      {/* 折叠/展开按钮（始终显示在最顶部） */}
      <button
        className="sidebar__toggle"
        onClick={onToggle}
        title={collapsed ? "展开侧边栏" : "折叠侧边栏"}
        aria-label="切换侧边栏">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {collapsed ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}
        </svg>
      </button>

      {data?.map((group) => {
        const isOpen = openGroups.has(group.id) && !collapsed;
        return (
          <div className="sidebar__group" key={group.id}>
            <button
              className="sidebar__group-title"
              onClick={() => toggleGroup(group.id)}
              title={collapsed ? group.title : ""}
              style={{ height: layout.sidebar.itemHeight }}>
              {group.icon && (
                <svg
                  className="sidebar__icon"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d={ICONS[group.icon] ?? ICONS.chart} />
                </svg>
              )}
              <span className="sidebar__group-text">{group.title}</span>
              {!collapsed && (
                <svg
                  className={`sidebar__arrow ${isOpen ? "sidebar__arrow--open" : ""}`}
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              )}
            </button>

            {/* 小目录：高度过渡的折叠区 */}
            <div
              className="sidebar__sub"
              style={{
                maxHeight: isOpen ? group.children.length * layout.sidebar.subItemHeight : 0,
              }}>
              {group.children.map((item) => {
                const state = item.date ? dateState(item.date, new Date()) : null;
                return (
                  <button
                    key={item.id}
                    className={`sidebar__sub-item ${activeId === item.id ? "sidebar__sub-item--active" : ""}`}
                    onClick={() => handleSelect(item)}
                    title={collapsed ? item.title : ""}
                    style={{ height: layout.sidebar.subItemHeight }}>
                    <span className="sidebar__sub-dot" style={{ backgroundColor: theme.primary }} />
                    <span className="sidebar__sub-text">{item.title}</span>
                    {state && state !== "far" && (
                      <span className={`sidebar__sub-badge sidebar__sub-badge--${state}`}>
                        {state === "today" ? "今天" : "临近"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
