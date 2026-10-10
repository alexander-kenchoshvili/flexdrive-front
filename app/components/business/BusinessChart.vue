<script setup lang="ts">
import { init, use, type EChartsType } from "echarts/core";
import { LineChart, BarChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent, AriaComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { reportMoney, reportNumber, reportDate, type ReportDay, type ReportSection } from "~/utils/businessReport";

use([LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, AriaComponent, CanvasRenderer]);
const props = defineProps<{ daily: ReportDay[]; section: ReportSection }>();
const container = ref<HTMLElement | null>(null);
const { isDark } = useTheme();
let chart: EChartsType | undefined;
let observer: ResizeObserver | undefined;
const draw = () => {
  if (!chart) return;
  const theme = getComputedStyle(document.documentElement);
  const color = (token: string) => theme.getPropertyValue(token).trim();
  const finance = props.section === "finance";
  const sales = props.section === "sales";
  chart.setOption({
    animation: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    color: [color("--accent-primary"), color(sales ? "--text-secondary" : "--error")],
    textStyle: { fontFamily: "Noto Sans Georgian", color: color("--text-muted") },
    aria: { enabled: true, description: props.section === "overview" ? "მიღებული და დაბრუნებული თანხები დღეების მიხედვით. დეტალური მონაცემები მოცემულია ფინანსების სექციაში." : "დადასტურებული მონაცემები დღეების მიხედვით. ზუსტი მაჩვენებლები მოცემულია ქვემოთ ცხრილში." },
    grid: { left: 16, right: 24, top: 55, bottom: 25, containLabel: true },
    legend: { top: 8, textStyle: { fontFamily: "Noto Sans Georgian", color: color("--text-secondary"), fontSize: 11 }, itemWidth: 18, itemHeight: 9 },
    tooltip: { trigger: "axis", renderMode: "richText", backgroundColor: color("--surface"), borderColor: color("--border-default"), textStyle: { color: color("--text-primary"), fontFamily: "Noto Sans Georgian", fontSize: 12 }, valueFormatter: (value: unknown) => (sales ? reportNumber : reportMoney)(value == null ? null : Number(value)) },
    xAxis: { type: "category", boundaryGap: finance, data: props.daily.map((day) => reportDate(day.date)), axisLine: { lineStyle: { color: color("--border-default") } }, axisTick: { show: false }, axisLabel: { fontSize: 10, hideOverlap: true, formatter: (value: string) => value.slice(0, 5) } },
    yAxis: { type: "value", minInterval: sales ? 1 : undefined, axisLabel: { fontSize: 10, formatter: (value: number) => `${new Intl.NumberFormat("ka-GE", { notation: "compact" }).format(value)}${sales ? '' : ' ₾'}` }, splitLine: { lineStyle: { color: color("--border-default"), type: "dashed" } } },
    series: finance ? [
      { name: "პროდუქტების მოგება, დღგ-ის გარეშე", type: "bar", barMaxWidth: 24, data: props.daily.map((day) => day.product_profit_net == null ? null : Number(day.product_profit_net)), itemStyle: { borderRadius: [3, 3, 0, 0] } },
    ] : sales ? [
      { name: "გადახდილი შეკვეთები", type: "line", showSymbol: false, smooth: false, data: props.daily.map((day) => day.paid_orders), lineStyle: { width: 2 } },
      { name: "გაყიდული ერთეულები", type: "line", showSymbol: false, smooth: false, data: props.daily.map((day) => day.sold_units), lineStyle: { width: 2, type: "dashed" } },
    ] : [
      { name: "მიღებული თანხა", type: "line", showSymbol: false, smooth: false, data: props.daily.map((day) => Number(day.received)), lineStyle: { width: 2 } },
      { name: "დაბრუნებული თანხა", type: "line", showSymbol: false, smooth: false, data: props.daily.map((day) => Number(day.refunded)), lineStyle: { width: 2, type: "dashed" } },
    ],
  }, { notMerge: true });
};
onMounted(() => {
  if (!container.value) return;
  chart = init(container.value);
  draw();
  observer = new ResizeObserver(() => chart?.resize());
  observer.observe(container.value);
});
watch(() => [props.daily, props.section], draw);
watch(isDark, async () => { await nextTick(); draw(); });
onBeforeUnmount(() => { observer?.disconnect(); chart?.dispose(); chart = undefined; });
</script>

<template>
  <div ref="container" class="h-[300px] w-full md:h-[340px]" />
</template>
