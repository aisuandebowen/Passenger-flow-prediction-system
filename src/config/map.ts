/**
 * 地图配置 —— 中央真实地图的全局开关
 *
 * 【一、默认展示城市】
 *   'beijing' | 'qingdao'。地图右上角有城市切换按钮，可在运行时切换；
 *   这里配置的是初始（默认）城市。城市数据在 data/metro-cities/<城市id>.json。
 *
 * 【二、自定义展示哪些线路】
 *   visibleLines 填线路 id 数组（只显示这些线，其余隐藏）；null = 全部显示。
 *   例：只看北京 1/2 号线 → visibleLines: ["M1","M2"]
 *
 * 【三、OD 流量光线】
 *   od.enabled 控制是否绘制从枢纽站（数据文件 od.hub）发出的流量光线。
 */

export type CityId = "beijing" | "qingdao";

export interface MapConfig {
  /** 初始城市：决定加载 data/metro-cities/ 下哪份数据 */
  city: CityId;
  /** 只展示这些线路（线路 id）；null = 全部展示 */
  visibleLines: string[] | null;
  /** OD 流量光线开关 */
  od: {
    enabled: boolean;
  };
  /**
   * 初始视野缩放倍数（也是「复位视野」按钮回到的层级）。
   *   1 = 整座城市铺满地图区（默认全图，城区线网会显得较小）
   *   2 ~ 3 = 以线网聚集区为中心适当放大（推荐）
   * 初次打开觉得地图太小就调大这个值；想默认看全城就调回 1。
   */
  initialZoom: number;
}

export const mapConfig: MapConfig = {
  city: "beijing",
  visibleLines: null,
  od: {
    enabled: true,
  },
  initialZoom: 2.4,
};
