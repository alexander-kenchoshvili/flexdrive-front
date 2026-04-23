# FlexDrive Design System Foundation

Last updated: 2026-04-23

## Purpose

ეს დოკუმენტი არის საწყისი visual foundation ახალი FlexDrive redesign-ისთვის.

მიმდინარე ეტაპზე არ ვცვლით ლოგიკას. ეს დოკუმენტი განსაზღვრავს როგორ უნდა ავაშენოთ ახალი ვიზუალური სისტემა ლოგოს, accessibility-ს, light/dark mode-ს და mobile-first ecommerce მოთხოვნების გათვალისწინებით.

## Logo Source

Current logo component:

- `app/components/icons/FlexdriveLogo.vue`

SVG metadata:

- `width="120"`
- `height="90"`
- `viewBox="0 0 120 90"`

Observed logo colors:

| Role | Hex |
| --- | --- |
| Bright brand green | `#82A93E` |
| Deep logo green | `#718E34` |
| Deep logo green | `#6D8A32` |
| Deep logo green | `#698831` |
| Deep logo green | `#688732` |
| Logo white | `#FEFEFF` |
| Logo white | `#FDFDFD` |

Important observation:

- The logo is currently a single visual version.
- The white text/shape parts will not work directly on a white/light background.
- The bright green is a good brand signal, but it is not always safe as text or small UI on light backgrounds.

## Accessibility Findings

Contrast checks against representative backgrounds:

| Color | On white | On black | On dark green `#0E160B` | On light green `#F7FAF2` |
| --- | ---: | ---: | ---: | ---: |
| `#82A93E` | 2.73 | 7.69 | 6.76 | 2.59 |
| `#718E34` | 3.74 | 5.62 | 4.94 | 3.54 |
| `#6D8A32` | 3.94 | 5.33 | 4.68 | 3.73 |
| `#698831` | 4.06 | 5.17 | 4.54 | 3.85 |
| `#688732` | 4.12 | 5.10 | 4.48 | 3.90 |
| `#FEFEFF` | 1.01 | 20.83 | 18.30 | 1.05 |

Implications:

- `#82A93E` fails WCAG AA for normal text on white/light backgrounds.
- Logo green shades are acceptable as graphic/brand accents on light backgrounds, but not as small body text unless darkened.
- White logo parts are excellent on dark backgrounds and unusable on light backgrounds.
- For light mode CTAs/text, the UI needs a darker action green than the logo's bright green.
- For dark mode CTAs/text, the UI can use a brighter green derived from the logo.

## Core Principle

Use the logo as brand input, not as the full UI palette.

The design system should separate:

- Brand colors: recognizable FlexDrive identity.
- Semantic UI colors: accessible text, backgrounds, controls, states, and feedback.
- Mode-specific colors: separate light and dark token decisions.

## Proposed Semantic Palette

These values are a starting point for implementation. They should be tested visually in real components before finalizing.

### Light Mode

| Token | Hex | Usage |
| --- | --- | --- |
| `--bg-primary` | `#F8FAF4` | Page background |
| `--bg-secondary` | `#EEF3E8` | Subtle page bands |
| `--bg-muted` | `#E5ECD9` | Muted utility areas |
| `--surface` | `#FFFFFF` | Cards, forms, popovers |
| `--surface-2` | `#F3F6EE` | Secondary surfaces |
| `--surface-3` | `#E8F1D6` | Soft brand surface |
| `--text-primary` | `#111827` | Main text |
| `--text-secondary` | `#3F4A3A` | Secondary copy |
| `--text-muted` | `#596256` | Metadata and helper text |
| `--text-invert` | `#FFFFFF` | Text on dark/primary buttons |
| `--border-default` | `#D7E0CD` | Default borders |
| `--border-muted` | `#C7D3BA` | Stronger borders/dividers |
| `--brand-primary` | `#82A93E` | Logo/brand accent only |
| `--accent-primary` | `#4F6F1F` | Primary buttons/links on light mode |
| `--accent-hover` | `#3F5A18` | Hover/active direction |
| `--accent-pressed` | `#2F4312` | Pressed state |
| `--accent-soft` | `#E8F1D6` | Selected filters, soft badges |
| `--focus-ring` | `#5B7F24` | Keyboard focus ring |
| `--success` | `#167A3A` | In-stock/success |
| `--warning` | `#A16207` | Warning/limited |
| `--error` | `#B42318` | Error/out-of-stock |

Checked contrast examples:

| Foreground | Background | Contrast |
| --- | --- | ---: |
| `#4F6F1F` | `#FFFFFF` | 5.79 |
| `#4F6F1F` | `#F8FAF4` | 5.51 |
| `#3F5A18` | `#FFFFFF` | 7.82 |
| `#5B7F24` | `#FFFFFF` | 4.66 |
| `#596256` | `#FFFFFF` | 6.35 |
| `#3F4A3A` | `#FFFFFF` | 9.33 |

### Dark Mode

| Token | Hex | Usage |
| --- | --- | --- |
| `--bg-primary` | `#0E160B` | Page background |
| `--bg-secondary` | `#121D0F` | Secondary page bands |
| `--bg-muted` | `#1B2717` | Muted utility areas |
| `--surface` | `#121A10` | Cards, forms, popovers |
| `--surface-2` | `#182316` | Secondary surfaces |
| `--surface-3` | `#20301B` | Elevated/selected surfaces |
| `--text-primary` | `#F7FAF2` | Main text |
| `--text-secondary` | `#D7E2CC` | Secondary copy |
| `--text-muted` | `#AEBDA1` | Metadata and helper text |
| `--text-invert` | `#0E160B` | Text on bright primary buttons |
| `--border-default` | `#34452A` | Default borders |
| `--border-muted` | `#425634` | Stronger borders/dividers |
| `--brand-primary` | `#A8CF58` | Logo/brand accent on dark |
| `--accent-primary` | `#B7DD66` | Primary buttons/links on dark mode |
| `--accent-hover` | `#C8EA7A` | Hover state |
| `--accent-pressed` | `#95BE43` | Pressed state |
| `--accent-soft` | `#263A1C` | Selected filters, soft badges |
| `--focus-ring` | `#B7DD66` | Keyboard focus ring |
| `--success` | `#4ADE80` | In-stock/success |
| `--warning` | `#FBBF24` | Warning/limited |
| `--error` | `#F87171` | Error/out-of-stock |

Checked contrast examples:

| Foreground | Background | Contrast |
| --- | --- | ---: |
| `#A8CF58` | `#0E160B` | 10.31 |
| `#B7DD66` | `#0E160B` | 11.90 |
| `#D7E2CC` | `#0E160B` | 13.74 |
| `#AEBDA1` | `#0E160B` | 9.31 |
| `#E8F1D6` | `#0E160B` | 15.80 |
| `#E8F1D6` | `#4F6F1F` | 4.96 |

## Logo Usage Rules

The current logo should not be placed directly on arbitrary surfaces.

Recommended handling:

- On dark header/footer: current white/green logo can work well.
- On light header/surface: create either a dark-text logo variant or place the current logo inside a dark brand plate.
- Do not rely on the white logo text over light backgrounds.
- Do not use `#82A93E` as normal body text on light backgrounds.
- Header logo size should be decided in context after header redesign; the current SVG is vertically tall and may need a compact lockup for navigation.

Future implementation options:

- `FlexdriveLogo.vue` now supports `variant="auto" | "on-light" | "on-dark"`.
- `variant="auto"` adapts to the global `.dark` class.
- `variant="on-dark"` is intended for always-dark surfaces such as the footer.
- `app/components/icons/Logo.vue` now proxies the old `logo` icon name to the new FlexDrive logo so older `BaseIcon name="logo"` usage remains safe.

## Reusable Component Color Rules

All reusable components should use semantic tokens, not raw logo colors.

## Layout Width And Breakpoints

Global storefront layout should use a 1440px maximum content width.

Implementation rules:

- Tailwind `theme.container.screens["2xl"]` is `1440px`.
- Shared page wrappers should prefer `container-fluid`.
- If a component cannot use `container-fluid`, use `max-w-[1440px]` instead of `max-w-7xl`.
- `container-fluid` keeps side padding through 1440px viewports and removes it only from 1536px upward.
- Mobile remains the primary breakpoint target; wider desktop width should add scan density, not create stretched text lines.

Viewport checkpoints:

- 375px mobile
- 768px tablet
- 1024px compact desktop
- 1440px primary desktop canvas
- 1536px+ wide desktop with full 1440px content width

## Typography And Spacing

Typography and vertical spacing rules are defined in:

- `docs/typography-spacing-standard.md`

This document is the source of truth for:

- mobile and desktop font sizes;
- line heights;
- heading hierarchy;
- page header density;
- section spacing;
- homepage hero height;
- catalog/product text density.

Implementation principle:

- Mobile typography must remain readable but compact.
- Page headers and hero sections must not push useful ecommerce content too far below the fold.
- Desktop can increase hierarchy and density, but mobile remains the default scale.

### Buttons

Required states:

- default
- hover
- active/pressed
- loading
- disabled
- focus-visible

Rules:

- Primary button in light mode should use darker green `--accent-primary`, not logo green `#82A93E`.
- Primary button in dark mode can use brighter green `--accent-primary` with dark text.
- Secondary buttons should remain neutral and readable.
- Danger buttons should use error tokens, not brand colors.

### Inputs, Selects, Textareas

Rules:

- Border must be visible on both modes.
- Placeholder text must be readable but clearly lower emphasis.
- Error text and border must not depend on color alone; include text/icon/structure when needed.
- Focus ring must be clear and accessible.
- Controls must be at least 44px tall for touch targets.

### Cards And Surfaces

Rules:

- Product cards should be compact and scannable.
- Default card radius should be 6-8px unless a specific component needs otherwise.
- Avoid large decorative gradients.
- Avoid nested cards.
- Use shadows sparingly; border and hierarchy should do most of the work.

### Badges And Status

Rules:

- In stock: success tone plus readable label.
- Out of stock/unavailable: error tone plus readable label.
- Limited/warning: warning tone plus readable label.
- Sale/new badges can use semantic accent/status colors, but text contrast must pass.
- Do not use color as the only indicator.

## Mobile-First Ecommerce Rules

Mobile is a primary experience, not an afterthought.

Every redesigned page/component should satisfy these requirements:

- Product title, price, availability, and main action are visible without visual clutter.
- Search and filters are easy to reach on mobile.
- Filter sheet must be fast to scan and easy to close/apply.
- Cart and checkout CTAs must be reachable without covering important content.
- Buttons and icon buttons must have stable 44px+ touch targets.
- Text must not clip inside buttons/cards.
- Product cards must not shift layout when images load or labels change.
- Sticky bars must account for safe area and not overlap form fields.
- Forms must use clear labels, errors, and keyboard-friendly input types.

Recommended mobile redesign priority:

1. Header/search.
2. Catalog filters sheet.
3. Product card.
4. Product detail buy box.
5. Cart line item and summary.
6. Checkout form and sticky submit area.

## Accessibility Rules

Minimum standard:

- Normal text: WCAG AA contrast 4.5:1 or better.
- Large text and meaningful UI graphics: 3:1 or better.
- Focus indicators must be visible in both modes.
- Hover state must not be the only affordance.
- Links must be visually distinguishable from body text.
- Disabled states must still communicate label and purpose.
- Error states must include readable text, not only red border.

Before implementing a palette or component:

- Check text on actual background token.
- Check button text on default/hover/pressed colors.
- Check badges on all surfaces where they appear.
- Check mobile viewport around 375px.
- Check dark mode separately; do not assume inverted light mode is sufficient.

## Implementation Order

Recommended next implementation order:

1. Convert `app/assets/css/design-system.css` to the new semantic palette.
2. Update `tailwind.config.js` only if new token names are needed.
3. Redesign shared primitives: `BaseButton`, `BaseInput`, `BaseSelect`, `BaseTextarea`, `BaseModal`, `AppBreadcrumbs`.
4. Add logo variant support or a safe wrapper for `FlexdriveLogo.vue`.
5. Redesign `Header.vue` and `HeaderSearch.vue`.
6. Redesign `ProductCard`, catalog toolbar, filters, and mobile filter sheet.

Do not start with page-by-page visual changes before tokens and primitives are stable.
