'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import type { CartView } from '@/lib/cart-view';
import type { Locale } from '@/lib/i18n';
import { money } from '@/lib/format';

type Labels = { title: string; empty: string; viewCart: string; checkout: string; subtotal: string; close: string; qty: string };

type CartContext = {
  cart: CartView;
  refresh: () => Promise<void>;
  openMini: () => void;
};

const Ctx = createContext<CartContext | null>(null);

export function useCart(): CartContext {
  const value = useContext(Ctx);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
}

export default function CartProvider({
  locale,
  initial,
  labels,
  children,
}: {
  locale: Locale;
  initial: CartView;
  labels: Labels;
  children: ReactNode;
}) {
  const [cart, setCart] = useState(initial);
  const [open, setOpen] = useState(false);

  // A server re-render hands down a fresh cart; adopt it.
  useEffect(() => setCart(initial), [initial]);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/cart', { cache: 'no-store' });
    if (res.ok) setCart((await res.json()) as CartView);
  }, []);

  const openMini = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({ cart, refresh, openMini }), [cart, refresh, openMini]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)} sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 380 } } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
          <Typography variant="h6" component="h2">
            {labels.title}
          </Typography>
          <IconButton aria-label={labels.close} onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Divider />
        {cart.lines.length === 0 ? (
          <Typography color="text.secondary" sx={{ p: 3 }}>
            {labels.empty}
          </Typography>
        ) : (
          <Stack spacing={2} sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
            {cart.lines.map((line) => (
              <Stack key={line.key} direction="row" spacing={2} alignItems="center">
                <Image src={line.image} alt="" width={56} height={56} style={{ borderRadius: 8 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {locale === 'ar' ? line.name_ar : line.name_en}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(locale === 'ar' ? line.variant_ar : line.variant_en) ?? ''} {labels.qty} {line.qty}
                  </Typography>
                </Box>
                <Typography variant="body2">{money(line.total, locale)}</Typography>
              </Stack>
            ))}
          </Stack>
        )}
        <Divider />
        <Box sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography fontWeight={600}>{labels.subtotal}</Typography>
            <Typography fontWeight={600}>{money(cart.subtotal, locale)}</Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button component={Link} href={`/${locale}/cart`} variant="outlined" fullWidth onClick={() => setOpen(false)}>
              {labels.viewCart}
            </Button>
            <Button
              component={Link}
              href={`/${locale}/checkout`}
              variant="contained"
              fullWidth
              disabled={cart.lines.length === 0}
              onClick={() => setOpen(false)}
            >
              {labels.checkout}
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </Ctx.Provider>
  );
}
