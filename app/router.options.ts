import type { RouterConfig } from "@nuxt/schema";
import { waitForPageReady } from "~/utils/pageScrollCoordinator";

const CATALOG_ROOT_PATH = "/catalog";

const isCatalogListingPath = (path: string) =>
  path === CATALOG_ROOT_PATH || /^\/catalog\/category\/[^/]+$/.test(path);

const resolveWhenPageIsReady = async <T>(path: string, position: T) => {
  await waitForPageReady(path);
  return position;
};

export default {
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return resolveWhenPageIsReady(to.fullPath, savedPosition);
    }

    if (to.hash) {
      return resolveWhenPageIsReady(to.fullPath, {
        el: to.hash,
        top: 96,
        behavior: "smooth",
      });
    }

    if (to.path === from.path) {
      return false;
    }

    if (isCatalogListingPath(to.path) && isCatalogListingPath(from.path)) {
      return false;
    }

    return resolveWhenPageIsReady(to.fullPath, {
      left: 0,
      top: 0,
      behavior: "auto",
    });
  },
} satisfies RouterConfig;
