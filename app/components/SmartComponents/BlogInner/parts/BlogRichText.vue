<script setup lang="ts">
import { sanitizeRichText } from "~/utils/contentSanitizer";

const props = defineProps<{
  html?: string | null;
}>();

const content = computed(() => sanitizeRichText(props.html));
</script>

<template>
  <div v-if="content" class="blog-richtext" v-html="content" />
</template>

<style scoped>
.blog-richtext {
  color: var(--text-primary);
  font-size: 1rem;
  line-height: 1.78;
}

.blog-richtext :deep(h2),
.blog-richtext :deep(h3),
.blog-richtext :deep(h4) {
  color: var(--text-primary);
  font-weight: 800;
  line-height: 1.22;
  letter-spacing: 0;
}

.blog-richtext :deep(h2) {
  margin: 2rem 0 0.9rem;
  font-size: clamp(1.45rem, 2vw, 2.15rem);
}

.blog-richtext :deep(h3) {
  margin: 1.7rem 0 0.75rem;
  font-size: clamp(1.2rem, 1.5vw, 1.55rem);
}

.blog-richtext :deep(h4) {
  margin: 1.4rem 0 0.65rem;
  font-size: 1.15rem;
}

.blog-richtext :deep(p) {
  margin: 0 0 1rem;
  color: var(--text-secondary);
}

.blog-richtext :deep(strong) {
  color: var(--text-primary);
  font-weight: 700;
}

.blog-richtext :deep(a) {
  color: var(--accent-primary);
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 180ms ease;
}

@media (hover: hover) and (pointer: fine) {
  .blog-richtext :deep(a:hover) {
    color: var(--accent-hover);
  }
}

.blog-richtext :deep(ul),
.blog-richtext :deep(ol) {
  margin: 1.15rem 0;
  padding-left: 1.45rem;
  color: var(--text-secondary);
  list-style-position: outside;
}

.blog-richtext :deep(ul) {
  list-style-type: disc;
}

.blog-richtext :deep(ol) {
  list-style-type: decimal;
}

.blog-richtext :deep(li) {
  margin-bottom: 0.45rem;
  padding-left: 0.25rem;
}

.blog-richtext :deep(li::marker) {
  color: var(--accent-primary);
}

.blog-richtext :deep(blockquote) {
  margin: 1.5rem 0;
  padding: 1rem 1.1rem;
  border-left: 4px solid var(--accent-primary);
  border-radius: 8px;
  background: var(--accent-soft);
  color: var(--text-primary);
}

.blog-richtext :deep(blockquote p:last-child) {
  margin-bottom: 0;
}

.blog-richtext :deep(hr) {
  margin: 1.75rem 0;
  border: 0;
  border-top: 1px solid var(--border-default);
}

.blog-richtext :deep(img) {
  display: block;
  width: 100%;
  margin: 1.5rem 0;
  border-radius: 8px;
}

.blog-richtext :deep(figure) {
  margin: 1.5rem 0;
}

.blog-richtext :deep(figcaption) {
  margin-top: 0.8rem;
  font-size: 0.9rem;
  color: var(--text-muted);
  text-align: center;
}

.blog-richtext :deep(table) {
  width: 100%;
  margin: 1.5rem 0;
  border-collapse: collapse;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid var(--border-default);
}

.blog-richtext :deep(th),
.blog-richtext :deep(td) {
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--border-default);
  text-align: left;
}

.blog-richtext :deep(th) {
  background: var(--surface-2);
  color: var(--text-primary);
  font-weight: 700;
}

.blog-richtext :deep(code) {
  border-radius: 6px;
  background: var(--surface-2);
  padding: 0.15rem 0.35rem;
  font-size: 0.92em;
}

.blog-richtext :deep(pre) {
  margin: 1.35rem 0;
  overflow-x: auto;
  border-radius: 8px;
  background: var(--surface-2);
  padding: 1rem 1.1rem;
}

.blog-richtext :deep(pre code) {
  background: transparent;
  padding: 0;
}

@media (max-width: 767px) {
  .blog-richtext {
    font-size: 0.96rem;
    line-height: 1.72;
  }

  .blog-richtext :deep(h2) {
    margin-top: 1.65rem;
    font-size: 1.35rem;
  }

  .blog-richtext :deep(h3) {
    margin-top: 1.45rem;
    font-size: 1.18rem;
  }
}
</style>
