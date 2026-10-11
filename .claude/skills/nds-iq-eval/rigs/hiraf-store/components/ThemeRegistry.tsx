'use client';

import { useMemo, type ReactNode } from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import type { Locale } from '@/lib/i18n';

const FONT = '"Segoe UI", Tahoma, "Noto Sans Arabic", "Noto Sans", system-ui, -apple-system, Arial, sans-serif';

export default function ThemeRegistry({
  locale,
  nonce,
  children,
}: {
  locale: Locale;
  nonce?: string;
  children: ReactNode;
}) {
  const rtl = locale === 'ar';

  const cacheOptions = useMemo(
    () => ({
      key: rtl ? 'muirtl' : 'muiltr',
      nonce,
      stylisPlugins: rtl ? [prefixer, rtlPlugin] : [prefixer],
    }),
    [rtl, nonce],
  );

  const theme = useMemo(
    () =>
      createTheme({
        direction: rtl ? 'rtl' : 'ltr',
        palette: {
          primary: { main: '#1b5e3b' },
          secondary: { main: '#b8842f' },
          background: { default: '#faf8f4' },
        },
        typography: { fontFamily: FONT },
        shape: { borderRadius: 10 },
        components: {
          MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } },
          },
          MuiTab: { styleOverrides: { root: { textTransform: 'none' } } },
        },
      }),
    [rtl],
  );

  return (
    <AppRouterCacheProvider options={cacheOptions}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
