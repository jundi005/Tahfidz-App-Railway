# TAHFIDZ - Al-Qur'an Halaqah Management System

## Project Overview
Web application for managing Al-Qur'an halaqah (study groups) with features for dashboard statistics, halaqah data management, and attendance tracking. The app uses Google Sheets as database via Google Apps Script Web App API.

## Current Status
**Last Updated**: September 30, 2025

### Completed Features
✅ **Data Model & Schema** - Complete entity schemas with Zod validation (Halaqah, Musammi, Santri, HalaqahMembers, Absensi, Hafalan, Murojaah, Tasks)
✅ **Google Apps Script API** - Full REST API implementation with CRUD operations for all entities
✅ **Backend API Routes** - Express routes with proper validation and error handling
✅ **Dashboard Integration** - Real-time statistics and charts from Google Sheets data

### In Progress  
🔄 **Frontend Integration** - Dashboard completed, Data Halaqah and Absensi pages need API integration

### Pending
⏳ **End-to-End Testing** - Comprehensive testing with real Google Sheets data
⏳ **Production Deployment** - Setup guide for Google Apps Script deployment

## Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS + Shadcn UI
- **Backend**: Express.js + Node.js
- **Database**: Google Sheets (via Google Apps Script Web App)
- **State Management**: TanStack Query (React Query v5)
- **Validation**: Zod
- **Routing**: Wouter

### Key Design Decisions
- **Manual Google Sheets Integration**: Using Google Apps Script Web App instead of Replit's Google Sheets integration for more control
- **In-Memory Storage Pattern**: Storage layer abstracts Google Sheets API for easy testing and future database migration
- **Islamic Green Theme**: Primary color hsl(142 76% 36%) with dark/light mode support

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

**Musammi** (similar structure)
**Santri** (similar structure)
**HalaqahMembers** (similar structure)

**Absensi**
- POST `/absensi/batch` - Batch create attendance records
- GET `/absensi/santri?tanggal={date}&marhalah={id}&waktu={id}` - Get santri attendance
- GET `/absensi/musammi?tanggal={date}&marhalah={id}&waktu={id}` - Get musammi attendance

**Hafalan & Murojaah**
- GET/POST/PUT/DELETE `/hafalan` - Hafalan bulanan CRUD
- GET/POST/PUT/DELETE `/murojaah` - Murojaah bulanan CRUD
- POST `/penambahan` - Add hafalan with auto-update to HafalanBulanan

**Dashboard**
- GET `/dashboard/stats` - Get dashboard statistics (counts, today's attendance, monthly hafalan averages)

## Project Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components (Dashboard, DataHalaqah, Absensi, etc.)
│   │   ├── components/    # Reusable UI components
│   │   └── lib/           # Utils and query client
├── server/                # Express backend
│   ├── routes.ts          # API route handlers
│   └── storage.ts         # Storage interface & Google Sheets adapter
├── shared/                # Shared types and schemas
│   └── schema.ts          # Zod schemas and TypeScript types
└── google-apps-script/    # Google Apps Script code
    └── Code.gs            # Complete REST API implementation
```

## Environment Variables
- `GOOGLE_APPS_SCRIPT_URL` - Google Apps Script Web App deployment URL
- `SESSION_SECRET` - Express session secret (auto-generated)

## Development Workflow
1. Run `npm run dev` to start both frontend (Vite) and backend (Express)
2. Frontend available at port 5000
3. Backend proxied through Vite dev server

## Known Issues & Future Improvements
- **Data Halaqah Page**: Needs complex joins between Santri, Halaqah, Musammi, and HafalanBulanan tables
- **Absensi Page**: Needs integration with batch create API
- **Error Handling**: Could be enhanced with retry logic and better user feedback
- **Google Sheets Performance**: Consider caching strategy for large datasets

## Testing Notes
- Dashboard successfully fetches and displays real-time stats from Google Sheets
- Error handling includes loading states, error states, and data validation
- All API endpoints tested with proper status codes (200, 201, 204, 400, 404, 500)
