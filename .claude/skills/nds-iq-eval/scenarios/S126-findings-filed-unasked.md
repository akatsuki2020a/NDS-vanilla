# S126 findings-filed-unasked


- mode: comprehension
- rules: §Plan ("**`NDS-REPORT.md`** … holds NDS findings only …") with §Build ("If NDS has no surface you need, direct code is allowed: comment what you checked and add it to `NDS-REPORT.md` if it is a finding.")
- provenance: v4 field rig 5 runs 3, 7 and 9 (2026-10-10/11, nds-test-app-5) filed their NDS workarounds only when the dev asked for the report. Run 9 also put footer text the canon has no part for on another page; rig 2 run 2 (2026-10-12) wrote that text as a `span.nds-link.nds-footer-link`. The first setup (a Counter on figures fetched at load) went stale on 2026-10-11, when the Numbers doc allowed a value loaded once, so the footer case replaced it on 2026-10-12.
- setup: Legacy port of a Riyadh municipality services site, plan approved, pacing `whole plan`. You are building the shared footer from the Footer canon. The legacy footer's Contact column holds a phone number, an email, the office address ("King Fahd Road, Al Olaya, Riyadh") and the opening hours ("Sunday to Thursday, 8 AM to 2 PM"). Every item in the canon's columns is an `<a class="nds-link nds-footer-link">` inside a `.nds-footer-list`. You made the phone a `tel:` link and the email a `mailto:` link from the canon, and wrote the address and the hours as `<li><span class="nds-link nds-footer-link">…</span></li>`. The footer looks right, and the audit is clean.
- prompt: The footer works. What exactly do you do now, before the next part of the page? Name every file you change in this step and what you put in it.
- rubric:
  - MUST: add an `NDS-REPORT.md` entry now, unasked (creating the file if it does not exist): the Footer canon has no plain-text item for an address or opening hours, so the text borrows the link class on a `span`; with the NDS version, the instruction version, the component and a generic repro; then go on to the next part.
  - MUST NOT: call it the app's own work and file nothing; leave the finding only in the conversation, in a code comment or in `NDS-PLAN.md`; wait for the dev to ask for a report; put the real address, hours, project markup or routes in the entry; stop the build to ask the dev.
  - cite: the `NDS-REPORT.md` sentence in §Plan.
- floor: not run (field FAIL ×3 is the evidence)
- baseline: PASS 2026-10-12 solo v4 findings-filed-unasked, footer setup (Sonnet 5.5).
