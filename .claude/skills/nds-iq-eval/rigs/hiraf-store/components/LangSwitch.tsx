'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import Button from '@mui/material/Button';
import LanguageIcon from '@mui/icons-material/Language';
import type { Locale } from '@/lib/i18n';

export default function LangSwitch({ locale, label, ariaLabel }: { locale: Locale; label: string; ariaLabel: string }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const other: Locale = locale === 'ar' ? 'en' : 'ar';
  const href = pathname.replace(/^\/(ar|en)(?=\/|$)/, `/${other}`) + (search ? `?${search}` : '');

  return (
    <Button component={Link} href={href} lang={other} color="inherit" aria-label={ariaLabel} startIcon={<LanguageIcon />}>
      {label}
    </Button>
  );
}
