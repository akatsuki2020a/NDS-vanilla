'use client';

import { useActionState, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { updateOrderStatus, type StatusState } from '@/lib/actions';
import type { Dictionary, Locale } from '@/lib/i18n';
import { ORDER_STATUSES, type OrderStatus } from '@/lib/store';

export default function StatusForm({
  orderId,
  current,
  locale,
  t,
}: {
  orderId: string;
  current: OrderStatus;
  locale: Locale;
  t: Dictionary;
}) {
  const [state, formAction, pending] = useActionState<StatusState, FormData>(updateOrderStatus, {});
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (state.ok) setDone(true);
  }, [state]);

  return (
    <Stack component="form" action={formAction} spacing={2}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="id" value={orderId} />
      <TextField select name="status" label={t.admin.newStatus} defaultValue={current} error={Boolean(state.error)} helperText={state.error} size="small">
        {ORDER_STATUSES.map((s) => (
          <MenuItem key={s} value={s}>
            {t.status[s]}
          </MenuItem>
        ))}
      </TextField>
      <TextField name="note" label={t.admin.note} size="small" multiline minRows={2} />
      <div>
        <Button type="submit" variant="contained" disabled={pending}>
          {t.admin.updateStatus}
        </Button>
      </div>
      <Snackbar open={done} autoHideDuration={4000} onClose={() => setDone(false)}>
        <Alert severity="success" variant="filled" onClose={() => setDone(false)}>
          {t.admin.updated}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
