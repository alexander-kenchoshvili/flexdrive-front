<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    errorMessage?: string;
    iconClass?: string;
    iconContainerClass?: string;
    iconName: string;
    label: string;
    loading?: boolean;
    loadingLabel: string;
    openingLabel: string;
    redirectTo?: string;
    returnPath?: string;
    startPath: string;
  }>(),
  {
    disabled: false,
    errorMessage: "ავტორიზაციის დაწყება ვერ მოხერხდა. სცადეთ თავიდან.",
    iconClass: "",
    iconContainerClass: "bg-white",
    loading: false,
    redirectTo: "/",
    returnPath: "",
  },
);

const emit = defineEmits<{
  error: [message: string];
}>();

const route = useRoute();
const renderError = ref("");
const requestInFlight = ref(false);

const isBusy = computed(() => props.loading || requestInFlight.value);

const buttonLabel = computed(() => {
  if (props.loading) {
    return props.loadingLabel;
  }

  if (requestInFlight.value) {
    return props.openingLabel;
  }

  return props.label;
});

const buildStartUrl = () => {
  const url = new URL(props.startPath, window.location.origin);
  url.searchParams.set("next", props.redirectTo || "/");
  url.searchParams.set("return_path", props.returnPath || route.fullPath || "/login");
  return url.toString();
};

const handleClick = () => {
  if (import.meta.server || props.disabled || isBusy.value) {
    return;
  }

  renderError.value = "";
  requestInFlight.value = true;

  try {
    window.location.assign(buildStartUrl());
  } catch (error: any) {
    renderError.value = error?.message || props.errorMessage;
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
          class="grid h-5 w-5 shrink-0 place-items-center rounded-full"
          :class="iconContainerClass"
          aria-hidden="true"
        >
          <BaseIcon :name="iconName" :size="16" :class="iconClass" />
        </span>
      </template>

      <span>{{ buttonLabel }}</span>
    </BaseButton>

    <p v-if="renderError" class="text-center text-xs leading-5 text-error">
      {{ renderError }}
    </p>
  </div>
</template>
