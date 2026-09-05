/** Display-only VAT included in a final GEL total; never changes the payable total. */
export const calculateIncludedCheckoutVat = (total: string): string | null => {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(total);
  if (!match) return null;

  // Work in integer tetri: extract 18 / 118, then round half up once.
  const totalTetri = BigInt(match[1]!) * 100n
    + BigInt((match[2] ?? "").padEnd(2, "0"));
  const vatTetri = (totalTetri * 18n + 59n) / 118n;

  return `${vatTetri / 100n}.${(vatTetri % 100n).toString().padStart(2, "0")}`;
};
