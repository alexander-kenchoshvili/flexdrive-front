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
    class="new-flexdrive-logo"
    :data-variant="resolvedVariant"
    width="650"
    height="369"
    viewBox="0 0 650 369"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :role="decorative ? undefined : 'img'"
    :aria-hidden="decorative ? 'true' : undefined"
    :aria-labelledby="decorative ? undefined : titleId"
  >
    <title v-if="!decorative" :id="titleId">{{ props.title }}</title>

    <path
      d="M474.673 77.174V70.6523L327.556 172.825C322.903 183.218 318.889 187.13 309.664 191.303C303.388 190.268 299.891 189.078 293.759 183.694C291.053 176.282 291.213 180.043 291.771 188.042C295.475 194.173 298.137 196.71 303.7 199.998C317.304 200.09 323.533 196.869 330.539 181.52L474.673 77.174Z"
      fill="#375206"
    />
    <path
      d="M474.673 69.566L472.685 68.4791L318.61 156.521C300.622 155.491 292.722 161.465 291.772 176.086C293.869 187.122 298.172 189.778 309.664 190.216C320.978 185.747 324.206 181.438 326.563 171.738L474.673 69.566Z"
      fill="#8AA626"
    />
    <path
      d="M585.012 177.17L517.418 178.257V188.04H587L586.006 157.606L585.012 177.17Z"
      fill="#304702"
    />
    <path
      d="M577.06 121.739L521.394 138.043C523.563 154.624 522.501 163.385 517.418 178.259H584.018C587.273 156.114 586.073 143.735 577.06 121.739Z"
      fill="#729927"
    />
    <path
      d="M520.403 138.04V127.17L574.081 110.866L576.069 121.736L520.403 138.04Z"
      fill="#304702"
    />
    <path
      d="M488.597 79.349L490.585 66.3057C510.731 90.2269 516.498 103.264 520.406 126.088V135.87C513.395 110.121 506.46 97.691 488.597 79.349Z"
      fill="#496302"
    />
    <path
      d="M526.364 43.4794L489.585 66.3052C507.835 86.5152 515.03 99.286 519.406 126.087L574.078 109.783C563.47 79.0047 553.138 64.4938 526.364 43.4794Z"
      fill="#9AB61A"
    />
    <path
      d="M437.899 46.736L436.905 35.8666C452.9 40.4402 462.351 45.1407 480.643 59.7793L518.416 36.9535L519.41 46.736L480.643 71.7356C465.378 59.5458 456.046 54.0952 437.899 46.736Z"
      fill="#496302"
    />
    <path
      d="M455.785 8.69354L437.893 34.7801C456.591 42.8555 466.114 48.0807 481.63 58.6928L517.415 36.954C495.907 23.7943 482.732 17.3424 455.785 8.69354Z"
      fill="#9AB61A"
    />
    <path
      d="M369.312 34.7807L367.324 23.9113C391.353 25.9623 404.497 27.7055 426.966 32.6069L444.859 5.43335L447.841 16.3028L428.954 42.3893C406.345 37.8506 393.32 36.0939 369.312 34.7807Z"
      fill="#496302"
    />
    <path
      d="M378.252 0L368.311 23.9127C391.942 25.1395 404.793 26.9713 426.959 32.6083L444.852 5.43471C418.913 1.66353 404.33 0.504638 378.252 0Z"
      fill="#9AB61A"
    />
    <path
      d="M304.98 44.5646L301.998 33.6952C323.324 27.8845 335.523 26.0444 357.664 24.9997L367.604 0L370.586 8.69553L359.652 35.8691C337.949 37.7942 325.977 39.7246 304.98 44.5646Z"
      fill="#0F1111"
    />
    <path
      d="M291.776 39.1326C276.548 40.5528 264.472 45.5541 239.092 58.6976L241.08 67.3931C264.88 58.3291 277.17 53.8486 293.764 48.9151L299.728 26.0893L295.752 13.0461L291.776 39.1326Z"
      fill="#0F1111"
    />
    <path
      d="M305.691 10.8694L301.715 32.6083C323.457 27.0482 335.645 25.4288 357.381 24.9997L367.322 0C341.154 1.87481 327.531 4.11063 305.691 10.8694Z"
      fill="#55595B"
    />
    <path
      d="M295.741 14.1329C273.183 21.5735 260.398 26.4922 237.094 38.0456L240.076 57.6105C260.429 46.9284 271.745 42.5065 291.765 38.0456L295.741 14.1329Z"
      fill="#55595B"
    />
    <path
      d="M228.15 43.4794L172.484 83.6962L176.46 97.8264C196.38 81.726 207.878 74.0796 229.144 63.0443L228.15 43.4794Z"
      fill="#575B5E"
    />
    <path
      d="M178.452 106.522L175.469 97.8264C196.202 82.2426 208 74.0623 230.141 63.0443L228.153 43.4794L233.123 53.2618L234.117 70.6529L178.452 106.522Z"
      fill="#0F1112"
    />
    <path
      d="M162.547 92.3922C125.977 126.479 109.524 146.98 87 185.869C116.825 150.233 134.427 132.566 167.517 105.435L162.547 92.3922Z"
      fill="#575B5E"
    />
    <path
      d="M167.517 105.435L163.54 92.3922L169.505 100.001L171.493 113.044C138.501 143.081 120.758 160.539 89.9821 192.391L87 186.956C116.646 152.703 134.027 134.522 167.517 105.435Z"
      fill="#0F1112"
    />
    <path
      d="M561.64 351.973L577.387 276.297H633.376L622.878 302.784H587.885L583.511 323.595H629.002L622.878 351.973H561.64Z"
      fill="#7DA009"
    />
    <path
      d="M633.377 276.297L622.879 302.784H587.886L583.512 323.595L587.011 317.919H623.754L634.252 291.432L633.377 276.297Z"
      fill="#1E3202"
    />
    <path
      d="M561.64 369V351.973H622.878L629.002 323.594L629.877 340.621L622.878 367.108L561.64 369Z"
      fill="#112000"
    />
    <path
      d="M649.125 229H587.012L580.889 255.487H643.002L649.125 229Z"
      fill="#7DA009"
    />
    <path
      d="M504.777 350.082L497.779 229H516.15L520.524 316.028L559.017 229H577.388L523.149 350.082H504.777Z"
      fill="#7B9E0A"
    />
    <path
      d="M523.152 350.082L577.392 229L580.016 242.243L524.902 367.109H504.781V350.082H523.152Z"
      fill="#2E4A02"
    />
    <path
      d="M447.913 350.082L474.158 230.892L489.03 229L464.534 350.082H447.913Z"
      fill="#86A819"
    />
    <path
      d="M448.788 367.109L447.913 350.082H464.535L489.03 229L490.779 242.243L465.409 367.109H448.788Z"
      fill="#1B3200"
    />
    <path
      d="M367.432 350.081L384.054 276.296H398.927L397.177 283.864H428.671C433.595 280.299 435.193 277.29 436.544 270.621C437.955 261.617 437.245 258.374 433.045 255.485H388.429L393.678 230.891H447.917C453.925 230.889 455.854 233.351 456.666 242.242L450.542 274.404C448.215 289.846 445.798 297.532 438.294 308.459H425.172L438.294 350.081H419.048L406.8 308.459H391.928L384.054 350.081H367.432Z"
      fill="#86A819"
    />
    <path
      d="M433.038 255.488H388.421V272.515H433.038C435.697 272.427 436.746 271.65 436.537 266.839C437.638 259.924 437.068 257.398 433.038 255.488Z"
      fill="#223A01"
    />
    <path
      d="M384.054 350.082H367.432L369.182 365.217H385.804L393.677 325.487H407.675L419.922 367.109H440.044L439.169 350.082H419.048L406.8 308.46H391.928L384.054 350.082Z"
      fill="#223A01"
    />
    <path
      d="M317.564 230.891L305.317 255.485H354.307C358.508 256.444 359.173 259.345 358.682 266.837L350.808 302.783C349.224 313.341 347.356 317.176 342.934 321.702H311.44L321.064 276.296H307.066L290.444 348.189H342.934C352.754 342.298 356.941 335.599 362.181 317.918L377.053 247.918C376.914 239.411 375.901 235.406 370.929 230.891H317.564Z"
      fill="#86A819"
    />
    <path
      d="M354.308 255.488H305.317L307.942 272.515H356.932C360.603 262.283 360.775 257.933 354.308 255.488Z"
      fill="#345103"
    />
    <path
      d="M311.439 321.703L321.062 276.297L325.436 291.432L318.437 319.811L311.439 321.703Z"
      fill="#345103"
    />
    <path
      d="M221.334 348.191L246.704 306.569L255.452 348.191H275.573L278.198 363.326H258.077L246.704 323.596L223.084 363.326H203.838L200.338 348.191H221.334Z"
      fill="#090A0A"
    />
    <path
      d="M240.578 287.648L226.58 230.891L225.705 232.783L238.828 287.648H240.578Z"
      fill="#020203"
    />
    <path
      d="M240.581 287.648L226.583 230.891H244.955L255.453 264.945L277.324 230.891H295.695L259.827 287.648L275.574 348.189H255.453L246.704 306.567L221.334 348.189H200.338L240.581 287.648Z"
      fill="#303234"
    />
    <path
      d="M259.824 287.648L295.692 230.891L300.066 242.242L263.323 300.891L259.824 287.648Z"
      fill="#090A0A"
    />
    <path
      d="M69.986 346.297L96.2308 230.891H110.228L90.107 319.81H130.349L124.225 346.297H69.986Z"
      fill="#303234"
    />
    <path
      d="M72.6105 363.324L69.986 346.297H124.225L130.349 319.81L135.598 331.161L128.6 363.324H72.6105Z"
      fill="#111213"
    />
    <path
      d="M110.227 230.891L90.1061 319.81H98.8544L115.476 242.242L110.227 230.891Z"
      fill="#111213"
    />
    <path
      d="M0 346.297L16.6218 276.297H69.1117L58.6137 300.892H24.4953L14.8721 346.297H0Z"
      fill="#303234"
    />
    <path
      class="logo-flex-f-shadow"
      d="M14.8722 346.297L24.4953 300.892H58.6139L69.1119 276.297L74.3609 287.648L62.988 312.405H28.8695L20.1212 356.216H3.49934L0 346.297H14.8722Z"
      fill="#0A0B0D"
    />
    <path
      d="M18.371 257.379H19.2459L77.8596 255.487L86.608 229H30.6187L18.371 257.379Z"
      fill="#303234"
    />
    <path
      class="logo-flex-f-shadow"
      d="M18.371 257.379L16.142 265.781L17.421 263.945H82.2338L90.9821 240.351L86.6079 229L77.8596 255.487L18.371 257.379Z"
      fill="#0A0B0D"
    />
    <path
      class="logo-flex-e-face"
      d="M134.725 346.298L160.095 229L217.834 230.892L210.835 255.487H168.843L164.469 276.298H202.087L192.464 299H159.22L154.846 319.811L195.963 321.703L190.714 348.19L134.725 346.298Z"
      fill="#303234"
    />
    <path
      class="logo-flex-e-shadow"
      d="M190.714 348.19L195.963 321.704L202.087 331.163L195.088 363.326H137.349L134.725 346.298L190.714 348.19Z"
      fill="#0F1212"
    />
    <path
      class="logo-flex-e-shadow"
      d="M159.219 299L156.509 310.18L196.202 308.33L206.46 287.648L202.086 276.297L192.463 299H159.219Z"
      fill="#020203"
    />
    <path
      class="logo-flex-e-shadow"
      d="M168.845 255.485L165.646 267.14L166.925 265.021H213.461L222.21 242.242L217.835 230.891L210.837 255.485H168.845Z"
      fill="#020203"
    />
    <path
      d="M343.809 348.189H290.444L293.069 365.216H343.809C352.775 361.163 356.994 355.767 363.056 340.621L371.804 300.891L377.928 272.513L379.677 257.377V246.026C378.59 242.745 377.937 240.842 376.178 236.566C375.23 233.789 374.114 232.667 371.804 230.891C375.14 234.578 376.276 238.337 377.053 247.918L359.556 325.486C355.477 336.764 352.421 342.197 343.809 348.189Z"
      fill="#314D01"
    />
    <path
      d="M425.169 308.461H438.292C442.178 302.903 443.959 299.715 446.165 293.326C448.364 286.35 449.264 282.073 450.539 274.407L456.663 242.244C456.461 239.982 456.265 238.754 455.788 236.569L458.413 246.028L459.288 257.38L448.79 306.569L445.29 314.137L433.043 323.596L430.418 325.488L425.169 308.461Z"
      fill="#1B3200"
    />
    <path
      d="M649.125 229L643.002 255.487H580.889V272.514H643.002L650 247.919L649.125 229Z"
      fill="#1E3202"
    />
  </svg>
</template>

<style scoped>
.new-flexdrive-logo {
  --logo-green-darkest: #2f4312;
  --logo-green-shadow: #365016;
  --logo-green-deep: #3f5a18;
  --logo-green-side: #4f6f1f;
  --logo-green-side-alt: #456317;
  --logo-green-angle: #5b7f24;
  --logo-green-mid: #6f932e;
  --logo-green-rich: #7ca337;
  --logo-green-main: #82a93e;
  --logo-green-highlight: #94b94a;
  --logo-green-bright: #a8cf58;
  --logo-neutral-deepest: #050706;
  --logo-neutral-shadow: #070a0b;
  --logo-neutral-shadow-alt: #0d1112;
  --logo-neutral-edge: #121719;
  --logo-neutral-edge-alt: #151a1c;
  --logo-neutral-deep: #1a2022;
  --logo-neutral-face-alt: #283033;
  --logo-neutral-face: #202629;
  --logo-neutral-plate: #5f676b;
  --logo-neutral-plate-alt: #6b7478;
  --logo-flex-e-face: #2d3639;
  --logo-flex-e-shadow: var(--logo-neutral-shadow);
  display: block;
}

.new-flexdrive-logo[data-variant="on-light"] {
  --logo-green-darkest: #2f4312;
  --logo-green-shadow: #365016;
  --logo-green-deep: #3f5a18;
  --logo-green-side: #4f6f1f;
  --logo-green-side-alt: #456317;
  --logo-green-angle: #5b7f24;
  --logo-green-mid: #6f932e;
  --logo-green-rich: #7ca337;
  --logo-green-main: #82a93e;
  --logo-green-highlight: #94b94a;
  --logo-green-bright: #a8cf58;
  --logo-neutral-deepest: #050706;
  --logo-neutral-shadow: #070a0b;
  --logo-neutral-shadow-alt: #0d1112;
  --logo-neutral-edge: #121719;
  --logo-neutral-edge-alt: #151a1c;
  --logo-neutral-deep: #1a2022;
  --logo-neutral-face-alt: #283033;
  --logo-neutral-face: #202629;
  --logo-neutral-plate: #5f676b;
  --logo-neutral-plate-alt: #6b7478;
  --logo-flex-e-face: #2d3639;
  --logo-flex-e-shadow: var(--logo-neutral-shadow);
}

.new-flexdrive-logo[data-variant="on-dark"] {
  --logo-green-darkest: #789b2f;
  --logo-green-shadow: #84a937;
  --logo-green-deep: #8ab23a;
  --logo-green-side: #95be43;
  --logo-green-side-alt: #9fc64f;
  --logo-green-angle: #a8cf58;
  --logo-green-mid: #b2d95f;
  --logo-green-rich: #b7dd66;
  --logo-green-main: #c0e86f;
  --logo-green-highlight: #c8ea7a;
  --logo-green-bright: #d4f08f;
  --logo-neutral-deepest: #93a08f;
  --logo-neutral-shadow: #a3ad9d;
  --logo-neutral-shadow-alt: #b2bdad;
  --logo-neutral-edge: #c7d1c0;
  --logo-neutral-edge-alt: #d1d9cc;
  --logo-neutral-deep: #dce4d6;
  --logo-neutral-face-alt: #eef5ea;
  --logo-neutral-face: #f7faf2;
  --logo-neutral-plate: #c6d0c2;
  --logo-neutral-plate-alt: #d3ddce;
  --logo-flex-e-face: var(--logo-neutral-face);
  --logo-flex-e-shadow: var(--logo-neutral-shadow);
}

.new-flexdrive-logo [fill="#112000"],
.new-flexdrive-logo [fill="#192C01"],
.new-flexdrive-logo [fill="#1B3200"] {
  fill: var(--logo-green-darkest);
}

.new-flexdrive-logo [fill="#1E3202"],
.new-flexdrive-logo [fill="#223A01"],
.new-flexdrive-logo [fill="#243701"] {
  fill: var(--logo-green-shadow);
}

.new-flexdrive-logo [fill="#2E4A02"],
.new-flexdrive-logo [fill="#304702"],
.new-flexdrive-logo [fill="#314D01"] {
  fill: var(--logo-green-deep);
}

.new-flexdrive-logo [fill="#345103"],
.new-flexdrive-logo [fill="#375206"] {
  fill: var(--logo-green-side);
}

.new-flexdrive-logo [fill="#3D5B01"] {
  fill: var(--logo-green-side-alt);
}

.new-flexdrive-logo [fill="#496302"] {
  fill: var(--logo-green-angle);
}

.new-flexdrive-logo [fill="#729927"] {
  fill: var(--logo-green-mid);
}

.new-flexdrive-logo [fill="#7B9E0A"],
.new-flexdrive-logo [fill="#7DA009"],
.new-flexdrive-logo [fill="#7D9F08"] {
  fill: var(--logo-green-rich);
}

.new-flexdrive-logo [fill="#86A819"],
.new-flexdrive-logo [fill="#86A91A"] {
  fill: var(--logo-green-main);
}

.new-flexdrive-logo [fill="#8AA626"] {
  fill: var(--logo-green-highlight);
}

.new-flexdrive-logo [fill="#9AB61A"] {
  fill: var(--logo-green-bright);
}

.new-flexdrive-logo [fill="#010000"],
.new-flexdrive-logo [fill="#020203"] {
  fill: var(--logo-neutral-deepest);
}

.new-flexdrive-logo [fill="#030606"] {
  fill: var(--logo-neutral-shadow);
}

.new-flexdrive-logo [fill="#06080A"],
.new-flexdrive-logo [fill="#090A0A"],
.new-flexdrive-logo [fill="#0A0B0D"] {
  fill: var(--logo-neutral-shadow-alt);
}

.new-flexdrive-logo [fill="#0F1111"],
.new-flexdrive-logo [fill="#111213"] {
  fill: var(--logo-neutral-edge);
}

.new-flexdrive-logo [fill="#0F1112"],
.new-flexdrive-logo [fill="#0F1212"] {
  fill: var(--logo-neutral-edge-alt);
}

.new-flexdrive-logo [fill="#16191A"] {
  fill: var(--logo-neutral-deep);
}

.new-flexdrive-logo [fill="#303234"],
.new-flexdrive-logo [fill="#313435"] {
  fill: var(--logo-neutral-face-alt);
}

.new-flexdrive-logo [fill="#353739"] {
  fill: var(--logo-neutral-face);
}

.new-flexdrive-logo [fill="#55595B"] {
  fill: var(--logo-neutral-plate);
}

.new-flexdrive-logo [fill="#575B5E"] {
  fill: var(--logo-neutral-plate-alt);
}

.new-flexdrive-logo .logo-flex-e-face {
  fill: var(--logo-flex-e-face);
}

.new-flexdrive-logo .logo-flex-e-shadow {
  fill: var(--logo-flex-e-shadow);
}

.new-flexdrive-logo .logo-flex-f-shadow {
  fill: var(--logo-neutral-shadow-alt);
}
</style>
