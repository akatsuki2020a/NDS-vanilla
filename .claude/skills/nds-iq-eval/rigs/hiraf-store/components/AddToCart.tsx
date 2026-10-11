'use client';

import { useState, useTransition } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import Price from './Price';
import { useCart } from './CartProvider';
import { addToCart } from '@/lib/actions';
import { fmt } from '@/lib/format';
import type { Dictionary, Locale } from '@/lib/i18n';

type Props = {
  locale: Locale;
  t: Dictionary;
  productId: string;
  price: number;
  compareAt?: number;
  stock: number;
  lowStock: number;
  variants?: { id: string; label: string; delta: number }[];
};

const MAX_QTY = 10;

export default function AddToCart({ locale, t, productId, price, compareAt, stock, lowStock, variants }: Props) {
  const { refresh, openMini } = useCart();
  const [variant, setVariant] = useState(variants?.[0]?.id);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [pending, startTransition] = useTransition();

  const delta = variants?.find((v) => v.id === variant)?.delta ?? 0;
  const limit = Math.min(stock, MAX_QTY);
  const out = stock <= 0;

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await addToCart({ productId, variant, qty });
      if (!result.ok) {
        setError(t.product.errors[result.error]);
        return;
      }
      await refresh();
      openMini();
      setAdded(true);
    });
  }

  return (
    <Stack spacing={2.5}>
      <Price price={price + delta} compareAt={compareAt ? compareAt + delta : undefined} locale={locale} large />
      <Typography variant="caption" color="text.secondary">
        {t.common.vatIncluded}
      </Typography>

      {variants ? (
        <div>
          <Typography id="variant-label" variant="subtitle2" gutterBottom>
            {t.product.variant}
          </Typography>
          <ToggleButtonGroup
            exclusive
            color="primary"
            size="small"
            value={variant}
            aria-labelledby="variant-label"
            onChange={(_, value: string | null) => value && setVariant(value)}
          >
            {variants.map((v) => (
              <ToggleButton key={v.id} value={v.id} sx={{ px: 2 }}>
                {v.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
      ) : null}

      <Stack direction="row" spacing={1} alignItems="center">
        <IconButton aria-label={t.product.decrease} onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={out || qty <= 1}>
          <RemoveIcon />
        </IconButton>
        <TextField
          type="number"
          size="small"
          label={t.product.quantity}
          value={qty}
          disabled={out}
          onChange={(e) => setQty(Math.min(Math.max(1, Number(e.target.value) || 1), Math.max(limit, 1)))}
          slotProps={{ htmlInput: { min: 1, max: limit, inputMode: 'numeric' } }}
          sx={{ width: 96 }}
        />
        <IconButton aria-label={t.product.increase} onClick={() => setQty((q) => Math.min(limit, q + 1))} disabled={out || qty >= limit}>
          <AddIcon />
        </IconButton>
      </Stack>

      {out ? (
        <Typography color="error" fontWeight={600}>
          {t.common.outOfStock}
        </Typography>
      ) : stock <= lowStock ? (
        <Typography color="warning.main" fontWeight={600}>
          {fmt(t.common.lowStock, { n: stock })}
        </Typography>
      ) : (
        <Typography color="success.main">{t.common.inStock}</Typography>
      )}

      <Button variant="contained" size="large" disabled={out || pending} onClick={submit}>
        {pending ? t.product.adding : t.product.addToCart}
      </Button>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Snackbar open={added} autoHideDuration={4000} onClose={() => setAdded(false)}>
        <Alert severity="success" variant="filled" onClose={() => setAdded(false)}>
          {t.product.added}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
