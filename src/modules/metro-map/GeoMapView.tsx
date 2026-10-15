/**
 * 真实地图视图 —— 行政区划底图 + 真实经纬度线网 + 可点击站点 + 缩放分级显示
 *
 * 所有坐标都是真实经纬度（WGS84），经 Web 墨卡托投影绘制：
 *   1. 城市行政区划多边形（DataV.GeoAtlas 边界，含海岸线）
 *   2. 地铁线路（站点依真实位置连线，官方配色，支持用户改色）
 *   3. OD 流量光线（从枢纽站发出的弧形流光，演示数据）
 *   4. 站点圆点 + 站名标签（按缩放层级 LOD 显示）
 *
 * 交互：
 *   - 滚轮 / 双击 / 按钮 缩放，拖拽平移；视野限制在城市范围内
 *   - 缩到最小（k ≤ SAMPLE_K）：只显示随机抽样的几个站点，避免拥挤
 *   - 中间层级：全部站点显示为圆点，仅换乘站显示站名
 *   - 放大（k ≥ FULL_K）：视野内出现的站点全部显示站名（网格去重防重叠）
 *   - 点击站点：弹出信息卡，可自定义站点/线路颜色（localStorage 持久化）
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { theme } from "@/config/theme";
import { apply, clampCenter, Fit, panBy, projectLngLat, ViewState, zoomAround } from "./projection";
import type { Overrides } from "./colors";
import StationPopup from "./StationPopup";
import "./MetroMap.css";

// ================= 数据结构 =================

export interface GeoStation {
  name: string;
  lng: number;
  lat: number;
  /** 途经线路 id 列表 */
  lines: string[];
  transfer: boolean;
}

export interface GeoLine {
  id: string;
  name: string;
  color: string;
  /** 环线（首尾相接闭合） */
  loop?: boolean;
  stations: { name: string; lng: number; lat: number }[];
}

export interface OdFlow {
  name: string;
  lng: number;
  lat: number;
  value: number;
}

export interface CityGeoData {
  city: string;
  cityId: string;
  mode: "geo";
  /** 行政区划边界 GeoJSON 路径（相对站点根目录） */
  boundary: string;
  /** 初始视野中心 [lng, lat] */
  center: [number, number];
  lines: GeoLine[];
  stations: GeoStation[];
  od: {
    hub: { name: string; lng: number; lat: number };
    flows: OdFlow[];
  };
}

interface DistrictFeature {
  properties: {
    name?: string;
    centroid?: [number, number];
  };
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: number[][][] | number[][][][] };
}

// ================= LOD / 交互参数 =================

/** 相对初始视野（全城铺满 = 1）的缩放倍数 */
export const K_MIN = 0.5;
export const K_MAX = 16;
/** ≤ 该缩放：只显示随机抽样的几个站点 */
export const SAMPLE_K = 0.8;
/** ≥ 该缩放：视野内站点全部显示站名 */
export const FULL_K = 1.6;
/** 最小缩放时抽样的站点数 */
const SAMPLE_COUNT = 8;
/** 站名标签网格去重的格子边长（屏幕 px） */
const LABEL_CELL = 78;

const OD_ANIM = {
  dashSpeed: 60,
  dotsPerLine: 2,
  dotDuration: 3.2,
} as const;

// ================= 组件 =================

export interface GeoMapViewProps {
  width: number;
  height: number;
  city: CityGeoData;
  overrides: Overrides;
  onSetStationColor: (name: string, color: string | null) => void;
  onSetLineColor: (id: string, color: string | null) => void;
  /** 当前选中（弹窗打开）的站点名；null = 无 */
  selection: string | null;
  onSelect: (name: string | null) => void;
  /** 只显示这些线路 id；null = 全部 */
  visibleLines: string[] | null;
  odEnabled: boolean;
}

export default function GeoMapView(props: GeoMapViewProps) {
  const { width, height, city } = props;
  const containerRef = useRef<HTMLDivElement>(null);

  // ---- 行政区划边界（模块级缓存，切城市回来不重复拉取） ----
  const [districts, setDistricts] = useState<DistrictFeature[] | null>(null);
  useEffect(() => {
    let alive = true;
    setDistricts(null);
    fetch(city.boundary)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((g) => {
        if (alive) setDistricts(g.features ?? []);
      })
      .catch(() => {
        /* 边界加载失败时仅缺底图，线网照常显示 */
      });
    return () => {
      alive = false;
    };
  }, [city.boundary]);

  // ---- 投影与视野 ----
  const worldBox = useMemo(() => {
    const pts: [number, number][] = city.stations.map((s) => projectLngLat(s.lng, s.lat));
    districts?.forEach((f) =>
      eachRing(f.geometry, (ring) => ring.forEach((p) => pts.push(projectLngLat(p[0], p[1]))))
    );
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of pts) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    return { minX, minY, maxX, maxY };
  }, [city, districts]);

  const fit: Fit = useMemo(
    () => ({ s: fitScaleLocal(worldBox, width, height), width, height }),
    [worldBox, width, height]
  );

  const [view, setView] = useState<ViewState | null>(null);
  // 城市/边界数据就绪或变化时，把视野重置到包围盒中心（保证全城完整可见）；窗口尺寸变化不重置
  const boxCenter = useMemo<[number, number]>(
    () => [(worldBox.minX + worldBox.maxX) / 2, (worldBox.minY + worldBox.maxY) / 2],
    [worldBox]
  );
  const worldKey = `${city.cityId}:${districts ? districts.length : "loading"}`;
  const prevWorldKey = useRef<string | null>(null);
  useEffect(() => {
    if (fit.s <= 0) return;
    if (prevWorldKey.current === worldKey && view) return;
    prevWorldKey.current = worldKey;
    setView({ cx: boxCenter[0], cy: boxCenter[1], k: 1 });
  }, [worldKey, fit.s, boxCenter, view]);
  const viewRef = useRef<ViewState | null>(null);
  viewRef.current = view;

  const px = (lng: number, lat: number): [number, number] => {
    const v = view!;
    const [wx, wy] = projectLngLat(lng, lat);
    return apply(v, fit, wx, wy);
  };

  // ---- 线路可见性 / 配色 ----
  const lineById = useMemo(() => new Map(city.lines.map((l) => [l.id, l])), [city]);
  const shownLines = useMemo(
    () => city.lines.filter((l) => !props.visibleLines || props.visibleLines.includes(l.id)),
    [city, props.visibleLines]
  );
  const shownLineIds = useMemo(() => new Set(shownLines.map((l) => l.id)), [shownLines]);
  const lineColor = (id: string) => props.overrides.line[id] ?? lineById.get(id)?.color ?? theme.station;
  const stations = useMemo(
    () => city.stations.filter((s) => s.lines.some((id) => shownLineIds.has(id))),
    [city, shownLineIds]
  );
  const stationColor = (s: GeoStation) => {
    const custom = props.overrides.station[s.name];
    if (custom) return custom;
    if (s.transfer) return theme.transferStation;
    const own = s.lines.find((id) => shownLineIds.has(id));
    return own ? lineColor(own) : theme.station;
  };

  // ---- 所有站点的屏幕坐标（一次投影，处处复用） ----
  const positioned = useMemo(
    () => (view ? stations.map((s) => ({ s, p: px(s.lng, s.lat) })) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stations, view, fit]
  );

  // ---- 最小缩放时的抽样站点：城市分格的分层随机抽样（有随机性且空间打散） ----
  const sampleStations = useMemo(() => {
    if (!stations.length) return [];
    const pts = stations.map((s) => ({ s, w: projectLngLat(s.lng, s.lat) }));
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const { w } of pts) {
      if (w[0] < minX) minX = w[0];
      if (w[1] < minY) minY = w[1];
      if (w[0] > maxX) maxX = w[0];
      if (w[1] > maxY) maxY = w[1];
    }
    const cols = 4;
    const rows = 3;
    const cellW = Math.max((maxX - minX) / cols, 1e-9);
    const cellH = Math.max((maxY - minY) / rows, 1e-9);
    const buckets = new Map<string, typeof pts>();
    for (const p of pts) {
      const cx = Math.min(cols - 1, Math.floor((p.w[0] - minX) / cellW));
      const cy = Math.min(rows - 1, Math.floor((p.w[1] - minY) / cellH));
      const key = `${cx}:${cy}`;
      const arr = buckets.get(key);
      if (arr) arr.push(p);
      else buckets.set(key, [p]);
    }
    const seed = [...city.cityId].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const keys = seededShuffle([...buckets.keys()], seed).slice(0, SAMPLE_COUNT);
    return keys.map((key) => {
      const arr = buckets.get(key)!;
      const transfers = arr.filter((p) => p.s.transfer);
      const pool = transfers.length ? transfers : arr;
      return seededShuffle(pool, seed + key.length * 131 + key.charCodeAt(0))[0].s;
    });
  }, [stations, city.cityId]);
  const sampleNames = useMemo(() => new Set(sampleStations.map((s) => s.name)), [sampleStations]);

  // ---- 指针交互（拖拽平移 + 点击选择） ----
  const drag = useRef<{ id: number; sx: number; sy: number; moved: boolean } | null>(null);

  const toLocal = (e: { clientX: number; clientY: number }): [number, number] => {
    const el = containerRef.current;
    if (!el) return [0, 0];
    const rect = el.getBoundingClientRect();
    return [(e.clientX - rect.left) * (width / rect.width), (e.clientY - rect.top) * (height / rect.height)];
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!view || (e.target as Element).closest(".mm-popup")) return;
    const [x, y] = toLocal(e);
    drag.current = { id: e.pointerId, sx: x, sy: y, moved: false };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* 指针不存在（如合成事件）时无需捕获 */
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !view || d.id !== e.pointerId) return;
    const [x, y] = toLocal(e);
    const dx = x - d.sx;
    const dy = y - d.sy;
    if (!d.moved && Math.hypot(dx, dy) > 4) d.moved = true;
    if (d.moved) {
      d.sx = x;
      d.sy = y;
      setView((v) => (v ? clampCenter(panBy(v, fit, dx, dy), worldBox) : v));
    }
  };

  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || !view || d.id !== e.pointerId || d.moved) return;
    // 视为点击：命中检测半径 12px 内最近的站点
    const [x, y] = toLocal(e);
    let best: string | null = null;
    let bestDist = 12;
    const pool = view.k <= SAMPLE_K ? positioned.filter(({ s }) => sampleNames.has(s.name)) : positioned;
    for (const { s, p } of pool) {
      const dist = Math.hypot(p[0] - x, p[1] - y);
      if (dist < bestDist) {
        bestDist = dist;
        best = s.name;
      }
    }
    props.onSelect(best);
  };

  // ---- 滚轮缩放（非 passive 才能 preventDefault） ----
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!viewRef.current) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (width / rect.width);
      const y = (e.clientY - rect.top) * (height / rect.height);
      const intensity = e.ctrlKey ? 0.008 : 0.0016;
      const factor = Math.max(0.5, Math.min(2, Math.exp(-e.deltaY * intensity)));
      // 函数式更新：连续滚轮事件无需等待重渲染也能逐次叠加
      setView((v) => (v ? clampCenter(zoomAround(v, fit, x, y, factor, K_MIN, K_MAX), worldBox) : v));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [fit, worldBox, width, height]);

  // Esc 关闭弹窗
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onSelect(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props.onSelect]);

  if (!view || width <= 0 || height <= 0) {
    return <div className="metro-map" ref={containerRef} />;
  }

  const k = view.k;
  const sampleMode = k <= SAMPLE_K;
  const fullLabels = k >= FULL_K;
  const margin = 60;
  const inView = ({ p: [sx, sy] }: { p: [number, number] }) =>
    sx > -margin && sx < width + margin && sy > -margin && sy < height + margin;

  const dots = sampleMode ? sampleStations.map((s) => ({ s, p: px(s.lng, s.lat) })) : positioned.filter(inView);
  const selected = props.selection ? stations.find((s) => s.name === props.selection) : undefined;

  // ---- 站名标签 LOD：抽样模式→抽样站全部标注；中间→换乘站；放大→视野内全部（网格去重） ----
  const labelPool = sampleMode ? dots : fullLabels ? dots : dots.filter(({ s }) => s.transfer);
  const labels = sampleMode ? labelPool : pickLabels(labelPool, LABEL_CELL);

  const selectedPos = selected ? px(selected.lng, selected.lat) : null;
  const zoomAt = (factor: number) => setView(clampCenter(zoomAround(view, fit, width / 2, height / 2, factor, K_MIN, K_MAX), worldBox));

  return (
    <div
      className="metro-map"
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={() => (drag.current = null)}
      onDoubleClick={(e) => {
        if ((e.target as Element).closest(".mm-popup")) return;
        const [x, y] = toLocal(e);
        setView(clampCenter(zoomAround(view, fit, x, y, 1.9, K_MIN, K_MAX), worldBox));
      }}
    >
      <svg className="metro-map__svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="mmOdGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={theme.odLine} stopOpacity={0.95} />
            <stop offset="55%" stopColor={theme.odLine} stopOpacity={0.45} />
            <stop offset="100%" stopColor={theme.odLine} stopOpacity={0.08} />
          </linearGradient>
          <filter id="mmHubGlow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. 行政区划底图（真实边界，含海岸线） */}
        {districts && (
          <g className="mm-districts">
            {districts.map((f, i) => (
              <path
                key={i}
                d={ringPath(f.geometry, px)}
                fill={i % 2 ? "rgba(41, 84, 188, 0.13)" : "rgba(28, 60, 148, 0.17)"}
                stroke="rgba(120, 158, 255, 0.30)"
                strokeWidth={1}
              />
            ))}
          </g>
        )}

        {/* 区县名（放大后淡入） */}
        {districts &&
          k >= 1.05 &&
          districts.map((f, i) => {
            const c = f.properties.centroid;
            if (!c) return null;
            const [x, y] = px(c[0], c[1]);
            if (x < 0 || x > width || y < 0 || y > height) return null;
            return (
              <text
                key={i}
                x={x}
                y={y}
                className="mm-district-label"
                fontSize={14}
                opacity={Math.min(0.55, (k - 1) * 1.1)}
              >
                {f.properties.name}
              </text>
            );
          })}

        {/* 2. 地铁线路（真实走向：站点顺序连线） */}
        {shownLines.map((line) => {
          if (line.stations.length < 2) return null;
          const d =
            line.stations
              .map((s, i) => {
                const [x, y] = px(s.lng, s.lat);
                return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
              })
              .join(" ") + (line.loop ? " Z" : "");
          const color = lineColor(line.id);
          return (
            <g key={line.id} opacity={sampleMode ? 0.14 : 1}>
              {/* 暗色描边打底，增强与底图的对比 */}
              <path d={d} fill="none" stroke="rgba(3, 8, 26, 0.65)" strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
              {/* 发光 */}
              <path d={d} fill="none" stroke={color} strokeWidth={6.5} strokeLinejoin="round" strokeLinecap="round" opacity={0.16} />
              <path d={d} fill="none" stroke={color} strokeWidth={2.7} strokeLinejoin="round" strokeLinecap="round" opacity={0.95} />
            </g>
          );
        })}

        {/* 3. OD 流量光线 */}
        {props.odEnabled && !sampleMode && (
          <g className="mm-od">
            {city.od.flows.map((f, i) => (
              <OdLine key={`${f.name}-${i}`} from={px(city.od.hub.lng, city.od.hub.lat)} to={px(f.lng, f.lat)} value={f.value} index={i} k={k} />
            ))}
          </g>
        )}

        {/* 4. 站点圆点 */}
        <g className="mm-stations">
          {dots.map(({ s, p: [x, y] }) =>
            s.transfer ? (
              <circle
                key={s.name}
                cx={x}
                cy={y}
                r={4.4}
                fill={stationColor(s)}
                stroke="rgba(2, 6, 23, 0.85)"
                strokeWidth={1.4}
              />
            ) : (
              <circle key={s.name} cx={x} cy={y} r={2.7} fill={stationColor(s)} opacity={0.92} />
            )
          )}
          {/* 选中高亮圈 */}
          {selectedPos && (
            <circle cx={selectedPos[0]} cy={selectedPos[1]} r={8} fill="none" stroke={theme.accent} strokeWidth={1.6}>
              <animate attributeName="r" values="8;11;8" dur="1.6s" repeatCount="indefinite" />
            </circle>
          )}
        </g>

        {/* 5. 站名标签（LOD） */}
        <g className="mm-labels">
          {labels.map(({ s, p: [x, y] }) => (
            <text
              key={s.name}
              x={x + 7}
              y={y + 4}
              fontSize={s.transfer ? 13 : 12.5}
              className="mm-station-label"
              fill={s.transfer ? theme.transferStation : theme.text}
            >
              {s.name}
            </text>
          ))}
        </g>

        {/* 6. OD 枢纽（脉冲） */}
        {props.odEnabled &&
          (() => {
            const [hx, hy] = px(city.od.hub.lng, city.od.hub.lat);
            return (
              <g filter="url(#mmHubGlow)">
                <circle cx={hx} cy={hy} r={6} fill={theme.odLine} opacity={0.35}>
                  <animate attributeName="r" values="6;13;6" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.55;0.12;0.55" dur="2.4s" repeatCount="indefinite" />
                </circle>
                <circle cx={hx} cy={hy} r={5} fill={theme.odLine} />
                <circle cx={hx} cy={hy} r={2.2} fill="#ffffff" />
                <text x={hx} y={hy - 13} className="mm-hub-label" fontSize={14} fill={theme.titleText} textAnchor="middle">
                  {city.od.hub.name}
                </text>
              </g>
            );
          })()}

        {/* 数据来源标注 */}
        <text className="mm-attribution" x={width - 8} y={height - 8} textAnchor="end" fontSize={10}>
          底图边界 © DataV.GeoAtlas / OpenStreetMap · 站点经官方数据核验
        </text>
      </svg>

      {/* 缩放按钮 */}
      <div className="mm-controls">
        <button className="mm-ctrl-btn" title="放大" onClick={() => zoomAt(1.5)}>
          ＋
        </button>
        <button className="mm-ctrl-btn" title="缩小" onClick={() => zoomAt(1 / 1.5)}>
          －
        </button>
        <button className="mm-ctrl-btn" title="复位视野" onClick={() => setView({ cx: boxCenter[0], cy: boxCenter[1], k: 1 })}>
          ⌂
        </button>
      </div>

      {/* 操作提示 */}
      <div className="mm-hint">滚轮缩放 · 拖拽平移 · 点击站点</div>

      {/* 站点弹窗 */}
      {selected && selectedPos && (
        <StationPopup
          x={Math.max(120, Math.min(width - 120, selectedPos[0]))}
          y={Math.max(160, selectedPos[1])}
          station={selected}
          lines={selected.lines.map((id) => lineById.get(id)).filter((l): l is GeoLine => !!l)}
          lineColor={lineColor}
          stationColor={stationColor(selected)}
          onSetStationColor={props.onSetStationColor}
          onSetLineColor={props.onSetLineColor}
          onClose={() => props.onSelect(null)}
        />
      )}
    </div>
  );
}

// ================= OD 流光 =================

function OdLine({
  from,
  to,
  value,
  index,
  k,
}: {
  from: [number, number];
  to: [number, number];
  value: number;
  index: number;
  k: number;
}) {
  const { d, len } = useMemo(() => {
    const mx = (from[0] + to[0]) / 2;
    const my = (from[1] + to[1]) / 2;
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const dist = Math.hypot(dx, dy);
    const bow = Math.min(dist * 0.16, 46) * (index % 2 === 0 ? 1 : -1);
    const nx = dist === 0 ? 0 : -dy / dist;
    const ny = dist === 0 ? 0 : dx / dist;
    const cx = mx + nx * bow;
    const cy = my + ny * bow;
    return {
      d: `M${from[0]},${from[1]} Q${cx.toFixed(1)},${cy.toFixed(1)} ${to[0]},${to[1]}`,
      len: dist,
    };
  }, [from, to, index]);

  const intensity = Math.min(1, value / 9000);
  const widthPx = 1 + intensity * 2.2;
  const opacity = 0.25 + intensity * 0.55;
  const dashLen = 14;
  const gapLen = Math.max(18, len * 0.35);
  const dashTotal = dashLen + gapLen;

  return (
    <g>
      <path d={d} fill="none" stroke={theme.odLine} strokeWidth={widthPx} opacity={opacity * 0.28} strokeLinecap="round" />
      <path
        d={d}
        fill="none"
        stroke="url(#mmOdGradient)"
        strokeWidth={widthPx}
        strokeLinecap="round"
        strokeDasharray={`${dashLen} ${gapLen}`}
        opacity={opacity}
      >
        <animate
          attributeName="stroke-dashoffset"
          values={`${dashTotal};0`}
          dur={`${(dashTotal / OD_ANIM.dashSpeed).toFixed(2)}s`}
          repeatCount="indefinite"
        />
      </path>
      {Array.from({ length: OD_ANIM.dotsPerLine }, (_, m) => (
        <circle key={m} r={2.6 + intensity * 1.4} fill={theme.odLine} opacity={opacity + 0.2}>
          <animateMotion
            dur={`${(OD_ANIM.dotDuration + index * 0.07).toFixed(2)}s`}
            begin={`${(-m * OD_ANIM.dotDuration) / OD_ANIM.dotsPerLine}s`}
            repeatCount="indefinite"
            path={d}
          />
        </circle>
      ))}
      <circle cx={to[0]} cy={to[1]} r={2.4 + intensity * 1.6} fill={theme.odLine} opacity={opacity}>
        <animate attributeName="opacity" values={`${opacity};${opacity * 0.3};${opacity}`} dur="2s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

// ================= 工具函数 =================

/** 稳定种子洗牌（最小缩放时的随机抽样，同一城市每次一致） */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  let s = (seed || 1) >>> 0;
  const rand = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** GeoJSON 几何的所有环（兼容 Polygon / MultiPolygon） */
function eachRing(geom: DistrictFeature["geometry"], fn: (ring: number[][]) => void) {
  if (geom.type === "Polygon") {
    (geom.coordinates as number[][][]).forEach(fn);
  } else {
    (geom.coordinates as number[][][][]).forEach((poly) => poly.forEach(fn));
  }
}

/** 几何 → SVG path（外环+内环，含孔洞） */
function ringPath(geom: DistrictFeature["geometry"], proj: (lng: number, lat: number) => [number, number]): string {
  const parts: string[] = [];
  eachRing(geom, (ring) => {
    if (ring.length < 3) return;
    const d = ring
      .map((p, i) => {
        const [x, y] = proj(p[0], p[1]);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
    parts.push(`${d} Z`);
  });
  return parts.join(" ");
}

/** 站名标签网格去重：一格一个，换乘站优先 */
function pickLabels(cands: { s: GeoStation; p: [number, number] }[], cell: number) {
  const sorted = [...cands].sort((a, b) => Number(b.s.transfer) - Number(a.s.transfer));
  const used = new Set<string>();
  const out: { s: GeoStation; p: [number, number] }[] = [];
  for (const c of sorted) {
    const key = `${Math.floor(c.p[0] / cell)}:${Math.floor(c.p[1] / cell)}`;
    if (used.has(key)) continue;
    used.add(key);
    out.push(c);
  }
  return out;
}

/** 由世界坐标包围盒求适配比例 */
function fitScaleLocal(
  box: { minX: number; maxX: number; minY: number; maxY: number },
  width: number,
  height: number
): number {
  if (width <= 0 || height <= 0 || !isFinite(box.minX)) return 0;
  const bw = Math.max(box.maxX - box.minX, 1e-9);
  const bh = Math.max(box.maxY - box.minY, 1e-9);
  const pad = 0.05;
  return Math.min(width / (bw * (1 + pad * 2)), height / (bh * (1 + pad * 2)));
}
