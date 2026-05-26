type Theme = "light" | "dark";

export default defineNuxtPlugin(() => {
  const { preferencesConsentGranted } = useCookieConsent();
  const themeCookie = useCookie<Theme | undefined>("theme");
  const initialTheme: Theme =
    preferencesConsentGranted.value && themeCookie.value === "dark"
      ? "dark"
      : "light";

  useState<Theme>("theme", () => initialTheme);

  useHead({
    htmlAttrs: {
      class: {
        dark: initialTheme === "dark",
      },
    },
  });
});
