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
