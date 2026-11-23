<script setup lang="ts">
import { canRetryFacebookEmail } from "~/utils/authErrors";
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

const route = useRoute();
const emailRetry = computed(() => canRetryFacebookEmail(route.query.facebook_error));

const emit = defineEmits<{
  error: [message: string];
}>();
</script>

<template>
  <SocialAuthButton
    icon-name="facebook"
    icon-container-class="bg-[#1877F2] text-white"
    :label="emailRetry ? 'ელფოსტის გაზიარებით გაგრძელება' : 'Facebook-ით გაგრძელება'"
    loading-label="Facebook-ით მიმდინარეობს..."
    opening-label="Facebook იხსნება..."
    :start-path="emailRetry ? '/auth/facebook/start?rerequest_email=1' : '/auth/facebook/start'"
    error-message="Facebook შესვლის დაწყება ვერ მოხერხდა. სცადეთ თავიდან."
    :disabled="props.disabled"
    :loading="props.loading"
    :redirect-to="props.redirectTo"
    :return-path="props.returnPath"
    @error="emit('error', $event)"
  />
  <p v-if="emailRetry" class="mt-2 text-center text-xs leading-5 text-text-muted">
    ანგარიშის შესაქმნელად ელფოსტა გვჭირდება. ღილაკზე დაჭერით Facebook ხელახლა გკითხავთ მისი გაზიარების ნებართვას.
  </p>
</template>
