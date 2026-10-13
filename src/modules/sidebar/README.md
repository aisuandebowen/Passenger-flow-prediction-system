# 侧边栏模块 · Sidebar

悬浮式可折叠导航：**3 个大目录，每个下 3 个小目录，全部可折叠**；整栏也可折叠（折叠后仅 56px 宽，不遮挡中央）。

## 复用

```tsx
import Sidebar from "@/modules/sidebar/Sidebar";

<div style={{ position: "relative" }}>
  <Sidebar onSelect={(id) => console.log("选中", id)} />
</div>;
```

- 组件 `position: absolute` 悬浮，放在定位父容器内即可
- `onSelect` 回调返回被点的小目录 id（如 `"realtime"`），在此接路由或数据刷新

## 交互

| 操作 | 效果 |
|---|---|
| 点击右上角 «/» 按钮 | 整栏折叠/展开（折叠后只留图标列） |
| 点击大目录标题 | 展开/收起该组的小目录（其余组不受影响） |
| 点击小目录 | 选中该项（高亮），触发 `onSelect` |

默认展开第一个大目录。

## 修改

### 1. 改菜单内容（最常用）

菜单是**数据驱动**的，改 `data/sidebar-menus.json` 即可：

```jsonc
[
  { "id": "monitor", "title": "客流监测", "icon": "chart",
    "children": [ { "id": "realtime", "title": "实时客流" }, ... ] }
]
```

- 增删一组：在数组里加/删一个对象
- 增删小目录：改 `children` 数组
- `icon` 可选值：`chart` / `network` / `alert`（在 `Sidebar.tsx` 的 `ICONS` 里加新图标的 SVG path 即可扩展）
- 折叠态下鼠标悬停会显示 title 提示

### 2. 改尺寸/位置

`src/config/layout.ts` 的 `sidebar` 段：

```ts
width: 268,          // 展开宽度
collapsedWidth: 56,  // 折叠宽度
top: 96, left: 16, bottom: 24,
itemHeight: 44,      // 大目录行高
subItemHeight: 38,   // 小目录行高
```

### 3. 改配色

`src/theme.ts`：`sidebarActive`（选中态）、`primary`（悬停底色）；CSS 里的边框/底色在 `Sidebar.css`。

## 数据/API

数据通过 `loadData("sidebarMenus")` 加载（见 `src/config/data-source.ts`）：

- `DATA_MODE='local'` → 读 `data/sidebar-menus.json`
- `DATA_MODE='api'` → 请求 `API_ENDPOINTS.sidebarMenus`

接口返回同样结构的数组即可。

## 单独移植

依赖只有：`src/config/{theme,layout,data-source}`、`src/hooks/useMoveTo`。
把 `sidebar/` 目录连同这三个依赖拷走即可独立运行。

## 结构

```
sidebar/
├── Sidebar.tsx     # 组件（状态：折叠/展开组/选中项）
├── Sidebar.css     # 全部样式
└── README.md
```
