'use client';

import { useActionState, useEffect, useState, type ChangeEvent } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import TotalsRows from './TotalsRows';
import { checkoutAction, type CheckoutState } from '@/lib/actions';
import type { CartLineView } from '@/lib/cart-view';
import { DELIVERY_FEES, PAYMENT_FEES, withFees, type DeliveryId, type PaymentId } from '@/lib/fees';
import { money, num } from '@/lib/format';
import type { Dictionary, Locale } from '@/lib/i18n';

type Values = Record<string, string>;

const INITIAL: Values = {
  fullName: '',
  phone: '',
  city: '',
  district: '',
  street: '',
  building: '',
  notes: '',
  delivery: 'standard',
  payment: 'mada',
  cardNumber: '',
  cardName: '',
  expiry: '',
  cvv: '',
};

const STEP_FIELDS: string[][] = [
  ['fullName', 'phone', 'city', 'district', 'street', 'building', 'notes'],
  ['delivery'],
  ['payment', 'cardNumber', 'cardName', 'expiry', 'cvv'],
];

const CITIES = ['riyadh', 'jeddah', 'dammam', 'makkah', 'madinah', 'abha', 'buraydah', 'tabuk'] as const;
const DELIVERY = Object.keys(DELIVERY_FEES) as DeliveryId[];
const PAYMENT = Object.keys(PAYMENT_FEES) as PaymentId[];

export default function CheckoutForm({
  locale,
  t,
  lines,
  base,
}: {
  locale: Locale;
  t: Dictionary;
  lines: CartLineView[];
  base: { subtotal: number; discount: number; shipping: number };
}) {
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(checkoutAction, { step: 0, errors: {} });
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(INITIAL);
  const errors = state.errors;

  // The server decides which step to show next (advance, or jump back to a failing one).
  useEffect(() => setStep(state.step), [state]);

  const set = (name: string, format?: (v: string) => string) => (e: ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [name]: format ? format(e.target.value) : e.target.value }));

  const field = (name: string, format?: (v: string) => string) => ({
    name,
    value: values[name],
    onChange: set(name, format),
    error: Boolean(errors[name]),
    helperText: errors[name],
    fullWidth: true,
  });

  const usesCard = values.payment === 'mada' || values.payment === 'card';
  const totals = withFees(base, values.delivery as DeliveryId, values.payment as PaymentId);
  const last = step === STEP_FIELDS.length - 1;
  const stepLabels = [t.checkout.steps.address, t.checkout.steps.delivery, t.checkout.steps.payment];

  return (
    <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, alignItems: 'start' }}>
      <Paper component="form" action={formAction} noValidate variant="outlined" sx={{ p: { xs: 2, md: 4 } }}>
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="step" value={step} />
        <input type="hidden" name="intent" value={last ? 'place' : 'next'} />
        {Object.keys(values)
          .filter((name) => !STEP_FIELDS[step].includes(name))
          .map((name) => (
            <input key={name} type="hidden" name={name} value={values[name]} />
          ))}

        <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
          {stepLabels.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {step === 0 ? (
          <Stack spacing={2}>
            <TextField label={t.checkout.fullName} autoComplete="name" {...field('fullName')} />
            <TextField label={t.checkout.phone} placeholder="05xxxxxxxx" type="tel" autoComplete="tel" slotProps={{ htmlInput: { inputMode: 'tel', dir: 'ltr' } }} {...field('phone')} />
            <TextField select label={t.checkout.city} {...field('city')}>
              {CITIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {t.cities[c]}
                </MenuItem>
              ))}
            </TextField>
            <TextField label={t.checkout.district} {...field('district')} />
            <TextField label={t.checkout.street} {...field('street')} />
            <TextField label={t.checkout.building} slotProps={{ htmlInput: { inputMode: 'numeric' } }} {...field('building')} />
            <TextField label={t.checkout.notes} multiline minRows={2} {...field('notes')} />
          </Stack>
        ) : null}

        {step === 1 ? (
          <FormControl error={Boolean(errors.delivery)}>
            <FormLabel id="delivery-label">{t.checkout.deliveryTitle}</FormLabel>
            <RadioGroup aria-labelledby="delivery-label" name="delivery" value={values.delivery} onChange={set('delivery')}>
              {DELIVERY.map((id) => (
                <FormControlLabel
                  key={id}
                  value={id}
                  control={<Radio />}
                  label={`${t.delivery[id]}${DELIVERY_FEES[id] ? ` (+${money(DELIVERY_FEES[id], locale)})` : ''}`}
                />
              ))}
            </RadioGroup>
            <FormHelperText>{errors.delivery}</FormHelperText>
          </FormControl>
        ) : null}

        {step === 2 ? (
          <Stack spacing={3}>
            <FormControl error={Boolean(errors.payment)}>
              <FormLabel id="payment-label">{t.checkout.paymentTitle}</FormLabel>
              <RadioGroup aria-labelledby="payment-label" name="payment" value={values.payment} onChange={set('payment')}>
                {PAYMENT.map((id) => (
                  <FormControlLabel
                    key={id}
                    value={id}
                    control={<Radio />}
                    label={`${t.payment[id]}${PAYMENT_FEES[id] ? ` (+${money(PAYMENT_FEES[id], locale)})` : ''}`}
                  />
                ))}
              </RadioGroup>
              <FormHelperText>{errors.payment}</FormHelperText>
            </FormControl>

            {usesCard ? (
              <Stack spacing={2}>
                <TextField
                  label={t.checkout.cardNumber}
                  autoComplete="cc-number"
                  placeholder="0000 0000 0000 0000"
                  slotProps={{ htmlInput: { inputMode: 'numeric', dir: 'ltr', maxLength: 19 } }}
                  {...field('cardNumber', (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})(?=.)/g, '$1 '))}
                />
                <TextField label={t.checkout.cardName} autoComplete="cc-name" {...field('cardName')} />
                <Stack direction="row" spacing={2}>
                  <TextField
                    label={t.checkout.expiry}
                    placeholder="MM/YY"
                    autoComplete="cc-exp"
                    slotProps={{ htmlInput: { inputMode: 'numeric', dir: 'ltr', maxLength: 5 } }}
                    {...field('expiry', (v) => {
                      const d = v.replace(/\D/g, '').slice(0, 4);
                      return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
                    })}
                  />
                  <TextField
                    label={t.checkout.cvv}
                    autoComplete="cc-csc"
                    type="password"
                    slotProps={{ htmlInput: { inputMode: 'numeric', dir: 'ltr', maxLength: 3 } }}
                    {...field('cvv', (v) => v.replace(/\D/g, '').slice(0, 3))}
                  />
                </Stack>
              </Stack>
            ) : null}
          </Stack>
        ) : null}

        {errors._form ? (
          <Alert severity="warning" sx={{ mt: 3 }}>
            {errors._form}
          </Alert>
        ) : null}
        {Object.keys(errors).filter((k) => k !== '_form').length ? (
          <Alert severity="error" sx={{ mt: 3 }}>
            {t.checkout.fixErrors}
          </Alert>
        ) : null}

        <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
          <Button type="button" disabled={step === 0 || pending} onClick={() => setStep((s) => s - 1)}>
            {t.common.back}
          </Button>
          <Button type="submit" variant="contained" size="large" disabled={pending}>
            {last ? (pending ? t.checkout.placing : t.checkout.placeOrder) : t.common.next}
          </Button>
        </Stack>
      </Paper>

      <Paper component="aside" variant="outlined" aria-label={t.cart.summary} sx={{ p: 3, position: { md: 'sticky' }, top: 88 }}>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          {t.cart.summary}
        </Typography>
        <Stack component="ul" spacing={1} sx={{ listStyle: 'none', p: 0, m: 0, mb: 2 }}>
          {lines.map((l) => (
            <Stack key={l.key} component="li" direction="row" justifyContent="space-between" spacing={2}>
              <Typography variant="body2">
                {locale === 'ar' ? l.name_ar : l.name_en} × {num(l.qty, locale)}
              </Typography>
              <Typography variant="body2">{money(l.total, locale)}</Typography>
            </Stack>
          ))}
        </Stack>
        <TotalsRows totals={totals} locale={locale} t={t} />
      </Paper>
    </Box>
  );
}
