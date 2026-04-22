import { formatGeorgianDate } from "~/composables/formatGeorgianDate";

export const formatBlogDate = (value: string | null | undefined): string =>
  formatGeorgianDate(value);
