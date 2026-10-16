import { SymptomItem, SymptomReport, TriageEvaluation } from '@/types';

export const SYMPTOM_CATALOG: SymptomItem[] = [
  // Red Flag
  { id: 'chest_pain_severe', label: 'Nyeri dada hebat / seperti tertindih beban berat', category: 'red_flag', baseScore: 90 },
  { id: 'shortness_breath_severe', label: 'Sesak napas berat (bicara terputus / bibir kebiruan)', category: 'red_flag', baseScore: 85 },
  { id: 'loss_of_consciousness', label: 'Penurunan kesadaran / pingsan / linglung akut', category: 'red_flag', baseScore: 95 },
  { id: 'uncontrolled_bleeding', label: 'Perdarahan masif tak kunjung berhenti', category: 'red_flag', baseScore: 85 },
  { id: 'convulsions_seizures', label: 'Kejang-kejang aktif atau baru saja terjadi', category: 'red_flag', baseScore: 90 },

  // Urgent
  { id: 'high_fever_prolonged', label: 'Demam tinggi (>38.5°C) lebih dari 3 hari', category: 'urgent', baseScore: 45 },
  { id: 'acute_abdominal_pain', label: 'Nyeri perut melilit hebat tak tertahankan', category: 'urgent', baseScore: 50 },
  { id: 'severe_vomiting_diarrhea', label: 'Muntah / diare > 5x sehari (mata cekung / lemas)', category: 'urgent', baseScore: 45 },
  { id: 'asthma_flare', label: 'Asma kambuh dengan mengi / tarikan dinding dada', category: 'urgent', baseScore: 50 },
  { id: 'wound_deep_cut', label: 'Luka robek terbuka membutuhkan jahitan', category: 'urgent', baseScore: 40 },

  // Standard
  { id: 'cough_mild', label: 'Batuk berdahak / batuk kering biasa', category: 'standard', baseScore: 10 },
  { id: 'runny_nose', label: 'Pilek / hidung meler atau tersumbat', category: 'standard', baseScore: 8 },
  { id: 'sore_throat', label: 'Sakit / perih tenggorokan saat menelan', category: 'standard', baseScore: 12 },
  { id: 'headache_mild', label: 'Sakit kepala / pusing ringan', category: 'standard', baseScore: 15 },
  { id: 'joint_muscle_pain', label: 'Pegal linu / nyeri sendi & otot', category: 'standard', baseScore: 10 },
  { id: 'skin_rash_itchy', label: 'Gatal-gatal / ruam kulit alergi biasa', category: 'standard', baseScore: 10 },
  { id: 'routine_bpjs_check', label: 'Kontrol rutin / perpanjangan resep obat kronis', category: 'standard', baseScore: 5 },
];

export function runPreTriage(report: SymptomReport): TriageEvaluation {
  const triggeredRules: string[] = [];
  let score = 0;
  let hasRedFlag = report.hasEmergencyRedFlags;

  for (const symId of report.symptomIds) {
    const item = SYMPTOM_CATALOG.find((s) => s.id === symId);
    if (item) {
      score += item.baseScore;
      if (item.category === 'red_flag') {
        hasRedFlag = true;
        triggeredRules.push(`Kondisi Red Flag: ${item.label}`);
      } else if (item.category === 'urgent') {
        triggeredRules.push(`Gejala Prioritas: ${item.label}`);
      }
    }
  }

  // Bobot keparahan subjektif (1 - 5)
  if (report.severityRating >= 4) {
    score += 15;
    triggeredRules.push(`Tingkat keparahan subjektif pasien tinggi (${report.severityRating}/5)`);
  }

  // Bobot komorbiditas (Hipertensi, Jantung, Diabetes, Lansia)
  if (report.hasComorbidities) {
    score += 15;
    triggeredRules.push('Pasien memiliki riwayat penyakit penyerta (komorbiditas)');
  }

  // Durasi keluhan
  if (report.durationDays > 7) {
    score += 5;
    triggeredRules.push(`Keluhan berlangsung lama (>7 hari)`);
  }

  // Final score clamping
  const urgencyScore = Math.min(100, Math.max(5, score));

  if (hasRedFlag || urgencyScore >= 75) {
    return {
      urgencyLevel: 'MERAH',
      urgencyScore: Math.max(85, urgencyScore),
      colorHex: '#EF4444',
      title: 'MERAH - Gawat Darurat (Segera ke IGD)',
      patientExplanation:
        'PERINGATAN GAWAT DARURAT: Gejala yang dilaporkan mengindikasikan potensi bahaya medis akut. Segera datangi Unit Gawat Darurat (IGD) Puskesmas terdekat tanpa menunggu antrean poliklinik.',
      recommendedAction: 'EMERGENCY_IGD',
      triggeredRules,
      disclaimer:
        'DISCLAIMER: Hasil ini adalah alat bantu pra-triase otomatis, BUKAN diagnosis dokter. Bila Anda merasa darurat, segera cari pertolongan medis terdekat atau hubungi PSC 119.',
      soapDraft: {
        subjective: `Pasien melapor: ${report.symptomIds.join(', ')}. Durasi ${report.durationDays} hari, skor nyeri ${report.severityRating}/5. ${report.freeTextComplaint || ''}`,
        objectiveNeeded: 'Evaluasi Airway, Breathing, Circulation (ABC), SpO2, EKG 12-lead jika indikasi jantung, TTV lengkap.',
        preliminaryAssessment: 'Kedaruratan Medis Akut (Triase Level 1/2 MTS). Butuh stabilisasi cepat.',
        suggestedPlan: 'Masuk ruang tindakan/IGD, pasang monitor vital, oksigenasi target >95%, pasang IV line, konsultasi dokter jaga.',
      },
    };
  }

  if (urgencyScore >= 40) {
    return {
      urgencyLevel: 'KUNING',
      urgencyScore,
      colorHex: '#F59E0B',
      title: 'KUNING - Prioritas Poliklinik Mendesak',
      patientExplanation:
        'Gejala Anda memerlukan penanganan prioritas hari ini. Sistem telah menandai tiket Anda agar dipanggil lebih awal sebelum antrean umum.',
      recommendedAction: 'PRIORITY_POLI',
      triggeredRules,
      disclaimer:
        'DISCLAIMER: Hasil ini adalah alat bantu pra-triase otomatis, BUKAN diagnosis dokter. Tetap lakukan konsultasi tatap muka dengan dokter di poli.',
      soapDraft: {
        subjective: `Pasien mengeluh gejala akut: ${report.symptomIds.join(', ')}. Skala nyeri: ${report.severityRating}/5. Komorbid: ${report.hasComorbidities ? report.comorbiditiesNotes || 'Ya' : 'Tidak'}.`,
        objectiveNeeded: 'Cek suhu aksila/timpani, inspeksi abdomen/luka, auskultasi dada, cek dehidrasi turgor kulit.',
        preliminaryAssessment: 'Kondisi Akut / Potensi Dehidrasi / Infeksi Akut berisiko komplikasi bila tertunda.',
        suggestedPlan: 'Pemeriksaan fisik terarah, tes lab sederhana Puskesmas (DPL/GDS/Urin) jika perlu, terapi simptomatik adekuat.',
      },
    };
  }

  return {
    urgencyLevel: 'HIJAU',
    urgencyScore,
    colorHex: '#10B981',
    title: 'HIJAU - Alur Poliklinik Reguler',
    patientExplanation:
      'Kondisi Anda saat ini stabil dan aman untuk mengikuti alur pemeriksaan umum. Silakan berangkat sesuai estimasi waktu yang direkomendasikan.',
    recommendedAction: 'NORMAL_QUEUE',
    triggeredRules: triggeredRules.length > 0 ? triggeredRules : ['Gejala ringan dalam batas wajar'],
    disclaimer:
      'DISCLAIMER: Hasil ini adalah alat bantu pra-triase otomatis, BUKAN diagnosis medis resmi tenaga kesehatan.',
    soapDraft: {
      subjective: `Pasien datang dengan keluhan: ${report.symptomIds.join(', ')}. Durasi: ${report.durationDays} hari. Tidak ada tanda bahaya gawat darurat.`,
      objectiveNeeded: 'Pemeriksaan fisik standar: Tekanan darah, Nadi, Suhu tubuh, status lokalis relevan.',
      preliminaryAssessment: 'Penyakit rawat jalan umum (ISPA ringan / dispepsia ringan / myalgia / kontrol obat kronis).',
      suggestedPlan: 'Edukasi istirahat, resep obat rawat jalan oral, pesan kontrol jika gejala memburuk dalam 3 hari.',
    },
  };
}
