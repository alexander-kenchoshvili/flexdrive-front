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

const renderError = ref("");
const configured = ref(false);
const requestInFlight = ref(false);

const { getGoogleClientId, requestGoogleCredential } = useGoogleIdentity();

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

const authContext = computed(() =>
  props.context === "signup" ? "signup" : "signin",
);

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

const handleClick = async () => {
  if (import.meta.server || !configured.value || props.disabled || isBusy.value) {
    return;
  }

  renderError.value = "";
  requestInFlight.value = true;

  try {
    await requestGoogleCredential(handleGoogleCredential, authContext.value);
  } catch (error: any) {
    renderError.value =
      error?.message || "Google შესვლის ფანჯარა ვერ გაიხსნა. სცადეთ თავიდან.";
    emit("error", renderError.value);
  } finally {
    requestInFlight.value = false;
  }
};

onMounted(async () => {
  configured.value = Boolean(getGoogleClientId());
});
</script>

<template>
  <div v-if="configured" class="space-y-2">
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
