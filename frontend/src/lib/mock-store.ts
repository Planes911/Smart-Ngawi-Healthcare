import { Puskesmas, QueueTicket, UrgencyLevel } from '@/types';

export const PUSKESMAS_NGAWI: Puskesmas[] = [
  {
    id: 'pusk-ngw-01',
    code: 'NGW-001',
    name: 'Puskesmas Ngawi Purba',
    district: 'Ngawi Kota',
    address: 'Jl. PB. Sudirman No. 12, Ngawi',
    phone: '0351-749123',
    activeCounters: 3,
    avgServiceTimeMins: 7.5,
  },
  {
    id: 'pusk-ngw-02',
    code: 'NGW-002',
    name: 'Puskesmas Geneng',
    district: 'Geneng',
    address: 'Jl. Raya Geneng-Ngawi Km. 6, Geneng',
    phone: '0351-748456',
    activeCounters: 2,
    avgServiceTimeMins: 8.0,
  },
  {
    id: 'pusk-ngw-03',
    code: 'NGW-003',
    name: 'Puskesmas Kendal',
    district: 'Kendal',
    address: 'Jl. Raya Kendal No. 45, Kendal',
    phone: '0351-747789',
    activeCounters: 2,
    avgServiceTimeMins: 8.5,
  },
  {
    id: 'pusk-ngw-04',
    code: 'NGW-004',
    name: 'Puskesmas Ngrambe',
    district: 'Ngrambe',
    address: 'Jl. Lawu No. 10, Ngrambe',
    phone: '0351-746321',
    activeCounters: 2,
    avgServiceTimeMins: 9.0,
  },
];

// Helper untuk menghasilkan timestamp dinamis agar dashboard selalu terasa "live saat ini"
const nowTimestamp = Date.now();
const minutesAgo = (mins: number) => new Date(nowTimestamp - mins * 60 * 1000).toISOString();

// In-memory initial queue data for instant demo
const INITIAL_QUEUE: QueueTicket[] = [
  // 1. Kasus Sedang Berjalan di Poli (Pemeriksaan Aktif)
  {
    id: 'q-001',
    puskesmasId: 'pusk-ngw-01',
    patientId: 'pat-001',
    patientName: 'Bambang Supriyanto',
    patientPhone: '081234567890',
    ticketNumber: 'A-001',
    queueType: 'ONLINE',
    status: 'EXAMINING',
    urgencyLevel: 'HIJAU',
    urgencyScore: 18,
    estWaitMinP50: 0,
    estWaitMinP90: 5,
    registeredAt: minutesAgo(24),
    serviceStartedAt: minutesAgo(6),
    assignedCounter: 'Poli Umum 1',
    polyType: 'Poli Umum',
    symptomsList: ['cough_mild', 'runny_nose'],
    soapDraft: {
      subjective: 'Pasien mengeluh batuk berdahak 3 hari, pilek, demam sumer (37.8°C), tidak ada sesak napas.',
      objectiveNeeded: 'Auskultasi paru (suara napas vesikuler), inspeksi faring hiperemis, ukur suhu aksila.',
      preliminaryAssessment: 'ISPA Akut / Common Cold Non-Spesifik (Derajat Ringan).',
      suggestedPlan: 'Guaifenesin 100mg 3x1, Parasetamol 500mg prn demam, edukasi hidrasi dan istirahat cukup.',
    },
  },

  // 2. Kasus Prioritas Mendesak (Kuning - Dehidrasi Akut)
  {
    id: 'q-002',
    puskesmasId: 'pusk-ngw-01',
    patientId: 'pat-002',
    patientName: 'Siti Rahmawati',
    patientPhone: '081298765432',
    ticketNumber: 'A-002',
    queueType: 'ONLINE',
    status: 'WAITING',
    urgencyLevel: 'KUNING',
    urgencyScore: 55,
    estWaitMinP50: 12,
    estWaitMinP90: 18,
    registeredAt: minutesAgo(16),
    polyType: 'Poli Umum',
    symptomsList: ['acute_abdominal_pain', 'severe_vomiting_diarrhea'],
    soapDraft: {
      subjective: 'Muntah dan BAB cair lebih dari 6 kali sejak subuh, badan sangat lemas, rasa haus terus menerus.',
      objectiveNeeded: 'Evaluasi turgor kulit dinding abdomen, cek mata cekung, tensimeter postural, dan frekuensi nadi.',
      preliminaryAssessment: 'Gastroenteritis Akut (GEA) dengan Dehidrasi Ringan-Sedang.',
      suggestedPlan: 'Rehidrasi oral segera (Oralit ad libitum), Zinc 20mg 1x1, tablet probiotik, observasi 1 jam.',
    },
  },

  // 3. Kasus Gawat Darurat (Merah - Suspek Sindroma Koroner Akut, Walk-In Lansia)
  {
    id: 'q-003',
    puskesmasId: 'pusk-ngw-01',
    patientId: 'pat-003',
    patientName: 'Pak Djoyo (Lansia - 64 th)',
    patientPhone: '081345678912',
    ticketNumber: 'W-001',
    queueType: 'WALK_IN',
    status: 'WAITING',
    urgencyLevel: 'MERAH',
    urgencyScore: 92,
    estWaitMinP50: 2,
    estWaitMinP90: 5,
    registeredAt: minutesAgo(7),
    polyType: 'Poli Umum',
    symptomsList: ['chest_pain_severe', 'shortness_breath_severe'],
    soapDraft: {
      subjective: 'Nyeri dada kiri seperti tertindih beban berat menjalar ke punggung sejak 30 menit lalu, keringat dingin, napas tersengal.',
      objectiveNeeded: 'Evaluasi Airway Breathing Circulation (ABC), saturasi O2, rekam EKG 12 lead segera, tensi kedua lengan.',
      preliminaryAssessment: 'Kedaruratan Kardiovaskular: Suspek Sindroma Koroner Akut (UAP/NSTEMI). BUTUH PENANGANAN CEPAT.',
      suggestedPlan: 'Alihkan ke Ruang Tindakan/IGD segera, O2 nasal kanul 3-4 lpm, kunyah Aspilet 160mg + Clopidogrel 300mg, lapor dokter jaga & siapkan rujukan RSUD jika perlu.',
    },
  },

  // 4. Kasus Reguler Non-Akut (Hijau - Kontrol Kronis / Sasaran Alihkan ke Bidan Desa)
  {
    id: 'q-004',
    puskesmasId: 'pusk-ngw-01',
    patientId: 'pat-004',
    patientName: 'Indah Kusuma (52 th)',
    patientPhone: '081567890123',
    ticketNumber: 'A-003',
    queueType: 'ONLINE',
    status: 'WAITING',
    urgencyLevel: 'HIJAU',
    urgencyScore: 12,
    estWaitMinP50: 25,
    estWaitMinP90: 38,
    recommendedDepartureTime: new Date(nowTimestamp + 10 * 60 * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    registeredAt: minutesAgo(12),
    polyType: 'Poli Umum',
    symptomsList: ['routine_bpjs_check'],
    soapDraft: {
      subjective: 'Kontrol rutin program Prolanis hipertensi bulanan, obat habis. Tidak ada keluhan pusing, mual, atau pandangan kabur.',
      objectiveNeeded: 'Pemeriksaan tekanan darah terkalibrasi, ukur nadi istirahat, timbang berat badan.',
      preliminaryAssessment: 'Hipertensi Primer Derajat 1 Terkontrol dalam Terapi.',
      suggestedPlan: 'Lanjutkan Amlodipine 5mg 1x1 pagi, konseling diet rendah garam, jadwalkan kontrol 1 bulan ke depan (bisa melalui Bidan Desa/Pustu).',
    },
  },
];

// Global cache helper for Next.js hot-reloading dev mode
const globalForStore = globalThis as unknown as {
  _puskesmasQueueStore?: QueueTicket[];
};

export const queueStore: QueueTicket[] = globalForStore._puskesmasQueueStore || [...INITIAL_QUEUE];
if (process.env.NODE_ENV !== 'production') {
  globalForStore._puskesmasQueueStore = queueStore;
}

export function getTickets(puskesmasId?: string): QueueTicket[] {
  let list = [...queueStore];
  if (puskesmasId) {
    list = list.filter((t) => t.puskesmasId === puskesmasId);
  }

  // Sort: First by Urgency (MERAH -> KUNING -> HIJAU), then by Registered Time
  const urgencyWeight: Record<UrgencyLevel, number> = {
    MERAH: 3,
    KUNING: 2,
    HIJAU: 1,
  };

  return list.sort((a, b) => {
    // If one is already examining, it stays on top of currently being served
    if (a.status === 'EXAMINING' && b.status !== 'EXAMINING') return -1;
    if (b.status === 'EXAMINING' && a.status !== 'EXAMINING') return 1;

    // Urgency weight descending
    const diffUrgency = urgencyWeight[b.urgencyLevel] - urgencyWeight[a.urgencyLevel];
    if (diffUrgency !== 0) return diffUrgency;

    // Registered time ascending (first come first served for same urgency)
    return new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime();
  });
}

export function addTicket(ticket: Omit<QueueTicket, 'id' | 'ticketNumber' | 'registeredAt'>): QueueTicket {
  const prefix = ticket.queueType === 'ONLINE' ? 'A' : 'W';
  const count = queueStore.length + 1;
  const ticketNumber = `${prefix}-${String(count).padStart(3, '0')}`;

  const newTicket: QueueTicket = {
    ...ticket,
    id: `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ticketNumber,
    registeredAt: new Date().toISOString(),
  };

  queueStore.push(newTicket);
  return newTicket;
}

export function updateTicketStatus(
  id: string,
  status: QueueTicket['status'],
  assignedCounter?: string
): QueueTicket | null {
  const ticket = queueStore.find((t) => t.id === id);
  if (!ticket) return null;

  ticket.status = status;
  if (assignedCounter) ticket.assignedCounter = assignedCounter;

  if (status === 'CALLED') {
    ticket.calledAt = new Date().toISOString();
  } else if (status === 'EXAMINING') {
    ticket.serviceStartedAt = new Date().toISOString();
  } else if (status === 'COMPLETED') {
    ticket.completedAt = new Date().toISOString();
  }

  return ticket;
}
