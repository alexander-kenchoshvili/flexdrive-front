import { apiFetch } from "./apiFetch";

export const useSingleView = (
  slug: string,
  id: number | string,
  singleSlug?: string | null,
) => {
  return apiFetch(`/pages/getCurrentContent/`, {
    method: "POST",
    body: {
      slug,
      single_id: id,
      single_slug: singleSlug,
    },
  });
};
