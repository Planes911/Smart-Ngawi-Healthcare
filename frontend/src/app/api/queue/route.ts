import { NextResponse } from 'next/server';
import { getTickets, addTicket, updateTicketStatus } from '@/lib/mock-store';
import { simulateWaitTime } from '@/lib/monte-carlo';
import { runPreTriage } from '@/lib/triage-rules';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const puskesmasId = searchParams.get('puskesmasId') || undefined;
    const tickets = getTickets(puskesmasId);

    return NextResponse.json({ tickets }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      puskesmasId,
      patientName,
      patientPhone,
      queueType = 'WALK_IN',
      polyType = 'Poli Umum',
      symptomIds = [],
      severityRating = 2,
      durationDays = 1,
      hasComorbidities = false,
      comorbiditiesNotes = '',
      freeTextComplaint = '',
      hasEmergencyRedFlags = false,
    } = body;

    // Run triage logic
    const triage = runPreTriage({
      patientId: `pat-${Date.now()}`,
      symptomIds,
      severityRating,
      durationDays,
      hasComorbidities,
      comorbiditiesNotes,
      freeTextComplaint,
      hasEmergencyRedFlags,
    });

    // Run Monte Carlo for queue wait time
    const currentQueue = getTickets(puskesmasId).filter((t) => t.status === 'WAITING');
    const simulation = simulateWaitTime(currentQueue.length, 2, 7.5, 2.2, 15, 1000);

    const newTicket = addTicket({
      puskesmasId: puskesmasId || 'pusk-ngw-01',
      patientId: `pat-${Date.now()}`,
      patientName: patientName || 'Pasien Walk-In',
      patientPhone: patientPhone || '-',
      queueType,
      status: 'WAITING',
      urgencyLevel: triage.urgencyLevel,
      urgencyScore: triage.urgencyScore,
      estWaitMinP50: simulation.p50Minutes,
      estWaitMinP90: simulation.p90Minutes,
      recommendedDepartureTime: simulation.recommendedDepartureTime,
      polyType,
      symptomsList: symptomIds,
      soapDraft: triage.soapDraft,
    });

    return NextResponse.json(
      {
        ticket: newTicket,
        triage,
        simulation,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { ticketId, status, assignedCounter } = body;

    if (!ticketId || !status) {
      return NextResponse.json({ error: 'ticketId dan status wajib diisi' }, { status: 400 });
    }

    const updated = updateTicketStatus(ticketId, status, assignedCounter);
    if (!updated) {
      return NextResponse.json({ error: 'Tiket tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ ticket: updated }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
