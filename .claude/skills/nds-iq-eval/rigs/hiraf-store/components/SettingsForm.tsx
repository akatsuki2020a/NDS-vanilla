'use client';

import { useActionState, useEffect, useState, type KeyboardEvent, type ReactNode } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { saveSettingsAction, type SettingsState } from '@/lib/actions';
import type { Dictionary, Locale } from '@/lib/i18n';
import type { Settings } from '@/lib/settings';

// Number fields are strings while typing.
type Form = { fee: string; freeOver: string; vatNumber: string; open: boolean; closedMessage: string; emails: string[] };

const toForm = (s: Settings): Form => ({
  fee: String(s.shipping.fee),
  freeOver: String(s.shipping.freeOver),
  vatNumber: s.tax.vatNumber,
  open: s.store.open,
  closedMessage: s.store.closedMessage,
  emails: s.notifications.emails,
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper component="section" variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Stack spacing={2.5} sx={{ maxWidth: 520 }}>
        {children}
      </Stack>
    </Paper>
  );
}

export default function SettingsForm({ locale, t, initial }: { locale: Locale; t: Dictionary; initial: Settings }) {
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(saveSettingsAction, { errors: {} });
  const [saved, setSaved] = useState(() => toForm(initial));
  const [draft, setDraft] = useState(saved);
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [done, setDone] = useState(false);
  const errors = state.errors;
  const s = t.admin.settings;

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  useEffect(() => {
    if (!state.settings) return;
    const next = toForm(state.settings);
    setSaved(next);
    setDraft(next);
    setDone(true);
  }, [state]);

  // Ask before the tab closes or reloads with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const patch = (change: Partial<Form>) => setDraft((d) => ({ ...d, ...change }));

  function addEmail() {
    const value = emailInput.trim();
    if (!value) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return setEmailError(t.validation.email);
    if (draft.emails.includes(value)) return setEmailError(s.emailExists);
    patch({ emails: [...draft.emails, value] });
    setEmailInput('');
    setEmailError('');
  }

  const onEmailKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  const payload = JSON.stringify({
    shipping: { fee: draft.fee, freeOver: draft.freeOver },
    tax: { vatNumber: draft.vatNumber },
    store: { open: draft.open, closedMessage: draft.closedMessage },
    notifications: { emails: draft.emails },
  });

  return (
    <form action={formAction} noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="payload" value={payload} />
      <Stack spacing={3}>
        {errors._form ? <Alert severity="error">{errors._form}</Alert> : null}

        <Section title={s.shippingTitle}>
          <TextField
            label={s.fee}
            type="number"
            value={draft.fee}
            onChange={(e) => patch({ fee: e.target.value })}
            error={Boolean(errors.shippingFee)}
            helperText={errors.shippingFee}
            slotProps={{ input: { endAdornment: <InputAdornment position="end">{t.cart.currency}</InputAdornment> } }}
          />
          <TextField
            label={s.freeOver}
            type="number"
            value={draft.freeOver}
            onChange={(e) => patch({ freeOver: e.target.value })}
            error={Boolean(errors.freeOver)}
            helperText={errors.freeOver ?? s.freeOverHint}
            slotProps={{ input: { endAdornment: <InputAdornment position="end">{t.cart.currency}</InputAdornment> } }}
          />
        </Section>

        <Section title={s.taxTitle}>
          <TextField
            label={s.vatNumber}
            value={draft.vatNumber}
            onChange={(e) => patch({ vatNumber: e.target.value.replace(/\D/g, '').slice(0, 15) })}
            error={Boolean(errors.vatNumber)}
            helperText={errors.vatNumber ?? s.vatHint}
            slotProps={{ htmlInput: { inputMode: 'numeric', dir: 'ltr' } }}
          />
        </Section>

        <Section title={s.storeTitle}>
          <FormControlLabel
            label={draft.open ? s.open : s.closed}
            control={<Switch checked={draft.open} onChange={(e) => patch({ open: e.target.checked })} />}
          />
          <TextField
            label={s.closedMessage}
            multiline
            minRows={2}
            value={draft.closedMessage}
            onChange={(e) => patch({ closedMessage: e.target.value })}
            error={Boolean(errors.closedMessage)}
            helperText={errors.closedMessage ?? s.closedHint}
          />
        </Section>

        <Section title={s.notifyTitle}>
          <Typography variant="body2" color="text.secondary">
            {s.notifyHint}
          </Typography>
          <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap' }}>
            {draft.emails.map((email) => (
              <Chip key={email} label={email} onDelete={() => patch({ emails: draft.emails.filter((x) => x !== email) })} />
            ))}
            {draft.emails.length === 0 ? <Typography variant="body2" color="text.secondary">{s.noEmails}</Typography> : null}
          </Stack>
          {errors.emails ? <Alert severity="error">{errors.emails}</Alert> : null}
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <TextField
              label={s.addEmail}
              type="email"
              size="small"
              fullWidth
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                setEmailError('');
              }}
              onKeyDown={onEmailKey}
              error={Boolean(emailError)}
              helperText={emailError}
              slotProps={{ htmlInput: { dir: 'ltr' } }}
            />
            <Button type="button" variant="outlined" onClick={addEmail} sx={{ flexShrink: 0 }}>
              {s.add}
            </Button>
          </Stack>
        </Section>

        {dirty ? (
          <Paper
            elevation={8}
            role="region"
            aria-label={s.unsaved}
            sx={{ position: 'sticky', bottom: 0, zIndex: 2, p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', borderTop: 2, borderColor: 'warning.main' }}
          >
            <Typography sx={{ flex: 1, fontWeight: 600 }}>{s.unsaved}</Typography>
            <Button type="button" onClick={() => setDraft(saved)} disabled={pending}>
              {s.discard}
            </Button>
            <Button type="submit" variant="contained" disabled={pending}>
              {pending ? s.saving : s.save}
            </Button>
          </Paper>
        ) : null}
      </Stack>

      <Snackbar open={done} autoHideDuration={4000} onClose={() => setDone(false)}>
        <Alert severity="success" variant="filled" onClose={() => setDone(false)}>
          {s.savedMessage}
        </Alert>
      </Snackbar>
    </form>
  );
}
