<script setup lang="ts">
const route = useRoute();
const router = useRouter();

definePageMeta({
  skipCmsLoader: true,
});

const loading = ref(true);
const success = ref(false);
const error = ref<string | null>(null);

useNoindexPage({
  title: "ანგარიშის აქტივაცია",
  description: "ანგარიშის აქტივაციის ტექნიკური გვერდი.",
});

const extractFirstErrorMessage = (payload: any): string | null => {
  if (!payload) return null;
  if (typeof payload === "string") return payload;

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const nested = extractFirstErrorMessage(item);
      if (nested) return nested;
    }
    return null;
  }

  if (typeof payload === "object") {
    const priorityKeys = ["detail", "message", "non_field_errors"];
    const keys = [...priorityKeys, ...Object.keys(payload)];
    const seen = new Set<string>();

    for (const key of keys) {
      if (seen.has(key) || !(key in payload)) continue;
      seen.add(key);

      const nested = extractFirstErrorMessage(payload[key]);
      if (nested) return nested;
    }
  }

  return null;
};

onMounted(async () => {
  const token = route.params.token;

  try {
    await secureFetchRaw("/accounts/activate/", {
      method: "POST",
      body: { token },
      headers: {
        "Content-Type": "application/json",
      },
    });
    success.value = true;

    setTimeout(() => {
      router.push("/login");
    }, 2000);
  } catch (e: any) {
    const backendMessage = extractFirstErrorMessage(e?.data || e);
    error.value = backendMessage || "აქტივაცია ვერ შესრულდა. სცადეთ თავიდან.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section
    class="bg-[linear-gradient(135deg,var(--bg-primary)_0%,var(--surface)_46%,var(--section-soft)_100%)] text-text-primary"
  >
    <div
      class="container-fluid flex min-h-[420px] items-start justify-center py-6 sm:py-10 lg:min-h-[560px] lg:py-14 xl:py-16"
    >
      <div
        class="w-full max-w-[460px] rounded-[24px] border border-border-default bg-surface p-4 text-center shadow-[0_26px_70px_-44px_var(--shadow-color)] sm:p-6 lg:p-7"
      >
        <p
          class="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-primary"
        >
          ანგარიშის აქტივაცია
        </p>
        <h1
          class="title-under-xs upper mt-2 text-[26px] font-extrabold leading-tight text-text-primary sm:text-[30px]"
        >
          ელ.ფოსტის დადასტურება
        </h1>

        <div class="mt-5">
          <p
            v-if="loading"
            class="rounded-[16px] border border-border-default bg-surface-2 px-4 py-3 text-sm font-medium text-text-secondary"
          >
            თქვენი ანგარიშის აქტივაცია მიმდინარეობს...
          </p>
          <p
            v-else-if="success"
            class="rounded-[16px] border border-success/20 bg-success/5 px-4 py-3 text-sm font-medium text-success"
          >
            ანგარიში წარმატებით გააქტიურდა. მალე გადახვალთ ავტორიზაციაზე...
          </p>
          <div v-else-if="error" class="space-y-4">
            <p
              class="rounded-[16px] border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error"
            >
              {{ error }}
            </p>
            <NuxtLink
              to="/resend-activation"
              class="inline-flex min-h-11 items-center justify-center rounded-[16px] border border-border-default px-4 py-2 text-sm font-semibold text-accent-primary transition-colors duration-200 hover:border-accent-primary hover:bg-accent-soft hover:text-accent-hover"
            >
              ახალი აქტივაციის ბმულის გაგზავნა
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
