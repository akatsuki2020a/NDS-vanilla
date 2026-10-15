// core/init.md Framework Views, run in real React, Vue and htmx — not a plain-JS imitation.
//
//   MOUNT     mount(view) after mount, destroy(view) before unmount; React StrictMode runs
//             mount → destroy → mount, so a view must end with ONE live instance.
//   EVENTS    an NDS event reaches addEventListener through a ref, once per action.
//   TEARDOWN  unmounting a view with an open portaled menu or an open modal leaves nothing
//             on the page: no menu in <body>, no backdrop, no scroll lock. The view mounts again.
//   CLASSES   a changing class binding on an element NDS writes to wipes NDS's class; the
//             doc's advice (put the changing class on a wrapper) keeps it.
//   SWAPS     htmx swaps with destroy() before and mount() after: the new view works and
//             nothing from the old one is left.
//
//   node scripts/check-frameworks.mjs [baseUrl]
//   NO_DESTROY=1 skips every destroy() call: the TEARDOWN rows must fail, which proves they can.
// Defaults to the dev server. Start it with `bundle exec jekyll serve` if down.
import { launch } from './lib/browser.mjs';

const BASE = (process.argv[2] || 'http://localhost:4002/NDS-vanilla').replace(/\/$/, '');
const LIBS = {
    react: ['react@18.3.1/umd/react.production.min.js', 'react-dom@18.3.1/umd/react-dom.production.min.js'],
    vue: ['vue@3.4.38/dist/vue.global.prod.js'],
    htmx: ['htmx.org@1.9.12/dist/htmx.min.js']
};
const browser = await launch();
let failed = 0;
const ok = (name, pass, detail = '') => {
    if (!pass) failed++;
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};

// One view per framework, from the dropmenu and modal canons; `p` prefixes the ids.
const VIEW = (p) => `<div class="nds-dropmenu" id="${p}-dm" data-portal data-select-name="${p}-country">
<button type="button" class="nds-btn nds-secondary-outline nds-menu-btn nds-dropmenu-trigger"><span class="nds-label">Choose</span></button>
<div class="nds-dropmenu-menu" hidden><div class="nds-dropmenu-scroll">
<button type="button" class="nds-btn nds-subtle nds-dropmenu-item" data-value="SA"><span class="nds-label">Saudi Arabia</span></button>
<button type="button" class="nds-btn nds-subtle nds-dropmenu-item" data-value="AE"><span class="nds-label">UAE</span></button>
</div></div></div>
<div id="${p}-modal" class="nds-modal nds-card nds-stroke" role="dialog" aria-modal="true" aria-hidden="true" hidden>
<div class="nds-card-content"><span class="nds-card-title">Title</span></div>
<div class="nds-card-actions"><button type="button" class="nds-btn nds-primary nds-lg" data-modal-close><span class="nds-label">Close</span></button></div>
</div>`;
// The custom-select canon: NDS adds nds-dropmenu to its .nds-form-control.
const SELECT = '<input type="text" class="nds-input nds-select-input" readonly>'
    + '<input type="hidden" class="nds-select-value">'
    + '<div class="nds-select-dropdown" hidden><div class="nds-select-options">'
    + '<button type="button" class="nds-btn nds-subtle nds-select-option" data-value="a"><span class="nds-option-text"><span class="nds-label">A</span></span></button>'
    + '</div></div>';

async function open(libs) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/components/forms.html`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.NDS?.Init?.mount, null, { timeout: 15000 });
    for (const lib of libs) await page.addScriptTag({ url: `https://unpkg.com/${lib}` });
    await page.evaluate(([VIEW, SELECT, noDestroy]) => {
        window.__VIEW = new Function('p', 'return `' + VIEW + '`');
        window.__SELECT = SELECT;
        window.__picks = [];
        window.__destroy = (el) => (window.__noDestroy ? 0 : NDS.Init.destroy(el));
        window.__wait = (ms = 350) => new Promise((r) => setTimeout(r, ms));
        window.__strays = () => document.body.querySelectorAll(':scope > .nds-dropmenu-menu').length;
        window.__released = () => !NDS.Modal.isOpen() && !document.body.style.top && !NDS.Backdrop.isActive();
        window.__noDestroy = noDestroy;
    }, [VIEW('${p}'), SELECT, !!process.env.NO_DESTROY]);
    return { page, errors };
}

// The same assertions for every host: `p` is the id prefix, `unmount`/`remount` drive the framework.
async function lifecycle(page, name, p, unmount, remount) {
    const menuOpen = () => page.evaluate((p) => {
        const menu = NDS.Dropmenu.menuOf(document.getElementById(p + '-dm'));
        return !!menu && !menu.hidden && menu.parentElement === document.body;
    }, p);
    const trigger = page.locator(`#${p}-dm .nds-dropmenu-trigger`);

    await page.evaluate(() => window.__wait(600));
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    await page.evaluate(() => window.__wait());
    ok(`${name}: one click opens the portaled menu (one live instance)`, await menuOpen());

    await page.evaluate(() => { window.__picks.length = 0; });
    await page.locator('.nds-dropmenu-item[data-value="AE"]').click();
    await page.evaluate(() => window.__wait());
    const picks = await page.evaluate(() => window.__picks.slice());
    ok(`${name}: the pick reaches a ref listener once`, picks.join() === 'AE', JSON.stringify(picks));

    await trigger.click();
    await page.evaluate(() => window.__wait());
    await unmount();
    await page.evaluate(() => window.__wait());
    ok(`${name}: unmount with the menu open leaves no menu in <body>`, (await page.evaluate(() => window.__strays())) === 0);

    await remount();
    await page.evaluate((p) => { NDS.Modal.open(p + '-modal'); return window.__wait(); }, p);
    ok(`${name}: setup, the modal locked the page`, await page.evaluate(() => NDS.Modal.isOpen() && !!document.body.style.top));
    await unmount();
    await page.evaluate(() => window.__wait());
    ok(`${name}: unmount with the modal open releases backdrop and scroll lock`, await page.evaluate(() => window.__released()));

    await remount();
    await page.evaluate(() => window.__wait(600));
    // A backdrop left behind covers the trigger: that fails here, not as a crash.
    await trigger.click({ timeout: 3000 }).catch(() => {});
    await page.evaluate(() => window.__wait());
    ok(`${name}: the view works again after a remount`, await menuOpen());
    await page.evaluate(() => NDS.Modal.isOpen() && NDS.Modal.close());
    await page.keyboard.press('Escape');
}

// ---- REACT (StrictMode) ---------------------------------------------------
{
    const { page, errors } = await open(LIBS.react);
    await page.evaluate(() => {
        const h = React.createElement;
        // Real React nodes from the markup: React owns every element, as in an app.
        const toReact = (node, key) => {
            if (node.nodeType === 3) return node.textContent.trim() ? node.textContent : null;
            if (node.nodeType !== 1) return null;
            const props = { key };
            for (const a of node.attributes) {
                const n = { class: 'className', for: 'htmlFor', readonly: 'readOnly' }[a.name] || a.name;
                props[n] = a.name === 'hidden' || a.name === 'readonly' ? true : a.value;
            }
            const kids = [...node.childNodes].map(toReact).filter((k) => k !== null);
            return h(node.tagName.toLowerCase(), props, ...kids);
        };
        const tree = (html) => [...new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html').body.firstChild.childNodes]
            .map(toReact).filter((k) => k !== null);

        function View() {
            const ref = React.useRef(null);
            React.useEffect(() => {
                const el = ref.current; // the ref is empty by cleanup time
                window.NDS?.Init.mount(el);
                const dm = el.querySelector('#r-dm');
                const on = (e) => window.__picks.push(e.detail.value);
                dm.addEventListener('nds:dropmenu:selected', on);
                return () => { dm.removeEventListener('nds:dropmenu:selected', on); window.__destroy(el); };
            }, []);
            return h('div', { ref }, ...tree(window.__VIEW('r')));
        }
        function Classes() {
            const [on, setOn] = React.useState(false);
            window.__setReactClass = setOn;
            const ref = React.useRef(null);
            React.useEffect(() => { const el = ref.current; window.NDS?.Init.mount(el); return () => window.NDS?.Init.destroy(el); }, []);
            return h('div', { ref },
                h('div', { className: 'nds-form-container nds-select', id: 'rc-bound' },
                    h('div', { className: 'nds-form-control' + (on ? ' is-on' : '') }, ...tree(window.__SELECT))),
                h('div', { className: 'nds-form-container nds-select' + (on ? ' is-on' : ''), id: 'rc-wrapper' },
                    h('div', { className: 'nds-form-control' }, ...tree(window.__SELECT))));
        }
        function App() {
            const [show, setShow] = React.useState(true);
            window.__setReactShow = setShow;
            return h(React.StrictMode, null, show ? h(View) : null, h(Classes));
        }
        const host = document.querySelector('.nds-section-body').appendChild(document.createElement('div'));
        ReactDOM.createRoot(host).render(h(App));
    });
    const flip = (show) => page.evaluate((show) => { window.__setReactShow(show); return window.__wait(100); }, show);
    await lifecycle(page, 'React', 'r', () => flip(false), () => flip(true));

    const cls = await page.evaluate(async () => {
        for (const id of ['rc-bound', 'rc-wrapper']) await NDS.CustomSelect.create(document.getElementById(id));
        const has = () => ['rc-bound', 'rc-wrapper'].map((id) => document.querySelector('#' + id + ' .nds-form-control').classList.contains('nds-dropmenu'));
        const before = has();
        window.__setReactClass(true);
        await window.__wait(100);
        return { before, after: has() };
    });
    ok('React: setup, NDS marked both fields', cls.before.every(Boolean), JSON.stringify(cls));
    ok('React: a changing className on the field wipes NDS\'s class (the doc\'s warning holds)', cls.after[0] === false);
    ok('React: the changing class on a wrapper keeps it (the doc\'s advice works)', cls.after[1] === true);
    ok('React: no page errors', errors.length === 0, errors.join(' | '));
    await page.close();
}

// ---- VUE ------------------------------------------------------------------
{
    const { page, errors } = await open(LIBS.vue);
    await page.evaluate(() => {
        const View = {
            template: '<div ref="root">' + window.__VIEW('v') + '</div>',
            mounted() {
                this.$refs.root.querySelector('#v-dm').addEventListener('nds:dropmenu:selected', (e) => window.__picks.push(e.detail.value));
                window.NDS?.Init.mount(this.$refs.root);
            },
            beforeUnmount() { window.__destroy(this.$refs.root); }
        };
        const host = document.querySelector('.nds-section-body').appendChild(document.createElement('div'));
        window.__vueApp = Vue.createApp({
            components: { View },
            data: () => ({ show: true, on: false }),
            template: '<View v-if="show" /><div ref="cls">'
                + '<div class="nds-form-container nds-select" id="vc-bound"><div class="nds-form-control" :class="{ \'is-on\': on }">' + window.__SELECT + '</div></div>'
                + '<div class="nds-form-container nds-select" :class="{ \'is-on\': on }" id="vc-wrapper"><div class="nds-form-control">' + window.__SELECT + '</div></div>'
                + '</div>',
            mounted() { window.NDS?.Init.mount(this.$refs.cls); }
        }).mount(host);
    });
    const flip = (show) => page.evaluate((show) => { window.__vueApp.show = show; return window.__wait(100); }, show);
    await lifecycle(page, 'Vue', 'v', () => flip(false), () => flip(true));

    const cls = await page.evaluate(async () => {
        for (const id of ['vc-bound', 'vc-wrapper']) await NDS.CustomSelect.create(document.getElementById(id));
        const has = () => ['vc-bound', 'vc-wrapper'].map((id) => document.querySelector('#' + id + ' .nds-form-control').classList.contains('nds-dropmenu'));
        const before = has();
        window.__vueApp.on = true;
        await window.__wait(100);
        return { before, after: has() };
    });
    ok('Vue: setup, NDS marked both fields', cls.before.every(Boolean), JSON.stringify(cls));
    ok('Vue: a changing :class on the field wipes NDS\'s class (the doc\'s warning holds)', cls.after[0] === false);
    ok('Vue: the changing class on a wrapper keeps it (the doc\'s advice works)', cls.after[1] === true);
    ok('Vue: no page errors', errors.length === 0, errors.join(' | '));
    await page.close();
}

// ---- HTMX -----------------------------------------------------------------
{
    const { page, errors } = await open(LIBS.htmx);
    await page.route('**/nds-fragment', (route) => route.fulfill({ contentType: 'text/html', body: VIEW('x') }));
    await page.evaluate((url) => {
        const host = document.querySelector('.nds-section-body').appendChild(document.createElement('div'));
        host.id = 'x-target';
        window.__released_count = 0;
        document.addEventListener('htmx:beforeSwap', (e) => { window.__released_count += window.__destroy(e.detail.target); });
        document.addEventListener('htmx:afterSwap', (e) => NDS.Init.mount(e.detail.target));
        // Delegated, since each swap brings a new dropmenu element.
        document.addEventListener('nds:dropmenu:selected', (e) => { if (e.target.id === 'x-dm') window.__picks.push(e.detail.value); });
        window.__swap = () => new Promise((r) => {
            document.addEventListener('htmx:afterSettle', () => r(), { once: true });
            htmx.ajax('GET', url, { target: '#x-target', swap: 'innerHTML' });
        });
    }, `${BASE}/nds-fragment`);
    const swap = () => page.evaluate(() => window.__swap());
    await swap();
    // A swap is the unmount and the remount in one step, so both drive it.
    await lifecycle(page, 'htmx', 'x', swap, async () => {});
    ok('htmx: each swap released the old view\'s instances', (await page.evaluate(() => window.__released_count)) > 0);
    ok('htmx: no page errors', errors.length === 0, errors.join(' | '));
    await page.close();
}

await browser.close();
console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
