import Link from 'next/link';
import { Calendar, Users, Sliders, ArrowRight, ShieldCheck, Sparkles, Activity, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-teal-100/60 to-transparent blur-3xl -z-10 pointer-events-none" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Hackathon JOINTS UGM 2026 · Solusi Antrean & Pre-Triase Cerdas</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
          Layanan Puskesmas Tanpa Ketidakpastian,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500">
            Didukung Simulasi Monte Carlo
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Menggantikan nomor antrean kaku dengan <strong>rentang estimasi waktu tunggu yang jujur</strong> (P50 - P90),
          pre-triase klinis mandiri, dan panel skenario kapasitas untuk Kepala Puskesmas di Kabupaten Ngawi.
        </p>

        {/* Action Cards Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-6xl mx-auto">
          {/* Card 1: Pasien */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-300 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform border border-teal-100">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded mb-2">
                Alur Pasien
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Booking & Pre-Triase Mandiri</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Pilih slot Puskesmas, isi checklist gejala, dapatkan skor urgensi, dan ketahui estimasi waktu tunggu serta jam berangkat optimal dari rumah.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link
                href="/booking"
                className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 group-hover:text-teal-700"
              >
                Mulai Pendaftaran Pasien <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 2: Petugas */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-300 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform border border-blue-100">
                <Users className="w-6 h-6" />
              </div>
              <div className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-800 rounded mb-2">
                Alur Petugas & Dokter
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Dashboard Antrean Real-time</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Antrean terurut dinamis menurut urgensi (Merah/Kuning/Hijau), integrasi pendaftaran walk-in, dan draft ringkasan SOAP untuk percepatan konsultasi dokter.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 group-hover:text-blue-700"
              >
                Buka Dashboard Petugas <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 3: Kepala Puskesmas */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-300 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform border border-purple-100">
                <Sliders className="w-6 h-6" />
              </div>
              <div className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-purple-100 text-purple-800 rounded mb-2">
                Sisi Manajer
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Simulasi Kapasitas & Beban Layanan</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Simulasikan 1.000 kemungkinan hari kerja: analisis penambahan loket, variabilitas layanan, dan mitigasi penumpukan pasien poli.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link
                href="/skenario"
                className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600 group-hover:text-purple-700"
              >
                Buka Simulasi Kapasitas <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Highlights Banner */}
        <div className="mt-16 bg-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl max-w-5xl mx-auto text-left relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10 pointer-events-none">
            <Activity className="w-80 h-80 text-white" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-4 border border-teal-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>4 Pilar Pembeda dari Antrean Tradisional</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Bukan Sekadar Ambil Nomor, Tapi Tata Kelola Alur Layanan Terpadu
            </h3>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Pre-Triase Otomatis:</strong> Kasus gawat darurat (Merah) dan prioritas tinggi (Kuning) langsung dipisahkan sebelum antrean reguler.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Rentang Estimasi Jujur:</strong> Simulasi Monte Carlo menghitung variabilitas durasi periksa, memberikan P50 tipikal dan P90 terburuk.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Inklusif Walk-In:</strong> Mengakomodasi masyarakat lansia / non-gadget melalui loket input langsung pada dashboard terpusat.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Shadow Consultation:</strong> Ringkasan SOAP otomatis memangkas waktu administratif dokter sehingga periksa lebih fokus pada empati.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
