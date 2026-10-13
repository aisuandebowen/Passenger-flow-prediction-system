/**
 * useMoveTo —— 入场方向动画（复用自参考模版 sc-datav/src/hooks/useMoveTo.ts）
 *
 * 从指定方向滑入并淡入，用于各面板/侧边栏的入场效果。
 * 返回 { ref, restart, reverse }，把 ref 挂到要动画的元素上即可。
 */

import { useCallback, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";

export type Direction = "toBottom" | "toTop" | "toLeft" | "toRight";

const TRANSFORM_FROM: Record<Direction, string> = {
  toTop: "translate(0px, 100%)",
  toBottom: "translate(0px, -100%)",
  toLeft: "translate(100%, 0px)",
  toRight: "translate(-100%, 0px)",
};

export interface MoveToOptions {
  direction: Direction;
  duration?: number;
  delay?: number;
  /** 是否创建后自动播放（默认 true）。设 false 则需手动调 restart()。 */
  autoPlay?: boolean;
}

export function useMoveTo<T = HTMLDivElement>(opts: MoveToOptions) {
  const { direction, duration = 0.8, delay = 0, autoPlay = true } = opts;
  const eleRef = useRef<T>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  // 用 useCallback 固定引用：否则每次渲染返回新函数，下游 useEffect 会误以为依赖变化而重播动画
  const restart = useCallback((includeDelay = true) => {
    tweenRef.current?.restart(includeDelay);
  }, []);
  const reverse = useCallback(() => {
    tweenRef.current?.reverse();
  }, []);

  useLayoutEffect(() => {
    if (!eleRef.current) return;

    // 测试/截图口子：URL 带 ?noanim=1 时跳过动画，直接终态
    if (typeof window !== "undefined" && /[?&]noanim=1/.test(window.location.search)) {
      gsap.set(eleRef.current, { opacity: 1, transform: "translate(0px, 0px)" });
      return;
    }

    tweenRef.current = gsap.fromTo(
      eleRef.current,
      { opacity: 0, transform: TRANSFORM_FROM[direction] },
      { opacity: 1, transform: "translate(0px, 0px)", duration, delay }
    );
    if (!autoPlay) tweenRef.current.pause();

    return () => {
      tweenRef.current?.kill();
    };
  }, [direction, duration, delay, autoPlay]);

  return { ref: eleRef, restart, reverse };
}

export default useMoveTo;
