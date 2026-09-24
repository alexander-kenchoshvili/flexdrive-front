// Translate only customer-facing auth errors; keep server validation unchanged.
const authErrorRules: Array<[RegExp, string]> = [
  [/invalid credentials|no active account found/i, "ელფოსტა ან პაროლი არასწორია."],
  [/account is not activated/i, "ანგარიში ჯერ არ არის გააქტიურებული. შეამოწმეთ ელფოსტა და გახსენით აქტივაციის ბმული."],
  [/invalid or expired token|invalid.*uuid/i, "ბმული არასწორია ან ვადა გაუვიდა. მოითხოვეთ ახალი ბმული."],
  [/token.*(?:expired|invalid|no longer valid)|authentication credentials|not authenticated/i, "სესიის ვადა ამოიწურა. გთხოვთ, ხელახლა შეხვიდეთ."],
  [/current password is incorrect/i, "მიმდინარე პაროლი არასწორია."],
  [/already linked/i, "ეს ანგარიში უკვე დაკავშირებულია სხვა ანგარიშთან. სცადეთ შესვლის სხვა მეთოდი."],
  [/email.*already (?:exists|in use)|user with this email already exists/i, "ეს ელფოსტა უკვე გამოიყენება."],
  [/passwords do not match/i, "პაროლები არ ემთხვევა."],
  [/password is too common/i, "ეს პაროლი ძალიან გავრცელებულია. აირჩიეთ უფრო რთული პაროლი."],
  [/password is too short/i, "პაროლი მინიმუმ 8 სიმბოლოს უნდა შეიცავდეს."],
  [/password is entirely numeric/i, "პაროლი მხოლოდ ციფრებისგან არ უნდა შედგებოდეს."],
  [/password is too similar/i, "პაროლი ძალიან ჰგავს თქვენს პირად მონაცემებს. აირჩიეთ სხვა პაროლი."],
  [/must accept terms/i, "რეგისტრაციის გასაგრძელებლად დაეთანხმეთ წესებსა და კონფიდენციალურობის პოლიტიკას."],
  [/valid email/i, "შეიყვანეთ სწორი ელფოსტა."],
  [/field is required|may not be blank|may not be null/i, "ეს ველი სავალდებულოა."],
  [/ensure this field has no more than/i, "შეყვანილი ტექსტი ძალიან გრძელია. შეამოკლეთ და სცადეთ თავიდან."],
  [/request was throttled|too many requests/i, "ძალიან ბევრი მცდელობაა. გთხოვთ, ცოტა ხანში სცადოთ ხელახლა."],
  [/recaptcha|csrf verification failed/i, "უსაფრთხოების შემოწმება ვერ შესრულდა. განაახლეთ გვერდი და სცადეთ თავიდან."],
  [/could not send the email|sender email|email recipient/i, "წერილის გაგზავნა ვერ მოხერხდა. გთხოვთ, მოგვიანებით სცადოთ."],
  [/facebook account did not provide an email/i, "Facebook-მა ელფოსტა არ მოგვაწოდა. სცადეთ შესვლის სხვა მეთოდი."],
  [/google email is not verified/i, "Google-ის ანგარიშზე ელფოსტა დადასტურებული არ არის. დაადასტურეთ ელფოსტა ან სცადეთ შესვლის სხვა მეთოდი."],
  [/google (?:auth|oauth|credential)/i, "Google-ით შესვლა ვერ შესრულდა. სცადეთ თავიდან ან გამოიყენეთ სხვა მეთოდი."],
  [/facebook (?:auth|oauth|app|profile|access)/i, "Facebook-ით შესვლა ვერ შესრულდა. სცადეთ თავიდან ან გამოიყენეთ სხვა მეთოდი."],
  [/failed to fetch|fetch failed|network|timeout|timed out|gateway/i, "სერვერთან დაკავშირება ვერ მოხერხდა. შეამოწმეთ ინტერნეტი და სცადეთ თავიდან."],
];

export const translateAuthError = (
  message: unknown,
  fallback = "დაფიქსირდა შეცდომა. სცადეთ თავიდან.",
): string => {
  if (typeof message !== "string" || !message.trim()) return fallback;
  const text = message.trim();
  // Existing Georgian validation copy remains unchanged.
  if (/[ა-ჰ]/u.test(text) && !/ErrorDetail|FetchError|https?:\/\//i.test(text)) return text;
  for (const [pattern, translation] of authErrorRules) {
    if (pattern.test(text)) return translation;
  }
  // Never display an untranslated technical exception to a customer.
  return fallback;
};

export const getAuthErrorMessage = (
  payload: unknown,
  fallback = "დაფიქსირდა შეცდომა. სცადეთ თავიდან.",
): string => {
  const firstMessage = (value: unknown): string | undefined => {
    if (typeof value === "string" && value.trim()) return value;
    if (!value || typeof value !== "object") return undefined;
    if (value instanceof Error) return value.message;
    const record = value as Record<string, unknown>;
    const keys = Array.isArray(value)
      ? Object.keys(value)
      : [...new Set(["non_field_errors", "detail", "email", "password", "message", ...Object.keys(record)])];
    for (const key of keys) {
      const message = firstMessage(record[key]);
      if (message) return message;
    }
    return undefined;
  };
  return translateAuthError(firstMessage(payload), fallback);
};
