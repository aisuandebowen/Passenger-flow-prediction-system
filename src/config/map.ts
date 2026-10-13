/**
 * 地图配置 —— 中央线网图的全局开关
 *
 * 【一、切换展示城市】
 *   把 city 从 'beijing' 改成 'qingdao'，中央地图就换成青岛线网。
 *   城市数据放在 data/metro-cities/<城市id>.json，详见该目录 README。
 *
 * 【二、自定义展示哪些线路】
 *   visibleLines 填要显示的线路 id 数组（只显示这些线，其余隐藏）；
 *   填 null 表示显示该城市全部线路。
 *   例：只看 1/2/10 号线 → visibleLines: ["M1","M2","M10"]
 *   线路 id 见 data/metro-cities/<城市>.json 里每条线的 id 字段。
 *
 * 【三、两种渲染模式】
 *   - 'vector'：用 JSON 里的线路折线 + 站点坐标绘制（北京，可缩放、清晰）
 *   - 'image' ：直接把一张线网图整图贴上去当背景（青岛等暂无矢量数据的城市）
 *   每个城市在自己的数据文件里指定 mode，不用在这里改。
 *
 * 【四、OD 光线】
 *   od.enabled：是否显示从枢纽发出的流量光线
 *   枢纽与流向终点坐标都在城市数据文件的 od 字段里（矢量模式用站点坐标，
 *   图片模式用整图像素坐标——在图上量出来填进去即可，详见 README）。
 */

export type CityId = "beijing" | "qingdao";

export interface MapConfig {
  /** 当前城市：决定加载 data/metro-cities/ 下哪份数据 */
  city: CityId;
  /** 只展示这些线路（线路 id）；null = 全部展示 */
  visibleLines: string[] | null;
  /** OD 流量光线开关 */
  od: {
    enabled: boolean;
    /** 枢纽（流量发射点）站点名；必须是该城市数据里存在的站点 */
    hub: string;
  };
}

export const mapConfig: MapConfig = {
  city: "beijing",
  visibleLines: null,
  od: {
    enabled: true,
    hub: "天安门西",
  },
};
