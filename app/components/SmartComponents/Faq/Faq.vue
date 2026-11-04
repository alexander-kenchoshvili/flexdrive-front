<script setup lang="ts">
import { computed, useId, watch } from "vue";
import { sanitizeText } from "~/composables/helpers";
import { useFaqAccordion } from "~/composables/useFaqAccordion";
import type { SmartComponentData } from "~/types/page";
import FaqItem from "./parts/FaqItem.vue";

const props = defineProps<{ data?: SmartComponentData }>();
const instanceId = `faq-${useId()}`;
const title = computed(() => sanitizeText(props.data?.title) || "ხშირად დასმული კითხვები");
const subtitle = computed(() => sanitizeText(props.data?.subtitle));
const questions = computed(() => (props.data?.contentData?.list || [])
  .map((item, index) => ({
    id: item.id,
    question: sanitizeText(item.title),
    answer: sanitizeText(item.description),
    position: item.position ?? index,
  }))
  .filter((item) => item.question && item.answer)
  .sort((a, b) => a.position - b.position || a.id - b.id),
);
const { openId, toggle, cancelScrollAnchor } = useFaqAccordion();

watch(questions, (items) => {
  if (!items.some((item) => item.id === openId.value)) {
    openId.value = null;
    cancelScrollAnchor();
  }
});
</script>

<template>
  <section
    v-if="questions.length"
    :aria-labelledby="`${instanceId}-title`"
    class="border-b border-border-default bg-bg-primary py-10 md:py-14 xl:py-16"
  >
    <div class="container-fluid">
      <div class="min-w-0 w-full">
        <header class="mb-6 text-center sm:mb-8">
          <h2 :id="`${instanceId}-title`" class="upper title-under-xs text-[28px] font-extrabold leading-tight text-text-primary sm:text-[32px] md:text-[36px]">
            {{ title }}
          </h2>
          <p v-if="subtitle" class="mx-auto mt-3 max-w-2xl text-sm leading-7 text-text-secondary md:text-base">
            {{ subtitle }}
          </p>
        </header>
        <div class="space-y-3">
          <FaqItem
            v-for="item in questions"
            :key="item.id"
            :item="item"
            :id-prefix="instanceId"
            :open="openId === item.id"
            @toggle="toggle(item.id, $event)"
          />
        </div>
      </div>
    </div>
  </section>
</template>
