# Al-Nakheel Medical Clinics

Patient portal for Al-Nakheel Medical Clinics: find a clinic, read a doctor's profile, book an appointment and manage your bookings. English, LTR.

UI: NDS (National Design System) 1.0.5, served from `public/nds/` at `/nds/`.

## Run it

```
npm install
npm start
```

Then open http://localhost:3003

Node 20 or later. There is no sign-in: the app runs as one demo patient, Reem Al-Harbi (`MRN-204518`). Data is read from `data/*.json` at start and kept in memory, so new bookings and cancellations reset when the server restarts.

## Pages

| Route | Page |
|---|---|
| `/` | Home |
| `/clinics` | Clinic search with specialty, branch and sort filters, 6 per page |
| `/doctors/:id` | Doctor profile |
| `/book` | Booking form (visit, details, insurance, review) |
| `/appointments` | My appointments, with cancel |
| `/contact` | Contact form |

## API

| Endpoint | What it does |
|---|---|
| `GET /api/clinics` | Clinics. Query: `q` (name), `specialty`, `branch`, `sort` (`rating`, `-rating`, `next_slot`, `name`), `page`. Returns `{ items, page, per_page, total }`, 6 per page |
| `GET /api/doctors/:id` | One doctor, or 404 `{ "error": "not_found" }` |
| `GET /api/appointments` | The patient's appointments |
| `POST /api/appointments` | Book. JSON `{ clinic_id, doctor_id, date, time, reason, phone }`. 201 `{ id }`, or 422 `{ errors }` |
| `DELETE /api/appointments/:id` | Cancel. 204, 404, or 409 if the visit is already completed |
| `GET /api/results` | Lab results, without values |
| `GET /api/results/:id` | One lab result with its values |
| `GET /api/results/trends` | History of one test over the last two years. Query: `test` (for example `HbA1c`, `LDL cholesterol`, `Vitamin D`, `Hemoglobin`, `TSH`, `Fasting glucose`). Returns `{ test, unit, range: { low, high }, points: [{ date, value, flag }] }`, or 404 for an unknown test |
| `GET /api/queue` | Waiting-room state for one branch. Query: `branch` (`riyadh-malqa`, `riyadh-nakheel`, `jeddah-rawdah`, `dammam-faisaliyah`). Returns `{ branch, now_serving, next, updated_at }` where `branch` is the branch name, or 404 for an unknown branch |
| `GET /api/queue/stream` | Server-Sent Events for one branch (same `branch` query). Sends the current state as `event: queue` on connect, a new `queue` event every 8 seconds as the queue advances, and an `event: notice` with an announcement every 60 seconds |
| `POST /api/contact` | Contact message. 201, or 422 `{ errors }` |

Validation on booking: the date cannot be in the past, the phone number is `05` plus 8 digits, and the reason is at most 300 characters.

## Roadmap

Next: a waiting-room display for the TV screens in each branch (full screen, no site header or footer, live from `/api/queue/stream`), and a Lab results page with a trend chart for each test (`/api/results` and `/api/results/trends`). Their APIs are ready.
