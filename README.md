# 北京地铁线网指挥系统 · 大屏可视化

参考模版：[sc-datav](https://github.com/knight-L/sc-datav)（Demo2）—— 复用了其配色、面板切角描边、入场方向动画、数字滚动、无缝滚动等技术，
中央地图改为北京地铁线网图 + 天安门 OD 流量光线（SVG 实现，零 Three.js 依赖）。

## 快速开始

```bash
npm install
npm run dev      # 开发： http://localhost:5173
npm run build    # 打包到 dist/
npm run preview  # 预览打包结果
```

截图/测试时可加 `?noanim=1` 跳过入场动画（直接终态），例如 `http://localhost:5173/?noanim=1`。

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
│       ├── metro-map/         # ④ 中央北京地铁线网图 + OD 光线
│       └── panels/            # ⑤ 右侧悬浮面板（3 个独立小面板）
└── App.tsx                    # 主组装
```

每个 `modules/*/` 目录都有自己的 **README.md**，说明如何复用和修改。

## 数据：外置 + 一键切 API

所有数据在根目录 `data/` 下，与代码完全分离：

| 文件 | 内容 | 使用模块 |
|---|---|---|
| `metro-lines.json` | 19 条线路、340 个站点（站名+经纬度+线路色） | metro-map |
| `od-flows.json` | 天安门西 → 42 站的 OD 流量 | metro-map |
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
