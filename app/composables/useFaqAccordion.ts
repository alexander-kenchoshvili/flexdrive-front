import { onBeforeUnmount, ref } from "vue";

const MOTION_MS = 240;

export const useFaqAccordion = () => {
  const openId = ref<number | null>(null);
  let stopAnchoring: (() => void) | undefined;

  const cancelScrollAnchor = () => {
    stopAnchoring?.();
    stopAnchoring = undefined;
  };

  const keepTriggerInPlace = (trigger?: HTMLElement) => {
    cancelScrollAnchor();
    if (typeof window === "undefined" || !trigger) return;

    const top = trigger.getBoundingClientRect().top;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const started = window.performance.now();
    let frame = 0;
    const stop = () => {
      window.cancelAnimationFrame(frame);
      for (const event of ["wheel", "touchstart", "pointerdown", "keydown", "resize"]) {
        window.removeEventListener(event, cancelScrollAnchor);
      }
    };
    stopAnchoring = stop;
    // User scrolling or another interaction always takes precedence.
    for (const event of ["wheel", "touchstart", "pointerdown", "keydown", "resize"]) {
      window.addEventListener(event, cancelScrollAnchor, { passive: true });
    }
    const track = (now: number) => {
      if (!trigger.isConnected) {
        cancelScrollAnchor();
        return;
      }
      const delta = trigger.getBoundingClientRect().top - top;
      if (Math.abs(delta) > 0.5) window.scrollBy({ top: delta, behavior: "instant" });
      if (reducedMotion || now - started >= MOTION_MS + 32) {
        cancelScrollAnchor();
      } else {
        frame = window.requestAnimationFrame(track);
      }
    };
    frame = window.requestAnimationFrame(track);
  };

  const toggle = (id: number, trigger?: HTMLElement) => {
    keepTriggerInPlace(trigger);
    openId.value = openId.value === id ? null : id;
  };

  onBeforeUnmount(cancelScrollAnchor);
  return { openId, toggle, cancelScrollAnchor };
};
