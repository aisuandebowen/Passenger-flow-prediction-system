# 右侧面板模块 · Panels

3 个悬浮面板（纵向等高排列），**每个面板是一个完全独立的小模块**，各自管理自己的数据、图表、错误处理。

```
panels/
├── Panels.tsx                # 容器：定位 + 尺寸分配 + 入场动画编排
├── Panels.css
├── panel1/                   # 小面板 1：线路客运量排行（横向条形图）
│   └── LineRankPanel.tsx
├── panel2/                   # 小面板 2：换乘站客流压力（雷达图）
│   └── TransferRadarPanel.tsx
├── panel3/                   # 小面板 3：实时告警（无缝滚动列表）
│   ├── AlarmListPanel.tsx
│   └── AlarmListPanel.css
├── panels-shared.css         # 公共：加载中/失败提示样式
└── README.md
```

## 复用整个面板区

```tsx
import Panels from "@/modules/panels/Panels";

<div style={{ position: "relative" }}>
  <Panels />
</div>;
```

容器 `position: absolute`，钉在父容器右侧（`right/top/bottom` 由 `layout.ts` 的 `panels` 段配置）。

## 复用单个小面板

每个小面板都是自包含的，单独引：

```tsx
import LineRankPanel from "@/modules/panels/panel1/LineRankPanel";

<div style={{ position: "relative", width: 420, height: 300 }}>
  <LineRankPanel />
</div>;
```

小面板内部用 `PanelCard`（切角描边卡片，见 `src/components/PanelCard.tsx`）包了一层，
所以它会自动占满父容器。直接给个定位父容器 + 尺寸即可。

## 修改

### 换掉某个面板的内容（最常见）

每个小面板就是一个 `.tsx` 文件，改它的 ECharts `option` 即可——比如把 panel1 从条形图换成折线图：

```tsx
// panel1/LineRankPanel.tsx
const option: LineOption = { /* 你的新配置 */ };
return <PanelCard title="新标题"><Chart<LineOption> use={[LineChart, ...]} option={option} /></PanelCard>;
```

其余两个面板完全不受影响。

### 加第 4 个面板

1. 新建 `panel4/YourPanel.tsx`（照抄任一现有面板的结构）
2. 在 `data/` 加对应 JSON，在 `data-source.ts` 的 `LOCAL_PATHS` / `API_ENDPOINTS` 注册一个 key
3. 在 `Panels.tsx` 里引一次，加一个 `<div className="panels__item">`

容器是 `flex` 纵向均分，加几个面板都会自动等高排列。

### 改面板数据

每个面板对应一个 `data/panel*.json`，结构见 `data/README.md`。改 JSON 即时生效。

### 改尺寸/位置

`src/config/layout.ts` 的 `panels` 段：

```ts
width: 420, top: 96, right: 16, bottom: 24, gap: 18,
```

### 改配色

`src/config/theme.ts`：`primary`（图表主色/进度条）、`accent`（高亮）、`level.danger/warning/normal`（告警级别色）。

## 各面板说明

| 面板 | 内容 | 数据 | 图表技术 |
|---|---|---|---|
| panel1 | 线路客运量排行（含今日累计数字滚动） | `panel1-line-rank.json` | ECharts 横向条形图 |
| panel2 | 换乘站客流压力（当前 vs 早高峰） | `panel2-transfer-radar.json` | ECharts 雷达图 |
| panel3 | 实时告警（悬停暂停的无缝滚动表） | `panel3-alarms.json` | 自研虚拟滚动 |

### panel3 无缝滚动说明

内容列表复制一份首尾相接，`requestAnimationFrame` 以 26px/秒持续上移，
走完一份长度时瞬间归零（视觉无接缝）。鼠标悬停暂停。

要改滚动速度：`AlarmListPanel.tsx` 里的 `offsetRef.current += dt * 26`。

## 数据/API

每个面板各自调 `loadData("panel1" | "panel2" | "panel3")`：

- `DATA_MODE='local'` → 读 `data/panel*.json`
- `DATA_MODE='api'` → 请求 `API_ENDPOINTS.panel1/2/3`

接口返回与 JSON 相同结构即可。

## 单独移植

单个面板依赖：`src/components/{PanelCard,Chart,NumberAnimation}`、`src/config/{theme,data-source}`、`src/hooks/*`。
拷走面板目录 + 这些公共件即可独立运行。
