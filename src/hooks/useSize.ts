/**
 * useSize —— 监听元素尺寸变化（复用自参考模版，含兜底）
 *
 * 优先 ResizeObserver；同时用 offsetWidth/offsetHeight 做初始同步测量，
 * 并监听 window resize。这样在 ResizeObserver 回调被挂起的环境
 * （部分嵌入式浏览器/无头内核）里也能拿到正确尺寸。
 * 注意：offsetWidth/offsetHeight 是布局尺寸，与 contentRect 一样不受
 * 舞台 transform 缩放影响，适合作为 SVG viewBox / ECharts 的逻辑像素。
 */

import { useLayoutEffect, useState } from "react";

export function useSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    };

    measure();
    let observer: ResizeObserver | undefined;
    try {
      observer = new ResizeObserver(measure);
      observer.observe(el);
    } catch {
      /* 不支持 ResizeObserver 时退化为 resize 监听 */
    }
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [ref]);

  return size;
}

export default useSize;
