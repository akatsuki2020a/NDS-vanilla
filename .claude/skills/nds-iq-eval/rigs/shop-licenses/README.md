# Shop Licenses Portal (بوابة رخص المحلات)

Backend for the Al-Waha Municipality shop license portal. Shop owners apply for a license online;
municipality reviewers work through the applications. Django 5.2, SQLite, Arabic first with English.

## Run it

```bash
python -m venv .venv
.venv/Scripts/activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed
python manage.py runserver 3002
```

Open <http://localhost:3002/> (it redirects to `/ar/`; the English site is under `/en/`).
`python manage.py seed` can be run again at any time; it rebuilds the demo data.

| Username | Password | Role |
|---|---|---|
| `applicant` | `applicant123` | Shop owner with 7 applications, one in every status |
| `newcomer` | `newcomer123` | Shop owner with no applications |
| `reviewer` | `reviewer123` | Municipality reviewer (staff) |

The seed also creates 24 applications owned by a fourth user, so the review queue has 31 rows (4 pages).
Django admin is at `/admin/` (create a superuser with `python manage.py createsuperuser`).

## Front end: not started

Models, forms, views, URLs, seed data and copy are done. There are no templates, no CSS, no
JavaScript and no static files yet: opening a page raises `TemplateDoesNotExist` until its
template is written. `templates/` and `static/` do not exist yet. Put project templates in
`templates/` (settings already point there) and static files in `static/` (create it, then restart
the server). Product requirements are in `BRIEF.md`.

### Pages

All page URLs live under a language prefix: `/ar/...` and `/en/...`. The language switch is
Django's `set_language` view, a POST to `/i18n/setlang/` (fields `language` and `next`).

| Name | URL | Access | Template | Context | Fragment |
|---|---|---|---|---|---|
| `home` | `` | public | `licenses/home.html` | `featured` (4 activities) | - |
| `activities` | `activities/` | public | `licenses/activities.html` | `page_obj` (6 per page, `?page=`), `q` (`?q=` searches name, English name, code), `category` (`?category=`), `categories` (list of `{value, label}`), `total` | sends `licenses/_activities_results.html` (same context) |
| `activity_detail` | `activities/<code>/` | public | `licenses/activity_detail.html` | `activity`; unknown code is a 404 | - |
| `login` / `logout` | `accounts/` (Django's `django.contrib.auth.urls`) | none | `registration/login.html` | Django's (`form`, `next`); logout is POST only | - |
| `my_applications` | `applications/` | signed in | `licenses/my_applications.html` | `applications` (the user's own, newest first) | - |
| `application_new` | `applications/new/` | signed in | `licenses/application_form.html` | `form`; `?activity=<code>` preselects the activity. A valid POST saves, writes the first status change, adds a success message and redirects to the detail page | - |
| `application_detail` | `applications/<reference>/` | signed in, owner only | `licenses/application_detail.html` | `application`, `history`; another user's or unknown reference is a 404 | - |
| `staff_queue` | `staff/applications/` | staff only | `staff/queue.html` | `page_obj` (10 per page), `status` (`?status=`), `district` (`?district=<id>`), `q` (`?q=` reference or shop name), `statuses` and `districts` (lists of `{value, label}`), `counts` (status to count, over all applications), `total` | sends `staff/_queue_results.html` (same context) |
| `staff_review` | `staff/applications/<reference>/` | staff only | `staff/review.html` | `application`, `history`, `form` (`DecisionForm`). A valid POST updates the application, writes a status change, adds a success message and redirects to the queue | POST: valid is `204` + `X-Redirect: <queue url>`; invalid is `422` + `staff/_decision_form.html` (`form`, `application`) |
| `staff_board` | `staff/board/` | staff only | `staff/board.html` | `columns`: one per status in order (`submitted`, `under_review`, `inspection_scheduled`, `approved`, `rejected`), each `{status, label, count, applications}` with the newest 20 applications | - |
| `staff_move` | `staff/applications/<reference>/move/` | staff only, POST only | `staff/_board_card.html`, `staff/_move_form.html` | POST fields `to` (status), `inspection_date` (needed for `inspection_scheduled`), `note` (needed for `rejected`). Allowed moves: `submitted` to `under_review`; `under_review` to `inspection_scheduled` or `rejected`; `inspection_scheduled` to `approved` or `rejected`. Every move writes a status change. Without the header: redirect to the board, or the board again with an error message | valid is `200` + `staff/_board_card.html` (`application`) + header `X-Column: <new status>`; invalid is `422` + `staff/_move_form.html` (`form`, `application`), a disallowed move is an error on `to` |
| `staff_inspections` | `staff/inspections/` | staff only | `staff/inspections.html` | `week_label`, `days` (7 days, Sunday to Saturday, each `{date, is_today, inspections: [{time, reference, shop, district, url}]}`), `prev_week`, `next_week`, `this_week`. `?week=YYYY-Www` is the ISO week of the Monday inside the Sunday-to-Saturday week; default is this week | - |
| `extend_session` | `accounts/extend/` | signed in, POST only | none | none. Answers `204`; the request itself refreshes the session | - |

**Fragments.** List filtering and the decision form can update in place: send `X-Fragment: 1` and
swap the returned HTML. The three views above answer that header as the Fragment column says (the
fragment templates do not exist yet either). Without the header, the review POST redirects to the
queue and re-renders the full page on errors. The responses carry `Vary: X-Fragment`.

**Sessions.** A session ends after 15 minutes without a request (`SESSION_COOKIE_AGE = 900`; every request renews it). `POST /<lang>/accounts/extend/` (with the CSRF token) answers `204` and keeps the user signed in; a signed-out request to it is redirected to login.

**Fee lookup.** `GET /api/activities/<code>/fee` (no language prefix, public) returns
`{"code": "FD-01", "fee_sar": 1500, "needs_health_certificate": true}`, or `404 {"error": "not_found"}`.
The application form can show the fee when the activity changes.

A signed-out visitor on a protected page is redirected to login; a signed-in user who is not staff
gets a 403 on the staff pages. The error pages are Django's defaults, so they render `404.html`,
`403.html` and `500.html` from `templates/`.

Every template also gets `copy` (the UI strings for the current language), `lang` (`ar` or `en`)
and `dir` (`rtl` or `ltr`), plus Django's `user`, `messages` and `request`.

### Copy and data

- Every visible string is in `licenses/copy.py` (`COPY['ar']` and `COPY['en']`, same keys).
  Strings with `{placeholders}` are filled in the template.
- Form labels, help text and validation messages come from the same file and arrive with the form.
- Activities, districts and applications carry both languages. `{% load licenses_extras %}` gives
  the filters `label` (`{{ activity|label:lang }}`, also for districts and applications),
  `status_label` and `category_label` (`{{ application.status|status_label:lang }}`).
- An activity's `description` is plain text: 3 or 4 paragraphs separated by a blank line (`{{ ... |linebreaks }}` renders them).
- Application statuses: `submitted`, `under_review`, `inspection_scheduled`, `approved`, `rejected`.
- Uploaded files are opened through `application.floor_plan.url` and `application.lease_contract.url`.
