// https://nuxt.com/docs/api/configuration/nuxt-config
const env =
  ((globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env as Record<string, string | undefined>) || {};

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (value == null) return fallback;

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
};

const isProduction = env.NODE_ENV === "production";
const devHost = env.NUXT_DEV_HOST || "localhost";
const devPort = Number(env.NUXT_DEV_PORT || "3000");
const devUseHttps = parseBoolean(env.NUXT_DEV_USE_HTTPS, true);
const devProtocol = devUseHttps ? "https" : "http";
const localBackendApiUrl = `${devProtocol}://localhost:8000/api`;
const publicApiUrl = env.NUXT_BASE_API_URL || "/api";
const internalApiUrl = env.NUXT_INTERNAL_API_URL || localBackendApiUrl;
const publicSiteUrl =
  env.NUXT_PUBLIC_SITE_URL || `${devProtocol}://localhost:${devPort}`;
const allowIndexing = parseBoolean(env.NUXT_PUBLIC_ALLOW_INDEXING, false);
const shouldTrustLocalTls =
  !isProduction &&
  /^https:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(internalApiUrl);

export default defineNuxtConfig({
  devServer: {
    host: devHost,
    port: devPort,
    ...(devUseHttps
      ? {
          https: {
            key: "./certs/localhost-key.pem",
            cert: "./certs/localhost.pem",
          },
        }
      : {}),
  },
  hooks: {
    "modules:done"() {
      if (shouldTrustLocalTls) {
        env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
      }
    },
  },
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: "2025-05-15",
  modules: ["@vueuse/nuxt", "@pinia/nuxt", "@nuxtjs/tailwindcss"],
  css: ["~/assets/css/main.css", "~/assets/css/design-system.css"],

  imports: {
    dirs: ["stores"],
  },

  components: [
    {
      path: "~/components",
      pathPrefix: false,
    },
  ],
  runtimeConfig: {
    apiBaseUrl: internalApiUrl,
    public: {
      NUXT_BASE_API_URL: publicApiUrl,
      siteUrl: publicSiteUrl,
      siteEnv: env.NUXT_PUBLIC_SITE_ENV || env.NODE_ENV || "development",
      allowIndexing,
      siteName: env.NUXT_PUBLIC_SITE_NAME || "Auto Accessories Store",
      defaultSeoTitle:
        env.NUXT_PUBLIC_DEFAULT_SEO_TITLE || "ავტომობილის აქსესუარების მაღაზია",
      defaultSeoDescription:
        env.NUXT_PUBLIC_DEFAULT_SEO_DESCRIPTION ||
        "იპოვეთ ხარისხიანი ავტომობილის აქსესუარები ყოველდღიური გამოყენებისა და ავტომობილის გაუმჯობესებისთვის.",
      defaultSeoImage: env.NUXT_PUBLIC_DEFAULT_SEO_IMAGE || "/favicon.ico",
      recaptchaSiteKey: env.NUXT_PUBLIC_RECAPTCHA_SITE_KEY,
    },
  },

  devtools: { enabled: !isProduction },
  app: {
    head: {
      htmlAttrs: {
        lang: "ka",
      },
      script: [
        {
          id: "theme-init",
          //@ts-ignore
          children:
            "(function(){try{var d=document.documentElement;var m=document.cookie.match(/(?:^|;\\s*)theme=(light|dark)(?:;|$)/);var t=m?m[1]:null;if(!t&&window.matchMedia){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){d.classList.add('dark');}else{d.classList.remove('dark');}}catch(e){}})();",
        },
      ],
    },
  },
});
