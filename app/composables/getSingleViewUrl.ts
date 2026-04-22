import { buildSingleViewPath } from "~/utils/routePaths";

export const getSingleViewUrl = (item: any) =>
  buildSingleViewPath({
    contentType: item?.content_type,
    id: item?.id,
    slug: item?.slug,
  });
