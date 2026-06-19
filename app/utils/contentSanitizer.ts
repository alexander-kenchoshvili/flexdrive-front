import DOMPurify from "dompurify";

const richTextTags = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "blockquote",
  "hr",
  "a",
  "img",
  "figure",
  "figcaption",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "pre",
  "code",
  "span",
];

const svgTags = [
  "svg",
  "g",
  "path",
  "circle",
  "ellipse",
  "rect",
  "line",
  "polyline",
  "polygon",
  "title",
  "desc",
  "defs",
  "linearGradient",
  "radialGradient",
  "stop",
  "clipPath",
  "mask",
];

export const sanitizeRichText = (value: string | null | undefined) =>
  sanitizeInBrowser(value, {
    ALLOWED_TAGS: richTextTags,
    ALLOWED_ATTR: [
      "href",
      "title",
      "target",
      "rel",
      "src",
      "alt",
      "width",
      "height",
      "loading",
      "colspan",
      "rowspan",
      "scope",
      "class",
    ],
  });

export const sanitizeSvg = (value: string | null | undefined) => {
  const sanitized = sanitizeInBrowser(value, {
    ALLOWED_TAGS: svgTags,
    ALLOWED_ATTR: [
      "xmlns",
      "viewBox",
      "width",
      "height",
      "fill",
      "stroke",
      "role",
      "aria-hidden",
      "focusable",
      "preserveAspectRatio",
      "stroke-width",
      "transform",
      "opacity",
      "d",
      "fill-rule",
      "clip-rule",
      "stroke-linecap",
      "stroke-linejoin",
      "cx",
      "cy",
      "r",
      "rx",
      "ry",
      "x",
      "y",
      "x1",
      "y1",
      "x2",
      "y2",
      "points",
      "id",
      "gradientUnits",
      "gradientTransform",
      "fx",
      "fy",
      "offset",
      "stop-color",
      "stop-opacity",
      "clipPathUnits",
      "maskUnits",
      "maskContentUnits",
    ],
    ALLOW_UNKNOWN_PROTOCOLS: false,
    KEEP_CONTENT: false,
  });

  return /^<svg(?:\s|>)/.test(sanitized) ? sanitized : "";
};

const sanitizeInBrowser = (
  value: string | null | undefined,
  config: Parameters<typeof DOMPurify.sanitize>[1],
) => {
  const normalized = value?.trim() || "";

  if (!normalized || import.meta.server) {
    return normalized;
  }

  return DOMPurify.sanitize(normalized, config);
};
