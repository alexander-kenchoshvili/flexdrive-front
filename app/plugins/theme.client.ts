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

const resolveInitialTheme = (canUsePersistedTheme: boolean): Theme => {
  if (canUsePersistedTheme) {
    const cookieTheme = readThemeCookie();
    if (cookieTheme) {
      return cookieTheme;
    }

    const storedTheme = window.localStorage.getItem(THEME_COOKIE_NAME);
    if (isTheme(storedTheme)) {
      return storedTheme;
    }
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
    const { preferencesConsentGranted } = useCookieConsent();
    const initialTheme = resolveInitialTheme(preferencesConsentGranted.value);
    applyThemeClass(initialTheme);

    const themeState = useState<Theme>("theme", () => initialTheme);

    const themeCookie = useCookie<Theme | undefined>(THEME_COOKIE_NAME, {
      path: "/",
      maxAge: THEME_COOKIE_MAX_AGE,
      sameSite: "lax",
    });

    const clearPersistedTheme = () => {
      themeCookie.value = undefined;
      window.localStorage.removeItem(THEME_COOKIE_NAME);
      document.cookie = `${THEME_COOKIE_NAME}=; Max-Age=0; path=/; SameSite=Lax`;
    };

    const persistTheme = (theme: Theme) => {
      themeCookie.value = theme;
      window.localStorage.setItem(THEME_COOKIE_NAME, theme);
    };

    nuxtApp.hook("app:mounted", () => {
      themeState.value = initialTheme;
      applyThemeClass(initialTheme);

      if (preferencesConsentGranted.value && !isTheme(themeCookie.value)) {
        const storedTheme = window.localStorage.getItem(THEME_COOKIE_NAME);
        if (isTheme(storedTheme)) {
          themeCookie.value = storedTheme;
        }
      }

      watch(
        preferencesConsentGranted,
        (isGranted) => {
          if (isGranted) {
            persistTheme(themeState.value);
            return;
          }

          clearPersistedTheme();
        },
        { immediate: true },
      );
    });
  },
});
