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
      siteName: env.NUXT_PUBLIC_SITE_NAME || "FlexDrive",
      defaultSeoTitle:
        env.NUXT_PUBLIC_DEFAULT_SEO_TITLE ||
        "FlexDrive - ავტონაწილების ონლაინ მაღაზია",
      defaultSeoDescription:
        env.NUXT_PUBLIC_DEFAULT_SEO_DESCRIPTION ||
        "შეიძინე ხარისხიანი ავტონაწილები FlexDrive-ზე. მოძებნე ნაწილი OEM-ით, SKU-ით ან კატეგორიით და შეუკვეთე ონლაინ მარტივად.",
      defaultSeoImage: env.NUXT_PUBLIC_DEFAULT_SEO_IMAGE || "/favicon.ico",
      recaptchaSiteKey: env.NUXT_PUBLIC_RECAPTCHA_SITE_KEY,
      googleClientId: env.NUXT_PUBLIC_GOOGLE_CLIENT_ID,
      gtmId: env.NUXT_PUBLIC_GTM_ID || "",
    },
  },

  devtools: { enabled: !isProduction },
  app: {
    head: {
      htmlAttrs: {
        lang: "ka",
      },
      link: [
        { rel: "icon", href: "/favicon.ico", sizes: "any" },
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      ],
      script: [
        {
          id: "theme-init",
          //@ts-ignore
          children:
            "(function(){try{var d=document.documentElement;var c=document.cookie.match(/(?:^|;\\s*)flexdrive_cookie_consent=([^;]+)(?:;|$)/);var p=false;if(c&&c[1]){try{var v=JSON.parse(decodeURIComponent(c[1]));p=!!(v&&v.version===1&&v.preferences===true);}catch(e){}}var m=p?document.cookie.match(/(?:^|;\\s*)theme=(light|dark)(?:;|$)/):null;var t=m?m[1]:null;if(!t&&window.matchMedia){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){d.classList.add('dark');}else{d.classList.remove('dark');}}catch(e){}})();",
        },
      ],
    },
  },
});
