'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Inventory2Icon from '@mui/icons-material/Inventory2Outlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLongOutlined';
import SecurityIcon from '@mui/icons-material/SecurityOutlined';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';

export default function AdminNav({
  locale,
  label,
  items,
}: {
  locale: string;
  label: string;
  items: { href: 'orders' | 'products' | 'settings' | 'roles'; label: string }[];
}) {
  const pathname = usePathname();
  const icons = { orders: <ReceiptLongIcon />, products: <Inventory2Icon />, settings: <SettingsIcon />, roles: <SecurityIcon /> };

  return (
    <nav aria-label={label}>
      <List>
        {items.map((item) => {
          const href = `/${locale}/admin/${item.href}`;
          return (
            <ListItemButton key={item.href} component={Link} href={href} selected={pathname.startsWith(href)} aria-current={pathname.startsWith(href) ? 'page' : undefined}>
              <ListItemIcon>{icons[item.href]}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
    </nav>
  );
}
