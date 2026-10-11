'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { markOutOfStock, updateProductCell } from '@/lib/actions';
import { LOW_STOCK } from '@/lib/constants';
import { fmt, money, num } from '@/lib/format';
import type { Dictionary, Locale } from '@/lib/i18n';

export type ProductRow = { id: string; slug: string; name: string; category: string; price: number; stock: number };
type Field = 'price' | 'stock';

export default function ProductsTable({ locale, t, initial }: { locale: Locale; t: Dictionary; initial: ProductRow[] }) {
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<{ id: string; field: Field } | null>(null);
  const [draft, setDraft] = useState('');
  const [cellError, setCellError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function start(row: ProductRow, field: Field) {
    setEditing({ id: row.id, field });
    setDraft(String(row[field]));
    setCellError(null);
  }

  function cancel() {
    setEditing(null);
    setCellError(null);
  }

  function save() {
    if (!editing) return;
    const { id, field } = editing;
    startTransition(async () => {
      const result = await updateProductCell({ id, field, value: draft, locale });
      if (!result.ok) {
        setCellError(result.error);
        return;
      }
      setRows((all) => all.map((r) => (r.id === id ? { ...r, price: result.price, stock: result.stock } : r)));
      setEditing(null);
      setCellError(null);
      setSaved(id);
      setTimeout(() => setSaved((current) => (current === id ? null : current)), 2000);
    });
  }

  function bulkOutOfStock() {
    setConfirming(false);
    startTransition(async () => {
      const done = new Set(await markOutOfStock([...selected]));
      setRows((all) => all.map((r) => (done.has(r.id) ? { ...r, stock: 0 } : r)));
      setSelected(new Set());
    });
  }

  const allSelected = rows.length > 0 && selected.size === rows.length;
  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const editor = (row: ProductRow, field: Field) => {
    const label = field === 'price' ? t.admin.columns.price : t.admin.columns.stock;
    if (editing?.id === row.id && editing.field === field) {
      return (
        <Stack direction="row" alignItems="flex-start" spacing={0.5}>
          <TextField
            autoFocus
            size="small"
            type="number"
            value={draft}
            error={Boolean(cellError)}
            helperText={cellError}
            disabled={pending}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                save();
              }
              if (e.key === 'Escape') cancel();
            }}
            slotProps={{ htmlInput: { 'aria-label': label, step: field === 'price' ? '0.01' : '1', min: 0 } }}
            sx={{ width: 120 }}
          />
          <Tooltip title={t.admin.productsPage.save}>
            <span>
              <IconButton size="small" aria-label={t.admin.productsPage.save} onClick={save} disabled={pending}>
                <CheckIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={t.common.cancel}>
            <IconButton size="small" aria-label={t.common.cancel} onClick={cancel}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      );
    }
    return (
      <Button size="small" color="inherit" aria-label={`${t.admin.productsPage.edit}: ${label} - ${row.name}`} onClick={() => start(row, field)} sx={{ minWidth: 0 }}>
        {field === 'price' ? money(row.price, locale) : row.stock <= 0 ? <Chip size="small" color="error" label={t.common.outOfStock} /> : row.stock <= LOW_STOCK ? <Chip size="small" color="warning" label={`${t.admin.lowStock}: ${num(row.stock, locale)}`} /> : num(row.stock, locale)}
      </Button>
    );
  };

  return (
    <>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Button variant="outlined" color="error" disabled={selected.size === 0 || pending} onClick={() => setConfirming(true)}>
          {t.admin.productsPage.markOut}
        </Button>
        <Typography variant="body2" color="text.secondary" role="status">
          {fmt(t.admin.productsPage.selected, { n: num(selected.size, locale) })}
        </Typography>
      </Stack>

      <Paper variant="outlined">
        <TableContainer>
          <Table size="small" aria-label={t.admin.products}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={selected.size > 0 && !allSelected}
                    onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))}
                    slotProps={{ input: { 'aria-label': t.admin.productsPage.selectAll } }}
                  />
                </TableCell>
                <TableCell>{t.admin.columns.product}</TableCell>
                <TableCell>{t.admin.columns.category}</TableCell>
                <TableCell>{t.admin.columns.price}</TableCell>
                <TableCell>{t.admin.columns.stock}</TableCell>
                <TableCell align="right">{t.admin.columns.actions}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} hover selected={selected.has(row.id)}>
                  <TableCell padding="checkbox">
                    <Checkbox checked={selected.has(row.id)} onChange={() => toggle(row.id)} slotProps={{ input: { 'aria-label': row.name } }} />
                  </TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell>{editor(row, 'price')}</TableCell>
                  <TableCell>{editor(row, 'stock')}</TableCell>
                  <TableCell align="right">
                    {saved === row.id ? <Chip size="small" color="success" variant="outlined" label={t.admin.productsPage.saved} sx={{ mx: 1 }} /> : null}
                    <Tooltip title={t.admin.productsPage.view}>
                      <IconButton component={Link} href={`/${locale}/products/${row.slug}`} size="small" aria-label={`${t.admin.productsPage.view}: ${row.name}`}>
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={confirming} onClose={() => setConfirming(false)} aria-labelledby="bulk-title">
        <DialogTitle id="bulk-title">{t.admin.productsPage.markOut}</DialogTitle>
        <DialogContent>
          <DialogContentText>{fmt(t.admin.productsPage.confirmText, { n: num(selected.size, locale) })}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirming(false)}>{t.common.cancel}</Button>
          <Button color="error" variant="contained" onClick={bulkOutOfStock}>
            {t.admin.productsPage.markOut}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
