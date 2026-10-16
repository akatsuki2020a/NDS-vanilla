# Brief: Shop Licenses Portal

From the product owner, Al-Waha Municipality.

## Who uses it

- **Shop owners** apply for a shop license, upload their documents and follow the application.
  Most of them use a phone.
- **Municipality reviewers** go through the incoming applications and decide on each one. They work
  on a desktop, all day, so the queue has to be quick to scan.

## Languages

Arabic first, with English. Every page exists in both. Arabic reads right to left.

## Pages

1. **Home**: what the portal does, how to get a license in four steps, a few featured activities,
   and a call to start an application.
2. **Activities guide**: all business activities with search and a category filter, six per page.
   Each activity has a detail page with the fee and requirements and a button to apply for it.
   The activity page shows the first lines of the description, with a way to read the rest.
3. **Sign in**: username and password. After sign in, the shop owner lands on their applications.
   The password field can show what was typed.
4. **My applications**: the owner's applications with their status. A clear empty state for new
   users, with a button to start the first application.
5. **New application**: the owner fills in the shop details, location, documents and contact.
   The applicant checks everything before submitting: a review step shows all the answers, with a
   way back to fix any of them. Errors must be easy to find and fix, especially on a phone.
6. **Application detail**: all the data, the status history, the inspection date when there is one,
   the rejection reason when there is one, and the uploaded files.
7. **Review queue** (staff): all applications, 10 per page, filtered by status, with a search by
   reference or shop name and a count for each status. Reviewers work through the queue by status.
   On phones, the district and status filters use the phone's own picker (the reviewers asked for it).
8. **Review an application** (staff): the application data and history, and a decision form:
   start review, schedule an inspection, approve, or reject with a reason.
9. **Error pages**: not found, no access, and server error.
10. **Board** (staff): one column per status, with the newest 20 applications in each and a count. A card moves to
    another column through a small form (an inspection date or a note when the move needs one). Shop names on the cards
    stay on one line. The board can also be shown as a compact list in the same place, without leaving the page.
    Icon buttons explain themselves on hover.
11. **Inspection week** (staff): the scheduled inspections for one week, Sunday to Saturday, with links to the
    previous week, the next week and this week. Each inspection shows its time, shop and district and opens the
    application. On a phone the week scrolls sideways.

## Notes

- Signed-in users are signed out after 15 minutes idle. Warn them a minute before, with a way to stay signed in.
- The logo is not ready. Use a placeholder.
- Every visible string is already written in `licenses/copy.py`, in both languages. There is no
  other content beyond that file and the data.
- The backend is finished: see `README.md` for the views, templates, and what each template receives.
