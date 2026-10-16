import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

export default function Loading() {
  return (
    <>
      <Skeleton variant="text" width={160} height={44} sx={{ mb: 2 }} />
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, mb: 3 }}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" height={84} />
        ))}
      </Box>
      <Skeleton variant="rounded" height={48} sx={{ mb: 1 }} />
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} variant="text" height={44} />
      ))}
    </>
  );
}
