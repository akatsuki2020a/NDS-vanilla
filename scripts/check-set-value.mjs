// NDS.setValue: every value NDS writes reaches forms and framework bindings.
//
//   REACT    a controlled React input and textarea see NDS.setValue (onChange runs,
//            the value survives the re-render); the old write-then-dispatch does not.
//   PICKERS  each component's write fires input + change on the field a binding
//            reads, and a carrier is written before the visible field's events.
//
//   node scripts/check-set-value.mjs [baseUrl]
// Defaults to the dev server. Start it with `bundle exec jekyll serve` if down.
import { launch } from './lib/browser.mjs';

const BASE = (process.argv[2] || 'http://localhost:4002/NDS-vanilla').replace(/\/$/, '');
const browser = await launch();
let failed = 0;
const ok = (name, pass, detail = '') => {
    if (!pass) failed++;
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};

async function open(path) {
    const page = await browser.newPage();
    page.on('pageerror', (e) => ok(`no page error on ${path}`, false, e.message));
    await page.goto(`${BASE}/${path}`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.NDS?.setValue && document.documentElement.hasAttribute('data-nds-ready')
        || window.NDS?.setValue, null, { timeout: 15000 });
    // Log input/change in dispatch order, named by the field's own class (or type).
    await page.evaluate(() => {
        window.__log = [];
        for (const t of ['input', 'change']) document.addEventListener(t, (e) => {
            const el = e.target;
            const own = Array.from(el.classList || []).find((c) => c !== 'nds-input');
            window.__log.push(`${t}:${own || el.type || el.tagName}`);
        }, true);
    });
    return page;
}
const log = (page) => page.evaluate(() => window.__log.splice(0));

// ---- REACT ---------------------------------------------------------------
{
    const page = await open('components/forms.html');
    for (const lib of ['react@18.3.1/umd/react.production.min.js', 'react-dom@18.3.1/umd/react-dom.production.min.js']) {
        await page.addScriptTag({ url: `https://unpkg.com/${lib}` });
    }
    const res = await page.evaluate(async () => {
        const h = React.createElement, out = {};
        const host = document.body.appendChild(document.createElement('div'));
        function Field({ tag, id }) {
            const [v, setV] = React.useState('');
            return h(tag, { id, value: v, onChange: (e) => { out[id] = (out[id] || 0) + 1; setV(e.target.value); } });
        }
        ReactDOM.createRoot(host).render(h('div', null,
            h(Field, { tag: 'input', id: 'r-new' }), h(Field, { tag: 'textarea', id: 'r-area' }), h(Field, { tag: 'input', id: 'r-old' })));
        const tick = () => new Promise((r) => setTimeout(r, 50));
        await tick();
        NDS.setValue(document.getElementById('r-new'), 'hello');
        NDS.setValue(document.getElementById('r-area'), 'line');
        const old = document.getElementById('r-old');
        old.value = 'hello';
        old.dispatchEvent(new Event('input', { bubbles: true }));
        old.dispatchEvent(new Event('change', { bubbles: true }));
        await tick();
        return { out, v: ['r-new', 'r-area', 'r-old'].map((id) => document.getElementById(id).value) };
    });
    ok('React input: onChange runs and the value stays', res.out['r-new'] >= 1 && res.v[0] === 'hello', JSON.stringify(res));
    ok('React textarea: onChange runs and the value stays', res.out['r-area'] >= 1 && res.v[1] === 'line');
    ok('A/B: the old write-then-dispatch is lost to React (no onChange)', !res.out['r-old']);
    await page.close();
}

// ---- FORMS ----------------------------------------------------------------
{
    let page = await open('components/switch.html');
    // Switch: a click flips the checkbox and fires input + change on it.
    const sw = await page.evaluate(() => {
        const track = document.querySelector('.nds-switch-track');
        const box = track?.closest('.nds-form-control')?.querySelector('input[type="checkbox"]');
        if (!box) return null;
        const before = box.checked;
        window.__log.length = 0;
        track.click();
        return { flipped: box.checked !== before, log: window.__log.slice() };
    });
    ok('Switch: click flips it and fires input + change', sw && sw.flipped
        && sw.log.filter((l) => /checkbox|switch/.test(l)).length >= 2, JSON.stringify(sw));
    await page.close();
    page = await open('components/forms.html');

    // Clear button: empties the field with input + change.
    const clr = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('.nds-form-action .nds-clear'))
            .find((b) => b.closest('.nds-form-control')?.querySelector('input:not([type="hidden"])'));
        if (!btn) return null;
        const input = btn.closest('.nds-form-control').querySelector('input:not([type="hidden"])');
        NDS.setValue(input, 'abc');
        window.__log.length = 0;
        btn.click();
        return { value: input.value, log: window.__log.slice() };
    });
    ok('Clear button: empties the field, fires input + change', clr && clr.value === ''
        && clr.log.some((l) => l.startsWith('input:')) && clr.log.some((l) => l.startsWith('change:')), JSON.stringify(clr));
    await page.close();
}

// ---- CUSTOM SELECT ---------------------------------------------------------
{
    const page = await open('components/custom-select.html');
    const res = await page.evaluate(() => {
        const fc = Array.from(document.querySelectorAll('.nds-form-control'))
            .find((f) => f.querySelector('.nds-select-input') && f.querySelector('.nds-select-value'));
        const opt = (fc._customSelectDropdown || fc).querySelectorAll('.nds-select-option')[1]
            || document.querySelector('.nds-select-option');
        window.__log.length = 0;
        const done = NDS.CustomSelect.setValue(fc, opt.dataset.value);
        return { done, hidden: fc.querySelector('.nds-select-value').value, want: opt.dataset.value, log: window.__log.slice() };
    });
    ok('Custom Select: value field holds the pick', res.done && res.hidden === res.want, JSON.stringify(res));
    ok('Custom Select: value field fires first, then the visible field',
        res.log.join() === 'input:nds-select-value,change:nds-select-value,input:nds-select-input,change:nds-select-input', res.log.join());
    await page.close();
}

// ---- DATE PICKER ----------------------------------------------------------
{
    const page = await open('components/date-picker.html');
    const res = await page.evaluate(() => {
        const input = document.querySelector('.nds-date-input');
        const dp = NDS.DatePicker.create(input);
        window.__log.length = 0;
        dp.selectDate(new Date(2026, 9, 15));
        dp.updateInput();
        const a = { value: input.value, log: window.__log.splice(0) };
        dp.clearSelection();
        return { a, cleared: input.value, log: window.__log.slice() };
    });
    ok('Date Picker: a pick writes the field with input + change', res.a.value
        && res.a.log.includes('input:nds-date-input') && res.a.log.includes('change:nds-date-input'), JSON.stringify(res.a));
    ok('Date Picker: clear empties it with input + change', res.cleared === ''
        && res.log.includes('input:nds-date-input') && res.log.includes('change:nds-date-input'), res.log.join());
    await page.close();
}

// ---- OTP ------------------------------------------------------------------
{
    const page = await open('components/otp.html');
    const res = await page.evaluate(() => {
        const group = Array.from(document.querySelectorAll('.nds-otp-group')).find((g) => g.querySelector('.nds-otp-value'));
        if (!group) return null;
        window.__log.length = 0;
        NDS.OTP.setValue(group, '1234');
        return { value: group.querySelector('.nds-otp-value').value, log: window.__log.filter((l) => l.endsWith('nds-otp-value')) };
    });
    ok('OTP: .nds-otp-value gets the digits with input + change', res && res.value.startsWith('12')
        && res.log.join() === 'input:nds-otp-value,change:nds-otp-value', JSON.stringify(res));
    await page.close();
}

// ---- TIME PICKER ----------------------------------------------------------
{
    const page = await open('components/time-picker.html');
    const res = await page.evaluate(() => {
        const tp = Array.from(document.querySelectorAll('.nds-time-picker')).find((t) => t.querySelector('.nds-time-value'));
        window.__log.length = 0;
        NDS.TimePicker.setValue(tp, '09:30');
        return { carrier: tp.querySelector('.nds-time-value').value, field: tp.querySelector('.nds-time-input').value,
            log: window.__log.slice() };
    });
    ok('Time Picker: carrier fires first, then the field',
        res.carrier.startsWith('09:30') && res.log.join() === 'input:nds-time-value,change:nds-time-value,input:nds-time-input,change:nds-time-input',
        JSON.stringify(res));
    await page.close();
}

// ---- EDITOR ---------------------------------------------------------------
{
    const page = await open('components/editor.html');
    await page.waitForFunction(() => document.querySelector('.nds-editor')?.ndsEditor, null, { timeout: 15000 });
    const res = await page.evaluate(() => {
        const ed = document.querySelector('.nds-editor');
        const area = ed.ndsEditor.source;
        NDS.setValue(area, '<p>From a script</p>');
        return ed.querySelector('[contenteditable]').textContent;
    });
    ok('Editor: NDS.setValue on the textarea refills the surface', res.includes('From a script'), res.slice(0, 60));
    await page.close();
}

// ---- AUTOCOMPLETE ---------------------------------------------------------
{
    const page = await open('components/autocomplete.html');
    const input = page.locator('.nds-form-container[data-url] input:not([type="hidden"])').first();
    await input.scrollIntoViewIfNeeded();
    await input.click();
    await input.pressSequentially('ser', { delay: 30 });
    const item = page.locator('.nds-autocomplete-menu .nds-dropmenu-item, .nds-autocomplete-menu li').first();
    await item.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    await page.evaluate(() => { window.__log.length = 0; });
    const visible = await item.isVisible().catch(() => false);
    if (visible) await item.click();
    const res = await page.evaluate(() => ({ log: window.__log.slice(), value: document.activeElement?.value }));
    ok('Autocomplete: a pick fires input + change', visible
        && res.log.some((l) => l.startsWith('input:')) && res.log.some((l) => l.startsWith('change:')), JSON.stringify(res));
    await page.close();
}

await browser.close();
console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
