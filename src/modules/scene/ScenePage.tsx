/**
 * 场景页 —— 节假日/大型活动预测结果展示页
 *
 * 布局（时间叙事为主，空间为辅）：
 *   ┌──────────┬──────────────────────────────┬────────────┐
 *   │  侧边栏   │ 中区（纵向三段）：             │  右栏：     │
 *   │          │  ① 场景 KPI 横幅（含倒计时）    │  ① 管控预案 │
 *   │          │  ② 预测时间轴 + 分时曲线        │  ② 小地图   │
 *   │          │  ③ 逐日客流 + 线路压力 双卡     │  ③ 重点站   │
 *   │          │                              │  ④ 结论    │
 *   └──────────┴──────────────────────────────┴────────────┘
 *
 * days / lines / measures 均为可选字段，缺失时对应模块自动不渲染。
 */

import { useEffect, useState } from "react";
import { loadData } from "@/config/data-source";
import type { SceneDetail, SceneDetailMap } from "./types";
import SceneKpiBar from "./SceneKpiBar";
import SceneTimeline from "./SceneTimeline";
import SceneDailyChart from "./SceneDailyChart";
import SceneLinePressure from "./SceneLinePressure";
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
      {/* 中区：KPI 横幅 + 时间轴 + 底部双卡 */}
      <div className="scene-page__main">
        <SceneKpiBar detail={detail} />
        <div className="scene-page__timeline">
          <SceneTimeline
            title={detail.title}
            date={detail.date}
            venue={detail.venue}
            nodes={detail.timeline}
            hourly={detail.hourly}
          />
        </div>
        {(detail.days || detail.lines) && (
          <div className="scene-page__bottom">
            {detail.days && (
              <div className="scene-page__bottom-item scene-page__bottom-item--days">
                <SceneDailyChart days={detail.days} />
              </div>
            )}
            {detail.lines && (
              <div className="scene-page__bottom-item">
                <SceneLinePressure lines={detail.lines} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 右栏：预测详情面板（含小地图） */}
      <div className="scene-page__panel">
        <ScenePanel sceneId={sceneId} />
      </div>
    </div>
  );
}
