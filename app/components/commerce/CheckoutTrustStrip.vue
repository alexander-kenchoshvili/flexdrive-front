<script setup lang="ts">
import { PhoneIcon, ShieldCheckIcon, TruckIcon } from "@heroicons/vue/24/outline";

const items = [
  {
    id: "secure-order",
    title: "უსაფრთხო შეკვეთა",
    description: "შეკვეთა ინახება უსაფრთხოდ და ეტაპობრივად მოწმდება.",
    icon: ShieldCheckIcon,
  },
  {
    id: "operator-call",
    title: "დაგიკავშირდებით დასადასტურებლად",
    description: "შეკვეთის მიღების შემდეგ ოპერატორი დაგირეკავთ მოკლე დროში.",
    icon: PhoneIcon,
  },
  {
    id: "delivery-terms",
    title: "მიწოდება შეთანხმდება ოპერატორთან",
    description: "მისამართი, დრო და დეტალები საბოლოოდ ზუსტდება შეკვეთის შემდეგ.",
    icon: TruckIcon,
  },
];
</script>

<template>
  <section
    class="grid gap-3 rounded-[24px] border border-border-default bg-surface p-4 shadow-[0_24px_60px_-38px_var(--shadow-color)] sm:grid-cols-3 md:p-5"
  >
    <article
      v-for="item in items"
      :key="item.id"
      class="rounded-[18px] border border-border-default bg-surface-2 p-4"
    >
      <span
        class="inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-border-default bg-surface text-text-primary"
      >
        <component :is="item.icon" class="h-5 w-5" aria-hidden="true" />
      </span>

      <p class="mt-4 text-sm font-bold text-text-primary">
        {{ item.title }}
      </p>
      <p class="mt-2 text-sm leading-6 text-text-secondary">
        {{ item.description }}
      </p>
    </article>
  </section>
</template>
