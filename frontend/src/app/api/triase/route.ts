import { NextResponse } from 'next/server';
import { runPreTriage } from '@/lib/triage-rules';
import { SymptomReport } from '@/types';

export async function POST(req: Request) {
  try {
    const body: SymptomReport = await req.json();
    const result = runPreTriage(body);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal mengevaluasi triase' }, { status: 400 });
  }
}
