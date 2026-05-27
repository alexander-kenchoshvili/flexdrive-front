type Theme = "light" | "dark";

const THEME_TRANSITION_MS = 120;
let themeTransitionTimer: ReturnType<typeof setTimeout> | null = null;

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
  const theme = useState<Theme>("theme", () => {
    if (import.meta.client) {
      if (document.documentElement.classList.contains("dark")) {
        return "dark";
      }
      return getSystemTheme();
    }

    return "light";
  });

  const setTheme = (nextTheme: Theme) => {
    theme.value = nextTheme;

    if (import.meta.client) {
      startThemeTransition();
      applyThemeClass(nextTheme);
    }
  };

  const toggleTheme = () => {
    setTheme(theme.value === "dark" ? "light" : "dark");
  };

  const isDark = computed(() => theme.value === "dark");

  return { theme, isDark, setTheme, toggleTheme };
};
