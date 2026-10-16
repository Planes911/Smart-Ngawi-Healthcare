'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PUSKESMAS_NGAWI } from '@/lib/mock-store';
import { Building2, Calendar, Clock, User, Phone, CreditCard, ArrowRight, ShieldAlert } from 'lucide-react';

export default function BookingPage() {
  const router = useRouter();

  const [puskesmasId, setPuskesmasId] = useState(PUSKESMAS_NGAWI[0].id);
  const [polyType, setPolyType] = useState('Poli Umum');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('08:00 - 09:00');

  const [fullName, setFullName] = useState('');
  const [nik, setNik] = useState('');
  const [phone, setPhone] = useState('');
  const [bpjsNumber, setBpjsNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const timeSlots = [
    '08:00 - 09:00',
    '09:00 - 10:00',
    '10:00 - 11:00',
    '11:00 - 12:00',
    '13:00 - 14:00',
  ];

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !nik.trim()) {
      setErrorMsg('Harap lengkapi Nama Lengkap, NIK, dan Nomor HP.');
      return;
    }

    if (nik.length < 16) {
      setErrorMsg('Nomor NIK harus 16 digit.');
      return;
    }

    const bookingData = {
      puskesmasId,
      polyType,
      bookingDate,
      timeSlot,
      fullName,
      nik,
      phone,
      bpjsNumber,
    };

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('temp_booking_data', JSON.stringify(bookingData));
    }

    router.push('/gejala');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold text-sm flex items-center justify-center">
            1
          </div>
          <span className="font-semibold text-slate-900 text-sm">Pilih Jadwal & Faskes</span>
        </div>
        <div className="h-0.5 flex-1 mx-4 bg-slate-200" />
        <div className="flex items-center gap-2 opacity-50">
          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center">
            2
          </div>
          <span className="text-slate-600 text-sm hidden sm:inline">Pre-Triase Gejala</span>
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
          <h2 className="text-2xl font-bold text-slate-900">Pendaftaran Layanan Kesehatan</h2>
          <p className="text-sm text-slate-500 mt-1">
            Pilih fasilitas kesehatan di Kabupaten Ngawi dan isi identitas pasien untuk memulai pra-triase.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleNext} className="space-y-6">
          {/* Pilih Puskesmas */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600" />
              Puskesmas Tujuan (Kab. Ngawi)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PUSKESMAS_NGAWI.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setPuskesmasId(p.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    puskesmasId === p.id
                      ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <p className="font-semibold text-slate-900 text-sm">{p.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{p.address}</p>
                  <div className="mt-2 text-[11px] text-teal-700 font-medium">
                    {p.activeCounters} Loket Aktif · Rata-rata {p.avgServiceTimeMins} mnt/pasien
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pilih Poliklinik */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Pilihan Poliklinik</label>
            <div className="grid grid-cols-3 gap-3">
              {['Poli Umum', 'Poli Gigi', 'Poli KIA / Anak'].map((poly) => (
                <button
                  type="button"
                  key={poly}
                  onClick={() => setPolyType(poly)}
                  className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                    polyType === poly
                      ? 'border-teal-500 bg-teal-50 text-teal-700 font-semibold shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {poly}
                </button>
              ))}
            </div>
          </div>

          {/* Tanggal & Time Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                Tanggal Kunjungan
              </label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                Slot Waktu Kedatangan
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
              >
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot} WIB
                  </option>
                ))}
              </select>
            </div>
          </div>

          <hr className="border-slate-100 my-4" />

          {/* Identitas Pasien */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Data Diri Pasien</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nomor Induk Kependudukan (NIK) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  placeholder="16 digit NIK KTP"
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  Nomor WhatsApp Aktif *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="08xxxxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  Nomor Kartu BPJS (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="000xxxxxxxxxx"
                  value={bpjsNumber}
                  onChange={(e) => setBpjsNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all"
            >
              Lanjut ke Pre-Triase Gejala <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
