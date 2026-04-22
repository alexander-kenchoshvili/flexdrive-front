export default defineNuxtRouteMiddleware(async () => {
  const cartStore = useCartStore();

  try {
    await cartStore.ensureCartLoaded();
  } catch {
    return;
  }

  if (cartStore.initialized && cartStore.isEmpty) {
    return navigateTo("/cart");
  }
});
