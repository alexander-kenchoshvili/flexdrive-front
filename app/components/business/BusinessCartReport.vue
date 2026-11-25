<script setup lang="ts">
import { useBusinessResource } from "~/composables/useBusinessResource";
import { reportNumber, type BusinessPeriod } from "~/utils/businessReport";
import { metaUpdated } from "~/utils/businessMarketing";
type Row = { id: number; owner: string; owner_account?: { id: number; name: string; email: string } | null; updated_at: string; products: number; units: number; items: { name: string; sku: string; quantity: number }[]; remaining: number };
type Addition = { id: number; at: string; sku: string; name: string; quantity: number; later_order?: { order_number: string; at: string } | null };
type Product = { product_id: number | null; sku: string; name: string; additions: number; units: number; carts: number; last_at: string };
type Report = { totals?: { additions: number; units: number; carts: number }; first_recorded_at?: string | null; links_limited?: boolean; status: string; note: string; generated_at: string; rows: (Row | Addition | Product)[]; total: number; page: number; pages: number };
const props = defineProps<{ period: BusinessPeriod; mode: string }>();
const route = useRoute();
const { report, loading, errorMessage, load } = useBusinessResource<Report>("/business/carts/");
const contents = computed(() => props.mode === "contents" ? (report.value?.rows || []) as Row[] : []);
const additions = computed(() => props.mode === "additions" ? (report.value?.rows || []) as Addition[] : []);
const products = computed(() => props.mode === "products" ? (report.value?.rows || []) as Product[] : []);
const apiBase = useApiBaseUrl();
const cartAdmin = (id: number) => `${apiBase.replace(/\/api\/?$/, "")}/manager-fd/commerce/cart/${id}/change/`;
const q = ref(typeof route.query.q === "string" ? route.query.q : "");
const fetchReport = () => load({ ...props.period, view: props.mode, q: typeof route.query.q === "string" ? route.query.q : "", page: typeof route.query.page === "string" ? route.query.page : "1" });
onMounted(fetchReport);
watch(() => [props.period.start, props.period.end, route.query.q, route.query.page], fetchReport);
const search = () => navigateTo({ path: route.path, query: { ...route.query, q: q.value.trim() || undefined, page: undefined } }, { replace: true });
</script>
<template>
  <section :aria-busy="loading" aria-label="კალათების ანგარიში">
    <form class="my-4 flex flex-wrap gap-3" @submit.prevent="search"><label class="min-w-0 flex-1 text-xs font-semibold">პროდუქტის სახელი ან FD კოდი<input v-model="q" maxlength="100" class="mt-2 block min-h-[44px] w-full rounded-lg border border-border-default bg-surface px-3"></label><BaseButton type="submit" class="self-end">ძიება</BaseButton></form>
    <p v-if="loading" role="status" class="py-6">იტვირთება…</p><p v-else-if="errorMessage" role="alert" class="py-6 text-error">{{ errorMessage }}</p>
    <template v-else-if="report"><p class="my-4 text-xs leading-6 text-text-muted">{{ report.note }} განახლდა {{ metaUpdated(report.generated_at) }} · თბილისის დრო.</p><p class="my-3 text-sm font-semibold">სულ: {{ reportNumber(report.total) }} {{ mode === "contents" ? "კალათა" : mode === "products" ? "პროდუქტის ჩანაწერი" : "დამატება" }}</p>
      <div v-if="mode === 'contents'" class="grid gap-4"><article v-for="row in contents" :key="row.id" class="min-w-0 rounded-xl border border-border-default bg-surface p-5"><h2 class="break-words font-bold">კალათა №{{ row.id }} · {{ row.owner }}</h2><p v-if="row.owner_account" class="mt-2 break-words text-sm text-text-secondary">მფლობელი: <strong>{{ row.owner_account.name || row.owner_account.email || `მომხმარებელი #${row.owner_account.id}` }}</strong><span v-if="row.owner_account.name && row.owner_account.email"> · {{ row.owner_account.email }}</span></p><p class="my-2 text-xs text-text-muted">{{ metaUpdated(row.updated_at) }} · {{ row.products }} პროდუქტის სახეობა · {{ row.units }} ერთეული</p><ul class="divide-y divide-border-default"><li v-for="item in row.items" :key="item.sku + item.name" class="py-3 text-sm"><strong>{{ item.sku || 'კოდი არ არის' }}</strong> · {{ item.name }} <span class="whitespace-nowrap">× {{ item.quantity }}</span></li></ul><p v-if="row.remaining" class="mt-3 text-xs text-text-muted">კიდევ {{ row.remaining }} პროდუქტი. <a :href="cartAdmin(row.id)" target="_blank" rel="noopener noreferrer" class="underline">სრული შიგთავსის გახსნა ადმინში ↗</a></p></article></div>
      <template v-if="mode !== 'contents'">
        <p class="my-3 text-xs text-text-muted">პირველი ჩაწერილი დამატება: {{ metaUpdated(report.first_recorded_at) || 'ჯერ არ არის' }}. მანამდე სრული ისტორია არ გვაქვს.</p>
        <dl v-if="report.totals" class="my-4 grid grid-cols-3 gap-3"><div><dt class="text-xs">დამატების მოქმედებები</dt><dd class="mt-2 text-xl font-bold">{{ reportNumber(report.totals.additions) }}</dd></div><div><dt class="text-xs">დამატებული ერთეულები</dt><dd class="mt-2 text-xl font-bold">{{ reportNumber(report.totals.units) }}</dd></div><div><dt class="text-xs">განსხვავებული კალათები</dt><dd class="mt-2 text-xl font-bold">{{ reportNumber(report.totals.carts) }}</dd></div></dl>
        <p v-if="report.links_limited" class="my-3 text-xs text-text-muted">შეძენასთან კავშირის შემოწმება პირველი 400 კანდიდატითაა შეზღუდული; დაუდგენელი კავშირები არ იგულისხმება.</p>
        <div class="overflow-auto rounded-xl border border-border-default bg-surface"><table v-if="mode === 'products'" class="w-full text-left text-xs"><thead><tr><th class="p-3">პროდუქტი / FD კოდი</th><th class="p-3 text-right">დამატებები</th><th class="p-3 text-right">ერთეული</th><th class="p-3 text-right">კალათები</th><th class="p-3">ბოლო დამატება</th></tr></thead><tbody><tr v-for="product in products" :key="`${product.product_id}:${product.sku}:${product.name}`" class="border-t border-border-default"><td class="min-w-[180px] max-w-[360px] break-words p-3"><strong>{{ product.sku || 'კოდი არ არის' }}</strong><p>{{ product.name }}</p></td><td class="p-3 text-right">{{ product.additions }}</td><td class="p-3 text-right">{{ product.units }}</td><td class="p-3 text-right">{{ product.carts }}</td><td class="whitespace-nowrap p-3">{{ metaUpdated(product.last_at) }}</td></tr></tbody></table>
        <table v-else class="w-full text-left text-xs"><thead><tr><th class="p-3">დამატება</th><th class="p-3">პროდუქტი / FD კოდი</th><th class="p-3">რაოდენობა</th><th class="p-3">შემდგომი შეძენის კავშირი</th></tr></thead><tbody><tr v-for="event in additions" :key="event.id" class="border-t border-border-default"><td class="whitespace-nowrap p-3">{{ metaUpdated(event.at) }}</td><td class="min-w-[180px] max-w-[360px] break-words p-3"><strong>{{ event.sku || 'კოდი არ არის' }}</strong><p>{{ event.name }}</p></td><td class="p-3">{{ event.quantity }}</td><td class="min-w-[180px] p-3"><template v-if="event.later_order">იმავე კალათიდან დადასტურებული შეკვეთა: {{ event.later_order.order_number }}<p class="mt-1 text-text-muted">{{ metaUpdated(event.later_order.at) }}</p></template><span v-else class="text-text-muted">კავშირი ვერ დადასტურდა</span></td></tr></tbody></table></div>
        <p class="mt-3 text-xs leading-6 text-text-muted">ეს ინტერესი და მოქმედებებია; პიროვნების, მიტოვებული ყიდვის ან დაკარგული შემოსავლის რაოდენობა არ არის. ნახვები და GA4-ში აღრიცხული შეძენები ცალკე, Google-ის ყიდვის გზაშია.</p>
      </template>
      <p v-if="!report.rows.length" class="rounded-xl border border-border-default bg-surface p-5 text-sm text-text-muted">ამ ფილტრებით ჩანაწერები არ მოიძებნა.</p>
      <nav v-if="report.pages > 1" class="mt-5 flex items-center gap-4 text-xs" aria-label="ანგარიშის გვერდები"><NuxtLink v-if="report.page > 1" :to="{ path: route.path, query: { ...route.query, page: report.page - 1 } }" class="inline-flex min-h-[44px] items-center underline">წინა</NuxtLink><span>{{ report.page }} / {{ report.pages }}</span><NuxtLink v-if="report.page < report.pages" :to="{ path: route.path, query: { ...route.query, page: report.page + 1 } }" class="inline-flex min-h-[44px] items-center underline">შემდეგი</NuxtLink></nav>
    </template>
  </section>
</template>
