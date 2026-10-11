import Link from 'next/link';
import { notFound } from 'next/navigation';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import LocalShippingIcon from '@mui/icons-material/LocalShippingOutlined';
import ClickableRow from '@/components/ClickableRow';
import SearchBox from '@/components/SearchBox';
import StatusChip from '@/components/StatusChip';
import UrlPagination from '@/components/UrlPagination';
import type { SearchParams } from '@/lib/catalog';
import { formatDate, money, num } from '@/lib/format';
import { getDictionary, isLocale } from '@/lib/i18n';
import { ORDER_STATUSES, listOrders, type OrderStatus } from '@/lib/store';

const PAGE_SIZE = 10;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
const riyadhDay = (d: Date | string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh' }).format(new Date(d));

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: (await getDictionary(locale)).admin.orders };
}

export default async function AdminOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getDictionary(locale);
  const sp = await searchParams;
  const q = one(sp.q).trim().toLowerCase();
  const statusParam = one(sp.status);
  const status = ORDER_STATUSES.includes(statusParam as OrderStatus) ? (statusParam as OrderStatus) : 'all';
  const pageParam = Math.max(1, Number.parseInt(one(sp.page), 10) || 1);

  const all = listOrders();
  const today = riyadhDay(new Date());
  const kpis = [
    { label: t.admin.kpi.today, value: num(all.filter((o) => riyadhDay(o.created) === today).length, locale) },
    {
      label: t.admin.kpi.revenue,
      value: money(all.filter((o) => o.status !== 'cancelled' && o.status !== 'pending_payment').reduce((s, o) => s + o.totals.total, 0), locale),
    },
    { label: t.admin.kpi.pending, value: num(all.filter((o) => o.status === 'pending_payment').length, locale) },
  ];

  const matching = all.filter((o) => !q || o.id.toLowerCase().includes(q) || o.customer.name.includes(q));
  const shown = status === 'all' ? matching : matching.filter((o) => o.status === status);
  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const page = Math.min(pageParam, pages);
  const rows = shown.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const tabHref = (value: string) => {
    const next = new URLSearchParams();
    if (q) next.set('q', one(sp.q).trim());
    if (value !== 'all') next.set('status', value);
    const qs = next.toString();
    return `/${locale}/admin/orders${qs ? `?${qs}` : ''}`;
  };

  return (
    <>
      <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 3 }}>
        {t.admin.orders}
      </Typography>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, mb: 3 }}>
        {kpis.map((k) => (
          <Paper key={k.label} variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              {k.label}
            </Typography>
            <Typography variant="h5" component="p" sx={{ fontWeight: 700 }}>
              {k.value}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Paper variant="outlined">
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', p: 2 }}>
          <Tabs value={status} variant="scrollable" allowScrollButtonsMobile aria-label={t.admin.statusTabs} sx={{ flex: 1, minWidth: 260 }}>
            <Tab component={Link} value="all" href={tabHref('all')} label={`${t.admin.all} (${num(matching.length, locale)})`} />
            {ORDER_STATUSES.map((s) => (
              <Tab
                key={s}
                component={Link}
                value={s}
                href={tabHref(s)}
                label={`${t.status[s]} (${num(matching.filter((o) => o.status === s).length, locale)})`}
              />
            ))}
          </Tabs>
          <SearchBox action={`/${locale}/admin/orders`} keep={['status']} placeholder={t.admin.searchPlaceholder} label={t.nav.search} />
        </Box>

        <TableContainer>
          <Table aria-label={t.admin.orders}>
            <TableHead>
              <TableRow>
                <TableCell>{t.admin.columns.number}</TableCell>
                <TableCell>{t.admin.columns.customer}</TableCell>
                <TableCell>{t.admin.columns.date}</TableCell>
                <TableCell align="center">{t.admin.columns.items}</TableCell>
                <TableCell align="right">{t.admin.columns.total}</TableCell>
                <TableCell>{t.admin.columns.status}</TableCell>
                <TableCell align="right">{t.admin.columns.actions}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((o) => (
                <ClickableRow key={o.id} href={`/${locale}/admin/orders/${o.id}`}>
                  <TableCell>
                    <Link href={`/${locale}/admin/orders/${o.id}`}>
                      <bdi>{o.id}</bdi>
                    </Link>
                  </TableCell>
                  <TableCell>{o.customer.name}</TableCell>
                  <TableCell>{formatDate(o.created, locale)}</TableCell>
                  <TableCell align="center">{num(o.items.reduce((s, i) => s + i.qty, 0), locale)}</TableCell>
                  <TableCell align="right">{money(o.totals.total, locale)}</TableCell>
                  <TableCell>
                    <StatusChip status={o.status} t={t} />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={t.admin.viewOrder}>
                      <IconButton component={Link} href={`/${locale}/admin/orders/${o.id}`} size="small" aria-label={`${t.admin.viewOrder} ${o.id}`}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t.tracking.trackOrder}>
                      <IconButton component={Link} href={`/${locale}/orders/${o.id}/track`} size="small" aria-label={`${t.tracking.trackOrder} ${o.id}`}>
                        <LocalShippingIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </ClickableRow>
              ))}
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    {t.admin.noOrders}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <UrlPagination count={pages} page={page} label={t.products.pagination} />
    </>
  );
}
