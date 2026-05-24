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
    requiresSecureBrowser?: boolean;
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
    requiresSecureBrowser: false,
    returnPath: "",
  },
);

const emit = defineEmits<{
  error: [message: string];
}>();

const route = useRoute();
const renderError = ref("");
const requestInFlight = ref(false);
const showSecureBrowserModal = ref(false);

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

const isSocialInAppBrowser = () => {
  if (import.meta.server) {
    return false;
  }

  const userAgent = navigator.userAgent || "";
  return /FBAN|FBAV|FB_IAB|FBIOS|FB4A|MessengerForiOS|Instagram|Line|TikTok|BytedanceWebview/i.test(
    userAgent,
  );
};

const closeSecureBrowserModal = () => {
  showSecureBrowserModal.value = false;
};

const handleClick = () => {
  if (import.meta.server || props.disabled || isBusy.value) {
    return;
  }

  renderError.value = "";

  if (props.requiresSecureBrowser && isSocialInAppBrowser()) {
    showSecureBrowserModal.value = true;
    return;
  }

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

    <BaseModal
      :show="showSecureBrowserModal"
      @close="closeSecureBrowserModal"
    >
      <template #header>
        <div class="flex min-w-0 items-center gap-3">
          <span
            class="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border-default bg-surface-2"
            aria-hidden="true"
          >
            <BaseIcon name="google" :size="18" />
          </span>

          <h2 class="upper text-base font-bold leading-6 text-text-primary sm:text-lg">
            Google-ით შესვლა ბრაუზერში გააგრძელე
          </h2>
        </div>
      </template>

      <div class="space-y-4">
        <p class="text-sm leading-6 text-text-secondary">
          Messenger-ის შიდა ფანჯრიდან Google ზოგჯერ ბლოკავს ავტორიზაციას.
          გახსენი საიტი Chrome-ში ან Safari-ში და შემდეგ სცადე შესვლა.
        </p>

        <div
          class="rounded-lg border border-border-default bg-surface-2 px-4 py-3 text-sm leading-6 text-text-primary"
        >
          მენიუდან აირჩიე <span class="font-semibold">Open in browser</span>
          ან გახსენი ბმული ჩვეულებრივ ბრაუზერში.
        </div>
      </div>

      <template #footer>
        <BaseButton
          type="button"
          size="sm"
          class="w-full sm:w-auto"
          @click="closeSecureBrowserModal"
        >
          გასაგებია
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
