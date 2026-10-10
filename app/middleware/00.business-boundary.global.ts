import { isBusinessPath } from "~/utils/businessRouting";

export default defineNuxtRouteMiddleware((to, from) => {
  if (import.meta.server || isBusinessPath(to.path) === isBusinessPath(from.path)) return;
  // A fresh document prevents already-loaded GTM/history listeners from observing
  // private navigation. It also starts public tracking cleanly on the way back.
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (current === to.fullPath) return;
  window.location.assign(to.fullPath);
  return abortNavigation();
});
