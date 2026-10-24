/**
 * 面板 —— 车站实时详情（车站管理页，联动地图/榜单选中站）
 *
 * 数据：data/station-detail.json，经 loadData('stationDetail') 读取。
 *
 * 交互：由父组件传入当前选中站（地图点击 / 拥挤榜点击 / 排行榜点击均会同步到这里）；
 *   数据里没有该站时回退 defaultStation。
 *
 * 内容：站名 + 途经线路徽章 + 拥挤状态（图标+文字+颜色）、进/出/换乘量与
 *   站台满载率四指标、06–23 进出站分时双曲线、首末班车与限流提示。
 */

import { useEffect, useMemo, useState } from "react";
import PanelCard from "@/components/PanelCard";
import { loadData } from "@/config/data-source";
import { theme } from "@/config/theme";
import "./StationDetailPanel.css";

interface StationLineInfo {
  id: string;
  name: string;
  color: string;
}

interface StationDetail {
  lines: StationLineInfo[];
  /** 拥挤状态：ok 舒适 / warn 一般 / crowd 拥挤 */
  status: "ok" | "warn" | "crowd";
  metrics: { inflow: number; outflow: number; transfer: number; load: number };
  hours: string[];
  hourly: { in: number[]; out: number[] };
  firstTrain: string;
  lastTrain: string;
  notice: string | null;
}

interface StationDetailData {
  title: string;
  defaultStation: string;
  stations: Record<string, StationDetail>;
}

/** 状态三重编码：颜色 + 图标 + 文字（不只靠颜色区分） */
const STATUS: Record<
  StationDetail["status"],
  { label: string; color: string; icon: "check" | "warn" | "danger" }
> = {
  ok: { label: "舒适", color: "#4ade80", icon: "check" },
  warn: { label: "一般", color: "#ffa800", icon: "warn" },
  crowd: { label: "拥挤", color: "#ea580c", icon: "danger" },
};

/** 满载率分级配色（与地图客流热力口径一致：90 拥挤 / 120 严重拥挤） */
function loadColor(load: number): string {
  if (load >= 120) return "#ea580c";
  if (load >= 90) return "#ffa800";
  return "#4ade80";
}

function StatusIcon({ kind }: { kind: "check" | "warn" | "danger" }) {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      {kind === "check" && (
        <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {kind === "warn" && (
        <>
          <circle cx="8" cy="8" r="6.3" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8 7v3.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="8" cy="4.8" r="0.95" fill="currentColor" />
        </>
      )}
      {kind === "danger" && (
        <>
          <path d="M8 1.8 14.6 13.6H1.4Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M8 6.2v3.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="8" cy="11.5" r="0.95" fill="currentColor" />
        </>
      )}
    </svg>
  );
}

export default function StationDetailPanel({
  station,
}: {
  /** 当前选中站名（null = 用默认站） */
  station: string | null;
}) {
  const [data, setData] = useState<StationDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData<StationDetailData>("stationDetail")
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  // 选中站在数据里则用它，否则回退默认站
  const key = useMemo(
    () =>
      data
        ? station && data.stations[station]
          ? station
          : data.defaultStation
        : null,
    [data, station]
  );
  const d = key ? data?.stations[key] : undefined;

  // 分时双曲线 SVG path（进站/出站共用一个归一化上限）
  const chart = useMemo(() => {
    if (!d) return null;
    const W = 384;
    const H = 62;
    const max = Math.max(...d.hourly.in, ...d.hourly.out, 1);
    const path = (arr: number[]) =>
      arr
        .map((v, i) => {
          const x = ((i / (arr.length - 1)) * W).toFixed(1);
          const y = (H - (v / max) * (H - 6) - 3).toFixed(1);
          return `${i === 0 ? "M" : "L"}${x},${y}`;
        })
        .join(" ");
    const outPath = path(d.hourly.out);
    return {
      inPath: path(d.hourly.in),
      outPath,
      outArea: `${outPath} L${W},${H} L0,${H} Z`,
    };
  }, [d]);

  // x 轴刻度：每 3 小时一个点
  const ticks = useMemo(() => {
    if (!d) return [] as string[];
    const idx = [0, 3, 6, 9, 12, 15, d.hours.length - 1];
    return idx.map((i) => d.hours[i]?.slice(0, 2) ?? "");
  }, [d]);

  if (error)
    return (
      <PanelCard title="车站实时详情">
        <div className="panel-error">加载失败：{error}</div>
      </PanelCard>
    );

  if (!data || !d || !chart || !key)
    return (
      <PanelCard title="车站实时详情">
        <div className="panel-loading">加载中…</div>
      </PanelCard>
    );

  const st = STATUS[d.status];
  const transfer = d.metrics.transfer > 0 ? d.metrics.transfer.toLocaleString() : "—";

  return (
    <PanelCard title={data.title}>
      <div className="sdp-top">
        <span className="sdp-name">{key}</span>
        {d.lines.map((l) => (
          <span key={l.id} className="sdp-badge" style={{ background: l.color }}>
            {l.name}
          </span>
        ))}
        <span className="sdp-status" style={{ color: st.color, borderColor: st.color }}>
          <StatusIcon kind={st.icon} />
          {st.label}
        </span>
      </div>

      <div className="sdp-grid">
        <div className="sdp-m">
          <span>进站量</span>
          <b>{d.metrics.inflow.toLocaleString()}</b>
        </div>
        <div className="sdp-m">
          <span>出站量</span>
          <b>{d.metrics.outflow.toLocaleString()}</b>
        </div>
        <div className="sdp-m">
          <span>换乘量</span>
          <b>{transfer}</b>
        </div>
        <div className="sdp-m">
          <span>站台满载率</span>
          <b style={{ color: loadColor(d.metrics.load) }}>{d.metrics.load}%</b>
        </div>
      </div>

      <svg
        className="sdp-chart"
        viewBox="0 0 384 62"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${key} 分时进出站客流曲线`}>
        <path d="M0,20 H384 M0,41 H384" stroke="rgba(120,158,255,0.14)" strokeWidth="1" strokeDasharray="3 4" />
        <path d={chart.outArea} fill="rgba(48, 97, 219, 0.18)" />
        <path d={chart.outPath} fill="none" stroke={theme.primary} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <path d={chart.inPath} fill="none" stroke={theme.odLine} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="sdp-axisrow">
        <span className="sdp-ticks">
          {ticks.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </span>
        <span className="sdp-legend">
          <span style={{ color: theme.odLine }}>
            <i />进站
          </span>
          <span style={{ color: theme.primary }}>
            <i />出站
          </span>
        </span>
      </div>

      <div className="sdp-foot">
        <span>
          首班 <b>{d.firstTrain}</b>
        </span>
        <span>
          末班 <b>{d.lastTrain}</b>
        </span>
        <span className={d.notice ? "sdp-notice" : undefined}>
          {d.notice ?? "无限流措施"}
        </span>
      </div>
    </PanelCard>
  );
}
