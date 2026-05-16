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
    icon-name="facebook"
    icon-container-class="bg-[#1877F2] text-white"
    label="Facebook-ით გაგრძელება"
    loading-label="Facebook-ით მიმდინარეობს..."
    opening-label="Facebook იხსნება..."
    start-path="/auth/facebook/start"
    error-message="Facebook შესვლის დაწყება ვერ მოხერხდა. სცადეთ თავიდან."
    :disabled="props.disabled"
    :loading="props.loading"
    :redirect-to="props.redirectTo"
    :return-path="props.returnPath"
    @error="emit('error', $event)"
  />
</template>
