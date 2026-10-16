/**
 * 面板 —— 线路满载率管控（全宽独占布局）
 *
 * 参考图：每条线路一列、每站一行，横向彩条 + 数值，红/黄/绿表示拥挤程度。
 * 全宽模式下所有线路并列（每条线一列），列头为线路名，横向滚动浏览全部线路。
 * 任何线路、任何站数都能放下。
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

export default function LineLoadPanel() {
  const [data, setData] = useState<LineLoadData | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          {data.lines.map((l) => (
            <div className="ll-col" key={l.id}>
              <div className="ll-col-head" style={{ borderColor: l.color }}>
                <i className="ll-col-line" style={{ background: l.color }} />
                <span>{l.name}</span>
              </div>
              <div className="ll-col-body">
                {l.stations.map((s) => {
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
          ))}
        </div>
      </div>
    </div>
  );
}
