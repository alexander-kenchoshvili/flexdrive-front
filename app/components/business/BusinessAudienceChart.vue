<script setup lang="ts">
import { init, use, type EChartsType } from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent, AriaComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { reportDate, reportNumber } from "~/utils/businessReport";
import type { AnalyticsDay } from "~/utils/businessAnalytics";

use([LineChart, GridComponent, TooltipComponent, LegendComponent, AriaComponent, CanvasRenderer]);
const props = defineProps<{ daily: AnalyticsDay[] }>();
const container = ref<HTMLElement | null>(null);
const { isDark } = useTheme();
let chart: EChartsType | undefined;
let observer: ResizeObserver | undefined;
const draw = () => {
  if (!chart) return;
  const theme = getComputedStyle(document.documentElement);
  const color = (token: string) => theme.getPropertyValue(token).trim();
  chart.setOption({
    animation: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    color: [color("--accent-primary"), color("--text-secondary")],
    textStyle: { fontFamily: "Noto Sans Georgian", color: color("--text-muted") },
    aria: { enabled: true, description: "ვიზიტები და მომხმარებლები დღეების მიხედვით. ზუსტი მონაცემები მოცემულია ქვემოთ ცხრილში." },
    grid: { left: 16, right: 24, top: 55, bottom: 25, containLabel: true },
    legend: { top: 8, textStyle: { fontFamily: "Noto Sans Georgian", color: color("--text-secondary"), fontSize: 11 }, itemWidth: 18, itemHeight: 9 },
    tooltip: { trigger: "axis", renderMode: "richText", backgroundColor: color("--surface"), borderColor: color("--border-default"), textStyle: { color: color("--text-primary"), fontFamily: "Noto Sans Georgian", fontSize: 12 }, valueFormatter: (value: unknown) => reportNumber(value == null ? null : Number(value)) },
    xAxis: { type: "category", boundaryGap: false, data: props.daily.map((day) => reportDate(day.date)), axisLine: { lineStyle: { color: color("--border-default") } }, axisTick: { show: false }, axisLabel: { fontSize: 10, hideOverlap: true, formatter: (value: string) => value.slice(0, 5) } },
    yAxis: { type: "value", minInterval: 1, axisLabel: { fontSize: 10 }, splitLine: { lineStyle: { color: color("--border-default"), type: "dashed" } } },
    series: [
      { name: "ვიზიტები", type: "line", showSymbol: false, smooth: false, data: props.daily.map((day) => day.sessions), lineStyle: { width: 2 } },
      { name: "მომხმარებლები", type: "line", showSymbol: false, smooth: false, data: props.daily.map((day) => day.users), lineStyle: { width: 2, type: "dashed" } },
    ],
  }, { notMerge: true });
};
onMounted(() => {
  if (!container.value) return;
  chart = init(container.value); draw();
  observer = new ResizeObserver(() => chart?.resize()); observer.observe(container.value);
});
watch(() => props.daily, draw);
watch(isDark, async () => { await nextTick(); draw(); });
onBeforeUnmount(() => { observer?.disconnect(); chart?.dispose(); chart = undefined; });
</script>

<template>
  <div ref="container" class="h-[300px] w-full md:h-[340px]" />
</template>
