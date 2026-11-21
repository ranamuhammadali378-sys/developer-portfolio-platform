import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-revalidation-secret');
  if (!secret || secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ success: false, message: 'Invalid secret' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const paths: string[] = Array.isArray(body?.paths) ? body.paths : ['/'];
    for (const p of paths) {
      revalidatePath(p);
    }
    return NextResponse.json({ success: true, revalidated: paths });
  } catch {
    return NextResponse.json({ success: false, message: 'Revalidation failed' }, { status: 500 });
  }
}