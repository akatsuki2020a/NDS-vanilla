'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useCart } from './CartProvider';
import { addGiftBox, type GiftState } from '@/lib/actions';
import { fmt, money, num } from '@/lib/format';
import { BOXES, BOX_SIZES, MESSAGE_MAX, MIN_BOX_ITEMS, WRAP_FEE, type BoxSize } from '@/lib/gift';
import type { Dictionary, Locale } from '@/lib/i18n';

export type GiftProduct = { id: string; name: string; image: string; price: number; slots: number; stock: number };

export default function GiftBuilder({ locale, t, products }: { locale: Locale; t: Dictionary; products: GiftProduct[] }) {
  const { refresh, openMini } = useCart();
  const [state, formAction, pending] = useActionState<GiftState, FormData>(addGiftBox, { errors: {} });
  const [size, setSize] = useState<BoxSize>('M');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [message, setMessage] = useState('');
  const [wrap, setWrap] = useState(false);

  const capacity = BOXES[size].slots;
  const chosen = products.filter((p) => counts[p.id] > 0);
  const used = chosen.reduce((sum, p) => sum + p.slots * counts[p.id], 0);
  const count = chosen.reduce((sum, p) => sum + counts[p.id], 0);
  const over = used > capacity;
  const total = BOXES[size].price + (wrap ? WRAP_FEE : 0) + chosen.reduce((sum, p) => sum + p.price * counts[p.id], 0);

  // After a successful add: refresh the badge, open the mini cart and start a new box.
  const handled = useRef(0);
  useEffect(() => {
    if (!state.ok || state.ok === handled.current) return;
    handled.current = state.ok;
    setCounts({});
    setMessage('');
    setWrap(false);
    refresh().then(openMini);
  }, [state, refresh, openMini]);

  const change = (id: string, delta: number) => setCounts((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + delta) }));

  return (
    <Box component="form" action={formAction} noValidate sx={{ display: 'grid', gap: 4, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, alignItems: 'start' }}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="size" value={size} />
      <input type="hidden" name="items" value={JSON.stringify(chosen.map((p) => ({ productId: p.id, qty: counts[p.id] })))} />

      <Stack spacing={4}>
        <section aria-labelledby="gift-size">
          <Typography id="gift-size" variant="h6" component="h2" sx={{ mb: 1.5, fontWeight: 700 }}>
            {t.gift.chooseSize}
          </Typography>
          <Box role="radiogroup" aria-labelledby="gift-size" sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {BOX_SIZES.map((s) => (
              <ButtonBase
                key={s}
                role="radio"
                aria-checked={size === s}
                onClick={() => setSize(s)}
                sx={{
                  flexDirection: 'column',
                  p: 2.5,
                  borderRadius: 2,
                  border: 2,
                  borderColor: size === s ? 'primary.main' : 'divider',
                  bgcolor: size === s ? 'action.selected' : 'background.paper',
                }}
              >
                <Typography variant="h4" component="span" fontWeight={700}>
                  {s}
                </Typography>
                <Typography component="span" fontWeight={600}>
                  {fmt(t.gift.slots, { n: num(BOXES[s].slots, locale) })}
                </Typography>
                <Typography component="span" variant="body2" color="text.secondary">
                  {money(BOXES[s].price, locale)}
                </Typography>
              </ButtonBase>
            ))}
          </Box>
          {state.errors.size ? <Alert severity="error" sx={{ mt: 1 }}>{state.errors.size}</Alert> : null}
        </section>

        <section aria-labelledby="gift-items">
          <Typography id="gift-items" variant="h6" component="h2" sx={{ mb: 0.5, fontWeight: 700 }}>
            {t.gift.chooseItems}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {t.gift.itemsHint}
          </Typography>
          <Box component="ul" sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, listStyle: 'none', p: 0, m: 0 }}>
            {products.map((p) => {
              const qty = counts[p.id] ?? 0;
              const noRoom = used + p.slots > capacity;
              const noStock = qty >= p.stock;
              const blocked = noRoom || noStock;
              return (
                <Paper key={p.id} component="li" variant="outlined" sx={{ p: 1.5, display: 'flex', gap: 1.5, alignItems: 'center', opacity: blocked && qty === 0 ? 0.7 : 1 }}>
                  <Image src={p.image} alt="" width={64} height={64} style={{ borderRadius: 8 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontWeight={600} variant="body2">
                      {p.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" component="p">
                      {money(p.price, locale)} - {fmt(t.gift.slots, { n: num(p.slots, locale) })}
                    </Typography>
                    {blocked ? (
                      <Typography variant="caption" color="warning.main" component="p">
                        {noStock ? t.gift.noStock : fmt(t.gift.noRoom, { need: num(p.slots, locale), left: num(Math.max(capacity - used, 0), locale) })}
                      </Typography>
                    ) : null}
                  </Box>
                  <Stack direction="row" alignItems="center">
                    <IconButton size="small" aria-label={`${t.product.decrease}: ${p.name}`} disabled={qty === 0} onClick={() => change(p.id, -1)}>
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <Typography component="span" sx={{ minWidth: 24, textAlign: 'center' }} aria-live="polite">
                      {num(qty, locale)}
                    </Typography>
                    <IconButton size="small" aria-label={`${t.product.increase}: ${p.name}`} disabled={blocked} onClick={() => change(p.id, 1)}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Paper>
              );
            })}
          </Box>
        </section>
      </Stack>

      <Paper component="aside" variant="outlined" aria-label={t.gift.summary} sx={{ p: 3, position: { md: 'sticky' }, top: 88 }}>
        <Stack spacing={2.5}>
          <Typography variant="h6" component="h2">
            {t.gift.summary}
          </Typography>

          <div>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" id="slots-label">
                {t.gift.slotsUsed}
              </Typography>
              <Typography variant="body2" fontWeight={700} color={over ? 'error' : 'text.primary'}>
                {num(used, locale)} / {num(capacity, locale)}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, (used / capacity) * 100)}
              color={over ? 'error' : used === capacity ? 'success' : 'primary'}
              aria-labelledby="slots-label"
              sx={{ height: 10, borderRadius: 5, mt: 0.5 }}
            />
            {over ? (
              <Typography variant="caption" color="error">
                {t.gift.over}
              </Typography>
            ) : null}
          </div>

          {chosen.length ? (
            <Stack component="ul" spacing={0.5} sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {chosen.map((p) => (
                <Stack key={p.id} component="li" direction="row" justifyContent="space-between">
                  <Typography variant="body2">
                    {p.name} × {num(counts[p.id], locale)}
                  </Typography>
                  <Typography variant="body2">{money(p.price * counts[p.id], locale)}</Typography>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {fmt(t.gift.empty, { n: MIN_BOX_ITEMS })}
            </Typography>
          )}
          {state.errors.items ? <Alert severity="error">{state.errors.items}</Alert> : null}

          <TextField
            name="message"
            label={t.gift.message}
            multiline
            minRows={2}
            size="small"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            error={Boolean(state.errors.message) || message.length > MESSAGE_MAX}
            helperText={state.errors.message ?? `${num(message.length, locale)} / ${num(MESSAGE_MAX, locale)}`}
          />
          <FormControlLabel
            label={`${t.gift.wrap} (+${money(WRAP_FEE, locale)})`}
            control={<Switch name="wrap" checked={wrap} onChange={(e) => setWrap(e.target.checked)} />}
          />

          <Stack direction="row" justifyContent="space-between">
            <Typography fontWeight={700}>{t.cart.total}</Typography>
            <Typography fontWeight={700}>{money(total, locale)}</Typography>
          </Stack>
          <Button type="submit" variant="contained" size="large" disabled={pending || over}>
            {pending ? t.product.adding : t.gift.addBox}
          </Button>
          <Typography variant="caption" color="text.secondary">
            {fmt(t.gift.count, { n: num(count, locale) })}
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
