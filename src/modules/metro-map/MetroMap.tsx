/**
 * 中央地图模块 —— 真实地理地图（青岛 / 北京地铁线网）
 *
 * 数据：data/metro-cities/<城市id>.json，真实经纬度 + 官方线路色；
 *   站点、站序、站数均经官方渠道核验（北京地铁官网站名表 / 官方线网图 / 百科词条，
 *   坐标来自 OpenStreetMap）。经 config/data-source.ts 的 loadData() 加载，
 *   改 DATA_MODE 即可切 API。行政区划底图（GeoJSON）由地图组件按需拉取。
 *
 * 功能：
 *   - 真实地图底图：城市行政区划边界（含青岛海岸线），区县级轮廓
 *   - 每个站点可点击：弹窗显示途经线路，可自定义站点/线路颜色（localStorage 持久化）
 *   - 自由缩放（滚轮/双击/按钮）+ 拖拽平移：
 *       缩到最小 → 只显示随机抽样的几个站点；放大 → 视野内站点全部显示站名
 *   - 城市切换：北京 ⇄ 青岛，右上角一键切换
 *   - OD 流量光线：从枢纽站（北京·天安门西 / 青岛·五四广场）发出的流光（演示数据）
 *
 * 复用/修改详见同目录 README.md 与 data/metro-cities/README.md。
 */

import { useEffect, useRef, useState } from "react";
import { loadData } from "@/config/data-source";
import { mapConfig } from "@/config/map";
import { useSize } from "@/hooks/useSize";
import GeoMapView, { CityGeoData } from "./GeoMapView";
import { useOverrides } from "./colors";
import "./MetroMap.css";

const CITIES: { id: "beijing" | "qingdao"; name: string }[] = [
  { id: "beijing", name: "北京" },
  { id: "qingdao", name: "青岛" },
];

export default function MetroMap({
  odEnabled,
  onSelectStation,
  focusStations,
  compact = false,
}: {
  /** 是否绘制 OD 流量光线（由外部页面状态控制） */
  odEnabled?: boolean;
  /** 点击地图站点时的回调，参数为站点名 */
  onSelectStation?: (name: string | null) => void;
  /** 场景聚焦：这些站点脉冲高亮，其余站弱化；自动聚焦到其包围盒 */
  focusStations?: string[];
  /** 紧凑模式（小地图窗）：隐藏城市切换、控制按钮、提示 */
  compact?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useSize(containerRef);
  const [cityId, setCityId] = useState<(typeof CITIES)[number]["id"]>(mapConfig.city);
  const [city, setCity] = useState<CityGeoData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<string | null>(null);
  const { overrides, setStationColor, setLineColor } = useOverrides(cityId);

  // 外部是否显式控制 OD 开关；未传则回退到 mapConfig
  const odOn = odEnabled ?? mapConfig.od.enabled;

  // 选中站点变化时同步给外部（趋势面板联动）
  const handleSelect = (name: string | null) => {
    setSelection(name);
    onSelectStation?.(name);
  };

  // 加载当前城市数据（切换城市时重新加载）
  useEffect(() => {
    let alive = true;
    setCity(null);
    setError(null);
    setSelection(null);
    loadData<CityGeoData>("metroCity", { city: cityId })
      .then((d) => {
        if (alive) setCity(d);
      })
      .catch((e: Error) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [cityId]);

  return (
    <div className="metro-map" ref={containerRef}>
      {error && <div className="metro-map__error">数据加载失败：{error}</div>}
      {city && (
        <GeoMapView
          width={width}
          height={height}
          city={city}
          overrides={overrides}
          onSetStationColor={setStationColor}
          onSetLineColor={setLineColor}
          selection={selection}
          onSelect={handleSelect}
          visibleLines={mapConfig.visibleLines}
          odEnabled={odOn}
          initialZoom={mapConfig.initialZoom}
          focusStations={focusStations}
          compact={compact}
        />
      )}

      {/* 城市切换（紧凑模式隐藏） */}
      {!compact && (
        <div className="mm-city-switch">
          {CITIES.map((c) => (
            <button
              key={c.id}
              className={`mm-city-chip${c.id === cityId ? " is-active" : ""}`}
              onClick={() => setCityId(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
