'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import BoltIcon from '@mui/icons-material/Bolt';
import { num } from '@/lib/format';
import type { Locale } from '@/lib/i18n';

type Labels = { title: string; text: string; endsIn: string; hours: string; minutes: string; seconds: string; button: string };

const two = (n: number, locale: Locale) => num(n, locale).padStart(2, locale === 'ar' ? '٠' : '0');

/** Countdown to a fixed end time. Hidden once it passes. */
export default function FlashSale({ locale, end, labels }: { locale: Locale; end: string; labels: Labels }) {
  // null until mounted: the server cannot know the visitor's clock
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const target = new Date(end).getTime();
    const tick = () => setLeft(Math.max(0, target - Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [end]);

  if (left === 0) return null;

  const total = Math.floor((left ?? 0) / 1000);
  const parts = [
    { value: Math.floor(total / 3600), label: labels.hours },
    { value: Math.floor((total % 3600) / 60), label: labels.minutes },
    { value: total % 60, label: labels.seconds },
  ];

  return (
    <Paper
      component="section"
      aria-label={labels.title}
      sx={{ p: 2.5, display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap', bgcolor: 'error.main', color: 'error.contrastText' }}
    >
      <BoltIcon fontSize="large" />
      <div style={{ flex: 1, minWidth: 200 }}>
        <Typography variant="h6" component="h2" fontWeight={700}>
          {labels.title}
        </Typography>
        <Typography variant="body2">{labels.text}</Typography>
      </div>
      <Stack direction="row" spacing={1.5} alignItems="center" role="timer" aria-label={labels.endsIn}>
        {parts.map((p) => (
          <div key={p.label} style={{ textAlign: 'center', minWidth: 48 }}>
            <Typography variant="h5" component="div" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {left === null ? '--' : two(p.value, locale)}
            </Typography>
            <Typography variant="caption">{p.label}</Typography>
          </div>
        ))}
      </Stack>
      <Button component={Link} href={`/${locale}/products?sort=price-asc`} variant="contained" color="inherit" sx={{ color: 'error.main' }}>
        {labels.button}
      </Button>
    </Paper>
  );
}
