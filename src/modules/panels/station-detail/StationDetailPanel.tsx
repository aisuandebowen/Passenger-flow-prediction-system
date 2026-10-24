/**
 * 面板 —— 车站实时详情（车站管理页，联动地图/榜单选中站）
 *
 * 数据：
 *   - data/station-detail.json（loadData('stationDetail')）：重点站精修指标；
 *   - 点到未收录的车站时，按地图线网数据（线路徽章/换乘标记）+ 站点满载率
 *     （data/station-load.json）推算一套演示指标，保证任意车站都能联动展示，
 *     接入后端 API 后由真实数据覆盖（推算值会在面板上标注「推算指标」）。
 *
 * 交互：由父组件传入当前选中站（地图点击 / 拥挤榜点击 / 排行榜点击均会同步到这里）；
 *   站名既不在精修数据也不在当前城市线网里时，回退 defaultStation。
 *
 * 内容：站名 + 途经线路徽章 + 拥挤状态（图标+文字+颜色）、进/出/换乘量与
 *   站台满载率四指标、06–23 进出站分时双曲线、首末班车与限流提示。
 */

import { useEffect, useMemo, useState } from "react";
import PanelCard from "@/components/PanelCard";
import { loadData } from "@/config/data-source";
import { theme } from "@/config/theme";
import type { CityGeoData } from "@/modules/metro-map/GeoMapView";
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

/** 06:00–23:00 分时刻度（18 点，与曲线对齐） */
const HOURS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
  "20:00", "21:00", "22:00", "23:00",
];

/** 满载率分级配色（与地图客流热力口径一致：90 拥挤 / 120 严重拥挤） */
function loadColor(load: number): string {
  if (load >= 120) return "#ea580c";
  if (load >= 90) return "#ffa800";
  return "#4ade80";
}

/** 站名 → 稳定散列（同一站每次推算结果一致，切换往返不跳变） */
function hashName(name: string): number {
  let h = 7;
  for (const ch of name) h = (h * 31 + (ch.codePointAt(0) ?? 0)) % 100000;
  return h;
}

/**
 * 未收录车站的演示推算：线路徽章/换乘标记来自线网真实数据，
 * 满载率优先取 station-load.json 实测值，其余量按满载率+站名散列派生。
 */
function synthesizeDetail(
  name: string,
  geo: { lines: string[]; transfer: boolean },
  city: CityGeoData,
  stationLoad: Record<string, number> | null
): StationDetail {
  const h = hashName(name);
  const load = stationLoad?.[name] ?? 35 + (h % 105);
  const lines = geo.lines
    .map((id) => city.lines.find((l) => l.id === id))
    .filter((l): l is (typeof city.lines)[number] => !!l)
    .map((l) => ({ id: l.id, name: l.name.replace(/号线.*$/, "号线"), color: l.color }));
  const scale = load / 100;
  const inflow = Math.round((5200 + (h % 4000)) * scale);
  const outflow = Math.round(inflow * (0.82 + ((h >> 3) % 30) / 100));
  const transfer = geo.transfer ? Math.round(inflow * (0.75 + ((h >> 6) % 45) / 100)) : 0;
  // 分时形态：双峰模板，按散列偏早高峰/偏晚高峰
  const shape = [0.16, 0.27, 0.5, 0.78, 0.92, 0.8, 0.66, 0.7, 0.84, 0.95, 0.82, 0.72, 0.64, 0.76, 0.58, 0.42, 0.3, 0.22];
  const early = h % 3 === 0;
  const shaped = shape.map((v, i) => (early ? (i < 9 ? v * 1.1 : v * 0.9) : i >= 9 ? v * 1.1 : v * 0.9));
  const mx = Math.max(...shaped, 0.001);
  return {
    lines,
    status: load >= 120 ? "crowd" : load >= 90 ? "warn" : "ok",
    metrics: { inflow, outflow, transfer, load },
    hours: HOURS,
    hourly: {
      in: shaped.map((v) => Math.round((inflow * v) / mx)),
      out: shaped.map((v) => Math.round((outflow * v) / mx)),
    },
    firstTrain: `05:${String(2 + (h % 25)).padStart(2, "0")}`,
    lastTrain: `23:${String(5 + (h % 30)).padStart(2, "0")}`,
    notice: null,
  };
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
  cityId = "beijing",
}: {
  /** 当前选中站名（null = 用默认站） */
  station: string | null;
  /** 当前地图城市（取线网真实线路信息用） */
  cityId?: string;
}) {
  const [data, setData] = useState<StationDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState<CityGeoData | null>(null);
  const [stationLoad, setStationLoad] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    loadData<StationDetailData>("stationDetail")
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  // 按当前城市加载线网（线路徽章/换乘标记），失败不影响精修站展示
  useEffect(() => {
    let alive = true;
    setCity(null);
    loadData<CityGeoData>("metroCity", { city: cityId })
      .then((d) => alive && setCity(d))
      .catch(() => alive && setCity(null));
    loadData<Record<string, number>>("stationLoad")
      .then((d) => alive && setStationLoad(d))
      .catch(() => alive && setStationLoad(null));
    return () => {
      alive = false;
    };
  }, [cityId]);

  // 解析要展示的站：精修数据优先；其次按线网推算（点任意地图车站都可联动）；最后回退默认站
  const resolved = useMemo<{
    key: string;
    d: StationDetail;
    estimated: boolean;
  } | null>(() => {
    if (!data) return null;
    if (station && data.stations[station])
      return { key: station, d: data.stations[station], estimated: false };
    const geo = city?.stations.find((s) => s.name === station);
    if (station && city && geo)
      return { key: station, d: synthesizeDetail(station, geo, city, stationLoad), estimated: true };
    const fallback = data.stations[data.defaultStation];
    return fallback ? { key: data.defaultStation, d: fallback, estimated: false } : null;
  }, [data, station, city, stationLoad]);

  const d = resolved?.d;

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

  if (!data || !resolved || !d || !chart)
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
        <span className="sdp-name">{resolved.key}</span>
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
        aria-label={`${resolved.key} 分时进出站客流曲线`}>
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
        {resolved.estimated ? (
          <span className="sdp-estimated" title="该站未接入实时数据，指标按线网与满载率推算">
            推算指标
          </span>
        ) : (
          <span className={d.notice ? "sdp-notice" : undefined}>
            {d.notice ?? "无限流措施"}
          </span>
        )}
      </div>
    </PanelCard>
  );
}
