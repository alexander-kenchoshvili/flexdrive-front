<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";

defineOptions({ inheritAttrs: false });

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "accent-outline";
type ButtonSize = "sm" | "md" | "lg";
type ButtonAs = "button" | "a" | "nuxt-link";

type BaseButtonProps = {
  as?: ButtonAs;
  type?: "button" | "submit" | "reset";
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  to?: RouteLocationRaw;
  href?: string;
  target?: string;
  rel?: string;
};

const props = withDefaults(defineProps<BaseButtonProps>(), {
  as: "button",
  type: "button",
  variant: "primary",
  size: "md",
  fullWidth: false,
  loading: false,
  disabled: false,
  to: undefined,
  href: "",
  target: "",
  rel: "",
});

const attrs = useAttrs();
const isDisabled = computed(() => props.disabled || props.loading);

const baseClasses =
  "btn-min-h-44 inline-flex items-center justify-center gap-2 rounded-md border font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60";

const widthClasses = computed(() => (props.fullWidth ? "w-full" : ""));

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-3 text-sm",
  lg: "px-5 py-3.5 text-base",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-accent-primary bg-accent-primary text-text-invert hover:border-accent-hover hover:bg-accent-hover active:border-accent-pressed active:bg-accent-pressed",
  secondary:
    "border-border-default bg-surface text-text-primary hover:border-accent-primary hover:text-accent-primary active:border-accent-primary active:bg-accent-primary active:text-text-invert",
  "accent-outline":
    "border-accent-primary bg-transparent text-accent-primary hover:bg-accent-primary hover:text-text-invert active:border-accent-pressed active:bg-accent-pressed active:text-text-invert",
  ghost:
    "border-transparent bg-transparent text-text-secondary hover:bg-surface-2 hover:text-text-primary",
  danger: "border-error bg-error text-text-invert hover:brightness-95 active:brightness-90",
};

const computedClasses = computed(() => [
  baseClasses,
  sizeClasses[props.size],
  variantClasses[props.variant],
  widthClasses.value,
  isDisabled.value && props.as !== "button" ? "pointer-events-none" : "",
]);
</script>

<template>
  <NuxtLink
    v-if="as === 'nuxt-link'"
    :to="to || '/'"
    :class="computedClasses"
    :aria-disabled="isDisabled ? 'true' : undefined"
    :tabindex="isDisabled ? -1 : undefined"
    v-bind="attrs"
  >
    <span
      v-if="loading"
      class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <slot v-if="!loading" name="left" />
    <slot />
    <slot v-if="!loading" name="right" />
  </NuxtLink>

  <a
    v-else-if="as === 'a'"
    :href="href || undefined"
    :target="target || undefined"
    :rel="rel || undefined"
    :class="computedClasses"
    :aria-disabled="isDisabled ? 'true' : undefined"
    :tabindex="isDisabled ? -1 : undefined"
    v-bind="attrs"
  >
    <span
      v-if="loading"
      class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <slot v-if="!loading" name="left" />
    <slot />
    <slot v-if="!loading" name="right" />
  </a>

  <button
    v-else
    :type="type"
    :disabled="isDisabled"
    :class="computedClasses"
    v-bind="attrs"
  >
    <span
      v-if="loading"
      class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <slot v-if="!loading" name="left" />
    <slot />
    <slot v-if="!loading" name="right" />
  </button>
</template>
