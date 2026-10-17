/* NDS.dialog — internal core that Modal and Panel share for a <dialog>
 * Rides: <dialog> showModal() (the top layer, the dim layer, an inert page)
 * Methods:
 *   NDS.dialog.show(dlg, signal)     showModal(); the first one locks scroll. NDS owns Escape
 *                                    while signal lives (the native cancel is prevented)
 *   NDS.dialog.close(dlg)            hide its menus and close it; the last one unlocks scroll
 *   NDS.dialog.top()                 the newest open modal dialog, or undefined
 *   NDS.dialog.hideMenus(dlg)        close the open popovers inside it
 *   NDS.dialog.onOutside(dlg, fn, signal)  fn on a click on the dim layer
 * Gotchas:
 *   - <dialog> does not lock scroll: NDS.scrollLock is held from the first show() to the last close().
 *   - One dim layer: each modal dialog under the top carries data-nds-under, and CSS hides its ::backdrop.
 */
(function () {
  'use strict';

  const open = []; // modal dialogs, bottom to top

  const mark = () => open.forEach((d, i) => d.toggleAttribute('data-nds-under', i < open.length - 1));

  // ponytail: Main Navigation, Side Menu and the image viewer still dim through NDS.Backdrop; a dialog
  // above hides that layer. Goes when they move (plans/top-layer.md steps 5–6).
  const backdropUnder = (on) => document.querySelector('.nds-backdrop')?.toggleAttribute('data-nds-under', on);

  // A menu inside is a popover of its own: closing the dialog leaves it open in the top layer.
  const hideMenus = (dlg) => dlg.querySelectorAll(':popover-open').forEach((p) => p.hidePopover());

  // A click on the dim layer lands on the dialog itself, outside its box.
  const outside = (dlg, e) => {
    if (e.target !== dlg) return false;
    const r = dlg.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  };

  function show(dlg, signal) {
    if (!open.includes(dlg)) {
      if (!open.length) {
        NDS.scrollLock.lock();
        backdropUnder(true);
      }
      open.push(dlg);
      mark();
    }
    // An Escape a control inside stopped short of the component's own handler.
    dlg.addEventListener('cancel', (e) => e.preventDefault(), { signal });
    // Re-opened during its fade, it is still open.
    if (!dlg.open) dlg.showModal();
  }

  function close(dlg) {
    hideMenus(dlg);
    if (dlg.open) dlg.close();
    const i = open.indexOf(dlg);
    if (i < 0) return;
    open.splice(i, 1);
    dlg.removeAttribute('data-nds-under');
    mark();
    if (!open.length) {
      backdropUnder(false);
      NDS.scrollLock.unlock();
    }
  }

  // Down and up both outside: a text selection dragged out of the box is not a dismiss.
  function onOutside(dlg, fn, signal) {
    let down = false;
    dlg.addEventListener('pointerdown', (e) => { down = outside(dlg, e); }, { signal });
    dlg.addEventListener('click', (e) => { if (down && outside(dlg, e)) fn(); }, { signal });
  }

  NDS.dialog = {
    show,
    close,
    top: () => open[open.length - 1],
    hideMenus,
    onOutside
  };
})();
