// Contact form: NDS validates, then the message goes to /api/contact.
document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('contact-form');
  if (!form) return;

  function container(name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el ? el.closest('.nds-form-container') : null;
  }

  form.addEventListener('nds:formValid', function () {
    var data = {};
    new FormData(form).forEach(function (value, key) {
      data[key] = value;
    });
    // Country code prefix comes from the dropmenu; the API wants the national number only
    delete data['country-code'];

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (res) {
      return res.json().then(function (body) { return { status: res.status, body: body }; });
    }).then(function (r) {
      if (r.status === 201) {
        NDS.Alert.create({ variant: 'success', title: 'Message sent', description: 'We will get back to you within one working day.', display: 'toast', position: 'top', duration: 3000 });
        form.reset();
      } else if (r.status === 422) {
        Object.keys(r.body.errors).forEach(function (name) {
          var c = container(name);
          if (c) NDS.Forms.setStatus({ element: c, status: 'error', message: r.body.errors[name] });
        });
      } else {
        throw new Error('unexpected status ' + r.status);
      }
    }).catch(function () {
      NDS.Alert.create({ variant: 'error', title: 'Message not sent', description: 'Something went wrong. Please try again.', display: 'toast', position: 'top', duration: 4000 });
    });
  });
});
