import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

export default function Loading() {
  return (
    <>
      <Skeleton variant="text" width={220} height={48} />
      <Skeleton variant="text" width={120} sx={{ mb: 3 }} />
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '260px 1fr' } }}>
        <Skeleton variant="rounded" height={480} />
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' } }}>
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} variant="rounded" height={300} />
          ))}
        </Box>
      </Box>
    </>
  );
}
