/**
 * 顶部标题栏 —— 复用参考模版 Demo2 headder 的 SVG 标题样式
 *
 * 简化版：保留模版的蓝色标题描边字 + 两侧装饰线 + 时间显示。
 * 标题文字改配置项，方便改名。
 */

import { useEffect, useState } from "react";
import { useMoveTo } from "@/hooks/useMoveTo";
import { layout, fz } from "@/config/layout";
import "./Header.css";

export interface HeaderProps {
  /** 大屏主标题 */
  title?: string;
  /** 副标题 */
  subtitle?: string;
}

export default function Header({
  title = "北京地铁线网指挥系统",
  subtitle = "BEIJING METRO NETWORK COMMAND SYSTEM",
}: HeaderProps) {
  const { ref } = useMoveTo<HTMLDivElement>({ direction: "toBottom", duration: 0.8 });
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;
  const dateStr = `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())} 星期${weekdays[time.getDay()]}`;

  return (
    <div className="header" ref={ref} style={{ height: layout.headerHeight }}>
      <svg
        className="header__svg"
        viewBox="0 0 1920 72"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        aria-hidden="true">
        {/* 标题描边字（模版同款） */}
        <text
          x="960"
          y="46"
          textAnchor="middle"
          fill="none"
          stroke="#3061DB"
          strokeWidth="1.6"
          fontSize={fz(34)}
          fontWeight="600"
          letterSpacing="8">
          {title}
        </text>
        <text
          x="960"
          y="46"
          textAnchor="middle"
          fill="#e8efff"
          fontSize={fz(34)}
          fontWeight="600"
          letterSpacing="8">
          {title}
        </text>
        {/* 两侧装饰横线 */}
        <line x1="40" y1="36" x2="560" y2="36" stroke="#3061DB" strokeOpacity="0.35" strokeWidth="1.5" />
        <line x1="1360" y1="36" x2="1880" y2="36" stroke="#3061DB" strokeOpacity="0.35" strokeWidth="1.5" />
        <line x1="40" y1="36" x2="120" y2="36" stroke="#789eff" strokeWidth="2.5" />
        <line x1="1800" y1="36" x2="1880" y2="36" stroke="#789eff" strokeWidth="2.5" />
        {/* 底部分隔线 */}
        <line x1="0" y1="71" x2="1920" y2="71" stroke="#3061DB" strokeOpacity="0.3" strokeWidth="1" />
      </svg>

      <div className="header__subtitle">{subtitle}</div>
      <div className="header__time">
        <div className="header__clock">{timeStr}</div>
        <div className="header__date">{dateStr}</div>
      </div>
    </div>
  );
}
