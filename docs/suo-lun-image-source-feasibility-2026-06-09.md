# Suo Lun Image Source Feasibility And Dry-Run Plan - 2026-06-09

## Goal

Find the best image-source strategy for FlexDrive's 914 Suo Lun products and define a dry-run plan before any image import is implemented.

This is a feasibility report only. No product data, product images, Cloudinary media, or supplier imports were changed.

## FlexDrive Suo Lun Snapshot

Read from the public FlexDrive catalog API via the frontend proxy.

- Total FlexDrive products: 1762
- Suo Lun products: 914
- Suo Lun products with current `primary_image`: 0
- Suo Lun products without current `primary_image`: 914
- Suo Lun products with `manufacturer_part_number`: 853
- Suo Lun products without `manufacturer_part_number`: 61

Vehicle make split:

- Subaru: 648
  - with manufacturer part number: 608
  - without manufacturer part number: 40
- Volkswagen: 266
  - with manufacturer part number: 245
  - without manufacturer part number: 21

Category split:

- ვიზუალის ნაწილები: 391
- ძარის ნაწილები: 219
- ფარები და განათება: 127
- რადიატორები და გაგრილება: 64
- ძრავი და ფილტრები: 49
- სარკეები: 24
- სავალი ნაწილები: 24
- ელექტროობა: 16

Important implication: Suo Lun is not a many-make problem. It is mostly a Subaru/VW OEM-number enrichment problem.

## Key Data Advantage

853 of 914 Suo Lun products have `manufacturer_part_number`. This should be the primary search/matching key.

Name-only matching is risky because many product names are generic and repeated across vehicles:

- `ცხაურა`
- `წინა ბამპერი`
- `სანისლე ბუდე`
- `წინა ფარი`
- `პადკრილნიკი`
- `ეკრანი`
- `წყლის რადიატორი`

Recommended matching order:

1. `manufacturer_part_number` / OEM number
2. vehicle make/model/year from product description
3. side/placement markers such as LH/RH, left/right, front/rear
4. normalized product name
5. source image quality and non-placeholder check

## Source Candidates

### 1. CrossMotors Website

Status: best near-term source for supplier-owned/related product photos.

Known facts from prior CrossMotors audit:

- CrossMotors product sitemap exposes 1006 product-page entries with image URLs.
- CrossMotors page grids include manufacturer ribbons such as `SL - China`.
- `SL - China` appears to correspond to our `Suo Lun` manufacturer/brand.

Suo Lun specific read-only comparison:

- CrossMotors visible page-grid product pairs parsed: 715
- CrossMotors visible `SL - China` page-grid pairs: 276
- CrossMotors visible unique `SL - China` products: 206
- Strong current Suo Lun matches from visible page HTML: 65
- Exact/near-exact among those: 65
- Ambiguous among those: 3

Limitations:

- Initial page HTML exposes only part of some Wix grids.
- More products may be loaded through Wix "load more" or background endpoints.
- `browser-trace` + `browser-to-api` should be used in the next CrossMotors phase to discover the load-more/gallery data source.

Use mode:

- Best candidate for authorized import if supplier confirms image reuse permission.
- Do not hotlink Wix URLs. Download accepted images and upload to FlexDrive Cloudinary/media storage.

### 2. Official Or Dealer OEM Catalogs

Status: useful for OEM-based matching and visual reference; image import requires permission/licensing review.

Examples found during spot checks:

- `57731AN08A` resolves on Subaru Direct Wholesale and SubaruPartsDeal with product details and images.
- `91112AN50A` resolves on SubaruPartsDeal, but the checked page returned a placeholder image, which shows why image-quality filtering is required.
- Volkswagen OEM numbers such as `5C6807233B` and `5K7805965A` resolve on various VW/OEM reseller catalog pages.

Strengths:

- Excellent OEM number matching.
- Often includes fitment, position, side, description, and product/diagram images.
- Good for validating that a CrossMotors or marketplace image candidate is the correct part.

Risks:

- Images may be OEM diagrams or placeholders, not actual aftermarket product photos.
- Many sources block scripted access with 403.
- Legal permission for copying images into our storefront is not guaranteed.

Use mode:

- Reference/review source by default.
- Import only if the source has a clear reusable/licensed image arrangement.

### 3. Signeda / EDA Parts / TecDoc-Backed Catalog Pages

Status: technically very promising for Subaru body parts, but not safe to scrape/import without permission.

Spot checks:

- Signeda OEM page for `57731AN08A` returns an aftermarket product match with product code, OEM code, side, position, model/year info, and importer/manufacturer metadata.
- Signeda OEM page for `91112AN50A` returns an aftermarket product match for Subaru Wilderness fender arch molding with side/position/year metadata.

Important legal note:

- Signeda pages include a warning that data copying without prior TecDoc permission is prohibited. This makes it unsuitable for unsanctioned scraping/import.

Strengths:

- Very relevant to our product categories.
- OEM code search appears strong.
- Gives aftermarket-style metadata rather than only OEM dealer data.

Use mode:

- Do not scrape/import by default.
- Treat as a potential licensed/permission-based source.
- If permission or TecDoc-backed access is obtained, this could become one of the strongest sources.

### 4. Marketplaces And Regional Parts Sites

Examples observed through spot checks:

- eBay
- Alibaba showroom/search pages
- Prom.ua
- Allegro
- Ciceksepeti
- AvtoPro
- OEMVWShop/OEMWolf

Strengths:

- Many OEM numbers return pages with multiple images.
- Some listings have 2-5 photos per product.
- Especially useful for Volkswagen trim/body items and Subaru OEM numbers.

Risks:

- Image ownership is fragmented across sellers.
- Product photos may be used, damaged, aftermarket, OEM, or unrelated variants.
- Many pages are blocked, dynamic, duplicated, or unreliable for automation.
- Good search visibility does not equal permission to reuse images.

Use mode:

- Good for manual review and candidate discovery.
- Not recommended as a direct automatic image import source unless we establish rights/permission with a marketplace/supplier or a specific catalog provider.

### 5. Licensed Automotive Catalog Data

Status: strongest long-term legal/scalable path if coverage and pricing are acceptable.

Candidates to evaluate:

- TecDoc/TecAlliance or regional TecDoc distributors
- Partly
- other paid auto-parts data APIs with OEM/cross-reference and image data

Why this matters:

- Our 853 Suo Lun products with OEM/manufacturer part numbers are well suited for a licensed part-number lookup workflow.
- A licensed provider can reduce legal risk and provide standardized metadata, cross-references, and image usage rights.

Risks:

- Cost and contract requirements.
- Coverage for Suo Lun itself may be weak if Suo Lun is not a public TecDoc brand.
- Coverage may still be through analog/OEM/aftermarket cross-reference brands, not "Suo Lun" directly.

Use mode:

- Evaluate before production-scale enrichment.
- If licensed coverage is good, use it as the main MPN-based source and CrossMotors as a supplier-specific supplement.

## Current Assessment

No strong public official Suo Lun catalog was found in the first research pass. "Suo Lun" appears much less searchable than the underlying OEM numbers and the CrossMotors `SL - China` label.

Therefore, the best strategy is not "find Suo Lun's official site and scrape it." The better strategy is a multi-source image enrichment system:

- CrossMotors for supplier-related product photos.
- OEM number search for Subaru/VW reference and validation.
- Licensed catalog source if we can get usable image rights.
- Marketplace/regional sites only as review/candidate discovery unless usage rights are clear.

## Practical Coverage Estimate

Conservative usable estimate today:

- CrossMotors visible `SL - China` strong matches: about 65 Suo Lun products.
- CrossMotors may increase after load-more/API discovery, but this requires the next browser-trace/browser-to-api pass.

Technical candidate estimate:

- 853 Suo Lun products have OEM/manufacturer part numbers.
- Many of those can likely produce image candidates through web/OEM/marketplace search.
- This does not mean those images are safe to import.

Realistic staged target:

1. Phase 1: 60-100 Suo Lun images from CrossMotors/high-confidence supplier-related matches.
2. Phase 2: expand CrossMotors with load-more/API discovery and review; possible target 100-200 Suo Lun images if more `SL - China` grid data is exposed.
3. Phase 3: evaluate licensed/OEM data. If licensing and coverage are good, the addressable target could become several hundred Suo Lun products because 853 have part numbers.
4. Phase 4: marketplace/regional sources can assist manual review, but should not be treated as auto-import unless usage rights are solved.

## Dry-Run Plan

The next implementation should be a dry-run report, not an image importer.

### Input

FlexDrive Suo Lun products:

- product id
- SKU
- name
- manufacturer part number
- short description
- vehicle make/model/year
- category
- placement/side
- current image status

Source candidates:

- CrossMotors product sitemap and model pages
- CrossMotors load-more/API data if discovered
- allowed/licensed catalog sources if available
- reference-only OEM/marketplace sources, clearly flagged as not importable

### Output

For each Suo Lun product:

- product id
- SKU
- product name
- manufacturer part number
- vehicle context
- current image status
- best candidate source
- candidate source URL
- candidate image URL
- candidate source product name
- candidate source OEM/part number
- candidate source vehicle/fitment
- candidate source side/placement
- match confidence: `high`, `medium`, `low`, `none`
- match reason
- ambiguity count
- image quality result
- usage mode: `import_allowed`, `needs_permission`, `reference_only`
- recommended action: `auto_import`, `review`, `skip`

### Auto-Import Rules

Auto-import should require all of the following:

- source usage is allowed or licensed
- exact manufacturer part number match, or unique CrossMotors SL page-context match
- vehicle make/model/year agrees
- side/placement agrees where present
- image is not placeholder/logo/diagram-only unless explicitly approved
- product currently has no admin-approved image
- match is not ambiguous

### Review Rules

Manual review should be required when:

- the match is name-only
- the product name is generic
- multiple source candidates exist
- year range only partially overlaps
- side/placement is missing or contradictory
- source is a marketplace/reseller
- source usage rights are unclear

### Image Import Rules

When a candidate is accepted:

- download image from source
- compute content hash
- reject known placeholders/logos
- store source URL and original image URL
- upload to FlexDrive Cloudinary/media storage
- attach as product image
- never hotlink third-party image URLs
- never let the supplier stock/price cron overwrite product images

## Recommended Next Step

Run a focused source-discovery pass in this order:

1. Use `browser-trace` + `browser-to-api` on CrossMotors model pages to discover Wix load-more product data and increase `SL - China` coverage.
2. Build a dry-run matcher for Suo Lun using CrossMotors data only.
3. Separately evaluate licensed catalog options for OEM-number image lookup.
4. Only after dry-run review, implement Cloudinary import for approved sources.

Do not start broad marketplace scraping until source usage rights and review rules are settled.

## Current Working Checkpoint - 2026-06-13

Scope: only Suo Lun / SL China published products.

- Total Suo Lun products: 914
- Products with images attached in local backend: 475
- Products still without attached images in local backend: 439
- Review-pending products are counted as still without images until approved and imported.
- Local `ProductImage` rows after the latest approved CrossMotors import: 666
- Staging remains untouched by the local imports.

What has been imported locally:

- Initial CrossMotors automatic import: 152 products.
- External automatic import: 106 additional products.
- CrossMotors manual-review approved import on 2026-06-13: 217 additional products.
- Total current local coverage: 475 products with images.

Remaining source state:

- The remaining 439 products include review candidates from external/manual queues plus 15 products with no useful candidate found yet.
- If all remaining review candidates are approved and imported, expected Suo Lun coverage can reach about 899 of 914 products.
- The final unresolved set would then be about 15 products.

Storage note:

- Local imports used local backend media storage because local `USE_CLOUDINARY_MEDIA` is disabled.
- Running the same import workflow in staging, where Cloudinary is enabled, should upload accepted images to Cloudinary and attach them to staging products.
- The supplier API stock/price cron must remain separate and must not modify `ProductImage`.

Staging command path after backend deploy:

1. `python manage.py import_suo_lun_images --commit`
2. `python manage.py import_suo_lun_external_images --candidate-path <external-candidates.json> --commit`
3. `python manage.py import_suo_lun_review_images --decisions-path <decisions.json> --review-data-path <review-data.js> --commit`

The third command is the official backend replacement for the temporary local helper that imported the 217 manually approved CrossMotors review images.
