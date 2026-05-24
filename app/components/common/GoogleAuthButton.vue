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
</script>

<template>
  <SocialAuthButton
    icon-name="google"
    icon-container-class="bg-white"
    label="Google-ით გაგრძელება"
    loading-label="Google-ით მიმდინარეობს..."
    opening-label="Google იხსნება..."
    start-path="/auth/google/start"
    error-message="Google შესვლის დაწყება ვერ მოხერხდა. სცადეთ თავიდან."
    :disabled="props.disabled"
    :loading="props.loading"
    :redirect-to="props.redirectTo"
    :requires-secure-browser="true"
    :return-path="props.returnPath"
    @error="emit('error', $event)"
  />
</template>
