/**
 * 站点信息弹窗 —— 站点详情 + 自定义颜色
 *
 * 点击站点圆点后出现，跟随站点位置（由父组件换算并钳制在可视区内）。
 * 提供：
 *   - 站点自定义颜色：快捷色板 + 自定义取色 + 恢复默认
 *   - 途经线路改色：每条线路一个原生取色器（改的是整条线路的颜色）
 * 颜色覆盖通过 colors.ts 存 localStorage，刷新后仍生效。
 */

import type { GeoLine, GeoStation } from "./GeoMapView";

const SWATCHES = [
  "#ff5d5d",
  "#ff9f43",
  "#ffd166",
  "#7bed9f",
  "#38bdf8",
  "#818cf8",
  "#e879f9",
  "#f8fafc",
];

interface StationPopupProps {
  /** 锚点（站点屏幕坐标，已由父组件钳制在可视区内） */
  x: number;
  y: number;
  station: GeoStation;
  /** 途经线路（用于显示与改色） */
  lines: GeoLine[];
  lineColor: (id: string) => string;
  stationColor: string;
  onSetStationColor: (name: string, color: string | null) => void;
  onSetLineColor: (id: string, color: string | null) => void;
  onClose: () => void;
}

export default function StationPopup({
  x,
  y,
  station,
  lines,
  lineColor,
  stationColor,
  onSetStationColor,
  onSetLineColor,
  onClose,
}: StationPopupProps) {
  return (
    <div className="mm-popup" style={{ left: x, top: y }}>
      <div className="mm-popup__head">
        <span className="mm-popup__dot" style={{ background: stationColor }} />
        <span className="mm-popup__name">{station.name}</span>
        <button className="mm-popup__close" onClick={onClose} title="关闭">
          ×
        </button>
      </div>

      <div className="mm-popup__lines">
        {lines.map((l) => (
          <span key={l.id} className="mm-popup__line-chip" style={{ borderColor: lineColor(l.id) }}>
            <i style={{ background: lineColor(l.id) }} />
            {l.name}
          </span>
        ))}
      </div>

      <div className="mm-popup__section">
        <div className="mm-popup__label">站点颜色</div>
        <div className="mm-popup__swatches">
          {SWATCHES.map((c) => (
            <button
              key={c}
              className={`mm-popup__swatch${stationColor === c ? " is-active" : ""}`}
              style={{ background: c }}
              onClick={() => onSetStationColor(station.name, c)}
              title={c}
            />
          ))}
          <label className="mm-popup__custom" title="自定义颜色">
            <input
              type="color"
              value={toHex6(stationColor)}
              onChange={(e) => onSetStationColor(station.name, e.target.value)}
            />
            🎨
          </label>
          <button className="mm-popup__reset" onClick={() => onSetStationColor(station.name, null)} title="恢复默认颜色">
            恢复
          </button>
        </div>
      </div>

      <div className="mm-popup__section">
        <div className="mm-popup__label">线路颜色</div>
        <div className="mm-popup__line-rows">
          {lines.map((l) => (
            <div key={l.id} className="mm-popup__line-row">
              <label className="mm-popup__custom" title={`${l.name} 颜色`}>
                <input type="color" value={toHex6(lineColor(l.id))} onChange={(e) => onSetLineColor(l.id, e.target.value)} />
                <i style={{ background: lineColor(l.id) }} />
              </label>
              <span className="mm-popup__line-name">{l.name}</span>
              <button className="mm-popup__reset" onClick={() => onSetLineColor(l.id, null)} title="恢复官方配色">
                恢复
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** 原生取色器只认 #RRGGBB，非 6 位 hex 时退回中性色 */
function toHex6(color: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#888888";
}
