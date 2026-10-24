/**
 * 面板 —— 线路满载率管控（全宽独占布局）
 *
 * 参考图：每条线路一列、每站一行，横向彩条 + 数值，红/黄/绿表示拥挤程度。
 * 全宽模式下所有线路并列（每条线一列），列头为线路名，横向滚动浏览全部线路。
 * 任何线路、任何站数都能放下。
 *
 * 排序：每条线路列头右侧一组 ▲/▼ 按钮，按满载率升/降序独立排序；
 *   再点一次当前激活方向即恢复原始站序。
 *
 * 颜色阈值（可改）：
 *   load < 80   → 绿（宽松）
 *   80 ≤ load ≤ 100 → 黄（接近饱和）
 *   load > 100  → 红（超载/拥挤）
 *
 * 数据：data/line-load.json，经 loadData('lineLoad') 读取；
 *   API 模式下接口返回同结构即可，模块代码零改动。
 */

import { useEffect, useMemo, useState } from "react";
import { loadData } from "@/config/data-source";
import "./LineLoadPanel.css";

interface LoadStation {
  name: string;
  /** 满载率（%），>100 表示超载 */
  load: number;
}
interface LoadLine {
  id: string;
  name: string;
  color: string;
  stations: LoadStation[];
}
interface LineLoadData {
  title: string;
  unit: string;
  lines: LoadLine[];
}

/** 满载率分色阈值 */
const YELLOW_FROM = 80;
const RED_FROM = 100;
const GREEN = "#4ade80";
const YELLOW = "#ffd166";
const RED = "#f87171";

function loadColor(load: number): string {
  if (load > RED_FROM) return RED;
  if (load >= YELLOW_FROM) return YELLOW;
  return GREEN;
}

/** 单列排序方向（undefined = 原始站序） */
type SortDir = "asc" | "desc";

export default function LineLoadPanel() {
  const [data, setData] = useState<LineLoadData | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 每条线路独立的排序方向（key = 线路 id）
  const [sorts, setSorts] = useState<Record<string, SortDir | undefined>>({});

  // 点击同向按钮 = 取消排序恢复站序；异向按钮 = 切换方向
  const toggleSort = (lineId: string, dir: SortDir) =>
    setSorts((prev) => ({ ...prev, [lineId]: prev[lineId] === dir ? undefined : dir }));

  useEffect(() => {
    loadData<LineLoadData>("lineLoad")
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  // 全量统计：超载/接近饱和线路数
  const totals = useMemo(() => {
    if (!data) return null;
    let red = 0;
    let yellow = 0;
    let stations = 0;
    for (const l of data.lines) {
      for (const s of l.stations) {
        if (s.load > RED_FROM) red++;
        else if (s.load >= YELLOW_FROM) yellow++;
      }
      stations += l.stations.length;
    }
    return { red, yellow, stations };
  }, [data]);

  if (error)
    return (
      <div className="ll-panel">
        <div className="panel-error">加载失败：{error}</div>
      </div>
    );

  if (!data || !totals)
    return (
      <div className="ll-panel">
        <div className="panel-loading">加载中…</div>
      </div>
    );

  return (
    <div className="ll-panel">
      {/* 标题栏 */}
      <div className="ll-head">
        <span className="ll-title">{data.title}</span>
        <div className="ll-legend">
          <span>
            <i style={{ background: GREEN }} />宽松 &lt;{YELLOW_FROM}
          </span>
          <span>
            <i style={{ background: YELLOW }} />接近饱和 {YELLOW_FROM}–{RED_FROM}
          </span>
          <span>
            <i style={{ background: RED }} />超载 &gt;{RED_FROM}
          </span>
        </div>
        <span className="ll-stats">
          共 {data.lines.length} 线 {totals.stations} 站
          <i className="ll-dot" style={{ background: RED }} />
          {totals.red}
          <i className="ll-dot" style={{ background: YELLOW }} />
          {totals.yellow}
        </span>
      </div>

      {/* 所有线路并列：横向滚动 */}
      <div className="ll-scroll">
        <div className="ll-columns">
          {data.lines.map((l) => {
            const dir = sorts[l.id];
            // 排序在副本上进行；stable sort 保证同满载率时保持原站序
            const stations = dir
              ? [...l.stations].sort((a, b) => (dir === "desc" ? b.load - a.load : a.load - b.load))
              : l.stations;
            return (
              <div className="ll-col" key={l.id}>
                <div className="ll-col-head" style={{ borderColor: l.color }}>
                  <i className="ll-col-line" style={{ background: l.color }} />
                  <span>{l.name}</span>
                  <span className="ll-sort">
                    <button
                      type="button"
                      className={dir === "asc" ? "is-active" : ""}
                      aria-pressed={dir === "asc"}
                      aria-label={`${l.name}按满载率升序`}
                      title="按满载率升序（再点恢复站序）"
                      onClick={() => toggleSort(l.id, "asc")}>
                      <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
                        <path d="M4 1 7 6.4H1Z" fill="currentColor" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={dir === "desc" ? "is-active" : ""}
                      aria-pressed={dir === "desc"}
                      aria-label={`${l.name}按满载率降序`}
                      title="按满载率降序（再点恢复站序）"
                      onClick={() => toggleSort(l.id, "desc")}>
                      <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
                        <path d="M4 7 1 1.6h6Z" fill="currentColor" />
                      </svg>
                    </button>
                  </span>
                </div>
                <div className="ll-col-body">
                  {stations.map((s) => {
                    const color = loadColor(s.load);
                    const pct = Math.min(100, s.load);
                    return (
                      <div className="ll-row" key={s.name}>
                        <span className="ll-station">
                          {s.name}
                          <i className="ll-tip">{s.name}</i>
                        </span>
                        <div className="ll-bar-track">
                          <div
                            className="ll-bar"
                            style={{
                              width: `${pct}%`,
                              background: `linear-gradient(90deg, ${color}44, ${color})`,
                            }}
                          />
                          <i className="ll-bar-mark" />
                        </div>
                        <span className="ll-value" style={{ color }}>
                          {s.load}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
