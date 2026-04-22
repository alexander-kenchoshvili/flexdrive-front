export const removeSingleViewSlugFromPath = (path: string): string => {
  let cleanPath = path.replace(/\/+$/, "");
  cleanPath = cleanPath.substring(0, cleanPath.lastIndexOf("/"));
  return cleanPath;
};

export const sanitizeText = (value: string | null | undefined): string =>
  value?.trim() || "";

export type AccentTextSegment = {
  text: string;
  accent: boolean;
};

export type AutoMateTitleParts = {
  upperLeadingPart: string;
  brandSegments: AccentTextSegment[];
  upperTrailingPart: string;
};

export const splitBracketAccentSegments = (
  value: string | null | undefined,
): AccentTextSegment[] => {
  const text = value?.trim() || "";
  if (!text) return [];

  const result: AccentTextSegment[] = [];
  const regex = /\[\[(.+?)\]\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = null;

  while ((match = regex.exec(text))) {
    const [rawMatch, accentText = ""] = match;
    const start = match.index;

    if (start > lastIndex) {
      result.push({ text: text.slice(lastIndex, start), accent: false });
    }

    if (accentText) {
      result.push({ text: accentText, accent: true });
    }

    lastIndex = start + rawMatch.length;
  }

  if (lastIndex < text.length) {
    result.push({ text: text.slice(lastIndex), accent: false });
  }

  return result;
};

const AUTO_MATE_TEXT = "AutoMate";
const AUTO_MATE_ACCENT_SYNTAX = "Auto[[Mate]]";

export const splitAutoMateTitleParts = (
  value: string | null | undefined,
): AutoMateTitleParts => {
  const text = sanitizeText(value);
  const normalizedText = text.includes("[[")
    ? text
    : text.replace(/AutoMate/g, AUTO_MATE_ACCENT_SYNTAX);
  const brandStartIndex = normalizedText.toLowerCase().indexOf("auto");
  const bracketEndIndex =
    brandStartIndex < 0 ? -1 : normalizedText.indexOf("]]", brandStartIndex);
  const brandEndIndex =
    bracketEndIndex >= 0
      ? bracketEndIndex + 2
      : brandStartIndex + AUTO_MATE_TEXT.length;

  return {
    upperLeadingPart:
      brandStartIndex < 0
        ? normalizedText
        : normalizedText.slice(0, brandStartIndex),
    brandSegments:
      brandStartIndex < 0
        ? []
        : splitBracketAccentSegments(
            normalizedText.slice(brandStartIndex, brandEndIndex),
          ),
    upperTrailingPart:
      brandStartIndex < 0 ? "" : normalizedText.slice(brandEndIndex),
  };
};
