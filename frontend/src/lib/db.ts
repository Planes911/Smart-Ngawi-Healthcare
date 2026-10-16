/**
 * Lapisan data Supabase. MENGGANTIKAN mock-store (antrean di memori) untuk tiket antrean.
 * Hanya dipakai di server (route handlers) karena memakai service role key.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PUSKESMAS_NGAWI } from "./mock-store";
import type {
  MonteCarloSimulationResult,
  QueueStatus,
  QueueTicket,
  QueueType,
  TriageEvaluation,
} from "@/types";

let _db: SupabaseClient | null = null;
export function getDb(): SupabaseClient {
  if (!_db) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diisi");
    _db = createClient(url, key, { auth: { persistSession: false } });
  }
  return _db;
}

/** Tanggal hari ini di WIB, format YYYY-MM-DD */
export const todayWIB = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });

const one = (x: any) => (Array.isArray(x) ? x[0] : x);

// Frontend memakai id teks ("pusk-ngw-01"); database memakai UUID. Penghubungnya = kolom `code` ("NGW-001").
const uuidCache = new Map<string, string>();
export function findPuskesmas(idOrCode?: string) {
  return PUSKESMAS_NGAWI.find((p) => p.id === idOrCode || p.code === idOrCode) ?? PUSKESMAS_NGAWI[0];
}
async function puskesmasUuid(idOrCode?: string): Promise<string> {
  const p = findPuskesmas(idOrCode);
  const cached = uuidCache.get(p.code);
  if (cached) return cached;
  const { data, error } = await getDb().from("puskesmas").select("id").eq("code", p.code).single();
  if (error || !data) throw new Error(`Puskesmas ${p.code} tidak ada di database (sudah menjalankan schema.sql?)`);
  uuidCache.set(p.code, data.id);
  return data.id;
}

const TICKET_SELECT =
  "*, patients(full_name, phone), puskesmas(code), bookings(poly_type, symptoms(symptoms_list), triage_results(ai_soap_draft))";

function toTicket(r: any): QueueTicket {
  const pat = one(r.patients), pk = one(r.puskesmas), bk = one(r.bookings);
  const sym = one(bk?.symptoms), tr = one(bk?.triage_results);
  return {
    id: r.id,
    puskesmasId: findPuskesmas(pk?.code).id,
    bookingId: r.booking_id ?? undefined,
    patientId: r.patient_id,
    patientName: pat?.full_name ?? "-",
    patientPhone: pat?.phone ?? "-",
    ticketNumber: r.ticket_number,
    queueType: r.queue_type,
    status: r.status,
    urgencyLevel: r.urgency_level,
    urgencyScore: r.urgency_score,
    estWaitMinP50: r.est_wait_min_p50 ?? 0,
    estWaitMinP90: r.est_wait_min_p90 ?? 0,
    recommendedDepartureTime: r.recommended_departure_time ?? undefined,
    registeredAt: r.registered_at,
    calledAt: r.called_at ?? undefined,
    serviceStartedAt: r.service_started_at ?? undefined,
    completedAt: r.completed_at ?? undefined,
    assignedCounter: r.assigned_counter ?? undefined,
    polyType: bk?.poly_type ?? "Poli Umum",
    symptomsList: sym?.symptoms_list ?? [],
    soapDraft: tr?.ai_soap_draft ?? undefined,
  };
}

/** Tiket hari ini, urut: sedang diperiksa -> urgensi (MERAH>KUNING>HIJAU) -> waktu daftar */
export async function getTickets(puskesmasId?: string): Promise<QueueTicket[]> {
  let q = getDb().from("queue_tickets").select(TICKET_SELECT).gte("registered_at", `${todayWIB()}T00:00:00+07:00`).limit(300);
  if (puskesmasId) q = q.eq("puskesmas_id", await puskesmasUuid(puskesmasId));
  const { data, error } = await q;
  if (error) throw new Error(error.message);

  const w = { MERAH: 3, KUNING: 2, HIJAU: 1 } as const;
  const tickets: QueueTicket[] = ((data ?? []) as any[]).map(toTicket);
  return tickets.sort((a, b) => {
    if (a.status === "EXAMINING" && b.status !== "EXAMINING") return -1;
    if (b.status === "EXAMINING" && a.status !== "EXAMINING") return 1;
    const d = w[b.urgencyLevel] - w[a.urgencyLevel];
    return d !== 0 ? d : new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime();
  });
}

export async function countWaiting(puskesmasId?: string): Promise<number> {
  const list = await getTickets(puskesmasId);
  return list.filter((t) => t.status === "WAITING").length;
}

export async function updateTicketStatus(id: string, status: QueueStatus, assignedCounter?: string): Promise<QueueTicket | null> {
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status };
  if (assignedCounter) patch.assigned_counter = assignedCounter;
  if (status === "CALLED") patch.called_at = now;
  if (status === "EXAMINING") patch.service_started_at = now;
  if (status === "COMPLETED") patch.completed_at = now;

  const { data, error } = await getDb().from("queue_tickets").update(patch).eq("id", id).select(TICKET_SELECT).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  if (status === "COMPLETED" && data.booking_id) {
    await getDb().from("bookings").update({ status: "ATTENDED" }).eq("id", data.booking_id);
  }
  return toTicket(data);
}

export interface RegistrationInput {
  puskesmasId?: string;
  patientName: string;
  patientPhone?: string;
  nik?: string;
  bpjsNumber?: string;
  queueType: QueueType;
  polyType: string;
  bookingDate: string;
  timeSlot: string;
  symptomIds: string[];
  severityRating: number;
  durationDays: number;
  hasComorbidities: boolean;
  comorbiditiesNotes?: string;
  freeTextComplaint?: string;
  hasEmergencyRedFlags: boolean;
  triage: TriageEvaluation;
  simulation: MonteCarloSimulationResult;
}

/** Simpan satu pendaftaran utuh: pasien -> booking -> gejala -> hasil triase -> tiket antrean */
export async function createRegistration(i: RegistrationInput): Promise<{ ticket: QueueTicket; bookingId: string }> {
  const db = getDb();
  const puskesmasUuidValue = await puskesmasUuid(i.puskesmasId);

  // 1. Pasien (pakai ulang bila NIK / nama+HP sama, agar riwayat kunjungan tersambung)
  const nik = (i.nik ?? "").trim();
  let patientId: string | undefined;
  if (nik.length === 16) {
    const { data } = await db.from("patients").select("id").eq("nik", nik).limit(1);
    patientId = data?.[0]?.id;
  } else if (i.patientPhone) {
    const { data } = await db.from("patients").select("id").eq("full_name", i.patientName).eq("phone", i.patientPhone).limit(1);
    patientId = data?.[0]?.id;
  }
  if (!patientId) {
    const { data, error } = await db.from("patients")
      .insert({ nik: nik || "-", full_name: i.patientName, phone: i.patientPhone || "-", bpjs_number: i.bpjsNumber || null })
      .select("id").single();
    if (error) throw new Error(error.message);
    patientId = data.id as string;
  }

  // 2. Booking
  const { data: bk, error: e2 } = await db.from("bookings")
    .insert({ puskesmas_id: puskesmasUuidValue, patient_id: patientId, booking_date: i.bookingDate, time_slot: i.timeSlot, poly_type: i.polyType })
    .select("id").single();
  if (e2) throw new Error(e2.message);
  const bookingId = bk.id as string;

  // 3. Checklist gejala
  const { error: e3 } = await db.from("symptoms").insert({
    booking_id: bookingId, patient_id: patientId, symptoms_list: i.symptomIds,
    duration_days: i.durationDays, severity_self_rating: i.severityRating,
    has_comorbidities: i.hasComorbidities, comorbidities_notes: i.comorbiditiesNotes || null,
    free_text_complaint: i.freeTextComplaint || null, has_emergency_red_flag: i.hasEmergencyRedFlags,
  });
  if (e3) throw new Error(e3.message);

  // 4. Hasil triase (+ penjelasan)
  const { error: e4 } = await db.from("triage_results").insert({
    booking_id: bookingId, patient_id: patientId,
    urgency_level: i.triage.urgencyLevel, urgency_score: i.triage.urgencyScore,
    rule_flags: i.triage.triggeredRules, ai_summary: i.triage.patientExplanation, ai_soap_draft: i.triage.soapDraft,
  });
  if (e4) throw new Error(e4.message);

  // 5. Tiket antrean: nomor = jumlah tiket hari ini di puskesmas itu + 1
  const { count } = await db.from("queue_tickets").select("id", { count: "exact", head: true })
    .eq("puskesmas_id", puskesmasUuidValue).gte("registered_at", `${todayWIB()}T00:00:00+07:00`);
  const ticketNumber = `${i.queueType === "ONLINE" ? "A" : "W"}-${String((count ?? 0) + 1).padStart(3, "0")}`;

  const { data: tk, error: e5 } = await db.from("queue_tickets").insert({
    puskesmas_id: puskesmasUuidValue, booking_id: bookingId, patient_id: patientId,
    ticket_number: ticketNumber, queue_type: i.queueType, status: "WAITING",
    urgency_level: i.triage.urgencyLevel, urgency_score: i.triage.urgencyScore,
    est_wait_min_p50: i.simulation.p50Minutes, est_wait_min_p90: i.simulation.p90Minutes,
    recommended_departure_time: i.simulation.recommendedDepartureTime,
  }).select(TICKET_SELECT).single();
  if (e5) throw new Error(e5.message);

  return { ticket: toTicket(tk), bookingId };
}
