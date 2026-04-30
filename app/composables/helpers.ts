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

type TitleBrandConfig = {
  marker: string;
  text: string;
  accentSyntax: string;
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
const FLEX_DRIVE_TEXT = "FlexDrive";
const FLEX_DRIVE_ACCENT_SYNTAX = "Flex[[Drive]]";

const TITLE_BRANDS: TitleBrandConfig[] = [
  {
    marker: "auto",
    text: AUTO_MATE_TEXT,
    accentSyntax: AUTO_MATE_ACCENT_SYNTAX,
  },
  {
    marker: "flex",
    text: FLEX_DRIVE_TEXT,
    accentSyntax: FLEX_DRIVE_ACCENT_SYNTAX,
  },
];

const findTitleBrand = (text: string) =>
  TITLE_BRANDS.map((brand) => ({
    brand,
    index: text.toLowerCase().indexOf(brand.marker),
  }))
    .filter((match) => match.index >= 0)
    .sort((a, b) => a.index - b.index)[0];

export const splitAutoMateTitleParts = (
  value: string | null | undefined,
): AutoMateTitleParts => {
  const text = sanitizeText(value);
  const match = findTitleBrand(text);

  if (!match) {
    return {
      upperLeadingPart: text,
      brandSegments: [],
      upperTrailingPart: "",
    };
  }

  const { brand, index } = match;
  const bracketStartIndex = text.indexOf("[[", index);
  const plainBrandEndIndex = index + brand.text.length;
  const hasAccentSyntax =
    bracketStartIndex >= index && bracketStartIndex <= plainBrandEndIndex;
  const normalizedText = hasAccentSyntax
    ? text
    : `${text.slice(0, index)}${brand.accentSyntax}${text.slice(plainBrandEndIndex)}`;
  const brandStartIndex = normalizedText.toLowerCase().indexOf(brand.marker);
  const bracketEndIndex =
    brandStartIndex < 0 ? -1 : normalizedText.indexOf("]]", brandStartIndex);
  const brandEndIndex =
    bracketEndIndex >= 0
      ? bracketEndIndex + 2
      : brandStartIndex + brand.text.length;

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
