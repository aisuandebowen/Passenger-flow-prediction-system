/**
 * 场景页 —— 节假日/大型活动预测结果展示页
 *
 * 布局（方案 A：时间叙事为主，空间为辅）：
 *   ┌──────────┬──────────────────────┬────────────┐
 *   │  侧边栏   │  中区：预测时间轴      │  右栏：     │
 *   │          │  (横向时间线+节点)     │  ① 概览卡  │
 *   │          │                      │  ② 小地图  │
 *   │          │                      │  ③ 重点站  │
 *   │          │                      │  ④ 结论    │
 *   └──────────┴──────────────────────┴────────────┘
 *
 * 中区时间轴 + 右栏面板 = 中右合并为一个场景展示区。
 */

import { useEffect, useState } from "react";
import { loadData } from "@/config/data-source";
import type { SceneDetail, SceneDetailMap } from "./types";
import SceneTimeline from "./SceneTimeline";
import ScenePanel from "./ScenePanel";
import "./ScenePage.css";

export default function ScenePage({ sceneId }: { sceneId: string }) {
  const [detail, setDetail] = useState<SceneDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDetail(null);
    setError(null);
    loadData<SceneDetailMap>("sceneDetail")
      .then((d) => {
        const sc = d[sceneId];
        if (sc) setDetail(sc);
        else setError(`未找到场景 ${sceneId}`);
      })
      .catch((e: Error) => setError(e.message));
  }, [sceneId]);

  if (error) return <div className="scene-page scene-page--error">加载失败：{error}</div>;

  if (!detail)
    return <div className="scene-page scene-page--loading">场景加载中…</div>;

  return (
    <div className="scene-page">
      {/* 中区：预测时间轴 */}
      <div className="scene-page__timeline">
        <SceneTimeline
          title={detail.title}
          date={detail.date}
          venue={detail.venue}
          nodes={detail.timeline}
          hourly={detail.hourly}
        />
      </div>

      {/* 右栏：预测详情面板（含小地图） */}
      <div className="scene-page__panel">
        <ScenePanel sceneId={sceneId} />
      </div>
    </div>
  );
}
