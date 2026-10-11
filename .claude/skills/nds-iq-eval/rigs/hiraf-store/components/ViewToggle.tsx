'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';

/** Grid or list; the choice lives in ?view= so the server renders the right layout. */
export default function ViewToggle({ view, labels }: { view: 'grid' | 'list'; labels: { group: string; grid: string; list: string } }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={view}
      aria-label={labels.group}
      onChange={(_, value: 'grid' | 'list' | null) => {
        if (!value) return;
        const next = new URLSearchParams(params.toString());
        if (value === 'list') next.set('view', 'list');
        else next.delete('view');
        const qs = next.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname);
      }}
    >
      <ToggleButton value="grid" aria-label={labels.grid}>
        <GridViewIcon fontSize="small" />
      </ToggleButton>
      <ToggleButton value="list" aria-label={labels.list}>
        <ViewListIcon fontSize="small" />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
