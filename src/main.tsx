/**
 * 应用入口 —— 挂载根组件，注入全局 CSS 变量（来自 theme.ts）
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
