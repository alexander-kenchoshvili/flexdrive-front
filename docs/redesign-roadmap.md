# FlexDrive Redesign Roadmap

Last updated: 2026-04-23

## Current Phase

ამ ეტაპის მიზანია მხოლოდ ვიზუალური redesign.

Scope მკაფიოდ არის შეზღუდული:

- არ ვცვლით business logic-ს.
- არ ვცვლით API contract-ებს.
- არ ვცვლით auth/register/login flow-ს.
- არ ვცვლით cart, wishlist, checkout, profile, admin ან reCAPTCHA/security ქცევას.
- არ ვამატებთ ჯერ ახალ auto-parts ლოგიკას, მაგალითად make/model/year fitment-ს.
- ვიზუალური კომპონენტები შეიძლება გადავაკეთოთ, ჩავანაცვლოთ ან ამოვიღოთ, მაგრამ არსებული data flow და user behavior უნდა შენარჩუნდეს.

ეს roadmap არის იმისთვის, რომ redesign წავიდეს ეტაპობრივად და არა ქაოსურად.

## Product Direction

FlexDrive უნდა გადავიდეს ძველი auto accessories shop-ის ვიზუალიდან auto parts ecommerce/catalog experience-ზე.

ახალი გამოცდილება უნდა გრძნობდეს თავს როგორც:

- ავტონაწილების კატალოგი და პროდუქტის ძებნის ინსტრუმენტი.
- პრაქტიკული ecommerce, სადაც ფასი, მარაგი, კატეგორია, SKU/ნაწილის იდენტიფიკატორი და პროდუქტის მდგომარეობა სწრაფად იკითხება.
- სანდო მაღაზია, სადაც checkout/profile/auth flow-ები მარტივი და მკაფიოა.
- მობილურზე სრულფასოვანი მაღაზია, არა desktop-ის შემცირებული ვერსია.

არ გვინდა:

- ძველი აქსესუარების მაღაზიის warm/orange visual identity-ის შენარჩუნება.
- ზედმეტად marketing landing page-ის შეგრძნება.
- დიდი დეკორატიული ბლოკები, რომლებიც catalog usability-ს უშლის ხელს.
- rounded/soft UI-ის გადაჭარბება, სადაც ყველაფერი 24-30px radius-ზეა.

## Design System Direction

ეს არის საწყისი მიმართულება. საბოლოო tokens implementation ცალკე ეტაპზე გაკეთდება.

### Visual Personality

- Professional
- Technical
- Catalog-first
- Clean but dense
- Reliable
- Fast to scan

UI უნდა იყოს უფრო "parts counter / catalog desk" და ნაკლებად "lifestyle accessories store".

### Color Direction

Existing system heavily relies on warm/orange accents and soft warm surfaces. Redesign-ში ეს უნდა შეიცვალოს.

Recommended direction:

- Base: clean white/off-white surfaces, graphite text, cool neutral borders.
- Primary action: precise blue or teal-blue accent.
- Secondary action: neutral outlined controls.
- Status colors: green for in stock/success, amber for warning/limited, red for unavailable/error.
- Dark mode: optional to keep, but it should not become a one-note dark-blue/slate theme.

Do not make the whole product orange, beige, tan, brown, purple, or dark-blue dominated.

### Typography

Keep `Noto Sans Georgian` for now because the product UI is Georgian and the local font files already exist.

Detailed font-size, line-height, heading, hero and spacing rules are defined in:

- `docs/typography-spacing-standard.md`

Recommended usage:

- 400 for body text.
- 500/600 for controls and metadata.
- 700/800 for page titles and product emphasis.
- No viewport-width-based font scaling.
- No negative letter spacing.
- Uppercase should be used sparingly; current UI overuses `.upper`.
- Mobile page headers should be compact enough that product/search/filter content appears quickly.

### Shape And Density

Current UI uses many `rounded-[20px]`, `rounded-[24px]`, `rounded-[28px]`, large shadows, warm gradients, and decorative surfaces.

New direction:

- Cards: 6-8px radius.
- Buttons/inputs/selects: 6-8px radius.
- Badges/chips: compact pill is acceptable only for metadata/status.
- Page sections should be full-width bands or unframed layouts, not nested floating cards.
- Use stable dimensions for product cards, toolbars, filters, counters, icon buttons, and sticky checkout bars.

### Iconography

Use one consistent icon system. The repo already uses Heroicons and custom `BaseIcon`.

Expected icons:

- Search
- Cart
- Wishlist
- Account/profile
- Filters
- Sort
- Menu/close
- Plus/minus
- Availability/status
- Delivery/payment/trust indicators

Avoid text-only controls where a familiar icon would be clearer.

## Redesign Workstreams

### 0. Audit And Planning

Status: done as initial documentation pass.

Deliverables:

- `docs/redesign-roadmap.md`
- `docs/ui-inventory.md`

### 1. Design Tokens Foundation

Primary files:

- `app/assets/css/design-system.css`
- `tailwind.config.js`
- `app/assets/css/main.css`

Tasks:

- Replace current warm/orange token palette with new FlexDrive palette.
- Define semantic tokens for background, surface, text, border, accent, status, focus, shadows.
- Reduce reliance on arbitrary hard-coded colors inside components.
- Define consistent radius/shadow/spacing conventions.
- Keep dark mode working only if it can be made coherent without slowing the redesign.

Success criteria:

- New visual identity is visible globally.
- Components can use semantic classes instead of local one-off color choices.
- No logic changes.

### 2. Shared UI Primitives

Primary files:

- `app/components/common/BaseButton.vue`
- `app/components/common/BaseInput.vue`
- `app/components/common/BaseSelect.vue`
- `app/components/common/BaseTextarea.vue`
- `app/components/common/BaseModal.vue`
- `app/components/common/AppBreadcrumbs.vue`
- `app/components/common/skeleton/*`
- `app/components/icons/*`

Tasks:

- Redesign buttons, inputs, selects, textareas, modal, breadcrumbs, skeleton states.
- Standardize loading, disabled, hover, focus, error, and success states.
- Replace overly rounded card/control styling.
- Ensure all interactive elements have clear focus and hover states.

Success criteria:

- All later page redesigns inherit the new design language.
- Forms and commerce actions look consistent before page-level work starts.

### 3. Global Shell

Primary files:

- `app/components/LAYOUTS/Header.vue`
- `app/components/LAYOUTS/HeaderSearch.vue`
- `app/components/LAYOUTS/Footer.vue`
- `app/layouts/default.vue`

Tasks:

- Redesign header as catalog/search-first navigation.
- Make search more central and efficient.
- Redesign cart/wishlist/account controls.
- Redesign mobile menu and mobile search sheet.
- Replace old `AutoMate` visual identity once brand direction is confirmed.
- Redesign footer into a practical ecommerce footer with trust/contact/help/legal structure.

Success criteria:

- The first visible UI no longer feels like the old accessories shop.
- Search, catalog, cart, wishlist, and account are obvious.
- Mobile header is compact and stable.

### 4. Catalog Experience

Primary files:

- `app/components/SmartComponents/ProductCatalog/ProductCatalog.vue`
- `app/components/SmartComponents/ProductCatalog/parts/CatalogFilters.vue`
- `app/components/SmartComponents/ProductCatalog/parts/CatalogMobileFilterSheet.vue`
- `app/components/SmartComponents/ProductCatalog/parts/CatalogMobileToolbar.vue`
- `app/components/SmartComponents/ProductCatalog/parts/CatalogToolbar.vue`
- `app/components/SmartComponents/ProductCatalog/parts/ProductGrid.vue`
- `app/components/SmartComponents/ProductCatalog/parts/ProductCard.vue`
- `app/pages/catalog/[slug].vue`
- `app/components/catalog/ProductDetailSkeleton.vue`

Tasks:

- Redesign product listing as the main business surface.
- Redesign filters visually, but keep current filter logic.
- Redesign sort/result toolbar.
- Redesign product cards for scan speed: category, title, short detail, price, old price, availability, wishlist, CTA.
- Redesign empty/error/loading states.
- Redesign product detail page: gallery, price block, availability, quantity, add-to-cart, buy-now, specs, related products.

Important constraint:

- Current catalog logic supports search, category, min/max price, sort, pagination, stock/sale/new flags from API. Do not add make/model/year logic yet.

Success criteria:

- Catalog and product detail clearly look like auto parts ecommerce.
- No query behavior or API payload changes.

### 5. Commerce Surfaces

Primary files:

- `app/pages/cart.vue`
- `app/pages/wishlist.vue`
- `app/pages/checkout/index.vue`
- `app/pages/buy-now/checkout.vue`
- `app/pages/checkout/success/[token].vue`
- `app/components/commerce/*`

Tasks:

- Redesign cart line items, summary card, empty state, sticky mobile checkout bar.
- Redesign wishlist grid/cards and unavailable item states.
- Redesign checkout form sections, payment method card, trust strip, order summary.
- Redesign success page with clear order confirmation and next actions.

Success criteria:

- Existing cart/wishlist/checkout behavior is preserved.
- Checkout feels calmer and more trustworthy.
- Mobile checkout actions remain visible without covering content.

### 6. Account And Auth

Primary files:

- `app/components/SmartComponents/Login/Login.vue`
- `app/components/SmartComponents/RegisterForm/RegisterForm.vue`
- `app/components/SmartComponents/ForgotPassword/ForgotPassword.vue`
- `app/pages/reset-password/[token].vue`
- `app/pages/resend-activation.vue`
- `app/pages/activate/[token].vue`
- `app/pages/profile/index.vue`
- `app/pages/profile/orders/index.vue`
- `app/pages/profile/orders/[token].vue`
- `app/components/profile/*`

Tasks:

- Redesign auth screens without touching validation, redirects, or reCAPTCHA.
- Redesign profile shell/sidebar/info/orders/detail.
- Make account pages visually consistent with commerce surfaces.

Success criteria:

- Auth/profile no longer use the old decorative warm-gradient style.
- Forms remain accessible and validation remains unchanged.

### 7. CMS And Content Components

Primary files:

- `app/components/ComponentsLoader.vue`
- `app/components/SmartComponents/HeroSection/HeroSection.vue`
- `app/components/SmartComponents/FeaturedProducts/FeaturedProducts.vue`
- `app/components/SmartComponents/CategoryShortcuts/*`
- `app/components/SmartComponents/HowItWorks/*`
- `app/components/SmartComponents/OrderConfidence/*`
- `app/components/SmartComponents/BlogSection/*`
- `app/components/SmartComponents/BlogList/*`
- `app/components/SmartComponents/BlogInner/*`
- `app/components/SmartComponents/Contact/*`
- `app/components/SmartComponents/Delivery/*`
- `app/components/SmartComponents/PaymentMethods/*`
- `app/components/SmartComponents/Returns/*`
- `app/components/SmartComponents/Terms/*`
- `app/components/SmartComponents/PrivacyPolicy/*`

Tasks:

- Apply `docs/typography-spacing-standard.md` before rebuilding homepage sections.
- Decide which marketing/content components still belong in the new storefront.
- Rebuild homepage components around auto parts shopping.
- Remove or replace components that only supported the old accessories positioning.
- Keep CMS component loader behavior intact.

Potential replacements:

- Old generic hero -> catalog/search/finder hero.
- Generic problem-solving section -> category shortcuts / parts categories.
- Generic how-it-works -> ordering, delivery, compatibility support.
- Generic confidence cards -> stock, warranty/returns, payment, support.

Success criteria:

- Homepage and CMS pages support the new auto parts brand.
- Components that stay are visually consistent with the new system.

## Recommended First Sprint

Start with the smallest foundation that changes the whole product without touching logic:

1. Redesign `design-system.css` tokens.
2. Redesign `BaseButton`, `BaseInput`, `BaseSelect`, `BaseModal`, `AppBreadcrumbs`.
3. Redesign `Header` and `HeaderSearch`.
4. Lock the typography and vertical spacing standard before homepage/component redesign.
5. Redesign homepage `HeroSection` and the visible first-screen CMS components.
6. Redesign `ProductCard`, `CatalogToolbar`, and `CatalogFilters`.
7. Redesign product detail page visual structure.

This order gives visible progress fast and creates reusable patterns for the rest of the redesign.

## Later, Not Now

These are intentionally out of scope for the current phase:

- Backend schema changes.
- New fitment logic.
- Make/model/year selector logic.
- OEM/part-number search logic.
- Admin data model changes.
- Checkout/payment behavior changes.
- Security/reCAPTCHA changes.
- SEO/content rewrite, except where visual layout requires placeholder text.

## QA Checklist For Each Redesign Slice

Before considering a slice done:

- Check mobile around 375px.
- Check tablet around 768px.
- Check desktop around 1024px and 1440px.
- Check wide desktop around 1536px+ where the 1440px container reaches full width.
- Verify no horizontal scroll.
- Verify no text overlap or clipped buttons.
- Verify hover and focus states.
- Verify loading/empty/error states where the component has them.
- Verify cart/wishlist/checkout/auth behavior is unchanged.
- Search for hard-coded old colors and oversized radii in touched files.
