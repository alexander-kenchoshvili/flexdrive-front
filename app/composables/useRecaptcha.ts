import { onMounted } from "vue";

const RECAPTCHA_SCRIPT_ID = "google-recaptcha-script";
const RECAPTCHA_LOAD_TIMEOUT_MS = 10000;

let recaptchaLoadPromise: Promise<void> | null = null;

const hasRecaptcha = () =>
  typeof window !== "undefined" &&
  typeof window.grecaptcha?.ready === "function" &&
  typeof window.grecaptcha?.execute === "function";

const createRecaptchaScriptUrl = (siteKey: string) =>
  `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;

const loadRecaptchaScript = (siteKey: string): Promise<void> => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("ReCaptcha can only load in the browser"));
  }

  if (!siteKey) {
    return Promise.reject(new Error("ReCaptcha site key is not configured"));
  }

  if (hasRecaptcha()) {
    return Promise.resolve();
  }

  if (recaptchaLoadPromise) {
    return recaptchaLoadPromise;
  }

  recaptchaLoadPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(
      RECAPTCHA_SCRIPT_ID,
    ) as HTMLScriptElement | null;
    const script = existingScript ?? document.createElement("script");

    let timeoutId = 0;

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };

    const fail = (message: string) => {
      cleanup();
      recaptchaLoadPromise = null;
      reject(new Error(message));
    };

    const resolveWhenReady = () => {
      if (!hasRecaptcha()) {
        fail("ReCaptcha loaded without a usable grecaptcha instance");
        return;
      }

      const grecaptcha = window.grecaptcha;
      if (!grecaptcha) {
        fail("ReCaptcha instance is unavailable");
        return;
      }

      grecaptcha.ready(() => {
        cleanup();
        resolve();
      });
    };

    const handleLoad = () => {
      script.dataset.loaded = "true";
      resolveWhenReady();
    };

    const handleError = () => {
      fail("Failed to load ReCaptcha");
    };

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    timeoutId = window.setTimeout(() => {
      fail("ReCaptcha load timed out");
    }, RECAPTCHA_LOAD_TIMEOUT_MS);

    if (existingScript) {
      if (script.dataset.loaded === "true") {
        resolveWhenReady();
      }

      return;
    }

    script.id = RECAPTCHA_SCRIPT_ID;
    script.src = createRecaptchaScriptUrl(siteKey);
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });

  return recaptchaLoadPromise;
};

export const useRecaptcha = () => {
  const config = useRuntimeConfig();
  const siteKey = config.public.recaptchaSiteKey;

  const preloadRecaptcha = () => loadRecaptchaScript(siteKey);

  if (import.meta.client) {
    onMounted(() => {
      void preloadRecaptcha().catch(() => {
        // Submit handlers surface the real error if the script stays unavailable.
      });
    });
  }

  const executeRecaptcha = async (action: string): Promise<string> => {
    await preloadRecaptcha();

    return new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !window.grecaptcha) {
        reject(new Error("ReCaptcha not loaded"));
        return;
      }

      const grecaptcha = window.grecaptcha;
      if (!grecaptcha) {
        reject(new Error("ReCaptcha not loaded"));
        return;
      }

      grecaptcha.ready(() => {
        grecaptcha
          .execute(siteKey, { action })
          .then((token: string) => {
            resolve(token);
          })
          .catch((error: unknown) => {
            reject(error);
          });
      });
    });
  };

  return { executeRecaptcha, preloadRecaptcha };
};

declare global {
  interface Grecaptcha {
    ready(callback: () => void): void;
    execute(siteKey: string, options: { action: string }): Promise<string>;
  }

  interface Window {
    grecaptcha?: Grecaptcha;
  }
}
