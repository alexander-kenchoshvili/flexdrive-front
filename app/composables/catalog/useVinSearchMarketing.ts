import { useMetaMarketing } from "~/composables/useMetaMarketing";

export const useVinSearchMarketing = () => {
  const { trackVinSearch } = useMetaMarketing();
  return { track: trackVinSearch };
};
