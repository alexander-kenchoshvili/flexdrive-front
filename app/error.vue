<script setup lang="ts">
import {
  ArrowPathIcon,
  HomeIcon,
  MagnifyingGlassCircleIcon,
  Squares2X2Icon,
} from "@heroicons/vue/24/outline";
import BaseButton from "~/components/common/BaseButton.vue";

type AppErrorProps = {
  error?: {
    message?: string;
    statusCode?: number;
    statusMessage?: string;
  };
};

const props = defineProps<AppErrorProps>();

const menuStore = useMenu();
const footerStore = useFooter();
const route = useRoute();

await Promise.allSettled([menuStore.fetchMenu(), footerStore.fetchFooter()]);

const statusCode = computed(() => Number(props.error?.statusCode || 500));
const isNotFound = computed(() => statusCode.value === 404);
const statusBadge = computed(() => String(statusCode.value || 500));

const pageTitle = computed(() =>
  isNotFound.value ? "გვერდი ვერ მოიძებნა" : "დროებითი შეფერხებაა",
);

const pageDescription = computed(() =>
  isNotFound.value
    ? "შესაძლოა მისამართი შეიცვალა, URL შეცდომით ჩაიწერა, ან ეს გვერდი ამჟამად აღარ არსებობს. შეგიძლია დაბრუნდე მთავარ გვერდზე ან კატალოგიდან გააგრძელო ძიება."
    : "გვერდის ჩატვირთვისას დროებითი შეფერხება დაფიქსირდა. სცადე ხელახლა, ან დაბრუნდი მთავარ გვერდზე და განაგრძე ნავიგაცია საიტზე.",
);

const helperLabel = computed(() =>
  isNotFound.value ? "Not Found" : "System Error",
);

const detailCards = computed(() =>
  isNotFound.value
    ? [
        {
          title: "შეამოწმე მისამართი",
          description:
            "თუ URL ხელით შეიყვანე, გადაამოწმე რომ ყველა ნაწილი სწორად იყოს მითითებული.",
          icon: MagnifyingGlassCircleIcon,
        },
        {
          title: "დაბრუნდი მთავარზე",
          description:
            "საიტის მთავარი გვერდიდან სწრაფად იპოვი ძირითად სექციებს და აქტიურ კატეგორიებს.",
          icon: HomeIcon,
        },
        {
          title: "გადადი კატალოგში",
          description:
            "თუ კონკრეტულ პროდუქტს ეძებ, კატალოგიდან ყველაზე მარტივად გააგრძელებ ნავიგაციას.",
          icon: Squares2X2Icon,
        },
      ]
    : [
        {
          title: "ხელახლა სცადე",
          description:
            "ხარვეზი შეიძლება დროებითი იყოს და გვერდი რამდენიმე წამში უკვე სწორად ჩაიტვირთოს.",
          icon: ArrowPathIcon,
        },
        {
          title: "დაუბრუნდი მთავარს",
          description:
            "სხვა გვერდებიდან შეგიძლია გააგრძელო მუშაობა, სანამ პრობლემური route აღდგება.",
          icon: HomeIcon,
        },
        {
          title: "გამოიყენე კატალოგი",
          description:
            "ძირითადი პროდუქტები და კატეგორიები კატალოგში ხელმისაწვდომი რჩება ნავიგაციისთვის.",
          icon: Squares2X2Icon,
        },
      ],
);

const handlePrimaryAction = async () => {
  if (isNotFound.value) {
    await clearError({ redirect: "/" });
    return;
  }

  await clearError({ redirect: route.fullPath || "/" });
};

const handleSecondaryAction = async () => {
  await clearError({ redirect: isNotFound.value ? "/catalog" : "/" });
};

useSeoMeta({
  title: () => pageTitle.value,
  description: () => pageDescription.value,
  robots: "noindex, nofollow",
  ogTitle: () => pageTitle.value,
  ogDescription: () => pageDescription.value,
  twitterTitle: () => pageTitle.value,
  twitterDescription: () => pageDescription.value,
});
</script>

<template>
  <NuxtLayout name="default">
    <section class="py-8 pb-16 md:py-10 md:pb-20 lg:py-14">
      <div class="container-fluid">
        <div class="mx-auto max-w-[1160px]">
          <section
            class="relative overflow-hidden rounded-[30px] border border-border-default bg-surface shadow-[0_28px_80px_-42px_var(--shadow-color)]"
          >
            <div
              class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,107,53,0.14),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(255,107,53,0.08),transparent_36%)]"
            />

            <div
              class="relative grid gap-8 px-6 py-10 md:px-10 md:py-14 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center lg:gap-12 lg:px-14"
            >
              <div class="flex flex-col items-start">
                <span
                  class="inline-flex items-center rounded-full border border-border-default bg-surface-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent-primary"
                >
                  {{ helperLabel }}
                </span>

                <div
                  class="mt-6 inline-flex h-28 w-28 items-center justify-center rounded-[28px] border border-border-default bg-surface-2 text-[40px] font-extrabold leading-none text-text-primary shadow-[0_18px_42px_-28px_var(--shadow-color)] md:h-32 md:w-32 md:text-[48px]"
                >
                  {{ statusBadge }}
                </div>
              </div>

              <div class="min-w-0">
                <h1
                  class="title-under-xs text-[34px] font-extrabold leading-tight text-text-primary md:text-[46px] lg:text-[56px]"
                >
                  {{ pageTitle }}
                </h1>

                <p
                  class="subtitle-under-xs mt-4 max-w-3xl text-sm leading-7 text-text-secondary md:text-base lg:text-[17px] lg:leading-8"
                >
                  {{ pageDescription }}
                </p>

                <div class="mt-8 flex flex-col gap-3 sm:flex-row">
                  <BaseButton
                    type="button"
                    variant="primary"
                    class="px-6 py-3.5 text-sm upper sm:min-w-[220px]"
                    @click="handlePrimaryAction"
                  >
                    {{ isNotFound ? "მთავარზე დაბრუნება" : "ხელახლა ცდა" }}
                  </BaseButton>

                  <BaseButton
                    type="button"
                    variant="secondary"
                    class="px-6 py-3.5 text-sm upper sm:min-w-[220px]"
                    @click="handleSecondaryAction"
                  >
                    {{ isNotFound ? "კატალოგში გადასვლა" : "მთავარ გვერდზე" }}
                  </BaseButton>
                </div>

                <div class="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <article
                    v-for="card in detailCards"
                    :key="card.title"
                    class="rounded-[22px] border border-border-default bg-surface-2/80 p-5"
                  >
                    <div
                      class="inline-flex h-12 w-12 items-center justify-center rounded-[16px] border border-border-default bg-surface text-accent-primary"
                    >
                      <component :is="card.icon" class="h-6 w-6" aria-hidden="true" />
                    </div>

                    <h2 class="mt-4 text-lg font-bold text-text-primary">
                      {{ card.title }}
                    </h2>

                    <p class="mt-2 text-sm leading-6 text-text-secondary">
                      {{ card.description }}
                    </p>
                  </article>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  </NuxtLayout>
</template>
