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

// ---- BINDINGS -------------------------------------------------------------
// A listener on the field stands in for v-model / ngModel: it keeps the value each
// input or change event carries. A field NDS rewrites must end with the binding
// holding what the field shows.
{
    const page = await open('components/forms.html');
    // The doc demos live in canon blocks, so the fields are built here from the canon markup.
    await page.evaluate(() => {
        const field = (input, pre = '', post = '') => '<div class="nds-form-container"><div class="nds-form-control">'
            + pre + input + post + '</div></div>';
        const step = (dir, side) => '<div class="nds-form-action nds-' + side + '"><button class="nds-btn nds-subtle nds-number-'
            + dir + ' nds-icon-only" type="button" aria-label="' + dir + '"><i class="nds-icon nds-hgi-plus-sign"></i></button></div>';
        const box = document.createElement('div');
        box.id = 'sv-fixtures';
        box.innerHTML = field('<input type="tel" id="sv-phone" class="nds-input nds-phone">')
            + field('<input type="text" id="sv-iban" class="nds-input nds-iban" maxlength="34">')
            + field('<input type="text" id="sv-num" class="nds-input nds-center" inputmode="numeric" value="1" min="1" max="20" step="1">',
                step('decrement', 'prefix'), step('increment', 'suffix'));
        document.querySelector('.nds-section-body').prepend(box);
        NDS.Init.mount(box);
    });
    const bind = (sel) => page.evaluate((sel) => {
        const el = document.querySelector(sel);
        el.scrollIntoView({ block: 'center' });
        el.__bound = null;
        for (const t of ['input', 'change']) el.addEventListener(t, () => { el.__bound = el.value; });
    }, sel);
    const bound = (sel) => page.evaluate((sel) => {
        const el = document.querySelector(sel);
        return { shown: el.value, bound: el.__bound };
    }, sel);
    const same = (r) => r.bound === r.shown;

    await bind('#sv-phone');
    await page.locator('#sv-phone').focus();
    await page.keyboard.insertText('0501');
    let r = await bound('#sv-phone');
    ok('Phone: a pasted number reaches the binding stripped', same(r) && r.shown === '501', JSON.stringify(r));

    await bind('#sv-iban');
    await page.locator('#sv-iban').focus();
    await page.keyboard.insertText('sa03 80');
    r = await bound('#sv-iban');
    ok('IBAN: a pasted value reaches the binding cleaned', same(r) && r.shown === 'SA0380', JSON.stringify(r));

    await bind('#sv-num');
    await page.locator('#sv-num').fill('70');
    await page.locator('#sv-num').blur();
    r = await bound('#sv-num');
    ok('Number: a blur clamp reaches the binding', same(r) && r.shown === '20', JSON.stringify(r));

    // React, password: a pasted Arabic letter is stripped, and React's state follows.
    for (const lib of ['react@18.3.1/umd/react.production.min.js', 'react-dom@18.3.1/umd/react-dom.production.min.js']) {
        await page.addScriptTag({ url: `https://unpkg.com/${lib}` });
    }
    await page.evaluate(() => {
        const h = React.createElement;
        const host = document.querySelector('.nds-section-body').appendChild(document.createElement('div'));
        function Pw() {
            const [v, setV] = React.useState('');
            return h('div', { className: 'nds-form-container' },
                h('div', { className: 'nds-form-control' },
                    h('input', { id: 'r-pw', type: 'password', className: 'nds-input', value: v, onChange: (e) => setV(e.target.value) })),
                h('span', { id: 'r-pw-state' }, v));
        }
        ReactDOM.createRoot(host).render(h(Pw));
    });
    await page.locator('#r-pw').waitFor();
    await page.locator('#r-pw').focus();
    await page.keyboard.insertText('abcب');
    await page.waitForTimeout(50);
    r = await page.evaluate(() => ({ shown: document.getElementById('r-pw').value, state: document.getElementById('r-pw-state').textContent }));
    ok('Password: React state drops a pasted Arabic letter', r.shown === 'abc' && r.state === 'abc', JSON.stringify(r));
    await page.close();
}

// ---- DROPMENU SELECT ------------------------------------------------------
{
    const page = await open('components/dropmenu.html');
    // Built from the canon: the doc demo lives in a canon block.
    await page.evaluate(() => {
        const box = document.createElement('div');
        box.innerHTML = '<div class="nds-dropmenu" id="sv-dm" data-select-name="country">'
            + '<button type="button" class="nds-btn nds-secondary-outline nds-menu-btn nds-dropmenu-trigger"><span class="nds-label">Choose</span></button>'
            + '<div class="nds-dropmenu-menu" hidden><div class="nds-dropmenu-scroll">'
            + '<button type="button" class="nds-btn nds-subtle nds-dropmenu-item" data-value="SA"><span class="nds-label">Saudi Arabia</span></button>'
            + '<button type="button" class="nds-btn nds-subtle nds-dropmenu-item" data-value="AE"><span class="nds-label">UAE</span></button>'
            + '</div></div></div>';
        document.querySelector('.nds-section-body').prepend(box);
        NDS.Init.mount(box);
    });
    await page.locator('#sv-dm .nds-dropmenu-trigger').click();
    const item = page.locator('.nds-dropmenu-item[data-value="AE"]');
    await item.waitFor({ timeout: 5000 });
    const want = await item.getAttribute('data-value');
    await page.evaluate(() => { window.__log.length = 0; });
    await item.click();
    const res = await page.evaluate(() => ({
        value: document.querySelector('#sv-dm input[data-nds-select-value]').value,
        log: window.__log.slice()
    }));
    ok('Dropmenu select: the hidden field holds the pick with input + change', res.value === want
        && res.log.join() === 'input:hidden,change:hidden', JSON.stringify(res));
    await page.close();
}

await browser.close();
console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
