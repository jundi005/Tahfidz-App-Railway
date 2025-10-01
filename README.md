# TAHFIDZ - Sistem Manajemen Halaqah Al-Qur'an

Aplikasi web untuk manajemen halaqah Al-Qur'an dengan fitur:
- Dashboard statistik santri dan musammi
- Data halaqah (Musammi, Santri, Halaqah, Keanggotaan)
- Absensi halaqah (Musammi & Santri) untuk waktu Shubuh/Ashar/Isya
- Rekap perkembangan hafalan dan murojaah per bulan
- Kalender dan manajemen tugas

## Status Implementasi

### ✅ Yang Sudah Selesai

1. **Schema & Backend Routes** - Lengkap
   - Semua schema TypeScript/Zod sudah dibuat
   - Backend routes untuk semua CRUD operations
   - Google Apps Script code lengkap

2. **Frontend Pages** - Implementasi Dasar Selesai
   - ✅ Dashboard dengan statistik dan charts
   - ✅ Data Halaqah dengan tabs untuk Musammi, Santri, Halaqah, Members
   - ✅ Absensi Halaqah dengan batch submission
   - ✅ Perkembangan dengan 3 tabs (Hafalan Bulanan, Murojaah Bulanan, Penambahan Hafalan)
   - ✅ Kalender & Tasks dengan task management

3. **UI Components**
   - ✅ Sidebar navigation
   - ✅ Theme toggle (dark/light mode)
   - ✅ Responsive design
   - ✅ Loading states

### ⚠️ Yang Perlu Perbaikan

Berdasarkan review architect, ada beberapa area yang perlu diperbaiki sebelum production-ready:

1. **Form Validation** (Priority: HIGH)
   - Saat ini menggunakan plain state
   - Perlu migrasi ke `react-hook-form` dengan `zodResolver`
   - Tambahkan client-side validation sebelum submit

2. **Error Handling** (Priority: HIGH)  
   - Tampilkan error state yang jelas saat backend tidak terconfig
   - Tambahkan error boundary
   - Tampilkan pesan error yang user-friendly

3. **Backend Configuration** (Priority: CRITICAL)
   - **WAJIB**: Set environment variable `GOOGLE_APPS_SCRIPT_URL`
   - Tanpa ini, aplikasi TIDAK AKAN BERFUNGSI
   - Lihat `SETUP.md` untuk panduan lengkap

## Quick Start

### Prerequisites
- Node.js 18+
- Google Account (untuk Google Sheets & Apps Script)

### Installation

1. Clone repository
2. Install dependencies:
```bash
npm install
```

3. **WAJIB**: Setup Google Apps Script (lihat `SETUP.md`)

4. Create `.env` file:
```env
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

5. Run development server:
```bash
npm run dev
```

**PENTING**: Aplikasi akan error 500 jika `GOOGLE_APPS_SCRIPT_URL` tidak diset!

## Documentation

- `SETUP.md` - Panduan lengkap setup Google Apps Script dan environment
- `google-apps-script/Code.gs` - Backend code untuk Google Apps Script
- `attached_assets/...` - Requirements document

## Tech Stack

- **Frontend**: React + Vite, TanStack Query, Wouter, Tailwind CSS, shadcn/ui
- **Backend**: Express.js (proxy)
- **Database**: Google Sheets via Google Apps Script
- **Charts**: Recharts

## Architecture

```
Frontend (React) 
    ↓ API calls
Express Server (Proxy)
    ↓ HTTP requests
Google Apps Script (Web App)
    ↓ Read/Write
Google Spreadsheet (Database)
```

## Next Steps untuk Production

1. ✅ Setup Google Apps Script dengan Spreadsheet
2. ✅ Deploy Google Apps Script sebagai Web App
3. ⚠️ Implementasi form validation dengan react-hook-form + zodResolver
4. ⚠️ Tambahkan error states dan error boundaries
5. ⚠️ Testing end-to-end semua CRUD operations
6. ⚠️ Implementasi retry logic untuk failed requests
7. ⚠️ Optimasi performa (caching, lazy loading)
8. ⚠️ User authentication jika diperlukan

## Contributing

Aplikasi ini masih dalam tahap development. Kontribusi welcome untuk:
- Form validation improvements
- Error handling enhancements
- Performance optimizations
- Bug fixes

## License

Private project untuk manajemen halaqah Al-Qur'an.
