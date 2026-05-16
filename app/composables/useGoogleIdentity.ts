const GOOGLE_IDENTITY_SCRIPT_ID = "google-identity-services-script";
const GOOGLE_IDENTITY_LOAD_TIMEOUT_MS = 10000;

let googleIdentityLoadPromise: Promise<void> | null = null;
let initializedGoogleClientId = "";
let activeGoogleCredentialCallback: GoogleCredentialCallback | null = null;

export interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
  clientId?: string;
}

type GoogleCredentialCallback = (response: GoogleCredentialResponse) => void;

interface GoogleInitializeOptions {
  client_id: string;
  callback: GoogleCredentialCallback;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: "signin" | "signup" | "use";
  ux_mode?: "popup" | "redirect";
  use_fedcm_for_prompt?: boolean;
}

interface GooglePromptMomentNotification {
  isDisplayed?(): boolean;
  isNotDisplayed?(): boolean;
  isSkippedMoment?(): boolean;
  isDismissedMoment?(): boolean;
  getNotDisplayedReason?(): string;
  getSkippedReason?(): string;
  getDismissedReason?(): string;
}

const hasGoogleIdentity = () =>
  typeof window !== "undefined" &&
  typeof window.google?.accounts?.id?.initialize === "function" &&
  typeof window.google?.accounts?.id?.prompt === "function";

const getPromptFailureMessage = (
  notification: GooglePromptMomentNotification,
) => {
  const reason =
    notification.getNotDisplayedReason?.() ||
    notification.getSkippedReason?.() ||
    notification.getDismissedReason?.() ||
    "";

  if (reason === "secure_http_required") {
    return "Google შესვლას HTTPS მისამართი სჭირდება.";
  }

  if (reason === "unregistered_origin" || reason === "invalid_client") {
    return "Google OAuth origin ან client ID არასწორად არის კონფიგურირებული.";
  }

  if (reason === "opt_out_or_no_session") {
    return "ამ ბრაუზერში Google ანგარიში ვერ მოიძებნა. შედით Google-ში და სცადეთ თავიდან.";
  }

  if (reason === "suppressed_by_user") {
    return "Google შესვლა დროებით შეზღუდულია ბრაუზერის მიერ. სცადეთ მოგვიანებით.";
  }

  if (reason === "tap_outside" || reason === "user_cancel") {
    return "Google შესვლა შეწყდა.";
  }

  return "Google შესვლის ფანჯარა ვერ გაიხსნა. სცადეთ თავიდან.";
};

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

    activeGoogleCredentialCallback = callback;

    if (initializedGoogleClientId === clientId) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        activeGoogleCredentialCallback?.(response);
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      context,
      ux_mode: "popup",
      use_fedcm_for_prompt: true,
    });

    initializedGoogleClientId = clientId;
  };

  const requestGoogleCredential = async (
    callback: GoogleCredentialCallback,
    context: GoogleInitializeOptions["context"] = "signin",
  ) => {
    await initializeGoogleIdentity(callback, context);

    if (!window.google?.accounts?.id) {
      throw new Error("Google შესვლის კლიენტი მიუწვდომელია.");
    }

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      let timeoutId = 0;

      const settle = (handler: () => void) => {
        if (settled) {
          return;
        }

        settled = true;
        window.clearTimeout(timeoutId);
        handler();
      };

      timeoutId = window.setTimeout(() => {
        settle(() => resolve());
      }, 1500);

      window.google?.accounts?.id?.prompt((notification) => {
        if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
          settle(() => reject(new Error(getPromptFailureMessage(notification))));
          return;
        }

        if (notification.isDismissedMoment?.()) {
          if (notification.getDismissedReason?.() === "credential_returned") {
            settle(() => resolve());
            return;
          }

          settle(() => reject(new Error(getPromptFailureMessage(notification))));
          return;
        }

        if (notification.isDisplayed?.()) {
          settle(() => resolve());
        }
      });
    });
  };

  return {
    getGoogleClientId,
    isGoogleIdentityConfigured,
    requestGoogleCredential,
  };
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize(options: GoogleInitializeOptions): void;
          prompt(
            momentListener?: (
              notification: GooglePromptMomentNotification,
            ) => void,
          ): void;
        };
      };
    };
  }
}
