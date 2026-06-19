<script setup lang="ts">
const route = useRoute();
const { confirmEmailChange } = useAccountApi();
const pending = ref(true);
const succeeded = ref(false);

onMounted(async () => {
  try {
    await confirmEmailChange(String(route.params.token || ""));
    succeeded.value = true;
  } finally {
    pending.value = false;
  }
});

useNoindexPage({ title: "ელფოსტის დადასტურება" });
</script>

<template>
  <main class="mx-auto flex min-h-[60vh] max-w-xl items-center px-4 py-12">
    <section class="w-full rounded-[24px] border border-border-default bg-surface p-6 text-center">
      <p v-if="pending">მოწმდება...</p>
      <p v-else-if="succeeded" class="text-text-primary">
        ელფოსტა წარმატებით შეიცვალა. უსაფრთხოებისთვის თავიდან შედი ანგარიშში.
      </p>
      <p v-else class="text-error">ბმული არასწორია ან ვადა გაუვიდა.</p>
      <BaseButton as="nuxt-link" to="/login" class="mt-5">შესვლა</BaseButton>
    </section>
  </main>
</template>
