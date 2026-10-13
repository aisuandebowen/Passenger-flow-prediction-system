# 背景模块 · Background

科技大屏底图：深黑径向渐变 + 透视网格地板 + 顶部蓝色光晕 + 四角暗角。

**零依赖、零数据**，单独拷走 `Background.tsx` + `Background.css` 即可用在任意页面。

## 复用

```tsx
import Background from "@/modules/background/Background";

<div style={{ position: "relative", width: "100vw", height: "100vh" }}>
  <Background />
  {/* 你的内容放在上面 */}
</div>;
```

模块是 `position: absolute; inset: 0`，所以父容器需要是定位元素（relative/absolute/fixed）。

## 修改

| 想改什么 | 改哪里 |
|---|---|
| 底色/渐变 | `Background.css` 的 `.dv-background`（radial-gradient），或 `theme.ts` 的 `background` |
| 网格线颜色/密度 | `theme.ts` 的 `gridColor` + CSS 的 `background-size: 64px 64px` |
| 网格倾斜角度 | CSS 的 `transform: perspective(640px) rotateX(58deg)` |
| 顶部光晕强度 | CSS 的 `.dv-background__glow`（改 radial-gradient 的透明度） |
| 暗角深浅 | CSS 的 `.dv-background__vignette` |

## 入场动画

模块自带从上滑入的淡入动画（`useMoveTo`，1.2s）。不想要动画：把 `Background.tsx` 里的 `useMoveTo` 调用删掉，直接渲染最外层 div 即可。

## 结构

```
background/
├── Background.tsx   # 组件（仅组合三个层）
├── Background.css   # 全部样式
└── README.md
```
