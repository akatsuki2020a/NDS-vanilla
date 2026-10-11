# Sawaed — site brief

Sawaed (سواعد) is a volunteering initiative. Organisations post volunteer opportunities, and
people browse them and apply. This folder is empty on purpose: we have the content and the
data, not the site yet. Build the site from this brief.

- **Language:** Arabic only. An English version is not planned.
- **Audience:** the public, mostly on phones.
- **Accounts:** none in this phase. Nobody signs in; an application is identified by its reference number.
- **Logo:** not ready. Use a placeholder until the design team sends it.
- **Data:** `content/opportunities.json` holds the opportunities. The site reads them through the API below, never from the file directly.

## Pages

| Page | Route |
|---|---|
| Home | `/` |
| Opportunities | `/opportunities` |
| Opportunity | `/opportunities/<id>` |
| Apply | `/apply?opportunity=<id>` |
| FAQ | `/faq` |
| Contact | `/contact` |

Any other route shows a "page not found" page.

Main navigation: الرئيسية، الفرص التطوعية، الأسئلة الشائعة، تواصل معنا.

### Home

- Title: **تطوع بمهارتك، وأثرك يبقى**
- Line under it: **فرص تطوعية موثوقة في مدن المملكة، تختار منها ما يناسب وقتك ومهاراتك.**
- Button: **تصفح الفرص** → `/opportunities`
- **Latest opportunities:** the three with the nearest start date, each linking to its page, then a link to all opportunities.
- **How it works**, three steps:
  1. **اختر فرصة** — تصفح الفرص وصنفها حسب المدينة ونوع العمل.
  2. **قدم طلبك** — املأ نموذج التقديم في دقائق، وارفق سيرتك الذاتية إن رغبت.
  3. **ابدأ التطوع** — تتواصل معك الجهة المنظمة خلال خمسة أيام عمل.
- A closing call to action: **لديك سؤال قبل التقديم؟** with a link to the FAQ.

### Opportunities

Every opportunity in the data. People must be able to search by title, narrow by city, category,
remote or on-site, the number of seats and the start date, and sort by start date. Each
opportunity shows its title, organisation, city, category, start date and seats, and links to
its page. Nine per page.

### Opportunity

All fields of one opportunity, then a button **قدم على هذه الفرصة** → `/apply?opportunity=<id>`.
An unknown id shows "this opportunity is not available" with a link back to the list.

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

The applicant checks everything before sending. After sending, show the reference number
and **ستتواصل معك الجهة المنظمة خلال خمسة أيام عمل.**

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
| `POST /api/applications` | 201 `{ "reference": "SW-2026-00001" }`, or 422 `{ "errors": { "<field>": "<message>" } }` |
| `POST /api/contact` | 201 `{}`, or 422 `{ "errors": { "<field>": "<message>" } }` |

The server checks every rule in the Apply table again. The CV comes as `multipart/form-data`.
