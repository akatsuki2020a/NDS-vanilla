'use client';

import { useActionState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { contactAction, type ContactState } from '@/lib/actions';
import type { Dictionary, Locale } from '@/lib/i18n';

export default function ContactForm({ locale, t }: { locale: Locale; t: Dictionary }) {
  const [state, formAction, pending] = useActionState<ContactState, FormData>(contactAction, { errors: {} });
  const { errors } = state;

  return (
    <Stack component="form" action={formAction} noValidate spacing={2} sx={{ mt: 4 }}>
      <input type="hidden" name="locale" value={locale} />
      {state.ok ? <Alert severity="success">{t.contact.success}</Alert> : null}
      <TextField name="name" label={t.contact.name} autoComplete="name" error={Boolean(errors.name)} helperText={errors.name} />
      <TextField
        name="email"
        type="email"
        label={t.contact.email}
        autoComplete="email"
        slotProps={{ htmlInput: { dir: 'ltr' } }}
        error={Boolean(errors.email)}
        helperText={errors.email}
      />
      <TextField name="message" label={t.contact.message} multiline minRows={4} error={Boolean(errors.message)} helperText={errors.message} />
      <div>
        <Button type="submit" variant="contained" disabled={pending}>
          {t.contact.send}
        </Button>
      </div>
    </Stack>
  );
}
