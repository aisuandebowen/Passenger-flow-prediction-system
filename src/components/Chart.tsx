/**
 * Chart —— ECharts 封装（精简自参考模版 sc-datav/src/components/chart.tsx）
 *
 * 用法：传 option 与 use（按需引入的 echarts 模块），自动处理 resize。
 *
 *   <Chart<BarOption>
 *     use={[BarChart, GridComponent]}
 *     option={{ ... }}
 *   />
 */

import {
  type Ref,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { useSize } from "@/hooks/useSize";

echarts.use(CanvasRenderer);

export interface ChartProps<T> {
  ref?: Ref<echarts.EChartsType>;
  option: T;
  use: Parameters<typeof echarts.use>[0];
  style?: React.CSSProperties;
}

function Chart<T extends echarts.EChartsCoreOption>(props: ChartProps<T>) {
  const chartBox = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.EChartsType | null>(null);
  const size = useSize(chartBox);

  echarts.use(props.use);

  const memoOption = useMemo(() => props.option, [props.option]);

  useImperativeHandle(props.ref, () => chart.current!, []);

  useLayoutEffect(() => {
    chart.current = echarts.init(chartBox.current as HTMLElement);
    return () => {
      chart.current?.dispose();
      chart.current = null;
    };
  }, []);

  useEffect(() => {
    if (size.width !== 0 && size.height !== 0) chart.current?.resize();
  }, [size]);

  useEffect(() => {
    if (!chart.current) return;
    chart.current.setOption(memoOption, {
      notMerge: false,
      lazyUpdate: true,
      replaceMerge: ["series"],
    });
  }, [memoOption]);

  return (
    <div
      ref={chartBox}
      style={{ width: "100%", height: "100%", ...props.style }}
    />
  );
}

export default Chart;
