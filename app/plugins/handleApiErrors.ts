import { defineNuxtPlugin } from "#app";
// import { useGlobalStore } from "~/stores/useGlobalStore";

export default defineNuxtPlugin(() => {
  const originalFetch = globalThis.$fetch;

  // ქართული კომენტარი: ვქმნით $fetch-ის ახალ ინსტანციას onResponseError ჰუკით,
  // რომელიც დაამუშავებს 429 შეცდომას გლობალურად.
  globalThis.$fetch = originalFetch.create({
    onResponseError({ response }) {
      // ქართული კომენტარი: ვამოწმებთ, თუ სერვერიდან დაბრუნებული სტატუსი არის 429 (Too Many Requests).
      if (response.status === 429) {
        //@ts-ignore
        if (process.client) {
          // ქართული კომენტარი: ვიძახებთ გლობალური store-დან setRateLimited ფუნქციას,
          // რათა აპლიკაციამ იცოდეს, რომ უნდა გამოაჩინოს შეცდომის შეტყობინება.
          const globalStore = useGlobalStore();
          globalStore.setRateLimited(true);
        }
      }
    },
  });
});
