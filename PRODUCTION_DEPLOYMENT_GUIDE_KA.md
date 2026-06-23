# FlexDrive-ის production-ზე გაშვების გზამკვლევი

განახლებულია: 2026-06-20

ეს დოკუმენტი განკუთვნილია ადამიანისთვის, რომელსაც პროექტი ჯერ არასოდეს აუტვირთავს production-ზე. ნაბიჯები დალაგებულია იმ თანმიმდევრობით, რომლითაც რეალურად უნდა შესრულდეს სამუშაო.

## 1. მოკლე პასუხი — რა გვჭირდება

FlexDrive-ის სრულად სამუშაო production ვერსიას სჭირდება:

1. Frontend-ის მუდმივად გაშვებული სერვისი — Nuxt აპლიკაცია.
2. Backend-ის მუდმივად გაშვებული სერვისი — Django API და ადმინ-პანელი.
3. PostgreSQL მონაცემთა ბაზა — პროდუქტები, მომხმარებლები, შეკვეთები, გვერდების კონტენტი და სხვა მონაცემები.
4. Redis-თან თავსებადი cache — DigitalOcean-ზე ამას Valkey ეწოდება.
5. სურათების საცავი და სწრაფი მიწოდება — ამ ეტაპზე ვტოვებთ Cloudinary-ს.
6. ავტომატური დავალებები:
   - მომწოდებლის API-დან პროდუქტების განახლება;
   - ძველი კალათების, ვადაგასული ავტორიზაციის ჩანაწერებისა და მარაგის დროებითი რეზერვაციების გასუფთავება.
7. ტრანზაქციული ელფოსტა — ვტოვებთ Brevo-ს.
8. დომენი და DNS მართვა — `flexdrive.ge` და Cloudflare.
9. backup-ები — განსაკუთრებით მონაცემთა ბაზისთვის.
10. მონიტორინგი და შეტყობინებები — თუ საიტი ან ავტომატური დავალება გაფუჭდა, ეს დროულად უნდა შევამჩნიოთ.

საწყის ეტაპზე არ გვჭირდება:

- DigitalOcean Spaces, რადგან სურათებს უკვე Cloudinary ინახავს;
- ცალკე მუდმივი cron სერვერი;
- Cloudflare-ის ფასიანი პაკეტი;
- Brevo-ს ფასიანი პაკეტი, სანამ დღიური 300 წერილი საკმარისია;
- Kubernetes, Load Balancer ან რამდენიმე სერვერის რთული სისტემა.

## 2. ჩემი საბოლოო რეკომენდაცია

პირველი production გაშვებისთვის გამოიყენე DigitalOcean App Platform და არა Droplet.

რეკომენდებული საწყისი შემადგენლობა:

| ნაწილი | რეკომენდებული ზომა | სავარაუდო ფასი თვეში |
|---|---:|---:|
| Frontend — Nuxt | 1 vCPU, 1 GB RAM | $10 |
| Backend — Django | 1 vCPU, 2 GB RAM | $25 |
| Managed PostgreSQL | 1 vCPU, 1 GB RAM | $15.15 |
| Managed Valkey/Redis | 1 vCPU, 1 GB RAM | $15 |
| დაგეგმილი დავალებები | იხდება მხოლოდ მუშაობის პერიოდში | დაახლოებით $0–2 |
| Cloudflare Free | უფასო | $0 |
| Cloudinary Free | საწყის ეტაპზე უფასო | $0 |
| Brevo Free | დღეში მაქსიმუმ 300 წერილი | $0 |
| ელფოსტის ჰოსტინგი | უკვე შეძენილია | უკვე გადახდილი |

სავარაუდო ჯამი: დაახლოებით **$65–67 თვეში**, გადასახადებისა და შესაძლო ზედმეტი მოხმარების გარეშე.

ეს ჯდება შენს `$50–70` ბიუჯეტში და backend-ს აძლევს 2 GB მეხსიერებას, რაც ონლაინ მაღაზიისთვის უფრო გონივრული დასაწყისია.

უფრო იაფი საწყისი ვარიანტიც არსებობს:

- Frontend — $10;
- Backend — $12;
- PostgreSQL — $15.15;
- Valkey — $15;
- ჯამი — დაახლოებით $52–54.

ეს ვარიანტი შეიძლება იმუშაოს დღეში 5–10 შეკვეთის პირობებში, მაგრამ backend-ს მხოლოდ 1 GB მეხსიერება ექნება. ჩემი არჩევანი მაინც $25-იანი, 2 GB backend-ია, რადგან პროდუქტის იმპორტი, Django admin და API ერთსა და იმავე სერვისზე იმუშავებს.

## 3. რას ნიშნავს App Platform და Droplet

### App Platform

App Platform არის მომსახურება, სადაც DigitalOcean თვითონ აკეთებს სერვერის ტექნიკური მოვლის დიდ ნაწილს.

ჩვენ ვუთითებთ:

- სად არის GitHub repository;
- როგორ აშენდეს პროექტი;
- როგორ გაეშვას;
- რომელი საიდუმლო პარამეტრები სჭირდება.

DigitalOcean აკეთებს:

- სისტემის განახლებების დიდ ნაწილს;
- HTTPS სერტიფიკატის დაყენებას;
- GitHub-იდან ახალი ვერსიის ატვირთვას;
- აპის ხელახლა გაშვებას;
- ლოგების ჩვენებას;
- ძველ ვერსიაზე დაბრუნების გამარტივებას;
- დაგეგმილი დავალებების გაშვებას.

შენთვის ეს გაცილებით მარტივი და უსაფრთხოა.

### Droplet

Droplet არის ინტერნეტში დაქირავებული ცარიელი Linux კომპიუტერი.

მაგალითად:

- 2 GB RAM Droplet — $12 თვეში;
- 4 GB RAM Droplet — $24 თვეში;
- 8 GB RAM Droplet — $48 თვეში.

Droplet-ის შემთხვევაში ჩვენ თვითონ მოგვიწევს:

- Linux-ის მართვა;
- firewall-ის დაყენება;
- Nginx-ის დაყენება;
- Node-ისა და Python-ის დაყენება;
- PostgreSQL-ისა და Redis-ის დაყენება ან ცალკე ყიდვა;
- HTTPS სერტიფიკატების მართვა;
- backup-ების მოწყობა;
- უსაფრთხოების განახლებები;
- სერვისების ავტომატურად გადატვირთვა;
- სერვერის გატეხვისა და დაზიანების რისკის მართვა;
- ავარიის შემდეგ აღდგენა.

Droplet იაფად ჩანს, რადგან 4 GB სერვერი $24 ღირს და მასზე შეიძლება ყველაფერი ერთად მოვათავსოთ. მაგრამ ამ შემთხვევაში ერთი სერვერის დაზიანება frontend-ს, backend-ს, მონაცემთა ბაზასა და Redis-ს ერთდროულად გააჩერებს. მისი სწორად მართვა მუდმივ ტექნიკურ ყურადღებას მოითხოვს.

ამიტომ FlexDrive-ის პირველი production გაშვებისთვის **App Platform + Managed Database + Managed Valkey** არის სწორი არჩევანი.

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

## 6. სამუშაოს სწორი თანმიმდევრობა

არ უნდა ვიყიდოთ ყველა სერვისი და იმავე დღეს პირდაპირ მთავარ დომენზე გადავრთოთ.

სწორი თანმიმდევრობაა:

1. ონლაინ გადახდის ინტეგრაციის დასრულება.
2. production-მდე დარჩენილი კოდის ცვლილებების დასრულება.
3. production checklist-ის კოდში გავლა.
4. Cloudflare-ის მომზადება ისე, რომ არსებული ელფოსტა არ გაფუჭდეს.
5. Brevo-ში დომენის დადასტურება.
6. DigitalOcean ანგარიშის შექმნა და ხარჯვის გაფრთხილების დაყენება.
7. PostgreSQL და Valkey-ის შექმნა.
8. Backend-ის საცდელად ატვირთვა DigitalOcean-ის დროებით მისამართზე.
9. Staging მონაცემების production მონაცემთა ბაზაში გადატანა.
10. ავტომატური დავალებების დამატება.
11. Frontend-ის ატვირთვა DigitalOcean-ის დროებით მისამართზე.
12. სრული production შემოწმება დროებით მისამართებზე.
13. `flexdrive.ge` დომენის მიბმა.
14. ბოლო smoke test.
15. საძიებო სისტემებისთვის ინდექსაციის ჩართვა.
16. საიტის ოფიციალურად გახსნა.

## 7. ეტაპი 0 — production-მდე კოდის დასრულება

ჰოსტინგის ყიდვამდე ან პარალელურად უნდა დასრულდეს:

- ონლაინ გადახდის ინტეგრაცია;
- ბანკის callback/webhook მისამართები;
- წარმატებული, წარუმატებელი და გაუქმებული გადახდის სცენარები;
- თანხის დაბრუნების პროცესი;
- მარაგის რეზერვაციისა და გადახდის ურთიერთქმედება;
- `noreply@flexdrive.ge` ავტომატური გამგზავნის დაყენება;
- წერილების ტექსტში `support@flexdrive.ge` დახმარების მისამართის მითითება;
- production დომენების დამატება Google OAuth-ში;
- production დომენების დამატება Facebook OAuth-ში, თუ Facebook ავტორიზაცია ჩართული იქნება;
- production დომენის დამატება reCAPTCHA-ში;
- Google Tag Manager/Analytics-ის production შემოწმება;
- Meta Pixel/CAPI-ის production პარამეტრების შემოწმება;
- იურიდიული გვერდების საბოლოო ტექსტები;
- კომპანიის ტელეფონის, მისამართისა და ელფოსტების შემოწმება;
- სატესტო ტექსტებისა და ძველი AutoMate მონაცემების ძებნა;
- admin მომხმარებლების შემოწმება;
- ყველა migration-ის არსებობის შემოწმება;
- frontend build;
- backend tests და Django deploy check.

production-ისთვის საბოლოო კოდის ვერსია ცალკე Git commit-ით უნდა დაფიქსირდეს. ამის შემდეგ ზუსტად გვეცოდინება, რომელი ვერსია ავტვირთეთ.

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

ყველა მნიშვნელოვან ანგარიშზე ჩართე ორნაბიჯიანი დაცვა — პაროლთან ერთად ტელეფონის ან authenticator-ის კოდი.

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

საიტის ჩანაწერებზე თავდაპირველად გამოიყენე `DNS only`, სანამ DigitalOcean დომენს და HTTPS-ს დაადასტურებს. შემდეგ შეგვიძლია Cloudflare proxy ჩავრთოთ.

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

## 11. ეტაპი 4 — DigitalOcean ანგარიშის შექმნა

DigitalOcean-ზე ჯერ ანგარიში შექმენი, მაგრამ რესურსები მხოლოდ მაშინ ჩართე, როცა production-ის საცდელი ატვირთვისთვის მზად ვიქნებით.

ნაბიჯები:

1. შედი DigitalOcean-ზე.
2. შექმენი ანგარიში კომპანიის ან მუდმივად ხელმისაწვდომი ელფოსტით.
3. დაამატე საბანკო ბარათი.
4. ჩართე ორნაბიჯიანი დაცვა.
5. Billing განყოფილებაში ჩართე ხარჯვის გაფრთხილებები:
   - პირველი გაფრთხილება: $70;
   - მეორე გაფრთხილება: $90;
   - მესამე გაფრთხილება: $120.
6. შექმენი project სახელით `FlexDrive Production`.
7. აირჩიე ევროპული რეგიონი. საქართველოსთვის პრაქტიკული არჩევანია Frankfurt ან Amsterdam.
8. ყველა production რესურსი ერთ რეგიონში განათავსე, რათა backend-ს, database-სა და Redis-ს შორის კავშირი სწრაფი იყოს.

არ აურიო staging და production პარამეტრები.

## 12. ეტაპი 5 — Managed PostgreSQL-ის შექმნა

PostgreSQL ინახავს:

- პროდუქტებს;
- კატეგორიებს;
- ბრენდებს;
- თავსებადობას;
- ფასებსა და მარაგს;
- გვერდების კომპონენტებსა და კონტენტს;
- მომხმარებლებს;
- შეკვეთებს;
- გადახდების ჩანაწერებს;
- კალათებსა და სურვილების სიას.

მისი დაკარგვა ბიზნესის მონაცემების დაკარგვას ნიშნავს.

### რეკომენდებული არჩევანი

- DigitalOcean Managed PostgreSQL;
- Basic;
- 1 GB RAM / 1 vCPU;
- დაახლოებით $15.15 თვეში;
- იგივე რეგიონი, სადაც backend იქნება.

DigitalOcean Managed PostgreSQL-ს აქვს ყოველდღიური backup და ბოლო შვიდი დღის შიგნით კონკრეტულ დროზე აღდგენის შესაძლებლობა.

ეს 2,000 პროდუქტისთვის და დღეში 5–10 შეკვეთისთვის საწყის ეტაპზე საკმარისია.

არ გამოიყენო App Platform-ის $7-იანი development database production მაღაზიისთვის. ის არ არის production დონის backup-ებით დაცული და აპის წაშლასთან ერთად შეიძლება მონაცემებიც დაიკარგოს.

შექმნის შემდეგ:

- connection string შეინახე DigitalOcean-ის საიდუმლო environment variable-ში;
- GitHub-ში ან დოკუმენტში არ ჩაწერო;
- გარე წვდომა შეზღუდე მხოლოდ საჭირო მისამართებზე;
- backend-იდან გამოიყენე private connection, თუ DigitalOcean ამას იმავე რეგიონში გაძლევს.

Backend-ში ეს იქნება:

```env
DATABASE_URL=postgresql://...
```

რეალური მნიშვნელობა ამ ფაილში არ უნდა ჩაიწეროს.

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

ზუსტი URL DigitalOcean-ის dashboard-იდან უნდა ავიღოთ.

## 14. ეტაპი 7 — Backend-ის App Platform-ზე ატვირთვა

Backend არის Django API და admin panel.

### App-ის შექმნა

1. DigitalOcean-ში გახსენი App Platform.
2. აირჩიე Create App.
3. დააკავშირე GitHub.
4. მიეცი წვდომა მხოლოდ საჭირო backend repository-ზე.
5. აირჩიე production branch.
6. Environment უნდა იყოს Python.
7. Build command:

```bash
bash build.sh
```

8. Run command:

```bash
bash start.sh
```

9. თავდაპირველად აირჩიე 1 vCPU / 2 GB RAM — დაახლოებით $25.
10. Autodeploy თავიდან შეიძლება გამორთული იყოს, სანამ production პროცესი ბოლომდე არ დალაგდება.

არსებული `build.sh` აკეთებს:

- Python პაკეტების დაყენებას;
- static ფაილების მომზადებას;
- database migration-ების გაშვებას.

არსებული `start.sh` უშვებს Django ASGI აპლიკაციას Uvicorn-ით.

### Backend-ის აუცილებელი environment variables

ქვემოთ მოცემული სია სახელების checklist-ია. რეალური საიდუმლო მნიშვნელობები მხოლოდ DigitalOcean-ში შეიყვანე.

```env
APP_ENV=production
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<ახალი-გრძელი-production-secret>

DJANGO_ALLOWED_HOSTS=<backend-domain>
FRONTEND_BASE_URL=https://flexdrive.ge
CORS_ALLOWED_ORIGINS=https://flexdrive.ge,https://www.flexdrive.ge
CSRF_TRUSTED_ORIGINS=https://flexdrive.ge,https://www.flexdrive.ge

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

`META_CAPI_ENABLED` მხოლოდ სრულად შემოწმების შემდეგ უნდა გახდეს `True`.

თუ Google Sheets-ის იმპორტი production-შიც გამოიყენება, დამატებით დაგვჭირდება:

```env
GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON=<secret-json>
GOOGLE_SHEETS_SPREADSHEET_ID=<id>
GOOGLE_SHEETS_SHEET_NAME=<name>
GOOGLE_SHEETS_CELL_RANGE=<range>
```

## 15. ეტაპი 8 — Staging მონაცემების production-ში გადატანა

შენი მოთხოვნაა, staging-ზე არსებული პროდუქტები და საიტის ძირითადი CMS კონტენტი production-ში გადავიტანოთ.

ეს სწორი გადაწყვეტილებაა, რადგან ხელით თავიდან შესაქმნელი იქნებოდა:

- პროდუქტები;
- კატეგორიები;
- ბრენდები;
- თავსებადობის მონაცემები;
- homepage კომპონენტები;
- იურიდიული და საინფორმაციო გვერდები;
- footer და სხვა CMS მონაცემები.

### რეკომენდებული მეთოდი

Staging PostgreSQL-ის სრული ასლი გადავიტანოთ production PostgreSQL-ში, შემდეგ კი production-მდე გავასუფთაოთ მხოლოდ სატესტო მონაცემები.

ამ გზით ურთიერთდაკავშირებული CMS და catalog მონაცემები არ დაიკარგება.

### უსაფრთხო თანმიმდევრობა

1. staging-ზე დროებით შევაჩეროთ ხელით ცვლილებები.
2. შევქმნათ staging მონაცემთა ბაზის სრული backup.
3. backup ცალკე უსაფრთხო ადგილას შევინახოთ.
4. production database ჯერ ცარიელი უნდა იყოს.
5. backup აღვადგინოთ DigitalOcean PostgreSQL-ში.
6. გავუშვათ ყველა ახალი migration.
7. შევამოწმოთ ჩანაწერების რაოდენობა:
   - პროდუქტები;
   - კატეგორიები;
   - ბრენდები;
   - CMS გვერდები;
   - კომპონენტები;
   - სურათების ჩანაწერები.
8. წავშალოთ ან გავაუქმოთ მხოლოდ დადასტურებული სატესტო მონაცემები:
   - სატესტო შეკვეთები;
   - სატესტო გადახდები;
   - სატესტო კალათები;
   - სატესტო მომხმარებლები;
   - ძველი access/refresh token-ები;
   - სატესტო contact შეტყობინებები;
   - staging-ის administrator-ები, რომლებიც production-ში არ გვჭირდება.
9. შევქმნათ ახალი production superuser ან შევცვალოთ არსებული admin-ის პაროლი.
10. მონაცემთა გაწმენდის შემდეგ შევქმნათ production-ის პირველი backup.

ეს პროცესი სიფრთხილით უნდა გაკეთდეს. მონაცემთა წაშლის ბრძანებები წინასწარ უნდა გადავამოწმოთ და პირდაპირ production-ზე ექსპერიმენტი არ ჩავატაროთ.

### სურათები

Cloudinary-ის ფაილები მონაცემთა ბაზის backup-ში არ ინახება. ბაზაში ინახება მათი მისამართები/სახელები, ხოლო რეალური ფაილები Cloudinary-ზე რჩება.

თუ production იგივე Cloudinary ანგარიშს გამოიყენებს, staging-ის სურათები migration-ის შემდეგაც გამოჩნდება.

პირველ ეტაპზე იგივე Cloudinary ანგარიშის გამოყენება დასაშვებია. მოგვიანებით შეგვიძლია staging და production ფოლდერებად ან ანგარიშებად უფრო მკაფიოდ გავყოთ.

## 16. ეტაპი 9 — ავტომატური დავალებების დამატება

DigitalOcean App Platform-ზე cron job ცალკე მუდმივ სერვერს არ მოითხოვს. თანხა იხდება მხოლოდ იმ დროისთვის, როცა დავალება მუშაობს.

### 16.1 მომწოდებლის პროდუქტის სინქრონიზაცია

Backend-ში უკვე არსებობს ბრძანება:

```bash
python manage.py import_crossmotors_products --commit
```

პირველ ეტაპზე რეკომენდებული სიხშირე:

```cron
5 * * * *
```

ეს ნიშნავს ყოველ საათში ერთხელ, საათის მეხუთე წუთზე.

Time zone:

```text
Asia/Tbilisi
```

თავდაპირველად `--archive-missing` არ დავამატოთ. თუ მომწოდებლის API დროებით არასრულ პასუხს დააბრუნებს, ამ პარამეტრმა შეიძლება პროდუქტები შეცდომით დააარქივოს.

ჯერ რამდენიმე კვირა დავაკვირდეთ სინქრონიზაციის ლოგებს. შემდეგ გადავწყვეტთ, უსაფრთხოა თუ არა:

```bash
python manage.py import_crossmotors_products --commit --archive-missing
```

### 16.2 ყოველდღიური გასუფთავება

Backend-ში უკვე არსებობს:

```bash
python manage.py run_daily_cleanup
```

რეკომენდებული schedule:

```cron
30 3 * * *
```

ეს ნიშნავს ყოველდღე 03:30-ზე, თბილისის დროით.

ბრძანება ასუფთავებს:

- ძველ კალათებს;
- ვადაგასულ JWT token-ებს;
- ვადაგასულ მარაგის რეზერვაციებს.

### 16.3 დავალებების კონტროლი

ყოველი job-ისთვის:

- ჩართე failure alert;
- პირველი კვირის განმავლობაში ყოველდღე შეამოწმე logs;
- მომწოდებლის სინქრონიზაციის შედეგში შეამოწმე created/updated/error რაოდენობები;
- შეცდომის დროს ავტომატურად არ გაუშვა მონაცემების წაშლის რეჟიმი.

## 17. ეტაპი 10 — Frontend-ის App Platform-ზე ატვირთვა

Frontend არის Nuxt 4 SSR აპლიკაცია და უბრალო static ფაილების ნაკრები არ არის. მას Node server სჭირდება, რადგან `/api` proxy და OAuth route-ებიც frontend server-ზე მუშაობს.

Nuxt-ის ოფიციალური production build ქმნის `.output` საქაღალდეს, ხოლო სტანდარტული გაშვების ბრძანებაა:

```bash
node .output/server/index.mjs
```

### App Platform პარამეტრები

1. შექმენი მეორე App Platform app ან იმავე project-ში ცალკე frontend app.
2. დააკავშირე frontend GitHub repository.
3. აირჩიე production branch.
4. Environment — Node.js.
5. Build command:

```bash
npm run build
```

6. Run command:

```bash
node .output/server/index.mjs
```

7. საწყისი ზომა — 1 vCPU / 1 GB RAM, დაახლოებით $10.

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

`NUXT_PUBLIC_ALLOW_INDEXING` თავიდან უნდა იყოს `false`, სანამ production-ის დროებით მისამართზე ყველაფერს არ შევამოწმებთ.

## 18. ეტაპი 11 — დროებით მისამართებზე სრული შემოწმება

მთავარ დომენზე გადართვამდე DigitalOcean ორივე აპს დროებით მისამართს მისცემს.

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
- admin: `https://api.flexdrive.ge/admin/`

Backend საჯაროდ ცალკე `api` subdomain-ზე იქნება, მაგრამ browser-ის ჩვეულებრივი API მოთხოვნები frontend-ის `/api` proxy-ით გაივლის.

### მიბმის თანმიმდევრობა

1. DigitalOcean frontend app-ში დაამატე `flexdrive.ge`.
2. დაამატე `www.flexdrive.ge`.
3. Backend app-ში დაამატე `api.flexdrive.ge`.
4. DigitalOcean მოგცემს საჭირო `CNAME` ან სხვა DNS ჩანაწერებს.
5. დაამატე ისინი Cloudflare-ში `DNS only` რეჟიმით.
6. დაელოდე DigitalOcean-ის domain verification-სა და HTTPS სერტიფიკატს.
7. შეამოწმე ყველა მისამართი HTTPS-ით.
8. მხოლოდ ამის შემდეგ ჩართე Cloudflare proxy იმ web ჩანაწერებზე, რომლებზეც თავსებადობა დადასტურდება.
9. Cloudflare cache-ში `/api/*`, `/auth/*` და `/admin/*` არ უნდა დაკეშდეს.
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

Cloudinary-ის ფასიანი Plus პაკეტი ოფიციალურ გვერდზე ამჟამად დაახლოებით $99/თვეა, ამიტომ მას წინასწარ არ ვყიდულობთ.

DigitalOcean Spaces ღირს $5/თვე და მოიცავს 250 GiB საცავსა და 1 TiB outbound traffic-ს, მაგრამ მასზე გადასვლა კოდის შეცვლას და სურათების optimization/CDN პროცესის ხელახლა მოწყობას მოითხოვს. ახლა ეს ცვლილება საჭირო არ არის.

## 22. ეტაპი 15 — საბოლოო უსაფრთხოების checklist

production გახსნამდე:

- `DJANGO_DEBUG=False`;
- ახალი production `DJANGO_SECRET_KEY`;
- production database-ის ცალკე პაროლი;
- production Redis/Valkey-ის ცალკე პაროლი;
- ყველა secret DigitalOcean-ში Secret ტიპით;
- `.env` GitHub-ში არ არის;
- admin URL HTTPS-ით მუშაობს;
- admin-ის ძლიერი პაროლი;
- ორეტაპიანი დაცვა ყველა გარე ანგარიშზე;
- მხოლოდ საჭირო ადამიანებს აქვთ GitHub/DigitalOcean/admin წვდომა;
- staging API key-ები production-ში შეცვლილია, სადაც საჭიროა;
- ბანკის test credentials production-ში არ არის;
- production credentials staging-ში არ არის;
- Cloudflare SSL არის `Full (strict)`;
- Cloudflare cache არ ეხება API/auth/admin მისამართებს;
- database backup არსებობს;
- აღდგენის პროცესი ერთხელ მაინც გაგებულია;
- billing alerts ჩართულია;
- DigitalOcean deployment failure alerts ჩართულია;
- cron failure alerts ჩართულია.

Backend-ზე უნდა გაეშვას:

```bash
python manage.py check --deploy
```

მისი warnings უნდა განვიხილოთ და არა უბრალოდ უგულებელვყოთ.

## 23. ეტაპი 16 — გაშვების დღე

გაშვების დღეს:

1. შევაჩეროთ staging კონტენტისა და პროდუქტების ხელით ცვლილება.
2. ავიღოთ staging database-ის საბოლოო backup.
3. გადავიტანოთ საბოლოო მონაცემები production-ში.
4. გავუშვათ migrations.
5. გადავამოწმოთ პროდუქტისა და CMS ჩანაწერების რაოდენობა.
6. გავუშვათ supplier import dry-run.
7. თუ ანგარიში სწორია, გავუშვათ commit რეჟიმი.
8. გავუშვათ backend smoke test.
9. გავუშვათ frontend smoke test.
10. შევამოწმოთ რეგისტრაციის რეალური წერილი.
11. შევქმნათ ერთი უსაფრთხო სატესტო შეკვეთა.
12. ბანკის მიერ ნებადართული მცირე სატესტო გადახდა შევასრულოთ.
13. გადავამოწმოთ admin-ში შეკვეთა და გადახდის სტატუსი.
14. დავადასტუროთ Cloudinary upload.
15. დავადასტუროთ ელფოსტის მიღება/გაგზავნა სამივე მისამართზე.
16. `NUXT_PUBLIC_ALLOW_INDEXING` გადავიყვანოთ `true`-ზე.
17. frontend ხელახლა ავაშენოთ/deploy გავაკეთოთ.
18. შევამოწმოთ `robots.txt`, sitemap და SEO metadata.
19. ოფიციალურად გავხსნათ საიტი.

## 24. პირველი 7 დღე production-ზე

ყოველდღე შეამოწმე:

- DigitalOcean app status;
- backend errors;
- frontend errors;
- supplier import job;
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

## 25. როდის უნდა გავზარდოთ სერვისები

### Backend $25-დან უფრო მაღალ ზომაზე

თუ:

- RAM ხშირად 80–90%-ზეა;
- supplier import დროს აპი ნელდება;
- API პასუხები ხშირად იგვიანებს;
- worker timeout ან out-of-memory შეცდომები ჩანს.

### PostgreSQL

თუ:

- RAM ან CPU მუდმივად მაღალია;
- connections ივსება;
- რთული catalog ძებნა ნელდება;
- database ზომა სწრაფად იზრდება.

### Valkey

თუ memory ლიმიტს უახლოვდება ან keys იშლება.

### Brevo

თუ დღეში 300 წერილს ვუახლოვდებით.

### Cloudinary

თუ dashboard ლიმიტთან მიახლოებას აჩვენებს.

### Cloudflare Pro

უფასო პაკეტიდან ფასიანზე გადასვლა მხოლოდ კონკრეტული საჭიროებისას:

- დამატებითი WAF წესები;
- image optimization-ის დამატებითი შესაძლებლობები;
- უფრო ძლიერი უსაფრთხოების მოთხოვნა.

Cloudflare Pro ამჟამად დაახლოებით $20/თვეა წლიური გადახდით ან $25/თვე თვიური გადახდით. საწყის ეტაპზე არ გვჭირდება.

## 26. staging-ის ბედი production-ის შემდეგ

Production-ის გახსნისთანავე Render და Vercel staging არ წაშალო.

პირველი 1–2 თვე:

- staging დატოვე ტესტებისთვის;
- production ცვლილება ჯერ staging-ზე შეამოწმე;
- staging-ს ჰქონდეს ცალკე database, Redis/cache და OAuth/reCAPTCHA პარამეტრები;
- staging-ზე საძიებო ინდექსაცია გამორთული იყოს;
- staging-იდან რეალური მომხმარებლისთვის წერილები არ უნდა წავიდეს.

როდესაც DigitalOcean production სტაბილური იქნება, გადავწყვეტთ:

- staging დარჩეს Render/Vercel-ზე;
- staging-იც გადავიტანოთ DigitalOcean-ზე;
- ან უფრო იაფ staging რეჟიმზე გადავიყვანოთ.

## 27. შესაძენი და არშესაძენი სია

### ახლოს production გაშვებასთან უნდა ვიყიდოთ/ჩავრთოთ

- DigitalOcean App Platform frontend — დაახლოებით $10/თვე;
- DigitalOcean App Platform backend — დაახლოებით $25/თვე;
- DigitalOcean Managed PostgreSQL — დაახლოებით $15.15/თვე;
- DigitalOcean Managed Valkey — დაახლოებით $15/თვე;
- cron jobs — მოხმარების მიხედვით მცირე თანხა.

### უკვე გვაქვს და ვტოვებთ

- `flexdrive.ge`;
- სამი კომპანიის ელფოსტა;
- Cloudinary Free;
- Brevo Free;
- GitHub;
- staging Render;
- staging Vercel.

### უფასოდ ვამატებთ

- Cloudflare Free;
- DigitalOcean billing alerts;
- DigitalOcean app/job failure alerts.

### ახლა არ ვიყიდოთ

- DigitalOcean Spaces;
- Cloudinary Plus;
- Brevo paid plan;
- Cloudflare Pro;
- Load Balancer;
- Kubernetes;
- ცალკე worker სერვერი;
- ჩვეულებრივი Droplet.

## 28. სავარაუდო თვიური ბიუჯეტი

### რეკომენდებული

```text
Frontend App Platform        $10.00
Backend App Platform         $25.00
Managed PostgreSQL           $15.15
Managed Valkey               $15.00
Scheduled jobs               $0–2
Cloudflare                   $0
Cloudinary                   $0
Brevo                        $0
----------------------------------
სავარაუდო ჯამი              $65–67
```

### ეკონომიური

```text
Frontend App Platform        $10.00
Backend App Platform         $12.00
Managed PostgreSQL           $15.15
Managed Valkey               $15.00
Scheduled jobs               $0–2
----------------------------------
სავარაუდო ჯამი              $52–54
```

### უფრო ძლიერი ზრდის ვარიანტი

```text
Frontend                     $12–25
Backend                      $25–50
PostgreSQL 2 GB              დაახლოებით $30.45
Valkey                       $15–30
სხვა                         მოხმარების მიხედვით
----------------------------------
სავარაუდო ჯამი              $82–135+
```

შენი მოსალოდნელი 5–10 შეკვეთისთვის რეკომენდებული `$65–67` ვარიანტით დაწყება საკმარისია. რესურსების გაზრდა მოგვიანებით dashboard-იდან შეიძლება.

## 29. ამ პროექტისთვის აღმოჩენილი კონკრეტული ტექნიკური მოთხოვნები

პროექტის კოდის შემოწმებით დადასტურდა:

- Frontend არის Nuxt 4 SSR და Node server სჭირდება.
- Frontend browser მოთხოვნებს `/api` proxy-ით backend-ზე აგზავნის.
- Google და Facebook OAuth callback-ები frontend server route-ებს იყენებს.
- Backend არის Django + Django REST Framework.
- Backend Uvicorn ASGI server-ით ირთვება.
- production გარემოში Redis/Valkey სავალდებულოა.
- PostgreSQL სრულად მხარდაჭერილია `DATABASE_URL`-ით.
- media storage უკვე Cloudinary-ზეა ინტეგრირებული.
- static backend ფაილები WhiteNoise-ით მიეწოდება.
- Brevo API და SMTP უკვე ინტეგრირებულია.
- reCAPTCHA გამოიყენება auth, checkout, order lookup და contact flow-ებში.
- Cross Motors API import command უკვე არსებობს.
- daily cleanup command უკვე არსებობს.
- database migration build-ის ნაწილია.
- ონლაინ გადახდის შიდა საფუძველი ნაწილობრივ არსებობს, მაგრამ ბანკის საბოლოო ინტეგრაცია production-მდე სრულად უნდა შემოწმდეს.

## 30. ოფიციალური წყაროები და ფასების თარიღი

ფასები გადამოწმებულია 2026-06-20 მდგომარეობით და მომავალში შეიძლება შეიცვალოს.

- [DigitalOcean App Platform pricing](https://www.digitalocean.com/pricing/app-platform)
- [DigitalOcean Managed Databases pricing](https://www.digitalocean.com/pricing/managed-databases)
- [DigitalOcean Droplet pricing](https://www.digitalocean.com/pricing/droplets)
- [DigitalOcean Spaces pricing](https://www.digitalocean.com/pricing/spaces-object-storage)
- [DigitalOcean App Platform scheduled jobs](https://docs.digitalocean.com/products/app-platform/how-to/manage-jobs/)
- [DigitalOcean PostgreSQL features and backups](https://docs.digitalocean.com/products/databases/postgresql/details/features/)
- [Brevo pricing](https://www.brevo.com/pricing/)
- [Brevo domain authentication](https://help.brevo.com/hc/en-us/articles/12163873383186-Authenticate-your-domain-with-Brevo-Brevo-code-DKIM-DMARC)
- [Cloudinary pricing](https://cloudinary.com/pricing)
- [Cloudflare plans](https://www.cloudflare.com/plans/)
- [Nuxt 4 deployment documentation](https://nuxt.com/docs/4.x/getting-started/deployment)

## 31. შემდეგი უშუალო ნაბიჯი

ახლა DigitalOcean რესურსების ყიდვა ჯერ აუცილებელი არ არის.

შემდეგი სამუშაო რიგია:

1. ბანკისგან production ინტეგრაციის პირობების მიღება.
2. ონლაინ გადახდის კოდის დასრულება და ტესტირება.
3. backend email sender-ის `noreply@flexdrive.ge`-ზე გადაყვანა.
4. ავტომატურ წერილებში `support@flexdrive.ge` დახმარების მისამართის მითითების შემოწმება.
5. production environment variable-ების ზუსტი, საიდუმლო checklist-ის მომზადება.
6. staging database-ში სატესტო მონაცემების სიის შედგენა.
7. Cloudflare-ზე გადასატანი არსებული DNS/MX/TXT ჩანაწერების ინვენტარიზაცია.
8. ამის შემდეგ DigitalOcean-ის რესურსების შექმნა და დროებით მისამართებზე საცდელი production deployment.

ამ დოკუმენტს უნდა მივყვეთ ეტაპობრივად. მთავარ დომენზე გადართვა მხოლოდ დროებით DigitalOcean მისამართებზე სრული შემოწმების შემდეგ უნდა მოხდეს.
