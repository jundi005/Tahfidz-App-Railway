# Panduan Memperbaiki Sistem Halaqoh Pagi

## Masalah
Halaqoh Pagi masih menampilkan data dari Halaqoh Utama karena Google Apps Script (GAS) belum memfilter data berdasarkan kolom `JenisHalaqah`.

## Solusi

### 1. Pastikan Kolom JenisHalaqah Ada di Spreadsheet

Di sheet **Halaqah**, pastikan ada kolom `JenisHalaqah` dengan nilai:
- `UTAMA` - untuk halaqah utama (Subuh, Ashar, Isya)
- `PAGI` - untuk halaqah pagi (Dhuha)

### 2. Update Google Apps Script - Fungsi doGet untuk /halaqah

Tambahkan filter berdasarkan parameter `jenis`:

```javascript
function doGet(e) {
  const path = e.parameter.path;
  const id = e.parameter.id;
  const marhalah = e.parameter.marhalah;
  const jenis = e.parameter.jenis; // Tambahkan ini
  
  if (path === 'halaqah') {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Halaqah');
    if (!sheet) {
      return createErrorResponse('Sheet Halaqah tidak ditemukan');
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Dapatkan index kolom
    const halaqahIdIndex = headers.indexOf('HalaqahID');
    const nomorUrutIndex = headers.indexOf('NomorUrutHalaqah');
    const marhalahIdIndex = headers.indexOf('MarhalahID');
    const musammiIdIndex = headers.indexOf('MusammiID');
    const kelasMusammiIndex = headers.indexOf('KelasMusammi');
    const namaHalaqahIndex = headers.indexOf('NamaHalaqah');
    const jenisHalaqahIndex = headers.indexOf('JenisHalaqah'); // Tambahkan ini
    
    let results = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Filter berdasarkan marhalah jika parameter ada
      if (marhalah && row[marhalahIdIndex] !== marhalah) {
        continue;
      }
      
      // PENTING: Filter berdasarkan jenis jika parameter ada
      if (jenis && row[jenisHalaqahIndex] !== jenis) {
        continue; // Skip baris ini jika tidak sesuai jenis
      }
      
      results.push({
        HalaqahID: row[halaqahIdIndex],
        NomorUrutHalaqah: parseInt(row[nomorUrutIndex]) || 0,
        MarhalahID: row[marhalahIdIndex],
        MusammiID: row[musammiIdIndex],
        KelasMusammi: row[kelasMusammiIndex],
        NamaHalaqah: row[namaHalaqahIndex] || '',
        JenisHalaqah: row[jenisHalaqahIndex] || 'UTAMA'
      });
    }
    
    return createSuccessResponse(results);
  }
  
  // ... kode lainnya
}
```

### 3. Update Google Apps Script - Fungsi doPost untuk /halaqah

Pastikan saat create halaqah, JenisHalaqah disimpan:

```javascript
function doPost(e) {
  const path = e.parameter.path;
  
  if (path === 'halaqah') {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Halaqah');
    const body = JSON.parse(e.postData.contents);
    
    // Generate ID
    const halaqahId = generateId();
    
    // Ambil JenisHalaqah dari body, default UTAMA
    const jenisHalaqah = body.JenisHalaqah || 'UTAMA';
    
    // Tambahkan ke sheet
    sheet.appendRow([
      halaqahId,
      body.NomorUrutHalaqah,
      body.MarhalahID,
      body.MusammiID,
      body.KelasMusammi,
      body.NamaHalaqah || '',
      jenisHalaqah  // Pastikan kolom ini ditambahkan
    ]);
    
    return createSuccessResponse({
      HalaqahID: halaqahId,
      NomorUrutHalaqah: body.NomorUrutHalaqah,
      MarhalahID: body.MarhalahID,
      MusammiID: body.MusammiID,
      KelasMusammi: body.KelasMusammi,
      NamaHalaqah: body.NamaHalaqah || '',
      JenisHalaqah: jenisHalaqah
    });
  }
  
  // ... kode lainnya
}
```

### 4. Update Data Halaqah yang Sudah Ada

Jika ada data halaqah yang sudah ada tanpa JenisHalaqah:
1. Buka spreadsheet Anda
2. Isi kolom `JenisHalaqah` untuk semua halaqah yang sudah ada:
   - Isi `UTAMA` untuk halaqah utama (yang waktu Subuh/Ashar/Isya)
   - Isi `PAGI` untuk halaqah pagi (yang waktu Dhuha)

### 5. Filter Halaqah-Members (Opsional tapi Disarankan)

Untuk memfilter anggota halaqah berdasarkan jenis halaqah, update fungsi `getHalaqahMembers`:

```javascript
// Tambahkan parameter jenis di halaqah-members
if (path === 'halaqah-members') {
  const halaqahId = e.parameter.halaqahId;
  const jenis = e.parameter.jenis;
  
  if (halaqahId) {
    // Jika ada filter jenis, cek dulu halaqahnya
    if (jenis) {
      const halaqahSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Halaqah');
      const halaqahData = halaqahSheet.getDataRange().getValues();
      const halaqahHeaders = halaqahData[0];
      
      const halaqahIdIndex = halaqahHeaders.indexOf('HalaqahID');
      const jenisHalaqahIndex = halaqahHeaders.indexOf('JenisHalaqah');
      
      let halaqahValid = false;
      for (let i = 1; i < halaqahData.length; i++) {
        if (halaqahData[i][halaqahIdIndex] === halaqahId && 
            halaqahData[i][jenisHalaqahIndex] === jenis) {
          halaqahValid = true;
          break;
        }
      }
      
      if (!halaqahValid) {
        return createSuccessResponse([]); // Return empty jika tidak sesuai jenis
      }
    }
    
    // ... lanjutkan dengan query members seperti biasa
  }
}
```

### 6. Update Absensi Batch

Pastikan saat menyimpan absensi, JenisHalaqah juga disimpan di sheet Absensi_Santri dan Absensi_Musammi:

```javascript
if (path === 'absensi/batch') {
  const body = JSON.parse(e.postData.contents);
  const tanggal = body.tanggal;
  const marhalahId = body.marhalahId;
  const waktuId = body.waktuId;
  const jenisHalaqah = body.jenisHalaqah || 'UTAMA'; // Ambil jenis halaqah
  
  // Simpan absensi musammi
  const musammiSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Absensi_Musammi');
  body.musammi.forEach(m => {
    musammiSheet.appendRow([
      generateId(),
      tanggal,
      marhalahId,
      waktuId,
      m.halaqahId,
      m.musammiId,
      m.statusId,
      m.keterangan || '',
      jenisHalaqah  // Tambahkan kolom ini
    ]);
  });
  
  // Simpan absensi santri
  const santriSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Absensi_Santri');
  body.santri.forEach(s => {
    santriSheet.appendRow([
      generateId(),
      tanggal,
      marhalahId,
      waktuId,
      s.halaqahId,
      s.santriId,
      s.statusId,
      s.keterangan || '',
      jenisHalaqah  // Tambahkan kolom ini
    ]);
  });
}
```

## Cara Test

1. Deploy ulang Google Apps Script setelah perubahan
2. Copy URL baru (jika berubah) dan update di environment variable
3. Buka halaman Halaqoh Pagi
4. Buka Console Browser (F12) dan lihat log debug:
   - Seharusnya muncul: "Halaqoh Pagi - Data dari server: X halaqah"
   - Seharusnya muncul: "Halaqoh Pagi - Setelah filter PAGI: X halaqah"
   - Jika ada warning, berarti GAS belum memfilter dengan benar

## Catatan Penting

- Frontend sudah ditambahkan **safety filter** sebagai solusi sementara
- Filter di frontend akan memfilter halaqah yang `JenisHalaqah !== 'PAGI'`
- Namun, **sebaiknya perbaiki di Google Apps Script** untuk performa lebih baik
- Jika banyak data, filter di server (GAS) akan lebih cepat daripada di client

## Struktur Kolom yang Dibutuhkan

### Sheet: Halaqah
```
HalaqahID | NomorUrutHalaqah | MarhalahID | MusammiID | KelasMusammi | NamaHalaqah | JenisHalaqah
```

### Sheet: Absensi_Musammi
```
AbsensiID | Tanggal | MarhalahID | WaktuID | HalaqahID | MusammiID | StatusID | Keterangan | JenisHalaqah
```

### Sheet: Absensi_Santri
```
AbsensiID | Tanggal | MarhalahID | WaktuID | HalaqahID | SantriID | StatusID | Keterangan | JenisHalaqah
```
