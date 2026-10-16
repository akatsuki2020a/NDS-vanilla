---
layout: home
sitemap: false  # internal dev/test page — keep out of the public sitemap
noindex: true   # also tell crawlers not to index it if reached via a link
title: "نظام التصميم الموحد لكود المنصات السعودي"
hero_title: "النظام الوطني للتصميم"
hero_description: "نظام تصميم شامل يُمكِّن من بناء تجارب رقمية حكومية متّسقة وقابلة للوصول وعالية الأداء."
hero_image_pos: 50% 10%
lang: ar
direction: rtl
---

<!-- Internal dev/test scratch page. Drop components here to test in isolation. -->

<section class="nds-content-section">
  <div class="nds-section-wrapper">
    <div class="nds-section-head">
      <h2 class="nds-section-title">مساحة الاختبار</h2>
      <p class="nds-section-description">أسقط المكون التالي هنا</p>
    </div>
    <div class="nds-section-body">

    </div>
  </div>
</section>

<!-- Popover / dialog prototype (2026-10-16): today's NDS first in each row, the native top
     layer second. Reference for plans/top-layer.md: remove once step 3 ships. -->
<style>
  .pg-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-block: 16px; }
  .pg-box { border: 1px dashed var(--border-neutral-secondary); border-radius: 8px; padding: 12px; }
  .pg-box > b { display: block; margin-block-end: 8px; }
  .pg-clip { height: 64px; overflow: hidden; transform: translateZ(0); border: 2px solid var(--border-neutral-primary, #999); border-radius: 8px; padding: 8px; }
  .pg-dark { background: var(--background-default); color: var(--text-default); padding: 12px; border-radius: 8px; }
  .pg-out { font-size: 13px; opacity: .8; margin-block-start: 8px; }
  /* The new menu: NDS's own menu look, in the top layer. */
  .pg-pop.nds-dropmenu-menu { position: fixed; inset: auto; margin: 0; overflow: visible; }
  .pg-pop.nds-dropmenu-menu:popover-open { display: block; }
  /* Animation with no JS: @starting-style for the way in, allow-discrete display + overlay
     for the way out (overlay keeps it in the top layer while it fades: Chrome only). */
  .pg-pop.nds-dropmenu-menu, .pg-dialog, .pg-dialog::backdrop {
    transition: opacity var(--nds-transition), transform var(--nds-transition),
      display var(--nds-transition) allow-discrete, overlay var(--nds-transition) allow-discrete;
  }
  .pg-pop.nds-dropmenu-menu { opacity: 0; transform: translateY(var(--_dropmenu-slide)); }
  .pg-pop.nds-dropmenu-menu:popover-open { opacity: 1; transform: none; }
  @starting-style { .pg-pop.nds-dropmenu-menu:popover-open { opacity: 0; transform: translateY(var(--_dropmenu-slide)); } }
  @supports (position-area: block-end) {
    .pg-pop.nds-dropmenu-menu { position-area: block-end span-inline-end; margin-block-start: 4px; }
  }
  .pg-demo :is(h2, h3, p, b) { unicode-bidi: plaintext; }
  /* .nds-card sets display, position and margin: give the closed state, the fixed layer and the centering back. */
  .pg-dialog { position: fixed; inset: 0; margin: auto; width: calc(100% - var(--spacing-xl) * 2); max-width: 600px; max-height: 80svh; }
  .pg-dialog:not([open]) { display: none; }
  .pg-dialog::backdrop { background: var(--background-overlay, rgb(0 0 0 / .5)); }
  /* Desktop: fade, as the NDS Modal does. */
  .pg-dialog, .pg-dialog::backdrop { opacity: 0; }
  .pg-dialog[open], .pg-dialog[open]::backdrop { opacity: 1; }
  @starting-style { .pg-dialog[open], .pg-dialog[open]::backdrop { opacity: 0; } }
  /* Phone: the NDS Modal's bottom sheet, sliding up. */
  @media (width < 600px) {
    .pg-dialog { width: 100%; max-width: 100%; margin: 0; inset: auto 0 0 0; min-height: 256px; border-radius: var(--radius-lg) var(--radius-lg) 0 0; opacity: 1; transform: translateY(100%); }
    .pg-dialog[open] { transform: none; }
    @starting-style { .pg-dialog[open] { transform: translateY(100%); opacity: 1; } }
    .pg-dialog .nds-card-actions { flex-direction: column; gap: var(--spacing-lg, 12px); }
    .pg-dialog .nds-card-actions .nds-btn { width: 100%; }
    .pg-dialog .nds-card-actions .nds-label { text-align: center; }
  }
  /* A Panel on <dialog>: show() for plain and static (no top layer, so the main nav stays above), showModal() for modal. */
  .pg-panel { position: fixed; z-index: 999; inset-block: var(--_header-offset, var(--nds-nav-height, 72px)) 0; inset-inline: auto 0; width: min(420px, 100vw); height: auto; max-width: none; max-height: none;
    margin: 0; padding: 0; border: 0; overflow: hidden; flex-direction: column; background: var(--background-menu); color: var(--text-default); box-shadow: var(--shadow-md);
    transform: translateX(-100%); transition: transform var(--nds-transition), display var(--nds-transition) allow-discrete, overlay var(--nds-transition) allow-discrete; }
  [dir="ltr"] .pg-panel { transform: translateX(100%); }
  .pg-panel[open] { display: flex; transform: none; }
  @starting-style { .pg-panel[open] { transform: translateX(-100%); } }
  [dir="ltr"] .pg-panel[open] { transform: none; }
  @starting-style { [dir="ltr"] .pg-panel[open] { transform: translateX(100%); } }
  .pg-panel:not([open]) { display: none; }
  /* A modal Panel covers the nav anyway: full height, no header offset. */
  .pg-panel:modal { inset-block-start: var(--panel-top, 0); }
  .pg-panel::backdrop { background: transparent; }
  .pg-panel:modal::backdrop { background: var(--background-overlay, rgb(0 0 0 / .5)); transition: opacity var(--nds-transition); }
  /* Stacked dim layers: the dialog under the top modal drops its own. */
  [data-pg-under]::backdrop { opacity: 0; }
</style>

<section class="nds-content-section pg-demo">
  <div class="nds-section-wrapper">
    <div class="nds-section-head">
      <h2 class="nds-section-title">Popover and dialog: old vs new</h2>
      <p class="nds-section-description">In each row, the first box is today's NDS and the second is the native top layer. Open each one and read the line under it.</p>
    </div>
    <div class="nds-section-body">

      <h3>1. A menu inside a card that clips</h3>
      <div class="pg-row">
        <div class="pg-box"><b>Old: NDS Dropmenu</b>
          <div class="pg-clip">
            <div class="nds-dropmenu" id="pg-old-1">
              <button type="button" class="nds-btn nds-secondary-outline nds-menu-btn nds-dropmenu-trigger"><span class="nds-label">Actions</span></button>
              <div class="nds-dropmenu-menu" hidden>
                <div class="nds-dropmenu-scroll">
                  <button type="button" class="nds-btn nds-subtle nds-dropmenu-item"><i class="hgi hgi-stroke hgi-edit-02" aria-hidden="true"></i><span class="nds-label">Edit</span></button>
                  <button type="button" class="nds-btn nds-subtle nds-dropmenu-item"><i class="hgi hgi-stroke hgi-copy-01" aria-hidden="true"></i><span class="nds-label">Duplicate</span></button>
                  <button type="button" class="nds-btn nds-subtle nds-dropmenu-item"><i class="hgi hgi-stroke hgi-share-01" aria-hidden="true"></i><span class="nds-label">Share</span></button>
                </div>
              </div>
            </div>
          </div>
          <p class="pg-out" data-pg-where="pg-old-1">Open it: where does the menu go?</p>
        </div>
        <div class="pg-box"><b>New: popover</b>
          <div class="pg-clip">
            <div class="pg-popmenu">
              <button type="button" class="nds-btn nds-secondary-outline nds-menu-btn" popovertarget="pg-new-1"><span class="nds-label">Actions</span></button>
              <div class="pg-pop nds-dropmenu-menu" id="pg-new-1" popover>
                <div class="nds-dropmenu-scroll">
                  <button type="button" class="nds-btn nds-subtle nds-dropmenu-item"><i class="hgi hgi-stroke hgi-edit-02" aria-hidden="true"></i><span class="nds-label">Edit</span></button>
                  <button type="button" class="nds-btn nds-subtle nds-dropmenu-item"><i class="hgi hgi-stroke hgi-copy-01" aria-hidden="true"></i><span class="nds-label">Duplicate</span></button>
                  <button type="button" class="nds-btn nds-subtle nds-dropmenu-item"><i class="hgi hgi-stroke hgi-share-01" aria-hidden="true"></i><span class="nds-label">Share</span></button>
                </div>
              </div>
            </div>
          </div>
          <p class="pg-out" data-pg-where="pg-new-1">Open it: where does the menu go?</p>
        </div>
      </div>

      <h3>2. A menu inside a dark area</h3>
      <div class="pg-row">
        <div class="pg-box"><b>Old: NDS Dropmenu</b>
          <div class="pg-dark" data-theme="dark">
            <div class="nds-dropmenu" id="pg-old-2">
              <button type="button" class="nds-btn nds-secondary-outline nds-menu-btn nds-dropmenu-trigger"><span class="nds-label">Actions</span></button>
              <div class="nds-dropmenu-menu" hidden>
                <div class="nds-dropmenu-scroll">
                  <button type="button" class="nds-btn nds-subtle nds-dropmenu-item"><span class="nds-label">Edit</span></button>
                  <button type="button" class="nds-btn nds-subtle nds-dropmenu-item"><span class="nds-label">Duplicate</span></button>
                </div>
              </div>
            </div>
          </div>
          <p class="pg-out">Is the open menu dark too?</p>
        </div>
        <div class="pg-box"><b>New: popover</b>
          <div class="pg-dark" data-theme="dark">
            <div class="pg-popmenu">
              <button type="button" class="nds-btn nds-secondary-outline nds-menu-btn" popovertarget="pg-new-2"><span class="nds-label">Actions</span></button>
              <div class="pg-pop nds-dropmenu-menu" id="pg-new-2" popover>
                <div class="nds-dropmenu-scroll">
                  <button type="button" class="nds-btn nds-subtle nds-dropmenu-item"><span class="nds-label">Edit</span></button>
                  <button type="button" class="nds-btn nds-subtle nds-dropmenu-item"><span class="nds-label">Duplicate</span></button>
                </div>
              </div>
            </div>
          </div>
          <p class="pg-out">Is the open menu dark too?</p>
        </div>
      </div>

      <h3>3. A listener on the box around the menu</h3>
      <div class="pg-row">
        <div class="pg-box" data-pg-count><b>Old: NDS Dropmenu</b>
          <div class="nds-dropmenu">
            <button type="button" class="nds-btn nds-secondary-outline nds-menu-btn nds-dropmenu-trigger"><span class="nds-label">Pick</span></button>
            <div class="nds-dropmenu-menu" hidden>
              <div class="nds-dropmenu-scroll">
                <button type="button" class="nds-btn nds-subtle nds-dropmenu-item"><span class="nds-label">One</span></button>
                <button type="button" class="nds-btn nds-subtle nds-dropmenu-item"><span class="nds-label">Two</span></button>
              </div>
            </div>
          </div>
          <p class="pg-out">Item clicks this box heard: <output>0</output></p>
        </div>
        <div class="pg-box" data-pg-count><b>New: popover</b>
          <div class="pg-popmenu">
            <button type="button" class="nds-btn nds-secondary-outline nds-menu-btn" popovertarget="pg-new-3"><span class="nds-label">Pick</span></button>
            <div class="pg-pop nds-dropmenu-menu" id="pg-new-3" popover>
              <div class="nds-dropmenu-scroll">
                <button type="button" class="nds-btn nds-subtle nds-dropmenu-item" popovertarget="pg-new-3" popovertargetaction="hide"><span class="nds-label">One</span></button>
                <button type="button" class="nds-btn nds-subtle nds-dropmenu-item" popovertarget="pg-new-3" popovertargetaction="hide"><span class="nds-label">Two</span></button>
              </div>
            </div>
          </div>
          <p class="pg-out">Item clicks this box heard: <output>0</output></p>
        </div>
      </div>

      <h3>4. A modal</h3>
      <div class="pg-row">
        <div class="pg-box"><b>Old: NDS Modal</b>
          <button type="button" class="nds-btn nds-primary nds-lg" data-modal-target="pg-old-modal"><span class="nds-label">Open Modal</span></button>
          <div id="pg-old-modal" class="nds-modal nds-card nds-stroke" role="dialog" aria-modal="true" aria-labelledby="pg-old-modal-title" aria-hidden="true" hidden>
            <div class="nds-card-header">
              <div class="nds-card-featured-icon"><span class="nds-featured-icon nds-circle"><i class="nds-icon nds-hgi-information-circle" aria-hidden="true"></i></span></div>
              <button type="button" class="nds-close nds-modal-close nds-btn nds-subtle nds-icon-only" aria-label="Close"><i class="nds-icon nds-hgi-cancel-01" aria-hidden="true"></i></button>
            </div>
            <div class="nds-card-content"><div class="nds-card-text">
              <span class="nds-card-title" id="pg-old-modal-title">Withdraw the application?</span>
              <p class="nds-card-description">The application leaves the review queue. You can submit it again later.</p>
            </div></div>
            <div class="nds-card-actions">
              <button type="button" class="nds-btn nds-primary nds-lg" data-modal-close><span class="nds-label">Withdraw</span></button>
              <button type="button" class="nds-btn nds-secondary-outline nds-lg" data-modal-close><span class="nds-label">Cancel</span></button>
            </div>
          </div>
          <p class="pg-out">Try Tab, Esc, a click outside and scrolling the page.</p>
        </div>
        <div class="pg-box"><b>New: &lt;dialog&gt;</b>
          <button type="button" class="nds-btn nds-primary nds-lg" data-pg-dialog="pg-new-modal"><span class="nds-label">Open Modal</span></button>
          <dialog id="pg-new-modal" class="pg-dialog nds-card nds-stroke" aria-labelledby="pg-new-modal-title">
            <form method="dialog" class="nds-form">
              <div class="nds-card-header">
                <div class="nds-card-featured-icon"><span class="nds-featured-icon nds-circle"><i class="nds-icon nds-hgi-information-circle" aria-hidden="true"></i></span></div>
                <button class="nds-close nds-btn nds-subtle nds-icon-only" aria-label="Close"><i class="nds-icon nds-hgi-cancel-01" aria-hidden="true"></i></button>
              </div>
              <div class="nds-card-content"><div class="nds-card-text">
                <span class="nds-card-title" id="pg-new-modal-title">Withdraw the application?</span>
                <p class="nds-card-description">The application leaves the review queue. You can submit it again later.</p>
              </div></div>
              <div class="nds-card-actions">
                <button class="nds-btn nds-primary nds-lg" value="withdraw"><span class="nds-label">Withdraw</span></button>
                <button class="nds-btn nds-secondary-outline nds-lg" value="cancel"><span class="nds-label">Cancel</span></button>
              </div>
            </form>
          </dialog>
          <p class="pg-out">Try Tab, Esc, a click outside and scrolling the page. The scroll lock is NDS's: <code>&lt;dialog&gt;</code> has none.</p>
        </div>
      </div>

      <h3>5. A Panel, and a Modal over a modal Panel</h3>
      <div class="pg-row">
        <div class="pg-box"><b>Old: NDS Panel</b>
          <div class="nds-btn-group">
            <button type="button" class="nds-btn nds-secondary-outline" data-panel-toggle="pg-old-panel"><span class="nds-label">Plain</span></button>
            <button type="button" class="nds-btn nds-secondary-outline" data-panel-toggle="pg-old-spanel"><span class="nds-label">Static</span></button>
            <button type="button" class="nds-btn nds-secondary-outline" data-panel-toggle="pg-old-mpanel"><span class="nds-label">Modal</span></button>
          </div>
          {%- assign pg_panels = "pg-old-panel:Plain,pg-old-spanel:Static,pg-old-mpanel:Modal" | split: "," %}
          {%- for p in pg_panels %}
          {%- assign kv = p | split: ":" %}
          <aside id="{{ kv[0] }}" class="nds-panel" aria-label="{{ kv[1] }} Panel"{% if kv[1] == "Static" %} data-panel-static{% endif %}{% if kv[1] == "Modal" %} data-panel-modal{% endif %} hidden>
            <div class="nds-panel-header">
              <div class="nds-panel-text"><span class="nds-panel-title">{{ kv[1] }} Panel (old)</span></div>
              <div class="nds-panel-action"><button type="button" class="nds-btn nds-subtle nds-icon-only" data-panel-close aria-label="Close panel"><i class="nds-icon nds-hgi-cancel-01" aria-hidden="true"></i></button></div>
            </div>
            <div class="nds-panel-body">
              <button type="button" class="nds-btn nds-primary" data-modal-target="pg-old-modal"><span class="nds-label">Open Modal</span></button>
            </div>
          </aside>
          {%- endfor %}
          <p class="pg-out">Open the modal Panel, then Open Modal inside it: one dim layer.</p>
        </div>
        <div class="pg-box"><b>New: one &lt;dialog&gt;, two ways</b>
          <div class="nds-btn-group">
            <button type="button" class="nds-btn nds-secondary-outline" data-pg-panel="show"><span class="nds-label">Plain or Static</span></button>
            <button type="button" class="nds-btn nds-secondary-outline" data-pg-panel="modal"><span class="nds-label">Modal</span></button>
          </div>
          <dialog id="pg-new-panel" class="pg-panel" aria-labelledby="pg-new-panel-title">
            <div class="nds-panel-header">
              <div class="nds-panel-text"><span class="nds-panel-title" id="pg-new-panel-title">Panel (new)</span></div>
              <div class="nds-panel-action"><button type="button" class="nds-btn nds-subtle nds-icon-only" data-pg-close aria-label="Close panel"><i class="nds-icon nds-hgi-cancel-01" aria-hidden="true"></i></button></div>
            </div>
            <div class="nds-panel-body">
              <button type="button" class="nds-btn nds-primary" data-pg-dialog="pg-new-modal"><span class="nds-label">Open Modal</span></button>
              <form method="dialog" class="nds-form"><button class="nds-btn nds-secondary-outline"><span class="nds-label">Close (method="dialog")</span></button></form>
            </div>
          </dialog>
          <p class="pg-out">Open each kind; then try Esc, a click outside, both close buttons, Open Modal, and Item 2 in the main nav.</p>
          <p class="pg-out" data-pg-log></p>
        </div>
      </div>

    </div>
  </div>
</section>

<script>
  (function () {
    // ponytail: prototype only. Places a popover under its button where CSS anchor
    // positioning is missing; no flip when the viewport runs out of room.
    var anchored = window.CSS && CSS.supports('position-area: block-end');
    document.querySelectorAll('.pg-pop').forEach(function (menu, i) {
      var btn = document.querySelector('[popovertarget="' + menu.id + '"]');
      // The button's open look, as Dropmenu's trigger has it.
      menu.addEventListener('toggle', function (e) {
        btn.setAttribute('aria-expanded', e.newState === 'open');
        btn.setAttribute('data-state', e.newState === 'open' ? 'open' : '');
      });
      if (anchored) {
        btn.style.setProperty('anchor-name', '--pg-a' + i);
        menu.style.setProperty('position-anchor', '--pg-a' + i);
        return;
      }
      var place = function () {
        var r = btn.getBoundingClientRect();
        menu.style.top = (r.bottom + 4) + 'px';
        if (getComputedStyle(btn).direction === 'rtl') { menu.style.right = (innerWidth - r.right) + 'px'; menu.style.left = 'auto'; }
        else { menu.style.left = r.left + 'px'; menu.style.right = 'auto'; }
      };
      menu.addEventListener('beforetoggle', function (e) { if (e.newState === 'open') place(); });
      addEventListener('scroll', function () { if (menu.matches(':popover-open')) place(); }, true);
    });

    // Where each open menu sits in the DOM.
    document.querySelectorAll('[data-pg-where]').forEach(function (out) {
      var id = out.getAttribute('data-pg-where');
      var check = function () {
        var menu = document.getElementById(id);
        menu = menu.matches('.nds-dropmenu') ? NDS.Dropmenu.menuOf(menu) : menu;
        out.textContent = menu.parentElement === document.body ? 'The menu moved to <body>.' : 'The menu stays inside the card.';
      };
      // Capture: Dropmenu's trigger handler stops the click before it bubbles here.
      document.getElementById(id).closest('.pg-box').addEventListener('click', function () { setTimeout(check, 200); }, true);
      document.getElementById(id).addEventListener?.('toggle', check);
    });

    // Item clicks each box hears through normal bubbling.
    document.querySelectorAll('[data-pg-count]').forEach(function (box) {
      var n = 0, out = box.querySelector('output');
      box.addEventListener('click', function (e) { if (e.target.closest('.nds-dropmenu-item')) out.textContent = ++n; });
    });

    // Open modals, bottom first: each one under the top drops its ::backdrop.
    var modals = [];
    // <dialog> does not lock scroll: the first modal locks it, the last one to close unlocks it.
    var showModal = function (dlg) {
      if (!modals.length) NDS.scrollLock.lock();
      modals.forEach(function (d) { d.setAttribute('data-pg-under', ''); });
      dlg.showModal();
      modals.push(dlg);
    };
    document.querySelectorAll('dialog').forEach(function (dlg) {
      dlg.addEventListener('close', function () {
        modals = modals.filter(function (d) { return d !== dlg; });
        dlg.removeAttribute('data-pg-under');
        if (modals.length) modals[modals.length - 1].removeAttribute('data-pg-under');
        else NDS.scrollLock.unlock();
      });
    });

    // A Panel on <dialog>: show() (plain, static) or showModal(). NDS keeps Esc and click-outside for a plain one.
    var panel = document.getElementById('pg-new-panel');
    var log = document.querySelector('[data-pg-log]');
    var say = function (what) {
      var cs = getComputedStyle(panel);
      log.textContent = what + ': visible ' + (cs.display !== 'none') + ', [open] ' + panel.open + ', :modal ' + panel.matches(':modal') +
        ' · Modal open ' + document.getElementById('pg-new-modal').open;
    };
    document.querySelectorAll('[data-pg-panel]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (panel.open) return;
        var kind = btn.getAttribute('data-pg-panel');
        try {
          syncTop();
          if (kind === 'modal') showModal(panel); else panel.show();
          say('Opened ' + kind);
        } catch (err) { log.textContent = 'Opened ' + kind + ' threw: ' + err.name + ' ' + err.message; }
      });
    });
    // Below the sticky header (topbar + nav) while the page scrolls, as nds-panels.js does.
    var syncTop = function () { var b = NDS.stickyHeaderBottom(); b > 0 ? panel.style.setProperty('--_header-offset', b + 'px') : panel.style.removeProperty('--_header-offset'); };
    addEventListener('scroll', function () { if (panel.open) requestAnimationFrame(syncTop); }, { passive: true });
    panel.querySelector('[data-pg-close]').addEventListener('click', function () {
      panel.close();
    });
    panel.addEventListener('close', function () { say('close'); });
    document.getElementById('pg-new-modal').addEventListener('close', function () { say('Modal closed'); });

    // <dialog>: showModal() gives the top layer, the backdrop, Esc and the inert page.
    document.querySelectorAll('[data-pg-dialog]').forEach(function (btn) {
      var dlg = document.getElementById(btn.getAttribute('data-pg-dialog'));
      btn.addEventListener('click', function () { showModal(dlg); say('Opened Modal'); });
    });
    // A click on a modal's backdrop lands on the dialog itself, outside its box.
    document.querySelectorAll('dialog').forEach(function (dlg) {
      dlg.addEventListener('click', function (e) {
        var r = dlg.getBoundingClientRect();
        if (e.target === dlg && dlg.matches(':modal') && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) dlg.close();
      });
    });
  })();
</script>
