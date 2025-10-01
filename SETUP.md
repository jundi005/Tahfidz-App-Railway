# Setup TAHFIDZ Application

## Prerequisites

1. Node.js (v18 atau lebih tinggi)
2. Google Account untuk Google Sheets
3. Akses ke Google Apps Script

## Setup Backend (Google Apps Script)

### 1. Buat Google Spreadsheet

Buat spreadsheet baru di Google Sheets dengan sheet-sheet berikut sesuai skema yang ada di dokumentasi:

- Lookups_Marhalah
- Lookups_Waktu
- Lookups_Kehadiran
- Lookups_Kelas
- Musammi
- Halaqah
- Santri
- HalaqahMembers
- AbsensiSantri
- AbsensiMusammi
- HafalanBulanan
- MurojaahBulanan
- PenambahanHafalan
- Tasks
- DashboardCache (opsional)

### 2. Deploy Google Apps Script

1. Buka Google Apps Script Editor (Extensions > Apps Script dari spreadsheet Anda)
2. Copy kode dari file `google-apps-script/Code.gs` ke editor
3. Update `SPREADSHEET_ID` dengan ID spreadsheet Anda
4. Deploy sebagai Web App:
   - Klik Deploy > New deployment
   - Pilih "Web app"
   - Execute as: "Me"
   - Who has access: "Anyone" (atau sesuai kebutuhan)
   - Klik "Deploy"
5. Copy Web App URL yang diberikan

### 3. Setup Environment Variables

Buat file `.env` di root project dengan isi:

```env
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Ganti `YOUR_DEPLOYMENT_ID` dengan ID deployment yang Anda dapatkan dari langkah sebelumnya.

## Setup Frontend & Server

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

**PENTING**: Aplikasi ini MEMERLUKAN Google Apps Script URL untuk berfungsi.

Buat file `.env` di root project:

```env
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

**Tanpa environment variable ini, aplikasi akan error 500 pada semua API calls.**

### 3. Run Development Server

```bash
npm run dev
```

Server akan berjalan di `http://localhost:5000`

## Struktur Data Initial

Untuk memulai, Anda perlu mengisi data lookups terlebih dahulu:

### Lookups_Marhalah
| MarhalahID | NamaMarhalah |
|------------|--------------|
| MUT        | Mutawassitoh |
| ALI        | Aliyah       |
| JAM        | Jamii        |

### Lookups_Waktu
| WaktuID | NamaWaktu |
|---------|-----------|
| SUBUH   | Shubuh    |
| ASHAR   | Ashar     |
| ISYA    | Isya      |

### Lookups_Kehadiran
| StatusID   | NamaStatus |
|------------|------------|
| HADIR      | Hadir      |
| SAKIT      | Sakit      |
| IZIN       | Izin       |
| ALPA       | Alpa       |
| TERLAMBAT  | Terlambat  |

### Lookups_Kelas

#### Aliyah
| MarhalahID | Kelas |
|------------|-------|
| ALI        | 1A    |
| ALI        | 1B    |
| ALI        | 1C    |
| ALI        | 2A    |
| ALI        | 2B    |
| ALI        | 3A    |
| ALI        | 3B    |

#### Mutawassitoh
| MarhalahID | Kelas |
|------------|-------|
| MUT        | 1A    |
| MUT        | 1B    |
| MUT        | 1D    |
| MUT        | 2A    |
| MUT        | 2B    |
| MUT        | 3A    |
| MUT        | 3B    |

#### Jamii
| MarhalahID | Kelas |
|------------|-------|
| JAM        | TQS   |
| JAM        | KHS   |
| JAM        | KS    |

## Penggunaan Aplikasi

### 1. Dashboard
- Lihat statistik santri dan musammi
- Lihat chart kehadiran
- Lihat chart rata-rata hafalan per bulan

### 2. Data Halaqah
- Kelola data Musammi
- Kelola data Santri
- Kelola data Halaqah
- Kelola keanggotaan Santri di Halaqah

### 3. Absensi Halaqah
- Pilih Marhalah (Mutawassitoh/Aliyah)
- Pilih Waktu (Shubuh/Ashar/Isya)
- Pilih Tanggal
- Tandai kehadiran untuk setiap musammi dan santri
- Submit batch absensi

### 4. Perkembangan Santri
- **Hafalan Bulanan**: Input data hafalan bulanan (dalam Juz)
- **Murojaah Bulanan**: Input data murojaah bulanan (dalam Juz)
- **Penambahan Hafalan**: Input penambahan hafalan (dalam Halaman)
  - Otomatis akan mengkonversi dan menambahkan ke Hafalan Bulanan
  - 20 halaman = 1 juz

### 5. Kalender & Tugas
- Buat tugas baru untuk Admin atau Musammi
- Tandai tugas sebagai selesai
- Filter tugas berdasarkan status
- Lihat kalender dan jumlah tugas terbuka

## Troubleshooting

### API Error 500 - YANG PALING SERING TERJADI
**Penyebab utama**: Environment variable `GOOGLE_APPS_SCRIPT_URL` belum diset!

Solusi:
1. Pastikan file `.env` ada di root project
2. Pastikan `GOOGLE_APPS_SCRIPT_URL` berisi URL deployment Google Apps Script yang valid
3. Restart server setelah menambahkan `.env` file
4. Google Apps Script sudah di-deploy sebagai Web App
5. Spreadsheet ID di Google Apps Script sudah benar
6. Sheet-sheet sudah dibuat dengan nama yang tepat

**Tanpa Google Apps Script URL, SEMUA fitur aplikasi tidak akan berfungsi.**

### Data Tidak Muncul
1. Periksa console browser untuk error
2. Periksa apakah Google Sheets sudah memiliki data lookups yang benar
3. Pastikan format data sesuai dengan skema

### CORS Error
Jika terjadi CORS error saat memanggil Google Apps Script:
1. Pastikan deployment Web App sudah diset "Who has access" ke "Anyone"
2. Coba redeploy Web App dengan versi baru
