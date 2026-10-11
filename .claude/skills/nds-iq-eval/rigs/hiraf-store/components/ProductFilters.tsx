'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Rating from '@mui/material/Rating';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { PRICE_MAX, SORTS } from '@/lib/catalog';
import type { Dictionary } from '@/lib/i18n';

type Props = { t: Dictionary; categories: { id: string; name: string }[] };

export default function ProductFilters({ t, categories }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const min = Number(params.get('min') ?? 0);
  const max = Number(params.get('max') ?? PRICE_MAX);
  const [range, setRange] = useState<number[]>([min, max]);
  useEffect(() => setRange([min, max]), [min, max]);

  const selected = params.getAll('category').flatMap((c) => c.split(','));
  const rating = Number(params.get('rating') ?? 0);

  /** Rewrites the URL: set/delete keys, always go back to page 1. */
  function push(patch: Record<string, string | string[] | null>) {
    const next = new URLSearchParams(params.toString());
    next.delete('page');
    for (const [key, value] of Object.entries(patch)) {
      next.delete(key);
      if (Array.isArray(value)) value.forEach((v) => next.append(key, v));
      else if (value !== null) next.set(key, value);
    }
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <Paper variant="outlined" component="form" aria-label={t.products.filters} sx={{ p: 2 }} onSubmit={(e) => e.preventDefault()}>
      <Stack spacing={3}>
        <TextField select label={t.products.sort} size="small" value={params.get('sort') ?? 'featured'} onChange={(e) => push({ sort: e.target.value === 'featured' ? null : e.target.value })}>
          {SORTS.map((s) => (
            <MenuItem key={s} value={s}>
              {t.products.sorts[s]}
            </MenuItem>
          ))}
        </TextField>

        <Box component="fieldset" sx={{ border: 0, p: 0, m: 0 }}>
          <Typography component="legend" variant="subtitle2" sx={{ mb: 0.5 }}>
            {t.products.category}
          </Typography>
          <FormGroup>
            {categories.map((c) => (
              <FormControlLabel
                key={c.id}
                label={c.name}
                control={
                  <Checkbox
                    size="small"
                    checked={selected.includes(c.id)}
                    onChange={(e) => push({ category: e.target.checked ? [...selected, c.id] : selected.filter((id) => id !== c.id) })}
                  />
                }
              />
            ))}
          </FormGroup>
        </Box>

        <Box sx={{ px: 1 }}>
          <Typography id="price-range-label" variant="subtitle2" gutterBottom>
            {t.products.priceRange}
          </Typography>
          <Slider
            aria-labelledby="price-range-label"
            value={range}
            min={0}
            max={PRICE_MAX}
            step={10}
            valueLabelDisplay="auto"
            onChange={(_, value) => setRange(value as number[])}
            onChangeCommitted={(_, value) => {
              const [lo, hi] = value as number[];
              push({ min: lo > 0 ? String(lo) : null, max: hi < PRICE_MAX ? String(hi) : null });
            }}
          />
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption">{range[0]}</Typography>
            <Typography variant="caption">{range[1]}</Typography>
          </Stack>
        </Box>

        <FormControlLabel
          label={t.products.inStockOnly}
          control={<Switch checked={params.get('instock') === '1'} onChange={(e) => push({ instock: e.target.checked ? '1' : null })} />}
        />

        <Box>
          <Typography id="rating-label" variant="subtitle2" gutterBottom>
            {t.products.ratingFrom}
          </Typography>
          <Rating
            name="rating"
            aria-labelledby="rating-label"
            value={rating || null}
            onChange={(_, value) => push({ rating: value ? String(value) : null })}
          />
        </Box>

        <Button variant="text" onClick={() => router.push(pathname)}>
          {t.common.clearFilters}
        </Button>
      </Stack>
    </Paper>
  );
}
