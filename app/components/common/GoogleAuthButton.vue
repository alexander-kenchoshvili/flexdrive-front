<script setup lang="ts">
import type { GoogleCredentialResponse } from "~/composables/useGoogleIdentity";

const props = withDefaults(
  defineProps<{
    context?: "signin" | "signup";
    disabled?: boolean;
    loading?: boolean;
  }>(),
  {
    context: "signin",
    disabled: false,
    loading: false,
  },
);

const emit = defineEmits<{
  credential: [credential: string];
  error: [message: string];
}>();

const buttonRoot = ref<HTMLElement | null>(null);
const renderError = ref("");
const configured = ref(false);
let resizeObserver: ResizeObserver | null = null;

const { getGoogleClientId, renderGoogleButton } = useGoogleIdentity();

const buttonText = computed(() =>
  props.context === "signup" ? "signup_with" : "continue_with",
);

const authContext = computed(() =>
  props.context === "signup" ? "signup" : "signin",
);

const getButtonWidth = () => {
  const width = buttonRoot.value?.clientWidth || 320;
  return Math.min(Math.max(Math.floor(width), 220), 400);
};

const handleGoogleCredential = (response: GoogleCredentialResponse) => {
  if (!response.credential) {
    const message = "Google ავტორიზაციის პასუხი ვერ მივიღეთ. სცადეთ თავიდან.";
    renderError.value = message;
    emit("error", message);
    return;
  }

  renderError.value = "";
  emit("credential", response.credential);
};

const renderButton = async () => {
  if (import.meta.server || !buttonRoot.value || !configured.value) {
    return;
  }

  await nextTick();

  try {
    await renderGoogleButton(
      buttonRoot.value,
      handleGoogleCredential,
      {
        type: "standard",
        theme: "outline",
        size: "large",
        text: buttonText.value,
        shape: "rectangular",
        logo_alignment: "left",
        width: getButtonWidth(),
        locale: "ka",
      },
      authContext.value,
    );
  } catch (error: any) {
    renderError.value =
      error?.message || "Google შესვლის ღილაკის ჩატვირთვა ვერ მოხერხდა.";
    emit("error", renderError.value);
  }
};

onMounted(async () => {
  configured.value = Boolean(getGoogleClientId());
  await nextTick();
  void renderButton();

  if (buttonRoot.value && typeof ResizeObserver !== "undefined") {
    let lastWidth = getButtonWidth();
    resizeObserver = new ResizeObserver(() => {
      const nextWidth = getButtonWidth();
      if (Math.abs(nextWidth - lastWidth) < 12) {
        return;
      }

      lastWidth = nextWidth;
      void renderButton();
    });
    resizeObserver.observe(buttonRoot.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});

watch(
  () => props.context,
  () => {
    void renderButton();
  },
);
</script>

<template>
  <div v-if="configured" class="space-y-2">
    <div class="relative min-h-[44px] w-full overflow-hidden rounded-lg">
      <div
        ref="buttonRoot"
        class="flex min-h-[44px] w-full justify-center [&>div]:!mx-auto"
      />

      <div
        v-if="disabled || loading"
        class="absolute inset-0 flex items-center justify-center gap-2 rounded-lg border border-border-default bg-surface/90 px-4 text-sm font-semibold text-text-secondary backdrop-blur-sm"
        aria-live="polite"
      >
        <span
          v-if="loading"
          class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
        <span>
          {{ loading ? "Google-ით მიმდინარეობს..." : "Google შესვლა დროებით მიუწვდომელია" }}
        </span>
      </div>
    </div>

    <p v-if="renderError" class="text-center text-xs leading-5 text-error">
      {{ renderError }}
    </p>
  </div>
</template>
