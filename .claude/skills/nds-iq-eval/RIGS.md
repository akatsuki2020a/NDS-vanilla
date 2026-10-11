# Field rigs

A field rig is a real legacy app that a fresh agent session ports to NDS, or a brief it builds a new site from, with the draft rules and the template the next release ships. It finds what the scenarios and fixtures cannot: an agent's real choices over hours of work. Each run ends with the agent's `NDS-REPORT.md` and `NDS-PLAN.md`, which this repo then reviews.

`scripts/rig.py` does the setup, the staging and the reset. Run it from the repo root, on any PC.

## Baselines

The baselines live in `rigs/`, at their clean state. Each app runs on its own port, so all of them can run at once; `rig.py` prints the start command and the link. Each baseline has one rig, named by its number: rig 5 lives at `../nds-test-app-5`, and its runs are rig 5 run 1, run 2 and so on. Rigs 5 to 7 are the starters, legacy apps to port. Rigs 1 to 4 are designed to test NDS IQ on purpose: each covers a work mode or stack the starters miss. Field rigs are not the behavior-mode rigs R1 to R4 in `SKILL.md`.

| Rig | Baseline | App | Run | URL |
|---|---|---|---|---|
| 1 | `sawaed` | No app: an empty folder with `BRIEF.md` (an Arabic volunteering site: pages, copy, fields, API) and its data | — | — |
| 2 | `shop-licenses` | A municipality's shop license portal in Arabic and English: a finished Django backend with no templates, CSS or JS yet. `BRIEF.md`, the copy in `licenses/copy.py` | `.venv/Scripts/python manage.py runserver 8002` | `http://localhost:8002` |
| 5 | `library-portal` | Arabic RTL public library: Express and JSON APIs, Bootstrap RTL, jQuery, DataTables, Select2, Summernote, an SSO stub, a hash-router account area | `npm start` | `http://localhost:3005` |
| 6 | `citydesk` | English LTR municipal help desk: Express and JSON APIs, Bootstrap, jQuery, DataTables, Select2, TinyMCE, a staff back office | `npm start` | `http://localhost:3000` |
| 7 | `grants-desk` | English staff console: a React single-page app on Vite, no backend | `npm run dev` | `http://localhost:5177` |

## What each rig tests

The traps live here, never in the rig: the agent reads everything in its folder. Answer the agent as the dev, with the answers below.

### Rig 1: a new site from a brief

**Tests:** the "no host project" row (stop NDS work, the dev picks the stack), then a greenfield build.

**Dev answers:**
- The stack: "Node 20 and Express. Serve the pages and the API in the brief, keep the data in memory."
- The digital stamp: "No, the site does not hold the verification."
- Pacing: `whole plan`.

**What a pass looks like:**
- The agent stops before any NDS work and asks for the stack. It never picks one itself.
- Once the server runs, the plan lists only the brief's pages (and the not-found page).
- Every template section the brief does not cover is removed, never filled with invented copy: news, partners, counters, testimonials, the sign-in action (no accounts), notifications, the language switcher (Arabic only).
- The placeholder logo, and the brief's footer details (address and opening hours), each ship with a plan checkbox or a finding, never with invented content.
- Each part maps to the data: city and category are facets, remote or on-site is a single-choice facet, seats a range, the start date a date range.
- Apply has two input steps (form, review) plus success. Each field type validates on its own, and a 422 from the server shows on its field.
- The states the brief implies are built and checked: an empty filter result, a failed request, an unknown opportunity, the not-found page.
- One opportunity (id 106, 2026-09-23) has already started. The brief is silent on it: the agent asks, or ships a default with a checkbox. It never drops the opportunity silently.

### Rig 2: a new UI on a server that renders pages

**Tests:** a greenfield build inside a running app whose server renders every page and answers in HTML: Django templates, server form errors, HTML fragments, two languages, two page shapes.

`rig.py new 2` makes the venv and seeds the data; `reset` seeds it again. Accounts: `applicant`, `newcomer` (no applications), `reviewer` (staff), each with the password `<name>123`.

**Dev answers:** the `NDS_ASSETS` folder the agent recommends under `static/`; the digital stamp: "No"; pacing: `whole plan`.

**What a pass looks like:**
- The chrome is written once, in a base template the pages extend, with one base per page shape: the public pages, and the console for the staff queue and review.
- `lang` and `dir` come from the request, and the language switcher stays. Django's language switch and sign-out are POST only: the agent wires the canonical controls to a form with the CSRF token, and never swaps them for its own UI.
- Server form errors render in NDS's error state at first paint, on the right field, in both languages. The review step runs in the browser, so the chosen files survive it.
- The activities filter and the queue's status, search and paging are wired to the server's `?q=`, `?category=`, `?status=` and `?page=`, never filtered in the browser.
- A fragment (`X-Fragment: 1`) swapped into the page gets its NDS components started. The agent reads the init API, and checks a swapped-in menu or tag in the browser. A 422 decision form swaps in with its errors. A 204 follows `X-Redirect`.
- Django's messages show as NDS alerts. The 403, 404 and 500 templates are status sections.
- The fee endpoint fills in the fee when the activity changes, through the select's own change event.
- Every string comes from `copy.py`. The logo is a placeholder with a checkbox.

## Set up a rig

You need Node, git, Python 3.12+, Ruby with Bundler (the NDS build) and Claude Code.

```bash
python scripts/rig.py new 5          # → ../nds-test-app-5
```

The script copies the baseline, writes a `CLAUDE.md` that turns off memory for the rig, commits it, tags the commit `baseline`, and runs `npm install` when the baseline has an app. The `CLAUDE.md` is not in `rigs/` on purpose: a nested one would load into sessions working on NDS itself.

## Run

A run tests either the published rules and release, or the unreleased ones on main (the draft rules and the next release's template).

### Published

1. **Start the app** in its own terminal (the table above).
2. **Start the agent:** open a new Claude Code session in the rig folder and paste the setup prompt from `guides/get-started.md`, unchanged. It downloads the published rules and the release.

### Unreleased

1. **Commit first.** Staging takes `_source/` from the committed tree, the way a release's source zip does. It takes `NDS-IQ.md` from the working draft.
2. **Stage:** `python scripts/rig.py stage 5 2.0.0`. The number is the one the next release takes. The script builds the release zip with `mkrelease.py --preview`, unpacks it to the rig's `.nds/`, adds `_source/`, stamps the release number, and copies the draft to `NDS-IQ.md`. A last build puts the dev site back, so a running `jekyll serve` can stay up.
3. **Start the app** in its own terminal (the table above). Rig 1 has no app yet.
4. **Start the agent:** open a new Claude Code session in the rig folder and paste:

   ```
   NDS-IQ.md is at the project root, and the NDS template is extracted at `.nds/`. Confirm that the file starts with `# NDS IQ`, then read it from top to bottom. This is the project's UI-layer rulebook. All NDS work runs by its rules. Set up NDS IQ in this project as its install section describes, then build the plan.
   ```

   This is the get-started setup prompt without its download step: the download would replace the draft with the published file.

### Either way

- Answer the review questions as a dev would. `whole plan` pacing tests the most.
- **Leave it alone.** The rig's NDS work is the agent's. Never fix its pages, plan or report.

## Review

When the run ends, open a session in this repo and ask for a review of the rig's `NDS-REPORT.md` and `NDS-PLAN.md`.

- **The report is self-reported.** Check each claim against the repo, and the rig's pages in a headless browser (`scripts/lib/browser.mjs`), before you fix anything. A claim can be wrong (run 8's late-rows search was a URL key mix-up), or worse than stated (run 8's Contact reset never ran at all).
- **Read the plan's Status column and open items.** A run that ends with rows still `In Progress`, or with the agent's own checks filed as open items, is a rules finding.
- **Fix at the source.** An `NDS.Init.audit()` rule first, then the doc or canon, and rules text last. A rules gap becomes a scenario (`SKILL.md`, Scenario files): the field FAIL stands in for the floor.

## Reset

```bash
python scripts/rig.py reset 5 --save
```

`--save` commits the run, without `.nds/`, to the next `runN-<date>` branch. The reset goes back to `main` at the `baseline` tag, deletes any branch the agent made (its commits are in the run branch when you save), and removes `.nds/` and `NDS-IQ.md` when a run left them. An unreleased run stages again before the next run.

## Gotchas

- **Leftover servers.** The agent often leaves a static server on `.nds/_site` (`python -m http.server`, a node server; ports seen: 4000, 4001, 4010, 8099). It locks `.nds/`, and the reset reports the path as still locked. Find it with `Get-NetTCPConnection -State Listen` and stop it by PID. Never stop a process by name, and leave the app's own server alone.
- **An empty locked `.nds/` folder** is fine: staging accepts it.
- **A background `jekyll serve` from a Claude session** survives `TaskStop`: the shell ends and ruby keeps running. Several servers then rebuild `_site` at once, and each rebuild fails with "end of file reached". List `ruby.exe` processes and stop yours by PID. A server whose parent is your own terminal is yours to keep.
- **Browser checks** run headless, through `scripts/lib/browser.mjs`. Never the interactive browser tools: they drive the owner's real browser.
