import { NextResponse } from 'next/server';
import { getOrder } from '@/lib/store';
import { trackingPayload } from '@/lib/tracking';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = getOrder(id);
  if (!order) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(trackingPayload(order), { headers: { 'Cache-Control': 'no-store' } });
}
