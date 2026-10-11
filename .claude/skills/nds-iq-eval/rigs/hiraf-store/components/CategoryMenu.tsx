'use client';

import { useState, type MouseEvent } from 'react';
import Link from 'next/link';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

export default function CategoryMenu({
  label,
  allLabel,
  locale,
  items,
}: {
  label: string;
  allLabel: string;
  locale: string;
  items: { id: string; name: string }[];
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = () => setAnchor(null);

  return (
    <>
      <Button
        color="inherit"
        id="category-menu-button"
        aria-haspopup="true"
        aria-controls={anchor ? 'category-menu' : undefined}
        aria-expanded={anchor ? 'true' : undefined}
        endIcon={<ArrowDropDownIcon />}
        onClick={(e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)}
      >
        {label}
      </Button>
      <Menu id="category-menu" anchorEl={anchor} open={Boolean(anchor)} onClose={close} MenuListProps={{ 'aria-labelledby': 'category-menu-button' }}>
        <MenuItem component={Link} href={`/${locale}/products`} onClick={close}>
          {allLabel}
        </MenuItem>
        {items.map((c) => (
          <MenuItem key={c.id} component={Link} href={`/${locale}/products?category=${c.id}`} onClick={close}>
            {c.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
