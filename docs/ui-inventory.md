# FlexDrive UI Inventory

Last updated: 2026-04-30

## Purpose

ეს დოკუმენტი აღწერს frontend-ის ამჟამინდელ UI ზედაპირს redesign-ის დაწყებამდე.

ინვენტარი არ ნიშნავს, რომ ყველა არსებული კომპონენტი უნდა დარჩეს. პირიქით: ვიზუალური redesign-ის დროს კომპონენტები შეიძლება:

- გადაკეთდეს იგივე ფაილში;
- ჩანაცვლდეს ახალი კომპონენტით;
- საერთოდ ამოვიდეს, თუ ახალ storefront-ს აღარ სჭირდება;
- გაერთიანდეს სხვა კომპონენტთან;
- დაიშალოს უფრო სწორ shared primitives-ად.

მთავარი შეზღუდვა: ვიზუალური ცვლილებისას არ უნდა შეიცვალოს არსებული ლოგიკა და data flow.

## Stack Snapshot

Detected frontend stack:

- Nuxt 4
- Vue 3
- TypeScript
- Pinia
- Tailwind CSS
- Headless UI
- Heroicons
- VeeValidate + Zod
- VueUse
- Swiper
- vue-awesome-paginate

Global styling:

- `app/assets/css/main.css`
- `app/assets/css/design-system.css`
- `tailwind.config.js`

The app uses Georgian UI text and local `Noto Sans Georgian` fonts.

## Current Architecture

The frontend has two main page patterns.

### CMS-Driven Pages

File:

- `app/pages/[...slug].vue`

This route renders dynamic CMS components through:

- `app/components/ComponentsLoader.vue`
- `app/components/SmartComponents/*`

`ComponentsLoader` dynamically imports components by CMS component name:

`./SmartComponents/${name}/${name}.vue`

Current route/scroll note:

- `app/router.options.ts` exists and customizes Nuxt/Vue Router scroll behavior.
- Browser back/forward should use saved scroll positions.
- Same-path query changes are not globally forced to top by the router.
- New path navigation delays the top scroll briefly to avoid showing the old CMS page jumping to the top during `ComponentsLoader` content transitions.
- Component-level pagination scroll behavior in `BlogList` and `ProductCatalog` is intentionally preserved.

Redesign implication:

- CMS loader behavior should stay intact.
- Individual SmartComponents can be redesigned, replaced, or removed from page composition later.
- When changing SmartComponents, preserve their prop contract unless the backend/CMS contract is intentionally changed later.

### Dedicated App Pages

Dedicated pages handle commerce, catalog detail, auth token flows, profile, wishlist, and checkout.

These pages contain more direct business logic and should be visually redesigned carefully without changing behavior.

## Route Inventory

| Route / Purpose | File | Current role | Redesign priority | Preserve |
| --- | --- | --- | --- | --- |
| CMS catch-all / home / content pages | `app/pages/[...slug].vue` | Renders SmartComponents from backend/CMS | High for homepage components | CMS component loading and SEO behavior |
| Product detail | `app/pages/catalog/[slug].vue` | Product gallery, price, cart, buy-now, wishlist, specs, related products | Very high | Product fetch, cart/wishlist/buy-now behavior |
| Cart | `app/pages/cart.vue` | Cart list, cart summary, checkout CTA | High | Quantity/remove/cart validation behavior |
| Wishlist | `app/pages/wishlist.vue` | Wishlist list/grid, availability messaging | High | Wishlist loading/remove/cart behavior |
| Checkout | `app/pages/checkout/index.vue` | Cart checkout form and order summary | High | Checkout access middleware and submit behavior |
| Buy-now checkout | `app/pages/buy-now/checkout.vue` | Single-product checkout flow | High | Buy-now session behavior |
| Checkout success | `app/pages/checkout/success/[token].vue` | Order confirmation | Medium | Order lookup by token |
| Profile overview | `app/pages/profile/index.vue` | Profile details and editing | Medium | Auth middleware, profile update, delete flow |
| Profile orders | `app/pages/profile/orders/index.vue` | Customer order list | Medium | Auth middleware and order fetch |
| Profile order detail | `app/pages/profile/orders/[token].vue` | Customer order detail | Medium | Auth middleware and detail fetch |
| Activate account | `app/pages/activate/[token].vue` | Activation result | Low | Token activation behavior |
| Reset password | `app/pages/reset-password/[token].vue` | Password reset form | Medium | Validation and token submit behavior |
| Resend activation | `app/pages/resend-activation.vue` | Activation email resend | Low | Submit behavior |

## Layout Components

### `app/layouts/default.vue`

Current role:

- Wraps every page with `Header`, main slot, and `Footer`.

Redesign priority:

- Low direct complexity, but all shell work depends on it.

Preserve:

- Header/main/footer layout.

### `app/components/LAYOUTS/Header.vue`

Current role:

- Sticky header.
- Logo/brand.
- Menu from `useMenu`.
- Auth state buttons.
- Cart/wishlist counters.
- Mobile menu.
- Theme toggle.
- Header search trigger.

Current visual issues:

- Old `AutoMate` identity is hardcoded visually.
- Orange accent and warm header surfaces dominate.
- Many auth controls are text-heavy.
- Mobile header has several competing controls.
- Component mixes many concerns visually.

Redesign priority:

- Very high.

Preserve:

- Store usage.
- Auth state handling.
- Cart/wishlist count loading.
- Logout behavior.
- Mobile menu open/close behavior.

### `app/components/LAYOUTS/HeaderSearch.vue`

Current role:

- Search input.
- Product suggestions.
- Category quick links.
- Mobile search sheet.
- Navigation to product/category routes.

Redesign priority:

- Very high, because auto parts ecommerce depends heavily on search.

Preserve:

- Suggestion API calls.
- Debounce/loading/error behavior.
- Product/category navigation.
- Mobile sheet behavior.

### `app/components/LAYOUTS/Footer.vue`

Current role:

- Brand description.
- Footer navigation/help/legal/contact/social links from store.

Current visual/content issues:

- Fallback copy still describes auto accessories.
- Old `AutoMate` identity appears here too.
- Trust items are currently commented out.

Redesign priority:

- Medium.

Preserve:

- Footer store contract.
- Link sorting.
- External/internal link handling.

## Shared UI Primitives

These should be redesigned before major page work.

| Component | File | Current role | Redesign note |
| --- | --- | --- | --- |
| Button | `app/components/common/BaseButton.vue` | Shared button/link component with variants | Must define new button language first |
| Input | `app/components/common/BaseInput.vue` | Shared text input | Redesign with clear label/error/hint states |
| Select | `app/components/common/BaseSelect.vue` | Headless UI select/listbox | Keep accessibility, redesign panel/control |
| Textarea | `app/components/common/BaseTextarea.vue` | Shared textarea | Align with input system |
| Modal | `app/components/common/BaseModal.vue` | Shared modal shell | Reduce oversized radius, improve actions |
| Breadcrumbs | `app/components/common/AppBreadcrumbs.vue` | Breadcrumb navigation | Make denser and catalog-friendly |
| Picture | `app/components/common/BasePicture.vue` | Responsive image component | Keep behavior; visual changes usually happen in parent |
| Rich text | `app/components/common/BaseRichText.vue` | CMS rich text rendering | Later typography cleanup |
| Skeletons | `app/components/common/skeleton/*` | Loading primitives | Redesign once surfaces/radius are decided |
| Icons | `app/components/icons/*` | Custom icon set | Audit against final brand/icon system |

## Smart Components Inventory

SmartComponents are CMS-driven page sections.

| Component group | Current likely use | Redesign priority | Keep / replace direction |
| --- | --- | --- | --- |
| `HeroSection` | Homepage hero | Very high | Replace current split text/media with catalog/search-first hero |
| `FeaturedProducts` | Featured products section | High | Keep logic, redesign product carousel/grid around new `ProductCard` |
| `ProductCatalog` | Catalog listing and filters | Very high | Keep logic, redesign listing/filter UI |
| `CategoryShortcuts` | Homepage category shortcut carousel | Medium | Replaces old `ProblemSolving`; uses catalog API categories, category images, Swiper dots |
| `HowItWorks` | Ordering process explanation | Medium | Can stay if redesigned around buying parts |
| `OrderConfidence` | Trust/confidence cards | Medium | Keep concept, redesign as compact ecommerce trust strip/cards |
| `BlogSection` | Homepage blog preview | Low/medium | Keep later, redesign after catalog/commerce |
| `BlogList` | Blog listing | Low | Later |
| `BlogInner` | Blog detail | Low | Later |
| `Contact` | Contact info section | Low/medium | Redesign with footer/contact system |
| `ContactForm` | Contact form | Medium | Preserve submit/validation, redesign form |
| `Login` | Login form from CMS page | High | Preserve auth/reCAPTCHA/redirect |
| `RegisterForm` | Registration form from CMS page | High | Preserve auth/reCAPTCHA/validation |
| `ForgotPassword` | Password recovery | Medium | Preserve submit behavior |
| `Delivery` | Delivery page content | Low | Later |
| `PaymentMethods` | Payment info content | Low | Later |
| `Returns` | Returns policy content | Low | Later |
| `Terms` | Legal content | Low | Later |
| `PrivacyPolicy` | Legal content | Low | Later |

## Catalog Component Inventory

Primary files:

- `app/components/SmartComponents/ProductCatalog/ProductCatalog.vue`
- `app/components/SmartComponents/ProductCatalog/parts/CatalogFilters.vue`
- `app/components/SmartComponents/ProductCatalog/parts/CatalogMobileFilterSheet.vue`
- `app/components/SmartComponents/ProductCatalog/parts/CatalogMobileToolbar.vue`
- `app/components/SmartComponents/ProductCatalog/parts/CatalogToolbar.vue`
- `app/components/SmartComponents/ProductCatalog/parts/ProductGrid.vue`
- `app/components/SmartComponents/ProductCatalog/parts/ProductCard.vue`

Current behavior:

- Loads products and categories through `useCatalogApi`.
- Supports search query `q`.
- Supports category filter.
- Supports min/max price filter.
- Supports sort: recommended, newest, price asc/desc, plus type support for oldest/name variants.
- Syncs filters to route query.
- Supports category path `/catalog/category/:slug`.
- Supports pagination.
- Uses mobile filter sheet.

Current visual issues:

- Product cards use old warm gradient image background.
- Cards lift aggressively on hover.
- Filters are visually basic and not parts-specific.
- Toolbar is functional but not visually central.
- Empty/loading/error states are basic.
- Product cards do not yet feel like technical parts cards.

Redesign priority:

- Very high.

Preserve:

- Route query synchronization.
- API parameters.
- Pagination behavior.
- Mobile filter sheet open/apply behavior.
- Product link paths.

## Product Detail Inventory

Primary file:

- `app/pages/catalog/[slug].vue`

Current behavior:

- Fetches product detail by slug.
- Handles 404.
- Builds SEO and structured data.
- Shows gallery images and fallback media.
- Supports quantity selection.
- Supports add-to-cart.
- Supports buy-now flow.
- Supports wishlist toggle.
- Shows description/spec tabs.
- Shows related products using `ProductCard`.

Current visual issues:

- Large page file mixes many visual blocks.
- Product info area needs stronger auto-parts buying hierarchy.
- Quantity/cart/buy-now controls should become more compact and stable.
- Specs area should feel more like technical details.

Redesign priority:

- Very high, immediately after product card/catalog primitives.

Preserve:

- All product fetch/cart/buy-now/wishlist logic.
- Structured data and SEO behavior.
- Quantity constraints.

## Commerce Component Inventory

Primary files:

- `app/components/commerce/CartEmptyState.vue`
- `app/components/commerce/CartLineItem.vue`
- `app/components/commerce/CartPageSkeleton.vue`
- `app/components/commerce/CartSummaryCard.vue`
- `app/components/commerce/CheckoutFormSections.vue`
- `app/components/commerce/CheckoutPageSkeleton.vue`
- `app/components/commerce/CheckoutPaymentMethodCard.vue`
- `app/components/commerce/CheckoutSectionHeader.vue`
- `app/components/commerce/CheckoutSuccessSkeleton.vue`
- `app/components/commerce/CheckoutSuccessSummary.vue`
- `app/components/commerce/CheckoutSummaryCard.vue`
- `app/components/commerce/CheckoutTrustStrip.vue`
- `app/components/commerce/WishlistProductCard.vue`
- `app/components/commerce/WishlistToggleButton.vue`

Current behavior:

- Cart items show availability/price-change/quantity states.
- Checkout has form sections, payment method, summary, trust strip.
- Wishlist has reusable product card and toggle button.

Current visual issues:

- Many large rounded surfaces and heavy shadows.
- Cart/wishlist product cards should align with the redesigned catalog card.
- Checkout cards should become calmer, denser, and more operational.

Redesign priority:

- High after catalog/product detail.

Preserve:

- Quantity controls.
- Availability warnings.
- Checkout validation display.
- Payment method selection behavior.
- Wishlist toggle semantics.

## Profile Component Inventory

Primary files:

- `app/components/profile/ProfileShell.vue`
- `app/components/profile/ProfileSidebar.vue`
- `app/components/profile/ProfileInfoSection.vue`
- `app/components/profile/ProfileInfoSkeleton.vue`
- `app/components/profile/ProfileOrdersList.vue`
- `app/components/profile/ProfileOrdersSkeleton.vue`
- `app/components/profile/ProfileOrderDetail.vue`
- `app/components/profile/ProfileOrderDetailSkeleton.vue`
- `app/components/profile/ProfileStatusBadge.vue`

Current role:

- Authenticated account shell.
- Profile information.
- Order list/detail.
- Status badge.

Redesign priority:

- Medium.

Preserve:

- Auth middleware.
- API calls.
- Edit/delete/order navigation behavior.

## Auth Component Inventory

Primary files:

- `app/components/SmartComponents/Login/Login.vue`
- `app/components/SmartComponents/RegisterForm/RegisterForm.vue`
- `app/components/SmartComponents/ForgotPassword/ForgotPassword.vue`
- `app/pages/reset-password/[token].vue`
- `app/pages/resend-activation.vue`
- `app/pages/activate/[token].vue`

Current behavior:

- VeeValidate/Zod validation.
- Backend field errors.
- reCAPTCHA execution for login/register.
- Redirect logic.
- Success modal for registration.

Current visual issues:

- Decorative gradient/orb-style backgrounds.
- Large rounded cards.
- Old brand helper logic such as `splitAutoMateTitleParts`.

Redesign priority:

- High for login/register, medium for recovery/token pages.

Preserve:

- Validation schemas.
- reCAPTCHA calls.
- Redirect logic.
- Backend error handling.

## Current Design System Observations

Files:

- `app/assets/css/design-system.css`
- `tailwind.config.js`
- `app/assets/css/main.css`

Observed current tokens:

- Light theme is white/warm with orange accent `#ff6b35`.
- Header uses warm surfaces.
- Dark theme is mostly dark blue/slate.
- Tailwind maps semantic color names to CSS variables.
- `Noto Sans Georgian` is configured as the main font.

Current visual patterns to remove or reduce:

- Warm orange gradients.
- Decorative radial gradients/orbs.
- Very large border radii.
- Heavy floating-card shadows.
- Excessive uppercase.
- Hard-coded arbitrary hex colors inside components.
- Repeated one-off card styles instead of reusable primitives.

Useful patterns to keep:

- Semantic CSS variable mapping.
- Focus-visible global styles.
- Reduced-motion media query.
- Local Georgian font setup.
- `BasePicture` image abstraction.
- Shared button/input/select abstractions.

## Old Accessories Context Found In Code

These are not necessarily part of the visual-only sprint, but they confirm old project leftovers.

Examples:

- `nuxt.config.ts` fallback `siteName`: `Auto Accessories Store`
- `nuxt.config.ts` fallback SEO title/description mentions auto accessories.
- `app/composables/useSeoDefaults.ts` fallback description mentions accessories.
- `app/components/LAYOUTS/Footer.vue` fallback copy mentions accessories.
- Blog fallback copy mentions auto accessories.
- Header/footer hardcode `AutoMate` visual brand.

Recommendation:

- Do not mix this cleanup into the first visual token/component pass unless the touched UI requires it.
- Brand and copy cleanup should be a planned content/identity pass after initial design direction is approved.

## Suggested Redesign Priority Order

1. Tokens and primitives.
2. Header and search.
3. Product card, catalog toolbar, catalog filters.
4. Product detail page.
5. Cart and checkout.
6. Wishlist.
7. Auth forms.
8. Profile.
9. Homepage/CMS marketing components.
10. Blog/legal/contact/content pages.

Reasoning:

- Tokens/primitives reduce repeated work.
- Header/search and catalog define the new product identity fastest.
- Product detail and checkout are the highest business-impact flows.
- Lower-risk content pages can wait until the system is stable.

## Visual-Only Guardrails

When editing any file from this inventory:

- Keep existing props and emits unless a visual-only replacement can preserve them exactly.
- Keep store calls and composable calls untouched.
- Keep route paths and query parameter names untouched.
- Keep validation schema usage untouched.
- Keep API endpoint usage untouched.
- Keep middleware untouched.
- Keep reCAPTCHA execution untouched.
- If a component is removed visually, confirm that its behavior is not needed or that the replacement emits the same events.
