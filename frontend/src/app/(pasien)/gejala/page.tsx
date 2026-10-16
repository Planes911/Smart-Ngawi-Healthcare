'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SYMPTOM_CATALOG } from '@/lib/triage-rules';
import { AlertTriangle, ArrowRight, ArrowLeft, Loader2, HeartPulse } from 'lucide-react';

export default function GejalaPage() {
  const router = useRouter();

  const [bookingData, setBookingData] = useState<any>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severityRating, setSeverityRating] = useState<number>(2);
  const [durationDays, setDurationDays] = useState<number>(2);
  const [hasComorbidities, setHasComorbidities] = useState<boolean>(false);
  const [comorbiditiesNotes, setComorbiditiesNotes] = useState<string>('');
  const [freeTextComplaint, setFreeTextComplaint] = useState<string>('');
  const [disclaimerAccepted, setDisclaimerAccepted] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('temp_booking_data');
      if (!saved) {
        router.push('/booking');
      } else {
        setBookingData(JSON.parse(saved));
      }
    }
  }, [router]);

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const redFlags = SYMPTOM_CATALOG.filter((s) => s.category === 'red_flag');
  const urgentSymptoms = SYMPTOM_CATALOG.filter((s) => s.category === 'urgent');
  const standardSymptoms = SYMPTOM_CATALOG.filter((s) => s.category === 'standard');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0 && !freeTextComplaint.trim()) {
      setErrorMsg('Pilih minimal satu gejala atau tuliskan keluhan Anda.');
      return;
    }

    if (!disclaimerAccepted) {
      setErrorMsg('Harap setujui pernyataan pra-triase medis.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        ...bookingData,
        patientName: bookingData.fullName,
        patientPhone: bookingData.phone,
        symptomIds: selectedSymptoms,
        severityRating,
        durationDays,
        hasComorbidities,
        comorbiditiesNotes,
        freeTextComplaint,
        hasEmergencyRedFlags: selectedSymptoms.some((id) =>
          redFlags.some((rf) => rf.id === id)
        ),
      };

      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Terjadi kesalahan saat memproses pendaftaran.');
      }

      const responseData = await res.json();

      // Simpan hasil konfirmasi ke sessionStorage untuk halaman konfirmasi
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('confirmed_booking_result', JSON.stringify(responseData));
      }

      router.push('/konfirmasi');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghubungi server.');
      setIsLoading(false);
    }
  };

  if (!bookingData) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold text-sm flex items-center justify-center">
            ✓
          </div>
          <span className="text-slate-600 text-sm hidden sm:inline">Pilih Jadwal</span>
        </div>
        <div className="h-0.5 flex-1 mx-4 bg-teal-600" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold text-sm flex items-center justify-center">
            2
          </div>
          <span className="font-semibold text-slate-900 text-sm">Pre-Triase Gejala</span>
        </div>
        <div className="h-0.5 flex-1 mx-4 bg-slate-200" />
        <div className="flex items-center gap-2 opacity-50">
          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center">
            3
          </div>
          <span className="text-slate-600 text-sm hidden sm:inline">Estimasi & Tiket</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 uppercase tracking-wide">
            <HeartPulse className="w-4 h-4" />
            Pra-Triase Mandiri Pasien
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Checklist Keluhan & Gejala</h2>
          <p className="text-sm text-slate-500 mt-1">
            Data ini membantu tenaga medis memprioritaskan pasien darurat dan menyiapkan penanganan lebih cepat.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Red Flag Alerts */}
          <div className="p-4 rounded-xl bg-red-50/60 border border-red-200">
            <div className="flex items-center gap-2 text-red-800 font-bold text-sm mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Apakah Anda mengalami Tanda Bahaya (Gawat Darurat) berikut?</span>
            </div>
            <p className="text-xs text-red-600 mb-3">
              Jika dipilih, sistem akan langsung mengarahkan Anda ke jalur darurat/IGD tanpa menunggu.
            </p>
            <div className="space-y-2">
              {redFlags.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedSymptoms.includes(item.id)
                      ? 'bg-red-100 border-red-300 ring-1 ring-red-400'
                      : 'bg-white border-red-100 hover:border-red-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSymptoms.includes(item.id)}
                    onChange={() => toggleSymptom(item.id)}
                    className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                  />
                  <span className="text-xs sm:text-sm font-semibold text-red-900">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 2: Urgent Symptoms */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Gejala Mendesak / Prioritas Tinggi (Kuning)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {urgentSymptoms.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedSymptoms.includes(item.id)
                      ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-400'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSymptoms.includes(item.id)}
                    onChange={() => toggleSymptom(item.id)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs sm:text-sm text-slate-800">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 3: Standard Symptoms */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Gejala Umum / Periksa Rutin (Hijau)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {standardSymptoms.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedSymptoms.includes(item.id)
                      ? 'bg-teal-50 border-teal-300 ring-1 ring-teal-400'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSymptoms.includes(item.id)}
                    onChange={() => toggleSymptom(item.id)}
                    className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-xs sm:text-sm text-slate-800">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 4: Keparahan & Durasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Skala Keparahan Nyeri / Lemas (1 - 5)
              </label>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Ringan (1)</span>
                <span className="text-sm font-bold text-teal-700">Skala: {severityRating}</span>
                <span className="text-xs text-slate-500">Sangat Berat (5)</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={severityRating}
                onChange={(e) => setSeverityRating(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Durasi Keluhan Dirasakan
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 7].map((days) => (
                  <button
                    type="button"
                    key={days}
                    onClick={() => setDurationDays(days)}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                      durationDays === days
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {days === 7 ? '> 7 hr' : `${days} hr`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 5: Komorbiditas */}
          <div className="p-4 rounded-xl border border-slate-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasComorbidities}
                onChange={(e) => setHasComorbidities(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span className="text-xs sm:text-sm font-semibold text-slate-800">
                Memiliki riwayat penyakit penyerta (Hipertensi, Diabetes, Asma kronis, Jantung, Lansia)
              </span>
            </label>
            {hasComorbidities && (
              <input
                type="text"
                placeholder="Sebutkan riwayat penyakit (misal: Hipertensi sejak 5 tahun, rutin minum obat)"
                value={comorbiditiesNotes}
                onChange={(e) => setComorbiditiesNotes(e.target.value)}
                className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            )}
          </div>

          {/* Section 6: Catatan Tambahan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Keluhan Lainnya (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Ceritakan keluhan Anda secara singkat dengan bahasa sendiri..."
              value={freeTextComplaint}
              onChange={(e) => setFreeTextComplaint(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          {/* Disclaimer Check */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <input
              type="checkbox"
              id="disclaimer"
              checked={disclaimerAccepted}
              onChange={(e) => setDisclaimerAccepted(e.target.checked)}
              className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="disclaimer" className="text-xs text-slate-600 cursor-pointer">
              <strong>Pernyataan Medis:</strong> Saya memahami bahwa hasil evaluasi pra-triase ini bukan pengganti diagnosis resmi dokter, melainkan panduan penentu urgensi antrean dan estimasi waktu.
            </label>
          </div>

          {/* Navigasi Buttons */}
          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/booking')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 text-white font-semibold text-xs sm:text-sm hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Menjalankan Simulasi...
                </>
              ) : (
                <>
                  Dapatkan Hasil & Estimasi Waktu <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
