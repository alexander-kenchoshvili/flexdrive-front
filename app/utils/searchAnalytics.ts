// Normalize only the analytics copy: never change the customer's actual query.
export const normalizeSearchAnalyticsTerm = (value: string) => {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return "";
  return normalized
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[email]")
    .replace(/(?:\+?995[\s()-]*)?\b5\d{2}[\s()-]*\d{2}[\s()-]*\d{2}[\s()-]*\d{2}\b/g, "[phone]")
    .slice(0, 100);
};
