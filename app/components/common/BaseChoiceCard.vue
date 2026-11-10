<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string;
  value: string;
  name: string;
  title: string;
  description?: string;
  price?: string;
  badge?: string;
  disabled?: boolean;
}>(), { description: "", price: "", badge: "", disabled: false });
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
const selected = computed(() => props.modelValue === props.value);
</script>

<template>
  <label
    class="relative flex min-w-0 items-start gap-3 rounded-[18px] border p-3 text-left transition-colors duration-200 focus-within:ring-2 focus-within:ring-accent-primary/50 sm:gap-4 sm:rounded-[20px] sm:p-5"
    :class="[
      disabled ? 'cursor-not-allowed border-border-default bg-surface-2 opacity-70' : 'cursor-pointer',
      selected ? 'border-accent-primary bg-accent-primary/8' : 'border-border-default bg-surface-2',
      !disabled && !selected ? 'hover:border-accent-primary/60 hover:bg-surface' : '',
    ]"
  >
    <input
type="radio" class="sr-only" :name="name" :value="value" :checked="selected"
      :disabled="disabled" @change="emit('update:modelValue', value)">
    <span v-if="$slots.icon" class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-border-default bg-surface text-text-primary">
      <slot name="icon" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <span class="break-words text-sm font-bold leading-6 text-text-primary sm:text-base">{{ title }}</span>
        <span v-if="price" class="shrink-0 text-base font-extrabold tabular-nums text-text-primary">{{ price }}</span>
      </span>
      <span v-if="badge" class="mt-1.5 inline-flex rounded-full border border-border-default bg-surface px-2.5 py-1 text-[11px] font-semibold text-text-secondary">{{ badge }}</span>
      <span v-if="description" class="mt-1.5 block break-words text-sm leading-6 text-text-secondary">{{ description }}</span>
      <slot />
    </span>
    <span
aria-hidden="true" class="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
      :class="selected ? 'border-accent-primary bg-accent-primary' : 'border-border-default bg-transparent'">
      <span v-if="selected" class="h-2 w-2 rounded-full bg-text-invert" />
    </span>
  </label>
</template>
