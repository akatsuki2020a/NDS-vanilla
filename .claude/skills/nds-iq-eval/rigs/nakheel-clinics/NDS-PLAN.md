Managed by NDS IQ

## Inventory

Al-Nakheel Clinics is an Express and EJS app, six pages plus a 404. It was started on NDS 1.0.5 and has no
prior design-system files, so this is a first setup, not a conformance split. Chrome (top bar, main nav, footer,
cookie popup, accessibility panel) lives once in `views/partials/`.

| Page | Route | Legacy libraries | NDS target | Status |
|---|---|---|---|---|
| Home | `/` (`views/home.ejs`) | none | Site home: hero slider, card grids, definition list, brand section (`_site/index.html`) | Built and Verified |
| Clinics | `/clinics` (`views/clinics.ejs`, `public/js/clinics.js`) | none | Services list: search box, custom selects, card grid, pagination (`_site/examples/services-list.html`). Filtering and paging run on the server through `/api/clinics` | Built and Verified |
| Doctor | `/doctors/:id` (`views/doctor.ejs`) | none | Faculty page: sub hero, side menu, profile section, tabs (`_site/examples/faculty.html`) | Built and Verified |
| Book | `/book` (`views/book.ejs`, `public/js/book.js`) | none | Form template: stepper, custom selects, date picker, review step (`_site/templates/form-template.html`) | Built and Verified |
| My Appointments | `/appointments` (`views/appointments.ejs`, `public/js/appointments.js`) | none | Sortable table in the standard page shell (`_site/components/tables.html`), cancel button on each booked row | Built and Verified |
| Contact | `/contact` (`views/contact.ejs`, `public/js/contact.js`) | none | Contact us template with side info (`_site/templates/contact-us-template.html`) | Built and Verified |
| 404 | any other route (`views/404.ejs`) | none | 404 template (`_site/templates/404-template.html`) | Built and Verified |

## Install log

- NDS 1.0.5 template unpacked by the dev; `_site/assets/` copied whole into `NDS_ASSETS` (`public/nds/`). Pages
  load it from `/nds/`. CSS and JS bundle banners agree on 1.0.5.
- Page markup copied from the built pages in `_site/`, with asset URLs rewritten to `/nds/`.

## Decisions

- `NDS_ASSETS` = `public/nds/`, served at `/nds/` by Express static.
- Porting: parallel files, then promoted. Each page was built beside the old one and swapped in when it worked.
- Digital stamp: no. The top bar carries the date, clock and theme toggle only.
- Pacing: gate-by-gate. Finish a page, show it, wait for the go for the next.

## Open items

- [x] Plan review, decisions above recorded (2026-05-12).
- [x] Gate 1: chrome, Home, Clinics (2026-05-19).
- [x] Gate 2: Doctor, Book (2026-06-02).
- [x] Gate 3: My Appointments, Contact, 404 (2026-06-16).
- [ ] Replace placeholder doctor photos (`public/img/doctors/placeholder.svg` stands in for all 24).
- [ ] Logo from the brand team (`public/img/logo.svg` is a stand-in).
