<script setup lang="ts">
import BaseSelect from "~/components/common/BaseSelect.vue";
import type { BlogSort } from "~/types/blog";

const props = withDefaults(
  defineProps<{
    resultCount?: number;
    sort?: BlogSort;
    disabled?: boolean;
  }>(),
  {
    resultCount: 0,
    sort: "newest",
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: "update:sort", value: BlogSort): void;
}>();

const sortOptions = [
  { value: "newest", label: "უახლესი → უძველესი" },
  { value: "oldest", label: "უძველესი → უახლესი" },
  { value: "read_time_asc", label: "კითხვის დრო: მოკლე → გრძელი" },
  { value: "read_time_desc", label: "კითხვის დრო: გრძელი → მოკლე" },
];

const sortModel = computed({
  get: () => props.sort ?? "newest",
  set: (value: string | number | null) => {
    if (typeof value === "string") {
      emit("update:sort", value as BlogSort);
    }
  },
});
</script>

<template>
  <div
    class="flex flex-col gap-4 rounded-[20px] border border-border-default bg-surface p-4 md:flex-row md:items-center md:justify-between"
  >
    <p class="text-sm leading-6 text-text-secondary">
      ნაპოვნია
      <span class="font-semibold text-text-primary">{{ resultCount }}</span>
      სტატია
    </p>

    <div class="flex flex-col gap-2 text-sm text-text-secondary sm:flex-row sm:items-center">
      <span class="shrink-0">დალაგება</span>
      <BaseSelect
        v-model="sortModel"
        :options="sortOptions"
        placeholder="დალაგება"
        :disabled="disabled"
        class="w-full sm:w-[260px]"
      />
    </div>
  </div>
</template>
