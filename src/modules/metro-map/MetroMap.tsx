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
import { theme } from "@/config/theme";
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
  onToggleOd,
  onSelectStation,
  focusStations,
  compact = false,
  activeLine,
  onActiveLineChange,
  selectedStation,
  onCityChange,
}: {
  /** 是否绘制 OD 流量光线（由外部页面状态控制） */
  odEnabled?: boolean;
  /** OD 开关切换回调（点击右下角按钮时触发） */
  onToggleOd?: () => void;
  /** 点击地图站点时的回调，参数为站点名 */
  onSelectStation?: (name: string | null) => void;
  /** 场景聚焦：这些站点脉冲高亮，其余站弱化；自动聚焦到其包围盒 */
  focusStations?: string[];
  /** 紧凑模式（小地图窗）：隐藏城市切换、控制按钮、提示 */
  compact?: boolean;
  /** 受控：当前选中线路（null = 全网）。由外部提升管理，供 KPI 联动 */
  activeLine?: string | null;
  /** 线路选中变化回调（点击 chips 时触发，外部同步状态） */
  onActiveLineChange?: (lineId: string | null) => void;
  /** 受控：外部指定的选中站（面板榜单点击联动），同步到地图高亮 */
  selectedStation?: string | null;
  /** 城市切换回调（外部同步状态，供车站详情等面板按城市取线网信息） */
  onCityChange?: (cityId: "beijing" | "qingdao") => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useSize(containerRef);
  const [cityId, setCityId] = useState<(typeof CITIES)[number]["id"]>(mapConfig.city);
  const [city, setCity] = useState<CityGeoData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<string | null>(null);
  // 内部兜底状态（仅当外部未受控时使用，保证向后兼容）
  const [internalLine, setInternalLine] = useState<string | null>(null);
  // 线路筛选面板展开/收起
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  // 上一次加载的城市 id（null = 尚未加载过；用于仅在真正切换城市时重置线路）
  const prevCityId = useRef<string | null>(null);
  // 客流热力着色：站点名 -> 满载率（默认开启，右下角可切换）
  const [heatEnabled, setHeatEnabled] = useState(true);
  const [stationLoad, setStationLoad] = useState<Record<string, number> | null>(null);
  // 客流脉冲：站点圆点/线路大小随满载率变化（默认开启）
  const [pulseEnabled, setPulseEnabled] = useState(true);
  const { overrides, setStationColor, setLineColor } = useOverrides(cityId);

  // 加载站点满载率数据（客流热力着色用）
  useEffect(() => {
    let alive = true;
    loadData<Record<string, number>>("stationLoad")
      .then((d) => {
        if (alive) setStationLoad(d);
      })
      .catch(() => {
        if (alive) setStationLoad(null); // 加载失败则回退到普通配色
      });
    return () => {
      alive = false;
    };
  }, []);

  // 选中线路：优先用外部受控值，否则内部兜底（保证 ScenePanel 等旧调用不受影响）
  const isControlled = activeLine !== undefined;
  const currentLine = isControlled ? activeLine : internalLine;
  const setCurrentLine = (id: string | null) => {
    if (isControlled) onActiveLineChange?.(id);
    else setInternalLine(id);
  };

  // 点击地图空白处收起筛选面板
  useEffect(() => {
    if (!filterOpen) return;
    const onDown = (e: PointerEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [filterOpen]);

  // 外部指定选中站（面板榜单/详情点击）→ 同步地图高亮
  useEffect(() => {
    if (selectedStation !== undefined) setSelection(selectedStation);
  }, [selectedStation]);

  // 城市切换同步给外部（车站详情面板按城市加载线网信息）
  useEffect(() => {
    onCityChange?.(cityId);
  }, [cityId, onCityChange]);

  // 外部是否显式控制 OD 开关；未传则回退到 mapConfig
  const odOn = odEnabled ?? mapConfig.od.enabled;

  // 当前选中线路的名称与颜色（入口按钮展示用）
  const activeLineObj = city?.lines.find((l) => l.id === currentLine);
  const activeLineName = activeLineObj ? activeLineObj.name.replace(/号线.*$/, "号线") : "";
  const activeLineColor = activeLineObj?.color ?? theme.accent;

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
    // 切换城市后回到「全网」（对比上一次 cityId，仅在真正切换时重置；
    // 直接跳过首次挂载会被 StrictMode 双挂载绕过）
    if (prevCityId.current !== null && prevCityId.current !== cityId) {
      setCurrentLine(null);
    }
    prevCityId.current = cityId;
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
          visibleLines={currentLine ? [currentLine] : mapConfig.visibleLines}
          odEnabled={odOn}
          initialZoom={mapConfig.initialZoom}
          focusStations={focusStations}
          compact={compact}
          heatEnabled={heatEnabled}
          stationLoad={stationLoad}
          pulseEnabled={pulseEnabled}
        />
      )}

      {/* 线路筛选（紧凑模式隐藏）：收起为入口按钮，点击展开下拉面板 */}
      {!compact && city && (
        <div className="mm-line-filter" ref={filterRef}>
          <button
            className={`mm-line-filter__toggle${currentLine !== null ? " has-value" : ""}${filterOpen ? " is-open" : ""}`}
            onClick={() => setFilterOpen((o) => !o)}
          >
            {currentLine === null ? (
              "线路筛选"
            ) : (
              <>
                <i className="mm-line-chip__dot" style={{ background: activeLineColor }} />
                {activeLineName}
              </>
            )}
            <svg
              className="mm-line-filter__arrow"
              viewBox="0 0 24 24"
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {filterOpen && (
            <div className="mm-line-filter__panel">
              <button
                className={`mm-line-filter__option${currentLine === null ? " is-active" : ""}`}
                onClick={() => {
                  setCurrentLine(null);
                  setFilterOpen(false);
                }}
              >
                <span className="mm-line-filter__all">全网</span>
                <span className="mm-line-filter__count">{city.lines.length} 条线路</span>
              </button>
              <div className="mm-line-filter__grid">
                {city.lines.map((line) => (
                  <button
                    key={line.id}
                    className={`mm-line-filter__option${currentLine === line.id ? " is-active" : ""}`}
                    onClick={() => {
                      setCurrentLine(line.id);
                      setFilterOpen(false);
                    }}
                  >
                    <i className="mm-line-chip__dot" style={{ background: line.color }} />
                    <span>{line.name.replace(/号线.*$/, "号线")}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
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

      {/* 右下角功能开关（客流热力 / OD 流向） */}
      {!compact && (
        <div className="mm-toggles">
          <button
            className={`mm-od-toggle${heatEnabled ? " is-on" : ""}`}
            onClick={() => setHeatEnabled((v) => !v)}
            title={heatEnabled ? "关闭客流热力着色" : "开启客流热力着色"}
            aria-pressed={heatEnabled}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3.2" />
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
            </svg>
            <span>客流热力</span>
          </button>
          <button
            className={`mm-od-toggle${pulseEnabled ? " is-on" : ""}`}
            onClick={() => setPulseEnabled((v) => !v)}
            title={pulseEnabled ? "关闭客流脉冲" : "开启客流脉冲"}
            aria-pressed={pulseEnabled}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12h4l2-6 4 12 2-6h8" />
            </svg>
            <span>客流脉冲</span>
          </button>
          <button
            className={`mm-od-toggle${odOn ? " is-on" : ""}`}
            onClick={onToggleOd}
            title={odOn ? "关闭 OD 流向光线" : "开启 OD 流向光线"}
            aria-pressed={odOn}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 17c3-6 6-6 9 0s6 6 9 0" />
              <path d="M3 12c3-4 6-4 9 0s6 4 9 0" opacity="0.55" />
            </svg>
            <span>OD 流向</span>
          </button>
        </div>
      )}
    </div>
  );
}
