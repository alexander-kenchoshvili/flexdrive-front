const GEORGIAN_MONTHS = [
  "იანვარი",
  "თებერვალი",
  "მარტი",
  "აპრილი",
  "მაისი",
  "ივნისი",
  "ივლისი",
  "აგვისტო",
  "სექტემბერი",
  "ოქტომბერი",
  "ნოემბერი",
  "დეკემბერი",
];

export const formatGeorgianDate = (
  value: string | null | undefined,
): string => {
  if (!value) return "";

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const monthIndex = Number(month) - 1;
    const dayNumber = Number(day);

    if (
      monthIndex >= 0 &&
      monthIndex < GEORGIAN_MONTHS.length &&
      dayNumber > 0
    ) {
      return `${dayNumber} ${GEORGIAN_MONTHS[monthIndex]} ${year}`;
    }
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "";

  return `${parsedDate.getDate()} ${GEORGIAN_MONTHS[parsedDate.getMonth()]} ${parsedDate.getFullYear()}`;
};
