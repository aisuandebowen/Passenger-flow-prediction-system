/**
 * 真实地理投影 —— Web 墨卡托 + 平移/缩放视图变换
 *
 * 经纬度 → [0,1]² 世界坐标（墨卡托），再经「适配比例 s × 缩放 k + 平移」落到屏幕。
 * 视图状态只存 (cx, cy, k)：世界中心点 + 相对缩放，窗口尺寸变化时自动保持视野中心。
 */

/** 经纬度 → 墨卡托世界坐标 [0,1]²（y 向下增，与屏幕一致） */
export function projectLngLat(lng: number, lat: number): [number, number] {
  const x = lng / 360 + 0.5;
  const clamped = Math.max(-85, Math.min(85, lat));
  const rad = (clamped * Math.PI) / 180;
  const y = 0.5 - Math.log(Math.tan(Math.PI / 4 + rad / 2)) / (2 * Math.PI);
  return [x, y];
}

/** 视图状态：世界中心 + 相对适配比例的缩放倍数 */
export interface ViewState {
  cx: number;
  cy: number;
  k: number;
}

/** 适配参数：s = 世界坐标 → 屏幕的基础比例（k=1 时全城刚好铺满视口） */
export interface Fit {
  s: number;
  width: number;
  height: number;
}

/** 世界坐标 → 屏幕坐标（逻辑像素） */
export function apply(v: ViewState, f: Fit, wx: number, wy: number): [number, number] {
  return [(wx - v.cx) * f.s * v.k + f.width / 2, (wy - v.cy) * f.s * v.k + f.height / 2];
}

/** 屏幕坐标 → 世界坐标 */
export function invert(v: ViewState, f: Fit, sx: number, sy: number): [number, number] {
  const d = f.s * v.k;
  return [(sx - f.width / 2) / d + v.cx, (sy - f.height / 2) / d + v.cy];
}

/**
 * 以屏幕点 (px, py) 为锚缩放 factor 倍（该点世界坐标保持不动）。
 * kMin/kMax 为相对适配视野的缩放上下限。
 */
export function zoomAround(
  v: ViewState,
  f: Fit,
  px: number,
  py: number,
  factor: number,
  kMin: number,
  kMax: number
): ViewState {
  const [wx, wy] = invert(v, f, px, py);
  const k = Math.max(kMin, Math.min(kMax, v.k * factor));
  const d = f.s * k;
  return {
    k,
    cx: wx - (px - f.width / 2) / d,
    cy: wy - (py - f.height / 2) / d,
  };
}

/** 平移 dx/dy 屏幕像素 */
export function panBy(v: ViewState, f: Fit, dx: number, dy: number): ViewState {
  const d = f.s * v.k;
  return { ...v, cx: v.cx - dx / d, cy: v.cy - dy / d };
}

/** 由一组经纬度点算适配比例（含留白 pad） */
export function fitScale(points: [number, number][], width: number, height: number, pad = 0.04): number {
  if (!points.length || width <= 0 || height <= 0) return 1;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  const bw = Math.max(maxX - minX, 1e-9);
  const bh = Math.max(maxY - minY, 1e-9);
  const px = bw * pad;
  const py = bh * pad;
  return Math.min(width / (bw + px * 2), height / (bh + py * 2));
}

/** 限制视野中心，防止拖出城市范围（world 坐标包围盒外留 40% 缓冲） */
export function clampCenter(v: ViewState, box: { minX: number; minY: number; maxX: number; maxY: number }): ViewState {
  const bx = (box.maxX - box.minX) * 0.4 || 0.1;
  const by = (box.maxY - box.minY) * 0.4 || 0.1;
  return {
    ...v,
    cx: Math.max(box.minX - bx, Math.min(box.maxX + bx, v.cx)),
    cy: Math.max(box.minY - by, Math.min(box.maxY + by, v.cy)),
  };
}
