'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ar from '@/lib/dictionaries/ar.json';
import en from '@/lib/dictionaries/en.json';

// An error boundary gets no props from the server, so it reads the strings itself.
export default function CheckoutError({ reset }: { error: Error; reset: () => void }) {
  const { locale } = useParams<{ locale: string }>();
  const t = (locale === 'en' ? en : ar).errors;

  return (
    <Paper variant="outlined" role="alert" sx={{ p: 6, textAlign: 'center' }}>
      <Typography variant="h5" component="h1" gutterBottom>
        {t.title}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t.text}
      </Typography>
      <Stack direction="row" spacing={2} justifyContent="center">
        <Button variant="contained" onClick={() => reset()}>
          {t.retry}
        </Button>
        <Button component={Link} href={`/${locale}/cart`}>
          {t.backToCart}
        </Button>
      </Stack>
    </Paper>
  );
}
