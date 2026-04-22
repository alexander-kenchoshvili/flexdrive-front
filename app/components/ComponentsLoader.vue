<script setup lang="ts">
import { storeToRefs } from "pinia";
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onBeforeUnmount,
  ref,
  shallowRef,
  watch,
} from "vue";
import type { Component } from "vue";
import type { ComponentsMap, SmartComponentRenderData } from "~/types/page";

type RenderedComponent = {
  key: string;
  component: Component;
  props: SmartComponentRenderData;
};

const globalStore = useGlobalStore();
const { components, isComponentsLoad } = storeToRefs(globalStore);

const renderedComponents = shallowRef<RenderedComponent[]>([]);
const renderVersion = ref(0);
const loaderRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const lockedMinHeight = ref<string | null>(null);
let releaseHeightTimer: ReturnType<typeof setTimeout> | null = null;

const getAsyncComponent = (name: string) => {
  return defineAsyncComponent(() =>
    import(`./SmartComponents/${name}/${name}.vue`).catch((error) => {
      console.error(
        `[ComponentsLoader] Failed to load component: ${name}`,
        error,
      );
      return {
        render() {
          return null;
        },
      };
    }),
  );
};

const initComponents = () => {
  const nextRenderedComponents: RenderedComponent[] = [];
  const componentsMap = (components.value || {}) as ComponentsMap;

  Object.values(componentsMap).forEach((value, index) => {
    const name = value?.conf?.componentName;
    if (!name) {
      return;
    }

    nextRenderedComponents.push({
      key: value?.conf?.unicId || `${name}-${index}`,
      component: getAsyncComponent(name),
      props: {
        ...value?.data,
        conf: value?.conf,
      } as SmartComponentRenderData,
    });
  });

  renderedComponents.value = nextRenderedComponents;
  renderVersion.value += 1;
};

const clearReleaseHeightTimer = () => {
  if (!releaseHeightTimer) {
    return;
  }
  clearTimeout(releaseHeightTimer);
  releaseHeightTimer = null;
};

const setLockedHeight = (element?: HTMLElement | null) => {
  const measuredHeight = Math.ceil(
    element?.offsetHeight || loaderRef.value?.offsetHeight || 0,
  );
  if (measuredHeight > 0) {
    lockedMinHeight.value = `${measuredHeight}px`;
  }
};

watch(
  isComponentsLoad,
  (isLoaded) => {
    if (isLoaded) {
      initComponents();
    }
  },
  { immediate: true },
);

const hasRenderedComponents = computed(
  () => renderedComponents.value.length > 0,
);

watch(
  isComponentsLoad,
  async (isLoaded, wasLoaded) => {
    if (!hasRenderedComponents.value) {
      return;
    }

    if (!isLoaded) {
      await nextTick();
      setLockedHeight(loaderRef.value);
      clearReleaseHeightTimer();
      return;
    }

    if (wasLoaded === undefined) {
      return;
    }

    await nextTick();
    setLockedHeight(contentRef.value || loaderRef.value);
    clearReleaseHeightTimer();
    releaseHeightTimer = setTimeout(() => {
      lockedMinHeight.value = null;
      releaseHeightTimer = null;
    }, 1200);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  clearReleaseHeightTimer();
});
</script>

<template>
  <div
    v-if="hasRenderedComponents"
    ref="loaderRef"
    class="components-loader"
    :class="{ 'components-loader--pending': !isComponentsLoad }"
    :aria-busy="!isComponentsLoad"
    :style="{ minHeight: lockedMinHeight || undefined }"
  >
    <Transition name="components-fade" mode="out-in">
      <div
        :key="renderVersion"
        ref="contentRef"
        class="components-loader__content"
      >
        <component
          v-for="item in renderedComponents"
          :is="item.component"
          :key="item.key"
          :data="item.props"
        />
      </div>
    </Transition>
  </div>
</template>

<style>
.components-loader {
  position: relative;
  transition: min-height 220ms ease;
}

.components-loader--pending {
  pointer-events: none;
}

.components-loader__content {
  position: relative;
}

.components-fade-enter-active,
.components-fade-leave-active {
  transition: opacity 300ms ease;
}

.components-fade-enter-from,
.components-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .components-loader,
  .components-fade-enter-active,
  .components-fade-leave-active {
    transition: none;
  }
}
</style>
