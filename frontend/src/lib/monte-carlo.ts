import { MonteCarloSimulationResult, WhatIfScenarioInput, WhatIfScenarioResult } from '@/types';

/**
 * Box-Muller transform untuk menghasilkan angka acak berdistribusi normal
 */
function sampleNormal(mean: number, stdDev: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + num * stdDev;
}

/**
 * Simulasi Waktu Tunggu Pasien Individual (Tingkat 2 - Estimasi Waktu Jujur)
 */
export function simulateWaitTime(
  peopleAhead: number,
  activeCounters: number = 2,
  avgServiceTimeMins: number = 7.5,
  stdDevMins: number = 2.2,
  travelTimeMins: number = 15,
  iterations: number = 1000
): MonteCarloSimulationResult {
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
      displayRange: '< 5 menit (Langsung Dilayani)',
      honestSummary: 'Tidak ada antrean sebelum Anda. Anda dapat langsung masuk ruang periksa begitu tiba.',
      recommendedDepartureTime: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      bottleneckRisk: 'RENDAH',
    };
  }

  const simulatedWaitTimes: number[] = [];

  for (let i = 0; i < iterations; i++) {
    // Array server/loket mencatat durasi kumulatif
    const serverFreeAt = new Array(Math.max(1, activeCounters)).fill(0);

    for (let p = 0; p < peopleAhead; p++) {
      const fastestServerIdx = serverFreeAt.indexOf(Math.min(...serverFreeAt));
      // Durasi layanan tiap pasien bervariasi dengan batas realistik [3 - 18 menit]
      const duration = Math.min(Math.max(sampleNormal(avgServiceTimeMins, stdDevMins), 3.0), 18.0);
      serverFreeAt[fastestServerIdx] += duration;
    }

    // Pasien baru akan dilayani saat salah satu loket selesai
    const waitTime = Math.min(...serverFreeAt);
    simulatedWaitTimes.push(waitTime);
  }

  simulatedWaitTimes.sort((a, b) => a - b);

  const p50Minutes = Math.round(simulatedWaitTimes[Math.floor(iterations * 0.5)]);
  const p90Minutes = Math.round(simulatedWaitTimes[Math.floor(iterations * 0.9)]);
  const minMinutes = Math.round(simulatedWaitTimes[0]);
  const maxMinutes = Math.round(simulatedWaitTimes[iterations - 1]);

  const lowBound = Math.max(5, Math.floor(p50Minutes * 0.85));
  const highBound = Math.max(lowBound + 10, p90Minutes);

  // Anti-Gravity: Kapan pasien harus berangkat dari rumah
  const now = new Date();
  const leadMinutes = Math.max(0, p50Minutes - travelTimeMins);
  const departureDate = new Date(now.getTime() + leadMinutes * 60 * 1000);
  const recommendedDepartureTime = departureDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  let bottleneckRisk: 'RENDAH' | 'SEDANG' | 'TINGGI' = 'RENDAH';
  if (p90Minutes > 70) bottleneckRisk = 'TINGGI';
  else if (p90Minutes > 40) bottleneckRisk = 'SEDANG';

  return {
    peopleAhead,
    activeCounters,
    iterations,
    p50Minutes,
    p90Minutes,
    minMinutes,
    maxMinutes,
    displayRange: `${lowBound} - ${highBound} menit`,
    honestSummary: `Berdasarkan ${iterations.toLocaleString()} simulasi kemungkinan alur periksa hari ini, 90% kemungkinan Anda dipanggil dalam ${p90Minutes} menit atau lebih cepat (waktu tipikal sekitar ${p50Minutes} menit).`,
    recommendedDepartureTime,
    bottleneckRisk,
  };
}

/**
 * Simulasi Skenario "Bagaimana-Kalau" untuk Kepala Puskesmas (Tingkat 3 - Panel Manajer)
 */
export function runWhatIfSimulation(input: WhatIfScenarioInput): WhatIfScenarioResult {
  const {
    numCounters,
    avgServiceTimeMins,
    stdDevMins,
    incomingPatientsPerHour,
    iterations = 1000,
  } = input;

  const simulatedWaitTimes: number[] = [];

  for (let iter = 0; iter < iterations; iter++) {
    // Estimasi antrean dalam durasi shift 2 jam
    // Poisson arrival approximation: pasien tiba per 2 jam
    const totalPatients = Math.max(4, Math.round(incomingPatientsPerHour * 2 * (0.85 + Math.random() * 0.3)));
    const serverFreeAt = new Array(Math.max(1, numCounters)).fill(0);
    let cumulativeWaitTime = 0;

    for (let p = 0; p < totalPatients; p++) {
      const arrivalMin = (p / totalPatients) * 120; // tersebar dalam 120 menit
      const fastestIdx = serverFreeAt.indexOf(Math.min(...serverFreeAt));
      const startServiceAt = Math.max(arrivalMin, serverFreeAt[fastestIdx]);
      const waitTime = startServiceAt - arrivalMin;
      cumulativeWaitTime += waitTime;

      const duration = Math.min(Math.max(sampleNormal(avgServiceTimeMins, stdDevMins), 3.0), 20.0);
      serverFreeAt[fastestIdx] = startServiceAt + duration;
    }

    const avgWaitThisRun = cumulativeWaitTime / totalPatients;
    simulatedWaitTimes.push(avgWaitThisRun);
  }

  simulatedWaitTimes.sort((a, b) => a - b);

  const avgWait = Number((simulatedWaitTimes.reduce((acc, v) => acc + v, 0) / iterations).toFixed(1));
  const p90Wait = Number(simulatedWaitTimes[Math.floor(iterations * 0.9)].toFixed(1));

  // Hitung persentase simulasi yang mengalami bottleneck (> 60 menit)
  const bottleneckRuns = simulatedWaitTimes.filter((w) => w > 60).length;
  const bottleneckRiskPercentage = Number(((bottleneckRuns / iterations) * 100).toFixed(1));

  // Buat histogram sebaran
  const buckets = [
    { label: '< 15m', min: 0, max: 15 },
    { label: '15-30m', min: 15, max: 30 },
    { label: '30-45m', min: 30, max: 45 },
    { label: '45-60m', min: 45, max: 60 },
    { label: '60-90m', min: 60, max: 90 },
    { label: '> 90m', min: 90, max: 9999 },
  ];

  const distributionHistogram = buckets.map((b) => {
    const count = simulatedWaitTimes.filter((w) => w >= b.min && w < b.max).length;
    return {
      bucket: b.label,
      count,
      percentage: Number(((count / iterations) * 100).toFixed(1)),
    };
  });

  const autonomousLoadSheddingTriggered = p90Wait > 75 || bottleneckRiskPercentage > 40;

  let recommendation = 'Kapasitas poli saat ini optimal. Beban antrean dapat ditampung dengan nyaman.';
  if (autonomousLoadSheddingTriggered) {
    recommendation = `PERINGATAN BOTTLENECK: Beban pasien (${incomingPatientsPerHour}/jam) melebihi kapasitas ${numCounters} loket. Direkomendasikan: (1) Buka 1 loket tambahan, ATAU (2) Aktifkan 'Re-route Non-Emergency' ke Pustu/Bidan Desa terdekat via transfer rekam medis otomatis.`;
  } else if (p90Wait > 45) {
    recommendation = 'Kapasitas poli mendekati batas aman. Waktu tunggu P90 mencapai ~45 menit. Pertimbangkan pembatasan slot online atau penugasan perawat untuk pra-tensi mandiri.';
  }

  return {
    numCounters,
    avgServiceTimeMins,
    incomingPatientsPerHour,
    simulatedAvgWaitMins: avgWait,
    simulatedP90WaitMins: p90Wait,
    bottleneckRiskPercentage,
    distributionHistogram,
    recommendation,
    autonomousLoadSheddingTriggered,
  };
}
