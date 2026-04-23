# FlexDrive Typography And Spacing Standard

Last updated: 2026-04-23

## Purpose

ეს დოკუმენტი არის FlexDrive redesign-ის typography და vertical spacing source of truth.

მიზანი არ არის ტექსტის დაპატარავება readability-ის ხარჯზე. მიზანია მობილურზე ზედმეტი vertical space არ დაიკარგოს დიდ headline-ებში, ზედმეტ line-height-ში და გაუმართლებელ margin/padding-ში.

Core principle:

- ტექსტი უნდა იყოს მკაფიო და სწრაფად წასაკითხი.
- მობილურზე პროდუქტი, search, filter, ფასი და მთავარი action უნდა გამოჩნდეს რაც შეიძლება ადრე.
- heading block-ებმა არ უნდა შეჭამოს პირველი viewport.
- desktop-ზე ზომა შეიძლება გაიზარდოს, მაგრამ mobile scale არის primary.

## Font Family And Weights

Current standard font remains `Noto Sans Georgian`.

Recommended weights:

- `400`: body copy, descriptions.
- `500`: metadata, secondary controls, helper text.
- `600`: labels, nav items, compact emphasis.
- `700`: product titles, card titles, important controls.
- `800`: page titles and major section titles.

Rules:

- Do not use viewport-width-based font sizing.
- Do not use negative letter spacing.
- Use uppercase sparingly. Current `.upper` usage should be reduced over time.
- Do not use very light font weights for Georgian UI text.

## Type Scale

### Mobile First

| Role | Font size | Line height | Weight | Usage |
| --- | ---: | ---: | ---: | --- |
| Display / compact hero title | `30px` | `38px` | `800` | Homepage hero only, short text only |
| Page title / H1 | `28px` | `36px` | `800` | Catalog, page headers, major pages |
| Section title / H2 | `22px` | `30px` | `800` | Homepage sections, catalog groups |
| Subsection / H3 | `18px` | `26px` | `700` | Card groups, content blocks |
| Product title | `16px` | `22px` | `700` | Product cards, cart/wishlist items |
| Body text | `14px` | `22px` | `400/500` | Paragraphs, descriptions |
| Dense body text | `13px` | `20px` | `500` | Catalog metadata, compact helper copy |
| Label / control text | `13px` | `18px` | `600` | Form labels, chips, filters |
| Button text | `14px` | `20px` | `700` | Primary/secondary actions |
| Metadata / helper | `12px` | `18px` | `500/600` | SKU, category, stock helper, timestamps |
| Tiny badge text | `11px` | `14px` | `700` | Short status badges only |

### Tablet And Desktop

| Role | Tablet | Desktop | Line height rule |
| --- | ---: | ---: | --- |
| Display / hero title | `34px` | `42-48px` | Keep tight, no more than `1.18` |
| Page title / H1 | `32px` | `40px` | `1.15-1.2` |
| Section title / H2 | `26px` | `30-32px` | `1.2-1.25` |
| Subsection / H3 | `20px` | `22-24px` | `1.25-1.3` |
| Product title | `16-17px` | `17-18px` | `1.35` maximum |
| Body text | `15px` | `15-16px` | `1.55` maximum |
| Metadata / helper | `12-13px` | `13px` | `1.45` maximum |

Desktop should add density and columns, not simply inflate every text size.

## Vertical Spacing

### Mobile

| Pattern | Recommended value | Notes |
| --- | ---: | --- |
| Page top padding after header | `20-24px` | Avoid `48px+` unless the page has no commerce content |
| Standard section padding | `28-32px` | Homepage/content sections |
| Dense commerce section padding | `20-24px` | Catalog, cart, wishlist, product detail |
| Title to subtitle gap | `6-8px` | Keep subtitles short |
| Subtitle to controls/products gap | `14-18px` | Search/filter/product grid should appear quickly |
| Card internal padding | `12-16px` | Product cards should stay compact |
| Filter/control group gap | `8-12px` | Keep controls close to their labels |
| Grid/list gap | `12-16px` | Mobile catalog/wishlist/cart |
| Major block gap | `20-24px` | Between page header, toolbar, grid |

### Tablet And Desktop

| Pattern | Tablet | Desktop |
| --- | ---: | ---: |
| Page top padding after header | `28px` | `32px` |
| Standard section padding | `40px` | `48-56px` |
| Dense commerce section padding | `28-32px` | `32-40px` |
| Title to subtitle gap | `8px` | `8-10px` |
| Subtitle to controls/products gap | `18-20px` | `20-24px` |
| Grid/list gap | `16-20px` | `20-24px` |

Avoid using desktop spacing on mobile. If a component uses one shared class for all breakpoints, mobile should be the default and larger breakpoints should opt in.

## Page Header Rules

For catalog, listing, search result, wishlist, cart, checkout, profile and content pages:

- Breadcrumbs must be compact on mobile.
- H1 should usually be one or two lines maximum.
- Subtitle should be optional and max two lines on mobile.
- Avoid large intro paragraphs before commerce content.
- The primary action, toolbar, filters, or first product row should appear in the first viewport whenever possible.

Recommended mobile page header structure:

1. Optional compact breadcrumb.
2. H1.
3. Optional one-sentence subtitle.
4. Toolbar/search/filter/product content within `16-20px`.

## Homepage And Hero Rules

The homepage hero should be a catalog/search entry point, not a full-screen marketing poster.

Mobile hero constraints:

- Target height: `360-440px`, depending on media and controls.
- Avoid `100vh` hero sections.
- H1 should be short and use `30px / 38px` maximum.
- CTA/search/category entry should be visible without scrolling.
- A hint of the next section should be visible on common mobile viewports when practical.

Desktop hero constraints:

- Use stronger visual hierarchy, but keep hero operational.
- Search/catalog/finder controls should be part of the main experience.
- Avoid decorative copy blocks that delay product discovery.

## Catalog And Product Rules

Catalog pages should prioritize scan speed.

- Product title: `16px / 22px` on mobile.
- Category/SKU/metadata: `12-13px / 18-20px`.
- Price can be visually stronger, but avoid huge price blocks that push CTA away.
- Availability must be readable and compact.
- Filters and sort controls should be reachable before long explanatory text.
- Empty/error/loading states should be clear but not oversized.

Product detail pages:

- Product title can use `24-28px` on mobile only if the buy box remains visible quickly.
- Price, availability, quantity, add-to-cart and buy-now should stay close together.
- Specs should use compact table/list typography.

## Implementation Rules

When redesigning a component:

- Start from the mobile scale and add larger breakpoints deliberately.
- Prefer semantic utility patterns over arbitrary one-off font sizes.
- If a heading needs more than two mobile lines, reduce copy first, not only font size.
- Keep touch targets at least `44px` high even when typography is compact.
- Check Georgian text specifically; Georgian glyphs need enough line height but not excessive whitespace.
- Check `375px`, `768px`, `1024px`, `1440px` before accepting a slice.

## Red Flags

Avoid these patterns:

- Mobile H1 larger than `32px` for regular pages.
- Body copy with line height above `24px` on mobile.
- Section padding above `40px` on mobile before product/catalog content.
- Multiple intro paragraphs before product grids.
- Cards with large header, large image, large description and CTA all stacked without density controls.
- Using visual decoration to fill space before useful ecommerce content.
