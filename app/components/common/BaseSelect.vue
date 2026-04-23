<script setup lang="ts">
import {
  Listbox,
  ListboxButton,
  ListboxLabel,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/vue";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/vue/24/solid";

defineOptions({ inheritAttrs: false });

export type BaseSelectOption = {
  label: string;
  value: string | number;
  disabled?: boolean;
};

type BaseSelectProps = {
  modelValue?: string | number | null;
  options?: BaseSelectOption[];
  label?: string;
  placeholder?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
};

const props = withDefaults(defineProps<BaseSelectProps>(), {
  modelValue: null,
  options: () => [],
  label: "",
  placeholder: "Select...",
  id: "",
  name: "",
  disabled: false,
  error: "",
  hint: "",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string | number | null): void;
}>();

const attrs = useAttrs();
const uid = useId();

const selectId = computed(() => props.id || props.name || `select-${uid}`);

const selectedOption = computed(() =>
  props.options.find((option) => option.value === props.modelValue),
);

const displayLabel = computed(
  () => selectedOption.value?.label || props.placeholder,
);

const rootClass = computed(() => (attrs.class as any) ?? undefined);
const rootStyle = computed(() => (attrs.style as any) ?? undefined);

const controlClasses = computed(() => {
  const base =
    "relative min-h-11 w-full rounded-lg border bg-surface py-3 pl-3 pr-10 text-left text-sm text-text-primary shadow-[0_1px_0_rgba(17,24,39,0.03)] transition-[border-color,background-color,box-shadow] duration-200 ease-out disabled:cursor-not-allowed disabled:bg-bg-muted disabled:text-text-muted disabled:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary";
  const withError = "border-error focus-visible:border-error";
  const normal =
    "border-border-default hover:border-border-muted focus-visible:border-accent-primary";
  return `${base} ${props.error ? withError : normal}`;
});

const optionsPanelClasses =
  "absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-lg border border-border-default bg-surface py-1 shadow-[0_22px_48px_-30px_var(--shadow-color)] focus:outline-none";

const optionClasses = (active: boolean, selected: boolean, disabled?: boolean) => {
  const base =
    "relative mx-1 cursor-pointer select-none rounded-md py-2.5 pl-3 pr-9 text-sm transition-colors duration-150";

  if (disabled) {
    return `${base} cursor-not-allowed text-text-muted opacity-50`;
  }

  if (active) {
    return `${base} bg-accent-soft text-text-primary`;
  }

  if (selected) {
    return `${base} bg-accent-soft text-text-primary`;
  }

  return `${base} text-text-primary hover:bg-surface-2`;
};

const optionLabelClasses = (selected: boolean) =>
  selected ? "block truncate font-semibold" : "block truncate font-normal";

const updateValue = (value: string | number) => {
  emit("update:modelValue", value);
};
</script>

<template>
  <div :class="rootClass" :style="rootStyle">
    <Listbox
      :model-value="modelValue"
      :disabled="disabled"
      @update:model-value="updateValue"
    >
      <div class="relative">
        <ListboxLabel
          v-if="label"
          :for="selectId"
          class="mb-2 block text-sm font-semibold text-text-secondary"
        >
          {{ label }}
        </ListboxLabel>

        <ListboxButton :id="selectId" :name="name || undefined" :class="controlClasses">
          <span class="block truncate">{{ displayLabel }}</span>
          <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronUpDownIcon class="h-5 w-5 text-text-muted" aria-hidden="true" />
          </span>
        </ListboxButton>

        <transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="scale-95 opacity-0"
          enter-to-class="scale-100 opacity-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="scale-100 opacity-100"
          leave-to-class="scale-95 opacity-0"
        >
          <ListboxOptions :class="optionsPanelClasses">
            <ListboxOption
              v-for="option in options"
              :key="String(option.value)"
              :value="option.value"
              :disabled="option.disabled"
              as="template"
              v-slot="{ active, selected }"
            >
              <li :class="optionClasses(active, selected, option.disabled)">
                <span :class="optionLabelClasses(selected)">{{ option.label }}</span>
                <span
                  v-if="selected"
                  class="absolute inset-y-0 right-0 flex items-center pr-3 text-accent-primary"
                >
                  <CheckIcon class="h-5 w-5" aria-hidden="true" />
                </span>
              </li>
            </ListboxOption>
          </ListboxOptions>
        </transition>
      </div>
    </Listbox>

    <p v-if="error" class="mt-2 text-sm font-medium text-error">{{ error }}</p>
    <p v-else-if="hint" class="mt-2 text-xs leading-5 text-text-muted">{{ hint }}</p>
  </div>
</template>
