/**
 * 中央地图模块 —— 城市地铁线网图 + 枢纽 OD 流量光线
 *
 * 数据：data/metro-cities/<城市id>.json，由 config/map.ts 的 city 决定加载哪份。
 *   经 config/data-source.ts 的 loadData() 加载，改 DATA_MODE 即可切 API。
 *
 * 两种渲染模式（每座城市在自己的数据文件里指定 mode）：
 *   - vector：用 JSON 里的线路折线 + 站点坐标绘制（可缩放、清晰，适合有矢量数据的城市）
 *   - image ：直接把一张线网图整图贴上当背景（适合暂无矢量数据的城市，换成青岛这样的图）
 *
 * 线路过滤：mapConfig.visibleLines 指定只显示哪些线路。
 *
 * 复用/修改详见同目录 README.md 与 data/metro-cities/README.md。
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { loadData } from "@/config/data-source";
import { mapConfig } from "@/config/map";
import { theme } from "@/config/theme";
import { useSize } from "@/hooks/useSize";
import "./MetroMap.css";

// ---------- 数据结构 ----------
export interface MetroStation {
  name: string;
  x: number;
  y: number;
  /** 换乘站（多条线路经过），数据里自带，没有则按线路归属推断 */
  transfer?: boolean;
  /** 是否显示站名 */
  label?: boolean;
}
export interface MetroLine {
  id: string;
  name: string;
  color: string;
  /** 矢量模式：线路折线点序列 [[x,y],...]；图片模式留空 */
  path?: [number, number][];
  /** 该线路途经的站点 */
  stations: MetroStation[];
}
export interface OdFlow {
  name: string;
  x: number;
  y: number;
  line?: string;
  value: number;
}
export interface CityData {
  city: string;
  mode: "vector" | "image";
  /** 图片模式：线网图路径（相对站点根目录） */
  image?: string;
  imgWidth?: number;
  imgHeight?: number;
  lines: MetroLine[];
  /** 全局去重站点（矢量模式用于画站点圆点） */
  stations?: MetroStation[];
  od: {
    hub: { name: string; x: number; y: number };
    flows: OdFlow[];
  };
}

/** OD 光线动画配置 */
const OD_ANIM = {
  /** 流光虚线滚动速度（px/秒） */
  dashSpeed: 60,
  /** 移动光点数量/条 */
  dotsPerLine: 2,
  /** 光点移动周期（秒） */
  dotDuration: 3.2,
} as const;

export default function MetroMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useSize(containerRef);
  const [city, setCity] = useState<CityData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 加载当前城市数据（mapConfig.city 变化时重新加载）
  useEffect(() => {
    loadData<CityData>("metroCity", { city: mapConfig.city })
      .then(setCity)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="metro-map" ref={containerRef}>
        <div className="metro-map__error">数据加载失败：{error}</div>
      </div>
    );
  }

  return (
    <div className="metro-map" ref={containerRef}>
      {city && <MapView width={width} height={height} city={city} />}
    </div>
  );
}

// ================= 地图主体 =================

interface MapViewProps {
  width: number;
  height: number;
  city: CityData;
}

function MapView({ width, height, city }: MapViewProps) {
  // visibleLines 过滤
  const lines = useMemo(() => {
    if (!mapConfig.visibleLines) return city.lines;
    const want = new Set(mapConfig.visibleLines);
    return city.lines.filter((l) => want.has(l.id));
  }, [city]);

  // 视口：矢量模式用线路折线与站点的坐标范围；图片模式用图片尺寸
  const view = useMemo(() => {
    let minX = 0, minY = 0, maxX = 1, maxY = 1;
    if (city.mode === "image") {
      maxX = city.imgWidth ?? 1;
      maxY = city.imgHeight ?? 1;
    } else {
      const pts: [number, number][] = [];
      lines.forEach((l) => {
        if (l.path) pts.push(...l.path);
        l.stations.forEach((s) => pts.push([s.x, s.y]));
      });
      if (pts.length) {
        minX = Math.min(...pts.map((p) => p[0]));
        maxX = Math.max(...pts.map((p) => p[0]));
        minY = Math.min(...pts.map((p) => p[1]));
        maxY = Math.max(...pts.map((p) => p[1]));
      }
    }
    // 留白
    const padX = (maxX - minX) * 0.04 || 20;
    const padY = (maxY - minY) * 0.04 || 20;
    const box = {
      minX: minX - padX, maxX: maxX + padX,
      minY: minY - padY, maxY: maxY + padY,
    };
    // 等比适配容器，居中
    const bw = box.maxX - box.minX;
    const bh = box.maxY - box.minY;
    const scale = Math.min(width / bw, height / bh);
    const offsetX = (width - bw * scale) / 2 - box.minX * scale;
    const offsetY = (height - bh * scale) / 2 - box.minY * scale;
    return { scale, offsetX, offsetY, box };
  }, [lines, city, width, height]);

  const project = (x: number, y: number): [number, number] => [
    x * view.scale + view.offsetX,
    y * view.scale + view.offsetY,
  ];

  const hub = project(city.od.hub.x, city.od.hub.y);

  return (
    <svg
      className="metro-map__svg"
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id="odGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={theme.odLine} stopOpacity={0.95} />
          <stop offset="55%" stopColor={theme.odLine} stopOpacity={0.45} />
          <stop offset="100%" stopColor={theme.odLine} stopOpacity={0.08} />
        </linearGradient>
        <filter id="hubGlow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="lineGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 0. 图片模式：整张线网图作背景 */}
      {city.mode === "image" && city.image && (
        <image
          href={city.image}
          x={view.offsetX}
          y={view.offsetY}
          width={(city.imgWidth ?? 1) * view.scale}
          height={(city.imgHeight ?? 1) * view.scale}
          opacity={0.92}
          preserveAspectRatio="none"
        />
      )}

      {/* 1. 地铁线路（矢量模式） */}
      {city.mode === "vector" && (
        <g className="metro-map__lines">
          {lines.map((line) => {
            if (!line.path || line.path.length < 2) return null;
            const d = line.path
              .map((p, i) => {
                const [x, y] = project(p[0], p[1]);
                return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
              })
              .join(" ");
            return (
              <path
                key={line.id}
                d={d}
                fill="none"
                stroke={line.color}
                strokeWidth={2.6}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={0.92}
              />
            );
          })}
        </g>
      )}

      {/* 2. OD 流量光线 */}
      {mapConfig.od.enabled && (
        <g className="metro-map__od" filter="url(#lineGlow)">
          {city.od.flows.map((f, i) => (
            <OdLine
              key={`${f.name}-${i}`}
              from={hub}
              to={project(f.x, f.y)}
              value={f.value}
              index={i}
            />
          ))}
        </g>
      )}

      {/* 3. 站点（矢量模式） */}
      {city.mode === "vector" && (
        <g className="metro-map__stations">
          {dedupStations(lines).map((s) => {
            const [x, y] = project(s.x, s.y);
            return (
              <g key={s.name} className="metro-map__station">
                {s.transfer ? (
                  <circle
                    cx={x}
                    cy={y}
                    r={4.6}
                    fill={theme.transferStation}
                    stroke="#0a1230"
                    strokeWidth={1.6}
                  />
                ) : (
                  <circle cx={x} cy={y} r={2.4} fill={theme.station} opacity={0.9} />
                )}
                {s.label && (
                  <text
                    x={x + 7}
                    y={y + 3.5}
                    className="metro-map__station-label"
                    fill={s.transfer ? theme.transferStation : theme.text}
                  >
                    {s.name}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      )}

      {/* 4. 枢纽（脉冲发光） */}
      <g className="metro-map__hub" filter="url(#hubGlow)">
        <circle cx={hub[0]} cy={hub[1]} r={7} fill={theme.odLine} opacity={0.35}>
          <animate
            attributeName="r"
            values="6;13;6"
            dur="2.4s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.55;0.12;0.55"
            dur="2.4s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx={hub[0]} cy={hub[1]} r={5.2} fill={theme.odLine} />
        <circle cx={hub[0]} cy={hub[1]} r={2.4} fill="#ffffff" />
        <text
          x={hub[0]}
          y={hub[1] - 13}
          className="metro-map__hub-label"
          fill={theme.titleText}
          textAnchor="middle"
        >
          {city.od.hub.name}
        </text>
      </g>
    </svg>
  );
}

/** 线路内去重站点（同名只取一次），并保留 transfer/label 标记 */
function dedupStations(lines: MetroLine[]) {
  const seen = new Set<string>();
  const out: Required<MetroStation>[] = [];
  lines.forEach((l) =>
    l.stations.forEach((s) => {
      if (seen.has(s.name)) return;
      seen.add(s.name);
      out.push({ name: s.name, x: s.x, y: s.y, transfer: !!s.transfer, label: !!s.label });
    })
  );
  return out;
}

// ================= OD 光线（流光 + 移动光点） =================

interface OdLineProps {
  from: [number, number];
  to: [number, number];
  value: number;
  index: number;
}

function OdLine({ from, to, value, index }: OdLineProps) {
  // 二次贝塞尔：控制点取中点向外侧偏移，形成弧线
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
      <path
        d={d}
        fill="none"
        stroke={theme.odLine}
        strokeWidth={widthPx}
        opacity={opacity * 0.28}
        strokeLinecap="round"
      />
      <path
        d={d}
        fill="none"
        stroke="url(#odGradient)"
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
      {Array.from({ length: OD_ANIM.dotsPerLine }, (_, k) => (
        <circle r={2.6 + intensity * 1.4} fill={theme.odLine} opacity={opacity + 0.2}>
          <animateMotion
            dur={`${(OD_ANIM.dotDuration + index * 0.07).toFixed(2)}s`}
            begin={`${(-k * OD_ANIM.dotDuration) / OD_ANIM.dotsPerLine}s`}
            repeatCount="indefinite"
            path={d}
          />
        </circle>
      ))}
      <circle cx={to[0]} cy={to[1]} r={2.4 + intensity * 1.6} fill={theme.odLine} opacity={opacity}>
        <animate
          attributeName="opacity"
          values={`${opacity};${opacity * 0.3};${opacity}`}
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
    </g>
  );
}
