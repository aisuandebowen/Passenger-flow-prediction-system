/**
 * 面板 —— 车站客运量排行（横向条形榜，下拉选择时段）
 *
 * 独立模块：自带数据加载。
 * 数据：data/station-rank.json，经 loadData('stationRank') 读取。
 *
 * 交互：
 *   - 右上角下拉切换时段；「全运营时段」为所有 1h 时段按站累计后重新排序。
 *   - 传入 onSelect 时条目可点击（联动地图选中 + 车站详情等面板）；
 *     topN 控制展示条数（车站管理页四面板布局下用 6）。
 *
 * 修改/替换：改本文件即可，不影响其他面板。
 */

import { useEffect, useMemo, useState } from "react";
import PanelCard from "@/components/PanelCard";
import { loadData } from "@/config/data-source";
import "./StationRankPanel.css";

interface RankPeriod {
  id: string;
  label: string;
  data: { name: string; value: number }[];
}

interface StationRankData {
  title: string;
  unit: string;
  periods: RankPeriod[];
}

/** 下拉里「全运营时段」的值 */
const ALL_PERIODS = "all";

export default function StationRankPanel({
  topN = 8,
  onSelect,
  selectedStation,
}: {
  /** 展示条数（默认 8；空间紧张时传更小值） */
  topN?: number;
  /** 点击条目回调（联动选中车站） */
  onSelect?: (name: string | null) => void;
  /** 当前选中站名（条目高亮联动） */
  selectedStation?: string | null;
}) {
  const [data, setData] = useState<StationRankData | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 默认展示全运营时段累计
  const [periodId, setPeriodId] = useState<string>(ALL_PERIODS);

  useEffect(() => {
    loadData<StationRankData>("stationRank")
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  // 当前时段的榜单：全时段 = 逐站累计所有 1h 时段再排序；否则取对应时段
  const rows = useMemo<{ name: string; value: number }[] | null>(() => {
    if (!data) return null;
    if (periodId !== ALL_PERIODS) {
      const p = data.periods.find((x) => x.id === periodId);
      return p ? p.data : null;
    }
    const sum = new Map<string, number>();
    for (const p of data.periods) {
      for (const it of p.data) sum.set(it.name, (sum.get(it.name) ?? 0) + it.value);
    }
    return [...sum.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data, periodId]);

  if (error)
    return (
      <PanelCard title="车站客运量排行">
        <div className="panel-error">加载失败：{error}</div>
      </PanelCard>
    );

  if (!data || !rows)
    return (
      <PanelCard title="车站客运量排行">
        <div className="panel-loading">加载中…</div>
      </PanelCard>
    );

  // 空态：明确说明，不留死胡同
  if (rows.length === 0)
    return (
      <PanelCard title={data.title}>
        <div className="panel-loading">该时段暂无客流数据</div>
      </PanelCard>
    );

  const list = rows.slice(0, topN);
  const max = Math.max(...list.map((r) => r.value), 1);

  return (
    <PanelCard
      title={data.title}
      extra={
        <span className="sr-select-wrap">
          <select
            className="sr-select"
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
            aria-label="选择统计时段">
            <option value={ALL_PERIODS}>全运营时段</option>
            {data.periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </span>
      }>
      <div className="sr-list">
        {list.map((r, i) => {
          const selected = r.name === selectedStation;
          const Row = onSelect ? "button" : "div";
          return (
            <Row
              key={r.name}
              {...(onSelect
                ? { type: "button" as const, onClick: () => onSelect(r.name), "aria-current": selected }
                : {})}
              className={`sr-row${selected ? " is-selected" : ""}`}
              title={`${r.name}：${r.value.toLocaleString()} ${data.unit}`}>
              <span className={`sr-rank${i < 3 ? " is-top" : ""}`}>{i + 1}</span>
              <span className="sr-name">{r.name}</span>
              <span className="sr-bar">
                <span style={{ width: `${(r.value / max) * 100}%` }} />
              </span>
              <span className="sr-value">{r.value.toLocaleString()}</span>
            </Row>
          );
        })}
      </div>
    </PanelCard>
  );
}
