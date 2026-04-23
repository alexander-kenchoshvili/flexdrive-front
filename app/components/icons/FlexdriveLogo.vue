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
    class="flexdrive-logo"
    :data-variant="resolvedVariant"
    viewBox="0 0 120 90"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :role="decorative ? undefined : 'img'"
    :aria-hidden="decorative ? 'true' : undefined"
    :aria-labelledby="decorative ? undefined : titleId"
  >
    <title v-if="!decorative" :id="titleId">{{ props.title }}</title>

    <path
      d="M108.158 84.2822V78.5644H118.816V80.5825H111.71V81.9278H120V84.2822H108.158Z"
      class="logo-green-deep"
    />
    <path
      d="M13.8158 84.3614V75.201H16.9737V81.9278H24.8684V82.2642V84.2822L13.8158 84.3614Z"
      class="logo-contrast"
    />
    <path
      d="M38.6842 75.201H27.2369V75.5374L29.6053 77.5554H38.6842V75.201Z"
      class="logo-contrast"
    />
    <path
      d="M27.2369 84.2822V78.5644H37.8948V80.5825H30.3948V80.9188V81.9278H38.6842V84.2822H27.2369Z"
      class="logo-contrast"
    />
    <path
      d="M49.7368 79.5734L54.8684 84.2822H50.921L50.5263 83.9459L49.342 82.9368L47.7631 81.5915L44.6052 84.2822H40.6578L45.3947 79.5734L40.6578 75.201H44.6052L47.7631 77.8917L50.5263 75.201H54.8684L49.7368 79.5734Z"
      class="logo-contrast"
    />
    <path
      d="M67.1053 75.201H56.8421L59.2105 77.5554H65.5263L66.3158 78.2281V81.2551L65.1316 82.2642H60.3947V78.9008H56.8421V84.6185H66.7105L67.5 84.2822L69.8684 82.6005V77.5554L68.6842 75.8737L67.1053 75.201Z"
      class="logo-green-deep"
    />
    <path
      d="M82.5 75.201H72.2369L74.6053 77.5554H78.5527H81.3158L81.7106 78.5644L80.9211 79.5734H72.2369V84.2822H75.3948V81.9278H78.9474L81.7106 84.2822H85.6579L82.5 81.9278L83.2895 81.5915L84.8685 79.9098V77.8917L84.4737 76.21L82.5 75.201Z"
      class="logo-green-deep"
    />
    <path
      d="M87.6316 84.6185V75.201H90.7895V84.6185H87.6316Z"
      class="logo-green-deep"
    />
    <path
      d="M97.8947 84.2822L92.7631 75.201H96.3158L99.8684 81.2551L103.026 75.201H106.579V75.5374L101.447 84.2822H97.8947Z"
      class="logo-green-deep"
    />
    <path
      d="M120 75.201H108.553L110.921 77.5554H120V75.201Z"
      class="logo-green-deep"
    />
    <path
      d="M0 84.2822V78.9008H10.6579V80.9188H3.15789V84.2822H0Z"
      class="logo-contrast"
    />
    <path
      d="M2.76316 77.5554L0 75.201H11.4474V77.5554H2.76316Z"
      class="logo-contrast"
    />
    <path
      d="M48.4033 21.3402L56.4706 17.1649L60 19.0206L71.0924 13.9175L60 7.8866L49.4117 13.4536L52.9411 15.7732L45.3781 19.4845L33.2773 12.9897L60.5042 0L86.7227 14.3814L59.4958 27.3711L48.4033 21.3402Z"
      class="logo-green"
    />
    <path
      d="M31.2605 46.8557V15.3093L57.9832 29.2268V37.5773L39.3277 27.3711V27.835V33.402L51.4286 39.8969V47.3196L39.3277 40.8247V51.0309L31.2605 46.8557Z"
      class="logo-green"
    />
    <path
      d="M80.1681 20.4124L60.5042 29.6907V38.0412L76.1344 30.6186L78.6555 29.6907H80.1681L81.6807 30.6186V41.2887L80.6723 43.1443L79.1597 45L68.0672 50.567V39.433L59.4958 43.6083V63.0928L77.1428 54.7423L84.2017 51.0309L88.2353 46.8557L90.2521 41.2887V26.4433L89.2437 23.6598L87.2269 21.3402L83.6975 20.4124H80.1681Z"
      class="logo-contrast"
    />
  </svg>
</template>

<style scoped>
.flexdrive-logo {
  --logo-green: #82a93e;
  --logo-green-deep: #4f6f1f;
  --logo-contrast: #111827;
  display: block;
}

.flexdrive-logo[data-variant="on-light"] {
  --logo-green: #82a93e;
  --logo-green-deep: #4f6f1f;
  --logo-contrast: #111827;
}

.flexdrive-logo[data-variant="on-dark"] {
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
