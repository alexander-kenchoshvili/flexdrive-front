import { defineStore } from "pinia";
import { apiFetchRaw } from "~/composables/apiFetch";
import type { AuthSessionState } from "~/types/auth";
import type {
  ComponentsMap,
  CurrentContentResponse,
  SeoPayload,
} from "~/types/page";
import {
  createPageLoadError,
  normalizePageLoadError,
} from "~/utils/httpError";
import { normalizeSeoPath } from "~/utils/seoIndexing";
import { parseSingleViewPath } from "~/utils/routePaths";
import { useMenu } from "./useMenu";

const hasRenderableComponents = (
  data: CurrentContentResponse | null | undefined,
) => Object.keys(data?.secondary ?? {}).length > 0;

export const useGlobalStore = defineStore("global", {
  state: () => ({
    menuCurrent: null as any,
    components: {} as ComponentsMap,
    pageSeo: null as SeoPayload | null,
    canonicalPath: null as string | null,
    isSingleView: false,
    isComponentsLoad: false,
    currentUser: null as any,
    authResolved: false,
    authSession: null as AuthSessionState | null,
    isRateLimited: false,
  }),

  actions: {
    resetPageState() {
      this.menuCurrent = null;
      this.components = {};
      this.pageSeo = null;
      this.canonicalPath = null;
      this.isSingleView = false;
      this.isComponentsLoad = false;
    },

    setRateLimited(isLimited: boolean) {
      this.isRateLimited = isLimited;

      if (isLimited) {
        setTimeout(() => {
          this.isRateLimited = false;
        }, 60000);
      }
    },

    setCurrentMenu(slug: string) {
      const menuStore = useMenu();
      this.menuCurrent = menuStore.findMenuBySlug(slug);
    },

    async fetchPageData(slug: string) {
      this.setCurrentMenu(slug);

      try {
        const data = await apiFetchRaw<CurrentContentResponse>(
          "/pages/getCurrentContent/",
          {
            method: "POST",
            body: { slug },
          },
        );

        if (!data) {
          throw createPageLoadError({
            statusCode: 500,
            statusMessage: "გვერდის ჩატვირთვა ვერ მოხერხდა",
          });
        }

        if (!hasRenderableComponents(data)) {
          throw createPageLoadError({
            statusCode: 404,
            statusMessage: "გვერდი ვერ მოიძებნა",
          });
        }

        this.components = data.secondary ?? {};
        this.pageSeo = data.seo || null;
        this.canonicalPath = null;
        this.isComponentsLoad = true;
      } catch (error) {
        this.components = {};
        this.pageSeo = null;
        this.canonicalPath = null;
        this.isComponentsLoad = false;
        console.error("Content fetch error:", error);

        throw normalizePageLoadError(error, {
          statusCode: 500,
          statusMessage: "გვერდის ჩატვირთვა ვერ მოხერხდა",
        });
      }
    },

    async fetchSingleView(
      slug: string,
      id: number | string,
      singleSlug?: string | null,
    ) {
      this.setCurrentMenu(slug);

      try {
        const data = await apiFetchRaw<CurrentContentResponse>(
          "/pages/getCurrentContent/",
          {
            method: "POST",
            body: {
              slug,
              single_id: id,
              single_slug: singleSlug,
            },
          },
        );

        if (!data) {
          throw createPageLoadError({
            statusCode: 500,
            statusMessage: "კონტენტის ჩატვირთვა ვერ მოხერხდა",
          });
        }

        if (!hasRenderableComponents(data)) {
          throw createPageLoadError({
            statusCode: 404,
            statusMessage: "კონტენტი ვერ მოიძებნა",
          });
        }

        this.components = data.secondary ?? {};
        this.pageSeo = data.seo || null;
        this.canonicalPath = data.canonical_path || null;
        this.isComponentsLoad = true;
      } catch (error) {
        this.components = {};
        this.pageSeo = null;
        this.canonicalPath = null;
        this.isComponentsLoad = false;
        console.error("Content fetch error:", error);

        throw normalizePageLoadError(error, {
          statusCode: 500,
          statusMessage: "კონტენტის ჩატვირთვა ვერ მოხერხდა",
        });
      }
    },

    checkSingleView(fullPath: string) {
      const singleView = parseSingleViewPath(fullPath);

      if (!singleView) {
        this.isSingleView = false;
        return null;
      }

      this.isSingleView = true;
      return singleView.id;
    },

    async initPage(fullPath: string) {
      const normalizedPath = normalizeSeoPath(fullPath || "/");
      const singleView = parseSingleViewPath(normalizedPath);

      if (singleView) {
        this.isSingleView = true;
        await this.fetchSingleView(
          singleView.contentType,
          singleView.id,
          singleView.slug,
        );
        return;
      }

      const slug = normalizedPath.split("/").filter(Boolean)[0] || "main";
      this.isSingleView = false;
      await this.fetchPageData(slug);
    },
  },
});
