# Sawaed — site brief

Sawaed (سواعد) is a volunteering initiative. Organisations post volunteer opportunities, and
people browse them and apply. This folder is empty on purpose: we have the content and the
data, not the site yet. Build the site from this brief.

- **Language:** Arabic only. An English version is not planned.
- **Audience:** the public, mostly on phones.
- **Accounts:** none in this phase. Nobody signs in; an application is identified by its reference number.
- **Logo:** not ready. Use a placeholder until the design team sends it.
- **Port:** the server listens on 3001.
- **Data:** `content/opportunities.json` holds the opportunities. The site reads them through the API below, never from the file directly.

## Pages

| Page | Route |
|---|---|
| Home | `/` |
| Opportunities | `/opportunities` |
| Opportunity | `/opportunities/<id>` |
| Calendar | `/calendar?month=<YYYY-MM>` |
| Compare | `/compare?ids=<id>,<id>,<id>` |
| Apply | `/apply?opportunity=<id>` |
| Volunteer guide | `/guide` |
| FAQ | `/faq` |
| Contact | `/contact` |

Any other route shows a "page not found" page.

Main navigation: الرئيسية، الفرص التطوعية، التقويم، دليل المتطوع، الأسئلة الشائعة، تواصل معنا.

Long pages have a button to go back to the top.

### Home

- Title: **تطوع بمهارتك، وأثرك يبقى**
- Line under it: **فرص تطوعية موثوقة في مدن المملكة، تختار منها ما يناسب وقتك ومهاراتك.**
- Button: **تصفح الفرص** → `/opportunities`
- **Latest opportunities:** the three with the nearest start date, each linking to its page, then a link to all opportunities.
- **How it works**, three steps:
  1. **اختر فرصة** — تصفح الفرص وصنفها حسب المدينة ونوع العمل.
  2. **قدم طلبك** — املأ نموذج التقديم في دقائق، وارفق سيرتك الذاتية إن رغبت.
  3. **ابدأ التطوع** — تتواصل معك الجهة المنظمة خلال خمسة أيام عمل.
- **A map of opportunities by city** is planned for the next phase. Keep its place on the page, between the latest opportunities and How it works, clearly marked as coming.
- A closing call to action: **لديك سؤال قبل التقديم؟** with a link to the FAQ.

### Opportunities

Every opportunity in the data. People must be able to search by title, narrow by city, category,
remote or on-site, the number of seats and the start date, and sort by start date. Each
opportunity shows its title, organisation, city, category, start date and seats, and links to
its page. Nine per page.

### Opportunity

All fields of one opportunity, then a button **قدم على هذه الفرصة** → `/apply?opportunity=<id>`.
Applications close on `apply_by`: show the time left until then, and after it the button is
replaced by **انتهى التقديم على هذه الفرصة**.
An unknown id shows "this opportunity is not available" with a link back to the list.

### Calendar

A month view: every day of the month in a week grid (Sunday first), each day showing the
opportunities that start on it (title and city), each linking to its page. Arrows move to the
previous and next month, and a **اليوم** button returns to this month; the month is in the URL.
Today is marked. A day with more than two opportunities shows two and "+N" that opens the rest.
The city and category filters from the Opportunities page apply here too. On a phone, the
month becomes a list of the days that have opportunities.

### Compare

People pick up to three opportunities to compare: each opportunity on the list and on its own
page has a **قارن** toggle. The chosen ones wait in a tray at the bottom of the screen (their
titles, a remove button each, and **قارن الآن**), on every page, until cleared; a fourth pick is
refused with a short message. The Compare page shows them side by side, one column each: city,
category, on-site or remote, start date, duration, seats, organisation, requirements. Rows where
they differ are marked. Each column ends with its apply button. With fewer than two chosen, the
page says so and links to the list.

### Apply

| Field | Rule |
|---|---|
| الاسم الكامل | required |
| رقم الهوية الوطنية أو الإقامة | required, 10 digits, starts with 1 or 2 |
| رقم الجوال | required, `05` then 8 digits |
| البريد الإلكتروني | required, an email |
| تاريخ الميلاد | required; the applicant is 18 or older on the opportunity's start date |
| المدينة | required, one of the cities in the data |
| الفرصة | required; preselected from the URL, can be changed |
| الأوقات المتاحة | required, one of: أيام الأسبوع، نهاية الأسبوع، كلاهما |
| المهارات | optional, any of: التنظيم، الإسعافات الأولية، التصوير، الترجمة، التعليم، التقنية |
| السيرة الذاتية | optional, PDF, up to 2 MB |
| ملاحظات | optional, up to 500 characters |
| أقر بصحة البيانات | required |

Before sending, the mobile number is verified: the applicant asks for a code, gets a 6-digit
code by SMS, and types it in. The code works for 5 minutes, and the page shows the time left. A
new code can be requested after 60 seconds, not before.

The applicant checks everything before sending. After sending, show the reference number
and **ستتواصل معك الجهة المنظمة خلال خمسة أيام عمل.**

### Volunteer guide

A long reading page, with a list of its sections that follows the reader down the page. The
sections, in order:

1. **قبل أن تبدأ** — اقرأ وصف الفرصة ومتطلباتها كاملة، وتأكد أن مواعيدها تناسبك قبل التقديم.
2. **يوم التطوع** — احضر قبل الموعد بربع ساعة، وعرف بنفسك لمشرف الفرصة، والتزم بالزي إن طلبته الجهة.
3. **السلامة أولا** — اتبع تعليمات المشرف، ولا تعمل وحدك في الفرص الميدانية، وأبلغ عن أي إصابة فورا.
4. **التعامل مع المستفيدين** — احترم خصوصيتهم، ولا تلتقط صورا لهم دون إذن الجهة المنظمة.
5. **ساعات التطوع والشهادة** — يسجل المشرف ساعاتك في نهاية كل يوم، وتصدر الشهادة بعد انتهاء الفرصة.
6. **إذا تعذر حضورك** — أبلغ الجهة المنظمة قبل الموعد بيوم على الأقل، حتى تتيح مكانك لمتطوع آخر.

Between sections 2 and 3, a quote from the initiative's director, نورة السبيعي:
**«التطوع لا يقاس بعدد الساعات، بل بالأثر الذي يتركه في الناس والمكان.»**

### FAQ

1. **هل التطوع مدفوع الأجر؟** — لا. التطوع عمل غير مدفوع، وتتحمل الجهة المنظمة تكاليف التنقل في الفرص الميدانية.
2. **هل أحتاج إلى خبرة سابقة؟** — لا يشترط ذلك في أغلب الفرص، وتذكر الجهة المنظمة أي متطلبات في صفحة الفرصة.
3. **هل يمكنني التقديم على أكثر من فرصة؟** — نعم، بشرط ألا تتعارض مواعيدها.
4. **متى أعرف نتيجة طلبي؟** — تتواصل معك الجهة المنظمة خلال خمسة أيام عمل من تاريخ التقديم.
5. **هل أحصل على شهادة؟** — نعم، تصدر الجهة المنظمة شهادة ساعات تطوعية بعد انتهاء الفرصة.
6. **كيف ألغي طلبي؟** — راسلنا من صفحة تواصل معنا واذكر رقم الطلب.

### Contact

A form: name, email, topic (استفسار عام، مشكلة في التقديم، اقتراح), message (required, up to
1000 characters). After sending: **وصلت رسالتك، وسنرد عليك خلال يومي عمل.**

Contact details, also in the footer:

- العنوان: طريق الملك فهد، حي العليا، الرياض
- الهاتف: 920000000
- البريد: info@sawaed.example
- ساعات العمل: الأحد إلى الخميس، من 8 صباحا إلى 4 مساء

## API

The site's server serves the pages and these endpoints. Applications and messages can stay in
memory for now.

| Endpoint | Returns |
|---|---|
| `GET /api/opportunities` | every opportunity, as in the data file |
| `GET /api/opportunities/<id>` | one opportunity, or 404 |
| `POST /api/otp/send` | `{ "phone" }` → 200 `{ "expires_in": 300, "resend_in": 60 }`, or 429 `{ "retry_in": <seconds> }` when asked again too soon |
| `POST /api/otp/verify` | `{ "phone", "code" }` → 200 `{ "token" }`, or 422 `{ "errors": { "code": "<message>" } }` when wrong or expired. Until the SMS provider is connected, the code is always `123456` |
| `POST /api/applications` | 201 `{ "reference": "SW-2026-00001" }`, or 422 `{ "errors": { "<field>": "<message>" } }` |
| `POST /api/contact` | 201 `{}`, or 422 `{ "errors": { "<field>": "<message>" } }` |

The server checks every rule in the Apply table again, and the `token` from the code check. The CV comes as `multipart/form-data`.
