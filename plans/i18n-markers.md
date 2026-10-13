# i18n: markers in markup, one translator in core

Status: **design, owner picks made (2026-10-12), awaiting final OK.** Reviewed by two fresh Opus reviewers (design, runtime); their findings are folded in below. Follows `plans/localization.md` (the one pack, shipped). Ships in v2.0.0.

## Why

Markup is translated four different ways today, and nothing in a canon shows which words NDS translates:

| Way | Where | Problem |
|---|---|---|
| `NDS.i18n.load(component, scopes)` + `data-i18n` / `data-i18n-attr` | Accessibility, IPV (markup their scripts build) | Two attributes for one job, one with its own mini-syntax; keys have no section; the walk skips the scope root (IPV sets its dialog label by hand) |
| `data-i18n-name` / `-desc` / `-label` + arrays and a `js` table in its own file | Accessibility | A third marker family and a second strings table, for one component |
| `strings.set(el, attr, key)` | ~20 sites | Hidden in JS |
| "Fill the gap" (the author's value wins, the pack fills an empty one) | Upload, Empty, Tooltip, Autocomplete, Digital Stamp | An invisible contract: an agent cannot see which words NDS owns |

The rigs asked for what is missing: "the canon never marks which words to translate" (`TODO.md`, the i18n item in the rigs 1–4 held-back findings, repeated in rig 2 run 2).

## The model: three tools, one job each

| Need | Tool |
|---|---|
| A fixed word in markup: a canon, an author's page, or markup a script builds | a marker, `data-i18n="section.key"` (the text) or `data-i18n-{attribute}="section.key"`, translated by core |
| A word with `{vars}` written into an element, which must follow the pack: "Page 3", "Go to page 2", the Multiselect trigger's label | `words.set(el, target, key, vars)` |
| A word used inside JS: messages, announcements, composed strings | `words.text(key, vars, lang)` |

The content rule: a marked word is NDS's. Every unmarked word in a canon is an English sample, and the author writes it in the page language. Owner split 2026-10-12: UI words a component owns get markers; the User Feedback widget and the site shell (footer headings and links, skip link, Last Modified, breadcrumb Home, nav items) are content.

### The markers

```html
<span class="nds-label" data-i18n="upload.browse">Browse Files</span>
<button class="nds-modal-close" aria-label="Close" data-i18n-aria-label="modal.close">
<a title="Copy Link" data-i18n-title="share.copy"><span data-i18n="share.copy">Copy Link</span></a>
```

- One attribute per target, named for what it sets. `data-i18n` sets the text. `data-i18n-aria-label`, `data-i18n-aria-description`, `data-i18n-title`, `data-i18n-alt`, `data-i18n-placeholder` and `data-i18n-label` set that attribute. These six names are the allowlist; there is no other way to name an attribute, so nothing needs refusing. Values go through `nodeValue` / `setAttribute`, never HTML.
- The value is `section.key`. The section is the text before the first dot, `^[a-z][a-z0-9-]*$`; the key is `[A-Za-z0-9_]+`.
- `data-i18n` goes on an element that holds only the word. A marked element with element children (an icon beside a label) is skipped with a warning, and `check-i18n` fails it: the word would delete the icon.
- The markup keeps its English text and attribute values. They are the fallback when the pack fails, the baseline of the write guard, and what `check-i18n` compares with `en.json`.
- A key whose value has `{vars}` or is a plural cannot be a marker: `check-i18n` fails it, and core warns once. Use `set()`.
- To keep your own word, delete the marker.

### Core translates

- **Lookup:** the same chain as `text()`: `window.NDS_I18N` → the pack section → the script's JS defaults → the markup as written. A missing word is no error at run time (the pack may not be in yet, or the section's script not loaded): the markup's English shows, and `check-i18n` catches a misspelled section. Markup never builds a fetch URL.
- **Write guard:** core writes a word it never wrote, or one still holding the value core wrote last (a `WeakMap`); a word changed since stays. It never adds an attribute that is absent, and skips a word that already reads right, so an English page writes nothing. A changed marker value always writes. Not "equals `en.json`": an Arabic page never downloads `en.json`, and fetching it for the guard costs every Arabic page a request. So a marked word is NDS's: a script that writes its own word into an element removes or changes the marker (Accessibility's value display is such a case, step 2).
- **Text writes** go to `firstChild.nodeValue` when the only child is a text node, so a framework's text node survives and no childList record fires; otherwise `textContent`.
- **When:** the loader starts it from `initialize()`, so `data-nds-auto-init="false"` holds it with everything else. Once the pack settles: one walk of the document, the elements themselves and each `<template>`'s `content` included. Then `NDS.onDOMAdd` for markup added later and `NDS.onAttrChange` for a changed marker. Subscribed after the walk, so neither runs during the critical pass.
- **Mount:** `NDS.Init.mount(root)` and `refresh(root)` translate `root` before any component in it starts, so a component that reads its label at start reads the page language.
- **Settled:** core owns one promise that settles when the pack lands, fails, or core's own 3 s timer ends. It stamps `data-nds-i18n` on `<html>` in the same task as the walk's writes. The loader awaits this promise instead of its own `Promise.race` (`nds-loader.js` "NDS.i18n.pack()").
- **Frameworks** (`core/i18n.md` Frameworks, tested 2026-10-13 with React 18, Vue 3 and morphdom): markers stay in JSX and templates. A render that leaves a word alone keeps it; a word that changes with state changes its marker too, which the attribute observer sees. A morph writes the markup's English back, and `refresh(root)` restores it: the guard also accepts the markup word core replaced.
- Out of scope, as in `localization.md`: re-translating when `<html lang>` changes after load.

### First paint: a bar holds marked text

Owner decision 2026-10-08 stands: an Arabic page never flashes English. On a page whose language is set and is not English, an element with `data-i18n` (the text marker; attribute markers never hold) shows a static bar until `data-nds-i18n` lands:

```scss
// Main CSS. Own declarations, not the skeleton-fill mixin: no width change on release, no !important.
html[lang]:not([lang=""], [lang|="en"], [data-nds-i18n]) [data-i18n] {
    background: var(--nds-skeleton-fill);
    border-radius: var(--nds-skeleton-radius);
    color: transparent;
    animation: nds-i18n-release 0s 4s forwards; // releases with no script; verify keyframes reach color
}
```

- A page with no `lang` is English to JS (`NDS.lang`), and to this rule too.
- The pack usually lands before the reveal (2.7 s vs 3.4 s, `localization.md`), so most pages never paint the bar.
- No markers in text crit reveals before main CSS (the hero body): adding crit weight for it is ruled out (crit-size verdict).

### The packs (owner 2026-10-12, step 1b)

`assets/i18n/` is NDS's: every update replaces it, so a site never edits it. A site changes or adds words with `window.NDS_I18N` in its own script, loaded on every page before NDS's scripts. That also covers a language NDS does not ship: its pack is missing, so English shows, and the site's `NDS_I18N` holds its words.

- **No `en.json`.** English is written once: a script's words in its JS defaults, a marker's word in the markup. An English page downloads no pack.
- **Source and build.** NDS maintainers edit `_i18n/{lang}.json` (readable; Jekyll skips `_` folders). `node scripts/check-i18n.mjs --build` checks, then writes `assets/i18n/{lang}.json` minified, and `_data/i18n.json`, the word list `core/i18n.md` prints (section, key, English, Arabic). Without `--build`, the check fails when a built pack is out of date.
- **Banner.** JSON holds no comments, so a built pack's first key is `"_"`: the version, where it was built from, and "do not edit: change words with `window.NDS_I18N`". Core reads only sections, so it skips it.
- **The English list** the check holds every pack against: the JS defaults, plus each marker's markup word.

### The JS function

```js
// English defaults; assets/i18n/{lang}.json overrides them.
const words = NDS.i18n.strings('pagination', { page: 'Page {n}', prev: 'Previous page' });
words.text('prev');                                  // the word now
words.set(bullet, 'aria-label', 'page', { n: 3 });   // write now, again when the pack lands, unless changed since
words.load();                                        // Promise of the section, for code that must wait
words.ready();                                       // has the pack landed
```

- `t()` → `text()`, same arguments. `set(el, target, key, vars)` stays, only for words with vars written into an element; target is `'text'` or one of the six attributes. `load(lang)` resolves to the section and takes no scopes.
- Removed: `load(scopes)` (the hold is the CSS rule), `NDS.i18n.load(component, scopes)`, `NDS.i18n.apply()`, fill the gap.
- Kept: `NDS.i18n.format()`, `NDS.i18n.pack()`, `NDS.i18n.safeMerge()`, `window.NDS_I18N`, `NDS_I18N_PATH`, the JS defaults.
- A component never caches the text of a marked element at start: it reads it when it uses it (Filter's base label, Multiselect's trigger label, Copy's label).
- A builder of repeated rows writes the word `text()` gives together with the marker, so the guard has nothing to write.

## Rules that change

- **`check-i18n.mjs`:** every JS default key is in `en.json` with the same value; every `en.json` key that no JS default names is named by a marker somewhere; every marker key exists in `en.json` and the canon's English equals its value; no marker names a value with `{vars}` or a plural; no `data-i18n` element has element children. Scanned: canons, `_includes/`, and markup in `_js/`.
- **Accessibility joins the pack:** its words move into an `accessibility` section of `assets/i18n/{lang}.json` with flat keys (`accessibility.epilepsy_name`); `assets/i18n/accessibility/` is deleted (about 1.5 KB gz onto the pack, budget 12 KB). Its `js` table becomes a `strings()` call; its mode and visual arrays become markers; `applyComponentI18n` goes. `exclude_controls` left the pack (owner review 2026-10-12): letter spacing is dropped for any language whose script joins its letters, one rule in the script, not a word.
- **IPV:** its built overlay carries markers, its dialog label included (the walk covers the root).
- **Digital Stamp:** the text parts carry English and markers again. The address card's key is picked at run time, so the script writes it with `set()`. The `:empty` bars and the arrow gate on `data-nds-digital-stamp-initialized` go.
- **Fill the gap ends:** Upload's remove button, Empty's message and Tooltip's trigger are built by their scripts and carry markers. Words in `data-*` attributes (`data-empty-message`, `data-copy-label`) are read with `text()` when the attribute is absent.
- **Audit:** migration rows in `_data/migrations.yml` for the old markers; a warning for an empty `data-i18n-label` value (the 1.x Accessibility marker) and for a `data-i18n` value with no dot.

## Migration lines (v2.0.0 release notes)

Baseline v1.12.0. `NDS.i18n.strings()`, `t`/`set` and fill the gap never shipped (`4df112e3` and `2c1352d3` are after `v1.12.0`), so they need no line; the drafted release notes in `TODO.md` that describe them are rewritten. Shipped and changing:

- `NDS.i18n.load(component, scopes)` and `NDS.i18n.apply()` are removed. Markers translate themselves; to wait for a section's words, `await NDS.i18n.strings(section, {}).load()`.
- A custom Accessibility panel (a copy in `<template class="nds-panel-template">`) renames its markers: `data-i18n="key"` → `data-i18n="accessibility.key"`, `data-i18n-attr="aria-label:key"` → `data-i18n-aria-label="accessibility.key"`, and `data-i18n-name`, `-desc`, `-label` → `data-i18n="accessibility.…"`. `NDS.Init.audit()` names each one.
- `assets/i18n/accessibility/{lang}.json` moves into the `accessibility` section of `assets/i18n/{lang}.json`. A site that edited or added one moves its words there.
- New: `data-nds-i18n` on `<html>`, set once the page's words are in.

## Order

1. **Core** (main session): the lookup, the guard, the walk, both subscriptions, the settled promise and its stamp, mount and refresh translating first, `t` → `text` (one script), `set` kept; the loader awaits the promise; the CSS hold; `check-i18n.mjs`; the core banner. One fresh Opus review of core, with the owner's OK. Commit. The removals (`NDS.i18n.load(component, scopes)`, `apply()`, `load(scopes)`) land with their last callers in steps 2 and 3, and the docs in step 6.
1b. **The packs** (main session): `_i18n/` source, `--build`, the banner key, `en.json` gone, core reads no English file, the word list in `core/i18n.md`, `AGENTS.md`'s command line.
2. **Accessibility and IPV** (main session, done 2026-10-12): files, packs, docs. Accessibility's words joined the pack (+0.9 KB gz on an Arabic page, one request fewer when the panel opens; owner pick), its script stays an add-on. `apply()`, `data-i18n-attr` and the own-file path are gone; `load(scopes)` stays for step 3. Core warns at run time on an empty marker or a value with no dot (the 1.x forms), `check-i18n` fails them in markup, and the audit's migration rule now reads `<template>` contents, where a custom panel waits. From the step-1 code review, left as is: a marker change rewrites every marker on that element, and the hold's `animation` replaces a marked element's own animation until the stamp.
3. **The `set()` and fill-the-gap sites** (main session, done 2026-10-12: `set()` stamps the marker for a word with no `{vars}`, so its callers needed no change; `load(scopes)` and `_roots` gone; Pagination marks prev/next/more/jump and re-labels only page numbers; Digital Stamp swaps `.gov_` markers for the site's domain): Multiselect, Rating, Swiper, Pagination (`_relabel` becomes `set()`), Expandable (its toggle changes the marker), Empty, Tooltip, Upload, Autocomplete, Filter, Copy, Digital Stamp. Dead SCSS goes: `_empty.scss`'s hold, `_digital-stamp.scss`'s bars and arrow gate.
4. **The UI words** (Sonnet agents, one batch per component group, a written recipe): markers in every canon, include and example, the `en`/`ar` keys, the doc rows. A: hidden labels (~35): clear, number +/−, Open calendar, modal and panel close and resize, swiper Previous/Next, Show more, OTP digits, Copy code, Sort by, nav and side menu toggles, landmark labels, Toggle dark mode. B: visible UI words (~55): Share, Upload, Filter, Multiselect, Selection and Records, Tables (Columns, Export), TOC On this page, Rating. The main session checks each batch: the diff, and an Arabic page in the browser.
   Done 2026-10-12 in 4 Sonnet batches (≈50 words, 44 sections). Also: Tooltip carries a `title` marker into its balloon and label; a bare `data-copy-label` flashes the pack's "Copied" (Share uses it). Left for step 6: the Copy and Share pages (bare `data-copy-label`, Share's practice line and attribute rows), and the skips: OTP "Digit n of N" (no script writes it), `(<b>Select all</b>)` in the selection examples, the mainnav search button, `docs_canon.rb` "Copy code example", the guides' copy buttons, `events/` pages.
5. **Speed:** `nds-perf` on the Arabic home page, Forms, and a 3,000-row table, before vs after. No slower reveal or LCP, or it does not ship.
   Done 2026-10-13, Arabic copies of each page, `4060fb07` vs `5b2c886a`, interleaved. Home over 8 rounds: reveal 3.47 → 3.50 s, LCP 1.78 → 1.86 s, inside the ±0.3 s run spread; a low-priority pack fetch moved nothing. Forms: reveal 2.94 → 3.05 s, LCP 2.14 → 2.08 s. 3,000-row table: reveal 32.4 → 30.2 s, LCP 52.1 → 51.4 s. Passes.
6. **Close** (done 2026-10-13: release notes rewritten in `TODO.md` and `CHANGELOG.md`; Copy, Share and i18n pages; the audit was already covered; no NDS IQ sentence: rule 3 already keeps `data-*` attributes, and `core/i18n.md` now says to keep the markers): `_data/migrations.yml` and the audit, `assets/i18n/README.md` folded into `core/i18n.md`, every touched component page and banner, the release notes, the NDS IQ draft line (through `nds-iq-eval`). `TODO.md` gets an item for this plan once it is approved.
</content>
</invoke>
