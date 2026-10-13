/**
 * Vite 内置 API mock 中间件
 *
 * 作用：DATA_MODE='api' 时，让 dev/preview 服务器直接响应 data-source.ts 里
 * API_ENDPOINTS 配置的那些接口，返回 data/ 下对应的 JSON。
 * 这样无需启动任何后端，就能完整验证 API 链路。
 *
 * 接入真实后端时：在 vite.config.ts 里删掉 api-mock 插件，并删掉本文件即可。
 */

import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** 接口路径 -> 本地 JSON 文件（与 data-source.ts 的 API_ENDPOINTS 一一对应） */
const ROUTES = {
  "/api/sidebar/menus": "sidebar-menus.json",
  "/api/panels/line-rank": "panel1-line-rank.json",
  "/api/panels/transfer-radar": "panel2-transfer-radar.json",
  "/api/panels/alarms": "panel3-alarms.json",
  "/api/panels/trend": "panel4-trend.json",
};

/** 城市接口：/api/metro/city/<cityId> -> data/metro-cities/<cityId>.json */
const CITY_PREFIX = "/api/metro/city/";

const DATA_DIR = resolve(__dirname, "data");

/** 模拟网络延迟（毫秒），让加载态/动画可见 */
const MOCK_LATENCY = 250;

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  });
  res.end(payload);
}

export function createMockApiMiddleware() {
  return async (req, res, next) => {
    const url = req.url ?? "";
    const path = url.split("?")[0].replace(/\/+$/, "");

    // 城市接口：按 URL 末段的 cityId 读对应 JSON
    if (path.startsWith(CITY_PREFIX)) {
      const cityId = path.slice(CITY_PREFIX.length).replace(/[^a-zA-Z0-9_-]/g, "");
      if (!cityId) return next();
      await new Promise((r) => setTimeout(r, MOCK_LATENCY));
      try {
        const abs = resolve(DATA_DIR, "metro-cities", `${cityId}.json`);
        const buf = await readFile(abs, "utf-8");
        sendJson(res, 200, JSON.parse(buf));
      } catch (e) {
        sendJson(res, 404, { error: "city not found", message: e.message });
      }
      return;
    }

    const file = ROUTES[path];
    if (!file) return next();

    await new Promise((r) => setTimeout(r, MOCK_LATENCY));

    try {
      const abs = resolve(DATA_DIR, file);
      const buf = await readFile(abs, "utf-8");
      sendJson(res, 200, JSON.parse(buf));
    } catch (e) {
      sendJson(res, 500, { error: "mock read failed", message: e.message });
    }
  };
}
