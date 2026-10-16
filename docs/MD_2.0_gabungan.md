# PuskesmasPintar + Simulasi Waktu Tunggu

Panduan singkat untuk tim · Hackathon JOINTS UGM 2026 · Subtema Healthcare (Puskesmas dan Klinik: Antrean dan Administrasi)

## Ringkasan

Kita tetap membangun **PuskesmasPintar**: pasien booking slot, mengisi gejala, lalu mendapat pre-triase. Satu hal kita tambahkan: **estimasi waktu tunggu yang jujur**, berupa rentang (misalnya "sekitar 50 sampai 75 menit"), bukan satu angka. Rentang itu dihasilkan oleh simulasi sederhana (Monte Carlo). Dari simulasi yang sama, kepala puskesmas bisa mencoba skenario "bagaimana kalau" untuk melihat dampak perubahan jadwal atau loket.

Ide ini tidak menambah produk baru. Ia hanya **mengganti satu fungsi** (estimasi waktu) dengan versi yang lebih cerdas, dan membuka satu panel tambahan untuk manajer.

## Masalah yang kita jawab

- Pasien datang tanpa tahu berapa lama harus menunggu, sehingga antrean menumpuk di waktu yang sama.
- Petugas mengurus administrasi manual dan tidak punya gambaran siapa yang paling mendesak.
- Pengelola puskesmas mengatur jadwal dan loket berdasarkan perkiraan, tanpa cara mudah untuk mencoba skenario.

## Dua ide yang digabung

**Ide 1: PuskesmasPintar (sudah ada di README).** Booking time-slot, checklist gejala, pre-triase (aturan + penjelasan LLM), dashboard petugas yang terurut berdasarkan urgensi dan waktu kedatangan.

**Ide 2: Simulator waktu tunggu.** Model sederhana yang mensimulasikan banyak kemungkinan "hari ini" di puskesmas, dengan jumlah pasien dan lama layanan yang tidak pasti, lalu melaporkan rentang hasilnya.

**Titik temunya:** di README, estimasi waktu tunggu dihitung dari jumlah antrean dikali rata-rata waktu layanan. Itu cepat dibuat, tetapi rata-rata menyembunyikan ketidakpastian. Simulasi mengisi celah itu.

## Cara kerja gabungannya

**Untuk pasien**

1. Pilih puskesmas dan slot waktu.
2. Isi checklist gejala.
3. Lihat hasil pre-triase dan penjelasannya.
4. Lihat estimasi waktu tunggu dalam bentuk rentang, plus nomor antrean atau QR.

**Untuk petugas**

- Dashboard antrean realtime, terurut berdasarkan urgensi lalu waktu kedatangan.
- Pasien walk-in (tanpa booking) bisa dimasukkan manual, jadi dashboard tidak hanya melayani yang daftar online.
- Ringkasan pasien untuk mempercepat administrasi di loket.

**Untuk kepala puskesmas (modul tambahan)**

- Panel "bagaimana kalau": ubah jumlah loket, sebaran slot booking, atau lama layanan, lalu lihat perubahan waktu tunggu (rata-rata dan kasus terburuk 90%).

## Bagaimana simulasinya bekerja (versi sederhana)

Bayangkan kita menjalankan hari yang sama 1.000 kali. Setiap kali, jumlah pasien yang datang dan lama layanan tiap pasien sedikit berbeda, mengikuti pola yang masuk akal (misalnya lama layanan 4 sampai 12 menit, paling sering sekitar 7). Setelah 1.000 percobaan, kita punya sebaran waktu tunggu. Dari situ kita ambil dua angka:

- **Tipikal:** setengah dari percobaan menunggu kurang dari ini.
- **Kasus buruk (P90):** 9 dari 10 percobaan menunggu lebih singkat dari ini.

Ilustrasi (angka contoh, bukan data nyata): 8 pasien di depan, 1 loket aktif, hasil simulasi "sekitar satu jam, rentang 50 sampai 75 menit". Pasien lebih terbantu dengan rentang yang jujur daripada angka tunggal yang sering meleset.

Catatan teknis: logikanya cukup berupa pengambilan sampel acak dan penjumlahan, jadi bisa ditulis langsung di TypeScript sebagai Supabase Function (`estimasi-waktu`) tanpa perlu server Python.

## Apa bedanya dengan aplikasi antrean yang sudah ada?

Antrean online lewat Mobile JKN sudah memungkinkan peserta mengambil nomor di puskesmas dan klinik yang terdaftar. Kita tidak bersaing di fungsi "ambil nomor". Pembeda kita:

1. **Pre-triase**, sehingga yang mendesak didahulukan dan petugas punya konteks sebelum pasien tiba.
2. **Estimasi rentang yang jujur**, bukan nomor antrean saja.
3. **Sisi manajer**, yaitu panel skenario untuk mengatur jadwal dan loket.
4. **Dashboard petugas yang menampung walk-in**, karena masalah nyata sering ada di adopsi dan alur kerja petugas, bukan hanya di aplikasi pasien.

## Cakupan: apa yang wajib dan apa yang opsional

| Tingkat | Isi | Status |
| --- | --- | --- |
| 1. Inti | Booking, gejala, pre-triase, dashboard petugas, nomor antrean | **Wajib** |
| 2. Estimasi cerdas | Estimasi waktu tunggu berupa rentang (simulasi) di halaman hasil | Dikerjakan setelah Tingkat 1 jalan |
| 3. Panel manajer | Skenario "bagaimana kalau" untuk kepala puskesmas | Opsional, kalau waktu cukup |
| 4. Roadmap | Integrasi data nyata puskesmas, notifikasi, multi-puskesmas | Cukup disebut di pitch |

Aturan sederhananya: **jangan mulai Tingkat 2 sebelum Tingkat 1 bisa didemokan dari awal sampai akhir.**

## Dampak ke pembagian tugas

Tidak ada peran baru. Perubahannya kecil:

- **Person A (Backend dan AI):** tambah fungsi `estimasi-waktu` berbasis simulasi (mengganti rumus rata-rata), dan sediakan endpoint hasil rentang.
- **Person B (Frontend):** tampilkan rentang waktu di halaman hasil, dan (opsional) satu halaman panel manajer dengan slider.
- **Person C (Produk dan cerita):** tambahkan poin pembeda di pitch dan demo, serta siapkan asumsi data (lama layanan, jam sibuk) beserta sumbernya atau label "asumsi".

## Risiko dan cara mengatasinya

| Risiko | Cara mengatasi |
| --- | --- |
| Lingkup terlalu besar untuk tiga orang | Patuhi tingkat di atas. Tingkat 3 boleh dikorbankan. |
| Triase dianggap diagnosis | Aturan sebagai penentu utama, LLM hanya menjelaskan, disclaimer di setiap hasil, dan acuan triase diverifikasi ke tenaga kesehatan. Catatan: Manchester Triage System awalnya dirancang untuk unit gawat darurat, jadi kecocokannya untuk puskesmas perlu dicek. |
| Data nyata tidak tersedia | Gunakan asumsi yang diberi label jelas dan jangan klaim akurasi. Tunjukkan bahwa parameter bisa disesuaikan dengan data puskesmas. |
| Juri bertanya "apa bedanya dengan Mobile JKN?" | Siapkan jawaban dari bagian pembeda di atas. |
| Privasi data pasien | Enkripsi, pembatasan akses petugas, dan data minimum. Sebut ini sebagai nilai tambah di pitch. |

## Poin untuk pitch dan demo

1. **Masalah:** antrean tanpa kepastian dan administrasi manual.
2. **Solusi:** booking, pre-triase, dan estimasi waktu yang jujur.
3. **Demo satu cerita:** pasien booking dan mengisi gejala, melihat hasil dan rentang waktu, petugas melihat antrean berurutan, lalu (jika ada) kepala puskesmas mencoba satu skenario.
4. **Cara kerja AI dan simulasi:** aturan yang bisa dijelaskan, LLM hanya menjelaskan, simulasi yang transparan.
5. **Pembeda:** triase, rentang waktu, sisi manajer, dan dukungan walk-in.
6. **Roadmap:** integrasi dengan sistem yang sudah dipakai puskesmas.

## Yang perlu kita sepakati bersama

- Apakah kita menjalankan gabungan ini, atau tetap hanya PuskesmasPintar versi awal?
- Berapa sisa waktu sampai deadline, dan apakah Tingkat 2 realistis?
- Siapa yang menyiapkan asumsi data untuk simulasi (lama layanan, jam sibuk)?
- Apa acuan triase yang kita pakai, dan siapa yang bisa memverifikasinya ke tenaga kesehatan?
