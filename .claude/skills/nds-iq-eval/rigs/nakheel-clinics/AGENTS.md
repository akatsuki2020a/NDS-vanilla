# AGENTS.md

## Project

Al-Nakheel Medical Clinics patient portal. Node 20, Express 4, EJS 3. English, LTR.

- Run: `npm install`, then `npm start` (http://localhost:3003).
- `server.js` holds the pages and the JSON API; sample data is in `data/*.json` and lives in memory while the server runs.
- Views: `views/<page>.ejs`. Shared head, header, footer and scripts are in `views/partials/`; every page includes them.
- Page JavaScript: `public/js/<page>.js`. Site styles: `public/css/site.css`.
- No sign-in: the app runs as one demo patient (Reem Al-Harbi, `MRN-204518`).

## NDS — National Design System (UI layer)

- `NDS_ROOT` = `.nds/`
- `NDS_ASSETS` = `public/nds/`

All UI in this project is built with NDS. Before any UI, page, component, styling,
or asset work — or when unsure whether a task touches NDS — read `NDS-IQ.md` at this
project's root, top to bottom, once per session. Do no NDS work before that read.
If the file is missing, stop and ask the dev.

These hold even before the read:
- Never edit anything under `NDS_ROOT`; never hand-edit NDS files in `NDS_ASSETS`.
- Never write `.nds-*` markup from memory — copy from the sources `NDS-IQ.md` names.
