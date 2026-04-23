<script setup lang="ts">
import { XMarkIcon } from "@heroicons/vue/24/outline";

const props = defineProps({
  show: Boolean,
  title: { type: String, default: "" },
});

const emit = defineEmits(["close"]);

const isLocked = useScrollLock(
  typeof window !== "undefined" ? document.body : null,
);

watchEffect(() => {
  isLocked.value = props.show;
});

const closeModal = () => {
  emit("close");
};
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
          class="modal-panel w-full max-w-lg rounded-xl border border-border-default bg-surface p-5 shadow-[0_32px_72px_-44px_var(--shadow-color)] md:p-6"
        >
          <div
            class="flex items-start justify-between gap-4 border-b border-border-default pb-4"
          >
            <slot name="header">
              <h2 class="text-xl font-bold leading-8 text-text-primary md:text-2xl">
                {{ title }}
              </h2>
            </slot>

            <button
              type="button"
              class="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border-default bg-surface-2 text-text-secondary transition-colors duration-200 hover:border-accent-primary hover:bg-accent-soft hover:text-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
              aria-label="Close modal"
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
