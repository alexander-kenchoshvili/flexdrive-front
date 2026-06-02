# Project Instructions

## Product Context

This repository is the frontend for FlexDrive, an online auto parts store.

Important background:

- The project started from a copied frontend of a previous online auto accessories store.
- Most existing flows, components, and layouts still reflect the old auto accessories project.
- The current business goal is to turn this into a purpose-built auto parts ecommerce experience.
- Existing core ecommerce logic should generally be preserved unless a requested change requires otherwise.

Core flows that already exist and should be treated as valuable baseline behavior:

- Authentication and registration
- Customer profile / account cabinet
- Product browsing
- Cart
- Wishlist
- Checkout / purchase flow
- Local admin panel integration
- Security-related integrations such as reCAPTCHA, which have already been updated with new keys

Do not remove or rewrite these flows casually during redesign work. Preserve behavior first, then change presentation and interaction patterns deliberately.

## Redesign Goal

The primary active initiative is a full redesign of the site.

This is not a small restyle. The whole visual system should change from the old auto accessories shop identity into a new auto parts store identity:

- Replace the old design system.
- Redesign every shared UI component over time.
- Replace old page layouts and section patterns.
- Make the storefront feel like an auto parts catalog and ecommerce product finder, not a generic accessories shop.
- Improve product discovery, filtering, compatibility cues, and comparison-oriented shopping where relevant.

Current redesign phase:

- Focus only on visual redesign and the new design system.
- Do not change business logic, API contracts, auth behavior, cart behavior, wishlist behavior, checkout behavior, profile behavior, admin behavior, or security integrations unless the user explicitly asks for it.
- Existing components may be redesigned in place, replaced with new components, or removed if the new visual system no longer needs them.
- When replacing/removing UI components, preserve the user-facing behavior and data flow they currently support.
- Logic and new auto-parts-specific functionality will be considered later, after the visual direction and design system are established.
- The new design system should use the new FlexDrive logo as brand input, but the full UI must not be decided only by logo colors.
- All colors, tones, contrast, focus states, and reusable component states must satisfy accessibility/readability expectations for both light mode and dark mode.
- Mobile ecommerce usability is a critical requirement. On mobile, users must be able to understand products, search/filter, add to cart, use wishlist, and complete checkout with minimal friction.

When editing UI, assume the desired direction is:

- Practical, dense, scannable ecommerce UI.
- Clear hierarchy for categories, brands, compatibility, price, availability, and delivery information.
- Strong product-card readability.
- Fast navigation between catalog, search, product details, cart, wishlist, account, and checkout.
- Mobile-first behavior that still feels complete on desktop.

Avoid keeping old styling just because it is already present. If a component is touched for redesign, move it toward the new system.

## Frontend Working Rules

- Read existing component structure before changing UI.
- Prefer established Nuxt/Vue patterns already used in this repository.
- Keep changes scoped to the requested feature, page, or component.
- Preserve working business logic unless explicitly asked to alter it.
- Do not change `.env` values, reCAPTCHA keys, API keys, payment credentials, or other secrets.
- Do not hard-code backend URLs or secrets into components.
- Keep Georgian language UX copy where the existing product uses Georgian, unless the user asks otherwise.
- Check responsive layout for both mobile and desktop when making visual changes.
- Avoid UI text overlap, clipped labels, unstable cards, or layout shifts.
- Do not start temporary frontend/backend dev servers unless the user explicitly asks for a server/browser check.
- Do not run Playwright or other browser automation unless the user explicitly asks for it. For routine visual/UI edits, rely on code inspection and normal build/type/test checks unless requested otherwise.
- When running `npm run build`, use a long timeout from the first attempt, preferably at least 600000ms, because Nuxt production builds in this project often exceed two minutes on Windows. Do not report a short timeout as an intermediate user-facing issue; report only the final build result or a real actionable failure.
- The paired backend at `C:\Users\kench\Desktop\flexdriveback` uses its local virtual environment. Run Django/backend commands with `C:\Users\kench\Desktop\flexdriveback\venv\Scripts\python.exe` from the backend repository instead of system `python`.

## Context7 Usage Rules

Use Context7 as the default documentation source when a task depends on current or version-sensitive behavior from external frontend libraries, frameworks, or tooling.

- Use Context7 before making or recommending changes that rely on Nuxt, Vue, Pinia, Tailwind, Vite, Playwright, package APIs, framework configuration, lifecycle behavior, SSR behavior, routing, plugins, composables, or other third-party library details that may differ by version.
- Resolve the library ID first, then query the selected documentation with a narrow, task-specific question.
- Prefer official or high-reputation documentation results. If multiple libraries match, choose the one that matches the repository dependency and implementation context.
- Read the local codebase first when the question is about existing project behavior. Use Context7 to verify external API usage, not to override established project patterns without reason.
- Do not use Context7 as a substitute for inspecting backend contracts, local API shapes, environment configuration, or existing business logic. For API-bound features, inspect the frontend and backend repositories directly.
- Do not send secrets, tokens, private API keys, customer data, or proprietary project data into Context7 queries.
- If Context7 documentation conflicts with the repository's installed version or current implementation, treat the local dependency/version and working code as the source of truth, then adapt the documented pattern carefully.
- When Context7 informs a non-trivial implementation decision, briefly mention the relevant documentation-backed reason in the final response.
- If Context7 cannot find a reliable answer, continue with local inspection and clearly state any remaining uncertainty instead of guessing.

## Playwright Usage Rules

Playwright MCP is available for browser-based checks, but in this project it must be used only when the user explicitly asks for Playwright/browser verification.

- User preference override: do not run Playwright by your own initiative. Use it only when the user explicitly asks for Playwright/browser verification.
- Use Playwright after visual, layout, navigation, interaction, form, catalog, cart, wishlist, checkout, account, or responsive changes when a browser check can catch regressions that static code inspection cannot.
- Start or reuse the local frontend dev server before browser checks when the page needs Nuxt runtime behavior. If the app requires the backend for the checked flow, verify the backend state instead of assuming mock data.
- Check the touched UI at mobile and desktop sizes. Prefer at least a narrow mobile viewport around 375px and a desktop viewport around 1440px; add tablet or very narrow checks when the changed layout is likely to break there.
- Verify the practical user experience: visible content, readable Georgian copy, no overlapping or clipped text, no unintended horizontal scroll, stable product cards, usable filters, tappable controls, visible focus/hover states, and expected loading/empty/error states where reachable.
- Keep Playwright checks non-destructive unless the user explicitly asks for a flow that changes data. Do not place real orders, modify real account data, submit payment details, or use real credentials unless the user has provided a safe test path.
- Do not expose secrets, tokens, cookies, private customer data, or credentials in Playwright logs, screenshots, or final responses.
- For auth, checkout, admin, or other sensitive flows, prefer test accounts and reversible actions. Stop and ask if a check would require unsafe data mutation.
- If Playwright exposes a UI regression in a touched area, fix it and rerun the relevant viewport or interaction check before finalizing.
- Do not treat Playwright as a replacement for build, type, or unit checks. Use it as browser verification alongside the repository's normal validation commands when those are relevant.
- In the final response, mention the key Playwright viewports or flows checked. If Playwright could not be run, state the reason and the remaining manual verification risk.

## Design System Direction

When creating or refactoring UI, build toward a coherent new system:

- Use reusable tokens and shared classes/components where the codebase supports it.
- Prefer clear neutral surfaces, high contrast text, and restrained accent colors suitable for automotive parts commerce.
- Use icons for common actions such as search, cart, wishlist, account, filters, sorting, menu, close, plus, minus, and navigation.
- Product cards should make key buying information visible without forcing the user to open each product.
- Filters should be treated as a first-class catalog feature, not a secondary sidebar afterthought.
- Forms should be simple, predictable, and clearly validated.
- Admin-facing UI may be denser and more operational than storefront UI.

Avoid decorative one-note palettes, generic landing-page sections, and visual patterns that do not help users find and buy parts.

## Auto Parts Domain Notes

Future product discovery may need to support auto-parts-specific concepts such as:

- Make / model / year / engine compatibility
- OEM numbers
- Part numbers / SKUs
- Brand / manufacturer
- Category and subcategory hierarchy
- In-stock status
- Condition, side, fitment, and placement where relevant
- Price ranges and sorting

Do not invent backend contracts for these without checking the backend first. If the UI needs these fields, inspect the API shape or coordinate with the backend repository.

## Repository Relationship

The paired backend repository is expected at:

`C:\Users\kench\Desktop\flexdriveback`

Frontend and backend are part of the same product effort. When a feature crosses the API boundary, inspect both sides before making assumptions.

## Session Memory

This file exists so the project context does not need to be re-explained in every Codex session. Treat it as the durable project brief for future work in this frontend repository.

## Current Redesign State - 2026-05-01

- Homepage redesign is in progress. Preserve existing ecommerce/auth/cart/checkout logic; continue replacing homepage visuals component by component.
- `ProblemSolving` was replaced by `CategoryShortcuts`. It now renders catalog categories as image cards/slider with dots, category images coming from admin/backend category image fields.
- `ValueProposition` was added after `CategoryShortcuts` and before `OrderConfidence`. Frontend files:
  - `app/components/SmartComponents/ValueProposition/ValueProposition.vue`
  - `app/components/SmartComponents/ValueProposition/parts/ValuePropositionCard.vue`
  It renders 3 premium image cards from CMS content items. Card images are uploaded from admin.
- `OrderConfidence` has been redesigned as a checkout confidence rail using frontend Heroicons and step numbers. It no longer visually uses backend `icon_svg`; backend still sends it for compatibility. Frontend files:
  - `app/components/SmartComponents/OrderConfidence/OrderConfidence.vue`
  - `app/components/SmartComponents/OrderConfidence/parts/OrderConfidenceCard.vue`
- `splitAutoMateTitleParts` in `app/composables/helpers.ts` now supports both `Auto[[Mate]]` and `Flex[[Drive]]` bracket accent syntax, so `Flex[[Drive]]` renders like the upper homepage components.
- `app/router.options.ts` exists to prevent visible pre-navigation scroll jumps during route transitions and browser back navigation.
- Staging DB was updated for the new homepage data as of 2026-05-01:
  - `ValueProposition` component/cards were seeded.
  - `OrderConfidence` cards now use: `შეკვეთა მარტივად იწყება`, `რეგისტრაციის გარეშე`, `გადახდა შენზეა მორგებული`, `მიწოდება წინასწარ გასაგებია`.
  - `OrderConfidence` title is `შეკვეთა Flex[[Drive]]-ზე მარტივად და გარკვევით`.
  If staging UI still shows old content, suspect API/browser cache before changing code.
- `HowItWorks` and `BlogSection` have also been redesigned into the new FlexDrive visual direction. The homepage section pass is now considered substantially complete unless a later QA/design review finds specific issues.
- Product detail page redesign is no longer the next target; it was redesigned in the 2026-05-12 pass noted below.

## Current Catalog Redesign State - 2026-05-08

- Catalog listing/filter UI was redesigned and stabilized around the new FlexDrive auto-parts direction. Main frontend files:
  - `app/components/SmartComponents/ProductCatalog/ProductCatalog.vue`
  - `app/components/SmartComponents/ProductCatalog/parts/CatalogFilters.vue`
  - `app/components/SmartComponents/ProductCatalog/parts/CatalogMobileFilterSheet.vue`
  - `app/components/SmartComponents/ProductCatalog/parts/CatalogToolbar.vue`
  - `app/components/SmartComponents/ProductCatalog/parts/ProductGrid.vue`
  - `app/components/SmartComponents/ProductCatalog/parts/ProductCard.vue`
  - `app/components/common/BaseSelect.vue`
  - `app/pages/catalog/[slug].vue`
- Vehicle filter behavior is intentionally changed:
  - Make is the first required vehicle step.
  - Year can be selected after make; model is no longer required before year.
  - Engine stays dependent on model + year and is disabled when the backend has no engine options for that model/year.
  - The local vehicle reset control in the sidebar is icon-only with `aria-label`; the main global clear button remains visible as text.
- Catalog filter stability decisions:
  - Desktop sidebar currently follows the page naturally; do not re-add a separate full-sidebar scroll panel unless explicitly requested.
  - Category list keeps its own internal scroll area.
  - Filtering does not rely on ad hoc scroll restoration. User-applied filters call a small smooth scroll to the product results start when the results are not already comfortably visible.
  - `app/router.options.ts` keeps browser saved positions and prevents automatic top-scroll when moving between `/catalog` and `/catalog/category/:slug`.
  - Product refresh uses a lightweight `ProductGrid` skeleton overlay so the right grid does not collapse during filter refresh.
  - `CatalogToolbar` keeps a stable active-filter row height and shows the empty helper copy: `აირჩიე ფილტრები შედეგების დასაზუსტებლად`.
- Filter logic intentionally simplified:
  - The `ახალი` quick filter was removed from desktop/mobile filters and query construction.
  - Product cards still show the `ახალი` product badge when `product.is_new` is true.
  - Brand, placement, side, stock, sale, price, category, vehicle and sort filters remain.
- Product card compatibility copy is frontend-driven from the catalog API `compatibility` payload. Current behavior should stay conservative:
  - universal fitment shows universal compatibility copy.
  - engine match shows engine-specific copy only when an engine is selected.
  - otherwise the card can fall back to selected vehicle filter copy.
  - Do not expand compatibility copy to price/stock/brand filters; those are narrowing filters, not fitment evidence.
- Product detail out-of-stock behavior was cleaned up:
  - if a product is out of stock, only the disabled primary `მარაგში არ არის` action remains.
  - duplicate disabled add-to-cart buttons are hidden on desktop and mobile sticky actions.
- `BaseSelect` dark-mode dropdown scrollbar was restyled to match the design system.
- Backend/staging note for catalog filters:
  - Backend repo is `C:\Users\kench\Desktop\flexdriveback`.
  - Catalog filter schema/data exists through backend catalog vehicle/fitment models and `seed_catalog_filters`.
  - On 2026-05-08 staging Neon/Postgres was checked: no pending migrations, then `python manage.py seed_catalog_filters --product-limit 0` was run.
  - Staging counts after seed: 300 products, 10 brands, 8 vehicle makes, 22 vehicle models, 43 engines, 285 fitments.
  - Do not run `seed_catalog`, `seed_staging_demo`, or `--reset-fitments` on staging unless the user explicitly asks; those touch broader demo data or can reset fitments.

## Current Product Detail Redesign State - 2026-05-12

- Product detail page has been redesigned in `app/pages/catalog/[slug].vue` toward the new FlexDrive auto-parts ecommerce direction while preserving product loading, cart, wishlist, buy-now, quantity, stock, related products, and existing API/data flow.
- The page now uses the redesigned catalog/product-card visual language: practical surfaced panels, restrained borders, clear price hierarchy, product media gallery, breadcrumb row, product metadata chips, quantity controls, delivery/returns cards, description/spec tabs, related products, and a mobile sticky purchase bar.
- Mobile product detail spacing was tuned after visual QA:
  - main product detail section uses `pt-2 pb-12 sm:pt-4` so bottom spacing is consistent across breakpoints.
  - media/details grid uses mobile `!mt-2 gap-4`, then `sm:!mt-4 sm:gap-8`, with `min-[1100px]:gap-10`.
  - mobile sticky purchase action button text is `12px` below `640px`, then returns to `text-sm` at `sm` and above.
- Avoid reintroducing inline spacing styles on the product detail page. Keep spacing in Tailwind utilities unless a dynamic runtime value is genuinely required.
- Mobile sticky purchase bar decisions:
  - buttons keep zero external padding via `!p-0` because inner sizing already provides enough tap area.
  - success/add-to-cart feedback should not appear inside the fixed bar if it breaks the layout; prefer the main purchase panel or a compact non-disruptive pattern.
  - bottom spacing is intentionally no longer oversized just to compensate for the fixed bar; verify actual overlap before increasing page padding.
- Header/search behavior from the same product-detail mobile pass:
  - below `768px`, use a compact search icon in the top header row.
  - from `768px` and up, show the search input in the first header row and hide the separate search icon.
  - do not move account or other primary actions into the hamburger just to make search fit unless explicitly requested.

## Current Commerce Mobile Redesign State - 2026-05-12

- Cart, wishlist, and checkout mobile spacing were tightened after product detail. Keep the direction mobile-first and compact; avoid restoring large vertical whitespace below `1024px` unless there is a specific overlap or readability reason.
- Cart page files touched:
  - `app/pages/cart.vue`
  - `app/components/commerce/CartLineItem.vue`
  Cart page spacing was reduced below `1024px`. Cart line item mobile layout was adjusted so the quantity/remove controls use the empty space under the product image more naturally. The cart footer/mobile fixed summary was intentionally kept visually unchanged where the user said it already worked.
- Wishlist page files touched:
  - `app/pages/wishlist.vue`
  - `app/components/commerce/WishlistProductCard.vue`
  - `app/components/profile/ProfileShell.vue`
  - `app/components/profile/ProfileSidebar.vue`
  Wishlist now uses a `compact-mobile` mode on `ProfileShell/ProfileSidebar`, so wishlist can have reduced mobile padding/gaps without affecting other profile pages. Product cards, loading skeleton, empty state, status chips, info blocks, and sidebar spacing are compact on mobile and return to previous spacing at `sm`/larger breakpoints.
- Checkout page files touched:
  - `app/pages/checkout/index.vue`
  - `app/pages/buy-now/checkout.vue`
  - `app/components/commerce/CheckoutFormSections.vue`
  - `app/components/commerce/CheckoutSectionHeader.vue`
  - `app/components/commerce/CheckoutPaymentMethodCard.vue`
  - `app/components/commerce/CheckoutSummaryCard.vue`
  - `app/components/commerce/CheckoutPageSkeleton.vue`
  Checkout and buy-now checkout now share compact mobile spacing for page padding, section gaps, form section padding, section headers, payment method cards, summary card, loading skeleton, and bottom fixed submit bar. Business logic, validation, reCAPTCHA, cart refresh, buy-now session handling, and API payloads were not changed.
- Checkout overflow root cause and fix:
  - The mobile checkout breakage was caused by `CheckoutSummaryCard` and its grid wrapper, not the form fields.
  - CSS grid children default to `min-width: auto`; the summary card's content could force the grid wider than the viewport.
  - Keep `min-w-0`, `max-w-full`, `w-full`, `overflow-hidden`, `break-words`, and `whitespace-normal` guards on the summary wrapper/card/content. Do not remove these when editing the checkout summary.
  - The checkout summary's action buttons are hidden below `lg` because the mobile fixed bottom bar already provides the submit/confirm action. Desktop still shows summary actions.
- Mobile checkout bottom spacing was reduced from the large previous value to `pb-16` on checkout and buy-now checkout, while `md:pb-36` and `lg:pb-12` remain for larger breakpoints.
- Header narrow-mobile adjustment:
  - `app/components/LAYOUTS/Header.vue` was tuned at very narrow widths (`max-width: 399px` and `max-width: 359px`) because long checkout pages with a vertical scrollbar left less usable width and caused the fixed-size header logo/actions to crowd.
  - Header logo/icon sizes and gaps are slightly smaller only on very narrow screens. Do not revert this unless a replacement mobile header layout is implemented.

## Current Profile Mobile Redesign State - 2026-05-13

- Profile mobile UX was tightened after cart/wishlist/checkout. Main files touched:
  - `app/components/profile/ProfileShell.vue`
  - `app/components/profile/ProfileSidebar.vue`
  - `app/components/profile/ProfileInfoSection.vue`
  - `app/components/profile/ProfileInfoSkeleton.vue`
  - `app/components/profile/ProfileOrdersList.vue`
  - `app/components/profile/ProfileOrdersSkeleton.vue`
  - `app/components/profile/ProfileOrderDetail.vue`
  - `app/components/profile/ProfileOrderDetailSkeleton.vue`
  - `app/pages/profile/index.vue`
  - `app/pages/profile/orders/index.vue`
  - `app/pages/profile/orders/[token].vue`
- Profile navigation behavior:
  - On mobile, `ProfileSidebar` uses a compact account row plus three tab-like buttons: account, orders, wishlist.
  - Desktop/tablet behavior remains the existing sidebar style via `sm:` and larger Tailwind utilities.
  - Profile subpages now pass page-specific titles (`ანგარიშის ინფორმაცია`, `ჩემი შეკვეთები`, `შეკვეთის დეტალი`) so route changes are visually obvious on mobile.
  - Navigation links set `aria-current="page"` when active.
- Mobile spacing:
  - Profile shell, profile info, edit/delete account sections, orders list, order detail, and related skeleton states use tighter mobile padding/gaps and return to larger spacing at `sm` and above.
  - Keep this work Tailwind-only; no custom CSS was added for these profile fixes.
- Fixed profile/order detail mobile defects:
  - Georgian tab labels were clipping vertically because `leading-none` plus `truncate` was too tight. Mobile tab labels now use `leading-4`.
  - Order tracking status names are `12px` on mobile (`text-xs`) and return to `14px` at `sm`.
  - The active tracking-step description now spans the available card width instead of being constrained beside the icon column.
  - Order detail contact/products sections received `min-w-0`, `max-w-full`, `break-words`, and `minmax(0,360px)` grid guards so long emails, names, product titles, prices, or address text do not force horizontal overflow on narrow screens.
- Verification:
  - `npm run build` completed successfully after the profile mobile pass. In sandbox it hit a Windows `readlink C:\Users\kench` permission error during Nitro packaging, then succeeded when rerun with approved escalation. The only remaining message was the existing Vue package trailing-slash export deprecation warning.
- Likely next redesign target: authentication and registration pages/forms, keeping auth logic, reCAPTCHA, validation, redirects, and API contracts unchanged while updating mobile spacing, visual hierarchy, and new FlexDrive design-system consistency.

## Current Auth Redesign State - 2026-05-13

- Authentication flow redesign is now substantially complete in the new FlexDrive design direction. Preserve auth behavior, API contracts, reCAPTCHA actions, validation schemas, redirects, activation tokens, and password reset token handling unless explicitly requested.
- Main frontend files touched:
  - `app/components/SmartComponents/Login/Login.vue`
  - `app/components/SmartComponents/RegisterForm/RegisterForm.vue`
  - `app/components/SmartComponents/ForgotPassword/ForgotPassword.vue`
  - `app/pages/reset-password/[token].vue`
  - `app/pages/activate/[token].vue`
  - `app/pages/resend-activation.vue`
  - `app/components/common/BaseButton.vue`
- Login/register/forgot/reset pages now share the same practical auth layout language:
  - `container-fluid` based layout.
  - token-driven background gradient using design-system CSS variables.
  - surfaced form cards with restrained borders/shadows.
  - compact mobile spacing and wider desktop two-column compositions where useful.
  - no decorative blobs/orbs or old AutoMate visual treatment.
- Login and register still use CMS/backend content for their hero copy where applicable. Backend CMS content migrations were created/run during this pass for the refreshed login/register content locally and on staging.
- Follow-up auth content polish on 2026-05-14:
  - `app/components/LAYOUTS/HeaderAccountDialog.vue` guest account prompt copy was tightened to: `შედი ანგარიშში` / `მართე შეკვეთები, სურვილების სია და კალათა ერთი პროფილიდან.`
  - `app/components/SmartComponents/Login/Login.vue` form helper copy was tightened to: `შეიყვანე ელ.ფოსტა და პაროლი ანგარიშში შესასვლელად.`
  - Backend migration `pages/migrations/0049_update_auth_card_copy.py` was added in the paired backend repo and run on both development and staging DBs.
  - Login CMS cards now use:
    - `შეკვეთების კონტროლი` - `ნახე მიმდინარე სტატუსები და წინა შეკვეთები ერთ ადგილას.`
    - `რჩეულები და კალათა` - `ნახე შენახული ნაწილები და გააგრძელე შეკვეთა იქიდან, სადაც გაჩერდი.`
  - Register CMS cards now use:
    - `შენახული მონაცემები` - `შეკვეთის გაფორმებისას საკონტაქტო და მიწოდების ინფორმაცია ავტომატურად შეივსება.`
    - `შეკვეთების ისტორია` - `ყველა შეკვეთა და მიმდინარე სტატუსი შენს პროფილში დაგხვდება.`
    - `სურვილების სია` - `შეინახე საჭირო ნაწილები და ყიდვამდე მარტივად დაუბრუნდი.`
  - Local and staging DB content was verified after the migration. If staging UI still shows old copy, suspect API/browser cache before changing code.
- `RegisterForm` benefit cards were tuned after visual review:
  - cards are single-column below `1240px` and become three columns at `1240px+`.
  - number and title are vertically centered together.
  - description text is a separate row starting from the card's left edge, not indented under the number.
- The same info-card alignment pattern was applied to login, forgot-password, and reset-password cards: number/title centered together, body copy below from the card edge.
- Auth headings now use the existing `upper` class on the redesigned auth pages and modal/form headings where relevant.
- `BaseButton` now includes `upper` in its base classes so all `BaseButton` text uses the project uppercase/case font treatment by default.
- Auth submit buttons that were raw `<button>` elements were converted to `BaseButton` on login, register, forgot-password, reset-password, and resend-activation. Loading text behavior was intentionally preserved by using `:disabled="loading"` and keeping the existing conditional slot text instead of `BaseButton`'s `loading` prop, which would hide the label and show only the spinner.
- Auth state decisions:
  - Login shows inline errors only; success redirects immediately, so no success state/modal is needed.
  - Register shows a success modal and inline error.
  - Forgot password shows a success modal and inline error.
  - Reset password shows a success modal and inline error, then returns to login on modal close.
  - Activate page shows loading, success, and error states inline; error state links to resend activation.
  - Resend activation shows success/error inline; modal is intentionally not used there.
- Known current behavior to preserve unless requested:
  - Register backend field-error mapping was not expanded during this pass; broad registration errors still use the current generic/detail handling.
  - Empty states are not needed for these auth forms; missing optional CMS info cards simply render nothing.
- Verification:
  - `npm run build` was run successfully during the main auth-page pass after forgot/reset/activate/resend changes.
  - Later typography/button-only tweaks were checked with `git diff --check`; no full build was run for those small class/component swaps.
- Static/legal/support pages became the next redesign/content target after auth. Preserve existing page/component routing and CMS-driven data flow; the route still receives backend components and renders them through the shared legal layout described below.

## Current Social Auth State - 2026-05-16

- Google sign-in/registration is implemented and considered complete for the current staging setup.
- The first Google implementation used Google Identity Services/FedCM-style prompt behavior, but it was replaced because the prompt could be inconsistent across devices/accounts.
- The current Google flow uses standard OAuth redirect:
  - frontend login/register Google button navigates to `/auth/google/start`;
  - Nuxt server routes proxy `/auth/google/start` and `/auth/google/callback` to the backend Google OAuth start/callback endpoints;
  - Google receives the public redirect URI `https://flexdrive-front.vercel.app/auth/google/callback`;
  - backend exchanges the authorization code, reuses the existing Google auth serializer/user creation path, sets auth cookies, and redirects the user back to the intended frontend path.
- Frontend files involved:
  - `app/components/common/GoogleAuthButton.vue`
  - `server/routes/auth/google/start.get.ts`
  - `server/routes/auth/google/callback.get.ts`
  - login/register pages render the Google button below the primary submit button.
- Backend files involved in the paired backend repo:
  - `accounts/google_auth.py`
  - `accounts/views.py`
  - `accounts/urls.py`
  - `accounts/tests.py`
  - `config/settings.py`
- Required staging configuration:
  - Google Console authorized redirect URI: `https://flexdrive-front.vercel.app/auth/google/callback`
  - Render backend env: `GOOGLE_OAUTH_REDIRECT_URI=https://flexdrive-front.vercel.app/auth/google/callback`
  - Google client id and secret stay only in backend/runtime configuration; do not hard-code them in frontend files.
- No database migration is required for the Google OAuth redirect flow itself.
- Facebook sign-in/registration implementation was started in the same redirect-based pattern:
  - backend adds `FacebookAccount`, Facebook OAuth helper, start/callback endpoints, admin visibility, and account tests;
  - frontend adds a shared `SocialAuthButton`, `FacebookAuthButton`, `/auth/facebook/start`, `/auth/facebook/callback`, and login/register placement next to Google;
  - Facebook requires a database migration: `accounts.0009_facebookaccount`.
- Required Facebook staging configuration before live testing:
  - Meta app credentials in Render backend env: `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`;
  - Render backend env: `FACEBOOK_OAUTH_REDIRECT_URI=https://flexdrive-front.vercel.app/auth/facebook/callback`;
  - Meta/Facebook Login valid redirect URI: `https://flexdrive-front.vercel.app/auth/facebook/callback`.
- Facebook login cannot complete for accounts where Facebook does not return an email address; the backend intentionally rejects those because FlexDrive users require email.
- Next auth step: finish Meta console setup with the user, run/apply `accounts.0009_facebookaccount` on staging, deploy frontend/backend, and test Facebook login/register end to end.
- Production Facebook launch checklist:
  - add the production callback in Meta/Facebook Login valid redirect URIs: `https://<production-domain>/auth/facebook/callback`;
  - set production backend env `FACEBOOK_OAUTH_REDIRECT_URI=https://<production-domain>/auth/facebook/callback`;
  - add production app domain in Meta Basic Settings without protocol;
  - fill production privacy policy, terms, category, app icon `1024x1024`, and user data deletion requirement;
  - reset/rotate `FACEBOOK_APP_SECRET` if it has been exposed in screenshots or logs, then update the backend env and redeploy;
  - complete Meta Publish/Live/App Review requirements for public users, especially access to `email` and `public_profile`, before expecting non-tester accounts to log in;
  - keep staging tester-role testing separate from production public access.

## Current Static/Legal Pages State - 2026-05-15

- Static/legal page visual redesign is substantially complete for `/terms`, `/returns`, `/payment-methods`, `/privacy-policy`, and `/delivery`.
- Shared frontend legal page system:
  - `app/components/common/LegalPageLayout.vue`
  - `app/components/common/LegalSmartPage.vue`
  - `app/components/common/LegalSectionIcon.vue`
  - `app/components/common/LegalOverviewCard.vue`
  - `app/components/common/LegalDetailPanel.vue`
  - `app/composables/useLegalPageSections.ts`
- SmartComponents for `Terms`, `Delivery`, `Returns`, `PrivacyPolicy`, and `PaymentMethods` are thin wrappers around `LegalSmartPage`.
- These pages use frontend Heroicons through `LegalSectionIcon`; backend `icon_svg` is intentionally ignored visually and new content migrations set `icon_svg` to `None`.
- The overview cards smooth-scroll to their matching sections. Keep the native smooth-scroll behavior when editing these components.
- Georgian long-word overflow was fixed in legal cards/panels by widening the left column and using normal `break-words`; do not reintroduce aggressive `overflow-wrap:anywhere` unless there is a real narrow-screen issue.
- Backend CMS/content migrations created and applied locally and on staging:
  - `0050` through `0055` refresh and refine `/terms`.
  - `0056` through `0058` refresh and refine `/returns`.
  - `0059` and `0060` refresh and trim `/payment-methods`.
  - `0061` and `0062` refresh and refine `/privacy-policy`.
  - `0063` refreshes `/delivery`.
  - `0064` removes the redundant `/contact` support intro description that referenced footer settings.
- Current legal/support content direction:
  - `/terms`: practical FlexDrive terms for account/guest checkout, product info, compatibility responsibility, pricing/stock/technical errors, order confirmation, payment, delivery, returns, B2B, privacy/security. Warranty references were removed because FlexDrive does not offer a warranty in the first phase.
  - `/returns`: 6 sections, company-protective but legally conscious wording. Uses `პროდუქტისა და თანხის დაბრუნება`; ordinary return timing uses `ჩაბარებიდან 14` rather than purchase date; installed/used parts are assessed individually.
  - `/payment-methods`: 4 concise sections. Current live method is cash on delivery; online card/installment/part-payment text is written for future integrations without pretending those methods are currently active. Refund/cancel copy says online refunds are processed through the original payment channel.
  - `/privacy-policy`: 5 concise sections covering auth/profile, cart/wishlist/buy-now, checkout/order, contact form, reCAPTCHA, cookies, analytics/GTM/Google Ads/Meta Pixel, payment providers, delivery partners, retention/security, and user rights.
  - `/delivery`: 4 concise sections. Delivery timing starts after order confirmation; standard timing is Tbilisi `1-2 სამუშაო დღე`, regions `4-5 სამუშაო დღე`. Old same-day/13:00 copy was removed.
- `/contact` has been visually redesigned mobile-first. Contact form/API logic is preserved; the support intro description now renders only when CMS provides non-empty text. The footer redesign attempt was reverted at the user's request, so `app/components/LAYOUTS/Footer.vue` is back to the previous visual implementation.
- Placeholder contact/company data remains in legal content until company registration and real support details are available. Current placeholder addresses include `support@flexdrive.ge`, `returns@flexdrive.ge`, and `privacy@flexdrive.ge`.
- Content migrations were applied to the staging Neon/Postgres database and verified after each pass. If staging UI still shows old content, suspect API/browser cache before changing code.
- Tests updated/run for touched legal content:
  - `pages.test_payment_methods_page`
  - `pages.tests.GetCurrentContentAPITests.test_privacy_policy_page_includes_seeded_component`
  - `pages.tests.GetCurrentContentAPITests.test_delivery_page_includes_seeded_component`
- Next likely static/support step: footer/contact browser QA if explicitly requested, then payment safety architecture work.

## Current Payment Safety State - 2026-05-15

- Stage 1 of payment safety is implemented as a low-risk foundation:
  - backend `Order` now has a separate `payment_status` field with values `pending`, `authorized`, `paid`, `failed`, `cancelled`, `refund_pending`, and `refunded`;
  - cash-on-delivery checkout and buy-now flows still create orders, reduce stock, clear cart/session, and show success exactly through the existing flow;
  - public order summary and authenticated order list/detail responses include `payment_status`;
  - frontend order success, profile order detail, and profile order list display payment status using `გადახდა ჩაბარებისას` for `cash_on_delivery + pending`;
  - guest users have order visibility without a cabinet: the existing success page by `public_token` remains, and `/order-status` can look up a safe short summary by order number + phone.
- Local and staging backend migration `commerce.0010_order_payment_status` was applied during this stage. Production still needs normal deploy-time migrations when applicable.
- The agreed generic availability copy is: `პროდუქტის ხელმისაწვდომობა შეიცვალა. გთხოვთ გადაამოწმოთ მარაგი და სცადოთ ხელახლა.`
- Stage 2, guest order lookup/status, is implemented:
  - backend endpoint: `POST /api/commerce/orders/lookup/`;
  - lookup uses `order_number + phone` with light Georgian phone normalization, including `+995`/`995` and local number matching;
  - response is intentionally limited to safe summary fields: order number, order/payment status, payment method, checkout source, total, created date, item count, total quantity, and short item list;
  - response must not expose `public_token`, email, phone, city, address line, or note;
  - wrong order number and wrong phone return the same generic `404` text;
  - endpoint uses `order_lookup` throttle scope with `10/min`;
  - endpoint requires reCAPTCHA with frontend action/backend expected action `order_lookup`;
  - authenticated users can also use this endpoint, but it is not an ownership-based cabinet feature.
- Frontend `/order-status` is implemented through the CMS/SmartComponent flow:
  - SmartComponent file: `app/components/SmartComponents/OrderStatus/OrderStatus.vue`;
  - backend CMS data migration: `pages/migrations/0065_seed_order_status_page.py`;
  - route slug is `order-status`, component name is `OrderStatus`, footer group is `help`, footer label is `შეკვეთის სტატუსი`, SEO is `noindex`;
  - local and staging `pages.0065_seed_order_status_page` migration was applied; production needs normal deploy-time migrations when applicable;
  - success page includes a secondary link to `/order-status`;
  - the form uses required field validation and does not submit empty values;
  - frontend sends `recaptcha_token` with lookup requests, and backend verifies it before searching orders;
  - successful lookup stores the last lookup inputs and safe summary in `sessionStorage` for the current tab, so refresh keeps the last visible result without automatically calling the protected backend endpoint again;
  - clicking `შემოწმება` manually performs a fresh reCAPTCHA + backend lookup.
- Stage 3, internal payment safety foundation, is implemented in the backend without changing live cash-on-delivery checkout behavior:
  - backend migration: `commerce/migrations/0011_stockreservation_paymenttransaction_and_more.py`;
  - local development DB and staging Neon/Postgres DB have both applied `commerce.0011`;
  - new `StockReservation` model stores temporary stock holds by `user` or `guest_token`, source (`cart` / `buy_now`), status (`active`, `completed`, `expired`, `released`), expiry time, completion order, and release/completion timestamps;
  - new `StockReservationItem` model stores reserved product, quantity, and price snapshot;
  - new `PaymentTransaction` model stores payment attempts independently from orders: order/reservation link, provider, method, action, status, amount, currency, provider transaction id/reference, errors, and authorized/captured/cancelled/refunded timestamps;
  - payment provider choices currently include `mock` and `manual`; this is intentional foundation only, not a real bank integration;
  - payment transaction actions are `authorize`, `capture`, `sale`, `cancel`, and `refund`;
  - transaction statuses mirror the internal payment lifecycle: `pending`, `authorized`, `paid`, `failed`, `cancelled`, `refund_pending`, `refunded`;
  - `config/settings.py` now has `STOCK_RESERVATION_TTL_SECONDS`, defaulting to 15 minutes;
  - `commerce/payment_providers.py` contains the mock/manual provider abstraction, so future BOG/TBC/etc. adapters can plug into the same method names instead of changing checkout logic;
  - `commerce/services.py` now includes reservation service functions for cart and buy-now sources, reserved-stock calculation, release, expiry, completion, and mock/manual authorize/capture/sale/cancel/refund transaction processing;
  - the reservation service accounts for active non-expired reservations when calculating available stock, but it does not reduce real `Product.stock_qty`; real stock is still reduced only when an order is created by the existing checkout flow;
  - replacing a reservation for the same owner/source releases the previous active reservation after the new reservation validates, so repeated starts do not hold duplicate stock;
  - existing cash-on-delivery checkout, buy-now checkout, stock validation, price validation, order creation, cart/session cleanup, admin cancel/restore, and profile orders were intentionally not rewired to use reservation yet.
- Admin visibility for the foundation is implemented:
  - `PaymentTransaction` is visible as a read-only inline on order admin pages;
  - `StockReservation` has its own admin with items inline;
  - `PaymentTransaction` has its own admin list/detail view with provider, action, status, amount, order/reservation links, timestamps, and provider reference fields.
- Backend tests were updated for the foundation:
  - cart reservation creates active reservation items without reducing stock;
  - active reservations reduce available stock for other owners;
  - same owner/source replacement releases the previous active reservation;
  - expired reservations stop counting against available stock;
  - released reservations free available stock;
  - completed reservations link to an order;
  - buy-now reservation uses the buy-now session snapshot;
  - mock authorize/capture/refund transactions create transaction records and update order `payment_status`;
  - admin registration for `StockReservation` and `PaymentTransaction` is covered;
  - full backend command `C:\Users\kench\Desktop\flexdriveback\venv\Scripts\python.exe manage.py test commerce` passed with 96 tests OK.
- Payment safety work still not fully implemented: the new reservation and transaction foundation is not yet connected to real online checkout, real bank redirect/callback/webhook, real authorization/capture, real installment/part-payment flows, or provider-driven refund/cancel flows.

## Current Legal Entity Checkout State - 2026-05-20

- Legal-entity buyer flow has been added to checkout as a practical first step, not as a full B2B privilege/discount system.
- Checkout now supports `buyer_type`:
  - `individual` keeps the existing physical-person checkout behavior.
  - `legal_entity` reveals company fields while preserving the same cart/buy-now, validation, payment, reCAPTCHA, order creation, stock, and success-page flow.
- Legal-entity fields currently collected:
  - company name;
  - 9-digit company identification code;
  - company legal address;
  - existing contact person fields remain `first_name`, `last_name`, `email`, and `phone`.
- Frontend implementation uses the existing checkout form system and reusable components:
  - `app/components/commerce/CheckoutFormSections.vue`
  - `app/composables/commerce/useCheckoutForm.ts`
  - `app/composables/useCommerceValidationSchemas.ts`
  - `app/pages/checkout/index.vue`
  - `app/pages/buy-now/checkout.vue`
  - `app/types/commerce.ts`
- Order success/profile detail views now display buyer type and company data when the order was created for a legal entity:
  - `app/components/commerce/CheckoutSuccessSummary.vue`
  - `app/components/profile/ProfileOrderDetail.vue`
- Backend order persistence now stores a company snapshot directly on the order:
  - `buyer_type`
  - `company_name`
  - `company_identification_code`
  - `company_legal_address`
- Company snapshot means the company data entered during checkout is copied onto that specific order. If a company changes name/address later, old orders still keep the exact company data used at purchase time.
- Backend files involved in the paired backend repo:
  - `commerce/models.py`
  - `commerce/serializers.py`
  - `commerce/services.py`
  - `commerce/admin.py`
  - `commerce/tests.py`
  - `commerce/migrations/0012_order_buyer_company_snapshot.py`
- Migration `commerce.0012_order_buyer_company_snapshot` has been applied locally and on staging Neon/Postgres.
- Document generation and document business logic are intentionally paused:
  - no tax invoice / VAT invoice flow;
  - no waybill/RS upload checkbox;
  - no invoice/proforma generation;
  - no document PDF/email workflow;
  - no RS.ge integration.
- Reason for pause: company registration, VAT status, RS.ge/waybill requirements, cash receipt process, and accounting workflow still need confirmation before encoding document behavior in the product.
- Do not add document checkboxes such as `RS-ზე ატვირთვა`, invoice generation, tax invoice generation, or waybill automation until the accounting/document flow is explicitly settled.

## Upcoming Payment Safety Work - 2026-05-15

- Before real card, installment, or part-payment integrations go live, FlexDrive needs a carefully designed payment safety flow. This is high-priority work and must be implemented deliberately, with every step checked end to end.
- The goal is to avoid situations where a customer pays online or receives installment approval for a part that cannot be fulfilled because stock, compatibility, or order validation failed after payment.
- Required planning/implementation areas:
  - wire the existing stock reservation foundation into the future online payment start flow, with expiry and release on failed/abandoned payment;
  - continue using separate order status and payment status handling; the base `payment_status` field already exists;
  - continue using the new payment transaction records with provider, provider transaction id, amount, currency, status, timestamps, and raw provider references where appropriate;
  - admin actions for cancelling orders, marking/refunding payments, and clearly tracking refund/cancel state;
  - replace/extend the current mock/manual provider abstraction with real TBC/BOG/other provider adapters once provider API details are available;
  - success, failure, cancellation, callback/webhook, refund, and out-of-stock edge cases;
  - customer-facing copy for successful payment, pending confirmation, failed payment, cancelled order, refund initiated, and refund completed states.
- Prefer building the internal safety architecture before bank/provider integration. Bank APIs should plug into an already clear order/payment/refund model rather than defining the whole checkout logic.
- For card payments, prefer authorization/capture if the chosen provider supports it: reserve stock first, authorize payment, then capture only after the order is fulfilment-ready. If immediate capture is required, implement reliable full refund/cancel flows.
- For installments and part-payment providers, cancellation/refund must go through the same provider channel, not manual cash/bank transfer, unless a documented provider exception requires otherwise.
- Still needed from banks/providers before final integration:
  - whether card payments support authorization/capture or only direct capture;
  - redirect/session creation API details;
  - callback/webhook payloads, signatures, retry rules, and idempotency requirements;
  - cancellation/void rules for authorized but uncaptured payments;
  - refund API rules and expected refund timing;
  - installment approval/cancel/refund flow;
  - part-payment status lifecycle and failure states;
  - provider transaction id/reference fields that must be stored;
  - test credentials and sandbox URLs.
- Do not connect the foundation to live checkout casually. The next payment phase should be a deliberate provider-integration phase: choose provider, map its statuses to the internal statuses, add provider adapter, add webhook/callback endpoints, then connect reservation + transaction + order creation end to end with tests.

## Remaining Launch Roadmap - 2026-05-16

- Payment safety/order state foundation is already implemented, but real bank/payment integration is intentionally deferred until the user finishes consultation with banks/providers and has concrete API rules, sandbox credentials, callback/webhook details, authorization/capture support, refund/cancel rules, and installment/part-payment lifecycle details. Do not start provider-specific payment work before that information exists.
- Legal-entity checkout field collection is implemented. Remaining work is the accounting/document decision layer, not the basic buyer-type checkout branch:
  - confirm whether/when tax invoices apply after company registration and VAT status are known;
  - confirm whether waybills/RS.ge documents are required per delivery model and whether they are always generated or only for legal entities;
  - decide if invoice/proforma flow is needed at all while the product primarily uses site checkout/card or cash-on-delivery;
  - define admin document statuses only after the accounting process is clear.
- Analytics and tracking implementation should use a privacy-conscious tag architecture:
  - Use Google Tag Manager as the central tag container, then configure GA4 and Meta Pixel through GTM rather than hard-coding separate vendor scripts throughout the app.
  - Use a first-party `dataLayer` event contract from Nuxt/frontend code so ecommerce events are consistent and testable.
  - GA4 should follow Google's recommended ecommerce event model where relevant: `view_item`, `select_item`, `add_to_cart`, `remove_from_cart`, `view_cart`, `begin_checkout`, `add_shipping_info`, `add_payment_info` when online payments exist, and `purchase`.
  - Additional useful events: search, catalog filter usage, login, sign-up, contact submit, order lookup, wishlist add/remove, and checkout validation failure where safe and non-sensitive.
  - Meta Pixel should be loaded through GTM after marketing consent and should receive only appropriate standard ecommerce events. Avoid sending sensitive personal data or raw internal notes.
  - Final event names/parameters should be written down before implementation so GA4, GTM, and Pixel do not drift.
- Cookie consent and privacy controls are implemented. Keep analytics/marketing consent combined for now unless the user explicitly asks to split them later:
  - Georgian cookie consent banner/modal exists and matches the FlexDrive design direction.
  - Necessary cookies stay always on; preferences/functionality/tracking choices are stored in consent state.
  - Default analytics/marketing tracking consent is denied until the user accepts tracking.
  - GTM/GA4 Consent Mode is driven from the saved consent state and updated when the user changes consent later.
  - Consent can be changed later from footer/privacy controls, and the privacy policy copy covers analytics, GTM, Meta Pixel, cookies, and consent choices.
- SEO final pass remains open:
  - Audit page titles/descriptions, canonical URLs, Open Graph/Twitter metadata, robots/noindex rules, sitemap, product/category dynamic metadata, and 404/error metadata.
  - Add/verify structured data where useful: Organization/WebSite, breadcrumbs, product data, and possibly FAQ/legal page schema only where content warrants it.
  - Keep private/profile/checkout/order token pages noindexed; public catalog/product/legal/content pages should be indexable when production content is ready.
  - Verify Georgian copy, product naming, category hierarchy, image alt text, canonical domain, and production robots/sitemap behavior before launch.
- Full launch QA remains open:
  - End-to-end checks across desktop and mobile for auth/social auth, catalog filters, product detail, cart, wishlist, checkout, guest order lookup, account/profile/orders, static/legal pages, and contact.
  - Verify production env variables, secret rotation, Google/Facebook redirect URIs, Render/Vercel deployment order, database migrations, email delivery, reCAPTCHA, cookies, analytics consent, SEO indexability, and error states.
  - For social auth production, complete Facebook production checklist and Google production redirect/domain configuration when a final production domain exists.

## Current Analytics and Pixel State - 2026-05-26

- Analytics/tagging architecture is implemented for development/staging. Frontend tracking is routed through Google Tag Manager rather than separate hard-coded vendor scripts.
- Current GTM container used for development/staging testing: `GTM-MVNFL9TH`.
- Current GA4 development property/measurement ID used through GTM: `G-CKQC30CKYJ`.
- Current Meta dataset/pixel used through GTM: `1020718363721235` (`FlexDrive Web Pixel`).
- Vercel frontend staging/preview must have `NUXT_PUBLIC_GTM_ID=GTM-MVNFL9TH` and must be redeployed after changing the env var.
- Current Nuxt frontend sends ecommerce events to `dataLayer`; GTM forwards them to GA4 and Meta Pixel:
  - `view_item`
  - `add_to_cart`
  - `add_to_wishlist`
  - `view_cart`
  - `remove_from_cart`
  - `begin_checkout`
  - `add_payment_info`
  - `purchase`
- The frontend purchase event includes `event_id: purchase-{transaction_id}`. Keep this contract stable because Meta browser Pixel and backend Meta CAPI use it for purchase deduplication.
- GTM tags currently configured:
  - `GA4 - Config - Development`
  - `GA4 Event - Ecommerce`
  - `GA4 Event - Search`
  - `Meta Pixel - Base`
  - `Meta Pixel - Ecommerce Events`
- GTM trigger currently configured for ecommerce forwarding: `Ecommerce events - 2A`, matching the ecommerce event names above.
- GTM search tracking is configured with `GA4 Event - Search`, custom event trigger `Search event`, and data layer variable `DLV - search_term`. The frontend sends `event: search` with `search_term` when the user submits search or opens a selected suggestion/result, not on every keystroke.
- Later GA4 follow-up: add a GA4 custom dimension for `search_term` so searched words are easy to view as a table in GA4 reports/explorations. This is GA4 configuration, not code.
- `Meta Pixel - Ecommerce Events` must pass `eventID` to `fbq('track', ...)` when `ecommerce.event_id` exists. This is required so browser Pixel purchase and server CAPI purchase are not counted as separate purchases.
- Staging validation was done through GTM Preview: GA4 ecommerce and Meta Pixel ecommerce tags fired successfully on staging actions including `add_to_cart`, `begin_checkout`, and `purchase`; purchase `Data Layer` showed `event_id`; site search fired `search` with `search_term`.
- Backend Meta Conversions API is implemented in the paired backend repo for `Purchase` only:
  - backend file: `commerce/meta_conversions.py`
  - checkout hooks: `commerce/views.py`
  - settings/env keys: `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`, `META_CAPI_ENABLED`, `META_CAPI_GRAPH_API_VERSION`, `META_CAPI_TIMEOUT_SECONDS`, optional staging-only `META_CAPI_TEST_EVENT_CODE`
  - server event id matches frontend browser event id: `purchase-{order_number}`
  - customer matching data is hashed before sending to Meta; raw email/phone/name are not sent in the payload.
- GA4 key events were marked in the GA4 UI for important ecommerce actions, including at least `purchase`, `begin_checkout`, and `add_to_cart`; `add_payment_info` may also be marked if it remains useful.
- Google Analytics is the primary day-to-day reporting surface. Use GA4 reports such as Realtime and Traffic acquisition to understand active users, channels, source/medium, pages, and ecommerce events.
- Meta Events Manager is primarily for pixel/CAPI health, diagnostics, event match quality, and ads platform event delivery, not the main daily traffic dashboard.
- Meta Pixel/CAPI becomes most useful after Facebook/Instagram ads start running. Ads are still configured manually in Meta Ads Manager; Pixel/CAPI provide optimization and remarketing signals such as product views, cart adds, checkout starts, wishlist adds, and purchases.

## Current Cookie Consent State - 2026-05-27

- Cookie consent banner/modal implementation is complete for the current launch scope.
- The banner is hydration-safe: it renders after client hydration so it does not create Nuxt SSR/client mismatch warnings.
- Consent is stored in the `flexdrive_cookie_consent` cookie with necessary cookies always on.
- Analytics and marketing are intentionally treated as one tracking choice for now. Do not split them unless the user explicitly asks.
- GTM loading and ecommerce/search analytics events are gated by tracking consent. When consent changes later, the frontend sends GTM Consent Mode updates instead of relying only on the first page load.
- Preferences consent gates persisted theme storage. If preferences are denied or revoked, theme cookie/localStorage persistence is cleared.
- Functionality consent gates persisted recent-search storage. If functionality is denied or revoked, recent-search localStorage is cleared.
- Checkout/buy-now checkout continues to pass marketing consent to the backend so Meta CAPI purchase sending stays consent-aware.
- Remaining operational check before paid ads/public launch: verify in GTM Preview that GA4 and Meta Pixel tags respect denied consent, especially that Meta Pixel does not fire from an unconditional All Pages trigger when tracking consent is denied.

## Current Supplier API Import Direction - 2026-05-29

- Cross Motors supplier data is expected through a REST API, not Google Sheets, for the real supplier integration. Keep the earlier Google Sheets importer available as a fallback/testing path unless the user explicitly asks to remove it.
- The API fields observed so far are: `code`, `oem`, `name`, `brand`, `model`, `generation`, `manufacturer`, `qty`, `dealer_price`, and `currency`.
- Supplier feed decision updated 2026-06-02: send `in_stock_only=false` from the Cross Motors importer so development/staging imports include both in-stock and out-of-stock supplier rows. Supplier rows with `(Original)` only in the product name but with a non-original manufacturer such as `Suo Lun` are aftermarket analogs and should be imported. Treat rows as real originals only when supplier make/model/manufacturer fields indicate original/OEM-original status.
- Treat supplier API `brand` as the vehicle make, supplier API `model` as the vehicle model, and supplier API `manufacturer` as the part manufacturer/product brand. Do not map supplier `brand` directly to product brand.
- The site should never show original/OEM-used original supplier parts in the storefront. Exclude rows such as `manufacturer = Subaru Original` or `brand = Subaru - Original` from storefront-visible products.
- For development and staging, show all non-original products even when `dealer_price` is missing, so the business team can review data quality. Missing supplier price should render as a placeholder customer price such as `0.00 GEL` until the business decides a stricter rule.
- Longer term before production, revisit missing-price behavior. A safer production rule may be to keep non-original products with no `dealer_price` in review/draft or hide purchase actions until a valid supplier price exists.
- Non-original out-of-stock products can remain visible as out of stock when they have enough product data. They must not be purchasable while `qty <= 0`.
- Production stock-sync risk to resolve before real launch: supplier import currently overwrites local product stock from the supplier feed. Before production orders, define how imports interact with local pending orders, stock reservations, completed orders, cancellations, and retries so a later supplier sync cannot accidentally erase locally reserved/sold quantities or make unavailable stock purchasable again.
- Normalized import mapping should keep raw supplier data for audit/debugging and derive clean fields:
  - `code` -> supplier code and stable SKU, e.g. `CM-000015`.
  - `oem` -> manufacturer/OEM part number when present.
  - `name` -> product name and source text for placement/side/category parsing.
  - `manufacturer` -> product brand/part manufacturer.
  - `brand` -> vehicle make.
  - `model` -> vehicle model.
  - `generation` -> raw generation plus parsed `year_from`/`year_to` where reliable.
  - `dealer_price` -> supplier price.
  - `qty` -> stock quantity.
- Generation parsing must support multiple observed formats, including `XV 12-17`, `Crosstrek 18-`, `RAV4 2013-2018`, `K5 2021-`, `RAV-4 '13-'18`, and single-year values like `Outback 23`. Unknown non-empty generation formats must be reported in dry-run/import diagnostics instead of silently ignored.
- Name parsing should derive side and placement conservatively:
  - `(LH)` -> left.
  - `(RH)` -> right.
  - Georgian words like `წინა`, `უკანა`, `ზედა`, `ქვედა`, `შიდა`, `გარე` -> placement labels.
- Store normalized enum/internal values consistently for code stability where backend models require values like `front`, `rear`, `left`, and `right`, but expose Georgian labels in frontend/API presentation such as `წინა`, `უკანა`, `მარცხენა`, and `მარჯვენა`.
- Category assignment should be rule-based from product name where possible, with an explicit review/uncategorized fallback for unknown cases. Do not let category parsing failures corrupt product data.
- Import tooling should support dry-run diagnostics before commit. Diagnostics should include total rows, excluded original rows, non-original rows, missing prices, missing generation, unknown generation formats, missing manufacturer, unknown category guesses, and visibility/purchasability counts.

## Current SEO/Social Preview Follow-Up - 2026-05-27

- Default SEO copy and default social preview image are configured through backend `SiteSettings` and frontend runtime fallbacks.
- Staging `NUXT_PUBLIC_ALLOW_INDEXING` must remain `false`; staging pages should stay `noindex, nofollow`, and staging `robots.txt` should block indexing/crawling according to the current SEO matrix.
- Facebook Sharing Debugger currently returns `403` for the Vercel staging domain even after direct browser/crawler-style requests return `200`. A temporary backend-free `/meta-debug-test` route reproduced the same Meta Debugger `403`, so the issue is not proven to be homepage SSR, backend, DB, CMS, or Open Graph metadata.
- The temporary `/meta-debug-test` route was removed after diagnostics. Do not leave diagnostic social-preview routes deployed.
- Revisit this before public launch when a real production domain or dedicated custom staging subdomain exists. Test Facebook/Messenger preview on the custom domain, then decide whether the issue is resolved by domain setup or needs Vercel/Meta support escalation.

### Production Analytics Launch Checklist

- Frontend production env on Vercel must include `NUXT_PUBLIC_GTM_ID=GTM-MVNFL9TH` or the chosen production GTM container id, then production frontend must be redeployed.
- Backend production env on Render must include `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`, `META_CAPI_ENABLED=true`, `META_CAPI_GRAPH_API_VERSION`, and `META_CAPI_TIMEOUT_SECONDS`. Do not store the actual token in docs or commits.
- Do not set `META_CAPI_TEST_EVENT_CODE` in production. It is only for Meta Events Manager staging/test diagnostics.
- Backend `FRONTEND_BASE_URL` must be the final production frontend domain, e.g. `https://flexdrive.ge`, so server-side event source URLs are correct.
- GTM tags/triggers do not need to be recreated for production. Use GTM Preview on the production domain after deploy and verify `view_item`, `add_to_cart`, `begin_checkout`, and `purchase`; purchase must include `event_id`.
- Verify production site search in GTM Preview and GA4: submitted searches should fire `search` and include `search_term`. Add the GA4 custom dimension for `search_term` before relying on search-term tables.
- Best practice before public launch: create/use a production GA4 property or stream so staging/development test data does not pollute real reporting. If a new GA4 Measurement ID is chosen, update the GTM GA4 config tag accordingly and publish.
- Decide whether the same Meta Pixel will be used for production ad optimization or whether a separate production dataset/pixel is required. If changed, update the GTM Meta Pixel base/ecommerce tags and backend `META_PIXEL_ID` together.
- Verify GA4 Realtime and Traffic acquisition after production deploy; verify Meta Events Manager diagnostics after purchase tests. Meta reporting can lag.
- Before real marketing/ads launch, verify consent/cookie controls in GTM Preview so analytics and marketing tags respect user choices.
- Production/privacy readiness still needs: privacy policy confirmation, Meta domain verification for `flexdrive.ge`, GTM consent verification on production, and final ads-account checks before paid campaigns.
