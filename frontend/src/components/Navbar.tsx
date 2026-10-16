'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Calendar, Users, Sliders } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Beranda', icon: Activity },
    { href: '/booking', label: 'Booking Pasien', icon: Calendar },
    { href: '/dashboard', label: 'Dashboard Petugas', icon: Users },
    { href: '/skenario', label: 'Panel Skenario (What-If)', icon: Sliders },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">PuskesmasPintar</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-teal-100 text-teal-800 rounded-full border border-teal-200">
                  Kab. Ngawi
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Pre-Triase Otomatis & Simulasi Monte Carlo</p>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 font-semibold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Pill status */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sistem Aktif · JOINTS 2026</span>
          </div>
        </div>
      </div>
    </header>
  );
}
