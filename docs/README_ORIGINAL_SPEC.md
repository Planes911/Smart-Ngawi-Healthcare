# PuskesmasPintar

Sistem Antrean Virtual & Triase Mandiri untuk Puskesmas dan Klinik.
Proyek ini dikembangkan untuk **Hackathon JOINTS UGM 2026** — Subtema Healthcare (Puskesmas & Klinik: Antrean & Administrasi).

Platform ini memungkinkan pasien melakukan pendaftaran berbasis *time-slot booking* dan pengisian gejala secara mandiri sebelum tiba di lokasi, dilengkapi estimasi waktu tunggu secara real-time, pre-triase berbasis kecerdasan buatan, serta ringkasan kunjungan digital untuk mempercepat proses administrasi di loket.

---

## Daftar Isi

1. [Deskripsi Singkat](#deskripsi-singkat)
2. [Tech Stack](#tech-stack)
3. [Struktur Direktori](#struktur-direktori)
4. [Pembagian Tugas Tim](#pembagian-tugas-tim)
5. [Git Workflow](#git-workflow)
6. [Standar Penulisan Kode](#standar-penulisan-kode)
7. [Setup Proyek](#setup-proyek)

---

## Deskripsi Singkat

PuskesmasPintar terdiri atas tiga alur utama:

- **Alur Pasien** — pendaftaran kunjungan, pengisian checklist gejala, dan melihat hasil pre-triase beserta estimasi waktu tunggu.
- **Alur Petugas** — dashboard antrean real-time yang terurut berdasarkan tingkat urgensi dan waktu kedatangan, lengkap dengan ringkasan data pasien.
- **Mesin Triase** — kombinasi logika berbasis aturan (*rule-based scoring*) dan Large Language Model (LLM) untuk memberikan skor urgensi beserta penjelasannya. Sistem ini bersifat sebagai alat bantu pra-triase, bukan pengganti diagnosis tenaga medis.

---

## Tech Stack

| Komponen | Teknologi |
|---|---|
| Frontend | Next.js + Tailwind CSS |
| Backend & Database | Supabase (PostgreSQL, Auth, Realtime) |
| AI Pre-Triase | API LLM (Claude/GPT/Gemini) dengan structured output |
| Hosting | Vercel (frontend), Supabase Cloud (backend) |
| Lain-lain | qrcode.react (nomor antrean/QR code) |

---

## Struktur Direktori

```
puskesmaspintar/
├── README.md
├── .env.example
├── .gitignore
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (pasien)/
│   │   │   │   ├── booking/
│   │   │   │   ├── gejala/
│   │   │   │   └── konfirmasi/
│   │   │   ├── (petugas)/
│   │   │   │   └── dashboard/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── booking/
│   │   │   └── dashboard/
│   │   ├── lib/
│   │   │   ├── supabase-client.ts
│   │   │   └── utils.ts
│   │   ├── hooks/
│   │   └── types/
│   └── package.json
│
├── backend/
│   ├── supabase/
│   │   ├── migrations/
│   │   └── schema.sql
│   ├── functions/
│   │   ├── triase-score/
│   │   └── estimasi-waktu/
│   └── prompts/
│       └── pre-triase-prompt.md
│
└── docs/
    ├── wireframe/
    ├── pitch-deck/
    └── video-demo/
```

Catatan: struktur di atas adalah acuan awal. Jika tim memutuskan menggunakan Next.js full-stack (API routes di dalam folder `frontend/`), folder `backend/` cukup berisi skema database, Supabase Functions, dan prompt AI saja.

---

## Pembagian Tugas Tim

### Person A — Backend & AI Engineer

**Tanggung jawab utama:** memastikan data tersimpan dengan benar, logika triase berjalan akurat, dan seluruh API dapat diakses oleh frontend.

Daftar tugas:

- [ ] Merancang dan membuat skema database di Supabase (tabel `patients`, `bookings`, `symptoms`, `queue`)
- [ ] Membuat API/endpoint untuk membuat booking baru
- [ ] Membuat API/endpoint untuk menyimpan jawaban checklist gejala
- [ ] Membangun logika *rule-based triase* (pemberian skor urgensi berdasarkan bobot gejala, mengacu pada protokol triase sederhana seperti Manchester Triage System)
- [ ] Merancang prompt dan mengintegrasikan API LLM untuk menghasilkan penjelasan skor urgensi (format output terstruktur/JSON)
- [ ] Menambahkan disclaimer pada output AI bahwa hasil bersifat pra-triase, bukan diagnosis medis
- [ ] Mengimplementasikan logika estimasi waktu tunggu (berdasarkan jumlah antrean dan rata-rata waktu layanan)
- [ ] Mengaktifkan Supabase Realtime untuk fitur antrean yang diperbarui secara langsung
- [ ] Melakukan pengujian seluruh endpoint secara mandiri sebelum integrasi dengan frontend
- [ ] Menulis dokumentasi API singkat (nama endpoint, parameter, contoh response) di folder `backend/`
- [ ] Mendampingi proses integrasi API dengan frontend

### Person B — Frontend Developer

**Tanggung jawab utama:** membangun seluruh antarmuka yang dapat digunakan pasien dan petugas, serta menghubungkannya dengan backend.

Daftar tugas:

- [ ] Melakukan setup proyek Next.js dan konfigurasi Tailwind CSS
- [ ] Melakukan deployment awal ke Vercel agar tautan demo aktif sejak awal pengerjaan
- [ ] Membangun halaman pemilihan klinik dan time-slot booking
- [ ] Membangun halaman formulir checklist gejala
- [ ] Membangun halaman hasil pre-triase (skor urgensi beserta penjelasan)
- [ ] Membangun halaman konfirmasi booking lengkap dengan nomor antrean/QR code
- [ ] Membangun dashboard petugas: daftar antrean real-time terurut berdasarkan urgensi dan waktu kedatangan
- [ ] Menampilkan ringkasan data pasien pada dashboard petugas (riwayat kunjungan terakhir)
- [ ] Menghubungkan seluruh halaman dengan API dan database dari Person A (menggantikan data sementara/dummy)
- [ ] Memastikan tampilan responsif dan dapat diakses dengan jelas pada perangkat yang akan digunakan saat demo
- [ ] Melakukan pengujian alur aplikasi secara menyeluruh (dari sisi pasien hingga petugas)

### Person C — Product, Design & Storytelling Lead

**Tanggung jawab utama:** memastikan ide dan hasil kerja tim dapat dikomunikasikan dengan jelas dan meyakinkan kepada dewan juri.

Daftar tugas:

- [ ] Membuat wireframe sebagai acuan desain antarmuka untuk Person B
- [ ] Melakukan riset data pendukung (jumlah Puskesmas/klinik, data terkait antrean kesehatan) untuk kebutuhan materi presentasi
- [ ] Menyusun model bisnis (sumber pendapatan, target pengguna, skema kerja sama dengan Dinas Kesehatan/Puskesmas)
- [ ] Menyusun kerangka isi pitch deck (poin-poin tiap slide): Problem, Solution, Product Demo, Cara Kerja AI, Market Size, Business Model, Roadmap, Tim
- [ ] Mendesain pitch deck dalam bentuk visual (slide presentasi) dan mengekspornya ke format PDF
- [ ] Menulis naskah/skrip untuk video demo (durasi maksimal 2 menit)
- [ ] Mengoordinasikan proses rekaman video demo bersama Person A dan Person B
- [ ] Melakukan proses editing video demo
- [ ] Mengunggah video demo ke YouTube dengan pengaturan publik (public) dan memastikan tautan dapat diakses
- [ ] Menyusun dokumen proposal ringkas (jika waktu memungkinkan, karena sifatnya opsional)
- [ ] Menulis bagian deskripsi proyek pada README dan dokumentasi pendukung lainnya

### Tugas Bersama (Dilakukan oleh Seluruh Anggota)

- [ ] Menyepakati skema data dan kontrak API sebelum masing-masing mulai bekerja secara terpisah
- [ ] Melakukan code review terhadap perubahan yang akan digabungkan ke branch utama
- [ ] Melakukan pengujian end-to-end terhadap produk sebelum pengumpulan
- [ ] Memastikan seluruh berkas wajib (video, source code, pitch deck, prototype) telah lengkap dan sesuai ketentuan sebelum submit

---

## Git Workflow

Tim menggunakan satu repository bersama dengan alur kerja berbasis branch, agar pekerjaan masing-masing anggota dapat berjalan secara paralel tanpa saling menimpa.

### Struktur Branch

- `main` — berisi kode yang sudah stabil dan teruji, menjadi acuan versi final
- `backend` — branch kerja Person A
- `frontend` — branch kerja Person B
- `docs` — branch kerja Person C (wireframe, pitch deck, naskah video, dokumentasi)

### Alur Kerja

1. Setiap anggota bekerja pada branch masing-masing sesuai peran.
2. Lakukan commit secara berkala dengan pesan yang jelas, menggunakan format berikut:

   ```
   feat: menambahkan endpoint booking
   fix: memperbaiki perhitungan skor urgensi
   style: merapikan tampilan dashboard petugas
   docs: memperbarui README
   ```

3. Sebelum melakukan merge ke `main`, pastikan terlebih dahulu:
   - Kode telah diuji dan berjalan tanpa error
   - Tidak ada data sensitif (API key, kredensial) yang ikut ter-commit
4. Lakukan merge ke `main` secara berkala (bukan ditumpuk di akhir pengerjaan) agar konflik dapat terdeteksi lebih awal.
5. Jika terjadi konflik, selesaikan bersama anggota terkait sebelum melanjutkan pekerjaan lain.
6. Simpan seluruh API key dan kredensial pada berkas `.env` lokal, dan pastikan berkas tersebut terdaftar dalam `.gitignore`. Gunakan `.env.example` sebagai acuan nama variabel tanpa menyertakan nilai aslinya.

---

## Standar Penulisan Kode

- Gunakan penamaan variabel dan fungsi yang deskriptif (hindari singkatan yang ambigu)
- Pisahkan logika (hooks, utils) dari tampilan (components) pada bagian frontend
- Tambahkan komentar singkat pada bagian logika yang kompleks, khususnya pada fungsi triase
- Hindari hardcode nilai konfigurasi (gunakan environment variable)

---

## Setup Proyek

```bash
# Clone repository
git clone <url-repository>
cd puskesmaspintar

# Instalasi dependensi frontend
cd frontend
npm install

# Salin berkas environment variable
cp .env.example .env.local
# Isi .env.local dengan kredensial Supabase dan API key LLM

# Menjalankan proyek secara lokal
npm run dev
```

Konfigurasi database dan Supabase Functions dapat ditemukan pada folder `backend/supabase/`.

---

## Tim

| Nama | Peran |
|---|---|
| [Nama Person A] | Backend & AI Engineer |
| [Nama Person B] | Frontend Developer |
| [Nama Person C] | Product, Design & Storytelling Lead |

**Kompetisi:** Hackathon JOINTS UGM 2026 — Subtema Healthcare
