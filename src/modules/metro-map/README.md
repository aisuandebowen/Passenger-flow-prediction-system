# 中央地图模块 · MetroMap

城市地铁线网图（SVG）+ 枢纽 OD 流量光线特效。

## 效果

- **线路**：按官方线网图的真实走向绘制（北京 30 条线路、447 站、104 个换乘站，官方配色）
- **站点**：普通站小圆点，换乘站金色大圆点（数据里 `transfer: true` 标记）
- **站名**：只显示数据里 `label: true` 的站点，其余只画点，避免拥挤
- **OD 光线**：从枢纽（北京默认「天安门西」）向各站发射弧形流光：
  - 流光虚线持续滚动（SMIL 动画，零依赖）
  - 每条线 2 个光点沿线移动（错相），终点呼吸闪烁
  - 线宽/亮度按 `value`（流量）大小分级
- **枢纽**：脉冲发光 + 白色核心 + 标签

## 两种渲染模式

每座城市在自己的数据文件里指定 `mode`：

- `vector`：用 JSON 里的线路折线 + 站点坐标绘制（北京，清晰、可过滤线路）
- `image`：直接把一张线网图整图贴上当背景（青岛等暂无矢量数据的城市）

## 复用

```tsx
import MetroMap from "@/modules/metro-map/MetroMap";

<div style={{ position: "relative", width: 800, height: 600 }}>
  <MetroMap />
</div>;
```

组件 `position: absolute; inset: 0` 自适配父容器尺寸（ResizeObserver 自动重算视口），放进任意尺寸的定位容器即可。

## 修改

### 切城市 / 只显示部分线路

`src/config/map.ts`：

```ts
export const mapConfig = {
  city: "beijing",                    // data/metro-cities/ 下的文件名
  visibleLines: null,                 // ["M1","M2"] 只画这几条；null = 全部
  od: { enabled: true, hub: "天安门西" },
};
```

线路 id、城市数据格式见 `data/metro-cities/README.md`。

### 改 OD 光线

城市数据文件里的 `od` 字段：

```jsonc
{ "hub": { "name": "天安门西", "x": 824, "y": 727 },
  "flows": [ { "name": "西直门", "x": 698, "y": 554, "value": 8500 } ] }
```

- 换枢纽：改 `hub`（同时改 `mapConfig.od.hub`）
- 加/减光线：改 `flows` 数组
- `value` 越大光线越粗越亮（建议范围 2600–9000）

### 改 OD 动画参数

`MetroMap.tsx` 顶部的 `OD_ANIM`：

```ts
dashSpeed: 60,       // 流光滚动速度 px/秒，越大越快
dotsPerLine: 2,      // 每条线移动光点数
dotDuration: 3.2,    // 光点跑完一趟的秒数
```

### 改显示哪些站名

城市数据里每个站点的 `label` 字段（`true` 显示站名）。

### 改配色

`src/config/theme.ts`：`odLine`（光线色）、`station`（站点色）、`transferStation`（换乘站色）。

## 数据/API

数据走 `loadData("metroCity", { city })`：

| 数据 | local 模式 | api 模式 |
|---|---|---|
| `metroCity` | `data/metro-cities/<city>.json` | `/api/metro/city/<city>` |

接口返回城市 JSON 的完整结构即可。

## 坐标系

坐标是任意平面坐标系（x 向右增、y 向下增），不需要经纬度。模块自动算所有点的包围盒，
等比缩放居中到地图区。北京用的坐标取自真实线网图；图片模式的城市用图片像素坐标。

## 单独移植

依赖：`src/config/{theme,data-source,map}`、`src/hooks/useSize`。
SVG 渲染，无 Three.js / 无地图 SDK 依赖。

## 结构

```
metro-map/
├── MetroMap.tsx     # 组件（数据加载 + SVG 渲染 + OD 动画 + 城市适配）
├── MetroMap.css     # 样式（标签、错误态）
└── README.md
```
