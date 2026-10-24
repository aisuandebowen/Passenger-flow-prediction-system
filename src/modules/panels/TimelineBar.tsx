/**
 * 时间轴回放条 —— 地图底部悬浮的 06:00–23:00 时刻回放控件
 *
 * 功能：
 *   - 展示当前时刻（拖动滑块 / 点击刻度 / 播放按钮自动推进）
 *   - 播放/暂停切换，播放时按固定间隔推进到下一时刻（到末尾自动回到起点）
 *   - 拖动时高亮当前时刻，联动趋势面板（markLine 竖线）与 KPI mini 趋势
 *
 * 数据：时刻序列（06:00–23:00，每小时一个点）与趋势面板 xAxis 对齐。
 * 状态：由父组件 App 传入 currentIndex + 回调，实现跨模块联动。
 */

import { useEffect, useRef, useState } from "react";
import { theme } from "@/config/theme";
import { FLOW_BY_HOUR, FLOW_HOURS } from "@/config/flow";
import "./TimelineBar.css";

const TIMES = [...FLOW_HOURS];

export default function TimelineBar({
  index,
  onChange,
  playing,
  onTogglePlay,
}: {
  /** 当前时刻索引（0–17，对应 TIMES） */
  index: number;
  /** 拖动/点击改变时刻回调 */
  onChange: (index: number) => void;
  /** 是否正在播放 */
  playing: boolean;
  /** 播放/暂停切换回调 */
  onTogglePlay: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  // 根据点击/拖动位置计算索引
  const indexFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, ratio));
    return Math.round(clamped * (TIMES.length - 1));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    onChange(indexFromClientX(e.clientX));
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    onChange(indexFromClientX(e.clientX));
  };

  const handlePointerUp = () => setDragging(false);

  const pct = (index / (TIMES.length - 1)) * 100;

  return (
    <div className="timeline">
      <button
        className="timeline__play"
        onClick={onTogglePlay}
        title={playing ? "暂停" : "播放"}
        aria-label={playing ? "暂停" : "播放"}>
        {playing ? (
          <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* 当前时刻读数：播放/拖动时实时变化 */}
      <div className="timeline__readout">
        <span className="timeline__readout-time">{TIMES[index]}</span>
        <span className="timeline__readout-flow">
          全网 {FLOW_BY_HOUR[index]} <small>万人次</small>
        </span>
      </div>

      <div
        className="timeline__track"
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}>
        {/* 刻度 */}
        {TIMES.map((t, i) => (
          <div
            key={t}
            className={`timeline__tick${i % 2 === 1 ? " is-minor" : ""}`}
            style={{ left: `${(i / (TIMES.length - 1)) * 100}%` }}
            onClick={() => onChange(i)}
          />
        ))}
        {/* 已走过的进度 */}
        <div className="timeline__progress" style={{ width: `${pct}%` }} />
        {/* 当前时刻滑块 */}
        <div className="timeline__thumb" style={{ left: `${pct}%` }} />
      </div>
    </div>
  );
}
