'use client';

import { useState } from 'react';
import Image from 'next/image';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';

type Labels = { thumb: string; zoom: string; close: string; previous: string; next: string };

// arrows point along the reading direction
const flip = { '[dir="rtl"] & svg': { transform: 'scaleX(-1)' } };

export default function Gallery({ images, name, labels }: { images: string[]; name: string; labels: Labels }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const step = (delta: number) => setIndex((i) => (i + delta + images.length) % images.length);

  return (
    <Stack spacing={1.5}>
      <ButtonBase
        aria-label={labels.zoom}
        onClick={() => setZoom(true)}
        sx={{ position: 'relative', display: 'block', width: '100%', aspectRatio: '1 / 1', borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider', cursor: 'zoom-in' }}
      >
        <Image src={images[index]} alt={name} fill sizes="(max-width: 900px) 100vw, 520px" priority />
      </ButtonBase>
      {images.length > 1 ? (
        <Stack direction="row" spacing={1}>
          {images.map((src, i) => (
            <ButtonBase
              key={i}
              aria-label={labels.thumb.replace('{n}', String(i + 1))}
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
              sx={{ position: 'relative', width: 72, height: 72, borderRadius: 1.5, overflow: 'hidden', border: 2, borderColor: i === index ? 'primary.main' : 'divider' }}
            >
              <Image src={src} alt="" fill sizes="72px" />
            </ButtonBase>
          ))}
        </Stack>
      ) : null}

      <Dialog
        fullScreen
        open={zoom}
        onClose={() => setZoom(false)}
        aria-label={name}
        slotProps={{ paper: { sx: { bgcolor: 'grey.900', color: 'common.white' } } }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') step(1);
          if (e.key === 'ArrowLeft') step(-1);
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 1 }}>
          <Typography sx={{ px: 1 }}>
            {index + 1} / {images.length}
          </Typography>
          <IconButton color="inherit" aria-label={labels.close} onClick={() => setZoom(false)}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Box sx={{ flex: 1, position: 'relative', mx: { xs: 6, md: 12 }, mb: 4 }}>
          <Image src={images[index]} alt={name} fill sizes="100vw" style={{ objectFit: 'contain' }} />
        </Box>
        {images.length > 1 ? (
          <>
            <IconButton color="inherit" aria-label={labels.previous} onClick={() => step(-1)} sx={{ position: 'absolute', top: '50%', insetInlineStart: 8, ...flip }}>
              <ChevronLeftIcon fontSize="large" />
            </IconButton>
            <IconButton color="inherit" aria-label={labels.next} onClick={() => step(1)} sx={{ position: 'absolute', top: '50%', insetInlineEnd: 8, ...flip }}>
              <ChevronRightIcon fontSize="large" />
            </IconButton>
          </>
        ) : null}
      </Dialog>
    </Stack>
  );
}
