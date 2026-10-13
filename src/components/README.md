# 公共组件 & Hooks

各业务模块共用的基础件，与业务无关，可直接复用到其他项目。

## components/

### PanelCard.tsx / PanelCard.css

科技风切角面板卡片，复用参考模版 Demo2 的 SVG 切角描边 + 标题下划线装饰。

```tsx
import PanelCard from "@/components/PanelCard";

<PanelCard title="标题" extra={<span>右侧副信息</span>}>
  {/* 内容 */}
</PanelCard>;
```

- 组件 `position: absolute; inset: 0`，占满定位父容器
- 颜色全部来自 CSS 变量（`--dv-*`，定义在 `src/index.css`，源头是 `theme.ts`）
- 切角形状由内联 SVG（`viewBox="0 0 260 180"` + `preserveAspectRatio="none"`）拉伸得到，任意尺寸不变形

### Chart.tsx

ECharts 按需引入的封装（精简自模版），自动 resize。

```tsx
import { BarChart } from "echarts/charts";
import { GridComponent } from "echarts/components";
import Chart from "@/components/Chart";

<Chart<BarOption> use={[BarChart, GridComponent]} option={option} />;
```

- `use`：按需引入的 echarts 模块数组（减小包体积）
- `option`：ECharts 配置，`useMemo` 记忆，变化时自动 `setOption`
- 尺寸变化（ResizeObserver）自动 `resize()`

### NumberAnimation.tsx

数字滚动动画（元素进入视口时从 0 滚到目标值，gsap 驱动）。

```tsx
<NumberAnimation value={16608} style={{ color: "#3061DB" }} />;
```

## hooks/

### useMoveTo.ts

入场方向动画（模版同款思路）。

```tsx
const { ref, restart, reverse } = useMoveTo<HTMLDivElement>({
  direction: "toLeft",  // toLeft/toRight/toTop/toBottom
  duration: 0.8,
  delay: 0.2,
  autoPlay: true,       // false 时需手动调 restart()
});
return <div ref={ref}>...</div>;
```

**测试口子**：URL 带 `?noanim=1` 时跳过动画直接终态，便于截图/自动化测试。

### useSize.ts

ResizeObserver 监听元素尺寸，返回 `{ width, height }`。

```tsx
const ref = useRef<HTMLDivElement>(null);
const { width, height } = useSize(ref);
```

## utils/

### autofit.ts

1920×1080 设计稿等比缩放（`useAutoFit()` 返回 `{ scale, offsetX, offsetY }`）。
在 `App.tsx` 里作为最外层容器的 transform，保证大屏在任何分辨率下比例正确且居中。

## config/

| 文件 | 作用 |
|---|---|
| `theme.ts` | 全局颜色配置项（同时映射为 CSS 变量） |
| `layout.ts` | 全局尺寸/位置/动画配置项 |
| `data-source.ts` | 数据源总开关（local / api 一键切换） |
