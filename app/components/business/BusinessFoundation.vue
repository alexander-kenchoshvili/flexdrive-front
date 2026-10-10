<script setup lang="ts">
import { ArrowUpRightIcon, ChartBarIcon, CircleStackIcon, LinkIcon, ShieldCheckIcon, XMarkIcon, InformationCircleIcon } from "@heroicons/vue/24/outline";
import { BUSINESS_SECTIONS, type BusinessSectionKey } from "~/utils/businessRouting";

const props = defineProps<{ section: BusinessSectionKey }>();
const current = computed(() => BUSINESS_SECTIONS.find((item) => item.key === props.section) || BUSINESS_SECTIONS[0]);
const metrics = computed(() => ({
  overview: ["მიღებული თანხა", "გადახდილი შეკვეთები", "გაყიდული ერთეულები", "პროდუქტების მოგება"],
  sales: ["გადახდილი შეკვეთები", "გაყიდული ერთეულები", "მიღებული თანხა", "შეკვეთის საშუალო თანხა"],
  finance: ["მიღებული თანხა", "დაბრუნებული თანხა", "თანხა დაბრუნებების შემდეგ", "პროდუქტების მოგება"],
  users: ["ვიზიტები", "მომხმარებლები", "დასრულებული ძებნა", "უშედეგო ძებნა"],
  marketing: ["რეკლამის ხარჯი", "რეკლამის ჩვენებები", "ბმულზე კლიკები", "სოციალური აქტივობა"],
  operations: ["დაბრუნების მოლოდინი", "მიღებული დაბრუნებები", "საკუთარი მარაგი", "სინქრონიზაციის მდგომარეობა"],
})[props.section]);
const chartTitle = computed(() => ({ overview: "გაყიდვების დინამიკა", sales: "გაყიდვები დროში", finance: "თანხები დროში", users: "მომხმარებლის გზა", marketing: "კამპანიების შედეგები", operations: "მარაგი და დაბრუნებები" })[props.section]);
const sources = [
  { name: "FlexDrive-ის მონაცემები", details: "შეკვეთები · გადახდები · დაბრუნებები · საკუთარი მარაგი", status: "გაყიდვებისა და ფინანსების გვერდებზე დაკავშირებულია" },
  { name: "Google Analytics", details: "ვიზიტები · შემოსვლის წყაროები · ქცევა", status: "ჯერ არ არის დაკავშირებული" },
  { name: "Meta", details: "რეკლამა · Facebook · Instagram", status: "ჯერ არ არის დაკავშირებული" },
];
const dialog = ref<HTMLDialogElement | null>(null);
const dialogTrigger = ref<HTMLButtonElement | null>(null);
const closeDialog = () => { dialog.value?.close(); dialogTrigger.value?.focus(); };
const onDialogClick = (event: MouseEvent) => {
  const element = dialog.value;
  if (!element || event.target !== element) return;
  const bounds = element.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog();
};
</script>

<template>
  <section aria-labelledby="business-page-title">
    <div class="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:gap-6 min-[1200px]:items-end">
      <div>
        <p class="mb-2 text-[11px] font-bold leading-[18px] text-accent-primary">FLEXDRIVE · {{ current.label }}</p>
        <h1 id="business-page-title" class="text-[28px] font-extrabold leading-9 min-[1440px]:text-4xl min-[1440px]:leading-[44px]">{{ current.title }}</h1>
        <p class="mt-2 max-w-[720px] text-[13px] leading-5 text-text-muted">{{ current.description }}</p>
      </div>
      <button ref="dialogTrigger" type="button" class="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg border border-border-default bg-surface px-3.5 py-[11px] text-[13px] font-semibold text-text-secondary hover:bg-surface-2" @click="dialog?.showModal()">
        <CircleStackIcon class="h-5 w-5 shrink-0" aria-hidden="true" /> მონაცემების წყაროები
      </button>
    </div>
    <div class="flex items-start gap-2.5 rounded-lg border border-border-default bg-surface-2 p-3 text-xs leading-[18px] text-text-secondary md:px-4 md:py-3.5">
      <InformationCircleIcon class="h-[18px] w-[18px] shrink-0 text-accent-primary" aria-hidden="true" />
      <p>ამ სექციის მონაცემები ჯერ არ არის დაკავშირებული. მაჩვენებლების ადგილები გამოყოფილია; რეალური შედეგები შესაბამისი ეტაპის დასრულების შემდეგ გამოჩნდება.</p>
    </div>
    <div class="my-6 grid grid-cols-2 border-y border-border-default md:mb-7 md:grid-cols-4 md:py-[26px]" aria-label="ძირითადი მაჩვენებლები">
      <article v-for="label in metrics" :key="label" class="border-b border-r border-border-default px-3.5 py-5 even:border-r-0 [&:nth-last-child(-n+2)]:border-b-0 md:border-b-0 md:px-[22px] md:py-0 md:first:pl-0 md:even:border-r md:last:border-r-0 md:last:pr-0">
        <h2 class="text-[13px] font-semibold leading-5 text-text-secondary">{{ label }}</h2>
        <p class="mt-2 text-[30px] font-semibold leading-10 text-text-muted md:text-[34px] md:leading-[48px]" aria-label="მონაცემი ჯერ არ არის ხელმისაწვდომი">—</p>
        <p class="mt-2 text-[11px] leading-[18px] text-text-muted md:text-xs">მონაცემის დაკავშირების მოლოდინში</p>
      </article>
    </div>
    <div class="mb-6 grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-[minmax(0,1fr)_280px] lg:grid-cols-[minmax(0,1fr)_270px] min-[1200px]:grid-cols-[minmax(0,1fr)_300px] min-[1200px]:gap-6">
      <section class="min-w-0 overflow-hidden rounded-xl border border-border-default bg-surface" aria-labelledby="business-chart-title">
        <div class="flex items-start justify-between gap-2.5 px-[18px] pt-5 md:gap-4 md:px-6 md:pt-[23px]">
          <div><h2 id="business-chart-title" class="text-base font-bold leading-6">{{ chartTitle }}</h2><p class="mt-[5px] text-xs text-text-muted">პერიოდების შედარება და ცვლილების მიმართულება</p></div>
          <span class="inline-flex items-center whitespace-nowrap rounded-md border border-border-default bg-surface-2 px-2 py-1 text-[11px] font-bold text-text-muted">მოლოდინში</span>
        </div>
        <div class="mt-5 flex min-h-[240px] flex-col items-center justify-center gap-3 bg-[linear-gradient(var(--border-default)_1px,transparent_1px)] bg-[length:100%_54px] bg-[position:0_32px] px-[18px] py-7 text-center md:min-h-[268px] md:px-6 md:py-9">
          <ChartBarIcon class="h-8 w-8 shrink-0 bg-surface text-text-muted shadow-[0_0_0_12px_var(--surface)]" aria-hidden="true" />
          <h3 class="bg-surface px-2.5 py-[3px] text-sm font-semibold">აქ გამოჩნდება რეალური გრაფიკი</h3>
          <p class="max-w-[320px] bg-surface px-2 py-0.5 text-xs text-text-muted">მონაცემების დაკავშირების შემდეგ დაინახავ შედეგებსა და პერიოდების შედარებას.</p>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-1.5 border-t border-border-default px-[18px] py-3 text-[11px] text-text-muted md:gap-3 md:px-6 md:py-[13px]">
          <span>წყარო: {{ section === 'users' ? 'Google Analytics / საიტის ძებნა' : section === 'marketing' ? 'Meta' : 'FlexDrive-ის მონაცემები' }}</span><span>რიცხვები ჯერ არ გამოითვლება</span>
        </div>
      </section>
      <aside class="flex min-w-0 flex-col rounded-xl bg-footer-bg p-6 text-footer-text-primary md:p-[25px]">
        <span class="flex items-center gap-2 text-[11px] font-semibold text-footer-text-secondary"><InformationCircleIcon class="h-[17px] w-[17px] shrink-0 text-brand-primary" aria-hidden="true" /> რას გვეუბნება მონაცემი</span>
        <h2 class="mt-[18px] text-[22px] font-bold leading-[30px] md:mt-6 md:leading-8">რიცხვებს თავისი განმარტება ექნება.</h2>
        <p class="mt-3.5 text-[13px] leading-5 text-footer-text-secondary md:text-xs">თითოეულ მაჩვენებელთან გამოჩნდება, რას ითვლის, რომელი პერიოდია არჩეული და საიდან მოდის ინფორმაცია.</p>
        <div class="mt-5 h-px bg-footer-border md:mt-6" />
        <p class="mt-3.5 text-[13px] leading-5 text-footer-text-secondary md:text-xs">ნამდვილი ნული, დაუკავშირებელი წყარო და მოძველებული შედეგი ერთმანეთისგან მკაფიოდ გაირჩევა.</p>
        <button type="button" class="mt-auto flex min-h-[44px] items-center justify-between gap-3 bg-transparent pt-5 text-left text-[13px] font-semibold text-footer-text-primary md:pt-6 md:text-xs" @click="dialog?.showModal()">
          წყაროების შესახებ <ArrowUpRightIcon class="h-[17px] w-[17px] shrink-0 text-brand-primary" aria-hidden="true" />
        </button>
      </aside>
    </div>
    <div class="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2 md:gap-6">
      <section class="min-w-0 overflow-hidden rounded-xl border border-border-default bg-surface">
        <div class="px-[18px] pt-5 md:px-6 md:pt-[23px]">
          <h2 class="text-base font-bold leading-6">{{ section === 'users' ? 'რას ეძებენ მომხმარებლები' : section === 'operations' ? 'საკუთარი მარაგი და დაბრუნებები' : section === 'marketing' ? 'კამპანიების მიმოხილვა' : 'პროდუქტების შედეგები' }}</h2>
          <p class="mt-[5px] text-xs text-text-muted">მნიშვნელოვანი ინფორმაცია ერთ შეხედვაზე</p>
        </div>
        <div class="flex min-h-[210px] flex-col items-center justify-center gap-3.5 px-6 py-7 text-center text-[13px] text-text-muted">
          <CircleStackIcon class="h-7 w-7 shrink-0" aria-hidden="true" /><p>ამ სექციის მონაცემები დაკავშირების შემდეგ გამოჩნდება.</p>
        </div>
      </section>
      <section class="min-w-0 overflow-hidden rounded-xl border border-border-default bg-surface">
        <div class="px-[18px] pt-5 md:px-6 md:pt-[23px]"><h2 class="text-base font-bold leading-6">მონაცემების მდგომარეობა</h2><p class="mt-[5px] text-xs text-text-muted">რომელი წყაროა დაკავშირებული</p></div>
        <div class="px-[18px] py-2.5 md:px-6 md:pt-[13px]">
          <div v-for="source in sources" :key="source.name" class="flex items-center gap-3 border-b border-border-default py-4 last:border-0">
            <span class="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-lg bg-surface-2 text-text-muted"><LinkIcon class="h-[17px] w-[17px] shrink-0" aria-hidden="true" /></span>
            <div class="min-w-0 flex-1"><h3 class="text-[13px] font-semibold leading-5">{{ source.name }}</h3><p class="mt-[3px] text-xs leading-[18px] text-text-muted">{{ source.status }}</p></div>
            <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-border-muted" aria-hidden="true" />
          </div>
        </div>
      </section>
    </div>
    <dialog ref="dialog" class="m-auto max-h-[calc(100dvh_-_48px)] w-[calc(100%_-_32px)] max-w-[580px] overflow-y-auto rounded-[14px] border border-border-default bg-surface p-5 font-sans text-text-primary backdrop:bg-black/55 md:p-6" aria-labelledby="business-source-dialog-title" @click="onDialogClick" @cancel.prevent="closeDialog">
      <div class="flex items-center justify-between gap-4">
        <h2 id="business-source-dialog-title" class="text-lg font-bold leading-[26px] md:text-xl">მონაცემების წყაროები</h2>
        <button type="button" class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-transparent text-text-secondary hover:bg-surface-3" aria-label="განმარტების დახურვა" @click="closeDialog"><XMarkIcon class="h-5 w-5 shrink-0" aria-hidden="true" /></button>
      </div>
      <p class="mt-2 text-[13px] leading-5 text-text-muted">გაყიდვებისა და ფინანსების მონაცემები უკვე მოდის ჩვენი ბაზიდან. ამ სექციის დამატებითი წყაროები შემდეგ ეტაპებზე დაემატება.</p>
      <div class="mt-6 grid gap-3">
        <article v-for="source in sources" :key="source.name" class="rounded-lg border border-border-default p-4">
          <h3 class="text-sm font-semibold">{{ source.name }}</h3><p class="mb-2.5 mt-[5px] text-xs text-text-muted">{{ source.details }}</p><span class="text-[11px] font-semibold text-text-muted">{{ source.status }}</span>
        </article>
      </div>
      <p class="mt-5 flex gap-2 text-xs text-text-muted"><ShieldCheckIcon class="h-[17px] w-[17px] shrink-0" aria-hidden="true" /> წყაროსთან კავშირი და კერძო მონაცემებზე წვდომა სერვერზე მოწმდება.</p>
    </dialog>
  </section>
</template>
