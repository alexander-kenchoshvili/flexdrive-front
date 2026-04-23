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
    viewBox="0 0 204 115"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :role="decorative ? undefined : 'img'"
    :aria-hidden="decorative ? 'true' : undefined"
    :aria-labelledby="decorative ? undefined : titleId"
  >
    <title v-if="!decorative" :id="titleId">{{ props.title }}</title>

    <path
      d="M183.868 99.4876V83.9751H201.987V89.4501H189.908V93.1001H204V99.4876H183.868Z"
      class="logo-green-deep"
    />
    <path
      d="M23.4869 99.7024V74.8501H28.8553V93.1001H42.2763V94.0126V99.4876L23.4869 99.7024Z"
      class="logo-contrast"
    />
    <path
      d="M65.7632 74.8501H46.3027V75.7626L50.329 81.2376H65.7632V74.8501Z"
      class="logo-contrast"
    />
    <path
      d="M46.3027 99.4876V83.9751H64.4211V89.4501H51.6711V90.3626V93.1001H65.7632V99.4876H46.3027Z"
      class="logo-contrast"
    />
    <path
      d="M84.5525 86.7126L93.2762 99.4876H86.5657L85.8946 98.5751L83.8814 95.8376L81.1972 92.1876L75.8288 99.4876H69.1183L77.1709 86.7126L69.1183 74.8501H75.8288L81.1972 82.1501L85.8946 74.8501H93.2762L84.5525 86.7126Z"
      class="logo-contrast"
    />
    <path
      d="M114.079 74.8501H96.6316L100.658 81.2376H111.395L112.737 83.0626V91.2751L110.724 94.0126H102.671V84.8876H96.6316V100.4H113.408L114.75 99.4876L118.776 94.9251V81.2376L116.763 76.6751L114.079 74.8501Z"
      class="logo-green-deep"
    />
    <path
      d="M140.25 74.8501H122.803L126.829 81.2376H133.54H138.237L138.908 83.9751L137.566 86.7126H122.803V99.4876H128.171V93.1001H134.211L138.908 99.4876H145.618L140.25 93.1001L141.592 92.1876L144.276 87.6251V82.1501L143.605 77.5876L140.25 74.8501Z"
      class="logo-green-deep"
    />
    <path
      d="M148.974 100.4V74.8501H154.342V100.4H148.974Z"
      class="logo-green-deep"
    />
    <path
      d="M166.421 99.4876L157.697 74.8501H163.737L169.776 91.2751L175.145 74.8501H181.184V75.7626L172.46 99.4876H166.421Z"
      class="logo-green-deep"
    />
    <path
      d="M204 74.8501H184.539L188.566 81.2376H204V74.8501Z"
      class="logo-green-deep"
    />
    <path
      d="M0 99.4875V84.8875H18.1184V90.3625H5.36842V99.4875H0Z"
      class="logo-contrast"
    />
    <path
      d="M4.69737 81.2376L0 74.8501H19.4605V81.2376H4.69737Z"
      class="logo-contrast"
    />
    <path
      d="M90.4034 21.3402L98.4706 17.1649L102 19.0206L113.092 13.9175L102 7.8866L91.4118 13.4536L94.9412 15.7732L87.3782 19.4845L75.2773 12.9897L102.504 0L128.723 14.3814L101.496 27.3711L90.4034 21.3402Z"
      class="logo-green"
    />
    <path
      d="M73.2605 46.8557V15.3093L99.9832 29.2268V37.5773L81.3277 27.3711V27.835V33.402L93.4286 39.8969V47.3196L81.3277 40.8247V51.0309L73.2605 46.8557Z"
      class="logo-green"
    />
    <path
      d="M122.168 20.4124L102.504 29.6907V38.0412L118.134 30.6186L120.655 29.6907H122.168L123.681 30.6186V41.2887L122.672 43.1443L121.16 45L110.067 50.567V39.433L101.496 43.6083V63.0928L119.143 54.7423L126.202 51.0309L130.235 46.8557L132.252 41.2887V26.4433L131.244 23.6598L129.227 21.3402L125.697 20.4124H122.168Z"
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
