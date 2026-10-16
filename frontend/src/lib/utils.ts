import { UrgencyLevel, QueueStatus } from '@/types';

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatTimeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  return `${diffHours} jam lalu`;
}

export function getUrgencyBadge(level: UrgencyLevel): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  switch (level) {
    case 'MERAH':
      return {
        bg: 'bg-red-50 text-red-700',
        text: 'text-red-700',
        border: 'border-red-200',
        label: 'MERAH · Gawat Darurat',
      };
    case 'KUNING':
      return {
        bg: 'bg-amber-50 text-amber-700',
        text: 'text-amber-700',
        border: 'border-amber-200',
        label: 'KUNING · Prioritas Mendesak',
      };
    case 'HIJAU':
    default:
      return {
        bg: 'bg-emerald-50 text-emerald-700',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        label: 'HIJAU · Standar Reguler',
      };
  }
}

export function getStatusBadge(status: QueueStatus): {
  bg: string;
  text: string;
  label: string;
} {
  switch (status) {
    case 'EXAMINING':
      return { bg: 'bg-blue-100 text-blue-800 animate-pulse', text: 'text-blue-800', label: 'Sedang Diperiksa' };
    case 'CALLED':
      return { bg: 'bg-purple-100 text-purple-800 font-semibold', text: 'text-purple-800', label: 'Dipanggil' };
    case 'COMPLETED':
      return { bg: 'bg-gray-100 text-gray-700', text: 'text-gray-700', label: 'Selesai' };
    case 'CANCELLED':
      return { bg: 'bg-rose-100 text-rose-700', text: 'text-rose-700', label: 'Dibatalkan' };
    case 'REROUTED':
      return { bg: 'bg-teal-100 text-teal-800', text: 'text-teal-800', label: 'Dialihkan ke Bidan' };
    case 'WAITING':
    default:
      return { bg: 'bg-amber-100 text-amber-800', text: 'text-amber-800', label: 'Menunggu' };
  }
}
