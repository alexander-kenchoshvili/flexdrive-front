import { defineNuxtPlugin } from "#app";

export default defineNuxtPlugin(() => {
  const originalFetch = globalThis.$fetch;

  globalThis.$fetch = originalFetch.create({
    onResponseError({ response }) {
      if (response.status === 429) {
        useGlobalStore().setRateLimited(true);
      }
    },
  });
});
