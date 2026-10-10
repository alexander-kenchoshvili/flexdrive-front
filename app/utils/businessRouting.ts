export const BUSINESS_SECTIONS = [
  { key: "overview", path: "/business", label: "მიმოხილვა", title: "ბიზნესის მიმოხილვა", description: "გაყიდვები, ფინანსები და საქმიანობის მნიშვნელოვანი მაჩვენებლები ერთ სივრცეში." },
  { key: "sales", path: "/business/sales", label: "გაყიდვები", title: "გაყიდვების ანალიტიკა", description: "გადახდილი შეკვეთები, გაყიდული პროდუქტები და პერიოდების შედარება." },
  { key: "finance", path: "/business/finance", label: "ფინანსები", title: "ფინანსური მდგომარეობა", description: "მიღებული და დაბრუნებული თანხები, პროდუქტების ღირებულება და მოგება." },
  { key: "users", path: "/business/users", label: "მომხმარებლები", title: "მომხმარებლები და ძებნა", description: "როგორ მოდიან მომხმარებლები, რას ეძებენ და როგორ გადიან ყიდვის გზას." },
  { key: "marketing", path: "/business/marketing", label: "მარკეტინგი", title: "მარკეტინგის შედეგები", description: "რეკლამის შედეგები და Facebook/Instagram აქტივობა." },
  { key: "operations", path: "/business/operations", label: "ოპერაციები", title: "ყოველდღიური ოპერაციები", description: "დაბრუნებები, საკუთარი მარაგი და სინქრონიზაციის მდგომარეობა." },
] as const;

export type BusinessSectionKey = (typeof BUSINESS_SECTIONS)[number]["key"];

export const isBusinessPath = (value: string) => {
  let path = String(value || "").split(/[?#]/)[0] || "/";
  try { path = decodeURIComponent(path); } catch { /* Invalid paths are left unchanged. */ }
  path = path.toLowerCase();
  return path === "/business" || path.startsWith("/business/");
};

// Only known private views can be a login return destination.
export const businessReturnPath = (value: unknown) => {
  const path = typeof value === "string" ? value : "";
  return BUSINESS_SECTIONS.some((section) => section.path === path) ? path : "/business";
};
