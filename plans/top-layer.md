# Top layer: popover and dialog

Owner decisions (2026-10-16): do it before v2.0.0 · speed is not the reason · Modal and Panel stay separate components that share one internal core · a major may change markup when the benefit beats the cost, with a Migration row · Main Navigation goes last.

**Verdict (2026-10-16).** Steps 1–3 before v2: Dropmenu and Tooltip; Modal on `<dialog>`; every Panel on `<dialog>`. Steps 4 and on are judged again, each on its own benefit and cost, once 1–3 have shipped.

**Start here.** (1) In the playground demo, prove `popover` on a `<dialog>` next to `showModal()`, and the look of a Modal over a modal Panel (stacked dim layers). (2) Then step 1. The demo is the "Popover and dialog: old vs new" section at the end of `playground.md`: four old-vs-new rows (clipping card, dark area, a listener on the box, Modal vs `<dialog>`) with the working CSS for the popover reset, `@starting-style` open animations, the `.nds-card` reset on `<dialog>` and the phone bottom sheet.

## Why

NDS moves menus, tooltips and FABs to `<body>` so nothing clips them. The browser's top layer (`popover`, `<dialog>`) does the same without the move. Measured in the `playground.md` demo (Chrome and WebKit):

| | Today | Top layer |
|---|---|---|
| A menu inside a clipping card | moves to `<body>` | stays in place, not clipped |
| A menu inside a dark area | opens light: the move loses `data-theme` (a bug today) | stays dark |
| A listener on the box around a menu | hears 0 item clicks | hears every click |
| Opening a menu, CPU ×6.6, median of 20 | 72 ms | 56–64 ms |

The speed gain is small: most of a click's cost is the page-wide handlers (`TODO.md`, the ~20 ms per click entry). The gains are the dark-area bug, normal events and `closest()`, natural Tab order, and the code it deletes: `NDS.portal`, `unportal`, `needsPortal`, the CSS-variable snapshot, `NDS.stackingZ`, the click re-dispatch, the `<body>` lookups, and most of `NDS.relocate`'s method patches.

## Order

1. **Dropmenu and Tooltip.** One change reaches about 12 components. `data-portal` and `data-no-portal` stop doing anything: removed in v2 with Migration rows.
2. **Modal on `<dialog>`.** `showModal()` makes the page behind `inert`. Today's `NDS.trapFocus` only keeps Tab inside: a screen reader's swipe or reading cursor still reaches the page behind the modal, an accessibility gap the dialog closes. It also removes Modal's own trap, its Escape handling and its Backdrop use. Migration row: `<div class="nds-modal" role="dialog" aria-modal="true" aria-hidden="true" hidden>` becomes `<dialog class="nds-modal">`, and the migration audit flags a leftover `div.nds-modal`.
3. **Every Panel on `<dialog>`.** One markup for the three kinds, `<dialog class="nds-panel">`: a modal Panel opens with `showModal()` (inert page, as Modal), a plain or static one carries `popover` (`auto` / `manual`) and leaves the page usable. Prove `popover` on a `<dialog>` next to `showModal()` in the playground first; if it misbehaves, plain and static Panels stay `<div popover>` and only modal Panels become `<dialog>`.
4. **FAB.** It stays where it is authored and floats in the top layer; NDS works out the stacking offsets. `.nds-fab-dock`, `data-fab-dock-pos` and `NDS.Fab.dock()` change: Migration rows.
5. **Main Navigation menus and drawer.** It is on every page and in the first paint. Popover replaces the open set, `closeAll()`, `handleDocumentClick`, the `[hidden]` dance and most of the 14 `overflow: unset` / `!important` overrides. More, phone mode, pinned items, wheel and drag scroll, and the fit shift stay.
6. **Side Menu (the phone drawer) and Image Popup Viewer.** Side Menu works like a Panel, the viewer like a Modal. With them moved, Backdrop has no user left.

## Backdrop

`_js/nds-backdrop.js` (about 200 lines, no doc page, no consumer markup) draws one shared dim layer, keeps a stack of owners, routes Escape and click-outside to the owner, and locks scroll through `NDS.scrollLock`. Users today: Modal, modal Panels, Main Navigation, Side Menu, Image Popup Viewer.

| Part | After the move |
|---|---|
| Dim layer | native `::backdrop` per dialog |
| Owner stack | native top-layer order |
| Escape | native on `<dialog>` |
| Click-outside | a few lines of JS (`closedby` is not in every browser yet) |
| Scroll lock | stays: `<dialog>` does not lock scroll; Modal and Panel call `NDS.scrollLock` directly |

After steps 2–3 Backdrop serves Main Navigation, Side Menu and the viewer only; after steps 5–6 it is deleted. No Migration row: nothing public names it.

**Stacked dim layers.** Each open dialog brings its own `::backdrop`, so a Modal over a modal Panel shows two layers and the page reads darker than today's one shared layer. NDS marks the lower dialog and CSS makes its `::backdrop` clear; check the look in the playground.

## Step 1 in detail: Dropmenu and its users (mapped 2026-10-16)

Today a menu stays in place unless an ancestor clips it (a modal, a table's scroll wrapper) or the wrapper has `data-portal`; only then it moves to `<body>`. Every user therefore handles two worlds, and Pagination, Filter, Sort and Tables carry code for the moved one. With a popover there is one world: the menu stays where it is authored.

**`popover="manual"`, not `auto`.** Autocomplete, Custom Select, Date Picker, Time Picker and Multiselect open from a field; `auto` would close on a click back into it. Dropmenu keeps its own outside-click and Escape rules, and the behavior does not change.

**`nds-dropmenu.js`.** Removed: `_decidePortal` and `_isClipped` (an ancestor style walk on every open), the `NDS.portal` call and the `PORTAL_VARS` snapshot, the `_stackZ` lift with `BASE_Z` and `NAV_Z`, the click re-dispatch, the second Escape listener on the menu, and the `position: absolute` branch of `applyPosition`. Changed: open and close call `showPopover()` and `hidePopover()` (close still waits for the transition: WebKit), Dropmenu adds `popover` at init so markup does not change, scroll tracking runs for every open menu, and the `%`-to-px width conversion runs on every open. Kept: keyboard, picker mode, search, `data-delay` with `nds:dropmenu:prepare`, `<template>` menus, the flip and clamp math. `from()` and `menuOf()` stay as public API.

| User | Change | Risk |
|---|---|---|
| Pagination | Its two click handlers read `e.ndsDropmenuItem \|\| e.target`; the click now arrives as it does for an in-place menu. `NDS.queryAll` and `NDS.closest` become plain DOM calls. Per-page picker and lazy ellipsis menu unchanged | Low |
| Filter | Four portal-aware lookups become plain DOM calls; menu fields stay inside their `<form>` | Low |
| Sort | `_resolveLike(deep)` and `_syncDropmenuTriggerIcon` become plain DOM calls | Low |
| Tables | `rowFor` and `rowToggles` drop the `_ownerDropmenu` / `_ownerMenu` walk | Low |
| Editor | `data-dropmenu-portal` does nothing; `menuOf` calls keep working; the focus and undo fix of `9f8e4409` can no longer regress | Low |
| Date Picker | Month and year menus nest inside the calendar menu: a closing menu must close the open menus inside it, or they float on in the top layer. `--dropmenu-width: 100%` needs the px conversion | Medium |
| Autocomplete, Custom Select, Multiselect, Time Picker | `manual` keeps their field behavior; their `%` widths need the px conversion | Low |
| Breadcrumb | Its menu CSS scoped under the breadcrumb now always applies | Gain |
| Share, Accessibility, Rating, Export | A `close()`, an `isOpen`, a class, plain lookups | None |
| Tooltip | Moves in the same step: it also calls `NDS.portal`, which goes only when both have moved | Medium |

**Core after the step.** Removed: `NDS.portal`, `NDS.unportal`, `NDS.stackingZ`, `_portaledCount` and the `<body>` sweep in `NDS.queryAll`, `NDS.querySelector` and `NDS.closest` (none of them documented). `NDS.relocate` stays for FAB and the pinned nav items until steps 4 and 5.

**Migration rows.** `data-portal` and `data-no-portal` (in `dropmenu.md` and about eight other pages), Editor's `data-dropmenu-portal`, and the click event's `ndsDropmenuItem` and `ndsDropmenuRedispatch`. The portal-safe menu styling rule in `AGENTS.md` shrinks to the `.nds-{component}-menu` naming.

**Size.** About three to four sessions: Dropmenu and its CSS, Tooltip, the users' lookup cleanup, Date Picker's nested menus, docs and audit and `AGENTS.md`, then every user in both themes in Chrome and WebKit, with `doc-check.mjs` on each page.

## Modal and Panel: one core

Two public components with their own uses and options; the markup and API do not merge. Inside, one shared helper owns open, close with the exit animation, the scroll lock, the events and the static option. The browser owns the top layer, Esc, click-outside, the backdrop, the focus trap of a modal and the focus return.

## Open decisions

- **Modal markup:** decided 2026-10-16, `<dialog>` (step 2): a major may change markup, and the inert page is an accessibility fix the `<div>` cannot give.
- **`popover` on `<dialog>` with `showModal()`:** to prove in the playground before step 3.
- **Layer order:** a top-layer element covers everything outside it, Main Navigation and the cookie banner too. Panels keep `--panel-top`; a nav menu opened over a panel needs step 5.

## Known costs

- Safari 17 and Firefox 125 or newer. Older browsers get a menu that can clip; nothing breaks.
- Close animations: `overlay` is Chrome only, so WebKit drops the element at once. Keep the JS `closing` state, as today.
- Position: Dropmenu keeps its own JS placement (flip, clamp, cursor anchor, max-height) for every menu, written as `position: fixed` coordinates. CSS anchor positioning (`position-area`, Safari 26 and later) only placed the demo's menus; it cannot clamp a list's height, so it is not the production path.
- `.nds-card` overrides the dialog's `position`, `margin` and closed `display`: a reset ships with the dialog.
- A `<form method="dialog">` inside a card needs `nds-form`, or the card loses its layout.

## Older Safari (tested 2026-10-16)

The demo ran on WebKit 17.0, 17.4, 18.0 and 26.6: the WebKit builds of Playwright 1.38.1, 1.44.1, 1.48.2 and the repo's own. Each older `playwright-core` sits in its own folder, and its `cli.js install webkit` fetches the matching build. This is the WebKit engine on Windows, not Apple's Safari app: good for CSS and DOM support, not for every Safari quirk.

| | 17.0 | 17.4 | 18.0 | 26.6 |
|---|---|---|---|---|
| Menu opens, not clipped, under its button | yes (JS) | yes (JS) | yes (JS) | yes (CSS) |
| Menu and dialog fade in, sheet slides up | no, they appear at once | yes | yes | yes |
| Dialog centered; phone bottom sheet | yes | yes | yes | yes |
| Esc and the `method="dialog"` buttons close it | yes | yes | yes | yes |
| Close animation without JS | no | no | no | no |
| Page errors | none | none | none | none |

So 17.0 is a working floor: the open animations need `@starting-style` (17.4 and later), and anchor positioning needs 26, below which the JS fallback places the menu 4 px under its button. Before v2 ships, one real-device pass on Safari and iOS (a cloud device service) signs it off.

## Checks per step

`doc-check.mjs` on each touched page (both themes), `check-frameworks.mjs` and `check-init-destroy.mjs`, a WebKit run, and the menu-open timing against the old code.

**Harnesses.** The three one-off harnesses behind this plan lived in `tmp/`, which is disposable; rebuild them from these notes when a step needs them.
- **Menu-open timing:** Playwright `locator.click()` (it waits for a smooth scroll to settle; a raw `mouse.click` misses under throttling), CPU ×6.6 through CDP `Emulation.setCPUThrottlingRate`, Event Timing entries (`type: 'event'`, `durationThreshold: 16`) grouped by `interactionId` with the slowest entry as the interaction, 20 runs interleaving old and new, every menu closed by script between runs, and a check that each click really opened its menu. Remove `#nds-cookies-panel` first: it covers the lower rows.
- **Older WebKit:** `npm install playwright-core@1.38.1` (WebKit 17.0), `@1.44.1` (17.4) or `@1.48.2` (18.0) into its own folder, then `node node_modules/playwright-core/cli.js install webkit`; import that folder's `playwright-core` and run the same page checks.
- **Close animation frames:** set `--nds-transition-speed` to `2` on `<html>`, close the dialog or popover, and screenshot at 0, 250, 500, 1000 and 1500 ms in Chrome and WebKit.
