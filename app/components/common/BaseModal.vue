<script setup lang="ts">
import { XMarkIcon } from "@heroicons/vue/24/outline";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  show: Boolean,
  title: { type: String, default: "" },
  ariaLabel: { type: String, default: "" },
  closeLabel: { type: String, default: "ფანჯრის დახურვა" },
});

const emit = defineEmits(["close"]);

const modalPanelRef = ref<HTMLElement | null>(null);
const previousActiveElement = ref<HTMLElement | null>(null);
const modalTitleId = `modal-title-${useId()}`;
const modalAriaLabel = computed(
  () => props.ariaLabel || props.title || "დიალოგური ფანჯარა",
);

const isLocked = useScrollLock(
  typeof window !== "undefined" ? document.body : null,
);

const closeModal = () => {
  emit("close");
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const getFocusableElements = () => {
  const panel = modalPanelRef.value;
  if (!panel || !import.meta.client) return [];

  return Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => {
      const style = window.getComputedStyle(element);
      return (
        element.tabIndex !== -1 &&
        element.getAttribute("aria-hidden") !== "true" &&
        style.display !== "none" &&
        style.visibility !== "hidden"
      );
    },
  );
};

const focusModal = async () => {
  await nextTick();

  const panel = modalPanelRef.value;
  if (!panel) return;

  const firstFocusableElement = getFocusableElements()[0];
  (firstFocusableElement || panel).focus({ preventScroll: true });
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

const handlePanelKeydown = (event: KeyboardEvent) => {
  if (event.key !== "Tab") return;

  const panel = modalPanelRef.value;
  const focusableElements = getFocusableElements();

  if (!panel || !focusableElements.length) {
    event.preventDefault();
    panel?.focus({ preventScroll: true });
    return;
  }

  const firstFocusableElement = focusableElements[0];
  const lastFocusableElement = focusableElements[focusableElements.length - 1];
  const activeElement = document.activeElement;

  if (event.shiftKey) {
    if (activeElement === firstFocusableElement || activeElement === panel) {
      event.preventDefault();
      lastFocusableElement.focus({ preventScroll: true });
    }
    return;
  }

  if (activeElement === lastFocusableElement || activeElement === panel) {
    event.preventDefault();
    firstFocusableElement.focus({ preventScroll: true });
  }
};

const handleDocumentKeydown = (event: KeyboardEvent) => {
  if (!props.show || event.key !== "Escape") return;
  event.preventDefault();
  closeModal();
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
      await focusModal();
      return;
    }

    await restorePreviousFocus();
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
    <Transition name="modal">
      <div
        v-if="show"
        class="modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-[color:rgba(14,22,11,0.62)] p-4 backdrop-blur-sm"
        @click.self="closeModal"
      >
        <div
          ref="modalPanelRef"
          class="modal-panel w-full max-w-lg rounded-xl border border-border-default bg-surface p-5 shadow-[0_32px_72px_-44px_var(--shadow-color)] md:p-6"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="!$slots.header && title ? modalTitleId : undefined"
          :aria-label="$slots.header || !title ? modalAriaLabel : undefined"
          tabindex="-1"
          @keydown="handlePanelKeydown"
        >
          <div
            class="flex items-center justify-between gap-4 border-b border-border-default pb-4"
          >
            <slot name="header">
              <h2
                v-if="title"
                :id="modalTitleId"
                class="text-xl font-bold leading-8 text-text-primary md:text-2xl"
              >
                {{ title }}
              </h2>
            </slot>

            <button
              type="button"
              class="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border-default bg-surface-2 text-text-secondary transition-colors duration-200 hover:border-accent-primary hover:bg-accent-soft hover:text-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
              :aria-label="closeLabel"
              @click="closeModal"
            >
              <XMarkIcon class="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div class="mt-5 text-sm leading-7 text-text-secondary md:text-base">
            <slot />
          </div>

          <div
            v-if="$slots.footer"
            class="mt-6 flex justify-end gap-3 border-t border-border-default pt-4"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.24s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition:
    transform 0.24s ease,
    opacity 0.24s ease;
}

.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel {
  opacity: 0;
  transform: translateY(14px) scale(0.98);
}
</style>
