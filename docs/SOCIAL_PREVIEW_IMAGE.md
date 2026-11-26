# Shared social preview image

The owner selected the modern silver car / headlight / mirror / grille banner on
2026-11-26. It is bundled with the frontend at
`public/images/social/flexdrive-og-modern-v1.jpg`: JPEG, 1200×630, 166,103 bytes.
The final JPEG was visually inspected after export from the approved generated
image. It is used only in metadata; no visible page banner was replaced.

## Selection rule

- Product detail: the existing real product SEO/primary/gallery photo. Without
  a real photo, use the shared banner. The catalog gallery placeholder and common
  banner do not become invented Product JSON-LD photography.
- A real CMS blog article (`isSingleView` + `BlogInner`): retain the backend's
  existing `seo.image` choice, including its existing cover/teaser fallback.
  Missing article images use the shared banner.
- All other pages: the same bundled banner, including home, catalog, category,
  searches, blog listing, contact and legal pages. Existing CMS page/category/
  site-wide images and the old image ENV do not override this social-image rule.

`app/utils/socialImage.ts` owns the asset path, alt text and dimensions;
`useSocialImage` writes matching OG/Twitter URLs. All are absolute against the
existing public `siteUrl`. The common banner declares its actual JPEG type and
1200×630 dimensions. Dynamic photos do not inherit those dimensions/type because
their actual dimensions are unknown. Reactive getters keep metadata correct when
a reused CMS page changes between an article and an ordinary page.

Existing `defaultSeoImage` runtime/CMS settings remain available to their other
consumers, such as organization/publisher JSON-LD. Their code fallback now uses
the bundled banner. Titles, descriptions, canonicals, robots/indexing, access
controls, tracking, visible content and payment flows retain their current rules.
Private pages retain their access/noindex protections; selecting a common social
image does not make protected pages publicly shareable.

## Deployment

Push and deploy the **frontend** with the JPEG, both new helper files and the
updated source. No backend change, database migration, CMS upload or new ENV is
needed for this feature. The same asset ships to development and production.
Development still uses the existing local site URL and indexing protections.

After deployment, check these public pages' initial HTML: home, catalog,
category/search, one product, blog listing and one article. The common image URL
must return HTTP 200 with `Content-Type: image/jpeg`, without login; real product
and article links must still declare their own image URLs. These are post-deploy
checks, not evidence that the local source is already live.

If Facebook/Messenger shows a stored older preview, inspect the affected URL in
Facebook Sharing Debugger and use **Scrape Again**. Old messages/posts need not
update automatically; no blanket cache reset or external re-scrape was performed.
For a later replacement image, use a new versioned filename rather than replacing
the bytes at this URL, then update the constant.

## Verification

Actual Vue setup and Unhead SSR/client-head checks cover one authoritative image
tag, common images despite old CMS/ENV values, category override suppression,
real product SEO/tablet photos, no-photo fallback, genuine article vs other single
views, reused CMS navigation and absolute environment-specific URLs. Existing
title, request-local Pinia, error/404, structured-data and product-content checks
are included. Test transports are mocked; no live crawler refresh, provider HTTP,
tracking event, browser/server start, commit, push or deployment is required.

The reactive `useSeoMeta` getter pattern follows the Nuxt 4 documentation:
https://github.com/nuxt/nuxt/blob/v4.0.0/docs/3.api/2.composables/use-seo-meta.md

Final local checks: **90 tests passed** across SEO/title/Pinia/errors/structured
data/product content/catalog refinement/search/vehicle makes; scoped ESLint and
strict app `vue-tsc --noEmit --project .nuxt/tsconfig.app.json --strict` passed.
Whitespace checks passed. Full Nuxt build and browser checks were not run.
No source was committed, pushed or deployed.
