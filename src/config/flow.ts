/**
 * 全网分时客流曲线（06:00–23:00，每小时一个点，共 18 点）
 *
 * 早晚双峰（早高峰 08:00、晚高峰 18:00），与趋势面板 xAxis 对齐。
 * 供地图客流脉冲幅度计算使用。单位：万人次/小时。
 */
export const FLOW_BY_HOUR = [
  42, 48, 66, 88, 102, 96, 84, 78, 82, 95, 108, 124, 132, 118, 98, 86, 74, 62,
] as const;

/** 分时客流峰值（用于归一化脉冲幅度） */
export const FLOW_PEAK = Math.max(...FLOW_BY_HOUR);

/** 全网日均客流（脉冲幅度固定按日均水平计算） */
export const FLOW_AVG = FLOW_BY_HOUR.reduce((a, b) => a + b, 0) / FLOW_BY_HOUR.length;

/** 满载率基准值（用于归一化站点脉冲幅度，取「一般」区间的中位 90） */
export const LOAD_BASE = 90;
