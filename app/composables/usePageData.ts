import { apiFetch } from "./apiFetch";

export const usePageData = (slug: string) => {
  return apiFetch(`/pages/getCurrentContent/`, {
    method: "POST",
    body: {
      slug,
    },
  });
};
