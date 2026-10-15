// core/init.md Framework Views, run in real React, Vue, Svelte, Angular, htmx and Turbo —
// not a plain-JS imitation. Svelte compiles and Angular runs JIT in the page, so no build step.
//
//   MOUNT     mount(view) after mount, destroy(view) before unmount; React StrictMode runs
//             mount → destroy → mount, so a view must end with ONE live instance.
//   EVENTS    an NDS event reaches addEventListener through a ref, once per action.
//   TEARDOWN  unmounting a view with an open portaled menu or an open modal leaves nothing
//             on the page: no menu in <body>, no backdrop, no scroll lock. The view mounts again.
//   CLASSES   a changing class binding on an element NDS writes to wipes NDS's class; the
//             doc's advice (put the changing class on a wrapper) keeps it.
//   SWAPS     htmx and Turbo swaps with destroy() before and mount() after: the new view works
//             and nothing from the old one is left.
//   HYDRATION React and Vue hydrate server HTML from their own server renderers: NDS starting at
//             load breaks it; data-nds-auto-init="false" + initialize() after hydration does not.
//   INFO rows print a class-binding result the doc does not claim yet; they never fail the run.
//
//   node scripts/check-frameworks.mjs [baseUrl]
//   NO_DESTROY=1 skips every destroy() call: the TEARDOWN rows must fail, which proves they can.
// Defaults to the dev server. Start it with `bundle exec jekyll serve` if down.
import { launch } from './lib/browser.mjs';
import { REACT, VUE, SVELTE, ANGULAR, major, loadReact, loadVue, SVELTE_APP, ANGULAR_LOAD } from './lib/frameworks.mjs';

const BASE = (process.argv[2] || 'http://localhost:4002/NDS-vanilla').replace(/\/$/, '');
const LIBS = {
    htmx: ['htmx.org@1.9.12/dist/htmx.min.js'],
    turbo: ['@hotwired/turbo@7.3.0/dist/turbo.es2017-umd.js']
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
    // WebKit's harmless ResizeObserver loop notice: TODO.md, Watch.
    page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errors.push(e.message); });
    await page.goto(`${BASE}/components/forms.html`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.NDS?.Init?.mount, null, { timeout: 15000 });
    // The cookie panel can open mid-run and take the clicks meant for a menu.
    await page.addStyleTag({ content: '#nds-cookies-panel { display: none !important; }' });
    if (typeof libs === 'function') await libs(page);
    else for (const lib of libs) await page.addScriptTag({ url: `https://unpkg.com/${lib}` });
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
for (const v of REACT) {
    const R = 'React ' + major(v);
    const { page, errors } = await open(loadReact(v));
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
    await lifecycle(page, R, 'r', () => flip(false), () => flip(true));

    const cls = await page.evaluate(async () => {
        for (const id of ['rc-bound', 'rc-wrapper']) await NDS.CustomSelect.create(document.getElementById(id));
        const has = () => ['rc-bound', 'rc-wrapper'].map((id) => document.querySelector('#' + id + ' .nds-form-control').classList.contains('nds-dropmenu'));
        const before = has();
        window.__setReactClass(true);
        await window.__wait(100);
        return { before, after: has() };
    });
    ok(`${R}: setup, NDS marked both fields`, cls.before.every(Boolean), JSON.stringify(cls));
    ok(`${R}: a changing className on the field wipes NDS's class (the doc's warning holds)`, cls.after[0] === false);
    ok(`${R}: the changing class on a wrapper keeps it (the doc's advice works)`, cls.after[1] === true);
    ok(`${R}: no page errors`, errors.length === 0, errors.join(' | '));
    await page.close();
}

// ---- VUE ------------------------------------------------------------------
for (const v of VUE) {
    const V = 'Vue ' + v.split('.').slice(0, 2).join('.');
    const { page, errors } = await open(loadVue(v));
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
    await lifecycle(page, V, 'v', () => flip(false), () => flip(true));

    const cls = await page.evaluate(async () => {
        for (const id of ['vc-bound', 'vc-wrapper']) await NDS.CustomSelect.create(document.getElementById(id));
        const has = () => ['vc-bound', 'vc-wrapper'].map((id) => document.querySelector('#' + id + ' .nds-form-control').classList.contains('nds-dropmenu'));
        const before = has();
        window.__vueApp.on = true;
        await window.__wait(100);
        return { before, after: has() };
    });
    ok(`${V}: setup, NDS marked both fields`, cls.before.every(Boolean), JSON.stringify(cls));
    ok(`${V}: a changing :class on the field wipes NDS's class (the doc's warning holds)`, cls.after[0] === false);
    ok(`${V}: the changing class on a wrapper keeps it (the doc's advice works)`, cls.after[1] === true);
    ok(`${V}: no page errors`, errors.length === 0, errors.join(' | '));
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

// ---- TURBO (frames) --------------------------------------------------------
{
    const { page, errors } = await open(LIBS.turbo);
    await page.route('**/nds-turbo*', (route) => route.fulfill({ contentType: 'text/html',
        body: `<html><body><turbo-frame id="t-frame">${VIEW('t')}</turbo-frame></body></html>` }));
    await page.evaluate((url) => {
        const frame = document.createElement('turbo-frame');
        frame.id = 't-frame';
        document.querySelector('.nds-section-body').appendChild(frame);
        window.__released_count = 0;
        document.addEventListener('turbo:before-frame-render', (e) => { window.__released_count += window.__destroy(e.target); });
        document.addEventListener('turbo:frame-render', (e) => NDS.Init.mount(e.target));
        document.addEventListener('nds:dropmenu:selected', (e) => { if (e.target.id === 't-dm') window.__picks.push(e.detail.value); });
        let n = 0;
        window.__swap = () => new Promise((r) => {
            frame.addEventListener('turbo:frame-load', () => r(), { once: true });
            frame.src = url + '?n=' + (++n);
        });
    }, `${BASE}/nds-turbo`);
    const swap = () => page.evaluate(() => window.__swap());
    await swap();
    await lifecycle(page, 'Turbo', 't', swap, async () => {});
    ok("Turbo: each frame render released the old view's instances", (await page.evaluate(() => window.__released_count)) > 0);
    ok('Turbo: no page errors', errors.length === 0, errors.join(' | '));
    await page.close();
}

// ---- HYDRATION -------------------------------------------------------------
// Server HTML from the framework's own server renderer, written into the page before NDS
// starts, then hydrated: the Next.js / Nuxt shape without a server build. With NDS starting
// at load the hydration must report a mismatch (the doc's warning); with
// data-nds-auto-init="false" and NDS.Init.initialize() after hydration, none (its fix).
// Markup → framework nodes, so the framework owns each element. `h(tag, props, ...kids)`.
const TO_TREE = `(h, names) => function tree(html) {
    const conv = (node) => {
        if (node.nodeType === 3) return node.textContent.trim() ? node.textContent : null;
        if (node.nodeType !== 1) return null;
        const props = {};
        for (const a of node.attributes) props[names[a.name] || a.name] = a.name === 'hidden' || a.name === 'readonly' ? true : a.value;
        const kids = [...node.childNodes].map(conv).filter((k) => k !== null);
        return h(node.tagName.toLowerCase(), props, ...kids);
    };
    return [...new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html').body.firstChild.childNodes]
        .map(conv).filter((k) => k !== null);
}`;
const MISMATCH = /hydrat|did not match|did not expect|extra attributes|server html/i;

async function hydrationRun(name, serverHtml, hydrate, manual) {
    const page = await browser.newPage();
    const logs = [];
    // Vue's build notice names its hydration flag; it is not a mismatch.
    page.on('console', (m) => { if (MISMATCH.test(m.text()) && !/^Feature flags/.test(m.text())) logs.push(m.text().slice(0, 140)); });
    await page.route(/components\/forms\.html/, async (route) => {
        const res = await route.fetch();
        let body = await res.text();
        body = body.replace(/<body([^>]*)>/, `<body$1><div id="ssr-root">${serverHtml}</div>`);
        if (manual) body = body.replace(/<html([^>]*)>/, '<html$1 data-nds-auto-init="false">');
        await route.fulfill({ response: res, body });
    });
    await page.goto(`${BASE}/components/forms.html`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.NDS?.Init, null, { timeout: 15000 });
    if (!manual) await page.evaluate(() => window.NDS.Init.ready);
    await hydrate(page, manual);
    await page.waitForTimeout(800);
    const works = await page.evaluate(async () => {
        document.querySelector('#ssr-root .nds-dropmenu-trigger').click();
        await new Promise((r) => setTimeout(r, 350));
        const menu = NDS.Dropmenu.menuOf(document.querySelector('#ssr-root .nds-dropmenu'));
        return !!menu && !menu.hidden;
    });
    await page.close();
    return { logs, works };
}

for (const v of REACT) {
    // React: renderToString on a blank page, hydrateRoot on the real one. Dev builds log mismatches.
    const R = 'React ' + major(v);
    const APP = `(manual) => { const h = React.createElement;
        const tree = (${TO_TREE})(h, { class: 'className', for: 'htmlFor', readonly: 'readOnly' });
        return function App() {
            React.useEffect(() => { if (manual) NDS.Init.initialize(); }, []);
            return h('div', { id: 'h-app' }, ...tree(${JSON.stringify(VIEW('h'))}));
        };
    }`;
    const srv = await browser.newPage();
    await loadReact(v, true)(srv);
    if (v.startsWith('18.')) await srv.addScriptTag({ url: `https://unpkg.com/react-dom@${v}/umd/react-dom-server-legacy.browser.development.js` });
    else await srv.evaluate(async (v) => { window.ReactDOMServer = await import(`https://esm.sh/react-dom@${v}/server?dev`); }, v);
    const html = await srv.evaluate((APP) => ReactDOMServer.renderToString(React.createElement(eval(APP)(false))), APP);
    await srv.close();

    const hydrate = async (page, manual) => {
        await loadReact(v, true)(page);
        await page.evaluate(([APP, manual]) => {
            window.__hErr = [];
            ReactDOM.hydrateRoot(document.getElementById('ssr-root'), React.createElement(eval(APP)(manual)),
                { onRecoverableError: (e) => console.error('hydration error: ' + e.message) });
        }, [APP, manual]);
    };
    const auto = await hydrationRun(R, html, hydrate, false);
    ok(`${R} hydration: NDS starting at load breaks it (the doc's warning holds)`, auto.logs.length > 0, auto.logs[0] || 'no mismatch logged');
    const manual = await hydrationRun(R, html, hydrate, true);
    ok(`${R} hydration: data-nds-auto-init="false" + initialize() after it: no mismatch`, manual.logs.length === 0, manual.logs.join(' | '));
    ok(`${R} hydration: NDS works after the late initialize()`, manual.works);
}

for (const v of VUE) {
    // Vue: renderToString from vue/server-renderer, createSSRApp().mount() to hydrate. Dev builds log mismatches.
    const V = 'Vue ' + v.split('.').slice(0, 2).join('.');
    const VUE_URL = `https://esm.sh/vue@${v}?dev`;
    const APP = `(Vue, manual) => {
        const tree = (${TO_TREE})(Vue.h, {});
        return { mounted() { if (manual) NDS.Init.initialize(); },
            render: () => Vue.h('div', { id: 'h-app' }, tree(${JSON.stringify(VIEW('h'))})) };
    }`;
    const srv = await browser.newPage();
    await srv.goto(`${BASE}/404.html`).catch(() => {});
    const html = await srv.evaluate(async ([VUE_URL, APP, v]) => {
        const Vue = await import(VUE_URL);
        const { renderToString } = await import(`https://esm.sh/vue@${v}/server-renderer?dev`);
        return renderToString(Vue.createSSRApp(eval(APP)(Vue, false)));
    }, [VUE_URL, APP, v]);
    await srv.close();

    const hydrate = (page, manual) => page.evaluate(async ([VUE_URL, APP, manual]) => {
        const Vue = await import(VUE_URL);
        Vue.createSSRApp(eval(APP)(Vue, manual)).mount('#ssr-root');
    }, [VUE_URL, APP, manual]);
    const auto = await hydrationRun(V, html, hydrate, false);
    ok(`${V} hydration: NDS starting at load breaks it (the doc's warning holds)`, auto.logs.length > 0, auto.logs[0] || 'no mismatch logged');
    const manual = await hydrationRun(V, html, hydrate, true);
    ok(`${V} hydration: data-nds-auto-init="false" + initialize() after it: no mismatch`, manual.logs.length === 0, manual.logs.join(' | '));
    ok(`${V} hydration: NDS works after the late initialize()`, manual.works);
}

// A finding the doc does not claim yet: printed, never counted.
const info = (name, detail) => console.log(`INFO  ${name}  — ${detail}`);
const kept = (r) => (r ? 'keeps NDS\'s class' : 'wipes NDS\'s class');

// ---- SVELTE (compiled in the page) ------------------------------------------
for (const v of SVELTE) {
    const S = 'Svelte ' + major(v);
    const { page, errors } = await open([]);
    await page.evaluate(async ([VIEW, SELECT, SVELTE_APP, v]) => {
        const src = `<script>
  export let show = true;
  export let on = false;
  function nds(node) {
    node.querySelector('#s-dm').addEventListener('nds:dropmenu:selected', (e) => window.__picks.push(e.detail.value));
    window.NDS?.Init.mount(node);
    return { destroy() { window.__destroy(node); } };
  }
  function ndsPlain(node) { window.NDS?.Init.mount(node); return { destroy() { window.__destroy(node); } }; }
<\/script>
{#if show}<div use:nds>${VIEW}</div>{/if}
<div use:ndsPlain>
<div class="nds-form-container nds-select" id="sc-attr"><div class="nds-form-control {on ? 'is-on' : ''}">${SELECT}</div></div>
<div class="nds-form-container nds-select" id="sc-directive"><div class="nds-form-control" class:is-on={on}>${SELECT}</div></div>
<div class="nds-form-container nds-select {on ? 'is-on' : ''}" id="sc-wrapper"><div class="nds-form-control">${SELECT}</div></div>
</div>`;
        const App = await eval(SVELTE_APP)(src, v);
        const host = document.querySelector('.nds-section-body').appendChild(document.createElement('div'));
        window.__svelte = new App({ target: host });
    }, [VIEW('s'), SELECT, SVELTE_APP, v]);
    const flip = (show) => page.evaluate((show) => { window.__svelte.$set({ show }); return window.__wait(100); }, show);
    await lifecycle(page, S, 's', () => flip(false), () => flip(true));

    const cls = await page.evaluate(async () => {
        const ids = ['sc-attr', 'sc-directive', 'sc-wrapper'];
        for (const id of ids) await NDS.CustomSelect.create(document.getElementById(id));
        const has = () => ids.map((id) => document.querySelector('#' + id + ' .nds-form-control').classList.contains('nds-dropmenu'));
        const before = has();
        window.__svelte.$set({ on: true });
        await window.__wait(100);
        return { before, after: has() };
    });
    ok(`${S}: setup, NDS marked every field`, cls.before.every(Boolean), JSON.stringify(cls));
    info(`${S}: class="… {expr}" on the field`, kept(cls.after[0]));
    info(`${S}: class:name={expr} on the field`, kept(cls.after[1]));
    ok(`${S}: the changing class on a wrapper keeps it (the doc's advice works)`, cls.after[2] === true);
    ok(`${S}: no page errors`, errors.length === 0, errors.join(' | '));
    await page.close();
}

// ---- ANGULAR (JIT in the page) ----------------------------------------------
for (const [v, zone] of ANGULAR) {
    const A = 'Angular ' + major(v);
    const { page, errors } = await open([]);
    const booted = await page.evaluate(async ([VIEW, SELECT, v, zone, ANGULAR_LOAD]) => {
        const ng = await eval(ANGULAR_LOAD)(v, zone);
        const { Component, ElementRef, inject } = ng.core;
        const { bootstrapApplication } = ng.browser;

        class ViewCmp {
            el = inject(ElementRef);
            ngAfterViewInit() {
                const root = this.el.nativeElement;
                root.querySelector('#a-dm').addEventListener('nds:dropmenu:selected', (e) => window.__picks.push(e.detail.value));
                window.NDS?.Init.mount(root);
            }
            ngOnDestroy() { window.__destroy(this.el.nativeElement); }
        }
        Component({ selector: 'nds-view', standalone: true, template: VIEW })(ViewCmp);

        class AppCmp {
            show = true;
            on = false;
            el = inject(ElementRef);
            ngAfterViewInit() { window.NDS?.Init.mount(this.el.nativeElement.querySelector('#a-cls')); }
        }
        Component({ selector: 'nds-app', standalone: true, imports: [ViewCmp], template: '@if (show) { <nds-view /> }'
            + '<div id="a-cls">'
            + '<div class="nds-form-container nds-select" id="ac-classmap"><div [class]="on ? \'nds-form-control is-on\' : \'nds-form-control\'">' + SELECT + '</div></div>'
            + '<div class="nds-form-container nds-select" id="ac-classname"><div class="nds-form-control" [class.is-on]="on">' + SELECT + '</div></div>'
            + '<div class="nds-form-container nds-select" [class.is-on]="on" id="ac-wrapper"><div class="nds-form-control">' + SELECT + '</div></div>'
            + '</div>' })(AppCmp);

        document.querySelector('.nds-section-body').appendChild(document.createElement('nds-app'));
        const app = await bootstrapApplication(AppCmp);
        window.__ng = { set: (k, val) => { app.components[0].instance[k] = val; app.tick(); } };
        return true;
    }, [VIEW('a'), SELECT, v, zone, ANGULAR_LOAD]).catch((e) => e.message);
    ok(`${A}: bootstrapped`, booted === true, booted === true ? '' : String(booted));
    if (booted === true) {
        const flip = (show) => page.evaluate((show) => { window.__ng.set('show', show); return window.__wait(100); }, show);
        await lifecycle(page, A, 'a', () => flip(false), () => flip(true));
        const cls = await page.evaluate(async () => {
            const ids = ['ac-classmap', 'ac-classname', 'ac-wrapper'];
            for (const id of ids) await NDS.CustomSelect.create(document.getElementById(id));
            const has = () => ids.map((id) => document.querySelector('#' + id + ' .nds-form-control').classList.contains('nds-dropmenu'));
            const before = has();
            window.__ng.set('on', true);
            await window.__wait(100);
            return { before, after: has() };
        });
        ok(`${A}: setup, NDS marked every field`, cls.before.every(Boolean), JSON.stringify(cls));
        info(`${A}: [class]="expr" on the field`, kept(cls.after[0]));
        info(`${A}: [class.name]="expr" on the field`, kept(cls.after[1]));
        ok(`${A}: the changing class on a wrapper keeps it (the doc's advice works)`, cls.after[2] === true);
    }
    ok(`${A}: no page errors`, errors.length === 0, errors.join(' | '));
    await page.close();
}

await browser.close();
console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
