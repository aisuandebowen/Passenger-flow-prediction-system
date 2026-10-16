/**
 * 数据源配置 —— 全局数据来源开关
 *
 * 【一键切换 API】
 *   把 DATA_MODE 从 'local' 改成 'api'，所有模块即改为从 API 拉取数据。
 *   然后在 API_ENDPOINTS 里填上你的接口地址即可，不需要改任何模块代码。
 *
 *   DATA_MODE: 'local'  -> 读取 /data 目录下的本地 JSON（打包时一起带走）
 *              'api'    -> 请求 API_ENDPOINTS 对应的接口（fetch，GET）
 *
 * 【接口约定】
 *   每个 API 只需返回对应 JSON 文件里同样的数据结构。
 *   例如 panel1 接口返回 { "title": "...", "unit": "...", "data": [...] } 即可。
 *
 * 【鉴权】
 *   若接口需要 token，在 apiRequest 里取消注释 headers 并填入。
 */

export type DataMode = "local" | "api";

/** ============ 总开关：改这一行即可一键切换 ============ */
export const DATA_MODE: DataMode = "local";

/** 本地 JSON 路径（相对站点根目录，Vite 会把 /data 打包进去） */
export const LOCAL_PATHS = {
  metroCity: "./data/metro-cities/{city}.json",
  sidebarMenus: "./data/sidebar-menus.json",
  panel1: "./data/panel1-line-rank.json",
  panel2: "./data/panel2-transfer-radar.json",
  panel3: "./data/panel3-alarms.json",
  panel4: "./data/panel4-trend.json",
  stationTrend: "./data/station-trend.json",
  stationRank: "./data/station-rank.json",
  lineLoad: "./data/line-load.json",
} as const;

/** API 接口地址（DATA_MODE='api' 时生效） */
export const API_ENDPOINTS = {
  metroCity: "/api/metro/city/{city}",
  sidebarMenus: "/api/sidebar/menus",
  panel1: "/api/panels/line-rank",
  panel2: "/api/panels/transfer-radar",
  panel3: "/api/panels/alarms",
  panel4: "/api/panels/trend",
  stationTrend: "/api/panels/station-trend",
  stationRank: "/api/panels/station-rank",
  lineLoad: "/api/panels/line-load",
} as const;

/** 数据源的 key，各模块用这个名字取数据 */
export type DataKey = keyof typeof LOCAL_PATHS;

/**
 * 取数据：模块唯一入口。
 * - local 模式：fetch 本地 JSON（dev 与 build 后路径一致）
 * - api   模式：fetch 接口
 *
 * 返回的是 JSON 解析后的对象，泛型 T 由调用方指定。
 *
 * @param params 路径里 {xxx} 占位符的替换值。例：loadData("metroCity", { city: "qingdao" })
 *               会把 ./data/metro-cities/{city}.json 变成 .../qingdao.json
 */
export async function loadData<T = unknown>(
  key: DataKey,
  params?: Record<string, string>
): Promise<T> {
  const raw = DATA_MODE === "api" ? API_ENDPOINTS[key] : LOCAL_PATHS[key];
  const url = params ? replaceParams(raw, params) : raw;

  const res = await fetch(url, apiRequest());
  if (!res.ok) {
    throw new Error(
      `[loadData] 加载失败 ${key}: ${res.status} ${res.statusText} (${url})`
    );
  }
  return res.json() as Promise<T>;
}

/** 把路径里的 {key} 占位符替换成实际值 */
function replaceParams(url: string, params: Record<string, string>): string {
  return url.replace(/\{(\w+)\}/g, (m, name) => params[name] ?? m);
}

/** 请求配置（需要鉴权时在此加 headers） */
function apiRequest(): RequestInit {
  return {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      // Authorization: `Bearer ${YOUR_TOKEN}`,
    },
  };
}
