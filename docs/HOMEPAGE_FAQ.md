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

The migration is applied to the local SQLite database. Three explicitly labeled local preview
items (`faq-preview-1` through `faq-preview-3`) remain for user review. These are separate from
the migration and are not production content. Replace them with approved questions/answers.
Production deployment/migration is not performed as part of this implementation.

## Validation

- 12 frontend SSR, interaction, scroll-anchoring, cancellation and cleanup tests pass.
- 6 focused backend FAQ/homepage/footer tests pass; Nuxt typecheck and scoped ESLint pass.
- Broader backend tests retain two baseline copy mismatches: delivery subtitle and privacy
  section count. Both were reproduced with the FAQ migration disabled.
- Computer Use checked the user's existing localhost Chrome at 375px, 780px and 1440px,
  plus its ordinary desktop window. Long-answer switching retained the clicked question's
  visible position on mobile and desktop. Enter/Space, light/dark styling and wrapping checked.
- Existing browser window size, responsive width setting and dark theme restored; FAQ left
  visible for review. No orders, account data, providers, environment files or production changed.
