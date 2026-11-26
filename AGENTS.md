# Project Instructions

## Customer Credo Confirmation Copy Clarified - 2026-11-26

- Owner rejected showing merchant settlement wait to customers. Shared public
  order/profile/tracking presentation now labels Credo pending AND paid as
  "განვადება გაფორმებულია"; cancellation/refund/card wording stays unchanged.
- Active initial Credo success description confirms purchase received, preparation
  for delivery and repayment per agreed Credo schedule. Shipped/delivered/cancelled
  states retain existing description. No internal payment/order state changed.
- Existing46 checkout checks updated/passed; scoped ESLint and app vue-tsc checked.
  No backend/ENV/DB/provider action/server/browser/deploy. Prior return/closure
  handoff remains; full create URL/return config still awaited from bank.

## Credo Local Pilot Return Flow Prepared - 2026-11-26

- Owner requested local test preparation; real bank loan not created. Full create
  POST URL still absent in public docs. Owner asked bank for it and return/success
  configuration; awaiting reply. Backend local flags still OFF/test mode ON.
- Status page now keeps the local tab open; explicit safe bank link opens a new
  tab via native anchor/noopener/noreferrer with instructions. On trusted12/5 and
  valid order UUID it automatically replaces route with order success. Review and
  malformed tokens cannot become success. Legacy continue query is consumed with
  no automatic bank navigation/re-POST. No invented return URL parameter.
- Focus/visibility refresh reads local state immediately; coalesces overlapping
  requests and cleans listeners. Pending Credo uses existing awaiting-settlement
  label, never paid. Both cart and BuyNow share this flow; BOG preserved.
-46 checkout checks pass (new automatic order routing, pending label, focus/cleanup
  cases). Scoped ESLint and strict app vue-tsc passed main UI change. Backend has
  87 regression +12 final local-only pilot checks; closure/watch commands prepared
  but not running. See backend docs/CREDO_INTEGRATION_PLAN.md dated update.
- No server/browser/full build, bank/Wingo/tracking request, ENV/working DB change,
  production migration or deploy. Keep OG/social/HeaderSearch/compact cards intact.

## Shared Social Preview Banner Prepared - 2026-11-26

- Owner approved the generated modern champagne-silver car/headlight/mirror/grille
  image. It is bundled at public/images/social/flexdrive-og-modern-v1.jpg:
  1200x630 JPEG,166103 bytes; visually inspected after export. No page hero changed.
- Shared useSocialImage + utils/socialImage own OG/Twitter image URLs, alt and
  known banner dimensions/type. URLs use existing siteUrl for each environment.
  Genuine product SEO/primary/gallery photos and real CMS BlogInner article API
  seo.image stay dynamic. Every other page uses this one banner, including home,
  catalog/category/search, blog listing/contact/legal. Old CMS/ENV preview images
  cannot override that rule; category's separate image override was removed.
- Missing real photos use the banner; no Product JSON-LD photo is fabricated.
  Dynamic photos do not inherit banner dimensions/type. Reactive getters follow
  Nuxt4 useSeoMeta docs and restore metadata across reused CMS navigation.
- Existing organization/publisher image settings remain available to those
  consumers; their runtime code fallback now points to the bundled image.
  Titles/canonicals/robots/access/tracking and visible shopping flows unchanged.
-90 frontend source/SSR/client-head/catalog/product checks, scoped ESLint, strict
  app vue-tsc and whitespace pass. Test harnesses now supply missing existing
  vehicle-interest dependency (no event/HTTP). No browser/full build/server start,
  backend/DB/ENV/migration/provider/cache-refresh/commit/push/deploy action.
- Owner handles frontend push/deploy only; no new ENV/CMS upload/migration.
  docs/SOCIAL_PREVIEW_IMAGE.md has source rules and post-deploy checks. Actual
  Facebook/Messenger/Telegram preview delivery remains to verify after deploy.
  Prior checkout/Credo/HeaderSearch and all unrelated edits were preserved.

## Compact Desktop Checkout Payment Choices - 2026-11-26

- User approved mobile appearance and requested compact elegant desktop payment
  cards. Shared checkout payment grid now uses three equal minmax columns only
  at769px+. Cards have124px minimum (not fixed) height,16px padding/radius,14px
  titles/12px descriptions,28px max logo height and bottom-aligned logos/brands.
- Duplicate card icon/status badge hidden only in desktop payment scope; card
  availability description remains. Enabled Credo terms appear once below the
  desktop grid; full per-radio descriptions remain screen-reader accessible.
  Mobile0–768 and other BaseChoiceCard uses retain layout/styles. Common card
  gained data hooks only; native controls/events/disabled/selected unchanged.
- Both cart/BuyNow inherit the shared form. No prices/payment/validation/API/
  backend/ENV/DB changes.43 existing checkout checks, scoped ESLint, strict app
  vue-tsc, PostCSS syntax and whitespace pass. No new tests/full build/browser/
  server start/deploy. Final desktop visual review remains with owner. Existing
  HeaderSearch.vue edits and all ongoing Credo integration work preserved.

## Credo Local Backend Schema Applied - 2026-11-25

- User explicitly authorized local backend DB migrations. commerce0047/0048 now
  applied to workspace db.sqlite3 after a verified ignored SQLite backup, in one
  transaction. Independent READ ONLY verifies exact new empty tables/columns,
  unchanged original business rows/schema/metadata, only expected migration,
  content-type and permission additions. No user permissions were granted.
- Fresh backend ORM/check passes; zero pending local migrations. This supersedes
  older local-migration-pending notes. Production DB/ENV/deploy remain untouched.
  Both bank request flags OFF/test mode ON; no bank/Wingo/tracking requests.
- Next owner review/controlled-test access/configuration precedes an agreed
  deployment and first real bank request. No frontend/browser server started.

## Credo Checkout And Georgian Payment Choices Prepared - 2026-11-25

- User authorized phased Credo integration; canonical plan is backend
  docs/CREDO_INTEGRATION_PLAN.md. Both checkout paths now use two Georgian choices
  with official public/payments SVGs, server availability, shared start API and
  /checkout/credo/<uuid> status page. One Shop ID, one bank environment; requested
  offer is local intent, no undocumented initial slider/term parameter or promise.
- Backend now maps Credo settings and stores user-authorized credentials ONLY
  in ignored/untracked backend .env. Never repeat/copy values to frontend/docs/Git.
  New starts OFF/status HTTP OFF/test mode ON. No bank/Wingo API request,
  schedule, production migration or deploy. Existing BOG/COD handlers retained.
  Credential presence alone cannot enable requests;79 focused config checks pass.
  Backend commerce0047/0048 are now applied locally; still required before the new production backend.
- Financed total includes delivery. Owner RESOLVED pricing: merchant absorbs3%
  for BOTH offers, customer surcharge0; continue financial step9. COD is retained
  legacy code, unused; current active payment is card only.
  Backend freezes merchant-paid3% and customer surcharge0; cash/fee/net are
  separately recorded from a statement. Browser Purchase requires server
  purchase_eligible; preserves original value/event ID and excludes test/review.
  Credo receipt needs actual payment and scoped owner proof.
  Production keys/configuration and real activation remain later agreed stages; never read/store secrets
  in tracked files or browser. Source-only work is authorized, not live tests.
- Local status GET is owner-bound/no-store. Start returns a signed HttpOnly access
  cookie; session recovery stores only UUID plus source/account context, no bank
  link/buyer number/secret. Replace local continue flag before external navigation;
  Back/reload does not re-POST or redirect-loop. Exact bank origin/path allowlist.
  API failure never means rejection; server controls when checkout can restart.
- Read-only backend Credo admin, safe Wingo signed12/pending fulfillment and blocked
  cross-provider cancellation/returns are prepared. Step9 accounting/Purchase is
  now prepared: bank5 enables real consented Purchase, actual cash still needs
  explicit statement confirmation. Signature/return alone never means Purchase.
-43 checkout checks (20 new Credo +23 existing), scoped ESLint and strict app
  vue-tsc pass. Backend broad381/focused131 checks pass in isolated memory SQLite.
  No browser/full build or PostgreSQL concurrency proof. HeaderSearch.vue was
  already modified before this task; preserve that unrelated change.

## Unified Mobile Search And Compact Catalog Chips - 2026-11-25

- User approved changes only0–768px. Outside home/catalog listing, one button
  styled as a search field opens a full-height existing HeadlessUI dialog with
  the sole editable query, existing filters and one fixed footer submit. Shared
  text/state/handlers/VIN/route builder retained; close preserves drafts and focus
  targets the query. Old separate detail trigger removed;769+ layout unchanged.
- Mobile catalog retains direct header text search and its own filter sheet.
  Duplicate query/clear banner is hidden only0–768; compact query and existing
  filter chips emit individual removal, no global clear in the results toolbar.
  Query removal clears shared text and resets pagination while preserving other
  conditions; vehicle removal reuses the original grouped-car reset. Badge counts
  filter groups plus nondefault sorting, excluding the separate query chip.
-106 focused header/catalog checks pass, including one editable query/submit,
  open-close draft retention, VIN and query removal/Back. No full build/browser
  visual check, backend/schema/ENV/provider change, push or deploy. Frontend only.

## Checkout Mobile Typography And Report Date Layout - 2026-11-25

- User requested styling only0–768px inclusive. Both cart/Buy Now checkout hide
  the intro title/teaser/count and buyer-type descriptions. Shared card/summary
  headings use18px/24px; marked helper/terms/choice text and input hints12px/18px.
  Navy action-bar total/label gain high-contrast light-theme colors; dark colors
  and769+ presentation unchanged. Inputs, validation, prices and submit unchanged.
- Seven business date forms share a scoped period-control grid; native dates
  width100%/min-width0, labels stack at480px and below, actions follow, timestamp
  spans the row. Uses existing design-system.css and explicit scope hooks; no JS.
-52 existing checkout/business checks, CSS syntax, scoped ESLint/strict app
  vue-tsc pass. No new tests, full build/browser visual review, backend/DB/ENV/
  migration/provider action/commit/push/deploy. Frontend deployment required.

## Checkout Last Step, Meta Events And Mobile Search Prepared - 2026-11-25

- Completed source work in requested order: last saved checkout step/time is
  highlighted from existing history; no inferred exit reason or new collection.
  New private /business/meta-events API/page/menu separates allowlisted Pixel and
  CAPI counts, status/freshness/daily data, last7 Tbilisi days, entire dataset scope.
  Missing stays unknown; browser/server are not added as deduplicated purchases.
- LIVE BLOCKER: existing Meta credential returns HTTP400/code100 Permission denied
  for Pixel stats. Completed reader was live-tested and returns unavailable/null,
  not zero. No alternative distinct CAPI token. Exact underlying access cause not
  established; no grants/token/provider configuration changed. Do not claim real
  counts imported; successful live payload still needs verification after access.
- Mobile search only0–768 inclusive: home remains expanded, catalog retains own
  filters, internal detail/checkout/other pages use query + detail bottom sheet.
  Same instance/state/VIN/filter/submit handlers; no second query/checkout form.
  Drafts survive close/reopen/resize;769+ original inline layouts remain.
-88 focused frontend navigation/auth/SSR/search checks and23 backend checkout/
  Meta/marketing checks pass; scoped ESLint/strict app vue-tsc pass. Real Vue click
  tests cover375/768/769, core boundaries320/768/769/1280, both checkout paths,
  product detail, one navigation and VIN. No full build/browser visual review,
  new tracking/provider events, DB/migration/ENV changes/commit/push/deploy.
- Deploy both repos, no migration. Google devices/new-user views unchanged.
  docs/CHECKOUT_META_MOBILE_SEARCH_2026-11-25.md records scope and access blocker.

## Dedicated Payment Problems Page Prepared - 2026-11-25

- User requested direct access to payment failure investigation. New protected
  /business/payments appears as გადახდის პრობლემები under Our shop. Overview
  attention card/fact links point directly there. Login return whitelist/icon/
  route dispatch and Foundation fallback types include the new section.
- Reuses BusinessOperations payment mode and existing private operations API;
  no second payment report or backend endpoint. Payments page retains existing
  status filters, page controls, raw counts, grouped failures and collapsed full
  history/later paid order. Other operational sections appear only in Operations,
  which now has a direct payment-page link instead of the repeated payment list.
- Auth expiry/denial returns to the correct page; ordinary Operations default
  preserved.33 focused route/auth/SSR/payment/organization checks, scoped ESLint
  and strict app vue-tsc pass. No full build/browser/new tracking/DB/API/schema/
  migration/provider action/push/deploy. Frontend deployment required.

## Registered Cart Owner Display Prepared - 2026-11-25

- User explicitly requested whose account owns each registered current cart.
  Private current-contents rows add optional owner_account with account ID,
  saved first/last name and email. Frontend shows name/email under the cart;
  blank name falls back to email, then account ID. Guests remain unknown.
- Only existing dashboard permission/session/no-store report exposes this; no
  phone/address/auth data or inferred guest/order identity. Addition history and
  analytics storage/provider events remain unchanged. User data is prefetched in
  one bounded page query (4 total with accounts, existing guest-only case3), no N+1.
-9 focused backend source/cart/access checks and7 frontend organization/render
  checks pass, including guest privacy and HTML escaping; scoped ESLint/strict
  app vue-tsc pass. Both deployments needed; no migration, production read/write,
  build/browser/commit/push/deploy. Previous payment-layout edits retained.

## Payment Attempt Presentation Simplified - 2026-11-25

- User requested removing repeated payment failure/history text. Operations now
  groups failed sale rows without orders only when the backend supplies complete,
  identical matched checkout-history IDs. Missing/overlapping/limited histories,
  other states and already linked orders remain separate. Grouping is limited to
  the current fetched page; pagination, raw totals and status filters unchanged.
- Shared failure kind/code is shown once with an attempt count. One closed-by-
  default history retains each ID/status/time/amount/delivery and later paid
  order/refund settlement; different failure reasons remain attributable.
- Missing order label now explains that a failed attempt did not create an order.
  A paid sale without an order remains explicitly flagged for review; older or
  other actions use a neutral missing-number label. No person identity inference.
-12 focused operations/payment SSR/composable checks, scoped ESLint and strict app
  vue-tsc pass. Frontend deployment required; no backend behavior/schema/migration,
  financial calculation, payment action, build/browser/commit/push/deploy.

## Business Panel Source Reorganization Prepared - 2026-11-25

- Approved ordered20-step implementation documented in backend
  docs/BUSINESS_PANEL_REORGANIZATION_PLAN.md. Navigation separates shop/Google/
  Meta/diagnostics; old URLs and payment failure/attempt, checkout, VIN-demand,
  financial, page/device, source/search and social details remain available.
- Overview has six linked source-labelled metrics and at most three factual
  attention items. GA4 has audience/acquisition/pages+devices/internal search/
  journey tabs; Search Console is separate. New/returning users and daily/first
  source counts come directly from a new private backend audience report.
- Carts have current contents/additions/product interest/started-purchase tabs.
  Existing checkout component is reused. Successful cart requests include optional
  observation ID only on canonical production host, with analytics consent and
  internal/business traffic excluded. No extra pixel/GA event or cookie added.
  Backend confirms mutations and deduplicates observation IDs; no past backfill.
- Meta campaigns show objective/current status, appropriate result and cost,
  explicit attribution/currency/timezone; expanded details retain original metrics.
  Social cards and technical diagnostics moved to their own pages. Missing/stale
  values do not become zero; configuration is not proof of event delivery.
-90 business frontend checks, scoped ESLint and strict app vue-tsc pass. Backend49
  focused checks pass; broader existing failures are documented in backend plan.
  No full build/browser/live analytics event/commit/push/deploy. User owns both
  deployments and backend business0004_cart_addition migration. No new ENV.

## Aggregate Device Report And Payment Attempt Context - 2026-11-20

- User requested clear saved-bank failure reasons/history and mobile vs desktop
  visits/purchases. BusinessOperations now renders the optional backend attempt
  context: allowlisted translated reason/code, delivery totals, bounded related
  attempts, later confirmed purchase and explicit causal/identity limits. Older
  backend responses retain the existing warning. No arbitrary bank text rendered.
- BusinessUsers adds independent BusinessDevices card for the selected period:
  GA4 sessions/purchase events, mobile/desktop-laptop/tablet/unknown counts and
  separate shares. Reuses business private session/date/no-store conventions,
  abort/generation/auth handling and existing theme tokens. Native scrolling table.
  Missing/config/unavailable/stale/thresholded data and zero-total shares differ.
- No new tracking, cookies, purchase sending, per-order device field or historical
  attribution. GA4 coverage can differ from financial orders; UI says so. Desktop
  and laptop share one category. Backend also scopes admin display time to Tbilisi.
-16 actual-SFC/composable device/page/payment checks, scoped ESLint and strict app
  vue-tsc pass; earlier existing businessOperations checks also passed. Real GA4
  aggregate read verified in backend. No full build/browser/events/DB write/push/
  deployment. User owns both deployments; no new migration or ENV for these changes.


## Checkout Personal Number And Accountant Buyer Details - 2026-11-20

- User explicitly requested individual personal number for transport waybills and
  private buyer details in accountant HTML/Excel. Both cart and Buy Now use the
  same required individual-only 11 ASCII digit text field with Georgian purpose
  hint, client/API validation, error focus and idempotency reset on edits. Legal
  buyers retain company ID/VAT flow; no contact person's personal number required.
- Personal number stays in form memory and private backend order/payment snapshot;
  excluded from browser drafts, profile backfill, public/owner summaries, receipts,
  analytics, bank requests and Wingo payloads. Switching buyer type clears it.
- Paired backend adds commerce0046 Order.personal_number and pages0087 privacy
  notice. Old orders/in-flight bank snapshots remain valid with blank number.
  Accountant shows saved order names/contact, delivery address, type-specific ID,
  company name and phone; Excel adds one buyer row per order on a separate sheet.
- 23 focused draft/schema/render/actual-page-payload tests, scoped ESLint and
  strict vue-tsc app check pass. No full build/browser/live provider or production
  DB operations. Both deployments and backend migrations required; migration
  must precede new backend code, then deploy frontend promptly for required field.
  User owns push/deploy. No existing order/payment/Wingo mutation.


## Compact Vehicle Clear Appearance - 2026-11-20

- User requested smaller select X, especially on phones, with no circular badge.
  BaseSelect clear control is now transparent/borderless, subtle rounded keyboard
  focus only;20px button/12px icon below768,24px/14px otherwise. Existing clearable
  opt-in, disabled guard, type=button, stop, scalar clear and focus restore unchanged.
-98 focused select/header/catalog checks and SFC compile/whitespace pass. No full
  build/browser/backend-data/ENV/migration/deploy/push. User owns frontend deploy.
  Companion backend change only reorganizes/relabels the admin menu.


## Individual Vehicle Clear And Search Focus - 2026-11-20

- User narrowed request to individual X controls (no new dropdown search). Shared
  BaseSelect adds opt-in single-value clearable; enabled only make/model/year in
  HeaderSearchFilters, desktop CatalogFilters and CatalogMobileFilterSheet.
  Separate type=button emits existing empty scalar, obeys disabled, reserves label
  space, restores control focus. Default checkout/other/multiple behavior stays.
- Existing handlers unchanged: clear make resets model/year; clear model keeps make
  and resets year; clear year keeps make/model. Existing engine/variant invalidation,
  unrelated filters, header draft/submit, desktop auto-apply and mobile Apply stay.
- All header search surfaces use theme focus tokens for green enclosing focus;
  remove separate input browser ring. No global focus/checkout styling change.
  Mobile/desktop vehicle-chip text and X icons align centrally and wrap long text;
  accent-soft/background/border tokens work in both themes. No resize JS added.
- 104 focused shared-select/header/catalog/refinement checks pass, including 15 new
  clear/dependency regressions. Scoped ESLint and all7 SFC script/template/CSS
  in-memory syntax checks pass; whitespace clean. No build/browser/live events/
  backend/DB/ENV/deploy/push. User owns visual review; no all-viewport visual claim.


## Vehicle Label Visible On Mobile - 2026-11-19

- User approved a compact vehicle-only label above mobile Filter/Sort; no status
  copy or visible "vehicle" prefix on either layout. Desktop keeps existing place.
- Mobile receives existing applied selectedVehicleLabel (including version), hides
  when empty, reuses handleRemoveActiveFilter('vehicle') and existing pending guard.
  No VIN/filter/query/analytics behavior changes. Existing complementary lg CSS
  visibility covers mobile/tablet below1024 and desktop1024+. No resize JS added.
- Full-width mobile chip uses flexible wrapping, overflow-wrap:anywhere and fixed
  close mark; results grid child gets min-w-0. Desktop text wraps long tokens too.
- Three changed Vue SFCs pass in-memory compiler syntax checks; git diff --check
  passes. No build/test suite/lint/typecheck/browser/prod/deploy operation. User
  owns visual verification; do not claim every viewport visually verified.


## Header Redesign Search Logic Audit - 2026-11-18

- User explicitly requested confirming search/filter logic survived the full header
  redesign. Compared changes to HEAD and ran actual setup/router/catalog tests.
- Found and reproduced one inline-only regression: props.inline treated the search
  surface as permanently open, so Escape retained hidden suggestions that ArrowDown
  +Enter could select. New desktop+mobile regressions failed before fix. Restored
  open-state gating; kept inline dependent model/year loading independent of popup.
  Closing now invalidates queued/in-flight suggestions; reopening fetches current.
- 80 targeted header/catalog/template tests pass, including ten inline cases for
  mobile/desktop suggestions, Enter/button submit logic, VIN reset then part+variant
  retention, category/engine/refinement preservation, page reset, draft resize,
  hidden selection and stale response rejection. Two old template tests updated
  to assert user-requested absence of transient VIN loading text and persistent
  no-coverage feedback. VIN decoder used fixtures; no claim live vPIC availability.
- Native Chrome local868px verified automatic real local suggestions, Enter ->
  /catalog?q=capot (Georgian text), then embedded toolbar Search -> q=FD-01-0001.
  No observed JS errors. Native session reset. Earlier native resize checks remain.
  No production/backend/schema/ENV/events/push/deploy/full-build operation.


## Header Resize Fixed In Native Chrome; Mobile Suggestions Restored - 2026-11-18

- Latest user explicitly restored mobile typing suggestions and requested compact
  controls below640px. Suggestions now use the existing debounce/filter/result
  pipeline on mobile too. Applying full catalog filters still uses Search/Enter.
- Native Chrome Computer Use (NOT Playwright) reproduced fresh hydration class
  mismatches and insertBefore failure at1400->375 before this fix. Earlier isolated
  nonhydrating renderer check was insufficient; previous hardening note superseded.
- Parent custom-target Teleport subtree is now ClientOnly, with fixed parent/input/
  feedback targets and a height fallback. Viewport-dependent button row classes
  use CSS media variants. Same mounted search state/handlers; no resize remount.
- Native local Chrome fresh reload now has no hydration warnings; home transitions
 375->1400->375->1089->768->639->439 retained typed text with no observed runtime
  errors. Mobile capot query returned five real local suggestions automatically.
  Fresh catalog439->1400->375 also had no observed console errors/warnings and
  retained compact search/no duplicate header dropdowns. Nuxt development info
  messages remain. This is targeted verification, not an all-browser guarantee.
- Tailwind below640: dropdown36px/12px font, query40px/14px font and12px placeholder,
  Search40px/14px font; reduced gaps/padding. Existing440/768/1089/1248 layout
  breakpoints and Wishlist stay. Hero unchanged. No backend/ENV/migration/deploy.
- Native CUA session reset after verification. Whitespace check passed. No full
  build/broad test suite. User owns frontend push/deploy and further visual review.

## Header Resize Hardening And Wishlist Restored - 2026-11-18

- User reported actual Chrome Vue update/insertBefore anchor and emitsOptions
  errors while dragging viewport size, and requested Wishlist remain in header.
  Restored header Wishlist at all sizes; removed our added mobile-menu duplicate.
  Earlier wishlist-in-burger notes are superseded.
- Feedback Teleport target now stable after mount; only disabled follows media.
  Outer filter-container relocation runs nextTick after inner search relocation,
  post-flush, reading current phone media rather than a stale captured width.
  Teardown blocks queued relocation. Search component/state is not remounted.
- Focused isolated check compiles ACTUAL Header+HeaderSearch with installed
  Vue3.5.26 and strict DOM-style insertBefore anchor validation.114 boundary
  transitions across home/catalog + typed draft:0 errors/warnings,1 search instance,
  retained draft. No network/provider events. Fresh isolated baseline did not
  reproduce user's existing Chrome/HMR failure, so do NOT claim browser root
  cause or real-browser resolution proven by this check. User should full reload
  and repeat resizing. No production build/broad suite/browser run performed.


## Mobile Search Form Single Column - 2026-11-18

- User approved revised mobile proposal with explicit one-input-per-row: below768
  non-catalog header form shows query first, then make/model/year/categories each
  full width, then one full-width48px Search button. Enter/submit/draft behavior
  unchanged; no automatic product requests. No mobile Clear text.
- On these pages only logo/account/cart/burger toolbar stays sticky; query/form
  remains with the normally scrolling filter block. Empty compact-search target
  hidden. Catalog retains its compact sticky search with embedded submit and no
  duplicated dropdowns. >=768/tablet/desktop controls and hero unchanged.
- Existing responsive Teleports select presentation targets only; same state,
  fields and handlers. Local VIN feedback stays with form except compact catalog.
  No builds/tests/browser checks, backend/data/ENV or deploy actions.


## Catalog Header Keeps Search Without Duplicate Filters - 2026-11-18

- User authorized hiding header's four dropdowns on catalog listings only after
  discussion. Header matches /catalog and /catalog/category/:slug (optional trailing
  slash); product detail/other routes/home retain previous header controls.
- HeaderSearch hideVehicleFilters prop removes only inline dropdown UI. Same search
  component stays mounted; route-derived make/model/year/variant/categories persist.
  Existing catalog refinements remain; engine retained for this search-only mode
  because there is no header vehicle change to invalidate it. Explicit VIN still
  starts a new vehicle with the existing reset rules; clear behavior unchanged.
- Desktop listing header uses wide text/VIN field + existing Search/Clear. Below
 1089 search remains in toolbar; empty lower band is CSS-hidden without unmounting.
  Autocomplete/VIN feedback stays visible in toolbar feedback target even though
  the source band is hidden; outside-click ignore already covers that target.
- Catalog's existing sidebar/mobile filter panel is unchanged. No backend/data/
  ENV/deploy. No builds/tests/browser checks per user's ongoing instruction.


## Mobile Header Search Is Explicit - 2026-11-18

- User explicitly requested below768px text/vehicle/category drafts apply together
  only on Search/Enter. Existing header filter handlers already do not navigate
  before submit; automatic product suggestions were the visible auto-search.
- HeaderSearch now skips suggestion scheduling/fetching and hides the suggestion
  popup/list below768px. On resizing into mobile, suggestion state is invalidated;
  queued debounce and in-flight results are guarded too. Mobile Enter cannot pick
  a stale desktop suggestion. Desktop/tablet>=768 keep current suggestions.
- Vehicle option loading stays enabled to populate dependent selects; it is not
  a product search. Explicit submit/Enter, VIN decoder, filter params, routing,
  analytics and layout unchanged. No builds/tests/browser checks per user request.


## Header Responsive Iteration And Mobile Design - 2026-11-18

- User owns visual review and explicitly prohibits builds/tests/browser checks
  during these layout iterations. No such checks run. Frontend source edits only;
  no backend/ENV/data/deploy. Search/filter/VIN parameter logic unchanged.
- HeroSection.vue RESTORED byte-for-byte from original HEAD on explicit request;
  do not simplify hero again. Earlier hero-removal note below is superseded.
- Nav16px, centered whenever visible; burger below1089px. Search/filter one row
  at1248+, filters above search at1089–1247. Below1089 existing input teleports
  into toolbar, no visible label/Clear, submit inside border. Safe SSR default
  disabled Teleport to#teleports; custom targets only after mounted. Ignore
  relocated controls in outside-click handling. Same form ID/handlers/state.
- Below768 user approved latest mobile proposal: logo/account/cart/burger first
  row, full-width search second row; wishlist link/count moved into burger. Four
  filters visible2x2 below, no outer panel frame. Filters scroll normally while
  toolbar/search remain sticky. Existing HeaderSearch instance moves via parent
  phone-only Teleport after hydration, not recreated. Desktop/tablet>=768 unchanged.
- Mobile suggestions and VIN feedback teleport into sticky search feedback slot;
  clicking inside suggestions/toolbar does not trigger outside-close. Actual
  outside clicks close inline suggestions on mobile too. Input uses short mobile
  placeholder; full accessible label and OEM/SKU/VIN search support retained.
- Runtime/visual behavior NOT verified per user request. User reviews local page.


## Responsive Inline Header Layout Prepared - 2026-11-18

- After discussion user explicitly authorized all-resolution layout + removing
  excess hero copy, Tailwind only, no builds/tests/browser verification; user
  owns visual review. Only Header/HeaderSearch/HeaderSearchFilters/HeroSection
  functional frontend files changed. No backend/ENV/migration/deploy.
- Existing navigation moved beside logo/actions. ONE persistent HeaderSearch
  below sticky toolbar serves all widths; search area scrolls with page. Existing
  make/model/year/category component visible from mount; responsive4/2/1-column
  grid. Inline listboxes overlay without expanding/clipping header. Suggestion
  cards adapt to narrow widths. Legacy popup/sheet remains default off inline mode.
- Inline prop adapts presentation surface/lifecycle only: eager options, shared
  field bindings/handlers, active surface on all widths, inline VIN status without
  mobile dialog. Search/filter params, dependent reset rules, VIN decoder/request
  guards, explicit submit/Enter, refinements/Back/result scroll/analytics unchanged.
- Hero keeps actual CMS H1/image/catalog CTA; removes eyebrow/subtitle/trust badges
  and reduces responsive height using Tailwind. No CMS content/data mutation.
- NO builds, tests, lint/typecheck or browser runs per user instruction. Source
  review only while editing; no claim of runtime/visual validation. Frontend-only
  push/deploy later; user reviews local appearance first.


## Meta Search, Contact And Checkout Attribution Prepared - 2026-11-18

- User authorized useful Meta signals and specifically approved existing fbp/fbc
  identifiers after automatic review requested explicit payload/destination consent.
  No ad launch/account/budget edits. Shared useMetaMarketing owns VIN/part Search
  and Contact through existing GTM-installed fbq; do not duplicate those in GTM.
- Part search reuses existing successful-results/dedup hook, sends count/outcome;
  obvious email/phone/long-number/VIN queries omit search_string. Contact only on
  successful API form submission, no form content/customer/order info. Existing
  consent/host/internal guards and bounded Pixel wait remain. GA tags unchanged.
- Checkout forwards only existing validated fbp/fbc via two explicit headers,
  marketing consent+canonical host required. Backend snapshots original checkout
  values and validates again before Purchase CAPI. No new cookie/fake ad click.
- COD success page no longer emits Purchase at placement: delivered required,
  matching existing server rule. Card paid rule/event ID/value/SKUs unchanged.
- Backend explicit denied header wins over stale consent cookie; existing local
  Georgian mobile hash gains995 country prefix. Source phone/DB/checkout unchanged.
- Both deploys needed, no additional migration/ENV. Prior vehicle demand still
  requires business0002. Focused checks only; no build/browser/live receipt/event/
  prod DB writes/push/deploy. Backend docs/META_MARKETING_EVENTS.md has full scope.


## VIN Search Meta Event Prepared - 2026-11-18

- Fresh public live GTM-MVNFL9TH v10 has no Search/VIN mapping. Added explicit
  useVinSearchMarketing in HeaderSearch after decoder/stale guards: standard
  Meta Search through existing fbq, NOT ViewContent. Safe make/model/year,
  search_type=vin and vin_outcome only; never raw VIN/token/person/session.
- Both analytics+marketing consent, canonical host, valid GTM and internal/staff
  exclusion apply. Invalid/unrecognized/provider failures emit nothing; decoded
  no_coverage/not_in_catalog carry distinct outcomes. Up to10 sanitized pending
  events wait at most10sec for existing Pixel queue; revoke/dispose cancels.
- This hook alone owns VIN Search. DO NOT also forward it through GTM. No new
  Pixel/script/init/CAPI, GA4 event, ad/custom conversion/campaign/budget change.
  Business vehicle demand remains separate first-party distinct-session report,
  with analytics-only consent; it does not prove Meta receipt or equal counts.
- Frontend deploy required; no new ENV/migration. Earlier demand feature still
  independently needs both deploys/business0002. Scoped lint and strict Nuxt
  typecheck pass; focused tests pass. No full build/browser/live event/deploy.
  Backend docs/VIN_SEARCH_MARKETING.md records receipt/custom-conversion steps.


## Vehicle Demand Business Section Implemented - 2026-11-17

- User requested make/model/year demand history and readable Georgian insights,
  explicitly no builds/visual automation. New /business/vehicle-demand navigation
  section: date range, distinct search sessions, top100 car/year rows, VIN-use/
  empty-result counts, factual leader/tie/runner-up/gap summary and empty states.
- Consent-gated capture from VIN result and successful catalog loads. No raw VIN,
  q or personal contact fields sent. VIN uses signed decoded-vehicle token; body
  schema/manual IDs validated by server. Random per-tab30min idle session, keyed
  digest persisted in new table; dedupe page/sort/refresh/VIN+manual contexts.
- Only canonical flexdrive.ge; local/preview and business user/internal browser
  flag excluded. Business layout sets flag after authenticated use. No GA/Meta
  events or auto ad audiences. Analytics failure cannot block shopping. Customer
  counts describe interest sessions, not all users/owners or sales attribution.
- Backend business0002 migration REQUIRED on production after BOTH deploys. Local
  SQLite needed business0001(permission anchor)+0002, both applied, table empty.
  No fake historical activity, prod write/deploy/commit/push/new ENV/cron/service.
-6 backend +5 collector focused checks pass; wiring run75 header/catalog checks
  pass. Scoped ESLint/typecheck pass. No build/browser checks per user instruction;
  user owns visual review. Backend docs/VEHICLE_DEMAND.md has exact deployment.



## VIN Format Errors Explain The Actual Cause - 2026-11-17

- User showed17-character input rejected because letter O resembles digit0.
  Header now distinguishes wrong length (actual count), forbidden I/O/Q (only
  letters actually present; O-only guidance asks to verify0), and non-Latin/
  other invalid characters. No silent character substitution or provider change.
-44 header/actual-template tests and scoped ESLint pass. Regression uses the
  public sample VIN with deliberately substituted O; friend's VIN not retained
  in committed test fixtures or sent to a provider. No backend/schema/ENV changes.

## Full Vehicle Chip And VIN Result Scroll Fixed - 2026-11-17

- User screenshots: vehicle chip cut off version; VIN success while already
  scrolled in catalog preserved old position. CatalogToolbar removes220px cap/
  ellipsis; chip stays within parent, wraps full text, keeps label/remove visible.
- HeaderSearch shares existing readiness-aware result scroll for ordinary and VIN
  submissions from catalog/category. VIN closes mobile dialog and awaits nextTick
  before push; same-URL successful submission also scrolls. Home navigation keeps
  router top behavior; router options/Back restoration unchanged. Sync navigation
  invalidation prevents delayed scroll after leave/return or unmount. Existing
  catalog-results-start scroll margins account for sticky header.
-68 header/catalog/actual-template tests pass, including mobile/desktop readiness,
  same URL/category/home, stale Back and error no-scroll. Scoped ESLint and strict
  typecheck pass. No full build repeated for this small frontend UI/scroll patch;
  previous variant production build remains the earlier verified build. Browser
  automation not run (project requires explicit request); user reviews local UI.
- Frontend-only functional change, no backend/DB/ENV/migration/deploy/commit/push.
  Existing uncommitted variant changes preserved.

## Existing Supplier Version Hints Prepared For Local Review - 2026-11-17

- User approved reversible version mentions from existing supplier names/fitment
  notes. VIN filters now carry bounded variant context (e.g. gli/ex_v6 or
  unspecified). Backend retains optional vPIC trim/series; no raw VIN query/history.
- Header/catalog retain context for part search/suggestions, page/sort, same-car
  mobile refinements and Back. Manual car/year/engine edits or reset clear it.
  Vehicle chip includes version. No new explanatory paragraphs/buttons.
- Product cards say model/year match, plus mentioned GLI/etc or version requires
  checking. Mentions are not full/exclusive fitment proof. Backend prioritizes them
  within stock/text relevance; NO version-based removal. Explicit sorts unchanged.
-71 frontend +46 backend tests pass, scoped ESLint/strict typecheck/isolated
  production build pass. Actual local read-only Jetta2017 count117 preserved,
  GLI grille FD-04-0250/bumper FD-04-0328 rise first; other products remain.
- Clean base frontendd797a6f/backend1f86fa3; user owns local review and BOTH later
  deploys. No ENV/migration/new supplier data/product edits/import/deploy/commit.
  Browser verification not run (requires explicit request). Local review route:
  /catalog?make=volkswagen&model=jetta&year=2017&variant=gli . Backend docs/
  VIN_VARIANT_HINTS.md has behavior/limits/rollback. Existing VIN500fix preserved.

## VIN Feedback Copy Simplified At User Request - 2026-11-17

- Removed both lower lines from desktop/mobile VIN status: provider/compatibility
  explanation and search-as-part button. Only the existing primary result/loading/
  failure feedback remains. Removed now-unused part-code mode and its obsolete
  test. Earlier disclosure/escape-button notes below describe the previous UI.
  VIN decoding/mapping/catalog filter logic is unchanged. No deploy performed.

## VIN Search Prepared; Deploy Both Repos - 2026-11-17

- User authorized VIN integration. Header full17-char VIN uses new backend POST
  /catalog/vehicles/vin/; reliable match routes make/model/year only, clears VIN
  text and stale category/engine/refinement/page filters. Typing a part keeps car.
  Desktop/mobile share behavior; current catalog labels/removal unchanged. Explicit
  part-code escape preserves17-char SKU search. No VIN provider calls on typing.
- API wrapper uses POST body, abort signal,12sec timeout/no retry. Closed/edited/
  departed/unmounted requests cannot navigate later. Failure/unsupported/ambiguous/
  no-year-coverage messages retain current page and offer manual filters. Sidebar
  actions cannot turn an unsubmitted VIN draft into product q/analytics.
- Backend is conservative vPIC ErrorCode0 exact make/model/year matching, not
  parts/OEM/engine/trim proof. No fuzzy cross-market alias. Availability preserves
  existing catalog behavior. VIN provider disclosure included in both templates.
-66 focused frontend +21 backend tests pass incl actual Vue template feedback,
  subsequent part query, stale result/abort, explicit code fallback and POST shape.
  Scoped ESLint, strict typecheck and isolated production build pass. Existing
  Browserslist/DEP0155 build warnings only. Public sample decoder verified live.
- No production data/config/deploy/commit/push. User owns BOTH frontend/backend
  deploys. No new ENV/API key/migration/cron. Browser verification not run (requires
  explicit request); post-deploy known VIN -> selected car -> cleared input ->
  part search remains to verify in browser. Backend docs/VIN_SEARCH.md has limits.
- Previous Pinia SEO500fix preserved; performance optimization remains deferred.

## SEO Pinia Fix Published And PageSpeed Verified - 2026-11-17

- User546a48afrontenddeployHealthy/Live18:22:09Tbilisi. FreshPSI18:24/18:26:
  home89mobile/96desktop, catalog88/87; SEO100ALLfour. Fullpages, no unsuccessful
  HTTPstatus/consoleerroraudit. LCP home3.602/1.002s,catalog3.189/0.834s.
  RuntimeLogs public_page_failure filterNoresults. Publicroot/catalog/product
  anonymouschecksALL200, atmost2parallel/no loadtest.
- Livevalidation of specificSEO/Pinia500fix complete. DesktopcatalogTBT250ms,
  mobilecatalogSI6.048s andmobileLCP remain optimizationopportunities, not partof
  thisfix. CrUXinsufficient; labscorescanvary. SeparateCMS404/h3statusMessage
  warnings remain; neverclaimallerrors/warningsremoved.
- No furtherfunctional/config/deploy/migrationactionsperformed/required thisturn.
  BrowsernativeCUAresetreleasesframe, tabsleftopen. Backendreport
  docs/PERFORMANCE_500_INVESTIGATION_2026-11-17.md storesreportURLsandmetrics.
  Older pendingdeploynotes below arehistorical.


## Production SEO Pinia 500 Race Fixed; Frontend Deploy Needed - 2026-11-17

- User deployed diagnostics17:46Tbilisi; freshPSI17:50rootmobile/desktop500.
  RuntimeLogs13:50:29UTC captured public_page_failure/home/TypeError/missing_value
  server.mjs3168:29→3229:3. Production call chain maps to useSiteSettings lookup
  inside useSeoDefaults AFTER awaited siteSettings API in seo-defaults plugin.
- Regression uses realPinia3.0.4production SDK: removing globalactivePinia during
  await reproduces exact TypeError(reading '_s'); overlappingSSR isolation fails.
  FIX: seo-defaults captures useSiteSettings(nuxtApp.$pinia as Pinia) beforeawait,
  passes same request-owned store into useSeoDefaults(store). No global relookup.
  Onlycallerplugin updated; existing seoTitle fixture passes explicitstore.
-26focused SEO/error/diagnostic tests, scopedESLint/typecheck/prodbuild pass.
  Actual isolated production Nuxt+loopback API forciblyclears its own outputPinia
  during settings reply; parallelroot/catalog BOTH200 with content/SEO, no error.
  Own3107/8128QA stopped; nativeCUA reset. No checkout/auth/indexing/cache changes.
- User owns FRONTEND push/deploy, then actualPSI/logrecheck. No new ENV/migration/
  backend redeploy for this fix. Do not call liveerrorclosed beforedeploy.
- User devNuxt rewrites ordinary.nuxt; isolatedbuild uses ignored node_modules/
  .cache/flexdrive-performance-500 and backend ignored performance-20261117/
  nuxt-output. Devservices untouched. Documentation/evidence in backend
  docs/PERFORMANCE_500_INVESTIGATION_2026-11-17.md. Earlier cause-unproven notes
  below are historical; this matched SEO path now has a tested fix.


## Intermittent Public 500 Diagnostics Ready; Cause Unproven - 2026-11-17

- User authorized investigation/fix after actual PSI home/catalog desktop500.
  First mobile85/88served normal pages, desktop98/94were error pages (invalid
  speed results). Fresh WITHOUT code/deploy: home96/SEO100/LCP1.083s, catalog97/
  SEO100/LCP0.661s; latestmobile83/91. Thus not currently reproducible; do NOT
  claim original cause established or500fixed. NativeChrome capture reset.
- RuntimeLogs visible sample has h3statusMessage warnings10:48UTC and CMS404
 11:01UTC, not a proven500stack. Anonymous normal/Headless/Mobile/LighthouseUA
  reads all200. PublicPageSpeedAPI429; no key/access/billing change.
- Added only early server-only Nuxt app:error + Nitro error hooks using
  server/utils/publicPageDiagnostics.ts. Public home/catalog/product GET/HEAD
  failures>=500only; no private/API/write/4xx, requestdedup,20perminute limit,
  max3causes/4build-file locations. Allowlisted type/code/status/hint only,
  no rawmessages/URLs/query/cookies/headers/bodies/stacks/userdata. Logger/getter
  failures cannot affect responses. No auth/checkout/cache/SEO/status rewrite.
-5focused tests, scopedESLint/typecheck/productionbuild pass. Actual builtNuxt
  + loopback upstream500fixture: home/catalog preserve500 and emit exactly2
  deduplicated redacted public_page_failure records with real build locations.
  No private fixture marker leaked; this proves logger, not original cause.
  Own3107/8128QAservers stopped. ExistingNodeDEP0155buildwarning remains.
- User owns frontendpush/deploy; no migration/ENV/new service/cron. Existing
  analytics changes across BOTH repos remain untouched/uncommitted. After deploy
  rerun PSI and use RuntimeLogs public_page_failure if500recurs; until then root
  cause unresolved. Backend docs/PERFORMANCE_500_INVESTIGATION_2026-11-17.md.


## Business Analytics Funnel, Public Pages And Meta Status Prepared - 2026-11-17

- Approved plan implemented in paired backend/frontend. User owns push/deploy BOTH;
  no migration/new ENV. Existing receipt fixes preserved. No fake production events,
  real purchase/refund, account access/config edits or individual clickstream added.
- Users adds BusinessPagePerformance (private independent /business/pages/, views,
  users, average active seconds = userEngagementDuration/activeUsers; not full visit
  duration). Top20/totalrows, refresh time, stale/empty/error distinctions. Backend
  public route allowlist rejects checkout/order/token/query URLs; no private links.
- BusinessFunnel has overall3steps including BuyNow + cart4/BuyNow3 path selector.
  Backend normalizes actual alpha headers. Missing step remains null/dash; no fake
 0/drop/percentage. Uses supported pageLocation for checkout path, NOT pagePath.
  Path audiences may overlap and are not summed. Existing summary uses overall.
- Marketing adds BusinessMetaTechnical: real Pixel basic read/name/last event,
  boolean CAPI configuration (not delivery proof), exact Events Manager link.
  Existing reader can read id/name/last_fired_time200 but detailed stats returns
  PermissionDenied; browser/server Purchase receipt/dedup stays EventsManager.
- Real API reads verified all3funnels200 and14public pages. Historical Nov16
  purchase still absent Nov17<24h; do not promise restored or cause proven.
  Current receipt/browser/GTM chain separately emits correct Google purchase;
  intercepted204 in isolated browser, not sent to real statistics.
-56backend and27frontend focused tests pass, scoped ESLint/typecheck/build pass.
 390/1440 isolated built UI checks selector/pages/Meta link,0JSerrors/0docoverflow;
  table scroll stays internal. Browser API fixtures distinct from real read-only
  provider checks. All own contexts/server stopped, native CUA node reset.
- Plan/status: backend docs/BUSINESS_ANALYTICS_COMPLETION_2026-11-17.md. Live UI
  verification after user deploy and historical GA4 receipt recheck remain.


## Guest Receipt Availability And Recovery Prepared - 2026-11-17

- User requested resolving missing guest receipt. Backend grants per-order signed
  HttpOnly cookie on bank-status/verified lookup; public summary reports only
  receipt_available, preserving private PDF authorization and old signed headers.
- Bank result now loads payment status onMounted (browser must receive Set-Cookie
  before redirect; SSR-only API response cannot install browser cookie). Polling,
  paid/pending/error decisions and provider payment/refund logic retained.
- Success page uses server availability, forwards existing signed header and SSR
  owner cookies, keeps already-issued receipt available after refund. Lost access
  shows order-status recovery. Verified order-number/phone/reCAPTCHA lookup now
  offers PDF download using receipt_order_token; no account required. Restored stale
  lookup must be refreshed. No price/stock/payment/analytics/ENV edits.
-44 focused frontend tests pass (actual async success page, mounted bank return,
  guest lookup without storage, checkout draft, consent); scoped ESLint/typecheck/
  production build pass. Paired backend101 receipt/callback/refund tests pass.
- Isolated real Django+Nitro+SQLite Chromium390/1440: sessionStorage disabled,
  simulated bank return->visible receipt->real PDF download, no JS error/overflow;
  cleared-cookie recovery link appears. Not a physical-device production test.
  Own8127/3107 servers stopped. No real bank/provider/production data action.
- Both backend then frontend push/deploy needed; user owns deploy. No migration or
  new ENV. Then verify existing refunded-order lookup/PDF live without new purchase.
  Historical Android incident exact runtime state isn't reconstructed; the lost
  access mechanism is covered. Backend docs/TEST_SALE_AUDIT_2026-11-17.md updated.
- Nuxt SSR cookie docs: https://nuxt.com/docs/4.x/getting-started/data-fetching#passing-cookies-from-server-side-api-calls-on-ssr-response


## Search Input ID/Name Attributes Prepared - 2026-11-16

- User authorized small id/name cleanup without Computer Use. HeaderSearch now
  calls Vue useId once per instance, adds distinct -desktop/-mobile input IDs and
  name=q to both forms. Header has two component instances; IDs remain unique
  across them and stable for SSR/hydration. No random/global counter added.
- Exactly5 source lines added; v-model, submit prevention, keyboard handlers,
  focus ref, draft/route/filter logic and autocomplete=off remain unchanged.
  Existing55 header/search/filter/result tests, scoped ESLint, Nuxt typecheck
  and whitespace checks pass. No new tests for this low-impact attribute edit.
- No browser/server/production/data/ENV/backend action, migration, commit or push.
  User owns frontend deploy; exact live Chrome issue disappearance remains to
  verify afterwards. Prior BusinessReport source-link edit is preserved.
- Vue useId documentation: https://vuejs.org/api/composition-api-helpers.html#useid


## Business Source Placeholders Corrected; Pixel Unblocked - 2026-11-16

- User requested resolving Pixel and misleading source connection cards. AdBlock
  was active on flexdrive.ge; user manually paused it after request. Reload shows
  fbevents.js200/script/disk-cache432kB and no ERR_BLOCKED_BY_CLIENT. No tracking
  code, GTM, privacy/consent or extension setting changed by agent.
- Existing live GA4 report fetched19:19; Meta ads/FB/IG fetched19:20 Tbilisi. Sources
  already work; screenshot card and modal in BusinessReport had obsolete fixed
  next-stage placeholders. Replaced with existing users/marketing report links,
  preserving selected period and explaining where real status/update times appear.
  No false all-green badge, new API call, permission, token or backend change.
-56 existing business tests, scoped ESLint and Nuxt typecheck pass. Frontend push/
  deploy required for copy/links; user owns it. No build rerun for this small Vue
  text/link change. Real purchase/CAPI/dedup and Meta ingestion remain separate.
  CUA reset; live browser left on marketing. Preserve prior cache fix and docs.


## CSS/JS Cache Live Verification Complete - 2026-11-16

- User deployed.18 live anonymous HTTP checks pass: current CSS/two actual JS,
  MIME/year/immutable, CDN HIT and304; metadata/private/preview stay no-store.
  Guard=true/public_open=false. Current build c0a07522-53cb-45d8-93c4-b753b6af2b85.
- Real Chrome preview homepage reload shows CSS disk-cache hits; catalog and
  FD-04-0446 product render with no new app JS/hydration error. Console has Meta
  fbevents.js ERR_BLOCKED_BY_CLIENT and Chrome missing id/name autofill suggestion.
  No extension/code/config change. Payment/login/all devices were not tested.
- Earlier pending-deploy cache note below is historical. CUA reset/DevTools closed.
  docs/STATIC_ASSET_CACHE.md and backend CACHE_AUDIT_2026-11-16.md updated.


## Hashed CSS/JS Cache Prepared - 2026-11-16

- User authorized ONLY priority CSS/JS caching; category invalidation, Redis
  fallback and client menu/settings refresh remain deferred. No other cache work.
- Guard beforeResponse now permits public/year/immutable only GET/HEAD200/304
  for current eight-character-hashed root /_nuxt CSS/JS files PRESENT in Nitro's
  generated public-asset manifest with matching MIME. Cookie-setting responses,
  errors, holding HTML, unknown files, source maps, payloads and mutable build
  metadata never receive immutable. Metadata/private pages keep no-store;
  Nitro's own missing-static404 retains no-cache. Guard/API/preview unchanged.
-41 targeted cache/guard/SEO tests pass; scoped ESLint, Nuxt typecheck and local
  production build pass.15 actual built-Nitro loopback checks pass incl CSS/JS
  bytes, HEAD/304, metadata/404, closed/preview/open private API and mock outage.
  Temporary own servers stopped; no real provider/DB/browser/public-open action.
- Frontend-only deployment required, no ENV/backend/migration change. User owns
  push/deploy; production headers NOT yet updated or rechecked. Backend audit:
  docs/CACHE_AUDIT_2026-11-16.md (original findings plus implementation status).


## Delivery Choice Card Prices Removed - 2026-11-16

- User requested removing standard/fast delivery prices from the left checkout
  choice cards; removed only the price prop in shared CheckoutDeliveryOptions.
  Cart/buy-now summaries retain selected fee and totals; service selection,
  timing and availability unchanged.8 existing service-card/summary tests pass,
  scoped ESLint passes. Frontend deploy needed; no backend/migration change.

## Cleared Search Text Preserved Across Catalog Filters - 2026-11-16

- User reported clearing header "წინა გიტარა" then changing Subaru Legacy to
  Forester in sidebar restores deleted text. Header route watcher and catalog's
  separate applied q caused the old query to return.
- Added request-safe useCatalogSearchText draft shared by header instances and
  catalog filter query construction. Clearing/editing alone stays unsubmitted;
  next sidebar/mobile filter action uses that draft, including omitting empty q.
  Catalog API/results/analytics keep applied text until navigation commits. A
  one-character incomplete draft is not sent by filter actions. New q/path and
  browser Back restore route text; route refinements alone preserve the draft.
-89 relevant tests pass (actual Vue setup/router/SSR; desktop/mobile regressions),
  scoped ESLint, typecheck and production build pass. Existing Browserslist/Vue
  package deprecation warnings only. No production browser verification, commit,
  push, deployment or backend/migration/data changes. User owns frontend deploy.

## SEO Launch Source Prepared - 2026-11-15

- User authorized full sequential SEO plan. Prepared host-aware noindex headers,
  strict runtime flag parsing/private routes, guarded text robots/empty XML,
  sanitized live sitemap, category H1/description and real composable test loaders.
-79 scoped frontend tests, ESLint/typecheck/production build pass. Built Nitro
  10 scenarios plus4 outage checks pass (runtime flags, closed/preview/open,
  starter/reclosed). No production frontend deploy yet; user owns push/deploy.
- Backend fixes Product.public_canonical_url duplicate FD code on manual legacy
  slugs;48 backend tests pass/1SQLite locking skip. Deploy BOTH backend then front,
  no migration needed. Never enable indexing ENV before new source deploy verified.
- CMS contact5/blogs3/catalog2 noindex cleared, exactly3 pages success and reload
  verified. Store remains guard=true/public_open=false. No launch/ENV/DNS action.
- Read backend docs/SEO_PRELAUNCH_AUDIT_2026-11-15.md and SEO_RELEASE_2026-11-15.md
  for actual pending inventory/ENV/live and post-open GSC/performance/content work.
  User owns final opening after friend payment. Preserve phone/address policy and
  manual SEO overrides; no automatic OEM/SKU title changes. Do not claim all SEO done.

## Search Console Business Panel Prepared - 2026-11-14

- User requested clear Google Search data inside the business panel. Added
  BusinessSearchConsole (overview compact/users full), lazy daily SearchChart,
  useBusinessSearchConsole and typed formatting/comparison/summary helpers.
  Google-search queries are distinct from renamed site-internal search section.
- Existing private backend origin and business-only auth; no public credentials
  or local storage. Cancellation/late-response guards/access redirects retained.
  User-selected period vs actual finalized PT period,3day exclusion/16month limit,
  top50/privacy limitations, stale/unknown/zero and Google/GA4/order distinctions
  explicitly displayed. Table scroll contained; responsive1/2/4 metric columns.
- Backend enabled API and added existing analytics reader as Restricted only
  after specific user approval. Full live read succeeds (genuine empty data).
-65 backend +43 frontend tests, scoped ESLint/typecheck/production build pass.
  No dev server/browser visual test, event/real order/ad/indexing/public opening,
  commit/push/deploy. User owns both new pushes/deployments, backend first, then
  new UI desktop/mobile review. No ENV/migration needed. Backend reference:
  docs/BUSINESS_SEARCH_CONSOLE.md. Google login/Branding remains separate.

## Business Decision Analytics Prepared - 2026-11-14

- User requested preparing decision analytics before the real test purchase.
  BusinessDecisionPanel now appears in overview(compact), users(Google sources/
  ecommerce/closed ordered journey) and marketing(Meta CPA/ROAS/comparisons/
  campaign value, link clicks and landing views). Existing business layout/tokens,
  financial reports, auth, tracking consent and purchase flow remain unchanged.
- New useBusinessDecisions calls existing backend origin's private
  /business/decisions/{all|google|meta}/, with no-store/credentials-included,
  source+period snapshots, cancellation/generation guards and business-only
  access redirects. Clear unknown/zero/stale/currency/attribution distinctions;
  no profit claims from ROAS or financial-ledger/attribution double counting.
-36 frontend analytics/marketing/report/decision tests, typecheck, scoped ESLint
  and production build pass. Backend54 tests and actual Google core/funnel plus
  current/previous Meta Ads read succeeded (valid zero-purchase/empty Ads period).
  No server/browser or live purchase/event/ad started in this implementation.
- User owns both source pushes/deployments, backend first. No ENV or migration.
  New UI visual/mobile review after deployment and actual test purchase remain.
  Backend docs/BUSINESS_DECISION_REPORTS.md records API contract and rollout.

## Public Legal Information Prepared For Google Branding - 2026-11-14

- User authorized public homepage description/privacy/terms for Google brand
  verification while the shop stays closed. Only two exact safe legal paths render
  minimal script-free HTML from backend api/launch/information/{slug}/. Existing
  CMS legal content is reused; no legal text/DB/env change. Other CMS/API remains
  closed, preview/public launch switch and noindex/no-store stay unchanged.
-18 guard HTTP tests incl HEAD/preview/open-state/safe-path/failure regressions,
  scoped ESLint, Nuxt typecheck/production build and built Nitro local mock smoke
  pass. Backend24 launch/legal/sanitizer tests pass too. User owns BOTH pushes/
  deployments, backend first; no migration. No production/Google submission,
  commit/push/browser action at this stage. After deployment verify anonymous
  public information and closed shop, then finish Google prerequisites/submission.


## Preview Form Browser CSRF Fix Prepared - 2026-11-13

- User's repeated admin preview-code403 exposed Referrer-Policy:no-referrer on
  both launch admin and front holding/code form. Native browser forms send null
  Origin under that policy. Changed both responses to same-origin.
- Existing17 front tests pass with a response-policy regression assertion, plus
  scoped ESLint.18 backend launch tests pass with rendered-token secure POST and
  null-origin denial. An isolated Chromium mocked HTTPS form reproduces old null
  Origin and verifies the corrected real Origin. No user browser data involved.
- User owns BOTH front/backend source pushes/deployments, then real code creation
  and entry need confirmation. No migration or runtime setting change in this fix.


## Production Guard Activated And Holding Response Fix - 2026-11-13

- User confirmed both apps deployed. Backend pages0085 now applied to production
  after SSL identity/backup/rollback preview;61 original tables preserved and zero
  pending migrations. Public_open remainsFalse. Both runtime flags enabled in DO;
  original8 frontend/46 backend component env rows preserved.
- Live backend status/API/admin checks pass, and front preview form returns200.
  DO ingress replaces planned503 holding HTML with generic504 (x-do-orig-status503).
  Changed ONLY planned closed GET/HEAD holding page to200, keeping private/no-store,
  noindex and all cookie/API guards. Genuine backend/status failures remain503.
  Updated existing HTTP regressions; all17, scoped lint, typecheck, production build
  and built Nitro loopback smoke pass. User owns this frontend push/deploy.
- Recheck live holding page and real code access before custom domains/webDNS.
  Public opening, provider settings and mail flow test remain pending. CUA ended
  and reset so the yellow frame is removed. Backend docs record rollout/evidence.


## Restricted Storefront And Launch Button Prepared - 2026-11-13

- User requested a protected domain cutover before an evening public opening.
  Added hostname-independent Nuxt server guard, holding/preview form, host-only
  Secure/HttpOnly/SameSite=Lax preview cookie, and same-origin bounded form POST.
  Backend pages0085 creates the closed LaunchControl singleton. Its superuser-only
  admin generates24h codes and opens/closes public access with one audited button.
- Activation uses private NUXT_STOREFRONT_ACCESS_GUARD_ENABLED (defaultFalse) paired
  with backend STOREFRONT_ACCESS_GUARD_ENABLED. A backend status failure or disabled
  backend guard denies access while the frontend guard is enabled. Unknown frontend
  activation values cannot disable protection. Built production cookies use Secure.
- Preview cookie propagates through SSR only to the configured backend API origin/
  path. Existing OAuth/API proxies carry it. Before-response and streaming-proxy
  hooks keep guarded responses private/no-store. Exact BOG/Wingo POST callbacks
  pass to their existing backend verification. Direct starter domains are guarded.
-17 frontend HTTP/SSR/redirect tests, Nuxt typecheck/scoped ESLint/production build
  pass. Built Nitro loopback smoke confirms both hostnames closed, code access,
  secure cookie, API privacy, dynamic opening/closing and fail-closed outages.
  Backend also passes221 isolated network-blocked launch/auth/provider regressions.
- Code preparation is complete. Both deployments, backend pages0085 migration and
  runtime activation/live checks precede webDNS cutover. Deployment is the user's
  next handoff. Backend docs/STOREFRONT_LAUNCH_ACCESS.md records the exact sequence.
  No production env or database mutation, commit, push or deployment in this step.


## Wingo Courier Reporting Cleanup - 2026-11-10

- User authorized replacing retired courier reporting. Business finance/shipments
  use Wingo labels and backend stored Wingo facts; optional reverse number is visible.
  Wingo uses webhook/manual checks, not scheduled polling. Removed obsolete carrier
  sync-report explanation; supplier sync remains. Reusable layout/Tailwind unchanged.
- Backend pairs this with reporting conversion and commerce0045 retirement after0044.
  Historical provider string types remain for already frozen order DTOs only.
  53 business tests, Nuxt typecheck and scoped ESLint pass; no live viewport.
  User owns push/deploy; no browser/server/env/provider/bank operation.

## Wingo Fast After Cutoff And Concise Estimates - 2026-11-10

- User subsequently approved plain card sentences: standard before12:30 next
  working day/after two working days; fast before12:30 same day/after next working
  day. Cutoff comes from server metadata. Removed "სავარაუდო"/dated card copy and
  redundant fast note; one shared working-days/weekend footer. Regional3–5 wording
  remains. Presentation only; signed schedules/prices/paid history unchanged.
- User authorized keeping fast selectable after12:30 for next working day, including
  weekend->Monday, using paired backend schedule and frozen deliveryDate at booking.
  Standard card now says1–2 working days; fast card shows today/next working day.
  Its cutoff note explicitly applies only to SAME-DAY payment, not service availability.
- Removed duplicate estimate prop/markup from checkout summary and both page bindings;
  summary keeps service/price. Existing shared choice component/Tailwind unchanged.
  39 component/composable/select/guest tests pass, including same-day expiry refresh
  to next-day fast without service/price switch. Typecheck/scoped lint/whitespace pass.
- Backend public CMS descriptions/editors/intros/FAQ/subtitle corrected by pages0084,
  applied locally only; prior0083 alone missed compact old13:00 copy. Production
  pages0083/0084 await user's deployment/request. No browser/server/production/env,
  provider/bank mutation, commit/push/deploy. Earlier disabled-fast notes are historical.

## Wingo Standard And Fast Choices - 2026-11-10

- User authorized backend-first then this frontend; fast checkout cutoff12:30,
  preparation30min, carrier booking13:00. Paired backendv4 quotes provide both
  Tbilisi services, stored prices, estimates/options/expiry; regions standard only.
- Shared BaseChoiceCard native radio wrapper uses existing Tailwind/theme tokens
  for delivery and payment cards. Shared CheckoutDeliveryOptions sits under address
  on both pages; defaultstandard, service/date/price visible, disabled fast explains
  cutoff. Client clock does not define policy; server metadata drives expiry.
- Service binds quote/payment payload/draft. Destination/service changes invalidate
  synchronously; late responses cannot win. Expired fast refreshes alternatives but
  does not silently switch or permit paying old quote. Legacy standard fallback kept.
- Summary/success/profile display saved service/estimate and actual paid delivery;
  corrected preexisting hardcoded free delivery on success/profile. No fee/buffer
  calculation moved into UI; backend remains authoritative.
- 37 relevant actual component/composable/select/guest tests pass; Nuxt typecheck,
  scoped ESLint and whitespace checked. Browser/server/viewport not launched;
  user will review actual design. No env/bank/provider/production write, commit,
  push/deploy. Paired backend deploy and pages0083 migration required; local0083 done.
  Backend docs/WINGO_DELIVERY_CHOICES.md records schedule/paid-history/rollout limits.

## Wingo Standard Checkout - 2026-11-10

- User authorized backend first, then this frontend. Active quotes use only Wingo
  standard type1; region/locality selection uses the existing searchable BaseSelect
  and BaseInput/Tailwind layout in the shared component for both checkout pages.
  No fast service chooser or delivery calendar added; delivery timing copy unchanged.
- Numeric local IDs are stable backend mappings. City text is derived from the
  selected locality. Region changes synchronously invalidate locality/price; late
  old API results cannot overwrite the current selection. Single locality auto-selects.
- Drafts carry a Wingo marker. Legacy courier contacts/street survive but location
  IDs are cleared to prevent numeric-ID overlap. Restore verifies returned cities.
  Wingo provider/type/location response checks reject mismatched quotes.
- 14 checkout/draft tests +38 existing shared-select/business/status tests pass.
  Nuxt typecheck, scoped ESLint and whitespace pass. Context7 tools were unavailable;
  official Vue watcher docs verified flush semantics. No browser/server start.
- Paired backend migration0041 is applied locally only; backend has52 Wingo and337
  prior passing regressions. Backend API +0041 must precede or accompany this frontend.
  Production key/ref data is configured later by user. No env, real bank/provider
  actions, commits, pushes or deployments. User handles both pushes/deployments.
  Booking/status/cancel/returns and Wingo finance are later stages. See paired backend
  docs/WINGO_CHECKOUT.md.


## Compact Product Fitments In Specifications - 2026-10-28

- User authorized removing the separate large fitment-card section and showing
  a compact model/year table inside the existing Specifications tab. It renders
  when that tab is selected; the default description view has no separate block.
  Existing SEO meta/JSON-LD and backend fitment/search data remain unchanged.
- Hide generated მანქანა/თაობა spec rows only when structured fitments/universal
  state are available; preserve these legacy rows otherwise. Keep OEM, maker,
  placement and all other specs. Notes repeating just the model/year are omitted;
  engine details, meaningful restrictions and punctuation-bearing notes remain.
- Follow-up: user requested adjacent columns on mobile too. Spec rows use
  112px/140px first columns and fitments use132px/160px at mobile/640px+,
  accounting for padding so values/years align closely. Both stay side by side
  with wrapping at every size. Existing theme tokens and natural row heights stay.
- Nine component/actual-page SSR tests, Nuxt typecheck, scoped ESLint and
  whitespace checks pass. User explicitly declined server/browser checks and
  will verify real viewports; do not claim browser-proven responsiveness.
  No server/browser start, business data/provider/env change or push/deployment.
  This visual change requires frontend deployment; backend code unchanged here.


## Header Dropdown Compact Expansion - 2026-10-16

- User requested one primary search action: atmd768px+ keep only the top submit;
  shared filter footer hides its submit via md:hidden, removes desktop divider and
  reduces spacing. Small ghost Clear remains; below768px the Dialog keeps its submit.
  Chrome verifies one visible desktop Search and mobile Search retained at767px;
  original viewport/dark theme and Volkswagen desktop draft preserved.27 focused
  tests/scoped lint/whitespace pass. No actual search submitted or category-code change.
- Latest user authorization supersedes the read-only category audit: HeaderSearch
  and catalog category lists now call the default nonempty category API (no true
  includeEmpty flag). Zero published-product categories, including New, are hidden;
  category detail/SEO routes and stored categories remain intact. Optional API/server
  compatibility is retained, but current UI lists do not opt into empty categories.
- Removed catalog photo-only filter from desktop/mobile controls, props/drafts,
  selected chips, reset/apply state, route parsing/building, request params, frontend
  type and analytics filter keys. Legacy has_image=true/false listing URLs are ignored
  and new pagination/filter links drop it. Backend API compatibility unchanged.
- 52 focused tests pass, including category loading/reloading and legacy URL/SSR
  pagination regressions; app typecheck, scoped ESLint and whitespace pass. Chrome
  verifies eight nonempty categories in header/catalog and only Stock/Sale quick
  filters on desktop/mobile375x812. Original viewport/dark theme restored; no filter
  applied, catalog search submitted, data/env/provider writes, server start or deploy.
- Follow-up bug fixed: Header uses md(768px) for its mobile trigger, but search
  previously hid Dialog at sm(640px). HeaderSearch viewport query now uses767px,
  desktop input uses md:block and mobile trigger/Dialog use md:hidden. Existing
  resize watcher closes the old surface correctly at768px. Chrome verifies actual
  click opening at640px/767px, desktop input opening at768px and open-sheet resize
  cleanup.27 focused tests, typecheck, scoped lint/whitespace pass. Temporary viewport
  override reset; no search submitted or backend/provider/env/deploy change.
- Current user-authorized trial replaces the always-reserved blank area. At1024px+
  the four-column grid is compact until a listbox trigger has aria-expanded=true.
  Scoped :has CSS expands its shared menu space;120ms collapse delay preserves
  space during pointer/focus handoff,180ms padding transition opens/closes smoothly.
  Grid overflow:clip keeps lists inside during animation. Existing reduced-motion
  rules apply. Shared BaseSelect and search/filter behavior remain unchanged.
- Existing Chrome localhost verifies compact195px -> open459px -> compact195px;
  category/make switching retains459px. Lists256px stay inside. Desktop light/dark
  and375x812 mobile checked; mobile retains inline lists without horizontal overflow.
  Original viewport/dark theme restored.27 focused tests and scoped lint/whitespace
  pass. No search submitted, server start, business-data/env/provider edits or deploy.
- Previous reserved-space component backup: paired backend local-docs/search/header-search-reserved-space-20261016.vue.
  Screenshots in paired backend artifacts/search/header-compact-idle.jpg and
  header-compact-expanded.jpg. Earlier rollback/overlay records below are historical.

## Header Dropdown Four-Column Layout - 2026-10-16

- User requested rollback of the floating overlay trial. Restored only its four
  backed-up files, preserving all earlier uncommitted search/filter work; removed
  trial-only selectOverlayLayout.ts. BaseSelect has its prior inline behavior.
- Header category select now shares the vehicle grid: four columns on desktop
  (>=1024px), two at640px+, one on narrow mobile. All four use inline-options and
  expand the row when opened. No internal search inputs; category multiple selection
  and removal remain. User wants this expanding layout for review.
- Chrome localhost verifies desktop4/two at900px/one at375px, no horizontal
  overflow and unchanged expanded height switching category/make.27 focused tests
  and scoped lint/whitespace pass; original viewport restored.
- Prior overlay screenshot/geometry notes are historical, not the current UI.

## Header Search Filter Form - 2026-10-16

- User authorized a compact header search with make/model/year (NO engine) and all
  active categories, including empty ones. Existing BaseSelect gains opt-in multiple
  selection/inline options without changing scalar v-model; BaseButton/design tokens
  and one shared HeaderSearchFilters component serve desktop/mobile. Mobile Dialog
  uses installed Headless UI focus/scroll handling; light/dark use existing tokens.
- Header make/model/year and category dropdowns have no extra search input per
  user follow-up. Keep the reusable BaseSelect searchable option for other uses.
- Text/vehicle/categories are drafts until Search/Enter. Clearing text no longer
  navigates automatically. Selected categories OR together, with individual removal;
  product suggestions respect the same filters and retain stale-response protection.
  Make resets model/year; model resets year. Header no longer records recent searches.
- Additive backend categories CSV/repeated values on products/suggestions and
  category include_empty=true required. Catalog retains multi-category selections
  across sort/pagination/mobile filters/reset. Existing OEM/SKU parsing/ranking,
  tracking host/consent protections and five-suggestion limit remain.
- 40 focused frontend tests passed; expanded57/59 includes two existing product SEO
  harness failures missing gallery-preloader mocks, reproduced against committed HEAD.
  Backend78 focused tests passed. Typecheck/scoped lint/whitespace passed. No browser
  or server start per explicit-request-only rule: mobile/desktop/theme visual checks
  remain. No DB/provider/env edits, push/deploy. Both repos need deployment, backend
  first or together; no migration. See paired docs/HEADER_SEARCH_FILTERS.md.


## Product Desktop Zoom First-Hover Delay - 2026-10-15

- User reported the separate zoom pane was initially white. Its 2000px image
  previously began loading only when the pane mounted on hover; gallery detail
  preloading deliberately covered only ordinary detail sizes.
- Isolated useProductZoomPreload now warms/decodes the selected photo's 2000px
  URL after the visible main image loads, only when existing desktop mouse zoom
  is available. Works for single-photo products too; no bulk 2000px gallery load.
- Zoom uses the already-loaded detail photo until its sharper version is decoded.
  Failed warmups retain that fallback. Source-specific readiness, stale-result
  guards and cleanup prevent wrong-photo readiness or late writes after unmount.
  Decoded zoom photos are retained only for this mounted product page.
- Pane geometry, lens/mouse behavior, thumbnails, lightbox and commerce logic
  remain. Shared BasePicture, previous gallery preloader and backend are unchanged.
- 25 tests passed (8 zoom, 11 gallery preload, 6 product SSR), plus frontend
  typecheck, scoped ESLint and whitespace checks. No browser/server start,
  provider/DB/env changes, push or deploy. Actual browser timing remains unmeasured;
  user handles frontend push/deploy. This adds one selected-photo warmup alongside
  the existing two-at-a-time detail queue; in-flight requests may finish on leave.

## Product Gallery Background Preloading - 2026-10-15

- User authorized reducing first-hover image delay. Product detail now uses the
  isolated useProductGalleryPreload composable after the visible main image loads.
- Small thumbnails/layout, hover's existing 100ms delay, click/lightbox/zoom and
  commerce behavior remain. Shared BasePicture and backend are unchanged.
- Warm only the current viewport's existing detail URLs at low fetch priority,
  at most two at once, and decode before advancing the queue. Retain warmed images
  for this gallery; discard queued work/listeners/references on change or unmount.
  In-flight requests may complete. Failures leave normal image loading available.
- 11 focused preload tests plus 6 actual product SSR tests passed; frontend
  typecheck, scoped ESLint and whitespace checks passed. No browser/server start,
  provider/DB/env changes, push or deploy. Actual first-hover timing remains for
  browser verification; user handles frontend push/deploy. Extra gallery image
  traffic is expected even when some photos are never selected.

## Product Header OEM Removal - 2026-10-14

- User requested removing the separate OEM / part-number row from the product
  header. Removed the row added in SEO commit 986b285 (2026-10-13 05:20 +04:00).
- Keep existing specifications, OEM search/data and Product schema mpn. Do not
  restore the header row as part of SEO work. User handles push/deploy.

## SEO Current Decisions - 2026-10-13

- JSON-LD uses textContent with safe escaping; global title adds FlexDrive once.
  Backend blank seo_title derives name/make/model/years/side/manufacturer, with
  NO automatic OEM/MPN or SKU additions. Manual SEO overrides are preserved;
  admin name edits survive both imports while price/stock continue updating.
- SSR pagination links, visible OEM/fitments, actual Product schema photos and
  initial HTTP errors implemented. Unknown/inactive category404, real empty
  category200/noindex; category lookup uses the new backend detail endpoint.
- Backend catalog0028/0029 and category detail API must be ready before frontend.
  User handles push/deploy; no browser/server start, domain/indexing/provider
  checks or changes without a new request. Keep BlogInnerHeader.vue user edit.
- Prior scoped tests/typecheck/build passed; post-revert3 title tests passed.
  Detailed reports/logs archived in backend ignored local-docs/seo-2026-10-13/;
  rollout instructions: paired backend docs/SEO_RELEASE_2026-10-13.md.

- User authorized only invented-URL issue2 now: CMS rejects fake nested paths;
  real article prefix is validated by backend before cache, wrong prefixes404,
  old slugs under the valid prefix301 to the real URL with query retained.
  41 frontend tests, scoped lint/typecheck pass. Backend33 tests pass. Both repos
  need push/deploy; no migration. Product title rule preserved.
- User separately authorized blog dates: backend exposes effective updated_at
  from newest text/metadata edit; existing Article dateModified consumes it.
  ContentItemData type and real JSON-LD tests updated; published_at independent.
  Sitemap page selection/noindex/domain/env deferred until indexing opening;
  photos user-owned.

## Browser Tracking Host Isolation - 2026-10-10

- User authorized disabling browser Google/Meta tracking outside flexdrive.ge.
  Shared isProductionTrackingHost checks the actual window.location.hostname,
  exact canonical host only. GTM stops before consent/script initialization;
  ecommerce/search/selection/purchase emit no dataLayer events elsewhere.
- Localhost, IPs, Vercel/staging and temporary DigitalOcean production URLs are
  blocked even with saved/new granted consent. www redirects to the canonical
  domain under the existing middleware; www itself does not initialize tracking.
- Existing combined consent, business-route exclusions, company SKU/value and
  purchase event_id contracts remain. Dashboard report reads are independent.
- 35 focused tracking/search/business tests, Nuxt typecheck and scoped ESLint pass.
  No env/GTM/provider change, browser/server session, real purchase or deployment.
  Supersedes old staging tracking setup requirements; user handles push/deploy.
  Actual domain/event delivery and purchase dedup remain cutover verification.

## Meta Marketing Dashboard Connector - 2026-10-10

- User authorized connecting Meta to dashboard; production env entry is for user.
  /business/marketing now renders BusinessMarketing/useBusinessMarketing, backed
  by private API business/marketing. Facebook/Instagram current profiles and period
  insights, Ads costs/clicks/reach/website attribution/campaigns are separate.
- Use existing Tailwind/font/color tokens and BaseButton. Lazy modular ECharts bar
  chart loads only for private marketing activity. No new package/public secret.
  Missing/range/error states are not zeros, stale data carries original timestamp;
  period changes/unmount cancel old requests and retain independent business auth.
- FB activity max90 days, IG max30; profile counts are current, not growth. Ads use
  account currency/timezone (currently USD/Asia/Tbilisi); no GEL conversion. Unique
  reach is whole-period; Meta attribution is not added to actual order ledger.
- 47 business frontend tests, typecheck/scoped ESLint and production build passed;
  details in paired docs/BUSINESS_DASHBOARD_STAGE5.md. Real backend reader returned
  Oct1-10 FB followers3, IG followers0, zero activity and genuine empty Ads.
- Backend-only BUSINESS_META_ACCESS_TOKEN already exists locally. User enters same
  full value in production, then deployed connector reads it. No production edit,
  push/deploy, browser/server start or fake data. Visual user review remains next;
  active campaign rendering/ecommerce events/domain verification remain separate.

## GA4 Local Live Connection Verified - 2026-10-10

- User authorized paired backend local .env configuration from the Desktop reader
  JSON. Backend secret configured, Analytics Data API Enabled and actual readonly
  GA4 traffic/search batch requests succeeded, exact flexdrive.ge only, true empty
  October 1-10 report. Supersedes older not_configured status below for local backend.
- Backend empty dimensionless response parser fixed with a regression test;
  15 connector/scope tests pass. No frontend secret/config or production deployment.
  Backend restart may be needed; user dashboard visual review remains pending.
  See paired backend docs/BUSINESS_DASHBOARD_STAGE4.md for verification evidence.

## GA4 Users Dashboard Prepared - 2026-10-09

- User requested GA4 connector now, superseding older domain-cutover deferral for
  connector code only. /business/users uses BusinessUsers/useBusinessAnalytics and
  paired backend protected business/analytics endpoint. Host is only flexdrive.ge;
  server credentials remain absent, so current UI honestly shows not_configured.
- Georgian visitor/source/search reports, modular lazy ECharts chart/daily table,
  version-2 results/no-results terms and automatic observed-data summary. Shared
  BaseButton, Tailwind design tokens/date dark mode/existing scrollbar styling.
  Errors are not zeros; old server snapshots carry stale message/date. Pending
  requests cancel on period change/unmount, independent business auth is retained.
- 40 business frontend tests pass (7 new analytics), typecheck/scoped ESLint and
  production build pass. Browser visual review remains for user; no storefront
  browser/server session started. Google service key/Data API activation and live
  read/metric compatibility are pending confirmation; no env/secrets edit/deploy.
- Stage 4 is not complete yet. Actual ecommerce event/funnel delivery is still
  unverified/deferred; never infer ordered conversion from plain event counts.
  Details: paired backend docs/BUSINESS_DASHBOARD_STAGE4.md.

## Search GTM Published - 2026-10-09

- User explicitly requested immediate GTM publication. GTM-MVNFL9TH version 10,
  GA4 search results and selection tracking, is verified Live, Latest; exactly
  eight prepared search changes published. Supersedes draft status below.
- Frontend push/deployment is still deferred to the user. New payload fields start
  after deployment; actual event delivery/DebugView verification remains pending.
  GA4 definitions are saved; dashboard connector remains deferred to domain cutover.
- Proof: paired backend artifacts/analytics/ga4-search-version-10-live.png.

## Search Analytics Preparation - 2026-10-09

- User authorized focused search tracking work. Push/deploy remain for the end.
- HeaderSearch submit no longer counts before results; catalog sends search after
  successful current response/client mount with actual total count, outcome,
  filtered yes/no and tracking version 2. Header suggestion selection uses separate
  select_search_result with public company SKU. Core search/API/UI unchanged.
- useCatalogSearchAnalytics uses in-memory shared useState and synchronous actual
  router query tracking. Pagination/sort/filter/category remount cannot duplicate;
  old path/query revisions cannot attach stale results. Errors are not zero results.
  Full reload/reentry is a fresh results view. No persistent search history/storage.
- Existing consent/private-route rules preserved, no replay of denied searches.
  Search-event text masks obvious contacts/caps 100 chars only in analytics copy;
  automatic GA4 events and query URLs still need their own privacy verification.
- 48 focused tests passed, including actual catalog setup/API count/error behavior,
  header selection/navigation, Vue/router dedup/stale/consent/SSR cases. Scoped ESLint,
  Nuxt typecheck and whitespace checks pass. No storefront browser/server run.
- Existing GTM now has eight unpublished workspace changes for these events;
  GA4 has three Event dimensions and Standard search_result_count metric saved.
  No GTM Submit/Publish or production deployment. Coordinated release and Tag
  Assistant/DebugView verification remain; read-only dashboard connector at domain
  cutover. Paired backend docs/SEARCH_ANALYTICS.md records exact mappings/status.

## Tracking Consent Dispatch Correction - 2026-10-09

- User authorized a focused correction after online Tag Assistant showed Consent
  not configured. google-tag-manager.client.ts now pushes gtag Arguments rather
  than rest-parameter Arrays; default/update are recognised in local Tag Assistant.
- Keep analytics/marketing COMBINED. Preserve the existing cookie/banner and GTM
  blocking before acceptance. Loaded Meta receives consent revoke/grant on changes
  and latest-choice synchronization on GTM script load. Private business pages
  still initialize neither Google nor Meta.
- Eight actual-plugin/composable Vue tests plus 13 business tests pass; scoped
  ESLint/typecheck/whitespace pass. User-started localhost browser verified denied
  default, acceptance/granted, denied revocation payload and no vendor scripts on
  rejected reload. Original all-false local choice restored; debug session stopped.
- No GTM publish/config/env/credentials or deployment/push. Production requires
  frontend deployment and repeat GA4/Meta verification; Meta network suppression
  and delayed-load edge cases are not claimed as browser-proven by unit tests.
  Evidence is in paired backend artifacts/analytics/ga4-consent-*-local.png.

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
- Local tooling note: if ordinary sandboxed PowerShell reads/searches fail with `windows sandbox: spawn setup refresh`, do not keep retrying the same sandbox path or send noisy intermediate explanations. For read-only project inspection, go directly to the approved/escalated read-only command path with a concise reason, then continue the task.

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

## Current CrossMotors Image Source Audit - 2026-06-09

- CrossMotors website image-enrichment audit is documented in `docs/crossmotors-image-source-audit-2026-06-09.md`.
- CrossMotors Wix product sitemap currently exposes 1006 product-page entries, all with image URLs.
- FlexDrive public catalog snapshot checked during the audit had 1762 products and 0 products with `primary_image`.
- Safe first-pass automatic matching/fill estimate is about 160-180 products using product name plus vehicle/model page context.
- More aggressive name-based matching could reach about 480 products, but many matches are ambiguous and should require manual review.
- Realistic staged target: about 170 automatic image imports first, then potentially 400-500 total products with images after review.
- Supplier API stock/price cron must not touch product images. Image enrichment should remain a separate workflow that downloads accepted source images to FlexDrive media storage/Cloudinary and attaches those local/Cloudinary images to products.

## Current Suo Lun Image Source Feasibility - 2026-06-09

- Suo Lun-specific image source feasibility report is documented in `docs/suo-lun-image-source-feasibility-2026-06-09.md`.
- Public catalog snapshot: 914 Suo Lun products, 0 with `primary_image`, 853 with `manufacturer_part_number`, 61 without.
- Suo Lun products split by vehicle make: Subaru 648 (608 with part number) and Volkswagen 266 (245 with part number).
- No strong public official Suo Lun catalog was found in the first research pass. Treat Suo Lun image enrichment as an OEM-number/source aggregation problem, not as a single-manufacturer-catalog scrape.
- CrossMotors `SL - China` likely corresponds to Suo Lun. Initial visible CrossMotors page-grid data gave 206 unique `SL - China` products and about 65 strong Suo Lun matches. Later browser/API inspection found the Wix Stores load-more endpoint, which increased parsed `SL - China` candidates to 719.
- OEM/dealer/catalog/marketplace sources can find many candidates by part number, but usage rights are unclear. Signeda/TecDoc-style pages look technically strong but include anti-copy/TecDoc permission warnings, so do not scrape/import them without permission or licensing.
- The CrossMotors dry-run/import path now exists. Remaining scale-up should focus on reviewing the 242 medium-confidence matches and evaluating licensed/OEM-number sources, not broad marketplace scraping.

## Current Suo Lun Image Import State - 2026-06-09

- A first CrossMotors-backed Suo Lun image importer is implemented in the paired backend repo:
  - `catalog/suo_lun_image_import.py`
  - `catalog/management/commands/import_suo_lun_images.py`
  - `catalog/test_suo_lun_image_import.py`
- The command imports only high-confidence `auto_import` matches from CrossMotors `SL - China`, skips products that already have images by default, creates normal `ProductImage` rows, and relies on the existing backend image pipeline to generate desktop/tablet/mobile WebP variants.
- Dry-run before import checked 914 published Suo Lun products and parsed 276 CrossMotors `SL - China` candidates:
  - 62 `auto_import`
  - 115 `review`
  - 737 skipped/no candidate
  - 0 existing-image skips
- Browser/API inspection found CrossMotors Wix Stores load-more data:
  - listing pages embed `catalog.category.id` as the Wix Stores `mainCollectionId`;
  - product batches are available from `POST https://www.crossmotors.ge/_api/wix-ecommerce-storefront-web/api`, operation `getFilteredProducts`, with `offset`/`limit`;
  - the command retrieves the short-lived public Wix Stores token from `GET https://www.crossmotors.ge/_api/v1/access-tokens` at runtime and does not store or report it.
- Storefront API-expanded dry-run checked 914 published Suo Lun products and parsed 719 CrossMotors `SL - China` candidates:
  - 90 additional `auto_import` after the first 62 images already existed;
  - 242 `review`;
  - 582 skipped/no candidate;
  - 62 existing-image skips.
- Local development database import was run on 2026-06-09:
  - first batch imported 5 images with 0 errors;
  - full local import then imported 57 additional images with 0 errors;
  - Storefront API-expanded import then imported 90 additional images with 0 errors;
  - local Suo Lun image count after import: 152 products with images and 152 `ProductImage` rows;
  - post-import dry-run now shows 0 remaining `auto_import`, 242 `review`, 672 skipped/no candidate, and 152 existing-image skips.
- Local API verification passed for sample SKU `CM-000045` and latest-batch sample SKU `CM-002991`: product detail and catalog list responses both returned `primary_image.desktop`.
- Focused backend tests passed: `catalog.test_suo_lun_image_import` and `catalog.test_crossmotors_import` ran 20 tests OK after Storefront API expansion. The only warning was the existing `django-ckeditor` CKEditor 4 support warning.
- JSON reports are stored in frontend docs:
  - `docs/suo-lun-image-dry-run-2026-06-09.json`
  - `docs/suo-lun-image-import-small-batch-2026-06-09.json`
  - `docs/suo-lun-image-import-local-2026-06-09.json`
  - `docs/suo-lun-image-dry-run-storefront-2026-06-09.json`
  - `docs/suo-lun-image-import-local-storefront-2026-06-09.json`
  - `docs/suo-lun-image-post-import-dry-run-storefront-2026-06-09.json`
- A visual manual review page exists for the 242 medium-confidence Suo Lun/CrossMotors matches:
  - project copy: `docs/suo-lun-image-review.html`
  - project data: `docs/suo-lun-image-review-data-2026-06-09.js`
  - desktop copy: `C:\Users\kench\Desktop\suo-lun-image-review.html`
  - desktop data: `C:\Users\kench\Desktop\suo-lun-image-review-data-2026-06-09.js`
- Decision checkpoint: leave those 242 review matches untouched until the user provides an approved SKU/CSV export after manual review. Continue only with Suo Lun, and do not move to other manufacturers yet.
- External source pass was run for the remaining Suo Lun no-candidate products:
  - remaining no-candidate list: `docs/suo-lun-remaining-no-candidate-2026-06-09.json`
  - SubaruPartsDeal exact OEM-photo discovery: `docs/suo-lun-external-subarupartsdeal-discovery-2026-06-09.json`
  - TopsMade/VW discovery: `docs/suo-lun-external-topsmade-listpage-discovery-2026-06-09.json`
  - unified external candidates: `docs/suo-lun-external-image-candidates-2026-06-09.json`
- Backend external importer was added in `catalog/management/commands/import_suo_lun_external_images.py`. It imports only `auto_import` external candidates, skips products with existing images, and can attach multiple gallery images per product without overwriting.
- Local development external import was run on 2026-06-09:
  - 106 external auto candidates were imported across a 5-product small batch and then a 101-product full batch;
  - errors: 0;
  - post-import external dry-run shows 0 remaining external `auto_import`, 11 external `review`, and 106 existing-image skips;
  - local Suo Lun products with images after CrossMotors + external import: 258;
  - local Suo Lun `ProductImage` rows: 449.
- External import reports:
  - `docs/suo-lun-external-image-dry-run-2026-06-09.json`
  - `docs/suo-lun-external-image-import-small-batch-2026-06-09.json`
  - `docs/suo-lun-external-image-import-local-2026-06-09.json`
  - `docs/suo-lun-external-image-post-import-dry-run-2026-06-09.json`
- Focused backend tests after external importer passed: `catalog.test_suo_lun_image_import` and `catalog.test_crossmotors_import` ran 23 tests OK. Local detail API verification for external sample `CM-000010` returned `primary_image.desktop` and 4 gallery images.
- Additional used-marketplace source pass was run for the 403 Suo Lun products that still had no candidate after the external import:
  - BE FORWARD exact genuine-part-number endpoint checked 357 products with part numbers, found 21 products / 58 candidate rows.
  - RRR/Ovoko AJAX exact-code search checked the same 357 products, found 129 products / 553 exact-code rows, and excluded 27 variant-risk rows.
  - Combined used-marketplace queue is review-only because the photos are used-marketplace images and sample checks showed variable quality, dirt, and marker writing.
  - Combined review files:
    - `docs/suo-lun-external-used-marketplace-image-candidates-2026-06-09.json`
    - `docs/suo-lun-external-used-marketplace-image-candidates-2026-06-09.csv`
    - `docs/suo-lun-used-marketplace-image-review.html`
    - `docs/suo-lun-used-marketplace-review-data-2026-06-09.js`
  - Combined dry-run report: `docs/suo-lun-external-used-marketplace-dry-run-2026-06-09.json`; result was 407 review rows, 0 auto imports, 0 missing SKUs, 0 ignored rows, and no DB changes.
  - Current source coverage after this pass: 914 published Suo Lun products = 258 local products with images + 385 products pending review + 271 still without any candidate source. Coverage report: `docs/suo-lun-current-source-coverage-after-used-marketplaces-2026-06-09.json`.
- RockAuto cross-reference source pass was started for those remaining 271 products:
  - checked 120 of 225 products that had manufacturer part numbers before RockAuto stopped responding with connect timeouts; 46 products had no part number and were skipped for this source.
  - found 17 products / 28 clean catalog-image candidate rows, but kept them review-only because RockAuto part-search results are aftermarket/cross-reference matches and can have side/variant ambiguity.
  - no images were imported from RockAuto and no existing product images were touched.
  - Review files: `docs/suo-lun-rockauto-image-review.html`, `docs/suo-lun-rockauto-review-data-2026-06-09.js`, and Desktop copies `C:\Users\kench\Desktop\suo-lun-rockauto-image-review.html`, `C:\Users\kench\Desktop\suo-lun-rockauto-review-data-2026-06-09.js`.
  - Current coverage after RockAuto: 914 published Suo Lun products = 258 local products with images + 402 products pending review + 254 still without any candidate source. Coverage report: `docs/suo-lun-current-source-coverage-after-rockauto-2026-06-09.json`.
- Alibaba source pass superseded the RockAuto queue for active work after the user asked to ignore RockAuto and focus only on Alibaba for the remaining 271 products:
  - user manually cleared Alibaba captcha in the browser session, then the collector fetched Alibaba search pages with that same session.
  - target list: `docs/suo-lun-alibaba-target-271-2026-06-10.json`.
  - raw output: `docs/suo-lun-alibaba-browser-raw-results-2026-06-10.json`.
  - found 98 products / 179 Alibaba candidate rows; 173 of the 271 still had no Alibaba candidate.
  - no images were imported from Alibaba and no existing product images were touched.
  - Review files: `docs/suo-lun-alibaba-image-review.html`, `docs/suo-lun-alibaba-review-data-2026-06-10.js`, and Desktop copies `C:\Users\kench\Desktop\suo-lun-alibaba-image-review.html`, `C:\Users\kench\Desktop\suo-lun-alibaba-review-data-2026-06-10.js`.
  - Current active coverage after Alibaba, ignoring RockAuto per user instruction: 914 published Suo Lun products = 258 local products with images + 483 products pending review + 173 still without any candidate source. Coverage report: `docs/suo-lun-current-source-coverage-after-alibaba-2026-06-10.json`.
- Final broad-web DuckDuckGo Images pass was run for those remaining 173 products after `slautoparts.com` produced no useful matches and Google Images started showing a challenge:
  - found 158 products / 572 candidate rows, review-only; 15 products still have no candidate source.
  - no images were imported and no existing product images were touched.
  - Review files: `docs/suo-lun-final-173-duckduckgo-image-review.html`, `docs/suo-lun-final-173-duckduckgo-image-review-data-2026-06-10.js`, and Desktop copies `C:\Users\kench\Desktop\suo-lun-final-173-duckduckgo-image-review.html`, `C:\Users\kench\Desktop\suo-lun-final-173-duckduckgo-image-review-data-2026-06-10.js`.
  - Final current coverage, still ignoring RockAuto: 914 published Suo Lun products = 258 local products with images + 641 products pending review + 15 still without any candidate source. Coverage report: `docs/suo-lun-current-source-coverage-final-after-duckduckgo-2026-06-10.json`.
- CrossMotors manual-review approved import was run locally on 2026-06-13 after the user exported `C:\Users\kench\Desktop\suo-lun-image-review-decisions.json`:
  - decision export: 242 total, 217 approved, 22 rejected, 2 skipped, 1 still pending (`CM-000486`, part number `84001FL00B`);
  - dry-run was clean: 217 approved rows, 217 planned, 0 missing products, 0 missing image URLs, 0 existing-image skips, 0 errors;
  - commit imported 217 of 217 approved CrossMotors images with 0 errors;
  - local products with images after import: 475;
  - local `ProductImage` rows after import: 666;
  - this local import was first done with a temporary frontend helper that has since been removed from the repo cleanup;
  - the backend now has the official staging-safe command `python manage.py import_suo_lun_review_images --decisions-path <decisions.json> --review-data-path <review-data.js> [--commit]` for that same 217 approved set.
  - this was local backend media storage, not Cloudinary, because the local backend `.env` did not enable `USE_CLOUDINARY_MEDIA`; staging remains untouched.
- Current local Suo Lun missing-image checkpoint after that approved import:
  - total published Suo Lun products: 914;
  - products with images locally: 475;
  - products still without images locally: 439;
  - review-pending products are intentionally counted as without images in this checkpoint.
- Staging is not updated by the local runs. To reproduce the current 475-product local coverage on staging after backend deploy, run the backend image import commands in this order:
  - `python manage.py import_suo_lun_images --commit` for CrossMotors automatic matches;
  - `python manage.py import_suo_lun_external_images --candidate-path <external-candidates.json> --commit` for the external automatic candidates;
  - `python manage.py import_suo_lun_review_images --decisions-path <decisions.json> --review-data-path <review-data.js> --commit` for the 217 manually approved CrossMotors review images.
- The supplier API stock/price cron should remain separate and must not touch `ProductImage`.

## OEM Image Search Workflow

When the user asks to search auto-part images by OEM code, use this workflow by default and do not ask the user to repeat it:

- Use Playwright MCP directly when the user asks for it. Playwright is available as MCP tooling; do not waste time looking for it in `node_modules`, local package folders, or unrelated tooling paths.
- Do not report noisy discovery failures such as "Playwright is not in node_modules" or "I cannot find it here/there". Start the Playwright MCP browser immediately.
- The user will specify how many OEM codes to process. Take exactly that batch size unless the user changes the scope.
- For each OEM code, open Google in Playwright and search the OEM code.
- Review Google's result links and prefer trustworthy product-detail sources: official Subaru/brand parts sites, OEM parts stores, reputable parts dealers, Amazon product pages, Alibaba product-detail pages, and other clear product pages that show the same OEM.
- If the first result does not contain the matching auto part or does not clearly confirm the OEM, go back to Google results and try another trustworthy result. Do not mark the OEM as not found after checking only one weak source.
- When a matching product-detail page is found, open the product gallery/images on that page and download the clean, good-quality product images. Prefer real part photos over diagrams, thumbnails, logos, placeholders, or generic site images. Use diagrams only when that is the only useful source and the page clearly confirms the OEM.
- Match the found page against the OEM first. If the image or product looks suspicious, also compare the product name/part type with the local product name; translate Georgian/Latin-transliterated names mentally as needed. Do not rely on year ranges as the decisive match because source-site years can differ from the local database.
- Add the downloaded images to the Desktop review HTML/JSON workflow, currently `C:\Users\kench\Desktop\suo-lun-amazon-gallery-review-test.html` and `C:\Users\kench\Desktop\suo-lun-amazon-gallery-review-test.json`, saving image assets under `C:\Users\kench\Desktop\suo-lun-amazon-gallery-review-assets`.
- If a site shows CAPTCHA, Cloudflare, robot verification, or security verification, stop on that page and tell the user to solve it. Do not skip ahead through the batch while the user is expected to click the challenge. Resume only after the user says it is solved.
- Keep progress updates short and only report key events: CAPTCHA needed, batch finished, counts, and any products that were intentionally left without images because no reliable matching image was found.
- Do not use side routes, broad scraping alternatives, or unrelated search methods when the user specifically provides product-detail links. In that case, open those exact links with Playwright MCP, extract/download the product images from those pages, and attach them to the matching OEM entries in the review file.

## Current OEM Image Review Checkpoint - 2026-06-19

- The broad OEM-based image discovery pass is complete for the current backend product data across all brands.
- Every product that currently has an OEM/manufacturer part number has been added to the shared Desktop review workflow. No OEM-bearing backend products remain outside the review.
- Current shared review files:
  - HTML: `C:\Users\kench\Desktop\suo-lun-amazon-gallery-review-test.html`
  - JSON: `C:\Users\kench\Desktop\suo-lun-amazon-gallery-review-test.json`
  - downloaded assets: `C:\Users\kench\Desktop\suo-lun-amazon-gallery-review-assets`
- Current review checkpoint after the broad search pass:
  - total review entries: 1684;
  - entries with downloaded images: 1155;
  - entries still without images or requiring a better source: 529.
- Products without OEM/manufacturer part numbers are maintained separately in:
  - `C:\Users\kench\Desktop\suo-lun-no-oem-review.html`
  - despite the historical file name, this file now contains no-OEM products from all brands, not only Suo Lun.
  - current no-OEM count: 105.
- This discovery stage is complete, but the overall product-image project is not finished. Do not treat all current matches as approved or final.
- The next active stage is manual review by the user:
  - inspect every review entry and verify that the image shows the correct part, side, placement, and product type;
  - identify incorrect, weak, diagram-only, irrelevant, or missing images;
  - manually locate better product-detail sources for entries where the automatic pass failed or selected a questionable image;
  - provide those exact product-detail links back to Codex.
- When the user supplies correction/source links, resume the established Playwright MCP workflow:
  - open the exact links;
  - verify the OEM and product type;
  - download the clean product images;
  - replace or add images on the matching review entry;
  - preserve the same shared HTML/JSON/assets files instead of creating new review files.
- Local reusable helpers for future OEM batches exist under `tools/` but are excluded through `.git/info/exclude`, so they remain available locally and are not committed:
  - `tools/oem_image_search_playwright.js`
  - `tools/merge_oem_image_review.py`
  - `tools/oem_image_batch.example.json`
