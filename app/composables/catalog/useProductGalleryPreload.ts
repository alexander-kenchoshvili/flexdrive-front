import { onBeforeUnmount, onMounted, watch } from "vue";
import type { Ref } from "vue";
import type { CatalogProductImage } from "~/types/catalog";
import {
  buildOptimizedCloudinaryUrl,
  getCloudinaryPresetWidths,
} from "../media/useCloudinaryImage";

// Warm only the current viewport's detail images, after the visible image loads.
export const useProductGalleryPreload = (
  images: Readonly<Ref<readonly CatalogProductImage[]>>,
  mainTrigger: Readonly<Ref<HTMLButtonElement | null>>,
) => {
  let stop: (() => void) | undefined;

  onMounted(() => {
    stop = watch([images, mainTrigger], ([gallery, trigger], _, onCleanup) => {
      const mainImage = trigger?.querySelector("img");
      if (!mainImage || gallery.length < 2) return;

      let cancelled = false;
      let started = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      // Retain decoded images while this gallery is mounted.
      const warmedImages: HTMLImageElement[] = [];

      const start = () => {
        if (started || cancelled) return;
        started = true;
        timer = setTimeout(() => {
          const viewport = window.matchMedia("(max-width: 767px)").matches
            ? "mobile"
            : window.matchMedia("(max-width: 1023px)").matches
              ? "tablet"
              : "desktop";
          const width = getCloudinaryPresetWidths("detail")[viewport];
          const urls = [...new Set(gallery.slice(1).map(({ image }) => {
            const source = viewport === "mobile"
              ? image.mobile || image.tablet || image.desktop
              : viewport === "tablet"
                ? image.tablet || image.desktop || image.mobile
                : image.desktop || image.tablet || image.mobile;
            return buildOptimizedCloudinaryUrl(source, width);
          }).filter((url) => url && url !== mainImage.currentSrc))];
          let next = 0;
          let active = 0;

          const pump = () => {
            while (!cancelled && active < 2 && next < urls.length) {
              const image = new Image();
              warmedImages.push(image);
              active++;
              image.decoding = "async";
              image.fetchPriority = "low";
              const finish = () => {
                active--;
                pump();
              };
              image.onload = () => {
                image.onload = image.onerror = null;
                if (typeof image.decode === "function") {
                  void image.decode().catch(() => {}).finally(finish);
                } else {
                  finish();
                }
              };
              image.onerror = () => {
                image.onload = image.onerror = null;
                finish();
              };
              image.src = urls[next++]!;
            }
          };
          pump();
        }, 0);
      };

      onCleanup(() => {
        cancelled = true;
        clearTimeout(timer);
        mainImage.removeEventListener("load", start);
        mainImage.removeEventListener("error", start);
        for (const image of warmedImages) image.onload = image.onerror = null;
        warmedImages.length = 0;
      });

      if (mainImage.complete) {
        start();
      } else {
        mainImage.addEventListener("load", start, { once: true });
        mainImage.addEventListener("error", start, { once: true });
      }
    }, { immediate: true, flush: "post" });
  });

  onBeforeUnmount(() => stop?.());
};
