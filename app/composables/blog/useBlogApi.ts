import type { BlogListParams, BlogListResponse } from "~/types/blog";

const NUMBER_PARAM_KEYS: Array<keyof BlogListParams> = ["page"];

const buildListQuery = (params: BlogListParams = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([rawKey, rawValue]) => {
    if (rawValue === undefined || rawValue === null || rawValue === "") return;

    const key = rawKey as keyof BlogListParams;
    if (NUMBER_PARAM_KEYS.includes(key) && typeof rawValue !== "number") return;

    query.set(rawKey, String(rawValue));
  });

  return query.toString();
};

export const useBlogApi = () => {
  const getBlogPosts = async (params: BlogListParams = {}) => {
    const query = buildListQuery(params);
    const endpoint = query ? `/pages/blog/posts/?${query}` : "/pages/blog/posts/";
    return apiFetch<BlogListResponse>(endpoint);
  };

  const fetchBlogPosts = async (params: BlogListParams = {}) => {
    const query = buildListQuery(params);
    const endpoint = query ? `/pages/blog/posts/?${query}` : "/pages/blog/posts/";
    return apiFetchRaw<BlogListResponse>(endpoint);
  };

  return {
    getBlogPosts,
    fetchBlogPosts,
  };
};
