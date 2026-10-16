import { NextResponse } from 'next/server';
import { runWhatIfSimulation } from '@/lib/monte-carlo';
import { WhatIfScenarioInput } from '@/types';

export async function POST(req: Request) {
  try {
    const body: WhatIfScenarioInput = await req.json();
    const result = runWhatIfSimulation({
      numCounters: Number(body.numCounters) || 2,
      avgServiceTimeMins: Number(body.avgServiceTimeMins) || 7.5,
      stdDevMins: Number(body.stdDevMins) || 2.2,
      incomingPatientsPerHour: Number(body.incomingPatientsPerHour) || 12,
      iterations: Number(body.iterations) || 1000,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menjalankan simulasi skenario' }, { status: 400 });
  }
}
