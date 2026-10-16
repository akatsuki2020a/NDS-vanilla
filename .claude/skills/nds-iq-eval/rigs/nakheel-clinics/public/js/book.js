// Booking form: five-step stepper, doctors per clinic, POST /api/appointments.
(function () {
  var form = document.getElementById('book-form');
  var stepper = document.getElementById('bookStepper');
  var panels = document.querySelectorAll('[data-form-step]');
  var requiredNotice = document.querySelector('#bookForm .nds-required-notice');
  var clinicSelect = document.getElementById('bk-clinic').closest('.nds-select');
  var doctorSelect = document.getElementById('bk-doctor').closest('.nds-select');
  var LAST = 5;
  var reference = '';

  var FIELDS = {
    clinic_id: { id: 'bk-clinic', step: 1 },
    doctor_id: { id: 'bk-doctor', step: 1 },
    date: { id: 'bk-date', step: 1 },
    time: { id: 'bk-time', step: 1 },
    phone: { id: 'bk-phone', step: 2 },
    reason: { id: 'bk-reason', step: 2 }
  };

  function container(id) {
    return document.getElementById(id).closest('.nds-form-container');
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function showPanel(step) {
    panels.forEach(function (p) {
      p.hidden = parseInt(p.dataset.formStep, 10) !== step;
    });
    // The success panel has no required fields, so hide the notice there.
    if (requiredNotice) requiredNotice.hidden = step === LAST;
    // Only scroll when the form top is hidden behind the sticky nav, and offset by nav height.
    var main = document.querySelector('#bookForm .nds-info-content');
    if (main) {
      var nav = document.querySelector('.nds-main-nav');
      var navHeight = nav ? nav.offsetHeight : 72;
      var targetTop = main.getBoundingClientRect().top;
      if (targetTop < navHeight) {
        var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({
          top: targetTop + window.pageYOffset - navHeight - 16,
          behavior: reduced ? 'auto' : 'smooth'
        });
      }
    }
    var panel = document.querySelector('#book-form [data-form-step]:not([hidden])');
    if (panel) focusNext(panel);
  }

  // Move focus into the new panel so keyboard users don't stay on the previous step's button.
  function focusNext(panel) {
    var target = panel.querySelector('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])');
    if (!target) {
      target = panel.querySelector('h1, h2, h3, .nds-card-title, .nds-section-title');
      if (target && !target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    }
    if (target) target.focus({ preventScroll: true });
  }

  function valueOf(id) {
    var el = document.getElementById(id);
    return el ? (el.value || '').trim() : '';
  }

  function populateReview() {
    document.querySelectorAll('[data-review-source]').forEach(function (target) {
      var v = valueOf(target.dataset.reviewSource);
      target.textContent = v || '—';
    });
    document.querySelectorAll('[data-review-compose]').forEach(function (target) {
      var parts = target.dataset.reviewCompose.split(',').map(valueOf).filter(Boolean);
      target.textContent = parts.length ? parts.join(' · ') : '—';
    });
  }

  document.addEventListener('nds:stepper:change', function (e) {
    if (e.target.id !== 'bookStepper') return;
    var step = e.detail.currentStep;
    var panelStep = Math.min(step, LAST);
    showPanel(panelStep);
    if (panelStep === 4) populateReview();
    if (panelStep === LAST) {
      document.getElementById('bk-reference').textContent = reference || '—';
      // Push past the total so every step shows as completed on the non-radial layouts.
      if (step === LAST && !stepper.classList.contains('nds-radial')) {
        queueMicrotask(function () { stepper.dataset.current = String(LAST + 1); });
      }
    }
  });

  // Custom select: set value and label without a click
  function setSelect(root, value) {
    var option = root.querySelector('.nds-select-option[data-value="' + value + '"]');
    if (!option) return;
    root.querySelector('.nds-select-value').value = value;
    root.querySelector('.nds-select-input').value = option.textContent.trim();
  }

  function clearSelect(root) {
    root.querySelector('.nds-select-value').value = '';
    root.querySelector('.nds-select-input').value = '';
  }

  // The doctor list depends on the clinic: each clinic option carries its doctor ids.
  function loadDoctors(clinicId, preselect) {
    var option = clinicSelect.querySelector('.nds-select-option[data-value="' + clinicId + '"]');
    var ids = option && option.dataset.doctors ? option.dataset.doctors.split(',') : [];
    return Promise.all(ids.map(function (id) {
      return fetch('/api/doctors/' + id).then(function (res) { return res.json(); });
    })).then(function (docs) {
      doctorSelect.querySelector('.nds-select-options').innerHTML = docs.map(function (d) {
        return '<button type="button" class="nds-btn nds-subtle nds-select-option" data-value="' + d.id + '">' +
          '<span class="nds-option-text">' + esc(d.name) + ' (' + esc(d.title) + ')</span></button>';
      }).join('');
      clearSelect(doctorSelect);
      doctorSelect.querySelector('.nds-select-input').placeholder = 'Choose a doctor';
      NDS.Forms.initializeContainer(doctorSelect);
      if (preselect) setSelect(doctorSelect, preselect);
    });
  }

  document.addEventListener('selectChange', function (e) {
    if (e.target.closest('.nds-select') === clinicSelect) loadDoctors(e.detail.value);
  }, true);

  function toIso(dmy) {
    var p = dmy.split('/');
    return p.length === 3 ? p[2] + '-' + p[1].padStart(2, '0') + '-' + p[0].padStart(2, '0') : '';
  }

  function payload() {
    return {
      clinic_id: Number(valueFromHidden(clinicSelect)),
      doctor_id: Number(valueFromHidden(doctorSelect)),
      date: toIso(valueOf('bk-date')),
      time: valueFromHidden(document.getElementById('bk-time').closest('.nds-select')),
      reason: valueOf('bk-reason'),
      phone: valueOf('bk-phone')
    };
  }

  function valueFromHidden(root) {
    return root.querySelector('.nds-select-value').value;
  }

  function showErrors(errors) {
    var first = null;
    Object.keys(errors).forEach(function (key) {
      var f = FIELDS[key];
      if (!f) return;
      NDS.Forms.setStatus({ element: container(f.id), status: 'error', message: errors[key] });
      if (!first || f.step < first) first = f.step;
    });
    if (first) NDS.Stepper.goTo('bookStepper', first);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var check = NDS.Forms.validateForm(form);
    if (!check.valid) {
      var bad = check.invalidFields && check.invalidFields[0];
      var panel = bad && bad.closest ? bad.closest('[data-form-step]') : null;
      if (panel) NDS.Stepper.goTo('bookStepper', parseInt(panel.dataset.formStep, 10));
      return;
    }
    var btn = document.getElementById('bookSubmit');
    btn.dataset.state = 'loading';
    fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload())
    }).then(function (res) {
      return res.json().then(function (data) { return { status: res.status, data: data }; });
    }).then(function (r) {
      btn.removeAttribute('data-state');
      if (r.status === 201) {
        reference = 'APT-' + new Date().getFullYear() + '-' + String(r.data.id).padStart(4, '0');
        NDS.Stepper.next('bookStepper');
      } else if (r.status === 422) {
        showErrors(r.data.errors);
      } else {
        throw new Error('unexpected status ' + r.status);
      }
    }).catch(function () {
      btn.removeAttribute('data-state');
      NDS.Alert.create({ variant: 'error', title: 'Booking failed', description: 'We could not book your appointment. Please try again.', display: 'toast', position: 'top', duration: 4000 });
    });
  });

  // Arriving from a doctor page: /book?clinic=ID&doctor=ID
  var params = new URLSearchParams(location.search);
  var clinicParam = params.get('clinic');
  if (clinicParam) {
    setSelect(clinicSelect, clinicParam);
    loadDoctors(clinicParam, params.get('doctor'));
  }
})();
