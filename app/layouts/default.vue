<script setup lang="ts">
const route = useRoute();
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <Header />

    <main class="flex-grow" :class="{ 'home-page': route.path === '/' }">
      <slot />
    </main>

    <Footer />
  </div>
</template>
