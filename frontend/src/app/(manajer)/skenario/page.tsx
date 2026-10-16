'use client';

import { useState, useEffect } from 'react';
import { runWhatIfSimulation } from '@/lib/monte-carlo';
import { WhatIfScenarioResult } from '@/types';
import {
  Sliders,
  BarChart3,
  Sparkles,
  RefreshCw,
  Zap,
} from 'lucide-react';

export default function SkenarioPage() {
  const [numCounters, setNumCounters] = useState<number>(2);
  const [avgServiceTime, setAvgServiceTime] = useState<number>(7.5);
  const [incomingPatients, setIncomingPatients] = useState<number>(14);
  const [rerouteActive, setRerouteActive] = useState<boolean>(false);

  const [result, setResult] = useState<WhatIfScenarioResult | null>(null);

  const calculateScenario = () => {
    // If autonomous reroute active, effective load is reduced by 30%
    const effectiveLoad = rerouteActive ? Math.round(incomingPatients * 0.7) : incomingPatients;

    const res = runWhatIfSimulation({
      numCounters,
      avgServiceTimeMins: avgServiceTime,
      stdDevMins: 2.2,
      incomingPatientsPerHour: effectiveLoad,
      iterations: 1000,
    });
    setResult(res);
  };

  useEffect(() => {
    calculateScenario();
  }, [numCounters, avgServiceTime, incomingPatients, rerouteActive]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-2 border border-purple-200">
            <Sliders className="w-3.5 h-3.5" />
            <span>Tingkat 3 · Sisi Manajer (Kepala Puskesmas)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Panel Skenario "Bagaimana-Kalau" (What-If)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Uji dampak penambahan loket, lama layanan, dan beban pasien menggunakan 1.000 iterasi Monte Carlo.
          </p>
        </div>

        <button
          onClick={calculateScenario}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold text-xs sm:text-sm hover:bg-purple-700 transition-all shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Jalankan Ulang Simulasi (1.000 Runs)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Parameters Slider (4 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sliders className="w-4 h-4 text-purple-600" />
              Parameter Kapasitas Layanan
            </h3>

            {/* Slider 1: Jumlah Loket / Poli */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">Jumlah Loket / Dokter Poli Aktif</label>
                <span className="text-sm font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-200">
                  {numCounters} Loket
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={numCounters}
                onChange={(e) => setNumCounters(Number(e.target.value))}
                className="w-full accent-purple-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>1 Loket (Minimal)</span>
                <span>3 Loket (Normal)</span>
                <span>5 Loket (Maksimal)</span>
              </div>
            </div>

            {/* Slider 2: Lama Layanan Rata-Rata */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">Rata-Rata Lama Layanan per Pasien</label>
                <span className="text-sm font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-200">
                  {avgServiceTime} Menit
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="15"
                step="0.5"
                value={avgServiceTime}
                onChange={(e) => setAvgServiceTime(Number(e.target.value))}
                className="w-full accent-purple-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>4 menit (Express SOAP)</span>
                <span>8 menit (Standar)</span>
                <span>15 menit (Pemeriksaan intensif)</span>
              </div>
            </div>

            {/* Slider 3: Beban Kedatangan Pasien */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">Laju Kedatangan Pasien (per Jam)</label>
                <span className="text-sm font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-200">
                  {incomingPatients} Pasien/Jam
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={incomingPatients}
                onChange={(e) => setIncomingPatients(Number(e.target.value))}
                className="w-full accent-purple-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>5 (Sepi)</span>
                <span>15 (Normal)</span>
                <span>30 (Pancawarna / Wabah)</span>
              </div>
            </div>

            {/* Anti-Gravity Feature 3: Autonomous Mesh Re-routing */}
            <div className="pt-2 border-t border-slate-100">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-bold text-teal-900">Anti-Gravity Reroute Bidan Desa</span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-200 text-teal-800">
                    Elastic
                  </span>
                </div>
                <p className="text-[11px] text-teal-700 leading-relaxed mb-3">
                  Aktifkan desentralisasi beban: Kasus non-akut dialihkan ke Bidan Desa / Poskesdes sekitar Puskesmas.
                </p>
                <button
                  type="button"
                  onClick={() => setRerouteActive(!rerouteActive)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    rerouteActive
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-white text-teal-800 border border-teal-300 hover:bg-teal-100/50'
                  }`}
                >
                  {rerouteActive ? '✓ Reroute Otonom Aktif (-30% Beban Poli)' : 'Aktifkan Reroute Bidan Desa'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Simulation Output, P90, & Distribution Chart (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {result && (
            <>
              {/* Top Result Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Rata-Rata Waktu Tunggu</span>
                  <div className="text-3xl font-black text-slate-900 mt-1">
                    ~{result.simulatedAvgWaitMins} <span className="text-sm font-normal text-slate-500">menit</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Ekspektasi tipikal pasien</p>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-amber-600 uppercase">Kasus Terburuk (P90)</span>
                  <div className="text-3xl font-black text-amber-700 mt-1">
                    ~{result.simulatedP90WaitMins} <span className="text-sm font-normal text-amber-600">menit</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">90% kasus di bawah ini</p>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-rose-600 uppercase">Risiko Bottleneck</span>
                  <div className={`text-3xl font-black mt-1 ${result.bottleneckRiskPercentage > 30 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {result.bottleneckRiskPercentage}%
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Peluang tunggu &gt; 60 mnt</p>
                </div>
              </div>

              {/* Distribution Histogram */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-purple-600" />
                      Sebaran Probabilitas Waktu Tunggu (1.000 Percobaan)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Menampilkan persentase kemungkinan berapa lama pasien akan menunggu hari ini.
                    </p>
                  </div>
                </div>

                {/* Histogram Bars */}
                <div className="space-y-3 pt-2">
                  {result.distributionHistogram.map((item) => (
                    <div key={item.bucket} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-700 w-16">{item.bucket}</span>
                        <div className="flex-1 mx-3 bg-slate-100 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              item.bucket.includes('> 90') || item.bucket.includes('60-90')
                                ? 'bg-rose-500'
                                : item.bucket.includes('45-60')
                                ? 'bg-amber-500'
                                : 'bg-teal-500'
                            }`}
                            style={{ width: `${Math.max(item.percentage, 2)}%` }}
                          />
                        </div>
                        <span className="text-slate-900 text-xs w-14 text-right">
                          {item.percentage}% ({item.count})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Strategic Recommendation Box */}
              <div className={`p-5 rounded-3xl border ${
                result.autonomousLoadSheddingTriggered
                  ? 'bg-amber-50/70 border-amber-300'
                  : 'bg-emerald-50/70 border-emerald-300'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    result.autonomousLoadSheddingTriggered ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                  }`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Rekomendasi Kapasitas untuk Kepala Puskesmas
                    </h4>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                      {result.recommendation}
                    </p>
                    {result.autonomousLoadSheddingTriggered && !rerouteActive && (
                      <div className="mt-3">
                        <button
                          onClick={() => setRerouteActive(true)}
                          className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 shadow-sm transition-all"
                        >
                          Coba Terapkan 'Reroute Bidan Desa' Sekarang
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
