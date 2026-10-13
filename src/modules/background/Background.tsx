/**
 * 背景模块 —— 纯 CSS/Canvas 科技大屏底图
 *
 * 组成：
 *   1. 深黑径向渐变底色（参考图采样：#020206，84% 暗像素）
 *   2. 透视网格地板（模版 grid.png 同效果，这里用 CSS 渐变实现，零图片依赖）
 *   3. 顶部蓝色光晕（参考图顶部 #04152E/#005EA9 蓝调）
 *
 * 独立性：零数据依赖、零外部依赖，单独放进任意页面即可运行。
 * 修改：改 Background.css 与 theme.ts 的 gridColor/background 即可。
 */

import { useMoveTo } from "@/hooks/useMoveTo";
import "./Background.css";

export default function Background() {
  const { ref } = useMoveTo<HTMLDivElement>({ direction: "toBottom", duration: 1.2 });

  return (
    <div className="dv-background" ref={ref}>
      <div className="dv-background__glow" />
      <div className="dv-background__grid" />
      <div className="dv-background__vignette" />
    </div>
  );
}
