'use client';

import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { formatDate } from '@/lib/format';
import type { Dictionary, Locale } from '@/lib/i18n';
import type { TrackingPayload } from '@/lib/tracking';

const POLL_MS = 20_000;

export default function TrackingView({
  locale,
  t,
  initial,
  addressLines,
}: {
  locale: Locale;
  t: Dictionary;
  initial: TrackingPayload;
  addressLines: string[];
}) {
  const [data, setData] = useState(initial);
  const [copied, setCopied] = useState(false);

  // Poll until the order is delivered; the timeline updates in place.
  useEffect(() => {
    if (data.delivered) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${initial.id}/tracking`, { cache: 'no-store' });
        if (res.ok) setData((await res.json()) as TrackingPayload);
      } catch {
        // keep the last known state and try again on the next tick
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [data.delivered, initial.id]);

  async function copy() {
    if (!data.number) return;
    try {
      await navigator.clipboard.writeText(data.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked: the number stays selectable on screen
    }
  }

  return (
    <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' }, alignItems: 'start' }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        {data.cancelled ? <Alert severity="warning" sx={{ mb: 2 }}>{t.tracking.cancelled}</Alert> : null}
        <Stepper orientation="vertical" activeStep={data.delivered ? data.steps.length : data.current} aria-label={t.tracking.timeline}>
          {data.steps.map((step, i) => (
            <Step key={step.key} completed={Boolean(step.at)}>
              <StepLabel
                optional={
                  <Typography variant="caption" color="text.secondary">
                    {step.at ? formatDate(step.at, locale, true) : t.tracking.pending}
                  </Typography>
                }
                aria-current={!data.delivered && i === data.current ? 'step' : undefined}
              >
                <Typography fontWeight={!data.delivered && i === data.current ? 700 : 400}>{t.tracking.steps[step.key]}</Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        {!data.delivered && !data.cancelled ? (
          <Typography variant="caption" color="text.secondary" role="status">
            {t.tracking.refreshing}
          </Typography>
        ) : null}
      </Paper>

      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" component="h2" fontWeight={700} gutterBottom>
            {t.tracking.courier}
          </Typography>
          {data.courier && data.number ? (
            <>
              <Typography>{t.tracking.couriers[data.courier]}</Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  {t.tracking.number}:
                </Typography>
                <Typography dir="ltr" fontFamily="monospace">
                  {data.number}
                </Typography>
                <Tooltip title={copied ? t.tracking.copied : t.tracking.copy}>
                  <IconButton size="small" aria-label={t.tracking.copy} onClick={copy}>
                    {copied ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Stack>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t.tracking.notAssigned}
            </Typography>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" component="h2" fontWeight={700} gutterBottom>
            {t.tracking.eta}
          </Typography>
          <Typography variant="h6" component="p">
            {data.delivered ? t.status.delivered : formatDate(data.eta, locale)}
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" component="h2" fontWeight={700} gutterBottom>
            {t.order.address}
          </Typography>
          {addressLines.map((line) => (
            <Typography key={line} variant="body2">
              {line}
            </Typography>
          ))}
        </Paper>
      </Stack>
    </Box>
  );
}
