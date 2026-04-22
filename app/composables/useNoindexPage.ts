type NoindexPageOptions = {
  title?: string;
  description?: string;
};

export const useNoindexPage = (options: NoindexPageOptions = {}) => {
  const { title, description } = options;

  useSeoMeta({
    title,
    description,
    robots: "noindex, nofollow",
    ogTitle: title,
    ogDescription: description,
    twitterTitle: title,
    twitterDescription: description,
  });
};
