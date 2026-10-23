/**
 * 场景（节假日/大型活动）数据结构 —— 与 data/scene-menus.json、scene-detail.json 对应
 *
 * 供 Sidebar（菜单）、SceneTimeline（时间轴）、ScenePanel（右栏面板）、App 共享，
 * 避免各处重复定义类型。
 */

/** 场景菜单项（scene-menus.json） */
export interface SceneMenuItem {
  id: string;
  title: string;
  date: string;
  venue?: string;
  stations?: string[];
}

export interface SceneMenusData {
  holidays: SceneMenuItem[];
  events: SceneMenuItem[];
}

/** 时间轴节点 */
export interface SceneTimelineNode {
  /** 时刻标签（如 "T-5天" / "当天 10:00" / "22:10"） */
  t: string;
  /** 节点名（如 "客流开始爬升" / "散场脉冲"） */
  label: string;
  /** 预测值（如 "96万"） */
  value: string;
  /** 是否峰值锚点 */
  peak?: boolean;
}

/** 重点车站预测值 */
export interface SceneStation {
  name: string;
  value: number;
  yoy: string;
}

/** 分时预测曲线（中区时间轴下方展示） */
export interface SceneHourly {
  /** 24 小时刻度标签（"00:00" ~ "23:00"） */
  xAxis: string[];
  /** 预测客流（人次，按小时） */
  forecast: number[];
  /** 去年同期客流（人次，按小时） */
  lastYear: number[];
}

/** 场景预测详情（scene-detail.json 里按 id 索引的一项） */
export interface SceneDetail {
  title: string;
  type: "holiday" | "event";
  date: string;
  venue?: string;
  metrics: {
    total: string;
    peakTime: string;
    peak: string;
    yoy: string;
  };
  timeline: SceneTimelineNode[];
  hourly: SceneHourly;
  stations: SceneStation[];
  conclusions: string[];
}

/** scene-detail.json 整体：id -> 详情 */
export type SceneDetailMap = Record<string, SceneDetail>;
