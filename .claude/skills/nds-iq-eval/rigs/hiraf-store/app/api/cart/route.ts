import { NextResponse } from 'next/server';
import { readCartView } from '@/lib/cart';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await readCartView(), { headers: { 'Cache-Control': 'no-store' } });
}
