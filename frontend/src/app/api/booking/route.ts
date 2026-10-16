import { NextResponse } from 'next/server';
import { addTicket, getTickets } from '@/lib/mock-store';
import { runPreTriage } from '@/lib/triage-rules';
import { simulateWaitTime } from '@/lib/monte-carlo';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      puskesmasId = 'pusk-ngw-01',
      patientName,
      patientPhone,
      nik,
      bpjsNumber,
      polyType = 'Poli Umum',
      bookingDate = new Date().toISOString().split('T')[0],
      timeSlot = '08:00 - 09:00',
      symptomIds = [],
      severityRating = 2,
      durationDays = 2,
      hasComorbidities = false,
      comorbiditiesNotes = '',
      freeTextComplaint = '',
      hasEmergencyRedFlags = false,
      travelTimeMins = 15,
    } = body;

    if (!patientName) {
      return NextResponse.json({ error: 'Nama pasien wajib diisi' }, { status: 400 });
    }

    // 1. Run Pre-Triase
    const triage = runPreTriage({
      patientId: `pat-${Date.now()}`,
      symptomIds,
      severityRating: Number(severityRating),
      durationDays: Number(durationDays),
      hasComorbidities: Boolean(hasComorbidities),
      comorbiditiesNotes,
      freeTextComplaint,
      hasEmergencyRedFlags: Boolean(hasEmergencyRedFlags),
    });

    // 2. Count current waiting queue in this puskesmas
    const currentQueue = getTickets(puskesmasId).filter((t) => t.status === 'WAITING');
    const peopleAhead = currentQueue.length;

    // 3. Run Monte Carlo Wait Time Simulation
    const simulation = simulateWaitTime(
      peopleAhead,
      2, // active counters default
      7.5,
      2.2,
      Number(travelTimeMins),
      1000
    );

    // 4. Create Queue Ticket
    const ticket = addTicket({
      puskesmasId,
      patientId: `pat-${Date.now()}`,
      patientName,
      patientPhone: patientPhone || '-',
      queueType: 'ONLINE',
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
        booking: {
          id: `book-${Date.now()}`,
          puskesmasId,
          patientName,
          nik,
          bpjsNumber,
          polyType,
          bookingDate,
          timeSlot,
        },
        ticket,
        triage,
        simulation,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal membuat booking' }, { status: 400 });
  }
}
