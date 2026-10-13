/**
 * 自动适配缩放 —— 把设计稿(1920x1080)等比缩放到当前屏幕。
 *
 * 原理：根容器 fixed 定位 + transform: scale，居中放置。
 * 与参考模版 autofit.js 同思路，但零依赖、逻辑透明。
 */

import { useLayoutEffect, useState } from "react";
import { layout } from "@/config/layout";

export interface FitResult {
  /** 缩放比例 */
  scale: number;
  /** 横向偏移（居中用） */
  offsetX: number;
  /** 纵向偏移 */
  offsetY: number;
}

export function computeFit(viewW: number, viewH: number): FitResult {
  const { designWidth, designHeight } = layout;
  const scale = Math.min(viewW / designWidth, viewH / designHeight);
  return {
    scale,
    offsetX: (viewW - designWidth * scale) / 2,
    offsetY: (viewH - designHeight * scale) / 2,
  };
}

/** hook：监听窗口尺寸变化，返回当前缩放参数 */
export function useAutoFit() {
  const [fit, setFit] = useState<FitResult>(() =>
    computeFit(window.innerWidth, window.innerHeight)
  );

  useLayoutEffect(() => {
    const onResize = () =>
      setFit(computeFit(window.innerWidth, window.innerHeight));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return fit;
}
