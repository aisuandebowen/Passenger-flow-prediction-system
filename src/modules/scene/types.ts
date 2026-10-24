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

/** 逐日客流预测（节假日假期逐日 / 活动前中后逐日） */
export interface SceneDay {
  /** 日期（MM-DD） */
  date: string;
  /** 日标签（如 "周四" / "演出前" / "返程日"） */
  label: string;
  /** 当日预测总客流（万人次） */
  total: number;
  /** 是否全期峰值日 */
  peak?: boolean;
}

/** 节假日/活动期间线路压力预测（排行展示） */
export interface SceneLinePressureItem {
  /** 线路 id（与地图数据一致，如 M1） */
  id: string;
  name: string;
  /** 官方线路色 */
  color: string;
  /** 预计满载率（%） */
  load: number;
  /** 较平日增量（如 "+31%"） */
  delta: string;
}

/** 管控预案措施 */
export interface SceneMeasure {
  /** 措施类型图标：train 加开临客 / clock 延长运营 / gate 分级限流 / staff 人员保障 / bus 备用车 */
  icon: "train" | "clock" | "gate" | "staff" | "bus";
  title: string;
  detail: string;
}

/** 场景 KPI 横幅附加指标 */
export interface SceneKpiExtra {
  /** 预计影响线路数 */
  lines: number;
  /** 建议启动限流车站数 */
  limitStations: number;
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
  /** 逐日客流预测（可选，无则中区不渲染该卡） */
  days?: SceneDay[];
  /** 线路压力预测（可选） */
  lines?: SceneLinePressureItem[];
  /** 管控预案（可选，无则右栏退回预测概览卡） */
  measures?: SceneMeasure[];
  /** KPI 横幅附加指标（可选） */
  kpi?: SceneKpiExtra;
}

/** scene-detail.json 整体：id -> 详情 */
export type SceneDetailMap = Record<string, SceneDetail>;
