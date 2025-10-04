# Setup Sheet Tasks di Google Spreadsheet

## Masalah
Error: `500: {"error":"*TypeError: Cannot read properties of null (reading 'appendRow')"}` 

Ini terjadi karena sheet "Tasks" belum ada di Google Spreadsheet Anda.

## Solusi: Tambahkan Sheet Tasks

### Langkah 1: Buat Sheet Baru
1. Buka Google Spreadsheet Anda
2. Klik tanda **+** di bagian bawah untuk menambah sheet baru
3. Rename sheet tersebut menjadi **Tasks** (perhatikan kapitalisasi - harus persis "Tasks")

### Langkah 2: Tambahkan Header Kolom
Di baris pertama sheet "Tasks", tambahkan header kolom berikut (urutan harus sesuai):

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| TaskID | Judul | Deskripsi | Tanggal | WaktuPengingat | AssigneeType | AssigneeID | Status | Priority |

### Langkah 3: Penjelasan Kolom
- **TaskID**: ID unik untuk setiap tugas (string, auto-generated)
- **Judul**: Judul tugas (string, wajib diisi)
- **Deskripsi**: Deskripsi detail tugas (string, optional)
- **Tanggal**: Tanggal tugas format YYYY-MM-DD (contoh: 2025-10-04)
- **WaktuPengingat**: Waktu pengingat format HH:MM (contoh: 15:30, optional)
- **AssigneeType**: Tipe yang ditugaskan - "Admin" atau "Musammi"
- **AssigneeID**: ID dari Musammi jika AssigneeType = "Musammi" (optional)
- **Status**: Status tugas - "Open" atau "Done"
- **Priority**: Prioritas - "Low", "Medium", atau "High"

### Langkah 4: Update Google Apps Script (Code.gs)

Pastikan Google Apps Script Anda memiliki kode untuk handle sheet Tasks. Tambahkan code berikut jika belum ada:

```javascript
// Handle Tasks
if (path === 'tasks') {
  const tasksSheet = ss.getSheetByName('Tasks');
  
  if (!tasksSheet) {
    return ContentService.createTextOutput(JSON.stringify({
      error: 'Sheet "Tasks" tidak ditemukan. Silakan buat sheet dengan nama "Tasks"'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (method === 'GET') {
    const data = tasksSheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const tasks = rows.map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || '';
      });
      return obj;
    }).filter(task => task.TaskID); // Filter empty rows
    
    // Optional: filter by status
    const statusFilter = e.parameter.status;
    if (statusFilter) {
      return ContentService.createTextOutput(JSON.stringify(
        tasks.filter(t => t.Status === statusFilter)
      )).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify(tasks))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (method === 'POST') {
    const taskData = JSON.parse(e.postData.contents);
    const taskId = 'TASK' + new Date().getTime();
    
    tasksSheet.appendRow([
      taskId,
      taskData.Judul || '',
      taskData.Deskripsi || '',
      taskData.Tanggal || '',
      taskData.WaktuPengingat || '',
      taskData.AssigneeType || 'Admin',
      taskData.AssigneeID || '',
      taskData.Status || 'Open',
      taskData.Priority || 'Medium'
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      TaskID: taskId,
      ...taskData
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (method === 'PUT') {
    const id = e.parameter.id;
    const updateData = JSON.parse(e.postData.contents);
    const data = tasksSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        // Update only provided fields
        if (updateData.Judul !== undefined) data[i][1] = updateData.Judul;
        if (updateData.Deskripsi !== undefined) data[i][2] = updateData.Deskripsi;
        if (updateData.Tanggal !== undefined) data[i][3] = updateData.Tanggal;
        if (updateData.WaktuPengingat !== undefined) data[i][4] = updateData.WaktuPengingat;
        if (updateData.AssigneeType !== undefined) data[i][5] = updateData.AssigneeType;
        if (updateData.AssigneeID !== undefined) data[i][6] = updateData.AssigneeID;
        if (updateData.Status !== undefined) data[i][7] = updateData.Status;
        if (updateData.Priority !== undefined) data[i][8] = updateData.Priority;
        
        tasksSheet.getRange(i + 1, 1, 1, 9).setValues([data[i]]);
        
        return ContentService.createTextOutput(JSON.stringify({
          TaskID: data[i][0],
          Judul: data[i][1],
          Deskripsi: data[i][2],
          Tanggal: data[i][3],
          WaktuPengingat: data[i][4],
          AssigneeType: data[i][5],
          AssigneeID: data[i][6],
          Status: data[i][7],
          Priority: data[i][8]
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      error: 'Task not found'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (method === 'DELETE') {
    const id = e.parameter.id;
    const data = tasksSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        tasksSheet.deleteRow(i + 1);
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: 'Task deleted'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      error: 'Task not found'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### Langkah 5: Deploy Ulang Google Apps Script
1. Di Google Apps Script Editor, klik **Deploy** > **Manage deployments**
2. Klik icon **Edit** (pensil) pada deployment yang aktif
3. Ubah **Version** menjadi **New version**
4. Klik **Deploy**
5. Salin URL deployment yang baru (seharusnya sama)

### Langkah 6: Test
1. Kembali ke aplikasi Replit
2. Buka halaman Kalender & Tugas
3. Coba tambahkan tugas baru
4. Pastikan tidak ada error lagi

## Checklist
- [ ] Sheet "Tasks" sudah dibuat di Google Spreadsheet
- [ ] Header kolom sudah ditambahkan di baris pertama
- [ ] Google Apps Script sudah di-update dengan kode untuk handle Tasks
- [ ] Google Apps Script sudah di-deploy ulang sebagai **New version**
- [ ] Aplikasi sudah di-test dan bisa menambahkan tugas

## Troubleshooting

### Jika masih error setelah setup:
1. **Cek nama sheet**: Pastikan persis "Tasks" (bukan "tasks" atau "TASKS")
2. **Cek header**: Pastikan header di baris 1 sesuai urutan yang benar
3. **Cek deployment**: Pastikan sudah deploy sebagai **New version** (bukan edit version lama)
4. **Cek URL**: Pastikan `GOOGLE_APPS_SCRIPT_URL` di environment variable benar
5. **Refresh browser**: Clear cache browser dan reload aplikasi

### Cara mengecek log error di Google Apps Script:
1. Buka Google Apps Script Editor
2. Klik **Executions** di sidebar kiri
3. Lihat error log untuk detail error yang terjadi
