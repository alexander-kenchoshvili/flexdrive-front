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
- Likely next redesign target: product detail page, building from the redesigned catalog/product-card direction while preserving existing product, cart, wishlist, stock, and checkout logic.

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
