<script setup lang="ts">
import { DocumentDuplicateIcon } from "@heroicons/vue/24/outline";
import BaseIcon from "~/components/common/BaseIcon.vue";

const props = defineProps<{
  title: string;
  url: string;
}>();

const copied = ref(false);

const encodedTitle = computed(() => encodeURIComponent(props.title));
const encodedUrl = computed(() => encodeURIComponent(props.url));

const telegramHref = computed(
  () => `https://t.me/share/url?url=${encodedUrl.value}&text=${encodedTitle.value}`,
);
const facebookHref = computed(
  () =>
    `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl.value}&quote=${encodedTitle.value}`,
);

const handleCopyLink = async () => {
  if (!import.meta.client || !navigator.clipboard) return;

  await navigator.clipboard.writeText(props.url);
  copied.value = true;

  window.setTimeout(() => {
    copied.value = false;
  }, 1800);
};
</script>

<template>
  <section class="border-t border-border-default pt-8">
    <div class="flex justify-end">
      <div class="space-y-3 lg:text-right">
        <p class="text-sm font-semibold text-text-primary">გააზიარე</p>

        <div class="mt-3 flex flex-wrap gap-3 lg:justify-end">
          <button
            type="button"
            class="share-action share-action--copy"
            :class="{ 'is-copied': copied }"
            :aria-label="copied ? 'ბმული დაკოპირდა' : 'ბმულის კოპირება'"
            :title="copied ? 'დაკოპირდა' : 'დააკოპირე ბმული'"
            @click="handleCopyLink"
          >
            <DocumentDuplicateIcon
              class="share-action__icon"
              aria-hidden="true"
            />
          </button>

          <a
            :href="telegramHref"
            target="_blank"
            rel="noopener noreferrer"
            class="share-action share-action--telegram"
            aria-label="Telegram-ზე გაზიარება"
            title="Telegram"
          >
            <BaseIcon name="telegram" class="share-action__icon" />
          </a>

          <a
            :href="facebookHref"
            target="_blank"
            rel="noopener noreferrer"
            class="share-action share-action--facebook"
            aria-label="Facebook-ზე გაზიარება"
            title="Facebook"
          >
            <BaseIcon name="facebook" class="share-action__icon share-action__icon--facebook" />
          </a>
        </div>

        <p class="share-feedback" :class="{ 'is-visible': copied }">
          ბმული დაკოპირდა
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.share-action {
  display: inline-flex;
  height: 3rem;
  width: 3rem;
  align-items: center;
  justify-content: center;
  padding: 0.8rem;
  border-radius: 9999px;
  border: 1px solid var(--border-default);
  background: var(--surface);
  color: var(--text-secondary);
  transition:
    color 180ms ease,
    border-color 180ms ease,
    background-color 180ms ease,
    transform 180ms ease;
}

.share-action__icon {
  display: block;
  height: 1.2rem;
  width: 1.2rem;
  flex: none;
}

.share-action__icon--facebook {
  height: 1.05rem;
  width: 1.05rem;
}

.share-action--copy.is-copied {
  border-color: var(--success);
  background: var(--surface-2);
  color: var(--success);
}

@media (hover: hover) and (pointer: fine) {
  .share-action:hover {
    transform: translateY(-1px);
  }

  .share-action--copy:hover {
    border-color: var(--accent-primary);
    color: var(--accent-primary);
  }

  .share-action--telegram:hover {
    border-color: #229ed9;
    background: rgba(34, 158, 217, 0.08);
    color: #229ed9;
  }

  .share-action--facebook:hover {
    border-color: #1877f2;
    background: rgba(24, 119, 242, 0.08);
    color: #1877f2;
  }
}

.share-feedback {
  min-height: 1.25rem;
  font-size: 0.75rem;
  color: var(--text-muted);
  opacity: 0;
  transition:
    color 180ms ease,
    opacity 180ms ease;
}

.share-feedback.is-visible {
  color: var(--success);
  opacity: 1;
}
</style>
