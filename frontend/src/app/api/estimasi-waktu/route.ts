import { NextResponse } from 'next/server';
import { simulateWaitTime } from '@/lib/monte-carlo';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      peopleAhead = 5,
      activeCounters = 2,
      avgServiceTimeMins = 7.5,
      stdDevMins = 2.2,
      travelTimeMins = 15,
      iterations = 1000,
    } = body;

    const result = simulateWaitTime(
      Number(peopleAhead),
      Number(activeCounters),
      Number(avgServiceTimeMins),
      Number(stdDevMins),
      Number(travelTimeMins),
      Number(iterations)
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menghitung estimasi waktu' }, { status: 400 });
  }
}
