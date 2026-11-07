# Homepage FAQ

The FAQ uses the existing CMS flow, with no new model or API endpoint:

- Component type: `Faq`; component entry on the `main` page.
- Content collection: `faq_questions`.
- Question: ContentItem `title`; answer: plain-text `description`; ordering: `position`, then ID.
- The component title, subtitle, enabled state and homepage position use existing Component fields.
- Frontend: `app/components/SmartComponents/Faq/Faq.vue` and `parts/FaqItem.vue`.
- Interaction and temporary scroll anchoring: `app/composables/useFaqAccordion.ts`.

Only complete question/answer pairs render. An empty collection renders no empty section.
Answers are escaped plain text, preserving paragraph breaks. Title and question text use `upper`.
The backend admin exposes the question, answer and position together for this collection.

## Interaction

One answer can be open, and clicking the open question closes it. Native buttons support
Enter/Space. Unique SSR-safe IDs connect headings, controls and answer regions; closed
answers are inert and hidden from assistive technology. Arrow rotation and natural-height
CSS grid expansion use the same 240ms easing, disabled under reduced-motion preferences.

During expansion/collapse, a short animation-frame adjustment retains the clicked question's
viewport position. Wheel, touch, pointer, keyboard and resize input cancel the adjustment.
Detached controls, component disposal, rapid toggles and document scroll limits are covered.
No fixed answer heights, document spacer, router navigation or persistent scroll lock is used.

## Local preview and rollout

Backend migration `pages.0080_seed_homepage_faq` removes only the unused `/faq` placeholder
after checking that it has no linked content, and adds the homepage FAQ. Migration
`pages.0081_position_faq_after_vehicle_brands` places it immediately after "parts by make".
It preserves other homepage positions and does not seed any questions or answers.

The local SQLite collection now contains nine user-approved question/answer pairs. The first
three items reused the original preview rows; their titles and answers are final content.
Questions cover compatibility, guest checkout, card payments, delivery, order status,
cancellation, returns/refunds, price/stock updates and personal data.

Migration `pages.0082_regional_delivery_3_5_days` updates regional delivery copy to 3–5 working
days in CMS content and component headings, preserving other text and fields.

## Production rollout — 2026-11-04

After the user deployed both repositories, the production database had exactly three pending
migrations: pages 0080–0082. These were applied with the nine approved local FAQ entries in
one guarded PostgreSQL transaction. The FAQ is enabled at position 41, immediately after
VehicleBrandSwiper at position 40. Other homepage positions are unchanged; the unused FAQ
page is removed. Existing LinkedIn configuration already matched local and was preserved.

All other CMS records/fields were compared with their pre-change values; only the intended
FAQ additions, unused-page removal and delivery-window replacements changed. A fresh DB
connection verified the committed FAQ content, ordering and migration state.

Backup of public CMS records and migration history:
`%TEMP%/flexdrive-faq-backups/production-before-faq-20261104-150144-104423.json`.
Credentials were entered through hidden input only; no environment or secret file changed.

The actual production storefront is `https://flexdrive-prod-front-pdzcv.ondigitalocean.app/`.
Its homepage HTTP response contains all nine FAQ controls in the intended position; public
homepage/delivery/terms API responses contain the new 3–5-day text and no old 4–5-day text.
The historical Vercel address points to a different environment and was not migrated.

## Validation

- 12 frontend SSR, interaction, scroll-anchoring, cancellation and cleanup tests pass.
- 6 focused backend FAQ/homepage/footer tests pass; Nuxt typecheck and scoped ESLint pass.
- Broader backend tests retain two baseline copy mismatches: delivery subtitle and privacy
  section count. Both were reproduced with the FAQ migration disabled.
- Computer Use checked the user's existing localhost Chrome at 375px, 780px and 1440px,
  plus its ordinary desktop window. Long-answer switching retained the clicked question's
  visible position on mobile and desktop. Enter/Space, light/dark styling and wrapping checked.
- During the initial local interaction review, existing browser window size, responsive width
  setting and dark theme were restored; FAQ was left visible for review. No orders, account
  data, providers or environment files changed. Production data rollout is recorded above.
