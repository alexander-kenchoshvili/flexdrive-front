<script setup lang="ts">
import { HeartIcon as HeartSolidIcon } from "@heroicons/vue/24/solid";
import { HeartIcon as HeartOutlineIcon } from "@heroicons/vue/24/outline";
import { useAuthBootstrap } from "~/composables/useAuthBootstrap";

const props = withDefaults(
  defineProps<{
    productId: number;
    size?: "sm" | "md";
    label?: string;
  }>(),
  {
    size: "md",
    label: "სასურველებში შენახვა",
  },
);

const globalStore = useGlobalStore();
const wishlistStore = useWishlistStore();
const { ensureAuthResolved } = useAuthBootstrap();

const isSaved = computed(() => wishlistStore.hasProduct(props.productId));
const isPending = computed(() => wishlistStore.isMutatingProduct(props.productId));

const sizeClasses = computed(() =>
  props.size === "sm"
    ? "h-9 w-9 rounded-full"
    : "h-11 w-11 rounded-[14px]",
);

const iconClasses = computed(() => (props.size === "sm" ? "h-5 w-5" : "h-6 w-6"));

const buttonClasses = computed(() => [
  "inline-flex items-center justify-center border transition-colors duration-200",
  sizeClasses.value,
  isSaved.value
    ? "border-accent-primary/30 bg-accent-primary/12 text-accent-primary hover:bg-accent-primary/18"
    : "border-border-default bg-surface-2 text-text-secondary hover:border-accent-primary/30 hover:bg-surface hover:text-accent-primary",
  isPending.value ? "cursor-wait opacity-70" : "",
]);

const handleClick = async () => {
  if (isPending.value) return;

  if (!globalStore.authResolved) {
    await ensureAuthResolved();
  }

  try {
    await wishlistStore.toggleItem(props.productId);
  } catch {
    // Store-level error is enough for v1.
  }
};
</script>

<template>
  <button
    type="button"
    :aria-label="label"
    :aria-pressed="isSaved"
    :title="label"
    :disabled="isPending"
    :class="buttonClasses"
    @click.prevent.stop="handleClick"
  >
    <span
      v-if="isPending"
      class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <HeartSolidIcon v-else-if="isSaved" :class="iconClasses" aria-hidden="true" />
    <HeartOutlineIcon v-else :class="iconClasses" aria-hidden="true" />
  </button>
</template>
