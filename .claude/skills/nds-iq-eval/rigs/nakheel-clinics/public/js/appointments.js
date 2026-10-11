// Cancel a booked appointment: Bootstrap modal for the confirmation, DELETE /api/appointments/:id.
(function () {
  var modalEl = document.getElementById('cancelModal');
  var confirmBtn = document.getElementById('confirmCancel');
  var pendingId = null;

  function toast(variant, title, description) {
    NDS.Alert.create({ variant: variant, title: title, description: description, display: 'toast', position: 'top', duration: 3500 });
  }

  function markCancelled(id) {
    var row = document.querySelector('[data-appt-row="' + id + '"]');
    if (!row) return;
    var tag = row.querySelector('.nds-tag');
    tag.setAttribute('data-status', 'error');
    tag.querySelector('.nds-label').textContent = 'Cancelled';
    var btn = row.querySelector('[data-appt-id]');
    if (btn) btn.remove();
  }

  modalEl.addEventListener('show.bs.modal', function (e) {
    pendingId = e.relatedTarget ? e.relatedTarget.dataset.apptId : null;
  });

  confirmBtn.addEventListener('click', function () {
    if (!pendingId) return;
    var id = pendingId;
    confirmBtn.disabled = true;
    fetch('/api/appointments/' + id, { method: 'DELETE' }).then(function (res) {
      confirmBtn.disabled = false;
      bootstrap.Modal.getInstance(modalEl).hide();
      if (res.status === 204) {
        markCancelled(id);
        toast('success', 'Appointment cancelled', 'The time slot has been released.');
      } else if (res.status === 409) {
        toast('warning', 'Cannot cancel', 'This appointment has already taken place.');
      } else {
        toast('error', 'Something went wrong', 'The appointment could not be cancelled. Please try again.');
      }
    }).catch(function () {
      confirmBtn.disabled = false;
      toast('error', 'Something went wrong', 'The appointment could not be cancelled. Please try again.');
    });
  });
})();
