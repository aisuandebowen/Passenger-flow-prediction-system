/**
 * 主题配置 —— 全局颜色配置项
 *
 * 颜色取自参考模版 sc-datav（Demo2）+ 参考图采样：
 *   背景近黑 #020206（参考图 84% 暗像素）、主蓝 #3061DB、描边蓝 #789eff、
 *   文字蓝 #bdcfff / #e8efff、面板内深蓝 #041424/#04243C。
 *
 * 修改方式：直接改下方任意 hex 值，所有模块同步生效（各模块均从此文件取色）。
 */

export const theme = {
  /** 页面底色（近黑微蓝） */
  background: "#020206",

  /** 背景网格颜色 */
  gridColor: "rgba(48, 97, 219, 0.08)",

  /** 主色：面板边框、标题装饰、图表主色 */
  primary: "#3061DB",

  /** 描边亮蓝：卡片高亮描边、标题渐变 */
  accent: "#789eff",

  /** 标题文字 */
  titleText: "#e8efff",

  /** 正文文字（偏蓝白） */
  text: "#bdcfff",

  /** 次要文字 */
  subText: "rgba(255, 255, 255, 0.55)",

  /** 面板内部底色（半透明深蓝，参考图 #041424） */
  panelBg: "rgba(4, 20, 36, 0.72)",

  /** 面板内描边 */
  panelBorder: "rgba(120, 158, 255, 0.33)",

  /** OD 光线颜色 */
  odLine: "#8fc2ff",

  /** 换乘站强调色 */
  transferStation: "#ffd166",

  /** 普通站点颜色 */
  station: "#bdcfff",

  /** 侧边栏激活态 */
  sidebarActive: "#3061DB",

  /** 告警级别配色 */
  level: {
    danger: "#ea580c",
    warning: "#ffa800",
    normal: "#3061DB",
  },

  /** ECharts 图表调色板 */
  chartPalette: ["#bdcfff", "#789eff", "#3061DB", "#8fc2ff", "#b693e2", "#91cfd4"],
} as const;

export type Theme = typeof theme;
