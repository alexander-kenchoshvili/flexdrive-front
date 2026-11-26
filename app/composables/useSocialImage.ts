import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { resolveSocialImage } from "~/utils/socialImage";

export const useSocialImage = (
  image?: MaybeRefOrGetter<string | null | undefined>,
  alt?: MaybeRefOrGetter<string | null | undefined>,
) => {
  const config = useRuntimeConfig();
  const preview = computed(() => resolveSocialImage(
    String(config.public.siteUrl || "https://localhost:3000"),
    toValue(image),
    toValue(alt),
  ));

  useSeoMeta({
    ogImage: () => preview.value.url,
    ogImageWidth: () => preview.value.width,
    ogImageHeight: () => preview.value.height,
    ogImageType: () => preview.value.type,
    ogImageAlt: () => preview.value.alt,
    twitterImage: () => preview.value.url,
    twitterImageAlt: () => preview.value.alt,
  });

  return computed(() => preview.value.url);
};
