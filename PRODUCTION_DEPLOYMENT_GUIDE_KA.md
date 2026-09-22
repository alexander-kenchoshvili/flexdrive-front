# FlexDrive-ის production-ზე გაშვების გზამკვლევი

განახლებულია: 2026-09-20

ეს დოკუმენტი განკუთვნილია ადამიანისთვის, რომელსაც პროექტი ჯერ არასოდეს აუტვირთავს production-ზე. ნაბიჯები დალაგებულია იმ თანმიმდევრობით, რომლითაც რეალურად უნდა შესრულდეს სამუშაო.

## 1. მიმდინარე გადაწყვეტილება და მდგომარეობა

ეს არის სამუშაო გეგმა, არა უკვე შესრულებული deployment-ის ანგარიში. საიტი ჯერ მხოლოდ მფლობელისთვის უნდა იყოს ხელმისაწვდომი; რეალური გაყიდვები მოსალოდნელია დაახლოებით 2–3 კვირაში. ფასიან რესურსებს ვქმნით ეტაპობრივად, როცა იმავე დღეს მათ გამართვასაც ვიწყებთ.

2026-09-20-ის მდგომარეობით:

- DigitalOcean ანგარიში შექმნილია, ბარათი დამატებულია და project `FLEXDRIVE Production` არსებობს.
- PostgreSQL-ის შექმნის ღილაკზე ჯერ არ დაჭერილა. $15.15-იანი ბაზა ისევ გეგმაშია; პირველი ფასიანი ნაბიჯი სწორედ ის იქნება, ქვემოთ მოცემული მომზადების შემდეგ.
- არჩეული მიმართულებაა App Platform-ზე frontend/backend, Managed PostgreSQL, Managed Valkey და მომწოდებლისთვის პატარა Proxy Droplet.
- წინა $25-იანი Dedicated Egress დამატება აღარ არის არჩეული. Proxy Droplet მას მხოლოდ მომწოდებელთან კავშირის ნაწილში ანაცვლებს.
- დომენი და კომპანიის ელფოსტა უკვე გვაქვს; Cloudinary და Brevo რჩება არსებული ინტეგრაციებით, უფასო ლიმიტების გადამოწმებით.
- ამ დოკუმენტის განახლება არ ქმნის ინფრასტრუქტურას, არ ცვლის კოდს/საიდუმლო პარამეტრებს და არ რთავს სინქრონიზაციებს.

გეგმა ორ ეტაპად იყოფა: დახურული production გარემოს მომზადება ახლა და საჯარო გაყიდვების დაწყება აუცილებელი შემოწმებების შემდეგ. დაუმთავრებელი გადახდის მონიტორინგი ხელს არ უშლის დახურულ გარემოს მომზადებას, მაგრამ გასაყიდად გახსნამდე უნდა დასრულდეს.

## 2. შეთანხმებული საწყისი რესურსები

| მომსახურება | ზომა | ფიქსირებული თვიური ფასი |
|---|---|---:|
| App Platform frontend — Nuxt | 1 shared vCPU / 512 MiB | $5 |
| App Platform backend — Django | 1 shared vCPU / 1 GiB, fixed გეგმა | $10 |
| Managed PostgreSQL Standard / Basic Regular | 1 vCPU / 1 GiB / 10 GiB საცავი | $15.15 |
| Managed Valkey | 1 vCPU / 1 GiB | $15 |
| Proxy Droplet — Basic Regular | 1 vCPU / 512 MiB | $4 |
| **ფიქსირებული ჯამი** | | **$49.15** |

ეს ეკონომიური, დახურული გაშვების საწყისი კონფიგურაციაა და არა გაზომვით დადასტურებული სიმძლავრე. მხოლოდ დღიური შეკვეთების რაოდენობა რესურსის საკმარისობას ვერ განსაზღვრავს. ვამოწმებთ ერთდროულ დათვალიერებას, ძებნას, checkout-ს, ადმინში სურათების დამუშავებასა და იმპორტის პარალელურ მუშაობას.

Frontend-ს სჭირდება Node server: მოქმედი SSR, `/api` proxy და OAuth route-ები უფასო static hosting-ზე უცვლელად არ გადავა. Backend-ზე სურათების ფონის მოცილება მეხსიერების პიკურ მოხმარებას ზრდის. Supplier Job დამოუკიდებელი პროცესია: მისთვის საწყისად 2 GiB შეიძლება ავირჩიოთ; ეს ბექის მუდმივ 1 GiB რესურსს არ ზრდის, თუმცა ორივე ერთ ბაზას იყენებს.

თუ frontend-ს 1 GiB დასჭირდება, ჯამი $54.15 გახდება. თუ მხოლოდ backend-ს 2 GiB დასჭირდება — $64.15; თუ ორივეს გავზრდით — $69.15. Job-ების მოხმარება და სხვა ცვლადი ხარჯები ცალკეა (სექცია 28).

## 3. არქიტექტურა — App Platform და პატარა Proxy Droplet

```text
მფლობელი → დახურული წვდომის დაცვა → Nuxt (App Platform)
                                      ↓ /api proxy
                                  Django (App Platform)
                                      ↓ კერძო VPC + TLS
                              PostgreSQL და Valkey

Django / Supplier Job → კერძო VPC → Proxy Droplet → HTTPS → Supplier API
                                    ↑ პასუხიც ამ გზით ბრუნდება
```

საიტი, ბაზა და იმპორტერი Droplet-ზე არ გადავა. Droplet მხოლოდ მომწოდებლის მოთხოვნებსა და პასუხებს გადაატარებს. ფასების/მარაგების გამოთვლა და ბაზაში bulk ჩაწერა App Platform-ის Job-ში მოხდება. ბანკი, კურიერი და სხვა ინტეგრაციები ამ პროქსის გავლით ავტომატურად არ უნდა გავუშვათ.

App Platform მართავს აპის ინფრასტრუქტურის მნიშვნელოვან ნაწილს. პატარა Droplet-ის Linux, უსაფრთხოების განახლებები, firewall, პროქსის კონფიგურაცია, restart და მონიტორინგი ჩვენი პასუხისმგებლობაა. Docker/WSL-ის ადგილობრივად დაყენება ამ სქემის აუცილებელი პირობა არ არის.

ქსელის საწყისი არჩევანია Frankfurt: App Platform `fra`, Droplet/ბაზები შესაბამის `fra1` VPC-ში. შექმნამდე dashboard-ში ვამოწმებთ რეგიონის, $4 ზომისა და ქსელის ხელმისაწვდომობას. იმავე რეგიონის სახელწოდება თავისთავად VPC კავშირს არ ნიშნავს — App უნდა მივაბათ შესაბამის VPC-ს და trusted sources ცალკე გავმართოთ.

### Proxy-ის მომზადების checklist — ჯერ შესასრულებელია

- Basic Regular 512 MiB Droplet; მხოლოდ მსუბუქი proxy, არა Django/იმპორტერი/ბაზა.
- SSH key, შეზღუდული ადმინისტრაციული წვდომა, firewall და უსაფრთხოების განახლებები.
- Proxy უსმენს კერძო ინტერფეისზე; დაშვებულია მხოლოდ ბექისა და Job-ის საჭირო VPC წყაროები. მთელი ინტერნეტისთვის proxy პორტს არ ვხსნით.
- მხოლოდ Supplier-ის დომენი/პორტი/საჭირო მარშრუტებია დაშვებული; კლიენტი ნებისმიერ URL-ს ვერ მიუთითებს. HTTPS სერტიფიკატის შემოწმება ჩართული რჩება.
- Supplier-only proxy-ის არჩევანი (შეზღუდული CONNECT ან ფიქსირებული upstream) და საჭირო კონფიგურაციის ცვლილება ცალკე უნდა განხორციელდეს. არსებული გარემოს ცვლადის შეცვლას გამართულ proxy ინტეგრაციად არ ვთვლით; გლობალური `HTTPS_PROXY` ყველა ინტეგრაციაზე არ დავაყენოთ.
- მოთხოვნისა და პასუხის timeout, ზომის გონივრული ლიმიტები, ნაკადად გადაცემა; მთელი კატალოგის RAM-ში შენახვა პროქსს არ სჭირდება.
- ლოგებში token/header/პერსონალური მონაცემები არ იბეჭდება; log rotation და disk მონიტორინგი.
- სერვისი გადატვირთვის შემდეგ ავტომატურად ირთვება. ვინ უვლის და სად მიდის გაფრთხილება, წინასწარ განისაზღვროს.
- ორივე გზიდან — ბექი და Supplier Job — რეალური გამავალი IP შევამოწმოთ და მხოლოდ ამის შემდეგ მივაწოდოთ მომწოდებელს. ერთი IPv4-ის CIDR ფორმაა `/32`, არა `/3`.
- ჩვეულებრივი Droplet public IPv4 საწყისად საკმარისია; Droplet-ის წაშლის/ჩანაცვლებისას მისამართის შეცვლა გასათვალისწინებელია.
- Reserved IP სურვილის შემთხვევაში: მიმაგრებული უფასოა, მიუმაგრებელი ფასიანია. მხოლოდ მიბმა გამავალი IP-ის შეცვლას არ ნიშნავს; საჭიროა outbound routing და reboot-ის შემდეგ გადამოწმება.
- Proxy-ის გათიშვის ტესტი: იმპორტმა ვერ უნდა შეცვალოს მარაგი ძველი/ნაწილობრივი პასუხით; საჭიროა ჩავარდნისა და ბოლო წარმატებული სინქრონიზაციის დაძველების შეტყობინება.

Dedicated Egress $25 ამ სქემაში არ ჩავრთოთ: App VPC-სთან ერთად არ მუშაობს. Proxy ერთი შეფერხების წერტილია — მისი გათიშვა მომწოდებლის სინქრონიზაციას აჩერებს, ხოლო მაღაზიაში მონაცემები შეიძლება მოძველდეს. ხანგრძლივი გათიშვისას გაყიდვის შეზღუდვის/ხელით გადამოწმების ოპერაციული წესი გასაყიდად გახსნამდე უნდა გვქონდეს.

## 4. რატომ ვტოვებთ Brevo-ს

Brevo-ს შეცვლა ახლა საჭირო არ არის.

პროექტში უკვე გაკეთებულია:

- Brevo API-ით წერილის გაგზავნა;
- SMTP fallback;
- ტექსტური და HTML წერილები;
- დროებითი შეცდომის დროს წერილის ხელახლა გაგზავნის მცდელობა;
- რეგისტრაციის აქტივაცია;
- აქტივაციის წერილის ხელახლა გაგზავნა;
- პაროლის აღდგენა;
- ელფოსტის ცვლილების დადასტურება.

სხვა მომსახურებაზე გადასვლა მოითხოვს კოდის, პარამეტრებისა და ტესტების შეცვლას, მაგრამ ამ ეტაპზე რეალურ უპირატესობას არ გვაძლევს.

Brevo-ს უფასო პაკეტი იძლევა დღეში 300 წერილის გაგზავნის საშუალებას. დღეში 5–10 შეკვეთისა და მცირე საწყისი მომხმარებლების რაოდენობისთვის ეს საკმარისი უნდა იყოს.

ფასიან პაკეტზე გადავდივართ მხოლოდ მაშინ, თუ:

- დღეში 300 წერილს ვუახლოვდებით;
- ვიწყებთ მასობრივ სარეკლამო წერილებს;
- გვჭირდება უფრო მაღალი ლიმიტი ან დამატებითი მხარდაჭერა.

## 5. რომელი კომპანიის ელფოსტა რისთვის გამოვიყენოთ

შენ გაქვს:

- `info@flexdrive.ge`
- `support@flexdrive.ge`
- `return@flexdrive.ge`

რეკომენდებული განაწილება:

| მისამართი | დანიშნულება |
|---|---|
| `info@flexdrive.ge` | ბანკი, პარტნიორები, მომწოდებლები და კომპანიის ოფიციალური მიმოწერა |
| `support@flexdrive.ge` | მომხმარებლების კითხვები, შეკვეთები, ტექნიკური და ზოგადი დახმარება |
| `return@flexdrive.ge` | დაბრუნება, შეცვლა და დაბრუნებასთან დაკავშირებული დოკუმენტები |

ავტომატური აქტივაციისა და ანგარიშის უსაფრთხოების წერილებისთვის გამოიყენება:

- გამგზავნი: `noreply@flexdrive.ge`;
- მომხმარებელთა დახმარება: `support@flexdrive.ge`.

`noreply@flexdrive.ge` გამოიყენება რეგისტრაციის აქტივაციის, პაროლის აღდგენისა და ელფოსტის ცვლილების დამადასტურებელი ავტომატური წერილებისთვის. წერილის ტექსტში მომხმარებელს მკაფიოდ უნდა მივუთითოთ, რომ დახმარებისთვის `support@flexdrive.ge` გამოიყენოს.

ამჟამინდელი backend კოდი ცალკე `Reply-To` მისამართს არ უთითებს. `noreply` მისამართის დანიშნულებიდან გამომდინარე ეს სავალდებულო არ არის, თუმცა Brevo-სა და ელფოსტის ჰოსტინგში მისამართი გამართულად უნდა იყოს შექმნილი და დადასტურებული.

Backend-ის production პარამეტრი აღარ უნდა შეიცავდეს პირად Gmail მისამართს:

```env
DEFAULT_FROM_EMAIL=noreply@flexdrive.ge
```

ასევე კოდიდან უნდა ამოვიღოთ პირადი Gmail-ის ნაგულისხმევი მნიშვნელობა, რათა შეცდომით production წერილი პირადი მისამართიდან არასოდეს წავიდეს.

## 6. რეალური სამუშაო თანმიმდევრობა

1. ამ გზამკვლევის მიხედვით deployment-ის დარჩენილი კოდის ცვლილებები ჩამოვწეროთ; დახურული წვდომა და origin-ის დაცვა მოვამზადოთ ფასიან გაშვებამდე.
2. შევინახოთ არსებული DNS/MX/TXT ჩანაწერები; Cloudflare/დომენების გეგმა ისე მოვაწყოთ, რომ კომპანიის ელფოსტა მუშაობდეს.
3. გადავამოწმოთ ანგარიშებზე წვდომა, 2FA, საიდუმლო პარამეტრების სახელები და production branch/commit.
4. როცა იმავე დღეს deployment-ს ვიწყებთ, შევქმნათ PostgreSQL, შემდეგ Valkey — ცალკე production რესურსებად.
5. ცარიელ production ბაზაში კონტროლირებულად გადავიტანოთ შერჩეული საწყისი მონაცემები და media-ს დამოუკიდებელი ასლები (სექცია 15); აპი/ავტომატიზაცია ჯერ გამორთული იყოს.
6. ბექი და ფრონტი ავტვირთოთ დაცულ რეჟიმში. მინიმალური დახურული გვერდის ნახვით დავადასტუროთ, რომ უცნობ მომხმარებელს არც დროებითი URL-ით აქვს წვდომა.
7. შევქმნათ და გავმართოთ Proxy Droplet; მისი დადასტურებული გამავალი IP მივაწოდოთ მომწოდებელს.
8. დავასრულოთ/შევამოწმოთ იმპორტის draft ლოგიკა; შემდეგ dry-run და კონტროლირებული პირველი იმპორტი.
9. production-ში სურათების/კატეგორიების მომზადება გავაგრძელოთ; აქ გაკეთებულ რედაქტირებებს staging-ის ასლით აღარ გადავაწეროთ.
10. დავასრულოთ ბანკისა და კურიერის მონიტორინგი, ავტომატიზაცია, გაფრთხილებები და უსაფრთხოების დარჩენილი ზომები.
11. შევამოწმოთ წარმადობა, შეკვეთები, გადახდა/დაბრუნება, backup-იდან აღდგენა და კოდის უკან დაბრუნება.
12. მხოლოდ მზადყოფნის checklist-ის შესრულების შემდეგ გავხსნათ storefront და ჩავრთოთ ინდექსაცია. ადმინის დაცვა რჩება.

დახურული საიტის დომენზე მიბმა საჯაროდ გახსნას არ ნიშნავს. საბოლოო დომენების ადრევე დაცულად გამოყენება OAuth/ბანკის მისამართების ზედმეტ ცვლილებას აგვარიდებს.

## 7. კოდის მზადყოფნა — არსებული და დარჩენილი

2026-09-20-ზე კოდში ნანახი მდგომარეობა:

| საკითხი | მდგომარეობა | როდის არის აუცილებელი |
|---|---|---|
| Nuxt SSR/API proxy/OAuth, Django/Uvicorn | არსებობს | დახურული deployment |
| PostgreSQL/Cloudinary/Redis მხარდაჭერა | არსებობს; production isolation გასამართია | მონაცემების გადატანამდე |
| `/manager-fd/` ადმინი | არსებობს; მხოლოდ URL დამატებითი ავტორიზაცია არ არის | თავიდანვე |
| ნაღდი გადახდის გამორთვა | `CASH_ON_DELIVERY_ENABLED=False` | production-ში შევინარჩუნოთ |
| BOG callback და ხელით reconciliation | არსებობს; ბოლომდე production QA სჭირდება | რეალურ გადახდამდე |
| პერიოდული payment reconciliation და operator alerts | დასასრულებელია | რეალურ გადახდამდე |
| EasyWay შექმნა/გაუქმება | არსებობს | რეალურ გზავნილამდე QA |
| EasyWay მიწოდების სტატუსების პერიოდული სინქრონიზაცია | დასასრულებელია | რეალურ გზავნილამდე |
| Cross Motors bulk importer | არსებობს, მაგრამ პროდუქტს `PUBLISHED` სტატუსს ანიჭებს | ავტომატურ იმპორტამდე გასასწორებელია |
| Supplier draft/manual category/image დაცვის წესები | დასასრულებელია | ავტომატურ იმპორტამდე |
| Supplier sale holds | არსებობს: raw/effective stock განცალკევებულია | შემოწმდეს და შენარჩუნდეს |
| დახურული storefront და origin-ის შემოვლის დაცვა | დასამატებელი/დასადასტურებელია | პირველი გარე deployment-მდე |
| ადმინის დამატებითი ავტორიზაცია და recovery | საბოლოო მეთოდი შესარჩევი/გასამართია | რეალურ მონაცემებამდე |

არ ვიწყებთ auth/cart/checkout-ის ფართო გადაწერას. თითო დამატება დამოუკიდებლად და შესაბამისი ტესტებით მოწმდება. ფრონტისა და ბექის ზუსტ commit-ებს deployment ჩანაწერში ვაფიქსირებთ.

საჯარო გახსნამდე აგრეთვე: OAuth/reCAPTCHA production დომენები, წერილის გამგზავნი და მიწოდება, კომპანიის/იურიდიული ტექსტები, ძველი ბრენდის/სატესტო მონაცემების მოცილება, analytics consent/ტესტების გამიჯვნა და მხოლოდ საჭირო staff უფლებები.

### დახურული წვდომის არჩევანი და მიღების კრიტერიუმები

საწყისი მიმართულება: Cloudflare Access-ის email allowlist მხოლოდ მფლობელისთვის, არსებული უფასო გეგმის პირობების დადასტურებით. ეს არის დაგეგმილი დაცვა და ჯერ არა ჩართული ფუნქცია.

- Frontend-ისა და backend/admin-ის საჯარო მისამართები ცალ-ცალკე დავიცვათ. `noindex`, საიდუმლო URL, CORS ან `ALLOWED_HOSTS` წვდომის დაცვას არ ცვლის.
- Cloudflare-ის გვერდის ავლით `.ondigitalocean.app` მისამართები ღია არ უნდა დარჩეს. origin-ზე Access JWT-ის signature/issuer/audience/expiry უნდა მოწმდებოდეს ან გამოყენებული იყოს სხვა შემოწმებული origin-level დაცვა. მხოლოდ header-ის არსებობის შემოწმება არასაკმარისია.
- SSR და Nuxt `/api` proxy → Django კავშირისთვის ცალკე დავგეგმოთ ავტორიზებული server-to-server გზა; service token მხოლოდ სერვერზე, არასდროს `NUXT_PUBLIC_*` პარამეტრში.
- არ გადავცეთ frontend-ის Access token ბექში ბრმად: სხვადასხვა აპის audience შეიძლება განსხვავდებოდეს. არ ვაკეთებთ მთელი API-ის დაუცველ გამონაკლისს.
- ბანკის ზუსტი callback route უნდა იყოს მისაწვდომი ადამიანის Access login-ის გარეშე; თვითონ callback-ის კრიპტოგრაფიული შემოწმება რჩება. health check მხოლოდ მინიმალურ სტატუსს აბრუნებს; OAuth დაბრუნება და მფლობელის სესია ცალკე მოწმდება.
- არავერიფიცირებულ მოთხოვნაზე დაცვა fail-closed უნდა იყოს; მფლობელის სესიით storefront/OAuth/API/admin უნდა მუშაობდეს.
- პირველი deployment-ის დროებითი მისამართიც თავიდანვე დაცული უნდა იყოს; თუ დაცვა მზად არაა, აპში რეალურ მონაცემებს ჯერ არ ვტვირთავთ/არ ვასაჯაროებთ.
- ინდექსაცია დახურულ ეტაპზე გამორთულია. Cloudinary-ის ჩვეულებრივი public სურათების URL-ები Access-ით ავტომატურად არ იკეტება; მათში პირადი დოკუმენტები არ უნდა მოხვდეს.

## 8. ეტაპი 1 — არსებული ანგარიშებისა და წვდომების დალაგება

შექმენი პაროლების უსაფრთხო სია password manager-ში. ტექსტურ ფაილში ან ჩატში პაროლები არ შეინახო.

უნდა გქონდეს წვდომა:

- GitHub frontend repository-ზე;
- GitHub backend repository-ზე;
- DigitalOcean-ზე;
- Namespace.ge-ზე;
- Cloudflare-ზე;
- Cloudinary-ზე;
- Brevo-ზე;
- ელფოსტის ჰოსტინგზე;
- Google Cloud Console-ზე;
- reCAPTCHA Console-ზე;
- Meta Developers/Business-ზე;
- ბანკის merchant portal-ზე;
- staging Render-ზე;
- staging Vercel-ზე;
- staging PostgreSQL-ზე;

ყველა მნიშვნელოვან ანგარიშზე ჩართე ორნაბიჯიანი დაცვა ხელმისაწვდომი მეთოდით; SMS სავალდებულო არაა. Recovery კოდები უსაფრთხოდ შეინახე. თითო თანამშრომელს თავისი ანგარიში/ფაქტორი და მინიმალური უფლებები უნდა ჰქონდეს.

GitHub repository-ებში `.env` ფაილები, პაროლები და API token-ები არ უნდა იყოს ატვირთული.

## 9. ეტაპი 2 — Cloudflare-ის მომზადება

Cloudflare დასაწყისისთვის უფასოა და გვაძლევს:

- DNS მართვას;
- HTTPS დაცვას;
- DDoS-ის საბაზისო დაცვას;
- გვერდების და ფაილების უფრო სწრაფ მიწოდებას;
- საეჭვო ტრაფიკის ნაწილის გაფილტვრას.

### ყველაზე მნიშვნელოვანი გაფრთხილება

შენს დომენზე უკვე მუშაობს სამი ელფოსტა. მათი მუშაობა დამოკიდებულია DNS-ის `MX` და `TXT` ჩანაწერებზე.

თუ Namespace.ge-ზე არსებული nameserver-ები პირდაპირ Cloudflare-ზე გადავრთეთ და ელფოსტის ჩანაწერები წინასწარ არ გადავიტანეთ, კომპანიის ელფოსტა შეიძლება მთლიანად გაითიშოს.

### ნაბიჯები

1. გახსენი ელფოსტის ჰოსტინგის მართვის პანელი.
2. იპოვე ყველა DNS ჩანაწერი:
   - `MX`;
   - SPF-ის `TXT`;
   - DKIM-ის `TXT` ან `CNAME`;
   - DMARC-ის `TXT`, თუ არსებობს;
   - mail/webmail-ის `A` ან `CNAME`;
   - ნებისმიერი სხვა ჩანაწერი, რომელიც ჰოსტინგის კომპანიამ მოგცა.
3. შეინახე მათი სქრინშოტი და ტექსტური ასლი.
4. შექმენი Cloudflare ანგარიში.
5. დაამატე `flexdrive.ge`.
6. Cloudflare შეეცდება არსებული DNS ჩანაწერების ავტომატურად ამოცნობას.
7. ხელით შეადარე Cloudflare-ის სია Namespace.ge-სა და ელფოსტის ჰოსტინგის ჩანაწერებს.
8. სანამ ერთი ჩანაწერიც აკლია, nameserver-ები არ შეცვალო.
9. მხოლოდ სრული შედარების შემდეგ Namespace.ge-ზე შეცვალე nameserver-ები Cloudflare-ის მიერ მოცემული ორი მისამართით.
10. ცვლილების შემდეგ შეამოწმე:
    - წერილის გაგზავნა `info@flexdrive.ge`-დან Gmail-ზე;
    - Gmail-იდან პასუხის მიღება;
    - იგივე `support` და `return` მისამართებზე.

Cloudflare-ში ელფოსტის `MX` ჩანაწერებზე proxy არ გამოიყენება.

დომენის დადასტურებისას `DNS only` რეჟიმი შეიძლება დაგვჭირდეს; ამ პერიოდშიც origin-level დახურული დაცვა უკვე მოქმედებდეს (სექცია 7). შემდეგ შეგვიძლია Cloudflare proxy ჩავრთოთ.

Cloudflare SSL რეჟიმი უნდა იყოს `Full (strict)`. `Flexible` რეჟიმი არ გამოიყენო.

## 10. ეტაპი 3 — Brevo-ს production მომზადება

Brevo-ში უნდა დავამატოთ და დავადასტუროთ `flexdrive.ge`.

Brevo მოგცემს DNS ჩანაწერებს, ძირითადად:

- Brevo code;
- DKIM;
- DMARC, თუ დომენს DMARC ჯერ არ აქვს.

ეს ჩანაწერები ზუსტად უნდა დაემატოს Cloudflare DNS-ში.

მნიშვნელოვანი წესები:

- დომენს მხოლოდ ერთი DMARC ჩანაწერი უნდა ჰქონდეს;
- არსებული SPF ჩანაწერი ბრმად არ ჩაანაცვლო, რადგან კომპანიის ელფოსტის ჰოსტინგიც იყენებს მას;
- ერთი დომენისთვის ორი ცალკე SPF `TXT` ჩანაწერის შექმნა არ შეიძლება — საჭიროების შემთხვევაში ისინი ერთ ჩანაწერში უნდა გაერთიანდეს;
- Brevo-ს მიერ ნაჩვენები მნიშვნელობები გამოიყენე ზუსტად, თვითნებურად არ შეცვალო;
- Brevo-ში sender-ად დაამატე `noreply@flexdrive.ge`;
- გაგზავნამდე Brevo dashboard-ში დომენის სტატუსი უნდა იყოს authenticated.

სატესტო წერილი გაუგზავნე:

- Gmail-ს;
- Outlook-ს, თუ შესაძლებელია;
- შენს კომპანიის სხვა მისამართს.

შეამოწმე, წერილი Inbox-ში მიდის თუ Spam-ში.

## 11. DigitalOcean ანგარიში და ხარჯების კონტროლი

ანგარიში, ბარათი და `FLEXDRIVE Production` პროექტი უკვე არსებობს; ხელახლა არ შევქმნათ. დადასტურდეს ანგარიშის 2FA და recovery კოდების უსაფრთხო შენახვა.

- რესურსებს ვქმნით საჭიროების დადგომისას; მაღაზიის დახურული მდგომარეობა დარიცხვას არ აჩერებს.
- Billing alert-ის საწყისი სამიზნე $55, ესკალაცია $70/$90 — dashboard-ის ხელმისაწვდომი პარამეტრების ფარგლებში. შეტყობინება ხარჯს ავტომატურად არ ზღუდავს.
- ყველა რესურსი ერთ production პროექტშია. არჩეული რეგიონია Frankfurt; VPC-ის შესაბამისობა სექცია 3-ით.
- ბაზის storage autoscaling ავტომატურ დამატებით ხარჯს ნიშნავს: საწყისად 10 GiB და usage alert; ავტომატური ზრდა მხოლოდ გააზრებული მაქსიმუმით, თუ პლატფორმა მის დაყენებას გვაძლევს.
- მომხმარებელი თითო ფასიან რესურსზე ხედავს checkout-ის საბოლოო ფასს. აქ მოხსენიებული ფასი არ მოიცავს გადასახადებს/კონვერტაციას.

## 12. პირველი ფასიანი ნაბიჯი — Managed PostgreSQL

ბაზა ინახავს catalog/CMS-ს, მომხმარებლებს, შეკვეთებსა და გადახდებს. PostgreSQL პროგრამა უფასოა; აქ ვიხდით სერვერის რესურსში, მართვაში და backup მომსახურებაში.

შექმნისას:

- პროექტი `FLEXDRIVE Production`;
- Managed PostgreSQL, Standard / Basic / Regular;
- 1 vCPU / 1 GiB RAM, 10 GiB საცავი: **$15.15/თვე** (საცავი უკვე შედის);
- Frankfurt `fra1`, ბექისთვის არჩეული VPC;
- სახელის მაგალითი: `flexdrive-production-db`;
- ძრავის ვერსია შევადაროთ წყარო ბაზას და მოქმედ psycopg/Django-ს: ძველ major-ზე restore არ ვცადოთ; restore tooling/extension compatibility შექმნამდე გადავამოწმოთ;
- standby replica ამ ბიუჯეტში არ შედის; backup მაღალი ხელმისაწვდომობის სრული გარანტია არ არის.

საწყის გეგმაში dashboard-მა 22 connection აჩვენა; provisioning-ისას ხელახლა შევამოწმოთ. ბექი, admin, Job-ები და ოპერაციული კავშირები ამ ლიმიტს იყოფენ. კონფიგურაციაში connection pooling/lifetime და პროცესების რაოდენობა გონივრულად განისაზღვროს, შეუზღუდავი worker-ები არ დაემატოს.

App-ის VPC წყარო დავამატოთ trusted sources-ში და TLS-ით გამოვიყენოთ private endpoint. ოპერატორის დროებითი გარე წვდომა მხოლოდ საჭირო IP-ით, დასრულების შემდეგ მოიხსნას. პაროლები მხოლოდ Secret storage-ში; ღია საჯარო წვდომა არა.

Managed PostgreSQL-ს ყოველდღიური backup და შვიდდღიანი PITR აქვს; provisioning-ისას დადასტურდეს retention. restore ცალკე დროებით ბაზაზე შევამოწმოთ და გავითვალისწინოთ მისი დროებითი ფასი. App Platform-ის development database production მაღაზიისთვის არ გამოვიყენოთ.

პირველი restore-ის თანმიმდევრობა სექცია 15-შია. ცარიელ ბაზაში build-ის migration-ების გაშვებამდე გადავწყვიტოთ საწყისი snapshot-ის აღდგენის გზა.

## 13. ეტაპი 6 — Managed Valkey/Redis-ის შექმნა

DigitalOcean-ის Valkey თავსებადია Redis-თან. პროექტის კოდისთვის ეს Redis კავშირია.

FlexDrive-ში ის გამოიყენება:

- cache-ისთვის;
- API rate limiting-ისთვის;
- login/register/checkout მოთხოვნების შეზღუდვისთვის;
- რამდენიმე backend პროცესს შორის საერთო სწრაფი მდგომარეობისთვის.

production კონფიგურაცია Redis-ის გარეშე განზრახ არ ირთვება.

### რეკომენდებული არჩევანი

- Managed Valkey;
- 1 GB RAM / 1 vCPU;
- დაახლოებით $15 თვეში;
- backend-ის რეგიონში.

Backend-ის პარამეტრები:

```env
CACHE_ENABLED=True
CACHE_REDIS_URL=rediss://...
CACHE_PREFIX=flexdrive-production
```

ზუსტი TLS/private URL DigitalOcean-ის dashboard-იდან უნდა ავიღოთ; App-ის VPC წყარო trusted sources-ში ცალკე დაემატოს. Redis ინტერნეტისთვის ღიად არ დავტოვოთ.

## 14. ეტაპი 7 — Backend-ის App Platform-ზე ატვირთვა

Backend არის Django API და admin panel.

### App-ის შექმნა

1. DigitalOcean-ში გახსენი App Platform.
2. აირჩიე Create App.
3. დააკავშირე GitHub.
4. მიეცი წვდომა მხოლოდ საჭირო backend repository-ზე.
5. აირჩიე production branch.
6. Environment უნდა იყოს Python; buildpack-ის ვერსია requirements-თან და ლოკალურ 3.13 გარემოსთან შევათავსოთ. Dependency lock/pins არ განვაახლოთ deployment-ის გვერდითი ეფექტით.
7. Build command (ქვემოთ აღწერილი migration-ის გამიჯვნის შემდეგ):

```bash
bash build.sh
```

8. Run command:

```bash
bash start.sh
```

9. თავდაპირველად აირჩიე 1 shared vCPU / 1 GiB RAM fixed — $10; ზომა დახურული დატვირთვის შემოწმების შემდეგ დადასტურდეს.
10. Autodeploy თავიდან შეიძლება გამორთული იყოს, სანამ production პროცესი ბოლომდე არ დალაგდება.

არსებული `build.sh` აკეთებს:

- Python პაკეტების დაყენებას;
- static ფაილების მომზადებას;
- database migration-ების გაშვებას.

არსებული `start.sh` უშვებს Django ASGI აპლიკაციას Uvicorn-ით.

**პირველ deployment-მდე გასასწორებელი განაწილება:** `build.sh` ამჟამად ასევე წინასწარ ტვირთავს სურათის ფონის მოცილების მოდელს და უშვებს `migrate`-ს. Restore და migration-ის რიგი სექცია 15-ით უნდა განისაზღვროს. Job კომპონენტების დამატებამ migration მრავალჯერ/პარალელურად არ უნდა გაუშვას. Production build-სა და migration-ის ერთ pre-deploy გაშვებას ცალ-ცალკე მოვაწყობთ; ეს ჯერ დაგეგმილი კოდის ცვლილებაა. Job-ის run command მხოლოდ შესაბამისი management command იქნება.

App-ის runtime/პორტი ემთხვევოდეს `start.sh`-ს და პლატფორმის `PORT`-ს; readiness/health route იყოს სწრაფი და მინიმალური. Health probe-ზე ადამიანი Access login არ უნდა იყოს საჭირო. Deploy-ს DB/media განადგურების seed/reset ბრძანება არ დაემატოს. Backend/Jobs ერთ App-ში განთავსდეს, იგივე private VPC-ით; frontend შეიძლება ცალკე App იყოს. Native Python/Node buildpack-ები გამოიყენება, ადგილობრივი Docker/WSL აუცილებელი არაა.


### Backend-ის აუცილებელი environment variables

ქვემოთ მოცემული სია სახელების checklist-ია. რეალური საიდუმლო მნიშვნელობები მხოლოდ DigitalOcean-ში შეიყვანე.

```env
APP_ENV=production
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<ახალი-გრძელი-production-secret>

DJANGO_ALLOWED_HOSTS=<backend-domain>
FRONTEND_BASE_URL=https://flexdrive.ge
CORS_ALLOWED_ORIGINS=https://flexdrive.ge,https://www.flexdrive.ge
CSRF_TRUSTED_ORIGINS=https://flexdrive.ge,https://www.flexdrive.ge,https://api.flexdrive.ge

SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
API_COOKIE_SECURE=True
SECURE_SSL_REDIRECT=True

DATABASE_URL=<DigitalOcean-PostgreSQL-private-url>

CACHE_ENABLED=True
CACHE_REDIS_URL=<DigitalOcean-Valkey-private-url>
CACHE_PREFIX=flexdrive-production

USE_CLOUDINARY_MEDIA=True
CLOUDINARY_CLOUD_NAME=<secret>
CLOUDINARY_API_KEY=<secret>
CLOUDINARY_API_SECRET=<secret>

EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_TIMEOUT=10
EMAIL_HOST_USER=<Brevo-SMTP-user>
BREVO_SMTP_KEY=<secret>
BREVO_API_KEY=<secret>
BREVO_API_TIMEOUT=10
DEFAULT_FROM_EMAIL=noreply@flexdrive.ge
CONTACT_NOTIFICATION_EMAIL=support@flexdrive.ge

RECAPTCHA_SECRET_KEY=<production-secret>
RECAPTCHA_ALLOWED_HOSTNAMES=flexdrive.ge,www.flexdrive.ge

GOOGLE_OAUTH_CLIENT_ID=<production-client-id>
GOOGLE_OAUTH_CLIENT_SECRET=<secret>
GOOGLE_OAUTH_REDIRECT_URI=https://flexdrive.ge/auth/google/callback

FACEBOOK_APP_ID=<id>
FACEBOOK_APP_SECRET=<secret>
FACEBOOK_OAUTH_REDIRECT_URI=https://flexdrive.ge/auth/facebook/callback

CROSSMOTORS_API_BASE_URL=https://portal.crossmotors.ge
CROSSMOTORS_API_TOKEN=<secret>
CROSSMOTORS_API_PAGE_SIZE=<current-value>
CROSSMOTORS_API_TIMEOUT=<current-value>

META_PIXEL_ID=<id>
META_CAPI_ACCESS_TOKEN=<secret>
META_CAPI_ENABLED=False
```

ქვემოთ დამატებითი **არსებული** პარამეტრების checklist-ია. დროებით/საბოლოო დომენებს ზუსტად უნდა ემთხვეოდეს; API hostname თვითონაც შედიოდეს საჭირო CSRF trusted origins-ში admin-ისთვის. `DJANGO_ALLOWED_HOSTS` არ შეიცავს სქემას, CORS/CSRF კი სრული origin-ებია. შემთხვევითი wildcard არა.

```env
CASH_ON_DELIVERY_ENABLED=False
BOG_PAYMENTS_ENABLED=False
BOG_CLIENT_ID=<production-client-id>
BOG_CLIENT_SECRET=<secret>
BOG_OAUTH_URL=<bank-confirmed-url>
BOG_API_BASE_URL=<bank-confirmed-url>
BOG_CALLBACK_PUBLIC_URL=https://api.flexdrive.ge/api/commerce/payments/bog/callback/
BOG_FRONTEND_SUCCESS_URL=<confirmed-frontend-url>
BOG_FRONTEND_FAIL_URL=<confirmed-frontend-url>
BOG_CALLBACK_PUBLIC_KEY=<bank-confirmed-public-key>
BOG_ORDER_TTL_MINUTES=<verified-value>
BOG_STOCK_RESERVATION_TTL_SECONDS=<verified-value>
BOG_HTTP_CONNECT_TIMEOUT_SECONDS=<verified-value>
BOG_HTTP_READ_TIMEOUT_SECONDS=<verified-value>
CROSSMOTORS_SALE_HOLD_SECONDS=<verified-value>
EASYWAY_API_BASE_URL=<confirmed-url>
EASYWAY_API_USER=<secret>
EASYWAY_API_KEY=<secret>
EASYWAY_HTTP_CONNECT_TIMEOUT_SECONDS=<verified-value>
EASYWAY_HTTP_READ_TIMEOUT_SECONDS=<verified-value>
EASYWAY_SENDER_CITY_ID=<verified-value>
EASYWAY_SENDER_REGION_ID=<verified-value>
EASYWAY_SENDER_NAME=<company-name>
EASYWAY_SENDER_TAX_CODE=<company-tax-code>
EASYWAY_SENDER_ADDRESS=<company-address>
EASYWAY_SENDER_PHONE=<company-phone>
EASYWAY_SENDER_LEGAL_FORM_ID=<verified-value>
EASYWAY_STANDARD_PACKAGE_ID=<verified-value>
EASYWAY_INTERNAL_DELIVERY_PRICE_GEL=<verified-value>
EASYWAY_DELIVERY_MARGIN_GEL=<verified-value>
```

BOG payments მხოლოდ ტესტებისთვის მზად merchant/URL/credentials პირობებში ჩაირთოს; საჯარო გაყიდვამდე დამტკიცებული კონფიგურაცია. დახურული საიტი რეალური ბანკის/კურიერის გამოძახებას თავისით არ აფერხებს. Supplier proxy და media namespace-ის ახალი ცვლადები მათი განხორციელებისას ზუსტად დაემატოს — არ ვამტკიცებთ, რომ ასეთი flags უკვე არსებობს.

`META_CAPI_ENABLED` მხოლოდ სრულად შემოწმების შემდეგ უნდა გახდეს `True`.

თუ Google Sheets-ის იმპორტი production-შიც გამოიყენება, დამატებით დაგვჭირდება:

```env
GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON=<secret-json>
GOOGLE_SHEETS_SPREADSHEET_ID=<id>
GOOGLE_SHEETS_SHEET_NAME=<name>
GOOGLE_SHEETS_CELL_RANGE=<range>
```

## 15. საწყისი მონაცემების გადატანა და production-ის დამოუკიდებლობა

ჯერ დავადგინოთ რომელი წყაროა თითო მონაცემისთვის უახლესი: staging CMS/catalog თუ ლოკალურად დასრულებული სურათები/კატეგორიები. არცერთი გარემო არ ჩავთვალოთ ავტომატურად სრულად განახლებულად. მოვილაპარაკოთ მოკლე შეჩერება/ბოლო ცვლილებების სია.

### პირველი გადატანა — მხოლოდ ცარიელ production ბაზაში

1. წყარო ბაზის backup და უსაფრთხო შენახვა; მომხმარებლის/სატესტო მონაცემების გასუფთავების კონკრეტული სია.
2. PostgreSQL major/client/extension/owner/role თავსებადობის შემოწმება და restore გეგმა. წყარო ბაზა არ იცვლება.
3. production აპი, Job-ები, წერილები, ბანკი და კურიერის მოქმედებები ჯერ გამორთულია. სრული snapshot მხოლოდ იზოლირებულ ცარიელ ბაზაში აღვადგინოთ.
4. შეთანხმებული release-ის migration-ები ზუსტად ერთხელ გავუშვათ; უკვე აღდგენილ ბაზას seed/reset/demo ბრძანებები ბრმად არ დავადოთ.
5. ჯერ მონაცემების ინვენტარი და snapshot-თან შედარება: SKU-ები, რაოდენობები, კატეგორიები, ფასები/მარაგები, CMS კავშირები, ProductImage ვარიანტები, primary/sort.
6. მხოლოდ წინასწარ დადასტურებული სატესტო order/payment/cart/user/contact მონაცემები გავასუფთაოთ; დაკავშირებული reservation/hold ჩანაწერებიც შევამოწმოთ. რეალური ოპერაცია არასოდეს წაიშალოს როგორც ტესტი.
7. staging admin პაროლები, სესიები, refresh token-ები და OAuth ჩანაწერები production წვდომად არ უნდა გადმოგვყვეს. შევქმნათ ცალკე production staff მომხმარებლები, მინიმალური უფლებებით.
8. Cloudinary ასლები და production ბმულები ქვემოთ მოცემული წესით გავაცალკევოთ; შემდეგ პირველი production backup.

### სურათები — დამოუკიდებელი ფაილები პირველივე დღიდან

DB backup შეიცავს ფაილის სახელს/ბმულს და არა თვით სურათს. იგივე cloud account შეიძლება გამოვიყენოთ, მაგრამ production-სა და staging-ს განსხვავებული asset public ID-ები უნდა ჰქონდეს.

- დაგეგმილი პრეფიქსებია `production/` და `staging/`; ჯერ არ არის ავტომატურად განხორციელებული. Cloudinary-ის dashboard folder-ის გამოყოფა თავისთავად public ID-ის იზოლაციას არ ამტკიცებს.
- storage/upload paths უნდა გახდეს გარემოზე დამოკიდებული ყველა media ტიპისთვის (პროდუქტი, კატეგორია, CMS, SEO); ეს მომავალი კოდის სამუშაოა. არსებული uploader `overwrite=True` იყენებს — საერთო ID-ით ატვირთვა სხვა გარემოს ფაილსაც შეცვლის.
- არსებულ ფაილებს production-ის ახალ ID-ებზე ვაკოპირებთ/ვტვირთავთ, ყველა ვარიანტის წარმატებას ვამოწმებთ და მხოლოდ შემდეგ production DB-ში ბმულებს ტრანზაქციულად ვცვლით.
- ლოკალური `media/` ბილიკები Cloudinary URL-ებად თავისით არ გადაიქცევა: საჭიროა რეალური upload. ProductImage mapping SKU-ით, original/desktop/tablet/mobile/AI ვარიანტების, alt/primary/sort-ის შენარჩუნებით.
- შეცდომის შემთხვევაში mapping არ იცვლება; ნაწილობრივ ატვირთული ასლების ინვენტარი გვრჩება დასალაგებლად. დიდი პარტიები ზომიერი პარალელიზმით, API ლიმიტების გათვალისწინებით.
- product image-ის წაშლა ამჟამად Cloudinary ფაილსაც შლის; სხვა გამოყენებას მხოლოდ იმავე DB-ში ამოწმებს. ამიტომ ორ ბაზაში საერთო URL უსაფრთხო დამოუკიდებლობა არ არის.
- იზოლაცია დავამტკიცოთ სატესტო ასლზე: staging-ში შეცვლა/წაშლა production ასლს არ აზიანებს. მერე staging-ის ზედმეტი ასლების წაშლა საერთო storage-ს გაათავისუფლებს.
- 500 MB staging + დამოუკიდებელი 500 MB production დაახლოებით 1 GB შენახულ მასალას ნიშნავს, გარდაქმნილი ვარიანტებისა და სხვა გამოყენების დამატებით. წაშლა უკვე მოხმარებულ bandwidth-ს არ აბრუნებს.
- ერთი cloud account-ის credentials სრული უსაფრთხოების საზღვარი არ არის; ცალკე IDs შემთხვევითი დაზიანებისგან გვიცავს, ანგარიშის სრული იზოლაციისთვის ცალკე product environment/account განიხილება.

### საწყისი გადატანის შემდეგ

Production-ში რედაქტირების დაწყების შემდეგ სრული staging restore აღარ ვაკეთებთ, არც გაყიდვების გახსნის დღეს. ახალი კონტენტი გადმოდის შერჩევითად, SKU/სტაბილური იდენტიფიკატორებით და წინასწარი diff-ით; production-ის სურათები, კატეგორიები, draft სტატუსი, მომხმარებლები/შეკვეთები რჩება.

Git push ჩვეულებრივ კოდს ცვლის და პროდუქტებს თავისით არ აკოპირებს. თუმცა data migration, seed/import ან build-ში გაშვებულ ბრძანებას DB-ის შეცვლა შეუძლია — ყოველი deployment-ისას ამას ცალკე ვამოწმებთ.

## 16. ავტომატური დავალებები და ოპერატორის შეტყობინებები

Scheduler-ის შეძენა ბიზნესლოგიკას არ ქმნის. ქვემოთ ყველა დასასრულებელი ფუნქცია ცალკე უნდა განხორციელდეს/შემოწმდეს; ამ დოკუმენტით ავტომატიზაცია არ ირთვება.

| საქმე | საწყისი სიხშირე | როდის ვუკავშირდებით გარე API-ს |
|---|---|---|
| Supplier bulk import | ყოველ 2 საათში | ყოველი დაგეგმილი refresh, Proxy-ის გავლით |
| BOG reconciliation | ყოველ 15 წუთში, შესათანხმებელი ასაკობრივი ზღვარით | მხოლოდ შესაბამისი დაუდასტურებელი/პრობლემური გადახდებისთვის |
| EasyWay მიწოდების სტატუსები | ყოველ 15 წუთში | მხოლოდ EasyWay-ში გაგზავნილ აქტიურ გზავნილებზე |
| ყოველდღიური გასუფთავება | დღეში ერთხელ, 03:30 | ძირითადად ჩვენი ბაზა |

თბილისის ჩვენი მიტანა EasyWay polling-ში არ ხვდება. წარმატებით დადასტურებული გადახდა არ გადაიმოწმება მუდმივად. ცარიელი job მაინც გაეშვება და ბაზას შეამოწმებს — გარე მოთხოვნა არ იქნება, გაშვების დრო კი ნულოვანი არ არის. ბანკის ჩვეულებრივი callback მაშინვე მუშავდება, Cron დამატებითი აღდგენის გზაა.

### 16.1 Supplier — არსებული bulk ბრძანება, მაგრამ ჯერ draft ლოგიკა

App Platform Scheduled Job, საწყისად 2 GiB, იგივე backend release/VPC/production DB. ორი საათის მაგალითი: `5 */2 * * *`, timezone `Asia/Tbilisi`.

პირველი dry-run (წაკითხვა, DB-ში ჩაწერის გარეშე):

```bash
python manage.py import_crossmotors_products --page-size 1000 --sample-size 0 --bulk
```

ანგარიშისა და draft ქცევის შემოწმების შემდეგ დაგეგმილი ჩაწერის ბრძანება:

```bash
python manage.py import_crossmotors_products --page-size 1000 --sample-size 0 --commit --bulk
```

ეს ბრძანებები deployment-ის Linux გარემოსთვისაა; ლოკალური backend ბრძანებები მხოლოდ მის `venv`-ში. `--archive-missing` საწყისად არ გამოიყენება.

ავტომატიზაციის ჩართვის აუცილებელი პირობები:

- არსებული იმპორტერის უპირობო `PUBLISHED` შეიცვალოს: ახალი SKU ჯერ draft, admin ფილტრში ჩანს; მფლობელი ამოწმებს სურათს/კატეგორიას და თავად აქვეყნებს.
- მომდევნო refresh draft-ს არ აქვეყნებს და ხელით არჩეულ კატეგორიას/სურათებს/რედაქტირებულ დაცულ ველებს არ გადაწერს. უკვე გამოქვეყნებულ პროდუქტს ფასები და მარაგები განუახლდება არსებული pricing წესით.
- stock/price sync არ ატვირთავს/შლის `ProductImage`-ებს. category mapping არ ქმნის ძველ დუბლირებულ კატეგორიებს.
- `supplier_stock_qty` raw snapshot და ეფექტური `stock_qty` რჩება განცალკევებული; აქტიური `SupplierStockHold`-ები აკლდება snapshot-ს. იმპორტის წარუმატებლობამ მარაგი არ უნდა გაზარდოს.
- timeout/არასრული feed/ცარიელი მოულოდნელი feed უსაფრთხოდ მუშავდება; ბოლო წარმატება და მონაცემების სიძველე ჩანს.
- ორ იმპორტს ერთდროულად არ ვუშვებთ; bounded retry/backoff, შეზღუდული runtime და failure alert.
- admin-ში ახალი პროდუქტების ფილტრი/რაოდენობა და ოპერატორისთვის მოკლე summary: created draft / updated / failed / last success. მფლობელს ყოველი პროდუქტის ხელით ძებნა არ უნდა უწევდეს.

### 16.2 ბანკი — reconciliation და alerts ჯერ დასასრულებელია

არსებული `reconcile_bog_payment` ბანკის შედეგს იღებს და არსებულ verified/idempotent callback ლოგიკას იყენებს. Scheduled selection/locking/retry/alerts ჯერ დასამატებელია; არ გამოვიგონოთ თითქოს შესაბამისი management command უკვე არსებობს.

- მხოლოდ შესაბამისი provider/action/state/ასაკის ჩანაწერები, შეზღუდული batch და გამეორების ინტერვალი; საბოლოოდ წარმატებული order/payment მუდმივად არ გადაიკითხოს.
- pending თანხა მარტო დროის გასვლით failed-ად არ იქცეს. ბანკთან შედარება შეესაბამებოდეს payment/reservation ვადებს და ბანკის rate limit-ს.
- შემოწმება ხელახლა არ ჩამოჭრის თანხას და დაბლოკილ order-ს ბრმად არ შექმნის.
- ბანკით დადასტურებული paid/no-order ან fulfillment conflict → admin-ში თვალსაჩინო მდგომარეობა და დაუყოვნებელი operator notification; საჭირო cancel/refund გადაწყვეტილება ცალკე კონტროლდება.
- browser დახურული რომ იყოს, scheduler მაინც უნდა მუშაობდეს. დაკარგული callback, duplicate, დაგვიანებული პასუხი და ხელახალი გაშვება შემოწმდეს.

### 16.3 EasyWay — სტატუსების სინქრონიზაცია ჯერ დასასრულებელია

არსებული create/cancel/location sync არ არის delivery status sync. ჯერ API-ის სტატუსები და საბოლოო მდგომარეობები დავაზუსტოთ. ვამოწმებთ მხოლოდ EasyWay ID-ის მქონე აქტიურ შეკვეთებს, არ ვქმნით გზავნილს ხელახლა. დაგვიანებულმა ძველმა პასუხმა ახალი მდგომარეობა არ უნდა გააუქმოს. საბოლოო/გაუქმებულის polling წყდება შეთანხმებული წესით. შეცდომებზე bounded retry და operator alert.

### 16.4 უფასო scheduler-ის შესაძლო გამოყენება

App Platform-ის native Cron მინიმუმ 15-წუთიანი ინტერვალით მუშაობს და მხოლოდ running time-ს ითვლის. მომწოდებლის ხანგრძლივი იმპორტისთვის ეს საწყისი არჩევანია.

მოკლე ბანკის/კურიერის შემოწმებებისთვის შეიძლება `cron-job.org`-ის უფასო HTTP trigger: ის ჩვენს დაცულ endpoint-ს მიმართავს, ხოლო სამუშაო არსებულ ბექზე შესრულდება. ეს ჯერ არჩეული/განხორციელებული არაა — duration/API limit/უსაფრთხოება და დატვირთვა ჯერ უნდა შეფასდეს. თუ არ გამოდგა, იგივე ლოგიკას native Job გაუშვებს. endpoint-ის სახელიც განხორციელებისას განისაზღვროს.

მოთხოვნები: HTTPS, server-only secret ან ხელმოწერა, replay/duplicate დაცვა, shared lock, მოკლე batch, timeout და failure notification. გარე scheduler-ს DB/ბანკის გასაღებები არ გადაეცემა. Access-იდან მხოლოდ კონკრეტული machine endpoint-ის გამონაკლისი საკუთარი ავტორიზაციით; მთელი API ღია არ გახდეს. HTTP პასუხის შემდეგ დაუცველ background thread-ში ხანგრძლივი საქმის დატოვება საიმედო queue არ არის.

Browser-ის `setInterval` არ გამოიყენება; სერვერზე შემთხვევითი timer restart/რამდენიმე instance-ისას საიმედო scheduler არ არის. Proxy Droplet-ში მძიმე importer-ის ჩატევა მხოლოდ $4-ის გადახდის გამო არ ვცადოთ. native Job-ების ამუშავება deployment/build trigger-ებზე Supplier commit-ს არ უნდა იწვევდეს.

### 16.5 გასუფთავება და სხვა queue

არსებული ბრძანება `python manage.py run_daily_cleanup`, schedule `30 3 * * *`, timezone `Asia/Tbilisi`: ძველი კალათები, ვადაგასული JWT-ები და stock reservations. reservation expiry-ის ყოველდღიური sweep არ ცვლის checkout-ის უშუალო expiry/reconciliation ლოგიკას; რეალურ გადახდებთან ვადები შემოწმდეს.

არსებობს `process_outbound_tasks` (ამჟამად dispatch-ში Meta purchase). სანამ ცალკე რეგულარულ გაშვებას დავამატებთ, განვსაზღვროთ რომელ flow-ში ივსება queue და საჭიროა თუ არა production-ში. ყველაფრისთვის ცალკე მუდმივ worker-ს წინასწარ არ ვყიდულობთ.

ყველა საჭირო Job-ისთვის ჩაიწეროს owner, timeout, ბოლო წარმატება, failure alert-ის მიმღები, retry და ხელით აღდგენის ინსტრუქცია. scheduler-ის გამორთვას/გამოტოვებას მხოლოდ job failure alert ვერ აღმოაჩენს — last-success freshness კონტროლიც საჭიროა. შეთავაზებული პირველი ზღვარი: 2-საათიანი supplier sync 4 საათზე მეტხანს არ განახლებულა → გაფრთხილება; ზუსტი ზღვარი რეალური დროის შემდეგ შეთანხმდეს.

## 17. ეტაპი 10 — Frontend-ის App Platform-ზე ატვირთვა

Frontend არის Nuxt 4 SSR აპლიკაცია და უბრალო static ფაილების ნაკრები არ არის. მას Node server სჭირდება, რადგან `/api` proxy და OAuth route-ებიც frontend server-ზე მუშაობს.

Nuxt-ის ოფიციალური production build ქმნის `.output` საქაღალდეს, ხოლო სტანდარტული გაშვების ბრძანებაა:

```bash
node .output/server/index.mjs
```

### App Platform პარამეტრები

1. იმავე production project-ში შექმენი ცალკე frontend App; ბექი და მისი Job-ები backend App-ში რჩება.
2. დააკავშირე frontend GitHub repository.
3. აირჩიე production branch.
4. Environment — Node.js; Node-ის ვერსია Nuxt/lockfile-სთან შევათავსოთ. Dependencies lockfile-ით reproducible ინსტალაციით დაიდგას; build-სა და runtime ზომას ცალ-ცალკე დავაკვირდეთ.
5. Build command:

```bash
npm run build
```

6. Run command:

```bash
node .output/server/index.mjs
```

7. საწყისი ზომა — 1 shared vCPU / 512 MiB RAM, $5; საჭიროების შემთხვევაში 1 GiB/$10.

### Frontend environment variables

```env
NODE_ENV=production

NUXT_BASE_API_URL=/api
NUXT_INTERNAL_API_URL=https://<backend-domain>/api

NUXT_PUBLIC_SITE_URL=https://flexdrive.ge
NUXT_PUBLIC_SITE_ENV=production
NUXT_PUBLIC_ALLOW_INDEXING=false
NUXT_PUBLIC_SITE_NAME=FlexDrive

NUXT_PUBLIC_DEFAULT_SEO_TITLE=FlexDrive - ავტონაწილების ონლაინ მაღაზია
NUXT_PUBLIC_DEFAULT_SEO_DESCRIPTION=<final-description>
NUXT_PUBLIC_DEFAULT_SEO_IMAGE=<production-social-image>

NUXT_PUBLIC_RECAPTCHA_SITE_KEY=<production-site-key>
NUXT_PUBLIC_GOOGLE_CLIENT_ID=<production-client-id>
NUXT_PUBLIC_GTM_ID=<GTM-id>
```

`NUXT_PUBLIC_ALLOW_INDEXING=false` რჩება საჯარო გახსნამდე. ეს მხოლოდ საძიებო ინდექსაციას ეხება; წვდომის რეალური დაცვა სექცია 7-ითაა საჭირო.

## 18. ეტაპი 11 — დროებით მისამართებზე სრული შემოწმება

მთავარ დომენზე გადართვამდე DigitalOcean ორივე აპს დროებით მისამართს მისცემს.

ტესტების ფარგლები შესაბამისი რისკით განვსაზღვროთ; გარე ბანკი/კურიერი დატვირთვის ტესტში რეალურ ოპერაციებს არ იღებს. ეს მომავალი deployment QA-ია, არა გზამკვლევის რედაქტირებისას ტესტების გაშვების მოთხოვნა.

უნდა შემოწმდეს:

### ზოგადი

- homepage;
- ყველა menu და footer ბმული;
- catalog;
- ძებნა;
- ფილტრები;
- პროდუქტის გვერდი;
- სურათები;
- dark/light mode;
- მობილური და desktop;
- 404 და server error გვერდები.

### მომხმარებელი

- რეგისტრაცია;
- აქტივაციის წერილის მიღება;
- აქტივაციის ლინკი;
- login/logout;
- Google login;
- Facebook login, თუ ჩართულია;
- პაროლის აღდგენა;
- პროფილის ცვლილება;
- ელფოსტის ცვლილების დადასტურება.

### ecommerce

- კალათაში დამატება;
- რაოდენობის შეცვლა;
- კალათიდან წაშლა;
- wishlist;
- guest checkout;
- registered checkout;
- buy now;
- შეკვეთის შექმნა;
- მარაგის შემცირება;
- მარაგის დროებითი რეზერვაცია;
- შეკვეთის ნახვა profile-ში;
- public order lookup;
- admin-ში შეკვეთის გამოჩენა.

### ონლაინ გადახდა

- წარმატებული გადახდა;
- უარყოფილი გადახდა;
- მომხმარებლის მიერ გაუქმება;
- განმეორებითი callback;
- დაგვიანებული callback;
- ერთი შეკვეთის ორჯერ გადახდისგან დაცვა;
- თანხის დაბრუნება;
- გადახდისა და შეკვეთის სტატუსების სწორად გაყოფა;
- ბანკის signature/secret შემოწმება.

### admin და ავტომატიზაცია

- admin login;
- პროდუქტის ცვლილება;
- სურათის ატვირთვა Cloudinary-ზე;
- CMS კომპონენტის ცვლილება;
- supplier cron-ის ხელით გაშვება;
- daily cleanup-ის dry/safe შემოწმება;
- job logs;
- backup-ის არსებობა.

## 19. ეტაპი 12 — production დომენების მოწყობა

რეკომენდებული მისამართები:

- მთავარი საიტი: `https://flexdrive.ge`
- `www`: `https://www.flexdrive.ge`, რომელიც მთავარ მისამართზე გადამისამართდება;
- backend: `https://api.flexdrive.ge`
- admin: `https://api.flexdrive.ge/manager-fd/`

Backend საჯაროდ ცალკე `api` subdomain-ზე იქნება, მაგრამ browser-ის ჩვეულებრივი API მოთხოვნები frontend-ის `/api` proxy-ით გაივლის.

### მიბმის თანმიმდევრობა

1. DigitalOcean frontend app-ში დაამატე `flexdrive.ge`.
2. დაამატე `www.flexdrive.ge`.
3. Backend app-ში დაამატე `api.flexdrive.ge`.
4. DigitalOcean მოგცემს საჭირო `CNAME` ან სხვა DNS ჩანაწერებს.
5. საჭიროებისამებრ დაამატე `DNS only` რეჟიმით, უკვე მოქმედი origin-level დახურული დაცვის პირობებში.
6. დაელოდე DigitalOcean-ის domain verification-სა და HTTPS სერტიფიკატს.
7. შეამოწმე ყველა მისამართი HTTPS-ით.
8. მხოლოდ ამის შემდეგ ჩართე Cloudflare proxy იმ web ჩანაწერებზე, რომლებზეც თავსებადობა დადასტურდება.
9. Cloudflare cache-ში `/api/*`, `/auth/*` და `/manager-fd/*` არ უნდა დაკეშდეს.
10. `www` უნდა გადავიდეს მთავარ `flexdrive.ge` მისამართზე.

## 20. ეტაპი 13 — OAuth, reCAPTCHA და ბანკის production მისამართები

დომენის მიბმის შემდეგ ყველა გარე მომსახურებაში production მისამართები უნდა დაემატოს.

### Google OAuth

Authorized redirect URI:

```text
https://flexdrive.ge/auth/google/callback
```

საჭიროების შემთხვევაში authorized origin:

```text
https://flexdrive.ge
```

### Facebook OAuth

```text
https://flexdrive.ge/auth/facebook/callback
```

### reCAPTCHA

Allowed domains:

```text
flexdrive.ge
www.flexdrive.ge
```

### ბანკი

ბანკთან უნდა დავადასტუროთ:

- production callback URL;
- success URL;
- failure URL;
- cancel URL;
- webhook secret/signature;
- production merchant ID;
- production API credentials;
- სატესტო და production credential-ების მკაფიო გამიჯვნა.

ბანკის secret frontend-ში არასოდეს უნდა ჩაიწეროს. ის მხოლოდ backend environment variable-ში ინახება.

## 21. ეტაპი 14 — Cloudinary და 10,000 სურათი

ახლა ცალკე სურათების საცავის ყიდვა არ გვჭირდება.

Cloudinary უკვე ინტეგრირებულია:

- backend ატვირთვებისთვის;
- სურათების გარდაქმნისთვის;
- WebP/ოპტიმიზაციისთვის;
- სხვადასხვა ზომის სურათების მიწოდებისთვის;
- CDN-ით სწრაფი ჩვენებისთვის.

10,000 სურათი ავტომატურად არ ნიშნავს, რომ ფასიანი პაკეტი აუცილებლად გვჭირდება. მნიშვნელობა აქვს:

- თითო სურათის ზომას;
- თვეში რამდენჯერ იხსნება;
- რამდენ განსხვავებულ ზომად გარდაიქმნება;
- რამდენ bandwidth-ს ხარჯავს.

გაშვებამდე Cloudinary dashboard-ში უნდა შევამოწმოთ:

- storage usage;
- bandwidth;
- transformations;
- monthly credits;
- მიმდინარე ლიმიტთან მიახლოება.

თუ უფასო პაკეტი საკმარისია, არაფერს ვყიდულობთ.

თუ ლიმიტს მივუახლოვდებით:

1. ჯერ ვამოწმებთ ზედმეტად დიდ ან დუბლირებულ სურათებს;
2. ვამცირებთ არასაჭირო transformations-ს;
3. მხოლოდ შემდეგ განვიხილავთ ფასიან Cloudinary-ს ან DigitalOcean Spaces-ზე გადასვლას.

Cloudinary-ის ფასიან გეგმას წინასწარ არ ვყიდულობთ; საჭიროების შემთხვევაში მოქმედი ტარიფი და რეალური usage თავიდან უნდა შეფასდეს.

Spaces-ზე გადასვლა ცალკე storage/CDN/optimization სამუშაოა; ამ გეგმაში ის არ შედის. პროდუქტის სურათების იზოლაცია სექცია 15-ით უნდა დასრულდეს და არა უბრალოდ საერთო ბმულების კოპირებით.

## 22. ეტაპი 15 — საბოლოო უსაფრთხოების checklist

production გახსნამდე:

- `DJANGO_DEBUG=False`;
- ახალი production `DJANGO_SECRET_KEY`;
- production database-ის ცალკე პაროლი;
- production Redis/Valkey-ის ცალკე პაროლი;
- ყველა secret DigitalOcean-ში Secret ტიპით;
- `.env` GitHub-ში არ არის;
- admin URL HTTPS-ით მუშაობს;
- admin-ის ძლიერი პაროლი, დამატებითი Access/MFA დაცვა და აღდგენის შემოწმებული გზა;
- ორეტაპიანი დაცვა ყველა გარე ანგარიშზე;
- მხოლოდ საჭირო ადამიანებს აქვთ GitHub/DigitalOcean/admin წვდომა;
- staging API key-ები production-ში შეცვლილია, სადაც საჭიროა;
- ბანკის test credentials production-ში არ არის;
- production credentials staging-ში არ არის;
- Cloudflare SSL არის `Full (strict)`;
- Cloudflare cache არ ეხება API/auth/admin მისამართებს;
- database backup არსებობს;
- backup-იდან აღდგენა იზოლირებულ ბაზაზე ერთხელ მაინც შემოწმებულია;
- billing alerts ჩართულია;
- DigitalOcean deployment failure alerts ჩართულია;
- cron failure და last-success freshness alerts ჩართულია;
- supplier draft/ხელით კატეგორია/სურათები refresh-ის შემდეგ შენარჩუნებულია;
- rate limiting სწორ კლიენტის IP-ს ეყრდნობა trusted proxy chain-ის პირობებში;
- უსაფრთხოების გაფრთხილებები და dependency აუდიტის მაღალი პრიორიტეტის საკითხები დახურულია;
- HTTPS/cookie/session/JWT/reCAPTCHA დაცვა შენარჩუნებულია;
- პირადი პასუხები, კალათა, checkout, order lookup და გადახდები shared cache-ში არ ხვდება;
- logs-ში secrets, callback payload-ის პირადი ნაწილი და payment tokens არ იბეჭდება.

Backend-ზე უნდა გაეშვას:

```bash
python manage.py check --deploy
```

მისი warnings უნდა განვიხილოთ და არა უბრალოდ უგულებელვყოთ.

## 23. საჯარო გაყიდვების დაწყების დღე

1. დახურული production უკვე სამუშაო და შევსებულია; staging-ის სრული DB ამ ეტაპზე აღარ აღვადგინოთ.
2. დარჩენილი კონტენტის ცვლილებები შერჩევითად, წინასწარი შედარებით გადავიტანოთ; production-ის რედაქტირებები შევინარჩუნოთ.
3. ავიღოთ production backup, შევინახოთ release commit-ები და დაბრუნების გეგმა. migrations-ის გავლენა/უკან დაბრუნების შესაძლებლობა წინასწარ ვიცოდეთ.
4. supplier draft/manual data დაცვა, გამავალი IP და ბოლო წარმატებული refresh დადასტურდეს.
5. ბანკის callback, reconciliation, alerts, refund/cancel და კურიერის საჭირო სტატუსები შემოწმებული იყოს. ტესტი მხოლოდ ბანკის ნებადართული მეთოდით/თანხით, წინასწარ განსაზღვრული გაუქმებით; თვითნებური რეალური ოპერაცია არა.
6. customer auth/cart/guest checkout/order lookup/admin, ელფოსტა, media upload და mobile/desktop smoke შემოწმდეს.
7. წარმადობის გაზომვით არჩეული რესურსი დადასტურდეს; OOM, მუდმივი timeout ან connection exhaustion არ დარჩეს.
8. შევასრულოთ სექცია 22-ის უსაფრთხოების checklist; callback/health/scheduler გამონაკლისები ზუსტად იყოს შეზღუდული.
9. მოვხსნათ მხოლოდ storefront-ის დახურული წვდომა. `/manager-fd/` რჩება დაცული. პირდაპირი origin-ის გვერდის ავლის დაცვა საჯარო storefront-ზეც შენარჩუნდეს შესაბამისი წესით.
10. `NUXT_PUBLIC_ALLOW_INDEXING=true`, frontend deployment, canonical/robots/sitemap/social metadata გადამოწმება. Cache პირად/API პასუხებს არ მოიცავს.
11. მოკლე საბოლოო smoke და პირველი რეალური შეკვეთების მონიტორინგი. თუ checkout/payment საიმედოდ არ მუშაობს, გაყიდვები არ გაიხსნას ან კონტროლირებულად შეჩერდეს.

### უკან დაბრუნება

კოდის წინა release-ზე დაბრუნება DB migration-ს ავტომატურად არ აბრუნებს. პირველ რიგში განვსაზღვროთ თავსებადობა; საჭიროებისას forward fix ან შეთანხმებული maintenance. რეალური შეკვეთების შემდეგ ძველ backup-ზე სრული დაბრუნება ახალ შეკვეთებს/გადახდებს დაკარგავს და ჩვეულებრივი rollback არ არის. ავარიის აღდგენა ცალკე reconcile გეგმას საჭიროებს.

## 24. პირველი 7 დღე production-ზე

ყოველდღე შეამოწმე:

- DigitalOcean app status;
- backend errors;
- frontend errors;
- supplier import job და Proxy-ის მუშაობა/ბოლო წარმატების ასაკი;
- bank reconciliation და paid/no-order გაფრთხილებები;
- EasyWay სტატუსები და ოპერატორის შეტყობინებები;
- daily cleanup job;
- PostgreSQL CPU, RAM და disk;
- Valkey memory;
- Cloudinary usage;
- Brevo delivered/bounced/spam სტატისტიკა;
- რეალური შეკვეთების სტატუსები;
- გადახდის callback-ები;
- stock ცვლილებები;
- Cloudflare security events;
- კომპანიის support და return ელფოსტები.

პირველ კვირაში autodeploy შეიძლება გამორთული დარჩეს. ცვლილება production-ზე მხოლოდ build/test-ის შემდეგ უნდა აიტვირთოს.

## 25. რესურსების საკმარისობის დადასტურება და ზრდა

დახურულ production-ზე ცალკე შევამოწმოთ RAM/CPU, restart/OOM, API-ის p95 პასუხის დრო და შეცდომები, DB connections/slow queries, Valkey memory/evictions, Job duration და Proxy-ის მდგომარეობა. build-ის დრო runtime-ის მომხმარებლის გამოცდილებას არ უდრის.

მცირე, ეტაპობრივი დატვირთვა: homepage/catalog/search/filter/detail, ავტორიზებული და guest flow, კონტროლირებული checkout; ამავე დროს bulk import და ადმინში სურათის დამუშავება. ბანკს/კურიერს load test-ის რეალური ოპერაციები არ გავუგზავნოთ. ჩავწეროთ გაზომილი დატვირთვა და შედეგი, მხოლოდ „არ გაჭედა“ არ კმარა.

- Frontend 512 MiB → 1 GiB: $5-დან $10-მდე, თუ პიკური RAM/restart/latency მიუთითებს ნაკლებობაზე.
- Backend 1 GiB → 2 GiB: $10-დან $25-მდე, თუ მეხსიერება არ ჰყოფნის; ნელი query/cache პრობლემა მხოლოდ RAM-ით არ მოგვარდება.
- PostgreSQL 1 GiB → 2 GiB/30 GiB storage: $30.45 მიმდინარე ტარიფით; ჯერ query/index/connection limits შევამოწმოთ.
- Supplier Job-ის ზომა ცალკე შეიცვალოს რეალური peak RAM/duration-ის მიხედვით.
- Proxy-ს ვზრდით მხოლოდ გაზომილი საჭიროებით; მასზე კატალოგის დამუშავება არ გადაგვაქვს.
- Valkey eviction-მა rate limiting არ უნდა გააუფასუროს; ლიმიტს მიახლოებისას კონფიგურაცია/ზომა განვიხილოთ.
- Brevo/Cloudinary უფასო ლიმიტებს dashboard-ით ვაკვირდებით. ფასიანი გეგმები მხოლოდ საჭიროებისას.

RAM-ის მუდმივი 80–90%, OOM/restarts ან DB კავშირების ამოწურვა შესასწავლი სიგნალია; ერთი მომხმარებლის ტესტი საჯარო ტრაფიკის გარანტია არ არის. საწყის პაკეტში თითო app-ის ერთი instance და ბაზის ერთი node გვაქვს, ამიტომ სრული HA არ არის.

## 26. staging-ის ბედი production-ის შემდეგ

Production-ის გახსნისთანავე Render და Vercel staging არ წაშალო.

პირველი 1–2 თვე:

- staging დატოვე ტესტებისთვის;
- production ცვლილება ჯერ staging-ზე შეამოწმე;
- staging-ს ჰქონდეს ცალკე database, Redis/cache და OAuth/reCAPTCHA პარამეტრები;
- staging-ზე საძიებო ინდექსაცია გამორთული იყოს;
- staging-ს ჰქონდეს დამოუკიდებელი Cloudinary asset ID-ები; production-ში ცვლილებები სრული staging restore-ით არ გადაიწეროს;
- staging-იდან რეალური მომხმარებლისთვის წერილები არ უნდა წავიდეს.

როდესაც DigitalOcean production სტაბილური იქნება, გადავწყვეტთ:

- staging დარჩეს Render/Vercel-ზე;
- staging-იც გადავიტანოთ DigitalOcean-ზე;
- ან უფრო იაფ staging რეჟიმზე გადავიყვანოთ.

## 27. რაში ვიხდით ახლა და რას ვდებთ

შექმნის რიგი: PostgreSQL → Valkey → დაცული backend/frontend → Proxy Droplet, როცა მომწოდებლის IP-ის რეგისტრაციას ვიწყებთ → აუცილებელი Job-ები კოდის მზადყოფნის შემდეგ.

| ნაწილი | ახლა |
|---|---|
| PostgreSQL $15.15 | გეგმაში რჩება; მომზადების შემდეგ პირველი ფასიანი შექმნა |
| Valkey $15 | deployment-ისთვის საჭიროა, production validation-ს არ ვთიშავთ |
| Frontend $5 / Backend $10 | ეკონომიური დახურული deployment, ზომა გასაზომია |
| Proxy Droplet $4 | supplier integration-ის გამართვისას |
| Dedicated Egress $25 | არ ვყიდულობთ, არჩეულია proxy/VPC გზა |
| Cloudinary/Brevo | უფასო ლიმიტის გადამოწმებით ვტოვებთ |
| ბანკის/კურიერის ავტომატიზაცია | კოდი დახურულ პერიოდში სრულდება; რეალურ ოპერაციამდე შემოწმება |
| Spaces, Cloudinary Plus, Cloudflare Pro, Kubernetes, ცალკე Load Balancer | საწყისად არ ვყიდულობთ |
| ცალკე მუდმივი worker | მხოლოდ დადასტურებული საჭიროების შემთხვევაში |

დაცვა, backup, alerts და isolation მხოლოდ ეკონომიის მიზნით არ გადავდოთ. დომენი/კომპანიის ელფოსტა და არსებული staging რჩება; მათი მიმდინარე ტარიფები ცალკეა.

## 28. ბიუჯეტი და გამოყენებაზე დამოკიდებული ხარჯები

ფიქსირებული საწყისი კონფიგურაცია სექცია 2-ით **$49.15/თვეა**, proxy-ის შექმნამდე — **$45.15**. 2–3 კვირის სრული კონფიგურაციის მომზადების საორიენტაციო ხარჯია დაახლოებით $25–37; დარიცხვა რესურსის შექმნიდან, პროვაიდერის პროპორციული დროის/მინიმუმების წესებით. დახურული საიტი უფასო არ არის.

Job-ის ცალკე რესურსი მუშაობის დროზე ითვლება. ეს მაგალითი ეფუძნება 30 დღეს, ყველა Job-ზე 2 GiB ტარიფს და **ვარაუდით** შერჩეულ გაშვების დროს; გაზომილი შედეგი ან ინვოისის გარანტია არ არის:

| დავალება | გაშვებები | თითო გაშვება დაწყების ჩათვლით | სამუშაო საათები/თვე | საორიენტაციო ხარჯი |
|---|---:|---:|---:|---:|
| Supplier ყოველ 2 საათში | 360 | 5 წუთი | 30 | დაახლოებით $1.12 |
| ბანკი ყოველ 15 წუთში | 2,880 | 1 წუთი | 48 | დაახლოებით $1.79 |
| კურიერი ყოველ 15 წუთში | 2,880 | 1 წუთი | 48 | დაახლოებით $1.79 |
| ყოველდღიური cleanup | 30 | 1 წუთი | 0.5 | რამდენიმე ცენტი |

ფორმულა: billed runtime × instance rate, მინიმუმებისა და დამრგვალების გათვალისწინებით. $25-იანი ზომის მიახლოებითი საათობრივი ეკვივალენტია $25 / 672. პროცესის startup და retry-ებიც დროში შედის. 31-დღიან თვეში გაშვებების რაოდენობა მეტია.

ამ მაგალითში ჯამი დაახლოებით **$53.85/თვე** გამოდის. საწყისი საბიუჯეტო სამიზნე $55–60 შეიძლება იყოს, მაგრამ ზღვარი/გარანტია არაა. უფასო HTTP scheduler-ის არჩევისას ბანკის/კურიერის ცალკე Job charge აღარ იქნება, თუმცა ბექის დატვირთვა და ამ გზის გამართვა რჩება.

### სხვა შესაძლო ხარჯები

- საწყისი frontend/backend გეგმის allowance ჯამში 150 GiB/თვეა; დამატებითი App outbound $0.02/GiB. allowance team-ზე ერთიანდება. Job-ის შესაძლო დამატებით allowance-ს წინასწარ არ ვითვლით.
- Proxy-ს საკუთარ $4 პაკეტში 500 GiB transfer აქვს; Droplet-ის და App-ის ტრაფიკის აღრიცხვა სხვადასხვა პროდუქტია. Supplier API-ის JSON პასუხი inbound-ია, მაგრამ ქსელური გზის სხვა მონაკვეთები/გარე პასუხები dashboard-ში უნდა შემოწმდეს.
- Cloudinary-ის storage, transformations და delivery საერთო credit ლიმიტს მოიხმარს; staging/production საერთო ანგარიშზე ერთად ითვლება. თავისუფალი ადგილი ჯერ გაზომილი არაა.
- Brevo უფასო 300 წერილი/დღე, account-ის სხვა გაგზავნებიც ამ ლიმიტს იყოფს.
- PostgreSQL storage autoscaling, დიდი instance, დამატებითი replica, restore-ის დროებითი ბაზა, paid backup/snapshot ან მიუმაგრებელი Reserved IP დამატებით ხარჯს გამოიწვევს.
- ბანკის/კურიერის საკომისიოები, დომენის განახლება, კომპანიის ელფოსტა, გადასახადები/კონვერტაცია ამ ჯამში არ შედის.
- Billing alert გაფრთხილებაა და არა ხარჯის hard cap.

## 29. კოდით დადასტურებული საფუძველი და დარჩენილი deployment ცვლილებები

2026-09-20-ის დათვალიერება:

- Frontend `package.json`, `nuxt.config.ts`, `server/routes/api/[...path].ts`, OAuth routes — Nuxt 4 SSR და Node runtime.
- Backend `requirements.txt`: Django 6.0.8; `start.sh`: Uvicorn; WhiteNoise static და Cloudinary media.
- `config/settings.py`: production Redis validation, ცალკე throttling cache, DB/TLS/auth პარამეტრები, COD გამორთვის flag, BOG/EasyWay პარამეტრები.
- `catalog/background_removal.py`: მოდელი საჭიროებისას იტვირთება; `build.sh` წინასწარ ტვირთავს მოდელს, აკეთებს collectstatic-სა და migrate-ს.
- `catalog/crossmotors_import.py`: bulk import, supplier holds და უპირობო publication-ის გასასწორებელი ნაწილი.
- `catalog/signals.py`, `common/storage_backends.py`: product image delete რეალურ ფაილს შლის, upload overwrite-ით მუშაობს; გარემოების media isolation ჯერ უნდა განხორციელდეს.
- `commerce/bog_callbacks.py`: `reconcile_bog_payment`; `commerce/easyway.py`/`easyway_shipments.py`: არსებული courier create/cancel, არა პერიოდული delivery tracking.
- `commerce/management/commands/run_daily_cleanup.py` და `common/management/commands/process_outbound_tasks.py`: არსებული დამხმარე ბრძანებები.

განსაკუთრებით შესასრულებელია: origin-ზე დახურული წვდომა, media namespace/copy, Supplier-only proxy ინტეგრაცია, importer-ის draft/manual-field დაცვა, bank/courier scheduler და notifications, migrations-ის deployment განაწილება. ეს დოკუმენტური განახლება ამ კოდს არ ახორციელებს.

## 30. ოფიციალური წყაროები და თარიღი

ძირითადი ფასები/ქსელი/Scheduled Jobs გადამოწმებულია 2026-09-20-ზე. გადახდამდე dashboard-ის საბოლოო ზომა/რეგიონი/ფასი და ლიმიტები ხელახლა მოწმდება.

- [App Platform ფასები, billing, bandwidth](https://docs.digitalocean.com/products/app-platform/details/pricing/)
- [Managed PostgreSQL და Valkey ფასები](https://www.digitalocean.com/pricing/managed-databases)
- [Droplet ფასები](https://www.digitalocean.com/pricing/droplets)
- [App Platform VPC და შესაბამისი datacenter](https://docs.digitalocean.com/products/app-platform/how-to/enable-vpc/)
- [Dedicated Egress და მისი შეზღუდვები](https://docs.digitalocean.com/products/app-platform/how-to/add-ip-address/)
- [Reserved IP ფასები](https://docs.digitalocean.com/products/networking/reserved-ips/details/pricing/)
- [Reserved IP-ით გამავალი ტრაფიკის კონფიგურაცია](https://docs.digitalocean.com/products/networking/reserved-ips/how-to/outbound-traffic/)
- [Scheduled Jobs: დრო, გაშვება, მინიმუმ 15 წუთი](https://docs.digitalocean.com/products/app-platform/how-to/manage-jobs/)
- [PostgreSQL backup-იდან აღდგენა](https://docs.digitalocean.com/products/databases/postgresql/how-to/restore-from-backups/)
- [უფასო HTTP scheduler-ის კანდიდატი](https://cron-job.org/en/)
- [Cloudflare Access web apps](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/)
- [Cloudflare Access JWT-ის origin-ზე შემოწმება](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
- [Brevo Free ლიმიტები](https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan)
- [Brevo domain authentication](https://help.brevo.com/hc/en-us/articles/12163873383186-Authenticate-your-domain-with-Brevo-Brevo-code-DKIM-DMARC)
- [Cloudinary Free production გამოყენება](https://cloudinary.com/documentation/developer_onboarding_faq_free_plan)
- [Cloudinary credits](https://cloudinary.com/documentation/cloudinary_glossary#credits)
- [Nuxt deployment](https://nuxt.com/docs/4.x/getting-started/deployment)

## 31. ახლა რა გავაკეთოთ — შემდეგი ერთი ნაბიჯი

ჯერ $15.15-იანი ბაზის Create-ს არ ვაჭერთ. ბაზა საჭირო რჩება; ვქმნით მაშინ, როცა იმავე დღეს მის გამართვას/restore-ს ვიწყებთ.

შემდეგი სამუშაოა **დახურული deployment-ის მომზადება**: არსებული DNS/MX ჩანაწერების ინვენტარი, origin-ზე დაცული წვდომის გადაწყვეტა, production-only პარამეტრების სახელები, source მონაცემებისა და media-ს გადატანის გეგმა. რეალური secrets ამ დოკუმენტში არ იწერება.

ამ მომზადების შემდეგ მომხმარებელს ვაჩვენებთ ერთ კონკრეტულ ეკრანს/არჩევანს და ვიწყებთ PostgreSQL-ის შექმნას სექცია 12-ით. არ ვთხოვთ ერთდროულად ყველა სერვისის ყიდვას. დანარჩენ ნაბიჯებს სექცია 6-ის რიგით მივყვებით.

შემდგომი checkpoint-ები ამავე დოკუმენტში ჩაიწეროს შესრულების თარიღით და შედეგით; დაგეგმილი სამუშაო შესრულებულად არ მოინიშნოს. რეალური public launch ცალკე ეტაპია და დახურული deployment მის ნებართვას არ ნიშნავს.
