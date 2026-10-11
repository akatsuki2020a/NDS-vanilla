'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RemoveIcon from '@mui/icons-material/Remove';
import { useCart } from './CartProvider';
import { removeLine, updateQty } from '@/lib/actions';
import type { CartLineView } from '@/lib/cart-view';
import { fmt, money, num } from '@/lib/format';
import type { Dictionary, Locale } from '@/lib/i18n';

export default function CartLines({ lines, locale, t }: { lines: CartLineView[]; locale: Locale; t: Dictionary }) {
  const { refresh } = useCart();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<CartLineView | null>(null);

  const run = (action: () => Promise<void>) =>
    startTransition(async () => {
      await action();
      await refresh();
    });

  const nameOf = (l: CartLineView) => (locale === 'ar' ? l.name_ar : l.name_en);

  return (
    <>
      <Stack component="ul" spacing={2} sx={{ listStyle: 'none', p: 0, m: 0, opacity: pending ? 0.6 : 1 }}>
        {lines.map((line) => {
          const name = nameOf(line);
          const variant = locale === 'ar' ? line.variant_ar : line.variant_en;
          const limit = Math.min(line.stock, 10);
          return (
            <Paper key={line.key} component="li" variant="outlined" sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Image src={line.image} alt="" width={80} height={80} style={{ borderRadius: 8 }} />
              <Box sx={{ flex: 1, minWidth: 160 }}>
                {line.slug ? (
                  <Typography component={Link} href={`/${locale}/products/${line.slug}`} fontWeight={600} sx={{ color: 'text.primary', textDecoration: 'none' }}>
                    {name}
                  </Typography>
                ) : (
                  <Typography fontWeight={600}>{name}</Typography>
                )}
                {variant ? (
                  <Typography variant="body2" color="text.secondary">
                    {variant}
                  </Typography>
                ) : null}
                {line.box ? (
                  <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5, color: 'text.secondary', fontSize: 14 }}>
                    {line.box.items.map((item) => (
                      <li key={item.name_en}>
                        {locale === 'ar' ? item.name_ar : item.name_en} × {num(item.qty, locale)}
                      </li>
                    ))}
                    {line.box.wrap ? <li>{t.gift.wrap}</li> : null}
                    {line.box.message ? <li>{fmt(t.gift.cardLine, { text: line.box.message })}</li> : null}
                  </Box>
                ) : null}
                <Typography variant="body2" color="text.secondary">
                  {money(line.unit, locale)}
                </Typography>
              </Box>
              <Stack direction="row" alignItems="center">
                <IconButton aria-label={t.product.decrease} disabled={pending || line.qty <= 1} onClick={() => run(() => updateQty(line.key, line.qty - 1))}>
                  <RemoveIcon />
                </IconButton>
                <Typography component="span" sx={{ minWidth: 28, textAlign: 'center' }} aria-live="polite">
                  {num(line.qty, locale)}
                </Typography>
                <IconButton aria-label={t.product.increase} disabled={pending || line.qty >= limit} onClick={() => run(() => updateQty(line.key, line.qty + 1))}>
                  <AddIcon />
                </IconButton>
              </Stack>
              <Typography fontWeight={700} sx={{ minWidth: 90, textAlign: 'end' }}>
                {money(line.total, locale)}
              </Typography>
              <IconButton aria-label={`${t.common.remove} ${name}`} disabled={pending} onClick={() => setConfirming(line)}>
                <DeleteOutlineIcon />
              </IconButton>
            </Paper>
          );
        })}
      </Stack>

      <Dialog open={Boolean(confirming)} onClose={() => setConfirming(null)} aria-labelledby="remove-title">
        <DialogTitle id="remove-title">{t.cart.removeTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirming ? fmt(t.cart.removeText, { name: nameOf(confirming) }) : ''}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirming(null)}>{t.common.cancel}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              const key = confirming?.key;
              setConfirming(null);
              if (key) run(() => removeLine(key));
            }}
          >
            {t.common.remove}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
