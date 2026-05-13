<script setup lang="ts">
import {
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
} from "@heroicons/vue/24/outline";
import type { AccountProfile } from "~/types/account";

const props = defineProps<{
  profile: AccountProfile;
}>();

const fields = computed(() => [
  {
    key: "first_name",
    label: "სახელი",
    value: props.profile.first_name,
    icon: UserIcon,
  },
  {
    key: "last_name",
    label: "გვარი",
    value: props.profile.last_name,
    icon: UserIcon,
  },
  {
    key: "email",
    label: "ელფოსტა",
    value: props.profile.email,
    icon: EnvelopeIcon,
  },
  {
    key: "phone",
    label: "ტელეფონი",
    value: props.profile.phone,
    icon: PhoneIcon,
  },
  {
    key: "city",
    label: "ქალაქი",
    value: props.profile.city,
    icon: MapPinIcon,
  },
  {
    key: "address_line",
    label: "მისამართი",
    value: props.profile.address_line,
    icon: MapPinIcon,
    fullWidth: true,
  },
]);
</script>

<template>
  <section
    class="rounded-[24px] border border-border-default bg-surface p-4 shadow-[0_24px_60px_-38px_var(--shadow-color)] sm:rounded-[28px] sm:p-6 md:p-7"
  >
    <div
      class="flex flex-col gap-3 border-b border-border-default pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:pb-6"
    >
      <div class="max-w-2xl">
        <p
          class="text-xs font-semibold uppercase tracking-[0.14em] text-accent-primary"
        >
          ანგარიშის ინფორმაცია
        </p>
        <h2 class="mt-2 text-[24px] font-extrabold leading-tight text-text-primary sm:text-[28px]">
          პირადი მონაცემები
        </h2>
        <p class="mt-2 text-sm leading-6 text-text-secondary sm:mt-3 sm:leading-7">
          აქ ჩანს ძირითადი საკონტაქტო და მიწოდების ინფორმაცია, რომელიც პროფილში
          გაქვს შენახული.
        </p>
      </div>

      <div class="shrink-0">
        <slot name="action" />
      </div>
    </div>

    <div class="mt-4 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2">
      <article
        v-for="field in fields"
        :key="field.key"
        :class="[
          'min-w-0 rounded-[18px] border border-border-default bg-surface-2 px-3 py-3 shadow-[0_18px_44px_-38px_var(--shadow-color)] sm:rounded-[20px] sm:px-4 sm:py-4',
          field.fullWidth ? 'md:col-span-2' : '',
        ]"
      >
        <div class="flex items-center gap-2.5 sm:gap-3">
          <span
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] border border-border-default bg-surface text-text-muted dark:border-accent-primary/20 dark:bg-accent-primary/10 dark:text-accent-primary sm:h-10 sm:w-10 sm:rounded-[14px]"
          >
            <component :is="field.icon" class="h-5 w-5" aria-hidden="true" />
          </span>

          <div class="min-w-0">
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted"
            >
              {{ field.label }}
            </p>
            <p
              class="mt-1.5 break-words text-sm font-semibold leading-6 text-text-primary sm:mt-2 md:text-base"
            >
              {{ field.value || "არ არის შევსებული" }}
            </p>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
