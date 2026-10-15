/**
 * 站点/线路自定义颜色 —— localStorage 持久化
 *
 * 用户在地图上点击站点后，可为该站点（或其所属线路）挑选颜色；
 * 覆盖值按城市分别存 localStorage，刷新后依然生效，"恢复默认"即删除覆盖。
 */

import { useCallback, useState } from "react";

export interface Overrides {
  /** 站点名 -> 颜色 */
  station: Record<string, string>;
  /** 线路 id -> 颜色 */
  line: Record<string, string>;
}

const STORAGE_KEY = "dv-metro-overrides";

function readAll(): Record<string, Overrides> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, Overrides>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* 存储不可用时静默降级为仅内存态 */
  }
}

export function useOverrides(cityId: string) {
  const [overrides, setOverrides] = useState<Overrides>(() => readAll()[cityId] ?? { station: {}, line: {} });

  const mutate = useCallback(
    (fn: (prev: Overrides) => Overrides) => {
      setOverrides((prev) => {
        const next = fn(prev);
        const all = readAll();
        all[cityId] = next;
        writeAll(all);
        return next;
      });
    },
    [cityId]
  );

  const setStationColor = useCallback(
    (name: string, color: string | null) =>
      mutate((prev) => {
        const station = { ...prev.station };
        if (color) station[name] = color;
        else delete station[name];
        return { ...prev, station };
      }),
    [mutate]
  );

  const setLineColor = useCallback(
    (id: string, color: string | null) =>
      mutate((prev) => {
        const line = { ...prev.line };
        if (color) line[id] = color;
        else delete line[id];
        return { ...prev, line };
      }),
    [mutate]
  );

  return { overrides, setStationColor, setLineColor };
}
