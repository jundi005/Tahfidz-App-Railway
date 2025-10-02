// TAHFIDZ Google Apps Script Web App
// Spreadsheet-based REST API for TAHFIDZ management system

// ========== CONFIGURATION ==========
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace with your spreadsheet ID
const HALAMAN_PER_JUZ = 20; // Conversion rate: 20 pages = 1 juz

// ========== UTILITY FUNCTIONS ==========

function getSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(sheetName);
}

function generateId() {
  return Utilities.getUuid();
}

function parseQueryParams(e) {
  return e.parameter || {};
}

// Note: Google Apps Script doesn't support HTTP status codes in responses
// Instead, we use response structure to indicate success/error
// Success: { data: ... } or the data directly
// Error: { error: "message", code: 404/400/500 }
// Frontend must check for 'error' property to detect failures

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(message, code = 400) {
  return ContentService.createTextOutput(JSON.stringify({ error: message, code: code }))
    .setMimeType(ContentService.MimeType.JSON);
}

function notFoundResponse(message = 'Not found') {
  return errorResponse(message, 404);
}

function successResponse(message = 'Success') {
  return jsonResponse({ success: true, message: message });
}

// ========== VALIDATION FUNCTIONS ==========

function validateMarhalahID(marhalahId) {
  const valid = ['MUT', 'ALI', 'JAM'];
  if (!valid.includes(marhalahId)) {
    throw new Error(`Invalid MarhalahID: ${marhalahId}`);
  }
}

function validateWaktuID(waktuId) {
  const valid = ['SUBUH', 'ASHAR', 'ISYA'];
  if (!valid.includes(waktuId)) {
    throw new Error(`Invalid WaktuID: ${waktuId}`);
  }
}

function validateStatusID(statusId) {
  const valid = ['HADIR', 'SAKIT', 'IZIN', 'ALPA', 'TERLAMBAT'];
  if (!valid.includes(statusId)) {
    throw new Error(`Invalid StatusID: ${statusId}`);
  }
}

function validateKelas(marhalahId, kelas) {
  const sheet = getSheet('Lookups_Kelas');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === marhalahId && data[i][1] === kelas) {
      return true;
    }
  }
  throw new Error(`Invalid Kelas ${kelas} for MarhalahID ${marhalahId}`);
}

function checkActiveMembership(santriId, excludeHalaqahId = null) {
  const sheet = getSheet('HalaqahMembers');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === santriId && !data[i][3]) { // TanggalSelesai is empty
      if (excludeHalaqahId && data[i][0] === excludeHalaqahId) continue;
      throw new Error(`Santri ${santriId} already has an active membership in another halaqah`);
    }
  }
}

// ========== LOOKUPS ENDPOINTS ==========

function getLookups() {
  const marhalah = getSheet('Lookups_Marhalah').getDataRange().getValues().slice(1).map(row => ({
    MarhalahID: row[0],
    NamaMarhalah: row[1]
  }));
  
  const waktu = getSheet('Lookups_Waktu').getDataRange().getValues().slice(1).map(row => ({
    WaktuID: row[0],
    NamaWaktu: row[1]
  }));
  
  const kehadiran = getSheet('Lookups_Kehadiran').getDataRange().getValues().slice(1).map(row => ({
    StatusID: row[0],
    NamaStatus: row[1]
  }));
  
  const kelas = getSheet('Lookups_Kelas').getDataRange().getValues().slice(1).map(row => ({
    MarhalahID: row[0],
    Kelas: row[1]
  }));
  
  return { marhalah, waktu, kehadiran, kelas };
}

// ========== HALAQAH CRUD ==========

function getAllHalaqah(params) {
  const sheet = getSheet('Halaqah');
  const data = sheet.getDataRange().getValues();
  let halaqah = [];
  
  for (let i = 1; i < data.length; i++) {
    const item = {
      HalaqahID: data[i][0],
      NomorUrutHalaqah: data[i][1],
      MarhalahID: data[i][2],
      MusammiID: data[i][3],
      KelasMusammi: data[i][4],
      NamaHalaqah: data[i][5] || ''
    };
    
    if (params.marhalah && item.MarhalahID !== params.marhalah) continue;
    halaqah.push(item);
  }
  
  return halaqah;
}

function getHalaqahById(id) {
  const sheet = getSheet('Halaqah');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      return {
        HalaqahID: data[i][0],
        NomorUrutHalaqah: data[i][1],
        MarhalahID: data[i][2],
        MusammiID: data[i][3],
        KelasMusammi: data[i][4],
        NamaHalaqah: data[i][5] || ''
      };
    }
  }
  return null;
}

function createHalaqah(body) {
  validateMarhalahID(body.MarhalahID);
  const id = generateId();
  const sheet = getSheet('Halaqah');
  
  sheet.appendRow([
    id,
    body.NomorUrutHalaqah,
    body.MarhalahID,
    body.MusammiID,
    body.KelasMusammi,
    body.NamaHalaqah || ''
  ]);
  
  return {
    HalaqahID: id,
    ...body
  };
}

function updateHalaqah(id, body) {
  if (body.MarhalahID) validateMarhalahID(body.MarhalahID);
  
  const sheet = getSheet('Halaqah');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      if (body.NomorUrutHalaqah !== undefined) sheet.getRange(i + 1, 2).setValue(body.NomorUrutHalaqah);
      if (body.MarhalahID) sheet.getRange(i + 1, 3).setValue(body.MarhalahID);
      if (body.MusammiID) sheet.getRange(i + 1, 4).setValue(body.MusammiID);
      if (body.KelasMusammi) sheet.getRange(i + 1, 5).setValue(body.KelasMusammi);
      if (body.NamaHalaqah !== undefined) sheet.getRange(i + 1, 6).setValue(body.NamaHalaqah);
      
      return getHalaqahById(id);
    }
  }
  throw new Error('Halaqah not found');
}

function deleteHalaqah(id) {
  const sheet = getSheet('Halaqah');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
  throw new Error('Halaqah not found');
}

// ========== MUSAMMI CRUD ==========

function getAllMusammi(params) {
  const sheet = getSheet('Musammi');
  const data = sheet.getDataRange().getValues();
  let musammi = [];
  
  for (let i = 1; i < data.length; i++) {
    const item = {
      MusammiID: data[i][0],
      NamaMusammi: data[i][1],
      MarhalahID: data[i][2],
      KelasMusammi: data[i][3],
      Catatan: data[i][4] || ''
    };
    
    if (params.marhalah && item.MarhalahID !== params.marhalah) continue;
    musammi.push(item);
  }
  
  return musammi;
}

function getMusammiById(id) {
  const sheet = getSheet('Musammi');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      return {
        MusammiID: data[i][0],
        NamaMusammi: data[i][1],
        MarhalahID: data[i][2],
        KelasMusammi: data[i][3],
        Catatan: data[i][4] || ''
      };
    }
  }
  return null;
}

function createMusammi(body) {
  validateMarhalahID(body.MarhalahID);
  validateKelas(body.MarhalahID, body.KelasMusammi);
  
  const id = generateId();
  const sheet = getSheet('Musammi');
  
  sheet.appendRow([
    id,
    body.NamaMusammi,
    body.MarhalahID,
    body.KelasMusammi,
    body.Catatan || ''
  ]);
  
  return {
    MusammiID: id,
    ...body
  };
}

function updateMusammi(id, body) {
  if (body.MarhalahID) {
    validateMarhalahID(body.MarhalahID);
    if (body.KelasMusammi) validateKelas(body.MarhalahID, body.KelasMusammi);
  }
  
  const sheet = getSheet('Musammi');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      if (body.NamaMusammi) sheet.getRange(i + 1, 2).setValue(body.NamaMusammi);
      if (body.MarhalahID) sheet.getRange(i + 1, 3).setValue(body.MarhalahID);
      if (body.KelasMusammi) sheet.getRange(i + 1, 4).setValue(body.KelasMusammi);
      if (body.Catatan !== undefined) sheet.getRange(i + 1, 5).setValue(body.Catatan);
      
      return getMusammiById(id);
    }
  }
  throw new Error('Musammi not found');
}

function deleteMusammi(id) {
  const sheet = getSheet('Musammi');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
  throw new Error('Musammi not found');
}

// ========== SANTRI CRUD ==========

function getAllSantri(params) {
  const sheet = getSheet('Santri');
  const data = sheet.getDataRange().getValues();
  let santri = [];
  
  for (let i = 1; i < data.length; i++) {
    const item = {
      SantriID: data[i][0],
      NamaSantri: data[i][1],
      MarhalahID: data[i][2],
      Kelas: data[i][3],
      Aktif: data[i][4]
    };
    
    if (params.marhalah && item.MarhalahID !== params.marhalah) continue;
    if (params.aktif !== undefined && item.Aktif !== (params.aktif === 'true')) continue;
    santri.push(item);
  }
  
  return santri;
}

function getSantriById(id) {
  const sheet = getSheet('Santri');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      return {
        SantriID: data[i][0],
        NamaSantri: data[i][1],
        MarhalahID: data[i][2],
        Kelas: data[i][3],
        Aktif: data[i][4]
      };
    }
  }
  return null;
}

function createSantri(body) {
  validateMarhalahID(body.MarhalahID);
  validateKelas(body.MarhalahID, body.Kelas);
  
  const id = generateId();
  const sheet = getSheet('Santri');
  
  sheet.appendRow([
    id,
    body.NamaSantri,
    body.MarhalahID,
    body.Kelas,
    body.Aktif
  ]);
  
  return {
    SantriID: id,
    ...body
  };
}

function updateSantri(id, body) {
  if (body.MarhalahID) {
    validateMarhalahID(body.MarhalahID);
    if (body.Kelas) validateKelas(body.MarhalahID, body.Kelas);
  }
  
  const sheet = getSheet('Santri');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      if (body.NamaSantri) sheet.getRange(i + 1, 2).setValue(body.NamaSantri);
      if (body.MarhalahID) sheet.getRange(i + 1, 3).setValue(body.MarhalahID);
      if (body.Kelas) sheet.getRange(i + 1, 4).setValue(body.Kelas);
      if (body.Aktif !== undefined) sheet.getRange(i + 1, 5).setValue(body.Aktif);
      
      return getSantriById(id);
    }
  }
  throw new Error('Santri not found');
}

function deleteSantri(id) {
  const sheet = getSheet('Santri');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
  throw new Error('Santri not found');
}

// ========== HALAQAH MEMBERS CRUD ==========

function getHalaqahMembers(params) {
  const sheet = getSheet('HalaqahMembers');
  const data = sheet.getDataRange().getValues();
  let members = [];
  
  for (let i = 1; i < data.length; i++) {
    const item = {
      HalaqahID: data[i][0],
      SantriID: data[i][1],
      TanggalMulai: data[i][2],
      TanggalSelesai: data[i][3] || ''
    };
    
    if (params.halaqahId && item.HalaqahID !== params.halaqahId) continue;
    members.push(item);
  }
  
  return members;
}

function createHalaqahMember(body) {
  checkActiveMembership(body.SantriID);
  
  const sheet = getSheet('HalaqahMembers');
  sheet.appendRow([
    body.HalaqahID,
    body.SantriID,
    body.TanggalMulai,
    body.TanggalSelesai || ''
  ]);
  
  return body;
}

function updateHalaqahMember(halaqahId, santriId, body) {
  const sheet = getSheet('HalaqahMembers');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === halaqahId && data[i][1] === santriId) {
      if (body.TanggalMulai) sheet.getRange(i + 1, 3).setValue(body.TanggalMulai);
      if (body.TanggalSelesai !== undefined) sheet.getRange(i + 1, 4).setValue(body.TanggalSelesai);
      
      return {
        HalaqahID: halaqahId,
        SantriID: santriId,
        TanggalMulai: body.TanggalMulai || data[i][2],
        TanggalSelesai: body.TanggalSelesai || data[i][3]
      };
    }
  }
  throw new Error('Halaqah member not found');
}

function deleteHalaqahMember(halaqahId, santriId) {
  const sheet = getSheet('HalaqahMembers');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === halaqahId && data[i][1] === santriId) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
  throw new Error('Halaqah member not found');
}

// ========== ABSENSI BATCH ==========

function batchCreateAbsensi(body) {
  validateMarhalahID(body.marhalahId);
  validateWaktuID(body.waktuId);
  
  const musammiSheet = getSheet('AbsensiMusammi');
  const santriSheet = getSheet('AbsensiSantri');
  
  const musammiResult = [];
  const santriResult = [];
  
  // Insert Musammi attendance
  for (const m of body.musammi) {
    validateStatusID(m.statusId);
    const id = generateId();
    
    musammiSheet.appendRow([
      id,
      body.tanggal,
      body.marhalahId,
      body.waktuId,
      m.halaqahId,
      m.musammiId,
      m.statusId,
      m.keterangan || ''
    ]);
    
    musammiResult.push({
      AbsensiMusammiID: id,
      Tanggal: body.tanggal,
      MarhalahID: body.marhalahId,
      WaktuID: body.waktuId,
      HalaqahID: m.halaqahId,
      MusammiID: m.musammiId,
      StatusID: m.statusId,
      Keterangan: m.keterangan || ''
    });
  }
  
  // Insert Santri attendance
  for (const s of body.santri) {
    validateStatusID(s.statusId);
    const id = generateId();
    
    santriSheet.appendRow([
      id,
      body.tanggal,
      body.marhalahId,
      body.waktuId,
      s.halaqahId,
      s.santriId,
      s.statusId,
      s.keterangan || ''
    ]);
    
    santriResult.push({
      AbsensiSantriID: id,
      Tanggal: body.tanggal,
      MarhalahID: body.marhalahId,
      WaktuID: body.waktuId,
      HalaqahID: s.halaqahId,
      SantriID: s.santriId,
      StatusID: s.statusId,
      Keterangan: s.keterangan || ''
    });
  }
  
  return { musammi: musammiResult, santri: santriResult };
}

// ========== HAFALAN CRUD ==========

function getHafalanBulanan(params) {
  const sheet = getSheet('HafalanBulanan');
  const data = sheet.getDataRange().getValues();
  let hafalan = [];
  
  for (let i = 1; i < data.length; i++) {
    const item = {
      RekapID: data[i][0],
      Bulan: data[i][1],
      SantriID: data[i][2],
      HalaqahID: data[i][3],
      MarhalahID: data[i][4],
      Kelas: data[i][5],
      MusammiID: data[i][6],
      JumlahHafalan: data[i][7]
    };
    
    if (params.bulan && item.Bulan !== params.bulan) continue;
    if (params.marhalah && item.MarhalahID !== params.marhalah) continue;
    hafalan.push(item);
  }
  
  return hafalan;
}

function createHafalanBulanan(body) {
  const id = generateId();
  const sheet = getSheet('HafalanBulanan');
  
  sheet.appendRow([
    id,
    body.Bulan,
    body.SantriID,
    body.HalaqahID,
    body.MarhalahID,
    body.Kelas,
    body.MusammiID,
    body.JumlahHafalan
  ]);
  
  return { RekapID: id, ...body };
}

function updateHafalanBulanan(id, body) {
  const sheet = getSheet('HafalanBulanan');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      if (body.JumlahHafalan !== undefined) sheet.getRange(i + 1, 8).setValue(body.JumlahHafalan);
      return getHafalanBulananById(id);
    }
  }
  throw new Error('Hafalan not found');
}

function deleteHafalanBulanan(id) {
  const sheet = getSheet('HafalanBulanan');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
  throw new Error('Hafalan not found');
}

function getHafalanBulananById(id) {
  const sheet = getSheet('HafalanBulanan');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      return {
        RekapID: data[i][0],
        Bulan: data[i][1],
        SantriID: data[i][2],
        HalaqahID: data[i][3],
        MarhalahID: data[i][4],
        Kelas: data[i][5],
        MusammiID: data[i][6],
        JumlahHafalan: data[i][7]
      };
    }
  }
  return null;
}

// ========== MUROJAAH BULANAN CRUD ==========

function getMurojaahBulanan(params) {
  const sheet = getSheet('MurojaahBulanan');
  const data = sheet.getDataRange().getValues();
  let murojaah = [];
  
  for (let i = 1; i < data.length; i++) {
    const item = {
      MurojaahID: data[i][0],
      Bulan: data[i][1],
      SantriID: data[i][2],
      HalaqahID: data[i][3],
      MarhalahID: data[i][4],
      Kelas: data[i][5],
      MusammiID: data[i][6],
      JumlahMurojaah: data[i][7]
    };
    
    if (params.bulan && item.Bulan !== params.bulan) continue;
    if (params.marhalah && item.MarhalahID !== params.marhalah) continue;
    
    murojaah.push(item);
  }
  
  return murojaah;
}

function createMurojaahBulanan(body) {
  const id = generateId();
  const sheet = getSheet('MurojaahBulanan');
  
  sheet.appendRow([
    id,
    body.Bulan,
    body.SantriID,
    body.HalaqahID,
    body.MarhalahID,
    body.Kelas,
    body.MusammiID,
    body.JumlahMurojaah
  ]);
  
  return { MurojaahID: id, ...body };
}

function updateMurojaahBulanan(id, body) {
  const sheet = getSheet('MurojaahBulanan');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      if (body.JumlahMurojaah !== undefined) sheet.getRange(i + 1, 8).setValue(body.JumlahMurojaah);
      return getMurojaahBulananById(id);
    }
  }
  throw new Error('Murojaah not found');
}

function deleteMurojaahBulanan(id) {
  const sheet = getSheet('MurojaahBulanan');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
  throw new Error('Murojaah not found');
}

function getMurojaahBulananById(id) {
  const sheet = getSheet('MurojaahBulanan');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      return {
        MurojaahID: data[i][0],
        Bulan: data[i][1],
        SantriID: data[i][2],
        HalaqahID: data[i][3],
        MarhalahID: data[i][4],
        Kelas: data[i][5],
        MusammiID: data[i][6],
        JumlahMurojaah: data[i][7]
      };
    }
  }
  return null;
}

// ========== BATCH IMPORTS ==========

function batchCreateHafalanBulanan(dataArray) {
  const sheet = getSheet('HafalanBulanan');
  const results = [];
  
  dataArray.forEach(function(body) {
    const jumlah = Number(body.JumlahHafalan);
    if (isNaN(jumlah) || jumlah <= 0) {
      throw new Error('JumlahHafalan must be a positive number');
    }
    
    const id = generateId();
    sheet.appendRow([
      id,
      body.Bulan,
      body.SantriID,
      body.HalaqahID,
      body.MarhalahID,
      body.Kelas,
      body.MusammiID,
      jumlah
    ]);
    results.push({ RekapID: id, ...body });
  });
  
  return results;
}

function batchCreateMurojaahBulanan(dataArray) {
  const sheet = getSheet('MurojaahBulanan');
  const results = [];
  
  dataArray.forEach(function(body) {
    const jumlah = Number(body.JumlahMurojaah);
    if (isNaN(jumlah) || jumlah <= 0) {
      throw new Error('JumlahMurojaah must be a positive number');
    }
    
    const id = generateId();
    sheet.appendRow([
      id,
      body.Bulan,
      body.SantriID,
      body.HalaqahID,
      body.MarhalahID,
      body.Kelas,
      body.MusammiID,
      jumlah
    ]);
    results.push({ MurojaahID: id, ...body });
  });
  
  return results;
}

function batchCreatePenambahanHafalan(dataArray) {
  const sheet = getSheet('PenambahanHafalan');
  const hafalanSheet = getSheet('HafalanBulanan');
  const results = [];
  
  dataArray.forEach(function(body) {
    const jumlah = Number(body.JumlahPenambahan);
    if (isNaN(jumlah) || jumlah <= 0) {
      throw new Error('JumlahPenambahan must be a positive number');
    }
    
    const id = generateId();
    
    // Normalize month format to YYYY-MM
    const normalizedBulan = String(body.Bulan).trim().substring(0, 7);
    
    // Save penambahan
    sheet.appendRow([
      id,
      normalizedBulan,
      body.SantriID,
      body.HalaqahID,
      body.MarhalahID,
      body.Kelas,
      body.MusammiID,
      jumlah,
      body.Catatan || ''
    ]);
    
    // Auto-update HafalanBulanan
    const juzToAdd = jumlah / HALAMAN_PER_JUZ;
    const hafalanData = hafalanSheet.getDataRange().getValues();
    
    let found = false;
    for (let i = 1; i < hafalanData.length; i++) {
      const existingBulan = String(hafalanData[i][1]).trim().substring(0, 7);
      const existingSantri = String(hafalanData[i][2]).trim();
      
      if (existingSantri === String(body.SantriID).trim() && existingBulan === normalizedBulan) {
        // Update existing - ensure numeric addition
        const currentJuz = Number(hafalanData[i][7]) || 0;
        const newJuz = currentJuz + juzToAdd;
        hafalanSheet.getRange(i + 1, 8).setValue(newJuz);
        found = true;
        break;
      }
    }
    
    if (!found) {
      // Create new hafalan record
      const hafalanId = generateId();
      hafalanSheet.appendRow([
        hafalanId,
        normalizedBulan,
        body.SantriID,
        body.HalaqahID,
        body.MarhalahID,
        body.Kelas,
        body.MusammiID,
        juzToAdd
      ]);
    }
    
    results.push({ PenambahanID: id, ...body });
  });
  
  return results;
}

// ========== PENAMBAHAN HAFALAN WITH AUTO UPDATE ==========

function createPenambahanHafalan(body) {
  const id = generateId();
  const sheet = getSheet('PenambahanHafalan');
  
  // Normalize month format to YYYY-MM
  const normalizedBulan = String(body.Bulan).trim().substring(0, 7);
  
  // Save penambahan
  sheet.appendRow([
    id,
    normalizedBulan,
    body.SantriID,
    body.HalaqahID,
    body.MarhalahID,
    body.Kelas,
    body.MusammiID,
    Number(body.JumlahPenambahan),
    body.Catatan || ''
  ]);
  
  // Auto-update HafalanBulanan
  const juzToAdd = Number(body.JumlahPenambahan) / HALAMAN_PER_JUZ;
  const hafalanSheet = getSheet('HafalanBulanan');
  const hafalanData = hafalanSheet.getDataRange().getValues();
  
  let found = false;
  for (let i = 1; i < hafalanData.length; i++) {
    const existingBulan = String(hafalanData[i][1]).trim().substring(0, 7);
    const existingSantri = String(hafalanData[i][2]).trim();
    
    if (existingSantri === String(body.SantriID).trim() && existingBulan === normalizedBulan) {
      // Update existing - ensure numeric addition
      const currentJuz = Number(hafalanData[i][7]) || 0;
      hafalanSheet.getRange(i + 1, 8).setValue(currentJuz + juzToAdd);
      found = true;
      break;
    }
  }
  
  if (!found) {
    // Create new HafalanBulanan entry
    hafalanSheet.appendRow([
      generateId(),
      normalizedBulan,
      body.SantriID,
      body.HalaqahID,
      body.MarhalahID,
      body.Kelas,
      body.MusammiID,
      juzToAdd
    ]);
  }
  
  return { PenambahanID: id, ...body };
}

function getPenambahanHafalan(params) {
  const sheet = getSheet('PenambahanHafalan');
  const data = sheet.getDataRange().getValues();
  let penambahan = [];
  
  for (let i = 1; i < data.length; i++) {
    const item = {
      PenambahanID: data[i][0],
      Bulan: data[i][1],
      SantriID: data[i][2],
      HalaqahID: data[i][3],
      MarhalahID: data[i][4],
      Kelas: data[i][5],
      MusammiID: data[i][6],
      JumlahPenambahan: data[i][7],
      Catatan: data[i][8] || ''
    };
    
    if (params.bulan && item.Bulan !== params.bulan) continue;
    if (params.marhalah && item.MarhalahID !== params.marhalah) continue;
    
    penambahan.push(item);
  }
  
  return penambahan;
}

// ========== TASKS CRUD ==========

function getTasks(params) {
  const sheet = getSheet('Tasks');
  const data = sheet.getDataRange().getValues();
  let tasks = [];
  
  for (let i = 1; i < data.length; i++) {
    const item = {
      TaskID: data[i][0],
      Judul: data[i][1],
      Deskripsi: data[i][2],
      Tanggal: data[i][3],
      WaktuPengingat: data[i][4] || '',
      AssigneeType: data[i][5],
      AssigneeID: data[i][6] || '',
      Status: data[i][7],
      Priority: data[i][8]
    };
    
    if (params.status && item.Status !== params.status) continue;
    tasks.push(item);
  }
  
  return tasks;
}

function createTask(body) {
  const id = generateId();
  const sheet = getSheet('Tasks');
  
  sheet.appendRow([
    id,
    body.Judul,
    body.Deskripsi,
    body.Tanggal,
    body.WaktuPengingat || '',
    body.AssigneeType,
    body.AssigneeID || '',
    body.Status || 'Open',
    body.Priority
  ]);
  
  return { TaskID: id, ...body };
}

function updateTask(id, body) {
  const sheet = getSheet('Tasks');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      if (body.Judul) sheet.getRange(i + 1, 2).setValue(body.Judul);
      if (body.Deskripsi) sheet.getRange(i + 1, 3).setValue(body.Deskripsi);
      if (body.Tanggal) sheet.getRange(i + 1, 4).setValue(body.Tanggal);
      if (body.WaktuPengingat !== undefined) sheet.getRange(i + 1, 5).setValue(body.WaktuPengingat);
      if (body.AssigneeType) sheet.getRange(i + 1, 6).setValue(body.AssigneeType);
      if (body.AssigneeID !== undefined) sheet.getRange(i + 1, 7).setValue(body.AssigneeID);
      if (body.Status) sheet.getRange(i + 1, 8).setValue(body.Status);
      if (body.Priority) sheet.getRange(i + 1, 9).setValue(body.Priority);
      
      return getTaskById(id);
    }
  }
  throw new Error('Task not found');
}

function deleteTask(id) {
  const sheet = getSheet('Tasks');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
  throw new Error('Task not found');
}

function getTaskById(id) {
  const sheet = getSheet('Tasks');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      return {
        TaskID: data[i][0],
        Judul: data[i][1],
        Deskripsi: data[i][2],
        Tanggal: data[i][3],
        WaktuPengingat: data[i][4] || '',
        AssigneeType: data[i][5],
        AssigneeID: data[i][6] || '',
        Status: data[i][7],
        Priority: data[i][8]
      };
    }
  }
  return null;
}

// ========== ABSENSI QUERY ==========

function getAbsensiSantri(params) {
  const sheet = getSheet('AbsensiSantri');
  const data = sheet.getDataRange().getValues().slice(1);
  let absensi = [];
  
  for (let i = 0; i < data.length; i++) {
    const item = {
      AbsensiSantriID: data[i][0],
      Tanggal: data[i][1],
      MarhalahID: data[i][2],
      WaktuID: data[i][3],
      HalaqahID: data[i][4],
      SantriID: data[i][5],
      StatusID: data[i][6],
      Keterangan: data[i][7] || ''
    };
    
    if (params.tanggal && item.Tanggal !== params.tanggal) continue;
    if (params.marhalah && item.MarhalahID !== params.marhalah) continue;
    if (params.waktu && item.WaktuID !== params.waktu) continue;
    
    absensi.push(item);
  }
  
  return absensi;
}

function getAbsensiMusammi(params) {
  const sheet = getSheet('AbsensiMusammi');
  const data = sheet.getDataRange().getValues().slice(1);
  let absensi = [];
  
  for (let i = 0; i < data.length; i++) {
    const item = {
      AbsensiMusammiID: data[i][0],
      Tanggal: data[i][1],
      MarhalahID: data[i][2],
      WaktuID: data[i][3],
      HalaqahID: data[i][4],
      MusammiID: data[i][5],
      StatusID: data[i][6],
      Keterangan: data[i][7] || ''
    };
    
    if (params.tanggal && item.Tanggal !== params.tanggal) continue;
    if (params.marhalah && item.MarhalahID !== params.marhalah) continue;
    if (params.waktu && item.WaktuID !== params.waktu) continue;
    
    absensi.push(item);
  }
  
  return absensi;
}

function getAbsensiReport(params) {
  const santriSheet = getSheet('Santri');
  const musammiSheet = getSheet('Musammi');
  const absensiSantriSheet = getSheet('AbsensiSantri');
  const absensiMusammiSheet = getSheet('AbsensiMusammi');
  
  const santriData = santriSheet.getDataRange().getValues().slice(1);
  const musammiData = musammiSheet.getDataRange().getValues().slice(1);
  
  let reportData = [];
  
  // Get santri attendance if peran is 'santri' or 'all'
  if (!params.peran || params.peran === 'santri' || params.peran === 'all') {
    const absensiData = absensiSantriSheet.getDataRange().getValues().slice(1);
    
    for (let i = 0; i < absensiData.length; i++) {
      const absen = {
        id: absensiData[i][0],
        tanggal: absensiData[i][1],
        marhalahId: absensiData[i][2],
        waktuId: absensiData[i][3],
        halaqahId: absensiData[i][4],
        personId: absensiData[i][5],
        statusId: absensiData[i][6],
        keterangan: absensiData[i][7] || '',
        peran: 'Santri'
      };
      
      // Apply filters
      if (params.tanggalDari && params.tanggalSampai) {
        if (absen.tanggal < params.tanggalDari || absen.tanggal > params.tanggalSampai) continue;
      } else if (params.tanggalDari) {
        if (absen.tanggal < params.tanggalDari) continue;
      } else if (params.tanggalSampai) {
        if (absen.tanggal > params.tanggalSampai) continue;
      }
      if (params.marhalah && absen.marhalahId !== params.marhalah) continue;
      
      // Find santri info
      const santri = santriData.find(s => s[0] === absen.personId);
      if (santri) {
        absen.nama = santri[1];
        absen.kelas = santri[3];
        
        if (params.kelas && absen.kelas !== params.kelas) continue;
        
        reportData.push(absen);
      }
    }
  }
  
  // Get musammi attendance if peran is 'musammi' or 'all'
  if (!params.peran || params.peran === 'musammi' || params.peran === 'all') {
    const absensiData = absensiMusammiSheet.getDataRange().getValues().slice(1);
    
    for (let i = 0; i < absensiData.length; i++) {
      const absen = {
        id: absensiData[i][0],
        tanggal: absensiData[i][1],
        marhalahId: absensiData[i][2],
        waktuId: absensiData[i][3],
        halaqahId: absensiData[i][4],
        personId: absensiData[i][5],
        statusId: absensiData[i][6],
        keterangan: absensiData[i][7] || '',
        peran: 'Musammi'
      };
      
      // Apply filters
      if (params.tanggalDari && params.tanggalSampai) {
        if (absen.tanggal < params.tanggalDari || absen.tanggal > params.tanggalSampai) continue;
      } else if (params.tanggalDari) {
        if (absen.tanggal < params.tanggalDari) continue;
      } else if (params.tanggalSampai) {
        if (absen.tanggal > params.tanggalSampai) continue;
      }
      if (params.marhalah && absen.marhalahId !== params.marhalah) continue;
      
      // Find musammi info
      const musammi = musammiData.find(m => m[0] === absen.personId);
      if (musammi) {
        absen.nama = musammi[1];
        absen.kelas = musammi[3];
        
        if (params.kelas && absen.kelas !== params.kelas) continue;
        
        reportData.push(absen);
      }
    }
  }
  
  // Calculate distribution stats
  const stats = {
    hadir: reportData.filter(a => a.statusId === 'HADIR').length,
    sakit: reportData.filter(a => a.statusId === 'SAKIT').length,
    izin: reportData.filter(a => a.statusId === 'IZIN').length,
    alpa: reportData.filter(a => a.statusId === 'ALPA').length,
    terlambat: reportData.filter(a => a.statusId === 'TERLAMBAT').length
  };
  
  return {
    data: reportData,
    stats: stats,
    total: reportData.length
  };
}

// ========== DASHBOARD STATS ==========

function getDashboardStats() {
  const santriSheet = getSheet('Santri');
  const musammiSheet = getSheet('Musammi');
  const halaqahSheet = getSheet('Halaqah');
  const absensiSantriSheet = getSheet('AbsensiSantri');
  const hafalanSheet = getSheet('HafalanBulanan');
  
  const santriData = santriSheet.getDataRange().getValues().slice(1);
  const musammiData = musammiSheet.getDataRange().getValues().slice(1);
  const halaqahData = halaqahSheet.getDataRange().getValues().slice(1);
  
  // Filter only active santri (column index 4 is Aktif)
  const totalSantri = santriData.filter(s => s[4] === true).length;
  const santriMutawassitoh = santriData.filter(s => s[4] === true && s[2] === 'MUT').length;
  const santriAliyah = santriData.filter(s => s[4] === true && s[2] === 'ALI').length;
  
  const totalMusammi = musammiData.length;
  const musammiAliyah = musammiData.filter(m => m[2] === 'ALI').length;
  const musammiJamii = musammiData.filter(m => m[2] === 'JAM').length;
  
  const musammiHalaqahAliyah = halaqahData.filter(h => h[2] === 'ALI').length;
  const musammiHalaqahMutawassitoh = halaqahData.filter(h => h[2] === 'MUT').length;
  
  // Get today's date in format YYYY-MM-DD
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const absensiData = absensiSantriSheet.getDataRange().getValues().slice(1);
  const todayAbsensi = absensiData.filter(a => a[1] === today);
  
  const absensiHariIni = {
    hadir: todayAbsensi.filter(a => a[6] === 'HADIR').length,
    sakit: todayAbsensi.filter(a => a[6] === 'SAKIT').length,
    izin: todayAbsensi.filter(a => a[6] === 'IZIN').length,
    alpa: todayAbsensi.filter(a => a[6] === 'ALPA').length,
    terlambat: todayAbsensi.filter(a => a[6] === 'TERLAMBAT').length
  };
  
  // Get attendance data for last 7 days
  const absensi7Hari = [];
  const todayDate = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(todayDate);
    date.setDate(todayDate.getDate() - i);
    const dateStr = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const dayAbsensi = absensiData.filter(a => a[1] === dateStr);
    
    absensi7Hari.push({
      tanggal: dateStr,
      hadir: dayAbsensi.filter(a => a[6] === 'HADIR').length,
      sakit: dayAbsensi.filter(a => a[6] === 'SAKIT').length,
      izin: dayAbsensi.filter(a => a[6] === 'IZIN').length,
      alpa: dayAbsensi.filter(a => a[6] === 'ALPA').length,
      terlambat: dayAbsensi.filter(a => a[6] === 'TERLAMBAT').length
    });
  }
  
  // Get hafalan data for last 4 months
  const hafalanData = hafalanSheet.getDataRange().getValues().slice(1);
  const monthlyHafalan = {};
  
  hafalanData.forEach(row => {
    const bulan = row[1]; // Bulan (format: YYYY-MM)
    const marhalah = row[4]; // MarhalahID
    const juz = parseFloat(row[7]); // JumlahHafalan
    
    // Skip if bulan or juz is invalid
    if (!bulan || isNaN(juz)) return;
    
    if (!monthlyHafalan[bulan]) {
      monthlyHafalan[bulan] = { mut: [], ali: [] };
    }
    
    if (marhalah === 'MUT') {
      monthlyHafalan[bulan].mut.push(juz);
    } else if (marhalah === 'ALI') {
      monthlyHafalan[bulan].ali.push(juz);
    }
  });
  
  // Sort months chronologically and get last 4
  const sortedMonths = Object.keys(monthlyHafalan).sort();
  const last4Months = sortedMonths.slice(-4);
  
  const hafalanBulanIni = last4Months.map(bulan => {
    const mutValues = monthlyHafalan[bulan].mut.filter(v => !isNaN(v) && v > 0);
    const aliValues = monthlyHafalan[bulan].ali.filter(v => !isNaN(v) && v > 0);
    
    return {
      bulan: bulan,
      rataMutawassitoh: mutValues.length > 0 
        ? mutValues.reduce((a, b) => a + b, 0) / mutValues.length 
        : 0,
      rataAliyah: aliValues.length > 0 
        ? aliValues.reduce((a, b) => a + b, 0) / aliValues.length 
        : 0
    };
  });
  
  return {
    totalSantri,
    santriMutawassitoh,
    santriAliyah,
    totalMusammi,
    musammiAliyah,
    musammiJamii,
    musammiHalaqahAliyah,
    musammiHalaqahMutawassitoh,
    absensiHariIni,
    absensi7Hari,
    hafalanBulanIni
  };
}

// ========== MAIN REQUEST HANDLER ==========

function doGet(e) {
  try {
    const path = e.parameter.path || '';
    const params = parseQueryParams(e);
    
    // Route handling
    if (path === 'lookups') {
      return jsonResponse(getLookups());
    }
    else if (path === 'halaqah') {
      if (e.parameter.id) {
        const result = getHalaqahById(e.parameter.id);
        return result ? jsonResponse(result) : notFoundResponse('Halaqah not found');
      }
      return jsonResponse(getAllHalaqah(params));
    }
    else if (path === 'musammi') {
      if (e.parameter.id) {
        const result = getMusammiById(e.parameter.id);
        return result ? jsonResponse(result) : notFoundResponse('Musammi not found');
      }
      return jsonResponse(getAllMusammi(params));
    }
    else if (path === 'santri') {
      if (e.parameter.id) {
        const result = getSantriById(e.parameter.id);
        return result ? jsonResponse(result) : notFoundResponse('Santri not found');
      }
      return jsonResponse(getAllSantri(params));
    }
    else if (path === 'halaqah-members') {
      return jsonResponse(getHalaqahMembers(params));
    }
    else if (path === 'absensi/santri') {
      return jsonResponse(getAbsensiSantri(params));
    }
    else if (path === 'absensi/musammi') {
      return jsonResponse(getAbsensiMusammi(params));
    }
    else if (path === 'absensi/report') {
      return jsonResponse(getAbsensiReport(params));
    }
    else if (path === 'hafalan') {
      return jsonResponse(getHafalanBulanan(params));
    }
    else if (path === 'murojaah') {
      return jsonResponse(getMurojaahBulanan(params));
    }
    else if (path === 'penambahan') {
      return jsonResponse(getPenambahanHafalan(params));
    }
    else if (path === 'tasks') {
      return jsonResponse(getTasks(params));
    }
    else if (path === 'dashboard/stats') {
      return jsonResponse(getDashboardStats());
    }
    
    return notFoundResponse('Invalid endpoint');
  } catch (error) {
    // Check if it's a "not found" error (case-insensitive)
    if (error.toString().toLowerCase().includes('not found')) {
      return notFoundResponse(error.toString());
    }
    return errorResponse(error.toString(), 500);
  }
}

function doPost(e) {
  try {
    // Check for method override
    const methodOverride = e.parameter._method || '';
    
    if (methodOverride === 'PUT') {
      return doPut(e);
    }
    else if (methodOverride === 'DELETE') {
      return doDelete(e);
    }
    
    const path = e.parameter.path || '';
    const body = JSON.parse(e.postData.contents);
    
    if (path === 'halaqah') {
      return jsonResponse(createHalaqah(body));
    }
    else if (path === 'musammi') {
      return jsonResponse(createMusammi(body));
    }
    else if (path === 'santri') {
      return jsonResponse(createSantri(body));
    }
    else if (path === 'halaqah-members') {
      return jsonResponse(createHalaqahMember(body));
    }
    else if (path === 'absensi/batch') {
      return jsonResponse(batchCreateAbsensi(body));
    }
    else if (path === 'hafalan') {
      return jsonResponse(createHafalanBulanan(body));
    }
    else if (path === 'murojaah') {
      return jsonResponse(createMurojaahBulanan(body));
    }
    else if (path === 'penambahan') {
      return jsonResponse(createPenambahanHafalan(body));
    }
    else if (path === 'tasks') {
      return jsonResponse(createTask(body));
    }
    
    return notFoundResponse('Invalid endpoint');
  } catch (error) {
    // Check if it's a "not found" error (case-insensitive)
    if (error.toString().toLowerCase().includes('not found')) {
      return notFoundResponse(error.toString());
    }
    return errorResponse(error.toString(), 500);
  }
}

function doPut(e) {
  try {
    const path = e.parameter.path || '';
    const id = e.parameter.id;
    const body = JSON.parse(e.postData.contents);
    
    if (path === 'halaqah') {
      return jsonResponse(updateHalaqah(id, body));
    }
    else if (path === 'musammi') {
      return jsonResponse(updateMusammi(id, body));
    }
    else if (path === 'santri') {
      return jsonResponse(updateSantri(id, body));
    }
    else if (path === 'halaqah-members') {
      const santriId = e.parameter.santriId;
      return jsonResponse(updateHalaqahMember(id, santriId, body));
    }
    else if (path === 'hafalan') {
      return jsonResponse(updateHafalanBulanan(id, body));
    }
    else if (path === 'murojaah') {
      return jsonResponse(updateMurojaahBulanan(id, body));
    }
    else if (path === 'tasks') {
      return jsonResponse(updateTask(id, body));
    }
    
    return notFoundResponse('Invalid endpoint');
  } catch (error) {
    // Check if it's a "not found" error (case-insensitive)
    if (error.toString().toLowerCase().includes('not found')) {
      return notFoundResponse(error.toString());
    }
    return errorResponse(error.toString(), 500);
  }
}

function doDelete(e) {
  try {
    const path = e.parameter.path || '';
    const id = e.parameter.id;
    
    if (path === 'halaqah') {
      deleteHalaqah(id);
      // Return success response for DELETE (Google Apps Script doesn't support 204)
      return successResponse('Halaqah deleted');
    }
    else if (path === 'musammi') {
      deleteMusammi(id);
      return successResponse('Musammi deleted');
    }
    else if (path === 'santri') {
      deleteSantri(id);
      return successResponse('Santri deleted');
    }
    else if (path === 'halaqah-members') {
      const santriId = e.parameter.santriId;
      deleteHalaqahMember(id, santriId);
      return successResponse('Halaqah member deleted');
    }
    else if (path === 'hafalan') {
      deleteHafalanBulanan(id);
      return successResponse('Hafalan deleted');
    }
    else if (path === 'murojaah') {
      deleteMurojaahBulanan(id);
      return successResponse('Murojaah deleted');
    }
    else if (path === 'tasks') {
      deleteTask(id);
      return successResponse('Task deleted');
    }
    
    return notFoundResponse('Invalid endpoint');
  } catch (error) {
    // Check if it's a "not found" error (case-insensitive)
    if (error.toString().toLowerCase().includes('not found')) {
      return notFoundResponse(error.toString());
    }
    return errorResponse(error.toString(), 500);
  }
}
