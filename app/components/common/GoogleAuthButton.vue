<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    context?: "signin" | "signup";
    disabled?: boolean;
    loading?: boolean;
    redirectTo?: string;
    returnPath?: string;
  }>(),
  {
    context: "signin",
    disabled: false,
    loading: false,
    redirectTo: "/",
    returnPath: "",
  },
);

const emit = defineEmits<{
  error: [message: string];
}>();

const renderError = ref("");
const requestInFlight = ref(false);
const route = useRoute();

const isBusy = computed(() => props.loading || requestInFlight.value);

const buttonLabel = computed(() => {
  if (props.loading) {
    return "Google-ით მიმდინარეობს...";
  }

  if (requestInFlight.value) {
    return "Google იხსნება...";
  }

  return "Google-ით გაგრძელება";
});

const buildGoogleStartUrl = () => {
  const url = new URL("/auth/google/start", window.location.origin);
  url.searchParams.set("next", props.redirectTo || "/");
  url.searchParams.set("return_path", props.returnPath || route.fullPath || "/login");
  return url.toString();
};

const handleClick = async () => {
  if (import.meta.server || props.disabled || isBusy.value) {
    return;
  }

  renderError.value = "";
  requestInFlight.value = true;

  try {
    window.location.assign(buildGoogleStartUrl());
  } catch (error: any) {
    renderError.value =
      error?.message || "Google შესვლის დაწყება ვერ მოხერხდა. სცადეთ თავიდან.";
    emit("error", renderError.value);
    requestInFlight.value = false;
  }
};
</script>

<template>
  <div class="space-y-2">
    <BaseButton
      type="button"
      variant="secondary"
      :full-width="true"
      :disabled="disabled || isBusy"
      :loading="isBusy"
      class="rounded-[16px] border-border-default bg-surface-2 text-text-primary shadow-none hover:bg-surface hover:text-text-primary"
      @click="handleClick"
    >
      <template #left>
        <span
          class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white"
          aria-hidden="true"
        >
          <BaseIcon name="google" :size="16" />
        </span>
      </template>

      <span>{{ buttonLabel }}</span>
    </BaseButton>

    <p v-if="renderError" class="text-center text-xs leading-5 text-error">
      {{ renderError }}
    </p>
  </div>
</template>
