# 北京地铁线网指挥系统 · 大屏可视化

参考模版：[sc-datav](https://github.com/knight-L/sc-datav)（Demo2）—— 复用了其配色、面板切角描边、入场方向动画、数字滚动、无缝滚动等技术，
中央地图为**真实地理地图**（行政区划边界底图 + 真实经纬度地铁线网），内置北京 / 青岛两座城市一键切换，
站点可点击、可自定义颜色，缩放分级显示站名（SVG 实现，零 Three.js / 零地图 SDK 依赖）。

## 快速开始

```bash
npm install
npm run dev      # 开发： http://localhost:5173
npm run build    # 打包到 dist/
npm run preview  # 预览打包结果
```

截图/测试时可加 `?noanim=1` 跳过入场动画（直接终态），例如 `http://localhost:5173/?noanim=1`。

## 中央地图

- **真实地图**：底图为城市行政区划边界（北京 16 区 / 青岛 10 区，含海岸线），数据来自 DataV.GeoAtlas；
  线路与站点全部使用真实经纬度（OpenStreetMap），并经官方渠道逐线核验（详见 `data/metro-cities/README.md`）。
- **城市切换**：地图右上角「北京 / 青岛」。
- **站点交互**：点击任意站点 → 信息卡（途经线路 + 自定义站点/线路颜色，localStorage 持久化）。
- **缩放分级**：滚轮/双击/按钮缩放 + 拖拽平移；缩到最小只显示随机抽样的几个站点，
  放大后视野内站点全部显示站名。

## 模块结构（全部独立、可单独复用）

```
code/
├── data/                      # 所有数据（外置，见下文）
├── src/
│   ├── config/                # 配置层（全局）
│   │   ├── theme.ts           # 颜色配置项
│   │   ├── layout.ts          # 布局/尺寸配置项
│   │   └── data-source.ts     # 数据源开关：local / api 一键切换
│   ├── components/            # 公共组件（PanelCard / Chart / NumberAnimation）
│   ├── hooks/                 # 公共 hook（useMoveTo / useSize）
│   ├── utils/autofit.ts       # 1920x1080 设计稿等比缩放
│   └── modules/               # 业务模块（各有 README）
│       ├── background/        # ① 背景模块
│       ├── header/            # ② 顶部标题栏
│       ├── sidebar/           # ③ 左侧悬浮侧边栏（3 大目录 × 3 小目录，全可折叠）
│       ├── metro-map/         # ④ 中央真实地图（北京/青岛线网 + 站点交互 + OD 光线）
│       └── panels/            # ⑤ 右侧悬浮面板（3 个独立小面板）
└── App.tsx                    # 主组装
```

每个 `modules/*/` 目录都有自己的 **README.md**，说明如何复用和修改。

## 数据：外置 + 一键切 API

所有数据在根目录 `data/` 下，与代码完全分离：

| 文件 | 内容 | 使用模块 |
|---|---|---|
| `metro-cities/beijing.json` | 北京 26 条线路、406 站（真实经纬度 + 官方线路色） | metro-map |
| `metro-cities/qingdao.json` | 青岛 8 条线路、176 站（真实经纬度 + 官方线路色） | metro-map |
| `metro-cities/geo/*.json` | 北京/青岛行政区划边界底图（DataV.GeoAtlas） | metro-map |
| `sidebar-menus.json` | 侧边栏菜单（3×3） | sidebar |
| `panel1-line-rank.json` | 线路客运量排行 | panels/panel1 |
| `panel2-transfer-radar.json` | 换乘站客流压力 | panels/panel2 |
| `panel3-alarms.json` | 实时告警列表 | panels/panel3 |
| `panel4-trend.json` | 全网客流趋势（预留） | — |

**切换 API 只需一步**：打开 `src/config/data-source.ts`，把

```ts
export const DATA_MODE: DataMode = "local";
```

改成

```ts
export const DATA_MODE: DataMode = "api";
```

然后在同文件的 `API_ENDPOINTS` 里填上你的接口地址。接口只需返回与 JSON 文件相同结构的数据，**无需改动任何模块代码**。

> 数据结构说明见 `data/README.md`。

## 配置项

- **颜色**：`src/config/theme.ts`（同时映射为 CSS 变量，写在 `src/index.css` 的 `:root`）
- **布局/尺寸**：`src/config/layout.ts`（侧栏宽度、面板宽度、地图区留白、动画时长…）

改这两个文件即可全局生效，不用动模块。

## 模块悬浮与不遮挡

按需求，侧边栏与右侧面板均为 `position: absolute` 悬浮层：

- 中央地图区由 `layout.mapArea` 约束（左 88px / 右 452px），始终只在两侧之间的区域绘制
- 侧边栏折叠后宽度仅 56px，地图区左边界 88px，折叠/展开都不会遮挡地图核心区
- 各层 z-index：背景 0 < 地图 1 < 侧栏/面板 20 < 标题栏 30
