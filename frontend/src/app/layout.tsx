import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Navbar from '@/components/Navbar';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'PuskesmasPintar · Antrean Cerdas & Pre-Triase Monte Carlo',
  description:
    'Sistem Antrean Virtual, Pre-Triase Mandiri, dan Simulasi Waktu Tunggu Monte Carlo untuk Puskesmas Kabupaten Ngawi · Hackathon JOINTS UGM 2026',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900 min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <p className="font-medium text-slate-600">PuskesmasPintar Kabupaten Ngawi</p>
          <p className="mt-1">
            Dikembangkan untuk <span className="font-semibold text-teal-600">Hackathon JOINTS UGM 2026</span> · Subtema Healthcare
          </p>
        </footer>
      </body>
    </html>
  );
}
