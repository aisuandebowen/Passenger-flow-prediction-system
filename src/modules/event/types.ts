/**
 * 大型活动（演唱会/冰雪节）保障视图数据结构 —— data/event-plan.json
 *
 * 与节假日（scene-detail.json）分开：活动页是"场馆中心"叙事，
 * 字段全部围绕场馆进散场脉冲、周边圈层与历史对比。
 */

/** 活动生命周期阶段 */
export interface EventPhase {
  id: string;
  /** 阶段名（检票前/检票中/演出中/散场中/已结束） */
  name: string;
  /** 时间范围文案 */
  time: string;
  /** 阶段说明（预计客流等） */
  note: string;
}

/** 双向脉冲（进馆/离馆） */
export interface EventPulseData {
  /** 时间刻度（如 16:30 ~ 23:40） */
  xAxis: string[];
  /** 进馆流（万人次/h），与 xAxis 对齐 */
  in: number[];
  /** 离馆流（万人次/h） */
  out: number[];
  /** T+0 散场启动参考线的索引 */
  t0Index: number;
  /** 各阶段在 x 轴的索引区间（浮点，与 phases 顺序一致），用于阶段色带 */
  phaseRanges: [number, number][];
}

/** 影响圈站点 */
export interface EventRingStation {
  name: string;
  /** 途经线路（自包含：id/名/官方色） */
  lines: { id: string; name: string; color: string }[];
  /** 圈层序号：0 一环 ≤10min / 1 二环 ≤15min / 2 三环 ≤25min */
  ring: 0 | 1 | 2;
  /** 散场预计增量（人次） */
  exitAdd: number;
  /** 散场闸机模式：both 双向 / out 只出不进 / in 只进不出 */
  gate: "both" | "out" | "in";
  /** 限流等级文案 */
  limit: string;
}

/** 分时压力热力 */
export interface EventHeatData {
  xAxis: string[];
  stations: string[];
  /** 满载率矩阵 [站][时段] */
  values: number[][];
}

/** 历史场次对比指标 */
export interface EventCompareItem {
  label: string;
  /** 本场（预测） */
  cur: string;
  /** 上场次（实际） */
  last: string;
  /** 差异文案 */
  delta: string;
  /** 差异方向是否为利好（绿） */
  good?: boolean;
}

export interface EventPlan {
  title: string;
  venue: string;
  date: string;
  dayOfWeek: string;
  /** 开演时间 */
  startTime: string;
  /** 生命周期阶段（当前阶段由 currentPhase 指定） */
  phases: EventPhase[];
  currentPhase: number;
  /** 距下一阶段倒计时文案（接 API 后实时下发） */
  countdown: string;
  countdownLabel: string;
  /** 档案核心数字 */
  metrics: {
    /** 预测入场 */
    audience: string;
    /** 散场 15min 峰值 */
    exitPeak: string;
    /** 同比上场次 */
    yoy: string;
    /** 周边影响站数 */
    stations: number;
  };
  pulse: EventPulseData;
  /** 影响圈层标签（与 ring 序号对应） */
  ringLabels: string[];
  ringStations: EventRingStation[];
  heat: EventHeatData;
  history: {
    /** 上场次说明 */
    lastTitle: string;
    xAxis: string[];
    /** 本场预测（周边站合计进站，万人次/h） */
    current: number[];
    /** 上场次实际 */
    last: number[];
    compare: EventCompareItem[];
  };
  /** 实时执行监测（接 API 前为演示值） */
  monitor: {
    updated: string;
    items: { name: string; cur: number; forecast: number; unit: string }[];
  };
}

/** event-plan.json 整体：id -> 方案 */
export type EventPlanMap = Record<string, EventPlan>;
