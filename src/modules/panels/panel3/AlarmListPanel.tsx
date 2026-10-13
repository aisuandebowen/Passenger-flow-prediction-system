/**
 * 小面板 3 —— 实时告警信息（无缝滚动虚拟列表）
 *
 * 独立模块：自带数据加载、无缝滚动、悬停暂停。
 * 数据：data/panel3-alarms.json，经 loadData('panel3') 读取。
 * 修改/替换：改本文件即可，不影响其他面板。
 *
 * 无缝滚动原理：内容列表复制一份首尾相接，requestAnimationFrame 持续上移，
 * 走完一份长度时瞬间归零；hover 时暂停。
 */

import { useEffect, useRef, useState } from "react";
import PanelCard from "@/components/PanelCard";
import { loadData } from "@/config/data-source";
import { theme } from "@/config/theme";
import "./AlarmListPanel.css";

interface AlarmRow {
  station: string;
  type: string;
  level: string;
  time: string;
  levelType: "danger" | "warning" | "normal";
}
interface Panel3Data {
  title: string;
  columns: { title: string; dataIndex: keyof AlarmRow; width: string; align?: string }[];
  data: AlarmRow[];
}

const ROW_HEIGHT = 34;

export default function AlarmListPanel() {
  const [data, setData] = useState<Panel3Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    loadData<Panel3Data>("panel3")
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  // 无缝滚动
  useEffect(() => {
    if (!data || data.data.length === 0) return;
    const half = data.data.length * ROW_HEIGHT; // 一份的长度

    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!pausedRef.current) {
        offsetRef.current += dt * 26; // 26px/秒
        if (offsetRef.current >= half) offsetRef.current -= half;
        if (bodyRef.current) {
          bodyRef.current.style.transform = `translateY(${-offsetRef.current}px)`;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [data]);

  if (error) return <PanelCard title="实时告警信息"><div className="panel-error">加载失败：{error}</div></PanelCard>;
  if (!data) return <PanelCard title="实时告警信息"><div className="panel-loading">加载中…</div></PanelCard>;

  const rows = [...data.data, ...data.data]; // 首尾相接

  return (
    <PanelCard
      title={data.title}
      extra={<span className="alarm-count">{data.data.length} 条</span>}>
      <div
        className="alarm-list"
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => (pausedRef.current = false)}>
        <div className="alarm-list__head">
          {data.columns.map((c) => (
            <div
              key={c.dataIndex}
              className="alarm-list__cell alarm-list__cell--head"
              style={{ width: c.width, textAlign: (c.align as "left" | "right") || "left" }}>
              {c.title}
            </div>
          ))}
        </div>
        <div className="alarm-list__viewport">
          <div className="alarm-list__body" ref={bodyRef}>
            {rows.map((row, i) => (
              <div className="alarm-list__row" key={i} style={{ height: ROW_HEIGHT }}>
                {data.columns.map((c) => {
                  const isLevel = c.dataIndex === "level";
                  return (
                    <div
                      key={c.dataIndex}
                      className="alarm-list__cell"
                      style={{ width: c.width, textAlign: (c.align as "left" | "right") || "left" }}>
                      {isLevel ? (
                        <span
                          className="alarm-list__level"
                          style={{
                            color: theme.level[row.levelType],
                            borderColor: theme.level[row.levelType],
                          }}>
                          {row.level}
                        </span>
                      ) : (
                        String(row[c.dataIndex])
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PanelCard>
  );
}
