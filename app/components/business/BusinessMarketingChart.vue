<script setup lang="ts">
import { init, use, type EChartsType } from "echarts/core";
import { BarChart } from "echarts/charts";
import { GridComponent, TooltipComponent, AriaComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { reportDate } from "~/utils/businessReport";
import { marketingMoney, type AdDay } from "~/utils/businessMarketing";

use([BarChart, GridComponent, TooltipComponent, AriaComponent, CanvasRenderer]);
const props = defineProps<{ daily: AdDay[]; currency: string }>();
const container = ref<HTMLElement | null>(null);
const { isDark } = useTheme();
let chart: EChartsType | undefined, observer: ResizeObserver | undefined;
const draw = () => {
  if (!chart) return;
  const theme = getComputedStyle(document.documentElement), color = (token: string) => theme.getPropertyValue(token).trim();
  chart.setOption({
    animation: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    color: [color("--accent-primary")], textStyle: { fontFamily: "Noto Sans Georgian", color: color("--text-muted") },
    aria: { enabled: true, description: "რეკლამის ხარჯი დღეების მიხედვით. ზუსტი რიცხვები მოცემულია ქვემოთ ცხრილში." },
    grid: { left: 16, right: 24, top: 30, bottom: 25, containLabel: true },
    tooltip: { trigger: "axis", renderMode: "richText", backgroundColor: color("--surface"), borderColor: color("--border-default"), textStyle: { color: color("--text-primary"), fontFamily: "Noto Sans Georgian", fontSize: 12 }, valueFormatter: (value: unknown) => marketingMoney(value == null ? null : Number(value), props.currency) },
    xAxis: { type: "category", data: props.daily.map((day) => reportDate(day.date)), axisLine: { lineStyle: { color: color("--border-default") } }, axisTick: { show: false }, axisLabel: { fontSize: 10, hideOverlap: true, formatter: (value: string) => value.slice(0, 5) } },
    yAxis: { type: "value", min: 0, axisLabel: { fontSize: 10 }, splitLine: { lineStyle: { color: color("--border-default"), type: "dashed" } } },
    series: [{ name: `რეკლამის ხარჯი (${props.currency})`, type: "bar", barMaxWidth: 28, data: props.daily.map((day) => Number(day.spend)), itemStyle: { borderRadius: [3, 3, 0, 0] } }],
  }, { notMerge: true });
};
onMounted(() => {
  if (!container.value) return;
  chart = init(container.value); draw();
  observer = new ResizeObserver(() => chart?.resize()); observer.observe(container.value);
});
watch(() => [props.daily, props.currency], draw);
watch(isDark, async () => { await nextTick(); draw(); });
onBeforeUnmount(() => { observer?.disconnect(); chart?.dispose(); chart = undefined; });
</script>

<template>
  <div ref="container" class="h-[300px] w-full md:h-[340px]" />
</template>
