<script setup lang="ts">
import { ArrowRightIcon, LockClosedIcon } from "@heroicons/vue/24/outline";
import { businessReturnPath } from "~/utils/businessRouting";
import { resolveHttpStatusCode } from "~/utils/httpError";

definePageMeta({ layout: "business", skipCmsLoader: true });
useSeoMeta({ title: "ბიზნესპანელში შესვლა — FlexDrive", robots: "noindex, nofollow" });
const route = useRoute();
const auth = useBusinessAuth();
const { executeRecaptcha } = useRecaptcha();
const username = ref("");
const password = ref("");
const busy = ref(false);
const checking = ref(true);
const errorMessage = ref(route.query.reason === "denied"
  ? "ამ ანგარიშს ბიზნესპანელზე წვდომის უფლება არ აქვს."
  : route.query.reason === "connection" ? "სერვერთან დაკავშირება ვერ მოხერხდა. სცადეთ ხელახლა." : "");

onMounted(async () => {
  try {
    if (await auth.checkSession()) await navigateTo(businessReturnPath(route.query.next), { replace: true });
  } catch {
    errorMessage.value = "სერვერთან დაკავშირება ვერ მოხერხდა. სცადეთ ხელახლა.";
  } finally { checking.value = false; }
});

const submit = async () => {
  if (busy.value || checking.value) return;
  busy.value = true;
  errorMessage.value = "";
  try {
    const captcha = await executeRecaptcha("business_login");
    await auth.login(username.value.trim(), password.value, captcha);
    password.value = "";
    await navigateTo(businessReturnPath(route.query.next), { replace: true });
  } catch (error) {
    const status = resolveHttpStatusCode(error);
    errorMessage.value = status === 429
      ? "შესვლის მცდელობები დროებით შეზღუდულია. ცოტა ხანში სცადეთ ხელახლა."
      : status === 400 ? "შესვლის მონაცემები არასწორია ან წვდომა შეზღუდულია."
      : status === 403 || !status ? "უსაფრთხოების შემოწმება ან სერვერთან კავშირი ვერ დასრულდა. სცადეთ ხელახლა."
      : "სერვერთან დაკავშირება ვერ მოხერხდა. სცადეთ ხელახლა.";
  } finally { password.value = ""; busy.value = false; }
};
</script>

<template>
  <section class="mx-auto w-full max-w-[460px] px-5 pb-10 pt-5 md:max-w-[484px] md:px-6 md:pb-16 md:pt-12" aria-labelledby="business-login-title">
    <div class="rounded-2xl border border-border-default bg-surface px-5 py-6 shadow-[0_12px_48px_var(--shadow-color)] md:p-8">
      <div class="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent-primary md:mb-6">
        <LockClosedIcon class="h-5 w-5 shrink-0" aria-hidden="true" />
      </div>
      <h1 id="business-login-title" class="text-xl font-bold leading-7 md:text-[22px] md:leading-[30px]">ბიზნესპანელში შესვლა</h1>
      <p class="mt-2 text-[13px] leading-5 text-text-muted">გამოიყენე შენი არსებული ადმინის მომხმარებლის სახელი და პაროლი.</p>
      <form class="mt-6 space-y-5" @submit.prevent="submit">
        <BaseInput
          id="business-username"
          v-model="username"
          label="მომხმარებლის სახელი"
          name="username"
          autocomplete="username"
          autocapitalize="none"
          :spellcheck="false"
          maxlength="150"
          required
          :disabled="busy || checking"
        />
        <BaseInput
          id="business-password"
          v-model="password"
          label="პაროლი"
          name="password"
          type="password"
          autocomplete="current-password"
          maxlength="1024"
          required
          :disabled="busy || checking"
        />
        <p v-if="errorMessage" class="rounded-lg border border-error bg-surface px-3.5 py-3 text-[13px] leading-5 text-error" role="alert">{{ errorMessage }}</p>
        <BaseButton type="submit" full-width :disabled="busy || checking" :aria-busy="busy || checking">
          {{ checking ? 'სესიის შემოწმება…' : busy ? 'მოწმდება…' : 'შესვლა' }}
          <ArrowRightIcon v-if="!busy && !checking" class="h-5 w-5 shrink-0" aria-hidden="true" />
        </BaseButton>
      </form>
      <p class="mt-5 border-t border-border-default pt-5 text-[11px] leading-[18px] text-text-muted">
        დაცულია reCAPTCHA-ით. მოქმედებს Google-ის
        <a class="text-link underline underline-offset-[3px] hover:text-link-hover" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">კონფიდენციალურობის პოლიტიკა</a>
        და <a class="text-link underline underline-offset-[3px] hover:text-link-hover" href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">გამოყენების პირობები</a>.
      </p>
    </div>
  </section>
</template>
