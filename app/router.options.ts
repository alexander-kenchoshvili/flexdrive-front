import type { RouterConfig } from "@nuxt/schema";

const ROUTE_SCROLL_DELAY_MS = 320;

const delayScroll = <T>(position: T) =>
  new Promise<T>((resolve) => {
    setTimeout(() => resolve(position), ROUTE_SCROLL_DELAY_MS);
  });

export default {
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return delayScroll(savedPosition);
    }

    if (to.hash) {
      return delayScroll({
        el: to.hash,
        top: 96,
        behavior: "smooth",
      });
    }

    if (to.path === from.path) {
      return false;
    }

    return delayScroll({
      left: 0,
      top: 0,
      behavior: "auto",
    });
  },
} satisfies RouterConfig;
