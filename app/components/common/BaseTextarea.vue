<script setup lang="ts">
defineOptions({ inheritAttrs: false });

type BaseTextareaProps = {
  modelValue?: string;
  label?: string;
  name?: string;
  id?: string;
  placeholder?: string;
  autocomplete?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
};

const props = withDefaults(defineProps<BaseTextareaProps>(), {
  modelValue: "",
  label: "",
  name: "",
  id: "",
  placeholder: "",
  autocomplete: "",
  error: "",
  hint: "",
  required: false,
  disabled: false,
  rows: 5,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const attrs = useAttrs();
const uid = useId();
const textareaId = computed(() => props.id || props.name || `textarea-${uid}`);

const textareaClasses = computed(() => {
  const base =
    "w-full rounded-md border bg-surface-2 px-3 py-3 text-text-primary placeholder:text-text-muted transition-[border-color,background-color,box-shadow] duration-200 ease-out focus:bg-surface focus-visible:shadow-[0_0_0_3px_rgba(255,107,53,0.18)] focus-visible:outline-none focus-visible:[outline-offset:0]";
  const withError = "border-error focus:border-error focus-visible:border-error";
  const normal =
    "border-border-default focus:border-accent-primary focus-visible:border-accent-primary";

  return `${base} ${props.error ? withError : normal}`;
});

const onInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement | null;
  emit("update:modelValue", target?.value ?? "");
};

const rootClass = computed(() => (attrs.class as any) ?? undefined);
const rootStyle = computed(() => (attrs.style as any) ?? undefined);

const textareaAttrs = computed(() => {
  const cloned = { ...(attrs as Record<string, unknown>) };
  delete cloned.class;
  delete cloned.style;
  return cloned;
});
</script>

<template>
  <div :class="rootClass" :style="rootStyle">
    <label
      v-if="label"
      :for="textareaId"
      class="mb-2 block text-sm font-semibold text-text-secondary"
    >
      {{ label }}
    </label>

    <textarea
      :id="textareaId"
      :name="name || undefined"
      :value="modelValue"
      :placeholder="placeholder"
      :autocomplete="autocomplete || undefined"
      :required="required"
      :disabled="disabled"
      :rows="rows"
      :class="textareaClasses"
      v-bind="textareaAttrs"
      @input="onInput"
    />

    <p v-if="error" class="mt-2 text-sm text-error">
      {{ error }}
    </p>
    <p
      v-else-if="hint"
      class="mt-2 text-xs text-text-muted dark:text-text-primary"
    >
      {{ hint }}
    </p>
  </div>
</template>
