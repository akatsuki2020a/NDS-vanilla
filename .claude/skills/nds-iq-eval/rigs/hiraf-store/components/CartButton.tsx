'use client';

import Link from 'next/link';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCartOutlined';
import { useCart } from './CartProvider';

export default function CartButton({ locale, label }: { locale: string; label: string }) {
  const { cart } = useCart();

  return (
    <IconButton component={Link} href={`/${locale}/cart`} color="inherit" aria-label={`${label} (${cart.count})`}>
      <Badge badgeContent={cart.count} color="secondary" showZero={false}>
        <ShoppingCartIcon />
      </Badge>
    </IconButton>
  );
}
