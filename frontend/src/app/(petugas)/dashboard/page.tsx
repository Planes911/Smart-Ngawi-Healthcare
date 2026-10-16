'use client';

import { useState, useEffect, useCallback } from 'react';
import { QueueTicket, QueueStatus } from '@/types';
import { getUrgencyBadge, getStatusBadge, formatTimeAgo } from '@/lib/utils';
import { PUSKESMAS_NGAWI } from '@/lib/mock-store';
import { subscribeQueueChanges } from '@/lib/realtime';
import {
  Activity,
  UserPlus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Volume2,
  RefreshCw,
  FileText,
  X,
  Loader2,
} from 'lucide-react';

export default function PetugasDashboard() {
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPuskesmas, setSelectedPuskesmas] = useState<string>(PUSKESMAS_NGAWI[0].id);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<QueueTicket | null>(null);

  // Walk-in modal state
  const [isWalkInOpen, setIsWalkInOpen] = useState<boolean>(false);
  const [walkInName, setWalkInName] = useState<string>('');
  const [walkInPhone, setWalkInPhone] = useState<string>('');
  const [walkInPoly, setWalkInPoly] = useState<string>('Poli Umum');
  const [walkInComplaint, setWalkInComplaint] = useState<string>('');
  const [walkInSeverity, setWalkInSeverity] = useState<number>(2);
  const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState<boolean>(false);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch(`/api/queue?puskesmasId=${selectedPuskesmas}`);
      const data = await res.json();
      if (data.tickets) {
        setTickets(data.tickets);
      }
    } catch (err) {
      console.error('Failed to fetch queue:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPuskesmas]);

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 5000); // Polling every 5 seconds for realtime feel
    return () => clearInterval(interval);
  }, [fetchTickets]);

  // Supabase Realtime: segarkan antrean begitu ada perubahan (polling di atas jadi cadangan)
  useEffect(() => {
    return subscribeQueueChanges(() => { fetchTickets(); });
  }, [fetchTickets]);

  const handleUpdateStatus = async (ticketId: string, newStatus: QueueStatus, counter?: string) => {
    try {
      const res = await fetch('/api/queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status: newStatus, assignedCounter: counter || 'Poli 1' }),
      });
      if (res.ok) {
        await fetchTickets();
        if (selectedTicket && selectedTicket.id === ticketId) {
          const updated = tickets.find((t) => t.id === ticketId);
          if (updated) setSelectedTicket({ ...updated, status: newStatus });
        }
      }
    } catch (err) {
      console.error('Failed to update ticket status:', err);
    }
  };

  const handleAddWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName.trim()) return;

    setIsSubmittingWalkIn(true);
    try {
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puskesmasId: selectedPuskesmas,
          patientName: walkInName,
          patientPhone: walkInPhone,
          queueType: 'WALK_IN',
          polyType: walkInPoly,
          freeTextComplaint: walkInComplaint,
          severityRating: walkInSeverity,
          symptomIds: walkInSeverity >= 4 ? ['high_fever_prolonged'] : ['cough_mild'],
        }),
      });

      if (res.ok) {
        setWalkInName('');
        setWalkInPhone('');
        setWalkInComplaint('');
        setIsWalkInOpen(false);
        await fetchTickets();
      }
    } catch (err) {
      console.error('Failed to add walk-in:', err);
    } finally {
      setIsSubmittingWalkIn(false);
    }
  };

  // Filtered list
  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'WAITING') return t.status === 'WAITING';
    if (statusFilter === 'ACTIVE') return t.status === 'CALLED' || t.status === 'EXAMINING';
    if (statusFilter === 'COMPLETED') return t.status === 'COMPLETED';
    return true;
  });

  // Summary Metrics
  const totalWaiting = tickets.filter((t) => t.status === 'WAITING').length;
  const totalUrgent = tickets.filter((t) => (t.urgencyLevel === 'MERAH' || t.urgencyLevel === 'KUNING') && t.status === 'WAITING').length;
  const totalExamining = tickets.filter((t) => t.status === 'EXAMINING').length;
  const currentPusk = PUSKESMAS_NGAWI.find((p) => p.id === selectedPuskesmas) || PUSKESMAS_NGAWI[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Bar with Puskesmas Selector & Walk-In Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Antrean Petugas</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-teal-50 text-teal-700 border border-teal-200 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              Live Real-Time
            </span>
          </div>
          <div className="text-sm text-slate-500 mt-2 flex items-center flex-wrap gap-2">
            <span>Prioritas otomatis triase klinis:</span>
            <div className="inline-flex items-center gap-1 text-xs font-bold">
              <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 border border-red-200">Merah (Darurat)</span>
              <span className="text-slate-400 font-bold">→</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 border border-amber-200">Kuning (Mendesak)</span>
              <span className="text-slate-400 font-bold">→</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200">Hijau (Reguler)</span>
            </div>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">diurutkan bersama waktu kedatangan</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Selector Puskesmas */}
          <div className="relative">
            <select
              value={selectedPuskesmas}
              onChange={(e) => setSelectedPuskesmas(e.target.value)}
              className="pl-3 pr-8 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              {PUSKESMAS_NGAWI.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tombol Input Walk-In Pasien */}
          <button
            onClick={() => setIsWalkInOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-teal-600 text-white hover:bg-teal-700 shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            + Pasien Walk-In
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Menunggu Antrean</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{totalWaiting}</div>
          <p className="text-[11px] text-slate-500 mt-1">Pasien siap dipanggil</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase text-red-600">Prioritas / Darurat</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-3xl font-black text-red-600">{totalUrgent}</div>
          <p className="text-[11px] text-red-500 mt-1">Perlu didahulukan</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase text-blue-600">Sedang Diperiksa</span>
            <Stethoscope className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-blue-600">{totalExamining}</div>
          <p className="text-[11px] text-blue-500 mt-1">{currentPusk.activeCounters} loket/poli aktif</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase text-emerald-600">Kapasitas Pelayanan</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{currentPusk.avgServiceTimeMins} m</div>
          <p className="text-[11px] text-slate-500 mt-1">Target rata-rata periksa</p>
        </div>
      </div>

      {/* Main Table / Queue Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Filter Tabs */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {[
              { id: 'ALL', label: 'Semua Antrean' },
              { id: 'WAITING', label: 'Menunggu' },
              { id: 'ACTIVE', label: 'Sedang Berjalan' },
              { id: 'COMPLETED', label: 'Selesai' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchTickets}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Antrean
          </button>
        </div>

        {/* Tickets List */}
        {isLoading ? (
          <div className="p-16 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold">Tidak ada antrean dalam kategori ini.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTickets.map((t) => {
              const urgency = getUrgencyBadge(t.urgencyLevel);
              const statusBadge = getStatusBadge(t.status);

              return (
                <div
                  key={t.id}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    t.urgencyLevel === 'MERAH' && t.status === 'WAITING'
                      ? 'bg-red-50/40 hover:bg-red-50/70 border-l-4 border-l-red-500'
                      : t.status === 'EXAMINING'
                      ? 'bg-blue-50/30 hover:bg-blue-50/60'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Left: Ticket & Patient Info */}
                  <div className="flex items-start gap-4">
                    <div className="text-center shrink-0">
                      <span className="text-2xl font-black text-slate-900 tracking-tight block">
                        {t.ticketNumber}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {t.queueType}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm sm:text-base">
                          {t.patientName}
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${urgency.border} ${urgency.bg}`}>
                          {urgency.label} ({t.urgencyScore})
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusBadge.bg}`}>
                          {statusBadge.label}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                        <span>Poli: <strong>{t.polyType}</strong></span>
                        <span>·</span>
                        <span>Waktu daftar: {formatTimeAgo(t.registeredAt)}</span>
                        {t.assignedCounter && (
                          <>
                            <span>·</span>
                            <span className="text-teal-700 font-medium">Loket: {t.assignedCounter}</span>
                          </>
                        )}
                      </div>

                      {/* Wait Time Range Indicator */}
                      <div className="mt-2 text-xs text-slate-600 flex items-center gap-2">
                        <span className="font-medium text-slate-500">Estimasi Monte Carlo:</span>
                        <span className="font-bold text-teal-700">~{t.estWaitMinP50} mnt</span>
                        <span className="text-[10px] text-slate-400">(P90: ~{t.estWaitMinP90} mnt)</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* View SOAP Notes Button */}
                    <button
                      onClick={() => setSelectedTicket(t)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all"
                      title="Lihat Draft SOAP Pre-Triase"
                    >
                      <FileText className="w-3.5 h-3.5 text-teal-600" />
                      Draft Medis
                    </button>

                    {/* Status Triggers */}
                    {t.status === 'WAITING' && (
                      <button
                        onClick={() => handleUpdateStatus(t.id, 'CALLED', 'Poli 1')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
                      >
                        <Volume2 className="w-3.5 h-3.5" /> Panggil
                      </button>
                    )}

                    {t.status === 'CALLED' && (
                      <button
                        onClick={() => handleUpdateStatus(t.id, 'EXAMINING', 'Poli 1')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                      >
                        <Stethoscope className="w-3.5 h-3.5" /> Mulai Periksa
                      </button>
                    )}

                    {t.status === 'EXAMINING' && (
                      <button
                        onClick={() => handleUpdateStatus(t.id, 'COMPLETED')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                      </button>
                    )}

                    {/* Smart Offload ke Bidan Desa */}
                    {t.status === 'WAITING' && t.urgencyLevel === 'HIJAU' && (
                      <button
                        onClick={() => handleUpdateStatus(t.id, 'REROUTED')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200"
                        title="Smart Offload: Alihkan ke Jejaring Pustu / Bidan Desa Terdekat (Pemerataan Beban Layanan)"
                      >
                        Alihkan Bidan
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: AI SOAP Draft Notes for Doctor (Shadow Consultation) */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                  Shadow-Consultation · AI Clinical Draft
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  Ringkasan Pasien: {selectedTicket.patientName} ({selectedTicket.ticketNumber})
                </h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">Subjective (Keluhan Pasien):</span>
                <p className="text-slate-600 leading-relaxed">
                  {selectedTicket.soapDraft?.subjective || 'Tidak ada catatan subjektif tambahan.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200">
                <span className="font-bold text-blue-900 block mb-1">Objective (Pemeriksaan yang Diperlukan Dokter):</span>
                <p className="text-blue-800 leading-relaxed">
                  {selectedTicket.soapDraft?.objectiveNeeded || 'Pemeriksaan tanda-tanda vital lengkap.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
                <span className="font-bold text-amber-900 block mb-1">Assessment (Perkiraan Diagnosa Pre-Triase):</span>
                <p className="text-amber-800 leading-relaxed font-semibold">
                  {selectedTicket.soapDraft?.preliminaryAssessment || 'Evaluasi Rawat Jalan.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <span className="font-bold text-emerald-900 block mb-1">Plan (Rekomendasi Tindakan / Farmasi):</span>
                <p className="text-emerald-800 leading-relaxed">
                  {selectedTicket.soapDraft?.suggestedPlan || 'Terapi simptomatik dan observasi.'}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-semibold text-xs sm:text-sm hover:bg-teal-700"
              >
                Tutup Ringkasan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Input Pasien Walk-In */}
      {isWalkInOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Loket Manual</span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">Tambah Pasien Walk-In</h3>
              </div>
              <button
                onClick={() => setIsWalkInOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddWalkIn} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Pasien *</label>
                <input
                  type="text"
                  required
                  placeholder="Nama pasien yang datang langsung"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Kontak / Pendamping</label>
                <input
                  type="text"
                  placeholder="08xxxxxxxx"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Poliklinik Tujuan</label>
                <select
                  value={walkInPoly}
                  onChange={(e) => setWalkInPoly(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs sm:text-sm bg-white"
                >
                  <option value="Poli Umum">Poli Umum</option>
                  <option value="Poli Gigi">Poli Gigi</option>
                  <option value="Poli KIA / Anak">Poli KIA / Anak</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keluhan Singkat Pasien</label>
                <input
                  type="text"
                  placeholder="Misal: Demam tinggi 2 hari, lemas"
                  value={walkInComplaint}
                  onChange={(e) => setWalkInComplaint(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Penilaian Cepat Petugas (Skala 1 - 5)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={walkInSeverity}
                    onChange={(e) => setWalkInSeverity(Number(e.target.value))}
                    className="w-full accent-teal-600"
                  />
                  <span className="font-bold text-sm text-teal-700 shrink-0">Skala: {walkInSeverity}</span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsWalkInOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWalkIn}
                  className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmittingWalkIn ? 'Menyimpan...' : 'Masukkan ke Antrean'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
