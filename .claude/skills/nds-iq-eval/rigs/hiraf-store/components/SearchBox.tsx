'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { FormEvent } from 'react';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import SearchIcon from '@mui/icons-material/Search';

type Props = {
  /** Page the search goes to, e.g. /ar/products. */
  action: string;
  /** Query parameter that carries the text. */
  param?: string;
  /** Parameters of the current URL to keep (e.g. the status tab). */
  keep?: string[];
  placeholder: string;
  label: string;
  fullWidth?: boolean;
};

export default function SearchBox({ action, param = 'q', keep = [], placeholder, label, fullWidth }: Props) {
  const router = useRouter();
  const current = useSearchParams();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = String(new FormData(event.currentTarget).get(param) ?? '').trim();
    const next = new URLSearchParams();
    for (const name of keep) current.getAll(name).forEach((v) => next.append(name, v));
    if (text) next.set(param, text);
    const qs = next.toString();
    router.push(qs ? `${action}?${qs}` : action);
  }

  return (
    <form onSubmit={onSubmit} role="search" style={{ width: fullWidth ? '100%' : undefined }}>
      <TextField
        key={current.get(param) ?? ''}
        name={param}
        defaultValue={current.get(param) ?? ''}
        placeholder={placeholder}
        size="small"
        fullWidth={fullWidth}
        slotProps={{
          htmlInput: { 'aria-label': label },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton type="submit" size="small" aria-label={label}>
                  <SearchIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        sx={{ bgcolor: 'background.paper', borderRadius: 1, minWidth: { sm: 260 } }}
      />
    </form>
  );
}
