# 中央地图模块 · MetroMap（真实地理地图）

城市真实地图（行政区划底图 + 真实经纬度线网）+ 枢纽 OD 流量光线特效。
当前内置 **北京** 与 **青岛** 两座城市，右上角一键切换。

## 效果

- **真实地图底图**：城市行政区划边界（DataV.GeoAtlas GeoJSON），青岛含真实海岸线；
  放大后淡入区县名。
- **线路**：全部站点按真实经纬度（Web 墨卡托投影）绘制，官方配色，暗色描边 + 发光；
  环线（2/10 号线）首尾闭合。
- **站点**：普通站小圆点（随所属线路配色），换乘站金色大圆点（数据里 `transfer: true`）。
- **站名 LOD（随缩放分级显示）**：
  - 缩到最小（≤0.8× 初始视野）：只显示 8 个**随机抽样**的站点（分层抽样，空间上打散），全部带站名；
  - 中间层级：全部站点显示为圆点，仅换乘站显示站名；
  - 放大（≥1.6×）：**视野内出现的站点全部显示站名**（网格去重防止重叠）。
- **OD 光线**：从枢纽（北京·天安门西 / 青岛·五四广场）向各站发射弧形流光，
  流光虚线滚动 + 光点沿线移动 + 终点呼吸闪烁，线宽/亮度按流量分级。
- **站点可点击**：点击任意站点弹出信息卡——
  - 显示站名与途经线路（线路色描边徽章）；
  - **自定义颜色**：站点颜色（8 色快捷色板 + 原生取色器 + 恢复默认）、
    途经线路颜色（原生取色器 + 恢复官方色），即时生效并存 localStorage，刷新后保留。
- **交互**：滚轮/双击/按钮缩放（以指针为锚）、拖拽平移、视野限制在城市范围内、Esc 关闭弹窗。

## 文件结构

```
metro-map/
├── MetroMap.tsx      # 数据加载 + 城市切换按钮 + 错误态
├── GeoMapView.tsx    # SVG 渲染（投影/底图/线路/站点/标签/OD）+ 交互 + 弹窗挂载
├── StationPopup.tsx  # 站点信息卡（自定义颜色 UI）
├── colors.ts         # 站点/线路颜色覆盖（localStorage 持久化）
├── projection.ts     # Web 墨卡托投影 + 平移/缩放视图变换（零依赖）
├── MetroMap.css
└── README.md
```

## 复用

```tsx
import MetroMap from "@/modules/metro-map/MetroMap";

<div style={{ position: "relative", width: 800, height: 600 }}>
  <MetroMap />
</div>;
```

组件 `position: absolute; inset: 0` 自适配父容器尺寸，放进任意尺寸的定位容器即可。

## 修改

### 切城市 / 只显示部分线路 / OD 开关

`src/config/map.ts`：

```ts
export const mapConfig = {
  city: "beijing",            // 初始城市（"beijing" | "qingdao"）
  visibleLines: null,         // ["M1","M2"] 只画这几条；null = 全部
  od: { enabled: true },
};
```

运行时切换城市用地图右上角的「北京 / 青岛」按钮（城市清单在 `MetroMap.tsx` 的 `CITIES`）。

### 缩放 LOD 参数

`GeoMapView.tsx` 顶部常量：

```ts
const K_MIN = 0.5;      // 缩放下限（1 = 全城铺满视野）
const K_MAX = 16;       // 缩放上限
const SAMPLE_K = 0.8;   // ≤ 此缩放进入"随机抽样"模式
const FULL_K = 1.6;     // ≥ 此缩放显示视野内全部站名
const SAMPLE_COUNT = 8; // 抽样模式的站点数
const LABEL_CELL = 78;  // 站名防重叠网格边长（px）
```

### 改 OD 光线

城市数据文件里的 `od` 字段（hub + flows，真实经纬度），动画参数在 `GeoMapView.tsx` 的 `OD_ANIM`。

### 改配色

- 线路官方色：`data/metro-cities/<城市>.json` 的 `lines[].color`；
- 站点默认色规则在 `GeoMapView.tsx` 的 `stationColor()`（换乘金色 / 普通站随线路色）；
- 运行时改色直接在地图上点击站点操作（localStorage 持久化，"恢复"按钮还原官方色）。

## 数据/API

数据走 `loadData("metroCity", { city })`：

| 数据 | local 模式 | api 模式 |
|---|---|---|
| `metroCity` | `data/metro-cities/<city>.json` | `/api/metro/city/<city>` |

底图边界 GeoJSON 按 JSON 里的 `boundary` 字段由前端直接 fetch（local 模式下是
`data/metro-cities/geo/` 内的静态文件）。数据格式与核验说明见 `data/metro-cities/README.md`。

## 坐标系

真实经纬度（WGS84），模块内 `projection.ts` 做 Web 墨卡托投影；视图状态只存
「世界中心 + 缩放倍数」，窗口尺寸变化自动保持视野中心。

## 单独移植

依赖：`src/config/{theme,data-source,map}`、`src/hooks/useSize`。
纯 SVG + 手写投影/交互，**零 Three.js / 零地图 SDK / 零第三方地图依赖**（Three.js 没有必要——
本需求是 2D 真实地理底图，SVG 在清晰度、可点击性、包体上都更优）。
