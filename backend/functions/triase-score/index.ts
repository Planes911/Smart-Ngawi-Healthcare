/**
 * PuskesmasPintar - Supabase Edge Function: triase-score
 * Aturan Pre-Triase Berbasis Protokol (Adaptasi Manchester Triage System) + Generator Draft SOAP
 * Hackathon JOINTS UGM 2026
 */

export interface SymptomEvaluationRequest {
  symptomIds: string[];
  severityRating: number;         // 1 - 5 (skala nyeri / keparahan subjektif)
  durationDays: number;
  hasComorbidities: boolean;
  comorbiditiesNotes?: string;
  freeTextComplaint?: string;
  hasEmergencyRedFlags?: boolean;
}

export interface TriageResult {
  urgencyLevel: 'MERAH' | 'KUNING' | 'HIJAU';
  urgencyScore: number;           // 0 - 100
  colorHex: string;
  title: string;
  patientExplanation: string;
  recommendedAction: 'EMERGENCY_IGD' | 'PRIORITY_POLI' | 'NORMAL_QUEUE';
  triggeredRules: string[];
  disclaimer: string;
  soapDraft: {
    subjective: string;
    objectiveNeeded: string;
    preliminaryAssessment: string;
    suggestedPlan: string;
  };
}

// Master Gejala dengan Bobot Klinis
export const SYMPTOM_DICTIONARY: Record<string, { label: string; baseScore: number; isRedFlag?: boolean; isUrgent?: boolean }> = {
  // Red Flags (Gawat Darurat Segera -> MERAH)
  'chest_pain_severe': { label: 'Nyeri dada hebat / tertindih menjalar ke lengan/leher', baseScore: 90, isRedFlag: true },
  'shortness_breath_severe': { label: 'Sesak napas berat (bicara terputus-putus/bibir membiru)', baseScore: 85, isRedFlag: true },
  'loss_of_consciousness': { label: 'Penurunan kesadaran / pingsan / linglung akut', baseScore: 95, isRedFlag: true },
  'uncontrolled_bleeding': { label: 'Perdarahan hebat yang tidak kunjung berhenti', baseScore: 85, isRedFlag: true },
  'convulsions_seizures': { label: 'Kejang-kejang aktif atau baru saja terjadi', baseScore: 90, isRedFlag: true },

  // Urgent (KUNING)
  'high_fever_prolonged': { label: 'Demam tinggi (> 38.5°C) lebih dari 3 hari', baseScore: 45, isUrgent: true },
  'acute_abdominal_pain': { label: 'Nyeri perut melilit hebat tak tertahankan', baseScore: 50, isUrgent: true },
  'severe_vomiting_diarrhea': { label: 'Muntah/diare berulang > 5x sehari (tanda dehidrasi)', baseScore: 45, isUrgent: true },
  'wound_deep_cut': { label: 'Luka robek terbuka / luka kecelakaan kerja', baseScore: 40, isUrgent: true },
  'asthma_flare': { label: 'Asma kambuh dengan napas berbunyi mengi', baseScore: 50, isUrgent: true },

  // Standard (HIJAU)
  'cough_mild': { label: 'Batuk berdahak / batuk kering ringan', baseScore: 10 },
  'runny_nose': { label: 'Pilek / hidung tersumbat', baseScore: 8 },
  'sore_throat': { label: 'Radang / sakit tenggorokan saat menelan', baseScore: 12 },
  'headache_mild': { label: 'Pusing / sakit kepala ringan biasa', baseScore: 15 },
  'joint_muscle_pain': { label: 'Pegal linu / nyeri sendi ringan', baseScore: 10 },
  'skin_rash_itchy': { label: 'Gatal-gatal / ruam kulit biasa', baseScore: 10 },
  'routine_bpjs_check': { label: 'Kontrol rutin obat kronis (Hipertensi/DM stabil)', baseScore: 5 },
};

export function evaluateTriage(input: SymptomEvaluationRequest): TriageResult {
  const triggeredRules: string[] = [];
  let score = 0;
  let hasRedFlag = Boolean(input.hasEmergencyRedFlags);

  // Periksa apakah ada Red Flag langsung dari checklist
  for (const symId of input.symptomIds) {
    const item = SYMPTOM_DICTIONARY[symId];
    if (item) {
      score += item.baseScore;
      if (item.isRedFlag) {
        hasRedFlag = true;
        triggeredRules.push(`Red Flag terdeteksi: ${item.label}`);
      } else if (item.isUrgent) {
        triggeredRules.push(`Gejala Prioritas: ${item.label}`);
      }
    }
  }

  // Pengali keparahan subjektif pasien (1-5)
  if (input.severityRating >= 4) {
    score += 15;
    triggeredRules.push(`Rating keparahan subjektif tinggi (${input.severityRating}/5)`);
  }

  // Komorbiditas (Lansia, DM, Jantung, Hipertensi)
  if (input.hasComorbidities) {
    score += 15;
    triggeredRules.push('Pasien memiliki riwayat penyakit penyerta (komorbiditas)');
  }

  // Durasi keluhan
  if (input.durationDays > 7) {
    score += 5;
    triggeredRules.push(`Keluhan berlangsung kronis (${input.durationDays} hari)`);
  }

  // Keputusan Level Triase
  let urgencyLevel: 'MERAH' | 'KUNING' | 'HIJAU' = 'HIJAU';
  let urgencyScore = Math.min(100, Math.max(5, score));
  let colorHex = '#10B981'; // Green
  let title = 'HIJAU - Jalur Poliklinik Reguler';
  let recommendedAction: 'EMERGENCY_IGD' | 'PRIORITY_POLI' | 'NORMAL_QUEUE' = 'NORMAL_QUEUE';
  let patientExplanation = 'Kondisi Anda saat ini stabil dan dapat ditangani pada alur pemeriksaan reguler. Ikuti estimasi waktu tunggu untuk tiba tepat waktu.';

  if (hasRedFlag || urgencyScore >= 75) {
    urgencyLevel = 'MERAH';
    urgencyScore = Math.max(85, urgencyScore);
    colorHex = '#EF4444'; // Red
    title = 'MERAH - Segera ke Unit Gawat Darurat (IGD)';
    recommendedAction = 'EMERGENCY_IGD';
    patientExplanation = 'PERINGATAN GAWAT DARURAT: Gejala yang Anda alami memerlukan tindakan medis segera. Jangan menunggu antrean poliklinik reguler. Segera datangi ruang IGD Puskesmas terdekat atau hubungi PSC 119.';
  } else if (urgencyScore >= 40) {
    urgencyLevel = 'KUNING';
    colorHex = '#F59E0B'; // Amber
    title = 'KUNING - Prioritas Poliklinik Mendesak';
    recommendedAction = 'PRIORITY_POLI';
    patientExplanation = 'Gejala Anda membutuhkan perhatian medis prioritas hari ini. Antrean Anda akan diprioritaskan di atas antrean umum untuk mencegah perburukan.';
  }

  // Susun Draft SOAP Notes untuk Dokter (Anti-Gravity Shadow Consultation)
  const selectedLabels = input.symptomIds.map(id => SYMPTOM_DICTIONARY[id]?.label || id).join(', ');
  const complaintText = input.freeTextComplaint ? ` Keluhan tambahan: "${input.freeTextComplaint}"` : '';

  const soapDraft = {
    subjective: `Pasien mengeluhkan: ${selectedLabels || 'Keluhan umum'}. Durasi: ${input.durationDays} hari, skala nyeri: ${input.severityRating}/5.${input.hasComorbidities ? ` Riwayat komorbid: ${input.comorbiditiesNotes || 'Ada'}.` : ''}${complaintText}`,
    objectiveNeeded: urgencyLevel === 'MERAH' 
      ? 'Evaluasi tanda vital segera: SpO2, Tekanan Darah, Frekuensi Napas, EKG bila indikasi nyeri dada.'
      : 'Cek TTV (Tensi, Suhu, Nadi, Respirasi), pemeriksaan fisik organ terkait fokus keluhan.',
    preliminaryAssessment: urgencyLevel === 'MERAH'
      ? 'Suspek Sindroma Koroner Akut / Distres Pernapasan / Kegawatdaruratan Medis (Immediate Triage).'
      : urgencyLevel === 'KUNING'
      ? 'Suspek Kasus Akut Membutuhkan Evaluasi Cepat (Urgent Triage).'
      : 'Kondisi Ringan - Sedang Stabil (Routine Ambulatory Primary Care).',
    suggestedPlan: urgencyLevel === 'MERAH'
      ? 'Triase Merah: Masuk bed IGD, oksigenasi jika hipoksia, akses IV, lapor dokter jaga IGD.'
      : 'Konfirmasi anamnesis terarah, tentukan resep simptomatik/etiologis, edukasi home care.'
  };

  return {
    urgencyLevel,
    urgencyScore,
    colorHex,
    title,
    patientExplanation,
    recommendedAction,
    triggeredRules,
    disclaimer: 'DISCLAIMER: Sistem ini adalah alat bantu pra-triase mandiri dan pemilahan antrean berbasis protokol, BUKAN pengganti diagnosis resmi tenaga kesehatan.',
    soapDraft
  };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const body: SymptomEvaluationRequest = await req.json();
    const result = evaluateTriage(body);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
