import { sanitizeText } from "~/composables/helpers";
import type { ContentItemData, SmartComponentRenderData } from "~/types/page";

export type LegalPageData = SmartComponentRenderData & {
  updated_at?: string | null;
};

export type LegalPageSection = {
  id: number;
  anchorId: string;
  title: string;
  summary: string;
  html: string;
  iconName: LegalSectionIconName;
  position: number;
};

export type LegalSectionIconName =
  | "archive"
  | "banknotes"
  | "card"
  | "chat"
  | "check"
  | "clipboard"
  | "clock"
  | "document"
  | "exclamation"
  | "eye"
  | "lock"
  | "map"
  | "refund"
  | "share"
  | "shield"
  | "tag"
  | "truck"
  | "user";

export const getLegalPageSections = (
  items: unknown,
  anchorPrefix: string,
  iconNames: LegalSectionIconName[],
): LegalPageSection[] => {
  const list = Array.isArray(items) ? (items as ContentItemData[]) : [];

  return list
    .map((item, index) => {
      const position = Number(item.position ?? index + 1);

      return {
        id: Number(item.id ?? index + 1),
        anchorId: `${anchorPrefix}-${position}`,
        title: sanitizeText(item.title),
        summary: sanitizeText(item.description),
        html: item.editor?.trim() || "",
        iconName: iconNames[index % iconNames.length],
        position,
      };
    })
    .filter((item) => item.title || item.summary || item.html)
    .sort((a, b) =>
      a.position === b.position ? a.id - b.id : a.position - b.position,
    );
};
