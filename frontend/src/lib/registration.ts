/** Alur pendaftaran bersama (dipakai /api/booking dan walk-in di /api/queue) */
import { runPreTriage } from "./triage-rules";
import { simulateWaitTime } from "./monte-carlo";
import { explainTriage } from "./llm";
import { countWaiting, createRegistration, findPuskesmas, todayWIB } from "./db";
import type { QueueType } from "@/types";

export async function registerPatient(body: any, queueType: QueueType) {
  const patientName = String(body.patientName ?? "").trim();
  if (!patientName) throw new Error("Nama pasien wajib diisi");

  const p = findPuskesmas(body.puskesmasId);
  const symptomIds: string[] = Array.isArray(body.symptomIds) ? body.symptomIds : [];
  const severityRating = Number(body.severityRating ?? 2);
  const durationDays = Number(body.durationDays ?? 1);
  const hasComorbidities = Boolean(body.hasComorbidities);
  const hasEmergencyRedFlags = Boolean(body.hasEmergencyRedFlags);
  const polyType = body.polyType ?? "Poli Umum";
  const bookingDate = body.bookingDate ?? todayWIB();
  const timeSlot = body.timeSlot ?? (queueType === "WALK_IN" ? "WALK-IN" : "08:00 - 09:00");

  // 1. ATURAN memutuskan skor & level
  const triage = runPreTriage({
    patientId: "tmp", symptomIds, severityRating, durationDays, hasComorbidities,
    comorbiditiesNotes: body.comorbiditiesNotes ?? "", freeTextComplaint: body.freeTextComplaint ?? "", hasEmergencyRedFlags,
  });

  // 2. LLM hanya menjelaskan (ada fallback)
  const explanation = await explainTriage(triage);
  if (explanation.source === "llm") {
    triage.patientExplanation = `${explanation.ringkasan} ${explanation.saran_umum}`.trim();
  }

  // 3. Estimasi waktu tunggu (Monte Carlo) berdasarkan antrean nyata di database
  const ahead = await countWaiting(p.id);
  const simulation = simulateWaitTime(ahead, p.activeCounters, p.avgServiceTimeMins, 2.2, queueType === "WALK_IN" ? 0 : Number(body.travelTimeMins ?? 15), 1000);

  // 4. Simpan ke Supabase
  const { ticket, bookingId } = await createRegistration({
    puskesmasId: p.id, patientName, patientPhone: body.patientPhone, nik: body.nik, bpjsNumber: body.bpjsNumber,
    queueType, polyType, bookingDate, timeSlot, symptomIds, severityRating, durationDays, hasComorbidities,
    comorbiditiesNotes: body.comorbiditiesNotes, freeTextComplaint: body.freeTextComplaint, hasEmergencyRedFlags,
    triage, simulation,
  });

  return {
    booking: { id: bookingId, puskesmasId: p.id, patientName, nik: body.nik, bpjsNumber: body.bpjsNumber, polyType, bookingDate, timeSlot },
    ticket,
    triage: { ...triage, explanation },
    simulation,
  };
}
