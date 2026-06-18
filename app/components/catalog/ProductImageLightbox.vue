<script setup lang="ts">
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline";
import BasePicture from "~/components/common/BasePicture.vue";
import type { ComponentPublicInstance } from "vue";
import type { CatalogProductImage } from "~/types/catalog";

const props = withDefaults(
  defineProps<{
    show: boolean;
    images: CatalogProductImage[];
    activeIndex: number;
    title: string;
  }>(),
  {
    title: "პროდუქტის სურათი",
  },
);

const emit = defineEmits<{
  close: [];
  "update:activeIndex": [index: number];
}>();

const panelRef = ref<HTMLElement | null>(null);
const thumbnailStripRef = ref<HTMLDivElement | null>(null);
const thumbnailButtonRefs = ref<HTMLButtonElement[]>([]);
const previousActiveElement = ref<HTMLElement | null>(null);
const lightboxTitleId = `product-image-lightbox-${useId()}`;

const isLocked = useScrollLock(
  typeof window !== "undefined" ? document.body : null,
);

const imageCount = computed(() => props.images.length);
const hasMultipleImages = computed(() => imageCount.value > 1);
const normalizedActiveIndex = computed(() => {
  if (!imageCount.value) return 0;
  return Math.min(Math.max(props.activeIndex, 0), imageCount.value - 1);
});
const activeImage = computed(
  () => props.images[normalizedActiveIndex.value] || null,
);

const updateActiveIndex = (index: number) => {
  if (!imageCount.value) return;

  const nextIndex =
    ((index % imageCount.value) + imageCount.value) % imageCount.value;
  emit("update:activeIndex", nextIndex);
};

const showPreviousImage = () => {
  updateActiveIndex(normalizedActiveIndex.value - 1);
};

const showNextImage = () => {
  updateActiveIndex(normalizedActiveIndex.value + 1);
};

const closeLightbox = () => {
  emit("close");
};

const setThumbnailButtonRef = (
  element: Element | ComponentPublicInstance | null,
  index: number,
) => {
  if (element instanceof HTMLButtonElement) {
    thumbnailButtonRefs.value[index] = element;
  }
};

const scrollActiveThumbnailIntoView = async () => {
  if (!import.meta.client) return;

  await nextTick();

  const strip = thumbnailStripRef.value;
  const target = thumbnailButtonRefs.value[normalizedActiveIndex.value];

  if (!strip || !target) return;

  target.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
    inline: "center",
  });
};

const focusLightbox = async () => {
  await nextTick();
  panelRef.value?.focus({ preventScroll: true });
};

const restorePreviousFocus = async () => {
  if (!import.meta.client) return;

  const previousElement = previousActiveElement.value;
  previousActiveElement.value = null;

  if (previousElement && document.contains(previousElement)) {
    await nextTick();
    previousElement.focus({ preventScroll: true });
  }
};

const handleDocumentKeydown = (event: KeyboardEvent) => {
  if (!props.show) return;

  if (event.key === "Escape") {
    event.preventDefault();
    closeLightbox();
    return;
  }

  if (!hasMultipleImages.value) return;

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    showPreviousImage();
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    showNextImage();
  }
};

watch(
  () => props.show,
  async (show) => {
    isLocked.value = show;

    if (!import.meta.client) return;

    if (show) {
      previousActiveElement.value =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      await focusLightbox();
      await scrollActiveThumbnailIntoView();
      return;
    }

    await restorePreviousFocus();
  },
);

watch(
  normalizedActiveIndex,
  () => {
    if (props.show) {
      void scrollActiveThumbnailIntoView();
    }
  },
  { flush: "post" },
);

watch(
  () => props.images,
  () => {
    thumbnailButtonRefs.value = [];
  },
);

onMounted(() => {
  if (!import.meta.client) return;
  document.addEventListener("keydown", handleDocumentKeydown);
});

onBeforeUnmount(() => {
  isLocked.value = false;

  if (!import.meta.client) return;
  document.removeEventListener("keydown", handleDocumentKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="product-lightbox">
      <div
        v-if="show && activeImage"
        class="fixed inset-0 z-[110] flex bg-[rgba(2,6,23,0.86)] text-white backdrop-blur-sm"
        @click.self="closeLightbox"
      >
        <section
          ref="panelRef"
          class="grid h-full w-full grid-rows-[auto_minmax(0,1fr)_auto] outline-none"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="lightboxTitleId"
          tabindex="-1"
        >
          <header
            class="flex min-h-16 items-start justify-between gap-3 border-b border-white/10 px-3 py-3 sm:items-center sm:px-5"
          >
            <div class="min-w-0 flex-1">
              <h2
                :id="lightboxTitleId"
                class="product-lightbox-title upper text-[12px] font-bold leading-4 text-white sm:text-base sm:leading-5"
              >
                {{ title }}
              </h2>
              <p class="mt-1 text-xs font-medium text-white/60 sm:mt-0.5">
                {{ normalizedActiveIndex + 1 }} / {{ imageCount }}
              </p>
            </div>

            <button
              type="button"
              class="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/20 bg-white/[0.08] text-white transition-colors duration-200 hover:border-white/30 hover:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:h-11 sm:w-11"
              aria-label="სურათების ფანჯრის დახურვა"
              @click="closeLightbox"
            >
              <XMarkIcon class="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            </button>
          </header>

          <div
            class="relative min-h-0 px-3 py-4 sm:px-6 sm:py-6"
            @click.self="closeLightbox"
          >
            <button
              v-if="hasMultipleImages"
              type="button"
              class="absolute left-3 top-1/2 z-[1] grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg border border-white/20 bg-slate-950/60 text-white transition-colors duration-200 hover:border-white/30 hover:bg-slate-950/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:left-5 sm:h-12 sm:w-12"
              aria-label="წინა სურათი"
              @click="showPreviousImage"
            >
              <ChevronLeftIcon class="h-6 w-6" aria-hidden="true" />
            </button>

            <div
              class="mx-auto flex h-full max-w-[1480px] items-center justify-center"
              @click.self="closeLightbox"
            >
              <BasePicture
                :data="activeImage.image"
                :alt="activeImage.alt_text || title"
                preset="detail"
                fit="contain"
                class="h-full w-full"
                :widths="{ mobile: 900, tablet: 1280, desktop: 1800 }"
              />
            </div>

            <button
              v-if="hasMultipleImages"
              type="button"
              class="absolute right-3 top-1/2 z-[1] grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg border border-white/20 bg-slate-950/60 text-white transition-colors duration-200 hover:border-white/30 hover:bg-slate-950/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:right-5 sm:h-12 sm:w-12"
              aria-label="შემდეგი სურათი"
              @click="showNextImage"
            >
              <ChevronRightIcon class="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div
            v-if="hasMultipleImages"
            ref="thumbnailStripRef"
            class="product-lightbox-thumbnails flex min-h-[92px] gap-3 overflow-x-auto border-t border-white/10 px-3 py-3 sm:px-5"
          >
            <button
              v-for="(image, index) in images"
              :key="image.id || `${image.alt_text}-${index}`"
              type="button"
              :ref="(element) => setThumbnailButtonRef(element, index)"
              :class="[
                'h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:h-[72px] sm:w-[72px]',
                index === normalizedActiveIndex
                  ? 'border-accent-primary'
                  : 'border-white/20 hover:border-white/50',
              ]"
              :aria-label="`სურათი ${index + 1}`"
              :aria-current="index === normalizedActiveIndex ? 'true' : undefined"
              @click="updateActiveIndex(index)"
            >
              <BasePicture
                :data="image.image"
                :alt="image.alt_text || `${title} ${index + 1}`"
                preset="thumb"
                fit="contain"
                class="h-full w-full"
                lazy
              />
            </button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.product-lightbox-enter-active,
.product-lightbox-leave-active {
  transition: opacity 0.2s ease;
}

.product-lightbox-enter-from,
.product-lightbox-leave-to {
  opacity: 0;
}

.product-lightbox-thumbnails {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.product-lightbox-thumbnails::-webkit-scrollbar {
  display: none;
}

.product-lightbox-title {
  display: -webkit-box;
  overflow: hidden;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

@media (min-width: 640px) {
  .product-lightbox-title {
    -webkit-line-clamp: 1;
  }
}
</style>
