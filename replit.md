# TAHFIDZ - Al-Qur'an Halaqah Management System

## Project Overview
Web application untuk manajemen Al-Qur'an halaqah (kelompok belajar) dengan fitur dashboard statistik, manajemen data halaqah, tracking absensi, monitoring perkembangan santri (hafalan & murojaah), dan manajemen tugas. Menggunakan Google Sheets sebagai database melalui Google Apps Script Web App API.

## Current Status
**Last Updated**: October 01, 2025

### Completed Features ✅
- **Data Model & Schema** - Complete entity schemas dengan Zod validation (Halaqah, Musammi, Santri, HalaqahMembers, Absensi, Hafalan, Murojaah, Tasks)
- **Google Apps Script API** - Full REST API implementation dengan CRUD operations untuk semua entities
- **Backend API Routes** - Express routes dengan proper validation dan error handling
- **Dashboard Integration** - Real-time statistics dan charts dari Google Sheets data
- **Data Halaqah Page** - Combined table showing santri, kelas, marhalah, halaqah number, musammi details, dan hafalan amount; includes CRUD dialogs untuk Musammi, Santri, Halaqah, dan HalaqahMembers
- **Absensi Page** - Real API integration untuk batch attendance submission; displays all halaqah grouped by marhalah/waktu dengan radio buttons untuk 5 status types (Hadir/Sakit/Izin/Alpa/Terlambat)
- **Perkembangan Page** - 3 tabs: Hafalan Bulanan, Murojaah Bulanan, dan Penambahan Hafalan (auto-updates hafalan dengan page-to-juz conversion pada 20 pages per juz)
- **Kalender & Tasks Page** - Calendar view dan task management (create/edit/delete tasks dengan priority, assignee, status, dan reminders)
- **Dokumentasi** - Comprehensive setup documentation (SETUP.md, README.md) menjelaskan Google Apps Script configuration dan deployment steps

### Known Limitations & Next Steps 🔨
1. **Form Validation** - Saat ini menggunakan plain state; perlu migrasi ke `react-hook-form` dengan `zodResolver` untuk better client-side validation
2. **Error Handling** - Perlu better error states ketika backend unavailable; saat ini hanya menampilkan loading skeleton
3. **Backend Configuration** - ⚠️ **CRITICAL**: Aplikasi MEMERLUKAN environment variable `GOOGLE_APPS_SCRIPT_URL` untuk berfungsi. Tanpa ini, semua API calls akan fail dengan 500 error
4. **End-to-End Testing** - Comprehensive testing dengan real Google Sheets data masih pending
5. **Production Deployment** - Setup guide untuk Google Apps Script deployment sudah ada di SETUP.md

## Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS + Shadcn UI
- **Backend**: Express.js + Node.js (sebagai proxy ke Google Apps Script)
- **Database**: Google Sheets (via Google Apps Script Web App)
- **State Management**: TanStack Query (React Query v5)
- **Validation**: Zod
- **Routing**: Wouter
- **Charts**: Recharts

### Key Design Decisions
- **Manual Google Sheets Integration**: Using Google Apps Script Web App instead of Replit's Google Sheets integration untuk more control dan flexibility
- **In-Memory Storage Pattern**: Storage layer abstracts Google Sheets API untuk easy testing dan future database migration
- **Islamic Green Theme**: Primary color hsl(142 76% 36%) dengan dark/light mode support
- **Server as Proxy**: Express server hanya sebagai proxy ke Google Apps Script, tidak ada business logic di server

## API Structure

### Google Apps Script Endpoints
Base URL: `{GOOGLE_APPS_SCRIPT_URL}?path={endpoint}`

**Lookups**
- GET `/lookups` - Get all lookup data (marhalah, waktu, kehadiran, kelas)

**Halaqah**
- GET `/halaqah` - Get all halaqah (filter: `?marhalah=MUT|ALI`)
- GET `/halaqah?id={id}` - Get halaqah by ID
- POST `/halaqah` - Create new halaqah
- PUT `/halaqah?id={id}` - Update halaqah
- DELETE `/halaqah?id={id}` - Delete halaqah

**Musammi, Santri, HalaqahMembers** (similar structure)

**Absensi**
- POST `/absensi/batch` - Batch create attendance records
- GET `/absensi/santri?tanggal={date}&marhalah={id}&waktu={id}` - Get santri attendance
- GET `/absensi/musammi?tanggal={date}&marhalah={id}&waktu={id}` - Get musammi attendance

**Hafalan & Murojaah**
- GET/POST/PUT/DELETE `/hafalan` - Hafalan bulanan CRUD
- GET/POST/PUT/DELETE `/murojaah` - Murojaah bulanan CRUD
- POST `/penambahan` - Add hafalan dengan auto-update ke HafalanBulanan

**Tasks**
- GET/POST/PUT/DELETE `/tasks` - Task management CRUD

**Dashboard**
- GET `/dashboard/stats` - Get dashboard statistics (counts, today's attendance, monthly hafalan averages)

## Project Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DataHalaqah.tsx
│   │   │   ├── Absensi.tsx
│   │   │   ├── Perkembangan.tsx
│   │   │   └── Kalender.tsx
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ui/        # shadcn components
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── AbsensiFilters.tsx
│   │   │   └── AbsensiGroup.tsx
│   │   └── lib/           # Utils and query client
├── server/                # Express backend
│   ├── routes.ts          # API route handlers (proxy to Google Apps Script)
│   └── storage.ts         # Storage interface & Google Sheets adapter
├── shared/                # Shared types and schemas
│   └── schema.ts          # Zod schemas and TypeScript types
├── google-apps-script/    # Google Apps Script code
│   └── Code.gs            # Complete REST API implementation
├── SETUP.md               # Setup documentation
└── README.md              # Project README
```

## Environment Variables
- `GOOGLE_APPS_SCRIPT_URL` - **REQUIRED** - Google Apps Script Web App deployment URL
- `SESSION_SECRET` - Express session secret (auto-generated)

⚠️ **PENTING**: Tanpa `GOOGLE_APPS_SCRIPT_URL`, aplikasi TIDAK AKAN BERFUNGSI. Lihat SETUP.md untuk panduan lengkap.

## Development Workflow
1. Setup Google Apps Script dengan spreadsheet (lihat SETUP.md)
2. Deploy Google Apps Script sebagai Web App
3. Set environment variable `GOOGLE_APPS_SCRIPT_URL` di `.env`
4. Run `npm run dev` untuk start frontend (Vite) dan backend (Express)
5. Frontend available di port 5000
6. Backend proxied melalui Vite dev server

## Data Model Constants
- `HALAMAN_PER_JUZ = 20` - Conversion constant untuk hafalan (20 halaman = 1 juz)

## Testing Notes
- Dashboard successfully fetches dan displays real-time stats dari Google Sheets
- Error handling includes loading states dan data validation
- All API endpoints perlu testing dengan proper status codes (200, 201, 204, 400, 404, 500)
- Form submissions currently tidak menggunakan react-hook-form (needs improvement)

## User Preferences
- Bahasa: Indonesian untuk semua UI labels dan messages
- Theme: Black/white dengan Islamic green accent
- Design: Simple, modern, professional, dan responsive
- All features harus support full CRUD operations

## Known Issues & Improvements
1. **CRITICAL**: Backend requires `GOOGLE_APPS_SCRIPT_URL` environment variable - aplikasi akan error 500 tanpa ini
2. **Form Validation**: Perlu migrate dari plain state ke react-hook-form dengan zodResolver sesuai development guidelines
3. **Error States**: UI perlu better error handling ketika backend unavailable - saat ini hanya loading skeleton
4. **Data Halaqah Page**: Complex joins antara Santri, Halaqah, Musammi, dan HafalanBulanan tables
5. **Performance**: Consider caching strategy untuk large datasets dari Google Sheets
6. **Retry Logic**: Tambahkan retry mechanism untuk failed API requests

## Production Checklist
- [ ] Set up Google Spreadsheet dengan semua required sheets
- [ ] Deploy Google Apps Script sebagai Web App
- [ ] Configure `GOOGLE_APPS_SCRIPT_URL` environment variable
- [ ] Populate lookup data (Marhalah, Waktu, Kehadiran, Kelas)
- [ ] Implement form validation dengan react-hook-form + zodResolver
- [ ] Add comprehensive error handling dan error boundaries
- [ ] End-to-end testing semua CRUD operations
- [ ] Performance optimization (caching, lazy loading)
- [ ] Consider authentication jika diperlukan
