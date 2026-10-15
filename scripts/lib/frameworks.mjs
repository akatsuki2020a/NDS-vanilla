// Framework versions and in-page loaders shared by check-frameworks.mjs and check-set-value.mjs.
// Each framework runs at the last two majors apps use. All load from CDNs, so a CDN outage
// fails these checks without an NDS fault.

export const REACT = ['18.3.1', '19.0.0'];
export const VUE = ['3.4.38', '3.5.13'];
export const SVELTE = ['4.2.19', '5.16.0'];
export const ANGULAR = [['17.3.12', '0.14.10'], ['19.2.0', '0.15.0']]; // [core, zone.js]

export const major = (v) => v.split('.')[0];

// React 19 ships no UMD build: its ES modules go on window under the UMD names.
export const loadReact = (v, dev = false) => async (page) => {
    if (v.startsWith('18.')) {
        for (const lib of ['react', 'react-dom']) {
            await page.addScriptTag({ url: `https://unpkg.com/${lib}@${v}/umd/${lib}.${dev ? 'development' : 'production.min'}.js` });
        }
        return;
    }
    await page.evaluate(async ([v, q]) => {
        window.React = await import(`https://esm.sh/react@${v}${q}`);
        window.ReactDOM = await import(`https://esm.sh/react-dom@${v}/client${q}`);
    }, [v, dev ? '?dev' : '']);
};

export const loadVue = (v) => async (page) => {
    await page.addScriptTag({ url: `https://unpkg.com/vue@${v}/dist/vue.global.prod.js` });
};

// In-page source: compile a component and import it. Svelte 5 dropped `sveltePath`, so its bare
// 'svelte/…' imports are pointed at esm.sh here; componentApi 4 keeps `new App()` and $set.
export const SVELTE_APP = `async (src, v, extra = {}) => {
    const base = 'https://esm.sh/svelte@' + v;
    const { compile } = await import(base + '/compiler');
    const four = v.startsWith('4.');
    let { code } = compile(src, four ? { sveltePath: base, ...extra } : { compatibility: { componentApi: 4 }, ...extra }).js;
    if (!four) code = code.replace(/(['"])svelte(\\/[^'"]*)?\\1/g, (m, q, sub) => q + base + (sub || '') + q);
    return (await import(URL.createObjectURL(new Blob([code], { type: 'text/javascript' })))).default;
}`;

// In-page source: load Angular for JIT. jsDelivr's +esm links every package to one
// @angular/core; esm.sh loaded two, and inject() then failed with NG0203.
export const ANGULAR_LOAD = `async (v, zone) => {
    const pkg = (name) => import('https://cdn.jsdelivr.net/npm/' + name + '/+esm');
    await pkg('zone.js@' + zone);
    await pkg('@angular/compiler@' + v);
    return {
        core: await pkg('@angular/core@' + v),
        forms: await pkg('@angular/forms@' + v),
        browser: await pkg('@angular/platform-browser@' + v)
    };
}`;
