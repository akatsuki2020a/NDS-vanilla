import { notFound } from 'next/navigation';

// Any path that matches no page lands here so the localized 404 renders inside the shop layout.
export default function CatchAll() {
  notFound();
}
