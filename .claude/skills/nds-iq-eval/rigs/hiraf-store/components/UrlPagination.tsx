'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Pagination from '@mui/material/Pagination';

/** Page links for a server-rendered list: the page number lives in ?page=. */
export default function UrlPagination({ count, page, label }: { count: number; page: number; label: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  if (count <= 1) return null;

  return (
    <Pagination
      count={count}
      page={page}
      color="primary"
      aria-label={label}
      sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}
      onChange={(_, value) => {
        const next = new URLSearchParams(params.toString());
        if (value > 1) next.set('page', String(value));
        else next.delete('page');
        const qs = next.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname);
      }}
    />
  );
}
