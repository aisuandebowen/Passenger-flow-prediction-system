import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { resolve } from "node:path";
import { createMockApiMiddleware } from "./mock-server.mjs";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 把 data/ 原样复制进打包产物，保证 DATA_MODE='local' 时 fetch 能取到
    viteStaticCopy({
      targets: [{ src: "data", dest: "." }],
    }),
    // 内置 API mock：DATA_MODE='api' 时无需启动后端即可联调。
    // 生产环境用真实接口时，删掉这个插件和 mock-server.mjs 即可。
    {
      name: "api-mock",
      configureServer(server) {
        server.middlewares.use(createMockApiMiddleware());
      },
      configurePreviewServer(server) {
        server.middlewares.use(createMockApiMiddleware());
      },
    },
  ],
  base: "./",
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@data": resolve(__dirname, "data"),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
