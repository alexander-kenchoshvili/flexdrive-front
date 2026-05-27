type Theme = "light" | "dark";

const THEME_COOKIE_NAME = "theme";
const THEME_COOKIE_MAX_AGE = 31536000;

const isTheme = (value: unknown): value is Theme =>
  value === "light" || value === "dark";

const readThemeCookie = (): Theme | null => {
  const match = document.cookie.match(/(?:^|;\s*)theme=(light|dark)(?:;|$)/);
  return isTheme(match?.[1]) ? match[1] : null;
};

const getSystemTheme = (): Theme => {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
};

const resolveInitialTheme = (): Theme => {
  const cookieTheme = readThemeCookie();
  if (cookieTheme) {
    return cookieTheme;
  }

  const storedTheme = window.localStorage.getItem(THEME_COOKIE_NAME);
  if (isTheme(storedTheme)) {
    return storedTheme;
  }

  return getSystemTheme();
};

const applyThemeClass = (theme: Theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark");
};

export default defineNuxtPlugin({
  name: "theme-init-client",
  enforce: "pre",
  setup(nuxtApp) {
    const initialTheme = resolveInitialTheme();
    applyThemeClass(initialTheme);

    const themeState = useState<Theme>("theme", () => initialTheme);

    const themeCookie = useCookie<Theme | undefined>(THEME_COOKIE_NAME, {
      path: "/",
      maxAge: THEME_COOKIE_MAX_AGE,
      sameSite: "lax",
    });

    const persistTheme = (theme: Theme) => {
      themeCookie.value = theme;
      window.localStorage.setItem(THEME_COOKIE_NAME, theme);
    };

    nuxtApp.hook("app:mounted", () => {
      themeState.value = initialTheme;
      applyThemeClass(initialTheme);

      watch(
        themeState,
        (nextTheme) => {
          applyThemeClass(nextTheme);
          persistTheme(nextTheme);
        },
        { flush: "sync", immediate: true },
      );
    });
  },
});
