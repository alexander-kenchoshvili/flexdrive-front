<script setup lang="ts">
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
} from "@heroicons/vue/24/outline";
import BaseButton from "~/components/common/BaseButton.vue";

withDefaults(
  defineProps<{
    preview?: boolean;
    loading?: boolean;
    error?: string;
  }>(),
  {
    preview: false,
    loading: false,
    error: "",
  },
);

defineEmits<{
  download: [];
}>();
</script>

<template>
  <section
    class="overflow-hidden rounded-[24px] border border-accent-primary/25 bg-surface shadow-[0_24px_60px_-42px_var(--shadow-color)]"
    aria-labelledby="receipt-download-title"
  >
    <div
      class="flex min-w-0 flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 md:p-6"
    >
      <div class="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
        <span
          class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-accent-primary/25 bg-accent-primary/10 text-accent-primary sm:h-14 sm:w-14 sm:rounded-[18px]"
        >
          <DocumentTextIcon class="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
        </span>

        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h2
              id="receipt-download-title"
              class="text-base font-extrabold text-text-primary sm:text-lg"
            >
              ელექტრონული ჩეკი
            </h2>
            <span
              v-if="preview"
              class="inline-flex rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-[10px] font-bold upper tracking-[0.08em] text-warning"
            >
              სატესტო PDF
            </span>
          </div>
          <p class="mt-1.5 max-w-2xl text-xs leading-5 text-text-secondary sm:text-sm sm:leading-6">
            {{
              preview
                ? "ჩამოტვირთე შეკვეთის სატესტო დოკუმენტი. იგი გადახდას არ ადასტურებს."
                : "ჩამოტვირთე გადახდისა და შეკვეთის დეტალების PDF დოკუმენტი."
            }}
          </p>
          <p
            v-if="error"
            class="mt-2 text-xs font-semibold leading-5 text-error"
            role="alert"
          >
            {{ error }}
          </p>
        </div>
      </div>

      <div class="flex shrink-0 flex-col gap-2 sm:items-end">
        <BaseButton
          type="button"
          variant="primary"
          class="w-full min-h-11 sm:w-auto"
          :loading="loading"
          :disabled="loading"
          @click="$emit('download')"
        >
          <template #left>
            <ArrowDownTrayIcon class="h-4 w-4" aria-hidden="true" />
          </template>
          {{ loading ? "მზადდება..." : "PDF-ის ჩამოტვირთვა" }}
        </BaseButton>
        <span class="inline-flex items-center gap-1.5 text-[11px] text-text-muted">
          <ShieldCheckIcon class="h-3.5 w-3.5" aria-hidden="true" />
          დაცული ჩამოტვირთვა
        </span>
      </div>
    </div>
  </section>
</template>
