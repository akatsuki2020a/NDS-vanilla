import type { ReactNode } from 'react';
import Typography from '@mui/material/Typography';

export default function ContentPage({
  title,
  paragraphs,
  children,
}: {
  title: string;
  paragraphs: string[];
  children?: ReactNode;
}) {
  return (
    <article style={{ maxWidth: 760 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 3 }}>
        {title}
      </Typography>
      {paragraphs.map((text) => (
        <Typography key={text} sx={{ mb: 2, lineHeight: 1.9 }}>
          {text}
        </Typography>
      ))}
      {children}
    </article>
  );
}
