'use client';

import { useActionState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { applyCoupon, removeCoupon, type CouponState } from '@/lib/actions';
import { fmt } from '@/lib/format';
import type { Dictionary, Locale } from '@/lib/i18n';

export default function CouponForm({ locale, t, applied }: { locale: Locale; t: Dictionary; applied?: string }) {
  const [state, formAction, pending] = useActionState<CouponState, FormData>(applyCoupon, {});

  if (applied) {
    return (
      <form action={removeCoupon}>
        <Alert
          severity="success"
          action={
            <Button type="submit" color="inherit" size="small">
              {t.cart.removeCoupon}
            </Button>
          }
        >
          {fmt(t.cart.applied, { code: applied })}
        </Alert>
      </form>
    );
  }

  return (
    <form action={formAction} noValidate>
      <input type="hidden" name="locale" value={locale} />
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <TextField
          name="code"
          label={t.cart.couponLabel}
          size="small"
          fullWidth
          autoComplete="off"
          error={Boolean(state.error)}
          helperText={state.error}
        />
        <Button type="submit" variant="outlined" disabled={pending} sx={{ flexShrink: 0 }}>
          {t.cart.apply}
        </Button>
      </Stack>
    </form>
  );
}
