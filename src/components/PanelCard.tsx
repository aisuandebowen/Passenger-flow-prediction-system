/**
 * PanelCard —— 科技风面板卡片（复用参考模版 Demo2 panel 的 SVG 切角边框）
 *
 * 模版原版：sc-datav/src/pages/Demo2/panel/index.tsx 的 Card 组件。
 * 保留：切角 SVG 描边、标题下划线装饰、悬浮+半透明底色。
 * 配置化：颜色全部来自 theme，可直接改 theme.ts 生效。
 */

import type { ReactNode } from "react";
import { theme } from "@/config/theme";
import "./PanelCard.css";

export interface PanelCardProps {
  /** 卡片标题 */
  title: string;
  /** 标题右侧可放副标题/数字 */
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function PanelCard({
  title,
  extra,
  children,
  className = "",
  style,
}: PanelCardProps) {
  return (
    <div className={`panel-card ${className}`} style={style}>
      {/* 切角描边 SVG（viewBox 固定，preserveAspectRatio 拉伸） */}
      <svg
        className="panel-card__border"
        width="100%"
        height="100%"
        fill="none"
        viewBox="0 0 260 180"
        preserveAspectRatio="none"
        aria-hidden="true">
        <path
          fill={theme.primary}
          fillRule="evenodd"
          d="M206 10 190 0H9L0 9v171h45l4.5-4h161l4.5 4h45V10h-54Zm53 1h-53.287l-16-10H9.414L1 9.414V179h43.62l4.5-4h161.76l4.5 4H259V11Z"
        />
        <path
          fill={theme.accent}
          d="m51 178-2 2h162l-2-2H51ZM0 0v7l7-7H0Z"
        />
        <path
          stroke={theme.accent}
          strokeWidth={2}
          d="M1 169v10h10M259 21V11h-10"
        />
      </svg>

      <div className="panel-card__inner">
        <div className="panel-card__title">
          <span>{title}</span>
          {extra != null && <span className="panel-card__extra">{extra}</span>}
        </div>
        <div className="panel-card__content">{children}</div>
      </div>
    </div>
  );
}
