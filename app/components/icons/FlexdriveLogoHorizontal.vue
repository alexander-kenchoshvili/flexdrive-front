<script setup lang="ts">
type FlexdriveLogoVariant = "auto" | "on-light" | "on-dark";

const props = withDefaults(
  defineProps<{
    variant?: FlexdriveLogoVariant;
    title?: string;
    decorative?: boolean;
  }>(),
  {
    variant: "auto",
    title: "FlexDrive",
    decorative: false,
  },
);

const titleId = useId();
const { isDark } = useTheme();
const resolvedVariant = computed(() => {
  if (props.variant !== "auto") {
    return props.variant;
  }

  return isDark.value ? "on-dark" : "on-light";
});
</script>

<template>
  <svg
    class="flexdrive-logo-horizontal"
    :data-variant="resolvedVariant"
    width="250"
    height="73"
    viewBox="0 0 250 73"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :role="decorative ? undefined : 'img'"
    :aria-hidden="decorative ? 'true' : undefined"
    :aria-labelledby="decorative ? undefined : titleId"
  >
    <title v-if="!decorative" :id="titleId">{{ props.title }}</title>

    <path
      d="M233.322 56.7V41.4H248.332V46.8H238.326V50.4H250V56.7H233.322Z"
      class="logo-green-deep"
    />
    <path
      d="M100.457 56.9118V32.4H104.905V50.4H116.023V51.3V56.7L100.457 56.9118Z"
      class="logo-contrast"
    />
    <path
      d="M135.48 32.4H119.359V33.3L122.694 38.7H135.48V32.4Z"
      class="logo-contrast"
    />
    <path
      d="M119.359 56.7V41.4H134.369V46.8H123.806V47.7V50.4H135.48V56.7H119.359Z"
      class="logo-contrast"
    />
    <path
      d="M151.046 44.1L158.273 56.7H152.714L152.158 55.8L150.49 53.1L148.266 49.5L143.819 56.7H138.26L144.931 44.1L138.26 32.4H143.819L148.266 39.6L152.158 32.4H158.273L151.046 44.1Z"
      class="logo-contrast"
    />
    <path
      d="M175.507 32.4H161.053L164.388 38.7H173.283L174.395 40.5V48.6L172.727 51.3H166.056V42.3H161.053V57.6H174.951L176.063 56.7L179.398 52.2V38.7L177.73 34.2L175.507 32.4Z"
      class="logo-green-deep"
    />
    <path
      d="M197.188 32.4H182.734L186.069 38.7H191.628H195.52L196.076 41.4L194.964 44.1H182.734V56.7H187.181V50.4H192.184L196.076 56.7H201.635L197.188 50.4L198.299 49.5L200.523 45V39.6L199.967 35.1L197.188 32.4Z"
      class="logo-green-deep"
    />
    <path
      d="M204.414 57.6V32.4H208.862V57.6H204.414Z"
      class="logo-green-deep"
    />
    <path
      d="M218.868 56.7L211.641 32.4H216.645L221.648 48.6L226.095 32.4H231.099V33.3L223.872 56.7H218.868Z"
      class="logo-green-deep"
    />
    <path d="M250 32.4H233.878L237.214 38.7H250V32.4Z" class="logo-green-deep" />
    <path d="M81 56.7V42.3H96.0099V47.7H85.4474V56.7H81Z" class="logo-contrast" />
    <path d="M84.8914 38.7L81 32.4H97.1217V38.7H84.8914Z" class="logo-contrast" />
    <path
      d="M17.1429 30.3402L25.2101 26.1649L28.7395 28.0206L39.8319 22.9175L28.7395 16.8866L18.1513 22.4536L21.6807 24.7732L14.1177 28.4845L2.01682 21.9897L29.2437 9L55.4622 23.3814L28.2353 36.3711L17.1429 30.3402Z"
      class="logo-green"
    />
    <path
      d="M0 55.8557V24.3093L26.7227 38.2268V46.5773L8.06723 36.3711V36.8351V42.4021L20.1681 48.8969V56.3196L8.06723 49.8247V60.0309L0 55.8557Z"
      class="logo-green"
    />
    <path
      d="M48.9076 29.4124L29.2437 38.6907V47.0412L44.8739 39.6186L47.395 38.6907H48.9076L50.4202 39.6186V50.2887L49.4118 52.1443L47.8992 54L36.8067 59.567V48.433L28.2353 52.6082V72.0928L45.8823 63.7423L52.9412 60.0309L56.9748 55.8557L58.9916 50.2887V35.4433L57.9832 32.6598L55.9664 30.3402L52.437 29.4124H48.9076Z"
      class="logo-contrast"
    />
  </svg>
</template>

<style scoped>
.flexdrive-logo-horizontal {
  --logo-green: #82a93e;
  --logo-green-deep: #4f6f1f;
  --logo-contrast: #111827;
  display: block;
}

.flexdrive-logo-horizontal[data-variant="on-light"] {
  --logo-green: #82a93e;
  --logo-green-deep: #4f6f1f;
  --logo-contrast: #111827;
}

.flexdrive-logo-horizontal[data-variant="on-dark"] {
  --logo-green: #a8cf58;
  --logo-green-deep: #b7dd66;
  --logo-contrast: #fefeff;
}

.logo-green {
  fill: var(--logo-green);
}

.logo-green-deep {
  fill: var(--logo-green-deep);
}

.logo-contrast {
  fill: var(--logo-contrast);
}
</style>
