type Theme = "light" | "dark";

const THEME_COOKIE_NAME = "theme";
const THEME_COOKIE_MAX_AGE = 31536000;
const THEME_TRANSITION_MS = 120;
let themeTransitionTimer: ReturnType<typeof setTimeout> | null = null;

const isTheme = (value: unknown): value is Theme =>
  value === "light" || value === "dark";

const getSystemTheme = (): Theme => {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
};

const applyThemeClass = (theme: Theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark");
};

const startThemeTransition = () => {
  const root = document.documentElement;
  root.classList.add("theme-changing");

  if (themeTransitionTimer) {
    clearTimeout(themeTransitionTimer);
  }

  themeTransitionTimer = setTimeout(() => {
    root.classList.remove("theme-changing");
    themeTransitionTimer = null;
  }, THEME_TRANSITION_MS);
};

export const useTheme = () => {
  const { preferencesConsentGranted } = useCookieConsent();
  const themeCookie = useCookie<Theme | undefined>(THEME_COOKIE_NAME, {
    path: "/",
    maxAge: THEME_COOKIE_MAX_AGE,
    sameSite: "lax",
  });

  const clearPersistedTheme = () => {
    themeCookie.value = undefined;

    if (!import.meta.client) return;

    window.localStorage.removeItem(THEME_COOKIE_NAME);
    document.cookie = `${THEME_COOKIE_NAME}=; Max-Age=0; path=/; SameSite=Lax`;
  };

  const persistTheme = (nextTheme: Theme) => {
    if (!preferencesConsentGranted.value) {
      clearPersistedTheme();
      return;
    }

    themeCookie.value = nextTheme;

    if (import.meta.client) {
      window.localStorage.setItem(THEME_COOKIE_NAME, nextTheme);
    }
  };

  const theme = useState<Theme>("theme", () => {
    if (preferencesConsentGranted.value && isTheme(themeCookie.value)) {
      return themeCookie.value;
    }

    if (import.meta.client) {
      if (document.documentElement.classList.contains("dark")) {
        return "dark";
      }
      if (preferencesConsentGranted.value) {
        const storedTheme = window.localStorage.getItem(THEME_COOKIE_NAME);
        if (isTheme(storedTheme)) {
          return storedTheme;
        }
      }
      return getSystemTheme();
    }

    return "light";
  });

  const setTheme = (nextTheme: Theme) => {
    theme.value = nextTheme;
    persistTheme(nextTheme);

    if (import.meta.client) {
      startThemeTransition();
      applyThemeClass(nextTheme);
    }
  };

  const toggleTheme = () => {
    setTheme(theme.value === "dark" ? "light" : "dark");
  };

  if (import.meta.client) {
    watch(
      preferencesConsentGranted,
      (isGranted) => {
        if (isGranted) {
          persistTheme(theme.value);
          return;
        }

        clearPersistedTheme();
      },
      { immediate: true },
    );
  }

  const isDark = computed(() => theme.value === "dark");

  return { theme, isDark, setTheme, toggleTheme };
};
