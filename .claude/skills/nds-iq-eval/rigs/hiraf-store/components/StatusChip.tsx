import Chip from '@mui/material/Chip';
import { STATUS_COLORS } from '@/lib/status';
import type { Dictionary } from '@/lib/i18n';
import type { OrderStatus } from '@/lib/store';

export default function StatusChip({ status, t }: { status: OrderStatus; t: Dictionary }) {
  return <Chip size="small" color={STATUS_COLORS[status]} label={t.status[status]} />;
}
