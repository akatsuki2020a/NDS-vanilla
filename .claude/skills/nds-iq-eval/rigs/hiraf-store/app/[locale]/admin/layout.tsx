import Link from '@/components/Link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import AdminNav from '@/components/AdminNav';
import LangSwitch from '@/components/LangSwitch';
import { getDictionary, isLocale } from '@/lib/i18n';

const WIDTH = 232;

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getDictionary(locale);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer
        variant="permanent"
        sx={{ width: WIDTH, flexShrink: 0, '& .MuiDrawer-paper': { width: WIDTH, boxSizing: 'border-box' } }}
      >
        <Toolbar>
          <Typography variant="subtitle1" component="p" sx={{ fontWeight: 700 }}>
            {t.brand.name}
          </Typography>
        </Toolbar>
        <Divider />
        <AdminNav
          locale={locale}
          label={t.admin.menu}
          items={[
            { href: 'orders', label: t.admin.orders },
            { href: 'products', label: t.admin.products },
            { href: 'settings', label: t.admin.settings.title },
            { href: 'roles', label: t.admin.roles.title },
          ]}
        />
      </Drawer>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Toolbar variant="dense" sx={{ gap: 1 }}>
            <Typography component="p" sx={{ flexGrow: 1, fontWeight: 600 }}>
              {t.admin.title}
            </Typography>
            <LangSwitch locale={locale} label={t.nav.switchLang} ariaLabel={t.nav.switchLangLabel} />
            <Button component={Link} href={`/${locale}`} size="small">
              {t.admin.backToShop}
            </Button>
          </Toolbar>
        </AppBar>
        <Box component="main" id="main-content" sx={{ p: { xs: 2, md: 4 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
