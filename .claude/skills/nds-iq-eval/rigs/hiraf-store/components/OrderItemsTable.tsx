import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { getProductById, productName, variantLabel } from '@/lib/data';
import { boxName } from '@/lib/gift';
import { money, num } from '@/lib/format';
import type { Dictionary, Locale } from '@/lib/i18n';
import type { Order } from '@/lib/store';

export default function OrderItemsTable({ order, locale, t }: { order: Order; locale: Locale; t: Dictionary }) {
  return (
    <TableContainer>
      <Table size="small" aria-label={t.order.items}>
        <TableHead>
          <TableRow>
            <TableCell>{t.order.product}</TableCell>
            <TableCell align="center">{t.order.quantity}</TableCell>
            <TableCell align="right">{t.order.unitPrice}</TableCell>
            <TableCell align="right">{t.order.lineTotal}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {order.items.map((item) => {
            const product = getProductById(item.productId);
            const variant = product?.variants?.find((v) => v.id === item.variant);
            const contents = item.box?.items.map((i) => {
              const p = getProductById(i.productId);
              return `${p ? productName(p, locale) : i.productId} × ${num(i.qty, locale)}`;
            });
            return (
              <TableRow key={`${item.productId}:${item.variant ?? ''}`}>
                <TableCell>
                  {item.box ? boxName(item.box.size, locale) : product ? productName(product, locale) : item.productId}
                  {variant ? ` - ${variantLabel(variant, locale)}` : ''}
                  {contents ? (
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {contents.join(locale === 'ar' ? '، ' : ', ')}
                    </Typography>
                  ) : null}
                </TableCell>
                <TableCell align="center">{num(item.qty, locale)}</TableCell>
                <TableCell align="right">{money(item.unit, locale)}</TableCell>
                <TableCell align="right">{money(item.unit * item.qty, locale)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
