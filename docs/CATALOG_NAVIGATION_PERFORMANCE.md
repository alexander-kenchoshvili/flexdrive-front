# Catalog navigation performance — 2026-10-23

## Measured problem

On the existing online Chrome session, repeated homepage → catalog → Back
navigation requested the make list every time. With browser caching enabled and
no network throttling, three recorded catalog visits showed:

| Request | Visit 2 | Visit 3 | Visit 4 |
| --- | ---: | ---: | ---: |
| Vehicle makes | 3.06 s | 2.67 s | 2.33 s |
| Products | 328 ms | 522 ms | 375 ms |
| Categories | 147 ms | 288 ms | 130 ms |
| Catalog CMS content | 311 ms | 288 ms | 221 ms |

Public online category and CMS responses independently returned
`X-Cache-Status: HIT`. Those caches are working. The make endpoint has no response
cache. Catalog setup waits for makes alongside products, so the slow auxiliary
request delays the whole component.

## Scoped implementation plan

1. Replace the make queryset's multiplying joins with existence checks. Preserve
   the old two independent eligibility conditions, returned fields and ordering.
   Compare old/new results on edge-case fixtures and the local read-only database.
2. Share successful make responses for five minutes within one Nuxt application.
   Deduplicate concurrent consumers. Preserve SSR request isolation and hydration;
   failed requests remain retryable. This cache contains reference options only.
3. During client navigation, start loading makes without awaiting them before
   showing products. Keep SSR's complete initial data and show an explicit pending
   make control. A delayed response must not update an unmounted component.
4. Run focused backend/frontend regressions, typecheck/lint and before/after local
   measurements. Online improvement requires deployment of the changed repos;
   verify the same browser navigation after that deployment.

Product results, price/stock freshness, CMS caches, page transitions and scroll
coordination are outside this change. No migration, new dependency, environment
change or additional Redis response-cache group is required.

## Validation

Implemented all three scoped changes. `useState` holds serializable make options
per Nuxt app/request; a WeakMap keyed by that app deduplicates in-flight requests
without sharing SSR data between visitors. Empty successful results are cached,
expiry refreshes the options, and errors are not cached. Only make options can be
up to five minutes old; product prices and stock continue fetching normally.

The Django queryset uses two `Exists` checks rather than two multiplying reverse
joins. The separate eligibility checks intentionally preserve existing behavior,
including mixed engine/model cases. Django's documented multi-valued filtering
and `Exists` behavior informed this choice. Nuxt's documented SSR isolation and
shared `useState` behavior informed the client cache.

- 87 backend tests pass on disposable in-memory SQLite, with temporary media and
  outbound network blocked: new make regressions, vehicle-search cache tests,
  refinement facets, header filters and search regressions.
- 58 frontend make-cache/catalog/header/pagination tests pass, plus four focused
  catalog error/category tests (62 total). Coverage includes concurrent consumers,
  TTL/empty responses, failure retries, hydration, separate SSR requests, client
  readiness before makes, SSR waiting, and late replies after unmount.
- Nuxt typecheck, scoped ESLint and whitespace checks pass.
- Read-only local database comparison: the same 12 make IDs in the same order on
  all five runs; median queryset time **481.76 ms → 8.92 ms**. The updated full
  endpoint returned 200 in **12.07 ms**, with one SQL query. Local SQLite timings
  do not predict deployed PostgreSQL/network latency.

Two pre-existing product SEO test-harness failures remain outside this change:
`seoFailures.test.mjs` lacks the product gallery-preloader mock. The broader old
`CatalogAPITests` fixtures also omit mandatory `internal_sku`, failing before API
execution. Neither those fixtures nor product behavior were changed to expand
this task. The focused compatible suites above pass.

## Rollout and remaining online verification

Deploy the backend first or deploy both repos together. No migration or new
environment setting is needed. Push/deploy remains user-owned; no deployment,
business-data change, provider change or dev-server start was performed here.

The browser baseline above is from the current online deployment. After deploying
these changes, repeat homepage → catalog → Back several times, with browser cache
enabled and no throttling. Products must appear without waiting for a delayed
make request; repeat visits within five minutes must reuse the make response.
Check the disabled/loading make control on desktop and mobile, then expiry/error
recovery and a direct SSR catalog load. Online improvement is not yet claimed.
