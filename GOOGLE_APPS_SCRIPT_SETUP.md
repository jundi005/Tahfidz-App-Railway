# Google Apps Script Setup Guide

This guide will help you set up the Google Apps Script Web App that serves as the backend API for the TAHFIDZ application.

## Prerequisites
- Google Account
- Google Sheets with proper data structure
- Basic understanding of Google Apps Script

## Step 1: Create Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Name it "TAHFIDZ Database" or similar
3. Create the following sheets (tabs) with exact names:

### Required Sheets:

#### Marhalah
Columns: `MarhalahID | NamaMarhalah`
- MUT | Mutawassitoh
- ALI | Aliyah
- JAM | Jamii

#### Waktu
Columns: `WaktuID | NamaWaktu`
- SUBUH | Shubuh
- ASHAR | Ashar
- ISYA | Isya

#### Kehadiran
Columns: `KehadiranID | NamaKehadiran`
- HADIR | Hadir
- SAKIT | Sakit
- IZIN | Izin
- ALPA | Alpa
- TERLAMBAT | Terlambat

#### Kelas
Columns: `KelasID | NamaKelas | MarhalahID`
Examples:
- 1A | 1A | MUT
- 2B | 2B | ALI
- TQS | TQS | JAM
- KHS | KHS | JAM

#### Halaqah
Columns: `HalaqahID | NomorHalaqah | MarhalahID | MusammiID`

#### Musammi
Columns: `MusammiID | NamaMusammi | MarhalahID | Kelas | Aktif`

#### Santri
Columns: `SantriID | NamaSantri | MarhalahID | Kelas | Aktif`

#### HalaqahMembers
Columns: `HalaqahID | SantriID | IsTahfidz`

#### AbsensiSantri
Columns: `AbsensiID | Tanggal | SantriID | Kehadiran | WaktuID`

#### AbsensiMusammi
Columns: `AbsensiID | Tanggal | MusammiID | Kehadiran | WaktuID`

#### HafalanBulanan
Columns: `RekapID | Bulan | SantriID | HalaqahID | MarhalahID | Kelas | MusammiID | JumlahHafalan`

#### MurojaahBulanan
Columns: `RekapID | Bulan | SantriID | HalaqahID | MarhalahID | Kelas | MusammiID | JumlahMurojaah`

#### PenambahanHafalan
Columns: `PenambahanID | Bulan | SantriID | HalaqahID | MarhalahID | Kelas | MusammiID | JumlahPenambahan | Catatan`

#### Tasks
Columns: `TaskID | Judul | Deskripsi | Tanggal | WaktuPengingat | AssigneeType | AssigneeID | Status | Priority`

## Step 2: Setup Google Apps Script

1. In your Google Spreadsheet, go to **Extensions > Apps Script**
2. Delete any existing code in `Code.gs`
3. Copy the entire content from `/google-apps-script/Code.gs` in this project
4. Paste it into the Apps Script editor
5. Save the project (File > Save or Ctrl+S)
6. Name your project (e.g., "TAHFIDZ API")

## Step 3: Deploy as Web App

1. In the Apps Script editor, click **Deploy > New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Select **Web app**
4. Configure the deployment:
   - **Description**: "TAHFIDZ REST API v1" (or any description)
   - **Execute as**: **Me** (your Google account)
   - **Who has access**: 
     - Choose **Anyone** if you want public access
     - Choose **Anyone with Google account** for authenticated users only
5. Click **Deploy**
6. **IMPORTANT**: Copy the Web App URL - you'll need this for the next step
   - The URL will look like: `https://script.google.com/macros/s/AKfycby.../exec`

## Step 4: Authorize the Script

1. After clicking Deploy, you may see an authorization screen
2. Click **Authorize access**
3. Select your Google account
4. You may see a warning "Google hasn't verified this app"
5. Click **Advanced** > **Go to {Your Project Name} (unsafe)**
6. Click **Allow** to grant necessary permissions

## Step 5: Configure Replit Environment

1. In your Replit project, go to **Tools > Secrets** (or the lock icon 🔒)
2. Add a new secret:
   - **Key**: `GOOGLE_APPS_SCRIPT_URL`
   - **Value**: Paste the Web App URL from Step 3
3. The application will automatically use this URL to connect to your Google Sheets backend

## Step 6: Test the Connection

1. Restart your Replit application (click the green Run button)
2. Open the application in the browser
3. The Dashboard should load and display statistics from your Google Sheets
4. If you see errors:
   - Check that the Web App URL is correct
   - Verify all required sheets exist with proper column names
   - Check the Apps Script execution logs (Extensions > Apps Script > Executions)

## Important Notes

### Security
- The Web App URL should be kept secure if you selected "Anyone" access
- Consider using "Anyone with Google account" for better security
- Never commit the Web App URL to version control

### Data Format
- **Dates**: Use format `YYYY-MM-DD` (e.g., `2025-09-30`)
- **Month**: Use format `YYYY-MM` (e.g., `2025-09`)
- **IDs**: Auto-generated as `HEX_TIMESTAMP` (e.g., `66f2a1b4c3d`)
- **Boolean**: Use `true`/`false` for Aktif and IsTahfidz fields

### Updating the Script
1. Make changes in the Apps Script editor
2. Save the changes (Ctrl+S)
3. Create a **New deployment** (don't update existing deployment)
4. Update the `GOOGLE_APPS_SCRIPT_URL` secret in Replit with the new URL
5. Restart the Replit application

### Troubleshooting

**Error: "Script function not found"**
- Ensure you copied the entire Code.gs file
- Check that the spreadsheet ID matches (get from spreadsheet URL)

**Error: "Exception: Cannot find method getValues"**
- Verify all required sheet names are spelled correctly
- Sheet names are case-sensitive

**Error: "Authorization required"**
- Re-authorize the script through Deploy > Manage deployments > Edit > Deploy

**Data not updating**
- Check Apps Script execution logs for errors
- Verify the Web App is deployed and accessible
- Clear browser cache and restart application

## API Testing

You can test the API directly using the browser or tools like Postman:

### Get Dashboard Stats
```
GET {GOOGLE_APPS_SCRIPT_URL}?path=dashboard/stats
```

### Get Lookups
```
GET {GOOGLE_APPS_SCRIPT_URL}?path=lookups
```

### Get Halaqah List
```
GET {GOOGLE_APPS_SCRIPT_URL}?path=halaqah
```

### Create New Santri
```
POST {GOOGLE_APPS_SCRIPT_URL}?path=santri
Content-Type: application/json

{
  "NamaSantri": "Ahmad Zaki",
  "MarhalahID": "MUT",
  "Kelas": "1A",
  "Aktif": true
}
```

## Support

For issues or questions:
1. Check the Apps Script execution logs
2. Review the browser console for frontend errors
3. Verify the spreadsheet structure matches requirements
4. Ensure all sheets have the correct column headers
