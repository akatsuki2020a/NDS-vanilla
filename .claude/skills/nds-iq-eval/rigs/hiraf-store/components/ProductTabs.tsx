'use client';

import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import type { Review } from '@/lib/data';
import { formatDate } from '@/lib/format';
import type { Dictionary, Locale } from '@/lib/i18n';

// Four lines, then a toggle; the toggle only shows when the text really is cut.
function Description({ text, t }: { text: string; t: Dictionary }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [cut, setCut] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (el && !open) setCut(el.scrollHeight > el.clientHeight + 1);
  }, [text, open]);

  return (
    <Box sx={{ maxWidth: 720 }}>
      <Typography
        ref={ref}
        sx={{
          lineHeight: 1.9,
          ...(open ? {} : { display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }),
        }}
      >
        {text}
      </Typography>
      {cut || open ? (
        <Button size="small" onClick={() => setOpen((v) => !v)} aria-expanded={open} sx={{ mt: 1 }}>
          {open ? t.product.showLess : t.product.showMore}
        </Button>
      ) : null}
    </Box>
  );
}

export default function ProductTabs({
  locale,
  t,
  description,
  reviews,
}: {
  locale: Locale;
  t: Dictionary;
  description: string;
  reviews: Review[];
}) {
  const [tab, setTab] = useState(0);
  const tabs = [t.product.tabs.description, t.product.tabs.reviews, t.product.tabs.shipping];

  return (
    <Box>
      <Tabs value={tab} onChange={(_: SyntheticEvent, v: number) => setTab(v)} aria-label={t.product.tabsLabel} variant="scrollable" allowScrollButtonsMobile>
        {tabs.map((label, i) => (
          <Tab key={label} label={label} id={`product-tab-${i}`} aria-controls={`product-panel-${i}`} />
        ))}
      </Tabs>
      <Divider />
      <Box role="tabpanel" id={`product-panel-${tab}`} aria-labelledby={`product-tab-${tab}`} sx={{ py: 3 }}>
        {tab === 0 ? <Description text={description} t={t} /> : null}
        {tab === 1 ? (
          reviews.length ? (
            <Stack spacing={2} divider={<Divider flexItem />}>
              {reviews.map((r, i) => (
                <Box key={i}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography fontWeight={600}>{r.name}</Typography>
                    <Rating value={r.rating} size="small" readOnly />
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(r.date, locale)}
                    </Typography>
                  </Stack>
                  <Typography sx={{ mt: 0.5 }}>{r.text_ar}</Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography color="text.secondary">{t.product.noReviews}</Typography>
          )
        ) : null}
        {tab === 2 ? (
          <Box component="ul" sx={{ m: 0, pl: 3, lineHeight: 2 }}>
            {t.product.shippingInfo.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
