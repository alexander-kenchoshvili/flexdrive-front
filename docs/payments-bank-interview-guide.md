# FlexDrive Payment Integration Interview Guide

ბანკთან ან payment provider-თან შეხვედრის პრაქტიკული გზამკვლევი.

მიზანი: შეხვედრაზე ზუსტად გავიგოთ, რა გადახდის flow-ს გვთავაზობენ, რა ტექნიკური მონაცემები გვჭირდება, რა ვალდებულებები გვექნება, და როგორ ჩავაბათ ეს FlexDrive-ის უკვე მომზადებულ payment safety foundation-ს.

## მოკლე პოზიცია

FlexDrive არის ონლაინ ავტონაწილების მაღაზია. პირველ ეტაპზე გვაქვს ნაღდი ანგარიშსწორება, ხოლო შემდეგ გვინდა დავამატოთ:

- ბარათით ონლაინ გადახდა;
- განვადება;
- ნაწილ-ნაწილ გადახდა, თუ provider ამას გვთავაზობს;
- refund/cancel flow იგივე არხით, რომლითაც მომხმარებელმა გადაიხადა.

ჩვენს სისტემაში უკვე მომზადებულია:

- ცალკე `order_status` და `payment_status`;
- `PaymentTransaction` ჩანაწერები ყველა გადახდის მცდელობისთვის;
- `StockReservation` foundation, რომ ონლაინ გადახდის პროცესში პროდუქტი დროებით დაიჭიროს;
- mock/manual provider abstraction, სადაც მომავალში რეალური ბანკის adapter ჩაჯდება;
- admin visibility transaction/reservation სტატუსებისთვის.

ჯერ არ გვაქვს რეალური ბანკის API, redirect, callback/webhook ან რეალური თანხის დაბლოკვა.

## შეხვედრის პირველი სცენარი

### მე რას ვეუბნები ბანკს

გვინდა ონლაინ გადახდების ინტეგრაცია ecommerce საიტზე. პროდუქტი არის ავტონაწილები. თითოეულ შეკვეთაზე მომხმარებელი ირჩევს პროდუქტს, ავსებს checkout-ს და გვინდა გადავიდეს ბარათით გადახდაზე, შემდეგ ეტაპზე განვადებასა და ნაწილ-ნაწილ გადახდაზეც.

ჩვენთვის მნიშვნელოვანია:

- გადახდა არ დაფიქსირდეს არასწორად;
- თუ პროდუქტი აღარ არის ხელმისაწვდომი, თანხა არ ჩამოეჭრას ან სწორად გაუქმდეს/დაბრუნდეს;
- გვქონდეს sandbox/test გარემო;
- გვქონდეს callback/webhook, რომ backend-მა ზუსტად იცოდეს გადახდის საბოლოო სტატუსი.

### ბანკმა შეიძლება გკითხოს

**რა ტიპის საიტია?**

პასუხი:
ონლაინ ავტონაწილების მაღაზია. მომხმარებელი ყიდულობს პროდუქტს საიტიდან. პროდუქტი ფიზიკურად მიეწოდება თბილისში ან რეგიონებში.

**იურიდიული პირი ხართ?**

პასუხი:
კომპანია რეგისტრირებულია/რეგისტრირდება შპს ფორმით. შეგვიძლია მივაწოდოთ საიდენტიფიკაციო კოდი, საბანკო ანგარიში, დირექტორის მონაცემები და საჭირო დოკუმენტები.

**საიტზე წესები, დაბრუნება და კონფიდენციალურობა გაქვთ?**

პასუხი:
დიახ, საიტზე გვაქვს Terms, Returns, Payment Methods, Privacy Policy და Delivery გვერდები. ტექსტები მორგებულია რეალურ ecommerce flow-ზე და მოიცავს მიწოდებას, დაბრუნებას, გადახდას, კონფიდენციალურობას, cookie/analytics თემებს და online refund-ის ზოგად წესს.

**რა payment methods გინდათ?**

პასუხი:
პირველ რიგში ბარათით გადახდა. შემდეგ გვინდა განვადება და ნაწილ-ნაწილ გადახდა, თუ provider-ის პროდუქტები და პირობები შეესაბამება ჩვენს checkout flow-ს.

**გაქვთ თუ არა მარაგის მართვა?**

პასუხი:
დიახ. checkout-ის ბოლო ეტაპზე backend თავიდან ამოწმებს პროდუქტს, აქტიურობას, ფასს და რაოდენობას. ონლაინ გადახდებისთვის ასევე მომზადებულია stock reservation foundation, რომ გადახდის პროცესში პროდუქტი დროებით დაიჭიროს.

**როგორ აბრუნებთ თანხას?**

პასუხი:
ჩვენი მიზანია თანხის დაბრუნება მოხდეს იმავე არხით, რომლითაც მომხმარებელმა გადაიხადა. ამისთვის გვჭირდება provider-ის refund/cancel API და მისი წესები: სრული refund, partial refund, authorization cancel, settlement-მდე და settlement-ის შემდეგ განსხვავებები.

## ჩვენგან დასასმელი მთავარი კითხვები

### 1. გაქვთ authorization/capture flow?

კითხვის ფორმა:

ბარათით გადახდაზე შეგიძლიათ თანხა ჯერ დაბლოკოთ, მაგრამ არ ჩამოჭრათ? ანუ გაქვთ authorization/capture?

რატომ გვჭირდება:

ავტონაწილებში ზოგჯერ საბოლოოდ უნდა დავადასტუროთ, რომ პროდუქტი ხელმისაწვდომია. თუ provider გვაძლევს authorization/capture-ს, ჯობს:

1. დავარეზერვოთ პროდუქტი;
2. დავბლოკოთ თანხა;
3. შევქმნათ/დავადასტუროთ order;
4. მერე გავაკეთოთ capture.

თუ პრობლემა გამოჩნდა, capture-მდე cancel/void უფრო სუფთაა, ვიდრე უკვე ჩამოჭრილი თანხის refund.

შესაძლო პასუხი ბანკისგან:

- "კი, გვაქვს pre-authorization და completion/capture."
- "არა, გადახდა პირდაპირ ჩამოჭრით ხდება."
- "კი, მაგრამ მხოლოდ კონკრეტულ ბარათებზე/კონფიგურაციაზე."

ჩვენი რეაქცია:

- თუ აქვთ: ვაწყობთ `authorize -> capture/cancel` flow-ს.
- თუ არ აქვთ: ვაწყობთ direct payment + refund/cancel flow-ს.

### 2. თუ direct capture-ია, refund/cancel როგორ მუშაობს?

კითხვის ფორმა:

თუ თანხა მაშინვე ჩამოიჭრება, როგორ ხდება გაუქმება და დაბრუნება? არის განსხვავება იმავე დღეს cancel-სა და მომდევნო დღეების refund-ს შორის?

რატომ გვჭირდება:

თუ მომხმარებელმა გადაიხადა და შეკვეთა ვერ შესრულდა, უნდა ვიცოდეთ როგორ დავაბრუნოთ თანხა სწორად.

სავარაუდო პასუხი:

- შეიძლება იყოს cancel იმავე დღეს;
- settlement-ის შემდეგ refund;
- შეიძლება partial refund;
- შეიძლება იყოს refund-ის ვადები;
- შეიძლება საჭირო იყოს ბანკის dashboard-იდან ან API-დან მოქმედება.

ჩვენი რეაქცია:

PaymentTransaction-ში შევინახავთ provider transaction id-ს და refund/cancel action-ს გავაკეთებთ provider-ის წესების მიხედვით.

### 3. როგორ იქმნება გადახდა?

კითხვის ფორმა:

გადახდის დასაწყებად backend ქმნის payment session-ს და იღებს redirect URL-ს? თუ frontend SDK/embedded checkout გამოიყენება?

რატომ გვჭირდება:

უნდა ვიცოდეთ frontend რა უნდა გააკეთოს:

- მომხმარებელი გადავიყვანოთ ბანკის გვერდზე;
- modal/embedded ფორმა გავხსნათ;
- თუ SDK გვჭირდება, როგორ იტვირთება და რა compliance მოთხოვნები აქვს.

სავარაუდო პასუხი:

- backend creates payment, returns `payId`/`paymentId` და redirect URL;
- frontend გადადის provider-hosted page-ზე;
- callback/webhook აბრუნებს საბოლოო სტატუსს.

ჩვენი რეაქცია:

backend-ში შეიქმნება payment start endpoint, რომელიც:

1. შეამოწმებს checkout-ს;
2. შექმნის reservation-ს;
3. შექმნის PaymentTransaction-ს;
4. provider-ს დაუძახებს;
5. frontend-ს დაუბრუნებს redirect URL-ს.

### 4. callback და webhook გაქვთ?

კითხვის ფორმა:

გაქვთ backend callback/webhook, რომ გადახდის სტატუსი server-to-server მივიღოთ? მხოლოდ browser redirect არ გვინდა.

რატომ გვჭირდება:

browser redirect არასაკმარისია. მომხმარებელმა შეიძლება დახუროს tab, ინტერნეტი გაუწყდეს, ან success page-ზე ვერ დაბრუნდეს. საბოლოო ჭეშმარიტება უნდა იყოს provider webhook/callback.

სავარაუდო პასუხი:

- "კი, გვაძლევთ callback URL-ს."
- "გადახდის შემდეგ user redirect URL-ზე ბრუნდება, ხოლო სტატუსი შეგიძლიათ API-ით გადაამოწმოთ."
- "გვაქვს სტატუსის sync endpoint."

ჩვენი რეაქცია:

აუცილებლად ვითხოვთ:

- callback payload example;
- signature/HMAC verification;
- retry policy;
- duplicate callback handling;
- status list.

ჩვენი backend callback უნდა იყოს idempotent: იგივე callback ორჯერ თუ მოვიდა, order ორჯერ არ უნდა შეიქმნას და stock ორჯერ არ უნდა ჩამოიჭრას.

### 5. webhook security როგორ მოწმდება?

კითხვის ფორმა:

callback request-ს როგორ ვამოწმებთ, რომ ნამდვილად თქვენგან მოდის? გაქვთ signature header, shared secret, certificate, IP allowlist?

რატომ გვჭირდება:

public endpoint-ზე ნებისმიერს შეუძლია POST გაგზავნოს. signature verification ან სხვა დაცვა აუცილებელია.

სავარაუდო პასუხი:

- HMAC signature header;
- Bearer token;
- certificate-based auth;
- IP allowlist;
- API key + secret.

ჩვენი რეაქცია:

უნდა ჩავწეროთ ზუსტად:

- რომელი header მოდის;
- როგორ ითვლება signature;
- რა payload-ზე ითვლება;
- timestamp/replay protection არის თუ არა.

### 6. status-ები რა გაქვთ?

კითხვის ფორმა:

გადახდას რა სტატუსები აქვს და რას ნიშნავს თითოეული? მაგალითად pending, authorized, paid, failed, cancelled, refunded.

რატომ გვჭირდება:

ჩვენს სისტემაში უნდა დავამთხვიოთ provider status-ები ჩვენს internal status-ებს.

ჩვენი internal mapping:

- provider pending -> `payment_status=pending`
- authorized/preAuth -> `authorized`
- captured/success -> `paid`
- declined/error -> `failed`
- cancelled/voided -> `cancelled`
- refund started -> `refund_pending`
- refund completed -> `refunded`

სავარაუდო პასუხი:

ბანკი მოგცემს საკუთარ status code/result code list-ს. ეს list უნდა წამოვიღოთ დოკუმენტად.

### 7. idempotency support გაქვთ?

კითხვის ფორმა:

payment create/refund/capture request-ზე idempotency key გაქვთ? თუ network timeout მოხდა და request ხელახლა გავუშვით, duplicate payment არ შეიქმნება?

რატომ გვჭირდება:

გადახდებში retry ჩვეულებრივი ამბავია. ერთი და იგივე request ორჯერ არ უნდა ჩამოიჭრას.

სავარაუდო პასუხი:

- "კი, გვაქვს idempotency key header."
- "არა, თქვენ მხარეს უნდა აკონტროლოთ provider transaction id-ით."

ჩვენი რეაქცია:

თუ აქვთ, ყველა sensitive request-ზე გავატანთ idempotency key-ს. თუ არ აქვთ, ჩვენს PaymentTransaction-ს გავხდით single source of truth-ს და duplicate request-ებს შევზღუდავთ.

### 8. sandbox/test გარემო გაქვთ?

კითხვის ფორმა:

გაქვთ sandbox გარემო, test cards, test installment cases და callback testing?

რატომ გვჭირდება:

production-ზე გადასვლამდე უნდა დავტესტოთ:

- successful payment;
- declined card;
- cancelled by user;
- timeout;
- callback retry;
- refund;
- partial refund;
- installment approved/rejected/cancelled.

სავარაუდო პასუხი:

მოგცემენ sandbox URL-ს, client id/secret-ს, API key-ს, test cards-ს, dashboard-ს.

### 9. განვადება როგორ მუშაობს?

კითხვის ფორმა:

განვადებაზე flow როგორია? მომხმარებელი განაცხადს ავსებს თქვენს გვერდზე? რა status-ებს აბრუნებთ? როდის ითვლება შეკვეთა გადახდილად?

რატომ გვჭირდება:

განვადება ყოველთვის არ არის იგივე, რაც ბარათი. შეიძლება იყოს approval process, pending status, cancel API, merchant confirmation.

უნდა გავიგოთ:

- განაცხადი იწყება checkout-დან თუ ცალკე endpoint-ით;
- approval status როგორ მოდის;
- merchant confirmation საჭიროა თუ არა;
- cancellation/refund როგორ ხდება;
- რა ვადაში უნდა დავადასტუროთ order.

### 10. ნაწილ-ნაწილ გადახდა როგორ მუშაობს?

კითხვის ფორმა:

ნაწილ-ნაწილ გადახდისას თანხა სრულად გვერიცხება merchant-ს და მომხმარებელი provider-ს უხდის ნაწილებად, თუ merchant payment ნაწილებად მოდის?

რატომ გვჭირდება:

order fulfillment და refund წესები ამაზეა დამოკიდებული.

სავარაუდო პასუხი:

- provider merchant-ს სრულ თანხას ურიცხავს, მომხმარებელი provider-ს უხდის ნაწილებად;
- ან payment status რამდენიმე ნაწილად მოდის.

ჩვენი რეაქცია:

უნდა დავამთხვიოთ ჩვენი `payment_status` და admin handling provider-ის რეალურ flow-ს.

## ბანკმა შეიძლება მოითხოვოს

### კომპანიის/ბიზნესის ინფორმაცია

- შპს მონაცემები;
- საიდენტიფიკაციო კოდი;
- დირექტორის მონაცემები;
- საბანკო ანგარიში;
- საკონტაქტო email/phone;
- საქმიანობის სფერო;
- პროდუქტის ტიპი;
- სავარაუდო monthly turnover;
- საშუალო order amount;
- refund/return policy.

### საიტის ინფორმაცია

- domain;
- production URL;
- Terms page;
- Returns page;
- Payment Methods page;
- Privacy Policy page;
- Delivery page;
- Contact page;
- checkout flow;
- customer support email/phone;
- company identification footer/contact area.

### ტექნიკური ინფორმაცია

- callback/webhook URL;
- success redirect URL;
- failure/cancel redirect URL;
- refund/cancel handling;
- server IP allowlist, თუ სჭირდებათ;
- frontend/backend stack ზოგადად;
- sandbox credentials contact email;
- production credentials contact email.

## ჩვენი სწორი technical answer მოკლედ

თუ გვკითხავენ, როგორ არის სისტემა მოწყობილი:

FlexDrive-ში order და payment ცალკეა. Order-ს აქვს თავისი სტატუსი, payment-ს თავისი სტატუსი. ყველა payment attempt ინახება `PaymentTransaction` ჩანაწერად. ონლაინ გადახდის დაწყებამდე backend შეძლებს stock reservation-ს, რომ გადახდის პროცესში იგივე პროდუქტი სხვამ არ იყიდოს. Provider-ის callback/webhook იქნება payment status-ის მთავარი წყარო. Callback დამუშავდება idempotent-ად, რომ duplicate notification-მა duplicate order/stock reduction არ გამოიწვიოს.

## მარტივი flow, თუ აქვთ authorization/capture

1. მომხმარებელი checkout-ზე აირჩევს ბარათს.
2. backend გადაამოწმებს კალათას/ფასს/მარაგს.
3. backend შექმნის `StockReservation`.
4. backend შექმნის `PaymentTransaction(status=pending, action=authorize)`.
5. provider-ზე გაიგზავნება authorize request.
6. თუ authorized:
   - `payment_status=authorized`;
   - order მზადდება/დასტურდება;
   - fulfillment-ready ეტაპზე ხდება capture.
7. თუ capture წარმატებულია:
   - `payment_status=paid`;
   - reservation ხდება completed.
8. თუ authorize/capture ჩავარდა:
   - reservation release/expire;
   - payment_status failed/cancelled.

## მარტივი flow, თუ მხოლოდ direct capture აქვთ

1. მომხმარებელი checkout-ზე აირჩევს ბარათს.
2. backend გადაამოწმებს კალათას/ფასს/მარაგს.
3. backend შექმნის `StockReservation`.
4. backend შექმნის `PaymentTransaction(status=pending, action=sale)`.
5. provider-ზე იწყება payment.
6. provider success callback-ზე:
   - იქმნება/დასტურდება order;
   - real stock მცირდება;
   - reservation completed;
   - `payment_status=paid`.
7. provider failure/cancel callback-ზე:
   - reservation released/cancelled/expired;
   - `payment_status=failed/cancelled`.
8. თუ success მოვიდა, მაგრამ order ვერ შესრულდა, იწყება provider refund/cancel flow.

## რაც აუცილებლად წამოვიღოთ შეხვედრიდან

- Merchant onboarding steps.
- Sandbox URL.
- Production URL.
- API key/client id/client secret მოთხოვნები.
- Token lifetime.
- Payment create endpoint.
- Redirect URL handling.
- Callback/webhook URL format.
- Callback security/signature docs.
- Payment status code list.
- Error code list.
- Authorization/capture support answer.
- Cancel/void rules.
- Refund rules.
- Partial refund support.
- Installment API docs.
- Part-payment API docs.
- Test cards/test scenarios.
- Go-live checklist.
- Fees/commission/settlement timing.
- Support contact for technical integration.

## კითხვები, რომლებიც არ უნდა დაგვავიწყდეს

1. Online card payment-ზე authorization/capture გაქვთ?
2. თუ preAuth გაქვთ, რამდენ ხანს ძლებს authorization?
3. Capture partial amount შეიძლება?
4. Cancel/void როდის შეიძლება?
5. Refund API გაქვთ?
6. Partial refund შეიძლება?
7. Refund რამდენ დღეში აისახება მომხმარებელთან?
8. Payment create request-ში order number/reference როგორ გავატანოთ?
9. Callback retry policy როგორია?
10. Callback signature როგორ მოწმდება?
11. Duplicate callback შეიძლება მოვიდეს?
12. Status check API გაქვთ?
13. Sandbox callback testing როგორ ხდება?
14. განვადების approval/cancel/refund flow როგორია?
15. ნაწილ-ნაწილ payment-ის lifecycle როგორია?
16. Apple Pay / Google Pay ცალკე აქტივაციას საჭიროებს?
17. 3DS/secure authentication ავტომატურად ხდება provider-ის გვერდზე?
18. Settlement როდის ხდება?
19. Chargeback/dispute notification გაქვთ?
20. Production-ზე გადასვლამდე რას ამოწმებთ საიტზე?

## სავარაუდო პასუხები, რომლებიც უნდა დავიმახსოვროთ

თუ ბანკი ამბობს: "ჩვენ redirect checkout გვაქვს."

ჩვენი პასუხი:
კარგია. ჩვენ backend-იდან შევქმნით payment session-ს, frontend-ს გადავიყვანთ redirect URL-ზე, ხოლო საბოლოო სტატუსს callback/webhook-ით დავამუშავებთ.

თუ ბანკი ამბობს: "callback არ გვაქვს, status polling გამოიყენეთ."

ჩვენი პასუხი:
შესაძლებელია, მაგრამ გვჭირდება polling interval, timeout, final statuses და reconciliation process. ჩვენი preference არის server-to-server callback/webhook.

თუ ბანკი ამბობს: "authorization/capture არ გვაქვს."

ჩვენი პასუხი:
მაშინ direct capture flow-ს ავაწყობთ. პროდუქტის reservation მაინც გვექნება payment-ის დაწყებამდე, ხოლო failed/cancel შემთხვევაში reservation გათავისუფლდება. fulfilment failure შემთხვევაში refund/cancel API დაგვჭირდება.

თუ ბანკი ამბობს: "refund dashboard-იდან კეთდება, API არ გვაქვს."

ჩვენი პასუხი:
პირველ ეტაპზე შესაძლებელია, მაგრამ გვჭირდება მკაფიო ოპერაციული პროცესი და admin-ში status tracking. API refund უკეთესი იქნება, რომ ყველაფერი სისტემაში ჩაიწეროს.

თუ ბანკი ამბობს: "განვადების სტატუსი pending შეიძლება იყოს."

ჩვენი პასუხი:
მაშინ order/payment status-ში pending/authorized-like intermediate state გვჭირდება. პროდუქტი pending პერიოდში შეიძლება reservation-ში დარჩეს მხოლოდ განსაზღვრული ვადით.

## ჩვენი ტექნიკური მზადყოფნის მოკლე ტექსტი ბანკისთვის

FlexDrive-ის backend-ში უკვე გვაქვს payment status separation, payment transaction records და stock reservation foundation. რეალურ provider-ს ჩავამატებთ adapter-ის სახით. გვჭირდება თქვენი API documentation, sandbox credentials, callback/security specification, status/error code list და refund/cancel/preAuth წესები, რომ integration სწორად მოვარგოთ თქვენს flow-ს.

## შეხვედრის შემდეგ გასაკეთებელი შიდა checklist

- Provider-ის დოკუმენტაციის შენახვა project docs-ში.
- Internal status mapping ცხრილის გაკეთება.
- Provider adapter task-ის გახსნა.
- Payment start endpoint task-ის გახსნა.
- Callback/webhook endpoint task-ის გახსნა.
- Refund/cancel admin actions task-ის გახსნა.
- Frontend checkout payment buttons task-ის გახსნა.
- Success/failure/pending pages task-ის გახსნა.
- Sandbox test matrix-ის გაკეთება.
- Legal/payment-methods გვერდების განახლება რეალური provider-ის მიხედვით.

## გამოყენებული საწყისი წყაროები

- TBC Checkout API overview: https://docstbc.readme.io/reference/tbc-checkout-api-overview
- TBC cancel/pre-authorization related documentation: https://tbc-group-clone.readme.io/docs/checkout-cancel-checkout-payment
- Bank of Georgia API activation instructions: https://bankofgeorgia.ge/files/bc3ed7fe-7795-4fee-8678-ba6ede008e53.PDF
- Payments webhook overview and security/idempotency concepts: https://www.pxp.io/payments-glossary/webhook
