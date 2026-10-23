/**
 * 预测时间轴 —— 节假日/大型活动场景的核心展示模块
 *
 * 一条横向时间线，从"今天"延伸到"活动/节日当天"，标注预测关键节点：
 *   客流开始爬升 → 进入高峰 → 预测峰值 → 散场脉冲 → 客流回落
 *
 * 与线网管理的"空间叙事（地图）"不同，这里是"时间叙事"——这是本页的差异化核心。
 *
 * 组成：
 *   - 横向主线（带粒子流光，呼应地图 OD 光效风格）
 *   - 节点（每个节点有时刻 + 名称 + 预测值）
 *   - 峰值锚点（最大节点高亮 + 脉冲）
 *   - 点击节点 → 右侧详情面板联动（onSelectNode 回调）
 *
 * 数据：来自 scene-detail.json 的 timeline 数组（经 loadData 加载，可切 API）。
 */

import { useMemo, useState } from "react";
import { theme } from "@/config/theme";
import type { SceneHourly, SceneTimelineNode } from "./types";
import SceneHourlyChart from "./SceneHourlyChart";
import "./SceneTimeline.css";

/** 从节点时刻标签里提取小时（0-23），供曲线联动；解析失败返回 null */
function parseHour(t: string): number | null {
  const m = t.match(/(\d{1,2}):\d{2}/);
  if (!m) return null;
  const h = Number(m[1]);
  return h >= 0 && h <= 23 ? h : null;
}

export default function SceneTimeline({
  title,
  date,
  venue,
  nodes,
  hourly,
  onSelectNode,
}: {
  /** 场景标题（如 "五一节客流预测"） */
  title: string;
  /** 日期（MM-DD） */
  date: string;
  /** 场馆（大型活动，可选） */
  venue?: string;
  /** 时间轴节点 */
  nodes: SceneTimelineNode[];
  /** 分时预测曲线数据（时间轴下方展示） */
  hourly?: SceneHourly;
  /** 点击节点回调（联动右侧面板） */
  onSelectNode?: (index: number) => void;
}) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const peakIdx = useMemo(() => nodes.findIndex((n) => n.peak), [nodes]);

  // 当前选中节点对应的小时（联动下方曲线打参考线）
  const highlightHour = useMemo(() => {
    if (activeIdx == null) return null;
    return parseHour(nodes[activeIdx].t);
  }, [activeIdx, nodes]);

  const handleClick = (i: number) => {
    const next = activeIdx === i ? null : i;
    setActiveIdx(next);
    onSelectNode?.(i);
  };

  return (
    <div className="scene-timeline">
      {/* 顶部：标题 + 日期/场馆 */}
      <div className="st-header">
        <div className="st-title">{title}</div>
        <div className="st-meta">
          {venue && <span className="st-venue">📍 {venue}</span>}
          <span className="st-date">{date}</span>
        </div>
      </div>

      {/* 横向时间线主区 */}
      <div className="st-track">
        {/* 主线（流光） */}
        <div className="st-line">
          <span className="st-line__flow" />
        </div>

        {/* 节点 */}
        <div className="st-nodes">
          {nodes.map((n, i) => {
            const isPeak = n.peak;
            const isActive = activeIdx === i;
            return (
              <button
                key={`${n.t}-${i}`}
                className={`st-node ${isPeak ? "st-node--peak" : ""} ${isActive ? "st-node--active" : ""}`}
                onClick={() => handleClick(i)}
                style={{ left: `${(i / (nodes.length - 1)) * 100}%` }}
              >
                {/* 节点圆点 + 脉冲 */}
                <span className="st-node__dot">
                  {isPeak && <span className="st-node__pulse" />}
                </span>
                {/* 时刻 */}
                <span className="st-node__time">{n.t}</span>
                {/* 名称 + 预测值 */}
                <span className="st-node__label">{n.label}</span>
                <span className="st-node__value">{n.value}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 底部：分时预测曲线（与时间轴联动） */}
      {hourly && (
        <div className="st-chart">
          <div className="st-chart__title">
            <span>当日分时客流预测</span>
            <span className="st-chart__unit">单位：人次</span>
          </div>
          <div className="st-chart__body">
            <SceneHourlyChart hourly={hourly} highlightHour={highlightHour} />
          </div>
        </div>
      )}

      {/* 底部图例 */}
      <div className="st-footer">
        <span className="st-footer__item">
          <span className="st-footer__dot st-footer__dot--start" /> 今天（当前）
        </span>
        <span className="st-footer__item">
          <span className="st-footer__dot st-footer__dot--peak" /> 预测峰值
        </span>
        <span className="st-footer__item">点击节点查看该时刻预测详情</span>
      </div>
    </div>
  );
}
