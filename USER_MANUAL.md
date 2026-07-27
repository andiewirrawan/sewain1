# USER MANUAL - APLIKASI SEWAIN

Selamat datang di Panduan Penggunaan Aplikasi **SEWAIN**. Panduan ini disusun untuk membantu Anda memahami seluruh fitur dan alur kerja aplikasi dalam mengelola penyewaan properti (Kios, Stand, Ruko, dll) secara profesional, transparan, dan efisien.

---

## 1. Ringkasan Aplikasi
**SEWAIN** adalah sistem manajemen penyewaan properti yang berfokus pada kemudahan pencatatan data Master, Kontrak, Piutang (Tagihan), dan Pembayaran. Aplikasi ini dilengkapi dengan sistem alokasi pembayaran otomatis (FIFO) dan fitur pengingat melalui WhatsApp.

### Keunggulan Utama:
- **FIFO (First In First Out)**: Pembayaran akan otomatis melunasi tagihan yang paling lama terlebih dahulu.
- **Generate Otomatis**: Tagihan bulanan dibuat secara massal untuk semua kontrak aktif.
- **Audit Log**: Setiap aktivitas penting (tambah/edit/hapus) tercatat untuk keamanan data.
- **Master Promo**: Fleksibilitas dalam memberikan diskon nominal atau persentase ke penyewa tertentu.

---

## 2. Login
Akses aplikasi melalui halaman login yang aman.

- **Fungsi**: Verifikasi identitas untuk masuk ke sistem.
- **Langkah Penggunaan**:
  1. Masukkan **Email** yang sudah terdaftar.
  2. Masukkan **Password**.
  3. Klik tombol **Login**.
- **Catatan Penting**: Sesi login akan disimpan. Gunakan tombol **Logout** di sidebar untuk keluar demi keamanan data.

---

## 3. Dashboard
Halaman utama yang memberikan gambaran cepat kondisi bisnis Anda.

- **Fungsi Menu**: Melihat ringkasan data operasional dan keuangan secara real-time.
- **Siapa yang boleh akses**: Owner, Admin.
- **Informasi yang Ditampilkan**:
  - **Statistik Utama**: Total Unit, Unit Terisi, Unit Kosong, Penyewa Aktif, dan Kontrak Aktif.
  - **Keuangan**: Total Piutang (Tagihan yang belum lunas), Pendapatan Bulan Ini, dan Pendapatan Tahun Ini.
  - **Grafik Occupancy**: Persentase keterisian unit berdasarkan kategori.
  - **Grafik Aging Piutang**: Analisis keterlambatan pembayaran dalam rentang hari.
  - **Belum Bayar Bulan Ini**: Daftar penyewa yang belum melunasi tagihan periode berjalan (dilengkapi tombol Chat WhatsApp).
  - **Jatuh Tempo Minggu Ini**: Daftar kontrak yang akan jatuh tempo dalam 7 hari ke depan.

---

## 4. Master Unit
Tempat mengelola data unit properti yang akan disewakan.

- **Fungsi Menu**: Menambah, mengubah, dan melihat daftar unit properti.
- **Siapa yang boleh akses**: Owner, Admin, Kasir.
- **Langkah Penggunaan**:
  1. Klik menu **Master Unit**.
  2. Klik **Tambah Unit** untuk mendaftarkan unit baru.
  3. Masukkan **Kode Unit** (misal: KS-001), **Kategori**, **Jenis Unit**, dan **Tarif Sewa Dasar**.
- **Arti Field Penting**:
  - **Kode Unit**: Identitas unik unit (tidak boleh sama).
  - **Harga Sewa**: Tarif dasar sewa unit per bulan.
  - **Status Unit**: Menunjukkan apakah unit sedang 'Kosong', 'Terisi', atau 'Renovasi'.

---

## 5. Master Penyewa
Tempat mengelola database penyewa.

- **Fungsi Menu**: Mencatat identitas lengkap penyewa.
- **Siapa yang boleh akses**: Owner, Admin, Kasir.
- **Langkah Penggunaan**:
  1. Klik menu **Master Penyewa**.
  2. Klik **Tambah Penyewa**.
  3. Isi form: Nama, NIK (KTP), Alamat, WhatsApp, Kontak Darurat, dan Jenis Usaha.
- **Validasi Penting**: Nomor WhatsApp harus valid (dimulai dengan 08 atau 62) agar fitur pengingat tagihan berfungsi.
- **Saldo Titipan**: Menampilkan saldo sisa (deposit) penyewa yang bisa digunakan untuk melunasi tagihan otomatis di masa depan.

---

## 6. Master Promo (Khusus Owner)
Fitur untuk mengatur program diskon.

- **Fungsi Menu**: Membuat diskon yang bisa diterapkan secara otomatis pada tagihan.
- **Siapa yang boleh akses**: Owner.
- **Langkah Penggunaan**:
  1. Masuk ke menu **Pengaturan** > **Promo**.
  2. Klik **Tambah Promo**.
  3. Pilih **Jenis Diskon** (Persen atau Nominal).
  4. Tentukan **Masa Berlaku** (Tanggal Mulai & Selesai).
  5. Pilih **Penyewa** mana saja yang berhak mendapatkan promo ini.
- **Arti Tombol/Field**:
  - **Prioritas**: Jika penyewa memiliki lebih dari satu promo aktif, promo dengan angka prioritas tertinggi akan digunakan.
  - **Status**: Hanya promo dengan status 'Aktif' yang akan memotong nominal tagihan saat proses generate.

---

## 7. Kontrak
Jantung dari aplikasi, menghubungkan Penyewa dengan Unit.

- **Fungsi Menu**: Membuat perjanjian sewa resmi dalam sistem.
- **Siapa yang boleh akses**: Owner, Admin, Kasir.
- **Langkah Penggunaan**:
  1. Klik menu **Kontrak**.
  2. Klik **Buat Kontrak**.
  3. Pilih **Unit** yang berstatus 'Kosong'.
  4. Pilih **Penyewa**.
  5. Isi **Tanggal Masuk** dan **Tanggal Jatuh Tempo** (angka 1-31, menunjukkan tanggal berapa tagihan harus lunas setiap bulannya).
- **Catatan Penting**: Setelah kontrak dibuat, status unit otomatis berubah menjadi 'Terisi' dan unit tersebut tidak bisa disewakan ke orang lain hingga kontrak berakhir atau dibatalkan.

---

## 8. Piutang (Tagihan)
Manajemen penagihan bulanan kepada penyewa.

- **Fungsi Menu**: Membuat dan memantau status tagihan sewa.
- **Siapa yang boleh akses**: Owner, Admin, Kasir.
- **Proses Generate Piutang**:
  1. Klik tombol **Generate Tagihan**.
  2. Pilih **Bulan** dan **Tahun** periode tagihan.
  3. Masukkan **Batas Jatuh Tempo** untuk periode tersebut.
  4. Klik **Generate Sekarang**. Sistem akan membuatkan tagihan untuk semua kontrak yang masih aktif.
- **Kirim WhatsApp**: Klik ikon WhatsApp pada daftar tagihan untuk mengirimkan rincian kekurangan pembayaran secara otomatis ke nomor penyewa.

---

## 9. Pembayaran (FIFO)
Proses pelunasan tagihan oleh penyewa.

- **Fungsi Menu**: Mencatat uang masuk dan mengalokasikannya ke tagihan.
- **Siapa yang boleh akses**: Owner, Admin, Kasir.
- **Cara Kerja FIFO**:
  - Aplikasi akan mencari tagihan tertua milik penyewa tersebut.
  - Uang pembayaran akan dialokasikan untuk melunasi tagihan tertua terlebih dahulu.
  - Jika ada sisa uang, akan dialokasikan ke tagihan berikutnya, dan seterusnya.
  - Jika masih ada sisa setelah semua tagihan lunas, sisa uang masuk ke **Saldo Titipan (Deposit)** penyewa.
- **Langkah Penggunaan**:
  1. Klik menu **Pembayaran** > **Tambah Pembayaran**.
  2. Pilih **Penyewa**. Daftar tagihan tertunggak akan muncul di sisi kanan.
  3. Masukkan **Nominal Bayar** dan **Metode Pembayaran** (Tunai/Transfer/Debit/QRIS).
  4. Klik **Konfirmasi Pembayaran**.

---

## 10. Laporan
Analisis mendalam mengenai data operasional.

- **Fungsi Menu**: Melihat dan mengekspor data laporan ke format Excel.
- **Siapa yang boleh akses**: Owner, Admin, Kasir.
- **Jenis Laporan Tersedia**:
  - **Occupancy**: Keterisian unit.
  - **Pendapatan**: Uang masuk berdasarkan periode bayar.
  - **Tunggakan**: Daftar penyewa yang memiliki sisa hutang.
  - **Pembayaran**: Log rincian setiap transaksi pembayaran.
  - **Penyewa Aktif**: Daftar penyewa yang masih memiliki kontrak berjalan.
  - **Riwayat Penyewa**: Data historis penyewa yang sudah keluar.
  - **Promo & Diskon**: Analisis penggunaan promo.

---

## 11. Pengaturan (Khusus Owner)
Konfigurasi sistem tingkat lanjut.

- **Fungsi Menu**: Mengelola tarif dasar, hak akses pengguna, dan keamanan database.
- **Audit Log**: Melihat riwayat aktivitas setiap pengguna (siapa mengubah apa, kapan, dan data apa yang berubah).
- **Tarif Sewa**: Mengubah harga dasar sewa unit tanpa harus masuk ke detail unit satu per satu.
- **Kelola Pengguna**: Menambah akun Admin baru, serta mengatur status aktif/nonaktif akun.

---

## 12. Backup dan Reset (Khusus Owner)
Fitur pemeliharaan data.

- **Backup**: Klik **Unduh Backup JSON** untuk menyimpan seluruh data aplikasi ke komputer Anda sebagai cadangan. Sangat disarankan dilakukan secara berkala.
- **Reset**: Menghapus seluruh data (Master, Kontrak, Pembayaran) untuk memulai dari awal.
- **Keamanan**: Reset membutuhkan konfirmasi teks khusus ("HAPUS SEMUA DATA") untuk mencegah ketidaksengajaan.

---

## 13. FAQ (Tanya Jawab)

**Q: Bagaimana jika penyewa membayar lebih dari jumlah tagihannya?**
A: Sisa uang tersebut akan disimpan di **Saldo Titipan**. Saat tagihan bulan depan dibuat (Generate), sistem akan otomatis memotong saldo titipan tersebut untuk membayar tagihan baru.

**Q: Apa yang terjadi jika saya salah input nominal pembayaran?**
A: Harap hubungi Owner untuk melakukan penyesuaian data atau melakukan reset data jika diperlukan.

**Q: Apakah satu penyewa bisa memiliki lebih dari satu unit?**
A: Bisa. Anda cukup membuat Kontrak baru untuk unit berbeda dengan memilih penyewa yang sama.

---

## 14. Troubleshooting (Masalah & Solusi)

- **Pesan Error: "Format periode harus MM-YYYY"**
  - Pastikan input periode saat generate tagihan sudah benar (contoh: 08-2026).
- **Pesan Error: "Unauthorized"**
  - Sesi login Anda telah habis. Silakan Logout dan Login kembali.
- **Pesan Error: "Gagal memuat data"**
  - Periksa koneksi internet atau coba refresh halaman browser Anda.

---

## 15. Lampiran Istilah

- **FIFO**: Metode pelunasan hutang paling lama terlebih dahulu.
- **Piutang**: Jumlah uang yang seharusnya diterima perusahaan (tagihan yang belum lunas).
- **Generate**: Proses pembuatan data secara otomatis oleh sistem.
- **Audit Log**: Catatan jejak digital setiap aktivitas pengguna di aplikasi.
- **Owner**: Level akses tertinggi (Pemilik) yang memiliki kontrol penuh atas sistem.
- **Admin**: Level akses operasional yang memiliki izin terbatas dibanding Owner.
