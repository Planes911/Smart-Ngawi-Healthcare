'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  User,
  Activity,
  ArrowRight,
  Navigation,
} from 'lucide-react';
import { getUrgencyBadge } from '@/lib/utils';
import { PUSKESMAS_NGAWI } from '@/lib/mock-store';

export default function KonfirmasiPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('confirmed_booking_result');
      if (saved) {
        setData(JSON.parse(saved));
      }
    }
  }, []);

  if (!data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Tidak ada tiket aktif yang ditemukan</h2>
        <p className="text-sm text-slate-500 mt-2">
          Silakan melakukan pendaftaran terlebih dahulu melalui formulir booking.
        </p>
        <Link
          href="/booking"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700"
        >
          Mulai Pendaftaran Pasien
        </Link>
      </div>
    );
  }

  const { ticket, triage, simulation, booking } = data;
  const puskesmas = PUSKESMAS_NGAWI.find((p) => p.id === booking.puskesmasId) || PUSKESMAS_NGAWI[0];
  const urgencyBadge = getUrgencyBadge(triage.urgencyLevel);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header Status */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-sm border border-emerald-200">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
          Pendaftaran & Pre-Triase Terkonfirmasi
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">Tiket Antrean PuskesmasPintar</h1>
        <p className="text-sm text-slate-500 mt-1">
          Gunakan QR code atau nomor antrean saat tiba di fasilitas kesehatan.
        </p>
      </div>

      <div className="space-y-6">
        {/* Ticket Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
          {/* Top Banner with Ticket Number & QR */}
          <div className="bg-gradient-to-r from-teal-700 to-emerald-700 text-white p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-teal-200 text-xs font-medium uppercase tracking-wider">Nomor Antrean Anda</p>
                <div className="text-5xl sm:text-6xl font-black tracking-tight mt-1">
                  {ticket.ticketNumber}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
                    {booking.polyType}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
                    Slot {booking.timeSlot}
                  </span>
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-white p-3 rounded-2xl shadow-md shrink-0">
                <QRCodeSVG
                  value={`PUSKESMAS_TICKET:${ticket.ticketNumber}:${booking.patientName}`}
                  size={110}
                  level="M"
                />
                <p className="text-[10px] text-slate-500 text-center mt-1 font-mono font-medium">SCAN DI LOKET</p>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Urgency Level Box */}
            <div className={`p-4 rounded-2xl border ${urgencyBadge.border} ${urgencyBadge.bg} flex items-start gap-3`}>
              <Activity className={`w-5 h-5 shrink-0 mt-0.5 ${urgencyBadge.text}`} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`font-bold text-sm ${urgencyBadge.text}`}>{triage.title}</h3>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full bg-white/80 ${urgencyBadge.text}`}>
                    Skor: {triage.urgencyScore}/100
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">{triage.patientExplanation}</p>
                {triage.urgencyLevel === 'MERAH' && (
                  <div className="mt-2 text-xs font-bold text-red-800 bg-red-100 p-2 rounded-lg">
                    ⚠️ SEGERA MENUJU KE UNIT GAWAT DARURAT (IGD) PUSKESMAS! Petugas IGD telah diberitahu mengenai kedatangan Anda.
                  </div>
                )}
              </div>
            </div>

            {/* Monte Carlo Wait Time Simulation Card */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
                    MC
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Estimasi Waktu Tunggu yang Jujur</h4>
                    <p className="text-[11px] text-slate-500">Hasil 1.000 simulasi Monte Carlo</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-black text-teal-700 tracking-tight">
                    {simulation.displayRange}
                  </span>
                </div>
              </div>

              {/* Percentiles Visual */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Tipikal (Median P50)</span>
                  <p className="text-lg font-bold text-slate-800">~{simulation.p50Minutes} menit</p>
                  <p className="text-[11px] text-slate-500">Waktu tunggu paling mungkin</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Kasus Terburuk (P90)</span>
                  <p className="text-lg font-bold text-amber-700">~{simulation.p90Minutes} menit</p>
                  <p className="text-[11px] text-slate-500">90% kemungkinan di bawah ini</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 mt-3 italic leading-relaxed">
                "{simulation.honestSummary}"
              </p>
            </div>

            {/* Anti-Gravity: Invisible Waiting Room & Smart Departure */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-200">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/30">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-indigo-950">Rekomendasi Waktu Berangkat</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                      Antrean Presisi
                    </span>
                  </div>
                  <p className="text-xs text-indigo-800 mt-0.5">
                    Anda tidak perlu menunggu di ruang tunggu Puskesmas. Berangkatlah dari rumah sekitar pukul:
                  </p>
                  <div className="text-2xl font-extrabold text-indigo-900 mt-1">
                    {simulation.recommendedDepartureTime} WIB
                  </div>
                  <p className="text-[11px] text-indigo-700 mt-1">
                    (Dihitung dengan estimasi perjalanan 15 menit, agar Anda tiba persis saat giliran Anda mendekati panggilan).
                  </p>
                </div>
              </div>
            </div>

            {/* Detail Kunjungan Pasien */}
            <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-2">
              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-2 text-slate-500">
                  <User className="w-4 h-4 text-slate-400" /> Nama Pasien
                </span>
                <span className="font-semibold text-slate-800">{booking.patientName}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-2 text-slate-500">
                  <MapPin className="w-4 h-4 text-slate-400" /> Faskes Tujuan
                </span>
                <span className="font-semibold text-slate-800">{puskesmas.name}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-2 text-slate-500">
                  <Calendar className="w-4 h-4 text-slate-400" /> Tanggal Kunjungan
                </span>
                <span className="font-semibold text-slate-800">{booking.bookingDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all"
          >
            Pantau di Dashboard Antrean <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/booking"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50"
          >
            Daftarkan Pasien Lain
          </Link>
        </div>
      </div>
    </div>
  );
}
