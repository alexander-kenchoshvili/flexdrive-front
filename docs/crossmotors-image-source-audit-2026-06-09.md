# CrossMotors Product Image Source Audit - 2026-06-09

## Scope

This is a read-only feasibility audit for using `https://www.crossmotors.ge/` as an image-enrichment source for FlexDrive products that currently arrive from the supplier API without images.

No FlexDrive data was changed.

## Source Site Findings

- CrossMotors is built on Wix.
- `robots.txt` allows crawling generally and points to `https://www.crossmotors.ge/sitemap.xml`.
- The main sitemap links to:
  - `https://www.crossmotors.ge/store-products-sitemap.xml`
  - `https://www.crossmotors.ge/pages-sitemap.xml`
- `store-products-sitemap.xml` currently exposes 1006 product-page URLs.
- All 1006 product sitemap entries include a Wix image URL under `image:loc`.
- Product images are hosted on `static.wixstatic.com`.
- Product detail pages include structured product metadata in page HTML:
  - product name
  - price
  - availability
  - manufacturer-like ribbon, for example `SL - China`
  - media list
  - Wix product id
- Product detail SKU fields appear empty on the checked sample, so SKU/OEM/code matching is not available from the product page sample.
- Vehicle/model pages exist separately, for example `forester-2022-2023`, `outback-2020-2021`, `crv-2023`, etc.
- Model pages expose product cards with product name, manufacturer ribbon, price, product URL, image, and the page-level vehicle/model/year context.
- Model pages render only part of the grid in initial HTML; a later phase should inspect Wix load-more/background traffic if we need complete page-to-product vehicle context.

## FlexDrive Catalog Snapshot

Read from public FlexDrive catalog API via the frontend proxy.

- Products fetched: 1762
- Products with `primary_image`: 0
- Products without `primary_image`: 1762

Top supplier/product brands in the current catalog snapshot:

- Suo Lun: 914
- TYG: 618
- TYC: 96
- JPN Parts: 58
- AJSparts: 37
- Subaru: 12
- Gordon: 12
- TYGP: 11
- CTR: 2
- KAVO: 1

Top categories:

- ვიზუალის ნაწილები: 602
- ძარის ნაწილები: 583
- ფარები და განათება: 201
- სავალი ნაწილები: 116
- რადიატორები და გაგრილება: 77
- ძრავი და ფილტრები: 67
- სარკეები: 62
- ელექტროობა: 54

## Matching Results

Initial conservative matching pass:

- CrossMotors product sitemap image candidates: 1006
- CrossMotors model/page product pairs parsed from page HTML: 715
- Unique CrossMotors products seen in model/page grids: 576
- Unique grid products with sitemap image: 576

Name-only matching:

- FlexDrive products with a normalized name match against CrossMotors sitemap titles: 483
- Ambiguous name-only matches: 364

Name-only matching is not safe for automatic image attachment. Generic names such as `კაპოტი`, `ცხაურა`, `წინა ბამპერი`, and `ეკრანი` match many different vehicles and can easily attach the wrong image.

Stricter matching using product name plus CrossMotors vehicle/model page context:

- Candidate FlexDrive products with stronger page-context match: 177
- Of those, exact/near-exact product-name matches: 167
- Ambiguous stronger matches: 37

Practical fill estimate to keep in future planning:

- CrossMotors currently exposes 1006 products with images.
- FlexDrive currently has 1762 catalog products without primary images.
- Safe first-pass automatic image fill is estimated at about 160-180 products.
- More aggressive name-based matching could reach about 480 products, but many of those need manual review because name-only matches are often ambiguous.
- Realistic staged target: about 170 automatic image imports first, then potentially 400-500 total filled products after review.

This is a safer starting set, but it is still not production-safe without review because:

- Some FlexDrive year ranges are broader than CrossMotors page ranges.
- Some products share generic names across many vehicles.
- Some product pages have variant differences such as `LH`, `RH`, `Sport`, `Limited`, `Wilderness`, engine size, or material.
- CrossMotors page grids initially expose only part of the products.

## Best Implementation Direction

The supplier API should remain the source of truth for product data:

- price
- stock
- SKU/supplier code
- OEM/manufacturer part number
- vehicle make/model/generation where available
- manufacturer/product brand

CrossMotors website should be treated as a separate image-enrichment source only.

Recommended pipeline:

1. Build a read-only CrossMotors image collector.
2. Collect product-page URL, product name, image URLs, manufacturer ribbon, page vehicle context, and source timestamps.
3. Store collected source records separately from FlexDrive products.
4. Run a matching job against FlexDrive products.
5. Assign confidence levels:
   - high: product name plus vehicle/model/year context match clearly
   - medium: good name match but weak/partial vehicle context
   - low: name-only or generic-name match
   - no match: no useful candidate
6. Auto-import only high-confidence matches.
7. Send medium/low matches to admin review.
8. Download accepted images and upload them to FlexDrive media storage/Cloudinary.
9. Attach Cloudinary-backed images to product records.
10. Never hotlink Wix images directly from the FlexDrive storefront.

## Stock Import Isolation

The existing supplier API cron/importer should not touch product images.

Stock/price sync should update only stock, price, availability, and supplier-data fields. Product images should be modified only by the separate image-enrichment workflow, and even that workflow should skip products that already have admin-approved images unless explicitly allowed.

## Browser-To-API Skill Relevance

The `browser-to-api` skill can help if we need to discover Wix background endpoints, especially for:

- load-more product grids
- complete model-page product lists
- hidden store APIs
- response schemas for Wix product/gallery data

For the first pass, CrossMotors sitemap and page HTML already expose enough image data to build a collector. `browser-to-api` is most useful in the next investigation step if we want a cleaner complete data source than parsing initial HTML.

## Risks And Open Questions

- Image usage permission must be confirmed with the supplier before public use.
- Product detail pages checked so far do not expose SKU/OEM/code, so perfect matching is unlikely from the website alone.
- Name-only matching is too risky for automatic import.
- Model-page context improves matching, but complete grid data may need load-more/API discovery.
- We should keep a source audit trail: source URL, original image URL, matched product id, match score, import timestamp, and whether the image was auto-imported or manually approved.

## Recommended Next Step

Build a dry-run image-matching report, not an importer yet.

The dry-run should output:

- FlexDrive product id/SKU/name
- current image status
- best CrossMotors candidate URL
- candidate image URL
- match reason
- confidence level
- ambiguity count
- manual-review flag

After reviewing a sample of high/medium/low results, implement the Cloudinary import path only for accepted/high-confidence matches.
