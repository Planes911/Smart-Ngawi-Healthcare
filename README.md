# PuskesmasPintar · Antrean Cerdas & Pre-Triase Monte Carlo
**Hackathon JOINTS UGM 2026** — Subtema Healthcare (Puskesmas & Klinik: Antrean dan Administrasi)  
**Wilayah Implementasi Percontohan:** Kabupaten Ngawi, Jawa Timur

---

## 🎯 Ringkasan Inovasi
**PuskesmasPintar** adalah sistem tata kelola antrean virtual dan pra-triase mandiri cerdas untuk Fasilitas Kesehatan Tingkat Pertama (FKTP / Puskesmas). 

Alih-alih memberikan nomor antrean statis dan perkiraan waktu berbasis rata-rata yang sering meleset, sistem ini menghadirkan **estimasi rentang waktu tunggu yang jujur** (misalnya *"sekitar 50 sampai 75 menit"*) yang diproyeksikan melalui **Simulasi Monte Carlo (1.000 iterasi stokastik)**. Selain itu, sistem membuka **Panel Skenario (What-If)** bagi Kepala Puskesmas untuk menguji dampak penambahan loket atau perubahan alur secara real-time.

---

## 🚀 4 Pilar Inovasi "Anti-Gravity"
1. **Pre-Triase Klinis Otomatis (Adaptasi Manchester Triage System):**
   Memisahkan kasus gawat darurat (Merah/IGD), prioritas mendesak (Kuning), dan reguler (Hijau) sejak dari rumah pasien.
2. **Estimasi Waktu Tunggu yang Jujur (Monte Carlo P50 - P90):**
   Pasien mengetahui waktu tipikal (P50) serta skenario kasus terburuk (P90) berdasarkan variabilitas nyata konsultasi dokter.
3. **Rekomendasi Jam Berangkat (*Invisible Waiting Room*):**
   Pasien tidak perlu duduk berjam-jam di ruang tunggu puskesmas; sistem merekomendasikan jam berangkat optimal dari rumah.
4. **Panel Skenario Manajer & Load-Balancing Otonom:**
   Kepala Puskesmas dapat mensimulasikan bottleneck antrean dan mengalihkan kasus non-akut secara otonom ke jejaring Bidan Desa / Poskesdes.

---

## 📂 Struktur Direktori Proyek

```
Smart-Ngawi-Healthcare/
├── README.md                           # Dokumentasi komprehensif proyek
├── .env.example                        # Template konfigurasi environment variables
├── .gitignore                          # Git ignore standard Next.js & Supabase
│
├── frontend/                           # Aplikasi Next.js 14 + Tailwind CSS (Full-stack)
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (pasien)/
│   │   │   │   ├── booking/            # Form pemilihan faskes Ngawi, poli, & time slot
│   │   │   │   ├── gejala/             # Checklist keluhan, red flags, & pra-triase
│   │   │   │   └── konfirmasi/         # Tiket, QR Code, estimasi Monte Carlo, jam berangkat
│   │   │   ├── (petugas)/
│   │   │   │   └── dashboard/          # Dashboard antrean realtime, walk-in, SOAP draft
│   │   │   ├── (manajer)/
│   │   │   │   └── skenario/           # Panel What-If Monte Carlo Kepala Puskesmas
│   │   │   ├── api/
│   │   │   │   ├── booking/route.ts    # Endpoint booking & registrasi antrean
│   │   │   │   ├── triase/route.ts     # Endpoint evaluasi triase medis
│   │   │   │   ├── estimasi-waktu/     # Endpoint simulasi Monte Carlo waktu tunggu
│   │   │   │   ├── queue/route.ts      # Endpoint operasi antrean & walk-in
│   │   │   │   └── skenario/route.ts   # Endpoint simulasi skenario manajer
│   │   │   ├── layout.tsx              # Root layout & Navbar
│   │   │   └── page.tsx                # Landing portal PuskesmasPintar
│   │   ├── components/
│   │   │   └── Navbar.tsx              # Top navigation bar & indikator faskes
│   │   ├── lib/
│   │   │   ├── monte-carlo.ts          # Core algoritma simulasi Monte Carlo (Box-Muller)
│   │   │   ├── triage-rules.ts         # Protokol triase adaptasi MTS & generator SOAP
│   │   │   ├── mock-store.ts           # In-memory reactive state faskes Ngawi
│   │   │   ├── supabase-client.ts      # Jembatan koneksi Supabase & fallback offline
│   │   │   └── utils.ts                # Helper fungsi badge dan waktu
│   │   └── types/
│   │       └── index.ts                # TypeScript interface definitions
│   └── package.json
│
├── backend/                            # Standalone Database & Supabase Edge Functions
│   ├── supabase/
│   │   └── schema.sql                  # DDL PostgreSQL lengkap (tabel, enum, index, seed)
│   ├── functions/
│   │   ├── estimasi-waktu/index.ts     # Edge Function simulasi waktu tunggu Monte Carlo
│   │   └── triase-score/index.ts       # Edge Function pre-triase & SOAP notes
│   └── prompts/
│       └── pre-triase-prompt.md        # Prompt sistem LLM pra-triase terstruktur (JSON)
│
└── docs/                               # Berkas spesifikasi & persiapan hackathon
    ├── MD_2.0_gabungan.md              # Rangkuman ide gabungan & tingkat pengerjaan
    ├── README_ORIGINAL_SPEC.md         # Spesifikasi awal hackathon
    ├── pitch-deck/                     # Slide presentasi JOINTS UGM
    └── wireframe/                      # Dokumentasi alur UI/UX
```

---

## 🛠️ Tech Stack
- **Frontend & Full-stack Engine:** Next.js 14 (App Router) + TypeScript
- **Styling & UI:** Tailwind CSS + Lucide Icons + qrcode.react
- **Algoritma Stokastik:** Simulasi Monte Carlo (Box-Muller Normal Sampling & Multi-Server Queue Approximation)
- **Database / Backend:** Supabase (PostgreSQL, Realtime, Edge Functions)
- **AI / LLM Assist:** Prompt Terstruktur JSON (Claude / GPT / Gemini) dengan draft SOAP klinis

---

## ⚡ Panduan Menjalankan Proyek Secara Lokal

### 1. Masuk ke direktori frontend
```bash
cd frontend
```

### 2. Instalasi dependensi
```bash
npm install
```

### 3. Salin environment variable
```bash
cp .env.example .env.local
```
*(Catatan: Aplikasi telah dilengkapi **in-memory reactive mock store** yang langsung berfungsi saat `npm run dev` tanpa wajib memasang kredensial Supabase eksternal terlebih dahulu).*

### 4. Jalankan server lokal
```bash
npm run dev
```
Akses aplikasi melalui peramban: `http://localhost:3000`

---

## 📋 Alur Demo untuk Dewan Juri JOINTS UGM 2026

1. **Alur Pasien (`/booking` $\rightarrow$ `/gejala` $\rightarrow$ `/konfirmasi`):**
   - Pilih **Puskesmas Ngawi Purba**, Poli Umum, dan Slot Kedatangan.
   - Isi biodata dan lanjutkan ke checklist gejala.
   - Pilih keluhan (uji coba pilih *Nyeri Dada Hebat* untuk melihat respon **MERAH / IGD**, atau batuk pilek untuk **HIJAU**).
   - Di halaman konfirmasi, perhatikan **Tiket Antrean QR**, **Rentang Waktu Monte Carlo yang Jujur (P50 - P90)**, dan **Rekomendasi Jam Berangkat dari Rumah**.

2. **Alur Petugas (`/dashboard`):**
   - Perhatikan antrean otomatis tersortir berdasarkan tingkat kegawatan triase (Merah didahulukan di atas Kuning dan Hijau).
   - Klik **"Draft Medis"** untuk melihat ringkasan klinis **SOAP (Subjective, Objective, Assessment, Plan)** yang disiapkan otomatis untuk mempercepat konsultasi dokter.
   - Coba tombol **"+ Pasien Walk-In"** untuk mendaftarkan pasien langsung yang datang ke loket fisik.
   - Ubah status: *Panggil* $\rightarrow$ *Mulai Periksa* $\rightarrow$ *Selesai*.

3. **Alur Kepala Puskesmas (`/skenario`):**
   - Buka panel **What-If**. Geser slider jumlah loket (1-5), lama layanan, dan laju kedatangan pasien.
   - Amati grafik histogram distribusi probabilitas waktu tunggu setelah 1.000 iterasi.
   - Uji tombol **"Reroute Bidan Desa"** untuk melihat bagaimana desentralisasi kasus non-akut memangkas bottleneck antrean seketika.

---

## 👥 Anggota Tim & Pembagian Peran
- **Person A (Backend & AI Engineer):** Skema database Supabase, Edge Function `estimasi-waktu` Monte Carlo, Edge Function `triase-score`, & API routes.
- **Person B (Frontend Developer):** Implementasi Next.js, alur booking pasien, checklist triase, dashboard petugas real-time, & panel skenario slider.
- **Person C (Product & Storytelling Lead):** Value proposition Anti-Gravity, hook presentasi, pitch deck, & skrip video demo 2 menit.