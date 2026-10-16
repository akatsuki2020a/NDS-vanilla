// Clinics list: search, filters, sort and paging all go to /api/clinics.
(function () {
  var list = document.getElementById('clinicList');
  var count = document.getElementById('clinicCount');
  var body = list.parentElement;
  var pager = document.getElementById('clinicPager');
  var search = document.getElementById('filterSearch');
  var state = { q: '', specialty: '', branch: '', sort: '', page: 1 };
  var timer;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function when(iso) {
    return new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  function cardHtml(c) {
    return '<div class="nds-clinic-card">' +
      '<h3><a href="/doctors/' + c.doctor_ids[0] + '">' + esc(c.name) + '</a></h3>' +
      '<p>' + esc(c.specialty) + ' &middot; ' + esc(c.branch) + '</p>' +
      '<span>★ ' + c.rating.toFixed(1) + '</span>' +
      '<p>Next free slot: ' + when(c.next_slot) + '</p>' +
      '<p>' + (c.accepts_insurance ? 'Insurance accepted' : 'Self-pay only') + '</p>' +
      '</div>';
  }

  function renderPager(page, total, perPage) {
    var pages = Math.ceil(total / perPage);
    var fresh = document.createElement('nav');
    fresh.className = 'nds-pagination';
    fresh.id = 'clinicPager';
    fresh.setAttribute('aria-label', 'Pagination');
    fresh.dataset.totalPages = pages;
    fresh.dataset.activePage = page;
    fresh.hidden = pages <= 1;
    pager.replaceWith(fresh);
    pager = fresh;
    if (pages > 1) NDS.Pagination.create(fresh);
  }

  function render(data) {
    list.innerHTML = data.items.map(cardHtml).join('');
    count.textContent = data.total === 0 ? 'No clinics match your search.' : data.total + (data.total === 1 ? ' clinic found' : ' clinics found');
    renderPager(data.page, data.total, data.per_page);
  }

  function load() {
    var params = new URLSearchParams();
    Object.keys(state).forEach(function (k) {
      if (state[k]) params.set(k, state[k]);
    });
    history.replaceState(null, '', params.toString() ? '?' + params : location.pathname);
    fetch('/api/clinics?' + params)
      .then(function (res) { return res.json(); })
      .then(render)
      .catch(function () {
        count.textContent = 'Could not load the clinics. Please try again.';
        NDS.Alert.create({ variant: 'error', title: 'Something went wrong', description: 'The clinics list could not be loaded.', display: 'toast', position: 'top', duration: 4000 });
      });
  }

  function change(key, value) {
    state[key] = value;
    state.page = 1;
    load();
  }

  function preset(inputId, value) {
    var root = document.getElementById(inputId).closest('.nds-select');
    var option = root.querySelector('.nds-select-option[data-value="' + value + '"]');
    if (!option) return;
    root.querySelector('.nds-select-value').value = value;
    root.querySelector('.nds-select-input').value = option.textContent.trim();
  }

  // Selects fire selectChange on their .nds-form-control
  document.addEventListener('selectChange', function (e) {
    var root = e.target.closest('.nds-select');
    if (!root || !document.getElementById('clinicFilters').contains(root)) return;
    change(root.querySelector('.nds-select-value').name, e.detail.value);
  }, true);

  search.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () { change('q', search.value.trim()); }, 300);
  });
  search.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') change('q', search.value.trim());
  });
  document.querySelector('#clinicSearch .nds-search-btn').addEventListener('click', function () {
    change('q', search.value.trim());
  });

  // Pagination nav is rebuilt on every load, so listen on its parent
  body.addEventListener('click', function (e) {
    var btn = e.target.closest('.nds-pagination-item button');
    if (!btn || btn.disabled) return;
    var item = btn.closest('.nds-pagination-item');
    var page = state.page;
    if (item.classList.contains('nds-pagination-prev')) page -= 1;
    else if (item.classList.contains('nds-pagination-next')) page += 1;
    else page = parseInt((btn.getAttribute('aria-label') || '').replace(/\D/g, ''), 10) || state.page;
    if (page < 1 || page === state.page) return;
    state.page = page;
    load();
    list.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  var params = new URLSearchParams(location.search);
  ['q', 'specialty', 'branch', 'sort'].forEach(function (k) {
    if (params.get(k)) state[k] = params.get(k);
  });
  state.page = parseInt(params.get('page'), 10) || 1;
  search.value = state.q;
  if (state.specialty) preset('clinicSpecialty', state.specialty);
  if (state.branch) preset('clinicBranch', state.branch);
  if (state.sort) preset('clinicSort', state.sort);
  load();
})();
