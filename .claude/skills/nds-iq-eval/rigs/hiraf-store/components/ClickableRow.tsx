'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import TableRow from '@mui/material/TableRow';

export default function ClickableRow({ href, children }: { href: string; children: ReactNode }) {
  const router = useRouter();

  return (
    <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => router.push(href)}>
      {children}
    </TableRow>
  );
}
