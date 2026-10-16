/**
 * PuskesmasPintar - Supabase Edge Function: estimasi-waktu
 * Menggunakan Simulasi Monte Carlo untuk menghitung rentang estimasi waktu tunggu yang jujur (P50 - P90)
 * Hackathon JOINTS UGM 2026
 */

export interface SimulationParams {
  peopleAhead: number;          // Jumlah orang yang sedang mengantre di depan
  activeCounters?: number;      // Jumlah loket / poli aktif (default: 2)
  avgServiceTimeMins?: number;  // Rata-rata lama konsultasi per pasien (default: 7.5 menit)
  stdDevMins?: number;          // Standar deviasi lama konsultasi (default: 2.2 menit)
  minServiceTimeMins?: number;  // Batas minimum durasi periksa (default: 3.5 menit)
  maxServiceTimeMins?: number;  // Batas maksimum durasi periksa (default: 18.0 menit)
  iterations?: number;          // Jumlah putaran simulasi (default: 1000)
  travelTimeMins?: number;      // Estimasi waktu tempuh pasien ke Puskesmas (default: 15 menit)
}

export interface SimulationResult {
  peopleAhead: number;
  activeCounters: number;
  iterations: number;
  p50Minutes: number;           // Median (waktu tipikal yang paling mungkin)
  p90Minutes: number;           // 90th percentile (skenario kasus terburuk)
  minMinutes: number;
  maxMinutes: number;
  displayRange: string;         // e.g. "45 - 65 menit"
  honestSummary: string;        // Penjelasan transparan untuk pasien
  recommendedDepartureTime: string; // ISO string atau jam keberangkatan optimal dari rumah
  bottleneckRisk: 'RENDAH' | 'SEDANG' | 'TINGGI';
}

/**
 * Box-Muller transform untuk sampling distribusi normal
 */
function randomNormal(mean: number, stdDev: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + num * stdDev;
}

/**
 * Sampel waktu layanan pasien dengan batas min dan max
 */
function sampleServiceTime(mean: number, stdDev: number, min: number, max: number): number {
  const sampled = randomNormal(mean, stdDev);
  return Math.min(Math.max(sampled, min), max);
}

/**
 * Jalankan Simulasi Monte Carlo
 */
export function runMonteCarloWaitTime(params: SimulationParams): SimulationResult {
  const {
    peopleAhead,
    activeCounters = 2,
    avgServiceTimeMins = 7.5,
    stdDevMins = 2.2,
    minServiceTimeMins = 3.5,
    maxServiceTimeMins = 18.0,
    iterations = 1000,
    travelTimeMins = 15,
  } = params;

  if (peopleAhead <= 0) {
    const now = new Date();
    return {
      peopleAhead: 0,
      activeCounters,
      iterations: 0,
      p50Minutes: 0,
      p90Minutes: 5,
      minMinutes: 0,
      maxMinutes: 5,
      displayRange: "Langsung Masuk (< 5 menit)",
      honestSummary: "Tidak ada antrean di depan Anda. Anda akan langsung dilayani saat tiba.",
      recommendedDepartureTime: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      bottleneckRisk: 'RENDAH'
    };
  }

  const simulatedWaitTimes: number[] = [];

  for (let iter = 0; iter < iterations; iter++) {
    // Model multi-server queue (M/G/c approximation)
    // Server array mencatat kapan masing-masing loket/dokter selesai
    const serverFreeAt = new Array(Math.max(1, activeCounters)).fill(0);

    for (let p = 0; p < peopleAhead; p++) {
      // Pasien p dilayani oleh loket yang paling cepat kosong
      const nextAvailableIndex = serverFreeAt.indexOf(Math.min(...serverFreeAt));
      const serviceDuration = sampleServiceTime(
        avgServiceTimeMins,
        stdDevMins,
        minServiceTimeMins,
        maxServiceTimeMins
      );
      serverFreeAt[nextAvailableIndex] += serviceDuration;
    }

    // Waktu tunggu pasien baru adalah saat loket berikutnya tersedia
    const waitTimeForNewPatient = Math.min(...serverFreeAt);
    simulatedWaitTimes.push(waitTimeForNewPatient);
  }

  // Urutkan untuk mencari persentil
  simulatedWaitTimes.sort((a, b) => a - b);

  const p50Index = Math.floor(iterations * 0.50);
  const p90Index = Math.floor(iterations * 0.90);
  const minIndex = 0;
  const maxIndex = iterations - 1;

  const p50Minutes = Math.round(simulatedWaitTimes[p50Index]);
  const p90Minutes = Math.round(simulatedWaitTimes[p90Index]);
  const minMinutes = Math.round(simulatedWaitTimes[minIndex]);
  const maxMinutes = Math.round(simulatedWaitTimes[maxIndex]);

  // Rentang yang jujur: dari P25/P50 bawah ke P90
  const lowBound = Math.max(5, Math.floor(p50Minutes * 0.85));
  const highBound = Math.max(lowBound + 10, p90Minutes);

  // Hitung jam berangkat optimal (Anti-Gravity invisible waiting room)
  // Berangkat = Waktu saat ini + (p50Minutes - travelTimeMins)
  const now = new Date();
  const leadMinutes = Math.max(0, p50Minutes - travelTimeMins);
  const departureDate = new Date(now.getTime() + leadMinutes * 60 * 1000);
  const departureTimeString = departureDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  let bottleneckRisk: 'RENDAH' | 'SEDANG' | 'TINGGI' = 'RENDAH';
  if (p90Minutes > 75) {
    bottleneckRisk = 'TINGGI';
  } else if (p90Minutes > 45) {
    bottleneckRisk = 'SEDANG';
  }

  return {
    peopleAhead,
    activeCounters,
    iterations,
    p50Minutes,
    p90Minutes,
    minMinutes,
    maxMinutes,
    displayRange: `${lowBound} - ${highBound} menit`,
    honestSummary: `Berdasarkan ${iterations.toLocaleString()} simulasi kemungkinan alur periksa, 90% kemungkinan Anda akan dilayani dalam ${p90Minutes} menit atau lebih cepat (tipikal sekitar ${p50Minutes} menit).`,
    recommendedDepartureTime: departureTimeString,
    bottleneckRisk
  };
}

// HTTP Handler untuk Supabase Edge Function / Node.js
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
    const body: SimulationParams = await req.json();
    const result = runMonteCarloWaitTime(body);

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
