type Theme = "light" | "dark";

export default defineNuxtPlugin(() => {
  const themeCookie = useCookie<Theme | undefined>("theme");
  const initialTheme: Theme = themeCookie.value === "dark" ? "dark" : "light";

  useState<Theme>("theme", () => initialTheme);

  useHead({
    htmlAttrs: {
      class: {
        dark: initialTheme === "dark",
      },
    },
  });
});
