export const BUSINESS_SECTIONS = [
  { key: "overview", path: "/business", label: "მიმოხილვა", title: "ბიზნესის მიმოხილვა", description: "გაყიდვები, ფინანსები და საქმიანობის მნიშვნელოვანი მაჩვენებლები ერთ სივრცეში." },
  { key: "google-search", path: "/business/google-search", label: "საძიებო სისტემა", title: "Google · საძიებო სისტემა", description: "Google Search Console-ის საძიებო სიტყვები, გვერდები და შედეგები." },
  { key: "sales", path: "/business/sales", label: "გაყიდვები", title: "გაყიდვების ანალიტიკა", description: "გადახდილი შეკვეთები, გაყიდული პროდუქტები და პერიოდების შედარება." },
  { key: "carts", path: "/business/carts", label: "კალათები და დაწყებული ყიდვები", title: "კალათები და დაწყებული ყიდვები", description: "კალათის შიგთავსი, დამატებები და გადახდის ეტაპები." },
  { key: "checkout", path: "/business/checkout", label: "დაწყებული ყიდვები", title: "დაწყებული ყიდვები", description: "პროდუქტები, გაფორმების ეტაპები და გადახდის შედეგები." },
  { key: "finance", path: "/business/finance", label: "ფინანსები", title: "ფინანსური მდგომარეობა", description: "მიღებული და დაბრუნებული თანხები, პროდუქტების ღირებულება და მოგება." },
  { key: "users", path: "/business/users", label: "საიტის ანალიტიკა", title: "Google · საიტის ანალიტიკა", description: "როგორ მოდიან მომხმარებლები, რას ეძებენ და როგორ გადიან ყიდვის გზას." },
  { key: "meta-events", path: "/business/meta-events", label: "საიტის მოვლენები · Pixel", title: "Meta · საიტის მოვლენები", description: "Pixel-ისა და CAPI-ის მოვლენების რაოდენობები, კამპანიის შედეგებისგან გამიჯნულად." },
  { key: "social", path: "/business/social", label: "Facebook და Instagram", title: "Meta · Facebook და Instagram", description: "გვერდებისა და პროფილების აქტივობა." },
  { key: "diagnostics", path: "/business/diagnostics", label: "კავშირები და დიაგნოსტიკა", title: "კავშირები და დიაგნოსტიკა", description: "წყაროების მდგომარეობა და ტექნიკური შეზღუდვები." },
  { key: "marketing", path: "/business/marketing", label: "რეკლამები და კამპანიები", title: "Meta · რეკლამები და კამპანიები", description: "რეკლამის შედეგები და Facebook/Instagram აქტივობა." },
  { key: "vehicle-demand", path: "/business/vehicle-demand", label: "მოთხოვნა მანქანებზე", title: "რა მანქანების ნაწილებს ეძებენ", description: "მარკა, მოდელი, წელი და მომხმარებლების ინტერესის მოკლე შეჯამება." },
  { key: "payments", path: "/business/payments", label: "გადახდის პრობლემები", title: "გადახდის პრობლემები", description: "წარუმატებელი გადახდების მიზეზები, მცდელობების ისტორია და შემდგომი შედეგი." },
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

export const BUSINESS_GROUPS = [
  { label: "მიმოხილვა", keys: ["overview"] },
  { label: "ჩვენი მაღაზია", keys: ["sales", "finance", "carts", "payments", "vehicle-demand", "operations"] },
  { label: "Google", keys: ["users", "google-search"] },
  { label: "Meta", keys: ["marketing", "meta-events", "social"] },
  { label: "კავშირები", keys: ["diagnostics"] },
] as const;
