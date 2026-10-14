import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { Ref } from "vue";
import type { CatalogProductImage } from "~/types/catalog";
import { buildOptimizedCloudinaryUrl } from "../media/useCloudinaryImage";

export const PRODUCT_ZOOM_IMAGE_WIDTH = 2000;

export const useProductZoomPreload = (
  activeImage: Readonly<Ref<CatalogProductImage | null>>,
  mainTrigger: Readonly<Ref<HTMLButtonElement | null>>,
  enabled: Readonly<Ref<boolean>>,
) => {
  const readySource = ref("");
  const source = computed(() => {
    const image = activeImage.value?.image;
    return buildOptimizedCloudinaryUrl(
      image?.desktop || image?.tablet || image?.mobile,
      PRODUCT_ZOOM_IMAGE_WIDTH,
    );
  });
  const isProductZoomReady = computed(() =>
    Boolean(enabled.value && source.value && readySource.value === source.value),
  );
  // Keep decoded photos for revisits within this product page only.
  const decodedImages = new Map<string, HTMLImageElement>();
  let stop: (() => void) | undefined;

  onMounted(() => {
    stop = watch([source, mainTrigger, enabled], ([url, trigger, available], _, onCleanup) => {
      if (!available || !url) return;
      if (decodedImages.has(url)) {
        readySource.value = url;
        return;
      }
      const mainImage = trigger?.querySelector("img");
      if (!mainImage) return;

      let cancelled = false;
      let started = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let warmImage: HTMLImageElement | undefined;
      const start = () => {
        if (cancelled || started) return;
        started = true;
        timer = setTimeout(() => {
          const image = new Image();
          warmImage = image;
          image.decoding = "async";
          image.fetchPriority = "low";
          const markReady = () => {
            if (cancelled) return;
            decodedImages.set(url, image);
            readySource.value = url;
          };
          image.onload = () => {
            image.onload = image.onerror = null;
            if (typeof image.decode === "function") {
              void image.decode().then(markReady, () => {});
            } else {
              markReady();
            }
          };
          image.onerror = () => {
            image.onload = image.onerror = null;
          };
          image.src = url;
        }, 0);
      };
      onCleanup(() => {
        cancelled = true;
        clearTimeout(timer);
        mainImage.removeEventListener("load", start);
        mainImage.removeEventListener("error", start);
        if (warmImage) warmImage.onload = warmImage.onerror = null;
      });
      if (mainImage.complete) start();
      else {
        mainImage.addEventListener("load", start, { once: true });
        mainImage.addEventListener("error", start, { once: true });
      }
    }, { immediate: true, flush: "post" });
  });

  onBeforeUnmount(() => {
    stop?.();
    decodedImages.clear();
  });

  return { isProductZoomReady };
};
