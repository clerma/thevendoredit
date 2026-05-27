import { NextResponse } from 'next/server';
import { getNavData } from '@/lib/site';

export function GET() {
  return NextResponse.json(getNavData());
}
