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
    "relative w-full rounded-md border bg-surface-2 pl-3 pr-10 py-3 text-left text-text-primary transition-[border-color,background-color,box-shadow] duration-200 ease-out focus-visible:shadow-[0_0_0_3px_rgba(255,107,53,0.18)] focus-visible:outline-none focus-visible:[outline-offset:0] disabled:cursor-not-allowed disabled:opacity-60";
  const withError = "border-error focus-visible:border-error";
  const normal = "border-border-default focus-visible:border-accent-primary";
  return `${base} ${props.error ? withError : normal}`;
});

const optionsPanelClasses =
  "absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-md border border-border-default bg-surface py-1 shadow-lg focus:outline-none";

const optionClasses = (active: boolean, selected: boolean, disabled?: boolean) => {
  const base =
    "relative mx-1 cursor-pointer select-none rounded-md py-2.5 pl-3 pr-9 text-sm transition-colors duration-150";

  if (disabled) {
    return `${base} cursor-not-allowed text-text-muted opacity-50`;
  }

  if (active) {
    return `${base} bg-surface-2 text-text-primary`;
  }

  if (selected) {
    return `${base} bg-surface-3 text-text-primary`;
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

    <p v-if="error" class="mt-2 text-sm text-error">{{ error }}</p>
    <p v-else-if="hint" class="mt-2 text-xs text-text-muted">{{ hint }}</p>
  </div>
</template>
