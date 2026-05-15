const GOOGLE_IDENTITY_SCRIPT_ID = "google-identity-services-script";
const GOOGLE_IDENTITY_LOAD_TIMEOUT_MS = 10000;

let googleIdentityLoadPromise: Promise<void> | null = null;

export interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
  clientId?: string;
}

type GoogleCredentialCallback = (response: GoogleCredentialResponse) => void;

interface GoogleButtonOptions {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number | string;
  locale?: string;
}

interface GoogleInitializeOptions {
  client_id: string;
  callback: GoogleCredentialCallback;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: "signin" | "signup" | "use";
  ux_mode?: "popup" | "redirect";
  use_fedcm_for_prompt?: boolean;
}

const hasGoogleIdentity = () =>
  typeof window !== "undefined" &&
  typeof window.google?.accounts?.id?.initialize === "function" &&
  typeof window.google?.accounts?.id?.renderButton === "function";

const loadGoogleIdentityScript = (): Promise<void> => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Sign-In can only load in the browser."));
  }

  if (hasGoogleIdentity()) {
    return Promise.resolve();
  }

  if (googleIdentityLoadPromise) {
    return googleIdentityLoadPromise;
  }

  googleIdentityLoadPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(
      GOOGLE_IDENTITY_SCRIPT_ID,
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
      googleIdentityLoadPromise = null;
      reject(new Error(message));
    };

    const resolveWhenReady = () => {
      if (!hasGoogleIdentity()) {
        fail("Google Sign-In loaded without a usable client.");
        return;
      }

      cleanup();
      resolve();
    };

    const handleLoad = () => {
      script.dataset.loaded = "true";
      resolveWhenReady();
    };

    const handleError = () => {
      fail("Google Sign-In script could not be loaded.");
    };

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    timeoutId = window.setTimeout(() => {
      fail("Google Sign-In load timed out.");
    }, GOOGLE_IDENTITY_LOAD_TIMEOUT_MS);

    if (existingScript) {
      if (script.dataset.loaded === "true") {
        resolveWhenReady();
      }

      return;
    }

    script.id = GOOGLE_IDENTITY_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });

  return googleIdentityLoadPromise;
};

export const useGoogleIdentity = () => {
  const config = useRuntimeConfig();
  const getGoogleClientId = () =>
    String(config.public.googleClientId || "").trim();

  const isGoogleIdentityConfigured = () => Boolean(getGoogleClientId());

  const initializeGoogleIdentity = async (
    callback: GoogleCredentialCallback,
    context: GoogleInitializeOptions["context"] = "signin",
  ) => {
    const clientId = getGoogleClientId();

    if (!clientId) {
      throw new Error("Google შესვლა ჯერ არ არის კონფიგურირებული.");
    }

    await loadGoogleIdentityScript();

    if (!window.google?.accounts?.id) {
      throw new Error("Google შესვლის კლიენტი მიუწვდომელია.");
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback,
      auto_select: false,
      cancel_on_tap_outside: true,
      context,
      ux_mode: "popup",
      use_fedcm_for_prompt: true,
    });
  };

  const renderGoogleButton = async (
    element: HTMLElement,
    callback: GoogleCredentialCallback,
    options: GoogleButtonOptions = {},
    context: GoogleInitializeOptions["context"] = "signin",
  ) => {
    await initializeGoogleIdentity(callback, context);

    if (!window.google?.accounts?.id) {
      throw new Error("Google შესვლის კლიენტი მიუწვდომელია.");
    }

    element.innerHTML = "";
    window.google.accounts.id.renderButton(element, options);
  };

  return {
    getGoogleClientId,
    isGoogleIdentityConfigured,
    renderGoogleButton,
  };
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize(options: GoogleInitializeOptions): void;
          renderButton(parent: HTMLElement, options: GoogleButtonOptions): void;
        };
      };
    };
  }
}
