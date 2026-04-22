# Indexing Matrix

## Environment Rules

- Local, staging, and preview environments must set `NUXT_PUBLIC_ALLOW_INDEXING=false`.
- Production must set `NUXT_PUBLIC_ALLOW_INDEXING=true` only on launch day.
- When indexing is disabled:
  - every page returns `robots: noindex, nofollow`
  - `robots.txt` returns `Disallow: /`

## Always Noindex Routes

These routes are blocked in every environment, including production:

| Route pattern | Production robots | Reason |
| --- | --- | --- |
| `/cart` | `noindex, nofollow` | transactional page |
| `/wishlist/**` | `noindex, nofollow` | user-specific state |
| `/checkout/**` | `noindex, nofollow` | transactional flow |
| `/profile/**` | `noindex, nofollow` | private account area |
| `/login` | `noindex, nofollow` | auth page |
| `/register` | `noindex, nofollow` | auth page |
| `/forgot-password` | `noindex, nofollow` | auth recovery |
| `/reset-password/**` | `noindex, nofollow` | auth recovery |
| `/activate/**` | `noindex, nofollow` | account activation |
| `/resend-activation` | `noindex, nofollow` | auth support |

## Public Page Targets

| Page type | Example URL | Staging | Production target | Canonical rule | Notes |
| --- | --- | --- | --- | --- | --- |
| Home | `/` | `noindex` | `index, follow` | self canonical | launch-critical |
| Public CMS/info pages | `/contact`, `/delivery`, `/returns`, `/payment-methods`, `/privacy-policy`, `/terms` | `noindex` | `index, follow` | self canonical | backend `seo_noindex` defaults must be corrected before production |
| Catalog landing | `/catalog` | `noindex` | `index, follow` | self canonical | query policy handled separately |
| Product detail | `/catalog/product-slug` | `noindex` | `index, follow` | self canonical | launch-critical |
| Blog landing | `/blogs` | `noindex` | `index, follow` | self canonical | launch-critical |
| Blog detail | current single-view route | `noindex` | `index, follow` | self canonical after URL refactor | URL contract will be fixed in a later task |

## Query And Filter Policy

- Current query-based listing URLs are temporary and should not become the long-term SEO architecture.
- Category and blog taxonomy URLs will move to slug-based routes in a later task.
- Pagination, filter, and internal search canonical rules will be finalized after the URL architecture task.
- Until production launch:
  - staging remains fully blocked from indexing
  - production query strategy is not considered complete

## Production Launch Switches

Before production go-live:

1. Set `NUXT_PUBLIC_SITE_URL` to the final public domain.
2. Set `NUXT_PUBLIC_ALLOW_INDEXING=true` only on the production environment.
3. Keep `NUXT_PUBLIC_ALLOW_INDEXING=false` on staging forever.
4. Verify backend `seo_noindex` values for public CMS pages.
5. Add `sitemap.xml` in the sitemap task so `robots.txt` can advertise it.
