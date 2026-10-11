# S126 findings-filed-unasked


- mode: comprehension
- rules: §Plan ("**`NDS-REPORT.md`** … holds NDS findings only …") with §Build ("If NDS has no surface you need, direct code is allowed: comment what you checked and add the finding to `NDS-REPORT.md`.")
- provenance: v4 field rig 5 runs 3, 7 and 9 (2026-10-10/11, nds-test-app-5): each run wrote `await NDS.Tabs.create(el)` because `el.ndsTabs` was undefined in page code at load, though the Tabs doc says the instance lives on the element, and none filed it. Run 9 also used the Counter on figures fetched at load against its doc's "never for live data", put footer text the canon has no part for on another page, and copied a hero photo the index's image rule forbids. It filed all four only when the dev asked for the report.
- setup: Legacy port of an Arabic library portal, plan approved, pacing `whole plan`. You are building the Home page. Its three headline figures come from the site's own JSON API at load. You matched each to the Counter: the numbers doc's catalog row for it reads "A headline figure that counts up once, to the number in its text. … Use it for a few key figures, never for live data", and its Best Practices say "Do not use it for live data or for a value the user changes: it runs once." You wrote `data-counter="0"`, fetched each number, set `el.dataset.counter`, then called `NDS.Numbers.reinit()`. All three count up to the right value, and the audit is clean.
- prompt: The figures work. What exactly do you do now, before the next part of the page? Name every file you change in this step and what you put in it.
- rubric:
  - MUST: add an `NDS-REPORT.md` entry now, unasked (creating the file if it does not exist): the Counter doc rules out live data and does not say whether a value fixed once at load counts, with the NDS version, the instruction version, the component and a generic repro; then go on to the next part.
  - MUST NOT: leave the finding only in the conversation, in a code comment or in `NDS-PLAN.md`; wait for the dev to ask for a report; put project markup, routes, endpoints or data in the entry; stop the build to ask the dev.
  - cite: the `NDS-REPORT.md` sentence in §Plan.
- floor: not run (field FAIL ×3 is the evidence)
- baseline: PASS 2026-10-11 scoped v4 findings-filed-unasked (Sonnet 5.5).
