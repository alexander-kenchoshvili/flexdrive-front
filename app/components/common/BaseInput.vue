<script setup lang="ts">
defineOptions({ inheritAttrs: false });

type BaseInputProps = {
  modelValue?: string;
  label?: string;
  type?: string;
  name?: string;
  id?: string;
  placeholder?: string;
  autocomplete?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  passwordToggle?: boolean;
  prefixIcon?: string;
  prefixIconSize?: number | string;
};

const props = withDefaults(defineProps<BaseInputProps>(), {
  modelValue: "",
  type: "text",
  label: "",
  name: "",
  id: "",
  placeholder: "",
  autocomplete: "",
  error: "",
  hint: "",
  required: false,
  disabled: false,
  passwordToggle: true,
  prefixIcon: "",
  prefixIconSize: 18,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();
const attrs = useAttrs();

const uid = useId();
const inputId = computed(() => props.id || props.name || `input-${uid}`);
const isPasswordVisible = ref(false);

const isPasswordType = computed(() => props.type === "password");
const shouldShowPasswordToggle = computed(
  () => isPasswordType.value && props.passwordToggle,
);
const hasPrefixIcon = computed(() => Boolean(props.prefixIcon?.trim()));

const actualInputType = computed(() => {
  if (!isPasswordType.value) return props.type;
  return isPasswordVisible.value ? "text" : "password";
});

const inputClasses = computed(() => {
  const base =
    "w-full rounded-md border bg-surface-2 py-3 text-text-primary placeholder:text-text-muted transition-[border-color,background-color,box-shadow] duration-200 ease-out focus:bg-surface focus-visible:shadow-[0_0_0_3px_rgba(255,107,53,0.18)] focus-visible:outline-none focus-visible:[outline-offset:0]";
  const paddingClasses = (() => {
    if (hasPrefixIcon.value && shouldShowPasswordToggle.value) return "pl-11 pr-11";
    if (hasPrefixIcon.value) return "pl-11 pr-3";
    if (shouldShowPasswordToggle.value) return "pl-3 pr-11";
    return "px-3";
  })();
  const withError = "border-error focus:border-error focus-visible:border-error";
  const normal =
    "border-border-default focus:border-accent-primary focus-visible:border-accent-primary";

  return `${base} ${paddingClasses} ${props.error ? withError : normal}`;
});

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement | null;
  emit("update:modelValue", target?.value ?? "");
};

const togglePasswordVisibility = () => {
  isPasswordVisible.value = !isPasswordVisible.value;
};

const rootClass = computed(() => (attrs.class as any) ?? undefined);
const rootStyle = computed(() => (attrs.style as any) ?? undefined);

const inputAttrs = computed(() => {
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
      :for="inputId"
      class="mb-2 block text-sm font-semibold text-text-secondary"
    >
      {{ label }}
    </label>

    <div class="relative">
      <span
        v-if="hasPrefixIcon"
        class="pointer-events-none absolute left-3 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center text-text-muted"
      >
        <BaseIcon
          :name="prefixIcon"
          :size="prefixIconSize"
        />
      </span>

      <input
        :id="inputId"
        :name="name || undefined"
        :type="actualInputType"
        :value="modelValue"
        :placeholder="placeholder"
        :autocomplete="autocomplete || undefined"
        :required="required"
        :disabled="disabled"
        :class="inputClasses"
        v-bind="inputAttrs"
        @input="onInput"
      />

      <button
        v-if="shouldShowPasswordToggle"
        type="button"
        class="absolute right-3 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center p-0 leading-none text-text-muted transition-colors hover:text-text-secondary focus-visible:text-text-secondary disabled:cursor-not-allowed disabled:opacity-50"
        :aria-label="isPasswordVisible ? 'Hide password' : 'Show password'"
        :title="isPasswordVisible ? 'Hide password' : 'Show password'"
        :disabled="disabled"
        @mousedown.prevent
        @click="togglePasswordVisibility"
      >
        <BaseIcon :name="isPasswordVisible ? 'eye-off' : 'eye'" :size="20" />
      </button>
    </div>

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
