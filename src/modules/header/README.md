# 顶部标题栏模块 · Header

参考模版 Demo2 同款 SVG 描边标题 + 两侧装饰线 + 实时时钟。

## 复用

```tsx
import Header from "@/modules/header/Header";

<Header title="你的标题" subtitle="YOUR SUBTITLE" />;
```

组件是 `position: absolute; top: 0` 全宽悬浮，直接放进定位父容器即可。

## 修改

| 想改什么 | 改哪里 |
|---|---|
| 标题文字 | 组件 props `title` / `subtitle`，或直接改 `Header.tsx` 的默认值 |
| 标题大小/间距 | `Header.tsx` 里 SVG `<text>` 的 fontSize / letterSpacing |
| 描边色/填充色 | SVG 里的 `stroke="#3061DB"` 与 `fill="#e8efff"`（建议改 theme.ts） |
| 时钟位置/字号 | `Header.css` 的 `.header__time` / `.header__clock` |
| 高度 | `layout.ts` 的 `headerHeight`（标题栏高度由此驱动） |

## 数据

本模块无数据依赖（时钟取本机时间）。标题文字作为 props 传入，属于配置而非数据。

## 结构

```
header/
├── Header.tsx    # 组件（SVG 标题 + 时钟）
├── Header.css
└── README.md
```
