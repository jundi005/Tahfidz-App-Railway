import { z } from "zod";

// ============= LOOKUPS =============

// Lookups_Marhalah
export const marhalahSchema = z.object({
  MarhalahID: z.enum(["MUT", "ALI", "JAM"]),
  NamaMarhalah: z.string(),
});

export type Marhalah = z.infer<typeof marhalahSchema>;

// Lookups_Waktu
export const waktuSchema = z.object({
  WaktuID: z.enum(["SUBUH", "ASHAR", "ISYA"]),
  NamaWaktu: z.string(),
});

export type Waktu = z.infer<typeof waktuSchema>;

// Lookups_Kehadiran
export const kehadiranSchema = z.object({
  StatusID: z.enum(["HADIR", "SAKIT", "IZIN", "ALPA", "TERLAMBAT"]),
  NamaStatus: z.string(),
});

export type Kehadiran = z.infer<typeof kehadiranSchema>;

// Lookups_Kelas
export const kelasSchema = z.object({
  MarhalahID: z.enum(["MUT", "ALI", "JAM"]),
  Kelas: z.string(),
});

export type Kelas = z.infer<typeof kelasSchema>;

// ============= MASTER DATA =============

// Musammi
export const musammiSchema = z.object({
  MusammiID: z.string(),
  NamaMusammi: z.string(),
  MarhalahID: z.enum(["MUT", "ALI", "JAM"]),
  KelasMusammi: z.string(),
  Catatan: z.string().optional(),
});

export const insertMusammiSchema = musammiSchema.omit({ MusammiID: true });

export type Musammi = z.infer<typeof musammiSchema>;
export type InsertMusammi = z.infer<typeof insertMusammiSchema>;

// Halaqah
export const halaqahSchema = z.object({
  HalaqahID: z.string(),
  NomorUrutHalaqah: z.number(),
  MarhalahID: z.enum(["MUT", "ALI", "JAM"]),
  MusammiID: z.string(),
  KelasMusammi: z.string(),
  NamaHalaqah: z.string().optional(),
});

export const insertHalaqahSchema = halaqahSchema.omit({ HalaqahID: true });

export type Halaqah = z.infer<typeof halaqahSchema>;
export type InsertHalaqah = z.infer<typeof insertHalaqahSchema>;

// Santri
export const santriSchema = z.object({
  SantriID: z.string(),
  NamaSantri: z.string(),
  MarhalahID: z.enum(["MUT", "ALI", "JAM"]),
  Kelas: z.string(),
  Aktif: z.boolean(),
});

export const insertSantriSchema = santriSchema.omit({ SantriID: true });

export type Santri = z.infer<typeof santriSchema>;
export type InsertSantri = z.infer<typeof insertSantriSchema>;

// HalaqahMembers
export const halaqahMembersSchema = z.object({
  HalaqahID: z.string(),
  SantriID: z.string(),
  TanggalMulai: z.string(), // YYYY-MM-DD
  TanggalSelesai: z.string().optional(), // YYYY-MM-DD or empty
});

export type HalaqahMembers = z.infer<typeof halaqahMembersSchema>;
export type InsertHalaqahMembers = z.infer<typeof halaqahMembersSchema>;

// ============= ABSENSI =============

// AbsensiSantri
export const absensiSantriSchema = z.object({
  AbsensiSantriID: z.string(),
  Tanggal: z.string(), // YYYY-MM-DD
  MarhalahID: z.enum(["MUT", "ALI", "JAM"]),
  WaktuID: z.enum(["SUBUH", "ASHAR", "ISYA"]),
  HalaqahID: z.string(),
  SantriID: z.string(),
  StatusID: z.enum(["HADIR", "SAKIT", "IZIN", "ALPA", "TERLAMBAT"]),
  Keterangan: z.string().optional(),
});

export const insertAbsensiSantriSchema = absensiSantriSchema.omit({ AbsensiSantriID: true });

export type AbsensiSantri = z.infer<typeof absensiSantriSchema>;
export type InsertAbsensiSantri = z.infer<typeof insertAbsensiSantriSchema>;

// AbsensiMusammi
export const absensiMusammiSchema = z.object({
  AbsensiMusammiID: z.string(),
  Tanggal: z.string(), // YYYY-MM-DD
  MarhalahID: z.enum(["MUT", "ALI", "JAM"]),
  WaktuID: z.enum(["SUBUH", "ASHAR", "ISYA"]),
  HalaqahID: z.string(),
  MusammiID: z.string(),
  StatusID: z.enum(["HADIR", "SAKIT", "IZIN", "ALPA", "TERLAMBAT"]),
  Keterangan: z.string().optional(),
});

export const insertAbsensiMusammiSchema = absensiMusammiSchema.omit({ AbsensiMusammiID: true });

export type AbsensiMusammi = z.infer<typeof absensiMusammiSchema>;
export type InsertAbsensiMusammi = z.infer<typeof insertAbsensiMusammiSchema>;

// Batch Absensi Request
export const batchAbsensiSchema = z.object({
  tanggal: z.string(),
  marhalahId: z.enum(["MUT", "ALI", "JAM"]),
  waktuId: z.enum(["SUBUH", "ASHAR", "ISYA"]),
  musammi: z.array(z.object({
    halaqahId: z.string(),
    musammiId: z.string(),
    statusId: z.enum(["HADIR", "SAKIT", "IZIN", "ALPA", "TERLAMBAT"]),
    keterangan: z.string().optional(),
  })),
  santri: z.array(z.object({
    halaqahId: z.string(),
    santriId: z.string(),
    statusId: z.enum(["HADIR", "SAKIT", "IZIN", "ALPA", "TERLAMBAT"]),
    keterangan: z.string().optional(),
  })),
});

export type BatchAbsensi = z.infer<typeof batchAbsensiSchema>;

// ============= HAFALAN & MUROJAAH =============

// HafalanBulanan
export const hafalanBulananSchema = z.object({
  RekapID: z.string(),
  Bulan: z.string(), // YYYY-MM
  SantriID: z.string(),
  HalaqahID: z.string(),
  MarhalahID: z.enum(["MUT", "ALI", "JAM"]),
  Kelas: z.string(),
  MusammiID: z.string(),
  JumlahHafalan: z.number(), // dalam Juz (desimal)
});

export const insertHafalanBulananSchema = hafalanBulananSchema.omit({ RekapID: true });

export type HafalanBulanan = z.infer<typeof hafalanBulananSchema>;
export type InsertHafalanBulanan = z.infer<typeof insertHafalanBulananSchema>;

// MurojaahBulanan
export const murojaahBulananSchema = z.object({
  MurojaahID: z.string(),
  Bulan: z.string(), // YYYY-MM
  SantriID: z.string(),
  HalaqahID: z.string(),
  MarhalahID: z.enum(["MUT", "ALI", "JAM"]),
  Kelas: z.string(),
  MusammiID: z.string(),
  JumlahMurojaah: z.number(), // dalam Juz (desimal)
});

export const insertMurojaahBulananSchema = murojaahBulananSchema.omit({ MurojaahID: true });

export type MurojaahBulanan = z.infer<typeof murojaahBulananSchema>;
export type InsertMurojaahBulanan = z.infer<typeof insertMurojaahBulananSchema>;

// PenambahanHafalan
export const penambahanHafalanSchema = z.object({
  PenambahanID: z.string(),
  Bulan: z.string(), // YYYY-MM
  SantriID: z.string(),
  HalaqahID: z.string(),
  MarhalahID: z.enum(["MUT", "ALI", "JAM"]),
  Kelas: z.string(),
  MusammiID: z.string(),
  JumlahPenambahan: z.number(), // dalam Halaman (integer)
  Catatan: z.string().optional(),
});

export const insertPenambahanHafalanSchema = penambahanHafalanSchema.omit({ PenambahanID: true });

export type PenambahanHafalan = z.infer<typeof penambahanHafalanSchema>;
export type InsertPenambahanHafalan = z.infer<typeof insertPenambahanHafalanSchema>;

// ============= TASKS =============

export const tasksSchema = z.object({
  TaskID: z.string(),
  Judul: z.string(),
  Deskripsi: z.string(),
  Tanggal: z.string(), // YYYY-MM-DD
  WaktuPengingat: z.string().optional(), // HH:MM
  AssigneeType: z.enum(["Admin", "Musammi"]),
  AssigneeID: z.string().optional(),
  Status: z.enum(["Open", "Done"]),
  Priority: z.enum(["Low", "Medium", "High"]),
});

export const insertTasksSchema = tasksSchema.omit({ TaskID: true });

export type Tasks = z.infer<typeof tasksSchema>;
export type InsertTasks = z.infer<typeof insertTasksSchema>;

// ============= DASHBOARD STATS =============

export const dashboardStatsSchema = z.object({
  totalSantri: z.number(),
  santriMutawassitoh: z.number(),
  santriAliyah: z.number(),
  totalMusammi: z.number(),
  musammiAliyah: z.number(),
  musammiJamii: z.number(),
  musammiHalaqahAliyah: z.number(),
  musammiHalaqahMutawassitoh: z.number(),
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

// ============= LOOKUPS RESPONSE =============

export const lookupsResponseSchema = z.object({
  marhalah: z.array(marhalahSchema),
  waktu: z.array(waktuSchema),
  kehadiran: z.array(kehadiranSchema),
  kelas: z.array(kelasSchema),
});

export type LookupsResponse = z.infer<typeof lookupsResponseSchema>;
