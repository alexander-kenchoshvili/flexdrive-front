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

// Extracts the first readable backend error, including DRF non_field_errors arrays.
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
    console.log("ERROR ->", e);
    // Show exact backend reason (e.g. expired token) when available.
    const backendMessage = extractFirstErrorMessage(e?.data || e);
    error.value = backendMessage || "აქტივაცია ვერ შესრულდა. სცადეთ თავიდან.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div
    class="mx-auto mt-12 w-full max-w-md rounded-xl border border-border-default bg-surface p-8 text-center shadow-[0_8px_24px_var(--shadow-color)]"
  >
    <p v-if="loading" class="text-text-secondary">
      თქვენი ანგარიშის აქტივაცია მიმდინარეობს...
    </p>
    <p v-else-if="success" class="text-success">
      ანგარიში წარმატებით გააქტიურდა. მალე გადახვალთ ავტორიზაციაზე...
    </p>
    <div v-else-if="error" class="space-y-4">
      <p class="rounded-md border border-border-default bg-surface-2 px-3 py-2 text-sm text-error">
        {{ error }}
      </p>
      <NuxtLink
        to="/resend-activation"
        class="text-sm font-medium text-link underline underline-offset-2 hover:text-link-hover"
      >
        ახალი აქტივაციის ბმულის გაგზავნა
      </NuxtLink>
    </div>
  </div>
</template>
