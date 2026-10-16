/**
 * 布局配置 —— 全局尺寸/位置配置项
 *
 * 大屏按 1920x1080 设计，运行时整体等比缩放（见 src/utils/autofit.ts）。
 * 三个模块（左侧栏 / 中间地图 / 右侧面板）均为 position:absolute 悬浮层，
 * 互不依赖，可单独开关（见各模块 README）。
 */

export const layout = {
  /** 设计稿画布尺寸 */
  designWidth: 1920,
  designHeight: 1080,

  /** 顶部标题栏高度（px，设计稿尺寸） */
  headerHeight: 72,

  /** 左侧栏 */
  sidebar: {
    /** 展开宽度 */
    width: 268,
    /** 折叠宽度（只留图标列） */
    collapsedWidth: 56,
    /** 距顶部（避开标题栏） */
    top: 96,
    /** 距底部 */
    bottom: 24,
    /** 距左边 */
    left: 12,
    /** 每项高度 */
    itemHeight: 44,
    /** 子项高度 */
    subItemHeight: 38,
    /** 折叠/展开动画时长（秒） */
    transition: 0.35,
  },

  /** 右侧面板区 */
  panels: {
    width: 420,
    top: 96,
    bottom: 24,
    right: 12,
    /** 三个面板之间的间隙 */
    gap: 18,
  },

  /** 主体三栏布局（标题栏下方） */
  body: {
    /** 上边距（避开标题栏） */
    top: 96,
    /** 下边距 */
    bottom: 24,
    /** 左右外边距 */
    side: 12,
    /** 栏与栏之间的间隙 */
    gap: 12,
  },

  /** 中央地图区（两侧之间的可视区域） */
  mapArea: {
    /** 左边距 = 侧边栏折叠宽度 + 留白，保证不遮挡 */
    left: 88,
    /** 右边距 = 右侧面板宽度 + 留白 */
    right: 452,
    top: 88,
    bottom: 24,
  },

  /** 入场动画（秒） */
  animation: {
    duration: 0.8,
    stagger: 0.12,
  },

  /**
   * 字号基准 —— 全局字体的唯一旋钮
   *
   * 所有模块的字体都写成相对单位（CSS 里用 em，JS 里用 fz()），
   * 相对于这个基准换算，没有任何地方写死 px。
   *   - 改 base：全站字体等比放大/缩小
   *   - 屏幕分辨率变化：舞台整体 transform 缩放，字体随之等比自适应
   */
  font: {
    /** 基准字号（px，1920x1080 设计稿下的值；CSS 里 1em = 这个值） */
    base: 23,
  },
} as const;

export type Layout = typeof layout;

/**
 * 设计稿字号 -> 实际 px。ECharts / SVG 只接受数字 px，不能用 em，
 * 所以凡是 JS 里写字号的地方都过一遍这个函数。
 *
 * 例：fz(11) 在 base=16 时是 11；把 base 改成 18 就自动变成 12.375。
 */
export function fz(px: number): number {
  return Math.round((px / 16) * layout.font.base * 1000) / 1000;
}
