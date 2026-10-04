# FlexDrive — გახსნამდე დარჩენილი სამუშაოების აუდიტი

თარიღი: 2026-10-04, Asia/Tbilisi.

შემოწმებული კოდი: frontend `b1e4c23`, backend `92274bf`. ორივე სამუშაო ხე აუდიტის დაწყებისას სუფთა იყო. მომხმარებელმა ამ სესიაში დაადასტურა, რომ საიტი ჯერ ჰოსტინგის დროებით დომენზე მუშაობს.

2026-10-05 დამატება: მომხმარებლის მოთხოვნით DigitalOcean-ის production frontend/backend პარამეტრები და კონტეინერებში მხოლოდ წაკითხვის შემოწმებები შესრულდა API URL-ისა და ASGI DB რეჟიმისთვის. Frontend-ის built `apiBaseUrl` სწორ production backend-ს მიუთითებს და runtime override არ არის; მიმდინარე URL ხარვეზი არ დადასტურდა. Backend-ის რეალური `CONN_MAX_AGE=60` დადასტურდა PostgreSQL-ზე. კონფიგურაცია, ბაზის მონაცემები და deployment არ შეცვლილა; დატვირთვის ტესტი არ შესრულებულა.

## შეფასება და შემოწმების საზღვრები

ძირითადი მაღაზიის ფუნქციები და დიზაინის დიდი ნაწილი უკვე არსებობს. საჯარო გაყიდვების დაწყების მზადყოფნა ჯერ დადასტურებული არ არის: საჭიროა უსაფრთხოების განახლებები, ტესტების აღდგენა, დახურული დომენის cutover, გადახდისა და ავტომატიზაციის რეალურ გარემოში შემოწმება, აღდგენის გეგმა და ოპერაციული პროცესების შეთანხმება.

ეს არის ორივე რეპოზიტორიის კოდის, კონფიგურაციის, მიგრაციების, ტესტებისა და პროექტის ჩანაწერების აუდიტი. არ ჩატარებულა live hosting-ის კონსოლის, მიმდინარე production DB-ის, DNS-ის, ბანკის/კურიერის ანგარიშების ან რეალური მომხმარებლის ქცევის შემოწმება. არ გაშვებულა dev server ან Playwright, პროექტის მოთხოვნის შესაბამისად. production/staging მონაცემები, secrets და ბიზნესლოგიკა არ შეცვლილა.

კოდში არსებული დაცვა ვერ ადასტურებს იმავე ვერსიის deployment-ს ან სწორ live env-ს. ქვემოთ „ჩანაწერით დასრულებული“ ნიშნავს AGENTS.md-ის უახლეს ცნობას და არა ამ სესიაში ხელახლა ჩატარებულ remote შემოწმებას. განსაკუთრებით ძველი frontend launch roadmap და backend `PRODUCTION_HANDOFF_KA.md` არ უნდა იქცეს განმეორებითი provisioning/import-ის საფუძვლად.

## რაც უკვე გვაქვს

| მიმართულება | არსებული საფუძველი | რაც დასადასტურებელია |
| --- | --- | --- |
| დიზაინი | ახალი tokens, light/dark, homepage, catalog/filter, product detail, auth, cart/wishlist/checkout/profile და CMS გვერდები | საბოლოო browser QA, მობილური overflow, focus, ფიქსირებული ზოლები და consent banner-ის თანაარსებობა |
| ავტორიზაცია | HttpOnly JWT cookies, refresh/rotation, token version, reCAPTCHA, CSRF, Google/Facebook redirect კოდი, ელფოსტის ცვლილების დადასტურება | საბოლოო დომენის provider settings და deployed flows |
| Commerce | guest/account cart/wishlist, buy-now, ფასი/მარაგის ხელახალი შემოწმება, idempotency, order lookup და account orders | კონკურენტული შეკვეთები PostgreSQL-ზე და რეალური end-to-end flow |
| BOG | redirect checkout, signed callback, verified status finalizer, refund/admin, stock reservations და reconciliation | კონტროლირებული ბანკის ციკლი, scheduler-ის რეალური არსებობა/გაშვება და alerts |
| კურიერი | delivery quote, ქალაქები, shipment/admin, tracking და sync reports | pickup→delivery რეალური ციკლი, შეფუთვის მონაცემები და launch cadence |
| Supplier | Draft ახალი პროდუქტებისთვის, missing-product archive guard, lock, sync report, დროებითი გაყიდული მარაგის holds | live overlap/concurrency, ვადის პოლიტიკა, missing/return ქცევა და launch cadence |
| კომპანია/SKU/ფასი | public company SKU, private supplier SKU, ახალი URLs, ინდივიდუალური ფასნამატი | deployed UI/receipt/bank/analytics parity; არსებული კოდები ხელახლა არ უნდა გადავწეროთ |
| ბუღალტერია | confirmed payment/refund ledger, 18% მოდელი, XLSX, ცალკე accountant permission | production UI/XLSX, ცალკე production accountant წვდომა და ბიზნესდოკუმენტების პროცესი |
| SEO/analytics | robots/sitemap, private-page noindex, canonical, Organization/Product/Breadcrumb/Article helpers, GTM/GA4/Meta და consent | საბოლოო დომენი, events/deduplication, consent revocation და კერძო URL-ების გაწმენდა |

Backend AGENTS.md-ის უახლესი ჩანაწერებით production-ში SKU mapping/შესაბამისი მიგრაციები, ფასების მიგრაციები და 2026-10-04-ის accounting `commerce.0033–0034` უკვე შესრულებულია. Cross Motors scheduled sync-ის წარმატებული production გაშვებაც დადასტურებული იყო. ეს სამუშაოები თავიდან გასაკეთებლად არ ჩაითვალოს. Production accountant account ამ ჩანაწერით ჯერ არ შექმნილა.

## შესრულებული შემოწმებები

| შემოწმება | შედეგი |
| --- | --- |
| `npm run build` | წარმატებული; Windows sandbox-ის `readlink` შეზღუდვის შემდეგ დაშვებული გაშვებით დასრულდა. არსებული Vue export deprecation warning დარჩა. |
| `npm run typecheck` | წარმატებული |
| `npm run lint` | წარმატებული |
| `node --test tests/checkoutDraft.test.mjs` | 3/3 წარმატებული |
| Backend admin pricing JavaScript tests | 8/8 წარმატებული |
| Backend მიზნობრივი 22 მოდული | 318 tests: 317 წარმატებული, 1 skipped; შეცდომა/ჩავარდნა 0 |
| Backend სრული suite, იზოლირებული განმეორებითი გაშვება | 787 discovered; runner: 710 ran, 6 failures, 234 errors, 10 skipped. ორი class setup error ნაწილის გაშვებას ბლოკავს; suite მწვანე არ არის. |
| `makemigrations --check --dry-run` | `No changes detected` |
| Backend `pip check` | `No broken requirements found` — მხოლოდ dependency თავსებადობის შემოწმებაა, vulnerability scan არაა |
| Django `check --deploy` სინთეზური production პარამეტრებით | CKEditor და HSTS warnings; live გარემოს პარამეტრები ამით არ შემოწმებულა |
| `npm audit --json` | 49 dependency ჩანაწერი: 5 critical, 27 high, 12 moderate, 5 low |
| `npm audit --omit=dev --json` | 43 dependency ჩანაწერი: 5 critical, 22 high, 11 moderate, 5 low |

Backend-ის ტესტებს ჰქონდათ მხოლოდ in-memory SQLite, დროებითი media და გარე socket კავშირების აკრძალვა. მეორე სრული გაშვება და მიზნობრივი suite იყენებდა დროებით სამუშაო დირექტორიასა და მხოლოდ ტესტისთვის სწრაფ password hasher-ს. პირველ გაშვებაში media paths-ის sandbox-ის 6 PermissionError მეორე გაშვებაში მოიხსნა; ეს ექვსი აპლიკაციის ხარვეზად არ ჩაითვალა. ბიზნესბაზას არცერთმა გაშვებამ არ მიმართა.

მიზნობრივი suite მოიცავდა: deployment configuration, BOG payment client/refunds/reconciliation, EasyWay client/locations/shipments/tracking/reports, receipts, accounting foundation/reports/admin/access/export, internal SKUs/allocation, admin pricing, supplier sync/reports და product image transfer. იგი **არ ნიშნავს** full card-start/callback/browser flow-ის დასრულებულ შემოწმებას. PostgreSQL კონკურენტულობის ტესტი SQLite-ზე გამოტოვდა.

დეტალური ლოკალური logs: frontend `.cache/production-audit/` (Git-ში არ შედის). გამოყენებული გარემო: Node 22.14.0, Nuxt 4.2.2, Vue 3.5.26; backend Python 3.13.5, Django 6.0.8.

## პირველ რიგში დასახური საკითხები

P0 აქ ნიშნავს „საჯარო გაყიდვებამდე დასახურ შემოწმებას/სამუშაოს“ და არ გულისხმობს, რომ ყველა პუნქტი დადასტურებული exploit-ია. P1 არის გახსნამდე მნიშვნელოვანი გამართვა; P2 შეიძლება შეზღუდული launch-ის შემდეგ.

### P0-1 — dependency უსაფრთხოების განახლება

დადასტურებული ფაქტი: lockfile/დაყენებული Nuxt არის 4.2.2; npm-ის მიმდინარე audit აფიქსირებს პრობლემებს Nuxt/Nitro/h3/devalue/DOMPurify-სა და სხვა ტრანზიტიულ პაკეტებში. `--omit=dev` შედეგიც ნულოვანი არ არის. Critical ჩანაწერებია `@nuxt/devtools`, `seroval`, `shell-quote`, `simple-git`, `tar`.

ეს რაოდენობები affected package ჩანაწერებია, არა დამოუკიდებელი exploitable ხარვეზების რაოდენობა. Nuxt-ის devtools production-ში კოდით გამორთულია; `--omit=dev` მაინც ვერ გვეუბნება, რომ თითოეული ჩანაწერი built server-ში გამოიყენება. საჭიროა advisory→კონკრეტული გამოყენება→built artifact შეფასება.

გასაკეთებელია: თავსებადი Nuxt/ტრანზიტიული პაკეტების და sanitizer-ის განახლება, lockfile-ის რეგენერაცია, ყველა მიმდინარე შემოწმებისა და შესაბამისი browser flow-ის გამეორება. `npm audit fix --force` ბრმად არ გამოვიყენოთ: audit-ის ზოგი შეთავაზება Tailwind module-ის ძველ ვერსიაზე გადასვლასაც სთავაზობს.

მტკიცებულება: `package.json`, `package-lock.json`, `.cache/production-audit/frontend-audit-approved.json`, `frontend-audit-runtime.json`. Nuxt-ის ოფიციალურ advisory-ში ერთ-ერთი საკითხი მხოლოდ `routeRules.appMiddleware` გამოყენებას ეხება; პროექტში მისი exploitability არ დამიდასტურებია: [Nuxt advisory](https://github.com/nuxt/nuxt/security/advisories/GHSA-mm7m-92g8-7m47). Server stack-ის მაგალითი: [h3 advisory](https://github.com/h3js/h3/security/advisories/GHSA-wr4h-v87w-p3r7).

Backend-ს ცალკე Python vulnerability scan სჭირდება; `pip check` ამას არ ანაცვლებს.

### P0-2 — ძველი CKEditor-ის შეცვლა ან მხარდაჭერილ ვერსიაზე გადასვლა

Django-ის system check პირდაპირ აფრთხილებს, რომ `django-ckeditor==6.7.3`-ში ჩაშენებული CKEditor 4.22.1 აღარ მხარდაჭერილია და ცნობილი უსაფრთხოების საკითხები აქვს. ეს admin/CMS editing-ის მიმართულებაა. დაგეგმილია მხარდაჭერილი editor-ის არჩევა და არსებული HTML content-ისა და admin ფორმების შენარჩუნებით გადასვლა; მხოლოდ warning-ის ჩახშობა გამოსავალი არაა.

მტკიცებულება: backend `requirements.txt`, `config/settings.py` (`ckeditor`), `pages/models.py` და system-check log. [CKEditor-ის ოფიციალური განმარტება](https://ckeditor.com/blog/ckeditor-4-end-of-life/).

### P0-3 — backend-ის სრული რეგრესიის suite-ის აღდგენა

განმეორებითი იზოლირებული გაშვების 234 errors იყოფა ასე:

- 232: `catalog_published_requires_sku` — ძველი fixtures Published პროდუქტებს კომპანიის SKU-ის გარეშე ქმნის; DB დაცვა სწორად უარყოფს მათ.
- 2: serialized test DB-ის აღდგენისას `django_content_type` uniqueness; ზიანდება BOG callback და card flow test class-ების setup.

ექვსი assertion failure: supplier bulk import-ში 250 vs 275 ფასი; ორი email sender-ის განახლებული სახელის მოლოდინი; payment/delivery CMS ტექსტების ძველი მოლოდინები; privacy listcount 5 vs 6. Supplier test-ის მოლოდინი გადასამოწმებელია ახალ ინდივიდუალურ pricing პოლიტიკასთან. ყველა failure-ის „უბრალოდ მოძველებულ ტესტად“ გამოცხადება არ შეიძლება შემოწმების გარეშე.

გასაკეთებელია: SKU-იანი სწორი fixtures, serialized test isolation-ის გამართვა, ახალი ბიზნესპოლიტიკის შესაბამისი assertions და ხელახლა სრული suite. Published SKU დაცვის მოხსნა ტესტების გასამწვანებლად დაუშვებელია. შემდეგ disposable PostgreSQL test DB-ზე locking/concurrency checks.

დასრულება: სრული suite მუშაობს, არც კრიტიკული flow იხსნება გაუშვებელი setup-ით და არც მოლოდინი იცვლება მხოლოდ ტესტის დასაკმაყოფილებლად.

### P0-4 — `flexdrive.ge`-ზე დახურული გადასვლა

მომხმარებლის მიმდინარე პასუხით ჯერ დროებით დომენზე ვართ. Backend AGENTS.md-ის ბოლო გადაწყვეტილებაა: საბოლოო დომენი თავიდან მხოლოდ დაშვებულ ტესტერებს უნდა გაეხსნათ.

გასაკეთებელია: არსებული DNS/MX/TXT-ის ინვენტარი და კომპანიის ელფოსტის შენარჩუნება; storefront/backend/admin-ის დახურული წვდომა; direct hosting URL-ით გვერდის ავლის შემოწმება; Nuxt SSR/API proxy-ის ავტორიზებული server-to-server გზა; მხოლოდ საჭირო provider callback გამონაკლისები. `noindex` წვდომის დაცვას ვერ შეცვლის. რეპოზიტორიებში Access token-ის origin validation არ ჩანს; hosting-level ალტერნატივის არსებობა ამ სესიაში არ შემოწმებულა.

ერთად განახლდეს: frontend site/API configuration; backend hosts/origins, `FRONTEND_BASE_URL`, CSRF/CORS/reCAPTCHA hostname; Google/Facebook callback და provider console; BOG return/callback URLs; activation/reset/email-confirmation links; receipt website/source URLs და analytics domain settings. Redirects წარმატებით უნდა ინარჩუნებდეს cookies-სა და CSRF-ს.

დასრულება: დახურულ საბოლოო დომენზე ყველა ძირითადი flow მუშაობს, provider callback მუშაობს ადამიანის login-ის გარეშე და დროებითი origin დაცვას არ გვერდს უვლის.

### P0-5 — ბანკის სრული კონტროლირებული ციკლი და დაკარგული callback-ის აღდგენა

კოდში უკვე არსებობს signed callback, provider status verification, ერთი order/stock ცვლილების დაცვა, refund და reconciliation. მათი თავიდან დაწერა საჭირო არაა.

გასაკეთებელია უსაფრთხო კონტროლირებული გეგმით: guest/account და cart/buy-now success; fail/cancel; timeout/retry; duplicate და late callback; browser return callback-მდე; browser-ის დახურვა; დაკარგული callback; pending/paid-without-order/manual-review სცენარი; refund-ის საბოლოო დადასტურება. რეალურ ბანკს მხოლოდ შეთანხმებული ტესტი უნდა მიმართავდეს.

Scheduler-ის სტატუსი უცნობია: 2026-09-28-ის ჩანაწერში backend app-ში BOG job არ ჩანდა; გარე scheduler არ შემოწმებულა და მომხმარებელს მისი ჩართვა ახსოვდა. ამიტომ ჯერ inventory/last run/target DB/env უნდა შემოწმდეს, შემდეგ გადაწყდეს ჩართვა. ახალი duplicate scheduler წინასწარ არ შეიქმნას. დომენის cutover-ზე გადადების გადაწყვეტილება ძალაშია.

დასრულება: missing callback-ის შემთხვევაშიც თანხას აქვს დადასტურებული საბოლოო მდგომარეობა, პრობლემა ოპერატორთან მიდის, order/stock/refund არ დუბლირდება. რეალურ PostgreSQL-ზე overlapping callback/reconciliation/checkout შემოწმებულია.

### P0-6 — ავტომატური jobs-ის რეალური მუშაობა და alerts

უკვე არსებული Cross Motors sync თავიდან არ შეიქმნას. სექტემბრის ბოლოს ჩანაწერში `crossmotors-sync` და `easyway-tracking` არსებობდა. მათი ყოველდღიური trigger იყო Asia/Tbilisi, ხოლო wrapper-ები UTC თარიღებს ითვლიდა; გეგმაში UTC იყო მითითებული. EasyWay-ის წარმატებული skip თავისთავად provider/DB sync-ის წარმატებას არ ამტკიცებს.

გასაკეთებელია live job config/logs/env-ის გადამოწმება, timezone-ის შეთანხმება, რეალური due-run-ის დადასტურება, failure/nonexecution alerts და ოპერატორის პასუხის პროცესი. შეკვეთების არქონისას EasyWay report-ის არქონა ნორმალურია. ცვლილების/შეცდომის report და უბრალოდ skipped/empty run გაიმიჯნოს.

საჯარო გახსნისთვის არსებული გეგმებია Cross Motors ყოველ 2 საათში, EasyWay tracking ყოველ 15 წუთში; cadence შეიცვალოს load/run duration/provider პირობების გადამოწმებით. ცალკე დასადასტურებელია `run_daily_cleanup`-ის ყოველდღიური გაშვება expired carts/JWT/reservations-ისთვის.

`process_outbound_tasks` worker ახალი სავალდებულო hosting კომპონენტი არ არის: მიმდინარე payment hook Meta Purchase-ს პირდაპირ `on_commit`-ზე აგზავნის. რეალური enqueue call ამ გზაზე არ ჩანს და environment documentation-იც პირდაპირ გზას აღწერს.

### P0-7 — backup/restore და release rollback

ამ სესიაში არ დადასტურებულა live backup policy ან აღდგენის ცდა. გასაკეთებელია DB backup/PITR/retention და იზოლირებულ ბაზაზე რეალური restore drill; media recovery ცალკე; პასუხისმგებელი ოპერატორი და ინსტრუქცია; known-good frontend/backend commit და migration compatibility.

`build.sh` ახლაც უშვებს `collectstatic`-ს და `migrate`-ს, ასევე background-removal model preload-ს. Migration-ის ერთ release/pre-deploy ეტაპად გამოყოფა და job build-ებთან პარალელური migration-ის თავიდან აცილება გადასამოწმებელია actual hosting command-ებში. რეპოზიტორიის `render.yaml` staging ისტორიაა და მიმდინარე DigitalOcean production-ის ზუსტ კონფიგურაციას ვერ ადასტურებს.

Production მონაცემების რედაქტირების დაწყების შემდეგ staging-ის სრული restore აღარ გამოიყენება. უკვე არსებული SKU/ფასი/ფოტო/order არ გადაიწეროს. კოდის rollback არ ნიშნავს ბაზის ძველ snapshot-ზე დაბრუნებას და ახალი შეკვეთების დაკარგვა არ არის მისაღები ჩვეულებრივი rollback.

## გახსნამდე მნიშვნელოვანი გამართვა

### P1-1 — Nuxt build/runtime გარემო: გადამოწმებულია, მიმდინარე URL პრობლემა არ არის

`nuxt.config.ts` backend URL-ის default-ს იღებს `NUXT_INTERNAL_API_URL`-დან, მაგრამ runtime key არის `apiBaseUrl`, რომლის სახელზე დაფუძნებული runtime override არის `NUXT_API_BASE_URL`. არსებული `.env.example` პირველ სახელს აღწერს. Build-ზე მიწოდებული მნიშვნელობა მუშაობს; მხოლოდ runtime-ზე `NUXT_INTERNAL_API_URL`-ის შეცვლა built app-ის target-ს ვერ ცვლის Nuxt-ის სტანდარტული წესით. ეს კონკრეტული production outage ამ აუდიტში არ დადასტურებულა.

2026-10-05 live შემოწმება: `NUXT_INTERNAL_API_URL` component scope არის **Run and build time** და მიუთითებს production backend-ის `/api` მისამართზე. App-level env არ არის. Frontend კონტეინერში built server-ის კონფიგურაციიდან ამოღებული `apiBaseUrl` იმავე production backend-ს მიუთითებს; `NUXT_API_BASE_URL` runtime override არ არის. Build command არის `npm run build`, run command — `node .output/server/index.mjs`. ამ deployment-ში სახელების განსხვავება მოქმედ ხარვეზს არ ქმნის და გახსნის ბლოკერად არ ითვლება. სახელების გაერთიანება მომავალი კონფიგურაციის გამარტივებაა; მხოლოდ runtime-ზე backend URL-ის შეცვლის შემთხვევაში matching override ან rebuild საჭიროა.

Context7-ით შემოწმებული მიზეზი: [Nuxt runtimeConfig](https://nuxt.com/docs/4.x/guide/going-further/runtime-config) matching `NUXT_` names-ს მოითხოვს; სხვანაირად დასახელებული env default მხოლოდ build-time წყაროა. `.env` built production server-ზე ავტომატურად არ იკითხება.

### P1-2 — ASGI ბაზის კავშირები და წარმადობა

Backend `start.sh` Uvicorn/ASGI-ს იყენებს; PostgreSQL settings-ში `DATABASE_CONN_MAX_AGE` default 60-ია. [Django-ის ოფიციალური დოკუმენტაცია](https://docs.djangoproject.com/en/6.0/ref/databases/#persistent-connections) ASGI-ისას persistent connections-ის გამორთვას ურჩევს. 2026-10-05 DigitalOcean-ზე run command `bash start.sh` დადასტურდა; `DATABASE_CONN_MAX_AGE` არც app-level და არც web-service env-ში არ არის. Backend კონტეინერში Django settings-ის მხოლოდ წაკითხვის შემოწმებამ დააბრუნა `CONN_MAX_AGE=60` და PostgreSQL engine. Deployment source hash ემთხვევა შემოწმებულ backend კოდს (`92274bf`).

რეკომენდებული შესწორება: web-service runtime env-ში `DATABASE_CONN_MAX_AGE=0`, შემდეგ შესაბამისი deployment და მნიშვნელობის გადამოწმება. ეს დადასტურებული კონფიგურაციის შეუსაბამობაა Django-ის რეკომენდაციასთან; ამ შემოწმებით connection exhaustion, გაჟონვა, შენელება ან outage არ დადასტურებულა. Pooler/DB connection limit და bounded load test catalog/search/SSR-ზე ცალკე წარმადობის შემოწმებაა. Load test-ში ბანკის/კურიერის მოქმედებები არ შედის.

2026-10-05 მომხმარებელმა დაადასტურა `DATABASE_CONN_MAX_AGE=0`-ის დაყენება. ცვლილების შემდეგ live მნიშვნელობა ამ ეტაპზე ხელახლა არ შემოწმებულა.

### P1-3 — consent-ის theme persistence და tracking revocation

ანალიტიკა+რეკლამა განზრახ ერთი tracking არჩევანია; ეს დეფექტად არ ითვლება.

დადასტურებული შეუსაბამობა: `app/plugins/theme.client.ts`-ის immediate watcher და `app/composables/useTheme.ts` cookie/localStorage-ს წერენ `preferencesConsentGranted` შემოწმების გარეშე. 2026-10-05 მომხმარებელმა ამ მცირე საკითხზე მიმდინარე theme persistence-ის უცვლელად დატოვება გადაწყვიტა; გასაკეთებელ ცვლილებად აღარ ჩაითვალოს. Recent search-ის შენახვაში functionality consent-ის guard უკვე არსებობს.

Live QA: fresh visit/deny/accept/revoke/reload, preferences/functionality/tracking; GA4/Meta GTM triggers consent-ს უნდა ემორჩილებოდეს. GTM script უკვე ჩატვირთვის შემდეგ უკან არ იტვირთება; Consent Mode update მარტო Meta Pixel-ის გამორთვას ვერ ამტკიცებს. სჭირდება network/event შემოწმება და optional storage cleanup-ის მოთხოვნის დაზუსტება.

### P1-4 — კერძო token-იანი URLs ანალიტიკაში

2026-10-05 მომხმარებლის მოთხოვნით Backend `commerce/meta_conversions.py::_build_order_success_url` შეიცვალა: Meta CAPI `event_source_url` ახლა მხოლოდ `/checkout/success`-ს შეიცავს, order public token-ის გარეშე. Runtime ცვლილება მხოლოდ URL-ის ერთ ხაზს ეხება; order/payment flow, event ID, თანხა, company SKU და consent logic უცვლელია. ხუთი შესაბამისი SKU/receipt/Meta regression ტესტი გაიარა იზოლირებულ in-memory SQLite-ზე, გარე ქსელის გათიშვით და Meta HTTP call-ის mock-ით. ბექის deployment ჯერ საჭიროა; live Meta delivery ამ ტესტით არ მოწმდება. დამატებით უნდა შემოწმდეს GTM/GA4/Meta browser page URLs `/checkout/payment/*?payment_token=...`, reset/activation/email-confirmation routes-ზე; ეს ნაწილი არ შეცვლილა.

გასაკეთებელია analytics URL sanitization: მესამე მხარეს არ გავატანოთ activation/reset/payment/order/receipt access tokens; purchase `transaction_id`/`event_id` შეინარჩუნოს deduplication, პირადი access URL-ის გარეშე. Page noindex token leakage-ის ამ გზას არ კეტავს. Actual browser payload ამ სესიაში არ შემოწმებულა; token-ის გამო ყველა endpoint-ზე PII წვდომა არ მტკიცდება — public order summary კლიენტის საკონტაქტო მონაცემებს არ აბრუნებს.

### P1-5 — production security და დაკვირვება

ბექის კოდში არის deployed-env validation, API CSRF middleware, private API no-store, Redis throttling, secure cookies და password/token protection. დანაკლისი არის live კონფიგურაციის დადასტურება და დამატებითი ოპერაციული დაცვა.

დასადასტურებელია `APP_ENV=production`, DEBUG/hosts/origins/cookies/TLS; სწორი client IP/trusted proxies (`DRF_NUM_PROXIES`); რეალური 429 განაწილება სხვადასხვა მომხმარებელზე; frontend SSR/personal routes-ის cache policy; admin-ის MFA/access/recovery; მინიმალური staff permissions; production accountant-ის დამოუკიდებელი ანგარიში საჭიროებისას.

HSTS კოდის default 0-ია და სინთეზურმა deploy check-მა warning გამოიტანა. Live headers ცალკე შემოწმდეს; საბოლოო HTTPS დომენის გამართვის შემდეგ დაიგეგმოს შესაბამისი HSTS. CSP/referrer/security headers და error monitoring რეპოზიტორიაში სრულად არ ჩანს; შეიძლება hosting დონეზე არსებობდეს. No-store და noindex სხვადასხვა ამოცანას ასრულებს.

დასასრულებელია uptime/error/job/payment alerts-ის რეალური მიღება, health/readiness გზა და manual recovery runbook. მხოლოდ deployment failure alert ბიზნესოპერაციების პრობლემებს ვერ ფარავს.

### P1-6 — რეალური კატალოგისა და მიწოდების მონაცემების აუდიტი

ახლანდელი მარაგის და სურათების რაოდენობები production DB-ის გარეშე არ დამიდგენია; ივნისის image coverage-ის ისტორიული რიცხვები მიმდინარე მონაცემებად არ გამოვიყენოთ.

საჭიროა read-only production inventory: Published პროდუქტი company SKU-ის გარეშე; price/cost/markup/rounding; zero-price; category/brand/side/fitment/year accuracy; missing/incorrect images და alt text; duplicates; delivery weight/dimensions/defaults; test/demo products და orders. გასაწმენდი მონაცემები ჯერ ზუსტად იდენტიფიცირდეს; ბრმად seed/reset/delete არა.

ნულოვანი ფასი მიმდინარე კოდში უფასო შეძენას არ ნიშნავს: `Product.price_available/purchasable` და commerce availability guard უკვე ბლოკავს მას; card UI აჩვენებს „ფასი დასაზუსტებელია“. დარჩენილი ბიზნესგადაწყვეტილებაა ასეთი პროდუქტების საჯარო ხილვადობა და მათი დამუშავება.

Stock holds უკვე არსებობს. დასაზუსტებელია supplier-ის რეალური განახლების დაგვიანებასთან 24-საათიანი hold-ის პოლიტიკა და მუდმივი reserve quantity 5-ის სისწორე. თუ supplier-ის მონაცემი დაცულ ვადაზე დიდხანს აგვიანებს, დამოუკიდებელი ადგილობრივი დაცვა საბოლოო ხელმისაწვდომობის გარანტია ვერ იქნება.

Shipping quote-ისა და final total-ის პარიტეტი უნდა შემოწმდეს განსხვავებული ზომის ნაწილებზე, ქალაქებზე, cart/buy-now და physical/legal buyers-ზე. ასევე expired quote, quantity/price change და provider unavailable states.

Cloudinary shared mode მიმდინარე storage-ში უკვე იცავს overwrite/delete-ს. ძველი handoff-ის „ეს ჯერ კოდში გასაკეთებელია“ მოძველებულია. საჭიროა deployed `CLOUDINARY_SHARED_MEDIA` და cross-environment upload/delete isolation-ის შემოწმება, media backup და retention/orphan-cleanup პოლიტიკა; staging-ის ფაილების ბრმა წაშლა დაუშვებელია.

### P1-7 — SEO/analytics საბოლოო დომენზე

SEO საფუძვლის თავიდან დაწერა საჭირო არაა: structured data helpers, sitemap, robots და private-page noindex არსებობს. გახსნამდე შემოწმდეს final canonical/OG/sitemap URLs, FD SKU URLs, query/filter/pagination policy, redirects/404, public CMS noindex flags და რეალური social preview.

დახურულ cutover-ზე indexing დარჩეს გამორთული. საჯარო გახსნისას შეიცვალოს public indexing, ხოლო profile/checkout/payment/token pages დარჩეს noindex. Search Console/domain ownership და sitemap submission ჩაიწეროს launch ოპერაციებად.

GTM/GA4 production container/stream უკვე არჩეული და ნაწილობრივ deployed იყო; ახალი property-ის შექმნა მიმდინარე გეგმის მოთხოვნა არ არის. საჭიროა final-domain events: page view/search/view item/cart/checkout/paid purchase; თანხა/GEL/company SKU; purchase browser-server ერთჯერადი დათვლა; consent matrix. Script loading ამ შედეგებს არ ადასტურებს. ფულის დაბრუნების analytics საჭიროება ცალკე გადაწყდეს.

### P1-8 — ოპერაციული და საბუღალტრო პროცესი

PDF payment receipt და accounting XLSX არსებობს, მაგრამ ისინი ყველა ბიზნესდოკუმენტის პროცესს ავტომატურად არ აგვარებს. ბუღალტერთან უნდა შეთანხმდეს გამოყენებული დოკუმენტები/RS.ge ზედნადები ან სხვა საჭირო workflow, გაყიდვისა და დაბრუნების აღრიცხვა და ისტორიული purchase-cost მონაცემების წესი. ამ აუდიტით კონკრეტული სამართლებრივი ვალდებულება არ დადგენილა.

2026-10-04-ის ჩანაწერით accounting schema production-ში უკვე მზადაა; დარჩენილია deployed UI/XLSX და least-privilege accountant login/access test. Demo მონაცემები production-ში საჭირო არ არის. Fixed 18% მოდელი მომხმარებლის არსებული გადაწყვეტილებაა; cost/net margin არ უნდა წარმოვაჩინოთ კომპანიის საბოლოო მოგებად ან supplier-ისთვის თანხის გადახდის მტკიცებულებად.

უნდა არსებობდეს პასუხისმგებლობები: ახალი order ვინ ნახოს; supplier availability ვინ დაადასტუროს; packaging/dispatch/courier ვინ გააკეთოს; paid-without-order/refund pending ვინ მოაგვაროს; contact complaint და დაბრუნების მოთხოვნა ვინ მიიღოს. Internal delivery-ის სტატუსიც ოპერატორულად უნდა მუშაობდეს.

Contact/receipt env-ის ხელახალი დამატება დასრულებულ სამუშაოდ არ შემოგთავაზოთ: სექტემბრის ბოლოს მომხმარებელმა მათი დამატება დაადასტურა. ახლა საჭიროა წერილის/ქვითრის შედეგის ტესტი, final-domain links, mailbox delivery და sender domain-ის მდგომარეობა.

## საბოლოო QA მიღების მატრიცა

Browser ეტაპი საჭიროა ცალკე ავტორიზებული დავალებით. მინიმუმ 375px და 1440px, ასევე 320–360px header/checkout და ერთი tablet; light/dark, კლავიატურა და რეალური მობილური browser.

| ჯგუფი | დასადასტურებელი სცენარები |
| --- | --- |
| Auth/account | register/activation/resend/login/logout/refresh/reset; Google/Facebook; profile email change; own vs other user's orders; account deletion |
| Catalog | Georgian/Latin/name/OEM/company SKU search; suggestions; vehicle filters and reset; pagination/back navigation; unavailable/no-price/missing-image products; empty/error/loading |
| Cart/wishlist | guest→login state, quantity/remove, parallel tabs, changed price/stock, stale cart, wishlist links and return navigation |
| Checkout | guest/account, physical/legal entity and VAT answer, cart/buy-now, field validation, quote expiry, double click/retry, form draft isolation/refresh |
| Payment | success/fail/cancel/pending, browser return timing, missing/duplicate/late callback, final receipt, refund; ერთი order/charge/stock ცვლილება |
| Fulfilment/admin | paid-only shipment, courier lifecycle, internal delivery, supplier sync during orders, protected cancel/refund, own staff permissions |
| Privacy/analytics | default denied, accept/revoke/reload, optional storage, cleaned page URLs, accurate paid purchase and deduplication |
| Public content | Georgian contact/legal/delivery/returns/payment copy, final contacts, 404, CMS/social/SEO metadata |
| Operations | backup restore, failed/nonexecuting job alert, DB/cache/provider unavailable, bounded load, release rollback |

რეალური გადახდა/კურიერი/წერილები უნდა შემოწმდეს შეთანხმებული test path-ით. ამ აუდიტში ეს მოქმედებები არ შესრულებულა.

## მუშაობის რეკომენდებული რიგი

1. **კოდის მზადყოფნა:** dependency advisories და CKEditor; backend fixtures/isolation; Meta URL შესწორების deployment და browser analytics token URLs-ის შემოწმება. Theme persistence მომხმარებლის გადაწყვეტილებით უცვლელი რჩება; ASGI DB პარამეტრი მომხმარებელმა 0-ზე დააყენა; Nuxt API URL production-ზე გადამოწმებულია და მიმდინარე გასასწორებელი პრობლემა არ არის.
2. **დახურული საბოლოო დომენი:** DNS/mail შენარჩუნება, access/origin დაცვა, გარემოს და provider consoles-ის coordinated cutover.
3. **გაყიდვის დადასტურება:** სრული browser/regression QA, კონტროლირებული BOG/refund/receipt და PostgreSQL concurrency, courier/supplier flows.
4. **მუდმივი მუშაობა:** scheduler inventory/activation/cadence, alerts და cleanup, backup/restore/rollback, staff/accountant და დოკუმენტების პროცესი.
5. **გახსნის დღე:** კატალოგის საბოლოო inventory, legal/contact/SEO/analytics sign-off, storefront restriction-ის შეთანხმებული მოხსნა, public indexing და jobs cadence, პირველი შეკვეთების დაკვირვება.

ახალი product comparison, saved garage/VIN ავტომატიზაცია, გაფართოებული marketing events, coupons/loyalty და dashboard polish P2 მიმართულებებია. მათი არქონა არსებული scope-ის ავტომატური launch blocker არ არის. მთავარი storefront redesign თავიდან გასაკეთებელი აღარ არის.

## გახსნის გადაწყვეტილების კრიტერიუმი

საჯარო გაყიდვები დაიწყოს მას შემდეგ, რაც მაღალი რისკის dependency საკითხები მოგვარებულია ან კონკრეტულად შეფასებული, სრული კრიტიკული regression მუშაობს, საბოლოო დომენზე დაცვა/ინტეგრაციები დადასტურებულია, თანხა→order→stock→delivery→refund ციკლი შემოწმებულია და backup/alerts/ოპერატორული აღდგენა რეალურად მუშაობს. მხოლოდ successful build ან production schema-ის არსებობა ამ გადაწყვეტილებისთვის საკმარისი მტკიცებულება არ არის.
