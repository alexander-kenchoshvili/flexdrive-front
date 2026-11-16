# Static CSS/JS caching

Deployed and verified in production 2026-11-16. No ENV or backend change was needed.

The storefront guard keeps documents, preview and API responses private/no-store.
Nitro serves public files before that guard, but its final response hook previously
overrode the built CSS/JS cache headers too. That hook now narrowly allows:

- GET or HEAD, status 200 or conditional 304;
- a root `/_nuxt/` CSS/JS filename with the current Vite eight-character hash;
- a file present in Nitro's generated public-asset manifest;
- the correct static MIME type; no Set-Cookie response.

These responses get `public, max-age=31536000, immutable`. New content receives a
new build hash/URL, so old cached files do not replace the new version. No rendered
HTML, product price, stock, private response or arbitrary URL is made cacheable.
Latest/build metadata, payload JSON, source maps, unknown assets and errors retain
the existing policy. In the actual Nitro build, missing-static 404 responses use
the framework's no-cache error policy, while metadata/private pages keep no-store.
Neither receives the new immutable policy. Fonts and unversioned icons are outside
this change.

The implementation deliberately fails back to the existing no-store policy if a
future Nuxt/Vite build changes its filename format. The small module declaration
describes Nitro's existing virtual manifest export; it does not create a second
asset list or perform runtime filesystem scans. Both typecheck and production
bundling resolve it with the installed Nuxt 4.2.2 / Nitro 2.12.9.

Validation: 41 focused cache/guard/SEO tests, scoped ESLint, Nuxt typecheck and
production build passed. Fifteen actual built-server HTTP checks passed using an
isolated localhost mock backend: real CSS/JS bytes, HEAD/304, mutable metadata,
missing files, closed catalog/private API, synthetic preview, public-open private
API and backend outage. No production switch, DB or provider was used.

After frontend deployment, check an actual CSS and JS URL for 200 + immutable and
their ETag requests for 304. Check that holding/preview/private API responses still
return private/no-store and that a new deploy uses its new hashed URLs. No CDN-wide
purge or "cache everything" rule is needed.

## Production verification, 2026-11-16

18 live anonymous HTTP checks passed: actual CSS and two deployed JS files,
correct MIME/immutable, CDN MISS to HIT, HEAD and ETag304. Cookie-free holding,
preview/private API and mutable latest.json remain no-store; public_open=false.
Chrome preview homepage reload shows CSS disk-cache hits; catalog and product
FD-04-0446 render. No application JS/hydration error appeared on these pages.
Browser findings remain: Meta fbevents.js ERR_BLOCKED_BY_CLIENT and one Chrome
autofill improvement for a field without id/name. Neither was changed. This is
a targeted cache/navigation check, not a payment/login/full-device acceptance test.
